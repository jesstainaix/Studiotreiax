import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  useIncrementalBackupStore,
  BackupSnapshot,
  BackupPolicy,
  BackupDestination,
  RestoreOperation,
  BackupConfig,
  BackupStats,
  BackupMetrics
} from '../services/incrementalBackupService';

// Utility functions for throttling and debouncing
const throttle = <T extends (...args: any[]) => any>(
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
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Progress tracking hook
export const useBackupProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const startProgress = useCallback(() => {
    setIsActive(true);
    setProgress(0);
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsActive(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  }, []);
  
  const stopProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setProgress(100);
  }, []);
  
  const resetProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setProgress(0);
  }, []);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return {
    progress,
    isActive,
    startProgress,
    stopProgress,
    resetProgress
  };
};

// Main hook
export const useIncrementalBackup = () => {
  const store = useIncrementalBackupStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-initialize and refresh
  useEffect(() => {
    store.initialize();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        store.refreshStats();
        store.refreshMetrics();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    createSnapshot: store.createSnapshot,
    deleteSnapshot: store.deleteSnapshot,
    restoreSnapshot: store.restoreSnapshot,
    cancelOperation: store.cancelOperation,
    createPolicy: store.createPolicy,
    updatePolicy: store.updatePolicy,
    deletePolicy: store.deletePolicy,
    enablePolicy: store.enablePolicy,
    addDestination: store.addDestination,
    updateDestination: store.updateDestination,
    removeDestination: store.removeDestination,
    testDestination: store.testDestination,
    syncDestination: store.syncDestination,
    verifySnapshot: store.verifySnapshot,
    repairSnapshot: store.repairSnapshot,
    optimizeStorage: store.optimizeStorage,
    cleanupOldSnapshots: store.cleanupOldSnapshots,
    exportSnapshot: store.exportSnapshot,
    importSnapshot: store.importSnapshot,
    updateConfig: store.updateConfig,
    refreshStats: store.refreshStats,
    refreshMetrics: store.refreshMetrics
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickBackup: async (type: 'full' | 'incremental' | 'differential' = 'incremental') => {
      try {
        return await actions.createSnapshot(type, `Quick ${type} backup`);
      } catch (error) {
        console.error('Quick backup failed:', error);
        return false;
      }
    },
    
    quickRestore: async (snapshotId: string, targetPath: string = '/restore') => {
      try {
        return await actions.restoreSnapshot(snapshotId, targetPath);
      } catch (error) {
        console.error('Quick restore failed:', error);
        return false;
      }
    },
    
    quickCleanup: async () => {
      try {
        return await actions.cleanupOldSnapshots();
      } catch (error) {
        console.error('Quick cleanup failed:', error);
        return false;
      }
    },
    
    quickOptimize: async () => {
      try {
        return await actions.optimizeStorage();
      } catch (error) {
        console.error('Quick optimize failed:', error);
        return false;
      }
    }
  }), [actions]);
  
  // Throttled and debounced actions
  const throttledRefresh = useCallback(
    throttle(() => {
      store.refreshStats();
      store.refreshMetrics();
    }, 5000),
    [store]
  );
  
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      store.setSearchQuery(query);
    }, 300),
    [store]
  );
  
  // Enhanced computed values
  const computedValues = useMemo(() => {
    const { snapshots, policies, destinations, stats, metrics } = store;
    
    return {
      // Backup statistics
      totalBackups: snapshots.length,
      successfulBackups: snapshots.filter(s => s.status === 'completed').length,
      failedBackups: snapshots.filter(s => s.status === 'failed').length,
      runningBackups: snapshots.filter(s => s.status === 'running').length,
      
      // Policy statistics
      activePolicies: policies.filter(p => p.enabled).length,
      totalPolicies: policies.length,
      
      // Destination statistics
      connectedDestinations: destinations.filter(d => d.status === 'connected').length,
      totalDestinations: destinations.length,
      
      // Storage statistics
      totalStorageUsed: stats.totalSize,
      storageAfterCompression: stats.compressedSize,
      compressionSavings: stats.totalSize - stats.compressedSize,
      compressionRatio: stats.totalSize > 0 ? (stats.compressedSize / stats.totalSize) * 100 : 0,
      
      // Performance metrics
      averageBackupSpeed: metrics.performance.backupSpeed,
      averageRestoreSpeed: metrics.performance.restoreSpeed,
      systemHealth: (metrics.reliability.uptime + metrics.reliability.dataIntegrity) / 2,
      
      // Recent activity
      recentSnapshots: snapshots.slice(0, 5),
      recentFailures: snapshots.filter(s => s.status === 'failed').slice(0, 3),
      
      // Trends
      backupTrend: calculateBackupTrend(snapshots),
      storageTrend: calculateStorageTrend(snapshots),
      performanceTrend: calculatePerformanceTrend(snapshots)
    };
  }, [store]);
  
  // Filtered data
  const filteredData = useMemo(() => {
    const { filteredSnapshots, filteredPolicies, activeDestinations } = store;
    
    return {
      snapshots: filteredSnapshots,
      policies: filteredPolicies,
      destinations: activeDestinations,
      
      // Grouped data
      snapshotsByType: {
        full: filteredSnapshots.filter(s => s.type === 'full'),
        incremental: filteredSnapshots.filter(s => s.type === 'incremental'),
        differential: filteredSnapshots.filter(s => s.type === 'differential')
      },
      
      snapshotsByStatus: {
        completed: filteredSnapshots.filter(s => s.status === 'completed'),
        running: filteredSnapshots.filter(s => s.status === 'running'),
        failed: filteredSnapshots.filter(s => s.status === 'failed'),
        pending: filteredSnapshots.filter(s => s.status === 'pending'),
        cancelled: filteredSnapshots.filter(s => s.status === 'cancelled')
      },
      
      policiesBySchedule: {
        manual: filteredPolicies.filter(p => p.schedule.frequency === 'manual'),
        hourly: filteredPolicies.filter(p => p.schedule.frequency === 'hourly'),
        daily: filteredPolicies.filter(p => p.schedule.frequency === 'daily'),
        weekly: filteredPolicies.filter(p => p.schedule.frequency === 'weekly'),
        monthly: filteredPolicies.filter(p => p.schedule.frequency === 'monthly')
      }
    };
  }, [store]);
  
  return {
    // State
    ...store,
    
    // Computed values
    ...computedValues,
    
    // Filtered data
    ...filteredData,
    
    // Actions
    ...actions,
    
    // Quick actions
    ...quickActions,
    
    // Utilities
    throttledRefresh,
    debouncedSearch,
    setAutoRefresh,
    autoRefresh
  };
};

// Specialized hooks
export const useBackupStats = (): BackupStats & { isLoading: boolean } => {
  const { stats, isLoading } = useIncrementalBackupStore();
  return { ...stats, isLoading };
};

export const useBackupConfig = () => {
  const { config, updateConfig } = useIncrementalBackupStore();
  
  const updateGeneralConfig = useCallback((updates: Partial<BackupConfig['general']>) => {
    updateConfig({ general: { ...config.general, ...updates } });
  }, [config.general, updateConfig]);
  
  const updateMonitoringConfig = useCallback((updates: Partial<BackupConfig['monitoring']>) => {
    updateConfig({ monitoring: { ...config.monitoring, ...updates } });
  }, [config.monitoring, updateConfig]);
  
  const updatePerformanceConfig = useCallback((updates: Partial<BackupConfig['performance']>) => {
    updateConfig({ performance: { ...config.performance, ...updates } });
  }, [config.performance, updateConfig]);
  
  const updateSecurityConfig = useCallback((updates: Partial<BackupConfig['security']>) => {
    updateConfig({ security: { ...config.security, ...updates } });
  }, [config.security, updateConfig]);
  
  return {
    config,
    updateConfig,
    updateGeneralConfig,
    updateMonitoringConfig,
    updatePerformanceConfig,
    updateSecurityConfig
  };
};

export const useBackupSearch = () => {
  const {
    searchQuery,
    selectedPolicy,
    selectedDestination,
    sortBy,
    viewMode,
    setSearchQuery,
    setSelectedPolicy,
    setSelectedDestination,
    setSortBy,
    setViewMode
  } = useIncrementalBackupStore();
  
  const debouncedSetSearchQuery = useCallback(
    debounce(setSearchQuery, 300),
    [setSearchQuery]
  );
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPolicy('all');
    setSelectedDestination('all');
  }, [setSearchQuery, setSelectedPolicy, setSelectedDestination]);
  
  return {
    searchQuery,
    selectedPolicy,
    selectedDestination,
    sortBy,
    viewMode,
    setSearchQuery: debouncedSetSearchQuery,
    setSelectedPolicy,
    setSelectedDestination,
    setSortBy,
    setViewMode,
    clearFilters
  };
};

export const useBackupSnapshots = () => {
  const {
    snapshots,
    filteredSnapshots,
    currentSnapshot,
    createSnapshot,
    deleteSnapshot,
    verifySnapshot,
    repairSnapshot,
    exportSnapshot
  } = useIncrementalBackupStore();
  
  const getSnapshotById = useCallback((id: string) => {
    return snapshots.find(snapshot => snapshot.id === id);
  }, [snapshots]);
  
  const getSnapshotsByType = useCallback((type: BackupSnapshot['type']) => {
    return snapshots.filter(snapshot => snapshot.type === type);
  }, [snapshots]);
  
  const getSnapshotsByStatus = useCallback((status: BackupSnapshot['status']) => {
    return snapshots.filter(snapshot => snapshot.status === status);
  }, [snapshots]);
  
  return {
    snapshots,
    filteredSnapshots,
    currentSnapshot,
    createSnapshot,
    deleteSnapshot,
    verifySnapshot,
    repairSnapshot,
    exportSnapshot,
    getSnapshotById,
    getSnapshotsByType,
    getSnapshotsByStatus
  };
};

export const useBackupPolicies = () => {
  const {
    policies,
    filteredPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    enablePolicy
  } = useIncrementalBackupStore();
  
  const getPolicyById = useCallback((id: string) => {
    return policies.find(policy => policy.id === id);
  }, [policies]);
  
  const getActivePolicies = useCallback(() => {
    return policies.filter(policy => policy.enabled);
  }, [policies]);
  
  const getPoliciesByFrequency = useCallback((frequency: BackupPolicy['schedule']['frequency']) => {
    return policies.filter(policy => policy.schedule.frequency === frequency);
  }, [policies]);
  
  return {
    policies,
    filteredPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    enablePolicy,
    getPolicyById,
    getActivePolicies,
    getPoliciesByFrequency
  };
};

export const useBackupDestinations = () => {
  const {
    destinations,
    activeDestinations,
    addDestination,
    updateDestination,
    removeDestination,
    testDestination,
    syncDestination
  } = useIncrementalBackupStore();
  
  const getDestinationById = useCallback((id: string) => {
    return destinations.find(destination => destination.id === id);
  }, [destinations]);
  
  const getDestinationsByType = useCallback((type: BackupDestination['type']) => {
    return destinations.filter(destination => destination.type === type);
  }, [destinations]);
  
  const getConnectedDestinations = useCallback(() => {
    return destinations.filter(destination => destination.status === 'connected');
  }, [destinations]);
  
  return {
    destinations,
    activeDestinations,
    addDestination,
    updateDestination,
    removeDestination,
    testDestination,
    syncDestination,
    getDestinationById,
    getDestinationsByType,
    getConnectedDestinations
  };
};

export const useBackupRestore = () => {
  const {
    restoreOperations,
    currentRestore,
    restoreSnapshot,
    cancelOperation
  } = useIncrementalBackupStore();
  
  const getRestoreById = useCallback((id: string) => {
    return restoreOperations.find(restore => restore.id === id);
  }, [restoreOperations]);
  
  const getActiveRestores = useCallback(() => {
    return restoreOperations.filter(restore => restore.status === 'running');
  }, [restoreOperations]);
  
  const getCompletedRestores = useCallback(() => {
    return restoreOperations.filter(restore => restore.status === 'completed');
  }, [restoreOperations]);
  
  return {
    restoreOperations,
    currentRestore,
    restoreSnapshot,
    cancelOperation,
    getRestoreById,
    getActiveRestores,
    getCompletedRestores
  };
};

export const useBackupMetrics = (): BackupMetrics & { isLoading: boolean } => {
  const { metrics, isLoading } = useIncrementalBackupStore();
  return { ...metrics, isLoading };
};

// Utility hooks
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useCallback(throttle(callback, delay), [callback, delay]);
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useCallback(debounce(callback, delay), [callback, delay]);
};

// Helper functions
const calculateBackupTrend = (snapshots: BackupSnapshot[]): 'up' | 'down' | 'stable' => {
  if (snapshots.length < 2) return 'stable';
  
  const recent = snapshots.slice(0, 5);
  const older = snapshots.slice(5, 10);
  
  const recentSuccess = recent.filter(s => s.status === 'completed').length / recent.length;
  const olderSuccess = older.length > 0 ? older.filter(s => s.status === 'completed').length / older.length : recentSuccess;
  
  if (recentSuccess > olderSuccess + 0.1) return 'up';
  if (recentSuccess < olderSuccess - 0.1) return 'down';
  return 'stable';
};

const calculateStorageTrend = (snapshots: BackupSnapshot[]): 'up' | 'down' | 'stable' => {
  if (snapshots.length < 2) return 'stable';
  
  const recent = snapshots.slice(0, 5);
  const older = snapshots.slice(5, 10);
  
  const recentAvgSize = recent.reduce((sum, s) => sum + s.size, 0) / recent.length;
  const olderAvgSize = older.length > 0 ? older.reduce((sum, s) => sum + s.size, 0) / older.length : recentAvgSize;
  
  if (recentAvgSize > olderAvgSize * 1.1) return 'up';
  if (recentAvgSize < olderAvgSize * 0.9) return 'down';
  return 'stable';
};

const calculatePerformanceTrend = (snapshots: BackupSnapshot[]): 'up' | 'down' | 'stable' => {
  if (snapshots.length < 2) return 'stable';
  
  const recent = snapshots.slice(0, 5);
  const older = snapshots.slice(5, 10);
  
  const recentAvgDuration = recent.reduce((sum, s) => sum + s.duration, 0) / recent.length;
  const olderAvgDuration = older.length > 0 ? older.reduce((sum, s) => sum + s.duration, 0) / older.length : recentAvgDuration;
  
  if (recentAvgDuration < olderAvgDuration * 0.9) return 'up'; // Faster is better
  if (recentAvgDuration > olderAvgDuration * 1.1) return 'down'; // Slower is worse
  return 'stable';
};

export const calculateBackupComplexity = (snapshots: BackupSnapshot[], policies: BackupPolicy[]): 'low' | 'medium' | 'high' => {
  const snapshotCount = snapshots.length;
  const policyCount = policies.length;
  const activePolicyCount = policies.filter(p => p.enabled).length;
  
  const complexity = snapshotCount * 0.1 + policyCount * 2 + activePolicyCount * 3;
  
  if (complexity < 10) return 'low';
  if (complexity < 25) return 'medium';
  return 'high';
};

export default useIncrementalBackup;