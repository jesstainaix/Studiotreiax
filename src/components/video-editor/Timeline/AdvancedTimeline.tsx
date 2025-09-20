import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  Scissors, 
  Copy, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  RotateCw,
  Layers,
  Settings,
  Grid,
  Clock,
  AudioWaveform,
  Film,
  Type,
  Image as ImageIcon,
  Music,
  Target
} from 'lucide-react';

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  visible: boolean;
  locked: boolean;
  muted?: boolean;
  volume?: number;
  items: TimelineItem[];
}

interface TimelineItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect';
  startTime: number;
  duration: number;
  trackId: string;
  thumbnailUrl?: string;
  waveformData?: number[];
  effects?: string[];
  selected?: boolean;
}

interface TimelineState {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  pixelsPerSecond: number;
  selectedItems: string[];
  isPlaying: boolean;
  zoom: number;
  snapEnabled: boolean;
  showWaveforms: boolean;
}

interface AdvancedTimelineProps {
  state: TimelineState;
  onTimeChange?: (time: number) => void;
  onItemSelect?: (itemIds: string[]) => void;
  onItemMove?: (itemId: string, newStartTime: number, newTrackId?: string) => void;
  onItemResize?: (itemId: string, newDuration: number, resizeStart?: boolean) => void;
  onItemDelete?: (itemIds: string[]) => void;
  onTrackToggle?: (trackId: string, property: 'visible' | 'locked' | 'muted') => void;
  onPlayToggle?: () => void;
  onZoomChange?: (zoom: number) => void;
}

const AdvancedTimeline: React.FC<AdvancedTimelineProps> = ({
  state,
  onTimeChange,
  onItemSelect,
  onItemMove,
  onItemResize,
  onItemDelete,
  onTrackToggle,
  onPlayToggle,
  onZoomChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<any>(null);

  // Configurações visuais
  const TRACK_HEIGHT = 80;
  const RULER_HEIGHT = 40;
  const ITEM_PADDING = 4;
  const MIN_ITEM_WIDTH = 20;

  // Renderizar timeline
  useEffect(() => {
    renderTimeline();
  }, [state]);

  const renderTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamanho do canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Limpar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Renderizar componentes
    renderTimeRuler(ctx, rect.width, RULER_HEIGHT);
    renderTracks(ctx, rect.width, rect.height - RULER_HEIGHT);
    renderTimeCursor(ctx, rect.height);
    
    if (state.showWaveforms) {
      renderWaveforms(ctx, rect.width);
    }
  }, [state]);

  const renderTimeRuler = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Grid lines e labels de tempo
    ctx.strokeStyle = '#475569';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Inter, sans-serif';

    const { pixelsPerSecond, duration } = state;
    const step = pixelsPerSecond >= 50 ? 1 : pixelsPerSecond >= 25 ? 2 : 5;

    for (let time = 0; time <= duration; time += step) {
      const x = time * pixelsPerSecond;
      if (x > width) break;

      // Linha vertical
      ctx.beginPath();
      ctx.moveTo(x, height - (time % (step * 5) === 0 ? 20 : 10));
      ctx.lineTo(x, height);
      ctx.stroke();

      // Label de tempo
      if (time % (step * 5) === 0) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(timeLabel, x + 4, height - 6);
      }
    }

    // Separador
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
  };

  const renderTracks = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    state.tracks.forEach((track, index) => {
      const y = RULER_HEIGHT + (index * TRACK_HEIGHT);
      renderTrack(ctx, track, y, width);
    });
  };

  const renderTrack = (ctx: CanvasRenderingContext2D, track: TimelineTrack, y: number, width: number) => {
    // Background da track
    const isEven = state.tracks.indexOf(track) % 2 === 0;
    ctx.fillStyle = track.visible ? (isEven ? '#0f172a' : '#1e293b') : '#64748b33';
    ctx.fillRect(0, y, width, TRACK_HEIGHT);

    // Header da track (lado esquerdo fixo)
    const headerWidth = 200;
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, y, headerWidth, TRACK_HEIGHT);

    // Nome e tipo da track
    ctx.fillStyle = track.visible ? '#f1f5f9' : '#94a3b8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(track.name, 12, y + 20);

    // Tipo da track
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(track.type.toUpperCase(), 12, y + 35);

    // Indicadores de estado
    let iconX = 12;
    if (!track.visible) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('👁', iconX, y + 55);
      iconX += 20;
    }
    if (track.locked) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('🔒', iconX, y + 55);
      iconX += 20;
    }
    if (track.muted) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('🔇', iconX, y + 55);
    }

    // Separador vertical
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headerWidth, y);
    ctx.lineTo(headerWidth, y + TRACK_HEIGHT);
    ctx.stroke();

    // Renderizar itens da track
    track.items.forEach(item => {
      renderTimelineItem(ctx, item, y, headerWidth, width);
    });

    // Separador horizontal
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, y + TRACK_HEIGHT);
    ctx.lineTo(width, y + TRACK_HEIGHT);
    ctx.stroke();
  };

  const renderTimelineItem = (
    ctx: CanvasRenderingContext2D, 
    item: TimelineItem, 
    trackY: number, 
    headerWidth: number,
    canvasWidth: number
  ) => {
    const { pixelsPerSecond } = state;
    const x = headerWidth + (item.startTime * pixelsPerSecond);
    const width = Math.max(item.duration * pixelsPerSecond, MIN_ITEM_WIDTH);
    const y = trackY + ITEM_PADDING;
    const height = TRACK_HEIGHT - (ITEM_PADDING * 2);

    // Não renderizar se estiver fora da tela
    if (x + width < headerWidth || x > canvasWidth) return;

    // Cores baseadas no tipo
    const colors = {
      video: { bg: '#3b82f6', border: '#1d4ed8', text: '#ffffff' },
      audio: { bg: '#10b981', border: '#059669', text: '#ffffff' },
      image: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
      text: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
      effect: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' }
    };

    const color = colors[item.type];
    const isSelected = state.selectedItems.includes(item.id);

    // Background do item
    ctx.fillStyle = isSelected ? color.bg + 'dd' : color.bg + 'bb';
    ctx.fillRect(x, y, width, height);

    // Thumbnail ou ícone
    if (item.thumbnailUrl) {
      // TODO: Renderizar thumbnail quando disponível
    } else {
      // Ícone baseado no tipo
      const icons = {
        video: '🎥',
        audio: '🎵',
        image: '🖼️',
        text: '📝',
        effect: '✨'
      };
      ctx.fillStyle = color.text;
      ctx.font = '16px Arial';
      ctx.fillText(icons[item.type], x + 4, y + height/2 + 6);
    }

    // Nome do item
    if (width > 60) {
      ctx.fillStyle = color.text;
      ctx.font = '11px Inter, sans-serif';
      const maxTextWidth = width - 30;
      let displayName = item.name;
      
      // Truncar texto se necessário
      const textWidth = ctx.measureText(displayName).width;
      if (textWidth > maxTextWidth) {
        while (ctx.measureText(displayName + '...').width > maxTextWidth && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      
      ctx.fillText(displayName, x + 24, y + height/2 + 4);
    }

    // Borda
    ctx.strokeStyle = isSelected ? '#ffffff' : color.border;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);

    // Handles de redimensionamento
    if (isSelected && width > 40) {
      const handleSize = 6;
      ctx.fillStyle = '#ffffff';
      
      // Handle esquerdo
      ctx.fillRect(x, y + height/2 - handleSize/2, handleSize, handleSize);
      
      // Handle direito
      ctx.fillRect(x + width - handleSize, y + height/2 - handleSize/2, handleSize, handleSize);
    }

    // Efeitos aplicados
    if (item.effects && item.effects.length > 0 && width > 80) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${item.effects.length} FX`, x + width - 35, y + 12);
    }
  };

  const renderWaveforms = (ctx: CanvasRenderingContext2D, width: number) => {
    // Renderizar waveforms para itens de áudio
    state.tracks.forEach((track, trackIndex) => {
      if (track.type === 'audio') {
        track.items.forEach(item => {
          if (item.waveformData) {
            renderWaveform(ctx, item, trackIndex, width);
          }
        });
      }
    });
  };

  const renderWaveform = (
    ctx: CanvasRenderingContext2D, 
    item: TimelineItem, 
    trackIndex: number, 
    canvasWidth: number
  ) => {
    const { pixelsPerSecond } = state;
    const headerWidth = 200;
    const x = headerWidth + (item.startTime * pixelsPerSecond);
    const width = item.duration * pixelsPerSecond;
    const y = RULER_HEIGHT + (trackIndex * TRACK_HEIGHT) + TRACK_HEIGHT/2;

    if (!item.waveformData || x + width < headerWidth || x > canvasWidth) return;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;

    const samplesPerPixel = item.waveformData.length / width;
    
    for (let i = 0; i < width; i++) {
      const sampleIndex = Math.floor(i * samplesPerPixel);
      const amplitude = item.waveformData[sampleIndex] || 0;
      const waveHeight = amplitude * (TRACK_HEIGHT / 4);
      
      ctx.beginPath();
      ctx.moveTo(x + i, y - waveHeight);
      ctx.lineTo(x + i, y + waveHeight);
      ctx.stroke();
    }
  };

  const renderTimeCursor = (ctx: CanvasRenderingContext2D, canvasHeight: number) => {
    const { currentTime, pixelsPerSecond } = state;
    const x = 200 + (currentTime * pixelsPerSecond);

    // Linha do cursor
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();

    // Cabeça do cursor
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x - 6, RULER_HEIGHT);
    ctx.lineTo(x + 6, RULER_HEIGHT);
    ctx.lineTo(x, RULER_HEIGHT - 8);
    ctx.closePath();
    ctx.fill();
  };

  // Event handlers
  const handleCanvasClick = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Verificar se clicou na régua para mudar tempo
    if (y < RULER_HEIGHT) {
      const newTime = Math.max(0, (x - 200) / state.pixelsPerSecond);
      onTimeChange?.(Math.min(newTime, state.duration));
      return;
    }

    // Verificar se clicou em um item
    const clickedItem = findItemAtPosition(x, y);
    if (clickedItem) {
      const isMultiSelect = event.ctrlKey || event.metaKey;
      
      if (isMultiSelect) {
        const newSelection = state.selectedItems.includes(clickedItem.id)
          ? state.selectedItems.filter(id => id !== clickedItem.id)
          : [...state.selectedItems, clickedItem.id];
        onItemSelect?.(newSelection);
      } else {
        onItemSelect?.([clickedItem.id]);
      }
    } else {
      // Clique vazio - desselecionar tudo
      onItemSelect?.([]);
    }
  };

  const findItemAtPosition = (x: number, y: number): TimelineItem | null => {
    const trackIndex = Math.floor((y - RULER_HEIGHT) / TRACK_HEIGHT);
    const track = state.tracks[trackIndex];
    
    if (!track) return null;

    const timePosition = (x - 200) / state.pixelsPerSecond;
    
    return track.items.find(item => 
      timePosition >= item.startTime && 
      timePosition <= item.startTime + item.duration
    ) || null;
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    const x = event.clientX;
    const y = event.clientY;
    
    setContextMenu({ x, y, visible: true });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPlayToggle}
                className="w-8 h-8 p-0"
              >
                {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                <Square className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-mono text-gray-600">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onZoomChange?.(Math.max(0.1, state.zoom - 0.1))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 w-12 text-center">
                {Math.round(state.zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onZoomChange?.(Math.min(5, state.zoom + 0.1))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={state.selectedItems.length === 0}>
                <Scissors className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={state.selectedItems.length === 0}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={state.selectedItems.length === 0}
                onClick={() => onItemDelete?.(state.selectedItems)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div 
          ref={timelineRef}
          className="relative w-full h-96 bg-slate-900 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
          />
        </div>

        {/* Menu contextual */}
        {contextMenu?.visible && (
          <div 
            className="fixed bg-white border rounded shadow-lg py-2 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">
              Cortar
            </button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">
              Copiar
            </button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">
              Colar
            </button>
            <hr className="my-1" />
            <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600">
              Excluir
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedTimeline;