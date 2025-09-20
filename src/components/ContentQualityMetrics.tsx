import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Zap,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  category: 'content' | 'engagement' | 'compliance' | 'technical';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface ContentAnalysis {
  id: string;
  title: string;
  type: 'script' | 'storyboard' | 'captions';
  createdAt: string;
  metrics: QualityMetric[];
  overallScore: number;
  recommendations: string[];
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
  processingTime: number;
}

interface QualityTrend {
  date: string;
  overallScore: number;
  contentQuality: number;
  engagement: number;
  compliance: number;
  technical: number;
}

const ContentQualityMetrics: React.FC = () => {
  const [analyses, setAnalyses] = useState<ContentAnalysis[]>([]);
  const [trends, setTrends] = useState<QualityTrend[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categoryColors = {
    content: '#3b82f6',
    engagement: '#10b981',
    compliance: '#f59e0b',
    technical: '#8b5cf6'
  };

  const complianceColors = {
    compliant: '#10b981',
    partial: '#f59e0b',
    'non-compliant': '#ef4444'
  };

  useEffect(() => {
    loadQualityMetrics();
    loadTrends();
  }, [timeRange]);

  const loadQualityMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/quality-metrics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar métricas');
      }

      const data = await response.json();
      setAnalyses(data.analyses);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas de qualidade.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      const response = await fetch(`/api/ai/quality-trends?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar tendências');
      }

      const data = await response.json();
      setTrends(data.trends);
    } catch (error) {
      console.error('Erro ao carregar tendências:', error);
    }
  };

  const analyzeContent = async (contentId: string, contentType: string) => {
    try {
      const response = await fetch('/api/ai/analyze-content-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contentId,
          contentType,
          analysisType: 'comprehensive'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao analisar conteúdo');
      }

      const data = await response.json();
      setAnalyses(prev => [data.analysis, ...prev]);
      toast.success('Análise de qualidade concluída!');
    } catch (error) {
      console.error('Erro ao analisar conteúdo:', error);
      toast.error('Erro ao analisar qualidade do conteúdo.');
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/ai/export-quality-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          timeRange,
          includeDetails: true,
          format: 'pdf'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    if (filterCategory === 'all') return true;
    return analysis.type === filterCategory;
  });

  const averageScore = analyses.length > 0 
    ? analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / analyses.length 
    : 0;

  const complianceDistribution = analyses.reduce((acc, analysis) => {
    acc[analysis.complianceStatus] = (acc[analysis.complianceStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(complianceDistribution).map(([status, count]) => ({
    name: status,
    value: count,
    color: complianceColors[status as keyof typeof complianceColors]
  }));

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas de Qualidade IA</h2>
          <p className="text-gray-600">Análise da qualidade do conteúdo gerado por IA</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <Button onClick={loadQualityMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score Médio</p>
                <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(1)}
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Análises</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conformidade</p>
                <p className="text-2xl font-bold text-green-600">
                  {((complianceDistribution.compliant || 0) / analyses.length * 100).toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + a.processingTime, 0) / analyses.length / 1000).toFixed(1)
                    : 0}s
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="compliance">Conformidade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyses.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="overallScore" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status de Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Qualidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="overallScore" stroke="#3b82f6" name="Score Geral" />
                  <Line type="monotone" dataKey="contentQuality" stroke="#10b981" name="Qualidade" />
                  <Line type="monotone" dataKey="engagement" stroke="#f59e0b" name="Engajamento" />
                  <Line type="monotone" dataKey="compliance" stroke="#ef4444" name="Conformidade" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos os tipos</option>
              <option value="script">Roteiros</option>
              <option value="storyboard">Storyboards</option>
              <option value="captions">Legendas</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedAnalysis(analysis)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{analysis.title}</h3>
                      <Badge variant="outline">{analysis.type}</Badge>
                      <Badge variant={getScoreBadgeVariant(analysis.overallScore)}>
                        {analysis.overallScore.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        style={{ backgroundColor: complianceColors[analysis.complianceStatus] }}
                        className="text-white"
                      >
                        {analysis.complianceStatus}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysis.metrics.slice(0, 4).map((metric) => (
                      <div key={metric.id} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-sm font-medium">{metric.name}</span>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <Progress 
                          value={(metric.value / metric.maxValue) * 100} 
                          className="h-2"
                        />
                        <span className="text-xs text-gray-600">
                          {metric.value}/{metric.maxValue}
                        </span>
                      </div>
                    ))}
                  </div>

                  {analysis.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-1">Principais Recomendações:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-blue-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Radar de Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'NR-5', A: 85, fullMark: 100 },
                    { subject: 'NR-6', A: 92, fullMark: 100 },
                    { subject: 'NR-10', A: 78, fullMark: 100 },
                    { subject: 'NR-12', A: 88, fullMark: 100 },
                    { subject: 'NR-35', A: 95, fullMark: 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Conformidade" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas de Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyses
                    .filter(a => a.complianceStatus !== 'compliant')
                    .slice(0, 5)
                    .map((analysis) => (
                    <div key={analysis.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{analysis.title}</p>
                        <p className="text-xs text-gray-600">
                          Status: {analysis.complianceStatus}
                        </p>
                        {analysis.recommendations.length > 0 && (
                          <p className="text-xs text-gray-700 mt-1">
                            {analysis.recommendations[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedAnalysis.title}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedAnalysis(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedAnalysis.metrics.map((metric) => (
                  <div key={metric.id} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className="font-medium">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ color: categoryColors[metric.category] }}>
                      {metric.value}
                    </div>
                    <Progress value={(metric.value / metric.maxValue) * 100} className="mb-1" />
                    <p className="text-xs text-gray-600">{metric.description}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-medium mb-2">Recomendações de Melhoria</h4>
                <ul className="space-y-2">
                  {selectedAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentQualityMetrics;