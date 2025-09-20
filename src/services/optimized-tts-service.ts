// Sistema Otimizado de TTS com Cache e Processamento Paralelo
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

export interface TTSConfig {
  provider: 'azure' | 'google' | 'aws' | 'elevenlabs' | 'local';
  language: string;
  voice: {
    name: string;
    gender: 'male' | 'female' | 'neutral';
    age: 'child' | 'adult' | 'elderly';
    style: 'neutral' | 'cheerful' | 'sad' | 'angry' | 'excited' | 'friendly' | 'hopeful' | 'shouting' | 'terrified' | 'unfriendly' | 'whispering';
  };
  audio: {
    format: 'mp3' | 'wav' | 'ogg' | 'aac';
    sampleRate: 16000 | 22050 | 44100 | 48000;
    bitRate: 64 | 128 | 192 | 256 | 320;
    channels: 1 | 2;
  };
  processing: {
    speed: number; // 0.5 - 2.0
    pitch: number; // -50 to +50
    volume: number; // 0.0 - 1.0
    enableSSML: boolean;
    enableEmphasis: boolean;
    enablePauses: boolean;
  };
  optimization: {
    enableCache: boolean;
    enableCompression: boolean;
    enableStreaming: boolean;
    maxConcurrentJobs: number;
    chunkSize: number;
  };
}

export interface TTSJob {
  id: string;
  text: string;
  config: TTSConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: TTSResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: {
    slideIndex?: number;
    segmentIndex?: number;
    priority: 'low' | 'normal' | 'high';
    estimatedDuration?: number;
  };
}

export interface TTSResult {
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  duration: number;
  format: string;
  size: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  metadata: {
    provider: string;
    voice: string;
    processingTime: number;
    cacheHit: boolean;
    segments?: TTSSegment[];
  };
}

export interface TTSSegment {
  text: string;
  startTime: number;
  endTime: number;
  audioUrl: string;
  emphasis?: 'strong' | 'moderate' | 'reduced';
  pause?: number;
}

export interface TTSBatch {
  id: string;
  jobs: TTSJob[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalDuration: number;
  combinedResult?: TTSResult;
}

export interface TTSAnalytics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  totalAudioGenerated: number; // em segundos
  costEstimate: number;
  providerStats: Map<string, any>;
}

class OptimizedTTSService extends EventEmitter {
  private config: TTSConfig;
  private jobs: Map<string, TTSJob> = new Map();
  private batches: Map<string, TTSBatch> = new Map();
  private processingQueue: TTSJob[] = [];
  private activeJobs: Set<string> = new Set();
  private analytics: TTSAnalytics;

  constructor(config: Partial<TTSConfig> = {}) {
    super();
    
    this.config = {
      provider: 'azure',
      language: 'pt-BR',
      voice: {
        name: 'pt-BR-FranciscaNeural',
        gender: 'female',
        age: 'adult',
        style: 'friendly'
      },
      audio: {
        format: 'mp3',
        sampleRate: 22050,
        bitRate: 128,
        channels: 1
      },
      processing: {
        speed: 1.0,
        pitch: 0,
        volume: 0.8,
        enableSSML: true,
        enableEmphasis: true,
        enablePauses: true
      },
      optimization: {
        enableCache: true,
        enableCompression: true,
        enableStreaming: false,
        maxConcurrentJobs: 3,
        chunkSize: 1000
      },
      ...config
    };

    this.analytics = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      totalAudioGenerated: 0,
      costEstimate: 0,
      providerStats: new Map()
    };

    this.startProcessingLoop();
  }

  async generateAudio(
    text: string,
    options: {
      slideIndex?: number;
      priority?: 'low' | 'normal' | 'high';
      customConfig?: Partial<TTSConfig>;
    } = {}
  ): Promise<TTSJob> {
    const jobId = this.generateJobId();
    const config = options.customConfig ? 
      { ...this.config, ...options.customConfig } : 
      this.config;

    // Verificar cache primeiro
    const textHash = this.createTextHash(text, config);
    if (config.optimization.enableCache) {
      const cached = await pptxCacheService.getTTSAudio(textHash);
      if (cached) {
        this.analytics.cacheHitRate = (this.analytics.cacheHitRate + 1) / 2;
        this.emit('cacheHit', { textHash, jobId });
        
        return {
          id: jobId,
          text,
          config,
          status: 'completed',
          progress: 100,
          result: cached,
          createdAt: new Date(),
          completedAt: new Date(),
          metadata: {
            ...(options.slideIndex !== undefined && { slideIndex: options.slideIndex }),
            priority: options.priority || 'normal'
          }
        };
      }
    }

    const job: TTSJob = {
      id: jobId,
      text,
      config,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      metadata: {
        ...(options.slideIndex !== undefined && { slideIndex: options.slideIndex }),
        priority: options.priority || 'normal',
        estimatedDuration: this.estimateAudioDuration(text)
      }
    };

    this.jobs.set(jobId, job);
    this.addToQueue(job);
    this.analytics.totalJobs++;

    this.emit('jobCreated', { jobId, text: text.substring(0, 50) + '...' });

    return job;
  }

  async generateBatch(
    texts: Array<{
      text: string;
      slideIndex?: number;
      segmentIndex?: number;
    }>,
    options: {
      priority?: 'low' | 'normal' | 'high';
      customConfig?: Partial<TTSConfig>;
      combineAudio?: boolean;
    } = {}
  ): Promise<TTSBatch> {
    const batchId = this.generateBatchId();
    const jobs: TTSJob[] = [];

    // Criar jobs para cada texto
    for (const item of texts) {
      const jobOptions: any = {};
      if (item.slideIndex !== undefined) jobOptions.slideIndex = item.slideIndex;
      if (options.priority !== undefined) jobOptions.priority = options.priority;
      if (options.customConfig !== undefined) jobOptions.customConfig = options.customConfig;
      
      const job = await this.generateAudio(item.text, jobOptions);
      
      if (job.metadata && item.segmentIndex !== undefined) {
        job.metadata.segmentIndex = item.segmentIndex;
      }
      jobs.push(job);
    }

    const batch: TTSBatch = {
      id: batchId,
      jobs,
      status: 'pending',
      progress: 0,
      totalDuration: jobs.reduce((sum, job) => 
        sum + (job.metadata.estimatedDuration || 0), 0)
    };

    this.batches.set(batchId, batch);

    // Monitorar progresso do batch
    this.monitorBatchProgress(batch);

    this.emit('batchCreated', { 
      batchId, 
      jobCount: jobs.length,
      estimatedDuration: batch.totalDuration
    });

    return batch;
  }

  async generateFromPPTXContent(
    pptxContent: {
      slides: Array<{
        title: string;
        content: string;
        notes?: string;
      }>;
    },
    options: {
      includeNotes?: boolean;
      customVoices?: Map<number, Partial<TTSConfig>>;
      generateCombined?: boolean;
    } = {}
  ): Promise<TTSBatch> {
    const texts: Array<{
      text: string;
      slideIndex: number;
      segmentIndex: number;
    }> = [];

    // Processar cada slide
    for (let i = 0; i < pptxContent.slides.length; i++) {
      const slide = pptxContent.slides[i];
      
      if (!slide) continue;
      
      // Adicionar título
      if (slide.title) {
        texts.push({
          text: this.enhanceTextForTTS(slide.title, 'title'),
          slideIndex: i,
          segmentIndex: 0
        });
      }

      // Adicionar conteúdo
      if (slide.content) {
        const contentChunks = this.chunkText(slide.content);
        contentChunks.forEach((chunk, chunkIndex) => {
          texts.push({
            text: this.enhanceTextForTTS(chunk, 'content'),
            slideIndex: i,
            segmentIndex: chunkIndex + 1
          });
        });
      }

      // Adicionar notas se solicitado
      if (options.includeNotes && slide.notes) {
        texts.push({
          text: this.enhanceTextForTTS(slide.notes, 'notes'),
          slideIndex: i,
          segmentIndex: 999 // Notas sempre por último
        });
      }
    }

    const batchOptions: any = { priority: 'normal' };
    if (options.generateCombined !== undefined) {
      batchOptions.combineAudio = options.generateCombined;
    }
    
    return this.generateBatch(texts, batchOptions);
  }

  private async processJob(job: TTSJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;

      this.emit('jobStarted', { jobId: job.id });

      // Simular processamento TTS
      const result = await this.callTTSProvider(job);
      
      job.result = result;
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();

      // Cache do resultado
      if (job.config.optimization.enableCache) {
        const textHash = this.createTextHash(job.text, job.config);
        await pptxCacheService.cacheTTSAudio(textHash, result);
      }

      this.analytics.completedJobs++;
      this.analytics.totalAudioGenerated += result.duration;
      this.updateAverageProcessingTime(job);

      this.emit('jobCompleted', { 
        jobId: job.id, 
        duration: result.duration,
        processingTime: result.metadata.processingTime
      });

    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();

      this.analytics.failedJobs++;

      this.emit('jobFailed', { 
        jobId: job.id, 
        error: error.message 
      });
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  private async callTTSProvider(job: TTSJob): Promise<TTSResult> {
    const startTime = Date.now();
    
    // Simular chamada para provedor TTS
    await new Promise(resolve => {
      const duration = Math.random() * 3000 + 1000; // 1-4 segundos
      setTimeout(resolve, duration);
    });

    const processingTime = Date.now() - startTime;
    const estimatedDuration = this.estimateAudioDuration(job.text);

    // Simular resultado
    const result: TTSResult = {
      audioUrl: `https://tts-api.com/audio/${job.id}.${job.config.audio.format}`,
      duration: estimatedDuration,
      format: job.config.audio.format,
      size: Math.round(estimatedDuration * job.config.audio.bitRate * 125), // Aproximação
      quality: this.getQualityFromBitRate(job.config.audio.bitRate),
      metadata: {
        provider: job.config.provider,
        voice: job.config.voice.name,
        processingTime,
        cacheHit: false,
        segments: this.generateSegments(job.text, estimatedDuration)
      }
    };

    return result;
  }

  private startProcessingLoop(): void {
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private processQueue(): void {
    const maxConcurrent = this.config.optimization.maxConcurrentJobs;
    const availableSlots = maxConcurrent - this.activeJobs.size;

    if (availableSlots <= 0 || this.processingQueue.length === 0) {
      return;
    }

    // Ordenar por prioridade
    this.processingQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.metadata.priority] - priorityOrder[a.metadata.priority];
    });

    // Processar jobs disponíveis
    const jobsToProcess = this.processingQueue.splice(0, availableSlots);
    
    for (const job of jobsToProcess) {
      this.activeJobs.add(job.id);
      this.processJob(job).catch(error => {
        console.error(`Erro ao processar job ${job.id}:`, error);
      });
    }
  }

  private addToQueue(job: TTSJob): void {
    this.processingQueue.push(job);
    this.emit('jobQueued', { jobId: job.id, queuePosition: this.processingQueue.length });
  }

  private async monitorBatchProgress(batch: TTSBatch): Promise<void> {
    const checkProgress = () => {
      const completedJobs = batch.jobs.filter(job => job.status === 'completed').length;
      const failedJobs = batch.jobs.filter(job => job.status === 'failed').length;
      const totalJobs = batch.jobs.length;

      batch.progress = (completedJobs / totalJobs) * 100;

      if (completedJobs + failedJobs === totalJobs) {
        batch.status = failedJobs === 0 ? 'completed' : 'failed';
        
        if (batch.status === 'completed') {
          this.emit('batchCompleted', { 
            batchId: batch.id,
            totalDuration: batch.jobs.reduce((sum, job) => 
              sum + (job.result?.duration || 0), 0)
          });
        } else {
          this.emit('batchFailed', { 
            batchId: batch.id,
            failedJobs: failedJobs
          });
        }
        
        return;
      }

      // Continuar monitorando
      setTimeout(checkProgress, 1000);
    };

    checkProgress();
  }

  // Métodos auxiliares
  private generateJobId(): string {
    return `tts-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `tts-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createTextHash(text: string, config: TTSConfig): string {
    const data = JSON.stringify({ text, config });
    return createHash('md5').update(data).digest('hex');
  }

  private estimateAudioDuration(text: string): number {
    // Estimativa: ~150 palavras por minuto
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.round(minutes * 60);
  }

  private enhanceTextForTTS(text: string, type: 'title' | 'content' | 'notes'): string {
    if (!this.config.processing.enableSSML) {
      return text;
    }

    let enhanced = text;

    // Adicionar pausas e ênfases baseadas no tipo
    switch (type) {
      case 'title':
        enhanced = `<emphasis level="strong">${text}</emphasis><break time="1s"/>`;
        break;
      case 'content':
        // Adicionar pausas em pontuações
        enhanced = text
          .replace(/\./g, '.<break time="500ms"/>')
          .replace(/,/g, ',<break time="300ms"/>')
          .replace(/;/g, ';<break time="400ms"/>');
        break;
      case 'notes':
        enhanced = `<prosody rate="slow">${text}</prosody>`;
        break;
    }

    return `<speak>${enhanced}</speak>`;
  }

  private chunkText(text: string): string[] {
    const maxChunkSize = this.config.optimization.chunkSize;
    const chunks: string[] = [];
    
    if (text.length <= maxChunkSize) {
      return [text];
    }

    // Dividir por sentenças primeiro
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private getQualityFromBitRate(bitRate: number): 'low' | 'medium' | 'high' | 'ultra' {
    if (bitRate >= 256) return 'ultra';
    if (bitRate >= 192) return 'high';
    if (bitRate >= 128) return 'medium';
    return 'low';
  }

  private generateSegments(text: string, totalDuration: number): TTSSegment[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments: TTSSegment[] = [];
    const avgDurationPerSentence = totalDuration / sentences.length;

    let currentTime = 0;
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (!sentence) continue;
      
      const trimmedSentence = sentence.trim();
      const duration = avgDurationPerSentence * (0.8 + Math.random() * 0.4); // Variação

      segments.push({
        text: trimmedSentence,
        startTime: currentTime,
        endTime: currentTime + duration,
        audioUrl: `segment-${i}.mp3`
      });

      currentTime += duration;
    }

    return segments;
  }

  private updateAverageProcessingTime(job: TTSJob): void {
    if (!job.startedAt || !job.completedAt) return;
    
    const processingTime = job.completedAt.getTime() - job.startedAt.getTime();
    const currentAvg = this.analytics.averageProcessingTime;
    const completedJobs = this.analytics.completedJobs;
    
    this.analytics.averageProcessingTime = 
      (currentAvg * (completedJobs - 1) + processingTime) / completedJobs;
  }

  // Métodos públicos de gerenciamento
  getJob(jobId: string): TTSJob | undefined {
    return this.jobs.get(jobId);
  }

  getBatch(batchId: string): TTSBatch | undefined {
    return this.batches.get(batchId);
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed') {
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();

    // Remover da fila se ainda não iniciou
    const queueIndex = this.processingQueue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      this.processingQueue.splice(queueIndex, 1);
    }

    this.activeJobs.delete(jobId);
    this.emit('jobCancelled', { jobId });

    return true;
  }

  cancelBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) return false;

    let cancelledCount = 0;
    for (const job of batch.jobs) {
      if (this.cancelJob(job.id)) {
        cancelledCount++;
      }
    }

    batch.status = 'failed';
    this.emit('batchCancelled', { batchId, cancelledJobs: cancelledCount });

    return cancelledCount > 0;
  }

  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const allJobs = Array.from(this.jobs.values());
    
    return {
      pending: allJobs.filter(j => j.status === 'pending').length,
      processing: allJobs.filter(j => j.status === 'processing').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
      failed: allJobs.filter(j => j.status === 'failed').length
    };
  }

  getAnalytics(): TTSAnalytics {
    return { ...this.analytics };
  }

  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  clearCache(): void {
    pptxCacheService.invalidatePattern('tts:');
    this.emit('cacheCleared');
  }

  dispose(): void {
    // Cancelar todos os jobs ativos
    for (const jobId of this.activeJobs) {
      this.cancelJob(jobId);
    }

    this.jobs.clear();
    this.batches.clear();
    this.processingQueue = [];
    this.activeJobs.clear();

    this.emit('disposed');
  }
}

// Instância singleton
export const optimizedTTSService = new OptimizedTTSService({
  provider: 'azure',
  language: 'pt-BR',
  voice: {
    name: 'pt-BR-FranciscaNeural',
    gender: 'female',
    age: 'adult',
    style: 'friendly'
  },
  optimization: {
    enableCache: true,
    enableCompression: true,
    enableStreaming: false,
    maxConcurrentJobs: 3,
    chunkSize: 1000
  }
});

export default OptimizedTTSService;