import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  Users, Eye, Clock, MousePointer, TrendingUp, TrendingDown,
  Activity, Target, Zap, Brain, Heart, Star, AlertTriangle,
  Download, Settings, Play, Pause, RotateCcw, Filter,
  Calendar, Map, Layers, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

// Interfaces
interface UserSession {
  id: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  duration: number;
  page_views: number;
  interactions: number;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  referrer: string;
  exit_page: string;
  bounce: boolean;
  conversion: boolean;
}

interface UserInteraction {
  id: string;
  session_id: string;
  type: 'click' | 'scroll' | 'hover' | 'form_submit' | 'video_play' | 'download';
  element: string;
  timestamp: Date;
  coordinates?: { x: number; y: number };
  value?: string;
  duration?: number;
}

interface UserJourney {
  id: string;
  user_id: string;
  steps: JourneyStep[];
  total_duration: number;
  conversion_rate: number;
  drop_off_points: string[];
  success_rate: number;
  satisfaction_score: number;
}

interface JourneyStep {
  id: string;
  page: string;
  timestamp: Date;
  duration: number;
  interactions: number;
  scroll_depth: number;
  exit_rate: number;
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  user_count: number;
  growth_rate: number;
  engagement_score: number;
  conversion_rate: number;
  lifetime_value: number;
  characteristics: string[];
}

interface SegmentCriteria {
  demographics?: {
    age_range?: [number, number];
    gender?: string;
    location?: string[];
  };
  behavior?: {
    session_frequency?: string;
    avg_session_duration?: number;
    page_views_per_session?: number;
    device_preference?: string;
  };
  engagement?: {
    interaction_rate?: number;
    content_consumption?: string;
    feature_usage?: string[];
  };
}

interface BehaviorPattern {
  id: string;
  name: string;
  type: 'navigation' | 'engagement' | 'conversion' | 'retention';
  description: string;
  frequency: number;
  confidence: number;
  impact_score: number;
  affected_users: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

interface UserPersona {
  id: string;
  name: string;
  description: string;
  demographics: {
    age_range: string;
    gender: string;
    occupation: string;
    income_level: string;
  };
  goals: string[];
  pain_points: string[];
  preferred_channels: string[];
  behavior_traits: string[];
  technology_comfort: 'low' | 'medium' | 'high';
  user_percentage: number;
}

interface EngagementMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  benchmark: number;
  category: 'time' | 'interaction' | 'content' | 'social';
  description: string;
}

interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  overall_conversion_rate: number;
  total_users: number;
  optimization_opportunities: string[];
}

interface FunnelStep {
  id: string;
  name: string;
  users: number;
  conversion_rate: number;
  drop_off_rate: number;
  avg_time_spent: number;
  common_exit_points: string[];
}

interface BehaviorAlert {
  id: string;
  type: 'anomaly' | 'threshold' | 'trend' | 'segment_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  current_value: number;
  expected_value: number;
  deviation: number;
  triggered_at: Date;
  affected_segments: string[];
  recommended_actions: string[];
}

interface BehaviorInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'correlation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  related_metrics: string[];
  recommendations: string[];
  generated_at: Date;
}

interface BehaviorConfig {
  tracking: {
    enabled: boolean;
    session_timeout: number;
    interaction_tracking: boolean;
    heatmap_enabled: boolean;
    recording_enabled: boolean;
  };
  analysis: {
    real_time_analysis: boolean;
    pattern_detection: boolean;
    anomaly_detection: boolean;
    segmentation_enabled: boolean;
    journey_mapping: boolean;
  };
  privacy: {
    anonymize_data: boolean;
    data_retention_days: number;
    gdpr_compliance: boolean;
    cookie_consent: boolean;
  };
  alerts: {
    email_notifications: boolean;
    slack_notifications: boolean;
    threshold_alerts: boolean;
    anomaly_alerts: boolean;
  };
}

interface BehaviorReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  generated_at: Date;
  summary: {
    total_users: number;
    total_sessions: number;
    avg_session_duration: number;
    bounce_rate: number;
    conversion_rate: number;
  };
  key_insights: BehaviorInsight[];
  top_patterns: BehaviorPattern[];
  segment_analysis: UserSegment[];
  funnel_performance: ConversionFunnel[];
  recommendations: string[];
}

const UserBehaviorAnalyzer: React.FC = () => {
  // Estados principais
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetric[]>([]);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [alerts, setAlerts] = useState<BehaviorAlert[]>([]);
  const [insights, setInsights] = useState<BehaviorInsight[]>([]);
  const [reports, setReports] = useState<BehaviorReport[]>([]);
  const [config, setConfig] = useState<BehaviorConfig>(defaultConfig);
  
  // Estados de controle
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTracking, setIsTracking] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dados simulados
  useEffect(() => {
    setSessions(generateMockSessions());
    setInteractions(generateMockInteractions());
    setJourneys(generateMockJourneys());
    setSegments(generateMockSegments());
    setPatterns(generateMockPatterns());
    setPersonas(generateMockPersonas());
    setEngagementMetrics(generateMockEngagementMetrics());
    setFunnels(generateMockFunnels());
    setAlerts(generateMockAlerts());
    setInsights(generateMockInsights());
    setReports(generateMockReports());
  }, []);

  // Handlers
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Atualizar dados após análise
      setInsights(generateMockInsights());
      setPatterns(generateMockPatterns());
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'json') => {
    const reportData = {
      sessions,
      segments,
      patterns,
      insights,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `behavior-analysis-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateConfig = (newConfig: Partial<BehaviorConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
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
      case 'up': case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'navigation': return <Map className="h-4 w-4" />;
      case 'engagement': return <Heart className="h-4 w-4" />;
      case 'conversion': return <Target className="h-4 w-4" />;
      case 'retention': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Valores computados
  const totalUsers = sessions.length;
  const totalSessions = sessions.length;
  const avgSessionDuration = sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length;
  const bounceRate = (sessions.filter(s => s.bounce).length / sessions.length) * 100;
  const conversionRate = (sessions.filter(s => s.conversion).length / sessions.length) * 100;
  const activeAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
  const totalInteractions = interactions.length;
  const avgInteractionsPerSession = totalInteractions / totalSessions;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Comportamento do Usuário</h1>
          <p className="text-gray-600 mt-2">Insights avançados sobre padrões de comportamento e jornadas do usuário</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar Análise
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Únicos</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% vs período anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duração Média da Sessão</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(avgSessionDuration / 60)}min</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.3% vs período anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3" />
                  -2.1% vs período anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{activeAlerts}</p>
                <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Requer atenção
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="journeys">Jornadas</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="funnels">Funis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de sessões ao longo do tempo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sessões ao Longo do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por dispositivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribuição por Dispositivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateDeviceDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateDeviceDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de engajamento */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {engagementMetrics.map((metric) => (
                  <div key={metric.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.value.toLocaleString()}{metric.unit}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metric.change > 0 ? '+' : ''}{metric.change}% vs benchmark
                    </div>
                    <Progress 
                      value={(metric.value / metric.benchmark) * 100} 
                      className="mt-2 h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Insights Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${getSeverityColor(insight.impact)}`}>
                            {insight.impact.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Confiança: {(insight.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {insight.actionable && (
                        <Button size="sm" variant="outline">
                          <Zap className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessões */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${
                          session.conversion ? 'bg-green-500' : 
                          session.bounce ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">Sessão {session.id}</p>
                          <p className="text-sm text-gray-600">
                            {session.device_type} • {session.browser} • {session.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {Math.round(session.duration / 60)}min
                        </p>
                        <p className="text-xs text-gray-600">
                          {session.page_views} páginas • {session.interactions} interações
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jornadas */}
        <TabsContent value="journeys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jornadas do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {journeys.slice(0, 5).map((journey) => (
                  <div key={journey.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Jornada {journey.id}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {(journey.conversion_rate * 100).toFixed(1)}% conversão
                        </Badge>
                        <Badge variant="outline">
                          {journey.satisfaction_score.toFixed(1)} satisfação
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {journey.steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                          <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg min-w-[120px]">
                            <p className="text-xs font-medium text-gray-900">{step.page}</p>
                            <p className="text-xs text-gray-600">
                              {Math.round(step.duration / 60)}min
                            </p>
                            <p className="text-xs text-gray-600">
                              {step.interactions} interações
                            </p>
                          </div>
                          {index < journey.steps.length - 1 && (
                            <div className="flex-shrink-0 text-gray-400">
                              →
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segmentos */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{segment.name}</span>
                    <Badge variant="outline">
                      {segment.user_count.toLocaleString()} usuários
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Taxa de Crescimento</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {segment.growth_rate > 0 ? '+' : ''}{segment.growth_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Score de Engajamento</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {segment.engagement_score.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Taxa de Conversão</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(segment.conversion_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valor Vitalício</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {segment.lifetime_value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Características</p>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics.map((char, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Padrões */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Padrões de Comportamento Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(pattern.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{pattern.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              Frequência: {pattern.frequency}x
                            </span>
                            <span className="text-xs text-gray-500">
                              Confiança: {(pattern.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs text-gray-500">
                              Impacto: {pattern.impact_score}/10
                            </span>
                            <span className="text-xs text-gray-500">
                              {pattern.affected_users} usuários afetados
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(pattern.trend)}
                        <Badge variant="outline" className={getSeverityColor(pattern.type)}>
                          {pattern.type}
                        </Badge>
                      </div>
                    </div>
                    {pattern.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-700 mb-2">Recomendações:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {pattern.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funis */}
        <TabsContent value="funnels" className="space-y-6">
          {funnels.map((funnel) => (
            <Card key={funnel.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{funnel.name}</span>
                  <Badge variant="outline">
                    {(funnel.overall_conversion_rate * 100).toFixed(1)}% conversão geral
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnel.steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{step.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                {step.users.toLocaleString()} usuários
                              </span>
                              <Badge variant="outline">
                                {(step.conversion_rate * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${step.conversion_rate * 100}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Tempo médio: {Math.round(step.avg_time_spent / 60)}min</span>
                            <span>Drop-off: {(step.drop_off_rate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      {index < funnel.steps.length - 1 && (
                        <div className="ml-4 mt-2 mb-2 w-0.5 h-4 bg-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
                {funnel.optimization_opportunities.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h5 className="font-medium text-gray-900 mb-2">Oportunidades de Otimização:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {funnel.optimization_opportunities.map((opp, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {insight.title}
                    </span>
                    <Badge variant="outline" className={getSeverityColor(insight.impact)}>
                      {insight.impact.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{insight.description}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Confiança</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(insight.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tipo</p>
                      <p className="text-sm font-medium text-gray-900">
                        {insight.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Acionável</p>
                      <p className="text-sm font-medium text-gray-900">
                        {insight.actionable ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>
                  {insight.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Recomendações:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insight.actionable && (
                    <Button size="sm" className="mt-4 w-full">
                      <Zap className="h-4 w-4 mr-2" />
                      Implementar Ação
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de rastreamento */}
            <Card>
              <CardHeader>
                <CardTitle>Rastreamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Rastreamento Ativo</p>
                    <p className="text-sm text-gray-600">Coletar dados de comportamento do usuário</p>
                  </div>
                  <Button
                    variant={config.tracking.enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      tracking: { ...config.tracking, enabled: !config.tracking.enabled }
                    })}
                  >
                    {config.tracking.enabled ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Rastreamento de Interações</p>
                    <p className="text-sm text-gray-600">Monitorar cliques, scrolls e hovers</p>
                  </div>
                  <Button
                    variant={config.tracking.interaction_tracking ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      tracking: { ...config.tracking, interaction_tracking: !config.tracking.interaction_tracking }
                    })}
                  >
                    {config.tracking.interaction_tracking ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Heatmaps</p>
                    <p className="text-sm text-gray-600">Gerar mapas de calor de interações</p>
                  </div>
                  <Button
                    variant={config.tracking.heatmap_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      tracking: { ...config.tracking, heatmap_enabled: !config.tracking.heatmap_enabled }
                    })}
                  >
                    {config.tracking.heatmap_enabled ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de análise */}
            <Card>
              <CardHeader>
                <CardTitle>Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Análise em Tempo Real</p>
                    <p className="text-sm text-gray-600">Processar dados instantaneamente</p>
                  </div>
                  <Button
                    variant={config.analysis.real_time_analysis ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      analysis: { ...config.analysis, real_time_analysis: !config.analysis.real_time_analysis }
                    })}
                  >
                    {config.analysis.real_time_analysis ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Detecção de Padrões</p>
                    <p className="text-sm text-gray-600">Identificar padrões automaticamente</p>
                  </div>
                  <Button
                    variant={config.analysis.pattern_detection ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      analysis: { ...config.analysis, pattern_detection: !config.analysis.pattern_detection }
                    })}
                  >
                    {config.analysis.pattern_detection ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Segmentação</p>
                    <p className="text-sm text-gray-600">Criar segmentos de usuários automaticamente</p>
                  </div>
                  <Button
                    variant={config.analysis.segmentation_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      analysis: { ...config.analysis, segmentation_enabled: !config.analysis.segmentation_enabled }
                    })}
                  >
                    {config.analysis.segmentation_enabled ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de privacidade */}
            <Card>
              <CardHeader>
                <CardTitle>Privacidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Anonimizar Dados</p>
                    <p className="text-sm text-gray-600">Remover informações pessoais identificáveis</p>
                  </div>
                  <Button
                    variant={config.privacy.anonymize_data ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      privacy: { ...config.privacy, anonymize_data: !config.privacy.anonymize_data }
                    })}
                  >
                    {config.privacy.anonymize_data ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Conformidade GDPR</p>
                    <p className="text-sm text-gray-600">Seguir regulamentações de proteção de dados</p>
                  </div>
                  <Button
                    variant={config.privacy.gdpr_compliance ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      privacy: { ...config.privacy, gdpr_compliance: !config.privacy.gdpr_compliance }
                    })}
                  >
                    {config.privacy.gdpr_compliance ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Retenção de Dados</p>
                  <p className="text-sm text-gray-600 mb-2">Período de armazenamento dos dados</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={config.privacy.data_retention_days}
                      onChange={(e) => handleUpdateConfig({
                        privacy: { ...config.privacy, data_retention_days: parseInt(e.target.value) }
                      })}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificações por Email</p>
                    <p className="text-sm text-gray-600">Receber alertas por email</p>
                  </div>
                  <Button
                    variant={config.alerts.email_notifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      alerts: { ...config.alerts, email_notifications: !config.alerts.email_notifications }
                    })}
                  >
                    {config.alerts.email_notifications ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificações Slack</p>
                    <p className="text-sm text-gray-600">Receber alertas no Slack</p>
                  </div>
                  <Button
                    variant={config.alerts.slack_notifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      alerts: { ...config.alerts, slack_notifications: !config.alerts.slack_notifications }
                    })}
                  >
                    {config.alerts.slack_notifications ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Alertas de Anomalia</p>
                    <p className="text-sm text-gray-600">Detectar comportamentos anômalos</p>
                  </div>
                  <Button
                    variant={config.alerts.anomaly_alerts ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateConfig({
                      alerts: { ...config.alerts, anomaly_alerts: !config.alerts.anomaly_alerts }
                    })}
                  >
                    {config.alerts.anomaly_alerts ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Configuração padrão
const defaultConfig: BehaviorConfig = {
  tracking: {
    enabled: true,
    session_timeout: 1800,
    interaction_tracking: true,
    heatmap_enabled: true,
    recording_enabled: false
  },
  analysis: {
    real_time_analysis: true,
    pattern_detection: true,
    anomaly_detection: true,
    segmentation_enabled: true,
    journey_mapping: true
  },
  privacy: {
    anonymize_data: true,
    data_retention_days: 90,
    gdpr_compliance: true,
    cookie_consent: true
  },
  alerts: {
    email_notifications: true,
    slack_notifications: false,
    threshold_alerts: true,
    anomaly_alerts: true
  }
};

// Funções auxiliares para gerar dados mock
const generateMockSessions = (): UserSession[] => {
  const sessions = [];
  for (let i = 0; i < 50; i++) {
    sessions.push({
      id: `session-${i + 1}`,
      user_id: `user-${Math.floor(Math.random() * 20) + 1}`,
      start_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      duration: Math.random() * 3600 + 300,
      page_views: Math.floor(Math.random() * 10) + 1,
      interactions: Math.floor(Math.random() * 50) + 5,
      device_type: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      location: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre'][Math.floor(Math.random() * 4)],
      referrer: ['Google', 'Facebook', 'Direct', 'Email'][Math.floor(Math.random() * 4)],
      exit_page: ['/home', '/products', '/about', '/contact'][Math.floor(Math.random() * 4)],
      bounce: Math.random() < 0.3,
      conversion: Math.random() < 0.15
    });
  }
  return sessions;
};

const generateMockInteractions = (): UserInteraction[] => {
  const interactions = [];
  for (let i = 0; i < 200; i++) {
    interactions.push({
      id: `interaction-${i + 1}`,
      session_id: `session-${Math.floor(Math.random() * 50) + 1}`,
      type: ['click', 'scroll', 'hover', 'form_submit', 'video_play', 'download'][Math.floor(Math.random() * 6)] as any,
      element: ['button', 'link', 'image', 'form', 'video', 'menu'][Math.floor(Math.random() * 6)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      coordinates: { x: Math.random() * 1920, y: Math.random() * 1080 },
      duration: Math.random() * 10000
    });
  }
  return interactions;
};

const generateMockJourneys = (): UserJourney[] => [
  {
    id: 'journey-1',
    user_id: 'user-1',
    steps: [
      {
        id: 'step-1',
        page: '/home',
        timestamp: new Date(Date.now() - 3600000),
        duration: 120,
        interactions: 8,
        scroll_depth: 75,
        exit_rate: 0.2
      },
      {
        id: 'step-2',
        page: '/products',
        timestamp: new Date(Date.now() - 3480000),
        duration: 180,
        interactions: 12,
        scroll_depth: 90,
        exit_rate: 0.15
      },
      {
        id: 'step-3',
        page: '/checkout',
        timestamp: new Date(Date.now() - 3300000),
        duration: 240,
        interactions: 15,
        scroll_depth: 100,
        exit_rate: 0.3
      }
    ],
    total_duration: 540,
    conversion_rate: 0.85,
    drop_off_points: ['/checkout'],
    success_rate: 0.75,
    satisfaction_score: 8.5
  }
];

const generateMockSegments = (): UserSegment[] => [
  {
    id: 'segment-1',
    name: 'Usuários Engajados',
    description: 'Usuários com alta frequência de sessões e longo tempo de permanência',
    criteria: {
      behavior: {
        session_frequency: 'daily',
        avg_session_duration: 600,
        page_views_per_session: 8
      }
    },
    user_count: 1250,
    growth_rate: 15.3,
    engagement_score: 8.7,
    conversion_rate: 0.25,
    lifetime_value: 850,
    characteristics: ['Alta frequência', 'Longo tempo de sessão', 'Múltiplas páginas']
  },
  {
    id: 'segment-2',
    name: 'Visitantes Casuais',
    description: 'Usuários com baixa frequência e sessões curtas',
    criteria: {
      behavior: {
        session_frequency: 'weekly',
        avg_session_duration: 180,
        page_views_per_session: 3
      }
    },
    user_count: 3200,
    growth_rate: 8.1,
    engagement_score: 4.2,
    conversion_rate: 0.08,
    lifetime_value: 120,
    characteristics: ['Baixa frequência', 'Sessões curtas', 'Poucas páginas']
  }
];

const generateMockPatterns = (): BehaviorPattern[] => [
  {
    id: 'pattern-1',
    name: 'Abandono no Checkout',
    type: 'conversion',
    description: 'Usuários frequentemente abandonam o processo de checkout na etapa de pagamento',
    frequency: 45,
    confidence: 0.92,
    impact_score: 8,
    affected_users: 320,
    trend: 'increasing',
    recommendations: [
      'Simplificar processo de pagamento',
      'Adicionar mais opções de pagamento',
      'Melhorar indicadores de segurança'
    ]
  },
  {
    id: 'pattern-2',
    name: 'Navegação por Categorias',
    type: 'navigation',
    description: 'Usuários preferem navegar por categorias específicas em vez de usar a busca',
    frequency: 78,
    confidence: 0.85,
    impact_score: 6,
    affected_users: 890,
    trend: 'stable',
    recommendations: [
      'Melhorar organização das categorias',
      'Destacar categorias populares',
      'Otimizar menu de navegação'
    ]
  }
];

const generateMockPersonas = (): UserPersona[] => [
  {
    id: 'persona-1',
    name: 'Estudante Universitário',
    description: 'Jovem adulto focado em aprendizado e desenvolvimento pessoal',
    demographics: {
      age_range: '18-25',
      gender: 'Misto',
      occupation: 'Estudante',
      income_level: 'Baixo'
    },
    goals: ['Aprender novas habilidades', 'Conseguir estágio', 'Networking'],
    pain_points: ['Falta de tempo', 'Recursos limitados', 'Competição'],
    preferred_channels: ['Mobile', 'Social Media', 'Email'],
    behavior_traits: ['Busca por conteúdo gratuito', 'Sessões curtas frequentes'],
    technology_comfort: 'high',
    user_percentage: 35
  },
  {
    id: 'persona-2',
    name: 'Profissional Experiente',
    description: 'Profissional estabelecido buscando atualização e especialização',
    demographics: {
      age_range: '30-45',
      gender: 'Misto',
      occupation: 'Gerente/Especialista',
      income_level: 'Alto'
    },
    goals: ['Atualização profissional', 'Certificações', 'Liderança'],
    pain_points: ['Falta de tempo', 'Conteúdo desatualizado', 'ROI'],
    preferred_channels: ['Desktop', 'Email', 'LinkedIn'],
    behavior_traits: ['Foco em resultados', 'Sessões longas concentradas'],
    technology_comfort: 'medium',
    user_percentage: 45
  }
];

const generateMockEngagementMetrics = (): EngagementMetric[] => [
  {
    id: 'metric-1',
    name: 'Tempo na Página',
    value: 245,
    unit: 's',
    trend: 'up',
    change: 12.5,
    benchmark: 220,
    category: 'time',
    description: 'Tempo médio que usuários passam em cada página'
  },
  {
    id: 'metric-2',
    name: 'Taxa de Cliques',
    value: 8.7,
    unit: '%',
    trend: 'down',
    change: -3.2,
    benchmark: 9.0,
    category: 'interaction',
    description: 'Percentual de usuários que clicam em elementos interativos'
  },
  {
    id: 'metric-3',
    name: 'Profundidade de Scroll',
    value: 68,
    unit: '%',
    trend: 'up',
    change: 5.8,
    benchmark: 65,
    category: 'content',
    description: 'Percentual médio da página que os usuários visualizam'
  },
  {
    id: 'metric-4',
    name: 'Compartilhamentos',
    value: 156,
    unit: '',
    trend: 'up',
    change: 23.1,
    benchmark: 130,
    category: 'social',
    description: 'Número total de compartilhamentos em redes sociais'
  }
];

const generateMockFunnels = (): ConversionFunnel[] => [
  {
    id: 'funnel-1',
    name: 'Funil de Conversão Principal',
    steps: [
      {
        id: 'step-1',
        name: 'Visitantes',
        users: 10000,
        conversion_rate: 1.0,
        drop_off_rate: 0.0,
        avg_time_spent: 120,
        common_exit_points: []
      },
      {
        id: 'step-2',
        name: 'Visualização de Produto',
        users: 6500,
        conversion_rate: 0.65,
        drop_off_rate: 0.35,
        avg_time_spent: 180,
        common_exit_points: ['/home', '/search']
      },
      {
        id: 'step-3',
        name: 'Adição ao Carrinho',
        users: 2600,
        conversion_rate: 0.4,
        drop_off_rate: 0.6,
        avg_time_spent: 90,
        common_exit_points: ['/product', '/category']
      },
      {
        id: 'step-4',
        name: 'Checkout',
        users: 1300,
        conversion_rate: 0.5,
        drop_off_rate: 0.5,
        avg_time_spent: 300,
        common_exit_points: ['/cart']
      },
      {
        id: 'step-5',
        name: 'Compra Finalizada',
        users: 780,
        conversion_rate: 0.6,
        drop_off_rate: 0.4,
        avg_time_spent: 180,
        common_exit_points: ['/checkout']
      }
    ],
    overall_conversion_rate: 0.078,
    total_users: 10000,
    optimization_opportunities: [
      'Melhorar página de produto para reduzir abandono',
      'Simplificar processo de checkout',
      'Adicionar incentivos na etapa do carrinho'
    ]
  }
];

const generateMockAlerts = (): BehaviorAlert[] => [
  {
    id: 'alert-1',
    type: 'anomaly',
    severity: 'high',
    title: 'Aumento Súbito na Taxa de Rejeição',
    description: 'Taxa de rejeição aumentou 45% nas últimas 2 horas',
    metric: 'bounce_rate',
    current_value: 58.3,
    expected_value: 40.2,
    deviation: 45.0,
    triggered_at: new Date(),
    affected_segments: ['mobile_users', 'new_visitors'],
    recommended_actions: [
      'Verificar problemas técnicos no site',
      'Analisar mudanças recentes na interface',
      'Revisar campanhas de marketing ativas'
    ]
  },
  {
    id: 'alert-2',
    type: 'threshold',
    severity: 'medium',
    title: 'Queda na Taxa de Conversão',
    description: 'Taxa de conversão abaixo do limite mínimo estabelecido',
    metric: 'conversion_rate',
    current_value: 2.1,
    expected_value: 3.5,
    deviation: -40.0,
    triggered_at: new Date(Date.now() - 3600000),
    affected_segments: ['desktop_users'],
    recommended_actions: [
      'Revisar funil de conversão',
      'Testar diferentes CTAs',
      'Analisar feedback dos usuários'
    ]
  }
];

const generateMockInsights = (): BehaviorInsight[] => [
  {
    id: 'insight-1',
    type: 'opportunity',
    title: 'Oportunidade de Melhoria no Mobile',
    description: 'Usuários mobile têm 30% menos engajamento que desktop, mas representam 60% do tráfego',
    confidence: 0.89,
    impact: 'high',
    actionable: true,
    related_metrics: ['mobile_engagement', 'session_duration'],
    recommendations: [
      'Otimizar interface mobile',
      'Melhorar velocidade de carregamento',
      'Simplificar navegação mobile'
    ],
    generated_at: new Date()
  },
  {
    id: 'insight-2',
    type: 'trend',
    title: 'Crescimento no Engajamento de Vídeos',
    description: 'Conteúdo em vídeo tem 3x mais engajamento que texto nas últimas 4 semanas',
    confidence: 0.94,
    impact: 'medium',
    actionable: true,
    related_metrics: ['video_engagement', 'content_consumption'],
    recommendations: [
      'Investir mais em conteúdo de vídeo',
      'Criar playlists temáticas',
      'Adicionar legendas automáticas'
    ],
    generated_at: new Date(Date.now() - 86400000)
  }
];

const generateMockReports = (): BehaviorReport[] => [
  {
    id: 'report-1',
    title: 'Relatório Semanal de Comportamento',
    period: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    generated_at: new Date(),
    summary: {
      total_users: 15420,
      total_sessions: 23680,
      avg_session_duration: 245,
      bounce_rate: 42.3,
      conversion_rate: 3.8
    },
    key_insights: generateMockInsights(),
    top_patterns: generateMockPatterns(),
    segment_analysis: generateMockSegments(),
    funnel_performance: generateMockFunnels(),
    recommendations: [
      'Focar na otimização mobile',
      'Investir em conteúdo de vídeo',
      'Melhorar processo de checkout'
    ]
  }
];

const generateTimeSeriesData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      time: `Dia ${i + 1}`,
      sessions: Math.floor(Math.random() * 1000) + 500,
      users: Math.floor(Math.random() * 800) + 300
    });
  }
  return data;
};

const generateDeviceDistribution = () => [
  { name: 'Desktop', value: 45, color: '#3b82f6' },
  { name: 'Mobile', value: 40, color: '#10b981' },
  { name: 'Tablet', value: 15, color: '#f59e0b' }
];

export default UserBehaviorAnalyzer;