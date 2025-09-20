import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  ZoomIn,
  ZoomOut,
  Move,
  Grid3X3,
  Crosshair,
  Ruler,
  Eye,
  Monitor,
  Film,
  Camera,
  Target,
  Layers,
  Clock,
  Info,
  Maximize2,
  MoreHorizontal
} from 'lucide-react';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';

// Types para o Preview Avançado
interface AdvancedPreviewState {
  // Playback
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  loop: boolean;
  
  // Audio
  volume: number;
  muted: boolean;
  
  // Visual
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  quality: 'auto' | 'high' | 'medium' | 'low';
  
  // Display
  fullscreen: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showSafeZones: boolean;
  aspectRatio: string;
  
  // Advanced
  showWaveform: boolean;
  showHistogram: boolean;
  showVectorscope: boolean;
}

interface PreviewMarker {
  id: string;
  time: number;
  type: 'in' | 'out' | 'chapter' | 'cue' | 'custom';
  label?: string;
  color?: string;
}

interface PreviewHotkey {
  key: string;
  action: string;
  description: string;
}

interface AdvancedVideoPreviewProps {
  engine: TimelineEngine;
  width?: number;
  height?: number;
  onFullscreen?: () => void;
  onTimeChange?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  markers?: PreviewMarker[];
  onMarkerAdd?: (marker: Omit<PreviewMarker, 'id'>) => void;
  onMarkerRemove?: (markerId: string) => void;
}

export const AdvancedVideoPreview: React.FC<AdvancedVideoPreviewProps> = ({
  engine,
  width = 1920,
  height = 1080,
  onFullscreen,
  onTimeChange,
  onPlayStateChange,
  markers = [],
  onMarkerAdd,
  onMarkerRemove
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Estados
  const [previewState, setPreviewState] = useState<AdvancedPreviewState>({
    isPlaying: false,
    currentTime: 0,
    duration: engine.getDuration(),
    playbackRate: 1,
    loop: false,
    volume: 1,
    muted: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    quality: 'auto',
    fullscreen: false,
    showGrid: false,
    showRulers: false,
    showSafeZones: false,
    aspectRatio: '16:9',
    showWaveform: false,
    showHistogram: false,
    showVectorscope: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [renderStats, setRenderStats] = useState({
    fps: 0,
    renderTime: 0,
    frameCount: 0,
    droppedFrames: 0
  });

  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const [showControls, setShowControls] = useState(true);
  const [activePanel, setActivePanel] = useState<'playback' | 'display' | 'analysis' | 'markers'>('playback');

  // Computed properties
  const aspectRatios = useMemo(() => ({
    '16:9': { width: 16, height: 9 },
    '4:3': { width: 4, height: 3 },
    '21:9': { width: 21, height: 9 },
    '1:1': { width: 1, height: 1 },
    '9:16': { width: 9, height: 16 },
    'custom': { width: width, height: height }
  }), [width, height]);

  const playbackRates = useMemo(() => [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4], []);

  const hotkeys: PreviewHotkey[] = useMemo(() => [
    { key: 'Space', action: 'Play/Pause', description: 'Alternar reprodução' },
    { key: 'J', action: 'Reverse', description: 'Reprodução reversa' },
    { key: 'K', action: 'Pause', description: 'Pausar' },
    { key: 'L', action: 'Forward', description: 'Reprodução rápida' },
    { key: 'Home', action: 'Go to Start', description: 'Ir para início' },
    { key: 'End', action: 'Go to End', description: 'Ir para fim' },
    { key: 'Left', action: 'Frame Back', description: 'Frame anterior' },
    { key: 'Right', action: 'Frame Forward', description: 'Próximo frame' },
    { key: 'M', action: 'Toggle Mute', description: 'Silenciar/Ativar som' },
    { key: 'F', action: 'Fullscreen', description: 'Tela cheia' },
    { key: '+', action: 'Zoom In', description: 'Ampliar' },
    { key: '-', action: 'Zoom Out', description: 'Reduzir' },
    { key: '0', action: 'Reset Zoom', description: 'Resetar zoom' },
    { key: 'G', action: 'Toggle Grid', description: 'Mostrar/Ocultar grade' },
    { key: 'R', action: 'Toggle Rulers', description: 'Mostrar/Ocultar réguas' },
    { key: 'I', action: 'Mark In', description: 'Marcar entrada' },
    { key: 'O', action: 'Mark Out', description: 'Marcar saída' }
  ], []);

  // Engine state monitoring
  useEffect(() => {
    const handleStateChange = () => {
      const engineState = engine.getState();
      setPreviewState(prev => ({
        ...prev,
        duration: engine.getDuration()
      }));
    };

    engine.addEventListener('stateChanged', handleStateChange);
    return () => engine.removeEventListener('stateChanged', handleStateChange);
  }, [engine]);

  // Animation loop para renderização suave
  useEffect(() => {
    if (previewState.isPlaying) {
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastFrameTimeRef.current;
        lastFrameTimeRef.current = currentTime;

        // Atualizar tempo de reprodução
        const newTime = previewState.currentTime + (deltaTime / 1000) * previewState.playbackRate;
        const clampedTime = Math.min(newTime, previewState.duration);

        if (clampedTime >= previewState.duration && previewState.loop) {
          updateCurrentTime(0);
        } else if (clampedTime >= previewState.duration) {
          togglePlayback();
        } else {
          updateCurrentTime(clampedTime);
        }

        // Renderizar frame
        renderFrame(clampedTime);

        // Atualizar estatísticas
        updateRenderStats(deltaTime);

        if (previewState.isPlaying) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Renderizar frame estático quando pausado
      renderFrame(previewState.currentTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [previewState.isPlaying, previewState.playbackRate, previewState.loop, previewState.duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar conflitos quando estiver digitando
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          changePlaybackRate(-1);
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          if (previewState.isPlaying) togglePlayback();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          changePlaybackRate(1);
          break;
        case 'Home':
          e.preventDefault();
          updateCurrentTime(0);
          break;
        case 'End':
          e.preventDefault();
          updateCurrentTime(previewState.duration);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          frameStep(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          frameStep(1);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '=':
        case '+':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          toggleGrid();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          toggleRulers();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          addMarker('in');
          break;
        case 'o':
        case 'O':
          e.preventDefault();
          addMarker('out');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewState]);

  // Mouse/touch handlers para pan e zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Apenas botão esquerdo

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: previewState.panX,
      startPanY: previewState.panY
    });
  }, [previewState.panX, previewState.panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setPreviewState(prev => ({
      ...prev,
      panX: dragState.startPanX + deltaX / prev.zoom,
      panY: dragState.startPanY + deltaY / prev.zoom
    }));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5, previewState.zoom + zoomDelta));
      
      setPreviewState(prev => ({
        ...prev,
        zoom: newZoom
      }));
    } else {
      // Scrubbing horizontal
      const timeDelta = (e.deltaX + e.deltaY) / 100;
      const newTime = Math.max(0, Math.min(previewState.duration, previewState.currentTime + timeDelta));
      updateCurrentTime(newTime);
    }
  }, [previewState.zoom, previewState.currentTime, previewState.duration]);

  // Playback controls
  const togglePlayback = useCallback(() => {
    setPreviewState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    onPlayStateChange?.(!previewState.isPlaying);
  }, [previewState.isPlaying, onPlayStateChange]);

  const updateCurrentTime = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, previewState.duration));
    setPreviewState(prev => ({ ...prev, currentTime: clampedTime }));
    onTimeChange?.(clampedTime);
  }, [previewState.duration, onTimeChange]);

  const changePlaybackRate = useCallback((direction: number) => {
    const currentIndex = playbackRates.indexOf(previewState.playbackRate);
    const newIndex = Math.max(0, Math.min(playbackRates.length - 1, currentIndex + direction));
    
    setPreviewState(prev => ({ 
      ...prev, 
      playbackRate: playbackRates[newIndex],
      isPlaying: playbackRates[newIndex] !== 1 ? true : prev.isPlaying
    }));
  }, [previewState.playbackRate, playbackRates]);

  const frameStep = useCallback((direction: number) => {
    const frameRate = 30; // Assumindo 30fps
    const frameDuration = 1 / frameRate;
    const newTime = previewState.currentTime + (direction * frameDuration);
    updateCurrentTime(newTime);
  }, [previewState.currentTime, updateCurrentTime]);

  const toggleMute = useCallback(() => {
    setPreviewState(prev => ({ ...prev, muted: !prev.muted }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setPreviewState(prev => ({ ...prev, fullscreen: !prev.fullscreen }));
    onFullscreen?.();
  }, [onFullscreen]);

  // Display controls
  const zoomIn = useCallback(() => {
    setPreviewState(prev => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setPreviewState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
  }, []);

  const resetZoom = useCallback(() => {
    setPreviewState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  }, []);

  const toggleGrid = useCallback(() => {
    setPreviewState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const toggleRulers = useCallback(() => {
    setPreviewState(prev => ({ ...prev, showRulers: !prev.showRulers }));
  }, []);

  // Marker controls
  const addMarker = useCallback((type: PreviewMarker['type']) => {
    if (onMarkerAdd) {
      onMarkerAdd({
        time: previewState.currentTime,
        type,
        label: `${type.toUpperCase()} ${markers.length + 1}`,
        color: type === 'in' ? '#22c55e' : type === 'out' ? '#ef4444' : '#3b82f6'
      });
    }
  }, [previewState.currentTime, markers.length, onMarkerAdd]);

  // Render functions
  const renderFrame = useCallback(async (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();
    setIsLoading(true);

    try {
      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Aplicar transformações
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(previewState.zoom, previewState.zoom);
      ctx.translate(previewState.panX, previewState.panY);
      ctx.rotate((previewState.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Renderizar fundo
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Obter dados da timeline
      const timelineState = engine.getState();
      const activeItems = getActiveItemsAtTime(timelineState.tracks, time);

      // Renderizar items
      await renderItems(ctx, activeItems, time, canvas.width, canvas.height);

      // Restaurar transformações
      ctx.restore();

      // Renderizar overlays
      if (previewState.showGrid) renderGrid(ctx, canvas.width, canvas.height);
      if (previewState.showRulers) renderRulers(ctx, canvas.width, canvas.height);
      if (previewState.showSafeZones) renderSafeZones(ctx, canvas.width, canvas.height);

      // Renderizar informações de tempo
      renderTimeDisplay(ctx, time, canvas.width, canvas.height);

    } catch (error) {
      console.error('Erro ao renderizar frame:', error);
      renderErrorFrame(ctx, canvas.width, canvas.height, error);
    } finally {
      setIsLoading(false);
      
      // Atualizar estatísticas de renderização
      const renderTime = performance.now() - startTime;
      setRenderStats(prev => ({
        ...prev,
        renderTime,
        frameCount: prev.frameCount + 1
      }));
    }
  }, [engine, previewState.zoom, previewState.panX, previewState.panY, previewState.rotation, previewState.showGrid, previewState.showRulers, previewState.showSafeZones]);

  const getActiveItemsAtTime = (tracks: any[], time: number) => {
    const activeItems = [];
    
    for (const track of tracks) {
      if (!track.visible) continue;
      
      for (const item of track.items) {
        if (time >= item.startTime && time < item.startTime + item.duration) {
          activeItems.push({
            ...item,
            trackId: track.id,
            zIndex: item.zIndex || 0
          });
        }
      }
    }
    
    // Ordenar por z-index
    return activeItems.sort((a, b) => a.zIndex - b.zIndex);
  };

  const renderItems = async (
    ctx: CanvasRenderingContext2D,
    items: any[],
    time: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    for (const item of items) {
      await renderItem(ctx, item, time, canvasWidth, canvasHeight);
    }
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

    // Aplicar transformações do item
    ctx.save();
    
    if (item.properties?.transform) {
      const { x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, opacity = 1 } = item.properties.transform;
      
      ctx.globalAlpha = opacity;
      ctx.translate(canvasWidth * (x / 100), canvasHeight * (y / 100));
      ctx.scale(scaleX, scaleY);
      ctx.rotate((rotation * Math.PI) / 180);
    }

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

    ctx.restore();
  };

  const renderVideoItem = async (
    ctx: CanvasRenderingContext2D,
    item: any,
    itemTime: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (item.asset?.url) {
      try {
        // Em uma implementação real, usaria HTMLVideoElement
        // Por agora, renderizar placeholder
        ctx.fillStyle = '#374151';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 VIDEO', canvasWidth / 2, canvasHeight / 2);
        ctx.font = '24px Arial';
        ctx.fillText(item.asset.name || 'Video Item', canvasWidth / 2, canvasHeight / 2 + 50);
      } catch (error) {
        renderItemError(ctx, 'Erro ao carregar vídeo', canvasWidth, canvasHeight);
      }
    }
  };

  const renderImageItem = async (
    ctx: CanvasRenderingContext2D,
    item: any,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (item.asset?.url) {
      try {
        // Placeholder para imagem
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#60a5fa';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🖼️ IMAGE', canvasWidth / 2, canvasHeight / 2);
        ctx.font = '24px Arial';
        ctx.fillText(item.asset.name || 'Image Item', canvasWidth / 2, canvasHeight / 2 + 50);
      } catch (error) {
        renderItemError(ctx, 'Erro ao carregar imagem', canvasWidth, canvasHeight);
      }
    }
  };

  const renderTextItem = (
    ctx: CanvasRenderingContext2D,
    item: any,
    progress: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const text = item.properties?.text || 'Sample Text';
    const fontSize = item.properties?.fontSize || 48;
    const color = item.properties?.color || '#ffffff';
    const fontFamily = item.properties?.fontFamily || 'Arial';

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Aplicar efeitos de animação baseados no progresso
    if (item.properties?.animation) {
      applyTextAnimation(ctx, item.properties.animation, progress, canvasWidth, canvasHeight);
    }

    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
  };

  const renderEffectItem = (
    ctx: CanvasRenderingContext2D,
    item: any,
    progress: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Implementar efeitos específicos
    switch (item.effectType) {
      case 'fade':
        ctx.globalAlpha = item.properties?.opacity || (1 - progress);
        break;
      case 'blur':
        ctx.filter = `blur(${(item.properties?.intensity || 5) * progress}px)`;
        break;
      // Adicionar mais efeitos conforme necessário
    }
  };

  const applyTextAnimation = (
    ctx: CanvasRenderingContext2D,
    animation: string,
    progress: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    switch (animation) {
      case 'fadeIn':
        ctx.globalAlpha = progress;
        break;
      case 'slideInLeft':
        ctx.translate(-canvasWidth * (1 - progress), 0);
        break;
      case 'slideInRight':
        ctx.translate(canvasWidth * (1 - progress), 0);
        break;
      case 'slideInUp':
        ctx.translate(0, canvasHeight * (1 - progress));
        break;
      case 'slideInDown':
        ctx.translate(0, -canvasHeight * (1 - progress));
        break;
      case 'scaleIn':
        const scale = progress;
        ctx.scale(scale, scale);
        break;
    }
  };

  const renderGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Linhas verticais
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const renderRulers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const rulerSize = 30;
    const tickSize = 10;
    const majorTickSize = 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Régua horizontal
    ctx.fillRect(0, 0, width, rulerSize);
    for (let x = 0; x <= width; x += 50) {
      const isMajor = x % 100 === 0;
      ctx.beginPath();
      ctx.moveTo(x, rulerSize);
      ctx.lineTo(x, rulerSize - (isMajor ? majorTickSize : tickSize));
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(x.toString(), x, rulerSize - 5);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      }
    }

    // Régua vertical
    ctx.fillRect(0, 0, rulerSize, height);
    for (let y = 0; y <= height; y += 50) {
      const isMajor = y % 100 === 0;
      ctx.beginPath();
      ctx.moveTo(rulerSize, y);
      ctx.lineTo(rulerSize - (isMajor ? majorTickSize : tickSize), y);
      ctx.stroke();

      if (isMajor) {
        ctx.save();
        ctx.translate(rulerSize - 5, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(y.toString(), 0, 0);
        ctx.restore();
      }
    }
  };

  const renderSafeZones = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const actionSafe = 0.9; // 90% da área
    const titleSafe = 0.8;  // 80% da área

    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 2;

    // Action Safe Zone
    const actionWidth = width * actionSafe;
    const actionHeight = height * actionSafe;
    const actionX = (width - actionWidth) / 2;
    const actionY = (height - actionHeight) / 2;

    ctx.strokeRect(actionX, actionY, actionWidth, actionHeight);

    // Title Safe Zone
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    const titleWidth = width * titleSafe;
    const titleHeight = height * titleSafe;
    const titleX = (width - titleWidth) / 2;
    const titleY = (height - titleHeight) / 2;

    ctx.strokeRect(titleX, titleY, titleWidth, titleHeight);
  };

  const renderTimeDisplay = (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => {
    const timeString = formatTime(time);
    const durationString = formatTime(previewState.duration);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 200, height - 60, 190, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${timeString} / ${durationString}`, width - 10, height - 30);

    if (previewState.playbackRate !== 1) {
      ctx.fillText(`${previewState.playbackRate}x`, width - 10, height - 10);
    }
  };

  const renderErrorFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, error: any) => {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ef4444';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Erro de Renderização', width / 2, height / 2 - 20);
    ctx.font = '16px Arial';
    ctx.fillText(error?.message || 'Erro desconhecido', width / 2, height / 2 + 20);
  };

  const renderItemError = (ctx: CanvasRenderingContext2D, message: string, width: number, height: number) => {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.fillStyle = '#ef4444';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
  };

  const updateRenderStats = (deltaTime: number) => {
    setRenderStats(prev => {
      const fps = deltaTime > 0 ? 1000 / deltaTime : 0;
      return {
        ...prev,
        fps: Math.round(fps * 10) / 10
      };
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assumindo 30fps
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Calcular dimensões do canvas baseado no aspect ratio
  const canvasAspect = aspectRatios[previewState.aspectRatio];
  const containerAspect = width / height;
  const useAspect = canvasAspect.width / canvasAspect.height;

  let canvasWidth: number, canvasHeight: number;
  if (useAspect > containerAspect) {
    canvasWidth = width;
    canvasHeight = width / useAspect;
  } else {
    canvasHeight = height;
    canvasWidth = height * useAspect;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${previewState.fullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ width, height }}
    >
      {/* Canvas Principal */}
      <div className="relative flex items-center justify-center h-full">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border border-gray-700 cursor-grab active:cursor-grabbing"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            imageRendering: previewState.quality === 'high' ? 'auto' : 'pixelated'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Renderizando...</span>
            </div>
          </div>
        )}

        {/* Marcadores de Tempo */}
        {markers.length > 0 && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="relative h-2 bg-gray-700 rounded">
              {markers.map(marker => (
                <div
                  key={marker.id}
                  className="absolute top-0 w-1 h-full rounded"
                  style={{
                    left: `${(marker.time / previewState.duration) * 100}%`,
                    backgroundColor: marker.color || '#3b82f6'
                  }}
                  title={`${marker.label} - ${formatTime(marker.time)}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estatísticas de Renderização */}
        {renderStats.fps > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            FPS: {renderStats.fps} | Render: {renderStats.renderTime.toFixed(1)}ms
          </div>
        )}

        {/* Zoom Level */}
        {previewState.zoom !== 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            Zoom: {Math.round(previewState.zoom * 100)}%
          </div>
        )}
      </div>

      {/* Controles do Preview */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-95 p-4">
          <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as any)}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="playback" className="flex items-center space-x-1">
                <Play className="w-4 h-4" />
                <span>Reprodução</span>
              </TabsTrigger>
              <TabsTrigger value="display" className="flex items-center space-x-1">
                <Monitor className="w-4 h-4" />
                <span>Display</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>Análise</span>
              </TabsTrigger>
              <TabsTrigger value="markers" className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>Marcadores</span>
              </TabsTrigger>
            </TabsList>

            {/* Playback Controls */}
            <TabsContent value="playback" className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentTime(0)}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => frameStep(-1)}
                >
                  <Rewind className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={togglePlayback}
                  size="lg"
                  className="px-6"
                >
                  {previewState.isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => frameStep(1)}
                >
                  <FastForward className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentTime(previewState.duration)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400 min-w-20">
                  {formatTime(previewState.currentTime)}
                </span>
                
                <Slider
                  value={[previewState.currentTime]}
                  max={previewState.duration}
                  step={0.1}
                  className="flex-1"
                  onValueChange={([value]) => updateCurrentTime(value)}
                />
                
                <span className="text-sm text-gray-400 min-w-20">
                  {formatTime(previewState.duration)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMute}
                  >
                    {previewState.muted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Slider
                    value={[previewState.volume]}
                    max={1}
                    step={0.1}
                    className="w-24"
                    onValueChange={([value]) => 
                      setPreviewState(prev => ({ ...prev, volume: value }))
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Velocidade:</span>
                  <select
                    value={previewState.playbackRate}
                    onChange={(e) => setPreviewState(prev => ({ 
                      ...prev, 
                      playbackRate: parseFloat(e.target.value) 
                    }))}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    {playbackRates.map(rate => (
                      <option key={rate} value={rate}>
                        {rate}x
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewState(prev => ({ ...prev, loop: !prev.loop }))}
                    className={previewState.loop ? 'bg-blue-600' : ''}
                  >
                    Loop
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Display Controls */}
            <TabsContent value="display" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Zoom</label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={zoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Slider
                      value={[previewState.zoom]}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="flex-1"
                      onValueChange={([value]) => 
                        setPreviewState(prev => ({ ...prev, zoom: value }))
                      }
                    />
                    <Button variant="outline" size="sm" onClick={zoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetZoom}>
                      0
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Aspect Ratio</label>
                  <select
                    value={previewState.aspectRatio}
                    onChange={(e) => setPreviewState(prev => ({ 
                      ...prev, 
                      aspectRatio: e.target.value 
                    }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    {Object.keys(aspectRatios).map(ratio => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Qualidade</label>
                  <select
                    value={previewState.quality}
                    onChange={(e) => setPreviewState(prev => ({ 
                      ...prev, 
                      quality: e.target.value as any
                    }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="auto">Auto</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Overlays</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleGrid}
                      className={previewState.showGrid ? 'bg-blue-600' : ''}
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Grade
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleRulers}
                      className={previewState.showRulers ? 'bg-blue-600' : ''}
                    >
                      <Ruler className="w-4 h-4 mr-1" />
                      Réguas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewState(prev => ({ 
                        ...prev, 
                        showSafeZones: !prev.showSafeZones 
                      }))}
                      className={previewState.showSafeZones ? 'bg-blue-600' : ''}
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Safe Zones
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analysis Tools */}
            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewState(prev => ({ 
                    ...prev, 
                    showWaveform: !prev.showWaveform 
                  }))}
                  className={previewState.showWaveform ? 'bg-blue-600' : ''}
                >
                  <Film className="w-4 h-4 mr-2" />
                  Waveform
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setPreviewState(prev => ({ 
                    ...prev, 
                    showHistogram: !prev.showHistogram 
                  }))}
                  className={previewState.showHistogram ? 'bg-blue-600' : ''}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Histogram
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setPreviewState(prev => ({ 
                    ...prev, 
                    showVectorscope: !prev.showVectorscope 
                  }))}
                  className={previewState.showVectorscope ? 'bg-blue-600' : ''}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Vectorscope
                </Button>
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p>FPS: {renderStats.fps}</p>
                <p>Render Time: {renderStats.renderTime.toFixed(1)}ms</p>
                <p>Frames Rendered: {renderStats.frameCount}</p>
                <p>Dropped Frames: {renderStats.droppedFrames}</p>
              </div>
            </TabsContent>

            {/* Markers */}
            <TabsContent value="markers" className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMarker('in')}
                >
                  Mark In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMarker('out')}
                >
                  Mark Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMarker('chapter')}
                >
                  Capítulo
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-2">
                {markers.map(marker => (
                  <div key={marker.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: marker.color }}
                      />
                      <span className="text-sm">{marker.label}</span>
                      <span className="text-xs text-gray-400">
                        {formatTime(marker.time)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkerRemove?.(marker.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Controle de Visibilidade dos Controles */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4"
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>
    </div>
  );
};

export default AdvancedVideoPreview;