import type { SlideContent } from '../types/pptx'

export interface EnhancedQualityMetrics {
  // Métricas básicas existentes
  textQuality: number
  visualQuality: number
  structureQuality: number
  accessibilityScore: number
  overallScore: number

  // Novas métricas avançadas
  readabilityScore: number          // Índice de legibilidade Flesch-Kincaid
  visualHierarchy: number           // Qualidade da hierarquia visual
  contentConsistency: number        // Consistência entre slides
  engagementPotential: number       // Potencial de engajamento
  learningEffectiveness: number     // Eficácia pedagógica
  cognitiveLoad: number             // Carga cognitiva
  informationDensity: number        // Densidade de informação
  narrativeFlow: number             // Fluxo narrativo
  interactivityScore: number        // Potencial de interatividade
}

export interface DetailedMetrics {
  slide: number
  metrics: {
    wordCount: number
    sentenceCount: number
    avgWordsPerSentence: number
    complexWords: number
    readabilityIndex: number
    visualElements: number
    colorContrast: number
    fontSizes: number[]
    textToVisualRatio: number
    cognitiveComplexity: number
  }
  issues: Array<{
    type: 'readability' | 'visual' | 'accessibility' | 'structure'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    suggestion: string
  }>
}

export interface ReadabilityAnalysis {
  fleschKincaidGrade: number
  fleschReadingEase: number
  colemanLiauIndex: number
  automatedReadabilityIndex: number
  averageGrade: number
  difficulty: 'very easy' | 'easy' | 'fairly easy' | 'standard' | 'fairly difficult' | 'difficult' | 'very difficult'
  recommendedAge: number
}

export interface VisualHierarchyAnalysis {
  headingStructure: {
    h1Count: number
    h2Count: number
    h3Count: number
    maxDepth: number
    consistentSizing: boolean
  }
  colorUsage: {
    primaryColors: string[]
    colorConsistency: number
    contrastRatio: number
    accessibilityCompliant: boolean
  }
  spacing: {
    consistent: boolean
    whiteSpaceRatio: number
    elementDensity: number
  }
}

export interface ContentConsistencyAnalysis {
  styleConsistency: number
  terminologyConsistency: number
  structuralConsistency: number
  formatConsistency: number
  inconsistencies: Array<{
    type: 'style' | 'terminology' | 'structure' | 'format'
    slides: number[]
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export interface EngagementAnalysis {
  visualInterest: number
  contentVariety: number
  interactiveElements: number
  storytellingScore: number
  questionPrompts: number
  callsToAction: number
  engagementFactors: Array<{
    factor: string
    present: boolean
    impact: 'low' | 'medium' | 'high'
  }>
}

export interface LearningEffectivenessAnalysis {
  objectiveClarity: number
  progressiveComplexity: number
  reinforcement: number
  practicalApplications: number
  assessmentOpportunities: number
  learningStrategies: Array<{
    strategy: string
    present: boolean
    effectiveness: number
  }>
}

class EnhancedQualityMetricsService {
  private static instance: EnhancedQualityMetricsService

  static getInstance(): EnhancedQualityMetricsService {
    if (!EnhancedQualityMetricsService.instance) {
      EnhancedQualityMetricsService.instance = new EnhancedQualityMetricsService()
    }
    return EnhancedQualityMetricsService.instance
  }

  /**
   * Analisa a qualidade geral do conteúdo PPTX
   */
  async analyzeQuality(slides: SlideContent[]): Promise<{
    metrics: EnhancedQualityMetrics
    detailed: DetailedMetrics[]
    recommendations: string[]
  }> {
    try {
      const detailed = await this.analyzeDetailedMetrics(slides)
      const metrics = this.calculateEnhancedMetrics(detailed)
      const recommendations = this.generateRecommendations(metrics, detailed)

      return {
        metrics,
        detailed,
        recommendations
      }
    } catch (error) {
      console.error('❌ Erro na análise de qualidade:', error)
      throw error
    }
  }

  private async analyzeDetailedMetrics(slides: SlideContent[]): Promise<DetailedMetrics[]> {
    return slides.map((slide, index) => {
      const text = slide.content || ''
      const words = text.split(/\s+/).filter(w => w.length > 0)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
      
      return {
        slide: index + 1,
        metrics: {
          wordCount: words.length,
          sentenceCount: sentences.length,
          avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
          complexWords: this.countComplexWords(words),
          readabilityIndex: this.calculateReadabilityIndex(text),
          visualElements: (slide.images?.length || 0) + (slide.charts?.length || 0),
          colorContrast: this.analyzeColorContrast(slide),
          fontSizes: this.extractFontSizes(slide),
          textToVisualRatio: this.calculateTextToVisualRatio(slide),
          cognitiveComplexity: this.calculateCognitiveComplexity(slide)
        },
        issues: this.identifyIssues(slide, index + 1)
      }
    })
  }

  private calculateEnhancedMetrics(detailed: DetailedMetrics[]): EnhancedQualityMetrics {
    const avgMetrics = this.calculateAverageMetrics(detailed)
    
    return {
      textQuality: this.calculateTextQuality(detailed),
      visualQuality: this.calculateVisualQuality(detailed),
      structureQuality: this.calculateStructureQuality(detailed),
      accessibilityScore: this.calculateAccessibilityScore(detailed),
      overallScore: this.calculateOverallScore(detailed),
      readabilityScore: avgMetrics.readabilityIndex,
      visualHierarchy: this.calculateVisualHierarchy(detailed),
      contentConsistency: this.calculateContentConsistency(detailed),
      engagementPotential: this.calculateEngagementPotential(detailed),
      learningEffectiveness: this.calculateLearningEffectiveness(detailed),
      cognitiveLoad: avgMetrics.cognitiveComplexity,
      informationDensity: this.calculateInformationDensity(detailed),
      narrativeFlow: this.calculateNarrativeFlow(detailed),
      interactivityScore: this.calculateInteractivityScore(detailed)
    }
  }

  private countComplexWords(words: string[]): number {
    return words.filter(word => {
      const syllables = this.countSyllables(word)
      return syllables >= 3
    }).length
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    
    const vowels = 'aeiouy'
    let syllableCount = 0
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !previousWasVowel) {
        syllableCount++
      }
      previousWasVowel = isVowel
    }
    
    if (word.endsWith('e')) syllableCount--
    return Math.max(1, syllableCount)
  }

