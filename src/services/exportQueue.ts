import { ExportJob, ExportProgress, ExportSettings } from '../types/export';
import { RenderEngine } from './renderEngine';
import { CompressionEngine } from './compressionEngine';

export interface QueueItem {
  id: string;
  job: ExportJob;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  addedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  estimatedTimeRemaining: number;
  averageProcessingTime: number;
}

export class ExportQueue {
  private queue: QueueItem[] = [];
  private processing: Map<string, QueueItem> = new Map();
  private completed: QueueItem[] = [];
  private failed: QueueItem[] = [];
  private maxConcurrent: number = 2;
  private isProcessing: boolean = false;
  private progressCallbacks: Map<string, (progress: ExportProgress) => void> = new Map();
  private queueCallbacks: ((stats: QueueStats) => void)[] = [];
  private renderEngine: RenderEngine;
  private compressionEngine: CompressionEngine;

  constructor() {
    this.renderEngine = new RenderEngine();
    this.compressionEngine = new CompressionEngine();
  }

  // Adicionar job à fila
  addJob(job: ExportJob, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): string {
    const queueItem: QueueItem = {
      id: this.generateId(),
      job,
      priority,
      addedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    // Inserir na posição correta baseado na prioridade
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      item => priorityOrder[item.priority] > priorityOrder[priority]
    );

    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    this.notifyQueueUpdate();
    this.processQueue();

    return queueItem.id;
  }

  // Remover job da fila
  removeJob(jobId: string): boolean {
    const queueIndex = this.queue.findIndex(item => item.id === jobId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.notifyQueueUpdate();
      return true;
    }

    // Se estiver processando, cancelar
    if (this.processing.has(jobId)) {
      this.cancelJob(jobId);
      return true;
    }

    return false;
  }

  // Cancelar job em processamento
  cancelJob(jobId: string): boolean {
    const item = this.processing.get(jobId);
    if (item) {
      this.renderEngine.cancelRender(jobId);
      this.processing.delete(jobId);
      this.failed.push({ ...item, completedAt: new Date() });
      this.notifyProgress(jobId, {
        jobId,
        progress: 0,
        status: 'cancelled',
        currentStep: 'Cancelado',
        estimatedTimeRemaining: 0,
        processedFrames: 0,
        totalFrames: 0,
        outputSize: 0,
        speed: 0
      });
      this.notifyQueueUpdate();
      this.processQueue();
      return true;
    }
    return false;
  }

  // Pausar/retomar fila
  pauseQueue(): void {
    this.isProcessing = false;
  }

  resumeQueue(): void {
    this.isProcessing = true;
    this.processQueue();
  }

  // Limpar fila
  clearQueue(): void {
    this.queue = [];
    this.notifyQueueUpdate();
  }

  // Limpar histórico
  clearHistory(): void {
    this.completed = [];
    this.failed = [];
    this.notifyQueueUpdate();
  }

  // Reprocessar job falhado
  retryJob(jobId: string): boolean {
    const failedIndex = this.failed.findIndex(item => item.id === jobId);
    if (failedIndex !== -1) {
      const item = this.failed.splice(failedIndex, 1)[0];
      item.retryCount++;
      item.startedAt = undefined;
      item.completedAt = undefined;
      
      if (item.retryCount <= item.maxRetries) {
        this.queue.unshift(item); // Adicionar no início da fila
        this.notifyQueueUpdate();
        this.processQueue();
        return true;
      }
    }
    return false;
  }

  // Obter estatísticas da fila
  getStats(): QueueStats {
    const total = this.queue.length + this.processing.size + this.completed.length + this.failed.length;
    const pending = this.queue.length;
    const processing = this.processing.size;
    const completed = this.completed.length;
    const failed = this.failed.length;

    // Calcular tempo médio de processamento
    const completedWithTimes = this.completed.filter(item => 
      item.startedAt && item.completedAt
    );
    const averageProcessingTime = completedWithTimes.length > 0 
      ? completedWithTimes.reduce((sum, item) => {
          const duration = item.completedAt!.getTime() - item.startedAt!.getTime();
          return sum + duration;
        }, 0) / completedWithTimes.length
      : 0;

    // Estimar tempo restante
    const estimatedTimeRemaining = pending * averageProcessingTime;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      estimatedTimeRemaining,
      averageProcessingTime
    };
  }

  // Obter todos os jobs
  getAllJobs(): {
    queue: QueueItem[];
    processing: QueueItem[];
    completed: QueueItem[];
    failed: QueueItem[];
  } {
    return {
      queue: [...this.queue],
      processing: Array.from(this.processing.values()),
      completed: [...this.completed],
      failed: [...this.failed]
    };
  }

  // Registrar callback de progresso
  onProgress(jobId: string, callback: (progress: ExportProgress) => void): void {
    this.progressCallbacks.set(jobId, callback);
  }

  // Registrar callback de atualização da fila
  onQueueUpdate(callback: (stats: QueueStats) => void): void {
    this.queueCallbacks.push(callback);
  }

  // Remover callback de progresso
  offProgress(jobId: string): void {
    this.progressCallbacks.delete(jobId);
  }

  // Remover callback de fila
  offQueueUpdate(callback: (stats: QueueStats) => void): void {
    const index = this.queueCallbacks.indexOf(callback);
    if (index !== -1) {
      this.queueCallbacks.splice(index, 1);
    }
  }

  // Processar fila
  private async processQueue(): Promise<void> {
    if (!this.isProcessing || this.processing.size >= this.maxConcurrent) {
      return;
    }

    const nextItem = this.queue.shift();
    if (!nextItem) {
      return;
    }

    nextItem.startedAt = new Date();
    this.processing.set(nextItem.id, nextItem);
    this.notifyQueueUpdate();

    try {
      await this.processJob(nextItem);
      
      // Job concluído com sucesso
      nextItem.completedAt = new Date();
      this.processing.delete(nextItem.id);
      this.completed.push(nextItem);
      
      this.notifyProgress(nextItem.id, {
        jobId: nextItem.id,
        progress: 100,
        status: 'completed',
        currentStep: 'Concluído',
        estimatedTimeRemaining: 0,
        processedFrames: nextItem.job.settings.duration * nextItem.job.settings.frameRate,
        totalFrames: nextItem.job.settings.duration * nextItem.job.settings.frameRate,
        outputSize: 0, // Será atualizado pelo render engine
        speed: 1
      });
      
    } catch (error) {
      // Job falhou
      nextItem.completedAt = new Date();
      this.processing.delete(nextItem.id);
      
      if (nextItem.retryCount < nextItem.maxRetries) {
        // Tentar novamente
        nextItem.retryCount++;
        nextItem.startedAt = undefined;
        nextItem.completedAt = undefined;
        this.queue.unshift(nextItem);
      } else {
        // Falha definitiva
        this.failed.push(nextItem);
      }
      
      this.notifyProgress(nextItem.id, {
        jobId: nextItem.id,
        progress: 0,
        status: 'error',
        currentStep: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        estimatedTimeRemaining: 0,
        processedFrames: 0,
        totalFrames: 0,
        outputSize: 0,
        speed: 0
      });
    }

    this.notifyQueueUpdate();
    
    // Continuar processando próximo job
    setTimeout(() => this.processQueue(), 100);
  }

  // Processar job individual
  private async processJob(item: QueueItem): Promise<void> {
    const { job } = item;
    
    // Callback de progresso
    const onProgress = (progress: ExportProgress) => {
      this.notifyProgress(item.id, { ...progress, jobId: item.id });
    };

    // Iniciar renderização
    await this.renderEngine.render(job.settings, onProgress);
  }

  // Notificar progresso
  private notifyProgress(jobId: string, progress: ExportProgress): void {
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(progress);
    }
  }

  // Notificar atualização da fila
  private notifyQueueUpdate(): void {
    const stats = this.getStats();
    this.queueCallbacks.forEach(callback => callback(stats));
  }

  // Gerar ID único
  private generateId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configurar número máximo de jobs simultâneos
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, Math.min(max, 4));
  }

  // Obter número máximo de jobs simultâneos
  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  // Inicializar processamento
  start(): void {
    this.isProcessing = true;
    this.processQueue();
  }

  // Parar processamento
  stop(): void {
    this.isProcessing = false;
    // Cancelar todos os jobs em processamento
    Array.from(this.processing.keys()).forEach(jobId => {
      this.cancelJob(jobId);
    });
  }
}

// Instância singleton
export const exportQueue = new ExportQueue();