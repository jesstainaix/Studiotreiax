import { useCallback, useEffect, useMemo, useState } from 'react';
import { useThumbnailStore } from '../services/aiThumbnailService';
import type { 
  ThumbnailTemplate, 
  GeneratedThumbnail, 
  ContentAnalysis, 
  AIProvider,
  ThumbnailConfig,
  ThumbnailStats,
  ThumbnailEvent
} from '../services/aiThumbnailService';

// Throttle and debounce utilities
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

// Main hook for AI Thumbnail system
export const useAIThumbnail = () => {
  // State management
  const {
    thumbnails,
    templates,
    analyses,
    providers,
    config,
    stats,
    events,
    debugLogs,
    isInitialized,
    isLoading,
    error,
    computed,
    actions,
    quick,
    advanced,
    system,
    utils
  } = useThumbnailStore();
  
  // Auto-initialization
  useEffect(() => {
    if (!isInitialized) {
      actions.initialize();
    }
  }, [isInitialized, actions]);
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInitialized && !isLoading) {
        actions.refreshStats();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [isInitialized, isLoading, actions]);
  
  // Memoized actions
  const memoizedActions = useMemo(() => ({
    generateThumbnail: actions.generateThumbnail,
    analyzeContent: actions.analyzeContent,
    optimizeThumbnail: actions.optimizeThumbnail,
    deleteThumbnail: actions.deleteThumbnail,
    createTemplate: actions.createTemplate,
    updateTemplate: actions.updateTemplate,
    deleteTemplate: actions.deleteTemplate,
    addProvider: actions.addProvider,
    updateProvider: actions.updateProvider,
    removeProvider: actions.removeProvider,
    updateConfig: actions.updateConfig,
    batchOptimize: actions.batchOptimize,
    exportData: actions.exportData,
    importData: actions.importData,
    clearEvents: actions.clearEvents,
    addEvent: actions.addEvent,
    refreshStats: actions.refreshStats
  }), [actions]);
  
  // Quick actions
  const quickActions = useMemo(() => ({
    generateQuick: quick.generateQuick,
    optimizeAll: quick.optimizeAll,
    analyzePerformance: quick.analyzePerformance,
    createVariations: quick.createVariations,
    applyBranding: quick.applyBranding
  }), [quick]);
  
  // Advanced features
  const advancedFeatures = useMemo(() => ({
    createABTest: advanced.createABTest,
    getABTestResults: advanced.getABTestResults,
    trainModel: advanced.trainModel,
    predictPerformance: advanced.predictPerformance,
    batchProcess: advanced.batchProcess,
    scheduleGeneration: advanced.scheduleGeneration,
    syncWithPlatform: advanced.syncWithPlatform,
    exportToPlatform: advanced.exportToPlatform
  }), [advanced]);
  
  // System operations
  const systemOps = useMemo(() => ({
    healthCheck: system.healthCheck,
    getSystemInfo: system.getSystemInfo,
    clearCache: system.clearCache,
    backup: system.backup,
    restore: system.restore
  }), [system]);
  
  // Utilities
  const utilities = useMemo(() => ({
    format: utils.format,
    validate: utils.validate,
    calculate: utils.calculate,
    generate: utils.generate
  }), [utils]);
  
  // Configuration helpers
  const configHelpers = useMemo(() => ({
    updateQuality: (quality: number) => {
      actions.updateConfig({ defaultQuality: quality });
    },
    updateFormat: (format: string) => {
      actions.updateConfig({ defaultFormat: format });
    },
    toggleAutoOptimization: () => {
      actions.updateConfig({ autoOptimization: !config.autoOptimization });
    },
    updateBranding: (branding: any) => {
      actions.updateConfig({ branding });
    }
  }), [actions, config]);
  
  // Analytics helpers
  const analyticsHelpers = useMemo(() => ({
    getTopPerformers: (limit = 5) => {
      return thumbnails
        .sort((a, b) => b.analytics.clickThroughRate - a.analytics.clickThroughRate)
        .slice(0, limit);
    },
    getWorstPerformers: (limit = 5) => {
      return thumbnails
        .sort((a, b) => a.analytics.clickThroughRate - b.analytics.clickThroughRate)
        .slice(0, limit);
    },
    getTemplateStats: () => {
      return templates.map(template => {
        const templateThumbnails = thumbnails.filter(t => t.templateId === template.id);
        const totalViews = templateThumbnails.reduce((sum, t) => sum + t.analytics.views, 0);
        const totalClicks = templateThumbnails.reduce((sum, t) => sum + t.analytics.clicks, 0);
        const avgCTR = totalViews > 0 ? totalClicks / totalViews : 0;
        
        return {
          template: template.name,
          thumbnails: templateThumbnails.length,
          totalViews,
          totalClicks,
          averageCTR: avgCTR
        };
      });
    },
    getProviderStats: () => {
      return providers.map(provider => ({
        name: provider.name,
        efficiency: utils.calculate.efficiency(provider),
        totalRequests: provider.metrics.totalRequests,
        successRate: provider.metrics.totalRequests > 0 
          ? provider.metrics.successfulRequests / provider.metrics.totalRequests 
          : 0,
        averageResponseTime: provider.metrics.averageResponseTime
      }));
    }
  }), [thumbnails, templates, providers, utils]);
  
  // Debug helpers
  const debugHelpers = useMemo(() => ({
    getLogs: (level?: string) => {
      return level 
        ? debugLogs.filter(log => log.level === level)
        : debugLogs;
    },
    getEvents: (type?: string) => {
      return type 
        ? events.filter(event => event.type === type)
        : events;
    },
    getRecentActivity: (limit = 10) => {
      return events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    }
  }), [debugLogs, events]);
  
  // Computed values
  const computedValues = useMemo(() => ({
    totalThumbnails: thumbnails.length,
    totalTemplates: templates.length,
    totalProviders: providers.length,
    activeProviders: computed.activeProviders,
    averageScore: computed.averageScore,
    performanceMetrics: computed.performanceMetrics,
    systemHealth: computed.systemHealth,
    recentActivity: computed.recentActivity,
    topCategories: computed.topCategories,
    isHealthy: computed.activeProviders.length > 0 && !error,
    hasData: thumbnails.length > 0,
    canGenerate: computed.activeProviders.length > 0 && templates.length > 0
  }), [thumbnails, templates, providers, computed, error]);
  
  return {
    // State
    thumbnails,
    templates,
    analyses,
    providers,
    config,
    stats,
    events,
    debugLogs,
    isInitialized,
    isLoading,
    error,
    
    // Actions
    actions: memoizedActions,
    quick: quickActions,
    advanced: advancedFeatures,
    system: systemOps,
    utils: utilities,
    
    // Helpers
    config: configHelpers,
    analytics: analyticsHelpers,
    debug: debugHelpers,
    
    // Computed
    computed: computedValues
  };
};

// Specialized hook for thumbnail statistics
export const useThumbnailStats = () => {
  const { stats, thumbnails, templates, providers, utils } = useThumbnailStore();
  
  return useMemo(() => ({
    ...stats,
    thumbnailCount: thumbnails.length,
    templateCount: templates.length,
    providerCount: providers.length,
    averageGenerationTime: stats.performanceMetrics.generationTime,
    successRate: stats.performanceMetrics.successRate,
    totalViews: thumbnails.reduce((sum, t) => sum + t.analytics.views, 0),
    totalClicks: thumbnails.reduce((sum, t) => sum + t.analytics.clicks, 0),
    overallCTR: (() => {
      const totalViews = thumbnails.reduce((sum, t) => sum + t.analytics.views, 0);
      const totalClicks = thumbnails.reduce((sum, t) => sum + t.analytics.clicks, 0);
      return totalViews > 0 ? totalClicks / totalViews : 0;
    })(),
    topTemplate: (() => {
      const templateStats = templates.map(template => {
        const templateThumbnails = thumbnails.filter(t => t.templateId === template.id);
        const avgScore = templateThumbnails.length > 0
          ? templateThumbnails.reduce((sum, t) => sum + utils.calculate.score(t), 0) / templateThumbnails.length
          : 0;
        return { template: template.name, score: avgScore };
      });
      return templateStats.sort((a, b) => b.score - a.score)[0]?.template || 'N/A';
    })()
  }), [stats, thumbnails, templates, providers, utils]);
};

// Specialized hook for thumbnail configuration
export const useThumbnailConfig = () => {
  const { config, actions } = useThumbnailStore();
  
  const updateConfig = useCallback((updates: Partial<ThumbnailConfig>) => {
    actions.updateConfig(updates);
  }, [actions]);
  
  const resetConfig = useCallback(() => {
    actions.updateConfig({
      defaultFormat: 'jpg',
      defaultQuality: 85,
      autoOptimization: true,
      batchSize: 10,
      cacheEnabled: true,
      branding: {
        logo: '',
        colors: ['#000000', '#ffffff'],
        fonts: ['Arial', 'Helvetica']
      }
    });
  }, [actions]);
  
  return {
    config,
    updateConfig,
    resetConfig
  };
};

// Specialized hook for AI providers
export const useThumbnailProviders = () => {
  const { providers, actions, computed } = useThumbnailStore();
  
  const addProvider = useCallback((provider: Omit<AIProvider, 'id' | 'metrics'>) => {
    actions.addProvider({
      ...provider,
      id: Math.random().toString(36).substr(2, 9),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        uptime: 100
      }
    });
  }, [actions]);
  
  const toggleProvider = useCallback((id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      actions.updateProvider(id, {
        status: provider.status === 'active' ? 'inactive' : 'active'
      });
    }
  }, [providers, actions]);
  
  return {
    providers,
    activeProviders: computed.activeProviders,
    addProvider,
    updateProvider: actions.updateProvider,
    removeProvider: actions.removeProvider,
    toggleProvider
  };
};

// Utility hook for throttled operations
export const useThrottledThumbnail = (delay = 1000) => {
  const { actions } = useThumbnailStore();
  
  const throttledGenerate = useMemo(
    () => throttle(actions.generateThumbnail, delay),
    [actions.generateThumbnail, delay]
  );
  
  const throttledOptimize = useMemo(
    () => throttle(actions.optimizeThumbnail, delay),
    [actions.optimizeThumbnail, delay]
  );
  
  const throttledAnalyze = useMemo(
    () => throttle(actions.analyzeContent, delay),
    [actions.analyzeContent, delay]
  );
  
  return {
    generateThumbnail: throttledGenerate,
    optimizeThumbnail: throttledOptimize,
    analyzeContent: throttledAnalyze
  };
};

// Utility hook for debounced operations
export const useDebouncedThumbnail = (delay = 500) => {
  const { actions } = useThumbnailStore();
  
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      // Implement search logic here
    }, delay),
    [delay]
  );
  
  const debouncedFilter = useMemo(
    () => debounce((filters: any) => {
      // Implement filter logic here
    }, delay),
    [delay]
  );
  
  return {
    searchThumbnails: debouncedSearch,
    filterThumbnails: debouncedFilter
  };
};

// Hook for thumbnail processing operations
export const useThumbnailProcessing = () => {
  const { actions, advanced } = useThumbnailStore();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const batchGenerate = useCallback(async (requests: any[]) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const results = [];
      for (let i = 0; i < requests.length; i++) {
        const result = await actions.generateThumbnail(requests[i]);
        results.push(result);
        setProgress((i + 1) / requests.length * 100);
      }
      return results;
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [actions]);
  
  const batchOptimize = useCallback(async (thumbnailIds: string[]) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      await actions.batchOptimize(thumbnailIds);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [actions]);
  
  const batchProcess = useCallback(async (operation: string, params: any[]) => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const result = await advanced.batchProcess(operation, params);
      return result;
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [advanced]);
  
  return {
    processing,
    progress,
    batchGenerate,
    batchOptimize,
    batchProcess
  };
};

// Hook for thumbnail batch operations
export const useThumbnailBatch = () => {
  const { thumbnails, actions, advanced } = useThumbnailStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const selectAll = useCallback(() => {
    setSelectedIds(thumbnails.map(t => t.id));
  }, [thumbnails]);
  
  const selectNone = useCallback(() => {
    setSelectedIds([]);
  }, []);
  
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);
  
  const batchDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await actions.deleteThumbnail(id);
    }
    setSelectedIds([]);
  }, [selectedIds, actions]);
  
  const batchOptimize = useCallback(async () => {
    await actions.batchOptimize(selectedIds);
  }, [selectedIds, actions]);
  
  const batchExport = useCallback(async (platform: string) => {
    for (const id of selectedIds) {
      await advanced.exportToPlatform(id, platform);
    }
  }, [selectedIds, advanced]);
  
  return {
    selectedIds,
    selectedCount: selectedIds.length,
    selectAll,
    selectNone,
    toggleSelect,
    batchDelete,
    batchOptimize,
    batchExport
  };
};

export default useAIThumbnail;