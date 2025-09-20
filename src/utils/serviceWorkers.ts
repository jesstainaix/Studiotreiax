import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface CacheStrategy {
  id: string;
  name: string;
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxAge: number;
  maxEntries: number;
  enabled: boolean;
}

export interface CacheEntry {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  size: number;
  strategy: string;
  hits: number;
  lastAccessed: number;
  headers: Record<string, string>;
  data?: any;
}

export interface OfflineQueue {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SyncTask {
  id: string;
  type: 'upload' | 'download' | 'sync' | 'backup';
  data: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  retries: number;
  maxRetries: number;
}

export interface ServiceWorkerConfig {
  enabled: boolean;
  debug: boolean;
  cacheVersion: string;
  offlineMode: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  updateInterval: number;
  maxCacheSize: number;
  cleanupInterval: number;
  strategies: CacheStrategy[];
}

export interface ServiceWorkerStats {
  isOnline: boolean;
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  offlineRequests: number;
  syncTasks: number;
  cacheSize: number;
  lastUpdate: number;
  uptime: number;
  errors: number;
}

export interface ServiceWorkerMetrics {
  responseTime: number[];
  cacheEfficiency: number;
  offlineUsage: number;
  syncSuccess: number;
  errorRate: number;
  bandwidth: number;
  storage: number;
}

export interface ServiceWorkerEvent {
  id: string;
  type: 'install' | 'activate' | 'fetch' | 'sync' | 'push' | 'message' | 'error';
  timestamp: number;
  data: any;
  url?: string;
  duration?: number;
  success: boolean;
}

export interface ServiceWorkerDebugLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  data?: any;
  stack?: string;
}

// Zustand Store
interface ServiceWorkerStore {
  // State
  isRegistered: boolean;
  isOnline: boolean;
  config: ServiceWorkerConfig;
  stats: ServiceWorkerStats;
  metrics: ServiceWorkerMetrics;
  cacheEntries: CacheEntry[];
  offlineQueue: OfflineQueue[];
  syncTasks: SyncTask[];
  events: ServiceWorkerEvent[];
  debugLogs: ServiceWorkerDebugLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  updateConfig: (config: Partial<ServiceWorkerConfig>) => void;
  addCacheStrategy: (strategy: CacheStrategy) => void;
  removeCacheStrategy: (id: string) => void;
  clearCache: (pattern?: string) => Promise<void>;
  addToOfflineQueue: (request: Omit<OfflineQueue, 'id' | 'timestamp' | 'retries' | 'status'>) => void;
  processOfflineQueue: () => Promise<void>;
  addSyncTask: (task: Omit<SyncTask, 'id' | 'timestamp' | 'status' | 'progress' | 'retries'>) => void;
  processSyncTasks: () => Promise<void>;
  getStats: () => ServiceWorkerStats;
  getMetrics: () => ServiceWorkerMetrics;
  addEvent: (event: Omit<ServiceWorkerEvent, 'id' | 'timestamp'>) => void;
  addDebugLog: (log: Omit<ServiceWorkerDebugLog, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  clearDebugLogs: () => void;
  exportData: () => any;
  importData: (data: any) => void;
  reset: () => void;

  // Utilities
  getCacheEntry: (url: string) => CacheEntry | null;
  getOfflineQueueItem: (id: string) => OfflineQueue | null;
  getSyncTask: (id: string) => SyncTask | null;
  updateCacheEntry: (id: string, updates: Partial<CacheEntry>) => void;
  updateOfflineQueueItem: (id: string, updates: Partial<OfflineQueue>) => void;
  updateSyncTask: (id: string, updates: Partial<SyncTask>) => void;
  removeCacheEntry: (id: string) => void;
  removeOfflineQueueItem: (id: string) => void;
  removeSyncTask: (id: string) => void;

  // Quick Actions
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  enableBackgroundSync: () => void;
  disableBackgroundSync: () => void;
  clearAllCaches: () => Promise<void>;
  retryFailedTasks: () => Promise<void>;

  // Advanced Features
  preloadResources: (urls: string[]) => Promise<void>;
  optimizeCache: () => Promise<void>;
  analyzePerformance: () => any;
  generateReport: () => any;

  // System Operations
  checkForUpdates: () => Promise<boolean>;
  installUpdate: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  claimClients: () => Promise<void>;

  // Debug
  enableDebug: () => void;
  disableDebug: () => void;
  getDebugInfo: () => any;
}

const defaultConfig: ServiceWorkerConfig = {
  enabled: true,
  debug: false,
  cacheVersion: '1.0.0',
  offlineMode: true,
  backgroundSync: true,
  pushNotifications: false,
  updateInterval: 60000,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  cleanupInterval: 300000, // 5 minutes
  strategies: [
    {
      id: 'static-assets',
      name: 'Static Assets',
      pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/,
      strategy: 'cache-first',
      maxAge: 86400000, // 24 hours
      maxEntries: 100,
      enabled: true
    },
    {
      id: 'api-calls',
      name: 'API Calls',
      pattern: /\/api\//,
      strategy: 'network-first',
      maxAge: 300000, // 5 minutes
      maxEntries: 50,
      enabled: true
    },
    {
      id: 'html-pages',
      name: 'HTML Pages',
      pattern: /\.html$/,
      strategy: 'stale-while-revalidate',
      maxAge: 3600000, // 1 hour
      maxEntries: 20,
      enabled: true
    }
  ]
};

const defaultStats: ServiceWorkerStats = {
  isOnline: navigator.onLine,
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  offlineRequests: 0,
  syncTasks: 0,
  cacheSize: 0,
  lastUpdate: Date.now(),
  uptime: 0,
  errors: 0
};

const defaultMetrics: ServiceWorkerMetrics = {
  responseTime: [],
  cacheEfficiency: 0,
  offlineUsage: 0,
  syncSuccess: 0,
  errorRate: 0,
  bandwidth: 0,
  storage: 0
};

export const useServiceWorkerStore = create<ServiceWorkerStore>()(subscribeWithSelector((set, get) => ({
  // Initial State
  isRegistered: false,
  isOnline: navigator.onLine,
  config: defaultConfig,
  stats: defaultStats,
  metrics: defaultMetrics,
  cacheEntries: [],
  offlineQueue: [],
  syncTasks: [],
  events: [],
  debugLogs: [],
  isLoading: false,
  error: null,

  // Actions
  register: async () => {
    try {
      set({ isLoading: true, error: null });
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        get().addEvent({
          type: 'install',
          data: { scope: registration.scope },
          success: true
        });
        
        set({ isRegistered: true, isLoading: false });
        get().addDebugLog({ level: 'info', message: 'Service Worker registered successfully' });
      } else {
        throw new Error('Service Workers not supported');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      get().addDebugLog({ level: 'error', message: `Service Worker registration failed: ${errorMessage}` });
    }
  },

  unregister: async () => {
    try {
      set({ isLoading: true, error: null });
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        
        set({ isRegistered: false, isLoading: false });
        get().addDebugLog({ level: 'info', message: 'Service Worker unregistered successfully' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      get().addDebugLog({ level: 'error', message: `Service Worker unregistration failed: ${errorMessage}` });
    }
  },

  updateConfig: (newConfig) => {
    set(state => ({
      config: { ...state.config, ...newConfig }
    }));
    get().addDebugLog({ level: 'info', message: 'Configuration updated', data: newConfig });
  },

  addCacheStrategy: (strategy) => {
    set(state => ({
      config: {
        ...state.config,
        strategies: [...state.config.strategies, strategy]
      }
    }));
    get().addDebugLog({ level: 'info', message: `Cache strategy added: ${strategy.name}` });
  },

  removeCacheStrategy: (id) => {
    set(state => ({
      config: {
        ...state.config,
        strategies: state.config.strategies.filter(s => s.id !== id)
      }
    }));
    get().addDebugLog({ level: 'info', message: `Cache strategy removed: ${id}` });
  },

  clearCache: async (pattern) => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        if (pattern) {
          const regex = new RegExp(pattern);
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
              if (regex.test(request.url)) {
                await cache.delete(request);
              }
            }
          }
        } else {
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        get().addDebugLog({ level: 'info', message: `Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Cache clear failed: ${errorMessage}` });
    }
  },

  addToOfflineQueue: (request) => {
    const queueItem: OfflineQueue = {
      ...request,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };
    
    set(state => ({
      offlineQueue: [...state.offlineQueue, queueItem]
    }));
    
    get().addDebugLog({ level: 'info', message: `Added to offline queue: ${request.url}` });
  },

  processOfflineQueue: async () => {
    const { offlineQueue } = get();
    const pendingItems = offlineQueue.filter(item => item.status === 'pending');
    
    for (const item of pendingItems) {
      try {
        get().updateOfflineQueueItem(item.id, { status: 'processing' });
        
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined
        });
        
        if (response.ok) {
          get().updateOfflineQueueItem(item.id, { status: 'completed' });
          get().addDebugLog({ level: 'info', message: `Offline request completed: ${item.url}` });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newRetries = item.retries + 1;
        
        if (newRetries >= item.maxRetries) {
          get().updateOfflineQueueItem(item.id, { status: 'failed', retries: newRetries });
          get().addDebugLog({ level: 'error', message: `Offline request failed permanently: ${item.url}` });
        } else {
          get().updateOfflineQueueItem(item.id, { status: 'pending', retries: newRetries });
          get().addDebugLog({ level: 'warn', message: `Offline request retry ${newRetries}: ${item.url}` });
        }
      }
    }
  },

  addSyncTask: (task) => {
    const syncTask: SyncTask = {
      ...task,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      progress: 0,
      retries: 0
    };
    
    set(state => ({
      syncTasks: [...state.syncTasks, syncTask]
    }));
    
    get().addDebugLog({ level: 'info', message: `Sync task added: ${task.type}` });
  },

  processSyncTasks: async () => {
    const { syncTasks } = get();
    const pendingTasks = syncTasks.filter(task => task.status === 'pending');
    
    for (const task of pendingTasks) {
      try {
        get().updateSyncTask(task.id, { status: 'processing', progress: 0 });
        
        // Simulate sync processing
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          get().updateSyncTask(task.id, { progress: i });
        }
        
        get().updateSyncTask(task.id, { status: 'completed', progress: 100 });
        get().addDebugLog({ level: 'info', message: `Sync task completed: ${task.type}` });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newRetries = task.retries + 1;
        
        if (newRetries >= task.maxRetries) {
          get().updateSyncTask(task.id, { status: 'failed', error: errorMessage, retries: newRetries });
          get().addDebugLog({ level: 'error', message: `Sync task failed permanently: ${task.type}` });
        } else {
          get().updateSyncTask(task.id, { status: 'pending', retries: newRetries });
          get().addDebugLog({ level: 'warn', message: `Sync task retry ${newRetries}: ${task.type}` });
        }
      }
    }
  },

  getStats: () => {
    const state = get();
    const now = Date.now();
    
    return {
      ...state.stats,
      uptime: now - state.stats.lastUpdate,
      syncTasks: state.syncTasks.length,
      cacheSize: state.cacheEntries.reduce((total, entry) => total + entry.size, 0)
    };
  },

  getMetrics: () => {
    const state = get();
    const { stats } = state;
    
    return {
      ...state.metrics,
      cacheEfficiency: stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 0,
      errorRate: stats.totalRequests > 0 ? (stats.errors / stats.totalRequests) * 100 : 0
    };
  },

  addEvent: (event) => {
    const newEvent: ServiceWorkerEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({
      events: [newEvent, ...state.events].slice(0, 1000) // Keep last 1000 events
    }));
  },

  addDebugLog: (log) => {
    const newLog: ServiceWorkerDebugLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({
      debugLogs: [newLog, ...state.debugLogs].slice(0, 1000) // Keep last 1000 logs
    }));
  },

  clearEvents: () => set({ events: [] }),
  clearDebugLogs: () => set({ debugLogs: [] }),

  exportData: () => {
    const state = get();
    return {
      config: state.config,
      cacheEntries: state.cacheEntries,
      offlineQueue: state.offlineQueue,
      syncTasks: state.syncTasks,
      events: state.events,
      debugLogs: state.debugLogs
    };
  },

  importData: (data) => {
    set({
      config: data.config || defaultConfig,
      cacheEntries: data.cacheEntries || [],
      offlineQueue: data.offlineQueue || [],
      syncTasks: data.syncTasks || [],
      events: data.events || [],
      debugLogs: data.debugLogs || []
    });
    get().addDebugLog({ level: 'info', message: 'Data imported successfully' });
  },

  reset: () => {
    set({
      isRegistered: false,
      config: defaultConfig,
      stats: defaultStats,
      metrics: defaultMetrics,
      cacheEntries: [],
      offlineQueue: [],
      syncTasks: [],
      events: [],
      debugLogs: [],
      isLoading: false,
      error: null
    });
  },

  // Utilities
  getCacheEntry: (url) => {
    return get().cacheEntries.find(entry => entry.url === url) || null;
  },

  getOfflineQueueItem: (id) => {
    return get().offlineQueue.find(item => item.id === id) || null;
  },

  getSyncTask: (id) => {
    return get().syncTasks.find(task => task.id === id) || null;
  },

  updateCacheEntry: (id, updates) => {
    set(state => ({
      cacheEntries: state.cacheEntries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    }));
  },

  updateOfflineQueueItem: (id, updates) => {
    set(state => ({
      offlineQueue: state.offlineQueue.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  },

  updateSyncTask: (id, updates) => {
    set(state => ({
      syncTasks: state.syncTasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    }));
  },

  removeCacheEntry: (id) => {
    set(state => ({
      cacheEntries: state.cacheEntries.filter(entry => entry.id !== id)
    }));
  },

  removeOfflineQueueItem: (id) => {
    set(state => ({
      offlineQueue: state.offlineQueue.filter(item => item.id !== id)
    }));
  },

  removeSyncTask: (id) => {
    set(state => ({
      syncTasks: state.syncTasks.filter(task => task.id !== id)
    }));
  },

  // Quick Actions
  enableOfflineMode: () => {
    get().updateConfig({ offlineMode: true });
    get().addDebugLog({ level: 'info', message: 'Offline mode enabled' });
  },

  disableOfflineMode: () => {
    get().updateConfig({ offlineMode: false });
    get().addDebugLog({ level: 'info', message: 'Offline mode disabled' });
  },

  enableBackgroundSync: () => {
    get().updateConfig({ backgroundSync: true });
    get().addDebugLog({ level: 'info', message: 'Background sync enabled' });
  },

  disableBackgroundSync: () => {
    get().updateConfig({ backgroundSync: false });
    get().addDebugLog({ level: 'info', message: 'Background sync disabled' });
  },

  clearAllCaches: async () => {
    await get().clearCache();
    set({ cacheEntries: [] });
    get().addDebugLog({ level: 'info', message: 'All caches cleared' });
  },

  retryFailedTasks: async () => {
    const { offlineQueue, syncTasks } = get();
    
    // Retry failed offline queue items
    offlineQueue
      .filter(item => item.status === 'failed')
      .forEach(item => {
        get().updateOfflineQueueItem(item.id, { status: 'pending', retries: 0 });
      });
    
    // Retry failed sync tasks
    syncTasks
      .filter(task => task.status === 'failed')
      .forEach(task => {
        get().updateSyncTask(task.id, { status: 'pending', retries: 0, error: undefined });
      });
    
    get().addDebugLog({ level: 'info', message: 'Retrying failed tasks' });
  },

  // Advanced Features
  preloadResources: async (urls) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('preload-cache');
        await Promise.all(urls.map(url => cache.add(url)));
        get().addDebugLog({ level: 'info', message: `Preloaded ${urls.length} resources` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Preload failed: ${errorMessage}` });
    }
  },

  optimizeCache: async () => {
    try {
      const { config, cacheEntries } = get();
      const now = Date.now();
      
      // Remove expired entries
      const validEntries = cacheEntries.filter(entry => {
        const strategy = config.strategies.find(s => s.pattern.test(entry.url));
        return strategy && (now - entry.timestamp) < strategy.maxAge;
      });
      
      set({ cacheEntries: validEntries });
      get().addDebugLog({ level: 'info', message: `Cache optimized: removed ${cacheEntries.length - validEntries.length} expired entries` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Cache optimization failed: ${errorMessage}` });
    }
  },

  analyzePerformance: () => {
    const { stats, metrics, cacheEntries } = get();
    
    return {
      cacheHitRate: stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 0,
      averageResponseTime: metrics.responseTime.length > 0 ? 
        metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length : 0,
      cacheSize: cacheEntries.reduce((total, entry) => total + entry.size, 0),
      mostAccessedResources: cacheEntries
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10)
        .map(entry => ({ url: entry.url, hits: entry.hits })),
      errorRate: stats.totalRequests > 0 ? (stats.errors / stats.totalRequests) * 100 : 0
    };
  },

  generateReport: () => {
    const state = get();
    const performance = get().analyzePerformance();
    
    return {
      timestamp: Date.now(),
      config: state.config,
      stats: state.stats,
      metrics: state.metrics,
      performance,
      cacheStrategies: state.config.strategies.length,
      activeOfflineItems: state.offlineQueue.filter(item => item.status === 'pending').length,
      activeSyncTasks: state.syncTasks.filter(task => task.status === 'pending').length,
      recentEvents: state.events.slice(0, 10),
      recentErrors: state.debugLogs.filter(log => log.level === 'error').slice(0, 5)
    };
  },

  // System Operations
  checkForUpdates: async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return registration.waiting !== null;
        }
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Update check failed: ${errorMessage}` });
      return false;
    }
  },

  installUpdate: async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          get().addDebugLog({ level: 'info', message: 'Update installed' });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Update installation failed: ${errorMessage}` });
    }
  },

  skipWaiting: async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        get().addDebugLog({ level: 'info', message: 'Skip waiting triggered' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Skip waiting failed: ${errorMessage}` });
    }
  },

  claimClients: async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLAIM_CLIENTS' });
        get().addDebugLog({ level: 'info', message: 'Claim clients triggered' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog({ level: 'error', message: `Claim clients failed: ${errorMessage}` });
    }
  },

  // Debug
  enableDebug: () => {
    get().updateConfig({ debug: true });
    get().addDebugLog({ level: 'info', message: 'Debug mode enabled' });
  },

  disableDebug: () => {
    get().updateConfig({ debug: false });
    get().addDebugLog({ level: 'info', message: 'Debug mode disabled' });
  },

  getDebugInfo: () => {
    const state = get();
    return {
      isRegistered: state.isRegistered,
      isOnline: state.isOnline,
      config: state.config,
      stats: state.stats,
      cacheEntriesCount: state.cacheEntries.length,
      offlineQueueCount: state.offlineQueue.length,
      syncTasksCount: state.syncTasks.length,
      eventsCount: state.events.length,
      debugLogsCount: state.debugLogs.length,
      lastError: state.error
    };
  }
})));

// Service Worker Manager Class
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private store = useServiceWorkerStore;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async initialize() {
    await this.store.getState().register();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Online/Offline events
    window.addEventListener('online', () => {
      this.store.setState({ isOnline: true });
      this.store.getState().addDebugLog({ level: 'info', message: 'Connection restored' });
      this.store.getState().processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.store.setState({ isOnline: false });
      this.store.getState().addDebugLog({ level: 'warn', message: 'Connection lost' });
    });

    // Service Worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.store.getState().addEvent({
          type: 'message',
          data: event.data,
          success: true
        });
      });
    }
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

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'text-yellow-600';
    case 'processing': return 'text-blue-600';
    case 'completed': return 'text-green-600';
    case 'failed': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return 'text-gray-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getStrategyIcon = (strategy: string): string => {
  switch (strategy) {
    case 'cache-first': return '💾';
    case 'network-first': return '🌐';
    case 'stale-while-revalidate': return '🔄';
    case 'network-only': return '📡';
    case 'cache-only': return '📦';
    default: return '❓';
  }
};

export const getEventTypeIcon = (type: string): string => {
  switch (type) {
    case 'install': return '⚙️';
    case 'activate': return '✅';
    case 'fetch': return '📥';
    case 'sync': return '🔄';
    case 'push': return '📨';
    case 'message': return '💬';
    case 'error': return '❌';
    default: return '📋';
  }
};