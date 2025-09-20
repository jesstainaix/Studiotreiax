import { AIAnalysisResult } from '../lib/ai/vision-analysis'

interface CacheEntry {
  result: AIAnalysisResult
  timestamp: number
  fileHash: string
  fileSize: number
}

interface CacheStats {
  totalEntries: number
  cacheHits: number
  cacheMisses: number
  lastCleanup: number
}

class AIAnalysisCache {
  private cache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    totalEntries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastCleanup: Date.now()
  }
  
  // Cache expiration time: 24 hours
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000
  // Maximum cache entries
  private readonly MAX_CACHE_SIZE = 100
  // Cleanup interval: 1 hour
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000

  constructor() {
    this.loadFromLocalStorage()
    this.scheduleCleanup()
  }

  /**
   * Generate a unique cache key for a file
   */
  private generateCacheKey(file: File): string {
    // Use file name, size, and last modified date to create a unique key
    const fileInfo = `${file.name}-${file.size}-${file.lastModified}`
    return btoa(fileInfo).replace(/[+/=]/g, '')
  }

  /**
   * Generate a simple hash for file content validation
   */
  private async generateFileHash(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.warn('Failed to generate file hash, using fallback:', error)
      // Fallback: use file properties
      return `${file.name}-${file.size}-${file.lastModified}`
    }
  }

  /**
   * Check if analysis result exists in cache
   */
  async has(file: File): Promise<boolean> {
    const key = this.generateCacheKey(file)
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.cacheMisses++
      return false
    }

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(key)
      this.stats.cacheMisses++
      return false
    }

    // Validate file hasn't changed
    const currentHash = await this.generateFileHash(file)
    if (entry.fileHash !== currentHash || entry.fileSize !== file.size) {
      this.cache.delete(key)
      this.stats.cacheMisses++
      return false
    }

    this.stats.cacheHits++
    return true
  }

  /**
   * Get cached analysis result
   */
  async get(file: File): Promise<AIAnalysisResult | null> {
    const key = this.generateCacheKey(file)
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Double-check validity
    if (await this.has(file)) {
      return entry.result
    }
    
    return null
  }

  /**
   * Store analysis result in cache
   */
  async set(file: File, result: AIAnalysisResult): Promise<void> {
    const key = this.generateCacheKey(file)
    const fileHash = await this.generateFileHash(file)
    
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      fileHash,
      fileSize: file.size
    }
    
    this.cache.set(key, entry)
    this.stats.totalEntries = this.cache.size
    
    // Check if we need to evict old entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldEntries()
    }
    
    this.saveToLocalStorage()
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      totalEntries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastCleanup: Date.now()
    }
    this.saveToLocalStorage()
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(key)
      }
    }
    
    this.stats.totalEntries = this.cache.size
    this.stats.lastCleanup = now
    this.saveToLocalStorage()
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldEntries(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    const toRemove = Math.ceil(this.MAX_CACHE_SIZE * 0.2) // Remove 20% of entries
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }
    
    this.stats.totalEntries = this.cache.size
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    setInterval(() => {
      this.cleanup()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('ai-analysis-cache')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.cache && data.stats) {
          this.cache = new Map(data.cache)
          this.stats = data.stats
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats
      }
      localStorage.setItem('ai-analysis-cache', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error)
    }
  }
}

// Export singleton instance
export const aiAnalysisCache = new AIAnalysisCache()
export default aiAnalysisCache
export type { AIAnalysisResult, CacheStats }