// Sistema de Cache Inteligente para PPTX
import { EventEmitter } from '../utils/EventEmitter';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number;
  metadata?: {
    fileHash?: string;
    version?: string;
    dependencies?: string[];
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
}

export interface CacheConfig {
  maxSize: number; // Tamanho máximo em bytes
  maxEntries: number; // Número máximo de entradas
  defaultTTL: number; // TTL padrão em ms
  cleanupInterval: number; // Intervalo de limpeza em ms
  enableCompression: boolean;
  enablePersistence: boolean;
  persistencePath?: string;
}

class PPTXCacheService extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  };
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    
    this.config = {
      maxSize: 500 * 1024 * 1024, // 500MB
      maxEntries: 1000,
      defaultTTL: 60 * 60 * 1000, // 1 hora
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
      enableCompression: true,
      enablePersistence: false,
      ...config
    };

    this.startCleanupTimer();
  }

  // Cache de análise de PPTX
  async cacheAnalysis(fileHash: string, analysis: any): Promise<void> {
    const key = `analysis:${fileHash}`;
    const entry: CacheEntry = {
      key,
      data: analysis,
      timestamp: Date.now(),
      size: this.calculateSize(analysis),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: this.config.defaultTTL,
      metadata: {
        fileHash,
        version: '1.0',
        dependencies: ['ocr', 'ai-analysis']
      }
    };

    await this.set(key, entry);
    this.emit('analysisCache', { fileHash, size: entry.size });
  }

  // Cache de templates de IA
  async cacheTemplateRecommendations(contentHash: string, templates: any[]): Promise<void> {
    const key = `templates:${contentHash}`;
    const entry: CacheEntry = {
      key,
      data: templates,
      timestamp: Date.now(),
      size: this.calculateSize(templates),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: this.config.defaultTTL * 2, // Templates podem ser reutilizados por mais tempo
      metadata: {
        fileHash: contentHash,
        version: '1.0',
        dependencies: ['gpt-vision', 'template-engine']
      }
    };

    await this.set(key, entry);
    this.emit('templateCache', { contentHash, count: templates.length });
  }

  // Cache de processamento OCR
  async cacheOCRResults(slideHash: string, ocrData: any): Promise<void> {
    const key = `ocr:${slideHash}`;
    const entry: CacheEntry = {
      key,
      data: ocrData,
      timestamp: Date.now(),
      size: this.calculateSize(ocrData),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: this.config.defaultTTL * 3, // OCR é mais estável
      metadata: {
        fileHash: slideHash,
        version: '1.0',
        dependencies: ['ocr-engine']
      }
    };

    await this.set(key, entry);
    this.emit('ocrCache', { slideHash, confidence: ocrData.confidence });
  }

  // Cache de áudio TTS
  async cacheTTSAudio(textHash: string, audioData: any): Promise<void> {
    const key = `tts:${textHash}`;
    const entry: CacheEntry = {
      key,
      data: audioData,
      timestamp: Date.now(),
      size: this.calculateSize(audioData),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: this.config.defaultTTL * 4, // Áudio pode ser reutilizado
      metadata: {
        fileHash: textHash,
        version: '1.0',
        dependencies: ['tts-engine']
      }
    };

    await this.set(key, entry);
    this.emit('ttsCache', { textHash, duration: audioData.duration });
  }

  // Recuperar análise do cache
  async getAnalysis(fileHash: string): Promise<any | null> {
    return this.get(`analysis:${fileHash}`);
  }

  // Recuperar templates do cache
  async getTemplateRecommendations(contentHash: string): Promise<any[] | null> {
    return this.get(`templates:${contentHash}`);
  }

  // Recuperar OCR do cache
  async getOCRResults(slideHash: string): Promise<any | null> {
    return this.get(`ocr:${slideHash}`);
  }

  // Recuperar áudio TTS do cache
  async getTTSAudio(textHash: string): Promise<any | null> {
    return this.get(`tts:${textHash}`);
  }

  // Métodos internos do cache
  private async set(key: string, entry: CacheEntry): Promise<void> {
    // Verificar se precisa fazer limpeza
    if (this.shouldEvict()) {
      await this.evictLRU();
    }

    // Comprimir dados se habilitado
    if (this.config.enableCompression) {
      entry.data = await this.compress(entry.data);
    }

    this.cache.set(key, entry);
    this.stats.totalSize += entry.size;
    
    this.emit('cacheSet', { key, size: entry.size });
  }

  private async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.emit('cacheMiss', { key });
      return null;
    }

    // Verificar TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      this.emit('cacheExpired', { key });
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    // Descomprimir se necessário
    let data = entry.data;
    if (this.config.enableCompression) {
      data = await this.decompress(data);
    }

    this.emit('cacheHit', { key, accessCount: entry.accessCount });
    return data;
  }

  private shouldEvict(): boolean {
    return (
      this.cache.size >= this.config.maxEntries ||
      this.stats.totalSize >= this.config.maxSize
    );
  }

  private async evictLRU(): Promise<void> {
    // Encontrar entrada menos recentemente usada
    let lruEntry: CacheEntry | null = null;
    let lruKey = '';

    for (const [key, entry] of this.cache.entries()) {
      if (!lruEntry || entry.lastAccessed < lruEntry.lastAccessed) {
        lruEntry = entry;
        lruKey = key;
      }
    }

    if (lruEntry) {
      this.cache.delete(lruKey);
      this.stats.totalSize -= lruEntry.size;
      this.stats.evictions++;
      this.emit('cacheEviction', { key: lruKey, reason: 'LRU' });
    }
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Aproximação UTF-16
    } catch {
      return 1024; // Fallback
    }
  }

  private async compress(data: any): Promise<any> {
    // Implementação básica - pode usar zlib em produção
    try {
      return JSON.stringify(data);
    } catch {
      return data;
    }
  }

  private async decompress(data: any): Promise<any> {
    // Implementação básica
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return data;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    let cleanedSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        cleanedCount++;
        cleanedSize += entry.size;
      }
    }

    if (cleanedCount > 0) {
      this.emit('cacheCleanup', { 
        cleanedCount, 
        cleanedSize,
        remainingEntries: this.cache.size 
      });
    }
  }

  // Métodos públicos de gerenciamento
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.stats.totalSize,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      evictionCount: this.stats.evictions,
      memoryUsage: (this.stats.totalSize / this.config.maxSize) * 100
    };
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
    this.emit('cacheClear');
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern: string): number {
    let invalidatedCount = 0;
    const regex = new RegExp(pattern);

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      this.emit('cacheInvalidation', { pattern, count: invalidatedCount });
    }

    return invalidatedCount;
  }

  // Pré-aquecer cache com dados frequentes
  async warmup(commonHashes: string[]): Promise<void> {
    this.emit('cacheWarmupStart', { hashes: commonHashes.length });
    
    // Implementar lógica de pré-aquecimento se necessário
    for (const hash of commonHashes) {
      // Carregar dados comuns no cache
      await this.preloadCommonData(hash);
    }

    this.emit('cacheWarmupComplete');
  }

  private async preloadCommonData(hash: string): Promise<void> {
    // Implementar pré-carregamento de dados comuns
    // Por exemplo, templates padrão, configurações, etc.
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    this.emit('cacheDisposed');
  }
}

// Instância singleton
export const pptxCacheService = new PPTXCacheService({
  maxSize: 500 * 1024 * 1024, // 500MB
  maxEntries: 1000,
  defaultTTL: 60 * 60 * 1000, // 1 hora
  cleanupInterval: 5 * 60 * 1000, // 5 minutos
  enableCompression: true,
  enablePersistence: false
});

export default PPTXCacheService;