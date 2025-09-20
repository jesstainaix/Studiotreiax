import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAssetOptimizationStore,
  Asset,
  OptimizationTask,
  AssetOptimizationConfig,
  AssetOptimizationStats,
  AssetOptimizationMetrics,
  AssetOptimizationEvent,
  AssetOptimizationDebugLog,
  PreloadStrategy
} from '../utils/assetOptimization';

// Hook Options
export interface UseAssetOptimizationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableDebug?: boolean;
  autoOptimize?: boolean;
  filter?: {
    type?: Asset['type'];
    status?: Asset['status'];
    priority?: Asset['priority'];
  };
}

// Hook Return Type
export interface UseAssetOptimizationReturn {
  // State
  assets: Asset[];
  tasks: OptimizationTask[];
  config: AssetOptimizationConfig;
  stats: AssetOptimizationStats;
  metrics: AssetOptimizationMetrics;
  events: AssetOptimizationEvent[];
  debugLogs: AssetOptimizationDebugLog[];
  isOptimizing: boolean;
  isLoading: boolean;
  error: string | null;

  // Asset Management
  addAsset: (asset: Omit<Asset, 'id' | 'lastModified' | 'accessCount' | 'lastAccessed'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  getAsset: (id: string) => Asset | undefined;
  getAssetsByType: (type: Asset['type']) => Asset[];
  getAssetsByPriority: (priority: Asset['priority']) => Asset[];
  getAssetsByStatus: (status: Asset['status']) => Asset[];

  // Optimization
  optimizeAsset: (assetId: string, options?: { force?: boolean; quality?: number }) => Promise<void>;
  optimizeAssets: (assetIds: string[], options?: { batchSize?: number; concurrency?: number }) => Promise<void>;
  optimizeAll: (options?: { filter?: (asset: Asset) => boolean }) => Promise<void>;
  cancelOptimization: (taskId: string) => void;
  retryFailedOptimizations: () => Promise<void>;

  // Compression
  compressImage: (asset: Asset, format?: string, quality?: number) => Promise<Asset>;
  compressVideo: (asset: Asset, codec?: string, quality?: number) => Promise<Asset>;
  compressAudio: (asset: Asset, codec?: string, bitrate?: number) => Promise<Asset>;
  compressFont: (asset: Asset, subset?: string) => Promise<Asset>;
  compressScript: (asset: Asset, options?: { minify?: boolean; gzip?: boolean }) => Promise<Asset>;

  // Preloading
  preloadAsset: (assetId: string, priority?: number) => Promise<void>;
  preloadAssets: (assetIds: string[]) => Promise<void>;
  applyPreloadStrategy: (strategyId: string) => Promise<void>;
  createPreloadStrategy: (strategy: Omit<PreloadStrategy, 'id'>) => void;
  updatePreloadStrategy: (id: string, updates: Partial<PreloadStrategy>) => void;
  removePreloadStrategy: (id: string) => void;

  // Configuration
  updateConfig: (updates: Partial<AssetOptimizationConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;

  // Analytics
  getStats: () => AssetOptimizationStats;
  getMetrics: () => AssetOptimizationMetrics;
  calculateSavings: () => { size: number; bandwidth: number; time: number };
  generateReport: () => any;

  // Events
  addEvent: (event: Omit<AssetOptimizationEvent, 'id' | 'timestamp'>) => void;
  getEvents: (filter?: { type?: string; assetId?: string; limit?: number }) => AssetOptimizationEvent[];
  clearEvents: () => void;

  // Utilities
  clearCache: () => void;
  cleanup: () => void;
  validateAsset: (asset: Asset) => { valid: boolean; errors: string[] };
  estimateOptimization: (asset: Asset) => { estimatedSize: number; estimatedSavings: number; estimatedTime: number };

  // Quick Actions
  quickOptimize: (url: string, type: Asset['type']) => Promise<Asset>;
  quickPreload: (urls: string[]) => Promise<void>;
  quickCompress: (file: File, options?: { quality?: number; format?: string }) => Promise<Blob>;

  // Advanced Features
  createOptimizationPipeline: (steps: string[]) => Promise<void>;
  scheduleOptimization: (assetId: string, delay: number) => void;
  batchOptimize: (assets: Asset[], options?: { concurrency?: number }) => Promise<void>;
  smartOptimize: (asset: Asset) => Promise<Asset>;
  adaptiveQuality: (asset: Asset, targetSize: number) => Promise<Asset>;

  // System Operations
  start: () => void;
  stop: () => void;
  restart: () => void;
  getSystemInfo: () => any;
  checkHealth: () => { healthy: boolean; issues: string[] };

  // Debug
  addDebugLog: (log: Omit<AssetOptimizationDebugLog, 'id' | 'timestamp'>) => void;
  getDebugLogs: (filter?: { level?: string; limit?: number }) => AssetOptimizationDebugLog[];
  clearDebugLogs: () => void;
  enableDebug: () => void;
  disableDebug: () => void;

  // Computed Values
  filteredAssets: Asset[];
  activeTasks: OptimizationTask[];
  completedTasks: OptimizationTask[];
  failedTasks: OptimizationTask[];
  recentEvents: AssetOptimizationEvent[];
  compressionSummary: {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavings: number;
    averageRatio: number;
  };
  performanceMetrics: {
    optimizationRate: number;
    averageOptimizationTime: number;
    successRate: number;
    cacheEfficiency: number;
  };
}

// Main Hook
export const useAssetOptimization = (options: UseAssetOptimizationOptions = {}): UseAssetOptimizationReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    enableDebug = false,
    autoOptimize = false,
    filter
  } = options;

  // Store state
  const {
    assets,
    tasks,
    config,
    stats,
    metrics,
    events,
    debugLogs,
    isOptimizing,
    isLoading,
    error,
    // Actions
    addAsset,
    updateAsset,
    removeAsset,
    getAsset,
    getAssetsByType,
    getAssetsByPriority,
    getAssetsByStatus,
    optimizeAsset,
    optimizeAssets,
    optimizeAll,
    cancelOptimization,
    retryFailedOptimizations,
    compressImage,
    compressVideo,
    compressAudio,
    compressFont,
    compressScript,
    preloadAsset,
    preloadAssets,
    applyPreloadStrategy,
    createPreloadStrategy,
    updatePreloadStrategy,
    removePreloadStrategy,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    getStats,
    getMetrics,
    calculateSavings,
    generateReport,
    addEvent,
    getEvents,
    clearEvents,
    clearCache,
    cleanup,
    validateAsset,
    estimateOptimization,
    quickOptimize,
    quickPreload,
    quickCompress,
    createOptimizationPipeline,
    scheduleOptimization,
    batchOptimize,
    smartOptimize,
    adaptiveQuality,
    start,
    stop,
    restart,
    getSystemInfo,
    checkHealth,
    addDebugLog,
    getDebugLogs,
    clearDebugLogs,
    enableDebug: storeEnableDebug,
    disableDebug: storeDisableDebug
  } = useAssetOptimizationStore();

  // Local state for UI
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Debug mode effect
  useEffect(() => {
    if (enableDebug && !config.debug) {
      storeEnableDebug();
    } else if (!enableDebug && config.debug) {
      storeDisableDebug();
    }
  }, [enableDebug, config.debug, storeEnableDebug, storeDisableDebug]);

  // Auto-optimize effect
  useEffect(() => {
    if (autoOptimize && config.autoOptimize) {
      const pendingAssets = assets.filter(asset => asset.status === 'pending');
      if (pendingAssets.length > 0) {
        const assetIds = pendingAssets.slice(0, config.batchSize).map(asset => asset.id);
        optimizeAssets(assetIds);
      }
    }
  }, [autoOptimize, config.autoOptimize, config.batchSize, assets, optimizeAssets]);

  // Computed values
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    if (filter?.type) {
      filtered = filtered.filter(asset => asset.type === filter.type);
    }

    if (filter?.status) {
      filtered = filtered.filter(asset => asset.status === filter.status);
    }

    if (filter?.priority) {
      filtered = filtered.filter(asset => asset.priority === filter.priority);
    }

    return filtered;
  }, [assets, filter, refreshKey]);

  const activeTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'processing');
  }, [tasks, refreshKey]);

  const completedTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'completed');
  }, [tasks, refreshKey]);

  const failedTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'failed');
  }, [tasks, refreshKey]);

  const recentEvents = useMemo(() => {
    return events.slice(-20).reverse();
  }, [events, refreshKey]);

  const compressionSummary = useMemo(() => {
    const optimizedAssets = assets.filter(asset => asset.status === 'optimized' && asset.compressedSize);
    
    const totalOriginalSize = optimizedAssets.reduce((sum, asset) => sum + asset.size, 0);
    const totalCompressedSize = optimizedAssets.reduce((sum, asset) => sum + (asset.compressedSize || asset.size), 0);
    const totalSavings = totalOriginalSize - totalCompressedSize;
    const averageRatio = optimizedAssets.length > 0 
      ? optimizedAssets.reduce((sum, asset) => sum + (asset.compressionRatio || 0), 0) / optimizedAssets.length
      : 0;

    return {
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageRatio
    };
  }, [assets, refreshKey]);

  const performanceMetrics = useMemo(() => {
    const completedOptimizations = tasks.filter(task => task.status === 'completed' && task.endTime);
    const failedOptimizations = tasks.filter(task => task.status === 'failed');
    
    const optimizationRate = completedOptimizations.length > 0 
      ? completedOptimizations.length / (completedOptimizations.length + failedOptimizations.length)
      : 0;
    
    const averageOptimizationTime = completedOptimizations.length > 0
      ? completedOptimizations.reduce((sum, task) => 
          sum + ((task.endTime || task.startTime) - task.startTime), 0
        ) / completedOptimizations.length
      : 0;
    
    const successRate = tasks.length > 0
      ? completedOptimizations.length / tasks.length
      : 0;
    
    const cacheEfficiency = metrics.cachePerformance.hits + metrics.cachePerformance.misses > 0
      ? metrics.cachePerformance.hits / (metrics.cachePerformance.hits + metrics.cachePerformance.misses)
      : 0;

    return {
      optimizationRate,
      averageOptimizationTime,
      successRate,
      cacheEfficiency
    };
  }, [tasks, metrics, refreshKey]);

  // Enhanced debug functions
  const enhancedEnableDebug = useCallback(() => {
    storeEnableDebug();
    addDebugLog({
      level: 'info',
      message: 'Debug mode enabled via hook'
    });
  }, [storeEnableDebug, addDebugLog]);

  const enhancedDisableDebug = useCallback(() => {
    addDebugLog({
      level: 'info',
      message: 'Debug mode disabled via hook'
    });
    storeDisableDebug();
  }, [storeDisableDebug, addDebugLog]);

  return {
    // State
    assets,
    tasks,
    config,
    stats,
    metrics,
    events,
    debugLogs,
    isOptimizing,
    isLoading,
    error,

    // Asset Management
    addAsset,
    updateAsset,
    removeAsset,
    getAsset,
    getAssetsByType,
    getAssetsByPriority,
    getAssetsByStatus,

    // Optimization
    optimizeAsset,
    optimizeAssets,
    optimizeAll,
    cancelOptimization,
    retryFailedOptimizations,

    // Compression
    compressImage,
    compressVideo,
    compressAudio,
    compressFont,
    compressScript,

    // Preloading
    preloadAsset,
    preloadAssets,
    applyPreloadStrategy,
    createPreloadStrategy,
    updatePreloadStrategy,
    removePreloadStrategy,

    // Configuration
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,

    // Analytics
    getStats,
    getMetrics,
    calculateSavings,
    generateReport,

    // Events
    addEvent,
    getEvents,
    clearEvents,

    // Utilities
    clearCache,
    cleanup,
    validateAsset,
    estimateOptimization,

    // Quick Actions
    quickOptimize,
    quickPreload,
    quickCompress,

    // Advanced Features
    createOptimizationPipeline,
    scheduleOptimization,
    batchOptimize,
    smartOptimize,
    adaptiveQuality,

    // System Operations
    start,
    stop,
    restart,
    getSystemInfo,
    checkHealth,

    // Debug
    addDebugLog,
    getDebugLogs,
    clearDebugLogs,
    enableDebug: enhancedEnableDebug,
    disableDebug: enhancedDisableDebug,

    // Computed Values
    filteredAssets,
    activeTasks,
    completedTasks,
    failedTasks,
    recentEvents,
    compressionSummary,
    performanceMetrics
  };
};

// Specialized Hooks
export const useAssetOptimizationStats = () => {
  const { stats, getStats } = useAssetOptimization();
  
  const refreshStats = useCallback(() => {
    return getStats();
  }, [getStats]);

  return {
    stats,
    refreshStats
  };
};

export const useAssetOptimizationConfig = () => {
  const { config, updateConfig, resetConfig, exportConfig, importConfig } = useAssetOptimization();
  
  return {
    config,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig
  };
};

export const useAssetOptimizationAssets = (filter?: UseAssetOptimizationOptions['filter']) => {
  const { 
    filteredAssets, 
    addAsset, 
    updateAsset, 
    removeAsset, 
    getAsset,
    getAssetsByType,
    getAssetsByPriority,
    getAssetsByStatus
  } = useAssetOptimization({ filter });
  
  return {
    assets: filteredAssets,
    addAsset,
    updateAsset,
    removeAsset,
    getAsset,
    getAssetsByType,
    getAssetsByPriority,
    getAssetsByStatus
  };
};

export const useAssetOptimizationTasks = () => {
  const { 
    tasks, 
    activeTasks, 
    completedTasks, 
    failedTasks,
    cancelOptimization,
    retryFailedOptimizations
  } = useAssetOptimization();
  
  return {
    tasks,
    activeTasks,
    completedTasks,
    failedTasks,
    cancelOptimization,
    retryFailedOptimizations
  };
};

export const useAssetOptimizationEvents = () => {
  const { events, recentEvents, addEvent, getEvents, clearEvents } = useAssetOptimization();
  
  return {
    events,
    recentEvents,
    addEvent,
    getEvents,
    clearEvents
  };
};

export const useAssetOptimizationMetrics = () => {
  const { 
    metrics, 
    compressionSummary, 
    performanceMetrics,
    calculateSavings,
    generateReport
  } = useAssetOptimization();
  
  return {
    metrics,
    compressionSummary,
    performanceMetrics,
    calculateSavings,
    generateReport
  };
};

export const useAssetOptimizationDebug = () => {
  const { 
    debugLogs, 
    addDebugLog, 
    getDebugLogs, 
    clearDebugLogs,
    enableDebug,
    disableDebug,
    config
  } = useAssetOptimization();
  
  return {
    debugLogs,
    addDebugLog,
    getDebugLogs,
    clearDebugLogs,
    enableDebug,
    disableDebug,
    isDebugEnabled: config.debug
  };
};

// Utility Hooks
export const useThrottle = <T>(value: T, delay: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useAssetUpload = () => {
  const { addAsset, quickOptimize } = useAssetOptimization();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAsset = useCallback(async (file: File, options?: {
    autoOptimize?: boolean;
    priority?: Asset['priority'];
    loadStrategy?: Asset['loadStrategy'];
  }) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const assetType: Asset['type'] = file.type.startsWith('image/') ? 'image' :
                                      file.type.startsWith('video/') ? 'video' :
                                      file.type.startsWith('audio/') ? 'audio' :
                                      file.type.startsWith('font/') ? 'font' :
                                      'document';

      const asset = {
        url: URL.createObjectURL(file),
        type: assetType,
        size: file.size,
        format: file.type,
        quality: 100,
        priority: options?.priority || 'medium',
        loadStrategy: options?.loadStrategy || 'lazy',
        status: 'pending' as const
      };

      if (options?.autoOptimize) {
        await quickOptimize(asset.url, asset.type);
      } else {
        addAsset(asset);
      }

      return asset;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [addAsset, quickOptimize]);

  return {
    uploadAsset,
    isUploading,
    uploadProgress
  };
};

export const useAssetPreloader = () => {
  const { preloadAsset, preloadAssets, applyPreloadStrategy } = useAssetOptimization();
  const [preloadingAssets, setPreloadingAssets] = useState<Set<string>>(new Set());

  const preloadWithTracking = useCallback(async (assetId: string, priority?: number) => {
    setPreloadingAssets(prev => new Set(prev).add(assetId));
    
    try {
      await preloadAsset(assetId, priority);
    } finally {
      setPreloadingAssets(prev => {
        const newSet = new Set(prev);
        newSet.delete(assetId);
        return newSet;
      });
    }
  }, [preloadAsset]);

  const preloadMultipleWithTracking = useCallback(async (assetIds: string[]) => {
    const newPreloading = new Set(preloadingAssets);
    assetIds.forEach(id => newPreloading.add(id));
    setPreloadingAssets(newPreloading);
    
    try {
      await preloadAssets(assetIds);
    } finally {
      setPreloadingAssets(prev => {
        const newSet = new Set(prev);
        assetIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [preloadAssets, preloadingAssets]);

  return {
    preloadAsset: preloadWithTracking,
    preloadAssets: preloadMultipleWithTracking,
    applyPreloadStrategy,
    preloadingAssets: Array.from(preloadingAssets),
    isPreloading: preloadingAssets.size > 0
  };
};

export const useAssetPerformance = () => {
  const { performanceMetrics, calculateSavings, checkHealth } = useAssetOptimization();
  const [performanceHistory, setPerformanceHistory] = useState<Array<{
    timestamp: number;
    metrics: typeof performanceMetrics;
    savings: ReturnType<typeof calculateSavings>;
    health: ReturnType<typeof checkHealth>;
  }>>([]);

  const recordPerformance = useCallback(() => {
    const record = {
      timestamp: Date.now(),
      metrics: performanceMetrics,
      savings: calculateSavings(),
      health: checkHealth()
    };

    setPerformanceHistory(prev => {
      const newHistory = [...prev, record];
      // Keep only last 100 records
      return newHistory.slice(-100);
    });

    return record;
  }, [performanceMetrics, calculateSavings, checkHealth]);

  // Auto-record performance every minute
  useEffect(() => {
    const interval = setInterval(recordPerformance, 60000);
    return () => clearInterval(interval);
  }, [recordPerformance]);

  return {
    currentMetrics: performanceMetrics,
    performanceHistory,
    recordPerformance,
    getPerformanceTrend: (metric: keyof typeof performanceMetrics) => {
      if (performanceHistory.length < 2) return 'stable';
      
      const recent = performanceHistory.slice(-5);
      const values = recent.map(record => record.metrics[metric]);
      const trend = values[values.length - 1] - values[0];
      
      return trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable';
    }
  };
};

// Helper Functions
const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

export { throttle, debounce };