import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Play, Pause, RotateCcw, Download, Eye, Settings, Layers } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface VFXLayer {
  id: string;
  name: string;
  type: 'animation' | 'particles' | 'greenscreen' | 'motion-graphics';
  enabled: boolean;
  opacity: number;
  blendMode: string;
  startTime: number;
  duration: number;
  settings: any;
}

interface PreviewSettings {
  resolution: { width: number; height: number };
  frameRate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  realTimeUpdates: boolean;
  showGrid: boolean;
  showSafeZones: boolean;
  backgroundColor: string;
}

const defaultPreviewSettings: PreviewSettings = {
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  quality: 'medium',
  realTimeUpdates: true,
  showGrid: false,
  showSafeZones: false,
  backgroundColor: '#000000'
};

const resolutionPresets = [
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'HD', width: 1280, height: 720 },
  { name: 'SD', width: 854, height: 480 },
  { name: 'Square', width: 1080, height: 1080 },
  { name: 'Vertical', width: 1080, height: 1920 }
];

const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light',
  'hard-light', 'color-dodge', 'color-burn', 'darken', 'lighten',
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

interface VFXPreviewSystemProps {
  layers?: VFXLayer[];
  onLayersChange?: (layers: VFXLayer[]) => void;
  onExport?: (previewData: any) => void;
}

// Real-time preview renderer component
const PreviewRenderer: React.FC<{
  layers: VFXLayer[];
  settings: PreviewSettings;
  isPlaying: boolean;
  currentTime: number;
}> = ({ layers, settings, isPlaying, currentTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const renderLayer = useCallback((layer: VFXLayer, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Skip if layer is disabled or outside time range
    if (!layer.enabled || currentTime < layer.startTime || currentTime > layer.startTime + layer.duration) {
      return;
    }

    // Set blend mode and opacity
    ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
    ctx.globalAlpha = layer.opacity;

    // Render based on layer type
    switch (layer.type) {
      case 'animation':
        renderAnimationLayer(ctx, layer, currentTime);
        break;
      case 'particles':
        renderParticleLayer(ctx, layer, currentTime);
        break;
      case 'greenscreen':
        renderGreenScreenLayer(ctx, layer, currentTime);
        break;
      case 'motion-graphics':
        renderMotionGraphicsLayer(ctx, layer, currentTime);
        break;
    }

    // Reset context
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [currentTime]);

  const renderAnimationLayer = (ctx: CanvasRenderingContext2D, layer: VFXLayer, time: number) => {
    const { settings } = layer;
    const progress = (time - layer.startTime) / layer.duration;
    
    // Simple animation rendering example
    ctx.save();
    
    // Apply GSAP-style transformations
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.translate(centerX, centerY);
    
    if (settings.animation === 'fadeIn') {
      ctx.globalAlpha = Math.min(1, progress * 2);
    } else if (settings.animation === 'slideIn') {
      const x = -ctx.canvas.width * (1 - progress);
      ctx.translate(x, 0);
    } else if (settings.animation === 'rotateIn') {
      const rotation = (1 - progress) * Math.PI;
      ctx.rotate(rotation);
    }
    
    // Draw animated element
    ctx.fillStyle = settings.color || '#ff6b35';
    ctx.fillRect(-50, -50, 100, 100);
    
    ctx.restore();
  };

  const renderParticleLayer = (ctx: CanvasRenderingContext2D, layer: VFXLayer, time: number) => {
    const { settings } = layer;
    const particleCount = settings.particleCount || 100;
    const progress = (time - layer.startTime) / layer.duration;
    
    ctx.save();
    
    // Render particles based on effect type
    for (let i = 0; i < particleCount; i++) {
      const seed = i / particleCount;
      const x = (Math.sin(seed * Math.PI * 2 + time) * 0.5 + 0.5) * ctx.canvas.width;
      const y = (Math.cos(seed * Math.PI * 4 + time * 0.5) * 0.5 + 0.5) * ctx.canvas.height;
      const size = (Math.sin(time + seed * 10) * 0.5 + 0.5) * (settings.size || 2);
      
      ctx.fillStyle = settings.color || '#9d4edd';
      ctx.globalAlpha = (Math.sin(time * 2 + seed * 5) * 0.5 + 0.5) * layer.opacity;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const renderGreenScreenLayer = (ctx: CanvasRenderingContext2D, layer: VFXLayer, time: number) => {
    // Placeholder for green screen rendering
    // In a real implementation, this would composite video layers
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  };

  const renderMotionGraphicsLayer = (ctx: CanvasRenderingContext2D, layer: VFXLayer, time: number) => {
    const { settings } = layer;
    const progress = (time - layer.startTime) / layer.duration;
    
    ctx.save();
    
    // Animated text example
    if (settings.type === 'text') {
      const fontSize = 48 * (settings.scale || 1);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = settings.color || '#ffffff';
      ctx.textAlign = 'center';
      
      const text = settings.text || 'Motion Graphics';
      const x = ctx.canvas.width / 2;
      const y = ctx.canvas.height / 2;
      
      // Typewriter effect
      const visibleChars = Math.floor(text.length * progress);
      const visibleText = text.substring(0, visibleChars);
      
      ctx.fillText(visibleText, x, y);
    }
    
    ctx.restore();
  };

  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear main canvas
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render grid if enabled
    if (settings.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Render safe zones if enabled
    if (settings.showSafeZones) {
      const safeMargin = 0.1;
      const safeX = canvas.width * safeMargin;
      const safeY = canvas.height * safeMargin;
      const safeWidth = canvas.width * (1 - 2 * safeMargin);
      const safeHeight = canvas.height * (1 - 2 * safeMargin);
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(safeX, safeY, safeWidth, safeHeight);
    }

    // Render each layer
    layers.forEach(layer => {
      let layerCanvas = layerCanvasesRef.current.get(layer.id);
      
      if (!layerCanvas) {
        layerCanvas = document.createElement('canvas');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        layerCanvasesRef.current.set(layer.id, layerCanvas);
      }
      
      // Render layer to its canvas
      renderLayer(layer, layerCanvas);
      
      // Composite layer onto main canvas
      if (layer.enabled) {
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(layerCanvas, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    });
  }, [layers, settings, renderLayer]);

  const animate = useCallback(() => {
    if (isPlaying && settings.realTimeUpdates) {
      renderComposite();
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, settings.realTimeUpdates, renderComposite]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      renderComposite();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate, renderComposite]);

  return (
    <canvas
      ref={canvasRef}
      width={settings.resolution.width}
      height={settings.resolution.height}
      className="w-full h-auto bg-black rounded-lg"
      style={{ aspectRatio: `${settings.resolution.width}/${settings.resolution.height}` }}
    />
  );
};

export const VFXPreviewSystem: React.FC<VFXPreviewSystemProps> = ({
  layers: initialLayers = [],
  onLayersChange,
  onExport
}) => {
  const [layers, setLayers] = useState<VFXLayer[]>(initialLayers);
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>(defaultPreviewSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(10);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add sample layers if none provided
  useEffect(() => {
    if (layers.length === 0) {
      const sampleLayers: VFXLayer[] = [
        {
          id: 'bg',
          name: 'Background',
          type: 'animation',
          enabled: true,
          opacity: 1,
          blendMode: 'normal',
          startTime: 0,
          duration: 10,
          settings: { animation: 'fadeIn', color: '#1a1a1a' }
        },
        {
          id: 'particles',
          name: 'Magic Particles',
          type: 'particles',
          enabled: true,
          opacity: 0.8,
          blendMode: 'screen',
          startTime: 1,
          duration: 8,
          settings: { particleCount: 50, color: '#9d4edd', size: 3 }
        },
        {
          id: 'text',
          name: 'Title Text',
          type: 'motion-graphics',
          enabled: true,
          opacity: 1,
          blendMode: 'normal',
          startTime: 2,
          duration: 6,
          settings: { type: 'text', text: 'VFX Preview', color: '#ffffff', scale: 1.2 }
        }
      ];
      setLayers(sampleLayers);
    }
  }, []);

  // Update total duration based on layers
  useEffect(() => {
    const maxDuration = Math.max(...layers.map(layer => layer.startTime + layer.duration), 10);
    setTotalDuration(maxDuration);
  }, [layers]);

  // Time control
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1 / previewSettings.frameRate;
          return next >= totalDuration ? 0 : next;
        });
      }, 1000 / previewSettings.frameRate);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, previewSettings.frameRate, totalDuration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
  };

  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
  };

  const handleLayerBlendModeChange = (layerId: string, blendMode: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, blendMode }
        : layer
    ));
  };

  const handleResolutionChange = (preset: string) => {
    const resolution = resolutionPresets.find(p => p.name === preset);
    if (resolution) {
      setPreviewSettings(prev => ({
        ...prev,
        resolution: { width: resolution.width, height: resolution.height }
      }));
    }
  };

  const handleExport = () => {
    const exportData = {
      layers,
      settings: previewSettings,
      duration: totalDuration,
      timestamp: new Date().toISOString()
    };
    onExport?.(exportData);
  };

  useEffect(() => {
    onLayersChange?.(layers);
  }, [layers, onLayersChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🎬</span>
              VFX Preview System
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLayerPanel(!showLayerPanel)}
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Preview Area */}
            <div className="lg:col-span-3 space-y-4">
              <PreviewRenderer
                layers={layers}
                settings={previewSettings}
                isPlaying={isPlaying}
                currentTime={currentTime}
              />
              
              {/* Timeline */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>{totalDuration.toFixed(1)}s</span>
                </div>
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => setCurrentTime(value)}
                  min={0}
                  max={totalDuration}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              {/* Controls */}
              <div className="flex justify-center gap-2">
                <Button onClick={handlePlayPause} className="flex items-center gap-2">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Layer Panel */}
            {showLayerPanel && (
              <div className="space-y-4">
                <h3 className="font-semibold">Camadas</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {layers.map(layer => (
                    <Card key={layer.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{layer.name}</span>
                          <Switch
                            checked={layer.enabled}
                            onCheckedChange={() => handleLayerToggle(layer.id)}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">
                            Opacidade: {(layer.opacity * 100).toFixed(0)}%
                          </label>
                          <Slider
                            value={[layer.opacity]}
                            onValueChange={([value]) => handleLayerOpacityChange(layer.id, value)}
                            min={0}
                            max={1}
                            step={0.01}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">Blend Mode</label>
                          <Select
                            value={layer.blendMode}
                            onValueChange={(value) => handleLayerBlendModeChange(layer.id, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {blendModes.map(mode => (
                                <SelectItem key={mode} value={mode} className="text-xs">
                                  {mode}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {layer.startTime}s - {layer.startTime + layer.duration}s
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resolution" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resolution">Resolução</TabsTrigger>
              <TabsTrigger value="quality">Qualidade</TabsTrigger>
              <TabsTrigger value="display">Exibição</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resolution" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preset de Resolução</label>
                <Select onValueChange={handleResolutionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma resolução" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionPresets.map(preset => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name} ({preset.width}x{preset.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Largura</label>
                  <input
                    type="number"
                    value={previewSettings.resolution.width}
                    onChange={(e) => setPreviewSettings(prev => ({
                      ...prev,
                      resolution: { ...prev.resolution, width: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Altura</label>
                  <input
                    type="number"
                    value={previewSettings.resolution.height}
                    onChange={(e) => setPreviewSettings(prev => ({
                      ...prev,
                      resolution: { ...prev.resolution, height: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qualidade de Renderização</label>
                <Select
                  value={previewSettings.quality}
                  onValueChange={(value: any) => setPreviewSettings(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (Rápida)</SelectItem>
                    <SelectItem value="medium">Média (Balanceada)</SelectItem>
                    <SelectItem value="high">Alta (Lenta)</SelectItem>
                    <SelectItem value="ultra">Ultra (Muito Lenta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Frame Rate: {previewSettings.frameRate} FPS</label>
                <Slider
                  value={[previewSettings.frameRate]}
                  onValueChange={([value]) => setPreviewSettings(prev => ({ ...prev, frameRate: value }))}
                  min={15}
                  max={60}
                  step={1}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={previewSettings.realTimeUpdates}
                  onCheckedChange={(checked) => setPreviewSettings(prev => ({ ...prev, realTimeUpdates: checked }))}
                  id="real-time"
                />
                <label htmlFor="real-time" className="text-sm">Atualizações em Tempo Real</label>
              </div>
            </TabsContent>
            
            <TabsContent value="display" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={previewSettings.showGrid}
                  onCheckedChange={(checked) => setPreviewSettings(prev => ({ ...prev, showGrid: checked }))}
                  id="show-grid"
                />
                <label htmlFor="show-grid" className="text-sm">Mostrar Grade</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={previewSettings.showSafeZones}
                  onCheckedChange={(checked) => setPreviewSettings(prev => ({ ...prev, showSafeZones: checked }))}
                  id="show-safe-zones"
                />
                <label htmlFor="show-safe-zones" className="text-sm">Mostrar Zonas Seguras</label>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor de Fundo</label>
                <input
                  type="color"
                  value={previewSettings.backgroundColor}
                  onChange={(e) => setPreviewSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-full h-10 rounded border"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VFXPreviewSystem;