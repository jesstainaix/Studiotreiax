// Componente de gerenciamento de Web Workers
import React, { useState, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Upload,
  Download,
  Settings,
  BarChart3,
  Cpu,
  HardDrive,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Film,
  Scissors,
  Palette,
  Compress,
  RotateCw,
  Tag,
  Link,
  Zap,
  TrendingUp,
  Activity,
  Monitor,
  FileVideo,
  Plus,
  X,
  Eye,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  useWebWorkers,
  useAutoVideoProcessing,
  useWebWorkerPerformance,
  useWebWorkerStats,
  useWebWorkerConfig,
  useWebWorkerDebug
} from '../../hooks/useWebWorkers';
import { VideoProcessingTask, VideoProcessingOptions } from '../../utils/webWorkers';

const WebWorkerManager: React.FC = () => {
  // Hooks
  const {
    tasks,
    workers,
    stats,
    config,
    isProcessing,
    queueLength,
    addTask,
    removeTask,
    cancelTask,
    retryTask,
    pauseTask,
    resumeTask,
    clearCompleted,
    updateConfig,
    resetConfig,
    restartWorkers,
    scaleWorkers,
    getTasksByStatus,
    getTasksByPriority,
    getEstimatedWaitTime,
    exportTasks,
    importTasks,
    formatFileSize,
    formatDuration,
    getTaskTypeIcon,
    getTaskTypeColor,
    getPriorityColor,
    getStatusColor,
    resetStats,
    getPerformanceReport
  } = useWebWorkers({
    enableNotifications: true,
    enableKeyboardShortcuts: true,
    enableAutoRetry: true,
    enablePerformanceMonitoring: true
  });
  
  const {
    processVideo,
    processMultipleVideos,
    processedFiles,
    clearProcessedFiles
  } = useAutoVideoProcessing({
    enableAutoCompress: true,
    enableAutoConvert: true,
    compressionQuality: 0.8,
    targetFormat: 'mp4'
  });
  
  const {
    performanceStatus,
    performanceMetrics,
    alerts,
    clearAlerts
  } = useWebWorkerPerformance();
  
  const {
    detailedStats
  } = useWebWorkerStats();
  
  const {
    updateSetting,
    applyOptimalConfig
  } = useWebWorkerConfig();
  
  const {
    debugInfo,
    exportDebugInfo
  } = useWebWorkerDebug();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'tasks' | 'workers' | 'performance' | 'config' | 'debug'>('tasks');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | VideoProcessingTask['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | VideoProcessingTask['priority']>('all');
  const [newTaskData, setNewTaskData] = useState<{
    type: VideoProcessingTask['type'];
    priority: VideoProcessingTask['priority'];
    options: VideoProcessingOptions;
  }>({
    type: 'compress',
    priority: 'medium',
    options: {}
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handlers
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      processMultipleVideos(videoFiles);
    }
  }, [processMultipleVideos]);
  
  const handleAddTask = useCallback(() => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      addTask(newTaskData.type, file, newTaskData.options, newTaskData.priority);
      setShowAddTaskModal(false);
      
      // Reset form
      setNewTaskData({
        type: 'compress',
        priority: 'medium',
        options: {}
      });
    }
  }, [addTask, newTaskData]);
  
  const handleBatchAction = useCallback((action: 'cancel' | 'retry' | 'remove') => {
    selectedTasks.forEach(taskId => {
      switch (action) {
        case 'cancel':
          cancelTask(taskId);
          break;
        case 'retry':
          retryTask(taskId);
          break;
        case 'remove':
          removeTask(taskId);
          break;
      }
    });
    setSelectedTasks(new Set());
  }, [selectedTasks, cancelTask, retryTask, removeTask]);
  
  const handleExportTasks = useCallback(() => {
    const data = exportTasks();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `webworker-tasks-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }, [exportTasks]);
  
  const handleImportTasks = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        importTasks(data);
      };
      reader.readAsText(file);
    }
  }, [importTasks]);
  
  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    const statusMatch = taskFilter === 'all' || task.status === taskFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });
  
  // Renderizar aba de tarefas
  const renderTasksTab = () => (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Vídeos
          </button>
          
          <button
            onClick={clearCompleted}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Concluídas
          </button>
        </div>
        
        <div className="flex gap-2">
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="processing">Processando</option>
            <option value="completed">Concluído</option>
            <option value="failed">Falhado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>
      
      {/* Ações em lote */}
      {selectedTasks.size > 0 && (
        <div className="flex gap-2 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-gray-600">
            {selectedTasks.size} tarefa(s) selecionada(s)
          </span>
          <button
            onClick={() => handleBatchAction('cancel')}
            className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleBatchAction('retry')}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={() => handleBatchAction('remove')}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Remover
          </button>
        </div>
      )}
      
      {/* Lista de tarefas */}
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`p-4 border rounded-lg transition-all ${
              selectedTasks.has(task.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedTasks);
                    if (e.target.checked) {
                      newSelected.add(task.id);
                    } else {
                      newSelected.delete(task.id);
                    }
                    setSelectedTasks(newSelected);
                  }}
                  className="w-4 h-4"
                />
                
                <div className="text-2xl">{getTaskTypeIcon(task.type)}</div>
                
                <div>
                  <div className="font-medium">
                    {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {task.id.slice(-8)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-sm font-medium text-${getStatusColor(task.status)}-600`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </div>
                  <div className={`text-xs text-${getPriorityColor(task.priority)}-600`}>
                    Prioridade: {task.priority}
                  </div>
                </div>
                
                {task.status === 'processing' && (
                  <div className="w-32">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-1">
                  {task.status === 'processing' && (
                    <button
                      onClick={() => pauseTask(task.id)}
                      className="p-2 text-orange-600 hover:bg-orange-100 rounded"
                      title="Pausar"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  
                  {task.status === 'failed' && (
                    <button
                      onClick={() => retryTask(task.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      title="Retry"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  
                  {(task.status === 'pending' || task.status === 'processing') && (
                    <button
                      onClick={() => cancelTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                      title="Cancelar"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {task.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Erro:</strong> {task.error}
              </div>
            )}
            
            {task.result && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
                <strong>Resultado:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(task.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileVideo className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa encontrada</p>
            <p className="text-sm">Adicione uma nova tarefa ou ajuste os filtros</p>
          </div>
        )}
      </div>
    </div>
  );
  
  // Renderizar aba de workers
  const renderWorkersTab = () => (
    <div className="space-y-6">
      {/* Controles de workers */}
      <div className="flex gap-4 items-center">
        <button
          onClick={restartWorkers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reiniciar Workers
        </button>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Workers:</label>
          <input
            type="number"
            min="1"
            max="16"
            value={config.maxWorkers}
            onChange={(e) => scaleWorkers(parseInt(e.target.value))}
            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Lista de workers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workers.map(worker => (
          <div
            key={worker.id}
            className={`p-4 border rounded-lg ${
              worker.status === 'busy' ? 'border-blue-500 bg-blue-50' :
              worker.status === 'error' ? 'border-red-500 bg-red-50' :
              'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">{worker.id}</div>
              <div className={`px-2 py-1 text-xs rounded-full ${
                worker.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                worker.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                {worker.status}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tarefas Concluídas:</span>
                <span className="font-medium">{worker.tasksCompleted}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Tempo Médio:</span>
                <span className="font-medium">
                  {formatDuration(worker.averageTaskTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Última Atividade:</span>
                <span className="font-medium">
                  {new Date(worker.lastActivity).toLocaleTimeString()}
                </span>
              </div>
              
              {worker.currentTask && (
                <div className="flex justify-between">
                  <span>Tarefa Atual:</span>
                  <span className="font-medium text-blue-600">
                    {worker.currentTask.slice(-8)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-gray-500">
                Capacidades: {worker.capabilities.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Renderizar aba de performance
  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span className="font-medium">CPU</span>
          </div>
          <div className="text-2xl font-bold">{performanceStatus.cpu.usage.toFixed(1)}%</div>
          <div className={`text-sm ${
            performanceStatus.cpu.status === 'critical' ? 'text-red-600' :
            performanceStatus.cpu.status === 'warning' ? 'text-orange-600' :
            'text-green-600'
          }`}>
            {performanceStatus.cpu.status === 'critical' ? 'Crítico' :
             performanceStatus.cpu.status === 'warning' ? 'Atenção' : 'Normal'}
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-green-600" />
            <span className="font-medium">Memória</span>
          </div>
          <div className="text-2xl font-bold">
            {formatFileSize(performanceStatus.memory.usage)}
          </div>
          <div className={`text-sm ${
            performanceStatus.memory.status === 'critical' ? 'text-red-600' :
            performanceStatus.memory.status === 'warning' ? 'text-orange-600' :
            'text-green-600'
          }`}>
            {performanceStatus.memory.percentage.toFixed(1)}% usado
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Throughput</span>
          </div>
          <div className="text-2xl font-bold">
            {performanceStatus.throughput.current.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">tarefas/min</div>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="font-medium">Eficiência</span>
          </div>
          <div className="text-2xl font-bold">
            {performanceStatus.throughput.efficiency.toFixed(1)}%
          </div>
          <div className={`text-sm ${
            performanceStatus.throughput.status === 'critical' ? 'text-red-600' :
            performanceStatus.throughput.status === 'warning' ? 'text-orange-600' :
            'text-green-600'
          }`}>
            {performanceStatus.throughput.status === 'critical' ? 'Baixa' :
             performanceStatus.throughput.status === 'warning' ? 'Média' : 'Alta'}
          </div>
        </div>
      </div>
      
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Alertas de Performance</h3>
            <button
              onClick={clearAlerts}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Limpar
            </button>
          </div>
          
          <div className="space-y-2">
            {alerts.slice(-5).map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.type === 'memory' ? 'border-red-200 bg-red-50' :
                  alert.type === 'cpu' ? 'border-orange-200 bg-orange-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{alert.message}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Estatísticas detalhadas */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Estatísticas Detalhadas</h3>
          <button
            onClick={() => setShowStatsModal(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver Relatório Completo
          </button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-gray-600">Taxa de Sucesso</div>
            <div className="text-lg font-bold">{stats.efficiency.toFixed(1)}%</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600">Tempo Médio</div>
            <div className="text-lg font-bold">
              {formatDuration(stats.averageProcessingTime)}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600">Fila</div>
            <div className="text-lg font-bold">{queueLength} tarefas</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Renderizar aba de configuração
  const renderConfigTab = () => (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configurações Avançadas
        </button>
        
        <button
          onClick={applyOptimalConfig}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Configuração Otimizada
        </button>
        
        <button
          onClick={resetConfig}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Resetar
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-medium">Configurações de Workers</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Máximo de Workers</label>
            <input
              type="number"
              min="1"
              max="16"
              value={config.maxWorkers}
              onChange={(e) => updateSetting('maxWorkers', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Timeout (ms)</label>
            <input
              type="number"
              min="10000"
              max="600000"
              step="10000"
              value={config.workerTimeout}
              onChange={(e) => updateSetting('workerTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tentativas de Retry</label>
            <input
              type="number"
              min="0"
              max="10"
              value={config.retryAttempts}
              onChange={(e) => updateSetting('retryAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Configurações de Performance</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Limite de Memória ({formatFileSize(config.memoryLimit)})
            </label>
            <input
              type="range"
              min="134217728" // 128MB
              max="2147483648" // 2GB
              step="134217728"
              value={config.memoryLimit}
              onChange={(e) => updateSetting('memoryLimit', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Limite de CPU ({config.cpuThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={config.cpuThreshold}
              onChange={(e) => updateSetting('cpuThreshold', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.enableGPUAcceleration}
                onChange={(e) => updateSetting('enableGPUAcceleration', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Aceleração GPU</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.enableWASM}
                onChange={(e) => updateSetting('enableWASM', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">WebAssembly</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.adaptiveScaling}
                onChange={(e) => updateSetting('adaptiveScaling', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Escalonamento Adaptativo</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.enableProfiling}
                onChange={(e) => updateSetting('enableProfiling', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Profiling de Performance</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Renderizar aba de debug
  const renderDebugTab = () => (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={exportDebugInfo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Debug
        </button>
        
        <button
          onClick={resetStats}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Resetar Estatísticas
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-medium mb-4">Informações do Sistema</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(debugInfo.system || {}, null, 2)}
            </pre>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Estado Atual</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify({
                tasks: debugInfo.tasks?.total || 0,
                workers: debugInfo.workers?.length || 0,
                processing: isProcessing,
                queue: queueLength
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-4">Log de Atividades</h3>
        <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
          <pre className="text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciador de Web Workers
        </h1>
        <p className="text-gray-600">
          Sistema avançado de processamento de vídeo em background
        </p>
      </div>
      
      {/* Estatísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileVideo className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Total de Tarefas</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalTasks}</div>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium">Concluídas</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.completedTasks}</div>
        </div>
        
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="font-medium">Workers Ativos</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.activeWorkers}</div>
        </div>
        
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Fila</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{queueLength}</div>
        </div>
      </div>
      
      {/* Navegação por abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'tasks', label: 'Tarefas', icon: FileVideo },
            { id: 'workers', label: 'Workers', icon: Users },
            { id: 'performance', label: 'Performance', icon: BarChart3 },
            { id: 'config', label: 'Configuração', icon: Settings },
            { id: 'debug', label: 'Debug', icon: Monitor }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Conteúdo das abas */}
      <div className="min-h-96">
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'workers' && renderWorkersTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'debug' && renderDebugTab()}
      </div>
      
      {/* Modal de adicionar tarefa */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Nova Tarefa de Processamento</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Arquivo de Vídeo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Processamento</label>
                <select
                  value={newTaskData.type}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="compress">Compressão</option>
                  <option value="convert">Conversão</option>
                  <option value="extract-frames">Extrair Frames</option>
                  <option value="apply-filter">Aplicar Filtro</option>
                  <option value="merge">Mesclar</option>
                  <option value="trim">Cortar</option>
                  <option value="watermark">Marca d'água</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade</label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              
              {newTaskData.type === 'compress' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Qualidade (0.1 - 1.0)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={newTaskData.options.quality || 0.8}
                    onChange={(e) => setNewTaskData(prev => ({
                      ...prev,
                      options: { ...prev.options, quality: parseFloat(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar Tarefa
              </button>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebWorkerManager;