import React, { useState, useEffect, useMemo } from 'react';
import { 
  useDistributedCache, 
  useDistributedCacheStats, 
  useDistributedCacheAnalytics,
  useDistributedCacheMonitoring
} from '../../hooks/useDistributedCache';
import { 
  formatCacheSize, 
  getCacheStatusColor, 
  getCachePriorityIcon, 
  calculateCacheScore,
  getCacheRecommendation,
  type CacheEntry,
  type CacheNode,
  type CacheCluster
} from '../../services/distributedCacheService';
import {
  Activity,
  Database,
  Server,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Cpu,
  Network,
  BarChart3,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Minus,
  MoreHorizontal,
  Layers,
  Globe,
  Lock,
  Unlock,
  Target,
  Gauge
} from 'lucide-react';

interface DistributedCacheManagerProps {
  className?: string;
}

export default function DistributedCacheManager({ className = '' }: DistributedCacheManagerProps) {
  const cache = useDistributedCache();
  const { stats } = useDistributedCacheStats();
  const { data: analyticsData } = useDistributedCacheAnalytics();
  const { activeAlerts, criticalAlerts } = useDistributedCacheMonitoring();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (cache.autoRefresh.enabled && !cache.isLoading) {
        // Simulate real-time updates
        const randomEntry = cache.entries[Math.floor(Math.random() * cache.entries.length)];
        if (randomEntry) {
          cache.actions.touch(randomEntry.key);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [cache.autoRefresh.enabled, cache.isLoading, cache.entries, cache.actions]);
  
  // Filtered and sorted data
  const filteredEntries = useMemo(() => {
    let filtered = cache.filteredEntries;
    
    if (cache.filter.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[cache.filter.sortBy as keyof CacheEntry];
        const bVal = b[cache.filter.sortBy as keyof CacheEntry];
        const order = cache.filter.sortOrder === 'desc' ? -1 : 1;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [cache.filteredEntries, cache.filter]);
  
  const filteredNodes = useMemo(() => {
    return cache.nodes.filter(node => {
      if (cache.filter.status && node.status !== cache.filter.status) return false;
      if (cache.filter.region && node.region !== cache.filter.region) return false;
      return true;
    });
  }, [cache.nodes, cache.filter]);
  
  const filteredClusters = useMemo(() => {
    return cache.clusters;
  }, [cache.clusters]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Entradas',
      value: cache.entries.length.toLocaleString(),
      icon: Database,
      color: 'blue',
      trend: '+12%',
      description: 'Entradas ativas no cache'
    },
    {
      title: 'Taxa de Acerto',
      value: `${cache.totalHitRate.toFixed(1)}%`,
      icon: Target,
      color: cache.totalHitRate >= 80 ? 'green' : cache.totalHitRate >= 60 ? 'yellow' : 'red',
      trend: '+5.2%',
      description: 'Eficiência do cache'
    },
    {
      title: 'Latência Média',
      value: `${cache.avgLatency.toFixed(1)}ms`,
      icon: Zap,
      color: cache.avgLatency <= 10 ? 'green' : cache.avgLatency <= 50 ? 'yellow' : 'red',
      trend: '-8%',
      description: 'Tempo de resposta'
    },
    {
      title: 'Nós Online',
      value: `${cache.onlineNodes.length}/${cache.nodes.length}`,
      icon: Server,
      color: cache.onlineNodes.length === cache.nodes.length ? 'green' : 'yellow',
      trend: '100%',
      description: 'Disponibilidade dos nós'
    },
    {
      title: 'Saúde do Sistema',
      value: `${cache.systemHealth}%`,
      icon: Shield,
      color: cache.systemHealth >= 80 ? 'green' : cache.systemHealth >= 60 ? 'yellow' : 'red',
      trend: '+2%',
      description: 'Estado geral do sistema'
    },
    {
      title: 'Alertas Críticos',
      value: criticalAlerts.length.toString(),
      icon: AlertTriangle,
      color: criticalAlerts.length === 0 ? 'green' : 'red',
      trend: criticalAlerts.length === 0 ? '0' : `+${criticalAlerts.length}`,
      description: 'Alertas que requerem atenção'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'entries', label: 'Entradas', icon: Database },
    { id: 'nodes', label: 'Nós', icon: Server },
    { id: 'clusters', label: 'Clusters', icon: Layers },
    { id: 'monitoring', label: 'Monitoramento', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  return (
    <div className={`distributed-cache-manager bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cache Distribuído</h2>
              <p className="text-sm text-gray-500">
                Gerenciamento avançado de cache com replicação e otimização automática
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                cache.isLoading ? 'bg-blue-500 animate-pulse' :
                cache.isSyncing ? 'bg-yellow-500 animate-pulse' :
                cache.isOptimizing ? 'bg-purple-500 animate-pulse' :
                'bg-green-500'
              }`} />
              <span className="text-sm text-gray-600">
                {cache.currentOperation || 'Sistema operacional'}
              </span>
            </div>
            
            <button
              onClick={() => cache.autoRefresh.toggle()}
              className={`p-2 rounded-lg border transition-colors ${
                cache.autoRefresh.enabled
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
              title={cache.autoRefresh.enabled ? 'Desabilitar auto-refresh' : 'Habilitar auto-refresh'}
            >
              {cache.autoRefresh.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => cache.actions.refresh()}
              disabled={cache.isLoading}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${cache.isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {cache.hasError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-800">Erro no Sistema</span>
            </div>
            <button
              onClick={cache.clearError}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-sm text-red-700">{cache.error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {cache.isLoading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-blue-800">
              {cache.currentOperation || 'Carregando dados do cache...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${
                    card.color === 'blue' ? 'bg-blue-100' :
                    card.color === 'green' ? 'bg-green-100' :
                    card.color === 'yellow' ? 'bg-yellow-100' :
                    card.color === 'red' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      card.color === 'blue' ? 'text-blue-600' :
                      card.color === 'green' ? 'text-green-600' :
                      card.color === 'yellow' ? 'text-yellow-600' :
                      card.color === 'red' ? 'text-red-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    card.trend.startsWith('+') && card.color === 'green' ? 'bg-green-100 text-green-800' :
                    card.trend.startsWith('-') ? 'bg-green-100 text-green-800' :
                    card.trend.startsWith('+') ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {card.trend}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
              </div>
            );
          })}
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
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance do Cache</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taxa de Acerto</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${cache.totalHitRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{cache.totalHitRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Latência Média</span>
                    <span className="text-sm font-medium text-gray-900">{cache.avgLatency.toFixed(1)}ms</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Throughput</span>
                    <span className="text-sm font-medium text-gray-900">{cache.metrics.throughput.toLocaleString()} ops/s</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uso de Memória</span>
                    <span className="text-sm font-medium text-gray-900">{cache.metrics.memoryUsage.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saúde do Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Saúde Geral</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            cache.systemHealth >= 80 ? 'bg-green-500' :
                            cache.systemHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cache.systemHealth}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{cache.systemHealth}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Replicação</span>
                    <span className="text-sm font-medium text-gray-900">{cache.replicationHealth.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Consistência</span>
                    <span className="text-sm font-medium text-gray-900">{cache.consistencyScore.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nós Saudáveis</span>
                    <span className="text-sm font-medium text-gray-900">{cache.healthyNodes.length}/{cache.nodes.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <button
                  onClick={() => cache.quickActions.flushAll()}
                  disabled={cache.isLoading}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Limpar Tudo</span>
                </button>
                
                <button
                  onClick={() => cache.quickActions.optimizeMemory()}
                  disabled={cache.isOptimizing}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Gauge className="w-5 h-5 text-blue-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Otimizar</span>
                </button>
                
                <button
                  onClick={() => cache.quickActions.rebalanceAll()}
                  disabled={cache.isOptimizing}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Layers className="w-5 h-5 text-purple-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Rebalancear</span>
                </button>
                
                <button
                  onClick={() => cache.quickActions.syncAll()}
                  disabled={cache.isSyncing}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-green-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Sincronizar</span>
                </button>
                
                <button
                  onClick={() => cache.quickActions.healthCheck()}
                  disabled={cache.isLoading}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Shield className="w-5 h-5 text-orange-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Verificar</span>
                </button>
                
                <button
                  onClick={() => cache.quickActions.backup()}
                  disabled={cache.isLoading}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-indigo-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Backup</span>
                </button>
                
                <button
                  onClick={() => cache.exportData()}
                  disabled={cache.isLoading}
                  className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-teal-500 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Exportar</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'entries' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar entradas por chave..."
                    value={cache.searchQuery}
                    onChange={(e) => cache.throttledActions.setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={cache.filter.priority || ''}
                  onChange={(e) => cache.setFilter({ ...cache.filter, priority: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas as prioridades</option>
                  <option value="critical">Crítica</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
                
                <select
                  value={cache.filter.nodeId || ''}
                  onChange={(e) => cache.setFilter({ ...cache.filter, nodeId: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os nós</option>
                  {cache.nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
                
                <button
                  onClick={cache.clearFilters}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Limpar filtros"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Entries Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chave
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TTL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acessos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nó
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry) => {
                      const score = calculateCacheScore(entry);
                      const recommendation = getCacheRecommendation(entry);
                      const isExpired = new Date(entry.createdAt.getTime() + entry.ttl * 1000) <= new Date();
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {getCachePriorityIcon(entry.priority)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{entry.key}</div>
                                <div className="text-sm text-gray-500">
                                  {entry.tags.map(tag => (
                                    <span key={tag} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCacheSize(entry.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-400 mr-1" />
                              <span className={`text-sm ${
                                isExpired ? 'text-red-600 font-medium' : 'text-gray-900'
                              }`}>
                                {Math.round(entry.ttl / 60)}m
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              entry.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              entry.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {entry.priority === 'critical' ? 'Crítica' :
                               entry.priority === 'high' ? 'Alta' :
                               entry.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.accessCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cache.nodes.find(n => n.id === entry.nodeId)?.name || entry.nodeId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    score >= 80 ? 'bg-green-500' :
                                    score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">{score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => cache.setSelectedEntry(entry.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cache.actions.touch(entry.key)}
                                className="text-green-600 hover:text-green-900"
                                title="Atualizar acesso"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cache.actions.delete(entry.key)}
                                className="text-red-600 hover:text-red-900"
                                title="Remover entrada"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma entrada encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {cache.searchQuery || Object.keys(cache.filter).length > 0
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Adicione algumas entradas ao cache para começar.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'nodes' && (
          <div className="space-y-6">
            {/* Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNodes.map((node) => {
                const utilizationPercent = (node.usedSpace / node.capacity) * 100;
                const loadPercent = node.load * 100;
                
                return (
                  <div key={node.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          node.status === 'online' ? 'bg-green-100' :
                          node.status === 'offline' ? 'bg-red-100' :
                          node.status === 'degraded' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <Server className={`w-5 h-5 ${
                            node.status === 'online' ? 'text-green-600' :
                            node.status === 'offline' ? 'text-red-600' :
                            node.status === 'degraded' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
                          <p className="text-sm text-gray-500">{node.host}:{node.port}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {node.isLeader && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Líder
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          node.status === 'online' ? 'bg-green-100 text-green-800' :
                          node.status === 'offline' ? 'bg-red-100 text-red-800' :
                          node.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {node.status === 'online' ? 'Online' :
                           node.status === 'offline' ? 'Offline' :
                           node.status === 'degraded' ? 'Degradado' : 'Manutenção'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Utilização de Memória</span>
                          <span className="font-medium text-gray-900">{utilizationPercent.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              utilizationPercent >= 90 ? 'bg-red-500' :
                              utilizationPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${utilizationPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatCacheSize(node.usedSpace)} / {formatCacheSize(node.capacity)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Carga do Sistema</span>
                          <span className="font-medium text-gray-900">{loadPercent.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              loadPercent >= 90 ? 'bg-red-500' :
                              loadPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${loadPercent}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Latência</span>
                          <p className="font-medium text-gray-900">{node.latency.toFixed(1)}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Throughput</span>
                          <p className="font-medium text-gray-900">{node.throughput.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Região</span>
                          <p className="font-medium text-gray-900">{node.region}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Versão</span>
                          <p className="font-medium text-gray-900">{node.version}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          {node.features.map(feature => (
                            <span key={feature} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {feature === 'compression' ? 'Compressão' :
                               feature === 'encryption' ? 'Criptografia' :
                               feature === 'replication' ? 'Replicação' : feature}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => cache.setSelectedNode(node.id)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cache.actions.updateNode(node.id, { status: 'maintenance' })}
                            className="p-1 text-yellow-600 hover:text-yellow-900"
                            title="Modo manutenção"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cache.actions.removeNode(node.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Remover nó"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredNodes.length === 0 && (
              <div className="text-center py-12">
                <Server className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum nó encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adicione nós ao cluster para começar a distribuir o cache.
                </p>
                <button
                  onClick={() => {
                    // Add new node logic
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Nó
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'clusters' && (
          <div className="space-y-6">
            {/* Cluster Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredClusters.map((cluster) => {
                const utilizationPercent = (cluster.totalUsed / cluster.totalCapacity) * 100;
                
                return (
                  <div key={cluster.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          cluster.healthScore >= 80 ? 'bg-green-100' :
                          cluster.healthScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Layers className={`w-5 h-5 ${
                            cluster.healthScore >= 80 ? 'text-green-600' :
                            cluster.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{cluster.name}</h3>
                          <p className="text-sm text-gray-500">{cluster.nodes.length} nós</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{cluster.healthScore}%</div>
                        <div className="text-sm text-gray-500">Saúde</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Utilização de Capacidade</span>
                          <span className="font-medium text-gray-900">{utilizationPercent.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              utilizationPercent >= 90 ? 'bg-red-500' :
                              utilizationPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${utilizationPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatCacheSize(cluster.totalUsed)} / {formatCacheSize(cluster.totalCapacity)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Estratégia</span>
                          <p className="font-medium text-gray-900">
                            {cluster.strategy === 'consistent-hashing' ? 'Hash Consistente' :
                             cluster.strategy === 'round-robin' ? 'Round Robin' :
                             cluster.strategy === 'least-loaded' ? 'Menor Carga' : 'Geográfica'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Replicação</span>
                          <p className="font-medium text-gray-900">{cluster.replicationFactor}x</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Consistência</span>
                          <p className="font-medium text-gray-900">
                            {cluster.consistencyLevel === 'strong' ? 'Forte' :
                             cluster.consistencyLevel === 'eventual' ? 'Eventual' : 'Fraca'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Auto-scaling</span>
                          <p className="font-medium text-gray-900">
                            {cluster.autoScaling ? 'Habilitado' : 'Desabilitado'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Latência Média</span>
                          <p className="font-medium text-gray-900">{cluster.avgLatency.toFixed(1)}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Throughput</span>
                          <p className="font-medium text-gray-900">{cluster.throughput.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          {cluster.partitionTolerance && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Tolerante a Partições
                            </span>
                          )}
                          {cluster.loadBalancing && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Load Balancing
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => cache.setSelectedCluster(cluster.id)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cache.actions.updateCluster(cluster.id, {})}
                            className="p-1 text-green-600 hover:text-green-900"
                            title="Rebalancear"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cache.actions.deleteCluster(cluster.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Remover cluster"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredClusters.length === 0 && (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cluster encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crie clusters para organizar e gerenciar seus nós de cache.
                </p>
                <button
                  onClick={() => {
                    // Add new cluster logic
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Cluster
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Placeholder for other tabs */}
        {activeTab === 'monitoring' && (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Monitoramento em Tempo Real</h3>
            <p className="mt-1 text-sm text-gray-500">
              Visualização de métricas, alertas e eventos do sistema de cache.
            </p>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Avançado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Análise de performance, tendências e relatórios detalhados.
            </p>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Configurações do Sistema</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configuração de políticas, alertas e parâmetros do cache.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getStatusIcon(status: string) {
  switch (status) {
    case 'online': return CheckCircle;
    case 'offline': return XCircle;
    case 'degraded': return AlertTriangle;
    case 'maintenance': return Settings;
    default: return Server;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'online': return 'text-green-500';
    case 'offline': return 'text-red-500';
    case 'degraded': return 'text-yellow-500';
    case 'maintenance': return 'text-blue-500';
    default: return 'text-gray-500';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'online': return 'Online';
    case 'offline': return 'Offline';
    case 'degraded': return 'Degradado';
    case 'maintenance': return 'Manutenção';
    default: return 'Desconhecido';
  }
}