import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  RotateCcw,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';
import { PreviewState } from '../../../modules/video-editor/types/Media.types';

interface VideoPreviewProps {
  engine: TimelineEngine;
  width?: number;
  height?: number;
  onFullscreen?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  engine,
  width = 854,
  height = 480,
  onFullscreen
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewState, setPreviewState] = useState<PreviewState>({
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    quality: 'auto',
    fullscreen: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const animationFrameRef = useRef<number>();

  // Atualizar estado do preview quando a timeline muda
  useEffect(() => {
    const handleTimeChange = (time: number) => {
      setPreviewState(prev => ({ ...prev, currentTime: time }));
      renderFrame(time);
    };

    const handlePlayStateChange = (isPlaying: boolean) => {
      setPreviewState(prev => ({ ...prev, isPlaying }));
      if (isPlaying) {
        startPlayback();
      } else {
        stopPlayback();
      }
    };

    engine.addEventListener('timeChanged', handleTimeChange);
    engine.addEventListener('playStateChanged', handlePlayStateChange);

    return () => {
      engine.removeEventListener('timeChanged', handleTimeChange);
      engine.removeEventListener('playStateChanged', handlePlayStateChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [engine]);

  // Renderizar frame atual
  const renderFrame = useCallback(async (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoading(true);

    try {
      // Limpar canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Obter itens ativos no tempo atual
      const timelineState = engine.getState();
      const activeItems = getActiveItemsAtTime(timelineState.tracks, time);

      // Renderizar cada item por ordem de z-index
      activeItems.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      // Renderizar itens usando time-slicing para evitar Long Tasks
      await renderItemsWithTimeSlicing(ctx, activeItems, time, canvas.width, canvas.height);

      // Adicionar overlays (se necessário)
      renderOverlays(ctx, canvas.width, canvas.height, time);

    } catch (error) {
      console.error('Erro ao renderizar frame:', error);
      
      // Renderizar frame de erro
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Erro de Renderização', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  // Renderizar itens com time-slicing para evitar bloquear o thread principal
  const renderItemsWithTimeSlicing = async (
    ctx: CanvasRenderingContext2D,
    items: any[],
    time: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const CHUNK_SIZE = 3; // Processar 3 itens por vez
    const FRAME_BUDGET = 16; // 16ms por frame para manter 60fps
    
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const startTime = performance.now();
      const chunk = items.slice(i, i + CHUNK_SIZE);
      
      // Renderizar chunk atual
      for (const item of chunk) {
        await renderItem(ctx, item, time, canvasWidth, canvasHeight);
      }
      
      const processingTime = performance.now() - startTime;
      
      // Se excedeu o orçamento de frame, dar uma pausa
      if (processingTime > FRAME_BUDGET && i + CHUNK_SIZE < items.length) {
        await new Promise(resolve => {
          if (window.requestIdleCallback) {
            window.requestIdleCallback(() => resolve(void 0), { timeout: 5 });
          } else {
            setTimeout(resolve, 0);
          }
        });
      }
    }
  };

  const getActiveItemsAtTime = (tracks: any[], time: number) => {
    const activeItems = [];
    
    for (const track of tracks) {
      if (!track.visible) continue;
      
      for (const item of track.items) {
        if (time >= item.startTime && time < item.startTime + item.duration) {
          activeItems.push(item);
        }
      }
    }
    
    return activeItems;
  };

  const renderItem = async (
    ctx: CanvasRenderingContext2D,
    item: any,
    time: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const itemTime = time - item.startTime;
    const progress = itemTime / item.duration;

    switch (item.type) {
      case 'video':
        await renderVideoItem(ctx, item, itemTime, canvasWidth, canvasHeight);
        break;
      case 'image':
        await renderImageItem(ctx, item, canvasWidth, canvasHeight);
        break;
      case 'text':
        renderTextItem(ctx, item, progress, canvasWidth, canvasHeight);
        break;
      case 'effect':
        renderEffectItem(ctx, item, progress, canvasWidth, canvasHeight);
        break;
    }
  };

  const renderVideoItem = async (
    ctx: CanvasRenderingContext2D,
    item: any,
    itemTime: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Para demonstração, renderizar um retângulo colorido
    // Em implementação real, renderizaria o frame do vídeo
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Adicionar nome do item
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, canvasWidth / 2, canvasHeight / 2);
    ctx.textAlign = 'left';
  };

  const renderImageItem = async (
    ctx: CanvasRenderingContext2D,
    item: any,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Renderizar imagem (placeholder)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Imagem: ${item.name}`, canvasWidth / 2, canvasHeight / 2);
    ctx.textAlign = 'left';
  };

  const renderTextItem = (
    ctx: CanvasRenderingContext2D,
    item: any,
    progress: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const text = item.properties?.text || item.name;
    const fontSize = item.properties?.fontSize || 48;
    const color = item.properties?.color || '#ffffff';
    const position = item.properties?.position || { x: 0.5, y: 0.5 };

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    
    const x = canvasWidth * position.x;
    const y = canvasHeight * position.y;
    
    // Animação de fade-in/fade-out
    let alpha = 1;
    if (progress < 0.1) alpha = progress * 10;
    if (progress > 0.9) alpha = (1 - progress) * 10;
    
    ctx.globalAlpha = alpha;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  };

  const renderEffectItem = (
    ctx: CanvasRenderingContext2D,
    item: any,
    progress: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Renderizar efeitos visuais (placeholder)
    const intensity = item.properties?.intensity || 0.5;
    
    // Limitar número de partículas baseado na qualidade de preview
    const maxParticles = previewState.quality === 'high' ? 20 : 
                        previewState.quality === 'medium' ? 10 : 5;
    
    // Efeito de partículas otimizado
    ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
    ctx.beginPath();
    
    // Usar um único path para todas as partículas (mais eficiente)
    for (let i = 0; i < maxParticles; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      const size = Math.random() * 5 + 2;
      
      ctx.moveTo(x + size, y);
      ctx.arc(x, y, size, 0, Math.PI * 2);
    }
    
    ctx.fill();
  };

  const renderOverlays = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    time: number
  ) => {
    // Renderizar overlays do sistema (timecode, etc)
    if (previewState.quality !== 'auto') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 120, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`Qualidade: ${previewState.quality}`, 15, 30);
    }

    // Timecode
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    const timecode = `${minutes}:${seconds.padStart(5, '0')}`;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvasWidth - 120, canvasHeight - 40, 110, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(timecode, canvasWidth - 115, canvasHeight - 20);
  };

  // Controle de reprodução otimizado
  const startPlayback = useCallback(() => {
    let lastFrameTime = 0;
    const targetFPS = previewState.quality === 'high' ? 60 : 
                     previewState.quality === 'medium' ? 30 : 15;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentFrameTime: number) => {
      // Throttling baseado na qualidade de preview
      if (currentFrameTime - lastFrameTime < frameInterval) {
        if (engine.getState().isPlaying) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }
      
      lastFrameTime = currentFrameTime;
      const startTime = performance.now();
      
      const currentTime = engine.getCurrentTime();
      const duration = engine.getDuration();
      
      if (currentTime >= duration) {
        engine.stop();
        return;
      }
      
      const nextTime = currentTime + (1/targetFPS) * previewState.playbackRate;
      engine.setCurrentTime(nextTime);
      
      // Monitorar performance do frame
      const frameTime = performance.now() - startTime;
      if (frameTime > 16.67) { // Mais de 16.67ms indica possível jank
        console.warn(`Frame demorou ${frameTime.toFixed(2)}ms para renderizar`);
      }
      
      if (engine.getState().isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [engine, previewState.playbackRate, previewState.quality]);

  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Handlers de controle
  const handlePlay = () => {
    if (previewState.isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };

  const handleStop = () => {
    engine.stop();
  };

  const handleVolumeChange = (volume: number[]) => {
    setPreviewState(prev => ({ ...prev, volume: volume[0] }));
  };

  const handleMute = () => {
    setPreviewState(prev => ({ ...prev, muted: !prev.muted }));
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(engine.getCurrentTime() + seconds, engine.getDuration()));
    engine.setCurrentTime(newTime);
  };

  const handleQualityChange = (quality: PreviewState['quality']) => {
    setPreviewState(prev => ({ ...prev, quality }));
    // Re-renderizar com nova qualidade
    renderFrame(engine.getCurrentTime());
  };

  // Renderização inicial
  useEffect(() => {
    renderFrame(0);
  }, [renderFrame]);

  return (
    <Card className="flex flex-col bg-gray-900 text-white">
      {/* Header com controles de qualidade */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="flex items-center space-x-2">
          <select
            value={previewState.quality}
            onChange={(e) => handleQualityChange(e.target.value as PreviewState['quality'])}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
          >
            <option value="auto">Auto</option>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={onFullscreen}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas de Preview */}
      <div ref={containerRef} className="relative bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="max-w-full max-h-full"
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white">Renderizando...</div>
          </div>
        )}
      </div>

      {/* Controles de reprodução */}
      <div className="p-4 space-y-3">
        {/* Botões principais */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(-10)}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={handlePlay}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            {previewState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSkip(10)}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Controles de volume e velocidade */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMute}
              className="text-white hover:bg-gray-700"
            >
              {previewState.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="w-20">
              <Slider
                value={[previewState.muted ? 0 : previewState.volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm">Velocidade:</span>
            <select
              value={previewState.playbackRate}
              onChange={(e) => setPreviewState(prev => ({ ...prev, playbackRate: parseFloat(e.target.value) }))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {/* Informações */}
        <div className="flex justify-between text-sm text-gray-400">
          <span>
            {Math.floor(previewState.currentTime / 60)}:{(previewState.currentTime % 60).toFixed(1).padStart(4, '0')}
          </span>
          <span>
            {Math.floor(engine.getDuration() / 60)}:{(engine.getDuration() % 60).toFixed(0).padStart(2, '0')}
          </span>
        </div>
      </div>
    </Card>
  );
};