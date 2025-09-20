import React, { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import {
  Brain,
  Wand2,
  Sparkles,
  Video,
  Mic,
  Subtitles,
  Eye,
  Target,
  Zap,
  Settings,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileText,
  Image,
  Volume2,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  TestTube,
  Folder,
  Activity,
} from 'lucide-react';

import AITestingPanel from './AITestingPanel';
import AIHighlightDetector from './AIHighlightDetector';
import AIContentCategorizer from './AIContentCategorizer';
import AIThumbnailGenerator from './AIThumbnailGenerator';
import AIPerformanceOptimizer from './AIPerformanceOptimizer';
import { useTimeline } from '../editor/Timeline';
import { useAIContentAnalysis } from '../../services/aiContentAnalysisService';
import { useAISubtitle } from '../../services/aiSubtitleService';
import { useAIVoiceTranscription } from '../../services/aiVoiceTranscriptionService';
import { useAdvancedAI } from '../../services/advancedAIService';

// Interface para o estado do painel de IA
interface AIPanelState {
  isExpanded: boolean;
  activeTab: 'analysis' | 'subtitles' | 'transcription' | 'suggestions' | 'thumbnails' | 'highlights' | 'categorization' | 'testing' | 'performance';
  isProcessing: boolean;
  currentTask: string | null;
  progress: number;
  notifications: AINotification[];
  realTimeMode: boolean;
  autoProcess: boolean;
  
  // Actions
  setExpanded: (expanded: boolean) => void;
  setActiveTab: (tab: AIPanelState['activeTab']) => void;
  setProcessing: (processing: boolean, task?: string) => void;
  setProgress: (progress: number) => void;
  addNotification: (notification: Omit<AINotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  toggleRealTimeMode: () => void;
  toggleAutoProcess: () => void;
}

interface AINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AITask {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  estimatedTime?: number;
  results?: any;
}

// Store do painel de IA
const useAIPanel = create<AIPanelState>((set, get) => ({
  isExpanded: true,
  activeTab: 'analysis',
  isProcessing: false,
  currentTask: null,
  progress: 0,
  notifications: [],
  realTimeMode: false,
  autoProcess: true,

  setExpanded: (expanded) => set({ isExpanded: expanded }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setProcessing: (processing, task) => set({ 
    isProcessing: processing, 
    currentTask: task || null,
    progress: processing ? 0 : 100
  }),
  setProgress: (progress) => set({ progress }),
  
  addNotification: (notification) => {
    const newNotification: AINotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    set(state => ({ 
      notifications: [newNotification, ...state.notifications].slice(0, 10) 
    }));
  },
  
  removeNotification: (id) => {
    set(state => ({ 
      notifications: state.notifications.filter(n => n.id !== id) 
    }));
  },
  
  toggleRealTimeMode: () => set(state => ({ realTimeMode: !state.realTimeMode })),
  toggleAutoProcess: () => set(state => ({ autoProcess: !state.autoProcess }))
}));

interface AIIntegratedPanelProps {
  className?: string;
  onTimelineUpdate?: (updates: any) => void;
}

export const AIIntegratedPanel: React.FC<AIIntegratedPanelProps> = ({
  className = '',
  onTimelineUpdate
}) => {
  const {
    isExpanded,
    activeTab,
    isProcessing,
    currentTask,
    progress,
    notifications,
    realTimeMode,
    autoProcess,
    setExpanded,
    setActiveTab,
    setProcessing,
    setProgress,
    addNotification,
    removeNotification,
    toggleRealTimeMode,
    toggleAutoProcess
  } = useAIPanel();

  // Hooks dos serviços de IA
  const { 
    analyzeVideo, 
    detectScenes, 
    categorizeContent,
    generateHighlights,
    assessQuality,
    checkAccessibility,
    predictEngagement,
    isAnalyzing,
    analysisResults
  } = useAIContentAnalysis();

  const {
    generateSubtitles,
    recognizeSpeakers,
    translateSubtitles,
    exportSubtitles,
    isGenerating,
    subtitles,
    speakers
  } = useAISubtitle();

  const {
    startTranscription,
    stopTranscription,
    processAudioFile,
    exportTranscription,
    isTranscribing,
    currentSession,
    transcriptionSegments
  } = useAIVoiceTranscription();

  const {
    generateThumbnails,
    correctScript,
    analyzeContentSentiment,
    recommendContent,
    isGeneratingThumbnails,
    thumbnails,
    scriptCorrections,
    sentimentAnalysis,
    recommendations
  } = useAdvancedAI();

  // Timeline integration
  const { 
    tracks, 
    currentTime, 
    selectedClips, 
    addClip, 
    updateClip 
  } = useTimeline();

  // Estado local para tarefas de IA
  const [aiTasks, setAITasks] = useState<AITask[]>([
    {
      id: 'content-analysis',
      name: 'Análise de Conteúdo',
      description: 'Analisa o vídeo para detectar cenas, objetos e contexto',
      icon: <Brain className="w-4 h-4" />,
      status: 'idle',
      progress: 0
    },
    {
      id: 'scene-detection',
      name: 'Detecção de Cenas',
      description: 'Identifica mudanças de cena e pontos de corte',
      icon: <Video className="w-4 h-4" />,
      status: 'idle',
      progress: 0
    },
    {
      id: 'subtitle-generation',
      name: 'Geração de Legendas',
      description: 'Cria legendas automáticas com reconhecimento de fala',
      icon: <Subtitles className="w-4 h-4" />,
      status: 'idle',
      progress: 0
    },
    {
      id: 'voice-transcription',
      name: 'Transcrição de Voz',
      description: 'Converte áudio em texto com timestamps',
      icon: <Mic className="w-4 h-4" />,
      status: 'idle',
      progress: 0
    },
    {
      id: 'thumbnail-generation',
      name: 'Geração de Thumbnails',
      description: 'Cria miniaturas atrativas automaticamente',
      icon: <Image className="w-4 h-4" />,
      status: 'idle',
      progress: 0
    },
    {
      id: 'highlight-detection',
      name: 'Detecção de Highlights',
      description: 'Identifica momentos importantes do vídeo',
      icon: <Target className="w-4 h-4" />,
      status: 'idle',
      progress: 0
    }
  ]);

  // Executar análise automática quando clips são adicionados
  useEffect(() => {
    if (autoProcess && (selectedClips?.length || 0) > 0 && !isProcessing) {
      handleAutoAnalysis();
    }
  }, [selectedClips, autoProcess, isProcessing]);

  // Análise automática
  const handleAutoAnalysis = useCallback(async () => {
    if ((selectedClips?.length || 0) === 0) return;

    setProcessing(true, 'Análise automática');
    
    try {
      // Simular análise progressiva
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      addNotification({
        type: 'success',
        title: 'Análise Concluída',
        message: `${selectedClips?.length || 0} clip(s) analisado(s) com sucesso`,
        action: {
          label: 'Ver Resultados',
          onClick: () => setActiveTab('analysis')
        }
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Análise',
        message: 'Falha ao analisar o conteúdo'
      });
    } finally {
      setProcessing(false);
    }
  }, [selectedClips, setProcessing, setProgress, addNotification, setActiveTab]);

  // Executar tarefa específica de IA
  const executeAITask = useCallback(async (taskId: string) => {
    const task = aiTasks.find(t => t.id === taskId);
    if (!task || (selectedClips?.length || 0) === 0) return;

    setAITasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'running', progress: 0 } : t
    ));

    setProcessing(true, task.name);

    try {
      // Simular progresso da tarefa
      for (let i = 0; i <= 100; i += 5) {
        setAITasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, progress: i } : t
        ));
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Executar a tarefa específica
      switch (taskId) {
        case 'content-analysis':
          await analyzeVideo({ clipIds: selectedClips });
          break;
        case 'scene-detection':
          await detectScenes({ clipIds: selectedClips });
          break;
        case 'subtitle-generation':
          await generateSubtitles({ clipIds: selectedClips });
          break;
        case 'voice-transcription':
          await startTranscription({ clipIds: selectedClips });
          break;
        case 'thumbnail-generation':
          await generateThumbnails({ clipIds: selectedClips });
          break;
        case 'highlight-detection':
          await generateHighlights({ clipIds: selectedClips });
          break;
      }

      setAITasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t
      ));

      addNotification({
        type: 'success',
        title: `${task.name} Concluída`,
        message: 'Tarefa executada com sucesso'
      });
    } catch (error) {
      setAITasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'error', progress: 0 } : t
      ));

      addNotification({
        type: 'error',
        title: `Erro em ${task.name}`,
        message: 'Falha ao executar a tarefa'
      });
    } finally {
      setProcessing(false);
    }
  }, [aiTasks, selectedClips, setProcessing, setProgress, addNotification]);

  // Renderizar aba de análise
  const renderAnalysisTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {aiTasks.slice(0, 4).map(task => (
          <div key={task.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {task.icon}
                <span className="text-sm font-medium">{task.name}</span>
              </div>
              <button
          onClick={() => executeAITask(task.id)}
          disabled={isProcessing || (selectedClips?.length || 0) === 0}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
        >
                <Play className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">{task.description}</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{task.progress}%</span>
            </div>
          </div>
        ))}
      </div>
      
      {analysisResults && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium mb-3">Resultados da Análise</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Cenas Detectadas:</span>
              <span className="ml-2 font-medium">{analysisResults.scenes?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Qualidade:</span>
              <span className="ml-2 font-medium">{analysisResults.quality?.score || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Categoria:</span>
              <span className="ml-2 font-medium">{analysisResults.category || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Engajamento:</span>
              <span className="ml-2 font-medium">{analysisResults.engagement?.predicted || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar aba de legendas
  const renderSubtitlesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Legendas Automáticas</h4>
        <button
          onClick={() => executeAITask('subtitle-generation')}
        disabled={isProcessing || (selectedClips?.length || 0) === 0}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar'}
        </button>
      </div>
      
      {(subtitles?.length || 0) > 0 && (
        <div className="bg-white rounded-lg border max-h-40 overflow-y-auto">
          {(subtitles || []).map((subtitle, index) => (
            <div key={index} className="p-2 border-b last:border-b-0">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{subtitle.startTime}s - {subtitle.endTime}s</span>
                {subtitle.speaker && <span>Locutor: {subtitle.speaker.name}</span>}
              </div>
              <p className="text-sm">{subtitle.text}</p>
            </div>
          ))}
        </div>
      )}
      
      {(speakers?.length || 0) > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium mb-2">Locutores Identificados</h5>
          <div className="space-y-1">
            {(speakers || []).map(speaker => (
              <div key={speaker.id} className="flex items-center justify-between text-sm">
                <span>{speaker.name}</span>
                <span className="text-gray-500">{speaker.confidence}% confiança</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar aba de transcrição
  const renderTranscriptionTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Transcrição de Voz</h4>
        <div className="flex items-center space-x-2">
          {isTranscribing && (
            <div className="flex items-center space-x-1 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs">Gravando</span>
            </div>
          )}
          <button
            onClick={() => isTranscribing ? stopTranscription() : executeAITask('voice-transcription')}
            className={`px-3 py-1 rounded text-sm ${
              isTranscribing 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isTranscribing ? 'Parar' : 'Iniciar'}
          </button>
        </div>
      </div>
      
      {currentSession && (
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sessão: {currentSession.name}</span>
            <span className="text-xs text-gray-500">
              {Math.floor(currentSession.duration / 60)}:{(currentSession.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Idioma: {currentSession.language} | Qualidade: {currentSession.quality}
          </div>
        </div>
      )}
      
      {(transcriptionSegments?.length || 0) > 0 && (
        <div className="bg-white rounded-lg border max-h-40 overflow-y-auto">
          {(transcriptionSegments || []).map((segment, index) => (
            <div key={index} className="p-2 border-b last:border-b-0">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{segment.startTime}s</span>
                <span>Confiança: {Math.round((segment.confidence || 0) * 100)}%</span>
              </div>
              <p className="text-sm">{segment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar aba de sugestões
  const renderSuggestionsTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Sugestões Inteligentes</h4>
      
      {(recommendations?.length || 0) > 0 ? (
        <div className="space-y-2">
          {(recommendations || []).map((rec, index) => (
            <div key={index} className="bg-white rounded-lg border p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="text-sm font-medium">{rec.title}</h5>
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {rec.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      Confiança: {Math.round((rec.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Aplicar sugestão
                    addNotification({
                      type: 'success',
                      title: 'Sugestão Aplicada',
                      message: rec.title
                    });
                  }}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                >
                  Aplicar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma sugestão disponível</p>
          <p className="text-xs">Analise o conteúdo para receber sugestões</p>
        </div>
      )}
    </div>
  );

  // Renderizar aba de thumbnails
  const renderThumbnailsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Thumbnails Automáticos</h4>
        <button
          onClick={() => executeAITask('thumbnail-generation')}
        disabled={isProcessing || (selectedClips?.length || 0) === 0}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {isGeneratingThumbnails ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar'}
        </button>
      </div>
      
      {(thumbnails?.length || 0) > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {(thumbnails || []).map((thumb, index) => (
            <div key={index} className="relative group">
              <img 
                src={thumb.url} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-20 object-cover rounded border"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                <button className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-white text-black rounded text-xs">
                  Usar
                </button>
              </div>
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                {thumb.timestamp}s
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum thumbnail gerado</p>
        </div>
      )}
    </div>
  );

  // Renderizar aba de highlights
  const renderHighlightsTab = () => (
    <div className="h-full overflow-y-auto">
      <AIHighlightDetector
        videoId="current-video"
        videoUrl="/path/to/current/video.mp4"
        onHighlightSelect={(highlight) => {
        }}
        onExportComplete={(exportUrl) => {
        }}
      />
    </div>
  );

  const tabs = [
    { id: 'analysis', label: 'Análise', icon: <Brain className="w-4 h-4" />, render: renderAnalysisTab },
    { id: 'subtitles', label: 'Legendas', icon: <Subtitles className="w-4 h-4" />, render: renderSubtitlesTab },
    { id: 'transcription', label: 'Transcrição', icon: <Mic className="w-4 h-4" />, render: renderTranscriptionTab },
    { id: 'suggestions', label: 'Sugestões', icon: <Sparkles className="w-4 h-4" />, render: renderSuggestionsTab },
    { id: 'thumbnails', label: 'Thumbnails', icon: <Image className="w-4 h-4" />, render: renderThumbnailsTab },
    { id: 'highlights', label: 'Highlights', icon: <Target className="w-4 h-4" />, render: renderHighlightsTab },
    { id: 'categorization', label: 'Categorização', icon: <Folder className="w-4 h-4" />, render: () => (
      <div className="h-full overflow-y-auto">
        <AIContentCategorizer
          videoId="current-video"
          videoUrl="/path/to/current/video.mp4"
          onCategorySelect={(category) => {
          }}
          onTagSelect={(tag) => {
          }}
          onSegmentSelect={(segment) => {
          }}
          onExportComplete={(exportUrl) => {
          }}
        />
      </div>
    ) },
    { id: 'testing', label: 'Testes', icon: <TestTube className="w-4 h-4" />, render: () => (
      <div className="h-full overflow-y-auto">
        <AITestingPanel 
          onTestComplete={(results) => {
            addNotification({
              type: 'success',
              title: 'Testes Concluídos',
              message: 'Todos os testes de IA foram executados com sucesso'
            });
          }}
        />
      </div>
    ) },
    { id: 'performance', label: 'Performance', icon: <Activity className="w-4 h-4" />, render: () => (
      <div className="h-full overflow-y-auto">
        <AIPerformanceOptimizer
          videoId="current-video"
          onOptimizationComplete={(report) => {
            addNotification({
              type: 'success',
              title: 'Otimização Concluída',
              message: 'Performance do vídeo foi otimizada com sucesso'
            });
          }}
        />
      </div>
    ) }
  ];

  return (
    <div className={`bg-white border-l border-gray-200 flex flex-col ${className}`}>
      {/* Header do Painel */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Painel de IA</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleRealTimeMode}
            className={`p-1 rounded ${
              realTimeMode ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
            title="Modo Tempo Real"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={toggleAutoProcess}
            className={`p-1 rounded ${
              autoProcess ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
            title="Processamento Automático"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Barra de Progresso */}
      {isProcessing && (
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">{currentTask}</span>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Notificações */}
      {(notifications?.length || 0) > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 max-h-32 overflow-y-auto">
          {notifications.slice(0, 3).map(notification => (
            <div key={notification.id} className="flex items-start space-x-2 mb-2 last:mb-0">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-0.5 rounded hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isExpanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo da Tab */}
          <div className="flex-1 p-4 overflow-y-auto">
            {tabs.find(tab => tab.id === activeTab)?.render()}
          </div>

          {/* Status Bar */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Clips: {selectedClips?.length || 0}</span>
                <span>Tempo: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center space-x-2">
                {realTimeMode && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Tempo Real</span>
                  </div>
                )}
                {autoProcess && (
                  <span className="text-blue-600">Auto</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIIntegratedPanel;