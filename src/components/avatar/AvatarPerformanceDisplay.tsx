import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
  Bar
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  Gauge,
  HardDrive,
  Monitor,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { 
  avatarPerformanceMonitor, 
  PerformanceMetrics, 
  PerformanceAlert 
} from '../../lib/performance/AvatarPerformanceMonitor';

interface AvatarPerformanceDisplayProps {
  className?: string;
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
}

const AvatarPerformanceDisplay: React.FC<AvatarPerformanceDisplayProps> = ({
  className = '',
  isMinimized = false,
  onToggleMinimized
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar monitoramento
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  const startMonitoring = () => {
    if (!isMonitoring) {
      avatarPerformanceMonitor.startMonitoring();
      setIsMonitoring(true);
      
      intervalRef.current = setInterval(() => {
        const metrics = avatarPerformanceMonitor.getCurrentMetrics();
        const history = avatarPerformanceMonitor.getMetricsHistory(30);
        const currentAlerts = avatarPerformanceMonitor.getAlerts(10);
        
        if (metrics) setCurrentMetrics(metrics);
        setMetricsHistory(history);
        setAlerts(currentAlerts);
      }, 1000);
    }
  };

  const stopMonitoring = () => {
    if (isMonitoring) {
      avatarPerformanceMonitor.stopMonitoring();
      setIsMonitoring(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const ratio = value / threshold;
    if (inverse) {
      if (ratio >= 0.9) return 'text-green-500';
      if (ratio >= 0.7) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (ratio <= 0.7) return 'text-green-500';
      if (ratio <= 0.9) return 'text-yellow-500';
      return 'text-red-500';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'MB') return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    if (unit === 'ms') return `${value.toFixed(1)} ms`;
    return `${value.toFixed(0)} ${unit}`;
  };

  const chartData = metricsHistory.map((metric, index) => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    fps: metric.fps,
    frameTime: metric.frameTime,
    memory: metric.memoryUsage / (1024 * 1024), // Convert to MB
    drawCalls: metric.drawCalls,
    triangles: metric.triangles / 1000 // Convert to K
  }));

  const performanceReport = avatarPerformanceMonitor.getPerformanceReport();
  const optimizationSuggestions = avatarPerformanceMonitor.getOptimizationSuggestions();

  if (isMinimized) {
    return (
      <Card className={`fixed bottom-4 right-4 w-64 z-50 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Avatar Performance</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimized}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {currentMetrics && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Gauge className="h-3 w-3" />
                <span className={getStatusColor(currentMetrics.fps, 30, true)}>
                  {currentMetrics.fps.toFixed(0)} FPS
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <HardDrive className="h-3 w-3" />
                <span className={getStatusColor(currentMetrics.memoryUsage, 500 * 1024 * 1024)}>
                  {formatValue(currentMetrics.memoryUsage, 'MB')}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span className={getStatusColor(currentMetrics.frameTime, 33)}>
                  {currentMetrics.frameTime.toFixed(1)}ms
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span className={getStatusColor(currentMetrics.drawCalls, 1000)}>
                  {currentMetrics.drawCalls}
                </span>
              </div>
            </div>
          )}
          {alerts.length > 0 && (
            <Badge variant="destructive" className="mt-2 text-xs">
              {alerts.length} alertas
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-6xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <CardTitle>Monitor de Performance do Avatar 3D</CardTitle>
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
            >
              {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isMonitoring ? "Pausar" : "Iniciar"}
            </Button>
            {onToggleMinimized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimized}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="optimization">Otimização</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {currentMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* FPS Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">FPS</p>
                        <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.fps, 30, true)}`}>
                          {currentMetrics.fps.toFixed(0)}
                        </p>
                      </div>
                      <Gauge className="h-8 w-8 text-blue-500" />
                    </div>
                    <Progress 
                      value={(currentMetrics.fps / 60) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                {/* Frame Time Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Frame Time</p>
                        <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.frameTime, 33)}`}>
                          {currentMetrics.frameTime.toFixed(1)}ms
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-green-500" />
                    </div>
                    <Progress 
                      value={Math.min((currentMetrics.frameTime / 33) * 100, 100)} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                {/* Memory Usage Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Memória</p>
                        <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.memoryUsage, 500 * 1024 * 1024)}`}>
                          {formatValue(currentMetrics.memoryUsage, 'MB')}
                        </p>
                      </div>
                      <HardDrive className="h-8 w-8 text-purple-500" />
                    </div>
                    <Progress 
                      value={(currentMetrics.memoryUsage / (500 * 1024 * 1024)) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                {/* Draw Calls Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Draw Calls</p>
                        <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.drawCalls, 1000)}`}>
                          {currentMetrics.drawCalls}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-500" />
                    </div>
                    <Progress 
                      value={(currentMetrics.drawCalls / 1000) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status da Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {performanceReport.status === 'good' && (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">Performance Excelente</span>
                    </>
                  )}
                  {performanceReport.status === 'warning' && (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="text-yellow-700 font-medium">Performance com Avisos</span>
                    </>
                  )}
                  {performanceReport.status === 'critical' && (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700 font-medium">Performance Crítica</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* FPS Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">FPS ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="fps" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Memory Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uso de Memória (MB)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Frame Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tempo de Frame (ms)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="frameTime" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Draw Calls Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Draw Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="drawCalls" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum alerta de performance ativo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{alert.message}</p>
                              <p className="text-sm text-gray-600">
                                Valor: {alert.value} | Limite: {alert.threshold}
                              </p>
                            </div>
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'destructive' :
                              alert.severity === 'medium' ? 'default' : 'secondary'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Sugestões de Otimização</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {optimizationSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Sistema otimizado! Nenhuma sugestão no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {optimizationSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AvatarPerformanceDisplay;