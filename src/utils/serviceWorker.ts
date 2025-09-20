import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
export interface CacheStrategy {
  id: string;
  name: string;
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxAge?: number;
  maxEntries?: number;
  networkTimeoutSeconds?: number;
  cacheName: string;
  enabled: boolean;
  priority: number;
  tags: string[];
}

export interface CacheEntry {
  id: string;
  url: string;
  cacheName: string;
  size: number;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  headers: Record<string, string>;
  strategy: string;
  tags: string[];
  isStale: boolean;
  expiresAt?: number;
}

export interface SyncTask {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  nextRetry: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  createdAt: number;
  lastAttempt?: number;
  error?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  timestamp: number;
  isRead: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
}

export interface ServiceWorkerConfig {
  enableCaching: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  enablePeriodicSync: boolean;
  cacheStrategies: CacheStrategy[];
  syncRetryDelay: number;
  maxSyncRetries: number;
  notificationDefaults: {
    icon: string;
    badge: string;
    requireInteraction: boolean;
    silent: boolean;
  };
  periodicSyncInterval: number;
  cleanupInterval: number;
  maxCacheSize: number;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
}

export interface ServiceWorkerStats {
  totalCacheEntries: number;
  totalCacheSize: number;
  cacheHitRate: number;
  networkRequests: number;
  cachedRequests: number;
  failedRequests: number;
  syncTasksCompleted: number;
  syncTasksFailed: number;
  notificationsSent: number;
  notificationsClicked: number;
  avgResponseTime: number;
  uptime: number;
  lastCleanup: number;
  performanceScore: number;
}

export interface ServiceWorkerMetrics {
  timestamp: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  responseTime: number;
  cacheSize: number;
  syncTasks: number;
  notifications: number;
  errors: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ServiceWorkerEvent {
  id: string;
  type: 'cache' | 'sync' | 'notification' | 'error' | 'performance';
  message: string;
  data?: any;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'success';
  source: string;
  tags: string[];
}

export interface ServiceWorkerDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'cache' | 'sync' | 'notification' | 'performance' | 'general';
  message: string;
  data?: any;
  timestamp: number;
  source: string;
  stackTrace?: string;
}

// Store
interface ServiceWorkerStore {
  // State
  isRegistered: boolean;
  isActive: boolean;
  registration: ServiceWorkerRegistration | null;
  cacheStrategies: CacheStrategy[];
  cacheEntries: CacheEntry[];
  syncTasks: SyncTask[];
  notifications: PushNotification[];
  config: ServiceWorkerConfig;
  stats: ServiceWorkerStats;
  metrics: ServiceWorkerMetrics[];
  events: ServiceWorkerEvent[];
  debugLogs: ServiceWorkerDebugLog[];
  lastUpdate: number;
  lastError: string | null;
  
  // Computed values
  computed: {
    activeCacheStrategies: CacheStrategy[];
    pendingSyncTasks: SyncTask[];
    failedSyncTasks: SyncTask[];
    unreadNotifications: PushNotification[];
    cacheHealth: number;
    syncHealth: number;
    overallHealth: number;
    recentMetrics: ServiceWorkerMetrics[];
    errorRate: number;
    performanceScore: number;
  };
  
  // Actions
  register: (scriptUrl?: string) => Promise<boolean>;
  unregister: () => Promise<boolean>;
  update: () => Promise<boolean>;
  
  // Cache management
  addCacheStrategy: (strategy: Omit<CacheStrategy, 'id'>) => Promise<string>;
  updateCacheStrategy: (id: string, updates: Partial<CacheStrategy>) => Promise<boolean>;
  deleteCacheStrategy: (id: string) => Promise<boolean>;
  getCacheEntry: (url: string) => CacheEntry | null;
  deleteCacheEntry: (id: string) => Promise<boolean>;
  clearCache: (cacheName?: string) => Promise<boolean>;
  preloadUrls: (urls: string[], strategy?: string) => Promise<boolean>;
  
  // Background sync
  addSyncTask: (task: Omit<SyncTask, 'id' | 'createdAt' | 'status' | 'retryCount' | 'nextRetry'>) => Promise<string>;
  retrySyncTask: (id: string) => Promise<boolean>;
  cancelSyncTask: (id: string) => Promise<boolean>;
  processSyncQueue: () => Promise<void>;
  
  // Push notifications
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (notification: Omit<PushNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<string>;
  markNotificationRead: (id: string) => Promise<boolean>;
  clearNotifications: () => Promise<boolean>;
  
  // Quick actions
  quickActions: {
    enableCaching: () => Promise<boolean>;
    disableCaching: () => Promise<boolean>;
    enableSync: () => Promise<boolean>;
    disableSync: () => Promise<boolean>;
    enableNotifications: () => Promise<boolean>;
    disableNotifications: () => Promise<boolean>;
    clearAllCaches: () => Promise<boolean>;
    retryAllFailedSync: () => Promise<boolean>;
    exportData: () => string;
    importData: (data: string) => Promise<boolean>;
    resetSystem: () => Promise<boolean>;
    optimizePerformance: () => Promise<boolean>;
  };
  
  // Advanced features
  advanced: {
    predictivePreloading: (urls: string[]) => Promise<boolean>;
    intelligentCaching: () => Promise<boolean>;
    adaptiveSync: () => Promise<boolean>;
    smartNotifications: () => Promise<boolean>;
    performanceOptimization: () => Promise<boolean>;
    resourcePrioritization: () => Promise<boolean>;
  };
  
  // System operations
  system: {
    initialize: () => Promise<boolean>;
    shutdown: () => Promise<boolean>;
    backup: () => Promise<string>;
    restore: (backup: string) => Promise<boolean>;
    cleanup: () => Promise<boolean>;
    healthCheck: () => Promise<boolean>;
  };
  
  // Utilities
  utils: {
    formatCacheSize: (bytes: number) => string;
    calculateCacheHitRate: () => number;
    estimateNetworkSavings: () => number;
    validateCacheStrategy: (strategy: Partial<CacheStrategy>) => boolean;
    generateCacheKey: (url: string, options?: any) => string;
    compressData: (data: any) => Promise<string>;
    decompressData: (data: string) => Promise<any>;
  };
  
  // Configuration
  config: {
    updateConfig: (updates: Partial<ServiceWorkerConfig>) => Promise<boolean>;
    resetConfig: () => Promise<boolean>;
    exportConfig: () => string;
    importConfig: (config: string) => Promise<boolean>;
  };
  
  // Analytics
  analytics: {
    getUsageStats: () => Promise<Record<string, number>>;
    getPerformanceMetrics: () => Promise<Record<string, number>>;
    getCacheAnalysis: () => Promise<Record<string, any>>;
    getSyncAnalysis: () => Promise<Record<string, any>>;
  };
  
  // Debug
  debug: {
    log: (level: ServiceWorkerDebugLog['level'], category: ServiceWorkerDebugLog['category'], message: string, data?: any) => void;
    getLogs: (category?: ServiceWorkerDebugLog['category']) => ServiceWorkerDebugLog[];
    clearLogs: () => void;
    exportLogs: () => string;
    enableDebugMode: () => void;
    disableDebugMode: () => void;
  };
}

// Default configuration
const defaultConfig: ServiceWorkerConfig = {
  enableCaching: true,
  enableBackgroundSync: true,
  enablePushNotifications: false,
  enablePeriodicSync: true,
  cacheStrategies: [
    {
      id: 'static-assets',
      name: 'Static Assets',
      pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
      strategy: 'cache-first',
      maxAge: 86400000, // 24 hours
      maxEntries: 100,
      cacheName: 'static-assets-v1',
      enabled: true,
      priority: 1,
      tags: ['static', 'assets']
    },
    {
      id: 'api-calls',
      name: 'API Calls',
      pattern: /\/api\//,
      strategy: 'network-first',
      maxAge: 300000, // 5 minutes
      maxEntries: 50,
      networkTimeoutSeconds: 5,
      cacheName: 'api-cache-v1',
      enabled: true,
      priority: 2,
      tags: ['api', 'dynamic']
    },
    {
      id: 'pages',
      name: 'Pages',
      pattern: /\/((?!api).)*$/,
      strategy: 'stale-while-revalidate',
      maxAge: 3600000, // 1 hour
      maxEntries: 30,
      cacheName: 'pages-cache-v1',
      enabled: true,
      priority: 3,
      tags: ['pages', 'navigation']
    }
  ],
  syncRetryDelay: 30000, // 30 seconds
  maxSyncRetries: 3,
  notificationDefaults: {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    requireInteraction: false,
    silent: false
  },
  periodicSyncInterval: 3600000, // 1 hour
  cleanupInterval: 86400000, // 24 hours
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  enableAnalytics: true,
  enableDebugMode: false
};

// Create store
export const useServiceWorkerStore = create<ServiceWorkerStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  isRegistered: false,
  isActive: false,
  registration: null,
  cacheStrategies: defaultConfig.cacheStrategies,
  cacheEntries: [],
  syncTasks: [],
  notifications: [],
  config: defaultConfig,
  stats: {
    totalCacheEntries: 0,
    totalCacheSize: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    cachedRequests: 0,
    failedRequests: 0,
    syncTasksCompleted: 0,
    syncTasksFailed: 0,
    notificationsSent: 0,
    notificationsClicked: 0,
    avgResponseTime: 0,
    uptime: 0,
    lastCleanup: 0,
    performanceScore: 0
  },
  metrics: [],
  events: [],
  debugLogs: [],
  lastUpdate: Date.now(),
  lastError: null,
  
  // Computed values
  computed: {
    get activeCacheStrategies() {
      return get().cacheStrategies.filter(strategy => strategy.enabled);
    },
    get pendingSyncTasks() {
      return get().syncTasks.filter(task => task.status === 'pending');
    },
    get failedSyncTasks() {
      return get().syncTasks.filter(task => task.status === 'failed');
    },
    get unreadNotifications() {
      return get().notifications.filter(notification => !notification.isRead);
    },
    get cacheHealth() {
      const stats = get().stats;
      const hitRate = stats.cacheHitRate;
      const errorRate = stats.failedRequests / Math.max(stats.networkRequests, 1);
      return Math.max(0, Math.min(100, hitRate * 100 - errorRate * 50));
    },
    get syncHealth() {
      const stats = get().stats;
      const successRate = stats.syncTasksCompleted / Math.max(stats.syncTasksCompleted + stats.syncTasksFailed, 1);
      return Math.max(0, Math.min(100, successRate * 100));
    },
    get overallHealth() {
      const computed = get().computed;
      return (computed.cacheHealth + computed.syncHealth) / 2;
    },
    get recentMetrics() {
      const cutoff = Date.now() - 3600000; // Last hour
      return get().metrics.filter(metric => metric.timestamp >= cutoff);
    },
    get errorRate() {
      const stats = get().stats;
      return stats.failedRequests / Math.max(stats.networkRequests, 1);
    },
    get performanceScore() {
      const stats = get().stats;
      const hitRate = stats.cacheHitRate;
      const responseTime = Math.min(stats.avgResponseTime / 1000, 5); // Cap at 5 seconds
      const errorRate = get().computed.errorRate;
      
      return Math.max(0, Math.min(100, 
        hitRate * 40 + // 40% weight for cache hit rate
        (1 - responseTime / 5) * 30 + // 30% weight for response time
        (1 - errorRate) * 30 // 30% weight for error rate
      ));
    }
  },
  
  // Actions
  register: async (scriptUrl = '/sw.js') => {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }
      
      const registration = await navigator.serviceWorker.register(scriptUrl);
      
      set({
        isRegistered: true,
        registration,
        lastUpdate: Date.now()
      });
      
      get().debug.log('info', 'general', 'Service Worker registered successfully', { scriptUrl });
      
      // Set up event listeners
      registration.addEventListener('updatefound', () => {
        get().debug.log('info', 'general', 'Service Worker update found');
      });
      
      if (registration.active) {
        set({ isActive: true });
      }
      
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ lastError: errorMessage });
      get().debug.log('error', 'general', 'Failed to register Service Worker', error);
      return false;
    }
  },
  
  unregister: async () => {
    try {
      const { registration } = get();
      if (registration) {
        await registration.unregister();
        set({
          isRegistered: false,
          isActive: false,
          registration: null,
          lastUpdate: Date.now()
        });
        get().debug.log('info', 'general', 'Service Worker unregistered successfully');
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ lastError: errorMessage });
      get().debug.log('error', 'general', 'Failed to unregister Service Worker', error);
      return false;
    }
  },
  
  update: async () => {
    try {
      const { registration } = get();
      if (registration) {
        await registration.update();
        get().debug.log('info', 'general', 'Service Worker updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ lastError: errorMessage });
      get().debug.log('error', 'general', 'Failed to update Service Worker', error);
      return false;
    }
  },
  
  // Cache management
  addCacheStrategy: async (strategy) => {
    const id = generateId();
    const newStrategy: CacheStrategy = {
      ...strategy,
      id
    };
    
    set(state => ({
      cacheStrategies: [...state.cacheStrategies, newStrategy],
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'cache', 'Cache strategy added', newStrategy);
    return id;
  },
  
  updateCacheStrategy: async (id, updates) => {
    set(state => ({
      cacheStrategies: state.cacheStrategies.map(strategy =>
        strategy.id === id ? { ...strategy, ...updates } : strategy
      ),
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'cache', 'Cache strategy updated', { id, updates });
    return true;
  },
  
  deleteCacheStrategy: async (id) => {
    set(state => ({
      cacheStrategies: state.cacheStrategies.filter(strategy => strategy.id !== id),
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'cache', 'Cache strategy deleted', { id });
    return true;
  },
  
  getCacheEntry: (url) => {
    return get().cacheEntries.find(entry => entry.url === url) || null;
  },
  
  deleteCacheEntry: async (id) => {
    try {
      const entry = get().cacheEntries.find(e => e.id === id);
      if (entry) {
        const cache = await caches.open(entry.cacheName);
        await cache.delete(entry.url);
        
        set(state => ({
          cacheEntries: state.cacheEntries.filter(e => e.id !== id),
          lastUpdate: Date.now()
        }));
        
        get().debug.log('info', 'cache', 'Cache entry deleted', { id, url: entry.url });
        return true;
      }
      return false;
    } catch (error) {
      get().debug.log('error', 'cache', 'Failed to delete cache entry', error);
      return false;
    }
  },
  
  clearCache: async (cacheName) => {
    try {
      if (cacheName) {
        await caches.delete(cacheName);
        set(state => ({
          cacheEntries: state.cacheEntries.filter(entry => entry.cacheName !== cacheName),
          lastUpdate: Date.now()
        }));
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        set({
          cacheEntries: [],
          lastUpdate: Date.now()
        });
      }
      
      get().debug.log('info', 'cache', 'Cache cleared', { cacheName });
      return true;
    } catch (error) {
      get().debug.log('error', 'cache', 'Failed to clear cache', error);
      return false;
    }
  },
  
  preloadUrls: async (urls, strategy = 'cache-first') => {
    try {
      const cacheStrategy = get().cacheStrategies.find(s => s.name === strategy) || get().cacheStrategies[0];
      const cache = await caches.open(cacheStrategy.cacheName);
      
      await Promise.all(urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            get().debug.log('info', 'cache', 'URL preloaded', { url });
          }
        } catch (error) {
          get().debug.log('error', 'cache', 'Failed to preload URL', { url, error });
        }
      }));
      
      return true;
    } catch (error) {
      get().debug.log('error', 'cache', 'Failed to preload URLs', error);
      return false;
    }
  },
  
  // Background sync
  addSyncTask: async (task) => {
    const id = generateId();
    const newTask: SyncTask = {
      ...task,
      id,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      nextRetry: Date.now()
    };
    
    set(state => ({
      syncTasks: [...state.syncTasks, newTask],
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'sync', 'Sync task added', newTask);
    return id;
  },
  
  retrySyncTask: async (id) => {
    const task = get().syncTasks.find(t => t.id === id);
    if (!task) return false;
    
    set(state => ({
      syncTasks: state.syncTasks.map(t =>
        t.id === id
          ? {
              ...t,
              status: 'pending' as const,
              nextRetry: Date.now(),
              error: undefined
            }
          : t
      ),
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'sync', 'Sync task retry scheduled', { id });
    return true;
  },
  
  cancelSyncTask: async (id) => {
    set(state => ({
      syncTasks: state.syncTasks.filter(task => task.id !== id),
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'sync', 'Sync task cancelled', { id });
    return true;
  },
  
  processSyncQueue: async () => {
    const pendingTasks = get().computed.pendingSyncTasks;
    const config = get().config;
    
    for (const task of pendingTasks) {
      if (task.nextRetry > Date.now()) continue;
      
      try {
        set(state => ({
          syncTasks: state.syncTasks.map(t =>
            t.id === task.id
              ? { ...t, status: 'syncing' as const, lastAttempt: Date.now() }
              : t
          )
        }));
        
        const response = await fetch(task.url, {
          method: task.method,
          headers: task.headers,
          body: task.data ? JSON.stringify(task.data) : undefined
        });
        
        if (response.ok) {
          set(state => ({
            syncTasks: state.syncTasks.map(t =>
              t.id === task.id
                ? { ...t, status: 'completed' as const }
                : t
            ),
            stats: {
              ...state.stats,
              syncTasksCompleted: state.stats.syncTasksCompleted + 1
            }
          }));
          
          get().debug.log('info', 'sync', 'Sync task completed', { id: task.id });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        const retryCount = task.retryCount + 1;
        const shouldRetry = retryCount < config.maxSyncRetries;
        
        set(state => ({
          syncTasks: state.syncTasks.map(t =>
            t.id === task.id
              ? {
                  ...t,
                  status: shouldRetry ? 'pending' as const : 'failed' as const,
                  retryCount,
                  nextRetry: shouldRetry ? Date.now() + config.syncRetryDelay : 0,
                  error: (error as Error).message
                }
              : t
          ),
          stats: shouldRetry ? state.stats : {
            ...state.stats,
            syncTasksFailed: state.stats.syncTasksFailed + 1
          }
        }));
        
        get().debug.log('error', 'sync', 'Sync task failed', { id: task.id, error, retryCount });
      }
    }
  },
  
  // Push notifications
  requestNotificationPermission: async () => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }
      
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      get().debug.log('info', 'notification', 'Notification permission requested', { permission });
      return granted;
    } catch (error) {
      get().debug.log('error', 'notification', 'Failed to request notification permission', error);
      return false;
    }
  },
  
  sendNotification: async (notification) => {
    try {
      const id = generateId();
      const newNotification: PushNotification = {
        ...notification,
        id,
        timestamp: Date.now(),
        isRead: false
      };
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const config = get().config;
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || config.notificationDefaults.icon,
          badge: notification.badge || config.notificationDefaults.badge,
          image: notification.image,
          data: notification.data,
          actions: notification.actions,
          requireInteraction: config.notificationDefaults.requireInteraction,
          silent: config.notificationDefaults.silent
        });
      }
      
      set(state => ({
        notifications: [...state.notifications, newNotification],
        stats: {
          ...state.stats,
          notificationsSent: state.stats.notificationsSent + 1
        },
        lastUpdate: Date.now()
      }));
      
      get().debug.log('info', 'notification', 'Notification sent', newNotification);
      return id;
    } catch (error) {
      get().debug.log('error', 'notification', 'Failed to send notification', error);
      return '';
    }
  },
  
  markNotificationRead: async (id) => {
    set(state => ({
      notifications: state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      ),
      lastUpdate: Date.now()
    }));
    
    get().debug.log('info', 'notification', 'Notification marked as read', { id });
    return true;
  },
  
  clearNotifications: async () => {
    set({
      notifications: [],
      lastUpdate: Date.now()
    });
    
    get().debug.log('info', 'notification', 'All notifications cleared');
    return true;
  },
  
  // Quick actions
  quickActions: {
    enableCaching: async () => {
      set(state => ({
        config: { ...state.config, enableCaching: true },
        lastUpdate: Date.now()
      }));
      return true;
    },
    
    disableCaching: async () => {
      set(state => ({
        config: { ...state.config, enableCaching: false },
        lastUpdate: Date.now()
      }));
      return true;
    },
    
    enableSync: async () => {
      set(state => ({
        config: { ...state.config, enableBackgroundSync: true },
        lastUpdate: Date.now()
      }));
      return true;
    },
    
    disableSync: async () => {
      set(state => ({
        config: { ...state.config, enableBackgroundSync: false },
        lastUpdate: Date.now()
      }));
      return true;
    },
    
    enableNotifications: async () => {
      const granted = await get().requestNotificationPermission();
      if (granted) {
        set(state => ({
          config: { ...state.config, enablePushNotifications: true },
          lastUpdate: Date.now()
        }));
      }
      return granted;
    },
    
    disableNotifications: async () => {
      set(state => ({
        config: { ...state.config, enablePushNotifications: false },
        lastUpdate: Date.now()
      }));
      return true;
    },
    
    clearAllCaches: async () => {
      return await get().clearCache();
    },
    
    retryAllFailedSync: async () => {
      const failedTasks = get().computed.failedSyncTasks;
      const results = await Promise.all(
        failedTasks.map(task => get().retrySyncTask(task.id))
      );
      return results.every(Boolean);
    },
    
    exportData: () => {
      const state = get();
      return JSON.stringify({
        cacheStrategies: state.cacheStrategies,
        syncTasks: state.syncTasks,
        notifications: state.notifications,
        config: state.config,
        stats: state.stats,
        exportedAt: Date.now()
      });
    },
    
    importData: async (data) => {
      try {
        const parsed = JSON.parse(data);
        set({
          cacheStrategies: parsed.cacheStrategies || [],
          syncTasks: parsed.syncTasks || [],
          notifications: parsed.notifications || [],
          config: { ...defaultConfig, ...parsed.config },
          stats: { ...get().stats, ...parsed.stats },
          lastUpdate: Date.now()
        });
        return true;
      } catch (error) {
        get().debug.log('error', 'general', 'Failed to import data', error);
        return false;
      }
    },
    
    resetSystem: async () => {
      await get().clearCache();
      set({
        cacheStrategies: defaultConfig.cacheStrategies,
        cacheEntries: [],
        syncTasks: [],
        notifications: [],
        config: defaultConfig,
        stats: {
          totalCacheEntries: 0,
          totalCacheSize: 0,
          cacheHitRate: 0,
          networkRequests: 0,
          cachedRequests: 0,
          failedRequests: 0,
          syncTasksCompleted: 0,
          syncTasksFailed: 0,
          notificationsSent: 0,
          notificationsClicked: 0,
          avgResponseTime: 0,
          uptime: 0,
          lastCleanup: 0,
          performanceScore: 0
        },
        metrics: [],
        events: [],
        debugLogs: [],
        lastUpdate: Date.now(),
        lastError: null
      });
      return true;
    },
    
    optimizePerformance: async () => {
      // Implement performance optimization logic
      await get().system.cleanup();
      return true;
    }
  },
  
  // Advanced features
  advanced: {
    predictivePreloading: async (urls) => {
      // Implement predictive preloading logic
      return await get().preloadUrls(urls);
    },
    
    intelligentCaching: async () => {
      // Implement intelligent caching logic
      return true;
    },
    
    adaptiveSync: async () => {
      // Implement adaptive sync logic
      return true;
    },
    
    smartNotifications: async () => {
      // Implement smart notifications logic
      return true;
    },
    
    performanceOptimization: async () => {
      // Implement performance optimization logic
      return true;
    },
    
    resourcePrioritization: async () => {
      // Implement resource prioritization logic
      return true;
    }
  },
  
  // System operations
  system: {
    initialize: async () => {
      try {
        await get().register();
        get().debug.log('info', 'general', 'Service Worker system initialized');
        return true;
      } catch (error) {
        get().debug.log('error', 'general', 'Failed to initialize Service Worker system', error);
        return false;
      }
    },
    
    shutdown: async () => {
      try {
        await get().unregister();
        get().debug.log('info', 'general', 'Service Worker system shutdown');
        return true;
      } catch (error) {
        get().debug.log('error', 'general', 'Failed to shutdown Service Worker system', error);
        return false;
      }
    },
    
    backup: async () => {
      return get().quickActions.exportData();
    },
    
    restore: async (backup) => {
      return await get().quickActions.importData(backup);
    },
    
    cleanup: async () => {
      try {
        const now = Date.now();
        const config = get().config;
        
        // Clean up expired cache entries
        const expiredEntries = get().cacheEntries.filter(entry => 
          entry.expiresAt && entry.expiresAt < now
        );
        
        for (const entry of expiredEntries) {
          await get().deleteCacheEntry(entry.id);
        }
        
        // Clean up old completed sync tasks
        const oldTasks = get().syncTasks.filter(task => 
          task.status === 'completed' && 
          task.createdAt < now - 86400000 // 24 hours
        );
        
        set(state => ({
          syncTasks: state.syncTasks.filter(task => !oldTasks.includes(task)),
          stats: {
            ...state.stats,
            lastCleanup: now
          },
          lastUpdate: now
        }));
        
        get().debug.log('info', 'general', 'System cleanup completed', {
          expiredEntries: expiredEntries.length,
          oldTasks: oldTasks.length
        });
        
        return true;
      } catch (error) {
        get().debug.log('error', 'general', 'Failed to cleanup system', error);
        return false;
      }
    },
    
    healthCheck: async () => {
      try {
        const health = get().computed.overallHealth;
        const isHealthy = health > 70;
        
        get().debug.log('info', 'general', 'Health check completed', {
          health,
          isHealthy
        });
        
        return isHealthy;
      } catch (error) {
        get().debug.log('error', 'general', 'Health check failed', error);
        return false;
      }
    }
  },
  
  // Utilities
  utils: {
    formatCacheSize: (bytes) => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(1)} ${units[unitIndex]}`;
    },
    
    calculateCacheHitRate: () => {
      const stats = get().stats;
      const total = stats.networkRequests + stats.cachedRequests;
      return total > 0 ? stats.cachedRequests / total : 0;
    },
    
    estimateNetworkSavings: () => {
      const stats = get().stats;
      const avgRequestSize = 50 * 1024; // Estimate 50KB per request
      return stats.cachedRequests * avgRequestSize;
    },
    
    validateCacheStrategy: (strategy) => {
      return !!(strategy.name && strategy.pattern && strategy.strategy && strategy.cacheName);
    },
    
    generateCacheKey: (url, options = {}) => {
      const key = `${url}${JSON.stringify(options)}`;
      return btoa(key).replace(/[+/=]/g, '');
    },
    
    compressData: async (data) => {
      // Simple compression using JSON stringify
      return JSON.stringify(data);
    },
    
    decompressData: async (data) => {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  },
  
  // Configuration
  config: {
    updateConfig: async (updates) => {
      set(state => ({
        config: { ...state.config, ...updates },
        lastUpdate: Date.now()
      }));
      return true;
    },
    
    resetConfig: async () => {
      set({
        config: defaultConfig,
        lastUpdate: Date.now()
      });
      return true;
    },
    
    exportConfig: () => {
      return JSON.stringify(get().config);
    },
    
    importConfig: async (config) => {
      try {
        const parsed = JSON.parse(config);
        set({
          config: { ...defaultConfig, ...parsed },
          lastUpdate: Date.now()
        });
        return true;
      } catch {
        return false;
      }
    }
  },
  
  // Analytics
  analytics: {
    getUsageStats: async () => {
      const state = get();
      return {
        totalRequests: state.stats.networkRequests + state.stats.cachedRequests,
        cacheHitRate: state.utils.calculateCacheHitRate(),
        networkSavings: state.utils.estimateNetworkSavings(),
        syncTasksTotal: state.syncTasks.length,
        notificationsTotal: state.notifications.length
      };
    },
    
    getPerformanceMetrics: async () => {
      const state = get();
      return {
        avgResponseTime: state.stats.avgResponseTime,
        performanceScore: state.computed.performanceScore,
        cacheHealth: state.computed.cacheHealth,
        syncHealth: state.computed.syncHealth,
        overallHealth: state.computed.overallHealth
      };
    },
    
    getCacheAnalysis: async () => {
      const state = get();
      return {
        totalEntries: state.cacheEntries.length,
        totalSize: state.stats.totalCacheSize,
        hitRate: state.stats.cacheHitRate,
        strategiesActive: state.computed.activeCacheStrategies.length
      };
    },
    
    getSyncAnalysis: async () => {
      const state = get();
      return {
        totalTasks: state.syncTasks.length,
        pendingTasks: state.computed.pendingSyncTasks.length,
        failedTasks: state.computed.failedSyncTasks.length,
        completedTasks: state.stats.syncTasksCompleted
      };
    }
  },
  
  // Debug
  debug: {
    log: (level, category, message, data) => {
      const log: ServiceWorkerDebugLog = {
        id: generateId(),
        level,
        category,
        message,
        data,
        timestamp: Date.now(),
        source: 'service-worker-manager'
      };
      
      set(state => ({
        debugLogs: [...state.debugLogs.slice(-999), log], // Keep last 1000 logs
        lastUpdate: Date.now()
      }));
      
      if (get().config.enableDebugMode) {
        console[level](`[SW ${category.toUpperCase()}]`, message, data);
      }
    },
    
    getLogs: (category) => {
      const logs = get().debugLogs;
      return category ? logs.filter(log => log.category === category) : logs;
    },
    
    clearLogs: () => {
      set({
        debugLogs: [],
        lastUpdate: Date.now()
      });
    },
    
    exportLogs: () => {
      return JSON.stringify(get().debugLogs);
    },
    
    enableDebugMode: () => {
      set(state => ({
        config: { ...state.config, enableDebugMode: true },
        lastUpdate: Date.now()
      }));
    },
    
    disableDebugMode: () => {
      set(state => ({
        config: { ...state.config, enableDebugMode: false },
        lastUpdate: Date.now()
      }));
    }
  }
})));

// Service Worker Manager class
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  
  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }
  
  async start(): Promise<boolean> {
    return await useServiceWorkerStore.getState().system.initialize();
  }
  
  async stop(): Promise<boolean> {
    return await useServiceWorkerStore.getState().system.shutdown();
  }
  
  getStore() {
    return useServiceWorkerStore.getState();
  }
}

// Global instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

export function getCacheStrategyColor(strategy: CacheStrategy['strategy']): string {
  switch (strategy) {
    case 'cache-first': return 'text-blue-600';
    case 'network-first': return 'text-green-600';
    case 'stale-while-revalidate': return 'text-yellow-600';
    case 'network-only': return 'text-red-600';
    case 'cache-only': return 'text-purple-600';
    default: return 'text-gray-600';
  }
}

export function getSyncStatusColor(status: SyncTask['status']): string {
  switch (status) {
    case 'pending': return 'text-yellow-600';
    case 'syncing': return 'text-blue-600';
    case 'completed': return 'text-green-600';
    case 'failed': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getNotificationPriorityColor(priority: PushNotification['priority']): string {
  switch (priority) {
    case 'low': return 'text-gray-600';
    case 'medium': return 'text-blue-600';
    case 'high': return 'text-yellow-600';
    case 'urgent': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getHealthColor(health: number): string {
  if (health >= 80) return 'text-green-600';
  if (health >= 60) return 'text-yellow-600';
  if (health >= 40) return 'text-orange-600';
  return 'text-red-600';
}