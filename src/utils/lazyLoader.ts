// Sistema avançado de lazy loading e code splitting
import { lazy, ComponentType, LazyExoticComponent } from 'react';

interface LoadingOptions {
  fallback?: ComponentType;
  retryAttempts?: number;
  retryDelay?: number;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  chunkName?: string;
}

interface LazyComponentCache {
  [key: string]: {
    component: LazyExoticComponent<any>;
    preloaded: boolean;
    loading: boolean;
    error: Error | null;
    retryCount: number;
  };
}

class LazyLoader {
  private cache: LazyComponentCache = {};
  private preloadQueue: Set<string> = new Set();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private intersectionObserver?: IntersectionObserver;
  private idleCallback?: number;

  constructor() {
    this.setupIntersectionObserver();
    this.setupIdlePreloading();
  }

  // Configurar observer para preload baseado em visibilidade
  private setupIntersectionObserver() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const componentId = entry.target.getAttribute('data-lazy-component');
              if (componentId && this.cache[componentId] && !this.cache[componentId].preloaded) {
                this.preloadComponent(componentId);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  // Configurar preload durante idle time
  private setupIdlePreloading() {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const processPreloadQueue = () => {
        if (this.preloadQueue.size > 0) {
          const componentId = this.preloadQueue.values().next().value;
          this.preloadQueue.delete(componentId);
          this.preloadComponent(componentId);
        }
        
        this.idleCallback = window.requestIdleCallback(processPreloadQueue, {
          timeout: 5000
        });
      };
      
      this.idleCallback = window.requestIdleCallback(processPreloadQueue);
    }
  }

