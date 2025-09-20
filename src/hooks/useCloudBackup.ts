import { useEffect, useCallback, useMemo } from 'react';
import { 
  useCloudBackupStore, 
  backupManager,
  type BackupVersion,
  type CloudProvider,
  type BackupConfig,
  type SyncStatus
} from '../utils/cloudBackup';

// Hook Options
export interface UseCloudBackupOptions {
  autoInit?: boolean;
  enableAutoBackup?: boolean;
  syncOnMount?: boolean;
  watchFileChanges?: boolean;
}

// Hook Return Type
export interface UseCloudBackupReturn {
  // State
  providers: CloudProvider[];
  activeProvider: CloudProvider | null;
  versions: BackupVersion[];
  currentBackup: BackupVersion | null;
  syncStatus: SyncStatus;
  config: BackupConfig;
  stats: any;
  performance: any;
  isInitialized: boolean;
  
  // Computed
  isConnected: boolean;
  isSyncing: boolean;
  hasBackups: boolean;
  hasActiveProvider: boolean;
  storageUsage: { used: number; available: number };
  recentBackups: BackupVersion[];
  failedBackups: BackupVersion[];
  totalStorageUsed: number;
  compressionSavings: number;
  
  // Actions - Providers
  addProvider: (provider: Omit<CloudProvider, 'id' | 'isConnected' | 'lastSync'>) => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, updates: Partial<CloudProvider>) => void;
  setActiveProvider: (id: string) => void;
  testConnection: (id: string) => Promise<boolean>;
  syncProviderQuota: (id: string) => Promise<void>;
  
  // Actions - Backup
  createBackup: (description?: string, type?: 'manual' | 'auto' | 'scheduled') => Promise<string>;
  restoreBackup: (versionId: string, targetPath?: string) => Promise<void>;
  deleteBackup: (versionId: string) => Promise<void>;
  duplicateBackup: (versionId: string, description: string) => Promise<string>;
  compareBackups: (versionId1: string, versionId2: string) => Promise<any>;
  
  // Actions - Sync
  startSync: () => Promise<void>;
  stopSync: () => void;
  pauseSync: () => void;
  resumeSync: () => void;
  forceSync: () => Promise<void>;
  
  // Actions - Files
  uploadFile: (file: File, path: string) => Promise<void>;
  downloadFile: (path: string) => Promise<Blob>;
  deleteFile: (path: string) => Promise<void>;
  moveFile: (fromPath: string, toPath: string) => Promise<void>;
  copyFile: (fromPath: string, toPath: string) => Promise<void>;
  
  // Actions - Config
  updateConfig: (updates: Partial<BackupConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (data: string) => void;
  
  // Utilities
  getBackupById: (id: string) => BackupVersion | undefined;
  getProviderById: (id: string) => CloudProvider | undefined;
  validateBackup: (versionId: string) => Promise<boolean>;
  repairBackup: (versionId: string) => Promise<void>;
  
  // Quick Actions
  quickBackup: () => Promise<string>;
  quickRestore: (versionId: string) => Promise<void>;
  quickSync: () => Promise<void>;
  
  // Advanced Actions
  bulkBackup: (descriptions: string[]) => Promise<string[]>;
  scheduleBackup: (cron: string, description: string) => void;
  autoCleanup: () => Promise<void>;
  optimizeStorage: () => Promise<void>;
}

// Main Hook
export const useCloudBackup = (options: UseCloudBackupOptions = {}): UseCloudBackupReturn => {
  const {
    autoInit = true,
    enableAutoBackup = true,
    syncOnMount = false,
    watchFileChanges = false
  } = options;
  
  const store = useCloudBackupStore();
  
  // Initialize on mount
  useEffect(() => {
    if (autoInit && !store.isInitialized) {
      backupManager.initialize();
    }
  }, [autoInit, store.isInitialized]);
  
  // Sync on mount
  useEffect(() => {
    if (syncOnMount && store.activeProvider?.isConnected) {
      store.startSync();
    }
  }, [syncOnMount, store.activeProvider?.isConnected]);
  
  // Watch file changes
  useEffect(() => {
    if (!watchFileChanges || !store.config.syncOnChange) return;
    
    const handleFileChange = () => {
      if (store.activeProvider?.isConnected && !store.syncStatus.isActive) {
        store.createBackup('Auto backup on file change', 'auto');
      }
    };
    
    // Simulate file watching
    const interval = setInterval(handleFileChange, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [watchFileChanges, store.config.syncOnChange, store.activeProvider?.isConnected, store.syncStatus.isActive]);
  
  // Computed values
  const computed = useMemo(() => {
    const recentBackups = store.versions
      .filter(v => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return v.timestamp >= dayAgo;
      })
      .slice(0, 5);
    
    const failedBackups = store.versions.filter(v => v.type === 'manual' && !v.hash);
    
    const totalStorageUsed = store.versions.reduce((total, v) => total + v.size, 0);
    
    const compressionSavings = store.stats.compressionRatio * totalStorageUsed / 100;
    
    return {
      isConnected: !!store.activeProvider?.isConnected,
      isSyncing: store.syncStatus.isActive,
      hasBackups: store.versions.length > 0,
      hasActiveProvider: !!store.activeProvider,
      storageUsage: store.getStorageUsage(),
      recentBackups,
      failedBackups,
      totalStorageUsed,
      compressionSavings
    };
  }, [
    store.activeProvider,
    store.syncStatus.isActive,
    store.versions,
    store.stats.compressionRatio
  ]);
  
  // Quick Actions
  const quickBackup = useCallback(async () => {
    return await store.createBackup('Quick backup', 'manual');
  }, [store]);
  
  const quickRestore = useCallback(async (versionId: string) => {
    await store.restoreBackup(versionId);
  }, [store]);
  
  const quickSync = useCallback(async () => {
    if (!store.activeProvider?.isConnected) {
      throw new Error('No active provider connected');
    }
    await store.startSync();
  }, [store]);
  
  // Advanced Actions
  const bulkBackup = useCallback(async (descriptions: string[]) => {
    const results: string[] = [];
    
    for (const description of descriptions) {
      try {
        const id = await store.createBackup(description, 'manual');
        results.push(id);
      } catch (error) {
        console.error(`Failed to create backup: ${description}`, error);
      }
    }
    
    return results;
  }, [store]);
  
  const scheduleBackup = useCallback((cron: string, description: string) => {
    // Simulate cron scheduling
    
    // In a real implementation, you would use a cron library
    // For now, just create a backup immediately
    store.createBackup(description, 'scheduled');
  }, [store]);
  
  const autoCleanup = useCallback(async () => {
    const { config, versions } = store;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    
    const oldBackups = versions.filter(v => v.timestamp < cutoffDate);
    
    for (const backup of oldBackups) {
      try {
        await store.deleteBackup(backup.id);
      } catch (error) {
        console.error(`Failed to delete old backup: ${backup.id}`, error);
      }
    }
  }, [store]);
  
  const optimizeStorage = useCallback(async () => {
    // Simulate storage optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update compression ratio
    store.updateStats({
      compressionRatio: Math.min(90, store.stats.compressionRatio + 5)
    });
  }, [store]);
  
  return {
    // State
    providers: store.providers,
    activeProvider: store.activeProvider,
    versions: store.versions,
    currentBackup: store.currentBackup,
    syncStatus: store.syncStatus,
    config: store.config,
    stats: store.stats,
    performance: store.performance,
    isInitialized: store.isInitialized,
    
    // Computed
    ...computed,
    
    // Actions - Providers
    addProvider: store.addProvider,
    removeProvider: store.removeProvider,
    updateProvider: store.updateProvider,
    setActiveProvider: store.setActiveProvider,
    testConnection: store.testConnection,
    syncProviderQuota: store.syncProviderQuota,
    
    // Actions - Backup
    createBackup: store.createBackup,
    restoreBackup: store.restoreBackup,
    deleteBackup: store.deleteBackup,
    duplicateBackup: store.duplicateBackup,
    compareBackups: store.compareBackups,
    
    // Actions - Sync
    startSync: store.startSync,
    stopSync: store.stopSync,
    pauseSync: store.pauseSync,
    resumeSync: store.resumeSync,
    forceSync: store.forcSync,
    
    // Actions - Files
    uploadFile: store.uploadFile,
    downloadFile: store.downloadFile,
    deleteFile: store.deleteFile,
    moveFile: store.moveFile,
    copyFile: store.copyFile,
    
    // Actions - Config
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    exportConfig: store.exportConfig,
    importConfig: store.importConfig,
    
    // Utilities
    getBackupById: store.getBackupById,
    getProviderById: store.getProviderById,
    validateBackup: store.validateBackup,
    repairBackup: store.repairBackup,
    
    // Quick Actions
    quickBackup,
    quickRestore,
    quickSync,
    
    // Advanced Actions
    bulkBackup,
    scheduleBackup,
    autoCleanup,
    optimizeStorage
  };
};

// Auto Backup Hook
export const useAutoBackup = (options: {
  enabled?: boolean;
  interval?: number; // minutes
  onBackupCreated?: (backupId: string) => void;
  onBackupFailed?: (error: Error) => void;
} = {}) => {
  const { enabled = true, interval = 30, onBackupCreated, onBackupFailed } = options;
  const { createBackup, config, updateConfig } = useCloudBackup();
  
  useEffect(() => {
    if (!enabled) return;
    
    updateConfig({ autoBackup: true, backupInterval: interval });
    
    const intervalId = setInterval(async () => {
      try {
        const backupId = await createBackup('Auto backup', 'auto');
        onBackupCreated?.(backupId);
      } catch (error) {
        onBackupFailed?.(error as Error);
      }
    }, interval * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [enabled, interval, createBackup, updateConfig, onBackupCreated, onBackupFailed]);
  
  return {
    isEnabled: enabled && config.autoBackup,
    interval: config.backupInterval
  };
};

// Backup Performance Hook
export const useBackupPerformance = () => {
  const { performance, measurePerformance, clearPerformanceData, optimizePerformance } = useCloudBackup();
  
  const startMeasurement = useCallback(async () => {
    await measurePerformance();
  }, [measurePerformance]);
  
  const getPerformanceScore = useCallback(() => {
    const weights = {
      uploadSpeed: 0.3,
      downloadSpeed: 0.3,
      compressionTime: 0.2,
      encryptionTime: 0.1,
      storageEfficiency: 0.1
    };
    
    const normalizedScores = {
      uploadSpeed: Math.min(100, (performance.uploadSpeed / 1000000) * 100),
      downloadSpeed: Math.min(100, (performance.downloadSpeed / 1000000) * 100),
      compressionTime: Math.max(0, 100 - (performance.compressionTime / 10)),
      encryptionTime: Math.max(0, 100 - (performance.encryptionTime / 5)),
      storageEfficiency: performance.storageEfficiency
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (normalizedScores[key as keyof typeof normalizedScores] * weight);
    }, 0);
  }, [performance]);
  
  return {
    performance,
    performanceScore: getPerformanceScore(),
    startMeasurement,
    clearData: clearPerformanceData,
    optimize: optimizePerformance
  };
};

// Backup Stats Hook
export const useBackupStats = () => {
  const { stats, updateStats, clearStats, calculateStats } = useCloudBackup();
  
  const getSuccessRate = useCallback(() => {
    const total = stats.successfulBackups + stats.failedBackups;
    return total > 0 ? (stats.successfulBackups / total) * 100 : 0;
  }, [stats]);
  
  const getAverageSize = useCallback(() => {
    return stats.totalBackups > 0 ? stats.totalSize / stats.totalBackups : 0;
  }, [stats]);
  
  return {
    stats,
    successRate: getSuccessRate(),
    averageSize: getAverageSize(),
    updateStats,
    clearStats,
    calculateStats
  };
};

// Backup Config Hook
export const useBackupConfig = () => {
  const { config, updateConfig, resetConfig, exportConfig, importConfig } = useCloudBackup();
  
  const updateSetting = useCallback((key: keyof BackupConfig, value: any) => {
    updateConfig({ [key]: value });
  }, [updateConfig]);
  
  const toggleAutoBackup = useCallback(() => {
    updateConfig({ autoBackup: !config.autoBackup });
  }, [config.autoBackup, updateConfig]);
  
  const toggleEncryption = useCallback(() => {
    updateConfig({ encryptionEnabled: !config.encryptionEnabled });
  }, [config.encryptionEnabled, updateConfig]);
  
  const toggleSyncOnChange = useCallback(() => {
    updateConfig({ syncOnChange: !config.syncOnChange });
  }, [config.syncOnChange, updateConfig]);
  
  return {
    config,
    updateSetting,
    toggleAutoBackup,
    toggleEncryption,
    toggleSyncOnChange,
    resetConfig,
    exportConfig,
    importConfig
  };
};

// Backup Sync Hook
export const useBackupSync = () => {
  const { 
    syncStatus, 
    startSync, 
    stopSync, 
    pauseSync, 
    resumeSync, 
    forceSync,
    isConnected 
  } = useCloudBackup();
  
  const canSync = useMemo(() => {
    return isConnected && !syncStatus.isActive;
  }, [isConnected, syncStatus.isActive]);
  
  const syncProgress = useMemo(() => {
    return {
      percentage: syncStatus.progress,
      filesProcessed: syncStatus.filesProcessed,
      totalFiles: syncStatus.totalFiles,
      currentFile: syncStatus.currentFile,
      speed: syncStatus.speed,
      eta: syncStatus.eta,
      errors: syncStatus.errors
    };
  }, [syncStatus]);
  
  return {
    syncStatus,
    syncProgress,
    canSync,
    isActive: syncStatus.isActive,
    startSync,
    stopSync,
    pauseSync,
    resumeSync,
    forceSync
  };
};

// Backup Debug Hook
export const useBackupDebug = () => {
  const store = useCloudBackupStore();
  
  const getSystemInfo = useCallback(() => {
    return {
      providersCount: store.providers.length,
      activeProvider: store.activeProvider?.name || 'None',
      versionsCount: store.versions.length,
      totalSize: store.stats.totalSize,
      isInitialized: store.isInitialized,
      isSyncing: store.syncStatus.isActive,
      lastBackup: store.stats.lastBackup,
      configHash: btoa(JSON.stringify(store.config)).slice(0, 8)
    };
  }, [store]);
  
  const runDiagnostics = useCallback(async () => {
    const diagnostics = {
      providers: store.providers.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        isConnected: p.isConnected,
        lastSync: p.lastSync
      })),
      versions: store.versions.length,
      config: store.config,
      performance: store.performance,
      errors: store.syncStatus.errors
    };
    
    return diagnostics;
  }, [store]);
  
  const validateData = useCallback(async () => {
    const issues = [];
    
    // Check for orphaned backups
    const orphanedBackups = store.versions.filter(v => !v.hash);
    if (orphanedBackups.length > 0) {
      issues.push(`Found ${orphanedBackups.length} orphaned backups`);
    }
    
    // Check for disconnected providers
    const disconnectedProviders = store.providers.filter(p => !p.isConnected);
    if (disconnectedProviders.length > 0) {
      issues.push(`Found ${disconnectedProviders.length} disconnected providers`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, [store]);
  
  return {
    systemInfo: getSystemInfo(),
    runDiagnostics,
    validateData,
    store: store // For advanced debugging
  };
};