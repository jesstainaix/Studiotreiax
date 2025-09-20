import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
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
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Network,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle
} from 'lucide-react';
import {
  performanceMonitor,
  startMonitoring,
  stopMonitoring,
  getAllMetrics,
  getStatistics,
  type PerformanceMetric,
  type PipelineMetrics,
  type AlertRule
} from '@/services/performance-monitoring';

interface DashboardProps {
  className?: string;
}

interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface AlertItem {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metric?: PerformanceMetric;
}

const PerformanceMonitorDashboard: React.FC<DashboardProps> = ({ className }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [pipelines, setPipelines] = useState<Map<string, PipelineMetrics>>(new Map());
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    errorRate: 0
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const alertTimeoutRef = useRef<NodeJS.Timeout>();

  // Configurar listeners do monitor
  useEffect(() => {
    const handleMetricRecorded = (metric: PerformanceMetric) => {
      setMetrics(prev => [metric, ...prev.slice(0, 999)]); // Manter últimas 1000 métricas
    };

    const handlePipelineStarted = (pipeline: PipelineMetrics) => {
      setPipelines(prev => new Map(prev.set(pipeline.pipelineId, pipeline)));
    };

    const handlePipelineCompleted = (pipeline: PipelineMetrics) => {
      setPipelines(prev => new Map(prev.set(pipeline.pipelineId, pipeline)));
    };

    const handleAlertTriggered = ({ rule, metric }: { rule: AlertRule; metric: PerformanceMetric }) => {
      const alert: AlertItem = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `${rule.name}: ${metric.name} = ${metric.value} ${metric.unit}`,
        severity: rule.severity,
        timestamp: Date.now(),
        metric
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Manter últimos 50 alertas
      
      // Auto-remover alerta após 30 segundos
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 30000);
    };

    performanceMonitor.on('metric:recorded', handleMetricRecorded);
    performanceMonitor.on('pipeline:started', handlePipelineStarted);
    performanceMonitor.on('pipeline:completed', handlePipelineCompleted);
    performanceMonitor.on('alert:triggered', handleAlertTriggered);

    return () => {
      performanceMonitor.off('metric:recorded', handleMetricRecorded);
      performanceMonitor.off('pipeline:started', handlePipelineStarted);
      performanceMonitor.off('pipeline:completed', handlePipelineCompleted);
      performanceMonitor.off('alert:triggered', handleAlertTriggered);
    };
  }, []);

  // Configurar refresh automático
  useEffect(() => {
    if (isMonitoring && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isMonitoring, refreshInterval]);

  const handleStartMonitoring = () => {
    startMonitoring();
    setIsMonitoring(true);
    refreshData();
  };

  const handleStopMonitoring = () => {
    stopMonitoring();
    setIsMonitoring(false);
  };

  const refreshData = () => {
    const timeRange = getTimeRange(selectedTimeRange);
    const allMetrics = getAllMetrics(undefined, timeRange);
    setMetrics(allMetrics);
    
    // Atualizar estatísticas do sistema
    const memoryStats = getStatistics('system_memory_usage', timeRange);
    const cpuStats = getStatistics('system_cpu_usage', timeRange);
    const errorStats = getStatistics('error_occurred', timeRange);
    
    setSystemStats({
      cpuUsage: cpuStats.avg || 0,
      memoryUsage: memoryStats.avg || 0,
      networkLatency: Math.random() * 100, // Simulated
      activeConnections: Math.floor(Math.random() * 50), // Simulated
      errorRate: errorStats.count || 0
    });
  };

  const getTimeRange = (range: string) => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    
    return {
      start: now - (ranges[range] || ranges['1h']),
      end: now
    };
  };

  const formatChartData = (metricName: string): ChartDataPoint[] => {
    return metrics
      .filter(m => m.name === metricName)
      .slice(0, 50)
      .reverse()
      .map(m => ({
        timestamp: new Date(m.timestamp).toLocaleTimeString(),
        value: m.value,
        label: m.unit
      }));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      low: <Activity className="w-4 h-4" />,
      medium: <AlertTriangle className="w-4 h-4" />,
      high: <AlertTriangle className="w-4 h-4" />,
      critical: <AlertCircle className="w-4 h-4" />
    };
    return icons[severity as keyof typeof icons] || icons.low;
  };

  const activePipelines = Array.from(pipelines.values()).filter(p => 
    p.overallStatus === 'running' || p.overallStatus === 'pending'
  );
  
  const completedPipelines = Array.from(pipelines.values()).filter(p => 
    p.overallStatus === 'completed' || p.overallStatus === 'failed'
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="5m">5 minutos</option>
            <option value="15m">15 minutos</option>
            <option value="1h">1 hora</option>
            <option value="6h">6 horas</option>
            <option value="24h">24 horas</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={!isMonitoring}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          {isMonitoring ? (
            <Button variant="destructive" size="sm" onClick={handleStopMonitoring}>
              <Pause className="w-4 h-4 mr-2" />
              Parar
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleStartMonitoring}>
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map(alert => (
            <Alert key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-center space-x-2">
                {getSeverityIcon(alert.severity)}
                <AlertDescription className="flex-1">
                  {alert.message}
                </AlertDescription>
                <span className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Métricas do sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.cpuUsage.toFixed(1)}%</div>
            <Progress value={systemStats.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memória</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(systemStats.memoryUsage)}</div>
            <Progress value={(systemStats.memoryUsage / (100 * 1024 * 1024)) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rede</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.networkLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStats.activeConnections} conexões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePipelines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedPipelines.length} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{systemStats.errorRate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              últimos {selectedTimeRange}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com diferentes visualizações */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de uso de memória */}
            <Card>
              <CardHeader>
                <CardTitle>Uso de Memória</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData('system_memory_usage')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis tickFormatter={formatBytes} />
                    <Tooltip formatter={(value) => [formatBytes(Number(value)), 'Memória']} />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de CPU */}
            <Card>
              <CardHeader>
                <CardTitle>Uso de CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData('system_cpu_usage')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'CPU']} />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          {/* Pipelines ativos */}
          {activePipelines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pipelines Ativos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activePipelines.map(pipeline => (
                  <div key={pipeline.pipelineId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pipeline.pipelineId}</h4>
                      <Badge variant={pipeline.overallStatus === 'running' ? 'default' : 'secondary'}>
                        {pipeline.overallStatus}
                      </Badge>
                    </div>
                    <Progress value={pipeline.overallProgress} className="mb-2" />
                    <div className="text-sm text-gray-600">
                      Progresso: {pipeline.overallProgress.toFixed(1)}% • 
                      Tempo: {formatDuration(Date.now() - pipeline.startTime)} • 
                      Stages: {pipeline.stages.size}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Histórico de pipelines */}
          {completedPipelines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pipelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedPipelines.slice(0, 10).map(pipeline => (
                    <div key={pipeline.pipelineId} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <span className="font-medium">{pipeline.pipelineId}</span>
                        <div className="text-sm text-gray-600">
                          {formatDuration(pipeline.totalDuration || 0)} • 
                          {pipeline.stages.size} stages
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {pipeline.overallStatus === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(pipeline.endTime || 0).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tempo de resposta */}
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatChartData('pipeline_completed')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis tickFormatter={formatDuration} />
                    <Tooltip formatter={(value) => [formatDuration(Number(value)), 'Duração']} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Throughput */}
            <Card>
              <CardHeader>
                <CardTitle>Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData('pipeline_started')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Pipelines/min']} />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taxa de erro */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData('error_occurred')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Erros']} />
                    <Area type="monotone" dataKey="value" stroke="#ff7300" fill="#ff7300" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum alerta</p>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} className="flex items-center space-x-3 p-2 border rounded">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitorDashboard;