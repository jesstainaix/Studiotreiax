import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Zap,
  Activity,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Image,
  Code,
  Database,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Settings,
  Download,
  RefreshCw,
  Play,
  Pause,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Eye,
  Users,
  Server,
  CloudLightning,
} from 'lucide-react';

// Interfaces para análise de performance
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  trend: 'up' | 'down' | 'stable';
  category: 'loading' | 'interactivity' | 'visual' | 'network' | 'resource';
  timestamp: Date;
}

interface PerformanceIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'loading' | 'interactivity' | 'visual' | 'network' | 'resource';
  title: string;
  description: string;
  impact: string;
  solution: string;
  priority: number;
  automated: boolean;
  fixed: boolean;
  detectedAt: Date;
}

interface ResourceAnalysis {
  id: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other';
  url: string;
  size: number;
  loadTime: number;
  cached: boolean;
  compressed: boolean;
  optimized: boolean;
  impact: 'high' | 'medium' | 'low';
  suggestions: string[];
}

interface DeviceProfile {
  type: 'mobile' | 'tablet' | 'desktop';
  connection: '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet';
  cpu: 'low' | 'medium' | 'high';
  memory: number;
  screenSize: { width: number; height: number };
}

interface PerformanceBudget {
  totalSize: number;
  scripts: number;
  stylesheets: number;
  images: number;
  fonts: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

interface OptimizationSuggestion {
  id: string;
  category: 'loading' | 'interactivity' | 'visual' | 'network' | 'resource';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  savings: {
    size?: number;
    time?: number;
    score?: number;
  };
  implementation: string;
  automated: boolean;
}

const AdvancedPerformanceAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [resources, setResources] = useState<ResourceAnalysis[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>({
    type: 'desktop',
    connection: 'wifi',
    cpu: 'high',
    memory: 8192,
    screenSize: { width: 1920, height: 1080 },
  });
  const [budget, setBudget] = useState<PerformanceBudget>({
    totalSize: 2000, // KB
    scripts: 500,
    stylesheets: 200,
    images: 1000,
    fonts: 300,
    firstContentfulPaint: 1500, // ms
    largestContentfulPaint: 2500,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Simular dados de performance
  useEffect(() => {
    if (isAnalyzing) {
      const mockMetrics: PerformanceMetric[] = [
        {
          id: 'fcp',
          name: 'First Contentful Paint',
          value: 1200,
          unit: 'ms',
          threshold: { good: 1800, needsImprovement: 3000, poor: 3000 },
          trend: 'down',
          category: 'loading',
          timestamp: new Date(),
        },
        {
          id: 'lcp',
          name: 'Largest Contentful Paint',
          value: 2100,
          unit: 'ms',
          threshold: { good: 2500, needsImprovement: 4000, poor: 4000 },
          trend: 'stable',
          category: 'loading',
          timestamp: new Date(),
        },
        {
          id: 'fid',
          name: 'First Input Delay',
          value: 85,
          unit: 'ms',
          threshold: { good: 100, needsImprovement: 300, poor: 300 },
          trend: 'up',
          category: 'interactivity',
          timestamp: new Date(),
        },
        {
          id: 'cls',
          name: 'Cumulative Layout Shift',
          value: 0.08,
          unit: '',
          threshold: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
          trend: 'down',
          category: 'visual',
          timestamp: new Date(),
        },
        {
          id: 'ttfb',
          name: 'Time to First Byte',
          value: 450,
          unit: 'ms',
          threshold: { good: 800, needsImprovement: 1800, poor: 1800 },
          trend: 'stable',
          category: 'network',
          timestamp: new Date(),
        },
        {
          id: 'total-size',
          name: 'Total Page Size',
          value: 1850,
          unit: 'KB',
          threshold: { good: 2000, needsImprovement: 3000, poor: 3000 },
          trend: 'up',
          category: 'resource',
          timestamp: new Date(),
        },
      ];

      const mockIssues: PerformanceIssue[] = [
        {
          id: '1',
          type: 'warning',
          category: 'loading',
          title: 'Imagens não otimizadas',
          description: 'Várias imagens estão sendo carregadas sem compressão adequada',
          impact: 'Aumenta o tempo de carregamento em ~800ms',
          solution: 'Comprimir imagens e usar formatos modernos (WebP, AVIF)',
          priority: 8,
          automated: true,
          fixed: false,
          detectedAt: new Date(),
        },
        {
          id: '2',
          type: 'critical',
          category: 'interactivity',
          title: 'JavaScript bloqueante',
          description: 'Scripts estão bloqueando o thread principal',
          impact: 'Causa atrasos na interatividade de até 300ms',
          solution: 'Implementar code splitting e lazy loading',
          priority: 9,
          automated: false,
          fixed: false,
          detectedAt: new Date(),
        },
        {
          id: '3',
          type: 'info',
          category: 'network',
          title: 'Cache não configurado',
          description: 'Recursos estáticos sem headers de cache apropriados',
          impact: 'Força redownload desnecessário de recursos',
          solution: 'Configurar cache headers para recursos estáticos',
          priority: 6,
          automated: true,
          fixed: false,
          detectedAt: new Date(),
        },
      ];

      const mockResources: ResourceAnalysis[] = [
        {
          id: '1',
          type: 'script',
          url: '/js/main.bundle.js',
          size: 450,
          loadTime: 280,
          cached: false,
          compressed: true,
          optimized: false,
          impact: 'high',
          suggestions: ['Implementar code splitting', 'Remover código não utilizado'],
        },
        {
          id: '2',
          type: 'image',
          url: '/images/hero-banner.jpg',
          size: 850,
          loadTime: 420,
          cached: false,
          compressed: false,
          optimized: false,
          impact: 'high',
          suggestions: ['Comprimir imagem', 'Usar formato WebP', 'Implementar lazy loading'],
        },
        {
          id: '3',
          type: 'stylesheet',
          url: '/css/styles.css',
          size: 120,
          loadTime: 85,
          cached: true,
          compressed: true,
          optimized: true,
          impact: 'low',
          suggestions: [],
        },
      ];

      const mockSuggestions: OptimizationSuggestion[] = [
        {
          id: '1',
          category: 'loading',
          title: 'Implementar Critical CSS',
          description: 'Extrair CSS crítico para renderização inicial',
          impact: 'high',
          effort: 'medium',
          savings: { time: 400, score: 15 },
          implementation: 'Usar ferramentas como Critical ou PurgeCSS',
          automated: true,
        },
        {
          id: '2',
          category: 'resource',
          title: 'Otimizar Imagens',
          description: 'Comprimir e converter imagens para formatos modernos',
          impact: 'high',
          effort: 'low',
          savings: { size: 600, time: 300, score: 12 },
          implementation: 'Usar imagemin ou serviços de CDN com otimização automática',
          automated: true,
        },
        {
          id: '3',
          category: 'network',
          title: 'Implementar HTTP/2 Server Push',
          description: 'Enviar recursos críticos proativamente',
          impact: 'medium',
          effort: 'high',
          savings: { time: 200, score: 8 },
          implementation: 'Configurar server push no servidor web',
          automated: false,
        },
      ];

      setMetrics(mockMetrics);
      setIssues(mockIssues);
      setResources(mockResources);
      setSuggestions(mockSuggestions);
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Handlers
  const startAnalysis = () => {
    setIsAnalyzing(true);
  };

  const fixIssue = (issueId: string) => {
    setIssues(prev =>
      prev.map(issue => issue.id === issueId ? { ...issue, fixed: true } : issue)
    );
  };

  const optimizeResource = (resourceId: string) => {
    setResources(prev =>
      prev.map(resource => resource.id === resourceId ? { ...resource, optimized: true } : resource)
    );
  };

  const applySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion?.automated) {
      // Simular aplicação automática
    }
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      issues: issues.filter(i => !i.fixed),
      resources,
      suggestions,
      deviceProfile,
      budget,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
  };

  // Valores computados
  const overallScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    
    const scores = metrics.map(metric => {
      if (metric.value <= metric.threshold.good) return 100;
      if (metric.value <= metric.threshold.needsImprovement) return 75;
      return 50;
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [metrics]);

  const criticalIssues = useMemo(() => issues.filter(i => i.type === 'critical' && !i.fixed), [issues]);
  const totalResourceSize = useMemo(() => resources.reduce((sum, r) => sum + r.size, 0), [resources]);
  const unoptimizedResources = useMemo(() => resources.filter(r => !r.optimized), [resources]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricStatus = (metric: PerformanceMetric) => {
    if (metric.value <= metric.threshold.good) return 'good';
    if (metric.value <= metric.threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'loading': return <Clock className="w-4 h-4" />;
      case 'interactivity': return <Activity className="w-4 h-4" />;
      case 'visual': return <Eye className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'resource': return <HardDrive className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'script': return <Code className="w-4 h-4" />;
      case 'stylesheet': return <PieChartIcon className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'font': return <Type className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  // Dados para gráficos
  const performanceTimelineData = [
    { time: '00:00', fcp: 1100, lcp: 1900, fid: 75, cls: 0.06 },
    { time: '00:15', fcp: 1150, lcp: 2000, fid: 80, cls: 0.07 },
    { time: '00:30', fcp: 1200, lcp: 2100, fid: 85, cls: 0.08 },
    { time: '00:45', fcp: 1180, lcp: 2050, fid: 82, cls: 0.075 },
    { time: '01:00', fcp: 1220, lcp: 2150, fid: 88, cls: 0.085 },
  ];

  const resourceDistributionData = [
    { name: 'Scripts', value: 450, color: '#3b82f6' },
    { name: 'Imagens', value: 850, color: '#ef4444' },
    { name: 'Estilos', value: 120, color: '#10b981' },
    { name: 'Fontes', value: 280, color: '#f59e0b' },
    { name: 'Outros', value: 150, color: '#8b5cf6' },
  ];

  const deviceComparisonData = [
    { device: 'Mobile', fcp: 1800, lcp: 3200, fid: 150 },
    { device: 'Tablet', fcp: 1400, lcp: 2600, fid: 120 },
    { device: 'Desktop', fcp: 1200, lcp: 2100, fid: 85 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analisador de Performance Avançado</h1>
          <p className="text-gray-600 mt-1">
            Monitore e otimize a performance da sua aplicação em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={realTimeMonitoring}
              onCheckedChange={setRealTimeMonitoring}
            />
            <span className="text-sm">Monitoramento em Tempo Real</span>
          </div>
          <Button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
          </Button>
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score Geral</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </p>
              </div>
              <Target className={`w-8 h-8 ${getScoreColor(overallScore)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Problemas Críticos</p>
                <p className={`text-2xl font-bold ${criticalIssues.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {criticalIssues.length}
                </p>
              </div>
              {criticalIssues.length > 0 ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tamanho Total</p>
                <p className={`text-2xl font-bold ${totalResourceSize > budget.totalSize ? 'text-red-600' : 'text-green-600'}`}>
                  {(totalResourceSize / 1024).toFixed(1)}MB
                </p>
              </div>
              <HardDrive className={`w-8 h-8 ${totalResourceSize > budget.totalSize ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recursos Não Otimizados</p>
                <p className={`text-2xl font-bold ${unoptimizedResources.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {unoptimizedResources.length}
                </p>
              </div>
              <Zap className={`w-8 h-8 ${unoptimizedResources.length > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="fcp" stroke="#3b82f6" name="FCP (ms)" />
                      <Line type="monotone" dataKey="lcp" stroke="#ef4444" name="LCP (ms)" />
                      <Line type="monotone" dataKey="fid" stroke="#10b981" name="FID (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Resource Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Recursos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resourceDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}KB`}
                      >
                        {resourceDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}KB`, 'Tamanho']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação por Dispositivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="fcp" fill="#3b82f6" name="FCP (ms)" />
                    <Bar dataKey="lcp" fill="#ef4444" name="LCP (ms)" />
                    <Bar dataKey="fid" fill="#10b981" name="FID (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const status = getMetricStatus(metric);
              return (
                <Card key={metric.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(metric.category)}
                        <h3 className="font-medium text-sm">{metric.name}</h3>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        <span className="text-sm text-gray-600">{metric.unit}</span>
                      </div>
                      <Badge className={getStatusColor(status)}>
                        {status === 'good' && 'Bom'}
                        {status === 'needs-improvement' && 'Precisa Melhorar'}
                        {status === 'poor' && 'Ruim'}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        Limite: {metric.threshold.good}{metric.unit}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getResourceIcon(resource.type)}
                      <div>
                        <h3 className="font-medium">{resource.url}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{(resource.size / 1024).toFixed(1)}MB</span>
                          <span>{resource.loadTime}ms</span>
                          <Badge variant={resource.impact === 'high' ? 'destructive' : resource.impact === 'medium' ? 'default' : 'secondary'}>
                            {resource.impact}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {resource.cached && <Badge variant="outline">Cached</Badge>}
                          {resource.compressed && <Badge variant="outline">Compressed</Badge>}
                          {resource.optimized && <Badge variant="outline">Optimized</Badge>}
                        </div>
                        {resource.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Sugestões:</p>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {resource.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    {!resource.optimized && (
                      <Button
                        onClick={() => optimizeResource(resource.id)}
                        size="sm"
                        variant="outline"
                      >
                        Otimizar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <div className="space-y-4">
            {issues.filter(i => !i.fixed).map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(issue.category)}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge variant={issue.type === 'critical' ? 'destructive' : issue.type === 'warning' ? 'default' : 'secondary'}>
                            {issue.type}
                          </Badge>
                          <Badge variant="outline">Prioridade: {issue.priority}</Badge>
                          {issue.automated && (
                            <Badge variant="secondary">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{issue.description}</p>
                        <div className="bg-orange-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-orange-800">Impacto:</p>
                          <p className="text-sm text-orange-700">{issue.impact}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Solução:</p>
                          <p className="text-sm text-blue-700">{issue.solution}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => fixIssue(issue.id)}
                      size="sm"
                      variant={issue.automated ? 'default' : 'outline'}
                    >
                      {issue.automated ? 'Corrigir' : 'Marcar como Corrigido'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(suggestion.category)}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <Badge variant={suggestion.impact === 'high' ? 'destructive' : suggestion.impact === 'medium' ? 'default' : 'secondary'}>
                            Impacto: {suggestion.impact}
                          </Badge>
                          <Badge variant="outline">
                            Esforço: {suggestion.effort}
                          </Badge>
                          {suggestion.automated && (
                            <Badge variant="secondary">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                        {suggestion.savings && (
                          <div className="bg-green-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-green-800">Economia Estimada:</p>
                            <div className="text-sm text-green-700">
                              {suggestion.savings.size && <span>Tamanho: {suggestion.savings.size}KB</span>}
                              {suggestion.savings.time && <span className="ml-3">Tempo: {suggestion.savings.time}ms</span>}
                              {suggestion.savings.score && <span className="ml-3">Score: +{suggestion.savings.score}</span>}
                            </div>
                          </div>
                        )}
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Implementação:</p>
                          <p className="text-sm text-blue-700">{suggestion.implementation}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => applySuggestion(suggestion.id)}
                      size="sm"
                      variant={suggestion.automated ? 'default' : 'outline'}
                      disabled={!suggestion.automated}
                    >
                      {suggestion.automated ? 'Aplicar' : 'Manual'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Budget */}
            <Card>
              <CardHeader>
                <CardTitle>Orçamento de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tamanho Total Máximo (KB)</label>
                  <Slider
                    value={[budget.totalSize]}
                    onValueChange={([value]) => setBudget(prev => ({ ...prev, totalSize: value }))}
                    min={1000}
                    max={5000}
                    step={100}
                  />
                  <p className="text-sm text-gray-600">{budget.totalSize}KB</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Contentful Paint (ms)</label>
                  <Slider
                    value={[budget.firstContentfulPaint]}
                    onValueChange={([value]) => setBudget(prev => ({ ...prev, firstContentfulPaint: value }))}
                    min={500}
                    max={3000}
                    step={100}
                  />
                  <p className="text-sm text-gray-600">{budget.firstContentfulPaint}ms</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Largest Contentful Paint (ms)</label>
                  <Slider
                    value={[budget.largestContentfulPaint]}
                    onValueChange={([value]) => setBudget(prev => ({ ...prev, largestContentfulPaint: value }))}
                    min={1000}
                    max={5000}
                    step={100}
                  />
                  <p className="text-sm text-gray-600">{budget.largestContentfulPaint}ms</p>
                </div>
              </CardContent>
            </Card>

            {/* Device Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Perfil do Dispositivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Dispositivo</label>
                  <Select
                    value={deviceProfile.type}
                    onValueChange={(value: 'mobile' | 'tablet' | 'desktop') =>
                      setDeviceProfile(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conexão</label>
                  <Select
                    value={deviceProfile.connection}
                    onValueChange={(value: '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet') =>
                      setDeviceProfile(prev => ({ ...prev, connection: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2g">2G</SelectItem>
                      <SelectItem value="3g">3G</SelectItem>
                      <SelectItem value="4g">4G</SelectItem>
                      <SelectItem value="5g">5G</SelectItem>
                      <SelectItem value="wifi">WiFi</SelectItem>
                      <SelectItem value="ethernet">Ethernet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPU</label>
                  <Select
                    value={deviceProfile.cpu}
                    onValueChange={(value: 'low' | 'medium' | 'high') =>
                      setDeviceProfile(prev => ({ ...prev, cpu: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPerformanceAnalyzer;