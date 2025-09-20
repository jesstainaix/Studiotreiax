import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Activity, AlertTriangle, BarChart3, Bell, Download, Upload,
  Filter, Search, RefreshCw, Settings, Wifi, WifiOff, Play, Pause,
  TrendingUp, TrendingDown, Eye, EyeOff, Trash2, Plus, Edit
} from 'lucide-react';

// Interfaces
interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface Alert {
  id: string;
  metricId: string;
  metricName: string;
  type: 'threshold' | 'anomaly' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  threshold?: {
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
  };
}

interface Widget {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'number' | 'status';
  title: string;
  metricIds: string[];
  position: { x: number; y: number; w: number; h: number };
  config: {
    showLegend?: boolean;
    showGrid?: boolean;
    color?: string;
    refreshInterval?: number;
  };
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

interface MetricsConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  maxDataPoints: number;
  enableAlerts: boolean;
  enableWebSocket: boolean;
  retentionDays: number;
}

interface ConnectionStatus {
  connected: boolean;
  lastUpdate: number;
  latency: number;
  reconnectAttempts: number;
}

const RealTimeMetricsManager: React.FC = () => {
  // Estado principal
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<string>('');
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [config, setConfig] = useState<MetricsConfig>({
    autoRefresh: true,
    refreshInterval: 5000,
    maxDataPoints: 100,
    enableAlerts: true,
    enableWebSocket: true,
    retentionDays: 30
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastUpdate: Date.now(),
    latency: 0,
    reconnectAttempts: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Dados simulados para demonstração
  const generateMockMetrics = useCallback((): MetricData[] => {
    const categories = ['performance', 'system', 'user', 'business'];
    const names = {
      performance: ['Response Time', 'Throughput', 'Error Rate', 'CPU Usage'],
      system: ['Memory Usage', 'Disk I/O', 'Network Traffic', 'Active Connections'],
      user: ['Active Users', 'Session Duration', 'Page Views', 'Bounce Rate'],
      business: ['Revenue', 'Conversions', 'Orders', 'Customer Satisfaction']
    };
    
    return categories.flatMap(category => 
      names[category as keyof typeof names].map((name, index) => ({
        id: `${category}-${index}`,
        name,
        value: Math.random() * 100,
        unit: category === 'performance' ? 'ms' : category === 'business' ? '$' : '%',
        timestamp: Date.now(),
        category,
        status: Math.random() > 0.8 ? 'warning' : Math.random() > 0.95 ? 'critical' : 'normal',
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      }))
    );
  }, []);

  const generateMockAlerts = useCallback((): Alert[] => {
    return [
      {
        id: '1',
        metricId: 'performance-0',
        metricName: 'Response Time',
        type: 'threshold',
        severity: 'high',
        message: 'Response time exceeded 500ms threshold',
        timestamp: Date.now() - 300000,
        acknowledged: false,
        threshold: { operator: '>', value: 500 }
      },
      {
        id: '2',
        metricId: 'system-0',
        metricName: 'Memory Usage',
        type: 'threshold',
        severity: 'medium',
        message: 'Memory usage above 80%',
        timestamp: Date.now() - 600000,
        acknowledged: true,
        threshold: { operator: '>', value: 80 }
      }
    ];
  }, []);

  const generateMockDashboards = useCallback((): Dashboard[] => {
    return [
      {
        id: 'default',
        name: 'Dashboard Principal',
        description: 'Visão geral das métricas principais',
        widgets: [],
        isDefault: true,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Métricas de performance do sistema',
        widgets: [],
        isDefault: false,
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now() - 3600000
      }
    ];
  }, []);

  // Inicialização dos dados
  useEffect(() => {
    setMetrics(generateMockMetrics());
    setAlerts(generateMockAlerts());
    setDashboards(generateMockDashboards());
    setActiveDashboard('default');
    
    // Simular conexão WebSocket
    setConnectionStatus(prev => ({ ...prev, connected: true }));
  }, [generateMockMetrics, generateMockAlerts, generateMockDashboards]);

  // Auto-refresh
  useEffect(() => {
    if (!config.autoRefresh) return;
    
    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());
      setConnectionStatus(prev => ({
        ...prev,
        lastUpdate: Date.now(),
        latency: Math.random() * 100
      }));
    }, config.refreshInterval);
    
    return () => clearInterval(interval);
  }, [config.autoRefresh, config.refreshInterval, generateMockMetrics]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMetrics(generateMockMetrics());
    setIsRefreshing(false);
  };

  const handleExportData = () => {
    const data = {
      metrics,
      alerts,
      dashboards,
      config,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'normal': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Métricas filtradas
  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || metric.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Alertas não reconhecidos
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  // Dados para gráficos
  const chartData = metrics.slice(0, 10).map(metric => ({
    name: metric.name.substring(0, 10),
    value: metric.value,
    category: metric.category
  }));

  const timeSeriesData = Array.from({ length: 20 }, (_, i) => ({
    time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString(),
    value: Math.random() * 100
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Métricas em Tempo Real</h1>
          <p className="text-gray-600 mt-1">Monitoramento e análise de métricas do sistema</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Status da Conexão */}
          <div className="flex items-center space-x-2">
            {connectionStatus.connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm ${
              connectionStatus.connected ? 'text-green-600' : 'text-red-600'
            }`}>
              {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
            {connectionStatus.connected && (
              <span className="text-xs text-gray-500">
                ({connectionStatus.latency.toFixed(0)}ms)
              </span>
            )}
          </div>
          
          {/* Controles */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Métricas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{unacknowledgedAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dashboards</p>
                <p className="text-2xl font-bold text-gray-900">{dashboards.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Última Atualização</p>
                <p className="text-sm text-gray-900">
                  {new Date(connectionStatus.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {unacknowledgedAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-800">Alertas Críticos</AlertTitle>
          <AlertDescription className="text-red-700">
            Existem {unacknowledgedAlerts.length} alertas que requerem atenção.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Linha Temporal */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas ao Longo do Tempo</CardTitle>
                <CardDescription>Evolução das métricas principais</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
                <CardDescription>Valores atuais das métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Métricas em Destaque */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas em Destaque</CardTitle>
              <CardDescription>Principais indicadores do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.slice(0, 8).map((metric) => (
                  <div key={metric.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        {metric.value.toFixed(1)}{metric.unit}
                      </span>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Métricas */}
        <TabsContent value="metrics" className="space-y-6">
          {/* Filtros e Busca */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar Métricas</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Digite o nome da métrica..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-48">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="business">Negócio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        {metric.value.toFixed(1)}{metric.unit}
                      </span>
                      <Badge className={getSeverityColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Categoria: {metric.category}</span>
                      <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Alertas</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          </div>
          
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{alert.metricName}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Reconhecido
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-2">{alert.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Tipo: {alert.type}</span>
                        <span>Horário: {new Date(alert.timestamp).toLocaleString()}</span>
                        {alert.threshold && (
                          <span>
                            Limite: {alert.threshold.operator} {alert.threshold.value}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Reconhecer
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Dashboards */}
        <TabsContent value="dashboards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Dashboards</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Dashboard
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{dashboard.name}</h3>
                    {dashboard.isDefault && (
                      <Badge variant="outline">Padrão</Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{dashboard.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Widgets: {dashboard.widgets.length}</div>
                    <div>Criado: {new Date(dashboard.createdAt).toLocaleDateString()}</div>
                    <div>Atualizado: {new Date(dashboard.updatedAt).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Widgets */}
        <TabsContent value="widgets" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Biblioteca de Widgets</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Widget
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['line', 'bar', 'pie', 'gauge', 'number', 'status'].map((type) => (
              <Card key={type} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <BarChart3 className="h-12 w-12 mx-auto text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 capitalize">{type}</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Widget de {type === 'line' ? 'linha' : type === 'bar' ? 'barras' : type === 'pie' ? 'pizza' : type}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Ajuste as configurações de monitoramento e alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refresh">Atualização Automática</Label>
                  <p className="text-sm text-gray-600">Atualizar métricas automaticamente</p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={config.autoRefresh}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoRefresh: checked }))}
                />
              </div>
              
              {/* Refresh Interval */}
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Intervalo de Atualização (ms)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  value={config.refreshInterval}
                  onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                  min="1000"
                  max="60000"
                  step="1000"
                />
              </div>
              
              {/* Max Data Points */}
              <div className="space-y-2">
                <Label htmlFor="max-data-points">Máximo de Pontos de Dados</Label>
                <Input
                  id="max-data-points"
                  type="number"
                  value={config.maxDataPoints}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxDataPoints: parseInt(e.target.value) }))}
                  min="10"
                  max="1000"
                />
              </div>
              
              {/* Enable Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-alerts">Habilitar Alertas</Label>
                  <p className="text-sm text-gray-600">Receber notificações de alertas</p>
                </div>
                <Switch
                  id="enable-alerts"
                  checked={config.enableAlerts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAlerts: checked }))}
                />
              </div>
              
              {/* Enable WebSocket */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-websocket">Conexão WebSocket</Label>
                  <p className="text-sm text-gray-600">Usar WebSocket para atualizações em tempo real</p>
                </div>
                <Switch
                  id="enable-websocket"
                  checked={config.enableWebSocket}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableWebSocket: checked }))}
                />
              </div>
              
              {/* Retention Days */}
              <div className="space-y-2">
                <Label htmlFor="retention-days">Retenção de Dados (dias)</Label>
                <Input
                  id="retention-days"
                  type="number"
                  value={config.retentionDays}
                  onChange={(e) => setConfig(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                  min="1"
                  max="365"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeMetricsManager;