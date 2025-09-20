import { CompositingEngine, CompositeLayer, CompositeSettings } from './CompositingEngine';
import { AdvancedVFXEngine } from './AdvancedVFXEngine';

export interface RenderSettings {
  width: number;
  height: number;
  frameRate: number;
  duration: number;
  format: 'mp4' | 'webm' | 'mov' | 'avi';
  codec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
  bitrate: number;
  quality: 'draft' | 'preview' | 'high' | 'ultra';
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: number;
  colorSpace: 'sRGB' | 'Rec709' | 'Rec2020' | 'DCI-P3';
  bitDepth: 8 | 10 | 12;
  profile: 'baseline' | 'main' | 'high';
  level: string;
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf: number;
  keyframeInterval: number;
  bFrames: number;
  motionEstimation: 'hex' | 'umh' | 'esa' | 'tesa';
  subpixelRefinement: number;
  trellis: number;
  deblock: boolean;
  adaptiveQuantization: boolean;
  psychovisualOptimization: boolean;
  multipass: boolean;
  outputPath: string;
  tempDir: string;
}

export interface RenderProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  timeElapsed: number;
  timeRemaining: number;
  fps: number;
  status: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'completed' | 'error' | 'cancelled';
  message: string;
  error?: string;
}

export interface RenderJob {
  id: string;
  name: string;
  settings: RenderSettings;
  layers: CompositeLayer[];
  composition: CompositeSettings;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: RenderProgress;
  metadata: {
    estimatedSize: number;
    estimatedDuration: number;
    complexity: number;
    memoryUsage: number;
    gpuUsage: number;
  };
}

export interface RenderQueue {
  jobs: RenderJob[];
  activeJob?: RenderJob;
  maxConcurrentJobs: number;
  totalProgress: number;
}

export interface EncodingProfile {
  name: string;
  description: string;
  settings: Partial<RenderSettings>;
  category: 'web' | 'social' | 'broadcast' | 'cinema' | 'archive';
  platform?: string;
  recommended: boolean;
}

export class VideoRenderer {
  private compositingEngine: CompositingEngine;
  private vfxEngine: AdvancedVFXEngine;
  private renderQueue: RenderQueue;
  private isRendering = false;
  private currentJob?: RenderJob;
  private abortController?: AbortController;
  private workers: Worker[] = [];
  private maxWorkers = navigator.hardwareConcurrency || 4;
  private frameCache: Map<number, ImageData> = new Map();
  private audioContext: AudioContext;
  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private progressCallback?: (progress: RenderProgress) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.compositingEngine = new CompositingEngine(canvas);
    this.vfxEngine = new AdvancedVFXEngine();
    this.audioContext = new AudioContext();
    
    this.renderQueue = {
      jobs: [],
      maxConcurrentJobs: 1,
      totalProgress: 0
    };
    
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Criar workers para renderização paralela
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(new URL('./workers/RenderWorker.ts', import.meta.url));
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'frameRendered':
        this.handleFrameRendered(data);
        break;
      case 'progress':
        this.updateProgress(data);
        break;
      case 'error':
        this.handleRenderError(data);
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error:', error);
    this.handleRenderError(error.message);
  }

  private handleFrameRendered(data: { frameNumber: number; imageData: ImageData }): void {
    this.frameCache.set(data.frameNumber, data.imageData);
    
    if (this.currentJob) {
      this.currentJob.progress.currentFrame = data.frameNumber;
      this.currentJob.progress.percentage = (data.frameNumber / this.currentJob.progress.totalFrames) * 100;
      
      if (this.progressCallback) {
        this.progressCallback(this.currentJob.progress);
      }
    }
  }

  private updateProgress(progress: Partial<RenderProgress>): void {
    if (this.currentJob) {
      Object.assign(this.currentJob.progress, progress);
      
      if (this.progressCallback) {
        this.progressCallback(this.currentJob.progress);
      }
    }
  }

  private handleRenderError(error: string): void {
    if (this.currentJob) {
      this.currentJob.progress.status = 'error';
      this.currentJob.progress.error = error;
      
      if (this.progressCallback) {
        this.progressCallback(this.currentJob.progress);
      }
    }
    
    this.isRendering = false;
  }

  public addRenderJob(job: Omit<RenderJob, 'id' | 'createdAt' | 'progress' | 'metadata'>): string {
    const id = this.generateJobId();
    const totalFrames = Math.ceil(job.settings.duration * job.settings.frameRate);
    
    const renderJob: RenderJob = {
      ...job,
      id,
      createdAt: new Date(),
      progress: {
        currentFrame: 0,
        totalFrames,
        percentage: 0,
        timeElapsed: 0,
        timeRemaining: 0,
        fps: 0,
        status: 'preparing',
        message: 'Preparando renderização...'
      },
      metadata: this.calculateJobMetadata(job)
    };
    
    this.renderQueue.jobs.push(renderJob);
    this.sortRenderQueue();
    
    // Iniciar renderização se não estiver ocupado
    if (!this.isRendering) {
      this.processNextJob();
    }
    
    return id;
  }

  private generateJobId(): string {
    return `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateJobMetadata(job: Omit<RenderJob, 'id' | 'createdAt' | 'progress' | 'metadata'>): RenderJob['metadata'] {
    const totalFrames = Math.ceil(job.settings.duration * job.settings.frameRate);
    const pixelsPerFrame = job.settings.width * job.settings.height;
    const totalPixels = totalFrames * pixelsPerFrame;
    
    // Estimar tamanho do arquivo (aproximado)
    const bitsPerPixel = job.settings.bitDepth;
    const compressionRatio = this.getCompressionRatio(job.settings.codec, job.settings.quality);
    const estimatedSize = (totalPixels * bitsPerPixel * compressionRatio) / 8;
    
    // Estimar duração da renderização
    const complexityFactor = this.calculateComplexity(job.layers);
    const baseRenderTime = totalFrames * 0.1; // 100ms por frame base
    const estimatedDuration = baseRenderTime * complexityFactor;
    
    return {
      estimatedSize,
      estimatedDuration,
      complexity: complexityFactor,
      memoryUsage: this.estimateMemoryUsage(job),
      gpuUsage: this.estimateGpuUsage(job)
    };
  }

  private getCompressionRatio(codec: string, quality: string): number {
    const ratios = {
      h264: { draft: 0.1, preview: 0.2, high: 0.4, ultra: 0.6 },
      h265: { draft: 0.05, preview: 0.1, high: 0.2, ultra: 0.3 },
      vp8: { draft: 0.15, preview: 0.25, high: 0.45, ultra: 0.65 },
      vp9: { draft: 0.08, preview: 0.15, high: 0.25, ultra: 0.4 },
      av1: { draft: 0.06, preview: 0.12, high: 0.2, ultra: 0.3 }
    };
    
    return ratios[codec as keyof typeof ratios]?.[quality as keyof typeof ratios.h264] || 0.3;
  }

  private calculateComplexity(layers: CompositeLayer[]): number {
    let complexity = 1;
    
    layers.forEach(layer => {
      // Complexidade base por tipo de camada
      switch (layer.type) {
        case 'video':
          complexity += 1.5;
          break;
        case 'image':
          complexity += 0.5;
          break;
        case 'text':
          complexity += 0.3;
          break;
        case 'effect':
          complexity += 2;
          break;
        case 'adjustment':
          complexity += 1;
          break;
      }
      
      // Complexidade por efeitos
      complexity += layer.effects.length * 0.5;
      
      // Complexidade por keyframes
      complexity += layer.keyframes.length * 0.1;
      
      // Complexidade por blend mode
      if (layer.blendMode !== 'normal') {
        complexity += 0.2;
      }
    });
    
    return Math.max(1, complexity);
  }

  private estimateMemoryUsage(job: Omit<RenderJob, 'id' | 'createdAt' | 'progress' | 'metadata'>): number {
    const frameSize = job.settings.width * job.settings.height * 4; // RGBA
    const bufferFrames = 10; // Frames em buffer
    const layerCount = job.layers.length;
    
    return frameSize * bufferFrames * layerCount;
  }

  private estimateGpuUsage(job: Omit<RenderJob, 'id' | 'createdAt' | 'progress' | 'metadata'>): number {
    let usage = 0.1; // Base usage
    
    job.layers.forEach(layer => {
      if (layer.effects.length > 0) {
        usage += 0.1 * layer.effects.length;
      }
      
      if (layer.blendMode !== 'normal') {
        usage += 0.05;
      }
    });
    
    return Math.min(1, usage);
  }

  private sortRenderQueue(): void {
    this.renderQueue.jobs.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private async processNextJob(): Promise<void> {
    if (this.isRendering || this.renderQueue.jobs.length === 0) {
      return;
    }
    
    const job = this.renderQueue.jobs.shift();
    if (!job) return;
    
    this.currentJob = job;
    this.renderQueue.activeJob = job;
    this.isRendering = true;
    
    job.startedAt = new Date();
    job.progress.status = 'rendering';
    job.progress.message = 'Iniciando renderização...';
    
    try {
      await this.renderJob(job);
      
      job.progress.status = 'completed';
      job.progress.percentage = 100;
      job.progress.message = 'Renderização concluída!';
      job.completedAt = new Date();
      
    } catch (error) {
      job.progress.status = 'error';
      job.progress.error = error instanceof Error ? error.message : 'Erro desconhecido';
      job.progress.message = 'Erro durante a renderização';
    } finally {
      this.isRendering = false;
      this.renderQueue.activeJob = undefined;
      this.currentJob = undefined;
      
      // Processar próximo job
      setTimeout(() => this.processNextJob(), 100);
    }
  }

  private async renderJob(job: RenderJob): Promise<void> {
    this.abortController = new AbortController();
    
    // Configurar compositing engine
    this.compositingEngine.updateSettings(job.composition);
    
    // Adicionar camadas
    job.layers.forEach(layer => {
      this.compositingEngine.addLayer(layer);
    });
    
    const totalFrames = job.progress.totalFrames;
    const frameRate = job.settings.frameRate;
    const frameDuration = 1 / frameRate;
    
    // Preparar gravação
    await this.prepareRecording(job.settings);
    
    const startTime = performance.now();
    
    // Renderizar frames
    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.abortController.signal.aborted) {
        throw new Error('Renderização cancelada');
      }
      
      const currentTime = frame * frameDuration;
      
      // Renderizar frame
      await this.renderFrame(currentTime, frame, job);
      
      // Atualizar progresso
      const elapsed = (performance.now() - startTime) / 1000;
      const fps = frame / elapsed;
      const remaining = (totalFrames - frame) / fps;
      
      job.progress.currentFrame = frame;
      job.progress.percentage = (frame / totalFrames) * 100;
      job.progress.timeElapsed = elapsed;
      job.progress.timeRemaining = remaining;
      job.progress.fps = fps;
      job.progress.message = `Renderizando frame ${frame + 1} de ${totalFrames}`;
      
      if (this.progressCallback) {
        this.progressCallback(job.progress);
      }
      
      // Yield para não bloquear a UI
      if (frame % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    // Finalizar gravação
    await this.finalizeRecording(job);
  }

  private async renderFrame(time: number, frameNumber: number, _job: RenderJob): Promise<void> {
    // Configurar tempo atual
    this.compositingEngine.setCurrentTime(time);
    
    // Renderizar composição
    this.compositingEngine.render(this.canvas);
    
    // Capturar frame
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Armazenar no cache
    this.frameCache.set(frameNumber, imageData);
    
    // Adicionar ao stream de gravação
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      // Converter ImageData para blob e adicionar ao stream
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob(blob => {
        if (blob) {
          this.recordedChunks.push(blob);
        }
      }, 'image/webp', 0.9);
    }
  }

  private async prepareRecording(settings: RenderSettings): Promise<void> {
    this.recordedChunks = [];
    
    // Configurar canvas para o tamanho de saída
    this.canvas.width = settings.width;
    this.canvas.height = settings.height;
    
    // Configurar MediaRecorder se suportado
    if (typeof MediaRecorder !== 'undefined') {
      const stream = this.canvas.captureStream(settings.frameRate);
      
      const options: MediaRecorderOptions = {
        mimeType: this.getMimeType(settings.format, settings.codec),
        videoBitsPerSecond: settings.bitrate
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
    }
  }

  private getMimeType(format: string, codec: string): string {
    const mimeTypes = {
      mp4: {
        h264: 'video/mp4; codecs="avc1.42E01E"',
        h265: 'video/mp4; codecs="hev1.1.6.L93.B0"'
      },
      webm: {
        vp8: 'video/webm; codecs="vp8"',
        vp9: 'video/webm; codecs="vp9"',
        av1: 'video/webm; codecs="av01.0.04M.08"'
      }
    };
    
    const formatTypes = mimeTypes[format as keyof typeof mimeTypes];
    if (formatTypes && typeof formatTypes === 'object') {
      return (formatTypes as any)[codec] || 'video/webm';
    }
    return 'video/webm';
  }

  private async finalizeRecording(job: RenderJob): Promise<void> {
    job.progress.status = 'encoding';
    job.progress.message = 'Codificando vídeo...';
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      
      // Aguardar finalização
      await new Promise<void>((resolve) => {
        this.mediaRecorder!.onstop = () => resolve();
      });
    }
    
    // Criar blob final
    const finalBlob = new Blob(this.recordedChunks, {
      type: this.getMimeType(job.settings.format, job.settings.codec)
    });
    
    // Salvar arquivo
    await this.saveVideoFile(finalBlob, job.settings.outputPath);
    
    job.progress.status = 'finalizing';
    job.progress.message = 'Finalizando...';
  }

  private async saveVideoFile(blob: Blob, outputPath: string): Promise<void> {
    // Criar URL para download
    const url = URL.createObjectURL(blob);
    
    // Criar link de download
    const a = document.createElement('a');
    a.href = url;
    a.download = outputPath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  }

  public cancelRender(jobId: string): void {
    const job = this.renderQueue.jobs.find(j => j.id === jobId);
    
    if (job) {
      if (job === this.currentJob) {
        // Cancelar job atual
        if (this.abortController) {
          this.abortController.abort();
        }
        
        job.progress.status = 'cancelled';
        job.progress.message = 'Renderização cancelada';
      } else {
        // Remover da fila
        this.renderQueue.jobs = this.renderQueue.jobs.filter(j => j.id !== jobId);
      }
    }
  }

  public pauseRender(): void {
    // Implementar pausa se necessário
  }

  public resumeRender(): void {
    // Implementar retomada se necessário
  }

  public getRenderQueue(): RenderQueue {
    return { ...this.renderQueue };
  }

  public getJob(jobId: string): RenderJob | undefined {
    return this.renderQueue.jobs.find(j => j.id === jobId) || this.renderQueue.activeJob;
  }

  public removeJob(jobId: string): void {
    this.renderQueue.jobs = this.renderQueue.jobs.filter(j => j.id !== jobId);
  }

  public clearQueue(): void {
    this.renderQueue.jobs = [];
  }

  public setProgressCallback(callback: (progress: RenderProgress) => void): void {
    this.progressCallback = callback;
  }

  public getEncodingProfiles(): EncodingProfile[] {
    return [
      {
        name: 'YouTube 1080p',
        description: 'Otimizado para upload no YouTube em 1080p',
        category: 'social',
        platform: 'youtube',
        recommended: true,
        settings: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          format: 'mp4',
          codec: 'h264',
          bitrate: 8000000,
          quality: 'high',
          audioCodec: 'aac',
          audioBitrate: 128000
        }
      },
      {
        name: 'Instagram Stories',
        description: 'Formato vertical para Instagram Stories',
        category: 'social',
        platform: 'instagram',
        recommended: true,
        settings: {
          width: 1080,
          height: 1920,
          frameRate: 30,
          format: 'mp4',
          codec: 'h264',
          bitrate: 3500000,
          quality: 'high'
        }
      },
      {
        name: 'TikTok',
        description: 'Formato vertical para TikTok',
        category: 'social',
        platform: 'tiktok',
        recommended: true,
        settings: {
          width: 1080,
          height: 1920,
          frameRate: 30,
          format: 'mp4',
          codec: 'h264',
          bitrate: 2500000,
          quality: 'high'
        }
      },
      {
        name: 'Broadcast HD',
        description: 'Qualidade broadcast para TV',
        category: 'broadcast',
        recommended: false,
        settings: {
          width: 1920,
          height: 1080,
          frameRate: 25,
          format: 'mov',
          codec: 'h264',
          bitrate: 50000000,
          quality: 'ultra',
          profile: 'high',
          colorSpace: 'Rec709'
        }
      },
      {
        name: 'Cinema 4K',
        description: 'Qualidade cinema em 4K',
        category: 'cinema',
        recommended: false,
        settings: {
          width: 4096,
          height: 2160,
          frameRate: 24,
          format: 'mov',
          codec: 'h265',
          bitrate: 100000000,
          quality: 'ultra',
          colorSpace: 'DCI-P3',
          bitDepth: 10
        }
      },
      {
        name: 'Web Optimized',
        description: 'Otimizado para web com tamanho reduzido',
        category: 'web',
        recommended: true,
        settings: {
          width: 1280,
          height: 720,
          frameRate: 30,
          format: 'webm',
          codec: 'vp9',
          bitrate: 2000000,
          quality: 'preview'
        }
      },
      {
        name: 'Archive Quality',
        description: 'Máxima qualidade para arquivo',
        category: 'archive',
        recommended: false,
        settings: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          format: 'mov',
          codec: 'h264',
          bitrate: 80000000,
          quality: 'ultra',
          preset: 'veryslow',
          crf: 18
        }
      }
    ];
  }

  public applyEncodingProfile(profileName: string): Partial<RenderSettings> {
    const profile = this.getEncodingProfiles().find(p => p.name === profileName);
    return profile?.settings || {};
  }

  public estimateFileSize(settings: RenderSettings): number {
    const totalFrames = Math.ceil(settings.duration * settings.frameRate);
    const pixelsPerFrame = settings.width * settings.height;
    const totalPixels = totalFrames * pixelsPerFrame;
    const compressionRatio = this.getCompressionRatio(settings.codec, settings.quality);
    
    return (totalPixels * settings.bitDepth * compressionRatio) / 8;
  }

  public estimateRenderTime(layers: CompositeLayer[], settings: RenderSettings): number {
    const totalFrames = Math.ceil(settings.duration * settings.frameRate);
    const complexity = this.calculateComplexity(layers);
    const baseTime = totalFrames * 0.1; // 100ms por frame
    
    return baseTime * complexity;
  }

  public getSystemCapabilities(): {
    maxResolution: { width: number; height: number };
    supportedFormats: string[];
    supportedCodecs: string[];
    hardwareAcceleration: boolean;
    maxConcurrentJobs: number;
    availableMemory: number;
  } {
    return {
      maxResolution: { width: 7680, height: 4320 }, // 8K
      supportedFormats: ['mp4', 'webm', 'mov'],
      supportedCodecs: ['h264', 'h265', 'vp8', 'vp9', 'av1'],
      hardwareAcceleration: this.checkHardwareAcceleration(),
      maxConcurrentJobs: this.maxWorkers,
      availableMemory: this.getAvailableMemory()
    };
  }

  private checkHardwareAcceleration(): boolean {
    // Verificar se há aceleração por hardware disponível
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const UNMASKED_RENDERER_WEBGL = 0x9246; // WebGL constant
      const renderer = gl.getParameter(UNMASKED_RENDERER_WEBGL) as string;
      return renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Intel');
    }
    
    return false;
  }

  private getAvailableMemory(): number {
    // Estimar memória disponível (aproximado)
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    return 1024 * 1024 * 1024; // 1GB default
  }

  public dispose(): void {
    // Cancelar renderização atual
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Parar MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Limpar workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    
    // Limpar cache
    this.frameCache.clear();
    
    // Limpar fila
    this.renderQueue.jobs = [];
    
    // Fechar AudioContext
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    // Limpar engines
    this.compositingEngine.dispose();
    this.vfxEngine.dispose();
  }
}

// Utilitários para renderização
export class RenderUtils {
  static createDefaultRenderSettings(): RenderSettings {
    return {
      width: 1920,
      height: 1080,
      frameRate: 30,
      duration: 10,
      format: 'mp4',
      codec: 'h264',
      bitrate: 8000000,
      quality: 'high',
      audioCodec: 'aac',
      audioBitrate: 128000,
      colorSpace: 'sRGB',
      bitDepth: 8,
      profile: 'high',
      level: '4.0',
      preset: 'medium',
      crf: 23,
      keyframeInterval: 30,
      bFrames: 3,
      motionEstimation: 'hex',
      subpixelRefinement: 7,
      trellis: 1,
      deblock: true,
      adaptiveQuantization: true,
      psychovisualOptimization: true,
      multipass: false,
      outputPath: 'output.mp4',
      tempDir: '/tmp'
    };
  }

  static validateRenderSettings(settings: RenderSettings): string[] {
    const errors: string[] = [];
    
    if (settings.width <= 0 || settings.height <= 0) {
      errors.push('Dimensões devem ser maiores que zero');
    }
    
    if (settings.frameRate <= 0 || settings.frameRate > 120) {
      errors.push('Frame rate deve estar entre 1 e 120 fps');
    }
    
    if (settings.duration <= 0) {
      errors.push('Duração deve ser maior que zero');
    }
    
    if (settings.bitrate <= 0) {
      errors.push('Bitrate deve ser maior que zero');
    }
    
    if (!['mp4', 'webm', 'mov', 'avi'].includes(settings.format)) {
      errors.push('Formato não suportado');
    }
    
    if (!['h264', 'h265', 'vp8', 'vp9', 'av1'].includes(settings.codec)) {
      errors.push('Codec não suportado');
    }
    
    return errors;
  }

  static optimizeSettingsForPlatform(platform: string, baseSettings: RenderSettings): RenderSettings {
    const optimized = { ...baseSettings };
    
    switch (platform.toLowerCase()) {
      case 'youtube':
        optimized.format = 'mp4';
        optimized.codec = 'h264';
        optimized.profile = 'high';
        optimized.colorSpace = 'Rec709';
        break;
        
      case 'instagram':
        optimized.format = 'mp4';
        optimized.codec = 'h264';
        optimized.bitrate = Math.min(optimized.bitrate, 3500000);
        break;
        
      case 'tiktok':
        optimized.width = 1080;
        optimized.height = 1920;
        optimized.format = 'mp4';
        optimized.codec = 'h264';
        break;
        
      case 'twitter':
        optimized.bitrate = Math.min(optimized.bitrate, 5000000);
        optimized.duration = Math.min(optimized.duration, 140);
        break;
    }
    
    return optimized;
  }
}