import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  useContentRecommendationStore,
  UserProfile,
  ContentItem,
  Recommendation,
  ContentInteraction,
  ContentRating,
  RecommendationEngine,
  ABTestExperiment,
  RecommendationConfig,
  RecommendationStats,
  RecommendationMetrics
} from '../services/contentRecommendationService';

// Utility functions for throttling and debouncing
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

// Progress tracking hook
export const useRecommendationProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  
  const startProgress = useCallback((step: string) => {
    setIsProcessing(true);
    setCurrentStep(step);
    setProgress(0);
  }, []);
  
  const updateProgress = useCallback((value: number, step?: string) => {
    setProgress(Math.min(Math.max(value, 0), 100));
    if (step) setCurrentStep(step);
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('');
      setProgress(0);
    }, 500);
  }, []);
  
  return {
    progress,
    isProcessing,
    currentStep,
    startProgress,
    updateProgress,
    completeProgress
  };
};

// Main hook
export const useContentRecommendation = () => {
  const store = useContentRecommendationStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const refresh = async () => {
        try {
          await store.refresh();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      };
      
      // Initial refresh
      refresh();
      
      // Set up interval
      intervalRef.current = setInterval(refresh, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, store]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // User Profile Actions
    createUserProfile: store.createUserProfile,
    updateUserProfile: store.updateUserProfile,
    deleteUserProfile: store.deleteUserProfile,
    getUserProfile: store.getUserProfile,
    
    // Content Actions
    addContentItem: store.addContentItem,
    updateContentItem: store.updateContentItem,
    deleteContentItem: store.deleteContentItem,
    getContentItem: store.getContentItem,
    
    // Recommendation Actions
    generateRecommendations: store.generateRecommendations,
    getRecommendationsForUser: store.getRecommendationsForUser,
    refreshRecommendations: store.refreshRecommendations,
    
    // Interaction Actions
    trackInteraction: store.trackInteraction,
    trackRating: store.trackRating,
    
    // Engine Actions
    addEngine: store.addEngine,
    updateEngine: store.updateEngine,
    trainEngine: store.trainEngine,
    activateEngine: store.activateEngine,
    deactivateEngine: store.deactivateEngine,
    
    // Experiment Actions
    createExperiment: store.createExperiment,
    startExperiment: store.startExperiment,
    stopExperiment: store.stopExperiment,
    getExperimentResults: store.getExperimentResults,
    
    // Configuration Actions
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    exportConfig: store.exportConfig,
    importConfig: store.importConfig,
    
    // System Actions
    refresh: store.refresh,
    cleanup: store.cleanup,
    optimize: store.optimize
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickGenerateRecommendations: async (userId: string, count?: number) => {
      try {
        store.setLoading(true);
        const recommendations = await store.generateRecommendations(userId, count);
        return { success: true, data: recommendations };
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to generate recommendations');
        return { success: false, error };
      } finally {
        store.setLoading(false);
      }
    },
    
    quickTrackView: async (userId: string, contentId: string, duration?: number) => {
      try {
        await store.trackInteraction({
          userId,
          contentId,
          type: 'view',
          duration,
          context: { source: 'recommendation' }
        });
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    
    quickRate: async (userId: string, contentId: string, rating: number, review?: string) => {
      try {
        await store.trackRating({
          userId,
          contentId,
          rating,
          review,
          aspects: {
            quality: rating,
            relevance: rating,
            difficulty: rating,
            usefulness: rating
          }
        });
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    
    quickOptimize: async () => {
      try {
        store.setLoading(true);
        await store.optimize();
        return { success: true };
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Optimization failed');
        return { success: false, error };
      } finally {
        store.setLoading(false);
      }
    }
  }), [store]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    throttledRefresh: throttle(store.refresh, 5000),
    throttledUpdateStats: throttle(store.updateStats, 3000),
    throttledOptimize: throttle(store.optimize, 10000)
  }), [store]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    debouncedUpdateConfig: debounce(store.updateConfig, 1000),
    debouncedUpdateEngine: debounce(store.updateEngine, 1000)
  }), [store]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const {
      userProfiles,
      contentItems,
      recommendations,
      interactions,
      ratings,
      engines,
      experiments,
      stats
    } = store;
    
    // User engagement metrics
    const userEngagement = userProfiles.map(user => {
      const userInteractions = interactions.filter(i => i.userId === user.id);
      const userRatings = ratings.filter(r => r.userId === user.id);
      
      return {
        userId: user.id,
        totalInteractions: userInteractions.length,
        averageRating: userRatings.length > 0 
          ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length 
          : 0,
        engagementScore: user.behavior.engagementScore,
        lastActivity: userInteractions.length > 0 
          ? Math.max(...userInteractions.map(i => i.timestamp.getTime()))
          : 0
      };
    });
    
    // Content performance
    const contentPerformance = contentItems.map(content => {
      const contentInteractions = interactions.filter(i => i.contentId === content.id);
      const contentRatings = ratings.filter(r => r.contentId === content.id);
      const contentRecommendations = recommendations.filter(r => r.contentId === content.id);
      
      return {
        contentId: content.id,
        title: content.title,
        views: contentInteractions.filter(i => i.type === 'view').length,
        likes: contentInteractions.filter(i => i.type === 'like').length,
        shares: contentInteractions.filter(i => i.type === 'share').length,
        averageRating: contentRatings.length > 0
          ? contentRatings.reduce((sum, r) => sum + r.rating, 0) / contentRatings.length
          : 0,
        recommendationCount: contentRecommendations.length,
        clickThroughRate: contentRecommendations.length > 0
          ? contentInteractions.filter(i => i.type === 'view').length / contentRecommendations.length
          : 0
      };
    });
    
    // Engine performance comparison
    const engineComparison = engines.map(engine => ({
      id: engine.id,
      name: engine.name,
      type: engine.type,
      isActive: engine.isActive,
      performance: engine.performance,
      recommendationCount: recommendations.filter(r => r.algorithm === engine.type).length
    }));
    
    // Category insights
    const categoryInsights = contentItems.reduce((acc, content) => {
      if (!acc[content.category]) {
        acc[content.category] = {
          category: content.category,
          contentCount: 0,
          totalViews: 0,
          averageRating: 0,
          recommendationCount: 0
        };
      }
      
      acc[content.category].contentCount++;
      acc[content.category].totalViews += interactions.filter(i => 
        i.contentId === content.id && i.type === 'view'
      ).length;
      
      const categoryRatings = ratings.filter(r => r.contentId === content.id);
      if (categoryRatings.length > 0) {
        acc[content.category].averageRating = categoryRatings.reduce((sum, r) => sum + r.rating, 0) / categoryRatings.length;
      }
      
      acc[content.category].recommendationCount += recommendations.filter(r => r.contentId === content.id).length;
      
      return acc;
    }, {} as Record<string, any>);
    
    return {
      userEngagement,
      contentPerformance,
      engineComparison,
      categoryInsights: Object.values(categoryInsights),
      totalUsers: userProfiles.length,
      totalContent: contentItems.length,
      totalRecommendations: recommendations.length,
      totalInteractions: interactions.length,
      activeEngines: engines.filter(e => e.isActive).length,
      runningExperiments: experiments.filter(e => e.status === 'running').length,
      systemHealth: stats.systemHealth,
      isHealthy: stats.isHealthy
    };
  }, [store]);
  
  // Filtered data
  const getFilteredData = useMemo(() => ({
    getUsersByEngagement: (minScore: number = 0) => 
      store.userProfiles.filter(user => user.behavior.engagementScore >= minScore),
    
    getContentByRating: (minRating: number = 0) => 
      store.contentItems.filter(content => content.metadata.rating >= minRating),
    
    getRecommendationsByScore: (minScore: number = 0) => 
      store.recommendations.filter(rec => rec.score >= minScore),
    
    getActiveEngines: () => 
      store.engines.filter(engine => engine.isActive),
    
    getRunningExperiments: () => 
      store.experiments.filter(exp => exp.status === 'running'),
    
    getRecentInteractions: (hours: number = 24) => {
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      return store.interactions.filter(interaction => 
        interaction.timestamp.getTime() > cutoff
      );
    },
    
    getTrendingContent: () => 
      store.contentItems.filter(content => content.metadata.trending),
    
    getFeaturedContent: () => 
      store.contentItems.filter(content => content.metadata.featured)
  }), [store]);
  
  return {
    // State
    ...store,
    
    // Enhanced computed values
    computed,
    
    // Filtered data
    getFilteredData,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Auto-refresh controls
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };
};

// Specialized hooks
export const useRecommendationStats = () => {
  const { stats, updateStats } = useContentRecommendationStore();
  
  useEffect(() => {
    updateStats();
  }, [updateStats]);
  
  return stats;
};

export const useRecommendationConfig = () => {
  const { config, updateConfig, resetConfig, exportConfig, importConfig } = useContentRecommendationStore();
  
  const updateConfigField = useCallback((field: string, value: any) => {
    updateConfig({ [field]: value });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    updateConfigField,
    resetConfig,
    exportConfig,
    importConfig
  };
};

export const useRecommendationSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    category?: string;
    type?: string;
    difficulty?: string;
    minRating?: number;
  }>({});
  
  const { userProfiles, contentItems, recommendations } = useContentRecommendationStore();
  
  const filteredUsers = useMemo(() => {
    return userProfiles.filter(user => {
      if (searchTerm && !user.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [userProfiles, searchTerm]);
  
  const filteredContent = useMemo(() => {
    return contentItems.filter(content => {
      if (searchTerm && 
          !content.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !content.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (filters.category && content.category !== filters.category) {
        return false;
      }
      
      if (filters.type && content.type !== filters.type) {
        return false;
      }
      
      if (filters.difficulty && content.difficulty !== filters.difficulty) {
        return false;
      }
      
      if (filters.minRating && content.metadata.rating < filters.minRating) {
        return false;
      }
      
      return true;
    });
  }, [contentItems, searchTerm, filters]);
  
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      if (searchTerm && !rec.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [recommendations, searchTerm]);
  
  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredUsers,
    filteredContent,
    filteredRecommendations
  };
};

export const useCurrentUser = (userId: string | null) => {
  const { getUserProfile, getRecommendationsForUser } = useContentRecommendationStore();
  
  const user = useMemo(() => {
    return userId ? getUserProfile(userId) : null;
  }, [userId, getUserProfile]);
  
  const recommendations = useMemo(() => {
    return userId ? getRecommendationsForUser(userId) : [];
  }, [userId, getRecommendationsForUser]);
  
  return {
    user,
    recommendations,
    hasUser: !!user
  };
};

export const useRecommendationEngines = () => {
  const { 
    engines, 
    addEngine, 
    updateEngine, 
    trainEngine, 
    activateEngine, 
    deactivateEngine 
  } = useContentRecommendationStore();
  
  const activeEngines = useMemo(() => 
    engines.filter(engine => engine.isActive), 
    [engines]
  );
  
  const inactiveEngines = useMemo(() => 
    engines.filter(engine => !engine.isActive), 
    [engines]
  );
  
  const bestPerformingEngine = useMemo(() => {
    return engines.reduce((best, current) => {
      if (!best || current.performance.f1Score > best.performance.f1Score) {
        return current;
      }
      return best;
    }, null as RecommendationEngine | null);
  }, [engines]);
  
  return {
    engines,
    activeEngines,
    inactiveEngines,
    bestPerformingEngine,
    addEngine,
    updateEngine,
    trainEngine,
    activateEngine,
    deactivateEngine
  };
};

export const useRecommendationAnalytics = () => {
  const { stats, metrics, updateStats, updateMetrics, getInsights } = useContentRecommendationStore();
  
  const insights = useMemo(() => getInsights(), [getInsights]);
  
  const refreshAnalytics = useCallback(async () => {
    await updateStats();
    await updateMetrics();
  }, [updateStats, updateMetrics]);
  
  return {
    stats,
    metrics,
    insights,
    refreshAnalytics
  };
};

// Utility hooks
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useMemo(() => throttle(callback, delay), [callback, delay]);
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useMemo(() => debounce(callback, delay), [callback, delay]);
};

// Helper function for recommendation complexity calculation
export const calculateRecommendationComplexity = (recommendation: Recommendation): number => {
  let complexity = 0;
  
  // Base complexity from algorithm type
  const algorithmComplexity = {
    'collaborative': 0.8,
    'content_based': 0.6,
    'hybrid': 0.9,
    'trending': 0.3,
    'personalized': 0.7
  };
  
  complexity += algorithmComplexity[recommendation.algorithm as keyof typeof algorithmComplexity] || 0.5;
  
  // Add complexity based on number of reasons
  complexity += Math.min(recommendation.reasons.length * 0.1, 0.3);
  
  // Add complexity based on confidence
  complexity += recommendation.confidence * 0.2;
  
  // Add complexity based on context factors
  complexity += Math.min(recommendation.context.factors.length * 0.05, 0.2);
  
  return Math.min(complexity, 1);
};

export default useContentRecommendation;