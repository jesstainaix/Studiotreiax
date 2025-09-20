import { create } from 'zustand';

// Types and Interfaces
interface CacheStrategy {
  id: string;
  name: string;
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxAge: number;
  maxEntries: number;
  enabled: boolean;
}

interface ServiceWorkerStats {
  isRegistered: boolean;
  isActive: boolean;
  isControlling: boolean;
  version: string;
  lastUpdate: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  offlineRequests: number;
  totalCacheSize: number;
  cacheNames: string[];
}

interface OfflineResource {
  id: string;
  url: string;
  type: 'essential' | 'important' | 'optional';
  size: number;
  cached: boolean;
  lastAccessed: number;
  priority: number;
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface SWConfig {
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  enablePeriodicSync: boolean;
  cacheVersion: string;
  maxCacheSize: number;
  cleanupInterval: number;
  updateCheckInterval: number;
  offlinePageUrl: string;
  fallbackImageUrl: string;
}

interface SWMetrics {
  requestCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  offlineUsageTime: number;
  backgroundSyncCount: number;
  pushNotificationCount: number;
  errorCount: number;
  lastErrorTime: number;
}

interface SWEvent {
  id: string;
  type: 'install' | 'activate' | 'fetch' | 'sync' | 'push' | 'message' | 'error';
  timestamp: number;
  data: any;
  success: boolean;
  duration?: number;
}

interface DebugLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
}

// Store Interface
interface ServiceWorkerStore {
  // State
  stats: ServiceWorkerStats;
  strategies: CacheStrategy[];
  offlineResources: OfflineResource[];
  networkStatus: NetworkStatus;
  config: SWConfig;
  metrics: SWMetrics;
  events: SWEvent[];
  debugLogs: DebugLog[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  registerServiceWorker: () => Promise<void>;
  unregisterServiceWorker: () => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  
  // Cache Management
  addCacheStrategy: (strategy: Omit<CacheStrategy, 'id'>) => void;
  updateCacheStrategy: (id: string, updates: Partial<CacheStrategy>) => void;
  removeCacheStrategy: (id: string) => void;
  clearCache: (cacheName?: string) => Promise<void>;
  preloadResources: (urls: string[]) => Promise<void>;
  
  // Offline Resources
  addOfflineResource: (resource: Omit<OfflineResource, 'id' | 'cached' | 'lastAccessed'>) => void;
  removeOfflineResource: (id: string) => void;
  syncOfflineResources: () => Promise<void>;
  
  // Network Status
  updateNetworkStatus: () => void;
  
  // Configuration
  updateConfig: (updates: Partial<SWConfig>) => void;
  resetConfig: () => void;
  
  // Metrics
  updateMetrics: (updates: Partial<SWMetrics>) => void;
  resetMetrics: () => void;
  
  // Events
  addEvent: (event: Omit<SWEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  
  // Utilities
  getCacheSize: () => Promise<number>;
  cleanupOldCaches: () => Promise<void>;
  exportData: () => string;
  importData: (data: string) => void;
  
  // Quick Actions
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  forceUpdate: () => Promise<void>;
  
  // Advanced Features
  enableBackgroundSync: () => void;
  disableBackgroundSync: () => void;
  schedulePeriodicSync: (tag: string, interval: number) => void;
  requestPushPermission: () => Promise<boolean>;
  
  // Debug
  addDebugLog: (level: DebugLog['level'], source: string, message: string, data?: any) => void;
  clearDebugLogs: () => void;
  exportDebugLogs: () => string;
  getSystemInfo: () => any;
}

// Default configurations
const defaultStrategies: CacheStrategy[] = [
  {
    id: 'static-assets',
    name: 'Static Assets',
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100,
    enabled: true
  },
  {
    id: 'api-calls',
    name: 'API Calls',
    pattern: /\/api\//,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    enabled: true
  },
  {
    id: 'pages',
    name: 'Pages',
    pattern: /\/((?!api).)*$/,
    strategy: 'stale-while-revalidate',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 30,
    enabled: true
  }
];

const defaultConfig: SWConfig = {
  enableOfflineMode: true,
  enableBackgroundSync: true,
  enablePushNotifications: false,
  enablePeriodicSync: false,
  cacheVersion: 'v1',
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  updateCheckInterval: 60 * 60 * 1000, // 1 hour
  offlinePageUrl: '/offline.html',
  fallbackImageUrl: '/images/fallback.png'
};

const defaultStats: ServiceWorkerStats = {
  isRegistered: false,
  isActive: false,
  isControlling: false,
  version: '',
  lastUpdate: 0,
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0,
  totalCacheSize: 0,
  cacheNames: []
};

const defaultNetworkStatus: NetworkStatus = {
  isOnline: navigator.onLine,
  connectionType: 'unknown',
  effectiveType: 'unknown',
  downlink: 0,
  rtt: 0,
  saveData: false
};

const defaultMetrics: SWMetrics = {
  requestCount: 0,
  cacheHitRate: 0,
  averageResponseTime: 0,
  offlineUsageTime: 0,
  backgroundSyncCount: 0,
  pushNotificationCount: 0,
  errorCount: 0,
  lastErrorTime: 0
};

// Zustand Store
export const useServiceWorkerStore = create<ServiceWorkerStore>((set, get) => ({
  // Initial State
  stats: defaultStats,
  strategies: defaultStrategies,
  offlineResources: [],
  networkStatus: defaultNetworkStatus,
  config: defaultConfig,
  metrics: defaultMetrics,
  events: [],
  debugLogs: [],
  isLoading: false,
  error: null,
  
  // Service Worker Management
  registerServiceWorker: async () => {
    if (!('serviceWorker' in navigator)) {
      get().addDebugLog('error', 'ServiceWorker', 'Service Workers not supported');
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      get().addDebugLog('info', 'ServiceWorker', 'Service Worker registered successfully');
      get().addEvent({
        type: 'install',
        data: { scope: registration.scope },
        success: true
      });
      
      // Update stats
      set(state => ({
        stats: {
          ...state.stats,
          isRegistered: true,
          version: get().config.cacheVersion,
          lastUpdate: Date.now()
        },
        isLoading: false
      }));
      
      // Set up event listeners
      registration.addEventListener('updatefound', () => {
        get().addDebugLog('info', 'ServiceWorker', 'New service worker version found');
      });
      
    } catch (error) {
      get().addDebugLog('error', 'ServiceWorker', 'Failed to register service worker', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  unregisterServiceWorker: async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        get().addDebugLog('info', 'ServiceWorker', 'Service Worker unregistered');
        
        set(state => ({
          stats: {
            ...state.stats,
            isRegistered: false,
            isActive: false,
            isControlling: false
          }
        }));
      }
    } catch (error) {
      get().addDebugLog('error', 'ServiceWorker', 'Failed to unregister service worker', error);
    }
  },
  
  updateServiceWorker: async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        get().addDebugLog('info', 'ServiceWorker', 'Service Worker update triggered');
      }
    } catch (error) {
      get().addDebugLog('error', 'ServiceWorker', 'Failed to update service worker', error);
    }
  },
  
  skipWaiting: async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        get().addDebugLog('info', 'ServiceWorker', 'Skip waiting triggered');
      }
    } catch (error) {
      get().addDebugLog('error', 'ServiceWorker', 'Failed to skip waiting', error);
    }
  },
  
  // Cache Management
  addCacheStrategy: (strategy) => {
    const newStrategy: CacheStrategy = {
      ...strategy,
      id: `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    set(state => ({
      strategies: [...state.strategies, newStrategy]
    }));
    
    get().addDebugLog('info', 'CacheStrategy', `Added cache strategy: ${newStrategy.name}`);
  },
  
  updateCacheStrategy: (id, updates) => {
    set(state => ({
      strategies: state.strategies.map(strategy =>
        strategy.id === id ? { ...strategy, ...updates } : strategy
      )
    }));
    
    get().addDebugLog('info', 'CacheStrategy', `Updated cache strategy: ${id}`);
  },
  
  removeCacheStrategy: (id) => {
    set(state => ({
      strategies: state.strategies.filter(strategy => strategy.id !== id)
    }));
    
    get().addDebugLog('info', 'CacheStrategy', `Removed cache strategy: ${id}`);
  },
  
  clearCache: async (cacheName) => {
    if (!('caches' in window)) return;
    
    try {
      if (cacheName) {
        await caches.delete(cacheName);
        get().addDebugLog('info', 'Cache', `Cleared cache: ${cacheName}`);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        get().addDebugLog('info', 'Cache', 'Cleared all caches');
      }
      
      // Update cache size
      const newSize = await get().getCacheSize();
      set(state => ({
        stats: {
          ...state.stats,
          totalCacheSize: newSize
        }
      }));
      
    } catch (error) {
      get().addDebugLog('error', 'Cache', 'Failed to clear cache', error);
    }
  },
  
  preloadResources: async (urls) => {
    if (!('caches' in window)) return;
    
    try {
      const cache = await caches.open(`preload-${get().config.cacheVersion}`);
      await cache.addAll(urls);
      
      get().addDebugLog('info', 'Cache', `Preloaded ${urls.length} resources`);
      
      // Update cache size
      const newSize = await get().getCacheSize();
      set(state => ({
        stats: {
          ...state.stats,
          totalCacheSize: newSize
        }
      }));
      
    } catch (error) {
      get().addDebugLog('error', 'Cache', 'Failed to preload resources', error);
    }
  },
  
  // Offline Resources
  addOfflineResource: (resource) => {
    const newResource: OfflineResource = {
      ...resource,
      id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cached: false,
      lastAccessed: Date.now()
    };
    
    set(state => ({
      offlineResources: [...state.offlineResources, newResource]
    }));
    
    get().addDebugLog('info', 'OfflineResource', `Added offline resource: ${resource.url}`);
  },
  
  removeOfflineResource: (id) => {
    set(state => ({
      offlineResources: state.offlineResources.filter(resource => resource.id !== id)
    }));
    
    get().addDebugLog('info', 'OfflineResource', `Removed offline resource: ${id}`);
  },
  
  syncOfflineResources: async () => {
    const { offlineResources } = get();
    
    for (const resource of offlineResources) {
      try {
        const response = await fetch(resource.url);
        if (response.ok) {
          const cache = await caches.open(`offline-${get().config.cacheVersion}`);
          await cache.put(resource.url, response);
          
          // Update resource status
          set(state => ({
            offlineResources: state.offlineResources.map(r =>
              r.id === resource.id ? { ...r, cached: true, lastAccessed: Date.now() } : r
            )
          }));
        }
      } catch (error) {
        get().addDebugLog('error', 'OfflineResource', `Failed to sync resource: ${resource.url}`, error);
      }
    }
  },
  
  // Network Status
  updateNetworkStatus: () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const status: NetworkStatus = {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
    
    set({ networkStatus: status });
  },
  
  // Configuration
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
    
    get().addDebugLog('info', 'Config', 'Configuration updated', updates);
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
    get().addDebugLog('info', 'Config', 'Configuration reset to defaults');
  },
  
  // Metrics
  updateMetrics: (updates) => {
    set(state => ({
      metrics: { ...state.metrics, ...updates }
    }));
  },
  
  resetMetrics: () => {
    set({ metrics: defaultMetrics });
    get().addDebugLog('info', 'Metrics', 'Metrics reset');
  },
  
  // Events
  addEvent: (event) => {
    const newEvent: SWEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({
      events: [newEvent, ...state.events].slice(0, 100) // Keep last 100 events
    }));
  },
  
  clearEvents: () => {
    set({ events: [] });
    get().addDebugLog('info', 'Events', 'Events cleared');
  },
  
  // Utilities
  getCacheSize: async () => {
    if (!('caches' in window)) return 0;
    
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      get().addDebugLog('error', 'Cache', 'Failed to calculate cache size', error);
      return 0;
    }
  },
  
  cleanupOldCaches: async () => {
    if (!('caches' in window)) return;
    
    try {
      const cacheNames = await caches.keys();
      const currentVersion = get().config.cacheVersion;
      
      const oldCaches = cacheNames.filter(name => !name.includes(currentVersion));
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      
      get().addDebugLog('info', 'Cache', `Cleaned up ${oldCaches.length} old caches`);
      
    } catch (error) {
      get().addDebugLog('error', 'Cache', 'Failed to cleanup old caches', error);
    }
  },
  
  exportData: () => {
    const { strategies, offlineResources, config, metrics } = get();
    return JSON.stringify({
      strategies,
      offlineResources,
      config,
      metrics,
      exportedAt: new Date().toISOString()
    }, null, 2);
  },
  
  importData: (data) => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.strategies) set(state => ({ ...state, strategies: parsed.strategies }));
      if (parsed.offlineResources) set(state => ({ ...state, offlineResources: parsed.offlineResources }));
      if (parsed.config) set(state => ({ ...state, config: parsed.config }));
      if (parsed.metrics) set(state => ({ ...state, metrics: parsed.metrics }));
      
      get().addDebugLog('info', 'Data', 'Data imported successfully');
    } catch (error) {
      get().addDebugLog('error', 'Data', 'Failed to import data', error);
    }
  },
  
  // Quick Actions
  enableOfflineMode: () => {
    get().updateConfig({ enableOfflineMode: true });
    get().addDebugLog('info', 'OfflineMode', 'Offline mode enabled');
  },
  
  disableOfflineMode: () => {
    get().updateConfig({ enableOfflineMode: false });
    get().addDebugLog('info', 'OfflineMode', 'Offline mode disabled');
  },
  
  forceUpdate: async () => {
    await get().updateServiceWorker();
    await get().skipWaiting();
    window.location.reload();
  },
  
  // Advanced Features
  enableBackgroundSync: () => {
    get().updateConfig({ enableBackgroundSync: true });
    get().addDebugLog('info', 'BackgroundSync', 'Background sync enabled');
  },
  
  disableBackgroundSync: () => {
    get().updateConfig({ enableBackgroundSync: false });
    get().addDebugLog('info', 'BackgroundSync', 'Background sync disabled');
  },
  
  schedulePeriodicSync: (tag, interval) => {
    if ('serviceWorker' in navigator && 'periodicSync' in window) {
      navigator.serviceWorker.ready.then(registration => {
        return (registration as any).periodicSync.register(tag, {
          minInterval: interval
        });
      }).then(() => {
        get().addDebugLog('info', 'PeriodicSync', `Scheduled periodic sync: ${tag}`);
      }).catch(error => {
        get().addDebugLog('error', 'PeriodicSync', 'Failed to schedule periodic sync', error);
      });
    }
  },
  
  requestPushPermission: async () => {
    if (!('Notification' in window)) {
      get().addDebugLog('error', 'Push', 'Push notifications not supported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      get().updateConfig({ enablePushNotifications: granted });
      get().addDebugLog('info', 'Push', `Push permission: ${permission}`);
      
      return granted;
    } catch (error) {
      get().addDebugLog('error', 'Push', 'Failed to request push permission', error);
      return false;
    }
  },
  
  // Debug
  addDebugLog: (level, source, message, data) => {
    const log: DebugLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      source,
      message,
      data
    };
    
    set(state => ({
      debugLogs: [log, ...state.debugLogs].slice(0, 200) // Keep last 200 logs
    }));
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },
  
  exportDebugLogs: () => {
    return JSON.stringify(get().debugLogs, null, 2);
  },
  
  getSystemInfo: () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      cacheSupported: 'caches' in window,
      pushSupported: 'PushManager' in window,
      notificationSupported: 'Notification' in window,
      timestamp: new Date().toISOString()
    };
  }
}));

// Service Worker Manager Class
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  
  private constructor() {
    this.initialize();
  }
  
  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }
  
  private async initialize() {
    const store = useServiceWorkerStore.getState();
    
    // Set up network status monitoring
    window.addEventListener('online', () => {
      store.updateNetworkStatus();
      store.addDebugLog('info', 'Network', 'Connection restored');
    });
    
    window.addEventListener('offline', () => {
      store.updateNetworkStatus();
      store.addDebugLog('warn', 'Network', 'Connection lost');
    });
    
    // Monitor connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        store.updateNetworkStatus();
      });
    }
    
    // Auto-register service worker if enabled
    if (store.config.enableOfflineMode) {
      await store.registerServiceWorker();
    }
    
    // Set up periodic cleanup
    setInterval(() => {
      store.cleanupOldCaches();
    }, store.config.cleanupInterval);
    
    // Set up update checks
    setInterval(() => {
      store.updateServiceWorker();
    }, store.config.updateCheckInterval);
  }
}

// Global instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Utility functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStrategyColor = (strategy: string): string => {
  switch (strategy) {
    case 'cache-first': return 'text-green-600';
    case 'network-first': return 'text-blue-600';
    case 'stale-while-revalidate': return 'text-purple-600';
    case 'network-only': return 'text-red-600';
    case 'cache-only': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getConnectionColor = (type: string): string => {
  switch (type) {
    case 'wifi': return 'text-green-600';
    case 'cellular': return 'text-blue-600';
    case 'ethernet': return 'text-purple-600';
    case 'bluetooth': return 'text-indigo-600';
    default: return 'text-gray-600';
  }
};

export const getResourceTypeIcon = (type: string): string => {
  switch (type) {
    case 'essential': return '🔴';
    case 'important': return '🟡';
    case 'optional': return '🟢';
    default: return '⚪';
  }
};