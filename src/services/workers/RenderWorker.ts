// Worker para renderização paralela de frames
import { CompositingEngine, CompositeLayer, CompositeSettings } from '../CompositingEngine';
import { AdvancedVFXEngine } from '../AdvancedVFXEngine';

interface WorkerMessage {
  type: 'init' | 'renderFrame' | 'dispose';
  data: any;
}

interface RenderFrameData {
  frameNumber: number;
  time: number;
  layers: CompositeLayer[];
  composition: CompositeSettings;
  width: number;
  height: number;
}

class RenderWorker {
  private compositingEngine?: CompositingEngine;
  private vfxEngine?: AdvancedVFXEngine;
  private canvas?: OffscreenCanvas;
  private isInitialized = false;

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { type, data } = event.data;

    try {
      switch (type) {
        case 'init':
          this.initialize(data);
          break;
        case 'renderFrame':
          this.renderFrame(data);
          break;
        case 'dispose':
          this.dispose();
          break;
        default:
          this.sendError(`Tipo de mensagem desconhecido: ${type}`);
      }
    } catch (error) {
      this.sendError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  private initialize(data: { width: number; height: number }): void {
    try {
      // Criar OffscreenCanvas
      this.canvas = new OffscreenCanvas(data.width, data.height);
      
      // Inicializar engines
      this.compositingEngine = new CompositingEngine(this.canvas as any);
      this.vfxEngine = new AdvancedVFXEngine();
      
      this.isInitialized = true;
      
      this.sendMessage('initialized', { success: true });
    } catch (error) {
      this.sendError(`Erro na inicialização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async renderFrame(data: RenderFrameData): Promise<void> {
    if (!this.isInitialized || !this.compositingEngine || !this.canvas) {
      this.sendError('Worker não inicializado');
      return;
    }

    try {
      const startTime = performance.now();
      
      // Configurar composição
      this.compositingEngine.updateSettings(data.composition);
      
      // Limpar camadas existentes
      this.compositingEngine.getAllLayers().forEach(layer => {
        this.compositingEngine!.removeLayer(layer.id);
      });
      
      // Adicionar camadas
      data.layers.forEach(layer => {
        this.compositingEngine!.addLayer(layer);
      });
      
      // Configurar tempo
      this.compositingEngine.setCurrentTime(data.time);
      
      // Renderizar frame
      this.compositingEngine.render();
      
      // Capturar ImageData
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Não foi possível obter contexto 2D');
      }
      
      const imageData = ctx.getImageData(0, 0, data.width, data.height);
      
      const renderTime = performance.now() - startTime;
      
      // Enviar resultado
      this.sendMessage('frameRendered', {
        frameNumber: data.frameNumber,
        imageData,
        renderTime
      });
      
      // Enviar progresso
      this.sendMessage('progress', {
        frameNumber: data.frameNumber,
        renderTime,
        message: `Frame ${data.frameNumber} renderizado em ${renderTime.toFixed(2)}ms`
      });
      
    } catch (error) {
      this.sendError(`Erro ao renderizar frame ${data.frameNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private dispose(): void {
    try {
      if (this.compositingEngine) {
        this.compositingEngine.dispose();
        this.compositingEngine = undefined;
      }
      
      if (this.vfxEngine) {
        this.vfxEngine.dispose();
        this.vfxEngine = undefined;
      }
      
      this.canvas = undefined;
      this.isInitialized = false;
      
      this.sendMessage('disposed', { success: true });
    } catch (error) {
      this.sendError(`Erro ao limpar worker: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private sendMessage(type: string, data: any): void {
    self.postMessage({ type, data });
  }

  private sendError(message: string): void {
    self.postMessage({ type: 'error', data: { message } });
  }
}

// Inicializar worker
new RenderWorker();

// Exportar tipos para uso externo
export type { WorkerMessage, RenderFrameData };