import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types and Interfaces
export interface Asset {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'font' | 'script' | 'style' | 'document';
  size: number;
  compressedSize?: number;
  compressionRatio?: number;
  format: string;
  quality: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  loadStrategy: 'eager' | 'lazy' | 'preload' | 'prefetch';
  status: 'pending' | 'optimizing' | 'optimized' | 'failed' | 'cached';
  lastModified: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
  dependencies?: string[];
  error?: string;
}

export interface CompressionConfig {
  images: {
    webp: { quality: number; enabled: boolean };
    avif: { quality: number; enabled: boolean };
    jpeg: { quality: number; enabled: boolean };
    png: { compressionLevel: number; enabled: boolean };
  };
  videos: {
    h264: { crf: number; enabled: boolean };
    h265: { crf: number; enabled: boolean };
    vp9: { crf: number; enabled: boolean };
    av1: { crf: number; enabled: boolean };
  };
  audio: {
    mp3: { bitrate: number; enabled: boolean };
    aac: { bitrate: number; enabled: boolean };
    opus: { bitrate: number; enabled: boolean };
  };
  fonts: {
    woff2: { enabled: boolean };
    subset: { enabled: boolean; characters?: string };
  };
  scripts: {
    minify: { enabled: boolean };
    treeshake: { enabled: boolean };
    gzip: { enabled: boolean };
    brotli: { enabled: boolean };
  };
}

export interface PreloadStrategy {
  id: string;
  name: string;
  rules: {
    condition: string;
    assets: string[];
    priority: number;
    timing: 'immediate' | 'idle' | 'interaction' | 'viewport';
  }[];
  enabled: boolean;
}

export interface OptimizationTask {
  id: string;
  assetId: string;
  type: 'compress' | 'convert' | 'resize' | 'optimize';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
  result?: {
    originalSize: number;
    optimizedSize: number;
    savings: number;
    format?: string;
  };
}

export interface AssetOptimizationConfig {
  enabled: boolean;
  autoOptimize: boolean;
  compressionConfig: CompressionConfig;
  preloadStrategies: PreloadStrategy[];
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
  maxCacheSize: number;
  cleanupInterval: number;
  qualityThreshold: number;
  sizeThreshold: number;
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  debug: boolean;
}

export interface AssetOptimizationStats {
  totalAssets: number;
  optimizedAssets: number;
  totalSavings: number;
  averageCompressionRatio: number;
  cacheHitRate: number;
  loadTime: number;
  bandwidthSaved: number;
  optimizationTime: number;
  failedOptimizations: number;
  queueSize: number;
}

export interface AssetOptimizationMetrics {
  compressionRatios: { [format: string]: number };
  loadTimes: { [type: string]: number };
  cachePerformance: {
    hits: number;
    misses: number;
    evictions: number;
  };
  bandwidthUsage: {
    original: number;
    optimized: number;
    saved: number;
  };
  qualityMetrics: {
    [type: string]: {
      ssim: number;
      psnr: number;
      vmaf?: number;
    };
  };
}

export interface AssetOptimizationEvent {
  id: string;
  type: 'optimization_started' | 'optimization_completed' | 'optimization_failed' | 'cache_hit' | 'cache_miss' | 'preload_triggered' | 'strategy_applied';
  assetId?: string;
  timestamp: number;
  data?: any;
  success: boolean;
  duration?: number;
  error?: string;
}

export interface AssetOptimizationDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  data?: any;
  assetId?: string;
  taskId?: string;
}

// Store Interface
interface AssetOptimizationStore {
  // State
  assets: Asset[];
  tasks: OptimizationTask[];
  config: AssetOptimizationConfig;
  stats: AssetOptimizationStats;
  metrics: AssetOptimizationMetrics;
  events: AssetOptimizationEvent[];
  debugLogs: AssetOptimizationDebugLog[];
  isOptimizing: boolean;
  isLoading: boolean;
  error: string | null;

  // Asset Management
  addAsset: (asset: Omit<Asset, 'id' | 'lastModified' | 'accessCount' | 'lastAccessed'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  getAsset: (id: string) => Asset | undefined;
  getAssetsByType: (type: Asset['type']) => Asset[];
  getAssetsByPriority: (priority: Asset['priority']) => Asset[];
  getAssetsByStatus: (status: Asset['status']) => Asset[];

  // Optimization
  optimizeAsset: (assetId: string, options?: { force?: boolean; quality?: number }) => Promise<void>;
  optimizeAssets: (assetIds: string[], options?: { batchSize?: number; concurrency?: number }) => Promise<void>;
  optimizeAll: (options?: { filter?: (asset: Asset) => boolean }) => Promise<void>;
  cancelOptimization: (taskId: string) => void;
  retryFailedOptimizations: () => Promise<void>;

  // Compression
  compressImage: (asset: Asset, format?: string, quality?: number) => Promise<Asset>;
  compressVideo: (asset: Asset, codec?: string, quality?: number) => Promise<Asset>;
  compressAudio: (asset: Asset, codec?: string, bitrate?: number) => Promise<Asset>;
  compressFont: (asset: Asset, subset?: string) => Promise<Asset>;
  compressScript: (asset: Asset, options?: { minify?: boolean; gzip?: boolean }) => Promise<Asset>;

  // Preloading
  preloadAsset: (assetId: string, priority?: number) => Promise<void>;
  preloadAssets: (assetIds: string[]) => Promise<void>;
  applyPreloadStrategy: (strategyId: string) => Promise<void>;
  createPreloadStrategy: (strategy: Omit<PreloadStrategy, 'id'>) => void;
  updatePreloadStrategy: (id: string, updates: Partial<PreloadStrategy>) => void;
  removePreloadStrategy: (id: string) => void;

  // Configuration
  updateConfig: (updates: Partial<AssetOptimizationConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;

  // Analytics
  getStats: () => AssetOptimizationStats;
  getMetrics: () => AssetOptimizationMetrics;
  calculateSavings: () => { size: number; bandwidth: number; time: number };
  generateReport: () => any;

  // Events
  addEvent: (event: Omit<AssetOptimizationEvent, 'id' | 'timestamp'>) => void;
  getEvents: (filter?: { type?: string; assetId?: string; limit?: number }) => AssetOptimizationEvent[];
  clearEvents: () => void;

  // Utilities
  clearCache: () => void;
  cleanup: () => void;
  validateAsset: (asset: Asset) => { valid: boolean; errors: string[] };
  estimateOptimization: (asset: Asset) => { estimatedSize: number; estimatedSavings: number; estimatedTime: number };

  // Quick Actions
  quickOptimize: (url: string, type: Asset['type']) => Promise<Asset>;
  quickPreload: (urls: string[]) => Promise<void>;
  quickCompress: (file: File, options?: { quality?: number; format?: string }) => Promise<Blob>;

  // Advanced Features
  createOptimizationPipeline: (steps: string[]) => Promise<void>;
  scheduleOptimization: (assetId: string, delay: number) => void;
  batchOptimize: (assets: Asset[], options?: { concurrency?: number }) => Promise<void>;
  smartOptimize: (asset: Asset) => Promise<Asset>;
  adaptiveQuality: (asset: Asset, targetSize: number) => Promise<Asset>;

  // System Operations
  start: () => void;
  stop: () => void;
  restart: () => void;
  getSystemInfo: () => any;
  checkHealth: () => { healthy: boolean; issues: string[] };

  // Debug
  addDebugLog: (log: Omit<AssetOptimizationDebugLog, 'id' | 'timestamp'>) => void;
  getDebugLogs: (filter?: { level?: string; limit?: number }) => AssetOptimizationDebugLog[];
  clearDebugLogs: () => void;
  enableDebug: () => void;
  disableDebug: () => void;
}

// Default Configuration
const defaultConfig: AssetOptimizationConfig = {
  enabled: true,
  autoOptimize: true,
  compressionConfig: {
    images: {
      webp: { quality: 85, enabled: true },
      avif: { quality: 80, enabled: true },
      jpeg: { quality: 85, enabled: true },
      png: { compressionLevel: 6, enabled: true }
    },
    videos: {
      h264: { crf: 23, enabled: true },
      h265: { crf: 28, enabled: true },
      vp9: { crf: 30, enabled: true },
      av1: { crf: 32, enabled: false }
    },
    audio: {
      mp3: { bitrate: 192, enabled: true },
      aac: { bitrate: 128, enabled: true },
      opus: { bitrate: 96, enabled: true }
    },
    fonts: {
      woff2: { enabled: true },
      subset: { enabled: true }
    },
    scripts: {
      minify: { enabled: true },
      treeshake: { enabled: true },
      gzip: { enabled: true },
      brotli: { enabled: true }
    }
  },
  preloadStrategies: [
    {
      id: 'critical-resources',
      name: 'Critical Resources',
      rules: [
        {
          condition: 'page-load',
          assets: ['fonts', 'critical-css'],
          priority: 1,
          timing: 'immediate'
        }
      ],
      enabled: true
    }
  ],
  cacheStrategy: 'moderate',
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  cleanupInterval: 300000, // 5 minutes
  qualityThreshold: 0.95,
  sizeThreshold: 1024 * 1024, // 1MB
  batchSize: 10,
  concurrency: 3,
  retryAttempts: 3,
  debug: false
};

// Zustand Store
export const useAssetOptimizationStore = create<AssetOptimizationStore>()(devtools(
  (set, get) => ({
    // Initial State
    assets: [],
    tasks: [],
    config: defaultConfig,
    stats: {
      totalAssets: 0,
      optimizedAssets: 0,
      totalSavings: 0,
      averageCompressionRatio: 0,
      cacheHitRate: 0,
      loadTime: 0,
      bandwidthSaved: 0,
      optimizationTime: 0,
      failedOptimizations: 0,
      queueSize: 0
    },
    metrics: {
      compressionRatios: {},
      loadTimes: {},
      cachePerformance: { hits: 0, misses: 0, evictions: 0 },
      bandwidthUsage: { original: 0, optimized: 0, saved: 0 },
      qualityMetrics: {}
    },
    events: [],
    debugLogs: [],
    isOptimizing: false,
    isLoading: false,
    error: null,

    // Asset Management
    addAsset: (assetData) => {
      const asset: Asset = {
        ...assetData,
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastModified: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now()
      };

      set((state) => ({
        assets: [...state.assets, asset],
        stats: {
          ...state.stats,
          totalAssets: state.stats.totalAssets + 1
        }
      }));

      get().addEvent({
        type: 'optimization_started',
        assetId: asset.id,
        success: true
      });

      if (get().config.debug) {
        get().addDebugLog({
          level: 'info',
          message: `Asset added: ${asset.url}`,
          assetId: asset.id
        });
      }
    },

    updateAsset: (id, updates) => {
      set((state) => ({
        assets: state.assets.map(asset => 
          asset.id === id 
            ? { ...asset, ...updates, lastModified: Date.now() }
            : asset
        )
      }));
    },

    removeAsset: (id) => {
      set((state) => ({
        assets: state.assets.filter(asset => asset.id !== id),
        stats: {
          ...state.stats,
          totalAssets: Math.max(0, state.stats.totalAssets - 1)
        }
      }));
    },

    getAsset: (id) => {
      return get().assets.find(asset => asset.id === id);
    },

    getAssetsByType: (type) => {
      return get().assets.filter(asset => asset.type === type);
    },

    getAssetsByPriority: (priority) => {
      return get().assets.filter(asset => asset.priority === priority);
    },

    getAssetsByStatus: (status) => {
      return get().assets.filter(asset => asset.status === status);
    },

    // Optimization
    optimizeAsset: async (assetId, options = {}) => {
      const asset = get().getAsset(assetId);
      if (!asset) return;

      if (asset.status === 'optimizing' && !options.force) {
        return;
      }

      const task: OptimizationTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        type: 'optimize',
        status: 'processing',
        progress: 0,
        startTime: Date.now()
      };

      set((state) => ({
        tasks: [...state.tasks, task],
        isOptimizing: true
      }));

      get().updateAsset(assetId, { status: 'optimizing' });

      try {
        // Simulate optimization process
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          set((state) => ({
            tasks: state.tasks.map(t => 
              t.id === task.id ? { ...t, progress } : t
            )
          }));
        }

        // Calculate compression results
        const originalSize = asset.size;
        const compressionRatio = 0.3 + Math.random() * 0.4; // 30-70% compression
        const optimizedSize = Math.floor(originalSize * compressionRatio);
        const savings = originalSize - optimizedSize;

        const result = {
          originalSize,
          optimizedSize,
          savings
        };

        // Update task
        set((state) => ({
          tasks: state.tasks.map(t => 
            t.id === task.id 
              ? { ...t, status: 'completed', progress: 100, endTime: Date.now(), result }
              : t
          )
        }));

        // Update asset
        get().updateAsset(assetId, {
          status: 'optimized',
          compressedSize: optimizedSize,
          compressionRatio: 1 - compressionRatio
        });

        // Update stats
        set((state) => ({
          stats: {
            ...state.stats,
            optimizedAssets: state.stats.optimizedAssets + 1,
            totalSavings: state.stats.totalSavings + savings
          }
        }));

        get().addEvent({
          type: 'optimization_completed',
          assetId,
          success: true,
          duration: Date.now() - task.startTime
        });

        if (get().config.debug) {
          get().addDebugLog({
            level: 'info',
            message: `Asset optimized: ${asset.url} (${formatBytes(savings)} saved)`,
            assetId
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        set((state) => ({
          tasks: state.tasks.map(t => 
            t.id === task.id 
              ? { ...t, status: 'failed', error: errorMessage, endTime: Date.now() }
              : t
          )
        }));

        get().updateAsset(assetId, { status: 'failed', error: errorMessage });

        get().addEvent({
          type: 'optimization_failed',
          assetId,
          success: false,
          error: errorMessage
        });

        if (get().config.debug) {
          get().addDebugLog({
            level: 'error',
            message: `Asset optimization failed: ${asset.url} - ${errorMessage}`,
            assetId
          });
        }
      } finally {
        set((state) => ({
          isOptimizing: state.tasks.some(t => t.status === 'processing')
        }));
      }
    },

    optimizeAssets: async (assetIds, options = {}) => {
      const { batchSize = get().config.batchSize, concurrency = get().config.concurrency } = options;
      
      for (let i = 0; i < assetIds.length; i += batchSize) {
        const batch = assetIds.slice(i, i + batchSize);
        const promises = batch.slice(0, concurrency).map(id => get().optimizeAsset(id));
        await Promise.all(promises);
      }
    },

    optimizeAll: async (options = {}) => {
      const { filter } = options;
      const assets = filter ? get().assets.filter(filter) : get().assets;
      const assetIds = assets
        .filter(asset => asset.status !== 'optimized' && asset.status !== 'optimizing')
        .map(asset => asset.id);
      
      await get().optimizeAssets(assetIds);
    },

    cancelOptimization: (taskId) => {
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId && task.status === 'processing'
            ? { ...task, status: 'failed', error: 'Cancelled by user', endTime: Date.now() }
            : task
        )
      }));
    },

    retryFailedOptimizations: async () => {
      const failedAssets = get().assets.filter(asset => asset.status === 'failed');
      const assetIds = failedAssets.map(asset => asset.id);
      await get().optimizeAssets(assetIds);
    },

    // Compression Methods (simplified implementations)
    compressImage: async (asset, format, quality) => {
      // Simulate image compression
      await new Promise(resolve => setTimeout(resolve, 1000));
      const compressionRatio = 0.4 + Math.random() * 0.3;
      return {
        ...asset,
        compressedSize: Math.floor(asset.size * compressionRatio),
        compressionRatio: 1 - compressionRatio,
        format: format || asset.format,
        quality: quality || asset.quality
      };
    },

    compressVideo: async (asset, codec, quality) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const compressionRatio = 0.2 + Math.random() * 0.3;
      return {
        ...asset,
        compressedSize: Math.floor(asset.size * compressionRatio),
        compressionRatio: 1 - compressionRatio,
        format: codec || asset.format,
        quality: quality || asset.quality
      };
    },

    compressAudio: async (asset, codec, bitrate) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const compressionRatio = 0.3 + Math.random() * 0.2;
      return {
        ...asset,
        compressedSize: Math.floor(asset.size * compressionRatio),
        compressionRatio: 1 - compressionRatio,
        format: codec || asset.format
      };
    },

    compressFont: async (asset, subset) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const compressionRatio = 0.6 + Math.random() * 0.2;
      return {
        ...asset,
        compressedSize: Math.floor(asset.size * compressionRatio),
        compressionRatio: 1 - compressionRatio
      };
    },

    compressScript: async (asset, options = {}) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const compressionRatio = 0.5 + Math.random() * 0.3;
      return {
        ...asset,
        compressedSize: Math.floor(asset.size * compressionRatio),
        compressionRatio: 1 - compressionRatio
      };
    },

    // Preloading
    preloadAsset: async (assetId, priority = 1) => {
      const asset = get().getAsset(assetId);
      if (!asset) return;

      // Simulate preloading
      await new Promise(resolve => setTimeout(resolve, 200));
      
      get().updateAsset(assetId, {
        accessCount: asset.accessCount + 1,
        lastAccessed: Date.now()
      });

      get().addEvent({
        type: 'preload_triggered',
        assetId,
        success: true
      });
    },

    preloadAssets: async (assetIds) => {
      const promises = assetIds.map(id => get().preloadAsset(id));
      await Promise.all(promises);
    },

    applyPreloadStrategy: async (strategyId) => {
      const strategy = get().config.preloadStrategies.find(s => s.id === strategyId);
      if (!strategy || !strategy.enabled) return;

      for (const rule of strategy.rules) {
        // Simulate strategy application
        await new Promise(resolve => setTimeout(resolve, 100));
        
        get().addEvent({
          type: 'strategy_applied',
          success: true,
          data: { strategyId, rule: rule.condition }
        });
      }
    },

    createPreloadStrategy: (strategyData) => {
      const strategy: PreloadStrategy = {
        ...strategyData,
        id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      set((state) => ({
        config: {
          ...state.config,
          preloadStrategies: [...state.config.preloadStrategies, strategy]
        }
      }));
    },

    updatePreloadStrategy: (id, updates) => {
      set((state) => ({
        config: {
          ...state.config,
          preloadStrategies: state.config.preloadStrategies.map(strategy => 
            strategy.id === id ? { ...strategy, ...updates } : strategy
          )
        }
      }));
    },

    removePreloadStrategy: (id) => {
      set((state) => ({
        config: {
          ...state.config,
          preloadStrategies: state.config.preloadStrategies.filter(strategy => strategy.id !== id)
        }
      }));
    },

    // Configuration
    updateConfig: (updates) => {
      set((state) => ({
        config: { ...state.config, ...updates }
      }));
    },

    resetConfig: () => {
      set({ config: defaultConfig });
    },

    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },

    importConfig: (configString) => {
      try {
        const config = JSON.parse(configString);
        set({ config: { ...defaultConfig, ...config } });
      } catch (error) {
        console.error('Failed to import config:', error);
      }
    },

    // Analytics
    getStats: () => {
      const state = get();
      const optimizedAssets = state.assets.filter(asset => asset.status === 'optimized');
      const totalSavings = optimizedAssets.reduce((sum, asset) => 
        sum + (asset.size - (asset.compressedSize || asset.size)), 0
      );
      const averageCompressionRatio = optimizedAssets.length > 0 
        ? optimizedAssets.reduce((sum, asset) => sum + (asset.compressionRatio || 0), 0) / optimizedAssets.length
        : 0;

      return {
        ...state.stats,
        totalAssets: state.assets.length,
        optimizedAssets: optimizedAssets.length,
        totalSavings,
        averageCompressionRatio,
        queueSize: state.tasks.filter(task => task.status === 'pending' || task.status === 'processing').length
      };
    },

    getMetrics: () => {
      return get().metrics;
    },

    calculateSavings: () => {
      const assets = get().assets;
      const optimizedAssets = assets.filter(asset => asset.status === 'optimized');
      
      const sizeSavings = optimizedAssets.reduce((sum, asset) => 
        sum + (asset.size - (asset.compressedSize || asset.size)), 0
      );
      
      const bandwidthSavings = sizeSavings * 0.8; // Estimate
      const timeSavings = sizeSavings / (1024 * 1024) * 100; // Estimate ms saved per MB
      
      return {
        size: sizeSavings,
        bandwidth: bandwidthSavings,
        time: timeSavings
      };
    },

    generateReport: () => {
      const state = get();
      return {
        timestamp: Date.now(),
        assets: state.assets.length,
        optimized: state.assets.filter(a => a.status === 'optimized').length,
        stats: get().getStats(),
        metrics: state.metrics,
        config: state.config,
        recentEvents: state.events.slice(-10)
      };
    },

    // Events
    addEvent: (eventData) => {
      const event: AssetOptimizationEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      set((state) => ({
        events: [...state.events.slice(-999), event] // Keep last 1000 events
      }));
    },

    getEvents: (filter = {}) => {
      const { type, assetId, limit = 100 } = filter;
      let events = get().events;
      
      if (type) {
        events = events.filter(event => event.type === type);
      }
      
      if (assetId) {
        events = events.filter(event => event.assetId === assetId);
      }
      
      return events.slice(-limit);
    },

    clearEvents: () => {
      set({ events: [] });
    },

    // Utilities
    clearCache: () => {
      set((state) => ({
        assets: state.assets.map(asset => ({ ...asset, status: 'pending' as const })),
        tasks: [],
        metrics: {
          ...state.metrics,
          cachePerformance: { hits: 0, misses: 0, evictions: 0 }
        }
      }));
    },

    cleanup: () => {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      set((state) => ({
        events: state.events.filter(event => now - event.timestamp < maxAge),
        debugLogs: state.debugLogs.filter(log => now - log.timestamp < maxAge),
        tasks: state.tasks.filter(task => 
          task.status === 'processing' || (task.endTime && now - task.endTime < maxAge)
        )
      }));
    },

    validateAsset: (asset) => {
      const errors: string[] = [];
      
      if (!asset.url) errors.push('URL is required');
      if (!asset.type) errors.push('Type is required');
      if (asset.size <= 0) errors.push('Size must be positive');
      if (!asset.format) errors.push('Format is required');
      
      return {
        valid: errors.length === 0,
        errors
      };
    },

    estimateOptimization: (asset) => {
      const compressionRatios = {
        image: 0.4,
        video: 0.25,
        audio: 0.35,
        font: 0.7,
        script: 0.6,
        style: 0.5,
        document: 0.8
      };
      
      const ratio = compressionRatios[asset.type] || 0.5;
      const estimatedSize = Math.floor(asset.size * ratio);
      const estimatedSavings = asset.size - estimatedSize;
      const estimatedTime = Math.max(500, asset.size / (1024 * 1024) * 1000); // 1s per MB minimum
      
      return {
        estimatedSize,
        estimatedSavings,
        estimatedTime
      };
    },

    // Quick Actions
    quickOptimize: async (url, type) => {
      const asset: Asset = {
        id: `quick_${Date.now()}`,
        url,
        type,
        size: Math.floor(Math.random() * 5000000) + 100000, // Random size
        format: type === 'image' ? 'jpeg' : type === 'video' ? 'mp4' : 'unknown',
        quality: 85,
        priority: 'medium',
        loadStrategy: 'lazy',
        status: 'pending',
        lastModified: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now()
      };
      
      get().addAsset(asset);
      await get().optimizeAsset(asset.id);
      return get().getAsset(asset.id)!;
    },

    quickPreload: async (urls) => {
      const assetIds: string[] = [];
      
      for (const url of urls) {
        const existingAsset = get().assets.find(asset => asset.url === url);
        if (existingAsset) {
          assetIds.push(existingAsset.id);
        } else {
          const asset: Asset = {
            id: `preload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url,
            type: 'document',
            size: 50000,
            format: 'html',
            quality: 100,
            priority: 'high',
            loadStrategy: 'preload',
            status: 'pending',
            lastModified: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now()
          };
          
          get().addAsset(asset);
          assetIds.push(asset.id);
        }
      }
      
      await get().preloadAssets(assetIds);
    },

    quickCompress: async (file, options = {}) => {
      // Simulate file compression
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const compressionRatio = 0.3 + Math.random() * 0.4;
      const compressedSize = Math.floor(file.size * compressionRatio);
      
      // Create a mock compressed blob
      const compressedBlob = new Blob(['compressed data'], { type: file.type });
      Object.defineProperty(compressedBlob, 'size', { value: compressedSize });
      
      return compressedBlob;
    },

    // Advanced Features
    createOptimizationPipeline: async (steps) => {
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (get().config.debug) {
          get().addDebugLog({
            level: 'info',
            message: `Pipeline step executed: ${step}`
          });
        }
      }
    },

    scheduleOptimization: (assetId, delay) => {
      setTimeout(() => {
        get().optimizeAsset(assetId);
      }, delay);
    },

    batchOptimize: async (assets, options = {}) => {
      const { concurrency = get().config.concurrency } = options;
      const assetIds = assets.map(asset => asset.id);
      await get().optimizeAssets(assetIds, { concurrency });
    },

    smartOptimize: async (asset) => {
      // Intelligent optimization based on asset characteristics
      const estimate = get().estimateOptimization(asset);
      
      if (estimate.estimatedSavings < get().config.sizeThreshold) {
        return asset; // Skip optimization for small savings
      }
      
      await get().optimizeAsset(asset.id);
      return get().getAsset(asset.id) || asset;
    },

    adaptiveQuality: async (asset, targetSize) => {
      // Adjust quality to meet target size
      let quality = asset.quality;
      let currentAsset = asset;
      
      while (currentAsset.compressedSize && currentAsset.compressedSize > targetSize && quality > 10) {
        quality -= 10;
        currentAsset = await get().compressImage(currentAsset, undefined, quality);
      }
      
      return currentAsset;
    },

    // System Operations
    start: () => {
      set({ isLoading: false, error: null });
      
      if (get().config.debug) {
        get().addDebugLog({
          level: 'info',
          message: 'Asset optimization system started'
        });
      }
    },

    stop: () => {
      set({ isOptimizing: false });
      
      if (get().config.debug) {
        get().addDebugLog({
          level: 'info',
          message: 'Asset optimization system stopped'
        });
      }
    },

    restart: () => {
      get().stop();
      setTimeout(() => get().start(), 1000);
    },

    getSystemInfo: () => {
      const state = get();
      return {
        version: '1.0.0',
        uptime: Date.now(),
        assets: state.assets.length,
        tasks: state.tasks.length,
        events: state.events.length,
        config: state.config,
        performance: {
          memoryUsage: 'N/A',
          cpuUsage: 'N/A'
        }
      };
    },

    checkHealth: () => {
      const state = get();
      const issues: string[] = [];
      
      if (state.tasks.filter(t => t.status === 'failed').length > 10) {
        issues.push('High number of failed tasks');
      }
      
      if (state.assets.length > 1000) {
        issues.push('Large number of assets may impact performance');
      }
      
      return {
        healthy: issues.length === 0,
        issues
      };
    },

    // Debug
    addDebugLog: (logData) => {
      const log: AssetOptimizationDebugLog = {
        ...logData,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      set((state) => ({
        debugLogs: [...state.debugLogs.slice(-999), log] // Keep last 1000 logs
      }));
    },

    getDebugLogs: (filter = {}) => {
      const { level, limit = 100 } = filter;
      let logs = get().debugLogs;
      
      if (level) {
        logs = logs.filter(log => log.level === level);
      }
      
      return logs.slice(-limit);
    },

    clearDebugLogs: () => {
      set({ debugLogs: [] });
    },

    enableDebug: () => {
      get().updateConfig({ debug: true });
    },

    disableDebug: () => {
      get().updateConfig({ debug: false });
    }
  }),
  { name: 'asset-optimization-store' }
));

// Asset Optimization Manager Class
export class AssetOptimizationManager {
  private static instance: AssetOptimizationManager;
  private store = useAssetOptimizationStore;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AssetOptimizationManager {
    if (!AssetOptimizationManager.instance) {
      AssetOptimizationManager.instance = new AssetOptimizationManager();
    }
    return AssetOptimizationManager.instance;
  }

  private initialize() {
    // Start cleanup interval
    setInterval(() => {
      this.store.getState().cleanup();
    }, this.store.getState().config.cleanupInterval);

    // Auto-optimize if enabled
    if (this.store.getState().config.autoOptimize) {
      this.store.getState().start();
    }
  }

  public getStore() {
    return this.store;
  }
}

// Global instance
export const assetOptimizationManager = AssetOptimizationManager.getInstance();

// Utility Functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const getAssetTypeColor = (type: Asset['type']): string => {
  const colors = {
    image: 'text-blue-600',
    video: 'text-purple-600',
    audio: 'text-green-600',
    font: 'text-orange-600',
    script: 'text-yellow-600',
    style: 'text-pink-600',
    document: 'text-gray-600'
  };
  return colors[type] || 'text-gray-600';
};

export const getPriorityColor = (priority: Asset['priority']): string => {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status: Asset['status']): string => {
  const colors = {
    pending: 'bg-gray-100 text-gray-800',
    optimizing: 'bg-blue-100 text-blue-800',
    optimized: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cached: 'bg-purple-100 text-purple-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getAssetTypeIcon = (type: Asset['type']): string => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    font: '🔤',
    script: '📜',
    style: '🎨',
    document: '📄'
  };
  return icons[type] || '📄';
};

export const getCompressionIcon = (ratio: number): string => {
  if (ratio > 0.7) return '🔥'; // Excellent compression
  if (ratio > 0.5) return '✨'; // Good compression
  if (ratio > 0.3) return '👍'; // Decent compression
  return '📦'; // Basic compression
};