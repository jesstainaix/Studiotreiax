import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  compound: number;
}

export interface EmotionScore {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface TextAnalysis {
  id: string;
  text: string;
  timestamp: Date;
  sentiment: SentimentScore;
  emotions: EmotionScore;
  confidence: number;
  language: string;
  keywords: string[];
  entities: {
    type: 'person' | 'organization' | 'location' | 'product' | 'event';
    text: string;
    confidence: number;
  }[];
  topics: {
    name: string;
    relevance: number;
  }[];
  toxicity: {
    score: number;
    categories: string[];
  };
  readability: {
    score: number;
    level: 'elementary' | 'middle' | 'high' | 'college' | 'graduate';
  };
  metadata: {
    source: string;
    userId?: string;
    sessionId?: string;
    context?: string;
  };
}

export interface SentimentTrend {
  timestamp: Date;
  sentiment: SentimentScore;
  volume: number;
  topics: string[];
}

export interface AnalysisFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  sentimentRange: {
    min: number;
    max: number;
  };
  emotions: string[];
  sources: string[];
  languages: string[];
  keywords: string[];
  minConfidence: number;
}

export interface AnalysisConfig {
  realTime: {
    enabled: boolean;
    batchSize: number;
    processingInterval: number;
    autoSave: boolean;
  };
  models: {
    sentimentModel: 'vader' | 'textblob' | 'transformers' | 'custom';
    emotionModel: 'plutchik' | 'ekman' | 'custom';
    languageDetection: boolean;
    entityRecognition: boolean;
    topicModeling: boolean;
  };
  thresholds: {
    sentimentConfidence: number;
    emotionConfidence: number;
    toxicityThreshold: number;
    spamThreshold: number;
  };
  alerts: {
    enabled: boolean;
    negativeThreshold: number;
    toxicityThreshold: number;
    volumeThreshold: number;
    emailNotifications: boolean;
  };
  privacy: {
    anonymizeData: boolean;
    dataRetention: number; // days
    encryptStorage: boolean;
  };
}

export interface AnalysisStats {
  totalAnalyses: number;
  todayAnalyses: number;
  averageSentiment: SentimentScore;
  topEmotions: { emotion: string; percentage: number }[];
  languageDistribution: { language: string; count: number }[];
  topKeywords: { keyword: string; frequency: number }[];
  sentimentTrend: 'improving' | 'declining' | 'stable';
  processingSpeed: number; // analyses per second
  accuracy: number;
  systemHealth: number;
}

export interface AnalysisMetrics {
  performance: {
    avgProcessingTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  quality: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  usage: {
    dailyVolume: number;
    peakHours: number[];
    topSources: string[];
    userEngagement: number;
  };
}

// Utility functions
export const formatSentimentScore = (score: number): string => {
  if (score >= 0.5) return 'Very Positive';
  if (score >= 0.1) return 'Positive';
  if (score >= -0.1) return 'Neutral';
  if (score >= -0.5) return 'Negative';
  return 'Very Negative';
};

export const getSentimentColor = (score: number): string => {
  if (score >= 0.5) return 'green';
  if (score >= 0.1) return 'blue';
  if (score >= -0.1) return 'gray';
  if (score >= -0.5) return 'orange';
  return 'red';
};

export const getEmotionIcon = (emotion: string): string => {
  const icons: Record<string, string> = {
    joy: '😊',
    sadness: '😢',
    anger: '😠',
    fear: '😨',
    surprise: '😲',
    disgust: '🤢',
    trust: '🤝',
    anticipation: '🤔'
  };
  return icons[emotion] || '😐';
};

export const calculateSentimentHealth = (analyses: TextAnalysis[]): number => {
  if (analyses.length === 0) return 100;
  
  const avgSentiment = analyses.reduce((sum, analysis) => sum + analysis.sentiment.compound, 0) / analyses.length;
  const avgConfidence = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length;
  const toxicityRate = analyses.filter(a => a.toxicity.score > 0.7).length / analyses.length;
  
  return Math.max(0, Math.min(100, 
    (avgSentiment + 1) * 30 + // Sentiment contribution (0-60)
    avgConfidence * 30 + // Confidence contribution (0-30)
    (1 - toxicityRate) * 10 // Toxicity penalty (0-10)
  ));
};

export const generateSentimentRecommendations = (stats: AnalysisStats): string[] => {
  const recommendations: string[] = [];
  
  if (stats.averageSentiment.compound < -0.2) {
    recommendations.push('Consider implementing positive engagement strategies');
  }
  
  if (stats.topEmotions.some(e => e.emotion === 'anger' && e.percentage > 20)) {
    recommendations.push('Address sources of user frustration');
  }
  
  if (stats.processingSpeed < 10) {
    recommendations.push('Optimize sentiment analysis performance');
  }
  
  if (stats.accuracy < 85) {
    recommendations.push('Retrain sentiment models for better accuracy');
  }
  
  return recommendations;
};

// Zustand Store
interface SentimentAnalysisState {
  // Data
  analyses: TextAnalysis[];
  trends: SentimentTrend[];
  stats: AnalysisStats;
  metrics: AnalysisMetrics;
  config: AnalysisConfig;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedAnalysis: string | null;
  selectedTimeRange: string;
  filter: AnalysisFilter;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  
  // Computed
  filteredAnalyses: TextAnalysis[];
  recentAnalyses: TextAnalysis[];
  sentimentDistribution: { label: string; value: number }[];
  emotionDistribution: { emotion: string; score: number }[];
  topKeywords: { keyword: string; frequency: number }[];
  languageStats: { language: string; count: number; percentage: number }[];
  
  // Real-time
  isRealTimeEnabled: boolean;
  processingQueue: string[];
  batchProgress: number;
  
  // Actions
  analyzeText: (text: string, metadata?: Partial<TextAnalysis['metadata']>) => Promise<TextAnalysis>;
  analyzeBatch: (texts: { text: string; metadata?: Partial<TextAnalysis['metadata']> }[]) => Promise<TextAnalysis[]>;
  getAnalysis: (id: string) => TextAnalysis | null;
  deleteAnalysis: (id: string) => Promise<void>;
  updateAnalysis: (id: string, updates: Partial<TextAnalysis>) => Promise<void>;
  
  // Filtering and Search
  setFilter: (filter: Partial<AnalysisFilter>) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSelectedTimeRange: (range: string) => void;
  
  // Real-time
  startRealTimeAnalysis: () => void;
  stopRealTimeAnalysis: () => void;
  processQueue: () => Promise<void>;
  addToQueue: (text: string, metadata?: Partial<TextAnalysis['metadata']>) => void;
  
  // Configuration
  updateConfig: (config: Partial<AnalysisConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;
  
  // Analytics
  refreshStats: () => Promise<void>;
  generateReport: (format: 'json' | 'csv' | 'pdf') => Promise<string>;
  exportAnalyses: (format: 'json' | 'csv', filter?: Partial<AnalysisFilter>) => Promise<string>;
  
  // System
  refresh: () => Promise<void>;
  reset: () => void;
  cleanup: () => Promise<void>;
}

const defaultConfig: AnalysisConfig = {
  realTime: {
    enabled: true,
    batchSize: 10,
    processingInterval: 1000,
    autoSave: true
  },
  models: {
    sentimentModel: 'vader',
    emotionModel: 'plutchik',
    languageDetection: true,
    entityRecognition: true,
    topicModeling: true
  },
  thresholds: {
    sentimentConfidence: 0.7,
    emotionConfidence: 0.6,
    toxicityThreshold: 0.8,
    spamThreshold: 0.9
  },
  alerts: {
    enabled: true,
    negativeThreshold: -0.5,
    toxicityThreshold: 0.8,
    volumeThreshold: 100,
    emailNotifications: false
  },
  privacy: {
    anonymizeData: false,
    dataRetention: 30,
    encryptStorage: false
  }
};

const defaultFilter: AnalysisFilter = {
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  sentimentRange: {
    min: -1,
    max: 1
  },
  emotions: [],
  sources: [],
  languages: [],
  keywords: [],
  minConfidence: 0
};

export const useSentimentAnalysisStore = create<SentimentAnalysisState>()(subscribeWithSelector((set, get) => ({
  // Initial state
  analyses: [],
  trends: [],
  stats: {
    totalAnalyses: 0,
    todayAnalyses: 0,
    averageSentiment: { positive: 0, negative: 0, neutral: 0, compound: 0 },
    topEmotions: [],
    languageDistribution: [],
    topKeywords: [],
    sentimentTrend: 'stable',
    processingSpeed: 0,
    accuracy: 0,
    systemHealth: 100
  },
  metrics: {
    performance: {
      avgProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      uptime: 100
    },
    quality: {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0
    },
    usage: {
      dailyVolume: 0,
      peakHours: [],
      topSources: [],
      userEngagement: 0
    }
  },
  config: defaultConfig,
  
  // UI State
  isLoading: false,
  error: null,
  selectedAnalysis: null,
  selectedTimeRange: '7d',
  filter: defaultFilter,
  sortBy: 'timestamp',
  sortOrder: 'desc',
  searchQuery: '',
  
  // Computed
  get filteredAnalyses() {
    const { analyses, filter, searchQuery, sortBy, sortOrder } = get();
    
    const filtered = analyses.filter(analysis => {
      // Date range filter
      if (analysis.timestamp < filter.dateRange.start || analysis.timestamp > filter.dateRange.end) {
        return false;
      }
      
      // Sentiment range filter
      if (analysis.sentiment.compound < filter.sentimentRange.min || analysis.sentiment.compound > filter.sentimentRange.max) {
        return false;
      }
      
      // Confidence filter
      if (analysis.confidence < filter.minConfidence) {
        return false;
      }
      
      // Language filter
      if (filter.languages.length > 0 && !filter.languages.includes(analysis.language)) {
        return false;
      }
      
      // Source filter
      if (filter.sources.length > 0 && !filter.sources.includes(analysis.metadata.source)) {
        return false;
      }
      
      // Keywords filter
      if (filter.keywords.length > 0) {
        const hasKeyword = filter.keywords.some(keyword => 
          analysis.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
        );
        if (!hasKeyword) return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          analysis.text.toLowerCase().includes(query) ||
          analysis.keywords.some(k => k.toLowerCase().includes(query)) ||
          analysis.entities.some(e => e.text.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        case 'sentiment':
          aValue = a.sentiment.compound;
          bValue = b.sentiment.compound;
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'text':
          aValue = a.text.length;
          bValue = b.text.length;
          break;
        default:
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  },
  
  get recentAnalyses() {
    const { analyses } = get();
    return analyses
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  },
  
  get sentimentDistribution() {
    const { filteredAnalyses } = get();
    
    if (filteredAnalyses.length === 0) {
      return [
        { label: 'Positive', value: 0 },
        { label: 'Neutral', value: 0 },
        { label: 'Negative', value: 0 }
      ];
    }
    
    const positive = filteredAnalyses.filter(a => a.sentiment.compound > 0.1).length;
    const neutral = filteredAnalyses.filter(a => a.sentiment.compound >= -0.1 && a.sentiment.compound <= 0.1).length;
    const negative = filteredAnalyses.filter(a => a.sentiment.compound < -0.1).length;
    
    const total = filteredAnalyses.length;
    
    return [
      { label: 'Positive', value: (positive / total) * 100 },
      { label: 'Neutral', value: (neutral / total) * 100 },
      { label: 'Negative', value: (negative / total) * 100 }
    ];
  },
  
  get emotionDistribution() {
    const { filteredAnalyses } = get();
    
    if (filteredAnalyses.length === 0) {
      return Object.keys(filteredAnalyses[0]?.emotions || {}).map(emotion => ({
        emotion,
        score: 0
      }));
    }
    
    const emotionTotals: Record<string, number> = {};
    
    filteredAnalyses.forEach(analysis => {
      Object.entries(analysis.emotions).forEach(([emotion, score]) => {
        emotionTotals[emotion] = (emotionTotals[emotion] || 0) + score;
      });
    });
    
    return Object.entries(emotionTotals).map(([emotion, total]) => ({
      emotion,
      score: total / filteredAnalyses.length
    })).sort((a, b) => b.score - a.score);
  },
  
  get topKeywords() {
    const { filteredAnalyses } = get();
    const keywordCounts: Record<string, number> = {};
    
    filteredAnalyses.forEach(analysis => {
      analysis.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });
    
    return Object.entries(keywordCounts)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  },
  
  get languageStats() {
    const { filteredAnalyses } = get();
    const languageCounts: Record<string, number> = {};
    
    filteredAnalyses.forEach(analysis => {
      languageCounts[analysis.language] = (languageCounts[analysis.language] || 0) + 1;
    });
    
    const total = filteredAnalyses.length;
    
    return Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  },
  
  // Real-time state
  isRealTimeEnabled: false,
  processingQueue: [],
  batchProgress: 0,
  
  // Actions
  analyzeText: async (text: string, metadata = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate AI analysis (replace with actual API calls)
      const analysis: TextAnalysis = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        timestamp: new Date(),
        sentiment: {
          positive: Math.random() * 0.5 + 0.25,
          negative: Math.random() * 0.3,
          neutral: Math.random() * 0.4 + 0.3,
          compound: (Math.random() - 0.5) * 2
        },
        emotions: {
          joy: Math.random(),
          sadness: Math.random() * 0.5,
          anger: Math.random() * 0.3,
          fear: Math.random() * 0.4,
          surprise: Math.random() * 0.6,
          disgust: Math.random() * 0.2,
          trust: Math.random() * 0.8,
          anticipation: Math.random() * 0.7
        },
        confidence: Math.random() * 0.3 + 0.7,
        language: 'en',
        keywords: text.split(' ').filter(word => word.length > 3).slice(0, 5),
        entities: [],
        topics: [],
        toxicity: {
          score: Math.random() * 0.3,
          categories: []
        },
        readability: {
          score: Math.random() * 40 + 60,
          level: 'middle'
        },
        metadata: {
          source: 'manual',
          ...metadata
        }
      };
      
      set(state => ({
        analyses: [analysis, ...state.analyses],
        isLoading: false
      }));
      
      // Update stats
      get().refreshStats();
      
      return analysis;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Analysis failed', isLoading: false });
      throw error;
    }
  },
  
  analyzeBatch: async (texts) => {
    set({ isLoading: true, error: null, batchProgress: 0 });
    
    try {
      const analyses: TextAnalysis[] = [];
      
      for (let i = 0; i < texts.length; i++) {
        const analysis = await get().analyzeText(texts[i].text, texts[i].metadata);
        analyses.push(analysis);
        
        set({ batchProgress: ((i + 1) / texts.length) * 100 });
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      set({ isLoading: false, batchProgress: 0 });
      return analyses;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Batch analysis failed', isLoading: false, batchProgress: 0 });
      throw error;
    }
  },
  
  getAnalysis: (id: string) => {
    const { analyses } = get();
    return analyses.find(analysis => analysis.id === id) || null;
  },
  
  deleteAnalysis: async (id: string) => {
    set(state => ({
      analyses: state.analyses.filter(analysis => analysis.id !== id)
    }));
    
    get().refreshStats();
  },
  
  updateAnalysis: async (id: string, updates: Partial<TextAnalysis>) => {
    set(state => ({
      analyses: state.analyses.map(analysis => 
        analysis.id === id ? { ...analysis, ...updates } : analysis
      )
    }));
  },
  
  // Filtering and Search
  setFilter: (filter: Partial<AnalysisFilter>) => {
    set(state => ({
      filter: { ...state.filter, ...filter }
    }));
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  setSortBy: (sortBy: string) => {
    set({ sortBy });
  },
  
  setSortOrder: (order: 'asc' | 'desc') => {
    set({ sortOrder: order });
  },
  
  setSelectedTimeRange: (range: string) => {
    set({ selectedTimeRange: range });
    
    // Update filter based on range
    const now = new Date();
    let start: Date;
    
    switch (range) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    get().setFilter({
      dateRange: { start, end: now }
    });
  },
  
  // Real-time
  startRealTimeAnalysis: () => {
    set({ isRealTimeEnabled: true });
    
    // Start processing queue periodically
    const interval = setInterval(() => {
      if (get().isRealTimeEnabled && get().processingQueue.length > 0) {
        get().processQueue();
      }
    }, get().config.realTime.processingInterval);
    
    // Store interval for cleanup
    (get() as any).realTimeInterval = interval;
  },
  
  stopRealTimeAnalysis: () => {
    set({ isRealTimeEnabled: false });
    
    const interval = (get() as any).realTimeInterval;
    if (interval) {
      clearInterval(interval);
    }
  },
  
  processQueue: async () => {
    const { processingQueue, config } = get();
    
    if (processingQueue.length === 0) return;
    
    const batch = processingQueue.slice(0, config.realTime.batchSize);
    
    try {
      await Promise.all(
        batch.map(text => get().analyzeText(text, { source: 'realtime' }))
      );
      
      set(state => ({
        processingQueue: state.processingQueue.slice(config.realTime.batchSize)
      }));
    } catch (error) {
      console.error('Queue processing failed:', error);
    }
  },
  
  addToQueue: (text: string, metadata = {}) => {
    set(state => ({
      processingQueue: [...state.processingQueue, text]
    }));
  },
  
  // Configuration
  updateConfig: (config: Partial<AnalysisConfig>) => {
    set(state => ({
      config: { ...state.config, ...config }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  exportConfig: () => {
    return JSON.stringify(get().config, null, 2);
  },
  
  importConfig: (configStr: string) => {
    try {
      const config = JSON.parse(configStr);
      set({ config });
    } catch (error) {
      set({ error: 'Invalid configuration format' });
    }
  },
  
  // Analytics
  refreshStats: async () => {
    const { analyses, filteredAnalyses } = get();
    
    if (analyses.length === 0) {
      set({
        stats: {
          totalAnalyses: 0,
          todayAnalyses: 0,
          averageSentiment: { positive: 0, negative: 0, neutral: 0, compound: 0 },
          topEmotions: [],
          languageDistribution: [],
          topKeywords: [],
          sentimentTrend: 'stable',
          processingSpeed: 0,
          accuracy: 85,
          systemHealth: 100
        }
      });
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAnalyses = analyses.filter(a => a.timestamp >= today).length;
    
    // Calculate average sentiment
    const avgSentiment = analyses.reduce((acc, analysis) => ({
      positive: acc.positive + analysis.sentiment.positive,
      negative: acc.negative + analysis.sentiment.negative,
      neutral: acc.neutral + analysis.sentiment.neutral,
      compound: acc.compound + analysis.sentiment.compound
    }), { positive: 0, negative: 0, neutral: 0, compound: 0 });
    
    Object.keys(avgSentiment).forEach(key => {
      (avgSentiment as any)[key] /= analyses.length;
    });
    
    // Calculate top emotions
    const emotionTotals: Record<string, number> = {};
    analyses.forEach(analysis => {
      Object.entries(analysis.emotions).forEach(([emotion, score]) => {
        emotionTotals[emotion] = (emotionTotals[emotion] || 0) + score;
      });
    });
    
    const topEmotions = Object.entries(emotionTotals)
      .map(([emotion, total]) => ({
        emotion,
        percentage: (total / analyses.length) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
    
    // Language distribution
    const languageCounts: Record<string, number> = {};
    analyses.forEach(analysis => {
      languageCounts[analysis.language] = (languageCounts[analysis.language] || 0) + 1;
    });
    
    const languageDistribution = Object.entries(languageCounts)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);
    
    // Top keywords
    const keywordCounts: Record<string, number> = {};
    analyses.forEach(analysis => {
      analysis.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });
    
    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    // Calculate trend
    const recentAnalyses = analyses.filter(a => 
      a.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const olderAnalyses = analyses.filter(a => 
      a.timestamp >= new Date(Date.now() - 48 * 60 * 60 * 1000) &&
      a.timestamp < new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    let sentimentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    
    if (recentAnalyses.length > 0 && olderAnalyses.length > 0) {
      const recentAvg = recentAnalyses.reduce((sum, a) => sum + a.sentiment.compound, 0) / recentAnalyses.length;
      const olderAvg = olderAnalyses.reduce((sum, a) => sum + a.sentiment.compound, 0) / olderAnalyses.length;
      
      if (recentAvg > olderAvg + 0.1) sentimentTrend = 'improving';
      else if (recentAvg < olderAvg - 0.1) sentimentTrend = 'declining';
    }
    
    set({
      stats: {
        totalAnalyses: analyses.length,
        todayAnalyses,
        averageSentiment: avgSentiment as SentimentScore,
        topEmotions,
        languageDistribution,
        topKeywords,
        sentimentTrend,
        processingSpeed: Math.random() * 20 + 10, // Simulated
        accuracy: Math.random() * 10 + 85, // Simulated
        systemHealth: calculateSentimentHealth(analyses)
      }
    });
  },
  
  generateReport: async (format: 'json' | 'csv' | 'pdf') => {
    const { filteredAnalyses, stats } = get();
    
    switch (format) {
      case 'json':
        return JSON.stringify({ analyses: filteredAnalyses, stats }, null, 2);
      case 'csv':
        const headers = ['ID', 'Text', 'Timestamp', 'Sentiment', 'Confidence', 'Language'];
        const rows = filteredAnalyses.map(a => [
          a.id,
          a.text.replace(/"/g, '""'),
          a.timestamp.toISOString(),
          a.sentiment.compound.toFixed(3),
          a.confidence.toFixed(3),
          a.language
        ]);
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      case 'pdf':
        return 'PDF generation not implemented';
      default:
        throw new Error('Unsupported format');
    }
  },
  
  exportAnalyses: async (format: 'json' | 'csv', filter) => {
    // Apply additional filter if provided
    const analyses = get().filteredAnalyses;
    
    if (filter) {
      // Apply additional filtering logic here
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify(analyses, null, 2);
      case 'csv':
        const headers = ['ID', 'Text', 'Timestamp', 'Sentiment', 'Confidence', 'Language', 'Keywords'];
        const rows = analyses.map(a => [
          a.id,
          a.text.replace(/"/g, '""'),
          a.timestamp.toISOString(),
          a.sentiment.compound.toFixed(3),
          a.confidence.toFixed(3),
          a.language,
          a.keywords.join('; ')
        ]);
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      default:
        throw new Error('Unsupported format');
    }
  },
  
  // System
  refresh: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await get().refreshStats();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Refresh failed', isLoading: false });
    }
  },
  
  reset: () => {
    set({
      analyses: [],
      trends: [],
      selectedAnalysis: null,
      searchQuery: '',
      filter: defaultFilter,
      error: null
    });
  },
  
  cleanup: async () => {
    const { analyses, config } = get();
    const cutoffDate = new Date(Date.now() - config.privacy.dataRetention * 24 * 60 * 60 * 1000);
    
    set(state => ({
      analyses: state.analyses.filter(analysis => analysis.timestamp >= cutoffDate)
    }));
    
    get().refreshStats();
  }
})));

// Global instance
export class SentimentAnalysisManager {
  private static instance: SentimentAnalysisManager;
  
  static getInstance(): SentimentAnalysisManager {
    if (!SentimentAnalysisManager.instance) {
      SentimentAnalysisManager.instance = new SentimentAnalysisManager();
    }
    return SentimentAnalysisManager.instance;
  }
  
  async analyzeText(text: string, metadata?: Partial<TextAnalysis['metadata']>): Promise<TextAnalysis> {
    return useSentimentAnalysisStore.getState().analyzeText(text, metadata);
  }
  
  async analyzeBatch(texts: { text: string; metadata?: Partial<TextAnalysis['metadata']> }[]): Promise<TextAnalysis[]> {
    return useSentimentAnalysisStore.getState().analyzeBatch(texts);
  }
  
  startRealTimeAnalysis(): void {
    useSentimentAnalysisStore.getState().startRealTimeAnalysis();
  }
  
  stopRealTimeAnalysis(): void {
    useSentimentAnalysisStore.getState().stopRealTimeAnalysis();
  }
  
  addToQueue(text: string, metadata?: Partial<TextAnalysis['metadata']>): void {
    useSentimentAnalysisStore.getState().addToQueue(text, metadata);
  }
}

export const sentimentAnalysisManager = SentimentAnalysisManager.getInstance();