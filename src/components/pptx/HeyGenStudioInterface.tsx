import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Upload, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Settings,
  User,
  Mic,
  Video,
  Download,
  Eye,
  Trash2,
  Plus,
  Edit3,
  Clock,
  FileText,
  Image as ImageIcon,
  Layers,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { HeyGenSceneManager, HeyGenProject, HeyGenScene } from '../../lib/pptx/heygen-scene-manager';

// Use unified HeyGen data model from scene manager
// No local interface definitions needed - use HeyGenProject and HeyGenScene directly

// Avatar library with proper HeyGen structure
const AVATAR_LIBRARY = [
  {
    id: 'avatar-1',
    name: 'Ana Silva',
    gender: 'female' as const,
    style: 'professional' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face',
    modelPath: '/models/avatars/ana-silva.glb',
    description: 'Instrutora de segurança experiente'
  },
  {
    id: 'avatar-2', 
    name: 'Carlos Santos',
    gender: 'male' as const,
    style: 'corporate' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    modelPath: '/models/avatars/carlos-santos.glb',
    description: 'Especialista em NRs'
  },
  {
    id: 'avatar-3',
    name: 'Marina Costa',
    gender: 'female' as const,
    style: 'casual' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    modelPath: '/models/avatars/marina-costa.glb',
    description: 'Treinadora dinâmica'
  }
];

// Voice library with proper provider fields
const VOICE_LIBRARY = [
  {
    id: 'voice-1',
    name: 'Beatriz',
    language: 'pt-BR' as const,
    gender: 'female' as const,
    sample: 'Voz feminina profissional e clara',
    provider: 'elevenlabs' as const
  },
  {
    id: 'voice-2',
    name: 'Roberto',
    language: 'pt-BR' as const,
    gender: 'male' as const,
    sample: 'Voz masculina confiante e educativa',
    provider: 'heygen' as const
  },
  {
    id: 'voice-3',
    name: 'Sofia',
    language: 'pt-BR' as const,
    gender: 'female' as const,
    sample: 'Voz feminina jovem e envolvente',
    provider: 'google' as const
  }
];

const HeyGenStudioInterface: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<HeyGenProject | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('avatars');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sceneManagerRef = useRef(HeyGenSceneManager.getInstance());

  // Handle PPTX file upload and conversion to scenes using HeyGen Scene Manager
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pptx') && !file.name.toLowerCase().endsWith('.ppt')) {
      toast.error('Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)');
      return;
    }

    try {
      toast.info('Processando apresentação...');
      
      // Use the HeyGen Scene Manager for conversion
      const heygenProject = await sceneManagerRef.current.convertPPTXToHeyGenProject(file);

      // Set the project directly without conversion - use unified data model
      setCurrentProject(heygenProject);
      setSelectedScene(heygenProject.scenes[0]?.id || null);
      
      // Validate the project
      const validation = sceneManagerRef.current.validateProject(heygenProject);
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => toast.warning(warning));
      }
      
      // Save project to backend for persistence
      await saveProjectToBackend(heygenProject);
      
      toast.success('Apresentação processada com sucesso!');
      console.log('Generated HeyGen Project JSON:', sceneManagerRef.current.generateProjectOutputJSON(heygenProject));
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro de conexão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };


  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Scene management functions
  const handleSceneSelect = (sceneId: string) => {
    setSelectedScene(sceneId);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const assignAvatarToScene = async (sceneId: string, avatarId: string) => {
    if (!currentProject) return;
    
    const avatar = AVATAR_LIBRARY.find(a => a.id === avatarId);
    if (!avatar) return;

    // Use scene manager to update avatar properly
    const updatedProject = sceneManagerRef.current.updateSceneAvatar(currentProject, sceneId, avatar);
    setCurrentProject(updatedProject);
    
    // Persist to backend
    await updateSceneInBackend(sceneId, { avatar });
    
    toast.success(`Avatar ${avatar.name} atribuído à cena`);
  };

  const assignVoiceToScene = async (sceneId: string, voiceId: string) => {
    if (!currentProject) return;
    
    const voice = VOICE_LIBRARY.find(v => v.id === voiceId);
    if (!voice) return;

    // Use scene manager to update voice properly
    const updatedProject = sceneManagerRef.current.updateSceneVoice(currentProject, sceneId, voice);
    setCurrentProject(updatedProject);
    
    // Persist to backend
    await updateSceneInBackend(sceneId, { voice });
    
    toast.success(`Voz ${voice.name} atribuída à cena`);
  };

  // Backend integration functions
  const saveProjectToBackend = async (project: HeyGenProject) => {
    try {
      const response = await fetch('http://localhost:3001/api/heygen/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      
      if (!response.ok) {
        console.warn('Failed to save project to backend');
      }
    } catch (error) {
      console.warn('Backend save failed:', error);
    }
  };

  const updateSceneInBackend = async (sceneId: string, updates: Partial<HeyGenScene>) => {
    try {
      const response = await fetch(`http://localhost:3001/api/heygen/scenes/${sceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        console.warn('Failed to update scene in backend');
      }
    } catch (error) {
      console.warn('Backend update failed:', error);
    }
  };

  const getCurrentScene = (): HeyGenScene | undefined => {
    return currentProject?.scenes.find(scene => scene.id === selectedScene);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">PPTX Studio - HeyGen Style</h1>
          {currentProject && (
            <Badge variant="secondary">
              {currentProject.scenes.length} cenas • {formatDuration(currentProject.totalDuration)}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm" disabled={!currentProject}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Vídeo
          </Button>
        </div>
      </div>

      {!currentProject ? (
        /* Upload Area when no project is loaded */
        <div className="flex-1 flex items-center justify-center p-8">
          <Card 
            className={`max-w-lg w-full border-2 border-dashed transition-colors ${
              isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="p-8 text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Faça upload da sua apresentação PowerPoint
              </h3>
              <p className="text-gray-600 mb-6">
                Arraste e solte seu arquivo .pptx aqui ou clique para selecionar
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Selecionar Arquivo PPTX
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                Suporte para arquivos até 100MB • Formatos: .pptx, .ppt
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx,.ppt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* HeyGen-style interface layout */
        <div className="flex-1 flex">
          {/* Left Panel - Scene List */}
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900 mb-2">Cenas</h2>
              <p className="text-sm text-gray-600">
                {currentProject.scenes.length} cenas • {formatDuration(currentProject.totalDuration)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {currentProject.scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedScene === scene.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSceneSelect(scene.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{scene.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{scene.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{formatDuration(scene.duration)}</span>
                        <div className="flex items-center space-x-1">
                          {scene.avatar && (
                            <Badge variant="outline" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {scene.avatar.name}
                            </Badge>
                          )}
                          {scene.voice && (
                            <Badge variant="outline" className="text-xs">
                              <Mic className="w-3 h-3 mr-1" />
                              {scene.voice.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Cena
              </Button>
            </div>
          </div>

          {/* Center Panel - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gray-900 relative">
              {getCurrentScene() ? (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {getCurrentScene()?.title}
                    </h2>
                    <p className="text-gray-700 mb-6">
                      {getCurrentScene()?.content}
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      {getCurrentScene()?.avatar ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={getCurrentScene()?.avatar?.thumbnailUrl}
                            alt={getCurrentScene()?.avatar?.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{getCurrentScene()?.avatar?.name}</p>
                            <p className="text-sm text-gray-600">Avatar Selecionado</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <User className="w-16 h-16 mx-auto mb-2 opacity-50" />
                          <p>Selecione um avatar para esta cena</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma cena para visualizar</p>
                  </div>
                </div>
              )}
            </div>

            {/* Player Controls */}
            <div className="bg-white border-t p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Button size="sm" variant="outline">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatDuration(currentTime)} / {formatDuration(getCurrentScene()?.duration || 0)}
                  </span>
                </div>
              </div>
              <Progress 
                value={(currentTime / (getCurrentScene()?.duration || 1)) * 100} 
                className="w-full"
              />
            </div>
          </div>

          {/* Right Panel - Library */}
          <div className="w-80 bg-white border-l flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 m-4">
                <TabsTrigger value="avatars">Avatares</TabsTrigger>
                <TabsTrigger value="voices">Vozes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="avatars" className="flex-1 overflow-y-auto px-4">
                <div className="space-y-3">
                  {AVATAR_LIBRARY.map((avatar) => (
                    <Card 
                      key={avatar.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => selectedScene && assignAvatarToScene(selectedScene, avatar.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={avatar.thumbnailUrl}
                            alt={avatar.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{avatar.name}</h4>
                            <p className="text-sm text-gray-600">{avatar.description}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {avatar.style}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="voices" className="flex-1 overflow-y-auto px-4">
                <div className="space-y-3">
                  {VOICE_LIBRARY.map((voice) => (
                    <Card 
                      key={voice.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => selectedScene && assignVoiceToScene(selectedScene, voice.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{voice.name}</h4>
                            <p className="text-sm text-gray-600">{voice.sample}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {voice.gender} • {voice.language}
                            </Badge>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Bottom Timeline (only when project is loaded) */}
      {currentProject && (
        <div className="bg-white border-t p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Timeline</h3>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Zap className="w-4 h-4 mr-1" />
                Auto-editar
              </Button>
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-1" />
                Preview Completo
              </Button>
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto py-2">
            {currentProject.scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`flex-shrink-0 w-32 h-20 border-2 rounded cursor-pointer transition-colors ${
                  selectedScene === scene.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-100'
                }`}
                onClick={() => handleSceneSelect(scene.id)}
              >
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    Cena {index + 1}
                  </div>
                  <div className="text-xs text-gray-600">{formatDuration(scene.duration)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeyGenStudioInterface;