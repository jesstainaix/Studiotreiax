import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Brain, Heart, Smile, Frown, Meh, AlertTriangle, TrendingUp, TrendingDown,
  Play, Pause, RotateCcw, Download, Upload, Settings, Eye, Mic, Video,
  BarChart3, PieChart as PieChartIcon, Activity, Clock, Users, Target,
  Lightbulb, Zap, CheckCircle, XCircle, AlertCircle, Info, Star,
  ThumbsUp, ThumbsDown, MessageSquare, Camera, Headphones, FileText,
  Calendar, Filter, Search, RefreshCw, Save, Share2, BookOpen, Award
} from 'lucide-react';

// Interfaces
interface SentimentMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  category: 'engagement' | 'emotion' | 'attention' | 'comprehension' | 'satisfaction';
  description: string;
  target: number;
}

interface EmotionData {
  timestamp: number;
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
  engagement: number;
  attention: number;
  confusion: number;
  interest: number;
  boredom: number;
}

interface VideoAnalysis {
  id: string;
  title: string;
  duration: number;
  upload_date: Date;
  analysis_date: Date;
  status: 'analyzing' | 'completed' | 'failed' | 'pending';
  overall_sentiment: number; // -1 to 1
  engagement_score: number; // 0 to 100
  retention_rate: number; // 0 to 100
  critical_moments: Array<{
    timestamp: number;
    type: 'drop' | 'peak' | 'confusion' | 'disengagement';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestions: string[];
  }>;
  emotion_timeline: EmotionData[];
  segments: Array<{
    start: number;
    end: number;
    sentiment: number;
    emotions: Record<string, number>;
    transcript?: string;
    visual_elements?: string[];
    audio_features?: Record<string, number>;
  }>;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral' | 'suggestion';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>;
  comparisons?: {
    similar_videos: Array<{
      id: string;
      title: string;
      similarity: number;
      performance_diff: number;
    }>;
    category_average: number;
    industry_benchmark: number;
  };
}

interface AIModel {
  id: string;
  name: string;
  type: 'text' | 'audio' | 'video' | 'multimodal';
  provider: 'openai' | 'google' | 'microsoft' | 'custom';
  version: string;
  accuracy: number;
  speed: number;
  cost_per_minute: number;
  capabilities: string[];
  status: 'active' | 'inactive' | 'training' | 'error';
  last_updated: Date;
  configuration: Record<string, any>;
}

interface SentimentReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'comparative' | 'trend';
  videos: string[];
  date_range: {
    start: Date;
    end: Date;
  };
  metrics: string[];
  filters: Record<string, any>;
  generated_at: Date;
  format: 'pdf' | 'html' | 'csv' | 'json';
  insights: Array<{
    category: string;
    findings: string[];
    recommendations: string[];
  }>;
}

interface SentimentConfig {
  analysis: {
    auto_analyze: boolean;
    real_time: boolean;
    batch_size: number;
    quality_threshold: number;
    emotion_sensitivity: number;
    segment_duration: number;
  };
  models: {
    text_model: string;
    audio_model: string;
    video_model: string;
    ensemble_weights: Record<string, number>;
  };
  alerts: {
    enabled: boolean;
    low_engagement_threshold: number;
    high_confusion_threshold: number;
    sentiment_drop_threshold: number;
    notification_channels: string[];
  };
  visualization: {
    chart_type: 'line' | 'area' | 'heatmap';
    time_resolution: 'second' | 'minute' | 'segment';
    emotion_colors: Record<string, string>;
    show_confidence: boolean;
  };
  export: {
    include_raw_data: boolean;
    include_timestamps: boolean;
    include_recommendations: boolean;
    default_format: 'pdf' | 'csv' | 'json';
  };
}

const AISentimentPanel: React.FC = () => {
  // Estados principais
  const [metrics, setMetrics] = useState<SentimentMetric[]>([]);
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [reports, setReports] = useState<SentimentReport[]>([]);
  const [config, setConfig] = useState<SentimentConfig>(defaultConfig);

  // Estados de controle
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['engagement', 'sentiment']);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Inicialização
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      setMetrics(generateMockMetrics());
      setVideoAnalyses(generateMockVideoAnalyses());
      setAIModels(generateMockAIModels());
      setReports(generateMockReports());
    } catch (err) {
      setError('Falha ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleStartAnalysis = async (videoId?: string) => {
    setIsAnalyzing(true);
    try {
      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (videoId) {
        setVideoAnalyses(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, status: 'completed', analysis_date: new Date() }
            : video
        ));
      } else {
        // Analisar todos os vídeos pendentes
        setVideoAnalyses(prev => prev.map(video => 
          video.status === 'pending' 
            ? { ...video, status: 'completed', analysis_date: new Date() }
            : video
        ));
      }
    } catch (err) {
      setError('Falha na análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      const reportData = {
        metrics,
        videos: videoAnalyses,
        timestamp: new Date(),
        config
      };
      // Aqui seria implementada a exportação real
    } catch (err) {
      setError('Falha ao exportar relatório');
    }
  };

  const handleUpdateConfig = (newConfig: Partial<SentimentConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
    setPlaybackTime(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setPlaybackTime(time);
  };

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
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

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: '#10B981',
      sadness: '#3B82F6',
      anger: '#EF4444',
      fear: '#8B5CF6',
      surprise: '#F59E0B',
      disgust: '#84CC16',
      neutral: '#6B7280',
      engagement: '#06B6D4',
      attention: '#EC4899',
      confusion: '#F97316',
      interest: '#14B8A6',
      boredom: '#64748B'
    };
    return colors[emotion] || '#6B7280';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Valores computados
  const selectedVideoData = selectedVideo ? videoAnalyses.find(v => v.id === selectedVideo) : null;
  const overallEngagement = metrics.find(m => m.id === 'overall_engagement')?.value || 0;
  const averageSentiment = metrics.find(m => m.id === 'average_sentiment')?.value || 0;
  const totalVideosAnalyzed = videoAnalyses.filter(v => v.status === 'completed').length;
  const criticalMomentsCount = videoAnalyses.reduce((acc, video) => acc + video.critical_moments.length, 0);
  const topPerformingVideo = videoAnalyses.reduce((prev, current) => 
    (prev.engagement_score > current.engagement_score) ? prev : current, videoAnalyses[0]
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Análise de Sentimentos IA</h1>
            <p className="text-gray-600">Análise emocional avançada para vídeos educacionais</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleStartAnalysis()}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Análise
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engajamento Geral</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(overallEngagement)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.2% vs. semana anterior
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sentimento Médio</p>
                <p className="text-2xl font-bold text-gray-900">{averageSentiment.toFixed(2)}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  Positivo
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Smile className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vídeos Analisados</p>
                <p className="text-2xl font-bold text-gray-900">{totalVideosAnalyzed}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <Video className="h-3 w-3 mr-1" />
                  {videoAnalyses.length - totalVideosAnalyzed} pendentes
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Momentos Críticos</p>
                <p className="text-2xl font-bold text-gray-900">{criticalMomentsCount}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requer atenção
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analyses">Análises</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Engajamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Engajamento ao Longo do Tempo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Emoções */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5" />
                  <span>Distribuição de Emoções</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateEmotionDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generateEmotionDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getEmotionColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Heatmap de Sentimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Heatmap de Sentimentos por Segmento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 100 }, (_, i) => {
                  const intensity = Math.random();
                  const color = intensity > 0.7 ? 'bg-green-500' : 
                               intensity > 0.4 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div 
                      key={i} 
                      className={`h-8 ${color} rounded opacity-${Math.floor(intensity * 100)}`}
                      title={`Segmento ${i + 1}: ${(intensity * 100).toFixed(1)}%`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Início</span>
                <span>Meio</span>
                <span>Fim</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Principais Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generateTopInsights().map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'positive' ? 'bg-green-100' :
                      insight.type === 'negative' ? 'bg-red-100' :
                      insight.type === 'suggestion' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {insight.type === 'positive' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                       insight.type === 'negative' ? <XCircle className="h-4 w-4 text-red-600" /> :
                       insight.type === 'suggestion' ? <Lightbulb className="h-4 w-4 text-blue-600" /> :
                       <Info className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Confiança: {insight.confidence}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Impacto: {insight.impact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyses Tab */}
        <TabsContent value="analyses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Análises de Vídeos</h3>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Hoje</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Vídeos */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Vídeos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {videoAnalyses.map((video) => (
                      <div 
                        key={video.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedVideo === video.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleVideoSelect(video.id)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{video.title}</h4>
                          <Badge 
                            variant={video.status === 'completed' ? 'default' : 
                                   video.status === 'analyzing' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {video.status === 'completed' ? 'Concluído' :
                             video.status === 'analyzing' ? 'Analisando' :
                             video.status === 'failed' ? 'Falhou' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(video.duration)}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-3 w-3 mr-1" />
                            {video.engagement_score.toFixed(1)}%
                          </span>
                          <span className="flex items-center">
                            <Smile className="h-3 w-3 mr-1" />
                            {video.overall_sentiment.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhes do Vídeo Selecionado */}
            <div className="lg:col-span-2">
              {selectedVideoData ? (
                <div className="space-y-6">
                  {/* Player e Controles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedVideoData.title}</span>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={handlePlayPause}>
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSeek(0)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Timeline de Sentimentos */}
                        <div>
                          <Label className="text-sm font-medium">Timeline de Sentimentos</Label>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={selectedVideoData.emotion_timeline}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={(value) => formatTime(value)}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => `Tempo: ${formatTime(value as number)}`}
                              />
                              <Line type="monotone" dataKey="engagement" stroke="#8884d8" strokeWidth={2} />
                              <Line type="monotone" dataKey="joy" stroke="#10B981" strokeWidth={1} />
                              <Line type="monotone" dataKey="confusion" stroke="#F97316" strokeWidth={1} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Barra de Progresso */}
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>{formatTime(playbackTime)}</span>
                            <span>{formatTime(selectedVideoData.duration)}</span>
                          </div>
                          <Progress 
                            value={(playbackTime / selectedVideoData.duration) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Momentos Críticos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Momentos Críticos</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedVideoData.critical_moments.map((moment, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <div className={`p-2 rounded-full ${
                              moment.severity === 'high' ? 'bg-red-100' :
                              moment.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                            }`}>
                              {moment.type === 'drop' ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                               moment.type === 'peak' ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                               moment.type === 'confusion' ? <AlertCircle className="h-4 w-4 text-orange-600" /> :
                               <Eye className="h-4 w-4 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{moment.description}</h4>
                                <span className="text-sm text-gray-600">{formatTime(moment.timestamp)}</span>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 mb-2">Sugestões:</p>
                                <ul className="text-sm space-y-1">
                                  {moment.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-center space-x-2">
                                      <Lightbulb className="h-3 w-3 text-yellow-500" />
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights do Vídeo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5" />
                        <span>Insights e Recomendações</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedVideoData.insights.map((insight, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {insight.confidence}% confiança
                                </Badge>
                                <Badge 
                                  variant={insight.impact === 'high' ? 'destructive' : 
                                          insight.impact === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {insight.impact} impacto
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                            <div>
                              <p className="text-sm font-medium mb-2">Recomendações:</p>
                              <ul className="text-sm space-y-1">
                                {insight.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-center space-x-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um vídeo</h3>
                    <p className="text-gray-600">Escolha um vídeo da lista para ver os detalhes da análise</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Timeline Comparativa de Emoções</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label>Vídeos para comparar:</Label>
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar vídeos" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoAnalyses.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={generateTimelineComparison()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={(value) => formatTime(value)} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => `Tempo: ${formatTime(value as number)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="video1_engagement" stroke="#8884d8" name="Vídeo 1" />
                    <Line type="monotone" dataKey="video2_engagement" stroke="#82ca9d" name="Vídeo 2" />
                    <Line type="monotone" dataKey="video3_engagement" stroke="#ffc658" name="Vídeo 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar de Emoções */}
            <Card>
              <CardHeader>
                <CardTitle>Perfil Emocional Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={generateEmotionRadar()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="emotion" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Intensidade"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Correlação com Aprendizado */}
            <Card>
              <CardHeader>
                <CardTitle>Correlação Emoção-Aprendizado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={generateLearningCorrelation()}>
                    <CartesianGrid />
                    <XAxis dataKey="engagement" name="Engajamento" />
                    <YAxis dataKey="learning" name="Aprendizado" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Correlação" data={generateLearningCorrelation()} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Relatórios de Sentimentos</h3>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <FileText className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {report.type === 'summary' ? 'Resumo' :
                     report.type === 'detailed' ? 'Detalhado' :
                     report.type === 'comparative' ? 'Comparativo' : 'Tendência'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vídeos:</span>
                      <span className="font-medium">{report.videos.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Período:</span>
                      <span className="font-medium">
                        {report.date_range.start.toLocaleDateString()} - {report.date_range.end.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Gerado:</span>
                      <span className="font-medium">{report.generated_at.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Insights dos Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Descobertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generateReportInsights().map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{insight.category}</h4>
                    <ul className="text-sm space-y-1">
                      {insight.findings.map((finding, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-2">Recomendações:</p>
                      <ul className="text-xs space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <Lightbulb className="h-3 w-3 text-yellow-500" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Modelos de IA</h3>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar Modelo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {aiModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{model.name}</CardTitle>
                    <Badge 
                      variant={model.status === 'active' ? 'default' : 
                              model.status === 'training' ? 'secondary' : 'destructive'}
                    >
                      {model.status === 'active' ? 'Ativo' :
                       model.status === 'training' ? 'Treinando' :
                       model.status === 'inactive' ? 'Inativo' : 'Erro'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {model.type === 'text' ? 'Análise de Texto' :
                     model.type === 'audio' ? 'Análise de Áudio' :
                     model.type === 'video' ? 'Análise de Vídeo' : 'Multimodal'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Provedor:</span>
                      <span className="font-medium capitalize">{model.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Versão:</span>
                      <span className="font-medium">{model.version}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precisão:</span>
                        <span className="font-medium">{model.accuracy}%</span>
                      </div>
                      <Progress value={model.accuracy} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Velocidade:</span>
                        <span className="font-medium">{model.speed}/10</span>
                      </div>
                      <Progress value={model.speed * 10} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Custo/min:</span>
                      <span className="font-medium">${model.cost_per_minute.toFixed(4)}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-gray-600 mb-2">Capacidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.slice(0, 3).map((cap, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                        {model.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{model.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Config
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Activity className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparação de Modelos */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={generateModelComparison()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#8884d8" name="Precisão" />
                  <Bar dataKey="speed" fill="#82ca9d" name="Velocidade" />
                  <Bar dataKey="cost_efficiency" fill="#ffc658" name="Custo-Benefício" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de Análise */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-analyze">Análise Automática</Label>
                  <Switch 
                    id="auto-analyze"
                    checked={config.analysis.auto_analyze}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        analysis: { ...config.analysis, auto_analyze: checked }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="real-time">Análise em Tempo Real</Label>
                  <Switch 
                    id="real-time"
                    checked={config.analysis.real_time}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        analysis: { ...config.analysis, real_time: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-size">Tamanho do Lote</Label>
                  <Input 
                    id="batch-size"
                    type="number"
                    value={config.analysis.batch_size}
                    onChange={(e) => 
                      handleUpdateConfig({
                        analysis: { ...config.analysis, batch_size: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality-threshold">Limite de Qualidade (%)</Label>
                  <Input 
                    id="quality-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={config.analysis.quality_threshold}
                    onChange={(e) => 
                      handleUpdateConfig({
                        analysis: { ...config.analysis, quality_threshold: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emotion-sensitivity">Sensibilidade Emocional</Label>
                  <Input 
                    id="emotion-sensitivity"
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={config.analysis.emotion_sensitivity}
                    onChange={(e) => 
                      handleUpdateConfig({
                        analysis: { ...config.analysis, emotion_sensitivity: parseFloat(e.target.value) }
                      })
                    }
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {config.analysis.emotion_sensitivity}x
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment-duration">Duração do Segmento (segundos)</Label>
                  <Input 
                    id="segment-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={config.analysis.segment_duration}
                    onChange={(e) => 
                      handleUpdateConfig({
                        analysis: { ...config.analysis, segment_duration: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Modelos */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Modelos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-model">Modelo de Texto</Label>
                  <Select 
                    value={config.models.text_model}
                    onValueChange={(value) => 
                      handleUpdateConfig({
                        models: { ...config.models, text_model: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio-model">Modelo de Áudio</Label>
                  <Select 
                    value={config.models.audio_model}
                    onValueChange={(value) => 
                      handleUpdateConfig({
                        models: { ...config.models, audio_model: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper-v3">Whisper v3</SelectItem>
                      <SelectItem value="wav2vec2">Wav2Vec2</SelectItem>
                      <SelectItem value="speechbrain">SpeechBrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-model">Modelo de Vídeo</Label>
                  <Select 
                    value={config.models.video_model}
                    onValueChange={(value) => 
                      handleUpdateConfig({
                        models: { ...config.models, video_model: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mediapipe">MediaPipe</SelectItem>
                      <SelectItem value="openface">OpenFace</SelectItem>
                      <SelectItem value="facenet">FaceNet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Pesos do Ensemble</Label>
                  {Object.entries(config.models.ensemble_weights).map(([model, weight]) => (
                    <div key={model} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{model}:</span>
                        <span>{weight}%</span>
                      </div>
                      <Input 
                        type="range"
                        min="0"
                        max="100"
                        value={weight}
                        onChange={(e) => 
                          handleUpdateConfig({
                            models: {
                              ...config.models,
                              ensemble_weights: {
                                ...config.models.ensemble_weights,
                                [model]: parseInt(e.target.value)
                              }
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alerts-enabled">Alertas Habilitados</Label>
                  <Switch 
                    id="alerts-enabled"
                    checked={config.alerts.enabled}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        alerts: { ...config.alerts, enabled: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low-engagement">Limite de Baixo Engajamento (%)</Label>
                  <Input 
                    id="low-engagement"
                    type="number"
                    min="0"
                    max="100"
                    value={config.alerts.low_engagement_threshold}
                    onChange={(e) => 
                      handleUpdateConfig({
                        alerts: { ...config.alerts, low_engagement_threshold: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="high-confusion">Limite de Alta Confusão (%)</Label>
                  <Input 
                    id="high-confusion"
                    type="number"
                    min="0"
                    max="100"
                    value={config.alerts.high_confusion_threshold}
                    onChange={(e) => 
                      handleUpdateConfig({
                        alerts: { ...config.alerts, high_confusion_threshold: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sentiment-drop">Limite de Queda de Sentimento</Label>
                  <Input 
                    id="sentiment-drop"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.alerts.sentiment_drop_threshold}
                    onChange={(e) => 
                      handleUpdateConfig({
                        alerts: { ...config.alerts, sentiment_drop_threshold: parseFloat(e.target.value) }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Visualização */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Visualização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chart-type">Tipo de Gráfico</Label>
                  <Select 
                    value={config.visualization.chart_type}
                    onValueChange={(value: 'line' | 'area' | 'heatmap') => 
                      handleUpdateConfig({
                        visualization: { ...config.visualization, chart_type: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Linha</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                      <SelectItem value="heatmap">Heatmap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-resolution">Resolução Temporal</Label>
                  <Select 
                    value={config.visualization.time_resolution}
                    onValueChange={(value: 'second' | 'minute' | 'segment') => 
                      handleUpdateConfig({
                        visualization: { ...config.visualization, time_resolution: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="second">Segundo</SelectItem>
                      <SelectItem value="minute">Minuto</SelectItem>
                      <SelectItem value="segment">Segmento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-confidence">Mostrar Confiança</Label>
                  <Switch 
                    id="show-confidence"
                    checked={config.visualization.show_confidence}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        visualization: { ...config.visualization, show_confidence: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Exportação */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-raw">Incluir Dados Brutos</Label>
                  <Switch 
                    id="include-raw"
                    checked={config.export.include_raw_data}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        export: { ...config.export, include_raw_data: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-timestamps">Incluir Timestamps</Label>
                  <Switch 
                    id="include-timestamps"
                    checked={config.export.include_timestamps}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        export: { ...config.export, include_timestamps: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-recommendations">Incluir Recomendações</Label>
                  <Switch 
                    id="include-recommendations"
                    checked={config.export.include_recommendations}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig({
                        export: { ...config.export, include_recommendations: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-format">Formato Padrão</Label>
                  <Select 
                    value={config.export.default_format}
                    onValueChange={(value: 'pdf' | 'csv' | 'json') => 
                      handleUpdateConfig({
                        export: { ...config.export, default_format: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
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
const defaultConfig: SentimentConfig = {
  analysis: {
    auto_analyze: true,
    real_time: false,
    batch_size: 10,
    quality_threshold: 80,
    emotion_sensitivity: 1.0,
    segment_duration: 30
  },
  models: {
    text_model: 'gpt-4',
    audio_model: 'whisper-v3',
    video_model: 'mediapipe',
    ensemble_weights: {
      text: 40,
      audio: 30,
      video: 30
    }
  },
  alerts: {
    enabled: true,
    low_engagement_threshold: 30,
    high_confusion_threshold: 70,
    sentiment_drop_threshold: 0.3,
    notification_channels: ['email', 'dashboard']
  },
  visualization: {
    chart_type: 'line',
    time_resolution: 'minute',
    emotion_colors: {
      joy: '#10B981',
      sadness: '#3B82F6',
      anger: '#EF4444',
      fear: '#8B5CF6',
      surprise: '#F59E0B',
      disgust: '#84CC16',
      neutral: '#6B7280'
    },
    show_confidence: true
  },
  export: {
    include_raw_data: false,
    include_timestamps: true,
    include_recommendations: true,
    default_format: 'pdf'
  }
};

// Funções auxiliares para gerar dados mock
const generateMockMetrics = (): SentimentMetric[] => [
  {
    id: 'overall_engagement',
    name: 'Engajamento Geral',
    value: 0.78,
    change: 5.2,
    trend: 'up',
    status: 'good',
    category: 'engagement',
    description: 'Nível médio de engajamento dos estudantes',
    target: 0.80
  },
  {
    id: 'average_sentiment',
    name: 'Sentimento Médio',
    value: 0.65,
    change: 2.1,
    trend: 'up',
    status: 'good',
    category: 'emotion',
    description: 'Sentimento geral dos estudantes',
    target: 0.70
  },
  {
    id: 'attention_score',
    name: 'Pontuação de Atenção',
    value: 0.72,
    change: -1.5,
    trend: 'down',
    status: 'average',
    category: 'attention',
    description: 'Nível de atenção durante as aulas',
    target: 0.75
  },
  {
    id: 'comprehension_rate',
    name: 'Taxa de Compreensão',
    value: 0.68,
    change: 3.8,
    trend: 'up',
    status: 'good',
    category: 'comprehension',
    description: 'Taxa de compreensão do conteúdo',
    target: 0.75
  },
  {
    id: 'satisfaction_index',
    name: 'Índice de Satisfação',
    value: 0.82,
    change: 4.2,
    trend: 'up',
    status: 'excellent',
    category: 'satisfaction',
    description: 'Satisfação geral com o conteúdo',
    target: 0.80
  }
];

const generateMockVideoAnalyses = (): VideoAnalysis[] => [
  {
    id: 'video-1',
    title: 'Introdução à Matemática Básica',
    duration: 1800, // 30 minutos
    upload_date: new Date('2024-01-15'),
    analysis_date: new Date('2024-01-16'),
    status: 'completed',
    overall_sentiment: 0.72,
    engagement_score: 78.5,
    retention_rate: 85.2,
    critical_moments: [
      {
        timestamp: 450,
        type: 'confusion',
        severity: 'medium',
        description: 'Aumento significativo de confusão durante explicação de frações',
        suggestions: [
          'Adicionar exemplos visuais',
          'Reduzir velocidade da explicação',
          'Incluir exercícios práticos'
        ]
      },
      {
        timestamp: 1200,
        type: 'drop',
        severity: 'high',
        description: 'Queda abrupta no engajamento',
        suggestions: [
          'Adicionar elemento interativo',
          'Mudar tom de voz',
          'Incluir pergunta para audiência'
        ]
      }
    ],
    emotion_timeline: generateEmotionTimeline(1800),
    segments: [],
    insights: [
      {
        type: 'positive',
        title: 'Boa introdução',
        description: 'Os primeiros 5 minutos mantiveram alto engajamento',
        confidence: 92,
        impact: 'medium',
        recommendations: ['Aplicar mesmo estilo em outros vídeos']
      },
      {
        type: 'negative',
        title: 'Perda de atenção no meio',
        description: 'Engajamento caiu significativamente aos 20 minutos',
        confidence: 88,
        impact: 'high',
        recommendations: ['Adicionar break ou mudança de ritmo', 'Incluir elemento visual']
      }
    ]
  },
  {
    id: 'video-2',
    title: 'História do Brasil Colonial',
    duration: 2400, // 40 minutos
    upload_date: new Date('2024-01-10'),
    analysis_date: new Date('2024-01-11'),
    status: 'completed',
    overall_sentiment: 0.68,
    engagement_score: 72.3,
    retention_rate: 79.8,
    critical_moments: [],
    emotion_timeline: generateEmotionTimeline(2400),
    segments: [],
    insights: []
  },
  {
    id: 'video-3',
    title: 'Física Quântica Básica',
    duration: 3600, // 60 minutos
    upload_date: new Date('2024-01-20'),
    analysis_date: new Date(),
    status: 'analyzing',
    overall_sentiment: 0,
    engagement_score: 0,
    retention_rate: 0,
    critical_moments: [],
    emotion_timeline: [],
    segments: [],
    insights: []
  }
];

const generateEmotionTimeline = (duration: number): EmotionData[] => {
  const timeline: EmotionData[] = [];
  const points = Math.floor(duration / 30); // Um ponto a cada 30 segundos
  
  for (let i = 0; i < points; i++) {
    timeline.push({
      timestamp: i * 30,
      joy: Math.random() * 0.8 + 0.1,
      sadness: Math.random() * 0.3,
      anger: Math.random() * 0.2,
      fear: Math.random() * 0.25,
      surprise: Math.random() * 0.4,
      disgust: Math.random() * 0.15,
      neutral: Math.random() * 0.6 + 0.2,
      engagement: Math.random() * 0.7 + 0.3,
      attention: Math.random() * 0.8 + 0.2,
      confusion: Math.random() * 0.4,
      interest: Math.random() * 0.8 + 0.1,
      boredom: Math.random() * 0.3
    });
  }
  
  return timeline;
};

const generateMockAIModels = (): AIModel[] => [
  {
    id: 'model-1',
    name: 'GPT-4 Sentiment',
    type: 'text',
    provider: 'openai',
    version: '4.0',
    accuracy: 94.5,
    speed: 8,
    cost_per_minute: 0.0234,
    capabilities: ['sentiment', 'emotion', 'intent', 'context'],
    status: 'active',
    last_updated: new Date('2024-01-15'),
    configuration: {}
  },
  {
    id: 'model-2',
    name: 'Whisper Audio Analysis',
    type: 'audio',
    provider: 'openai',
    version: '3.0',
    accuracy: 91.2,
    speed: 7,
    cost_per_minute: 0.0156,
    capabilities: ['transcription', 'emotion', 'tone', 'pace'],
    status: 'active',
    last_updated: new Date('2024-01-12'),
    configuration: {}
  },
  {
    id: 'model-3',
    name: 'MediaPipe Face',
    type: 'video',
    provider: 'google',
    version: '2.1',
    accuracy: 87.8,
    speed: 6,
    cost_per_minute: 0.0089,
    capabilities: ['facial_expression', 'gaze', 'attention', 'micro_expressions'],
    status: 'active',
    last_updated: new Date('2024-01-10'),
    configuration: {}
  }
];

const generateMockReports = (): SentimentReport[] => [
  {
    id: 'report-1',
    name: 'Relatório Semanal de Sentimentos',
    type: 'summary',
    videos: ['video-1', 'video-2'],
    date_range: {
      start: new Date('2024-01-15'),
      end: new Date('2024-01-22')
    },
    metrics: ['engagement', 'sentiment', 'attention'],
    filters: {},
    generated_at: new Date('2024-01-22'),
    format: 'pdf',
    insights: [
      {
        category: 'Engajamento',
        findings: ['Melhoria de 5.2% na semana', 'Picos durante introduções'],
        recommendations: ['Manter estilo das introduções', 'Adicionar mais elementos visuais']
      }
    ]
  },
  {
    id: 'report-2',
    name: 'Análise Comparativa Mensal',
    type: 'comparative',
    videos: ['video-1', 'video-2', 'video-3'],
    date_range: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    metrics: ['all'],
    filters: {},
    generated_at: new Date('2024-01-31'),
    format: 'html',
    insights: []
  }
];

const generateEngagementData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      engagement: Math.random() * 40 + 40 // 40-80%
    });
  }
  return data;
};

const generateEmotionDistribution = () => [
  { name: 'joy', value: 35 },
  { name: 'neutral', value: 25 },
  { name: 'interest', value: 20 },
  { name: 'confusion', value: 10 },
  { name: 'boredom', value: 6 },
  { name: 'sadness', value: 4 }
];

const generateTopInsights = () => [
  {
    type: 'positive' as const,
    title: 'Excelente engajamento inicial',
    description: 'Os primeiros 10 minutos dos vídeos mantêm consistentemente alto engajamento',
    confidence: 94,
    impact: 'high' as const
  },
  {
    type: 'suggestion' as const,
    title: 'Oportunidade de melhoria',
    description: 'Adicionar elementos interativos pode aumentar retenção em 15%',
    confidence: 87,
    impact: 'medium' as const
  },
  {
    type: 'negative' as const,
    title: 'Queda de atenção recorrente',
    description: 'Padrão de perda de atenção após 20 minutos em 70% dos vídeos',
    confidence: 91,
    impact: 'high' as const
  }
];

const generateTimelineComparison = () => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({
      time: i * 30, // 30 segundos
      video1_engagement: Math.random() * 40 + 40,
      video2_engagement: Math.random() * 40 + 35,
      video3_engagement: Math.random() * 40 + 45
    });
  }
  return data;
};

const generateEmotionRadar = () => [
  { emotion: 'Alegria', value: 75 },
  { emotion: 'Interesse', value: 82 },
  { emotion: 'Atenção', value: 68 },
  { emotion: 'Compreensão', value: 71 },
  { emotion: 'Satisfação', value: 79 },
  { emotion: 'Motivação', value: 73 }
];

const generateLearningCorrelation = () => {
  const data = [];
  for (let i = 0; i < 50; i++) {
    const engagement = Math.random() * 100;
    const learning = engagement * 0.8 + Math.random() * 20; // Correlação positiva com ruído
    data.push({ engagement, learning });
  }
  return data;
};

const generateReportInsights = () => [
  {
    category: 'Engajamento',
    findings: [
      'Aumento de 12% no engajamento geral',
      'Picos consistentes nos primeiros 5 minutos',
      'Queda após 25 minutos em vídeos longos'
    ],
    recommendations: [
      'Manter formato das introduções',
      'Adicionar breaks a cada 20 minutos',
      'Incluir elementos interativos'
    ]
  },
  {
    category: 'Sentimentos',
    findings: [
      'Sentimento positivo em 78% do tempo',
      'Confusão reduzida em 15%',
      'Satisfação aumentou 8%'
    ],
    recommendations: [
      'Continuar abordagem atual',
      'Melhorar explicações complexas',
      'Adicionar mais exemplos práticos'
    ]
  },
  {
    category: 'Atenção',
    findings: [
      'Atenção média de 72%',
      'Variação entre disciplinas',
      'Melhor performance em manhãs'
    ],
    recommendations: [
      'Otimizar horários de publicação',
      'Adaptar conteúdo por disciplina',
      'Usar técnicas de storytelling'
    ]
  }
];

const generateModelComparison = () => [
  { name: 'GPT-4', accuracy: 94, speed: 80, cost_efficiency: 75 },
  { name: 'Claude-3', accuracy: 92, speed: 85, cost_efficiency: 80 },
  { name: 'Gemini', accuracy: 89, speed: 90, cost_efficiency: 85 },
  { name: 'Whisper', accuracy: 91, speed: 70, cost_efficiency: 90 }
];

export default AISentimentPanel;