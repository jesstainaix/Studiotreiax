import { OpenAI } from 'openai'

interface NRDetectionResult {
  nr: string
  title: string
  confidence: number
  relevantSlides: number[]
  keyTopics: string[]
  suggestedTemplates: string[]
  riskLevel: 'low' | 'medium' | 'high'
  reasoning: string
}

interface PPTXAnalysisResult {
  fileName: string
  totalSlides: number
  detectedNRs: NRDetectionResult[]
  overallCompliance: number
  processingTime: number
  recommendations: string[]
  extractedText: string[]
  slideImages: string[]
  analysisMetadata: {
    modelUsed: string
    tokensUsed: number
    analysisDate: string
    confidenceThreshold: number
  }
}

interface SlideContent {
  slideNumber: number
  text: string
  imageBase64?: string
  elements: {
    titles: string[]
    bulletPoints: string[]
    images: string[]
    tables: string[]
  }
}

class GPT4VisionService {
  private openai: OpenAI
  private readonly NR_DATABASE = [
    {
      nr: 'NR-01',
      title: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
      keywords: ['risco', 'gerenciamento', 'prevenção', 'segurança', 'saúde ocupacional', 'PCMSO', 'PPRA'],
      riskIndicators: ['acidente', 'perigo', 'exposição', 'controle']
    },
    {
      nr: 'NR-06',
      title: 'Equipamentos de Proteção Individual - EPI',
      keywords: ['EPI', 'proteção individual', 'equipamento', 'capacete', 'luva', 'óculos', 'máscara'],
      riskIndicators: ['exposição', 'proteção', 'individual', 'equipamento']
    },
    {
      nr: 'NR-10',
      title: 'Segurança em Instalações e Serviços em Eletricidade',
      keywords: ['eletricidade', 'elétrico', 'instalação elétrica', 'choque', 'curto-circuito', 'alta tensão'],
      riskIndicators: ['choque elétrico', 'queimadura', 'arco elétrico', 'eletrocussão']
    },
    {
      nr: 'NR-12',
      title: 'Segurança no Trabalho em Máquinas e Equipamentos',
      keywords: ['máquina', 'equipamento', 'proteção', 'dispositivo', 'operação', 'manutenção'],
      riskIndicators: ['esmagamento', 'corte', 'prensagem', 'enroscamento']
    },
    {
      nr: 'NR-17',
      title: 'Ergonomia',
      keywords: ['ergonomia', 'postura', 'levantamento', 'transporte', 'mobiliário', 'organização'],
      riskIndicators: ['lesão', 'fadiga', 'dor', 'repetitivo', 'sobrecarga']
    },
    {
      nr: 'NR-18',
      title: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção',
      keywords: ['construção', 'obra', 'andaime', 'escavação', 'soldagem', 'demolição'],
      riskIndicators: ['queda', 'soterramento', 'desabamento', 'altura']
    },
    {
      nr: 'NR-23',
      title: 'Proteção Contra Incêndios',
      keywords: ['incêndio', 'fogo', 'extintor', 'brigada', 'evacuação', 'prevenção'],
      riskIndicators: ['combustível', 'inflamável', 'explosão', 'fumaça']
    },
    {
      nr: 'NR-33',
      title: 'Segurança e Saúde nos Trabalhos em Espaços Confinados',
      keywords: ['espaço confinado', 'atmosfera', 'ventilação', 'monitoramento', 'resgate'],
      riskIndicators: ['asfixia', 'intoxicação', 'explosão', 'engolfamento']
    },
    {
      nr: 'NR-35',
      title: 'Trabalho em Altura',
      keywords: ['altura', 'queda', 'cinto', 'trava-quedas', 'ancoragem', 'resgate'],
      riskIndicators: ['queda', 'trauma', 'síndrome', 'suspensão']
    }
  ]

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true // Only for development
    })
  }

  async analyzePPTXWithVision(
    slideContents: SlideContent[],
    fileName: string,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<PPTXAnalysisResult> {
    const startTime = Date.now()
    let totalTokens = 0

    try {
      progressCallback?.(10, 'Iniciando análise com GPT-4 Vision...')

      // Step 1: Extract and analyze text content
      progressCallback?.(25, 'Analisando conteúdo textual...')
      const textAnalysis = await this.analyzeTextContent(slideContents)
      totalTokens += textAnalysis.tokensUsed

      // Step 2: Analyze images with Vision API
      progressCallback?.(50, 'Analisando imagens com IA...')
      const imageAnalysis = await this.analyzeImagesWithVision(slideContents)
      totalTokens += imageAnalysis.tokensUsed

      // Step 3: Detect NRs based on combined analysis
      progressCallback?.(75, 'Detectando NRs relevantes...')
      const nrDetection = await this.detectRelevantNRs(textAnalysis.content, imageAnalysis.content)
      totalTokens += nrDetection.tokensUsed

      // Step 4: Generate recommendations
      progressCallback?.(90, 'Gerando recomendações...')
      const recommendations = await this.generateRecommendations(nrDetection.detectedNRs, textAnalysis.content)
      totalTokens += recommendations.tokensUsed

      progressCallback?.(100, 'Análise concluída!')

      const processingTime = (Date.now() - startTime) / 1000

      return {
        fileName,
        totalSlides: slideContents.length,
        detectedNRs: nrDetection.detectedNRs,
        overallCompliance: this.calculateOverallCompliance(nrDetection.detectedNRs),
        processingTime,
        recommendations: recommendations.suggestions,
        extractedText: textAnalysis.extractedTexts,
        slideImages: slideContents.map(slide => slide.imageBase64 || ''),
        analysisMetadata: {
          modelUsed: 'gpt-4-vision-preview',
          tokensUsed: totalTokens,
          analysisDate: new Date().toISOString(),
          confidenceThreshold: 70
        }
      }
    } catch (error) {
      console.error('GPT-4 Vision analysis error:', error)
      throw new Error('Falha na análise com GPT-4 Vision. Verifique sua configuração de API.')
    }
  }

  private async analyzeTextContent(slideContents: SlideContent[]) {
    const allText = slideContents.map(slide => 
      `Slide ${slide.slideNumber}: ${slide.text}\n${slide.elements.titles.join(' ')} ${slide.elements.bulletPoints.join(' ')}`
    ).join('\n\n')

    const prompt = `
Analise o seguinte conteúdo de apresentação PowerPoint e identifique:
1. Principais tópicos de segurança do trabalho
2. Riscos mencionados
3. Procedimentos de segurança
4. Equipamentos de proteção
5. Normas regulamentadoras implícitas

Conteúdo:
${allText}

Responda em formato JSON com as seguintes chaves:
- topics: array de tópicos principais
- risks: array de riscos identificados
- procedures: array de procedimentos
- equipment: array de equipamentos
- implicit_nrs: array de possíveis NRs relacionadas
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        content,
        extractedTexts: slideContents.map(slide => slide.text),
        tokensUsed: response.usage?.total_tokens || 0
      }
    } catch (error) {
      console.error('Text analysis error:', error)
      return {
        content: { topics: [], risks: [], procedures: [], equipment: [], implicit_nrs: [] },
        extractedTexts: slideContents.map(slide => slide.text),
        tokensUsed: 0
      }
    }
  }

  private async analyzeImagesWithVision(slideContents: SlideContent[]) {
    const slidesWithImages = slideContents.filter(slide => slide.imageBase64)
    
    if (slidesWithImages.length === 0) {
      return { content: { visual_elements: [], safety_indicators: [], equipment_visible: [] }, tokensUsed: 0 }
    }

    // Analyze up to 5 images to manage token usage
    const imagesToAnalyze = slidesWithImages.slice(0, 5)
    
    const prompt = `
Analise estas imagens de uma apresentação sobre segurança do trabalho e identifique:
1. Elementos visuais relacionados à segurança
2. Equipamentos de proteção visíveis
3. Situações de risco mostradas
4. Procedimentos de segurança ilustrados
5. Possíveis violações de normas

Responda em formato JSON com:
- visual_elements: array de elementos visuais identificados
- safety_indicators: array de indicadores de segurança
- equipment_visible: array de equipamentos visíveis
- risk_situations: array de situações de risco
- procedure_illustrations: array de procedimentos ilustrados
`

    try {
      const messages = [
        { role: 'user', content: [
          { type: 'text', text: prompt },
          ...imagesToAnalyze.map(slide => ({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${slide.imageBase64}` }
          }))
        ]}
      ]

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: messages as any,
        temperature: 0.3,
        max_tokens: 1500
      })

      const content = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        content,
        tokensUsed: response.usage?.total_tokens || 0
      }
    } catch (error) {
      console.error('Vision analysis error:', error)
      return {
        content: { visual_elements: [], safety_indicators: [], equipment_visible: [] },
        tokensUsed: 0
      }
    }
  }

  private async detectRelevantNRs(textContent: any, imageContent: any) {
    const combinedContent = {
      ...textContent,
      ...imageContent
    }

    const prompt = `
Com base na análise de conteúdo textual e visual, determine quais Normas Regulamentadoras (NRs) são mais relevantes para esta apresentação.

Conteúdo analisado:
${JSON.stringify(combinedContent, null, 2)}

NRs disponíveis para análise:
${JSON.stringify(this.NR_DATABASE, null, 2)}

Para cada NR relevante (confiança >= 70%), forneça:
- nr: código da NR
- title: título da NR
- confidence: nível de confiança (0-100)
- relevantSlides: array de números dos slides relevantes
- keyTopics: tópicos-chave identificados
- suggestedTemplates: templates sugeridos
- riskLevel: nível de risco (low/medium/high)
- reasoning: justificativa da detecção

Responda em formato JSON com array 'detectedNRs'.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2500
      })

      const result = JSON.parse(response.choices[0].message.content || '{ "detectedNRs": [] }')
      
      return {
        detectedNRs: result.detectedNRs || [],
        tokensUsed: response.usage?.total_tokens || 0
      }
    } catch (error) {
      console.error('NR detection error:', error)
      return {
        detectedNRs: [],
        tokensUsed: 0
      }
    }
  }

  private async generateRecommendations(detectedNRs: NRDetectionResult[], textContent: any) {
    const prompt = `
Com base nas NRs detectadas e no conteúdo analisado, gere recomendações específicas para melhorar a apresentação:

NRs detectadas:
${JSON.stringify(detectedNRs, null, 2)}

Conteúdo:
${JSON.stringify(textContent, null, 2)}

Gere recomendações práticas e específicas para:
1. Melhorar a cobertura das NRs identificadas
2. Adicionar conteúdo faltante
3. Aprimorar a clareza das informações
4. Incluir exemplos práticos
5. Fortalecer aspectos de segurança

Responda em formato JSON com array 'suggestions'.
`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500
      })

      const result = JSON.parse(response.choices[0].message.content || '{ "suggestions": [] }')
      
      return {
        suggestions: result.suggestions || [],
        tokensUsed: response.usage?.total_tokens || 0
      }
    } catch (error) {
      console.error('Recommendations generation error:', error)
      return {
        suggestions: [
          'Adicionar mais detalhes sobre procedimentos de segurança',
          'Incluir exemplos práticos de aplicação das normas',
          'Expandir informações sobre equipamentos de proteção',
          'Adicionar casos reais e estudos de caso'
        ],
        tokensUsed: 0
      }
    }
  }

  private calculateOverallCompliance(detectedNRs: NRDetectionResult[]): number {
    if (detectedNRs.length === 0) return 0
    
    const totalConfidence = detectedNRs.reduce((sum, nr) => sum + nr.confidence, 0)
    const averageConfidence = totalConfidence / detectedNRs.length
    
    // Factor in the number of NRs detected and their risk levels
    const riskMultiplier = detectedNRs.reduce((mult, nr) => {
      switch (nr.riskLevel) {
        case 'high': return mult * 0.9
        case 'medium': return mult * 0.95
        case 'low': return mult * 1.0
        default: return mult
      }
    }, 1.0)
    
    return Math.round(averageConfidence * riskMultiplier)
  }

  // Utility method to extract slide content from PPTX file
  async extractSlideContent(file: File): Promise<SlideContent[]> {
    // This would integrate with a PPTX parsing library
    // For now, return mock data structure
    return [
      {
        slideNumber: 1,
        text: 'Segurança do Trabalho - Introdução',
        elements: {
          titles: ['Segurança do Trabalho'],
          bulletPoints: ['Importância da prevenção', 'Normas regulamentadoras'],
          images: [],
          tables: []
        }
      }
    ]
  }
}

export { GPT4VisionService, type PPTXAnalysisResult, type NRDetectionResult, type SlideContent }