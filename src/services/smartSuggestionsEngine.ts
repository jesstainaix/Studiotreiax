import type { SlideContent, NRDetectionResult } from '../types/pptx'
import { EnhancedQualityMetrics, DetailedMetrics } from './enhancedQualityMetrics'

export interface SmartSuggestion {
  id: string
  slideNumber?: number
  category: 'content' | 'structure' | 'visual' | 'accessibility' | 'engagement' | 'compliance' | 'learning'
  type: 'enhancement' | 'fix' | 'optimization' | 'addition'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  rationale: string
  implementationEffort: 'easy' | 'moderate' | 'complex'
  estimatedImpact: 'low' | 'medium' | 'high'
  autoFixAvailable: boolean
  
  // Dados específicos para implementação
  actionData?: {
    targetElement?: string
    suggestedText?: string
    suggestedLayout?: string
    suggestedColors?: string[]
    suggestedImages?: string[]
    codeSnippet?: string
  }
  
  // Métricas de melhoria esperada
  expectedImprovements?: {
    readabilityIncrease?: number
    engagementIncrease?: number
    accessibilityIncrease?: number
    learningEffectivenessIncrease?: number
  }
}

export interface ContextualAnalysis {
  documentContext: {
    purpose: 'training' | 'presentation' | 'documentation' | 'assessment'
    audience: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
    industry: 'construction' | 'manufacturing' | 'healthcare' | 'general'
    nrFocus: string[]
  }
  
  contentPatterns: {
    informationFlow: 'linear' | 'hierarchical' | 'modular' | 'mixed'
    presentationStyle: 'formal' | 'casual' | 'technical' | 'educational'
    interactionLevel: 'passive' | 'interactive' | 'hands-on'
  }
  
  learningDesign: {
    hasObjectives: boolean
    hasAssessments: boolean
    hasReinforcement: boolean
    hasPracticalExamples: boolean
    followsInstructionalDesign: boolean
  }
}

export interface AutoFixAction {
  suggestionId: string
  action: 'apply' | 'preview' | 'customize'
  parameters?: Record<string, any>
}

class SmartSuggestionsEngine {
  private static instance: SmartSuggestionsEngine

  static getInstance(): SmartSuggestionsEngine {
    if (!SmartSuggestionsEngine.instance) {
      SmartSuggestionsEngine.instance = new SmartSuggestionsEngine()
    }
    return SmartSuggestionsEngine.instance
  }

  /**
   * Gera sugestões inteligentes baseadas no contexto e análise do conteúdo
   */
  async generateSmartSuggestions(
    slides: SlideContent[],
    metrics: EnhancedQualityMetrics,
    detailedMetrics: DetailedMetrics[],
    nrDetection?: NRDetectionResult[]
  ): Promise<{
    suggestions: SmartSuggestion[]
    contextualAnalysis: ContextualAnalysis
    prioritizedActions: SmartSuggestion[]
  }> {
    try {
      // Análise contextual do documento
      const contextualAnalysis = this.analyzeDocumentContext(slides, nrDetection)
      
      // Gerar sugestões baseadas em diferentes categorias
      const suggestions: SmartSuggestion[] = []
      
      // Sugestões de conteúdo
      suggestions.push(...this.generateContentSuggestions(slides, metrics, contextualAnalysis))
      
      // Sugestões de estrutura
      suggestions.push(...this.generateStructureSuggestions(slides, detailedMetrics))
      
      // Sugestões visuais
      suggestions.push(...this.generateVisualSuggestions(slides, metrics))
      
      // Sugestões de acessibilidade
      suggestions.push(...this.generateAccessibilitySuggestions(slides, metrics))
      
      // Sugestões de engajamento
      suggestions.push(...this.generateEngagementSuggestions(slides, contextualAnalysis))
      
      // Sugestões de compliance (se NR detection disponível)
      if (nrDetection) {
        suggestions.push(...this.generateComplianceSuggestions(slides, nrDetection))
      }
      
      // Sugestões de aprendizagem
      suggestions.push(...this.generateLearningSuggestions(slides, contextualAnalysis))
      
      // Priorizar ações
      const prioritizedActions = this.prioritizeSuggestions(suggestions)
      
      return {
        suggestions,
        contextualAnalysis,
        prioritizedActions
      }
    } catch (error) {
      console.error('Error generating smart suggestions:', error)
      return {
        suggestions: [],
        contextualAnalysis: this.getDefaultContextualAnalysis(),
        prioritizedActions: []
      }
    }
  }

  private analyzeDocumentContext(slides: SlideContent[], nrDetection?: NRDetectionResult[]): ContextualAnalysis {
    const allText = slides.map(slide => `${slide.title || ''} ${slide.content || ''}`).join(' ').toLowerCase()
    
    // Determinar propósito
    let purpose: ContextualAnalysis['documentContext']['purpose'] = 'presentation'
    if (allText.includes('treinamento') || allText.includes('capacitação')) {
      purpose = 'training'
    } else if (allText.includes('avaliação') || allText.includes('teste')) {
      purpose = 'assessment'
    } else if (allText.includes('manual') || allText.includes('procedimento')) {
      purpose = 'documentation'
    }
    
    // Determinar audiência
    let audience: ContextualAnalysis['documentContext']['audience'] = 'mixed'
    if (allText.includes('básico') || allText.includes('introdução')) {
      audience = 'beginner'
    } else if (allText.includes('avançado') || allText.includes('especialista')) {
      audience = 'advanced'
    } else if (allText.includes('intermediário')) {
      audience = 'intermediate'
    }
    
    // Determinar indústria
    let industry: ContextualAnalysis['documentContext']['industry'] = 'general'
    if (allText.includes('construção') || allText.includes('obra')) {
      industry = 'construction'
    } else if (allText.includes('manufatura') || allText.includes('produção')) {
      industry = 'manufacturing'
    } else if (allText.includes('saúde') || allText.includes('hospital')) {
      industry = 'healthcare'
    }
    
    return {
      documentContext: {
        purpose,
        audience,
        industry,
        nrFocus: nrDetection?.map(nr => nr.nrId) || []
      },
      contentPatterns: {
        informationFlow: slides.length > 10 ? 'modular' : 'linear',
        presentationStyle: allText.includes('norma') ? 'formal' : 'educational',
        interactionLevel: allText.includes('exercício') ? 'interactive' : 'passive'
      },
      learningDesign: {
        hasObjectives: allText.includes('objetivo'),
        hasAssessments: allText.includes('avaliação'),
        hasReinforcement: allText.includes('resumo'),
        hasPracticalExamples: allText.includes('exemplo'),
        followsInstructionalDesign: slides.length > 5
      }
    }
  }

  private generateContentSuggestions(slides: SlideContent[], metrics: EnhancedQualityMetrics, context: ContextualAnalysis): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestão para slides com pouco conteúdo
    slides.forEach((slide, index) => {
      const contentLength = (slide.content || '').length
      if (contentLength < 50) {
        suggestions.push({
          id: `content-expand-${index}`,
          slideNumber: index + 1,
          category: 'content',
          type: 'enhancement',
          priority: 'medium',
          title: 'Expandir conteúdo do slide',
          description: 'Este slide tem pouco conteúdo. Considere adicionar mais informações.',
          rationale: 'Slides com pouco conteúdo podem não transmitir informações suficientes.',
          implementationEffort: 'moderate',
          estimatedImpact: 'medium',
          autoFixAvailable: false,
          actionData: {
            suggestedText: 'Adicione exemplos práticos, detalhes importantes ou contexto adicional.'
          }
        })
      }
    })
    
    return suggestions
  }

  private generateStructureSuggestions(slides: SlideContent[], detailedMetrics: DetailedMetrics[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestão para melhorar estrutura
    if (slides.length > 15) {
      suggestions.push({
        id: 'structure-sections',
        category: 'structure',
        type: 'optimization',
        priority: 'medium',
        title: 'Dividir em seções',
        description: 'Considere dividir a apresentação em seções temáticas.',
        rationale: 'Apresentações longas são mais eficazes quando organizadas em seções.',
        implementationEffort: 'moderate',
        estimatedImpact: 'high',
        autoFixAvailable: false
      })
    }
    
    return suggestions
  }

  private generateVisualSuggestions(slides: SlideContent[], metrics: EnhancedQualityMetrics): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestão para melhorar contraste
    if (metrics.accessibility.colorContrast < 0.7) {
      suggestions.push({
        id: 'visual-contrast',
        category: 'visual',
        type: 'fix',
        priority: 'high',
        title: 'Melhorar contraste de cores',
        description: 'O contraste de cores está abaixo do recomendado.',
        rationale: 'Bom contraste melhora a legibilidade e acessibilidade.',
        implementationEffort: 'easy',
        estimatedImpact: 'high',
        autoFixAvailable: true,
        actionData: {
          suggestedColors: ['#000000', '#FFFFFF', '#333333']
        }
      })
    }
    
    return suggestions
  }

  private generateAccessibilitySuggestions(slides: SlideContent[], metrics: EnhancedQualityMetrics): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestão para adicionar texto alternativo
    if (metrics.accessibility.altTextCoverage < 0.8) {
      suggestions.push({
        id: 'accessibility-alt-text',
        category: 'accessibility',
        type: 'addition',
        priority: 'high',
        title: 'Adicionar texto alternativo',
        description: 'Algumas imagens não possuem texto alternativo.',
        rationale: 'Texto alternativo é essencial para acessibilidade.',
        implementationEffort: 'easy',
        estimatedImpact: 'high',
        autoFixAvailable: false
      })
    }
    
    return suggestions
  }

  private generateEngagementSuggestions(slides: SlideContent[], context: ContextualAnalysis): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestão para adicionar interatividade
    if (context.contentPatterns.interactionLevel === 'passive') {
      suggestions.push({
        id: 'engagement-interactive',
        category: 'engagement',
        type: 'enhancement',
        priority: 'medium',
        title: 'Adicionar elementos interativos',
        description: 'Considere adicionar perguntas, exercícios ou atividades.',
        rationale: 'Elementos interativos aumentam o engajamento e retenção.',
        implementationEffort: 'moderate',
        estimatedImpact: 'high',
        autoFixAvailable: false
      })
    }
    
    return suggestions
  }

  private generateComplianceSuggestions(slides: SlideContent[], nrDetection: NRDetectionResult[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestões baseadas em NRs detectadas
    nrDetection.forEach(nr => {
      if (nr.confidence < 0.7) {
        suggestions.push({
          id: `compliance-${nr.nrId}`,
          category: 'compliance',
          type: 'enhancement',
          priority: 'high',
          title: `Melhorar cobertura da ${nr.nrId}`,
          description: `A cobertura da ${nr.nrId} pode ser melhorada.`,
          rationale: 'Cobertura adequada de NRs é essencial para compliance.',
          implementationEffort: 'moderate',
          estimatedImpact: 'high',
          autoFixAvailable: false
        })
      }
    })
    
    return suggestions
  }

  private generateLearningSuggestions(slides: SlideContent[], context: ContextualAnalysis): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Sugestão para adicionar objetivos de aprendizagem
    if (!context.learningDesign.hasObjectives) {
      suggestions.push({
        id: 'learning-objectives',
        category: 'learning',
        type: 'addition',
        priority: 'medium',
        title: 'Adicionar objetivos de aprendizagem',
        description: 'Defina objetivos claros para o conteúdo.',
        rationale: 'Objetivos claros orientam o aprendizado e facilitam a avaliação.',
        implementationEffort: 'easy',
        estimatedImpact: 'medium',
        autoFixAvailable: false
      })
    }
    
    return suggestions
  }

  private prioritizeSuggestions(suggestions: SmartSuggestion[]): SmartSuggestion[] {
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const impactOrder = { high: 3, medium: 2, low: 1 }
        
        const aPriority = priorityOrder[a.priority] * 2 + impactOrder[a.estimatedImpact]
        const bPriority = priorityOrder[b.priority] * 2 + impactOrder[b.estimatedImpact]
        
        return bPriority - aPriority
      })
      .slice(0, 10) // Top 10 sugestões
  }

  private getDefaultContextualAnalysis(): ContextualAnalysis {
    return {
      documentContext: {
        purpose: 'presentation',
        audience: 'mixed',
        industry: 'general',
        nrFocus: []
      },
      contentPatterns: {
        informationFlow: 'linear',
        presentationStyle: 'educational',
        interactionLevel: 'passive'
      },
      learningDesign: {
        hasObjectives: false,
        hasAssessments: false,
        hasReinforcement: false,
        hasPracticalExamples: false,
        followsInstructionalDesign: false
      }
    }
  }

  /**
   * Aplica uma correção automática
   */
  async applyAutoFix(action: AutoFixAction): Promise<boolean> {
    try {
      console.log(`Applying auto-fix for suggestion: ${action.suggestionId}`)
      // Implementar lógica de auto-fix baseada no tipo de sugestão
      return true
    } catch (error) {
      console.error('Error applying auto-fix:', error)
      return false
    }
  }
}

export default SmartSuggestionsEngine.getInstance()