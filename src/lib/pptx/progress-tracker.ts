/**
 * Sistema de rastreamento de progresso detalhado para extração PPTX
 * Fornece informações específicas sobre cada etapa do processamento
 */

/**
 * Interface para configuração do rastreador de progresso
 */
export interface ProgressConfig {
  enableDetailedLogging: boolean;
  enableRealTimeUpdates: boolean;
  updateInterval: number; // ms
  enablePerformanceMetrics: boolean;
  enableMemoryTracking: boolean;
}

/**
 * Interface para etapa de progresso
 */
export interface ProgressStep {
  id: string;
  name: string;
  description: string;
  weight: number; // Peso relativo da etapa (0-1)
  estimatedDuration: number; // ms
  dependencies?: string[]; // IDs de etapas dependentes
}

/**
 * Interface para status de progresso
 */
export interface ProgressStatus {
  stepId: string;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  duration?: number; // ms
  details?: {
    currentOperation?: string;
    itemsProcessed?: number;
    totalItems?: number;
    throughput?: number; // items/second
    memoryUsage?: number; // MB
    errors?: string[];
    warnings?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Interface para progresso geral
 */
export interface OverallProgress {
  totalProgress: number; // 0-100
  currentStep: string;
  currentStepProgress: number; // 0-100
  estimatedTimeRemaining: number; // ms
  elapsedTime: number; // ms
  steps: ProgressStatus[];
  performance: {
    averageStepDuration: number;
    totalThroughput: number;
    memoryPeak: number;
    cpuUsage?: number;
  };
  summary: {
    completedSteps: number;
    totalSteps: number;
    failedSteps: number;
    skippedSteps: number;
  };
}

/**
 * Interface para callback de progresso
 */
export type ProgressCallback = (progress: OverallProgress) => void;

/**
 * Interface para callback de etapa
 */
export type StepCallback = (step: ProgressStatus) => void;

/**
 * Rastreador de progresso detalhado
 */
export class ProgressTracker {
  private static instance: ProgressTracker;
  private config: ProgressConfig;
  private steps: Map<string, ProgressStep> = new Map();
  private stepStatuses: Map<string, ProgressStatus> = new Map();
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private stepCallbacks: Set<StepCallback> = new Set();
  private startTime: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  private constructor() {
    this.config = {
      enableDetailedLogging: true,
      enableRealTimeUpdates: true,
      updateInterval: 500, // 500ms
      enablePerformanceMetrics: true,
      enableMemoryTracking: true
    };
    
    this.initializePerformanceTracking();
  }

  public static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker();
    }
    return ProgressTracker.instance;
  }

  public configure(config: Partial<ProgressConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableRealTimeUpdates && !this.updateInterval) {
      this.startRealTimeUpdates();
    } else if (!this.config.enableRealTimeUpdates && this.updateInterval) {
      this.stopRealTimeUpdates();
    }
  }

  private initializePerformanceTracking(): void {
    if (this.config.enablePerformanceMetrics && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          // Processar métricas de performance se necessário
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance tracking not available:', error);
      }
    }
  }

  private startRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      const progress = this.getOverallProgress();
      this.notifyProgressCallbacks(progress);
    }, this.config.updateInterval);
  }

  private stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public defineSteps(steps: ProgressStep[]): void {
    this.steps.clear();
    this.stepStatuses.clear();
    
    // Normalizar pesos para somar 1
    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    
    steps.forEach(step => {
      const normalizedStep = {
        ...step,
        weight: step.weight / totalWeight
      };
      
      this.steps.set(step.id, normalizedStep);
      this.stepStatuses.set(step.id, {
        stepId: step.id,
        stepName: step.name,
        status: 'pending',
        progress: 0,
        details: {
          itemsProcessed: 0,
          totalItems: 0,
          throughput: 0,
          errors: [],
          warnings: []
        }
      });
    });
  }

  public startTracking(): void {
    this.startTime = new Date();
    
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
  }

  public stopTracking(): void {
    this.stopRealTimeUpdates();
    
    // Marcar etapas não concluídas como skipped
    for (const [stepId, status] of this.stepStatuses.entries()) {
      if (status.status === 'pending' || status.status === 'in_progress') {
        this.updateStepStatus(stepId, 'skipped');
      }
    }
  }

  public startStep(stepId: string, details?: Partial<ProgressStatus['details']>): void {
    const status = this.stepStatuses.get(stepId);
    if (!status) {
      console.warn(`Step ${stepId} not found`);
      return;
    }
    
    const updatedStatus: ProgressStatus = {
      ...status,
      status: 'in_progress',
      startTime: new Date(),
      progress: 0,
      details: {
        ...status.details,
        ...details,
        currentOperation: details?.currentOperation || `Starting ${status.stepName}`
      }
    };
    
    this.stepStatuses.set(stepId, updatedStatus);
    this.notifyStepCallbacks(updatedStatus);
    
    if (this.config.enableDetailedLogging) {
    }
  }

  public updateStepProgress(
    stepId: string,
    progress: number,
    details?: Partial<ProgressStatus['details']>
  ): void {
    const status = this.stepStatuses.get(stepId);
    if (!status) {
      console.warn(`Step ${stepId} not found`);
      return;
    }
    
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    // Calcular throughput se possível
    let throughput = status.details?.throughput || 0;
    if (details?.itemsProcessed && status.startTime) {
      const elapsedSeconds = (Date.now() - status.startTime.getTime()) / 1000;
      throughput = details.itemsProcessed / Math.max(elapsedSeconds, 0.1);
    }
    
    const updatedStatus: ProgressStatus = {
      ...status,
      progress: clampedProgress,
      details: {
        ...status.details,
        ...details,
        throughput,
        memoryUsage: this.config.enableMemoryTracking ? this.getCurrentMemoryUsage() : undefined
      }
    };
    
    this.stepStatuses.set(stepId, updatedStatus);
    this.notifyStepCallbacks(updatedStatus);
  }

  public updateStepStatus(
    stepId: string,
    newStatus: ProgressStatus['status'],
    details?: Partial<ProgressStatus['details']>
  ): void {
    const status = this.stepStatuses.get(stepId);
    if (!status) {
      console.warn(`Step ${stepId} not found`);
      return;
    }
    
    const now = new Date();
    const duration = status.startTime ? now.getTime() - status.startTime.getTime() : 0;
    
    const updatedStatus: ProgressStatus = {
      ...status,
      status: newStatus,
      endTime: ['completed', 'failed', 'skipped'].includes(newStatus) ? now : undefined,
      duration: ['completed', 'failed', 'skipped'].includes(newStatus) ? duration : undefined,
      progress: newStatus === 'completed' ? 100 : status.progress,
      details: {
        ...status.details,
        ...details
      }
    };
    
    this.stepStatuses.set(stepId, updatedStatus);
    this.notifyStepCallbacks(updatedStatus);
    
    if (this.config.enableDetailedLogging) {
      const emoji = {
        completed: '✅',
        failed: '❌',
        skipped: '⏭️',
        in_progress: '▶️',
        pending: '⏸️'
      }[newStatus];
    }
  }

  public addStepError(stepId: string, error: string): void {
    const status = this.stepStatuses.get(stepId);
    if (!status || !status.details) return;
    
    status.details.errors = status.details.errors || [];
    status.details.errors.push(error);
    
    this.stepStatuses.set(stepId, status);
    this.notifyStepCallbacks(status);
    
    if (this.config.enableDetailedLogging) {
      console.error(`❌ Step ${status.stepName} error: ${error}`);
    }
  }

  public addStepWarning(stepId: string, warning: string): void {
    const status = this.stepStatuses.get(stepId);
    if (!status || !status.details) return;
    
    status.details.warnings = status.details.warnings || [];
    status.details.warnings.push(warning);
    
    this.stepStatuses.set(stepId, status);
    this.notifyStepCallbacks(status);
    
    if (this.config.enableDetailedLogging) {
      console.warn(`⚠️ Step ${status.stepName} warning: ${warning}`);
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      // @ts-ignore - performance.memory não está tipado
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }

  public getOverallProgress(): OverallProgress {
    const statuses = Array.from(this.stepStatuses.values());
    const steps = Array.from(this.steps.values());
    
    // Calcular progresso total baseado nos pesos das etapas
    let totalProgress = 0;
    let currentStep = '';
    let currentStepProgress = 0;
    
    for (const status of statuses) {
      const step = this.steps.get(status.stepId);
      if (!step) continue;
      
      const stepProgress = status.status === 'completed' ? 100 : 
                          status.status === 'failed' || status.status === 'skipped' ? 0 : 
                          status.progress;
      
      totalProgress += (stepProgress / 100) * step.weight * 100;
      
      if (status.status === 'in_progress') {
        currentStep = status.stepName;
        currentStepProgress = status.progress;
      }
    }
    
    // Calcular tempo estimado restante
    const elapsedTime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const estimatedTotalTime = totalProgress > 0 ? (elapsedTime / totalProgress) * 100 : 0;
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
    
    // Calcular métricas de performance
    const completedSteps = statuses.filter(s => s.status === 'completed');
    const averageStepDuration = completedSteps.length > 0 ?
      completedSteps.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSteps.length : 0;
    
    const totalThroughput = statuses.reduce((sum, s) => sum + (s.details?.throughput || 0), 0);
    const memoryPeak = Math.max(...statuses.map(s => s.details?.memoryUsage || 0));
    
    // Resumo
    const summary = {
      completedSteps: statuses.filter(s => s.status === 'completed').length,
      totalSteps: statuses.length,
      failedSteps: statuses.filter(s => s.status === 'failed').length,
      skippedSteps: statuses.filter(s => s.status === 'skipped').length
    };
    
    return {
      totalProgress: Math.round(totalProgress * 100) / 100,
      currentStep,
      currentStepProgress,
      estimatedTimeRemaining,
      elapsedTime,
      steps: statuses,
      performance: {
        averageStepDuration,
        totalThroughput,
        memoryPeak
      },
      summary
    };
  }

  public onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    
    // Retornar função para remover o callback
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  public onStepUpdate(callback: StepCallback): () => void {
    this.stepCallbacks.add(callback);
    
    // Retornar função para remover o callback
    return () => {
      this.stepCallbacks.delete(callback);
    };
  }

  private notifyProgressCallbacks(progress: OverallProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  private notifyStepCallbacks(step: ProgressStatus): void {
    this.stepCallbacks.forEach(callback => {
      try {
        callback(step);
      } catch (error) {
        console.error('Error in step callback:', error);
      }
    });
  }

  public reset(): void {
    this.stopTracking();
    this.steps.clear();
    this.stepStatuses.clear();
    this.startTime = null;
  }

  public getStepStatus(stepId: string): ProgressStatus | undefined {
    return this.stepStatuses.get(stepId);
  }

  public getAllSteps(): ProgressStep[] {
    return Array.from(this.steps.values());
  }

  public exportProgress(): string {
    const progress = this.getOverallProgress();
    return JSON.stringify(progress, null, 2);
  }

  public destroy(): void {
    this.stopTracking();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    this.progressCallbacks.clear();
    this.stepCallbacks.clear();
  }
}

/**
 * Função utilitária para criar etapas padrão de extração PPTX
 */
export function createPPTXExtractionSteps(): ProgressStep[] {
  return [
    {
      id: 'file-reading',
      name: 'Leitura do Arquivo',
      description: 'Lendo e validando o arquivo PPTX',
      weight: 0.1,
      estimatedDuration: 2000
    },
    {
      id: 'content-extraction',
      name: 'Extração de Conteúdo',
      description: 'Extraindo slides e elementos do arquivo',
      weight: 0.25,
      estimatedDuration: 5000,
      dependencies: ['file-reading']
    },
    {
      id: 'parallel-processing',
      name: 'Processamento Paralelo',
      description: 'Processando slides em paralelo com workers',
      weight: 0.3,
      estimatedDuration: 8000,
      dependencies: ['content-extraction']
    },
    {
      id: 'validation',
      name: 'Validação de Dados',
      description: 'Validando integridade dos dados extraídos',
      weight: 0.15,
      estimatedDuration: 3000,
      dependencies: ['parallel-processing']
    },
    {
      id: 'auto-correction',
      name: 'Auto-correção',
      description: 'Aplicando correções automáticas nos dados',
      weight: 0.1,
      estimatedDuration: 2000,
      dependencies: ['validation']
    },
    {
      id: 'finalization',
      name: 'Finalização',
      description: 'Preparando resultado final e limpeza',
      weight: 0.1,
      estimatedDuration: 1000,
      dependencies: ['auto-correction']
    }
  ];
}

/**
 * Função utilitária para rastreamento rápido
 */
export function trackPPTXExtraction(
  onProgress?: ProgressCallback,
  onStepUpdate?: StepCallback
): ProgressTracker {
  const tracker = ProgressTracker.getInstance();
  
  // Configurar etapas padrão
  tracker.defineSteps(createPPTXExtractionSteps());
  
  // Registrar callbacks se fornecidos
  if (onProgress) {
    tracker.onProgress(onProgress);
  }
  
  if (onStepUpdate) {
    tracker.onStepUpdate(onStepUpdate);
  }
  
  // Iniciar rastreamento
  tracker.startTracking();
  
  return tracker;
}