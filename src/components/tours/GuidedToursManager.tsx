import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Settings, 
  BarChart3, 
  Users, 
  BookOpen, 
  Star, 
  Clock, 
  Target, 
  Zap,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Archive,
  Eye,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Layers
} from 'lucide-react';
import { useGuidedTours, useGuidedToursStats, useGuidedToursAnalytics } from '../../hooks/useGuidedTours';
import { Tour, TourStep } from '../../services/guidedToursService';

interface GuidedToursManagerProps {
  className?: string;
}

const GuidedToursManager: React.FC<GuidedToursManagerProps> = ({ className = '' }) => {
  // Hooks
  const {
    tours,
    activeTour,
    currentStep,
    currentStepIndex,
    isPlaying,
    isPaused,
    isCompleted,
    filteredTours,
    availableTours,
    completedTours,
    inProgressTours,
    recommendedTours,
    filter,
    searchQuery,
    selectedTourId,
    showOverlay,
    error,
    loading,
    computedValues,
    
    // Actions
    setFilter,
    setSearch,
    clearFilters,
    setSelectedTourId,
    actions,
    
    // Tour control
    startTour,
    quickActions,
    
    // System operations
    systemOps,
    
    // Utilities
    tourUtils,
    configUtils,
    analyticsUtils
  } = useGuidedTours();
  
  const stats = useGuidedToursStats();
  const analytics = useGuidedToursAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Filtered and sorted data
  const processedTours = useMemo(() => {
    const result = [...filteredTours];
    
    // Sort
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Tour];
      let bValue: any = b[sortBy as keyof Tour];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return result;
  }, [filteredTours, sortBy, sortOrder]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Tours',
      value: stats.totalTours,
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Tours Ativos',
      value: stats.activeTours,
      icon: Play,
      color: 'bg-green-500',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${Math.round(stats.averageCompletionRate)}%`,
      icon: Target,
      color: 'bg-purple-500',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Tempo Total',
      value: tourUtils.formatDuration(Math.round(stats.totalTimeSpent / 60)),
      icon: Clock,
      color: 'bg-orange-500',
      change: '+15%',
      trend: 'up'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'tours', label: 'Tours', icon: BookOpen },
    { id: 'player', label: 'Player', icon: Play },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Handle tour selection
  const handleTourSelect = (tourId: string) => {
    if (selectedTours.includes(tourId)) {
      setSelectedTours(selectedTours.filter(id => id !== tourId));
    } else {
      setSelectedTours([...selectedTours, tourId]);
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    try {
      // Implementation would depend on action
      setSelectedTours([]);
    } catch (error) {
      console.error('Erro na ação em lote:', error);
    }
  };
  
  // Handle tour start
  const handleStartTour = async (tourId: string) => {
    try {
      await startTour(tourId, 'current-user');
      setShowPlayerModal(true);
    } catch (error) {
      console.error('Erro ao iniciar tour:', error);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tours Guiados</h2>
            <p className="text-gray-600 mt-1">
              Sistema avançado de onboarding e treinamento interativo
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => systemOps.refresh()}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Tour
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Carregando tours...</span>
        </div>
      )}
      
      {!loading && (
        <>
          {/* Status Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">{card.change}</span>
                    <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
              );
            })}
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
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tours Recomendados</h3>
                    <div className="space-y-3">
                      {recommendedTours.slice(0, 5).map((tour) => (
                        <div key={tour.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{tourUtils.getCategoryIcon(tour.category)}</div>
                            <div>
                              <h4 className="font-medium text-gray-900">{tour.name}</h4>
                              <p className="text-sm text-gray-600">
                                {tour.estimatedTime}min • {tour.difficulty} • {tour.totalCompletions} conclusões
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-sm text-gray-600">{tour.averageRating.toFixed(1)}</span>
                            </div>
                            <button
                              onClick={() => handleStartTour(tour.id)}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Iniciar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                    <div className="space-y-3">
                      {analytics.recentEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {event.type === 'tour_started' && 'Tour iniciado'}
                              {event.type === 'tour_completed' && 'Tour concluído'}
                              {event.type === 'step_completed' && 'Passo concluído'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tours Tab */}
            {activeTab === 'tours' && (
              <div className="space-y-6">
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar tours..."
                        value={searchQuery}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filter.category || ''}
                      onChange={(e) => setFilter({ category: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas as categorias</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="feature">Funcionalidades</option>
                      <option value="advanced">Avançado</option>
                      <option value="update">Atualizações</option>
                    </select>
                    
                    <select
                      value={filter.difficulty || ''}
                      onChange={(e) => setFilter({ difficulty: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas as dificuldades</option>
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediário</option>
                      <option value="advanced">Avançado</option>
                    </select>
                    
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                
                {/* Bulk Actions */}
                {selectedTours.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">
                      {selectedTours.length} tour(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkAction('activate')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Ativar
                      </button>
                      <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                      >
                        Desativar
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Tours Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedTours.map((tour) => (
                    <div key={tour.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedTours.includes(tour.id)}
                            onChange={() => handleTourSelect(tour.id)}
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="text-2xl mr-2">{tourUtils.getCategoryIcon(tour.category)}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tour.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tour.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">{tour.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {tour.estimatedTime}min
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {tour.totalCompletions}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-400" />
                          {tour.averageRating.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tourUtils.getDifficultyColor(tour.difficulty)}`}>
                          {tour.difficulty}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStartTour(tour.id)}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Iniciar
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {processedTours.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tour encontrado</h3>
                    <p className="text-gray-600">Tente ajustar os filtros ou criar um novo tour.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Player Tab */}
            {activeTab === 'player' && (
              <div className="space-y-6">
                {activeTour ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{activeTour.name}</h3>
                        <p className="text-gray-600 mt-1">{activeTour.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={quickActions.playPause}
                          className={`flex items-center px-4 py-2 rounded-lg text-white transition-colors ${
                            isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                          {isPlaying ? 'Pausar' : isPaused ? 'Continuar' : 'Iniciar'}
                        </button>
                        <button
                          onClick={quickActions.stop}
                          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Parar
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Passo {currentStepIndex + 1} de {activeTour.steps.length}
                        </span>
                        <span className="text-sm text-gray-600">
                          {computedValues.currentTourInfo?.progress}% concluído
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${computedValues.currentTourInfo?.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Current Step */}
                    {currentStep && (
                      <div className="bg-white rounded-lg p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{currentStep.title}</h4>
                            <p className="text-gray-600 mt-1">{currentStep.description}</p>
                          </div>
                          <div className="text-2xl">{tourUtils.getStepIcon(currentStep)}</div>
                        </div>
                        
                        <div className="prose max-w-none">
                          <p>{currentStep.content}</p>
                        </div>
                        
                        {currentStep.media && (
                          <div className="mt-4">
                            {currentStep.media.type === 'image' && (
                              <img 
                                src={currentStep.media.url} 
                                alt={currentStep.media.alt}
                                className="rounded-lg max-w-full h-auto"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {/* previousStep */}}
                        disabled={!computedValues.navigationState.canGoPrevious}
                        className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        {currentStep?.skippable && (
                          <button
                            onClick={quickActions.skip}
                            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            <SkipForward className="w-4 h-4 mr-2" />
                            Pular
                          </button>
                        )}
                        <button
                          onClick={quickActions.restart}
                          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reiniciar
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {/* nextStep */}}
                        disabled={!computedValues.navigationState.canGoNext}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum tour ativo</h3>
                    <p className="text-gray-600 mb-6">Selecione um tour para começar a experiência guiada.</p>
                    <button
                      onClick={() => setActiveTab('tours')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Explorar Tours
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Categoria</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{tourUtils.getCategoryIcon(category)}</span>
                            <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                          </div>
                          <span className="text-sm text-gray-600">{count} tours</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos Recentes</h3>
                    <div className="space-y-3">
                      {analytics.recentEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto-início</label>
                        <p className="text-xs text-gray-500">Iniciar tours automaticamente para novos usuários</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configUtils.getConfigValue('autoStart')}
                        onChange={(e) => configUtils.updateConfig({ autoStart: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mostrar Progresso</label>
                        <p className="text-xs text-gray-500">Exibir barra de progresso durante os tours</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configUtils.getConfigValue('showProgress')}
                        onChange={(e) => configUtils.updateConfig({ showProgress: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Permitir Pular</label>
                        <p className="text-xs text-gray-500">Permitir que usuários pulem passos opcionais</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configUtils.getConfigValue('allowSkipping')}
                        onChange={(e) => configUtils.updateConfig({ allowSkipping: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Animações</label>
                        <p className="text-xs text-gray-500">Habilitar animações e transições</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={configUtils.getConfigValue('animations')}
                        onChange={(e) => configUtils.updateConfig({ animations: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GuidedToursManager;