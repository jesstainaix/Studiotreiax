import { useEffect, useCallback, useMemo } from 'react';
import { useCacheStore } from '../utils/cacheManager';

// Interfaces
interface UseCacheOptions {
  key?: string;
  defaultValue?: any;
  ttl?: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  autoRefresh?: boolean;
  refreshInterval?: number;
  onHit?: (value: any) => void;
  onMiss?: () => void;
  onError?: (error: any) => void;
}

interface UseCacheReturn {
  // Cache data
  value: any;
  isLoading: boolean;
  error: string | null;
  isHit: boolean;
  isMiss: boolean;
  
  // Cache operations
  setValue: (value: any, options?: Partial<UseCacheOptions>) => void;
  refresh: () => void;
  remove: () => void;
  clear: () => void;
  
  // Cache info
  exists: boolean;
  size: number;
  lastAccessed: number | null;
  accessCount: number;
  
  // Utilities
  formatSize: (bytes: number) => string;
  formatAge: (timestamp: number) => string;
}

interface UseCacheStatsReturn {
  // Stats
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  compressionRatio: number;
  
  // Metrics
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  
  // Actions
  resetStats: () => void;
  optimize: () => void;
  cleanup: () => void;
  
  // Utilities
  formatSize: (bytes: number) => string;
  getStatusColor: (hitRate: number) => string;
}

interface UseCacheConfigReturn {
  // Config
  config: any;
  
  // Actions
  updateConfig: (config: any) => void;
  resetConfig: () => void;
  
  // Utilities
  isCompressionEnabled: boolean;
  isPersistenceEnabled: boolean;
  maxSizeFormatted: string;
  defaultTTLFormatted: string;
}

// Main cache hook
export const useCache = (key?: string, options: UseCacheOptions = {}): UseCacheReturn => {
  const {
    get,
    set,
    delete: deleteKey,
    clear,
    has,
    entries,
    formatSize,
    formatDuration,
    addDebugLog
  } = useCacheStore();
  
  const {
    defaultValue,
    ttl,
    tags = [],
    priority = 'medium',
    autoRefresh = false,
    refreshInterval = 30000,
    onHit,
    onMiss,
    onError
  } = options;
  
  // Get cached value
  const value = useMemo(() => {
    if (!key) return defaultValue;
    
    try {
      const cached = get(key);
      if (cached !== undefined) {
        onHit?.(cached);
        return cached;
      } else {
        onMiss?.();
        return defaultValue;
      }
    } catch (error) {
      onError?.(error);
      addDebugLog('error', 'useCache', `Error getting cache key: ${key}`, error);
      return defaultValue;
    }
  }, [key, get, defaultValue, onHit, onMiss, onError, addDebugLog]);
  
  // Cache info
  const cacheEntry = key ? entries.get(key) : null;
  const exists = key ? has(key) : false;
  const isHit = value !== defaultValue && exists;
  const isMiss = !isHit;
  
  // Set value in cache
  const setValue = useCallback((newValue: any, setOptions: Partial<UseCacheOptions> = {}) => {
    if (!key) return;
    
    try {
      const cacheOptions = {
        tags: [...tags, ...(setOptions.tags || [])],
        priority: setOptions.priority || priority,
        expiresAt: setOptions.ttl ? Date.now() + setOptions.ttl : (ttl ? Date.now() + ttl : undefined)
      };
      
      set(key, newValue, cacheOptions);
      addDebugLog('debug', 'useCache', `Set cache value for key: ${key}`);
    } catch (error) {
      onError?.(error);
      addDebugLog('error', 'useCache', `Error setting cache key: ${key}`, error);
    }
  }, [key, set, tags, priority, ttl, onError, addDebugLog]);
  
  // Refresh value
  const refresh = useCallback(() => {
    if (!key) return;
    
    try {
      // Force refresh by removing and getting again
      deleteKey(key);
      const newValue = get(key);
      addDebugLog('debug', 'useCache', `Refreshed cache key: ${key}`);
      return newValue;
    } catch (error) {
      onError?.(error);
      addDebugLog('error', 'useCache', `Error refreshing cache key: ${key}`, error);
    }
  }, [key, deleteKey, get, onError, addDebugLog]);
  
  // Remove from cache
  const remove = useCallback(() => {
    if (!key) return;
    
    try {
      deleteKey(key);
      addDebugLog('debug', 'useCache', `Removed cache key: ${key}`);
    } catch (error) {
      onError?.(error);
      addDebugLog('error', 'useCache', `Error removing cache key: ${key}`, error);
    }
  }, [key, deleteKey, onError, addDebugLog]);
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh || !key) return;
    
    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, key]);
  
  // Format age
  const formatAge = useCallback((timestamp: number) => {
    const age = Date.now() - timestamp;
    return formatDuration(age);
  }, [formatDuration]);
  
  return {
    // Cache data
    value,
    isLoading: false,
    error: null,
    isHit,
    isMiss,
    
    // Cache operations
    setValue,
    refresh,
    remove,
    clear,
    
    // Cache info
    exists,
    size: cacheEntry?.size || 0,
    lastAccessed: cacheEntry?.lastAccessed || null,
    accessCount: cacheEntry?.accessCount || 0,
    
    // Utilities
    formatSize,
    formatAge
  };
};

// Cache stats hook
export const useCacheStats = (): UseCacheStatsReturn => {
  const {
    getStats,
    getMetrics,
    resetMetrics,
    optimize,
    cleanup,
    formatSize
  } = useCacheStore();
  
  const stats = getStats();
  const metrics = getMetrics();
  
  const getStatusColor = useCallback((hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);
  
  return {
    // Stats
    totalEntries: stats.totalEntries,
    totalSize: stats.totalSize,
    hitRate: stats.hitRate,
    missRate: stats.missRate,
    evictions: stats.evictions,
    compressionRatio: stats.compressionRatio,
    
    // Metrics
    hits: metrics.hits,
    misses: metrics.misses,
    sets: metrics.sets,
    deletes: metrics.deletes,
    
    // Actions
    resetStats: resetMetrics,
    optimize,
    cleanup,
    
    // Utilities
    formatSize,
    getStatusColor
  };
};

// Cache config hook
export const useCacheConfig = (): UseCacheConfigReturn => {
  const {
    config,
    updateConfig,
    resetConfig,
    formatSize,
    formatDuration
  } = useCacheStore();
  
  return {
    // Config
    config,
    
    // Actions
    updateConfig,
    resetConfig,
    
    // Utilities
    isCompressionEnabled: config.enableCompression,
    isPersistenceEnabled: config.enablePersistence,
    maxSizeFormatted: formatSize(config.maxSize),
    defaultTTLFormatted: formatDuration(config.defaultTTL)
  };
};

// Cache entries hook
export const useCacheEntries = (tag?: string) => {
  const {
    entries,
    getByTag,
    deleteByTag,
    clearByTag,
    formatSize,
    formatDuration
  } = useCacheStore();
  
  const filteredEntries = useMemo(() => {
    if (tag) {
      return getByTag(tag);
    }
    return Array.from(entries.values());
  }, [entries, tag, getByTag]);
  
  const sortedEntries = useMemo(() => {
    return filteredEntries.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }, [filteredEntries]);
  
  const deleteByTagAction = useCallback(() => {
    if (tag) {
      return deleteByTag(tag);
    }
    return 0;
  }, [tag, deleteByTag]);
  
  const clearByTagAction = useCallback(() => {
    if (tag) {
      clearByTag(tag);
    }
  }, [tag, clearByTag]);
  
  return {
    entries: sortedEntries,
    totalEntries: filteredEntries.length,
    totalSize: filteredEntries.reduce((sum, entry) => sum + entry.size, 0),
    deleteByTag: deleteByTagAction,
    clearByTag: clearByTagAction,
    formatSize,
    formatDuration
  };
};

// Cache debug hook
export const useCacheDebug = () => {
  const {
    debugLogs,
    clearDebugLogs,
    exportDebugLogs,
    addDebugLog
  } = useCacheStore();
  
  const logsByLevel = useMemo(() => {
    return debugLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [debugLogs]);
  
  const recentLogs = useMemo(() => {
    return debugLogs.slice(-50).reverse(); // Last 50 logs, newest first
  }, [debugLogs]);
  
  const addLog = useCallback((level: string, message: string, data?: any) => {
    addDebugLog(level, 'manual', message, data);
  }, [addDebugLog]);
  
  return {
    logs: recentLogs,
    allLogs: debugLogs,
    logsByLevel,
    totalLogs: debugLogs.length,
    clearLogs: clearDebugLogs,
    exportLogs: exportDebugLogs,
    addLog
  };
};

// Cache performance hook
export const useCachePerformance = () => {
  const {
    getStats,
    getMetrics,
    entries,
    config
  } = useCacheStore();
  
  const stats = getStats();
  const metrics = getMetrics();
  
  const performance = useMemo(() => {
    const totalRequests = metrics.hits + metrics.misses;
    const utilizationRate = (stats.totalEntries / config.maxEntries) * 100;
    const sizeUtilizationRate = (stats.totalSize / config.maxSize) * 100;
    
    // Calculate average entry size
    const averageEntrySize = stats.totalEntries > 0 ? stats.totalSize / stats.totalEntries : 0;
    
    // Calculate compression effectiveness
    const compressionEffectiveness = metrics.compressions > 0 ? 
      (metrics.compressions / (metrics.compressions + metrics.decompressions)) * 100 : 0;
    
    // Calculate eviction rate
    const evictionRate = totalRequests > 0 ? (metrics.evictions / totalRequests) * 100 : 0;
    
    return {
      hitRate: stats.hitRate,
      missRate: stats.missRate,
      utilizationRate,
      sizeUtilizationRate,
      averageEntrySize,
      compressionEffectiveness,
      evictionRate,
      totalRequests,
      efficiency: stats.hitRate > 0 ? (stats.hitRate / (stats.hitRate + evictionRate)) * 100 : 0
    };
  }, [stats, metrics, config]);
  
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    
    if (performance.hitRate < 50) {
      recs.push('Consider increasing cache size or TTL to improve hit rate');
    }
    
    if (performance.utilizationRate > 90) {
      recs.push('Cache is nearly full, consider increasing max entries');
    }
    
    if (performance.sizeUtilizationRate > 90) {
      recs.push('Cache size is nearly full, consider increasing max size');
    }
    
    if (performance.evictionRate > 20) {
      recs.push('High eviction rate detected, consider optimizing cache policy');
    }
    
    if (performance.compressionEffectiveness < 30 && config.enableCompression) {
      recs.push('Low compression effectiveness, consider adjusting compression threshold');
    }
    
    if (recs.length === 0) {
      recs.push('Cache performance is optimal');
    }
    
    return recs;
  }, [performance, config]);
  
  return {
    performance,
    recommendations,
    isOptimal: performance.hitRate >= 80 && performance.evictionRate < 10,
    needsAttention: performance.hitRate < 50 || performance.evictionRate > 30
  };
};

// Utility function to create cache key
export const createCacheKey = (...parts: (string | number | boolean)[]): string => {
  return parts.map(part => String(part)).join(':');
};

// Utility function to throttle cache operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};