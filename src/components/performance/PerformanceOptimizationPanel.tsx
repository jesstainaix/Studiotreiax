import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Download, 
  FileText, 
  Gauge, 
  MemoryStick, 
  Monitor, 
  Play, 
  Settings, 
  Square, 
  TrendingDown, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import type { PerformanceIssue, OptimizationSuggestion, PerformanceBudget } from '@/hooks/usePerformanceOptimization';

const PerformanceOptimizationPanel: React.FC = () => {
  const {
    isMonitoring,
    isOptimizing,
    metrics,
    currentMetrics,
    issues,
    suggestions,
    budgets,
    reports,
    config,
    startMonitoring,
    stopMonitoring,
    applyOptimization,
    resolveIssue,
    updateConfig,
    generateReport,
    overallScore,
    criticalIssues,
    pendingSuggestions,
    implementedOptimizations
  } = usePerformanceOptimization();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  // Dados para gráficos
  const performanceData = metrics.slice(-20).map((metric, index) => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    fcp: metric.webVitals.fcp || 0,
    lcp: metric.webVitals.lcp || 0,
    fid: metric.webVitals.fid || 0,
    cls: (metric.webVitals.cls || 0) * 1000, // Multiplicar por 1000 para visualização
    memory: metric.memoryUsage.percentage,
    cpu: metric.cpuUsage
  }));

  const issuesByType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const issueChartData = Object.entries(issuesByType).map(([type, count]) => ({
    name: type.replace('-', ' ').toUpperCase(),
    value: count
  }));

  const suggestionsByCategory = suggestions.reduce((acc, suggestion) => {
    acc[suggestion.category] = (acc[suggestion.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const suggestionChartData = Object.entries(suggestionsByCategory).map(([category, count]) => ({
    name: category.replace('-', ' ').toUpperCase(),
    value: count,
    implemented: suggestions.filter(s => s.category === category && s.implemented).length
  }));

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Funções auxiliares
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleStartOptimization = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const handleGenerateReport = async () => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedPeriod) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }
    
    await generateReport({ start, end });
  };

  const handleExportReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${report.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Otimização de Performance</h1>
          <p className="text-gray-600 mt-1">Monitore e otimize a performance da sua aplicação</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleStartOptimization}
            variant={isMonitoring ? 'destructive' : 'default'}
            className="flex items-center gap-2"
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4" />
                Parar Monitoramento
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar Monitoramento
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore.toFixed(0)}/100
            </div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
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
            <CardTitle className="text-sm font-medium">Sugestões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingSuggestions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {implementedOptimizations} implementadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isMonitoring ? 'Monitorando' : 'Parado'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.length} medições coletadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
          <TabsTrigger value="otimizacoes">Otimizações</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Web Vitals em tempo real */}
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">FCP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentMetrics.webVitals.fcp?.toFixed(0) || 0}ms
                  </div>
                  <Progress 
                    value={Math.min(100, (currentMetrics.webVitals.fcp || 0) / 30)} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">LCP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentMetrics.webVitals.lcp?.toFixed(0) || 0}ms
                  </div>
                  <Progress 
                    value={Math.min(100, (currentMetrics.webVitals.lcp || 0) / 40)} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">FID</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentMetrics.webVitals.fid?.toFixed(0) || 0}ms
                  </div>
                  <Progress 
                    value={Math.min(100, (currentMetrics.webVitals.fid || 0) / 2)} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CLS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentMetrics.webVitals.cls?.toFixed(3) || 0}
                  </div>
                  <Progress 
                    value={Math.min(100, (currentMetrics.webVitals.cls || 0) * 1000)} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráfico de performance em tempo real */}
          <Card>
            <CardHeader>
              <CardTitle>Performance em Tempo Real</CardTitle>
              <CardDescription>Últimas 20 medições</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fcp" stroke="#8884d8" name="FCP (ms)" />
                  <Line type="monotone" dataKey="lcp" stroke="#82ca9d" name="LCP (ms)" />
                  <Line type="monotone" dataKey="fid" stroke="#ffc658" name="FID (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Uso de recursos */}
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MemoryStick className="h-5 w-5" />
                    Uso de Memória
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Usado</span>
                        <span>{(currentMetrics.memoryUsage.used / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <Progress value={currentMetrics.memoryUsage.percentage} className="mt-1" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: {(currentMetrics.memoryUsage.total / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Uso de CPU
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>CPU</span>
                        <span>{currentMetrics.cpuUsage.toFixed(1)}%</span>
                      </div>
                      <Progress value={currentMetrics.cpuUsage} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Análises */}
        <TabsContent value="analises" className="space-y-6">
          {/* Distribuição de problemas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Problemas</CardTitle>
                <CardDescription>Por tipo de problema</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={issueChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {issueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sugestões por Categoria</CardTitle>
                <CardDescription>Implementadas vs Pendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={suggestionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Total" />
                    <Bar dataKey="implemented" fill="#82ca9d" name="Implementadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Lista de problemas */}
          <Card>
            <CardHeader>
              <CardTitle>Problemas Detectados</CardTitle>
              <CardDescription>{issues.length} problemas encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(issue.severity)}>
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <h4 className="font-semibold">{issue.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          <strong>Impacto:</strong> {issue.impact}
                        </p>
                        <p className="text-sm text-blue-600">
                          <strong>Sugestão:</strong> {issue.suggestion}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {issue.autoFixAvailable && (
                          <Badge variant="outline" className="text-green-600">
                            Auto-fix
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveIssue(issue.id)}
                        >
                          Resolver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {issues.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Nenhum problema detectado!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Otimizações */}
        <TabsContent value="otimizacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões de Otimização</CardTitle>
              <CardDescription>{suggestions.length} sugestões disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{suggestion.category.replace('-', ' ').toUpperCase()}</Badge>
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          {suggestion.implemented && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Implementado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Melhoria esperada:</strong>
                            <p className="text-green-600">{suggestion.expectedImprovement}</p>
                          </div>
                          <div>
                            <strong>Dificuldade:</strong>
                            <p className={getDifficultyColor(suggestion.difficulty)}>
                              {suggestion.difficulty.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <strong>Tempo estimado:</strong>
                            <p className="text-gray-600">{suggestion.estimatedTime}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!suggestion.implemented && (
                          <Button
                            size="sm"
                            onClick={() => applyOptimization(suggestion.id)}
                            disabled={isOptimizing}
                          >
                            {isOptimizing ? (
                              <>
                                <Activity className="h-4 w-4 mr-2 animate-spin" />
                                Aplicando...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Aplicar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Nenhuma sugestão de otimização no momento!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Relatório</CardTitle>
              <CardDescription>Crie relatórios de performance personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Última hora</SelectItem>
                    <SelectItem value="24h">Últimas 24 horas</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados</CardTitle>
              <CardDescription>{reports.length} relatórios disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{report.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Score Geral:</strong>
                            <p className={getScoreColor(report.summary.overallScore)}>
                              {report.summary.overallScore.toFixed(0)}/100
                            </p>
                          </div>
                          <div>
                            <strong>Problemas:</strong>
                            <p className="text-red-600">{report.issues.length}</p>
                          </div>
                          <div>
                            <strong>Gerado em:</strong>
                            <p className="text-gray-600">
                              {report.generatedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <strong>Áreas de melhoria:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {report.summary.improvementAreas.map((area, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportReport(report.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum relatório gerado ainda.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets */}
        <TabsContent value="budgets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Budgets</CardTitle>
              <CardDescription>Defina limites para métricas de performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.map((budget) => (
                  <div key={budget.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{budget.description}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-sm">
                            <strong>Limite:</strong> {budget.threshold}
                          </div>
                          <div className="text-sm">
                            <strong>Atual:</strong> {budget.current}
                          </div>
                          <Badge 
                            variant={budget.status === 'pass' ? 'default' : budget.status === 'warning' ? 'secondary' : 'destructive'}
                          >
                            {budget.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {budgets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Monitor className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum budget configurado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Monitoramento</CardTitle>
              <CardDescription>Configure como o sistema monitora a performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="monitoring-enabled">Monitoramento Automático</Label>
                  <p className="text-sm text-muted-foreground">Ativar coleta automática de métricas</p>
                </div>
                <Switch
                  id="monitoring-enabled"
                  checked={config.monitoring.enabled}
                  onCheckedChange={(checked) => 
                    updateConfig({
                      ...config,
                      monitoring: { ...config.monitoring, enabled: checked }
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monitoring-interval">Intervalo de Coleta (ms)</Label>
                <Input
                  id="monitoring-interval"
                  type="number"
                  value={config.monitoring.interval}
                  onChange={(e) => 
                    updateConfig({
                      ...config,
                      monitoring: { ...config.monitoring, interval: parseInt(e.target.value) }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-optimize">Otimização Automática</Label>
                  <p className="text-sm text-muted-foreground">Aplicar otimizações automaticamente</p>
                </div>
                <Switch
                  id="auto-optimize"
                  checked={config.monitoring.autoOptimize}
                  onCheckedChange={(checked) => 
                    updateConfig({
                      ...config,
                      monitoring: { ...config.monitoring, autoOptimize: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites de Alerta</CardTitle>
              <CardDescription>Configure quando alertas devem ser disparados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fcp-threshold">FCP Limite (ms)</Label>
                  <Input
                    id="fcp-threshold"
                    type="number"
                    value={config.monitoring.alertThresholds.fcp}
                    onChange={(e) => 
                      updateConfig({
                        ...config,
                        monitoring: {
                          ...config.monitoring,
                          alertThresholds: {
                            ...config.monitoring.alertThresholds,
                            fcp: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lcp-threshold">LCP Limite (ms)</Label>
                  <Input
                    id="lcp-threshold"
                    type="number"
                    value={config.monitoring.alertThresholds.lcp}
                    onChange={(e) => 
                      updateConfig({
                        ...config,
                        monitoring: {
                          ...config.monitoring,
                          alertThresholds: {
                            ...config.monitoring.alertThresholds,
                            lcp: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memory-threshold">Memória Limite (%)</Label>
                  <Input
                    id="memory-threshold"
                    type="number"
                    value={config.monitoring.alertThresholds.memoryUsage}
                    onChange={(e) => 
                      updateConfig({
                        ...config,
                        monitoring: {
                          ...config.monitoring,
                          alertThresholds: {
                            ...config.monitoring.alertThresholds,
                            memoryUsage: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpu-threshold">CPU Limite (%)</Label>
                  <Input
                    id="cpu-threshold"
                    type="number"
                    value={config.monitoring.alertThresholds.cpuUsage}
                    onChange={(e) => 
                      updateConfig({
                        ...config,
                        monitoring: {
                          ...config.monitoring,
                          alertThresholds: {
                            ...config.monitoring.alertThresholds,
                            cpuUsage: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOptimizationPanel;