import { useState, useEffect, useRef, useCallback } from 'react';

// Types
export interface ServiceWorkerConfig {
  enabled: boolean;
  scope: string;
  updateViaCache: 'imports' | 'all' | 'none';
  skipWaiting: boolean;
  clientsClaim: boolean;
  cacheStrategies: CacheStrategy[];
  offlinePages: string[];
  backgroundSync: boolean;
  pushNotifications: boolean;
  periodicSync: boolean;
  maxCacheSize: number;
  maxCacheAge: number;
  networkTimeout: number;
  fallbackPage: string;
  precacheAssets: string[];
  runtimeCaching: RuntimeCacheRule[];
}

export interface CacheStrategy {
  id: string;
  name: string;
  pattern: string | RegExp;
  strategy: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
  cacheName: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
  networkTimeoutSeconds?: number;
  cacheKeyWillBeUsed?: boolean;
  cacheWillUpdate?: boolean;
  enabled: boolean;
}

export interface RuntimeCacheRule {
  urlPattern: string | RegExp;
  handler: string;
  options?: {
    cacheName?: string;
    expiration?: {
      maxEntries?: number;
      maxAgeSeconds?: number;
    };
    cacheKeyWillBeUsed?: boolean;
    networkTimeoutSeconds?: number;
  };
}

export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  isControlling: boolean;
  hasUpdate: boolean;
  isOffline: boolean;
  lastUpdate: Date | null;
  version: string;
  scope: string;
}

export interface CacheInfo {
  name: string;
  size: number;
  entries: number;
  lastModified: Date;
  strategy: string;
  hits: number;
  misses: number;
}

export interface ServiceWorkerMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  offlineRequests: number;
  backgroundSyncs: number;
  pushNotifications: number;
  periodicSyncs: number;
  cacheSize: number;
  cacheEntries: number;
  averageResponseTime: number;
  errorRate: number;
  offlineTime: number;
  lastSync: Date | null;
}

export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
  timestamp: Date;
  id: string;
}

export interface BackgroundSyncTask {
  id: string;
  tag: string;
  data: any;
  created: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastAttempt?: Date;
  error?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created: Date;
  active: boolean;
}

export interface ServiceWorkerLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  source: 'main' | 'worker';
}

// Default configuration
const defaultConfig: ServiceWorkerConfig = {
  enabled: true,
  scope: '/',
  updateViaCache: 'imports',
  skipWaiting: true,
  clientsClaim: true,
  cacheStrategies: [
    {
      id: 'images',
      name: 'Images Cache',
      pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/i,
      strategy: 'CacheFirst',
      cacheName: 'images-cache',
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      enabled: true
    },
    {
      id: 'static',
      name: 'Static Assets',
      pattern: /\.(css|js|woff|woff2|ttf|eot)$/i,
      strategy: 'StaleWhileRevalidate',
      cacheName: 'static-cache',
      maxEntries: 50,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      enabled: true
    },
    {
      id: 'api',
      name: 'API Responses',
      pattern: /\/api\//,
      strategy: 'NetworkFirst',
      cacheName: 'api-cache',
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minutes
      networkTimeoutSeconds: 3,
      enabled: true
    },
    {
      id: 'pages',
      name: 'HTML Pages',
      pattern: /\.html$/i,
      strategy: 'NetworkFirst',
      cacheName: 'pages-cache',
      maxEntries: 20,
      maxAgeSeconds: 24 * 60 * 60, // 1 day
      networkTimeoutSeconds: 3,
      enabled: true
    }
  ],
  offlinePages: ['/offline.html'],
  backgroundSync: true,
  pushNotifications: false,
  periodicSync: false,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxCacheAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  networkTimeout: 5000,
  fallbackPage: '/offline.html',
  precacheAssets: [],
  runtimeCaching: []
};

// Service Worker Engine
class ServiceWorkerEngine {
  private config: ServiceWorkerConfig;
  private state: ServiceWorkerState;
  private metrics: ServiceWorkerMetrics;
  private caches: Map<string, CacheInfo>;
  private backgroundTasks: Map<string, BackgroundSyncTask>;
  private pushSubscription: PushSubscription | null;
  private logs: ServiceWorkerLog[];
  private messageHandlers: Map<string, Function>;
  private eventListeners: Map<string, Function[]>;
  private updateCheckInterval: NodeJS.Timeout | null;
  private metricsInterval: NodeJS.Timeout | null;
  private isDestroyed: boolean;

  constructor(config: ServiceWorkerConfig) {
    this.config = { ...defaultConfig, ...config };
    this.state = {
      registration: null,
      isSupported: 'serviceWorker' in navigator,
      isRegistered: false,
      isInstalling: false,
      isWaiting: false,
      isActive: false,
      isControlling: false,
      hasUpdate: false,
      isOffline: !navigator.onLine,
      lastUpdate: null,
      version: '1.0.0',
      scope: this.config.scope
    };
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      offlineRequests: 0,
      backgroundSyncs: 0,
      pushNotifications: 0,
      periodicSyncs: 0,
      cacheSize: 0,
      cacheEntries: 0,
      averageResponseTime: 0,
      errorRate: 0,
      offlineTime: 0,
      lastSync: null
    };
    this.caches = new Map();
    this.backgroundTasks = new Map();
    this.pushSubscription = null;
    this.logs = [];
    this.messageHandlers = new Map();
    this.eventListeners = new Map();
    this.updateCheckInterval = null;
    this.metricsInterval = null;
    this.isDestroyed = false;

    this.initialize();
  }

  private async initialize() {
    if (!this.state.isSupported || !this.config.enabled) {
      this.log('warn', 'Service Worker not supported or disabled');
      return;
    }

    try {
      // Register service worker
      await this.register();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup message handlers
      this.setupMessageHandlers();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      // Load cached data
      await this.loadCacheInfo();
      
      this.log('info', 'Service Worker engine initialized');
    } catch (error) {
      this.log('error', 'Failed to initialize Service Worker', error);
    }
  }

  private async register(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: this.config.scope,
        updateViaCache: this.config.updateViaCache
      });

      this.state.registration = registration;
      this.state.isRegistered = true;
      this.state.scope = registration.scope;
      
      // Check states
      this.updateStates();
      
      // Setup registration event listeners
      registration.addEventListener('updatefound', () => {
        this.state.isInstalling = true;
        this.state.hasUpdate = true;
        this.emit('updatefound', registration.installing);
        
        if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            this.updateStates();
          });
        }
      });
      
      this.log('info', 'Service Worker registered', { scope: registration.scope });
    } catch (error) {
      this.log('error', 'Service Worker registration failed', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => {
      this.state.isOffline = false;
      this.emit('online');
      this.log('info', 'Back online');
    });

    window.addEventListener('offline', () => {
      this.state.isOffline = true;
      this.emit('offline');
      this.log('warn', 'Gone offline');
    });

    // Service worker events
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.updateStates();
      this.emit('controllerchange');
      this.log('info', 'Controller changed');
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });
  }

  private setupMessageHandlers(): void {
    this.messageHandlers.set('CACHE_UPDATED', (data) => {
      this.loadCacheInfo();
      this.emit('cacheUpdated', data);
    });

    this.messageHandlers.set('BACKGROUND_SYNC', (data) => {
      this.metrics.backgroundSyncs++;
      this.updateBackgroundTask(data.taskId, { status: 'completed' });
      this.emit('backgroundSync', data);
    });

    this.messageHandlers.set('PUSH_RECEIVED', (data) => {
      this.metrics.pushNotifications++;
      this.emit('pushReceived', data);
    });

    this.messageHandlers.set('METRICS_UPDATE', (data) => {
      Object.assign(this.metrics, data);
      this.emit('metricsUpdated', this.metrics);
    });
  }

  private startPeriodicTasks(): void {
    // Check for updates every 30 minutes
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);

    // Update metrics every 10 seconds
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 10000);
  }

  private updateStates(): void {
    if (!this.state.registration) return;

    const { installing, waiting, active } = this.state.registration;
    
    this.state.isInstalling = !!installing;
    this.state.isWaiting = !!waiting;
    this.state.isActive = !!active;
    this.state.isControlling = !!navigator.serviceWorker.controller;
    this.state.hasUpdate = !!waiting;
  }

  private async loadCacheInfo(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      this.caches.clear();
      
      let totalSize = 0;
      let totalEntries = 0;
      
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        
        const cacheInfo: CacheInfo = {
          name,
          size: 0,
          entries: keys.length,
          lastModified: new Date(),
          strategy: this.getCacheStrategy(name),
          hits: 0,
          misses: 0
        };
        
        // Estimate cache size
        for (const request of keys.slice(0, 10)) { // Sample first 10 entries
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              cacheInfo.size += blob.size;
            }
          } catch (error) {
            // Ignore errors
          }
        }
        
        // Extrapolate size for all entries
        if (keys.length > 10) {
          cacheInfo.size = (cacheInfo.size / 10) * keys.length;
        }
        
        totalSize += cacheInfo.size;
        totalEntries += cacheInfo.entries;
        
        this.caches.set(name, cacheInfo);
      }
      
      this.metrics.cacheSize = totalSize;
      this.metrics.cacheEntries = totalEntries;
    } catch (error) {
      this.log('error', 'Failed to load cache info', error);
    }
  }

  private getCacheStrategy(cacheName: string): string {
    const strategy = this.config.cacheStrategies.find(s => s.cacheName === cacheName);
    return strategy ? strategy.strategy : 'Unknown';
  }

  private handleMessage(message: ServiceWorkerMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload);
    }
    
    this.log('debug', 'Message received', message);
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Send message to service worker to get updated metrics
      if (this.state.registration?.active) {
        this.postMessage({
          type: 'GET_METRICS',
          payload: {},
          timestamp: new Date(),
          id: `metrics-${Date.now()}`
        });
      }
    } catch (error) {
      this.log('error', 'Failed to update metrics', error);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        this.log('error', `Error in event listener for ${event}`, error);
      }
    });
  }

  private log(level: ServiceWorkerLog['level'], message: string, data?: any): void {
    const log: ServiceWorkerLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      data,
      source: 'main'
    };
    
    this.logs.push(log);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Console output
    console[level](`[ServiceWorker] ${message}`, data || '');
  }

  // Public methods
  async checkForUpdates(): Promise<void> {
    if (!this.state.registration) return;
    
    try {
      await this.state.registration.update();
      this.state.lastUpdate = new Date();
      this.log('info', 'Checked for updates');
    } catch (error) {
      this.log('error', 'Failed to check for updates', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.state.registration?.waiting) return;
    
    try {
      this.postMessage({
        type: 'SKIP_WAITING',
        payload: {},
        timestamp: new Date(),
        id: `skip-waiting-${Date.now()}`
      });
      
      this.log('info', 'Skip waiting requested');
    } catch (error) {
      this.log('error', 'Failed to skip waiting', error);
    }
  }

  async unregister(): Promise<void> {
    if (!this.state.registration) return;
    
    try {
      await this.state.registration.unregister();
      this.state.isRegistered = false;
      this.state.registration = null;
      this.log('info', 'Service Worker unregistered');
    } catch (error) {
      this.log('error', 'Failed to unregister Service Worker', error);
    }
  }

  async clearCache(cacheName?: string): Promise<void> {
    try {
      if (cacheName) {
        await caches.delete(cacheName);
        this.caches.delete(cacheName);
        this.log('info', `Cache cleared: ${cacheName}`);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        this.caches.clear();
        this.log('info', 'All caches cleared');
      }
      
      await this.loadCacheInfo();
    } catch (error) {
      this.log('error', 'Failed to clear cache', error);
    }
  }

  async addToCache(url: string, cacheName: string = 'runtime-cache'): Promise<void> {
    try {
      const cache = await caches.open(cacheName);
      await cache.add(url);
      await this.loadCacheInfo();
      this.log('info', `Added to cache: ${url}`);
    } catch (error) {
      this.log('error', `Failed to add to cache: ${url}`, error);
    }
  }

  async removeFromCache(url: string, cacheName?: string): Promise<void> {
    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        await cache.delete(url);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(async name => {
          const cache = await caches.open(name);
          await cache.delete(url);
        }));
      }
      
      await this.loadCacheInfo();
      this.log('info', `Removed from cache: ${url}`);
    } catch (error) {
      this.log('error', `Failed to remove from cache: ${url}`, error);
    }
  }

  async scheduleBackgroundSync(tag: string, data: any): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: BackgroundSyncTask = {
      id: taskId,
      tag,
      data,
      created: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending'
    };
    
    this.backgroundTasks.set(taskId, task);
    
    try {
      this.postMessage({
        type: 'SCHEDULE_BACKGROUND_SYNC',
        payload: { taskId, tag, data },
        timestamp: new Date(),
        id: `bg-sync-${Date.now()}`
      });
      
      this.log('info', `Background sync scheduled: ${tag}`);
    } catch (error) {
      this.log('error', `Failed to schedule background sync: ${tag}`, error);
    }
    
    return taskId;
  }

  async subscribeToPush(vapidKey: string): Promise<PushSubscription | null> {
    if (!this.state.registration) return null;
    
    try {
      const subscription = await this.state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });
      
      const pushSub: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        },
        created: new Date(),
        active: true
      };
      
      this.pushSubscription = pushSub;
      this.log('info', 'Subscribed to push notifications');
      
      return pushSub;
    } catch (error) {
      this.log('error', 'Failed to subscribe to push notifications', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    if (!this.state.registration) return;
    
    try {
      const subscription = await this.state.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        this.pushSubscription = null;
        this.log('info', 'Unsubscribed from push notifications');
      }
    } catch (error) {
      this.log('error', 'Failed to unsubscribe from push notifications', error);
    }
  }

  updateConfig(newConfig: Partial<ServiceWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Send updated config to service worker
    this.postMessage({
      type: 'UPDATE_CONFIG',
      payload: this.config,
      timestamp: new Date(),
      id: `config-${Date.now()}`
    });
    
    this.log('info', 'Configuration updated');
  }

  updateBackgroundTask(taskId: string, updates: Partial<BackgroundSyncTask>): void {
    const task = this.backgroundTasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.backgroundTasks.set(taskId, task);
    }
  }

  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  postMessage(message: ServiceWorkerMessage): void {
    if (this.state.registration?.active) {
      this.state.registration.active.postMessage(message);
    }
  }

  exportData(): string {
    return JSON.stringify({
      config: this.config,
      metrics: this.metrics,
      caches: Array.from(this.caches.entries()),
      backgroundTasks: Array.from(this.backgroundTasks.entries()),
      pushSubscription: this.pushSubscription,
      logs: this.logs.slice(-100) // Last 100 logs
    }, null, 2);
  }

  importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.config) {
        this.updateConfig(parsed.config);
      }
      
      if (parsed.metrics) {
        Object.assign(this.metrics, parsed.metrics);
      }
      
      if (parsed.caches) {
        this.caches = new Map(parsed.caches);
      }
      
      if (parsed.backgroundTasks) {
        this.backgroundTasks = new Map(parsed.backgroundTasks);
      }
      
      if (parsed.pushSubscription) {
        this.pushSubscription = parsed.pushSubscription;
      }
      
      if (parsed.logs) {
        this.logs = parsed.logs;
      }
      
      this.log('info', 'Data imported successfully');
    } catch (error) {
      this.log('error', 'Failed to import data', error);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.eventListeners.clear();
    this.messageHandlers.clear();
    
    this.log('info', 'Service Worker engine destroyed');
  }

  // Getters
  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  getMetrics(): ServiceWorkerMetrics {
    return { ...this.metrics };
  }

  getConfig(): ServiceWorkerConfig {
    return { ...this.config };
  }

  getCaches(): CacheInfo[] {
    return Array.from(this.caches.values());
  }

  getBackgroundTasks(): BackgroundSyncTask[] {
    return Array.from(this.backgroundTasks.values());
  }

  getPushSubscription(): PushSubscription | null {
    return this.pushSubscription;
  }

  getLogs(): ServiceWorkerLog[] {
    return [...this.logs];
  }
}

// Hook
const useServiceWorker = (initialConfig?: Partial<ServiceWorkerConfig>) => {
  const [state, setState] = useState<ServiceWorkerState>({
    registration: null,
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    isControlling: false,
    hasUpdate: false,
    isOffline: !navigator.onLine,
    lastUpdate: null,
    version: '1.0.0',
    scope: '/'
  });
  const [metrics, setMetrics] = useState<ServiceWorkerMetrics>({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    offlineRequests: 0,
    backgroundSyncs: 0,
    pushNotifications: 0,
    periodicSyncs: 0,
    cacheSize: 0,
    cacheEntries: 0,
    averageResponseTime: 0,
    errorRate: 0,
    offlineTime: 0,
    lastSync: null
  });
  const [config, setConfig] = useState<ServiceWorkerConfig>({ ...defaultConfig, ...initialConfig });
  const [caches, setCaches] = useState<CacheInfo[]>([]);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundSyncTask[]>([]);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [logs, setLogs] = useState<ServiceWorkerLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const engineRef = useRef<ServiceWorkerEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    const engine = new ServiceWorkerEngine(config);
    engineRef.current = engine;

    // Setup event listeners
    const updateState = () => {
      setState(engine.getState());
      setMetrics(engine.getMetrics());
      setCaches(engine.getCaches());
      setBackgroundTasks(engine.getBackgroundTasks());
      setPushSubscription(engine.getPushSubscription());
      setLogs(engine.getLogs());
    };

    engine.addEventListener('stateChanged', updateState);
    engine.addEventListener('metricsUpdated', updateState);
    engine.addEventListener('cacheUpdated', updateState);
    engine.addEventListener('error', (error: any) => {
      setError(error.message || 'Unknown error');
    });

    // Initial state update
    updateState();

    return () => {
      engine.destroy();
    };
  }, []);

  // Actions
  const actions = {
    checkForUpdates: useCallback(async () => {
      if (!engineRef.current) return;
      setIsLoading(true);
      try {
        await engineRef.current.checkForUpdates();
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, []),

    skipWaiting: useCallback(async () => {
      if (!engineRef.current) return;
      try {
        await engineRef.current.skipWaiting();
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }, []),

    unregister: useCallback(async () => {
      if (!engineRef.current) return;
      setIsLoading(true);
      try {
        await engineRef.current.unregister();
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, []),

    clearCache: useCallback(async (cacheName?: string) => {
      if (!engineRef.current) return;
      setIsLoading(true);
      try {
        await engineRef.current.clearCache(cacheName);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, []),

    addToCache: useCallback(async (url: string, cacheName?: string) => {
      if (!engineRef.current) return;
      try {
        await engineRef.current.addToCache(url, cacheName);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }, []),

    removeFromCache: useCallback(async (url: string, cacheName?: string) => {
      if (!engineRef.current) return;
      try {
        await engineRef.current.removeFromCache(url, cacheName);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }, []),

    scheduleBackgroundSync: useCallback(async (tag: string, data: any) => {
      if (!engineRef.current) return '';
      try {
        const taskId = await engineRef.current.scheduleBackgroundSync(tag, data);
        setError(null);
        return taskId;
      } catch (err: any) {
        setError(err.message);
        return '';
      }
    }, []),

    subscribeToPush: useCallback(async (vapidKey: string) => {
      if (!engineRef.current) return null;
      try {
        const subscription = await engineRef.current.subscribeToPush(vapidKey);
        setError(null);
        return subscription;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    }, []),

    unsubscribeFromPush: useCallback(async () => {
      if (!engineRef.current) return;
      try {
        await engineRef.current.unsubscribeFromPush();
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }, []),

    updateConfig: useCallback((newConfig: Partial<ServiceWorkerConfig>) => {
      if (!engineRef.current) return;
      engineRef.current.updateConfig(newConfig);
      setConfig(engineRef.current.getConfig());
    }, []),

    exportData: useCallback(() => {
      if (!engineRef.current) return '';
      return engineRef.current.exportData();
    }, []),

    importData: useCallback((data: string) => {
      if (!engineRef.current) return;
      try {
        engineRef.current.importData(data);
        setConfig(engineRef.current.getConfig());
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }, []),

    clearLogs: useCallback(() => {
      setLogs([]);
    }, []),

    clearError: useCallback(() => {
      setError(null);
    }, [])
  };

  return {
    state,
    metrics,
    config,
    caches,
    backgroundTasks,
    pushSubscription,
    logs,
    isLoading,
    error,
    actions
  };
};

export default useServiceWorker;