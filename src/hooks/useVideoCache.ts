import { useState, useEffect, useCallback } from 'react';

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  lastAccessed: number;
}

class VideoCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100 * 1024 * 1024; // 100MB
  private maxAge = 30 * 60 * 1000; // 30 minutes
  private currentSize = 0;

  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(url);
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    
    return URL.createObjectURL(entry.blob);
  }

  async set(url: string, blob: Blob): Promise<void> {
    // Clean up old entries if needed
    this.cleanup();

    const blobSize = blob.size;
    
    // Make space if needed
    while (this.currentSize + blobSize > this.maxSize && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    };

    this.cache.set(url, entry);
    this.currentSize += blobSize;
  }

  delete(url: string): void {
    const entry = this.cache.get(url);
    if (entry) {
      this.currentSize -= entry.blob.size;
      this.cache.delete(url);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize
    };
  }
}

const videoCache = new VideoCache();

export const useVideoCache = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedVideo = useCallback(async (url: string): Promise<string | null> => {
    try {
      setError(null);
      return await videoCache.get(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao acessar cache');
      return null;
    }
  }, []);

  const cacheVideo = useCallback(async (url: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if already cached
      const cached = await videoCache.get(url);
      if (cached) {
        return cached;
      }

      // Fetch and cache the video
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      const blob = await response.blob();
      await videoCache.set(url, blob);
      
      return URL.createObjectURL(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer cache do vídeo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    videoCache.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return videoCache.getStats();
  }, []);

  return {
    getCachedVideo,
    cacheVideo,
    clearCache,
    getCacheStats,
    isLoading,
    error
  };
};

export default useVideoCache;