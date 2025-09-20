import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { virtualizationService, CacheConfig, PerformanceMetrics, VirtualizationOptions } from '../services/virtualizationService';

export interface VirtualizationConfig {
  // Global settings
  enableCache: boolean;
  enableMetrics: boolean;
  enableDebug: boolean;
  
  // Default options for all virtualized components
  defaultOverscan: number;
  defaultItemHeight: number;
  defaultItemWidth: number;
  
  // Cache configuration
  cacheConfig: CacheConfig;
  
  // Performance settings
  throttleDelay: number;
  debounceDelay: number;
  maxConcurrentRenders: number;
  
  // Memory management
  maxMemoryUsage: number; // in bytes
  cleanupInterval: number; // in milliseconds
  
  // Development settings
  logPerformance: boolean;
  showVirtualBounds: boolean;
  highlightOverscan: boolean;
}

export interface VirtualizationState {
  config: VirtualizationConfig;
  metrics: Map<string, PerformanceMetrics>;
  activeComponents: Set<string>;
  memoryUsage: number;
  isInitialized: boolean;
  error: string | null;
}

export type VirtualizationAction =
  | { type: 'INITIALIZE'; payload: Partial<VirtualizationConfig> }
  | { type: 'UPDATE_CONFIG'; payload: Partial<VirtualizationConfig> }
  | { type: 'REGISTER_COMPONENT'; payload: string }
  | { type: 'UNREGISTER_COMPONENT'; payload: string }
  | { type: 'UPDATE_METRICS'; payload: { componentId: string; metrics: PerformanceMetrics } }
  | { type: 'UPDATE_MEMORY_USAGE'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

export interface VirtualizationContextValue {
  state: VirtualizationState;
  dispatch: React.Dispatch<VirtualizationAction>;
  
  // Configuration methods
  updateConfig: (config: Partial<VirtualizationConfig>) => void;
  resetConfig: () => void;
  
  // Component registration
  registerComponent: (componentId: string, options?: VirtualizationOptions) => void;
  unregisterComponent: (componentId: string) => void;
  
  // Metrics and monitoring
  getMetrics: (componentId?: string) => PerformanceMetrics | Map<string, PerformanceMetrics>;
  clearMetrics: (componentId?: string) => void;
  
  // Cache management
  clearCache: (componentId?: string) => void;
  getCacheStats: () => {
    totalCaches: number;
    totalEntries: number;
    memoryUsage: number;
  };
  
  // Performance optimization
  optimizePerformance: () => void;
  
  // Debug utilities
  enableDebugMode: (enabled: boolean) => void;
  getDebugInfo: () => {
    activeComponents: string[];
    memoryUsage: number;
    cacheStats: any;
    performanceMetrics: any;
  };
}

const defaultConfig: VirtualizationConfig = {
  enableCache: true,
  enableMetrics: true,
  enableDebug: false,
  defaultOverscan: 3,
  defaultItemHeight: 50,
  defaultItemWidth: 200,
  cacheConfig: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxItems: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000, // 1 minute
    strategy: 'adaptive'
  },
  throttleDelay: 16, // ~60fps
  debounceDelay: 100,
  maxConcurrentRenders: 10,
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  cleanupInterval: 30 * 1000, // 30 seconds
  logPerformance: false,
  showVirtualBounds: false,
  highlightOverscan: false
};

const initialState: VirtualizationState = {
  config: defaultConfig,
  metrics: new Map(),
  activeComponents: new Set(),
  memoryUsage: 0,
  isInitialized: false,
  error: null
};

function virtualizationReducer(
  state: VirtualizationState,
  action: VirtualizationAction
): VirtualizationState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
        isInitialized: true,
        error: null
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };

    case 'REGISTER_COMPONENT':
      return {
        ...state,
        activeComponents: new Set([...state.activeComponents, action.payload])
      };

    case 'UNREGISTER_COMPONENT': {
      const newActiveComponents = new Set(state.activeComponents);
      newActiveComponents.delete(action.payload);
      const newMetrics = new Map(state.metrics);
      newMetrics.delete(action.payload);
      
      return {
        ...state,
        activeComponents: newActiveComponents,
        metrics: newMetrics
      };
    }

    case 'UPDATE_METRICS': {
      const newMetrics = new Map(state.metrics);
      newMetrics.set(action.payload.componentId, action.payload.metrics);
      
      return {
        ...state,
        metrics: newMetrics
      };
    }

    case 'UPDATE_MEMORY_USAGE':
      return {
        ...state,
        memoryUsage: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'RESET':
      return {
        ...initialState,
        config: state.config // Keep current config
      };

    default:
      return state;
  }
}

const VirtualizationContext = createContext<VirtualizationContextValue | null>(null);

export interface VirtualizationProviderProps {
  children: ReactNode;
  config?: Partial<VirtualizationConfig>;
  onError?: (error: Error) => void;
}

export const VirtualizationProvider: React.FC<VirtualizationProviderProps> = ({
  children,
  config: initialConfig,
  onError
}) => {
  const [state, dispatch] = useReducer(virtualizationReducer, initialState);

  // Initialize provider
  useEffect(() => {
    try {
      dispatch({ type: 'INITIALIZE', payload: initialConfig || {} });
      
      // Initialize virtualization service
      if (state.config.enableCache) {
        virtualizationService.initializeCache('global', state.config.cacheConfig);
      }
      
      if (state.config.enableMetrics) {
        virtualizationService.initializeMetrics('global');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [initialConfig, onError]);

  // Memory monitoring
  useEffect(() => {
    if (!state.config.enableMetrics) return;

    const interval = setInterval(() => {
      try {
        const stats = virtualizationService.getStatistics();
        dispatch({ type: 'UPDATE_MEMORY_USAGE', payload: stats.totalMemoryUsage });
        
        // Check memory limit
        if (stats.totalMemoryUsage > state.config.maxMemoryUsage) {
          console.warn('Virtualization memory usage exceeded limit:', {
            current: stats.totalMemoryUsage,
            limit: state.config.maxMemoryUsage
          });
          
          // Trigger cleanup
          virtualizationService.cleanup();
        }
      } catch (error) {
        console.error('Error monitoring memory usage:', error);
      }
    }, state.config.cleanupInterval);

    return () => clearInterval(interval);
  }, [state.config.enableMetrics, state.config.maxMemoryUsage, state.config.cleanupInterval]);

  // Performance logging
  useEffect(() => {
    if (!state.config.logPerformance) return;

    const interval = setInterval(() => {
      const metrics = Array.from(state.metrics.entries());
      if (metrics.length > 0) {
        console.group('🚀 Virtualization Performance Metrics');
        metrics.forEach(([componentId, metric]) => {
          console.log(`${componentId}:`, {
            renderTime: `${metric.renderTime.toFixed(2)}ms`,
            itemsRendered: metric.itemsRendered,
            cacheHitRate: `${(metric.cacheHitRate * 100).toFixed(1)}%`,
            memoryUsage: `${(metric.memoryUsage / 1024).toFixed(1)}KB`,
            fps: metric.fps
          });
        });
        console.groupEnd();
      }
    }, 5000); // Log every 5 seconds

    return () => clearInterval(interval);
  }, [state.config.logPerformance, state.metrics]);

  // Context value methods
  const updateConfig = useCallback((newConfig: Partial<VirtualizationConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
  }, []);

  const resetConfig = useCallback(() => {
    dispatch({ type: 'UPDATE_CONFIG', payload: defaultConfig });
  }, []);

  const registerComponent = useCallback((componentId: string, options?: VirtualizationOptions) => {
    try {
      dispatch({ type: 'REGISTER_COMPONENT', payload: componentId });
      
      if (state.config.enableCache) {
        virtualizationService.initializeCache(componentId, state.config.cacheConfig);
      }
      
      if (state.config.enableMetrics) {
        virtualizationService.initializeMetrics(componentId);
      }
      
      if (state.config.enableDebug) {
        console.log(`📊 Registered virtualized component: ${componentId}`, options);
      }
    } catch (error) {
      console.error(`Failed to register component ${componentId}:`, error);
    }
  }, [state.config]);

  const unregisterComponent = useCallback((componentId: string) => {
    try {
      dispatch({ type: 'UNREGISTER_COMPONENT', payload: componentId });
      virtualizationService.cleanup(componentId);
      
      if (state.config.enableDebug) {
        console.log(`📊 Unregistered virtualized component: ${componentId}`);
      }
    } catch (error) {
      console.error(`Failed to unregister component ${componentId}:`, error);
    }
  }, [state.config.enableDebug]);

  const getMetrics = useCallback((componentId?: string) => {
    if (componentId) {
      return virtualizationService.getMetrics(componentId) || state.metrics.get(componentId);
    }
    return state.metrics;
  }, [state.metrics]);

  const clearMetrics = useCallback((componentId?: string) => {
    if (componentId) {
      const newMetrics = new Map(state.metrics);
      newMetrics.delete(componentId);
      dispatch({ type: 'UPDATE_METRICS', payload: { componentId, metrics: newMetrics.get(componentId)! } });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [state.metrics]);

  const clearCache = useCallback((componentId?: string) => {
    virtualizationService.clearCache(componentId || 'global');
    
    if (state.config.enableDebug) {
      console.log(`🗑️ Cleared cache for: ${componentId || 'all components'}`);
    }
  }, [state.config.enableDebug]);

  const getCacheStats = useCallback(() => {
    return virtualizationService.getStatistics();
  }, []);

  const optimizePerformance = useCallback(() => {
    try {
      // Clear old caches
      virtualizationService.cleanup();
      
      // Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
      
      // Reset metrics
      dispatch({ type: 'RESET' });
      
      if (state.config.enableDebug) {
        console.log('🚀 Performance optimization completed');
      }
    } catch (error) {
      console.error('Performance optimization failed:', error);
    }
  }, [state.config.enableDebug]);

  const enableDebugMode = useCallback((enabled: boolean) => {
    updateConfig({ enableDebug: enabled });
    
    if (enabled) {
      console.log('🐛 Virtualization debug mode enabled');
    }
  }, [updateConfig]);

  const getDebugInfo = useCallback(() => {
    return {
      activeComponents: Array.from(state.activeComponents),
      memoryUsage: state.memoryUsage,
      cacheStats: getCacheStats(),
      performanceMetrics: Object.fromEntries(state.metrics)
    };
  }, [state.activeComponents, state.memoryUsage, state.metrics, getCacheStats]);

  // Memoized context value
  const contextValue = useMemo<VirtualizationContextValue>(() => ({
    state,
    dispatch,
    updateConfig,
    resetConfig,
    registerComponent,
    unregisterComponent,
    getMetrics,
    clearMetrics,
    clearCache,
    getCacheStats,
    optimizePerformance,
    enableDebugMode,
    getDebugInfo
  }), [
    state,
    updateConfig,
    resetConfig,
    registerComponent,
    unregisterComponent,
    getMetrics,
    clearMetrics,
    clearCache,
    getCacheStats,
    optimizePerformance,
    enableDebugMode,
    getDebugInfo
  ]);

  // Error boundary effect
  useEffect(() => {
    if (state.error && onError) {
      onError(new Error(state.error));
    }
  }, [state.error, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      virtualizationService.cleanup();
    };
  }, []);

  return (
    <VirtualizationContext.Provider value={contextValue}>
      {children}
      {state.config.enableDebug && <VirtualizationDebugPanel />}
    </VirtualizationContext.Provider>
  );
};

// Debug panel component
const VirtualizationDebugPanel: React.FC = () => {
  const context = useVirtualization();
  const [isVisible, setIsVisible] = React.useState(false);
  const [selectedComponent, setSelectedComponent] = React.useState<string>('');

  if (!context) return null;

  const { state, getDebugInfo } = context;
  const debugInfo = getDebugInfo();

  return (
    <>
      {/* Debug toggle button */}
      <button
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50 hover:bg-blue-600 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle Virtualization Debug Panel"
      >
        📊
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Virtualization Debug</h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </button>
          </div>

          {/* Component selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Active Components:</label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Components</option>
              {debugInfo.activeComponents.map(componentId => (
                <option key={componentId} value={componentId}>
                  {componentId}
                </option>
              ))}
            </select>
          </div>

          {/* Memory usage */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Memory Usage:</div>
            <div className="text-sm text-gray-600">
              {(debugInfo.memoryUsage / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (debugInfo.memoryUsage / state.config.maxMemoryUsage) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Cache stats */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Cache Statistics:</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Total Caches: {debugInfo.cacheStats.totalCaches}</div>
              <div>Total Entries: {debugInfo.cacheStats.totalEntries}</div>
              <div>Cache Memory: {(debugInfo.cacheStats.memoryUsage / 1024).toFixed(1)} KB</div>
            </div>
          </div>

          {/* Performance metrics */}
          {selectedComponent && debugInfo.performanceMetrics[selectedComponent] && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Performance ({selectedComponent}):</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Render Time: {debugInfo.performanceMetrics[selectedComponent].renderTime.toFixed(2)}ms</div>
                <div>Items Rendered: {debugInfo.performanceMetrics[selectedComponent].itemsRendered}</div>
                <div>Cache Hit Rate: {(debugInfo.performanceMetrics[selectedComponent].cacheHitRate * 100).toFixed(1)}%</div>
                <div>FPS: {debugInfo.performanceMetrics[selectedComponent].fps}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              onClick={() => context.clearCache()}
            >
              Clear Cache
            </button>
            <button
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
              onClick={() => context.optimizePerformance()}
            >
              Optimize
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Hook to use virtualization context
export const useVirtualization = (): VirtualizationContextValue => {
  const context = useContext(VirtualizationContext);
  
  if (!context) {
    throw new Error('useVirtualization must be used within a VirtualizationProvider');
  }
  
  return context;
};

// Hook to register a component with virtualization
export const useVirtualizationComponent = (
  componentId: string,
  options?: VirtualizationOptions
) => {
  const { registerComponent, unregisterComponent, getMetrics, state } = useVirtualization();
  
  useEffect(() => {
    registerComponent(componentId, options);
    
    return () => {
      unregisterComponent(componentId);
    };
  }, [componentId, registerComponent, unregisterComponent]);
  
  const metrics = getMetrics(componentId) as PerformanceMetrics | undefined;
  
  return {
    config: state.config,
    metrics,
    isRegistered: state.activeComponents.has(componentId)
  };
};

// HOC for automatic component registration
export const withVirtualization = <P extends object>(
  Component: React.ComponentType<P>,
  componentId: string,
  options?: VirtualizationOptions
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    useVirtualizationComponent(componentId, options);
    
    return <Component {...props} ref={ref} />;
  });
  
  WrappedComponent.displayName = `withVirtualization(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default VirtualizationProvider;