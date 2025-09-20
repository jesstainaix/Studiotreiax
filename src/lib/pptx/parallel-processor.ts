/**
 * Lightweight parallel task processor designed to run in both browser and Node environments.
 * Provides concurrency control, retries, priority-aware queues and observable metrics.
 */
import type { PPTXSlide } from './content-extractor';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProcessingTask<TData = any> {
  id: string;
  type: string;
  data: TData;
  priority?: TaskPriority;
  timeout?: number;
  retries?: number;
  estimatedDuration?: number;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface ProcessingResult<TResult = any> {
  taskId: string;
  success: boolean;
  result?: TResult;
  error?: string;
  attempts: number;
  duration: number;
  priority: TaskPriority;
}

export interface TaskSummary {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}

export type ProcessorFunction<TData, TResult> = (data: TData) => Promise<TResult> | TResult;

export interface ParallelProcessorConfig {
  maxWorkers: number;
  queueSize: number;
  taskTimeout: number;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enablePriority: boolean;
  enableMetrics: boolean;
}

interface InternalTask<TData, TResult> {
  task: ProcessingTask<TData>;
  processor: ProcessorFunction<TData, TResult>;
  resolve: (result: ProcessingResult<TResult>) => void;
  enqueuedAt: number;
}

interface MetricsState {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalProcessingTime: number;
  startTime: number | null;
}

interface WorkerState {
  completedTasks: number;
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const DEFAULT_CONFIG: ParallelProcessorConfig = {
  maxWorkers: 4,
  queueSize: 100,
  taskTimeout: 2000,
  enableRetry: true,
  maxRetries: 2,
  retryDelay: 100,
  enablePriority: true,
  enableMetrics: true,
};

function getDefaultMaxWorkers(): number {
  if (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0) {
    return Math.max(2, Math.min(8, navigator.hardwareConcurrency));
  }
  return DEFAULT_CONFIG.maxWorkers;
}

function isValidPriority(value: unknown): value is TaskPriority {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
}

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : 'Unknown error');
}

export class ParallelProcessor {
  private static singleton: ParallelProcessor | null = null;

  private config: ParallelProcessorConfig;
  private queue: InternalTask<any, any>[] = [];
  private activeWorkers = 0;
  private metrics: MetricsState = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    totalProcessingTime: 0,
    startTime: null,
  };
  private workerState: WorkerState = { completedTasks: 0 };
  private destroyed = false;

  constructor(config?: Partial<ParallelProcessorConfig>) {
    const defaults = { ...DEFAULT_CONFIG, maxWorkers: getDefaultMaxWorkers() };
    const merged = { ...defaults, ...config };
    this.validateConfig(merged);
    this.config = merged;
  }

  static getInstance(): ParallelProcessor {
    if (!ParallelProcessor.singleton) {
      ParallelProcessor.singleton = new ParallelProcessor();
    }
    return ParallelProcessor.singleton;
  }

  configure(config: Partial<ParallelProcessorConfig>): void {
    const next = { ...this.config, ...config };
    this.validateConfig(next);
    this.config = next;
  }

  getConfiguration(): ParallelProcessorConfig {
    return { ...this.config };
  }

  async processTask<TData, TResult>(
    task: ProcessingTask<TData>,
    processor: ProcessorFunction<TData, TResult>
  ): Promise<ProcessingResult<TResult>> {
    const { results } = await this.processTasks([task], processor);
    return results[0];
  }

  async processTasks<TData, TResult>(
    tasks: ProcessingTask<TData>[],
    processor: ProcessorFunction<TData, TResult>
  ): Promise<{ results: ProcessingResult<TResult>[]; summary: TaskSummary }> {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        results: [],
        summary: {
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          totalProcessingTime: 0,
          averageProcessingTime: 0,
        },
      };
    }

    const results: ProcessingResult<TResult>[] = new Array(tasks.length);
    const validEntries: Array<{ index: number; task: ProcessingTask<TData> }> = [];

    tasks.forEach((task, index) => {
      if (!this.isValidTask(task)) {
        const failure = this.createFailureResult(
          task?.id ?? `invalid-task-${index}`,
          task?.priority,
          'Invalid task definition'
        );
        this.workerState.completedTasks += 1;
        this.recordMetrics(failure);
        results[index] = failure;
        return;
      }

      const normalizedTask = this.normalizeTask(task);
      validEntries.push({ index, task: normalizedTask });
    });

    if (typeof processor !== 'function') {
      validEntries.forEach(({ index, task }) => {
        const failure = this.createFailureResult(task.id, task.priority, 'Invalid processor function');
        this.workerState.completedTasks += 1;
        this.recordMetrics(failure);
        results[index] = failure;
      });

      return {
        results,
        summary: this.buildSummary(results),
      };
    }

    const entriesToProcess = this.config.enablePriority
      ? [...validEntries].sort((a, b) => {
          const aPriority = PRIORITY_ORDER[a.task.priority as TaskPriority] ?? PRIORITY_ORDER.medium;
          const bPriority = PRIORITY_ORDER[b.task.priority as TaskPriority] ?? PRIORITY_ORDER.medium;
          return bPriority - aPriority;
        })
      : validEntries;

    const promises = entriesToProcess.map(({ index, task }) =>
      this.enqueueTask(task, processor).then((result) => {
        results[index] = result;
        return result;
      })
    );

    await Promise.all(promises);

    return {
      results,
      summary: this.buildSummary(results),
    };
  }

  getMetrics(): {
    totalTasksProcessed: number;
    successfulTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    throughput: number;
  } {
    if (!this.config.enableMetrics) {
      return {
        totalTasksProcessed: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageProcessingTime: 0,
        throughput: 0,
      };
    }

    const average =
      this.metrics.totalTasks > 0 ? this.metrics.totalProcessingTime / this.metrics.totalTasks : 0;
    const elapsedMs =
      this.metrics.startTime !== null ? Math.max(Date.now() - this.metrics.startTime, 0) : 0;
    const durationForThroughput = elapsedMs > 0 ? elapsedMs : this.metrics.totalProcessingTime;
    const throughput =
      durationForThroughput > 0
        ? this.metrics.totalTasks / (durationForThroughput / 1000)
        : this.metrics.totalTasks > 0
        ? this.metrics.totalTasks
        : 0;

    return {
      totalTasksProcessed: this.metrics.totalTasks,
      successfulTasks: this.metrics.successfulTasks,
      failedTasks: this.metrics.failedTasks,
      averageProcessingTime: average,
      throughput,
    };
  }

  getWorkerStats(): {
    activeWorkers: number;
    totalWorkers: number;
    queueSize: number;
    completedTasks: number;
  } {
    return {
      activeWorkers: this.activeWorkers,
      totalWorkers: this.config.maxWorkers,
      queueSize: this.queue.length,
      completedTasks: this.workerState.completedTasks,
    };
  }

  async shutdown(): Promise<void> {
    this.queue = [];
    this.activeWorkers = 0;
    this.destroyed = true;
    this.metrics = {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalProcessingTime: 0,
      startTime: null,
    };
    this.workerState = { completedTasks: 0 };

    if (ParallelProcessor.singleton === this) {
      ParallelProcessor.singleton = null;
    }
  }

  private enqueueTask<TData, TResult>(
    task: ProcessingTask<TData>,
    processor: ProcessorFunction<TData, TResult>
  ): Promise<ProcessingResult<TResult>> {
    return new Promise((resolve) => {
      if (this.destroyed) {
        const result = this.createFailureResult(task.id, task.priority, 'Processor has been shut down');
        this.workerState.completedTasks += 1;
        this.recordMetrics(result);
        resolve(result);
        return;
      }

      if (
        this.activeWorkers >= this.config.maxWorkers &&
        this.queue.length >= this.config.queueSize
      ) {
        const result = this.createFailureResult(task.id, task.priority, 'Queue overflow');
        this.workerState.completedTasks += 1;
        this.recordMetrics(result);
        resolve(result);
        return;
      }

      const internalTask: InternalTask<TData, TResult> = {
        task,
        processor,
        resolve,
        enqueuedAt: Date.now(),
      };

      this.insertTask(internalTask);
      this.processQueue();
    });
  }

  private insertTask<TData, TResult>(internalTask: InternalTask<TData, TResult>): void {
    if (!this.config.enablePriority) {
      this.queue.push(internalTask);
      return;
    }

    const priorityValue = PRIORITY_ORDER[internalTask.task.priority as TaskPriority] ?? PRIORITY_ORDER.medium;
    let insertIndex = this.queue.findIndex((queuedTask) => {
      const queuedPriority =
        PRIORITY_ORDER[queuedTask.task.priority as TaskPriority] ?? PRIORITY_ORDER.medium;
      return priorityValue > queuedPriority;
    });

    if (insertIndex === -1) {
      insertIndex = this.queue.length;
    }

    this.queue.splice(insertIndex, 0, internalTask);
  }

  private processQueue(): void {
    while (this.activeWorkers < this.config.maxWorkers && this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (!nextTask) {
        break;
      }
      this.runInternalTask(nextTask);
    }
  }

  private runInternalTask<TData, TResult>(internalTask: InternalTask<TData, TResult>): void {
    this.activeWorkers += 1;

    this.processTaskExecution(internalTask)
      .then((result) => {
        this.recordMetrics(result);
        internalTask.resolve(result);
      })
      .finally(() => {
        this.activeWorkers = Math.max(0, this.activeWorkers - 1);
        this.processQueue();
      });
  }

  private async processTaskExecution<TData, TResult>(
    internalTask: InternalTask<TData, TResult>
  ): Promise<ProcessingResult<TResult>> {
    const { task, processor } = internalTask;
    const timeout = typeof task.timeout === 'number' && task.timeout > 0 ? task.timeout : this.config.taskTimeout;
    const maxAttempts = this.config.enableRetry
      ? Math.max(1, (typeof task.retries === 'number' && task.retries >= 0 ? task.retries : this.config.maxRetries) + 1)
      : 1;

    let attempt = 0;
    let lastError: Error | null = null;
    const start = Date.now();

    while (attempt < maxAttempts) {
      attempt += 1;

      try {
        const result = await this.runWithTimeout(() => processor(task.data), timeout, task.id);
        const success = this.createSuccessResult(task, result, Date.now() - start, attempt);
        this.workerState.completedTasks += 1;
        return success;
      } catch (error) {
        lastError = normalizeError(error);

        if (attempt >= maxAttempts) {
          const failure = this.createFailureResult(
            task.id,
            task.priority,
            lastError.message,
            Date.now() - start,
            attempt
          );
          this.workerState.completedTasks += 1;
          return failure;
        }

        await delay(this.config.retryDelay);
      }
    }

    const duration = Date.now() - start;
    const failure = this.createFailureResult(
      task.id,
      task.priority,
      lastError?.message ?? 'Unknown error',
      duration,
      attempt
    );
    this.workerState.completedTasks += 1;
    return failure;
  }

  private runWithTimeout<TResult>(
    fn: () => Promise<TResult> | TResult,
    timeout: number,
    taskId: string
  ): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      let finished = false;
      const timer = setTimeout(() => {
        if (finished) {
          return;
        }
        finished = true;
        reject(new Error(`Task ${taskId} timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve()
        .then(fn)
        .then((result) => {
          if (finished) {
            return;
          }
          finished = true;
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          if (finished) {
            return;
          }
          finished = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private recordMetrics(result: ProcessingResult<any>): void {
    if (!this.config.enableMetrics) {
      return;
    }

    if (this.metrics.startTime === null) {
      this.metrics.startTime = Date.now();
    }

    this.metrics.totalTasks += 1;
    if (result.success) {
      this.metrics.successfulTasks += 1;
    } else {
      this.metrics.failedTasks += 1;
    }
    this.metrics.totalProcessingTime += result.duration;
  }

  private buildSummary(results: Array<ProcessingResult<any> | undefined>): TaskSummary {
    const finalized = results.filter((res): res is ProcessingResult<any> => Boolean(res));
    const totalTasks = finalized.length;
    const successfulTasks = finalized.filter((res) => res.success).length;
    const totalProcessingTime = finalized.reduce((acc, res) => acc + res.duration, 0);
    const averageProcessingTime = totalTasks > 0 ? totalProcessingTime / totalTasks : 0;

    return {
      totalTasks,
      successfulTasks,
      failedTasks: totalTasks - successfulTasks,
      totalProcessingTime,
      averageProcessingTime,
    };
  }

  private createSuccessResult<TResult>(
    task: ProcessingTask,
    result: TResult,
    duration: number,
    attempts: number
  ): ProcessingResult<TResult> {
    const priority = isValidPriority(task.priority) ? task.priority : 'medium';
    return {
      taskId: task.id,
      success: true,
      result,
      error: undefined,
      attempts,
      duration,
      priority,
    };
  }

  private createFailureResult(
    taskId: string,
    priority: TaskPriority | undefined,
    errorMessage: string,
    duration = 0,
    attempts = 1
  ): ProcessingResult<undefined> {
    const normalizedPriority = isValidPriority(priority) ? priority : 'medium';
    return {
      taskId,
      success: false,
      result: undefined,
      error: errorMessage,
      attempts,
      duration,
      priority: normalizedPriority,
    };
  }

  private isValidTask(task: ProcessingTask | undefined | null): task is ProcessingTask {
    return Boolean(
      task &&
        typeof task.id === 'string' &&
        task.id.trim().length > 0 &&
        typeof task.type === 'string' &&
        task.type.trim().length > 0 &&
        task.data !== undefined
    );
  }

  private normalizeTask<TData>(task: ProcessingTask<TData>): ProcessingTask<TData> {
    const priority = isValidPriority(task.priority) ? task.priority : 'medium';
    return { ...task, priority };
  }

  private validateConfig(config: ParallelProcessorConfig): void {
    if (!Number.isFinite(config.maxWorkers) || config.maxWorkers <= 0) {
      throw new Error('maxWorkers must be greater than 0');
    }

    if (!Number.isFinite(config.queueSize) || config.queueSize < 0) {
      throw new Error('queueSize must be zero or greater');
    }

    if (!Number.isFinite(config.taskTimeout) || config.taskTimeout <= 0) {
      throw new Error('taskTimeout must be greater than 0');
    }

    if (!Number.isFinite(config.maxRetries) || config.maxRetries < 0) {
      throw new Error('maxRetries must be zero or greater');
    }

    if (!Number.isFinite(config.retryDelay) || config.retryDelay < 0) {
      throw new Error('retryDelay must be zero or greater');
    }
  }
}

export function createParallelProcessor(config?: Partial<ParallelProcessorConfig>): ParallelProcessor {
  return new ParallelProcessor(config);
}

export async function processInParallel<TData, TResult>(
  items: TData[],
  processor: ProcessorFunction<TData, TResult>,
  config?: Partial<ParallelProcessorConfig>
): Promise<TResult[]> {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const processorInstance = createParallelProcessor(config);
  const tasks = items.map((item, index) => ({
    id: `item-${index}`,
    type: 'parallel',
    data: item,
    priority: 'medium' as TaskPriority,
  }));

  const { results } = await processorInstance.processTasks(tasks, processor);
  await processorInstance.shutdown();

  return results
    .filter((result) => result.success && result.result !== undefined)
    .map((result) => result.result as TResult);
}

export async function processSlidesBatch(
  slides: PPTXSlide[],
  options: Record<string, unknown> = {},
  config?: Partial<ParallelProcessorConfig>
): Promise<PPTXSlide[]> {
  if (!Array.isArray(slides) || slides.length === 0) {
    return [];
  }

  const processorInstance = createParallelProcessor(config);

  const tasks: ProcessingTask<{ slide: PPTXSlide; options: Record<string, unknown> }>[] = slides.map(
    (slide, index) => ({
      id: slide.id ?? `slide-${index}`,
      type: 'slide-extraction',
      data: { slide, options },
      priority: 'medium',
    })
  );

  const { results } = await processorInstance.processTasks(tasks, async ({ slide }) => {
    return {
      extractedSlide: {
        ...slide,
        processed: true,
        processingTimestamp: Date.now(),
        extractedElements: {
          titles: slide.title ? 1 : 0,
          textContent: slide.content ? 1 : 0,
          images: Array.isArray(slide.images) ? slide.images.length : 0,
          bulletPoints: Array.isArray(slide.bulletPoints) ? slide.bulletPoints.length : 0,
          shapes: Array.isArray(slide.shapes) ? slide.shapes.length : 0,
        },
      },
    };
  });

  await processorInstance.shutdown();

  return results
    .filter((result) => result.success && result.result && (result.result as any).extractedSlide)
    .map((result) => (result.result as { extractedSlide: PPTXSlide }).extractedSlide);
}


