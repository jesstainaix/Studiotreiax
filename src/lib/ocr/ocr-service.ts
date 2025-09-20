import { toast } from 'sonner'

export interface OCRResult {
  id: string
  text: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  language?: string
  metadata?: Record<string, any>
}

export interface NRDetectionResult {
  nrNumber: string
  nrTitle: string
  confidence: number
  keywords: string[]
  category: 'safety' | 'health' | 'environment' | 'general'
  priority: 'high' | 'medium' | 'low'
  detectedAt: {
    slideIndex?: number
    textPosition: { x: number; y: number }
  }
}

export interface OCROptions {
  language?: string
  confidence?: number
  preprocessImage?: boolean
  extractTables?: boolean
  extractImages?: boolean
}

export interface OCRProgress {
  stage: 'preprocessing' | 'analyzing' | 'extracting' | 'postprocessing' | 'nr_detection'
  progress: number
  message: string
  nrDetected?: NRDetectionResult[]
}

class OCRService {
  private isProcessing = false
  private abortController: AbortController | null = null
  
  // NR Detection Patterns
  private nrPatterns = {
    'NR-01': {
      keywords: ['disposições gerais', 'campo de aplicação', 'responsabilidades'],
      title: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
      category: 'general' as const,
      priority: 'medium' as const
    },
    'NR-06': {
      keywords: ['epi', 'equipamento proteção individual', 'proteção individual'],
      title: 'Equipamentos de Proteção Individual',
      category: 'safety' as const,
      priority: 'high' as const
    },
    'NR-10': {
      keywords: ['instalações elétricas', 'segurança elétrica', 'eletricidade'],
      title: 'Segurança em Instalações e Serviços em Eletricidade',
      category: 'safety' as const,
      priority: 'high' as const
    },
    'NR-12': {
      keywords: ['máquinas', 'equipamentos', 'segurança máquinas'],
      title: 'Segurança no Trabalho em Máquinas e Equipamentos',
      category: 'safety' as const,
      priority: 'high' as const
    },
    'NR-17': {
      keywords: ['ergonomia', 'postura', 'levantamento manual'],
      title: 'Ergonomia',
      category: 'health' as const,
      priority: 'medium' as const
    },
    'NR-35': {
      keywords: ['trabalho altura', 'altura', 'andaimes'],
      title: 'Trabalho em Altura',
      category: 'safety' as const,
      priority: 'high' as const
    }
  }

  async extractText(
    file: File,
    options: OCROptions = {},
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult[]> {
    if (this.isProcessing) {
      throw new Error('OCR processing already in progress')
    }

    this.isProcessing = true
    this.abortController = new AbortController()

    try {
      // Simulate OCR processing with realistic stages
      const results: OCRResult[] = []
      
      // Stage 1: Preprocessing
      onProgress?.({
        stage: 'preprocessing',
        progress: 10,
        message: 'Preprocessing image...'
      })
      await this.delay(500)

      // Stage 2: Analyzing
      onProgress?.({
        stage: 'analyzing',
        progress: 40,
        message: 'Analyzing document structure...'
      })
      await this.delay(1000)

      // Stage 3: Extracting
      onProgress?.({
        stage: 'extracting',
        progress: 70,
        message: 'Extracting text content...'
      })
      await this.delay(800)

      // Stage 4: Post-processing
      onProgress?.({
        stage: 'postprocessing',
        progress: 90,
        message: 'Post-processing results...'
      })
      await this.delay(300)

      // Generate mock OCR results based on file type
      const mockResults = this.generateMockOCRResults(file.name)
      results.push(...mockResults)

      onProgress?.({
        stage: 'postprocessing',
        progress: 100,
        message: 'OCR processing completed'
      })

      return results
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('OCR processing was cancelled')
        throw new Error('OCR processing was cancelled')
      }
      
      toast.error('OCR processing failed')
      throw error
    } finally {
      this.isProcessing = false
      this.abortController = null
    }
  }

  async extractFromPPTX(
    file: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult[]> {
    // Specialized PPTX text extraction with NR detection
    const results = await this.extractText(file, {
      language: 'pt',
      confidence: 0.8,
      extractTables: true,
      extractImages: true
    }, onProgress)
    
    // Perform NR detection on extracted text
    onProgress?.({
      stage: 'nr_detection',
      progress: 95,
      message: 'Detecting NR compliance requirements...'
    })
    
    const nrDetections = this.detectNRContent(results)
    
    onProgress?.({
      stage: 'nr_detection',
      progress: 100,
      message: `NR detection completed - ${nrDetections.length} regulations identified`,
      nrDetected: nrDetections
    })
    
    return results
  }
  
  detectNRContent(ocrResults: OCRResult[]): NRDetectionResult[] {
    const detections: NRDetectionResult[] = []
    const combinedText = ocrResults.map(r => r.text.toLowerCase()).join(' ')
    
    // Check for explicit NR mentions
    const nrMentions = combinedText.match(/nr[\s-]?(\d{1,2})/g) || []
    
    for (const [nrNumber, pattern] of Object.entries(this.nrPatterns)) {
      let confidence = 0
      const detectedKeywords: string[] = []
      
      // Check for explicit NR number mention
      const nrRegex = new RegExp(nrNumber.replace('-', '[\\s-]?'), 'i')
      if (nrRegex.test(combinedText)) {
        confidence += 0.4
      }
      
      // Check for keyword matches
      for (const keyword of pattern.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          confidence += 0.2
          detectedKeywords.push(keyword)
        }
      }
      
      // Only include if confidence is above threshold
      if (confidence >= 0.3) {
        // Find position of first relevant text
        const relevantResult = ocrResults.find(r => 
          pattern.keywords.some(k => r.text.toLowerCase().includes(k.toLowerCase()))
        ) || ocrResults[0]
        
        detections.push({
          nrNumber,
          nrTitle: pattern.title,
          confidence: Math.min(confidence, 1.0),
          keywords: detectedKeywords,
          category: pattern.category,
          priority: pattern.priority,
          detectedAt: {
            textPosition: {
              x: relevantResult.boundingBox.x,
              y: relevantResult.boundingBox.y
            }
          }
        })
      }
    }
    
    // Sort by confidence (highest first)
    return detections.sort((a, b) => b.confidence - a.confidence)
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms)
      
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new Error('Operation aborted'))
        })
      }
    })
  }

  private generateMockOCRResults(filename: string): OCRResult[] {
    const results: OCRResult[] = []
    
    // Generate different content based on file type
    if (filename.toLowerCase().includes('safety') || filename.toLowerCase().includes('nr')) {
      // Enhanced NR-related content for better detection
      const nrContents = [
        {
          id: 'ocr-1',
          text: 'NORMA REGULAMENTADORA NR-12',
          confidence: 0.95,
          boundingBox: { x: 100, y: 50, width: 300, height: 40 },
          language: 'pt',
          metadata: { type: 'title', importance: 'high', nrNumber: 'NR-12' }
        },
        {
          id: 'ocr-2',
          text: 'Segurança no Trabalho em Máquinas e Equipamentos',
          confidence: 0.92,
          boundingBox: { x: 100, y: 100, width: 400, height: 30 },
          language: 'pt',
          metadata: { type: 'subtitle', importance: 'medium' }
        },
        {
          id: 'ocr-3',
          text: 'Esta norma tem por objetivo garantir a segurança e a saúde dos trabalhadores que interagem com máquinas e equipamentos.',
          confidence: 0.88,
          boundingBox: { x: 100, y: 150, width: 500, height: 60 },
          language: 'pt',
          metadata: { type: 'content', importance: 'medium' }
        },
        {
          id: 'ocr-4',
          text: 'Equipamentos de Proteção Individual (EPI) são obrigatórios conforme NR-06',
          confidence: 0.90,
          boundingBox: { x: 100, y: 220, width: 450, height: 30 },
          language: 'pt',
          metadata: { type: 'content', importance: 'high', nrNumber: 'NR-06' }
        },
        {
          id: 'ocr-5',
          text: 'Trabalho em altura requer treinamento específico segundo NR-35',
          confidence: 0.87,
          boundingBox: { x: 100, y: 260, width: 400, height: 30 },
          language: 'pt',
          metadata: { type: 'content', importance: 'high', nrNumber: 'NR-35' }
        },
        {
          id: 'ocr-6',
          text: 'Princípios de ergonomia devem ser aplicados conforme NR-17',
          confidence: 0.85,
          boundingBox: { x: 100, y: 300, width: 380, height: 30 },
          language: 'pt',
          metadata: { type: 'content', importance: 'medium', nrNumber: 'NR-17' }
        }
      ]
      results.push(...nrContents)
    } else if (filename.toLowerCase().includes('epi') || filename.toLowerCase().includes('proteção')) {
      results.push(
        {
          id: 'ocr-1',
          text: 'Equipamento de Proteção Individual - NR-06',
          confidence: 0.94,
          boundingBox: { x: 120, y: 60, width: 350, height: 35 },
          language: 'pt',
          metadata: { type: 'title', importance: 'high', nrNumber: 'NR-06' }
        },
        {
          id: 'ocr-2',
          text: 'Todo equipamento de proteção individual deve ser aprovado pelo órgão competente',
          confidence: 0.89,
          boundingBox: { x: 120, y: 110, width: 480, height: 40 },
          language: 'pt',
          metadata: { type: 'content', importance: 'high' }
        }
      )
    } else {
      results.push(
        {
          id: 'ocr-1',
          text: 'Business Presentation',
          confidence: 0.93,
          boundingBox: { x: 150, y: 80, width: 250, height: 35 },
          language: 'en',
          metadata: { type: 'title', importance: 'high' }
        },
        {
          id: 'ocr-2',
          text: 'Key Performance Indicators',
          confidence: 0.90,
          boundingBox: { x: 150, y: 120, width: 300, height: 25 },
          language: 'en',
          metadata: { type: 'subtitle', importance: 'medium' }
        },
        {
          id: 'ocr-3',
          text: 'Our quarterly results show significant improvement across all metrics...',
          confidence: 0.85,
          boundingBox: { x: 150, y: 160, width: 450, height: 80 },
          language: 'en',
          metadata: { type: 'content', importance: 'medium' }
        }
      )
    }

    return results
  }

  // Utility methods for OCR result processing
  static filterByConfidence(results: OCRResult[], minConfidence: number): OCRResult[] {
    return results.filter(result => result.confidence >= minConfidence)
  }

  static extractByType(results: OCRResult[], type: string): OCRResult[] {
    return results.filter(result => result.metadata?.type === type)
  }

  static combineTextResults(results: OCRResult[]): string {
    return results
      .sort((a, b) => a.boundingBox.y - b.boundingBox.y)
      .map(result => result.text)
      .join(' ')
  }

  static calculateAverageConfidence(results: OCRResult[]): number {
    if (results.length === 0) return 0
    const total = results.reduce((sum, result) => sum + result.confidence, 0)
    return total / results.length
  }
  
  // NR Detection utility methods
  static filterNRByCategory(detections: NRDetectionResult[], category: string): NRDetectionResult[] {
    return detections.filter(detection => detection.category === category)
  }
  
  static getHighPriorityNRs(detections: NRDetectionResult[]): NRDetectionResult[] {
    return detections.filter(detection => detection.priority === 'high')
  }
  
  static getNRSummary(detections: NRDetectionResult[]): {
    total: number
    byCategory: Record<string, number>
    byPriority: Record<string, number>
    averageConfidence: number
  } {
    const summary = {
      total: detections.length,
      byCategory: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      averageConfidence: 0
    }
    
    if (detections.length === 0) return summary
    
    // Count by category
    detections.forEach(detection => {
      summary.byCategory[detection.category] = (summary.byCategory[detection.category] || 0) + 1
      summary.byPriority[detection.priority] = (summary.byPriority[detection.priority] || 0) + 1
    })
    
    // Calculate average confidence
    const totalConfidence = detections.reduce((sum, detection) => sum + detection.confidence, 0)
    summary.averageConfidence = totalConfidence / detections.length
    
    return summary
  }
}

export const ocrService = new OCRService()
export default ocrService