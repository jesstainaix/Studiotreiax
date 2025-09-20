import { LRUCache } from 'lru-cache'

interface VideoFrame {
  timestamp: number
  blob: Blob
  url: string
}

interface CacheEntry {
  frames: Map<number, VideoFrame>
  metadata: {
    duration: number
    fps: number
    resolution: { width: number; height: number }
    lastAccessed: number
  }
}

class VideoCacheService {
  private cache: LRUCache<string, CacheEntry>
  private maxCacheSize: number = 100 * 1024 * 1024 // 100MB
  private maxFramesPerVideo: number = 300 // ~10 segundos a 30fps
  
  constructor() {
    this.cache = new LRUCache({
      max: 50, // máximo 50 vídeos em cache
      maxSize: this.maxCacheSize,
      sizeCalculation: (entry) => this.calculateEntrySize(entry),
      dispose: (entry) => this.disposeEntry(entry)
    })
  }

  /**
   * Gera uma chave única para o vídeo baseada em seus parâmetros
   */
  private generateCacheKey(videoId: string, layerId: string, settings: any): string {
    const settingsHash = JSON.stringify(settings)
    return `${videoId}_${layerId}_${btoa(settingsHash).slice(0, 8)}`
  }

  /**
   * Calcula o tamanho de uma entrada do cache
   */
  private calculateEntrySize(entry: CacheEntry): number {
    let size = 0
    entry.frames.forEach(frame => {
      size += frame.blob.size
    })
    return size
  }

  /**
   * Limpa recursos de uma entrada removida do cache
   */
  private disposeEntry(entry: CacheEntry): void {
    entry.frames.forEach(frame => {
      URL.revokeObjectURL(frame.url)
    })
    entry.frames.clear()
  }

  /**
   * Obtém um frame específico do cache
   */
  getFrame(videoId: string, layerId: string, timestamp: number, settings: any): VideoFrame | null {
    const key = this.generateCacheKey(videoId, layerId, settings)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Atualiza último acesso
    entry.metadata.lastAccessed = Date.now()
    
    // Procura o frame mais próximo do timestamp
    const frameKey = Math.round(timestamp * entry.metadata.fps)
    return entry.frames.get(frameKey) || null
  }

  /**
   * Armazena um frame no cache
   */
  setFrame(videoId: string, layerId: string, timestamp: number, blob: Blob, settings: any): void {
    const key = this.generateCacheKey(videoId, layerId, settings)
    let entry = this.cache.get(key)
    
    if (!entry) {
      entry = {
        frames: new Map(),
        metadata: {
          duration: 0,
          fps: 30, // padrão
          resolution: { width: 1920, height: 1080 },
          lastAccessed: Date.now()
        }
      }
      this.cache.set(key, entry)
    }
    
    const frameKey = Math.round(timestamp * entry.metadata.fps)
    const url = URL.createObjectURL(blob)
    
    // Remove frame antigo se existir
    const oldFrame = entry.frames.get(frameKey)
    if (oldFrame) {
      URL.revokeObjectURL(oldFrame.url)
    }
    
    entry.frames.set(frameKey, {
      timestamp,
      blob,
      url
    })
    
    // Limita o número de frames por vídeo
    if (entry.frames.size > this.maxFramesPerVideo) {
      const oldestKey = Math.min(...entry.frames.keys())
      const oldestFrame = entry.frames.get(oldestKey)
      if (oldestFrame) {
        URL.revokeObjectURL(oldestFrame.url)
        entry.frames.delete(oldestKey)
      }
    }
    
    entry.metadata.lastAccessed = Date.now()
  }

  /**
   * Pré-carrega frames em torno de um timestamp
   */
  async preloadFrames(
    videoId: string, 
    layerId: string, 
    centerTimestamp: number, 
    settings: any,
    renderFunction: (timestamp: number) => Promise<Blob>
  ): Promise<void> {
    const key = this.generateCacheKey(videoId, layerId, settings)
    const entry = this.cache.get(key) || {
      frames: new Map(),
      metadata: {
        duration: 0,
        fps: 30,
        resolution: { width: 1920, height: 1080 },
        lastAccessed: Date.now()
      }
    }
    
    // Pré-carrega 2 segundos antes e depois do timestamp atual
    const preloadRange = 2
    const fps = entry.metadata.fps
    const startTime = Math.max(0, centerTimestamp - preloadRange)
    const endTime = centerTimestamp + preloadRange
    
    const promises: Promise<void>[] = []
    
    for (let t = startTime; t <= endTime; t += 1 / fps) {
      const frameKey = Math.round(t * fps)
      
      if (!entry.frames.has(frameKey)) {
        promises.push(
          renderFunction(t)
            .then(blob => this.setFrame(videoId, layerId, t, blob, settings))
            .catch(error => console.warn(`Erro ao pré-carregar frame em ${t}s:`, error))
        )
      }
    }
    
    await Promise.allSettled(promises)
  }

  /**
   * Remove um vídeo específico do cache
   */
  invalidateVideo(videoId: string, layerId?: string): void {
    const keysToDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${videoId}_`)) {
        if (!layerId || key.includes(`_${layerId}_`)) {
          keysToDelete.push(key)
        }
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    size: number
    maxSize: number
    itemCount: number
    hitRate: number
  } {
    return {
      size: this.cache.calculatedSize || 0,
      maxSize: this.maxCacheSize,
      itemCount: this.cache.size,
      hitRate: 0 // TODO: implementar tracking de hit rate
    }
  }

  /**
   * Otimiza o cache removendo entradas antigas
   */
  optimize(): void {
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30 minutos
    
    this.cache.forEach((entry, key) => {
      if (now - entry.metadata.lastAccessed > maxAge) {
        this.cache.delete(key)
      }
    })
  }
}

// Instância singleton
export const videoCacheService = new VideoCacheService()

// Auto-otimização a cada 5 minutos
setInterval(() => {
  videoCacheService.optimize()
}, 5 * 60 * 1000)

export default VideoCacheService