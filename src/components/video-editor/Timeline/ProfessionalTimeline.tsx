import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import {
  Play,
  Pause,
  Scissors,
  Copy,
  Trash2,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Square,
  Triangle,
  Circle,
  Settings,
  Filter,
  Layers,
  Clock,
  Target,
  Maximize2,
  Grid3X3
} from 'lucide-react';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';
import { WaveformRenderer } from './WaveformRenderer';
import AudioScrubber from './AudioScrubber';
import MultiTrackAudioMixer from './MultiTrackAudioMixer';
import UndoRedoToolbar from './UndoRedoToolbar';
import { useCommandManager } from '../../../hooks/useCommandManager';
import { createTimelineCommands } from './TimelineCommands';
import { HistoryPanel } from '../../HistoryPanel';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { createTimelineShortcuts, TimelineControls, TIMELINE_SHORTCUTS_REFERENCE } from './TimelineShortcuts';
import ShortcutsHelpPanel from './ShortcutsHelpPanel';
import TimelineDropZone from './TimelineDropZone';

// Import types from TimelineEngine
import { TimelineTrack, TimelineItem } from '../../../modules/video-editor/types/Timeline.types';

interface TimelineMarker {
  id: string;
  time: number;
  type: 'playhead' | 'in' | 'out' | 'chapter' | 'cue';
  label?: string;
  color: string;
  draggable: boolean;
}

interface TimelineState {
  currentTime: number;
  zoom: number;
  scrollX: number;
  scrollY: number;
  duration: number;
  tracks: TimelineTrack[];
  items: TimelineItem[];
  markers: TimelineMarker[];
  selectedItems: string[];
  dragState: {
    isDragging: boolean;
    dragType: 'item' | 'trim' | 'marker' | 'playhead';
    dragTarget?: string;
    startX: number;
    startTime: number;
  };
  snapEnabled: boolean;
  snapTolerance: number;
}

