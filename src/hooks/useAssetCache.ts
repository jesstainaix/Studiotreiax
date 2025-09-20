import { useState, useEffect, useCallback } from 'react';
import { assetCache, cacheUtils } from '@/utils/assetCache';

interface UseAssetCacheOptions {
  preloadOnMount?: boolean;
  priority?: number;
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheHits: number;
}

// Hook for managing asset cache
export const useAssetCache = () => {
  const [stats, setStats] = useState<CacheStats>({
    totalSize: 0,
    itemCount: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    cacheHits: 0
  });

  const [isPreloading, setIsPreloading] = useState(false);

  // Update cache stats
  const updateStats = useCallback(() => {
    const currentStats = assetCache.getStats();
    setStats(currentStats);
  }, []);

  // Preload assets
  const preloadAssets = useCallback(async (resources: Array<{ url: string; type: string; priority?: number }>) => {
    setIsPreloading(true);
    try {
      await cacheUtils.preloadProjectAssets(resources);
      updateStats();
    } catch (error) {
      console.error('Error preloading assets:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [updateStats]);

  // Get cached asset
  const getCachedAsset = useCallback(async (url: string, type: 'image' | 'video' | 'audio' | 'text') => {
    try {
      const cachedUrl = await cacheUtils.getCachedAsset(url, type);
      updateStats();
      return cachedUrl;
    } catch (error) {
      console.error('Error getting cached asset:', error);
      return url;
    }
  }, [updateStats]);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheUtils.clearCache();
    updateStats();
  }, [updateStats]);

  // Get cache usage info
  const getCacheUsage = useCallback(() => {
    return assetCache.getUsageInfo();
  }, []);

  useEffect(() => {
    updateStats();
    
    // Update stats periodically
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    stats,
    isPreloading,
    preloadAssets,
    getCachedAsset,
    clearCache,
    getCacheUsage,
    updateStats
  };
};

// Hook for individual asset caching
export const useCachedAsset = (url: string, type: 'image' | 'video' | 'audio' | 'text', options: UseAssetCacheOptions = {}) => {
  const [cachedUrl, setCachedUrl] = useState<string>(url);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { preloadOnMount = false, priority = 1 } = options;

  const loadAsset = useCallback(async () => {
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cached = await cacheUtils.getCachedAsset(url, type);
      setCachedUrl(cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load asset');
      setCachedUrl(url); // Fallback to original URL
    } finally {
      setIsLoading(false);
    }
  }, [url, type]);

  useEffect(() => {
    if (preloadOnMount) {
      loadAsset();
    }
  }, [preloadOnMount, loadAsset]);

  return {
    cachedUrl,
    isLoading,
    error,
    loadAsset
  };
};

// Hook for batch asset preloading
export const useAssetPreloader = () => {
  const [preloadedAssets, setPreloadedAssets] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  const preloadBatch = useCallback(async (assets: Array<{ url: string; type: string; priority?: number }>) => {
    setIsPreloading(true);
    setPreloadProgress(0);
    
    const total = assets.length;
    let completed = 0;
    
    try {
      const promises = assets.map(async (asset) => {
        try {
          await cacheUtils.getCachedAsset(asset.url, asset.type as any);
          setPreloadedAssets(prev => new Set(prev).add(asset.url));
        } catch (error) {
          console.warn(`Failed to preload ${asset.url}:`, error);
        } finally {
          completed++;
          setPreloadProgress((completed / total) * 100);
        }
      });
      
      await Promise.allSettled(promises);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  const isAssetPreloaded = useCallback((url: string) => {
    return preloadedAssets.has(url);
  }, [preloadedAssets]);

  const clearPreloadedAssets = useCallback(() => {
    setPreloadedAssets(new Set());
    setPreloadProgress(0);
  }, []);

  return {
    preloadBatch,
    isPreloading,
    preloadProgress,
    isAssetPreloaded,
    clearPreloadedAssets,
    preloadedCount: preloadedAssets.size
  };
};

export default useAssetCache;