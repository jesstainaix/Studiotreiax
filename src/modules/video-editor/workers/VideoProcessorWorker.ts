// Worker para processamento de vídeo em background
// Evita bloquear a UI principal durante operações pesadas

interface VideoProcessorMessage {
  id: string;
  type: 'GENERATE_THUMBNAIL' | 'EXTRACT_METADATA' | 'PROCESS_VIDEO' | 'CONVERT_FORMAT';
  payload: any;
}

interface VideoProcessorResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  data?: any;
  error?: string;
  progress?: number;
}

class VideoProcessorWorker {
  private activeJobs: Map<string, AbortController> = new Map();

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent<VideoProcessorMessage>) {
    const { id, type, payload } = event.data;

    try {
      const controller = new AbortController();
      this.activeJobs.set(id, controller);

      switch (type) {
        case 'GENERATE_THUMBNAIL':
          await this.generateThumbnail(id, payload, controller.signal);
          break;
        case 'EXTRACT_METADATA':
          await this.extractMetadata(id, payload, controller.signal);
          break;
        case 'PROCESS_VIDEO':
          await this.processVideo(id, payload, controller.signal);
          break;
        case 'CONVERT_FORMAT':
          await this.convertFormat(id, payload, controller.signal);
          break;
        default:
          throw new Error(`Tipo de operação não suportado: ${type}`);
      }
    } catch (error) {
      this.sendResponse({
        id,
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      this.activeJobs.delete(id);
    }
  }

  private async generateThumbnail(
    id: string, 
    payload: { file: File; time?: number }, 
    signal: AbortSignal
  ) {
    try {
      const { file, time = 0 } = payload;

      if (file.type.startsWith('image/')) {
        // Para imagens, usar como próprio thumbnail
        const thumbnailUrl = URL.createObjectURL(file);
        this.sendResponse({
          id,
          type: 'SUCCESS',
          data: { thumbnailUrl }
        });
        return;
      }

      if (file.type.startsWith('video/')) {
        // Gerar thumbnail do vídeo
        const thumbnailUrl = await this.generateVideoThumbnail(file, time, signal);
        this.sendResponse({
          id,
          type: 'SUCCESS',
          data: { thumbnailUrl }
        });
        return;
      }

      // Para outros tipos, usar thumbnail padrão
      this.sendResponse({
        id,
        type: 'SUCCESS',
        data: { thumbnailUrl: '/assets/default-thumbnail.png' }
      });

    } catch (error) {
      throw new Error(`Erro ao gerar thumbnail: ${error}`);
    }
  }

  private async generateVideoThumbnail(
    file: File, 
    time: number, 
    signal: AbortSignal
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto 2D'));
        return;
      }

      video.addEventListener('loadeddata', () => {
        if (signal.aborted) {
          reject(new Error('Operação cancelada'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('Falha ao gerar thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      });

      video.addEventListener('error', () => {
        reject(new Error('Erro ao carregar vídeo'));
      });

      video.currentTime = time;
      video.src = URL.createObjectURL(file);
    });
  }

  private async extractMetadata(
    id: string, 
    payload: { file: File }, 
    signal: AbortSignal
  ) {
    try {
      const { file } = payload;
      const metadata: Record<string, any> = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };

      if (file.type.startsWith('video/')) {
        const videoMetadata = await this.extractVideoMetadata(file, signal);
        Object.assign(metadata, videoMetadata);
      } else if (file.type.startsWith('audio/')) {
        const audioMetadata = await this.extractAudioMetadata(file, signal);
        Object.assign(metadata, audioMetadata);
      } else if (file.type.startsWith('image/')) {
        const imageMetadata = await this.extractImageMetadata(file, signal);
        Object.assign(metadata, imageMetadata);
      }

      this.sendResponse({
        id,
        type: 'SUCCESS',
        data: { metadata }
      });

    } catch (error) {
      throw new Error(`Erro ao extrair metadados: ${error}`);
    }
  }

  private async extractVideoMetadata(file: File, signal: AbortSignal): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.addEventListener('loadedmetadata', () => {
        if (signal.aborted) {
          reject(new Error('Operação cancelada'));
          return;
        }

        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          hasAudio: video.audioTracks?.length > 0
        });
      });

      video.addEventListener('error', () => {
        reject(new Error('Erro ao carregar metadados do vídeo'));
      });

      video.src = URL.createObjectURL(file);
    });
  }

  private async extractAudioMetadata(file: File, signal: AbortSignal): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');

      audio.addEventListener('loadedmetadata', () => {
        if (signal.aborted) {
          reject(new Error('Operação cancelada'));
          return;
        }

        resolve({
          duration: audio.duration,
          channels: audio.audioTracks?.length || 1
        });
      });

      audio.addEventListener('error', () => {
        reject(new Error('Erro ao carregar metadados do áudio'));
      });

      audio.src = URL.createObjectURL(file);
    });
  }

  private async extractImageMetadata(file: File, signal: AbortSignal): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.addEventListener('load', () => {
        if (signal.aborted) {
          reject(new Error('Operação cancelada'));
          return;
        }

        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      });

      img.addEventListener('error', () => {
        reject(new Error('Erro ao carregar metadados da imagem'));
      });

      img.src = URL.createObjectURL(file);
    });
  }

  private async processVideo(
    id: string, 
    payload: { file: File; operations: any[] }, 
    signal: AbortSignal
  ) {
    try {
      const { file, operations } = payload;

      // Simular processamento de vídeo
      // Em implementação real, usaria FFmpeg.wasm ou similar
      
      for (let i = 0; i < operations.length; i++) {
        if (signal.aborted) {
          throw new Error('Operação cancelada');
        }

        const operation = operations[i];
        
        // Simular progresso
        const progress = ((i + 1) / operations.length) * 100;
        this.sendResponse({
          id,
          type: 'PROGRESS',
          progress
        });

        // Simular tempo de processamento
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Resultado final (mock)
      const processedUrl = URL.createObjectURL(file);
      
      this.sendResponse({
        id,
        type: 'SUCCESS',
        data: { processedUrl }
      });

    } catch (error) {
      throw new Error(`Erro no processamento: ${error}`);
    }
  }

  private async convertFormat(
    id: string, 
    payload: { file: File; targetFormat: string }, 
    signal: AbortSignal
  ) {
    try {
      const { file, targetFormat } = payload;

      // Simular conversão de formato
      // Em implementação real, usaria FFmpeg.wasm
      
      // Simular progresso
      for (let progress = 0; progress <= 100; progress += 20) {
        if (signal.aborted) {
          throw new Error('Operação cancelada');
        }

        this.sendResponse({
          id,
          type: 'PROGRESS',
          progress
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Resultado final (mock)
      const convertedUrl = URL.createObjectURL(file);
      
      this.sendResponse({
        id,
        type: 'SUCCESS',
        data: { 
          convertedUrl,
          format: targetFormat,
          originalFormat: file.type
        }
      });

    } catch (error) {
      throw new Error(`Erro na conversão: ${error}`);
    }
  }

  private sendResponse(response: VideoProcessorResponse) {
    self.postMessage(response);
  }

  public cancelJob(id: string) {
    const controller = this.activeJobs.get(id);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(id);
    }
  }
}

// Inicializar worker
const worker = new VideoProcessorWorker();

// Export para TypeScript
export {};