  // Criar componente lazy com opções avançadas
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    componentId: string,
    options: LoadingOptions = {}
  ): LazyExoticComponent<T> {
    const {
      retryAttempts = 3,
      retryDelay = 1000,
      preload = false,
      priority = 'medium',
      chunkName
    } = options;

    // Wrapper para retry logic
    const importWithRetry = async (): Promise<{ default: T }> => {
      const cacheEntry = this.cache[componentId];
      
      try {
        // Verificar se já está carregando
        if (this.loadingQueue.has(componentId)) {
          return await this.loadingQueue.get(componentId)!;
        }

        // Criar promise de carregamento
        const loadingPromise = importFn();
        this.loadingQueue.set(componentId, loadingPromise);
        
        // Marcar como carregando
        if (cacheEntry) {
          cacheEntry.loading = true;
          cacheEntry.error = null;
        }

        const result = await loadingPromise;
        
        // Marcar como carregado com sucesso
        if (cacheEntry) {
          cacheEntry.loading = false;
          cacheEntry.preloaded = true;
          cacheEntry.retryCount = 0;
        }
        
        this.loadingQueue.delete(componentId);
        return result;
      } catch (error) {
        this.loadingQueue.delete(componentId);
        
        if (cacheEntry) {
          cacheEntry.loading = false;
          cacheEntry.error = error as Error;
          cacheEntry.retryCount++;
        }

        // Retry logic
        if (cacheEntry && cacheEntry.retryCount < retryAttempts) {
          console.warn(`[LazyLoader] Tentativa ${cacheEntry.retryCount}/${retryAttempts} falhou para ${componentId}:`, error);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * cacheEntry.retryCount));
          return this.importWithRetry();
        }

        console.error(`[LazyLoader] Falha ao carregar componente ${componentId} após ${retryAttempts} tentativas:`, error);
        throw error;
      }
    };

    // Criar componente lazy
    const lazyComponent = lazy(() => importWithRetry());

    // Adicionar ao cache
    this.cache[componentId] = {
      component: lazyComponent,
      preloaded: false,
      loading: false,
      error: null,
      retryCount: 0
    };

    // Preload imediato se solicitado
    if (preload) {
      if (priority === 'high') {
        this.preloadComponent(componentId);
      } else {
        this.preloadQueue.add(componentId);
      }
    }

    return lazyComponent;
  }

  // Precarregar componente
  async preloadComponent(componentId: string): Promise<void> {
    const cacheEntry = this.cache[componentId];
    if (!cacheEntry || cacheEntry.preloaded || cacheEntry.loading) {
      return;
    }

    try {
      // Trigger do lazy loading
      const Component = cacheEntry.component;
      await import(/* webpackMode: "lazy" */ `../components/${componentId}`);
      
      cacheEntry.preloaded = true;
    } catch (error) {
      console.error(`[LazyLoader] Erro ao precarregar componente ${componentId}:`, error);
      cacheEntry.error = error as Error;
    }
  }

  // Precarregar múltiplos componentes
  async preloadComponents(componentIds: string[]): Promise<void> {
    const promises = componentIds.map(id => this.preloadComponent(id));
    await Promise.allSettled(promises);
  }

  // Precarregar baseado em rota
  preloadForRoute(routePath: string): void {
    const routeComponents = this.getComponentsForRoute(routePath);
    routeComponents.forEach(componentId => {
      this.preloadQueue.add(componentId);
    });
  }

  // Mapear componentes por rota
  private getComponentsForRoute(routePath: string): string[] {
    const routeMap: { [key: string]: string[] } = {
      '/': ['Dashboard', 'RecentProjects'],
      '/editor': ['VideoEditor', 'Timeline', 'EffectsPanel'],
      '/projects': ['ProjectList', 'ProjectCard'],
      '/settings': ['SettingsPanel', 'UserProfile'],
      '/analytics': ['AnalyticsDashboard', 'Charts']
    };

    return routeMap[routePath] || [];
  }

  // Observar elemento para preload
  observeElement(element: Element, componentId: string): void {
    if (this.intersectionObserver) {
      element.setAttribute('data-lazy-component', componentId);
      this.intersectionObserver.observe(element);
    }
  }

  // Parar observação
  unobserveElement(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  // Obter estatísticas de cache
  getCacheStats() {
    const stats = {
      total: Object.keys(this.cache).length,
      preloaded: 0,
      loading: 0,
      errors: 0,
      pending: 0
    };

    Object.values(this.cache).forEach(entry => {
      if (entry.preloaded) stats.preloaded++;
      else if (entry.loading) stats.loading++;
      else if (entry.error) stats.errors++;
      else stats.pending++;
    });

    return stats;
  }

  // Limpar cache
  clearCache(): void {
    this.cache = {};
    this.preloadQueue.clear();
    this.loadingQueue.clear();
  }

  // Cleanup
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.idleCallback) {
      window.cancelIdleCallback(this.idleCallback);
    }
    
    this.clearCache();
  }
}

// Instância singleton
const lazyLoader = new LazyLoader();

// Funções de conveniência
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentId: string,
  options?: LoadingOptions
) => lazyLoader.createLazyComponent(importFn, componentId, options);

export const preloadComponent = (componentId: string) => 
  lazyLoader.preloadComponent(componentId);

export const preloadComponents = (componentIds: string[]) => 
  lazyLoader.preloadComponents(componentIds);

export const preloadForRoute = (routePath: string) => 
  lazyLoader.preloadForRoute(routePath);

export const observeElement = (element: Element, componentId: string) => 
  lazyLoader.observeElement(element, componentId);

export const unobserveElement = (element: Element) => 
  lazyLoader.unobserveElement(element);

export const getCacheStats = () => lazyLoader.getCacheStats();

export const clearLazyCache = () => lazyLoader.clearCache();

// Hook para usar o lazy loader
export const useLazyLoader = () => {
  return {
    createLazyComponent,
    preloadComponent,
    preloadComponents,
    preloadForRoute,
    observeElement,
    unobserveElement,
    getCacheStats,
    clearCache: clearLazyCache
  };
};

export default lazyLoader;
export type { LoadingOptions, LazyComponentCache };