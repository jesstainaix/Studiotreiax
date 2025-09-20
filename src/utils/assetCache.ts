// Asset Cache System for Studio Treiax
// Intelligent caching for video, image, and audio assets

interface CacheItem {
  data: Blob | string;
  timestamp: number;
  size: number;
  type: 'image' | 'video' | 'audio' | 'text';
  url: string;
  lastAccessed: number;
  accessCount: number;
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheHits: number;
}

class AssetCacheManager {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private maxAge: number;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSizeMB = 100, maxAgeMinutes = 30) {
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    this.maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    this.stats = {
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheHits: 0
    };

    // Start automatic cleanup
    this.startCleanup();
  }

  // Get asset from cache or fetch if not available
  async get(url: string, type: CacheItem['type']): Promise<Blob | string | null> {
    this.stats.totalRequests++;
    
    const cacheKey = this.generateKey(url, type);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isValid(cached)) {
      // Update access statistics
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      this.stats.cacheHits++;
      this.updateHitRate();
      return cached.data;
    }
    this.updateHitRate();
    return null;
  }

  // Store asset in cache
  async set(url: string, data: Blob | string, type: CacheItem['type']): Promise<void> {
    const size = this.getDataSize(data);
    
    // Check if we need to make space
    if (this.stats.totalSize + size > this.maxSize) {
      await this.evictLRU(size);
    }

    const cacheKey = this.generateKey(url, type);
    const item: CacheItem = {
      data,
      timestamp: Date.now(),
      size,
      type,
      url,
      lastAccessed: Date.now(),
      accessCount: 1
    };

    // Remove existing item if present
    if (this.cache.has(cacheKey)) {
      const existing = this.cache.get(cacheKey)!;
      this.stats.totalSize -= existing.size;
      this.stats.itemCount--;
    }

    this.cache.set(cacheKey, item);
    this.stats.totalSize += size;
    this.stats.itemCount++;
  }

  // Fetch and cache asset
  async fetchAndCache(url: string, type: CacheItem['type']): Promise<Blob | string | null> {
    try {
      // Check cache first
      const cached = await this.get(url, type);
      if (cached) return cached;

      // Fetch from network
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      let data: Blob | string;
      if (type === 'text') {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      // Cache the result
      await this.set(url, data, type);
      return data;
    } catch (error) {
      console.error(`Error fetching asset ${url}:`, error);
      return null;
    }
  }

  // Preload multiple assets
  async preloadAssets(urls: Array<{ url: string; type: CacheItem['type']; priority?: number }>): Promise<void> {
    // Sort by priority (higher first)
    const sortedUrls = urls.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    const promises = sortedUrls.map(({ url, type }) => 
      this.fetchAndCache(url, type).catch(error => {
        console.warn(`Failed to preload ${url}:`, error);
        return null;
      })
    );

    await Promise.allSettled(promises);
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheHits: 0
    };
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache usage info
  getUsageInfo() {
    return {
      usedSize: this.formatSize(this.stats.totalSize),
      maxSize: this.formatSize(this.maxSize),
      usagePercentage: ((this.stats.totalSize / this.maxSize) * 100).toFixed(1),
      itemCount: this.stats.itemCount,
      hitRate: this.stats.hitRate.toFixed(1),
      oldestItem: this.getOldestItem(),
      mostAccessed: this.getMostAccessedItem()
    };
  }

  // Private methods
  private generateKey(url: string, type: CacheItem['type']): string {
    return `${type}:${url}`;
  }

  private isValid(item: CacheItem): boolean {
    return Date.now() - item.timestamp < this.maxAge;
  }

  private getDataSize(data: Blob | string): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return data.size;
  }

  private async evictLRU(requiredSpace: number): Promise<void> {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const item of items) {
      if (this.stats.totalSize - freedSpace + requiredSpace <= this.maxSize) {
        break;
      }

      this.cache.delete(item.key);
      freedSpace += item.size;
      this.stats.itemCount--;
    }

    this.stats.totalSize -= freedSpace;
  }

  private updateHitRate(): void {
    this.stats.hitRate = (this.stats.cacheHits / this.stats.totalRequests) * 100;
    this.stats.missRate = 100 - this.stats.hitRate;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private getOldestItem(): string | null {
    let oldest: CacheItem | null = null;
    let oldestKey: string | null = null;

    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (!oldest || item.timestamp < oldest.timestamp) {
        oldest = item;
        oldestKey = key;
      }
    });

    return oldestKey;
  }

  private getMostAccessedItem(): string | null {
    let mostAccessed: CacheItem | null = null;
    let mostAccessedKey: string | null = null;

    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (!mostAccessed || item.accessCount > mostAccessed.accessCount) {
        mostAccessed = item;
        mostAccessedKey = key;
      }
    });

    return mostAccessedKey;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let removedCount = 0;
    let freedSpace = 0;

    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key);
        freedSpace += item.size;
        removedCount++;
      }
    });

    if (removedCount > 0) {
      this.stats.totalSize -= freedSpace;
      this.stats.itemCount -= removedCount;
    }
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instance
export const assetCache = new AssetCacheManager();

// Utility functions
export const cacheUtils = {
  // Preload project assets
  async preloadProjectAssets(resources: Array<{ url: string; type: string }>) {
    const assetsToPreload = resources.map(resource => ({
      url: resource.url,
      type: resource.type as CacheItem['type'],
      priority: resource.type === 'image' ? 3 : resource.type === 'video' ? 2 : 1
    }));

    await assetCache.preloadAssets(assetsToPreload);
  },

  // Get cached asset with fallback
  async getCachedAsset(url: string, type: CacheItem['type']): Promise<string> {
    const cached = await assetCache.fetchAndCache(url, type);
    if (cached instanceof Blob) {
      return URL.createObjectURL(cached);
    }
    return cached || url;
  },

  // Clear cache and reset
  clearCache() {
    assetCache.clear();
  },

  // Get cache statistics
  getCacheStats() {
    return assetCache.getStats();
  },

  // Get usage information
  getCacheUsage() {
    return assetCache.getUsageInfo();
  }
};

export default assetCache;