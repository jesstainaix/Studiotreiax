import { useState, useEffect, useCallback } from 'react';

// Interfaces para análise de sentimentos
export interface SentimentMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'average' | 'poor';
  category: 'engagement' | 'emotion' | 'attention' | 'comprehension' | 'satisfaction';
  description: string;
  target: number;
}

export interface EmotionData {
  timestamp: number;
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
  engagement: number;
  attention: number;
  confusion: number;
  interest: number;
  boredom: number;
}

export interface VideoAnalysis {
  id: string;
  title: string;
  duration: number;
  upload_date: Date;
  analysis_date: Date;
  status: 'analyzing' | 'completed' | 'failed' | 'pending';
  overall_sentiment: number;
  engagement_score: number;
  retention_rate: number;
  critical_moments: CriticalMoment[];
  emotion_timeline: EmotionData[];
  segments: VideoSegment[];
  insights: VideoInsight[];
}

export interface CriticalMoment {
  timestamp: number;
  type: 'confusion' | 'drop' | 'peak' | 'transition';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

export interface VideoSegment {
  id: string;
  start_time: number;
  end_time: number;
  topic: string;
  sentiment_score: number;
  engagement_level: number;
  key_emotions: string[];
  learning_effectiveness: number;
}

export interface VideoInsight {
  type: 'positive' | 'negative' | 'suggestion' | 'warning';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface AIModel {
  id: string;
  name: string;
  type: 'text' | 'audio' | 'video' | 'multimodal';
  provider: string;
  version: string;
  accuracy: number;
  speed: number;
  cost_per_minute: number;
  capabilities: string[];
  status: 'active' | 'inactive' | 'training' | 'error';
  last_updated: Date;
  configuration: Record<string, any>;
}

export interface SentimentReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'comparative' | 'trend';
  videos: string[];
  date_range: {
    start: Date;
    end: Date;
  };
  metrics: string[];
  filters: Record<string, any>;
  generated_at: Date;
  format: 'pdf' | 'html' | 'csv' | 'json';
  insights: ReportInsight[];
}

export interface ReportInsight {
  category: string;
  findings: string[];
  recommendations: string[];
}

export interface SentimentConfig {
  analysis: {
    auto_analyze: boolean;
    real_time: boolean;
    batch_size: number;
    quality_threshold: number;
    emotion_sensitivity: number;
    segment_duration: number;
  };
  models: {
    text_model: string;
    audio_model: string;
    video_model: string;
    ensemble_weights: {
      text: number;
      audio: number;
      video: number;
    };
  };
  alerts: {
    enabled: boolean;
    low_engagement_threshold: number;
    high_confusion_threshold: number;
    sentiment_drop_threshold: number;
    notification_channels: string[];
  };
  visualization: {
    chart_type: 'line' | 'area' | 'heatmap';
    time_resolution: 'second' | 'minute' | 'segment';
    emotion_colors: Record<string, string>;
    show_confidence: boolean;
  };
  export: {
    include_raw_data: boolean;
    include_timestamps: boolean;
    include_recommendations: boolean;
    default_format: 'pdf' | 'csv' | 'json';
  };
}

export interface SentimentAlert {
  id: string;
  type: 'low_engagement' | 'high_confusion' | 'sentiment_drop' | 'technical_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  video_id: string;
  timestamp: number;
  message: string;
  created_at: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface SentimentTrend {
  metric: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  data: {
    date: Date;
    value: number;
    change: number;
  }[];
  forecast: {
    date: Date;
    predicted_value: number;
    confidence: number;
  }[];
}

export interface LearningCorrelation {
  video_id: string;
  engagement_score: number;
  learning_outcome: number;
  retention_rate: number;
  completion_rate: number;
  satisfaction_score: number;
  correlation_strength: number;
}

export interface SentimentBenchmark {
  category: string;
  metric: string;
  current_value: number;
  industry_average: number;
  top_quartile: number;
  percentile: number;
  comparison: 'above' | 'below' | 'at' | 'unknown';
}

export interface SentimentInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact_score: number;
  affected_videos: string[];
  recommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    expected_impact: string;
  }[];
  created_at: Date;
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

export interface SentimentMonitoring {
  enabled: boolean;
  real_time_analysis: boolean;
  auto_alerts: boolean;
  quality_checks: boolean;
  performance_tracking: boolean;
  data_validation: boolean;
  model_monitoring: boolean;
  drift_detection: boolean;
}

// Hook principal para análise de sentimentos
const useAISentiment = () => {
  // Estados principais
  const [metrics, setMetrics] = useState<SentimentMetric[]>([]);
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [reports, setReports] = useState<SentimentReport[]>([]);
  const [config, setConfig] = useState<SentimentConfig>(defaultConfig);
  const [alerts, setAlerts] = useState<SentimentAlert[]>([]);
  const [trends, setTrends] = useState<SentimentTrend[]>([]);
  const [correlations, setCorrelations] = useState<LearningCorrelation[]>([]);
  const [benchmarks, setBenchmarks] = useState<SentimentBenchmark[]>([]);
  const [insights, setInsights] = useState<SentimentInsight[]>([]);
  const [monitoring, setMonitoring] = useState<SentimentMonitoring>({
    enabled: true,
    real_time_analysis: false,
    auto_alerts: true,
    quality_checks: true,
    performance_tracking: true,
    data_validation: true,
    model_monitoring: true,
    drift_detection: true
  });

  // Estados de controle
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Inicialização
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(generateMockMetrics());
      setVideoAnalyses(generateMockVideoAnalyses());
      setAIModels(generateMockAIModels());
      setReports(generateMockReports());
      setAlerts(generateMockAlerts());
      setTrends(generateMockTrends());
      setCorrelations(generateMockCorrelations());
      setBenchmarks(generateMockBenchmarks());
      setInsights(generateMockInsights());
    } catch (err) {
      setError('Erro ao carregar dados iniciais');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ações de análise
  const startAnalysis = useCallback(async (videoId: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Atualizar status do vídeo
      setVideoAnalyses(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, status: 'analyzing' as const }
          : video
      ));
      
      // Simular progresso da análise
      setTimeout(() => {
        setVideoAnalyses(prev => prev.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                status: 'completed' as const,
                analysis_date: new Date(),
                overall_sentiment: Math.random() * 0.4 + 0.6,
                engagement_score: Math.random() * 30 + 70,
                retention_rate: Math.random() * 20 + 75
              }
            : video
        ));
        
        // Gerar novos insights
        generateInsightsForVideo(videoId);
      }, 2000);
      
    } catch (err) {
      setError('Erro durante a análise');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const batchAnalysis = useCallback(async (videoIds: string[]) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      for (const videoId of videoIds) {
        await startAnalysis(videoId);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      setError('Erro durante análise em lote');
    } finally {
      setIsAnalyzing(false);
    }
  }, [startAnalysis]);

  const stopAnalysis = useCallback((videoId: string) => {
    setVideoAnalyses(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, status: 'pending' as const }
        : video
    ));
    setIsAnalyzing(false);
  }, []);

  // Ações de métricas
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics(generateMockMetrics());
    } catch (err) {
      setError('Erro ao atualizar métricas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMetricTarget = useCallback((metricId: string, target: number) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === metricId 
        ? { ...metric, target }
        : metric
    ));
  }, []);

  // Ações de vídeos
  const addVideo = useCallback((video: Omit<VideoAnalysis, 'id'>) => {
    const newVideo: VideoAnalysis = {
      ...video,
      id: `video-${Date.now()}`
    };
    setVideoAnalyses(prev => [...prev, newVideo]);
  }, []);

  const removeVideo = useCallback((videoId: string) => {
    setVideoAnalyses(prev => prev.filter(video => video.id !== videoId));
  }, []);

  const updateVideo = useCallback((videoId: string, updates: Partial<VideoAnalysis>) => {
    setVideoAnalyses(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, ...updates }
        : video
    ));
  }, []);

  // Ações de modelos de IA
  const addModel = useCallback((model: Omit<AIModel, 'id'>) => {
    const newModel: AIModel = {
      ...model,
      id: `model-${Date.now()}`
    };
    setAIModels(prev => [...prev, newModel]);
  }, []);

  const updateModel = useCallback((modelId: string, updates: Partial<AIModel>) => {
    setAIModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, ...updates }
        : model
    ));
  }, []);

  const toggleModel = useCallback((modelId: string) => {
    setAIModels(prev => prev.map(model => 
      model.id === modelId 
        ? { 
            ...model, 
            status: model.status === 'active' ? 'inactive' as const : 'active' as const 
          }
        : model
    ));
  }, []);

  const trainModel = useCallback(async (modelId: string) => {
    setAIModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, status: 'training' as const }
        : model
    ));
    
    // Simular treinamento
    setTimeout(() => {
      setAIModels(prev => prev.map(model => 
        model.id === modelId 
          ? { 
              ...model, 
              status: 'active' as const,
              last_updated: new Date(),
              accuracy: Math.min(model.accuracy + Math.random() * 5, 100)
            }
          : model
      ));
    }, 5000);
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (config: Partial<SentimentReport>) => {
    setIsLoading(true);
    try {
      const newReport: SentimentReport = {
        id: `report-${Date.now()}`,
        name: config.name || 'Novo Relatório',
        type: config.type || 'summary',
        videos: config.videos || [],
        date_range: config.date_range || {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        metrics: config.metrics || ['engagement', 'sentiment'],
        filters: config.filters || {},
        generated_at: new Date(),
        format: config.format || 'pdf',
        insights: generateReportInsights()
      };
      
      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError('Erro ao gerar relatório');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (reportId: string, format: 'pdf' | 'csv' | 'json') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Simular exportação
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reports]);

  const scheduleReport = useCallback((reportConfig: any, schedule: string) => {
    // Implementar agendamento de relatórios
  }, []);

  const deleteReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(report => report.id !== reportId));
  }, []);

  // Ações de alertas
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true }
        : alert
    ));
  }, []);

  const createAlert = useCallback((alert: Omit<SentimentAlert, 'id' | 'created_at'>) => {
    const newAlert: SentimentAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      created_at: new Date()
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const configureAlertRules = useCallback((rules: any) => {
    setConfig(prev => ({
      ...prev,
      alerts: { ...prev.alerts, ...rules }
    }));
  }, []);

  // Ações de configuração
  const updateConfig = useCallback((updates: Partial<SentimentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const exportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentiment-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const importConfig = useCallback((configFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig(importedConfig);
      } catch (err) {
        setError('Erro ao importar configuração');
      }
    };
    reader.readAsText(configFile);
  }, []);

  // Ações de insights
  const generateInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setInsights(generateMockInsights());
    } catch (err) {
      setError('Erro ao gerar insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateInsightsForVideo = useCallback((videoId: string) => {
    const videoInsights = generateVideoSpecificInsights(videoId);
    setInsights(prev => [...videoInsights, ...prev]);
  }, []);

  const dismissInsight = useCallback((insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'dismissed' as const }
        : insight
    ));
  }, []);

  const implementInsight = useCallback((insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'implemented' as const }
        : insight
    ));
  }, []);

  // Ações de monitoramento
  const startMonitoring = useCallback(() => {
    setMonitoring(prev => ({ ...prev, enabled: true }));
  }, []);

  const stopMonitoring = useCallback(() => {
    setMonitoring(prev => ({ ...prev, enabled: false }));
  }, []);

  const updateMonitoringConfig = useCallback((updates: Partial<SentimentMonitoring>) => {
    setMonitoring(prev => ({ ...prev, ...updates }));
  }, []);

  // Funções utilitárias
  const exportData = useCallback((format: 'csv' | 'json') => {
    const data = {
      metrics,
      videoAnalyses,
      reports,
      alerts,
      insights
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment-data.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, videoAnalyses, reports, alerts, insights]);

  const importData = useCallback((dataFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.metrics) setMetrics(importedData.metrics);
        if (importedData.videoAnalyses) setVideoAnalyses(importedData.videoAnalyses);
        if (importedData.reports) setReports(importedData.reports);
        if (importedData.alerts) setAlerts(importedData.alerts);
        if (importedData.insights) setInsights(importedData.insights);
      } catch (err) {
        setError('Erro ao importar dados');
      }
    };
    reader.readAsText(dataFile);
  }, []);

  const clearCache = useCallback(() => {
    // Limpar cache local
    localStorage.removeItem('sentiment-cache');
  }, []);

  const validateData = useCallback(() => {
    // Validar integridade dos dados
    const issues = [];
    
    if (metrics.length === 0) issues.push('Nenhuma métrica encontrada');
    if (videoAnalyses.length === 0) issues.push('Nenhuma análise de vídeo encontrada');
    
    return issues;
  }, [metrics, videoAnalyses]);

  const optimizePerformance = useCallback(() => {
    // Otimizar performance removendo dados antigos
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 dias
    
    setAlerts(prev => prev.filter(alert => alert.created_at > cutoffDate));
    setReports(prev => prev.filter(report => report.generated_at > cutoffDate));
  }, []);

  // Valores computados
  const totalVideos = videoAnalyses.length;
  const completedAnalyses = videoAnalyses.filter(v => v.status === 'completed').length;
  const averageSentiment = videoAnalyses.reduce((sum, v) => sum + v.overall_sentiment, 0) / totalVideos || 0;
  const averageEngagement = videoAnalyses.reduce((sum, v) => sum + v.engagement_score, 0) / totalVideos || 0;
  const activeAlerts = alerts.filter(a => !a.resolved).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
  const newInsights = insights.filter(i => i.status === 'new').length;
  const topPerformingVideo = videoAnalyses.reduce((best, current) => 
    current.engagement_score > (best?.engagement_score || 0) ? current : best
  , null as VideoAnalysis | null);
  const worstPerformingVideo = videoAnalyses.reduce((worst, current) => 
    current.engagement_score < (worst?.engagement_score || 100) ? current : worst
  , null as VideoAnalysis | null);

  // Estatísticas de modelos
  const activeModels = aiModels.filter(m => m.status === 'active').length;
  const averageModelAccuracy = aiModels.reduce((sum, m) => sum + m.accuracy, 0) / aiModels.length || 0;
  const totalModelCost = aiModels.reduce((sum, m) => sum + m.cost_per_minute, 0);

  // Tendências
  const engagementTrend = calculateTrend(videoAnalyses.map(v => v.engagement_score));
  const sentimentTrend = calculateTrend(videoAnalyses.map(v => v.overall_sentiment));
  const retentionTrend = calculateTrend(videoAnalyses.map(v => v.retention_rate));

  return {
    // Estados
    metrics,
    videoAnalyses,
    aiModels,
    reports,
    config,
    alerts,
    trends,
    correlations,
    benchmarks,
    insights,
    monitoring,
    isAnalyzing,
    isLoading,
    error,
    selectedVideo,
    activeTab,

    // Ações de análise
    startAnalysis,
    batchAnalysis,
    stopAnalysis,

    // Ações de métricas
    refreshMetrics,
    updateMetricTarget,

    // Ações de vídeos
    addVideo,
    removeVideo,
    updateVideo,
    setSelectedVideo,

    // Ações de modelos
    addModel,
    updateModel,
    toggleModel,
    trainModel,

    // Ações de relatórios
    generateReport,
    exportReport,
    scheduleReport,
    deleteReport,

    // Ações de alertas
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    configureAlertRules,

    // Ações de configuração
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,

    // Ações de insights
    generateInsights,
    generateInsightsForVideo,
    dismissInsight,
    implementInsight,

    // Ações de monitoramento
    startMonitoring,
    stopMonitoring,
    updateMonitoringConfig,

    // Funções utilitárias
    exportData,
    importData,
    clearCache,
    validateData,
    optimizePerformance,
    setActiveTab,
    setError,

    // Valores computados
    totalVideos,
    completedAnalyses,
    averageSentiment,
    averageEngagement,
    activeAlerts,
    criticalAlerts,
    newInsights,
    topPerformingVideo,
    worstPerformingVideo,
    activeModels,
    averageModelAccuracy,
    totalModelCost,
    engagementTrend,
    sentimentTrend,
    retentionTrend
  };
};

// Configuração padrão
const defaultConfig: SentimentConfig = {
  analysis: {
    auto_analyze: true,
    real_time: false,
    batch_size: 10,
    quality_threshold: 80,
    emotion_sensitivity: 1.0,
    segment_duration: 30
  },
  models: {
    text_model: 'gpt-4',
    audio_model: 'whisper-v3',
    video_model: 'mediapipe',
    ensemble_weights: {
      text: 40,
      audio: 30,
      video: 30
    }
  },
  alerts: {
    enabled: true,
    low_engagement_threshold: 30,
    high_confusion_threshold: 70,
    sentiment_drop_threshold: 0.3,
    notification_channels: ['email', 'dashboard']
  },
  visualization: {
    chart_type: 'line',
    time_resolution: 'minute',
    emotion_colors: {
      joy: '#10B981',
      sadness: '#3B82F6',
      anger: '#EF4444',
      fear: '#8B5CF6',
      surprise: '#F59E0B',
      disgust: '#84CC16',
      neutral: '#6B7280'
    },
    show_confidence: true
  },
  export: {
    include_raw_data: false,
    include_timestamps: true,
    include_recommendations: true,
    default_format: 'pdf'
  }
};

// Funções auxiliares para gerar dados mock
const generateMockMetrics = (): SentimentMetric[] => [
  {
    id: 'overall_engagement',
    name: 'Engajamento Geral',
    value: 0.78,
    change: 5.2,
    trend: 'up',
    status: 'good',
    category: 'engagement',
    description: 'Nível médio de engajamento dos estudantes',
    target: 0.80
  },
  {
    id: 'average_sentiment',
    name: 'Sentimento Médio',
    value: 0.65,
    change: 2.1,
    trend: 'up',
    status: 'good',
    category: 'emotion',
    description: 'Sentimento geral dos estudantes',
    target: 0.70
  },
  {
    id: 'attention_score',
    name: 'Pontuação de Atenção',
    value: 0.72,
    change: -1.5,
    trend: 'down',
    status: 'average',
    category: 'attention',
    description: 'Nível de atenção durante as aulas',
    target: 0.75
  },
  {
    id: 'comprehension_rate',
    name: 'Taxa de Compreensão',
    value: 0.68,
    change: 3.8,
    trend: 'up',
    status: 'good',
    category: 'comprehension',
    description: 'Taxa de compreensão do conteúdo',
    target: 0.75
  },
  {
    id: 'satisfaction_index',
    name: 'Índice de Satisfação',
    value: 0.82,
    change: 4.2,
    trend: 'up',
    status: 'excellent',
    category: 'satisfaction',
    description: 'Satisfação geral com o conteúdo',
    target: 0.80
  }
];

const generateMockVideoAnalyses = (): VideoAnalysis[] => [
  {
    id: 'video-1',
    title: 'Introdução à Matemática Básica',
    duration: 1800,
    upload_date: new Date('2024-01-15'),
    analysis_date: new Date('2024-01-16'),
    status: 'completed',
    overall_sentiment: 0.72,
    engagement_score: 78.5,
    retention_rate: 85.2,
    critical_moments: [],
    emotion_timeline: [],
    segments: [],
    insights: []
  },
  {
    id: 'video-2',
    title: 'História do Brasil Colonial',
    duration: 2400,
    upload_date: new Date('2024-01-10'),
    analysis_date: new Date('2024-01-11'),
    status: 'completed',
    overall_sentiment: 0.68,
    engagement_score: 72.3,
    retention_rate: 79.8,
    critical_moments: [],
    emotion_timeline: [],
    segments: [],
    insights: []
  },
  {
    id: 'video-3',
    title: 'Física Quântica Básica',
    duration: 3600,
    upload_date: new Date('2024-01-20'),
    analysis_date: new Date(),
    status: 'analyzing',
    overall_sentiment: 0,
    engagement_score: 0,
    retention_rate: 0,
    critical_moments: [],
    emotion_timeline: [],
    segments: [],
    insights: []
  }
];

const generateMockAIModels = (): AIModel[] => [
  {
    id: 'model-1',
    name: 'GPT-4 Sentiment',
    type: 'text',
    provider: 'openai',
    version: '4.0',
    accuracy: 94.5,
    speed: 8,
    cost_per_minute: 0.0234,
    capabilities: ['sentiment', 'emotion', 'intent', 'context'],
    status: 'active',
    last_updated: new Date('2024-01-15'),
    configuration: {}
  },
  {
    id: 'model-2',
    name: 'Whisper Audio Analysis',
    type: 'audio',
    provider: 'openai',
    version: '3.0',
    accuracy: 91.2,
    speed: 7,
    cost_per_minute: 0.0156,
    capabilities: ['transcription', 'emotion', 'tone', 'pace'],
    status: 'active',
    last_updated: new Date('2024-01-12'),
    configuration: {}
  },
  {
    id: 'model-3',
    name: 'MediaPipe Face',
    type: 'video',
    provider: 'google',
    version: '2.1',
    accuracy: 87.8,
    speed: 6,
    cost_per_minute: 0.0089,
    capabilities: ['facial_expression', 'gaze', 'attention', 'micro_expressions'],
    status: 'active',
    last_updated: new Date('2024-01-10'),
    configuration: {}
  }
];

const generateMockReports = (): SentimentReport[] => [
  {
    id: 'report-1',
    name: 'Relatório Semanal de Sentimentos',
    type: 'summary',
    videos: ['video-1', 'video-2'],
    date_range: {
      start: new Date('2024-01-15'),
      end: new Date('2024-01-22')
    },
    metrics: ['engagement', 'sentiment', 'attention'],
    filters: {},
    generated_at: new Date('2024-01-22'),
    format: 'pdf',
    insights: []
  }
];

const generateMockAlerts = (): SentimentAlert[] => [
  {
    id: 'alert-1',
    type: 'low_engagement',
    severity: 'medium',
    video_id: 'video-2',
    timestamp: 1200,
    message: 'Engajamento baixo detectado aos 20 minutos',
    created_at: new Date(),
    acknowledged: false,
    resolved: false
  }
];

const generateMockTrends = (): SentimentTrend[] => [
  {
    metric: 'engagement',
    period: 'week',
    data: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      value: Math.random() * 20 + 70,
      change: Math.random() * 10 - 5
    })),
    forecast: Array.from({ length: 3 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      predicted_value: Math.random() * 20 + 70,
      confidence: Math.random() * 30 + 70
    }))
  }
];

const generateMockCorrelations = (): LearningCorrelation[] => [
  {
    video_id: 'video-1',
    engagement_score: 78.5,
    learning_outcome: 82.3,
    retention_rate: 85.2,
    completion_rate: 91.7,
    satisfaction_score: 88.9,
    correlation_strength: 0.87
  }
];

const generateMockBenchmarks = (): SentimentBenchmark[] => [
  {
    category: 'Education',
    metric: 'engagement',
    current_value: 78.5,
    industry_average: 72.3,
    top_quartile: 85.7,
    percentile: 68,
    comparison: 'above'
  }
];

const generateMockInsights = (): SentimentInsight[] => [
  {
    id: 'insight-1',
    type: 'opportunity',
    title: 'Oportunidade de Melhoria no Engajamento',
    description: 'Vídeos com introduções mais dinâmicas têm 23% mais engajamento',
    confidence: 87,
    impact_score: 8.5,
    affected_videos: ['video-1', 'video-2'],
    recommendations: [
      {
        action: 'Adicionar elementos visuais nas introduções',
        priority: 'high',
        effort: 'medium',
        expected_impact: 'Aumento de 15-25% no engajamento inicial'
      }
    ],
    created_at: new Date(),
    status: 'new'
  }
];

const generateReportInsights = (): ReportInsight[] => [
  {
    category: 'Engajamento',
    findings: ['Melhoria de 5.2% na semana', 'Picos durante introduções'],
    recommendations: ['Manter estilo das introduções', 'Adicionar mais elementos visuais']
  }
];

const generateVideoSpecificInsights = (videoId: string): SentimentInsight[] => [
  {
    id: `insight-${videoId}-${Date.now()}`,
    type: 'pattern',
    title: 'Padrão de Engajamento Identificado',
    description: `Análise específica para o vídeo ${videoId}`,
    confidence: 92,
    impact_score: 7.8,
    affected_videos: [videoId],
    recommendations: [
      {
        action: 'Otimizar segmento específico',
        priority: 'medium',
        effort: 'low',
        expected_impact: 'Melhoria localizada no engajamento'
      }
    ],
    created_at: new Date(),
    status: 'new'
  }
];

const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
  if (values.length < 2) return 'stable';
  const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const previous = values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
  const change = ((recent - previous) / previous) * 100;
  
  if (change > 2) return 'up';
  if (change < -2) return 'down';
  return 'stable';
};

export default useAISentiment;