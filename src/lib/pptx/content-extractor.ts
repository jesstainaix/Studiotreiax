import { analyzePPTXWithGPT4Vision, analyzeTextContent } from '../ai/vision-analysis'
import type { AIAnalysisResult } from '../ai/vision-analysis'
import { PPTXParserService } from '../../services/pptx-parser-service';
import { EnhancedSlideExtractor } from './enhanced-slide-extractor';
import { SlideDataValidator, ValidationResult, validateSlideExtraction, generateExtractionReport } from './slide-data-validator';
import { AutoCorrectionService, validateAndAutoCorrect, AutoCorrectionConfig } from './auto-correction-service';
import { ParallelProcessor, ProcessingTask, processSlidesBatch } from './parallel-processor';
import { ProgressTracker, createPPTXExtractionSteps, ProgressCallback } from './progress-tracker';
import { MultiLayerCache, initializeCache, cacheSlideData, getCachedSlideData, CacheStats } from './multi-layer-cache';
import { ComplexElementsExtractor, extractComplexElements, type ComplexElement, type ExtractionResult as ComplexExtractionResult } from './complex-elements-extractor';

export interface PPTXSlide {
  id: string
  title: string
  content: string
  imageUrl?: string
  images?: Array<{
    url: string
    alt: string
    position?: { x: number; y: number; width: number; height: number }
    width?: number
    height?: number
  }>
  notes?: string
  layout: 'title' | 'content' | 'image' | 'mixed'
  duration: number // in seconds
  textContent?: string[]
  bulletPoints?: string[]
  shapes?: Array<{ type: string; content: string }>
  slideNumber?: number
  complexElements?: ComplexElement[]
  complexElementsMetadata?: {
    extractionTime: number
    totalElements: number
    elementTypes: Record<string, number>
    errors: number
    warnings: number
  }
}

interface PPTXProject {
  id: string
  title: string
  description: string
  slides: PPTXSlide[]
  totalDuration: number
  category: string
  complexity: 'basic' | 'intermediate' | 'advanced'
  aiAnalysis: AIAnalysisResult
  metadata: {
    originalFileName: string
    uploadDate: Date
    fileSize: number
    slideCount: number
    validation?: {
      isValid: boolean
      errorsCount: number
      warningsCount: number
      extractedElements: {
        titles: number
        textContent: number
        images: number
        bulletPoints: number
        shapes: number
      }
      missingData: string[]
    }
    autoCorrection?: {
      applied: boolean
      correctionsCount: number
      corrections: string[]
      confidence: number
    }
  }
}

interface ExtractedContent {
  text: string
  images: Array<{
    url: string
    alt: string
    position?: { x: number; y: number; width: number; height: number }
  }>
  structure: {
    title: string
    sections: Array<{
      heading: string
      content: string[]
      images?: Array<{
        url: string
        alt: string
        position?: { x: number; y: number; width: number; height: number }
      }>
      textContent?: string[]
      bulletPoints?: string[]
      shapes?: Array<{ type: string; content: string }>
    }>
  }
}

/**
 * Enhanced PPTX content extractor with AI analysis
 */
export class PPTXContentExtractor {
  private static instance: PPTXContentExtractor
  
  static getInstance(): PPTXContentExtractor {
    if (!PPTXContentExtractor.instance) {
      PPTXContentExtractor.instance = new PPTXContentExtractor()
    }
    return PPTXContentExtractor.instance
  }

