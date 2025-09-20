import React, { useState, useEffect, useMemo } from 'react';
import {
  useAdvancedUI,
  UIComponent,
  Tour,
  TourStep,
  UITheme,
  UIAction,
  formatDuration,
  getComponentColor,
  getPriorityColor,
  formatUITime,
  getUIStatus,
  getUIHealth
} from '../../hooks/useAdvancedUI';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Search,
  Filter,
  BarChart3,
  Zap,
  Shield,
  Palette,
  Bell,
  MessageSquare,
  HelpCircle,
  Navigation,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  Users,
  Activity,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface AdvancedUIManagerProps {
  className?: string;
  onComponentCreate?: (component: UIComponent) => void;
  onTourComplete?: (tour: Tour) => void;
  onThemeChange?: (theme: UITheme) => void;
}

const AdvancedUIManager: React.FC<AdvancedUIManagerProps> = ({
  className = '',
  onComponentCreate,
  onTourComplete,
  onThemeChange
}) => {
  // Hook state
  const {
    components,
    tours,
    themes,
    config,
    stats,
    analytics,
    isLoading,
    error,
    actions,
    quickActions,
    activeTheme,
    visibleComponents,
    activeTours,
    completedTours,
    pendingTours,
    recommendations,
    isHealthy,
    needsAttention,
    getFilteredComponents,
    getFilteredTours,
    showComponent,
    hideComponent,
    removeComponent,
    startTour,
    stopTour,
    nextStep,
    previousStep,
    completeTour,
    updateConfig,
    setActiveTheme
  } = useAdvancedUI();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterVariant, setFilterVariant] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<UIComponent | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      // Add demo notification occasionally
      if (Math.random() > 0.95 && components.length < 5) {
        const variants = ['success', 'warning', 'error', 'info'] as const;
        const variant = variants[Math.floor(Math.random() * variants.length)];
        actions.showNotification(
          'Demo Notification',
          `This is a demo ${variant} notification`,
          variant
        );
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [actions, components.length]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Componentes Ativos',
      value: stats.activeComponents,
      total: stats.totalComponents,
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats.activeComponents > 0 ? 'up' : 'stable'
    },
    {
      title: 'Tours Completados',
      value: stats.completedTours,
      total: tours.length,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: stats.completedTours > 0 ? 'up' : 'stable'
    },
    {
      title: 'Engajamento',
      value: Math.round(stats.userEngagement),
      total: 100,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: stats.userEngagement > 50 ? 'up' : 'down'
    },
    {
      title: 'Performance',
      value: Math.round(stats.performanceScore),
      total: 100,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: stats.performanceScore > 80 ? 'up' : 'down'
    }
  ], [stats, tours.length]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'components', label: 'Componentes', icon: Layers },
    { id: 'tours', label: 'Tours', icon: Navigation },
    { id: 'themes', label: 'Temas', icon: Palette },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'needs_improvement': return AlertTriangle;
      case 'poor': return XCircle;
      default: return Info;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs_improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };
  
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'modal': return Maximize2;
      case 'tooltip': return HelpCircle;
      case 'notification': return Bell;
      case 'tour': return Navigation;
      case 'sidebar': return Layers;
      case 'dropdown': return Minimize2;
      case 'popover': return MessageSquare;
      default: return Info;
    }
  };
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'clear':
          await quickActions.clearAllComponents();
          break;
        case 'reset':
          await quickActions.resetAllTours();
          break;
        case 'accessibility':
          await quickActions.enableAccessibility();
          break;
        case 'optimize':
          await quickActions.optimizePerformance();
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };
  
  const handleCardExpand = (cardType: string) => {
    setActiveTab(cardType);
    setIsExpanded(true);
  };
  
  // Create component dialog
  const CreateComponentDialog = () => {
    const [componentData, setComponentData] = useState({
      type: 'notification' as const,
      title: '',
      content: '',
      variant: 'info' as const,
      priority: 'medium' as const
    });
    
    const handleCreate = () => {
      const id = actions.showNotification(
        componentData.title,
        componentData.content,
        componentData.variant
      );
      
      onComponentCreate?.(components.find(c => c.id === id)!);
      setShowCreateModal(false);
      setComponentData({
        type: 'notification',
        title: '',
        content: '',
        variant: 'info',
        priority: 'medium'
      });
    };
    
    if (!showCreateModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Criar Componente</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={componentData.type}
                onChange={(e) => setComponentData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="notification">Notificação</option>
                <option value="modal">Modal</option>
                <option value="tooltip">Tooltip</option>
                <option value="tour">Tour</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input
                type="text"
                value={componentData.title}
                onChange={(e) => setComponentData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Digite o título..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Conteúdo</label>
              <textarea
                value={componentData.content}
                onChange={(e) => setComponentData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-2 border rounded-md h-20"
                placeholder="Digite o conteúdo..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Variante</label>
              <select
                value={componentData.variant}
                onChange={(e) => setComponentData(prev => ({ ...prev, variant: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="info">Info</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!componentData.title || !componentData.content}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Create tour dialog
  const CreateTourDialog = () => {
    const [tourData, setTourData] = useState({
      name: '',
      description: '',
      category: 'general',
      difficulty: 'beginner' as const,
      steps: [] as TourStep[]
    });
    
    const handleCreate = () => {
      const id = actions.createTour(tourData.name, tourData.description, tourData.steps);
      setShowTourModal(false);
      setTourData({
        name: '',
        description: '',
        category: 'general',
        difficulty: 'beginner',
        steps: []
      });
    };
    
    if (!showTourModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Criar Tour</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                value={tourData.name}
                onChange={(e) => setTourData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Nome do tour..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={tourData.description}
                onChange={(e) => setTourData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-md h-20"
                placeholder="Descrição do tour..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={tourData.category}
                onChange={(e) => setTourData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="general">Geral</option>
                <option value="onboarding">Onboarding</option>
                <option value="feature">Funcionalidade</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Dificuldade</label>
              <select
                value={tourData.difficulty}
                onChange={(e) => setTourData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowTourModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!tourData.name || !tourData.description}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Advanced UI Manager
              </h2>
              <p className="text-sm text-gray-600">
                Gerencie componentes, tours e temas da interface
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isHealthy ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isHealthy ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              <span>{isHealthy ? 'Saudável' : 'Atenção'}</span>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        </div>
      )}
      
      {!isLoading && (
        <>
          {/* Status Cards */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusCards.map((card, index) => {
                const Icon = card.icon;
                const StatusIcon = getStatusIcon(getUIStatus(stats));
                
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCardExpand(card.title.toLowerCase().replace(' ', '_'))}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 ${card.bgColor} rounded-lg`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <span className="text-lg font-semibold">
                        {getTrendIcon(card.trend)}
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {card.value}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{card.total}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{card.title}</p>
                    </div>
                    
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${card.color.replace('text', 'bg')}`}
                        style={{ width: `${(card.value / card.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="px-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar componentes, tours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="modal">Modal</option>
                  <option value="notification">Notificação</option>
                  <option value="tooltip">Tooltip</option>
                  <option value="tour">Tour</option>
                </select>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar</span>
                </button>
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
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleQuickAction('clear')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Trash2 className="h-5 w-5 text-red-600 mb-2" />
                    <div className="font-medium">Limpar Componentes</div>
                    <div className="text-sm text-gray-600">Remove todos os componentes ativos</div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('reset')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Target className="h-5 w-5 text-blue-600 mb-2" />
                    <div className="font-medium">Reset Tours</div>
                    <div className="text-sm text-gray-600">Reinicia todos os tours</div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('accessibility')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Shield className="h-5 w-5 text-green-600 mb-2" />
                    <div className="font-medium">Acessibilidade</div>
                    <div className="text-sm text-gray-600">Ativa recursos de acessibilidade</div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('optimize')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <Zap className="h-5 w-5 text-orange-600 mb-2" />
                    <div className="font-medium">Otimizar</div>
                    <div className="text-sm text-gray-600">Otimiza performance da UI</div>
                  </button>
                </div>
                
                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-blue-900">Recomendações</h3>
                    </div>
                    <ul className="space-y-2">
                      {recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* System Health */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Saúde do Sistema</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Performance</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${stats.performanceScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{Math.round(stats.performanceScore)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Acessibilidade</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${stats.accessibilityScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{Math.round(stats.accessibilityScore)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engajamento</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${stats.userEngagement}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{Math.round(stats.userEngagement)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'components' && (
              <div className="space-y-4">
                {getFilteredComponents(filterType).length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum componente encontrado</h3>
                    <p className="text-gray-600 mb-4">Crie seu primeiro componente para começar</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Criar Componente
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredComponents(filterType).map((component) => {
                      const Icon = getComponentIcon(component.type);
                      
                      return (
                        <div key={component.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Icon className={`h-5 w-5 ${getComponentColor(component.variant)}`} />
                              <span className="font-medium text-gray-900">{component.title}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => component.isVisible ? hideComponent(component.id) : showComponent(component.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                {component.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => removeComponent(component.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{component.content}</p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full ${getComponentColor(component.variant)} bg-opacity-10`}>
                                {component.variant}
                              </span>
                              <span className={`px-2 py-1 rounded-full ${getPriorityColor(component.priority)} bg-opacity-10`}>
                                {component.priority}
                              </span>
                            </div>
                            <span className="text-gray-500">
                              {formatUITime(component.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'tours' && (
              <div className="space-y-4">
                {tours.length === 0 ? (
                  <div className="text-center py-8">
                    <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tour encontrado</h3>
                    <p className="text-gray-600 mb-4">Crie seu primeiro tour interativo</p>
                    <button
                      onClick={() => setShowTourModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Criar Tour
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tours.map((tour) => (
                      <div key={tour.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{tour.name}</h3>
                            <p className="text-sm text-gray-600">{tour.description}</p>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {tour.isActive ? (
                              <>
                                <button
                                  onClick={() => previousStep(tour.id)}
                                  disabled={tour.currentStep === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                >
                                  <SkipBack className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => stopTour(tour.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Pause className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => nextStep(tour.id)}
                                  disabled={tour.currentStep >= tour.steps.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                >
                                  <SkipForward className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startTour(tour.id)}
                                className="p-1 text-gray-400 hover:text-green-600"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progresso</span>
                            <span className="font-medium">{Math.round(tour.progress)}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${tour.progress}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{tour.category} • {tour.difficulty}</span>
                            <span>{tour.steps.length} passos</span>
                          </div>
                          
                          {tour.isActive && (
                            <div className="mt-3 p-2 bg-blue-50 rounded-md">
                              <div className="text-sm font-medium text-blue-900">
                                Passo {tour.currentStep + 1}: {tour.steps[tour.currentStep]?.title}
                              </div>
                              <div className="text-xs text-blue-700 mt-1">
                                {tour.steps[tour.currentStep]?.content}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'themes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        activeTheme.id === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTheme(theme.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{theme.name}</h3>
                        {activeTheme.id === theme.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: theme.colors.primary }}
                        ></div>
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: theme.colors.secondary }}
                        ></div>
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: theme.colors.success }}
                        ></div>
                        <div
                          className="h-8 rounded"
                          style={{ backgroundColor: theme.colors.warning }}
                        ></div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        Animações: {theme.animations.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Component Usage */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Uso de Componentes</h3>
                  <div className="space-y-3">
                    {analytics.componentUsage.map((usage, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-blue-${(index % 3 + 1) * 200}`}></div>
                          <span className="text-sm text-gray-700">{usage.type}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">{usage.count} usos</span>
                          <span className="text-gray-600">{formatDuration(usage.averageDuration)}</span>
                          <span className="text-green-600">{usage.successRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Métricas de Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.performance.renderTime}ms
                      </div>
                      <div className="text-sm text-gray-600">Tempo de Render</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(analytics.performance.memoryUsage / 1024).toFixed(1)}MB
                      </div>
                      <div className="text-sm text-gray-600">Uso de Memória</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.performance.errorRate}%
                      </div>
                      <div className="text-sm text-gray-600">Taxa de Erro</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.performance.loadTime}ms
                      </div>
                      <div className="text-sm text-gray-600">Tempo de Carga</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Configurações Gerais</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Animações</label>
                        <p className="text-xs text-gray-500">Ativar animações na interface</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.animations}
                        onChange={(e) => updateConfig({ animations: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Fechamento Automático</label>
                        <p className="text-xs text-gray-500">Fechar componentes automaticamente</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.autoClose}
                        onChange={(e) => updateConfig({ autoClose: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tooltips</label>
                        <p className="text-xs text-gray-500">Mostrar tooltips de ajuda</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showTooltips}
                        onChange={(e) => updateConfig({ showTooltips: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duração Padrão (ms)
                      </label>
                      <input
                        type="number"
                        value={config.defaultDuration}
                        onChange={(e) => updateConfig({ defaultDuration: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        min="1000"
                        max="30000"
                        step="1000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Componentes
                      </label>
                      <input
                        type="number"
                        value={config.maxComponents}
                        onChange={(e) => updateConfig({ maxComponents: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Accessibility Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Acessibilidade</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Alto Contraste</label>
                        <p className="text-xs text-gray-500">Ativar modo de alto contraste</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.accessibility.highContrast}
                        onChange={(e) => updateConfig({
                          accessibility: {
                            ...config.accessibility,
                            highContrast: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Movimento Reduzido</label>
                        <p className="text-xs text-gray-500">Reduzir animações e movimentos</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.accessibility.reducedMotion}
                        onChange={(e) => updateConfig({
                          accessibility: {
                            ...config.accessibility,
                            reducedMotion: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Leitor de Tela</label>
                        <p className="text-xs text-gray-500">Otimizar para leitores de tela</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.accessibility.screenReader}
                        onChange={(e) => updateConfig({
                          accessibility: {
                            ...config.accessibility,
                            screenReader: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Create Dialogs */}
      <CreateComponentDialog />
      <CreateTourDialog />
    </div>
  );
};

export default AdvancedUIManager;