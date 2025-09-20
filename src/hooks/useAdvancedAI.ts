import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { 
  useAdvancedAIStore,
  SentimentAnalysis,
  ContentRecommendation,
  ScriptCorrection,
  ThumbnailGeneration,
  AIModel,
  AITask,
  AIInsight,
  AIFilter,
  AIConfig,
  AIStats,
  AIAnalytics
} from '../services/advancedAIService';

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useAdvancedAI = () => {
  const store = useAdvancedAIStore();
  const initRef = useRef(false);
  
  // Auto-initialize
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      store.initialize();
    }
  }, [store]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!store.config.enableRealtime) return;
    
    const interval = setInterval(() => {
      if (store.config.enableAutoRefresh) {
        store.refreshData();
      }
    }, store.config.refreshInterval || 30000);
    
    return () => clearInterval(interval);
  }, [store.config.enableRealtime, store.config.enableAutoRefresh, store.config.refreshInterval, store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Sentiment Analysis
    analyzeSentiment: store.analyzeSentiment,
    batchAnalyzeSentiment: store.batchAnalyzeSentiment,
    deleteAnalysis: store.deleteAnalysis,
    exportAnalyses: store.exportAnalyses,
    
    // Content Recommendations
    generateRecommendations: store.generateRecommendations,
    refreshRecommendations: store.refreshRecommendations,
    likeRecommendation: store.likeRecommendation,
    dislikeRecommendation: store.dislikeRecommendation,
    applyRecommendation: store.applyRecommendation,
    
    // Script Corrections
    correctScript: store.correctScript,
    applyCorrection: store.applyCorrection,
    rejectCorrection: store.rejectCorrection,
    saveCorrection: store.saveCorrection,
    
    // Thumbnail Generation
    generateThumbnails: store.generateThumbnails,
    selectThumbnail: store.selectThumbnail,
    regenerateThumbnail: store.regenerateThumbnail,
    downloadThumbnail: store.downloadThumbnail,
    
    // Models
    loadModels: store.loadModels,
    trainModel: store.trainModel,
    updateModel: store.updateModel,
    deleteModel: store.deleteModel,
    
    // Tasks
    createTask: store.createTask,
    updateTask: store.updateTask,
    cancelTask: store.cancelTask,
    retryTask: store.retryTask,
    clearCompletedTasks: store.clearCompletedTasks,
    
    // Data Operations
    loadData: store.loadData,
    refreshData: store.refreshData,
    clearData: store.clearData,
    exportData: store.exportData,
    importData: store.importData,
    
    // Search and Filter
    setSearchQuery: store.setSearchQuery,
    setFilter: store.setFilter,
    clearFilter: store.clearFilter,
    saveFilter: store.saveFilter,
    
    // UI
    setSelectedAnalysis: store.setSelectedAnalysis,
    setSelectedRecommendation: store.setSelectedRecommendation,
    setSelectedCorrection: store.setSelectedCorrection,
    setSelectedThumbnail: store.setSelectedThumbnail,
    setActiveTab: store.setActiveTab,
    setLoading: store.setLoading,
    setError: store.setError,
    
    // Advanced Features
    createInsight: store.createInsight,
    dismissInsight: store.dismissInsight,
    scheduleAnalysis: store.scheduleAnalysis,
    createWorkflow: store.createWorkflow,
    
    // System
    initialize: store.initialize,
    cleanup: store.cleanup,
    reset: store.reset,
    backup: store.backup,
    restore: store.restore,
    
    // Configuration
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    saveConfig: store.saveConfig,
    loadConfig: store.loadConfig,
  }), [store]);
  
  // Quick actions with error handling - moved useCallback outside useMemo
  const quickAnalyze = useCallback(async (text: string) => {
    try {
      store.setLoading(true);
      await store.quickAnalyze(text);
      store.setError(null);
    } catch (error) {
      store.setError('Erro ao analisar sentimento');
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  const quickRecommend = useCallback(async () => {
    try {
      store.setLoading(true);
      await store.quickRecommend();
      store.setError(null);
    } catch (error) {
      store.setError('Erro ao gerar recomendações');
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  const quickCorrect = useCallback(async (text: string) => {
    try {
      store.setLoading(true);
      await store.quickCorrect(text);
      store.setError(null);
    } catch (error) {
      store.setError('Erro ao corrigir script');
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  const quickGenerate = useCallback(async (videoId: string) => {
    try {
      store.setLoading(true);
      await store.quickGenerate(videoId);
      store.setError(null);
    } catch (error) {
      store.setError('Erro ao gerar thumbnails');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const quickActions = useMemo(() => ({
    quickAnalyze,
    quickRecommend,
    quickCorrect,
    quickGenerate,
  }), [quickAnalyze, quickRecommend, quickCorrect, quickGenerate]);
  
  // Throttled actions - moved hooks outside useMemo
  const throttledSearch = useThrottle(store.setSearchQuery, 300);
  const throttledFilter = useThrottle(store.setFilter, 500);
  
  const throttledActions = useMemo(() => ({
    throttledSearch,
    throttledFilter,
  }), [throttledSearch, throttledFilter]);
  
  // Debounced actions - moved hooks outside useMemo
  const debouncedAnalyze = useDebounce(store.analyzeSentiment, 1000);
  const debouncedCorrect = useDebounce(store.correctScript, 1500);
  
  const debouncedActions = useMemo(() => ({
    debouncedAnalyze,
    debouncedCorrect,
  }), [debouncedAnalyze, debouncedCorrect]);
  
  // Enhanced computed values
  const computedValues = useMemo(() => ({
    totalItems: store.sentimentAnalyses.length + store.recommendations.length + store.corrections.length + store.thumbnails.length,
    activeTasksCount: store.activeTasks.length,
    completionRate: store.tasks.length > 0 ? store.tasks.filter(t => t.status === 'completed').length / store.tasks.length : 0,
    averageConfidence: store.sentimentAnalyses.length > 0 
      ? store.sentimentAnalyses.reduce((sum, a) => sum + a.confidence, 0) / store.sentimentAnalyses.length 
      : 0,
    topRecommendations: store.recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5),
    recentCorrections: store.corrections
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5),
    modelAccuracy: store.models.length > 0
      ? store.models.reduce((sum, m) => sum + m.accuracy, 0) / store.models.length
      : 0,
  }), [
    store.sentimentAnalyses,
    store.recommendations,
    store.corrections,
    store.thumbnails,
    store.tasks,
    store.activeTasks,
    store.models,
  ]);
  
  // Filtered data
  const filteredData = useMemo(() => ({
    analyses: store.filteredAnalyses,
    recommendations: store.filteredRecommendations,
    corrections: store.filteredCorrections,
    thumbnails: store.filteredThumbnails,
  }), [
    store.filteredAnalyses,
    store.filteredRecommendations,
    store.filteredCorrections,
    store.filteredThumbnails,
  ]);
  
  return {
    // State
    sentimentAnalyses: store.sentimentAnalyses,
    recommendations: store.recommendations,
    corrections: store.corrections,
    thumbnails: store.thumbnails,
    models: store.models,
    tasks: store.tasks,
    insights: store.insights,
    events: store.events,
    
    // UI State
    isLoading: store.isLoading,
    error: store.error,
    selectedAnalysis: store.selectedAnalysis,
    selectedRecommendation: store.selectedRecommendation,
    selectedCorrection: store.selectedCorrection,
    selectedThumbnail: store.selectedThumbnail,
    activeTab: store.activeTab,
    searchQuery: store.searchQuery,
    filter: store.filter,
    
    // Configuration
    config: store.config,
    stats: store.stats,
    analytics: store.analytics,
    
    // Computed Values
    ...computedValues,
    
    // Filtered Data
    filteredData,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
  };
};

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

export const useAIStats = () => {
  const { stats, analytics, computedValues } = useAdvancedAI();
  
  return {
    stats,
    analytics,
    ...computedValues,
  };
};

export const useAIConfig = () => {
  const { config, actions } = useAdvancedAI();
  
  return {
    config,
    updateConfig: actions.updateConfig,
    resetConfig: actions.resetConfig,
    saveConfig: actions.saveConfig,
    loadConfig: actions.loadConfig,
  };
};

export const useSentimentAnalysis = () => {
  const {
    sentimentAnalyses,
    filteredData,
    selectedAnalysis,
    actions,
    quickActions,
    debouncedActions,
  } = useAdvancedAI();
  
  return {
    analyses: sentimentAnalyses,
    filteredAnalyses: filteredData.analyses,
    selectedAnalysis,
    analyzeSentiment: actions.analyzeSentiment,
    batchAnalyzeSentiment: actions.batchAnalyzeSentiment,
    deleteAnalysis: actions.deleteAnalysis,
    exportAnalyses: actions.exportAnalyses,
    setSelectedAnalysis: actions.setSelectedAnalysis,
    quickAnalyze: quickActions.quickAnalyze,
    debouncedAnalyze: debouncedActions.debouncedAnalyze,
  };
};

export const useContentRecommendations = () => {
  const {
    recommendations,
    filteredData,
    selectedRecommendation,
    topRecommendations,
    actions,
    quickActions,
  } = useAdvancedAI();
  
  return {
    recommendations,
    filteredRecommendations: filteredData.recommendations,
    selectedRecommendation,
    topRecommendations,
    generateRecommendations: actions.generateRecommendations,
    refreshRecommendations: actions.refreshRecommendations,
    likeRecommendation: actions.likeRecommendation,
    dislikeRecommendation: actions.dislikeRecommendation,
    applyRecommendation: actions.applyRecommendation,
    setSelectedRecommendation: actions.setSelectedRecommendation,
    quickRecommend: quickActions.quickRecommend,
  };
};

export const useScriptCorrections = () => {
  const {
    corrections,
    filteredData,
    selectedCorrection,
    recentCorrections,
    actions,
    quickActions,
    debouncedActions,
  } = useAdvancedAI();
  
  return {
    corrections,
    filteredCorrections: filteredData.corrections,
    selectedCorrection,
    recentCorrections,
    correctScript: actions.correctScript,
    applyCorrection: actions.applyCorrection,
    rejectCorrection: actions.rejectCorrection,
    saveCorrection: actions.saveCorrection,
    setSelectedCorrection: actions.setSelectedCorrection,
    quickCorrect: quickActions.quickCorrect,
    debouncedCorrect: debouncedActions.debouncedCorrect,
  };
};

export const useThumbnailGeneration = () => {
  const {
    thumbnails,
    filteredData,
    selectedThumbnail,
    actions,
    quickActions,
  } = useAdvancedAI();
  
  return {
    thumbnails,
    filteredThumbnails: filteredData.thumbnails,
    selectedThumbnail,
    generateThumbnails: actions.generateThumbnails,
    selectThumbnail: actions.selectThumbnail,
    regenerateThumbnail: actions.regenerateThumbnail,
    downloadThumbnail: actions.downloadThumbnail,
    setSelectedThumbnail: actions.setSelectedThumbnail,
    quickGenerate: quickActions.quickGenerate,
  };
};

export const useAIModels = () => {
  const { models, modelAccuracy, actions } = useAdvancedAI();
  
  return {
    models,
    modelAccuracy,
    loadModels: actions.loadModels,
    trainModel: actions.trainModel,
    updateModel: actions.updateModel,
    deleteModel: actions.deleteModel,
  };
};

export const useAITasks = () => {
  const { tasks, activeTasks, activeTasksCount, completionRate, actions } = useAdvancedAI();
  
  return {
    tasks,
    activeTasks,
    activeTasksCount,
    completionRate,
    createTask: actions.createTask,
    updateTask: actions.updateTask,
    cancelTask: actions.cancelTask,
    retryTask: actions.retryTask,
    clearCompletedTasks: actions.clearCompletedTasks,
  };
};

export const useAIInsights = () => {
  const { insights, actions } = useAdvancedAI();
  
  return {
    insights,
    recentInsights: insights.slice(0, 5),
    createInsight: actions.createInsight,
    dismissInsight: actions.dismissInsight,
  };
};

export const useAIRealtime = () => {
  const { events, config, actions } = useAdvancedAI();
  const [isConnected, setIsConnected] = useProgress(false);
  
  useEffect(() => {
    if (config.enableRealtime) {
      setIsConnected(true);
      // Simulate real-time connection
      const interval = setInterval(() => {
        actions.logEvent({
          type: 'analysis_completed',
          data: { timestamp: new Date() },
        });
      }, 10000);
      
      return () => {
        clearInterval(interval);
        setIsConnected(false);
      };
    }
  }, [config.enableRealtime, actions]);
  
  return {
    events,
    isConnected,
    recentEvents: events.slice(0, 10),
    logEvent: actions.logEvent,
    clearEvents: actions.clearEvents,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;
};

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

export const useProgress = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);
  
  const setProgress = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);
  
  return [value, setProgress] as const;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};