// Hook para gerenciamento avançado de code splitting
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createLazyComponent, preloadForRoute, getCacheStats, type LoadingOptions } from '../utils/lazyLoader';

interface CodeSplittingState {
  isLoading: boolean;
  loadedChunks: Set<string>;
  failedChunks: Set<string>;
  cacheStats: {
    total: number;
    preloaded: number;
    loading: number;
    errors: number;
    pending: number;
  };
  networkInfo: {
    effectiveType?: string;
    downlink?: number;
    saveData?: boolean;
  };
}

interface PreloadStrategy {
  immediate: string[]; // Componentes para preload imediato
  onIdle: string[]; // Componentes para preload durante idle
  onHover: string[]; // Componentes para preload no hover
  onVisible: string[]; // Componentes para preload quando visível
}

interface RoutePreloadConfig {
  [routePath: string]: PreloadStrategy;
}

export const useCodeSplitting = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [state, setState] = useState<CodeSplittingState>({
    isLoading: false,
    loadedChunks: new Set(),
    failedChunks: new Set(),
    cacheStats: { total: 0, preloaded: 0, loading: 0, errors: 0, pending: 0 },
    networkInfo: {}
  });

  const preloadTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const hoverPreloadRef = useRef<Set<string>>(new Set());
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);

  // Configuração de preload por rota
  const routePreloadConfig: RoutePreloadConfig = {
    '/': {
      immediate: ['Dashboard'],
      onIdle: ['RecentProjects', 'QuickActions'],
      onHover: ['ProjectCard'],
      onVisible: ['ActivityFeed']
    },
    '/editor': {
      immediate: ['VideoEditor', 'Timeline'],
      onIdle: ['EffectsPanel', 'AudioMixer'],
      onHover: ['ToolPanel'],
      onVisible: ['PreviewPanel']
    },
    '/projects': {
      immediate: ['ProjectList'],
      onIdle: ['ProjectCard', 'ProjectFilters'],
      onHover: ['ProjectActions'],
      onVisible: ['ProjectStats']
    },
    '/settings': {
      immediate: ['SettingsPanel'],
      onIdle: ['UserProfile', 'Preferences'],
      onHover: ['AdvancedSettings'],
      onVisible: ['SecuritySettings']
    }
  };

  // Detectar informações de rede
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection;
      setState(prev => ({
        ...prev,
        networkInfo: {
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          saveData: connection?.saveData
        }
      }));
    };

    updateNetworkInfo();
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
      return () => {
        (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  // Atualizar estatísticas de cache
  const updateCacheStats = useCallback(() => {
    const stats = getCacheStats();
    setState(prev => ({ ...prev, cacheStats: stats }));
  }, []);

  // Configurar observer de visibilidade
  useEffect(() => {
    visibilityObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentId = entry.target.getAttribute('data-preload-component');
            if (componentId) {
              schedulePreload(componentId, 'onVisible');
            }
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    return () => {
      visibilityObserverRef.current?.disconnect();
    };
  }, []);

  // Agendar preload baseado na estratégia
  const schedulePreload = useCallback((componentId: string, strategy: keyof PreloadStrategy) => {
    const { networkInfo } = state;
    
    // Respeitar save-data preference
    if (networkInfo.saveData && strategy !== 'immediate') {
      return;
    }

    // Ajustar delay baseado na conexão
    let delay = 0;
    switch (strategy) {
      case 'immediate':
        delay = 0;
        break;
      case 'onIdle':
        delay = networkInfo.effectiveType === '2g' ? 5000 : 1000;
        break;
      case 'onHover':
        delay = 100;
        break;
      case 'onVisible':
        delay = 500;
        break;
    }

    // Cancelar timer anterior se existir
    const existingTimer = preloadTimersRef.current.get(componentId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Agendar preload
    const timer = setTimeout(async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Importar componente dinamicamente
        await import(/* webpackChunkName: "[request]" */ `../components/${componentId}`);
        
        setState(prev => ({
          ...prev,
          loadedChunks: new Set([...prev.loadedChunks, componentId]),
          isLoading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          failedChunks: new Set([...prev.failedChunks, componentId]),
          isLoading: false
        }));
        
        console.error(`[CodeSplitting] Erro ao carregar ${componentId}:`, error);
      } finally {
        updateCacheStats();
        preloadTimersRef.current.delete(componentId);
      }
    }, delay);

    preloadTimersRef.current.set(componentId, timer);
  }, [state.networkInfo, updateCacheStats]);

  // Preload baseado na rota atual
  useEffect(() => {
    const currentRoute = location.pathname;
    const config = routePreloadConfig[currentRoute];
    
    if (config) {
      // Preload imediato
      config.immediate.forEach(componentId => {
        schedulePreload(componentId, 'immediate');
      });

      // Preload durante idle
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          config.onIdle.forEach(componentId => {
            schedulePreload(componentId, 'onIdle');
          });
        });
      } else {
        // Fallback para navegadores sem requestIdleCallback
        setTimeout(() => {
          config.onIdle.forEach(componentId => {
            schedulePreload(componentId, 'onIdle');
          });
        }, 2000);
      }
    }

    // Preload para rotas relacionadas
    preloadForRoute(currentRoute);
  }, [location.pathname, schedulePreload]);

  // Criar componente lazy otimizado
  const createOptimizedLazyComponent = useCallback(<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    componentId: string,
    options: LoadingOptions = {}
  ) => {
    const { networkInfo } = state;
    
    // Ajustar opções baseado na rede
    const optimizedOptions: LoadingOptions = {
      ...options,
      retryAttempts: networkInfo.effectiveType === '2g' ? 2 : 3,
      retryDelay: networkInfo.effectiveType === '2g' ? 2000 : 1000,
      preload: networkInfo.saveData ? false : options.preload
    };

    return createLazyComponent(importFn, componentId, optimizedOptions);
  }, [state.networkInfo]);

  // Handler para hover preload
  const handleHoverPreload = useCallback((componentId: string) => {
    if (!hoverPreloadRef.current.has(componentId)) {
      hoverPreloadRef.current.add(componentId);
      schedulePreload(componentId, 'onHover');
    }
  }, [schedulePreload]);

  // Observer para preload por visibilidade
  const observeForPreload = useCallback((element: Element, componentId: string) => {
    if (visibilityObserverRef.current) {
      element.setAttribute('data-preload-component', componentId);
      visibilityObserverRef.current.observe(element);
    }
  }, []);

  // Preload manual de componente
  const preloadComponent = useCallback((componentId: string) => {
    schedulePreload(componentId, 'immediate');
  }, [schedulePreload]);

  // Preload de rota específica
  const preloadRoute = useCallback((routePath: string) => {
    const config = routePreloadConfig[routePath];
    if (config) {
      [...config.immediate, ...config.onIdle].forEach(componentId => {
        schedulePreload(componentId, 'immediate');
      });
    }
  }, [schedulePreload]);

  // Navegação com preload
  const navigateWithPreload = useCallback((to: string, options?: any) => {
    // Preload da rota de destino
    preloadRoute(to);
    
    // Navegar após um pequeno delay para permitir preload
    setTimeout(() => {
      navigate(to, options);
    }, 100);
  }, [navigate, preloadRoute]);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      preloadTimersRef.current.forEach(timer => clearTimeout(timer));
      preloadTimersRef.current.clear();
    };
  }, []);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 5000);
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  return {
    // Estado
    ...state,
    
    // Ações
    createOptimizedLazyComponent,
    preloadComponent,
    preloadRoute,
    navigateWithPreload,
    
    // Handlers
    handleHoverPreload,
    observeForPreload,
    
    // Utilitários
    updateCacheStats,
    
    // Informações
    isSlowConnection: state.networkInfo.effectiveType === '2g' || state.networkInfo.effectiveType === 'slow-2g',
    isSaveDataEnabled: state.networkInfo.saveData,
    loadingProgress: state.cacheStats.total > 0 ? 
      (state.cacheStats.preloaded / state.cacheStats.total) * 100 : 0
  };
};

export type { CodeSplittingState, PreloadStrategy, RoutePreloadConfig };