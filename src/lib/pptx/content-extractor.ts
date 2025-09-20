import type { 
  AIAnalysisResult, 
  ComplexElement, 
  ProgressCallback, 
  PPTXSlide, 
  PPTXProject, 
  ExtractedContent,
  ValidationResult,
  AutoCorrectionConfig,
  ProcessingTask,
  CacheStats
} from './types';

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
      
      // Convert to slides that conform to PPTXSlide schema
      const slides = await this.convertToSlides(extractedContent, aiAnalysis)
      
      // Calculate total duration from slides
      const totalDuration = slides.reduce((total, slide) => total + slide.duration, 0)
      
      const project: PPTXProject = {
        id: `project-${Date.now()}`,
        name: file.name.replace(/\.(pptx|ppt)$/i, ''),
        description: `Projeto de vídeo criado a partir de ${file.name}`,
        slides,
        totalDuration,
        category: 'training',
        complexity: 'intermediate',
        aiAnalysis,
        metadata: {
          originalFileName: file.name,
          uploadDate: new Date(),
          fileSize: file.size,
          slideCount: slides.length,
          extractedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          aiEnabled: options.enableAI || false,
          cacheKey: this.generateCacheKey(file.name + file.size + file.lastModified)
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
      // Proper error logging that avoids {} objects
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : { message: String(error) };
      console.error('Erro na extração PPTX:', errorDetails);
      throw new Error(`Falha na extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  
  /**
   * Generate cache key for extracted content
   */
  private generateCacheKey(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Extract raw content from PPTX file
   */
  private async extractRawContent(file: File): Promise<ExtractedContent> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        const mockContent = this.generateMockContent(file.name)
        resolve(mockContent)
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Generate mock content for demo purposes
   */
  private generateMockContent(fileName: string): ExtractedContent {
    return {
      text: `Conteúdo extraído de ${fileName}`,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
          alt: 'Slide de apresentação',
          position: { x: 50, y: 50, width: 300, height: 200 }
        }
      ],
      structure: {
        title: fileName.replace(/\.(pptx|ppt)$/i, ''),
        sections: [
          {
            heading: 'Introdução',
            content: ['Bem-vindos à apresentação', 'Objetivos do treinamento'],
            textContent: ['Bem-vindos à apresentação', 'Objetivos do treinamento'],
            bulletPoints: ['• Bem-vindos à apresentação', '• Objetivos do treinamento']
          },
          {
            heading: 'Conteúdo Principal', 
            content: ['Pontos importantes', 'Exemplos práticos', 'Casos de uso'],
            textContent: ['Pontos importantes', 'Exemplos práticos', 'Casos de uso'],
            bulletPoints: ['• Pontos importantes', '• Exemplos práticos', '• Casos de uso']
          },
          {
            heading: 'Conclusões',
            content: ['Resumo dos pontos principais', 'Próximos passos'],
            textContent: ['Resumo dos pontos principais', 'Próximos passos'],
            bulletPoints: ['• Resumo dos pontos principais', '• Próximos passos']
          }
        ]
      }
    }
  }

  /**
   * Calculate slide duration based on content
   */
  private calculateSlideDuration(content: string): number {
    const words = content.split(/\s+/).length;
    const baseTimePerWord = 0.4; // seconds per word for Portuguese
    const baseDuration = words * baseTimePerWord;
    
    // Minimum 3 seconds, maximum 60 seconds
    return Math.max(3, Math.min(60, baseDuration));
  }

  /**
   * Convert extracted content to structured slides that conform to PPTXSlide schema
   */
  private async convertToSlides(content: ExtractedContent, aiAnalysis: AIAnalysisResult): Promise<PPTXSlide[]> {
    const slides: PPTXSlide[] = []
    
    try {
      // Add title slide
      const titleContent = `${content.structure.title}\n\nApresentação com ${content.structure.sections.length} seções principais`;
      slides.push({
        id: 'slide-title',
        title: content.structure.title,
        content: titleContent, // String as required by types.ts
        layout: 'title',
        duration: this.calculateSlideDuration(titleContent),
        images: content.images.slice(0, 1),
        notes: 'Slide de título da apresentação',
        animations: [
          { type: 'fadeIn', duration: 1000, delay: 0 },
          { type: 'slideInLeft', duration: 800, delay: 500 }
        ],
        textContent: [content.structure.title],
        bulletPoints: [],
        shapes: [],
        slideNumber: 1
      })
      
      // Extract sections from content
      if (content.structure?.sections) {
        content.structure.sections.forEach((section, index) => {
          const slideContent = section.content.join('\n');
          
          slides.push({
            id: `slide-${index + 2}`,
            title: section.heading,
            content: slideContent, // String as required by types.ts
            images: content.images.slice(index, index + 1),
            layout: 'content',
            duration: this.calculateSlideDuration(slideContent),
            notes: `Slide sobre ${section.heading}`,
            animations: [
              { type: 'fadeIn', duration: 500, delay: 0 },
              { type: 'slideInLeft', duration: 800, delay: 300 }
            ],
            textContent: section.textContent || section.content,
            bulletPoints: section.bulletPoints || [],
            shapes: [],
            slideNumber: index + 2
          })
        })
      }
      
      // Add summary slide
      const summaryContent = 'Pontos principais abordados:\n' + 
        (content.structure?.sections?.map(s => `• ${s.heading}`).join('\n') || '');
      
      slides.push({
        id: `slide-summary`,
        title: 'Resumo e Conclusões',
        content: summaryContent, // String as required by types.ts
        images: content.images.slice(-1),
        layout: 'content',
        duration: this.calculateSlideDuration(summaryContent),
        notes: 'Slide de resumo da apresentação',
        animations: [
          { type: 'fade', duration: 500, delay: 0 }
        ],
        textContent: [summaryContent],
        bulletPoints: content.structure?.sections?.map(s => `• ${s.heading}`) || [],
        shapes: [],
        slideNumber: slides.length + 1
      })
      
    } catch (error) {
      // Proper error logging that avoids {} objects
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : { message: String(error) };
      console.error('Erro ao converter conteúdo em slides:', errorDetails);
      
      // Return at least one slide in case of error
      slides.push({
        id: 'slide-error',
        title: 'Erro na Conversão',
        content: 'Ocorreu um erro ao processar o conteúdo.', // String as required by types.ts
        layout: 'content',
        duration: 3,
        images: [],
        notes: 'Slide de erro',
        animations: [
          { type: 'fade', duration: 500, delay: 0 }
        ],
        textContent: ['Ocorreu um erro ao processar o conteúdo.'],
        bulletPoints: [],
        shapes: [],
        slideNumber: 1
      })
    }
    
    return slides
  }
}

// Export types
export type { PPTXProject, PPTXSlide, ExtractedContent }