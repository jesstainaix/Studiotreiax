/**
 * Sistema de Cache Inteligente Multi-Camadas para PPTX
 * Implementa cache em memória, localStorage e IndexedDB
 */

// Interfaces para configuração e dados do cache
export interface CacheConfig {
  memoryMaxSize: number; // MB
  localStorageMaxSize: number; // MB
  indexedDBMaxSize: number; // MB
  defaultTTL: number; // milliseconds
  enableCompression: boolean;
  enableEncryption: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // milliseconds
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  size: number; // bytes
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  encrypted: boolean;
  layer: 'memory' | 'localStorage' | 'indexedDB';
}

export interface CacheStats {
  memory: {
    entries: number;
    size: number;
    hitRate: number;
    maxSize: number;
  };
  localStorage: {
    entries: number;
    size: number;
    hitRate: number;
    maxSize: number;
  };
  indexedDB: {
    entries: number;
    size: number;
    hitRate: number;
    maxSize: number;
  };
  overall: {
    totalEntries: number;
    totalSize: number;
    overallHitRate: number;
    totalRequests: number;
    totalHits: number;
  };
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  compressionRatio: number;
  averageAccessTime: number;
}

/**
 * Classe principal do sistema de cache multi-camadas
 */
export class MultiLayerCache {
  private static instance: MultiLayerCache;
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private dbName = 'pptx-cache-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    compressionRatio: 1,
    averageAccessTime: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      memoryMaxSize: 50, // 50MB
      localStorageMaxSize: 100, // 100MB
      indexedDBMaxSize: 500, // 500MB
      defaultTTL: 24 * 60 * 60 * 1000, // 24 horas
      enableCompression: true,
      enableEncryption: false,
      autoCleanup: true,
      cleanupInterval: 5 * 60 * 1000 // 5 minutos
    };
  }

  public static getInstance(): MultiLayerCache {
    if (!MultiLayerCache.instance) {
      MultiLayerCache.instance = new MultiLayerCache();
    }
    return MultiLayerCache.instance;
  }

  /**
   * Configura o sistema de cache
   */
  public configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.autoCleanup && !this.cleanupTimer) {
      this.startAutoCleanup();
    }
  }

  /**
   * Inicializa o IndexedDB
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('lastAccessed', 'lastAccessed');
        }
      };
    });
  }

  /**
   * Armazena dados no cache
   */
  public async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      layer?: 'memory' | 'localStorage' | 'indexedDB' | 'auto';
      compress?: boolean;
      encrypt?: boolean;
    } = {}
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.defaultTTL,
        size: this.calculateSize(data),
        accessCount: 0,
        lastAccessed: Date.now(),
        compressed: options.compress ?? this.config.enableCompression,
        encrypted: options.encrypt ?? this.config.enableEncryption,
        layer: 'memory'
      };

      // Determina a camada apropriada
      const targetLayer = options.layer === 'auto' 
        ? this.determineOptimalLayer(entry.size)
        : options.layer || 'memory';

      // Processa compressão se habilitada
      if (entry.compressed) {
        entry.data = await this.compressData(entry.data);
        entry.size = this.calculateSize(entry.data);
      }

      // Processa criptografia se habilitada
      if (entry.encrypted) {
        entry.data = await this.encryptData(entry.data);
      }

      entry.layer = targetLayer;

      // Armazena na camada apropriada
      await this.storeInLayer(entry, targetLayer);
      
      // Atualiza métricas
      this.updateMetrics('set', Date.now() - startTime);
      
    } catch (error) {
      console.error('Error storing in cache:', error);
      throw error;
    }
  }

  /**
   * Recupera dados do cache
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Busca em todas as camadas (memória primeiro)
      let entry = await this.getFromMemory<T>(key);
      
      if (!entry) {
        entry = await this.getFromLocalStorage<T>(key);
        
        if (entry) {
          // Move para memória se encontrado no localStorage
          await this.promoteToMemory(entry);
        }
      }
      
      if (!entry) {
        entry = await this.getFromIndexedDB<T>(key);
        
        if (entry) {
          // Move para camada superior se encontrado no IndexedDB
          await this.promoteEntry(entry);
        }
      }
      
      if (!entry) {
        this.metrics.misses++;
        return null;
      }
      
      // Verifica TTL
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.metrics.misses++;
        return null;
      }
      
      // Atualiza estatísticas de acesso
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await this.updateEntry(entry);
      
      // Processa descriptografia se necessário
      let data = entry.data;
      if (entry.encrypted) {
        data = await this.decryptData(data);
      }
      
      // Processa descompressão se necessário
      if (entry.compressed) {
        data = await this.decompressData(data);
      }
      
      this.metrics.hits++;
      this.updateMetrics('get', Date.now() - startTime);
      
      return data;
      
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Remove entrada do cache
   */
  public async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;
      
      // Remove de todas as camadas
      if (this.memoryCache.has(key)) {
        this.memoryCache.delete(key);
        deleted = true;
      }
      
      if (this.hasLocalStorageSupport()) {
        localStorage.removeItem(`pptx-cache-${key}`);
        deleted = true;
      }
      
      if (this.db) {
        await this.deleteFromIndexedDB(key);
        deleted = true;
      }
      
      return deleted;
      
    } catch (error) {
      console.error('Error deleting from cache:', error);
      return false;
    }
  }

  /**
   * Limpa todo o cache
   */
  public async clear(): Promise<void> {
    try {
      // Limpa memória
      this.memoryCache.clear();
      
      // Limpa localStorage
      if (this.hasLocalStorageSupport()) {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('pptx-cache-'));
        keys.forEach(key => localStorage.removeItem(key));
      }
      
      // Limpa IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve(undefined);
          request.onerror = () => reject(request.error);
        });
      }
      
      // Reset métricas
      this.metrics = {
        hits: 0,
        misses: 0,
        evictions: 0,
        compressionRatio: 1,
        averageAccessTime: 0
      };
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  public async getStats(): Promise<CacheStats> {
    const memorySize = this.calculateMemorySize();
    const localStorageSize = await this.calculateLocalStorageSize();
    const indexedDBSize = await this.calculateIndexedDBSize();
    
    const totalRequests = this.metrics.hits + this.metrics.misses;
    
    return {
      memory: {
        entries: this.memoryCache.size,
        size: memorySize,
        hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
        maxSize: this.config.memoryMaxSize * 1024 * 1024
      },
      localStorage: {
        entries: await this.getLocalStorageEntryCount(),
        size: localStorageSize,
        hitRate: 0, // Calculado separadamente se necessário
        maxSize: this.config.localStorageMaxSize * 1024 * 1024
      },
      indexedDB: {
        entries: await this.getIndexedDBEntryCount(),
        size: indexedDBSize,
        hitRate: 0, // Calculado separadamente se necessário
        maxSize: this.config.indexedDBMaxSize * 1024 * 1024
      },
      overall: {
        totalEntries: this.memoryCache.size + await this.getLocalStorageEntryCount() + await this.getIndexedDBEntryCount(),
        totalSize: memorySize + localStorageSize + indexedDBSize,
        overallHitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
        totalRequests,
        totalHits: this.metrics.hits
      }
    };
  }

  // Métodos privados auxiliares
  private determineOptimalLayer(size: number): 'memory' | 'localStorage' | 'indexedDB' {
    const memoryLimit = this.config.memoryMaxSize * 1024 * 1024;
    const localStorageLimit = this.config.localStorageMaxSize * 1024 * 1024;
    
    if (size < memoryLimit * 0.1) { // Menos de 10% do limite de memória
      return 'memory';
    } else if (size < localStorageLimit * 0.1) { // Menos de 10% do limite do localStorage
      return 'localStorage';
    } else {
      return 'indexedDB';
    }
  }

  private async storeInLayer<T>(entry: CacheEntry<T>, layer: string): Promise<void> {
    switch (layer) {
      case 'memory':
        await this.ensureMemorySpace(entry.size);
        this.memoryCache.set(entry.key, entry);
        break;
      case 'localStorage':
        if (this.hasLocalStorageSupport()) {
          await this.ensureLocalStorageSpace(entry.size);
          localStorage.setItem(`pptx-cache-${entry.key}`, JSON.stringify(entry));
        }
        break;
      case 'indexedDB':
        if (this.db) {
          await this.ensureIndexedDBSpace(entry.size);
          await this.storeInIndexedDB(entry);
        }
        break;
    }
  }

  private async getFromMemory<T>(key: string): Promise<CacheEntry<T> | null> {
    return this.memoryCache.get(key) as CacheEntry<T> || null;
  }

  private async getFromLocalStorage<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.hasLocalStorageSupport()) return null;
    
    try {
      const item = localStorage.getItem(`pptx-cache-${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private calculateMemorySize(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) {
      total += entry.size;
    }
    return total;
  }

  private async calculateLocalStorageSize(): Promise<number> {
    if (!this.hasLocalStorageSupport()) return 0;
    
    let total = 0;
    const keys = Object.keys(localStorage).filter(key => key.startsWith('pptx-cache-'));
    
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        total += new Blob([item]).size;
      }
    }
    
    return total;
  }

  private async calculateIndexedDBSize(): Promise<number> {
    // Implementação simplificada - em produção, usar navigator.storage.estimate()
    return 0;
  }

  private hasLocalStorageSupport(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private async compressData<T>(data: T): Promise<T> {
    // Implementação simplificada - em produção, usar bibliotecas como pako
    return data;
  }

  private async decompressData<T>(data: T): Promise<T> {
    // Implementação simplificada
    return data;
  }

  private async encryptData<T>(data: T): Promise<T> {
    // Implementação simplificada - em produção, usar Web Crypto API
    return data;
  }

  private async decryptData<T>(data: T): Promise<T> {
    // Implementação simplificada
    return data;
  }

  private updateMetrics(operation: string, duration: number): void {
    // Atualiza tempo médio de acesso
    const totalOps = this.metrics.hits + this.metrics.misses;
    this.metrics.averageAccessTime = 
      (this.metrics.averageAccessTime * (totalOps - 1) + duration) / totalOps;
  }

  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  private async performCleanup(): Promise<void> {
    // Remove entradas expiradas de todas as camadas
    const now = Date.now();
    
    // Cleanup memória
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        this.metrics.evictions++;
      }
    }
    
    // Cleanup localStorage e IndexedDB seria implementado de forma similar
  }

  // Métodos auxiliares adicionais
  private async ensureMemorySpace(requiredSize: number): Promise<void> {
    const currentSize = this.calculateMemorySize();
    const maxSize = this.config.memoryMaxSize * 1024 * 1024;
    
    if (currentSize + requiredSize > maxSize) {
      await this.evictLRUFromMemory(requiredSize);
    }
  }

  private async evictLRUFromMemory(requiredSize: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSize = 0;
    for (const [key, entry] of entries) {
      this.memoryCache.delete(key);
      freedSize += entry.size;
      this.metrics.evictions++;
      
      if (freedSize >= requiredSize) break;
    }
  }

  private async promoteToMemory<T>(entry: CacheEntry<T>): Promise<void> {
    await this.ensureMemorySpace(entry.size);
    entry.layer = 'memory';
    this.memoryCache.set(entry.key, entry);
  }

  private async promoteEntry<T>(entry: CacheEntry<T>): Promise<void> {
    if (entry.layer === 'indexedDB') {
      // Tenta promover para localStorage primeiro
      const localStorageSize = await this.calculateLocalStorageSize();
      const maxLocalStorageSize = this.config.localStorageMaxSize * 1024 * 1024;
      
      if (localStorageSize + entry.size <= maxLocalStorageSize) {
        entry.layer = 'localStorage';
        if (this.hasLocalStorageSupport()) {
          localStorage.setItem(`pptx-cache-${entry.key}`, JSON.stringify(entry));
        }
      }
    }
  }

  private async updateEntry<T>(entry: CacheEntry<T>): Promise<void> {
    switch (entry.layer) {
      case 'memory':
        this.memoryCache.set(entry.key, entry);
        break;
      case 'localStorage':
        if (this.hasLocalStorageSupport()) {
          localStorage.setItem(`pptx-cache-${entry.key}`, JSON.stringify(entry));
        }
        break;
      case 'indexedDB':
        if (this.db) {
          await this.storeInIndexedDB(entry);
        }
        break;
    }
  }

  private async storeInIndexedDB<T>(entry: CacheEntry<T>): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getLocalStorageEntryCount(): Promise<number> {
    if (!this.hasLocalStorageSupport()) return 0;
    return Object.keys(localStorage).filter(key => key.startsWith('pptx-cache-')).length;
  }

  private async getIndexedDBEntryCount(): Promise<number> {
    if (!this.db) return 0;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }

  private async ensureLocalStorageSpace(requiredSize: number): Promise<void> {
    // Implementação simplificada
  }

  private async ensureIndexedDBSpace(requiredSize: number): Promise<void> {
    // Implementação simplificada
  }
}

// Funções utilitárias para uso fácil
export const cache = MultiLayerCache.getInstance();

export async function initializeCache(config?: Partial<CacheConfig>): Promise<void> {
  if (config) {
    cache.configure(config);
  }
  await cache.initialize();
}

export async function cacheSlideData(key: string, data: any, ttl?: number): Promise<void> {
  await cache.set(key, data, { ttl, layer: 'auto' });
}

export async function getCachedSlideData<T>(key: string): Promise<T | null> {
  return await cache.get<T>(key);
}

export async function clearSlideCache(): Promise<void> {
  await cache.clear();
}

export async function getCacheStats(): Promise<CacheStats> {
  return await cache.getStats();
}