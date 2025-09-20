import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVersionControlStore, FileVersion, Branch, Commit, MergeRequest, FileDiff, VersionControlStats, VersionControlConfig } from '../services/versionControlService';

// Utility functions
const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  return ((...args: any[]) => {
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
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Progress tracking hook
export const useProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');

  const start = useCallback((msg: string = 'Processing...') => {
    setProgress(0);
    setIsActive(true);
    setMessage(msg);
  }, []);

  const update = useCallback((value: number, msg?: string) => {
    setProgress(Math.min(100, Math.max(0, value)));
    if (msg) setMessage(msg);
  }, []);

  const complete = useCallback((msg: string = 'Completed') => {
    setProgress(100);
    setMessage(msg);
    setTimeout(() => setIsActive(false), 1000);
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setIsActive(false);
    setMessage('');
  }, []);

  return { progress, isActive, message, start, update, complete, reset };
};

// Main hook
export const useVersionControl = () => {
  const store = useVersionControlStore();
  const progress = useProgress();
  
  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!store.isLoading) {
        store.refreshData();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [store.isLoading]);
  
  // Memoized actions with error handling
  const actions = useMemo(() => ({
    // Version Management
    createVersion: async (fileId: string, content: string, message: string) => {
      try {
        progress.start('Creating version...');
        await store.createVersion(fileId, content, message);
        progress.complete('Version created successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    deleteVersion: async (versionId: string) => {
      try {
        progress.start('Deleting version...');
        await store.deleteVersion(versionId);
        progress.complete('Version deleted successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    restoreVersion: async (versionId: string) => {
      try {
        progress.start('Restoring version...');
        await store.restoreVersion(versionId);
        progress.complete('Version restored successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    compareVersions: async (oldVersionId: string, newVersionId: string) => {
      try {
        progress.start('Comparing versions...');
        const diff = await store.compareVersions(oldVersionId, newVersionId);
        progress.complete('Comparison completed');
        return diff;
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    // Branch Management
    createBranch: async (name: string, description: string, fromBranch?: string) => {
      try {
        progress.start('Creating branch...');
        await store.createBranch(name, description, fromBranch);
        progress.complete('Branch created successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    deleteBranch: async (branchId: string) => {
      try {
        progress.start('Deleting branch...');
        await store.deleteBranch(branchId);
        progress.complete('Branch deleted successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    switchBranch: async (branchId: string) => {
      try {
        progress.start('Switching branch...');
        await store.switchBranch(branchId);
        progress.complete('Branch switched successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    mergeBranch: async (sourceBranch: string, targetBranch: string) => {
      try {
        progress.start('Merging branch...');
        await store.mergeBranch(sourceBranch, targetBranch);
        progress.complete('Branch merged successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    // Commit Management
    createCommit: async (message: string, description?: string, files?: string[]) => {
      try {
        progress.start('Creating commit...');
        await store.createCommit(message, description, files);
        progress.complete('Commit created successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    revertCommit: async (commitId: string) => {
      try {
        progress.start('Reverting commit...');
        await store.revertCommit(commitId);
        progress.complete('Commit reverted successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    cherryPickCommit: async (commitId: string, targetBranch: string) => {
      try {
        progress.start('Cherry-picking commit...');
        await store.cherryPickCommit(commitId, targetBranch);
        progress.complete('Commit cherry-picked successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    // Merge Request Management
    createMergeRequest: async (title: string, description: string, sourceBranch: string, targetBranch: string) => {
      try {
        progress.start('Creating merge request...');
        await store.createMergeRequest(title, description, sourceBranch, targetBranch);
        progress.complete('Merge request created successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    reviewMergeRequest: async (mergeRequestId: string, status: 'approved' | 'rejected', comment?: string) => {
      try {
        progress.start('Submitting review...');
        await store.reviewMergeRequest(mergeRequestId, status, comment);
        progress.complete('Review submitted successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    mergeMergeRequest: async (mergeRequestId: string) => {
      try {
        progress.start('Merging request...');
        await store.mergeMergeRequest(mergeRequestId);
        progress.complete('Merge request merged successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    closeMergeRequest: async (mergeRequestId: string) => {
      try {
        progress.start('Closing merge request...');
        await store.closeMergeRequest(mergeRequestId);
        progress.complete('Merge request closed successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    }
  }), [store, progress]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickCommit: async (message: string) => {
      try {
        await store.quickCommit(message);
      } catch (error) {
        console.error('Quick commit failed:', error);
        throw error;
      }
    },
    
    quickBranch: async (name: string) => {
      try {
        await store.quickBranch(name);
      } catch (error) {
        console.error('Quick branch failed:', error);
        throw error;
      }
    },
    
    quickMerge: async (sourceBranch: string) => {
      try {
        await store.quickMerge(sourceBranch);
      } catch (error) {
        console.error('Quick merge failed:', error);
        throw error;
      }
    },
    
    optimizeStorage: async () => {
      try {
        progress.start('Optimizing storage...');
        await store.optimizeStorage();
        progress.complete('Storage optimized successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    exportHistory: async (format: 'json' | 'csv' | 'git') => {
      try {
        progress.start('Exporting history...');
        const data = await store.exportHistory(format);
        progress.complete('History exported successfully');
        return data;
      } catch (error) {
        progress.reset();
        throw error;
      }
    },
    
    importHistory: async (data: string, format: 'json' | 'git') => {
      try {
        progress.start('Importing history...');
        await store.importHistory(data, format);
        progress.complete('History imported successfully');
      } catch (error) {
        progress.reset();
        throw error;
      }
    }
  }), [store, progress]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    refreshData: throttle(store.refreshData, 1000),
    clearCache: throttle(store.clearCache, 500)
  }), [store]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    setSearchQuery: debounce(store.setSearchQuery, 300),
    setAuthorFilter: debounce(store.setAuthorFilter, 300),
    setBranchFilter: debounce(store.setBranchFilter, 300),
    setFileTypeFilter: debounce(store.setFileTypeFilter, 300)
  }), [store]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const { versions, commits, branches, mergeRequests, searchQuery, authorFilter, branchFilter, dateRange, fileTypeFilter } = store;
    
    // Filter versions
    const filteredVersions = versions.filter(version => {
      if (searchQuery && !version.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (authorFilter && version.author.name !== authorFilter) return false;
      if (branchFilter && version.branch !== branchFilter) return false;
      if (dateRange && (version.timestamp < dateRange.start || version.timestamp > dateRange.end)) return false;
      return true;
    });
    
    // Filter commits
    const filteredCommits = commits.filter(commit => {
      if (searchQuery && !commit.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (authorFilter && commit.author.name !== authorFilter) return false;
      if (branchFilter && commit.branch !== branchFilter) return false;
      if (dateRange && (commit.timestamp < dateRange.start || commit.timestamp > dateRange.end)) return false;
      return true;
    });
    
    // Filter branches
    const filteredBranches = branches.filter(branch => {
      if (searchQuery && !branch.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (authorFilter && branch.author.name !== authorFilter) return false;
      return true;
    });
    
    // Filter merge requests
    const filteredMergeRequests = mergeRequests.filter(mr => {
      if (searchQuery && !mr.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (authorFilter && mr.author.name !== authorFilter) return false;
      if (branchFilter && mr.sourceBranch !== branchFilter && mr.targetBranch !== branchFilter) return false;
      if (dateRange && (mr.createdAt < dateRange.start || mr.createdAt > dateRange.end)) return false;
      return true;
    });
    
    // Get unique authors
    const uniqueAuthors = Array.from(new Set([
      ...versions.map(v => v.author.name),
      ...commits.map(c => c.author.name),
      ...branches.map(b => b.author.name),
      ...mergeRequests.map(mr => mr.author.name)
    ]));
    
    // Get unique branches
    const uniqueBranches = Array.from(new Set([
      ...versions.map(v => v.branch),
      ...commits.map(c => c.branch),
      ...branches.map(b => b.name)
    ]));
    
    // Calculate activity metrics
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentActivity = {
      versionsToday: versions.filter(v => v.timestamp > oneDayAgo).length,
      versionsThisWeek: versions.filter(v => v.timestamp > oneWeekAgo).length,
      versionsThisMonth: versions.filter(v => v.timestamp > oneMonthAgo).length,
      commitsToday: commits.filter(c => c.timestamp > oneDayAgo).length,
      commitsThisWeek: commits.filter(c => c.timestamp > oneWeekAgo).length,
      commitsThisMonth: commits.filter(c => c.timestamp > oneMonthAgo).length
    };
    
    // Calculate branch health
    const staleBranches = branches.filter(b => b.updatedAt < oneWeekAgo && !b.isDefault);
    const activeBranches = branches.filter(b => b.updatedAt > oneWeekAgo || b.isDefault);
    
    const branchHealth = {
      total: branches.length,
      active: activeBranches.length,
      stale: staleBranches.length,
      protected: branches.filter(b => b.isProtected).length
    };
    
    // Calculate merge request metrics
    const openMergeRequests = mergeRequests.filter(mr => mr.status === 'open');
    const mergedMergeRequests = mergeRequests.filter(mr => mr.status === 'merged');
    const closedMergeRequests = mergeRequests.filter(mr => mr.status === 'closed');
    
    const mergeRequestMetrics = {
      total: mergeRequests.length,
      open: openMergeRequests.length,
      merged: mergedMergeRequests.length,
      closed: closedMergeRequests.length,
      averageReviewTime: mergedMergeRequests.length > 0 
        ? mergedMergeRequests.reduce((acc, mr) => {
            if (mr.mergedAt) {
              return acc + (mr.mergedAt.getTime() - mr.createdAt.getTime());
            }
            return acc;
          }, 0) / mergedMergeRequests.length / (1000 * 60 * 60) // Convert to hours
        : 0
    };
    
    return {
      filteredVersions,
      filteredCommits,
      filteredBranches,
      filteredMergeRequests,
      uniqueAuthors,
      uniqueBranches,
      recentActivity,
      branchHealth,
      mergeRequestMetrics,
      hasFilters: !!(searchQuery || authorFilter || branchFilter || dateRange || fileTypeFilter),
      totalResults: filteredVersions.length + filteredCommits.length + filteredBranches.length + filteredMergeRequests.length
    };
  }, [store]);
  
  return {
    // State
    ...store,
    
    // Computed values
    ...computed,
    
    // Actions
    ...actions,
    
    // Quick actions
    ...quickActions,
    
    // Throttled actions
    ...throttledActions,
    
    // Debounced actions
    ...debouncedActions,
    
    // Progress
    progress: progress.progress,
    isProcessing: progress.isActive,
    processingMessage: progress.message,
    
    // Utility functions
    clearAllFilters: store.clearFilters,
    selectAllVersions: () => {
      computed.filteredVersions.forEach(version => store.selectVersion(version.id));
    },
    selectAllCommits: () => {
      computed.filteredCommits.forEach(commit => store.selectCommit(commit.id));
    },
    getRecommendations: store.getRecommendations
  };
};

// Specialized hooks
export const useVersionControlStats = (): VersionControlStats & { isLoading: boolean } => {
  const { stats, isLoading } = useVersionControlStore();
  return { ...stats, isLoading };
};

export const useVersionControlConfig = () => {
  const { config, updateConfig, resetConfig, isLoading } = useVersionControlStore();
  
  const updateSetting = useCallback(async (key: keyof VersionControlConfig, value: any) => {
    await updateConfig({ [key]: value });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    updateSetting,
    resetConfig,
    isLoading
  };
};

export const useVersionSearch = () => {
  const {
    searchQuery,
    authorFilter,
    branchFilter,
    dateRange,
    fileTypeFilter,
    setSearchQuery,
    setAuthorFilter,
    setBranchFilter,
    setDateRange,
    setFileTypeFilter,
    clearFilters,
    filteredVersions,
    filteredCommits,
    filteredBranches,
    filteredMergeRequests,
    hasFilters,
    totalResults
  } = useVersionControl();
  
  return {
    // Current filters
    searchQuery,
    authorFilter,
    branchFilter,
    dateRange,
    fileTypeFilter,
    
    // Filter actions
    setSearchQuery,
    setAuthorFilter,
    setBranchFilter,
    setDateRange,
    setFileTypeFilter,
    clearFilters,
    
    // Results
    filteredVersions,
    filteredCommits,
    filteredBranches,
    filteredMergeRequests,
    hasFilters,
    totalResults
  };
};

export const useBranchManagement = () => {
  const {
    branches,
    currentBranch,
    createBranch,
    deleteBranch,
    switchBranch,
    mergeBranch,
    quickBranch,
    branchHealth,
    isLoading,
    error
  } = useVersionControl();
  
  const currentBranchData = useMemo(() => 
    branches.find(b => b.id === currentBranch),
    [branches, currentBranch]
  );
  
  const protectedBranches = useMemo(() => 
    branches.filter(b => b.isProtected),
    [branches]
  );
  
  const staleBranches = useMemo(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return branches.filter(b => b.updatedAt < oneWeekAgo && !b.isDefault);
  }, [branches]);
  
  return {
    branches,
    currentBranch,
    currentBranchData,
    protectedBranches,
    staleBranches,
    branchHealth,
    createBranch,
    deleteBranch,
    switchBranch,
    mergeBranch,
    quickBranch,
    isLoading,
    error
  };
};

export const useCommitHistory = () => {
  const {
    commits,
    filteredCommits,
    createCommit,
    revertCommit,
    cherryPickCommit,
    quickCommit,
    selectedCommits,
    selectCommit,
    clearSelection,
    isLoading,
    error
  } = useVersionControl();
  
  const recentCommits = useMemo(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return commits.filter(c => c.timestamp > oneDayAgo);
  }, [commits]);
  
  const commitsByAuthor = useMemo(() => {
    const grouped = commits.reduce((acc, commit) => {
      const author = commit.author.name;
      if (!acc[author]) acc[author] = [];
      acc[author].push(commit);
      return acc;
    }, {} as Record<string, Commit[]>);
    
    return Object.entries(grouped).map(([author, commits]) => ({
      author,
      commits,
      count: commits.length
    })).sort((a, b) => b.count - a.count);
  }, [commits]);
  
  return {
    commits,
    filteredCommits,
    recentCommits,
    commitsByAuthor,
    selectedCommits,
    createCommit,
    revertCommit,
    cherryPickCommit,
    quickCommit,
    selectCommit,
    clearSelection,
    isLoading,
    error
  };
};

export const useMergeRequests = () => {
  const {
    mergeRequests,
    filteredMergeRequests,
    createMergeRequest,
    reviewMergeRequest,
    mergeMergeRequest,
    closeMergeRequest,
    mergeRequestMetrics,
    isLoading,
    error
  } = useVersionControl();
  
  const openMergeRequests = useMemo(() => 
    mergeRequests.filter(mr => mr.status === 'open'),
    [mergeRequests]
  );
  
  const myMergeRequests = useMemo(() => 
    mergeRequests.filter(mr => mr.author.id === 'current-user'),
    [mergeRequests]
  );
  
  const pendingReviews = useMemo(() => 
    mergeRequests.filter(mr => 
      mr.status === 'open' && 
      mr.reviewers.some(r => r.id === 'current-user' && r.status === 'pending')
    ),
    [mergeRequests]
  );
  
  return {
    mergeRequests,
    filteredMergeRequests,
    openMergeRequests,
    myMergeRequests,
    pendingReviews,
    mergeRequestMetrics,
    createMergeRequest,
    reviewMergeRequest,
    mergeMergeRequest,
    closeMergeRequest,
    isLoading,
    error
  };
};

export const useDiffViewer = () => {
  const {
    diffs,
    showDiffView,
    diffViewMode,
    setShowDiffView,
    setDiffViewMode,
    generateDiff,
    applyPatch,
    resolveConflict
  } = useVersionControlStore();
  
  const [selectedDiff, setSelectedDiff] = useState<FileDiff | null>(null);
  
  const viewDiff = useCallback((diff: FileDiff) => {
    setSelectedDiff(diff);
    setShowDiffView(true);
  }, [setShowDiffView]);
  
  const closeDiffView = useCallback(() => {
    setShowDiffView(false);
    setSelectedDiff(null);
  }, [setShowDiffView]);
  
  const compareTwoVersions = useCallback(async (oldContent: string, newContent: string) => {
    const diff = generateDiff(oldContent, newContent);
    viewDiff(diff);
    return diff;
  }, [generateDiff, viewDiff]);
  
  return {
    diffs,
    selectedDiff,
    showDiffView,
    diffViewMode,
    viewDiff,
    closeDiffView,
    setDiffViewMode,
    generateDiff,
    compareTwoVersions,
    applyPatch,
    resolveConflict
  };
};

export const useVersionControlRealtime = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { refreshData } = useVersionControl();
  
  const connect = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectionStatus('connected');
      setLastSync(new Date());
    } catch (error) {
      setConnectionStatus('disconnected');
      throw error;
    }
  }, []);
  
  const disconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setLastSync(null);
  }, []);
  
  const forceSync = useCallback(async () => {
    if (connectionStatus === 'connected') {
      await refreshData();
      setLastSync(new Date());
    }
  }, [connectionStatus, refreshData]);
  
  // Auto-sync effect
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        forceSync();
      }, 10000); // Sync every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus, forceSync]);
  
  return {
    connectionStatus,
    lastSync,
    connect,
    disconnect,
    forceSync
  };
};

// Utility hooks
export const useThrottle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  return useMemo(() => throttle(func, delay), [func, delay]);
};

export const useDebounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  return useMemo(() => debounce(func, delay), [func, delay]);
};

// Helper function
export const calculateVersionComplexity = (version: FileVersion): number => {
  const baseComplexity = version.content.length / 1000; // Base on content length
  const metadataComplexity = (version.metadata.linesAdded + version.metadata.linesRemoved + version.metadata.linesModified) / 100;
  const branchComplexity = version.parentVersions.length * 0.5; // Multiple parents increase complexity
  
  return Math.min(10, baseComplexity + metadataComplexity + branchComplexity);
};