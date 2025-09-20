// Pipeline Otimizado para Processamento PPTX
import { EventEmitter } from '../utils/EventEmitter';
import { pptxCacheService } from './pptx-cache-service';
import CryptoJS from 'crypto-js';

// Browser-compatible hash function
const createHash = (algorithm: string) => ({
  update: (data: string | Buffer) => ({
    digest: (encoding: string) => {
      const dataStr = typeof data === 'string' ? data : data.toString();
      return CryptoJS.MD5(dataStr).toString();
    }
  })
});

export interface ProcessingStage {
  name: string;
  progress: number;
  message: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  cached?: boolean;
  error?: string;
  data?: any;
}

export interface PipelineConfig {
  enableParallelProcessing: boolean;
  maxConcurrentTasks: number;
  enableCaching: boolean;
  enableProgressiveLoading: boolean;
  qualityMode: 'fast' | 'balanced' | 'high';
  timeoutMs: number;
}

export interface ProcessingResult {
  success: boolean;
  data: any;
  stages: ProcessingStage[];
  totalDuration: number;
  cacheHits: number;
  cacheMisses: number;
  error?: string;
}

export interface PPTXContent {
  slides: Array<{
    title: string;
    content: string;
    images?: number;
    charts?: number;
    tables?: number;
  }>;
  totalSlides: number;
  estimatedDuration: number;
  topics: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
}

class OptimizedPPTXPipeline extends EventEmitter {
  private config: PipelineConfig;
  private activeProcesses = new Map<string, AbortController>();
  private processingQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  constructor(config: Partial<PipelineConfig> = {}) {
    super();
    
    this.config = {
      enableParallelProcessing: true,
      maxConcurrentTasks: 4,
      enableCaching: true,
      enableProgressiveLoading: true,
      qualityMode: 'balanced',
      timeoutMs: 30000,
      ...config
    };
  }

  async processPPTX(
    file: File, 
    options: {
      enableAIAnalysis?: boolean;
      enableNRCompliance?: boolean;
      enableTTSGeneration?: boolean;
      templatePreferences?: string[];
    } = {}
  ): Promise<ProcessingResult> {
    const processId = this.generateProcessId(file);
    const abortController = new AbortController();
    this.activeProcesses.set(processId, abortController);

    const result: ProcessingResult = {
      success: false,
      data: null,
      stages: [],
      totalDuration: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    const startTime = Date.now();

    try {
      this.emit('pipelineStart', { processId, filename: file.name });

      // Stage 1: Análise inicial e hash do arquivo
      const fileHash = await this.createFileHash(file);
      const stage1 = await this.executeStage('file-analysis', async () => {
        return { fileHash, size: file.size, type: file.type };
      });
      result.stages.push(stage1);

      // Stage 2: Verificar cache de análise completa
      let analysisData = null;
      if (this.config.enableCaching) {
        analysisData = await pptxCacheService.getAnalysis(fileHash);
        if (analysisData) {
          result.cacheHits++;
          this.emit('cacheHit', { type: 'analysis', fileHash });
        } else {
          result.cacheMisses++;
        }
      }

      // Stage 3: Extração de conteúdo (se não estiver em cache)
      if (!analysisData) {
        const stage3 = await this.executeStage('content-extraction', async () => {
          return await this.extractPPTXContent(file, abortController.signal);
        });
        result.stages.push(stage3);
        analysisData = stage3.data;

        // Cache da análise
        if (this.config.enableCaching && analysisData) {
          await pptxCacheService.cacheAnalysis(fileHash, analysisData);
        }
      }

      // Stage 4: Análise de IA (paralela se habilitada)
      const aiTasks: Promise<any>[] = [];
      
      if (options.enableAIAnalysis) {
        aiTasks.push(this.processAIAnalysis(analysisData, fileHash));
      }

      if (options.enableNRCompliance) {
        aiTasks.push(this.processNRCompliance(analysisData, fileHash));
      }

      // Executar tarefas de IA em paralelo
      const aiResults = await this.executeParallelTasks(aiTasks, 'ai-analysis');
      result.stages.push(...aiResults.stages);

      // Stage 5: Geração de templates (baseada na análise de IA)
      const templateStage = await this.executeStage('template-generation', async () => {
        return await this.generateTemplateRecommendations(
          analysisData, 
          aiResults.data,
          options.templatePreferences
        );
      });
      result.stages.push(templateStage);

      // Stage 6: TTS (opcional e paralela)
      if (options.enableTTSGeneration) {
        const ttsStage = await this.executeStage('tts-generation', async () => {
          return await this.generateTTSAudio(analysisData, fileHash);
        });
        result.stages.push(ttsStage);
      }

      // Compilar resultado final
      result.data = {
        analysis: analysisData,
        aiAnalysis: aiResults.data,
        templates: templateStage.data,
        fileHash,
        processId
      };

      result.success = true;
      result.totalDuration = Date.now() - startTime;

      this.emit('pipelineComplete', { 
        processId, 
        duration: result.totalDuration,
        cacheHits: result.cacheHits,
        stages: result.stages.length
      });

    } catch (error: any) {
      result.error = error?.message || 'Erro desconhecido';
      result.totalDuration = Date.now() - startTime;
      
      this.emit('pipelineError', {
        processId,
        error: error?.message || 'Erro desconhecido',
        duration: result.totalDuration
      });
    } finally {
      this.activeProcesses.delete(processId);
    }

    return result;
  }

  private async executeStage(
    stageName: string, 
    task: () => Promise<any>
  ): Promise<ProcessingStage> {
    const stage: ProcessingStage = {
      name: stageName,
      progress: 0,
      message: `Executando ${stageName}...`,
      startTime: Date.now()
    };

    this.emit('stageStart', stage);

    try {
      const data = await task();
      
      stage.endTime = Date.now();
      stage.duration = stage.endTime - stage.startTime;
      stage.progress = 100;
      stage.message = `${stageName} concluído`;
      
      this.emit('stageComplete', stage);
      
      stage.data = data;
      return stage;
    } catch (error: any) {
      stage.endTime = Date.now();
      stage.duration = stage.endTime - stage.startTime;
      stage.error = error?.message || 'Erro desconhecido';
      stage.message = `Erro em ${stageName}: ${error?.message || 'Erro desconhecido'}`;
      
      this.emit('stageError', stage);
      throw error;
    }
  }

  private async executeParallelTasks(
    tasks: Promise<any>[],
    stageName: string
  ): Promise<{ data: any[]; stages: ProcessingStage[] }> {
    if (!this.config.enableParallelProcessing || tasks.length === 0) {
      const results = [];
      const stages = [];
      
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task) {
          const stage = await this.executeStage(`${stageName}-${i}`, () => task);
          results.push(stage.data);
          stages.push(stage);
        }
      }
      
      return { data: results, stages };
    }

    // Executar em paralelo com limite de concorrência
    const chunks = this.chunkArray(tasks, this.config.maxConcurrentTasks);
    const allResults = [];
    const allStages = [];

    for (const chunk of chunks) {
      const chunkPromises = chunk.map((task, index) => 
        this.executeStage(`${stageName}-parallel-${index}`, () => task)
      );
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          allResults.push(result.value.data);
          allStages.push(result.value);
        } else {
          allStages.push({
            name: `${stageName}-failed`,
            progress: 0,
            message: `Falha: ${result.reason}`,
            startTime: Date.now(),
            endTime: Date.now(),
            error: String(result.reason),
            data: null
          });
        }
      }
    }

    return { data: allResults, stages: allStages };
  }

  private async extractPPTXContent(
    file: File, 
    signal: AbortSignal
  ): Promise<PPTXContent> {
    // Simular extração de conteúdo com verificação de cancelamento
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Operação cancelada'));
        return;
      }

      // Simular processamento
      setTimeout(() => {
        if (signal.aborted) {
          reject(new Error('Operação cancelada'));
          return;
        }

        resolve({
          slides: [
            {
              title: 'Slide 1',
              content: 'Conteúdo do slide 1 com informações importantes sobre segurança.',
              images: 2,
              charts: 1,
              tables: 0
            },
            {
              title: 'Slide 2', 
              content: 'Procedimentos de segurança e equipamentos de proteção individual.',
              images: 1,
              charts: 0,
              tables: 1
            }
          ],
          totalSlides: 2,
          estimatedDuration: 120,
          topics: ['segurança', 'procedimentos', 'equipamentos'],
          complexity: 'intermediate'
        });
      }, 1000);
    });
  }

  private async processAIAnalysis(content: PPTXContent, fileHash: string): Promise<any> {
    // Verificar cache primeiro
    const cached = await pptxCacheService.getAnalysis(`ai:${fileHash}`);
    if (cached) return cached;

    // Simular análise de IA
    const analysis = {
      sentiment: 'professional',
      topics: content.topics,
      complexity: content.complexity,
      recommendations: [
        'Adicionar mais exemplos visuais',
        'Incluir quiz interativo',
        'Melhorar transições entre slides'
      ],
      nrCompliance: {
        detected: true,
        norms: ['NR-06', 'NR-12'],
        confidence: 85
      }
    };

    // Cache do resultado
    await pptxCacheService.cacheAnalysis(`ai:${fileHash}`, analysis);
    
    return analysis;
  }

  private async processNRCompliance(content: PPTXContent, fileHash: string): Promise<any> {
    // Verificar cache
    const cached = await pptxCacheService.getAnalysis(`nr:${fileHash}`);
    if (cached) return cached;

    // Simular análise de compliance
    const compliance = {
      overallScore: 78,
      detectedNorms: ['NR-06', 'NR-12', 'NR-17'],
      missingElements: ['Procedimentos de emergência', 'Treinamento específico'],
      recommendations: [
        'Adicionar seção sobre procedimentos de emergência',
        'Incluir informações sobre treinamento obrigatório',
        'Detalhar uso correto de EPIs'
      ]
    };

    await pptxCacheService.cacheAnalysis(`nr:${fileHash}`, compliance);
    
    return compliance;
  }

  private async generateTemplateRecommendations(
    content: PPTXContent,
    aiAnalysis: any,
    preferences: string[] = []
  ): Promise<any[]> {
    const contentHash = this.createContentHash(content, aiAnalysis);
    
    // Verificar cache
    const cached = await pptxCacheService.getTemplateRecommendations(contentHash);
    if (cached) return cached;

    // Gerar recomendações baseadas no conteúdo
    const templates = [
      {
        id: 'safety-training-pro',
        name: 'Treinamento de Segurança Profissional',
        confidence: 92,
        reasons: ['Conteúdo de segurança detectado', 'Compliance NR identificado'],
        features: ['Animações de segurança', 'Quiz interativo', 'Certificação']
      },
      {
        id: 'corporate-standard',
        name: 'Padrão Corporativo',
        confidence: 78,
        reasons: ['Estrutura profissional', 'Conteúdo técnico'],
        features: ['Design limpo', 'Navegação intuitiva', 'Branding corporativo']
      }
    ];

    await pptxCacheService.cacheTemplateRecommendations(contentHash, templates);
    
    return templates;
  }

  private async generateTTSAudio(content: PPTXContent, fileHash: string): Promise<any> {
    const textHash = this.createTextHash(content);
    
    // Verificar cache
    const cached = await pptxCacheService.getTTSAudio(textHash);
    if (cached) return cached;

    // Simular geração de TTS
    const audioData = {
      duration: '2:30',
      format: 'mp3',
      quality: 'high',
      audioUrl: `https://api.tts.com/audio/${textHash}.mp3`,
      segments: content.slides.map((slide, index) => ({
        slideIndex: index,
        startTime: index * 30,
        duration: 30,
        text: slide.content
      }))
    };

    await pptxCacheService.cacheTTSAudio(textHash, audioData);
    
    return audioData;
  }

  // Métodos utilitários
  private generateProcessId(file: File): string {
    return `pptx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    return createHash('md5').update(Buffer.from(buffer)).digest('hex');
  }

  private createContentHash(content: PPTXContent, aiAnalysis?: any): string {
    const data = JSON.stringify({ content, aiAnalysis });
    return createHash('md5').update(data).digest('hex');
  }

  private createTextHash(content: PPTXContent): string {
    const text = content.slides.map(s => s.content).join(' ');
    return createHash('md5').update(text).digest('hex');
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Métodos de controle
  cancelProcess(processId: string): boolean {
    const controller = this.activeProcesses.get(processId);
    if (controller) {
      controller.abort();
      this.activeProcesses.delete(processId);
      this.emit('processCancelled', { processId });
      return true;
    }
    return false;
  }

  getActiveProcesses(): string[] {
    return Array.from(this.activeProcesses.keys());
  }

  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getPerformanceMetrics(): any {
    return {
      cacheStats: pptxCacheService.getStats(),
      activeProcesses: this.activeProcesses.size,
      config: this.config
    };
  }

  dispose(): void {
    // Cancelar todos os processos ativos
    for (const [processId, controller] of this.activeProcesses) {
      controller.abort();
    }
    this.activeProcesses.clear();
    this.emit('pipelineDisposed');
  }
}

// Instância singleton
export const optimizedPPTXPipeline = new OptimizedPPTXPipeline({
  enableParallelProcessing: true,
  maxConcurrentTasks: 4,
  enableCaching: true,
  enableProgressiveLoading: true,
  qualityMode: 'balanced',
  timeoutMs: 30000
});

export default OptimizedPPTXPipeline;