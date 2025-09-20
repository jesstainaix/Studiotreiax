export interface ContentValidationConfig {
  maxSlideSize: number // em bytes
  allowedImageFormats: string[]
  allowedVideoFormats: string[]
  allowedAudioFormats: string[]
  maxMediaFileSize: number
  checkCorruption: boolean
  validateLinks: boolean
  scanForMalware: boolean
}

export interface ValidationRule {
  id: string
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  category: 'structure' | 'content' | 'media' | 'security' | 'performance'
}

export interface ValidationIssue {
  ruleId: string
  severity: 'error' | 'warning' | 'info'
  message: string
  slideIndex?: number
  elementId?: string
  details?: any
  suggestion?: string
}

export interface SlideValidationResult {
  slideIndex: number
  isValid: boolean
  issues: ValidationIssue[]
  mediaElements: MediaElement[]
  textElements: TextElement[]
  corruptionDetected: boolean
  sizeBytes: number
}

export interface MediaElement {
  id: string
  type: 'image' | 'video' | 'audio'
  format: string
  size: number
  path: string
  isValid: boolean
  isCorrupted: boolean
  issues: string[]
}

export interface TextElement {
  id: string
  content: string
  encoding: string
  isValid: boolean
  hasSpecialCharacters: boolean
  language?: string
}

export interface ContentValidationResult {
  fileId: string
  fileName: string
  isValid: boolean
  overallScore: number // 0-100
  totalSlides: number
  validSlides: number
  corruptedSlides: number
  issues: ValidationIssue[]
  slideResults: SlideValidationResult[]
  mediaAnalysis: {
    totalMediaFiles: number
    validMediaFiles: number
    corruptedMediaFiles: number
    totalMediaSize: number
  }
  recommendations: string[]
  processingTime: number
  validatedAt: number
}

const DEFAULT_CONFIG: ContentValidationConfig = {
  maxSlideSize: 50 * 1024 * 1024, // 50MB por slide
  allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
  allowedVideoFormats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  allowedAudioFormats: ['mp3', 'wav', 'aac', 'ogg', 'wma'],
  maxMediaFileSize: 100 * 1024 * 1024, // 100MB por arquivo de mídia
  checkCorruption: true,
  validateLinks: true,
  scanForMalware: false
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'slide_size_limit',
    name: 'Limite de Tamanho do Slide',
    description: 'Verifica se o slide não excede o tamanho máximo permitido',
    severity: 'error',
    category: 'performance'
  },
  {
    id: 'media_format_support',
    name: 'Formato de Mídia Suportado',
    description: 'Verifica se os formatos de mídia são suportados',
    severity: 'error',
    category: 'media'
  },
  {
    id: 'media_corruption',
    name: 'Corrupção de Mídia',
    description: 'Detecta arquivos de mídia corrompidos',
    severity: 'error',
    category: 'media'
  },
  {
    id: 'text_encoding',
    name: 'Codificação de Texto',
    description: 'Verifica se o texto está corretamente codificado',
    severity: 'warning',
    category: 'content'
  },
  {
    id: 'external_links',
    name: 'Links Externos',
    description: 'Valida links externos e sua acessibilidade',
    severity: 'warning',
    category: 'content'
  },
  {
    id: 'slide_structure',
    name: 'Estrutura do Slide',
    description: 'Verifica a integridade estrutural do slide',
    severity: 'error',
    category: 'structure'
  },
  {
    id: 'animation_compatibility',
    name: 'Compatibilidade de Animações',
    description: 'Verifica se as animações são suportadas',
    severity: 'info',
    category: 'content'
  },
  {
    id: 'font_availability',
    name: 'Disponibilidade de Fontes',
    description: 'Verifica se as fontes utilizadas estão disponíveis',
    severity: 'warning',
    category: 'content'
  }
]

class ContentValidationService {
  private static instance: ContentValidationService
  private config: ContentValidationConfig
  private validationCache = new Map<string, ContentValidationResult>()

  constructor(config: Partial<ContentValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  static getInstance(config?: Partial<ContentValidationConfig>): ContentValidationService {
    if (!ContentValidationService.instance) {
      ContentValidationService.instance = new ContentValidationService(config)
    }
    return ContentValidationService.instance
  }

  /**
   * Valida todo o conteúdo do arquivo PPTX
   */
  async validateContent(
    fileId: string,
    fileName: string,
    pptxData: any,
    onProgress?: (progress: { current: number; total: number; percentage: number }) => void
  ): Promise<ContentValidationResult> {
    try {
      const startTime = Date.now()
      
      // Verificar cache
      const cached = this.validationCache.get(fileId)
      if (cached) {
        return cached
      }

      // Garantir que slides existe
      const slides = pptxData?.slides || []

      const result: ContentValidationResult = {
        fileId,
        fileName,
        isValid: true,
        overallScore: 100,
        totalSlides: slides.length,
        validSlides: 0,
        corruptedSlides: 0,
        issues: [],
        slideResults: [],
        mediaAnalysis: {
          totalMediaFiles: 0,
          validMediaFiles: 0,
          corruptedMediaFiles: 0,
          totalMediaSize: 0
        },
        recommendations: [],
        processingTime: 0,
        validatedAt: Date.now()
      }

      // Validar estrutura geral
      await this.validateOverallStructure(pptxData, result)

      // Validar cada slide
      if (slides.length > 0) {
        for (let i = 0; i < slides.length; i++) {
          const slideResult = await this.validateSlide(slides[i], i)
          result.slideResults.push(slideResult)
          
          if (slideResult.isValid) {
            result.validSlides++
          }
          
          if (slideResult.corruptionDetected) {
            result.corruptedSlides++
          }
          
          // Agregar issues
          result.issues.push(...slideResult.issues)
          
          // Atualizar análise de mídia
          this.updateMediaAnalysis(slideResult, result.mediaAnalysis)
          
          // Reportar progresso
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: slides.length,
              percentage: Math.round(((i + 1) / slides.length) * 100)
            })
          }
        }
      }

      // Calcular score geral
      result.overallScore = this.calculateOverallScore(result)
      result.isValid = result.overallScore >= 70 && result.corruptedSlides === 0
      
      // Gerar recomendações
      result.recommendations = this.generateRecommendations(result)
      
      result.processingTime = Date.now() - startTime
      
      // Armazenar no cache
      this.validationCache.set(fileId, result)
      
      return result

    } catch (error) {
      console.error('Erro na validação de conteúdo:', error)
      throw error
    }
  }

  /**
   * Valida um slide específico
   */
  async validateSlide(slideData: any, slideIndex: number): Promise<SlideValidationResult> {
    const result: SlideValidationResult = {
      slideIndex,
      isValid: true,
      issues: [],
      mediaElements: [],
      textElements: [],
      corruptionDetected: false,
      sizeBytes: 0
    }

    try {
      // Calcular tamanho do slide
      result.sizeBytes = this.calculateSlideSize(slideData)
      
      // Validar tamanho
      if (result.sizeBytes > this.config.maxSlideSize) {
        result.issues.push({
          ruleId: 'slide_size_limit',
          severity: 'error',
          message: `Slide excede o tamanho máximo permitido (${this.formatBytes(result.sizeBytes)} > ${this.formatBytes(this.config.maxSlideSize)})`,
          slideIndex,
          suggestion: 'Reduza o tamanho das imagens ou remova elementos desnecessários'
        })
      }

      // Validar estrutura do slide
      await this.validateSlideStructure(slideData, result)
      
      // Validar elementos de mídia
      await this.validateMediaElements(slideData, result)
      
      // Validar elementos de texto
      await this.validateTextElements(slideData, result)
      
      // Detectar corrupção
      result.corruptionDetected = await this.detectSlideCorruption(slideData)
      
      if (result.corruptionDetected) {
        result.issues.push({
          ruleId: 'slide_structure',
          severity: 'error',
          message: 'Slide apresenta sinais de corrupção',
          slideIndex,
          suggestion: 'Verifique o arquivo original ou tente recriar este slide'
        })
      }
      
      // Determinar se o slide é válido
      result.isValid = !result.issues.some(issue => issue.severity === 'error')
      
      return result

    } catch (error) {
      console.error(`Erro ao validar slide ${slideIndex}:`, error)
      result.isValid = false
      result.corruptionDetected = true
      result.issues.push({
        ruleId: 'slide_structure',
        severity: 'error',
        message: 'Erro ao processar slide',
        slideIndex,
        details: error
      })
      return result
    }
  }

  /**
   * Detecta corrupção em um slide
   */
  async detectSlideCorruption(slideData: any): Promise<boolean> {
    if (!this.config.checkCorruption) {
      return false
    }

    try {
      // Verificar estrutura básica
      if (!slideData || typeof slideData !== 'object') {
        return true
      }

      // Verificar propriedades essenciais
      const requiredProps = ['elements', 'layout']
      for (const prop of requiredProps) {
        if (slideData[prop] === undefined) {
          return true
        }
      }

      // Verificar integridade dos elementos
      if (slideData.elements && Array.isArray(slideData.elements)) {
        for (const element of slideData.elements) {
          if (await this.isElementCorrupted(element)) {
            return true
          }
        }
      }

      return false

    } catch (error) {
      console.error('Erro ao detectar corrupção:', error)
      return true
    }
  }

  /**
   * Verifica se um elemento está corrompido
   */
  async isElementCorrupted(element: any): Promise<boolean> {
    try {
      // Verificar estrutura básica do elemento
      if (!element || !element.type) {
        return true
      }

      // Verificar elementos de mídia
      if (['image', 'video', 'audio'].includes(element.type)) {
        return await this.isMediaElementCorrupted(element)
      }

      // Verificar elementos de texto
      if (element.type === 'text') {
        return this.isTextElementCorrupted(element)
      }

      return false

    } catch (error) {
      return true
    }
  }

  /**
   * Verifica corrupção em elemento de mídia
   */
  async isMediaElementCorrupted(element: any): Promise<boolean> {
    try {
      // Verificar propriedades essenciais
      if (!element.src && !element.data) {
        return true
      }

      // Verificar formato
      const format = this.extractFileFormat(element.src || element.name || '')
      if (!this.isFormatSupported(format, element.type)) {
        return true
      }

      // Verificar dados binários se disponíveis
      if (element.data) {
        return !this.validateBinaryData(element.data, element.type)
      }

      return false

    } catch (error) {
      return true
    }
  }

  /**
   * Verifica corrupção em elemento de texto
   */
  isTextElementCorrupted(element: any): boolean {
    try {
      // Verificar se tem conteúdo
      if (!element.content && !element.text) {
        return false // Texto vazio não é corrupção
      }

      const text = element.content || element.text
      
      // Verificar caracteres de controle inválidos
      const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
      if (invalidChars.test(text)) {
        return true
      }

      // Verificar codificação
      try {
        // Tentar decodificar/recodificar
        const encoded = encodeURIComponent(text)
        const decoded = decodeURIComponent(encoded)
        return decoded !== text
      } catch {
        return true
      }

    } catch (error) {
      return true
    }
  }

  /**
   * Valida dados binários
   */
  validateBinaryData(data: any, type: string): boolean {
    try {
      if (typeof data === 'string') {
        // Verificar se é base64 válido
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
        return base64Regex.test(data.replace(/\s/g, ''))
      }

      if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        // Verificar assinatura do arquivo
        return this.validateFileSignature(data, type)
      }

      return false

    } catch (error) {
      return false
    }
  }

  /**
   * Valida assinatura do arquivo
   */
  validateFileSignature(data: ArrayBuffer | Uint8Array, type: string): boolean {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data
    
    if (bytes.length < 4) return false

    const signature = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Assinaturas conhecidas
    const signatures: Record<string, string[]> = {
      image: [
        'ffd8ff', // JPEG
        '89504e', // PNG
        '474946', // GIF
        '424d',   // BMP
        '52494646' // WEBP
      ],
      video: [
        '00000018', // MP4
        '00000020', // MP4
        '66747970'  // MP4
      ],
      audio: [
        'fffb',   // MP3
        'fff3',   // MP3
        '494433', // MP3 with ID3
        '52494646' // WAV
      ]
    }

    const typeSignatures = signatures[type] || []
    return typeSignatures.some(sig => signature.startsWith(sig))
  }

  // Métodos auxiliares
  private async validateOverallStructure(pptxData: any, result: ContentValidationResult): Promise<void> {
    // Validar estrutura geral do PPTX
    const slides = pptxData?.slides || []
    if (!Array.isArray(slides)) {
      result.issues.push({
        ruleId: 'slide_structure',
        severity: 'error',
        message: 'Estrutura de slides inválida ou ausente',
        suggestion: 'Verifique se o arquivo PPTX não está corrompido'
      })
    }
  }

  private async validateSlideStructure(slideData: any, result: SlideValidationResult): Promise<void> {
    // Implementar validação de estrutura específica do slide
  }

  private async validateMediaElements(slideData: any, result: SlideValidationResult): Promise<void> {
    if (!slideData.elements) return

    for (const element of slideData.elements) {
      if (['image', 'video', 'audio'].includes(element.type)) {
        const mediaElement: MediaElement = {
          id: element.id || `${element.type}_${Date.now()}`,
          type: element.type,
          format: this.extractFileFormat(element.src || element.name || ''),
          size: element.size || 0,
          path: element.src || '',
          isValid: true,
          isCorrupted: false,
          issues: []
        }

        // Validar formato
        if (!this.isFormatSupported(mediaElement.format, mediaElement.type)) {
          mediaElement.isValid = false
          mediaElement.issues.push('Formato não suportado')
          
          result.issues.push({
            ruleId: 'media_format_support',
            severity: 'error',
            message: `Formato ${mediaElement.format} não suportado para ${mediaElement.type}`,
            slideIndex: result.slideIndex,
            elementId: mediaElement.id
          })
        }

        // Validar tamanho
        if (mediaElement.size > this.config.maxMediaFileSize) {
          mediaElement.isValid = false
          mediaElement.issues.push('Arquivo muito grande')
          
          result.issues.push({
            ruleId: 'slide_size_limit',
            severity: 'warning',
            message: `Arquivo de mídia muito grande: ${this.formatBytes(mediaElement.size)}`,
            slideIndex: result.slideIndex,
            elementId: mediaElement.id
          })
        }

        // Verificar corrupção
        mediaElement.isCorrupted = await this.isMediaElementCorrupted(element)
        if (mediaElement.isCorrupted) {
          mediaElement.isValid = false
          mediaElement.issues.push('Arquivo corrompido')
          
          result.issues.push({
            ruleId: 'media_corruption',
            severity: 'error',
            message: 'Arquivo de mídia corrompido detectado',
            slideIndex: result.slideIndex,
            elementId: mediaElement.id
          })
        }

        result.mediaElements.push(mediaElement)
      }
    }
  }

  private async validateTextElements(slideData: any, result: SlideValidationResult): Promise<void> {
    if (!slideData.elements) return

    for (const element of slideData.elements) {
      if (element.type === 'text') {
        const textElement: TextElement = {
          id: element.id || `text_${Date.now()}`,
          content: element.content || element.text || '',
          encoding: 'UTF-8',
          isValid: true,
          hasSpecialCharacters: false
        }

        // Verificar codificação
        if (this.isTextElementCorrupted(element)) {
          textElement.isValid = false
          
          result.issues.push({
            ruleId: 'text_encoding',
            severity: 'warning',
            message: 'Problema de codificação de texto detectado',
            slideIndex: result.slideIndex,
            elementId: textElement.id
          })
        }

        // Verificar caracteres especiais
        const specialCharsRegex = /[^\x20-\x7E\u00A0-\uFFFF]/g
        textElement.hasSpecialCharacters = specialCharsRegex.test(textElement.content)

        result.textElements.push(textElement)
      }
    }
  }

  private updateMediaAnalysis(slideResult: SlideValidationResult, mediaAnalysis: any): void {
    mediaAnalysis.totalMediaFiles += slideResult.mediaElements.length
    
    for (const media of slideResult.mediaElements) {
      if (media.isValid && !media.isCorrupted) {
        mediaAnalysis.validMediaFiles++
      }
      
      if (media.isCorrupted) {
        mediaAnalysis.corruptedMediaFiles++
      }
      
      mediaAnalysis.totalMediaSize += media.size
    }
  }

  private calculateOverallScore(result: ContentValidationResult): number {
    let score = 100
    
    // Penalizar por issues
    for (const issue of result.issues) {
      switch (issue.severity) {
        case 'error':
          score -= 20
          break
        case 'warning':
          score -= 10
          break
        case 'info':
          score -= 2
          break
      }
    }
    
    // Penalizar por slides corrompidos
    score -= result.corruptedSlides * 25
    
    return Math.max(0, score)
  }

  private generateRecommendations(result: ContentValidationResult): string[] {
    const recommendations: string[] = []
    
    if (result.corruptedSlides > 0) {
      recommendations.push('Verifique e recrie os slides corrompidos')
    }
    
    if (result.mediaAnalysis.corruptedMediaFiles > 0) {
      recommendations.push('Substitua os arquivos de mídia corrompidos')
    }
    
    const errorCount = result.issues.filter(i => i.severity === 'error').length
    if (errorCount > 0) {
      recommendations.push('Corrija os erros críticos antes de prosseguir')
    }
    
    if (result.mediaAnalysis.totalMediaSize > 500 * 1024 * 1024) {
      recommendations.push('Considere otimizar o tamanho dos arquivos de mídia')
    }
    
    return recommendations
  }

  private calculateSlideSize(slideData: any): number {
    // Simular cálculo de tamanho do slide
    let size = 1024 // Base size
    
    if (slideData.elements) {
      for (const element of slideData.elements) {
        if (element.size) {
          size += element.size
        } else if (element.content) {
          size += element.content.length * 2 // Aproximação para UTF-16
        }
      }
    }
    
    return size
  }

  private extractFileFormat(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
  }

  private isFormatSupported(format: string, type: string): boolean {
    switch (type) {
      case 'image':
        return this.config.allowedImageFormats.includes(format)
      case 'video':
        return this.config.allowedVideoFormats.includes(format)
      case 'audio':
        return this.config.allowedAudioFormats.includes(format)
      default:
        return false
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Limpa cache de validação
   */
  clearCache(fileId?: string): void {
    if (fileId) {
      this.validationCache.delete(fileId)
    } else {
      this.validationCache.clear()
    }
  }

  /**
   * Obtém regras de validação
   */
  getValidationRules(): ValidationRule[] {
    return [...VALIDATION_RULES]
  }

  /**
   * Extrai dados do arquivo PPTX
   */
  private async extractPPTXData(file: File): Promise<any> {
    // Simular extração de dados do PPTX
    // Em implementação real, usar biblioteca como pptx2json ou similar
    
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        // Simular dados extraídos
        const mockData = {
          metadata: {
            title: file.name.replace('.pptx', ''),
            author: 'Unknown',
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString(),
            slideSize: { width: 1920, height: 1080 },
            theme: 'Default'
          },
          slides: Array.from({ length: Math.floor(Math.random() * 10) + 3 }, (_, i) => ({
            index: i,
            title: `Slide ${i + 1}`,
            content: `Conteúdo do slide ${i + 1}`,
            notes: `Notas do slide ${i + 1}`,
            elements: [
              { type: 'text', content: `Título ${i + 1}`, id: `title_${i}` },
              { type: 'text', content: `Conteúdo ${i + 1}`, id: `content_${i}` },
              { type: 'image', src: 'mock.jpg', size: 1024 * 50, id: `image_${i}` }
            ],
            layout: 'standard'
          }))
        }
        
        resolve(mockData)
      }
      
      reader.onerror = () => {
        // Em caso de erro, retornar dados mínimos
        resolve({
          metadata: {
            title: file.name.replace('.pptx', ''),
            author: 'Unknown',
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString(),
            slideSize: { width: 1920, height: 1080 },
            theme: 'Default'
          },
          slides: []
        })
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats() {
    return {
      cachedValidations: this.validationCache.size,
      config: this.config,
      rules: VALIDATION_RULES.length
    }
  }
}

export const contentValidationService = ContentValidationService.getInstance()
export default contentValidationService