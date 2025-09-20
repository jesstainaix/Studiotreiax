import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Activity,
  BarChart3,
  Users,
  FileText,
  Filter,
  Search,
  X,
  Plus,
  Eye,
  TrendingUp,
  Zap,
  Target,
  Timer,
  MemoryStick,
  HardDrive
} from 'lucide-react';
import useWebWorkers, {
  WebWorkerConfig,
  WorkerTask,
  WorkerInstance,
  WorkerMetrics,
  WorkerProfile,
  WorkerLog
} from '../../hooks/useWebWorkers';

interface WebWorkerManagerProps {
  className?: string;
}

const WebWorkerManager: React.FC<WebWorkerManagerProps> = ({ className = '' }) => {
  const {
    state,
    config,
    metrics,
    profiles,
    logs,
    isLoading,
    error,
    actions
  } = useWebWorkers();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkerTask | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<WorkerInstance | null>(null);
  const [newTask, setNewTask] = useState({
    type: '',
    data: '',
    priority: 1,
    timeout: 30000
  });
  const [importData, setImportData] = useState('');

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger refresh by updating a dummy state
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Filter functions
  const filterWorkers = (workers: WorkerInstance[]) => {
    return workers.filter(worker => {
      const matchesSearch = worker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           worker.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || worker.status === filterStatus;
      const matchesType = filterType === 'all' || worker.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const filterLogs = (logs: WorkerLog[]) => {
    return logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = filterStatus === 'all' || log.level === filterStatus;
      return matchesSearch && matchesLevel;
    });
  };

  // Render functions
  const renderStatusBar = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              state.isInitialized ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {state.isInitialized ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {metrics.activeWorkers} ativos / {state.workers.length} total
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {metrics.queueLength} na fila
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">
              {metrics.throughput} tasks/min
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalTasks}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">
              {metrics.completedTasks} concluídas
            </span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Workers Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeWorkers}</p>
            </div>
            <Cpu className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {metrics.idleWorkers} ociosos
            </span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(metrics.averageProcessingTime)}
              </p>
            </div>
            <Timer className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {metrics.throughput} tasks/min
            </span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Erro</p>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics.errorRate * 100).toFixed(1)}%
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-red-600">
              {metrics.failedTasks} falharam
            </span>
          </div>
        </div>
      </div>
      
      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Performance dos Workers</h3>
        <div className="space-y-4">
          {state.workers.map(worker => (
            <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  worker.status === 'busy' ? 'bg-green-500' :
                  worker.status === 'idle' ? 'bg-blue-500' :
                  worker.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <div>
                  <p className="font-medium">{worker.id}</p>
                  <p className="text-sm text-gray-600">{worker.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{worker.tasksCompleted} tasks</p>
                <p className="text-sm text-gray-600">
                  {formatDuration(worker.averageTaskTime)} médio
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
        <div className="space-y-2">
          {logs.slice(-5).reverse().map(log => (
            <div key={log.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
              <div className={`w-2 h-2 rounded-full ${
                log.level === 'error' ? 'bg-red-500' :
                log.level === 'warn' ? 'bg-yellow-500' :
                log.level === 'info' ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-600">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="text-sm">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkers = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Workers</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar workers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="idle">Ocioso</option>
                <option value="busy">Ocupado</option>
                <option value="error">Erro</option>
                <option value="terminated">Terminado</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos os tipos</option>
                {config.workerTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Worker</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tasks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tempo Médio</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Última Atividade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filterWorkers(state.workers).map(worker => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        worker.status === 'busy' ? 'bg-green-500' :
                        worker.status === 'idle' ? 'bg-blue-500' :
                        worker.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium">{worker.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      worker.status === 'busy' ? 'bg-green-100 text-green-800' :
                      worker.status === 'idle' ? 'bg-blue-100 text-blue-800' :
                      worker.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {worker.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{worker.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{worker.tasksCompleted}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(worker.averageTaskTime)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatRelativeTime(worker.lastUsed)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedWorker(worker)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Task</span>
              </button>
              <button
                onClick={actions.clearCompletedTasks}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Limpar Concluídas
              </button>
              <button
                onClick={actions.clearFailedTasks}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Limpar Falhadas
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Fila de Espera</h4>
              <p className="text-2xl font-bold text-blue-600">{metrics.queueLength}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Em Execução</h4>
              <p className="text-2xl font-bold text-green-600">{metrics.activeWorkers}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Concluídas</h4>
              <p className="text-2xl font-bold text-purple-600">{metrics.completedTasks}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfiles = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Perfis de Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tipo de Task</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tempo Médio</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tempo Mín</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tempo Máx</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Taxa de Sucesso</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amostras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles.map(profile => (
                <tr key={profile.taskType} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{profile.taskType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(profile.averageTime)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(profile.minTime)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(profile.maxTime)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${profile.successRate * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {(profile.successRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{profile.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Logs</h3>
            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos os níveis</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
              <button
                onClick={actions.clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Limpar Logs
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-1 p-4">
            {filterLogs(logs).slice(-100).reverse().map(log => (
              <div key={log.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded text-sm">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  log.level === 'error' ? 'bg-red-500' :
                  log.level === 'warn' ? 'bg-yellow-500' :
                  log.level === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-gray-600">[{log.source}]</span>
                  </div>
                  <p className="text-gray-900 mt-1">{log.message}</p>
                  {log.data && (
                    <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configurações</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importar</span>
              </button>
              <button
                onClick={() => {
                  const data = actions.exportData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `webworkers-config-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de Workers
              </label>
              <input
                type="number"
                value={config.maxWorkers}
                onChange={(e) => actions.updateConfig({ maxWorkers: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                max="16"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={config.workerTimeout}
                onChange={(e) => actions.updateConfig({ workerTimeout: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1000"
                step="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tentativas de Retry
              </label>
              <input
                type="number"
                value={config.retryAttempts}
                onChange={(e) => actions.updateConfig({ retryAttempts: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="0"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay de Retry (ms)
              </label>
              <input
                type="number"
                value={config.retryDelay}
                onChange={(e) => actions.updateConfig({ retryDelay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="100"
                step="100"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableLogging"
                checked={config.enableLogging}
                onChange={(e) => actions.updateConfig({ enableLogging: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="enableLogging" className="text-sm font-medium text-gray-700">
                Habilitar Logging
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableMetrics"
                checked={config.enableMetrics}
                onChange={(e) => actions.updateConfig({ enableMetrics: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="enableMetrics" className="text-sm font-medium text-gray-700">
                Habilitar Métricas
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableProfiling"
                checked={config.enableProfiling}
                onChange={(e) => actions.updateConfig({ enableProfiling: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="enableProfiling" className="text-sm font-medium text-gray-700">
                Habilitar Profiling
              </label>
            </div>
          </div>
          
          {/* Worker Types Configuration */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Tipos de Workers</h4>
            <div className="space-y-4">
              {config.workerTypes.map((workerType, index) => (
                <div key={workerType.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">{workerType.name}</h5>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={workerType.enabled}
                        onChange={(e) => {
                          const newWorkerTypes = [...config.workerTypes];
                          newWorkerTypes[index].enabled = e.target.checked;
                          actions.updateConfig({ workerTypes: newWorkerTypes });
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Habilitado</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máx Instâncias
                      </label>
                      <input
                        type="number"
                        value={workerType.maxInstances}
                        onChange={(e) => {
                          const newWorkerTypes = [...config.workerTypes];
                          newWorkerTypes[index].maxInstances = Number(e.target.value);
                          actions.updateConfig({ workerTypes: newWorkerTypes });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        min="1"
                        max="8"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridade
                      </label>
                      <input
                        type="number"
                        value={workerType.priority}
                        onChange={(e) => {
                          const newWorkerTypes = [...config.workerTypes];
                          newWorkerTypes[index].priority = Number(e.target.value);
                          actions.updateConfig({ workerTypes: newWorkerTypes });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        min="1"
                        max="10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Script
                      </label>
                      <input
                        type="text"
                        value={workerType.script}
                        onChange={(e) => {
                          const newWorkerTypes = [...config.workerTypes];
                          newWorkerTypes[index].script = e.target.value;
                          actions.updateConfig({ workerTypes: newWorkerTypes });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidades
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {workerType.capabilities.map(capability => (
                        <span
                          key={capability}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Modals
  const AddTaskModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nova Task</h3>
          <button
            onClick={() => setShowAddTaskModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={newTask.type}
              onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione um tipo</option>
              <option value="video-encoding">Codificação de Vídeo</option>
              <option value="image-resize">Redimensionar Imagem</option>
              <option value="data-analysis">Análise de Dados</option>
              <option value="ml-inference">Inferência ML</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dados (JSON)
            </label>
            <textarea
              value={newTask.data}
              onChange={(e) => setNewTask({ ...newTask, data: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder='{"input": "dados da task"}'
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <input
                type="number"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={newTask.timeout}
                onChange={(e) => setNewTask({ ...newTask, timeout: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1000"
                step="1000"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowAddTaskModal(false)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (newTask.type && newTask.data) {
                try {
                  const data = JSON.parse(newTask.data);
                  actions.addTask(newTask.type, data, {
                    priority: newTask.priority,
                    timeout: newTask.timeout
                  });
                  setNewTask({ type: '', data: '', priority: 1, timeout: 30000 });
                  setShowAddTaskModal(false);
                } catch (error) {
                  alert('Dados JSON inválidos');
                }
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Criar Task
          </button>
        </div>
      </div>
    </div>
  );

  const ImportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Importar Configuração</h3>
          <button
            onClick={() => setShowImportModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dados JSON
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows={12}
              placeholder="Cole aqui os dados JSON exportados..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowImportModal(false)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              try {
                actions.importData(importData);
                setImportData('');
                setShowImportModal(false);
              } catch (error) {
                alert('Dados JSON inválidos');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );

  if (!state.isSupported) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Web Workers não suportados</h3>
            <p className="text-red-700">Seu navegador não suporta Web Workers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Web Workers Manager</h1>
              <p className="text-gray-600">Gerenciamento avançado de processamento em background</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                  <button
                    onClick={actions.clearError}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'workers', label: 'Workers', icon: Cpu },
              { id: 'tasks', label: 'Tasks', icon: Activity },
              { id: 'profiles', label: 'Perfis', icon: TrendingUp },
              { id: 'logs', label: 'Logs', icon: FileText },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
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

      {/* Status Bar */}
      {renderStatusBar()}

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-lg text-gray-600">Carregando...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'workers' && renderWorkers()}
            {activeTab === 'tasks' && renderTasks()}
            {activeTab === 'profiles' && renderProfiles()}
            {activeTab === 'logs' && renderLogs()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddTaskModal && <AddTaskModal />}
      {showImportModal && <ImportModal />}
    </div>
  );
};

export default WebWorkerManager;