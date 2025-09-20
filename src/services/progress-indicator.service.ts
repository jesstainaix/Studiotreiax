// Sistema de indicadores de progresso detalhados para processamento PPTX
import { EventEmitter } from '../utils/EventEmitter';

// Interfaces para progresso
interface ProgressStep {
  id: string;
  name: string;
  description: string;
  weight: number; // Peso relativo (0-1)
  status: ProgressStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  subSteps?: ProgressStep[];
  metadata?: Record<string, any>;
  error?: Error;
}

interface ProgressState {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  overallProgress: number; // 0-100
  currentStepProgress: number; // 0-100
  estimatedTimeRemaining: number; // em ms
  elapsedTime: number; // em ms
  processingRate: number; // items/segundo
  status: ProcessingStatus;
  steps: ProgressStep[];
  metadata: ProgressMetadata;
}

interface ProgressMetadata {
  totalSlides: number;
  processedSlides: number;
  totalImages: number;
  processedImages: number;
  totalShapes: number;
  processedShapes: number;
  totalAnimations: number;
  processedAnimations: number;
  fileSize: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorCount: number;
  warningCount: number;
}

interface ProgressConfig {
  enableDetailedLogging: boolean;
  enablePerformanceMetrics: boolean;
  updateInterval: number; // ms
  estimationWindow: number; // número de amostras para estimativa
  enableSubStepTracking: boolean;
  maxHistorySize: number;
}

interface ProgressEvent {
  type: ProgressEventType;
  step: string;
  progress: number;
  message?: string;
  data?: any;
  timestamp: number;
}

interface PerformanceMetrics {
  averageStepDuration: number;
  slowestStep: string;
  fastestStep: string;
  memoryPeakUsage: number;
  cpuUsage: number;
  throughput: number;
  bottlenecks: string[];
}

type ProgressStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
type ProcessingStatus = 'idle' | 'initializing' | 'processing' | 'completed' | 'failed' | 'paused';
type ProgressEventType = 'step_started' | 'step_progress' | 'step_completed' | 'step_failed' | 'overall_progress' | 'status_changed';

// Classe principal do sistema de progresso
export class ProgressIndicatorService extends EventEmitter {
  private state: ProgressState;
  private config: ProgressConfig;
  private startTime: number = 0;
  private lastUpdateTime: number = 0;
  private progressHistory: number[] = [];
  private performanceMetrics: PerformanceMetrics;
  private updateTimer?: NodeJS.Timeout;

  constructor(config: Partial<ProgressConfig> = {}) {
    super();
    
    this.config = {
      enableDetailedLogging: true,
      enablePerformanceMetrics: true,
      updateInterval: 100, // 100ms
      estimationWindow: 10,
      enableSubStepTracking: true,
      maxHistorySize: 1000,
      ...config
    };

    this.state = this.initializeState();
    this.performanceMetrics = this.initializeMetrics();
  }

  // Inicializar estado do progresso
  private initializeState(): ProgressState {
    return {
      currentStep: '',
      totalSteps: 0,
      completedSteps: 0,
      overallProgress: 0,
      currentStepProgress: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      processingRate: 0,
      status: 'idle',
      steps: [],
      metadata: {
        totalSlides: 0,
        processedSlides: 0,
        totalImages: 0,
        processedImages: 0,
        totalShapes: 0,
        processedShapes: 0,
        totalAnimations: 0,
        processedAnimations: 0,
        fileSize: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        errorCount: 0,
        warningCount: 0
      }
    };
  }

  // Inicializar métricas de performance
  private initializeMetrics(): PerformanceMetrics {
    return {
      averageStepDuration: 0,
      slowestStep: '',
      fastestStep: '',
      memoryPeakUsage: 0,
      cpuUsage: 0,
      throughput: 0,
      bottlenecks: []
    };
  }

  // Iniciar processamento
  public startProcessing(steps: Omit<ProgressStep, 'status' | 'startTime' | 'endTime' | 'duration'>[]): void {
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    
    this.state.steps = steps.map(step => ({
      ...step,
      status: 'pending' as ProgressStatus,
      subSteps: step.subSteps?.map(subStep => ({
        ...subStep,
        status: 'pending' as ProgressStatus
      })) || []
    }));
    
    this.state.totalSteps = this.calculateTotalSteps();
    this.state.status = 'initializing';
    this.state.completedSteps = 0;
    this.state.overallProgress = 0;
    
    this.emitEvent('status_changed', '', 0, 'Processamento iniciado');
    
    if (this.config.enablePerformanceMetrics) {
      this.startPerformanceMonitoring();
    }
  }

  // Iniciar etapa
  public startStep(stepId: string, metadata?: Record<string, any>): void {
    const step = this.findStep(stepId);
    if (!step) {
      console.warn(`[ProgressIndicator] Etapa não encontrada: ${stepId}`);
      return;
    }

    step.status = 'running';
    step.startTime = Date.now();
    if (metadata) {
      step.metadata = { ...step.metadata, ...metadata };
    }

    this.state.currentStep = stepId;
    this.state.currentStepProgress = 0;
    this.state.status = 'processing';

    this.updateProgress();
    this.emitEvent('step_started', stepId, 0, step.description);

    if (this.config.enableDetailedLogging) {
    }
  }

  // Atualizar progresso da etapa atual
  public updateStepProgress(stepId: string, progress: number, message?: string, data?: any): void {
    const step = this.findStep(stepId);
    if (!step || step.status !== 'running') {
      return;
    }

    this.state.currentStepProgress = Math.max(0, Math.min(100, progress));
    
    this.updateProgress();
    this.emitEvent('step_progress', stepId, progress, message, data);

    // Atualizar sub-etapas se aplicável
    if (this.config.enableSubStepTracking && step.subSteps) {
      this.updateSubStepsProgress(step, progress);
    }
  }

  // Completar etapa
  public completeStep(stepId: string, result?: any): void {
    const step = this.findStep(stepId);
    if (!step) {
      return;
    }

    step.status = 'completed';
    step.endTime = Date.now();
    step.duration = step.endTime - (step.startTime || step.endTime);

    this.state.completedSteps++;
    this.state.currentStepProgress = 100;

    this.updateProgress();
    this.updatePerformanceMetrics(step);
    this.emitEvent('step_completed', stepId, 100, `Etapa concluída: ${step.name}`, result);

    if (this.config.enableDetailedLogging) {
    }

    // Verificar se todas as etapas foram concluídas
    if (this.state.completedSteps >= this.state.totalSteps) {
      this.completeProcessing();
    }
  }

  // Falhar etapa
  public failStep(stepId: string, error: Error): void {
    const step = this.findStep(stepId);
    if (!step) {
      return;
    }

    step.status = 'failed';
    step.error = error;
    step.endTime = Date.now();
    step.duration = step.endTime - (step.startTime || step.endTime);

    this.state.metadata.errorCount++;
    this.state.status = 'failed';

    this.emitEvent('step_failed', stepId, this.state.currentStepProgress, error.message, { error });

    if (this.config.enableDetailedLogging) {
      console.error(`[ProgressIndicator] Etapa falhou: ${step.name}`, error);
    }
  }

  // Pular etapa
  public skipStep(stepId: string, reason?: string): void {
    const step = this.findStep(stepId);
    if (!step) {
      return;
    }

    step.status = 'skipped';
    step.endTime = Date.now();
    
    this.state.completedSteps++; // Contar como concluída para progresso
    
    this.updateProgress();
    this.emitEvent('step_completed', stepId, 100, `Etapa pulada: ${reason || 'Não aplicável'}`);
  }

  // Atualizar metadados
  public updateMetadata(metadata: Partial<ProgressMetadata>): void {
    this.state.metadata = { ...this.state.metadata, ...metadata };
    this.emitEvent('overall_progress', this.state.currentStep, this.state.overallProgress, 'Metadados atualizados', { metadata });
  }

  // Pausar processamento
  public pauseProcessing(): void {
    this.state.status = 'paused';
    this.stopPerformanceMonitoring();
    this.emitEvent('status_changed', this.state.currentStep, this.state.overallProgress, 'Processamento pausado');
  }

  // Retomar processamento
  public resumeProcessing(): void {
    this.state.status = 'processing';
    if (this.config.enablePerformanceMetrics) {
      this.startPerformanceMonitoring();
    }
    this.emitEvent('status_changed', this.state.currentStep, this.state.overallProgress, 'Processamento retomado');
  }

  // Completar processamento
  private completeProcessing(): void {
    this.state.status = 'completed';
    this.state.overallProgress = 100;
    this.state.elapsedTime = Date.now() - this.startTime;
    
    this.stopPerformanceMonitoring();
    this.emitEvent('status_changed', '', 100, 'Processamento concluído');

    if (this.config.enableDetailedLogging) {
    }
  }

  // Atualizar progresso geral
  private updateProgress(): void {
    const now = Date.now();
    this.state.elapsedTime = now - this.startTime;
    
    // Calcular progresso geral baseado no peso das etapas
    let totalWeight = 0;
    let completedWeight = 0;
    
    for (const step of this.state.steps) {
      totalWeight += step.weight;
      
      if (step.status === 'completed') {
        completedWeight += step.weight;
      } else if (step.status === 'running') {
        completedWeight += step.weight * (this.state.currentStepProgress / 100);
      }
    }
    
    this.state.overallProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
    
    // Calcular taxa de processamento
    this.progressHistory.push(this.state.overallProgress);
    if (this.progressHistory.length > this.config.estimationWindow) {
      this.progressHistory.shift();
    }
    
    // Estimar tempo restante
    if (this.progressHistory.length >= 2) {
      const progressRate = this.calculateProgressRate();
      const remainingProgress = 100 - this.state.overallProgress;
      this.state.estimatedTimeRemaining = progressRate > 0 ? (remainingProgress / progressRate) * 1000 : 0;
    }
    
    // Calcular taxa de processamento
    if (this.state.elapsedTime > 0) {
      this.state.processingRate = this.state.metadata.processedSlides / (this.state.elapsedTime / 1000);
    }
    
    this.emitEvent('overall_progress', this.state.currentStep, this.state.overallProgress);
    this.lastUpdateTime = now;
  }

  // Calcular taxa de progresso
  private calculateProgressRate(): number {
    if (this.progressHistory.length < 2) {
      return 0;
    }
    
    const firstProgress = this.progressHistory[0];
    const lastProgress = this.progressHistory[this.progressHistory.length - 1];
    const timeSpan = this.config.updateInterval * (this.progressHistory.length - 1);
    
    return (lastProgress - firstProgress) / timeSpan; // progresso por ms
  }

  // Encontrar etapa por ID
  private findStep(stepId: string): ProgressStep | undefined {
    for (const step of this.state.steps) {
      if (step.id === stepId) {
        return step;
      }
      
      if (step.subSteps) {
        const subStep = step.subSteps.find(s => s.id === stepId);
        if (subStep) {
          return subStep;
        }
      }
    }
    
    return undefined;
  }

  // Calcular total de etapas
  private calculateTotalSteps(): number {
    let total = this.state.steps.length;
    
    if (this.config.enableSubStepTracking) {
      for (const step of this.state.steps) {
        if (step.subSteps) {
          total += step.subSteps.length;
        }
      }
    }
    
    return total;
  }

  // Atualizar progresso de sub-etapas
  private updateSubStepsProgress(parentStep: ProgressStep, parentProgress: number): void {
    if (!parentStep.subSteps) {
      return;
    }
    
    const completedSubSteps = Math.floor((parentProgress / 100) * parentStep.subSteps.length);
    
    parentStep.subSteps.forEach((subStep, index) => {
      if (index < completedSubSteps) {
        subStep.status = 'completed';
      } else if (index === completedSubSteps) {
        subStep.status = 'running';
      } else {
        subStep.status = 'pending';
      }
    });
  }

  // Emitir evento
  private emitEvent(type: ProgressEventType, step: string, progress: number, message?: string, data?: any): void {
    const event: ProgressEvent = {
      type,
      step,
      progress,
      message,
      data,
      timestamp: Date.now()
    };
    
    this.emit('progress', event);
    this.emit(type, event);
  }

  // Iniciar monitoramento de performance
  private startPerformanceMonitoring(): void {
    this.updateTimer = setInterval(() => {
      this.updatePerformanceMetrics();
    }, this.config.updateInterval);
  }

  // Parar monitoramento de performance
  private stopPerformanceMonitoring(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }

  // Atualizar métricas de performance
  private updatePerformanceMetrics(completedStep?: ProgressStep): void {
    if (!this.config.enablePerformanceMetrics) {
      return;
    }

    // Atualizar uso de memória
    if (typeof performance !== 'undefined' && performance.memory) {
      this.state.metadata.memoryUsage = performance.memory.usedJSHeapSize;
      this.performanceMetrics.memoryPeakUsage = Math.max(
        this.performanceMetrics.memoryPeakUsage,
        performance.memory.usedJSHeapSize
      );
    }

    // Atualizar métricas de etapas
    if (completedStep && completedStep.duration) {
      const completedSteps = this.state.steps.filter(s => s.status === 'completed' && s.duration);
      
      if (completedSteps.length > 0) {
        const totalDuration = completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
        this.performanceMetrics.averageStepDuration = totalDuration / completedSteps.length;
        
        // Encontrar etapa mais lenta e mais rápida
        const slowest = completedSteps.reduce((prev, current) => 
          (current.duration || 0) > (prev.duration || 0) ? current : prev
        );
        const fastest = completedSteps.reduce((prev, current) => 
          (current.duration || 0) < (prev.duration || 0) ? current : prev
        );
        
        this.performanceMetrics.slowestStep = slowest.name;
        this.performanceMetrics.fastestStep = fastest.name;
      }
    }

    // Calcular throughput
    if (this.state.elapsedTime > 0) {
      this.performanceMetrics.throughput = this.state.metadata.processedSlides / (this.state.elapsedTime / 1000);
    }
  }

  // Obter estado atual
  public getState(): ProgressState {
    return { ...this.state };
  }

  // Obter métricas de performance
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Obter resumo do progresso
  public getProgressSummary(): {
    overall: number;
    current: string;
    eta: string;
    rate: number;
    status: ProcessingStatus;
  } {
    const eta = this.state.estimatedTimeRemaining > 0 
      ? this.formatDuration(this.state.estimatedTimeRemaining)
      : 'Calculando...';
    
    return {
      overall: Math.round(this.state.overallProgress),
      current: this.state.currentStep,
      eta,
      rate: Math.round(this.state.processingRate * 100) / 100,
      status: this.state.status
    };
  }

  // Formatar duração
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Resetar progresso
  public reset(): void {
    this.stopPerformanceMonitoring();
    this.state = this.initializeState();
    this.performanceMetrics = this.initializeMetrics();
    this.progressHistory = [];
    this.startTime = 0;
    this.lastUpdateTime = 0;
  }

  // Exportar dados de progresso
  public exportProgressData(): {
    state: ProgressState;
    metrics: PerformanceMetrics;
    history: number[];
  } {
    return {
      state: this.getState(),
      metrics: this.getPerformanceMetrics(),
      history: [...this.progressHistory]
    };
  }
}

// Utilitários para progresso
export const ProgressUtils = {
  // Criar etapas padrão para processamento PPTX
  createDefaultSteps: (): Omit<ProgressStep, 'status' | 'startTime' | 'endTime' | 'duration'>[] => [
    {
      id: 'file-validation',
      name: 'Validação do Arquivo',
      description: 'Verificando integridade e formato do arquivo PPTX',
      weight: 0.05
    },
    {
      id: 'file-extraction',
      name: 'Extração do Arquivo',
      description: 'Extraindo conteúdo do arquivo PPTX',
      weight: 0.1
    },
    {
      id: 'slide-parsing',
      name: 'Análise de Slides',
      description: 'Processando estrutura e conteúdo dos slides',
      weight: 0.25
    },
    {
      id: 'content-extraction',
      name: 'Extração de Conteúdo',
      description: 'Extraindo texto, imagens e elementos visuais',
      weight: 0.2
    },
    {
      id: 'data-validation',
      name: 'Validação de Dados',
      description: 'Validando e corrigindo dados extraídos',
      weight: 0.15
    },
    {
      id: 'format-preservation',
      name: 'Preservação de Formatação',
      description: 'Mantendo formatação original dos elementos',
      weight: 0.1
    },
    {
      id: 'cache-storage',
      name: 'Armazenamento em Cache',
      description: 'Salvando resultados no sistema de cache',
      weight: 0.05
    },
    {
      id: 'finalization',
      name: 'Finalização',
      description: 'Preparando resultados finais',
      weight: 0.1
    }
  ],

  // Calcular peso baseado na complexidade
  calculateStepWeight: (complexity: 'low' | 'medium' | 'high', baseWeight: number): number => {
    const multipliers = { low: 0.5, medium: 1.0, high: 1.5 };
    return baseWeight * multipliers[complexity];
  },

  // Formatar progresso para exibição
  formatProgress: (progress: number): string => {
    return `${Math.round(progress)}%`;
  },

  // Calcular ETA baseado na taxa atual
  calculateETA: (currentProgress: number, elapsedTime: number): number => {
    if (currentProgress <= 0) return 0;
    const rate = currentProgress / elapsedTime;
    const remainingProgress = 100 - currentProgress;
    return remainingProgress / rate;
  }
};

// Exportar tipos
export type {
  ProgressStep,
  ProgressState,
  ProgressMetadata,
  ProgressConfig,
  ProgressEvent,
  PerformanceMetrics,
  ProgressStatus,
  ProcessingStatus,
  ProgressEventType
};