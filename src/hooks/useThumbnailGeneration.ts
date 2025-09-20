import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useThumbnailGenerationStore,
  ThumbnailTemplate,
  GeneratedThumbnail,
  ThumbnailGenerationConfig,
  ThumbnailGenerationStats,
  ThumbnailGenerationEvent
} from '../services/thumbnailGenerationService';

// Throttle and Debounce Utilities
const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number) => {
  const [lastCall, setLastCall] = useState(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      setLastCall(now);
      return callback(...args);
    }
  }, [callback, delay, lastCall]);
};

const useDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number) => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setDebounceTimer(timer);
  }, [callback, delay, debounceTimer]);
};

// Progress Tracking Hook
const useProgressTracking = () => {
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  const updateProgress = useCallback((id: string, value: number) => {
    setProgress(prev => ({ ...prev, [id]: value }));
  }, []);
  
  const clearProgress = useCallback((id: string) => {
    setProgress(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);
  
  return { progress, updateProgress, clearProgress };
};

// Main Hook
export const useThumbnailGeneration = () => {
  // Store State
  const {
    templates,
    generatedThumbnails,
    config,
    stats,
    events,
    isGenerating,
    isOptimizing,
    selectedTemplate,
    selectedThumbnail,
    generationProgress,
    error,
    searchQuery,
    categoryFilter,
    qualityFilter,
    sortBy,
    sortOrder,
    isRealTimeEnabled,
    connectionStatus,
    lastSync,
    filteredTemplates,
    filteredThumbnails,
    totalTemplates,
    totalThumbnails,
    averageQuality,
    isHealthy,
    canGenerate,
    recentEvents
  } = useThumbnailGenerationStore();

  // Store Actions
  const actions = useThumbnailGenerationStore((state) => ({
    createTemplate: state.createTemplate,
    updateTemplate: state.updateTemplate,
    deleteTemplate: state.deleteTemplate,
    duplicateTemplate: state.duplicateTemplate,
    generateThumbnail: state.generateThumbnail,
    generateBatch: state.generateBatch,
    regenerateThumbnail: state.regenerateThumbnail,
    optimizeThumbnail: state.optimizeThumbnail,
    analyzePerformance: state.analyzePerformance,
    getSuggestions: state.getSuggestions,
    autoOptimize: state.autoOptimize,
    generateVariations: state.generateVariations,
    updateConfig: state.updateConfig,
    resetConfig: state.resetConfig,
    exportConfig: state.exportConfig,
    importConfig: state.importConfig,
    getStats: state.getStats,
    getPerformanceReport: state.getPerformanceReport,
    trackEvent: state.trackEvent,
    setSearchQuery: state.setSearchQuery,
    setCategoryFilter: state.setCategoryFilter,
    setQualityFilter: state.setQualityFilter,
    setSorting: state.setSorting,
    clearFilters: state.clearFilters,
    enableRealTime: state.enableRealTime,
    disableRealTime: state.disableRealTime,
    syncData: state.syncData,
    quickGenerate: state.quickGenerate,
    bulkOptimize: state.bulkOptimize,
    exportThumbnails: state.exportThumbnails,
    createSmartTemplate: state.createSmartTemplate,
    generateFromVideo: state.generateFromVideo,
    applyBrandGuidelines: state.applyBrandGuidelines,
    healthCheck: state.healthCheck,
    clearCache: state.clearCache,
    maintenance: state.maintenance,
    reset: state.reset,
    validateTemplate: state.validateTemplate,
    previewTemplate: state.previewTemplate,
    calculateOptimization: state.calculateOptimization
  }));

  // Local State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-initialization and refresh
  useEffect(() => {
    const initialize = async () => {
      try {
        await actions.getStats();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize thumbnail generation:', error);
      }
    };

    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, actions]);

  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;

    const interval = setInterval(async () => {
      try {
        await actions.getStats();
        if (isRealTimeEnabled) {
          await actions.syncData();
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isInitialized, isRealTimeEnabled, actions]);

  // Memoized Actions
  const memoizedActions = useMemo(() => ({
    ...actions,
    
    // Enhanced template creation with validation
    createTemplateWithValidation: async (template: Omit<ThumbnailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!actions.validateTemplate(template as ThumbnailTemplate)) {
        throw new Error('Invalid template data');
      }
      return actions.createTemplate(template);
    },
    
    // Enhanced generation with progress tracking
    generateWithProgress: async (templateId: string, onProgress?: (progress: number) => void) => {
      const unsubscribe = useThumbnailGenerationStore.subscribe(
        (state) => state.generationProgress,
        (progress) => onProgress?.(progress)
      );
      
      try {
        const result = await actions.generateThumbnail(templateId);
        unsubscribe();
        return result;
      } catch (error) {
        unsubscribe();
        throw error;
      }
    },
    
    // Batch operations with error handling
    safeBatchGenerate: async (templateIds: string[]) => {
      const results: { success: GeneratedThumbnail[]; errors: { templateId: string; error: string }[] } = {
        success: [],
        errors: []
      };
      
      for (const templateId of templateIds) {
        try {
          const thumbnail = await actions.generateThumbnail(templateId);
          results.success.push(thumbnail);
        } catch (error) {
          results.errors.push({
            templateId,
            error: (error as Error).message
          });
        }
      }
      
      return results;
    }
  }), [actions]);

  // Quick Actions
  const quickActions = useMemo(() => ({
    // Quick template creation for common platforms
    createYouTubeTemplate: () => memoizedActions.createTemplateWithValidation({
      name: 'YouTube Thumbnail',
      description: 'Optimized for YouTube videos',
      width: 1280,
      height: 720,
      aspectRatio: '16:9',
      category: 'youtube',
      elements: [],
      style: {
        backgroundColor: '#ff0000',
        borderRadius: 8,
        shadow: {
          enabled: true,
          color: '#000000',
          blur: 10,
          offset: { x: 0, y: 4 }
        },
        filters: {
          brightness: 110,
          contrast: 120,
          saturation: 110,
          blur: 0
        }
      }
    }),
    
    createInstagramTemplate: () => memoizedActions.createTemplateWithValidation({
      name: 'Instagram Post',
      description: 'Square format for Instagram',
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      category: 'instagram',
      elements: [],
      style: {
        backgroundColor: '#E1306C',
        borderRadius: 12,
        shadow: {
          enabled: true,
          color: '#000000',
          blur: 8,
          offset: { x: 0, y: 2 }
        },
        filters: {
          brightness: 105,
          contrast: 110,
          saturation: 120,
          blur: 0
        }
      }
    }),
    
    // Quick generation for all platforms
    generateForAllPlatforms: async (baseTemplateId: string) => {
      const platforms = ['youtube', 'instagram', 'facebook', 'twitter'] as const;
      const results: Record<string, GeneratedThumbnail> = {};
      
      for (const platform of platforms) {
        try {
          const thumbnail = await actions.quickGenerate(platform);
          results[platform] = thumbnail;
        } catch (error) {
          console.error(`Failed to generate for ${platform}:`, error);
        }
      }
      
      return results;
    },
    
    // Quick optimization
    optimizeAll: async () => {
      const thumbnailIds = generatedThumbnails.map(t => t.id);
      await actions.bulkOptimize(thumbnailIds);
    },
    
    // Quick export
    exportAll: async (format: 'zip' | 'pdf' = 'zip') => {
      const thumbnailIds = generatedThumbnails.map(t => t.id);
      return actions.exportThumbnails(thumbnailIds, format);
    }
  }), [memoizedActions, generatedThumbnails, actions]);

  // Advanced Features
  const advancedFeatures = useMemo(() => ({
    // Batch analysis with progress
    batchAnalyzePerformance: async (ids: string[], onProgress?: (current: number, total: number) => void) => {
      const results = [];
      
      for (let i = 0; i < ids.length; i++) {
        onProgress?.(i + 1, ids.length);
        await actions.analyzePerformance(ids[i]);
        results.push(ids[i]);
      }
      
      return results;
    },
    
    // Smart recommendations based on performance
    getSmartRecommendations: async () => {
      const topPerforming = generatedThumbnails
        .sort((a, b) => b.analytics.score - a.analytics.score)
        .slice(0, 5);
      
      const recommendations = [];
      
      for (const thumbnail of topPerforming) {
        const suggestions = await actions.getSuggestions(thumbnail.templateId);
        recommendations.push({
          thumbnailId: thumbnail.id,
          templateId: thumbnail.templateId,
          score: thumbnail.analytics.score,
          suggestions
        });
      }
      
      return recommendations;
    },
    
    // Comprehensive analysis
    comprehensiveAnalysis: async () => {
      const [stats, recommendations] = await Promise.all([
        actions.getStats(),
        advancedFeatures.getSmartRecommendations()
      ]);
      
      return {
        stats,
        recommendations,
        healthStatus: {
          isHealthy,
          canGenerate,
          connectionStatus,
          lastSync
        },
        insights: {
          totalTemplates,
          totalThumbnails,
          averageQuality,
          topCategories: templates.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };
    }
  }), [actions, generatedThumbnails, isHealthy, canGenerate, connectionStatus, lastSync, totalTemplates, totalThumbnails, averageQuality, templates]);

  // System Operations
  const systemOperations = useMemo(() => ({
    // Health check with detailed status
    detailedHealthCheck: async () => {
      const isSystemHealthy = await actions.healthCheck();
      
      return {
        system: isSystemHealthy,
        store: isHealthy,
        generation: canGenerate,
        realTime: isRealTimeEnabled && connectionStatus === 'connected',
        lastSync: lastSync ? new Date().getTime() - lastSync.getTime() < 60000 : false
      };
    },
    
    // Maintenance with progress
    performMaintenance: async (onProgress?: (step: string) => void) => {
      onProgress?.('Clearing cache...');
      await actions.clearCache();
      
      onProgress?.('Running maintenance...');
      await actions.maintenance();
      
      onProgress?.('Refreshing stats...');
      await actions.getStats();
      
      onProgress?.('Maintenance completed');
    },
    
    // Reset with confirmation
    resetWithConfirmation: async (confirm: boolean = false) => {
      if (!confirm) {
        throw new Error('Reset requires explicit confirmation');
      }
      
      await actions.reset();
      setIsInitialized(false);
    },
    
    // Refresh all data
    refresh: async () => {
      await Promise.all([
        actions.getStats(),
        isRealTimeEnabled ? actions.syncData() : Promise.resolve()
      ]);
    }
  }), [actions, isHealthy, canGenerate, isRealTimeEnabled, connectionStatus, lastSync]);

  // Utilities
  const utilities = useMemo(() => ({
    // Search and filter helpers
    search: useDebounce(actions.setSearchQuery, 300),
    filterByCategory: actions.setCategoryFilter,
    filterByQuality: actions.setQualityFilter,
    sort: actions.setSorting,
    clearAllFilters: actions.clearFilters,
    
    // Data export helpers
    exportData: () => ({
      templates,
      thumbnails: generatedThumbnails,
      config,
      stats,
      timestamp: new Date().toISOString()
    }),
    
    // Configuration helpers
    saveConfig: () => actions.exportConfig(),
    loadConfig: actions.importConfig,
    
    // Event tracking
    trackCustomEvent: (type: string, data: Record<string, any>) => {
      actions.trackEvent({
        type: type as any,
        data,
        sessionId: 'current'
      });
    }
  }), [actions, templates, generatedThumbnails, config, stats]);

  // Configuration and Analytics Helpers
  const configHelpers = useMemo(() => ({
    // Quality presets
    setQualityPreset: (preset: 'draft' | 'standard' | 'high' | 'premium') => {
      const presets = {
        draft: { qualityLevel: 'low' as const, compression: 0.6, aiOptimization: false },
        standard: { qualityLevel: 'medium' as const, compression: 0.7, aiOptimization: true },
        high: { qualityLevel: 'high' as const, compression: 0.8, aiOptimization: true },
        premium: { qualityLevel: 'ultra' as const, compression: 0.9, aiOptimization: true }
      };
      
      return actions.updateConfig(presets[preset]);
    },
    
    // Platform-specific configs
    setPlatformConfig: (platform: 'youtube' | 'instagram' | 'facebook' | 'twitter') => {
      const configs = {
        youtube: { outputFormat: 'jpg' as const, compression: 0.8, maxFileSize: 2 * 1024 * 1024 },
        instagram: { outputFormat: 'jpg' as const, compression: 0.85, maxFileSize: 8 * 1024 * 1024 },
        facebook: { outputFormat: 'jpg' as const, compression: 0.8, maxFileSize: 8 * 1024 * 1024 },
        twitter: { outputFormat: 'jpg' as const, compression: 0.75, maxFileSize: 5 * 1024 * 1024 }
      };
      
      return actions.updateConfig(configs[platform]);
    },
    
    // Auto-configuration based on usage
    autoConfigureBasedOnUsage: async () => {
      const report = await actions.getPerformanceReport('week');
      
      // Auto-adjust based on performance
      if (report.averageScore < 70) {
        await actions.updateConfig({ aiOptimization: true, qualityLevel: 'high' });
      }
    }
  }), [actions]);

  const analyticsHelpers = useMemo(() => ({
    // Performance metrics
    getPerformanceMetrics: () => ({
      totalGenerated: totalThumbnails,
      averageQuality,
      successRate: stats.successRate,
      errorRate: stats.errorRate,
      optimizationSavings: stats.optimizationSavings
    }),
    
    // Usage analytics
    getUsageAnalytics: () => ({
      templatesCreated: totalTemplates,
      thumbnailsGenerated: totalThumbnails,
      averageGenerationTime: stats.averageGenerationTime,
      topCategories: templates.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }),
    
    // Trend analysis
    getTrendAnalysis: () => {
      const recentThumbnails = generatedThumbnails
        .filter(t => new Date().getTime() - t.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return {
        weeklyGeneration: recentThumbnails.length,
        qualityTrend: recentThumbnails.reduce((acc, t) => acc + t.metadata.quality, 0) / recentThumbnails.length || 0,
        popularFormats: recentThumbnails.reduce((acc, t) => {
          acc[t.metadata.format] = (acc[t.metadata.format] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  }), [totalThumbnails, averageQuality, stats, totalTemplates, templates, generatedThumbnails]);

  // Debug helpers
  const debugHelpers = useMemo(() => ({
    // State inspection
    inspectState: () => ({
      storeState: {
        templates: templates.length,
        thumbnails: generatedThumbnails.length,
        isGenerating,
        isOptimizing,
        error
      },
      filters: {
        searchQuery,
        categoryFilter,
        qualityFilter,
        sortBy,
        sortOrder
      },
      realTime: {
        enabled: isRealTimeEnabled,
        status: connectionStatus,
        lastSync
      }
    }),
    
    // Performance monitoring
    getPerformanceInfo: () => ({
      renderCount: 0, // Would need additional tracking
      lastUpdate: new Date(),
      memoryUsage: {
        templates: JSON.stringify(templates).length,
        thumbnails: JSON.stringify(generatedThumbnails).length,
        events: JSON.stringify(events).length
      }
    }),
    
    // Error tracking
    getErrorHistory: () => events.filter(e => e.type === 'generation_failed'),
    
    // Debug actions
    generateTestData: async () => {
      // Create test templates
      for (let i = 0; i < 3; i++) {
        await actions.createTemplate({
          name: `Test Template ${i + 1}`,
          description: `Test template for debugging ${i + 1}`,
          width: 1920,
          height: 1080,
          aspectRatio: '16:9',
          category: 'custom',
          elements: [],
          style: {
            backgroundColor: `hsl(${i * 120}, 70%, 50%)`,
            borderRadius: 8,
            shadow: {
              enabled: true,
              color: '#000000',
              blur: 10,
              offset: { x: 0, y: 4 }
            },
            filters: {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              blur: 0
            }
          }
        });
      }
    }
  }), [templates, generatedThumbnails, isGenerating, isOptimizing, error, searchQuery, categoryFilter, qualityFilter, sortBy, sortOrder, isRealTimeEnabled, connectionStatus, lastSync, events, actions]);

  // Computed values
  const computedValues = useMemo(() => ({
    // Status indicators
    statusIndicators: {
      health: isHealthy ? 'healthy' : 'warning',
      generation: isGenerating ? 'active' : canGenerate ? 'ready' : 'disabled',
      optimization: isOptimizing ? 'active' : 'ready',
      connection: connectionStatus
    },
    
    // Progress indicators
    progressIndicators: {
      generation: generationProgress,
      health: isHealthy ? 100 : 50,
      quality: averageQuality
    },
    
    // Summary stats
    summaryStats: {
      templates: totalTemplates,
      thumbnails: totalThumbnails,
      quality: Math.round(averageQuality),
      success: Math.round(stats.successRate)
    }
  }), [isHealthy, isGenerating, canGenerate, isOptimizing, connectionStatus, generationProgress, averageQuality, totalTemplates, totalThumbnails, stats.successRate]);

  return {
    // State
    templates,
    generatedThumbnails,
    config,
    stats,
    events,
    isGenerating,
    isOptimizing,
    selectedTemplate,
    selectedThumbnail,
    generationProgress,
    error,
    searchQuery,
    categoryFilter,
    qualityFilter,
    sortBy,
    sortOrder,
    isRealTimeEnabled,
    connectionStatus,
    lastSync,
    
    // Computed
    filteredTemplates,
    filteredThumbnails,
    totalTemplates,
    totalThumbnails,
    averageQuality,
    isHealthy,
    canGenerate,
    recentEvents,
    
    // Actions
    actions: memoizedActions,
    quickActions,
    advancedFeatures,
    systemOperations,
    utilities,
    configHelpers,
    analyticsHelpers,
    debugHelpers,
    computedValues,
    
    // Settings
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    isInitialized
  };
};

// Specialized Hooks
export const useThumbnailGenerationStats = () => {
  const { stats, getStats } = useThumbnailGenerationStore((state) => ({
    stats: state.stats,
    getStats: state.getStats
  }));
  
  useEffect(() => {
    getStats();
  }, [getStats]);
  
  return stats;
};

export const useThumbnailGenerationConfig = () => {
  const { config, updateConfig, resetConfig } = useThumbnailGenerationStore((state) => ({
    config: state.config,
    updateConfig: state.updateConfig,
    resetConfig: state.resetConfig
  }));
  
  return { config, updateConfig, resetConfig };
};

export const useThumbnailTemplates = () => {
  const { 
    templates, 
    filteredTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  } = useThumbnailGenerationStore((state) => ({
    templates: state.templates,
    filteredTemplates: state.filteredTemplates,
    createTemplate: state.createTemplate,
    updateTemplate: state.updateTemplate,
    deleteTemplate: state.deleteTemplate,
    duplicateTemplate: state.duplicateTemplate
  }));
  
  return {
    templates,
    filteredTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  };
};

export const useThumbnailGeneration = () => {
  const {
    generatedThumbnails,
    filteredThumbnails,
    generateThumbnail,
    generateBatch,
    regenerateThumbnail,
    optimizeThumbnail,
    isGenerating,
    generationProgress
  } = useThumbnailGenerationStore((state) => ({
    generatedThumbnails: state.generatedThumbnails,
    filteredThumbnails: state.filteredThumbnails,
    generateThumbnail: state.generateThumbnail,
    generateBatch: state.generateBatch,
    regenerateThumbnail: state.regenerateThumbnail,
    optimizeThumbnail: state.optimizeThumbnail,
    isGenerating: state.isGenerating,
    generationProgress: state.generationProgress
  }));
  
  return {
    generatedThumbnails,
    filteredThumbnails,
    generateThumbnail,
    generateBatch,
    regenerateThumbnail,
    optimizeThumbnail,
    isGenerating,
    generationProgress
  };
};

export const useThumbnailGenerationAnalytics = () => {
  const {
    stats,
    events,
    getStats,
    getPerformanceReport,
    trackEvent
  } = useThumbnailGenerationStore((state) => ({
    stats: state.stats,
    events: state.events,
    getStats: state.getStats,
    getPerformanceReport: state.getPerformanceReport,
    trackEvent: state.trackEvent
  }));
  
  return {
    stats,
    events,
    getStats,
    getPerformanceReport,
    trackEvent
  };
};

export const useThumbnailGenerationRealTime = () => {
  const {
    isRealTimeEnabled,
    connectionStatus,
    lastSync,
    enableRealTime,
    disableRealTime,
    syncData
  } = useThumbnailGenerationStore((state) => ({
    isRealTimeEnabled: state.isRealTimeEnabled,
    connectionStatus: state.connectionStatus,
    lastSync: state.lastSync,
    enableRealTime: state.enableRealTime,
    disableRealTime: state.disableRealTime,
    syncData: state.syncData
  }));
  
  return {
    isRealTimeEnabled,
    connectionStatus,
    lastSync,
    enableRealTime,
    disableRealTime,
    syncData
  };
};

// Utility Hooks
export const useThrottledThumbnailSearch = (delay: number = 300) => {
  const setSearchQuery = useThumbnailGenerationStore((state) => state.setSearchQuery);
  return useThrottle(setSearchQuery, delay);
};

export const useDebouncedThumbnailFilter = (delay: number = 500) => {
  const setCategoryFilter = useThumbnailGenerationStore((state) => state.setCategoryFilter);
  return useDebounce(setCategoryFilter, delay);
};

export const useThumbnailGenerationProgress = () => {
  const { progress, updateProgress, clearProgress } = useProgressTracking();
  const generationProgress = useThumbnailGenerationStore((state) => state.generationProgress);
  
  return {
    progress,
    updateProgress,
    clearProgress,
    globalProgress: generationProgress
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