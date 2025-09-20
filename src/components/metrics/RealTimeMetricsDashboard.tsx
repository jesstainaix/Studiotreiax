import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Database,
  Globe,
  LineChart,
  Monitor,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useWebSocketMetrics, MetricData, AlertData } from '../../utils/websocketMetrics';

interface RealTimeMetricsDashboardProps {
  className?: string;
}

interface MetricSummary {
  name: string;
  current: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: string;
  icon: React.ReactNode;
  color: string;
}

interface ChartDataPoint {
  timestamp: number;
  time: string;
  [key: string]: number | string;
}

const RealTimeMetricsDashboard: React.FC<RealTimeMetricsDashboardProps> = ({ className }) => {
  const {
    isConnected,
    bufferedCount,
    alerts,
    subscribe,
    unsubscribe,
    sendMetric,
    getHistoricalData,
    acknowledgeAlert,
    clearAlerts,
    connect,
    disconnect
  } = useWebSocketMetrics();

  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'performance' | 'user' | 'system' | 'business'>('all');
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Mock real-time metrics for demonstration
  const generateMockMetric = useCallback(() => {
    const categories = ['performance', 'user', 'system', 'business'] as const;
    const metricNames = {
      performance: ['response_time', 'cpu_usage', 'memory_usage', 'disk_io'],
      user: ['active_users', 'page_views', 'session_duration', 'bounce_rate'],
      system: ['error_rate', 'uptime', 'throughput', 'latency'],
      business: ['conversion_rate', 'revenue', 'orders', 'retention']
    };

    const category = categories[Math.floor(Math.random() * categories.length)];
    const names = metricNames[category];
    const name = names[Math.floor(Math.random() * names.length)];
    
    const baseValues = {
      response_time: 150,
      cpu_usage: 45,
      memory_usage: 60,
      disk_io: 25,
      active_users: 1250,
      page_views: 5000,
      session_duration: 180,
      bounce_rate: 35,
      error_rate: 2,
      uptime: 99.9,
      throughput: 850,
      latency: 45,
      conversion_rate: 3.2,
      revenue: 15000,
      orders: 125,
      retention: 78
    };

    const units = {
      response_time: 'ms',
      cpu_usage: '%',
      memory_usage: '%',
      disk_io: 'MB/s',
      active_users: 'users',
      page_views: 'views',
      session_duration: 's',
      bounce_rate: '%',
      error_rate: '%',
      uptime: '%',
      throughput: 'req/s',
      latency: 'ms',
      conversion_rate: '%',
      revenue: 'USD',
      orders: 'orders',
      retention: '%'
    };

    const baseValue = baseValues[name as keyof typeof baseValues] || 100;
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    const value = Math.max(0, baseValue * (1 + variation));

    return {
      name,
      value: Math.round(value * 100) / 100,
      unit: units[name as keyof typeof units] || 'units',
      category,
      tags: {
        source: 'dashboard',
        environment: 'production'
      }
    };
  }, []);

  // Subscribe to metrics on mount
  useEffect(() => {
    const metricsToSubscribe = [
      'response_time', 'cpu_usage', 'memory_usage', 'active_users',
      'page_views', 'error_rate', 'throughput', 'conversion_rate'
    ];

    const subscriptionId = subscribe({
      metrics: metricsToSubscribe,
      callback: (data: MetricData[]) => {
        setMetrics(prev => {
          const newMetrics = [...prev, ...data];
          // Keep only last 1000 metrics
          return newMetrics.slice(-1000);
        });
      },
      filters: selectedCategory !== 'all' ? { category: [selectedCategory] } : undefined
    });

    setSubscriptionIds(prev => [...prev, subscriptionId]);

    return () => {
      unsubscribe(subscriptionId);
      setSubscriptionIds(prev => prev.filter(id => id !== subscriptionId));
    };
  }, [subscribe, unsubscribe, selectedCategory]);

  // Generate mock data periodically
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (isConnected) {
        const mockMetric = generateMockMetric();
        sendMetric(mockMetric);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isConnected, sendMetric, generateMockMetric]);

  // Update chart data when metrics change
  useEffect(() => {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const timeRange = timeRanges[selectedTimeRange];
    const filteredMetrics = metrics.filter(m => now - m.timestamp <= timeRange);

    // Group metrics by time intervals
    const intervalSize = timeRange / 50; // 50 data points
    const groupedData = new Map<number, { [key: string]: number[] }>();

    filteredMetrics.forEach(metric => {
      const intervalStart = Math.floor(metric.timestamp / intervalSize) * intervalSize;
      
      if (!groupedData.has(intervalStart)) {
        groupedData.set(intervalStart, {});
      }
      
      const group = groupedData.get(intervalStart)!;
      if (!group[metric.name]) {
        group[metric.name] = [];
      }
      group[metric.name].push(metric.value);
    });

    // Convert to chart data
    const chartPoints: ChartDataPoint[] = Array.from(groupedData.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, values]) => {
        const point: ChartDataPoint = {
          timestamp,
          time: new Date(timestamp).toLocaleTimeString()
        };

        Object.entries(values).forEach(([metricName, metricValues]) => {
          // Calculate average for the interval
          point[metricName] = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
        });

        return point;
      });

    setChartData(chartPoints);
  }, [metrics, selectedTimeRange]);

  const getMetricSummaries = (): MetricSummary[] => {
    const summaries: MetricSummary[] = [];
    const metricGroups = new Map<string, MetricData[]>();

    // Group metrics by name
    metrics.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric);
    });

    metricGroups.forEach((metricList, name) => {
      if (metricList.length < 2) return;

      const sorted = metricList.sort((a, b) => b.timestamp - a.timestamp);
      const current = sorted[0];
      const previous = sorted[1];
      
      const change = current.value - previous.value;
      const trend = Math.abs(change) < 0.01 ? 'stable' : change > 0 ? 'up' : 'down';

      const icons = {
        response_time: <Clock className="h-4 w-4" />,
        cpu_usage: <Monitor className="h-4 w-4" />,
        memory_usage: <Database className="h-4 w-4" />,
        active_users: <Users className="h-4 w-4" />,
        page_views: <Globe className="h-4 w-4" />,
        error_rate: <AlertTriangle className="h-4 w-4" />,
        throughput: <Zap className="h-4 w-4" />,
        conversion_rate: <TrendingUp className="h-4 w-4" />
      };

      const colors = {
        performance: 'text-blue-500',
        user: 'text-green-500',
        system: 'text-orange-500',
        business: 'text-purple-500'
      };

      summaries.push({
        name,
        current: current.value,
        previous: previous.value,
        unit: current.unit,
        trend,
        category: current.category,
        icon: icons[name as keyof typeof icons] || <Activity className="h-4 w-4" />,
        color: colors[current.category as keyof typeof colors] || 'text-gray-500'
      });
    });

    return summaries.slice(0, 8); // Show top 8 metrics
  };

  const handleLoadHistoricalData = async () => {
    setIsLoading(true);
    try {
      const now = Date.now();
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };

      const historicalData = await getHistoricalData(
        ['response_time', 'cpu_usage', 'memory_usage', 'active_users'],
        { start: now - timeRanges[selectedTimeRange], end: now },
        'avg'
      );

      setMetrics(prev => {
        const combined = [...prev, ...historicalData];
        // Remove duplicates and sort by timestamp
        const unique = combined.filter((metric, index, arr) => 
          arr.findIndex(m => m.id === metric.id) === index
        ).sort((a, b) => a.timestamp - b.timestamp);
        
        return unique.slice(-1000);
      });

      toast.success('Dados históricos carregados com sucesso!');
    } catch (error) {
      toast.error('Falha ao carregar dados históricos');
      console.error('Failed to load historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert(alertId);
    toast.success('Alerta confirmado');
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'USD') {
      return `$${value.toLocaleString()}`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const metricSummaries = getMetricSummaries();
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {bufferedCount > 0 && (
            <Badge variant="secondary">
              {bufferedCount} métricas em buffer
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoRefresh ? () => setAutoRefresh(false) : () => setAutoRefresh(true)}
          >
            {autoRefresh ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {autoRefresh ? 'Pausar' : 'Retomar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={isConnected ? disconnect : connect}
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{unacknowledgedAlerts.length} alerta(s) não confirmado(s)</span>
            <Button size="sm" variant="outline" onClick={clearAlerts}>
              Limpar Todos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricSummaries.map((metric, index) => (
          <Card key={metric.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                  {metric.icon}
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-muted-foreground">
                    {((metric.current - metric.previous) / metric.previous * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">
                  {formatValue(metric.current, metric.unit)}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {metric.name.replace('_', ' ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="charts" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="1h">Última hora</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">Todas categorias</option>
              <option value="performance">Performance</option>
              <option value="user">Usuário</option>
              <option value="system">Sistema</option>
              <option value="business">Negócio</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadHistoricalData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Tendências Temporais</span>
                </CardTitle>
                <CardDescription>
                  Evolução das métricas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    {['response_time', 'cpu_usage', 'memory_usage'].map((metric, index) => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={chartColors[index]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Métricas de Usuário</span>
                </CardTitle>
                <CardDescription>
                  Atividade e engajamento dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    {['active_users', 'page_views'].map((metric, index) => (
                      <Area
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stackId="1"
                        stroke={chartColors[index + 3]}
                        fill={chartColors[index + 3]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Alertas Ativos</span>
                <Badge variant="secondary">{alerts.length}</Badge>
              </CardTitle>
              <CardDescription>
                Alertas e notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 border rounded-lg ${
                        alert.acknowledged ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                alert.severity === 'critical'
                                  ? 'destructive'
                                  : alert.severity === 'high'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {alert.severity}
                            </Badge>
                            <span className="font-medium">{alert.metric}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {alert.acknowledged ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum alerta ativo</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalhadas</CardTitle>
              <CardDescription>
                Lista completa de todas as métricas coletadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {metrics.slice(-50).reverse().map((metric, index) => (
                    <div key={`${metric.id}-${index}`} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{metric.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {metric.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-mono">
                          {formatValue(metric.value, metric.unit)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {metrics.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma métrica disponível</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Monitoramento</CardTitle>
              <CardDescription>
                Configure como as métricas são coletadas e exibidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Atualização Automática</p>
                  <p className="text-sm text-muted-foreground">
                    Atualizar métricas automaticamente
                  </p>
                </div>
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Ativo' : 'Inativo'}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Intervalo de Atualização</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!autoRefresh}
                >
                  <option value={1000}>1 segundo</option>
                  <option value={5000}>5 segundos</option>
                  <option value={10000}>10 segundos</option>
                  <option value={30000}>30 segundos</option>
                  <option value={60000}>1 minuto</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status da Conexão</p>
                  <p className="text-sm text-muted-foreground">
                    WebSocket: {isConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeMetricsDashboard;