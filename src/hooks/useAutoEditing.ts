import { useState, useEffect, useCallback, useRef } from 'react';
import { AIAutoEditingEngine } from '../services/aiAutoEditingEngine';
import {
  SmartCut,
  SceneTransition,
  ColorGradingProfile,
  AudioLevelingData,
  ContentAnalysis,
  AIEditingSuggestion,
  BatchProcessingJob,
  UserPreferences,
  AutoEditingSession,
  AutoEditingConfig,
  SmartEditingMetrics
} from '../types/autoEditing';

interface UseAutoEditingOptions {
  config?: Partial<AutoEditingConfig>;
  userPreferences?: UserPreferences;
  autoStart?: boolean;
}

interface UseAutoEditingReturn {
  // Estado
  isAnalyzing: boolean;
  isProcessing: boolean;
  currentSession: AutoEditingSession | null;
  suggestions: AIEditingSuggestion[];
  smartCuts: SmartCut[];
  transitions: SceneTransition[];
  colorGrading: ColorGradingProfile | null;
  audioLeveling: AudioLevelingData[];
  contentAnalysis: ContentAnalysis | null;
  batchJobs: BatchProcessingJob[];
  metrics: SmartEditingMetrics | null;
  error: string | null;
  
  // Ações
  startAnalysis: (videoElement: HTMLVideoElement, audioData?: AudioBuffer) => Promise<void>;
  stopAnalysis: () => void;
  applySuggestion: (suggestionId: string) => Promise<void>;
  rejectSuggestion: (suggestionId: string) => void;
  applySmartCut: (cutId: string) => Promise<void>;
  applyTransition: (transitionId: string) => Promise<void>;
  applyColorGrading: () => Promise<void>;
  applyAudioLeveling: () => Promise<void>;
  startBatchProcessing: (files: string[], settings: BatchProcessingJob['settings']) => Promise<string>;
  cancelBatchJob: (jobId: string) => void;
  updateConfig: (newConfig: Partial<AutoEditingConfig>) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences['preferences']>) => void;
  getRealTimeSuggestions: (currentTime: number, videoElement: HTMLVideoElement) => Promise<AIEditingSuggestion[]>;
  exportSession: () => string;
  importSession: (sessionData: string) => void;
  clearSession: () => void;
}

const defaultConfig: AutoEditingConfig = {
  smartCutDetection: {
    enabled: true,
    sensitivity: 0.7,
    minCutDuration: 0.5,
    audioThreshold: 20,
    motionThreshold: 60
  },
  sceneTransitions: {
    enabled: true,
    autoApply: false,
    defaultDuration: 0.5,
    style: 'fade'
  },
  colorGrading: {
    enabled: true,
    autoApply: false,
    intensity: 0.7,
    preserveOriginal: true
  },
  audioLeveling: {
    enabled: true,
    targetLevel: -12,
    noiseReduction: true,
    dynamicRange: 0.8
  },
  realTimeSuggestions: {
    enabled: true,
    maxSuggestions: 5,
    confidenceThreshold: 0.7
  },
  batchProcessing: {
    enabled: true,
    maxConcurrentJobs: 3,
    autoStart: false
  }
};

export function useAutoEditing(options: UseAutoEditingOptions = {}): UseAutoEditingReturn {
  // Estados
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState<AutoEditingSession | null>(null);
  const [suggestions, setSuggestions] = useState<AIEditingSuggestion[]>([]);
  const [smartCuts, setSmartCuts] = useState<SmartCut[]>([]);
  const [transitions, setTransitions] = useState<SceneTransition[]>([]);
  const [colorGrading, setColorGrading] = useState<ColorGradingProfile | null>(null);
  const [audioLeveling, setAudioLeveling] = useState<AudioLevelingData[]>([]);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [batchJobs, setBatchJobs] = useState<BatchProcessingJob[]>([]);
  const [metrics, setMetrics] = useState<SmartEditingMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AutoEditingConfig>({ ...defaultConfig, ...options.config });
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(options.userPreferences || null);

  // Refs
  const engineRef = useRef<AIAutoEditingEngine | null>(null);
  const analysisAbortController = useRef<AbortController | null>(null);
  const realTimeSuggestionsInterval = useRef<NodeJS.Timeout | null>(null);

  // Inicializar engine
  useEffect(() => {
    engineRef.current = new AIAutoEditingEngine(config);
    if (userPreferences) {
      engineRef.current.setUserPreferences(userPreferences);
    }
  }, [config]);

  // Limpar intervalos ao desmontar
  useEffect(() => {
    return () => {
      if (realTimeSuggestionsInterval.current) {
        clearInterval(realTimeSuggestionsInterval.current);
      }
      if (analysisAbortController.current) {
        analysisAbortController.current.abort();
      }
    };
  }, []);

  // Iniciar análise
  const startAnalysis = useCallback(async (videoElement: HTMLVideoElement, audioData?: AudioBuffer) => {
    if (!engineRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      analysisAbortController.current = new AbortController();

      // Criar nova sessão
      const session: AutoEditingSession = {
        id: `session_${Date.now()}`,
        videoId: `video_${Date.now()}`,
        status: 'analyzing',
        progress: 0,
        suggestions: [],
        appliedSuggestions: [],
        smartCuts: [],
        transitions: [],
        audioLeveling: [],
        createdAt: new Date()
      };

      setCurrentSession(session);

      // Análise de conteúdo
      session.progress = 10;
      setCurrentSession({ ...session });
      const analysis = await engineRef.current.analyzeContent(videoElement, audioData);
      setContentAnalysis(analysis);
      session.analysis = analysis;

      // Detecção de cortes inteligentes
      session.progress = 30;
      setCurrentSession({ ...session });
      const cuts = await engineRef.current.detectSmartCuts(videoElement, audioData);
      setSmartCuts(cuts);
      session.smartCuts = cuts;

      // Sugestões de transições
      session.progress = 50;
      setCurrentSession({ ...session });
      const sceneTransitions = await engineRef.current.suggestSceneTransitions(cuts, analysis);
      setTransitions(sceneTransitions);
      session.transitions = sceneTransitions;

      // Correção de cor
      if (config.colorGrading.enabled) {
        session.progress = 70;
        setCurrentSession({ ...session });
        const colorProfile = await engineRef.current.analyzeAndSuggestColorGrading(videoElement);
        setColorGrading(colorProfile);
        session.colorGrading = colorProfile;
      }

      // Nivelamento de áudio
      if (config.audioLeveling.enabled && audioData) {
        session.progress = 85;
        setCurrentSession({ ...session });
        const audioData_leveling = await engineRef.current.analyzeAndLevelAudio(audioData);
        setAudioLeveling(audioData_leveling);
        session.audioLeveling = audioData_leveling;
      }

      // Gerar sugestões iniciais
      session.progress = 95;
      setCurrentSession({ ...session });
      const initialSuggestions = await engineRef.current.generateRealTimeSuggestions(0, videoElement);
      setSuggestions(initialSuggestions);
      session.suggestions = initialSuggestions;

      // Finalizar análise
      session.status = 'completed';
      session.progress = 100;
      session.completedAt = new Date();
      setCurrentSession(session);

      // Calcular métricas
      const sessionMetrics = engineRef.current.calculateMetrics(session);
      setMetrics(sessionMetrics);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      console.error('Erro na análise:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, config]);

  // Parar análise
  const stopAnalysis = useCallback(() => {
    if (analysisAbortController.current) {
      analysisAbortController.current.abort();
    }
    setIsAnalyzing(false);
  }, []);

  // Aplicar sugestão
  const applySuggestion = useCallback(async (suggestionId: string) => {
    if (!engineRef.current || !currentSession) return;

    try {
      setIsProcessing(true);
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // Simular aplicação da sugestão
      await new Promise(resolve => setTimeout(resolve, 500));

      // Atualizar sessão
      const updatedSession = {
        ...currentSession,
        appliedSuggestions: [...currentSession.appliedSuggestions, suggestionId]
      };
      setCurrentSession(updatedSession);

      // Atualizar preferências do usuário
      engineRef.current.updateUserPreferences(suggestion, true);

      // Remover sugestão da lista
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));

    } catch (err) {
      setError('Erro ao aplicar sugestão');
      console.error('Erro ao aplicar sugestão:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [suggestions, currentSession]);

  // Rejeitar sugestão
  const rejectSuggestion = useCallback((suggestionId: string) => {
    if (!engineRef.current) return;

    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      engineRef.current.updateUserPreferences(suggestion, false);
    }

    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, [suggestions]);

  // Aplicar corte inteligente
  const applySmartCut = useCallback(async (cutId: string) => {
    try {
      setIsProcessing(true);
      // Simular aplicação do corte
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aqui você integraria com o sistema de edição real
      console.log(`Aplicando corte: ${cutId}`);
      
    } catch (err) {
      setError('Erro ao aplicar corte');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Aplicar transição
  const applyTransition = useCallback(async (transitionId: string) => {
    try {
      setIsProcessing(true);
      // Simular aplicação da transição
      await new Promise(resolve => setTimeout(resolve, 400));
      
      console.log(`Aplicando transição: ${transitionId}`);
      
    } catch (err) {
      setError('Erro ao aplicar transição');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Aplicar correção de cor
  const applyColorGrading = useCallback(async () => {
    if (!colorGrading) return;
    
    try {
      setIsProcessing(true);
      // Simular aplicação da correção de cor
      await new Promise(resolve => setTimeout(resolve, 600));
      
      console.log('Aplicando correção de cor:', colorGrading);
      
    } catch (err) {
      setError('Erro ao aplicar correção de cor');
    } finally {
      setIsProcessing(false);
    }
  }, [colorGrading]);

  // Aplicar nivelamento de áudio
  const applyAudioLeveling = useCallback(async () => {
    if (audioLeveling.length === 0) return;
    
    try {
      setIsProcessing(true);
      // Simular aplicação do nivelamento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('Aplicando nivelamento de áudio:', audioLeveling);
      
    } catch (err) {
      setError('Erro ao aplicar nivelamento de áudio');
    } finally {
      setIsProcessing(false);
    }
  }, [audioLeveling]);

  // Iniciar processamento em lote
  const startBatchProcessing = useCallback(async (files: string[], settings: BatchProcessingJob['settings']): Promise<string> => {
    if (!engineRef.current) throw new Error('Engine não inicializado');

    const job: BatchProcessingJob = {
      id: `batch_${Date.now()}`,
      name: `Lote ${new Date().toLocaleString()}`,
      status: 'pending',
      progress: 0,
      files,
      settings,
      createdAt: new Date()
    };

    setBatchJobs(prev => [...prev, job]);

    // Processar em background
    engineRef.current.processBatch(job).then(completedJob => {
      setBatchJobs(prev => prev.map(j => j.id === job.id ? completedJob : j));
    });

    return job.id;
  }, []);

  // Cancelar job em lote
  const cancelBatchJob = useCallback((jobId: string) => {
    setBatchJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  // Atualizar configuração
  const updateConfig = useCallback((newConfig: Partial<AutoEditingConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    if (engineRef.current) {
      engineRef.current.updateConfig(updatedConfig);
    }
  }, [config]);

  // Atualizar preferências do usuário
  const updateUserPreferences = useCallback((preferences: Partial<UserPreferences['preferences']>) => {
    if (!userPreferences) return;

    const updatedPreferences = {
      ...userPreferences,
      preferences: { ...userPreferences.preferences, ...preferences },
      updatedAt: new Date()
    };
    
    setUserPreferences(updatedPreferences);
    if (engineRef.current) {
      engineRef.current.setUserPreferences(updatedPreferences);
    }
  }, [userPreferences]);

  // Obter sugestões em tempo real
  const getRealTimeSuggestions = useCallback(async (currentTime: number, videoElement: HTMLVideoElement): Promise<AIEditingSuggestion[]> => {
    if (!engineRef.current || !config.realTimeSuggestions.enabled) return [];

    try {
      const realTimeSuggestions = await engineRef.current.generateRealTimeSuggestions(currentTime, videoElement);
      setSuggestions(prev => {
        // Mesclar com sugestões existentes, evitando duplicatas
        const existingIds = new Set(prev.map(s => s.id));
        const newSuggestions = realTimeSuggestions.filter(s => !existingIds.has(s.id));
        return [...prev, ...newSuggestions].slice(-config.realTimeSuggestions.maxSuggestions);
      });
      return realTimeSuggestions;
    } catch (err) {
      console.error('Erro ao obter sugestões em tempo real:', err);
      return [];
    }
  }, [config.realTimeSuggestions]);

  // Exportar sessão
  const exportSession = useCallback((): string => {
    if (!currentSession) return '';
    
    const exportData = {
      session: currentSession,
      suggestions,
      smartCuts,
      transitions,
      colorGrading,
      audioLeveling,
      contentAnalysis,
      metrics,
      config,
      userPreferences
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [currentSession, suggestions, smartCuts, transitions, colorGrading, audioLeveling, contentAnalysis, metrics, config, userPreferences]);

  // Importar sessão
  const importSession = useCallback((sessionData: string) => {
    try {
      const data = JSON.parse(sessionData);
      
      setCurrentSession(data.session);
      setSuggestions(data.suggestions || []);
      setSmartCuts(data.smartCuts || []);
      setTransitions(data.transitions || []);
      setColorGrading(data.colorGrading || null);
      setAudioLeveling(data.audioLeveling || []);
      setContentAnalysis(data.contentAnalysis || null);
      setMetrics(data.metrics || null);
      
      if (data.config) {
        setConfig(data.config);
      }
      if (data.userPreferences) {
        setUserPreferences(data.userPreferences);
      }
      
    } catch (err) {
      setError('Erro ao importar sessão');
      console.error('Erro ao importar sessão:', err);
    }
  }, []);

  // Limpar sessão
  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setSuggestions([]);
    setSmartCuts([]);
    setTransitions([]);
    setColorGrading(null);
    setAudioLeveling([]);
    setContentAnalysis(null);
    setMetrics(null);
    setError(null);
  }, []);

  return {
    // Estado
    isAnalyzing,
    isProcessing,
    currentSession,
    suggestions,
    smartCuts,
    transitions,
    colorGrading,
    audioLeveling,
    contentAnalysis,
    batchJobs,
    metrics,
    error,
    
    // Ações
    startAnalysis,
    stopAnalysis,
    applySuggestion,
    rejectSuggestion,
    applySmartCut,
    applyTransition,
    applyColorGrading,
    applyAudioLeveling,
    startBatchProcessing,
    cancelBatchJob,
    updateConfig,
    updateUserPreferences,
    getRealTimeSuggestions,
    exportSession,
    importSession,
    clearSession
  };
}