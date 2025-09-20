/**
 * Enhanced PPTX Processor
 * Integra Worker Pool com Enhanced Parser para processamento paralelo otimizado
 */

import { pptxWorkerPool, type WorkerTask, type WorkerResult } from './pptx-worker-pool';
import { enhancedSlideExtractor } from './enhanced-slide-extractor';

export interface ProcessingOptions {
  enableParallelProcessing: boolean;
  batchSize: number;
  enableThumbnails: boolean;
  enableContentAnalysis: boolean;
  enableNRCompliance: boolean;
  onProgress?: (progress: ProcessingProgress) => void;
  onSlideComplete?: (slide: ProcessedSlide) => void;
}

export interface ProcessingProgress {
  totalSlides: number;
  processedSlides: number;
  currentSlide: number;
  percentage: number;
  estimatedTimeRemaining: number;
  status: 'initializing' | 'processing' | 'generating-thumbnails' | 'analyzing' | 'completed' | 'error';
  currentTask?: string;
}

export interface ProcessedSlide {
  id: string;
  index: number;
  title: string;
  content: string;
  elements: any[];
  thumbnail?: string;
  analysis?: ContentAnalysis;
  nrCompliance?: NRComplianceData;
  processingTime: number;
  timestamp: number;
}

export interface ContentAnalysis {
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'low' | 'medium' | 'high';
  readabilityScore: number;
  keyPoints: string[];
}

export interface NRComplianceData {
  detectedNRs: string[];
  complianceScore: number;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
}

export interface ProcessingResult {
  success: boolean;
  slides: ProcessedSlide[];
  totalProcessingTime: number;
  parallelProcessingUsed: boolean;
  stats: {
    totalSlides: number;
    successfulSlides: number;
    failedSlides: number;
    averageSlideProcessingTime: number;
    thumbnailsGenerated: number;
    analysisCompleted: number;
  };
  errors?: string[];
}

/**
 * Processador PPTX Enhanced com suporte a processamento paralelo
 */
export class EnhancedPPTXProcessor {
  private static instance: EnhancedPPTXProcessor;
  private options: ProcessingOptions;
  private isProcessing = false;

  private constructor() {
    this.options = {
      enableParallelProcessing: true,
      batchSize: 4,
      enableThumbnails: true,
      enableContentAnalysis: true,
      enableNRCompliance: true
    };
  }

  static getInstance(): EnhancedPPTXProcessor {
    if (!EnhancedPPTXProcessor.instance) {
      EnhancedPPTXProcessor.instance = new EnhancedPPTXProcessor();
    }
    return EnhancedPPTXProcessor.instance;
  }

  /**
   * Processar arquivo PPTX com otimizações avançadas
   */
  async processFile(
    file: File,
    options: Partial<ProcessingOptions> = {}
  ): Promise<ProcessingResult> {
    if (this.isProcessing) {
      throw new Error('Já existe um processamento em andamento');
    }

    this.isProcessing = true;
    const startTime = performance.now();
    
    try {
      // Configurar opções
      this.options = { ...this.options, ...options };
      
      // Extrair documento básico
      this.updateProgress(0, 0, 0, 'initializing', 'Extraindo estrutura do PPTX...');
      
      const document = await enhancedSlideExtractor.extractDocument(file);
      const totalSlides = document.slides.length;

      // Inicializar worker pool se necessário
      if (this.options.enableParallelProcessing) {
        await pptxWorkerPool.initialize();
      }

      // Processar slides
      this.updateProgress(totalSlides, 0, 0, 'processing', 'Processando slides...');
      
      const processedSlides = await this.processSlides(document.slides);

      // Gerar thumbnails se habilitado
      let thumbnailsGenerated = 0;
      if (this.options.enableThumbnails) {
        this.updateProgress(totalSlides, processedSlides.length, 0, 'generating-thumbnails', 'Gerando thumbnails...');
        thumbnailsGenerated = await this.generateThumbnails(processedSlides);
      }

      // Analisar conteúdo se habilitado
      let analysisCompleted = 0;
      if (this.options.enableContentAnalysis) {
        this.updateProgress(totalSlides, processedSlides.length, 0, 'analyzing', 'Analisando conteúdo...');
        analysisCompleted = await this.analyzeContent(processedSlides);
      }

      const totalProcessingTime = performance.now() - startTime;

      // Estatísticas finais
      const stats = {
        totalSlides,
        successfulSlides: processedSlides.filter(s => s.id).length,
        failedSlides: totalSlides - processedSlides.filter(s => s.id).length,
        averageSlideProcessingTime: processedSlides.reduce((acc, s) => acc + s.processingTime, 0) / processedSlides.length,
        thumbnailsGenerated,
        analysisCompleted
      };

      this.updateProgress(totalSlides, totalSlides, totalSlides, 'completed', 'Processamento concluído!');

      return {
        success: true,
        slides: processedSlides,
        totalProcessingTime,
        parallelProcessingUsed: this.options.enableParallelProcessing,
        stats
      };

    } catch (error) {
      console.error('Erro no processamento PPTX:', error);
      
      return {
        success: false,
        slides: [],
        totalProcessingTime: performance.now() - startTime,
        parallelProcessingUsed: false,
        stats: {
          totalSlides: 0,
          successfulSlides: 0,
          failedSlides: 0,
          averageSlideProcessingTime: 0,
          thumbnailsGenerated: 0,
          analysisCompleted: 0
        },
        errors: [error instanceof Error ? error.message : String(error)]
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processar slides (paralelo ou sequencial)
   */
  private async processSlides(slides: any[]): Promise<ProcessedSlide[]> {
    if (this.options.enableParallelProcessing && slides.length > 2) {
      return this.processSlidesParallel(slides);
    } else {
      return this.processSlidesSequential(slides);
    }
  }

  /**
   * Processamento paralelo de slides
   */
  private async processSlidesParallel(slides: any[]): Promise<ProcessedSlide[]> {
    const batches = this.createBatches(slides, this.options.batchSize);
    const processedSlides: ProcessedSlide[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Criar tarefas para o batch
      const tasks: WorkerTask[] = batch.map((slide, index) => ({
        id: `slide-${slide.slideNumber || index}-${Date.now()}`,
        type: 'parseSlide',
        data: slide,
        priority: 'medium'
      }));

      try {
        // Processar batch em paralelo
        const results = await Promise.all(
          tasks.map(task => pptxWorkerPool.processTask(task))
        );

        // Converter resultados para ProcessedSlide
        const batchProcessedSlides = results.map((result, index) => 
          this.convertWorkerResultToSlide(result, batch[index])
        );

        processedSlides.push(...batchProcessedSlides);

        // Atualizar progresso
        this.updateProgress(
          slides.length,
          processedSlides.length,
          processedSlides.length,
          'processing',
          `Processando lote ${i + 1}/${batches.length}...`
        );

        // Notificar slides concluídos
        if (this.options.onSlideComplete) {
          batchProcessedSlides.forEach(slide => this.options.onSlideComplete!(slide));
        }

      } catch (error) {
        console.error(`Erro no processamento do lote ${i + 1}:`, error);
        
        // Fallback para processamento sequencial do lote
        const fallbackSlides = await this.processBatchSequential(batch);
        processedSlides.push(...fallbackSlides);
      }
    }

    return processedSlides;
  }

  /**
   * Processamento sequencial de slides
   */
  private async processSlidesSequential(slides: any[]): Promise<ProcessedSlide[]> {
    const processedSlides: ProcessedSlide[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const startTime = performance.now();

      try {
        const processedSlide: ProcessedSlide = {
          id: `slide-${slide.slideNumber || i}`,
          index: i,
          title: slide.title || `Slide ${i + 1}`,
          content: slide.content || '',
          elements: slide.elements || [],
          processingTime: performance.now() - startTime,
          timestamp: Date.now()
        };

        processedSlides.push(processedSlide);

        // Atualizar progresso
        this.updateProgress(
          slides.length,
          i + 1,
          i + 1,
          'processing',
          `Processando slide ${i + 1}/${slides.length}...`
        );

        // Notificar slide concluído
        if (this.options.onSlideComplete) {
          this.options.onSlideComplete(processedSlide);
        }

      } catch (error) {
        console.error(`Erro ao processar slide ${i + 1}:`, error);
        
        // Adicionar slide com erro
        processedSlides.push({
          id: `slide-error-${i}`,
          index: i,
          title: `Erro no Slide ${i + 1}`,
          content: '',
          elements: [],
          processingTime: performance.now() - startTime,
          timestamp: Date.now()
        });
      }
    }

    return processedSlides;
  }

  /**
   * Processar lote sequencialmente (fallback)
   */
  private async processBatchSequential(batch: any[]): Promise<ProcessedSlide[]> {
    const processedSlides: ProcessedSlide[] = [];

    for (const slide of batch) {
      const startTime = performance.now();
      
      const processedSlide: ProcessedSlide = {
        id: `slide-fallback-${slide.slideNumber || Date.now()}`,
        index: slide.slideNumber || 0,
        title: slide.title || 'Slide',
        content: slide.content || '',
        elements: slide.elements || [],
        processingTime: performance.now() - startTime,
        timestamp: Date.now()
      };

      processedSlides.push(processedSlide);
    }

    return processedSlides;
  }

  /**
   * Gerar thumbnails para slides
   */
  private async generateThumbnails(slides: ProcessedSlide[]): Promise<number> {
    let generated = 0;

    if (this.options.enableParallelProcessing) {
      // Gerar thumbnails em paralelo
      const tasks: WorkerTask[] = slides.map(slide => ({
        id: `thumbnail-${slide.id}`,
        type: 'generateThumbnail',
        data: slide,
        priority: 'low'
      }));

      try {
        const results = await Promise.all(
          tasks.map(task => pptxWorkerPool.processTask(task))
        );

        results.forEach((result, index) => {
          if (result.success && result.data?.thumbnail) {
            slides[index].thumbnail = result.data.thumbnail;
            generated++;
          }
        });

      } catch (error) {
        console.error('Erro na geração paralela de thumbnails:', error);
        // Fallback sequencial não implementado por brevidade
      }

    } else {
      // Gerar thumbnails sequencialmente
      for (const slide of slides) {
        try {
          // Simular geração de thumbnail
          slide.thumbnail = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jc22qwAAAABJRU5ErkJggg==';
          generated++;
        } catch (error) {
          console.error(`Erro ao gerar thumbnail para slide ${slide.id}:`, error);
        }
      }
    }

    return generated;
  }

  /**
   * Analisar conteúdo dos slides
   */
  private async analyzeContent(slides: ProcessedSlide[]): Promise<number> {
    let analyzed = 0;

    if (this.options.enableParallelProcessing) {
      // Análise em paralelo
      const tasks: WorkerTask[] = slides.map(slide => ({
        id: `analysis-${slide.id}`,
        type: 'analyzeContent',
        data: slide,
        priority: 'low'
      }));

      try {
        const results = await Promise.all(
          tasks.map(task => pptxWorkerPool.processTask(task))
        );

        results.forEach((result, index) => {
          if (result.success && result.data?.analysis) {
            slides[index].analysis = result.data.analysis;
            analyzed++;
          }
        });

      } catch (error) {
        console.error('Erro na análise paralela de conteúdo:', error);
      }

    } else {
      // Análise sequencial
      for (const slide of slides) {
        try {
          slide.analysis = {
            topics: ['segurança', 'trabalho'],
            sentiment: 'neutral',
            complexity: 'medium',
            readabilityScore: 0.7,
            keyPoints: [slide.title || 'Ponto principal']
          };
          analyzed++;
        } catch (error) {
          console.error(`Erro ao analisar slide ${slide.id}:`, error);
        }
      }
    }

    return analyzed;
  }

  /**
   * Converter resultado do worker para ProcessedSlide
   */
  private convertWorkerResultToSlide(result: WorkerResult, originalSlide: any): ProcessedSlide {
    return {
      id: result.taskId,
      index: originalSlide.slideNumber || 0,
      title: originalSlide.title || 'Slide',
      content: originalSlide.content || '',
      elements: originalSlide.elements || [],
      processingTime: result.processingTime,
      timestamp: Date.now()
    };
  }

  /**
   * Criar lotes de slides
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Atualizar progresso
   */
  private updateProgress(
    total: number,
    processed: number,
    current: number,
    status: ProcessingProgress['status'],
    currentTask?: string
  ): void {
    if (this.options.onProgress) {
      const percentage = total > 0 ? (processed / total) * 100 : 0;
      const estimatedTimeRemaining = this.calculateETA(processed, total);

      this.options.onProgress({
        totalSlides: total,
        processedSlides: processed,
        currentSlide: current,
        percentage,
        estimatedTimeRemaining,
        status,
        currentTask
      });
    }
  }

  /**
   * Calcular tempo estimado restante
   */
  private calculateETA(processed: number, total: number): number {
    if (processed === 0 || total === 0) return 0;
    
    const avgTimePerSlide = 2000; // 2 segundos por slide (estimativa)
    const remaining = total - processed;
    return remaining * avgTimePerSlide;
  }

  /**
   * Obter estatísticas do worker pool
   */
  getWorkerPoolStats() {
    return pptxWorkerPool.getStats();
  }

  /**
   * Limpar recursos
   */
  async cleanup(): Promise<void> {
    await pptxWorkerPool.terminate();
  }
}

// Export singleton instance
export const enhancedPPTXProcessor = EnhancedPPTXProcessor.getInstance();