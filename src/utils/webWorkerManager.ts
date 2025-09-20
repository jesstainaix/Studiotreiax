import { create } from 'zustand';

// Interfaces
export interface WebWorkerTask {
  id: string;
  type: 'video-processing' | 'image-processing' | 'data-processing' | 'computation';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  data: any;
  result?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  worker?: Worker;
  retries: number;
  maxRetries: number;
}

export interface WebWorkerPool {
  id: string;
  name: string;
  type: string;
  maxWorkers: number;
  activeWorkers: number;
  queueSize: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTime: number;
  enabled: boolean;
}

export interface WebWorkerStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
  successRate: number;
}

export interface WebWorkerConfig {
  maxConcurrentWorkers: number;
  taskTimeout: number;
  retryAttempts: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  autoCleanup: boolean;
  cleanupInterval: number;
  memoryThreshold: number;
  priorityQueuing: boolean;
  loadBalancing: boolean;
}

export interface WebWorkerMetrics {
  timestamp: string;
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
}

export interface WebWorkerEvent {
  id: string;
  type: 'task-started' | 'task-completed' | 'task-failed' | 'worker-created' | 'worker-terminated' | 'error';
  taskId?: string;
  workerId?: string;
  message: string;
  timestamp: string;
  data?: any;
}

export interface WebWorkerDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  timestamp: string;
  data?: any;
}

// Store
interface WebWorkerStore {
  // State
  tasks: WebWorkerTask[];
  pools: WebWorkerPool[];
  stats: WebWorkerStats;
  config: WebWorkerConfig;
  metrics: WebWorkerMetrics[];
  events: WebWorkerEvent[];
  debugLogs: WebWorkerDebugLog[];
  isInitialized: boolean;
  isProcessing: boolean;
  lastUpdate: string;
  
  // Task Management
  addTask: (task: Omit<WebWorkerTask, 'id' | 'status' | 'progress' | 'retries'>) => string;
  updateTask: (id: string, updates: Partial<WebWorkerTask>) => void;
  removeTask: (id: string) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  getTasks: (filter?: Partial<WebWorkerTask>) => WebWorkerTask[];
  getTask: (id: string) => WebWorkerTask | undefined;
  
  // Pool Management
  addPool: (pool: Omit<WebWorkerPool, 'id'>) => void;
  updatePool: (id: string, updates: Partial<WebWorkerPool>) => void;
  removePool: (id: string) => void;
  getPool: (id: string) => WebWorkerPool | undefined;
  
  // Worker Operations
  processTask: (taskId: string) => Promise<any>;
  processVideoTask: (taskId: string, videoData: any) => Promise<any>;
  processImageTask: (taskId: string, imageData: any) => Promise<any>;
  processDataTask: (taskId: string, data: any) => Promise<any>;
  processComputationTask: (taskId: string, computation: any) => Promise<any>;
  
  // Queue Management
  getQueuedTasks: () => WebWorkerTask[];
  getRunningTasks: () => WebWorkerTask[];
  getCompletedTasks: () => WebWorkerTask[];
  getFailedTasks: () => WebWorkerTask[];
  clearQueue: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  
  // Configuration
  updateConfig: (updates: Partial<WebWorkerConfig>) => void;
  resetConfig: () => void;
  
  // Analytics
  updateStats: () => void;
  addMetric: (metric: Omit<WebWorkerMetrics, 'timestamp'>) => void;
  getMetrics: (timeRange?: { start: string; end: string }) => WebWorkerMetrics[];
  
  // Events
  addEvent: (event: Omit<WebWorkerEvent, 'id' | 'timestamp'>) => void;
  getEvents: (filter?: Partial<WebWorkerEvent>) => WebWorkerEvent[];
  clearEvents: () => void;
  
  // Utilities
  formatDuration: (ms: number) => string;
  formatBytes: (bytes: number) => string;
  calculateThroughput: () => number;
  getMemoryUsage: () => number;
  
  // Quick Actions
  processVideo: (videoFile: File, options?: any) => Promise<any>;
  processImage: (imageFile: File, options?: any) => Promise<any>;
  processData: (data: any, processor: string) => Promise<any>;
  runComputation: (computation: Function, data: any) => Promise<any>;
  
  // Advanced Features
  createWorkerPool: (type: string, maxWorkers: number) => string;
  balanceLoad: () => void;
  optimizePerformance: () => void;
  cleanupResources: () => void;
  
  // System Operations
  initialize: () => void;
  shutdown: () => void;
  restart: () => void;
  getSystemInfo: () => any;
  
  // Debug
  addDebugLog: (log: Omit<WebWorkerDebugLog, 'id' | 'timestamp'>) => void;
  getDebugLogs: (filter?: Partial<WebWorkerDebugLog>) => WebWorkerDebugLog[];
  clearDebugLogs: () => void;
  exportDebugData: () => string;
}

// Default configuration
const defaultConfig: WebWorkerConfig = {
  maxConcurrentWorkers: navigator.hardwareConcurrency || 4,
  taskTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  enableLogging: true,
  enableMetrics: true,
  autoCleanup: true,
  cleanupInterval: 60000, // 1 minute
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  priorityQueuing: true,
  loadBalancing: true
};

// Store implementation
export const useWebWorkerStore = create<WebWorkerStore>((set, get) => ({
  // Initial state
  tasks: [],
  pools: [],
  stats: {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    throughput: 0,
    errorRate: 0,
    successRate: 0
  },
  config: defaultConfig,
  metrics: [],
  events: [],
  debugLogs: [],
  isInitialized: false,
  isProcessing: false,
  lastUpdate: new Date().toISOString(),
  
  // Task Management
  addTask: (task) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: WebWorkerTask = {
      ...task,
      id,
      status: 'pending',
      progress: 0,
      retries: 0
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask],
      lastUpdate: new Date().toISOString()
    }));
    
    get().addEvent({
      type: 'task-started',
      taskId: id,
      message: `Task ${task.name} added to queue`
    });
    
    get().addDebugLog({
      level: 'info',
      category: 'Task Management',
      message: `Task added: ${task.name} (${task.type})`,
      data: { taskId: id, task }
    });
    
    return id;
  },
  
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ),
      lastUpdate: new Date().toISOString()
    }));
  },
  
  removeTask: (id) => {
    const task = get().getTask(id);
    if (task?.worker) {
      task.worker.terminate();
    }
    
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== id),
      lastUpdate: new Date().toISOString()
    }));
  },
  
  cancelTask: (id) => {
    const task = get().getTask(id);
    if (task) {
      if (task.worker) {
        task.worker.terminate();
      }
      
      get().updateTask(id, {
        status: 'cancelled',
        endTime: new Date().toISOString()
      });
      
      get().addEvent({
        type: 'task-failed',
        taskId: id,
        message: `Task ${task.name} cancelled`
      });
    }
  },
  
  retryTask: (id) => {
    const task = get().getTask(id);
    if (task && task.retries < task.maxRetries) {
      get().updateTask(id, {
        status: 'pending',
        progress: 0,
        retries: task.retries + 1,
        error: undefined
      });
      
      get().addDebugLog({
        level: 'info',
        category: 'Task Management',
        message: `Retrying task: ${task.name} (attempt ${task.retries + 1}/${task.maxRetries})`
      });
    }
  },
  
  getTasks: (filter) => {
    const { tasks } = get();
    if (!filter) return tasks;
    
    return tasks.filter(task => {
      return Object.entries(filter).every(([key, value]) => 
        task[key as keyof WebWorkerTask] === value
      );
    });
  },
  
  getTask: (id) => {
    return get().tasks.find(task => task.id === id);
  },
  
  // Pool Management
  addPool: (pool) => {
    const id = `pool-${Date.now()}`;
    set((state) => ({
      pools: [...state.pools, { ...pool, id }],
      lastUpdate: new Date().toISOString()
    }));
  },
  
  updatePool: (id, updates) => {
    set((state) => ({
      pools: state.pools.map(pool => 
        pool.id === id ? { ...pool, ...updates } : pool
      ),
      lastUpdate: new Date().toISOString()
    }));
  },
  
  removePool: (id) => {
    set((state) => ({
      pools: state.pools.filter(pool => pool.id !== id),
      lastUpdate: new Date().toISOString()
    }));
  },
  
  getPool: (id) => {
    return get().pools.find(pool => pool.id === id);
  },
  
  // Worker Operations
  processTask: async (taskId) => {
    const task = get().getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    try {
      get().updateTask(taskId, {
        status: 'running',
        startTime: new Date().toISOString()
      });
      
      let result;
      switch (task.type) {
        case 'video-processing':
          result = await get().processVideoTask(taskId, task.data);
          break;
        case 'image-processing':
          result = await get().processImageTask(taskId, task.data);
          break;
        case 'data-processing':
          result = await get().processDataTask(taskId, task.data);
          break;
        case 'computation':
          result = await get().processComputationTask(taskId, task.data);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(task.startTime!).getTime();
      
      get().updateTask(taskId, {
        status: 'completed',
        progress: 100,
        result,
        endTime,
        duration
      });
      
      get().addEvent({
        type: 'task-completed',
        taskId,
        message: `Task ${task.name} completed successfully`
      });
      
      return result;
    } catch (error) {
      get().updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: new Date().toISOString()
      });
      
      get().addEvent({
        type: 'task-failed',
        taskId,
        message: `Task ${task.name} failed: ${error}`
      });
      
      throw error;
    }
  },
  
  processVideoTask: async (taskId, videoData) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/videoProcessor.worker.ts', import.meta.url));
      
      get().updateTask(taskId, { worker });
      
      worker.onmessage = (e) => {
        const { type, data, progress, error } = e.data;
        
        if (type === 'progress') {
          get().updateTask(taskId, { progress });
        } else if (type === 'complete') {
          worker.terminate();
          resolve(data);
        } else if (type === 'error') {
          worker.terminate();
          reject(new Error(error));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage({ videoData });
    });
  },
  
  processImageTask: async (taskId, imageData) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url));
      
      get().updateTask(taskId, { worker });
      
      worker.onmessage = (e) => {
        const { type, data, progress, error } = e.data;
        
        if (type === 'progress') {
          get().updateTask(taskId, { progress });
        } else if (type === 'complete') {
          worker.terminate();
          resolve(data);
        } else if (type === 'error') {
          worker.terminate();
          reject(new Error(error));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage({ imageData });
    });
  },
  
  processDataTask: async (taskId, data) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/dataProcessor.worker.ts', import.meta.url));
      
      get().updateTask(taskId, { worker });
      
      worker.onmessage = (e) => {
        const { type, result, progress, error } = e.data;
        
        if (type === 'progress') {
          get().updateTask(taskId, { progress });
        } else if (type === 'complete') {
          worker.terminate();
          resolve(result);
        } else if (type === 'error') {
          worker.terminate();
          reject(new Error(error));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage({ data });
    });
  },
  
  processComputationTask: async (taskId, computation) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/computationProcessor.worker.ts', import.meta.url));
      
      get().updateTask(taskId, { worker });
      
      worker.onmessage = (e) => {
        const { type, result, progress, error } = e.data;
        
        if (type === 'progress') {
          get().updateTask(taskId, { progress });
        } else if (type === 'complete') {
          worker.terminate();
          resolve(result);
        } else if (type === 'error') {
          worker.terminate();
          reject(new Error(error));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage({ computation });
    });
  },
  
  // Queue Management
  getQueuedTasks: () => get().getTasks({ status: 'pending' }),
  getRunningTasks: () => get().getTasks({ status: 'running' }),
  getCompletedTasks: () => get().getTasks({ status: 'completed' }),
  getFailedTasks: () => get().getTasks({ status: 'failed' }),
  
  clearQueue: () => {
    const queuedTasks = get().getQueuedTasks();
    queuedTasks.forEach(task => get().removeTask(task.id));
  },
  
  pauseProcessing: () => {
    set({ isProcessing: false });
  },
  
  resumeProcessing: () => {
    set({ isProcessing: true });
  },
  
  // Configuration
  updateConfig: (updates) => {
    set((state) => ({
      config: { ...state.config, ...updates },
      lastUpdate: new Date().toISOString()
    }));
  },
  
  resetConfig: () => {
    set({
      config: defaultConfig,
      lastUpdate: new Date().toISOString()
    });
  },
  
  // Analytics
  updateStats: () => {
    const { tasks } = get();
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter(t => t.status === 'running').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length;
    
    const completedTasksWithDuration = tasks.filter(t => t.status === 'completed' && t.duration);
    const averageProcessingTime = completedTasksWithDuration.length > 0 
      ? completedTasksWithDuration.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTasksWithDuration.length
      : 0;
    
    const totalProcessingTime = completedTasksWithDuration.reduce((sum, t) => sum + (t.duration || 0), 0);
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const errorRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;
    
    set({
      stats: {
        totalTasks,
        activeTasks,
        completedTasks,
        failedTasks,
        cancelledTasks,
        averageProcessingTime,
        totalProcessingTime,
        memoryUsage: get().getMemoryUsage(),
        cpuUsage: 0, // Would need performance API
        throughput: get().calculateThroughput(),
        errorRate,
        successRate
      },
      lastUpdate: new Date().toISOString()
    });
  },
  
  addMetric: (metric) => {
    const timestamp = new Date().toISOString();
    set((state) => ({
      metrics: [...state.metrics, { ...metric, timestamp }].slice(-100), // Keep last 100 metrics
      lastUpdate: timestamp
    }));
  },
  
  getMetrics: (timeRange) => {
    const { metrics } = get();
    if (!timeRange) return metrics;
    
    return metrics.filter(metric => {
      const timestamp = new Date(metric.timestamp);
      return timestamp >= new Date(timeRange.start) && timestamp <= new Date(timeRange.end);
    });
  },
  
  // Events
  addEvent: (event) => {
    const id = `event-${Date.now()}`;
    const timestamp = new Date().toISOString();
    set((state) => ({
      events: [...state.events, { ...event, id, timestamp }].slice(-1000), // Keep last 1000 events
      lastUpdate: timestamp
    }));
  },
  
  getEvents: (filter) => {
    const { events } = get();
    if (!filter) return events;
    
    return events.filter(event => {
      return Object.entries(filter).every(([key, value]) => 
        event[key as keyof WebWorkerEvent] === value
      );
    });
  },
  
  clearEvents: () => {
    set({ events: [], lastUpdate: new Date().toISOString() });
  },
  
  // Utilities
  formatDuration: (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  },
  
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },
  
  calculateThroughput: () => {
    const { tasks } = get();
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentTasks = completedTasks.filter(t => 
      t.endTime && new Date(t.endTime) > oneHourAgo
    );
    
    return recentTasks.length;
  },
  
  getMemoryUsage: () => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },
  
  // Quick Actions
  processVideo: async (videoFile, options = {}) => {
    const taskId = get().addTask({
      type: 'video-processing',
      name: `Process ${videoFile.name}`,
      data: { file: videoFile, options },
      priority: 'medium',
      maxRetries: 3
    });
    
    return get().processTask(taskId);
  },
  
  processImage: async (imageFile, options = {}) => {
    const taskId = get().addTask({
      type: 'image-processing',
      name: `Process ${imageFile.name}`,
      data: { file: imageFile, options },
      priority: 'medium',
      maxRetries: 3
    });
    
    return get().processTask(taskId);
  },
  
  processData: async (data, processor) => {
    const taskId = get().addTask({
      type: 'data-processing',
      name: `Process data with ${processor}`,
      data: { data, processor },
      priority: 'medium',
      maxRetries: 3
    });
    
    return get().processTask(taskId);
  },
  
  runComputation: async (computation, data) => {
    const taskId = get().addTask({
      type: 'computation',
      name: 'Run computation',
      data: { computation: computation.toString(), data },
      priority: 'medium',
      maxRetries: 3
    });
    
    return get().processTask(taskId);
  },
  
  // Advanced Features
  createWorkerPool: (type, maxWorkers) => {
    const poolId = `pool-${Date.now()}`;
    get().addPool({
      name: `${type} Pool`,
      type,
      maxWorkers,
      activeWorkers: 0,
      queueSize: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTime: 0,
      enabled: true
    });
    return poolId;
  },
  
  balanceLoad: () => {
    const { tasks, config } = get();
    const runningTasks = tasks.filter(t => t.status === 'running');
    const queuedTasks = tasks.filter(t => t.status === 'pending');
    
    if (runningTasks.length < config.maxConcurrentWorkers && queuedTasks.length > 0) {
      // Sort by priority
      const sortedTasks = queuedTasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      const tasksToStart = sortedTasks.slice(0, config.maxConcurrentWorkers - runningTasks.length);
      tasksToStart.forEach(task => {
        get().processTask(task.id).catch(console.error);
      });
    }
  },
  
  optimizePerformance: () => {
    const { tasks, config } = get();
    
    // Clean up completed tasks older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const tasksToRemove = tasks.filter(t => 
      t.status === 'completed' && 
      t.endTime && 
      new Date(t.endTime) < oneHourAgo
    );
    
    tasksToRemove.forEach(task => get().removeTask(task.id));
    
    // Adjust worker count based on system performance
    const memoryUsage = get().getMemoryUsage();
    if (memoryUsage > config.memoryThreshold) {
      get().updateConfig({
        maxConcurrentWorkers: Math.max(1, config.maxConcurrentWorkers - 1)
      });
    }
  },
  
  cleanupResources: () => {
    const { tasks } = get();
    
    // Terminate all workers
    tasks.forEach(task => {
      if (task.worker) {
        task.worker.terminate();
      }
    });
    
    // Clear completed and failed tasks
    set((state) => ({
      tasks: state.tasks.filter(t => t.status === 'running' || t.status === 'pending'),
      lastUpdate: new Date().toISOString()
    }));
  },
  
  // System Operations
  initialize: () => {
    set({ isInitialized: true, isProcessing: true });
    
    // Start load balancing interval
    setInterval(() => {
      if (get().isProcessing) {
        get().balanceLoad();
        get().updateStats();
      }
    }, 1000);
    
    // Start cleanup interval
    setInterval(() => {
      if (get().config.autoCleanup) {
        get().optimizePerformance();
      }
    }, get().config.cleanupInterval);
    
    get().addDebugLog({
      level: 'info',
      category: 'System',
      message: 'Web Worker Manager initialized'
    });
  },
  
  shutdown: () => {
    get().cleanupResources();
    set({ isInitialized: false, isProcessing: false });
    
    get().addDebugLog({
      level: 'info',
      category: 'System',
      message: 'Web Worker Manager shutdown'
    });
  },
  
  restart: () => {
    get().shutdown();
    setTimeout(() => get().initialize(), 100);
  },
  
  getSystemInfo: () => {
    return {
      hardwareConcurrency: navigator.hardwareConcurrency,
      memoryUsage: get().getMemoryUsage(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  },
  
  // Debug
  addDebugLog: (log) => {
    const id = `log-${Date.now()}`;
    const timestamp = new Date().toISOString();
    set((state) => ({
      debugLogs: [...state.debugLogs, { ...log, id, timestamp }].slice(-1000), // Keep last 1000 logs
      lastUpdate: timestamp
    }));
  },
  
  getDebugLogs: (filter) => {
    const { debugLogs } = get();
    if (!filter) return debugLogs;
    
    return debugLogs.filter(log => {
      return Object.entries(filter).every(([key, value]) => 
        log[key as keyof WebWorkerDebugLog] === value
      );
    });
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [], lastUpdate: new Date().toISOString() });
  },
  
  exportDebugData: () => {
    const { tasks, pools, stats, config, metrics, events, debugLogs } = get();
    return JSON.stringify({
      tasks,
      pools,
      stats,
      config,
      metrics,
      events,
      debugLogs,
      exportTime: new Date().toISOString()
    }, null, 2);
  }
}));

// Web Worker Manager Class
export class WebWorkerManager {
  private static instance: WebWorkerManager;
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): WebWorkerManager {
    if (!WebWorkerManager.instance) {
      WebWorkerManager.instance = new WebWorkerManager();
    }
    return WebWorkerManager.instance;
  }
  
  private initialize() {
    const store = useWebWorkerStore.getState();
    if (!store.isInitialized) {
      store.initialize();
    }
  }
  
  // Public API methods
  processVideo(videoFile: File, options?: any) {
    return useWebWorkerStore.getState().processVideo(videoFile, options);
  }
  
  processImage(imageFile: File, options?: any) {
    return useWebWorkerStore.getState().processImage(imageFile, options);
  }
  
  processData(data: any, processor: string) {
    return useWebWorkerStore.getState().processData(data, processor);
  }
  
  runComputation(computation: Function, data: any) {
    return useWebWorkerStore.getState().runComputation(computation, data);
  }
}

// Global instance
export const webWorkerManager = WebWorkerManager.getInstance();

// Utility functions
export const getTaskStatusColor = (status: WebWorkerTask['status']) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    case 'running': return 'text-blue-600 bg-blue-100';
    case 'completed': return 'text-green-600 bg-green-100';
    case 'failed': return 'text-red-600 bg-red-100';
    case 'cancelled': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getPriorityColor = (priority: WebWorkerTask['priority']) => {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getTaskTypeIcon = (type: WebWorkerTask['type']) => {
  switch (type) {
    case 'video-processing': return 'Video';
    case 'image-processing': return 'Image';
    case 'data-processing': return 'Database';
    case 'computation': return 'Cpu';
    default: return 'Settings';
  }
};