import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LayerManager, { Layer } from './LayerManager';
import HistoryPanel from './HistoryPanel';
import { EffectsPanel } from './editor/EffectsPanel';
import { ExportPanel } from './editor/ExportPanel';
import { ExportQueue } from './editor/ExportQueue';
import { useVideoEditorHistory } from '@/hooks/useHistory';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Settings, 
  Download,
  Save,
  Plus,
  Image,
  FileText,
  Sparkles,
  Users,
  Video,
  Music,
  Scissors,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Palette,
  Type,
  Mic,
  Camera,
  Zap,
  Brain,
  Shield,
  Undo,
  Redo,
  History,
  Upload,
  ZoomIn,
  ZoomOut,
  Grid,
  RotateCcw,
  Move,
  Circle,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Bot,
  Wand2,
  Layers3,
  Sparkles
} from 'lucide-react';

interface VideoEditorProps {
  projectId?: string;
  templateId?: string;
}

interface TimelineItem {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'avatar' | 'scene';
  name: string;
  duration: number;
  startTime: number;
  layer: number;
  locked: boolean;
  visible: boolean;
  properties: any;
}

interface Avatar3D {
  id: string;
  name: string;
  type: 'instructor' | 'worker' | 'supervisor' | 'engineer';
  gender: 'male' | 'female';
  thumbnail: string;
  animations: string[];
  compliance: string[];
}

interface Scene3D {
  id: string;
  name: string;
  category: string;
  environment: string;
  thumbnail: string;
  objects: string[];
  safety: string[];
}

const VideoEditor: React.FC<VideoEditorProps> = ({ projectId, templateId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutes default
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [zoom, setZoom] = useState([100]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('library');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showExportQueue, setShowExportQueue] = useState(false);
  const [appliedEffects, setAppliedEffects] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize history system with initial layers
  const initialLayers: Layer[] = [
    {
      id: 'layer-1',
      name: 'Cenário Principal',
      type: 'scene',
      visible: true,
      locked: false,
      opacity: 100,
      order: 0,
      duration: 120,
      startTime: 0,
      color: 'hsl(220, 70%, 50%)',
      items: []
    },
    {
      id: 'layer-2',
      name: 'Avatar Instrutor',
      type: 'avatar',
      visible: true,
      locked: false,
      opacity: 100,
      order: 1,
      duration: 120,
      startTime: 0,
      color: 'hsl(120, 70%, 50%)',
      items: []
    },
    {
      id: 'layer-3',
      name: 'Narração',
      type: 'audio',
      visible: true,
      locked: false,
      opacity: 100,
      volume: 80,
      muted: false,
      order: 2,
      duration: 120,
      startTime: 0,
      color: 'hsl(280, 70%, 50%)',
      items: []
    }
  ];

  const {
    layers,
    updateLayers,
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    duplicateLayer,
    undo,
    redo,
    clearHistory,
    getHistoryState,
    handleKeyDown,
    canUndo,
    canRedo,
    historySize
  } = useVideoEditorHistory(initialLayers);
  // Mock data for 3D avatars
  const avatars3D: Avatar3D[] = [
    {
      id: 'avatar-1',
      name: 'Instrutor Carlos',
      type: 'instructor',
      gender: 'male',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional_safety_instructor_3d_avatar_male&image_size=square',
      animations: ['explicar', 'apontar', 'demonstrar', 'alertar'],
      compliance: ['NR-10', 'NR-35', 'NR-06']
    },
    {
      id: 'avatar-2',
      name: 'Técnica Ana',
      type: 'engineer',
      gender: 'female',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=female_safety_engineer_3d_avatar_professional&image_size=square',
      animations: ['analisar', 'medir', 'verificar', 'documentar'],
      compliance: ['NR-10', 'NR-12', 'NR-33']
    },
    {
      id: 'avatar-3',
      name: 'Operador João',
      type: 'worker',
      gender: 'male',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=industrial_worker_3d_avatar_safety_equipment&image_size=square',
      animations: ['operar', 'inspecionar', 'sinalizar', 'evacuar'],
      compliance: ['NR-10', 'NR-35']
    }
  ];

  // Mock data for 3D scenes
  const scenes3D: Scene3D[] = [
    {
      id: 'scene-1',
      name: 'Subestação Elétrica',
      category: 'NR-10',
      environment: 'industrial',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electrical_substation_3d_scene_safety_training&image_size=landscape_16_9',
      objects: ['transformadores', 'painéis', 'cabos', 'isoladores'],
      safety: ['zona_controlada', 'epi_obrigatorio', 'alta_tensao']
    },
    {
      id: 'scene-2',
      name: 'Trabalho em Altura',
      category: 'NR-35',
      environment: 'construction',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=height_work_construction_3d_scene_safety&image_size=landscape_16_9',
      objects: ['andaimes', 'cintos', 'cordas', 'capacetes'],
      safety: ['ancoragem', 'dupla_protecao', 'resgate']
    },
    {
      id: 'scene-3',
      name: 'Espaço Confinado',
      category: 'NR-33',
      environment: 'confined',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined_space_industrial_3d_scene_safety&image_size=landscape_16_9',
      objects: ['tanques', 'dutos', 'ventiladores', 'detectores'],
      safety: ['permissao_entrada', 'monitoramento', 'vigia']
    }
  ];

  // Player controls
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeChange = (newTime: number[]) => {
    const time = newTime[0];
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Effect and transition handlers
  const handleEffectApply = (effect: any) => {
    setAppliedEffects(prev => [...prev, {
      id: `effect-${Date.now()}`,
      effect,
      layerId: selectedLayerId,
      timestamp: currentTime
    }]);
    
    // Update layer with effect
    if (selectedLayerId) {
      const updatedLayer = layers.find(l => l.id === selectedLayerId);
      if (updatedLayer) {
        updateLayer(selectedLayerId, {
          ...updatedLayer,
          effects: [...(updatedLayer.effects || []), effect]
        });
      }
    }
  };

  const handleTransitionApply = (transition: any) => {
    // Apply transition logic here
  };

  const handleEffectPreview = (effect: any) => {
    // Preview effect logic here
  };

  useEffect(() => {
    // Simular carregamento do projeto
    const loadProject = async () => {
      setIsLoading(true);
      try {
        // Aqui seria feita a chamada para carregar o projeto
        // const projectData = await projectService.getProject(projectId);
        // setProject(projectData);
        
        // Simulação temporária
        setTimeout(() => {
          setProject({
            id: projectId || '1',
            name: 'Projeto de Treinamento NR-10',
            duration: '5:30',
            status: 'Em Edição'
          });
          
          // Initialize timeline with sample items
          setTimelineItems([
            {
              id: 'item-1',
              type: 'scene',
              name: 'Introdução - Subestação',
              duration: 30,
              startTime: 0,
              layer: 1,
              locked: false,
              visible: true,
              properties: { sceneId: 'scene-1' }
            },
            {
              id: 'item-2',
              type: 'avatar',
              name: 'Instrutor Carlos - Apresentação',
              duration: 25,
              startTime: 5,
              layer: 2,
              locked: false,
              visible: true,
              properties: { avatarId: 'avatar-1', animation: 'explicar' }
            }
          ]);
          
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Add keyboard shortcuts for history
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Carregando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {project?.name || 'Editor de Vídeo'}
            </h1>
            <Badge variant="outline">{project?.status || 'Novo'}</Badge>
            <span className="text-sm text-gray-500">
              {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* History Controls */}
            <div className="flex items-center space-x-1 border-r pr-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={undo}
                disabled={!canUndo}
                title="Desfazer (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={redo}
                disabled={!canRedo}
                title="Refazer (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                title="Histórico"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowExportPanel(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExportQueue(true)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Fila
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Library */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">Biblioteca de Recursos</h2>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
              <TabsTrigger value="library">Mídia</TabsTrigger>
              <TabsTrigger value="avatars">Avatares</TabsTrigger>
              <TabsTrigger value="scenes">Cenários</TabsTrigger>
            </TabsList>
            
            <TabsContent value="library" className="flex-1 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-20 flex-col" variant="outline">
                  <Image className="w-6 h-6 mb-1" />
                  <span className="text-xs">Imagens</span>
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <Video className="w-6 h-6 mb-1" />
                  <span className="text-xs">Vídeos</span>
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <Music className="w-6 h-6 mb-1" />
                  <span className="text-xs">Áudio</span>
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <Type className="w-6 h-6 mb-1" />
                  <span className="text-xs">Texto</span>
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Templates NR</h3>
                <div className="space-y-1">
                  <Button className="w-full justify-start text-xs" variant="ghost">
                    <Shield className="w-3 h-3 mr-2" />
                    NR-10 - Segurança Elétrica
                  </Button>
                  <Button className="w-full justify-start text-xs" variant="ghost">
                    <Shield className="w-3 h-3 mr-2" />
                    NR-35 - Trabalho em Altura
                  </Button>
                  <Button className="w-full justify-start text-xs" variant="ghost">
                    <Shield className="w-3 h-3 mr-2" />
                    NR-33 - Espaços Confinados
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="avatars" className="flex-1 p-4 space-y-4">
              <div className="space-y-3">
                {avatars3D.map((avatar) => (
                  <Card key={avatar.id} className="p-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={avatar.thumbnail} 
                        alt={avatar.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{avatar.name}</h4>
                        <p className="text-xs text-gray-500 capitalize">{avatar.type}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {avatar.compliance.map((nr) => (
                            <Badge key={nr} variant="secondary" className="text-xs">
                              {nr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="scenes" className="flex-1 p-4 space-y-4">
              <div className="space-y-3">
                {scenes3D.map((scene) => (
                  <Card key={scene.id} className="p-3 cursor-pointer hover:bg-gray-50">
                    <img 
                      src={scene.thumbnail} 
                      alt={scene.name}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                    <h4 className="text-sm font-medium">{scene.name}</h4>
                    <p className="text-xs text-gray-500">{scene.category}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scene.safety.slice(0, 2).map((safety) => (
                        <Badge key={safety} variant="outline" className="text-xs">
                          {safety}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Preview and Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <video 
              ref={videoRef}
              className="max-w-full max-h-full"
              style={{ display: 'none' }}
            />
            <div className="text-white text-center">
              <div className="bg-gray-800 rounded-lg p-8 max-w-md">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Preview do Vídeo</p>
                <p className="text-sm opacity-75 mb-4">
                  Visualização em tempo real do seu treinamento
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Button size="sm" variant="secondary" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* AI Processing Indicator */}
            <div className="absolute top-4 right-4">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-2">
                <Brain className="w-3 h-3" />
                <span>IA Ativa</span>
              </div>
            </div>
          </div>
          
          {/* Player Controls */}
          <div className="bg-gray-900 text-white p-4">
            <div className="flex items-center space-x-4 mb-3">
              <Button size="sm" variant="ghost" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="ghost">
                <Square className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 mx-4">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleTimeChange}
                  max={duration}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  className="w-20"
                />
              </div>
              
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
          
          {/* Layer Manager */}
          <div className="h-64 bg-gray-800 border-t border-gray-700">
            <LayerManager
              layers={layers}
              selectedLayerId={selectedLayerId}
              onLayerSelect={setSelectedLayerId}
              onLayerUpdate={updateLayer}
              onLayerAdd={addLayer}
              onLayerRemove={removeLayer}
              onLayerDuplicate={duplicateLayer}
              onLayerMove={moveLayer}
              currentTime={currentTime}
              duration={duration}
              zoom={zoom[0]}
              onZoomChange={(value) => setZoom([value])}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties & History */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-900">
                {showEffectsPanel ? 'Efeitos e Transições' : showHistoryPanel ? 'Histórico' : 'Propriedades'}
              </h2>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                >
                  {showHistoryPanel ? <Settings className="w-4 h-4" /> : <History className="w-4 h-4" />}
                </Button>
                <Button
                  variant={showEffectsPanel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowEffectsPanel(!showEffectsPanel)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Efeitos
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {showEffectsPanel ? (
              <EffectsPanel 
                onEffectApply={handleEffectApply}
                onTransitionApply={handleTransitionApply}
                onEffectPreview={handleEffectPreview}
                selectedLayerId={selectedLayerId}
                appliedEffects={appliedEffects}
              />
            ) : showHistoryPanel ? (
              <HistoryPanel
                history={getHistoryState()}
                onUndo={undo}
                onRedo={redo}
                onClearHistory={clearHistory}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            ) : (
              <div className="p-4 h-full overflow-y-auto">
            {selectedItems.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Elemento Selecionado</h3>
                  <p className="text-sm text-gray-600">Configurações do elemento</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Duração</label>
                    <Slider defaultValue={[30]} max={120} className="mt-1" />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700">Opacidade</label>
                    <Slider defaultValue={[100]} max={100} className="mt-1" />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Copy className="w-3 h-3 mr-1" />
                      Duplicar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecione um elemento na timeline para editar suas propriedades</p>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Ferramentas IA</h3>
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Brain className="w-3 h-3 mr-2" />
                  Gerar Narração
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Zap className="w-3 h-3 mr-2" />
                  Auto Sincronizar
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Palette className="w-3 h-3 mr-2" />
                  Ajustar Cores
                </Button>
              </div>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Export Panel Modal */}
      {showExportPanel && (
        <ExportPanel
          isOpen={showExportPanel}
          onClose={() => setShowExportPanel(false)}
          projectData={{
            id: project?.id || '1',
            name: project?.name || 'Projeto sem nome',
            duration: duration,
            layers: layers,
            resolution: { width: 1920, height: 1080 },
            frameRate: 30
          }}
          onExportStart={(config) => {
            setShowExportPanel(false);
            setShowExportQueue(true);
          }}
        />
      )}
      
      {/* Export Queue Modal */}
      {showExportQueue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Fila de Exportação</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportQueue(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ExportQueue />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;