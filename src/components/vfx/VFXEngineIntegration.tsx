import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Layers,
  Play,
  Pause,
  Square,
  Settings,
  Download,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  FolderOpen,
  Zap,
  Sparkles,
  Film,
  Palette,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { toast } from 'sonner';

// Import VFX components
import { GSAPAnimations } from './GSAPAnimations';
import { ThreeJSParticles } from './ThreeJSParticles';
import { GreenScreenIntegration } from './GreenScreenIntegration';
import { TemplateMotionGraphics } from './TemplateMotionGraphics';
import { VFXPreviewSystem } from './VFXPreviewSystem';
import { VFXConfigInterface } from './VFXConfigInterface';
import { VFXVideoExporter } from './VFXVideoExporter';

// Import existing components (assuming they exist)
// import { VideoEditor } from '../video/VideoEditor';
// import { AudioMixer } from '../audio/AudioMixer';
// import { AssetLibrary } from '../assets/AssetLibrary';

interface VFXLayer {
  id: string;
  name: string;
  type: 'gsap' | 'particles' | 'greenscreen' | 'motion-graphics';
  enabled: boolean;
  opacity: number;
  blendMode: string;
  startTime: number;
  duration: number;
  zIndex: number;
  settings: any;
  thumbnail?: string;
}

interface VFXProject {
  id: string;
  name: string;
  description: string;
  layers: VFXLayer[];
  globalSettings: {
    resolution: { width: number; height: number };
    frameRate: number;
    duration: number;
    backgroundColor: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author: string;
  };
}

interface VFXEngineIntegrationProps {
  // Integration with existing video editor
  videoProject?: {
    id: string;
    timeline: any[];
    assets: any[];
  };
  // Integration with audio system
  audioTracks?: {
    id: string;
    name: string;
    url: string;
    volume: number;
  }[];
  // Callbacks for pipeline integration
  onProjectUpdate?: (project: VFXProject) => void;
  onExportComplete?: (videoBlob: Blob, project: VFXProject) => void;
  onAssetRequest?: (type: string) => void;
}

const defaultProject: VFXProject = {
  id: 'vfx-project-1',
  name: 'Novo Projeto VFX',
  description: 'Projeto de efeitos visuais',
  layers: [],
  globalSettings: {
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    duration: 10,
    backgroundColor: '#000000'
  },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    author: 'Studio Treiax'
  }
};

const layerTemplates = [
  {
    type: 'gsap',
    name: 'Animação GSAP',
    icon: Zap,
    description: 'Animações suaves e profissionais',
    defaultSettings: {
      animation: 'fadeIn',
      duration: 2,
      easing: 'power2.out',
      color: '#ff6b35'
    }
  },
  {
    type: 'particles',
    name: 'Efeitos de Partículas',
    icon: Sparkles,
    description: 'Efeitos especiais com partículas',
    defaultSettings: {
      effectType: 'sparkles',
      particleCount: 100,
      size: 2,
      speed: 1,
      color: '#9d4edd'
    }
  },
  {
    type: 'greenscreen',
    name: 'Green Screen',
    icon: Film,
    description: 'Composição com chroma key',
    defaultSettings: {
      threshold: 0.4,
      smoothness: 0.1,
      spill: 0.1,
      keyColor: '#00ff00'
    }
  },
  {
    type: 'motion-graphics',
    name: 'Motion Graphics',
    icon: Palette,
    description: 'Elementos gráficos animados',
    defaultSettings: {
      text: 'Motion Graphics',
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#ffffff',
      scale: 1
    }
  }
];

const devicePresets = [
  { name: 'Desktop', icon: Monitor, width: 1920, height: 1080 },
  { name: 'Tablet', icon: Tablet, width: 1024, height: 768 },
  { name: 'Mobile', icon: Smartphone, width: 375, height: 667 }
];

export const VFXEngineIntegration: React.FC<VFXEngineIntegrationProps> = ({
  videoProject,
  audioTracks = [],
  onProjectUpdate,
  onExportComplete,
  onAssetRequest
}) => {
  const [project, setProject] = useState<VFXProject>(defaultProject);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('layers');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync with video project if provided
  useEffect(() => {
    if (videoProject) {
      setProject(prev => ({
        ...prev,
        id: videoProject.id,
        name: `VFX - ${videoProject.id}`,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date()
        }
      }));
    }
  }, [videoProject]);

  // Auto-save project changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onProjectUpdate?.(project);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [project, onProjectUpdate]);

  const updateProject = useCallback((updates: Partial<VFXProject>) => {
    setProject(prev => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);

  const updateGlobalSettings = useCallback((settings: Partial<VFXProject['globalSettings']>) => {
    setProject(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        ...settings
      },
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);

  const addLayer = useCallback((type: VFXLayer['type']) => {
    const template = layerTemplates.find(t => t.type === type);
    if (!template) return;

    const newLayer: VFXLayer = {
      id: `layer-${Date.now()}`,
      name: `${template.name} ${project.layers.length + 1}`,
      type,
      enabled: true,
      opacity: 1,
      blendMode: 'normal',
      startTime: 0,
      duration: project.globalSettings.duration,
      zIndex: project.layers.length,
      settings: { ...template.defaultSettings }
    };

    setProject(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));

    setSelectedLayer(newLayer.id);
    toast.success(`Layer ${template.name} adicionada`);
  }, [project.layers.length, project.globalSettings.duration]);

  const updateLayer = useCallback((layerId: string, updates: Partial<VFXLayer>) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, ...updates }
          : layer
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setProject(prev => ({
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

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = project.layers.find(l => l.id === layerId);
    if (!layer) return;

    const duplicatedLayer: VFXLayer = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} (Cópia)`,
      zIndex: project.layers.length
    };

    setProject(prev => ({
      ...prev,
      layers: [...prev.layers, duplicatedLayer],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));

    toast.success('Layer duplicada');
  }, [project.layers]);

  const reorderLayers = useCallback((dragIndex: number, hoverIndex: number) => {
    setProject(prev => {
      const dragLayer = prev.layers[dragIndex];
      const newLayers = [...prev.layers];
      newLayers.splice(dragIndex, 1);
      newLayers.splice(hoverIndex, 0, dragLayer);
      
      // Update z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = index;
      });

      return {
        ...prev,
        layers: newLayers,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date()
        }
      };
    });
  }, []);

  const startPlayback = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    startTimeRef.current = Date.now() - currentTime * 1000;
    
    const updateTime = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      if (elapsed >= project.globalSettings.duration) {
        setCurrentTime(0);
        setIsPlaying(false);
        return;
      }
      
      setCurrentTime(elapsed);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying, currentTime, project.globalSettings.duration]);

  const pausePlayback = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const saveProject = useCallback(async () => {
    try {
      // In a real implementation, this would save to a backend or local storage
      const projectData = JSON.stringify(project, null, 2);
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.vfx.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Projeto salvo com sucesso!');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Erro ao salvar projeto');
    }
  }, [project]);

  const loadProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        setProject({
          ...projectData,
          metadata: {
            ...projectData.metadata,
            updatedAt: new Date()
          }
        });
        toast.success('Projeto carregado com sucesso!');
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Erro ao carregar projeto');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExportComplete = useCallback((videoBlob: Blob, settings: any) => {
    onExportComplete?.(videoBlob, project);
    setIsExporting(false);
  }, [onExportComplete, project]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPreset = devicePresets.find(p => p.name.toLowerCase() === previewMode);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">VFX Engine</h1>
            <Badge variant="outline">{project.name}</Badge>
            <Badge variant="secondary">v{project.metadata.version}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Playback Controls */}
            <div className="flex items-center gap-1 mr-4">
              <Button
                size="sm"
                variant="outline"
                onClick={isPlaying ? pausePlayback : startPlayback}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={resetPlayback}>
                <Square className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Audio Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            {/* Device Preview */}
            <div className="flex items-center gap-1">
              {devicePresets.map(preset => {
                const Icon = preset.icon;
                return (
                  <Button
                    key={preset.name}
                    size="sm"
                    variant={previewMode === preset.name.toLowerCase() ? "default" : "outline"}
                    onClick={() => setPreviewMode(preset.name.toLowerCase() as any)}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Project Actions */}
            <Button size="sm" variant="outline" onClick={saveProject}>
              <Save className="w-4 h-4" />
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={loadProject}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button size="sm" variant="outline">
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(project.globalSettings.duration)}</span>
          </div>
          <Progress 
            value={(currentTime / project.globalSettings.duration) * 100} 
            className="h-2"
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers and Tools */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
              <TabsTrigger value="settings">Config</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Adicionar Layer</h3>
                <div className="grid grid-cols-2 gap-2">
                  {layerTemplates.map(template => {
                    const Icon = template.icon;
                    return (
                      <Button
                        key={template.type}
                        size="sm"
                        variant="outline"
                        onClick={() => addLayer(template.type as VFXLayer['type'])}
                        className="h-auto p-3 flex flex-col items-center gap-1"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{template.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Layers ({project.layers.length})</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {project.layers
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map(layer => {
                      const template = layerTemplates.find(t => t.type === layer.type);
                      const Icon = template?.icon || Layers;
                      
                      return (
                        <div
                          key={layer.id}
                          className={`p-2 border rounded cursor-pointer transition-colors ${
                            selectedLayer === layer.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedLayer(layer.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
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
                                  updateLayer(layer.id, { enabled: !layer.enabled });
                                }}
                              >
                                {layer.enabled ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-1 text-xs text-gray-500">
                            {formatTime(layer.startTime)} - {formatTime(layer.startTime + layer.duration)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="flex-1 p-4">
              {selectedLayer ? (
                <VFXConfigInterface
                  layer={project.layers.find(l => l.id === selectedLayer)!}
                  onLayerUpdate={(updates) => updateLayer(selectedLayer, updates)}
                />
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Selecione uma layer para configurar efeitos</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 p-4 space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Configurações Globais</h3>
                
                <div className="space-y-2">
                  <Label>Nome do Projeto</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => updateProject({ name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Resolução</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Largura"
                      value={project.globalSettings.resolution.width}
                      onChange={(e) => updateGlobalSettings({
                        resolution: {
                          ...project.globalSettings.resolution,
                          width: parseInt(e.target.value)
                        }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Altura"
                      value={project.globalSettings.resolution.height}
                      onChange={(e) => updateGlobalSettings({
                        resolution: {
                          ...project.globalSettings.resolution,
                          height: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Frame Rate</Label>
                  <Input
                    type="number"
                    value={project.globalSettings.frameRate}
                    onChange={(e) => updateGlobalSettings({ frameRate: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Duração (segundos)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={project.globalSettings.duration}
                    onChange={(e) => updateGlobalSettings({ duration: parseFloat(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <input
                    type="color"
                    value={project.globalSettings.backgroundColor}
                    onChange={(e) => updateGlobalSettings({ backgroundColor: e.target.value })}
                    className="w-full h-10 rounded border"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                    id="show-grid"
                  />
                  <Label htmlFor="show-grid">Mostrar Grade</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showSafeArea}
                    onCheckedChange={setShowSafeArea}
                    id="show-safe-area"
                  />
                  <Label htmlFor="show-safe-area">Área Segura</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Center - Preview */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="flex-1 flex items-center justify-center p-8">
            <div 
              className="bg-white rounded-lg shadow-lg overflow-hidden"
              style={{
                width: currentPreset ? `${Math.min(currentPreset.width * 0.5, 800)}px` : '800px',
                height: currentPreset ? `${Math.min(currentPreset.height * 0.5, 450)}px` : '450px'
              }}
            >
              <VFXPreviewSystem
                layers={project.layers}
                currentTime={currentTime}
                globalSettings={project.globalSettings}
                showGrid={showGrid}
                showSafeArea={showSafeArea}
              />
            </div>
          </div>
          
          {/* Preview Controls */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {currentPreset?.width}x{currentPreset?.height}
                </span>
                <span className="text-sm text-gray-600">
                  {project.globalSettings.frameRate} FPS
                </span>
                <span className="text-sm text-gray-600">
                  {project.layers.filter(l => l.enabled).length} layers ativas
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssetRequest?.('video')}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Assets
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Export */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="p-4">
            <h3 className="font-medium mb-4">Exportação</h3>
            
            <VFXVideoExporter
              layers={project.layers}
              globalSettings={project.globalSettings}
              onExportComplete={handleExportComplete}
              onExportError={(error) => {
                console.error('Export error:', error);
                toast.error('Erro na exportação');
                setIsExporting(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VFXEngineIntegration;