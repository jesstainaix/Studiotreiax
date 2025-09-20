import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  X,
  Zap,
  Eye,
  Trash2,
  Plus,
  Edit,
  Play,
  Pause,
  BarChart3,
  Activity,
  Users,
  Globe,
  Server,
  Lock,
  Wifi,
  WifiOff
} from 'lucide-react';
import useErrorHandling, {
  ErrorInfo,
  ErrorPattern,
  ErrorType,
  ErrorSeverity,
  ErrorHandlingConfig
} from '../../hooks/useErrorHandling';

interface ErrorHandlingManagerProps {
  className?: string;
  onClose?: () => void;
}

const ErrorHandlingManager: React.FC<ErrorHandlingManagerProps> = ({
  className = '',
  onClose
}) => {
  const { state, config, isLoading, error, actions } = useErrorHandling();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ErrorType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ErrorSeverity | 'all'>('all');
  const [filterResolved, setFilterResolved] = useState<'all' | 'resolved' | 'unresolved'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorInfo | null>(null);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState<ErrorPattern | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger a re-render to update relative times
      setSearchTerm(prev => prev);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter errors
  const filteredErrors = useMemo(() => {
    return state.errors.filter(error => {
      const matchesSearch = error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           error.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           error.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || error.type === filterType;
      const matchesSeverity = filterSeverity === 'all' || error.severity === filterSeverity;
      const matchesResolved = filterResolved === 'all' || 
                             (filterResolved === 'resolved' && error.resolved) ||
                             (filterResolved === 'unresolved' && !error.resolved);
      
      return matchesSearch && matchesType && matchesSeverity && matchesResolved;
    });
  }, [state.errors, searchTerm, filterType, filterSeverity, filterResolved]);

  // Status bar component
  const StatusBar = () => (
    <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            state.isInitialized ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <span className="text-gray-600">
            {state.isInitialized ? 'Ativo' : 'Inicializando'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {state.isReporting ? <Wifi className="w-4 h-4 text-blue-500" /> : <WifiOff className="w-4 h-4 text-gray-400" />}
          <span className="text-gray-600">
            {state.isReporting ? 'Reportando' : 'Offline'}
          </span>
        </div>
        
        <div className="text-gray-600">
          {state.errors.length} erros | {state.metrics.unresolvedErrors} não resolvidos
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`p-1 rounded ${
            autoRefresh ? 'text-blue-600 bg-blue-100' : 'text-gray-400'
          }`}
          title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // Filter bar component
  const FilterBar = () => (
    <div className="bg-white border-b px-4 py-3 space-y-3">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar erros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ErrorType | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="javascript">JavaScript</option>
          <option value="network">Rede</option>
          <option value="validation">Validação</option>
          <option value="authentication">Autenticação</option>
          <option value="authorization">Autorização</option>
          <option value="business">Negócio</option>
          <option value="system">Sistema</option>
          <option value="performance">Performance</option>
          <option value="security">Segurança</option>
          <option value="unknown">Desconhecido</option>
        </select>
        
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as ErrorSeverity | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as severidades</option>
          <option value="critical">Crítico</option>
          <option value="high">Alto</option>
          <option value="medium">Médio</option>
          <option value="low">Baixo</option>
          <option value="info">Info</option>
        </select>
        
        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value as 'all' | 'resolved' | 'unresolved')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os status</option>
          <option value="unresolved">Não resolvidos</option>
          <option value="resolved">Resolvidos</option>
        </select>
      </div>
    </div>
  );

  // Dashboard tab
  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Erros</p>
              <p className="text-2xl font-bold text-gray-900">{state.metrics.totalErrors}</p>
            </div>
            <Bug className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Não Resolvidos</p>
              <p className="text-2xl font-bold text-red-600">{state.metrics.unresolvedErrors}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Erro/h</p>
              <p className="text-2xl font-bold text-orange-600">{state.metrics.errorRate}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{state.metrics.criticalErrors}</p>
            </div>
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Trends */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Tendência de Erros (24h)
          </h3>
          <div className="h-64 flex items-end space-x-2">
            {state.metrics.errorTrends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((trend.count / Math.max(...state.metrics.errorTrends.map(t => t.count))) * 200, 4)}px`
                  }}
                  title={`${trend.count} erros às ${trend.timestamp.getHours()}:00`}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {trend.timestamp.getHours()}h
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Error Types */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Principais Tipos de Erro
          </h3>
          <div className="space-y-3">
            {state.metrics.topErrorTypes.map((errorType, index) => (
              <div key={errorType.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' :
                    index === 2 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium capitalize">{errorType.type}</span>
                </div>
                <span className="text-sm text-gray-600">{errorType.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Erros Recentes
          </h3>
        </div>
        <div className="divide-y">
          {state.errors.slice(0, 5).map((error) => (
            <div key={error.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getSeverityColor(error.severity)
                    }`}>
                      {error.severity}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{error.type}</span>
                    <span className="text-xs text-gray-500">{error.source}</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{error.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(error.timestamp)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {error.resolved ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <button
                    onClick={() => setSelectedError(error)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Errors tab
  const renderErrors = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lista de Erros</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={actions.resolveAllErrors}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Resolver Todos
            </button>
            <button
              onClick={actions.clearErrors}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Limpar Todos
            </button>
          </div>
        </div>
        
        <div className="divide-y max-h-96 overflow-y-auto">
          {filteredErrors.map((error) => (
            <div key={error.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getSeverityColor(error.severity)
                    }`}>
                      {error.severity}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                      {error.type}
                    </span>
                    <span className="text-xs text-gray-500">{error.source}</span>
                    {error.retryCount > 0 && (
                      <span className="text-xs text-orange-600">
                        Tentativas: {error.retryCount}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-1">{error.message}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatRelativeTime(error.timestamp)}</span>
                    <span>ID: {error.id}</span>
                    {error.context && (
                      <span>Contexto: {Object.keys(error.context).length} campos</span>
                    )}
                  </div>
                  
                  {error.tags.length > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      {error.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {error.resolved ? (
                    <CheckCircle className="w-5 h-5 text-green-500" title="Resolvido" />
                  ) : (
                    <button
                      onClick={() => actions.resolveError(error.id)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Marcar como resolvido"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedError(error)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Ver detalhes"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredErrors.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Bug className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum erro encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Patterns tab
  const renderPatterns = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Padrões de Erro</h3>
          <button
            onClick={() => {
              setEditingPattern(null);
              setShowPatternModal(true);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Padrão</span>
          </button>
        </div>
        
        <div className="divide-y">
          {state.patterns.map((pattern) => (
            <div key={pattern.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{pattern.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      pattern.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {pattern.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getSeverityColor(pattern.severity)
                    }`}>
                      {pattern.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Padrão: <code className="bg-gray-100 px-1 rounded">{pattern.pattern.source}</code>
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="capitalize">Tipo: {pattern.type}</span>
                    {pattern.autoResolve && <span>Auto-resolve</span>}
                    {pattern.notification && <span>Notificação</span>}
                    {pattern.retryStrategy && (
                      <span>Retry: {pattern.retryStrategy.maxAttempts}x</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingPattern(pattern);
                      setShowPatternModal(true);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => actions.removePattern(pattern.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {state.patterns.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum padrão configurado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Analytics tab
  const renderAnalytics = () => (
    <div className="p-6 space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Taxa de Resolução</h4>
          <div className="text-2xl font-bold text-green-600">
            {state.metrics.totalErrors > 0 
              ? Math.round((state.metrics.resolvedErrors / state.metrics.totalErrors) * 100)
              : 0}%
          </div>
          <p className="text-sm text-gray-500">
            {state.metrics.resolvedErrors} de {state.metrics.totalErrors} resolvidos
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Tempo Médio de Resolução</h4>
          <div className="text-2xl font-bold text-blue-600">
            {formatDuration(state.metrics.averageResolutionTime)}
          </div>
          <p className="text-sm text-gray-500">Tempo médio para resolver</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Erros por Hora</h4>
          <div className="text-2xl font-bold text-orange-600">
            {state.metrics.errorRate}
          </div>
          <p className="text-sm text-gray-500">Última hora</p>
        </div>
      </div>

      {/* Error Sources */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Erros por Fonte
        </h3>
        <div className="space-y-3">
          {state.metrics.errorsBySource.map((source, index) => (
            <div key={source.source} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-red-500' :
                  index === 1 ? 'bg-orange-500' :
                  index === 2 ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">{source.source}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(source.count / Math.max(...state.metrics.errorsBySource.map(s => s.count))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{source.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retry Queue */}
      {state.retryQueue.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Fila de Retry ({state.retryQueue.length})
          </h3>
          <div className="space-y-2">
            {state.retryQueue.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{item.error.message}</p>
                  <p className="text-xs text-gray-500">
                    Tentativa {item.attempt} - Próxima em {formatRelativeTime(item.nextRetry)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  getSeverityColor(item.error.severity)
                }`}>
                  {item.error.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Settings tab
  const renderSettings = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Configurações</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Editar
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
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
                a.download = `error-handling-config-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Funcionalidades</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Logging</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    config.enableLogging ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {config.enableLogging ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reporting</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    config.enableReporting ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {config.enableReporting ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Retry</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    config.enableRetry ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {config.enableRetry ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    config.enableNotifications ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {config.enableNotifications ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Limites</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Máx. erros em memória</span>
                  <span className="text-sm text-gray-600">{config.maxErrorsInMemory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Threshold de notificação</span>
                  <span className="text-sm text-gray-600">{config.notificationThreshold}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timeout auto-resolve</span>
                  <span className="text-sm text-gray-600">{formatDuration(config.autoResolveTimeout)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Máx. tentativas retry</span>
                  <span className="text-sm text-gray-600">{config.defaultRetryStrategy.maxAttempts}</span>
                </div>
              </div>
            </div>
          </div>
          
          {config.reportingEndpoint && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reporting</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  Endpoint: <code className="bg-white px-1 rounded">{config.reportingEndpoint}</code>
                </p>
                {config.reportingApiKey && (
                  <p className="text-sm text-gray-600 mt-1">
                    API Key: <code className="bg-white px-1 rounded">***{config.reportingApiKey.slice(-4)}</code>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper functions
  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      case 'info':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora';
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Error details modal
  const ErrorDetailsModal = () => {
    if (!selectedError) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Detalhes do Erro</h3>
            <button
              onClick={() => setSelectedError(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">ID:</span>
                    <code className="text-sm bg-white px-2 py-1 rounded">{selectedError.id}</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Tipo:</span>
                    <span className="text-sm capitalize">{selectedError.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Severidade:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getSeverityColor(selectedError.severity)
                    }`}>
                      {selectedError.severity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Fonte:</span>
                    <span className="text-sm">{selectedError.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Timestamp:</span>
                    <span className="text-sm">{selectedError.timestamp.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedError.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedError.resolved ? 'Resolvido' : 'Não resolvido'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mensagem</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">{selectedError.message}</p>
                </div>
              </div>
              
              {selectedError.stack && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Stack Trace</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">{selectedError.stack}</pre>
                  </div>
                </div>
              )}
              
              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contexto</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedError.context, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedError.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedError.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Metadados</h4>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Session ID:</span>
                    <code className="text-sm bg-white px-2 py-1 rounded">{selectedError.sessionId}</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">URL:</span>
                    <span className="text-sm break-all">{selectedError.url}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">User Agent:</span>
                    <span className="text-sm break-all">{selectedError.userAgent}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Tentativas de Retry:</span>
                    <span className="text-sm">{selectedError.retryCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t flex items-center justify-end space-x-2">
            {!selectedError.resolved && (
              <button
                onClick={() => {
                  actions.resolveError(selectedError.id);
                  setSelectedError(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Marcar como Resolvido
              </button>
            )}
            <button
              onClick={() => setSelectedError(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Import modal
  const ImportModal = () => {
    if (!showImportModal) return null;

    const handleImport = () => {
      try {
        actions.importData(importData);
        setShowImportModal(false);
        setImportData('');
      } catch (error) {
        alert('Erro ao importar dados: ' + (error instanceof Error ? error.message : 'Formato inválido'));
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Importar Configuração</h3>
            <button
              onClick={() => setShowImportModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4">
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Cole aqui os dados JSON exportados..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          
          <div className="p-4 border-t flex items-center justify-end space-x-2">
            <button
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Importar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Inicializando sistema de tratamento de erros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        <div className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={actions.clearError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <StatusBar />
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'errors', label: 'Erros', icon: Bug },
            { id: 'patterns', label: 'Padrões', icon: Filter },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
      
      {/* Filter bar for errors tab */}
      {activeTab === 'errors' && <FilterBar />}
      
      {/* Tab content */}
      <div className="min-h-[600px]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'errors' && renderErrors()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
      </div>
      
      {/* Modals */}
      <ErrorDetailsModal />
      <ImportModal />
    </div>
  );
};

export default ErrorHandlingManager;