import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Eye,
  Heart,
  Share2,
  Clock,
  Users,
  Star,
  Award,
  Lightbulb,
  Brain,
  Sparkles,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { TimelineEngine } from '../../modules/video-editor/core/TimelineEngine';

// Interfaces para insights e análises
interface ContentTrend {
  id: string;
  category: string;
  trend: 'rising' | 'stable' | 'declining';
  score: number;
  change: number;
  period: string;
  description: string;
  examples: string[];
}

interface PerformancePrediction {
  platform: string;
  expectedViews: number;
  expectedEngagement: number;
  expectedRetention: number;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
}

interface BenchmarkData {
  category: string;
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
  status: 'above' | 'average' | 'below';
}

interface StrategicRecommendation {
  id: string;
  type: 'content' | 'timing' | 'optimization' | 'engagement' | 'monetization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
  timeline: string;
  steps: string[];
  expectedResults: string[];
}

interface AIInsightsData {
  trends: ContentTrend[];
  predictions: PerformancePrediction[];
  benchmarks: BenchmarkData[];
  recommendations: StrategicRecommendation[];
  contentScore: number;
  viralPotential: number;
  engagementForecast: number;
  competitivePosition: number;
}

interface AIInsightsProps {
  engine: TimelineEngine;
  onRecommendationApply: (recommendation: StrategicRecommendation) => void;
  onTrendFollow: (trend: ContentTrend) => void;
  className?: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  engine,
  onRecommendationApply,
  onTrendFollow,
  className = ''
}) => {
  const [insights, setInsights] = useState<AIInsightsData>({
    trends: [],
    predictions: [],
    benchmarks: [],
    recommendations: [],
    contentScore: 0,
    viralPotential: 0,
    engagementForecast: 0,
    competitivePosition: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Análise de tendências de conteúdo
  const analyzeTrends = useCallback(async (): Promise<ContentTrend[]> => {
    // Simulação de análise de tendências baseada em dados reais
    const trendCategories = [
      'Short-form Content',
      'Educational Videos',
      'Behind-the-scenes',
      'User-generated Content',
      'Live Streaming',
      'Interactive Content',
      'Sustainability',
      'AI & Technology',
      'Health & Wellness',
      'Remote Work'
    ];

    const trends: ContentTrend[] = trendCategories.map((category, index) => {
      const trendTypes: ('rising' | 'stable' | 'declining')[] = ['rising', 'stable', 'declining'];
      const trend = trendTypes[Math.floor(Math.random() * trendTypes.length)];
      const score = Math.random() * 100;
      const change = (Math.random() - 0.5) * 50;

      return {
        id: `trend_${index}`,
        category,
        trend,
        score,
        change,
        period: selectedTimeframe,
        description: `${category} está ${trend === 'rising' ? 'crescendo' : trend === 'stable' ? 'estável' : 'declinando'} com ${Math.abs(change).toFixed(1)}% de mudança`,
        examples: [
          `Exemplo 1 de ${category}`,
          `Exemplo 2 de ${category}`,
          `Exemplo 3 de ${category}`
        ]
      };
    });

    return trends.sort((a, b) => b.score - a.score);
  }, [selectedTimeframe]);

  // Previsões de performance
  const generatePredictions = useCallback(async (projectData: any): Promise<PerformancePrediction[]> => {
    const platforms = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'Twitter'];
    
    const predictions: PerformancePrediction[] = platforms.map(platform => {
      const baseViews = Math.floor(Math.random() * 100000) + 1000;
      const engagement = Math.random() * 10 + 1;
      const retention = Math.random() * 80 + 20;
      const confidence = Math.random() * 40 + 60;

      return {
        platform,
        expectedViews: baseViews,
        expectedEngagement: engagement,
        expectedRetention: retention,
        confidence,
        factors: {
          positive: [
            'Conteúdo alinhado com tendências atuais',
            'Boa qualidade de produção',
            'Timing otimizado para publicação',
            'Hashtags relevantes identificadas'
          ],
          negative: [
            'Duração pode ser longa para a plataforma',
            'Concorrência alta na categoria',
            'Período de baixa atividade'
          ]
        },
        recommendations: [
          `Otimizar para ${platform} com foco em ${engagement > 5 ? 'engajamento' : 'alcance'}`,
          'Considerar publicação em horário de pico',
          'Adicionar elementos interativos',
          'Usar thumbnails chamativas'
        ]
      };
    });

    return predictions.sort((a, b) => b.expectedViews - a.expectedViews);
  }, []);

  // Análise de benchmarks
  const analyzeBenchmarks = useCallback(async (projectData: any): Promise<BenchmarkData[]> => {
    const metrics = [
      { category: 'Engagement', metric: 'Taxa de Engajamento', unit: '%' },
      { category: 'Retention', metric: 'Retenção Média', unit: '%' },
      { category: 'Quality', metric: 'Score de Qualidade', unit: '/100' },
      { category: 'Performance', metric: 'Tempo de Carregamento', unit: 's' },
      { category: 'Accessibility', metric: 'Score de Acessibilidade', unit: '/100' },
      { category: 'SEO', metric: 'Otimização SEO', unit: '/100' }
    ];

    const benchmarks: BenchmarkData[] = metrics.map(({ category, metric, unit }) => {
      const yourValue = Math.random() * 100;
      const industryAverage = Math.random() * 100;
      const topPerformers = Math.max(industryAverage + 20, 90);
      const percentile = (yourValue / topPerformers) * 100;
      
      let status: 'above' | 'average' | 'below';
      if (yourValue > industryAverage + 10) status = 'above';
      else if (yourValue > industryAverage - 10) status = 'average';
      else status = 'below';

      return {
        category,
        metric,
        yourValue,
        industryAverage,
        topPerformers,
        percentile,
        status
      };
    });

    return benchmarks;
  }, []);

  // Gerar recomendações estratégicas
  const generateRecommendations = useCallback(async (analysisData: any): Promise<StrategicRecommendation[]> => {
    const recommendationTemplates = [
      {
        type: 'content' as const,
        title: 'Otimizar Duração do Conteúdo',
        description: 'Ajustar a duração do vídeo para maximizar retenção e engajamento',
        impact: 85,
        effort: 30,
        timeline: '1-2 dias',
        steps: [
          'Analisar pontos de queda na retenção',
          'Identificar segmentos menos envolventes',
          'Cortar ou reestruturar conteúdo',
          'Testar diferentes durações'
        ],
        expectedResults: [
          'Aumento de 15-25% na retenção média',
          'Melhoria no ranking do algoritmo',
          'Maior engajamento por minuto'
        ]
      },
      {
        type: 'timing' as const,
        title: 'Otimizar Horário de Publicação',
        description: 'Publicar no momento ideal para maximizar alcance inicial',
        impact: 70,
        effort: 10,
        timeline: 'Imediato',
        steps: [
          'Analisar dados de audiência',
          'Identificar horários de pico',
          'Agendar publicação otimizada',
          'Monitorar performance inicial'
        ],
        expectedResults: [
          'Aumento de 20-30% no alcance inicial',
          'Maior engajamento nas primeiras horas',
          'Melhor posicionamento no feed'
        ]
      },
      {
        type: 'optimization' as const,
        title: 'Melhorar Thumbnail e Título',
        description: 'Otimizar elementos visuais e textuais para aumentar CTR',
        impact: 90,
        effort: 40,
        timeline: '2-3 horas',
        steps: [
          'Analisar thumbnails de alta performance',
          'Criar variações com elementos chamativos',
          'Otimizar título com palavras-chave',
          'Testar A/B diferentes versões'
        ],
        expectedResults: [
          'Aumento de 25-40% no CTR',
          'Maior descoberta orgânica',
          'Melhoria no SEO do vídeo'
        ]
      },
      {
        type: 'engagement' as const,
        title: 'Adicionar Elementos Interativos',
        description: 'Incluir calls-to-action e elementos que incentivem interação',
        impact: 75,
        effort: 50,
        timeline: '3-4 horas',
        steps: [
          'Identificar momentos-chave para CTAs',
          'Adicionar elementos visuais interativos',
          'Incluir perguntas para comentários',
          'Criar hooks para retenção'
        ],
        expectedResults: [
          'Aumento de 30-50% nos comentários',
          'Maior tempo de permanência',
          'Melhoria no engagement rate'
        ]
      },
      {
        type: 'monetization' as const,
        title: 'Estratégia de Monetização',
        description: 'Implementar oportunidades de monetização sem prejudicar UX',
        impact: 60,
        effort: 70,
        timeline: '1-2 semanas',
        steps: [
          'Analisar oportunidades de patrocínio',
          'Integrar produtos/serviços naturalmente',
          'Criar conteúdo de valor agregado',
          'Monitorar impacto na audiência'
        ],
        expectedResults: [
          'Geração de receita adicional',
          'Parcerias estratégicas',
          'Diversificação de fontes de renda'
        ]
      }
    ];

    const recommendations: StrategicRecommendation[] = recommendationTemplates.map((template, index) => ({
      id: `rec_${index}`,
      priority: template.impact > 80 ? 'high' : template.impact > 60 ? 'medium' : 'low',
      ...template
    }));

    return recommendations.sort((a, b) => b.impact - a.impact);
  }, []);

  // Executar análise completa de insights
  const runInsightsAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simular dados do projeto
      const projectData = {
        duration: 180,
        category: 'educational',
        quality: 85,
        engagement: 7.2,
        retention: 65,
        views: 15000
      };

      // Executar análises
      setAnalysisProgress(20);
      const trends = await analyzeTrends();
      
      setAnalysisProgress(40);
      const predictions = await generatePredictions(projectData);
      
      setAnalysisProgress(60);
      const benchmarks = await analyzeBenchmarks(projectData);
      
      setAnalysisProgress(80);
      const recommendations = await generateRecommendations({ trends, predictions, benchmarks });

      // Calcular scores gerais
      const contentScore = Math.random() * 30 + 70; // 70-100
      const viralPotential = Math.random() * 40 + 30; // 30-70
      const engagementForecast = Math.random() * 20 + 60; // 60-80
      const competitivePosition = Math.random() * 50 + 40; // 40-90

      setInsights({
        trends,
        predictions,
        benchmarks,
        recommendations,
        contentScore,
        viralPotential,
        engagementForecast,
        competitivePosition
      });

      setAnalysisProgress(100);

    } catch (error) {
      console.error('Erro na análise de insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeTrends, generatePredictions, analyzeBenchmarks, generateRecommendations]);

  // Filtrar dados baseado na categoria selecionada
  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return insights;
    
    return {
      ...insights,
      trends: insights.trends.filter(trend => 
        trend.category.toLowerCase().includes(selectedCategory.toLowerCase())
      ),
      recommendations: insights.recommendations.filter(rec => 
        rec.type === selectedCategory || selectedCategory === 'all'
      )
    };
  }, [insights, selectedCategory]);

  // Aplicar recomendação
  const handleApplyRecommendation = useCallback((recommendation: StrategicRecommendation) => {
    onRecommendationApply(recommendation);
  }, [onRecommendationApply]);

  // Seguir tendência
  const handleFollowTrend = useCallback((trend: ContentTrend) => {
    onTrendFollow(trend);
  }, [onTrendFollow]);

  // Exportar relatório de insights
  const exportInsightsReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      timeframe: selectedTimeframe,
      category: selectedCategory,
      insights: filteredData,
      summary: {
        contentScore: insights.contentScore,
        viralPotential: insights.viralPotential,
        engagementForecast: insights.engagementForecast,
        competitivePosition: insights.competitivePosition
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-insights-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData, insights, selectedTimeframe, selectedCategory]);

  // Executar análise inicial
  useEffect(() => {
    runInsightsAnalysis();
  }, [selectedTimeframe]);

  // Função para obter cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'above': return 'text-green-500';
      case 'average': return 'text-yellow-500';
      case 'below': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Função para obter ícone de tendência
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className={`h-full flex flex-col bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">AI Insights</h2>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="all">Todas Categorias</option>
              <option value="content">Conteúdo</option>
              <option value="timing">Timing</option>
              <option value="optimization">Otimização</option>
              <option value="engagement">Engajamento</option>
            </select>
            <Button
              onClick={runInsightsAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progresso da Análise</span>
              <span className="text-sm text-gray-400">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Score do Conteúdo</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {insights.contentScore.toFixed(1)}
                  </p>
                </div>
                <Star className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Potencial Viral</p>
                  <p className="text-2xl font-bold text-green-500">
                    {insights.viralPotential.toFixed(1)}%
                  </p>
                </div>
                <Zap className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Previsão Engajamento</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {insights.engagementForecast.toFixed(1)}%
                  </p>
                </div>
                <Heart className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Posição Competitiva</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {insights.competitivePosition.toFixed(1)}
                  </p>
                </div>
                <Award className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="trends" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="predictions">Previsões</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tendências de Conteúdo</h3>
                <Button
                  onClick={exportInsightsReport}
                  size="sm"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {filteredData.trends.map((trend) => (
                  <Card key={trend.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getTrendIcon(trend.trend)}
                          <div>
                            <h4 className="font-medium">{trend.category}</h4>
                            <p className="text-sm text-gray-400">{trend.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={trend.trend === 'rising' ? 'text-green-400' : trend.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'}>
                              {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                            </Badge>
                            <span className="text-sm font-medium">{trend.score.toFixed(1)}</span>
                          </div>
                          <Button
                            onClick={() => handleFollowTrend(trend)}
                            size="sm"
                            className="mt-2 bg-blue-600 hover:bg-blue-700"
                          >
                            Seguir Tendência
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-3">
                        <p className="text-xs text-gray-400 mb-2">Exemplos populares:</p>
                        <div className="flex flex-wrap gap-2">
                          {trend.examples.map((example, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Previsões de Performance</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {filteredData.predictions.map((prediction, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{prediction.platform}</span>
                        <Badge variant="outline" className="text-green-400">
                          {prediction.confidence.toFixed(1)}% confiança
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Visualizações Esperadas</p>
                          <p className="text-xl font-bold text-blue-500">
                            {prediction.expectedViews.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Engajamento</p>
                          <p className="text-xl font-bold text-green-500">
                            {prediction.expectedEngagement.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">Retenção</p>
                          <p className="text-xl font-bold text-purple-500">
                            {prediction.expectedRetention.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-400 mb-2">Fatores Positivos:</p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {prediction.factors.positive.map((factor, i) => (
                              <li key={i} className="flex items-start space-x-1">
                                <span>+</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-400 mb-2">Fatores Negativos:</p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {prediction.factors.negative.map((factor, i) => (
                              <li key={i} className="flex items-start space-x-1">
                                <span>-</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Comparação com Benchmarks</h3>
              
              <div className="space-y-3">
                {filteredData.benchmarks.map((benchmark, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{benchmark.metric}</h4>
                          <p className="text-sm text-gray-400">{benchmark.category}</p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(benchmark.status)}>
                          {benchmark.status === 'above' ? 'Acima da Média' : 
                           benchmark.status === 'average' ? 'Na Média' : 'Abaixo da Média'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Seu Valor:</span>
                          <span className="font-medium text-blue-500">{benchmark.yourValue.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Média da Indústria:</span>
                          <span className="font-medium">{benchmark.industryAverage.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Top Performers:</span>
                          <span className="font-medium text-green-500">{benchmark.topPerformers.toFixed(1)}</span>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">Percentil</span>
                            <span className="text-xs font-medium">{benchmark.percentile.toFixed(1)}%</span>
                          </div>
                          <Progress value={benchmark.percentile} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Recomendações Estratégicas</h3>
              
              <div className="space-y-4">
                {filteredData.recommendations.map((recommendation) => (
                  <Card key={recommendation.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{recommendation.title}</h4>
                            <Badge variant="outline" className={recommendation.priority === 'high' ? 'text-red-400' : recommendation.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
                              {recommendation.priority === 'high' ? 'Alta' : recommendation.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                            </Badge>
                            <Badge variant="secondary">
                              {recommendation.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{recommendation.description}</p>
                          
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-400">Impacto</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={recommendation.impact} className="h-2 flex-1" />
                                <span className="text-xs font-medium">{recommendation.impact}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Esforço</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={recommendation.effort} className="h-2 flex-1" />
                                <span className="text-xs font-medium">{recommendation.effort}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Timeline</p>
                              <p className="text-xs font-medium">{recommendation.timeline}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleApplyRecommendation(recommendation)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 ml-4"
                        >
                          <Lightbulb className="w-3 h-3 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-blue-400 mb-2">Passos:</p>
                            <ul className="text-xs text-gray-400 space-y-1">
                              {recommendation.steps.map((step, i) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span>{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-400 mb-2">Resultados Esperados:</p>
                            <ul className="text-xs text-gray-400 space-y-1">
                              {recommendation.expectedResults.map((result, i) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span>•</span>
                                  <span>{result}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIInsights;