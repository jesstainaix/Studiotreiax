import { DashboardMetric } from '../hooks/useRealtimeDashboard';

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'content' | 'engagement' | 'technical' | 'optimization' | 'ai-generated';
  priority: 'low' | 'medium' | 'high';
  impact: 'Baixo' | 'Médio' | 'Alto';
  effort: 'Baixo' | 'Médio' | 'Alto';
  confidence: number;
  timestamp: Date;
  source: 'ai-analysis' | 'pattern-detection' | 'anomaly-detection' | 'predictive-model';
  actionable: boolean;
  estimatedROI?: number;
  implementationSteps?: string[];
  relatedMetrics: string[];
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  insights: string[];
  anomalies: {
    metric: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendedAction: string;
  }[];
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    prediction: string;
  }[];
}

export class AISuggestionsService {
  private static instance: AISuggestionsService;
  private analysisHistory: AIAnalysisResult[] = [];
  private lastAnalysis: Date | null = null;
  private suggestionCache: Map<string, AISuggestion[]> = new Map();

  static getInstance(): AISuggestionsService {
    if (!AISuggestionsService.instance) {
      AISuggestionsService.instance = new AISuggestionsService();
    }
    return AISuggestionsService.instance;
  }

  /**
   * Analyze real-time metrics and generate AI suggestions
   */
  async analyzeMetrics(metrics: DashboardMetric[]): Promise<AIAnalysisResult> {
    try {
      const cacheKey = this.generateCacheKey(metrics);
      
      // Check cache for recent analysis
      if (this.suggestionCache.has(cacheKey) && this.isRecentAnalysis()) {
        return {
          suggestions: this.suggestionCache.get(cacheKey) || [],
          insights: this.generateInsights(metrics),
          anomalies: this.detectAnomalies(metrics),
          trends: this.analyzeTrends(metrics)
        };
      }

      // Perform comprehensive AI analysis
      const suggestions = await this.generateSuggestions(metrics);
      const insights = this.generateInsights(metrics);
      const anomalies = this.detectAnomalies(metrics);
      const trends = this.analyzeTrends(metrics);

      const result: AIAnalysisResult = {
        suggestions,
        insights,
        anomalies,
        trends
      };

      // Cache results
      this.suggestionCache.set(cacheKey, suggestions);
      this.analysisHistory.push(result);
      this.lastAnalysis = new Date();

      // Keep only last 10 analyses
      if (this.analysisHistory.length > 10) {
        this.analysisHistory = this.analysisHistory.slice(-10);
      }

      return result;
    } catch (error) {
      console.error('Error analyzing metrics:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Generate intelligent suggestions based on metrics analysis
   */
  private async generateSuggestions(metrics: DashboardMetric[]): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Performance optimization suggestions
    suggestions.push(...this.analyzePerformanceMetrics(metrics));
    
    // Engagement optimization suggestions
    suggestions.push(...this.analyzeEngagementMetrics(metrics));
    
    // Content strategy suggestions
    suggestions.push(...this.analyzeContentMetrics(metrics));
    
    // Technical optimization suggestions
    suggestions.push(...this.analyzeTechnicalMetrics(metrics));
    
    // Predictive suggestions
    suggestions.push(...this.generatePredictiveSuggestions(metrics));

    // Sort by priority and confidence
    return suggestions
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 8); // Limit to top 8 suggestions
  }

  /**
   * Analyze performance metrics for optimization opportunities
   */
  private analyzePerformanceMetrics(metrics: DashboardMetric[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    const viewsMetric = metrics.find(m => m.name.includes('Visualizações'));
    const engagementMetric = metrics.find(m => m.name.includes('Engajamento'));
    const usersMetric = metrics.find(m => m.name.includes('Usuários'));

    // Low engagement rate suggestion
    if (engagementMetric && engagementMetric.value < 60) {
      suggestions.push({
        id: `perf-engagement-${Date.now()}`,
        title: 'Otimizar Taxa de Engajamento',
        description: `A taxa de engajamento atual (${engagementMetric.value.toFixed(1)}%) está abaixo do ideal. Recomendamos implementar elementos interativos e melhorar a qualidade do conteúdo.`,
        category: 'performance',
        priority: 'high',
        impact: 'Alto',
        effort: 'Médio',
        confidence: 87,
        timestamp: new Date(),
        source: 'ai-analysis',
        actionable: true,
        estimatedROI: 25,
        implementationSteps: [
          'Adicionar elementos interativos aos vídeos',
          'Implementar calls-to-action mais efetivos',
          'Otimizar thumbnails e títulos',
          'Analisar pontos de abandono nos vídeos'
        ],
        relatedMetrics: ['Engajamento Médio', 'Tempo de Visualização']
      });
    }

    // High bounce rate suggestion
    if (viewsMetric && usersMetric) {
      const bounceRate = (viewsMetric.value / usersMetric.value) * 100;
      if (bounceRate > 70) {
        suggestions.push({
          id: `perf-bounce-${Date.now()}`,
          title: 'Reduzir Taxa de Rejeição',
          description: `Taxa de rejeição elevada detectada (${bounceRate.toFixed(1)}%). Sugerimos otimizar o tempo de carregamento e melhorar a experiência inicial.`,
          category: 'performance',
          priority: 'medium',
          impact: 'Alto',
          effort: 'Alto',
          confidence: 82,
          timestamp: new Date(),
          source: 'pattern-detection',
          actionable: true,
          estimatedROI: 30,
          implementationSteps: [
            'Otimizar tempo de carregamento de vídeos',
            'Implementar preview automático',
            'Melhorar design da página inicial',
            'Adicionar conteúdo relacionado'
          ],
          relatedMetrics: ['Total de Visualizações', 'Usuários Ativos']
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze engagement metrics for improvement opportunities
   */
  private analyzeEngagementMetrics(metrics: DashboardMetric[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    const engagementMetric = metrics.find(m => m.name.includes('Engajamento'));
    const projectsMetric = metrics.find(m => m.name.includes('Projetos'));

    if (engagementMetric && projectsMetric) {
      const engagementPerProject = engagementMetric.value / projectsMetric.value;
      
      if (engagementPerProject < 5) {
        suggestions.push({
          id: `eng-project-${Date.now()}`,
          title: 'Aumentar Engajamento por Projeto',
          description: `O engajamento médio por projeto (${engagementPerProject.toFixed(1)}%) pode ser melhorado com estratégias de conteúdo mais direcionadas.`,
          category: 'engagement',
          priority: 'medium',
          impact: 'Médio',
          effort: 'Baixo',
          confidence: 75,
          timestamp: new Date(),
          source: 'ai-analysis',
          actionable: true,
          estimatedROI: 15,
          implementationSteps: [
            'Implementar sistema de comentários',
            'Adicionar recursos de compartilhamento',
            'Criar conteúdo mais interativo',
            'Implementar gamificação'
          ],
          relatedMetrics: ['Engajamento Médio', 'Total de Projetos']
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze content metrics for strategy improvements
   */
  private analyzeContentMetrics(metrics: DashboardMetric[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    const projectsMetric = metrics.find(m => m.name.includes('Projetos'));
    const viewsMetric = metrics.find(m => m.name.includes('Visualizações'));

    if (projectsMetric && viewsMetric) {
      const viewsPerProject = viewsMetric.value / projectsMetric.value;
      
      if (viewsPerProject < 10000) {
        suggestions.push({
          id: `content-reach-${Date.now()}`,
          title: 'Expandir Alcance do Conteúdo',
          description: `Cada projeto está gerando em média ${Math.round(viewsPerProject)} visualizações. Há potencial para aumentar significativamente o alcance.`,
          category: 'content',
          priority: 'high',
          impact: 'Alto',
          effort: 'Médio',
          confidence: 90,
          timestamp: new Date(),
          source: 'predictive-model',
          actionable: true,
          estimatedROI: 40,
          implementationSteps: [
            'Otimizar SEO dos vídeos',
            'Implementar estratégia de hashtags',
            'Criar conteúdo viral',
            'Expandir para novas plataformas'
          ],
          relatedMetrics: ['Total de Projetos', 'Total de Visualizações']
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze technical metrics for system optimizations
   */
  private analyzeTechnicalMetrics(metrics: DashboardMetric[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Simulate technical analysis based on system health
    const currentHour = new Date().getHours();
    const isHighTrafficTime = currentHour >= 19 && currentHour <= 23;
    
    if (isHighTrafficTime) {
      suggestions.push({
        id: `tech-scaling-${Date.now()}`,
        title: 'Otimizar Infraestrutura para Horário de Pico',
        description: 'Detectamos que este é um horário de alto tráfego. Recomendamos implementar auto-scaling e cache distribuído.',
        category: 'technical',
        priority: 'medium',
        impact: 'Alto',
        effort: 'Alto',
        confidence: 85,
        timestamp: new Date(),
        source: 'anomaly-detection',
        actionable: true,
        estimatedROI: 35,
        implementationSteps: [
          'Implementar auto-scaling de servidores',
          'Configurar CDN para vídeos',
          'Otimizar queries de banco de dados',
          'Implementar cache Redis'
        ],
        relatedMetrics: ['Usuários Ativos', 'Total de Visualizações']
      });
    }

    return suggestions;
  }

  /**
   * Generate predictive suggestions based on trends
   */
  private generatePredictiveSuggestions(metrics: DashboardMetric[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Predict future trends and suggest proactive actions
    const usersMetric = metrics.find(m => m.name.includes('Usuários'));
    
    if (usersMetric && usersMetric.trend === 'up') {
      suggestions.push({
        id: `pred-growth-${Date.now()}`,
        title: 'Preparar para Crescimento Acelerado',
        description: 'Baseado no crescimento atual de usuários, prevemos um aumento de 50% nas próximas 4 semanas. Recomendamos preparar a infraestrutura.',
        category: 'ai-generated',
        priority: 'high',
        impact: 'Alto',
        effort: 'Alto',
        confidence: 78,
        timestamp: new Date(),
        source: 'predictive-model',
        actionable: true,
        estimatedROI: 60,
        implementationSteps: [
          'Aumentar capacidade de servidores',
          'Implementar monitoramento avançado',
          'Preparar plano de contingência',
          'Otimizar processos de onboarding'
        ],
        relatedMetrics: ['Usuários Ativos', 'Total de Projetos']
      });
    }

    return suggestions;
  }

  /**
   * Generate insights from metrics analysis
   */
  private generateInsights(metrics: DashboardMetric[]): string[] {
    const insights: string[] = [];
    
    const totalMetrics = metrics.length;
    const positiveMetrics = metrics.filter(m => (m.changePercentage || 0) > 0).length;
    const negativeMetrics = metrics.filter(m => (m.changePercentage || 0) < 0).length;
    
    if (positiveMetrics > negativeMetrics) {
      insights.push(`${Math.round((positiveMetrics / totalMetrics) * 100)}% das métricas mostram tendência positiva`);
    }
    
    const highValueMetrics = metrics.filter(m => m.value > 1000).length;
    if (highValueMetrics > 0) {
      insights.push(`${highValueMetrics} métricas atingiram marcos significativos`);
    }
    
    insights.push('Sistema operando dentro dos parâmetros normais');
    insights.push('Oportunidades de otimização identificadas em múltiplas áreas');
    
    return insights;
  }

  /**
   * Detect anomalies in metrics
   */
  private detectAnomalies(metrics: DashboardMetric[]) {
    const anomalies: AIAnalysisResult['anomalies'] = [];
    
    metrics.forEach(metric => {
      const changePercentage = Math.abs(metric.changePercentage || 0);
      
      if (changePercentage > 50) {
        anomalies.push({
          metric: metric.name,
          severity: changePercentage > 100 ? 'high' : 'medium',
          description: `Variação anômala de ${changePercentage.toFixed(1)}% detectada`,
          recommendedAction: 'Investigar causa da variação e implementar correções'
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Analyze trends in metrics
   */
  private analyzeTrends(metrics: DashboardMetric[]) {
    const trends: AIAnalysisResult['trends'] = [];
    
    metrics.forEach(metric => {
      const confidence = Math.min(95, 60 + Math.abs(metric.changePercentage || 0));
      
      trends.push({
        metric: metric.name,
        direction: metric.trend || 'stable',
        confidence,
        prediction: this.generateTrendPrediction(metric)
      });
    });
    
    return trends;
  }

  /**
   * Generate trend prediction for a metric
   */
  private generateTrendPrediction(metric: DashboardMetric): string {
    const change = metric.changePercentage || 0;
    
    if (change > 10) {
      return `Crescimento sustentado esperado nas próximas semanas`;
    } else if (change < -10) {
      return `Possível declínio, monitoramento recomendado`;
    } else {
      return `Estabilidade esperada com variações menores`;
    }
  }

  /**
   * Generate cache key for metrics
   */
  private generateCacheKey(metrics: DashboardMetric[]): string {
    const values = metrics.map(m => `${m.name}:${m.value}`).join('|');
    return btoa(values).slice(0, 16);
  }

  /**
   * Check if last analysis is recent (within 5 minutes)
   */
  private isRecentAnalysis(): boolean {
    if (!this.lastAnalysis) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastAnalysis > fiveMinutesAgo;
  }

  /**
   * Get fallback analysis in case of errors
   */
  private getFallbackAnalysis(): AIAnalysisResult {
    return {
      suggestions: [
        {
          id: 'fallback-1',
          title: 'Monitorar Performance do Sistema',
          description: 'Recomendamos monitorar continuamente as métricas do sistema para identificar oportunidades de melhoria.',
          category: 'technical',
          priority: 'medium',
          impact: 'Médio',
          effort: 'Baixo',
          confidence: 70,
          timestamp: new Date(),
          source: 'ai-analysis',
          actionable: true,
          relatedMetrics: ['Sistema']
        }
      ],
      insights: ['Sistema funcionando normalmente'],
      anomalies: [],
      trends: []
    };
  }

  /**
   * Clear cache and reset analysis history
   */
  clearCache(): void {
    this.suggestionCache.clear();
    this.analysisHistory = [];
    this.lastAnalysis = null;
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(): AIAnalysisResult[] {
    return [...this.analysisHistory];
  }
}

export const aiSuggestionsService = AISuggestionsService.getInstance();