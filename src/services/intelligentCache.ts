import type { SlideContent } from '../types/pptx'
import { EnhancedQualityMetrics, DetailedMetrics } from './enhancedQualityMetrics'
import { SmartSuggestion, ContextualAnalysis } from './smartSuggestionsEngine'
import { SemanticNRResult } from './semanticNRDetection'

export interface CacheEntry {
  id: string
  contentHash: string
  timestamp: number
  lastAccessed: number
  accessCount: number
  data: any
  type: 'quality' | 'suggestions' | 'nr-detection' | 'full-analysis'
  expiresAt: number
  similarity?: number
  tags: string[]
}

export interface CacheAnalytics {
  hitRate: number
  missRate: number
  totalRequests: number
  totalHits: number
  totalMisses: number
  averageResponseTime: number
  cacheSize: number
  oldestEntry: number
  newestEntry: number
}

export interface SimilarityMatch {
  cacheId: string
  similarity: number
  partiallyUsable: boolean
  adaptationRequired: string[]
}

class IntelligentCacheService {
  private static instance: IntelligentCacheService
  private cache: Map<string, CacheEntry> = new Map()
  private analytics: CacheAnalytics = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    averageResponseTime: 0,
    cacheSize: 0,
    oldestEntry: 0,
    newestEntry: 0
  }
  
  private readonly maxCacheSize = 100
  private readonly defaultTTL = 24 * 60 * 60 * 1000 // 24 horas
  private readonly similarityThreshold = 0.8

  static getInstance(): IntelligentCacheService {
    if (!IntelligentCacheService.instance) {
      IntelligentCacheService.instance = new IntelligentCacheService()
    }
    return IntelligentCacheService.instance
  }

  /**
   * Busca por dados em cache com análise de similaridade
   */
  async get<T>(
    slides: SlideContent[],
    type: CacheEntry['type'],
    options: { allowSimilar?: boolean, maxAge?: number } = {}
  ): Promise<{
    data: T | null
    cacheHit: boolean
    similarity?: number
    fromCache: boolean
    adaptationSuggestions?: string[]
  }> {
    const startTime = Date.now()
    this.analytics.totalRequests++

    try {
      const contentHash = this.generateContentHash(slides)
      const exactMatch = this.findExactMatch(contentHash, type, options.maxAge)

      if (exactMatch) {
        this.recordCacheHit(exactMatch, Date.now() - startTime)
        return {
          data: exactMatch.data,
          cacheHit: true,
          fromCache: true,
          similarity: 1.0
        }
      }

      // Busca por similaridade se permitido
      if (options.allowSimilar) {
        const similarMatch = await this.findSimilarMatch(slides, type, options.maxAge)
        
        if (similarMatch && similarMatch.similarity >= this.similarityThreshold) {
          this.recordCacheHit(this.cache.get(similarMatch.cacheId)!, Date.now() - startTime)
          
          return {
            data: await this.adaptCachedData(similarMatch, slides),
            cacheHit: true,
            fromCache: true,
            similarity: similarMatch.similarity,
            adaptationSuggestions: similarMatch.adaptationRequired
          }
        }
      }

      this.recordCacheMiss(Date.now() - startTime)
      return {
        data: null,
        cacheHit: false,
        fromCache: false
      }

    } catch (error) {
      console.error('❌ Erro na busca em cache:', error)
      this.recordCacheMiss(Date.now() - startTime)
      return {
        data: null,
        cacheHit: false,
        fromCache: false
      }
    }
  }

  /**
   * Armazena dados no cache com metadados inteligentes
   */
  async set<T>(
    slides: SlideContent[],
    type: CacheEntry['type'],
    data: T,
    options: { ttl?: number, tags?: string[] } = {}
  ): Promise<void> {
    try {
      const contentHash = this.generateContentHash(slides)
      const now = Date.now()
      const ttl = options.ttl || this.defaultTTL

      const entry: CacheEntry = {
        id: this.generateEntryId(),
        contentHash,
        timestamp: now,
        lastAccessed: now,
        accessCount: 1,
        data,
        type,
        expiresAt: now + ttl,
        tags: options.tags || this.generateTags(slides),
      }

      // Verificar se precisa fazer limpeza do cache
      if (this.cache.size >= this.maxCacheSize) {
        await this.evictLeastUseful()
      }

      this.cache.set(entry.id, entry)
    } catch (error) {
      console.error('❌ Erro ao armazenar no cache:', error)
      throw error
    }
  }

  /**
   * Gera hash do conteúdo para identificação única
   */
  private generateContentHash(slides: SlideContent[]): string {
    const content = JSON.stringify(slides)
    
    // Hash simples baseado no conteúdo
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Converte para 32bit
    }
    return Math.abs(hash).toString(36)
  }

  private findExactMatch(
    contentHash: string,
    type: CacheEntry['type'],
    maxAge?: number
  ): CacheEntry | null {
    const now = Date.now()
    
    for (const entry of this.cache.values()) {
      if (entry.contentHash === contentHash && 
          entry.type === type && 
          entry.expiresAt > now &&
          (!maxAge || (now - entry.timestamp) <= maxAge)) {
        return entry
      }
    }
    
    return null
  }

  private async findSimilarMatch(
    slides: SlideContent[],
    type: CacheEntry['type'],
    maxAge?: number
  ): Promise<SimilarityMatch | null> {
    const targetFeatures = this.extractContentFeatures(slides)
    let bestMatch: SimilarityMatch | null = null
    let bestSimilarity = 0

    for (const entry of this.cache.values()) {
      if (entry.type === type && 
          entry.expiresAt > Date.now() &&
          (!maxAge || (Date.now() - entry.timestamp) <= maxAge)) {
        
        const cachedSlides = this.extractSlidesFromEntry(entry)
        if (cachedSlides) {
          const similarity = this.calculateSimilarity(targetFeatures, this.extractContentFeatures(cachedSlides))
          
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestMatch = {
              cacheId: entry.id,
              similarity,
              partiallyUsable: similarity >= 0.6,
              adaptationRequired: this.calculateAdaptationRequirements(targetFeatures, cachedSlides)
            }
          }
        }
      }
    }

    return bestMatch
  }

  private extractContentFeatures(slides: SlideContent[]): {
    slideCount: number
    avgWordsPerSlide: number
    hasImages: boolean
    hasCharts: boolean
    topKeywords: string[]
    complexity: number
  } {
    const totalWords = slides.reduce((sum, slide) => 
      sum + slide.content.split(/\s+/).length, 0
    )
    
    const allText = slides.map(s => s.content).join(' ').toLowerCase()
    const words = allText.split(/\s+/).filter(w => w.length > 3)
    const wordFreq = new Map<string, number>()
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })
    
    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    return {
      slideCount: slides.length,
      avgWordsPerSlide: totalWords / slides.length,
      hasImages: slides.some(s => (s.images?.length || 0) > 0),
      hasCharts: slides.some(s => (s.charts?.length || 0) > 0),
      topKeywords,
      complexity: this.calculateComplexityScore(slides)
    }
  }

  private calculateSimilarity(features1: any, features2: any): number {
    let similarity = 0
    let factors = 0

    // Similaridade no número de slides
    const slideDiff = Math.abs(features1.slideCount - features2.slideCount) / Math.max(features1.slideCount, features2.slideCount)
    similarity += (1 - slideDiff) * 0.2
    factors += 0.2

    // Similaridade na densidade de palavras
    const wordDiff = Math.abs(features1.avgWordsPerSlide - features2.avgWordsPerSlide) / Math.max(features1.avgWordsPerSlide, features2.avgWordsPerSlide)
    similarity += (1 - wordDiff) * 0.2
    factors += 0.2

    // Similaridade em elementos visuais
    if (features1.hasImages === features2.hasImages) similarity += 0.15
    if (features1.hasCharts === features2.hasCharts) similarity += 0.15
    factors += 0.3

    // Similaridade em keywords
    const keywordOverlap = this.calculateKeywordOverlap(features1.topKeywords, features2.topKeywords)
    similarity += keywordOverlap * 0.3
    factors += 0.3

    return similarity / factors
  }

  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  private async adaptCachedData(match: SimilarityMatch, newSlides: SlideContent[]): Promise<any> {
    const cachedEntry = this.cache.get(match.cacheId)
    if (!cachedEntry) return null

    // Adaptação baseada no tipo de dados
    let adaptedData = { ...cachedEntry.data }

    // Adaptar dados baseado na similaridade e mudanças necessárias
    if (match.similarity < 0.9) {
      if (cachedEntry.type === 'quality') {
        // Ajustar métricas baseado nas diferenças
        adaptedData = this.adaptQualityMetrics(adaptedData, match.adaptationRequired)
      } else if (cachedEntry.type === 'suggestions') {
        // Filtrar sugestões menos relevantes
        adaptedData = this.adaptSuggestions(adaptedData, match.adaptationRequired)
      }
    }

    return adaptedData
  }

  private adaptQualityMetrics(data: any, adaptationRequired: string[]): any {
    const adapted = { ...data }
    
    // Aplicar pequenos ajustes baseado nas diferenças
    if (adaptationRequired.includes('word-count-difference')) {
      adapted.metrics.textQuality *= 0.95 // Pequeno ajuste
    }
    
    if (adaptationRequired.includes('visual-elements-difference')) {
      adapted.metrics.visualQuality *= 0.9
    }

    return adapted
  }

  private adaptSuggestions(data: any, adaptationRequired: string[]): any {
    const adapted = { ...data }
    
    // Filtrar sugestões menos relevantes para o novo contexto
    if (adapted.suggestions) {
      adapted.suggestions = adapted.suggestions.filter((suggestion: SmartSuggestion) => {
        return !adaptationRequired.some(req => 
          suggestion.category.includes(req.split('-')[0])
        )
      })
    }

    return adapted
  }

  private calculateAdaptationRequirements(targetFeatures: any, cachedSlides: SlideContent[]): string[] {
    const requirements: string[] = []
    const cachedFeatures = this.extractContentFeatures(cachedSlides)

    if (Math.abs(targetFeatures.slideCount - cachedFeatures.slideCount) > 2) {
      requirements.push('slide-count-difference')
    }

    if (Math.abs(targetFeatures.avgWordsPerSlide - cachedFeatures.avgWordsPerSlide) > 20) {
      requirements.push('word-count-difference')
    }

    if (targetFeatures.hasImages !== cachedFeatures.hasImages) {
      requirements.push('visual-elements-difference')
    }

    if (targetFeatures.hasCharts !== cachedFeatures.hasCharts) {
      requirements.push('chart-elements-difference')
    }

    return requirements
  }

  private extractSlidesFromEntry(entry: CacheEntry): SlideContent[] | null {
    // Simplificado - em implementação real, precisaríamos armazenar os slides originais
    return null
  }

  private calculateComplexityScore(slides: SlideContent[]): number {
    let complexity = 0
    
    slides.forEach(slide => {
      complexity += slide.content.split(/\s+/).length * 0.1
      complexity += (slide.images?.length || 0) * 0.5
      complexity += (slide.charts?.length || 0) * 0.8
      complexity += (slide.animations?.length || 0) * 0.3
    })
    
    return complexity / slides.length
  }

  private generateTags(slides: SlideContent[]): string[] {
    const tags: string[] = []
    const allText = slides.map(s => s.content).join(' ').toLowerCase()

    // Tags baseadas em conteúdo
    if (allText.includes('nr-') || allText.includes('norma')) tags.push('nr-compliance')
    if (allText.includes('segurança') || allText.includes('safety')) tags.push('safety')
    if (allText.includes('treinamento') || allText.includes('training')) tags.push('training')
    if (allText.includes('epi') || allText.includes('equipamento')) tags.push('ppe')

    // Tags baseadas em estrutura
    if (slides.length <= 10) tags.push('short-presentation')
    else if (slides.length <= 30) tags.push('medium-presentation')
    else tags.push('long-presentation')

    // Tags baseadas em elementos
    if (slides.some(s => (s.images?.length || 0) > 0)) tags.push('has-images')
    if (slides.some(s => (s.charts?.length || 0) > 0)) tags.push('has-charts')

    return tags
  }

  private async evictLeastUseful(): Promise<void> {
    const entries = Array.from(this.cache.values())
    
    // Ordenar por utilidade (combinação de acesso e idade)
    entries.sort((a, b) => {
      const utilityA = a.accessCount / (Date.now() - a.timestamp)
      const utilityB = b.accessCount / (Date.now() - b.timestamp)
      return utilityA - utilityB
    })

    // Remover os 10% menos úteis
    const toRemove = Math.ceil(entries.length * 0.1)
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i].id)
    }
  }

  private generateEntryId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private recordCacheHit(entry: CacheEntry, responseTime: number): void {
    entry.lastAccessed = Date.now()
    entry.accessCount++
    
    this.analytics.totalHits++
    this.updateAnalytics()
  }

  private recordCacheMiss(responseTime: number): void {
    this.analytics.totalMisses++
    this.updateAnalytics()
  }

  private updateAnalytics(): void {
    const total = this.analytics.totalHits + this.analytics.totalMisses
    if (total > 0) {
      this.analytics.hitRate = this.analytics.totalHits / total
      this.analytics.missRate = this.analytics.totalMisses / total
    }
    this.analytics.totalRequests = total
    this.analytics.cacheSize = this.cache.size

    const entries = Array.from(this.cache.values())
    if (entries.length > 0) {
      this.analytics.oldestEntry = Math.min(...entries.map(e => e.timestamp))
      this.analytics.newestEntry = Math.max(...entries.map(e => e.timestamp))
    }
  }

  private calculateAccessThreshold(): number {
    const entries = Array.from(this.cache.values())
    if (entries.length === 0) return 1

    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    return totalAccess / entries.length
  }

  private getAffectedTags(changeType: string): string[] {
    switch (changeType) {
      case 'content':
        return ['nr-compliance', 'safety', 'training', 'ppe']
      case 'structure':
        return ['short-presentation', 'medium-presentation', 'long-presentation']
      case 'style':
        return ['has-images', 'has-charts']
      case 'metadata':
        return [] // Metadata changes don't affect analysis cache
      default:
        return []
    }
  }

  private async findPotentialMatches(features: any): Promise<{ id: string }[]> {
    // Implementação simplificada de busca preditiva
    return []
  }

  private async warmupCache(matchId: string, slides: SlideContent[]): Promise<void> {
    try {
      // Implementação simplificada de warm-up
      const features = this.extractContentFeatures(slides)
      
      // Pre-carregar análises relacionadas
      const relatedEntries = Array.from(this.cache.values())
        .filter(entry => {
          const entryFeatures = this.extractContentFeatures(this.extractSlidesFromEntry(entry) || [])
          return this.calculateSimilarity(features, entryFeatures) > 0.5
        })
        .slice(0, 5)
      
      // Atualizar prioridade dos entries relacionados
      relatedEntries.forEach(entry => {
        entry.lastAccessed = Date.now()
        entry.accessCount++
      })
      
      console.log(`🔥 Cache warm-up concluído para ${relatedEntries.length} entradas relacionadas`)
    } catch (error) {
      console.error('❌ Erro no warm-up do cache:', error)
    }
  }
}

// Exportar instância singleton
export const intelligentCacheService = IntelligentCacheService.getInstance()
export default intelligentCacheService