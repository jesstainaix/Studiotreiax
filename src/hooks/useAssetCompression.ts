import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface CompressionConfig {
  imageQuality: number;
  imageFormat: 'webp' | 'jpeg' | 'png' | 'auto';
  maxImageSize: number;
  enableProgressiveJPEG: boolean;
  enableLosslessWebP: boolean;
  videoQuality: number;
  videoBitrate: number;
  videoFormat: 'mp4' | 'webm' | 'auto';
  audioQuality: number;
  audioBitrate: number;
  audioFormat: 'mp3' | 'aac' | 'ogg' | 'auto';
  enableGzip: boolean;
  enableBrotli: boolean;
  minCompressionRatio: number;
  maxFileSize: number;
  enableBatchProcessing: boolean;
  batchSize: number;
  enableWorkerCompression: boolean;
  workerCount: number;
  enableCaching: boolean;
  cacheMaxSize: number;
  enableAnalytics: boolean;
}

export interface CompressionTask {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'text' | 'binary';
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: Blob;
  metadata?: Record<string, any>;
}

export interface CompressionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  compressionsByType: Record<string, number>;
  compressionsByFormat: Record<string, number>;
  errorsByType: Record<string, number>;
  performanceScore: number;
  bandwidthSaved: number;
  cacheHitRate: number;
  workerUtilization: number;
}

export interface CompressionState {
  tasks: Map<string, CompressionTask>;
  processingTasks: Set<string>;
  completedTasks: Set<string>;
  failedTasks: Set<string>;
  isProcessing: boolean;
  queue: string[];
  workers: Worker[];
  cache: Map<string, Blob>;
  analytics: CompressionMetrics;
}

// Compression Cache Manager
class CompressionCache {
  private cache = new Map<string, Blob>();
  private maxSize: number;
  private currentSize = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  private generateKey(file: File, config: Partial<CompressionConfig>): string {
    const configStr = JSON.stringify(config);
    return `${file.name}-${file.size}-${file.lastModified}-${btoa(configStr)}`;
  }

  get(file: File, config: Partial<CompressionConfig>): Blob | null {
    const key = this.generateKey(file, config);
    return this.cache.get(key) || null;
  }

  set(file: File, config: Partial<CompressionConfig>, result: Blob): void {
    const key = this.generateKey(file, config);
    
    // Remove oldest entries if cache is full
    while (this.currentSize + result.size > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value;
      const firstBlob = this.cache.get(firstKey);
      if (firstBlob) {
        this.currentSize -= firstBlob.size;
      }
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
    this.currentSize += result.size;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getSize(): number {
    return this.currentSize;
  }

  getMaxSize(): number {
    return this.maxSize;
  }

  getHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0.75; // Mock value
  }
}

// Image Compression Utilities
class ImageCompressor {
  static async compressImage(
    file: File, 
    config: Partial<CompressionConfig>
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          const maxSize = config.maxImageSize || 1920;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          const quality = (config.imageQuality || 80) / 100;
          const format = config.imageFormat === 'auto' ? 'image/webp' : `image/${config.imageFormat}`;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            format,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Video Compression Utilities
class VideoCompressor {
  static async compressVideo(
    file: File, 
    config: Partial<CompressionConfig>
  ): Promise<Blob> {
    // This would require a more complex implementation with FFmpeg.wasm or similar
    // For now, return a mock compressed version
    return new Promise((resolve) => {
      setTimeout(() => {
        const compressionRatio = 0.7; // Mock 30% compression
        const compressedSize = Math.floor(file.size * compressionRatio);
        const mockBlob = new Blob([new ArrayBuffer(compressedSize)], { type: file.type });
        resolve(mockBlob);
      }, 2000); // Simulate processing time
    });
  }
}

// Audio Compression Utilities
class AudioCompressor {
  static async compressAudio(
    file: File, 
    config: Partial<CompressionConfig>
  ): Promise<Blob> {
    // This would require Web Audio API or similar
    // For now, return a mock compressed version
    return new Promise((resolve) => {
      setTimeout(() => {
        const compressionRatio = 0.6; // Mock 40% compression
        const compressedSize = Math.floor(file.size * compressionRatio);
        const mockBlob = new Blob([new ArrayBuffer(compressedSize)], { type: file.type });
        resolve(mockBlob);
      }, 1000); // Simulate processing time
    });
  }
}

// Text Compression Utilities
class TextCompressor {
  static async compressText(
    file: File, 
    config: Partial<CompressionConfig>
  ): Promise<Blob> {
    const text = await file.text();
    
    if (config.enableGzip) {
      // Mock gzip compression
      const compressed = this.mockGzipCompress(text);
      return new Blob([compressed], { type: 'application/gzip' });
    }
    
    if (config.enableBrotli) {
      // Mock brotli compression
      const compressed = this.mockBrotliCompress(text);
      return new Blob([compressed], { type: 'application/x-brotli' });
    }
    
    return file;
  }
  
  private static mockGzipCompress(text: string): ArrayBuffer {
    // Mock compression - reduce size by ~60%
    const originalSize = new TextEncoder().encode(text).length;
    const compressedSize = Math.floor(originalSize * 0.4);
    return new ArrayBuffer(compressedSize);
  }
  
  private static mockBrotliCompress(text: string): ArrayBuffer {
    // Mock compression - reduce size by ~70%
    const originalSize = new TextEncoder().encode(text).length;
    const compressedSize = Math.floor(originalSize * 0.3);
    return new ArrayBuffer(compressedSize);
  }
}

// Worker Manager
class CompressionWorkerManager {
  private workers: Worker[] = [];
  private taskQueue: string[] = [];
  private busyWorkers = new Set<number>();
  
  constructor(workerCount: number) {
    this.initializeWorkers(workerCount);
  }
  
  private initializeWorkers(count: number): void {
    for (let i = 0; i < count; i++) {
      // In a real implementation, you would create actual Web Workers
      // For now, we'll mock the worker behavior
      const mockWorker = {
        postMessage: (data: any) => {
          // Mock worker processing
          setTimeout(() => {
            this.handleWorkerMessage(i, { data: { ...data, result: 'compressed' } });
          }, Math.random() * 2000 + 500);
        },
        terminate: () => {}
      } as any;
      
      this.workers.push(mockWorker);
    }
  }
  
  private handleWorkerMessage(workerId: number, event: MessageEvent): void {
    this.busyWorkers.delete(workerId);
    // Process next task in queue
    this.processNextTask();
  }
  
  addTask(taskId: string): void {
    this.taskQueue.push(taskId);
    this.processNextTask();
  }
  
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.findIndex((_, index) => !this.busyWorkers.has(index));
    if (availableWorker === -1) return;
    
    const taskId = this.taskQueue.shift();
    if (taskId) {
      this.busyWorkers.add(availableWorker);
      this.workers[availableWorker].postMessage({ taskId });
    }
  }
  
  getUtilization(): number {
    return this.busyWorkers.size / this.workers.length;
  }
  
  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }
}

// Main Compression Manager
class CompressionManager {
  private cache: CompressionCache;
  private workerManager?: CompressionWorkerManager;
  
  constructor(config: CompressionConfig) {
    this.cache = new CompressionCache(config.cacheMaxSize);
    
    if (config.enableWorkerCompression) {
      this.workerManager = new CompressionWorkerManager(config.workerCount);
    }
  }
  
  async compressFile(
    file: File, 
    config: CompressionConfig,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Check cache first
    if (config.enableCaching) {
      const cached = this.cache.get(file, config);
      if (cached) {
        onProgress?.(100);
        return cached;
      }
    }
    
    let result: Blob;
    
    // Determine file type and compress accordingly
    if (file.type.startsWith('image/')) {
      result = await ImageCompressor.compressImage(file, config);
    } else if (file.type.startsWith('video/')) {
      result = await VideoCompressor.compressVideo(file, config);
    } else if (file.type.startsWith('audio/')) {
      result = await AudioCompressor.compressAudio(file, config);
    } else if (file.type.startsWith('text/') || file.type === 'application/json') {
      result = await TextCompressor.compressText(file, config);
    } else {
      // For other file types, return as-is or apply generic compression
      result = file;
    }
    
    // Cache the result
    if (config.enableCaching) {
      this.cache.set(file, config, result);
    }
    
    onProgress?.(100);
    return result;
  }
  
  getCacheMetrics() {
    return {
      size: this.cache.getSize(),
      maxSize: this.cache.getMaxSize(),
      hitRate: this.cache.getHitRate()
    };
  }
  
  getWorkerUtilization(): number {
    return this.workerManager?.getUtilization() || 0;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  destroy(): void {
    this.workerManager?.terminate();
    this.cache.clear();
  }
}

// Hook
export const useAssetCompression = (initialConfig?: Partial<CompressionConfig>) => {
  const [config, setConfig] = useState<CompressionConfig>({
    imageQuality: 80,
    imageFormat: 'auto',
    maxImageSize: 1920,
    enableProgressiveJPEG: true,
    enableLosslessWebP: false,
    videoQuality: 75,
    videoBitrate: 1000,
    videoFormat: 'auto',
    audioQuality: 80,
    audioBitrate: 128,
    audioFormat: 'auto',
    enableGzip: true,
    enableBrotli: false,
    minCompressionRatio: 0.1,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    enableBatchProcessing: true,
    batchSize: 5,
    enableWorkerCompression: true,
    workerCount: 4,
    enableCaching: true,
    cacheMaxSize: 50 * 1024 * 1024, // 50MB
    enableAnalytics: true,
    ...initialConfig
  });
  
  const [state, setState] = useState<CompressionState>({
    tasks: new Map(),
    processingTasks: new Set(),
    completedTasks: new Set(),
    failedTasks: new Set(),
    isProcessing: false,
    queue: [],
    workers: [],
    cache: new Map(),
    analytics: {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      compressionsByType: {},
      compressionsByFormat: {},
      errorsByType: {},
      performanceScore: 100,
      bandwidthSaved: 0,
      cacheHitRate: 0,
      workerUtilization: 0
    }
  });
  
  const managerRef = useRef<CompressionManager>();
  
  // Initialize compression manager
  useEffect(() => {
    managerRef.current = new CompressionManager(config);
    
    return () => {
      managerRef.current?.destroy();
    };
  }, [config]);
  
  // Update analytics
  useEffect(() => {
    const updateAnalytics = () => {
      const tasks = Array.from(state.tasks.values());
      const completed = tasks.filter(t => t.status === 'completed');
      const failed = tasks.filter(t => t.status === 'failed');
      
      const totalOriginalSize = tasks.reduce((sum, t) => sum + t.originalSize, 0);
      const totalCompressedSize = completed.reduce((sum, t) => sum + (t.compressedSize || 0), 0);
      const totalProcessingTime = completed.reduce((sum, t) => {
        if (t.startTime && t.endTime) {
          return sum + (t.endTime - t.startTime);
        }
        return sum;
      }, 0);
      
      const compressionsByType: Record<string, number> = {};
      const compressionsByFormat: Record<string, number> = {};
      const errorsByType: Record<string, number> = {};
      
      tasks.forEach(task => {
        compressionsByType[task.type] = (compressionsByType[task.type] || 0) + 1;
        
        if (task.file.type) {
          compressionsByFormat[task.file.type] = (compressionsByFormat[task.file.type] || 0) + 1;
        }
        
        if (task.status === 'failed' && task.error) {
          errorsByType[task.type] = (errorsByType[task.type] || 0) + 1;
        }
      });
      
      const averageCompressionRatio = completed.length > 0 
        ? completed.reduce((sum, t) => sum + (t.compressionRatio || 0), 0) / completed.length
        : 0;
      
      const averageProcessingTime = completed.length > 0 
        ? totalProcessingTime / completed.length
        : 0;
      
      const performanceScore = Math.max(0, Math.min(100, 
        100 - (failed.length / Math.max(tasks.length, 1)) * 50 - 
        Math.max(0, averageProcessingTime - 1000) / 100
      ));
      
      const bandwidthSaved = totalOriginalSize - totalCompressedSize;
      
      const cacheMetrics = managerRef.current?.getCacheMetrics() || { hitRate: 0 };
      const workerUtilization = managerRef.current?.getWorkerUtilization() || 0;
      
      setState(prev => ({
        ...prev,
        analytics: {
          totalTasks: tasks.length,
          completedTasks: completed.length,
          failedTasks: failed.length,
          totalOriginalSize,
          totalCompressedSize,
          averageCompressionRatio,
          averageProcessingTime,
          totalProcessingTime,
          compressionsByType,
          compressionsByFormat,
          errorsByType,
          performanceScore,
          bandwidthSaved,
          cacheHitRate: cacheMetrics.hitRate,
          workerUtilization
        }
      }));
    };
    
    updateAnalytics();
    const interval = setInterval(updateAnalytics, 1000);
    
    return () => clearInterval(interval);
  }, [state.tasks]);
  
  const addTask = useCallback((file: File): string => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: CompressionTask = {
      id: taskId,
      file,
      type: file.type.startsWith('image/') ? 'image' :
            file.type.startsWith('video/') ? 'video' :
            file.type.startsWith('audio/') ? 'audio' :
            file.type.startsWith('text/') || file.type === 'application/json' ? 'text' : 'binary',
      originalSize: file.size,
      status: 'pending',
      progress: 0
    };
    
    setState(prev => ({
      ...prev,
      tasks: new Map(prev.tasks).set(taskId, task),
      queue: [...prev.queue, taskId]
    }));
    
    return taskId;
  }, []);
  
  const removeTask = useCallback((taskId: string) => {
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      newTasks.delete(taskId);
      
      const newProcessing = new Set(prev.processingTasks);
      newProcessing.delete(taskId);
      
      const newCompleted = new Set(prev.completedTasks);
      newCompleted.delete(taskId);
      
      const newFailed = new Set(prev.failedTasks);
      newFailed.delete(taskId);
      
      return {
        ...prev,
        tasks: newTasks,
        processingTasks: newProcessing,
        completedTasks: newCompleted,
        failedTasks: newFailed,
        queue: prev.queue.filter(id => id !== taskId)
      };
    });
  }, []);
  
  const compressFile = useCallback(async (taskId: string): Promise<Blob | null> => {
    const task = state.tasks.get(taskId);
    if (!task || !managerRef.current) return null;
    
    setState(prev => ({
      ...prev,
      processingTasks: new Set(prev.processingTasks).add(taskId),
      isProcessing: true
    }));
    
    // Update task status
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      const updatedTask = { ...task, status: 'processing' as const, startTime: Date.now() };
      newTasks.set(taskId, updatedTask);
      return { ...prev, tasks: newTasks };
    });
    
    try {
      const result = await managerRef.current.compressFile(
        task.file,
        config,
        (progress) => {
          setState(prev => {
            const newTasks = new Map(prev.tasks);
            const currentTask = newTasks.get(taskId);
            if (currentTask) {
              newTasks.set(taskId, { ...currentTask, progress });
            }
            return { ...prev, tasks: newTasks };
          });
        }
      );
      
      const compressionRatio = (task.originalSize - result.size) / task.originalSize;
      
      setState(prev => {
        const newTasks = new Map(prev.tasks);
        const newProcessing = new Set(prev.processingTasks);
        const newCompleted = new Set(prev.completedTasks);
        
        newProcessing.delete(taskId);
        newCompleted.add(taskId);
        
        const updatedTask = {
          ...task,
          status: 'completed' as const,
          progress: 100,
          compressedSize: result.size,
          compressionRatio,
          endTime: Date.now(),
          result
        };
        newTasks.set(taskId, updatedTask);
        
        return {
          ...prev,
          tasks: newTasks,
          processingTasks: newProcessing,
          completedTasks: newCompleted,
          isProcessing: newProcessing.size > 0
        };
      });
      
      return result;
    } catch (error) {
      setState(prev => {
        const newTasks = new Map(prev.tasks);
        const newProcessing = new Set(prev.processingTasks);
        const newFailed = new Set(prev.failedTasks);
        
        newProcessing.delete(taskId);
        newFailed.add(taskId);
        
        const updatedTask = {
          ...task,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          endTime: Date.now()
        };
        newTasks.set(taskId, updatedTask);
        
        return {
          ...prev,
          tasks: newTasks,
          processingTasks: newProcessing,
          failedTasks: newFailed,
          isProcessing: newProcessing.size > 0
        };
      });
      
      return null;
    }
  }, [state.tasks, config]);
  
  const compressFiles = useCallback(async (files: File[]): Promise<Map<string, Blob | null>> => {
    const taskIds = files.map(file => addTask(file));
    const results = new Map<string, Blob | null>();
    
    if (config.enableBatchProcessing) {
      // Process in batches
      for (let i = 0; i < taskIds.length; i += config.batchSize) {
        const batch = taskIds.slice(i, i + config.batchSize);
        const batchPromises = batch.map(taskId => compressFile(taskId));
        const batchResults = await Promise.all(batchPromises);
        
        batch.forEach((taskId, index) => {
          results.set(taskId, batchResults[index]);
        });
      }
    } else {
      // Process all at once
      const promises = taskIds.map(taskId => compressFile(taskId));
      const allResults = await Promise.all(promises);
      
      taskIds.forEach((taskId, index) => {
        results.set(taskId, allResults[index]);
      });
    }
    
    return results;
  }, [addTask, compressFile, config.enableBatchProcessing, config.batchSize]);
  
  const retryTask = useCallback(async (taskId: string): Promise<Blob | null> => {
    const task = state.tasks.get(taskId);
    if (!task) return null;
    
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      const newFailed = new Set(prev.failedTasks);
      
      newFailed.delete(taskId);
      
      const resetTask = {
        ...task,
        status: 'pending' as const,
        progress: 0,
        error: undefined,
        result: undefined,
        startTime: undefined,
        endTime: undefined
      };
      newTasks.set(taskId, resetTask);
      
      return {
        ...prev,
        tasks: newTasks,
        failedTasks: newFailed,
        queue: [...prev.queue, taskId]
      };
    });
    
    return compressFile(taskId);
  }, [state.tasks, compressFile]);
  
  const clearCompleted = useCallback(() => {
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      const newCompleted = new Set<string>();
      
      prev.completedTasks.forEach(taskId => {
        newTasks.delete(taskId);
      });
      
      return {
        ...prev,
        tasks: newTasks,
        completedTasks: newCompleted
      };
    });
  }, []);
  
  const clearFailed = useCallback(() => {
    setState(prev => {
      const newTasks = new Map(prev.tasks);
      const newFailed = new Set<string>();
      
      prev.failedTasks.forEach(taskId => {
        newTasks.delete(taskId);
      });
      
      return {
        ...prev,
        tasks: newTasks,
        failedTasks: newFailed
      };
    });
  }, []);
  
  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      tasks: new Map(),
      processingTasks: new Set(),
      completedTasks: new Set(),
      failedTasks: new Set(),
      queue: []
    }));
  }, []);
  
  const clearCache = useCallback(() => {
    managerRef.current?.clearCache();
  }, []);
  
  const updateConfig = useCallback((newConfig: Partial<CompressionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  const exportData = useCallback((): string => {
    const exportData = {
      config,
      tasks: Array.from(state.tasks.entries()).map(([id, task]) => ({
        id,
        ...task,
        file: {
          name: task.file.name,
          size: task.file.size,
          type: task.file.type,
          lastModified: task.file.lastModified
        },
        result: undefined // Don't export blob data
      })),
      analytics: state.analytics,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [config, state]);
  
  const importData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.config) {
        setConfig(parsed.config);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import compression data:', error);
      return false;
    }
  }, []);
  
  const getMetrics = useCallback((): CompressionMetrics => {
    return state.analytics;
  }, [state.analytics]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
    };
  }, []);
  
  return {
    state,
    config,
    actions: {
      addTask,
      removeTask,
      compressFile,
      compressFiles,
      retryTask,
      clearCompleted,
      clearFailed,
      clearAll,
      clearCache,
      updateConfig,
      exportData,
      importData,
      getMetrics
    }
  };
};

export default useAssetCompression;