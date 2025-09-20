import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SentimentAnalysis {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
  keywords: string[];
  language: string;
  timestamp: Date;
  source: 'comment' | 'script' | 'description' | 'title';
}

export interface ContentRecommendation {
  id: string;
  type: 'template' | 'asset' | 'effect' | 'music' | 'transition';
  title: string;
  description: string;
  thumbnailUrl: string;
  relevanceScore: number;
  category: string;
  tags: string[];
  usage: {
    views: number;
    likes: number;
    downloads: number;
  };
  aiReason: string;
  timestamp: Date;
}

export interface ScriptCorrection {
  id: string;
  originalText: string;
  correctedText: string;
  corrections: {
    type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone';
    position: { start: number; end: number };
    original: string;
    suggestion: string;
    confidence: number;
    reason: string;
  }[];
  overallScore: number;
  language: string;
  timestamp: Date;
}

export interface ThumbnailGeneration {
  id: string;
  videoId: string;
  thumbnails: {
    id: string;
    url: string;
    style: 'dramatic' | 'minimalist' | 'colorful' | 'professional' | 'creative';
    aiScore: number;
    elements: string[];
    colors: string[];
    composition: string;
  }[];
  selectedThumbnailId?: string;
  status: 'generating' | 'ready' | 'failed';
  timestamp: Date;
}

export interface AIModel {
  id: string;
  name: string;
  type: 'sentiment' | 'recommendation' | 'correction' | 'generation';
  version: string;
  accuracy: number;
  speed: number;
  status: 'active' | 'training' | 'inactive';
  lastTrained: Date;
  parameters: Record<string, any>;
}

export interface AITask {
  id: string;
  type: 'sentiment_analysis' | 'content_recommendation' | 'script_correction' | 'thumbnail_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  progress: number;
  estimatedTime: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'optimization' | 'prediction' | 'anomaly';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
  actionable: boolean;
  timestamp: Date;
}

export interface AIFilter {
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: { min: number; max: number };
  type?: string;
  dateRange?: { start: Date; end: Date };
  source?: string;
  category?: string;
  status?: string;
}

export interface AIStats {
  totalAnalyses: number;
  totalRecommendations: number;
  totalCorrections: number;
  totalThumbnails: number;
  averageAccuracy: number;
  processingTime: number;
  activeModels: number;
  successRate: number;
}

export interface AIConfig {
  enableRealtime: boolean;
  enableAutoCorrection: boolean;
  enableSmartRecommendations: boolean;
  enableThumbnailGeneration: boolean;
  sentimentThreshold: number;
  recommendationLimit: number;
  correctionSensitivity: 'low' | 'medium' | 'high';
  thumbnailStyles: string[];
  modelSettings: Record<string, any>;
  apiKeys: Record<string, string>;
}

export interface AIEvent {
  id: string;
  type: 'analysis_completed' | 'recommendation_generated' | 'correction_applied' | 'thumbnail_created' | 'model_updated';
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface AIAnalytics {
  usage: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  performance: {
    accuracy: number[];
    speed: number[];
    errors: number[];
  };
  trends: {
    popularCategories: string[];
    growingTrends: string[];
    userPreferences: Record<string, number>;
  };
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

interface AdvancedAIState {
  // State
  sentimentAnalyses: SentimentAnalysis[];
  recommendations: ContentRecommendation[];
  corrections: ScriptCorrection[];
  thumbnails: ThumbnailGeneration[];
  models: AIModel[];
  tasks: AITask[];
  insights: AIInsight[];
  events: AIEvent[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedAnalysis: SentimentAnalysis | null;
  selectedRecommendation: ContentRecommendation | null;
  selectedCorrection: ScriptCorrection | null;
  selectedThumbnail: ThumbnailGeneration | null;
  activeTab: string;
  searchQuery: string;
  filter: AIFilter;
  
  // Configuration
  config: AIConfig;
  stats: AIStats;
  analytics: AIAnalytics;
  
  // Computed Values
  filteredAnalyses: SentimentAnalysis[];
  filteredRecommendations: ContentRecommendation[];
  filteredCorrections: ScriptCorrection[];
  filteredThumbnails: ThumbnailGeneration[];
  activeTasks: AITask[];
  recentInsights: AIInsight[];
  modelPerformance: Record<string, number>;
  
  // Actions - Sentiment Analysis
  analyzeSentiment: (text: string, source: SentimentAnalysis['source']) => Promise<SentimentAnalysis>;
  batchAnalyzeSentiment: (texts: { text: string; source: SentimentAnalysis['source'] }[]) => Promise<SentimentAnalysis[]>;
  deleteAnalysis: (id: string) => void;
  exportAnalyses: (format: 'csv' | 'json' | 'pdf') => void;
  
  // Actions - Content Recommendations
  generateRecommendations: (context: any) => Promise<ContentRecommendation[]>;
  refreshRecommendations: () => Promise<void>;
  likeRecommendation: (id: string) => void;
  dislikeRecommendation: (id: string) => void;
  applyRecommendation: (id: string) => void;
  
  // Actions - Script Corrections
  correctScript: (text: string, options?: any) => Promise<ScriptCorrection>;
  applyCorrection: (id: string, correctionIndex?: number) => void;
  rejectCorrection: (id: string, correctionIndex: number) => void;
  saveCorrection: (id: string) => void;
  
  // Actions - Thumbnail Generation
  generateThumbnails: (videoId: string, options?: any) => Promise<ThumbnailGeneration>;
  selectThumbnail: (generationId: string, thumbnailId: string) => void;
  regenerateThumbnail: (generationId: string, style: string) => Promise<void>;
  downloadThumbnail: (generationId: string, thumbnailId: string) => void;
  
  // Actions - Models
  loadModels: () => Promise<void>;
  trainModel: (modelId: string, data: any) => Promise<void>;
  updateModel: (modelId: string, updates: Partial<AIModel>) => void;
  deleteModel: (id: string) => void;
  
  // Actions - Tasks
  createTask: (task: Omit<AITask, 'id' | 'progress' | 'startTime'>) => string;
  updateTask: (id: string, updates: Partial<AITask>) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  clearCompletedTasks: () => void;
  
  // Actions - Data Operations
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => void;
  exportData: (format: 'json' | 'csv') => void;
  importData: (data: any) => void;
  
  // Actions - Search and Filter
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<AIFilter>) => void;
  clearFilter: () => void;
  saveFilter: (name: string, filter: AIFilter) => void;
  
  // Actions - UI
  setSelectedAnalysis: (analysis: SentimentAnalysis | null) => void;
  setSelectedRecommendation: (recommendation: ContentRecommendation | null) => void;
  setSelectedCorrection: (correction: ScriptCorrection | null) => void;
  setSelectedThumbnail: (thumbnail: ThumbnailGeneration | null) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Quick Actions
  quickAnalyze: (text: string) => Promise<void>;
  quickRecommend: () => Promise<void>;
  quickCorrect: (text: string) => Promise<void>;
  quickGenerate: (videoId: string) => Promise<void>;
  
  // Actions - Advanced Features
  createInsight: (insight: Omit<AIInsight, 'id' | 'timestamp'>) => void;
  dismissInsight: (id: string) => void;
  scheduleAnalysis: (schedule: any) => void;
  createWorkflow: (workflow: any) => void;
  
  // Actions - System
  initialize: () => Promise<void>;
  cleanup: () => void;
  reset: () => void;
  backup: () => Promise<void>;
  restore: (backup: any) => Promise<void>;
  
  // Actions - Utilities
  calculateAccuracy: (predictions: any[], actual: any[]) => number;
  optimizeModel: (modelId: string) => Promise<void>;
  validateInput: (input: any, type: string) => boolean;
  formatOutput: (output: any, format: string) => any;
  
  // Actions - Configuration
  updateConfig: (updates: Partial<AIConfig>) => void;
  resetConfig: () => void;
  saveConfig: () => void;
  loadConfig: () => void;
  
  // Actions - Analytics and Debug
  getAnalytics: () => AIAnalytics;
  getDebugInfo: () => any;
  logEvent: (event: Omit<AIEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

export const useAdvancedAIStore = create<AdvancedAIState>()(devtools((set, get) => ({
  // Initial State
  sentimentAnalyses: [],
  recommendations: [],
  corrections: [],
  thumbnails: [],
  models: [],
  tasks: [],
  insights: [],
  events: [],
  
  // Initial UI State
  isLoading: false,
  error: null,
  selectedAnalysis: null,
  selectedRecommendation: null,
  selectedCorrection: null,
  selectedThumbnail: null,
  activeTab: 'overview',
  searchQuery: '',
  filter: {},
  
  // Initial Configuration
  config: {
    enableRealtime: true,
    enableAutoCorrection: true,
    enableSmartRecommendations: true,
    enableThumbnailGeneration: true,
    sentimentThreshold: 0.7,
    recommendationLimit: 10,
    correctionSensitivity: 'medium',
    thumbnailStyles: ['dramatic', 'minimalist', 'colorful', 'professional', 'creative'],
    modelSettings: {},
    apiKeys: {},
  },
  
  stats: {
    totalAnalyses: 0,
    totalRecommendations: 0,
    totalCorrections: 0,
    totalThumbnails: 0,
    averageAccuracy: 0,
    processingTime: 0,
    activeModels: 0,
    successRate: 0,
  },
  
  analytics: {
    usage: { daily: [], weekly: [], monthly: [] },
    performance: { accuracy: [], speed: [], errors: [] },
    trends: { popularCategories: [], growingTrends: [], userPreferences: {} },
  },
  
  // Computed Values
  get filteredAnalyses() {
    const { sentimentAnalyses, filter, searchQuery } = get();
    return sentimentAnalyses.filter(analysis => {
      if (filter.sentiment && analysis.sentiment !== filter.sentiment) return false;
      if (filter.confidence && (analysis.confidence < filter.confidence.min || analysis.confidence > filter.confidence.max)) return false;
      if (filter.source && analysis.source !== filter.source) return false;
      if (searchQuery && !analysis.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  },
  
  get filteredRecommendations() {
    const { recommendations, filter, searchQuery } = get();
    return recommendations.filter(rec => {
      if (filter.type && rec.type !== filter.type) return false;
      if (filter.category && rec.category !== filter.category) return false;
      if (searchQuery && !rec.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  },
  
  get filteredCorrections() {
    const { corrections, searchQuery } = get();
    return corrections.filter(correction => {
      if (searchQuery && !correction.originalText.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  },
  
  get filteredThumbnails() {
    const { thumbnails, filter } = get();
    return thumbnails.filter(thumb => {
      if (filter.status && thumb.status !== filter.status) return false;
      return true;
    });
  },
  
  get activeTasks() {
    return get().tasks.filter(task => task.status === 'pending' || task.status === 'processing');
  },
  
  get recentInsights() {
    return get().insights.slice(0, 5);
  },
  
  get modelPerformance() {
    const { models } = get();
    return models.reduce((acc, model) => {
      acc[model.id] = model.accuracy;
      return acc;
    }, {} as Record<string, number>);
  },
  
  // Actions - Sentiment Analysis
  analyzeSentiment: async (text: string, source: SentimentAnalysis['source']) => {
    const analysis: SentimentAnalysis = {
      id: `analysis_${Date.now()}`,
      text,
      sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral',
      confidence: Math.random() * 0.4 + 0.6,
      emotions: {
        joy: Math.random(),
        anger: Math.random(),
        fear: Math.random(),
        sadness: Math.random(),
        surprise: Math.random(),
        disgust: Math.random(),
      },
      keywords: text.split(' ').slice(0, 5),
      language: 'pt',
      timestamp: new Date(),
      source,
    };
    
    set(state => ({
      sentimentAnalyses: [analysis, ...state.sentimentAnalyses],
      stats: { ...state.stats, totalAnalyses: state.stats.totalAnalyses + 1 },
    }));
    
    return analysis;
  },
  
  batchAnalyzeSentiment: async (texts) => {
    const analyses = await Promise.all(
      texts.map(({ text, source }) => get().analyzeSentiment(text, source))
    );
    return analyses;
  },
  
  deleteAnalysis: (id: string) => {
    set(state => ({
      sentimentAnalyses: state.sentimentAnalyses.filter(a => a.id !== id),
    }));
  },
  
  exportAnalyses: (format) => {
    const { filteredAnalyses } = get();
  },
  
  // Actions - Content Recommendations
  generateRecommendations: async (context) => {
    const recommendations: ContentRecommendation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `rec_${Date.now()}_${i}`,
      type: ['template', 'asset', 'effect', 'music', 'transition'][Math.floor(Math.random() * 5)] as any,
      title: `Recomendação ${i + 1}`,
      description: `Descrição da recomendação ${i + 1}`,
      thumbnailUrl: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20content%20recommendation&image_size=square`,
      relevanceScore: Math.random() * 0.4 + 0.6,
      category: ['Video', 'Audio', 'Graphics', 'Effects'][Math.floor(Math.random() * 4)],
      tags: [`tag${i}`, `category${i}`],
      usage: {
        views: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 1000),
        downloads: Math.floor(Math.random() * 500),
      },
      aiReason: `Recomendado baseado em ${context || 'análise de conteúdo'}`,
      timestamp: new Date(),
    }));
    
    set(state => ({
      recommendations: [...recommendations, ...state.recommendations],
      stats: { ...state.stats, totalRecommendations: state.stats.totalRecommendations + recommendations.length },
    }));
    
    return recommendations;
  },
  
  refreshRecommendations: async () => {
    await get().generateRecommendations('refresh');
  },
  
  likeRecommendation: (id: string) => {
  },
  
  dislikeRecommendation: (id: string) => {
  },
  
  applyRecommendation: (id: string) => {
  },
  
  // Actions - Script Corrections
  correctScript: async (text: string, options = {}) => {
    const correction: ScriptCorrection = {
      id: `correction_${Date.now()}`,
      originalText: text,
      correctedText: text.replace(/\b(teh)\b/g, 'the').replace(/\b(recieve)\b/g, 'receive'),
      corrections: [
        {
          type: 'spelling',
          position: { start: 0, end: 3 },
          original: 'teh',
          suggestion: 'the',
          confidence: 0.95,
          reason: 'Correção ortográfica comum',
        },
      ],
      overallScore: Math.random() * 0.3 + 0.7,
      language: 'pt',
      timestamp: new Date(),
    };
    
    set(state => ({
      corrections: [correction, ...state.corrections],
      stats: { ...state.stats, totalCorrections: state.stats.totalCorrections + 1 },
    }));
    
    return correction;
  },
  
  applyCorrection: (id: string, correctionIndex) => {
  },
  
  rejectCorrection: (id: string, correctionIndex: number) => {
  },
  
  saveCorrection: (id: string) => {
  },
  
  // Actions - Thumbnail Generation
  generateThumbnails: async (videoId: string, options = {}) => {
    const generation: ThumbnailGeneration = {
      id: `thumb_${Date.now()}`,
      videoId,
      thumbnails: Array.from({ length: 4 }, (_, i) => ({
        id: `thumb_${Date.now()}_${i}`,
        url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20thumbnail%20${i}&image_size=landscape_16_9`,
        style: ['dramatic', 'minimalist', 'colorful', 'professional'][i] as any,
        aiScore: Math.random() * 0.4 + 0.6,
        elements: [`element${i}`, `feature${i}`],
        colors: [`#${Math.floor(Math.random()*16777215).toString(16)}`],
        composition: `Composição ${i + 1}`,
      })),
      status: 'ready',
      timestamp: new Date(),
    };
    
    set(state => ({
      thumbnails: [generation, ...state.thumbnails],
      stats: { ...state.stats, totalThumbnails: state.stats.totalThumbnails + 1 },
    }));
    
    return generation;
  },
  
  selectThumbnail: (generationId: string, thumbnailId: string) => {
    set(state => ({
      thumbnails: state.thumbnails.map(gen => 
        gen.id === generationId 
          ? { ...gen, selectedThumbnailId: thumbnailId }
          : gen
      ),
    }));
  },
  
  regenerateThumbnail: async (generationId: string, style: string) => {
  },
  
  downloadThumbnail: (generationId: string, thumbnailId: string) => {
  },
  
  // Actions - Models
  loadModels: async () => {
    const models: AIModel[] = [
      {
        id: 'sentiment_v1',
        name: 'Sentiment Analyzer v1.0',
        type: 'sentiment',
        version: '1.0.0',
        accuracy: 0.92,
        speed: 150,
        status: 'active',
        lastTrained: new Date(),
        parameters: {},
      },
      {
        id: 'recommender_v1',
        name: 'Content Recommender v1.0',
        type: 'recommendation',
        version: '1.0.0',
        accuracy: 0.88,
        speed: 200,
        status: 'active',
        lastTrained: new Date(),
        parameters: {},
      },
    ];
    
    set({ models });
  },
  
  trainModel: async (modelId: string, data: any) => {
  },
  
  updateModel: (modelId: string, updates: Partial<AIModel>) => {
    set(state => ({
      models: state.models.map(model => 
        model.id === modelId ? { ...model, ...updates } : model
      ),
    }));
  },
  
  deleteModel: (id: string) => {
    set(state => ({
      models: state.models.filter(m => m.id !== id),
    }));
  },
  
  // Actions - Tasks
  createTask: (task) => {
    const newTask: AITask = {
      ...task,
      id: `task_${Date.now()}`,
      progress: 0,
      startTime: new Date(),
    };
    
    set(state => ({
      tasks: [newTask, ...state.tasks],
    }));
    
    return newTask.id;
  },
  
  updateTask: (id: string, updates: Partial<AITask>) => {
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  },
  
  cancelTask: (id: string) => {
    get().updateTask(id, { status: 'failed', error: 'Cancelled by user' });
  },
  
  retryTask: (id: string) => {
    get().updateTask(id, { status: 'pending', error: undefined, progress: 0 });
  },
  
  clearCompletedTasks: () => {
    set(state => ({
      tasks: state.tasks.filter(task => task.status !== 'completed'),
    }));
  },
  
  // Actions - Data Operations
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().loadModels();
      // Simulate loading demo data
      await get().generateRecommendations('initial load');
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load data' });
    }
  },
  
  refreshData: async () => {
    await get().loadData();
  },
  
  clearData: () => {
    set({
      sentimentAnalyses: [],
      recommendations: [],
      corrections: [],
      thumbnails: [],
      tasks: [],
      insights: [],
      events: [],
    });
  },
  
  exportData: (format) => {
    const state = get();
  },
  
  importData: (data) => {
    set(data);
  },
  
  // Actions - Search and Filter
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  setFilter: (filter: Partial<AIFilter>) => {
    set(state => ({ filter: { ...state.filter, ...filter } }));
  },
  
  clearFilter: () => {
    set({ filter: {}, searchQuery: '' });
  },
  
  saveFilter: (name: string, filter: AIFilter) => {
  },
  
  // Actions - UI
  setSelectedAnalysis: (analysis) => set({ selectedAnalysis: analysis }),
  setSelectedRecommendation: (recommendation) => set({ selectedRecommendation: recommendation }),
  setSelectedCorrection: (correction) => set({ selectedCorrection: correction }),
  setSelectedThumbnail: (thumbnail) => set({ selectedThumbnail: thumbnail }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Actions - Quick Actions
  quickAnalyze: async (text: string) => {
    await get().analyzeSentiment(text, 'script');
  },
  
  quickRecommend: async () => {
    await get().generateRecommendations('quick action');
  },
  
  quickCorrect: async (text: string) => {
    await get().correctScript(text);
  },
  
  quickGenerate: async (videoId: string) => {
    await get().generateThumbnails(videoId);
  },
  
  // Actions - Advanced Features
  createInsight: (insight) => {
    const newInsight: AIInsight = {
      ...insight,
      id: `insight_${Date.now()}`,
      timestamp: new Date(),
    };
    
    set(state => ({
      insights: [newInsight, ...state.insights],
    }));
  },
  
  dismissInsight: (id: string) => {
    set(state => ({
      insights: state.insights.filter(i => i.id !== id),
    }));
  },
  
  scheduleAnalysis: (schedule) => {
  },
  
  createWorkflow: (workflow) => {
  },
  
  // Actions - System
  initialize: async () => {
    await get().loadData();
  },
  
  cleanup: () => {
    get().clearData();
  },
  
  reset: () => {
    set({
      sentimentAnalyses: [],
      recommendations: [],
      corrections: [],
      thumbnails: [],
      models: [],
      tasks: [],
      insights: [],
      events: [],
      selectedAnalysis: null,
      selectedRecommendation: null,
      selectedCorrection: null,
      selectedThumbnail: null,
      searchQuery: '',
      filter: {},
      error: null,
    });
  },
  
  backup: async () => {
    const state = get();
  },
  
  restore: async (backup) => {
    set(backup);
  },
  
  // Actions - Utilities
  calculateAccuracy: (predictions, actual) => {
    const correct = predictions.filter((pred, i) => pred === actual[i]).length;
    return correct / predictions.length;
  },
  
  optimizeModel: async (modelId: string) => {
  },
  
  validateInput: (input, type) => {
    return input != null && typeof input === 'string';
  },
  
  formatOutput: (output, format) => {
    return format === 'json' ? JSON.stringify(output) : output;
  },
  
  // Actions - Configuration
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates },
    }));
  },
  
  resetConfig: () => {
    set({
      config: {
        enableRealtime: true,
        enableAutoCorrection: true,
        enableSmartRecommendations: true,
        enableThumbnailGeneration: true,
        sentimentThreshold: 0.7,
        recommendationLimit: 10,
        correctionSensitivity: 'medium',
        thumbnailStyles: ['dramatic', 'minimalist', 'colorful', 'professional', 'creative'],
        modelSettings: {},
        apiKeys: {},
      },
    });
  },
  
  saveConfig: () => {
    const { config } = get();
    localStorage.setItem('ai_config', JSON.stringify(config));
  },
  
  loadConfig: () => {
    const saved = localStorage.getItem('ai_config');
    if (saved) {
      set({ config: JSON.parse(saved) });
    }
  },
  
  // Actions - Analytics and Debug
  getAnalytics: () => {
    return get().analytics;
  },
  
  getDebugInfo: () => {
    const state = get();
    return {
      totalItems: {
        analyses: state.sentimentAnalyses.length,
        recommendations: state.recommendations.length,
        corrections: state.corrections.length,
        thumbnails: state.thumbnails.length,
        models: state.models.length,
        tasks: state.tasks.length,
      },
      performance: state.analytics.performance,
      config: state.config,
    };
  },
  
  logEvent: (event) => {
    const newEvent: AIEvent = {
      ...event,
      id: `event_${Date.now()}`,
      timestamp: new Date(),
    };
    
    set(state => ({
      events: [newEvent, ...state.events.slice(0, 99)], // Keep last 100 events
    }));
  },
  
  clearEvents: () => {
    set({ events: [] });
  },
}), { name: 'advanced-ai-store' }));

// ============================================================================
// MANAGER CLASS
// ============================================================================

export class AdvancedAIManager {
  private static instance: AdvancedAIManager;
  
  static getInstance(): AdvancedAIManager {
    if (!AdvancedAIManager.instance) {
      AdvancedAIManager.instance = new AdvancedAIManager();
    }
    return AdvancedAIManager.instance;
  }
  
  async initialize() {
    const store = useAdvancedAIStore.getState();
    await store.initialize();
  }
  
  async analyzeSentiment(text: string, source: SentimentAnalysis['source']) {
    const store = useAdvancedAIStore.getState();
    return await store.analyzeSentiment(text, source);
  }
  
  async generateRecommendations(context?: any) {
    const store = useAdvancedAIStore.getState();
    return await store.generateRecommendations(context);
  }
  
  async correctScript(text: string, options?: any) {
    const store = useAdvancedAIStore.getState();
    return await store.correctScript(text, options);
  }
  
  async generateThumbnails(videoId: string, options?: any) {
    const store = useAdvancedAIStore.getState();
    return await store.generateThumbnails(videoId, options);
  }
}

// Global instance
export const aiManager = AdvancedAIManager.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

export const getSentimentColor = (sentiment: SentimentAnalysis['sentiment']): string => {
  switch (sentiment) {
    case 'positive': return 'text-green-600';
    case 'negative': return 'text-red-600';
    case 'neutral': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getTaskStatusIcon = (status: AITask['status']): string => {
  switch (status) {
    case 'pending': return 'Clock';
    case 'processing': return 'Loader';
    case 'completed': return 'CheckCircle';
    case 'failed': return 'XCircle';
    default: return 'Circle';
  }
};

export const calculateAIScore = (metrics: any): number => {
  const { accuracy = 0, speed = 0, usage = 0 } = metrics;
  return (accuracy * 0.5 + (speed / 1000) * 0.3 + (usage / 100) * 0.2) * 100;
};

export const generateAIRecommendations = (data: any): string[] => {
  const recommendations = [];
  
  if (data.accuracy < 0.8) {
    recommendations.push('Considere retreinar o modelo para melhorar a precisão');
  }
  
  if (data.speed > 1000) {
    recommendations.push('Otimize o modelo para reduzir o tempo de processamento');
  }
  
  if (data.usage < 50) {
    recommendations.push('Promova mais o uso das funcionalidades de IA');
  }
  
  return recommendations;
};

// Hook for easy access to the store
export const useAdvancedAI = () => {
  return useAdvancedAIStore();
};

export default useAdvancedAIStore;