export interface CacheConfig {
  name: string;
  version: string;
  strategies: CacheStrategy[];
  maxSize: number;
  maxAge: number;
  enableServiceWorker: boolean;
  enablePrefetch: boolean;
  enablePreload: boolean;
}

export interface CacheStrategy {
  name: string;
  pattern: RegExp | string;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxAge: number;
  maxEntries?: number;
  networkTimeoutSeconds?: number;
  cacheKeyWillBeUsed?: (request: Request) => string;
  cacheWillUpdate?: (response: Response) => boolean;
}

export interface CacheEntry {
  url: string;
  response: Response;
  timestamp: number;
  size: number;
  hits: number;
  strategy: string;
  expires: number;
}

export interface CacheStats {
  totalSize: number;
  totalEntries: number;
  hitRate: number;
  missRate: number;
  strategies: { [key: string]: StrategyStats };
  topResources: CacheEntry[];
  oldestEntries: CacheEntry[];
  largestEntries: CacheEntry[];
}

export interface StrategyStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  avgResponseTime: number;
}

export interface PrefetchConfig {
  enabled: boolean;
  maxConcurrent: number;
  idleTimeout: number;
  connectionTypes: string[];
  patterns: string[];
}

export interface PreloadConfig {
  enabled: boolean;
  critical: string[];
  defer: string[];
  async: string[];
}

class CacheManager {
  private config: CacheConfig;
  private cache: Cache | null = null;
  private stats: Map<string, StrategyStats> = new Map();
  private entries: Map<string, CacheEntry> = new Map();
  private prefetchQueue: Set<string> = new Set();
  private preloadQueue: Set<string> = new Set();
  private observers: ((stats: CacheStats) => void)[] = [];
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      name: 'app-cache-v1',
      version: '1.0.0',
      strategies: this.getDefaultStrategies(),
      maxSize: 50 * 1024 * 1024, // 50MB
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      enableServiceWorker: true,
      enablePrefetch: true,
      enablePreload: true,
      ...config
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Inicializar cache
      if ('caches' in window) {
        this.cache = await caches.open(this.config.name);
        await this.loadExistingEntries();
      }

      // Registrar Service Worker
      if (this.config.enableServiceWorker && 'serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }

      // Configurar prefetch e preload
      if (this.config.enablePrefetch) {
        this.setupPrefetch();
      }

      if (this.config.enablePreload) {
        this.setupPreload();
      }

      // Limpeza periódica
      this.scheduleCleanup();

    } catch (error) {
      console.error('Erro ao inicializar CacheManager:', error);
    }
  }

  private getDefaultStrategies(): CacheStrategy[] {
    return [
      {
        name: 'Static Assets',
        pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/,
        strategy: 'cache-first',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
        maxEntries: 100
      },
      {
        name: 'API Responses',
        pattern: /\/api\//,
        strategy: 'network-first',
        maxAge: 5 * 60 * 1000, // 5 minutos
        networkTimeoutSeconds: 3,
        maxEntries: 50
      },
      {
        name: 'HTML Pages',
        pattern: /\.html$/,
        strategy: 'stale-while-revalidate',
        maxAge: 24 * 60 * 60 * 1000, // 1 dia
        maxEntries: 20
      },
      {
        name: 'Images',
        pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/,
        strategy: 'cache-first',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
        maxEntries: 200
      },
      {
        name: 'Fonts',
        pattern: /\.(woff|woff2|ttf|eot)$/,
        strategy: 'cache-first',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
        maxEntries: 30
      }
    ];
  }

  async get(request: Request | string): Promise<Response | null> {
    if (!this.cache) return null;

    const url = typeof request === 'string' ? request : request.url;
    const strategy = this.getStrategyForUrl(url);
    
    if (!strategy) {
      return this.networkOnly(request);
    }

    switch (strategy.strategy) {
      case 'cache-first':
        return this.cacheFirst(request, strategy);
      case 'network-first':
        return this.networkFirst(request, strategy);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(request, strategy);
      case 'network-only':
        return this.networkOnly(request);
      case 'cache-only':
        return this.cacheOnly(request);
      default:
        return this.networkFirst(request, strategy);
    }
  }

  private async cacheFirst(request: Request | string, strategy: CacheStrategy): Promise<Response | null> {
    const cachedResponse = await this.getCachedResponse(request);
    
    if (cachedResponse && !this.isExpired(cachedResponse, strategy)) {
      this.updateStats(strategy.name, 'hit');
      this.updateEntryHits(typeof request === 'string' ? request : request.url);
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.putInCache(request, networkResponse.clone(), strategy);
        this.updateStats(strategy.name, 'miss');
        return networkResponse;
      }
    } catch (error) {
      console.warn('Network request failed, serving stale cache:', error);
    }

    return cachedResponse; // Retorna cache expirado se network falhar
  }

  private async networkFirst(request: Request | string, strategy: CacheStrategy): Promise<Response | null> {
    try {
      const networkResponse = await Promise.race([
        fetch(request),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 
          (strategy.networkTimeoutSeconds || 3) * 1000)
        )
      ]);

      if (networkResponse.ok) {
        await this.putInCache(request, networkResponse.clone(), strategy);
        this.updateStats(strategy.name, 'hit');
        return networkResponse;
      }
    } catch (error) {
      console.warn('Network request failed, trying cache:', error);
    }

    const cachedResponse = await this.getCachedResponse(request);
    if (cachedResponse) {
      this.updateStats(strategy.name, 'miss');
      return cachedResponse;
    }

    return null;
  }

  private async staleWhileRevalidate(request: Request | string, strategy: CacheStrategy): Promise<Response | null> {
    const cachedResponse = await this.getCachedResponse(request);
    
    // Revalidar em background
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await this.putInCache(request, networkResponse.clone(), strategy);
      }
      return networkResponse;
    }).catch(error => {
      console.warn('Background revalidation failed:', error);
      return null;
    });

    if (cachedResponse) {
      this.updateStats(strategy.name, 'hit');
      this.updateEntryHits(typeof request === 'string' ? request : request.url);
      
      // Não aguardar a revalidação
      networkPromise;
      
      return cachedResponse;
    }

    // Se não há cache, aguardar network
    try {
      const networkResponse = await networkPromise;
      this.updateStats(strategy.name, 'miss');
      return networkResponse;
    } catch (error) {
      return null;
    }
  }

  private async networkOnly(request: Request | string): Promise<Response | null> {
    try {
      return await fetch(request);
    } catch (error) {
      console.error('Network-only request failed:', error);
      return null;
    }
  }

  private async cacheOnly(request: Request | string): Promise<Response | null> {
    return await this.getCachedResponse(request);
  }

  private async getCachedResponse(request: Request | string): Promise<Response | null> {
    if (!this.cache) return null;
    
    try {
      return await this.cache.match(request);
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  private async putInCache(request: Request | string, response: Response, strategy: CacheStrategy): Promise<void> {
    if (!this.cache || !response.ok) return;

    try {
      // Verificar se deve cachear
      if (strategy.cacheWillUpdate && !strategy.cacheWillUpdate(response)) {
        return;
      }

      const url = typeof request === 'string' ? request : request.url;
      
      // Verificar limites da estratégia
      await this.enforceStrategyLimits(strategy);
      
      // Cachear resposta
      await this.cache.put(request, response);
      
      // Atualizar entrada
      const size = await this.getResponseSize(response);
      const entry: CacheEntry = {
        url,
        response: response.clone(),
        timestamp: Date.now(),
        size,
        hits: 0,
        strategy: strategy.name,
        expires: Date.now() + strategy.maxAge
      };
      
      this.entries.set(url, entry);
      
      // Verificar limite total de tamanho
      await this.enforceSizeLimit();
      
    } catch (error) {
      console.error('Error putting response in cache:', error);
    }
  }

  private getStrategyForUrl(url: string): CacheStrategy | null {
    for (const strategy of this.config.strategies) {
      if (typeof strategy.pattern === 'string') {
        if (url.includes(strategy.pattern)) {
          return strategy;
        }
      } else if (strategy.pattern.test(url)) {
        return strategy;
      }
    }
    return null;
  }

  private isExpired(response: Response, strategy: CacheStrategy): boolean {
    const url = response.url;
    const entry = this.entries.get(url);
    
    if (!entry) return true;
    
    return Date.now() > entry.expires;
  }

  private async enforceStrategyLimits(strategy: CacheStrategy): Promise<void> {
    if (!strategy.maxEntries) return;

    const strategyEntries = Array.from(this.entries.values())
      .filter(entry => entry.strategy === strategy.name)
      .sort((a, b) => a.timestamp - b.timestamp);

    while (strategyEntries.length >= strategy.maxEntries) {
      const oldestEntry = strategyEntries.shift();
      if (oldestEntry) {
        await this.deleteEntry(oldestEntry.url);
      }
    }
  }

  private async enforceSizeLimit(): Promise<void> {
    const totalSize = Array.from(this.entries.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize <= this.config.maxSize) return;

    // Remover entradas mais antigas até ficar abaixo do limite
    const sortedEntries = Array.from(this.entries.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    let currentSize = totalSize;
    for (const entry of sortedEntries) {
      if (currentSize <= this.config.maxSize) break;
      
      await this.deleteEntry(entry.url);
      currentSize -= entry.size;
    }
  }

  private async deleteEntry(url: string): Promise<void> {
    if (!this.cache) return;
    
    try {
      await this.cache.delete(url);
      this.entries.delete(url);
    } catch (error) {
      console.error('Error deleting cache entry:', error);
    }
  }

  private async getResponseSize(response: Response): Promise<number> {
    try {
      const blob = await response.clone().blob();
      return blob.size;
    } catch (error) {
      return 0;
    }
  }

  private updateStats(strategyName: string, type: 'hit' | 'miss'): void {
    const stats = this.stats.get(strategyName) || {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
      avgResponseTime: 0
    };

    if (type === 'hit') {
      stats.hits++;
    } else {
      stats.misses++;
    }

    this.stats.set(strategyName, stats);
  }

  private updateEntryHits(url: string): void {
    const entry = this.entries.get(url);
    if (entry) {
      entry.hits++;
      this.entries.set(url, entry);
    }
  }

  private async loadExistingEntries(): Promise<void> {
    if (!this.cache) return;

    try {
      const requests = await this.cache.keys();
      
      for (const request of requests) {
        const response = await this.cache.match(request);
        if (response) {
          const size = await this.getResponseSize(response);
          const strategy = this.getStrategyForUrl(request.url);
          
          const entry: CacheEntry = {
            url: request.url,
            response: response.clone(),
            timestamp: Date.now(), // Não temos timestamp real
            size,
            hits: 0,
            strategy: strategy?.name || 'unknown',
            expires: Date.now() + (strategy?.maxAge || this.config.maxAge)
          };
          
          this.entries.set(request.url, entry);
        }
      }
    } catch (error) {
      console.error('Error loading existing cache entries:', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  }

  private setupPrefetch(): void {
    // Implementar prefetch inteligente baseado em padrões de uso
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const links = entry.target.querySelectorAll('a[href]');
          links.forEach((link: any) => {
            this.prefetchQueue.add(link.href);
          });
        }
      });
    });

    // Observar elementos que podem conter links
    document.querySelectorAll('main, article, section').forEach(el => {
      observer.observe(el);
    });

    // Processar queue de prefetch
    this.processPrefetchQueue();
  }

  private setupPreload(): void {
    // Preload de recursos críticos
    const criticalResources = [
      '/static/css/main.css',
      '/static/js/main.js'
    ];

    criticalResources.forEach(url => {
      this.preloadQueue.add(url);
    });

    this.processPreloadQueue();
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetchQueue.size === 0) return;

    const urls = Array.from(this.prefetchQueue).slice(0, 5); // Limitar a 5 por vez
    this.prefetchQueue.clear();

    for (const url of urls) {
      try {
        await this.get(url);
      } catch (error) {
        console.warn('Prefetch failed for:', url, error);
      }
    }

    // Reagendar se ainda há itens
    if (this.prefetchQueue.size > 0) {
      setTimeout(() => this.processPrefetchQueue(), 1000);
    }
  }

  private async processPreloadQueue(): Promise<void> {
    const urls = Array.from(this.preloadQueue);
    this.preloadQueue.clear();

    await Promise.all(
      urls.map(url => this.get(url).catch(error => 
        console.warn('Preload failed for:', url, error)
      ))
    );
  }

  private scheduleCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // A cada hora
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredEntries = Array.from(this.entries.values())
      .filter(entry => now > entry.expires);

    for (const entry of expiredEntries) {
      await this.deleteEntry(entry.url);
    }

    // Notificar observadores
    this.notifyObservers();
  }

  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.entries.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = Array.from(this.stats.values()).reduce((sum, stat) => sum + stat.hits, 0);
    const totalMisses = Array.from(this.stats.values()).reduce((sum, stat) => sum + stat.misses, 0);
    const totalRequests = totalHits + totalMisses;

    return {
      totalSize,
      totalEntries: entries.length,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (totalMisses / totalRequests) * 100 : 0,
      strategies: Object.fromEntries(this.stats),
      topResources: entries
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10),
      oldestEntries: entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 10),
      largestEntries: entries
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
    };
  }

  async clear(): Promise<void> {
    if (!this.cache) return;
    
    try {
      const keys = await this.cache.keys();
      await Promise.all(keys.map(key => this.cache!.delete(key)));
      this.entries.clear();
      this.stats.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  subscribe(callback: (stats: CacheStats) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private async notifyObservers(): Promise<void> {
    const stats = await this.getStats();
    this.observers.forEach(callback => callback(stats));
  }

  // Métodos públicos para controle manual
  async prefetch(urls: string[]): Promise<void> {
    urls.forEach(url => this.prefetchQueue.add(url));
    await this.processPrefetchQueue();
  }

  async preload(urls: string[]): Promise<void> {
    urls.forEach(url => this.preloadQueue.add(url));
    await this.processPreloadQueue();
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }
}

export const cacheManager = new CacheManager();
export default cacheManager;