import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'template' | 'effect';
  category: string;
  tags: string[];
  metadata: {
    duration?: number;
    resolution?: string;
    format?: string;
    size?: number;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    language?: string;
    author?: string;
    createdAt: number;
    updatedAt: number;
  };
  analytics: {
    views: number;
    downloads: number;
    likes: number;
    shares: number;
    rating: number;
    engagement: number;
  };
  features: string[];
  thumbnail?: string;
  preview?: string;
  url: string;
}

export interface UserProfile {
  id: string;
  preferences: {
    categories: string[];
    contentTypes: string[];
    qualityPreference: 'low' | 'medium' | 'high' | 'ultra';
    languagePreference: string;
    themes: string[];
    styles: string[];
  };
  behavior: {
    viewHistory: string[];
    downloadHistory: string[];
    searchHistory: string[];
    interactionHistory: {
      itemId: string;
      action: 'view' | 'download' | 'like' | 'share' | 'skip';
      timestamp: number;
      duration?: number;
    }[];
    sessionTime: number;
    activeHours: number[];
  };
  demographics: {
    age?: number;
    location?: string;
    profession?: string;
    experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  goals: string[];
  feedback: {
    itemId: string;
    rating: number;
    comment?: string;
    timestamp: number;
  }[];
}

export interface Recommendation {
  id: string;
  itemId: string;
  userId: string;
  score: number;
  confidence: number;
  reasons: string[];
  algorithm: string;
  context: {
    currentProject?: string;
    currentTask?: string;
    timeOfDay: number;
    sessionDuration: number;
    recentActivity: string[];
  };
  metadata: {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    freshness: number;
    diversity: number;
    novelty: number;
  };
  timestamp: number;
  expiresAt: number;
  status: 'pending' | 'shown' | 'clicked' | 'dismissed' | 'expired';
}

export interface RecommendationAlgorithm {
  id: string;
  name: string;
  type: 'collaborative' | 'content_based' | 'hybrid' | 'deep_learning' | 'trending';
  description: string;
  weight: number;
  isEnabled: boolean;
  config: {
    minSimilarity?: number;
    maxRecommendations?: number;
    diversityFactor?: number;
    noveltyFactor?: number;
    recencyWeight?: number;
    popularityWeight?: number;
    personalWeight?: number;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    diversity: number;
    coverage: number;
    novelty: number;
    clickThroughRate: number;
    conversionRate: number;
  };
  lastTrained?: number;
  trainingData?: {
    samples: number;
    features: number;
    epochs: number;
    loss: number;
  };
}

export interface RecommendationConfig {
  maxRecommendations: number;
  refreshInterval: number;
  cacheTimeout: number;
  enableRealTime: boolean;
  enablePersonalization: boolean;
  enableDiversification: boolean;
  enableNovelty: boolean;
  enableExploration: boolean;
  explorationRate: number;
  diversityThreshold: number;
  noveltyThreshold: number;
  confidenceThreshold: number;
  algorithms: {
    collaborative: boolean;
    contentBased: boolean;
    hybrid: boolean;
    deepLearning: boolean;
    trending: boolean;
  };
  weights: {
    recency: number;
    popularity: number;
    personal: number;
    similarity: number;
    diversity: number;
    novelty: number;
  };
  filters: {
    minRating: number;
    minViews: number;
    maxAge: number;
    excludeCategories: string[];
    includeCategories: string[];
    contentTypes: string[];
  };
}

export interface RecommendationStats {
  totalRecommendations: number;
  activeRecommendations: number;
  clickThroughRate: number;
  conversionRate: number;
  averageScore: number;
  averageConfidence: number;
  algorithmPerformance: Record<string, {
    recommendations: number;
    clicks: number;
    conversions: number;
    accuracy: number;
  }>;
  categoryDistribution: Record<string, number>;
  userEngagement: {
    activeUsers: number;
    averageSessionTime: number;
    returnRate: number;
    satisfactionScore: number;
  };
  systemMetrics: {
    responseTime: number;
    throughput: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

export interface RecommendationEvent {
  id: string;
  type: 'recommendation_generated' | 'recommendation_shown' | 'recommendation_clicked' | 
        'recommendation_dismissed' | 'user_feedback' | 'algorithm_updated' | 'model_trained' |
        'cache_updated' | 'performance_alert' | 'system_error';
  userId?: string;
  itemId?: string;
  recommendationId?: string;
  algorithmId?: string;
  data: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    environment: string;
  };
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface RecommendationDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  timestamp: number;
  source: string;
  userId?: string;
  sessionId?: string;
}

// Store
interface RecommendationStore {
  // Estado
  recommendations: Recommendation[];
  contentItems: ContentItem[];
  userProfiles: UserProfile[];
  algorithms: RecommendationAlgorithm[];
  config: RecommendationConfig;
  stats: RecommendationStats;
  events: RecommendationEvent[];
  debugLogs: RecommendationDebugLog[];
  
  // Estado do sistema
  isInitialized: boolean;
  isProcessing: boolean;
  isTraining: boolean;
  error: string | null;
  lastUpdate: number;
  
  // Valores computados
  computed: {
    totalUsers: number;
    totalContent: number;
    activeAlgorithms: RecommendationAlgorithm[];
    topCategories: string[];
    systemHealth: {
      status: 'healthy' | 'degraded' | 'critical';
      score: number;
      issues: string[];
    };
    performance: {
      averageResponseTime: number;
      recommendationAccuracy: number;
      userSatisfaction: number;
      systemLoad: number;
    };
  };
  
  // Ações principais
  actions: {
    // Inicialização
    initialize: () => Promise<void>;
    reset: () => void;
    
    // Recomendações
    generateRecommendations: (userId: string, context?: any) => Promise<Recommendation[]>;
    getRecommendations: (userId: string, limit?: number) => Recommendation[];
    updateRecommendationStatus: (recommendationId: string, status: Recommendation['status']) => void;
    dismissRecommendation: (recommendationId: string) => void;
    
    // Conteúdo
    addContentItem: (item: ContentItem) => void;
    updateContentItem: (itemId: string, updates: Partial<ContentItem>) => void;
    removeContentItem: (itemId: string) => void;
    searchContent: (query: string, filters?: any) => ContentItem[];
    
    // Perfil do usuário
    createUserProfile: (userId: string, profile: Partial<UserProfile>) => void;
    updateUserProfile: (userId: string, updates: Partial<UserProfile>) => void;
    trackUserInteraction: (userId: string, interaction: UserProfile['behavior']['interactionHistory'][0]) => void;
    
    // Algoritmos
    addAlgorithm: (algorithm: RecommendationAlgorithm) => void;
    updateAlgorithm: (algorithmId: string, updates: Partial<RecommendationAlgorithm>) => void;
    toggleAlgorithm: (algorithmId: string, enabled: boolean) => void;
    trainAlgorithm: (algorithmId: string) => Promise<void>;
    
    // Configuração
    updateConfig: (updates: Partial<RecommendationConfig>) => void;
    resetConfig: () => void;
    
    // Feedback
    submitFeedback: (userId: string, itemId: string, rating: number, comment?: string) => void;
    
    // Cache
    clearCache: () => void;
    refreshCache: () => Promise<void>;
  };
  
  // Ações rápidas
  quickActions: {
    getPersonalizedRecommendations: (userId: string) => Promise<Recommendation[]>;
    getTrendingContent: (category?: string) => ContentItem[];
    getSimilarContent: (itemId: string, limit?: number) => ContentItem[];
    getPopularContent: (timeframe?: 'day' | 'week' | 'month') => ContentItem[];
    refreshUserRecommendations: (userId: string) => Promise<void>;
    optimizeAlgorithms: () => Promise<void>;
  };
  
  // Recursos avançados
  advanced: {
    abTest: {
      createExperiment: (name: string, variants: any[]) => string;
      getExperimentResults: (experimentId: string) => any;
      endExperiment: (experimentId: string) => void;
    };
    
    analytics: {
      generateReport: (timeframe: string) => any;
      exportData: (format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
      getInsights: () => any[];
    };
    
    ml: {
      trainModel: (algorithmId: string, data: any[]) => Promise<void>;
      evaluateModel: (algorithmId: string) => Promise<any>;
      deployModel: (algorithmId: string) => Promise<void>;
    };
  };
  
  // Operações do sistema
  system: {
    health: {
      status: 'healthy' | 'degraded' | 'critical';
      score: number;
      issues: string[];
      lastCheck: number;
    };
    
    performance: {
      responseTime: number;
      throughput: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    
    monitoring: {
      startMonitoring: () => void;
      stopMonitoring: () => void;
      getMetrics: () => any;
    };
  };
  
  // Utilitários
  utils: {
    format: {
      score: (score: number) => string;
      confidence: (confidence: number) => string;
      timestamp: (timestamp: number) => string;
      duration: (ms: number) => string;
    };
    
    search: {
      recommendations: (query: string) => Recommendation[];
      content: (query: string) => ContentItem[];
      users: (query: string) => UserProfile[];
    };
    
    filter: {
      byCategory: (items: ContentItem[], category: string) => ContentItem[];
      byType: (items: ContentItem[], type: string) => ContentItem[];
      byRating: (items: ContentItem[], minRating: number) => ContentItem[];
    };
    
    sort: {
      byScore: (recommendations: Recommendation[]) => Recommendation[];
      byPopularity: (items: ContentItem[]) => ContentItem[];
      byRecency: (items: ContentItem[]) => ContentItem[];
    };
  };
  
  // Helpers de configuração
  configHelpers: {
    getAlgorithmConfig: (algorithmId: string) => RecommendationAlgorithm['config'] | null;
    updateAlgorithmWeight: (algorithmId: string, weight: number) => void;
    getOptimalConfig: () => Partial<RecommendationConfig>;
    validateConfig: (config: Partial<RecommendationConfig>) => boolean;
  };
  
  // Helpers de analytics
  analyticsHelpers: {
    calculateCTR: (recommendations: Recommendation[]) => number;
    calculateConversionRate: (recommendations: Recommendation[]) => number;
    getTopPerformingAlgorithms: () => RecommendationAlgorithm[];
    getUserEngagementMetrics: (userId: string) => any;
  };
  
  // Helpers de debug
  debugHelpers: {
    logRecommendationGeneration: (userId: string, recommendations: Recommendation[]) => void;
    logUserInteraction: (interaction: any) => void;
    getDebugInfo: () => any;
    exportLogs: () => Promise<Blob>;
  };
}

// Configuração padrão
const defaultConfig: RecommendationConfig = {
  maxRecommendations: 20,
  refreshInterval: 300000, // 5 minutos
  cacheTimeout: 3600000, // 1 hora
  enableRealTime: true,
  enablePersonalization: true,
  enableDiversification: true,
  enableNovelty: true,
  enableExploration: true,
  explorationRate: 0.1,
  diversityThreshold: 0.7,
  noveltyThreshold: 0.5,
  confidenceThreshold: 0.6,
  algorithms: {
    collaborative: true,
    contentBased: true,
    hybrid: true,
    deepLearning: false,
    trending: true
  },
  weights: {
    recency: 0.2,
    popularity: 0.3,
    personal: 0.4,
    similarity: 0.3,
    diversity: 0.2,
    novelty: 0.1
  },
  filters: {
    minRating: 3.0,
    minViews: 10,
    maxAge: 2592000000, // 30 dias
    excludeCategories: [],
    includeCategories: [],
    contentTypes: ['video', 'audio', 'image', 'template', 'effect']
  }
};

// Store principal
export const useRecommendationStore = create<RecommendationStore>()(subscribeWithSelector((set, get) => ({
  // Estado inicial
  recommendations: [],
  contentItems: [],
  userProfiles: [],
  algorithms: [],
  config: defaultConfig,
  stats: {
    totalRecommendations: 0,
    activeRecommendations: 0,
    clickThroughRate: 0,
    conversionRate: 0,
    averageScore: 0,
    averageConfidence: 0,
    algorithmPerformance: {},
    categoryDistribution: {},
    userEngagement: {
      activeUsers: 0,
      averageSessionTime: 0,
      returnRate: 0,
      satisfactionScore: 0
    },
    systemMetrics: {
      responseTime: 0,
      throughput: 0,
      cacheHitRate: 0,
      errorRate: 0
    }
  },
  events: [],
  debugLogs: [],
  
  isInitialized: false,
  isProcessing: false,
  isTraining: false,
  error: null,
  lastUpdate: 0,
  
  // Valores computados
  computed: {
    get totalUsers() {
      return get().userProfiles.length;
    },
    get totalContent() {
      return get().contentItems.length;
    },
    get activeAlgorithms() {
      return get().algorithms.filter(a => a.isEnabled);
    },
    get topCategories() {
      const distribution = get().stats.categoryDistribution;
      return Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);
    },
    get systemHealth() {
      const { stats, algorithms } = get();
      let score = 100;
      const issues: string[] = [];
      
      // Verificar performance
      if (stats.systemMetrics.responseTime > 1000) {
        score -= 20;
        issues.push('Tempo de resposta alto');
      }
      
      if (stats.systemMetrics.errorRate > 0.05) {
        score -= 30;
        issues.push('Taxa de erro elevada');
      }
      
      // Verificar algoritmos
      const activeAlgs = algorithms.filter(a => a.isEnabled);
      if (activeAlgs.length === 0) {
        score -= 50;
        issues.push('Nenhum algoritmo ativo');
      }
      
      return {
        status: score >= 80 ? 'healthy' : score >= 60 ? 'degraded' : 'critical',
        score,
        issues
      };
    },
    get performance() {
      const { stats } = get();
      return {
        averageResponseTime: stats.systemMetrics.responseTime,
        recommendationAccuracy: Object.values(stats.algorithmPerformance)
          .reduce((acc, perf) => acc + perf.accuracy, 0) / Object.keys(stats.algorithmPerformance).length || 0,
        userSatisfaction: stats.userEngagement.satisfactionScore,
        systemLoad: (stats.systemMetrics.responseTime / 1000) * 100
      };
    }
  },
  
  // Ações principais
  actions: {
    initialize: async () => {
      set({ isProcessing: true, error: null });
      
      try {
        // Inicializar algoritmos padrão
        const defaultAlgorithms: RecommendationAlgorithm[] = [
          {
            id: 'collaborative-filtering',
            name: 'Filtragem Colaborativa',
            type: 'collaborative',
            description: 'Recomenda baseado em usuários similares',
            weight: 0.3,
            isEnabled: true,
            config: {
              minSimilarity: 0.5,
              maxRecommendations: 10,
              diversityFactor: 0.3
            },
            performance: {
              accuracy: 0.75,
              precision: 0.68,
              recall: 0.72,
              diversity: 0.65,
              coverage: 0.80,
              novelty: 0.45,
              clickThroughRate: 0.12,
              conversionRate: 0.08
            }
          },
          {
            id: 'content-based',
            name: 'Baseado em Conteúdo',
            type: 'content_based',
            description: 'Recomenda baseado nas características do conteúdo',
            weight: 0.25,
            isEnabled: true,
            config: {
              minSimilarity: 0.6,
              maxRecommendations: 8,
              diversityFactor: 0.4
            },
            performance: {
              accuracy: 0.70,
              precision: 0.72,
              recall: 0.65,
              diversity: 0.55,
              coverage: 0.70,
              novelty: 0.60,
              clickThroughRate: 0.10,
              conversionRate: 0.07
            }
          },
          {
            id: 'trending',
            name: 'Tendências',
            type: 'trending',
            description: 'Recomenda conteúdo em alta',
            weight: 0.2,
            isEnabled: true,
            config: {
              maxRecommendations: 5,
              recencyWeight: 0.8,
              popularityWeight: 0.9
            },
            performance: {
              accuracy: 0.65,
              precision: 0.60,
              recall: 0.70,
              diversity: 0.40,
              coverage: 0.60,
              novelty: 0.80,
              clickThroughRate: 0.15,
              conversionRate: 0.10
            }
          }
        ];
        
        set({
          algorithms: defaultAlgorithms,
          isInitialized: true,
          lastUpdate: Date.now()
        });
        
        // Log de inicialização
        get().debugHelpers.logRecommendationGeneration('system', []);
        
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Erro na inicialização' });
      } finally {
        set({ isProcessing: false });
      }
    },
    
    reset: () => {
      set({
        recommendations: [],
        contentItems: [],
        userProfiles: [],
        events: [],
        debugLogs: [],
        isInitialized: false,
        error: null,
        lastUpdate: 0
      });
    },
    
    generateRecommendations: async (userId: string, context = {}) => {
      const { algorithms, contentItems, userProfiles, config } = get();
      
      set({ isProcessing: true });
      
      try {
        const userProfile = userProfiles.find(p => p.id === userId);
        if (!userProfile) {
          throw new Error('Perfil do usuário não encontrado');
        }
        
        const activeAlgorithms = algorithms.filter(a => a.isEnabled);
        const recommendations: Recommendation[] = [];
        
        // Gerar recomendações para cada algoritmo
        for (const algorithm of activeAlgorithms) {
          const algorithmRecs = await generateAlgorithmRecommendations(
            algorithm,
            userProfile,
            contentItems,
            context,
            config
          );
          recommendations.push(...algorithmRecs);
        }
        
        // Combinar e ranquear recomendações
        const finalRecommendations = combineAndRankRecommendations(
          recommendations,
          algorithms,
          config
        ).slice(0, config.maxRecommendations);
        
        // Atualizar store
        set(state => ({
          recommendations: [
            ...state.recommendations.filter(r => r.userId !== userId),
            ...finalRecommendations
          ],
          lastUpdate: Date.now()
        }));
        
        // Log do evento
        get().debugHelpers.logRecommendationGeneration(userId, finalRecommendations);
        
        return finalRecommendations;
        
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Erro na geração de recomendações' });
        return [];
      } finally {
        set({ isProcessing: false });
      }
    },
    
    getRecommendations: (userId: string, limit = 10) => {
      const { recommendations } = get();
      return recommendations
        .filter(r => r.userId === userId && r.status === 'pending')
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    
    updateRecommendationStatus: (recommendationId: string, status: Recommendation['status']) => {
      set(state => ({
        recommendations: state.recommendations.map(r =>
          r.id === recommendationId ? { ...r, status } : r
        )
      }));
    },
    
    dismissRecommendation: (recommendationId: string) => {
      get().actions.updateRecommendationStatus(recommendationId, 'dismissed');
    },
    
    addContentItem: (item: ContentItem) => {
      set(state => ({
        contentItems: [...state.contentItems, item]
      }));
    },
    
    updateContentItem: (itemId: string, updates: Partial<ContentItem>) => {
      set(state => ({
        contentItems: state.contentItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      }));
    },
    
    removeContentItem: (itemId: string) => {
      set(state => ({
        contentItems: state.contentItems.filter(item => item.id !== itemId)
      }));
    },
    
    searchContent: (query: string, filters = {}) => {
      const { contentItems } = get();
      return contentItems.filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
                           item.description.toLowerCase().includes(query.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        // Aplicar filtros adicionais
        let matchesFilters = true;
        if (filters.category) {
          matchesFilters = matchesFilters && item.category === filters.category;
        }
        if (filters.type) {
          matchesFilters = matchesFilters && item.type === filters.type;
        }
        
        return matchesQuery && matchesFilters;
      });
    },
    
    createUserProfile: (userId: string, profile: Partial<UserProfile>) => {
      const newProfile: UserProfile = {
        id: userId,
        preferences: {
          categories: [],
          contentTypes: ['video'],
          qualityPreference: 'high',
          languagePreference: 'pt-BR',
          themes: [],
          styles: [],
          ...profile.preferences
        },
        behavior: {
          viewHistory: [],
          downloadHistory: [],
          searchHistory: [],
          interactionHistory: [],
          sessionTime: 0,
          activeHours: [],
          ...profile.behavior
        },
        demographics: {
          experience: 'intermediate',
          ...profile.demographics
        },
        goals: profile.goals || [],
        feedback: profile.feedback || []
      };
      
      set(state => ({
        userProfiles: [...state.userProfiles, newProfile]
      }));
    },
    
    updateUserProfile: (userId: string, updates: Partial<UserProfile>) => {
      set(state => ({
        userProfiles: state.userProfiles.map(profile =>
          profile.id === userId ? { ...profile, ...updates } : profile
        )
      }));
    },
    
    trackUserInteraction: (userId: string, interaction: UserProfile['behavior']['interactionHistory'][0]) => {
      set(state => ({
        userProfiles: state.userProfiles.map(profile =>
          profile.id === userId
            ? {
                ...profile,
                behavior: {
                  ...profile.behavior,
                  interactionHistory: [...profile.behavior.interactionHistory, interaction]
                }
              }
            : profile
        )
      }));
    },
    
    addAlgorithm: (algorithm: RecommendationAlgorithm) => {
      set(state => ({
        algorithms: [...state.algorithms, algorithm]
      }));
    },
    
    updateAlgorithm: (algorithmId: string, updates: Partial<RecommendationAlgorithm>) => {
      set(state => ({
        algorithms: state.algorithms.map(alg =>
          alg.id === algorithmId ? { ...alg, ...updates } : alg
        )
      }));
    },
    
    toggleAlgorithm: (algorithmId: string, enabled: boolean) => {
      get().actions.updateAlgorithm(algorithmId, { isEnabled: enabled });
    },
    
    trainAlgorithm: async (algorithmId: string) => {
      set({ isTraining: true });
      
      try {
        // Simular treinamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        get().actions.updateAlgorithm(algorithmId, {
          lastTrained: Date.now(),
          trainingData: {
            samples: Math.floor(Math.random() * 10000) + 1000,
            features: Math.floor(Math.random() * 100) + 50,
            epochs: Math.floor(Math.random() * 50) + 10,
            loss: Math.random() * 0.5
          }
        });
        
      } finally {
        set({ isTraining: false });
      }
    },
    
    updateConfig: (updates: Partial<RecommendationConfig>) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },
    
    resetConfig: () => {
      set({ config: defaultConfig });
    },
    
    submitFeedback: (userId: string, itemId: string, rating: number, comment?: string) => {
      const feedback = {
        itemId,
        rating,
        comment,
        timestamp: Date.now()
      };
      
      set(state => ({
        userProfiles: state.userProfiles.map(profile =>
          profile.id === userId
            ? {
                ...profile,
                feedback: [...profile.feedback, feedback]
              }
            : profile
        )
      }));
    },
    
    clearCache: () => {
      set({
        recommendations: [],
        lastUpdate: 0
      });
    },
    
    refreshCache: async () => {
      const { userProfiles } = get();
      
      // Regenerar recomendações para todos os usuários
      for (const profile of userProfiles) {
        await get().actions.generateRecommendations(profile.id);
      }
    }
  },
  
  // Ações rápidas
  quickActions: {
    getPersonalizedRecommendations: async (userId: string) => {
      return get().actions.generateRecommendations(userId, { type: 'personalized' });
    },
    
    getTrendingContent: (category?: string) => {
      const { contentItems } = get();
      const trending = contentItems
        .filter(item => category ? item.category === category : true)
        .sort((a, b) => {
          const scoreA = a.analytics.views + a.analytics.likes * 2 + a.analytics.shares * 3;
          const scoreB = b.analytics.views + b.analytics.likes * 2 + b.analytics.shares * 3;
          return scoreB - scoreA;
        });
      
      return trending.slice(0, 10);
    },
    
    getSimilarContent: (itemId: string, limit = 5) => {
      const { contentItems } = get();
      const targetItem = contentItems.find(item => item.id === itemId);
      
      if (!targetItem) return [];
      
      return contentItems
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          similarity: calculateContentSimilarity(targetItem, item)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    },
    
    getPopularContent: (timeframe = 'week') => {
      const { contentItems } = get();
      const now = Date.now();
      const timeframes = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = now - timeframes[timeframe];
      
      return contentItems
        .filter(item => item.metadata.createdAt >= cutoff)
        .sort((a, b) => b.analytics.engagement - a.analytics.engagement)
        .slice(0, 10);
    },
    
    refreshUserRecommendations: async (userId: string) => {
      // Limpar recomendações antigas do usuário
      set(state => ({
        recommendations: state.recommendations.filter(r => r.userId !== userId)
      }));
      
      // Gerar novas recomendações
      return get().actions.generateRecommendations(userId);
    },
    
    optimizeAlgorithms: async () => {
      const { algorithms } = get();
      
      // Otimizar pesos baseado na performance
      for (const algorithm of algorithms) {
        const performance = algorithm.performance;
        const newWeight = calculateOptimalWeight(performance);
        
        get().actions.updateAlgorithm(algorithm.id, { weight: newWeight });
      }
    }
  },
  
  // Recursos avançados
  advanced: {
    abTest: {
      createExperiment: (name: string, variants: any[]) => {
        const experimentId = `exp_${Date.now()}`;
        // Implementar lógica de A/B test
        return experimentId;
      },
      
      getExperimentResults: (experimentId: string) => {
        // Implementar análise de resultados
        return {};
      },
      
      endExperiment: (experimentId: string) => {
        // Implementar finalização do experimento
      }
    },
    
    analytics: {
      generateReport: (timeframe: string) => {
        const { stats, recommendations } = get();
        // Implementar geração de relatório
        return {
          timeframe,
          totalRecommendations: stats.totalRecommendations,
          performance: stats.algorithmPerformance,
          engagement: stats.userEngagement
        };
      },
      
      exportData: async (format: 'json' | 'csv' | 'xlsx') => {
        const { recommendations, contentItems, userProfiles } = get();
        const data = { recommendations, contentItems, userProfiles };
        
        if (format === 'json') {
          return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        }
        
        // Implementar outros formatos
        return new Blob([JSON.stringify(data)], { type: 'application/json' });
      },
      
      getInsights: () => {
        // Implementar geração de insights
        return [];
      }
    },
    
    ml: {
      trainModel: async (algorithmId: string, data: any[]) => {
        return get().actions.trainAlgorithm(algorithmId);
      },
      
      evaluateModel: async (algorithmId: string) => {
        const algorithm = get().algorithms.find(a => a.id === algorithmId);
        return algorithm?.performance || {};
      },
      
      deployModel: async (algorithmId: string) => {
        get().actions.updateAlgorithm(algorithmId, { isEnabled: true });
      }
    }
  },
  
  // Operações do sistema
  system: {
    health: {
      status: 'healthy',
      score: 100,
      issues: [],
      lastCheck: Date.now()
    },
    
    performance: {
      responseTime: 150,
      throughput: 1000,
      memoryUsage: 45,
      cpuUsage: 25
    },
    
    monitoring: {
      startMonitoring: () => {
        // Implementar monitoramento
      },
      
      stopMonitoring: () => {
        // Parar monitoramento
      },
      
      getMetrics: () => {
        return get().system.performance;
      }
    }
  },
  
  // Utilitários
  utils: {
    format: {
      score: (score: number) => `${(score * 100).toFixed(1)}%`,
      confidence: (confidence: number) => `${(confidence * 100).toFixed(0)}%`,
      timestamp: (timestamp: number) => new Date(timestamp).toLocaleString('pt-BR'),
      duration: (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}min`;
      }
    },
    
    search: {
      recommendations: (query: string) => {
        const { recommendations } = get();
        return recommendations.filter(r =>
          r.reasons.some(reason => reason.toLowerCase().includes(query.toLowerCase()))
        );
      },
      
      content: (query: string) => {
        return get().actions.searchContent(query);
      },
      
      users: (query: string) => {
        const { userProfiles } = get();
        return userProfiles.filter(u =>
          u.id.toLowerCase().includes(query.toLowerCase())
        );
      }
    },
    
    filter: {
      byCategory: (items: ContentItem[], category: string) => {
        return items.filter(item => item.category === category);
      },
      
      byType: (items: ContentItem[], type: string) => {
        return items.filter(item => item.type === type);
      },
      
      byRating: (items: ContentItem[], minRating: number) => {
        return items.filter(item => item.analytics.rating >= minRating);
      }
    },
    
    sort: {
      byScore: (recommendations: Recommendation[]) => {
        return [...recommendations].sort((a, b) => b.score - a.score);
      },
      
      byPopularity: (items: ContentItem[]) => {
        return [...items].sort((a, b) => b.analytics.engagement - a.analytics.engagement);
      },
      
      byRecency: (items: ContentItem[]) => {
        return [...items].sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
      }
    }
  },
  
  // Helpers de configuração
  configHelpers: {
    getAlgorithmConfig: (algorithmId: string) => {
      const algorithm = get().algorithms.find(a => a.id === algorithmId);
      return algorithm?.config || null;
    },
    
    updateAlgorithmWeight: (algorithmId: string, weight: number) => {
      get().actions.updateAlgorithm(algorithmId, { weight });
    },
    
    getOptimalConfig: () => {
      // Implementar cálculo de configuração ótima
      return {};
    },
    
    validateConfig: (config: Partial<RecommendationConfig>) => {
      // Implementar validação
      return true;
    }
  },
  
  // Helpers de analytics
  analyticsHelpers: {
    calculateCTR: (recommendations: Recommendation[]) => {
      const shown = recommendations.filter(r => r.status === 'shown').length;
      const clicked = recommendations.filter(r => r.status === 'clicked').length;
      return shown > 0 ? clicked / shown : 0;
    },
    
    calculateConversionRate: (recommendations: Recommendation[]) => {
      const clicked = recommendations.filter(r => r.status === 'clicked').length;
      const converted = recommendations.filter(r => r.status === 'clicked').length; // Simplificado
      return clicked > 0 ? converted / clicked : 0;
    },
    
    getTopPerformingAlgorithms: () => {
      return get().algorithms
        .sort((a, b) => b.performance.accuracy - a.performance.accuracy)
        .slice(0, 3);
    },
    
    getUserEngagementMetrics: (userId: string) => {
      const { recommendations, userProfiles } = get();
      const userRecs = recommendations.filter(r => r.userId === userId);
      const profile = userProfiles.find(p => p.id === userId);
      
      return {
        totalRecommendations: userRecs.length,
        clickedRecommendations: userRecs.filter(r => r.status === 'clicked').length,
        sessionTime: profile?.behavior.sessionTime || 0,
        interactionCount: profile?.behavior.interactionHistory.length || 0
      };
    }
  },
  
  // Helpers de debug
  debugHelpers: {
    logRecommendationGeneration: (userId: string, recommendations: Recommendation[]) => {
      const log: RecommendationDebugLog = {
        id: `log_${Date.now()}`,
        level: 'info',
        message: `Geradas ${recommendations.length} recomendações para usuário ${userId}`,
        data: { userId, count: recommendations.length },
        timestamp: Date.now(),
        source: 'recommendation-engine',
        userId
      };
      
      set(state => ({
        debugLogs: [...state.debugLogs.slice(-99), log]
      }));
    },
    
    logUserInteraction: (interaction: any) => {
      const log: RecommendationDebugLog = {
        id: `log_${Date.now()}`,
        level: 'info',
        message: `Interação do usuário: ${interaction.action}`,
        data: interaction,
        timestamp: Date.now(),
        source: 'user-interaction'
      };
      
      set(state => ({
        debugLogs: [...state.debugLogs.slice(-99), log]
      }));
    },
    
    getDebugInfo: () => {
      const state = get();
      return {
        isInitialized: state.isInitialized,
        isProcessing: state.isProcessing,
        totalRecommendations: state.recommendations.length,
        totalContent: state.contentItems.length,
        totalUsers: state.userProfiles.length,
        activeAlgorithms: state.algorithms.filter(a => a.isEnabled).length,
        systemHealth: state.computed.systemHealth,
        lastUpdate: state.lastUpdate
      };
    },
    
    exportLogs: async () => {
      const { debugLogs } = get();
      const data = JSON.stringify(debugLogs, null, 2);
      return new Blob([data], { type: 'application/json' });
    }
  }
})));

// Funções auxiliares
function generateAlgorithmRecommendations(
  algorithm: RecommendationAlgorithm,
  userProfile: UserProfile,
  contentItems: ContentItem[],
  context: any,
  config: RecommendationConfig
): Promise<Recommendation[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const recommendations: Recommendation[] = [];
      const maxRecs = algorithm.config.maxRecommendations || 5;
      
      // Filtrar conteúdo baseado nas preferências do usuário
      let filteredContent = contentItems.filter(item => {
        if (userProfile.preferences.contentTypes.length > 0) {
          return userProfile.preferences.contentTypes.includes(item.type);
        }
        return true;
      });
      
      // Aplicar algoritmo específico
      switch (algorithm.type) {
        case 'collaborative':
          filteredContent = filteredContent.sort(() => Math.random() - 0.5);
          break;
        case 'content_based':
          filteredContent = filteredContent.filter(item =>
            userProfile.preferences.categories.some(cat => item.category === cat)
          );
          break;
        case 'trending':
          filteredContent = filteredContent.sort((a, b) => b.analytics.engagement - a.analytics.engagement);
          break;
      }
      
      // Gerar recomendações
      for (let i = 0; i < Math.min(maxRecs, filteredContent.length); i++) {
        const item = filteredContent[i];
        const recommendation: Recommendation = {
          id: `rec_${Date.now()}_${i}`,
          itemId: item.id,
          userId: userProfile.id,
          score: Math.random() * 0.4 + 0.6, // 0.6 - 1.0
          confidence: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
          reasons: generateReasons(algorithm.type, item, userProfile),
          algorithm: algorithm.id,
          context: {
            timeOfDay: new Date().getHours(),
            sessionDuration: 0,
            recentActivity: [],
            ...context
          },
          metadata: {
            category: item.category,
            priority: 'medium',
            freshness: calculateFreshness(item),
            diversity: Math.random(),
            novelty: Math.random()
          },
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
          status: 'pending'
        };
        
        recommendations.push(recommendation);
      }
      
      resolve(recommendations);
    }, 100);
  });
}

function combineAndRankRecommendations(
  recommendations: Recommendation[],
  algorithms: RecommendationAlgorithm[],
  config: RecommendationConfig
): Recommendation[] {
  // Aplicar pesos dos algoritmos
  const weightedRecommendations = recommendations.map(rec => {
    const algorithm = algorithms.find(a => a.id === rec.algorithm);
    const weight = algorithm?.weight || 1;
    
    return {
      ...rec,
      score: rec.score * weight
    };
  });
  
  // Remover duplicatas (mesmo item)
  const uniqueRecommendations = weightedRecommendations.reduce((acc, rec) => {
    const existing = acc.find(r => r.itemId === rec.itemId);
    if (!existing || rec.score > existing.score) {
      return [...acc.filter(r => r.itemId !== rec.itemId), rec];
    }
    return acc;
  }, [] as Recommendation[]);
  
  // Ordenar por score
  return uniqueRecommendations.sort((a, b) => b.score - a.score);
}

function generateReasons(algorithmType: string, item: ContentItem, userProfile: UserProfile): string[] {
  const reasons: string[] = [];
  
  switch (algorithmType) {
    case 'collaborative':
      reasons.push('Usuários similares gostaram deste conteúdo');
      break;
    case 'content_based':
      if (userProfile.preferences.categories.includes(item.category)) {
        reasons.push(`Você gosta de conteúdo da categoria ${item.category}`);
      }
      break;
    case 'trending':
      reasons.push('Conteúdo em alta no momento');
      break;
  }
  
  if (item.analytics.rating > 4.5) {
    reasons.push('Altamente avaliado pela comunidade');
  }
  
  return reasons;
}

function calculateContentSimilarity(item1: ContentItem, item2: ContentItem): number {
  let similarity = 0;
  
  // Categoria
  if (item1.category === item2.category) similarity += 0.3;
  
  // Tipo
  if (item1.type === item2.type) similarity += 0.2;
  
  // Tags
  const commonTags = item1.tags.filter(tag => item2.tags.includes(tag));
  similarity += (commonTags.length / Math.max(item1.tags.length, item2.tags.length)) * 0.3;
  
  // Features
  const commonFeatures = item1.features.filter(feature => item2.features.includes(feature));
  similarity += (commonFeatures.length / Math.max(item1.features.length, item2.features.length)) * 0.2;
  
  return similarity;
}

function calculateFreshness(item: ContentItem): number {
  const now = Date.now();
  const age = now - item.metadata.createdAt;
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
  
  return Math.max(0, 1 - (age / maxAge));
}

function calculateOptimalWeight(performance: RecommendationAlgorithm['performance']): number {
  // Calcular peso ótimo baseado na performance
  const score = (performance.accuracy + performance.precision + performance.recall) / 3;
  return Math.min(1, Math.max(0.1, score));
}

// Manager principal
export class RecommendationManager {
  private static instance: RecommendationManager;
  
  static getInstance(): RecommendationManager {
    if (!RecommendationManager.instance) {
      RecommendationManager.instance = new RecommendationManager();
    }
    return RecommendationManager.instance;
  }
  
  async initialize() {
    return useRecommendationStore.getState().actions.initialize();
  }
  
  async generateRecommendations(userId: string, context?: any) {
    return useRecommendationStore.getState().actions.generateRecommendations(userId, context);
  }
  
  getRecommendations(userId: string, limit?: number) {
    return useRecommendationStore.getState().actions.getRecommendations(userId, limit);
  }
}

// Instância global
export const recommendationManager = RecommendationManager.getInstance();

// Utilitários
export const recommendationUtils = {
  getScoreColor: (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  },
  
  getConfidenceColor: (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'blue';
    return 'gray';
  },
  
  getPriorityIcon: (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  },
  
  getAlgorithmIcon: (type: string) => {
    switch (type) {
      case 'collaborative': return '👥';
      case 'content_based': return '📄';
      case 'hybrid': return '🔀';
      case 'deep_learning': return '🧠';
      case 'trending': return '📈';
      default: return '⚙️';
    }
  }
};