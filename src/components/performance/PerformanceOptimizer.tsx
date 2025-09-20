import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';
import {
  Activity, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Cpu, HardDrive, Wifi, Monitor, Smartphone, Tablet, Laptop,
  Globe, Database, Server, Cloud, Settings, Download, Play, Pause,
  RotateCcw, Target, Gauge, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Layers, Filter, Search, RefreshCw
} from 'lucide-react';

// Interfaces para análise de performance
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  category: 'speed' | 'resource' | 'user_experience' | 'reliability' | 'scalability';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  history: HistoryPoint[];
}

interface HistoryPoint {
  timestamp: Date;
  value: number;
  context?: string;
}

interface PerformanceIssue {
  id: string;
  type: 'bottleneck' | 'memory_leak' | 'slow_query' | 'large_bundle' | 'render_blocking';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_components: string[];
  impact_score: number;
  detection_time: Date;
  estimated_fix_time: number;
  fix_suggestions: FixSuggestion[];
  status: 'detected' | 'investigating' | 'fixing' | 'resolved' | 'ignored';
  priority: number;
}

interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementation_steps: string[];
  estimated_improvement: number;
  confidence: number;
  dependencies: string[];
}

interface ResourceUsage {
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
    temperature: number;
    processes: ProcessInfo[];
  };
  memory: {
    used: number;
    total: number;
    available: number;
    swap_used: number;
    swap_total: number;
    heap_size: number;
  };
  disk: {
    used: number;
    total: number;
    read_speed: number;
    write_speed: number;
    iops: number;
  };
  network: {
    download_speed: number;
    upload_speed: number;
    latency: number;
    packet_loss: number;
    bandwidth_usage: number;
  };
  gpu?: {
    usage: number;
    memory_used: number;
    memory_total: number;
    temperature: number;
  };
}

interface ProcessInfo {
  name: string;
  pid: number;
  cpu_usage: number;
  memory_usage: number;
  status: string;
}

interface UserExperienceMetric {
  page_load_time: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  first_input_delay: number;
  cumulative_layout_shift: number;
  time_to_interactive: number;
  bounce_rate: number;
  session_duration: number;
  user_satisfaction: number;
  error_rate: number;
}

interface OptimizationRecommendation {
  id: string;
  category: 'code' | 'infrastructure' | 'database' | 'frontend' | 'backend';
  title: string;
  description: string;
  current_state: string;
  proposed_solution: string;
  expected_improvement: {
    metric: string;
    improvement_percentage: number;
    confidence: number;
  }[];
  implementation: {
    effort: 'low' | 'medium' | 'high';
    time_estimate: number;
    complexity: 'simple' | 'moderate' | 'complex';
    risk_level: 'low' | 'medium' | 'high';
    prerequisites: string[];
  };
  priority_score: number;
  roi_estimate: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
}

interface PerformanceTest {
  id: string;
  name: string;
  type: 'load' | 'stress' | 'spike' | 'endurance' | 'baseline';
  status: 'pending' | 'running' | 'completed' | 'failed';
  configuration: {
    duration: number;
    concurrent_users: number;
    ramp_up_time: number;
    target_endpoints: string[];
    test_data_size: number;
  };
  results?: {
    start_time: Date;
    end_time: Date;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    max_response_time: number;
    min_response_time: number;
    throughput: number;
    error_rate: number;
    cpu_usage_peak: number;
    memory_usage_peak: number;
  };
  metrics: PerformanceMetric[];
  issues_found: PerformanceIssue[];
}

interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'degradation' | 'outage';
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  current_value: number;
  threshold_value: number;
  message: string;
  triggered_at: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolution_time?: Date;
  actions_taken: string[];
}

interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    interval: number;
    retention_days: number;
    alert_thresholds: {
      [metric: string]: {
        warning: number;
        critical: number;
      };
    };
  };
  optimization: {
    auto_optimize: boolean;
    optimization_level: 'conservative' | 'balanced' | 'aggressive';
    target_metrics: string[];
    excluded_optimizations: string[];
  };
  testing: {
    auto_test: boolean;
    test_frequency: 'daily' | 'weekly' | 'monthly';
    test_environments: string[];
    baseline_comparison: boolean;
  };
  reporting: {
    auto_reports: boolean;
    report_frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    include_recommendations: boolean;
  };
}

interface PerformanceReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  generated_at: Date;
  summary: {
    overall_score: number;
    key_metrics: PerformanceMetric[];
    critical_issues: number;
    resolved_issues: number;
    performance_trend: 'improving' | 'stable' | 'degrading';
  };
  detailed_analysis: {
    bottlenecks: PerformanceIssue[];
    resource_utilization: ResourceUsage;
    user_experience: UserExperienceMetric;
    optimization_opportunities: OptimizationRecommendation[];
  };
  recommendations: OptimizationRecommendation[];
  charts: ChartData[];
}

interface ChartData {
  id: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'radar' | 'scatter';
  title: string;
  data: any[];
  config: any;
}

const PerformanceOptimizer: React.FC = () => {
  // Estados principais
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [userExperience, setUserExperience] = useState<UserExperienceMetric | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [tests, setTests] = useState<PerformanceTest[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [config, setConfig] = useState<PerformanceConfig>(defaultConfig);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dados simulados
  useEffect(() => {
    setMetrics(generateMockMetrics());
    setIssues(generateMockIssues());
    setResourceUsage(generateMockResourceUsage());
    setUserExperience(generateMockUserExperience());
    setRecommendations(generateMockRecommendations());
    setTests(generateMockTests());
    setAlerts(generateMockAlerts());
    setReports(generateMockReports());
  }, []);

  // Handlers
  const handleStartOptimization = async () => {
    setIsOptimizing(true);
    // Simular otimização
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsOptimizing(false);
  };

  const handleRunPerformanceTest = async (testType: PerformanceTest['type']) => {
    setIsTesting(true);
    // Simular teste de performance
    await new Promise(resolve => setTimeout(resolve, 5000));
    setIsTesting(false);
  };

  const handleExportReport = (format: 'pdf' | 'csv' | 'json') => {
    const data = {
      metrics,
      issues,
      resourceUsage,
      userExperience,
      recommendations,
      tests,
      alerts,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateConfig = (updates: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'resource': return <Cpu className="h-4 w-4" />;
      case 'user_experience': return <Monitor className="h-4 w-4" />;
      case 'reliability': return <CheckCircle className="h-4 w-4" />;
      case 'scalability': return <Layers className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Valores computados
  const overallScore = metrics.reduce((sum, m) => {
    const score = m.status === 'excellent' ? 100 : 
                 m.status === 'good' ? 80 : 
                 m.status === 'warning' ? 60 : 40;
    return sum + score;
  }, 0) / metrics.length || 0;

  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;
  const pendingRecommendations = recommendations.filter(r => r.status === 'pending').length;
  const averageResponseTime = userExperience?.page_load_time || 0;
  const resourceUtilization = resourceUsage ? 
    (resourceUsage.cpu.usage + (resourceUsage.memory.used / resourceUsage.memory.total * 100)) / 2 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Otimizador de Performance</h2>
          <p className="text-muted-foreground">
            Análise avançada e otimização de performance do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleRunPerformanceTest('load')}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Executar Teste
              </>
            )}
          </Button>
          <Button
            onClick={handleStartOptimization}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Otimizando...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Otimizar
              </>
            )}
          </Button>
          <Button
            onClick={() => handleExportReport('json')}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore.toFixed(1)}</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {issues.length} problemas totais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio de carregamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Recursos</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceUtilization.toFixed(1)}%</div>
            <Progress value={resourceUtilization} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.length} alertas totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas ativos */}
      {activeAlerts > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {activeAlerts} alertas ativos que requerem atenção.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de performance ao longo do tempo */}
            <Card>
              <CardHeader>
                <CardTitle>Performance ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="response_time" stroke="#8884d8" name="Tempo de Resposta" />
                    <Line type="monotone" dataKey="cpu_usage" stroke="#82ca9d" name="Uso de CPU" />
                    <Line type="monotone" dataKey="memory_usage" stroke="#ffc658" name="Uso de Memória" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de problemas por severidade */}
            <Card>
              <CardHeader>
                <CardTitle>Problemas por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateIssueDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateIssueDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Uso de recursos em tempo real */}
          <Card>
            <CardHeader>
              <CardTitle>Uso de Recursos em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU</span>
                    <span className="text-sm text-muted-foreground">
                      {resourceUsage?.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={resourceUsage?.cpu.usage || 0} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memória</span>
                    <span className="text-sm text-muted-foreground">
                      {resourceUsage ? ((resourceUsage.memory.used / resourceUsage.memory.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress value={resourceUsage ? (resourceUsage.memory.used / resourceUsage.memory.total) * 100 : 0} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disco</span>
                    <span className="text-sm text-muted-foreground">
                      {resourceUsage ? ((resourceUsage.disk.used / resourceUsage.disk.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress value={resourceUsage ? (resourceUsage.disk.used / resourceUsage.disk.total) * 100 : 0} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rede</span>
                    <span className="text-sm text-muted-foreground">
                      {resourceUsage?.network.bandwidth_usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={resourceUsage?.network.bandwidth_usage || 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(metric.category)}
                      <div>
                        <h3 className="font-semibold">{metric.name}</h3>
                        <p className="text-sm text-muted-foreground">{metric.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getSeverityColor(metric.status)}>
                          {metric.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Progresso para meta</span>
                      <span>{metric.threshold}{metric.unit}</span>
                    </div>
                    <Progress value={(metric.value / metric.threshold) * 100} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid gap-4">
            {issues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <Badge variant="outline">{issue.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Impacto: {issue.impact_score}/10
                        </span>
                      </div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Componentes: {issue.affected_components.join(', ')}</span>
                        <span>Detectado: {issue.detection_time.toLocaleString()}</span>
                        <span>Tempo estimado: {issue.estimated_fix_time}h</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Investigar
                      </Button>
                      <Button size="sm">
                        Corrigir
                      </Button>
                    </div>
                  </div>
                  
                  {issue.fix_suggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Sugestões de Correção:</h4>
                      {issue.fix_suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="border rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{suggestion.title}</span>
                            <div className="flex space-x-2">
                              <Badge variant="outline">Esforço: {suggestion.effort}</Badge>
                              <Badge variant="outline">Impacto: {suggestion.impact}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          <div className="text-sm">
                            <span className="font-medium">Melhoria estimada: </span>
                            <span className="text-green-600">+{suggestion.estimated_improvement}%</span>
                            <span className="text-muted-foreground ml-2">
                              (Confiança: {(suggestion.confidence * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {resourceUsage && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* CPU Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>Uso de CPU</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uso Total</span>
                      <span className="font-medium">{resourceUsage.cpu.usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={resourceUsage.cpu.usage} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Núcleos:</span>
                      <span className="ml-2 font-medium">{resourceUsage.cpu.cores}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequência:</span>
                      <span className="ml-2 font-medium">{resourceUsage.cpu.frequency}GHz</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Temperatura:</span>
                      <span className="ml-2 font-medium">{resourceUsage.cpu.temperature}°C</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Processos com Maior Uso:</h4>
                    {resourceUsage.cpu.processes.slice(0, 3).map((process, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{process.name}</span>
                        <span className="font-medium">{process.cpu_usage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5" />
                    <span>Uso de Memória</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>RAM Utilizada</span>
                      <span className="font-medium">
                        {(resourceUsage.memory.used / 1024).toFixed(1)}GB / {(resourceUsage.memory.total / 1024).toFixed(1)}GB
                      </span>
                    </div>
                    <Progress value={(resourceUsage.memory.used / resourceUsage.memory.total) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Swap Utilizado</span>
                      <span className="font-medium">
                        {(resourceUsage.memory.swap_used / 1024).toFixed(1)}GB / {(resourceUsage.memory.swap_total / 1024).toFixed(1)}GB
                      </span>
                    </div>
                    <Progress value={(resourceUsage.memory.swap_used / resourceUsage.memory.swap_total) * 100} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Disponível:</span>
                      <span className="ml-2 font-medium">{(resourceUsage.memory.available / 1024).toFixed(1)}GB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Heap Size:</span>
                      <span className="ml-2 font-medium">{resourceUsage.memory.heap_size}MB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disk Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Uso de Disco</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Espaço Utilizado</span>
                      <span className="font-medium">
                        {(resourceUsage.disk.used / 1024).toFixed(1)}GB / {(resourceUsage.disk.total / 1024).toFixed(1)}GB
                      </span>
                    </div>
                    <Progress value={(resourceUsage.disk.used / resourceUsage.disk.total) * 100} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Leitura:</span>
                      <span className="ml-2 font-medium">{resourceUsage.disk.read_speed}MB/s</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Escrita:</span>
                      <span className="ml-2 font-medium">{resourceUsage.disk.write_speed}MB/s</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IOPS:</span>
                      <span className="ml-2 font-medium">{resourceUsage.disk.iops}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wifi className="h-5 w-5" />
                    <span>Uso de Rede</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Largura de Banda</span>
                      <span className="font-medium">{resourceUsage.network.bandwidth_usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={resourceUsage.network.bandwidth_usage} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Download:</span>
                      <span className="ml-2 font-medium">{resourceUsage.network.download_speed}Mbps</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Upload:</span>
                      <span className="ml-2 font-medium">{resourceUsage.network.upload_speed}Mbps</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Latência:</span>
                      <span className="ml-2 font-medium">{resourceUsage.network.latency}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Perda de Pacotes:</span>
                      <span className="ml-2 font-medium">{resourceUsage.network.packet_loss.toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Testes de Performance</h3>
            <div className="flex space-x-2">
              <Button onClick={() => handleRunPerformanceTest('load')} disabled={isTesting}>
                <Play className="mr-2 h-4 w-4" />
                Teste de Carga
              </Button>
              <Button onClick={() => handleRunPerformanceTest('stress')} disabled={isTesting} variant="outline">
                <Target className="mr-2 h-4 w-4" />
                Teste de Stress
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{test.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{test.type}</Badge>
                        <Badge className={getSeverityColor(test.status)}>{test.status}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Usuários: {test.configuration.concurrent_users}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Duração: {test.configuration.duration}min
                      </div>
                    </div>
                  </div>
                  
                  {test.results && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <h5 className="font-medium">Requisições</h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium">{test.results.total_requests.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sucesso:</span>
                            <span className="font-medium text-green-600">{test.results.successful_requests.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Falhas:</span>
                            <span className="font-medium text-red-600">{test.results.failed_requests.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-medium">Tempo de Resposta</h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Médio:</span>
                            <span className="font-medium">{test.results.average_response_time}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Máximo:</span>
                            <span className="font-medium">{test.results.max_response_time}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mínimo:</span>
                            <span className="font-medium">{test.results.min_response_time}ms</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-medium">Performance</h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Throughput:</span>
                            <span className="font-medium">{test.results.throughput} req/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxa de Erro:</span>
                            <span className="font-medium">{test.results.error_rate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CPU Pico:</span>
                            <span className="font-medium">{test.results.cpu_usage_peak.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Badge className={getSeverityColor(rec.implementation.effort)}>
                          {rec.implementation.effort} esforço
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ROI: {rec.roi_estimate.toFixed(1)}x
                        </span>
                      </div>
                      <h3 className="font-semibold">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-sm">Estado Atual:</h4>
                          <p className="text-sm text-muted-foreground">{rec.current_state}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Solução Proposta:</h4>
                          <p className="text-sm text-muted-foreground">{rec.proposed_solution}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Melhorias Esperadas:</h4>
                        <div className="space-y-1">
                          {rec.expected_improvement.map((improvement, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{improvement.metric}:</span>
                              <span className="font-medium text-green-600">
                                +{improvement.improvement_percentage}% 
                                <span className="text-muted-foreground">
                                  ({(improvement.confidence * 100).toFixed(0)}% confiança)
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tempo estimado:</span>
                          <span className="ml-2 font-medium">{rec.implementation.time_estimate}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Complexidade:</span>
                          <span className="ml-2 font-medium">{rec.implementation.complexity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risco:</span>
                          <span className="ml-2 font-medium">{rec.implementation.risk_level}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {rec.priority_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Prioridade</div>
                      </div>
                      <Button size="sm">
                        Implementar
                      </Button>
                      <Button size="sm" variant="outline">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Relatórios de Performance</h3>
            <Button onClick={() => handleExportReport('pdf')}>
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
          
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{report.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{report.summary.overall_score.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Score Geral</div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {report.summary.critical_issues}
                      </div>
                      <div className="text-sm text-muted-foreground">Problemas Críticos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {report.summary.resolved_issues}
                      </div>
                      <div className="text-sm text-muted-foreground">Problemas Resolvidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {report.summary.performance_trend === 'improving' ? (
                          <TrendingUp className="h-6 w-6 text-green-600 mx-auto" />
                        ) : report.summary.performance_trend === 'degrading' ? (
                          <TrendingDown className="h-6 w-6 text-red-600 mx-auto" />
                        ) : (
                          <Activity className="h-6 w-6 text-gray-600 mx-auto" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Tendência</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      Visualizar
                    </Button>
                    <Button size="sm" onClick={() => handleExportReport('pdf')}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Monitoramento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intervalo de Monitoramento</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={config.monitoring.interval}
                    onChange={(e) => handleUpdateConfig({
                      monitoring: { ...config.monitoring, interval: parseInt(e.target.value) }
                    })}
                  >
                    <option value={30}>30 segundos</option>
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minutos</option>
                    <option value={900}>15 minutos</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Retenção de Dados</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={config.monitoring.retention_days}
                    onChange={(e) => handleUpdateConfig({
                      monitoring: { ...config.monitoring, retention_days: parseInt(e.target.value) }
                    })}
                  >
                    <option value={7}>7 dias</option>
                    <option value={30}>30 dias</option>
                    <option value={90}>90 dias</option>
                    <option value={365}>1 ano</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={config.monitoring.enabled}
                    onChange={(e) => handleUpdateConfig({
                      monitoring: { ...config.monitoring, enabled: e.target.checked }
                    })}
                  />
                  <span className="text-sm font-medium">Habilitar monitoramento automático</span>
                </label>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Otimização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nível de Otimização</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={config.optimization.optimization_level}
                  onChange={(e) => handleUpdateConfig({
                    optimization: { 
                      ...config.optimization, 
                      optimization_level: e.target.value as 'conservative' | 'balanced' | 'aggressive'
                    }
                  })}
                >
                  <option value="conservative">Conservador</option>
                  <option value="balanced">Balanceado</option>
                  <option value="aggressive">Agressivo</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={config.optimization.auto_optimize}
                    onChange={(e) => handleUpdateConfig({
                      optimization: { ...config.optimization, auto_optimize: e.target.checked }
                    })}
                  />
                  <span className="text-sm font-medium">Habilitar otimização automática</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Configuração padrão
const defaultConfig: PerformanceConfig = {
  monitoring: {
    enabled: true,
    interval: 60,
    retention_days: 30,
    alert_thresholds: {
      response_time: { warning: 1000, critical: 3000 },
      cpu_usage: { warning: 70, critical: 90 },
      memory_usage: { warning: 80, critical: 95 },
      error_rate: { warning: 1, critical: 5 }
    }
  },
  optimization: {
    auto_optimize: false,
    optimization_level: 'balanced',
    target_metrics: ['response_time', 'cpu_usage', 'memory_usage'],
    excluded_optimizations: []
  },
  testing: {
    auto_test: false,
    test_frequency: 'weekly',
    test_environments: ['staging', 'production'],
    baseline_comparison: true
  },
  reporting: {
    auto_reports: true,
    report_frequency: 'weekly',
    recipients: [],
    include_recommendations: true
  }
};

// Funções auxiliares para gerar dados mock
const generateMockMetrics = (): PerformanceMetric[] => [
  {
    id: 'response_time',
    name: 'Tempo de Resposta',
    value: 245,
    unit: 'ms',
    threshold: 500,
    status: 'good',
    trend: 'down',
    change: -12.5,
    category: 'reliability',
    description: 'Percentual de requisições com erro',
    impact: 'high',
    history: []
  },
  {
    id: 'throughput',
    name: 'Throughput',
    value: 1250,
    unit: 'req/s',
    threshold: 1000,
    status: 'excellent',
    trend: 'up',
    change: 8.7,
    category: 'scalability',
    description: 'Número de requisições processadas por segundo',
    impact: 'high',
    history: []
  }
];

const generateMockIssues = (): PerformanceIssue[] => [
  {
    id: 'issue-1',
    type: 'bottleneck',
    severity: 'high',
    title: 'Gargalo na consulta de banco de dados',
    description: 'Query lenta na tabela de usuários causando atraso nas respostas',
    affected_components: ['UserService', 'Database'],
    impact_score: 8,
    detection_time: new Date(Date.now() - 3600000),
    estimated_fix_time: 4,
    fix_suggestions: [
      {
        id: 'fix-1',
        title: 'Adicionar índice na coluna email',
        description: 'Criar índice composto para otimizar consultas por email',
        effort: 'low',
        impact: 'high',
        implementation_steps: [
          'Analisar padrões de consulta',
          'Criar índice composto',
          'Testar performance'
        ],
        estimated_improvement: 75,
        confidence: 0.9,
        dependencies: []
      }
    ],
    status: 'detected',
    priority: 9
  },
  {
    id: 'issue-2',
    type: 'memory_leak',
    severity: 'medium',
    title: 'Vazamento de memória no componente de chat',
    description: 'Listeners de eventos não estão sendo removidos adequadamente',
    affected_components: ['ChatComponent', 'WebSocket'],
    impact_score: 6,
    detection_time: new Date(Date.now() - 7200000),
    estimated_fix_time: 2,
    fix_suggestions: [
      {
        id: 'fix-2',
        title: 'Implementar cleanup de listeners',
        description: 'Adicionar useEffect cleanup para remover listeners',
        effort: 'medium',
        impact: 'medium',
        implementation_steps: [
          'Identificar listeners não removidos',
          'Implementar cleanup functions',
          'Testar ciclo de vida do componente'
        ],
        estimated_improvement: 40,
        confidence: 0.8,
        dependencies: []
      }
    ],
    status: 'investigating',
    priority: 6
  }
];

const generateMockResourceUsage = (): ResourceUsage => ({
  cpu: {
    usage: 68.5,
    cores: 8,
    frequency: 3.2,
    temperature: 65,
    processes: [
      { name: 'node', pid: 1234, cpu_usage: 25.3, memory_usage: 512, status: 'running' },
      { name: 'chrome', pid: 5678, cpu_usage: 18.7, memory_usage: 1024, status: 'running' },
      { name: 'vscode', pid: 9012, cpu_usage: 12.1, memory_usage: 768, status: 'running' }
    ]
  },
  memory: {
    used: 12288,
    total: 16384,
    available: 4096,
    swap_used: 1024,
    swap_total: 4096,
    heap_size: 256
  },
  disk: {
    used: 512000,
    total: 1024000,
    read_speed: 150,
    write_speed: 120,
    iops: 2500
  },
  network: {
    download_speed: 85.5,
    upload_speed: 42.3,
    latency: 15,
    packet_loss: 0.02,
    bandwidth_usage: 35.7
  },
  gpu: {
    usage: 45.2,
    memory_used: 4096,
    memory_total: 8192,
    temperature: 72
  }
});

const generateMockUserExperience = (): UserExperienceMetric => ({
  page_load_time: 1250,
  first_contentful_paint: 800,
  largest_contentful_paint: 1100,
  first_input_delay: 45,
  cumulative_layout_shift: 0.08,
  time_to_interactive: 1800,
  bounce_rate: 25.3,
  session_duration: 420,
  user_satisfaction: 8.7,
  error_rate: 0.8
});

const generateMockRecommendations = (): OptimizationRecommendation[] => [
  {
    id: 'rec-1',
    category: 'database',
    title: 'Otimizar consultas de banco de dados',
    description: 'Implementar cache Redis para consultas frequentes',
    current_state: 'Consultas diretas ao banco sem cache',
    proposed_solution: 'Implementar camada de cache Redis com TTL apropriado',
    expected_improvement: [
      { metric: 'Tempo de resposta', improvement_percentage: 60, confidence: 0.9 },
      { metric: 'Carga do banco', improvement_percentage: 40, confidence: 0.8 }
    ],
    implementation: {
      effort: 'medium',
      time_estimate: 16,
      complexity: 'moderate',
      risk_level: 'low',
      prerequisites: ['Redis server', 'Cache strategy']
    },
    priority_score: 8.5,
    roi_estimate: 3.2,
    status: 'pending'
  },
  {
    id: 'rec-2',
    category: 'frontend',
    title: 'Implementar lazy loading de imagens',
    description: 'Carregar imagens apenas quando necessário',
    current_state: 'Todas as imagens carregam imediatamente',
    proposed_solution: 'Implementar intersection observer para lazy loading',
    expected_improvement: [
      { metric: 'Tempo de carregamento inicial', improvement_percentage: 35, confidence: 0.85 },
      { metric: 'Uso de banda', improvement_percentage: 50, confidence: 0.9 }
    ],
    implementation: {
      effort: 'low',
      time_estimate: 8,
      complexity: 'simple',
      risk_level: 'low',
      prerequisites: ['Intersection Observer API']
    },
    priority_score: 7.2,
    roi_estimate: 2.8,
    status: 'pending'
  }
];

const generateMockTests = (): PerformanceTest[] => [
  {
    id: 'test-1',
    name: 'Teste de Carga - API Principal',
    type: 'load',
    status: 'completed',
    configuration: {
      duration: 10,
      concurrent_users: 100,
      ramp_up_time: 2,
      target_endpoints: ['/api/users', '/api/posts'],
      test_data_size: 1000
    },
    results: {
      start_time: new Date(Date.now() - 3600000),
      end_time: new Date(Date.now() - 3000000),
      total_requests: 15000,
      successful_requests: 14850,
      failed_requests: 150,
      average_response_time: 245,
      max_response_time: 1200,
      min_response_time: 85,
      throughput: 1250,
      error_rate: 1.0,
      cpu_usage_peak: 78.5,
      memory_usage_peak: 85.2
    },
    metrics: [],
    issues_found: []
  }
];

const generateMockAlerts = (): PerformanceAlert[] => [
  {
    id: 'alert-1',
    type: 'threshold_exceeded',
    severity: 'warning',
    metric: 'response_time',
    current_value: 1250,
    threshold_value: 1000,
    message: 'Tempo de resposta acima do limite aceitável',
    triggered_at: new Date(Date.now() - 1800000),
    acknowledged: false,
    resolved: false,
    actions_taken: []
  },
  {
    id: 'alert-2',
    type: 'anomaly_detected',
    severity: 'info',
    metric: 'cpu_usage',
    current_value: 85.3,
    threshold_value: 80,
    message: 'Pico anômalo no uso de CPU detectado',
    triggered_at: new Date(Date.now() - 900000),
    acknowledged: true,
    resolved: true,
    resolution_time: new Date(Date.now() - 600000),
    actions_taken: ['Reiniciar serviço', 'Verificar logs']
  }
];

const generateMockReports = (): PerformanceReport[] => [
  {
    id: 'report-1',
    title: 'Relatório Semanal de Performance',
    period: {
      start: new Date(Date.now() - 604800000),
      end: new Date()
    },
    generated_at: new Date(),
    summary: {
      overall_score: 82.5,
      key_metrics: [],
      critical_issues: 2,
      resolved_issues: 8,
      performance_trend: 'improving'
    },
    detailed_analysis: {
      bottlenecks: [],
      resource_utilization: generateMockResourceUsage(),
      user_experience: generateMockUserExperience(),
      optimization_opportunities: []
    },
    recommendations: [],
    charts: []
  }
];

const generateTimeSeriesData = () => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: `${i}h`,
      response_time: 200 + Math.random() * 100,
      cpu_usage: 60 + Math.random() * 20,
      memory_usage: 70 + Math.random() * 15
    });
  }
  return data;
};

const generateIssueDistribution = () => [
  { name: 'Baixa', value: 12, color: '#10b981' },
  { name: 'Média', value: 8, color: '#f59e0b' },
  { name: 'Alta', value: 3, color: '#ef4444' },
  { name: 'Crítica', value: 1, color: '#dc2626' }
];

export default PerformanceOptimizer;