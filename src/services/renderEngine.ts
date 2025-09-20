import { ExportSettings, ExportJob, ExportProgress, RenderOptions } from '../types/export';

// Interface para o worker de renderização
interface RenderWorker {
  postMessage(data: any): void;
  onmessage: ((event: MessageEvent) => void) | null;
  terminate(): void;
}

// Classe principal do engine de renderização
export class RenderEngine {
  private workers: Map<string, RenderWorker> = new Map();
  private activeJobs: Map<string, ExportJob> = new Map();
  private progressCallbacks: Map<string, (progress: ExportProgress) => void> = new Map();
  private maxWorkers = navigator.hardwareConcurrency || 4;

  constructor() {
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Inicializar workers para renderização paralela
    for (let i = 0; i < this.maxWorkers; i++) {
      const workerId = `worker-${i}`;
      // Em um ambiente real, isso seria um Web Worker
      // Por agora, simulamos o comportamento
      const worker = this.createMockWorker(workerId);
      this.workers.set(workerId, worker);
    }
  }

  private createMockWorker(workerId: string): RenderWorker {
    return {
      postMessage: (data: any) => {
        // Simular processamento assíncrono
        setTimeout(() => {
          if (this.progressCallbacks.has(data.jobId)) {
            this.simulateProgress(data.jobId, data.settings);
          }
        }, 100);
      },
      onmessage: null,
      terminate: () => {
      }
    };
  }

  private simulateProgress(jobId: string, settings: ExportSettings): void {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    const callback = this.progressCallbacks.get(jobId);
    if (!callback) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simular finalização
        callback({
          jobId,
          progress: 100,
          status: 'completed',
          currentStep: 'Finalizado',
          estimatedTimeRemaining: 0,
          processedFrames: job.totalFrames || 1800,
          totalFrames: job.totalFrames || 1800,
          outputSize: this.estimateFileSize(settings),
          speed: 1.0
        });
        
        this.activeJobs.delete(jobId);
        this.progressCallbacks.delete(jobId);
      } else {
        const steps = [
          'Preparando vídeo...',
          'Processando frames...',
          'Aplicando efeitos...',
          'Codificando áudio...',
          'Comprimindo vídeo...',
          'Finalizando arquivo...'
        ];
        
        const stepIndex = Math.floor((progress / 100) * steps.length);
        const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
        
        callback({
          jobId,
          progress,
          status: 'processing',
          currentStep,
          estimatedTimeRemaining: Math.max(0, ((100 - progress) / 10) * 1000),
          processedFrames: Math.floor((progress / 100) * (job.totalFrames || 1800)),
          totalFrames: job.totalFrames || 1800,
          outputSize: this.estimateFileSize(settings),
          speed: 0.8 + Math.random() * 0.4
        });
      }
    }, 200 + Math.random() * 300);
  }

  public async startRender(
    job: ExportJob,
    onProgress: (progress: ExportProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Validar configurações
        this.validateSettings(job.settings);
        
        // Adicionar job à lista ativa
        this.activeJobs.set(job.id, job);
        this.progressCallbacks.set(job.id, (progress) => {
          onProgress(progress);
          
          if (progress.status === 'completed') {
            resolve(this.generateOutputUrl(job));
          } else if (progress.status === 'error') {
            reject(new Error('Erro durante a renderização'));
          }
        });
        
        // Encontrar worker disponível
        const availableWorker = this.findAvailableWorker();
        if (!availableWorker) {
          throw new Error('Nenhum worker disponível');
        }
        
        // Iniciar renderização
        availableWorker.postMessage({
          jobId: job.id,
          settings: job.settings,
          videoData: job.videoData,
          audioData: job.audioData
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private findAvailableWorker(): RenderWorker | null {
    // Simular busca por worker disponível
    const workers = Array.from(this.workers.values());
    return workers[Math.floor(Math.random() * workers.length)];
  }

  private validateSettings(settings: ExportSettings): void {
    if (!settings.format) {
      throw new Error('Formato de exportação não especificado');
    }
    
    if (!settings.resolution || settings.resolution.width <= 0 || settings.resolution.height <= 0) {
      throw new Error('Resolução inválida');
    }
    
    if (settings.frameRate <= 0) {
      throw new Error('Taxa de quadros inválida');
    }
    
    // Validações específicas por formato
    switch (settings.format) {
      case 'gif':
        if (settings.frameRate > 30) {
          console.warn('Taxa de quadros muito alta para GIF, limitando a 30fps');
        }
        break;
      case 'webm':
        if (settings.codec !== 'vp9' && settings.codec !== 'vp8') {
          throw new Error('Codec inválido para formato WebM');
        }
        break;
      case 'mp4':
      case 'mov':
      case 'avi':
        if (!['h264', 'h265'].includes(settings.codec)) {
          throw new Error(`Codec ${settings.codec} não suportado para formato ${settings.format}`);
        }
        break;
    }
  }

  private estimateFileSize(settings: ExportSettings): number {
    // Estimativa básica de tamanho do arquivo em bytes
    const { resolution, frameRate, videoBitrate, audioBitrate } = settings;
    const duration = 60; // Assumir 60 segundos para estimativa
    
    const videoSize = (videoBitrate * 1000 * duration) / 8; // bits para bytes
    const audioSize = (audioBitrate * 1000 * duration) / 8;
    
    return Math.round(videoSize + audioSize);
  }

  private generateOutputUrl(job: ExportJob): string {
    // Em um ambiente real, isso retornaria a URL do arquivo renderizado
    const timestamp = Date.now();
    const extension = this.getFileExtension(job.settings.format);
    return `blob:${window.location.origin}/rendered-video-${timestamp}.${extension}`;
  }

  private getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      mp4: 'mp4',
      mov: 'mov',
      avi: 'avi',
      webm: 'webm',
      gif: 'gif'
    };
    return extensions[format] || 'mp4';
  }

  public cancelRender(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      // Cancelar job
      this.activeJobs.delete(jobId);
      this.progressCallbacks.delete(jobId);
      
      // Notificar callback de cancelamento
      const callback = this.progressCallbacks.get(jobId);
      if (callback) {
        callback({
          jobId,
          progress: 0,
          status: 'cancelled',
          currentStep: 'Cancelado',
          estimatedTimeRemaining: 0,
          processedFrames: 0,
          totalFrames: job.totalFrames || 0,
          outputSize: 0,
          speed: 0
        });
      }
    }
  }

  public getActiveJobs(): ExportJob[] {
    return Array.from(this.activeJobs.values());
  }

  public getSupportedFormats(): string[] {
    return ['mp4', 'mov', 'avi', 'webm', 'gif'];
  }

  public getSupportedCodecs(format: string): string[] {
    const codecMap: Record<string, string[]> = {
      mp4: ['h264', 'h265'],
      mov: ['h264', 'h265'],
      avi: ['h264'],
      webm: ['vp8', 'vp9'],
      gif: ['gif']
    };
    return codecMap[format] || [];
  }

  public getOptimalSettings(resolution: { width: number; height: number }): Partial<ExportSettings> {
    const area = resolution.width * resolution.height;
    
    if (area >= 3840 * 2160) { // 4K
      return {
        videoBitrate: 35000,
        audioBitrate: 128,
        frameRate: 30,
        codec: 'h265',
        quality: 'ultra'
      };
    } else if (area >= 1920 * 1080) { // 1080p
      return {
        videoBitrate: 8000,
        audioBitrate: 128,
        frameRate: 30,
        codec: 'h264',
        quality: 'high'
      };
    } else if (area >= 1280 * 720) { // 720p
      return {
        videoBitrate: 4000,
        audioBitrate: 96,
        frameRate: 30,
        codec: 'h264',
        quality: 'medium'
      };
    } else { // 480p ou menor
      return {
        videoBitrate: 2000,
        audioBitrate: 64,
        frameRate: 24,
        codec: 'h264',
        quality: 'low'
      };
    }
  }

  public dispose(): void {
    // Limpar todos os workers e jobs ativos
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.activeJobs.clear();
    this.progressCallbacks.clear();
  }
}

// Instância singleton do engine
export const renderEngine = new RenderEngine();

// Funções utilitárias para renderização
export const RenderUtils = {
  // Converter configurações para parâmetros de renderização
  settingsToRenderOptions(settings: ExportSettings): RenderOptions {
    return {
      format: settings.format,
      codec: settings.codec,
      resolution: settings.resolution,
      frameRate: settings.frameRate,
      videoBitrate: settings.videoBitrate,
      audioBitrate: settings.audioBitrate,
      audioSampleRate: settings.audioSampleRate,
      quality: settings.quality
    };
  },

  // Calcular duração estimada baseada na complexidade
  estimateRenderTime(settings: ExportSettings, duration: number): number {
    const complexityFactor = this.getComplexityFactor(settings);
    const baseDuration = duration * 2; // 2x a duração do vídeo como base
    return baseDuration * complexityFactor;
  },

  // Fator de complexidade baseado nas configurações
  getComplexityFactor(settings: ExportSettings): number {
    let factor = 1;
    
    // Resolução
    const area = settings.resolution.width * settings.resolution.height;
    if (area >= 3840 * 2160) factor *= 4; // 4K
    else if (area >= 1920 * 1080) factor *= 2; // 1080p
    else if (area >= 1280 * 720) factor *= 1.5; // 720p
    
    // Codec
    if (settings.codec === 'h265') factor *= 1.8;
    else if (settings.codec === 'vp9') factor *= 2;
    
    // Taxa de quadros
    if (settings.frameRate >= 60) factor *= 1.5;
    
    // Qualidade
    switch (settings.quality) {
      case 'ultra': factor *= 2; break;
      case 'high': factor *= 1.5; break;
      case 'low': factor *= 0.7; break;
    }
    
    return factor;
  },

  // Validar compatibilidade de formato e codec
  isCompatible(format: string, codec: string): boolean {
    const compatibility: Record<string, string[]> = {
      mp4: ['h264', 'h265'],
      mov: ['h264', 'h265'],
      avi: ['h264'],
      webm: ['vp8', 'vp9'],
      gif: ['gif']
    };
    
    return compatibility[format]?.includes(codec) || false;
  }
};