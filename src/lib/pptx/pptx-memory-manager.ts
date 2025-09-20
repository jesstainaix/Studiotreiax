/**
 * PPTX Memory Management System
 * Sistema avançado de gestão de memória com cleanup automático e stream processing
 */

export interface MemoryConfig {
  maxHeapSize: number; // bytes
  cleanupInterval: number; // ms
  gcThreshold: number; // percentage (0-1)
  enableMonitoring: boolean;
  streamProcessing: {
    enabled: boolean;
    chunkSize: number; // bytes
    maxConcurrentChunks: number;
  };
  objectPool: {
    enabled: boolean;
    maxPoolSize: number;
    cleanupFrequency: number; // ms
  };
  weakReferences: {
    enabled: boolean;
    cleanupThreshold: number;
  };
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  external: number;
  activeObjects: number;
  pooledObjects: number;
  weakReferences: number;
  streamingChunks: number;
  gcCollections: number;
  lastCleanup: number;
}

export interface ObjectPoolStats {
  totalCreated: number;
  totalReused: number;
  currentPoolSize: number;
  reuseRate: number;
}

/**
 * Pool de objetos reutilizáveis
 */
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private stats: ObjectPoolStats;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10
  ) {
    this.factory = factory;
    this.reset = reset;
    this.stats = {
      totalCreated: 0,
      totalReused: 0,
      currentPoolSize: 0,
      reuseRate: 0
    };

    // Pré-popular o pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
      this.stats.totalCreated++;
    }
    this.stats.currentPoolSize = this.pool.length;
  }

  acquire(): T {
    let obj = this.pool.pop();
    
    if (obj) {
      this.stats.totalReused++;
      this.stats.currentPoolSize = this.pool.length;
      this.updateReuseRate();
      return obj;
    } else {
      obj = this.factory();
      this.stats.totalCreated++;
      return obj;
    }
  }

  release(obj: T): void {
    try {
      this.reset(obj);
      this.pool.push(obj);
      this.stats.currentPoolSize = this.pool.length;
    } catch (error) {
      console.warn('Erro ao resetar objeto para pool:', error);
      // Objeto não adicionado ao pool se reset falhar
    }
  }

  clear(): void {
    this.pool = [];
    this.stats.currentPoolSize = 0;
  }

  getStats(): ObjectPoolStats {
    return { ...this.stats };
  }

  private updateReuseRate(): void {
    const total = this.stats.totalCreated + this.stats.totalReused;
    this.stats.reuseRate = total > 0 ? this.stats.totalReused / total : 0;
  }
}

/**
 * Stream Processor para arquivos grandes
 */
class StreamProcessor {
  private activeChunks = new Set<ArrayBuffer>();
  private maxConcurrentChunks: number;
  private chunkSize: number;

  constructor(chunkSize: number = 1024 * 1024, maxConcurrentChunks: number = 4) {
    this.chunkSize = chunkSize;
    this.maxConcurrentChunks = maxConcurrentChunks;
  }

  async processStream<T>(
    data: ArrayBuffer,
    processor: (chunk: ArrayBuffer, index: number) => Promise<T>
  ): Promise<T[]> {
    const chunks = this.createChunks(data);
    const results: T[] = [];
    
    // Processar chunks em lotes para controlar uso de memória
    for (let i = 0; i < chunks.length; i += this.maxConcurrentChunks) {
      const batch = chunks.slice(i, i + this.maxConcurrentChunks);
      
      // Registrar chunks ativos
      batch.forEach(chunk => this.activeChunks.add(chunk));
      
      try {
        const batchResults = await Promise.all(
          batch.map((chunk, index) => processor(chunk, i + index))
        );
        results.push(...batchResults);
      } finally {
        // Limpar chunks ativos
        batch.forEach(chunk => this.activeChunks.delete(chunk));
        
        // Forçar limpeza de memória se necessário
        if (this.activeChunks.size === 0) {
          this.forceGarbageCollection();
        }
      }
    }

    return results;
  }

  private createChunks(data: ArrayBuffer): ArrayBuffer[] {
    const chunks: ArrayBuffer[] = [];
    const totalSize = data.byteLength;
    
    for (let offset = 0; offset < totalSize; offset += this.chunkSize) {
      const chunkSize = Math.min(this.chunkSize, totalSize - offset);
      const chunk = data.slice(offset, offset + chunkSize);
      chunks.push(chunk);
    }
    
    return chunks;
  }

  private forceGarbageCollection(): void {
    // Sugestão de garbage collection
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }

  getActiveChunks(): number {
    return this.activeChunks.size;
  }
}

/**
 * Gerenciador de Referências Fracas
 */
class WeakReferenceManager {
  private references = new Map<string, WeakRef<any>>();
  private finalizers = new Map<string, FinalizationRegistry<string>>();
  private cleanupCallbacks = new Map<string, () => void>();

  register<T extends object>(
    key: string,
    object: T,
    cleanupCallback?: () => void
  ): WeakRef<T> {
    // Criar referência fraca
    const weakRef = new WeakRef(object);
    this.references.set(key, weakRef);

    // Registrar callback de limpeza se fornecido
    if (cleanupCallback) {
      this.cleanupCallbacks.set(key, cleanupCallback);
    }

    // Configurar finalizador
    const finalizer = new FinalizationRegistry<string>((heldValue: string) => {
      this.cleanup(heldValue);
    });
    
    finalizer.register(object, key);
    this.finalizers.set(key, finalizer);

    return weakRef;
  }

  get<T>(key: string): T | undefined {
    const weakRef = this.references.get(key);
    return weakRef?.deref() as T | undefined;
  }

  has(key: string): boolean {
    const weakRef = this.references.get(key);
    return weakRef?.deref() !== undefined;
  }

  delete(key: string): boolean {
    const weakRef = this.references.get(key);
    if (weakRef) {
      this.cleanup(key);
      return true;
    }
    return false;
  }

  cleanup(key: string): void {
    // Executar callback de limpeza
    const cleanupCallback = this.cleanupCallbacks.get(key);
    if (cleanupCallback) {
      try {
        cleanupCallback();
      } catch (error) {
        console.error(`Erro no cleanup callback para ${key}:`, error);
      }
      this.cleanupCallbacks.delete(key);
    }

    // Remover referências
    this.references.delete(key);
    this.finalizers.delete(key);
  }

  cleanupAll(): void {
    // Limpar todas as referências órfãs
    for (const [key, weakRef] of this.references) {
      if (weakRef.deref() === undefined) {
        this.cleanup(key);
      }
    }
  }

  size(): number {
    return this.references.size;
  }
}

/**
 * Monitor de Memória
 */
class MemoryMonitor {
  private samples: MemoryStats[] = [];
  private maxSamples = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 5000): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.collectSample();
    }, intervalMs);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private collectSample(): void {
    const stats = this.getCurrentStats();
    this.samples.push(stats);

    // Manter apenas as últimas amostras
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  getCurrentStats(): MemoryStats {
    // Simular coleta de estatísticas de memória
    const memInfo = this.getMemoryInfo();
    
    return {
      heapUsed: memInfo.usedJSHeapSize || 0,
      heapTotal: memInfo.totalJSHeapSize || 0,
      heapLimit: memInfo.jsHeapSizeLimit || 0,
      external: 0,
      activeObjects: 0,
      pooledObjects: 0,
      weakReferences: 0,
      streamingChunks: 0,
      gcCollections: 0,
      lastCleanup: Date.now()
    };
  }

  private getMemoryInfo(): any {
    // Tentar obter informações de memória do browser
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory;
    }
    
    // Fallback para Node.js
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        usedJSHeapSize: usage.heapUsed,
        totalJSHeapSize: usage.heapTotal,
        jsHeapSizeLimit: usage.heapTotal * 2
      };
    }

    return {};
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.samples.length < 5) return 'stable';

    const recent = this.samples.slice(-5);
    const trend = recent.reduce((acc, sample, index) => {
      if (index === 0) return acc;
      const prev = recent[index - 1];
      return acc + Math.sign(sample.heapUsed - prev.heapUsed);
    }, 0);

    if (trend > 2) return 'increasing';
    if (trend < -2) return 'decreasing';
    return 'stable';
  }

  isMemoryPressure(threshold: number = 0.8): boolean {
    const current = this.getCurrentStats();
    return current.heapLimit > 0 && 
           (current.heapUsed / current.heapLimit) > threshold;
  }

  getSamples(): MemoryStats[] {
    return [...this.samples];
  }
}

/**
 * Gerenciador Principal de Memória
 */
export class PPTXMemoryManager {
  private static instance: PPTXMemoryManager;
  private config: MemoryConfig;
  private monitor: MemoryMonitor;
  private streamProcessor: StreamProcessor;
  private weakRefManager: WeakReferenceManager;
  private objectPools = new Map<string, ObjectPool<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private trackedObjects = new Set<WeakRef<any>>();

  private constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxHeapSize: 100 * 1024 * 1024, // 100MB
      cleanupInterval: 30000, // 30 segundos
      gcThreshold: 0.8, // 80%
      enableMonitoring: true,
      streamProcessing: {
        enabled: true,
        chunkSize: 1024 * 1024, // 1MB
        maxConcurrentChunks: 4
      },
      objectPool: {
        enabled: true,
        maxPoolSize: 100,
        cleanupFrequency: 60000 // 1 minuto
      },
      weakReferences: {
        enabled: true,
        cleanupThreshold: 50
      },
      ...config
    };

    this.monitor = new MemoryMonitor();
    this.streamProcessor = new StreamProcessor(
      this.config.streamProcessing.chunkSize,
      this.config.streamProcessing.maxConcurrentChunks
    );
    this.weakRefManager = new WeakReferenceManager();

    this.initialize();
  }

  static getInstance(config?: Partial<MemoryConfig>): PPTXMemoryManager {
    if (!PPTXMemoryManager.instance) {
      PPTXMemoryManager.instance = new PPTXMemoryManager(config);
    }
    return PPTXMemoryManager.instance;
  }

  private initialize(): void {
    // Iniciar monitoramento se habilitado
    if (this.config.enableMonitoring) {
      this.monitor.start();
    }

    // Configurar limpeza automática
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    // Criar pools de objetos comuns
    if (this.config.objectPool.enabled) {
      this.createCommonObjectPools();
    }
  }

  /**
   * Processar arquivo em stream para grandes arquivos
   */
  async processLargeFile<T>(
    data: ArrayBuffer,
    processor: (chunk: ArrayBuffer, index: number) => Promise<T>
  ): Promise<T[]> {
    if (!this.config.streamProcessing.enabled) {
      throw new Error('Stream processing está desabilitado');
    }

    return this.streamProcessor.processStream(data, processor);
  }

  /**
   * Registrar objeto para gestão de memória
   */
  trackObject<T extends object>(
    key: string,
    object: T,
    cleanupCallback?: () => void
  ): WeakRef<T> {
    if (!this.config.weakReferences.enabled) {
      return new WeakRef(object);
    }

    const weakRef = this.weakRefManager.register(key, object, cleanupCallback);
    this.trackedObjects.add(weakRef);
    
    return weakRef;
  }

  /**
   * Obter objeto rastreado
   */
  getTrackedObject<T>(key: string): T | undefined {
    return this.weakRefManager.get<T>(key);
  }

  /**
   * Liberar objeto rastreado
   */
  releaseObject(key: string): boolean {
    return this.weakRefManager.delete(key);
  }

  /**
   * Criar ou obter pool de objetos
   */
  getObjectPool<T>(
    name: string,
    factory: () => T,
    reset: (obj: T) => void
  ): ObjectPool<T> {
    if (!this.config.objectPool.enabled) {
      throw new Error('Object pooling está desabilitado');
    }

    let pool = this.objectPools.get(name);
    if (!pool) {
      pool = new ObjectPool(factory, reset);
      this.objectPools.set(name, pool);
    }
    
    return pool as ObjectPool<T>;
  }

  /**
   * Verificar pressão de memória
   */
  isMemoryPressure(): boolean {
    return this.monitor.isMemoryPressure(this.config.gcThreshold);
  }

  /**
   * Forçar limpeza de memória
   */
  async forceCleanup(): Promise<void> {
    console.log('🧹 Iniciando limpeza forçada de memória...');
    
    await this.performCleanup();
    
    // Forçar garbage collection se disponível
    this.forceGarbageCollection();
    
    console.log('✅ Limpeza de memória concluída');
  }

  /**
   * Obter estatísticas de memória
   */
  getMemoryStats(): MemoryStats & {
    pools: Record<string, ObjectPoolStats>;
    trend: 'increasing' | 'decreasing' | 'stable';
    pressure: boolean;
  } {
    const baseStats = this.monitor.getCurrentStats();
    
    // Adicionar estatísticas dos pools
    const pools: Record<string, ObjectPoolStats> = {};
    for (const [name, pool] of this.objectPools) {
      pools[name] = pool.getStats();
    }

    // Atualizar estatísticas específicas
    baseStats.weakReferences = this.weakRefManager.size();
    baseStats.streamingChunks = this.streamProcessor.getActiveChunks();
    baseStats.pooledObjects = Array.from(this.objectPools.values())
      .reduce((total, pool) => total + pool.getStats().currentPoolSize, 0);

    return {
      ...baseStats,
      pools,
      trend: this.monitor.getMemoryTrend(),
      pressure: this.isMemoryPressure()
    };
  }

  /**
   * Otimizar uso de memória
   */
  async optimizeMemory(): Promise<{
    freedMemory: number;
    optimizations: string[];
  }> {
    const beforeStats = this.monitor.getCurrentStats();
    const optimizations: string[] = [];

    // 1. Limpar referências fracas órfãs
    this.weakRefManager.cleanupAll();
    optimizations.push('Limpeza de referências fracas');

    // 2. Limpar pools de objetos
    if (this.config.objectPool.enabled) {
      for (const [name, pool] of this.objectPools) {
        if (pool.getStats().currentPoolSize > this.config.objectPool.maxPoolSize) {
          pool.clear();
          optimizations.push(`Pool ${name} reduzido`);
        }
      }
    }

    // 3. Sugerir garbage collection
    this.forceGarbageCollection();
    optimizations.push('Garbage collection sugerido');

    // 4. Aguardar um pouco para que as otimizações tenham efeito
    await new Promise(resolve => setTimeout(resolve, 100));

    const afterStats = this.monitor.getCurrentStats();
    const freedMemory = Math.max(0, beforeStats.heapUsed - afterStats.heapUsed);

    return { freedMemory, optimizations };
  }

  /**
   * Configurar alertas de memória
   */
  onMemoryPressure(callback: (stats: MemoryStats) => void): void {
    const checkInterval = setInterval(() => {
      if (this.isMemoryPressure()) {
        const stats = this.monitor.getCurrentStats();
        callback(stats);
      }
    }, 5000);

    // Cleanup automático do interval quando a instância for destruída
    this.trackObject('memory-pressure-monitor', { interval: checkInterval }, () => {
      clearInterval(checkInterval);
    });
  }

  /**
   * Destruir gerenciador e limpar recursos
   */
  async destroy(): Promise<void> {
    console.log('🔄 Destruindo Memory Manager...');

    // Parar monitoramento
    this.monitor.stop();

    // Limpar interval de cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Limpar todos os pools
    for (const pool of this.objectPools.values()) {
      pool.clear();
    }
    this.objectPools.clear();

    // Limpar referências fracas
    this.weakRefManager.cleanupAll();

    // Limpar objetos rastreados
    this.trackedObjects.clear();

    console.log('✅ Memory Manager destruído');
  }

  /**
   * Limpeza periódica
   */
  private async performCleanup(): Promise<void> {
    if (this.isMemoryPressure()) {
      console.log('⚠️ Pressão de memória detectada, iniciando limpeza...');
      
      // Limpeza agressiva quando há pressão de memória
      this.weakRefManager.cleanupAll();
      
      // Reduzir pools se necessário
      for (const pool of this.objectPools.values()) {
        const stats = pool.getStats();
        if (stats.currentPoolSize > 10) {
          pool.clear();
        }
      }
      
      this.forceGarbageCollection();
    } else {
      // Limpeza normal
      if (this.weakRefManager.size() > this.config.weakReferences.cleanupThreshold) {
        this.weakRefManager.cleanupAll();
      }
    }
  }

  /**
   * Criar pools de objetos comuns
   */
  private createCommonObjectPools(): void {
    // Pool para objetos Canvas
    this.getObjectPool(
      'canvas',
      () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        return { canvas, ctx: canvas.getContext('2d') };
      },
      (obj) => {
        if (obj.ctx) {
          obj.ctx.clearRect(0, 0, obj.canvas.width, obj.canvas.height);
        }
      }
    );

    // Pool para buffers de imagem
    this.getObjectPool(
      'imageBuffer',
      () => new ArrayBuffer(1024 * 1024), // 1MB
      (buffer) => {
        // Buffer não precisa de reset específico
      }
    );

    // Pool para objetos de resultado de processamento
    this.getObjectPool(
      'processingResult',
      () => ({
        success: false,
        data: null,
        errors: [],
        timestamp: 0
      }),
      (obj) => {
        obj.success = false;
        obj.data = null;
        obj.errors = [];
        obj.timestamp = 0;
      }
    );
  }

  /**
   * Forçar garbage collection
   */
  private forceGarbageCollection(): void {
    // Node.js
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
      return;
    }

    // Browser - não há forma direta, mas podemos criar pressão de memória
    if (typeof window !== 'undefined') {
      // Criar e descartar objetos para encorajar GC
      for (let i = 0; i < 100; i++) {
        const temp = new Array(1000).fill(0);
        temp.length = 0;
      }
    }
  }
}

// Export singleton instance
export const pptxMemoryManager = PPTXMemoryManager.getInstance();

// Helper functions
export function withMemoryTracking<T>(
  key: string,
  factory: () => T,
  cleanup?: () => void
): () => T | undefined {
  return () => {
    const existing = pptxMemoryManager.getTrackedObject<T>(key);
    if (existing) return existing;

    const newObject = factory();
    if (typeof newObject === 'object' && newObject !== null) {
      pptxMemoryManager.trackObject(key, newObject, cleanup);
    }
    
    return newObject;
  };
}

export function useObjectPool<T>(
  poolName: string,
  factory: () => T,
  reset: (obj: T) => void
): { acquire: () => T; release: (obj: T) => void } {
  const pool = pptxMemoryManager.getObjectPool(poolName, factory, reset);
  
  return {
    acquire: () => pool.acquire(),
    release: (obj: T) => pool.release(obj)
  };
}