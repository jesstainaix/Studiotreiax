import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { VirtualizedList } from '../ui/VirtualizedList';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { useTestAutomation, TestCase, TestSuite, TestRun, TestReport, TestSchedule } from '../../hooks/useTestAutomation';
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Settings,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Code,
  Bug,
  Shield,
  Gauge,
  Users,
  Globe
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TestAutomationPanelProps {
  className?: string;
}

const TestAutomationPanel: React.FC<TestAutomationPanelProps> = ({ className }) => {
  const {
    runs,
    currentRun,
    suites,
    tests,
    reports,
    schedules,
    config,
    metrics,
    isRunning,
    isGenerating,
    coverage,
    logs,
    startTestRun,
    stopTestRun,
    runSingleTest,
    generateTestsFromInteractions,
    generateAITestSuggestions,
    analyzeCoverage,
    generateReport,
    exportReport,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    updateConfig,
    updateMetrics,
    detectFlakyTests,
    totalTests,
    passedTests,
    failedTests,
    runningTests,
    successRate,
    averageDuration
  } = useTestAutomation();

  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    cron: '',
    suites: [] as string[],
    enabled: true
  });

  // Atualizar métricas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Handlers
  const handleStartTests = async () => {
    await startTestRun();
  };

  const handleStopTests = () => {
    stopTestRun();
  };

  const handleRunSingleTest = async (testId: string) => {
    await runSingleTest(testId);
  };

  const handleGenerateTests = async () => {
    await generateTestsFromInteractions();
  };

  const handleAnalyzeCoverage = async () => {
    await analyzeCoverage();
  };

  const handleGenerateReport = async (type: TestReport['type']) => {
    await generateReport(type);
  };

  const handleExportReport = async (reportId: string, format: 'html' | 'json' | 'xml' | 'pdf') => {
    await exportReport(reportId, format);
  };

  const handleCreateSchedule = () => {
    if (newSchedule.name && newSchedule.cron) {
      createSchedule({
        ...newSchedule,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      setNewSchedule({ name: '', cron: '', suites: [], enabled: true });
    }
  };

  const handleUpdateConfig = (updates: any) => {
    updateConfig(updates);
  };

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'skipped': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'skipped': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'unit': return <Code className="w-4 h-4" />;
      case 'integration': return <Activity className="w-4 h-4" />;
      case 'e2e': return <Globe className="w-4 h-4" />;
      case 'visual': return <Eye className="w-4 h-4" />;
      case 'accessibility': return <Shield className="w-4 h-4" />;
      case 'performance': return <Gauge className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  // Filtrar testes
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || test.type === filterType;
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Dados para gráficos
  const coverageTrendData = metrics.coverageTrend.map(item => ({
    date: item.date.toLocaleDateString(),
    coverage: item.coverage
  }));

  const testTypeDistribution = [
    { name: 'Unit', value: tests.filter(t => t.type === 'unit').length, color: '#8884d8' },
    { name: 'Integration', value: tests.filter(t => t.type === 'integration').length, color: '#82ca9d' },
    { name: 'E2E', value: tests.filter(t => t.type === 'e2e').length, color: '#ffc658' },
    { name: 'Visual', value: tests.filter(t => t.type === 'visual').length, color: '#ff7300' },
    { name: 'Accessibility', value: tests.filter(t => t.type === 'accessibility').length, color: '#00ff00' },
    { name: 'Performance', value: tests.filter(t => t.type === 'performance').length, color: '#ff0000' }
  ];

  const testStatusData = [
    { name: 'Passed', value: passedTests, color: '#22c55e' },
    { name: 'Failed', value: failedTests, color: '#ef4444' },
    { name: 'Running', value: runningTests, color: '#3b82f6' },
    { name: 'Pending', value: totalTests - passedTests - failedTests - runningTests, color: '#6b7280' }
  ];

  const performanceData = runs.slice(-10).map((run, index) => ({
    run: `Run ${index + 1}`,
    duration: run.duration / 1000,
    tests: run.totalTests,
    success: (run.passedTests / run.totalTests) * 100
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automação de Testes</h1>
          <p className="text-muted-foreground">
            Sistema completo de automação e análise de testes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStartTests}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Executando...' : 'Executar Testes'}
          </Button>
          {isRunning && (
            <Button
              onClick={handleStopTests}
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          )}
          <Button
            onClick={handleGenerateTests}
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Gerar Testes IA
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {runningTests > 0 && `${runningTests} executando`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {passedTests} de {totalTests} testes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {coverage.lines.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Linhas de código
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(averageDuration / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Por teste
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Execução atual */}
      {currentRun && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Execução Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentRun.name}</span>
                <Badge className={getStatusColor(currentRun.status)}>
                  {currentRun.status}
                </Badge>
              </div>
              <Progress 
                value={(currentRun.passedTests + currentRun.failedTests) / currentRun.totalTests * 100} 
                className="w-full" 
              />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-green-600">{currentRun.passedTests}</div>
                  <div className="text-muted-foreground">Passou</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">{currentRun.failedTests}</div>
                  <div className="text-muted-foreground">Falhou</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-600">{currentRun.skippedTests}</div>
                  <div className="text-muted-foreground">Pulou</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{currentRun.totalTests}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="coverage">Cobertura</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendência de cobertura */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Cobertura</CardTitle>
                <CardDescription>
                  Evolução da cobertura de código nos últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={coverageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="coverage" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>
                  Quantidade de testes por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={testTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status dos testes */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Testes</CardTitle>
                <CardDescription>
                  Estado atual de todos os testes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={testStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {testStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance das execuções */}
            <Card>
              <CardHeader>
                <CardTitle>Performance das Execuções</CardTitle>
                <CardDescription>
                  Duração e taxa de sucesso das últimas execuções
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="run" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="duration" fill="#8884d8" name="Duração (s)" />
                    <Line yAxisId="right" type="monotone" dataKey="success" stroke="#82ca9d" name="Taxa de Sucesso (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Testes instáveis */}
          {metrics.flakyTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Testes Instáveis Detectados
                </CardTitle>
                <CardDescription>
                  Testes que falharam inconsistentemente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.flakyTests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(test.type)}
                        <span className="font-medium">{test.name}</span>
                        <Badge variant="outline">{test.type}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunSingleTest(test.id)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Executar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Testes */}
        <TabsContent value="tests" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-filter">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="e2e">E2E</SelectItem>
                      <SelectItem value="visual">Visual</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="passed">Passou</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="running">Executando</SelectItem>
                      <SelectItem value="skipped">Pulado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de testes */}
          <Card>
            <CardHeader>
              <CardTitle>Testes ({filteredTests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <VirtualizedList
                items={filteredTests}
                itemHeight={80}
                containerHeight={400}
                keyExtractor={(test) => test.id}
                renderItem={(test) => (
                  <div className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${getStatusColor(test.status)}`}>
                        {getStatusIcon(test.status)}
                      </div>
                      {getTypeIcon(test.type)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-muted-foreground">{test.description}</div>
                        <div className="text-xs text-muted-foreground">{test.file}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{test.type}</Badge>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      {test.duration > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {(test.duration / 1000).toFixed(2)}s
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunSingleTest(test.id)}
                        disabled={test.status === 'running'}
                      >
                        {test.status === 'running' ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cobertura */}
        <TabsContent value="coverage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métricas de cobertura */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Cobertura</CardTitle>
                <CardDescription>
                  Análise detalhada da cobertura de código
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Linhas</span>
                    <span className="font-bold">{coverage.lines.toFixed(1)}%</span>
                  </div>
                  <Progress value={coverage.lines} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Funções</span>
                    <span className="font-bold">{coverage.functions.toFixed(1)}%</span>
                  </div>
                  <Progress value={coverage.functions} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Branches</span>
                    <span className="font-bold">{coverage.branches.toFixed(1)}%</span>
                  </div>
                  <Progress value={coverage.branches} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Statements</span>
                    <span className="font-bold">{coverage.statements.toFixed(1)}%</span>
                  </div>
                  <Progress value={coverage.statements} className="w-full" />
                </div>
                <Button 
                  onClick={handleAnalyzeCoverage}
                  className="w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analisar Cobertura
                </Button>
              </CardContent>
            </Card>

            {/* Arquivos com baixa cobertura */}
            <Card>
              <CardHeader>
                <CardTitle>Arquivos com Baixa Cobertura</CardTitle>
                <CardDescription>
                  Arquivos que precisam de mais testes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coverage.files
                    .filter(file => file.lines < 80)
                    .map(file => (
                      <div key={file.path} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{file.path}</span>
                          <span className="text-sm text-red-600">
                            {file.lines.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={file.lines} className="w-full" />
                        <div className="text-xs text-muted-foreground">
                          Linhas não cobertas: {file.uncoveredLines.join(', ')}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          {/* Gerar relatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Gerar Relatórios</CardTitle>
              <CardDescription>
                Criar relatórios detalhados dos testes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button
                  onClick={() => handleGenerateReport('summary')}
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Resumo
                </Button>
                <Button
                  onClick={() => handleGenerateReport('detailed')}
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Detalhado
                </Button>
                <Button
                  onClick={() => handleGenerateReport('coverage')}
                  variant="outline"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Cobertura
                </Button>
                <Button
                  onClick={() => handleGenerateReport('performance')}
                  variant="outline"
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  Performance
                </Button>
                <Button
                  onClick={() => handleGenerateReport('accessibility')}
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Acessibilidade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de relatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.generatedAt.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportReport(report.id, 'html')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        HTML
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportReport(report.id, 'json')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        JSON
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automação */}
        <TabsContent value="automation" className="space-y-6">
          {/* Criar agendamento */}
          <Card>
            <CardHeader>
              <CardTitle>Criar Agendamento</CardTitle>
              <CardDescription>
                Agendar execução automática de testes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-name">Nome</Label>
                  <Input
                    id="schedule-name"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do agendamento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-cron">Cron Expression</Label>
                  <Input
                    id="schedule-cron"
                    value={newSchedule.cron}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, cron: e.target.value }))}
                    placeholder="0 9 * * *"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="schedule-enabled"
                  checked={newSchedule.enabled}
                  onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="schedule-enabled">Ativo</Label>
              </div>
              <Button onClick={handleCreateSchedule}>
                <Calendar className="w-4 h-4 mr-2" />
                Criar Agendamento
              </Button>
            </CardContent>
          </Card>

          {/* Lista de agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map(schedule => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{schedule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Cron: {schedule.cron}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Próxima execução: {schedule.nextRun.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                        {schedule.enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSchedule(schedule.id, { enabled: !schedule.enabled })}
                      >
                        {schedule.enabled ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Teste</CardTitle>
              <CardDescription>
                Configurar comportamento da automação de testes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Execução paralela */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Execução Paralela</Label>
                  <div className="text-sm text-muted-foreground">
                    Executar testes em paralelo para melhor performance
                  </div>
                </div>
                <Switch
                  checked={config.parallel}
                  onCheckedChange={(checked) => handleUpdateConfig({ parallel: checked })}
                />
              </div>

              {/* Workers máximos */}
              <div className="space-y-2">
                <Label htmlFor="max-workers">Workers Máximos</Label>
                <Input
                  id="max-workers"
                  type="number"
                  value={config.maxWorkers}
                  onChange={(e) => handleUpdateConfig({ maxWorkers: parseInt(e.target.value) })}
                  min="1"
                  max="16"
                />
              </div>

              {/* Timeout */}
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout}
                  onChange={(e) => handleUpdateConfig({ timeout: parseInt(e.target.value) })}
                  min="1000"
                  step="1000"
                />
              </div>

              {/* Tentativas */}
              <div className="space-y-2">
                <Label htmlFor="retries">Tentativas</Label>
                <Input
                  id="retries"
                  type="number"
                  value={config.retries}
                  onChange={(e) => handleUpdateConfig({ retries: parseInt(e.target.value) })}
                  min="0"
                  max="5"
                />
              </div>

              {/* Cobertura */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Análise de Cobertura</Label>
                  <div className="text-sm text-muted-foreground">
                    Coletar dados de cobertura durante os testes
                  </div>
                </div>
                <Switch
                  checked={config.coverage}
                  onCheckedChange={(checked) => handleUpdateConfig({ coverage: checked })}
                />
              </div>

              {/* Limites de cobertura */}
              <div className="space-y-4">
                <Label>Limites de Cobertura (%)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lines-threshold">Linhas</Label>
                    <Input
                      id="lines-threshold"
                      type="number"
                      value={config.coverageThreshold.lines}
                      onChange={(e) => handleUpdateConfig({
                        coverageThreshold: {
                          ...config.coverageThreshold,
                          lines: parseInt(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="functions-threshold">Funções</Label>
                    <Input
                      id="functions-threshold"
                      type="number"
                      value={config.coverageThreshold.functions}
                      onChange={(e) => handleUpdateConfig({
                        coverageThreshold: {
                          ...config.coverageThreshold,
                          functions: parseInt(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branches-threshold">Branches</Label>
                    <Input
                      id="branches-threshold"
                      type="number"
                      value={config.coverageThreshold.branches}
                      onChange={(e) => handleUpdateConfig({
                        coverageThreshold: {
                          ...config.coverageThreshold,
                          branches: parseInt(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statements-threshold">Statements</Label>
                    <Input
                      id="statements-threshold"
                      type="number"
                      value={config.coverageThreshold.statements}
                      onChange={(e) => handleUpdateConfig({
                        coverageThreshold: {
                          ...config.coverageThreshold,
                          statements: parseInt(e.target.value)
                        }
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Verbose */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Verbose</Label>
                  <div className="text-sm text-muted-foreground">
                    Exibir informações detalhadas durante a execução
                  </div>
                </div>
                <Switch
                  checked={config.verbose}
                  onCheckedChange={(checked) => handleUpdateConfig({ verbose: checked })}
                />
              </div>

              {/* Bail */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Parar no Primeiro Erro</Label>
                  <div className="text-sm text-muted-foreground">
                    Interromper execução ao encontrar o primeiro teste falhando
                  </div>
                </div>
                <Switch
                  checked={config.bail}
                  onCheckedChange={(checked) => handleUpdateConfig({ bail: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestAutomationPanel;