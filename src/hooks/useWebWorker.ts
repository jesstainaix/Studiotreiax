import { useEffect, useCallback, useMemo } from 'react';
import { 
  useWebWorkerStore, 
  WebWorkerTask, 
  WebWorkerPool, 
  WebWorkerConfig,
  WebWorkerStats,
  WebWorkerMetrics,
  WebWorkerEvent,
  WebWorkerDebugLog
} from '../utils/webWorkerManager';

// Hook options interface
export interface UseWebWorkerOptions {
  autoStart?: boolean;
  enableMetrics?: boolean;
  enableDebug?: boolean;
  maxRetries?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Hook return interface
export interface UseWebWorkerReturn {
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
  processVideo: (videoFile: File, options?: any) => Promise<any>;
  processImage: (imageFile: File, options?: any) => Promise<any>;
  processData: (data: any, processor: string) => Promise<any>;
  runComputation: (computation: Function, data: any) => Promise<any>;
  
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
  
  // Computed Values
  queuedTasksCount: number;
  runningTasksCount: number;
  completedTasksCount: number;
  failedTasksCount: number;
  totalTasksCount: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  memoryUsage: string;
  systemInfo: any;
}

// Main hook
export const useWebWorker = (options: UseWebWorkerOptions = {}): UseWebWorkerReturn => {
  const {
    autoStart = true,
    enableMetrics = true,
    enableDebug = true,
    maxRetries = 3,
    priority = 'medium'
  } = options;
  
  // Get store state and actions
  const {
    tasks,
    pools,
    stats,
    config,
    metrics,
    events,
    debugLogs,
    isInitialized,
    isProcessing,
    lastUpdate,
    
    // Actions
    addTask: storeAddTask,
    updateTask,
    removeTask,
    cancelTask,
    retryTask,
    getTasks,
    getTask,
    
    addPool,
    updatePool,
    removePool,
    getPool,
    
    processTask,
    processVideo: storeProcessVideo,
    processImage: storeProcessImage,
    processData: storeProcessData,
    runComputation: storeRunComputation,
    
    getQueuedTasks,
    getRunningTasks,
    getCompletedTasks,
    getFailedTasks,
    clearQueue,
    pauseProcessing,
    resumeProcessing,
    
    updateConfig,
    resetConfig,
    
    updateStats,
    addMetric,
    getMetrics,
    
    addEvent,
    getEvents,
    clearEvents,
    
    formatDuration,
    formatBytes,
    calculateThroughput,
    getMemoryUsage,
    
    createWorkerPool,
    balanceLoad,
    optimizePerformance,
    cleanupResources,
    
    initialize,
    shutdown,
    restart,
    getSystemInfo,
    
    addDebugLog,
    getDebugLogs,
    clearDebugLogs,
    exportDebugData
  } = useWebWorkerStore();
  
  // Initialize on mount
  useEffect(() => {
    if (autoStart && !isInitialized) {
      initialize();
    }
  }, [autoStart, isInitialized, initialize]);
  
  // Update configuration based on options
  useEffect(() => {
    if (isInitialized) {
      updateConfig({
        enableMetrics,
        enableLogging: enableDebug,
        retryAttempts: maxRetries
      });
    }
  }, [isInitialized, enableMetrics, enableDebug, maxRetries, updateConfig]);
  
  // Enhanced task management with default options
  const addTask = useCallback((task: Omit<WebWorkerTask, 'id' | 'status' | 'progress' | 'retries'>) => {
    return storeAddTask({
      ...task,
      priority: task.priority || priority,
      maxRetries: task.maxRetries || maxRetries
    });
  }, [storeAddTask, priority, maxRetries]);
  
  // Enhanced processing methods with error handling
  const processVideo = useCallback(async (videoFile: File, options: any = {}) => {
    try {
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Video Processing',
          message: `Starting video processing: ${videoFile.name}`,
          data: { fileName: videoFile.name, size: videoFile.size, options }
        });
      }
      
      const result = await storeProcessVideo(videoFile, options);
      
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Video Processing',
          message: `Video processing completed: ${videoFile.name}`,
          data: { fileName: videoFile.name, result }
        });
      }
      
      return result;
    } catch (error) {
      if (enableDebug) {
        addDebugLog({
          level: 'error',
          category: 'Video Processing',
          message: `Video processing failed: ${videoFile.name}`,
          data: { fileName: videoFile.name, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      throw error;
    }
  }, [storeProcessVideo, enableDebug, addDebugLog]);
  
  const processImage = useCallback(async (imageFile: File, options: any = {}) => {
    try {
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Image Processing',
          message: `Starting image processing: ${imageFile.name}`,
          data: { fileName: imageFile.name, size: imageFile.size, options }
        });
      }
      
      const result = await storeProcessImage(imageFile, options);
      
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Image Processing',
          message: `Image processing completed: ${imageFile.name}`,
          data: { fileName: imageFile.name, result }
        });
      }
      
      return result;
    } catch (error) {
      if (enableDebug) {
        addDebugLog({
          level: 'error',
          category: 'Image Processing',
          message: `Image processing failed: ${imageFile.name}`,
          data: { fileName: imageFile.name, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      throw error;
    }
  }, [storeProcessImage, enableDebug, addDebugLog]);
  
  const processData = useCallback(async (data: any, processor: string) => {
    try {
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Data Processing',
          message: `Starting data processing with ${processor}`,
          data: { processor, dataSize: JSON.stringify(data).length }
        });
      }
      
      const result = await storeProcessData(data, processor);
      
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Data Processing',
          message: `Data processing completed with ${processor}`,
          data: { processor, result }
        });
      }
      
      return result;
    } catch (error) {
      if (enableDebug) {
        addDebugLog({
          level: 'error',
          category: 'Data Processing',
          message: `Data processing failed with ${processor}`,
          data: { processor, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      throw error;
    }
  }, [storeProcessData, enableDebug, addDebugLog]);
  
  const runComputation = useCallback(async (computation: Function, data: any) => {
    try {
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Computation',
          message: 'Starting computation task',
          data: { functionName: computation.name, dataSize: JSON.stringify(data).length }
        });
      }
      
      const result = await storeRunComputation(computation, data);
      
      if (enableDebug) {
        addDebugLog({
          level: 'info',
          category: 'Computation',
          message: 'Computation task completed',
          data: { functionName: computation.name, result }
        });
      }
      
      return result;
    } catch (error) {
      if (enableDebug) {
        addDebugLog({
          level: 'error',
          category: 'Computation',
          message: 'Computation task failed',
          data: { functionName: computation.name, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      throw error;
    }
  }, [storeRunComputation, enableDebug, addDebugLog]);
  
  // Computed values
  const computedValues = useMemo(() => {
    const queuedTasksCount = tasks.filter(t => t.status === 'pending').length;
    const runningTasksCount = tasks.filter(t => t.status === 'running').length;
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const failedTasksCount = tasks.filter(t => t.status === 'failed').length;
    const totalTasksCount = tasks.length;
    
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.duration);
    const averageProcessingTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTasks.length
      : 0;
    
    const successRate = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
    const errorRate = totalTasksCount > 0 ? (failedTasksCount / totalTasksCount) * 100 : 0;
    const throughput = calculateThroughput();
    const memoryUsage = formatBytes(getMemoryUsage());
    const systemInfo = getSystemInfo();
    
    return {
      queuedTasksCount,
      runningTasksCount,
      completedTasksCount,
      failedTasksCount,
      totalTasksCount,
      averageProcessingTime,
      successRate,
      errorRate,
      throughput,
      memoryUsage,
      systemInfo
    };
  }, [tasks, calculateThroughput, formatBytes, getMemoryUsage, getSystemInfo]);
  
  // Auto-update stats
  useEffect(() => {
    if (isInitialized && enableMetrics) {
      const interval = setInterval(() => {
        updateStats();
        
        // Add metric sample
        addMetric({
          activeTasks: computedValues.runningTasksCount,
          queuedTasks: computedValues.queuedTasksCount,
          completedTasks: computedValues.completedTasksCount,
          memoryUsage: getMemoryUsage(),
          cpuUsage: 0, // Would need performance API
          throughput: computedValues.throughput,
          errorRate: computedValues.errorRate
        });
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isInitialized, enableMetrics, updateStats, addMetric, computedValues, getMemoryUsage]);
  
  return {
    // State
    tasks,
    pools,
    stats,
    config,
    metrics,
    events,
    debugLogs,
    isInitialized,
    isProcessing,
    lastUpdate,
    
    // Task Management
    addTask,
    updateTask,
    removeTask,
    cancelTask,
    retryTask,
    getTasks,
    getTask,
    
    // Pool Management
    addPool,
    updatePool,
    removePool,
    getPool,
    
    // Worker Operations
    processTask,
    processVideo,
    processImage,
    processData,
    runComputation,
    
    // Queue Management
    getQueuedTasks,
    getRunningTasks,
    getCompletedTasks,
    getFailedTasks,
    clearQueue,
    pauseProcessing,
    resumeProcessing,
    
    // Configuration
    updateConfig,
    resetConfig,
    
    // Analytics
    updateStats,
    addMetric,
    getMetrics,
    
    // Events
    addEvent,
    getEvents,
    clearEvents,
    
    // Utilities
    formatDuration,
    formatBytes,
    calculateThroughput,
    getMemoryUsage,
    
    // Quick Actions
    createWorkerPool,
    balanceLoad,
    optimizePerformance,
    cleanupResources,
    
    // System Operations
    initialize,
    shutdown,
    restart,
    getSystemInfo,
    
    // Debug
    addDebugLog,
    getDebugLogs,
    clearDebugLogs,
    exportDebugData,
    
    // Computed Values
    ...computedValues
  };
};

// Specialized hooks
export const useWebWorkerStats = () => {
  const { stats, updateStats } = useWebWorkerStore();
  
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [updateStats]);
  
  return stats;
};

export const useWebWorkerConfig = () => {
  const { config, updateConfig, resetConfig } = useWebWorkerStore();
  
  return {
    config,
    updateConfig,
    resetConfig
  };
};

export const useWebWorkerTasks = (filter?: Partial<WebWorkerTask>) => {
  const { tasks, getTasks } = useWebWorkerStore();
  
  return useMemo(() => {
    return filter ? getTasks(filter) : tasks;
  }, [tasks, getTasks, filter]);
};

export const useWebWorkerPools = () => {
  const { pools, addPool, updatePool, removePool, getPool } = useWebWorkerStore();
  
  return {
    pools,
    addPool,
    updatePool,
    removePool,
    getPool
  };
};

export const useWebWorkerEvents = (filter?: Partial<WebWorkerEvent>) => {
  const { events, getEvents, addEvent, clearEvents } = useWebWorkerStore();
  
  const filteredEvents = useMemo(() => {
    return filter ? getEvents(filter) : events;
  }, [events, getEvents, filter]);
  
  return {
    events: filteredEvents,
    addEvent,
    clearEvents
  };
};

export const useWebWorkerDebug = () => {
  const { 
    debugLogs, 
    addDebugLog, 
    getDebugLogs, 
    clearDebugLogs, 
    exportDebugData 
  } = useWebWorkerStore();
  
  const debugStats = useMemo(() => {
    const errorLogs = debugLogs.filter(log => log.level === 'error');
    const warningLogs = debugLogs.filter(log => log.level === 'warn');
    const infoLogs = debugLogs.filter(log => log.level === 'info');
    const debugLogsCount = debugLogs.filter(log => log.level === 'debug');
    
    return {
      totalLogs: debugLogs.length,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      infoCount: infoLogs.length,
      debugCount: debugLogsCount.length,
      hasErrors: errorLogs.length > 0,
      hasWarnings: warningLogs.length > 0
    };
  }, [debugLogs]);
  
  return {
    debugLogs,
    debugStats,
    addDebugLog,
    getDebugLogs,
    clearDebugLogs,
    exportDebugData
  };
};

export const useWebWorkerMetrics = (timeRange?: { start: string; end: string }) => {
  const { metrics, getMetrics, addMetric } = useWebWorkerStore();
  
  const filteredMetrics = useMemo(() => {
    return timeRange ? getMetrics(timeRange) : metrics;
  }, [metrics, getMetrics, timeRange]);
  
  const metricsStats = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        averageActiveTasks: 0,
        averageQueuedTasks: 0,
        averageMemoryUsage: 0,
        averageThroughput: 0,
        averageErrorRate: 0,
        peakActiveTasks: 0,
        peakMemoryUsage: 0,
        peakThroughput: 0
      };
    }
    
    const averageActiveTasks = filteredMetrics.reduce((sum, m) => sum + m.activeTasks, 0) / filteredMetrics.length;
    const averageQueuedTasks = filteredMetrics.reduce((sum, m) => sum + m.queuedTasks, 0) / filteredMetrics.length;
    const averageMemoryUsage = filteredMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / filteredMetrics.length;
    const averageThroughput = filteredMetrics.reduce((sum, m) => sum + m.throughput, 0) / filteredMetrics.length;
    const averageErrorRate = filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) / filteredMetrics.length;
    
    const peakActiveTasks = Math.max(...filteredMetrics.map(m => m.activeTasks));
    const peakMemoryUsage = Math.max(...filteredMetrics.map(m => m.memoryUsage));
    const peakThroughput = Math.max(...filteredMetrics.map(m => m.throughput));
    
    return {
      averageActiveTasks,
      averageQueuedTasks,
      averageMemoryUsage,
      averageThroughput,
      averageErrorRate,
      peakActiveTasks,
      peakMemoryUsage,
      peakThroughput
    };
  }, [filteredMetrics]);
  
  return {
    metrics: filteredMetrics,
    metricsStats,
    addMetric
  };
};

// Utility hook for throttling
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
};

// Performance monitoring hook
export const useWebWorkerPerformance = () => {
  const { stats, metrics, getMemoryUsage, calculateThroughput } = useWebWorkerStore();
  
  const performanceData = useMemo(() => {
    const recentMetrics = metrics.slice(-10); // Last 10 metrics
    
    if (recentMetrics.length === 0) {
      return {
        currentMemoryUsage: getMemoryUsage(),
        currentThroughput: calculateThroughput(),
        memoryTrend: 'stable',
        throughputTrend: 'stable',
        performanceScore: 100
      };
    }
    
    const currentMemoryUsage = getMemoryUsage();
    const currentThroughput = calculateThroughput();
    
    // Calculate trends
    const memoryValues = recentMetrics.map(m => m.memoryUsage);
    const throughputValues = recentMetrics.map(m => m.throughput);
    
    const memoryTrend = memoryValues.length > 1 
      ? memoryValues[memoryValues.length - 1] > memoryValues[0] ? 'increasing' : 'decreasing'
      : 'stable';
    
    const throughputTrend = throughputValues.length > 1
      ? throughputValues[throughputValues.length - 1] > throughputValues[0] ? 'increasing' : 'decreasing'
      : 'stable';
    
    // Calculate performance score (0-100)
    const errorRate = stats.errorRate;
    const successRate = stats.successRate;
    const memoryScore = Math.max(0, 100 - (currentMemoryUsage / (100 * 1024 * 1024)) * 100); // Penalty for high memory usage
    const throughputScore = Math.min(100, currentThroughput * 10); // Bonus for high throughput
    
    const performanceScore = Math.round(
      (successRate * 0.4) + 
      (memoryScore * 0.3) + 
      (throughputScore * 0.2) + 
      ((100 - errorRate) * 0.1)
    );
    
    return {
      currentMemoryUsage,
      currentThroughput,
      memoryTrend,
      throughputTrend,
      performanceScore
    };
  }, [stats, metrics, getMemoryUsage, calculateThroughput]);
  
  return performanceData;
};

// Import useRef
import { useRef } from 'react';