import React, { useState, useEffect } from 'react';
import {
  useProactiveAlerts,
  useProactiveAlertsStats,
  useProactiveAlertsSearch,
  useProactiveAlertsRules,
  useProactiveAlertsMonitoring,
  useProactiveAlertsChannels
} from '../../hooks/useProactiveAlerts';
import {
  AlertTriangle,
  Shield,
  Activity,
  Settings,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  EyeOff,
  Download,
  Upload,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Mail,
  Smartphone,
  Slack,
  Webhook,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react';

const ProactiveAlertsPanel: React.FC = () => {
  // Hooks
  const {
    rules,
    alerts,
    channels,
    templates,
    selectedRule,
    selectedAlert,
    isLoading,
    error,
    actions,
    quickActions,
    computed,
    filteredData
  } = useProactiveAlerts();
  
  const { stats, performance, health } = useProactiveAlertsStats();
  const {
    searchQuery,
    categoryFilter,
    severityFilter,
    statusFilter,
    filteredRules,
    filteredAlerts,
    setSearchQuery,
    setCategoryFilter,
    setSeverityFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
    resultCount
  } = useProactiveAlertsSearch();
  
  const {
    ruleStats,
    effectiveness,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    duplicateRule,
    optimizeRules
  } = useProactiveAlertsRules();
  
  const {
    isMonitoring,
    connectionStatus,
    lastUpdate,
    metrics,
    startMonitoring,
    stopMonitoring,
    runHealthCheck
  } = useProactiveAlertsMonitoring();
  
  const {
    channelStats,
    createChannel,
    updateChannel,
    deleteChannel,
    testChannel
  } = useProactiveAlertsChannels();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'rule' | 'channel' | 'template'>('rule');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh demo data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        actions.refreshData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, actions]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Alertas Ativos',
      value: computed.alertStats.active,
      change: '+12%',
      trend: 'up' as const,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Alertas Críticos',
      value: computed.alertStats.critical,
      change: '-5%',
      trend: 'down' as const,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Regras Ativas',
      value: ruleStats.active,
      change: '+3%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Taxa de Resolução',
      value: `${Math.round(performance.averageResolutionTime / 60)}min`,
      change: '-8%',
      trend: 'down' as const,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'rules', label: 'Regras', icon: Shield },
    { id: 'channels', label: 'Canais', icon: Bell },
    { id: 'monitoring', label: 'Monitoramento', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'acknowledged': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'suppressed': return <EyeOff className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'slack': return <Slack className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'acknowledge-critical':
          await quickActions.acknowledgeAllCritical();
          break;
        case 'run-health-check':
          await runHealthCheck();
          break;
        case 'optimize-rules':
          await optimizeRules();
          break;
        case 'export-data':
          await quickActions.exportAlertsData('json');
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Alertas Proativos
              </h1>
              <p className="text-sm text-gray-500">
                Monitoramento inteligente e notificações em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${
                connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {/* Monitoring Toggle */}
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isMonitoring
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Iniciar</span>
                </>
              )}
            </button>
            
            {/* Refresh */}
            <button
              onClick={() => actions.refreshData()}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Create Button */}
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Criar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Erro:</span>
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-blue-700">Carregando dados dos alertas...</span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{card.change}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-500">{card.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="px-6 py-2">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alertas, regras ou canais..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              <option value="system">Sistema</option>
              <option value="performance">Performance</option>
              <option value="security">Segurança</option>
              <option value="business">Negócio</option>
            </select>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as severidades</option>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Médio</option>
              <option value="low">Baixo</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="acknowledged">Reconhecido</option>
              <option value="resolved">Resolvido</option>
              <option value="suppressed">Suprimido</option>
            </select>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                Limpar
              </button>
            )}
          </div>
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
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
      
      {/* Tab Content */}
      <div className="flex-1 px-6 py-4 overflow-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Health Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                    health.overall === 'healthy' ? 'bg-green-100' :
                    health.overall === 'warning' ? 'bg-yellow-100' :
                    health.overall === 'critical' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <Shield className={`w-8 h-8 ${
                      health.overall === 'healthy' ? 'text-green-600' :
                      health.overall === 'warning' ? 'text-yellow-600' :
                      health.overall === 'critical' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {health.overall === 'healthy' ? 'Saudável' :
                       health.overall === 'warning' ? 'Atenção' :
                       health.overall === 'critical' ? 'Crítico' : 'Desconhecido'}
                    </div>
                    <div className="text-sm text-gray-500">Status Geral</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                    isMonitoring ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Activity className={`w-8 h-8 ${
                      isMonitoring ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {isMonitoring ? 'Ativo' : 'Inativo'}
                    </div>
                    <div className="text-sm text-gray-500">Monitoramento</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {connectionStatus === 'connected' ? (
                      <Wifi className="w-8 h-8 text-green-600" />
                    ) : (
                      <WifiOff className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                    </div>
                    <div className="text-sm text-gray-500">Conexão</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Alertas Recentes</h3>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver todos
                </button>
              </div>
              <div className="space-y-3">
                {filteredData.recentAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(alert.status)}
                      <div>
                        <div className="font-medium text-gray-900">{alert.title}</div>
                        <div className="text-sm text-gray-500">{alert.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        getSeverityColor(alert.severity)
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(alert.triggeredAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleQuickAction('acknowledge-critical')}
                  className="flex items-center space-x-2 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Reconhecer Críticos</span>
                </button>
                
                <button
                  onClick={() => handleQuickAction('run-health-check')}
                  className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <Activity className="w-5 h-5" />
                  <span>Verificar Saúde</span>
                </button>
                
                <button
                  onClick={() => handleQuickAction('optimize-rules')}
                  className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  <Zap className="w-5 h-5" />
                  <span>Otimizar Regras</span>
                </button>
                
                <button
                  onClick={() => handleQuickAction('export-data')}
                  className="flex items-center space-x-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                >
                  <Download className="w-5 h-5" />
                  <span>Exportar Dados</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Alertas ({resultCount.alerts})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {viewMode === 'grid' ? <BarChart3 className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(alert.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{alert.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{alert.description}</div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            getSeverityColor(alert.severity)
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(alert.triggeredAt)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {alert.affectedResources.length} recursos afetados
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => actions.acknowledgeAlert(alert.id, 'current-user')}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Reconhecer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => actions.resolveAlert(alert.id, 'current-user', 'Resolvido manualmente')}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Resolver"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => actions.suppressAlert(alert.id, 60)}
                        className="p-1 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Suprimir"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Regras de Alerta ({resultCount.rules})
              </h3>
              <button
                onClick={() => {
                  setCreateType('rule');
                  setShowCreateDialog(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Regra</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900">{rule.name}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.isEnabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{rule.description}</div>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          getSeverityColor(rule.severity)
                        }`}>
                          {rule.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {rule.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {rule.conditions.length} condições
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title={rule.isEnabled ? 'Desativar' : 'Ativar'}
                      >
                        {rule.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => testRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Testar"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Duplicar"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Canais de Notificação ({channelStats.total})
              </h3>
              <button
                onClick={() => {
                  setCreateType('channel');
                  setShowCreateDialog(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Canal</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {channels.map((channel) => (
                <div key={channel.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getChannelIcon(channel.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{channel.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{channel.description}</div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            channel.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {channel.isEnabled ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            channel.testStatus === 'success' ? 'bg-green-100 text-green-800' :
                            channel.testStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {channel.testStatus === 'success' ? 'Testado' :
                             channel.testStatus === 'failed' ? 'Falhou' : 'Não testado'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {channel.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => testChannel(channel.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Testar"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateChannel(channel.id, { ...channel, isEnabled: !channel.isEnabled })}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title={channel.isEnabled ? 'Desativar' : 'Ativar'}
                      >
                        {channel.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* System Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Cpu className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">45%</div>
                  <div className="text-sm text-gray-500">CPU</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <HardDrive className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">67%</div>
                  <div className="text-sm text-gray-500">Memória</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Database className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">23%</div>
                  <div className="text-sm text-gray-500">Disco</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Network className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">156ms</div>
                  <div className="text-sm text-gray-500">Latência</div>
                </div>
              </div>
            </div>
            
            {/* Real-time Monitoring */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monitoramento em Tempo Real</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isMonitoring ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {isMonitoring ? 'Monitorando' : 'Parado'}
                  </span>
                  {lastUpdate && (
                    <span className="text-sm text-gray-500">
                      · Última atualização: {formatTime(lastUpdate)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {metrics.slice(0, 10).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{metric.name}</div>
                        <div className="text-sm text-gray-500">{metric.source}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{metric.value}</div>
                      <div className="text-sm text-gray-500">{formatTime(metric.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(performance.averageResolutionTime / 60)}min
                  </div>
                  <div className="text-sm text-gray-500">Tempo Médio de Resolução</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(performance.escalationRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Taxa de Escalação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(performance.falsePositiveRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Falsos Positivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(performance.mttr / 60)}min
                  </div>
                  <div className="text-sm text-gray-500">MTTR</div>
                </div>
              </div>
            </div>
            
            {/* Rule Effectiveness */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Efetividade das Regras</h3>
              <div className="space-y-3">
                {effectiveness.slice(0, 5).map((rule) => (
                  <div key={rule.ruleId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{rule.ruleName}</div>
                      <div className="text-sm text-gray-500">
                        {rule.triggeredCount} disparos · {rule.resolvedCount} resolvidos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {Math.round(rule.accuracy * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Precisão</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Auto-refresh</div>
                    <div className="text-sm text-gray-500">Atualizar dados automaticamente</div>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Notificações Push</div>
                    <div className="text-sm text-gray-500">Receber notificações no navegador</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Modo Escuro</div>
                    <div className="text-sm text-gray-500">Usar tema escuro na interface</div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar {createType === 'rule' ? 'Regra' : createType === 'channel' ? 'Canal' : 'Template'}
            </h3>
            
            {createType === 'rule' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Regra
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: CPU Alto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="system">Sistema</option>
                    <option value="performance">Performance</option>
                    <option value="security">Segurança</option>
                    <option value="business">Negócio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severidade
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descreva quando esta regra deve ser acionada..."
                  />
                </div>
              </div>
            )}
            
            {createType === 'channel' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Canal
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Email Equipe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuração
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Configuração específica do canal (JSON)..."
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Handle create action
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

export default ProactiveAlertsPanel;