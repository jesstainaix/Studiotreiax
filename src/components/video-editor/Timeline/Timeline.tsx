import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';
import { TimelineState, TimelineItem, DragState } from '../../../modules/video-editor/types/Timeline.types';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Play, Pause, Square, Scissors, Copy, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

interface TimelineProps {
  engine: TimelineEngine;
  onTimeChange?: (time: number) => void;
  onItemSelect?: (itemIds: string[]) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  engine, 
  onTimeChange, 
  onItemSelect 
}) => {
  const [state, setState] = useState<TimelineState>(engine.getState());
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'move',
    startX: 0,
    startTime: 0,
    currentX: 0
  });

  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Atualizar estado quando engine muda
  useEffect(() => {
    const handleStateChange = (newState: TimelineState) => {
      setState(newState);
    };

    const handleTimeChange = (time: number) => {
      onTimeChange?.(time);
    };

    engine.addEventListener('stateChanged', handleStateChange);
    engine.addEventListener('timeChanged', handleTimeChange);

    return () => {
      engine.removeEventListener('stateChanged', handleStateChange);
      engine.removeEventListener('timeChanged', handleTimeChange);
    };
  }, [engine, onTimeChange]);

  // Renderizar timeline no canvas
  useEffect(() => {
    if (canvasRef.current) {
      renderTimeline();
    }
  }, [state]);

  const renderTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurações de renderização
    const trackHeight = 80;
    const rulerHeight = 30;
    const { pixelsPerSecond } = state;

    // Renderizar régua de tempo
    renderTimeRuler(ctx, canvas.width, rulerHeight, pixelsPerSecond, state.duration);

    // Renderizar trilhas
    state.tracks.forEach((track, index) => {
      const y = rulerHeight + (index * trackHeight);
      renderTrack(ctx, track, y, trackHeight, pixelsPerSecond);
    });

    // Renderizar cursor de tempo atual
    renderTimeCursor(ctx, state.currentTime, pixelsPerSecond, canvas.height, rulerHeight);
  }, [state]);

  const renderTimeRuler = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    pixelsPerSecond: number, 
    duration: number
  ) => {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#d1d5db';

    // Marcações principais (segundos)
    for (let i = 0; i <= duration; i++) {
      const x = i * pixelsPerSecond;
      if (x > width) break;

      ctx.beginPath();
      ctx.moveTo(x, height - 15);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Texto do tempo
      const minutes = Math.floor(i / 60);
      const seconds = i % 60;
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillText(timeText, x + 2, height - 5);
    }

    // Marcações menores (meio segundo)
    ctx.strokeStyle = '#4b5563';
    for (let i = 0.5; i <= duration; i += 0.5) {
      const x = i * pixelsPerSecond;
      if (x > width) break;

      ctx.beginPath();
      ctx.moveTo(x, height - 8);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const renderTrack = (
    ctx: CanvasRenderingContext2D,
    track: any,
    y: number,
    height: number,
    pixelsPerSecond: number
  ) => {
    // Background da trilha
    ctx.fillStyle = track.visible ? '#374151' : '#1f2937';
    ctx.fillRect(0, y, ctx.canvas.width, height);

    // Borda da trilha
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y, ctx.canvas.width, height);

    // Nome da trilha
    ctx.fillStyle = '#d1d5db';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(track.name, 10, y + 20);

    // Renderizar itens da trilha
    track.items.forEach((item: TimelineItem) => {
      renderTimelineItem(ctx, item, y + 25, height - 30, pixelsPerSecond);
    });
  };

  const renderTimelineItem = (
    ctx: CanvasRenderingContext2D,
    item: TimelineItem,
    y: number,
    height: number,
    pixelsPerSecond: number
  ) => {
    const x = item.startTime * pixelsPerSecond;
    const width = item.duration * pixelsPerSecond;

    // Cor baseada no tipo
    const colors = {
      video: '#3b82f6',
      audio: '#10b981',
      image: '#f59e0b',
      text: '#8b5cf6',
      effect: '#ef4444'
    };

    const isSelected = state.selectedItems.includes(item.id);

    // Background do item
    ctx.fillStyle = isSelected ? colors[item.type] + 'cc' : colors[item.type] + '88';
    ctx.fillRect(x, y, width, height);

    // Borda do item
    ctx.strokeStyle = isSelected ? '#ffffff' : colors[item.type];
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);

    // Nome do item (se couber)
    if (width > 50) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      const textWidth = ctx.measureText(item.name).width;
      if (textWidth < width - 10) {
        ctx.fillText(item.name, x + 5, y + height/2 + 4);
      }
    }

    // Indicadores de redimensionamento
    if (isSelected && width > 20) {
      ctx.fillStyle = '#ffffff';
      // Lado esquerdo
      ctx.fillRect(x, y, 3, height);
      // Lado direito
      ctx.fillRect(x + width - 3, y, 3, height);
    }
  };

  const renderTimeCursor = (
    ctx: CanvasRenderingContext2D,
    currentTime: number,
    pixelsPerSecond: number,
    canvasHeight: number,
    rulerHeight: number
  ) => {
    const x = currentTime * pixelsPerSecond;

    // Linha do cursor
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, rulerHeight);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();

    // Cabeça do cursor
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x - 6, rulerHeight);
    ctx.lineTo(x + 6, rulerHeight);
    ctx.lineTo(x, rulerHeight + 10);
    ctx.closePath();
    ctx.fill();
  };

  // Handlers de mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = x / state.pixelsPerSecond;

    // Verificar se clicou em um item
    const clickedItem = findItemAtPosition(x, y);
    
    if (clickedItem) {
      // Lógica de seleção
      if (e.ctrlKey || e.metaKey) {
        // Multi-seleção
        const newSelection = state.selectedItems.includes(clickedItem.id)
          ? state.selectedItems.filter(id => id !== clickedItem.id)
          : [...state.selectedItems, clickedItem.id];
        onItemSelect?.(newSelection);
      } else {
        onItemSelect?.(state.selectedItems.includes(clickedItem.id) ? state.selectedItems : [clickedItem.id]);
      }

      // Iniciar drag
      setDragState({
        isDragging: true,
        dragType: getDragType(x, clickedItem),
        itemId: clickedItem.id,
        startX: x,
        startTime: clickedItem.startTime,
        currentX: x
      });
    } else {
      // Clicou no vazio - mover cursor de tempo
      engine.setCurrentTime(time);
      onItemSelect?.([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.itemId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const deltaX = x - dragState.startX;
    const deltaTime = deltaX / state.pixelsPerSecond;

    switch (dragState.dragType) {
      case 'move':
        const newStartTime = Math.max(0, dragState.startTime + deltaTime);
        engine.dispatch({
          type: 'MOVE_ITEM',
          payload: {
            itemId: dragState.itemId,
            trackId: findTrackIdAtY(e.clientY - rect.top),
            startTime: newStartTime
          }
        });
        break;

      case 'resize-right':
        const item = findItemById(dragState.itemId);
        if (item) {
          const newDuration = Math.max(0.1, item.duration + deltaTime);
          engine.dispatch({
            type: 'RESIZE_ITEM',
            payload: {
              itemId: dragState.itemId,
              duration: newDuration
            }
          });
        }
        break;
    }

    setDragState(prev => ({ ...prev, currentX: x }));
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      dragType: 'move',
      startX: 0,
      startTime: 0,
      currentX: 0
    });
  };

  // Utility functions
  const findItemAtPosition = (x: number, y: number): TimelineItem | null => {
    const rulerHeight = 30;
    const trackHeight = 80;
    const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
    
    if (trackIndex < 0 || trackIndex >= state.tracks.length) return null;
    
    const track = state.tracks[trackIndex];
    const time = x / state.pixelsPerSecond;
    
    return track.items.find(item => 
      time >= item.startTime && time <= item.startTime + item.duration
    ) || null;
  };

  const findItemById = (id: string): TimelineItem | null => {
    for (const track of state.tracks) {
      const item = track.items.find(i => i.id === id);
      if (item) return item;
    }
    return null;
  };

  const findTrackIdAtY = (y: number): string => {
    const rulerHeight = 30;
    const trackHeight = 80;
    const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
    return state.tracks[trackIndex]?.id || state.tracks[0]?.id;
  };

  const getDragType = (x: number, item: TimelineItem): 'move' | 'resize-left' | 'resize-right' => {
    const itemX = item.startTime * state.pixelsPerSecond;
    const itemWidth = item.duration * state.pixelsPerSecond;
    
    if (x < itemX + 10) return 'resize-left';
    if (x > itemX + itemWidth - 10) return 'resize-right';
    return 'move';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          state.isPlaying ? engine.pause() : engine.play();
          break;
        case 'Delete':
        case 'Backspace':
          if (state.selectedItems.length > 0) {
            state.selectedItems.forEach(id => {
              engine.dispatch({ type: 'REMOVE_ITEM', payload: { itemId: id } });
            });
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            engine.dispatch({ type: 'COPY', payload: { itemIds: state.selectedItems } });
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            engine.dispatch({ 
              type: 'PASTE', 
              payload: { 
                trackId: state.tracks[0]?.id, 
                time: state.currentTime 
              } 
            });
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              engine.dispatch({ type: 'REDO', payload: {} });
            } else {
              engine.dispatch({ type: 'UNDO', payload: {} });
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, state]);

  return (
    <Card className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => state.isPlaying ? engine.pause() : engine.play()}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => engine.stop()}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-600 mx-2" />
          
          <Button
            variant="outline"
            size="sm"
            disabled={state.selectedItems.length === 0}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Scissors className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={state.selectedItems.length === 0}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={state.selectedItems.length === 0}
            onClick={() => {
              state.selectedItems.forEach(id => {
                engine.dispatch({ type: 'REMOVE_ITEM', payload: { itemId: id } });
              });
            }}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => engine.zoomOut()}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-32">
            <Slider
              value={[state.zoom]}
              onValueChange={([zoom]) => engine.setZoom(zoom)}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => engine.zoomIn()}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div ref={timelineRef} className="flex-1 overflow-auto">
        <canvas
          ref={canvasRef}
          width={Math.max(800, state.duration * state.pixelsPerSecond)}
          height={30 + (state.tracks.length * 80)}
          className="block cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t border-gray-700 text-sm">
        <div>
          Tempo: {Math.floor(state.currentTime / 60)}:{(state.currentTime % 60).toFixed(1).padStart(4, '0')}s
        </div>
        <div>
          Duração: {Math.floor(state.duration / 60)}:{(state.duration % 60).toFixed(0).padStart(2, '0')}s
        </div>
        <div>
          Zoom: {(state.zoom * 100).toFixed(0)}%
        </div>
        <div>
          Selecionados: {state.selectedItems.length}
        </div>
      </div>
    </Card>
  );
};