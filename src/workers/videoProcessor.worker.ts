// Web Worker para processamento de vídeo em background
// Permite operações pesadas sem bloquear a UI principal

interface VideoProcessingMessage {
  type: 'PROCESS_VIDEO' | 'COMPRESS_VIDEO' | 'EXTRACT_FRAMES' | 'APPLY_EFFECTS';
  payload: {
    videoData?: ArrayBuffer;
    options?: {
      quality?: number;
      format?: string;
      width?: number;
      height?: number;
      effects?: string[];
      frameRate?: number;
    };
    frameCount?: number;
    startTime?: number;
    endTime?: number;
  };
  id: string;
}

interface VideoProcessingResponse {
  type: 'PROCESSING_COMPLETE' | 'PROCESSING_ERROR' | 'PROCESSING_PROGRESS';
  payload: {
    result?: ArrayBuffer | string[];
    progress?: number;
    error?: string;
    metadata?: {
      duration?: number;
      size?: number;
      format?: string;
      dimensions?: { width: number; height: number };
    };
  };
  id: string;
}

// Cache para otimização de processamento
const processingCache = new Map<string, any>();

// Função para compressão de vídeo
async function compressVideo(
  videoData: ArrayBuffer,
  options: { quality?: number; format?: string; width?: number; height?: number }
): Promise<ArrayBuffer> {
  const cacheKey = `compress_${options.quality}_${options.format}_${options.width}x${options.height}`;
  
  if (processingCache.has(cacheKey)) {
    return processingCache.get(cacheKey);
  }

  // Simulação de compressão (em produção, usar FFmpeg.wasm ou similar)
  const compressedSize = Math.floor(videoData.byteLength * (options.quality || 0.8));
  const compressedData = new ArrayBuffer(compressedSize);
  
  // Simular progresso de compressão
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 50));
    self.postMessage({
      type: 'PROCESSING_PROGRESS',
      payload: { progress: i },
      id: 'current'
    } as VideoProcessingResponse);
  }

  processingCache.set(cacheKey, compressedData);
  return compressedData;
}

// Função para extração de frames
async function extractFrames(
  videoData: ArrayBuffer,
  frameCount: number = 10
): Promise<string[]> {
  const frames: string[] = [];
  
  // Simulação de extração de frames
  for (let i = 0; i < frameCount; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simular criação de frame como base64
    const canvas = new OffscreenCanvas(320, 240);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Criar frame simulado
      ctx.fillStyle = `hsl(${(i * 36) % 360}, 70%, 50%)`;
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`Frame ${i + 1}`, 10, 30);
      
      const blob = await canvas.convertToBlob();
      const reader = new FileReader();
      
      const frameData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      frames.push(frameData);
    }
    
    // Reportar progresso
    const progress = Math.floor(((i + 1) / frameCount) * 100);
    self.postMessage({
      type: 'PROCESSING_PROGRESS',
      payload: { progress },
      id: 'current'
    } as VideoProcessingResponse);
  }
  
  return frames;
}

// Função para aplicar efeitos
async function applyEffects(
  videoData: ArrayBuffer,
  effects: string[]
): Promise<ArrayBuffer> {
  let processedData = videoData;
  
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    
    // Simular aplicação de efeito
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simular modificação dos dados
    const newSize = Math.floor(processedData.byteLength * 1.1);
    processedData = new ArrayBuffer(newSize);
    
    const progress = Math.floor(((i + 1) / effects.length) * 100);
    self.postMessage({
      type: 'PROCESSING_PROGRESS',
      payload: { progress },
      id: 'current'
    } as VideoProcessingResponse);
  }
  
  return processedData;
}

// Listener principal do worker
self.addEventListener('message', async (event: MessageEvent<VideoProcessingMessage>) => {
  const { type, payload, id } = event.data;
  
  try {
    switch (type) {
      case 'PROCESS_VIDEO': {
        if (!payload.videoData) {
          throw new Error('Dados de vídeo não fornecidos');
        }
        
        const result = await compressVideo(payload.videoData, payload.options || {});
        
        self.postMessage({
          type: 'PROCESSING_COMPLETE',
          payload: {
            result,
            metadata: {
              size: result.byteLength,
              format: payload.options?.format || 'mp4'
            }
          },
          id
        } as VideoProcessingResponse);
        break;
      }
      
      case 'COMPRESS_VIDEO': {
        if (!payload.videoData) {
          throw new Error('Dados de vídeo não fornecidos');
        }
        
        const result = await compressVideo(payload.videoData, payload.options || {});
        
        self.postMessage({
          type: 'PROCESSING_COMPLETE',
          payload: {
            result,
            metadata: {
              size: result.byteLength,
              format: payload.options?.format || 'mp4'
            }
          },
          id
        } as VideoProcessingResponse);
        break;
      }
      
      case 'EXTRACT_FRAMES': {
        if (!payload.videoData) {
          throw new Error('Dados de vídeo não fornecidos');
        }
        
        const frames = await extractFrames(payload.videoData, payload.frameCount);
        
        self.postMessage({
          type: 'PROCESSING_COMPLETE',
          payload: { result: frames },
          id
        } as VideoProcessingResponse);
        break;
      }
      
      case 'APPLY_EFFECTS': {
        if (!payload.videoData || !payload.options?.effects) {
          throw new Error('Dados de vídeo ou efeitos não fornecidos');
        }
        
        const result = await applyEffects(payload.videoData, payload.options.effects);
        
        self.postMessage({
          type: 'PROCESSING_COMPLETE',
          payload: {
            result,
            metadata: {
              size: result.byteLength
            }
          },
          id
        } as VideoProcessingResponse);
        break;
      }
      
      default:
        throw new Error(`Tipo de operação não suportado: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'PROCESSING_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      id
    } as VideoProcessingResponse);
  }
});

// Exportar tipos para uso no código principal
export type { VideoProcessingMessage, VideoProcessingResponse };