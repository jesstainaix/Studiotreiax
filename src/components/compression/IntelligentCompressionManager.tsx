import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  BarChart3, 
  Activity, 
  Zap, 
  Clock, 
  HardDrive, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Save, 
  X, 
  Info, 
  Gauge, 
  Target, 
  Layers, 
  Image, 
  Video, 
  Music, 
  Archive, 
  FileImage, 
  Calendar, 
  Users, 
  Globe, 
  Shield, 
  Database, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop
} from 'lucide-react';
import { 
  useIntelligentCompression, 
  useCompressionStats, 
  useCompressionConfig, 
  useCompressionAnalytics, 
  useCompressionRealTime 
} from '../../hooks/useIntelligentCompression';
import { 
  CompressionProfile, 
  CompressionTask, 
  formatFileSize, 
  getCompressionRatioColor, 
  getFileTypeIcon, 
  formatDuration, 
  calculateSavings 
} from '../../services/intelligentCompressionService';

const IntelligentCompressionManager: React.FC = () => {
  // Hooks
  const compression = useIntelligentCompression();
  const stats = useCompressionStats();
  const config = useCompressionConfig();
  const analytics = useCompressionAnalytics();
  const realTime = useCompressionRealTime();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAnalysisTask, setSelectedAnalysisTask] = useState<CompressionTask | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompressionProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (realTime.isProcessing) {
        compression.updateSystemMetrics();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [realTime.isProcessing]);

  // Generate demo data on mount
  useEffect(() => {
    if (compression.tasks.length === 0) {
      compression.generateDemoData();
    }
  }, []);

  // Filtered and sorted data
  const filteredTasks = useMemo(() => {
    return compression.tasks
      .filter(task => {
        const matchesSearch = task.fileName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortBy as keyof CompressionTask];
        const bValue = b[sortBy as keyof CompressionTask];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [compression.tasks, searchTerm, filterStatus, sortBy, sortOrder]);

  // Status cards data
  const statusCards = [
    {
      title: 'Tarefas Ativas',
      value: stats.tasksByStatus.processing,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      trend: 'up' as const
    },
    {
      title: 'Taxa de Sucesso',
      value: `${compression.completionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5.2%',
      trend: 'up' as const
    },
    {
      title: 'Espaço Economizado',
      value: formatFileSize(compression.totalSpaceSaved),
      icon: HardDrive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+1.2GB',
      trend: 'up' as const
    },
    {
      title: 'Carga do Sistema',
      value: `${realTime.systemLoad}%`,
      icon: Cpu,
      color: realTime.systemLoad > 80 ? 'text-red-600' : 'text-orange-600',
      bgColor: realTime.systemLoad > 80 ? 'bg-red-50' : 'bg-orange-50',
      change: realTime.systemLoad > 80 ? 'Alto' : 'Normal',
      trend: realTime.systemLoad > 80 ? 'down' : 'up' as const
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'tasks', label: 'Tarefas', icon: FileText },
    { id: 'profiles', label: 'Perfis', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Compressão Inteligente
              </h1>
              <p className="text-sm text-gray-500">
                Sistema avançado de otimização de assets
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => compression.generateDemoData()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </button>
            
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {compression.error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro no Sistema</h3>
              <p className="text-sm text-red-700 mt-1">{compression.error}</p>
            </div>
            <button
              onClick={compression.clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {compression.isProcessing && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Loader className="h-5 w-5 text-blue-600 mr-3 animate-spin" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Processando</h3>
              <p className="text-sm text-blue-700 mt-1">
                {realTime.queueLength} tarefas na fila
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
            
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className={`flex items-center text-xs ${
                    card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {card.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.title}</p>
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
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Estatísticas Rápidas
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Compressões</span>
                    <span className="font-medium">{analytics.totalCompressions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Economia Total</span>
                    <span className="font-medium text-green-600">
                      {formatFileSize(analytics.totalSavings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tempo Médio</span>
                    <span className="font-medium">
                      {formatDuration(analytics.averageCompressionTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Erro</span>
                    <span className={`font-medium ${
                      analytics.errorRate > 5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {analytics.errorRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Sistema
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Carga do Sistema</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            realTime.systemLoad > 80 ? 'bg-red-500' : 
                            realTime.systemLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${realTime.systemLoad}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{realTime.systemLoad}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uso de Memória</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            realTime.memoryUsage > 90 ? 'bg-red-500' : 
                            realTime.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${realTime.memoryUsage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{realTime.memoryUsage}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conexões Ativas</span>
                    <span className="font-medium">{realTime.activeConnections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fila de Processamento</span>
                    <span className="font-medium">{realTime.queueLength}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Tasks */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Tarefas Recentes
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arquivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progresso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Economia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.slice(0, 5).map((task) => {
                      const FileIcon = getFileTypeIcon(task.metadata?.format || 'unknown');
                      
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {task.fileName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatFileSize(task.originalSize)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'failed' ? 'bg-red-100 text-red-800' :
                              task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {task.status === 'processing' && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                              {task.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                              {task.status === 'cancelled' && <X className="h-3 w-3 mr-1" />}
                              {task.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {task.status === 'completed' ? 'Concluído' :
                               task.status === 'processing' ? 'Processando' :
                               task.status === 'failed' ? 'Falhou' :
                               task.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">{task.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {task.compressionRatio ? (
                              <span className={`text-sm font-medium ${
                                getCompressionRatioColor(task.compressionRatio)
                              }`}>
                                {task.compressionRatio}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedAnalysisTask(task);
                                  setShowAnalysisModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {task.status === 'processing' && (
                                <button
                                  onClick={() => compression.cancelTask(task.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Square className="h-4 w-4" />
                                </button>
                              )}
                              {task.status === 'failed' && (
                                <button
                                  onClick={() => compression.retryTask(task.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar tarefas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="processing">Processando</option>
                    <option value="completed">Concluído</option>
                    <option value="failed">Falhou</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => compression.clearCompletedTasks()}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Concluídas
                  </button>
                  
                  <button
                    onClick={() => {
                      // Simulate adding a new task
                      compression.addTask({
                        fileName: `new-file-${Date.now()}.jpg`,
                        originalSize: Math.floor(Math.random() * 10000000),
                        profileId: compression.profiles[0]?.id || 'default',
                        metadata: {
                          mimeType: 'image/jpeg',
                          format: 'jpg'
                        }
                      });
                    }}
                    className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </button>
                </div>
              </div>
            </div>
            
            {/* Tasks List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arquivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progresso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamanho Original
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comprimido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Economia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tempo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => {
                      const FileIcon = getFileTypeIcon(task.metadata?.format || 'unknown');
                      const savings = task.compressedSize 
                        ? calculateSavings(task.originalSize, task.compressedSize)
                        : 0;
                      
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {task.fileName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {task.metadata?.mimeType || 'Tipo desconhecido'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'failed' ? 'bg-red-100 text-red-800' :
                              task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.status === 'completed' ? 'Concluído' :
                               task.status === 'processing' ? 'Processando' :
                               task.status === 'failed' ? 'Falhou' :
                               task.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">{task.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatFileSize(task.originalSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.compressedSize ? formatFileSize(task.compressedSize) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {task.compressionRatio ? (
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  getCompressionRatioColor(task.compressionRatio)
                                }`}>
                                  {task.compressionRatio}%
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({formatFileSize(savings)} economizados)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.duration ? formatDuration(task.duration) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedAnalysisTask(task);
                                  setShowAnalysisModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900"
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {task.status === 'processing' && (
                                <button
                                  onClick={() => compression.cancelTask(task.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancelar"
                                >
                                  <Square className="h-4 w-4" />
                                </button>
                              )}
                              {task.status === 'failed' && (
                                <button
                                  onClick={() => compression.retryTask(task.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Tentar novamente"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
                              {task.status === 'completed' && (
                                <button
                                  onClick={() => {
                                    // Simulate download
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma tarefa encontrada
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Adicione uma nova tarefa para começar'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Perfis de Compressão
              </h2>
              <button
                onClick={() => {
                  setSelectedProfile(null);
                  setIsEditing(false);
                  setShowProfileModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Perfil
              </button>
            </div>
            
            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {compression.profilesWithStats.map((profile) => {
                const TypeIcon = getFileTypeIcon(profile.type);
                
                return (
                  <div key={profile.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <TypeIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {profile.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {profile.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProfile(profile);
                            setIsEditing(true);
                            setShowProfileModal(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => compression.duplicateProfile(profile.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Qualidade</span>
                        <span className="font-medium">{profile.quality}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Redução Alvo</span>
                        <span className="font-medium text-green-600">
                          {profile.targetReduction}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Algoritmo</span>
                        <span className="font-medium">{profile.algorithm}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tarefas</span>
                        <span className="font-medium">{profile.taskCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                        <span className={`font-medium ${
                          profile.successRate > 90 ? 'text-green-600' :
                          profile.successRate > 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {profile.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Média de Compressão</span>
                        <span className={`font-medium ${
                          getCompressionRatioColor(profile.averageRatio)
                        }`}>
                          {profile.averageRatio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {compression.profiles.length === 0 && (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum perfil configurado
                </h3>
                <p className="text-gray-500 mb-4">
                  Crie perfis de compressão para otimizar diferentes tipos de arquivo
                </p>
                <button
                  onClick={() => {
                    setSelectedProfile(null);
                    setIsEditing(false);
                    setShowProfileModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Perfil
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Métricas de Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Compressões</span>
                    <span className="font-medium">{analytics.totalCompressions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Economia Total</span>
                    <span className="font-medium text-green-600">
                      {formatFileSize(analytics.totalSavings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tempo Médio de Processamento</span>
                    <span className="font-medium">
                      {formatDuration(analytics.averageCompressionTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Atividade (24h)</span>
                    <span className="font-medium">{analytics.last24hActivity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Erro</span>
                    <span className={`font-medium ${
                      analytics.errorRate > 5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {analytics.errorRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Top Profile */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Perfil Mais Usado
                </h3>
                {analytics.topProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <Layers className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {analytics.topProfile.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {analytics.topProfile.type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Qualidade</span>
                        <span className="font-medium">{analytics.topProfile.quality}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Redução Alvo</span>
                        <span className="font-medium text-green-600">
                          {analytics.topProfile.targetReduction}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Algoritmo</span>
                        <span className="font-medium">{analytics.topProfile.algorithm}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum perfil disponível</p>
                )}
              </div>
            </div>
            
            {/* Recent Errors */}
            {analytics.recentErrors.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Erros Recentes
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {analytics.recentErrors.map((error, index) => (
                    <div key={index} className="p-6">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {error.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(error.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-time Tab */}
        {activeTab === 'realtime' && (
          <div className="space-y-6">
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Carga do Sistema</p>
                    <p className="text-2xl font-bold text-gray-900">{realTime.systemLoad}%</p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    realTime.systemLoad > 80 ? 'bg-red-100' :
                    realTime.systemLoad > 60 ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Cpu className={`h-6 w-6 ${
                      realTime.systemLoad > 80 ? 'text-red-600' :
                      realTime.systemLoad > 60 ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        realTime.systemLoad > 80 ? 'bg-red-500' :
                        realTime.systemLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${realTime.systemLoad}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uso de Memória</p>
                    <p className="text-2xl font-bold text-gray-900">{realTime.memoryUsage}%</p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    realTime.memoryUsage > 90 ? 'bg-red-100' :
                    realTime.memoryUsage > 70 ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <HardDrive className={`h-6 w-6 ${
                      realTime.memoryUsage > 90 ? 'text-red-600' :
                      realTime.memoryUsage > 70 ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        realTime.memoryUsage > 90 ? 'bg-red-500' :
                        realTime.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${realTime.memoryUsage}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fila de Processamento</p>
                    <p className="text-2xl font-bold text-gray-900">{realTime.queueLength}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {realTime.activeConnections} conexões ativas
                  </p>
                </div>
              </div>
            </div>
            
            {/* Processing Status */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Status de Processamento
                  </h3>
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    realTime.isProcessing 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      realTime.isProcessing ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    {realTime.isProcessing ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {realTime.isProcessing ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Sistema processando {realTime.queueLength} tarefas na fila
                    </p>
                    
                    {/* Active Tasks */}
                    <div className="space-y-2">
                      {compression.tasks
                        .filter(task => task.status === 'processing')
                        .slice(0, 3)
                        .map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Loader className="h-4 w-4 text-blue-600 mr-3 animate-spin" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {task.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(task.originalSize)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">{task.progress}%</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Sistema em Standby
                    </h4>
                    <p className="text-gray-500">
                      Aguardando novas tarefas de compressão
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* System Health */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Saúde do Sistema
                </h3>
              </div>
              
              <div className="p-6">
                <div className={`flex items-center p-4 rounded-lg ${
                  realTime.isSystemHealthy 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {realTime.isSystemHealthy ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      realTime.isSystemHealthy ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {realTime.isSystemHealthy ? 'Sistema Saudável' : 'Atenção Necessária'}
                    </p>
                    <p className={`text-sm ${
                      realTime.isSystemHealthy ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {realTime.isSystemHealthy 
                        ? 'Todos os sistemas operando normalmente'
                        : 'Alguns recursos podem estar sobrecarregados'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Configurações do Sistema
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarefas Simultâneas Máximas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={compression.config.maxConcurrentTasks}
                    onChange={(e) => config.updateConfig({ 
                      maxConcurrentTasks: parseInt(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Compressão
                  </label>
                  <select
                    value={compression.config.compressionLevel}
                    onChange={(e) => config.updateConfig({ 
                      compressionLevel: e.target.value as any 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Baixo</option>
                    <option value="medium">Médio</option>
                    <option value="high">Alto</option>
                    <option value="maximum">Máximo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualidade Padrão (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={compression.config.defaultQuality}
                    onChange={(e) => config.updateConfig({ 
                      defaultQuality: parseInt(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout (segundos)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="3600"
                    value={compression.config.timeout}
                    onChange={(e) => config.updateConfig({ 
                      timeout: parseInt(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Auto-otimização</h4>
                    <p className="text-sm text-gray-500">Ajustar automaticamente configurações baseado na performance</p>
                  </div>
                  <button
                    onClick={() => config.updateConfig({ 
                      autoOptimization: !compression.config.autoOptimization 
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      compression.config.autoOptimization ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        compression.config.autoOptimization ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Backup Original</h4>
                    <p className="text-sm text-gray-500">Manter cópia do arquivo original</p>
                  </div>
                  <button
                    onClick={() => config.updateConfig({ 
                      keepOriginal: !compression.config.keepOriginal 
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      compression.config.keepOriginal ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        compression.config.keepOriginal ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => config.resetConfig()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Restaurar Padrões
                  </button>
                  <button
                    onClick={() => config.saveConfig()}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && selectedAnalysisTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Análise Detalhada
                </h3>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Task Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Arquivo</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nome:</span>
                    <span className="text-sm font-medium">{selectedAnalysisTask.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tamanho Original:</span>
                    <span className="text-sm font-medium">{formatFileSize(selectedAnalysisTask.originalSize)}</span>
                  </div>
                  {selectedAnalysisTask.compressedSize && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tamanho Comprimido:</span>
                      <span className="text-sm font-medium">{formatFileSize(selectedAnalysisTask.compressedSize)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tipo MIME:</span>
                    <span className="text-sm font-medium">{selectedAnalysisTask.metadata?.mimeType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${
                      selectedAnalysisTask.status === 'completed' ? 'text-green-600' :
                      selectedAnalysisTask.status === 'processing' ? 'text-blue-600' :
                      selectedAnalysisTask.status === 'failed' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {selectedAnalysisTask.status === 'completed' ? 'Concluído' :
                       selectedAnalysisTask.status === 'processing' ? 'Processando' :
                       selectedAnalysisTask.status === 'failed' ? 'Falhou' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Compression Stats */}
              {selectedAnalysisTask.compressionRatio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Estatísticas de Compressão</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taxa de Compressão:</span>
                      <span className={`text-sm font-medium ${
                        getCompressionRatioColor(selectedAnalysisTask.compressionRatio)
                      }`}>
                        {selectedAnalysisTask.compressionRatio}%
                      </span>
                    </div>
                    {selectedAnalysisTask.compressedSize && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Espaço Economizado:</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatFileSize(calculateSavings(selectedAnalysisTask.originalSize, selectedAnalysisTask.compressedSize))}
                        </span>
                      </div>
                    )}
                    {selectedAnalysisTask.duration && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tempo de Processamento:</span>
                        <span className="text-sm font-medium">{formatDuration(selectedAnalysisTask.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Error Info */}
              {selectedAnalysisTask.error && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Erro</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          {selectedAnalysisTask.error}
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          Ocorreu um erro durante o processamento do arquivo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                {selectedAnalysisTask.status === 'failed' && (
                  <button
                    onClick={() => {
                      compression.retryTask(selectedAnalysisTask.id);
                      setShowAnalysisModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Perfil
                </label>
                <input
                  type="text"
                  placeholder="Ex: Imagens Web"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Arquivo
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                  <option value="audio">Áudio</option>
                  <option value="document">Documento</option>
                  <option value="archive">Arquivo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualidade (%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  defaultValue="80"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redução Alvo (%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  defaultValue="50"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Algoritmo
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="lossless">Lossless</option>
                  <option value="lossy">Lossy</option>
                  <option value="adaptive">Adaptativo</option>
                  <option value="smart">Inteligente</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Simulate saving profile
                    setShowProfileModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentCompressionManager;