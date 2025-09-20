import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Upload,
  Save,
  FolderOpen,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Move,
  RotateCcw,
  Zap,
  Sparkles,
  Palette,
  Film,
  Layers,
  Grid,
  Monitor,
  Smartphone,
  Tablet,
  Maximize,
  Minimize,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AdvancedVFXEngine,
  VFXComposition,
  VFXLayer,
  VFXEffect,
  VFXEffectFactory,
  VFXUtils,
  RenderSettings,
  BlendMode
} from '../../services/AdvancedVFXEngine';

interface AdvancedVFXInterfaceProps {
  onExport?: (videoBlob: Blob, composition: VFXComposition) => void;
  onSave?: (composition: VFXComposition) => void;
  initialComposition?: VFXComposition;
}

interface EffectTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<any>;
  factory: () => VFXEffect;
  preview?: string;
}

const effectTemplates: EffectTemplate[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    category: 'Transições',
    description: 'Transição suave de entrada',
    icon: Zap,
    factory: () => VFXEffectFactory.createFadeTransition(1)
  },
  {
    id: 'particle-explosion',
    name: 'Explosão',
    category: 'Partículas',
    description: 'Efeito de explosão com partículas',
    icon: Sparkles,
    factory: () => VFXEffectFactory.createParticleExplosion(1)
  },
  {
    id: 'glow-effect',
    name: 'Glow',
    category: 'Iluminação',
    description: 'Efeito de brilho e luminosidade',
    icon: Palette,
    factory: () => VFXEffectFactory.createGlowEffect('#ffffff', 1)
  },
  {
    id: 'wave-distortion',
    name: 'Onda',
    category: 'Distorção',
    description: 'Distorção em forma de onda',
    icon: Film,
    factory: () => VFXEffectFactory.createDistortionWave(1)
  },
  {
    id: 'color-grading',
    name: 'Correção de Cor',
    category: 'Cor',
    description: 'Ajuste de temperatura e saturação',
    icon: Palette,
    factory: () => VFXEffectFactory.createColorGrading(0, 0, 1)
  }
];

const blendModes: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
  'color-dodge', 'color-burn', 'darken', 'lighten', 'difference',
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

const devicePresets = [
  { name: 'Desktop', icon: Monitor, width: 1920, height: 1080 },
  { name: 'Tablet', icon: Tablet, width: 1024, height: 768 },
  { name: 'Mobile', icon: Smartphone, width: 375, height: 667 }
];

export const AdvancedVFXInterface: React.FC<AdvancedVFXInterfaceProps> = ({
  onExport,
  onSave,
  initialComposition
}) => {
  const [composition, setComposition] = useState<VFXComposition>(
    initialComposition || VFXUtils.createDefaultComposition()
  );
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');
  const [previewMode, setPreviewMode] = useState('Desktop');
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const vfxEngineRef = useRef<AdvancedVFXEngine | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Inicializar engine VFX
  useEffect(() => {
    if (canvasRef.current && webglCanvasRef.current && !vfxEngineRef.current) {
      vfxEngineRef.current = new AdvancedVFXEngine(canvasRef.current, webglCanvasRef.current);
      vfxEngineRef.current.loadComposition(composition);
    }

    return () => {
      if (vfxEngineRef.current) {
        vfxEngineRef.current.dispose();
      }
    };
  }, []);

  // Atualizar composição no engine
  useEffect(() => {
    if (vfxEngineRef.current) {
      vfxEngineRef.current.loadComposition(composition);
    }
  }, [composition]);

  // Auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSave?.(composition);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [composition, onSave]);

  const updateComposition = useCallback((updates: Partial<VFXComposition>) => {
    setComposition(prev => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);

  const addLayer = useCallback((type: VFXLayer['type']) => {
    const newLayer = VFXUtils.createDefaultLayer(type, `${type} Layer ${composition.layers.length + 1}`);
    newLayer.zIndex = composition.layers.length;
    
    setComposition(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    setSelectedLayer(newLayer.id);
    toast.success(`Layer ${type} adicionada`);
  }, [composition.layers.length]);

  const updateLayer = useCallback((layerId: string, updates: Partial<VFXLayer>) => {
    setComposition(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setComposition(prev => ({
      ...prev,
      layers: prev.layers.filter(layer => layer.id !== layerId),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
    
    toast.success('Layer removida');
  }, [selectedLayer]);

  const addEffect = useCallback((template: EffectTemplate) => {
    if (!selectedLayer) {
      toast.error('Selecione uma layer primeiro');
      return;
    }
    
    const effect = template.factory();
    effect.startTime = currentTime;
    effect.endTime = currentTime + effect.duration;
    
    updateLayer(selectedLayer, {
      effects: [...(composition.layers.find(l => l.id === selectedLayer)?.effects || []), effect]
    });
    
    setSelectedEffect(effect.id);
    toast.success(`Efeito ${template.name} adicionado`);
  }, [selectedLayer, currentTime, composition.layers, updateLayer]);

  const updateEffect = useCallback((layerId: string, effectId: string, updates: Partial<VFXEffect>) => {
    const layer = composition.layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const updatedEffects = layer.effects.map(effect => 
      effect.id === effectId ? { ...effect, ...updates } : effect
    );
    
    updateLayer(layerId, { effects: updatedEffects });
  }, [composition.layers, updateLayer]);

  const removeEffect = useCallback((layerId: string, effectId: string) => {
    const layer = composition.layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const updatedEffects = layer.effects.filter(effect => effect.id !== effectId);
    updateLayer(layerId, { effects: updatedEffects });
    
    if (selectedEffect === effectId) {
      setSelectedEffect(null);
    }
    
    toast.success('Efeito removido');
  }, [composition.layers, updateLayer, selectedEffect]);

  const handlePlay = useCallback(() => {
    if (vfxEngineRef.current) {
      if (isPlaying) {
        vfxEngineRef.current.pause();
      } else {
        vfxEngineRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    if (vfxEngineRef.current) {
      vfxEngineRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (vfxEngineRef.current) {
      vfxEngineRef.current.seekTo(time);
      setCurrentTime(time);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!vfxEngineRef.current) {
      toast.error('Engine VFX não inicializado');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const settings: RenderSettings = {
        quality: 'high',
        format: 'mp4',
        codec: 'h264',
        bitrate: 8000,
        resolution: { width: composition.width, height: composition.height },
        frameRate: composition.frameRate,
        audioQuality: 192,
        enableGPUAcceleration: true,
        multiThreading: true
      };
      
      const videoBlob = await vfxEngineRef.current.exportVideo(settings);
      onExport?.(videoBlob, composition);
      
      toast.success('Vídeo exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar vídeo:', error);
      toast.error('Erro ao exportar vídeo');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [composition, onExport]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * composition.frameRate);
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const currentPreset = devicePresets.find(p => p.name === previewMode);
  const selectedLayerData = composition.layers.find(l => l.id === selectedLayer);
  const selectedEffectData = selectedLayerData?.effects.find(e => e.id === selectedEffect);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">VFX Studio</h1>
            <Badge variant="outline">{composition.name}</Badge>
            <Badge variant="secondary">v{composition.metadata.version}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Playback Controls */}
            <div className="flex items-center gap-1 mr-4">
              <Button size="sm" variant="outline" onClick={() => handleSeek(0)}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handlePlay}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={handleStop}>
                <Square className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSeek(composition.duration)}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Audio Controls */}
            <div className="flex items-center gap-2 mr-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={([value]) => {
                  setVolume(value / 100);
                  setIsMuted(value === 0);
                }}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
            
            {/* Device Preview */}
            <div className="flex items-center gap-1 mr-4">
              {devicePresets.map(preset => {
                const Icon = preset.icon;
                return (
                  <Button
                    key={preset.name}
                    size="sm"
                    variant={previewMode === preset.name ? "default" : "outline"}
                    onClick={() => setPreviewMode(preset.name)}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Project Actions */}
            <Button size="sm" variant="outline" onClick={() => onSave?.(composition)}>
              <Save className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline">
              <FolderOpen className="w-4 h-4" />
            </Button>
            
            <Button 
              size="sm" 
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              {isExporting && <span className="ml-2">Exportando...</span>}
            </Button>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(composition.duration)}</span>
          </div>
          <div className="relative">
            <Progress 
              value={(currentTime / composition.duration) * 100} 
              className="h-3 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                handleSeek(percentage * composition.duration);
              }}
            />
            {isExporting && (
              <div className="absolute inset-0 bg-blue-500 opacity-30" 
                   style={{ width: `${exportProgress}%` }} />
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="settings">Config</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Layers ({composition.layers.length})</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => addLayer('video')}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {composition.layers
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map(layer => (
                        <div
                          key={layer.id}
                          className={`p-3 border rounded cursor-pointer transition-colors ${
                            selectedLayer === layer.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedLayer(layer.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              <span className="text-sm font-medium truncate">
                                {layer.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateLayer(layer.id, { visible: !layer.visible });
                                }}
                              >
                                {layer.visible ? 
                                  <Eye className="w-3 h-3" /> : 
                                  <EyeOff className="w-3 h-3" />
                                }
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateLayer(layer.id, { locked: !layer.locked });
                                }}
                              >
                                {layer.locked ? 
                                  <Lock className="w-3 h-3" /> : 
                                  <Unlock className="w-3 h-3" />
                                }
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLayer(layer.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Opacidade:</span>
                              <Slider
                                value={[layer.opacity * 100]}
                                onValueChange={([value]) => 
                                  updateLayer(layer.id, { opacity: value / 100 })
                                }
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                              <span>{Math.round(layer.opacity * 100)}%</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Blend:</span>
                              <Select
                                value={layer.blendMode}
                                onValueChange={(value: BlendMode) => 
                                  updateLayer(layer.id, { blendMode: value })
                                }
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {blendModes.map(mode => (
                                    <SelectItem key={mode} value={mode}>
                                      {mode}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {layer.effects.length > 0 && (
                              <div className="text-xs text-blue-600">
                                {layer.effects.length} efeito(s)
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="flex-1 p-4 space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Biblioteca de Efeitos</h3>
                
                {Object.entries(
                  effectTemplates.reduce((acc, template) => {
                    if (!acc[template.category]) acc[template.category] = [];
                    acc[template.category].push(template);
                    return acc;
                  }, {} as Record<string, EffectTemplate[]>)
                ).map(([category, templates]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map(template => {
                        const Icon = template.icon;
                        return (
                          <Button
                            key={template.id}
                            size="sm"
                            variant="outline"
                            onClick={() => addEffect(template)}
                            className="h-auto p-3 flex flex-col items-center gap-1"
                            disabled={!selectedLayer}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs text-center">{template.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="assets" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Assets</h3>
                <p className="text-sm text-gray-500">Biblioteca de assets em desenvolvimento...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 p-4 space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Configurações da Composição</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={composition.name}
                      onChange={(e) => updateComposition({ name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Largura</Label>
                      <Input
                        type="number"
                        value={composition.width}
                        onChange={(e) => updateComposition({ width: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Altura</Label>
                      <Input
                        type="number"
                        value={composition.height}
                        onChange={(e) => updateComposition({ height: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Frame Rate</Label>
                    <Select
                      value={composition.frameRate.toString()}
                      onValueChange={(value) => updateComposition({ frameRate: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 fps</SelectItem>
                        <SelectItem value="25">25 fps</SelectItem>
                        <SelectItem value="30">30 fps</SelectItem>
                        <SelectItem value="60">60 fps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Duração (segundos)</Label>
                    <Input
                      type="number"
                      value={composition.duration}
                      onChange={(e) => updateComposition({ duration: parseFloat(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <Label>Cor de Fundo</Label>
                    <Input
                      type="color"
                      value={composition.backgroundColor}
                      onChange={(e) => updateComposition({ backgroundColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Center - Preview */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={showGrid ? "default" : "outline"}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={showSafeArea ? "default" : "outline"}
                  onClick={() => setShowSafeArea(!showSafeArea)}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Zoom:</span>
                <Slider
                  value={[zoom]}
                  onValueChange={([value]) => setZoom(value)}
                  min={25}
                  max={200}
                  step={25}
                  className="w-20"
                />
                <span className="text-sm text-gray-600 w-12">{zoom}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative" style={{ transform: `scale(${zoom / 100})` }}>
              <canvas
                ref={canvasRef}
                width={currentPreset?.width || composition.width}
                height={currentPreset?.height || composition.height}
                className="border border-gray-300 shadow-lg bg-white"
              />
              <canvas
                ref={webglCanvasRef}
                width={currentPreset?.width || composition.width}
                height={currentPreset?.height || composition.height}
                className="absolute inset-0 pointer-events-none"
              />
              
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{
                       backgroundImage: `
                         linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                       `,
                       backgroundSize: '20px 20px'
                     }}
                />
              )}
              
              {showSafeArea && (
                <div className="absolute inset-0 border-2 border-dashed border-yellow-500 pointer-events-none"
                     style={{
                       margin: '10%'
                     }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium">Propriedades</h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {selectedLayerData ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Layer: {selectedLayerData.name}</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={selectedLayerData.name}
                        onChange={(e) => updateLayer(selectedLayerData.id, { name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label>Tempo de Início</Label>
                      <Input
                        type="number"
                        value={selectedLayerData.startTime}
                        onChange={(e) => updateLayer(selectedLayerData.id, { startTime: parseFloat(e.target.value) })}
                        step={0.1}
                      />
                    </div>
                    
                    <div>
                      <Label>Duração</Label>
                      <Input
                        type="number"
                        value={selectedLayerData.duration}
                        onChange={(e) => updateLayer(selectedLayerData.id, { duration: parseFloat(e.target.value) })}
                        step={0.1}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Transformação</h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>X</Label>
                        <Input
                          type="number"
                          value={selectedLayerData.transform.position.x}
                          onChange={(e) => updateLayer(selectedLayerData.id, {
                            transform: {
                              ...selectedLayerData.transform,
                              position: {
                                ...selectedLayerData.transform.position,
                                x: parseFloat(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Y</Label>
                        <Input
                          type="number"
                          value={selectedLayerData.transform.position.y}
                          onChange={(e) => updateLayer(selectedLayerData.id, {
                            transform: {
                              ...selectedLayerData.transform,
                              position: {
                                ...selectedLayerData.transform.position,
                                y: parseFloat(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Scale X</Label>
                        <Input
                          type="number"
                          value={selectedLayerData.transform.scale.x}
                          onChange={(e) => updateLayer(selectedLayerData.id, {
                            transform: {
                              ...selectedLayerData.transform,
                              scale: {
                                ...selectedLayerData.transform.scale,
                                x: parseFloat(e.target.value)
                              }
                            }
                          })}
                          step={0.1}
                        />
                      </div>
                      <div>
                        <Label>Scale Y</Label>
                        <Input
                          type="number"
                          value={selectedLayerData.transform.scale.y}
                          onChange={(e) => updateLayer(selectedLayerData.id, {
                            transform: {
                              ...selectedLayerData.transform,
                              scale: {
                                ...selectedLayerData.transform.scale,
                                y: parseFloat(e.target.value)
                              }
                            }
                          })}
                          step={0.1}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Rotação</Label>
                      <Input
                        type="number"
                        value={selectedLayerData.transform.rotation.z}
                        onChange={(e) => updateLayer(selectedLayerData.id, {
                          transform: {
                            ...selectedLayerData.transform,
                            rotation: {
                              ...selectedLayerData.transform.rotation,
                              z: parseFloat(e.target.value)
                            }
                          }
                        })}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
                
                {selectedLayerData.effects.length > 0 && (
                  <>
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Efeitos ({selectedLayerData.effects.length})</h4>
                      
                      <div className="space-y-2">
                        {selectedLayerData.effects.map(effect => (
                          <div
                            key={effect.id}
                            className={`p-2 border rounded cursor-pointer ${
                              selectedEffect === effect.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedEffect(effect.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{effect.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeEffect(selectedLayerData.id, effect.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="mt-1 text-xs text-gray-500">
                              {effect.category} • {effect.duration}s
                            </div>
                            
                            {selectedEffect === effect.id && (
                              <div className="mt-2 space-y-2">
                                <div>
                                  <Label className="text-xs">Intensidade</Label>
                                  <Slider
                                    value={[effect.intensity * 100]}
                                    onValueChange={([value]) => 
                                      updateEffect(selectedLayerData.id, effect.id, { intensity: value / 100 })
                                    }
                                    max={100}
                                    step={1}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <Label className="text-xs">Início</Label>
                                    <Input
                                      type="number"
                                      value={effect.startTime}
                                      onChange={(e) => 
                                        updateEffect(selectedLayerData.id, effect.id, { startTime: parseFloat(e.target.value) })
                                      }
                                      step={0.1}
                                      className="h-6 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Duração</Label>
                                    <Input
                                      type="number"
                                      value={effect.duration}
                                      onChange={(e) => {
                                        const duration = parseFloat(e.target.value);
                                        updateEffect(selectedLayerData.id, effect.id, { 
                                          duration,
                                          endTime: effect.startTime + duration
                                        });
                                      }}
                                      step={0.1}
                                      className="h-6 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Selecione uma layer para editar suas propriedades</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};