interface ProfessionalTimelineProps {
  engine: TimelineEngine;
  onTimeChange?: (time: number) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
  onTrackChange?: (tracks: TimelineTrack[]) => void;
  onItemsAction?: (action: TimelineItemsAction) => void;
  height?: number;
  showWaveforms?: boolean;
  showThumbnails?: boolean;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

interface TimelineItemsAction {
  type: 'copy' | 'paste' | 'cut' | 'delete';
  items: TimelineItem[];
  message?: string;
}

interface ClipboardData {
  type: 'timeline-items';
  items: (TimelineItem & {
    originalStartTime: number;
    relativeDuration: number;
  })[];
  copyTime: number;
  totalDuration: number;
}

export const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  engine,
  onTimeChange,
  onSelectionChange,
  onTrackChange,
  onItemsAction,
  height = 400,
  showWaveforms = true,
  showThumbnails = true,
  isPlaying = false,
  onPlayPause
}) => {
  // Command Management Integration
  const { execute, getHistoryState } = useCommandManager();
  const timelineCommands = useMemo(() => createTimelineCommands(engine), [engine]);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rulerRef = useRef<HTMLCanvasElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);

  // Undo/Redo and History Panel State
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);

  // Estados
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentTime: 0,
    zoom: 100, // pixels per second
    scrollX: 0,
    scrollY: 0,
    duration: engine.getDuration(),
    tracks: [],
    items: [],
    markers: [
      {
        id: 'playhead',
        time: 0,
        type: 'playhead',
        color: '#ff0000',
        draggable: true
      }
    ],
    selectedItems: [],
    dragState: {
      isDragging: false,
      dragType: 'item',
      startX: 0,
      startTime: 0
    },
    snapEnabled: true,
    snapTolerance: 5
  });

  const [trackHeight] = useState(60);
  const [rulerHeight] = useState(30);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    target?: TimelineItem | TimelineTrack | undefined;
  }>({ visible: false, x: 0, y: 0 });

  // Audio state management
  const [showAdvancedControls, setShowAdvancedControls] = useState(true);
  const [audioTracks, setAudioTracks] = useState<any[]>([
    {
      id: 'master',
      name: 'Master',
      type: 'master',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      visible: true,
      locked: false,
      color: '#ef4444',
      effects: [],
      sends: [],
      automation: []
    }
  ]);

  // Computed properties
  const timelineWidth = useMemo(() => {
    return timelineState.duration * timelineState.zoom;
  }, [timelineState.duration, timelineState.zoom]);

  const visibleTimeRange = useMemo(() => {
    const containerWidth = timelineRef.current?.clientWidth || 1000;
    const startTime = timelineState.scrollX / timelineState.zoom;
    const endTime = startTime + (containerWidth / timelineState.zoom);
    return { startTime, endTime };
  }, [timelineState.scrollX, timelineState.zoom]);

  // Enhanced command-based operations
  const handleAddItem = useCallback(async (item: TimelineItem, trackId: string) => {
    try {
      const command = timelineCommands.addItem(item, trackId);
      await execute(command);
      
      // Update local state if needed
      setTimelineState(prev => ({
        ...prev,
        tracks: engine.getTracks(),
        items: engine.getTracks().flatMap(track => track.items)
      }));
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  }, [timelineCommands, execute, engine]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    try {
      const command = timelineCommands.removeItem(itemId);
      await execute(command);
      
      setTimelineState(prev => ({
        ...prev,
        tracks: engine.getTracks(),
        items: engine.getTracks().flatMap(track => track.items),
        selectedItems: prev.selectedItems.filter(id => id !== itemId)
      }));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }, [timelineCommands, execute, engine]);

  const handleMoveItem = useCallback(async (itemId: string, trackId: string, startTime: number) => {
    try {
      const command = timelineCommands.moveItem(itemId, trackId, startTime);
      await execute(command);
      
      setTimelineState(prev => ({
        ...prev,
        tracks: engine.getTracks(),
        items: engine.getTracks().flatMap(track => track.items)
      }));
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  }, [timelineCommands, execute, engine]);

  const handleResizeItem = useCallback(async (itemId: string, duration: number, startTime?: number) => {
    try {
      const command = timelineCommands.resizeItem(itemId, duration, startTime);
      await execute(command);
      
      setTimelineState(prev => ({
        ...prev,
        tracks: engine.getTracks(),
        items: engine.getTracks().flatMap(track => track.items)
      }));
    } catch (error) {
      console.error('Failed to resize item:', error);
    }
  }, [timelineCommands, execute, engine]);

  const snapPoints = useMemo(() => {
    const points: number[] = [];
    
    // Snap para início e fim dos items
    timelineState.tracks.forEach(track => {
      track.items.forEach(item => {
        points.push(item.startTime);
        points.push(item.startTime + item.duration);
      });
    });

    // Snap para marcadores
    timelineState.markers.forEach(marker => {
      if (marker.type !== 'playhead') {
        points.push(marker.time);
      }
    });

    // Snap para segundos
    for (let i = 0; i <= timelineState.duration; i++) {
      points.push(i);
    }

    return [...new Set(points)].sort((a, b) => a - b);
  }, [timelineState.tracks, timelineState.markers, timelineState.duration]);

  // Sincronização com Engine
  useEffect(() => {
    const handleStateChange = () => {
      const engineState = engine.getState();
      setTimelineState(prev => ({
        ...prev,
        tracks: engineState.tracks,
        duration: engine.getDuration()
      }));
    };

    engine.addEventListener('stateChanged', handleStateChange);
    handleStateChange(); // Carregar estado inicial

    return () => engine.removeEventListener('stateChanged', handleStateChange);
  }, [engine]);

  // Renderização do canvas
  useEffect(() => {
    renderTimeline();
    renderRuler();
  }, [timelineState, visibleTimeRange]);

  // Event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + timelineState.scrollX;
    const y = e.clientY - rect.top + timelineState.scrollY;
    const time = x / timelineState.zoom;

    // Determinar o que está sendo clicado
    const clickedItem = getItemAtPosition(x, y);
    const clickedMarker = getMarkerAtPosition(x, y);

    if (clickedMarker) {
      // Arrastar marcador
      setTimelineState(prev => ({
        ...prev,
        dragState: {
          isDragging: true,
          dragType: 'marker',
          dragTarget: clickedMarker.id,
          startX: x,
          startTime: clickedMarker.time
        }
      }));
    } else if (clickedItem) {
      // Selecionar/arrastar item
      if (e.shiftKey) {
        // Seleção múltipla
        setTimelineState(prev => ({
          ...prev,
          selectedItems: prev.selectedItems.includes(clickedItem.id)
            ? prev.selectedItems.filter(id => id !== clickedItem.id)
            : [...prev.selectedItems, clickedItem.id]
        }));
      } else {
        setTimelineState(prev => ({
          ...prev,
          selectedItems: [clickedItem.id],
          dragState: {
            isDragging: true,
            dragType: 'item',
            dragTarget: clickedItem.id,
            startX: x,
            startTime: clickedItem.startTime
          }
        }));
      }
    } else {
      // Mover playhead
      updateCurrentTime(time);
      setTimelineState(prev => ({
        ...prev,
        selectedItems: [],
        dragState: {
          isDragging: true,
          dragType: 'playhead',
          startX: x,
          startTime: time
        }
      }));
    }
  }, [timelineState.scrollX, timelineState.scrollY, timelineState.zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !timelineState.dragState.isDragging) return;

    const x = e.clientX - rect.left + timelineState.scrollX;
    const time = x / timelineState.zoom;
    const deltaTime = time - timelineState.dragState.startTime;

    if (timelineState.dragState.dragType === 'playhead') {
      updateCurrentTime(time);
    } else if (timelineState.dragState.dragType === 'marker') {
      const markerId = timelineState.dragState.dragTarget;
      if (markerId) {
        setTimelineState(prev => ({
          ...prev,
          markers: prev.markers.map(marker =>
            marker.id === markerId
              ? { ...marker, time: Math.max(0, Math.min(time, prev.duration)) }
              : marker
          )
        }));
      }
    } else if (timelineState.dragState.dragType === 'item') {
      // Mover item(s) selecionado(s)
      const snappedTime = timelineState.snapEnabled 
        ? getSnappedTime(timelineState.dragState.startTime + deltaTime)
        : timelineState.dragState.startTime + deltaTime;

      moveSelectedItems(snappedTime - timelineState.dragState.startTime);
    }
  }, [timelineState.dragState, timelineState.scrollX, timelineState.zoom, timelineState.snapEnabled]);

  const handleMouseUp = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      dragState: {
        ...prev.dragState,
        isDragging: false
      }
    }));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + timelineState.scrollX;
    const y = e.clientY - rect.top + timelineState.scrollY;
    
    const clickedItem = getItemAtPosition(x, y);
    const clickedTrack = getTrackAtPosition(y);

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      target: clickedItem || clickedTrack || undefined
    });
  }, [timelineState.scrollX, timelineState.scrollY]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom horizontal
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(10, Math.min(1000, timelineState.zoom * zoomFactor));
      
      setTimelineState(prev => ({
        ...prev,
        zoom: newZoom
      }));
    } else if (e.shiftKey) {
      // Scroll horizontal
      const scrollDelta = e.deltaY * 2;
      setTimelineState(prev => ({
        ...prev,
        scrollX: Math.max(0, prev.scrollX + scrollDelta)
      }));
    } else {
      // Scroll vertical
      const maxScrollY = Math.max(0, (timelineState.tracks.length * trackHeight) - height + rulerHeight);
      setTimelineState(prev => ({
        ...prev,
        scrollY: Math.max(0, Math.min(maxScrollY, prev.scrollY + e.deltaY))
      }));
    }
  }, [timelineState.zoom, timelineState.tracks.length, trackHeight, height, rulerHeight]);

  // Keyboard shortcuts para timeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when timeline is focused or no specific input is focused
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') {
        return;
      }

      switch (e.key) {
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            copySelectedItems();
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            pasteItems();
          }
          break;
        case 'x':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            cutSelectedItems();
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelectedItems();
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAllItems();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [timelineState.selectedItems, timelineState.items]);


  const updateCurrentTime = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timelineState.duration));
    setTimelineState(prev => ({
      ...prev,
      currentTime: clampedTime,
      markers: prev.markers.map(marker =>
        marker.type === 'playhead'
          ? { ...marker, time: clampedTime }
          : marker
      )
    }));
    onTimeChange?.(clampedTime);
  }, [timelineState.duration, onTimeChange]);

  const getItemAtPosition = (x: number, y: number): TimelineItem | null => {
    const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
    const track = timelineState.tracks[trackIndex];
    
    if (!track) return null;

    const time = x / timelineState.zoom;
    
    return track.items.find(item => 
      time >= item.startTime && time <= item.startTime + item.duration
    ) || null;
  };

  const getMarkerAtPosition = (x: number, y: number): TimelineMarker | null => {
    if (y > rulerHeight) return null;

    const time = x / timelineState.zoom;
    const tolerance = 5 / timelineState.zoom;

    return timelineState.markers.find(marker =>
      Math.abs(marker.time - time) <= tolerance
    ) || null;
  };

  const getTrackAtPosition = (y: number): TimelineTrack | null => {
    const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
    return timelineState.tracks[trackIndex] || null;
  };

  const getSnappedTime = (time: number): number => {
    if (!timelineState.snapEnabled) return time;

    const tolerance = timelineState.snapTolerance / timelineState.zoom;
    
    for (const snapPoint of snapPoints) {
      if (Math.abs(time - snapPoint) <= tolerance) {
        return snapPoint;
      }
    }
    
    return time;
  };

  const moveSelectedItems = (deltaTime: number) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        items: track.items.map(item =>
          prev.selectedItems.includes(item.id)
            ? {
                ...item,
                startTime: Math.max(0, item.startTime + deltaTime)
              }
            : item
        )
      }))
    }));
  };

  // Handle asset drop on timeline
  const handleAssetDropped = useCallback((asset: any, trackId: string, startTime: number) => {
    const newItem: TimelineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: asset.name,
      type: asset.type as 'video' | 'audio' | 'image',
      startTime: startTime,
      duration: asset.duration || 5, // Default 5 seconds for images
      source: asset.url,
      trackId: trackId,
      locked: false,
      muted: false,
      volume: 1,
      metadata: {
        originalAsset: asset,
        droppedAt: new Date().toISOString()
      }
    };

    // Add the item to the timeline
    handleAddItem(newItem, trackId);
  }, [handleAddItem]);

  // Rendering functions
  const renderTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Renderizar fundo das tracks
    renderTrackBackgrounds(ctx, canvas.width, canvas.height);

    // Renderizar items
    renderTimelineItems(ctx, canvas.width, canvas.height);

    // Renderizar marcadores
    renderMarkers(ctx, canvas.width, canvas.height);

    // Renderizar playhead
    renderPlayhead(ctx, canvas.width, canvas.height);

    // Renderizar seleção
    renderSelection(ctx, canvas.width, canvas.height);
  };

  const renderRuler = () => {
    const canvas = rulerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rulerHeight;

    // Limpar canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calcular intervalo das marcações
    const pixelsPerSecond = timelineState.zoom;
    const secondsPerLabel = Math.max(1, Math.pow(10, Math.floor(Math.log10(100 / pixelsPerSecond))));
    
    const startTime = Math.floor(visibleTimeRange.startTime / secondsPerLabel) * secondsPerLabel;
    const endTime = Math.ceil(visibleTimeRange.endTime / secondsPerLabel) * secondsPerLabel;

    ctx.strokeStyle = '#6b7280';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    for (let time = startTime; time <= endTime; time += secondsPerLabel) {
      const x = (time * timelineState.zoom) - timelineState.scrollX;
      
      if (x >= 0 && x <= canvas.width) {
        // Linha
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 10);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();

        // Label
        const label = formatTime(time);
        ctx.fillText(label, x, rulerHeight - 15);
      }
    }

    // Marcações menores
    const subInterval = secondsPerLabel / 5;
    for (let time = startTime; time <= endTime; time += subInterval) {
      const x = (time * timelineState.zoom) - timelineState.scrollX;
      
      if (x >= 0 && x <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 5);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();
      }
    }
  };

  const renderTrackBackgrounds = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    timelineState.tracks.forEach((track, index) => {
      const y = rulerHeight + (index * trackHeight) - timelineState.scrollY;
      
      if (y + trackHeight < rulerHeight || y > height) return;

      // Fundo da track
      ctx.fillStyle = index % 2 === 0 ? '#374151' : '#4b5563';
      ctx.fillRect(0, y, width, trackHeight);

      // Borda
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, width, trackHeight);
    });
  };

  const renderTimelineItems = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    timelineState.tracks.forEach((track, trackIndex) => {
      const trackY = rulerHeight + (trackIndex * trackHeight) - timelineState.scrollY;
      
      if (trackY + trackHeight < rulerHeight || trackY > height) return;

      track.items.forEach(item => {
        const itemX = (item.startTime * timelineState.zoom) - timelineState.scrollX;
        const itemWidth = item.duration * timelineState.zoom;
        const itemY = trackY + 5;
        const itemHeight = trackHeight - 10;

        if (itemX + itemWidth < 0 || itemX > width) return;

        // Cor do item baseada no tipo
        const itemColor = getItemColor(item.type);
        ctx.fillStyle = timelineState.selectedItems.includes(item.id) 
          ? lightenColor(itemColor, 0.3)
          : itemColor;

        // Desenhar item
        ctx.fillRect(itemX, itemY, itemWidth, itemHeight);

        // Borda
        ctx.strokeStyle = timelineState.selectedItems.includes(item.id) ? '#fbbf24' : '#6b7280';
        ctx.lineWidth = timelineState.selectedItems.includes(item.id) ? 2 : 1;
        ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);

        // Nome do item
        if (itemWidth > 50) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          
          const textX = itemX + 5;
          const textY = itemY + (itemHeight / 2);
          const maxWidth = itemWidth - 10;
          
          const text = item.name || `${item.type} item`;
          ctx.fillText(truncateText(ctx, text, maxWidth), textX, textY);
        }

        // Renderizar waveform para audio
        if (item.type === 'audio' && showWaveforms) {
          renderWaveform(ctx, item, itemX, itemY, itemWidth, itemHeight);
        }

        // Renderizar thumbnail para video/imagem
        if ((item.type === 'video' || item.type === 'image') && showThumbnails) {
          renderThumbnail(ctx, item, itemX, itemY, itemWidth, itemHeight);
        }
      });
    });
  };

  const renderMarkers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    timelineState.markers.forEach(marker => {
      if (marker.type === 'playhead') return; // Playhead é renderizado separadamente

      const x = (marker.time * timelineState.zoom) - timelineState.scrollX;
      
      if (x < 0 || x > width) return;

      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Linha vertical
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.setLineDash([]);

      // Ícone do marcador
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight);
      ctx.lineTo(x - 5, rulerHeight - 10);
      ctx.lineTo(x + 5, rulerHeight - 10);
      ctx.closePath();
      ctx.fill();

      // Label
      if (marker.label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, x, rulerHeight - 12);
      }
    });
  };

  const renderPlayhead = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const playheadMarker = timelineState.markers.find(m => m.type === 'playhead');
    if (!playheadMarker) return;

    const x = (playheadMarker.time * timelineState.zoom) - timelineState.scrollX;
    
    if (x < 0 || x > width) return;

    // Linha do playhead
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Cabeça do playhead
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 8, 15);
    ctx.lineTo(x + 8, 15);
    ctx.closePath();
    ctx.fill();
  };

  const renderSelection = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (timelineState.selectedItems.length === 0) return;

    // Renderizar handles de redimensionamento para items selecionados
    timelineState.tracks.forEach((track, trackIndex) => {
      const trackY = rulerHeight + (trackIndex * trackHeight) - timelineState.scrollY;

      track.items.forEach(item => {
        if (!timelineState.selectedItems.includes(item.id)) return;

        const itemX = (item.startTime * timelineState.zoom) - timelineState.scrollX;
        const itemWidth = item.duration * timelineState.zoom;
        const itemY = trackY + 5;
        const itemHeight = trackHeight - 10;

        // Handles de redimensionamento
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(itemX - 3, itemY, 6, itemHeight); // Handle esquerdo
        ctx.fillRect(itemX + itemWidth - 3, itemY, 6, itemHeight); // Handle direito

        // Renderizar fade handles para audio items
        if (item.type === 'audio' && showAutomation) {
          renderFadeHandles(ctx, item, itemX, itemY, itemWidth, itemHeight);
        }
      });
    });
  };

  const renderFadeHandles = (
    ctx: CanvasRenderingContext2D,
    item: TimelineItem,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Fade in handle (left side)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x, y + height / 2, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Fade out handle (right side)
    ctx.beginPath();
    ctx.arc(x + width, y + height / 2, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw fade curve if automation is enabled
    if (item.properties?.fadeIn || item.properties?.fadeOut) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const fadeInDuration = item.properties?.fadeIn || 0;
      const fadeOutDuration = item.properties?.fadeOut || 0;

      // Fade in curve
      if (fadeInDuration > 0) {
        const fadeInEndX = x + (fadeInDuration * timelineState.zoom);
        ctx.moveTo(x, y + height);
        ctx.quadraticCurveTo(x, y, fadeInEndX, y);
      }

      // Fade out curve
      if (fadeOutDuration > 0) {
        const fadeOutStartX = x + width - (fadeOutDuration * timelineState.zoom);
        ctx.moveTo(fadeOutStartX, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + height);
      }

      ctx.stroke();
    }
  };

  const renderWaveform = (
    ctx: CanvasRenderingContext2D,
    item: TimelineItem,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Use the real WaveformRenderer component
    // For now, we'll render a simple waveform directly on the canvas
    // In a full implementation, this would integrate with WaveformRenderer

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 1.5;

    const centerY = y + height / 2;
    const amplitude = height * 0.35;

    // Generate more realistic waveform data
    const samples = Math.floor(width / 2);
    const waveformData = generateWaveformSamples(samples, item.duration);

    ctx.beginPath();
    ctx.moveTo(x, centerY);

    for (let i = 0; i < samples; i++) {
      const sampleX = x + (i / samples) * width;
      const sampleValue = waveformData[i] || 0;
      const waveHeight = sampleValue * amplitude;

      if (i === 0) {
        ctx.moveTo(sampleX, centerY - waveHeight);
      } else {
        ctx.lineTo(sampleX, centerY - waveHeight);
      }
    }

    // Draw the bottom half (mirrored)
    for (let i = samples - 1; i >= 0; i--) {
      const sampleX = x + (i / samples) * width;
      const sampleValue = waveformData[i] || 0;
      const waveHeight = sampleValue * amplitude;
      ctx.lineTo(sampleX, centerY + waveHeight);
    }

    ctx.closePath();
    ctx.stroke();

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Generate realistic waveform samples based on audio duration
  const generateWaveformSamples = (samples: number, duration: number): number[] => {
    const result: number[] = [];
    const baseFrequency = 2 * Math.PI / (samples / 10); // Base wave frequency

    for (let i = 0; i < samples; i++) {
      // Combine multiple sine waves for more realistic waveform
      const t = (i / samples) * duration;
      let amplitude = 0;

      // Fundamental frequency
      amplitude += Math.sin(baseFrequency * t) * 0.5;

      // Harmonics
      amplitude += Math.sin(baseFrequency * 2 * t) * 0.3;
      amplitude += Math.sin(baseFrequency * 3 * t) * 0.2;

      // Add some noise for realism
      amplitude += (Math.random() - 0.5) * 0.1;

      // Normalize and ensure positive values
      amplitude = Math.abs(amplitude) * 0.8 + 0.1;

      result.push(Math.min(amplitude, 1));
    }

    return result;
  };

  const renderThumbnail = (
    ctx: CanvasRenderingContext2D,
    item: TimelineItem,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Placeholder para thumbnail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 2, y + 2, Math.min(width - 4, height - 4), height - 4);
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      item.type === 'video' ? '🎬' : '🖼️',
      x + Math.min(width, height) / 2,
      y + height / 2 + 7
    );
  };

  // Helper functions
  const getItemColor = (type: string): string => {
    switch (type) {
      case 'video': return '#3b82f6';
      case 'audio': return '#10b981';
      case 'image': return '#8b5cf6';
      case 'text': return '#f59e0b';
      case 'effect': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const lightenColor = (color: string, factor: number): string => {
    // Simples implementação para clarear cor
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    
    while (text.length > 0 && ctx.measureText(text + '...').width > maxWidth) {
      text = text.slice(0, -1);
    }
    
    return text + '...';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          deleteSelectedItems();
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) copySelectedItems();
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) pasteItems();
          break;
        case 'x':
          if (e.ctrlKey || e.metaKey) cutSelectedItems();
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAllItems();
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            splitAtPlayhead();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timelineState.selectedItems, timelineState.currentTime]);

  const copySelectedItems = () => {
    if (timelineState.selectedItems.length === 0) {
      console.log('No items selected for copying');
      return;
    }

    // Get selected items data
    const selectedItemsData = timelineState.items.filter(item => 
      timelineState.selectedItems.includes(item.id)
    );

    if (selectedItemsData.length === 0) {
      console.log('Selected items not found in timeline');
      return;
    }

    // Prepare clipboard data with relative positions
    const clipboardData = {
      type: 'timeline-items',
      items: selectedItemsData.map(item => ({
        ...item,
        // Store relative position from earliest item for proper paste positioning
        originalStartTime: item.startTime,
        relativeDuration: item.duration
      })),
      copyTime: timelineState.currentTime,
      totalDuration: Math.max(...selectedItemsData.map(item => item.startTime + item.duration)) - 
                     Math.min(...selectedItemsData.map(item => item.startTime))
    };

    // Store in clipboard (browser clipboard API)
    try {
      navigator.clipboard.writeText(JSON.stringify(clipboardData));
      console.log('Copied items to clipboard:', selectedItemsData.length, 'items');
      
      // Visual feedback
      onItemsAction?.({
        type: 'copy',
        items: selectedItemsData,
        message: `Copied ${selectedItemsData.length} item(s)`
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: store in local state/storage
      localStorage.setItem('timeline-clipboard', JSON.stringify(clipboardData));
      console.log('Stored items in local clipboard fallback');
    }
  };

  const pasteItems = () => {
    const pasteAtTime = timelineState.currentTime;
    let clipboardData: any = null;

    try {
      // Try to get from browser clipboard first
      navigator.clipboard.readText().then(text => {
        try {
          clipboardData = JSON.parse(text);
          if (clipboardData.type === 'timeline-items') {
            executePaste(clipboardData, pasteAtTime);
          }
        } catch (e) {
          // Fallback to localStorage
          const fallbackData = localStorage.getItem('timeline-clipboard');
          if (fallbackData) {
            clipboardData = JSON.parse(fallbackData);
            if (clipboardData.type === 'timeline-items') {
              executePaste(clipboardData, pasteAtTime);
            }
          } else {
            console.log('No clipboard data available');
          }
        }
      }).catch(() => {
        // Fallback to localStorage
        const fallbackData = localStorage.getItem('timeline-clipboard');
        if (fallbackData) {
          clipboardData = JSON.parse(fallbackData);
          if (clipboardData.type === 'timeline-items') {
            executePaste(clipboardData, pasteAtTime);
          }
        } else {
          console.log('No clipboard data available');
        }
      });
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const executePaste = (clipboardData: ClipboardData, pasteAtTime: number) => {
    if (!clipboardData.items || clipboardData.items.length === 0) {
      console.log('No items in clipboard data');
      return;
    }

    // Calculate offset for pasting at current time
    const earliestStartTime = Math.min(...clipboardData.items.map((item) => item.originalStartTime));
    const timeOffset = pasteAtTime - earliestStartTime;

    // Generate new items with updated positions and IDs
    const newItems = clipboardData.items.map((item) => ({
      ...item,
      id: `${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New unique ID
      startTime: item.originalStartTime + timeOffset,
      endTime: item.originalStartTime + timeOffset + item.relativeDuration,
      // Ensure items don't overlap with existing ones on same track
      trackId: findAvailableTrack(item.trackId, item.originalStartTime + timeOffset, item.relativeDuration)
    }));

    // Add to timeline
    setTimelineState(prev => ({
      ...prev,
      items: [...prev.items, ...newItems],
      selectedItems: newItems.map(item => item.id) // Select pasted items
    }));

    // Notify parent
    onItemsAction?.({
      type: 'paste',
      items: newItems,
      message: `Pasted ${newItems.length} item(s) at ${formatTime(pasteAtTime)}`
    });

    console.log('Pasted items at time:', pasteAtTime, 'items:', newItems.length);
  };

  const deleteSelectedItems = () => {
    if (timelineState.selectedItems.length === 0) return;

    const itemsToDelete = timelineState.items.filter(item =>
      timelineState.selectedItems.includes(item.id)
    );

    setTimelineState(prev => ({
      ...prev,
      items: prev.items.filter(item => !prev.selectedItems.includes(item.id)),
      selectedItems: []
    }));

    onItemsAction?.({
      type: 'delete',
      items: itemsToDelete,
      message: `Deleted ${itemsToDelete.length} item(s)`
    });
  };

  const findAvailableTrack = (originalTrackId: string, startTime: number, duration: number) => {
    // Check if original track is available
    const conflictingItems = timelineState.items.filter(item => 
      item.trackId === originalTrackId &&
      !(item.startTime >= startTime + duration || item.startTime + item.duration <= startTime)
    );

    if (conflictingItems.length === 0) {
      return originalTrackId; // Original track is available
    }

    // Find alternative track
    const availableTracks = ['video1', 'video2', 'audio1', 'audio2', 'audio3'];
    for (const trackId of availableTracks) {
      const trackConflicts = timelineState.items.filter(item => 
        item.trackId === trackId &&
        !(item.startTime >= startTime + duration || item.startTime + item.duration <= startTime)
      );
      
      if (trackConflicts.length === 0) {
        return trackId;
      }
    }

    // If no track available, return original and let user handle conflict
    return originalTrackId;
  };

  const cutSelectedItems = () => {
    copySelectedItems();
    deleteSelectedItems();
  };

  const selectAllItems = () => {
    const allItemIds = timelineState.tracks.flatMap(track => track.items.map(item => item.id));
    setTimelineState(prev => ({ ...prev, selectedItems: allItemIds }));
  };

  // Audio track handlers
  const handleAudioTrackUpdate = useCallback((trackId: string, updates: any) => {
    setAudioTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  }, []);

  const handleAudioTrackAdd = useCallback((type: string) => {
    const newTrack = {
      id: `track-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      type,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      visible: true,
      locked: false,
      color: type === 'music' ? '#3b82f6' : type === 'voice' ? '#10b981' : '#f59e0b',
      effects: [],
      sends: [],
      automation: []
    };
    setAudioTracks(prev => [...prev, newTrack]);
  }, []);

  const handleAudioTrackRemove = useCallback((trackId: string) => {
    setAudioTracks(prev => prev.filter(track => track.id !== trackId));
  }, []);

  const handleAudioTrackReorder = useCallback((trackIds: string[]) => {
    const orderedTracks = trackIds.map(id => 
      audioTracks.find(track => track.id === id)
    ).filter(Boolean);
    setAudioTracks(orderedTracks as any[]);
  }, [audioTracks]);

  const splitAtPlayhead = () => {
    const splitTime = timelineState.currentTime;
    
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        items: track.items.flatMap(item => {
          if (splitTime > item.startTime && splitTime < item.startTime + item.duration) {
            // Split item
            const firstPart: TimelineItem = {
              ...item,
              id: `${item.id}_split_1`,
              duration: splitTime - item.startTime
            };
            
            const secondPart: TimelineItem = {
              ...item,
              id: `${item.id}_split_2`,
              startTime: splitTime,
              duration: (item.startTime + item.duration) - splitTime
            };
            
            return [firstPart, secondPart];
          }
          return [item];
        })
      }))
    }));
  };

  const zoomIn = () => {
    setTimelineState(prev => ({
      ...prev,
      zoom: Math.min(1000, prev.zoom * 1.2)
    }));
  };

  const zoomOut = () => {
    setTimelineState(prev => ({
      ...prev,
      zoom: Math.max(10, prev.zoom / 1.2)
    }));
  };

  const zoomToFit = () => {
    const containerWidth = timelineRef.current?.clientWidth || 1000;
    const newZoom = containerWidth / timelineState.duration;
    setTimelineState(prev => ({
      ...prev,
      zoom: newZoom,
      scrollX: 0
    }));
  };

  const toggleSnap = () => {
    setTimelineState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }));
  };

  // ===== TIMELINE KEYBOARD SHORTCUTS IMPLEMENTATION =====
  
  // Timeline controls implementation
  const timelineControls: TimelineControls = {
    // Playback controls
    togglePlayback: () => {
      setIsPlaying(prev => !prev);
      // Integration with video player would go here
    },
    frameStep: (direction: 'forward' | 'backward') => {
      const frameTime = 1 / 30; // 30 FPS
      const newTime = direction === 'forward' 
        ? timelineState.currentTime + frameTime
        : Math.max(0, timelineState.currentTime - frameTime);
      updateCurrentTime(newTime);
    },
    skipSeconds: (seconds: number) => {
      const newTime = Math.max(0, Math.min(timelineState.duration, timelineState.currentTime + seconds));
      updateCurrentTime(newTime);
    },
    goToStart: () => updateCurrentTime(0),
    goToEnd: () => updateCurrentTime(timelineState.duration),
    setPlaybackRate: (rate: number) => {
      setPlaybackRateState(rate);
      // Integration with video player would go here
    },

    // Timeline operations
    splitAtPlayhead: () => {
      const selectedItems = timelineState.items.filter(item => 
        timelineState.selectedItems.includes(item.id)
      );
      
      if (selectedItems.length === 0) return;
      
      selectedItems.forEach(item => {
        if (timelineState.currentTime > item.startTime && 
            timelineState.currentTime < item.startTime + item.duration) {
          
          const splitTime = timelineState.currentTime - item.startTime;
          const command = commands.splitItem(item.id, splitTime);
          commandManager.execute(command);
        }
      });
    },
    deleteSelected: deleteSelectedItems,
    copySelected: copySelectedItems,
    pasteAtPlayhead: () => {
      // Implementation would paste from clipboard at current playhead position
      console.log('Paste at playhead:', timelineState.currentTime);
    },
    duplicateSelected: () => {
      const selectedItems = timelineState.items.filter(item => 
        timelineState.selectedItems.includes(item.id)
      );
      
      selectedItems.forEach(item => {
        const duplicateItem = {
          ...item,
          id: `${item.id}-copy-${Date.now()}`,
          startTime: item.startTime + item.duration + 0.1 // Slight offset
        };
        
        const command = commands.addItem(duplicateItem, item.trackId);
        commandManager.execute(command);
      });
    },
    selectAll: selectAllItems,
    deselectAll: () => {
      setTimelineState(prev => ({ ...prev, selectedItems: [] }));
    },

    // Timeline navigation
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection: () => {
      const selectedItems = timelineState.items.filter(item => 
        timelineState.selectedItems.includes(item.id)
      );
      
      if (selectedItems.length === 0) return;
      
      const startTime = Math.min(...selectedItems.map(item => item.startTime));
      const endTime = Math.max(...selectedItems.map(item => item.startTime + item.duration));
      const duration = endTime - startTime;
      
      if (duration > 0) {
        const containerWidth = timelineRef.current?.clientWidth || 1000;
        const newZoom = containerWidth / duration * 0.8; // 80% of container
        setTimelineState(prev => ({
          ...prev,
          zoom: newZoom,
          scrollX: startTime * newZoom - containerWidth * 0.1 // 10% padding
        }));
      }
    },

    // Track operations
    addVideoTrack: () => {
      const newTrack = {
        id: `video-track-${Date.now()}`,
        name: `Video Track ${timelineState.tracks.filter(t => t.type === 'video').length + 1}`,
        type: 'video' as const,
        height: 80,
        locked: false,
        muted: false,
        solo: false,
        visible: true,
        color: '#3b82f6',
        items: []
      };
      
      const command = commands.addTrack(newTrack);
      commandManager.execute(command);
    },
    addAudioTrack: () => {
      const newTrack = {
        id: `audio-track-${Date.now()}`,
        name: `Audio Track ${timelineState.tracks.filter(t => t.type === 'audio').length + 1}`,
        type: 'audio' as const,
        height: 60,
        locked: false,
        muted: false,
        solo: false,
        visible: true,
        color: '#10b981',
        items: []
      };
      
      const command = commands.addTrack(newTrack);
      commandManager.execute(command);
    },
    deleteActiveTrack: () => {
      // Find the first track with selected items or first track
      const activeTrack = timelineState.tracks.find(track => 
        track.items.some(item => timelineState.selectedItems.includes(item.id))
      ) || timelineState.tracks[0];
      
      if (activeTrack && timelineState.tracks.length > 1) {
        const command = commands.removeTrack(activeTrack.id);
        commandManager.execute(command);
      }
    },

    // Timeline state
    toggleSnap,
    toggleRipple: () => {
      console.log('Toggle ripple edit mode');
      // Implementation for ripple edit mode
    },
    toggleMagnetism: () => {
      console.log('Toggle magnetism');
      // Implementation for magnetic timeline
    },

    // Advanced operations
    groupSelected: () => {
      const selectedItems = timelineState.items.filter(item => 
        timelineState.selectedItems.includes(item.id)
      );
      
      if (selectedItems.length > 1) {
        console.log('Group selected items:', selectedItems.length);
        // Implementation for grouping items
      }
    },
    ungroupSelected: () => {
      console.log('Ungroup selected items');
      // Implementation for ungrouping items
    },
    trimToPlayhead: () => {
      const selectedItems = timelineState.items.filter(item => 
        timelineState.selectedItems.includes(item.id)
      );
      
      selectedItems.forEach(item => {
        if (timelineState.currentTime > item.startTime && 
            timelineState.currentTime < item.startTime + item.duration) {
          
          const newDuration = timelineState.currentTime - item.startTime;
          const command = commands.resizeItem(item.id, newDuration, item.startTime);
          commandManager.execute(command);
        }
      });
    },
    rippleDelete: () => {
      // Implementation for ripple delete
      deleteSelectedItems();
      console.log('Ripple delete executed');
    }
  };

  // Initialize keyboard shortcuts
  const shortcuts = [
    ...createTimelineShortcuts(timelineControls),
    // Help shortcuts
    {
      key: '?',
      action: () => setShowShortcutsHelp(true),
      description: 'Show Keyboard Shortcuts Help'
    },
    {
      key: 'F1',
      action: () => setShowShortcutsHelp(true),
      description: 'Show Help (F1)'
    }
  ];
  
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    ignoreInputs: true
  });

  return (
    <div 
      ref={timelineRef}
      className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
      style={{ height }}
    >
      {/* Enhanced Toolbar with Undo/Redo */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          {/* Undo/Redo Toolbar */}
          <UndoRedoToolbar 
            showHistoryPanel={showHistoryPanel}
            onToggleHistoryPanel={() => setShowHistoryPanel(!showHistoryPanel)}
            className="mr-4"
          />
          
          <div className="w-px h-6 bg-gray-600" />
          
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400 min-w-16 text-center">
            {Math.round(timelineState.zoom)}px/s
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomToFit}>
            Fit
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSnap}
            className={timelineState.snapEnabled ? 'bg-blue-600' : ''}
          >
            <Target className="w-4 h-4 mr-1" />
            Snap
          </Button>
          
          <Button variant="outline" size="sm">
            <Grid3X3 className="w-4 h-4 mr-1" />
            Grid
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsHelp(true)}
            title="Atalhos de Teclado (? ou F1)"
          >
            <Keyboard className="w-4 h-4 mr-1" />
            Atalhos
          </Button>

          <Button
            variant={showAutomation ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAutomation(!showAutomation)}
          >
            <Target className="w-4 h-4 mr-1" />
            Automation
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Ruler */}
      <canvas
        ref={rulerRef}
        className="w-full cursor-pointer"
        style={{ height: rulerHeight }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left + timelineState.scrollX;
          const time = x / timelineState.zoom;
          updateCurrentTime(time);
        }}
      />

      {/* Timeline Canvas */}
      <div className="relative overflow-hidden" style={{ height: height - rulerHeight - 50 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
        />

        {/* Track Headers */}
        <div className="absolute left-0 top-0 w-48 bg-gray-800 border-r border-gray-700 z-10">
          {timelineState.tracks.map((track, index) => (
            <TimelineDropZone
              key={track.id}
              engine={engine}
              trackId={track.id}
              startTime={timelineState.currentTime}
              onAssetDropped={handleAssetDropped}
              className="flex items-center justify-between p-2 border-b border-gray-700"
              style={{ 
                height: trackHeight,
                transform: `translateY(${-timelineState.scrollY}px)`
              }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-sm font-medium truncate max-w-20">
                  {track.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTimelineState(prev => ({
                      ...prev,
                      tracks: prev.tracks.map(t =>
                        t.id === track.id ? { ...t, muted: !t.muted } : t
                      )
                    }));
                  }}
                  className={track.muted ? 'text-red-400' : ''}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTimelineState(prev => ({
                      ...prev,
                      tracks: prev.tracks.map(t =>
                        t.id === track.id ? { ...t, visible: !t.visible } : t
                      )
                    }));
                  }}
                  className={!track.visible ? 'text-gray-500' : ''}
                >
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTimelineState(prev => ({
                      ...prev,
                      tracks: prev.tracks.map(t =>
                        t.id === track.id ? { ...t, locked: !t.locked } : t
                      )
                    }));
                  }}
                  className={track.locked ? 'text-yellow-400' : ''}
                >
                  {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
              </div>
            </TimelineDropZone>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 py-2 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        >
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2">
            <Scissors className="w-4 h-4" />
            <span>Dividir</span>
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2">
            <Copy className="w-4 h-4" />
            <span>Copiar</span>
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
          <hr className="my-2 border-gray-600" />
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Propriedades</span>
          </button>
        </div>
      )}

      {/* Audio Controls Section */}
      <div className="border-t border-gray-700 bg-gray-800">
        {/* Audio Scrubber */}
        <div className="p-4">
          <AudioScrubber
            currentTime={timelineState.currentTime}
            duration={timelineState.duration}
            isPlaying={isPlaying}
            volume={0.8}
            playbackRate={1}
            onTimeChange={updateCurrentTime}
            onVolumeChange={() => {}}
            onPlaybackRateChange={() => {}}
            onTogglePlayback={onPlayPause || (() => {})}
            onSeek={() => {}}
            className="mb-4"
          />
        </div>

        {/* Multi-Track Audio Mixer */}
        <MultiTrackAudioMixer
          tracks={audioTracks}
          currentTime={timelineState.currentTime}
          isPlaying={isPlaying}
          onTrackUpdate={handleAudioTrackUpdate}
          onTrackAdd={handleAudioTrackAdd}
          onTrackRemove={handleAudioTrackRemove}
          onTrackReorder={handleAudioTrackReorder}
          showAdvancedControls={showAdvancedControls}
          className="border-t border-gray-700"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Selecionados: {timelineState.selectedItems.length}</span>
          <span>Duração: {formatTime(timelineState.duration)}</span>
          <span>Tracks: {timelineState.tracks.length}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span>FPS: 30</span>
          <span>Sample Rate: 48kHz</span>
        </div>
      </div>

      {/* History Panel Overlay */}
      {showHistoryPanel && (
        <div className="absolute top-0 right-0 w-80 h-full bg-gray-800 border-l border-gray-700 z-50 overflow-hidden">
          <HistoryPanel
            historyState={{
              canUndo: getHistoryState().canUndo,
              canRedo: getHistoryState().canRedo,
              history: [],
              undoStack: [],
              redoStack: []
            }}
            onUndo={async () => {
              const { undo } = require('../../../hooks/useCommandManager');
              await undo();
            }}
            onRedo={async () => {
              const { redo } = require('../../../hooks/useCommandManager');
              await redo();
            }}
            onClearHistory={() => {
              const { clearHistory } = require('../../../hooks/useCommandManager');
              clearHistory();
            }}
          />
        </div>
      )}

      {/* Shortcuts Help Panel */}
      <ShortcutsHelpPanel 
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
};

export default ProfessionalTimeline;
