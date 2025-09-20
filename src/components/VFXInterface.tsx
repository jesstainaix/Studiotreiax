import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Download,
  Upload,
  Settings,
  Layers,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  Palette,
  Film,
  Monitor,
  Cpu,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import {
  vfxSystem,
  VFXSystem,
  VFXEffect,
  VFXTransition,
  VFXComposition,
  VFXLayer,
  VFXPreset,
  VFXCategory,
  VFXEffectType,
  TransitionType,
  BlendMode,
  LayerType,
  RenderSettings
} from '../systems/VFXSystem';

// Interfaces
interface VFXInterfaceProps {
  onClose?: () => void;
}

interface EffectControlProps {
  effect: VFXEffect;
  onUpdate: (effectId: string, paramId: string, value: any) => void;
}

interface LayerItemProps {
  layer: VFXLayer;
  isSelected: boolean;
  onSelect: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onDelete: (layerId: string) => void;
}

interface RenderProgressProps {
  isRendering: boolean;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  onCancel: () => void;
}

// Componentes auxiliares
const EffectControl = React.memo<EffectControlProps>(({ effect, onUpdate }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{effect.name}</CardTitle>
          <Badge variant="secondary">{effect.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {effect.parameters.map((param) => (
          <div key={param.id} className="space-y-2">
            <Label className="text-xs">{param.name}</Label>
            {param.type === 'range' && (
              <div className="space-y-1">
                <Slider
                  value={[param.value]}
                  onValueChange={([value]) => onUpdate(effect.id, param.id, value)}
                  min={param.min || 0}
                  max={param.max || 100}
                  step={param.step || 1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{param.min || 0}</span>
                  <span>{param.value}</span>
                  <span>{param.max || 100}</span>
                </div>
              </div>
            )}
            {param.type === 'color' && (
              <Input
                type="color"
                value={param.value}
                onChange={(e) => onUpdate(effect.id, param.id, e.target.value)}
                className="w-full h-8"
              />
            )}
            {param.type === 'select' && (
              <Select
                value={param.value}
                onValueChange={(value) => onUpdate(effect.id, param.id, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {param.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {param.type === 'number' && (
              <Input
                type="number"
                value={param.value}
                onChange={(e) => onUpdate(effect.id, param.id, parseFloat(e.target.value))}
                min={param.min}
                max={param.max}
                step={param.step}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

const LayerItem = React.memo<LayerItemProps>(({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete
}) => {
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      }`}
      onClick={() => onSelect(layer.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {layer.type}
          </Badge>
          <span className="font-medium text-sm">{layer.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
          >
            {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(layer.id);
            }}
          >
            {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(layer.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Opacity: {Math.round(layer.opacity * 100)}% | Blend: {layer.blendMode}
      </div>
      {layer.effects.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground mb-1">Effects:</div>
          <div className="flex flex-wrap gap-1">
            {layer.effects.map((effect) => (
              <Badge key={effect.id} variant="secondary" className="text-xs">
                {effect.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const RenderProgress = React.memo<RenderProgressProps>(({
  isRendering,
  progress,
  currentFrame,
  totalFrames,
  onCancel
}) => {
  if (!isRendering) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Rendering...</CardTitle>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress * 100} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Frame {currentFrame} of {totalFrames}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente principal
const VFXInterface = React.memo<VFXInterfaceProps>(({ onClose }) => {
  const [system, setSystem] = useState<VFXSystem | null>(null);
  const [currentComposition, setCurrentComposition] = useState<VFXComposition | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [availableEffects, setAvailableEffects] = useState<VFXEffect[]>([]);
  const [availableTransitions, setAvailableTransitions] = useState<VFXTransition[]>([]);
  const [availablePresets, setAvailablePresets] = useState<VFXPreset[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [renderProgress, setRenderProgress] = useState({
    isRendering: false,
    progress: 0,
    currentFrame: 0,
    totalFrames: 0
  });
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    quality: 'high',
    format: 'mp4',
    codec: 'h264',
    bitrate: 8000,
    frameRate: 30,
    resolution: { width: 1920, height: 1080 },
    enableGPU: true,
    multiThreading: true,
    outputPath: './renders'
  });
  const [selectedCategory, setSelectedCategory] = useState<VFXCategory>(VFXCategory.BASIC);
  const [selectedEffectType, setSelectedEffectType] = useState<VFXEffectType>(VFXEffectType.BLUR);
  
  const previewRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    initializeVFXSystem();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const initializeVFXSystem = async () => {
    try {
      await vfxSystem.initialize();
      setSystem(vfxSystem);
      
      // Carregar dados
      setAvailableEffects(vfxSystem.getAllEffects());
      setAvailableTransitions(vfxSystem.getAllTransitions());
      setAvailablePresets(vfxSystem.getAllPresets());
      
      // Criar composição padrão
      const defaultComposition = vfxSystem.createComposition('New Composition', {
        duration: 10,
        resolution: { width: 1920, height: 1080 },
        frameRate: 30
      });
      setCurrentComposition(defaultComposition);
      
      // Setup event listeners
      vfxSystem.on('renderProgress', handleRenderProgress);
      vfxSystem.on('renderCompleted', handleRenderCompleted);
      vfxSystem.on('renderError', handleRenderError);
      
      toast.success('VFX System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VFX System:', error);
      toast.error('Failed to initialize VFX System');
    }
  };

  const handleRenderProgress = (data: any) => {
    setRenderProgress({
      isRendering: true,
      progress: data.progress,
      currentFrame: data.frame,
      totalFrames: data.totalFrames
    });
  };

  const handleRenderCompleted = (data: any) => {
    setRenderProgress({
      isRendering: false,
      progress: 1,
      currentFrame: 0,
      totalFrames: 0
    });
    toast.success(`Render completed: ${data.outputPath}`);
  };

  const handleRenderError = (data: any) => {
    setRenderProgress({
      isRendering: false,
      progress: 0,
      currentFrame: 0,
      totalFrames: 0
    });
    toast.error(`Render failed: ${data.error.message}`);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      startPreview();
    } else {
      stopPreview();
    }
  };

  const startPreview = () => {
    const animate = () => {
      if (currentComposition && isPlaying) {
        setCurrentTime(prev => {
          const newTime = prev + 1 / 30; // 30 FPS
          return newTime >= currentComposition.duration ? 0 : newTime;
        });
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animate();
  };

  const stopPreview = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleAddLayer = (type: LayerType) => {
    if (!system || !currentComposition) return;
    
    const newLayer = system.addLayer(currentComposition.id, {
      name: `${type} Layer`,
      type,
      effects: [],
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: { x: 0.5, y: 0.5 }
      },
      opacity: 1,
      blendMode: BlendMode.NORMAL,
      visible: true,
      locked: false,
      startTime: 0,
      duration: currentComposition.duration
    });
    
    if (newLayer) {
      setCurrentComposition({ ...currentComposition });
      setSelectedLayer(newLayer.id);
      toast.success(`${type} layer added`);
    }
  };

  const handleApplyEffect = (effectId: string) => {
    if (!system || !currentComposition || !selectedLayer) {
      toast.error('Please select a layer first');
      return;
    }
    
    const success = system.applyEffectToLayer(currentComposition.id, selectedLayer, effectId);
    if (success) {
      setCurrentComposition({ ...currentComposition });
      toast.success('Effect applied successfully');
    } else {
      toast.error('Failed to apply effect');
    }
  };

  const handleUpdateEffectParameter = (effectId: string, paramId: string, value: any) => {
    if (!currentComposition || !selectedLayer) return;
    
    const layer = currentComposition.layers.find(l => l.id === selectedLayer);
    if (!layer) return;
    
    const effect = layer.effects.find(e => e.id === effectId);
    if (!effect) return;
    
    const param = effect.parameters.find(p => p.id === paramId);
    if (param) {
      param.value = value;
      setCurrentComposition({ ...currentComposition });
    }
  };

  const handleRender = async () => {
    if (!system || !currentComposition) return;
    
    try {
      setRenderProgress({ ...renderProgress, isRendering: true });
      await system.renderComposition(currentComposition.id, renderSettings);
    } catch (error) {
      console.error('Render failed:', error);
    }
  };

  const handleLayerToggleVisibility = (layerId: string) => {
    if (!system || !currentComposition) return;
    
    const layer = currentComposition.layers.find(l => l.id === layerId);
    if (layer) {
      system.updateLayer(currentComposition.id, layerId, { visible: !layer.visible });
      setCurrentComposition({ ...currentComposition });
    }
  };

  const handleLayerToggleLock = (layerId: string) => {
    if (!system || !currentComposition) return;
    
    const layer = currentComposition.layers.find(l => l.id === layerId);
    if (layer) {
      system.updateLayer(currentComposition.id, layerId, { locked: !layer.locked });
      setCurrentComposition({ ...currentComposition });
    }
  };

  const handleLayerDelete = (layerId: string) => {
    if (!system || !currentComposition) return;
    
    system.removeLayer(currentComposition.id, layerId);
    setCurrentComposition({ ...currentComposition });
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
    toast.success('Layer deleted');
  };

  const filteredEffects = availableEffects.filter(effect => 
    effect.category === selectedCategory && effect.type === selectedEffectType
  );

  const selectedLayerData = currentComposition?.layers.find(l => l.id === selectedLayer);

  if (!system || !currentComposition) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p>Initializing VFX System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              VFX Studio
            </h2>
            <Badge variant="outline">{currentComposition.name}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Effects & Layers */}
        <div className="w-80 border-r flex flex-col">
          <Tabs defaultValue="effects" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="effects" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value as VFXCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(VFXCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={selectedEffectType}
                    onValueChange={(value) => setSelectedEffectType(value as VFXEffectType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(VFXEffectType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredEffects.map((effect) => (
                      <Card key={effect.id} className="cursor-pointer hover:bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{effect.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {effect.metadata.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleApplyEffect(effect.id)}
                              disabled={!selectedLayer}
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="layers" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddLayer(LayerType.VIDEO)}
                  >
                    <Film className="h-3 w-3 mr-1" />
                    Video
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddLayer(LayerType.TEXT)}
                  >
                    Text
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddLayer(LayerType.SHAPE)}
                  >
                    Shape
                  </Button>
                </div>
                
                <Separator />
                
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {currentComposition.layers.map((layer) => (
                      <LayerItem
                        key={layer.id}
                        layer={layer}
                        isSelected={selectedLayer === layer.id}
                        onSelect={setSelectedLayer}
                        onToggleVisibility={handleLayerToggleVisibility}
                        onToggleLock={handleLayerToggleLock}
                        onDelete={handleLayerDelete}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="presets" className="flex-1 p-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {availablePresets.map((preset) => (
                    <Card key={preset.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{preset.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {preset.description}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {preset.category}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (system.applyPreset(currentComposition.id, preset.id)) {
                                setCurrentComposition({ ...currentComposition });
                                toast.success('Preset applied');
                              }
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 bg-black relative">
            <canvas
              ref={previewRef}
              className="w-full h-full object-contain"
              width={currentComposition.resolution.width}
              height={currentComposition.resolution.height}
            />
            
            {/* Preview Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setCurrentTime(0)}>
                  <SkipBack className="h-3 w-3" />
                </Button>
                <Button size="sm" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsPlaying(false)}>
                  <Square className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCurrentTime(currentComposition.duration)}>
                  <SkipForward className="h-3 w-3" />
                </Button>
                <div className="text-xs text-muted-foreground ml-2">
                  {currentTime.toFixed(2)}s / {currentComposition.duration}s
                </div>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="h-32 border-t bg-muted/30 p-4">
            <div className="h-full bg-background rounded border">
              <div className="p-2 text-xs text-muted-foreground">
                Timeline - {currentComposition.frameRate} FPS
              </div>
              {/* Timeline implementation would go here */}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Properties
            </h3>
          </div>
          
          <ScrollArea className="h-96">
            <div className="p-4 space-y-4">
              {/* Render Progress */}
              <RenderProgress
                isRendering={renderProgress.isRendering}
                progress={renderProgress.progress}
                currentFrame={renderProgress.currentFrame}
                totalFrames={renderProgress.totalFrames}
                onCancel={() => setRenderProgress({ ...renderProgress, isRendering: false })}
              />
              
              {/* Render Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Render Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Quality</Label>
                      <Select
                        value={renderSettings.quality}
                        onValueChange={(value: any) => setRenderSettings({ ...renderSettings, quality: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="preview">Preview</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="ultra">Ultra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Format</Label>
                      <Select
                        value={renderSettings.format}
                        onValueChange={(value: any) => setRenderSettings({ ...renderSettings, format: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp4">MP4</SelectItem>
                          <SelectItem value="mov">MOV</SelectItem>
                          <SelectItem value="avi">AVI</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={renderSettings.enableGPU}
                      onChange={(e) => setRenderSettings({ ...renderSettings, enableGPU: e.target.checked })}
                    />
                    <Label className="text-xs">GPU Acceleration</Label>
                  </div>
                  
                  <Button
                    onClick={handleRender}
                    disabled={renderProgress.isRendering}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {renderProgress.isRendering ? 'Rendering...' : 'Render'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Layer Effects */}
              {selectedLayerData && selectedLayerData.effects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Layer Effects</h4>
                  {selectedLayerData.effects.map((effect) => (
                    <EffectControl
                      key={effect.id}
                      effect={effect}
                      onUpdate={handleUpdateEffectParameter}
                    />
                  ))}
                </div>
              )}
              
              {/* System Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    System Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>GPU:</span>
                    <span className={renderSettings.enableGPU ? 'text-green-500' : 'text-red-500'}>
                      {renderSettings.enableGPU ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Layers:</span>
                    <span>{currentComposition.layers.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Effects:</span>
                    <span>{currentComposition.layers.reduce((acc, layer) => acc + layer.effects.length, 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Duration:</span>
                    <span>{currentComposition.duration}s</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
});

export default VFXInterface;