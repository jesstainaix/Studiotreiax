import { EventEmitter } from '../utils/EventEmitter';

// Interfaces para métricas
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'performance' | 'memory' | 'network' | 'error' | 'user';
  metadata?: Record<string, any>;
}

interface StageMetrics {
  stageName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  memoryUsage?: MemoryInfo;
  errors?: Error[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

interface PipelineMetrics {
  pipelineId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  stages: Map<string, StageMetrics>;
  overallStatus: 'pending' | 'running' | 'completed' | 'failed';
  overallProgress: number;
  totalMemoryUsage: number;
  peakMemoryUsage: number;
  errorCount: number;
  warningCount: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: MemoryInfo;
  networkLatency: number;
  activeConnections: number;
  queueSize: number;
  throughput: number;
  errorRate: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metric: PerformanceMetric) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: (metric: PerformanceMetric) => void;
  enabled: boolean;
  cooldown: number;
  lastTriggered?: number;
}

// Classe principal de monitoramento
class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private pipelines: Map<string, PipelineMetrics> = new Map();
  private systemMetrics: SystemMetrics;
  private alertRules: Map<string, AlertRule> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsBuffer: PerformanceMetric[] = [];
  private bufferSize = 1000;
  private flushInterval = 5000; // 5 segundos
  private retentionPeriod = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    super();
    this.systemMetrics = {
      cpuUsage: 0,
      memoryUsage: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
      networkLatency: 0,
      activeConnections: 0,
      queueSize: 0,
      throughput: 0,
      errorRate: 0
    };
    
