import type { SlideContent } from '../types/pptx'

export interface SemanticNRResult {
  nrId: string
  title: string
  confidence: number
  semanticScore: number
  contextualRelevance: number
  matchedConcepts: Array<{
    concept: string
    relevance: number
    slides: number[]
    context: string
  }>
  complianceGaps: Array<{
    requirement: string
    missing: boolean
    partialCoverage: boolean
    criticality: 'low' | 'medium' | 'high' | 'critical'
    recommendedContent: string
  }>
  relatedNRs: Array<{
    nrId: string
    relationship: 'prerequisite' | 'complementary' | 'overlapping'
    relevanceScore: number
  }>
  industryContext: {
    sector: string[]
    applicability: number
    specificRisks: string[]
  }
}

export interface NRKnowledgeBase {
  nrId: string
  title: string
  description: string
  
  // Conceitos semânticos principais
  coreConcepts: Array<{
    concept: string
    synonyms: string[]
    weight: number
    mandatory: boolean
  }>
  
  // Requisitos específicos
  requirements: Array<{
    id: string
    description: string
    keywords: string[]
    criticality: 'low' | 'medium' | 'high' | 'critical'
    applicableIndustries: string[]
  }>
  
  // Relacionamentos com outras NRs
  relationships: Array<{
    relatedNR: string
    type: 'prerequisite' | 'complementary' | 'overlapping'
    description: string
  }>
  
  // Contexto industrial
  industryContext: Array<{
    industry: string
    specificRequirements: string[]
    commonRisks: string[]
    applicabilityLevel: number
  }>
}

class SemanticNRDetectionService {
  private static instance: SemanticNRDetectionService
  private knowledgeBase: Map<string, NRKnowledgeBase> = new Map()
  private conceptEmbeddings: Map<string, number[]> = new Map()

  static getInstance(): SemanticNRDetectionService {
    if (!SemanticNRDetectionService.instance) {
      SemanticNRDetectionService.instance = new SemanticNRDetectionService()
    }
    return SemanticNRDetectionService.instance
  }

  constructor() {
    this.initializeKnowledgeBase()
  }

  /**
   * Detecção semântica avançada de NRs
   */
  async detectNRsSemanticAnalysis(slides: SlideContent[]): Promise<{
    detectedNRs: SemanticNRResult[]
    overallCompliance: number
    missingCriticalNRs: string[]
    recommendations: string[]
  }> {
    try {
      const detectedNRs: SemanticNRResult[] = []
      const allText = slides.map(slide => `${slide.title || ''} ${slide.content || ''}`).join(' ')
      
      // Análise semântica para cada NR na base de conhecimento
      for (const [nrId, nrData] of this.knowledgeBase) {
        const result = await this.analyzeNRCompliance(allText, slides, nrData)
        if (result.confidence > 0.3) {
          detectedNRs.push(result)
        }
      }
      
      // Calcular compliance geral
      const overallCompliance = this.calculateOverallCompliance(detectedNRs)
      
      // Identificar NRs críticas ausentes
      const missingCriticalNRs = this.identifyMissingCriticalNRs(detectedNRs)
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(detectedNRs, missingCriticalNRs)
      
      return {
        detectedNRs,
        overallCompliance,
        missingCriticalNRs,
        recommendations
      }
    } catch (error) {
      console.error('Error in semantic NR detection:', error)
      return {
        detectedNRs: [],
        overallCompliance: 0,
        missingCriticalNRs: [],
        recommendations: ['Erro na análise semântica de NRs']
      }
    }
  }

  private async analyzeNRCompliance(text: string, slides: SlideContent[], nrData: NRKnowledgeBase): Promise<SemanticNRResult> {
    const matchedConcepts = this.findMatchedConcepts(text, nrData.coreConcepts)
    const complianceGaps = this.identifyComplianceGaps(text, nrData.requirements)
    const relatedNRs = this.findRelatedNRs(nrData.relationships)
    
    const confidence = this.calculateConfidence(matchedConcepts, complianceGaps)
    const semanticScore = this.calculateSemanticScore(matchedConcepts)
    const contextualRelevance = this.calculateContextualRelevance(text, nrData)
    
    return {
      nrId: nrData.nrId,
      title: nrData.title,
      confidence,
      semanticScore,
      contextualRelevance,
      matchedConcepts,
      complianceGaps,
      relatedNRs,
      industryContext: {
        sector: nrData.industryContext.map(ctx => ctx.industry),
        applicability: nrData.industryContext.reduce((acc, ctx) => acc + ctx.applicabilityLevel, 0) / nrData.industryContext.length,
        specificRisks: nrData.industryContext.flatMap(ctx => ctx.commonRisks)
      }
    }
  }

  private findMatchedConcepts(text: string, concepts: NRKnowledgeBase['coreConcepts']) {
    return concepts.map(concept => {
      const allTerms = [concept.concept, ...concept.synonyms]
      const matches = allTerms.filter(term => 
        text.toLowerCase().includes(term.toLowerCase())
      )
      
      return {
        concept: concept.concept,
        relevance: matches.length > 0 ? concept.weight : 0,
        slides: matches.length > 0 ? [1] : [], // Simplified
        context: matches.join(', ')
      }
    }).filter(match => match.relevance > 0)
  }

  private identifyComplianceGaps(text: string, requirements: NRKnowledgeBase['requirements']) {
    return requirements.map(req => {
      const hasKeywords = req.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      )
      
      return {
        requirement: req.description,
        missing: !hasKeywords,
        partialCoverage: hasKeywords,
        criticality: req.criticality,
        recommendedContent: `Adicionar conteúdo sobre: ${req.description}`
      }
    })
  }

  private findRelatedNRs(relationships: NRKnowledgeBase['relationships']) {
    return relationships.map(rel => ({
      nrId: rel.relatedNR,
      relationship: rel.type,
      relevanceScore: 0.8 // Simplified
    }))
  }

  private calculateConfidence(matchedConcepts: any[], complianceGaps: any[]): number {
    const conceptScore = matchedConcepts.reduce((acc, concept) => acc + concept.relevance, 0)
    const gapPenalty = complianceGaps.filter(gap => gap.missing).length * 0.1
    return Math.max(0, Math.min(1, (conceptScore / 10) - gapPenalty))
  }

  private calculateSemanticScore(matchedConcepts: any[]): number {
    return matchedConcepts.reduce((acc, concept) => acc + concept.relevance, 0) / 10
  }

  private calculateContextualRelevance(text: string, nrData: NRKnowledgeBase): number {
    const industryTerms = nrData.industryContext.flatMap(ctx => ctx.specificRequirements)
    const matches = industryTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    )
    return matches.length / Math.max(1, industryTerms.length)
  }

  private calculateOverallCompliance(detectedNRs: SemanticNRResult[]): number {
    if (detectedNRs.length === 0) return 0
    return detectedNRs.reduce((acc, nr) => acc + nr.confidence, 0) / detectedNRs.length
  }

  private identifyMissingCriticalNRs(detectedNRs: SemanticNRResult[]): string[] {
    const detectedIds = new Set(detectedNRs.map(nr => nr.nrId))
    const criticalNRs = Array.from(this.knowledgeBase.values())
      .filter(nr => nr.requirements.some(req => req.criticality === 'critical'))
      .map(nr => nr.nrId)
    
    return criticalNRs.filter(id => !detectedIds.has(id))
  }

  private generateRecommendations(detectedNRs: SemanticNRResult[], missingCriticalNRs: string[]): string[] {
    const recommendations: string[] = []
    
    if (missingCriticalNRs.length > 0) {
      recommendations.push(`Adicionar conteúdo para NRs críticas: ${missingCriticalNRs.join(', ')}`)
    }
    
    detectedNRs.forEach(nr => {
      const missingGaps = nr.complianceGaps.filter(gap => gap.missing && gap.criticality === 'high')
      if (missingGaps.length > 0) {
        recommendations.push(`${nr.title}: ${missingGaps[0].recommendedContent}`)
      }
    })
    
    return recommendations
  }

  private initializeKnowledgeBase(): void {
    // Inicializar com algumas NRs exemplo
    const sampleNRs: NRKnowledgeBase[] = [
      {
        nrId: 'NR-12',
        title: 'Segurança no Trabalho em Máquinas e Equipamentos',
        description: 'Norma sobre segurança em máquinas e equipamentos',
        coreConcepts: [
          {
            concept: 'segurança em máquinas',
            synonyms: ['proteção de equipamentos', 'segurança industrial'],
            weight: 1.0,
            mandatory: true
          }
        ],
        requirements: [
          {
            id: 'req-1',
            description: 'Dispositivos de segurança',
            keywords: ['proteção', 'dispositivo', 'segurança'],
            criticality: 'critical',
            applicableIndustries: ['industrial', 'manufatura']
          }
        ],
        relationships: [],
        industryContext: [
          {
            industry: 'industrial',
            specificRequirements: ['proteção de máquinas'],
            commonRisks: ['acidentes com equipamentos'],
            applicabilityLevel: 1.0
          }
        ]
      }
    ]
    
    sampleNRs.forEach(nr => {
      this.knowledgeBase.set(nr.nrId, nr)
    })
  }
}

export default SemanticNRDetectionService.getInstance()