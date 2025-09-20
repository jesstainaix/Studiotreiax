import { create } from 'zustand';

// Types and Interfaces
export interface BundleChunk {
  id: string;
  name: string;
  size: number;
  gzipSize: number;
  modules: string[];
  dependencies: string[];
  loadTime: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'entry' | 'vendor' | 'async' | 'shared';
  route?: string;
  isLoaded: boolean;
  loadCount: number;
  lastAccessed: number;
  cacheHit: boolean;
}

export interface ModuleInfo {
  id: string;
  path: string;
  size: number;
  imports: string[];
  exports: string[];
  isAsync: boolean;
  chunkId?: string;
  loadTime: number;
  usageCount: number;
  lastUsed: number;
}

export interface LoadingStrategy {
  id: string;
  name: string;
  type: 'preload' | 'prefetch' | 'lazy' | 'eager';
  condition: string;
  priority: number;
  routes: string[];
  chunks: string[];
  isActive: boolean;
}

export interface BundleAnalysis {
  id: string;
  timestamp: number;
  totalSize: number;
  gzipSize: number;
  chunkCount: number;
  moduleCount: number;
  duplicateModules: string[];
  unusedModules: string[];
  largestChunks: BundleChunk[];
  recommendations: BundleRecommendation[];
}

export interface BundleRecommendation {
  id: string;
  type: 'split' | 'merge' | 'lazy' | 'preload' | 'remove';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savings: number;
  effort: 'easy' | 'medium' | 'hard';
  chunks: string[];
  modules: string[];
}

export interface BundleConfig {
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  chunkSizeLimit: number;
  moduleThreshold: number;
  cacheStrategy: 'aggressive' | 'normal' | 'conservative';
  compressionLevel: number;
  enableTreeShaking: boolean;
  enableMinification: boolean;
  sourceMaps: boolean;
}

export interface BundleStats {
  totalChunks: number;
  totalModules: number;
  totalSize: number;
  gzipSize: number;
  loadTime: number;
  cacheHitRate: number;
  compressionRatio: number;
  duplicateCount: number;
  unusedCount: number;
  lastOptimized: number;
}

export interface BundleMetrics {
  loadTimes: number[];
  chunkSizes: number[];
  cacheHits: number;
  cacheMisses: number;
  optimizationSavings: number;
  performanceScore: number;
}

export interface BundleEvent {
  id: string;
  type: 'chunk_loaded' | 'module_loaded' | 'optimization_applied' | 'cache_hit' | 'cache_miss' | 'error';
  timestamp: number;
  chunkId?: string;
  moduleId?: string;
  loadTime?: number;
  size?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BundleDebugLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  data?: any;
}

// Store State
interface BundleOptimizationState {
  // Core State
  chunks: BundleChunk[];
  modules: ModuleInfo[];
  strategies: LoadingStrategy[];
  analyses: BundleAnalysis[];
  config: BundleConfig;
  stats: BundleStats;
  metrics: BundleMetrics;
  events: BundleEvent[];
  debugLogs: BundleDebugLog[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  actions: {
    // Chunk Management
    addChunk: (chunk: Omit<BundleChunk, 'id' | 'isLoaded' | 'loadCount' | 'lastAccessed' | 'cacheHit'>) => void;
    removeChunk: (chunkId: string) => void;
    updateChunk: (chunkId: string, updates: Partial<BundleChunk>) => void;
    loadChunk: (chunkId: string) => Promise<void>;
    unloadChunk: (chunkId: string) => void;
    
    // Module Management
    addModule: (module: Omit<ModuleInfo, 'id' | 'loadTime' | 'usageCount' | 'lastUsed'>) => void;
    removeModule: (moduleId: string) => void;
    updateModule: (moduleId: string, updates: Partial<ModuleInfo>) => void;
    trackModuleUsage: (moduleId: string) => void;
    
    // Strategy Management
    addStrategy: (strategy: Omit<LoadingStrategy, 'id'>) => void;
    removeStrategy: (strategyId: string) => void;
    updateStrategy: (strategyId: string, updates: Partial<LoadingStrategy>) => void;
    activateStrategy: (strategyId: string) => void;
    deactivateStrategy: (strategyId: string) => void;
    
    // Analysis
    runAnalysis: () => Promise<BundleAnalysis>;
    applyRecommendation: (recommendationId: string) => Promise<void>;
    
    // Configuration
    updateConfig: (updates: Partial<BundleConfig>) => void;
    resetConfig: () => void;
    
    // Analytics
    trackEvent: (event: Omit<BundleEvent, 'id' | 'timestamp'>) => void;
    getMetrics: () => BundleMetrics;
    clearEvents: () => void;
    
    // Utilities
    optimizeBundle: () => Promise<void>;
    clearCache: () => void;
    exportAnalysis: () => string;
    importAnalysis: (data: string) => void;
  };
  
  // Quick Actions
  quickActions: {
    enableCodeSplitting: () => void;
    enableLazyLoading: () => void;
    optimizeForPerformance: () => void;
    optimizeForSize: () => void;
    createRouteBasedSplitting: () => void;
    createVendorSplitting: () => void;
    setupPreloadStrategy: () => void;
    generateReport: () => void;
  };
  
  // Advanced Features
  advanced: {
    predictiveLoading: (route: string) => Promise<void>;
    intelligentPrefetch: () => Promise<void>;
    dynamicImportOptimization: () => Promise<void>;
    bundleTreeShaking: () => Promise<void>;
    compressionOptimization: () => Promise<void>;
    cacheOptimization: () => Promise<void>;
    performanceAnalysis: () => Promise<BundleAnalysis>;
    sizeBudgetCheck: () => Promise<boolean>;
  };
  
  // System Operations
  system: {
    validateChunks: () => boolean;
    optimizeStorage: () => void;
    cleanup: () => void;
    reset: () => void;
    backup: () => string;
    restore: (data: string) => void;
    getSystemInfo: () => Record<string, any>;
  };
  
  // Debug
  debug: {
    isEnabled: boolean;
    logs: BundleDebugLog[];
    enable: () => void;
    disable: () => void;
    clear: () => void;
    log: (level: BundleDebugLog['level'], component: string, message: string, data?: any) => void;
  };
}

// Default Configuration
const defaultConfig: BundleConfig = {
  enableCodeSplitting: true,
  enableLazyLoading: true,
  enablePreloading: true,
  chunkSizeLimit: 250000, // 250KB
  moduleThreshold: 50,
  cacheStrategy: 'normal',
  compressionLevel: 6,
  enableTreeShaking: true,
  enableMinification: true,
  sourceMaps: false
};

// Zustand Store
export const useBundleOptimizationStore = create<BundleOptimizationState>((set, get) => ({
  // Initial State
  chunks: [],
  modules: [],
  strategies: [],
  analyses: [],
  config: defaultConfig,
  stats: {
    totalChunks: 0,
    totalModules: 0,
    totalSize: 0,
    gzipSize: 0,
    loadTime: 0,
    cacheHitRate: 0,
    compressionRatio: 0,
    duplicateCount: 0,
    unusedCount: 0,
    lastOptimized: 0
  },
  metrics: {
    loadTimes: [],
    chunkSizes: [],
    cacheHits: 0,
    cacheMisses: 0,
    optimizationSavings: 0,
    performanceScore: 0
  },
  events: [],
  debugLogs: [],
  isLoading: false,
  error: null,
  
  // Actions
  actions: {
    addChunk: (chunkData) => {
      const chunk: BundleChunk = {
        ...chunkData,
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isLoaded: false,
        loadCount: 0,
        lastAccessed: Date.now(),
        cacheHit: false
      };
      
      set((state) => ({
        chunks: [...state.chunks, chunk],
        stats: {
          ...state.stats,
          totalChunks: state.chunks.length + 1,
          totalSize: state.stats.totalSize + chunk.size
        }
      }));
      
      get().actions.trackEvent({
        type: 'chunk_loaded',
        chunkId: chunk.id,
        size: chunk.size
      });
    },
    
    removeChunk: (chunkId) => {
      set((state) => {
        const chunk = state.chunks.find(c => c.id === chunkId);
        return {
          chunks: state.chunks.filter(c => c.id !== chunkId),
          stats: {
            ...state.stats,
            totalChunks: state.chunks.length - 1,
            totalSize: chunk ? state.stats.totalSize - chunk.size : state.stats.totalSize
          }
        };
      });
    },
    
    updateChunk: (chunkId, updates) => {
      set((state) => ({
        chunks: state.chunks.map(chunk =>
          chunk.id === chunkId ? { ...chunk, ...updates } : chunk
        )
      }));
    },
    
    loadChunk: async (chunkId) => {
      const startTime = Date.now();
      
      try {
        set((state) => ({ isLoading: true, error: null }));
        
        // Simulate chunk loading
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        const loadTime = Date.now() - startTime;
        
        set((state) => ({
          chunks: state.chunks.map(chunk =>
            chunk.id === chunkId
              ? {
                  ...chunk,
                  isLoaded: true,
                  loadCount: chunk.loadCount + 1,
                  lastAccessed: Date.now(),
                  loadTime
                }
              : chunk
          ),
          isLoading: false
        }));
        
        get().actions.trackEvent({
          type: 'chunk_loaded',
          chunkId,
          loadTime
        });
        
      } catch (error) {
        set({ isLoading: false, error: 'Failed to load chunk' });
        get().actions.trackEvent({
          type: 'error',
          chunkId,
          error: 'Failed to load chunk'
        });
      }
    },
    
    unloadChunk: (chunkId) => {
      set((state) => ({
        chunks: state.chunks.map(chunk =>
          chunk.id === chunkId ? { ...chunk, isLoaded: false } : chunk
        )
      }));
    },
    
    addModule: (moduleData) => {
      const module: ModuleInfo = {
        ...moduleData,
        id: `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loadTime: 0,
        usageCount: 0,
        lastUsed: Date.now()
      };
      
      set((state) => ({
        modules: [...state.modules, module],
        stats: {
          ...state.stats,
          totalModules: state.modules.length + 1
        }
      }));
    },
    
    removeModule: (moduleId) => {
      set((state) => ({
        modules: state.modules.filter(m => m.id !== moduleId),
        stats: {
          ...state.stats,
          totalModules: state.modules.length - 1
        }
      }));
    },
    
    updateModule: (moduleId, updates) => {
      set((state) => ({
        modules: state.modules.map(module =>
          module.id === moduleId ? { ...module, ...updates } : module
        )
      }));
    },
    
    trackModuleUsage: (moduleId) => {
      set((state) => ({
        modules: state.modules.map(module =>
          module.id === moduleId
            ? {
                ...module,
                usageCount: module.usageCount + 1,
                lastUsed: Date.now()
              }
            : module
        )
      }));
      
      get().actions.trackEvent({
        type: 'module_loaded',
        moduleId
      });
    },
    
    addStrategy: (strategyData) => {
      const strategy: LoadingStrategy = {
        ...strategyData,
        id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      set((state) => ({
        strategies: [...state.strategies, strategy]
      }));
    },
    
    removeStrategy: (strategyId) => {
      set((state) => ({
        strategies: state.strategies.filter(s => s.id !== strategyId)
      }));
    },
    
    updateStrategy: (strategyId, updates) => {
      set((state) => ({
        strategies: state.strategies.map(strategy =>
          strategy.id === strategyId ? { ...strategy, ...updates } : strategy
        )
      }));
    },
    
    activateStrategy: (strategyId) => {
      get().actions.updateStrategy(strategyId, { isActive: true });
    },
    
    deactivateStrategy: (strategyId) => {
      get().actions.updateStrategy(strategyId, { isActive: false });
    },
    
    runAnalysis: async () => {
      const state = get();
      const startTime = Date.now();
      
      try {
        set({ isLoading: true, error: null });
        
        // Simulate analysis
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const analysis: BundleAnalysis = {
          id: `analysis_${Date.now()}`,
          timestamp: Date.now(),
          totalSize: state.stats.totalSize,
          gzipSize: Math.floor(state.stats.totalSize * 0.3),
          chunkCount: state.chunks.length,
          moduleCount: state.modules.length,
          duplicateModules: [],
          unusedModules: [],
          largestChunks: state.chunks
            .sort((a, b) => b.size - a.size)
            .slice(0, 5),
          recommendations: [
            {
              id: 'rec_1',
              type: 'split',
              title: 'Split large vendor chunk',
              description: 'Consider splitting the vendor chunk into smaller pieces',
              impact: 'high',
              savings: 50000,
              effort: 'medium',
              chunks: [],
              modules: []
            }
          ]
        };
        
        set((state) => ({
          analyses: [...state.analyses, analysis],
          isLoading: false
        }));
        
        return analysis;
        
      } catch (error) {
        set({ isLoading: false, error: 'Analysis failed' });
        throw error;
      }
    },
    
    applyRecommendation: async (recommendationId) => {
      try {
        set({ isLoading: true, error: null });
        
        // Simulate applying recommendation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        get().actions.trackEvent({
          type: 'optimization_applied',
          metadata: { recommendationId }
        });
        
        set({ isLoading: false });
        
      } catch (error) {
        set({ isLoading: false, error: 'Failed to apply recommendation' });
      }
    },
    
    updateConfig: (updates) => {
      set((state) => ({
        config: { ...state.config, ...updates }
      }));
    },
    
    resetConfig: () => {
      set({ config: defaultConfig });
    },
    
    trackEvent: (eventData) => {
      const event: BundleEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      set((state) => ({
        events: [...state.events.slice(-999), event]
      }));
    },
    
    getMetrics: () => {
      const state = get();
      return {
        ...state.metrics,
        performanceScore: Math.floor(Math.random() * 100)
      };
    },
    
    clearEvents: () => {
      set({ events: [] });
    },
    
    optimizeBundle: async () => {
      try {
        set({ isLoading: true, error: null });
        
        // Simulate optimization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        set((state) => ({
          stats: {
            ...state.stats,
            lastOptimized: Date.now(),
            compressionRatio: 0.7
          },
          isLoading: false
        }));
        
        get().actions.trackEvent({
          type: 'optimization_applied',
          metadata: { type: 'full_optimization' }
        });
        
      } catch (error) {
        set({ isLoading: false, error: 'Optimization failed' });
      }
    },
    
    clearCache: () => {
      set((state) => ({
        chunks: state.chunks.map(chunk => ({ ...chunk, cacheHit: false })),
        metrics: {
          ...state.metrics,
          cacheHits: 0,
          cacheMisses: 0
        }
      }));
    },
    
    exportAnalysis: () => {
      const state = get();
      return JSON.stringify({
        analyses: state.analyses,
        stats: state.stats,
        config: state.config
      }, null, 2);
    },
    
    importAnalysis: (data) => {
      try {
        const parsed = JSON.parse(data);
        set((state) => ({
          analyses: parsed.analyses || state.analyses,
          stats: parsed.stats || state.stats,
          config: parsed.config || state.config
        }));
      } catch (error) {
        set({ error: 'Failed to import analysis data' });
      }
    }
  },
  
  // Quick Actions
  quickActions: {
    enableCodeSplitting: () => {
      get().actions.updateConfig({ enableCodeSplitting: true });
      get().actions.addStrategy({
        name: 'Route-based Code Splitting',
        type: 'lazy',
        condition: 'route',
        priority: 1,
        routes: ['*'],
        chunks: [],
        isActive: true
      });
    },
    
    enableLazyLoading: () => {
      get().actions.updateConfig({ enableLazyLoading: true });
      get().actions.addStrategy({
        name: 'Lazy Loading Strategy',
        type: 'lazy',
        condition: 'viewport',
        priority: 2,
        routes: [],
        chunks: [],
        isActive: true
      });
    },
    
    optimizeForPerformance: () => {
      get().actions.updateConfig({
        enableCodeSplitting: true,
        enableLazyLoading: true,
        enablePreloading: true,
        chunkSizeLimit: 200000,
        cacheStrategy: 'aggressive'
      });
    },
    
    optimizeForSize: () => {
      get().actions.updateConfig({
        enableTreeShaking: true,
        enableMinification: true,
        compressionLevel: 9,
        chunkSizeLimit: 150000
      });
    },
    
    createRouteBasedSplitting: () => {
      get().actions.addStrategy({
        name: 'Route-based Splitting',
        type: 'lazy',
        condition: 'route',
        priority: 1,
        routes: ['/dashboard', '/profile', '/settings'],
        chunks: [],
        isActive: true
      });
    },
    
    createVendorSplitting: () => {
      get().actions.addStrategy({
        name: 'Vendor Splitting',
        type: 'eager',
        condition: 'vendor',
        priority: 0,
        routes: [],
        chunks: ['vendor'],
        isActive: true
      });
    },
    
    setupPreloadStrategy: () => {
      get().actions.addStrategy({
        name: 'Critical Path Preload',
        type: 'preload',
        condition: 'critical',
        priority: 0,
        routes: ['/'],
        chunks: ['main', 'vendor'],
        isActive: true
      });
    },
    
    generateReport: () => {
      get().actions.runAnalysis();
    }
  },
  
  // Advanced Features
  advanced: {
    predictiveLoading: async (route) => {
      // Implement predictive loading based on user behavior
      const strategies = get().strategies.filter(s => s.routes.includes(route));
      for (const strategy of strategies) {
        if (strategy.type === 'prefetch') {
          // Prefetch chunks for this route
          for (const chunkId of strategy.chunks) {
            await get().actions.loadChunk(chunkId);
          }
        }
      }
    },
    
    intelligentPrefetch: async () => {
      // Implement intelligent prefetching based on usage patterns
      const chunks = get().chunks
        .filter(chunk => !chunk.isLoaded)
        .sort((a, b) => b.loadCount - a.loadCount)
        .slice(0, 3);
      
      for (const chunk of chunks) {
        await get().actions.loadChunk(chunk.id);
      }
    },
    
    dynamicImportOptimization: async () => {
      // Optimize dynamic imports
      await new Promise(resolve => setTimeout(resolve, 1000));
      get().actions.trackEvent({
        type: 'optimization_applied',
        metadata: { type: 'dynamic_import' }
      });
    },
    
    bundleTreeShaking: async () => {
      // Perform tree shaking analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      set((state) => ({
        stats: {
          ...state.stats,
          unusedCount: Math.floor(state.modules.length * 0.1)
        }
      }));
    },
    
    compressionOptimization: async () => {
      // Optimize compression settings
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set((state) => ({
        stats: {
          ...state.stats,
          compressionRatio: Math.min(state.stats.compressionRatio + 0.1, 0.9)
        }
      }));
    },
    
    cacheOptimization: async () => {
      // Optimize caching strategy
      await new Promise(resolve => setTimeout(resolve, 600));
      
      set((state) => ({
        stats: {
          ...state.stats,
          cacheHitRate: Math.min(state.stats.cacheHitRate + 0.1, 1.0)
        }
      }));
    },
    
    performanceAnalysis: async () => {
      return await get().actions.runAnalysis();
    },
    
    sizeBudgetCheck: async () => {
      const state = get();
      const budget = state.config.chunkSizeLimit * state.chunks.length;
      return state.stats.totalSize <= budget;
    }
  },
  
  // System Operations
  system: {
    validateChunks: () => {
      const chunks = get().chunks;
      return chunks.every(chunk => 
        chunk.size > 0 && 
        chunk.modules.length > 0 &&
        chunk.name.length > 0
      );
    },
    
    optimizeStorage: () => {
      set((state) => ({
        events: state.events.slice(-100),
        debugLogs: state.debugLogs.slice(-50)
      }));
    },
    
    cleanup: () => {
      set((state) => ({
        chunks: state.chunks.filter(chunk => chunk.isLoaded || chunk.loadCount > 0),
        modules: state.modules.filter(module => module.usageCount > 0)
      }));
    },
    
    reset: () => {
      set({
        chunks: [],
        modules: [],
        strategies: [],
        analyses: [],
        events: [],
        debugLogs: [],
        error: null
      });
    },
    
    backup: () => {
      const state = get();
      return JSON.stringify({
        chunks: state.chunks,
        modules: state.modules,
        strategies: state.strategies,
        config: state.config
      });
    },
    
    restore: (data) => {
      try {
        const parsed = JSON.parse(data);
        set({
          chunks: parsed.chunks || [],
          modules: parsed.modules || [],
          strategies: parsed.strategies || [],
          config: parsed.config || defaultConfig
        });
      } catch (error) {
        set({ error: 'Failed to restore data' });
      }
    },
    
    getSystemInfo: () => {
      const state = get();
      return {
        chunksCount: state.chunks.length,
        modulesCount: state.modules.length,
        strategiesCount: state.strategies.length,
        totalSize: state.stats.totalSize,
        memoryUsage: state.events.length + state.debugLogs.length
      };
    }
  },
  
  // Debug
  debug: {
    isEnabled: false,
    logs: [],
    
    enable: () => {
      set((state) => ({
        debug: { ...state.debug, isEnabled: true }
      }));
    },
    
    disable: () => {
      set((state) => ({
        debug: { ...state.debug, isEnabled: false }
      }));
    },
    
    clear: () => {
      set((state) => ({
        debug: { ...state.debug, logs: [] }
      }));
    },
    
    log: (level, component, message, data) => {
      const state = get();
      if (!state.debug.isEnabled) return;
      
      const log: BundleDebugLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        level,
        component,
        message,
        data
      };
      
      set((state) => ({
        debug: {
          ...state.debug,
          logs: [...state.debug.logs.slice(-99), log]
        }
      }));
    }
  }
}));

// Bundle Optimization Manager Class
export class BundleOptimizationManager {
  private static instance: BundleOptimizationManager;
  
  static getInstance(): BundleOptimizationManager {
    if (!BundleOptimizationManager.instance) {
      BundleOptimizationManager.instance = new BundleOptimizationManager();
    }
    return BundleOptimizationManager.instance;
  }
  
  async loadChunk(chunkId: string): Promise<void> {
    return useBundleOptimizationStore.getState().actions.loadChunk(chunkId);
  }
  
  async optimizeBundle(): Promise<void> {
    return useBundleOptimizationStore.getState().actions.optimizeBundle();
  }
  
  getStats(): BundleStats {
    return useBundleOptimizationStore.getState().stats;
  }
}

// Global instance
export const bundleOptimizationManager = BundleOptimizationManager.getInstance();

// Utility Functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const getChunkTypeColor = (type: BundleChunk['type']): string => {
  switch (type) {
    case 'entry': return 'text-blue-600';
    case 'vendor': return 'text-green-600';
    case 'async': return 'text-orange-600';
    case 'shared': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

export const getPriorityColor = (priority: BundleChunk['priority']): string => {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getRecommendationIcon = (type: BundleRecommendation['type']): string => {
  switch (type) {
    case 'split': return '✂️';
    case 'merge': return '🔗';
    case 'lazy': return '⏳';
    case 'preload': return '⚡';
    case 'remove': return '🗑️';
    default: return '📋';
  }
};

export const getImpactColor = (impact: BundleRecommendation['impact']): string => {
  switch (impact) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-orange-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};