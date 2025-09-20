import { useEffect, useMemo, useCallback } from 'react';
import {
  useBundleOptimizationStore,
  BundleChunk,
  ModuleInfo,
  LoadingStrategy,
  BundleAnalysis,
  BundleConfig,
  BundleStats,
  BundleMetrics,
  BundleEvent,
  BundleDebugLog
} from '../utils/bundleOptimization';

// Throttle and debounce utilities
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Main hook
export const useBundleOptimization = () => {
  const {
    chunks,
    modules,
    strategies,
    analyses,
    config,
    stats,
    metrics,
    events,
    debugLogs,
    isLoading,
    error,
    actions,
    quickActions,
    advanced,
    system,
    debug
  } = useBundleOptimizationStore();
  
  // Auto-refresh effect
  useEffect(() => {
    if (config.enableCodeSplitting) {
      const interval = setInterval(() => {
        // Update metrics periodically
        actions.getMetrics();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [config.enableCodeSplitting, actions]);
  
  // Generate sample data effect
  useEffect(() => {
    if (chunks.length === 0) {
      // Generate sample chunks
      const sampleChunks = [
        {
          name: 'main',
          size: 150000,
          gzipSize: 45000,
          modules: ['App.tsx', 'index.tsx', 'main.css'],
          dependencies: ['react', 'react-dom'],
          loadTime: 120,
          priority: 'critical' as const,
          type: 'entry' as const,
          route: '/'
        },
        {
          name: 'vendor',
          size: 800000,
          gzipSize: 240000,
          modules: ['react', 'react-dom', 'lodash', 'axios'],
          dependencies: [],
          loadTime: 300,
          priority: 'high' as const,
          type: 'vendor' as const
        },
        {
          name: 'dashboard',
          size: 200000,
          gzipSize: 60000,
          modules: ['Dashboard.tsx', 'Chart.tsx', 'Table.tsx'],
          dependencies: ['recharts', 'react-table'],
          loadTime: 180,
          priority: 'medium' as const,
          type: 'async' as const,
          route: '/dashboard'
        }
      ];
      
      sampleChunks.forEach(chunk => actions.addChunk(chunk));
      
      // Generate sample modules
      const sampleModules = [
        {
          path: 'src/App.tsx',
          size: 15000,
          imports: ['react', 'react-router-dom'],
          exports: ['App'],
          isAsync: false
        },
        {
          path: 'src/components/Dashboard.tsx',
          size: 25000,
          imports: ['react', 'recharts'],
          exports: ['Dashboard'],
          isAsync: true
        },
        {
          path: 'src/utils/api.ts',
          size: 8000,
          imports: ['axios'],
          exports: ['api', 'fetchData'],
          isAsync: false
        }
      ];
      
      sampleModules.forEach(module => actions.addModule(module));
      
      // Generate sample strategies
      const sampleStrategies = [
        {
          name: 'Route-based Splitting',
          type: 'lazy' as const,
          condition: 'route',
          priority: 1,
          routes: ['/dashboard', '/profile', '/settings'],
          chunks: ['dashboard', 'profile', 'settings'],
          isActive: true
        },
        {
          name: 'Vendor Splitting',
          type: 'eager' as const,
          condition: 'vendor',
          priority: 0,
          routes: [],
          chunks: ['vendor'],
          isActive: true
        }
      ];
      
      sampleStrategies.forEach(strategy => actions.addStrategy(strategy));
    }
  }, [chunks.length, actions]);
  
  // Memoized actions with throttling/debouncing
  const throttledActions = useMemo(() => ({
    loadChunk: throttle(actions.loadChunk, 100),
    runAnalysis: throttle(actions.runAnalysis, 1000),
    optimizeBundle: throttle(actions.optimizeBundle, 2000)
  }), [actions]);
  
  const debouncedActions = useMemo(() => ({
    updateConfig: debounce(actions.updateConfig, 300),
    trackEvent: debounce(actions.trackEvent, 100)
  }), [actions]);
  
  // Quick actions
  const quickActionsWithCallbacks = useMemo(() => ({
    ...quickActions,
    enableCodeSplitting: useCallback(() => {
      quickActions.enableCodeSplitting();
      actions.trackEvent({
        type: 'optimization_applied',
        metadata: { action: 'enable_code_splitting' }
      });
    }, [quickActions, actions]),
    
    enableLazyLoading: useCallback(() => {
      quickActions.enableLazyLoading();
      actions.trackEvent({
        type: 'optimization_applied',
        metadata: { action: 'enable_lazy_loading' }
      });
    }, [quickActions, actions]),
    
    optimizeForPerformance: useCallback(() => {
      quickActions.optimizeForPerformance();
      actions.trackEvent({
        type: 'optimization_applied',
        metadata: { action: 'optimize_performance' }
      });
    }, [quickActions, actions]),
    
    optimizeForSize: useCallback(() => {
      quickActions.optimizeForSize();
      actions.trackEvent({
        type: 'optimization_applied',
        metadata: { action: 'optimize_size' }
      });
    }, [quickActions, actions])
  }), [quickActions, actions]);
  
  // Advanced features with error handling
  const advancedWithErrorHandling = useMemo(() => ({
    predictiveLoading: useCallback(async (route: string) => {
      try {
        await advanced.predictiveLoading(route);
        actions.trackEvent({
          type: 'optimization_applied',
          metadata: { action: 'predictive_loading', route }
        });
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Predictive loading failed'
        });
      }
    }, [advanced, actions]),
    
    intelligentPrefetch: useCallback(async () => {
      try {
        await advanced.intelligentPrefetch();
        actions.trackEvent({
          type: 'optimization_applied',
          metadata: { action: 'intelligent_prefetch' }
        });
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Intelligent prefetch failed'
        });
      }
    }, [advanced, actions]),
    
    dynamicImportOptimization: useCallback(async () => {
      try {
        await advanced.dynamicImportOptimization();
        actions.trackEvent({
          type: 'optimization_applied',
          metadata: { action: 'dynamic_import_optimization' }
        });
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Dynamic import optimization failed'
        });
      }
    }, [advanced, actions]),
    
    bundleTreeShaking: useCallback(async () => {
      try {
        await advanced.bundleTreeShaking();
        actions.trackEvent({
          type: 'optimization_applied',
          metadata: { action: 'tree_shaking' }
        });
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Tree shaking failed'
        });
      }
    }, [advanced, actions]),
    
    compressionOptimization: useCallback(async () => {
      try {
        await advanced.compressionOptimization();
        actions.trackEvent({
          type: 'optimization_applied',
          metadata: { action: 'compression_optimization' }
        });
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Compression optimization failed'
        });
      }
    }, [advanced, actions]),
    
    cacheOptimization: useCallback(async () => {
      try {
        await advanced.cacheOptimization();
        actions.trackEvent({
          type: 'optimization_applied',
          metadata: { action: 'cache_optimization' }
        });
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Cache optimization failed'
        });
      }
    }, [advanced, actions]),
    
    performanceAnalysis: useCallback(async () => {
      try {
        return await advanced.performanceAnalysis();
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Performance analysis failed'
        });
        throw error;
      }
    }, [advanced, actions]),
    
    sizeBudgetCheck: useCallback(async () => {
      try {
        return await advanced.sizeBudgetCheck();
      } catch (error) {
        actions.trackEvent({
          type: 'error',
          error: 'Size budget check failed'
        });
        return false;
      }
    }, [advanced, actions])
  }), [advanced, actions]);
  
  // System operations with logging
  const systemWithLogging = useMemo(() => ({
    ...system,
    optimizeStorage: useCallback(() => {
      system.optimizeStorage();
      debug.log('info', 'System', 'Storage optimized');
    }, [system, debug]),
    
    cleanup: useCallback(() => {
      system.cleanup();
      debug.log('info', 'System', 'Cleanup completed');
    }, [system, debug]),
    
    reset: useCallback(() => {
      system.reset();
      debug.log('info', 'System', 'System reset');
    }, [system, debug])
  }), [system, debug]);
  
  // Utilities
  const utils = useMemo(() => ({
    formatBytes: (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatDuration: (ms: number): string => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      return `${(ms / 60000).toFixed(1)}m`;
    },
    
    calculateCompressionRatio: (original: number, compressed: number): number => {
      return compressed / original;
    },
    
    estimateLoadTime: (size: number, bandwidth: number = 1000000): number => {
      return (size * 8) / bandwidth; // Convert bytes to bits and divide by bandwidth
    },
    
    getBundleHealth: (): 'excellent' | 'good' | 'fair' | 'poor' => {
      const totalSize = stats.totalSize;
      const compressionRatio = stats.compressionRatio;
      const cacheHitRate = stats.cacheHitRate;
      
      const score = (compressionRatio * 0.4) + (cacheHitRate * 0.3) + ((1 - totalSize / 5000000) * 0.3);
      
      if (score > 0.8) return 'excellent';
      if (score > 0.6) return 'good';
      if (score > 0.4) return 'fair';
      return 'poor';
    }
  }), [stats]);
  
  // Configuration helpers
  const configHelpers = useMemo(() => ({
    current: config,
    update: debouncedActions.updateConfig,
    reset: actions.resetConfig,
    
    presets: {
      development: {
        enableCodeSplitting: true,
        enableLazyLoading: false,
        enablePreloading: false,
        sourceMaps: true,
        enableMinification: false
      },
      production: {
        enableCodeSplitting: true,
        enableLazyLoading: true,
        enablePreloading: true,
        sourceMaps: false,
        enableMinification: true,
        enableTreeShaking: true
      },
      performance: {
        enableCodeSplitting: true,
        enableLazyLoading: true,
        enablePreloading: true,
        chunkSizeLimit: 200000,
        cacheStrategy: 'aggressive' as const
      },
      size: {
        enableTreeShaking: true,
        enableMinification: true,
        compressionLevel: 9,
        chunkSizeLimit: 150000
      }
    },
    
    applyPreset: (preset: 'development' | 'production' | 'performance' | 'size') => {
      const presetConfig = configHelpers.presets[preset];
      actions.updateConfig(presetConfig);
    }
  }), [config, debouncedActions.updateConfig, actions]);
  
  // Analytics helpers
  const analyticsHelpers = useMemo(() => ({
    stats,
    metrics,
    events: events.slice(-100), // Last 100 events
    
    getRecentEvents: (count: number = 10) => events.slice(-count),
    getEventsByType: (type: BundleEvent['type']) => events.filter(e => e.type === type),
    
    refresh: useCallback(() => {
      actions.getMetrics();
    }, [actions]),
    
    export: useCallback(() => {
      return actions.exportAnalysis();
    }, [actions]),
    
    import: useCallback((data: string) => {
      actions.importAnalysis(data);
    }, [actions])
  }), [stats, metrics, events, actions]);
  
  // Debug helpers
  const debugHelpers = useMemo(() => ({
    ...debug,
    
    logWithContext: useCallback((level: BundleDebugLog['level'], message: string, context?: any) => {
      debug.log(level, 'BundleOptimization', message, context);
    }, [debug]),
    
    getLogsByLevel: (level: BundleDebugLog['level']) => {
      return debug.logs.filter(log => log.level === level);
    },
    
    getRecentLogs: (count: number = 20) => {
      return debug.logs.slice(-count);
    }
  }), [debug]);
  
  // Computed values
  const computed = useMemo(() => ({
    totalChunks: chunks.length,
    totalModules: modules.length,
    totalStrategies: strategies.length,
    activeStrategies: strategies.filter(s => s.isActive).length,
    loadedChunks: chunks.filter(c => c.isLoaded).length,
    unloadedChunks: chunks.filter(c => !c.isLoaded).length,
    criticalChunks: chunks.filter(c => c.priority === 'critical').length,
    asyncChunks: chunks.filter(c => c.type === 'async').length,
    vendorChunks: chunks.filter(c => c.type === 'vendor').length,
    averageChunkSize: chunks.length > 0 ? chunks.reduce((sum, c) => sum + c.size, 0) / chunks.length : 0,
    averageLoadTime: chunks.length > 0 ? chunks.reduce((sum, c) => sum + c.loadTime, 0) / chunks.length : 0,
    compressionEfficiency: stats.compressionRatio,
    cacheEfficiency: stats.cacheHitRate,
    bundleHealth: utils.getBundleHealth(),
    recentAnalyses: analyses.slice(-5),
    recentEvents: events.slice(-10),
    errorCount: events.filter(e => e.type === 'error').length,
    optimizationCount: events.filter(e => e.type === 'optimization_applied').length,
    isHealthy: stats.totalSize < 2000000 && stats.compressionRatio > 0.3 && stats.cacheHitRate > 0.5
  }), [chunks, modules, strategies, analyses, events, stats, utils]);
  
  return {
    // State
    chunks,
    modules,
    strategies,
    analyses,
    events: events.slice(-50), // Limit events for performance
    isLoading,
    error,
    
    // Core Actions
    actions: {
      ...actions,
      ...throttledActions
    },
    
    // Quick Actions
    quickActions: quickActionsWithCallbacks,
    
    // Advanced Features
    advanced: advancedWithErrorHandling,
    
    // System Operations
    system: systemWithLogging,
    
    // Utilities
    utils,
    
    // Configuration
    config: configHelpers,
    
    // Analytics
    analytics: analyticsHelpers,
    
    // Debug
    debug: debugHelpers,
    
    // Computed Values
    computed
  };
};

// Specialized hooks
export const useBundleOptimizationStats = () => {
  const { stats, computed } = useBundleOptimization();
  return { stats, computed };
};

export const useBundleOptimizationConfig = () => {
  const { config } = useBundleOptimization();
  return config;
};

export const useBundleOptimizationChunks = () => {
  const { chunks, actions } = useBundleOptimization();
  return {
    chunks,
    loadChunk: actions.loadChunk,
    unloadChunk: actions.unloadChunk,
    addChunk: actions.addChunk,
    removeChunk: actions.removeChunk,
    updateChunk: actions.updateChunk
  };
};

export const useBundleOptimizationModules = () => {
  const { modules, actions } = useBundleOptimization();
  return {
    modules,
    addModule: actions.addModule,
    removeModule: actions.removeModule,
    updateModule: actions.updateModule,
    trackModuleUsage: actions.trackModuleUsage
  };
};

export const useBundleOptimizationStrategies = () => {
  const { strategies, actions } = useBundleOptimization();
  return {
    strategies,
    addStrategy: actions.addStrategy,
    removeStrategy: actions.removeStrategy,
    updateStrategy: actions.updateStrategy,
    activateStrategy: actions.activateStrategy,
    deactivateStrategy: actions.deactivateStrategy
  };
};

export const useBundleOptimizationAnalyses = () => {
  const { analyses, actions } = useBundleOptimization();
  return {
    analyses,
    runAnalysis: actions.runAnalysis,
    applyRecommendation: actions.applyRecommendation
  };
};

export const useBundleOptimizationEvents = () => {
  const { events, analytics } = useBundleOptimization();
  return {
    events,
    getRecentEvents: analytics.getRecentEvents,
    getEventsByType: analytics.getEventsByType
  };
};

export const useBundleOptimizationDebug = () => {
  const { debug } = useBundleOptimization();
  return debug;
};

// Utility hooks
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  return useMemo(() => throttle(callback, delay), [callback, delay]);
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  return useMemo(() => debounce(callback, delay), [callback, delay]);
};

export const useBundleLoader = () => {
  const { actions } = useBundleOptimization();
  
  const loadChunkWithRetry = useCallback(async (chunkId: string, maxRetries: number = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        await actions.loadChunk(chunkId);
        return;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }, [actions]);
  
  return { loadChunkWithRetry };
};

export const useBundlePreloader = () => {
  const { chunks, advanced } = useBundleOptimization();
  
  const preloadCriticalChunks = useCallback(async () => {
    const criticalChunks = chunks.filter(c => c.priority === 'critical' && !c.isLoaded);
    await Promise.all(criticalChunks.map(c => advanced.predictiveLoading(c.route || '/')));
  }, [chunks, advanced]);
  
  const preloadForRoute = useCallback(async (route: string) => {
    await advanced.predictiveLoading(route);
  }, [advanced]);
  
  return { preloadCriticalChunks, preloadForRoute };
};

export const useBundlePerformance = () => {
  const { stats, computed, utils } = useBundleOptimization();
  
  const performanceMetrics = useMemo(() => ({
    bundleSize: stats.totalSize,
    gzipSize: stats.gzipSize,
    compressionRatio: stats.compressionRatio,
    loadTime: stats.loadTime,
    cacheHitRate: stats.cacheHitRate,
    health: computed.bundleHealth,
    score: computed.isHealthy ? 'good' : 'needs-improvement'
  }), [stats, computed]);
  
  const recommendations = useMemo(() => {
    const recs = [];
    
    if (stats.totalSize > 2000000) {
      recs.push('Consider code splitting to reduce bundle size');
    }
    
    if (stats.compressionRatio < 0.3) {
      recs.push('Enable better compression to reduce transfer size');
    }
    
    if (stats.cacheHitRate < 0.5) {
      recs.push('Optimize caching strategy to improve performance');
    }
    
    if (computed.asyncChunks < computed.totalChunks * 0.3) {
      recs.push('Consider lazy loading more components');
    }
    
    return recs;
  }, [stats, computed]);
  
  return { performanceMetrics, recommendations };
};

export const useBundleOptimizer = () => {
  const { quickActions, advanced, actions } = useBundleOptimization();
  
  const runFullOptimization = useCallback(async () => {
    // Run all optimization strategies
    quickActions.optimizeForPerformance();
    await advanced.bundleTreeShaking();
    await advanced.compressionOptimization();
    await advanced.cacheOptimization();
    await actions.optimizeBundle();
  }, [quickActions, advanced, actions]);
  
  const runSizeOptimization = useCallback(async () => {
    quickActions.optimizeForSize();
    await advanced.bundleTreeShaking();
    await advanced.compressionOptimization();
  }, [quickActions, advanced]);
  
  const runPerformanceOptimization = useCallback(async () => {
    quickActions.optimizeForPerformance();
    await advanced.intelligentPrefetch();
    await advanced.cacheOptimization();
  }, [quickActions, advanced]);
  
  return {
    runFullOptimization,
    runSizeOptimization,
    runPerformanceOptimization
  };
};