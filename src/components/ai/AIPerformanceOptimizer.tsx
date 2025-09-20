import { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Clock, 
  TrendingUp, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3
} from 'lucide-react';
import { 
  useAIPerformanceOptimization, 
  usePerformanceMonitor,
  PerformanceMetrics,
  OptimizationSettings
} from '../../services/aiPerformanceOptimizationService';

interface AIPerformanceOptimizerProps {
  videoId?: string;
  onOptimizationComplete?: (report: any) => void;
}

// Componente para métricas em tempo real
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
}> = ({ title, value, unit, icon, status = 'good', trend }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      case 'stable': return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${getStatusColor()} bg-opacity-10`}>
          {icon}
        </div>
        {getTrendIcon()}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">{title}</p>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

// Componente para gráfico de performance
const PerformanceChart: React.FC<{
  metrics: PerformanceMetrics;
}> = ({ metrics }) => {
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, metrics].slice(-20); // Manter últimos 20 pontos
      return newHistory;
    });
  }, [metrics]);

  const maxValue = Math.max(...history.map(h => Math.max(h.memoryUsage, h.cacheHitRate, h.throughput)));

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance em Tempo Real</h3>
        <BarChart3 className="w-5 h-5 text-gray-500" />
      </div>
      
      <div className="h-32 flex items-end space-x-1">
        {history.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center space-y-1">
            <div 
              className="w-full bg-blue-500 rounded-t"
              style={{ height: `${(point.memoryUsage / maxValue) * 100}%` }}
              title={`Memória: ${point.memoryUsage.toFixed(1)}%`}
            />
            <div 
              className="w-full bg-green-500"
              style={{ height: `${(point.cacheHitRate / maxValue) * 100}%` }}
              title={`Cache Hit: ${point.cacheHitRate.toFixed(1)}%`}
            />
            <div 
              className="w-full bg-purple-500 rounded-b"
              style={{ height: `${(point.throughput / maxValue) * 100}%` }}
              title={`Throughput: ${point.throughput.toFixed(1)}`}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Memória</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Cache Hit</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-500 rounded" />
          <span>Throughput</span>
        </div>
      </div>
    </div>
  );
};

// Componente para fila de tarefas
const TaskQueue: React.FC = () => {
  const { taskQueue, activeWorkers, cancelTask, retryTask } = useAIPerformanceOptimization();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transcription': return <Cpu className="w-4 h-4" />;
      case 'analysis': return <Activity className="w-4 h-4" />;
      case 'highlight': return <Zap className="w-4 h-4" />;
      case 'categorization': return <BarChart3 className="w-4 h-4" />;
      case 'thumbnail': return <HardDrive className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Fila de Processamento</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{taskQueue.length} pendentes</span>
          <span>•</span>
          <span>{activeWorkers.size} ativas</span>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {/* Tarefas ativas */}
        {Array.from(activeWorkers.values()).map(task => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="text-blue-600">
                {getTypeIcon(task.type)}
              </div>
              <div>
                <p className="font-medium text-gray-900 capitalize">{task.type}</p>
                <p className="text-sm text-gray-500">Processando...</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        ))}

        {/* Tarefas pendentes */}
        {taskQueue.slice(0, 5).map(task => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="text-gray-600">
                {getTypeIcon(task.type)}
              </div>
              <div>
                <p className="font-medium text-gray-900 capitalize">{task.type}</p>
                <p className="text-sm text-gray-500">
                  Criada há {Math.round((Date.now() - task.createdAt) / 1000)}s
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <button
                onClick={() => cancelTask(task.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Cancelar tarefa"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {taskQueue.length === 0 && activeWorkers.size === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma tarefa na fila</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para configurações de otimização
const OptimizationSettingsComponent: React.FC<{
  settings: OptimizationSettings;
  onSettingsChange: (settings: Partial<OptimizationSettings>) => void;
}> = ({ settings, onSettingsChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Configurações de Otimização</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamanho Máximo do Cache (MB)
              </label>
              <input
                type="number"
                value={settings.maxCacheSize}
                onChange={(e) => onSettingsChange({ maxCacheSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="10"
                max="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Workers
              </label>
              <input
                type="number"
                value={settings.maxWorkers}
                onChange={(e) => onSettingsChange({ maxWorkers: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="8"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamanho do Lote
              </label>
              <input
                type="number"
                value={settings.batchSize}
                onChange={(e) => onSettingsChange({ batchSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limite de Memória (%)
              </label>
              <input
                type="number"
                value={settings.memoryThreshold}
                onChange={(e) => onSettingsChange({ memoryThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="50"
                max="95"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Precarregamento Automático</span>
              <button
                onClick={() => onSettingsChange({ enablePreloading: !settings.enablePreloading })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enablePreloading ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enablePreloading ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Compressão de Dados</span>
              <button
                onClick={() => onSettingsChange({ enableCompression: !settings.enableCompression })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableCompression ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableCompression ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Limpeza Automática</span>
              <button
                onClick={() => onSettingsChange({ autoCleanup: !settings.autoCleanup })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoCleanup ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoCleanup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const AIPerformanceOptimizer: React.FC<AIPerformanceOptimizerProps> = ({
  videoId,
  onOptimizationComplete
}) => {
  const {
    settings,
    isOptimizing,
    updateSettings,
    optimizePerformance,
    getPerformanceReport,
    getCacheStats
  } = useAIPerformanceOptimization();
  
  const { metrics, report, isHealthy } = usePerformanceMonitor();
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'settings'>('overview');
  const [autoOptimize, setAutoOptimize] = useState(false);

  // Auto-otimização
  useEffect(() => {
    if (!autoOptimize) return;

    const interval = setInterval(async () => {
      if (!isHealthy && !isOptimizing) {
        await optimizePerformance();
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [autoOptimize, isHealthy, isOptimizing, optimizePerformance]);

  const handleOptimize = async () => {
    await optimizePerformance();
    const newReport = getPerformanceReport();
    onOptimizationComplete?.(newReport);
  };

  const getHealthStatus = () => {
    if (isHealthy) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Sistema Saudável',
        color: 'text-green-700'
      };
    } else if (metrics.memoryUsage > 90) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        text: 'Memória Crítica',
        color: 'text-red-700'
      };
    } else {
      return {
        icon: <Info className="w-5 h-5 text-yellow-500" />,
        text: 'Atenção Necessária',
        color: 'text-yellow-700'
      };
    }
  };

  const healthStatus = getHealthStatus();
  const cacheStats = getCacheStats();

  return (
    <div className="space-y-6">
      {/* Header com status geral */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Otimização de Performance</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${healthStatus.color}`}>
              {healthStatus.icon}
              <span className="font-medium">{healthStatus.text}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto-otimização</span>
              <button
                onClick={() => setAutoOptimize(!autoOptimize)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoOptimize ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoOptimize ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isOptimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Otimizando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Otimizar Agora</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Activity },
            { id: 'queue', label: 'Fila de Tarefas', icon: Clock },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Uso de Memória"
              value={metrics.memoryUsage.toFixed(1)}
              unit="%"
              icon={<Cpu className="w-5 h-5" />}
              status={metrics.memoryUsage > 80 ? 'error' : metrics.memoryUsage > 60 ? 'warning' : 'good'}
            />
            
            <MetricCard
              title="Taxa de Cache Hit"
              value={metrics.cacheHitRate.toFixed(1)}
              unit="%"
              icon={<HardDrive className="w-5 h-5" />}
              status={metrics.cacheHitRate > 80 ? 'good' : metrics.cacheHitRate > 60 ? 'warning' : 'error'}
            />
            
            <MetricCard
              title="Throughput"
              value={metrics.throughput.toFixed(1)}
              unit="ops/s"
              icon={<TrendingUp className="w-5 h-5" />}
              status={metrics.throughput > 10 ? 'good' : metrics.throughput > 5 ? 'warning' : 'error'}
            />
            
            <MetricCard
              title="Tempo de Resposta"
              value={metrics.averageResponseTime.toFixed(0)}
              unit="ms"
              icon={<Clock className="w-5 h-5" />}
              status={metrics.averageResponseTime < 1000 ? 'good' : metrics.averageResponseTime < 2000 ? 'warning' : 'error'}
            />
          </div>

          {/* Gráfico de performance */}
          <PerformanceChart metrics={metrics} />

          {/* Estatísticas do cache */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas do Cache</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{cacheStats.entries}</p>
                <p className="text-sm text-gray-600">Entradas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {(cacheStats.size / 1024 / 1024).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">MB Utilizados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {cacheStats.hitRate.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">% Hit Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queue' && <TaskQueue />}

      {activeTab === 'settings' && (
        <OptimizationSettingsComponent
          settings={settings}
          onSettingsChange={updateSettings}
        />
      )}
    </div>
  );
};

export default AIPerformanceOptimizer;
export { MetricCard, PerformanceChart, TaskQueue, OptimizationSettingsComponent as OptimizationSettings };