  private calculateReadabilityIndex(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0)
    
    if (sentences.length === 0 || words.length === 0) return 0
    
    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    return Math.max(0, Math.min(100, score))
  }

  private analyzeColorContrast(slide: SlideContent): number {
    // Simulação de análise de contraste
    return Math.random() * 40 + 60 // Score entre 60-100
  }

  private extractFontSizes(slide: SlideContent): number[] {
    // Simulação de extração de tamanhos de fonte
    return [12, 14, 16, 18, 24].filter(() => Math.random() > 0.5)
  }

  private calculateTextToVisualRatio(slide: SlideContent): number {
    const textLength = slide.content?.length || 0
    const visualElements = (slide.images?.length || 0) + (slide.charts?.length || 0)
    
    if (visualElements === 0) return textLength > 0 ? 100 : 0
    return textLength / (textLength + visualElements * 100)
  }

  private calculateCognitiveComplexity(slide: SlideContent): number {
    const text = slide.content || ''
    const words = text.split(/\s+/).length
    const visualElements = (slide.images?.length || 0) + (slide.charts?.length || 0)
    const animations = slide.animations?.length || 0
    
    // Fórmula simplificada de complexidade cognitiva
    return Math.min(100, (words * 0.1) + (visualElements * 5) + (animations * 3))
  }

  private identifyIssues(slide: SlideContent, slideNumber: number): DetailedMetrics['issues'] {
    const issues: DetailedMetrics['issues'] = []
    const text = slide.content || ''
    
    // Verificar legibilidade
    if (text.length > 500) {
      issues.push({
        type: 'readability',
        severity: 'medium',
        description: 'Slide com muito texto',
        suggestion: 'Considere dividir o conteúdo em múltiplos slides'
      })
    }
    
    // Verificar elementos visuais
    const visualElements = (slide.images?.length || 0) + (slide.charts?.length || 0)
    if (visualElements === 0 && text.length > 100) {
      issues.push({
        type: 'visual',
        severity: 'low',
        description: 'Slide sem elementos visuais',
        suggestion: 'Adicione imagens ou gráficos para melhorar o engajamento'
      })
    }
    
    return issues
  }

  private calculateAverageMetrics(detailed: DetailedMetrics[]): any {
    if (detailed.length === 0) return {}
    
    const sums = detailed.reduce((acc, slide) => {
      Object.keys(slide.metrics).forEach(key => {
        acc[key] = (acc[key] || 0) + (slide.metrics as any)[key]
      })
      return acc
    }, {} as any)
    
    Object.keys(sums).forEach(key => {
      sums[key] = sums[key] / detailed.length
    })
    
    return sums
  }

  private calculateTextQuality(detailed: DetailedMetrics[]): number {
    const avgReadability = detailed.reduce((sum, slide) => sum + slide.metrics.readabilityIndex, 0) / detailed.length
    return Math.min(100, avgReadability)
  }

  private calculateVisualQuality(detailed: DetailedMetrics[]): number {
    const avgVisualElements = detailed.reduce((sum, slide) => sum + slide.metrics.visualElements, 0) / detailed.length
    const avgContrast = detailed.reduce((sum, slide) => sum + slide.metrics.colorContrast, 0) / detailed.length
    return (avgVisualElements * 10 + avgContrast) / 2
  }

  private calculateStructureQuality(detailed: DetailedMetrics[]): number {
    // Análise da consistência estrutural
    const wordCounts = detailed.map(slide => slide.metrics.wordCount)
    const variance = this.calculateVariance(wordCounts)
    const consistencyScore = Math.max(0, 100 - variance)
    return consistencyScore
  }

  private calculateAccessibilityScore(detailed: DetailedMetrics[]): number {
    const avgContrast = detailed.reduce((sum, slide) => sum + slide.metrics.colorContrast, 0) / detailed.length
    const avgReadability = detailed.reduce((sum, slide) => sum + slide.metrics.readabilityIndex, 0) / detailed.length
    return (avgContrast + avgReadability) / 2
  }

  private calculateOverallScore(detailed: DetailedMetrics[]): number {
    const textQuality = this.calculateTextQuality(detailed)
    const visualQuality = this.calculateVisualQuality(detailed)
    const structureQuality = this.calculateStructureQuality(detailed)
    const accessibilityScore = this.calculateAccessibilityScore(detailed)
    
    return (textQuality + visualQuality + structureQuality + accessibilityScore) / 4
  }

  private calculateVisualHierarchy(detailed: DetailedMetrics[]): number {
    // Análise da hierarquia visual baseada em tamanhos de fonte e elementos
    return Math.random() * 40 + 60 // Simulação
  }

  private calculateContentConsistency(detailed: DetailedMetrics[]): number {
    const wordCounts = detailed.map(slide => slide.metrics.wordCount)
    const variance = this.calculateVariance(wordCounts)
    return Math.max(0, 100 - variance)
  }

  private calculateEngagementPotential(detailed: DetailedMetrics[]): number {
    const avgVisualElements = detailed.reduce((sum, slide) => sum + slide.metrics.visualElements, 0) / detailed.length
    const avgTextToVisualRatio = detailed.reduce((sum, slide) => sum + slide.metrics.textToVisualRatio, 0) / detailed.length
    
    return Math.min(100, (avgVisualElements * 20) + (100 - avgTextToVisualRatio))
  }

  private calculateLearningEffectiveness(detailed: DetailedMetrics[]): number {
    const avgReadability = detailed.reduce((sum, slide) => sum + slide.metrics.readabilityIndex, 0) / detailed.length
    const avgCognitiveLoad = detailed.reduce((sum, slide) => sum + slide.metrics.cognitiveComplexity, 0) / detailed.length
    
    return Math.min(100, avgReadability - (avgCognitiveLoad * 0.5))
  }

  private calculateInformationDensity(detailed: DetailedMetrics[]): number {
    const avgWordCount = detailed.reduce((sum, slide) => sum + slide.metrics.wordCount, 0) / detailed.length
    const avgVisualElements = detailed.reduce((sum, slide) => sum + slide.metrics.visualElements, 0) / detailed.length
    
    return Math.min(100, (avgWordCount * 0.2) + (avgVisualElements * 10))
  }

  private calculateNarrativeFlow(detailed: DetailedMetrics[]): number {
    // Análise do fluxo narrativo baseado na progressão do conteúdo
    return Math.random() * 40 + 60 // Simulação
  }

  private calculateInteractivityScore(detailed: DetailedMetrics[]): number {
    // Score baseado em elementos interativos potenciais
    return Math.random() * 30 + 40 // Simulação
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }

  private generateRecommendations(metrics: EnhancedQualityMetrics, detailed: DetailedMetrics[]): string[] {
    const recommendations: string[] = []
    
    if (metrics.readabilityScore < 60) {
      recommendations.push('Simplifique o texto para melhorar a legibilidade')
    }
    
    if (metrics.visualQuality < 70) {
      recommendations.push('Adicione mais elementos visuais para aumentar o engajamento')
    }
    
    if (metrics.contentConsistency < 70) {
      recommendations.push('Padronize a estrutura e formato entre os slides')
    }
    
    if (metrics.accessibilityScore < 80) {
      recommendations.push('Melhore o contraste de cores e legibilidade para acessibilidade')
    }
    
    if (metrics.cognitiveLoad > 80) {
      recommendations.push('Reduza a complexidade cognitiva dividindo o conteúdo')
    }
    
    return recommendations
  }
}

// Exportar instância singleton
export const enhancedQualityMetricsService = EnhancedQualityMetricsService.getInstance()
export default enhancedQualityMetricsService