import React, { useState, useEffect, useMemo } from 'react';
import {
  useWorkspaceCustomization,
  useWorkspaceCustomizationStats,
  useWorkspaceCustomizationAnalytics
} from '../../hooks/useWorkspaceCustomization';
import {
  Settings,
  Layout,
  Palette,
  Template,
  Grid,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Move,
  RotateCcw,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  Trash2,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Star,
  Heart,
  Zap,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const WorkspaceCustomizationManager: React.FC = () => {
  // Hooks
  const {
    layouts,
    themes,
    templates,
    preferences,
    currentLayout,
    currentTheme,
    activeTemplate,
    filter,
    searchQuery,
    selectedLayoutId,
    selectedThemeId,
    selectedTemplateId,
    showPreview,
    isCustomizing,
    loading,
    error,
    computedValues,
    setFilter,
    setSearch,
    clearFilters,
    setSelectedLayoutId,
    setSelectedThemeId,
    setSelectedTemplateId,
    setShowPreview,
    setIsCustomizing,
    clearError,
    actions,
    management,
    quickActions,
    quickActionsProgress,
    advancedFeatures,
    systemOps,
    utils,
    autoRefresh
  } = useWorkspaceCustomization();
  
  const { stats } = useWorkspaceCustomizationStats();
  const { trackEvent } = useWorkspaceCustomizationAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'layout' | 'theme' | 'template'>('layout');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layouts: true,
    themes: true,
    templates: true,
    preferences: false
  });
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      if (Math.random() > 0.7) {
        systemOps.refresh();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [systemOps]);
  
  // Filtered and sorted data
  const filteredLayouts = useMemo(() => {
    let filtered = layouts;
    
    if (searchQuery) {
      filtered = filtered.filter(layout => 
        layout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        layout.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        layout.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter(layout => layout.type === filter.category);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(layout => 
        filter.tags!.some(tag => layout.tags.includes(tag))
      );
    }
    
    return filtered.sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  }, [layouts, searchQuery, filter]);
  
  const filteredThemes = useMemo(() => {
    let filtered = themes;
    
    if (searchQuery) {
      filtered = filtered.filter(theme => 
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter(theme => theme.type === filter.category);
    }
    
    return filtered.sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });
  }, [themes, searchQuery, filter]);
  
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter(template => template.category === filter.category);
    }
    
    return filtered.sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  }, [templates, searchQuery, filter]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Layouts Personalizados',
      value: computedValues.customLayouts.length,
      total: layouts.length,
      icon: Layout,
      color: 'blue',
      trend: '+12%'
    },
    {
      title: 'Temas Criados',
      value: computedValues.customThemes.length,
      total: themes.length,
      icon: Palette,
      color: 'purple',
      trend: '+8%'
    },
    {
      title: 'Templates Salvos',
      value: templates.length,
      total: templates.length,
      icon: Template,
      color: 'green',
      trend: '+15%'
    },
    {
      title: 'Progresso Geral',
      value: Math.round(computedValues.customizationProgress.overall),
      total: 100,
      icon: TrendingUp,
      color: 'orange',
      trend: '+5%',
      suffix: '%'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'layouts', label: 'Layouts', icon: Layout },
    { id: 'themes', label: 'Temas', icon: Palette },
    { id: 'templates', label: 'Templates', icon: Template },
    { id: 'preferences', label: 'Preferências', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: PieChart }
  ];
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleCreateNew = (type: 'layout' | 'theme' | 'template') => {
    setCreateType(type);
    setShowCreateModal(true);
    trackEvent({
      type: 'create_modal_opened',
      userId: 'current-user',
      targetType: type,
      metadata: {}
    });
  };
  
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Grid;
    }
  };
  
  const getThemeColorPreview = (theme: any) => {
    return (
      <div className="flex space-x-1">
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Personalização do Workspace
              </h1>
              <p className="text-sm text-gray-500">
                Configure layouts, temas e preferências do seu ambiente de trabalho
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={autoRefresh.toggle}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh.enabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4 mr-2 inline" />
              Auto-refresh {autoRefresh.enabled ? 'On' : 'Off'}
            </button>
            
            {/* Quick actions */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Exportar
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Importar
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Loader2 className="w-5 h-5 text-blue-500 mr-3 animate-spin" />
          <span className="text-blue-700">Carregando configurações...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                    <Icon className={`w-5 h-5 text-${card.color}-600`} />
                  </div>
                  <span className={`text-sm font-medium text-${card.color}-600`}>
                    {card.trend}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </span>
                    {card.suffix && (
                      <span className="text-lg text-gray-500 ml-1">
                        {card.suffix}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 ml-2">
                      / {card.total}{card.suffix || ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{card.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {computedValues.quickStats.totalCustomizations}
                  </div>
                  <div className="text-sm text-gray-600">Total de Personalizações</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {computedValues.quickStats.mostUsedLayout?.usageCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Layout Mais Usado</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(computedValues.customizationProgress.overall)}%
                  </div>
                  <div className="text-sm text-gray-600">Progresso Geral</div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Atividade Recente
              </h3>
              <div className="space-y-3">
                {[...computedValues.customLayouts, ...computedValues.customThemes]
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {'type' in item ? <Layout className="w-4 h-4 text-blue-600" /> : <Palette className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {'type' in item ? 'Layout' : 'Tema'} • {item.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">
                          {'rating' in item ? item.rating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recomendações
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Layouts Sugeridos</h4>
                  <p className="text-sm text-blue-700">
                    Experimente layouts otimizados para seu fluxo de trabalho
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Temas Populares</h4>
                  <p className="text-sm text-purple-700">
                    Descubra temas que aumentam a produtividade
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Templates Novos</h4>
                  <p className="text-sm text-green-700">
                    Explore templates criados pela comunidade
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Layouts Tab */}
        {activeTab === 'layouts' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Layouts</h3>
                <button
                  onClick={() => handleCreateNew('layout')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Novo Layout
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar layouts..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filter.category || 'all'}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value === 'all' ? undefined : e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="grid">Grid</option>
                  <option value="floating">Flutuante</option>
                  <option value="tabbed">Abas</option>
                </select>
                
                <select
                  value={filter.sortBy || 'name'}
                  onChange={(e) => setFilter({ ...filter, sortBy: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Nome</option>
                  <option value="created">Data de Criação</option>
                  <option value="usage">Mais Usado</option>
                  <option value="rating">Avaliação</option>
                </select>
                
                {(searchQuery || filter.category) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Layouts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLayouts.map((layout) => {
                const DeviceIcon = getDeviceIcon(layout.type);
                const isSelected = selectedLayoutId === layout.id;
                const isCurrent = currentLayout?.id === layout.id;
                
                return (
                  <div
                    key={layout.id}
                    className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 shadow-lg'
                        : isCurrent
                        ? 'border-green-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedLayoutId(layout.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <DeviceIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{layout.name}</span>
                        {layout.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Padrão
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.handleApplyLayout(layout.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Aplicar Layout"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            management.layouts.duplicate(layout.id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        {!layout.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              management.layouts.delete(layout.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{layout.description}</p>
                    
                    {/* Layout Preview */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-1 h-16">
                        {layout.configuration.panels.slice(0, 6).map((panel, index) => (
                          <div
                            key={index}
                            className="bg-blue-200 rounded opacity-75"
                            style={{
                              gridColumn: `span ${Math.min(3, Math.ceil(panel.position.width / 33))}`,
                              gridRow: `span ${Math.min(2, Math.ceil(panel.position.height / 50))}`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span>{layout.configuration.panels.length} painéis</span>
                        <span>•</span>
                        <span>{layout.usageCount} usos</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{layout.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {layout.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {layout.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {layout.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{layout.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Temas</h3>
                <button
                  onClick={() => handleCreateNew('theme')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Novo Tema
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar temas..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filter.category || 'all'}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value === 'all' ? undefined : e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </div>
            
            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredThemes.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                const isCurrent = currentTheme?.id === theme.id;
                
                return (
                  <div
                    key={theme.id}
                    className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 shadow-lg'
                        : isCurrent
                        ? 'border-green-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedThemeId(theme.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Palette className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{theme.name}</span>
                        {theme.isDefault && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Padrão
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.handleApplyTheme(theme.id);
                          }}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Aplicar Tema"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            management.themes.duplicate(theme.id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        {!theme.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              management.themes.delete(theme.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                    
                    {/* Theme Preview */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div 
                        className="rounded-lg p-3 mb-2"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <div 
                          className="rounded p-2 mb-2"
                          style={{ backgroundColor: theme.colors.surface }}
                        >
                          <div 
                            className="h-2 rounded mb-1"
                            style={{ backgroundColor: theme.colors.primary, width: '60%' }}
                          />
                          <div 
                            className="h-1 rounded"
                            style={{ backgroundColor: theme.colors.text, opacity: 0.6, width: '40%' }}
                          />
                        </div>
                        <div className="flex space-x-1">
                          <div 
                            className="h-1 rounded flex-1"
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                          <div 
                            className="h-1 rounded flex-1"
                            style={{ backgroundColor: theme.colors.secondary }}
                          />
                        </div>
                      </div>
                      
                      {/* Color palette */}
                      {getThemeColorPreview(theme)}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="capitalize">{theme.type}</span>
                      <span>{theme.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
                <button
                  onClick={() => handleCreateNew('template')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Novo Template
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar templates..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filter.category || 'all'}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value === 'all' ? undefined : e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="video">Vídeo</option>
                  <option value="audio">Áudio</option>
                  <option value="design">Design</option>
                  <option value="presentation">Apresentação</option>
                </select>
              </div>
            </div>
            
            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const isActive = activeTemplate?.id === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 shadow-lg'
                        : isActive
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Template className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{template.name}</span>
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Padrão
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.handleApplyTemplate(template.id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Aplicar Template"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            management.templates.share(template.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Compartilhar"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        
                        {!template.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              management.templates.delete(template.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    
                    {/* Template Preview */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                        <div>
                          <div className="h-2 bg-gray-300 rounded w-16 mb-1" />
                          <div className="h-1 bg-gray-200 rounded w-12" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1 bg-gray-300 rounded w-full" />
                        <div className="h-1 bg-gray-200 rounded w-3/4" />
                        <div className="h-1 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span className="capitalize">{template.category}</span>
                      {template.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{template.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Author */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-300" />
                      <span className="text-sm text-gray-600">{template.author.name}</span>
                      {template.isPublic && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Público
                        </span>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Other tabs placeholder */}
        {['preferences', 'analytics'].includes(activeTab) && (
          <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <div className="text-gray-400 mb-4">
              <Settings className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'preferences' ? 'Preferências' : 'Analytics'}
            </h3>
            <p className="text-gray-600">
              Esta seção está em desenvolvimento e será implementada em breve.
            </p>
          </div>
        )}
      </div>
      
      {/* Progress Indicator */}
      {quickActionsProgress.isActive && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <div className="text-sm font-medium text-gray-900">Processando...</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${quickActionsProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceCustomizationManager;