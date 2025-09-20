/**
 * Sistema de Monitoramento e Métricas do Pipeline PPTX→Vídeo
 * Coleta métricas, monitora performance e identifica gargalos
 */

interface PipelineMetrics {
  stage: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'retrying';
  error?: string | undefined;
  retryCount: number;
  memoryUsage?: number | undefined;
  inputSize?: number | undefined;
  outputSize?: number | undefined;
}

interface PerformanceThresholds {
  upload: number; // ms
  ocr: number;
  aiAnalysis: number;
  videoGeneration: number;
  total: number;
}

class PipelineMonitoringService {
  private metrics: Map<string, PipelineMetrics[]> = new Map();
  private activeJobs: Map<string, string> = new Map(); // jobId -> current stage
  
  private thresholds: PerformanceThresholds = {
    upload: 30000,      // 30s
    ocr: 60000,         // 1min  
    aiAnalysis: 120000, // 2min
    videoGeneration: 300000, // 5min
    total: 600000       // 10min
  };

  /**
   * Iniciar monitoramento de um job
   */
  startJobMonitoring(jobId: string, stage: string): void {
    if (!this.metrics.has(jobId)) {
      this.metrics.set(jobId, []);
    }

    this.activeJobs.set(jobId, stage);

    const metric: PipelineMetrics = {
      stage,
      startTime: Date.now(),
      status: 'running',
      retryCount: 0
    };

    this.metrics.get(jobId)!.push(metric);
  }

  /**
   * Finalizar monitoramento de um stage
   */
  finishStageMonitoring(
    jobId: string, 
    stage: string, 
    status: 'completed' | 'failed',
    error?: string,
    outputSize?: number
  ): void {
    const jobMetrics = this.metrics.get(jobId);
    if (!jobMetrics) return;

    const metric = jobMetrics.find(m => m.stage === stage && !m.endTime);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = status;
    metric.error = error;
    metric.outputSize = outputSize;
    metric.memoryUsage = this.getCurrentMemoryUsage();

    // Verificar se excede thresholds
    this.checkPerformanceThresholds(jobId, stage, duration);
  }

  /**
   * Registrar retry
   */
  recordRetry(jobId: string, stage: string, error: string): void {
    const jobMetrics = this.metrics.get(jobId);
    if (!jobMetrics) return;

    const metric = jobMetrics.find(m => m.stage === stage && !m.endTime);
    if (metric) {
      metric.retryCount++;
      metric.error = error;
      metric.status = 'retrying';
    }
  }

  /**
   * Obter métricas de um job
   */
  getJobMetrics(jobId: string): PipelineMetrics[] {
    return this.metrics.get(jobId) || [];
  }

  /**
   * Obter estatísticas consolidadas
   */
  getConsolidatedStats(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgDuration: number;
    slowestStage: string;
    errorRate: number;
    retryRate: number;
  } {
    const allJobs = Array.from(this.metrics.entries());
    const totalJobs = allJobs.length;
    
    let completedJobs = 0;
    let failedJobs = 0;
    let totalDuration = 0;
    let totalRetries = 0;
    let stageStats: Map<string, { total: number; duration: number; errors: number }> = new Map();

    allJobs.forEach(([_, metrics]) => {
      const jobCompleted = metrics.every(m => m.status === 'completed');
      const jobFailed = metrics.some(m => m.status === 'failed');
      
      if (jobCompleted) completedJobs++;
      else if (jobFailed) failedJobs++;

      metrics.forEach(metric => {
        totalRetries += metric.retryCount;
        
        if (metric.duration) {
          totalDuration += metric.duration;
          
          const stageStat = stageStats.get(metric.stage) || { total: 0, duration: 0, errors: 0 };
          stageStat.total++;
          stageStat.duration += metric.duration;
          if (metric.status === 'failed') stageStat.errors++;
          stageStats.set(metric.stage, stageStat);
        }
      });
    });

    // Encontrar stage mais lento
    let slowestStage = '';
    let maxAvgDuration = 0;
    stageStats.forEach((stats, stage) => {
      const avgDuration = stats.duration / stats.total;
      if (avgDuration > maxAvgDuration) {
        maxAvgDuration = avgDuration;
        slowestStage = stage;
      }
    });

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      avgDuration: totalJobs > 0 ? totalDuration / totalJobs : 0,
      slowestStage,
      errorRate: totalJobs > 0 ? failedJobs / totalJobs : 0,
      retryRate: totalJobs > 0 ? totalRetries / totalJobs : 0
    };
  }

  /**
   * Verificar thresholds de performance
   */
  private checkPerformanceThresholds(jobId: string, stage: string, duration: number): void {
    const threshold = this.thresholds[stage as keyof PerformanceThresholds];
    
    if (threshold && duration > threshold) {
      console.warn(`⚠️ [Monitor] Performance threshold exceeded for ${stage}: ${duration}ms > ${threshold}ms`);
      
      // Emitir evento de alerta
      this.emitPerformanceAlert(jobId, stage, duration, threshold);
    }
  }

  /**
   * Emitir alerta de performance
   */
  private emitPerformanceAlert(jobId: string, stage: string, actual: number, expected: number): void {
    const alert = {
      type: 'performance_threshold_exceeded',
      jobId,
      stage,
      actualDuration: actual,
      expectedDuration: expected,
      timestamp: new Date().toISOString()
    };

    // Aqui poderia integrar com sistema de alertas (email, Slack, etc.)
    console.error('🚨 Performance Alert:', alert);
  }

  /**
   * Obter uso atual de memória
   */
  private getCurrentMemoryUsage(): number {
    // Browser compatibility: use performance.memory if available
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      return (window.performance as any).memory.usedJSHeapSize || 0;
    }
    // Fallback for Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Gerar relatório de health check
   */
  generateHealthReport(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      activeJobs: number;
      recentErrorRate: number;
      avgResponseTime: number;
      systemLoad: string;
    }
  } {
    const stats = this.getConsolidatedStats();
    const activeJobsCount = this.activeJobs.size;
    const recentErrorRate = stats.errorRate;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (recentErrorRate > 0.3 || stats.avgDuration > this.thresholds.total) {
      status = 'unhealthy';
    } else if (recentErrorRate > 0.1 || activeJobsCount > 10) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        activeJobs: activeJobsCount,
        recentErrorRate,
        avgResponseTime: stats.avgDuration,
        systemLoad: this.getSystemLoadIndicator()
      }
    };
  }

  /**
   * Indicador simples de carga do sistema
   */
  private getSystemLoadIndicator(): string {
    const memUsage = this.getCurrentMemoryUsage();
    const activeJobs = this.activeJobs.size;
    
    if (activeJobs > 15 || memUsage > 1024 * 1024 * 500) { // 500MB
      return 'high';
    } else if (activeJobs > 8 || memUsage > 1024 * 1024 * 200) { // 200MB
      return 'medium';
    }
    return 'low';
  }

  /**
   * Limpeza de métricas antigas (manter apenas últimas 24h)
   */
  cleanup(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    this.metrics.forEach((jobMetrics, jobId) => {
      const hasRecentMetrics = jobMetrics.some(m => m.startTime > oneDayAgo);
      if (!hasRecentMetrics) {
        this.metrics.delete(jobId);
      }
    });
  }
}

// Instância singleton
export const pipelineMonitor = new PipelineMonitoringService();

// Auto cleanup a cada 6 horas
setInterval(() => {
  pipelineMonitor.cleanup();
}, 6 * 60 * 60 * 1000);

export type { PipelineMetrics, PerformanceThresholds };