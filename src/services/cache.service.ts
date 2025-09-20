export interface CacheConfig {
  defaultTTL: number // Time To Live em segundos
  maxMemoryUsage: number // em bytes
  compressionEnabled: boolean
  persistToDisk: boolean
  redisUrl?: string
}

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
  size: number
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  totalEntries: number
  memoryUsage: number
  hitRate: number
  missRate: number
  evictions: number
  compressionRatio: number
}

export interface ChunkMetadata {
  chunkId: string
  uploadId: string
  index: number
  size: number
  hash: string
  timestamp: number
  status: 'pending' | 'uploaded' | 'processed' | 'failed'
}

export interface FileMetadata {
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadId: string
  chunks: ChunkMetadata[]
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  validationResult?: any
  analysisResult?: any
  createdAt: number
  updatedAt: number
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 3600, // 1 hora
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  compressionEnabled: true,
  persistToDisk: false,
  redisUrl: import.meta.env.VITE_REDIS_URL
}

class CacheService {
  private static instance: CacheService
  private memoryCache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    totalEntries: 0,
    memoryUsage: 0,
    hitRate: 0,
    missRate: 0,
    evictions: 0,
    compressionRatio: 1
  }
  private config: CacheConfig
  private redisClient: any = null
  private compressionWorker: Worker | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeRedis()
    this.initializeCompression()
    this.startCleanupInterval()
  }

  static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config)
    }
    return CacheService.instance
  }

  /**
   * Armazena um valor no cache
   */
  async set<T>(
    key: string, 
    value: T, 
    ttl: number = this.config.defaultTTL
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      let finalValue = serializedValue
      let size = new Blob([serializedValue]).size

      // Comprimir se habilitado e valor for grande
      if (this.config.compressionEnabled && size > 1024) {
        finalValue = await this.compress(serializedValue)
        const compressedSize = new Blob([finalValue]).size
        this.updateCompressionRatio(size, compressedSize)
        size = compressedSize
      }

      const entry: CacheEntry<string> = {
        key,
        value: finalValue,
        timestamp: Date.now(),
        ttl: ttl * 1000, // converter para millisegundos
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      }

      // Verificar limite de memória
      await this.ensureMemoryLimit(size)

      // Armazenar em memória
      this.memoryCache.set(key, entry)
      this.updateStats('set', size)

      // Armazenar no Redis se disponível
      if (this.redisClient) {
        await this.redisClient.setex(key, ttl, finalValue)
      }

    } catch (error) {
      console.error('Erro ao armazenar no cache:', error)
    }
  }

  /**
   * Recupera um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Tentar buscar na memória primeiro
      let entry = this.memoryCache.get(key)
      
      if (entry) {
        // Verificar se não expirou
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key)
          this.updateStats('miss')
          return null
        }
        
        // Atualizar estatísticas de acesso
        entry.accessCount++
        entry.lastAccessed = Date.now()
        this.updateStats('hit')
        
        return await this.deserializeValue<T>(entry.value)
      }

      // Tentar buscar no Redis
      if (this.redisClient) {
        const redisValue = await this.redisClient.get(key)
        if (redisValue) {
          this.updateStats('hit')
          return await this.deserializeValue<T>(redisValue)
        }
      }

      this.updateStats('miss')
      return null

    } catch (error) {
      console.error('Erro ao recuperar do cache:', error)
      this.updateStats('miss')
      return null
    }
  }

  /**
   * Remove um valor do cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const memoryDeleted = this.memoryCache.delete(key)
      
      let redisDeleted = false
      if (this.redisClient) {
        const result = await this.redisClient.del(key)
        redisDeleted = result > 0
      }

      return memoryDeleted || redisDeleted
    } catch (error) {
      console.error('Erro ao remover do cache:', error)
      return false
    }
  }

  /**
   * Armazena metadados de chunk
   */
  async setChunkMetadata(chunkId: string, metadata: ChunkMetadata): Promise<void> {
    const key = `chunk:${chunkId}`
    await this.set(key, metadata, 7200) // 2 horas
  }

  /**
   * Recupera metadados de chunk
   */
  async getChunkMetadata(chunkId: string): Promise<ChunkMetadata | null> {
    const key = `chunk:${chunkId}`
    return await this.get<ChunkMetadata>(key)
  }

  /**
   * Armazena metadados de arquivo
   */
  async setFileMetadata(fileId: string, metadata: FileMetadata): Promise<void> {
    const key = `file:${fileId}`
    await this.set(key, metadata, 86400) // 24 horas
  }

  /**
   * Recupera metadados de arquivo
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    const key = `file:${fileId}`
    return await this.get<FileMetadata>(key)
  }

  /**
   * Armazena dados de chunk
   */
  async setChunkData(chunkId: string, data: ArrayBuffer): Promise<void> {
    try {
      const key = `chunk_data:${chunkId}`
      const base64Data = this.arrayBufferToBase64(data)
      await this.set(key, base64Data, 3600) // 1 hora
    } catch (error) {
      console.error('Erro ao armazenar dados do chunk:', error)
    }
  }

  /**
   * Recupera dados de chunk
   */
  async getChunkData(chunkId: string): Promise<ArrayBuffer | null> {
    try {
      const key = `chunk_data:${chunkId}`
      const base64Data = await this.get<string>(key)
      
      if (base64Data) {
        return this.base64ToArrayBuffer(base64Data)
      }
      
      return null
    } catch (error) {
      console.error('Erro ao recuperar dados do chunk:', error)
      return null
    }
  }

  /**
   * Armazena chunk (alias para setChunkData)
   */
  async storeChunk(chunkId: string, data: Uint8Array): Promise<void> {
    await this.setChunkData(chunkId, data.buffer)
  }

  /**
   * Recupera chunk (alias para getChunkData)
   */
  async getChunk(chunkId: string): Promise<Uint8Array | null> {
    const arrayBuffer = await this.getChunkData(chunkId)
    return arrayBuffer ? new Uint8Array(arrayBuffer) : null
  }

  /**
   * Armazena resultado de validação
   */
  async setValidationResult(fileId: string, result: any): Promise<void> {
    const key = `validation:${fileId}`
    await this.set(key, result, 86400) // 24 horas
  }

  /**
   * Recupera resultado de validação
   */
  async getValidationResult(fileId: string): Promise<any | null> {
    const key = `validation:${fileId}`
    return await this.get(key)
  }

  /**
   * Armazena resultado de análise
   */
  async setAnalysisResult(fileId: string, result: any): Promise<void> {
    const key = `analysis:${fileId}`
    await this.set(key, result, 86400) // 24 horas
  }

  /**
   * Recupera resultado de análise
   */
  async getAnalysisResult(fileId: string): Promise<any | null> {
    const key = `analysis:${fileId}`
    return await this.get(key)
  }

  /**
   * Lista todos os chunks de um upload
   */
  async getUploadChunks(uploadId: string): Promise<ChunkMetadata[]> {
    const chunks: ChunkMetadata[] = []
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (key.startsWith('chunk:')) {
        try {
          const metadata = await this.deserializeValue<ChunkMetadata>(entry.value)
          if (metadata.uploadId === uploadId) {
            chunks.push(metadata)
          }
        } catch (error) {
          console.error('Erro ao processar chunk:', error)
        }
      }
    }
    
    // Ordenar por índice
    return chunks.sort((a, b) => a.index - b.index)
  }

  /**
   * Remove todos os dados relacionados a um upload
   */
  async clearUploadData(uploadId: string): Promise<void> {
    const keysToDelete: string[] = []
    
    // Encontrar todas as chaves relacionadas ao upload
    for (const key of this.memoryCache.keys()) {
      if (key.includes(uploadId)) {
        keysToDelete.push(key)
      }
    }
    
    // Remover da memória
    for (const key of keysToDelete) {
      this.memoryCache.delete(key)
    }
    
    // Remover do Redis
    if (this.redisClient && keysToDelete.length > 0) {
      await this.redisClient.del(...keysToDelete)
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    this.stats.totalEntries = this.memoryCache.size
    this.stats.memoryUsage = this.calculateMemoryUsage()
    return { ...this.stats }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    
    if (this.redisClient) {
      await this.redisClient.flushall()
    }
    
    this.resetStats()
  }

  /**
   * Força limpeza de entradas expiradas
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      this.memoryCache.delete(key)
      this.stats.evictions++
    }
  }

  // Métodos privados
  private async initializeRedis(): Promise<void> {
    if (!this.config.redisUrl) return
    
    try {
      // Simular conexão Redis (substituir por implementação real)
      console.log('Redis connection simulated')
    } catch (error) {
      console.error('Erro ao conectar com Redis:', error)
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  private updateStats(operation: 'hit' | 'miss' | 'set', size?: number): void {
    if (operation === 'hit') {
      this.stats.hitRate = (this.stats.hitRate + 1) / 2
    } else if (operation === 'miss') {
      this.stats.missRate = (this.stats.missRate + 1) / 2
    }
    
    if (size) {
      this.stats.memoryUsage += size
    }
  }

  private updateCompressionRatio(originalSize: number, compressedSize: number): void {
    const ratio = originalSize / compressedSize
    this.stats.compressionRatio = (this.stats.compressionRatio + ratio) / 2
  }

  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      memoryUsage: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      compressionRatio: 1
    }
  }
}

export const cacheService = CacheService.getInstance()
export default cacheService