import { useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  useCompressionStore, 
  CompressionProfile, 
  CompressionTask, 
  CompressionConfig,
  CompressionStats,
  CompressionEvent,
  compressionManager 
} from '../services/intelligentCompressionService';

// Main Hook
export const useIntelligentCompression = () => {
  const store = useCompressionStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);

  // Auto-initialization and refresh
  useEffect(() => {
    // Initialize demo data if no profiles exist
    if (store.profiles.length === 0) {
      generateDemoData();
    }

    // Start auto-refresh for real-time updates
    if (store.config.realTimeProcessing) {
      intervalRef.current = setInterval(() => {
        store.updateSystemMetrics();
        store.updateStats();
      }, 2000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [store.config.realTimeProcessing]);

  // Auto-update stats when tasks change
  useEffect(() => {
    store.updateStats();
  }, [store.tasks]);

  // Memoized actions
  const actions = useMemo(() => ({
    // Profile Management
    createProfile: store.createProfile,
    updateProfile: store.updateProfile,
    deleteProfile: store.deleteProfile,
    duplicateProfile: store.duplicateProfile,

    // Task Management
    addTask: store.addTask,
    updateTask: store.updateTask,
    cancelTask: store.cancelTask,
    retryTask: store.retryTask,
    clearCompletedTasks: store.clearCompletedTasks,

    // Compression Operations
    startCompression: store.startCompression,
    pauseCompression: store.pauseCompression,
    resumeCompression: store.resumeCompression,
    batchCompress: store.batchCompress,

    // Configuration
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    importConfig: store.importConfig,
    exportConfig: store.exportConfig,

    // Search & Filter
    setSearchQuery: store.setSearchQuery,
    setFilterStatus: store.setFilterStatus,
    setFilterType: store.setFilterType,
    setSortBy: store.setSortBy,
    setSortOrder: store.setSortOrder,
    clearFilters: store.clearFilters,

    // Error Handling
    setError: store.setError,
    clearError: store.clearError
  }), [store]);

  // Quick Actions
  const quickActions = useMemo(() => ({
    quickCompress: store.quickCompress,
    autoOptimize: store.autoOptimize,
    previewCompression: store.previewCompression,
    optimizeForDevice: store.optimizeForDevice,
    scheduleCompression: store.scheduleCompression
  }), [store]);

  // Advanced Features
  const advancedFeatures = useMemo(() => ({
    enableAdaptiveQuality: store.enableAdaptiveQuality,
    disableAdaptiveQuality: store.disableAdaptiveQuality,
    startRealTimeProcessing: store.startRealTimeProcessing,
    stopRealTimeProcessing: store.stopRealTimeProcessing,
    updateSystemMetrics: store.updateSystemMetrics
  }), [store]);

  // System Operations
  const systemOperations = useMemo(() => ({
    clearCache: store.clearCache,
    resetSystem: store.resetSystem,
    exportLogs: store.exportLogs,
    importProfiles: store.importProfiles
  }), [store]);

  // Utilities
  const utilities = useMemo(() => ({
    generateReport: store.generateReport,
    exportStats: store.exportStats,
    addEvent: store.addEvent
  }), [store]);

  // Configuration helpers
  const configHelpers = useMemo(() => ({
    getOptimalSettings: (fileType: string, fileSize: number) => {
      const profiles = store.profiles.filter(p => p.type === fileType);
      if (profiles.length === 0) return null;
      
      // Select profile based on file size
      if (fileSize > 100 * 1024 * 1024) { // > 100MB
        return profiles.find(p => p.targetReduction >= 70) || profiles[0];
      } else if (fileSize > 10 * 1024 * 1024) { // > 10MB
        return profiles.find(p => p.targetReduction >= 50) || profiles[0];
      } else {
        return profiles.find(p => p.targetReduction >= 30) || profiles[0];
      }
    },
    
    estimateCompressionTime: (fileSize: number, algorithm: string) => {
      const baseTime = fileSize / (1024 * 1024); // 1 second per MB base
      const algorithmMultiplier = {
        'webp': 1.2,
        'h264': 2.5,
        'aac': 1.5,
        'deflate': 1.0,
        'lzma': 3.0
      }[algorithm] || 1.0;
      
      return Math.ceil(baseTime * algorithmMultiplier);
    },
    
    validateProfile: (profile: Partial<CompressionProfile>) => {
      const errors: string[] = [];
      
      if (!profile.name || profile.name.trim().length === 0) {
        errors.push('Nome do perfil é obrigatório');
      }
      
      if (!profile.type) {
        errors.push('Tipo de arquivo é obrigatório');
      }
      
      if (profile.quality !== undefined && (profile.quality < 0 || profile.quality > 100)) {
        errors.push('Qualidade deve estar entre 0 e 100');
      }
      
      if (profile.targetReduction !== undefined && (profile.targetReduction < 0 || profile.targetReduction > 100)) {
        errors.push('Redução alvo deve estar entre 0 e 100%');
      }
      
      return errors;
    }
  }), [store.profiles]);

  // Analytics helpers
  const analyticsHelpers = useMemo(() => ({
    getCompressionTrends: (days: number = 7) => {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const tasks = store.tasks.filter(task => task.startTime >= startDate);
      const dailyStats = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayTasks = tasks.filter(task => {
          const taskDate = new Date(task.startTime);
          return taskDate.toDateString() === date.toDateString();
        });
        
        dailyStats.push({
          date: date.toISOString().split('T')[0],
          tasks: dayTasks.length,
          completed: dayTasks.filter(t => t.status === 'completed').length,
          totalSavings: dayTasks.reduce((sum, task) => 
            sum + (task.originalSize - (task.compressedSize || task.originalSize)), 0
          ),
          averageRatio: dayTasks.length > 0 
            ? dayTasks.reduce((sum, task) => sum + (task.compressionRatio || 0), 0) / dayTasks.length
            : 0
        });
      }
      
      return dailyStats;
    },
    
    getTopPerformingProfiles: (limit: number = 5) => {
      const profileStats = store.profiles.map(profile => {
        const profileTasks = store.tasks.filter(task => task.profileId === profile.id);
        const completedTasks = profileTasks.filter(task => task.status === 'completed');
        
        return {
          profile,
          totalTasks: profileTasks.length,
          completedTasks: completedTasks.length,
          successRate: profileTasks.length > 0 ? (completedTasks.length / profileTasks.length) * 100 : 0,
          averageRatio: completedTasks.length > 0 
            ? completedTasks.reduce((sum, task) => sum + (task.compressionRatio || 0), 0) / completedTasks.length
            : 0,
          totalSavings: completedTasks.reduce((sum, task) => 
            sum + (task.originalSize - (task.compressedSize || task.originalSize)), 0
          )
        };
      });
      
      return profileStats
        .sort((a, b) => b.averageRatio - a.averageRatio)
        .slice(0, limit);
    },
    
    getSystemPerformanceMetrics: () => {
      const completedTasks = store.tasks.filter(task => task.status === 'completed');
      const failedTasks = store.tasks.filter(task => task.status === 'failed');
      
      return {
        successRate: store.tasks.length > 0 ? (completedTasks.length / store.tasks.length) * 100 : 0,
        averageProcessingTime: completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / completedTasks.length
          : 0,
        throughput: store.stats.throughput,
        errorRate: store.tasks.length > 0 ? (failedTasks.length / store.tasks.length) * 100 : 0,
        totalSpaceSaved: store.stats.totalSpaceSaved,
        systemLoad: store.systemLoad,
        memoryUsage: store.memoryUsage
      };
    }
  }), [store.tasks, store.profiles, store.stats, store.systemLoad, store.memoryUsage]);

  // Debug helpers
  const debugHelpers = useMemo(() => ({
    logState: () => {
      console.group('🗜️ Intelligent Compression State');
      console.groupEnd();
    },
    
    validateState: () => {
      const issues: string[] = [];
      
      // Check for orphaned tasks
      const orphanedTasks = store.tasks.filter(task => 
        !store.profiles.find(profile => profile.id === task.profileId)
      );
      if (orphanedTasks.length > 0) {
        issues.push(`${orphanedTasks.length} tarefas órfãs encontradas`);
      }
      
      // Check for invalid configurations
      if (store.config.maxConcurrentTasks <= 0) {
        issues.push('Configuração inválida: maxConcurrentTasks deve ser > 0');
      }
      
      if (store.config.qualityThreshold < 0 || store.config.qualityThreshold > 100) {
        issues.push('Configuração inválida: qualityThreshold deve estar entre 0-100');
      }
      
      return issues;
    },
    
    exportDebugInfo: () => {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        state: {
          profiles: store.profiles,
          tasks: store.tasks,
          stats: store.stats,
          config: store.config,
          events: store.events.slice(0, 50) // Last 50 events
        },
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled
        },
        performance: {
          systemLoad: store.systemLoad,
          memoryUsage: store.memoryUsage,
          activeConnections: store.activeConnections,
          processingQueue: store.processingQueue
        }
      };
      
      const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compression-debug-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  }), [store]);

  // Computed values
  const computed = useMemo(() => ({
    filteredTasks: store.tasks.filter(task => {
      const matchesSearch = store.searchQuery === '' || 
        task.fileName.toLowerCase().includes(store.searchQuery.toLowerCase());
      const matchesStatus = store.filterStatus === 'all' || task.status === store.filterStatus;
      const matchesType = store.filterType === 'all' || 
        store.profiles.find(p => p.id === task.profileId)?.type === store.filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => {
      const aValue = a[store.sortBy as keyof CompressionTask];
      const bValue = b[store.sortBy as keyof CompressionTask];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return store.sortOrder === 'asc' ? comparison : -comparison;
    }),
    
    activeTasksCount: store.tasks.filter(task => 
      ['pending', 'processing'].includes(task.status)
    ).length,
    
    completionRate: store.tasks.length > 0 
      ? (store.tasks.filter(task => task.status === 'completed').length / store.tasks.length) * 100
      : 0,
    
    averageCompressionRatio: store.stats.averageCompressionRatio,
    
    totalSpaceSaved: store.stats.totalSpaceSaved,
    
    isSystemHealthy: store.systemLoad < 80 && store.memoryUsage < 90 && store.stats.averageCompressionRatio > 0,
    
    recentEvents: store.events.slice(0, 10),
    
    profilesWithStats: store.profiles.map(profile => {
      const profileTasks = store.tasks.filter(task => task.profileId === profile.id);
      const completedTasks = profileTasks.filter(task => task.status === 'completed');
      
      return {
        ...profile,
        taskCount: profileTasks.length,
        completedCount: completedTasks.length,
        successRate: profileTasks.length > 0 ? (completedTasks.length / profileTasks.length) * 100 : 0,
        averageRatio: completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => sum + (task.compressionRatio || 0), 0) / completedTasks.length
          : 0
      };
    })
  }), [
    store.tasks, 
    store.profiles, 
    store.stats, 
    store.events,
    store.searchQuery, 
    store.filterStatus, 
    store.filterType, 
    store.sortBy, 
    store.sortOrder,
    store.systemLoad,
    store.memoryUsage
  ]);

  // Generate demo data
  const generateDemoData = useCallback(() => {
    // Demo tasks
    const demoTasks = [
      {
        fileName: 'banner-hero.jpg',
        originalSize: 2.5 * 1024 * 1024,
        profileId: store.profiles[0]?.id || 'profile_1',
        metadata: {
          mimeType: 'image/jpeg',
          dimensions: { width: 1920, height: 1080 },
          format: 'jpg'
        },
        optimizations: {
          qualityReduction: 15,
          sizeReduction: 65,
          timeReduction: 0,
          algorithmUsed: 'webp'
        }
      },
      {
        fileName: 'presentation.mp4',
        originalSize: 150 * 1024 * 1024,
        profileId: store.profiles[1]?.id || 'profile_2',
        metadata: {
          mimeType: 'video/mp4',
          dimensions: { width: 1280, height: 720 },
          duration: 300,
          bitrate: 4000,
          format: 'mp4'
        },
        optimizations: {
          qualityReduction: 20,
          sizeReduction: 70,
          timeReduction: 0,
          algorithmUsed: 'h264'
        }
      },
      {
        fileName: 'podcast-episode.mp3',
        originalSize: 45 * 1024 * 1024,
        profileId: store.profiles[2]?.id || 'profile_3',
        metadata: {
          mimeType: 'audio/mpeg',
          duration: 1800,
          bitrate: 320,
          format: 'mp3'
        },
        optimizations: {
          qualityReduction: 10,
          sizeReduction: 50,
          timeReduction: 0,
          algorithmUsed: 'aac'
        }
      }
    ];

    demoTasks.forEach(task => {
      store.addTask(task);
    });

    // Simulate some completed tasks
    setTimeout(() => {
      const tasks = store.tasks;
      if (tasks.length > 0) {
        store.updateTask(tasks[0].id, {
          status: 'completed',
          progress: 100,
          compressedSize: Math.floor(tasks[0].originalSize * 0.35),
          compressionRatio: 65,
          endTime: new Date(),
          duration: 3500
        });
      }
      if (tasks.length > 1) {
        store.updateTask(tasks[1].id, {
          status: 'processing',
          progress: 45
        });
      }
    }, 1000);
  }, [store]);

  return {
    // State
    profiles: store.profiles,
    tasks: store.tasks,
    stats: store.stats,
    config: store.config,
    events: store.events,
    isProcessing: store.isProcessing,
    selectedProfile: store.selectedProfile,
    selectedTask: store.selectedTask,
    searchQuery: store.searchQuery,
    filterStatus: store.filterStatus,
    filterType: store.filterType,
    sortBy: store.sortBy,
    sortOrder: store.sortOrder,
    activeConnections: store.activeConnections,
    processingQueue: store.processingQueue,
    systemLoad: store.systemLoad,
    memoryUsage: store.memoryUsage,
    error: store.error,
    lastError: store.lastError,
    
    // Actions
    ...actions,
    
    // Quick Actions
    ...quickActions,
    
    // Advanced Features
    ...advancedFeatures,
    
    // System Operations
    ...systemOperations,
    
    // Utilities
    ...utilities,
    
    // Helpers
    configHelpers,
    analyticsHelpers,
    debugHelpers,
    
    // Computed
    ...computed,
    
    // Demo
    generateDemoData
  };
};

// Specialized Hooks
export const useCompressionStats = () => {
  const { stats, tasks, profiles } = useCompressionStore();
  
  return useMemo(() => ({
    stats,
    tasksByStatus: {
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    },
    profileUsage: profiles.map(profile => ({
      profile,
      usage: tasks.filter(task => task.profileId === profile.id).length
    })),
    recentActivity: tasks
      .filter(task => task.endTime && task.endTime > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .length
  }), [stats, tasks, profiles]);
};

export const useCompressionConfig = () => {
  const { config, updateConfig, resetConfig, importConfig, exportConfig } = useCompressionStore();
  
  const optimizeConfig = useCallback((scenario: 'speed' | 'quality' | 'size') => {
    const scenarios = {
      speed: {
        maxConcurrentTasks: 8,
        compressionLevel: 'fast' as const,
        qualityThreshold: 70,
        timeout: 60
      },
      quality: {
        maxConcurrentTasks: 2,
        compressionLevel: 'maximum' as const,
        qualityThreshold: 95,
        timeout: 600
      },
      size: {
        maxConcurrentTasks: 4,
        compressionLevel: 'maximum' as const,
        qualityThreshold: 80,
        timeout: 300
      }
    };
    
    updateConfig(scenarios[scenario]);
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    importConfig,
    exportConfig,
    optimizeConfig
  };
};

export const useCompressionProfiles = () => {
  const { 
    profiles, 
    createProfile, 
    updateProfile, 
    deleteProfile, 
    duplicateProfile 
  } = useCompressionStore();
  
  const getProfilesByType = useCallback((type: CompressionProfile['type']) => {
    return profiles.filter(profile => profile.type === type);
  }, [profiles]);
  
  const getOptimalProfile = useCallback((fileType: string, fileSize: number) => {
    const typeProfiles = profiles.filter(p => p.type === fileType);
    if (typeProfiles.length === 0) return null;
    
    // Select based on file size
    if (fileSize > 100 * 1024 * 1024) {
      return typeProfiles.reduce((best, current) => 
        current.targetReduction > best.targetReduction ? current : best
      );
    }
    
    return typeProfiles.reduce((best, current) => 
      current.quality > best.quality ? current : best
    );
  }, [profiles]);
  
  return {
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    getProfilesByType,
    getOptimalProfile
  };
};

export const useCompressionAnalytics = () => {
  const { tasks, profiles, stats, events } = useCompressionStore();
  
  const analytics = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const last24h = tasks.filter(task => 
      task.startTime > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    return {
      totalCompressions: completedTasks.length,
      totalSavings: completedTasks.reduce((sum, task) => 
        sum + (task.originalSize - (task.compressedSize || task.originalSize)), 0
      ),
      averageCompressionTime: completedTasks.length > 0 
        ? completedTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / completedTasks.length
        : 0,
      last24hActivity: last24h.length,
      topProfile: profiles.reduce((best, profile) => {
        const profileTasks = tasks.filter(task => task.profileId === profile.id);
        const bestTasks = tasks.filter(task => task.profileId === best.id);
        return profileTasks.length > bestTasks.length ? profile : best;
      }, profiles[0]),
      errorRate: tasks.length > 0 
        ? (tasks.filter(task => task.status === 'failed').length / tasks.length) * 100
        : 0,
      recentErrors: events
        .filter(event => event.severity === 'error')
        .slice(0, 5)
    };
  }, [tasks, profiles, stats, events]);
  
  return analytics;
};

export const useCompressionRealTime = () => {
  const { 
    isProcessing, 
    processingQueue, 
    systemLoad, 
    memoryUsage, 
    activeConnections,
    updateSystemMetrics 
  } = useCompressionStore();
  
  useEffect(() => {
    const interval = setInterval(updateSystemMetrics, 2000);
    return () => clearInterval(interval);
  }, [updateSystemMetrics]);
  
  return {
    isProcessing,
    processingQueue,
    systemLoad,
    memoryUsage,
    activeConnections,
    isSystemHealthy: systemLoad < 80 && memoryUsage < 90,
    queueLength: processingQueue.length
  };
};

// Utility Hooks
export const useThrottledCompression = (delay: number = 1000) => {
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  
  const throttledCompress = useCallback((fn: () => void) => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }
    
    throttleRef.current = setTimeout(fn, delay);
  }, [delay]);
  
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);
  
  return throttledCompress;
};

export const useDebouncedSearch = (delay: number = 300) => {
  const { setSearchQuery } = useCompressionStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setSearchQuery(query);
    }, delay);
  }, [setSearchQuery, delay]);
  
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return debouncedSearch;
};

export const useCompressionProgress = (taskId: string) => {
  const { tasks } = useCompressionStore();
  
  const task = useMemo(() => 
    tasks.find(t => t.id === taskId), [tasks, taskId]
  );
  
  return {
    task,
    progress: task?.progress || 0,
    isActive: task?.status === 'processing',
    isCompleted: task?.status === 'completed',
    isFailed: task?.status === 'failed',
    estimatedTimeRemaining: task && task.status === 'processing' 
      ? Math.ceil((100 - task.progress) * 0.1) // Rough estimate
      : 0
  };
};

// Helper Functions
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

export { throttle, debounce };