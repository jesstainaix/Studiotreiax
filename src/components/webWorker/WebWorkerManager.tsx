import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Settings, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  Cpu, 
  MemoryStick, 
  BarChart3, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Upload,
  Zap,
  Target,
  Layers,
  Monitor,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  useWebWorkers, 
  WebWorkerTask, 
  WebWorkerInstance, 
  WorkerPool,
  formatTaskDuration,
  getTaskColor,
  getPriorityColor,
  formatWorkerTime,
  getTaskComplexity,
  getWorkerEfficiency,
  getRecommendedAction,
  getWorkerStatus
} from '../../hooks/useWebWorkers';

interface WebWorkerManagerProps {
  className?: string;
  onTaskComplete?: (taskId: string, result: any) => void;
  onWorkerError?: (workerId: string, error: string) => void;
  onConfigChange?: (config: any) => void;
}

const WebWorkerManager: React.FC<WebWorkerManagerProps> = ({
  className = '',
  onTaskComplete,
  onWorkerError,
  onConfigChange
}) => {
  const {
    workers,
    tasks,
    pools,
    config,
    stats,
    analytics,
    isLoading,
    error,
    actions,
    quickActions,
    health,
    isHealthy,
    needsAttention,
    efficiency,
    utilization,
    overallProgress,
    getFilteredTasks,
    getFilteredWorkers
  } = useWebWorkers();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh and demo data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate some demo tasks if no real tasks exist
        if (tasks.length === 0) {
          const demoTasks = [
            {
              type: 'video_processing' as const,
              name: 'Demo Video Processing',
              description: 'Processing demo video file',
              priority: 'high' as const,
              data: { size: 1024 * 1024 * 50, format: 'mp4' },
              metadata: { size: 1024 * 1024 * 50, format: 'mp4', quality: 'high' }
            },
            {
              type: 'image_processing' as const,
              name: 'Demo Image Optimization',
              description: 'Optimizing demo images',
              priority: 'medium' as const,
              data: { size: 1024 * 1024 * 5, format: 'jpg' },
              metadata: { size: 1024 * 1024 * 5, format: 'jpg', quality: 'high' }
            },
            {
              type: 'data_analysis' as const,
              name: 'Demo Data Analysis',
              description: 'Analyzing demo dataset',
              priority: 'low' as const,
              data: { records: 10000, columns: 25 },
              metadata: { size: 1024 * 1024 * 2, format: 'json' }
            }
          ];
          
          demoTasks.forEach(task => {
            const taskId = actions.createTask(task);
            setTimeout(() => actions.executeTask(taskId), Math.random() * 2000);
          });
        }
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, tasks.length, actions]);

  // Status cards data
  const statusCards = useMemo(() => [
    {
      id: 'workers',
      title: 'Workers Ativos',
      value: stats.activeWorkers,
      total: stats.totalWorkers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats.activeWorkers > 0 ? 'up' : 'stable',
      description: `${stats.idleWorkers} inativos`
    },
    {
      id: 'tasks',
      title: 'Tarefas Executadas',
      value: stats.completedTasks,
      total: stats.totalTasks,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: stats.completedTasks > stats.failedTasks ? 'up' : 'down',
      description: `${stats.pendingTasks} pendentes`
    },
    {
      id: 'performance',
      title: 'Performance',
      value: Math.round(efficiency),
      total: 100,
      icon: TrendingUp,
      color: efficiency > 80 ? 'text-green-600' : efficiency > 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: efficiency > 80 ? 'bg-green-50' : efficiency > 60 ? 'bg-yellow-50' : 'bg-red-50',
      trend: efficiency > 80 ? 'up' : efficiency > 60 ? 'stable' : 'down',
      description: `${Math.round(utilization)}% utilização`
    },
    {
      id: 'health',
      title: 'Saúde do Sistema',
      value: health,
      total: 100,
      icon: Activity,
      color: isHealthy ? 'text-green-600' : 'text-red-600',
      bgColor: isHealthy ? 'bg-green-50' : 'bg-red-50',
      trend: isHealthy ? 'up' : 'down',
      description: isHealthy ? 'Sistema saudável' : 'Requer atenção'
    }
  ], [stats, efficiency, utilization, health, isHealthy]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Monitor },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'tasks', label: 'Tarefas', icon: Layers },
    { id: 'pools', label: 'Pools', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Play;
      case 'failed': return XCircle;
      case 'cancelled': return Square;
      case 'pending': return Clock;
      default: return AlertCircle;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingUp;
      case 'stable': return Activity;
      default: return Activity;
    }
  };

  const getWorkerIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'image': return Eye;
      case 'data': return BarChart3;
      case 'general': return Cpu;
      default: return Users;
    }
  };

  const handleQuickAction = async (action: string, data?: any) => {
    try {
      switch (action) {
        case 'process_video':
          await quickActions.processVideo(data || { size: 1024 * 1024 * 10, format: 'mp4' });
          break;
        case 'process_image':
          await quickActions.processImage(data || { size: 1024 * 1024 * 2, format: 'jpg' });
          break;
        case 'analyze_data':
          await quickActions.analyzeData(data || { records: 1000, columns: 10 });
          break;
        case 'scale_up':
          quickActions.scaleWorkers(workers.length + 2);
          break;
        case 'scale_down':
          quickActions.scaleWorkers(Math.max(1, workers.length - 1));
          break;
        case 'clear_completed':
          // Clear completed tasks
          break;
        case 'restart_failed':
          tasks.filter(t => t.status === 'failed').forEach(t => actions.retryTask(t.id));
          break;
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

  // Filtered data
  const filteredTasks = useMemo(() => {
    return getFilteredTasks(
      filterStatus === 'all' ? undefined : filterStatus,
      filterType === 'all' ? undefined : filterType
    ).filter(task => 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [getFilteredTasks, filterStatus, filterType, searchTerm]);

  const filteredWorkers = useMemo(() => {
    return getFilteredWorkers(
      filterStatus === 'all' ? undefined : filterStatus,
      filterType === 'all' ? undefined : filterType
    ).filter(worker => 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [getFilteredWorkers, filterStatus, filterType, searchTerm]);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Web Worker Manager</h2>
              <p className="text-sm text-gray-600">Gerenciamento avançado de Web Workers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={() => setShowCreateWorker(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Worker</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Status Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusCards.map((card) => {
              const Icon = card.icon;
              const TrendIcon = getTrendIcon(card.trend);
              const isExpanded = expandedCards.has(card.id);
              
              return (
                <div key={card.id} className={`${card.bgColor} rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md`}
                     onClick={() => toggleCardExpansion(card.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-8 w-8 ${card.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {card.value}
                          {card.total && <span className="text-sm text-gray-500">/{card.total}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <TrendIcon className={`h-4 w-4 ${card.color} mb-1`} />
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{card.description}</p>
                      {card.id === 'performance' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                efficiency > 80 ? 'bg-green-500' : efficiency > 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${efficiency}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Search and Filter Bar */}
          <div className="px-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar workers, tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="idle">Inativo</option>
                  <option value="busy">Ocupado</option>
                  <option value="error">Erro</option>
                  <option value="pending">Pendente</option>
                  <option value="running">Executando</option>
                  <option value="completed">Concluído</option>
                  <option value="failed">Falhou</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="video">Vídeo</option>
                  <option value="image">Imagem</option>
                  <option value="data">Dados</option>
                  <option value="general">Geral</option>
                </select>
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
                        ? 'border-purple-500 text-purple-600'
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleQuickAction('process_video')}
                      className="flex items-center justify-center space-x-2 p-3 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      <Play className="h-4 w-4" />
                      <span>Processar Vídeo</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction('process_image')}
                      className="flex items-center justify-center space-x-2 p-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Processar Imagem</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction('analyze_data')}
                      className="flex items-center justify-center space-x-2 p-3 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analisar Dados</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction('scale_up')}
                      className="flex items-center justify-center space-x-2 p-3 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Escalar Workers</span>
                    </button>
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Saúde do Sistema</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status Geral</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isHealthy ? 'Saudável' : 'Requer Atenção'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Recomendação</span>
                      <span className="text-sm text-gray-900">{getRecommendedAction(stats)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          health > 80 ? 'bg-green-500' : health > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${health}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h3>
                  <div className="space-y-3">
                    {tasks.slice(-5).reverse().map((task) => {
                      const StatusIcon = getStatusIcon(task.status);
                      return (
                        <div key={task.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                          <StatusIcon className={`h-4 w-4 ${getTaskColor(task.status)}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{task.name}</p>
                            <p className="text-xs text-gray-500">{formatWorkerTime(task.timestamp)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Workers ({filteredWorkers.length})</h3>
                  <button
                    onClick={() => setShowCreateWorker(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Worker</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorkers.map((worker) => {
                    const WorkerIcon = getWorkerIcon(worker.type);
                    const efficiency = getWorkerEfficiency(worker);
                    const status = getWorkerStatus(worker);
                    
                    return (
                      <div key={worker.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <WorkerIcon className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-gray-900">{worker.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            worker.status === 'idle' ? 'bg-green-100 text-green-800' :
                            worker.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {worker.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Tipo:</span>
                            <span className="font-medium">{worker.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tarefas:</span>
                            <span className="font-medium">{worker.tasksCompleted}/{worker.tasksTotal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Eficiência:</span>
                            <span className="font-medium">{Math.round(efficiency)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Última Atividade:</span>
                            <span className="font-medium">{formatWorkerTime(worker.lastActivity)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => actions.terminateWorker(worker.id)}
                              className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                            >
                              Terminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Tarefas ({filteredTasks.length})</h3>
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nova Tarefa</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const StatusIcon = getStatusIcon(task.status);
                    const complexity = getTaskComplexity(task);
                    
                    return (
                      <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <StatusIcon className={`h-5 w-5 ${getTaskColor(task.status)}`} />
                            <div>
                              <h4 className="font-medium text-gray-900">{task.name}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                        
                        {task.status === 'running' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progresso</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="block text-xs text-gray-500">Tipo</span>
                            <span className="font-medium">{task.type}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Complexidade</span>
                            <span className="font-medium">{complexity}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Tentativas</span>
                            <span className="font-medium">{task.retryCount}/{task.maxRetries}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Duração</span>
                            <span className="font-medium">
                              {task.duration ? formatTaskDuration(task.duration) : '-'}
                            </span>
                          </div>
                        </div>
                        
                        {(task.status === 'failed' || task.status === 'pending') && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex space-x-2">
                              {task.status === 'failed' && (
                                <button
                                  onClick={() => actions.retryTask(task.id)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                                >
                                  Tentar Novamente
                                </button>
                              )}
                              {task.status === 'pending' && (
                                <button
                                  onClick={() => actions.executeTask(task.id)}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                                >
                                  Executar
                                </button>
                              )}
                              <button
                                onClick={() => actions.cancelTask(task.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {task.error && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{task.error}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'pools' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Worker Pools ({pools.length})</h3>
                  <button
                    onClick={() => setShowCreatePool(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Pool</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pools.map((pool) => (
                    <div key={pool.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">{pool.name}</span>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {pool.type}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Workers:</span>
                          <span className="font-medium">{pool.workers.length}/{pool.maxWorkers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estratégia:</span>
                          <span className="font-medium">{pool.strategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tarefas Concluídas:</span>
                          <span className="font-medium">{pool.metrics.completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Throughput:</span>
                          <span className="font-medium">{pool.metrics.throughput}/min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Analytics e Métricas</h3>
                
                {/* Task Types Analytics */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Análise por Tipo de Tarefa</h4>
                  <div className="space-y-3">
                    {analytics.taskTypes.map((taskType) => (
                      <div key={taskType.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <span className="font-medium text-gray-900">{taskType.type}</span>
                          <p className="text-sm text-gray-600">{taskType.count} tarefas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {Math.round(taskType.successRate)}% sucesso
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatTaskDuration(taskType.averageTime)} médio
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Métricas de Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{analytics.performance.peakThroughput}</p>
                      <p className="text-sm text-gray-600">Pico de Throughput</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatTaskDuration(analytics.performance.averageLatency)}
                      </p>
                      <p className="text-sm text-gray-600">Latência Média</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(analytics.performance.memoryEfficiency)}%
                      </p>
                      <p className="text-sm text-gray-600">Eficiência de Memória</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round(analytics.performance.cpuEfficiency)}%
                      </p>
                      <p className="text-sm text-gray-600">Eficiência de CPU</p>
                    </div>
                  </div>
                </div>
                
                {/* Worker Utilization */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Utilização dos Workers</h4>
                  <div className="space-y-3">
                    {analytics.workerUtilization.map((worker) => (
                      <div key={worker.workerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium text-gray-900">{worker.workerId}</span>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-gray-600">
                            Utilização: <span className="font-medium">{Math.round(worker.utilization)}%</span>
                          </span>
                          <span className="text-gray-600">
                            Eficiência: <span className="font-medium">{Math.round(worker.efficiency)}%</span>
                          </span>
                          <span className="text-gray-600">
                            Confiabilidade: <span className="font-medium">{Math.round(worker.reliability)}%</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configurações</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Configurações Gerais</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Máximo de Workers
                        </label>
                        <input
                          type="number"
                          value={config.maxWorkers}
                          onChange={(e) => actions.updateConfig({ maxWorkers: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tarefas Concorrentes
                        </label>
                        <input
                          type="number"
                          value={config.maxConcurrentTasks}
                          onChange={(e) => actions.updateConfig({ maxConcurrentTasks: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timeout de Tarefa (ms)
                        </label>
                        <input
                          type="number"
                          value={config.taskTimeout}
                          onChange={(e) => actions.updateConfig({ taskTimeout: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tentativas de Retry
                        </label>
                        <input
                          type="number"
                          value={config.retryAttempts}
                          onChange={(e) => actions.updateConfig({ retryAttempts: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Auto-terminar Workers</span>
                        <button
                          onClick={() => actions.updateConfig({ autoTerminate: !config.autoTerminate })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.autoTerminate ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.autoTerminate ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Habilitar Logging</span>
                        <button
                          onClick={() => actions.updateConfig({ enableLogging: !config.enableLogging })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.enableLogging ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.enableLogging ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Auto-escalar</span>
                        <button
                          onClick={() => actions.updateConfig({ autoScale: !config.autoScale })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.autoScale ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.autoScale ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => actions.clearTasks()}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Limpar Tarefas
                        </button>
                        <button
                          onClick={() => actions.resetStats()}
                          className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                        >
                          Resetar Estatísticas
                        </button>
                        <button
                          onClick={() => actions.clearWorkers()}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Terminar Todos Workers
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Worker Dialog */}
      {showCreateWorker && (
        <CreateWorkerDialog
          onClose={() => setShowCreateWorker(false)}
          onCreate={(type, name) => {
            actions.createWorker(type, name);
            setShowCreateWorker(false);
          }}
        />
      )}

      {/* Create Task Dialog */}
      {showCreateTask && (
        <CreateTaskDialog
          onClose={() => setShowCreateTask(false)}
          onCreate={(taskData) => {
            const taskId = actions.createTask(taskData);
            actions.executeTask(taskId);
            setShowCreateTask(false);
          }}
        />
      )}

      {/* Create Pool Dialog */}
      {showCreatePool && (
        <CreatePoolDialog
          onClose={() => setShowCreatePool(false)}
          onCreate={(name, type, maxWorkers) => {
            actions.createPool(name, type, maxWorkers);
            setShowCreatePool(false);
          }}
        />
      )}
    </div>
  );
};

// Create Worker Dialog Component
interface CreateWorkerDialogProps {
  onClose: () => void;
  onCreate: (type: string, name: string) => void;
}

const CreateWorkerDialog: React.FC<CreateWorkerDialogProps> = ({ onClose, onCreate }) => {
  const [type, setType] = useState('general');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(type, name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Worker</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo do Worker
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="general">Geral</option>
              <option value="video">Processamento de Vídeo</option>
              <option value="image">Processamento de Imagem</option>
              <option value="data">Análise de Dados</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Worker
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Video Worker 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Criar Worker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Task Dialog Component
interface CreateTaskDialogProps {
  onClose: () => void;
  onCreate: (taskData: any) => void;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ onClose, onCreate }) => {
  const [type, setType] = useState('video_processing');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onCreate({
        type,
        name: name.trim(),
        description: description.trim(),
        priority,
        data: { size: 1024 * 1024 * 10, format: 'mp4' },
        metadata: { size: 1024 * 1024 * 10, format: 'mp4' }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Nova Tarefa</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo da Tarefa
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="video_processing">Processamento de Vídeo</option>
              <option value="image_processing">Processamento de Imagem</option>
              <option value="data_analysis">Análise de Dados</option>
              <option value="compression">Compressão</option>
              <option value="encryption">Criptografia</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Tarefa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Processar vídeo promocional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que esta tarefa faz..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Pool Dialog Component
interface CreatePoolDialogProps {
  onClose: () => void;
  onCreate: (name: string, type: string, maxWorkers: number) => void;
}

const CreatePoolDialog: React.FC<CreatePoolDialogProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('general');
  const [maxWorkers, setMaxWorkers] = useState(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), type, maxWorkers);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Pool</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Pool
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Video Processing Pool"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo do Pool
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="general">Geral</option>
              <option value="video">Processamento de Vídeo</option>
              <option value="image">Processamento de Imagem</option>
              <option value="data">Análise de Dados</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máximo de Workers
            </label>
            <input
              type="number"
              value={maxWorkers}
              onChange={(e) => setMaxWorkers(parseInt(e.target.value))}
              min={1}
              max={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Criar Pool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebWorkerManager;