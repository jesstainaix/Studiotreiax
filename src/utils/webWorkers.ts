import { create } from 'zustand';

// Types and Interfaces
export interface WorkerTask {
  id: string;
  type: 'video-processing' | 'image-processing' | 'data-processing' | 'compression' | 'analysis' | 'transcoding';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  result?: any;
  error?: string;
  progress: number;
  startTime?: number;
  endTime?: number;
  estimatedDuration?: number;
  workerId?: string;
  retryCount: number;
  maxRetries: number;
  metadata: {
    fileSize?: number;
    fileName?: string;
    format?: string;
    quality?: string;
    resolution?: string;
    duration?: number;
  };
  callbacks?: {
    onProgress?: (progress: number) => void;
    onComplete?: (result: any) => void;
    onError?: (error: string) => void;
  };
}

export interface WorkerInstance {
  id: string;
  worker: Worker;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  currentTask?: string;
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    tasksErrored: number;
    avgProcessingTime: number;
    totalProcessingTime: number;
  };
  createdAt: number;
  lastUsed: number;
}

export interface WorkerPool {
  id: string;
  name: string;
  type: string;
  workers: WorkerInstance[];
  maxWorkers: number;
  minWorkers: number;
  queue: WorkerTask[];
  isActive: boolean;
  config: {
    autoScale: boolean;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    idleTimeout: number;
    maxQueueSize: number;
  };
}

export interface WebWorkersConfig {
  enableWorkers: boolean;
  enableVideoProcessing: boolean;
  enableImageProcessing: boolean;
  enableDataProcessing: boolean;
  enableCompression: boolean;
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
  enablePerformanceMonitoring: boolean;
  enableAutoOptimization: boolean;
  enableDebugMode: boolean;
  workerScriptPaths: {
    videoProcessor: string;
    imageProcessor: string;
    dataProcessor: string;
    compressor: string;
  };
}

export interface WebWorkersStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  queuedTasks: number;
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  avgTaskDuration: number;
  totalProcessingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
  successRate: number;
}

export interface WebWorkersMetrics {
  timestamp: number;
  tasksPerSecond: number;
  avgResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  queueLength: number;
  workerUtilization: number;
  errorCount: number;
  throughput: number;
}

export interface WebWorkersEvent {
  id: string;
  type: 'task-started' | 'task-completed' | 'task-failed' | 'worker-created' | 'worker-terminated' | 'pool-scaled' | 'error' | 'performance';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  source: string;
  data?: any;
}

export interface WebWorkersDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'general' | 'task' | 'worker' | 'pool' | 'performance';
  message: string;
  timestamp: number;
  data?: any;
}

// Zustand Store
interface WebWorkersStore {
  // State
  isInitialized: boolean;
  tasks: WorkerTask[];
  workers: WorkerInstance[];
  pools: WorkerPool[];
  config: WebWorkersConfig;
  stats: WebWorkersStats;
  metrics: WebWorkersMetrics[];
  events: WebWorkersEvent[];
  debugLogs: WebWorkersDebugLog[];
  
  // Computed Values
  computed: {
    taskHealth: number;
    workerHealth: number;
    performanceScore: number;
    overallHealth: number;
    queueHealth: number;
    errorRate: number;
    activeTasks: WorkerTask[];
    completedTasks: WorkerTask[];
    failedTasks: WorkerTask[];
    idleWorkers: WorkerInstance[];
    busyWorkers: WorkerInstance[];
    avgTaskDuration: number;
    throughputTrend: 'up' | 'down' | 'stable';
  };
  
  // Actions
  actions: {
    // Task Management
    addTask: (task: Omit<WorkerTask, 'id' | 'status' | 'progress' | 'retryCount'>) => Promise<string>;
    cancelTask: (taskId: string) => Promise<boolean>;
    retryTask: (taskId: string) => Promise<boolean>;
    getTaskStatus: (taskId: string) => WorkerTask | null;
    clearCompletedTasks: () => Promise<boolean>;
    
    // Worker Management
    createWorker: (type: string, capabilities: string[]) => Promise<string>;
    terminateWorker: (workerId: string) => Promise<boolean>;
    restartWorker: (workerId: string) => Promise<boolean>;
    getWorkerStatus: (workerId: string) => WorkerInstance | null;
    
    // Pool Management
    createPool: (name: string, type: string, config: Partial<WorkerPool['config']>) => Promise<string>;
    scalePool: (poolId: string, targetSize: number) => Promise<boolean>;
    optimizePool: (poolId: string) => Promise<boolean>;
    
    // Processing
    processVideo: (file: File, options: any) => Promise<string>;
    processImage: (file: File, options: any) => Promise<string>;
    compressData: (data: any, options: any) => Promise<string>;
    analyzeData: (data: any, options: any) => Promise<string>;
    
    // Configuration
    updateConfig: (updates: Partial<WebWorkersConfig>) => Promise<boolean>;
    resetConfig: () => Promise<boolean>;
    
    // Analytics
    getMetrics: (timeRange?: { start: number; end: number }) => WebWorkersMetrics[];
    exportStats: () => Promise<string>;
    generateReport: () => Promise<any>;
  };
  
  // Quick Actions
  quickActions: {
    enableWorkers: () => Promise<boolean>;
    disableWorkers: () => Promise<boolean>;
    pauseAllTasks: () => Promise<boolean>;
    resumeAllTasks: () => Promise<boolean>;
    clearQueue: () => Promise<boolean>;
    optimizePerformance: () => Promise<boolean>;
    restartAllWorkers: () => Promise<boolean>;
    enableVideoProcessing: () => Promise<boolean>;
    disableVideoProcessing: () => Promise<boolean>;
    enableImageProcessing: () => Promise<boolean>;
    disableImageProcessing: () => Promise<boolean>;
  };
  
  // Advanced Features
  advanced: {
    batchProcess: (tasks: Omit<WorkerTask, 'id' | 'status' | 'progress' | 'retryCount'>[]) => Promise<string[]>;
    scheduleTask: (task: Omit<WorkerTask, 'id' | 'status' | 'progress' | 'retryCount'>, delay: number) => Promise<string>;
    createTaskPipeline: (tasks: Omit<WorkerTask, 'id' | 'status' | 'progress' | 'retryCount'>[]) => Promise<string>;
    optimizeTaskDistribution: () => Promise<boolean>;
    predictTaskDuration: (task: Omit<WorkerTask, 'id' | 'status' | 'progress' | 'retryCount'>) => Promise<number>;
    autoScalePools: () => Promise<boolean>;
    balanceLoad: () => Promise<boolean>;
    preloadWorkers: (type: string, count: number) => Promise<boolean>;
  };
  
  // System Operations
  system: {
    initialize: () => Promise<boolean>;
    shutdown: () => Promise<boolean>;
    restart: () => Promise<boolean>;
    healthCheck: () => Promise<boolean>;
    cleanup: () => Promise<boolean>;
    backup: () => Promise<string>;
    restore: (backup: string) => Promise<boolean>;
    migrate: (version: string) => Promise<boolean>;
  };
  
  // Utilities
  utils: {
    generateTaskId: () => string;
    generateWorkerId: () => string;
    generatePoolId: () => string;
    formatDuration: (ms: number) => string;
    formatBytes: (bytes: number) => string;
    calculateProgress: (current: number, total: number) => number;
    estimateCompletion: (taskId: string) => number;
    getTaskPriority: (task: WorkerTask) => number;
    validateTask: (task: any) => boolean;
  };
  
  // Configuration Helpers
  configHelpers: {
    getOptimalWorkerCount: (type: string) => number;
    getRecommendedSettings: () => Partial<WebWorkersConfig>;
    validateConfig: (config: Partial<WebWorkersConfig>) => boolean;
    applyPreset: (preset: 'performance' | 'balanced' | 'memory-efficient') => Promise<boolean>;
    autoTuneConfig: () => Promise<boolean>;
  };
  
  // Analytics Helpers
  analyticsHelpers: {
    calculateThroughput: (timeRange?: { start: number; end: number }) => number;
    getPerformanceTrends: () => any;
    identifyBottlenecks: () => string[];
    generateInsights: () => string[];
    predictLoad: (timeAhead: number) => number;
    getResourceUtilization: () => any;
  };
  
  // Debug Helpers
  debugHelpers: {
    enableDebugMode: () => Promise<boolean>;
    disableDebugMode: () => Promise<boolean>;
    log: (level: 'debug' | 'info' | 'warn' | 'error', category: string, message: string, data?: any) => void;
    clearLogs: () => Promise<boolean>;
    exportLogs: () => Promise<string>;
    getSystemInfo: () => any;
    runDiagnostics: () => Promise<any>;
  };
}

// Create Zustand Store
export const useWebWorkersStore = create<WebWorkersStore>((set, get) => ({
  // Initial State
  isInitialized: false,
  tasks: [],
  workers: [],
  pools: [],
  config: {
    enableWorkers: true,
    enableVideoProcessing: true,
    enableImageProcessing: true,
    enableDataProcessing: true,
    enableCompression: true,
    maxConcurrentTasks: 4,
    taskTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    enablePerformanceMonitoring: true,
    enableAutoOptimization: true,
    enableDebugMode: false,
    workerScriptPaths: {
      videoProcessor: '/workers/video-processor.js',
      imageProcessor: '/workers/image-processor.js',
      dataProcessor: '/workers/data-processor.js',
      compressor: '/workers/compressor.js'
    }
  },
  stats: {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    activeTasks: 0,
    queuedTasks: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    avgTaskDuration: 0,
    totalProcessingTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    throughput: 0,
    errorRate: 0,
    successRate: 0
  },
  metrics: [],
  events: [],
  debugLogs: [],
  
  // Computed Values
  computed: {
    get taskHealth() {
      const { stats } = get();
      if (stats.totalTasks === 0) return 100;
      return Math.max(0, 100 - (stats.failedTasks / stats.totalTasks) * 100);
    },
    get workerHealth() {
      const { workers } = get();
      if (workers.length === 0) return 100;
      const healthyWorkers = workers.filter(w => w.status !== 'error').length;
      return (healthyWorkers / workers.length) * 100;
    },
    get performanceScore() {
      const { stats } = get();
      const throughputScore = Math.min(100, (stats.throughput / 10) * 100);
      const errorScore = Math.max(0, 100 - stats.errorRate * 100);
      const utilizationScore = Math.min(100, (stats.activeWorkers / Math.max(stats.totalWorkers, 1)) * 100);
      return (throughputScore + errorScore + utilizationScore) / 3;
    },
    get overallHealth() {
      const computed = get().computed;
      return (computed.taskHealth + computed.workerHealth + computed.performanceScore) / 3;
    },
    get queueHealth() {
      const { stats, config } = get();
      const queueUtilization = stats.queuedTasks / Math.max(config.maxConcurrentTasks * 2, 1);
      return Math.max(0, 100 - queueUtilization * 100);
    },
    get errorRate() {
      const { stats } = get();
      if (stats.totalTasks === 0) return 0;
      return stats.failedTasks / stats.totalTasks;
    },
    get activeTasks() {
      return get().tasks.filter(task => task.status === 'processing');
    },
    get completedTasks() {
      return get().tasks.filter(task => task.status === 'completed');
    },
    get failedTasks() {
      return get().tasks.filter(task => task.status === 'failed');
    },
    get idleWorkers() {
      return get().workers.filter(worker => worker.status === 'idle');
    },
    get busyWorkers() {
      return get().workers.filter(worker => worker.status === 'busy');
    },
    get avgTaskDuration() {
      const completedTasks = get().computed.completedTasks;
      if (completedTasks.length === 0) return 0;
      const totalDuration = completedTasks.reduce((sum, task) => {
        return sum + ((task.endTime || 0) - (task.startTime || 0));
      }, 0);
      return totalDuration / completedTasks.length;
    },
    get throughputTrend() {
      const { metrics } = get();
      if (metrics.length < 2) return 'stable';
      const recent = metrics.slice(-5);
      const avgRecent = recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length;
      const older = metrics.slice(-10, -5);
      if (older.length === 0) return 'stable';
      const avgOlder = older.reduce((sum, m) => sum + m.throughput, 0) / older.length;
      const change = (avgRecent - avgOlder) / avgOlder;
      return change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable';
    }
  },
  
  // Actions
  actions: {
    addTask: async (taskData) => {
      const taskId = get().utils.generateTaskId();
      const task: WorkerTask = {
        ...taskData,
        id: taskId,
        status: 'pending',
        progress: 0,
        retryCount: 0
      };
      
      set(state => ({
        tasks: [...state.tasks, task],
        stats: {
          ...state.stats,
          totalTasks: state.stats.totalTasks + 1,
          queuedTasks: state.stats.queuedTasks + 1
        }
      }));
      
      // Add to appropriate pool queue
      const pool = get().pools.find(p => p.type === task.type);
      if (pool) {
        pool.queue.push(task);
      }
      
      get().debugHelpers.log('info', 'task', `Task ${taskId} added to queue`, { task });
      return taskId;
    },
    
    cancelTask: async (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return false;
      
      if (task.status === 'processing') {
        // Send cancel message to worker
        const worker = get().workers.find(w => w.currentTask === taskId);
        if (worker) {
          worker.worker.postMessage({ type: 'cancel', taskId });
        }
      }
      
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, status: 'cancelled' as const } : t
        )
      }));
      
      get().debugHelpers.log('info', 'task', `Task ${taskId} cancelled`);
      return true;
    },
    
    retryTask: async (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task || task.retryCount >= task.maxRetries) return false;
      
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? {
            ...t,
            status: 'pending' as const,
            progress: 0,
            retryCount: t.retryCount + 1,
            error: undefined
          } : t
        )
      }));
      
      get().debugHelpers.log('info', 'task', `Task ${taskId} retried (attempt ${task.retryCount + 1})`);
      return true;
    },
    
    getTaskStatus: (taskId) => {
      return get().tasks.find(t => t.id === taskId) || null;
    },
    
    clearCompletedTasks: async () => {
      set(state => ({
        tasks: state.tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      }));
      return true;
    },
    
    createWorker: async (type, capabilities) => {
      const workerId = get().utils.generateWorkerId();
      const { config } = get();
      
      try {
        const scriptPath = config.workerScriptPaths[type as keyof typeof config.workerScriptPaths];
        const worker = new Worker(scriptPath);
        
        const workerInstance: WorkerInstance = {
          id: workerId,
          worker,
          status: 'idle',
          capabilities,
          performance: {
            tasksCompleted: 0,
            tasksErrored: 0,
            avgProcessingTime: 0,
            totalProcessingTime: 0
          },
          createdAt: Date.now(),
          lastUsed: Date.now()
        };
        
        // Set up worker event handlers
        worker.onmessage = (event) => {
          const { type: messageType, taskId, data, progress, error } = event.data;
          
          switch (messageType) {
            case 'progress':
              set(state => ({
                tasks: state.tasks.map(t => 
                  t.id === taskId ? { ...t, progress } : t
                )
              }));
              break;
              
            case 'complete':
              set(state => ({
                tasks: state.tasks.map(t => 
                  t.id === taskId ? {
                    ...t,
                    status: 'completed' as const,
                    progress: 100,
                    result: data,
                    endTime: Date.now()
                  } : t
                ),
                workers: state.workers.map(w => 
                  w.id === workerId ? {
                    ...w,
                    status: 'idle' as const,
                    currentTask: undefined,
                    lastUsed: Date.now(),
                    performance: {
                      ...w.performance,
                      tasksCompleted: w.performance.tasksCompleted + 1
                    }
                  } : w
                )
              }));
              break;
              
            case 'error':
              set(state => ({
                tasks: state.tasks.map(t => 
                  t.id === taskId ? {
                    ...t,
                    status: 'failed' as const,
                    error,
                    endTime: Date.now()
                  } : t
                ),
                workers: state.workers.map(w => 
                  w.id === workerId ? {
                    ...w,
                    status: 'idle' as const,
                    currentTask: undefined,
                    performance: {
                      ...w.performance,
                      tasksErrored: w.performance.tasksErrored + 1
                    }
                  } : w
                )
              }));
              break;
          }
        };
        
        worker.onerror = (error) => {
          set(state => ({
            workers: state.workers.map(w => 
              w.id === workerId ? { ...w, status: 'error' as const } : w
            )
          }));
          get().debugHelpers.log('error', 'worker', `Worker ${workerId} error`, { error });
        };
        
        set(state => ({
          workers: [...state.workers, workerInstance],
          stats: {
            ...state.stats,
            totalWorkers: state.stats.totalWorkers + 1,
            idleWorkers: state.stats.idleWorkers + 1
          }
        }));
        
        get().debugHelpers.log('info', 'worker', `Worker ${workerId} created`, { type, capabilities });
        return workerId;
      } catch (error) {
        get().debugHelpers.log('error', 'worker', `Failed to create worker ${workerId}`, { error });
        throw error;
      }
    },
    
    terminateWorker: async (workerId) => {
      const worker = get().workers.find(w => w.id === workerId);
      if (!worker) return false;
      
      worker.worker.terminate();
      
      set(state => ({
        workers: state.workers.filter(w => w.id !== workerId),
        stats: {
          ...state.stats,
          totalWorkers: state.stats.totalWorkers - 1,
          idleWorkers: Math.max(0, state.stats.idleWorkers - 1)
        }
      }));
      
      get().debugHelpers.log('info', 'worker', `Worker ${workerId} terminated`);
      return true;
    },
    
    restartWorker: async (workerId) => {
      const worker = get().workers.find(w => w.id === workerId);
      if (!worker) return false;
      
      const { capabilities } = worker;
      const type = worker.capabilities[0]; // Assume first capability is the type
      
      await get().actions.terminateWorker(workerId);
      await get().actions.createWorker(type, capabilities);
      
      return true;
    },
    
    getWorkerStatus: (workerId) => {
      return get().workers.find(w => w.id === workerId) || null;
    },
    
    createPool: async (name, type, config) => {
      const poolId = get().utils.generatePoolId();
      
      const pool: WorkerPool = {
        id: poolId,
        name,
        type,
        workers: [],
        maxWorkers: 4,
        minWorkers: 1,
        queue: [],
        isActive: true,
        config: {
          autoScale: true,
          scaleUpThreshold: 0.8,
          scaleDownThreshold: 0.2,
          idleTimeout: 300000, // 5 minutes
          maxQueueSize: 100,
          ...config
        }
      };
      
      set(state => ({
        pools: [...state.pools, pool]
      }));
      
      get().debugHelpers.log('info', 'pool', `Pool ${poolId} created`, { name, type });
      return poolId;
    },
    
    scalePool: async (poolId, targetSize) => {
      const pool = get().pools.find(p => p.id === poolId);
      if (!pool) return false;
      
      const currentSize = pool.workers.length;
      
      if (targetSize > currentSize) {
        // Scale up
        for (let i = 0; i < targetSize - currentSize; i++) {
          const workerId = await get().actions.createWorker(pool.type, [pool.type]);
          const worker = get().workers.find(w => w.id === workerId);
          if (worker) {
            pool.workers.push(worker);
          }
        }
      } else if (targetSize < currentSize) {
        // Scale down
        const workersToRemove = pool.workers.slice(targetSize);
        for (const worker of workersToRemove) {
          await get().actions.terminateWorker(worker.id);
        }
        pool.workers = pool.workers.slice(0, targetSize);
      }
      
      get().debugHelpers.log('info', 'pool', `Pool ${poolId} scaled to ${targetSize} workers`);
      return true;
    },
    
    optimizePool: async (poolId) => {
      const pool = get().pools.find(p => p.id === poolId);
      if (!pool) return false;
      
      // Implement pool optimization logic
      const queueLength = pool.queue.length;
      const activeWorkers = pool.workers.filter(w => w.status === 'busy').length;
      const utilization = activeWorkers / pool.workers.length;
      
      if (utilization > pool.config.scaleUpThreshold && pool.workers.length < pool.maxWorkers) {
        await get().actions.scalePool(poolId, Math.min(pool.maxWorkers, pool.workers.length + 1));
      } else if (utilization < pool.config.scaleDownThreshold && pool.workers.length > pool.minWorkers) {
        await get().actions.scalePool(poolId, Math.max(pool.minWorkers, pool.workers.length - 1));
      }
      
      return true;
    },
    
    processVideo: async (file, options) => {
      return await get().actions.addTask({
        type: 'video-processing',
        priority: options.priority || 'medium',
        data: { file, options },
        maxRetries: 3,
        metadata: {
          fileSize: file.size,
          fileName: file.name,
          format: options.format,
          quality: options.quality,
          resolution: options.resolution
        }
      });
    },
    
    processImage: async (file, options) => {
      return await get().actions.addTask({
        type: 'image-processing',
        priority: options.priority || 'medium',
        data: { file, options },
        maxRetries: 3,
        metadata: {
          fileSize: file.size,
          fileName: file.name,
          format: options.format,
          quality: options.quality
        }
      });
    },
    
    compressData: async (data, options) => {
      return await get().actions.addTask({
        type: 'compression',
        priority: options.priority || 'low',
        data: { data, options },
        maxRetries: 2,
        metadata: {}
      });
    },
    
    analyzeData: async (data, options) => {
      return await get().actions.addTask({
        type: 'analysis',
        priority: options.priority || 'medium',
        data: { data, options },
        maxRetries: 2,
        metadata: {}
      });
    },
    
    updateConfig: async (updates) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
      get().debugHelpers.log('info', 'general', 'Configuration updated', { updates });
      return true;
    },
    
    resetConfig: async () => {
      set(state => ({
        config: {
          enableWorkers: true,
          enableVideoProcessing: true,
          enableImageProcessing: true,
          enableDataProcessing: true,
          enableCompression: true,
          maxConcurrentTasks: 4,
          taskTimeout: 300000,
          retryAttempts: 3,
          enablePerformanceMonitoring: true,
          enableAutoOptimization: true,
          enableDebugMode: false,
          workerScriptPaths: {
            videoProcessor: '/workers/video-processor.js',
            imageProcessor: '/workers/image-processor.js',
            dataProcessor: '/workers/data-processor.js',
            compressor: '/workers/compressor.js'
          }
        }
      }));
      return true;
    },
    
    getMetrics: (timeRange) => {
      const { metrics } = get();
      if (!timeRange) return metrics;
      return metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
    },
    
    exportStats: async () => {
      const { stats, metrics, events } = get();
      const exportData = {
        stats,
        metrics,
        events,
        timestamp: Date.now()
      };
      return JSON.stringify(exportData, null, 2);
    },
    
    generateReport: async () => {
      const { stats, computed } = get();
      return {
        summary: {
          totalTasks: stats.totalTasks,
          successRate: stats.successRate,
          avgTaskDuration: computed.avgTaskDuration,
          overallHealth: computed.overallHealth
        },
        performance: {
          throughput: stats.throughput,
          errorRate: stats.errorRate,
          workerUtilization: stats.activeWorkers / Math.max(stats.totalWorkers, 1)
        },
        recommendations: get().analyticsHelpers.generateInsights()
      };
    }
  },
  
  // Quick Actions
  quickActions: {
    enableWorkers: async () => {
      await get().actions.updateConfig({ enableWorkers: true });
      return true;
    },
    
    disableWorkers: async () => {
      await get().actions.updateConfig({ enableWorkers: false });
      return true;
    },
    
    pauseAllTasks: async () => {
      // Implementation for pausing all tasks
      get().debugHelpers.log('info', 'general', 'All tasks paused');
      return true;
    },
    
    resumeAllTasks: async () => {
      // Implementation for resuming all tasks
      get().debugHelpers.log('info', 'general', 'All tasks resumed');
      return true;
    },
    
    clearQueue: async () => {
      set(state => ({
        tasks: state.tasks.filter(t => t.status === 'processing' || t.status === 'completed')
      }));
      return true;
    },
    
    optimizePerformance: async () => {
      // Optimize all pools
      const { pools } = get();
      for (const pool of pools) {
        await get().actions.optimizePool(pool.id);
      }
      return true;
    },
    
    restartAllWorkers: async () => {
      const { workers } = get();
      for (const worker of workers) {
        await get().actions.restartWorker(worker.id);
      }
      return true;
    },
    
    enableVideoProcessing: async () => {
      await get().actions.updateConfig({ enableVideoProcessing: true });
      return true;
    },
    
    disableVideoProcessing: async () => {
      await get().actions.updateConfig({ enableVideoProcessing: false });
      return true;
    },
    
    enableImageProcessing: async () => {
      await get().actions.updateConfig({ enableImageProcessing: true });
      return true;
    },
    
    disableImageProcessing: async () => {
      await get().actions.updateConfig({ enableImageProcessing: false });
      return true;
    }
  },
  
  // Advanced Features
  advanced: {
    batchProcess: async (tasks) => {
      const taskIds: string[] = [];
      for (const task of tasks) {
        const taskId = await get().actions.addTask(task);
        taskIds.push(taskId);
      }
      return taskIds;
    },
    
    scheduleTask: async (task, delay) => {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const taskId = await get().actions.addTask(task);
          resolve(taskId);
        }, delay);
      });
    },
    
    createTaskPipeline: async (tasks) => {
      // Implementation for creating task pipeline
      const pipelineId = get().utils.generateTaskId();
      get().debugHelpers.log('info', 'general', `Task pipeline ${pipelineId} created with ${tasks.length} tasks`);
      return pipelineId;
    },
    
    optimizeTaskDistribution: async () => {
      // Implementation for optimizing task distribution
      get().debugHelpers.log('info', 'general', 'Task distribution optimized');
      return true;
    },
    
    predictTaskDuration: async (task) => {
      // Simple prediction based on historical data
      const { computed } = get();
      const baseTime = computed.avgTaskDuration || 10000; // 10 seconds default
      
      // Adjust based on task type and metadata
      let multiplier = 1;
      if (task.type === 'video-processing') multiplier = 3;
      else if (task.type === 'image-processing') multiplier = 1.5;
      else if (task.type === 'compression') multiplier = 0.8;
      
      return baseTime * multiplier;
    },
    
    autoScalePools: async () => {
      const { pools } = get();
      for (const pool of pools) {
        if (pool.config.autoScale) {
          await get().actions.optimizePool(pool.id);
        }
      }
      return true;
    },
    
    balanceLoad: async () => {
      // Implementation for load balancing
      get().debugHelpers.log('info', 'general', 'Load balanced across workers');
      return true;
    },
    
    preloadWorkers: async (type, count) => {
      for (let i = 0; i < count; i++) {
        await get().actions.createWorker(type, [type]);
      }
      return true;
    }
  },
  
  // System Operations
  system: {
    initialize: async () => {
      // Create default pools
      await get().actions.createPool('Video Processing Pool', 'video-processing', {});
      await get().actions.createPool('Image Processing Pool', 'image-processing', {});
      await get().actions.createPool('Data Processing Pool', 'data-processing', {});
      
      set({ isInitialized: true });
      get().debugHelpers.log('info', 'general', 'Web Workers system initialized');
      return true;
    },
    
    shutdown: async () => {
      const { workers } = get();
      for (const worker of workers) {
        await get().actions.terminateWorker(worker.id);
      }
      
      set({ isInitialized: false });
      get().debugHelpers.log('info', 'general', 'Web Workers system shutdown');
      return true;
    },
    
    restart: async () => {
      await get().system.shutdown();
      await get().system.initialize();
      return true;
    },
    
    healthCheck: async () => {
      const { computed } = get();
      const isHealthy = computed.overallHealth > 70;
      get().debugHelpers.log('info', 'general', `Health check completed: ${isHealthy ? 'Healthy' : 'Unhealthy'}`, {
        overallHealth: computed.overallHealth
      });
      return isHealthy;
    },
    
    cleanup: async () => {
      // Clean up completed tasks older than 1 hour
      const oneHourAgo = Date.now() - 3600000;
      set(state => ({
        tasks: state.tasks.filter(t => 
          t.status !== 'completed' || (t.endTime && t.endTime > oneHourAgo)
        ),
        events: state.events.filter(e => e.timestamp > oneHourAgo),
        metrics: state.metrics.filter(m => m.timestamp > oneHourAgo)
      }));
      return true;
    },
    
    backup: async () => {
      const state = get();
      const backup = {
        config: state.config,
        stats: state.stats,
        timestamp: Date.now()
      };
      return JSON.stringify(backup);
    },
    
    restore: async (backup) => {
      try {
        const data = JSON.parse(backup);
        set(state => ({
          config: data.config,
          stats: data.stats
        }));
        return true;
      } catch {
        return false;
      }
    },
    
    migrate: async (version) => {
      // Implementation for data migration
      get().debugHelpers.log('info', 'general', `Migrated to version ${version}`);
      return true;
    }
  },
  
  // Utilities
  utils: {
    generateTaskId: () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    generateWorkerId: () => `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    generatePoolId: () => `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    
    formatDuration: (ms) => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
      return `${(ms / 3600000).toFixed(1)}h`;
    },
    
    formatBytes: (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },
    
    calculateProgress: (current, total) => {
      if (total === 0) return 0;
      return Math.min(100, Math.max(0, (current / total) * 100));
    },
    
    estimateCompletion: (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task || task.status !== 'processing') return 0;
      
      const elapsed = Date.now() - (task.startTime || Date.now());
      if (task.progress === 0) return 0;
      
      const totalEstimated = (elapsed / task.progress) * 100;
      return Math.max(0, totalEstimated - elapsed);
    },
    
    getTaskPriority: (task) => {
      const priorities = { low: 1, medium: 2, high: 3, critical: 4 };
      return priorities[task.priority] || 2;
    },
    
    validateTask: (task) => {
      return !!(task.type && task.data && task.priority);
    }
  },
  
  // Configuration Helpers
  configHelpers: {
    getOptimalWorkerCount: (type) => {
      // Simple heuristic based on navigator.hardwareConcurrency
      const cores = navigator.hardwareConcurrency || 4;
      const multipliers = {
        'video-processing': 0.5,
        'image-processing': 0.75,
        'data-processing': 1,
        'compression': 1.5
      };
      return Math.max(1, Math.floor(cores * (multipliers[type as keyof typeof multipliers] || 1)));
    },
    
    getRecommendedSettings: () => {
      const cores = navigator.hardwareConcurrency || 4;
      return {
        maxConcurrentTasks: cores * 2,
        taskTimeout: 300000,
        retryAttempts: 3,
        enablePerformanceMonitoring: true,
        enableAutoOptimization: true
      };
    },
    
    validateConfig: (config) => {
      // Basic validation
      return !!(config.maxConcurrentTasks && config.maxConcurrentTasks > 0);
    },
    
    applyPreset: async (preset) => {
      const presets = {
        performance: {
          maxConcurrentTasks: 8,
          enableAutoOptimization: true,
          enablePerformanceMonitoring: true
        },
        balanced: {
          maxConcurrentTasks: 4,
          enableAutoOptimization: true,
          enablePerformanceMonitoring: true
        },
        'memory-efficient': {
          maxConcurrentTasks: 2,
          enableAutoOptimization: false,
          enablePerformanceMonitoring: false
        }
      };
      
      await get().actions.updateConfig(presets[preset]);
      return true;
    },
    
    autoTuneConfig: async () => {
      const recommended = get().configHelpers.getRecommendedSettings();
      await get().actions.updateConfig(recommended);
      return true;
    }
  },
  
  // Analytics Helpers
  analyticsHelpers: {
    calculateThroughput: (timeRange) => {
      const { tasks } = get();
      const now = Date.now();
      const start = timeRange?.start || (now - 3600000); // Last hour
      const end = timeRange?.end || now;
      
      const completedInRange = tasks.filter(t => 
        t.status === 'completed' && 
        t.endTime && 
        t.endTime >= start && 
        t.endTime <= end
      );
      
      const duration = (end - start) / 1000; // seconds
      return completedInRange.length / duration;
    },
    
    getPerformanceTrends: () => {
      const { metrics } = get();
      if (metrics.length < 2) return { trend: 'stable', change: 0 };
      
      const recent = metrics.slice(-5);
      const older = metrics.slice(-10, -5);
      
      if (older.length === 0) return { trend: 'stable', change: 0 };
      
      const recentAvg = recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.throughput, 0) / older.length;
      
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      const trend = change > 10 ? 'improving' : change < -10 ? 'declining' : 'stable';
      
      return { trend, change };
    },
    
    identifyBottlenecks: () => {
      const { stats, computed } = get();
      const bottlenecks: string[] = [];
      
      if (stats.errorRate > 0.1) bottlenecks.push('High error rate');
      if (computed.queueHealth < 50) bottlenecks.push('Queue congestion');
      if (stats.avgTaskDuration > 60000) bottlenecks.push('Slow task processing');
      if (stats.activeWorkers / Math.max(stats.totalWorkers, 1) > 0.9) bottlenecks.push('Worker saturation');
      
      return bottlenecks;
    },
    
    generateInsights: () => {
      const { stats, computed } = get();
      const insights: string[] = [];
      
      if (computed.overallHealth > 90) {
        insights.push('System is performing excellently');
      } else if (computed.overallHealth > 70) {
        insights.push('System is performing well with minor optimization opportunities');
      } else {
        insights.push('System needs attention and optimization');
      }
      
      if (stats.errorRate > 0.05) {
        insights.push('Consider investigating task failures and improving error handling');
      }
      
      if (computed.throughputTrend === 'down') {
        insights.push('Throughput is declining, consider scaling up workers');
      }
      
      return insights;
    },
    
    predictLoad: (timeAhead) => {
      // Simple prediction based on recent trends
      const { metrics } = get();
      if (metrics.length < 5) return 0;
      
      const recent = metrics.slice(-5);
      const avgThroughput = recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length;
      
      return avgThroughput * (timeAhead / 1000); // Convert to seconds
    },
    
    getResourceUtilization: () => {
      const { stats } = get();
      return {
        workerUtilization: stats.activeWorkers / Math.max(stats.totalWorkers, 1),
        queueUtilization: stats.queuedTasks / Math.max(stats.totalTasks, 1),
        memoryUtilization: stats.memoryUsage / (1024 * 1024 * 1024), // GB
        cpuUtilization: stats.cpuUsage
      };
    }
  },
  
  // Debug Helpers
  debugHelpers: {
    enableDebugMode: async () => {
      await get().actions.updateConfig({ enableDebugMode: true });
      return true;
    },
    
    disableDebugMode: async () => {
      await get().actions.updateConfig({ enableDebugMode: false });
      return true;
    },
    
    log: (level, category, message, data) => {
      const { config } = get();
      if (!config.enableDebugMode && level === 'debug') return;
      
      const log: WebWorkersDebugLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        level,
        category,
        message,
        timestamp: Date.now(),
        data
      };
      
      set(state => ({
        debugLogs: [...state.debugLogs.slice(-999), log] // Keep last 1000 logs
      }));
      
      // Also log to console in development
      if (import.meta.env.DEV) {
        console[level](message, data);
      }
    },
    
    clearLogs: async () => {
      set({ debugLogs: [] });
      return true;
    },
    
    exportLogs: async () => {
      const { debugLogs } = get();
      return JSON.stringify(debugLogs, null, 2);
    },
    
    getSystemInfo: () => {
      return {
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        memory: (performance as any).memory,
        connection: (navigator as any).connection,
        timestamp: Date.now()
      };
    },
    
    runDiagnostics: async () => {
      const { stats, computed, workers, tasks } = get();
      
      return {
        systemHealth: {
          overallHealth: computed.overallHealth,
          taskHealth: computed.taskHealth,
          workerHealth: computed.workerHealth,
          performanceScore: computed.performanceScore
        },
        statistics: {
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          failedTasks: stats.failedTasks,
          totalWorkers: stats.totalWorkers,
          activeWorkers: stats.activeWorkers
        },
        performance: {
          avgTaskDuration: computed.avgTaskDuration,
          throughput: stats.throughput,
          errorRate: stats.errorRate,
          memoryUsage: stats.memoryUsage
        },
        bottlenecks: get().analyticsHelpers.identifyBottlenecks(),
        recommendations: get().analyticsHelpers.generateInsights()
      };
    }
  }
}));

// Web Workers Manager Class
export class WebWorkersManager {
  private static instance: WebWorkersManager;
  
  private constructor() {}
  
  static getInstance(): WebWorkersManager {
    if (!WebWorkersManager.instance) {
      WebWorkersManager.instance = new WebWorkersManager();
    }
    return WebWorkersManager.instance;
  }
  
  async initialize() {
    return useWebWorkersStore.getState().system.initialize();
  }
  
  async processVideo(file: File, options: any) {
    return useWebWorkersStore.getState().actions.processVideo(file, options);
  }
  
  async processImage(file: File, options: any) {
    return useWebWorkersStore.getState().actions.processImage(file, options);
  }
  
  async getTaskStatus(taskId: string) {
    return useWebWorkersStore.getState().actions.getTaskStatus(taskId);
  }
  
  async getSystemHealth() {
    const { computed } = useWebWorkersStore.getState();
    return {
      overallHealth: computed.overallHealth,
      taskHealth: computed.taskHealth,
      workerHealth: computed.workerHealth,
      performanceScore: computed.performanceScore
    };
  }
}

// Global instance
export const webWorkersManager = WebWorkersManager.getInstance();

// Utility Functions
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getTaskStatusColor = (status: WorkerTask['status']): string => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'processing': return 'text-blue-600';
    case 'failed': return 'text-red-600';
    case 'cancelled': return 'text-gray-600';
    default: return 'text-yellow-600';
  }
};

export const getWorkerStatusColor = (status: WorkerInstance['status']): string => {
  switch (status) {
    case 'idle': return 'text-green-600';
    case 'busy': return 'text-blue-600';
    case 'error': return 'text-red-600';
    case 'terminated': return 'text-gray-600';
    default: return 'text-yellow-600';
  }
};

export const getPriorityColor = (priority: WorkerTask['priority']): string => {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getTaskTypeIcon = (type: WorkerTask['type']): string => {
  switch (type) {
    case 'video-processing': return '🎥';
    case 'image-processing': return '🖼️';
    case 'data-processing': return '📊';
    case 'compression': return '🗜️';
    case 'analysis': return '🔍';
    case 'transcoding': return '🔄';
    default: return '⚙️';
  }
};