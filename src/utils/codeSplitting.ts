import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { RouteObject } from 'react-router-dom';

// Tipos para configuração de code splitting
export interface CodeSplittingConfig {
  preloadDelay?: number;
  retryAttempts?: number;
  chunkLoadTimeout?: number;
  enablePrefetch?: boolean;
  enablePreload?: boolean;
}

export interface LazyComponentOptions {
  fallback?: ComponentType;
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  prefetch?: boolean;
  priority?: 'high' | 'medium' | 'low';
  chunkName?: string;
}

export interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  duplicates: string[];
  unusedModules: string[];
  recommendations: string[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  loadTime?: number;
  cached?: boolean;
}

// Configuração padrão
const defaultConfig: CodeSplittingConfig = {
  preloadDelay: 2000,
  retryAttempts: 3,
  chunkLoadTimeout: 10000,
  enablePrefetch: true,
  enablePreload: true
};

// Cache para componentes carregados
const componentCache = new Map<string, ComponentType<any>>();
const preloadPromises = new Map<string, Promise<any>>();

// Estatísticas de carregamento
const loadingStats = {
  totalChunks: 0,
  loadedChunks: 0,
  failedChunks: 0,
  averageLoadTime: 0,
  cacheHits: 0
};

/**
 * Cria um componente lazy com opções avançadas
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const componentKey = options.chunkName || importFn.toString();
  
  // Verifica se já está em cache
  if (componentCache.has(componentKey)) {
    loadingStats.cacheHits++;
    return lazy(() => Promise.resolve({ default: componentCache.get(componentKey)! }));
  }

  // Wrapper para adicionar retry e timeout
  const enhancedImportFn = async (): Promise<{ default: T }> => {
    const startTime = performance.now();
    let lastError: Error;

    for (let attempt = 0; attempt < (defaultConfig.retryAttempts || 3); attempt++) {
      try {
        // Timeout para carregamento
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Chunk load timeout after ${defaultConfig.chunkLoadTimeout}ms`));
          }, defaultConfig.chunkLoadTimeout);
        });

        const result = await Promise.race([importFn(), timeoutPromise]);
        
        // Atualiza estatísticas
        const loadTime = performance.now() - startTime;
        loadingStats.totalChunks++;
        loadingStats.loadedChunks++;
        loadingStats.averageLoadTime = 
          (loadingStats.averageLoadTime * (loadingStats.loadedChunks - 1) + loadTime) / loadingStats.loadedChunks;

        // Adiciona ao cache
        componentCache.set(componentKey, result.default);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        loadingStats.failedChunks++;
        
        // Aguarda antes de tentar novamente
        if (attempt < (defaultConfig.retryAttempts || 3) - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  };

  const LazyComponent = lazy(enhancedImportFn);

  // Preload se solicitado
  if (options.preload) {
    setTimeout(() => {
      preloadComponent(componentKey, enhancedImportFn);
    }, defaultConfig.preloadDelay);
  }

  // Prefetch se solicitado
  if (options.prefetch && defaultConfig.enablePrefetch) {
    requestIdleCallback(() => {
      prefetchComponent(componentKey, enhancedImportFn);
    });
  }

  return LazyComponent;
}

/**
 * Precarrega um componente
 */
export function preloadComponent(
  key: string, 
  importFn: () => Promise<{ default: ComponentType<any> }>
): Promise<void> {
  if (preloadPromises.has(key)) {
    return preloadPromises.get(key)!;
  }

  const promise = importFn()
    .then(module => {
      componentCache.set(key, module.default);
    })
    .catch(error => {
      console.warn(`Failed to preload component ${key}:`, error);
    });

  preloadPromises.set(key, promise);
  return promise;
}

/**
 * Prefetch de um componente (baixa prioridade)
 */
export function prefetchComponent(
  key: string,
  importFn: () => Promise<{ default: ComponentType<any> }>
): void {
  if (componentCache.has(key) || preloadPromises.has(key)) {
    return;
  }

  // Usa link prefetch se disponível
  if ('connection' in navigator && (navigator as any).connection?.effectiveType) {
    const connection = (navigator as any).connection;
    
    // Só faz prefetch em conexões rápidas
    if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
      preloadComponent(key, importFn);
    }
  } else {
    preloadComponent(key, importFn);
  }
}

/**
 * Cria rotas com lazy loading
 */
export function createLazyRoute(
  path: string,
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options: LazyComponentOptions = {}
): RouteObject {
  const LazyComponent = createLazyComponent(importFn, options);
  
  return {
    path,
    element: React.createElement(LazyComponent),
    // Preload quando a rota está prestes a ser visitada
    loader: async () => {
      if (options.preload !== false) {
        await preloadComponent(options.chunkName || path, importFn);
      }
      return null;
    }
  };
}

/**
 * Analisa o bundle e fornece recomendações
 */
export async function analyzeBundleSize(): Promise<BundleAnalysis> {
  const chunks: ChunkInfo[] = [];
  const duplicates: string[] = [];
  const unusedModules: string[] = [];
  const recommendations: string[] = [];

  // Simula análise de chunks (em produção, isso viria de ferramentas como webpack-bundle-analyzer)
  const mockChunks = [
    { name: 'main', size: 245000, modules: ['react', 'react-dom', 'app'] },
    { name: 'vendor', size: 180000, modules: ['lodash', 'moment', 'axios'] },
    { name: 'dashboard', size: 95000, modules: ['charts', 'dashboard-components'] },
    { name: 'analytics', size: 120000, modules: ['analytics-components', 'd3'] }
  ];

  let totalSize = 0;
  
  for (const chunk of mockChunks) {
    totalSize += chunk.size;
    chunks.push({
      ...chunk,
      loadTime: Math.random() * 2000 + 500, // Simula tempo de carregamento
      cached: Math.random() > 0.5
    });
  }

  // Detecta duplicatas (simulado)
  if (chunks.some(c => c.modules.includes('moment')) && 
      chunks.some(c => c.modules.includes('date-fns'))) {
    duplicates.push('moment e date-fns (use apenas uma biblioteca de datas)');
  }

  // Detecta módulos não utilizados (simulado)
  if (Math.random() > 0.7) {
    unusedModules.push('lodash/debounce', 'unused-component');
  }

  // Gera recomendações
  if (totalSize > 500000) {
    recommendations.push('Bundle muito grande. Considere dividir em mais chunks.');
  }
  
  if (chunks.some(c => c.size > 200000)) {
    recommendations.push('Alguns chunks são muito grandes. Considere code splitting adicional.');
  }
  
  if (duplicates.length > 0) {
    recommendations.push('Remova dependências duplicadas para reduzir o tamanho do bundle.');
  }
  
  if (unusedModules.length > 0) {
    recommendations.push('Remova módulos não utilizados para otimizar o bundle.');
  }

  return {
    totalSize,
    chunks,
    duplicates,
    unusedModules,
    recommendations
  };
}

/**
 * Otimiza o carregamento baseado na conexão do usuário
 */
export function optimizeForConnection(): void {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        // Desabilita preload e prefetch em conexões lentas
        defaultConfig.enablePrefetch = false;
        defaultConfig.enablePreload = false;
        defaultConfig.preloadDelay = 5000;
        break;
        
      case '3g':
        // Configuração moderada para 3G
        defaultConfig.enablePrefetch = true;
        defaultConfig.enablePreload = false;
        defaultConfig.preloadDelay = 3000;
        break;
        
      case '4g':
      default:
        // Configuração agressiva para conexões rápidas
        defaultConfig.enablePrefetch = true;
        defaultConfig.enablePreload = true;
        defaultConfig.preloadDelay = 1000;
        break;
    }
  }
}

/**
 * Limpa o cache de componentes
 */
export function clearComponentCache(): void {
  componentCache.clear();
  preloadPromises.clear();
}

/**
 * Obtém estatísticas de carregamento
 */
export function getLoadingStats() {
  return {
    ...loadingStats,
    cacheHitRate: loadingStats.totalChunks > 0 
      ? (loadingStats.cacheHits / loadingStats.totalChunks) * 100 
      : 0,
    successRate: loadingStats.totalChunks > 0 
      ? (loadingStats.loadedChunks / loadingStats.totalChunks) * 100 
      : 0
  };
}

/**
 * Hook para monitorar performance de code splitting
 */
export function useCodeSplittingMetrics() {
  const [metrics, setMetrics] = React.useState(getLoadingStats());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getLoadingStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
}

/**
 * Estratégias de cache para diferentes tipos de conteúdo
 */
export const cacheStrategies = {
  // Cache agressivo para recursos estáticos
  static: {
    maxAge: 31536000, // 1 ano
    strategy: 'cache-first'
  },
  
  // Cache moderado para componentes
  components: {
    maxAge: 86400, // 1 dia
    strategy: 'stale-while-revalidate'
  },
  
  // Cache mínimo para dados dinâmicos
  dynamic: {
    maxAge: 300, // 5 minutos
    strategy: 'network-first'
  }
};

/**
 * Implementa service worker para cache inteligente
 */
export function setupIntelligentCaching(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        
        // Comunica estratégias de cache para o service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'CACHE_STRATEGIES',
            strategies: cacheStrategies
          });
        }
      })
      .catch(error => {
        console.error('Erro ao registrar Service Worker:', error);
      });
  }
}

// Inicializa otimizações baseadas na conexão
optimizeForConnection();

// Monitora mudanças na conexão
if ('connection' in navigator) {
  (navigator as any).connection.addEventListener('change', optimizeForConnection);
}

export default {
  createLazyComponent,
  createLazyRoute,
  preloadComponent,
  prefetchComponent,
  analyzeBundleSize,
  clearComponentCache,
  getLoadingStats,
  setupIntelligentCaching,
  cacheStrategies
};