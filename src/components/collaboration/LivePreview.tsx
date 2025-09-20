import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, Users, MessageCircle, Pen, Eraser, Square, Circle, Type, Eye, EyeOff, Settings, Share2, Download, Fullscreen, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { realtimeService } from '../../services/realtimeService';
import { presenceManager } from '../../services/presenceManager';

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  quality: 'auto' | '480p' | '720p' | '1080p' | '4k';
  fullscreen: boolean;
}

interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'freehand' | 'marker';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  timestamp: number;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isVisible: boolean;
  opacity: number;
  points?: { x: number; y: number }[];
}

interface CollaborativeMarker {
  id: string;
  name: string;
  timestamp: number;
  color: string;
  authorId: string;
  authorName: string;
  description?: string;
  createdAt: Date;
}

interface ReviewSession {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  settings: {
    allowAnnotations: boolean;
    allowPlaybackControl: boolean;
    autoSync: boolean;
    recordSession: boolean;
  };
}

interface LivePreviewProps {
  videoSrc?: string;
  timeline?: any;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  onAnnotationAdded?: (annotation: Annotation) => void;
  onMarkerAdded?: (marker: CollaborativeMarker) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  videoSrc,
  timeline,
  onPlaybackStateChange,
  onAnnotationAdded,
  onMarkerAdded
}) => {
  const { isConnected, currentUser, collaborators } = useCollaboration();
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    quality: 'auto',
    fullscreen: false
  });
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [markers, setMarkers] = useState<CollaborativeMarker[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [annotationTool, setAnnotationTool] = useState<'text' | 'arrow' | 'rectangle' | 'circle' | 'freehand' | 'marker' | null>(null);
  const [annotationColor, setAnnotationColor] = useState('#ff0000');
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(2);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [syncMode, setSyncMode] = useState<'host' | 'follow' | 'independent'>('follow');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const drawingPathRef = useRef<{ x: number; y: number }[]>([]);

  // Inicializar preview colaborativo
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    // Configurar listeners para sincronização
    realtimeService.on('preview:playback-sync', handlePlaybackSync);
    realtimeService.on('preview:annotation-added', handleAnnotationAdded);
    realtimeService.on('preview:annotation-updated', handleAnnotationUpdated);
    realtimeService.on('preview:annotation-removed', handleAnnotationRemoved);
    realtimeService.on('preview:marker-added', handleMarkerAdded);
    realtimeService.on('preview:marker-updated', handleMarkerUpdated);
    realtimeService.on('preview:session-started', handleSessionStarted);
    realtimeService.on('preview:session-ended', handleSessionEnded);
    realtimeService.on('preview:cursor-moved', handleCursorMoved);

    // Carregar dados existentes
    loadAnnotations();
    loadMarkers();
    loadActiveSession();

    return () => {
      realtimeService.off('preview:playback-sync', handlePlaybackSync);
      realtimeService.off('preview:annotation-added', handleAnnotationAdded);
      realtimeService.off('preview:annotation-updated', handleAnnotationUpdated);
      realtimeService.off('preview:annotation-removed', handleAnnotationRemoved);
      realtimeService.off('preview:marker-added', handleMarkerAdded);
      realtimeService.off('preview:marker-updated', handleMarkerUpdated);
      realtimeService.off('preview:session-started', handleSessionStarted);
      realtimeService.off('preview:session-ended', handleSessionEnded);
      realtimeService.off('preview:cursor-moved', handleCursorMoved);
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isConnected, currentUser]);

  // Sincronizar playback automaticamente
  useEffect(() => {
    if (syncMode === 'host' && videoRef.current) {
      // Enviar estado de playback para outros usuários
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        realtimeService.send('preview:playback-sync', {
          ...playbackState,
          timestamp: Date.now()
        });
      }, 100); // Throttle para evitar spam
    }
  }, [playbackState, syncMode]);

  // Atualizar canvas de anotações
  useEffect(() => {
    drawAnnotations();
  }, [annotations, showAnnotations, zoom, panOffset]);

  // Carregar anotações existentes
  const loadAnnotations = async () => {
    try {
      // Simular carregamento (implementar com API real)
      const mockAnnotations: Annotation[] = [
        {
          id: 'ann1',
          type: 'text',
          x: 100,
          y: 100,
          text: 'Revisar esta cena',
          color: '#ff0000',
          strokeWidth: 2,
          timestamp: 30,
          authorId: 'user-1',
          authorName: 'João Silva',
          createdAt: new Date(Date.now() - 3600000),
          isVisible: true,
          opacity: 0.8
        },
        {
          id: 'ann2',
          type: 'rectangle',
          x: 200,
          y: 150,
          width: 100,
          height: 60,
          color: '#00ff00',
          strokeWidth: 3,
          timestamp: 45,
          authorId: 'user-2',
          authorName: 'Maria Santos',
          createdAt: new Date(Date.now() - 1800000),
          isVisible: true,
          opacity: 0.6
        }
      ];
      
      setAnnotations(mockAnnotations);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    }
  };

  // Carregar marcadores colaborativos
  const loadMarkers = async () => {
    try {
      const mockMarkers: CollaborativeMarker[] = [
        {
          id: 'marker1',
          name: 'Início da música',
          timestamp: 15,
          color: '#3b82f6',
          authorId: 'user-1',
          authorName: 'João Silva',
          description: 'Ponto onde a música de fundo começa',
          createdAt: new Date(Date.now() - 7200000)
        },
        {
          id: 'marker2',
          name: 'Transição importante',
          timestamp: 67,
          color: '#ef4444',
          authorId: 'user-2',
          authorName: 'Maria Santos',
          description: 'Transição que precisa ser suavizada',
          createdAt: new Date(Date.now() - 3600000)
        }
      ];
      
      setMarkers(mockMarkers);
    } catch (error) {
      console.error('Erro ao carregar marcadores:', error);
    }
  };

  // Carregar sessão ativa
  const loadActiveSession = async () => {
    try {
      // Verificar se há sessão de review ativa
      const mockSession: ReviewSession = {
        id: 'session1',
        name: 'Review Final do Projeto',
        description: 'Revisão final antes da entrega',
        hostId: 'user-1',
        hostName: 'João Silva',
        participants: ['user-1', 'user-2', 'user-3'],
        startTime: new Date(Date.now() - 1800000),
        isActive: true,
        settings: {
          allowAnnotations: true,
          allowPlaybackControl: false,
          autoSync: true,
          recordSession: true
        }
      };
      
      setReviewSession(mockSession);
      
      // Definir modo de sincronização baseado na sessão
      if (mockSession.hostId === currentUser?.id) {
        setSyncMode('host');
      } else {
        setSyncMode('follow');
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    }
  };

  // Handlers de eventos
  const handlePlaybackSync = (syncData: PlaybackState & { timestamp: number }) => {
    if (syncMode === 'follow' && videoRef.current) {
      const latency = Date.now() - syncData.timestamp;
      const adjustedTime = syncData.currentTime + (latency / 1000);
      
      // Sincronizar apenas se a diferença for significativa
      if (Math.abs(videoRef.current.currentTime - adjustedTime) > 0.5) {
        videoRef.current.currentTime = adjustedTime;
      }
      
      if (syncData.isPlaying !== playbackState.isPlaying) {
        if (syncData.isPlaying) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
      
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: syncData.isPlaying,
        currentTime: adjustedTime,
        volume: syncData.volume,
        isMuted: syncData.isMuted,
        playbackRate: syncData.playbackRate
      }));
    }
  };

  const handleAnnotationAdded = (annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleAnnotationUpdated = (annotation: Annotation) => {
    setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a));
  };

  const handleAnnotationRemoved = (annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  };

  const handleMarkerAdded = (marker: CollaborativeMarker) => {
    setMarkers(prev => [...prev, marker]);
  };

  const handleMarkerUpdated = (marker: CollaborativeMarker) => {
    setMarkers(prev => prev.map(m => m.id === marker.id ? marker : m));
  };

  const handleSessionStarted = (session: ReviewSession) => {
    setReviewSession(session);
    if (session.hostId !== currentUser?.id) {
      setSyncMode('follow');
    }
  };

  const handleSessionEnded = () => {
    setReviewSession(null);
    setSyncMode('independent');
  };

  const handleCursorMoved = (data: { userId: string; x: number; y: number }) => {
    // Atualizar cursor de outros usuários
    presenceManager.updateCursor(data.userId, { x: data.x, y: data.y });
  };

  // Controles de playback
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    const newIsPlaying = !playbackState.isPlaying;
    
    if (newIsPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    
    const newState = { ...playbackState, isPlaying: newIsPlaying };
    setPlaybackState(newState);
    onPlaybackStateChange?.(newState);
  };

  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = time;
    const newState = { ...playbackState, currentTime: time };
    setPlaybackState(newState);
    onPlaybackStateChange?.(newState);
  };

  const changeVolume = (volume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = volume;
    const newState = { ...playbackState, volume, isMuted: volume === 0 };
    setPlaybackState(newState);
    onPlaybackStateChange?.(newState);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newIsMuted = !playbackState.isMuted;
    videoRef.current.muted = newIsMuted;
    
    const newState = { ...playbackState, isMuted: newIsMuted };
    setPlaybackState(newState);
    onPlaybackStateChange?.(newState);
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    const newState = { ...playbackState, playbackRate: rate };
    setPlaybackState(newState);
    onPlaybackStateChange?.(newState);
  };

  // Ferramentas de anotação
  const startAnnotation = (e: React.MouseEvent) => {
    if (!annotationTool || !canvasRef.current || !currentUser) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;
    
    const baseAnnotation = {
      id: `ann-${Date.now()}`,
      x,
      y,
      color: annotationColor,
      strokeWidth: annotationStrokeWidth,
      timestamp: playbackState.currentTime,
      authorId: currentUser.id,
      authorName: currentUser.username,
      createdAt: new Date(),
      isVisible: true,
      opacity: 0.8
    };
    
    if (annotationTool === 'freehand') {
      setIsDrawing(true);
      drawingPathRef.current = [{ x, y }];
      setCurrentAnnotation({
        ...baseAnnotation,
        type: 'freehand',
        points: [{ x, y }]
      });
    } else if (annotationTool === 'text') {
      const text = prompt('Digite o texto da anotação:');
      if (text) {
        const annotation: Annotation = {
          ...baseAnnotation,
          type: 'text',
          text
        };
        
        addAnnotation(annotation);
      }
    } else {
      setCurrentAnnotation({
        ...baseAnnotation,
        type: annotationTool,
        width: 0,
        height: 0
      });
    }
  };

  const updateAnnotation = (e: React.MouseEvent) => {
    if (!currentAnnotation || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;
    
    if (currentAnnotation.type === 'freehand' && isDrawing) {
      drawingPathRef.current.push({ x, y });
      setCurrentAnnotation(prev => ({
        ...prev!,
        points: [...drawingPathRef.current]
      }));
    } else if (currentAnnotation.type === 'rectangle' || currentAnnotation.type === 'circle') {
      setCurrentAnnotation(prev => ({
        ...prev!,
        width: x - prev!.x!,
        height: y - prev!.y!
      }));
    }
  };

  const finishAnnotation = () => {
    if (!currentAnnotation || !currentUser) return;
    
    const annotation: Annotation = {
      id: currentAnnotation.id!,
      type: currentAnnotation.type!,
      x: currentAnnotation.x!,
      y: currentAnnotation.y!,
      width: currentAnnotation.width,
      height: currentAnnotation.height,
      text: currentAnnotation.text,
      color: currentAnnotation.color!,
      strokeWidth: currentAnnotation.strokeWidth!,
      timestamp: currentAnnotation.timestamp!,
      authorId: currentAnnotation.authorId!,
      authorName: currentAnnotation.authorName!,
      createdAt: currentAnnotation.createdAt!,
      isVisible: currentAnnotation.isVisible!,
      opacity: currentAnnotation.opacity!,
      points: currentAnnotation.points
    };
    
    addAnnotation(annotation);
    setCurrentAnnotation(null);
    setIsDrawing(false);
    drawingPathRef.current = [];
  };

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
    realtimeService.send('preview:annotation-add', annotation);
    onAnnotationAdded?.(annotation);
  };

  const removeAnnotation = (annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    realtimeService.send('preview:annotation-remove', { id: annotationId });
  };

  // Adicionar marcador colaborativo
  const addMarker = () => {
    if (!currentUser) return;
    
    const name = prompt('Nome do marcador:');
    if (!name) return;
    
    const description = prompt('Descrição (opcional):');
    
    const marker: CollaborativeMarker = {
      id: `marker-${Date.now()}`,
      name,
      timestamp: playbackState.currentTime,
      color: annotationColor,
      authorId: currentUser.id,
      authorName: currentUser.username,
      description: description || undefined,
      createdAt: new Date()
    };
    
    setMarkers(prev => [...prev, marker]);
    realtimeService.send('preview:marker-add', marker);
    onMarkerAdded?.(marker);
  };

  // Desenhar anotações no canvas
  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar transformações
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x / zoom, panOffset.y / zoom);
    
    // Desenhar anotações visíveis no timestamp atual
    const currentAnnotations = annotations.filter(a => 
      a.isVisible && 
      showAnnotations &&
      Math.abs(a.timestamp - playbackState.currentTime) < 2 // Mostrar anotações próximas ao tempo atual
    );
    
    currentAnnotations.forEach(annotation => {
      ctx.globalAlpha = annotation.opacity;
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      
      switch (annotation.type) {
        case 'text':
          ctx.font = '16px Arial';
          ctx.fillText(annotation.text || '', annotation.x, annotation.y);
          break;
          
        case 'rectangle':
          ctx.strokeRect(annotation.x, annotation.y, annotation.width || 0, annotation.height || 0);
          break;
          
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(annotation.width || 0, 2) + Math.pow(annotation.height || 0, 2)
          ) / 2;
          ctx.beginPath();
          ctx.arc(
            annotation.x + (annotation.width || 0) / 2,
            annotation.y + (annotation.height || 0) / 2,
            radius,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          break;
          
        case 'freehand':
          if (annotation.points && annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
      }
    });
    
    // Desenhar anotação atual sendo criada
    if (currentAnnotation) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = currentAnnotation.color!;
      ctx.lineWidth = currentAnnotation.strokeWidth!;
      
      switch (currentAnnotation.type) {
        case 'rectangle':
          ctx.strokeRect(
            currentAnnotation.x!,
            currentAnnotation.y!,
            currentAnnotation.width || 0,
            currentAnnotation.height || 0
          );
          break;
          
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(currentAnnotation.width || 0, 2) + Math.pow(currentAnnotation.height || 0, 2)
          ) / 2;
          ctx.beginPath();
          ctx.arc(
            currentAnnotation.x! + (currentAnnotation.width || 0) / 2,
            currentAnnotation.y! + (currentAnnotation.height || 0) / 2,
            radius,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          break;
          
        case 'freehand':
          if (currentAnnotation.points && currentAnnotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(currentAnnotation.points[0].x, currentAnnotation.points[0].y);
            currentAnnotation.points.forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
      }
    }
    
    ctx.restore();
  };

  // Controles de zoom e pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Pan com botão do meio ou Ctrl+clique
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (annotationTool) {
      startAnnotation(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (currentAnnotation && annotationTool) {
      updateAnnotation(e);
    }
    
    // Enviar posição do cursor para outros usuários
    if (currentUser) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        realtimeService.send('preview:cursor-move', {
          userId: currentUser.id,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (currentAnnotation) {
      finishAnnotation();
    }
  };

  // Formatação de tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" ref={containerRef}>
      {/* Vídeo principal */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain"
        onTimeUpdate={(e) => {
          const video = e.target as HTMLVideoElement;
          setPlaybackState(prev => ({
            ...prev,
            currentTime: video.currentTime,
            duration: video.duration || 0
          }));
        }}
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement;
          setPlaybackState(prev => ({
            ...prev,
            duration: video.duration
          }));
        }}
        onPlay={() => setPlaybackState(prev => ({ ...prev, isPlaying: true }))}
        onPause={() => setPlaybackState(prev => ({ ...prev, isPlaying: false }))}
      />
      
      {/* Canvas de anotações */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
        width={containerRef.current?.clientWidth || 800}
        height={containerRef.current?.clientHeight || 600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isPanning ? 'grabbing' : annotationTool ? 'crosshair' : 'default'
        }}
      />
      
      {/* Marcadores na timeline */}
      {showMarkers && (
        <div className="absolute bottom-20 left-0 right-0 h-2">
          {markers.map(marker => {
            const position = (marker.timestamp / playbackState.duration) * 100;
            return (
              <div
                key={marker.id}
                className="absolute w-1 h-full cursor-pointer group"
                style={{
                  left: `${position}%`,
                  backgroundColor: marker.color
                }}
                onClick={() => seekTo(marker.timestamp)}
                title={`${marker.name} - ${formatTime(marker.timestamp)}`}
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <div className="font-medium">{marker.name}</div>
                  <div className="text-gray-300">{marker.authorName}</div>
                  {marker.description && (
                    <div className="text-gray-400">{marker.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Controles de playback */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="relative h-2 bg-gray-600 rounded cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * playbackState.duration);
            }}>
              <div 
                className="absolute h-full bg-red-500 rounded"
                style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
              />
              <div 
                className="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-y-1 -translate-x-2 cursor-grab"
                style={{ left: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Controles principais */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => seekTo(Math.max(0, playbackState.currentTime - 10))}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                {playbackState.isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button
                onClick={() => seekTo(Math.min(playbackState.duration, playbackState.currentTime + 10))}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <SkipForward size={20} />
              </button>
              
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                  {playbackState.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={playbackState.volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
              
              <div className="text-sm">
                {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Velocidade de reprodução */}
              <select
                value={playbackState.playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="bg-black bg-opacity-50 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              
              {/* Qualidade */}
              <select
                value={playbackState.quality}
                onChange={(e) => setPlaybackState(prev => ({ ...prev, quality: e.target.value as any }))}
                className="bg-black bg-opacity-50 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="auto">Auto</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
              
              <button
                onClick={() => setPlaybackState(prev => ({ ...prev, fullscreen: !prev.fullscreen }))}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <Fullscreen size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Ferramentas de anotação */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg p-2 flex flex-col gap-2">
        <div className="flex gap-1">
          {[
            { tool: 'text', icon: Type },
            { tool: 'rectangle', icon: Square },
            { tool: 'circle', icon: Circle },
            { tool: 'freehand', icon: Pen },
            { tool: 'marker', icon: MessageCircle }
          ].map(({ tool, icon: Icon }) => (
            <button
              key={tool}
              onClick={() => setAnnotationTool(annotationTool === tool ? null : tool as any)}
              className={`p-2 rounded transition-colors ${
                annotationTool === tool
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-white hover:bg-opacity-20'
              }`}
              title={`Ferramenta: ${tool}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        
        {annotationTool && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-600">
            <input
              type="color"
              value={annotationColor}
              onChange={(e) => setAnnotationColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            
            <input
              type="range"
              min="1"
              max="10"
              value={annotationStrokeWidth}
              onChange={(e) => setAnnotationStrokeWidth(parseInt(e.target.value))}
              className="w-16"
            />
          </div>
        )}
        
        <div className="flex gap-1 pt-2 border-t border-gray-600">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`p-2 rounded transition-colors ${
              showAnnotations ? 'text-green-400' : 'text-gray-500'
            }`}
            title="Mostrar/ocultar anotações"
          >
            {showAnnotations ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <button
            onClick={addMarker}
            className="p-2 text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Adicionar marcador"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
      
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-75 rounded-lg p-2 flex flex-col gap-1">
        <button
          onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
          className="p-2 text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        
        <div className="text-xs text-gray-300 text-center px-1">
          {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
          className="p-2 text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        
        <button
          onClick={() => {
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="p-2 text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Reset zoom"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      
      {/* Informações da sessão */}
      {reviewSession && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Users size={16} />
          <span className="font-medium">{reviewSession.name}</span>
          <span className="text-green-100">({reviewSession.participants.length} participantes)</span>
          {reviewSession.hostId === currentUser?.id && (
            <span className="bg-green-600 px-2 py-1 rounded text-xs">HOST</span>
          )}
        </div>
      )}
      
      {/* Indicador de modo de sincronização */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
        Modo: <span className="font-medium">
          {syncMode === 'host' ? 'Host' : syncMode === 'follow' ? 'Seguindo' : 'Independente'}
        </span>
      </div>
    </div>
  );
};

export default LivePreview