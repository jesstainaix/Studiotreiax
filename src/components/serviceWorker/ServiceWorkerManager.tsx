import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  Settings, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Shield, 
  Globe, 
  HardDrive, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  X,
  Info,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Power,
  PowerOff
} from 'lucide-react';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import type { CacheStrategy, SyncTask, ServiceWorkerConfig } from '../../hooks/useServiceWorker';

interface ServiceWorkerManagerProps {
  className?: string;
  onClose?: () => void;
}

const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({ 
  className = '', 
  onClose 
}) => {
  const {
    // State
    registration,
    cacheEntries,
    syncTasks,
    strategies,
    config,
    stats,
    analytics,
    isLoading,
    error,
    isOnline,
    progress,
    isProgressActive,
    
    // Actions
    register,
    unregister,
    addCache,
    removeCache,
    clearCache,
    addSync,
    quickActions,
    
    // Computed
    cacheHealth,
    recommendations,
    isHealthy,
    hasActiveSync,
    hasPendingSync,
    hasFailedSync,
    totalCacheSize,
    syncSuccessRate,
    
    // Filtered
    activeCacheEntries,
    expiredCacheEntries,
    activeSyncTasks,
    completedSyncTasks,
    failedSyncTasks,
    enabledStrategies,
    
    // Utils
    formatBytes,
    getStrategyColor,
    getStatusColor,
    
    // Store actions
    addStrategy,
    updateStrategy,
    removeStrategy,
    updateConfig,
    refreshData
  } = useServiceWorker();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);
  const [showCreateSync, setShowCreateSync] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshData]);
  
  // Demo data effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Add some demo cache entries if empty
      if (cacheEntries.length === 0) {
        const demoEntries = [
          {
            id: 'demo-1',
            url: '/api/videos',
            method: 'GET',
            headers: { 'content-type': 'application/json' },
            data: '{}',
            size: 1024,
            timestamp: Date.now() - 3600000,
            strategy: 'network-first',
            hits: 15,
            lastAccessed: Date.now() - 300000,
            tags: ['api', 'videos']
          },
          {
            id: 'demo-2',
            url: '/assets/logo.png',
            method: 'GET',
            headers: { 'content-type': 'image/png' },
            data: 'binary',
            size: 8192,
            timestamp: Date.now() - 7200000,
            strategy: 'cache-first',
            hits: 42,
            lastAccessed: Date.now() - 600000,
            tags: ['assets', 'images']
          }
        ];
        
        demoEntries.forEach(entry => {
          // addCacheEntry would be called here in real implementation
        });
      }
      
      // Add demo sync tasks if empty
      if (syncTasks.length === 0) {
        addSync({
          name: 'Sincronizar vídeos offline',
          type: 'upload',
          url: '/api/sync/videos',
          method: 'POST',
          priority: 'high',
          retries: 0,
          maxRetries: 3,
          tags: { category: 'videos', source: 'offline' }
        });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [cacheEntries.length, syncTasks.length, addSync]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      id: 'registration',
      title: 'Service Worker',
      value: stats.isRegistered ? 'Ativo' : 'Inativo',
      icon: stats.isRegistered ? CheckCircle : AlertCircle,
      color: stats.isRegistered ? 'text-green-600' : 'text-red-600',
      bgColor: stats.isRegistered ? 'bg-green-50' : 'bg-red-50',
      trend: stats.isActive ? 'up' : 'down',
      subtitle: stats.isActive ? 'Controlando páginas' : 'Aguardando ativação'
    },
    {
      id: 'cache',
      title: 'Cache',
      value: totalCacheSize,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: cacheEntries.length > 0 ? 'up' : 'stable',
      subtitle: `${cacheEntries.length} entradas • ${Math.round(stats.cacheHitRate * 100)}% hit rate`
    },
    {
      id: 'sync',
      title: 'Sincronização',
      value: `${Math.round(syncSuccessRate)}%`,
      icon: hasActiveSync ? RefreshCw : hasFailedSync ? AlertTriangle : CheckCircle,
      color: hasFailedSync ? 'text-red-600' : hasActiveSync ? 'text-blue-600' : 'text-green-600',
      bgColor: hasFailedSync ? 'bg-red-50' : hasActiveSync ? 'bg-blue-50' : 'bg-green-50',
      trend: hasActiveSync ? 'up' : hasFailedSync ? 'down' : 'stable',
      subtitle: `${activeSyncTasks.length} ativas • ${failedSyncTasks.length} falharam`
    },
    {
      id: 'health',
      title: 'Saúde do Sistema',
      value: `${cacheHealth}%`,
      icon: isHealthy ? Shield : AlertTriangle,
      color: isHealthy ? 'text-green-600' : 'text-yellow-600',
      bgColor: isHealthy ? 'bg-green-50' : 'bg-yellow-50',
      trend: isHealthy ? 'up' : 'down',
      subtitle: isHealthy ? 'Sistema saudável' : 'Requer atenção'
    }
  ], [stats, totalCacheSize, cacheEntries.length, syncSuccessRate, hasActiveSync, hasFailedSync, activeSyncTasks.length, failedSyncTasks.length, cacheHealth, isHealthy]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'cache', label: 'Cache', icon: Database },
    { id: 'sync', label: 'Sincronização', icon: RefreshCw },
    { id: 'strategies', label: 'Estratégias', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return RefreshCw;
      case 'pending': return Clock;
      case 'failed': return AlertTriangle;
      case 'cancelled': return X;
      default: return Clock;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'upload': return Upload;
      case 'download': return Download;
      case 'sync': return RefreshCw;
      case 'cleanup': return Trash2;
      default: return Activity;
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };
  
  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'register':
          await register();
          break;
        case 'unregister':
          await unregister();
          break;
        case 'clearCache':
          await clearCache();
          break;
        case 'enableCache':
          quickActions.enableCache();
          break;
        case 'disableCache':
          quickActions.disableCache();
          break;
        case 'enableSync':
          quickActions.enableSync();
          break;
        case 'disableSync':
          quickActions.disableSync();
          break;
        case 'retryFailed':
          quickActions.retryFailedSync();
          break;
        case 'clearExpired':
          quickActions.clearExpired();
          break;
        default:
          console.warn('Ação não reconhecida:', action);
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
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
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Service Worker Manager
            </h2>
            <p className="text-sm text-gray-500">
              Gerenciamento de cache offline e sincronização
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-xs font-medium ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={autoRefresh ? 'Desabilitar auto-refresh' : 'Habilitar auto-refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${
              autoRefresh ? 'animate-spin' : ''
            }`} />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Erro</span>
          </div>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-800">Carregando...</span>
          </div>
          {isProgressActive && (
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-blue-600">{progress}% concluído</p>
            </div>
          )}
        </div>
      )}
      
      {/* Status Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statusCards.map((card) => {
            const IconComponent = card.icon;
            const TrendIcon = getTrendIcon(card.trend);
            const isExpanded = expandedCards.has(card.id);
            
            return (
              <div
                key={card.id}
                className={`${card.bgColor} rounded-lg p-4 cursor-pointer transition-all hover:shadow-md`}
                onClick={() => toggleCardExpansion(card.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-8 h-8 ${card.color}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <TrendIcon className={`w-4 h-4 ${card.color}`} />
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{card.subtitle}</p>
                    {card.id === 'registration' && (
                      <div className="mt-2 flex space-x-2">
                        {!stats.isRegistered ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('register');
                            }}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Registrar
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('unregister');
                            }}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Desregistrar
                          </button>
                        )}
                      </div>
                    )}
                    {card.id === 'cache' && (
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction('clearExpired');
                          }}
                          className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Limpar Expirados
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction('clearCache');
                          }}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Limpar Tudo
                        </button>
                      </div>
                    )}
                    {card.id === 'sync' && hasFailedSync && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction('retryFailed');
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por URL, estratégia ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos</option>
                <option value="cache">Cache</option>
                <option value="sync">Sincronização</option>
                <option value="strategies">Estratégias</option>
                <option value="active">Ativos</option>
                <option value="failed">Falharam</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-800">Recomendações</h3>
                  </div>
                  <ul className="space-y-1">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-yellow-700 flex items-start space-x-2">
                        <span className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Ações Rápidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleQuickAction(config.enabled ? 'disableCache' : 'enableCache')}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      config.enabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {config.enabled ? (
                      <><PowerOff className="w-4 h-4 mx-auto mb-1" />Desabilitar</>
                    ) : (
                      <><Power className="w-4 h-4 mx-auto mb-1" />Habilitar</>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('clearExpired')}
                    className="p-3 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mx-auto mb-1" />
                    Limpar Expirados
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('retryFailed')}
                    className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                    disabled={failedSyncTasks.length === 0}
                  >
                    <RefreshCw className="w-4 h-4 mx-auto mb-1" />
                    Tentar Novamente
                  </button>
                  
                  <button
                    onClick={() => refreshData()}
                    className="p-3 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Activity className="w-4 h-4 mx-auto mb-1" />
                    Atualizar
                  </button>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Atividade Recente</h3>
                <div className="space-y-2">
                  {[...activeSyncTasks, ...completedSyncTasks.slice(-3)]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 5)
                    .map((task) => {
                      const StatusIcon = getStatusIcon(task.status);
                      const TypeIcon = getTypeIcon(task.type);
                      
                      return (
                        <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TypeIcon className="w-4 h-4 text-gray-600" />
                            <StatusIcon className={`w-4 h-4 ${getStatusColor(task.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                            <p className="text-xs text-gray-500">
                              {task.type} • {formatDuration(Date.now() - task.createdAt)} atrás
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
          
          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Entradas de Cache</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {activeCacheEntries.length} ativas • {expiredCacheEntries.length} expiradas
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {activeCacheEntries
                  .filter(entry => 
                    searchTerm === '' || 
                    entry.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.strategy.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="w-4 h-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-900 truncate">{entry.url}</p>
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Método: {entry.method}</span>
                            <span>Tamanho: {formatBytes(entry.size)}</span>
                            <span>Hits: {entry.hits}</span>
                            <span className={getStrategyColor(entry.strategy as any)}>Estratégia: {entry.strategy}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeCache(entry.url)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remover do cache"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Tarefas de Sincronização</h3>
                <button
                  onClick={() => setShowCreateSync(true)}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Nova Tarefa
                </button>
              </div>
              
              <div className="space-y-2">
                {syncTasks
                  .filter(task => 
                    searchTerm === '' || 
                    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((task) => {
                    const StatusIcon = getStatusIcon(task.status);
                    const TypeIcon = getTypeIcon(task.type);
                    
                    return (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <TypeIcon className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900">{task.name}</p>
                                <StatusIcon className={`w-4 h-4 ${getStatusColor(task.status)}`} />
                              </div>
                              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                <span>Tipo: {task.type}</span>
                                <span>URL: {task.url}</span>
                                <span>Tentativas: {task.retries}/{task.maxRetries}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </div>
                            {task.status === 'running' && (
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {task.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            {task.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          
          {/* Strategies Tab */}
          {activeTab === 'strategies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Estratégias de Cache</h3>
                <button
                  onClick={() => setShowCreateStrategy(true)}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Nova Estratégia
                </button>
              </div>
              
              <div className="space-y-2">
                {strategies
                  .filter(strategy => 
                    searchTerm === '' || 
                    strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    strategy.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((strategy) => (
                    <div key={strategy.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Zap className={`w-5 h-5 ${getStrategyColor(strategy.type)}`} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">{strategy.name}</p>
                              {strategy.enabled ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              <span className={getStrategyColor(strategy.type)}>Tipo: {strategy.type}</span>
                              <span>Padrões: {strategy.patterns.join(', ')}</span>
                              <span>Prioridade: {strategy.priority}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateStrategy(strategy.id, { enabled: !strategy.enabled })}
                            className={`p-1 rounded transition-colors ${
                              strategy.enabled
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={strategy.enabled ? 'Desabilitar' : 'Habilitar'}
                          >
                            {strategy.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => removeStrategy(strategy.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remover estratégia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cache Performance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Performance do Cache</h4>
                  <div className="space-y-2">
                    {analytics.cachePerformance.map((perf, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{perf.strategy}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{Math.round(perf.hitRate * 100)}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${perf.hitRate * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sync Performance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Performance de Sync</h4>
                  <div className="space-y-2">
                    {analytics.syncPerformance.map((perf, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{perf.type}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{Math.round(perf.successRate * 100)}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${perf.successRate * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Recent Errors */}
              {analytics.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Erros Recentes</h4>
                  <div className="space-y-2">
                    {analytics.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-800">{error.type}</p>
                            <p className="text-xs text-red-600">{error.message}</p>
                          </div>
                          <div className="text-xs text-red-500">
                            {error.count}x
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configurações Gerais</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => updateConfig({ enabled: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Habilitar Service Worker</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.syncEnabled}
                        onChange={(e) => updateConfig({ syncEnabled: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Habilitar Sincronização</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.notificationEnabled}
                        onChange={(e) => updateConfig({ notificationEnabled: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Habilitar Notificações</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.debugMode}
                        onChange={(e) => updateConfig({ debugMode: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Modo Debug</span>
                    </label>
                  </div>
                </div>
                
                {/* Cache Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configurações de Cache</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamanho Máximo do Cache (MB)
                      </label>
                      <input
                        type="number"
                        value={Math.round(config.maxCacheSize / (1024 * 1024))}
                        onChange={(e) => updateConfig({ maxCacheSize: parseInt(e.target.value) * 1024 * 1024 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        max="1000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalo de Limpeza (minutos)
                      </label>
                      <input
                        type="number"
                        value={Math.round(config.cleanupInterval / (60 * 1000))}
                        onChange={(e) => updateConfig({ cleanupInterval: parseInt(e.target.value) * 60 * 1000 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        max="1440"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalo de Sincronização (segundos)
                      </label>
                      <input
                        type="number"
                        value={Math.round(config.syncInterval / 1000)}
                        onChange={(e) => updateConfig({ syncInterval: parseInt(e.target.value) * 1000 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="5"
                        max="300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Strategy Dialog */}
      {showCreateStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Nova Estratégia</h3>
              <button
                onClick={() => setShowCreateStrategy(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addStrategy({
                  name: formData.get('name') as string,
                  type: formData.get('type') as any,
                  patterns: (formData.get('patterns') as string).split(',').map(p => p.trim()),
                  priority: formData.get('priority') as any,
                  enabled: true
                });
                setShowCreateStrategy(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nome da estratégia"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="cache-first">Cache First</option>
                  <option value="network-first">Network First</option>
                  <option value="stale-while-revalidate">Stale While Revalidate</option>
                  <option value="network-only">Network Only</option>
                  <option value="cache-only">Cache Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Padrões (separados por vírgula)
                </label>
                <input
                  name="patterns"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="*.js, *.css, /api/*"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateStrategy(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Create Sync Task Dialog */}
      {showCreateSync && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Nova Tarefa de Sync</h3>
              <button
                onClick={() => setShowCreateSync(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addSync({
                  name: formData.get('name') as string,
                  type: formData.get('type') as any,
                  url: formData.get('url') as string,
                  method: formData.get('method') as string,
                  priority: formData.get('priority') as any,
                  retries: 0,
                  maxRetries: 3,
                  tags: {}
                });
                setShowCreateSync(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nome da tarefa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="upload">Upload</option>
                  <option value="download">Download</option>
                  <option value="sync">Sincronização</option>
                  <option value="cleanup">Limpeza</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  name="url"
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://api.example.com/sync"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método
                </label>
                <select
                  name="method"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSync(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceWorkerManager;