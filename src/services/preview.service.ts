export interface PreviewConfig {
  thumbnailSize: { width: number; height: number }
  quality: number // 0-1
  format: 'jpeg' | 'png' | 'webp'
  maxThumbnails: number
  enableRealTimePreview: boolean
  websocketUrl?: string
}

export interface SlidePreview {
  slideIndex: number
  thumbnail: string // base64 data URL
  title?: string
  content?: string
  notes?: string
  animations?: string[]
  transitions?: string
  timestamp: number
}

export interface PreviewProgress {
  totalSlides: number
  processedSlides: number
  currentSlide: number
  percentage: number
  estimatedTimeRemaining: number
  status: 'initializing' | 'processing' | 'completed' | 'error'
}

export interface PreviewResult {
  fileId: string
  fileName: string
  totalSlides: number
  slides: SlidePreview[]
  metadata: {
    title?: string
    author?: string
    createdDate?: string
    modifiedDate?: string
    slideSize: { width: number; height: number }
    theme?: string
  }
  processingTime: number
  generatedAt: number
}

export interface PreviewError {
  code: string
  message: string
  slideIndex?: number
  details?: any
}

const DEFAULT_CONFIG: PreviewConfig = {
  thumbnailSize: { width: 320, height: 240 },
  quality: 0.8,
  format: 'jpeg',
  maxThumbnails: 50,
  enableRealTimePreview: true,
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL
}

class PreviewService {
  private static instance: PreviewService
  private config: PreviewConfig
  private websocket: WebSocket | null = null
  private activeProcesses = new Map<string, AbortController>()
  private previewCache = new Map<string, PreviewResult>()
  private progressCallbacks = new Map<string, (progress: PreviewProgress) => void>()
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  constructor(config: Partial<PreviewConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeCanvas()
    this.initializeWebSocket()
  }

  static getInstance(config?: Partial<PreviewConfig>): PreviewService {
    if (!PreviewService.instance) {
      PreviewService.instance = new PreviewService(config)
    }
    return PreviewService.instance
  }

  /**
   * Gera preview em tempo real durante o upload
   */
  async generateRealTimePreview(
    fileId: string,
    file: File,
    onProgress?: (progress: PreviewProgress) => void,
    onSlideReady?: (slide: SlidePreview) => void
  ): Promise<PreviewResult> {
    try {
      // Registrar callback de progresso
      if (onProgress) {
        this.progressCallbacks.set(fileId, onProgress)
      }

      // Criar controller para cancelamento
      const abortController = new AbortController()
      this.activeProcesses.set(fileId, abortController)

      // Inicializar progresso
      const initialProgress: PreviewProgress = {
        totalSlides: 0,
        processedSlides: 0,
        currentSlide: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        status: 'initializing'
      }
      this.updateProgress(fileId, initialProgress)

      const startTime = Date.now()
      
      // Processar arquivo PPTX
      const result = await this.processPPTXFile(fileId, file, onSlideReady, abortController.signal)
      
      const processingTime = Date.now() - startTime
      result.processingTime = processingTime
      result.generatedAt = Date.now()

      // Armazenar no cache
      this.previewCache.set(fileId, result)

      // Finalizar progresso
      this.updateProgress(fileId, {
        ...initialProgress,
        totalSlides: result.totalSlides,
        processedSlides: result.totalSlides,
        currentSlide: result.totalSlides,
        percentage: 100,
        estimatedTimeRemaining: 0,
        status: 'completed'
      })

      // Limpar recursos
      this.cleanup(fileId)

      return result

    } catch (error) {
      this.handlePreviewError(fileId, error)
      throw error
    }
  }

  /**
   * Gera preview de um slide específico
   */
  async generateSlidePreview(
    slideData: any,
    slideIndex: number,
    signal?: AbortSignal
  ): Promise<SlidePreview> {
    try {
      if (signal?.aborted) {
        throw new Error('Preview generation was cancelled')
      }

      // Extrair conteúdo do slide
      const slideContent = this.extractSlideContent(slideData)
      
      // Gerar thumbnail
      const thumbnail = await this.generateThumbnail(slideData, signal)
      
      const preview: SlidePreview = {
        slideIndex,
        thumbnail,
        title: slideContent.title,
        content: slideContent.content,
        notes: slideContent.notes,
        animations: slideContent.animations,
        transitions: slideContent.transitions,
        timestamp: Date.now()
      }

      return preview

    } catch (error) {
      console.error(`Erro ao gerar preview do slide ${slideIndex}:`, error)
      throw error
    }
  }

  /**
   * Gera thumbnail de um slide
   */
  async generateThumbnail(
    slideData: any,
    signal?: AbortSignal
  ): Promise<string> {
    try {
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas não inicializado')
      }

      if (signal?.aborted) {
        throw new Error('Thumbnail generation was cancelled')
      }

      // Configurar canvas
      this.canvas.width = this.config.thumbnailSize.width
      this.canvas.height = this.config.thumbnailSize.height
      
      // Limpar canvas
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      // Renderizar conteúdo do slide
      await this.renderSlideContent(slideData, signal)

      // Converter para data URL
      const dataURL = this.canvas.toDataURL(
        `image/${this.config.format}`,
        this.config.quality
      )

      return dataURL

    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error)
      // Retornar thumbnail padrão em caso de erro
      return this.generateDefaultThumbnail()
    }
  }

  /**
   * Obtém preview do cache
   */
  getCachedPreview(fileId: string): PreviewResult | null {
    return this.previewCache.get(fileId) || null
  }

  /**
   * Cancela geração de preview
   */
  cancelPreview(fileId: string): void {
    const controller = this.activeProcesses.get(fileId)
    if (controller) {
      controller.abort()
      this.cleanup(fileId)
    }
  }

  /**
   * Limpa cache de preview
   */
  clearCache(fileId?: string): void {
    if (fileId) {
      this.previewCache.delete(fileId)
    } else {
      this.previewCache.clear()
    }
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats() {
    return {
      cachedPreviews: this.previewCache.size,
      activeProcesses: this.activeProcesses.size,
      config: this.config
    }
  }

  // Métodos privados
  private async processPPTXFile(
    fileId: string,
    file: File,
    onSlideReady?: (slide: SlidePreview) => void,
    signal?: AbortSignal
  ): Promise<PreviewResult> {
    try {
      // Simular extração de dados do PPTX
      const pptxData = await this.extractPPTXData(file, signal)
      
      const result: PreviewResult = {
        fileId,
        fileName: file.name,
        totalSlides: pptxData.slides.length,
        slides: [],
        metadata: pptxData.metadata,
        processingTime: 0,
        generatedAt: 0
      }

      // Atualizar progresso inicial
      this.updateProgress(fileId, {
        totalSlides: result.totalSlides,
        processedSlides: 0,
        currentSlide: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        status: 'processing'
      })

      // Processar slides
      for (let i = 0; i < pptxData.slides.length; i++) {
        if (signal?.aborted) {
          throw new Error('Preview generation was cancelled')
        }

        const slideData = pptxData.slides[i]
        const slidePreview = await this.generateSlidePreview(slideData, i, signal)
        
        result.slides.push(slidePreview)
        
        // Notificar slide pronto
        if (onSlideReady) {
          onSlideReady(slidePreview)
        }

        // Atualizar progresso
        const progress = {
          totalSlides: result.totalSlides,
          processedSlides: i + 1,
          currentSlide: i + 1,
          percentage: Math.round(((i + 1) / result.totalSlides) * 100),
          estimatedTimeRemaining: this.calculateETA(i + 1, result.totalSlides),
          status: 'processing' as const
        }
        this.updateProgress(fileId, progress)

        // Enviar via WebSocket se disponível
        this.sendWebSocketUpdate(fileId, 'slide_ready', slidePreview)
      }

      return result

    } catch (error) {
      console.error('Erro ao processar arquivo PPTX:', error)
      throw error
    }
  }

  private async extractPPTXData(file: File, signal?: AbortSignal): Promise<any> {
    // Simular extração de dados do PPTX
    // Em implementação real, usar biblioteca como pptx2json ou similar
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        if (signal?.aborted) {
          reject(new Error('File reading was cancelled'))
          return
        }

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
          slides: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => ({
            index: i,
            title: `Slide ${i + 1}`,
            content: `Conteúdo do slide ${i + 1}`,
            notes: `Notas do slide ${i + 1}`,
            animations: ['fadeIn', 'slideLeft'],
            transitions: 'fade',
            elements: [
              { type: 'text', content: `Título ${i + 1}` },
              { type: 'text', content: `Conteúdo ${i + 1}` }
            ]
          }))
        }
        
        resolve(mockData)
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  private extractSlideContent(slideData: any) {
    return {
      title: slideData.title || '',
      content: slideData.content || '',
      notes: slideData.notes || '',
      animations: slideData.animations || [],
      transitions: slideData.transitions || ''
    }
  }

  private async renderSlideContent(slideData: any, signal?: AbortSignal): Promise<void> {
    if (!this.ctx) return

    try {
      // Configurar estilo
      this.ctx.font = '16px Arial'
      this.ctx.fillStyle = '#333333'
      this.ctx.textAlign = 'left'
      this.ctx.textBaseline = 'top'

      // Renderizar título
      if (slideData.title) {
        this.ctx.font = 'bold 20px Arial'
        this.ctx.fillText(slideData.title, 20, 20, this.canvas!.width - 40)
      }

      // Renderizar conteúdo
      if (slideData.content) {
        this.ctx.font = '14px Arial'
        const lines = this.wrapText(slideData.content, this.canvas!.width - 40)
        lines.forEach((line, index) => {
          if (signal?.aborted) return
          this.ctx!.fillText(line, 20, 60 + (index * 20))
        })
      }

      // Renderizar elementos adicionais
      if (slideData.elements) {
        slideData.elements.forEach((element: any, index: number) => {
          if (signal?.aborted) return
          this.renderElement(element, index)
        })
      }

    } catch (error) {
      console.error('Erro ao renderizar slide:', error)
    }
  }

  private renderElement(element: any, index: number): void {
    if (!this.ctx) return

    const y = 120 + (index * 30)
    
    switch (element.type) {
      case 'text':
        this.ctx.fillText(element.content, 20, y, this.canvas!.width - 40)
        break
      case 'image':
        // Renderizar placeholder para imagem
        this.ctx.strokeRect(20, y, 100, 60)
        this.ctx.fillText('[Imagem]', 25, y + 25)
        break
      case 'shape':
        // Renderizar forma simples
        this.ctx.strokeRect(20, y, 80, 40)
        break
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (!this.ctx) return [text]

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = this.ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  private generateDefaultThumbnail(): string {
    if (!this.canvas || !this.ctx) {
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    }

    this.canvas.width = this.config.thumbnailSize.width
    this.canvas.height = this.config.thumbnailSize.height
    
    // Fundo cinza
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Texto placeholder
    this.ctx.fillStyle = '#666666'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      'Preview não disponível',
      this.canvas.width / 2,
      this.canvas.height / 2
    )
    
    return this.canvas.toDataURL('image/jpeg', 0.8)
  }

  private calculateETA(processed: number, total: number): number {
    if (processed === 0) return 0
    
    const avgTimePerSlide = 2000 // 2 segundos por slide (estimativa)
    const remaining = total - processed
    return remaining * avgTimePerSlide
  }

  private updateProgress(fileId: string, progress: PreviewProgress): void {
    const callback = this.progressCallbacks.get(fileId)
    if (callback) {
      callback(progress)
    }
    
    // Enviar via WebSocket
    this.sendWebSocketUpdate(fileId, 'progress', progress)
  }

  private handlePreviewError(fileId: string, error: any): void {
    const previewError: PreviewError = {
      code: error.code || 'PREVIEW_ERROR',
      message: error.message || 'Erro ao gerar preview',
      details: error
    }
    
    this.updateProgress(fileId, {
      totalSlides: 0,
      processedSlides: 0,
      currentSlide: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      status: 'error'
    })
    
    this.sendWebSocketUpdate(fileId, 'error', previewError)
    this.cleanup(fileId)
  }

  private cleanup(fileId: string): void {
    this.activeProcesses.delete(fileId)
    this.progressCallbacks.delete(fileId)
  }

  private initializeCanvas(): void {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
    }
  }

  private initializeWebSocket(): void {
    if (!this.config.websocketUrl || !this.config.enableRealTimePreview) return
    
    try {
      this.websocket = new WebSocket(this.config.websocketUrl)
      
      this.websocket.onopen = () => {
        console.log('WebSocket conectado para preview em tempo real')
      }
      
      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error)
        }
      }
      
      this.websocket.onerror = (error) => {
        console.error('Erro no WebSocket:', error)
      }
      
      this.websocket.onclose = () => {
        console.log('WebSocket desconectado')
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          this.initializeWebSocket()
        }, 5000)
      }
    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error)
    }
  }

  private handleWebSocketMessage(data: any): void {
    // Processar mensagens recebidas via WebSocket
    console.log('Mensagem WebSocket recebida:', data)
  }

  private sendWebSocketUpdate(fileId: string, type: string, data: any): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return
    
    try {
      this.websocket.send(JSON.stringify({
        fileId,
        type,
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Erro ao enviar mensagem WebSocket:', error)
    }
  }
}

const previewService = new PreviewService()
export default previewService