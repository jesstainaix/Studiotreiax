// Componente de interface para gerenciamento do dashboard de métricas em tempo real
import React, { useState, useEffect } from 'react';
import {
  useRealtimeDashboard,
  useAutoDashboard,
  useDashboardPerformance,
  useDashboardStats,
  useDashboardConfig,
  useDashboardDebug
} from '../../hooks/useRealtimeDashboard';
import {
  Activity,
  BarChart3,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Play,
  Pause,
  Monitor,
  Gauge,
  PieChart,
  LineChart,
  Database,
  Filter,
  Layout,
  Bell,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Copy,
  Trash2,
  Save,
  Share2,
  Bug,
  Zap,
  Clock,
  Users,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const RealtimeDashboardManager: React.FC = () => {
  // Hooks
  const dashboard = useAutoDashboard({ autoInit: true, enableRealTime: true });
  const performance = useDashboardPerformance();
  const stats = useDashboardStats();
  const config = useDashboardConfig();
  const debug = useDashboardDebug();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'widgets' | 'alerts' | 'layouts' | 'datasources' | 'filters' | 'config' | 'performance' | 'debug'>('overview');
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'status' | 'timestamp'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Funções de demonstração
  const generateDemoMetrics = () => {
    const demoMetrics = [
      {
        name: 'CPU Usage',
        value: Math.random() * 100,
        unit: '%',
        type: 'gauge' as const,
        category: 'System',
        threshold: { warning: 70, critical: 90 }
      },
      {
        name: 'Memory Usage',
        value: Math.random() * 100,
        unit: '%',
        type: 'gauge' as const,
        category: 'System',
        threshold: { warning: 80, critical: 95 }
      },
      {
        name: 'Disk Usage',
        value: Math.random() * 100,
        unit: '%',
        type: 'gauge' as const,
        category: 'Storage',
        threshold: { warning: 85, critical: 95 }
      },
      {
        name: 'Network I/O',
        value: Math.random() * 1000,
        unit: 'MB/s',
        type: 'rate' as const,
        category: 'Network'
      },
      {
        name: 'Active Users',
        value: Math.floor(Math.random() * 1000),
        unit: '',
        type: 'counter' as const,
        category: 'Users'
      },
      {
        name: 'Response Time',
        value: Math.random() * 500 + 100,
        unit: 'ms',
        type: 'histogram' as const,
        category: 'Performance',
        threshold: { warning: 300, critical: 500 }
      },
      {
        name: 'Error Rate',
        value: Math.random() * 5,
        unit: '%',
        type: 'rate' as const,
        category: 'Errors',
        threshold: { warning: 2, critical: 5 }
      },
      {
        name: 'Throughput',
        value: Math.random() * 10000,
        unit: 'req/s',
        type: 'rate' as const,
        category: 'Performance'
      }
    ];
    
    demoMetrics.forEach(metric => {
      dashboard.addMetric(metric);
    });
  };
  
  const generateDemoWidgets = () => {
    const demoWidgets = [
      {
        title: 'System Overview',
        type: 'chart' as const,
        position: { x: 0, y: 0, width: 600, height: 400 },
        config: {
          chartType: 'line' as const,
          metricIds: dashboard.metrics.slice(0, 3).map(m => m.id)
        },
        isVisible: true,
        isMinimized: false
      },
      {
        title: 'Performance Metrics',
        type: 'gauge' as const,
        position: { x: 620, y: 0, width: 300, height: 200 },
        config: {
          metricIds: dashboard.metrics.slice(3, 4).map(m => m.id)
        },
        isVisible: true,
        isMinimized: false
      },
      {
        title: 'User Activity',
        type: 'metric' as const,
        position: { x: 620, y: 220, width: 300, height: 180 },
        config: {
          metricIds: dashboard.metrics.slice(4, 5).map(m => m.id)
        },
        isVisible: true,
        isMinimized: false
      },
      {
        title: 'Error Monitoring',
        type: 'alert' as const,
        position: { x: 0, y: 420, width: 600, height: 200 },
        config: {},
        isVisible: true,
        isMinimized: false
      }
    ];
    
    demoWidgets.forEach(widget => {
      dashboard.addWidget(widget);
    });
  };
  
  const generateDemoAlerts = () => {
    const demoAlerts = [
      {
        title: 'High CPU Usage',
        message: 'CPU usage has exceeded 90% for the last 5 minutes',
        severity: 'critical' as const,
        metricId: dashboard.metrics[0]?.id || '',
        threshold: 90,
        currentValue: 95,
        isActive: true,
        isAcknowledged: false
      },
      {
        title: 'Memory Warning',
        message: 'Memory usage is approaching critical levels',
        severity: 'warning' as const,
        metricId: dashboard.metrics[1]?.id || '',
        threshold: 80,
        currentValue: 85,
        isActive: true,
        isAcknowledged: false
      },
      {
        title: 'Network Connectivity',
        message: 'Network latency has increased significantly',
        severity: 'info' as const,
        metricId: dashboard.metrics[3]?.id || '',
        threshold: 100,
        currentValue: 150,
        isActive: true,
        isAcknowledged: true
      }
    ];
    
    demoAlerts.forEach(alert => {
      dashboard.addAlert(alert);
    });
  };
  
  const generateDemoDataSources = () => {
    const demoDataSources = [
      {
        name: 'Sistema Local',
        type: 'api' as const,
        url: 'http://localhost:3001/metrics',
        refreshInterval: 5000,
        isActive: true,
        status: 'connected' as const,
        config: { timeout: 5000 }
      },
      {
        name: 'Banco de Dados',
        type: 'database' as const,
        url: 'postgresql://localhost:5432/metrics',
        refreshInterval: 10000,
        isActive: true,
        status: 'connected' as const,
        config: { poolSize: 10 }
      },
      {
        name: 'WebSocket Stream',
        type: 'websocket' as const,
        url: 'ws://localhost:8080/metrics',
        refreshInterval: 1000,
        isActive: false,
        status: 'disconnected' as const,
        config: { reconnectInterval: 5000 }
      }
    ];
    
    demoDataSources.forEach(dataSource => {
      dashboard.addDataSource(dataSource);
    });
  };
  
  const generateDemoFilters = () => {
    const demoFilters = [
      {
        name: 'Período',
        type: 'select' as const,
        options: [
          { value: '1h', label: 'Última hora' },
          { value: '24h', label: 'Últimas 24 horas' },
          { value: '7d', label: 'Últimos 7 dias' },
          { value: '30d', label: 'Últimos 30 dias' }
        ],
        value: '1h',
        defaultValue: '1h',
        isGlobal: true,
        affectedWidgets: []
      },
      {
        name: 'Categoria',
        type: 'multiselect' as const,
        options: [
          { value: 'system', label: 'Sistema' },
          { value: 'performance', label: 'Performance' },
          { value: 'users', label: 'Usuários' },
          { value: 'errors', label: 'Erros' }
        ],
        value: ['system', 'performance'],
        defaultValue: ['system', 'performance'],
        isGlobal: false,
        affectedWidgets: []
      },
      {
        name: 'Servidor',
        type: 'select' as const,
        options: [
          { value: 'all', label: 'Todos os servidores' },
          { value: 'web-01', label: 'Web Server 01' },
          { value: 'web-02', label: 'Web Server 02' },
          { value: 'db-01', label: 'Database 01' }
        ],
        value: 'all',
        defaultValue: 'all',
        isGlobal: true,
        affectedWidgets: []
      }
    ];
    
    demoFilters.forEach(filter => {
      dashboard.addFilter(filter);
    });
  };
  
  const generateAllDemoData = () => {
    generateDemoMetrics();
    setTimeout(() => generateDemoWidgets(), 100);
    setTimeout(() => generateDemoAlerts(), 200);
    setTimeout(() => generateDemoDataSources(), 300);
    setTimeout(() => generateDemoFilters(), 400);
  };
  
  // Filtrar e ordenar dados
  const filteredMetrics = dashboard.metrics
    .filter(metric => 
      metric.name.toLowerCase().includes(filterText.toLowerCase()) ||
      metric.category.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  const filteredWidgets = dashboard.widgets
    .filter(widget => 
      widget.title.toLowerCase().includes(filterText.toLowerCase())
    );
  
  const filteredAlerts = dashboard.alerts
    .filter(alert => 
      alert.title.toLowerCase().includes(filterText.toLowerCase()) ||
      alert.message.toLowerCase().includes(filterText.toLowerCase())
    );
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Métricas em Tempo Real</h1>
              <p className="text-gray-600">Sistema avançado de monitoramento e visualização de métricas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generateAllDemoData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              <span>Gerar Dados Demo</span>
            </button>
            
            <button
              onClick={dashboard.refreshData}
              disabled={dashboard.isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${dashboard.isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            
            <button
              onClick={config.toggleAutoRefresh}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                config.config.autoRefresh
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {config.config.autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{config.config.autoRefresh ? 'Pausar' : 'Iniciar'}</span>
            </button>
          </div>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Métricas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMetrics}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Widgets Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWidgets}</p>
              </div>
              <Layout className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-red-600">{stats.activeAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.formatDuration(stats.uptime)}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Monitor },
            { id: 'metrics', label: 'Métricas', icon: BarChart3 },
            { id: 'widgets', label: 'Widgets', icon: Layout },
            { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
            { id: 'layouts', label: 'Layouts', icon: Save },
            { id: 'datasources', label: 'Fontes de Dados', icon: Database },
            { id: 'filters', label: 'Filtros', icon: Filter },
            { id: 'config', label: 'Configuração', icon: Settings },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'debug', label: 'Debug', icon: Bug }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
      
      {/* Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    performance.isHealthy.renderTime ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.avgRenderTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600">Tempo de Renderização</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    performance.isHealthy.fetchTime ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.avgDataFetchTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600">Tempo de Busca</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    performance.isHealthy.memoryUsage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.memoryUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Uso de Memória</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    performance.isHealthy.cpuUsage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.cpuUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Uso de CPU</div>
                </div>
              </div>
            </div>
            
            {/* Recent Alerts */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Recentes</h3>
              <div className="space-y-3">
                {dashboard.alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {alert.severity === 'critical' && <XCircle className="h-5 w-5 text-red-600" />}
                      {alert.severity === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                      {alert.severity === 'error' && <XCircle className="h-5 w-5 text-orange-600" />}
                      {alert.severity === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                      <div>
                        <div className="font-medium text-gray-900">{alert.title}</div>
                        <div className="text-sm text-gray-600">{alert.message}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {dashboard.alerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum alerta encontrado</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Top Metrics */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Principais Métricas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.metrics.slice(0, 6).map(metric => (
                  <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{metric.name}</div>
                      <div className={`text-sm ${dashboard.getStatusColor(metric.status)}`}>
                        {metric.status}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboard.formatNumber(metric.value)}{metric.unit}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                      {metric.trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                      <span className={`text-sm ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {dashboard.metrics.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma métrica encontrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Filtrar métricas..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Nome</option>
                  <option value="value">Valor</option>
                  <option value="status">Status</option>
                  <option value="timestamp">Data</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              
              <button
                onClick={() => setShowMetricModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Métrica</span>
              </button>
            </div>
            
            {/* Metrics List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Métrica</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tendência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMetrics.map(metric => (
                      <tr key={metric.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{dashboard.getMetricIcon(metric.type)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                              <div className="text-sm text-gray-500">{metric.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {dashboard.formatNumber(metric.value)}{metric.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            metric.status === 'normal' ? 'bg-green-100 text-green-800' :
                            metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {metric.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                            {metric.trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                            <span className={`text-sm ${
                              metric.trend === 'up' ? 'text-green-600' :
                              metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => dashboard.createMetricWidget(metric.id, { x: 0, y: 0 })}
                              className="text-blue-600 hover:text-blue-900"
                              title="Criar Widget"
                            >
                              <Layout className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMetric(metric.id);
                                setShowMetricModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => dashboard.removeMetric(metric.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredMetrics.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhuma métrica encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Widgets Tab */}
        {activeTab === 'widgets' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Filtrar widgets..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowWidgetModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Widget</span>
              </button>
            </div>
            
            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWidgets.map(widget => (
                <div key={widget.id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {widget.type === 'chart' && <LineChart className="h-5 w-5 text-blue-600" />}
                      {widget.type === 'gauge' && <Gauge className="h-5 w-5 text-green-600" />}
                      {widget.type === 'metric' && <BarChart3 className="h-5 w-5 text-purple-600" />}
                      {widget.type === 'table' && <Database className="h-5 w-5 text-orange-600" />}
                      {widget.type === 'alert' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      <div>
                        <div className="font-medium text-gray-900">{widget.title}</div>
                        <div className="text-sm text-gray-500">{widget.type}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => dashboard.toggleWidgetVisibility(widget.id)}
                        className={`p-1 rounded ${widget.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                        title={widget.isVisible ? 'Ocultar' : 'Mostrar'}
                      >
                        {widget.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => widget.isMinimized ? dashboard.maximizeWidget(widget.id) : dashboard.minimizeWidget(widget.id)}
                        className="p-1 rounded text-gray-600 hover:text-gray-900"
                        title={widget.isMinimized ? 'Maximizar' : 'Minimizar'}
                      >
                        {widget.isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => dashboard.duplicateWidget(widget.id)}
                        className="p-1 rounded text-gray-600 hover:text-gray-900"
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => dashboard.removeWidget(widget.id)}
                        className="p-1 rounded text-red-600 hover:text-red-900"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Posição:</span> {widget.position.x}, {widget.position.y}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Tamanho:</span> {widget.position.width} × {widget.position.height}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Última atualização:</span> {new Date(widget.lastUpdated).toLocaleString()}
                    </div>
                    {widget.config.metricIds && widget.config.metricIds.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Métricas:</span> {widget.config.metricIds.length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredWidgets.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Layout className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum widget encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Filtrar alertas..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowAlertModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Alerta</span>
              </button>
            </div>
            
            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  alert.severity === 'error' ? 'bg-orange-50 border-orange-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {alert.severity === 'critical' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                      {alert.severity === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                      {alert.severity === 'error' && <XCircle className="h-5 w-5 text-orange-600 mt-0.5" />}
                      {alert.severity === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            alert.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                          {alert.isAcknowledged && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Reconhecido
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Limite: {alert.threshold}</span>
                          <span>Valor atual: {alert.currentValue}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        {alert.acknowledgedBy && (
                          <div className="text-sm text-gray-600 mt-1">
                            Reconhecido por {alert.acknowledgedBy} em {new Date(alert.acknowledgedAt!).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!alert.isAcknowledged && alert.isActive && (
                        <button
                          onClick={() => dashboard.acknowledgeAlert(alert.id, 'current-user')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Reconhecer
                        </button>
                      )}
                      
                      {alert.isActive && (
                        <button
                          onClick={() => dashboard.dismissAlert(alert.id)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Dispensar
                        </button>
                      )}
                      
                      <button
                        onClick={() => dashboard.removeAlert(alert.id)}
                        className="p-1 text-red-600 hover:text-red-900"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum alerta encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Current Performance */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Atual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    performance.isHealthy.renderTime ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.avgRenderTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600">Tempo de Renderização</div>
                  <div className={`text-xs mt-1 ${
                    performance.isHealthy.renderTime ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.isHealthy.renderTime ? 'Saudável' : 'Atenção'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    performance.isHealthy.fetchTime ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.avgDataFetchTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600">Tempo de Busca</div>
                  <div className={`text-xs mt-1 ${
                    performance.isHealthy.fetchTime ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.isHealthy.fetchTime ? 'Saudável' : 'Atenção'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    performance.isHealthy.memoryUsage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.memoryUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Uso de Memória</div>
                  <div className={`text-xs mt-1 ${
                    performance.isHealthy.memoryUsage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.isHealthy.memoryUsage ? 'Saudável' : 'Atenção'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    performance.isHealthy.cpuUsage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.current.cpuUsage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Uso de CPU</div>
                  <div className={`text-xs mt-1 ${
                    performance.isHealthy.cpuUsage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.isHealthy.cpuUsage ? 'Saudável' : 'Atenção'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Average Performance */}
            {performance.average && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Média (Últimos 100 pontos)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {performance.average.renderTime.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">Tempo de Renderização</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {performance.average.fetchTime.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">Tempo de Busca</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {performance.average.memoryUsage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Uso de Memória</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {performance.average.cpuUsage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Uso de CPU</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Performance History */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Performance</h3>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Gráfico de performance seria renderizado aqui</p>
                <p className="text-sm">({performance.history.length} pontos de dados coletados)</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Dashboard</h3>
              
              <div className="space-y-6">
                {/* Auto Refresh */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Atualização Automática</label>
                    <p className="text-sm text-gray-600">Atualizar dados automaticamente</p>
                  </div>
                  <button
                    onClick={config.toggleAutoRefresh}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.config.autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.config.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {/* Refresh Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Intervalo de Atualização (ms)</label>
                  <input
                    type="number"
                    value={config.config.refreshInterval}
                    onChange={(e) => config.setRefreshInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1000"
                    step="1000"
                  />
                </div>
                
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Tema</label>
                  <select
                    value={config.config.theme}
                    onChange={(e) => config.updateConfig({ theme: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
                
                {/* Enable Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Alertas</label>
                    <p className="text-sm text-gray-600">Habilitar sistema de alertas</p>
                  </div>
                  <button
                    onClick={() => config.updateConfig({ enableAlerts: !config.config.enableAlerts })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.config.enableAlerts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.config.enableAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {/* Enable Animations */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Animações</label>
                    <p className="text-sm text-gray-600">Habilitar animações na interface</p>
                  </div>
                  <button
                    onClick={() => config.updateConfig({ enableAnimations: !config.config.enableAnimations })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.config.enableAnimations ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.config.enableAnimations ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {/* Max Data Points */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Máximo de Pontos de Dados</label>
                  <input
                    type="number"
                    value={config.config.maxDataPoints}
                    onChange={(e) => config.updateConfig({ maxDataPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="100"
                    step="100"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      const configStr = config.exportConfig();
                      const blob = new Blob([configStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'dashboard-config.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Exportar</span>
                  </button>
                  
                  <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Importar</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const configStr = event.target?.result as string;
                              config.importConfig(configStr);
                            } catch (error) {
                              console.error('Erro ao importar configuração:', error);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                  
                  <button
                    onClick={config.resetConfig}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Resetar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            {/* Debug Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Debug</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Estado do Dashboard</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(debug.state, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Configuração</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(debug.config, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Debug Actions */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações de Debug</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={debug.clearData}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Limpar Dados</span>
                </button>
                
                <button
                  onClick={debug.resetState}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Resetar Estado</span>
                </button>
                
                <button
                  onClick={() => {
                    const debugInfo = debug.exportDebugInfo();
                    const blob = new Blob([debugInfo], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'dashboard-debug.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar Debug</span>
                </button>
                
                <button
                  onClick={debug.validateData}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Validar Dados</span>
                </button>
                
                <button
                  onClick={debug.simulateError}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Bug className="h-4 w-4" />
                  <span>Simular Erro</span>
                </button>
                
                <button
                  onClick={debug.testPerformance}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  <span>Teste Performance</span>
                </button>
              </div>
            </div>
            
            {/* Debug Logs */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Logs de Debug</h3>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {debug.logs.length > 0 ? (
                  debug.logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`ml-2 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        log.level === 'info' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="ml-2">{log.message}</span>
                      {log.data && (
                        <div className="ml-8 text-gray-400">
                          {JSON.stringify(log.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Nenhum log disponível</div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {debug.logs.length} logs • Última atualização: {new Date().toLocaleTimeString()}
                </div>
                
                <button
                  onClick={debug.clearLogs}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Limpar Logs</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeDashboardManager;