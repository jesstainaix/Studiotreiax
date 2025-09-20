/**
 * Sistema de cache avançado para o VFX Engine
 * Implementa cache hierárquico, compressão e estratégias inteligentes de invalidação
 */

export interface CacheConfig {
  maxMemoryMB: number;
  compressionEnabled: boolean;
  persistentCache: boolean;
  cacheStrategy: 'lru' | 'lfu' | 'adaptive';
  preloadStrategy: 'none' | 'predictive' | 'aggressive';
}

export interface CacheEntry {
  key: string;
  data: any;
  size: number;
  timestamp: number;
  lastAccess: number;
  accessCount: number;
  priority: number;
  compressed: boolean;
  dependencies: string[];
}

export interface CacheStats {
  totalEntries: number;
  memoryUsed: number;
  hitRate: number;
  compressionRatio: number;
  evictions: number;
}

export class AdvancedCacheSystem {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry>;
  private accessHistory: Map<string, number[]>;
  private dependencyGraph: Map<string, Set<string>>;
  private stats: CacheStats;
  private memoryUsed: number;
  private compressionWorker?: Worker;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryMB: 256,
      compressionEnabled: true,
      persistentCache: false,
      cacheStrategy: 'adaptive',
      preloadStrategy: 'predictive',
      ...config
    };
    
    this.cache = new Map();
    this.accessHistory = new Map();
    this.dependencyGraph = new Map();
    this.memoryUsed = 0;
    
    this.stats = {
      totalEntries: 0,
      memoryUsed: 0,
      hitRate: 0,
      compressionRatio: 0,
      evictions: 0
    };
    
    this.initializeCompressionWorker();
    this.loadPersistentCache();
  }
  
  /**
   * Armazena item no cache
   */
  async set(
    key: string, 
    data: any, 
    dependencies: string[] = [],
    priority: number = 1
  ): Promise<void> {
    const size = this.estimateSize(data);
    
    // Verificar se há espaço suficiente
    await this.ensureSpace(size);
    
    // Comprimir dados se habilitado
    let processedData = data;
    let compressed = false;
    
    if (this.config.compressionEnabled && this.shouldCompress(data, size)) {
      processedData = await this.compress(data);
      compressed = true;
    }
    
    const entry: CacheEntry = {
      key,
      data: processedData,
      size: compressed ? this.estimateSize(processedData) : size,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      accessCount: 0,
      priority,
      compressed,
      dependencies
    };
    
    // Remover entrada existente se houver
    if (this.cache.has(key)) {
      await this.remove(key);
    }
    
    this.cache.set(key, entry);
    this.memoryUsed += entry.size;
    this.updateDependencies(key, dependencies);
    this.updateStats();
    
    // Salvar no cache persistente se habilitado
    if (this.config.persistentCache) {
      this.saveToPersistentCache(key, entry);
    }
  }
  
  /**
   * Recupera item do cache
   */
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateHitRate(false);
      return null;
    }
    
    // Atualizar estatísticas de acesso
    entry.lastAccess = Date.now();
    entry.accessCount++;
    this.updateAccessHistory(key);
    this.updateHitRate(true);
    
    // Descomprimir se necessário
    if (entry.compressed) {
      return await this.decompress(entry.data);
    }
    
    return entry.data;
  }
  
  /**
   * Remove item do cache
   */
  async remove(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.memoryUsed -= entry.size;
    this.removeDependencies(key);
    this.accessHistory.delete(key);
    this.updateStats();
    
    // Remover do cache persistente
    if (this.config.persistentCache) {
      this.removeFromPersistentCache(key);
    }
    
    return true;
  }
  
  /**
   * Invalida cache baseado em dependências
   */
  async invalidate(dependency: string): Promise<void> {
    const dependents = this.dependencyGraph.get(dependency);
    
    if (!dependents) {
      return;
    }
    
    const keysToRemove = Array.from(dependents);
    
    for (const key of keysToRemove) {
      await this.remove(key);
    }
  }
  
  /**
   * Pré-carrega dados baseado em padrões de acesso
   */
  async preload(keys: string[]): Promise<void> {
    if (this.config.preloadStrategy === 'none') {
      return;
    }
    
    const predictedKeys = this.predictNextAccess(keys);
    
    // Implementar lógica de pré-carregamento
    // Esta seria integrada com o sistema de nós para pré-processar
    console.log('Preloading predicted keys:', predictedKeys);
  }
  
  /**
   * Garante espaço suficiente no cache
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const maxBytes = this.config.maxMemoryMB * 1024 * 1024;
    
    while (this.memoryUsed + requiredSize > maxBytes && this.cache.size > 0) {
      const keyToEvict = this.selectEvictionCandidate();
      
      if (keyToEvict) {
        await this.remove(keyToEvict);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }
  
  /**
   * Seleciona candidato para remoção baseado na estratégia
   */
  private selectEvictionCandidate(): string | null {
    if (this.cache.size === 0) {
      return null;
    }
    
    switch (this.config.cacheStrategy) {
      case 'lru':
        return this.selectLRU();
      case 'lfu':
        return this.selectLFU();
      case 'adaptive':
        return this.selectAdaptive();
      default:
        return this.selectLRU();
    }
  }
  
  /**
   * Seleciona item menos recentemente usado
   */
  private selectLRU(): string | null {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    return oldestKey || null;
  }
  
  /**
   * Seleciona item menos frequentemente usado
   */
  private selectLFU(): string | null {
    let leastUsedKey = '';
    let leastCount = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey || null;
  }
  
  /**
   * Seleção adaptativa baseada em múltiplos fatores
   */
  private selectAdaptive(): string | null {
    let bestKey = '';
    let bestScore = -1;
    
    for (const [key, entry] of this.cache.entries()) {
      const score = this.calculateEvictionScore(entry);
      
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
    
    return bestKey || null;
  }
  
  /**
   * Calcula pontuação para remoção (maior = mais provável de ser removido)
   */
  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceAccess = now - entry.lastAccess;
    
    // Fatores: idade, tempo desde último acesso, frequência, prioridade, tamanho
    const ageScore = age / (1000 * 60 * 60); // Horas
    const accessScore = timeSinceAccess / (1000 * 60); // Minutos
    const frequencyScore = 1 / (entry.accessCount + 1);
    const priorityScore = 1 / entry.priority;
    const sizeScore = entry.size / (1024 * 1024); // MB
    
    return ageScore + accessScore + frequencyScore + priorityScore + sizeScore;
  }
  
  /**
   * Estima tamanho do objeto em bytes
   */
  private estimateSize(obj: any): number {
    if (obj === null || obj === undefined) {
      return 0;
    }
    
    if (typeof obj === 'string') {
      return obj.length * 2; // UTF-16
    }
    
    if (typeof obj === 'number') {
      return 8;
    }
    
    if (typeof obj === 'boolean') {
      return 4;
    }
    
    if (obj instanceof ArrayBuffer) {
      return obj.byteLength;
    }
    
    if (obj instanceof HTMLCanvasElement) {
      return obj.width * obj.height * 4; // RGBA
    }
    
    // Estimativa para objetos complexos
    try {
      return JSON.stringify(obj).length * 2;
    } catch {
      return 1024; // Fallback
    }
  }
  
  /**
   * Determina se dados devem ser comprimidos
   */
  private shouldCompress(data: any, size: number): boolean {
    // Comprimir apenas se o tamanho for maior que 1KB
    return size > 1024 && (
      typeof data === 'string' ||
      data instanceof ArrayBuffer ||
      (typeof data === 'object' && data !== null)
    );
  }
  
  /**
   * Comprime dados
   */
  private async compress(data: any): Promise<any> {
    if (this.compressionWorker) {
      return new Promise((resolve, reject) => {
        this.compressionWorker!.postMessage({ action: 'compress', data });
        
        const handler = (event: MessageEvent) => {
          if (event.data.action === 'compressed') {
            this.compressionWorker!.removeEventListener('message', handler);
            resolve(event.data.result);
          } else if (event.data.action === 'error') {
            this.compressionWorker!.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };
        
        this.compressionWorker!.addEventListener('message', handler);
      });
    }
    
    // Fallback: compressão simples usando JSON
    try {
      const jsonString = JSON.stringify(data);
      return btoa(jsonString); // Base64 encoding como compressão básica
    } catch {
      return data;
    }
  }
  
  /**
   * Descomprime dados
   */
  private async decompress(compressedData: any): Promise<any> {
    if (this.compressionWorker) {
      return new Promise((resolve, reject) => {
        this.compressionWorker!.postMessage({ action: 'decompress', data: compressedData });
        
        const handler = (event: MessageEvent) => {
          if (event.data.action === 'decompressed') {
            this.compressionWorker!.removeEventListener('message', handler);
            resolve(event.data.result);
          } else if (event.data.action === 'error') {
            this.compressionWorker!.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };
        
        this.compressionWorker!.addEventListener('message', handler);
      });
    }
    
    // Fallback: descompressão simples
    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch {
      return compressedData;
    }
  }
  
  /**
   * Inicializa worker de compressão
   */
  private initializeCompressionWorker(): void {
    if (!this.config.compressionEnabled || typeof Worker === 'undefined') {
      return;
    }
    
    try {
      const workerCode = `
        self.onmessage = function(e) {
          const { action, data } = e.data;
          
          try {
            if (action === 'compress') {
              // Implementar compressão real aqui (ex: pako.js)
              const result = btoa(JSON.stringify(data));
              self.postMessage({ action: 'compressed', result });
            } else if (action === 'decompress') {
              const result = JSON.parse(atob(data));
              self.postMessage({ action: 'decompressed', result });
            }
          } catch (error) {
            self.postMessage({ action: 'error', error: error.message });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
    }
  }
  
  /**
   * Atualiza dependências
   */
  private updateDependencies(key: string, dependencies: string[]): void {
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(key);
    }
  }
  
  /**
   * Remove dependências
   */
  private removeDependencies(key: string): void {
    for (const [dep, dependents] of this.dependencyGraph.entries()) {
      dependents.delete(key);
      if (dependents.size === 0) {
        this.dependencyGraph.delete(dep);
      }
    }
  }
  
  /**
   * Atualiza histórico de acesso
   */
  private updateAccessHistory(key: string): void {
    if (!this.accessHistory.has(key)) {
      this.accessHistory.set(key, []);
    }
    
    const history = this.accessHistory.get(key)!;
    history.push(Date.now());
    
    // Manter apenas os últimos 100 acessos
    if (history.length > 100) {
      history.shift();
    }
  }
  
  /**
   * Prediz próximos acessos baseado em padrões
   */
  private predictNextAccess(recentKeys: string[]): string[] {
    // Implementação simplificada de predição
    const predictions: string[] = [];
    
    for (const key of recentKeys) {
      const history = this.accessHistory.get(key);
      if (history && history.length > 1) {
        // Analisar padrões temporais
        const intervals = [];
        for (let i = 1; i < history.length; i++) {
          intervals.push(history[i] - history[i - 1]);
        }
        
        // Se há padrão regular, prever próximo acesso
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const lastAccess = history[history.length - 1];
        
        if (Date.now() - lastAccess < avgInterval * 1.5) {
          predictions.push(key);
        }
      }
    }
    
    return predictions;
  }
  
  /**
   * Atualiza taxa de acerto
   */
  private updateHitRate(hit: boolean): void {
    // Implementação simplificada - em produção usaria janela deslizante
    const currentHits = this.stats.hitRate * this.stats.totalEntries;
    const newTotal = this.stats.totalEntries + 1;
    const newHits = currentHits + (hit ? 1 : 0);
    
    this.stats.hitRate = newHits / newTotal;
  }
  
  /**
   * Atualiza estatísticas
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsed = this.memoryUsed;
    
    // Calcular taxa de compressão
    let originalSize = 0;
    let compressedSize = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.compressed) {
        compressedSize += entry.size;
        originalSize += entry.size * 2; // Estimativa
      } else {
        originalSize += entry.size;
        compressedSize += entry.size;
      }
    }
    
    this.stats.compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;
  }
  
  /**
   * Carrega cache persistente
   */
  private async loadPersistentCache(): Promise<void> {
    if (!this.config.persistentCache || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const stored = localStorage.getItem('vfx-cache');
      if (stored) {
        const data = JSON.parse(stored);
        // Implementar carregamento do cache persistente
        console.log('Loaded persistent cache:', data);
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }
  
  /**
   * Salva no cache persistente
   */
  private saveToPersistentCache(key: string, entry: CacheEntry): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      // Implementar salvamento seletivo
      const cacheData = {
        key,
        timestamp: entry.timestamp,
        size: entry.size
      };
      
      localStorage.setItem(`vfx-cache-${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to persistent cache:', error);
    }
  }
  
  /**
   * Remove do cache persistente
   */
  private removeFromPersistentCache(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      localStorage.removeItem(`vfx-cache-${key}`);
    } catch (error) {
      console.warn('Failed to remove from persistent cache:', error);
    }
  }
  
  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.accessHistory.clear();
    this.dependencyGraph.clear();
    this.memoryUsed = 0;
    this.updateStats();
    
    if (this.config.persistentCache && typeof localStorage !== 'undefined') {
      // Limpar cache persistente
      const keys = Object.keys(localStorage).filter(key => key.startsWith('vfx-cache-'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }
  
  /**
   * Destrói o sistema de cache
   */
  destroy(): void {
    this.clear();
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = undefined;
    }
  }
}