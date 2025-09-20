import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Lightbulb,
  FileText,
  Image,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Calendar,
  Globe,
  Cpu,
  Database,
  Cloud,
  Shield,
  Sparkles
} from 'lucide-react';
import {
  useAdvancedAI,
  useSentimentAnalysis,
  useContentRecommendations,
  useScriptCorrections,
  useThumbnailGeneration,
  useAIModels,
  useAITasks,
  useAIInsights,
  useAIRealtime,
  useAIStats,
  useAIConfig
} from '../../hooks/useAdvancedAI';

const AdvancedAIManager: React.FC = () => {
  // Hooks
  const {
    isLoading,
    error,
    activeTab,
    searchQuery,
    filter,
    totalItems,
    activeTasksCount,
    completionRate,
    averageConfidence,
    actions,
    quickActions,
    throttledActions
  } = useAdvancedAI();
  
  const { stats, analytics } = useAIStats();
  const { config } = useAIConfig();
  
  // Local state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh demo data
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate real-time updates
      actions.refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, actions]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Total de Análises',
      value: totalItems.toLocaleString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Brain,
      color: 'blue'
    },
    {
      title: 'Tarefas Ativas',
      value: activeTasksCount.toString(),
      change: '-5%',
      trend: 'down' as const,
      icon: Activity,
      color: 'orange'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${(completionRate * 100).toFixed(1)}%`,
      change: '+8%',
      trend: 'up' as const,
      icon: Target,
      color: 'green'
    },
    {
      title: 'Confiança Média',
      value: `${(averageConfidence * 100).toFixed(1)}%`,
      change: '+3%',
      trend: 'up' as const,
      icon: Shield,
      color: 'purple'
    }
  ], [totalItems, activeTasksCount, completionRate, averageConfidence]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'sentiment', label: 'Análise de Sentimentos', icon: Brain },
    { id: 'recommendations', label: 'Recomendações', icon: Lightbulb },
    { id: 'corrections', label: 'Correções', icon: FileText },
    { id: 'thumbnails', label: 'Thumbnails', icon: Image },
    { id: 'models', label: 'Modelos', icon: Cpu },
    { id: 'tasks', label: 'Tarefas', icon: Clock },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'running': return Clock;
      default: return AlertCircle;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      default: return Minus;
    }
  };
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };
  
  const handleQuickAction = async (action: string, data?: any) => {
    try {
      switch (action) {
        case 'analyze':
          await quickActions.quickAnalyze(data.text);
          break;
        case 'recommend':
          await quickActions.quickRecommend();
          break;
        case 'correct':
          await quickActions.quickCorrect(data.text);
          break;
        case 'generate':
          await quickActions.quickGenerate(data.videoId);
          break;
      }
    } catch (error) {
      console.error('Erro na ação rápida:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de IA Avançado
              </h1>
              <p className="text-sm text-gray-500">
                Análise inteligente e automação de conteúdo
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => throttledActions.throttledSearch(e.target.value)}
                className="w-64 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-md transition-colors ${
                autoRefresh
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              title="Configurações avançadas"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => actions.setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
            <p className="ml-3 text-sm text-blue-700">Processando dados de IA...</p>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{card.change}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                <p className="text-sm text-gray-500 mt-1">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => actions.setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'sentiment' && <SentimentTab />}
        {activeTab === 'recommendations' && <RecommendationsTab />}
        {activeTab === 'corrections' && <CorrectionsTab />}
        {activeTab === 'thumbnails' && <ThumbnailsTab />}
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'realtime' && <RealtimeTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

// ============================================================================
// TAB COMPONENTS
// ============================================================================

const OverviewTab: React.FC = () => {
  const { stats, analytics } = useAIStats();
  
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance da IA</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <PieChart className="h-16 w-16" />
            <span className="ml-3">Gráfico de Performance</span>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Análise de sentimento concluída
                  </p>
                  <p className="text-xs text-gray-500">há {item} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-blue-900">Analisar Sentimento</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Lightbulb className="h-6 w-6 text-green-600" />
            <span className="font-medium text-green-900">Gerar Recomendações</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <FileText className="h-6 w-6 text-purple-600" />
            <span className="font-medium text-purple-900">Corrigir Script</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Image className="h-6 w-6 text-orange-600" />
            <span className="font-medium text-orange-900">Gerar Thumbnail</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SentimentTab: React.FC = () => {
  const {
    analyses,
    filteredAnalyses,
    selectedAnalysis,
    analyzeSentiment,
    deleteAnalysis,
    setSelectedAnalysis,
    quickAnalyze
  } = useSentimentAnalysis();
  
  return (
    <div className="p-6 space-y-6">
      {/* Analysis Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Análise de Sentimento</h3>
        <div className="space-y-4">
          <textarea
            placeholder="Digite o texto para análise..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={() => quickAnalyze('Texto de exemplo')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Analisar Sentimento
          </button>
        </div>
      </div>
      
      {/* Analysis Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resultados da Análise</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAnalyses.map((analysis) => {
            const SentimentIcon = getSentimentIcon(analysis.sentiment);
            const sentimentColor = getSentimentColor(analysis.sentiment);
            
            return (
              <div
                key={analysis.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAnalysis(analysis.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <SentimentIcon className={`h-5 w-5 ${sentimentColor}`} />
                      <span className={`font-medium ${sentimentColor}`}>
                        {analysis.sentiment.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {(analysis.confidence * 100).toFixed(1)}% confiança
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{analysis.text}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(analysis.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnalysis(analysis.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RecommendationsTab: React.FC = () => {
  const {
    recommendations,
    filteredRecommendations,
    topRecommendations,
    generateRecommendations,
    likeRecommendation,
    dislikeRecommendation,
    applyRecommendation
  } = useContentRecommendations();
  
  return (
    <div className="p-6 space-y-6">
      {/* Generate Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Recomendações de Conteúdo</h3>
            <p className="text-sm text-gray-500 mt-1">
              Gere recomendações inteligentes baseadas em IA
            </p>
          </div>
          <button
            onClick={() => generateRecommendations({ type: 'content' })}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Gerar Recomendações
          </button>
        </div>
      </div>
      
      {/* Recommendations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recomendações Ativas</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredRecommendations.map((recommendation) => (
            <div key={recommendation.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-gray-900">
                      {recommendation.title}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(recommendation.relevanceScore * 100).toFixed(0)}% relevante
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{recommendation.description}</p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => likeRecommendation(recommendation.id)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">Útil</span>
                    </button>
                    <button
                      onClick={() => dislikeRecommendation(recommendation.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span className="text-sm">Não útil</span>
                    </button>
                    <button
                      onClick={() => applyRecommendation(recommendation.id)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Aplicar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CorrectionsTab: React.FC = () => {
  const {
    corrections,
    filteredCorrections,
    recentCorrections,
    correctScript,
    applyCorrection,
    rejectCorrection
  } = useScriptCorrections();
  
  return (
    <div className="p-6 space-y-6">
      {/* Correction Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Correção de Script</h3>
        <div className="space-y-4">
          <textarea
            placeholder="Cole seu script aqui para correção..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={() => correctScript({ text: 'Script de exemplo', language: 'pt' })}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Corrigir Script
          </button>
        </div>
      </div>
      
      {/* Corrections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Correções Sugeridas</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredCorrections.map((correction) => (
            <div key={correction.id} className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Texto Original:</h4>
                  <p className="text-gray-700 bg-red-50 p-3 rounded-md">
                    {correction.originalText}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Texto Corrigido:</h4>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                    {correction.correctedText}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => applyCorrection(correction.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Aplicar Correção
                  </button>
                  <button
                    onClick={() => rejectCorrection(correction.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ThumbnailsTab: React.FC = () => {
  const {
    thumbnails,
    filteredThumbnails,
    generateThumbnails,
    selectThumbnail,
    downloadThumbnail
  } = useThumbnailGeneration();
  
  return (
    <div className="p-6 space-y-6">
      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Geração de Thumbnails</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="ID do vídeo ou URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={() => generateThumbnails({ videoId: 'video123', style: 'modern' })}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Gerar Thumbnails
          </button>
        </div>
      </div>
      
      {/* Thumbnails Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thumbnails Gerados</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThumbnails.map((thumbnail) => (
              <div key={thumbnail.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {thumbnail.style}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(thumbnail.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => selectThumbnail(thumbnail.id)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Selecionar
                    </button>
                    <button
                      onClick={() => downloadThumbnail(thumbnail.id)}
                      className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModelsTab: React.FC = () => {
  const { models, modelAccuracy, loadModels, trainModel, deleteModel } = useAIModels();
  
  return (
    <div className="p-6 space-y-6">
      {/* Models Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Modelos de IA</h3>
          <button
            onClick={() => loadModels()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Carregar Modelos
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Total de Modelos</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{models.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Precisão Média</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {(modelAccuracy * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-900">Modelos Ativos</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {models.filter(m => m.status === 'active').length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Models List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Modelos</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {models.map((model) => {
            const StatusIcon = getStatusIcon(model.status);
            const statusColor = getStatusColor(model.status);
            
            return (
              <div key={model.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      <span className="text-sm text-gray-500">{model.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Precisão: {(model.accuracy * 100).toFixed(1)}%</span>
                      <span>Versão: {model.version}</span>
                      <span>Atualizado: {formatTime(model.lastTrained)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => trainModel(model.id)}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Treinar modelo"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteModel(model.id)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Excluir modelo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TasksTab: React.FC = () => {
  const {
    tasks,
    activeTasks,
    activeTasksCount,
    completionRate,
    createTask,
    cancelTask,
    retryTask,
    clearCompletedTasks
  } = useAITasks();
  
  return (
    <div className="p-6 space-y-6">
      {/* Tasks Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Gerenciamento de Tarefas</h3>
          <button
            onClick={() => clearCompletedTasks()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Limpar Concluídas
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Tarefas Ativas</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{activeTasksCount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Taxa de Conclusão</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {(completionRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-900">Total de Tarefas</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-2">{tasks.length}</p>
          </div>
        </div>
      </div>
      
      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Tarefas</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            const statusColor = getStatusColor(task.status);
            
            return (
              <div key={task.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      <span className="text-sm text-gray-500">{task.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Progresso: {(task.progress * 100).toFixed(0)}%</span>
                      <span>Criado: {formatTime(task.createdAt)}</span>
                      {task.completedAt && (
                        <span>Concluído: {formatTime(task.completedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.status === 'running' && (
                      <button
                        onClick={() => cancelTask(task.id)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                        title="Cancelar tarefa"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    {task.status === 'failed' && (
                      <button
                        onClick={() => retryTask(task.id)}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Tentar novamente"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {task.status === 'running' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InsightsTab: React.FC = () => {
  const { insights, createInsight, dismissInsight } = useAIInsights();
  
  return (
    <div className="p-6 space-y-6">
      {/* Insights Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Insights de IA</h3>
        <p className="text-gray-600">
          Descubra padrões e tendências automaticamente identificados pela IA.
        </p>
      </div>
      
      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    insight.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : insight.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{insight.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Categoria: {insight.category}</span>
                  <span>Confiança: {(insight.confidence * 100).toFixed(0)}%</span>
                  <span>{formatTime(insight.timestamp)}</span>
                </div>
              </div>
              <button
                onClick={() => dismissInsight(insight.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Dispensar insight"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RealtimeTab: React.FC = () => {
  const { events, isConnected, recentEvents, logEvent, clearEvents } = useAIRealtime();
  
  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <h3 className="text-lg font-medium text-gray-900">
              Status da Conexão: {isConnected ? 'Conectado' : 'Desconectado'}
            </h3>
          </div>
          <button
            onClick={() => clearEvents()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Limpar Eventos
          </button>
        </div>
      </div>
      
      {/* Real-time Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Eventos em Tempo Real</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {recentEvents.map((event, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.type}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsTab: React.FC = () => {
  const { config, updateConfig, resetConfig, saveConfig } = useAIConfig();
  
  return (
    <div className="p-6 space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Tempo Real</label>
              <p className="text-sm text-gray-500">Ativar atualizações em tempo real</p>
            </div>
            <input
              type="checkbox"
              checked={config.enableRealtime}
              onChange={(e) => updateConfig({ enableRealtime: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Atualização Automática</label>
              <p className="text-sm text-gray-500">Atualizar dados automaticamente</p>
            </div>
            <input
              type="checkbox"
              checked={config.enableAutoRefresh}
              onChange={(e) => updateConfig({ enableAutoRefresh: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Intervalo de Atualização (ms)
            </label>
            <input
              type="number"
              value={config.refreshInterval}
              onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* AI Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de IA</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Limite de Confiança
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.confidenceThreshold}
              onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span>{(config.confidenceThreshold * 100).toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Máximo de Resultados
            </label>
            <input
              type="number"
              value={config.maxResults}
              onChange={(e) => updateConfig({ maxResults: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => saveConfig()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Salvar Configurações
          </button>
          <button
            onClick={() => resetConfig()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Restaurar Padrões
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIManager;