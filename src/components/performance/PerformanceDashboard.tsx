import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Activity,
  BarChart3,
  Settings,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Network,
  TestTube,
  Download,
  RefreshCw
} from 'lucide-react';
import PerformanceOptimizationPanel from './PerformanceOptimizationPanel';
import { PerformanceConfigPanel } from './PerformanceConfigPanel';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import { usePerformanceBudgets } from '../../hooks/usePerformanceBudgets';
import { useLazyLoading } from '../../hooks/useLazyLoading';
import { useBundleAnalysis } from '../../hooks/useBundleAnalysis';

interface DashboardStats {
  performanceScore: number;
  activeOptimizations: number;
  budgetViolations: number;
  cacheHitRate: number;
  bundleSize: number;
  lazyLoadedComponents: number;
  abTestsRunning: number;
  lastAnalysis: Date;
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  uptime: number;
}

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    performanceScore: 0,
    activeOptimizations: 0,
    budgetViolations: 0,
    cacheHitRate: 0,
    bundleSize: 0,
    lazyLoadedComponents: 0,
    abTestsRunning: 0,
    lastAnalysis: new Date()
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'good',
    issues: [],
    recommendations: [],
    uptime: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const performanceHook = usePerformanceOptimization();
  const budgetsHook = usePerformanceBudgets();
  const lazyLoadingHook = useLazyLoading();
  const bundleHook = useBundleAnalysis();

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const updateStats = async () => {
    try {
      setIsRefreshing(true);
      
      // Collect data from all hooks
      const performanceData = performanceHook.metrics;
      const budgetData = budgetsHook.state;
      const lazyData = lazyLoadingHook.state;
      const bundleData = bundleHook.state;

      // Calculate performance score
      const score = calculatePerformanceScore(performanceData);
      
      // Update stats
      setStats({
        performanceScore: score,
        activeOptimizations: performanceHook.activeOptimizations?.length || 0,
        budgetViolations: budgetData.violations?.length || 0,
        cacheHitRate: performanceData.cache?.hitRate || 0,
        bundleSize: bundleData.analysis?.totalSize || 0,
        lazyLoadedComponents: lazyData.loadedComponents?.length || 0,
        abTestsRunning: budgetData.abTests?.filter(test => test.status === 'running').length || 0,
        lastAnalysis: new Date()
      });

      // Update system health
      updateSystemHealth(performanceData, budgetData, lazyData, bundleData);
      
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculatePerformanceScore = (metrics: any): number => {
    if (!metrics) return 0;
    
    const weights = {
      fcp: 0.15,
      lcp: 0.25,
      fid: 0.25,
      cls: 0.25,
      ttfb: 0.1
    };
    
    const scores = {
      fcp: getMetricScore(metrics.fcp, [1800, 3000]),
      lcp: getMetricScore(metrics.lcp, [2500, 4000]),
      fid: getMetricScore(metrics.fid, [100, 300]),
      cls: getMetricScore(metrics.cls, [0.1, 0.25]),
      ttfb: getMetricScore(metrics.ttfb, [800, 1800])
    };
    
    return Math.round(
      Object.entries(weights).reduce((total, [metric, weight]) => {
        return total + (scores[metric as keyof typeof scores] * weight);
      }, 0)
    );
  };

  const getMetricScore = (value: number, thresholds: [number, number]): number => {
    if (!value) return 0;
    if (value <= thresholds[0]) return 100;
    if (value <= thresholds[1]) return 50;
    return 0;
  };

  const updateSystemHealth = (performance: any, budgets: any, lazy: any, bundle: any) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: SystemHealth['status'] = 'excellent';

    // Check performance issues
    if (performance.lcp > 4000) {
      issues.push('LCP muito alto (>4s)');
      recommendations.push('Otimizar carregamento de recursos críticos');
      status = 'warning';
    }

    if (performance.cls > 0.25) {
      issues.push('CLS alto - layout instável');
      recommendations.push('Definir dimensões para imagens e elementos dinâmicos');
      status = 'warning';
    }

    // Check budget violations
    if (budgets.violations?.length > 0) {
      issues.push(`${budgets.violations.length} violações de budget`);
      recommendations.push('Revisar e ajustar budgets de performance');
      if (status !== 'critical') status = 'warning';
    }

    // Check bundle size
    if (bundle.analysis?.totalSize > 1000000) { // 1MB
      issues.push('Bundle muito grande (>1MB)');
      recommendations.push('Implementar code splitting e tree shaking');
      if (status !== 'critical') status = 'warning';
    }

    // Check memory usage
    if (performance.memory?.usedJSHeapSize > 50000000) { // 50MB
      issues.push('Alto uso de memória');
      recommendations.push('Verificar vazamentos de memória');
      status = 'critical';
    }

    if (issues.length === 0) {
      status = 'excellent';
    } else if (issues.length <= 2) {
      status = status === 'critical' ? 'critical' : 'good';
    }

    setSystemHealth({
      status,
      issues,
      recommendations,
      uptime: performance.uptime || 0
    });
  };

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <TrendingUp className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const exportReport = async () => {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        stats,
        systemHealth,
        performance: performanceHook.exportData(),
        budgets: budgetsHook.actions.exportData(),
        bundle: bundleHook.actions.exportReport(),
        lazyLoading: lazyLoadingHook.state
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Performance</h1>
          <p className="text-muted-foreground">
            Monitoramento e otimização completa de performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(systemHealth.status)}>
            {getStatusIcon(systemHealth.status)}
            <span className="ml-1 capitalize">{systemHealth.status}</span>
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={updateStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Zap className="h-4 w-4 mr-2" />
            Otimização
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Health Alert */}
          {systemHealth.issues.length > 0 && (
            <Alert className={`border-l-4 ${systemHealth.status === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {systemHealth.issues.length} problema(s) detectado(s):
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {systemHealth.issues.map((issue, index) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                  {systemHealth.recommendations.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm">Recomendações:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {systemHealth.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score de Performance</p>
                    <p className="text-2xl font-bold">{stats.performanceScore}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Otimizações Ativas</p>
                    <p className="text-2xl font-bold">{stats.activeOptimizations}</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Violações de Budget</p>
                    <p className="text-2xl font-bold text-red-600">{stats.budgetViolations}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Cache</p>
                    <p className="text-2xl font-bold">{Math.round(stats.cacheHitRate * 100)}%</p>
                  </div>
                  <Database className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bundle & Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tamanho do Bundle:</span>
                  <span className="font-medium">{formatBytes(stats.bundleSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Componentes Lazy:</span>
                  <span className="font-medium">{stats.lazyLoadedComponents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Análise:</span>
                  <span className="font-medium">
                    {stats.lastAnalysis.toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">A/B Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Testes Ativos:</span>
                  <span className="font-medium">{stats.abTestsRunning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={stats.abTestsRunning > 0 ? 'default' : 'secondary'}>
                    {stats.abTestsRunning > 0 ? 'Executando' : 'Inativo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime:</span>
                  <span className="font-medium">{formatUptime(systemHealth.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(systemHealth.status)}>
                    {systemHealth.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization">
          <PerformanceOptimizationPanel />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <PerformanceConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceDashboard;