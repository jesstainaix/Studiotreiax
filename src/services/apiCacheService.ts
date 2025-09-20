// API Cache Service - Sistema de cache para requisições HTTP
import { EventEmitter } from '../utils/EventEmitter';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

interface CacheConfig {
  defaultTTL: number; // 5 minutos
  maxEntries: number;
  enableEtag: boolean;
  enableLastModified: boolean;
}

class APICache extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxEntries: 1000,
      enableEtag: true,
      enableLastModified: true,
      ...config
    };

    // Limpeza automática a cada minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  // Gerar chave de cache baseada na URL e parâmetros
  private generateCacheKey(url: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    const headers = JSON.stringify(options.headers || {});
    return `${method}:${url}:${body}:${headers}`;
  }

  // Verificar se entrada está válida
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Obter do cache
  get(url: string, options: RequestInit = {}): CacheEntry | null {
    const key = this.generateCacheKey(url, options);
    const entry = this.cache.get(key);
    
    if (!entry || !this.isValid(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    // Atualizar timestamp de acesso
    entry.timestamp = Date.now();
    return entry;
  }

  // Armazenar no cache
  set(url: string, data: any, options: RequestInit = {}, ttl?: number, headers?: Headers): void {
    const key = this.generateCacheKey(url, options);
    
    // Verificar limite de entradas
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    // Adicionar ETag e Last-Modified se disponíveis
    if (headers && this.config.enableEtag) {
      entry.etag = headers.get('etag') || undefined;
    }
    if (headers && this.config.enableLastModified) {
      entry.lastModified = headers.get('last-modified') || undefined;
    }

    this.cache.set(key, entry);
    this.emit('cache:set', { key, size: this.cache.size });
  }

  // Remover entrada específica
  delete(url: string, options: RequestInit = {}): boolean {
    const key = this.generateCacheKey(url, options);
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.emit('cache:delete', { key, size: this.cache.size });
    }
    return deleted;
  }

  // Limpar cache expirado
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.emit('cache:cleanup', { cleaned, size: this.cache.size });
    }
  }

  // Remover entrada mais antiga
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.emit('cache:evict', { key: oldestKey, size: this.cache.size });
    }
  }

  // Limpar todo o cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cache:clear', { previousSize: size });
  }

  // Obter estatísticas do cache
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (this.isValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      totalSize,
      maxEntries: this.config.maxEntries,
      hitRate: this.getHitRate()
    };
  }

  private hitRate = { hits: 0, misses: 0 };

  private getHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total > 0 ? (this.hitRate.hits / total) * 100 : 0;
  }

  // Registrar hit
  recordHit(): void {
    this.hitRate.hits++;
  }

  // Registrar miss
  recordMiss(): void {
    this.hitRate.misses++;
  }

  // Destruir cache
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.removeAllListeners();
  }
}

// Instância global do cache
export const apiCache = new APICache();

// Wrapper para fetch com cache
export async function cachedFetch(
  url: string, 
  options: RequestInit = {}, 
  ttl?: number
): Promise<Response> {
  // Verificar cache primeiro
  const cached = apiCache.get(url, options);
  if (cached) {
    apiCache.recordHit();
    // Retornar resposta do cache
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      statusText: 'OK (Cached)',
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      }
    });
  }

  apiCache.recordMiss();

  try {
    // Fazer requisição real
    const response = await fetch(url, options);
    
    // Só cachear respostas de sucesso
    if (response.ok) {
      const data = await response.clone().json();
      apiCache.set(url, data, options, ttl, response.headers);
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Hook para usar cache de API
export function useAPICache() {
  return {
    get: apiCache.get.bind(apiCache),
    set: apiCache.set.bind(apiCache),
    delete: apiCache.delete.bind(apiCache),
    clear: apiCache.clear.bind(apiCache),
    getStats: apiCache.getStats.bind(apiCache),
    cachedFetch
  };
}

export default apiCache;