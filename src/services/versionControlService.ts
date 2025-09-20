import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  content: string;
  hash: string;
  size: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  message: string;
  timestamp: Date;
  tags: string[];
  branch: string;
  parentVersions: string[];
  metadata: {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
    encoding: string;
    mimeType: string;
  };
}

export interface DiffChunk {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string[];
  context?: string;
}

export interface FileDiff {
  id: string;
  fileId: string;
  oldVersion: string;
  newVersion: string;
  chunks: DiffChunk[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
    totalChanges: number;
  };
  similarity: number;
  isBinary: boolean;
  isRenamed: boolean;
  oldPath?: string;
  newPath?: string;
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isProtected: boolean;
  lastCommit: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  ahead: number;
  behind: number;
}

export interface Commit {
  id: string;
  hash: string;
  message: string;
  description?: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: Date;
  branch: string;
  parentCommits: string[];
  files: {
    fileId: string;
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    changes: number;
  }[];
  stats: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  tags: string[];
  verified: boolean;
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'open' | 'merged' | 'closed' | 'draft';
  commits: string[];
  files: FileDiff[];
  reviewers: {
    id: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
  }[];
  conflicts: {
    fileId: string;
    path: string;
    type: 'content' | 'rename' | 'delete';
  }[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
}

export interface VersionControlStats {
  totalVersions: number;
  totalCommits: number;
  totalBranches: number;
  totalMergeRequests: number;
  activeContributors: number;
  codeChurn: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  branchHealth: {
    stale: number;
    active: number;
    merged: number;
  };
  reviewMetrics: {
    averageReviewTime: number;
    approvalRate: number;
    rejectionRate: number;
  };
}

export interface VersionControlConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  maxVersionsPerFile: number;
  enableBranching: boolean;
  requireReviews: boolean;
  minReviewers: number;
  enableConflictResolution: boolean;
  diffAlgorithm: 'myers' | 'patience' | 'histogram';
  contextLines: number;
  ignoreWhitespace: boolean;
  enableNotifications: boolean;
  compressionEnabled: boolean;
}

// Store
interface VersionControlStore {
  // State
  versions: FileVersion[];
  diffs: FileDiff[];
  branches: Branch[];
  commits: Commit[];
  mergeRequests: MergeRequest[];
  currentBranch: string;
  selectedVersions: string[];
  selectedCommits: string[];
  isLoading: boolean;
  error: string | null;
  stats: VersionControlStats;
  config: VersionControlConfig;
  
  // Filters and Search
  searchQuery: string;
  authorFilter: string;
  branchFilter: string;
  dateRange: { start: Date; end: Date } | null;
  fileTypeFilter: string;
  
  // UI State
  showDiffView: boolean;
  showBranchView: boolean;
  showCommitHistory: boolean;
  showMergeRequests: boolean;
  diffViewMode: 'side-by-side' | 'unified' | 'split';
  
  // Actions - Version Management
  createVersion: (fileId: string, content: string, message: string) => Promise<void>;
  deleteVersion: (versionId: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
  compareVersions: (oldVersionId: string, newVersionId: string) => Promise<FileDiff>;
  getVersionHistory: (fileId: string) => Promise<FileVersion[]>;
  
  // Actions - Branch Management
  createBranch: (name: string, description: string, fromBranch?: string) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  mergeBranch: (sourceBranch: string, targetBranch: string) => Promise<void>;
  
  // Actions - Commit Management
  createCommit: (message: string, description?: string, files?: string[]) => Promise<void>;
  revertCommit: (commitId: string) => Promise<void>;
  cherryPickCommit: (commitId: string, targetBranch: string) => Promise<void>;
  
  // Actions - Merge Requests
  createMergeRequest: (title: string, description: string, sourceBranch: string, targetBranch: string) => Promise<void>;
  reviewMergeRequest: (mergeRequestId: string, status: 'approved' | 'rejected', comment?: string) => Promise<void>;
  mergeMergeRequest: (mergeRequestId: string) => Promise<void>;
  closeMergeRequest: (mergeRequestId: string) => Promise<void>;
  
  // Actions - Diff and Comparison
  generateDiff: (oldContent: string, newContent: string) => FileDiff;
  applyPatch: (diff: FileDiff, content: string) => string;
  resolveConflict: (fileId: string, resolution: string) => Promise<void>;
  
  // Actions - Search and Filter
  setSearchQuery: (query: string) => void;
  setAuthorFilter: (author: string) => void;
  setBranchFilter: (branch: string) => void;
  setDateRange: (range: { start: Date; end: Date } | null) => void;
  setFileTypeFilter: (fileType: string) => void;
  clearFilters: () => void;
  
  // Actions - Selection
  selectVersion: (versionId: string) => void;
  selectCommit: (commitId: string) => void;
  clearSelection: () => void;
  
  // Actions - UI
  setShowDiffView: (show: boolean) => void;
  setShowBranchView: (show: boolean) => void;
  setShowCommitHistory: (show: boolean) => void;
  setShowMergeRequests: (show: boolean) => void;
  setDiffViewMode: (mode: 'side-by-side' | 'unified' | 'split') => void;
  
  // Actions - Configuration
  updateConfig: (config: Partial<VersionControlConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  
  // Actions - Quick Actions
  quickCommit: (message: string) => Promise<void>;
  quickBranch: (name: string) => Promise<void>;
  quickMerge: (sourceBranch: string) => Promise<void>;
  
  // Actions - Advanced Features
  exportHistory: (format: 'json' | 'csv' | 'git') => Promise<string>;
  importHistory: (data: string, format: 'json' | 'git') => Promise<void>;
  optimizeStorage: () => Promise<void>;
  
  // Actions - System
  refreshData: () => Promise<void>;
  clearCache: () => void;
  getRecommendations: () => string[];
}

// Default configuration
const defaultConfig: VersionControlConfig = {
  autoSave: true,
  autoSaveInterval: 300000, // 5 minutes
  maxVersionsPerFile: 100,
  enableBranching: true,
  requireReviews: false,
  minReviewers: 1,
  enableConflictResolution: true,
  diffAlgorithm: 'myers',
  contextLines: 3,
  ignoreWhitespace: false,
  enableNotifications: true,
  compressionEnabled: true
};

// Create store
export const useVersionControlStore = create<VersionControlStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  versions: [],
  diffs: [],
  branches: [
    {
      id: 'main',
      name: 'main',
      description: 'Main development branch',
      isDefault: true,
      isProtected: true,
      lastCommit: 'commit-1',
      author: { id: 'user-1', name: 'System' },
      createdAt: new Date(),
      updatedAt: new Date(),
      ahead: 0,
      behind: 0
    }
  ],
  commits: [],
  mergeRequests: [],
  currentBranch: 'main',
  selectedVersions: [],
  selectedCommits: [],
  isLoading: false,
  error: null,
  stats: {
    totalVersions: 0,
    totalCommits: 0,
    totalBranches: 1,
    totalMergeRequests: 0,
    activeContributors: 0,
    codeChurn: { daily: 0, weekly: 0, monthly: 0 },
    branchHealth: { stale: 0, active: 1, merged: 0 },
    reviewMetrics: { averageReviewTime: 0, approvalRate: 0, rejectionRate: 0 }
  },
  config: defaultConfig,
  
  // Filters
  searchQuery: '',
  authorFilter: '',
  branchFilter: '',
  dateRange: null,
  fileTypeFilter: '',
  
  // UI State
  showDiffView: false,
  showBranchView: false,
  showCommitHistory: false,
  showMergeRequests: false,
  diffViewMode: 'side-by-side',
  
  // Version Management Actions
  createVersion: async (fileId: string, content: string, message: string) => {
    set({ isLoading: true, error: null });
    try {
      const versions = get().versions;
      const existingVersions = versions.filter(v => v.fileId === fileId);
      const newVersion: FileVersion = {
        id: `version-${Date.now()}`,
        fileId,
        version: existingVersions.length + 1,
        content,
        hash: `hash-${Date.now()}`,
        size: content.length,
        author: { id: 'current-user', name: 'Current User' },
        message,
        timestamp: new Date(),
        tags: [],
        branch: get().currentBranch,
        parentVersions: existingVersions.length > 0 ? [existingVersions[existingVersions.length - 1].id] : [],
        metadata: {
          linesAdded: content.split('\n').length,
          linesRemoved: 0,
          linesModified: 0,
          encoding: 'utf-8',
          mimeType: 'text/plain'
        }
      };
      
      set(state => ({
        versions: [...state.versions, newVersion],
        stats: {
          ...state.stats,
          totalVersions: state.stats.totalVersions + 1
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create version' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteVersion: async (versionId: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        versions: state.versions.filter(v => v.id !== versionId),
        stats: {
          ...state.stats,
          totalVersions: Math.max(0, state.stats.totalVersions - 1)
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete version' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  restoreVersion: async (versionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const version = get().versions.find(v => v.id === versionId);
      if (version) {
        // Create new version with restored content
        await get().createVersion(version.fileId, version.content, `Restored from version ${version.version}`);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to restore version' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  compareVersions: async (oldVersionId: string, newVersionId: string) => {
    const oldVersion = get().versions.find(v => v.id === oldVersionId);
    const newVersion = get().versions.find(v => v.id === newVersionId);
    
    if (!oldVersion || !newVersion) {
      throw new Error('Version not found');
    }
    
    return get().generateDiff(oldVersion.content, newVersion.content);
  },
  
  getVersionHistory: async (fileId: string) => {
    return get().versions
      .filter(v => v.fileId === fileId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
  
  // Branch Management Actions
  createBranch: async (name: string, description: string, fromBranch?: string) => {
    set({ isLoading: true, error: null });
    try {
      const newBranch: Branch = {
        id: `branch-${Date.now()}`,
        name,
        description,
        isDefault: false,
        isProtected: false,
        lastCommit: '',
        author: { id: 'current-user', name: 'Current User' },
        createdAt: new Date(),
        updatedAt: new Date(),
        ahead: 0,
        behind: 0
      };
      
      set(state => ({
        branches: [...state.branches, newBranch],
        stats: {
          ...state.stats,
          totalBranches: state.stats.totalBranches + 1
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create branch' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteBranch: async (branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const branch = get().branches.find(b => b.id === branchId);
      if (branch?.isDefault || branch?.isProtected) {
        throw new Error('Cannot delete protected or default branch');
      }
      
      set(state => ({
        branches: state.branches.filter(b => b.id !== branchId),
        stats: {
          ...state.stats,
          totalBranches: Math.max(1, state.stats.totalBranches - 1)
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete branch' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  switchBranch: async (branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const branch = get().branches.find(b => b.id === branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }
      
      set({ currentBranch: branchId });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to switch branch' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  mergeBranch: async (sourceBranch: string, targetBranch: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate merge operation
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to merge branch' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Commit Management Actions
  createCommit: async (message: string, description?: string, files?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const newCommit: Commit = {
        id: `commit-${Date.now()}`,
        hash: `hash-${Date.now()}`,
        message,
        description,
        author: {
          id: 'current-user',
          name: 'Current User',
          email: 'user@example.com'
        },
        timestamp: new Date(),
        branch: get().currentBranch,
        parentCommits: [],
        files: files?.map(fileId => ({
          fileId,
          path: `/path/to/${fileId}`,
          status: 'modified' as const,
          changes: Math.floor(Math.random() * 50) + 1
        })) || [],
        stats: {
          filesChanged: files?.length || 0,
          insertions: Math.floor(Math.random() * 100),
          deletions: Math.floor(Math.random() * 50)
        },
        tags: [],
        verified: false
      };
      
      set(state => ({
        commits: [...state.commits, newCommit],
        stats: {
          ...state.stats,
          totalCommits: state.stats.totalCommits + 1
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create commit' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  revertCommit: async (commitId: string) => {
    set({ isLoading: true, error: null });
    try {
      const commit = get().commits.find(c => c.id === commitId);
      if (commit) {
        await get().createCommit(`Revert "${commit.message}"`, `This reverts commit ${commit.hash}`);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to revert commit' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  cherryPickCommit: async (commitId: string, targetBranch: string) => {
    set({ isLoading: true, error: null });
    try {
      const commit = get().commits.find(c => c.id === commitId);
      if (commit) {
        const currentBranch = get().currentBranch;
        await get().switchBranch(targetBranch);
        await get().createCommit(`Cherry-pick: ${commit.message}`, commit.description);
        await get().switchBranch(currentBranch);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cherry-pick commit' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Merge Request Actions
  createMergeRequest: async (title: string, description: string, sourceBranch: string, targetBranch: string) => {
    set({ isLoading: true, error: null });
    try {
      const newMergeRequest: MergeRequest = {
        id: `mr-${Date.now()}`,
        title,
        description,
        sourceBranch,
        targetBranch,
        author: { id: 'current-user', name: 'Current User' },
        status: 'open',
        commits: [],
        files: [],
        reviewers: [],
        conflicts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set(state => ({
        mergeRequests: [...state.mergeRequests, newMergeRequest],
        stats: {
          ...state.stats,
          totalMergeRequests: state.stats.totalMergeRequests + 1
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create merge request' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  reviewMergeRequest: async (mergeRequestId: string, status: 'approved' | 'rejected', comment?: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        mergeRequests: state.mergeRequests.map(mr => 
          mr.id === mergeRequestId
            ? {
                ...mr,
                reviewers: [
                  ...mr.reviewers.filter(r => r.id !== 'current-user'),
                  {
                    id: 'current-user',
                    name: 'Current User',
                    status,
                    comment
                  }
                ],
                updatedAt: new Date()
              }
            : mr
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to review merge request' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  mergeMergeRequest: async (mergeRequestId: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        mergeRequests: state.mergeRequests.map(mr => 
          mr.id === mergeRequestId
            ? {
                ...mr,
                status: 'merged' as const,
                mergedAt: new Date(),
                updatedAt: new Date()
              }
            : mr
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to merge request' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  closeMergeRequest: async (mergeRequestId: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        mergeRequests: state.mergeRequests.map(mr => 
          mr.id === mergeRequestId
            ? {
                ...mr,
                status: 'closed' as const,
                updatedAt: new Date()
              }
            : mr
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to close merge request' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Diff and Comparison Actions
  generateDiff: (oldContent: string, newContent: string) => {
    // Simple diff implementation
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const chunks: DiffChunk[] = [];
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    // Basic line-by-line comparison
    const maxLines = Math.max(oldLines.length, newLines.length);
    let currentChunk: DiffChunk | null = null;
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === newLine) {
        if (currentChunk && currentChunk.type !== 'unchanged') {
          chunks.push(currentChunk);
          currentChunk = null;
        }
        if (!currentChunk) {
          currentChunk = {
            type: 'unchanged',
            oldStart: i,
            oldLines: 1,
            newStart: i,
            newLines: 1,
            content: [oldLine || '']
          };
        } else {
          currentChunk.oldLines++;
          currentChunk.newLines++;
          currentChunk.content.push(oldLine || '');
        }
      } else if (oldLine && !newLine) {
        deletions++;
        if (currentChunk && currentChunk.type !== 'removed') {
          chunks.push(currentChunk);
          currentChunk = null;
        }
        if (!currentChunk) {
          currentChunk = {
            type: 'removed',
            oldStart: i,
            oldLines: 1,
            newStart: i,
            newLines: 0,
            content: [oldLine]
          };
        } else {
          currentChunk.oldLines++;
          currentChunk.content.push(oldLine);
        }
      } else if (!oldLine && newLine) {
        additions++;
        if (currentChunk && currentChunk.type !== 'added') {
          chunks.push(currentChunk);
          currentChunk = null;
        }
        if (!currentChunk) {
          currentChunk = {
            type: 'added',
            oldStart: i,
            oldLines: 0,
            newStart: i,
            newLines: 1,
            content: [newLine]
          };
        } else {
          currentChunk.newLines++;
          currentChunk.content.push(newLine);
        }
      } else {
        modifications++;
        if (currentChunk && currentChunk.type !== 'modified') {
          chunks.push(currentChunk);
          currentChunk = null;
        }
        if (!currentChunk) {
          currentChunk = {
            type: 'modified',
            oldStart: i,
            oldLines: 1,
            newStart: i,
            newLines: 1,
            content: [`-${oldLine}`, `+${newLine}`]
          };
        } else {
          currentChunk.oldLines++;
          currentChunk.newLines++;
          currentChunk.content.push(`-${oldLine}`, `+${newLine}`);
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    const diff: FileDiff = {
      id: `diff-${Date.now()}`,
      fileId: 'unknown',
      oldVersion: 'old',
      newVersion: 'new',
      chunks,
      stats: {
        additions,
        deletions,
        modifications,
        totalChanges: additions + deletions + modifications
      },
      similarity: 1 - (additions + deletions + modifications) / maxLines,
      isBinary: false,
      isRenamed: false
    };
    
    return diff;
  },
  
  applyPatch: (diff: FileDiff, content: string) => {
    // Simple patch application
    const lines = content.split('\n');
    let result = [...lines];
    
    // Apply chunks in reverse order to maintain line numbers
    for (let i = diff.chunks.length - 1; i >= 0; i--) {
      const chunk = diff.chunks[i];
      if (chunk.type === 'added') {
        result.splice(chunk.newStart, 0, ...chunk.content);
      } else if (chunk.type === 'removed') {
        result.splice(chunk.oldStart, chunk.oldLines);
      } else if (chunk.type === 'modified') {
        result.splice(chunk.oldStart, chunk.oldLines, ...chunk.content.filter(line => line.startsWith('+')).map(line => line.substring(1)));
      }
    }
    
    return result.join('\n');
  },
  
  resolveConflict: async (fileId: string, resolution: string) => {
    set({ isLoading: true, error: null });
    try {
      await get().createVersion(fileId, resolution, 'Resolved merge conflict');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to resolve conflict' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Search and Filter Actions
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setAuthorFilter: (author: string) => set({ authorFilter: author }),
  setBranchFilter: (branch: string) => set({ branchFilter: branch }),
  setDateRange: (range: { start: Date; end: Date } | null) => set({ dateRange: range }),
  setFileTypeFilter: (fileType: string) => set({ fileTypeFilter: fileType }),
  clearFilters: () => set({
    searchQuery: '',
    authorFilter: '',
    branchFilter: '',
    dateRange: null,
    fileTypeFilter: ''
  }),
  
  // Selection Actions
  selectVersion: (versionId: string) => {
    set(state => ({
      selectedVersions: state.selectedVersions.includes(versionId)
        ? state.selectedVersions.filter(id => id !== versionId)
        : [...state.selectedVersions, versionId]
    }));
  },
  
  selectCommit: (commitId: string) => {
    set(state => ({
      selectedCommits: state.selectedCommits.includes(commitId)
        ? state.selectedCommits.filter(id => id !== commitId)
        : [...state.selectedCommits, commitId]
    }));
  },
  
  clearSelection: () => set({ selectedVersions: [], selectedCommits: [] }),
  
  // UI Actions
  setShowDiffView: (show: boolean) => set({ showDiffView: show }),
  setShowBranchView: (show: boolean) => set({ showBranchView: show }),
  setShowCommitHistory: (show: boolean) => set({ showCommitHistory: show }),
  setShowMergeRequests: (show: boolean) => set({ showMergeRequests: show }),
  setDiffViewMode: (mode: 'side-by-side' | 'unified' | 'split') => set({ diffViewMode: mode }),
  
  // Configuration Actions
  updateConfig: async (newConfig: Partial<VersionControlConfig>) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        config: { ...state.config, ...newConfig }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update configuration' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  resetConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ config: defaultConfig });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reset configuration' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Quick Actions
  quickCommit: async (message: string) => {
    await get().createCommit(message);
  },
  
  quickBranch: async (name: string) => {
    await get().createBranch(name, `Quick branch: ${name}`);
  },
  
  quickMerge: async (sourceBranch: string) => {
    await get().mergeBranch(sourceBranch, get().currentBranch);
  },
  
  // Advanced Features
  exportHistory: async (format: 'json' | 'csv' | 'git') => {
    const state = get();
    
    if (format === 'json') {
      return JSON.stringify({
        versions: state.versions,
        commits: state.commits,
        branches: state.branches,
        mergeRequests: state.mergeRequests
      }, null, 2);
    } else if (format === 'csv') {
      const csvData = state.commits.map(commit => 
        `${commit.hash},${commit.message},${commit.author.name},${commit.timestamp.toISOString()},${commit.branch}`
      ).join('\n');
      return `Hash,Message,Author,Timestamp,Branch\n${csvData}`;
    } else {
      // Git format simulation
      return state.commits.map(commit => 
        `commit ${commit.hash}\nAuthor: ${commit.author.name} <${commit.author.email}>\nDate: ${commit.timestamp.toISOString()}\n\n    ${commit.message}\n`
      ).join('\n');
    }
  },
  
  importHistory: async (data: string, format: 'json' | 'git') => {
    set({ isLoading: true, error: null });
    try {
      if (format === 'json') {
        const parsed = JSON.parse(data);
        set({
          versions: parsed.versions || [],
          commits: parsed.commits || [],
          branches: parsed.branches || [],
          mergeRequests: parsed.mergeRequests || []
        });
      }
      // Git format import would require more complex parsing
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to import history' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  optimizeStorage: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate storage optimization
      const state = get();
      const optimizedVersions = state.versions.slice(-state.config.maxVersionsPerFile);
      set({ versions: optimizedVersions });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to optimize storage' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // System Actions
  refreshData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh data' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearCache: () => {
    set({ diffs: [] });
  },
  
  getRecommendations: () => {
    const state = get();
    const recommendations: string[] = [];
    
    if (state.stats.totalVersions > state.config.maxVersionsPerFile) {
      recommendations.push('Consider optimizing storage to remove old versions');
    }
    
    if (state.branches.length > 10) {
      recommendations.push('You have many branches. Consider cleaning up merged branches');
    }
    
    if (state.mergeRequests.filter(mr => mr.status === 'open').length > 5) {
      recommendations.push('You have several open merge requests that need attention');
    }
    
    return recommendations;
  }
})));

// Manager class
export class VersionControlManager {
  private static instance: VersionControlManager;
  
  static getInstance(): VersionControlManager {
    if (!VersionControlManager.instance) {
      VersionControlManager.instance = new VersionControlManager();
    }
    return VersionControlManager.instance;
  }
  
  async initialize() {
    const store = useVersionControlStore.getState();
    await store.refreshData();
  }
  
  async cleanup() {
    const store = useVersionControlStore.getState();
    store.clearCache();
  }
}

// Global instance
export const versionControlManager = VersionControlManager.getInstance();

// Utility functions
export const formatCommitHash = (hash: string): string => {
  return hash.substring(0, 8);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'open': return 'text-green-600';
    case 'merged': return 'text-blue-600';
    case 'closed': return 'text-gray-600';
    case 'draft': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'open': return 'GitPullRequest';
    case 'merged': return 'GitMerge';
    case 'closed': return 'X';
    case 'draft': return 'Edit';
    default: return 'Circle';
  }
};

export const calculateBranchHealth = (branches: Branch[]): { healthy: number; stale: number; total: number } => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const stale = branches.filter(branch => branch.updatedAt < oneWeekAgo).length;
  const healthy = branches.length - stale;
  
  return { healthy, stale, total: branches.length };
};

export const generateRecommendations = (stats: VersionControlStats, config: VersionControlConfig): string[] => {
  const recommendations: string[] = [];
  
  if (stats.branchHealth.stale > 5) {
    recommendations.push('Consider cleaning up stale branches to improve repository health');
  }
  
  if (stats.reviewMetrics.approvalRate < 0.8) {
    recommendations.push('Review approval rate is low. Consider improving code quality or review process');
  }
  
  if (stats.codeChurn.daily > 1000) {
    recommendations.push('High daily code churn detected. Consider breaking down large changes');
  }
  
  return recommendations;
};