    this.setupDefaultAlerts();
    this.startPeriodicCleanup();
  }

  // Iniciar monitoramento
  startMonitoring(interval = 1000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlerts();
      this.flushMetrics();
    }, interval);
    
    this.emit('monitoring:started');
  }

  // Parar monitoramento
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.flushMetrics(); // Flush final
    this.emit('monitoring:stopped');
  }

  // Registrar métrica
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now()
    };
    
    this.metricsBuffer.push(fullMetric);
    
    // Flush se buffer estiver cheio
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flushMetrics();
    }
    
    this.emit('metric:recorded', fullMetric);
    return fullMetric.id;
  }

  // Iniciar pipeline
  startPipeline(pipelineId: string, stages: string[]): void {
    const pipeline: PipelineMetrics = {
      pipelineId,
      startTime: Date.now(),
      stages: new Map(),
      overallStatus: 'running',
      overallProgress: 0,
      totalMemoryUsage: 0,
      peakMemoryUsage: 0,
      errorCount: 0,
      warningCount: 0
    };
    
    // Inicializar stages
    stages.forEach(stageName => {
      pipeline.stages.set(stageName, {
        stageName,
        startTime: 0,
        status: 'pending',
        progress: 0
      });
    });
    
    this.pipelines.set(pipelineId, pipeline);
    
    this.recordMetric({
      name: 'pipeline_started',
      value: 1,
      unit: 'count',
      category: 'performance',
      metadata: { pipelineId, stageCount: stages.length }
    });
    
    this.emit('pipeline:started', pipeline);
  }

  // Iniciar stage
  startStage(pipelineId: string, stageName: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;
    
    const stage = pipeline.stages.get(stageName);
    if (!stage) return;
    
    stage.startTime = Date.now();
    stage.status = 'running';
    stage.memoryUsage = this.getCurrentMemoryUsage();
    
    this.recordMetric({
      name: 'stage_started',
      value: 1,
      unit: 'count',
      category: 'performance',
      metadata: { pipelineId, stageName }
    });
    
    this.emit('stage:started', { pipelineId, stage });
  }

  // Atualizar progresso do stage
  updateStageProgress(pipelineId: string, stageName: string, progress: number): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;
    
    const stage = pipeline.stages.get(stageName);
    if (!stage) return;
    
    stage.progress = Math.max(0, Math.min(100, progress));
    
    // Calcular progresso geral
    const stages = Array.from(pipeline.stages.values());
    const totalProgress = stages.reduce((sum, s) => sum + s.progress, 0);
    pipeline.overallProgress = totalProgress / stages.length;
    
    this.recordMetric({
      name: 'stage_progress',
      value: progress,
      unit: 'percent',
      category: 'performance',
      metadata: { pipelineId, stageName }
    });
    
    this.emit('stage:progress', { pipelineId, stageName, progress });
  }

  // Finalizar stage
  completeStage(pipelineId: string, stageName: string, success = true): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;
    
    const stage = pipeline.stages.get(stageName);
    if (!stage) return;
    
    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    stage.status = success ? 'completed' : 'failed';
    stage.progress = success ? 100 : stage.progress;
    
    if (!success) {
      pipeline.errorCount++;
    }
    
    // Atualizar uso de memória
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryDelta = currentMemory.usedJSHeapSize - (stage.memoryUsage?.usedJSHeapSize || 0);
    pipeline.totalMemoryUsage += memoryDelta;
    pipeline.peakMemoryUsage = Math.max(pipeline.peakMemoryUsage, currentMemory.usedJSHeapSize);
    
    this.recordMetric({
      name: 'stage_completed',
      value: stage.duration || 0,
      unit: 'ms',
      category: 'performance',
      metadata: { 
        pipelineId, 
        stageName, 
        success, 
        duration: stage.duration,
        memoryDelta 
      }
    });
    
    // Verificar se pipeline está completo
    const allStages = Array.from(pipeline.stages.values());
    const completedStages = allStages.filter(s => s.status === 'completed' || s.status === 'failed');
    
    if (completedStages.length === allStages.length) {
      this.completePipeline(pipelineId);
    }
    
    this.emit('stage:completed', { pipelineId, stage });
  }

  // Finalizar pipeline
  completePipeline(pipelineId: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;
    
    pipeline.endTime = Date.now();
    pipeline.totalDuration = pipeline.endTime - pipeline.startTime;
    
    const failedStages = Array.from(pipeline.stages.values()).filter(s => s.status === 'failed');
    pipeline.overallStatus = failedStages.length > 0 ? 'failed' : 'completed';
    
    this.recordMetric({
      name: 'pipeline_completed',
      value: pipeline.totalDuration,
      unit: 'ms',
      category: 'performance',
      metadata: {
        pipelineId,
        success: pipeline.overallStatus === 'completed',
        duration: pipeline.totalDuration,
        stageCount: pipeline.stages.size,
        errorCount: pipeline.errorCount,
        memoryUsage: pipeline.totalMemoryUsage
      }
    });
    
    this.emit('pipeline:completed', pipeline);
  }

  // Registrar erro
  recordError(pipelineId: string, stageName: string, error: Error): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (pipeline) {
      const stage = pipeline.stages.get(stageName);
      if (stage) {
        if (!stage.errors) stage.errors = [];
        stage.errors.push(error);
        pipeline.errorCount++;
      }
    }
    
    this.recordMetric({
      name: 'error_occurred',
      value: 1,
      unit: 'count',
      category: 'error',
      metadata: {
        pipelineId,
        stageName,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
    
    this.emit('error:recorded', { pipelineId, stageName, error });
  }

  // Registrar warning
  recordWarning(pipelineId: string, stageName: string, warning: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (pipeline) {
      const stage = pipeline.stages.get(stageName);
      if (stage) {
        if (!stage.warnings) stage.warnings = [];
        stage.warnings.push(warning);
        pipeline.warningCount++;
      }
    }
    
    this.recordMetric({
      name: 'warning_occurred',
      value: 1,
      unit: 'count',
      category: 'error',
      metadata: {
        pipelineId,
        stageName,
        warning
      }
    });
    
    this.emit('warning:recorded', { pipelineId, stageName, warning });
  }

  // Obter métricas do pipeline
  getPipelineMetrics(pipelineId: string): PipelineMetrics | undefined {
    return this.pipelines.get(pipelineId);
  }

  // Obter todas as métricas
  getAllMetrics(category?: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];
    
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    
    let filtered = allMetrics;
    
    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }
    
    if (timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Obter estatísticas
  getStatistics(metricName: string, timeRange?: { start: number; end: number }): {
    count: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
  } {
    const metrics = this.getAllMetrics(undefined, timeRange)
      .filter(m => m.name === metricName)
      .map(m => m.value)
      .sort((a, b) => a - b);
    
    if (metrics.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0 };
    }
    
    const count = metrics.length;
    const min = metrics[0];
    const max = metrics[count - 1];
    const avg = metrics.reduce((sum, val) => sum + val, 0) / count;
    const median = metrics[Math.floor(count / 2)];
    const p95 = metrics[Math.floor(count * 0.95)];
    const p99 = metrics[Math.floor(count * 0.99)];
    
    return { count, min, max, avg, median, p95, p99 };
  }

  // Adicionar regra de alerta
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alert:rule_added', rule);
  }

  // Remover regra de alerta
  removeAlertRule(ruleId: string): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      this.alertRules.delete(ruleId);
      this.emit('alert:rule_removed', rule);
    }
  }

  // Métodos privados
  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentMemoryUsage(): MemoryInfo {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      return (window.performance as any).memory;
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }

  private collectSystemMetrics(): void {
    const memory = this.getCurrentMemoryUsage();
    this.systemMetrics.memoryUsage = memory;
    
    // Simular outras métricas (em produção, usar APIs reais)
    this.systemMetrics.cpuUsage = Math.random() * 100;
    this.systemMetrics.networkLatency = Math.random() * 100;
    this.systemMetrics.activeConnections = Math.floor(Math.random() * 50);
    this.systemMetrics.queueSize = Math.floor(Math.random() * 20);
    
    // Registrar métricas do sistema
    this.recordMetric({
      name: 'system_memory_usage',
      value: memory.usedJSHeapSize,
      unit: 'bytes',
      category: 'memory'
    });
    
    this.recordMetric({
      name: 'system_cpu_usage',
      value: this.systemMetrics.cpuUsage,
      unit: 'percent',
      category: 'performance'
    });
  }

  private checkAlerts(): void {
    const now = Date.now();
    
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      // Verificar cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
        continue;
      }
      
      // Verificar métricas recentes
      const recentMetrics = this.metricsBuffer.filter(m => 
        (now - m.timestamp) < 60000 // Últimos 60 segundos
      );
      
      for (const metric of recentMetrics) {
        if (rule.condition(metric)) {
          rule.action(metric);
          rule.lastTriggered = now;
          this.emit('alert:triggered', { rule, metric });
          break;
        }
      }
    }
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return;
    
    // Agrupar métricas por categoria
    for (const metric of this.metricsBuffer) {
      const categoryMetrics = this.metrics.get(metric.category) || [];
      categoryMetrics.push(metric);
      this.metrics.set(metric.category, categoryMetrics);
    }
    
    this.emit('metrics:flushed', this.metricsBuffer.length);
    this.metricsBuffer = [];
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Cleanup a cada minuto
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.retentionPeriod;
    let cleanedCount = 0;
    
    for (const [category, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      cleanedCount += metrics.length - filtered.length;
      this.metrics.set(category, filtered);
    }
    
    if (cleanedCount > 0) {
      this.emit('metrics:cleaned', cleanedCount);
    }
  }

  private setupDefaultAlerts(): void {
    // Alerta de alta utilização de memória
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      condition: (metric) => 
        metric.name === 'system_memory_usage' && metric.value > 100 * 1024 * 1024, // 100MB
      severity: 'high',
      action: (metric) => {
        console.warn('High memory usage detected:', metric.value);
      },
      enabled: true,
      cooldown: 30000 // 30 segundos
    });
    
    // Alerta de pipeline lento
    this.addAlertRule({
      id: 'slow_pipeline',
      name: 'Slow Pipeline',
      condition: (metric) => 
        metric.name === 'pipeline_completed' && metric.value > 60000, // 60 segundos
      severity: 'medium',
      action: (metric) => {
        console.warn('Slow pipeline detected:', metric.metadata?.pipelineId);
      },
      enabled: true,
      cooldown: 60000 // 60 segundos
    });
    
    // Alerta de alta taxa de erro
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metric) => {
        if (metric.name !== 'error_occurred') return false;
        
        const recentErrors = this.getAllMetrics('error', {
          start: Date.now() - 300000, // Últimos 5 minutos
          end: Date.now()
        }).filter(m => m.name === 'error_occurred');
        
        return recentErrors.length > 10; // Mais de 10 erros em 5 minutos
      },
      severity: 'critical',
      action: (metric) => {
        console.error('High error rate detected');
      },
      enabled: true,
      cooldown: 300000 // 5 minutos
    });
  }
}

// Instância singleton
const performanceMonitor = new PerformanceMonitor();

// Funções de conveniência
export const startMonitoring = () => performanceMonitor.startMonitoring();
export const stopMonitoring = () => performanceMonitor.stopMonitoring();
export const recordMetric = (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => 
  performanceMonitor.recordMetric(metric);
export const startPipeline = (pipelineId: string, stages: string[]) => 
  performanceMonitor.startPipeline(pipelineId, stages);
export const startStage = (pipelineId: string, stageName: string) => 
  performanceMonitor.startStage(pipelineId, stageName);
export const updateStageProgress = (pipelineId: string, stageName: string, progress: number) => 
  performanceMonitor.updateStageProgress(pipelineId, stageName, progress);
export const completeStage = (pipelineId: string, stageName: string, success = true) => 
  performanceMonitor.completeStage(pipelineId, stageName, success);
export const recordError = (pipelineId: string, stageName: string, error: Error) => 
  performanceMonitor.recordError(pipelineId, stageName, error);
export const recordWarning = (pipelineId: string, stageName: string, warning: string) => 
  performanceMonitor.recordWarning(pipelineId, stageName, warning);
export const getPipelineMetrics = (pipelineId: string) => 
  performanceMonitor.getPipelineMetrics(pipelineId);
export const getAllMetrics = (category?: string, timeRange?: { start: number; end: number }) => 
  performanceMonitor.getAllMetrics(category, timeRange);
export const getStatistics = (metricName: string, timeRange?: { start: number; end: number }) => 
  performanceMonitor.getStatistics(metricName, timeRange);
export const addAlertRule = (rule: AlertRule) => performanceMonitor.addAlertRule(rule);
export const removeAlertRule = (ruleId: string) => performanceMonitor.removeAlertRule(ruleId);

// Exportar tipos
export type {
  PerformanceMetric,
  StageMetrics,
  PipelineMetrics,
  SystemMetrics,
  AlertRule
};

// Exportar instância para uso avançado
export { performanceMonitor };

export default performanceMonitor;