import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useSentimentAnalysisStore, 
  TextAnalysis, 
  AnalysisFilter, 
  AnalysisConfig,
  AnalysisStats,
  AnalysisMetrics,
  SentimentScore,
  EmotionScore
} from '../services/sentimentAnalysisService';

// Utility functions
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
export const useAnalysisProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  
  const startProgress = useCallback((steps: string[], totalTime: number = 0) => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep(steps[0] || '');
    setEstimatedTime(totalTime);
  }, []);
  
  const updateProgress = useCallback((step: number, stepName?: string) => {
    setProgress(step);
    if (stepName) setCurrentStep(stepName);
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(100);
    setIsProcessing(false);
    setCurrentStep('Completed');
    setTimeout(() => {
      setProgress(0);
      setCurrentStep('');
      setEstimatedTime(0);
    }, 1000);
  }, []);
  
  return {
    progress,
    isProcessing,
    currentStep,
    estimatedTime,
    startProgress,
    updateProgress,
    completeProgress
  };
};

// Main hook
export const useSentimentAnalysis = () => {
  const store = useSentimentAnalysisStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      store.refreshStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, store]);
  
  // Initialize on mount
  useEffect(() => {
    store.refreshStats();
  }, [store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    analyzeText: store.analyzeText,
    analyzeBatch: store.analyzeBatch,
    deleteAnalysis: store.deleteAnalysis,
    updateAnalysis: store.updateAnalysis,
    setFilter: store.setFilter,
    setSearchQuery: store.setSearchQuery,
    setSortBy: store.setSortBy,
    setSortOrder: store.setSortOrder,
    setSelectedTimeRange: store.setSelectedTimeRange,
    startRealTimeAnalysis: store.startRealTimeAnalysis,
    stopRealTimeAnalysis: store.stopRealTimeAnalysis,
    addToQueue: store.addToQueue,
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    exportConfig: store.exportConfig,
    importConfig: store.importConfig,
    generateReport: store.generateReport,
    exportAnalyses: store.exportAnalyses,
    refresh: store.refresh,
    reset: store.reset,
    cleanup: store.cleanup
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickAnalyze: async (text: string) => {
      try {
        return await actions.analyzeText(text, { source: 'quick' });
      } catch (error) {
        console.error('Quick analysis failed:', error);
        throw error;
      }
    },
    
    quickDelete: async (id: string) => {
      try {
        await actions.deleteAnalysis(id);
      } catch (error) {
        console.error('Quick delete failed:', error);
        throw error;
      }
    },
    
    quickExport: async (format: 'json' | 'csv') => {
      try {
        return await actions.exportAnalyses(format);
      } catch (error) {
        console.error('Quick export failed:', error);
        throw error;
      }
    },
    
    quickFilter: (sentiment: 'positive' | 'negative' | 'neutral' | 'all') => {
      let sentimentRange: { min: number; max: number };
      
      switch (sentiment) {
        case 'positive':
          sentimentRange = { min: 0.1, max: 1 };
          break;
        case 'negative':
          sentimentRange = { min: -1, max: -0.1 };
          break;
        case 'neutral':
          sentimentRange = { min: -0.1, max: 0.1 };
          break;
        default:
          sentimentRange = { min: -1, max: 1 };
      }
      
      actions.setFilter({ sentimentRange });
    }
  }), [actions]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    throttledSearch: throttle(actions.setSearchQuery, 300),
    throttledRefresh: throttle(actions.refresh, 1000)
  }), [actions]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    debouncedSearch: debounce(actions.setSearchQuery, 500),
    debouncedFilter: debounce(actions.setFilter, 300)
  }), [actions]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const { analyses, filteredAnalyses, stats } = store;
    
    return {
      // Analysis metrics
      totalAnalyses: analyses.length,
      filteredCount: filteredAnalyses.length,
      averageConfidence: analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length 
        : 0,
      
      // Sentiment insights
      sentimentTrend: stats.sentimentTrend,
      dominantEmotion: stats.topEmotions[0]?.emotion || 'neutral',
      sentimentHealth: stats.systemHealth,
      
      // Performance metrics
      processingSpeed: stats.processingSpeed,
      accuracy: stats.accuracy,
      
      // Data quality
      highConfidenceCount: filteredAnalyses.filter(a => a.confidence > 0.8).length,
      lowConfidenceCount: filteredAnalyses.filter(a => a.confidence < 0.6).length,
      
      // Language diversity
      languageCount: new Set(analyses.map(a => a.language)).size,
      
      // Recent activity
      recentActivity: analyses.filter(a => 
        a.timestamp >= new Date(Date.now() - 60 * 60 * 1000)
      ).length,
      
      // Toxicity insights
      toxicityRate: analyses.length > 0 
        ? analyses.filter(a => a.toxicity.score > 0.7).length / analyses.length 
        : 0
    };
  }, [store]);
  
  // Filtered data with enhanced filtering
  const filteredData = useMemo(() => {
    const { filteredAnalyses, searchQuery } = store;
    
    // Additional client-side filtering for complex queries
    let enhanced = filteredAnalyses;
    
    // Advanced search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      enhanced = enhanced.filter(analysis => {
        return (
          analysis.text.toLowerCase().includes(query) ||
          analysis.keywords.some(k => k.toLowerCase().includes(query)) ||
          analysis.entities.some(e => e.text.toLowerCase().includes(query)) ||
          analysis.topics.some(t => t.name.toLowerCase().includes(query))
        );
      });
    }
    
    return enhanced;
  }, [store]);
  
  return {
    // State
    ...store,
    filteredData,
    computed,
    autoRefresh,
    refreshInterval,
    
    // Actions
    ...actions,
    ...quickActions,
    ...throttledActions,
    ...debouncedActions,
    
    // Settings
    setAutoRefresh,
    setRefreshInterval
  };
};

// Specialized hooks
export const useSentimentStats = () => {
  const { stats, computed, refreshStats } = useSentimentAnalysis();
  
  return {
    stats,
    computed,
    refreshStats,
    
    // Derived stats
    isHealthy: computed.sentimentHealth > 70,
    isPerformant: computed.processingSpeed > 10,
    isAccurate: computed.accuracy > 80,
    hasRecentActivity: computed.recentActivity > 0
  };
};

export const useSentimentConfig = () => {
  const { config, updateConfig, resetConfig, exportConfig, importConfig } = useSentimentAnalysis();
  
  const updateRealTimeConfig = useCallback((updates: Partial<typeof config.realTime>) => {
    updateConfig({ realTime: { ...config.realTime, ...updates } });
  }, [config.realTime, updateConfig]);
  
  const updateModelConfig = useCallback((updates: Partial<typeof config.models>) => {
    updateConfig({ models: { ...config.models, ...updates } });
  }, [config.models, updateConfig]);
  
  const updateThresholds = useCallback((updates: Partial<typeof config.thresholds>) => {
    updateConfig({ thresholds: { ...config.thresholds, ...updates } });
  }, [config.thresholds, updateConfig]);
  
  const updateAlerts = useCallback((updates: Partial<typeof config.alerts>) => {
    updateConfig({ alerts: { ...config.alerts, ...updates } });
  }, [config.alerts, updateConfig]);
  
  const updatePrivacy = useCallback((updates: Partial<typeof config.privacy>) => {
    updateConfig({ privacy: { ...config.privacy, ...updates } });
  }, [config.privacy, updateConfig]);
  
  return {
    config,
    updateConfig,
    updateRealTimeConfig,
    updateModelConfig,
    updateThresholds,
    updateAlerts,
    updatePrivacy,
    resetConfig,
    exportConfig,
    importConfig
  };
};

export const useSentimentSearch = () => {
  const { 
    searchQuery, 
    filter, 
    sortBy, 
    sortOrder, 
    selectedTimeRange,
    setSearchQuery,
    setFilter,
    setSortBy,
    setSortOrder,
    setSelectedTimeRange,
    debouncedSearch,
    debouncedFilter,
    quickFilter
  } = useSentimentAnalysis();
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilter({
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      sentimentRange: { min: -1, max: 1 },
      emotions: [],
      sources: [],
      languages: [],
      keywords: [],
      minConfidence: 0
    });
    setSelectedTimeRange('7d');
  }, [setSearchQuery, setFilter, setSelectedTimeRange]);
  
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      filter.sentimentRange.min !== -1 ||
      filter.sentimentRange.max !== 1 ||
      filter.emotions.length > 0 ||
      filter.sources.length > 0 ||
      filter.languages.length > 0 ||
      filter.keywords.length > 0 ||
      filter.minConfidence > 0
    );
  }, [searchQuery, filter]);
  
  return {
    searchQuery,
    filter,
    sortBy,
    sortOrder,
    selectedTimeRange,
    hasActiveFilters,
    setSearchQuery,
    setFilter,
    setSortBy,
    setSortOrder,
    setSelectedTimeRange,
    debouncedSearch,
    debouncedFilter,
    quickFilter,
    clearFilters
  };
};

export const useCurrentAnalysis = () => {
  const { selectedAnalysis, analyses, getAnalysis } = useSentimentAnalysis();
  
  const currentAnalysis = useMemo(() => {
    return selectedAnalysis ? getAnalysis(selectedAnalysis) : null;
  }, [selectedAnalysis, getAnalysis]);
  
  const relatedAnalyses = useMemo(() => {
    if (!currentAnalysis) return [];
    
    return analyses
      .filter(a => a.id !== currentAnalysis.id)
      .filter(a => {
        // Find analyses with similar keywords or sentiment
        const hasCommonKeywords = a.keywords.some(k => 
          currentAnalysis.keywords.includes(k)
        );
        const similarSentiment = Math.abs(
          a.sentiment.compound - currentAnalysis.sentiment.compound
        ) < 0.3;
        
        return hasCommonKeywords || similarSentiment;
      })
      .slice(0, 5);
  }, [currentAnalysis, analyses]);
  
  return {
    currentAnalysis,
    relatedAnalyses,
    hasSelection: !!selectedAnalysis
  };
};

export const useSentimentRealTime = () => {
  const { 
    isRealTimeEnabled,
    processingQueue,
    batchProgress,
    startRealTimeAnalysis,
    stopRealTimeAnalysis,
    addToQueue,
    processQueue
  } = useSentimentAnalysis();
  
  const queueStats = useMemo(() => ({
    queueLength: processingQueue.length,
    isProcessing: batchProgress > 0,
    progress: batchProgress
  }), [processingQueue.length, batchProgress]);
  
  return {
    isRealTimeEnabled,
    queueStats,
    startRealTimeAnalysis,
    stopRealTimeAnalysis,
    addToQueue,
    processQueue
  };
};

export const useSentimentAnalytics = () => {
  const { 
    sentimentDistribution,
    emotionDistribution,
    topKeywords,
    languageStats,
    trends,
    stats,
    metrics
  } = useSentimentAnalysis();
  
  const chartData = useMemo(() => ({
    sentimentChart: sentimentDistribution.map(item => ({
      name: item.label,
      value: item.value,
      color: item.label === 'Positive' ? '#10b981' : 
             item.label === 'Negative' ? '#ef4444' : '#6b7280'
    })),
    
    emotionChart: emotionDistribution.slice(0, 8).map(item => ({
      name: item.emotion,
      value: item.score * 100,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    })),
    
    keywordChart: topKeywords.slice(0, 10).map(item => ({
      name: item.keyword,
      value: item.frequency
    })),
    
    languageChart: languageStats.map(item => ({
      name: item.language,
      value: item.percentage
    })),
    
    trendChart: trends.map(trend => ({
      timestamp: trend.timestamp.toISOString(),
      sentiment: trend.sentiment.compound,
      volume: trend.volume
    }))
  }), [sentimentDistribution, emotionDistribution, topKeywords, languageStats, trends]);
  
  return {
    chartData,
    stats,
    metrics,
    
    // Insights
    insights: {
      dominantSentiment: sentimentDistribution.reduce((prev, current) => 
        prev.value > current.value ? prev : current
      )?.label || 'Neutral',
      
      topEmotion: emotionDistribution[0]?.emotion || 'neutral',
      
      mostUsedLanguage: languageStats[0]?.language || 'unknown',
      
      trendDirection: stats.sentimentTrend
    }
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

// Helper function for analysis complexity calculation
export const calculateAnalysisComplexity = (analysis: TextAnalysis): number => {
  let complexity = 0;
  
  // Text length factor
  complexity += Math.min(analysis.text.length / 1000, 1) * 20;
  
  // Entity count factor
  complexity += Math.min(analysis.entities.length / 10, 1) * 15;
  
  // Keyword diversity factor
  complexity += Math.min(analysis.keywords.length / 20, 1) * 15;
  
  // Topic relevance factor
  complexity += Math.min(analysis.topics.length / 5, 1) * 10;
  
  // Language complexity (non-English adds complexity)
  if (analysis.language !== 'en') complexity += 10;
  
  // Confidence factor (lower confidence = higher complexity)
  complexity += (1 - analysis.confidence) * 20;
  
  // Emotion diversity factor
  const emotionCount = Object.values(analysis.emotions).filter(score => score > 0.3).length;
  complexity += Math.min(emotionCount / 8, 1) * 10;
  
  return Math.min(complexity, 100);
};