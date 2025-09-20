/**
 * PPTX Smart Cache System
 * Sistema de cache inteligente multi-camadas para otimização de performance
 */

export interface CacheItem<T = any> {
  key: string;
  data: T;
  metadata: {
    size: number;
    created: number;
    accessed: number;
    accessCount: number;
    ttl?: number;
    tags: string[];
    version: string;
  };
  compressed?: boolean;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  layerStats: {
    memory: { items: number; size: number; hits: number; misses: number };
    localStorage: { items: number; size: number; hits: number; misses: number };
    indexedDB: { items: number; size: number; hits: number; misses: number };
  };
}

export interface CacheConfig {
  memory: {
    maxItems: number;
    maxSize: number; // bytes
    ttl: number; // ms
  };
  localStorage: {
    maxItems: number;
    maxSize: number; // bytes
    keyPrefix: string;
    ttl: number; // ms
  };
  indexedDB: {
    dbName: string;
    storeName: string;
    version: number;
    maxItems: number;
    maxSize: number; // bytes
    ttl: number; // ms
  };
  compression: {
    enabled: boolean;
    threshold: number; // bytes - compress items larger than this
    level: number; // 1-9
  };
  eviction: {
    strategy: 'lru' | 'lfu' | 'ttl';
    checkInterval: number; // ms
  };
}

/**
 * Cache Layer abstrato
 */
abstract class CacheLayer<T = any> {
  protected stats = { items: 0, size: 0, hits: 0, misses: 0 };

  abstract get(key: string): Promise<CacheItem<T> | null>;
  abstract set(key: string, item: CacheItem<T>): Promise<boolean>;
  abstract delete(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract keys(): Promise<string[]>;
  abstract size(): Promise<number>;

  getStats() {
    return { ...this.stats };
  }

  protected recordHit() {
    this.stats.hits++;
  }

  protected recordMiss() {
    this.stats.misses++;
  }
}

/**
 * Cache em Memória (L1)
 */
class MemoryCache<T = any> extends CacheLayer<T> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(private config: CacheConfig['memory']) {
    super();
  }

  async get(key: string): Promise<CacheItem<T> | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.recordMiss();
      return null;
    }

    // Verificar TTL
    if (item.metadata.ttl && Date.now() > item.metadata.created + item.metadata.ttl) {
      await this.delete(key);
      this.recordMiss();
      return null;
    }

    // Atualizar estatísticas de acesso
    item.metadata.accessed = Date.now();
    item.metadata.accessCount++;
    this.accessOrder.set(key, ++this.accessCounter);

    this.recordHit();
    return item;
  }

  async set(key: string, item: CacheItem<T>): Promise<boolean> {
    try {
      // Verificar limites antes de adicionar
      if (this.cache.size >= this.config.maxItems) {
        await this.evictItems(1);
      }

      // Estimar tamanho do item
      const itemSize = this.estimateSize(item);
      if (this.stats.size + itemSize > this.config.maxSize) {
        await this.evictItems(Math.ceil((this.stats.size + itemSize - this.config.maxSize) / (itemSize || 1000)));
      }

      this.cache.set(key, item);
      this.accessOrder.set(key, ++this.accessCounter);
      
      this.stats.items = this.cache.size;
      this.stats.size += itemSize;

      return true;
    } catch (error) {
      console.error('Erro ao armazenar no cache de memória:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.items = this.cache.size;
      this.stats.size -= this.estimateSize(item);
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats = { items: 0, size: 0, hits: 0, misses: 0 };
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  private async evictItems(count: number): Promise<void> {
    const sortedKeys = Array.from(this.accessOrder.entries())
      .sort(([, a], [, b]) => a - b) // LRU: menos recentemente usado primeiro
      .slice(0, count)
      .map(([key]) => key);

    for (const key of sortedKeys) {
      await this.delete(key);
    }
  }

  private estimateSize(item: CacheItem<T>): number {
    try {
      return new Blob([JSON.stringify(item)]).size;
    } catch {
      return 1000; // Estimativa conservadora
    }
  }
}

/**
 * Cache no localStorage (L2)
 */
class LocalStorageCache<T = any> extends CacheLayer<T> {
  constructor(private config: CacheConfig['localStorage']) {
    super();
    this.initialize();
  }

  private initialize(): void {
    // Limpar itens expirados na inicialização
    this.cleanExpiredItems().catch(console.error);
  }

  async get(key: string): Promise<CacheItem<T> | null> {
    try {
      const fullKey = this.getFullKey(key);
      const data = localStorage.getItem(fullKey);
      
      if (!data) {
        this.recordMiss();
        return null;
      }

      const item: CacheItem<T> = JSON.parse(data);

      // Verificar TTL
      if (item.metadata.ttl && Date.now() > item.metadata.created + item.metadata.ttl) {
        await this.delete(key);
        this.recordMiss();
        return null;
      }

      // Atualizar acesso
      item.metadata.accessed = Date.now();
      item.metadata.accessCount++;
      localStorage.setItem(fullKey, JSON.stringify(item));

      this.recordHit();
      return item;

    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      this.recordMiss();
      return null;
    }
  }

  async set(key: string, item: CacheItem<T>): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const itemSize = this.estimateSize(item);

      // Verificar espaço disponível
      if (await this.getUsedSpace() + itemSize > this.config.maxSize) {
        await this.evictItems(itemSize);
      }

      localStorage.setItem(fullKey, JSON.stringify(item));
      this.stats.items++;
      this.stats.size += itemSize;

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, tentando limpar espaço...');
        await this.evictItems(this.estimateSize(item));
        
        try {
          localStorage.setItem(this.getFullKey(key), JSON.stringify(item));
          return true;
        } catch {
          return false;
        }
      }
      
      console.error('Erro ao armazenar no localStorage:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const data = localStorage.getItem(fullKey);
      
      if (data) {
        localStorage.removeItem(fullKey);
        this.stats.items--;
        this.stats.size -= new Blob([data]).size;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar do localStorage:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      for (const key of keys) {
        localStorage.removeItem(this.getFullKey(key));
      }
      this.stats = { items: 0, size: 0, hits: 0, misses: 0 };
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = this.config.keyPrefix;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }
    
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private async getUsedSpace(): Promise<number> {
    let totalSize = 0;
    const keys = await this.keys();
    
    for (const key of keys) {
      const data = localStorage.getItem(this.getFullKey(key));
      if (data) {
        totalSize += new Blob([data]).size;
      }
    }
    
    return totalSize;
  }

  private async evictItems(requiredSpace: number): Promise<void> {
    const keys = await this.keys();
    const items: Array<{ key: string; item: CacheItem<T> }> = [];

    // Coletar itens com metadados
    for (const key of keys) {
      try {
        const data = localStorage.getItem(this.getFullKey(key));
        if (data) {
          const item = JSON.parse(data);
          items.push({ key, item });
        }
      } catch (error) {
        // Item corrompido, remover
        localStorage.removeItem(this.getFullKey(key));
      }
    }

    // Ordenar por LRU
    items.sort((a, b) => a.item.metadata.accessed - b.item.metadata.accessed);

    let freedSpace = 0;
    for (const { key } of items) {
      if (freedSpace >= requiredSpace) break;
      
      const data = localStorage.getItem(this.getFullKey(key));
      if (data) {
        freedSpace += new Blob([data]).size;
        await this.delete(key);
      }
    }
  }

  private async cleanExpiredItems(): Promise<void> {
    const keys = await this.keys();
    const now = Date.now();

    for (const key of keys) {
      try {
        const data = localStorage.getItem(this.getFullKey(key));
        if (data) {
          const item = JSON.parse(data);
          if (item.metadata.ttl && now > item.metadata.created + item.metadata.ttl) {
            await this.delete(key);
          }
        }
      } catch (error) {
        // Item corrompido, remover
        localStorage.removeItem(this.getFullKey(key));
      }
    }
  }

  private estimateSize(item: CacheItem<T>): number {
    try {
      return new Blob([JSON.stringify(item)]).size;
    } catch {
      return 1000;
    }
  }
}

/**
 * Cache no IndexedDB (L3)
 */
class IndexedDBCache<T = any> extends CacheLayer<T> {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private config: CacheConfig['indexedDB']) {
    super();
  }

  private async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'key' });
          store.createIndex('created', 'metadata.created');
          store.createIndex('accessed', 'metadata.accessed');
          store.createIndex('tags', 'metadata.tags', { multiEntry: true });
        }
      };
    });

    return this.initPromise;
  }

  async get(key: string): Promise<CacheItem<T> | null> {
    try {
      await this.initialize();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const item = request.result;
          
          if (!item) {
            this.recordMiss();
            resolve(null);
            return;
          }

          // Verificar TTL
          if (item.metadata.ttl && Date.now() > item.metadata.created + item.metadata.ttl) {
            this.delete(key);
            this.recordMiss();
            resolve(null);
            return;
          }

          // Atualizar acesso
          item.metadata.accessed = Date.now();
          item.metadata.accessCount++;
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => {
            this.recordHit();
            resolve(item);
          };
          updateRequest.onerror = () => {
            this.recordHit(); // Ainda conseguimos ler
            resolve(item);
          };
        };
      });

    } catch (error) {
      console.error('Erro ao ler do IndexedDB:', error);
      this.recordMiss();
      return null;
    }
  }

  async set(key: string, item: CacheItem<T>): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      const itemWithKey = { ...item, key };
      const request = store.put(itemWithKey);

      return new Promise((resolve) => {
        request.onerror = () => {
          console.error('Erro ao armazenar no IndexedDB:', request.error);
          resolve(false);
        };
        request.onsuccess = () => {
          this.stats.items++;
          this.stats.size += this.estimateSize(item);
          resolve(true);
        };
      });

    } catch (error) {
      console.error('Erro ao armazenar no IndexedDB:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(key);

      return new Promise((resolve) => {
        request.onerror = () => resolve(false);
        request.onsuccess = () => {
          this.stats.items--;
          resolve(true);
        };
      });

    } catch (error) {
      console.error('Erro ao deletar do IndexedDB:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.initialize();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.stats = { items: 0, size: 0, hits: 0, misses: 0 };
          resolve();
        };
      });

    } catch (error) {
      console.error('Erro ao limpar IndexedDB:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      await this.initialize();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAllKeys();

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as string[]);
      });

    } catch (error) {
      console.error('Erro ao obter chaves do IndexedDB:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      await this.initialize();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.count();

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

    } catch (error) {
      console.error('Erro ao contar itens do IndexedDB:', error);
      return 0;
    }
  }

  private estimateSize(item: CacheItem<T>): number {
    try {
      return new Blob([JSON.stringify(item)]).size;
    } catch {
      return 1000;
    }
  }
}

/**
 * Cache Manager Principal - Coordena as 3 camadas
 */
export class PPTXSmartCache {
  private static instance: PPTXSmartCache;
  private memoryCache: MemoryCache;
  private localStorageCache: LocalStorageCache;
  private indexedDBCache: IndexedDBCache;
  private config: CacheConfig;
  private compressionWorker: Worker | null = null;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memory: {
        maxItems: 100,
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 30 * 60 * 1000 // 30 minutos
      },
      localStorage: {
        maxItems: 500,
        maxSize: 100 * 1024 * 1024, // 100MB
        keyPrefix: 'pptx_cache_',
        ttl: 24 * 60 * 60 * 1000 // 24 horas
      },
      indexedDB: {
        dbName: 'PPTXCache',
        storeName: 'cache_items',
        version: 1,
        maxItems: 1000,
        maxSize: 500 * 1024 * 1024, // 500MB
        ttl: 7 * 24 * 60 * 60 * 1000 // 7 dias
      },
      compression: {
        enabled: true,
        threshold: 10 * 1024, // 10KB
        level: 6
      },
      eviction: {
        strategy: 'lru',
        checkInterval: 5 * 60 * 1000 // 5 minutos
      },
      ...config
    };

    this.memoryCache = new MemoryCache(this.config.memory);
    this.localStorageCache = new LocalStorageCache(this.config.localStorage);
    this.indexedDBCache = new IndexedDBCache(this.config.indexedDB);

    this.startEvictionScheduler();
  }

  static getInstance(config?: Partial<CacheConfig>): PPTXSmartCache {
    if (!PPTXSmartCache.instance) {
      PPTXSmartCache.instance = new PPTXSmartCache(config);
    }
    return PPTXSmartCache.instance;
  }

  /**
   * Obter item do cache (verifica todas as camadas)
   */
  async get<T = any>(key: string): Promise<T | null> {
    // L1: Memory Cache
    let item = await this.memoryCache.get(key);
    if (item) {
      return item.data;
    }

    // L2: localStorage
    item = await this.localStorageCache.get(key);
    if (item) {
      // Promover para memory cache
      await this.memoryCache.set(key, item);
      return item.data;
    }

    // L3: IndexedDB
    item = await this.indexedDBCache.get(key);
    if (item) {
      // Promover para camadas superiores
      await this.localStorageCache.set(key, item);
      await this.memoryCache.set(key, item);
      return item.data;
    }

    return null;
  }

  /**
   * Armazenar item no cache
   */
  async set<T = any>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      version?: string;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<boolean> {
    const now = Date.now();
    const dataSize = this.estimateSize(data);
    
    const item: CacheItem<T> = {
      key,
      data,
      metadata: {
        size: dataSize,
        created: now,
        accessed: now,
        accessCount: 1,
        ttl: options.ttl,
        tags: options.tags || [],
        version: options.version || '1.0'
      },
      compressed: false
    };

    // Comprimir se necessário
    if (this.config.compression.enabled && dataSize > this.config.compression.threshold) {
      item.data = await this.compress(data);
      item.compressed = true;
    }

    const priority = options.priority || 'medium';
    
    // Armazenar em todas as camadas baseado na prioridade
    const promises: Promise<boolean>[] = [];

    if (priority === 'high') {
      // Alta prioridade: todas as camadas
      promises.push(
        this.memoryCache.set(key, item),
        this.localStorageCache.set(key, item),
        this.indexedDBCache.set(key, item)
      );
    } else if (priority === 'medium') {
      // Média prioridade: localStorage + IndexedDB
      promises.push(
        this.localStorageCache.set(key, item),
        this.indexedDBCache.set(key, item)
      );
    } else {
      // Baixa prioridade: apenas IndexedDB
      promises.push(this.indexedDBCache.set(key, item));
    }

    const results = await Promise.all(promises);
    return results.some(result => result);
  }

  /**
   * Deletar item do cache
   */
  async delete(key: string): Promise<boolean> {
    const promises = [
      this.memoryCache.delete(key),
      this.localStorageCache.delete(key),
      this.indexedDBCache.delete(key)
    ];

    const results = await Promise.all(promises);
    return results.some(result => result);
  }

  /**
   * Limpar cache por tags
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;
    
    // Verificar todas as camadas
    const allKeys = new Set([
      ...(await this.memoryCache.keys()),
      ...(await this.localStorageCache.keys()),
      ...(await this.indexedDBCache.keys())
    ]);

    for (const key of allKeys) {
      const item = await this.get(key);
      if (item && Array.isArray(item.metadata?.tags)) {
        const hasMatchingTag = tags.some(tag => item.metadata.tags.includes(tag));
        if (hasMatchingTag) {
          await this.delete(key);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<void> {
    await Promise.all([
      this.memoryCache.clear(),
      this.localStorageCache.clear(),
      this.indexedDBCache.clear()
    ]);
  }

  /**
   * Obter estatísticas do cache
   */
  async getStats(): Promise<CacheStats> {
    const memoryStats = this.memoryCache.getStats();
    const localStorageStats = this.localStorageCache.getStats();
    const indexedDBStats = this.indexedDBCache.getStats();

    const totalHits = memoryStats.hits + localStorageStats.hits + indexedDBStats.hits;
    const totalMisses = memoryStats.misses + localStorageStats.misses + indexedDBStats.misses;
    const totalRequests = totalHits + totalMisses;

    return {
      totalItems: memoryStats.items + localStorageStats.items + indexedDBStats.items,
      totalSize: memoryStats.size + localStorageStats.size + indexedDBStats.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
      layerStats: {
        memory: memoryStats,
        localStorage: localStorageStats,
        indexedDB: indexedDBStats
      }
    };
  }

  /**
   * Pré-carregar dados críticos
   */
  async preload(keys: string[]): Promise<void> {
    const promises = keys.map(async (key) => {
      // Tentar promover de camadas inferiores para superiores
      const item = await this.indexedDBCache.get(key);
      if (item) {
        await this.localStorageCache.set(key, item);
        await this.memoryCache.set(key, item);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Comprimir dados
   */
  private async compress<T>(data: T): Promise<T> {
    // Implementação simplificada - em produção usaria bibliotecas como pako
    try {
      const jsonString = JSON.stringify(data);
      // Simular compressão (na prática usaria algoritmos reais)
      return data; // Por enquanto retorna os dados originais
    } catch (error) {
      console.warn('Erro na compressão, retornando dados originais:', error);
      return data;
    }
  }

  /**
   * Descomprimir dados
   */
  private async decompress<T>(data: T): Promise<T> {
    // Implementação simplificada
    return data;
  }

  /**
   * Estimar tamanho dos dados
   */
  private estimateSize<T>(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1000; // Estimativa conservadora
    }
  }

  /**
   * Scheduler para limpeza automática
   */
  private startEvictionScheduler(): void {
    setInterval(async () => {
      try {
        await this.cleanExpiredItems();
      } catch (error) {
        console.error('Erro na limpeza automática do cache:', error);
      }
    }, this.config.eviction.checkInterval);
  }

  /**
   * Limpar itens expirados
   */
  private async cleanExpiredItems(): Promise<void> {
    const now = Date.now();
    const allKeys = new Set([
      ...(await this.memoryCache.keys()),
      ...(await this.localStorageCache.keys()),
      ...(await this.indexedDBCache.keys())
    ]);

    for (const key of allKeys) {
      // Verificar cada camada para itens expirados
      const promises = [
        this.checkAndDeleteExpired(this.memoryCache, key, now),
        this.checkAndDeleteExpired(this.localStorageCache, key, now),
        this.checkAndDeleteExpired(this.indexedDBCache, key, now)
      ];

      await Promise.all(promises);
    }
  }

  /**
   * Verificar e deletar item expirado
   */
  private async checkAndDeleteExpired(
    cache: CacheLayer,
    key: string,
    now: number
  ): Promise<void> {
    try {
      const item = await cache.get(key);
      if (item && item.metadata.ttl && now > item.metadata.created + item.metadata.ttl) {
        await cache.delete(key);
      }
    } catch (error) {
      console.error(`Erro ao verificar expiração do item ${key}:`, error);
    }
  }
}

// Export singleton instance
export const pptxSmartCache = PPTXSmartCache.getInstance();

// Helper functions
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}_${parts.join('_')}`;
}

export function hashContent(content: any): string {
  // Implementação simplificada de hash
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}