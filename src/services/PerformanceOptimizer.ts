/**
 * Sistema de otimização de performance para o pipeline de renderização
 * Implementa cache inteligente, pooling de recursos e otimizações de renderização
 */

export interface PerformanceMetrics {
  frameTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  activeNodes: number;
}

export interface OptimizationConfig {
  enableCache: boolean;
  cacheSize: number;
  enableResourcePooling: boolean;
  maxPoolSize: number;
  enableLOD: boolean; // Level of Detail
  targetFPS: number;
  adaptiveQuality: boolean;
}

export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private cache: Map<string, CacheEntry>;
  private resourcePool: ResourcePool;
  private frameTimeHistory: number[];
  private lastFrameTime: number;
  
  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableCache: true,
      cacheSize: 100,
      enableResourcePooling: true,
      maxPoolSize: 50,
      enableLOD: true,
      targetFPS: 60,
      adaptiveQuality: true,
      ...config
    };
    
    this.cache = new Map();
    this.resourcePool = new ResourcePool(this.config.maxPoolSize);
    this.frameTimeHistory = [];
    this.lastFrameTime = performance.now();
    
    this.metrics = {
      frameTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      activeNodes: 0
    };
  }
  
  /**
   * Otimiza o processamento de um nó
   */
  async optimizeNodeProcessing(
    nodeId: string,
    processor: () => Promise<any>,
    inputs: Record<string, any>,
    properties: Record<string, any>
  ): Promise<any> {
    const startTime = performance.now();
    
    // Verificar cache primeiro
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(nodeId, inputs, properties);
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        this.updateMetrics('cache_hit');
        return cached.data;
      }
    }
    
    // Aplicar otimizações baseadas na performance atual
    const optimizedProperties = this.applyAdaptiveOptimizations(properties);
    
    // Processar com otimizações
    const result = await processor();
    
    // Armazenar no cache se habilitado
    if (this.config.enableCache && result) {
      const cacheKey = this.generateCacheKey(nodeId, inputs, optimizedProperties);
      this.addToCache(cacheKey, result, performance.now() - startTime);
    }
    
    this.updateMetrics('processing', performance.now() - startTime);
    return result;
  }
  
  /**
   * Aplica otimizações adaptativas baseadas na performance
   */
  private applyAdaptiveOptimizations(properties: Record<string, any>): Record<string, any> {
    if (!this.config.adaptiveQuality) {
      return properties;
    }
    
    const avgFrameTime = this.getAverageFrameTime();
    const targetFrameTime = 1000 / this.config.targetFPS;
    
    if (avgFrameTime > targetFrameTime * 1.2) {
      // Performance ruim - reduzir qualidade
      return this.reduceQuality(properties);
    } else if (avgFrameTime < targetFrameTime * 0.8) {
      // Performance boa - aumentar qualidade se possível
      return this.increaseQuality(properties);
    }
    
    return properties;
  }
  
  /**
   * Reduz a qualidade para melhorar performance
   */
  private reduceQuality(properties: Record<string, any>): Record<string, any> {
    const optimized = { ...properties };
    
    // Reduzir resolução se aplicável
    if (optimized.resolution) {
      optimized.resolution = Math.max(0.5, optimized.resolution * 0.8);
    }
    
    // Reduzir qualidade de filtros
    if (optimized.quality) {
      optimized.quality = Math.max(0.3, optimized.quality * 0.8);
    }
    
    // Simplificar efeitos complexos
    if (optimized.complexity) {
      optimized.complexity = Math.max(1, optimized.complexity - 1);
    }
    
    return optimized;
  }
  
  /**
   * Aumenta a qualidade quando performance permite
   */
  private increaseQuality(properties: Record<string, any>): Record<string, any> {
    const optimized = { ...properties };
    
    // Aumentar resolução gradualmente
    if (optimized.resolution && optimized.resolution < 1.0) {
      optimized.resolution = Math.min(1.0, optimized.resolution * 1.1);
    }
    
    // Aumentar qualidade de filtros
    if (optimized.quality && optimized.quality < 1.0) {
      optimized.quality = Math.min(1.0, optimized.quality * 1.1);
    }
    
    return optimized;
  }
  
  /**
   * Gera chave de cache baseada nos inputs
   */
  private generateCacheKey(
    nodeId: string,
    inputs: Record<string, any>,
    properties: Record<string, any>
  ): string {
    const inputHash = this.hashObject(inputs);
    const propHash = this.hashObject(properties);
    return `${nodeId}_${inputHash}_${propHash}`;
  }
  
  /**
   * Hash simples para objetos
   */
  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj)).slice(0, 16);
  }
  
  /**
   * Recupera item do cache
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verificar se ainda é válido
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Atualizar último acesso
    entry.lastAccess = Date.now();
    return entry;
  }
  
  /**
   * Adiciona item ao cache
   */
  private addToCache(key: string, data: any, processingTime: number): void {
    // Limpar cache se necessário
    if (this.cache.size >= this.config.cacheSize) {
      this.evictLRU();
    }
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      processingTime,
      ttl: this.calculateTTL(processingTime)
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * Remove item menos recentemente usado
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Calcula TTL baseado no tempo de processamento
   */
  private calculateTTL(processingTime: number): number {
    // Itens que demoram mais para processar ficam mais tempo no cache
    return Math.min(60000, Math.max(5000, processingTime * 10));
  }
  
  /**
   * Obtém recurso do pool ou cria novo
   */
  getPooledResource<T>(type: string, factory: () => T): T {
    if (this.config.enableResourcePooling) {
      return this.resourcePool.get(type, factory);
    }
    return factory();
  }
  
  /**
   * Retorna recurso para o pool
   */
  returnToPool<T>(type: string, resource: T): void {
    if (this.config.enableResourcePooling) {
      this.resourcePool.return(type, resource);
    }
  }
  
  /**
   * Atualiza métricas de performance
   */
  private updateMetrics(type: string, value?: number): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
    
    this.metrics.frameTime = frameTime;
    this.lastFrameTime = now;
    
    if (type === 'processing' && value) {
      this.metrics.renderTime = value;
    }
    
    // Calcular taxa de acerto do cache
    const totalRequests = this.cache.size;
    const hits = Array.from(this.cache.values()).filter(e => e.lastAccess > e.timestamp).length;
    this.metrics.cacheHitRate = totalRequests > 0 ? hits / totalRequests : 0;
  }
  
  /**
   * Obtém tempo médio de frame
   */
  private getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 16.67; // 60 FPS padrão
    
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }
  
  /**
   * Obtém métricas atuais
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Limpa cache e recursos
   */
  cleanup(): void {
    this.cache.clear();
    this.resourcePool.cleanup();
    this.frameTimeHistory = [];
  }
  
  /**
   * Configura otimizações
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Entrada do cache
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  lastAccess: number;
  processingTime: number;
  ttl: number;
}

/**
 * Pool de recursos reutilizáveis
 */
class ResourcePool {
  private pools: Map<string, any[]>;
  private maxSize: number;
  
  constructor(maxSize: number) {
    this.pools = new Map();
    this.maxSize = maxSize;
  }
  
  get<T>(type: string, factory: () => T): T {
    let pool = this.pools.get(type);
    
    if (!pool) {
      pool = [];
      this.pools.set(type, pool);
    }
    
    if (pool.length > 0) {
      return pool.pop() as T;
    }
    
    return factory();
  }
  
  return<T>(type: string, resource: T): void {
    let pool = this.pools.get(type);
    
    if (!pool) {
      pool = [];
      this.pools.set(type, pool);
    }
    
    if (pool.length < this.maxSize) {
      pool.push(resource);
    }
  }
  
  cleanup(): void {
    this.pools.clear();
  }
}

/**
 * Monitor de performance em tempo real
 */
export class PerformanceMonitor {
  private optimizer: PerformanceOptimizer;
  private monitoring: boolean = false;
  private intervalId?: number;
  
  constructor(optimizer: PerformanceOptimizer) {
    this.optimizer = optimizer;
  }
  
  startMonitoring(callback: (metrics: PerformanceMetrics) => void, interval: number = 1000): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.intervalId = window.setInterval(() => {
      const metrics = this.optimizer.getMetrics();
      callback(metrics);
    }, interval);
  }
  
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.monitoring = false;
  }
  
  isMonitoring(): boolean {
    return this.monitoring;
  }
}