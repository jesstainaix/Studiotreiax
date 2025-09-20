import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { create } from 'zustand';

export interface VideoOperation {
  type: 'trim' | 'resize' | 'filter' | 'encode' | 'extract_frames' | 'generate_thumbnails';
  parameters: Record<string, any>;
  startTime?: number;
  duration?: number;
}

export interface ProcessingProgress {
  progress: number;
  message: string;
  isComplete: boolean;
  error?: string;
}

export interface VideoProcessorState {
  isLoaded: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  ffmpeg: FFmpeg | null;
  loadFFmpeg: () => Promise<void>;
  processVideo: (input: File, operations: VideoOperation[]) => Promise<Blob>;
  extractFrames: (video: File, fps: number) => Promise<ImageData[]>;
  generateThumbnails: (video: File, count: number) => Promise<string[]>;
  setProgress: (progress: ProcessingProgress) => void;
}

class VideoProcessingService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  constructor() {}

  private setupEventListeners() {
    if (!this.ffmpeg) return;
    this.ffmpeg.on('log', ({ message }) => {
    });

    this.ffmpeg.on('progress', ({ progress, time }) => {
      const progressPercent = Math.round(progress * 100);
      useVideoProcessor.getState().setProgress({
        progress: progressPercent,
        message: `Processando... ${progressPercent}% (${time}s)`,
        isComplete: false
      });
    });
  }

  async loadFFmpeg(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      this.ffmpeg = new FFmpeg();
      this.setupEventListeners();

      // Verificar se o ambiente suporta WebAssembly
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly não é suportado neste navegador');
      }

      // Verificar se estamos em um contexto seguro (HTTPS ou localhost)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
        console.warn('FFmpeg pode não funcionar corretamente em contextos não seguros');
      }

      useVideoProcessor.getState().setProgress({
        progress: 0,
        message: 'Carregando FFmpeg...',
        isComplete: false
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      // Tentar carregar com timeout
      const loadPromise = this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
      });

      // Timeout de 30 segundos para carregamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar FFmpeg')), 30000);
      });

      await Promise.race([loadPromise, timeoutPromise]);

      this.isLoaded = true;
      
      useVideoProcessor.getState().setProgress({
        progress: 100,
        message: 'FFmpeg carregado com sucesso!',
        isComplete: true
      });
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      
      let errorMessage = 'Erro ao carregar FFmpeg';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Erro de rede ao carregar FFmpeg. Verifique sua conexão.';
        } else if (error.message.includes('WebAssembly')) {
          errorMessage = 'Navegador não suporta WebAssembly necessário para FFmpeg.';
        } else if (error.message.includes('Timeout')) {
          errorMessage = 'Timeout ao carregar FFmpeg. Tente novamente.';
        } else {
          errorMessage = `Erro ao carregar FFmpeg: ${error.message}`;
        }
      }
      
      useVideoProcessor.getState().setProgress({
        progress: 0,
        message: errorMessage,
        isComplete: false,
        error: errorMessage
      });
      
      this.isLoaded = false;
      throw new Error(errorMessage);
    }
  }

  async processVideo(input: File, operations: VideoOperation[]): Promise<Blob> {
    // Verificações de segurança
    if (!input || input.size === 0) {
      throw new Error('Arquivo de vídeo inválido ou vazio');
    }

    if (input.size > 500 * 1024 * 1024) { // 500MB limit
      throw new Error('Arquivo muito grande. Limite máximo: 500MB');
    }

    if (!this.isLoaded) {
      await this.loadFFmpeg();
    }

    try {
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';

      useVideoProcessor.getState().setProgress({
        progress: 10,
        message: 'Carregando arquivo...',
        isComplete: false
      });

      // Write input file to FFmpeg filesystem
      await this.ffmpeg.writeFile(inputName, await fetchFile(input));

      useVideoProcessor.getState().setProgress({
        progress: 30,
        message: 'Preparando processamento...',
        isComplete: false
      });

      // Build FFmpeg command based on operations
      const command = this.buildFFmpegCommand(inputName, outputName, operations);
      
      useVideoProcessor.getState().setProgress({
        progress: 40,
        message: 'Iniciando processamento...',
        isComplete: false
      });

      // Execute FFmpeg command with timeout
      const processPromise = this.ffmpeg.exec(command);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout no processamento de vídeo')), 120000); // 2 minutos
      });

      await Promise.race([processPromise, timeoutPromise]);

      useVideoProcessor.getState().setProgress({
        progress: 80,
        message: 'Finalizando...',
        isComplete: false
      });

      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      
      if (!data || data.byteLength === 0) {
        throw new Error('Falha ao gerar arquivo de saída');
      }
      
      const blob = new Blob([data], { type: 'video/mp4' });

      // Clean up
      try {
        await this.ffmpeg.deleteFile(inputName);
        await this.ffmpeg.deleteFile(outputName);
      } catch (cleanupError) {
        console.warn('Erro na limpeza de arquivos temporários:', cleanupError);
      }

      useVideoProcessor.getState().setProgress({
        progress: 100,
        message: 'Processamento concluído!',
        isComplete: true
      });

      return blob;
    } catch (error) {
      console.error('Video processing failed:', error);
      
      let errorMessage = 'Erro no processamento';
      if (error instanceof Error) {
        if (error.message.includes('Timeout')) {
          errorMessage = 'Processamento demorou muito tempo. Tente com um arquivo menor.';
        } else if (error.message.includes('memory') || error.message.includes('Memory')) {
          errorMessage = 'Memória insuficiente para processar o vídeo.';
        } else if (error.message.includes('format') || error.message.includes('codec')) {
          errorMessage = 'Formato de vídeo não suportado.';
        } else {
          errorMessage = `Erro no processamento: ${error.message}`;
        }
      }
      
      useVideoProcessor.getState().setProgress({
        progress: 0,
        message: errorMessage,
        isComplete: false,
        error: errorMessage
      });
      
      // Tentar limpar arquivos em caso de erro
      try {
        await this.ffmpeg.deleteFile('input.mp4');
        await this.ffmpeg.deleteFile('output.mp4');
      } catch {
        // Ignorar erros de limpeza
      }
      
      throw new Error(errorMessage);
    }
  }

  async extractFrames(video: File, fps: number = 1): Promise<ImageData[]> {
    if (!this.isLoaded) {
      await this.loadFFmpeg();
    }

    try {
      const inputName = 'input.mp4';
      const outputPattern = 'frame_%03d.png';

      await this.ffmpeg.writeFile(inputName, await fetchFile(video));

      // Extract frames at specified fps
      await this.ffmpeg.exec([
        '-i', inputName,
        '-vf', `fps=${fps}`,
        '-y', outputPattern
      ]);

      // Read extracted frames
      const frames: ImageData[] = [];
      let frameIndex = 1;

      while (true) {
        try {
          const frameName = `frame_${frameIndex.toString().padStart(3, '0')}.png`;
          const frameData = await this.ffmpeg.readFile(frameName);
          
          // Convert to ImageData
          const blob = new Blob([frameData], { type: 'image/png' });
          const imageData = await this.blobToImageData(blob);
          frames.push(imageData);
          
          await this.ffmpeg.deleteFile(frameName);
          frameIndex++;
        } catch {
          break; // No more frames
        }
      }

      await this.ffmpeg.deleteFile(inputName);
      return frames;
    } catch (error) {
      console.error('Frame extraction failed:', error);
      throw error;
    }
  }

  async generateThumbnails(video: File, count: number = 5): Promise<string[]> {
    if (!this.isLoaded) {
      await this.loadFFmpeg();
    }

    try {
      const inputName = 'input.mp4';
      const outputPattern = 'thumb_%03d.jpg';

      await this.ffmpeg.writeFile(inputName, await fetchFile(video));

      // Generate thumbnails at equal intervals
      await this.ffmpeg.exec([
        '-i', inputName,
        '-vf', `select='not(mod(n\,${Math.floor(30 / count)}))',scale=320:180`,
        '-frames:v', count.toString(),
        '-y', outputPattern
      ]);

      // Read generated thumbnails
      const thumbnails: string[] = [];
      
      for (let i = 1; i <= count; i++) {
        try {
          const thumbName = `thumb_${i.toString().padStart(3, '0')}.jpg`;
          const thumbData = await this.ffmpeg.readFile(thumbName);
          
          const blob = new Blob([thumbData], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          thumbnails.push(url);
          
          await this.ffmpeg.deleteFile(thumbName);
        } catch {
          break;
        }
      }

      await this.ffmpeg.deleteFile(inputName);
      return thumbnails;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw error;
    }
  }

  private buildFFmpegCommand(input: string, output: string, operations: VideoOperation[]): string[] {
    const command = ['-i', input];
    const filters: string[] = [];

    for (const operation of operations) {
      switch (operation.type) {
        case 'trim':
          if (operation.startTime !== undefined) {
            command.push('-ss', operation.startTime.toString());
          }
          if (operation.duration !== undefined) {
            command.push('-t', operation.duration.toString());
          }
          break;

        case 'resize':
          const { width, height } = operation.parameters;
          filters.push(`scale=${width}:${height}`);
          break;

        case 'filter':
          const { filterName, filterParams } = operation.parameters;
          filters.push(`${filterName}=${filterParams}`);
          break;

        case 'encode':
          const { codec, bitrate, quality } = operation.parameters;
          if (codec) command.push('-c:v', codec);
          if (bitrate) command.push('-b:v', bitrate);
          if (quality) command.push('-crf', quality.toString());
          break;
      }
    }

    if (filters.length > 0) {
      command.push('-vf', filters.join(','));
    }

    command.push('-y', output);
    return command;
  }

  private async blobToImageData(blob: Blob): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }
}

// Zustand store for video processing state
export const useVideoProcessor = create<VideoProcessorState>((set, get) => {
  const service = new VideoProcessingService();

  return {
    isLoaded: false,
    isProcessing: false,
    progress: null,
    ffmpeg: null,
    
    loadFFmpeg: async () => {
      set({ isProcessing: true });
      try {
        await service.loadFFmpeg();
        set({ isLoaded: true, isProcessing: false });
      } catch (error) {
        set({ isProcessing: false });
        throw error;
      }
    },

    processVideo: async (input: File, operations: VideoOperation[]) => {
      set({ isProcessing: true });
      try {
        const result = await service.processVideo(input, operations);
        set({ isProcessing: false });
        return result;
      } catch (error) {
        set({ isProcessing: false });
        throw error;
      }
    },

    extractFrames: async (video: File, fps: number) => {
      set({ isProcessing: true });
      try {
        const result = await service.extractFrames(video, fps);
        set({ isProcessing: false });
        return result;
      } catch (error) {
        set({ isProcessing: false });
        throw error;
      }
    },

    generateThumbnails: async (video: File, count: number) => {
      set({ isProcessing: true });
      try {
        const result = await service.generateThumbnails(video, count);
        set({ isProcessing: false });
        return result;
      } catch (error) {
        set({ isProcessing: false });
        throw error;
      }
    },

    setProgress: (progress: ProcessingProgress) => {
      set({ progress });
    }
  };
});

export default VideoProcessingService;