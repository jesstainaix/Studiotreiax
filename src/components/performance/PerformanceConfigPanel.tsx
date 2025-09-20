import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Settings,
  Monitor,
  Zap,
  Shield,
  Database,
  Network,
  TestTube,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import { usePerformanceBudgets } from '../../hooks/usePerformanceBudgets';
import { useLazyLoading } from '../../hooks/useLazyLoading';
import { useBundleAnalysis } from '../../hooks/useBundleAnalysis';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    interval: number;
    metrics: string[];
    autoOptimize: boolean;
  };
  budgets: {
    enabled: boolean;
    autoMonitoring: boolean;
    alertThreshold: number;
    enableNotifications: boolean;
  };
  lazyLoading: {
    enabled: boolean;
    threshold: number;
    preloadDistance: number;
    retryAttempts: number;
  };
  bundleAnalysis: {
    enabled: boolean;
    autoAnalysis: boolean;
    analysisInterval: number;
    autoOptimization: boolean;
  };
  cache: {
    enabled: boolean;
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxAge: number;
    maxEntries: number;
  };
  abTesting: {
    enabled: boolean;
    defaultTrafficSplit: number;
    minSampleSize: number;
    confidenceLevel: number;
  };
}

const defaultConfig: PerformanceConfig = {
  monitoring: {
    enabled: true,
    interval: 5000,
    metrics: ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'],
    autoOptimize: false
  },
  budgets: {
    enabled: true,
    autoMonitoring: true,
    alertThreshold: 3,
    enableNotifications: true
  },
  lazyLoading: {
    enabled: true,
    threshold: 0.1,
    preloadDistance: 200,
    retryAttempts: 3
  },
  bundleAnalysis: {
    enabled: true,
    autoAnalysis: true,
    analysisInterval: 3600000,
    autoOptimization: false
  },
  cache: {
    enabled: true,
    strategy: 'stale-while-revalidate',
    maxAge: 86400000,
    maxEntries: 100
  },
  abTesting: {
    enabled: true,
    defaultTrafficSplit: 50,
    minSampleSize: 100,
    confidenceLevel: 95
  }
};

export function PerformanceConfigPanel() {
  const [config, setConfig] = useState<PerformanceConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);

  const performanceHook = usePerformanceOptimization({
    monitoringInterval: config.monitoring.interval,
    enableAutoOptimization: config.monitoring.autoOptimize
  });

  const budgetsHook = usePerformanceBudgets({
    autoMonitoring: config.budgets.autoMonitoring,
    alertThreshold: config.budgets.alertThreshold,
    enableNotifications: config.budgets.enableNotifications,
    enableABTesting: config.abTesting.enabled
  });

  const lazyLoadingHook = useLazyLoading({
    threshold: config.lazyLoading.threshold,
    preloadDistance: config.lazyLoading.preloadDistance,
    retryAttempts: config.lazyLoading.retryAttempts
  });

  const bundleHook = useBundleAnalysis({
    autoAnalysis: config.bundleAnalysis.autoAnalysis,
    analysisInterval: config.bundleAnalysis.analysisInterval,
    autoOptimization: config.bundleAnalysis.autoOptimization
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('performance-config');
      if (saved) {
        setConfig({ ...defaultConfig, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setSaveStatus('saving');
      localStorage.setItem('performance-config', JSON.stringify(config));
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const exportConfig = () => {
    const exportData = {
      config,
      performance: performanceHook.exportData(),
      budgets: budgetsHook.actions.exportData(),
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfig = async () => {
    try {
      const data = JSON.parse(importData);
      
      if (data.config) {
        setConfig({ ...defaultConfig, ...data.config });
        setHasChanges(true);
      }
      
      if (data.budgets) {
        await budgetsHook.actions.importData(data.budgets);
      }
      
      setShowImport(false);
      setImportData('');
    } catch (error) {
      console.error('Erro ao importar configuração:', error);
    }
  };

  const updateConfig = (section: keyof PerformanceConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const sections: ConfigSection[] = [
    {
      id: 'monitoring',
      title: 'Monitoramento',
      description: 'Configurações de monitoramento de performance',
      icon: <Monitor className="h-4 w-4" />,
      enabled: config.monitoring.enabled
    },
    {
      id: 'budgets',
      title: 'Budgets',
      description: 'Limites e alertas de performance',
      icon: <Shield className="h-4 w-4" />,
      enabled: config.budgets.enabled
    },
    {
      id: 'lazyLoading',
      title: 'Lazy Loading',
      description: 'Carregamento sob demanda',
      icon: <Zap className="h-4 w-4" />,
      enabled: config.lazyLoading.enabled
    },
    {
      id: 'bundleAnalysis',
      title: 'Análise de Bundle',
      description: 'Otimização de pacotes JavaScript',
      icon: <Database className="h-4 w-4" />,
      enabled: config.bundleAnalysis.enabled
    },
    {
      id: 'cache',
      title: 'Cache',
      description: 'Estratégias de cache',
      icon: <Network className="h-4 w-4" />,
      enabled: config.cache.enabled
    },
    {
      id: 'abTesting',
      title: 'A/B Testing',
      description: 'Testes de performance',
      icon: <TestTube className="h-4 w-4" />,
      enabled: config.abTesting.enabled
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saving': return 'bg-yellow-500';
      case 'saved': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações de Performance</h2>
          <p className="text-muted-foreground">
            Configure todos os aspectos do sistema de otimização
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(!showImport)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportConfig}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetConfig}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          
          <Button
            onClick={saveConfig}
            disabled={!hasChanges || saveStatus === 'saving'}
            className={`${getStatusColor(saveStatus)} text-white`}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveStatus === 'saving' ? 'Salvando...' : 
             saveStatus === 'saved' ? 'Salvo!' : 
             saveStatus === 'error' ? 'Erro!' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <Card>
          <CardHeader>
            <CardTitle>Importar Configuração</CardTitle>
            <CardDescription>
              Cole aqui o JSON de configuração exportado anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full h-32 p-3 border rounded-md font-mono text-sm"
              placeholder="Cole o JSON de configuração aqui..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={importConfig} disabled={!importData.trim()}>
                Importar
              </Button>
              <Button variant="outline" onClick={() => setShowImport(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sections.map((section) => (
          <Card key={section.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab(section.id)}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {section.icon}
                {section.enabled && (
                  <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
                )}
              </div>
              <h3 className="font-medium text-sm">{section.title}</h3>
              <Badge variant={section.enabled ? 'default' : 'secondary'} className="mt-1">
                {section.enabled ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="text-xs">
              {section.icon}
              <span className="ml-1 hidden sm:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Performance</CardTitle>
              <CardDescription>
                Configure como o sistema monitora as métricas de performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="monitoring-enabled">Habilitar Monitoramento</Label>
                <Switch
                  id="monitoring-enabled"
                  checked={config.monitoring.enabled}
                  onCheckedChange={(checked) => updateConfig('monitoring', 'enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monitoring-interval">Intervalo de Monitoramento (ms)</Label>
                <Input
                  id="monitoring-interval"
                  type="number"
                  value={config.monitoring.interval}
                  onChange={(e) => updateConfig('monitoring', 'interval', parseInt(e.target.value))}
                  min="1000"
                  max="60000"
                  step="1000"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-optimize">Otimização Automática</Label>
                <Switch
                  id="auto-optimize"
                  checked={config.monitoring.autoOptimize}
                  onCheckedChange={(checked) => updateConfig('monitoring', 'autoOptimize', checked)}
                />
              </div>
              
              {config.monitoring.autoOptimize && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    A otimização automática pode afetar a experiência do usuário. Use com cuidado.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budgets de Performance</CardTitle>
              <CardDescription>
                Configure limites e alertas para métricas de performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="budgets-enabled">Habilitar Budgets</Label>
                <Switch
                  id="budgets-enabled"
                  checked={config.budgets.enabled}
                  onCheckedChange={(checked) => updateConfig('budgets', 'enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-monitoring">Monitoramento Automático</Label>
                <Switch
                  id="auto-monitoring"
                  checked={config.budgets.autoMonitoring}
                  onCheckedChange={(checked) => updateConfig('budgets', 'autoMonitoring', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alert-threshold">Limite de Alertas</Label>
                <Input
                  id="alert-threshold"
                  type="number"
                  value={config.budgets.alertThreshold}
                  onChange={(e) => updateConfig('budgets', 'alertThreshold', parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-notifications">Notificações</Label>
                <Switch
                  id="enable-notifications"
                  checked={config.budgets.enableNotifications}
                  onCheckedChange={(checked) => updateConfig('budgets', 'enableNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lazy Loading Tab */}
        <TabsContent value="lazyLoading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lazy Loading</CardTitle>
              <CardDescription>
                Configure o carregamento sob demanda de componentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="lazy-enabled">Habilitar Lazy Loading</Label>
                <Switch
                  id="lazy-enabled"
                  checked={config.lazyLoading.enabled}
                  onCheckedChange={(checked) => updateConfig('lazyLoading', 'enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold de Intersecção</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={config.lazyLoading.threshold}
                  onChange={(e) => updateConfig('lazyLoading', 'threshold', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preload-distance">Distância de Preload (px)</Label>
                <Input
                  id="preload-distance"
                  type="number"
                  value={config.lazyLoading.preloadDistance}
                  onChange={(e) => updateConfig('lazyLoading', 'preloadDistance', parseInt(e.target.value))}
                  min="0"
                  max="1000"
                  step="50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retry-attempts">Tentativas de Retry</Label>
                <Input
                  id="retry-attempts"
                  type="number"
                  value={config.lazyLoading.retryAttempts}
                  onChange={(e) => updateConfig('lazyLoading', 'retryAttempts', parseInt(e.target.value))}
                  min="0"
                  max="10"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundle Analysis Tab */}
        <TabsContent value="bundleAnalysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Bundle</CardTitle>
              <CardDescription>
                Configure a análise e otimização de pacotes JavaScript
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="bundle-enabled">Habilitar Análise</Label>
                <Switch
                  id="bundle-enabled"
                  checked={config.bundleAnalysis.enabled}
                  onCheckedChange={(checked) => updateConfig('bundleAnalysis', 'enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-analysis">Análise Automática</Label>
                <Switch
                  id="auto-analysis"
                  checked={config.bundleAnalysis.autoAnalysis}
                  onCheckedChange={(checked) => updateConfig('bundleAnalysis', 'autoAnalysis', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="analysis-interval">Intervalo de Análise (ms)</Label>
                <Input
                  id="analysis-interval"
                  type="number"
                  value={config.bundleAnalysis.analysisInterval}
                  onChange={(e) => updateConfig('bundleAnalysis', 'analysisInterval', parseInt(e.target.value))}
                  min="300000"
                  max="86400000"
                  step="300000"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-optimization">Otimização Automática</Label>
                <Switch
                  id="auto-optimization"
                  checked={config.bundleAnalysis.autoOptimization}
                  onCheckedChange={(checked) => updateConfig('bundleAnalysis', 'autoOptimization', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estratégias de Cache</CardTitle>
              <CardDescription>
                Configure como o sistema gerencia o cache
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cache-enabled">Habilitar Cache</Label>
                <Switch
                  id="cache-enabled"
                  checked={config.cache.enabled}
                  onCheckedChange={(checked) => updateConfig('cache', 'enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cache-strategy">Estratégia de Cache</Label>
                <select
                  id="cache-strategy"
                  className="w-full p-2 border rounded-md"
                  value={config.cache.strategy}
                  onChange={(e) => updateConfig('cache', 'strategy', e.target.value)}
                >
                  <option value="cache-first">Cache First</option>
                  <option value="network-first">Network First</option>
                  <option value="stale-while-revalidate">Stale While Revalidate</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-age">Idade Máxima (ms)</Label>
                <Input
                  id="max-age"
                  type="number"
                  value={config.cache.maxAge}
                  onChange={(e) => updateConfig('cache', 'maxAge', parseInt(e.target.value))}
                  min="3600000"
                  max="604800000"
                  step="3600000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-entries">Máximo de Entradas</Label>
                <Input
                  id="max-entries"
                  type="number"
                  value={config.cache.maxEntries}
                  onChange={(e) => updateConfig('cache', 'maxEntries', parseInt(e.target.value))}
                  min="10"
                  max="1000"
                  step="10"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="abTesting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing</CardTitle>
              <CardDescription>
                Configure testes A/B para otimizações de performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ab-enabled">Habilitar A/B Testing</Label>
                <Switch
                  id="ab-enabled"
                  checked={config.abTesting.enabled}
                  onCheckedChange={(checked) => updateConfig('abTesting', 'enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="traffic-split">Divisão de Tráfego Padrão (%)</Label>
                <Input
                  id="traffic-split"
                  type="number"
                  value={config.abTesting.defaultTrafficSplit}
                  onChange={(e) => updateConfig('abTesting', 'defaultTrafficSplit', parseInt(e.target.value))}
                  min="10"
                  max="90"
                  step="5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min-sample">Tamanho Mínimo da Amostra</Label>
                <Input
                  id="min-sample"
                  type="number"
                  value={config.abTesting.minSampleSize}
                  onChange={(e) => updateConfig('abTesting', 'minSampleSize', parseInt(e.target.value))}
                  min="50"
                  max="10000"
                  step="50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confidence-level">Nível de Confiança (%)</Label>
                <Input
                  id="confidence-level"
                  type="number"
                  value={config.abTesting.confidenceLevel}
                  onChange={(e) => updateConfig('abTesting', 'confidenceLevel', parseInt(e.target.value))}
                  min="80"
                  max="99"
                  step="1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceConfigPanel;