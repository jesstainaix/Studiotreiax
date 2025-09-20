import { toast } from 'sonner'
import { enhancedQualityMetrics, EnhancedQualityMetrics, DetailedMetrics } from './enhancedQualityMetrics'
import { smartSuggestionsEngine, SmartSuggestion, ContextualAnalysis } from './smartSuggestionsEngine'
import { semanticNRDetection, SemanticNRResult } from './semanticNRDetection'
import { parallelProcessingEngine, ParallelProcessingResult } from './parallelProcessingEngine'
import { intelligentCache } from './intelligentCache'
import type { SlideContent, NRDetectionResult, ContentAnalysisResult } from '../types/pptx'

// Re-export types for backward compatibility
export type { SlideContent, NRDetectionResult, ContentAnalysisResult }

export interface EnhancedAnalysisResult {
  // Dados básicos mantidos para compatibilidade
  basicAnalysis: ContentAnalysisResult
  
  // Novos dados avançados
  enhancedMetrics: {
    metrics: EnhancedQualityMetrics
    detailed: DetailedMetrics[]
    recommendations: string[]
  }
  
  smartSuggestions: {
    suggestions: SmartSuggestion[]
    contextualAnalysis: ContextualAnalysis
    prioritizedActions: SmartSuggestion[]
  }
  
  semanticNRAnalysis: {
    detectedNRs: SemanticNRResult[]
    overallCompliance: number
    missingCriticalNRs: string[]
    recommendations: string[]
  }
  
  processingInfo: {
    totalTime: number
    parallelEfficiency: number
    cacheHitRate: number
    jobsExecuted: string[]
  }
}

export interface VideoGenerationSettings {
  resolution: '720p' | '1080p' | '4K'
  frameRate: 24 | 30 | 60
  duration: {
    type: 'auto' | 'fixed' | 'adaptive'
    value?: number
    minSlideTime?: number
    maxSlideTime?: number
  }
  transitions: {
    enabled: boolean
    type: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe'
    duration: number
  }
  audio: {
    enableNarration: boolean
    voice: {
      provider: 'azure' | 'aws' | 'google' | 'elevenlabs'
      language: string
      gender: 'male' | 'female' | 'neutral'
      speed: number
      pitch: number
      emotion: 'neutral' | 'professional' | 'friendly' | 'authoritative'
    }
    backgroundMusic: {
      enabled: boolean
      track: string
      volume: number
    }
    soundEffects: {
      enabled: boolean
      transitions: boolean
      highlights: boolean
    }
  }
  visual: {
    avatar: {
      enabled: boolean
      style: 'realistic' | 'cartoon' | 'professional' | 'casual'
      position: 'left' | 'right' | 'center' | 'floating'
      size: 'small' | 'medium' | 'large'
    }
    branding: {
      logo: string
      colors: {
        primary: string
        secondary: string
        accent: string
      }
      fonts: {
        heading: string
        body: string
      }
    }
    effects: {
      enableAnimations: boolean
      highlightKeyPoints: boolean
      progressIndicator: boolean
      chapterMarkers: boolean
    }
  }
}

class AdvancedPPTXAnalysisService {
  private nrDatabase = [
    {
      id: 'NR-01',
      title: 'NR-01 - Disposições Gerais',
      keywords: ['segurança', 'saúde', 'trabalho', 'empregador', 'empregado', 'responsabilidade'],
      description: 'Estabelece as disposições gerais sobre segurança e saúde no trabalho'
    },
    {
      id: 'NR-04',
      title: 'NR-04 - Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho',
      keywords: ['SESMT', 'engenheiro', 'médico', 'técnico', 'segurança', 'medicina'],
      description: 'Estabelece a obrigatoriedade de manter SESMT'
    },
    {
      id: 'NR-05',
      title: 'NR-05 - Comissão Interna de Prevenção de Acidentes',
      keywords: ['CIPA', 'prevenção', 'acidentes', 'comissão', 'representante'],
      description: 'Estabelece a obrigatoriedade de constituir CIPA'
    },
    {
      id: 'NR-06',
      title: 'NR-06 - Equipamento de Proteção Individual',
      keywords: ['EPI', 'proteção', 'individual', 'equipamento', 'capacete', 'luva', 'óculos'],
      description: 'Estabelece as condições de uso de EPIs'
    },
    {
      id: 'NR-07',
      title: 'NR-07 - Programa de Controle Médico de Saúde Ocupacional',
      keywords: ['PCMSO', 'exame', 'médico', 'saúde', 'ocupacional', 'admissional'],
      description: 'Estabelece a obrigatoriedade de elaboração do PCMSO'
    },
    {
      id: 'NR-08',
      title: 'NR-08 - Edificações',
      keywords: ['edificação', 'construção', 'piso', 'parede', 'teto', 'escada', 'rampa'],
      description: 'Estabelece requisitos técnicos mínimos para edificações'
    },
    {
      id: 'NR-09',
      title: 'NR-09 - Programa de Prevenção de Riscos Ambientais',
      keywords: ['PPRA', 'risco', 'ambiental', 'químico', 'físico', 'biológico'],
      description: 'Estabelece a obrigatoriedade de elaboração do PPRA'
    },
    {
      id: 'NR-10',
      title: 'NR-10 - Segurança em Instalações e Serviços em Eletricidade',
      keywords: ['elétrico', 'eletricidade', 'instalação', 'choque', 'tensão', 'corrente'],
      description: 'Estabelece os requisitos de segurança em eletricidade'
    },
    {
      id: 'NR-11',
      title: 'NR-11 - Transporte, Movimentação, Armazenagem e Manuseio de Materiais',
      keywords: ['transporte', 'movimentação', 'armazenagem', 'material', 'empilhadeira'],
      description: 'Estabelece os requisitos de segurança para transporte de materiais'
    },
    {
      id: 'NR-12',
      title: 'NR-12 - Segurança no Trabalho em Máquinas e Equipamentos',
      keywords: ['máquina', 'equipamento', 'proteção', 'dispositivo', 'operação'],
      description: 'Estabelece os requisitos de segurança para máquinas e equipamentos'
    },
    {
      id: 'NR-15',
      title: 'NR-15 - Atividades e Operações Insalubres',
      keywords: ['insalubridade', 'agente', 'nocivo', 'limite', 'tolerância'],
      description: 'Estabelece as atividades e operações insalubres'
    },
    {
      id: 'NR-16',
      title: 'NR-16 - Atividades e Operações Perigosas',
      keywords: ['periculosidade', 'explosivo', 'inflamável', 'radiação', 'energia'],
      description: 'Estabelece as atividades e operações perigosas'
    },
    {
      id: 'NR-17',
      title: 'NR-17 - Ergonomia',
      keywords: ['ergonomia', 'postura', 'levantamento', 'transporte', 'mobiliário'],
      description: 'Estabelece parâmetros para adaptação das condições de trabalho'
    },
    {
      id: 'NR-18',
      title: 'NR-18 - Condições e Meio Ambiente de Trabalho na Indústria da Construção',
      keywords: ['construção', 'obra', 'andaime', 'escavação', 'demolição'],
      description: 'Estabelece diretrizes de segurança na construção civil'
    },
    {
      id: 'NR-20',
      title: 'NR-20 - Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis',
      keywords: ['inflamável', 'combustível', 'líquido', 'gás', 'vapor'],
      description: 'Estabelece requisitos para trabalho com inflamáveis e combustíveis'
    },
    {
      id: 'NR-23',
      title: 'NR-23 - Proteção Contra Incêndios',
      keywords: ['incêndio', 'extintor', 'hidrante', 'alarme', 'saída', 'emergência'],
      description: 'Estabelece as medidas de proteção contra incêndios'
    },
    {
      id: 'NR-24',
      title: 'NR-24 - Condições Sanitárias e de Conforto nos Locais de Trabalho',
      keywords: ['sanitário', 'vestiário', 'refeitório', 'cozinha', 'alojamento'],
      description: 'Estabelece as condições sanitárias e de conforto'
    },
    {
      id: 'NR-25',
      title: 'NR-25 - Resíduos Industriais',
      keywords: ['resíduo', 'industrial', 'descarte', 'tratamento', 'poluição'],
      description: 'Estabelece medidas preventivas para resíduos industriais'
    },
    {
      id: 'NR-26',
      title: 'NR-26 - Sinalização de Segurança',
      keywords: ['sinalização', 'cor', 'placa', 'símbolo', 'advertência'],
      description: 'Estabelece a sinalização de segurança no trabalho'
    },
    {
      id: 'NR-33',
      title: 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados',
      keywords: ['espaço', 'confinado', 'atmosfera', 'ventilação', 'vigia'],
      description: 'Estabelece os requisitos para trabalhos em espaços confinados'
    },
    {
      id: 'NR-35',
      title: 'NR-35 - Trabalho em Altura',
      keywords: ['altura', 'queda', 'cinto', 'trava-quedas', 'ancoragem'],
      description: 'Estabelece os requisitos para trabalhos em altura'
    }
  ]

  async analyzeContent(file: File): Promise<ContentAnalysisResult> {
    try {
      // Simular extração de conteúdo do arquivo PPTX
      const slides = await this.extractSlides(file)
      
      // Análise de NRs
      const detectedNRs = await this.detectNRs(slides)
      
      // Análise de complexidade
      const complexity = this.analyzeComplexity(slides)
      
      // Extração de tópicos
      const keyTopics = this.extractKeyTopics(slides)
      
      // Objetivos de aprendizagem
      const learningObjectives = this.generateLearningObjectives(slides, detectedNRs)
      
      // Público-alvo
      const targetAudience = this.identifyTargetAudience(slides, detectedNRs)
      
      // Sugestões de melhoria
      const improvementSuggestions = this.generateImprovementSuggestions(slides)
      
      // Métricas de qualidade
      const qualityMetrics = this.calculateQualityMetrics(slides)
      
      // Tempo estimado de leitura
      const estimatedReadingTime = this.calculateReadingTime(slides)
      
      return {
        slides,
        detectedNRs,
        overallComplexity: complexity,
        estimatedReadingTime,
        keyTopics,
        learningObjectives,
        targetAudience,
        improvementSuggestions,
        qualityMetrics
      }
    } catch (error) {
      console.error('Error analyzing PPTX content:', error)
      throw new Error('Falha na análise do conteúdo PPTX')
    }
  }

  /**
   * Análise completa com todos os novos recursos avançados
   */
  async performEnhancedAnalysis(
    slides: SlideContent[],
    options: {
      enableCache?: boolean
      priority?: 'speed' | 'accuracy' | 'balanced'
    } = {}
  ): Promise<EnhancedAnalysisResult> { + 10
    const slides: SlideContent[] = []
    
    for (let i = 1; i <= slideCount; i++) {
      slides.push({
        slideNumber: i,
        title: `Slide ${i} - ${this.generateRandomTitle()}`,
        content: this.generateRandomContent(),
        images: this.generateRandomImages(),
        charts: this.generateRandomCharts(),
        animations: [],
        notes: this.generateRandomNotes(),
        layout: ['title', 'content', 'two-column', 'image-text'][Math.floor(Math.random() * 4)],
        complexity: Math.random() * 10
      })
    }
    
    return slides
  }

  private async detectNRs(slides: SlideContent[]): Promise<NRDetectionResult[]> {
    const detectedNRs: NRDetectionResult[] = []
    const allContent = slides.map(s => `${s.title} ${s.content} ${s.notes}`).join(' ').toLowerCase()
    
    for (const nr of this.nrDatabase) {
      const matchedKeywords: string[] = []
      let totalMatches = 0
      
      for (const keyword of nr.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const matches = allContent.match(regex)
        if (matches) {
          matchedKeywords.push(keyword)
          totalMatches += matches.length
        }
      }
      
      if (matchedKeywords.length > 0) {
        const confidence = Math.min(0.95, (matchedKeywords.length / nr.keywords.length) * 0.7 + (totalMatches / 100) * 0.3)
        
        if (confidence > 0.3) {
          const relevantSlides = slides
            .filter(slide => {
              const slideContent = `${slide.title} ${slide.content} ${slide.notes}`.toLowerCase()
              return matchedKeywords.some(keyword => slideContent.includes(keyword))
            })
            .map(slide => slide.slideNumber)
          
          detectedNRs.push({
            nrId: nr.id,
            title: nr.title,
            confidence,
            matchedKeywords,
            relevantSlides,
            complianceLevel: this.assessComplianceLevel(confidence),
            recommendations: this.generateRecommendations(nr.id, confidence),
            riskFactors: this.identifyRiskFactors(nr.id, matchedKeywords),
            requiredActions: this.generateRequiredActions(nr.id, confidence)
          })
        }
      }
    }
    
    return detectedNRs.sort((a, b) => b.confidence - a.confidence)
  }

  private analyzeComplexity(slides: SlideContent[]): 'basic' | 'intermediate' | 'advanced' {
    const avgComplexity = slides.reduce((sum, slide) => sum + slide.complexity, 0) / slides.length
    const hasCharts = slides.some(slide => slide.charts.length > 0)
    const hasAnimations = slides.some(slide => slide.animations.length > 0)
    const textDensity = slides.reduce((sum, slide) => sum + slide.content.length, 0) / slides.length
    
    let complexityScore = avgComplexity
    if (hasCharts) complexityScore += 2
    if (hasAnimations) complexityScore += 1
    if (textDensity > 500) complexityScore += 2
    
    if (complexityScore < 4) return 'basic'
    if (complexityScore < 7) return 'intermediate'
    return 'advanced'
  }

  private extractKeyTopics(slides: SlideContent[]): Array<{ topic: string; relevance: number; slides: number[] }> {
    const topics = [
      'Segurança no Trabalho',
      'Equipamentos de Proteção',
      'Prevenção de Acidentes',
      'Normas Regulamentadoras',
      'Procedimentos de Segurança',
      'Riscos Ocupacionais',
      'Saúde Ocupacional',
      'Treinamento e Capacitação'
    ]
    
    return topics.map(topic => ({
      topic,
      relevance: Math.random(),
      slides: slides
        .filter(() => Math.random() > 0.5)
        .map(slide => slide.slideNumber)
    })).sort((a, b) => b.relevance - a.relevance).slice(0, 5)
  }

  private generateLearningObjectives(slides: SlideContent[], nrs: NRDetectionResult[]): string[] {
    const objectives = [
      'Identificar os principais riscos de segurança no ambiente de trabalho',
      'Aplicar corretamente os procedimentos de segurança estabelecidos',
      'Utilizar adequadamente os equipamentos de proteção individual',
      'Reconhecer situações de risco e tomar medidas preventivas',
      'Compreender a importância das normas regulamentadoras'
    ]
    
    // Adicionar objetivos específicos baseados nas NRs detectadas
    nrs.forEach(nr => {
      if (nr.nrId === 'NR-10') {
        objectives.push('Aplicar medidas de segurança em instalações elétricas')
      }
      if (nr.nrId === 'NR-35') {
        objectives.push('Executar trabalhos em altura com segurança')
      }
      if (nr.nrId === 'NR-06') {
        objectives.push('Selecionar e usar corretamente os EPIs')
      }
    })
    
    return objectives.slice(0, 6)
  }

  private identifyTargetAudience(slides: SlideContent[], nrs: NRDetectionResult[]): string {
    const audiences = [
      'Trabalhadores da indústria',
      'Técnicos de segurança',
      'Supervisores e encarregados',
      'Operadores de máquinas',
      'Eletricistas e técnicos elétricos',
      'Trabalhadores da construção civil',
      'Profissionais de saúde ocupacional'
    ]
    
    // Determinar público baseado nas NRs detectadas
    if (nrs.some(nr => nr.nrId === 'NR-10')) {
      return 'Eletricistas e técnicos elétricos'
    }
    if (nrs.some(nr => nr.nrId === 'NR-18')) {
      return 'Trabalhadores da construção civil'
    }
    if (nrs.some(nr => nr.nrId === 'NR-12')) {
      return 'Operadores de máquinas e equipamentos'
    }
    
    return audiences[Math.floor(Math.random() * audiences.length)]
  }

  private generateImprovementSuggestions(slides: SlideContent[]) {
    const suggestions = [
      {
        type: 'content' as const,
        priority: 'high' as const,
        description: 'Adicionar mais exemplos práticos e casos reais',
        affectedSlides: [1, 3, 5]
      },
      {
        type: 'visual' as const,
        priority: 'medium' as const,
        description: 'Melhorar qualidade e relevância das imagens',
        affectedSlides: [2, 4, 6]
      },
      {
        type: 'structure' as const,
        priority: 'medium' as const,
        description: 'Reorganizar conteúdo para melhor fluxo de aprendizagem',
        affectedSlides: [7, 8, 9]
      },
      {
        type: 'accessibility' as const,
        priority: 'high' as const,
        description: 'Adicionar descrições alternativas para imagens',
        affectedSlides: slides.filter(s => s.images.length > 0).map(s => s.slideNumber)
      }
    ]
    
    return suggestions
  }

  private calculateQualityMetrics(slides: SlideContent[]) {
    const textQuality = Math.random() * 40 + 60 // 60-100
    const visualQuality = Math.random() * 30 + 50 // 50-80
    const structureQuality = Math.random() * 35 + 65 // 65-100
    const accessibilityScore = Math.random() * 50 + 30 // 30-80
    
    const overallScore = (textQuality + visualQuality + structureQuality + accessibilityScore) / 4
    
    return {
      textQuality: Math.round(textQuality),
      visualQuality: Math.round(visualQuality),
      structureQuality: Math.round(structureQuality),
      accessibilityScore: Math.round(accessibilityScore),
      overallScore: Math.round(overallScore)
    }
  }

  private calculateReadingTime(slides: SlideContent[]): number {
    const wordsPerMinute = 200
    const totalWords = slides.reduce((sum, slide) => {
      const words = slide.content.split(' ').length + slide.title.split(' ').length
      return sum + words
    }, 0)
    
    return Math.ceil(totalWords / wordsPerMinute)
  }

  private assessComplianceLevel(confidence: number): 'full' | 'partial' | 'none' {
    if (confidence > 0.8) return 'full'
    if (confidence > 0.5) return 'partial'
    return 'none'
  }

  private generateRecommendations(nrId: string, confidence: number): string[] {
    const recommendations: { [key: string]: string[] } = {
      'NR-06': [
        'Incluir demonstração prática do uso correto de EPIs',
        'Adicionar checklist de inspeção de EPIs',
        'Mostrar consequências do não uso de EPIs'
      ],
      'NR-10': [
        'Demonstrar procedimentos de bloqueio e etiquetagem',
        'Incluir medições de tensão e corrente',
        'Mostrar equipamentos de proteção coletiva'
      ],
      'NR-35': [
        'Demonstrar inspeção de equipamentos de proteção contra quedas',
        'Incluir procedimentos de resgate em altura',
        'Mostrar pontos de ancoragem adequados'
      ]
    }
    
    return recommendations[nrId] || [
      'Adicionar mais detalhes sobre procedimentos de segurança',
      'Incluir exemplos práticos da aplicação da norma',
      'Demonstrar uso correto de equipamentos de segurança'
    ]
  }

  private identifyRiskFactors(nrId: string, keywords: string[]): string[] {
    const riskFactors: { [key: string]: string[] } = {
      'NR-06': ['Não uso de EPIs', 'EPIs inadequados', 'EPIs danificados'],
      'NR-10': ['Choque elétrico', 'Arco elétrico', 'Incêndio por falha elétrica'],
      'NR-35': ['Queda de altura', 'Equipamentos inadequados', 'Falta de treinamento']
    }
    
    return riskFactors[nrId] || ['Riscos não identificados especificamente']
  }

  private generateRequiredActions(nrId: string, confidence: number): string[] {
    const actions: { [key: string]: string[] } = {
      'NR-06': [
        'Fornecer treinamento sobre uso correto de EPIs',
        'Implementar programa de inspeção de EPIs',
        'Estabelecer procedimentos de substituição'
      ],
      'NR-10': [
        'Treinar trabalhadores em segurança elétrica',
        'Implementar procedimentos de bloqueio',
        'Realizar inspeções periódicas das instalações'
      ],
      'NR-35': [
        'Capacitar trabalhadores para trabalho em altura',
        'Implementar sistema de permissão de trabalho',
        'Realizar inspeções de equipamentos de proteção'
      ]
    }
    
    return actions[nrId] || [
      'Implementar treinamento específico',
      'Estabelecer procedimentos de segurança',
      'Realizar avaliações periódicas'
    ]
  }

