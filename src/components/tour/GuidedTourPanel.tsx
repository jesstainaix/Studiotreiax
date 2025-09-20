import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Users,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  BookOpen,
  Zap,
  Star,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  MapPin,
  Lightbulb,
  Layers,
  Navigation,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import {
  useGuidedTour,
  useGuidedTourStats,
  useGuidedTourConfig,
  useGuidedTourSearch,
  useCurrentTour,
  useGuidedTourTemplates,
  useGuidedTourAnalytics,
  calculateTourComplexity
} from '../../hooks/useGuidedTour';
import {
  GuidedTour,
  TourStep,
  TourTemplate,
  formatDuration,
  getDifficultyColor,
  getCategoryIcon,
  getProgressColor
} from '../../services/guidedTourService';

interface GuidedTourPanelProps {
  className?: string;
}

const GuidedTourPanel: React.FC<GuidedTourPanelProps> = ({ className = '' }) => {
  // Hooks
  const {
    tours,
    templates,
    userProgress,
    events,
    config,
    stats,
    metrics,
    isLoading,
    error,
    computed,
    actions,
    quickActions
  } = useGuidedTour();
  
  const { healthScore, trends } = useGuidedTourStats();
  const { updateConfig } = useGuidedTourConfig();
  const {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    setSortBy,
    clearFilters,
    hasActiveFilters,
    results,
    totalResults
  } = useGuidedTourSearch();
  
  const {
    currentTour,
    currentStep,
    isPlaying,
    isPaused,
    progress,
    canGoNext,
    canGoPrevious,
    stepInfo,
    startTour,
    pauseTour,
    resumeTour,
    stopTour,
    nextStep,
    previousStep
  } = useCurrentTour();
  
  const {
    popularTemplates,
    recentTemplates,
    createTemplate,
    createTour
  } = useGuidedTourTemplates();
  
  const {
    eventsByType,
    recentEvents,
    userActivity,
    recommendations,
    healthScores
  } = useGuidedTourAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'tour' | 'template' | 'step'>('tour');
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      quickActions.refreshNow();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [quickActions]);
  
  // Status cards data
  const statusCards = [
    {
      id: 'total-tours',
      title: 'Tours Ativos',
      value: tours.length.toString(),
      change: '+12%',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'blue'
    },
    {
      id: 'completion-rate',
      title: 'Taxa de Conclusão',
      value: `${Math.round(stats.averageCompletionRate)}%`,
      change: trends.completion === 'up' ? '+5%' : trends.completion === 'down' ? '-3%' : '0%',
      trend: trends.completion,
      icon: Target,
      color: 'green'
    },
    {
      id: 'active-users',
      title: 'Usuários Ativos',
      value: metrics.usage.dailyActiveUsers.toString(),
      change: trends.engagement === 'up' ? '+8%' : '-2%',
      trend: trends.engagement,
      icon: Users,
      color: 'purple'
    },
    {
      id: 'health-score',
      title: 'Score de Saúde',
      value: `${healthScore}%`,
      change: trends.satisfaction === 'up' ? '+4%' : trends.satisfaction === 'down' ? '-1%' : '0%',
      trend: trends.satisfaction,
      icon: Activity,
      color: 'orange'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'tours', label: 'Tours', icon: BookOpen },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'progress', label: 'Progresso', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'player', label: 'Player', icon: Play },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'stopped': return <Square className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };
  
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Star className="w-4 h-4 text-green-500" />;
      case 'intermediate': return <Award className="w-4 h-4 text-yellow-500" />;
      case 'advanced': return <Zap className="w-4 h-4 text-red-500" />;
      default: return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'tooltip': return <MousePointer className="w-4 h-4" />;
      case 'modal': return <Monitor className="w-4 h-4" />;
      case 'overlay': return <Layers className="w-4 h-4" />;
      case 'highlight': return <Lightbulb className="w-4 h-4" />;
      case 'navigation': return <Navigation className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };
  
  const handleQuickAction = async (action: string, id?: string) => {
    try {
      switch (action) {
        case 'start':
          if (id) startTour(id);
          break;
        case 'pause':
          pauseTour();
          break;
        case 'resume':
          resumeTour();
          break;
        case 'stop':
          stopTour();
          break;
        case 'refresh':
          await quickActions.refreshNow();
          break;
        case 'export':
          await quickActions.exportTours();
          break;
        case 'reset':
          await quickActions.resetAllProgress();
          break;
      }
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };
  
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };
  
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };
  
  const handleCreateNew = (type: 'tour' | 'template' | 'step') => {
    setCreateType(type);
    setShowCreateDialog(true);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Tours Guiados
            </h2>
            <p className="text-gray-600 mt-1">
              Sistema de onboarding e treinamento interativo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAction('refresh')}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => handleCreateNew('tour')}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Tour
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-blue-700">Carregando dados...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => toggleCardExpansion(card.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className={`text-sm font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-500">vs. período anterior</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Search and Filter Bar */}
      <div className="px-6 pb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar tours, templates ou categorias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="onboarding">Onboarding</option>
              <option value="feature">Recursos</option>
              <option value="workflow">Fluxo de Trabalho</option>
              <option value="advanced">Avançado</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Dificuldades</option>
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Nome</option>
              <option value="difficulty">Dificuldade</option>
              <option value="estimatedTime">Tempo</option>
              <option value="popularity">Popularidade</option>
              <option value="recent">Mais Recente</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Tours Populares</h3>
                <div className="space-y-3">
                  {popularTemplates.slice(0, 3).map((template) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <span className="text-blue-800 font-medium">{template.name}</span>
                      <span className="text-blue-600 text-sm">{template.usageCount} usos</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  {recentEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-green-800 font-medium">{event.type}</span>
                      <span className="text-green-600 text-sm">
                        {formatTime(Math.floor((Date.now() - event.timestamp.getTime()) / 1000))} atrás
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Recomendações</h3>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-purple-800 text-sm">
                      {rec.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Current Tour Status */}
            {currentTour && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Tour Ativo: {currentTour.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-indigo-600 mb-1">Progresso</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-indigo-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-indigo-900">
                        {progress.percentage}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 mb-1">Etapa Atual</p>
                    <p className="font-medium text-indigo-900">
                      {stepInfo?.current || 0} de {stepInfo?.total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(isPlaying ? 'active' : isPaused ? 'paused' : 'stopped')}
                      <span className="font-medium text-indigo-900">
                        {isPlaying ? 'Ativo' : isPaused ? 'Pausado' : 'Parado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Tours ({totalResults})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreateNew('tour')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Tour
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((tour) => (
                <div
                  key={tour.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getDifficultyIcon(tour.difficulty)}
                      <h4 className="font-semibold text-gray-900">{tour.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(tour.isActive ? 'active' : tour.isCompleted ? 'completed' : 'stopped')}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {tour.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(tour.estimatedTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {tour.analytics.views}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getDifficultyColor(tour.difficulty)
                      }`}>
                        {tour.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tour.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickAction('start', tour.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Iniciar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configurações do Sistema</h3>
            
            {/* Theme Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Tema e Aparência</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Primária
                  </label>
                  <input
                    type="color"
                    value={config.theme.primaryColor}
                    onChange={(e) => updateConfig({
                      theme: { ...config.theme, primaryColor: e.target.value }
                    })}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Secundária
                  </label>
                  <input
                    type="color"
                    value={config.theme.secondaryColor}
                    onChange={(e) => updateConfig({
                      theme: { ...config.theme, secondaryColor: e.target.value }
                    })}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
              </div>
            </div>
            
            {/* Animation Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Animações</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Habilitar Animações</span>
                  <input
                    type="checkbox"
                    checked={config.animations.enabled}
                    onChange={(e) => updateConfig({
                      animations: { ...config.animations, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração da Animação (ms)
                  </label>
                  <input
                    type="number"
                    value={config.animations.duration}
                    onChange={(e) => updateConfig({
                      animations: { ...config.animations, duration: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="2000"
                    step="100"
                  />
                </div>
              </div>
            </div>
            
            {/* Accessibility Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Acessibilidade</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Alto Contraste</span>
                  <input
                    type="checkbox"
                    checked={config.accessibility.highContrast}
                    onChange={(e) => updateConfig({
                      accessibility: { ...config.accessibility, highContrast: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Reduzir Movimento</span>
                  <input
                    type="checkbox"
                    checked={config.accessibility.reduceMotion}
                    onChange={(e) => updateConfig({
                      accessibility: { ...config.accessibility, reduceMotion: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Suporte a Leitor de Tela</span>
                  <input
                    type="checkbox"
                    checked={config.accessibility.screenReader}
                    onChange={(e) => updateConfig({
                      accessibility: { ...config.accessibility, screenReader: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Other tabs content would go here */}
        {activeTab !== 'overview' && activeTab !== 'tours' && activeTab !== 'settings' && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-gray-500">
              Conteúdo em desenvolvimento...
            </p>
          </div>
        )}
      </div>
      
      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Novo {createType === 'tour' ? 'Tour' : createType === 'template' ? 'Template' : 'Passo'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Nome do ${createType}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder={`Descrição do ${createType}`}
                />
              </div>
              {createType === 'tour' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="onboarding">Onboarding</option>
                    <option value="feature">Recursos</option>
                    <option value="workflow">Fluxo de Trabalho</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Handle create logic here
                  setShowCreateDialog(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedTourPanel;