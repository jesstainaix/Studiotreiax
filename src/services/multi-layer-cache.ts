// Sistema de cache inteligente multi-camadas para otimização de performance
import { PPTXSlide } from './PPTXAnalysisSystem';
import { ValidationReport } from './slide-data-validator';
import { CorrectionResult } from './auto-correction.service';

// Interfaces para cache
interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live em ms
  accessCount: number;
  lastAccessed: number;
  size: number; // Tamanho em bytes
  metadata?: Record<string, any>;
}

interface CacheConfig {
  memoryMaxSize: number; // Tamanho máximo em bytes
  memoryMaxEntries: number;
  localStorageMaxSize: number;
  indexedDBMaxSize: number;
  defaultTTL: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  evictionPolicy: EvictionPolicy;
  syncInterval: number;
}

interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  localStorageHits: number;
  localStorageMisses: number;
  indexedDBHits: number;
  indexedDBMisses: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
  evictions: number;
}

interface CacheLayer {
  name: string;
  priority: number;
  maxSize: number;
  currentSize: number;
  entryCount: number;
  hitRate: number;
}

type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl';
type CacheKey = string;
type CacheData = PPTXSlide | ValidationReport | CorrectionResult | any;

// Camada de cache em memória
class MemoryCache {
  private cache: Map<CacheKey, CacheEntry>;
  private maxSize: number;
  private maxEntries: number;
  private currentSize: number = 0;
  private evictionPolicy: EvictionPolicy;

  constructor(maxSize: number, maxEntries: number, evictionPolicy: EvictionPolicy = 'lru') {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
    this.evictionPolicy = evictionPolicy;
  }

  // Obter item do cache
  public get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar TTL
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  // Armazenar item no cache
  public set<T>(key: CacheKey, data: T, ttl: number = 3600000): boolean {
    const size = this.calculateSize(data);
    
    // Verificar se cabe no cache
    if (size > this.maxSize) {
      return false;
    }

    // Remover entrada existente se houver
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.currentSize -= existingEntry.size;
    }

    // Fazer espaço se necessário
    while ((this.currentSize + size > this.maxSize) || 
           (this.cache.size >= this.maxEntries)) {
      if (!this.evictEntry()) {
        return false;
      }
    }

    // Criar nova entrada
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size
    };

    this.cache.set(key, entry);
    this.currentSize += size;

    return true;
  }

  // Remover item do cache
  public delete(key: CacheKey): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return true;
    }
    return false;
  }

  // Limpar cache
  public clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  // Remover entrada baseado na política de evicção
  private evictEntry(): boolean {
    if (this.cache.size === 0) {
      return false;
    }

    let keyToEvict: CacheKey | null = null;

    switch (this.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;
      case 'fifo':
        keyToEvict = this.findFIFOKey();
        break;
      case 'ttl':
        keyToEvict = this.findExpiredKey();
        break;
    }

    if (keyToEvict) {
      return this.delete(keyToEvict);
    }

    return false;
  }

  // Encontrar chave LRU (Least Recently Used)
  private findLRUKey(): CacheKey | null {
    let oldestKey: CacheKey | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Encontrar chave LFU (Least Frequently Used)
  private findLFUKey(): CacheKey | null {
    let leastUsedKey: CacheKey | null = null;
    let leastCount = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  // Encontrar chave FIFO (First In, First Out)
  private findFIFOKey(): CacheKey | null {
    let oldestKey: CacheKey | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Encontrar chave expirada
  private findExpiredKey(): CacheKey | null {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now > entry.timestamp + entry.ttl) {
        return key;
      }
    }

    return null;
  }

  // Calcular tamanho do objeto
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Estimativa
    }
  }

  // Obter estatísticas
  public getStats(): { size: number; entries: number; hitRate: number } {
    return {
      size: this.currentSize,
      entries: this.cache.size,
      hitRate: 0 // Calculado externamente
    };
  }

  // Verificar se tem espaço
  public hasSpace(size: number): boolean {
    return (this.currentSize + size <= this.maxSize) && 
           (this.cache.size < this.maxEntries);
  }
}

// Camada de cache LocalStorage
class LocalStorageCache {
  private prefix: string = 'pptx_cache_';
  private maxSize: number;
  private compressionEnabled: boolean;

  constructor(maxSize: number, compressionEnabled: boolean = false) {
    this.maxSize = maxSize;
    this.compressionEnabled = compressionEnabled;
  }

  // Obter item do cache
  public get<T>(key: CacheKey): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verificar TTL
      if (Date.now() > entry.timestamp + entry.ttl) {
        this.delete(key);
        return null;
      }

      // Atualizar último acesso
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));

      return entry.data;
    } catch (error) {
      console.warn('[LocalStorageCache] Erro ao recuperar item:', error);
      return null;
    }
  }

  // Armazenar item no cache
  public set<T>(key: CacheKey, data: T, ttl: number = 3600000): boolean {
    try {
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(data)
      };

      const serialized = JSON.stringify(entry);
      
      // Verificar se cabe no localStorage
      if (serialized.length > this.maxSize) {
        return false;
      }

      // Fazer espaço se necessário
      while (!this.hasSpace(serialized.length)) {
        if (!this.evictOldestEntry()) {
          return false;
        }
      }

      localStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (error) {
      console.warn('[LocalStorageCache] Erro ao armazenar item:', error);
      return false;
    }
  }

  // Remover item do cache
  public delete(key: CacheKey): boolean {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.warn('[LocalStorageCache] Erro ao remover item:', error);
      return false;
    }
  }

  // Limpar cache
  public clear(): void {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));
      
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[LocalStorageCache] Erro ao limpar cache:', error);
    }
  }

  // Verificar se tem espaço
  private hasSpace(size: number): boolean {
    try {
      const currentSize = this.getCurrentSize();
      return currentSize + size <= this.maxSize;
    } catch {
      return false;
    }
  }

  // Obter tamanho atual
  private getCurrentSize(): number {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));
      
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });
      
      return totalSize;
    } catch {
      return 0;
    }
  }

  // Remover entrada mais antiga
  private evictOldestEntry(): boolean {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));
      
      if (keys.length === 0) {
        return false;
      }

      let oldestKey = keys[0];
      let oldestTime = Date.now();

      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const entry = JSON.parse(item);
            if (entry.timestamp < oldestTime) {
              oldestTime = entry.timestamp;
              oldestKey = key;
            }
          } catch {
            // Item corrompido, remover
            oldestKey = key;
          }
        }
      });

      localStorage.removeItem(oldestKey);
      return true;
    } catch {
      return false;
    }
  }

  // Calcular tamanho
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// Camada de cache IndexedDB
class IndexedDBCache {
  private dbName: string = 'PPTXCacheDB';
  private storeName: string = 'cache';
  private version: number = 1;
  private db: IDBDatabase | null = null;
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.initDB();
  }

  // Inicializar banco de dados
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  // Obter item do cache
  public async get<T>(key: CacheKey): Promise<T | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T>;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Verificar TTL
        if (Date.now() > entry.timestamp + entry.ttl) {
          store.delete(key);
          resolve(null);
          return;
        }

        // Atualizar estatísticas
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        store.put(entry);

        resolve(entry.data);
      };
    });
  }

  // Armazenar item no cache
  public async set<T>(key: CacheKey, data: T, ttl: number = 3600000): Promise<boolean> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }

      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(data)
      };

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);
      
      request.onerror = () => resolve(false);
      request.onsuccess = () => resolve(true);
    });
  }

  // Remover item do cache
  public async delete(key: CacheKey): Promise<boolean> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => resolve(false);
      request.onsuccess = () => resolve(true);
    });
  }

  // Limpar cache
  public async clear(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  // Calcular tamanho
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// Sistema principal de cache multi-camadas
export class MultiLayerCache {
  private memoryCache: MemoryCache;
  private localStorageCache: LocalStorageCache;
  private indexedDBCache: IndexedDBCache;
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memoryMaxSize: 50 * 1024 * 1024, // 50MB
      memoryMaxEntries: 1000,
      localStorageMaxSize: 10 * 1024 * 1024, // 10MB
      indexedDBMaxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 3600000, // 1 hora
      compressionEnabled: false,
      encryptionEnabled: false,
      evictionPolicy: 'lru',
      syncInterval: 300000, // 5 minutos
      ...config
    };

    this.memoryCache = new MemoryCache(
      this.config.memoryMaxSize,
      this.config.memoryMaxEntries,
      this.config.evictionPolicy
    );
    
    this.localStorageCache = new LocalStorageCache(
      this.config.localStorageMaxSize,
      this.config.compressionEnabled
    );
    
    this.indexedDBCache = new IndexedDBCache(
      this.config.indexedDBMaxSize
    );

    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      localStorageHits: 0,
      localStorageMisses: 0,
      indexedDBHits: 0,
      indexedDBMisses: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      evictions: 0
    };

    // Iniciar sincronização periódica
    this.startSyncInterval();
  }

  // Obter item do cache (verifica todas as camadas)
  public async get<T>(key: CacheKey): Promise<T | null> {
    // Tentar memória primeiro
    let data = this.memoryCache.get<T>(key);
    if (data !== null) {
      this.stats.memoryHits++;
      return data;
    }
    this.stats.memoryMisses++;

    // Tentar localStorage
    data = this.localStorageCache.get<T>(key);
    if (data !== null) {
      this.stats.localStorageHits++;
      // Promover para memória
      this.memoryCache.set(key, data, this.config.defaultTTL);
      return data;
    }
    this.stats.localStorageMisses++;

    // Tentar IndexedDB
    data = await this.indexedDBCache.get<T>(key);
    if (data !== null) {
      this.stats.indexedDBHits++;
      // Promover para camadas superiores
      this.memoryCache.set(key, data, this.config.defaultTTL);
      this.localStorageCache.set(key, data, this.config.defaultTTL);
      return data;
    }
    this.stats.indexedDBMisses++;

    return null;
  }

  // Armazenar item no cache (em todas as camadas apropriadas)
  public async set<T>(key: CacheKey, data: T, ttl?: number): Promise<boolean> {
    const actualTTL = ttl || this.config.defaultTTL;
    let success = false;

    // Armazenar na memória
    if (this.memoryCache.set(key, data, actualTTL)) {
      success = true;
    }

    // Armazenar no localStorage para dados menores
    const size = this.calculateSize(data);
    if (size < 1024 * 1024) { // < 1MB
      this.localStorageCache.set(key, data, actualTTL);
    }

    // Armazenar no IndexedDB para persistência
    await this.indexedDBCache.set(key, data, actualTTL);

    return success;
  }

  // Remover item de todas as camadas
  public async delete(key: CacheKey): Promise<boolean> {
    const results = await Promise.all([
      Promise.resolve(this.memoryCache.delete(key)),
      Promise.resolve(this.localStorageCache.delete(key)),
      this.indexedDBCache.delete(key)
    ]);

    return results.some(result => result);
  }

  // Limpar todas as camadas
  public async clear(): Promise<void> {
    await Promise.all([
      Promise.resolve(this.memoryCache.clear()),
      Promise.resolve(this.localStorageCache.clear()),
      this.indexedDBCache.clear()
    ]);

    this.resetStats();
  }

  // Obter estatísticas
  public getStats(): CacheStats {
    const totalRequests = this.stats.memoryHits + this.stats.memoryMisses +
                         this.stats.localStorageHits + this.stats.localStorageMisses +
                         this.stats.indexedDBHits + this.stats.indexedDBMisses;
    
    const totalHits = this.stats.memoryHits + this.stats.localStorageHits + this.stats.indexedDBHits;
    
    this.stats.hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    
    return { ...this.stats };
  }

  // Obter informações das camadas
  public getCacheLayerInfo(): CacheLayer[] {
    const memoryStats = this.memoryCache.getStats();
    
    return [
      {
        name: 'Memory',
        priority: 1,
        maxSize: this.config.memoryMaxSize,
        currentSize: memoryStats.size,
        entryCount: memoryStats.entries,
        hitRate: this.stats.memoryHits / (this.stats.memoryHits + this.stats.memoryMisses || 1)
      },
      {
        name: 'LocalStorage',
        priority: 2,
        maxSize: this.config.localStorageMaxSize,
        currentSize: 0, // Calculado dinamicamente
        entryCount: 0, // Calculado dinamicamente
        hitRate: this.stats.localStorageHits / (this.stats.localStorageHits + this.stats.localStorageMisses || 1)
      },
      {
        name: 'IndexedDB',
        priority: 3,
        maxSize: this.config.indexedDBMaxSize,
        currentSize: 0, // Calculado dinamicamente
        entryCount: 0, // Calculado dinamicamente
        hitRate: this.stats.indexedDBHits / (this.stats.indexedDBHits + this.stats.indexedDBMisses || 1)
      }
    ];
  }

  // Iniciar sincronização periódica
  private startSyncInterval(): void {
    setInterval(() => {
      this.syncCacheLayers();
    }, this.config.syncInterval);
  }

  // Sincronizar camadas de cache
  private async syncCacheLayers(): Promise<void> {
    // Implementar lógica de sincronização se necessário
    // Por exemplo, promover itens frequentemente acessados
  }

  // Calcular tamanho
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  // Resetar estatísticas
  private resetStats(): void {
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      localStorageHits: 0,
      localStorageMisses: 0,
      indexedDBHits: 0,
      indexedDBMisses: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      evictions: 0
    };
  }

  // Atualizar configuração
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Pré-carregar dados
  public async preload<T>(entries: Array<{ key: CacheKey; data: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(entry => 
      this.set(entry.key, entry.data, entry.ttl)
    );
    
    await Promise.all(promises);
  }

  // Invalidar cache por padrão
  public async invalidatePattern(pattern: RegExp): Promise<void> {
    // Implementar invalidação por padrão se necessário
    // Complexo de implementar em todas as camadas
  }
}

// Utilitários para cache
export const CacheUtils = {
  // Gerar chave de cache
  generateKey: (prefix: string, ...parts: (string | number)[]): CacheKey => {
    return `${prefix}:${parts.join(':')}`;
  },

  // Calcular TTL baseado no tipo de dados
  calculateTTL: (dataType: string): number => {
    const ttlMap: Record<string, number> = {
      'slide': 3600000, // 1 hora
      'validation': 1800000, // 30 minutos
      'correction': 1800000, // 30 minutos
      'analysis': 7200000, // 2 horas
      'image': 86400000, // 24 horas
      'metadata': 43200000 // 12 horas
    };
    
    return ttlMap[dataType] || 3600000;
  },

  // Comprimir dados
  compress: (data: any): string => {
    // Implementar compressão se necessário
    return JSON.stringify(data);
  },

  // Descomprimir dados
  decompress: (compressedData: string): any => {
    // Implementar descompressão se necessário
    return JSON.parse(compressedData);
  }
};

// Exportar tipos
export type {
  CacheEntry,
  CacheConfig,
  CacheStats,
  CacheLayer,
  EvictionPolicy,
  CacheKey,
  CacheData
};