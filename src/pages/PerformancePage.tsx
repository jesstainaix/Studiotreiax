import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Activity,
  Zap,
  Settings,
  BarChart3,
  Monitor,
  Shield,
  Database,
  Network,
  TestTube,
  Info,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  Target
} from 'lucide-react';
import { PerformanceDashboard } from '../components/performance/PerformanceDashboard';
import { WebVitalsMonitor } from '../components/performance/WebVitalsMonitor';
import { RealTimePerformanceMonitor } from '../components/performance/RealTimePerformanceMonitor';
import { BundleAnalysisPanel } from '../components/performance/BundleAnalysisPanel';
import { PerformanceBudgetsPanel } from '../components/performance/PerformanceBudgetsPanel';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';
import { usePerformanceBudgets } from '../hooks/usePerformanceBudgets';
import { useLazyLoading } from '../hooks/useLazyLoading';
import { useBundleAnalysis } from '../hooks/useBundleAnalysis';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'warning';
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export function PerformancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [features, setFeatures] = useState<FeatureCard[]>([]);
  const [systemStatus, setSystemStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');

  // Initialize all performance hooks
  const performanceHook = usePerformanceOptimization({
    monitoringInterval: 5000,
    enableAutoOptimization: false
  });

  const budgetsHook = usePerformanceBudgets({
    autoMonitoring: true,
    alertThreshold: 3,
    enableNotifications: true,
    enableABTesting: true
  });

  const lazyLoadingHook = useLazyLoading({
    threshold: 0.1,
    preloadDistance: 200,
    retryAttempts: 3
  });

  const bundleHook = useBundleAnalysis({
    autoAnalysis: true,
    analysisInterval: 3600000,
    autoOptimization: false
  });

  useEffect(() => {
    initializeSystem();
  }, []);

  useEffect(() => {
    updateFeatureStatus();
  }, [
    performanceHook.isMonitoring,
    budgetsHook.state.budgets,
    lazyLoadingHook.state.isEnabled,
    bundleHook.state.isAnalyzing
  ]);

  const initializeSystem = async () => {
    try {
      setSystemStatus('initializing');
      
      // Start performance monitoring
      performanceHook.startMonitoring();
      
      // Create default performance budgets
      await createDefaultBudgets();
      
      // Initialize bundle analysis
      bundleHook.actions.startAnalysis();
      
      // Setup lazy loading
      lazyLoadingHook.actions.enable();
      
      setSystemStatus('ready');
    } catch (error) {
      console.error('Erro ao inicializar sistema de performance:', error);
      setSystemStatus('error');
    }
  };

  const createDefaultBudgets = async () => {
    const defaultBudgets = [
      {
        id: 'lcp-budget',
        name: 'Largest Contentful Paint',
        metric: 'lcp' as const,
        threshold: 2500,
        warning: 2000,
        enabled: true
      },
      {
        id: 'fid-budget',
        name: 'First Input Delay',
        metric: 'fid' as const,
        threshold: 100,
        warning: 75,
        enabled: true
      },
      {
        id: 'cls-budget',
        name: 'Cumulative Layout Shift',
        metric: 'cls' as const,
        threshold: 0.1,
        warning: 0.05,
        enabled: true
      },
      {
        id: 'bundle-budget',
        name: 'Bundle Size',
        metric: 'bundleSize' as const,
        threshold: 1000000, // 1MB
        warning: 800000, // 800KB
        enabled: true
      }
    ];

    for (const budget of defaultBudgets) {
      await budgetsHook.actions.createBudget(budget);
    }
  };

  const updateFeatureStatus = () => {
    const newFeatures: FeatureCard[] = [
      {
        id: 'monitoring',
        title: 'Monitoramento de Performance',
        description: 'Coleta automática de métricas Web Vitals e performance',
        icon: <Monitor className="h-6 w-6" />,
        status: performanceHook.isMonitoring ? 'active' : 'inactive',
        metrics: [
          {
            label: 'LCP',
            value: `${Math.round(performanceHook.metrics?.lcp || 0)}ms`,
            trend: 'stable'
          },
          {
            label: 'FID',
            value: `${Math.round(performanceHook.metrics?.fid || 0)}ms`,
            trend: 'stable'
          },
          {
            label: 'CLS',
            value: (performanceHook.metrics?.cls || 0).toFixed(3),
            trend: 'stable'
          }
        ]
      },
      {
        id: 'budgets',
        title: 'Performance Budgets',
        description: 'Limites e alertas para métricas de performance',
        icon: <Shield className="h-6 w-6" />,
        status: budgetsHook.state.budgets.length > 0 ? 'active' : 'inactive',
        metrics: [
          {
            label: 'Budgets Ativos',
            value: budgetsHook.state.budgets.length,
            trend: 'stable'
          },
          {
            label: 'Violações',
            value: budgetsHook.state.violations.length,
            trend: budgetsHook.state.violations.length > 0 ? 'up' : 'stable'
          },
          {
            label: 'Alertas',
            value: budgetsHook.state.alerts.length,
            trend: 'stable'
          }
        ]
      },
      {
        id: 'lazy-loading',
        title: 'Lazy Loading',
        description: 'Carregamento otimizado de componentes e recursos',
        icon: <Zap className="h-6 w-6" />,
        status: lazyLoadingHook.state.isEnabled ? 'active' : 'inactive',
        metrics: [
          {
            label: 'Componentes Carregados',
            value: lazyLoadingHook.state.loadedComponents.length,
            trend: 'up'
          },
          {
            label: 'Na Fila',
            value: lazyLoadingHook.state.loadingQueue.length,
            trend: 'stable'
          },
          {
            label: 'Falhas',
            value: lazyLoadingHook.state.failedComponents.length,
            trend: lazyLoadingHook.state.failedComponents.length > 0 ? 'up' : 'stable'
          }
        ]
      },
      {
        id: 'bundle-analysis',
        title: 'Análise de Bundle',
        description: 'Otimização e análise de pacotes JavaScript',
        icon: <Database className="h-6 w-6" />,
        status: bundleHook.state.isAnalyzing ? 'active' : 'inactive',
        metrics: [
          {
            label: 'Tamanho Total',
            value: formatBytes(bundleHook.state.analysis?.totalSize || 0),
            trend: 'stable'
          },
          {
            label: 'Chunks',
            value: bundleHook.state.analysis?.chunks?.length || 0,
            trend: 'stable'
          },
          {
            label: 'Score',
            value: `${bundleHook.state.analysis?.score || 0}/100`,
            trend: 'stable'
          }
        ]
      },
      {
        id: 'cache',
        title: 'Gerenciamento de Cache',
        description: 'Estratégias inteligentes de cache',
        icon: <Network className="h-6 w-6" />,
        status: 'active',
        metrics: [
          {
            label: 'Taxa de Acerto',
            value: `${Math.round((performanceHook.metrics?.cache?.hitRate || 0) * 100)}%`,
            trend: 'up'
          },
          {
            label: 'Entradas',
            value: performanceHook.metrics?.cache?.entries || 0,
            trend: 'stable'
          },
          {
            label: 'Tamanho',
            value: formatBytes(performanceHook.metrics?.cache?.size || 0),
            trend: 'stable'
          }
        ]
      },
      {
        id: 'ab-testing',
        title: 'A/B Testing',
        description: 'Testes de otimizações de performance',
        icon: <TestTube className="h-6 w-6" />,
        status: budgetsHook.state.abTests.some(test => test.status === 'running') ? 'active' : 'inactive',
        metrics: [
          {
            label: 'Testes Ativos',
            value: budgetsHook.state.abTests.filter(test => test.status === 'running').length,
            trend: 'stable'
          },
          {
            label: 'Concluídos',
            value: budgetsHook.state.abTests.filter(test => test.status === 'completed').length,
            trend: 'up'
          },
          {
            label: 'Participantes',
            value: budgetsHook.state.abTests.reduce((total, test) => total + (test.participants || 0), 0),
            trend: 'up'
          }
        ]
      }
    ];

    setFeatures(newFeatures);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: FeatureCard['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: FeatureCard['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'inactive': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      case 'stable': return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const runPerformanceTest = async () => {
    try {
      // Trigger a comprehensive performance analysis
      await bundleHook.actions.analyzeBundle();
      
      // Generate performance report
      const report = performanceHook.generateReport();
      
      // Create A/B test for optimization
      await budgetsHook.actions.createABTest({
        name: 'Performance Optimization Test',
        description: 'Testing performance improvements',
        variants: [
          { id: 'control', name: 'Control', trafficPercentage: 50 },
          { id: 'optimized', name: 'Optimized', trafficPercentage: 50 }
        ],
        metrics: ['lcp', 'fid', 'cls'],
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        minSampleSize: 100
      });
    } catch (error) {
      console.error('Erro ao executar teste de performance:', error);
    }
  };

  if (showDashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowDashboard(false)}
          >
            ← Voltar para Visão Geral
          </Button>
        </div>
        <PerformanceDashboard />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Sistema de Otimização de Performance</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Sistema completo de monitoramento, análise e otimização de performance com 
          Web Vitals, budgets, lazy loading, análise de bundle e A/B testing.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge className={`${getStatusColor(systemStatus === 'ready' ? 'active' : systemStatus === 'error' ? 'warning' : 'inactive')} text-white`}>
            {getStatusIcon(systemStatus === 'ready' ? 'active' : systemStatus === 'error' ? 'warning' : 'inactive')}
            <span className="ml-2">
              {systemStatus === 'ready' ? 'Sistema Ativo' : 
               systemStatus === 'error' ? 'Erro no Sistema' : 'Inicializando...'}
            </span>
          </Badge>
          
          <Button
            onClick={() => setShowDashboard(true)}
            disabled={systemStatus !== 'ready'}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Abrir Dashboard
          </Button>
          
          <Button
            variant="outline"
            onClick={runPerformanceTest}
            disabled={systemStatus !== 'ready'}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Executar Teste
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {systemStatus === 'error' && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao inicializar o sistema de performance. Verifique o console para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      {systemStatus === 'initializing' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Inicializando sistema de performance... Isso pode levar alguns segundos.
          </AlertDescription>
        </Alert>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.status === 'active' ? 'bg-green-100' : feature.status === 'warning' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <Badge className={`${getStatusColor(feature.status)} text-white mt-1`}>
                      {getStatusIcon(feature.status)}
                      <span className="ml-1 capitalize">{feature.status}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            
            {feature.metrics && (
              <CardContent>
                <div className="space-y-3">
                  {feature.metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric.label}:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.value}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Execute ações comuns do sistema de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => performanceHook.startMonitoring()}
              disabled={performanceHook.isMonitoring}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Iniciar Monitoramento
            </Button>
            
            <Button
              variant="outline"
              onClick={() => bundleHook.actions.analyzeBundle()}
            >
              <Database className="h-4 w-4 mr-2" />
              Analisar Bundle
            </Button>
            
            <Button
              variant="outline"
              onClick={() => performanceHook.optimizePerformance()}
            >
              <Zap className="h-4 w-4 mr-2" />
              Otimizar Performance
            </Button>
            
            <Button
              variant="outline"
              onClick={() => performanceHook.generateReport()}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
          <CardDescription>
            Guia rápido para usar o sistema de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Monitoramento Automático</h4>
              <p className="text-sm text-muted-foreground">
                O sistema coleta automaticamente métricas Web Vitals (LCP, FID, CLS, FCP, TTFB) 
                e monitora performance em tempo real.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Performance Budgets</h4>
              <p className="text-sm text-muted-foreground">
                Configure limites para métricas importantes e receba alertas quando 
                os valores ultrapassarem os thresholds definidos.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Lazy Loading Inteligente</h4>
              <p className="text-sm text-muted-foreground">
                Componentes são carregados sob demanda com preload inteligente 
                baseado na proximidade e comportamento do usuário.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Análise de Bundle</h4>
              <p className="text-sm text-muted-foreground">
                Análise automática do tamanho do bundle, dependências duplicadas 
                e oportunidades de otimização.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">5. A/B Testing</h4>
              <p className="text-sm text-muted-foreground">
                Teste diferentes otimizações com grupos de controle para 
                validar melhorias de performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PerformancePage;