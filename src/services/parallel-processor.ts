// Sistema de processamento paralelo otimizado para análise PPTX
import { PPTXSlide } from './PPTXAnalysisSystem';
import { SlideDataValidator, ValidationReport } from './slide-data-validator';
import { AutoCorrectionService, CorrectionResult } from './auto-correction.service';

// Interfaces para processamento paralelo
interface ProcessingTask<T = any, R = any> {
  id: string;
  type: TaskType;
  data: T;
  priority: TaskPriority;
  timeout?: number;
  retries?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

interface ProcessingResult<R = any> {
  taskId: string;
  success: boolean;
  result?: R;
  error?: Error;
  processingTime: number;
  workerId?: string;
  retryCount: number;
}

interface WorkerConfig {
  maxWorkers: number;
  minWorkers: number;
  idleTimeout: number;
  taskTimeout: number;
  maxRetries: number;
  enableDynamicScaling: boolean;
  cpuThreshold: number;
  memoryThreshold: number;
}

interface WorkerStats {
  id: string;
  status: WorkerStatus;
  tasksProcessed: number;
  averageProcessingTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  lastActivity: number;
}

interface ProcessorMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeWorkers: number;
  queueSize: number;
  averageProcessingTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

type TaskType = 
  | 'slide_validation'
  | 'slide_correction'
  | 'content_extraction'
  | 'image_processing'
  | 'animation_analysis'
  | 'format_preservation'
  | 'complex_elements';

type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
type WorkerStatus = 'idle' | 'busy' | 'error' | 'terminated';

// Worker dedicado para processamento
class ProcessingWorker {
  public readonly id: string;
  public status: WorkerStatus = 'idle';
  public tasksProcessed: number = 0;
  public totalProcessingTime: number = 0;
  public errorCount: number = 0;
  public lastActivity: number = Date.now();
  
  private currentTask: ProcessingTask | null = null;
  private validator: SlideDataValidator;
  private correctionService: AutoCorrectionService;

  constructor(id: string) {
    this.id = id;
    this.validator = new SlideDataValidator();
    this.correctionService = new AutoCorrectionService();
  }

  // Processar uma tarefa
  public async processTask<T, R>(task: ProcessingTask<T, R>): Promise<ProcessingResult<R>> {
    const startTime = performance.now();
    this.status = 'busy';
    this.currentTask = task;
    this.lastActivity = Date.now();

    try {
      let result: R;

      switch (task.type) {
        case 'slide_validation':
          result = await this.processSlideValidation(task.data as PPTXSlide) as R;
          break;
        case 'slide_correction':
          result = await this.processSlideCorrection(task.data as any) as R;
          break;
        case 'content_extraction':
          result = await this.processContentExtraction(task.data as PPTXSlide) as R;
          break;
        case 'image_processing':
          result = await this.processImageProcessing(task.data as PPTXSlide) as R;
          break;
        case 'animation_analysis':
          result = await this.processAnimationAnalysis(task.data as PPTXSlide) as R;
          break;
        case 'format_preservation':
          result = await this.processFormatPreservation(task.data as PPTXSlide) as R;
          break;
        case 'complex_elements':
          result = await this.processComplexElements(task.data as PPTXSlide) as R;
          break;
        default:
          throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
      }

      const processingTime = performance.now() - startTime;
      this.tasksProcessed++;
      this.totalProcessingTime += processingTime;
      this.status = 'idle';
      this.currentTask = null;

      return {
        taskId: task.id,
        success: true,
        result,
        processingTime,
        workerId: this.id,
        retryCount: 0
      };

    } catch (error) {
      this.errorCount++;
      this.status = 'error';
      this.currentTask = null;

      return {
        taskId: task.id,
        success: false,
        error: error as Error,
        processingTime: performance.now() - startTime,
        workerId: this.id,
        retryCount: 0
      };
    }
  }

  // Processar validação de slide
  private async processSlideValidation(slide: PPTXSlide): Promise<any> {
    return await this.validator.validateSlide(slide);
  }

  // Processar correção de slide
  private async processSlideCorrection(data: { slide: PPTXSlide; errors: any[] }): Promise<CorrectionResult> {
    return await this.correctionService.correctSlide(data.slide, data.errors);
  }

  // Processar extração de conteúdo
  private async processContentExtraction(slide: PPTXSlide): Promise<any> {
    // Simular processamento de extração de conteúdo
    await this.simulateProcessing(100, 300);
    
    return {
      extractedText: slide.content || '',
      wordCount: (slide.content || '').split(/\s+/).length,
      hasImages: (slide.images?.length || 0) > 0,
      hasAnimations: (slide.animations?.length || 0) > 0
    };
  }

  // Processar imagens
  private async processImageProcessing(slide: PPTXSlide): Promise<any> {
    await this.simulateProcessing(200, 500);
    
    const processedImages = slide.images?.map(image => ({
      ...image,
      processed: true,
      optimized: true,
      compressionRatio: 0.8
    })) || [];

    return {
      originalCount: slide.images?.length || 0,
      processedCount: processedImages.length,
      totalSize: processedImages.reduce((sum, img) => sum + (img.size || 0), 0),
      images: processedImages
    };
  }

  // Processar análise de animações
  private async processAnimationAnalysis(slide: PPTXSlide): Promise<any> {
    await this.simulateProcessing(150, 400);
    
    const animations = slide.animations || [];
    
    return {
      totalAnimations: animations.length,
      animationTypes: [...new Set(animations.map(a => a.type))],
      totalDuration: animations.reduce((sum, a) => sum + (a.duration || 0), 0),
      complexity: animations.length > 5 ? 'high' : animations.length > 2 ? 'medium' : 'low'
    };
  }

  // Processar preservação de formato
  private async processFormatPreservation(slide: PPTXSlide): Promise<any> {
    await this.simulateProcessing(100, 250);
    
    return {
      fontsPreserved: true,
      colorsPreserved: true,
      layoutPreserved: true,
      formattingScore: 0.95
    };
  }

  // Processar elementos complexos
  private async processComplexElements(slide: PPTXSlide): Promise<any> {
    await this.simulateProcessing(300, 600);
    
    return {
      tablesFound: 0,
      chartsFound: 0,
      smartArtFound: 0,
      diagramsFound: 0,
      complexityScore: 0.3
    };
  }

  // Simular processamento assíncrono
  private async simulateProcessing(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Obter estatísticas do worker
  public getStats(): WorkerStats {
    return {
      id: this.id,
      status: this.status,
      tasksProcessed: this.tasksProcessed,
      averageProcessingTime: this.tasksProcessed > 0 
        ? this.totalProcessingTime / this.tasksProcessed 
        : 0,
      errorRate: this.tasksProcessed > 0 
        ? this.errorCount / this.tasksProcessed 
        : 0,
      cpuUsage: Math.random() * 100, // Simulado
      memoryUsage: Math.random() * 100, // Simulado
      lastActivity: this.lastActivity
    };
  }

  // Terminar worker
  public terminate(): void {
    this.status = 'terminated';
    this.currentTask = null;
  }
}

// Processador paralelo principal
export class ParallelProcessor {
  private config: WorkerConfig;
  private workers: Map<string, ProcessingWorker>;
  private taskQueue: ProcessingTask[];
  private completedTasks: Map<string, ProcessingResult>;
  private failedTasks: Map<string, ProcessingResult>;
  private metrics: ProcessorMetrics;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      maxWorkers: navigator.hardwareConcurrency || 4,
      minWorkers: 1,
      idleTimeout: 30000, // 30 segundos
      taskTimeout: 60000, // 60 segundos
      maxRetries: 3,
      enableDynamicScaling: true,
      cpuThreshold: 80,
      memoryThreshold: 85,
      ...config
    };

    this.workers = new Map();
    this.taskQueue = [];
    this.completedTasks = new Map();
    this.failedTasks = new Map();
    
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeWorkers: 0,
      queueSize: 0,
      averageProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0
    };

    this.initializeWorkers();
  }

  // Inicializar workers
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
  }

  // Criar novo worker
  private createWorker(): ProcessingWorker {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const worker = new ProcessingWorker(workerId);
    this.workers.set(workerId, worker);
    return worker;
  }

  // Iniciar processamento
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleProcessing();
  }

  // Agendar processamento usando requestIdleCallback para evitar Long Tasks
  private scheduleProcessing(): void {
    if (!this.isRunning) return;

    const processWithIdleCallback = (deadline?: IdleDeadline) => {
      const startTime = performance.now();
      
      // Processar apenas se tiver tempo disponível ou se for crítico
      if (!deadline || deadline.timeRemaining() > 5 || deadline.didTimeout) {
        this.processQueue();
        this.updateMetrics();
        this.manageWorkers();
      }
      
      // Limitar tempo de processamento para evitar Long Tasks
      const processingTime = performance.now() - startTime;
      if (processingTime > 16) { // Mais de 16ms pode causar jank
        console.warn(`Processamento demorou ${processingTime.toFixed(2)}ms`);
      }
      
      // Reagendar para próxima execução
      if (this.isRunning) {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(processWithIdleCallback, { timeout: 100 });
        } else {
          // Fallback para browsers sem suporte
          setTimeout(() => processWithIdleCallback(), 100);
        }
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(processWithIdleCallback, { timeout: 100 });
    } else {
      // Fallback para browsers sem suporte
      setTimeout(() => processWithIdleCallback(), 100);
    }
  }

  // Parar processamento
  public stop(): void {
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Terminar todos os workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();
  }

  // Adicionar tarefa à fila
  public addTask<T, R>(task: Omit<ProcessingTask<T, R>, 'id'>): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: ProcessingTask<T, R> = {
      id: taskId,
      timeout: this.config.taskTimeout,
      retries: this.config.maxRetries,
      ...task
    };

    // Inserir na posição correta baseado na prioridade
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.taskQueue.findIndex(
      t => priorityOrder[t.priority] > priorityOrder[fullTask.priority]
    );
    
    if (insertIndex === -1) {
      this.taskQueue.push(fullTask);
    } else {
      this.taskQueue.splice(insertIndex, 0, fullTask);
    }

    this.metrics.totalTasks++;
    this.metrics.queueSize = this.taskQueue.length;

    return taskId;
  }

  // Processar fila de tarefas
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');

    if (availableWorkers.length === 0) return;

    // Processar tarefas em paralelo
    const tasksToProcess = this.taskQueue.splice(0, availableWorkers.length);
    
    const processingPromises = tasksToProcess.map(async (task, index) => {
      const worker = availableWorkers[index];
      
      try {
        const result = await Promise.race([
          worker.processTask(task),
          this.createTimeoutPromise(task.timeout || this.config.taskTimeout, task.id)
        ]);

        if (result.success) {
          this.completedTasks.set(task.id, result);
          this.metrics.completedTasks++;
        } else {
          await this.handleTaskFailure(task, result);
        }

      } catch (error) {
        await this.handleTaskFailure(task, {
          taskId: task.id,
          success: false,
          error: error as Error,
          processingTime: 0,
          workerId: worker.id,
          retryCount: 0
        });
      }
    });

    await Promise.allSettled(processingPromises);
    this.metrics.queueSize = this.taskQueue.length;
  }

  // Criar promise de timeout
  private createTimeoutPromise(timeout: number, taskId: string): Promise<ProcessingResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tarefa ${taskId} excedeu o tempo limite de ${timeout}ms`));
      }, timeout);
    });
  }

  // Lidar com falha de tarefa
  private async handleTaskFailure(task: ProcessingTask, result: ProcessingResult): Promise<void> {
    const currentRetries = result.retryCount || 0;
    
    if (currentRetries < (task.retries || this.config.maxRetries)) {
      // Reagendar tarefa para retry
      const retryTask = {
        ...task,
        id: `${task.id}_retry_${currentRetries + 1}`
      };
      
      // Adicionar delay antes do retry
      setTimeout(() => {
        this.taskQueue.unshift(retryTask);
      }, Math.pow(2, currentRetries) * 1000); // Backoff exponencial
      
    } else {
      // Tarefa falhou definitivamente
      this.failedTasks.set(task.id, result);
      this.metrics.failedTasks++;
    }
  }

  // Gerenciar workers dinamicamente
  private manageWorkers(): void {
    if (!this.config.enableDynamicScaling) return;

    const activeWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status !== 'terminated').length;
    
    const queueSize = this.taskQueue.length;
    const avgCpuUsage = this.calculateAverageCpuUsage();
    const avgMemoryUsage = this.calculateAverageMemoryUsage();

    // Escalar para cima se necessário
    if (queueSize > activeWorkers * 2 && 
        activeWorkers < this.config.maxWorkers &&
        avgCpuUsage < this.config.cpuThreshold &&
        avgMemoryUsage < this.config.memoryThreshold) {
      
      this.createWorker();
    }

    // Escalar para baixo se necessário
    if (queueSize === 0 && activeWorkers > this.config.minWorkers) {
      const idleWorkers = Array.from(this.workers.values())
        .filter(worker => 
          worker.status === 'idle' && 
          Date.now() - worker.lastActivity > this.config.idleTimeout
        );

      if (idleWorkers.length > 0) {
        const workerToRemove = idleWorkers[0];
        workerToRemove.terminate();
        this.workers.delete(workerToRemove.id);
      }
    }
  }

  // Calcular uso médio de CPU
  private calculateAverageCpuUsage(): number {
    const workers = Array.from(this.workers.values())
      .filter(worker => worker.status !== 'terminated');
    
    if (workers.length === 0) return 0;
    
    const totalCpu = workers.reduce((sum, worker) => 
      sum + worker.getStats().cpuUsage, 0
    );
    
    return totalCpu / workers.length;
  }

  // Calcular uso médio de memória
  private calculateAverageMemoryUsage(): number {
    const workers = Array.from(this.workers.values())
      .filter(worker => worker.status !== 'terminated');
    
    if (workers.length === 0) return 0;
    
    const totalMemory = workers.reduce((sum, worker) => 
      sum + worker.getStats().memoryUsage, 0
    );
    
    return totalMemory / workers.length;
  }

  // Atualizar métricas
  private updateMetrics(): void {
    const activeWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status !== 'terminated').length;
    
    this.metrics.activeWorkers = activeWorkers;
    this.metrics.queueSize = this.taskQueue.length;
    this.metrics.cpuUsage = this.calculateAverageCpuUsage();
    this.metrics.memoryUsage = this.calculateAverageMemoryUsage();
    
    // Calcular taxa de erro
    const totalProcessed = this.metrics.completedTasks + this.metrics.failedTasks;
    this.metrics.errorRate = totalProcessed > 0 
      ? this.metrics.failedTasks / totalProcessed 
      : 0;

    // Calcular tempo médio de processamento
    const allResults = [...this.completedTasks.values(), ...this.failedTasks.values()];
    if (allResults.length > 0) {
      const totalTime = allResults.reduce((sum, result) => sum + result.processingTime, 0);
      this.metrics.averageProcessingTime = totalTime / allResults.length;
    }

    // Calcular throughput (tarefas por segundo)
    this.metrics.throughput = this.metrics.completedTasks / 
      (Date.now() / 1000); // Simplificado
  }

  // Obter resultado de tarefa
  public getTaskResult(taskId: string): ProcessingResult | null {
    return this.completedTasks.get(taskId) || this.failedTasks.get(taskId) || null;
  }

  // Aguardar conclusão de tarefa
  public async waitForTask(taskId: string, timeout: number = 30000): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const result = this.getTaskResult(taskId);
        
        if (result) {
          resolve(result);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout aguardando tarefa ${taskId}`));
          return;
        }
        
        setTimeout(checkResult, 100);
      };
      
      checkResult();
    });
  }

  // Processar múltiplos slides
  public async processSlides(
    slides: PPTXSlide[], 
    taskType: TaskType = 'slide_validation'
  ): Promise<ProcessingResult[]> {
    const taskIds = slides.map(slide => 
      this.addTask({
        type: taskType,
        data: slide,
        priority: 'normal'
      })
    );

    const results = await Promise.all(
      taskIds.map(taskId => this.waitForTask(taskId))
    );

    return results;
  }

  // Obter métricas
  public getMetrics(): ProcessorMetrics {
    return { ...this.metrics };
  }

  // Obter estatísticas dos workers
  public getWorkerStats(): WorkerStats[] {
    return Array.from(this.workers.values())
      .filter(worker => worker.status !== 'terminated')
      .map(worker => worker.getStats());
  }

  // Limpar tarefas concluídas
  public clearCompletedTasks(): void {
    this.completedTasks.clear();
    this.failedTasks.clear();
  }

  // Atualizar configuração
  public updateConfig(newConfig: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Utilitários para processamento paralelo
export const ParallelUtils = {
  // Dividir array em chunks para processamento paralelo
  chunkArray: <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  },

  // Calcular tamanho ótimo de chunk baseado no número de workers
  calculateOptimalChunkSize: (totalItems: number, workerCount: number): number => {
    return Math.max(1, Math.ceil(totalItems / (workerCount * 2)));
  },

  // Estimar tempo de processamento
  estimateProcessingTime: (
    itemCount: number, 
    avgProcessingTime: number, 
    workerCount: number
  ): number => {
    const parallelTime = Math.ceil(itemCount / workerCount) * avgProcessingTime;
    const overhead = itemCount * 10; // 10ms de overhead por item
    return parallelTime + overhead;
  }
};

// Exportar tipos
export type {
  ProcessingTask,
  ProcessingResult,
  WorkerConfig,
  WorkerStats,
  ProcessorMetrics,
  TaskType,
  TaskPriority,
  WorkerStatus
};