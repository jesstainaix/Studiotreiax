import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface WebWorkerTask {
  id: string;
  type: 'video-processing' | 'image-compression' | 'data-analysis' | 'file-processing';
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  estimatedTime?: number;
}

export interface AssetCompression {
  id: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  quality: number;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  compressedUrl: string;
  metadata: Record<string, any>;
}

export interface VirtualDOMNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children: VirtualDOMNode[];
  key?: string;
  ref?: any;
  dirty: boolean;
  rendered: boolean;
  element?: HTMLElement;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  renderTime: number;
  bundleSize: number;
  loadTime: number;
  interactionTime: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface OptimizationConfig {
  webWorkers: {
    enabled: boolean;
    maxWorkers: number;
    taskTimeout: number;
    retryAttempts: number;
  };
  compression: {
    enabled: boolean;
    imageQuality: number;
    videoQuality: number;
    enableWebP: boolean;
    enableAVIF: boolean;
    enableBrotli: boolean;
  };
  virtualDOM: {
    enabled: boolean;
    batchUpdates: boolean;
    diffingStrategy: 'simple' | 'advanced' | 'fiber';
    reconciliationMode: 'sync' | 'async' | 'concurrent';
  };
  preloading: {
    enabled: boolean;
    strategy: 'aggressive' | 'conservative' | 'adaptive';
    maxPreloadSize: number;
    preloadTypes: string[];
  };
  caching: {
    enabled: boolean;
    strategy: 'lru' | 'lfu' | 'ttl' | 'adaptive';
    maxSize: number;
    ttl: number;
  };
}

export interface PerformanceStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  totalCompressionSaved: number;
  renderOptimizations: number;
  cacheHits: number;
  cacheMisses: number;
  memoryOptimizations: number;
  networkOptimizations: number;
}

export interface PerformanceStore {
  // State
  webWorkers: WebWorkerTask[];
  assets: AssetCompression[];
  virtualDOM: VirtualDOMNode[];
  metrics: PerformanceMetrics;
  config: OptimizationConfig;
  stats: PerformanceStats;
  isOptimizing: boolean;
  lastOptimization: number;
  
  // Web Worker Actions
  addTask: (task: Omit<WebWorkerTask, 'id' | 'status' | 'progress'>) => string;
  updateTask: (id: string, updates: Partial<WebWorkerTask>) => void;
  removeTask: (id: string) => void;
  processTask: (id: string) => Promise<any>;
  cancelTask: (id: string) => void;
  clearTasks: () => void;
  
  // Asset Compression Actions
  compressAsset: (file: File, options?: any) => Promise<AssetCompression>;
  batchCompress: (files: File[], options?: any) => Promise<AssetCompression[]>;
  removeAsset: (id: string) => void;
  optimizeAssets: () => Promise<void>;
  
  // Virtual DOM Actions
  createVNode: (type: string, props: any, children?: VirtualDOMNode[]) => VirtualDOMNode;
  updateVNode: (id: string, updates: Partial<VirtualDOMNode>) => void;
  removeVNode: (id: string) => void;
  renderVDOM: () => void;
  diffVDOM: (oldTree: VirtualDOMNode[], newTree: VirtualDOMNode[]) => any[];
  
  // Performance Actions
  measurePerformance: () => Promise<PerformanceMetrics>;
  startOptimization: () => Promise<void>;
  stopOptimization: () => void;
  optimizeBundle: () => Promise<void>;
  preloadResources: (urls: string[]) => Promise<void>;
  
  // Config Actions
  updateConfig: (updates: Partial<OptimizationConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;
  
  // System Actions
  clearCache: () => void;
  garbageCollect: () => void;
  optimizeMemory: () => void;
  analyzePerformance: () => Promise<any>;
}

// Default configuration
const defaultConfig: OptimizationConfig = {
  webWorkers: {
    enabled: true,
    maxWorkers: navigator.hardwareConcurrency || 4,
    taskTimeout: 30000,
    retryAttempts: 3,
  },
  compression: {
    enabled: true,
    imageQuality: 0.8,
    videoQuality: 0.7,
    enableWebP: true,
    enableAVIF: false,
    enableBrotli: true,
  },
  virtualDOM: {
    enabled: true,
    batchUpdates: true,
    diffingStrategy: 'advanced',
    reconciliationMode: 'async',
  },
  preloading: {
    enabled: true,
    strategy: 'adaptive',
    maxPreloadSize: 10 * 1024 * 1024, // 10MB
    preloadTypes: ['image', 'video', 'audio', 'font'],
  },
  caching: {
    enabled: true,
    strategy: 'lru',
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 3600000, // 1 hour
  },
};

// Zustand store
export const usePerformanceStore = create<PerformanceStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  webWorkers: [],
  assets: [],
  virtualDOM: [],
  metrics: {
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    renderTime: 0,
    bundleSize: 0,
    loadTime: 0,
    interactionTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
  },
  config: defaultConfig,
  stats: {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    totalCompressionSaved: 0,
    renderOptimizations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryOptimizations: 0,
    networkOptimizations: 0,
  },
  isOptimizing: false,
  lastOptimization: 0,
  
  // Web Worker Actions
  addTask: (task) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: WebWorkerTask = {
      ...task,
      id,
      status: 'pending',
      progress: 0,
    };
    
    set(state => ({
      webWorkers: [...state.webWorkers, newTask],
      stats: { ...state.stats, totalTasks: state.stats.totalTasks + 1 }
    }));
    
    return id;
  },
  
  updateTask: (id, updates) => {
    set(state => ({
      webWorkers: state.webWorkers.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    }));
  },
  
  removeTask: (id) => {
    set(state => ({
      webWorkers: state.webWorkers.filter(task => task.id !== id)
    }));
  },
  
  processTask: async (id) => {
    const { updateTask } = get();
    const task = get().webWorkers.find(t => t.id === id);
    
    if (!task) throw new Error('Task not found');
    
    try {
      updateTask(id, { status: 'processing', startTime: Date.now() });
      
      // Simulate processing with Web Worker
      const result = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/performanceWorker.ts', import.meta.url));
        
        worker.postMessage({ type: task.type, data: task.data });
        
        worker.onmessage = (e) => {
          if (e.data.type === 'progress') {
            updateTask(id, { progress: e.data.progress });
          } else if (e.data.type === 'complete') {
            resolve(e.data.result);
          } else if (e.data.type === 'error') {
            reject(new Error(e.data.error));
          }
        };
        
        setTimeout(() => {
          worker.terminate();
          reject(new Error('Task timeout'));
        }, get().config.webWorkers.taskTimeout);
      });
      
      updateTask(id, { 
        status: 'completed', 
        result, 
        endTime: Date.now(),
        progress: 100 
      });
      
      set(state => ({
        stats: { ...state.stats, completedTasks: state.stats.completedTasks + 1 }
      }));
      
      return result;
    } catch (error) {
      updateTask(id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: Date.now() 
      });
      
      set(state => ({
        stats: { ...state.stats, failedTasks: state.stats.failedTasks + 1 }
      }));
      
      throw error;
    }
  },
  
  cancelTask: (id) => {
    get().updateTask(id, { status: 'failed', error: 'Cancelled by user' });
  },
  
  clearTasks: () => {
    set({ webWorkers: [] });
  },
  
  // Asset Compression Actions
  compressAsset: async (file, options = {}) => {
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const originalSize = file.size;
    
    // Simulate compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        const { imageQuality } = get().config.compression;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedSize = blob.size;
            const compressionRatio = (originalSize - compressedSize) / originalSize;
            const compressedUrl = URL.createObjectURL(blob);
            
            const asset: AssetCompression = {
              id,
              originalSize,
              compressedSize,
              compressionRatio,
              format: file.type,
              quality: imageQuality,
              type: file.type.startsWith('image/') ? 'image' : 'document',
              url: URL.createObjectURL(file),
              compressedUrl,
              metadata: {
                width: img.width,
                height: img.height,
                name: file.name,
              },
            };
            
            set(state => ({
              assets: [...state.assets, asset],
              stats: {
                ...state.stats,
                totalCompressionSaved: state.stats.totalCompressionSaved + (originalSize - compressedSize)
              }
            }));
            
            resolve(asset);
          }
        }, file.type, imageQuality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  },
  
  batchCompress: async (files, options = {}) => {
    const { compressAsset } = get();
    const results = await Promise.all(
      files.map(file => compressAsset(file, options))
    );
    return results;
  },
  
  removeAsset: (id) => {
    set(state => ({
      assets: state.assets.filter(asset => asset.id !== id)
    }));
  },
  
  optimizeAssets: async () => {
    const { assets, config } = get();
    
    // Optimize existing assets
    for (const asset of assets) {
      if (asset.compressionRatio < 0.3) {
        // Re-compress with higher compression
        // Implementation would go here
      }
    }
  },
  
  // Virtual DOM Actions
  createVNode: (type, props, children = []) => {
    const id = `vnode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const vnode: VirtualDOMNode = {
      id,
      type,
      props,
      children,
      dirty: true,
      rendered: false,
    };
    
    set(state => ({
      virtualDOM: [...state.virtualDOM, vnode]
    }));
    
    return vnode;
  },
  
  updateVNode: (id, updates) => {
    set(state => ({
      virtualDOM: state.virtualDOM.map(vnode => 
        vnode.id === id ? { ...vnode, ...updates, dirty: true } : vnode
      )
    }));
  },
  
  removeVNode: (id) => {
    set(state => ({
      virtualDOM: state.virtualDOM.filter(vnode => vnode.id !== id)
    }));
  },
  
  renderVDOM: () => {
    const { virtualDOM, config } = get();
    
    if (!config.virtualDOM.enabled) return;
    
    const dirtyNodes = virtualDOM.filter(vnode => vnode.dirty);
    
    if (config.virtualDOM.batchUpdates) {
      // Batch updates for better performance
      requestAnimationFrame(() => {
        dirtyNodes.forEach(vnode => {
          // Render virtual node to actual DOM
          // Implementation would go here
          get().updateVNode(vnode.id, { dirty: false, rendered: true });
        });
      });
    } else {
      dirtyNodes.forEach(vnode => {
        // Immediate render
        get().updateVNode(vnode.id, { dirty: false, rendered: true });
      });
    }
    
    set(state => ({
      stats: { ...state.stats, renderOptimizations: state.stats.renderOptimizations + dirtyNodes.length }
    }));
  },
  
  diffVDOM: (oldTree, newTree) => {
    const patches: any[] = [];
    
    // Simple diffing algorithm
    for (let i = 0; i < Math.max(oldTree.length, newTree.length); i++) {
      const oldNode = oldTree[i];
      const newNode = newTree[i];
      
      if (!oldNode && newNode) {
        patches.push({ type: 'CREATE', node: newNode, index: i });
      } else if (oldNode && !newNode) {
        patches.push({ type: 'REMOVE', index: i });
      } else if (oldNode && newNode && oldNode.type !== newNode.type) {
        patches.push({ type: 'REPLACE', node: newNode, index: i });
      } else if (oldNode && newNode) {
        // Check props differences
        const propPatches = Object.keys({ ...oldNode.props, ...newNode.props })
          .filter(key => oldNode.props[key] !== newNode.props[key])
          .map(key => ({ type: 'PROP_UPDATE', key, value: newNode.props[key], index: i }));
        
        patches.push(...propPatches);
      }
    }
    
    return patches;
  },
  
  // Performance Actions
  measurePerformance: async () => {
    const metrics: PerformanceMetrics = {
      fps: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      renderTime: 0,
      bundleSize: 0,
      loadTime: 0,
      interactionTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };
    
    // Measure FPS
    let frames = 0;
    const startTime = performance.now();
    
    const measureFPS = () => {
      frames++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(measureFPS);
      } else {
        metrics.fps = frames;
      }
    };
    
    requestAnimationFrame(measureFPS);
    
    // Measure memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    
    // Measure network latency
    const latencyStart = performance.now();
    try {
      await fetch('/api/ping', { method: 'HEAD' });
      metrics.networkLatency = performance.now() - latencyStart;
    } catch {
      metrics.networkLatency = -1;
    }
    
    // Measure render time
    const renderStart = performance.now();
    await new Promise(resolve => requestAnimationFrame(resolve));
    metrics.renderTime = performance.now() - renderStart;
    
    set({ metrics });
    return metrics;
  },
  
  startOptimization: async () => {
    set({ isOptimizing: true });
    
    const { measurePerformance, optimizeAssets, renderVDOM, optimizeMemory } = get();
    
    try {
      await measurePerformance();
      await optimizeAssets();
      renderVDOM();
      optimizeMemory();
      
      set({ lastOptimization: Date.now() });
    } finally {
      set({ isOptimizing: false });
    }
  },
  
  stopOptimization: () => {
    set({ isOptimizing: false });
  },
  
  optimizeBundle: async () => {
    // Simulate bundle optimization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    set(state => ({
      stats: { ...state.stats, networkOptimizations: state.stats.networkOptimizations + 1 }
    }));
  },
  
  preloadResources: async (urls) => {
    const { config } = get();
    
    if (!config.preloading.enabled) return;
    
    const preloadPromises = urls.map(url => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    });
    
    await Promise.allSettled(preloadPromises);
  },
  
  // Config Actions
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  exportConfig: () => {
    return JSON.stringify(get().config, null, 2);
  },
  
  importConfig: (configStr) => {
    try {
      const config = JSON.parse(configStr);
      set({ config: { ...defaultConfig, ...config } });
    } catch (error) {
      console.error('Failed to import config:', error);
    }
  },
  
  // System Actions
  clearCache: () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    set(state => ({
      stats: { ...state.stats, cacheHits: 0, cacheMisses: 0 }
    }));
  },
  
  garbageCollect: () => {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    set(state => ({
      stats: { ...state.stats, memoryOptimizations: state.stats.memoryOptimizations + 1 }
    }));
  },
  
  optimizeMemory: () => {
    const { assets, webWorkers } = get();
    
    // Clean up completed tasks
    const activeTasks = webWorkers.filter(task => 
      task.status === 'pending' || task.status === 'processing'
    );
    
    // Clean up old assets
    const recentAssets = assets.filter(asset => 
      Date.now() - parseInt(asset.id.split('_')[1]) < 3600000 // 1 hour
    );
    
    set({
      webWorkers: activeTasks,
      assets: recentAssets,
    });
  },
  
  analyzePerformance: async () => {
    const { metrics, stats, config } = get();
    
    const analysis = {
      score: 0,
      recommendations: [] as string[],
      bottlenecks: [] as string[],
      optimizations: [] as string[],
    };
    
    // Calculate performance score
    let score = 100;
    
    if (metrics.fps < 30) {
      score -= 20;
      analysis.bottlenecks.push('Low FPS detected');
      analysis.recommendations.push('Enable Virtual DOM optimizations');
    }
    
    if (metrics.memoryUsage > 0.8) {
      score -= 15;
      analysis.bottlenecks.push('High memory usage');
      analysis.recommendations.push('Run garbage collection more frequently');
    }
    
    if (metrics.networkLatency > 1000) {
      score -= 10;
      analysis.bottlenecks.push('High network latency');
      analysis.recommendations.push('Enable asset compression');
    }
    
    if (stats.failedTasks > stats.completedTasks * 0.1) {
      score -= 15;
      analysis.bottlenecks.push('High task failure rate');
      analysis.recommendations.push('Increase task timeout or reduce complexity');
    }
    
    analysis.score = Math.max(0, score);
    
    return analysis;
  },
})));

// Performance Manager Class
export class PerformanceManager {
  private static instance: PerformanceManager;
  private intervalId?: number;
  
  private constructor() {
    this.init();
  }
  
  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }
  
  private init() {
    // Start performance monitoring
    this.startMonitoring();
    
    // Set up automatic optimizations
    this.setupAutoOptimizations();
  }
  
  private startMonitoring() {
    this.intervalId = window.setInterval(() => {
      usePerformanceStore.getState().measurePerformance();
    }, 5000); // Every 5 seconds
  }
  
  private setupAutoOptimizations() {
    // Auto garbage collection
    setInterval(() => {
      const { metrics, optimizeMemory } = usePerformanceStore.getState();
      if (metrics.memoryUsage > 0.8) {
        optimizeMemory();
      }
    }, 30000); // Every 30 seconds
    
    // Auto render optimization
    usePerformanceStore.subscribe(
      (state) => state.virtualDOM,
      (virtualDOM) => {
        const dirtyNodes = virtualDOM.filter(node => node.dirty);
        if (dirtyNodes.length > 10) {
          usePerformanceStore.getState().renderVDOM();
        }
      }
    );
  }
  
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Global instance
export const performanceManager = PerformanceManager.getInstance();

// Utility functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const getPerformanceIcon = (score: number): string => {
  if (score >= 90) return '🚀';
  if (score >= 70) return '⚡';
  if (score >= 50) return '⚠️';
  return '🐌';
};

export const getOptimizationColor = (type: string): string => {
  const colors = {
    'web-worker': 'blue',
    'compression': 'green',
    'virtual-dom': 'purple',
    'preloading': 'orange',
    'caching': 'indigo',
    'memory': 'red',
    'network': 'yellow',
  };
  return colors[type as keyof typeof colors] || 'gray';
};

// Custom hook
export const usePerformanceOptimizer = () => {
  const store = usePerformanceStore();
  
  return {
    ...store,
    
    // Computed values
    totalTasks: store.webWorkers.length,
    activeTasks: store.webWorkers.filter(t => t.status === 'processing').length,
    completionRate: store.stats.totalTasks > 0 
      ? store.stats.completedTasks / store.stats.totalTasks 
      : 0,
    compressionSavings: store.assets.reduce((sum, asset) => 
      sum + (asset.originalSize - asset.compressedSize), 0
    ),
    averageCompressionRatio: store.assets.length > 0
      ? store.assets.reduce((sum, asset) => sum + asset.compressionRatio, 0) / store.assets.length
      : 0,
    
    // Quick actions
    quickOptimize: async () => {
      await store.startOptimization();
    },
    
    quickCompress: async (files: File[]) => {
      return await store.batchCompress(files);
    },
    
    quickAnalyze: async () => {
      return await store.analyzePerformance();
    },
  };
};