  /**
   * Extract and analyze PPTX content
   */
  async extractContent(
    file: File,
    options: {
      enableAI?: boolean;
      aiModel?: string;
      preserveFormatting?: boolean;
      extractImages?: boolean;
      maxSlides?: number;
      onProgress?: ProgressCallback;
      useCache?: boolean;
      cacheKey?: string;
    } = {}
  ): Promise<PPTXProject> {
    try {
      const startTime = Date.now()
      
      // Extract raw content from file
      const extractedContent = await this.extractRawContent(file)
      
      // Generate AI analysis if enabled
      let aiAnalysis: AIAnalysisResult = {
        suggestions: [],
        improvements: [],
        qualityScore: 0.8
      }
      
      if (options.enableAI) {
        // In production, this would call actual AI services
        aiAnalysis = {
          suggestions: [
            'Adicionar mais elementos visuais',
            'Melhorar contraste de cores',
            'Simplificar texto complexo'
          ],
          improvements: [
            'Usar fontes mais legíveis',
            'Adicionar animações suaves',
            'Otimizar layout para mobile'
          ],
          qualityScore: 0.85
        }
      }
      
      // Convert to slides
      const slides = await this.convertToSlides(extractedContent, aiAnalysis)
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(file.name + file.size + file.lastModified)
      
      const project: PPTXProject = {
        id: `project-${Date.now()}`,
        name: file.name.replace('.pptx', ''),
        slides,
        metadata: {
          originalFile: file.name,
          extractedAt: new Date().toISOString(),
          slideCount: slides.length,
          processingTime: Date.now() - startTime,
          aiEnabled: options.enableAI || false,
          cacheKey
        },
        settings: {
          theme: 'default',
          transitions: true,
          animations: true
        }
      }
      
      // Call progress callback if provided
      if (options.onProgress) {
        options.onProgress(100, 'Extração concluída')
      }
      
      return project
      
    } catch (error) {
      console.error('Erro na extração PPTX:', error)
      throw new Error(`Falha na extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  
  /**
   * Generate cache key for extracted content
   */
  private generateCacheKey(fileInfo: string): string {
    let hash = 0
    for (let i = 0; i < fileInfo.length; i++) {
      const char = fileInfo.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Converte para 32bit integer
    }
    
    return `pptx-extraction-${Math.abs(hash).toString(36)}`
  }

  /**
   * Extract raw content from PPTX file
   */
  private async extractRawContent(file: File): Promise<ExtractedContent> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          // In production, this would use libraries like:
          // - pptx-parser for Node.js
          // - Office.js for browser-based extraction
          // - mammoth.js for document conversion
          
          // Simulate content extraction with enhanced mock data
          const mockContent = this.generateMockContent(file.name)
          
          // Add processing delay to simulate real extraction
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          resolve(mockContent)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Falha na leitura do arquivo'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Generate enhanced mock content based on filename
   */
  private generateMockContent(fileName: string): ExtractedContent {
    const fileNameLower = fileName.toLowerCase()
    
    // Detect content type from filename
    let contentType = 'general'
    if (fileNameLower.includes('nr-10') || fileNameLower.includes('eletric')) {
      contentType = 'electrical'
    } else if (fileNameLower.includes('nr-35') || fileNameLower.includes('altura')) {
      contentType = 'height'
    } else if (fileNameLower.includes('nr-06') || fileNameLower.includes('epi')) {
      contentType = 'epi'
    } else if (fileNameLower.includes('nr-18') || fileNameLower.includes('construc')) {
      contentType = 'construction'
    }
    
    const contentTemplates = {
      electrical: {
        title: 'Segurança em Instalações Elétricas - NR-10',
        sections: [
          {
            heading: 'Introdução à NR-10',
            content: [
              'Objetivo da norma regulamentadora',
              'Campo de aplicação',
              'Responsabilidades do empregador e trabalhador'
            ]
          },
          {
            heading: 'Riscos Elétricos',
            content: [
              'Choque elétrico e seus efeitos',
              'Arco elétrico e queimaduras',
              'Campos eletromagnéticos',
              'Incêndios e explosões'
            ]
          },
          {
            heading: 'Medidas de Proteção',
            content: [
              'Desenergização de circuitos',
              'Aterramento e equipotencialização',
              'Seccionamento automático',
              'Dispositivos de proteção'
            ]
          },
          {
            heading: 'EPIs e EPCs',
            content: [
              'Capacetes dielétricos',
              'Luvas isolantes',
              'Calçados de segurança',
              'Detectores de tensão'
            ]
          }
        ]
      },
      height: {
        title: 'Trabalho em Altura - NR-35',
        sections: [
          {
            heading: 'Conceitos Fundamentais',
            content: [
              'Definição de trabalho em altura',
              'Análise de risco',
              'Permissão de trabalho',
              'Supervisão e responsabilidades'
            ]
          },
          {
            heading: 'Sistemas de Proteção',
            content: [
              'Cinturão de segurança tipo paraquedista',
              'Trava-quedas',
              'Pontos de ancoragem',
              'Linhas de vida'
            ]
          },
          {
            heading: 'Procedimentos Seguros',
            content: [
              'Inspeção de equipamentos',
              'Técnicas de movimentação',
              'Resgate em altura',
              'Primeiros socorros'
            ]
          }
        ]
      },
      epi: {
        title: 'Equipamentos de Proteção Individual - NR-06',
        sections: [
          {
            heading: 'Tipos de EPIs',
            content: [
              'Proteção da cabeça',
              'Proteção dos olhos e face',
              'Proteção respiratória',
              'Proteção das mãos e braços',
              'Proteção dos pés e pernas'
            ]
          },
          {
            heading: 'Seleção e Uso',
            content: [
              'Análise de riscos',
              'Certificado de Aprovação (CA)',
              'Treinamento para uso',
              'Manutenção e conservação'
            ]
          }
        ]
      },
      construction: {
        title: 'Segurança na Construção Civil - NR-18',
        sections: [
          {
            heading: 'Organização do Canteiro',
            content: [
              'Layout e sinalização',
              'Áreas de vivência',
              'Instalações elétricas provisórias',
              'Proteção contra incêndio'
            ]
          },
          {
            heading: 'Equipamentos e Ferramentas',
            content: [
              'Andaimes e plataformas',
              'Escadas e rampas',
              'Máquinas e equipamentos',
              'Ferramentas manuais'
            ]
          }
        ]
      },
      general: {
        title: 'Segurança do Trabalho - Conceitos Gerais',
        sections: [
          {
            heading: 'Fundamentos da Segurança',
            content: [
              'Conceitos básicos de SST',
              'Legislação trabalhista',
              'Cultura de segurança',
              'Prevenção de acidentes'
            ]
          },
          {
            heading: 'Identificação de Riscos',
            content: [
              'Tipos de riscos ocupacionais',
              'Mapa de riscos',
              'Análise preliminar de riscos',
              'Medidas preventivas'
            ]
          }
        ]
      }
    }
    
    const template = contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.general
    
    return {
      text: template.sections.map(section => 
        `${section.heading}\n${section.content.join('\n')}`
      ).join('\n\n'),
      images: this.generateMockImages(template.sections.length),
      structure: {
        title: template.title,
        sections: template.sections
      }
    }
  }

  /**
   * Generate mock images with complete metadata for slides
   */
  private generateMockImages(count: number): Array<{
    url: string
    alt: string
    position?: { x: number; y: number; width: number; height: number }
  }> {
    const images: Array<{
      url: string
      alt: string
      position?: { x: number; y: number; width: number; height: number }
    }> = []
    
    for (let i = 0; i < count; i++) {
      // Generate different image types based on content
      const imageTypes = ['diagram', 'equipment', 'procedure', 'warning']
      const imageType = imageTypes[i % imageTypes.length]
      
      images.push({
        url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`safety training ${imageType} illustration professional style`)}&image_size=landscape_16_9`,
        alt: `Ilustração de ${imageType} para treinamento de segurança`,
        position: {
          x: 100 + (i * 50), // Simulate different positions
          y: 100 + (i * 30),
          width: 400,
          height: 300
        }
      })
    }
    return images
  }

  /**
   * Convert extracted content to structured slides with complete data mapping
   */
  private async convertToSlides(content: ExtractedContent, aiAnalysis: AIAnalysisResult): Promise<PPTXSlide[]> {
    const slides: PPTXSlide[] = []
    
    try {
      // Create title slide
      slides.push({
        id: 'slide-0',
        title: content.structure?.title || 'Apresentação de Segurança',
        content: {
          text: content.structure?.title || 'Treinamento de Segurança do Trabalho',
          images: content.images.slice(0, 1),
          layout: 'title'
        },
        notes: 'Slide de abertura da apresentação',
        animations: [],
        transitions: { type: 'fade', duration: 500 }
      })
      
      // Create content slides from sections
      if (content.structure?.sections) {
        content.structure.sections.forEach((section, index) => {
          slides.push({
            id: `slide-${index + 1}`,
            title: section.heading,
            content: {
              text: section.content.join('\n'),
              images: content.images.slice(index, index + 1),
              layout: 'content'
            },
            notes: `Slide sobre ${section.heading}`,
            animations: [
              { type: 'fadeIn', target: 'title', delay: 0 },
              { type: 'slideInLeft', target: 'content', delay: 300 }
            ],
            transitions: { type: 'slide', duration: 600 }
          })
        })
      }
      
      // Add summary slide
      slides.push({
        id: `slide-${slides.length}`,
        title: 'Resumo e Conclusões',
        content: {
          text: 'Pontos principais abordados:\n' + 
                (content.structure?.sections?.map(s => `• ${s.heading}`).join('\n') || ''),
          images: content.images.slice(-1),
          layout: 'summary'
        },
        notes: 'Slide de resumo da apresentação',
        animations: [],
        transitions: { type: 'fade', duration: 500 }
      })
      
    } catch (error) {
      console.error('Erro ao converter conteúdo em slides:', error)
      // Return at least one slide in case of error
      slides.push({
        id: 'slide-error',
        title: 'Erro na Conversão',
        content: {
          text: 'Ocorreu um erro ao processar o conteúdo.',
          images: [],
          layout: 'error'
        },
        notes: 'Slide de erro',
        animations: [],
        transitions: { type: 'fade', duration: 500 }
      })
    }
    
    return slides
  }
}

// Export types
export type { PPTXProject, PPTXSlide, ExtractedContent }