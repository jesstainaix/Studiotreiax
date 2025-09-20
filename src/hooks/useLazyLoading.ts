import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createLazyComponent, 
  preloadComponent, 
  prefetchComponent,
  analyzeBundleSize,
  getLoadingStats,
  clearComponentCache,
  type LazyComponentOptions,
  type BundleAnalysis,
  type ChunkInfo
} from '@/utils/codeSplitting';
import type { ComponentType } from 'react';

export interface LazyLoadingState {
  isLoading: boolean;
  isAnalyzing: boolean;
  bundleAnalysis: BundleAnalysis | null;
  loadingStats: ReturnType<typeof getLoadingStats>;
  preloadedComponents: Set<string>;
  failedComponents: Set<string>;
}

export interface LazyLoadingActions {
  preloadComponent: (key: string, importFn: () => Promise<any>) => Promise<void>;
  prefetchComponent: (key: string, importFn: () => Promise<any>) => void;
  analyzeBundleSize: () => Promise<void>;
  clearCache: () => void;
  retryFailedComponent: (key: string) => void;
  createLazyComponent: <T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options?: LazyComponentOptions
  ) => React.LazyExoticComponent<T>;
}

export interface LazyLoadingConfig {
  enableAutoPreload: boolean;
  enableAutoPrefetch: boolean;
  preloadThreshold: number; // Porcentagem de scroll para iniciar preload
  maxConcurrentLoads: number;
  retryAttempts: number;
  analyticsEnabled: boolean;
}

const defaultConfig: LazyLoadingConfig = {
  enableAutoPreload: true,
  enableAutoPrefetch: true,
  preloadThreshold: 0.8,
  maxConcurrentLoads: 3,
  retryAttempts: 3,
  analyticsEnabled: true
};

export function useLazyLoading(config: Partial<LazyLoadingConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [state, setState] = useState<LazyLoadingState>({
    isLoading: false,
    isAnalyzing: false,
    bundleAnalysis: null,
    loadingStats: getLoadingStats(),
    preloadedComponents: new Set(),
    failedComponents: new Set()
  });

  const loadingQueue = useRef<Array<{ key: string; importFn: () => Promise<any> }>>([]); 
  const activeLoads = useRef<Set<string>>(new Set());
  const retryCount = useRef<Map<string, number>>(new Map());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);

  // Atualiza estatísticas periodicamente
  useEffect(() => {
    if (!finalConfig.analyticsEnabled) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        loadingStats: getLoadingStats()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [finalConfig.analyticsEnabled]);

  // Processa fila de carregamento
  const processLoadingQueue = useCallback(async () => {
    if (loadingQueue.current.length === 0 || 
        activeLoads.current.size >= finalConfig.maxConcurrentLoads) {
      return;
    }

    const { key, importFn } = loadingQueue.current.shift()!;
    
    if (activeLoads.current.has(key) || state.preloadedComponents.has(key)) {
      return;
    }

    activeLoads.current.add(key);
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await preloadComponent(key, importFn);
      
      setState(prev => ({
        ...prev,
        preloadedComponents: new Set([...prev.preloadedComponents, key]),
        failedComponents: new Set([...prev.failedComponents].filter(k => k !== key))
      }));
      
      retryCount.current.delete(key);
    } catch (error) {
      console.error(`Failed to load component ${key}:`, error);
      
      const currentRetries = retryCount.current.get(key) || 0;
      if (currentRetries < finalConfig.retryAttempts) {
        retryCount.current.set(key, currentRetries + 1);
        // Reagenda para retry
        setTimeout(() => {
          loadingQueue.current.push({ key, importFn });
          processLoadingQueue();
        }, 1000 * (currentRetries + 1));
      } else {
        setState(prev => ({
          ...prev,
          failedComponents: new Set([...prev.failedComponents, key])
        }));
      }
    } finally {
      activeLoads.current.delete(key);
      setState(prev => ({
        ...prev,
        isLoading: activeLoads.current.size > 0
      }));
      
      // Processa próximo item da fila
      setTimeout(processLoadingQueue, 100);
    }
  }, [finalConfig.maxConcurrentLoads, finalConfig.retryAttempts, state.preloadedComponents]);

  // Configura Intersection Observer para preload automático
  useEffect(() => {
    if (!finalConfig.enableAutoPreload) return;

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= finalConfig.preloadThreshold) {
            const key = entry.target.getAttribute('data-preload-key');
            const importFn = (entry.target as any).__importFn;
            
            if (key && importFn) {
              loadingQueue.current.push({ key, importFn });
              processLoadingQueue();
            }
          }
        });
      },
      {
        threshold: [finalConfig.preloadThreshold],
        rootMargin: '50px'
      }
    );

    return () => {
      intersectionObserver.current?.disconnect();
    };
  }, [finalConfig.enableAutoPreload, finalConfig.preloadThreshold, processLoadingQueue]);

  // Actions
  const actions: LazyLoadingActions = {
    preloadComponent: useCallback(async (key: string, importFn: () => Promise<any>) => {
      if (state.preloadedComponents.has(key)) {
        return;
      }

      loadingQueue.current.push({ key, importFn });
      await processLoadingQueue();
    }, [state.preloadedComponents, processLoadingQueue]),

    prefetchComponent: useCallback((key: string, importFn: () => Promise<any>) => {
      if (!finalConfig.enableAutoPrefetch || state.preloadedComponents.has(key)) {
        return;
      }

      // Usa requestIdleCallback para prefetch de baixa prioridade
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          prefetchComponent(key, importFn);
        });
      } else {
        setTimeout(() => {
          prefetchComponent(key, importFn);
        }, 100);
      }
    }, [finalConfig.enableAutoPrefetch, state.preloadedComponents]),

    analyzeBundleSize: useCallback(async () => {
      setState(prev => ({ ...prev, isAnalyzing: true }));
      
      try {
        const analysis = await analyzeBundleSize();
        setState(prev => ({
          ...prev,
          bundleAnalysis: analysis,
          isAnalyzing: false
        }));
      } catch (error) {
        console.error('Failed to analyze bundle:', error);
        setState(prev => ({ ...prev, isAnalyzing: false }));
      }
    }, []),

    clearCache: useCallback(() => {
      clearComponentCache();
      setState(prev => ({
        ...prev,
        preloadedComponents: new Set(),
        failedComponents: new Set(),
        loadingStats: getLoadingStats()
      }));
      retryCount.current.clear();
      activeLoads.current.clear();
      loadingQueue.current = [];
    }, []),

    retryFailedComponent: useCallback((key: string) => {
      setState(prev => ({
        ...prev,
        failedComponents: new Set([...prev.failedComponents].filter(k => k !== key))
      }));
      retryCount.current.delete(key);
    }, []),

    createLazyComponent: useCallback(<T extends ComponentType<any>>(
      importFn: () => Promise<{ default: T }>,
      options: LazyComponentOptions = {}
    ) => {
      const componentKey = options.chunkName || importFn.toString();
      
      // Auto-prefetch se habilitado
      if (finalConfig.enableAutoPrefetch && options.prefetch !== false) {
        actions.prefetchComponent(componentKey, importFn);
      }
      
      return createLazyComponent(importFn, {
        ...options,
        preload: finalConfig.enableAutoPreload && options.preload !== false
      });
    }, [finalConfig.enableAutoPrefetch, finalConfig.enableAutoPreload])
  };

  // Função para registrar elemento para preload automático
  const registerForAutoPreload = useCallback((element: HTMLElement, key: string, importFn: () => Promise<any>) => {
    if (!intersectionObserver.current || !finalConfig.enableAutoPreload) {
      return;
    }

    element.setAttribute('data-preload-key', key);
    (element as any).__importFn = importFn;
    intersectionObserver.current.observe(element);

    return () => {
      intersectionObserver.current?.unobserve(element);
    };
  }, [finalConfig.enableAutoPreload]);

  // Métricas computadas
  const metrics = {
    totalComponents: state.preloadedComponents.size + state.failedComponents.size,
    successRate: state.preloadedComponents.size > 0 
      ? (state.preloadedComponents.size / (state.preloadedComponents.size + state.failedComponents.size)) * 100
      : 0,
    averageLoadTime: state.loadingStats.averageLoadTime,
    cacheHitRate: state.loadingStats.cacheHitRate,
    queueLength: loadingQueue.current.length,
    activeLoads: activeLoads.current.size,
    bundleSize: state.bundleAnalysis?.totalSize || 0,
    chunksCount: state.bundleAnalysis?.chunks.length || 0
  };

  // Recomendações baseadas nas métricas
  const recommendations = [];
  
  if (metrics.successRate < 90) {
    recommendations.push('Taxa de sucesso baixa. Verifique a conectividade e configurações de retry.');
  }
  
  if (metrics.averageLoadTime > 3000) {
    recommendations.push('Tempo de carregamento alto. Considere otimizar o tamanho dos chunks.');
  }
  
  if (metrics.cacheHitRate < 50) {
    recommendations.push('Taxa de cache baixa. Considere implementar preload mais agressivo.');
  }
  
  if (state.bundleAnalysis && state.bundleAnalysis.totalSize > 1000000) {
    recommendations.push('Bundle muito grande. Implemente code splitting mais granular.');
  }

  return {
    // Estado
    ...state,
    
    // Actions
    ...actions,
    
    // Utilities
    registerForAutoPreload,
    
    // Métricas
    metrics,
    recommendations,
    
    // Configuração
    config: finalConfig
  };
}

// Hook para componentes individuais
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions & { autoPreload?: boolean } = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const componentRef = useRef<T | null>(null);
  
  const componentKey = options.chunkName || importFn.toString();
  
  const load = useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const module = await importFn();
      componentRef.current = module.default;
      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [importFn, isLoaded, isLoading]);
  
  const preload = useCallback(() => {
    preloadComponent(componentKey, importFn);
  }, [componentKey, importFn]);
  
  // Auto-preload se habilitado
  useEffect(() => {
    if (options.autoPreload) {
      preload();
    }
  }, [options.autoPreload, preload]);
  
  const LazyComponent = createLazyComponent(importFn, options);
  
  return {
    LazyComponent,
    isLoaded,
    isLoading,
    error,
    load,
    preload,
    component: componentRef.current
  };
}

export default useLazyLoading;