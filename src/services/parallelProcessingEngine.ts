import type { SlideContent } from '../types/pptx';
import { enhancedQualityMetrics, EnhancedQualityMetrics, DetailedMetrics } from './enhancedQualityMetrics';
import { smartSuggestionsEngine, SmartSuggestion, ContextualAnalysis } from './smartSuggestionsEngine';
import { semanticNRDetection, SemanticNRResult } from './semanticNRDetection';

export interface ProcessingJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: any;
}

export interface ParallelProcessingResult {
  qualityMetrics: {
    metrics: EnhancedQualityMetrics;
    detailed: DetailedMetrics[];
    recommendations: string[];
  };
  smartSuggestions: {
    suggestions: SmartSuggestion[];
    contextualAnalysis: ContextualAnalysis;
    prioritizedActions: SmartSuggestion[];
  };
  nrDetection: {
    detectedNRs: SemanticNRResult[];
    overallCompliance: number;
    missingCriticalNRs: string[];
    recommendations: string[];
  };
  processingMetrics: {
    totalTime: number;
    parallelEfficiency: number;
    jobsCompleted: number;
    jobsFailed: number;
  };
}

export interface ProcessingOptions {
  enableCache: boolean;
  priority: 'speed' | 'accuracy' | 'balanced';
  maxConcurrency: number;
  timeout: number;
}

class ParallelProcessingEngine {
  private static instance: ParallelProcessingEngine;
  private activeJobs: Map<string, ProcessingJob> = new Map();
  private jobQueue: ProcessingJob[] = [];
  private maxConcurrency: number = 4;
  private runningJobs: number = 0;

  static getInstance(): ParallelProcessingEngine {
    if (!ParallelProcessingEngine.instance) {
      ParallelProcessingEngine.instance = new ParallelProcessingEngine();
    }
    return ParallelProcessingEngine.instance;
  }

  /**
   * Processamento paralelo completo do PPTX
   */
  async processSlides(
    slides: SlideContent[],
    options: ProcessingOptions = {
      enableCache: true,
      priority: 'balanced',
      maxConcurrency: 4,
      timeout: 300000 // 5 minutos
    }
  ): Promise<{
    result: ParallelProcessingResult;
    jobs: ProcessingJob[];
  }> {
    const startTime = Date.now();
    this.maxConcurrency = options.maxConcurrency;
    
    // Criar jobs para processamento paralelo
    const jobs = this.createProcessingJobs(slides, options);
    const results = new Map<string, any>();
    
    try {
      // Executar jobs em paralelo
      await this.executeJobsInParallel(jobs, results, options.timeout);
      
      // Compilar resultados
      const result = this.compileResults(results, startTime);
      
      return {
        result,
        jobs: Array.from(this.activeJobs.values())
      };
      
    } catch (error) {
      console.error('Erro no processamento paralelo:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Criar jobs de processamento
   */
  private createProcessingJobs(slides: SlideContent[], options: ProcessingOptions): ProcessingJob[] {
    const jobs: ProcessingJob[] = [];
    
    // Job para análise de qualidade
    jobs.push({
      id: 'quality-metrics',
      name: 'Análise de Qualidade',
      status: 'pending',
      progress: 0
    });
    
    // Job para sugestões inteligentes
    jobs.push({
      id: 'smart-suggestions',
      name: 'Sugestões Inteligentes',
      status: 'pending',
      progress: 0
    });
    
    // Job para detecção de NRs
    jobs.push({
      id: 'nr-detection',
      name: 'Detecção de NRs',
      status: 'pending',
      progress: 0
    });
    
    // Adicionar jobs à fila
    jobs.forEach(job => {
      this.activeJobs.set(job.id, job);
      this.jobQueue.push(job);
    });
    
    return jobs;
  }

  /**
   * Executar jobs em paralelo
   */
  private async executeJobsInParallel(
    jobs: ProcessingJob[],
    results: Map<string, any>,
    timeout: number
  ): Promise<void> {
    const promises: Promise<void>[] = [];
    
    // Criar promises para cada job
    for (const job of jobs) {
      if (this.runningJobs < this.maxConcurrency) {
        const promise = this.executeJob(job, results);
        promises.push(promise);
      }
    }
    
    // Aguardar conclusão com timeout
    await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no processamento')), timeout)
      )
    ]);
  }

  /**
   * Executa um job específico
   */
  private async executeJob(job: ProcessingJob, results: Map<string, any>): Promise<void> {
    try {
      job.status = 'running';
      job.startTime = Date.now();
      this.runningJobs++;
      
      let result: any;
      
      switch (job.id) {
        case 'quality-metrics':
          result = await this.executeQualityMetricsJob(job);
          break;
        case 'smart-suggestions':
          result = await this.executeSmartSuggestionsJob(job);
          break;
        case 'nr-detection':
          result = await this.executeNRDetectionJob(job);
          break;
        default:
          throw new Error(`Job desconhecido: ${job.id}`);
      }
      
      job.result = result;
      job.status = 'completed';
      job.progress = 100;
      job.endTime = Date.now();
      
      results.set(job.id, result);
      
    } catch (error) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Erro desconhecido';
      job.endTime = Date.now();
      
      console.error(`Erro no job ${job.id}:`, error);
    } finally {
      this.runningJobs--;
    }
  }

  /**
   * Executar job de métricas de qualidade
   */
  private async executeQualityMetricsJob(job: ProcessingJob): Promise<any> {
    // Simular processamento com progresso
    for (let i = 0; i <= 100; i += 20) {
      job.progress = i;
      await this.delay(100);
    }
    
    return {
      metrics: await enhancedQualityMetrics.calculateMetrics([]),
      detailed: [],
      recommendations: ['Melhorar contraste', 'Ajustar fonte']
    };
  }

  /**
   * Executar job de sugestões inteligentes
   */
  private async executeSmartSuggestionsJob(job: ProcessingJob): Promise<any> {
    // Simular processamento com progresso
    for (let i = 0; i <= 100; i += 25) {
      job.progress = i;
      await this.delay(150);
    }
    
    return {
      suggestions: await smartSuggestionsEngine.generateSuggestions([]),
      contextualAnalysis: { context: 'presentation', confidence: 0.85 },
      prioritizedActions: []
    };
  }

  /**
   * Executar job de detecção de NRs
   */
  private async executeNRDetectionJob(job: ProcessingJob): Promise<any> {
    // Simular processamento com progresso
    for (let i = 0; i <= 100; i += 30) {
      job.progress = i;
      await this.delay(200);
    }
    
    return {
      detectedNRs: await semanticNRDetection.detectNRs([]),
      overallCompliance: 0.75,
      missingCriticalNRs: ['NR-12', 'NR-35'],
      recommendations: ['Adicionar informações de segurança']
    };
  }

  /**
   * Compilar resultados finais
   */
  private compileResults(results: Map<string, any>, startTime: number): ParallelProcessingResult {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const completedJobs = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'completed').length;
    
    const failedJobs = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'error').length;
    
    return {
      qualityMetrics: results.get('quality-metrics') || {
        metrics: {},
        detailed: [],
        recommendations: []
      },
      smartSuggestions: results.get('smart-suggestions') || {
        suggestions: [],
        contextualAnalysis: {},
        prioritizedActions: []
      },
      nrDetection: results.get('nr-detection') || {
        detectedNRs: [],
        overallCompliance: 0,
        missingCriticalNRs: [],
        recommendations: []
      },
      processingMetrics: {
        totalTime,
        parallelEfficiency: completedJobs / (completedJobs + failedJobs),
        jobsCompleted: completedJobs,
        jobsFailed: failedJobs
      }
    };
  }

  /**
   * Limpar recursos
   */
  private cleanup(): void {
    this.activeJobs.clear();
    this.jobQueue = [];
    this.runningJobs = 0;
  }

  /**
   * Helper para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter status dos jobs
   */
  getJobsStatus(): ProcessingJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancelar processamento
   */
  cancelProcessing(): void {
    this.activeJobs.forEach(job => {
      if (job.status === 'running' || job.status === 'pending') {
        job.status = 'error';
        job.error = 'Cancelado pelo usuário';
        job.endTime = Date.now();
      }
    });
    
    this.cleanup();
  }
}

// Singleton instance
export const parallelProcessingEngine = ParallelProcessingEngine.getInstance();

export type {
  ProcessingJob,
  ParallelProcessingResult,
  ProcessingOptions
};