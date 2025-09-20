import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Settings, Layers, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { AdvancedVFXEngine, VFXComposition, VFXLayer } from '../services/AdvancedVFXEngine';

interface ViewportConfig {
  id: string;
  name: string;
  type: 'main' | 'preview' | 'wireframe' | 'material';
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  };
  enabled: boolean;
}

interface TimelineKeyframe {
  id: string;
  time: number;
  layerId: string;
  property: string;
  value: any;
  easing: string;
}

interface VFXStudioProProps {
  composition?: VFXComposition;
  onCompositionChange?: (composition: VFXComposition) => void;
}

const VFXStudioPro: React.FC<VFXStudioProProps> = ({ 
  composition, 
  onCompositionChange 
}) => {
  const [engine, setEngine] = useState<AdvancedVFXEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [viewports, setViewports] = useState<ViewportConfig[]>([
    {
      id: 'main',
      name: 'Main View',
      type: 'main',
      camera: { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 }, fov: 75 },
      enabled: true
    },
    {
      id: 'preview',
      name: 'Preview',
      type: 'preview',
      camera: { position: { x: 5, y: 5, z: 5 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
      enabled: true
    },
    {
      id: 'wireframe',
      name: 'Wireframe',
      type: 'wireframe',
      camera: { position: { x: -5, y: 0, z: 5 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
      enabled: true
    },
    {
      id: 'material',
      name: 'Material View',
      type: 'material',
      camera: { position: { x: 0, y: -5, z: 5 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
      enabled: true
    }
  ]);
  
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const wireframeCanvasRef = useRef<HTMLCanvasElement>(null);
  const materialCanvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Inicializar VFX Engine
  useEffect(() => {
    if (mainCanvasRef.current) {
      const vfxEngine = new AdvancedVFXEngine(mainCanvasRef.current);
      setEngine(vfxEngine);
      
      if (composition) {
        vfxEngine.loadComposition(composition);
      }
      
      return () => {
        vfxEngine.dispose();
      };
    }
  }, []);

  // Controles de reprodução
  const handlePlay = useCallback(() => {
    if (engine) {
      engine.play();
      setIsPlaying(true);
    }
  }, [engine]);

  const handlePause = useCallback(() => {
    if (engine) {
      engine.pause();
      setIsPlaying(false);
    }
  }, [engine]);

  const handleStop = useCallback(() => {
    if (engine) {
      engine.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [engine]);

  const handleSeek = useCallback((time: number) => {
    if (engine) {
      engine.seekTo(time);
      setCurrentTime(time);
    }
  }, [engine]);

  // Gerenciamento de layers
  const handleLayerToggle = useCallback((layerId: string) => {
    if (engine && composition) {
      const layer = composition.layers.find(l => l.id === layerId);
      if (layer) {
        layer.visible = !layer.visible;
        engine.updateLayer(layer);
        onCompositionChange?.(composition);
      }
    }
  }, [engine, composition, onCompositionChange]);

  const handleLayerLock = useCallback((layerId: string) => {
    if (composition) {
      const layer = composition.layers.find(l => l.id === layerId);
      if (layer) {
        layer.locked = !layer.locked;
        onCompositionChange?.(composition);
      }
    }
  }, [composition, onCompositionChange]);

  // Viewport management
  const toggleViewport = useCallback((viewportId: string) => {
    setViewports(prev => prev.map(vp => 
      vp.id === viewportId ? { ...vp, enabled: !vp.enabled } : vp
    ));
  }, []);

  // Timeline rendering
  const renderTimeline = () => {
    const timelineWidth = 800;
    const pixelsPerSecond = timelineWidth / duration;
    
    return (
      <div className="timeline-container bg-gray-900 border-t border-gray-700">
        {/* Timeline Header */}
        <div className="timeline-header flex items-center justify-between p-4 bg-gray-800">
          <div className="playback-controls flex items-center space-x-2">
            <button 
              onClick={handleStop}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              <Square className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={() => handleSeek(Math.max(0, currentTime - 1))}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              <SkipBack className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={isPlaying ? handlePause : handlePlay}
              className="p-2 bg-blue-600 hover:bg-blue-500 rounded"
            >
              {isPlaying ? 
                <Pause className="w-4 h-4 text-white" /> : 
                <Play className="w-4 h-4 text-white" />
              }
            </button>
            <button 
              onClick={() => handleSeek(Math.min(duration, currentTime + 1))}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              <SkipForward className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="time-display text-white font-mono">
            {Math.floor(currentTime * 100) / 100}s / {duration}s
          </div>
        </div>
        
        {/* Timeline Ruler */}
        <div className="timeline-ruler bg-gray-800 border-b border-gray-700 p-2">
          <div className="relative" style={{ width: timelineWidth }}>
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
              <div 
                key={i}
                className="absolute text-xs text-gray-400"
                style={{ left: i * pixelsPerSecond }}
              >
                {i}s
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline Tracks */}
        <div className="timeline-tracks" ref={timelineRef}>
          {composition?.layers.map((layer, index) => (
            <div key={layer.id} className="timeline-track flex border-b border-gray-700">
              <div className="track-header w-48 p-2 bg-gray-800 flex items-center justify-between">
                <span className="text-white text-sm truncate">{layer.name}</span>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleLayerToggle(layer.id)}
                    className={`p-1 rounded ${layer.visible ? 'text-blue-400' : 'text-gray-500'}`}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button 
                    onClick={() => handleLayerLock(layer.id)}
                    className={`p-1 rounded ${layer.locked ? 'text-red-400' : 'text-gray-500'}`}
                  >
                    {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              
              <div className="track-content flex-1 relative bg-gray-900" style={{ height: '40px' }}>
                {/* Layer duration bar */}
                <div 
                  className="absolute top-1 bg-blue-600 rounded"
                  style={{
                    left: (layer.startTime || 0) * pixelsPerSecond,
                    width: ((layer.endTime || duration) - (layer.startTime || 0)) * pixelsPerSecond,
                    height: '30px'
                  }}
                />
                
                {/* Keyframes */}
                {layer.effects?.flatMap(effect => effect.keyframes || []).map((keyframe, kfIndex) => (
                  <div
                    key={`${layer.id}-${kfIndex}`}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1 -translate-y-1"
                    style={{
                      left: keyframe.time * duration * pixelsPerSecond,
                      top: '15px'
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Playhead */}
        <div 
          className="absolute top-0 w-0.5 bg-red-500 pointer-events-none"
          style={{
            left: 192 + (currentTime * pixelsPerSecond),
            height: '100%',
            zIndex: 10
          }}
        />
      </div>
    );
  };

  return (
    <div className="vfx-studio-pro h-screen flex flex-col bg-gray-900">
      {/* Top Toolbar */}
      <div className="toolbar flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">VFX Studio Pro</h1>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">Layers: {composition?.layers.length || 0}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {viewports.map(viewport => (
            <button
              key={viewport.id}
              onClick={() => toggleViewport(viewport.id)}
              className={`px-3 py-1 rounded text-sm ${
                viewport.enabled 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {viewport.name}
            </button>
          ))}
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="main-content flex-1 flex">
        {/* Viewport Grid */}
        <div className="viewport-grid flex-1 grid grid-cols-2 gap-1 p-1 bg-gray-800">
          {/* Main Viewport */}
          {viewports.find(vp => vp.id === 'main')?.enabled && (
            <div className="viewport bg-black rounded relative">
              <div className="viewport-header absolute top-2 left-2 z-10">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Main View
                </span>
              </div>
              <canvas 
                ref={mainCanvasRef}
                className="w-full h-full rounded"
                style={{ background: '#000' }}
              />
            </div>
          )}
          
          {/* Preview Viewport */}
          {viewports.find(vp => vp.id === 'preview')?.enabled && (
            <div className="viewport bg-black rounded relative">
              <div className="viewport-header absolute top-2 left-2 z-10">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Preview
                </span>
              </div>
              <canvas 
                ref={previewCanvasRef}
                className="w-full h-full rounded"
                style={{ background: '#111' }}
              />
            </div>
          )}
          
          {/* Wireframe Viewport */}
          {viewports.find(vp => vp.id === 'wireframe')?.enabled && (
            <div className="viewport bg-black rounded relative">
              <div className="viewport-header absolute top-2 left-2 z-10">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Wireframe
                </span>
              </div>
              <canvas 
                ref={wireframeCanvasRef}
                className="w-full h-full rounded"
                style={{ background: '#0a0a0a' }}
              />
            </div>
          )}
          
          {/* Material Viewport */}
          {viewports.find(vp => vp.id === 'material')?.enabled && (
            <div className="viewport bg-black rounded relative">
              <div className="viewport-header absolute top-2 left-2 z-10">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Material View
                </span>
              </div>
              <canvas 
                ref={materialCanvasRef}
                className="w-full h-full rounded"
                style={{ background: '#1a1a1a' }}
              />
            </div>
          )}
        </div>
        
        {/* Properties Panel */}
        <div className="properties-panel w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-4">Properties</h3>
          
          {selectedLayer ? (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Layer Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  defaultValue={composition?.layers.find(l => l.id === selectedLayer)?.name}
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Opacity</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  className="w-full"
                  defaultValue={composition?.layers.find(l => l.id === selectedLayer)?.opacity || 1}
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Blend Mode</label>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded">
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft Light</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select a layer to edit properties
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      <div className="timeline h-64">
        {renderTimeline()}
      </div>
    </div>
  );
};

export default VFXStudioPro;