  private generateRandomTitle(): string {
    const titles = [
      'Introdução à Segurança',
      'Equipamentos de Proteção',
      'Procedimentos de Emergência',
      'Identificação de Riscos',
      'Normas de Segurança',
      'Prevenção de Acidentes',
      'Saúde Ocupacional',
      'Treinamento Prático'
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  private generateRandomContent(): string {
    const contents = [
      'Este slide apresenta conceitos fundamentais sobre segurança no trabalho e a importância da prevenção de acidentes.',
      'Aqui são demonstrados os principais equipamentos de proteção individual e suas aplicações específicas.',
      'Procedimentos de emergência são essenciais para garantir a segurança de todos os trabalhadores.',
      'A identificação correta de riscos é o primeiro passo para um ambiente de trabalho seguro.',
      'As normas regulamentadoras estabelecem diretrizes claras para a segurança ocupacional.'
    ]
    return contents[Math.floor(Math.random() * contents.length)]
  }

  private generateRandomImages() {
    const imageCount = Math.floor(Math.random() * 3)
    const images = []
    
    for (let i = 0; i < imageCount; i++) {
      images.push({
        src: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20equipment%20workplace&image_size=landscape_4_3`,
        alt: `Imagem de segurança ${i + 1}`,
        position: {
          x: Math.random() * 100,
          y: Math.random() * 100,
          width: 200 + Math.random() * 200,
          height: 150 + Math.random() * 150
        }
      })
    }
    
    return images
  }

  private generateRandomCharts() {
    const chartCount = Math.floor(Math.random() * 2)
    const charts = []
    
    for (let i = 0; i < chartCount; i++) {
      charts.push({
        type: ['bar', 'line', 'pie'][Math.floor(Math.random() * 3)] as any,
        data: this.generateChartData(),
        title: `Gráfico ${i + 1}`
      })
    }
    
    return charts
  }

  private generateChartData() {
    return {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
      datasets: [{
        label: 'Acidentes',
        data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 10))
      }]
    }
  }

  private generateRandomNotes(): string {
    const notes = [
      'Lembrar de enfatizar a importância do uso correto dos equipamentos.',
      'Incluir exemplos práticos durante a apresentação.',
      'Destacar as consequências legais do não cumprimento das normas.',
      'Permitir tempo para perguntas e esclarecimentos.',
      'Demonstrar o uso prático dos equipamentos de segurança.'
    ]
    return notes[Math.floor(Math.random() * notes.length)]
  }

  async generateVideoScript(analysis: ContentAnalysisResult, settings: VideoGenerationSettings): Promise<string> {
    let script = '# Script de Vídeo - Treinamento de Segurança\n\n'
    
    // Introdução
    script += '## Introdução\n'
    script += `Bem-vindos ao treinamento sobre ${analysis.keyTopics.map(t => t.topic).join(', ')}.\n`
    script += `Este treinamento é direcionado para ${analysis.targetAudience}.\n\n`
    
    // Objetivos
    script += '## Objetivos de Aprendizagem\n'
    analysis.learningObjectives.forEach((objective, index) => {
      script += `${index + 1}. ${objective}\n`
    })
    script += '\n'
    
    // Conteúdo por slide
    analysis.slides.forEach((slide, index) => {
      script += `## Slide ${slide.slideNumber}: ${slide.title}\n`
      script += `**Narração:** ${slide.content}\n`
      
      if (slide.images.length > 0) {
        script += `**Elementos visuais:** ${slide.images.length} imagem(ns)\n`
      }
      
      if (slide.charts.length > 0) {
        script += `**Gráficos:** ${slide.charts.length} gráfico(s)\n`
      }
      
      if (slide.notes) {
        script += `**Notas do apresentador:** ${slide.notes}\n`
      }
      
      script += '\n'
    })
    
    // Conclusão
    script += '## Conclusão\n'
    script += 'Recapitulação dos pontos principais e próximos passos.\n'
    
    return script
  }

  async optimizeForVideoGeneration(analysis: ContentAnalysisResult): Promise<ContentAnalysisResult> {
    // Otimizar conteúdo para geração de vídeo
    const optimizedSlides = analysis.slides.map(slide => ({
      ...slide,
      content: this.optimizeTextForNarration(slide.content),
      estimatedDuration: this.calculateSlideDuration(slide)
    }))
    
    return {
      ...analysis,
      slides: optimizedSlides as any
    }
  }

  private optimizeTextForNarration(text: string): string {
    // Simplificar texto para narração
    return text
      .replace(/\b(\w+)\b/g, (match) => {
        // Expandir abreviações comuns
        const expansions: { [key: string]: string } = {
          'EPI': 'Equipamento de Proteção Individual',
          'NR': 'Norma Regulamentadora',
          'CIPA': 'Comissão Interna de Prevenção de Acidentes',
          'SESMT': 'Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho'
        }
        return expansions[match] || match
      })
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Adicionar pausas
  }

  private calculateSlideDuration(slide: SlideContent): number {
    const wordsPerMinute = 150 // Velocidade de narração
    const words = slide.content.split(' ').length
    const baseDuration = (words / wordsPerMinute) * 60 // em segundos
    
    // Adicionar tempo para elementos visuais
    const imageDuration = slide.images.length * 2 // 2 segundos por imagem
    const chartDuration = slide.charts.length * 5 // 5 segundos por gráfico
    
    return Math.max(5, baseDuration + imageDuration + chartDuration) // Mínimo 5 segundos
  }
}

export default new AdvancedPPTXAnalysisService()