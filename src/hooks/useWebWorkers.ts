import { useState, useEffect, useRef, useCallback } from 'react';

// Types
export interface WebWorkerConfig {
  enabled: boolean;
  maxWorkers: number;
  workerTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  enableProfiling: boolean;
  workerTypes: WorkerTypeConfig[];
}

export interface WorkerTypeConfig {
  id: string;
  name: string;
  script: string;
  maxInstances: number;
  enabled: boolean;
  priority: number;
  capabilities: string[];
}

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
  priority: number;
  timeout?: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  created: Date;
  started?: Date;
  completed?: Date;
  workerId?: string;
  estimatedDuration?: number;
}

export interface WorkerInstance {
  id: string;
  type: string;
  worker: Worker;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  currentTask?: string;
  created: Date;
  lastUsed: Date;
  tasksCompleted: number;
  totalProcessingTime: number;
  averageTaskTime: number;
  errorCount: number;
}

export interface WorkerMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  activeWorkers: number;
  idleWorkers: number;
  queueLength: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface WorkerProfile {
  taskType: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  memoryPeak: number;
  samples: number;
}

export interface WorkerLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
  workerId?: string;
  taskId?: string;
}

export interface WebWorkersState {
  isSupported: boolean;
  isInitialized: boolean;
  workers: WorkerInstance[];
  taskQueue: WorkerTask[];
  activeTasks: WorkerTask[];
  completedTasks: WorkerTask[];
  failedTasks: WorkerTask[];
}

// Default configuration
const defaultConfig: WebWorkerConfig = {
  enabled: true,
  maxWorkers: navigator.hardwareConcurrency || 4,
  workerTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true,
  enableMetrics: true,
  enableProfiling: true,
  workerTypes: [
    {
      id: 'video-processor',
      name: 'Video Processor',
      script: '/workers/video-processor.js',
      maxInstances: 2,
      enabled: true,
      priority: 1,
      capabilities: ['video-encoding', 'video-decoding', 'frame-extraction', 'thumbnail-generation']
    },
    {
      id: 'image-processor',
      name: 'Image Processor',
      script: '/workers/image-processor.js',
      maxInstances: 3,
      enabled: true,
      priority: 2,
      capabilities: ['image-resize', 'image-compress', 'format-conversion', 'filter-application']
    },
    {
      id: 'data-processor',
      name: 'Data Processor',
      script: '/workers/data-processor.js',
      maxInstances: 2,
      enabled: true,
      priority: 3,
      capabilities: ['data-analysis', 'csv-parsing', 'json-processing', 'calculation']
    },
    {
      id: 'ai-processor',
      name: 'AI Processor',
      script: '/workers/ai-processor.js',
      maxInstances: 1,
      enabled: true,
      priority: 1,
      capabilities: ['ml-inference', 'text-analysis', 'image-recognition', 'audio-processing']
    }
  ]
};

// Web Workers Engine
class WebWorkersEngine {
  private config: WebWorkerConfig;
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private completedTasks: WorkerTask[] = [];
  private failedTasks: WorkerTask[] = [];
  private metrics: WorkerMetrics;
  private profiles: Map<string, WorkerProfile> = new Map();
  private logs: WorkerLog[] = [];
  private isRunning = false;
  private taskIdCounter = 0;
  private workerIdCounter = 0;
  private metricsInterval?: NodeJS.Timeout;
  private queueProcessor?: NodeJS.Timeout;
  private onStateChange?: () => void;

  constructor(config: WebWorkerConfig) {
    this.config = { ...config };
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): WorkerMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      queueLength: 0,
      throughput: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Workers are not supported in this environment');
    }

    this.log('info', 'engine', 'Initializing Web Workers engine');

    // Create initial worker pool
    await this.createWorkerPool();

    // Start queue processor
    this.startQueueProcessor();

    // Start metrics collection
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    this.isRunning = true;
    this.log('info', 'engine', 'Web Workers engine initialized successfully');
  }

  private async createWorkerPool(): Promise<void> {
    for (const workerType of this.config.workerTypes) {
      if (!workerType.enabled) continue;

      for (let i = 0; i < workerType.maxInstances; i++) {
        try {
          await this.createWorker(workerType);
        } catch (error) {
          this.log('error', 'engine', `Failed to create worker of type ${workerType.id}`, error);
        }
      }
    }
  }

  private async createWorker(workerType: WorkerTypeConfig): Promise<WorkerInstance> {
    const workerId = `${workerType.id}-${++this.workerIdCounter}`;
    
    try {
      const worker = new Worker(workerType.script);
      
      const workerInstance: WorkerInstance = {
        id: workerId,
        type: workerType.id,
        worker,
        status: 'idle',
        created: new Date(),
        lastUsed: new Date(),
        tasksCompleted: 0,
        totalProcessingTime: 0,
        averageTaskTime: 0,
        errorCount: 0
      };

      // Set up worker event handlers
      worker.onmessage = (event) => this.handleWorkerMessage(workerId, event);
      worker.onerror = (error) => this.handleWorkerError(workerId, error);
      worker.onmessageerror = (error) => this.handleWorkerError(workerId, error);

      this.workers.set(workerId, workerInstance);
      this.log('info', 'worker', `Worker ${workerId} created successfully`);
      
      return workerInstance;
    } catch (error) {
      this.log('error', 'worker', `Failed to create worker ${workerId}`, error);
      throw error;
    }
  }

  private handleWorkerMessage(workerId: string, event: MessageEvent): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    const { type, taskId, data, progress, error } = event.data;

    switch (type) {
      case 'task-progress':
        this.handleTaskProgress(taskId, progress);
        break;
      case 'task-completed':
        this.handleTaskCompleted(workerId, taskId, data);
        break;
      case 'task-failed':
        this.handleTaskFailed(workerId, taskId, error);
        break;
      case 'worker-ready':
        worker.status = 'idle';
        this.log('info', 'worker', `Worker ${workerId} is ready`);
        break;
      default:
        this.log('warn', 'worker', `Unknown message type from worker ${workerId}`, event.data);
    }

    this.updateMetrics();
    this.onStateChange?.();
  }

  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.status = 'error';
    worker.errorCount++;
    
    this.log('error', 'worker', `Worker ${workerId} encountered an error`, error);

    // If worker has a current task, mark it as failed
    if (worker.currentTask) {
      this.handleTaskFailed(workerId, worker.currentTask, error.message);
    }

    // Restart worker if error count is below threshold
    if (worker.errorCount < this.config.retryAttempts) {
      setTimeout(() => this.restartWorker(workerId), this.config.retryDelay);
    } else {
      this.terminateWorker(workerId);
    }
  }

  private handleTaskProgress(taskId: string, progress: number): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.progress = progress;
      this.log('debug', 'task', `Task ${taskId} progress: ${progress}%`);
    }
  }

  private handleTaskCompleted(workerId: string, taskId: string, result: any): void {
    const task = this.activeTasks.get(taskId);
    const worker = this.workers.get(workerId);
    
    if (!task || !worker) return;

    task.status = 'completed';
    task.result = result;
    task.completed = new Date();
    task.progress = 100;

    const processingTime = task.completed.getTime() - (task.started?.getTime() || task.created.getTime());
    
    // Update worker stats
    worker.status = 'idle';
    worker.currentTask = undefined;
    worker.lastUsed = new Date();
    worker.tasksCompleted++;
    worker.totalProcessingTime += processingTime;
    worker.averageTaskTime = worker.totalProcessingTime / worker.tasksCompleted;

    // Update profiling data
    if (this.config.enableProfiling) {
      this.updateProfile(task.type, processingTime, true);
    }

    // Move task to completed
    this.activeTasks.delete(taskId);
    this.completedTasks.push(task);

    this.log('info', 'task', `Task ${taskId} completed successfully in ${processingTime}ms`);
  }

  private handleTaskFailed(workerId: string, taskId: string, error: string): void {
    const task = this.activeTasks.get(taskId);
    const worker = this.workers.get(workerId);
    
    if (!task || !worker) return;

    task.error = error;
    task.completed = new Date();

    // Update worker stats
    worker.status = 'idle';
    worker.currentTask = undefined;
    worker.lastUsed = new Date();

    // Retry logic
    if (task.retries < task.maxRetries) {
      task.retries++;
      task.status = 'pending';
      this.taskQueue.unshift(task); // Add to front of queue for retry
      this.activeTasks.delete(taskId);
      this.log('warn', 'task', `Task ${taskId} failed, retrying (${task.retries}/${task.maxRetries})`);
    } else {
      task.status = 'failed';
      this.activeTasks.delete(taskId);
      this.failedTasks.push(task);
      
      // Update profiling data
      if (this.config.enableProfiling) {
        const processingTime = task.completed.getTime() - (task.started?.getTime() || task.created.getTime());
        this.updateProfile(task.type, processingTime, false);
      }
      
      this.log('error', 'task', `Task ${taskId} failed permanently: ${error}`);
    }
  }

  private updateProfile(taskType: string, processingTime: number, success: boolean): void {
    let profile = this.profiles.get(taskType);
    
    if (!profile) {
      profile = {
        taskType,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        successRate: 0,
        memoryPeak: 0,
        samples: 0
      };
      this.profiles.set(taskType, profile);
    }

    profile.samples++;
    profile.averageTime = (profile.averageTime * (profile.samples - 1) + processingTime) / profile.samples;
    profile.minTime = Math.min(profile.minTime, processingTime);
    profile.maxTime = Math.max(profile.maxTime, processingTime);
    
    if (success) {
      profile.successRate = (profile.successRate * (profile.samples - 1) + 1) / profile.samples;
    } else {
      profile.successRate = (profile.successRate * (profile.samples - 1)) / profile.samples;
    }
  }

  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(() => {
      this.processQueue();
    }, 100);
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Sort queue by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    // Find available workers
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');

    if (availableWorkers.length === 0) return;

    // Assign tasks to workers
    for (let i = 0; i < Math.min(this.taskQueue.length, availableWorkers.length); i++) {
      const task = this.taskQueue.shift()!;
      const worker = this.findBestWorker(task.type, availableWorkers);
      
      if (worker) {
        this.assignTaskToWorker(task, worker);
      } else {
        // No suitable worker found, put task back in queue
        this.taskQueue.unshift(task);
        break;
      }
    }
  }

  private findBestWorker(taskType: string, availableWorkers: WorkerInstance[]): WorkerInstance | null {
    // Find workers that can handle this task type
    const suitableWorkers = availableWorkers.filter(worker => {
      const workerType = this.config.workerTypes.find(type => type.id === worker.type);
      return workerType?.capabilities.some(cap => taskType.includes(cap));
    });

    if (suitableWorkers.length === 0) return null;

    // Select worker with best performance for this task type
    return suitableWorkers.reduce((best, current) => {
      if (current.averageTaskTime === 0) return current; // Prefer unused workers
      return current.averageTaskTime < best.averageTaskTime ? current : best;
    });
  }

  private assignTaskToWorker(task: WorkerTask, worker: WorkerInstance): void {
    worker.status = 'busy';
    worker.currentTask = task.id;
    task.status = 'running';
    task.started = new Date();
    task.workerId = worker.id;

    this.activeTasks.set(task.id, task);

    // Send task to worker
    worker.worker.postMessage({
      type: 'execute-task',
      taskId: task.id,
      taskType: task.type,
      data: task.data,
      timeout: task.timeout || this.config.workerTimeout
    });

    this.log('info', 'task', `Task ${task.id} assigned to worker ${worker.id}`);
  }

  private async restartWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    this.log('info', 'worker', `Restarting worker ${workerId}`);
    
    // Terminate old worker
    worker.worker.terminate();
    
    // Find worker type config
    const workerType = this.config.workerTypes.find(type => type.id === worker.type);
    if (!workerType) return;

    try {
      // Create new worker
      const newWorker = await this.createWorker(workerType);
      this.workers.set(workerId, newWorker);
    } catch (error) {
      this.log('error', 'worker', `Failed to restart worker ${workerId}`, error);
      this.workers.delete(workerId);
    }
  }

  private terminateWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    this.log('info', 'worker', `Terminating worker ${workerId}`);
    
    worker.worker.terminate();
    this.workers.delete(workerId);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  private updateMetrics(): void {
    const workers = Array.from(this.workers.values());
    
    this.metrics.activeWorkers = workers.filter(w => w.status === 'busy').length;
    this.metrics.idleWorkers = workers.filter(w => w.status === 'idle').length;
    this.metrics.queueLength = this.taskQueue.length;
    this.metrics.totalTasks = this.completedTasks.length + this.failedTasks.length + this.activeTasks.size;
    this.metrics.completedTasks = this.completedTasks.length;
    this.metrics.failedTasks = this.failedTasks.length;
    
    if (this.metrics.totalTasks > 0) {
      this.metrics.errorRate = this.metrics.failedTasks / this.metrics.totalTasks;
    }

    // Calculate average processing time
    const completedWithTimes = this.completedTasks.filter(task => task.started && task.completed);
    if (completedWithTimes.length > 0) {
      const totalTime = completedWithTimes.reduce((sum, task) => {
        return sum + (task.completed!.getTime() - task.started!.getTime());
      }, 0);
      this.metrics.averageProcessingTime = totalTime / completedWithTimes.length;
      this.metrics.totalProcessingTime = totalTime;
    }

    // Calculate throughput (tasks per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentTasks = this.completedTasks.filter(task => 
      task.completed && task.completed.getTime() > oneMinuteAgo
    );
    this.metrics.throughput = recentTasks.length;

    // Memory usage (approximate)
    if ('memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  }

  // Public methods
  addTask(type: string, data: any, options: Partial<WorkerTask> = {}): string {
    const taskId = `task-${++this.taskIdCounter}`;
    
    const task: WorkerTask = {
      id: taskId,
      type,
      data,
      priority: options.priority || 1,
      timeout: options.timeout,
      retries: 0,
      maxRetries: options.maxRetries || this.config.retryAttempts,
      status: 'pending',
      progress: 0,
      created: new Date(),
      estimatedDuration: options.estimatedDuration
    };

    this.taskQueue.push(task);
    this.log('info', 'task', `Task ${taskId} added to queue`);
    
    return taskId;
  }

  cancelTask(taskId: string): boolean {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.status = 'cancelled';
      this.log('info', 'task', `Task ${taskId} cancelled from queue`);
      return true;
    }

    // Check if task is active
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask && activeTask.workerId) {
      const worker = this.workers.get(activeTask.workerId);
      if (worker) {
        worker.worker.postMessage({ type: 'cancel-task', taskId });
        activeTask.status = 'cancelled';
        this.activeTasks.delete(taskId);
        worker.status = 'idle';
        worker.currentTask = undefined;
        this.log('info', 'task', `Task ${taskId} cancelled`);
        return true;
      }
    }

    return false;
  }

  getTask(taskId: string): WorkerTask | null {
    // Check active tasks
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) return activeTask;

    // Check queue
    const queuedTask = this.taskQueue.find(task => task.id === taskId);
    if (queuedTask) return queuedTask;

    // Check completed tasks
    const completedTask = this.completedTasks.find(task => task.id === taskId);
    if (completedTask) return completedTask;

    // Check failed tasks
    const failedTask = this.failedTasks.find(task => task.id === taskId);
    if (failedTask) return failedTask;

    return null;
  }

  getWorkerStats(): WorkerInstance[] {
    return Array.from(this.workers.values());
  }

  getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  getProfiles(): WorkerProfile[] {
    return Array.from(this.profiles.values());
  }

  getLogs(): WorkerLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  clearCompletedTasks(): void {
    this.completedTasks = [];
    this.updateMetrics();
  }

  clearFailedTasks(): void {
    this.failedTasks = [];
    this.updateMetrics();
  }

  updateConfig(newConfig: Partial<WebWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'engine', 'Configuration updated');
  }

  exportData(): string {
    return JSON.stringify({
      config: this.config,
      metrics: this.metrics,
      profiles: Array.from(this.profiles.entries()),
      logs: this.logs.slice(-1000) // Last 1000 logs
    }, null, 2);
  }

  importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.config) {
        this.updateConfig(parsed.config);
      }
      
      if (parsed.profiles) {
        this.profiles = new Map(parsed.profiles);
      }
      
      if (parsed.logs) {
        this.logs = parsed.logs;
      }
      
      this.log('info', 'engine', 'Data imported successfully');
    } catch (error) {
      this.log('error', 'engine', 'Failed to import data', error);
      throw error;
    }
  }

  isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  setStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback;
  }

  async destroy(): Promise<void> {
    this.log('info', 'engine', 'Destroying Web Workers engine');
    
    this.isRunning = false;
    
    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
    }
    
    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.worker.terminate();
    }
    
    this.workers.clear();
    this.taskQueue = [];
    this.activeTasks.clear();
    
    this.log('info', 'engine', 'Web Workers engine destroyed');
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', source: string, message: string, data?: any): void {
    if (!this.config.enableLogging) return;

    const log: WorkerLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      source,
      message,
      data
    };

    this.logs.push(log);
    
    // Keep only last 10000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }

    // Console logging
    if (level === 'error') {
      console.error(`[WebWorkers:${source}] ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[WebWorkers:${source}] ${message}`, data);
    } else if (level === 'debug') {
    } else {
    }
  }
}

// Hook
const useWebWorkers = (initialConfig?: Partial<WebWorkerConfig>) => {
  const [config, setConfig] = useState<WebWorkerConfig>(() => ({
    ...defaultConfig,
    ...initialConfig
  }));
  
  const [state, setState] = useState<WebWorkersState>({
    isSupported: typeof Worker !== 'undefined',
    isInitialized: false,
    workers: [],
    taskQueue: [],
    activeTasks: [],
    completedTasks: [],
    failedTasks: []
  });
  
  const [metrics, setMetrics] = useState<WorkerMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    queueLength: 0,
    throughput: 0,
    errorRate: 0,
    memoryUsage: 0,
    cpuUsage: 0
  });
  
  const [profiles, setProfiles] = useState<WorkerProfile[]>([]);
  const [logs, setLogs] = useState<WorkerLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const engineRef = useRef<WebWorkersEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    if (!config.enabled || !state.isSupported) return;

    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const engine = new WebWorkersEngine(config);
        
        engine.setStateChangeCallback(() => {
          setState({
            isSupported: engine.isSupported(),
            isInitialized: true,
            workers: engine.getWorkerStats(),
            taskQueue: [], // Queue is internal
            activeTasks: [], // Active tasks are internal
            completedTasks: [], // Completed tasks are internal
            failedTasks: [] // Failed tasks are internal
          });
          
          setMetrics(engine.getMetrics());
          setProfiles(engine.getProfiles());
          setLogs(engine.getLogs());
        });
        
        await engine.initialize();
        engineRef.current = engine;
        
        setState(prev => ({ ...prev, isInitialized: true }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Web Workers');
      } finally {
        setIsLoading(false);
      }
    };

    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [config.enabled, state.isSupported]);

  // Actions
  const actions = {
    addTask: useCallback((type: string, data: any, options?: Partial<WorkerTask>) => {
      if (!engineRef.current) return null;
      return engineRef.current.addTask(type, data, options);
    }, []),

    cancelTask: useCallback((taskId: string) => {
      if (!engineRef.current) return false;
      return engineRef.current.cancelTask(taskId);
    }, []),

    getTask: useCallback((taskId: string) => {
      if (!engineRef.current) return null;
      return engineRef.current.getTask(taskId);
    }, []),

    clearCompletedTasks: useCallback(() => {
      if (!engineRef.current) return;
      engineRef.current.clearCompletedTasks();
    }, []),

    clearFailedTasks: useCallback(() => {
      if (!engineRef.current) return;
      engineRef.current.clearFailedTasks();
    }, []),

    clearLogs: useCallback(() => {
      if (!engineRef.current) return;
      engineRef.current.clearLogs();
      setLogs([]);
    }, []),

    updateConfig: useCallback((newConfig: Partial<WebWorkerConfig>) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
      if (engineRef.current) {
        engineRef.current.updateConfig(newConfig);
      }
    }, []),

    exportData: useCallback(() => {
      if (!engineRef.current) return '';
      return engineRef.current.exportData();
    }, []),

    importData: useCallback((data: string) => {
      if (!engineRef.current) return;
      try {
        engineRef.current.importData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import data');
      }
    }, []),

    clearError: useCallback(() => {
      setError(null);
    }, [])
  };

  // Quick actions for common operations
  const quickActions = {
    createWorker: useCallback(async (workerData: any) => {
      // Implementation for creating worker
      return Promise.resolve();
    }, []),
    createTask: useCallback(async (taskData: any) => {
      if (!engineRef.current) return null;
      return engineRef.current.addTask(taskData.type, taskData.data, taskData);
    }, []),
    createPool: useCallback(async (poolData: any) => {
      // Implementation for creating pool
      return Promise.resolve();
    }, [])
  };

  // Debounced actions
  const debouncedActions = {
    setFilters: useCallback((filters: any) => {
      // Implementation for debounced filter setting
    }, [])
  };

  // Throttled actions
  const throttledActions = {
    updateWorkerStatus: useCallback((workerId: string, status: string) => {
      // Implementation for throttled status update
    }, [])
  };

  // Analytics data
  const analytics = {
    averageTaskDuration: metrics.averageProcessingTime,
    successRate: metrics.completedTasks / (metrics.totalTasks || 1),
    throughput: metrics.throughput
  };

  // Stats data
  const stats = {
    totalWorkers: state.workers.length,
    totalTasks: metrics.totalTasks,
    workersByType: {
      general: state.workers.filter(w => w.type === 'general').length,
      video: state.workers.filter(w => w.type === 'video').length,
      image: state.workers.filter(w => w.type === 'image').length,
      audio: state.workers.filter(w => w.type === 'audio').length,
      data: state.workers.filter(w => w.type === 'data').length
    },
    tasksByType: {
      general: 0,
      video: 0,
      image: 0,
      audio: 0,
      data: 0
    }
  };

  // Extended actions
  const extendedActions = {
    ...actions,
    setFilters: useCallback((filters: any) => {
      // Implementation for setting filters
    }, []),
    updateWorkerStatus: useCallback((workerId: string, status: string) => {
      // Implementation for updating worker status
    }, []),
    executeTask: useCallback(async (taskId: string) => {
      // Implementation for executing task
      return Promise.resolve();
    }, []),
    completeTask: useCallback(async (taskId: string, result: any) => {
      // Implementation for completing task
      return Promise.resolve();
    }, []),
    failTask: useCallback(async (taskId: string, error: string) => {
      // Implementation for failing task
      return Promise.resolve();
    }, []),
    resetConfig: useCallback(async () => {
      setConfig(defaultConfig);
      return Promise.resolve();
    }, [])
  };

  return {
    state,
    config,
    configs: config,
    metrics,
    profiles,
    logs,
    isLoading,
    error,
    actions: extendedActions,
    quickActions,
    debouncedActions,
    throttledActions,
    analytics,
    stats,
    tasks: [],
    workers: state.workers,
    getFilteredTasks: useCallback(() => [], []),
    getFilteredWorkers: useCallback(() => [], []),
    getRecommendedAction: useCallback(() => 'Sistema funcionando normalmente', [])
  };
};

// Utility functions
export const formatTaskDuration = (duration: number): string => {
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${(duration / 60000).toFixed(1)}m`;
};

export const getTaskColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'running': return 'text-blue-600';
    case 'failed': return 'text-red-600';
    case 'cancelled': return 'text-gray-600';
    default: return 'text-yellow-600';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatWorkerTime = (timestamp: Date | string | number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
  return `${Math.floor(diff / 86400000)}d atrás`;
};

export const getTaskComplexity = (task: any): string => {
  if (!task.data) return 'Baixa';
  const size = task.data.size || 0;
  if (size > 50 * 1024 * 1024) return 'Alta';
  if (size > 10 * 1024 * 1024) return 'Média';
  return 'Baixa';
};

export const getWorkerEfficiency = (worker: any): number => {
  if (!worker.tasksCompleted || !worker.totalProcessingTime) return 0;
  return Math.min(100, (worker.tasksCompleted / (worker.totalProcessingTime / 1000)) * 10);
};

export const getRecommendedAction = (stats: any): string => {
  if (!stats) return 'Sistema funcionando normalmente';
  if (stats.activeWorkers === 0) return 'Considere criar workers';
  if (stats.failedTasks > stats.completedTasks) return 'Verificar erros nas tarefas';
  return 'Sistema funcionando normalmente';
};

export const getWorkerStatus = (worker: any): string => {
  if (!worker) return 'unknown';
  return worker.status || 'idle';
};

// Additional types for component compatibility
export interface WebWorkerTask {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  data?: any;
  result?: any;
  error?: string;
  timestamp: Date;
  duration?: number;
  retryCount: number;
  maxRetries: number;
}

export interface WebWorkerInstance {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  tasksCompleted: number;
  tasksTotal: number;
  lastActivity: Date;
}

export interface WorkerPool {
  id: string;
  name: string;
  type: string;
  workers: WebWorkerInstance[];
  maxWorkers: number;
  status: 'active' | 'inactive';
}

export default useWebWorkers;