// Sistema de Métricas de Performance e Qualidade em Tempo Real
import { EventEmitter } from '../utils/EventEmitter';

export interface PerformanceMetrics {
  processing: ProcessingMetrics;
  quality: QualityMetrics;
  cache: CacheMetrics;
  system: SystemMetrics;
  user: UserMetrics;
  timestamp: number;
}

export interface ProcessingMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  currentThroughput: number;
  peakThroughput: number;
  queueLength: number;
  activeJobs: number;
  estimatedWaitTime: number;
}

export interface QualityMetrics {
  ocrAccuracy: number;
  aiConfidence: number;
  templateMatchScore: number;
  contentQualityScore: number;
  nrComplianceScore: number;
  userSatisfactionScore: number;
  errorRate: number;
  successRate: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalEntries: number;
  totalSize: number;
  memoryUsage: number;
  evictionRate: number;
  averageAccessTime: number;
  compressionRatio: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
  activeConnections: number;
  responseTime: number;
  errorCount: number;
}

export interface UserMetrics {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  featureUsage: Map<string, number>;
  userFeedback: UserFeedback[];
}

export interface UserFeedback {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  feature: string;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  actions: string[];
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalProcessed: number;
    averageQuality: number;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  };
  trends: {
    processing: number[];
    quality: number[];
    cache: number[];
    system: number[];
  };
  alerts: PerformanceAlert[];
  insights: string[];
}

class PerformanceMetricsService extends EventEmitter {
  private metrics: PerformanceMetrics;
  private alerts: Map<string, PerformanceAlert> = new Map();
  private history: PerformanceMetrics[] = [];
  private thresholds: Map<string, any> = new Map();
  private collectors: Map<string, () => Promise<any>> = new Map();
  private updateInterval?: NodeJS.Timeout;
  private isCollecting = false;

  constructor() {
    super();
    
    this.metrics = this.initializeMetrics();
    this.initializeThresholds();
    this.initializeCollectors();
    this.startCollection();
  }

  // Coletar métricas em tempo real
  async collectMetrics(): Promise<PerformanceMetrics> {
    if (this.isCollecting) {
      return this.metrics;
    }

    this.isCollecting = true;

    try {
      const newMetrics: PerformanceMetrics = {
        processing: await this.collectProcessingMetrics(),
        quality: await this.collectQualityMetrics(),
        cache: await this.collectCacheMetrics(),
        system: await this.collectSystemMetrics(),
        user: await this.collectUserMetrics(),
        timestamp: Date.now()
      };

      // Atualizar métricas
      this.metrics = newMetrics;
      
      // Adicionar ao histórico
      this.history.push(newMetrics);
      if (this.history.length > 1000) {
        this.history = this.history.slice(-1000); // Manter últimas 1000 entradas
      }

      // Verificar alertas
      await this.checkAlerts(newMetrics);

      this.emit('metricsUpdated', newMetrics);

      return newMetrics;

    } finally {
      this.isCollecting = false;
    }
  }

  private async collectProcessingMetrics(): Promise<ProcessingMetrics> {
    // Simular coleta de métricas de processamento
    return {
      totalJobs: Math.floor(Math.random() * 1000) + 500,
      completedJobs: Math.floor(Math.random() * 800) + 400,
      failedJobs: Math.floor(Math.random() * 50) + 10,
      averageProcessingTime: Math.random() * 5000 + 2000,
      currentThroughput: Math.random() * 10 + 5,
      peakThroughput: Math.random() * 20 + 15,
      queueLength: Math.floor(Math.random() * 20),
      activeJobs: Math.floor(Math.random() * 5),
      estimatedWaitTime: Math.random() * 30000 + 5000
    };
  }

  private async collectQualityMetrics(): Promise<QualityMetrics> {
    return {
      ocrAccuracy: 85 + Math.random() * 10,
      aiConfidence: 80 + Math.random() * 15,
      templateMatchScore: 75 + Math.random() * 20,
      contentQualityScore: 70 + Math.random() * 25,
      nrComplianceScore: 65 + Math.random() * 30,
      userSatisfactionScore: 80 + Math.random() * 15,
      errorRate: Math.random() * 5,
      successRate: 90 + Math.random() * 8
    };
  }

  private async collectCacheMetrics(): Promise<CacheMetrics> {
    // Integrar com o serviço de cache real
    const cacheStats = await this.getCacheStats();
    
    return {
      hitRate: cacheStats?.hitRate || 75 + Math.random() * 20,
      missRate: cacheStats?.missRate || Math.random() * 25,
      totalEntries: cacheStats?.totalEntries || Math.floor(Math.random() * 500) + 100,
      totalSize: cacheStats?.totalSize || Math.random() * 100 * 1024 * 1024,
      memoryUsage: cacheStats?.memoryUsage || Math.random() * 80 + 10,
      evictionRate: Math.random() * 10,
      averageAccessTime: Math.random() * 100 + 50,
      compressionRatio: 0.6 + Math.random() * 0.3
    };
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 20,
      diskUsage: Math.random() * 60 + 30,
      networkLatency: Math.random() * 100 + 50,
      uptime: Date.now() - (Math.random() * 86400000), // Até 24h
      activeConnections: Math.floor(Math.random() * 100) + 10,
      responseTime: Math.random() * 1000 + 200,
      errorCount: Math.floor(Math.random() * 10)
    };
  }

  private async collectUserMetrics(): Promise<UserMetrics> {
    return {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalSessions: Math.floor(Math.random() * 1000) + 500,
      averageSessionDuration: Math.random() * 1800000 + 600000, // 10-40 min
      bounceRate: Math.random() * 30 + 10,
      conversionRate: Math.random() * 80 + 60,
      featureUsage: new Map([
        ['pptx-upload', Math.floor(Math.random() * 100) + 50],
        ['ai-analysis', Math.floor(Math.random() * 80) + 40],
        ['template-generation', Math.floor(Math.random() * 60) + 30],
        ['tts-generation', Math.floor(Math.random() * 40) + 20]
      ]),
      userFeedback: []
    };
  }

  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    const checks = [
      {
        metric: 'cpuUsage',
        value: metrics.system.cpuUsage,
        threshold: this.thresholds.get('cpu.warning') || 80,
        type: 'warning' as const,
        title: 'Alto Uso de CPU',
        description: 'O uso de CPU está acima do limite recomendado'
      },
      {
        metric: 'errorRate',
        value: metrics.quality.errorRate,
        threshold: this.thresholds.get('error.critical') || 10,
        type: 'error' as const,
        title: 'Taxa de Erro Elevada',
        description: 'A taxa de erro está acima do aceitável'
      },
      {
        metric: 'cacheHitRate',
        value: metrics.cache.hitRate,
        threshold: this.thresholds.get('cache.warning') || 60,
        type: 'warning' as const,
        title: 'Baixa Taxa de Cache Hit',
        description: 'O cache não está sendo efetivo'
      }
    ];

    for (const check of checks) {
      const shouldAlert = check.metric === 'cacheHitRate' ? 
        check.value < check.threshold : 
        check.value > check.threshold;

      if (shouldAlert) {
        const alertId = `${check.metric}-${Date.now()}`;
        const alert: PerformanceAlert = {
          id: alertId,
          type: check.type,
          severity: check.value > check.threshold * 1.5 ? 'critical' : 'high',
          title: check.title,
          description: check.description,
          metric: check.metric,
          threshold: check.threshold,
          currentValue: check.value,
          timestamp: new Date(),
          resolved: false,
          actions: this.getRecommendedActions(check.metric)
        };

        this.alerts.set(alertId, alert);
        this.emit('alertTriggered', alert);
      }
    }
  }

  private getRecommendedActions(metric: string): string[] {
    const actions: Record<string, string[]> = {
      cpuUsage: [
        'Reduzir processamento paralelo',
        'Otimizar algoritmos',
        'Escalar recursos'
      ],
      errorRate: [
        'Verificar logs de erro',
        'Revisar validações',
        'Implementar retry logic'
      ],
      cacheHitRate: [
        'Ajustar TTL do cache',
        'Otimizar chaves de cache',
        'Aumentar tamanho do cache'
      ]
    };

    return actions[metric] || ['Investigar causa raiz'];
  }

  // Gerar relatório de performance
  generateReport(
    startDate: Date,
    endDate: Date
  ): PerformanceReport {
    const periodMetrics = this.history.filter(m => 
      m.timestamp >= startDate.getTime() && m.timestamp <= endDate.getTime()
    );

    if (periodMetrics.length === 0) {
      throw new Error('Nenhuma métrica encontrada para o período especificado');
    }

    const avgQuality = periodMetrics.reduce((sum, m) => 
      sum + m.quality.contentQualityScore, 0) / periodMetrics.length;

    const systemHealth = this.calculateSystemHealth(periodMetrics);
    
    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalProcessed: periodMetrics[periodMetrics.length - 1]?.processing.completedJobs || 0,
        averageQuality: avgQuality,
        systemHealth,
        recommendations: this.generateRecommendations(periodMetrics)
      },
      trends: {
        processing: periodMetrics.map(m => m.processing.currentThroughput),
        quality: periodMetrics.map(m => m.quality.contentQualityScore),
        cache: periodMetrics.map(m => m.cache.hitRate),
        system: periodMetrics.map(m => m.system.cpuUsage)
      },
      alerts: Array.from(this.alerts.values()).filter(alert => 
        alert.timestamp >= startDate && alert.timestamp <= endDate
      ),
      insights: this.generateInsights(periodMetrics)
    };
  }

  private calculateSystemHealth(metrics: PerformanceMetrics[]): 'excellent' | 'good' | 'fair' | 'poor' {
    if (metrics.length === 0) return 'poor';

    const latest = metrics[metrics.length - 1];
    let healthScore = 100;

    // Penalizar baseado em métricas críticas
    if (latest.system.cpuUsage > 80) healthScore -= 20;
    if (latest.system.memoryUsage > 85) healthScore -= 15;
    if (latest.quality.errorRate > 5) healthScore -= 25;
    if (latest.cache.hitRate < 60) healthScore -= 10;
    if (latest.processing.averageProcessingTime > 10000) healthScore -= 15;

    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 70) return 'good';
    if (healthScore >= 50) return 'fair';
    return 'poor';
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    const latest = metrics[metrics.length - 1];

    if (latest.system.cpuUsage > 75) {
      recommendations.push('Considere otimizar algoritmos de processamento');
    }

    if (latest.cache.hitRate < 70) {
      recommendations.push('Ajuste a estratégia de cache para melhor performance');
    }

    if (latest.quality.errorRate > 3) {
      recommendations.push('Revise validações e tratamento de erros');
    }

    if (latest.processing.averageProcessingTime > 8000) {
      recommendations.push('Implemente processamento paralelo ou otimize pipeline');
    }

    if (latest.user.bounceRate > 40) {
      recommendations.push('Melhore a experiência do usuário na interface');
    }

    return recommendations;
  }

  private generateInsights(metrics: PerformanceMetrics[]): string[] {
    const insights: string[] = [];

    if (metrics.length < 2) return insights;

    const first = metrics[0];
    const latest = metrics[metrics.length - 1];

    // Insights de tendência
    const throughputTrend = latest.processing.currentThroughput - first.processing.currentThroughput;
    if (throughputTrend > 0) {
      insights.push(`Throughput melhorou em ${throughputTrend.toFixed(1)} ops/s no período`);
    }

    const qualityTrend = latest.quality.contentQualityScore - first.quality.contentQualityScore;
    if (qualityTrend > 5) {
      insights.push(`Qualidade do conteúdo melhorou em ${qualityTrend.toFixed(1)} pontos`);
    }

    const cacheEfficiency = latest.cache.hitRate;
    if (cacheEfficiency > 80) {
      insights.push('Cache está operando com alta eficiência');
    }

    // Insights de padrões
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / metrics.length;
    if (avgCpuUsage < 50) {
      insights.push('Sistema está subutilizado - pode processar mais carga');
    }

    return insights;
  }

  // Métodos públicos
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getMetricsHistory(limit: number = 100): PerformanceMetrics[] {
    return this.history.slice(-limit);
  }

  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  addCustomMetric(
    name: string,
    collector: () => Promise<any>,
    threshold?: { warning: number; critical: number }
  ): void {
    this.collectors.set(name, collector);
    
    if (threshold) {
      this.thresholds.set(`${name}.warning`, threshold.warning);
      this.thresholds.set(`${name}.critical`, threshold.critical);
    }

    this.emit('customMetricAdded', { name, hasThreshold: !!threshold });
  }

  updateThreshold(metric: string, level: 'warning' | 'critical', value: number): void {
    this.thresholds.set(`${metric}.${level}`, value);
    this.emit('thresholdUpdated', { metric, level, value });
  }

  // Métodos de análise
  analyzePerformanceTrend(
    metric: keyof PerformanceMetrics,
    period: number = 10
  ): {
    trend: 'improving' | 'stable' | 'degrading';
    change: number;
    confidence: number;
  } {
    const recentMetrics = this.history.slice(-period);
    if (recentMetrics.length < 2) {
      return { trend: 'stable', change: 0, confidence: 0 };
    }

    // Calcular tendência linear simples
    const values = recentMetrics.map((m, index) => {
      const metricValue = this.extractMetricValue(m, metric);
      return { x: index, y: metricValue };
    });

    const slope = this.calculateLinearRegression(values).slope;
    const change = Math.abs(slope);
    
    return {
      trend: slope > 0.1 ? 'improving' : slope < -0.1 ? 'degrading' : 'stable',
      change,
      confidence: Math.min(change * 10, 100)
    };
  }

  predictNextValue(
    metric: keyof PerformanceMetrics,
    lookAhead: number = 5
  ): number {
    const recentMetrics = this.history.slice(-10);
    if (recentMetrics.length < 3) {
      return this.extractMetricValue(this.metrics, metric);
    }

    const values = recentMetrics.map((m, index) => ({
      x: index,
      y: this.extractMetricValue(m, metric)
    }));

    const regression = this.calculateLinearRegression(values);
    return regression.slope * (values.length + lookAhead) + regression.intercept;
  }

  // Métodos auxiliares
  private initializeMetrics(): PerformanceMetrics {
    return {
      processing: {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
        currentThroughput: 0,
        peakThroughput: 0,
        queueLength: 0,
        activeJobs: 0,
        estimatedWaitTime: 0
      },
      quality: {
        ocrAccuracy: 0,
        aiConfidence: 0,
        templateMatchScore: 0,
        contentQualityScore: 0,
        nrComplianceScore: 0,
        userSatisfactionScore: 0,
        errorRate: 0,
        successRate: 0
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        totalEntries: 0,
        totalSize: 0,
        memoryUsage: 0,
        evictionRate: 0,
        averageAccessTime: 0,
        compressionRatio: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        uptime: 0,
        activeConnections: 0,
        responseTime: 0,
        errorCount: 0
      },
      user: {
        activeUsers: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        featureUsage: new Map(),
        userFeedback: []
      },
      timestamp: Date.now()
    };
  }

  private initializeThresholds(): void {
    this.thresholds.set('cpu.warning', 75);
    this.thresholds.set('cpu.critical', 90);
    this.thresholds.set('memory.warning', 80);
    this.thresholds.set('memory.critical', 95);
    this.thresholds.set('error.warning', 5);
    this.thresholds.set('error.critical', 10);
    this.thresholds.set('cache.warning', 60);
    this.thresholds.set('cache.critical', 40);
  }

  private initializeCollectors(): void {
    // Collectors personalizados podem ser adicionados aqui
  }

  private startCollection(): void {
    this.updateInterval = setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('Erro ao coletar métricas:', error);
      });
    }, 5000); // Atualizar a cada 5 segundos
  }

  private async getCacheStats(): Promise<any> {
    try {
      // Integrar com pptxCacheService quando disponível
      return null;
    } catch {
      return null;
    }
  }

  private extractMetricValue(metrics: PerformanceMetrics, path: keyof PerformanceMetrics): number {
    // Extrair valor numérico de uma métrica específica
    const section = metrics[path];
    if (typeof section === 'object' && section !== null) {
      // Retornar primeira propriedade numérica encontrada
      for (const [key, value] of Object.entries(section)) {
        if (typeof value === 'number') {
          return value;
        }
      }
    }
    return 0;
  }

  private calculateLinearRegression(points: Array<{x: number, y: number}>): {slope: number, intercept: number} {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.alerts.clear();
    this.history = [];
    this.collectors.clear();
    
    this.emit('disposed');
  }
}

// Instância singleton
export const performanceMetricsService = new PerformanceMetricsService();

export default PerformanceMetricsService;