import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAISentiment } from './useAISentiment';

// Interfaces específicas para análise de vídeo
export interface VideoSentimentData {
  timestamp: number;
  positive: number;
  negative: number;
  neutral: number;
  arousal: number;
  valence: number;
  engagement: number;
  attention: number;
}

export interface EmotionData {
  emotion: string;
  intensity: number;
  confidence: number;
  duration: number;
  facialExpression?: {
    eyebrows: number;
    eyes: number;
    mouth: number;
    overall: number;
  };
  voiceAnalysis?: {
    pitch: number;
    tone: number;
    pace: number;
    volume: number;
  };
}

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  sentiment: VideoSentimentData;
  emotions: EmotionData[];
  transcript: string;
  criticalMoment: boolean;
  learningMetrics?: {
    comprehension: number;
    retention: number;
    difficulty: number;
  };
  recommendations?: string[];
}

export interface VideoAnalysisConfig {
  includeAudio: boolean;
  includeFacial: boolean;
  includeText: boolean;
  realtime: boolean;
  segmentDuration: number;
  confidenceThreshold: number;
  emotionThreshold: number;
  criticalMomentThreshold: number;
}

export interface VideoAnalysisResult {
  id: string;
  videoId: string;
  duration: number;
  segments: VideoSegment[];
  overallSentiment: VideoSentimentData;
  emotionSummary: Record<string, number>;
  criticalMoments: VideoSegment[];
  recommendations: string[];
  learningImpact: {
    engagementScore: number;
    retentionPrediction: number;
    difficultyLevel: number;
    improvementSuggestions: string[];
  };
  createdAt: number;
  processingTime: number;
}

export interface VideoAnalysisState {
  isAnalyzing: boolean;
  currentVideo: string | null;
  progress: number;
  results: VideoAnalysisResult[];
  currentResult: VideoAnalysisResult | null;
  error: string | null;
  config: VideoAnalysisConfig;
}

const defaultConfig: VideoAnalysisConfig = {
  includeAudio: true,
  includeFacial: true,
  includeText: true,
  realtime: false,
  segmentDuration: 30,
  confidenceThreshold: 0.7,
  emotionThreshold: 0.6,
  criticalMomentThreshold: 0.5,
};

export const useVideoSentimentAnalysis = () => {
  const { state: sentimentState, analyzeSentiment, analyzeVideo } = useAISentiment();
  
  const [state, setState] = useState<VideoAnalysisState>({
    isAnalyzing: false,
    currentVideo: null,
    progress: 0,
    results: [],
    currentResult: null,
    error: null,
    config: defaultConfig,
  });

  // Análise de vídeo completa
  const analyzeVideoSentiment = useCallback(async (
    videoFile: File,
    config?: Partial<VideoAnalysisConfig>
  ): Promise<VideoAnalysisResult> => {
    const analysisConfig = { ...state.config, ...config };
    
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      currentVideo: videoFile.name,
      progress: 0,
      error: null,
    }));

    try {
      const startTime = Date.now();
      const videoId = `video_${Date.now()}`;
      
      // Simular análise de vídeo (em produção, seria integrado com APIs reais)
      const segments = await processVideoSegments(videoFile, analysisConfig, (progress) => {
        setState(prev => ({ ...prev, progress }));
      });

      const result: VideoAnalysisResult = {
        id: `analysis_${Date.now()}`,
        videoId,
        duration: await getVideoDuration(videoFile),
        segments,
        overallSentiment: calculateOverallSentiment(segments),
        emotionSummary: calculateEmotionSummary(segments),
        criticalMoments: segments.filter(s => s.criticalMoment),
        recommendations: generateRecommendations(segments),
        learningImpact: calculateLearningImpact(segments),
        createdAt: Date.now(),
        processingTime: Date.now() - startTime,
      };

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
        results: [...prev.results, result],
        currentResult: result,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Erro na análise',
      }));
      throw error;
    }
  }, [state.config]);

  // Análise em tempo real
  const startRealtimeAnalysis = useCallback(async (
    videoElement: HTMLVideoElement,
    onUpdate: (segment: VideoSegment) => void
  ) => {
    if (!state.config.realtime) return;

    const interval = setInterval(async () => {
      if (videoElement.paused) return;

      const currentTime = videoElement.currentTime;
      const segment = await analyzeCurrentSegment(videoElement, currentTime);
      
      if (segment) {
        onUpdate(segment);
      }
    }, state.config.segmentDuration * 1000);

    return () => clearInterval(interval);
  }, [state.config]);

  // Atualizar configuração
  const updateConfig = useCallback((updates: Partial<VideoAnalysisConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  }, []);

  // Obter resultado por ID
  const getResult = useCallback((id: string) => {
    return state.results.find(r => r.id === id) || null;
  }, [state.results]);

  // Comparar resultados
  const compareResults = useCallback((ids: string[]) => {
    const results = ids.map(id => getResult(id)).filter(Boolean) as VideoAnalysisResult[];
    
    return {
      averageEngagement: results.reduce((sum, r) => sum + r.learningImpact.engagementScore, 0) / results.length,
      sentimentComparison: results.map(r => ({
        id: r.id,
        positive: r.overallSentiment.positive,
        negative: r.overallSentiment.negative,
        engagement: r.overallSentiment.engagement,
      })),
      criticalMomentsComparison: results.map(r => ({
        id: r.id,
        count: r.criticalMoments.length,
        moments: r.criticalMoments.map(m => ({ start: m.startTime, end: m.endTime })),
      })),
    };
  }, [getResult]);

  // Exportar dados
  const exportAnalysis = useCallback(async (resultId: string, format: 'json' | 'csv' | 'pdf') => {
    const result = getResult(resultId);
    if (!result) throw new Error('Resultado não encontrado');

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      case 'csv':
        return generateCSV(result);
      case 'pdf':
        return generatePDF(result);
      default:
        throw new Error('Formato não suportado');
    }
  }, [getResult]);

  // Limpar resultados
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      currentResult: null,
    }));
  }, []);

  // Valores computados
  const computedValues = useMemo(() => ({
    hasResults: state.results.length > 0,
    latestResult: state.results[state.results.length - 1] || null,
    averageEngagement: state.results.length > 0 
      ? state.results.reduce((sum, r) => sum + r.learningImpact.engagementScore, 0) / state.results.length 
      : 0,
    totalCriticalMoments: state.results.reduce((sum, r) => sum + r.criticalMoments.length, 0),
    processingStats: {
      totalAnalyses: state.results.length,
      averageProcessingTime: state.results.length > 0
        ? state.results.reduce((sum, r) => sum + r.processingTime, 0) / state.results.length
        : 0,
      successRate: state.results.length > 0 ? 100 : 0, // Simplificado
    },
  }), [state.results]);

  return {
    state,
    analyzeVideoSentiment,
    startRealtimeAnalysis,
    updateConfig,
    getResult,
    compareResults,
    exportAnalysis,
    clearResults,
    ...computedValues,
  };
};

// Funções auxiliares
async function processVideoSegments(
  videoFile: File,
  config: VideoAnalysisConfig,
  onProgress: (progress: number) => void
): Promise<VideoSegment[]> {
  // Simular processamento de segmentos
  const duration = await getVideoDuration(videoFile);
  const segmentCount = Math.ceil(duration / config.segmentDuration);
  const segments: VideoSegment[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const startTime = i * config.segmentDuration;
    const endTime = Math.min((i + 1) * config.segmentDuration, duration);
    
    // Simular análise do segmento
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const segment: VideoSegment = {
      id: `segment_${i}`,
      startTime,
      endTime,
      sentiment: generateMockSentiment(),
      emotions: generateMockEmotions(),
      transcript: `Transcrição do segmento ${i + 1}...`,
      criticalMoment: Math.random() < 0.2, // 20% chance
      learningMetrics: {
        comprehension: Math.random() * 0.4 + 0.6,
        retention: Math.random() * 0.3 + 0.7,
        difficulty: Math.random() * 0.5 + 0.3,
      },
      recommendations: generateSegmentRecommendations(),
    };
    
    segments.push(segment);
    onProgress((i + 1) / segmentCount * 100);
  }

  return segments;
}

async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.src = URL.createObjectURL(videoFile);
  });
}

async function analyzeCurrentSegment(
  videoElement: HTMLVideoElement,
  currentTime: number
): Promise<VideoSegment | null> {
  // Implementar análise em tempo real
  return {
    id: `realtime_${Date.now()}`,
    startTime: currentTime,
    endTime: currentTime + 30,
    sentiment: generateMockSentiment(),
    emotions: generateMockEmotions(),
    transcript: 'Análise em tempo real...',
    criticalMoment: false,
  };
}

function calculateOverallSentiment(segments: VideoSegment[]): VideoSentimentData {
  const avgSentiment = segments.reduce((acc, segment) => ({
    positive: acc.positive + segment.sentiment.positive,
    negative: acc.negative + segment.sentiment.negative,
    neutral: acc.neutral + segment.sentiment.neutral,
    arousal: acc.arousal + segment.sentiment.arousal,
    valence: acc.valence + segment.sentiment.valence,
    engagement: acc.engagement + segment.sentiment.engagement,
    attention: acc.attention + segment.sentiment.attention,
  }), {
    positive: 0, negative: 0, neutral: 0, arousal: 0, valence: 0, engagement: 0, attention: 0
  });

  const count = segments.length;
  return {
    timestamp: Date.now(),
    positive: avgSentiment.positive / count,
    negative: avgSentiment.negative / count,
    neutral: avgSentiment.neutral / count,
    arousal: avgSentiment.arousal / count,
    valence: avgSentiment.valence / count,
    engagement: avgSentiment.engagement / count,
    attention: avgSentiment.attention / count,
  };
}

function calculateEmotionSummary(segments: VideoSegment[]): Record<string, number> {
  const emotions: Record<string, number> = {};
  
  segments.forEach(segment => {
    segment.emotions.forEach(emotion => {
      emotions[emotion.emotion] = (emotions[emotion.emotion] || 0) + emotion.intensity;
    });
  });

  // Normalizar
  const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
  Object.keys(emotions).forEach(key => {
    emotions[key] = emotions[key] / total;
  });

  return emotions;
}

function generateRecommendations(segments: VideoSegment[]): string[] {
  const recommendations = [];
  
  const lowEngagementSegments = segments.filter(s => s.sentiment.engagement < 0.5);
  if (lowEngagementSegments.length > 0) {
    recommendations.push('Adicionar mais elementos interativos nos segmentos de baixo engajamento');
  }

  const criticalMoments = segments.filter(s => s.criticalMoment);
  if (criticalMoments.length > 3) {
    recommendations.push('Revisar conteúdo nos momentos críticos identificados');
  }

  const avgValence = segments.reduce((sum, s) => sum + s.sentiment.valence, 0) / segments.length;
  if (avgValence < 0.6) {
    recommendations.push('Melhorar o tom e apresentação para aumentar a valência emocional');
  }

  return recommendations;
}

function calculateLearningImpact(segments: VideoSegment[]) {
  const avgEngagement = segments.reduce((sum, s) => sum + s.sentiment.engagement, 0) / segments.length;
  const avgComprehension = segments.reduce((sum, s) => sum + (s.learningMetrics?.comprehension || 0.7), 0) / segments.length;
  const avgRetention = segments.reduce((sum, s) => sum + (s.learningMetrics?.retention || 0.7), 0) / segments.length;
  const avgDifficulty = segments.reduce((sum, s) => sum + (s.learningMetrics?.difficulty || 0.5), 0) / segments.length;

  return {
    engagementScore: avgEngagement,
    retentionPrediction: avgRetention,
    difficultyLevel: avgDifficulty,
    improvementSuggestions: [
      'Adicionar mais pausas para reflexão',
      'Incluir exemplos práticos',
      'Melhorar ritmo de apresentação',
    ],
  };
}

function generateMockSentiment(): VideoSentimentData {
  return {
    timestamp: Date.now(),
    positive: Math.random() * 0.4 + 0.4,
    negative: Math.random() * 0.3,
    neutral: Math.random() * 0.3 + 0.1,
    arousal: Math.random() * 0.5 + 0.3,
    valence: Math.random() * 0.6 + 0.4,
    engagement: Math.random() * 0.4 + 0.5,
    attention: Math.random() * 0.3 + 0.6,
  };
}

function generateMockEmotions(): EmotionData[] {
  const emotions = ['Alegria', 'Interesse', 'Surpresa', 'Confusão', 'Tédio'];
  return emotions.map(emotion => ({
    emotion,
    intensity: Math.random(),
    confidence: Math.random() * 0.3 + 0.7,
    duration: Math.random() * 20 + 5,
    facialExpression: {
      eyebrows: Math.random(),
      eyes: Math.random(),
      mouth: Math.random(),
      overall: Math.random(),
    },
    voiceAnalysis: {
      pitch: Math.random(),
      tone: Math.random(),
      pace: Math.random(),
      volume: Math.random(),
    },
  }));
}

function generateSegmentRecommendations(): string[] {
  const recommendations = [
    'Adicionar pausa para reflexão',
    'Incluir exemplo prático',
    'Melhorar ritmo de fala',
    'Adicionar elemento visual',
    'Simplificar linguagem',
  ];
  
  return recommendations.slice(0, Math.floor(Math.random() * 3) + 1);
}

function generateCSV(result: VideoAnalysisResult): Blob {
  const headers = ['Segmento', 'Início', 'Fim', 'Sentimento Positivo', 'Engajamento', 'Momento Crítico'];
  const rows = result.segments.map(s => [
    s.id,
    s.startTime.toString(),
    s.endTime.toString(),
    s.sentiment.positive.toFixed(2),
    s.sentiment.engagement.toFixed(2),
    s.criticalMoment ? 'Sim' : 'Não',
  ]);
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  return new Blob([csvContent], { type: 'text/csv' });
}

function generatePDF(result: VideoAnalysisResult): Blob {
  // Implementar geração de PDF (simplificado)
  const content = `Relatório de Análise de Sentimentos\n\nVídeo: ${result.videoId}\nDuração: ${result.duration}s\nSegmentos: ${result.segments.length}\nMomentos Críticos: ${result.criticalMoments.length}`;
  return new Blob([content], { type: 'application/pdf' });
}