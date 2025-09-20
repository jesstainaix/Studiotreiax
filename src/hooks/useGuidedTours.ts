import { useEffect, useMemo, useCallback, useState } from 'react';
import { 
  useGuidedToursStore, 
  Tour, 
  TourStep, 
  UserProgress, 
  TourFilter, 
  TourStats,
  TourConfig,
  TourAnalytics,
  GuidedToursManager
} from '../services/guidedToursService';

// Throttle and debounce utilities
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Main hook for guided tours
export const useGuidedTours = () => {
  // State from store
  const {
    tours,
    userProgress,
    activeTour,
    currentStep,
    currentStepIndex,
    isPlaying,
    isPaused,
    isCompleted,
    analytics,
    events,
    filter,
    searchQuery,
    selectedTourId,
    isAutoPlayEnabled,
    showOverlay,
    highlightTarget,
    error,
    loading,
    
    // Computed values
    filteredTours,
    availableTours,
    completedTours,
    inProgressTours,
    recommendedTours,
    stats,
    hasActiveTour,
    canGoNext,
    canGoPrevious,
    completionPercentage,
    estimatedTimeRemaining,
    
    // Actions
    setTours,
    addTour,
    updateTour,
    deleteTour,
    setFilter,
    setSearch,
    clearFilters,
    setSelectedTourId,
    setIsAutoPlayEnabled,
    
    // Tour control
    startTour,
    pauseTour,
    resumeTour,
    stopTour,
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    completeTour,
    restartTour,
    
    // Progress management
    updateProgress,
    getProgress,
    resetProgress,
    
    // Analytics
    trackEvent,
    updateAnalytics,
    getAnalytics,
    
    // Quick actions
    handleQuickAction,
    handleBulkAction,
    handleExportTour,
    handleImportTour,
    
    // Advanced features
    handlePersonalization,
    handleAdaptiveTour,
    handleCollaborativeTour,
    handleTourRecommendation,
    
    // System operations
    refreshTours,
    syncProgress,
    validateTour,
    optimizeTour,
    
    // Utilities
    utilities,
    config,
    configHelpers,
    analyticsHelpers,
    debugHelpers
  } = useGuidedToursStore();

  // Local state for UI interactions
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Auto-initialization effect
  useEffect(() => {
    const initializeTours = async () => {
      if (!isInitialized) {
        try {
          const manager = GuidedToursManager.getInstance();
          await manager.initializeTours();
          setIsInitialized(true);
        } catch (error) {
          console.error('Erro ao inicializar tours:', error);
        }
      }
    };

    initializeTours();
  }, [isInitialized]);

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastRefresh > 300000) { // 5 minutes
        refreshTours();
        setLastRefresh(Date.now());
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastRefresh, refreshTours]);

  // Memoized actions with error handling
  const actions = useMemo(() => ({
    // Tour management
    createTour: async (tourData: Partial<Tour>) => {
      try {
        const newTour: Tour = {
          id: `tour_${Date.now()}`,
          name: tourData.name || 'Novo Tour',
          description: tourData.description || '',
          category: tourData.category || 'feature',
          difficulty: tourData.difficulty || 'beginner',
          estimatedTime: tourData.estimatedTime || 5,
          steps: tourData.steps || [],
          tags: tourData.tags || [],
          version: '1.0.0',
          isActive: false,
          isPublished: false,
          targetAudience: tourData.targetAudience || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completionRate: 0,
          averageRating: 0,
          totalCompletions: 0,
          ...tourData
        };
        
        const validation = await validateTour(newTour);
        if (!validation.isValid) {
          throw new Error(`Erro de validação: ${validation.errors.join(', ')}`);
        }
        
        addTour(newTour);
        return newTour;
      } catch (error) {
        console.error('Erro ao criar tour:', error);
        throw error;
      }
    },
    
    editTour: async (tourId: string, updates: Partial<Tour>) => {
      try {
        const existingTour = tours.find(t => t.id === tourId);
        if (!existingTour) {
          throw new Error('Tour não encontrado');
        }
        
        const updatedTour = { ...existingTour, ...updates, updatedAt: Date.now() };
        const validation = await validateTour(updatedTour);
        
        if (!validation.isValid) {
          throw new Error(`Erro de validação: ${validation.errors.join(', ')}`);
        }
        
        updateTour(tourId, { ...updates, updatedAt: Date.now() });
        return updatedTour;
      } catch (error) {
        console.error('Erro ao editar tour:', error);
        throw error;
      }
    },
    
    duplicateTour: async (tourId: string) => {
      try {
        await handleQuickAction('duplicate_tour', { tourId });
      } catch (error) {
        console.error('Erro ao duplicar tour:', error);
        throw error;
      }
    },
    
    archiveTour: async (tourId: string) => {
      try {
        await handleQuickAction('archive_tour', { tourId });
      } catch (error) {
        console.error('Erro ao arquivar tour:', error);
        throw error;
      }
    },
    
    publishTour: async (tourId: string) => {
      try {
        await handleQuickAction('publish_tour', { tourId });
      } catch (error) {
        console.error('Erro ao publicar tour:', error);
        throw error;
      }
    }
  }), [tours, addTour, updateTour, validateTour, handleQuickAction]);

  // Quick actions with throttling
  const quickActions = useMemo(() => ({
    playPause: throttle(() => {
      if (isPlaying) {
        pauseTour();
      } else if (isPaused) {
        resumeTour();
      }
    }, 500),
    
    restart: throttle(() => {
      restartTour();
    }, 1000),
    
    skip: throttle(() => {
      skipStep();
    }, 300),
    
    stop: throttle(() => {
      stopTour();
    }, 500)
  }), [isPlaying, isPaused, pauseTour, resumeTour, restartTour, skipStep, stopTour]);

  // Advanced features
  const advancedFeatures = useMemo(() => ({
    personalizeForUser: async (userId: string, preferences: any) => {
      try {
        await handlePersonalization(userId, preferences);
      } catch (error) {
        console.error('Erro na personalização:', error);
        throw error;
      }
    },
    
    adaptTourBehavior: async (tourId: string, userBehavior: any) => {
      try {
        await handleAdaptiveTour(tourId, userBehavior);
      } catch (error) {
        console.error('Erro na adaptação do tour:', error);
        throw error;
      }
    },
    
    startCollaborativeTour: async (tourId: string, participants: string[]) => {
      try {
        await handleCollaborativeTour(tourId, participants);
      } catch (error) {
        console.error('Erro no tour colaborativo:', error);
        throw error;
      }
    },
    
    getRecommendations: async (userId: string) => {
      try {
        return await handleTourRecommendation(userId);
      } catch (error) {
        console.error('Erro ao obter recomendações:', error);
        throw error;
      }
    }
  }), [handlePersonalization, handleAdaptiveTour, handleCollaborativeTour, handleTourRecommendation]);

  // System operations
  const systemOps = useMemo(() => ({
    refresh: throttle(async () => {
      try {
        await refreshTours();
        setLastRefresh(Date.now());
      } catch (error) {
        console.error('Erro ao atualizar tours:', error);
        throw error;
      }
    }, 2000),
    
    sync: throttle(async () => {
      try {
        await syncProgress();
      } catch (error) {
        console.error('Erro ao sincronizar progresso:', error);
        throw error;
      }
    }, 5000),
    
    optimize: async (tourId: string) => {
      try {
        await optimizeTour(tourId);
      } catch (error) {
        console.error('Erro ao otimizar tour:', error);
        throw error;
      }
    }
  }), [refreshTours, syncProgress, optimizeTour]);

  // Utilities
  const tourUtils = useMemo(() => ({
    ...utilities,
    
    findTourById: (id: string) => tours.find(tour => tour.id === id),
    
    getToursByCategory: (category: string) => 
      tours.filter(tour => tour.category === category),
    
    getToursByDifficulty: (difficulty: string) => 
      tours.filter(tour => tour.difficulty === difficulty),
    
    getPopularTours: (limit = 5) => 
      tours
        .filter(tour => tour.isActive && tour.isPublished)
        .sort((a, b) => b.totalCompletions - a.totalCompletions)
        .slice(0, limit),
    
    getRecentTours: (limit = 5) => 
      tours
        .filter(tour => tour.isActive && tour.isPublished)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit),
    
    searchTours: (query: string) => 
      tours.filter(tour => 
        tour.name.toLowerCase().includes(query.toLowerCase()) ||
        tour.description.toLowerCase().includes(query.toLowerCase()) ||
        tour.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
  }), [tours, utilities]);

  // Configuration helpers
  const configUtils = useMemo(() => ({
    ...configHelpers,
    
    updateConfig: (updates: Partial<TourConfig>) => {
      configHelpers.updateTourConfig(updates);
    },
    
    getConfigValue: <K extends keyof TourConfig>(key: K): TourConfig[K] => {
      return config[key];
    },
    
    isFeatureEnabled: (feature: keyof TourConfig) => {
      return Boolean(config[feature]);
    }
  }), [config, configHelpers]);

  // Analytics helpers
  const analyticsUtils = useMemo(() => ({
    ...analyticsHelpers,
    
    getTourPerformance: (tourId: string) => {
      const tourAnalytics = getAnalytics(tourId);
      if (!tourAnalytics) return null;
      
      return {
        completionRate: (tourAnalytics.totalCompletions / tourAnalytics.totalStarts) * 100,
        averageRating: tourAnalytics.userFeedback.reduce((acc, f) => acc + f.rating, 0) / tourAnalytics.userFeedback.length,
        averageTime: tourAnalytics.averageCompletionTime,
        dropOffRate: tourAnalytics.dropOffPoints.reduce((acc, p) => acc + p.dropOffRate, 0) / tourAnalytics.dropOffPoints.length
      };
    },
    
    getTopPerformingTours: (limit = 5) => {
      return Array.from(analytics.entries())
        .map(([tourId, data]) => ({
          tourId,
          completionRate: (data.totalCompletions / data.totalStarts) * 100,
          averageRating: data.userFeedback.reduce((acc, f) => acc + f.rating, 0) / data.userFeedback.length
        }))
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit);
    }
  }), [analytics, analyticsHelpers, getAnalytics]);

  // Debug helpers
  const debugUtils = useMemo(() => ({
    ...debugHelpers,
    
    getCurrentState: () => ({
      activeTour: activeTour?.name,
      currentStep: currentStep?.title,
      stepIndex: currentStepIndex,
      isPlaying,
      isPaused,
      progress: completionPercentage,
      timeRemaining: estimatedTimeRemaining
    }),
    
    getStoreStats: () => ({
      totalTours: tours.length,
      activeTours: tours.filter(t => t.isActive).length,
      publishedTours: tours.filter(t => t.isPublished).length,
      totalProgress: userProgress.size,
      totalEvents: events.length,
      analyticsEntries: analytics.size
    })
  }), [debugHelpers, activeTour, currentStep, currentStepIndex, isPlaying, isPaused, 
       completionPercentage, estimatedTimeRemaining, tours, userProgress, events, analytics]);

  // Computed values with memoization
  const computedValues = useMemo(() => ({
    // Tour statistics
    tourStats: stats,
    
    // Current tour info
    currentTourInfo: activeTour ? {
      name: activeTour.name,
      progress: completionPercentage,
      timeRemaining: estimatedTimeRemaining,
      currentStepTitle: currentStep?.title,
      totalSteps: activeTour.steps.length,
      canSkip: currentStep?.skippable || false
    } : null,
    
    // Filter results
    filterResults: {
      total: filteredTours.length,
      available: availableTours.length,
      completed: completedTours.length,
      inProgress: inProgressTours.length
    },
    
    // Navigation state
    navigationState: {
      hasActiveTour,
      canGoNext,
      canGoPrevious,
      isFirstStep: currentStepIndex === 0,
      isLastStep: activeTour ? currentStepIndex === activeTour.steps.length - 1 : false
    }
  }), [stats, activeTour, completionPercentage, estimatedTimeRemaining, currentStep, 
       currentStepIndex, filteredTours, availableTours, completedTours, inProgressTours,
       hasActiveTour, canGoNext, canGoPrevious]);

  return {
    // State
    tours,
    userProgress,
    activeTour,
    currentStep,
    currentStepIndex,
    isPlaying,
    isPaused,
    isCompleted,
    analytics,
    events,
    filter,
    searchQuery,
    selectedTourId,
    isAutoPlayEnabled,
    showOverlay,
    highlightTarget,
    error,
    loading,
    isInitialized,
    
    // Computed values
    filteredTours,
    availableTours,
    completedTours,
    inProgressTours,
    recommendedTours,
    computedValues,
    
    // Actions
    setTours,
    setFilter,
    setSearch,
    clearFilters,
    setSelectedTourId,
    setIsAutoPlayEnabled,
    actions,
    
    // Tour control
    startTour,
    pauseTour,
    resumeTour,
    stopTour,
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    completeTour,
    restartTour,
    quickActions,
    
    // Progress management
    updateProgress,
    getProgress,
    resetProgress,
    
    // Analytics
    trackEvent,
    updateAnalytics,
    getAnalytics,
    
    // Advanced features
    advancedFeatures,
    
    // System operations
    systemOps,
    
    // Utilities
    tourUtils,
    configUtils,
    analyticsUtils,
    debugUtils,
    
    // Configuration
    config
  };
};

// Specialized hooks
export const useGuidedToursStats = () => {
  const { stats, tours, userProgress, analytics } = useGuidedToursStore();
  
  return useMemo(() => ({
    ...stats,
    
    // Additional computed stats
    engagementRate: stats.totalTours > 0 ? (stats.completedTours / stats.totalTours) * 100 : 0,
    
    averageTimePerTour: stats.totalTimeSpent / Math.max(stats.completedTours, 1),
    
    categoryDistribution: tours.reduce((acc, tour) => {
      acc[tour.category] = (acc[tour.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    difficultyDistribution: tours.reduce((acc, tour) => {
      acc[tour.difficulty] = (acc[tour.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    monthlyProgress: Array.from(userProgress.values())
      .filter(p => p.completedAt)
      .reduce((acc, progress) => {
        const month = new Date(progress.completedAt!).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  }), [stats, tours, userProgress, analytics]);
};

export const useGuidedToursConfig = () => {
  const { config, configHelpers } = useGuidedToursStore();
  
  return {
    config,
    ...configHelpers,
    
    // Additional config utilities
    toggleFeature: (feature: keyof TourConfig) => {
      if (typeof config[feature] === 'boolean') {
        configHelpers.updateTourConfig({ [feature]: !config[feature] });
      }
    },
    
    setTheme: (theme: 'light' | 'dark' | 'auto') => {
      configHelpers.updateTourConfig({ theme });
    },
    
    setLanguage: (language: string) => {
      configHelpers.updateTourConfig({ language });
    }
  };
};

export const useGuidedToursAnalytics = () => {
  const { analytics, analyticsHelpers, events } = useGuidedToursStore();
  
  const recentEvents = useMemo(() => 
    events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10),
    [events]
  );
  
  const eventsByType = useMemo(() => 
    events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    [events]
  );
  
  return {
    analytics,
    events,
    recentEvents,
    eventsByType,
    ...analyticsHelpers
  };
};

export const useGuidedToursRealtime = () => {
  const { 
    activeTour, 
    currentStep, 
    isPlaying, 
    isPaused, 
    completionPercentage,
    estimatedTimeRemaining,
    trackEvent 
  } = useGuidedToursStore();
  
  const [sessionStartTime] = useState(Date.now());
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  
  // Track step timing
  useEffect(() => {
    if (currentStep) {
      setStepStartTime(Date.now());
    }
  }, [currentStep]);
  
  // Track session duration
  const sessionDuration = useMemo(() => 
    Date.now() - sessionStartTime,
    [sessionStartTime]
  );
  
  const stepDuration = useMemo(() => 
    Date.now() - stepStartTime,
    [stepStartTime]
  );
  
  return {
    activeTour,
    currentStep,
    isPlaying,
    isPaused,
    completionPercentage,
    estimatedTimeRemaining,
    sessionDuration,
    stepDuration,
    trackEvent
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

export const useProgressTracking = (tourId: string, userId: string) => {
  const { getProgress, updateProgress } = useGuidedToursStore();
  
  const progress = useMemo(() => 
    getProgress(userId, tourId),
    [getProgress, userId, tourId]
  );
  
  const updateProgressThrottled = useThrottledCallback(
    (updates: Partial<UserProgress>) => {
      updateProgress(userId, tourId, updates);
    },
    1000
  );
  
  return {
    progress,
    updateProgress: updateProgressThrottled
  };
};