import { useEffect, useCallback, useMemo } from 'react';
import { 
  useVersioningStore, 
  ProjectVersion, 
  ProjectBranch, 
  MergeRequest, 
  VersionComparison,
  VersioningStats,
  VersioningConfig,
  VersioningPerformance,
  versionManager
} from '../utils/projectVersioning';

// Hook options interface
export interface UseProjectVersioningOptions {
  projectId?: string;
  autoLoad?: boolean;
  autoSave?: boolean;
  enableRealtime?: boolean;
  enablePerformanceTracking?: boolean;
}

// Hook return interface
export interface UseProjectVersioningReturn {
  // State
  versions: ProjectVersion[];
  branches: ProjectBranch[];
  mergeRequests: MergeRequest[];
  comparisons: VersionComparison[];
  currentProject: string | null;
  currentBranch: string | null;
  currentVersion: string | null;
  stats: VersioningStats;
  config: VersioningConfig;
  performance: VersioningPerformance;
  isLoading: boolean;
  error: string | null;
  
  // Version Actions
  createVersion: (data: Partial<ProjectVersion>) => Promise<ProjectVersion>;
  updateVersion: (id: string, data: Partial<ProjectVersion>) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  restoreVersion: (id: string) => Promise<void>;
  tagVersion: (id: string, tags: string[]) => Promise<void>;
  
  // Branch Actions
  createBranch: (data: Partial<ProjectBranch>) => Promise<ProjectBranch>;
  updateBranch: (id: string, data: Partial<ProjectBranch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  mergeBranch: (sourceId: string, targetId: string) => Promise<void>;
  
  // Merge Request Actions
  createMergeRequest: (data: Partial<MergeRequest>) => Promise<MergeRequest>;
  updateMergeRequest: (id: string, data: Partial<MergeRequest>) => Promise<void>;
  resolveMergeRequest: (id: string, resolution: 'merge' | 'close') => Promise<void>;
  resolveConflict: (requestId: string, conflictId: string, resolution: string) => Promise<void>;
  
  // Comparison Actions
  compareVersions: (fromId: string, toId: string) => Promise<VersionComparison>;
  
  // Utility Actions
  exportProject: (format: 'json' | 'zip') => Promise<Blob>;
  importProject: (file: File) => Promise<void>;
  backupProject: () => Promise<void>;
  restoreProject: (backupId: string) => Promise<void>;
  
  // Config Actions
  updateConfig: (config: Partial<VersioningConfig>) => void;
  resetConfig: () => void;
  
  // Data Actions
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearData: () => void;
  
  // Utility Functions
  getVersion: (id: string) => ProjectVersion | null;
  getVersionsByProject: (projectId?: string) => ProjectVersion[];
  getVersionsByBranch: (branch: string) => ProjectVersion[];
  getBranch: (id: string) => ProjectBranch | null;
  getMergeRequest: (id: string) => MergeRequest | null;
  getComparison: (id: string) => VersionComparison | null;
  
  // Derived State
  hasVersions: boolean;
  hasBranches: boolean;
  hasMergeRequests: boolean;
  currentVersionData: ProjectVersion | null;
  currentBranchData: ProjectBranch | null;
  projectVersions: ProjectVersion[];
  projectBranches: ProjectBranch[];
  projectMergeRequests: MergeRequest[];
  
  // Quick Actions
  quickCreateVersion: (title: string, description: string) => Promise<ProjectVersion>;
  quickCreateBranch: (name: string, description: string) => Promise<ProjectBranch>;
  quickMergeRequest: (title: string, sourceBranch: string, targetBranch: string) => Promise<MergeRequest>;
  
  // Advanced Actions
  bulkTagVersions: (versionIds: string[], tags: string[]) => Promise<void>;
  bulkDeleteVersions: (versionIds: string[]) => Promise<void>;
  getVersionHistory: () => ProjectVersion[];
  getBranchTree: () => ProjectBranch[];
  getConflictingMergeRequests: () => MergeRequest[];
  getRecentActivity: (days: number) => (ProjectVersion | ProjectBranch | MergeRequest)[];
}

// Main hook
export const useProjectVersioning = (options: UseProjectVersioningOptions = {}): UseProjectVersioningReturn => {
  const {
    projectId,
    autoLoad = true,
    autoSave = true,
    enableRealtime = false,
    enablePerformanceTracking = true,
  } = options;
  
  const store = useVersioningStore();
  
  // Initialize on mount
  useEffect(() => {
    if (autoLoad) {
      versionManager.initialize();
    }
    
    return () => {
      if (!autoSave) {
        versionManager.destroy();
      }
    };
  }, [autoLoad, autoSave]);
  
  // Set current project
  useEffect(() => {
    if (projectId && projectId !== store.currentProject) {
      useVersioningStore.setState({ currentProject: projectId });
    }
  }, [projectId, store.currentProject]);
  
  // Performance tracking
  useEffect(() => {
    if (enablePerformanceTracking) {
      const interval = setInterval(() => {
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        store.updatePerformance({ 
          storageUsed: memoryUsage,
          operationsPerSecond: Math.random() * 100, // Would be calculated
          cacheHitRate: Math.random() * 100, // Would be calculated
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [enablePerformanceTracking, store]);
  
  // Memoized derived state
  const derivedState = useMemo(() => {
    const currentProjectId = projectId || store.currentProject;
    
    return {
      hasVersions: store.versions.length > 0,
      hasBranches: store.branches.length > 0,
      hasMergeRequests: store.mergeRequests.length > 0,
      currentVersionData: store.currentVersion ? store.getVersion(store.currentVersion) : null,
      currentBranchData: store.currentBranch ? store.branches.find(b => b.id === store.currentBranch) || null : null,
      projectVersions: currentProjectId ? store.getVersionsByProject(currentProjectId) : [],
      projectBranches: currentProjectId ? store.branches.filter(b => b.projectId === currentProjectId) : [],
      projectMergeRequests: currentProjectId ? store.mergeRequests.filter(mr => {
        const sourceBranch = store.branches.find(b => b.id === mr.sourceBranch);
        const targetBranch = store.branches.find(b => b.id === mr.targetBranch);
        return sourceBranch?.projectId === currentProjectId || targetBranch?.projectId === currentProjectId;
      }) : [],
    };
  }, [store, projectId]);
  
  // Wrapped actions with performance tracking
  const createVersionWithTracking = useCallback(async (data: Partial<ProjectVersion>) => {
    const startTime = performance.now();
    try {
      const result = await store.createVersion({
        ...data,
        projectId: data.projectId || projectId || store.currentProject || '',
      });
      
      if (enablePerformanceTracking) {
        store.updatePerformance({ saveTime: performance.now() - startTime });
      }
      
      return result;
    } catch (error) {
      if (enablePerformanceTracking) {
        store.updatePerformance({ saveTime: performance.now() - startTime });
      }
      throw error;
    }
  }, [store, projectId, enablePerformanceTracking]);
  
  const createBranchWithTracking = useCallback(async (data: Partial<ProjectBranch>) => {
    const startTime = performance.now();
    try {
      const result = await store.createBranch({
        ...data,
        projectId: data.projectId || projectId || store.currentProject || '',
      });
      
      if (enablePerformanceTracking) {
        store.updatePerformance({ saveTime: performance.now() - startTime });
      }
      
      return result;
    } catch (error) {
      if (enablePerformanceTracking) {
        store.updatePerformance({ saveTime: performance.now() - startTime });
      }
      throw error;
    }
  }, [store, projectId, enablePerformanceTracking]);
  
  const compareVersionsWithTracking = useCallback(async (fromId: string, toId: string) => {
    const startTime = performance.now();
    try {
      const result = await store.compareVersions(fromId, toId);
      
      if (enablePerformanceTracking) {
        store.updatePerformance({ compareTime: performance.now() - startTime });
      }
      
      return result;
    } catch (error) {
      if (enablePerformanceTracking) {
        store.updatePerformance({ compareTime: performance.now() - startTime });
      }
      throw error;
    }
  }, [store, enablePerformanceTracking]);
  
  // Quick actions
  const quickCreateVersion = useCallback(async (title: string, description: string) => {
    return createVersionWithTracking({ 
      title, 
      description, 
      status: 'draft',
      author: 'Current User', // Would get from auth context
    });
  }, [createVersionWithTracking]);
  
  const quickCreateBranch = useCallback(async (name: string, description: string) => {
    return createBranchWithTracking({ 
      name, 
      description,
      author: 'Current User', // Would get from auth context
    });
  }, [createBranchWithTracking]);
  
  const quickMergeRequest = useCallback(async (title: string, sourceBranch: string, targetBranch: string) => {
    return store.createMergeRequest({ 
      title, 
      sourceBranch, 
      targetBranch,
      author: 'Current User', // Would get from auth context
    });
  }, [store]);
  
  // Advanced actions
  const bulkTagVersions = useCallback(async (versionIds: string[], tags: string[]) => {
    for (const id of versionIds) {
      await store.tagVersion(id, tags);
    }
  }, [store]);
  
  const bulkDeleteVersions = useCallback(async (versionIds: string[]) => {
    for (const id of versionIds) {
      await store.deleteVersion(id);
    }
  }, [store]);
  
  const getVersionHistory = useCallback(() => {
    return derivedState.projectVersions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [derivedState.projectVersions]);
  
  const getBranchTree = useCallback(() => {
    // Would build a tree structure based on parent relationships
    return derivedState.projectBranches;
  }, [derivedState.projectBranches]);
  
  const getConflictingMergeRequests = useCallback(() => {
    return derivedState.projectMergeRequests.filter(mr => mr.status === 'conflict');
  }, [derivedState.projectMergeRequests]);
  
  const getRecentActivity = useCallback((days: number) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activity: (ProjectVersion | ProjectBranch | MergeRequest)[] = [];
    
    // Add recent versions
    activity.push(...derivedState.projectVersions.filter(v => v.timestamp > cutoffDate));
    
    // Add recent branches
    activity.push(...derivedState.projectBranches.filter(b => b.updatedAt > cutoffDate));
    
    // Add recent merge requests
    activity.push(...derivedState.projectMergeRequests.filter(mr => mr.updatedAt > cutoffDate));
    
    return activity.sort((a, b) => {
      const aDate = 'timestamp' in a ? a.timestamp : a.updatedAt;
      const bDate = 'timestamp' in b ? b.timestamp : b.updatedAt;
      return bDate.getTime() - aDate.getTime();
    });
  }, [derivedState]);
  
  // Utility functions
  const getBranch = useCallback((id: string) => {
    return store.branches.find(b => b.id === id) || null;
  }, [store.branches]);
  
  const getMergeRequest = useCallback((id: string) => {
    return store.mergeRequests.find(mr => mr.id === id) || null;
  }, [store.mergeRequests]);
  
  // Export with current project
  const exportProject = useCallback(async (format: 'json' | 'zip') => {
    const currentProjectId = projectId || store.currentProject;
    if (!currentProjectId) {
      throw new Error('No project selected');
    }
    return store.exportProject(currentProjectId, format);
  }, [store, projectId]);
  
  // Backup current project
  const backupProject = useCallback(async () => {
    const currentProjectId = projectId || store.currentProject;
    if (!currentProjectId) {
      throw new Error('No project selected');
    }
    return store.backupProject(currentProjectId);
  }, [store, projectId]);
  
  return {
    // State
    versions: store.versions,
    branches: store.branches,
    mergeRequests: store.mergeRequests,
    comparisons: store.comparisons,
    currentProject: store.currentProject,
    currentBranch: store.currentBranch,
    currentVersion: store.currentVersion,
    stats: store.stats,
    config: store.config,
    performance: store.performance,
    isLoading: store.isLoading,
    error: store.error,
    
    // Actions
    createVersion: createVersionWithTracking,
    updateVersion: store.updateVersion,
    deleteVersion: store.deleteVersion,
    restoreVersion: store.restoreVersion,
    tagVersion: store.tagVersion,
    
    createBranch: createBranchWithTracking,
    updateBranch: store.updateBranch,
    deleteBranch: store.deleteBranch,
    switchBranch: store.switchBranch,
    mergeBranch: store.mergeBranch,
    
    createMergeRequest: store.createMergeRequest,
    updateMergeRequest: store.updateMergeRequest,
    resolveMergeRequest: store.resolveMergeRequest,
    resolveConflict: store.resolveConflict,
    
    compareVersions: compareVersionsWithTracking,
    
    exportProject,
    importProject: store.importProject,
    backupProject,
    restoreProject: store.restoreProject,
    
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    
    loadData: store.loadData,
    saveData: store.saveData,
    clearData: store.clearData,
    
    // Utility Functions
    getVersion: store.getVersion,
    getVersionsByProject: store.getVersionsByProject,
    getVersionsByBranch: store.getVersionsByBranch,
    getBranch,
    getMergeRequest,
    getComparison: store.getComparison,
    
    // Derived State
    ...derivedState,
    
    // Quick Actions
    quickCreateVersion,
    quickCreateBranch,
    quickMergeRequest,
    
    // Advanced Actions
    bulkTagVersions,
    bulkDeleteVersions,
    getVersionHistory,
    getBranchTree,
    getConflictingMergeRequests,
    getRecentActivity,
  };
};

// Auto versioning hook
export const useAutoVersioning = (options: {
  projectId: string;
  autoSaveInterval?: number;
  versionOnChange?: boolean;
  trackFileChanges?: boolean;
}) => {
  const { projectId, autoSaveInterval = 300000, versionOnChange = true, trackFileChanges = true } = options;
  const versioning = useProjectVersioning({ projectId, autoSave: true });
  
  // Auto-save versions
  useEffect(() => {
    if (!versionOnChange) return;
    
    const interval = setInterval(async () => {
      try {
        await versioning.quickCreateVersion(
          `Auto-save ${new Date().toLocaleTimeString()}`,
          'Automatic version created'
        );
      } catch (error) {
        console.warn('Auto-versioning failed:', error);
      }
    }, autoSaveInterval);
    
    return () => clearInterval(interval);
  }, [versioning, autoSaveInterval, versionOnChange]);
  
  return versioning;
};

// Version performance hook
export const useVersioningPerformance = () => {
  const performance = useVersioningStore(state => state.performance);
  const updatePerformance = useVersioningStore(state => state.updatePerformance);
  
  const trackOperation = useCallback(async <T>(operation: () => Promise<T>, type: keyof VersioningPerformance): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await operation();
      updatePerformance({ [type]: performance.now() - startTime });
      return result;
    } catch (error) {
      updatePerformance({ [type]: performance.now() - startTime });
      throw error;
    }
  }, [updatePerformance]);
  
  return {
    performance,
    trackOperation,
    updatePerformance,
  };
};

// Version stats hook
export const useVersioningStats = (projectId?: string) => {
  const stats = useVersioningStore(state => state.stats);
  const getProjectStats = useVersioningStore(state => state.getProjectStats);
  const updateStats = useVersioningStore(state => state.updateStats);
  
  const projectStats = useMemo(() => {
    return projectId ? getProjectStats(projectId) : null;
  }, [projectId, getProjectStats]);
  
  useEffect(() => {
    updateStats();
  }, [updateStats]);
  
  return {
    globalStats: stats,
    projectStats,
    updateStats,
  };
};

// Version config hook
export const useVersioningConfig = () => {
  const config = useVersioningStore(state => state.config);
  const updateConfig = useVersioningStore(state => state.updateConfig);
  const resetConfig = useVersioningStore(state => state.resetConfig);
  
  const toggleAutoSave = useCallback(() => {
    updateConfig({ autoSave: !config.autoSave });
  }, [config.autoSave, updateConfig]);
  
  const toggleCompression = useCallback(() => {
    updateConfig({ compressionEnabled: !config.compressionEnabled });
  }, [config.compressionEnabled, updateConfig]);
  
  const toggleBackup = useCallback(() => {
    updateConfig({ backupEnabled: !config.backupEnabled });
  }, [config.backupEnabled, updateConfig]);
  
  const setRetentionDays = useCallback((days: number) => {
    updateConfig({ retentionDays: days });
  }, [updateConfig]);
  
  const setMaxVersions = useCallback((max: number) => {
    updateConfig({ maxVersions: max });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    toggleAutoSave,
    toggleCompression,
    toggleBackup,
    setRetentionDays,
    setMaxVersions,
  };
};

// Version comparison hook
export const useVersionComparison = () => {
  const comparisons = useVersioningStore(state => state.comparisons);
  const compareVersions = useVersioningStore(state => state.compareVersions);
  const getComparison = useVersioningStore(state => state.getComparison);
  
  const [activeComparison, setActiveComparison] = useState<string | null>(null);
  
  const createComparison = useCallback(async (fromId: string, toId: string) => {
    const comparison = await compareVersions(fromId, toId);
    setActiveComparison(comparison.id);
    return comparison;
  }, [compareVersions]);
  
  const activeComparisonData = useMemo(() => {
    return activeComparison ? getComparison(activeComparison) : null;
  }, [activeComparison, getComparison]);
  
  return {
    comparisons,
    activeComparison,
    activeComparisonData,
    setActiveComparison,
    createComparison,
    getComparison,
  };
};

// Version debug hook
export const useVersioningDebug = () => {
  const store = useVersioningStore();
  
  const debugInfo = useMemo(() => ({
    storeSize: {
      versions: store.versions.length,
      branches: store.branches.length,
      mergeRequests: store.mergeRequests.length,
      comparisons: store.comparisons.length,
    },
    currentState: {
      project: store.currentProject,
      branch: store.currentBranch,
      version: store.currentVersion,
    },
    performance: store.performance,
    config: store.config,
    isLoading: store.isLoading,
    error: store.error,
  }), [store]);
  
  const exportDebugData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      debugInfo,
      versions: store.versions.map(v => ({
        id: v.id,
        version: v.version,
        branch: v.branch,
        status: v.status,
        timestamp: v.timestamp,
        size: v.size,
      })),
      branches: store.branches.map(b => ({
        id: b.id,
        name: b.name,
        projectId: b.projectId,
        isProtected: b.isProtected,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `versioning-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [debugInfo, store]);
  
  return {
    debugInfo,
    exportDebugData,
    clearData: store.clearData,
    initialize: store.initialize,
    cleanup: store.cleanup,
  };
};