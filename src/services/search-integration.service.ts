export interface SearchSuggestion {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  relevanceScore: number
  thumbnailUrl?: string
  templateUrl?: string
  metadata: {
    slideCount: number
    duration: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    language: string
    lastUpdated: string
  }
}

export interface ContentAnalysis {
  topics: string[]
  keywords: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  complexity: 'low' | 'medium' | 'high'
  suggestedCategories: string[]
  estimatedDuration: number // em minutos
}

export interface SimilarContent {
  id: string
  title: string
  similarity: number
  type: 'template' | 'presentation' | 'course'
  url: string
}

class SearchIntegrationService {
  private static instance: SearchIntegrationService
  private searchCache = new Map<string, SearchSuggestion[]>()
  private analysisCache = new Map<string, ContentAnalysis>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutos
  private readonly API_BASE_URL = '/api/search'

  static getInstance(): SearchIntegrationService {
    if (!SearchIntegrationService.instance) {
      SearchIntegrationService.instance = new SearchIntegrationService()
    }
    return SearchIntegrationService.instance
  }

  /**
   * Analisa o conteúdo de um arquivo PPTX e extrai informações relevantes
   */
  async analyzeContent(file: File): Promise<ContentAnalysis> {
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`
    
    // Verificar cache
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('analysisType', 'content')

      const response = await fetch(`${this.API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erro na análise: ${response.statusText}`)
      }

      const analysis: ContentAnalysis = await response.json()
      
      // Armazenar no cache
      this.analysisCache.set(cacheKey, analysis)
      
      // Limpar cache após o tempo limite
      setTimeout(() => {
        this.analysisCache.delete(cacheKey)
      }, this.CACHE_DURATION)

      return analysis
    } catch (error) {
      console.error('Erro ao analisar conteúdo:', error)
      
      // Retornar análise básica em caso de erro
      return this.generateBasicAnalysis(file)
    }
  }

  /**
   * Busca sugestões baseadas no conteúdo analisado
   */
  async getSuggestions(
    analysis: ContentAnalysis,
    options: {
      maxResults?: number
      categories?: string[]
      minRelevance?: number
      includeTemplates?: boolean
      includePresentations?: boolean
    } = {}
  ): Promise<SearchSuggestion[]> {
    const {
      maxResults = 10,
      categories = [],
      minRelevance = 0.3,
      includeTemplates = true,
      includePresentations = true
    } = options

    const cacheKey = this.generateCacheKey(analysis, options)
    
    // Verificar cache
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!
    }

    try {
      const searchParams = new URLSearchParams({
        topics: analysis.topics.join(','),
        keywords: analysis.keywords.join(','),
        categories: [...analysis.suggestedCategories, ...categories].join(','),
        complexity: analysis.complexity,
        maxResults: maxResults.toString(),
        minRelevance: minRelevance.toString(),
        includeTemplates: includeTemplates.toString(),
        includePresentations: includePresentations.toString()
      })

      const response = await fetch(`${this.API_BASE_URL}/suggestions?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.statusText}`)
      }

      const suggestions: SearchSuggestion[] = await response.json()
      
      // Filtrar por relevância mínima
      const filteredSuggestions = suggestions.filter(
        suggestion => suggestion.relevanceScore >= minRelevance
      )
      
      // Ordenar por relevância
      filteredSuggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
      
      // Limitar resultados
      const limitedSuggestions = filteredSuggestions.slice(0, maxResults)
      
      // Armazenar no cache
      this.searchCache.set(cacheKey, limitedSuggestions)
      
      // Limpar cache após o tempo limite
      setTimeout(() => {
        this.searchCache.delete(cacheKey)
      }, this.CACHE_DURATION)

      return limitedSuggestions
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      
      // Retornar sugestões simuladas em caso de erro
      return this.generateMockSuggestions(analysis)
    }
  }

  /**
   * Busca conteúdo similar baseado em um arquivo
   */
  async findSimilarContent(
    file: File,
    options: {
      maxResults?: number
      minSimilarity?: number
      contentTypes?: ('template' | 'presentation' | 'course')[]
    } = {}
  ): Promise<SimilarContent[]> {
    const {
      maxResults = 5,
      minSimilarity = 0.5,
      contentTypes = ['template', 'presentation', 'course']
    } = options

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('maxResults', maxResults.toString())
      formData.append('minSimilarity', minSimilarity.toString())
      formData.append('contentTypes', contentTypes.join(','))

      const response = await fetch(`${this.API_BASE_URL}/similar`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erro na busca de similaridade: ${response.statusText}`)
      }

      const similarContent: SimilarContent[] = await response.json()
      
      return similarContent.filter(content => content.similarity >= minSimilarity)
    } catch (error) {
      console.error('Erro ao buscar conteúdo similar:', error)
      return []
    }
  }

  /**
   * Busca sugestões de templates baseadas em palavras-chave
   */
  async searchTemplates(
    query: string,
    filters: {
      category?: string
      difficulty?: 'beginner' | 'intermediate' | 'advanced'
      language?: string
      maxResults?: number
    } = {}
  ): Promise<SearchSuggestion[]> {
    const {
      category,
      difficulty,
      language = 'pt',
      maxResults = 20
    } = filters

    try {
      const searchParams = new URLSearchParams({
        q: query,
        type: 'template',
        language,
        maxResults: maxResults.toString()
      })

      if (category) searchParams.append('category', category)
      if (difficulty) searchParams.append('difficulty', difficulty)

      const response = await fetch(`${this.API_BASE_URL}/templates?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`Erro na busca de templates: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      return this.generateMockTemplates(query)
    }
  }

  /**
   * Obtém sugestões automáticas baseadas no histórico do usuário
   */
  async getPersonalizedSuggestions(
    userId: string,
    options: {
      maxResults?: number
      includeRecent?: boolean
      includeFavorites?: boolean
      includeRecommended?: boolean
    } = {}
  ): Promise<SearchSuggestion[]> {
    const {
      maxResults = 15,
      includeRecent = true,
      includeFavorites = true,
      includeRecommended = true
    } = options

    try {
      const searchParams = new URLSearchParams({
        userId,
        maxResults: maxResults.toString(),
        includeRecent: includeRecent.toString(),
        includeFavorites: includeFavorites.toString(),
        includeRecommended: includeRecommended.toString()
      })

      const response = await fetch(`${this.API_BASE_URL}/personalized?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`Erro nas sugestões personalizadas: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter sugestões personalizadas:', error)
      return []
    }
  }

  /**
   * Registra uma interação do usuário para melhorar as sugestões
   */
  async recordInteraction(
    userId: string,
    suggestionId: string,
    action: 'view' | 'download' | 'like' | 'share' | 'use_template'
  ): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          suggestionId,
          action,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Erro ao registrar interação:', error)
    }
  }

  /**
   * Limpa todos os caches
   */
  clearCache(): void {
    this.searchCache.clear()
    this.analysisCache.clear()
  }

  // Métodos privados
  private generateCacheKey(analysis: ContentAnalysis, options: any): string {
    return `${analysis.topics.join('_')}_${analysis.keywords.join('_')}_${JSON.stringify(options)}`
  }

  private generateBasicAnalysis(file: File): ContentAnalysis {
    const fileName = file.name.toLowerCase()
    const topics: string[] = []
    const keywords: string[] = []
    
    // Extrair palavras-chave do nome do arquivo
    const words = fileName.replace(/\.[^/.]+$/, '').split(/[\s_-]+/)
    keywords.push(...words.filter(word => word.length > 2))
    
    // Categorias baseadas no nome
    if (fileName.includes('apresenta') || fileName.includes('present')) {
      topics.push('apresentação')
    }
    if (fileName.includes('relator') || fileName.includes('report')) {
      topics.push('relatório')
    }
    if (fileName.includes('treinamento') || fileName.includes('training')) {
      topics.push('treinamento')
    }
    
    return {
      topics,
      keywords,
      sentiment: 'neutral',
      complexity: 'medium',
      suggestedCategories: topics.length > 0 ? topics : ['geral'],
      estimatedDuration: 15 // duração padrão
    }
  }

  private generateMockSuggestions(analysis: ContentAnalysis): SearchSuggestion[] {
    const mockSuggestions: SearchSuggestion[] = [
      {
        id: 'mock_1',
        title: 'Template Profissional Moderno',
        description: 'Template limpo e profissional para apresentações corporativas',
        category: 'business',
        tags: ['profissional', 'moderno', 'corporativo'],
        relevanceScore: 0.8,
        thumbnailUrl: '/templates/professional-modern.jpg',
        templateUrl: '/templates/professional-modern.pptx',
        metadata: {
          slideCount: 25,
          duration: '20-30 min',
          difficulty: 'intermediate',
          language: 'pt',
          lastUpdated: '2024-01-15'
        }
      },
      {
        id: 'mock_2',
        title: 'Apresentação de Resultados',
        description: 'Template ideal para apresentar resultados e métricas',
        category: 'analytics',
        tags: ['resultados', 'métricas', 'dados'],
        relevanceScore: 0.7,
        thumbnailUrl: '/templates/results-presentation.jpg',
        templateUrl: '/templates/results-presentation.pptx',
        metadata: {
          slideCount: 15,
          duration: '15-20 min',
          difficulty: 'beginner',
          language: 'pt',
          lastUpdated: '2024-01-10'
        }
      }
    ]
    
    // Filtrar por relevância com base na análise
    return mockSuggestions.filter(suggestion => {
      const hasMatchingTopic = analysis.topics.some(topic => 
        suggestion.tags.some(tag => tag.includes(topic) || topic.includes(tag))
      )
      const hasMatchingKeyword = analysis.keywords.some(keyword => 
        suggestion.tags.some(tag => tag.includes(keyword) || keyword.includes(tag))
      )
      
      return hasMatchingTopic || hasMatchingKeyword
    })
  }

  private generateMockTemplates(query: string): SearchSuggestion[] {
    const templates: SearchSuggestion[] = [
      {
        id: 'template_1',
        title: `Template para ${query}`,
        description: `Template personalizado baseado em: ${query}`,
        category: 'custom',
        tags: query.split(' '),
        relevanceScore: 0.9,
        metadata: {
          slideCount: 20,
          duration: '15-25 min',
          difficulty: 'intermediate',
          language: 'pt',
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      }
    ]
    
    return templates
  }
}

export const searchIntegrationService = SearchIntegrationService.getInstance()
export default searchIntegrationService