import { create } from 'zustand';
import { distributedCacheManager } from './distributedCacheService';

export interface CacheEntry {
  id: string;
  key: string;
  data: any;
  size: number; // in bytes
  timestamp: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'video' | 'audio' | 'image' | 'thumbnail' | 'effect' | 'metadata';
  expiresAt?: number;
  compressed?: boolean;
  metadata?: {
    duration?: number;
    resolution?: string;
    format?: string;
    codec?: string;
  };
}

export interface CacheStats {
  totalSize: number;
  totalEntries: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionRatio: number;
}

export interface VideoCacheState {
  entries: Map<string, CacheEntry>;
  stats: CacheStats;
  maxSize: number; // in bytes
  maxEntries: number;
  compressionEnabled: boolean;
  preloadEnabled: boolean;
  
  // Actions
  set: (key: string, data: any, options?: Partial<CacheEntry>) => Promise<void>;
  get: (key: string) => Promise<any | null>;
  has: (key: string) => boolean;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
  evict: (strategy?: 'lru' | 'lfu' | 'size' | 'priority') => Promise<void>;
  preload: (keys: string[]) => Promise<void>;
  compress: (data: any) => Promise<ArrayBuffer>;
  decompress: (data: ArrayBuffer) => Promise<any>;
  getStats: () => CacheStats;
  optimize: () => Promise<void>;
}

class VideoCacheService {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    totalSize: 0,
    totalEntries: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    compressionRatio: 0
  };
  private hits = 0;
  private misses = 0;
  private maxSize: number;
  private maxEntries: number;
  private compressionEnabled: boolean;
  private preloadEnabled: boolean;

  constructor(
    maxSize = 500 * 1024 * 1024, // 500MB default
    maxEntries = 1000,
    compressionEnabled = true,
    preloadEnabled = true
  ) {
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
    this.compressionEnabled = compressionEnabled;
    this.preloadEnabled = preloadEnabled;
    
    // Initialize with distributed cache service
    this.initializeDistributedCache();
  }

  private async initializeDistributedCache() {
    try {
      // Sync with distributed cache on startup
      const distributedEntries = await distributedCacheManager.getAll();
      
      for (const [key, value] of Object.entries(distributedEntries)) {
        if (this.isVideoRelated(key)) {
          const entry: CacheEntry = {
            id: key,
            key,
            data: value,
            size: this.calculateSize(value),
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            priority: 'medium',
            type: this.inferType(key)
          };
          
          this.cache.set(key, entry);
          this.updateStats();
        }
      }
    } catch (error) {
      console.warn('Failed to initialize distributed cache:', error);
    }
  }

  private isVideoRelated(key: string): boolean {
    return key.includes('video') || 
           key.includes('audio') || 
           key.includes('thumbnail') || 
           key.includes('frame') ||
           key.includes('effect') ||
           key.includes('timeline');
  }

  private inferType(key: string): CacheEntry['type'] {
    if (key.includes('video')) return 'video';
    if (key.includes('audio')) return 'audio';
    if (key.includes('thumbnail')) return 'thumbnail';
    if (key.includes('image')) return 'image';
    if (key.includes('effect')) return 'effect';
    return 'metadata';
  }

  private calculateSize(data: any): number {
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (data instanceof Blob) {
      return data.size;
    }
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    if (data instanceof ImageData) {
      return data.data.length;
    }
    // Estimate size for objects
    return new Blob([JSON.stringify(data)]).size;
  }

  async set(key: string, data: any, options: Partial<CacheEntry> = {}): Promise<void> {
    try {
      let processedData = data;
      let compressed = false;
      
      // Compress large data if enabled
      if (this.compressionEnabled && this.shouldCompress(data)) {
        processedData = await this.compress(data);
        compressed = true;
      }
      
      const size = this.calculateSize(processedData);
      
      // Check if we need to evict entries
      if (this.stats.totalSize + size > this.maxSize || 
          this.stats.totalEntries >= this.maxEntries) {
        await this.evict();
      }
      
      const entry: CacheEntry = {
        id: key,
        key,
        data: processedData,
        size,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        priority: options.priority || 'medium',
        type: options.type || this.inferType(key),
        compressed,
        metadata: options.metadata,
        expiresAt: options.expiresAt
      };
      
      this.cache.set(key, entry);
      
      // Also store in distributed cache for persistence
      await distributedCacheManager.set(key, processedData, {
        ttl: options.expiresAt ? Math.floor((options.expiresAt - Date.now()) / 1000) : undefined
      });
      
      this.updateStats();
      
      // Update Zustand store
      useVideoCache.setState({
        entries: new Map(this.cache),
        stats: { ...this.stats }
      });
      
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      let entry = this.cache.get(key);
      
      // If not in memory cache, try distributed cache
      if (!entry) {
        const distributedData = await distributedCacheManager.get(key);
        if (distributedData) {
          entry = {
            id: key,
            key,
            data: distributedData,
            size: this.calculateSize(distributedData),
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            priority: 'medium',
            type: this.inferType(key)
          };
          
          this.cache.set(key, entry);
          this.updateStats();
        }
      }
      
      if (!entry) {
        this.misses++;
        this.updateHitRate();
        return null;
      }
      
      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        this.misses++;
        this.updateHitRate();
        return null;
      }
      
      // Update last accessed time
      entry.lastAccessed = Date.now();
      this.cache.set(key, entry);
      
      this.hits++;
      this.updateHitRate();
      
      // Decompress if needed
      let data = entry.data;
      if (entry.compressed) {
        data = await this.decompress(data);
      }
      
      return data;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.misses++;
      this.updateHitRate();
      return null;
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.delete(key);
      
      // Also delete from distributed cache
      await distributedCacheManager.delete(key);
      
      if (deleted) {
        this.updateStats();
        
        // Update Zustand store
        useVideoCache.setState({
          entries: new Map(this.cache),
          stats: { ...this.stats }
        });
      }
      
      return deleted;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      
      // Clear video-related entries from distributed cache
      const allKeys = await distributedCacheManager.getKeys();
      const videoKeys = allKeys.filter(key => this.isVideoRelated(key));
      
      for (const key of videoKeys) {
        await distributedCacheManager.delete(key);
      }
      
      this.hits = 0;
      this.misses = 0;
      this.stats.evictionCount = 0;
      this.updateStats();
      
      // Update Zustand store
      useVideoCache.setState({
        entries: new Map(),
        stats: { ...this.stats }
      });
      
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async evict(strategy: 'lru' | 'lfu' | 'size' | 'priority' = 'lru'): Promise<void> {
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) return;
    
    let toEvict: CacheEntry[];
    
    switch (strategy) {
      case 'lru': // Least Recently Used
        toEvict = entries
          .sort((a, b) => a.lastAccessed - b.lastAccessed)
          .slice(0, Math.ceil(entries.length * 0.1)); // Evict 10%
        break;
        
      case 'lfu': // Least Frequently Used (approximated by access time)
        toEvict = entries
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, Math.ceil(entries.length * 0.1));
        break;
        
      case 'size': // Largest entries first
        toEvict = entries
          .sort((a, b) => b.size - a.size)
          .slice(0, Math.ceil(entries.length * 0.05)); // Evict 5% of largest
        break;
        
      case 'priority': // Lowest priority first
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        toEvict = entries
          .filter(entry => entry.priority !== 'critical')
          .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
          .slice(0, Math.ceil(entries.length * 0.1));
        break;
        
      default:
        toEvict = [];
    }
    
    for (const entry of toEvict) {
      await this.delete(entry.key);
      this.stats.evictionCount++;
    }
  }

  async preload(keys: string[]): Promise<void> {
    if (!this.preloadEnabled) return;
    
    const preloadPromises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await distributedCacheManager.get(key);
          if (data) {
            await this.set(key, data, { priority: 'low' });
          }
        } catch (error) {
          console.warn(`Preload failed for key: ${key}`, error);
        }
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  private shouldCompress(data: any): boolean {
    const size = this.calculateSize(data);
    return size > 1024 * 1024; // Compress if larger than 1MB
  }

  async compress(data: any): Promise<ArrayBuffer> {
    try {
      // Convert data to string if needed
      let stringData: string;
      
      if (typeof data === 'string') {
        stringData = data;
      } else if (data instanceof ArrayBuffer) {
        stringData = new TextDecoder().decode(data);
      } else {
        stringData = JSON.stringify(data);
      }
      
      // Use CompressionStream if available
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(stringData));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return result.buffer;
      } else {
        // Fallback: just return the original data as ArrayBuffer
        return new TextEncoder().encode(stringData).buffer;
      }
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return new TextEncoder().encode(JSON.stringify(data)).buffer;
    }
  }

  async decompress(data: ArrayBuffer): Promise<any> {
    try {
      // Use DecompressionStream if available
      if ('DecompressionStream' in window) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new Uint8Array(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        const decompressed = new TextDecoder().decode(result);
        
        try {
          return JSON.parse(decompressed);
        } catch {
          return decompressed;
        }
      } else {
        // Fallback: assume it's just text data
        const text = new TextDecoder().decode(data);
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      throw error;
    }
  }

  private updateStats(): void {
    const entries = Array.from(this.cache.values());
    
    this.stats.totalEntries = entries.length;
    this.stats.totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    // Calculate compression ratio
    const compressedEntries = entries.filter(e => e.compressed);
    if (compressedEntries.length > 0) {
      // This is an approximation - in reality we'd need original sizes
      this.stats.compressionRatio = 0.7; // Assume 30% compression
    }
  }

  private updateHitRate(): void {
    const total = this.hits + this.misses;
    if (total > 0) {
      this.stats.hitRate = this.hits / total;
      this.stats.missRate = this.misses / total;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async optimize(): Promise<void> {
    // Remove expired entries
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      await this.delete(key);
    }
    
    // Evict if over limits
    if (this.stats.totalSize > this.maxSize * 0.9 || 
        this.stats.totalEntries > this.maxEntries * 0.9) {
      await this.evict('lru');
    }
    
    // Compress large uncompressed entries
    if (this.compressionEnabled) {
      const uncompressedLarge = Array.from(this.cache.values())
        .filter(entry => !entry.compressed && entry.size > 1024 * 1024);
      
      for (const entry of uncompressedLarge) {
        try {
          const compressed = await this.compress(entry.data);
          entry.data = compressed;
          entry.compressed = true;
          entry.size = compressed.byteLength;
          this.cache.set(entry.key, entry);
        } catch (error) {
          console.warn(`Failed to compress entry ${entry.key}:`, error);
        }
      }
    }
    
    this.updateStats();
  }
}

// Create singleton instance
const videoCacheService = new VideoCacheService();

// Zustand store for video cache state
export const useVideoCache = create<VideoCacheState>((set, get) => ({
  entries: new Map(),
  stats: {
    totalSize: 0,
    totalEntries: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    compressionRatio: 0
  },
  maxSize: 500 * 1024 * 1024, // 500MB
  maxEntries: 1000,
  compressionEnabled: true,
  preloadEnabled: true,

  set: async (key, data, options) => {
    await videoCacheService.set(key, data, options);
  },

  get: async (key) => {
    return await videoCacheService.get(key);
  },

  has: (key) => {
    return videoCacheService.has(key);
  },

  delete: async (key) => {
    return await videoCacheService.delete(key);
  },

  clear: async () => {
    await videoCacheService.clear();
  },

  evict: async (strategy) => {
    await videoCacheService.evict(strategy);
  },

  preload: async (keys) => {
    await videoCacheService.preload(keys);
  },

  compress: async (data) => {
    return await videoCacheService.compress(data);
  },

  decompress: async (data) => {
    return await videoCacheService.decompress(data);
  },

  getStats: () => {
    return videoCacheService.getStats();
  },

  optimize: async () => {
    await videoCacheService.optimize();
  }
}));

// Auto-optimization interval
setInterval(() => {
  videoCacheService.optimize().catch(console.error);
}, 5 * 60 * 1000); // Every 5 minutes

export default videoCacheService;