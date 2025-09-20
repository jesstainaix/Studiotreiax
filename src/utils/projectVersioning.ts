import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types and Interfaces
export interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  branch: string;
  parentVersion?: string;
  title: string;
  description: string;
  author: string;
  timestamp: Date;
  changes: VersionChange[];
  metadata: VersionMetadata;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  size: number;
  checksum: string;
}

export interface VersionChange {
  id: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed' | 'moved';
  path: string;
  oldPath?: string;
  content?: string;
  oldContent?: string;
  binary: boolean;
  size: number;
  timestamp: Date;
}

export interface VersionMetadata {
  filesCount: number;
  totalSize: number;
  dependencies: Record<string, string>;
  buildInfo?: {
    success: boolean;
    duration: number;
    errors: string[];
    warnings: string[];
  };
  performance?: {
    bundleSize: number;
    loadTime: number;
    memoryUsage: number;
  };
}

export interface ProjectBranch {
  id: string;
  name: string;
  projectId: string;
  parentBranch?: string;
  currentVersion: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  isProtected: boolean;
  mergeStrategy: 'merge' | 'rebase' | 'squash';
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  sourceVersion: string;
  targetVersion: string;
  author: string;
  status: 'open' | 'merged' | 'closed' | 'conflict';
  conflicts: MergeConflict[];
  reviewers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MergeConflict {
  id: string;
  path: string;
  type: 'content' | 'binary' | 'deleted';
  sourceContent: string;
  targetContent: string;
  resolved: boolean;
  resolution?: string;
}

export interface VersionComparison {
  id: string;
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
    renamed: number;
    moved: number;
  };
  impact: 'major' | 'minor' | 'patch';
}

export interface VersioningStats {
  totalVersions: number;
  totalBranches: number;
  totalMergeRequests: number;
  averageVersionSize: number;
  mostActiveAuthor: string;
  versionFrequency: Record<string, number>;
  branchActivity: Record<string, number>;
  mergeSuccess: number;
  conflictRate: number;
}

export interface VersioningConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  maxVersions: number;
  compressionEnabled: boolean;
  backupEnabled: boolean;
  backupInterval: number;
  retentionDays: number;
  defaultBranch: string;
  mergeStrategy: 'merge' | 'rebase' | 'squash';
  requireReview: boolean;
  autoCleanup: boolean;
  cleanupInterval: number;
}

export interface VersioningPerformance {
  saveTime: number;
  loadTime: number;
  compareTime: number;
  mergeTime: number;
  storageUsed: number;
  compressionRatio: number;
  operationsPerSecond: number;
  cacheHitRate: number;
}

// Zustand Store
interface VersioningStore {
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
  getVersion: (id: string) => ProjectVersion | null;
  getVersionsByProject: (projectId: string) => ProjectVersion[];
  getVersionsByBranch: (branch: string) => ProjectVersion[];
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
  getComparison: (id: string) => VersionComparison | null;
  
  // Utility Actions
  exportProject: (projectId: string, format: 'json' | 'zip') => Promise<Blob>;
  importProject: (file: File) => Promise<void>;
  backupProject: (projectId: string) => Promise<void>;
  restoreProject: (backupId: string) => Promise<void>;
  
  // Config Actions
  updateConfig: (config: Partial<VersioningConfig>) => void;
  resetConfig: () => void;
  
  // Stats Actions
  updateStats: () => void;
  getProjectStats: (projectId: string) => Partial<VersioningStats>;
  
  // Performance Actions
  updatePerformance: (metrics: Partial<VersioningPerformance>) => void;
  
  // Data Actions
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearData: () => void;
  
  // System Actions
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
}

// Default configurations
const defaultConfig: VersioningConfig = {
  autoSave: true,
  autoSaveInterval: 300000, // 5 minutes
  maxVersions: 100,
  compressionEnabled: true,
  backupEnabled: true,
  backupInterval: 86400000, // 24 hours
  retentionDays: 90,
  defaultBranch: 'main',
  mergeStrategy: 'merge',
  requireReview: false,
  autoCleanup: true,
  cleanupInterval: 3600000, // 1 hour
};

const defaultStats: VersioningStats = {
  totalVersions: 0,
  totalBranches: 0,
  totalMergeRequests: 0,
  averageVersionSize: 0,
  mostActiveAuthor: '',
  versionFrequency: {},
  branchActivity: {},
  mergeSuccess: 0,
  conflictRate: 0,
};

const defaultPerformance: VersioningPerformance = {
  saveTime: 0,
  loadTime: 0,
  compareTime: 0,
  mergeTime: 0,
  storageUsed: 0,
  compressionRatio: 0,
  operationsPerSecond: 0,
  cacheHitRate: 0,
};

// Create Zustand store
export const useVersioningStore = create<VersioningStore>()(persist(
  (set, get) => ({
    // Initial State
    versions: [],
    branches: [],
    mergeRequests: [],
    comparisons: [],
    currentProject: null,
    currentBranch: null,
    currentVersion: null,
    stats: defaultStats,
    config: defaultConfig,
    performance: defaultPerformance,
    isLoading: false,
    error: null,
    
    // Version Actions
    createVersion: async (data) => {
      const startTime = Date.now();
      set({ isLoading: true, error: null });
      
      try {
        const version: ProjectVersion = {
          id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId: data.projectId || get().currentProject || '',
          version: data.version || '1.0.0',
          branch: data.branch || get().currentBranch || 'main',
          title: data.title || 'New Version',
          description: data.description || '',
          author: data.author || 'Unknown',
          timestamp: new Date(),
          changes: data.changes || [],
          metadata: data.metadata || {
            filesCount: 0,
            totalSize: 0,
            dependencies: {},
          },
          tags: data.tags || [],
          status: data.status || 'draft',
          size: data.size || 0,
          checksum: data.checksum || '',
          ...data,
        };
        
        set(state => ({
          versions: [...state.versions, version],
          currentVersion: version.id,
          isLoading: false,
        }));
        
        get().updateStats();
        get().updatePerformance({ saveTime: Date.now() - startTime });
        
        return version;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create version', isLoading: false });
        throw error;
      }
    },
    
    updateVersion: async (id, data) => {
      set({ isLoading: true, error: null });
      
      try {
        set(state => ({
          versions: state.versions.map(v => 
            v.id === id ? { ...v, ...data, timestamp: new Date() } : v
          ),
          isLoading: false,
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to update version', isLoading: false });
        throw error;
      }
    },
    
    deleteVersion: async (id) => {
      set({ isLoading: true, error: null });
      
      try {
        set(state => ({
          versions: state.versions.filter(v => v.id !== id),
          currentVersion: state.currentVersion === id ? null : state.currentVersion,
          isLoading: false,
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to delete version', isLoading: false });
        throw error;
      }
    },
    
    getVersion: (id) => {
      return get().versions.find(v => v.id === id) || null;
    },
    
    getVersionsByProject: (projectId) => {
      return get().versions.filter(v => v.projectId === projectId);
    },
    
    getVersionsByBranch: (branch) => {
      return get().versions.filter(v => v.branch === branch);
    },
    
    restoreVersion: async (id) => {
      const startTime = Date.now();
      set({ isLoading: true, error: null });
      
      try {
        const version = get().getVersion(id);
        if (!version) {
          throw new Error('Version not found');
        }
        
        // Simulate restore process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set({ currentVersion: id, isLoading: false });
        get().updatePerformance({ loadTime: Date.now() - startTime });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to restore version', isLoading: false });
        throw error;
      }
    },
    
    tagVersion: async (id, tags) => {
      set({ isLoading: true, error: null });
      
      try {
        set(state => ({
          versions: state.versions.map(v => 
            v.id === id ? { ...v, tags } : v
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to tag version', isLoading: false });
        throw error;
      }
    },
    
    // Branch Actions
    createBranch: async (data) => {
      set({ isLoading: true, error: null });
      
      try {
        const branch: ProjectBranch = {
          id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.name || 'new-branch',
          projectId: data.projectId || get().currentProject || '',
          currentVersion: data.currentVersion || '',
          description: data.description || '',
          author: data.author || 'Unknown',
          createdAt: new Date(),
          updatedAt: new Date(),
          isProtected: data.isProtected || false,
          mergeStrategy: data.mergeStrategy || 'merge',
          ...data,
        };
        
        set(state => ({
          branches: [...state.branches, branch],
          currentBranch: branch.id,
          isLoading: false,
        }));
        
        get().updateStats();
        return branch;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create branch', isLoading: false });
        throw error;
      }
    },
    
    updateBranch: async (id, data) => {
      set({ isLoading: true, error: null });
      
      try {
        set(state => ({
          branches: state.branches.map(b => 
            b.id === id ? { ...b, ...data, updatedAt: new Date() } : b
          ),
          isLoading: false,
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to update branch', isLoading: false });
        throw error;
      }
    },
    
    deleteBranch: async (id) => {
      set({ isLoading: true, error: null });
      
      try {
        const branch = get().branches.find(b => b.id === id);
        if (branch?.isProtected) {
          throw new Error('Cannot delete protected branch');
        }
        
        set(state => ({
          branches: state.branches.filter(b => b.id !== id),
          currentBranch: state.currentBranch === id ? null : state.currentBranch,
          isLoading: false,
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to delete branch', isLoading: false });
        throw error;
      }
    },
    
    switchBranch: async (branchId) => {
      const startTime = Date.now();
      set({ isLoading: true, error: null });
      
      try {
        const branch = get().branches.find(b => b.id === branchId);
        if (!branch) {
          throw new Error('Branch not found');
        }
        
        // Simulate branch switch
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set({ 
          currentBranch: branchId,
          currentVersion: branch.currentVersion,
          isLoading: false,
        });
        
        get().updatePerformance({ loadTime: Date.now() - startTime });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to switch branch', isLoading: false });
        throw error;
      }
    },
    
    mergeBranch: async (sourceId, targetId) => {
      const startTime = Date.now();
      set({ isLoading: true, error: null });
      
      try {
        const sourceBranch = get().branches.find(b => b.id === sourceId);
        const targetBranch = get().branches.find(b => b.id === targetId);
        
        if (!sourceBranch || !targetBranch) {
          throw new Error('Branch not found');
        }
        
        // Simulate merge process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update target branch
        set(state => ({
          branches: state.branches.map(b => 
            b.id === targetId ? { ...b, updatedAt: new Date() } : b
          ),
          isLoading: false,
        }));
        
        get().updateStats();
        get().updatePerformance({ mergeTime: Date.now() - startTime });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to merge branch', isLoading: false });
        throw error;
      }
    },
    
    // Merge Request Actions
    createMergeRequest: async (data) => {
      set({ isLoading: true, error: null });
      
      try {
        const mergeRequest: MergeRequest = {
          id: `mr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.title || 'New Merge Request',
          description: data.description || '',
          sourceBranch: data.sourceBranch || '',
          targetBranch: data.targetBranch || '',
          sourceVersion: data.sourceVersion || '',
          targetVersion: data.targetVersion || '',
          author: data.author || 'Unknown',
          status: data.status || 'open',
          conflicts: data.conflicts || [],
          reviewers: data.reviewers || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        
        set(state => ({
          mergeRequests: [...state.mergeRequests, mergeRequest],
          isLoading: false,
        }));
        
        get().updateStats();
        return mergeRequest;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create merge request', isLoading: false });
        throw error;
      }
    },
    
    updateMergeRequest: async (id, data) => {
      set({ isLoading: true, error: null });
      
      try {
        set(state => ({
          mergeRequests: state.mergeRequests.map(mr => 
            mr.id === id ? { ...mr, ...data, updatedAt: new Date() } : mr
          ),
          isLoading: false,
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to update merge request', isLoading: false });
        throw error;
      }
    },
    
    resolveMergeRequest: async (id, resolution) => {
      const startTime = Date.now();
      set({ isLoading: true, error: null });
      
      try {
        const status = resolution === 'merge' ? 'merged' : 'closed';
        
        set(state => ({
          mergeRequests: state.mergeRequests.map(mr => 
            mr.id === id ? { ...mr, status, updatedAt: new Date() } : mr
          ),
          isLoading: false,
        }));
        
        get().updateStats();
        get().updatePerformance({ mergeTime: Date.now() - startTime });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to resolve merge request', isLoading: false });
        throw error;
      }
    },
    
    resolveConflict: async (requestId, conflictId, resolution) => {
      set({ isLoading: true, error: null });
      
      try {
        set(state => ({
          mergeRequests: state.mergeRequests.map(mr => 
            mr.id === requestId ? {
              ...mr,
              conflicts: mr.conflicts.map(c => 
                c.id === conflictId ? { ...c, resolved: true, resolution } : c
              ),
              updatedAt: new Date(),
            } : mr
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to resolve conflict', isLoading: false });
        throw error;
      }
    },
    
    // Comparison Actions
    compareVersions: async (fromId, toId) => {
      const startTime = Date.now();
      set({ isLoading: true, error: null });
      
      try {
        const fromVersion = get().getVersion(fromId);
        const toVersion = get().getVersion(toId);
        
        if (!fromVersion || !toVersion) {
          throw new Error('Version not found');
        }
        
        // Simulate comparison process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const comparison: VersionComparison = {
          id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromVersion: fromId,
          toVersion: toId,
          changes: [], // Would be calculated based on actual changes
          summary: {
            added: Math.floor(Math.random() * 10),
            modified: Math.floor(Math.random() * 5),
            deleted: Math.floor(Math.random() * 3),
            renamed: Math.floor(Math.random() * 2),
            moved: Math.floor(Math.random() * 2),
          },
          impact: 'minor',
        };
        
        set(state => ({
          comparisons: [...state.comparisons, comparison],
          isLoading: false,
        }));
        
        get().updatePerformance({ compareTime: Date.now() - startTime });
        return comparison;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to compare versions', isLoading: false });
        throw error;
      }
    },
    
    getComparison: (id) => {
      return get().comparisons.find(c => c.id === id) || null;
    },
    
    // Utility Actions
    exportProject: async (projectId, format) => {
      set({ isLoading: true, error: null });
      
      try {
        const versions = get().getVersionsByProject(projectId);
        const branches = get().branches.filter(b => b.projectId === projectId);
        
        const data = {
          project: projectId,
          versions,
          branches,
          exportedAt: new Date(),
        };
        
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        
        set({ isLoading: false });
        return blob;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to export project', isLoading: false });
        throw error;
      }
    },
    
    importProject: async (file) => {
      set({ isLoading: true, error: null });
      
      try {
        const content = await file.text();
        const data = JSON.parse(content);
        
        set(state => ({
          versions: [...state.versions, ...data.versions],
          branches: [...state.branches, ...data.branches],
          isLoading: false,
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to import project', isLoading: false });
        throw error;
      }
    },
    
    backupProject: async (projectId) => {
      set({ isLoading: true, error: null });
      
      try {
        // Simulate backup process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to backup project', isLoading: false });
        throw error;
      }
    },
    
    restoreProject: async (backupId) => {
      set({ isLoading: true, error: null });
      
      try {
        // Simulate restore process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to restore project', isLoading: false });
        throw error;
      }
    },
    
    // Config Actions
    updateConfig: (config) => {
      set(state => ({
        config: { ...state.config, ...config },
      }));
    },
    
    resetConfig: () => {
      set({ config: defaultConfig });
    },
    
    // Stats Actions
    updateStats: () => {
      const state = get();
      const stats: VersioningStats = {
        totalVersions: state.versions.length,
        totalBranches: state.branches.length,
        totalMergeRequests: state.mergeRequests.length,
        averageVersionSize: state.versions.reduce((sum, v) => sum + v.size, 0) / state.versions.length || 0,
        mostActiveAuthor: '', // Would be calculated
        versionFrequency: {}, // Would be calculated
        branchActivity: {}, // Would be calculated
        mergeSuccess: state.mergeRequests.filter(mr => mr.status === 'merged').length,
        conflictRate: state.mergeRequests.reduce((sum, mr) => sum + mr.conflicts.length, 0) / state.mergeRequests.length || 0,
      };
      
      set({ stats });
    },
    
    getProjectStats: (projectId) => {
      const state = get();
      const projectVersions = state.versions.filter(v => v.projectId === projectId);
      const projectBranches = state.branches.filter(b => b.projectId === projectId);
      
      return {
        totalVersions: projectVersions.length,
        totalBranches: projectBranches.length,
        averageVersionSize: projectVersions.reduce((sum, v) => sum + v.size, 0) / projectVersions.length || 0,
      };
    },
    
    // Performance Actions
    updatePerformance: (metrics) => {
      set(state => ({
        performance: { ...state.performance, ...metrics },
      }));
    },
    
    // Data Actions
    loadData: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // Data is automatically loaded by persist middleware
        set({ isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load data', isLoading: false });
        throw error;
      }
    },
    
    saveData: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // Data is automatically saved by persist middleware
        set({ isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to save data', isLoading: false });
        throw error;
      }
    },
    
    clearData: () => {
      set({
        versions: [],
        branches: [],
        mergeRequests: [],
        comparisons: [],
        currentProject: null,
        currentBranch: null,
        currentVersion: null,
        stats: defaultStats,
        error: null,
      });
    },
    
    // System Actions
    initialize: async () => {
      set({ isLoading: true, error: null });
      
      try {
        await get().loadData();
        get().updateStats();
        set({ isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to initialize', isLoading: false });
        throw error;
      }
    },
    
    cleanup: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const state = get();
        const cutoffDate = new Date(Date.now() - state.config.retentionDays * 24 * 60 * 60 * 1000);
        
        // Clean old versions
        const filteredVersions = state.versions.filter(v => v.timestamp > cutoffDate);
        
        // Clean old comparisons
        const filteredComparisons = state.comparisons.slice(-50); // Keep last 50
        
        set({
          versions: filteredVersions,
          comparisons: filteredComparisons,
          isLoading: false,
        });
        
        get().updateStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to cleanup', isLoading: false });
        throw error;
      }
    },
  }),
  {
    name: 'project-versioning-store',
    partialize: (state) => ({
      versions: state.versions,
      branches: state.branches,
      mergeRequests: state.mergeRequests,
      comparisons: state.comparisons,
      currentProject: state.currentProject,
      currentBranch: state.currentBranch,
      currentVersion: state.currentVersion,
      config: state.config,
    }),
  }
));

// Version Manager Class
class VersionManager {
  private store = useVersioningStore;
  private cleanupInterval?: NodeJS.Timeout;
  private autoSaveInterval?: NodeJS.Timeout;
  
  async initialize() {
    await this.store.getState().initialize();
    this.startPeriodicTasks();
  }
  
  private startPeriodicTasks() {
    const config = this.store.getState().config;
    
    // Auto cleanup
    if (config.autoCleanup) {
      this.cleanupInterval = setInterval(() => {
        this.store.getState().cleanup();
      }, config.cleanupInterval);
    }
    
    // Auto save
    if (config.autoSave) {
      this.autoSaveInterval = setInterval(() => {
        this.store.getState().saveData();
      }, config.autoSaveInterval);
    }
  }
  
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

// Global instance
export const versionManager = new VersionManager();

// Utility functions
export const formatVersionNumber = (version: string): string => {
  const parts = version.split('.');
  return parts.map(part => part.padStart(2, '0')).join('.');
};

export const getVersionIcon = (status: ProjectVersion['status']): string => {
  switch (status) {
    case 'draft': return '📝';
    case 'published': return '✅';
    case 'archived': return '📦';
    default: return '📄';
  }
};

export const getVersionColor = (status: ProjectVersion['status']): string => {
  switch (status) {
    case 'draft': return 'text-yellow-600';
    case 'published': return 'text-green-600';
    case 'archived': return 'text-gray-600';
    default: return 'text-blue-600';
  }
};

export const getBranchIcon = (isProtected: boolean): string => {
  return isProtected ? '🔒' : '🌿';
};

export const getMergeRequestIcon = (status: MergeRequest['status']): string => {
  switch (status) {
    case 'open': return '🔄';
    case 'merged': return '✅';
    case 'closed': return '❌';
    case 'conflict': return '⚠️';
    default: return '📋';
  }
};

export const calculateVersionImpact = (changes: VersionChange[]): 'major' | 'minor' | 'patch' => {
  const hasBreaking = changes.some(c => c.type === 'deleted' || c.type === 'renamed');
  const hasFeatures = changes.some(c => c.type === 'added');
  
  if (hasBreaking) return 'major';
  if (hasFeatures) return 'minor';
  return 'patch';
};

// Custom hook
export const useProjectVersioning = () => {
  const store = useVersioningStore();
  
  return {
    // State
    ...store,
    
    // Computed values
    hasVersions: store.versions.length > 0,
    hasBranches: store.branches.length > 0,
    hasMergeRequests: store.mergeRequests.length > 0,
    currentVersionData: store.currentVersion ? store.getVersion(store.currentVersion) : null,
    currentBranchData: store.currentBranch ? store.branches.find(b => b.id === store.currentBranch) : null,
    
    // Quick actions
    quickCreateVersion: (title: string, description: string) => {
      return store.createVersion({ title, description, status: 'draft' });
    },
    
    quickCreateBranch: (name: string, description: string) => {
      return store.createBranch({ name, description });
    },
    
    quickMergeRequest: (title: string, sourceBranch: string, targetBranch: string) => {
      return store.createMergeRequest({ title, sourceBranch, targetBranch });
    },
    
    // Advanced actions
    bulkTagVersions: async (versionIds: string[], tags: string[]) => {
      for (const id of versionIds) {
        await store.tagVersion(id, tags);
      }
    },
    
    bulkDeleteVersions: async (versionIds: string[]) => {
      for (const id of versionIds) {
        await store.deleteVersion(id);
      }
    },
    
    getVersionHistory: (projectId: string) => {
      return store.getVersionsByProject(projectId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    
    getBranchTree: (projectId: string) => {
      const branches = store.branches.filter(b => b.projectId === projectId);
      // Would build a tree structure based on parent relationships
      return branches;
    },
  };
};