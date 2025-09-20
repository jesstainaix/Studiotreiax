import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRecommendationStore, type Recommendation, type ContentItem, type UserProfile, type RecommendationAlgorithm } from '../services/aiRecommendationService';

// Hook principal
export function useAIRecommendation() {
  const store = useRecommendationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-inicialização
  useEffect(() => {
    if (!store.isInitialized) {
      store.actions.initialize();
    }
  }, [store.isInitialized]);
  
  // Auto-refresh
  useEffect(() => {
    if (!store.config.enableRealTime) return;
    
    const interval = setInterval(() => {
      if (store.userProfiles.length > 0) {
        store.actions.refreshCache();
      }
    }, store.config.refreshInterval);
    
    return () => clearInterval(interval);
  }, [store.config.enableRealTime, store.config.refreshInterval, store.userProfiles.length]);
  
  // Ações memoizadas
  const actions = useMemo(() => ({
    // Recomendações
    generateRecommendations: async (userId: string, context?: any) => {
      setIsLoading(true);
      setError(null);
      try {
        const recommendations = await store.actions.generateRecommendations(userId, context);
        return recommendations;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar recomendações';
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    
    getRecommendations: (userId: string, limit?: number) => {
      return store.actions.getRecommendations(userId, limit);
    },
    
    updateRecommendationStatus: (recommendationId: string, status: Recommendation['status']) => {
      store.actions.updateRecommendationStatus(recommendationId, status);
    },
    
    dismissRecommendation: (recommendationId: string) => {
      store.actions.dismissRecommendation(recommendationId);
    },
    
    // Conteúdo
    addContentItem: (item: ContentItem) => {
      store.actions.addContentItem(item);
    },
    
    updateContentItem: (itemId: string, updates: Partial<ContentItem>) => {
      store.actions.updateContentItem(itemId, updates);
    },
    
    removeContentItem: (itemId: string) => {
      store.actions.removeContentItem(itemId);
    },
    
    searchContent: (query: string, filters?: any) => {
      return store.actions.searchContent(query, filters);
    },
    
    // Perfil do usuário
    createUserProfile: (userId: string, profile: Partial<UserProfile>) => {
      store.actions.createUserProfile(userId, profile);
    },
    
    updateUserProfile: (userId: string, updates: Partial<UserProfile>) => {
      store.actions.updateUserProfile(userId, updates);
    },
    
    trackUserInteraction: (userId: string, interaction: UserProfile['behavior']['interactionHistory'][0]) => {
      store.actions.trackUserInteraction(userId, interaction);
    },
    
    // Algoritmos
    addAlgorithm: (algorithm: RecommendationAlgorithm) => {
      store.actions.addAlgorithm(algorithm);
    },
    
    updateAlgorithm: (algorithmId: string, updates: Partial<RecommendationAlgorithm>) => {
      store.actions.updateAlgorithm(algorithmId, updates);
    },
    
    toggleAlgorithm: (algorithmId: string, enabled: boolean) => {
      store.actions.toggleAlgorithm(algorithmId, enabled);
    },
    
    trainAlgorithm: async (algorithmId: string) => {
      setIsLoading(true);
      try {
        await store.actions.trainAlgorithm(algorithmId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao treinar algoritmo');
      } finally {
        setIsLoading(false);
      }
    },
    
    // Configuração
    updateConfig: (updates: Partial<typeof store.config>) => {
      store.actions.updateConfig(updates);
    },
    
    resetConfig: () => {
      store.actions.resetConfig();
    },
    
    // Feedback
    submitFeedback: (userId: string, itemId: string, rating: number, comment?: string) => {
      store.actions.submitFeedback(userId, itemId, rating, comment);
    },
    
    // Cache
    clearCache: () => {
      store.actions.clearCache();
    },
    
    refreshCache: async () => {
      setIsLoading(true);
      try {
        await store.actions.refreshCache();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar cache');
      } finally {
        setIsLoading(false);
      }
    }
  }), [store]);
  
  // Ações rápidas
  const quickActions = useMemo(() => ({
    getPersonalizedRecommendations: async (userId: string) => {
      setIsLoading(true);
      try {
        return await store.quickActions.getPersonalizedRecommendations(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao obter recomendações personalizadas');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    
    getTrendingContent: (category?: string) => {
      return store.quickActions.getTrendingContent(category);
    },
    
    getSimilarContent: (itemId: string, limit?: number) => {
      return store.quickActions.getSimilarContent(itemId, limit);
    },
    
    getPopularContent: (timeframe?: 'day' | 'week' | 'month') => {
      return store.quickActions.getPopularContent(timeframe);
    },
    
    refreshUserRecommendations: async (userId: string) => {
      setIsLoading(true);
      try {
        return await store.quickActions.refreshUserRecommendations(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar recomendações do usuário');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    
    optimizeAlgorithms: async () => {
      setIsLoading(true);
      try {
        await store.quickActions.optimizeAlgorithms();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao otimizar algoritmos');
      } finally {
        setIsLoading(false);
      }
    }
  }), [store]);
  
  // Recursos avançados
  const advanced = useMemo(() => ({
    abTest: store.advanced.abTest,
    analytics: store.advanced.analytics,
    ml: store.advanced.ml
  }), [store.advanced]);
  
  // Operações do sistema
  const system = useMemo(() => ({
    health: store.system.health,
    performance: store.system.performance,
    monitoring: store.system.monitoring
  }), [store.system]);
  
  // Utilitários
  const utils = useMemo(() => store.utils, [store.utils]);
  
  // Helpers
  const configHelpers = useMemo(() => store.configHelpers, [store.configHelpers]);
  const analyticsHelpers = useMemo(() => store.analyticsHelpers, [store.analyticsHelpers]);
  const debugHelpers = useMemo(() => store.debugHelpers, [store.debugHelpers]);
  
  // Valores computados
  const computed = useMemo(() => store.computed, [store.computed]);
  
  return {
    // Estado
    recommendations: store.recommendations,
    contentItems: store.contentItems,
    userProfiles: store.userProfiles,
    algorithms: store.algorithms,
    config: store.config,
    stats: store.stats,
    events: store.events,
    debugLogs: store.debugLogs,
    
    // Estado do sistema
    isInitialized: store.isInitialized,
    isProcessing: store.isProcessing || isLoading,
    isTraining: store.isTraining,
    error: store.error || error,
    lastUpdate: store.lastUpdate,
    
    // Valores computados
    computed,
    
    // Ações
    actions,
    quickActions,
    advanced,
    system,
    utils,
    configHelpers,
    analyticsHelpers,
    debugHelpers,
    
    // Métodos de conveniência
    clearError: () => setError(null)
  };
}

// Hook especializado para estatísticas
export function useRecommendationStats() {
  const { stats, computed, analyticsHelpers } = useAIRecommendation();
  
  const enhancedStats = useMemo(() => ({
    ...stats,
    systemHealth: computed.systemHealth,
    performance: computed.performance,
    topAlgorithms: analyticsHelpers.getTopPerformingAlgorithms()
  }), [stats, computed, analyticsHelpers]);
  
  return enhancedStats;
}

// Hook especializado para configuração
export function useRecommendationConfig() {
  const { config, actions, configHelpers } = useAIRecommendation();
  
  const configActions = useMemo(() => ({
    update: actions.updateConfig,
    reset: actions.resetConfig,
    getAlgorithmConfig: configHelpers.getAlgorithmConfig,
    updateAlgorithmWeight: configHelpers.updateAlgorithmWeight,
    getOptimalConfig: configHelpers.getOptimalConfig,
    validateConfig: configHelpers.validateConfig
  }), [actions, configHelpers]);
  
  return {
    config,
    actions: configActions
  };
}

// Hook especializado para algoritmos
export function useRecommendationAlgorithms() {
  const { algorithms, actions, computed } = useAIRecommendation();
  
  const algorithmActions = useMemo(() => ({
    add: actions.addAlgorithm,
    update: actions.updateAlgorithm,
    toggle: actions.toggleAlgorithm,
    train: actions.trainAlgorithm
  }), [actions]);
  
  return {
    algorithms,
    activeAlgorithms: computed.activeAlgorithms,
    actions: algorithmActions
  };
}

// Hook especializado para usuários
export function useRecommendationUsers() {
  const { userProfiles, actions, analyticsHelpers } = useAIRecommendation();
  
  const userActions = useMemo(() => ({
    create: actions.createUserProfile,
    update: actions.updateUserProfile,
    trackInteraction: actions.trackUserInteraction,
    submitFeedback: actions.submitFeedback
  }), [actions]);
  
  const getUserMetrics = useCallback((userId: string) => {
    return analyticsHelpers.getUserEngagementMetrics(userId);
  }, [analyticsHelpers]);
  
  return {
    userProfiles,
    actions: userActions,
    getUserMetrics
  };
}

// Hook para recomendações de um usuário específico
export function useUserRecommendations(userId: string) {
  const { recommendations, actions, quickActions } = useAIRecommendation();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const userRecommendations = useMemo(() => {
    return recommendations.filter(r => r.userId === userId && r.status === 'pending')
      .sort((a, b) => b.score - a.score);
  }, [recommendations, userId]);
  
  const generateRecommendations = useCallback(async (context?: any) => {
    setIsGenerating(true);
    try {
      return await actions.generateRecommendations(userId, context);
    } finally {
      setIsGenerating(false);
    }
  }, [actions, userId]);
  
  const refreshRecommendations = useCallback(async () => {
    setIsGenerating(true);
    try {
      return await quickActions.refreshUserRecommendations(userId);
    } finally {
      setIsGenerating(false);
    }
  }, [quickActions, userId]);
  
  const markAsShown = useCallback((recommendationId: string) => {
    actions.updateRecommendationStatus(recommendationId, 'shown');
  }, [actions]);
  
  const markAsClicked = useCallback((recommendationId: string) => {
    actions.updateRecommendationStatus(recommendationId, 'clicked');
  }, [actions]);
  
  const dismiss = useCallback((recommendationId: string) => {
    actions.dismissRecommendation(recommendationId);
  }, [actions]);
  
  return {
    recommendations: userRecommendations,
    isGenerating,
    generateRecommendations,
    refreshRecommendations,
    markAsShown,
    markAsClicked,
    dismiss
  };
}

// Hook para conteúdo
export function useRecommendationContent() {
  const { contentItems, actions, quickActions, utils } = useAIRecommendation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  
  const filteredContent = useMemo(() => {
    let content = contentItems;
    
    if (searchQuery) {
      content = actions.searchContent(searchQuery, filters);
    }
    
    if (filters.category) {
      content = utils.filter.byCategory(content, filters.category);
    }
    
    if (filters.type) {
      content = utils.filter.byType(content, filters.type);
    }
    
    if (filters.minRating) {
      content = utils.filter.byRating(content, filters.minRating);
    }
    
    return content;
  }, [contentItems, searchQuery, filters, actions, utils]);
  
  const contentActions = useMemo(() => ({
    add: actions.addContentItem,
    update: actions.updateContentItem,
    remove: actions.removeContentItem,
    search: actions.searchContent,
    getTrending: quickActions.getTrendingContent,
    getSimilar: quickActions.getSimilarContent,
    getPopular: quickActions.getPopularContent
  }), [actions, quickActions]);
  
  return {
    contentItems: filteredContent,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    actions: contentActions
  };
}

// Hook utilitário para throttling
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return throttledValue;
}

// Hook utilitário para debouncing
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Hook para processamento em lote
export function useBatchRecommendations() {
  const { actions } = useAIRecommendation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  
  const addToQueue = useCallback((userId: string) => {
    setQueue(prev => [...prev, userId]);
  }, []);
  
  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const promises = queue.map(userId => actions.generateRecommendations(userId));
      await Promise.all(promises);
      setQueue([]);
    } finally {
      setIsProcessing(false);
    }
  }, [queue, isProcessing, actions]);
  
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);
  
  return {
    queue,
    isProcessing,
    addToQueue,
    processQueue,
    clearQueue
  };
}

// Hook para monitoramento de performance
export function useRecommendationPerformance() {
  const { system, computed, stats } = useAIRecommendation();
  const [metrics, setMetrics] = useState<any>({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        ...system.performance,
        systemHealth: computed.systemHealth,
        averageResponseTime: computed.performance.averageResponseTime,
        recommendationAccuracy: computed.performance.recommendationAccuracy,
        userSatisfaction: computed.performance.userSatisfaction,
        systemLoad: computed.performance.systemLoad,
        cacheHitRate: stats.systemMetrics.cacheHitRate,
        errorRate: stats.systemMetrics.errorRate
      });
    }, 5000); // Atualizar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [system, computed, stats]);
  
  return metrics;
}

// Funções auxiliares
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
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
}

function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export { throttle, debounce };