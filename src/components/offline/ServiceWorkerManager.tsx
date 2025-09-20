// Componente para gerenciamento do Service Worker
import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Activity,
  Database,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useServiceWorker } from '../../hooks/useServiceWorker';

interface ServiceWorkerManagerProps {
  className?: string;
}

const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({ className = '' }) => {
  const {
    isSupported,
    isRegistered,
    isInstalling,
    isWaiting,
    isControlling,
    updateAvailable,
    error,
    cacheStats,
    networkStatus,
    activateUpdate,
    getCacheStats,
    clearCache,
    preloadAssets,
    forceUpdate,
    checkOfflineCapability,
    isOffline,
    isSlowConnection,
    isSaveDataEnabled
  } = useServiceWorker();

  const [preloadUrls, setPreloadUrls] = useState<string>('');
  const [selectedCache, setSelectedCache] = useState<string>('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [offlineTest, setOfflineTest] = useState<boolean | null>(null);

  // Atualizar estatísticas de cache periodicamente
  useEffect(() => {
    if (isRegistered) {
      getCacheStats();
      const interval = setInterval(getCacheStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isRegistered, getCacheStats]);

  // Testar capacidade offline
  const handleOfflineTest = async () => {
    const result = await checkOfflineCapability();
    setOfflineTest(result);
  };

  // Precarregar assets
  const handlePreloadAssets = async () => {
    if (!preloadUrls.trim()) return;
    
    setIsPreloading(true);
    try {
      const urls = preloadUrls.split('\n').map(url => url.trim()).filter(Boolean);
      await preloadAssets(urls);
      setPreloadUrls('');
      await getCacheStats();
    } catch (error) {
      console.error('Erro ao precarregar assets:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  // Limpar cache
  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache(selectedCache || undefined);
      setSelectedCache('');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Calcular total de itens em cache
  const totalCacheItems = Object.values(cacheStats).reduce((total, cache) => total + cache.count, 0);

  // Status do Service Worker
  const getServiceWorkerStatus = () => {
    if (!isSupported) return { text: 'Não Suportado', color: 'text-red-500', icon: AlertCircle };
    if (error) return { text: 'Erro', color: 'text-red-500', icon: AlertCircle };
    if (isInstalling) return { text: 'Instalando', color: 'text-yellow-500', icon: Clock };
    if (updateAvailable) return { text: 'Atualização Disponível', color: 'text-blue-500', icon: Download };
    if (isControlling) return { text: 'Ativo', color: 'text-green-500', icon: CheckCircle };
    if (isRegistered) return { text: 'Registrado', color: 'text-green-500', icon: CheckCircle };
    return { text: 'Desconectado', color: 'text-gray-500', icon: AlertCircle };
  };

  const swStatus = getServiceWorkerStatus();
  const StatusIcon = swStatus.icon;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Service Worker Manager
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerenciamento de cache offline e performance
            </p>
          </div>
        </div>
        
        {/* Status da Rede */}
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <WifiOff className="w-5 h-5 text-red-500" />
          ) : (
            <Wifi className="w-5 h-5 text-green-500" />
          )}
          <span className={`text-sm font-medium ${
            isOffline ? 'text-red-500' : 'text-green-500'
          }`}>
            {isOffline ? 'Offline' : 'Online'}
          </span>
        </div>
      </div>

      {/* Status do Service Worker */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <StatusIcon className={`w-5 h-5 ${swStatus.color}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </span>
          </div>
          <p className={`text-lg font-semibold ${swStatus.color}`}>
            {swStatus.text}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cache
            </span>
          </div>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {totalCacheItems} itens
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conexão
            </span>
          </div>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {networkStatus.effectiveType || 'N/A'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Performance
            </span>
          </div>
          <div className="flex space-x-1">
            {isSlowConnection && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Lenta
              </span>
            )}
            {isSaveDataEnabled && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Save Data
              </span>
            )}
            {!isSlowConnection && !isSaveDataEnabled && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Normal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Erro no Service Worker
            </span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error}
          </p>
        </div>
      )}

      {updateAvailable && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Atualização Disponível
              </span>
            </div>
            <button
              onClick={activateUpdate}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Atualizar Agora
            </button>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Uma nova versão está disponível. Clique para atualizar.
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preload de Assets */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preload de Assets
          </h3>
          <div className="space-y-3">
            <textarea
              value={preloadUrls}
              onChange={(e) => setPreloadUrls(e.target.value)}
              placeholder="Digite as URLs (uma por linha)\n/assets/image1.jpg\n/assets/script.js\n/api/data"
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handlePreloadAssets}
              disabled={!preloadUrls.trim() || isPreloading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isPreloading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isPreloading ? 'Precarregando...' : 'Precarregar Assets'}</span>
            </button>
          </div>
        </div>

        {/* Gerenciamento de Cache */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciamento de Cache
          </h3>
          <div className="space-y-3">
            <select
              value={selectedCache}
              onChange={(e) => setSelectedCache(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os caches</option>
              {Object.keys(cacheStats).map(cacheName => (
                <option key={cacheName} value={cacheName}>
                  {cacheName} ({cacheStats[cacheName].count} itens)
                </option>
              ))}
            </select>
            
            <div className="flex space-x-2">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isClearing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isClearing ? 'Limpando...' : 'Limpar Cache'}</span>
              </button>
              
              <button
                onClick={forceUpdate}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teste de Capacidade Offline */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Teste de Capacidade Offline
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verificar se a aplicação funciona offline
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {offlineTest !== null && (
              <div className={`flex items-center space-x-1 ${
                offlineTest ? 'text-green-600' : 'text-red-600'
              }`}>
                {offlineTest ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {offlineTest ? 'Funcionando' : 'Falhou'}
                </span>
              </div>
            )}
            
            <button
              onClick={handleOfflineTest}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Testar
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Detalhadas */}
      {Object.keys(cacheStats).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estatísticas de Cache
          </h3>
          <div className="space-y-3">
            {Object.entries(cacheStats).map(([cacheName, stats]) => (
              <div key={cacheName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {cacheName}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stats.count} itens
                  </span>
                </div>
                {stats.urls.length > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    {stats.urls.slice(0, 3).map((url, index) => (
                      <div key={index} className="truncate">
                        {url}
                      </div>
                    ))}
                    {stats.urls.length > 3 && (
                      <div className="text-gray-500 dark:text-gray-400">
                        +{stats.urls.length - 3} mais...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceWorkerManager;