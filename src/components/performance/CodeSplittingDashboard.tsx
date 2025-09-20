// Dashboard para monitoramento de code splitting e lazy loading
import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Zap,
  Download,
  Eye,
  MousePointer,
  Clock,
  Wifi,
  WifiOff,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Package
} from 'lucide-react';
import { useCodeSplitting } from '../../hooks/useCodeSplitting';

interface PerformanceMetrics {
  loadTime: number;
  chunkSize: number;
  cacheHitRate: number;
  networkLatency: number;
}

interface ComponentDemo {
  id: string;
  name: string;
  description: string;
  strategy: 'immediate' | 'onIdle' | 'onHover' | 'onVisible';
  estimatedSize: string;
}

const CodeSplittingDashboard: React.FC = () => {
  const {
    isLoading,
    loadedChunks,
    failedChunks,
    cacheStats,
    networkInfo,
    createOptimizedLazyComponent,
    preloadComponent,
    preloadRoute,
    handleHoverPreload,
    observeForPreload,
    updateCacheStats,
    isSlowConnection,
    isSaveDataEnabled,
    loadingProgress
  } = useCodeSplitting();

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    chunkSize: 0,
    cacheHitRate: 0,
    networkLatency: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('onIdle');
  const [preloadQueue, setPreloadQueue] = useState<string[]>([]);
  
  const hoverDemoRef = useRef<HTMLDivElement>(null);
  const visibleDemoRef = useRef<HTMLDivElement>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Componentes de demonstração
  const demoComponents: ComponentDemo[] = [
    {
      id: 'VideoEditor',
      name: 'Editor de Vídeo',
      description: 'Componente principal do editor com timeline',
      strategy: 'immediate',
      estimatedSize: '~2.5MB'
    },
    {
      id: 'EffectsPanel',
      name: 'Painel de Efeitos',
      description: 'Biblioteca de efeitos visuais e filtros',
      strategy: 'onIdle',
      estimatedSize: '~1.8MB'
    },
    {
      id: 'AudioMixer',
      name: 'Mixer de Áudio',
      description: 'Controles avançados de áudio',
      strategy: 'onHover',
      estimatedSize: '~1.2MB'
    },
    {
      id: 'AnalyticsDashboard',
      name: 'Dashboard Analytics',
      description: 'Métricas e relatórios detalhados',
      strategy: 'onVisible',
      estimatedSize: '~900KB'
    }
  ];

  // Simular métricas de performance
  useEffect(() => {
    if (isMonitoring) {
      metricsIntervalRef.current = setInterval(() => {
        const now = performance.now();
        const loadTime = Math.random() * 1000 + 200;
        const chunkSize = Math.random() * 2000 + 500;
        const cacheHitRate = Math.random() * 100;
        const networkLatency = isSlowConnection ? Math.random() * 500 + 200 : Math.random() * 100 + 50;

        setMetrics({
          loadTime,
          chunkSize,
          cacheHitRate,
          networkLatency
        });
      }, 2000);
    } else {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    }

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [isMonitoring, isSlowConnection]);

  // Configurar observers para demonstração
  useEffect(() => {
    if (hoverDemoRef.current) {
      const handleMouseEnter = () => handleHoverPreload('AudioMixer');
      hoverDemoRef.current.addEventListener('mouseenter', handleMouseEnter);
      
      return () => {
        hoverDemoRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      };
    }
  }, [handleHoverPreload]);

  useEffect(() => {
    if (visibleDemoRef.current) {
      observeForPreload(visibleDemoRef.current, 'AnalyticsDashboard');
    }
  }, [observeForPreload]);

  // Preload manual
  const handleManualPreload = (componentId: string) => {
    preloadComponent(componentId);
    setPreloadQueue(prev => [...prev, componentId]);
    
    // Remover da queue após 3 segundos
    setTimeout(() => {
      setPreloadQueue(prev => prev.filter(id => id !== componentId));
    }, 3000);
  };

  // Preload de rota
  const handleRoutePreload = (route: string) => {
    preloadRoute(route);
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return 'text-green-500';
      case 'loading': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Obter status do componente
  const getComponentStatus = (componentId: string) => {
    if (loadedChunks.has(componentId)) return 'loaded';
    if (failedChunks.has(componentId)) return 'failed';
    if (preloadQueue.includes(componentId)) return 'loading';
    return 'pending';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Code Splitting Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitoramento de lazy loading e performance
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={updateCacheStats}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Chunks Carregados
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {cacheStats.preloaded}/{cacheStats.total}
          </p>
          <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Tempo de Carga
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {metrics.loadTime.toFixed(0)}ms
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            {isSlowConnection ? 'Conexão lenta' : 'Conexão rápida'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Cache Hit Rate
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {metrics.cacheHitRate.toFixed(1)}%
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            Eficiência do cache
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {isSlowConnection ? (
              <WifiOff className="w-5 h-5 text-orange-600" />
            ) : (
              <Wifi className="w-5 h-5 text-orange-600" />
            )}
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Latência
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {metrics.networkLatency.toFixed(0)}ms
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
            {networkInfo.effectiveType || 'N/A'}
          </p>
        </div>
      </div>

      {/* Alertas de Performance */}
      {(isSlowConnection || isSaveDataEnabled) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Otimizações Ativas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSlowConnection && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                Modo Conexão Lenta
              </span>
            )}
            {isSaveDataEnabled && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                Save Data Ativo
              </span>
            )}
          </div>
        </div>
      )}

      {/* Demonstração de Estratégias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Componentes e Estratégias
          </h3>
          <div className="space-y-3">
            {demoComponents.map((component) => {
              const status = getComponentStatus(component.id);
              const statusColor = getStatusColor(status);
              
              return (
                <div key={component.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${statusColor.replace('text-', 'bg-')}`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {component.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {component.estimatedSize}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleManualPreload(component.id)}
                      disabled={status === 'loaded' || status === 'loading'}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {status === 'loaded' ? 'Carregado' : status === 'loading' ? 'Carregando...' : 'Preload'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {component.description}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    {component.strategy === 'immediate' && <Zap className="w-4 h-4 text-yellow-500" />}
                    {component.strategy === 'onIdle' && <Clock className="w-4 h-4 text-blue-500" />}
                    {component.strategy === 'onHover' && <MousePointer className="w-4 h-4 text-green-500" />}
                    {component.strategy === 'onVisible' && <Eye className="w-4 h-4 text-purple-500" />}
                    
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {component.strategy.replace('on', 'On ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Demonstrações Interativas
          </h3>
          
          <div className="space-y-4">
            {/* Hover Demo */}
            <div 
              ref={hoverDemoRef}
              className="bg-green-50 dark:bg-green-900/20 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2 mb-2">
                <MousePointer className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Hover Preload Demo
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Passe o mouse aqui para precarregar o AudioMixer
              </p>
            </div>

            {/* Visibility Demo */}
            <div 
              ref={visibleDemoRef}
              className="bg-purple-50 dark:bg-purple-900/20 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  Visibility Preload Demo
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Este componente será precarregado quando visível
              </p>
            </div>

            {/* Route Preload */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Download className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Preload de Rota
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {['/editor', '/projects', '/settings', '/analytics'].map(route => (
                  <button
                    key={route}
                    onClick={() => handleRoutePreload(route)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    {route}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Estatísticas de Cache
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{cacheStats.total}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{cacheStats.preloaded}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Carregados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{cacheStats.loading}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Carregando</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{cacheStats.errors}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Erros</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{cacheStats.pending}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pendentes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSplittingDashboard;