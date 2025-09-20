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
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Eye, Users, Clock, MousePointer, Smartphone, Monitor, Tablet,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle,
  BarChart3, PieChart as PieChartIcon, Activity, Target, Zap,
  Download, RefreshCw, Settings, Play, Pause, Filter, Search,
  Heart, ThumbsUp, ThumbsDown, MessageSquare, Star, Award,
  Navigation, Layers, Palette, Type, Image, Video, Headphones
} from 'lucide-react';

// Interfaces
interface UXMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  target?: number;
  description: string;
  category: 'usability' | 'accessibility' | 'performance' | 'engagement';
}

interface UserJourney {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    name: string;
    page: string;
    completionRate: number;
    averageTime: number;
    dropoffRate: number;
    issues: string[];
  }>;
  overallCompletion: number;
  averageDuration: number;
  satisfactionScore: number;
  conversionRate: number;
}

interface HeatmapData {
  id: string;
  page: string;
  device: 'desktop' | 'mobile' | 'tablet';
  clicks: Array<{
    x: number;
    y: number;
    intensity: number;
    element: string;
  }>;
  scrollDepth: number;
  timeOnPage: number;
  exitRate: number;
}

interface AccessibilityIssue {
  id: string;
  type: 'color_contrast' | 'keyboard_navigation' | 'screen_reader' | 'focus_management' | 'aria_labels';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element: string;
  page: string;
  description: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  impact: number;
  users_affected: number;
  fix_effort: 'low' | 'medium' | 'high';
}

interface UserFeedback {
  id: string;
  type: 'rating' | 'comment' | 'survey' | 'interview';
  rating?: number;
  comment?: string;
  page: string;
  user_id: string;
  timestamp: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  category: 'usability' | 'design' | 'content' | 'performance' | 'functionality';
}

interface UsabilityTest {
  id: string;
  name: string;
  type: 'moderated' | 'unmoderated' | 'guerrilla' | 'remote';
  status: 'planning' | 'recruiting' | 'running' | 'analyzing' | 'completed';
  participants: number;
  tasks: Array<{
    id: string;
    description: string;
    success_rate: number;
    average_time: number;
    difficulty_rating: number;
  }>;
  insights: string[];
  recommendations: string[];
  startDate: Date;
  endDate?: Date;
}

interface UXReport {
  id: string;
  name: string;
  type: 'usability' | 'accessibility' | 'user_journey' | 'heatmap' | 'comprehensive';
  period: { start: Date; end: Date };
  metrics: UXMetric[];
  insights: string[];
  recommendations: string[];
  priority_issues: string[];
  generated_at: Date;
}

interface UXConfig {
  tracking: {
    heatmaps: boolean;
    user_recordings: boolean;
    form_analytics: boolean;
    scroll_tracking: boolean;
  };
  accessibility: {
    auto_scan: boolean;
    wcag_level: 'A' | 'AA' | 'AAA';
    color_contrast_ratio: number;
    keyboard_navigation: boolean;
  };
  usability: {
    session_recordings: boolean;
    user_feedback: boolean;
    task_completion: boolean;
    error_tracking: boolean;
  };
  notifications: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    events: ('accessibility_issue' | 'usability_problem' | 'low_satisfaction' | 'high_dropoff')[];
  };
}

const UXAnalyzer: React.FC = () => {
  // Estados
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<UXMetric[]>([]);
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [heatmaps, setHeatmaps] = useState<HeatmapData[]>([]);
  const [accessibilityIssues, setAccessibilityIssues] = useState<AccessibilityIssue[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [usabilityTests, setUsabilityTests] = useState<UsabilityTest[]>([]);
  const [reports, setReports] = useState<UXReport[]>([]);
  const [config, setConfig] = useState<UXConfig>(defaultConfig);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMetrics(mockMetrics);
      setUserJourneys(mockUserJourneys);
      setHeatmaps(mockHeatmaps);
      setAccessibilityIssues(mockAccessibilityIssues);
      setUserFeedback(mockUserFeedback);
      setUsabilityTests(mockUsabilityTests);
      setReports(mockReports);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Simular nova análise
      setMetrics(mockMetrics.map(m => ({
        ...m,
        value: m.value + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 5
      })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'csv' | 'json') => {
  };

  const handleUpdateConfig = (updates: Partial<UXConfig>) => {
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
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'usability': return <MousePointer className="h-4 w-4" />;
      case 'accessibility': return <Eye className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'engagement': return <Heart className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Valores computados
  const overallUXScore = Math.round(metrics.reduce((sum, metric) => {
    const score = metric.status === 'excellent' ? 100 : 
                 metric.status === 'good' ? 75 : 
                 metric.status === 'warning' ? 50 : 25;
    return sum + score;
  }, 0) / metrics.length);

  const criticalIssues = accessibilityIssues.filter(issue => issue.severity === 'critical').length;
  const averageSatisfaction = userFeedback.reduce((sum, feedback) => sum + (feedback.rating || 0), 0) / userFeedback.length;
  const completedTests = usabilityTests.filter(test => test.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando análise de UX...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Análise de UX</h2>
          <p className="text-gray-600">Sistema avançado de análise de experiência do usuário</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score UX Geral</p>
                <p className="text-2xl font-bold">{overallUXScore}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={overallUXScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues Críticas</p>
                <p className="text-2xl font-bold text-red-600">{criticalIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
                <p className="text-2xl font-bold">{averageSatisfaction.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Testes Concluídos</p>
                <p className="text-2xl font-bold">{completedTests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="journeys">Jornadas</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="accessibility">Acessibilidade</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métricas por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(metric.category)}
                        <div>
                          <p className="font-medium">{metric.name}</p>
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value}{metric.unit}
                          </span>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tendência de satisfação */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Satisfação</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={satisfactionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição de feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedbackDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Issues por severidade */}
            <Card>
              <CardHeader>
                <CardTitle>Issues por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={issuesBySeverity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="severity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jornadas do usuário */}
        <TabsContent value="journeys" className="space-y-6">
          <div className="grid gap-6">
            {userJourneys.map((journey) => (
              <Card key={journey.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{journey.name}</CardTitle>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm text-gray-600">
                          Conclusão: {journey.overallCompletion.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-600">
                          Duração média: {Math.round(journey.averageDuration / 60)}min
                        </span>
                        <span className="text-sm text-gray-600">
                          Satisfação: {journey.satisfactionScore.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Conversão: {journey.conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {journey.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{step.name}</h4>
                          <p className="text-sm text-gray-600">{step.page}</p>
                          {step.issues.length > 0 && (
                            <div className="mt-2">
                              {step.issues.map((issue, i) => (
                                <Badge key={i} variant="destructive" className="mr-1 mb-1">
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{step.completionRate.toFixed(1)}%</span>
                            <span className="text-gray-600 ml-1">conclusão</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{Math.round(step.averageTime / 60)}min</span>
                            <span className="text-gray-600 ml-1">tempo médio</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-red-600">{step.dropoffRate.toFixed(1)}%</span>
                            <span className="text-gray-600 ml-1">abandono</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Heatmaps */}
        <TabsContent value="heatmaps" className="space-y-6">
          <div className="grid gap-6">
            {heatmaps.map((heatmap) => (
              <Card key={heatmap.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      {heatmap.device === 'desktop' && <Monitor className="h-5 w-5" />}
                      {heatmap.device === 'mobile' && <Smartphone className="h-5 w-5" />}
                      {heatmap.device === 'tablet' && <Tablet className="h-5 w-5" />}
                      {heatmap.page} - {heatmap.device}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Scroll: {heatmap.scrollDepth}%</span>
                      <span>Tempo: {Math.round(heatmap.timeOnPage / 60)}min</span>
                      <span>Saída: {heatmap.exitRate}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-center text-gray-600 mb-4">Visualização do Heatmap</p>
                    <div className="grid grid-cols-4 gap-2 h-48">
                      {heatmap.clicks.map((click, index) => (
                        <div
                          key={index}
                          className="rounded"
                          style={{
                            backgroundColor: `rgba(239, 68, 68, ${click.intensity / 100})`,
                            height: '20px'
                          }}
                          title={`${click.element}: ${click.intensity}% intensidade`}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between text-sm text-gray-600">
                      <span>Baixa intensidade</span>
                      <span>Alta intensidade</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Acessibilidade */}
        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Issues de Acessibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessibilityIssues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{issue.description}</h4>
                        <p className="text-sm text-gray-600">
                          {issue.page} - {issue.element}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <Badge variant="outline">
                          WCAG {issue.wcagLevel}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Impacto: {issue.impact}/10</span>
                      <span>Usuários afetados: {issue.users_affected}</span>
                      <span>Esforço: {issue.fix_effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userFeedback.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {feedback.sentiment === 'positive' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                          {feedback.sentiment === 'negative' && <ThumbsDown className="h-4 w-4 text-red-600" />}
                          {feedback.sentiment === 'neutral' && <MessageSquare className="h-4 w-4 text-gray-600" />}
                          <span className="font-medium">{feedback.page}</span>
                        </div>
                        {feedback.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-gray-600 mb-2">{feedback.comment}</p>
                      )}
                      <div className="flex gap-1">
                        {feedback.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sentimentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="positive" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="neutral" 
                      stackId="1" 
                      stroke="#6b7280" 
                      fill="#6b7280" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="negative" 
                      stackId="1" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Testes de usabilidade */}
        <TabsContent value="tests" className="space-y-6">
          <div className="grid gap-6">
            {usabilityTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {test.type} • {test.participants} participantes
                      </p>
                    </div>
                    <Badge 
                      className={
                        test.status === 'completed' ? 'bg-green-100 text-green-800' :
                        test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        test.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {test.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tarefas</h4>
                      <div className="space-y-2">
                        {test.tasks.map((task) => (
                          <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-sm">{task.description}</span>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>Sucesso: {task.success_rate}%</span>
                              <span>Tempo: {Math.round(task.average_time / 60)}min</span>
                              <span>Dificuldade: {task.difficulty_rating}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {test.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Insights</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {test.insights.map((insight, index) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {test.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recomendações</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {test.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Heatmaps</span>
                  <input 
                    type="checkbox" 
                    checked={config.tracking.heatmaps}
                    onChange={(e) => handleUpdateConfig({
                      tracking: { ...config.tracking, heatmaps: e.target.checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Gravações de usuário</span>
                  <input 
                    type="checkbox" 
                    checked={config.tracking.user_recordings}
                    onChange={(e) => handleUpdateConfig({
                      tracking: { ...config.tracking, user_recordings: e.target.checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Analytics de formulários</span>
                  <input 
                    type="checkbox" 
                    checked={config.tracking.form_analytics}
                    onChange={(e) => handleUpdateConfig({
                      tracking: { ...config.tracking, form_analytics: e.target.checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Tracking de scroll</span>
                  <input 
                    type="checkbox" 
                    checked={config.tracking.scroll_tracking}
                    onChange={(e) => handleUpdateConfig({
                      tracking: { ...config.tracking, scroll_tracking: e.target.checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Acessibilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Scan automático</span>
                  <input 
                    type="checkbox" 
                    checked={config.accessibility.auto_scan}
                    onChange={(e) => handleUpdateConfig({
                      accessibility: { ...config.accessibility, auto_scan: e.target.checked }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nível WCAG</label>
                  <select 
                    value={config.accessibility.wcag_level}
                    onChange={(e) => handleUpdateConfig({
                      accessibility: { ...config.accessibility, wcag_level: e.target.value as 'A' | 'AA' | 'AAA' }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="A">A</option>
                    <option value="AA">AA</option>
                    <option value="AAA">AAA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraste mínimo</label>
                  <input 
                    type="number" 
                    value={config.accessibility.color_contrast_ratio}
                    onChange={(e) => handleUpdateConfig({
                      accessibility: { ...config.accessibility, color_contrast_ratio: parseFloat(e.target.value) }
                    })}
                    className="w-full p-2 border rounded"
                    min="1"
                    max="21"
                    step="0.1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Notificações habilitadas</span>
                <input 
                  type="checkbox" 
                  checked={config.notifications.enabled}
                  onChange={(e) => handleUpdateConfig({
                    notifications: { ...config.notifications, enabled: e.target.checked }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Canais de notificação</label>
                <div className="space-y-2">
                  {['email', 'slack', 'webhook'].map((channel) => (
                    <div key={channel} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={config.notifications.channels.includes(channel as any)}
                        onChange={(e) => {
                          const channels = e.target.checked 
                            ? [...config.notifications.channels, channel as any]
                            : config.notifications.channels.filter(c => c !== channel);
                          handleUpdateConfig({
                            notifications: { ...config.notifications, channels }
                          });
                        }}
                      />
                      <span className="capitalize">{channel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Configuração padrão
const defaultConfig: UXConfig = {
  tracking: {
    heatmaps: true,
    user_recordings: true,
    form_analytics: true,
    scroll_tracking: true
  },
  accessibility: {
    auto_scan: true,
    wcag_level: 'AA',
    color_contrast_ratio: 4.5,
    keyboard_navigation: true
  },
  usability: {
    session_recordings: true,
    user_feedback: true,
    task_completion: true,
    error_tracking: true
  },
  notifications: {
    enabled: true,
    channels: ['email'],
    events: ['accessibility_issue', 'usability_problem']
  }
};

// Dados simulados
const mockMetrics: UXMetric[] = [
  {
    id: '1',
    name: 'Taxa de Conclusão de Tarefas',
    value: 87.5,
    unit: '%',
    status: 'excellent',
    trend: 'up',
    change: 3.2,
    target: 85,
    description: 'Percentual de tarefas concluídas com sucesso',
    category: 'usability'
  },
  {
    id: '2',
    name: 'Tempo Médio de Tarefa',
    value: 4.2,
    unit: 'min',
    status: 'good',
    trend: 'down',
    change: -0.8,
    target: 5,
    description: 'Tempo médio para completar uma tarefa',
    category: 'usability'
  },
  {
    id: '3',
    name: 'Score de Acessibilidade',
    value: 92,
    unit: '/100',
    status: 'excellent',
    trend: 'up',
    change: 5.0,
    target: 90,
    description: 'Pontuação geral de acessibilidade WCAG',
    category: 'accessibility'
  },
  {
    id: '4',
    name: 'Taxa de Engajamento',
    value: 68.3,
    unit: '%',
    status: 'warning',
    trend: 'stable',
    change: 0.1,
    target: 75,
    description: 'Percentual de usuários engajados',
    category: 'engagement'
  }
];

const mockUserJourneys: UserJourney[] = [
  {
    id: '1',
    name: 'Cadastro de Usuário',
    steps: [
      {
        id: '1',
        name: 'Página inicial',
        page: '/home',
        completionRate: 95.2,
        averageTime: 45000,
        dropoffRate: 4.8,
        issues: []
      },
      {
        id: '2',
        name: 'Formulário de cadastro',
        page: '/register',
        completionRate: 78.5,
        averageTime: 180000,
        dropoffRate: 21.5,
        issues: ['Muitos campos obrigatórios', 'Validação confusa']
      },
      {
        id: '3',
        name: 'Verificação de email',
        page: '/verify',
        completionRate: 89.3,
        averageTime: 120000,
        dropoffRate: 10.7,
        issues: []
      }
    ],
    overallCompletion: 87.7,
    averageDuration: 345000,
    satisfactionScore: 4.2,
    conversionRate: 76.8
  }
];

const mockHeatmaps: HeatmapData[] = [
  {
    id: '1',
    page: '/home',
    device: 'desktop',
    clicks: [
      { x: 50, y: 20, intensity: 85, element: 'CTA Button' },
      { x: 30, y: 40, intensity: 65, element: 'Navigation' },
      { x: 70, y: 60, intensity: 45, element: 'Footer Link' },
      { x: 60, y: 30, intensity: 75, element: 'Search Box' }
    ],
    scrollDepth: 78.5,
    timeOnPage: 125000,
    exitRate: 32.1
  }
];

const mockAccessibilityIssues: AccessibilityIssue[] = [
  {
    id: '1',
    type: 'color_contrast',
    severity: 'high',
    element: 'button.primary',
    page: '/home',
    description: 'Contraste insuficiente entre texto e fundo',
    wcagLevel: 'AA',
    impact: 8,
    users_affected: 1250,
    fix_effort: 'low'
  },
  {
    id: '2',
    type: 'aria_labels',
    severity: 'medium',
    element: 'input[type="search"]',
    page: '/search',
    description: 'Campo de busca sem label acessível',
    wcagLevel: 'A',
    impact: 6,
    users_affected: 800,
    fix_effort: 'low'
  }
];

const mockUserFeedback: UserFeedback[] = [
  {
    id: '1',
    type: 'rating',
    rating: 5,
    comment: 'Interface muito intuitiva e fácil de usar!',
    page: '/dashboard',
    user_id: 'user123',
    timestamp: new Date('2024-01-15'),
    sentiment: 'positive',
    tags: ['interface', 'usabilidade'],
    category: 'usability'
  },
  {
    id: '2',
    type: 'comment',
    comment: 'O formulário de cadastro é muito longo',
    page: '/register',
    user_id: 'user456',
    timestamp: new Date('2024-01-14'),
    sentiment: 'negative',
    tags: ['formulário', 'cadastro'],
    category: 'usability'
  }
];

const mockUsabilityTests: UsabilityTest[] = [
  {
    id: '1',
    name: 'Teste de Navegação Principal',
    type: 'moderated',
    status: 'completed',
    participants: 12,
    tasks: [
      {
        id: '1',
        description: 'Encontrar informações sobre preços',
        success_rate: 91.7,
        average_time: 45000,
        difficulty_rating: 2.1
      },
      {
        id: '2',
        description: 'Completar processo de cadastro',
        success_rate: 75.0,
        average_time: 180000,
        difficulty_rating: 3.8
      }
    ],
    insights: [
      'Usuários têm dificuldade para encontrar o link de preços',
      'Processo de cadastro considerado longo demais'
    ],
    recommendations: [
      'Tornar link de preços mais visível na navegação',
      'Simplificar formulário de cadastro'
    ],
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-01-15')
  }
];

const mockReports: UXReport[] = [
  {
    id: '1',
    name: 'Relatório Mensal de UX',
    type: 'comprehensive',
    period: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    metrics: mockMetrics,
    insights: [
      'Melhoria significativa na acessibilidade',
      'Taxa de conclusão de tarefas acima da meta'
    ],
    recommendations: [
      'Focar na redução do tempo de tarefa',
      'Implementar mais testes de usabilidade'
    ],
    priority_issues: [
      'Contraste de cores insuficiente',
      'Formulário de cadastro muito longo'
    ],
    generated_at: new Date()
  }
];

// Dados para gráficos
const satisfactionTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: `${30 - i}d`,
  satisfaction: 3.5 + Math.random() * 1.5
}));

const feedbackDistribution = [
  { name: 'Positivo', value: 65, color: '#10b981' },
  { name: 'Neutro', value: 25, color: '#6b7280' },
  { name: 'Negativo', value: 10, color: '#ef4444' }
];

const issuesBySeverity = [
  { severity: 'Baixa', count: 15 },
  { severity: 'Média', count: 8 },
  { severity: 'Alta', count: 3 },
  { severity: 'Crítica', count: 1 }
];

const sentimentTrendData = Array.from({ length: 14 }, (_, i) => ({
  date: `${14 - i}d`,
  positive: Math.floor(Math.random() * 20) + 40,
  neutral: Math.floor(Math.random() * 15) + 20,
  negative: Math.floor(Math.random() * 10) + 5
}));

export default UXAnalyzer;