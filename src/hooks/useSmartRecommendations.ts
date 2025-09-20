import { useEffect, useMemo, useCallback, useState } from 'react';
import { 
  useSmartRecommendationsStore,
  RecommendationItem,
  RecommendationFilter,
  RecommendationEngine,
  RecommendationCampaign,
  RecommendationFeedback,
  RecommendationContext,
  UserProfile
} from '../services/smartRecommendationsService';

// Main Hook
export const useSmartRecommendations = () => {
  // Store state
  const {
    recommendations,
    userProfile,
    engines,
    campaigns,
    feedback,
    events,
    isLoading,
    error,
    isTraining,
    connectionStatus,
    lastUpdate,
    filter,
    searchQuery,
    config,
    filteredRecommendations,
    personalizedRecommendations,
    trendingRecommendations,
    recentRecommendations,
    topRatedRecommendations,
    activeCampaigns,
    pendingFeedback,
    stats
  } = useSmartRecommendationsStore();
  
  // Store actions
  const {
    generateRecommendations,
    getRecommendations,
    getPersonalizedRecommendations,
    refreshRecommendations,
    updateUserProfile,
    trackUserBehavior,
    updateUserPreferences,
    addEngine,
    updateEngine,
    removeEngine,
    trainEngine,
    evaluateEngine,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    submitFeedback,
    processFeedback,
    bulkProcessFeedback,
    trackEvent,
    getEvents,
    setFilter,
    setSearch,
    clearFilters,
    startRealTimeUpdates,
    stopRealTimeUpdates,
    quickActions,
    explainRecommendation,
    getSimilarRecommendations,
    getRecommendationInsights,
    optimizeRecommendations,
    exportRecommendations,
    importRecommendations,
    backupData,
    restoreData,
    utilities,
    updateConfig,
    resetConfig,
    getAnalytics,
    generateReport,
    debugRecommendation,
    validateData
  } = useSmartRecommendationsStore();
  
  // Local state for UI
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes
  
  // Auto-initialization and refresh
  useEffect(() => {
    const initializeRecommendations = async () => {
      if (recommendations.length === 0) {
        await generateRecommendations();
      }
      
      if (connectionStatus === 'disconnected') {
        await startRealTimeUpdates();
      }
    };
    
    initializeRecommendations();
  }, []);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshRecommendations();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshRecommendations]);
  
  // Memoized actions
  const memoizedActions = useMemo(() => ({
    generateRecommendations: useCallback(generateRecommendations, [generateRecommendations]),
    getRecommendations: useCallback(getRecommendations, [getRecommendations]),
    getPersonalizedRecommendations: useCallback(getPersonalizedRecommendations, [getPersonalizedRecommendations]),
    refreshRecommendations: useCallback(refreshRecommendations, [refreshRecommendations]),
    updateUserProfile: useCallback(updateUserProfile, [updateUserProfile]),
    trackUserBehavior: useCallback(trackUserBehavior, [trackUserBehavior]),
    updateUserPreferences: useCallback(updateUserPreferences, [updateUserPreferences]),
    addEngine: useCallback(addEngine, [addEngine]),
    updateEngine: useCallback(updateEngine, [updateEngine]),
    removeEngine: useCallback(removeEngine, [removeEngine]),
    trainEngine: useCallback(trainEngine, [trainEngine]),
    evaluateEngine: useCallback(evaluateEngine, [evaluateEngine]),
    createCampaign: useCallback(createCampaign, [createCampaign]),
    updateCampaign: useCallback(updateCampaign, [updateCampaign]),
    deleteCampaign: useCallback(deleteCampaign, [deleteCampaign]),
    startCampaign: useCallback(startCampaign, [startCampaign]),
    pauseCampaign: useCallback(pauseCampaign, [pauseCampaign]),
    submitFeedback: useCallback(submitFeedback, [submitFeedback]),
    processFeedback: useCallback(processFeedback, [processFeedback]),
    bulkProcessFeedback: useCallback(bulkProcessFeedback, [bulkProcessFeedback]),
    trackEvent: useCallback(trackEvent, [trackEvent]),
    getEvents: useCallback(getEvents, [getEvents]),
    setFilter: useCallback(setFilter, [setFilter]),
    setSearch: useCallback(setSearch, [setSearch]),
    clearFilters: useCallback(clearFilters, [clearFilters]),
    startRealTimeUpdates: useCallback(startRealTimeUpdates, [startRealTimeUpdates]),
    stopRealTimeUpdates: useCallback(stopRealTimeUpdates, [stopRealTimeUpdates])
  }), [
    generateRecommendations, getRecommendations, getPersonalizedRecommendations,
    refreshRecommendations, updateUserProfile, trackUserBehavior, updateUserPreferences,
    addEngine, updateEngine, removeEngine, trainEngine, evaluateEngine,
    createCampaign, updateCampaign, deleteCampaign, startCampaign, pauseCampaign,
    submitFeedback, processFeedback, bulkProcessFeedback, trackEvent, getEvents,
    setFilter, setSearch, clearFilters, startRealTimeUpdates, stopRealTimeUpdates
  ]);
  
  // Quick actions
  const quickActionsWithTracking = useMemo(() => ({
    like: useCallback(async (id: string) => {
      await quickActions.likeRecommendation(id);
      await trackUserBehavior('like', { itemId: id });
    }, [quickActions.likeRecommendation, trackUserBehavior]),
    
    dislike: useCallback(async (id: string) => {
      await quickActions.dislikeRecommendation(id);
      await trackUserBehavior('dislike', { itemId: id });
    }, [quickActions.dislikeRecommendation, trackUserBehavior]),
    
    notInterested: useCallback(async (id: string) => {
      await quickActions.markAsNotInterested(id);
      await trackUserBehavior('not_interested', { itemId: id });
    }, [quickActions.markAsNotInterested, trackUserBehavior]),
    
    download: useCallback(async (id: string) => {
      await quickActions.downloadRecommendation(id);
      await trackUserBehavior('download', { itemId: id });
    }, [quickActions.downloadRecommendation, trackUserBehavior]),
    
    share: useCallback(async (id: string, platform: string) => {
      await quickActions.shareRecommendation(id, platform);
      await trackUserBehavior('share', { itemId: id, platform });
    }, [quickActions.shareRecommendation, trackUserBehavior]),
    
    view: useCallback(async (id: string) => {
      await trackUserBehavior('view', { itemId: id });
    }, [trackUserBehavior])
  }), [quickActions, trackUserBehavior]);
  
  // Advanced features
  const advancedFeatures = useMemo(() => ({
    explainRecommendation: useCallback(explainRecommendation, [explainRecommendation]),
    getSimilarRecommendations: useCallback(getSimilarRecommendations, [getSimilarRecommendations]),
    getRecommendationInsights: useCallback(getRecommendationInsights, [getRecommendationInsights]),
    optimizeRecommendations: useCallback(optimizeRecommendations, [optimizeRecommendations])
  }), [explainRecommendation, getSimilarRecommendations, getRecommendationInsights, optimizeRecommendations]);
  
  // System operations
  const systemOperations = useMemo(() => ({
    exportRecommendations: useCallback(exportRecommendations, [exportRecommendations]),
    importRecommendations: useCallback(importRecommendations, [importRecommendations]),
    backupData: useCallback(backupData, [backupData]),
    restoreData: useCallback(restoreData, [restoreData])
  }), [exportRecommendations, importRecommendations, backupData, restoreData]);
  
  // Utilities
  const utilityFunctions = useMemo(() => ({
    ...utilities,
    setAutoRefresh,
    setRefreshInterval
  }), [utilities]);
  
  // Configuration and analytics
  const configAndAnalytics = useMemo(() => ({
    updateConfig: useCallback(updateConfig, [updateConfig]),
    resetConfig: useCallback(resetConfig, [resetConfig]),
    getAnalytics: useCallback(getAnalytics, [getAnalytics]),
    generateReport: useCallback(generateReport, [generateReport])
  }), [updateConfig, resetConfig, getAnalytics, generateReport]);
  
  // Debug helpers
  const debugHelpers = useMemo(() => ({
    debugRecommendation: useCallback(debugRecommendation, [debugRecommendation]),
    validateData: useCallback(validateData, [validateData])
  }), [debugRecommendation, validateData]);
  
  // Computed values
  const computedValues = useMemo(() => ({
    hasRecommendations: recommendations.length > 0,
    hasPersonalizedRecommendations: personalizedRecommendations.length > 0,
    hasTrendingRecommendations: trendingRecommendations.length > 0,
    hasActiveCampaigns: activeCampaigns.length > 0,
    hasPendingFeedback: pendingFeedback.length > 0,
    isConnected: connectionStatus === 'connected',
    isReconnecting: connectionStatus === 'reconnecting',
    hasError: !!error,
    isInitialized: recommendations.length > 0 && engines.length > 0,
    engagementRate: stats.clickThroughRate,
    satisfactionRate: stats.userSatisfaction,
    totalEngines: engines.length,
    activeEngines: engines.filter(e => e.enabled).length,
    averageRating: recommendations.reduce((sum, r) => sum + r.rating, 0) / recommendations.length || 0,
    autoRefresh,
    refreshInterval
  }), [
    recommendations, personalizedRecommendations, trendingRecommendations,
    activeCampaigns, pendingFeedback, connectionStatus, error, engines,
    stats, autoRefresh, refreshInterval
  ]);
  
  return {
    // State
    recommendations,
    userProfile,
    engines,
    campaigns,
    feedback,
    events,
    isLoading,
    error,
    isTraining,
    connectionStatus,
    lastUpdate,
    filter,
    searchQuery,
    config,
    
    // Computed state
    filteredRecommendations,
    personalizedRecommendations,
    trendingRecommendations,
    recentRecommendations,
    topRatedRecommendations,
    activeCampaigns,
    pendingFeedback,
    stats,
    
    // Actions
    ...memoizedActions,
    
    // Quick actions
    quickActions: quickActionsWithTracking,
    
    // Advanced features
    ...advancedFeatures,
    
    // System operations
    ...systemOperations,
    
    // Utilities
    utilities: utilityFunctions,
    
    // Configuration and analytics
    ...configAndAnalytics,
    
    // Debug helpers
    ...debugHelpers,
    
    // Computed values
    ...computedValues
  };
};

// Specialized Hooks
export const useRecommendationStats = () => {
  const { stats, getAnalytics } = useSmartRecommendations();
  
  const [customStats, setCustomStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  const loadCustomStats = useCallback(async (timeRange?: { start: Date; end: Date }) => {
    setIsLoadingStats(true);
    try {
      const analytics = await getAnalytics(timeRange);
      setCustomStats(analytics);
    } catch (error) {
      console.error('Error loading custom stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [getAnalytics]);
  
  return {
    stats,
    customStats,
    isLoadingStats,
    loadCustomStats
  };
};

export const useRecommendationConfig = () => {
  const { config, updateConfig, resetConfig } = useSmartRecommendations();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);
  
  const updateLocalConfig = useCallback((updates: any) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);
  
  const saveConfig = useCallback(async () => {
    await updateConfig(localConfig);
    setHasChanges(false);
  }, [localConfig, updateConfig]);
  
  const discardChanges = useCallback(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);
  
  return {
    config: localConfig,
    hasChanges,
    updateLocalConfig,
    saveConfig,
    discardChanges,
    resetConfig
  };
};

export const useRecommendationEngines = () => {
  const {
    engines,
    addEngine,
    updateEngine,
    removeEngine,
    trainEngine,
    evaluateEngine,
    isTraining
  } = useSmartRecommendations();
  
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  
  const enabledEngines = useMemo(() => 
    engines.filter(engine => engine.enabled),
    [engines]
  );
  
  const disabledEngines = useMemo(() => 
    engines.filter(engine => !engine.enabled),
    [engines]
  );
  
  const bestPerformingEngine = useMemo(() => 
    engines.reduce((best, current) => 
      current.performance.accuracy > (best?.performance.accuracy || 0) ? current : best,
      null as RecommendationEngine | null
    ),
    [engines]
  );
  
  const toggleEngine = useCallback(async (id: string) => {
    const engine = engines.find(e => e.id === id);
    if (engine) {
      await updateEngine(id, { enabled: !engine.enabled });
    }
  }, [engines, updateEngine]);
  
  return {
    engines,
    enabledEngines,
    disabledEngines,
    bestPerformingEngine,
    selectedEngine,
    setSelectedEngine,
    addEngine,
    updateEngine,
    removeEngine,
    trainEngine,
    evaluateEngine,
    toggleEngine,
    isTraining
  };
};

export const useRecommendationCampaigns = () => {
  const {
    campaigns,
    activeCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign
  } = useSmartRecommendations();
  
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  const draftCampaigns = useMemo(() => 
    campaigns.filter(campaign => campaign.status === 'draft'),
    [campaigns]
  );
  
  const completedCampaigns = useMemo(() => 
    campaigns.filter(campaign => campaign.status === 'completed'),
    [campaigns]
  );
  
  const pausedCampaigns = useMemo(() => 
    campaigns.filter(campaign => campaign.status === 'paused'),
    [campaigns]
  );
  
  const topPerformingCampaign = useMemo(() => 
    campaigns.reduce((best, current) => 
      current.performance.conversions > (best?.performance.conversions || 0) ? current : best,
      null as RecommendationCampaign | null
    ),
    [campaigns]
  );
  
  return {
    campaigns,
    activeCampaigns,
    draftCampaigns,
    completedCampaigns,
    pausedCampaigns,
    topPerformingCampaign,
    selectedCampaign,
    setSelectedCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign
  };
};

export const useRecommendationFeedback = () => {
  const {
    feedback,
    pendingFeedback,
    submitFeedback,
    processFeedback,
    bulkProcessFeedback
  } = useSmartRecommendations();
  
  const positiveFeedback = useMemo(() => 
    feedback.filter(f => f.type === 'like' || f.type === 'helpful'),
    [feedback]
  );
  
  const negativeFeedback = useMemo(() => 
    feedback.filter(f => f.type === 'dislike' || f.type === 'not-interested' || f.type === 'irrelevant'),
    [feedback]
  );
  
  const feedbackStats = useMemo(() => ({
    total: feedback.length,
    positive: positiveFeedback.length,
    negative: negativeFeedback.length,
    pending: pendingFeedback.length,
    processed: feedback.filter(f => f.processed).length,
    positiveRate: feedback.length > 0 ? positiveFeedback.length / feedback.length : 0,
    negativeRate: feedback.length > 0 ? negativeFeedback.length / feedback.length : 0
  }), [feedback, positiveFeedback, negativeFeedback, pendingFeedback]);
  
  return {
    feedback,
    pendingFeedback,
    positiveFeedback,
    negativeFeedback,
    feedbackStats,
    submitFeedback,
    processFeedback,
    bulkProcessFeedback
  };
};

export const useRecommendationAnalytics = () => {
  const { stats, getAnalytics, generateReport } = useSmartRecommendations();
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const loadAnalytics = useCallback(async (timeRange?: { start: Date; end: Date }) => {
    setIsLoadingAnalytics(true);
    try {
      const data = await getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [getAnalytics]);
  
  const createReport = useCallback(async (type: 'performance' | 'user-behavior' | 'content-analysis') => {
    setIsGeneratingReport(true);
    try {
      const report = await generateReport(type);
      setReports(prev => [report, ...prev]);
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setIsGeneratingReport(false);
    }
  }, [generateReport]);
  
  return {
    stats,
    analyticsData,
    reports,
    isLoadingAnalytics,
    isGeneratingReport,
    loadAnalytics,
    createReport
  };
};

export const useRecommendationRealTime = () => {
  const {
    connectionStatus,
    startRealTimeUpdates,
    stopRealTimeUpdates,
    lastUpdate
  } = useSmartRecommendations();
  
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';
  const isDisconnected = connectionStatus === 'disconnected';
  
  const connect = useCallback(async () => {
    try {
      await startRealTimeUpdates();
      setReconnectAttempts(0);
    } catch (error) {
      console.error('Error connecting to real-time updates:', error);
    }
  }, [startRealTimeUpdates]);
  
  const disconnect = useCallback(async () => {
    try {
      await stopRealTimeUpdates();
    } catch (error) {
      console.error('Error disconnecting from real-time updates:', error);
    }
  }, [stopRealTimeUpdates]);
  
  const reconnect = useCallback(async () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      setReconnectAttempts(prev => prev + 1);
      await disconnect();
      setTimeout(() => connect(), 1000 * reconnectAttempts);
    }
  }, [reconnectAttempts, maxReconnectAttempts, connect, disconnect]);
  
  // Auto-reconnect on disconnect
  useEffect(() => {
    if (isDisconnected && reconnectAttempts < maxReconnectAttempts) {
      const timeout = setTimeout(reconnect, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isDisconnected, reconnectAttempts, maxReconnectAttempts, reconnect]);
  
  return {
    connectionStatus,
    isConnected,
    isReconnecting,
    isDisconnected,
    lastUpdate,
    reconnectAttempts,
    maxReconnectAttempts,
    connect,
    disconnect,
    reconnect
  };
};

// Utility Hooks
export const useThrottledRecommendations = (delay: number = 300) => {
  const { filteredRecommendations } = useSmartRecommendations();
  const [throttledRecommendations, setThrottledRecommendations] = useState(filteredRecommendations);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setThrottledRecommendations(filteredRecommendations);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [filteredRecommendations, delay]);
  
  return throttledRecommendations;
};

export const useDebouncedSearch = (delay: number = 500) => {
  const { searchQuery, setSearch } = useSmartRecommendations();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(debouncedQuery);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [debouncedQuery, delay, setSearch]);
  
  return [debouncedQuery, setDebouncedQuery] as const;
};

export const useRecommendationProgress = () => {
  const { isLoading, isTraining } = useSmartRecommendations();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (isLoading || isTraining) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 10;
          return next >= 90 ? 90 : next;
        });
      }, 200);
      
      return () => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
      };
    }
  }, [isLoading, isTraining]);
  
  return progress;
};

// Helper functions
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