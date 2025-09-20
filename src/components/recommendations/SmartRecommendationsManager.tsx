import React, { useState, useEffect } from 'react';
import {
  useSmartRecommendations,
  useRecommendationStats,
  useRecommendationEngines,
  useRecommendationCampaigns,
  useRecommendationAnalytics
} from '../../hooks/useSmartRecommendations';
import {
  Brain,
  TrendingUp,
  Users,
  Target,
  Zap,
  Heart,
  Download,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Filter,
  Search,
  Settings,
  BarChart3,
  Lightbulb,
  Cpu,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Tag,
  Layers,
  Activity,
  PieChart,
  LineChart,
  Calendar,
  FileText,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Info
} from 'lucide-react';

const SmartRecommendationsManager: React.FC = () => {
  // Main hook
  const {
    recommendations,
    personalizedRecommendations,
    trendingRecommendations,
    topRatedRecommendations,
    isLoading,
    error,
    isTraining,
    connectionStatus,
    filter,
    searchQuery,
    stats,
    setFilter,
    setSearch,
    clearFilters,
    quickActions,
    generateRecommendations,
    refreshRecommendations,
    optimizeRecommendations,
    explainRecommendation,
    getSimilarRecommendations,
    utilities
  } = useSmartRecommendations();
  
  // Specialized hooks
  const { customStats, loadCustomStats } = useRecommendationStats();
  const { engines, trainEngine, toggleEngine } = useRecommendationEngines();
  const { campaigns, createCampaign } = useRecommendationCampaigns();
  const { createReport } = useRecommendationAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (recommendations.length === 0) {
        generateRecommendations();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [recommendations.length, generateRecommendations]);
  
  // Filtered and sorted data
  const filteredRecommendations = recommendations.filter(rec => {
    if (searchQuery && !rec.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter.categories?.length && !filter.categories.includes(rec.category)) {
      return false;
    }
    if (filter.types?.length && !filter.types.includes(rec.type)) {
      return false;
    }
    return true;
  });
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Recomendações',
      value: stats.totalRecommendations.toLocaleString(),
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Taxa de Cliques',
      value: `${Math.round(stats.clickThroughRate * 100)}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+5.2%',
      changeType: 'positive' as const
    },
    {
      title: 'Satisfação do Usuário',
      value: `${Math.round(stats.userSatisfaction * 100)}%`,
      icon: Heart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8.1%',
      changeType: 'positive' as const
    },
    {
      title: 'Engines Ativas',
      value: engines.filter(e => e.enabled).length.toString(),
      icon: Cpu,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '3 ativas',
      changeType: 'neutral' as const
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'recommendations', label: 'Recomendações', icon: Lightbulb },
    { id: 'engines', label: 'Engines', icon: Cpu },
    { id: 'campaigns', label: 'Campanhas', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Handle recommendation actions
  const handleRecommendationAction = async (action: string, id: string) => {
    try {
      switch (action) {
        case 'like':
          await quickActions.like(id);
          break;
        case 'dislike':
          await quickActions.dislike(id);
          break;
        case 'download':
          await quickActions.download(id);
          break;
        case 'share':
          await quickActions.share(id, 'general');
          break;
        case 'explain':
          const exp = await explainRecommendation(id);
          setExplanation(exp);
          break;
        case 'similar':
          const similar = await getSimilarRecommendations(id);
          setSimilarItems(similar);
          break;
      }
    } catch (error) {
      console.error('Error handling recommendation action:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              Sistema de Recomendações Inteligentes
            </h1>
            <p className="text-gray-600 mt-2">
              Algoritmos avançados de machine learning para personalização de conteúdo
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
              connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              {connectionStatus === 'connected' ? 'Conectado' :
               connectionStatus === 'reconnecting' ? 'Reconectando' : 'Desconectado'}
            </div>
            
            <button
              onClick={refreshRecommendations}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button
              onClick={optimizeRecommendations}
              disabled={isTraining}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {isTraining ? 'Otimizando...' : 'Otimizar'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
          <span className="text-blue-700">Carregando recomendações...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' :
                  card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs. período anterior</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendações Personalizadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalizedRecommendations.slice(0, 4).map((rec) => (
                      <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{rec.title}</h4>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {Math.round(rec.relevanceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">{rec.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRecommendationAction('like', rec.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ThumbsUp className="h-3 w-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleRecommendationAction('download', rec.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Download className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Engines de IA</h3>
                  <div className="space-y-3">
                    {engines.slice(0, 3).map((engine) => (
                      <div key={engine.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{engine.name}</p>
                          <p className="text-xs text-gray-600">
                            Precisão: {Math.round(engine.performance.accuracy * 100)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            engine.enabled ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <button
                            onClick={() => toggleEngine(engine.id)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {engine.enabled ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Trending Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendingRecommendations.slice(0, 4).map((rec) => (
                    <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-900">{rec.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{rec.category}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{rec.analytics.views} visualizações</span>
                        <span>{rec.usageCount} downloads</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar recomendações..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Limpar
                </button>
              </div>
              
              {/* Filters Panel */}
              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                      <select
                        onChange={(e) => setFilter({ categories: e.target.value ? [e.target.value] : [] })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Todas as categorias</option>
                        <option value="Apresentações">Apresentações</option>
                        <option value="Efeitos">Efeitos</option>
                        <option value="Templates">Templates</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                      <select
                        onChange={(e) => setFilter({ types: e.target.value ? [e.target.value] : [] })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Todos os tipos</option>
                        <option value="template">Template</option>
                        <option value="effect">Efeito</option>
                        <option value="transition">Transição</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Avaliação Mínima</label>
                      <select
                        onChange={(e) => setFilter({ minRating: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Qualquer avaliação</option>
                        <option value="4.0">4+ estrelas</option>
                        <option value="4.5">4.5+ estrelas</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {utilities.formatRecommendationType(rec.type)}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {rec.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{rec.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(rec.relevanceScore * 100)}% relevante
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>{rec.analytics.views} visualizações</span>
                      <span>{rec.usageCount} downloads</span>
                      <span>{rec.analytics.likes} curtidas</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRecommendationAction('like', rec.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Curtir
                      </button>
                      <button
                        onClick={() => handleRecommendationAction('download', rec.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                      <button
                        onClick={() => handleRecommendationAction('explain', rec.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        <Info className="h-3 w-3" />
                        Explicar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Engines Tab */}
          {activeTab === 'engines' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Engines de Recomendação</h3>
                <button
                  onClick={() => setShowEngineModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Nova Engine
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {engines.map((engine) => (
                  <div key={engine.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{engine.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{engine.type}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        engine.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precisão:</span>
                        <span className="font-medium">{Math.round(engine.performance.accuracy * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CTR:</span>
                        <span className="font-medium">{Math.round(engine.performance.clickThroughRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Peso:</span>
                        <span className="font-medium">{Math.round(engine.weight * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleEngine(engine.id)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded ${
                          engine.enabled
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {engine.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        {engine.enabled ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => trainEngine(engine.id)}
                        disabled={isTraining}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                      >
                        <Zap className="h-3 w-3" />
                        Treinar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Other tabs placeholder */}
          {['campaigns', 'analytics', 'settings'].includes(activeTab) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Settings className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'campaigns' && 'Campanhas de Recomendação'}
                {activeTab === 'analytics' && 'Analytics Avançado'}
                {activeTab === 'settings' && 'Configurações do Sistema'}
              </h3>
              <p className="text-gray-600">
                Esta seção está em desenvolvimento e será implementada em breve.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Explanation Modal */}
      {explanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Explicação da Recomendação</h3>
            <p className="text-gray-600 mb-6">{explanation}</p>
            <button
              onClick={() => setExplanation('')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRecommendationsManager;