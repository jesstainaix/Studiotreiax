// Dashboard de monitoramento de logs e performance
import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bug,
  Clock,
  Database,
  Download,
  Eye,
  Filter,
  Info,
  MemoryStick,
  Monitor,
  Play,
  Pause,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  User,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import { useLogger } from '../../hooks/useLogger';
import { logger, LogLevel, LogCategory, LogEntry } from '../../utils/logger';

interface FilterState {
  level: LogLevel | 'all';
  category: LogCategory | 'all';
  search: string;
  timeRange: '1h' | '6h' | '24h' | '7d' | 'all';
  userId?: string;
}

interface AlertState {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  acknowledged: boolean;
}

const LoggingDashboard: React.FC = () => {
  const {
    getLogs,
    clearLogs,
    getStats,
    logUserAction,
    logPerformance
  } = useLogger({
    category: 'system',
    componentName: 'LoggingDashboard',
    autoLogMount: true,
    trackPerformance: true
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    level: 'all',
    category: 'all',
    search: '',
    timeRange: '24h'
  });

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar dados em tempo real
  useEffect(() => {
    const updateData = () => {
      const allLogs = getLogs();
      setLogs(allLogs);
      setStats(getStats());
      
      // Simular alertas baseados nos logs
      const recentErrors = allLogs.filter(log => 
        log.level === 'error' && 
        Date.now() - log.timestamp < 300000 // últimos 5 minutos
      );
      
      if (recentErrors.length > 3) {
        const newAlert: AlertState = {
          id: `alert_${Date.now()}`,
          message: `${recentErrors.length} erros detectados nos últimos 5 minutos`,
          severity: 'high',
          timestamp: Date.now(),
          acknowledged: false
        };
        
        setAlerts(prev => {
          const exists = prev.some(alert => 
            alert.message === newAlert.message && 
            Date.now() - alert.timestamp < 300000
          );
          
          if (!exists) {
            return [newAlert, ...prev.slice(0, 9)]; // Manter últimos 10
          }
          return prev;
        });
      }
    };

    updateData();
    
    if (isRealTime) {
      updateIntervalRef.current = setInterval(updateData, 2000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isRealTime, getLogs, getStats]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...logs];

    // Filtro por nível
    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Filtro por categoria
    if (filters.category !== 'all') {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tempo
    if (filters.timeRange !== 'all') {
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = Date.now() - timeRanges[filters.timeRange];
      filtered = filtered.filter(log => log.timestamp > cutoff);
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  // Auto-scroll para novos logs
  useEffect(() => {
    if (isRealTime && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [filteredLogs, isRealTime]);

  // Handlers
  const handleClearLogs = () => {
    clearLogs();
    logUserAction('Logs cleared');
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    logUserAction('Logs exported', { count: filteredLogs.length });
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    logUserAction('Alert acknowledged', { alertId });
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    logUserAction('Alert dismissed', { alertId });
  };

  // Utilitários
  const getLogLevelColor = (level: LogLevel) => {
    const colors = {
      trace: 'text-gray-500 bg-gray-100',
      debug: 'text-blue-600 bg-blue-100',
      info: 'text-green-600 bg-green-100',
      warn: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      fatal: 'text-red-800 bg-red-200'
    };
    return colors[level];
  };

  const getCategoryIcon = (category: LogCategory) => {
    const icons = {
      performance: <Zap className="w-4 h-4" />,
      user: <User className="w-4 h-4" />,
      system: <Monitor className="w-4 h-4" />,
      api: <Wifi className="w-4 h-4" />,
      security: <AlertTriangle className="w-4 h-4" />,
      business: <BarChart3 className="w-4 h-4" />
    };
    return icons[category];
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getAlertSeverityColor = (severity: string) => {
    const colors = {
      low: 'border-blue-200 bg-blue-50 text-blue-800',
      medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      high: 'border-orange-200 bg-orange-50 text-orange-800',
      critical: 'border-red-200 bg-red-50 text-red-800'
    };
    return colors[severity as keyof typeof colors];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Monitoring Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Logs estruturados e alertas de performance
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`p-2 rounded-lg transition-colors ${
              isRealTime 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRealTime ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleExportLogs}
            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleClearLogs}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Alertas Ativos
          </h3>
          <div className="space-y-2">
            {alerts.filter(alert => !alert.acknowledged).map(alert => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-xs opacity-75">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="p-1 hover:bg-black/10 rounded transition-colors"
                      title="Reconhecer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="p-1 hover:bg-black/10 rounded transition-colors"
                      title="Dispensar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Total de Logs
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.total || 0}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Últimas 24h: {stats.last24h || 0}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Bug className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Taxa de Erro
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {(stats.errorRate || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Erros: {(stats.byLevel?.error || 0) + (stats.byLevel?.fatal || 0)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Performance
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.byCategory?.performance || 0}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            Métricas coletadas
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MemoryStick className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Memória Média
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {(stats.averageMemoryUsage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Uso de heap JS
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Ações do Usuário
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {stats.byCategory?.user || 0}
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Interações registradas
          </p>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nível
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="trace">Trace</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                <option value="performance">Performance</option>
                <option value="user">Usuário</option>
                <option value="system">Sistema</option>
                <option value="api">API</option>
                <option value="security">Segurança</option>
                <option value="business">Negócio</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Período
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="1h">Última hora</option>
                <option value="6h">Últimas 6 horas</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="all">Todos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Buscar logs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Logs */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logs ({filteredLogs.length})
            </h3>
            
            {isRealTime && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm">Tempo Real</span>
              </div>
            )}
          </div>
        </div>
        
        <div 
          ref={logsContainerRef}
          className="max-h-96 overflow-y-auto"
        >
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Info className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhum log encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(log.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.duration && (
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            {log.duration.toFixed(2)}ms
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                        {log.message}
                      </p>
                      
                      {log.data && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {JSON.stringify(log.data).substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalhes do Log
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm overflow-x-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoggingDashboard;