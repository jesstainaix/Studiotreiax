import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar3DViewer } from './Avatar3DViewer';
import { ElementsPanel } from './ElementsPanel';
import { HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { SceneLayer, SceneLayersData, CanvasMouseEvent, SelectionBox } from '../../types/SceneLayers';
import { useSceneLayersManager } from '../../hooks/useSceneLayersManager';
import { useResponsiveDesign, getScenePlayerConfig, getElementsPanelConfig } from './ResponsiveOptimizer';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Maximize2,
  Settings,
  User,
  FileText,
  Timer,
  Eye,
  Grid3x3,
  MousePointer2,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface EnhancedScenePlayerProps {
  scene: HeyGenScene;
  isPlaying?: boolean;
  currentTime?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  className?: string;
}

export const EnhancedScenePlayer: React.FC<EnhancedScenePlayerProps> = ({
  scene,
  isPlaying = false,
  currentTime = 0,
  onPlay,
  onPause,
  onTimeUpdate,
  onVolumeChange,
  className = ''
}) => {
  // Responsive settings
  const viewport = useResponsiveDesign();
  const playerConfig = getScenePlayerConfig(viewport);
  const elementsPanelConfig = getElementsPanelConfig(viewport);
  
  // UI State (with responsive defaults)
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'avatar' | 'slide' | 'elements'>(
    elementsPanelConfig.showPreview ? 'split' : 'slide'
  );
  const [showGrid, setShowGrid] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(playerConfig.canvasZoom);
  const [toolMode, setToolMode] = useState<'select' | 'move' | 'text' | 'image'>('select');
  
  // Selection and interaction state
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>();
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({ 
    startX: 0, startY: 0, endX: 0, endY: 0, visible: false 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Scene layers management
  const {
    layers,
    isLoading,
    addLayer,
    updateLayer,
    deleteLayer,
    loadLayers,
    undo,
    redo,
    canUndo,
    canRedo
  } = useSceneLayersManager(scene.id);

  // Load layers when scene changes
  useEffect(() => {
    loadLayers();
  }, [scene.id, loadLayers]);

  // Enhanced audio playback synchronization with bidirectional sync
  useEffect(() => {
    if (audioRef.current && scene.audio?.url) {
      const audio = audioRef.current;
      
      // Set up audio source and sync current time
      audio.src = scene.audio.url;
      audio.currentTime = currentTime;
      
      // Bidirectional sync: audio drives timeline updates
      const handleTimeUpdate = () => {
        onTimeUpdate?.(audio.currentTime);
      };
      
      const handleEnded = () => {
        onPause?.();
        onTimeUpdate?.(0);
      };
      
      const handleLoadedMetadata = () => {
        // Ensure duration matches scene duration
        if (Math.abs(audio.duration - scene.duration) > 0.1) {
          console.warn(`Audio duration (${audio.duration}s) doesn't match scene duration (${scene.duration}s)`);
        }
      };
      
      // Add event listeners for audio synchronization
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      if (isPlaying) {
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
      
      // Cleanup listeners
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [scene.audio?.url, currentTime, isPlaying, onTimeUpdate, onPause, scene.duration]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const newVolume = isMuted ? volume : 0;
    onVolumeChange?.(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Canvas interaction handlers
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Check if clicking on an existing layer
    const clickedLayer = layers
      .filter(layer => layer.visible && !layer.locked)
      .sort((a, b) => (b.z_index || 0) - (a.z_index || 0))
      .find(layer => 
        x >= layer.x && x <= layer.x + layer.width &&
        y >= layer.y && y <= layer.y + layer.height
      );
    
    if (clickedLayer) {
      setSelectedLayerId(clickedLayer.id);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedLayer.x,
        y: y - clickedLayer.y
      });
    } else {
      setSelectedLayerId(undefined);
      if (toolMode === 'select') {
        // Start selection box
        setSelectionBox({
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          visible: true
        });
      }
    }
  }, [layers, toolMode]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    if (isDragging && selectedLayerId) {
      // Update layer position
      const newX = Math.max(0, Math.min(1 - (layers.find(l => l.id === selectedLayerId)?.width || 0), x - dragOffset.x));
      const newY = Math.max(0, Math.min(1 - (layers.find(l => l.id === selectedLayerId)?.height || 0), y - dragOffset.y));
      
      updateLayer(selectedLayerId, { x: newX, y: newY });
    } else if (selectionBox.visible) {
      // Update selection box
      setSelectionBox(prev => ({
        ...prev,
        endX: x,
        endY: y
      }));
    }
  }, [isDragging, selectedLayerId, dragOffset, layers, updateLayer, selectionBox.visible]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setSelectionBox(prev => ({ ...prev, visible: false }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'c':
            if (selectedLayerId) {
              event.preventDefault();
              // Copy layer (TODO: implement clipboard)
            }
            break;
          case 'v':
            event.preventDefault();
            // Paste layer (TODO: implement clipboard)
            break;
          case 'd':
            if (selectedLayerId) {
              event.preventDefault();
              // Duplicate layer
              const layer = layers.find(l => l.id === selectedLayerId);
              if (layer) {
                const duplicated = {
                  ...layer,
                  name: `${layer.name} (Cópia)`,
                  x: layer.x + 0.05,
                  y: layer.y + 0.05
                };
                delete duplicated.id;
                addLayer(duplicated);
              }
            }
            break;
        }
      } else if (event.key === 'Delete' && selectedLayerId) {
        deleteLayer(selectedLayerId);
        setSelectedLayerId(undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, undo, redo, addLayer, deleteLayer]);

  const getAvatarPosition = () => {
    if (!scene.videoSettings) return { right: '20px', top: '20px', width: '200px', height: '300px' };
    
    const position = scene.videoSettings.avatarPosition || 'right';
    switch (position) {
      case 'left':
        return { left: '20px', top: '20px', width: '200px', height: '300px' };
      case 'center':
        return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '350px' };
      case 'right':
      default:
        return { right: '20px', top: '20px', width: '200px', height: '300px' };
    }
  };

  const renderLayer = (layer: SceneLayer) => {
    if (!layer.visible) return null;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${layer.x * 100}%`,
      top: `${layer.y * 100}%`,
      width: `${layer.width * 100}%`,
      height: `${layer.height * 100}%`,
      zIndex: layer.z_index,
      cursor: layer.locked ? 'not-allowed' : 'move',
      border: selectedLayerId === layer.id ? '2px solid #3b82f6' : 'none',
      ...layer.style
    };

    if (layer.type === 'text') {
      return (
        <div
          key={layer.id}
          style={style}
          className="pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ 
            fontSize: layer.style?.fontSize,
            fontWeight: layer.style?.fontWeight,
            fontFamily: layer.style?.fontFamily,
            color: layer.style?.color,
            textAlign: layer.style?.textAlign as any,
            lineHeight: layer.style?.lineHeight,
            textShadow: layer.style?.textShadow,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'pre-wrap'
          }}>
            {layer.value}
          </div>
        </div>
      );
    }

    if (layer.type === 'image') {
      return (
        <img
          key={layer.id}
          src={layer.src}
          alt={layer.name}
          style={style}
          className="pointer-events-auto object-contain"
          onMouseDown={(e) => e.stopPropagation()}
        />
      );
    }

    if (layer.type === 'graphic' && layer.content) {
      const graphicStyle = {
        ...style,
        backgroundColor: layer.content.fill,
        border: layer.content.border ? 
          `${layer.content.border.width}px ${layer.content.border.style} ${layer.content.border.color}` : 
          'none',
        borderRadius: layer.content.cornerRadius ? `${layer.content.cornerRadius}px` : '0'
      };

      return (
        <div
          key={layer.id}
          style={graphicStyle}
          className="pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
        />
      );
    }

    return null;
  };

  return (
    <div className={`h-full flex ${className}`}>
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <Card className="h-full flex flex-col">
          {/* Player Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{scene.title}</h3>
                <Badge variant="outline">
                  <Timer className="w-3 h-3 mr-1" />
                  {formatTime(scene.duration)}
                </Badge>
                {scene.avatar && (
                  <Badge variant="secondary">
                    <User className="w-3 h-3 mr-1" />
                    {scene.avatar.name}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Tool Mode Toggle */}
                <div className="flex border rounded">
                  <Button
                    size="sm"
                    variant={toolMode === 'select' ? 'default' : 'ghost'}
                    onClick={() => setToolMode('select')}
                    className="rounded-r-none"
                  >
                    <MousePointer2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={toolMode === 'move' ? 'default' : 'ghost'}
                    onClick={() => setToolMode('move')}
                    className="rounded-none"
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                </div>

                {/* Preview Mode Toggle */}
                <div className="flex border rounded">
                  <Button
                    size="sm"
                    variant={previewMode === 'split' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('split')}
                    className="rounded-r-none"
                  >
                    Split
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'elements' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('elements')}
                    className="rounded-l-none"
                  >
                    Elementos
                  </Button>
                </div>
                
                <Button 
                  size="sm" 
                  variant={showGrid ? 'default' : 'outline'}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => setShowFullscreen(true)}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Content */}
          <CardContent className="flex-1 p-0 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
            <div 
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair"
              style={{ transform: `scale(${canvasZoom})` }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            >
              {/* Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg width="100%" height="100%" className="opacity-30">
                    <defs>
                      <pattern id="grid" width="5%" height="5%" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              )}

              {/* Slide Background */}
              {scene.thumbnail && (
                <img 
                  src={scene.thumbnail}
                  alt={scene.title}
                  className="absolute inset-0 w-full h-full object-contain opacity-80 pointer-events-none"
                />
              )}

              {/* Scene Layers */}
              {layers.map(renderLayer)}

              {/* Avatar Overlay */}
              {previewMode === 'split' && scene.avatar && (
                <div 
                  className="absolute z-10 rounded-lg overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm pointer-events-none"
                  style={getAvatarPosition()}
                >
                  <Avatar3DViewer
                    avatarId={scene.avatar.id}
                    modelPath={scene.avatar.modelPath}
                    style={scene.avatar.style}
                    pose={scene.videoSettings?.cameraAngle === 'side' ? 'presenting' : 'standing'}
                    expression="neutral"
                    autoRotate={false}
                    cameraPosition={[0, 0, 2.5]}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Selection Box */}
              {selectionBox.visible && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-25 pointer-events-none"
                  style={{
                    left: `${Math.min(selectionBox.startX, selectionBox.endX) * 100}%`,
                    top: `${Math.min(selectionBox.startY, selectionBox.endY) * 100}%`,
                    width: `${Math.abs(selectionBox.endX - selectionBox.startX) * 100}%`,
                    height: `${Math.abs(selectionBox.endY - selectionBox.startY) * 100}%`
                  }}
                />
              )}
            </div>

            {/* Scene Info Overlay */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
              Cena {scene.position + 1} • {formatTime(currentTime)} / {formatTime(scene.duration)}
              {layers.length > 0 && ` • ${layers.length} elementos`}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCanvasZoom(Math.max(0.25, canvasZoom - 0.25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm bg-white px-2 py-1 rounded border">
                {Math.round(canvasZoom * 100)}%
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCanvasZoom(Math.min(3, canvasZoom + 0.25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>

          {/* Player Controls */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center justify-between">
              {/* Playback Controls */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant={isPlaying ? 'default' : 'outline'}
                  onClick={isPlaying ? onPause : onPlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button size="sm" variant="outline">
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <span className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(scene.duration)}
                </span>
              </div>

              {/* Undo/Redo Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!canUndo}
                  onClick={undo}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!canRedo}
                  onClick={redo}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                
                <span className="text-xs text-gray-500 w-8">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="relative w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / scene.duration) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={scene.duration}
                  value={currentTime}
                  onChange={(e) => onTimeUpdate?.(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Elements Panel (Right Side) */}
      {previewMode === 'elements' && (
        <div className="w-80 border-l">
          <ElementsPanel
            selectedSceneId={scene.id}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onAddLayer={addLayer}
            onUpdateLayer={updateLayer}
            onDeleteLayer={deleteLayer}
            onSelectLayer={setSelectedLayerId}
          />
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
};