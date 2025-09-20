import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types and Interfaces
export interface UserProfile {
  id: string;
  preferences: {
    categories: string[];
    tags: string[];
    contentTypes: string[];
    languages: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    duration: {
      min: number;
      max: number;
    };
  };
  behavior: {
    viewHistory: ContentInteraction[];
    searchHistory: string[];
    bookmarks: string[];
    ratings: ContentRating[];
    timeSpent: Record<string, number>;
    completionRate: number;
    engagementScore: number;
  };
  demographics: {
    age?: number;
    location?: string;
    timezone: string;
    device: 'mobile' | 'tablet' | 'desktop';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'course' | 'tutorial' | 'template' | 'tool';
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  language: string;
  author: {
    id: string;
    name: string;
    reputation: number;
  };
  metadata: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    rating: number;
    completionRate: number;
    trending: boolean;
    featured: boolean;
    premium: boolean;
  };
  content: {
    thumbnail: string;
    preview?: string;
    url: string;
    size?: number;
  };
  analytics: {
    clickThroughRate: number;
    engagementRate: number;
    conversionRate: number;
    retentionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentInteraction {
  id: string;
  userId: string;
  contentId: string;
  type: 'view' | 'like' | 'share' | 'comment' | 'bookmark' | 'complete' | 'skip';
  duration?: number;
  progress?: number;
  context: {
    source: 'search' | 'recommendation' | 'trending' | 'category' | 'related';
    position?: number;
    query?: string;
  };
  timestamp: Date;
}

export interface ContentRating {
  id: string;
  userId: string;
  contentId: string;
  rating: number; // 1-5
  review?: string;
  aspects: {
    quality: number;
    relevance: number;
    difficulty: number;
    usefulness: number;
  };
  timestamp: Date;
}

export interface Recommendation {
  id: string;
  contentId: string;
  userId: string;
  score: number;
  confidence: number;
  reasons: RecommendationReason[];
  algorithm: string;
  context: {
    source: 'collaborative' | 'content_based' | 'hybrid' | 'trending' | 'personalized';
    factors: string[];
  };
  metadata: {
    rank: number;
    category: string;
    freshness: number;
    diversity: number;
  };
  createdAt: Date;
  expiresAt: Date;
}

export interface RecommendationReason {
  type: 'similar_users' | 'similar_content' | 'trending' | 'category_match' | 'tag_match' | 'author_follow' | 'completion_pattern';
  description: string;
  weight: number;
  evidence: any;
}

export interface RecommendationEngine {
  id: string;
  name: string;
  type: 'collaborative_filtering' | 'content_based' | 'matrix_factorization' | 'deep_learning' | 'hybrid';
  config: {
    weights: Record<string, number>;
    parameters: Record<string, any>;
    thresholds: Record<string, number>;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    coverage: number;
    diversity: number;
    novelty: number;
  };
  isActive: boolean;
  lastTrained: Date;
}

export interface RecommendationConfig {
  engines: {
    primary: string;
    fallback: string[];
    weights: Record<string, number>;
  };
  filters: {
    minRating: number;
    maxAge: number; // days
    excludeViewed: boolean;
    respectPreferences: boolean;
    diversityThreshold: number;
  };
  personalization: {
    enabled: boolean;
    learningRate: number;
    decayFactor: number;
    coldStartStrategy: 'popular' | 'random' | 'category_based';
  };
  realTime: {
    enabled: boolean;
    updateInterval: number;
    batchSize: number;
    maxRecommendations: number;
  };
  ab_testing: {
    enabled: boolean;
    experiments: ABTestExperiment[];
  };
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  variants: {
    control: RecommendationConfig;
    treatment: RecommendationConfig;
  };
  allocation: {
    control: number;
    treatment: number;
  };
  metrics: string[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  results?: {
    control: Record<string, number>;
    treatment: Record<string, number>;
    significance: number;
  };
}

export interface RecommendationStats {
  totalRecommendations: number;
  activeUsers: number;
  clickThroughRate: number;
  conversionRate: number;
  averageRating: number;
  coverageRate: number;
  diversityScore: number;
  noveltyScore: number;
  userSatisfaction: number;
  systemHealth: number;
  isHealthy: boolean;
  trends: {
    recommendations: Array<{ date: Date; count: number }>;
    engagement: Array<{ date: Date; rate: number }>;
    satisfaction: Array<{ date: Date; score: number }>;
  };
}

export interface RecommendationMetrics {
  accuracy: {
    overall: number;
    byCategory: Record<string, number>;
    byEngine: Record<string, number>;
  };
  engagement: {
    clickThroughRate: number;
    timeSpent: number;
    completionRate: number;
    shareRate: number;
  };
  business: {
    conversionRate: number;
    revenue: number;
    userRetention: number;
    contentDiscovery: number;
  };
  system: {
    latency: number;
    throughput: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

// Utility Functions
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatPercentage = (num: number): string => {
  return `${(num * 100).toFixed(1)}%`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getEngagementColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
};

export const getDifficultyIcon = (difficulty: string): string => {
  const icons = {
    beginner: '🟢',
    intermediate: '🟡',
    advanced: '🟠',
    expert: '🔴'
  };
  return icons[difficulty as keyof typeof icons] || '⚪';
};

export const getContentTypeIcon = (type: string): string => {
  const icons = {
    video: '🎥',
    article: '📄',
    course: '📚',
    tutorial: '🎯',
    template: '📋',
    tool: '🔧'
  };
  return icons[type as keyof typeof icons] || '📄';
};

export const calculateRecommendationHealth = (stats: RecommendationStats): number => {
  const weights = {
    clickThroughRate: 0.25,
    conversionRate: 0.25,
    userSatisfaction: 0.2,
    coverageRate: 0.15,
    diversityScore: 0.15
  };
  
  return (
    stats.clickThroughRate * weights.clickThroughRate +
    stats.conversionRate * weights.conversionRate +
    stats.userSatisfaction * weights.userSatisfaction +
    stats.coverageRate * weights.coverageRate +
    stats.diversityScore * weights.diversityScore
  ) * 100;
};

export const generateRecommendationInsights = (stats: RecommendationStats): string[] => {
  const insights: string[] = [];
  
  if (stats.clickThroughRate > 0.15) {
    insights.push('High engagement rate indicates relevant recommendations');
  }
  
  if (stats.diversityScore < 0.6) {
    insights.push('Consider increasing recommendation diversity');
  }
  
  if (stats.coverageRate < 0.7) {
    insights.push('Expand content coverage to reach more users');
  }
  
  if (stats.userSatisfaction > 0.8) {
    insights.push('Users are highly satisfied with recommendations');
  }
  
  if (stats.noveltyScore < 0.5) {
    insights.push('Introduce more novel content to prevent filter bubbles');
  }
  
  return insights;
};

// Zustand Store
interface ContentRecommendationState {
  // Data
  userProfiles: UserProfile[];
  contentItems: ContentItem[];
  recommendations: Recommendation[];
  interactions: ContentInteraction[];
  ratings: ContentRating[];
  engines: RecommendationEngine[];
  experiments: ABTestExperiment[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedUserId: string | null;
  selectedContentId: string | null;
  selectedEngineId: string | null;
  
  // Configuration
  config: RecommendationConfig;
  
  // Statistics
  stats: RecommendationStats;
  metrics: RecommendationMetrics;
  
  // Computed Values
  computed: {
    totalUsers: number;
    totalContent: number;
    totalRecommendations: number;
    averageEngagement: number;
    topCategories: Array<{ category: string; count: number }>;
    topEngines: Array<{ engine: string; performance: number }>;
    recentActivity: ContentInteraction[];
    trendingContent: ContentItem[];
    recommendationHealth: number;
  };
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedUser: (userId: string | null) => void;
  setSelectedContent: (contentId: string | null) => void;
  setSelectedEngine: (engineId: string | null) => void;
  
  // User Profile Management
  createUserProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUserProfile: (id: string) => Promise<void>;
  getUserProfile: (id: string) => UserProfile | null;
  
  // Content Management
  addContentItem: (content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (id: string) => Promise<void>;
  getContentItem: (id: string) => ContentItem | null;
  
  // Recommendation Generation
  generateRecommendations: (userId: string, count?: number) => Promise<Recommendation[]>;
  getRecommendationsForUser: (userId: string) => Recommendation[];
  refreshRecommendations: (userId: string) => Promise<void>;
  
  // Interaction Tracking
  trackInteraction: (interaction: Omit<ContentInteraction, 'id' | 'timestamp'>) => Promise<void>;
  trackRating: (rating: Omit<ContentRating, 'id' | 'timestamp'>) => Promise<void>;
  
  // Engine Management
  addEngine: (engine: Omit<RecommendationEngine, 'id'>) => Promise<void>;
  updateEngine: (id: string, updates: Partial<RecommendationEngine>) => Promise<void>;
  trainEngine: (id: string) => Promise<void>;
  activateEngine: (id: string) => Promise<void>;
  deactivateEngine: (id: string) => Promise<void>;
  
  // A/B Testing
  createExperiment: (experiment: Omit<ABTestExperiment, 'id'>) => Promise<void>;
  startExperiment: (id: string) => Promise<void>;
  stopExperiment: (id: string) => Promise<void>;
  getExperimentResults: (id: string) => Promise<any>;
  
  // Configuration
  updateConfig: (updates: Partial<RecommendationConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (configData: string) => Promise<void>;
  
  // Analytics
  updateStats: () => Promise<void>;
  updateMetrics: () => Promise<void>;
  getInsights: () => string[];
  
  // System Operations
  refresh: () => Promise<void>;
  cleanup: () => Promise<void>;
  optimize: () => Promise<void>;
}

export const useContentRecommendationStore = create<ContentRecommendationState>()(devtools(
  (set, get) => ({
    // Initial Data
    userProfiles: [],
    contentItems: [],
    recommendations: [],
    interactions: [],
    ratings: [],
    engines: [
      {
        id: 'collaborative-1',
        name: 'Collaborative Filtering',
        type: 'collaborative_filtering',
        config: {
          weights: { similarity: 0.7, popularity: 0.3 },
          parameters: { neighbors: 50, minRatings: 5 },
          thresholds: { minSimilarity: 0.1, maxRecommendations: 20 }
        },
        performance: {
          accuracy: 0.78,
          precision: 0.72,
          recall: 0.68,
          f1Score: 0.70,
          coverage: 0.85,
          diversity: 0.65,
          novelty: 0.55
        },
        isActive: true,
        lastTrained: new Date()
      },
      {
        id: 'content-based-1',
        name: 'Content-Based Filtering',
        type: 'content_based',
        config: {
          weights: { tags: 0.4, category: 0.3, difficulty: 0.2, author: 0.1 },
          parameters: { vectorSize: 100, similarity: 'cosine' },
          thresholds: { minSimilarity: 0.2, maxRecommendations: 15 }
        },
        performance: {
          accuracy: 0.75,
          precision: 0.80,
          recall: 0.60,
          f1Score: 0.69,
          coverage: 0.70,
          diversity: 0.80,
          novelty: 0.70
        },
        isActive: true,
        lastTrained: new Date()
      }
    ],
    experiments: [],
    
    // UI State
    isLoading: false,
    error: null,
    selectedUserId: null,
    selectedContentId: null,
    selectedEngineId: null,
    
    // Configuration
    config: {
      engines: {
        primary: 'collaborative-1',
        fallback: ['content-based-1'],
        weights: {
          'collaborative-1': 0.6,
          'content-based-1': 0.4
        }
      },
      filters: {
        minRating: 3.0,
        maxAge: 30,
        excludeViewed: true,
        respectPreferences: true,
        diversityThreshold: 0.3
      },
      personalization: {
        enabled: true,
        learningRate: 0.01,
        decayFactor: 0.95,
        coldStartStrategy: 'popular'
      },
      realTime: {
        enabled: true,
        updateInterval: 300000, // 5 minutes
        batchSize: 100,
        maxRecommendations: 50
      },
      ab_testing: {
        enabled: false,
        experiments: []
      }
    },
    
    // Statistics
    stats: {
      totalRecommendations: 0,
      activeUsers: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      averageRating: 0,
      coverageRate: 0,
      diversityScore: 0,
      noveltyScore: 0,
      userSatisfaction: 0,
      systemHealth: 0,
      isHealthy: true,
      trends: {
        recommendations: [],
        engagement: [],
        satisfaction: []
      }
    },
    
    // Metrics
    metrics: {
      accuracy: {
        overall: 0,
        byCategory: {},
        byEngine: {}
      },
      engagement: {
        clickThroughRate: 0,
        timeSpent: 0,
        completionRate: 0,
        shareRate: 0
      },
      business: {
        conversionRate: 0,
        revenue: 0,
        userRetention: 0,
        contentDiscovery: 0
      },
      system: {
        latency: 0,
        throughput: 0,
        errorRate: 0,
        cacheHitRate: 0
      }
    },
    
    // Computed Values
    computed: {
      totalUsers: 0,
      totalContent: 0,
      totalRecommendations: 0,
      averageEngagement: 0,
      topCategories: [],
      topEngines: [],
      recentActivity: [],
      trendingContent: [],
      recommendationHealth: 0
    },
    
    // Basic Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setSelectedUser: (userId) => set({ selectedUserId: userId }),
    setSelectedContent: (contentId) => set({ selectedContentId: contentId }),
    setSelectedEngine: (engineId) => set({ selectedEngineId: engineId }),
    
    // User Profile Management
    createUserProfile: async (profileData) => {
      set({ isLoading: true, error: null });
      try {
        const profile: UserProfile = {
          ...profileData,
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          userProfiles: [...state.userProfiles, profile],
          isLoading: false
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to create user profile', isLoading: false });
      }
    },
    
    updateUserProfile: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          userProfiles: state.userProfiles.map(profile =>
            profile.id === id
              ? { ...profile, ...updates, updatedAt: new Date() }
              : profile
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update user profile', isLoading: false });
      }
    },
    
    deleteUserProfile: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          userProfiles: state.userProfiles.filter(profile => profile.id !== id),
          isLoading: false
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to delete user profile', isLoading: false });
      }
    },
    
    getUserProfile: (id) => {
      return get().userProfiles.find(profile => profile.id === id) || null;
    },
    
    // Content Management
    addContentItem: async (contentData) => {
      set({ isLoading: true, error: null });
      try {
        const content: ContentItem = {
          ...contentData,
          id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          contentItems: [...state.contentItems, content],
          isLoading: false
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to add content item', isLoading: false });
      }
    },
    
    updateContentItem: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          contentItems: state.contentItems.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date() }
              : item
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update content item', isLoading: false });
      }
    },
    
    deleteContentItem: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          contentItems: state.contentItems.filter(item => item.id !== id),
          isLoading: false
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to delete content item', isLoading: false });
      }
    },
    
    getContentItem: (id) => {
      return get().contentItems.find(item => item.id === id) || null;
    },
    
    // Recommendation Generation
    generateRecommendations: async (userId, count = 10) => {
      set({ isLoading: true, error: null });
      try {
        const user = get().getUserProfile(userId);
        if (!user) {
          throw new Error('User not found');
        }
        
        const { contentItems, config } = get();
        const recommendations: Recommendation[] = [];
        
        // Simple content-based recommendation logic
        const userPreferences = user.preferences;
        const scoredContent = contentItems
          .filter(item => {
            if (config.filters.excludeViewed && 
                user.behavior.viewHistory.some(h => h.contentId === item.id)) {
              return false;
            }
            if (item.metadata.rating < config.filters.minRating) {
              return false;
            }
            return true;
          })
          .map(item => {
            let score = 0;
            
            // Category match
            if (userPreferences.categories.includes(item.category)) {
              score += 0.3;
            }
            
            // Tag match
            const tagMatches = item.tags.filter(tag => 
              userPreferences.tags.includes(tag)
            ).length;
            score += (tagMatches / Math.max(item.tags.length, 1)) * 0.2;
            
            // Difficulty match
            if (item.difficulty === userPreferences.difficulty) {
              score += 0.2;
            }
            
            // Popularity boost
            score += (item.metadata.rating / 5) * 0.1;
            score += Math.min(item.metadata.views / 10000, 1) * 0.1;
            
            // Trending boost
            if (item.metadata.trending) {
              score += 0.1;
            }
            
            return { item, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, count);
        
        scoredContent.forEach((scored, index) => {
          const recommendation: Recommendation = {
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            contentId: scored.item.id,
            userId,
            score: scored.score,
            confidence: Math.min(scored.score + 0.2, 1),
            reasons: [
              {
                type: 'category_match',
                description: `Matches your interest in ${scored.item.category}`,
                weight: 0.3,
                evidence: { category: scored.item.category }
              }
            ],
            algorithm: 'content_based',
            context: {
              source: 'personalized',
              factors: ['category', 'tags', 'difficulty', 'popularity']
            },
            metadata: {
              rank: index + 1,
              category: scored.item.category,
              freshness: 1 - (Date.now() - scored.item.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000),
              diversity: 1
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          };
          
          recommendations.push(recommendation);
        });
        
        set(state => ({
          recommendations: [...state.recommendations, ...recommendations],
          isLoading: false
        }));
        
        get().updateStats();
        return recommendations;
      } catch (error) {
        set({ error: 'Failed to generate recommendations', isLoading: false });
        return [];
      }
    },
    
    getRecommendationsForUser: (userId) => {
      const now = new Date();
      return get().recommendations.filter(rec => 
        rec.userId === userId && rec.expiresAt > now
      );
    },
    
    refreshRecommendations: async (userId) => {
      // Remove expired recommendations
      const now = new Date();
      set(state => ({
        recommendations: state.recommendations.filter(rec => 
          rec.userId !== userId || rec.expiresAt > now
        )
      }));
      
      // Generate new recommendations
      await get().generateRecommendations(userId);
    },
    
    // Interaction Tracking
    trackInteraction: async (interactionData) => {
      try {
        const interaction: ContentInteraction = {
          ...interactionData,
          id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };
        
        set(state => ({
          interactions: [...state.interactions, interaction]
        }));
        
        // Update user behavior
        const userId = interaction.userId;
        set(state => ({
          userProfiles: state.userProfiles.map(profile => {
            if (profile.id === userId) {
              const updatedBehavior = { ...profile.behavior };
              
              if (interaction.type === 'view') {
                updatedBehavior.viewHistory = [...updatedBehavior.viewHistory, interaction];
              }
              
              if (interaction.duration) {
                updatedBehavior.timeSpent[interaction.contentId] = 
                  (updatedBehavior.timeSpent[interaction.contentId] || 0) + interaction.duration;
              }
              
              return {
                ...profile,
                behavior: updatedBehavior,
                updatedAt: new Date()
              };
            }
            return profile;
          })
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to track interaction' });
      }
    },
    
    trackRating: async (ratingData) => {
      try {
        const rating: ContentRating = {
          ...ratingData,
          id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };
        
        set(state => ({
          ratings: [...state.ratings, rating]
        }));
        
        // Update user behavior
        const userId = rating.userId;
        set(state => ({
          userProfiles: state.userProfiles.map(profile => {
            if (profile.id === userId) {
              return {
                ...profile,
                behavior: {
                  ...profile.behavior,
                  ratings: [...profile.behavior.ratings, rating]
                },
                updatedAt: new Date()
              };
            }
            return profile;
          })
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to track rating' });
      }
    },
    
    // Engine Management
    addEngine: async (engineData) => {
      set({ isLoading: true, error: null });
      try {
        const engine: RecommendationEngine = {
          ...engineData,
          id: `engine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        set(state => ({
          engines: [...state.engines, engine],
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to add engine', isLoading: false });
      }
    },
    
    updateEngine: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          engines: state.engines.map(engine =>
            engine.id === id ? { ...engine, ...updates } : engine
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update engine', isLoading: false });
      }
    },
    
    trainEngine: async (id) => {
      set({ isLoading: true, error: null });
      try {
        // Simulate training
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        set(state => ({
          engines: state.engines.map(engine =>
            engine.id === id
              ? {
                  ...engine,
                  lastTrained: new Date(),
                  performance: {
                    ...engine.performance,
                    accuracy: Math.min(engine.performance.accuracy + 0.02, 1)
                  }
                }
              : engine
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to train engine', isLoading: false });
      }
    },
    
    activateEngine: async (id) => {
      set(state => ({
        engines: state.engines.map(engine =>
          engine.id === id ? { ...engine, isActive: true } : engine
        )
      }));
    },
    
    deactivateEngine: async (id) => {
      set(state => ({
        engines: state.engines.map(engine =>
          engine.id === id ? { ...engine, isActive: false } : engine
        )
      }));
    },
    
    // A/B Testing
    createExperiment: async (experimentData) => {
      set({ isLoading: true, error: null });
      try {
        const experiment: ABTestExperiment = {
          ...experimentData,
          id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        set(state => ({
          experiments: [...state.experiments, experiment],
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to create experiment', isLoading: false });
      }
    },
    
    startExperiment: async (id) => {
      set(state => ({
        experiments: state.experiments.map(exp =>
          exp.id === id ? { ...exp, status: 'running' } : exp
        )
      }));
    },
    
    stopExperiment: async (id) => {
      set(state => ({
        experiments: state.experiments.map(exp =>
          exp.id === id ? { ...exp, status: 'completed' } : exp
        )
      }));
    },
    
    getExperimentResults: async (id) => {
      // Simulate getting results
      return {
        control: { ctr: 0.12, conversion: 0.08 },
        treatment: { ctr: 0.15, conversion: 0.10 },
        significance: 0.95
      };
    },
    
    // Configuration
    updateConfig: async (updates) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },
    
    resetConfig: async () => {
      // Reset to default config
      set(state => ({
        config: {
          engines: {
            primary: 'collaborative-1',
            fallback: ['content-based-1'],
            weights: {
              'collaborative-1': 0.6,
              'content-based-1': 0.4
            }
          },
          filters: {
            minRating: 3.0,
            maxAge: 30,
            excludeViewed: true,
            respectPreferences: true,
            diversityThreshold: 0.3
          },
          personalization: {
            enabled: true,
            learningRate: 0.01,
            decayFactor: 0.95,
            coldStartStrategy: 'popular'
          },
          realTime: {
            enabled: true,
            updateInterval: 300000,
            batchSize: 100,
            maxRecommendations: 50
          },
          ab_testing: {
            enabled: false,
            experiments: []
          }
        }
      }));
    },
    
    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },
    
    importConfig: async (configData) => {
      try {
        const config = JSON.parse(configData);
        set({ config });
      } catch (error) {
        set({ error: 'Failed to import configuration' });
      }
    },
    
    // Analytics
    updateStats: async () => {
      const state = get();
      const { userProfiles, contentItems, recommendations, interactions, ratings } = state;
      
      const totalRecommendations = recommendations.length;
      const activeUsers = userProfiles.filter(u => 
        u.behavior.viewHistory.some(h => 
          Date.now() - h.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
        )
      ).length;
      
      const clickThroughRate = interactions.filter(i => i.type === 'view').length / 
        Math.max(totalRecommendations, 1);
      
      const conversionRate = interactions.filter(i => i.type === 'complete').length / 
        Math.max(interactions.filter(i => i.type === 'view').length, 1);
      
      const averageRating = ratings.length > 0 ? 
        ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
      
      const coverageRate = contentItems.filter(item => 
        recommendations.some(rec => rec.contentId === item.id)
      ).length / Math.max(contentItems.length, 1);
      
      const diversityScore = 0.7; // Simplified calculation
      const noveltyScore = 0.6; // Simplified calculation
      const userSatisfaction = averageRating / 5;
      
      const systemHealth = calculateRecommendationHealth({
        totalRecommendations,
        activeUsers,
        clickThroughRate,
        conversionRate,
        averageRating,
        coverageRate,
        diversityScore,
        noveltyScore,
        userSatisfaction,
        systemHealth: 0,
        isHealthy: true,
        trends: { recommendations: [], engagement: [], satisfaction: [] }
      });
      
      set({
        stats: {
          totalRecommendations,
          activeUsers,
          clickThroughRate,
          conversionRate,
          averageRating,
          coverageRate,
          diversityScore,
          noveltyScore,
          userSatisfaction,
          systemHealth,
          isHealthy: systemHealth > 70,
          trends: {
            recommendations: [],
            engagement: [],
            satisfaction: []
          }
        },
        computed: {
          totalUsers: userProfiles.length,
          totalContent: contentItems.length,
          totalRecommendations,
          averageEngagement: clickThroughRate,
          topCategories: [],
          topEngines: [],
          recentActivity: interactions.slice(-10),
          trendingContent: contentItems.filter(item => item.metadata.trending),
          recommendationHealth: systemHealth
        }
      });
    },
    
    updateMetrics: async () => {
      // Update detailed metrics
      const state = get();
      // Implementation would calculate detailed metrics
    },
    
    getInsights: () => {
      return generateRecommendationInsights(get().stats);
    },
    
    // System Operations
    refresh: async () => {
      set({ isLoading: true, error: null });
      try {
        await get().updateStats();
        await get().updateMetrics();
        set({ isLoading: false });
      } catch (error) {
        set({ error: 'Failed to refresh data', isLoading: false });
      }
    },
    
    cleanup: async () => {
      // Remove expired recommendations
      const now = new Date();
      set(state => ({
        recommendations: state.recommendations.filter(rec => rec.expiresAt > now)
      }));
    },
    
    optimize: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simulate optimization
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update engine performance
        set(state => ({
          engines: state.engines.map(engine => ({
            ...engine,
            performance: {
              ...engine.performance,
              accuracy: Math.min(engine.performance.accuracy + 0.01, 1),
              precision: Math.min(engine.performance.precision + 0.01, 1)
            }
          })),
          isLoading: false
        }));
        
        get().updateStats();
      } catch (error) {
        set({ error: 'Failed to optimize system', isLoading: false });
      }
    }
  }),
  { name: 'content-recommendation-store' }
));

// Global instance
export class ContentRecommendationManager {
  private static instance: ContentRecommendationManager;
  
  static getInstance(): ContentRecommendationManager {
    if (!ContentRecommendationManager.instance) {
      ContentRecommendationManager.instance = new ContentRecommendationManager();
    }
    return ContentRecommendationManager.instance;
  }
  
  getStore() {
    return useContentRecommendationStore;
  }
}

export default ContentRecommendationManager.getInstance();