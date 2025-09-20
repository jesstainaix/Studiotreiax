import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useIntelligentRecommendationsStore,
  UserProfile,
  ContentItem,
  RecommendationItem,
  RecommendationConfig,
  RecommendationStats,
  MLModel,
  RecommendationEvent
} from '../services/intelligentRecommendationsService';

// Main hook for intelligent recommendations
export const useIntelligentRecommendations = () => {
  // Store state
  const {
    userProfiles,
    contentItems,
    recommendations,
    models,
    config,
    stats,
    events,
    isProcessing,
    error,
    isInitialized,
    activeUsers,
    trendingContent,
    topRecommendations,
    recentEvents,
    modelPerformance
  } = useIntelligentRecommendationsStore();
  
  // Store actions
  const {
    // User Management
    createUserProfile,
    updateUserProfile,
    getUserProfile,
    trackUserBehavior,
    updateUserPreferences,
    
    // Content Management
    addContent,
    updateContent,
    removeContent,
    getContent,
    searchContent,
    
    // Recommendation Generation
    generateRecommendations,
    getPersonalizedRecommendations,
    getSimilarContent,
    getTrendingRecommendations,
    getCollaborativeRecommendations,
    
    // Feedback and Learning
    recordInteraction,
    submitFeedback,
    reportRecommendation,
    
    // Model Management
    trainModel,
    updateModel,
    deployModel,
    evaluateModel,
    
    // Analytics and Insights
    getRecommendationStats,
    getUserInsights,
    getContentInsights,
    getAlgorithmPerformance,
    
    // Search and Filtering
    searchRecommendations,
    filterRecommendations,
    
    // Real-time Processing
    startRealTimeProcessing,
    stopRealTimeProcessing,
    processRealtimeEvent,
    
    // Quick Actions
    quickRecommend,
    exploreContent,
    discoverNew,
    
    // Advanced Features
    createRecommendationCampaign,
    optimizeRecommendations,
    generateExplanations,
    
    // System Operations
    initialize,
    refresh,
    reset,
    healthCheck,
    
    // Configuration
    updateConfig,
    getConfig,
    
    // Utilities
    exportRecommendations,
    importUserData,
    calculateSimilarity,
    predictUserRating
  } = useIntelligentRecommendationsStore();
  
  // Local state for UI
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Auto-initialization effect
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;
    
    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isInitialized, refresh]);
  
  // Demo data generation effect
  useEffect(() => {
    if (isInitialized && userProfiles.length === 0) {
      generateDemoData();
    }
  }, [isInitialized, userProfiles.length]);
  
  // Generate demo data
  const generateDemoData = useCallback(async () => {
    try {
      // Create demo users
      const demoUsers = [
        {
          id: 'user_1',
          preferences: {
            contentTypes: ['video', 'tutorial'],
            genres: ['technology', 'education'],
            duration: { min: 300, max: 1800 },
            quality: 'hd',
            language: 'en',
            topics: ['programming', 'design'],
            mood: 'focused',
            complexity: 'intermediate'
          }
        },
        {
          id: 'user_2',
          preferences: {
            contentTypes: ['audio', 'video'],
            genres: ['entertainment', 'music'],
            duration: { min: 180, max: 900 },
            quality: 'hd',
            language: 'en',
            topics: ['music', 'art'],
            mood: 'relaxed',
            complexity: 'beginner'
          }
        },
        {
          id: 'user_3',
          preferences: {
            contentTypes: ['document', 'template'],
            genres: ['business', 'productivity'],
            duration: { min: 600, max: 2400 },
            quality: 'hd',
            language: 'en',
            topics: ['business', 'productivity'],
            mood: 'professional',
            complexity: 'advanced'
          }
        }
      ];
      
      for (const user of demoUsers) {
        await createUserProfile(user.id, user.preferences);
      }
      
      // Create demo content
      const demoContent = [
        {
          title: 'Advanced React Patterns',
          description: 'Learn advanced React patterns and best practices',
          type: 'video' as const,
          category: 'technology',
          tags: ['react', 'javascript', 'frontend'],
          duration: 1200,
          quality: 'hd',
          language: 'en',
          difficulty: 'advanced',
          popularity: 85,
          rating: 4.7,
          views: 15420,
          metadata: {
            author: 'Tech Expert',
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=advanced%20react%20patterns%20tutorial%20thumbnail&image_size=landscape_16_9',
            fileSize: 245000000,
            format: 'mp4',
            resolution: '1920x1080',
            bitrate: 5000,
            topics: ['react', 'patterns', 'javascript'],
            keywords: ['react', 'advanced', 'patterns', 'hooks'],
            mood: 'educational',
            style: 'tutorial'
          },
          analytics: {
            engagement: 0.78,
            completionRate: 0.65,
            shareRate: 0.12,
            likeRatio: 0.89,
            commentCount: 234,
            trendingScore: 0.82
          }
        },
        {
          title: 'UI/UX Design Fundamentals',
          description: 'Master the fundamentals of user interface and experience design',
          type: 'video' as const,
          category: 'design',
          tags: ['design', 'ui', 'ux', 'fundamentals'],
          duration: 900,
          quality: 'hd',
          language: 'en',
          difficulty: 'beginner',
          popularity: 92,
          rating: 4.8,
          views: 28350,
          metadata: {
            author: 'Design Pro',
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ui%20ux%20design%20fundamentals%20course%20thumbnail&image_size=landscape_16_9',
            fileSize: 180000000,
            format: 'mp4',
            resolution: '1920x1080',
            bitrate: 4000,
            topics: ['design', 'ui', 'ux', 'principles'],
            keywords: ['design', 'ui', 'ux', 'fundamentals'],
            mood: 'creative',
            style: 'course'
          },
          analytics: {
            engagement: 0.85,
            completionRate: 0.72,
            shareRate: 0.18,
            likeRatio: 0.94,
            commentCount: 456,
            trendingScore: 0.91
          }
        },
        {
          title: 'Business Strategy Template',
          description: 'Comprehensive business strategy planning template',
          type: 'template' as const,
          category: 'business',
          tags: ['business', 'strategy', 'planning', 'template'],
          quality: 'hd',
          language: 'en',
          difficulty: 'intermediate',
          popularity: 76,
          rating: 4.5,
          views: 8920,
          metadata: {
            author: 'Business Consultant',
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=business%20strategy%20template%20document&image_size=portrait_4_3',
            fileSize: 2500000,
            format: 'pdf',
            topics: ['business', 'strategy', 'planning'],
            keywords: ['business', 'strategy', 'template', 'planning'],
            mood: 'professional',
            style: 'template'
          },
          analytics: {
            engagement: 0.68,
            completionRate: 0.88,
            shareRate: 0.25,
            likeRatio: 0.82,
            commentCount: 89,
            trendingScore: 0.74
          }
        }
      ];
      
      for (const content of demoContent) {
        await addContent(content);
      }
      
      // Generate some demo recommendations
      for (const user of demoUsers) {
        await generateRecommendations(user.id, 'demo', 5);
      }
      
    } catch (error) {
      console.error('Failed to generate demo data:', error);
    }
  }, [createUserProfile, addContent, generateRecommendations]);
  
  // Memoized actions with error handling
  const actions = useMemo(() => ({
    // User Management
    createUser: async (userId: string, preferences?: any) => {
      try {
        return await createUserProfile(userId, preferences);
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    },
    
    updateUser: async (userId: string, updates: Partial<UserProfile>) => {
      try {
        await updateUserProfile(userId, updates);
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      }
    },
    
    trackBehavior: async (userId: string, behavior: any) => {
      try {
        await trackUserBehavior(userId, behavior);
      } catch (error) {
        console.error('Failed to track behavior:', error);
        throw error;
      }
    },
    
    // Content Management
    createContent: async (content: any) => {
      try {
        return await addContent(content);
      } catch (error) {
        console.error('Failed to create content:', error);
        throw error;
      }
    },
    
    editContent: async (contentId: string, updates: Partial<ContentItem>) => {
      try {
        await updateContent(contentId, updates);
      } catch (error) {
        console.error('Failed to update content:', error);
        throw error;
      }
    },
    
    deleteContent: async (contentId: string) => {
      try {
        await removeContent(contentId);
      } catch (error) {
        console.error('Failed to delete content:', error);
        throw error;
      }
    },
    
    // Recommendation Generation
    recommend: async (userId: string, options?: any) => {
      try {
        return await generateRecommendations(userId, options?.context, options?.limit);
      } catch (error) {
        console.error('Failed to generate recommendations:', error);
        throw error;
      }
    },
    
    getPersonalized: async (userId: string, options?: any) => {
      try {
        return await getPersonalizedRecommendations(userId, options);
      } catch (error) {
        console.error('Failed to get personalized recommendations:', error);
        throw error;
      }
    },
    
    getSimilar: async (contentId: string, limit?: number) => {
      try {
        return await getSimilarContent(contentId, limit);
      } catch (error) {
        console.error('Failed to get similar content:', error);
        throw error;
      }
    },
    
    // Feedback
    recordClick: async (userId: string, recommendationId: string, interaction: any) => {
      try {
        await recordInteraction(userId, recommendationId, interaction);
      } catch (error) {
        console.error('Failed to record interaction:', error);
        throw error;
      }
    },
    
    provideFeedback: async (userId: string, recommendationId: string, feedback: any) => {
      try {
        await submitFeedback(userId, recommendationId, feedback);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        throw error;
      }
    },
    
    // Model Management
    createModel: async (modelType: string, data?: any) => {
      try {
        return await trainModel(modelType, data);
      } catch (error) {
        console.error('Failed to train model:', error);
        throw error;
      }
    },
    
    // System
    refreshData: async () => {
      try {
        await refresh();
      } catch (error) {
        console.error('Failed to refresh data:', error);
        throw error;
      }
    },
    
    resetSystem: async () => {
      try {
        await reset();
      } catch (error) {
        console.error('Failed to reset system:', error);
        throw error;
      }
    }
  }), [
    createUserProfile, updateUserProfile, trackUserBehavior,
    addContent, updateContent, removeContent,
    generateRecommendations, getPersonalizedRecommendations, getSimilarContent,
    recordInteraction, submitFeedback,
    trainModel, refresh, reset
  ]);
  
  // Quick Actions
  const quickActions = useMemo(() => ({
    quickRecommend: async (userId: string) => {
      try {
        return await quickRecommend(userId);
      } catch (error) {
        console.error('Failed to get quick recommendations:', error);
        return [];
      }
    },
    
    exploreContent: async (userId: string, category?: string) => {
      try {
        return await exploreContent(userId, category);
      } catch (error) {
        console.error('Failed to explore content:', error);
        return [];
      }
    },
    
    discoverNew: async (userId: string, noveltyFactor?: number) => {
      try {
        return await discoverNew(userId, noveltyFactor);
      } catch (error) {
        console.error('Failed to discover new content:', error);
        return [];
      }
    }
  }), [quickRecommend, exploreContent, discoverNew]);
  
  // Advanced Features
  const advancedFeatures = useMemo(() => ({
    createCampaign: async (campaign: any) => {
      try {
        return await createRecommendationCampaign(campaign);
      } catch (error) {
        console.error('Failed to create campaign:', error);
        throw error;
      }
    },
    
    optimize: async (userId: string, objective: 'engagement' | 'diversity' | 'novelty' | 'satisfaction') => {
      try {
        return await optimizeRecommendations(userId, objective);
      } catch (error) {
        console.error('Failed to optimize recommendations:', error);
        return [];
      }
    },
    
    explain: async (recommendationId: string) => {
      try {
        return await generateExplanations(recommendationId);
      } catch (error) {
        console.error('Failed to generate explanations:', error);
        throw error;
      }
    }
  }), [createRecommendationCampaign, optimizeRecommendations, generateExplanations]);
  
  // System Operations
  const systemOps = useMemo(() => ({
    checkHealth: async () => {
      try {
        return await healthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
        return false;
      }
    },
    
    startRealTime: async () => {
      try {
        await startRealTimeProcessing();
      } catch (error) {
        console.error('Failed to start real-time processing:', error);
        throw error;
      }
    },
    
    stopRealTime: async () => {
      try {
        await stopRealTimeProcessing();
      } catch (error) {
        console.error('Failed to stop real-time processing:', error);
        throw error;
      }
    }
  }), [healthCheck, startRealTimeProcessing, stopRealTimeProcessing]);
  
  // Utilities
  const utilities = useMemo(() => ({
    search: (query: string) => searchRecommendations(query),
    filter: (filters: any) => filterRecommendations(filters),
    searchContent: (query: string, filters?: any) => searchContent(query, filters),
    export: async (format: 'json' | 'csv' | 'xml') => {
      try {
        return await exportRecommendations(format);
      } catch (error) {
        console.error('Failed to export recommendations:', error);
        throw error;
      }
    },
    import: async (data: any, format: 'json' | 'csv') => {
      try {
        await importUserData(data, format);
      } catch (error) {
        console.error('Failed to import user data:', error);
        throw error;
      }
    },
    similarity: (item1: ContentItem, item2: ContentItem) => calculateSimilarity(item1, item2),
    predictRating: async (userId: string, contentId: string) => {
      try {
        return await predictUserRating(userId, contentId);
      } catch (error) {
        console.error('Failed to predict rating:', error);
        return 0;
      }
    }
  }), [
    searchRecommendations, filterRecommendations, searchContent,
    exportRecommendations, importUserData, calculateSimilarity, predictUserRating
  ]);
  
  // Configuration and Analytics
  const configAndAnalytics = useMemo(() => ({
    getStats: () => getRecommendationStats(),
    getUserInsights: async (userId: string) => {
      try {
        return await getUserInsights(userId);
      } catch (error) {
        console.error('Failed to get user insights:', error);
        throw error;
      }
    },
    getContentInsights: async (contentId: string) => {
      try {
        return await getContentInsights(contentId);
      } catch (error) {
        console.error('Failed to get content insights:', error);
        throw error;
      }
    },
    getAlgorithmPerformance: () => getAlgorithmPerformance(),
    updateConfig: async (updates: Partial<RecommendationConfig>) => {
      try {
        await updateConfig(updates);
      } catch (error) {
        console.error('Failed to update config:', error);
        throw error;
      }
    },
    getConfig: () => getConfig()
  }), [
    getRecommendationStats, getUserInsights, getContentInsights,
    getAlgorithmPerformance, updateConfig, getConfig
  ]);
  
  // Debug helpers
  const debug = useMemo(() => ({
    logState: () => {
    },
    
    logStats: () => {
    },
    
    logConfig: () => {
    }
  }), [userProfiles, contentItems, recommendations, models, isProcessing, error, isInitialized, stats, config]);
  
  // Computed values
  const computed = useMemo(() => ({
    totalUsers: userProfiles.length,
    totalContent: contentItems.length,
    totalRecommendations: recommendations.length,
    totalModels: models.length,
    activeUserCount: activeUsers.length,
    trendingContentCount: trendingContent.length,
    topRecommendationCount: topRecommendations.length,
    recentEventCount: recentEvents.length,
    averageScore: recommendations.length > 0 
      ? recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length 
      : 0,
    isHealthy: isInitialized && !error,
    hasData: userProfiles.length > 0 && contentItems.length > 0,
    processingStatus: isProcessing ? 'processing' : 'idle',
    systemStatus: error ? 'error' : isInitialized ? 'ready' : 'initializing'
  }), [
    userProfiles, contentItems, recommendations, models,
    activeUsers, trendingContent, topRecommendations, recentEvents,
    isInitialized, error, isProcessing
  ]);
  
  return {
    // State
    userProfiles,
    contentItems,
    recommendations,
    models,
    config,
    stats,
    events,
    isProcessing,
    error,
    isInitialized,
    
    // Computed state
    activeUsers,
    trendingContent,
    topRecommendations,
    recentEvents,
    modelPerformance,
    
    // Actions
    actions,
    quickActions,
    advancedFeatures,
    systemOps,
    utilities,
    configAndAnalytics,
    debug,
    
    // Computed values
    computed,
    
    // UI state
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };
};

// Specialized hooks
export const useRecommendationStats = () => {
  const { stats, getRecommendationStats } = useIntelligentRecommendationsStore();
  
  useEffect(() => {
    getRecommendationStats();
  }, [getRecommendationStats]);
  
  return stats;
};

export const useRecommendationConfig = () => {
  const { config, updateConfig, getConfig } = useIntelligentRecommendationsStore();
  
  const updateConfiguration = useCallback(async (updates: Partial<RecommendationConfig>) => {
    try {
      await updateConfig(updates);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }, [updateConfig]);
  
  return {
    config,
    updateConfig: updateConfiguration,
    getConfig
  };
};

export const useUserRecommendations = (userId: string) => {
  const { 
    generateRecommendations,
    getPersonalizedRecommendations,
    quickRecommend,
    discoverNew
  } = useIntelligentRecommendationsStore();
  
  const [userRecommendations, setUserRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateForUser = useCallback(async (context?: string, limit?: number) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const recommendations = await generateRecommendations(userId, context, limit);
      setUserRecommendations(recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to generate user recommendations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, generateRecommendations]);
  
  const getPersonalized = useCallback(async (options?: any) => {
    if (!userId) return [];
    
    setIsLoading(true);
    try {
      const recommendations = await getPersonalizedRecommendations(userId, options);
      setUserRecommendations(recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, getPersonalizedRecommendations]);
  
  const getQuick = useCallback(async () => {
    if (!userId) return [];
    
    setIsLoading(true);
    try {
      const recommendations = await quickRecommend(userId);
      setUserRecommendations(recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to get quick recommendations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, quickRecommend]);
  
  const discover = useCallback(async (noveltyFactor?: number) => {
    if (!userId) return [];
    
    setIsLoading(true);
    try {
      const recommendations = await discoverNew(userId, noveltyFactor);
      setUserRecommendations(recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to discover new content:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, discoverNew]);
  
  return {
    recommendations: userRecommendations,
    isLoading,
    generateForUser,
    getPersonalized,
    getQuick,
    discover
  };
};

export const useRecommendationAnalytics = () => {
  const {
    stats,
    getRecommendationStats,
    getAlgorithmPerformance,
    getUserInsights,
    getContentInsights
  } = useIntelligentRecommendationsStore();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const refreshAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [currentStats, algorithmPerf] = await Promise.all([
        getRecommendationStats(),
        getAlgorithmPerformance()
      ]);
      
      setAnalytics({
        stats: currentStats,
        algorithmPerformance: algorithmPerf
      });
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getRecommendationStats, getAlgorithmPerformance]);
  
  const getUserAnalytics = useCallback(async (userId: string) => {
    try {
      return await getUserInsights(userId);
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }, [getUserInsights]);
  
  const getContentAnalytics = useCallback(async (contentId: string) => {
    try {
      return await getContentInsights(contentId);
    } catch (error) {
      console.error('Failed to get content analytics:', error);
      throw error;
    }
  }, [getContentInsights]);
  
  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);
  
  return {
    analytics,
    stats,
    isLoading,
    refreshAnalytics,
    getUserAnalytics,
    getContentAnalytics
  };
};

export const useRecommendationModels = () => {
  const {
    models,
    trainModel,
    updateModel,
    deployModel,
    evaluateModel
  } = useIntelligentRecommendationsStore();
  
  const [isTraining, setIsTraining] = useState(false);
  
  const createModel = useCallback(async (modelType: string, data?: any) => {
    setIsTraining(true);
    try {
      const model = await trainModel(modelType, data);
      return model;
    } catch (error) {
      console.error('Failed to create model:', error);
      throw error;
    } finally {
      setIsTraining(false);
    }
  }, [trainModel]);
  
  const editModel = useCallback(async (modelId: string, updates: Partial<MLModel>) => {
    try {
      await updateModel(modelId, updates);
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  }, [updateModel]);
  
  const activateModel = useCallback(async (modelId: string) => {
    try {
      await deployModel(modelId);
    } catch (error) {
      console.error('Failed to deploy model:', error);
      throw error;
    }
  }, [deployModel]);
  
  const testModel = useCallback(async (modelId: string, testData?: any) => {
    try {
      return await evaluateModel(modelId, testData);
    } catch (error) {
      console.error('Failed to evaluate model:', error);
      throw error;
    }
  }, [evaluateModel]);
  
  return {
    models,
    isTraining,
    createModel,
    editModel,
    activateModel,
    testModel
  };
};

export const useRecommendationFeedback = () => {
  const {
    recordInteraction,
    submitFeedback,
    reportRecommendation
  } = useIntelligentRecommendationsStore();
  
  const recordClick = useCallback(async (
    userId: string,
    recommendationId: string,
    interaction: any
  ) => {
    try {
      await recordInteraction(userId, recommendationId, interaction);
    } catch (error) {
      console.error('Failed to record interaction:', error);
      throw error;
    }
  }, [recordInteraction]);
  
  const provideFeedback = useCallback(async (
    userId: string,
    recommendationId: string,
    feedback: any
  ) => {
    try {
      await submitFeedback(userId, recommendationId, feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }, [submitFeedback]);
  
  const reportIssue = useCallback(async (
    recommendationId: string,
    reason: string
  ) => {
    try {
      await reportRecommendation(recommendationId, reason);
    } catch (error) {
      console.error('Failed to report recommendation:', error);
      throw error;
    }
  }, [reportRecommendation]);
  
  return {
    recordClick,
    provideFeedback,
    reportIssue
  };
};

// Utility hooks
export const useThrottledRecommendations = (delay: number = 1000) => {
  const [throttledValue, setThrottledValue] = useState('');
  const [isThrottling, setIsThrottling] = useState(false);
  
  const throttledFunction = useCallback(
    throttle((value: string) => {
      setThrottledValue(value);
      setIsThrottling(false);
    }, delay),
    [delay]
  );
  
  const setValue = useCallback((value: string) => {
    setIsThrottling(true);
    throttledFunction(value);
  }, [throttledFunction]);
  
  return [throttledValue, setValue, isThrottling] as const;
};

export const useDebouncedRecommendations = (delay: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  const debouncedFunction = useCallback(
    debounce((value: string) => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay),
    [delay]
  );
  
  const setValue = useCallback((value: string) => {
    setIsDebouncing(true);
    debouncedFunction(value);
  }, [debouncedFunction]);
  
  return [debouncedValue, setValue, isDebouncing] as const;
};

export const useRecommendationProcessor = () => {
  const { processRealtimeEvent } = useIntelligentRecommendationsStore();
  const [processingQueue, setProcessingQueue] = useState<any[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const addToQueue = useCallback((event: any) => {
    setProcessingQueue(prev => [...prev, event]);
  }, []);
  
  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0 || isProcessingQueue) return;
    
    setIsProcessingQueue(true);
    try {
      for (const event of processingQueue) {
        await processRealtimeEvent(event);
      }
      setProcessingQueue([]);
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  }, [processingQueue, isProcessingQueue, processRealtimeEvent]);
  
  useEffect(() => {
    if (processingQueue.length > 0) {
      const timer = setTimeout(processQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [processingQueue, processQueue]);
  
  return {
    addToQueue,
    processQueue,
    queueLength: processingQueue.length,
    isProcessingQueue
  };
};

// Helper functions
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
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
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}