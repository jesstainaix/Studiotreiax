import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  Target,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Bell,
  TrendingUp,
  TrendingDown,
  Settings,
  Play,
  Pause,
  Download,
  Upload,
  BarChart3,
  Calendar
} from 'lucide-react';
import { usePerformanceBudgets } from '../../hooks/useRealPerformanceBudgets';
import { webVitalsTracker } from '../../utils/webVitalsTracker';

interface BudgetFormData {
  name: string;
  metric: string;
  threshold: number;
  warningThreshold: number;
  enabled: boolean;
  description: string;
}

const METRIC_OPTIONS = [
  { value: 'lcp', label: 'Largest Contentful Paint (ms)' },
  { value: 'fid', label: 'First Input Delay (ms)' },
  { value: 'cls', label: 'Cumulative Layout Shift' },
  { value: 'fcp', label: 'First Contentful Paint (ms)' },
  { value: 'ttfb', label: 'Time to First Byte (ms)' },
  { value: 'bundle-size', label: 'Bundle Size (KB)' },
  { value: 'memory-usage', label: 'Memory Usage (%)' },
  { value: 'cpu-usage', label: 'CPU Usage (%)' },
  { value: 'network-latency', label: 'Network Latency (ms)' }
];

export function PerformanceBudgetsPanel() {
  const { state, actions } = usePerformanceBudgets({
    autoMonitoring: true,
    alertThreshold: 3,
    enableNotifications: true,
    enableABTesting: false
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    metric: '',
    threshold: 0,
    warningThreshold: 0,
    enabled: true,
    description: ''
  });

  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Web Vitals tracking
    if (typeof window !== 'undefined') {
      webVitalsTracker.init();
    }
    
    // Auto-start monitoring if not already running
    if (!state.isMonitoring) {
      actions.startMonitoring();
    }
  }, [state.isMonitoring, actions]);

  const handleCreateBudget = async () => {
    if (!formData.name || !formData.metric || formData.threshold <= 0) {
      return;
    }

    try {
      await actions.createBudget({
        name: formData.name,
        targets: [formData.metric],
        threshold: formData.threshold,
        warningThreshold: formData.warningThreshold || formData.threshold * 0.8,
        enabled: formData.enabled,
        description: formData.description,
        type: 'performance',
        alertConfig: {
          email: true,
          webhook: false,
          severity: 'warning'
        }
      });

      setFormData({
        name: '',
        metric: '',
        threshold: 0,
        warningThreshold: 0,
        enabled: true,
        description: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      await actions.deleteBudget(budgetId);
    }
  };

  const getMetricUnit = (metric: string): string => {
    switch (metric) {
      case 'lcp':
      case 'fid':
      case 'fcp':
      case 'ttfb':
      case 'network-latency':
        return 'ms';
      case 'cls':
        return '';
      case 'bundle-size':
        return 'KB';
      case 'memory-usage':
      case 'cpu-usage':
        return '%';
      default:
        return '';
    }
  };

  const getBudgetStatus = (budget: { threshold: number; warningThreshold: number }, currentValue?: number): 'good' | 'warning' | 'critical' => {
    if (currentValue === undefined) return 'good';
    
    if (currentValue > budget.threshold) return 'critical';
    if (currentValue > budget.warningThreshold) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get real current values from metrics
  const getCurrentValue = (metric: string): number => {
    if (!state.currentMetrics) return 0;
    
    const metrics = state.currentMetrics;
    switch (metric) {
      case 'lcp':
        return webVitalsTracker.getMetrics().lcp || 0;
      case 'fid':
        return webVitalsTracker.getMetrics().fid || 0;
      case 'cls':
        return webVitalsTracker.getMetrics().cls || 0;
      case 'fcp':
        return webVitalsTracker.getMetrics().fcp || 0;
      case 'ttfb':
        return webVitalsTracker.getMetrics().ttfb || 0;
      case 'bundle-size':
        return metrics.resources.totalSize / 1024; // Convert to KB
      case 'memory-usage':
        return metrics.memory.percentage;
      case 'cpu-usage':
        return metrics.cpu.usage;
      case 'network-latency':
        return metrics.network.latency;
      default:
        return 0;
    }
  };

  const violationTrend = state.violations.slice(-10).map((violation, index) => ({
    time: new Date(violation.timestamp).toLocaleTimeString(),
    count: state.violations.slice(0, index + 1).filter(v => 
      new Date(v.timestamp).toDateString() === new Date(violation.timestamp).toDateString()
    ).length
  }));

  const budgetCompliance = state.budgets.map(budget => {
    const metric = budget.targets[0]; // Use first target as primary metric
    const currentValue = getCurrentValue(metric);
    const status = getBudgetStatus(budget, currentValue);
    const compliance = Math.max(0, Math.min(100, 100 - ((currentValue - budget.threshold) / budget.threshold) * 100));
    
    return {
      name: budget.name,
      compliance,
      status
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orçamentos de Performance</h2>
          <p className="text-muted-foreground">
            Defina e monitore metas de performance com alertas automáticos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const report = actions.exportData();
              const blob = new Blob([report], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-budgets-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={state.budgets.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={state.isMonitoring ? actions.stopMonitoring : actions.startMonitoring}
          >
            {state.isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {state.isMonitoring ? 'Pausar' : 'Iniciar'} Monitoramento
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.budgets.filter(b => b.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              {state.budgets.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violações Hoje</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {state.violations.filter(v => 
                new Date(v.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {state.violations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {state.alerts.filter(a => !a.acknowledged).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {state.alerts.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {budgetCompliance.length > 0 
                ? `${Math.round(budgetCompliance.reduce((acc, b) => acc + b.compliance, 0) / budgetCompliance.length)}%`
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              dos orçamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Status */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <div className={`h-2 w-2 rounded-full ${state.isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-sm">
          {state.isMonitoring ? 'Monitoramento ativo' : 'Monitoramento pausado'}
        </span>
        {state.isMonitoring && (
          <span className="text-xs text-muted-foreground ml-4">
            Checagem a cada 30 segundos
          </span>
        )}
      </div>

      {/* Budget Creation Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Orçamento</CardTitle>
            <CardDescription>
              Defina metas de performance com alertas automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget-name">Nome do Orçamento</Label>
                <Input
                  id="budget-name"
                  placeholder="Ex: LCP Mobile"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-metric">Métrica</Label>
                <Select value={formData.metric} onValueChange={(value) => setFormData({ ...formData, metric: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-threshold">Limite Crítico ({getMetricUnit(formData.metric)})</Label>
                <Input
                  id="budget-threshold"
                  type="number"
                  placeholder="2500"
                  value={formData.threshold || ''}
                  onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-warning">Limite de Aviso ({getMetricUnit(formData.metric)})</Label>
                <Input
                  id="budget-warning"
                  type="number"
                  placeholder="2000"
                  value={formData.warningThreshold || ''}
                  onChange={(e) => setFormData({ ...formData, warningThreshold: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-description">Descrição (opcional)</Label>
              <Input
                id="budget-description"
                placeholder="Objetivo para LCP em dispositivos móveis"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="budget-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="budget-enabled">Ativo</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateBudget}>
                Criar Orçamento
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      <div className="space-y-4">
        {state.budgets.map((budget) => {
          const metric = budget.targets[0]; // Use first target as primary metric
          const currentValue = getCurrentValue(metric);
          const status = getBudgetStatus(budget, currentValue);
          const compliance = Math.max(0, Math.min(100, 100 - ((currentValue - budget.threshold) / budget.threshold) * 100));

          return (
            <Card key={budget.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <h4 className="font-medium">{budget.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {METRIC_OPTIONS.find(m => m.value === metric)?.label || metric}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getStatusColor(status)}`}>
                        {currentValue.toFixed(metric === 'cls' ? 3 : 0)}{getMetricUnit(metric)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Limite: {budget.threshold}{getMetricUnit(metric)}
                      </div>
                    </div>
                    <div className="w-24">
                      <Progress value={compliance} className="h-2" />
                      <div className="text-xs text-center mt-1">{Math.round(compliance)}%</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {state.budgets.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum orçamento configurado</h3>
              <p className="text-muted-foreground mb-4">
                Crie orçamentos de performance para monitorar suas métricas automaticamente
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Alerts */}
      {state.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <AlertTriangle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                  {!alert.acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.acknowledgeAlert(alert.id)}
                    >
                      Reconhecer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {(violationTrend.length > 0 || budgetCompliance.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {violationTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Violações</CardTitle>
                <CardDescription>Violações de orçamento ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={violationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {budgetCompliance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conformidade dos Orçamentos</CardTitle>
                <CardDescription>Percentual de conformidade por orçamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={budgetCompliance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Conformidade']} />
                    <Bar 
                      dataKey="compliance" 
                      fill="#3b82f6"
                      name="Conformidade"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}