import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interfaces para análise de sentimentos
export interface SentimentAnalysis {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  keywords: string[];
  topics: string[];
  language: string;
  timestamp: number;
  provider: string;
  processingTime: number;
}

export interface SentimentProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  priority: number;
  rateLimit: {
    requests: number;
    window: number; // em segundos
    current: number;
    resetTime: number;
  };
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastUsed: number;
  };
}

export interface SentimentBatch {
  id: string;
  texts: string[];
  results: SentimentAnalysis[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  provider: string;
  error?: string;
}

export interface SentimentConfig {
  defaultProvider: string;
  fallbackProviders: string[];
  batchSize: number;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  realTimeEnabled: boolean;
  confidenceThreshold: number;
  languageDetection: boolean;
  emotionAnalysis: boolean;
  keywordExtraction: boolean;
  topicModeling: boolean;
}

export interface SentimentStats {
  totalAnalyses: number;
  averageConfidence: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  topEmotions: Array<{ emotion: string; frequency: number }>;
  topKeywords: Array<{ keyword: string; frequency: number }>;
  topTopics: Array<{ topic: string; frequency: number }>;
  languageDistribution: Record<string, number>;
  providerPerformance: Record<string, {
    accuracy: number;
    speed: number;
    reliability: number;
  }>;
}

export interface SentimentEvent {
  id: string;
  type: 'analysis_started' | 'analysis_completed' | 'batch_processed' | 'provider_switched' | 'error_occurred' | 'cache_hit' | 'rate_limit_exceeded';
  timestamp: number;
  data: any;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface SentimentDebugLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

// Store do Zustand para gerenciamento de estado
interface SentimentStore {
  // Estado
  analyses: SentimentAnalysis[];
  providers: SentimentProvider[];
  batches: SentimentBatch[];
  config: SentimentConfig;
  stats: SentimentStats;
  events: SentimentEvent[];
  debugLogs: SentimentDebugLog[];
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Valores computados
  activeProviders: SentimentProvider[];
  recentAnalyses: SentimentAnalysis[];
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    score: number;
    issues: string[];
  };
  
  // Ações principais
  initialize: () => Promise<void>;
  analyzeSentiment: (text: string, options?: { provider?: string; realTime?: boolean }) => Promise<SentimentAnalysis>;
  analyzeBatch: (texts: string[], options?: { provider?: string; batchSize?: number }) => Promise<SentimentBatch>;
  
  // Gerenciamento de provedores
  addProvider: (provider: Omit<SentimentProvider, 'id' | 'stats'>) => void;
  updateProvider: (id: string, updates: Partial<SentimentProvider>) => void;
  removeProvider: (id: string) => void;
  testProvider: (id: string) => Promise<boolean>;
  switchProvider: (id: string) => void;
  
  // Configuração
  updateConfig: (updates: Partial<SentimentConfig>) => void;
  resetConfig: () => void;
  
  // Cache e otimização
  clearCache: () => void;
  optimizeProviders: () => void;
  
  // Ações rápidas
  quickAnalyze: (text: string) => Promise<SentimentAnalysis>;
  getRecommendations: (analysis: SentimentAnalysis) => string[];
  
  // Funcionalidades avançadas
  compareAnalyses: (analyses: SentimentAnalysis[]) => any;
  generateReport: (timeRange?: { start: number; end: number }) => any;
  exportData: (format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
  
  // Operações do sistema
  cleanup: () => void;
  reset: () => void;
  
  // Utilitários
  formatAnalysis: (analysis: SentimentAnalysis) => string;
  validateText: (text: string) => boolean;
  
  // Helpers de configuração
  getProviderConfig: (id: string) => SentimentProvider | null;
  isProviderAvailable: (id: string) => boolean;
  
  // Helpers de analytics
  getAnalyticsData: () => any;
  trackEvent: (event: Omit<SentimentEvent, 'id' | 'timestamp'>) => void;
  
  // Helpers de debug
  addDebugLog: (log: Omit<SentimentDebugLog, 'id' | 'timestamp'>) => void;
  clearDebugLogs: () => void;
  exportDebugLogs: () => Promise<Blob>;
}

// Implementação do store
export const useSentimentStore = create<SentimentStore>()(devtools((set, get) => ({
  // Estado inicial
  analyses: [],
  providers: [
    {
      id: 'openai',
      name: 'OpenAI GPT',
      enabled: true,
      model: 'gpt-3.5-turbo',
      priority: 1,
      rateLimit: {
        requests: 100,
        window: 60,
        current: 0,
        resetTime: Date.now() + 60000
      },
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: 0
      }
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      enabled: true,
      model: 'claude-3-sonnet',
      priority: 2,
      rateLimit: {
        requests: 50,
        window: 60,
        current: 0,
        resetTime: Date.now() + 60000
      },
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: 0
      }
    },
    {
      id: 'google',
      name: 'Google Gemini',
      enabled: true,
      model: 'gemini-pro',
      priority: 3,
      rateLimit: {
        requests: 60,
        window: 60,
        current: 0,
        resetTime: Date.now() + 60000
      },
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: 0
      }
    }
  ],
  batches: [],
  config: {
    defaultProvider: 'openai',
    fallbackProviders: ['anthropic', 'google'],
    batchSize: 10,
    timeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hora
    realTimeEnabled: true,
    confidenceThreshold: 0.7,
    languageDetection: true,
    emotionAnalysis: true,
    keywordExtraction: true,
    topicModeling: true
  },
  stats: {
    totalAnalyses: 0,
    averageConfidence: 0,
    sentimentDistribution: {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0
    },
    topEmotions: [],
    topKeywords: [],
    topTopics: [],
    languageDistribution: {},
    providerPerformance: {}
  },
  events: [],
  debugLogs: [],
  isInitialized: false,
  isProcessing: false,
  error: null,
  
  // Valores computados
  get activeProviders() {
    return get().providers.filter(p => p.enabled);
  },
  
  get recentAnalyses() {
    return get().analyses
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  },
  
  get systemHealth() {
    const { providers, stats } = get();
    const activeCount = providers.filter(p => p.enabled).length;
    const totalRequests = stats.totalAnalyses;
    const avgConfidence = stats.averageConfidence;
    
    let score = 100;
    const issues: string[] = [];
    
    if (activeCount === 0) {
      score -= 50;
      issues.push('Nenhum provedor ativo');
    }
    
    if (avgConfidence < 0.7) {
      score -= 20;
      issues.push('Baixa confiança média');
    }
    
    if (totalRequests > 1000 && avgConfidence < 0.8) {
      score -= 15;
      issues.push('Performance degradada');
    }
    
    const status = score >= 80 ? 'healthy' : score >= 60 ? 'degraded' : 'critical';
    
    return { status, score, issues };
  },
  
  // Implementação das ações
  initialize: async () => {
    set({ isInitialized: false, error: null });
    
    try {
      // Inicializar provedores
      const { providers } = get();
      for (const provider of providers) {
        if (provider.enabled) {
          await get().testProvider(provider.id);
        }
      }
      
      set({ isInitialized: true });
      get().addDebugLog({
        level: 'info',
        category: 'initialization',
        message: 'Sistema de análise de sentimentos inicializado com sucesso'
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro na inicialização' });
      get().addDebugLog({
        level: 'error',
        category: 'initialization',
        message: 'Falha na inicialização',
        data: error
      });
    }
  },
  
  analyzeSentiment: async (text: string, options = {}) => {
    const startTime = Date.now();
    set({ isProcessing: true, error: null });
    
    try {
      const { config, providers } = get();
      const provider = providers.find(p => p.id === (options.provider || config.defaultProvider));
      
      if (!provider || !provider.enabled) {
        throw new Error('Provedor não disponível');
      }
      
      // Simular análise de sentimentos (implementação real seria com API)
      const analysis: SentimentAnalysis = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        sentiment: ['positive', 'negative', 'neutral', 'mixed'][Math.floor(Math.random() * 4)] as any,
        confidence: 0.7 + Math.random() * 0.3,
        emotions: {
          joy: Math.random(),
          sadness: Math.random(),
          anger: Math.random(),
          fear: Math.random(),
          surprise: Math.random(),
          disgust: Math.random()
        },
        keywords: text.split(' ').filter(word => word.length > 3).slice(0, 5),
        topics: ['technology', 'business', 'entertainment'][Math.floor(Math.random() * 3)] ? ['technology'] : [],
        language: 'pt',
        timestamp: Date.now(),
        provider: provider.id,
        processingTime: Date.now() - startTime
      };
      
      // Atualizar estado
      set(state => ({
        analyses: [analysis, ...state.analyses].slice(0, 1000), // Manter apenas 1000 análises
        isProcessing: false
      }));
      
      // Atualizar estatísticas
      get().updateStats(analysis);
      
      // Registrar evento
      get().trackEvent({
        type: 'analysis_completed',
        data: { analysisId: analysis.id, provider: provider.id },
        severity: 'info',
        message: `Análise concluída com ${(analysis.confidence * 100).toFixed(1)}% de confiança`
      });
      
      return analysis;
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Erro na análise' });
      throw error;
    }
  },
  
  analyzeBatch: async (texts: string[], options = {}) => {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batch: SentimentBatch = {
      id: batchId,
      texts,
      results: [],
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      provider: options.provider || get().config.defaultProvider
    };
    
    set(state => ({
      batches: [batch, ...state.batches]
    }));
    
    try {
      batch.status = 'processing';
      
      for (let i = 0; i < texts.length; i++) {
        const analysis = await get().analyzeSentiment(texts[i], options);
        batch.results.push(analysis);
        batch.progress = ((i + 1) / texts.length) * 100;
        
        // Atualizar estado do batch
        set(state => ({
          batches: state.batches.map(b => b.id === batchId ? { ...batch } : b)
        }));
      }
      
      batch.status = 'completed';
      batch.endTime = Date.now();
      
      return batch;
    } catch (error) {
      batch.status = 'failed';
      batch.error = error instanceof Error ? error.message : 'Erro no processamento';
      throw error;
    }
  },
  
  // Implementação das outras ações...
  addProvider: (provider) => {
    const newProvider: SentimentProvider = {
      ...provider,
      id: `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: 0
      }
    };
    
    set(state => ({
      providers: [...state.providers, newProvider]
    }));
  },
  
  updateProvider: (id, updates) => {
    set(state => ({
      providers: state.providers.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  },
  
  removeProvider: (id) => {
    set(state => ({
      providers: state.providers.filter(p => p.id !== id)
    }));
  },
  
  testProvider: async (id) => {
    try {
      // Simular teste do provedor
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Math.random() > 0.1; // 90% de sucesso
    } catch {
      return false;
    }
  },
  
  switchProvider: (id) => {
    set(state => ({
      config: { ...state.config, defaultProvider: id }
    }));
  },
  
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    // Implementar reset da configuração
  },
  
  clearCache: () => {
    // Implementar limpeza do cache
  },
  
  optimizeProviders: () => {
    // Implementar otimização automática
  },
  
  quickAnalyze: async (text) => {
    return get().analyzeSentiment(text, { realTime: true });
  },
  
  getRecommendations: (analysis) => {
    const recommendations: string[] = [];
    
    if (analysis.confidence < 0.7) {
      recommendations.push('Considere revisar o texto para maior clareza');
    }
    
    if (analysis.sentiment === 'negative') {
      recommendations.push('Texto com sentimento negativo detectado');
    }
    
    return recommendations;
  },
  
  compareAnalyses: (analyses) => {
    // Implementar comparação de análises
    return {};
  },
  
  generateReport: (timeRange) => {
    // Implementar geração de relatório
    return {};
  },
  
  exportData: async (format) => {
    // Implementar exportação de dados
    return new Blob();
  },
  
  cleanup: () => {
    set(state => ({
      analyses: state.analyses.slice(0, 100),
      events: state.events.slice(0, 100),
      debugLogs: state.debugLogs.slice(0, 100)
    }));
  },
  
  reset: () => {
    set({
      analyses: [],
      batches: [],
      events: [],
      debugLogs: [],
      error: null,
      isProcessing: false
    });
  },
  
  formatAnalysis: (analysis) => {
    return `Sentimento: ${analysis.sentiment} (${(analysis.confidence * 100).toFixed(1)}%)`;
  },
  
  validateText: (text) => {
    return text.length > 0 && text.length <= 10000;
  },
  
  getProviderConfig: (id) => {
    return get().providers.find(p => p.id === id) || null;
  },
  
  isProviderAvailable: (id) => {
    const provider = get().providers.find(p => p.id === id);
    return provider ? provider.enabled : false;
  },
  
  getAnalyticsData: () => {
    return get().stats;
  },
  
  trackEvent: (event) => {
    const newEvent: SentimentEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({
      events: [newEvent, ...state.events].slice(0, 1000)
    }));
  },
  
  addDebugLog: (log) => {
    const newLog: SentimentDebugLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({
      debugLogs: [newLog, ...state.debugLogs].slice(0, 1000)
    }));
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },
  
  exportDebugLogs: async () => {
    const logs = get().debugLogs;
    const data = JSON.stringify(logs, null, 2);
    return new Blob([data], { type: 'application/json' });
  },
  
  // Helper para atualizar estatísticas
  updateStats: (analysis: SentimentAnalysis) => {
    set(state => {
      const newStats = { ...state.stats };
      newStats.totalAnalyses++;
      newStats.sentimentDistribution[analysis.sentiment]++;
      
      // Atualizar confiança média
      const totalConfidence = (newStats.averageConfidence * (newStats.totalAnalyses - 1)) + analysis.confidence;
      newStats.averageConfidence = totalConfidence / newStats.totalAnalyses;
      
      return { stats: newStats };
    });
  }
}), {
  name: 'sentiment-store'
}));

// Manager class para operações avançadas
export class SentimentAnalysisManager {
  private static instance: SentimentAnalysisManager;
  
  static getInstance(): SentimentAnalysisManager {
    if (!SentimentAnalysisManager.instance) {
      SentimentAnalysisManager.instance = new SentimentAnalysisManager();
    }
    return SentimentAnalysisManager.instance;
  }
  
  async analyzeInRealTime(text: string): Promise<SentimentAnalysis> {
    return useSentimentStore.getState().quickAnalyze(text);
  }
  
  async batchAnalyze(texts: string[]): Promise<SentimentBatch> {
    return useSentimentStore.getState().analyzeBatch(texts);
  }
  
  getSystemHealth() {
    return useSentimentStore.getState().systemHealth;
  }
}

// Instância global
export const sentimentManager = SentimentAnalysisManager.getInstance();

// Utilitários
export const sentimentUtils = {
  formatConfidence: (confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
  },
  
  getSentimentColor: (sentiment: string): string => {
    const colors = {
      positive: '#10B981',
      negative: '#EF4444',
      neutral: '#6B7280',
      mixed: '#F59E0B'
    };
    return colors[sentiment as keyof typeof colors] || '#6B7280';
  },
  
  getSentimentIcon: (sentiment: string): string => {
    const icons = {
      positive: '😊',
      negative: '😞',
      neutral: '😐',
      mixed: '🤔'
    };
    return icons[sentiment as keyof typeof icons] || '😐';
  },
  
  getEmotionColor: (emotion: string): string => {
    const colors = {
      joy: '#10B981',
      sadness: '#3B82F6',
      anger: '#EF4444',
      fear: '#8B5CF6',
      surprise: '#F59E0B',
      disgust: '#6B7280'
    };
    return colors[emotion as keyof typeof colors] || '#6B7280';
  }
};