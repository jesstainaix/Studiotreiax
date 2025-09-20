import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  Eye,
  EyeOff,
  MemoryStick,
  Network,
  Play,
  Settings,
  Square,
  TrendingDown,
  TrendingUp,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';
import { usePerformanceMonitor, PerformanceMetric, PerformanceAlert } from '@/hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  className?: string;
  onClose?: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className, onClose }) => {
  const { state, config, actions, updateConfig } = usePerformanceMonitor();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Preparar dados para gráficos
  useEffect(() => {
    const last50Metrics = state.metrics.slice(-50);
    const groupedByTime = last50Metrics.reduce((acc, metric) => {
      const timeKey = new Date(metric.timestamp).toLocaleTimeString();
      if (!acc[timeKey]) {
        acc[timeKey] = { time: timeKey };
      }
      acc[timeKey][metric.name] = metric.value;
      return acc;
    }, {} as Record<string, any>);
    
    setChartData(Object.values(groupedByTime));
  }, [state.metrics]);

  // Função para formatar valor com unidade
  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms') {
      return `${value.toFixed(1)}ms`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'score') {
      return value.toFixed(3);
    }
    return `${value.toFixed(2)} ${unit}`;
  };

  // Função para obter cor baseada na severidade
  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Função para obter ícone da categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'loading': return <Clock className="h-4 w-4" />;
      case 'runtime': return <Cpu className="h-4 w-4" />;
      case 'memory': return <MemoryStick className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'user': return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Componente para exibir Web Vitals
  const WebVitalsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Web Vitals
        </CardTitle>
        <CardDescription>
          Métricas essenciais de experiência do usuário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(state.webVitals).map(([key, value]) => {
            if (value === undefined) return null;
            
            const thresholds = {
              FCP: { good: 1800, poor: 3000 },
              LCP: { good: 2500, poor: 4000 },
              FID: { good: 100, poor: 300 },
              CLS: { good: 0.1, poor: 0.25 },
              TTFB: { good: 800, poor: 1800 },
              INP: { good: 200, poor: 500 },
            }[key as keyof typeof state.webVitals];
            
            const severity = thresholds ? 
              (value <= thresholds.good ? 'good' : value <= thresholds.poor ? 'needs-improvement' : 'poor') : 'good';
            
            return (
              <div key={key} className="text-center">
                <div className={`text-2xl font-bold ${getSeverityColor(severity)}`}>
                  {key === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`}
                </div>
                <div className="text-sm text-muted-foreground">{key}</div>
                <Badge variant={severity === 'good' ? 'default' : severity === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {severity === 'good' ? 'Bom' : severity === 'needs-improvement' ? 'Precisa melhorar' : 'Ruim'}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  // Componente para exibir métricas de sistema
  const SystemMetricsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Métricas do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Memória */}
          {state.memory && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  Uso de Memória
                </Label>
                <span className="text-sm font-medium">
                  {formatValue(state.memory.usagePercentage, '%')}
                </span>
              </div>
              <Progress value={state.memory.usagePercentage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {(state.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / {(state.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          )}

          {/* Rede */}
          {state.network && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Conexão de Rede
                </Label>
                <Badge variant="outline">{state.network.effectiveType}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Downlink:</span>
                  <span className="ml-1 font-medium">{state.network.downlink} Mbps</span>
                </div>
                <div>
                  <span className="text-muted-foreground">RTT:</span>
                  <span className="ml-1 font-medium">{state.network.rtt}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Componente para exibir alertas
  const AlertsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas ({state.alerts.filter(a => !a.acknowledged).length})
          </div>
          {state.alerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={actions.clearAlerts}>
              Limpar Todos
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          {state.alerts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              Nenhum alerta ativo
            </div>
          ) : (
            <div className="space-y-2">
              {state.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.acknowledged ? 'bg-muted/50' : alert.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.type === 'critical' ? 'Crítico' : 'Aviso'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor: {alert.value.toFixed(1)} | Limite: {alert.threshold}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => actions.acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // Componente para gráfico de métricas
  const MetricsChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Performance</CardTitle>
        <CardDescription>
          Evolução das métricas ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="render-time" stroke="#8884d8" name="Render Time (ms)" />
              <Line type="monotone" dataKey="memory-usage" stroke="#82ca9d" name="Memory Usage (%)" />
              <Line type="monotone" dataKey="network-latency" stroke="#ffc658" name="Network Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  // Componente para configurações
  const SettingsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="realtime-monitoring">Monitoramento em Tempo Real</Label>
          <Switch
            id="realtime-monitoring"
            checked={config.enableRealTimeMonitoring}
            onCheckedChange={(checked) => updateConfig({ enableRealTimeMonitoring: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="alerts">Alertas Automáticos</Label>
          <Switch
            id="alerts"
            checked={config.enableAlerts}
            onCheckedChange={(checked) => updateConfig({ enableAlerts: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-optimization">Otimização Automática</Label>
          <Switch
            id="auto-optimization"
            checked={config.enableAutoOptimization}
            onCheckedChange={(checked) => updateConfig({ enableAutoOptimization: checked })}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label htmlFor="sampling-rate">Taxa de Amostragem (ms)</Label>
          <Input
            id="sampling-rate"
            type="number"
            value={config.samplingRate}
            onChange={(e) => updateConfig({ samplingRate: parseInt(e.target.value) || 1000 })}
            min="100"
            max="10000"
            step="100"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Limites de Alerta</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="memory-threshold" className="text-xs">Memória (%)</Label>
              <Input
                id="memory-threshold"
                type="number"
                value={config.alertThresholds.memoryUsage}
                onChange={(e) => updateConfig({
                  alertThresholds: {
                    ...config.alertThresholds,
                    memoryUsage: parseInt(e.target.value) || 80
                  }
                })}
                min="50"
                max="95"
              />
            </div>
            <div>
              <Label htmlFor="render-threshold" className="text-xs">Render (ms)</Label>
              <Input
                id="render-threshold"
                type="number"
                value={config.alertThresholds.renderTime}
                onChange={(e) => updateConfig({
                  alertThresholds: {
                    ...config.alertThresholds,
                    renderTime: parseInt(e.target.value) || 16
                  }
                })}
                min="8"
                max="100"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Performance</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real da performance da aplicação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={state.isMonitoring ? "destructive" : "default"}
            onClick={state.isMonitoring ? actions.stopMonitoring : actions.startMonitoring}
          >
            {state.isMonitoring ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const data = actions.exportMetrics();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Métricas exportadas com sucesso!');
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <Badge variant={state.isMonitoring ? "default" : "secondary"}>
          {state.isMonitoring ? 'Monitorando' : 'Parado'}
        </Badge>
        {state.lastUpdate && (
          <span className="text-sm text-muted-foreground">
            Última atualização: {state.lastUpdate.toLocaleTimeString()}
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {state.metrics.length} métricas coletadas
        </span>
      </div>

      {/* Configurações (se visível) */}
      {showSettings && <SettingsPanel />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WebVitalsCard />
            <SystemMetricsCard />
          </div>
          <MetricsChart />
        </TabsContent>

        <TabsContent value="vitals">
          <div className="space-y-6">
            <WebVitalsCard />
            <MetricsChart />
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <SystemMetricsCard />
            <Card>
              <CardHeader>
                <CardTitle>Métricas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {state.metrics.slice(-20).reverse().map((metric) => (
                      <div key={metric.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(metric.category)}
                          <span className="font-medium">{metric.name}</span>
                          <Badge variant="outline">{metric.category}</Badge>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${getSeverityColor(metric.severity)}`}>
                            {formatValue(metric.value, metric.unit)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {metric.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;