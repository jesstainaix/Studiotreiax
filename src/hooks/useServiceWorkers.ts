import { useEffect, useCallback, useMemo, useState } from 'react';
import { 
  useServiceWorkerStore,
  ServiceWorkerConfig,
  CacheStrategy,
  OfflineQueue,
  SyncTask,
  ServiceWorkerStats,
  ServiceWorkerMetrics,
  ServiceWorkerEvent,
  ServiceWorkerDebugLog
} from '../utils/serviceWorkers';

// Hook Options
export interface UseServiceWorkersOptions {
  autoRegister?: boolean;
  enableDebug?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
  onStatusChange?: (isRegistered: boolean) => void;
  onOfflineChange?: (isOffline: boolean) => void;
}

// Hook Return Type
export interface UseServiceWorkersReturn {
  // State
  isRegistered: boolean;
  isOnline: boolean;
  config: ServiceWorkerConfig;
  stats: ServiceWorkerStats;
  metrics: ServiceWorkerMetrics;
  cacheEntries: any[];
  offlineQueue: OfflineQueue[];
  syncTasks: SyncTask[];
  events: ServiceWorkerEvent[];
  debugLogs: ServiceWorkerDebugLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  updateConfig: (config: Partial<ServiceWorkerConfig>) => void;
  addCacheStrategy: (strategy: CacheStrategy) => void;
  removeCacheStrategy: (id: string) => void;
  clearCache: (pattern?: string) => Promise<void>;
  addToOfflineQueue: (request: Omit<OfflineQueue, 'id' | 'timestamp' | 'retries' | 'status'>) => void;
  processOfflineQueue: () => Promise<void>;
  addSyncTask: (task: Omit<SyncTask, 'id' | 'timestamp' | 'status' | 'progress' | 'retries'>) => void;
  processSyncTasks: () => Promise<void>;

  // Quick Actions
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  enableBackgroundSync: () => void;
  disableBackgroundSync: () => void;
  clearAllCaches: () => Promise<void>;
  retryFailedTasks: () => Promise<void>;

  // Analytics
  getStats: () => ServiceWorkerStats;
  getMetrics: () => ServiceWorkerMetrics;
  analyzePerformance: () => any;
  generateReport: () => any;

  // Utilities
  getCacheEntry: (url: string) => any | null;
  getOfflineQueueItem: (id: string) => OfflineQueue | null;
  getSyncTask: (id: string) => SyncTask | null;
  exportData: () => any;
  importData: (data: any) => void;
  reset: () => void;

  // Advanced Features
  preloadResources: (urls: string[]) => Promise<void>;
  optimizeCache: () => Promise<void>;
  checkForUpdates: () => Promise<boolean>;
  installUpdate: () => Promise<void>;

  // System Operations
  skipWaiting: () => Promise<void>;
  claimClients: () => Promise<void>;

  // Debug
  enableDebug: () => void;
  disableDebug: () => void;
  getDebugInfo: () => any;

  // Computed Values
  cacheHitRate: number;
  offlineQueueSize: number;
  activeSyncTasks: number;
  totalCacheSize: number;
  recentErrors: ServiceWorkerDebugLog[];
  isOfflineMode: boolean;
  hasUpdates: boolean;
}

// Main Hook
export const useServiceWorkers = (options: UseServiceWorkersOptions = {}): UseServiceWorkersReturn => {
  const {
    autoRegister = true,
    enableDebug = false,
    refreshInterval = 5000,
    onError,
    onStatusChange,
    onOfflineChange
  } = options;

  const {
    isRegistered,
    isOnline,
    config,
    stats,
    metrics,
    cacheEntries,
    offlineQueue,
    syncTasks,
    events,
    debugLogs,
    isLoading,
    error,
    register,
    unregister,
    updateConfig,
    addCacheStrategy,
    removeCacheStrategy,
    clearCache,
    addToOfflineQueue,
    processOfflineQueue,
    addSyncTask,
    processSyncTasks,
    getStats,
    getMetrics,
    getCacheEntry,
    getOfflineQueueItem,
    getSyncTask,
    exportData,
    importData,
    reset,
    enableOfflineMode,
    disableOfflineMode,
    enableBackgroundSync,
    disableBackgroundSync,
    clearAllCaches,
    retryFailedTasks,
    preloadResources,
    optimizeCache,
    analyzePerformance,
    generateReport,
    checkForUpdates,
    installUpdate,
    skipWaiting,
    claimClients,
    enableDebug: enableDebugMode,
    disableDebug: disableDebugMode,
    getDebugInfo
  } = useServiceWorkerStore();

  const [hasUpdates, setHasUpdates] = useState(false);

  // Auto-register on mount
  useEffect(() => {
    if (autoRegister && !isRegistered) {
      register();
    }
  }, [autoRegister, isRegistered, register]);

  // Enable debug mode if requested
  useEffect(() => {
    if (enableDebug && !config.debug) {
      enableDebugMode();
    }
  }, [enableDebug, config.debug, enableDebugMode]);

  // Error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Status change callback
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(isRegistered);
    }
  }, [isRegistered, onStatusChange]);

  // Offline change callback
  useEffect(() => {
    if (onOfflineChange) {
      onOfflineChange(!isOnline);
    }
  }, [isOnline, onOfflineChange]);

  // Auto-refresh stats
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        getStats();
        getMetrics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, getStats, getMetrics]);

  // Check for updates periodically
  useEffect(() => {
    const checkUpdates = async () => {
      const updates = await checkForUpdates();
      setHasUpdates(updates);
    };

    const interval = setInterval(checkUpdates, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Computed values
  const cacheHitRate = useMemo(() => {
    return stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 0;
  }, [stats.cacheHits, stats.totalRequests]);

  const offlineQueueSize = useMemo(() => {
    return offlineQueue.filter(item => item.status === 'pending').length;
  }, [offlineQueue]);

  const activeSyncTasks = useMemo(() => {
    return syncTasks.filter(task => task.status === 'pending' || task.status === 'processing').length;
  }, [syncTasks]);

  const totalCacheSize = useMemo(() => {
    return cacheEntries.reduce((total, entry) => total + (entry.size || 0), 0);
  }, [cacheEntries]);

  const recentErrors = useMemo(() => {
    return debugLogs.filter(log => log.level === 'error').slice(0, 10);
  }, [debugLogs]);

  const isOfflineMode = useMemo(() => {
    return config.offlineMode && !isOnline;
  }, [config.offlineMode, isOnline]);

  return {
    // State
    isRegistered,
    isOnline,
    config,
    stats,
    metrics,
    cacheEntries,
    offlineQueue,
    syncTasks,
    events,
    debugLogs,
    isLoading,
    error,

    // Actions
    register,
    unregister,
    updateConfig,
    addCacheStrategy,
    removeCacheStrategy,
    clearCache,
    addToOfflineQueue,
    processOfflineQueue,
    addSyncTask,
    processSyncTasks,

    // Quick Actions
    enableOfflineMode,
    disableOfflineMode,
    enableBackgroundSync,
    disableBackgroundSync,
    clearAllCaches,
    retryFailedTasks,

    // Analytics
    getStats,
    getMetrics,
    analyzePerformance,
    generateReport,

    // Utilities
    getCacheEntry,
    getOfflineQueueItem,
    getSyncTask,
    exportData,
    importData,
    reset,

    // Advanced Features
    preloadResources,
    optimizeCache,
    checkForUpdates,
    installUpdate,

    // System Operations
    skipWaiting,
    claimClients,

    // Debug
    enableDebug: enableDebugMode,
    disableDebug: disableDebugMode,
    getDebugInfo,

    // Computed Values
    cacheHitRate,
    offlineQueueSize,
    activeSyncTasks,
    totalCacheSize,
    recentErrors,
    isOfflineMode,
    hasUpdates
  };
};

// Specialized Hooks
export const useServiceWorkerStats = () => {
  const { stats, getStats } = useServiceWorkerStore();
  
  useEffect(() => {
    const interval = setInterval(getStats, 5000);
    return () => clearInterval(interval);
  }, [getStats]);
  
  return stats;
};

export const useServiceWorkerConfig = () => {
  const { config, updateConfig } = useServiceWorkerStore();
  
  const updateSetting = useCallback((key: keyof ServiceWorkerConfig, value: any) => {
    updateConfig({ [key]: value });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    updateSetting
  };
};

export const useOfflineQueue = () => {
  const { 
    offlineQueue, 
    addToOfflineQueue, 
    processOfflineQueue, 
    removeOfflineQueueItem,
    updateOfflineQueueItem
  } = useServiceWorkerStore();
  
  const pendingItems = useMemo(() => 
    offlineQueue.filter(item => item.status === 'pending'), 
    [offlineQueue]
  );
  
  const failedItems = useMemo(() => 
    offlineQueue.filter(item => item.status === 'failed'), 
    [offlineQueue]
  );
  
  return {
    offlineQueue,
    pendingItems,
    failedItems,
    addToOfflineQueue,
    processOfflineQueue,
    removeOfflineQueueItem,
    updateOfflineQueueItem
  };
};

export const useSyncTasks = () => {
  const { 
    syncTasks, 
    addSyncTask, 
    processSyncTasks, 
    removeSyncTask,
    updateSyncTask
  } = useServiceWorkerStore();
  
  const pendingTasks = useMemo(() => 
    syncTasks.filter(task => task.status === 'pending'), 
    [syncTasks]
  );
  
  const activeTasks = useMemo(() => 
    syncTasks.filter(task => task.status === 'processing'), 
    [syncTasks]
  );
  
  const completedTasks = useMemo(() => 
    syncTasks.filter(task => task.status === 'completed'), 
    [syncTasks]
  );
  
  return {
    syncTasks,
    pendingTasks,
    activeTasks,
    completedTasks,
    addSyncTask,
    processSyncTasks,
    removeSyncTask,
    updateSyncTask
  };
};

export const useServiceWorkerEvents = () => {
  const { events, addEvent, clearEvents } = useServiceWorkerStore();
  
  const recentEvents = useMemo(() => 
    events.slice(0, 50), 
    [events]
  );
  
  const errorEvents = useMemo(() => 
    events.filter(event => event.type === 'error'), 
    [events]
  );
  
  return {
    events,
    recentEvents,
    errorEvents,
    addEvent,
    clearEvents
  };
};

export const useServiceWorkerDebug = () => {
  const { 
    debugLogs, 
    addDebugLog, 
    clearDebugLogs, 
    enableDebug, 
    disableDebug, 
    getDebugInfo,
    config
  } = useServiceWorkerStore();
  
  const recentLogs = useMemo(() => 
    debugLogs.slice(0, 100), 
    [debugLogs]
  );
  
  const errorLogs = useMemo(() => 
    debugLogs.filter(log => log.level === 'error'), 
    [debugLogs]
  );
  
  const warningLogs = useMemo(() => 
    debugLogs.filter(log => log.level === 'warn'), 
    [debugLogs]
  );
  
  return {
    debugLogs,
    recentLogs,
    errorLogs,
    warningLogs,
    isDebugEnabled: config.debug,
    addDebugLog,
    clearDebugLogs,
    enableDebug,
    disableDebug,
    getDebugInfo
  };
};

// Utility Hooks
export const useThrottle = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const [lastCall, setLastCall] = useState(0);
  
  return useCallback((...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      setLastCall(now);
      callback(...args);
    }
  }, [callback, delay, lastCall]);
};

export const useDebounce = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);
};

export const useOnlineStatus = () => {
  const { isOnline } = useServiceWorkerStore();
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Connection restored
      setWasOffline(false);
    }
  }, [isOnline, wasOffline]);
  
  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    connectionRestored: wasOffline && isOnline
  };
};

export const useCacheManagement = () => {
  const { 
    cacheEntries, 
    clearCache, 
    optimizeCache, 
    config,
    addCacheStrategy,
    removeCacheStrategy
  } = useServiceWorkerStore();
  
  const cacheSize = useMemo(() => 
    cacheEntries.reduce((total, entry) => total + (entry.size || 0), 0), 
    [cacheEntries]
  );
  
  const cacheStrategies = useMemo(() => 
    config.strategies, 
    [config.strategies]
  );
  
  const expiredEntries = useMemo(() => {
    const now = Date.now();
    return cacheEntries.filter(entry => {
      const strategy = config.strategies.find(s => s.pattern.test(entry.url));
      return strategy && (now - entry.timestamp) > strategy.maxAge;
    });
  }, [cacheEntries, config.strategies]);
  
  return {
    cacheEntries,
    cacheSize,
    cacheStrategies,
    expiredEntries,
    clearCache,
    optimizeCache,
    addCacheStrategy,
    removeCacheStrategy
  };
};

export const useServiceWorkerPerformance = () => {
  const { stats, metrics, analyzePerformance, generateReport } = useServiceWorkerStore();
  
  const performance = useMemo(() => analyzePerformance(), [analyzePerformance]);
  
  const cacheEfficiency = useMemo(() => {
    return stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 0;
  }, [stats.cacheHits, stats.totalRequests]);
  
  const averageResponseTime = useMemo(() => {
    return metrics.responseTime.length > 0 ? 
      metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length : 0;
  }, [metrics.responseTime]);
  
  return {
    stats,
    metrics,
    performance,
    cacheEfficiency,
    averageResponseTime,
    generateReport
  };
};

// Helper functions
const throttle = <T extends any[]>(func: (...args: T) => void, delay: number) => {
  let lastCall = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

const debounce = <T extends any[]>(func: (...args: T) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export { throttle, debounce };