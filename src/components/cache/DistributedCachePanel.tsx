import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Server, 
  Activity, 
  Settings, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  Zap, 
  Shield, 
  Clock, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Layers, 
  Globe, 
  Lock, 
  Unlock, 
  Compress, 
  Expand, 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  FileText, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal
} from 'lucide-react';
import { 
  useDistributedCache, 
  useDistributedCacheStats, 
  useDistributedCacheConfig, 
  useDistributedCacheSearch, 
  useCurrentCacheEntry, 
  useCacheNodeMonitoring, 
  useDistributedCacheAnalytics 
} from '../../hooks/useDistributedCache';
import { 
  CacheEntry, 
  CacheNode, 
  CacheStrategy, 
  formatCacheSize, 
  formatCacheTime, 
  getCacheStatusColor, 
  getCachePriorityColor, 
  getCacheTypeIcon 
} from '../../services/distributedCacheService';

interface DistributedCachePanelProps {
  className?: string;
}

export const DistributedCachePanel: React.FC<DistributedCachePanelProps> = ({ 
  className = '' 
}) => {
  // Main hook
  const {
    entries,
    nodes,
    strategies,
    operations,
    config,
    stats,
    metrics,
    isLoading,
    error,
    selectedEntryId,
    selectedNodeId,
    selectedStrategyId,
    computed,
    filtered,
    actions,
    quickActions,
    throttledRefresh,
    throttledOptimize,
    debouncedSearch,
    complexity,
    recommendations,
    setSelectedEntry,
    setSelectedNode,
    setSelectedStrategy
  } = useDistributedCache();
  
  // Specialized hooks
  const { stats: enhancedStats } = useDistributedCacheStats();
  const { config: cacheConfig, validation } = useDistributedCacheConfig();
  const { metrics: nodeMetrics } = useCacheNodeMonitoring();
  const { analytics } = useDistributedCacheAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'entry' | 'node' | 'strategy'>('entry');
  
  // Search results
  const searchResults = useDistributedCacheSearch(searchQuery, filters);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (entries.length === 0) {
        // Add demo entries
        actions.createEntry({
          key: `user_session_${Date.now()}`,
          value: { userId: Math.floor(Math.random() * 1000), sessionData: 'demo' },
          size: Math.floor(Math.random() * 1024 * 100),
          ttl: 3600000,
          tags: ['session', 'user'],
          priority: 'medium',
          compressed: Math.random() > 0.5,
          encrypted: Math.random() > 0.7,
          metadata: {
            source: 'session_manager',
            version: '1.0.0',
            checksum: 'abc123',
            dependencies: []
          }
        });
      }
      
      if (nodes.length === 0) {
        // Add demo nodes
        actions.addNode({
          name: `cache-node-${Math.floor(Math.random() * 10)}`,
          endpoint: `http://cache-${Math.floor(Math.random() * 10)}.example.com`,
          region: ['us-east-1', 'us-west-2', 'eu-west-1'][Math.floor(Math.random() * 3)],
          status: ['online', 'offline', 'syncing'][Math.floor(Math.random() * 3)] as any,
          capacity: Math.floor(Math.random() * 1024 * 1024 * 1024),
          used: Math.floor(Math.random() * 1024 * 1024 * 512),
          latency: Math.floor(Math.random() * 100),
          load: Math.random(),
          health: {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            disk: Math.random() * 100,
            network: Math.random() * 100
          },
          metrics: {
            hitRate: Math.random(),
            missRate: Math.random(),
            evictionRate: Math.random() * 0.1,
            throughput: Math.floor(Math.random() * 1000)
          }
        });
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [entries.length, nodes.length, actions]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      id: 'entries',
      title: 'Cache Entries',
      value: computed.totalEntries.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: Database,
      color: 'blue'
    },
    {
      id: 'nodes',
      title: 'Active Nodes',
      value: `${computed.activeNodes}/${computed.totalNodes}`,
      change: computed.activeNodes === computed.totalNodes ? 'All Online' : 'Some Offline',
      trend: computed.activeNodes === computed.totalNodes ? 'up' : 'down',
      icon: Server,
      color: computed.activeNodes === computed.totalNodes ? 'green' : 'red'
    },
    {
      id: 'hitrate',
      title: 'Hit Rate',
      value: `${(stats.hitRate * 100).toFixed(1)}%`,
      change: stats.hitRate > 0.8 ? 'Excellent' : stats.hitRate > 0.6 ? 'Good' : 'Poor',
      trend: stats.hitRate > 0.8 ? 'up' : 'down',
      icon: Activity,
      color: stats.hitRate > 0.8 ? 'green' : stats.hitRate > 0.6 ? 'yellow' : 'red'
    },
    {
      id: 'latency',
      title: 'Avg Latency',
      value: `${stats.averageLatency.toFixed(1)}ms`,
      change: stats.averageLatency < 50 ? 'Fast' : stats.averageLatency < 100 ? 'Normal' : 'Slow',
      trend: stats.averageLatency < 50 ? 'up' : 'down',
      icon: Zap,
      color: stats.averageLatency < 50 ? 'green' : stats.averageLatency < 100 ? 'yellow' : 'red'
    },
    {
      id: 'memory',
      title: 'Memory Usage',
      value: `${(stats.memoryUsage * 100).toFixed(1)}%`,
      change: formatCacheSize(computed.totalSize),
      trend: stats.memoryUsage < 0.8 ? 'up' : 'down',
      icon: HardDrive,
      color: stats.memoryUsage < 0.8 ? 'green' : stats.memoryUsage < 0.9 ? 'yellow' : 'red'
    },
    {
      id: 'health',
      title: 'System Health',
      value: `${stats.systemHealth.toFixed(0)}%`,
      change: stats.isHealthy ? 'Healthy' : 'Issues Detected',
      trend: stats.isHealthy ? 'up' : 'down',
      icon: Shield,
      color: stats.isHealthy ? 'green' : 'red'
    }
  ], [computed, stats]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'entries', label: 'Cache Entries', icon: Database },
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'strategies', label: 'Strategies', icon: Layers },
    { id: 'operations', label: 'Operations', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return XCircle;
      case 'syncing': return RefreshCw;
      case 'error': return AlertTriangle;
      default: return HardDrive;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'syncing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return AlertTriangle;
      case 'high': return TrendingUp;
      case 'medium': return Activity;
      case 'low': return TrendingDown;
      default: return Activity;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lru': return RotateCcw;
      case 'lfu': return BarChart3;
      case 'fifo': return Play;
      case 'ttl': return Clock;
      case 'adaptive': return Zap;
      default: return Database;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };
  
  const handleQuickAction = async (action: string, id?: string) => {
    try {
      switch (action) {
        case 'refresh':
          await throttledRefresh();
          break;
        case 'optimize':
          await throttledOptimize();
          break;
        case 'sync':
          await quickActions.quickSync();
          break;
        case 'clear':
          await actions.clear();
          break;
        default:
      }
    } catch (error) {
      console.error('Quick action failed:', error);
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
  
  const handleCreateItem = () => {
    setShowCreateDialog(true);
  };
  
  return (
    <div className={`distributed-cache-panel bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sistema de Cache Distribuído
              </h2>
              <p className="text-sm text-gray-600">
                Gerenciamento inteligente de cache com otimização automática
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuickAction('refresh')}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => handleQuickAction('optimize')}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Otimizar cache"
            >
              <Zap className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleCreateItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro no Sistema</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <p className="text-sm text-blue-800">Carregando dados do cache...</p>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusCards.map((card) => {
          const IconComponent = card.icon;
          const TrendIcon = getTrendIcon(card.trend);
          
          return (
            <div
              key={card.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => toggleCardExpansion(card.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  card.color === 'blue' ? 'bg-blue-100' :
                  card.color === 'green' ? 'bg-green-100' :
                  card.color === 'yellow' ? 'bg-yellow-100' :
                  card.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-4 h-4 ${
                    card.color === 'blue' ? 'text-blue-600' :
                    card.color === 'green' ? 'text-green-600' :
                    card.color === 'yellow' ? 'text-yellow-600' :
                    card.color === 'red' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                <TrendIcon className={`w-4 h-4 ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs text-gray-600 mb-1">{card.title}</p>
                <p className={`text-xs font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Search and Filters */}
      <div className="px-6 pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar entradas, nós ou operações..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as prioridades</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
              
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="syncing">Sincronizando</option>
                <option value="error">Erro</option>
              </select>
              
              <select
                value={filters.compressed || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, compressed: e.target.value === 'true' }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Compressão</option>
                <option value="true">Comprimido</option>
                <option value="false">Não comprimido</option>
              </select>
              
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hit Rate</span>
                    <span className="font-medium">{(stats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Latency</span>
                    <span className="font-medium">{stats.averageLatency.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Operations/sec</span>
                    <span className="font-medium">{stats.operationsPerSecond}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-medium">{(stats.errorRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HardDrive className="w-5 h-5 mr-2" />
                  Storage Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Entries</span>
                    <span className="font-medium">{computed.totalEntries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Size</span>
                    <span className="font-medium">{formatCacheSize(computed.totalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="font-medium">{(stats.memoryUsage * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compression Ratio</span>
                    <span className="font-medium">{(stats.compressionRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Operations
              </h3>
              <div className="space-y-2">
                {computed.recentOperations.slice(0, 5).map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        operation.type === 'get' ? 'bg-blue-100 text-blue-800' :
                        operation.type === 'set' ? 'bg-green-100 text-green-800' :
                        operation.type === 'delete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {operation.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{operation.key}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{operation.duration.toFixed(1)}ms</span>
                      <span>{formatTime(operation.timestamp)}</span>
                      {operation.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Recomendações do Sistema
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Entries Tab */}
        {activeTab === 'entries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Cache Entries ({searchResults.entries.length})
              </h3>
              <button
                onClick={() => {
                  setCreateType('entry');
                  setShowCreateDialog(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Entrada</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {searchResults.entries.map((entry) => {
                const PriorityIcon = getPriorityIcon(entry.priority);
                const isExpanded = expandedCards.has(entry.id);
                const isSelected = selectedItems.has(entry.id);
                
                return (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(entry.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className={`p-2 rounded-lg ${
                          entry.priority === 'critical' ? 'bg-red-100' :
                          entry.priority === 'high' ? 'bg-orange-100' :
                          entry.priority === 'medium' ? 'bg-yellow-100' :
                          'bg-green-100'
                        }`}>
                          <PriorityIcon className={`w-4 h-4 ${getCachePriorityColor(entry.priority)}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.key}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{formatCacheSize(entry.size)}</span>
                            <span>{formatPriority(entry.priority)}</span>
                            <span>Acessos: {entry.accessCount}</span>
                            {entry.compressed && (
                              <span className="flex items-center space-x-1">
                                <Compress className="w-3 h-3" />
                                <span>Comprimido</span>
                              </span>
                            )}
                            {entry.encrypted && (
                              <span className="flex items-center space-x-1">
                                <Lock className="w-3 h-3" />
                                <span>Criptografado</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedEntry(entry.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => actions.deleteEntry(entry.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir entrada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleCardExpansion(entry.id)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Criado em:</span>
                            <p className="font-medium">{entry.createdAt.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Último acesso:</span>
                            <p className="font-medium">{entry.lastAccessed.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">TTL:</span>
                            <p className="font-medium">{formatCacheTime(entry.ttl)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configurações Globais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TTL Padrão (ms)
                    </label>
                    <input
                      type="number"
                      value={cacheConfig.global.defaultTtl}
                      onChange={(e) => actions.updateConfig({
                        global: {
                          ...cacheConfig.global,
                          defaultTtl: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Memória Máxima (bytes)
                    </label>
                    <input
                      type="number"
                      value={cacheConfig.global.maxMemory}
                      onChange={(e) => actions.updateConfig({
                        global: {
                          ...cacheConfig.global,
                          maxMemory: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Compressão Habilitada
                    </label>
                    <input
                      type="checkbox"
                      checked={cacheConfig.global.compressionEnabled}
                      onChange={(e) => actions.updateConfig({
                        global: {
                          ...cacheConfig.global,
                          compressionEnabled: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Criptografia Habilitada
                    </label>
                    <input
                      type="checkbox"
                      checked={cacheConfig.global.encryptionEnabled}
                      onChange={(e) => actions.updateConfig({
                        global: {
                          ...cacheConfig.global,
                          encryptionEnabled: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Monitoramento Habilitado
                    </label>
                    <input
                      type="checkbox"
                      checked={cacheConfig.global.monitoringEnabled}
                      onChange={(e) => actions.updateConfig({
                        global: {
                          ...cacheConfig.global,
                          monitoringEnabled: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center space-x-4">
                <button
                  onClick={() => actions.resetConfig()}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Restaurar Padrões
                </button>
                <button
                  onClick={() => {
                    const config = actions.exportConfig();
                    navigator.clipboard.writeText(config);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Config</span>
                </button>
              </div>
            </div>
            
            {/* Configuration Validation */}
            <div className={`rounded-lg p-6 ${
              validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                validation.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {validation.isValid ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 mr-2" />
                )}
                Validação da Configuração
              </h3>
              
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm ${
                  validation.isValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  Score de Configuração: {validation.score}%
                </span>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  validation.isValid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validation.isValid ? 'Válida' : 'Inválida'}
                </div>
              </div>
              
              {validation.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">Problemas encontrados:</h4>
                  <ul className="space-y-1">
                    {validation.issues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-red-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar {createType === 'entry' ? 'Entrada' : createType === 'node' ? 'Nó' : 'Estratégia'}
            </h3>
            
            <div className="space-y-4">
              {createType === 'entry' && (
                <>
                  <input
                    type="text"
                    placeholder="Chave da entrada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Valor (JSON)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="medium">Prioridade Média</option>
                    <option value="low">Prioridade Baixa</option>
                    <option value="high">Prioridade Alta</option>
                    <option value="critical">Prioridade Crítica</option>
                  </select>
                </>
              )}
              
              {createType === 'node' && (
                <>
                  <input
                    type="text"
                    placeholder="Nome do nó"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Endpoint (URL)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Região"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}
              
              {createType === 'strategy' && (
                <>
                  <input
                    type="text"
                    placeholder="Nome da estratégia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="lru">LRU (Least Recently Used)</option>
                    <option value="lfu">LFU (Least Frequently Used)</option>
                    <option value="fifo">FIFO (First In, First Out)</option>
                    <option value="ttl">TTL (Time To Live)</option>
                    <option value="adaptive">Adaptativo</option>
                  </select>
                </>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Handle create logic here
                  setShowCreateDialog(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default DistributedCachePanel;