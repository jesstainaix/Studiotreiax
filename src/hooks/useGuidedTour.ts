import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useGuidedTourStore,
  GuidedTour,
  TourStep,
  TourTemplate,
  UserProgress,
  TourEvent,
  TourConfig,
  TourStats,
  TourMetrics,
  formatDuration,
  getDifficultyColor,
  getCategoryIcon,
  getProgressColor,
  calculateTourHealth,
  generateTourRecommendations
} from '../services/guidedTourService';

// Utility functions
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

// Progress tracking hook
export const useProgress = (total: number, current: number) => {
  const percentage = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  }, [total, current]);
  
  const remaining = useMemo(() => total - current, [total, current]);
  
  const isComplete = useMemo(() => current >= total, [current, total]);
  
  return { percentage, remaining, isComplete };
};

// Main hook
export const useGuidedTour = () => {
  const store = useGuidedTourStore();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshEnabled) {
      intervalRef.current = setInterval(() => {
        store.refreshStats();
        store.refreshMetrics();
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, store]);
  
  // Initialize on mount
  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, [store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Tour management
    createTour: store.addTour,
    updateTour: store.updateTour,
    deleteTour: store.deleteTour,
    
    // Tour control
    startTour: store.startTour,
    pauseTour: store.pauseTour,
    resumeTour: store.resumeTour,
    stopTour: store.stopTour,
    nextStep: store.nextStep,
    previousStep: store.previousStep,
    goToStep: store.goToStep,
    skipStep: store.skipStep,
    
    // Template management
    createTemplate: store.addTemplate,
    createTourFromTemplate: store.createTourFromTemplate,
    
    // User progress
    updateUserProgress: store.updateUserProgress,
    markTourCompleted: store.markTourCompleted,
    
    // Configuration
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    
    // Analytics
    refreshStats: store.refreshStats,
    refreshMetrics: store.refreshMetrics,
    generateReport: store.generateReport,
    
    // Search and filter
    setSearchQuery: store.setSearchQuery,
    setSelectedCategory: store.setSelectedCategory,
    setSelectedDifficulty: store.setSelectedDifficulty,
    setSortBy: store.setSortBy
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    refreshNow: async () => {
      try {
        store.setLoading(true);
        store.refreshStats();
        store.refreshMetrics();
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      } catch (error) {
        store.setError('Failed to refresh data');
        console.error('Refresh error:', error);
      } finally {
        store.setLoading(false);
      }
    },
    
    startQuickTour: async (category: string) => {
      try {
        const availableTours = store.tours.filter(t => 
          t.category === category && !t.isCompleted
        );
        if (availableTours.length > 0) {
          const tour = availableTours[0];
          store.startTour(tour.id);
        }
      } catch (error) {
        store.setError('Failed to start quick tour');
        console.error('Quick tour error:', error);
      }
    },
    
    createFromTemplate: async (templateId: string) => {
      try {
        store.createTourFromTemplate(templateId);
      } catch (error) {
        store.setError('Failed to create tour from template');
        console.error('Template creation error:', error);
      }
    },
    
    exportTours: async () => {
      try {
        const data = {
          tours: store.tours,
          templates: store.templates,
          stats: store.stats,
          exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guided-tours-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        store.setError('Failed to export tours');
        console.error('Export error:', error);
      }
    },
    
    resetAllProgress: async () => {
      try {
        store.tours.forEach(tour => {
          store.updateTour(tour.id, {
            isActive: false,
            isCompleted: false,
            progress: {
              currentStep: 0,
              completedSteps: [],
              timeSpent: 0
            }
          });
        });
      } catch (error) {
        store.setError('Failed to reset progress');
        console.error('Reset error:', error);
      }
    }
  }), [store]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    updateSearch: throttle(store.setSearchQuery, 300),
    refreshData: throttle(quickActions.refreshNow, 1000)
  }), [store.setSearchQuery, quickActions.refreshNow]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    search: debounce(store.setSearchQuery, 500),
    updateConfig: debounce(store.updateConfig, 1000)
  }), [store.setSearchQuery, store.updateConfig]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const {
      tours,
      templates,
      userProgress,
      events,
      stats,
      metrics,
      searchQuery,
      selectedCategory,
      selectedDifficulty,
      sortBy
    } = store;
    
    // Filter tours
    const filteredTours = tours.filter(tour => {
      const matchesSearch = !searchQuery || 
        tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || tour.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || tour.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
    
    // Sort tours
    filteredTours.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'estimatedTime':
          return a.estimatedTime - b.estimatedTime;
        case 'popularity':
          return b.analytics.views - a.analytics.views;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
    
    // Tour categories with counts
    const tourCategories = tours.reduce((acc, tour) => {
      acc[tour.category] = (acc[tour.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Difficulty distribution
    const difficultyDistribution = tours.reduce((acc, tour) => {
      acc[tour.difficulty] = (acc[tour.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Completion trends
    const completionTrends = {
      daily: events.filter(e => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return e.type === 'complete' && e.timestamp > dayAgo;
      }).length,
      weekly: events.filter(e => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return e.type === 'complete' && e.timestamp > weekAgo;
      }).length,
      monthly: events.filter(e => {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return e.type === 'complete' && e.timestamp > monthAgo;
      }).length
    };
    
    // User engagement metrics
    const userEngagement = {
      activeUsers: new Set(events.filter(e => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return e.timestamp > dayAgo;
      }).map(e => e.userId)).size,
      averageSessionTime: userProgress?.statistics.totalTimeSpent || 0,
      completionRate: stats.averageCompletionRate,
      retentionRate: userProgress ? 
        (userProgress.completedTours.length / Math.max(1, tours.length)) * 100 : 0
    };
    
    // Tour health scores
    const tourHealthScores = tours.map(tour => ({
      tourId: tour.id,
      name: tour.name,
      health: calculateTourHealth(tour),
      issues: tour.analytics.dropoffPoints.length
    }));
    
    // Recommendations
    const recommendations = generateTourRecommendations(tours);
    
    return {
      filteredTours,
      tourCategories,
      difficultyDistribution,
      completionTrends,
      userEngagement,
      tourHealthScores,
      recommendations,
      totalResults: filteredTours.length,
      hasResults: filteredTours.length > 0
    };
  }, [
    store.tours,
    store.templates,
    store.userProgress,
    store.events,
    store.stats,
    store.metrics,
    store.searchQuery,
    store.selectedCategory,
    store.selectedDifficulty,
    store.sortBy
  ]);
  
  // Filtered data
  const filtered = useMemo(() => {
    const { searchQuery, selectedCategory, selectedDifficulty } = store;
    
    const templates = store.templates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    const events = store.events.filter(event => {
      if (!searchQuery) return true;
      
      const tour = store.tours.find(t => t.id === event.tourId);
      return tour?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    return {
      templates,
      events
    };
  }, [
    store.templates,
    store.events,
    store.tours,
    store.searchQuery,
    store.selectedCategory,
    store.selectedDifficulty
  ]);
  
  return {
    // State
    tours: store.tours,
    templates: store.templates,
    userProgress: store.userProgress,
    events: store.events,
    config: store.config,
    stats: store.stats,
    metrics: store.metrics,
    
    // Current tour state
    currentTour: store.currentTour,
    currentStep: store.currentStep,
    isPlaying: store.isPlaying,
    isPaused: store.isPaused,
    showOverlay: store.showOverlay,
    
    // UI state
    isLoading: store.isLoading,
    error: store.error,
    searchQuery: store.searchQuery,
    selectedCategory: store.selectedCategory,
    selectedDifficulty: store.selectedDifficulty,
    sortBy: store.sortBy,
    
    // Auto-refresh state
    autoRefreshEnabled,
    refreshInterval,
    setAutoRefreshEnabled,
    setRefreshInterval,
    
    // Computed values
    computed,
    filtered,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions
  };
};

// Specialized hooks
export const useGuidedTourStats = () => {
  const { stats, metrics, refreshStats, refreshMetrics } = useGuidedTour();
  
  const healthScore = useMemo(() => {
    const { engagement, performance } = metrics;
    return Math.round(
      (engagement.completionRate * 0.4) +
      (performance.userSatisfaction * 20 * 0.3) +
      ((100 - performance.errorRate) * 0.3)
    );
  }, [metrics]);
  
  const trends = useMemo(() => {
    return {
      completion: metrics.engagement.completionRate > 70 ? 'up' : 
                 metrics.engagement.completionRate > 50 ? 'stable' : 'down',
      engagement: metrics.usage.dailyActiveUsers > metrics.usage.weeklyActiveUsers / 7 ? 'up' : 'down',
      satisfaction: metrics.performance.userSatisfaction > 4 ? 'up' : 
                   metrics.performance.userSatisfaction > 3 ? 'stable' : 'down'
    };
  }, [metrics]);
  
  return {
    stats,
    metrics,
    healthScore,
    trends,
    refreshStats,
    refreshMetrics
  };
};

export const useGuidedTourConfig = () => {
  const { config, updateConfig, resetConfig } = useGuidedTour();
  
  const updateTheme = useCallback((theme: Partial<TourConfig['theme']>) => {
    updateConfig({ theme: { ...config.theme, ...theme } });
  }, [config.theme, updateConfig]);
  
  const updateAnimations = useCallback((animations: Partial<TourConfig['animations']>) => {
    updateConfig({ animations: { ...config.animations, ...animations } });
  }, [config.animations, updateConfig]);
  
  const updateAccessibility = useCallback((accessibility: Partial<TourConfig['accessibility']>) => {
    updateConfig({ accessibility: { ...config.accessibility, ...accessibility } });
  }, [config.accessibility, updateConfig]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    updateTheme,
    updateAnimations,
    updateAccessibility
  };
};

export const useGuidedTourSearch = () => {
  const {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    sortBy,
    actions,
    throttledActions,
    debouncedActions,
    computed
  } = useGuidedTour();
  
  const clearFilters = useCallback(() => {
    actions.setSearchQuery('');
    actions.setSelectedCategory('all');
    actions.setSelectedDifficulty('all');
    actions.setSortBy('name');
  }, [actions]);
  
  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || 
           selectedCategory !== 'all' || 
           selectedDifficulty !== 'all' || 
           sortBy !== 'name';
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);
  
  return {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    sortBy,
    setSearchQuery: actions.setSearchQuery,
    setSelectedCategory: actions.setSelectedCategory,
    setSelectedDifficulty: actions.setSelectedDifficulty,
    setSortBy: actions.setSortBy,
    updateSearch: throttledActions.updateSearch,
    debouncedSearch: debouncedActions.search,
    clearFilters,
    hasActiveFilters,
    results: computed.filteredTours,
    totalResults: computed.totalResults,
    hasResults: computed.hasResults
  };
};

export const useCurrentTour = () => {
  const {
    currentTour,
    currentStep,
    isPlaying,
    isPaused,
    showOverlay,
    actions
  } = useGuidedTour();
  
  const progress = useProgress(
    currentTour?.steps.length || 0,
    currentTour?.progress.currentStep || 0
  );
  
  const canGoNext = useMemo(() => {
    if (!currentTour || !currentStep) return false;
    const currentIndex = currentTour.steps.findIndex(s => s.id === currentStep.id);
    return currentIndex < currentTour.steps.length - 1;
  }, [currentTour, currentStep]);
  
  const canGoPrevious = useMemo(() => {
    if (!currentTour || !currentStep) return false;
    const currentIndex = currentTour.steps.findIndex(s => s.id === currentStep.id);
    return currentIndex > 0;
  }, [currentTour, currentStep]);
  
  const stepInfo = useMemo(() => {
    if (!currentTour || !currentStep) return null;
    
    const currentIndex = currentTour.steps.findIndex(s => s.id === currentStep.id);
    return {
      current: currentIndex + 1,
      total: currentTour.steps.length,
      step: currentStep,
      isFirst: currentIndex === 0,
      isLast: currentIndex === currentTour.steps.length - 1
    };
  }, [currentTour, currentStep]);
  
  return {
    currentTour,
    currentStep,
    isPlaying,
    isPaused,
    showOverlay,
    progress,
    canGoNext,
    canGoPrevious,
    stepInfo,
    startTour: actions.startTour,
    pauseTour: actions.pauseTour,
    resumeTour: actions.resumeTour,
    stopTour: actions.stopTour,
    nextStep: actions.nextStep,
    previousStep: actions.previousStep,
    goToStep: actions.goToStep,
    skipStep: actions.skipStep
  };
};

export const useGuidedTourTemplates = () => {
  const { templates, actions, filtered } = useGuidedTour();
  
  const createTour = useCallback((templateId: string) => {
    actions.createTourFromTemplate(templateId);
  }, [actions]);
  
  const popularTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }, [templates]);
  
  const recentTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [templates]);
  
  return {
    templates,
    filteredTemplates: filtered.templates,
    popularTemplates,
    recentTemplates,
    createTemplate: actions.createTemplate,
    createTour
  };
};

export const useGuidedTourAnalytics = () => {
  const { events, computed, actions } = useGuidedTour();
  
  const eventsByType = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [events]);
  
  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [events]);
  
  const userActivity = useMemo(() => {
    const userEvents = events.reduce((acc, event) => {
      if (!acc[event.userId]) {
        acc[event.userId] = [];
      }
      acc[event.userId].push(event);
      return acc;
    }, {} as Record<string, TourEvent[]>);
    
    return Object.entries(userEvents).map(([userId, userEvents]) => ({
      userId,
      eventCount: userEvents.length,
      lastActivity: Math.max(...userEvents.map(e => e.timestamp.getTime())),
      completedTours: userEvents.filter(e => e.type === 'complete').length
    }));
  }, [events]);
  
  return {
    events,
    eventsByType,
    recentEvents,
    userActivity,
    recommendations: computed.recommendations,
    healthScores: computed.tourHealthScores,
    generateReport: actions.generateReport
  };
};

// Utility hooks
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useMemo(() => throttle(callback, delay), [callback, delay]);
};

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useMemo(() => debounce(callback, delay), [callback, delay]);
};

// Helper function for tour complexity calculation
export const calculateTourComplexity = (tour: GuidedTour): number => {
  let complexity = 0;
  
  // Base complexity from step count
  complexity += tour.steps.length * 2;
  
  // Add complexity for interactive steps
  tour.steps.forEach(step => {
    if (step.validation) complexity += 3;
    if (step.conditions) complexity += 2;
    if (step.type === 'modal' || step.type === 'overlay') complexity += 1;
  });
  
  // Add complexity for advanced features
  if (tour.prerequisites && tour.prerequisites.length > 0) complexity += 5;
  if (tour.difficulty === 'advanced') complexity += 10;
  if (tour.difficulty === 'intermediate') complexity += 5;
  
  return Math.min(100, complexity);
};

export default useGuidedTour;