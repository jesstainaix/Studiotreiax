import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RotateCcw,
  Loader2,
  FileText,
  Settings,
  Users,
  Mic
} from 'lucide-react';
import { toast } from 'sonner';

import { HeyGenProject, HeyGenScene, HeyGenSceneManager } from '../../lib/pptx/heygen-scene-manager';
import { AvatarSelectionPanel } from './AvatarSelectionPanel';
import { ScenePreviewWithAvatar } from './ScenePreviewWithAvatar';
import { VoicePreviewPanel } from './VoicePreviewPanel';
import { TimelineEditor } from './TimelineEditor';
import { ttsService, TTSVoice } from '../../lib/tts/TTSService';
import { useTimeline } from '../../context/TimelineContext';

// Avatar library for Brazilian safety training
const AVATAR_LIBRARY = [
  { 
    id: 'ana-silva-nr6', 
    name: 'Ana Silva - EPI Specialist', 
    gender: 'female', 
    age: 'adult',
    expertise: 'NR-06',
    modelPath: '/models/avatars/ana-silva.glb',
    preview: '/images/avatars/ana-silva-preview.jpg'
  },
  { 
    id: 'carlos-santos-nrs', 
    name: 'Carlos Santos - Multi-NR Expert', 
    gender: 'male', 
    age: 'adult',
    expertise: 'NR-10, NR-12, NR-33',
    modelPath: '/models/avatars/carlos-santos.glb',
    preview: '/images/avatars/carlos-santos-preview.jpg'
  },
  { 
    id: 'dr-roberto-nr17', 
    name: 'Dr. Roberto - Ergonomia', 
    gender: 'male', 
    age: 'senior',
    expertise: 'NR-17',
    modelPath: '/models/avatars/dr-roberto.glb',
    preview: '/images/avatars/dr-roberto-preview.jpg'
  },
  { 
    id: 'maria-cipa', 
    name: 'Maria - CIPA Leader', 
    gender: 'female', 
    age: 'adult',
    expertise: 'CIPA, NR-05',
    modelPath: '/models/avatars/maria-cipa.glb',
    preview: '/images/avatars/maria-cipa-preview.jpg'
  },
  { 
    id: 'jose-sesmt', 
    name: 'José - SESMT Coordinator', 
    gender: 'male', 
    age: 'adult',
    expertise: 'SESMT, NR-04',
    modelPath: '/models/avatars/jose-sesmt.glb',
    preview: '/images/avatars/jose-sesmt-preview.jpg'
  }
];

// Voice library initialization
const initializeVoiceLibrary = () => {
  const ttsVoices = ttsService.getVoices();
  return ttsVoices.map(voice => ({
    id: voice.id,
    name: voice.name,
    language: voice.language as 'pt-BR',
    provider: voice.provider,
    gender: voice.gender,
    age: voice.age
  }));
};

const VOICE_LIBRARY = initializeVoiceLibrary();

interface HeyGenStudioContentProps {
  currentProject: HeyGenProject | null;
  setCurrentProject: (project: HeyGenProject | null) => void;
  selectedScene: string;
  setSelectedScene: (sceneId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const HeyGenStudioContent: React.FC<HeyGenStudioContentProps> = ({
  currentProject,
  setCurrentProject,
  selectedScene,
  setSelectedScene,
  activeTab,
  setActiveTab,
  isUploading,
  setIsUploading
}) => {
  // Use timeline context instead of local state
  const timeline = useTimeline();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sceneManagerRef = useRef(new HeyGenSceneManager());

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pptx') && !file.name.toLowerCase().endsWith('.ppt')) {
      toast.error('Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)');
      return;
    }

    try {
      setIsUploading(true);
      toast.info('Processando PPTX...', { duration: 2000 });

      const project = await sceneManagerRef.current.createProjectFromPPTX(file);
      setCurrentProject(project);
      timeline.setProject(project);

      if (project.scenes.length > 0) {
        setSelectedScene(project.scenes[0].id);
      }

      toast.success(`PPTX processado com sucesso! ${project.scenes.length} cenas criadas.`);
    } catch (error) {
      console.error('Error processing PPTX:', error);
      toast.error('Erro ao processar PPTX. Verifique o arquivo e tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProjectUpdate = (updatedProject: HeyGenProject) => {
    setCurrentProject(updatedProject);
    timeline.setProject(updatedProject);
  };

  const assignAvatarToScene = async (sceneId: string, avatarId: string) => {
    if (!currentProject) return;
    
    const avatar = AVATAR_LIBRARY.find(a => a.id === avatarId);
    if (!avatar) return;

    const updatedProject = sceneManagerRef.current.updateSceneAvatar(currentProject, sceneId, avatar);
    handleProjectUpdate(updatedProject);

    toast.success(`Avatar "${avatar.name}" atribuído à cena`);
  };

  const assignVoiceToScene = async (sceneId: string, voiceId: string) => {
    if (!currentProject) return;
    
    const voice = VOICE_LIBRARY.find(v => v.id === voiceId);
    if (!voice) return;

    const updatedProject = sceneManagerRef.current.updateSceneVoice(currentProject, sceneId, voice);
    handleProjectUpdate(updatedProject);

    toast.success(`Voz "${voice.name}" atribuída à cena`);
  };

  const handleVoiceSelect = async (voice: TTSVoice) => {
    if (!selectedScene) return;
    
    const updatedProject = sceneManagerRef.current.updateSceneVoice(currentProject!, selectedScene, {
      id: voice.id,
      name: voice.name,
      provider: voice.provider,
      language: voice.language,
      gender: voice.gender,
      age: voice.age
    });

    handleProjectUpdate(updatedProject);
    toast.success(`Voz selecionada: ${voice.name}`);
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
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {currentProject.title}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {currentProject && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{currentProject.scenes.length} cenas</span>
                <span>•</span>
                <span>{formatDuration(currentProject.scenes.reduce((total, scene) => total + scene.duration, 0))}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={timeline.isMediaReady ? timeline.play : undefined}
                disabled={!timeline.isMediaReady}
              >
                {timeline.timelineState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {timeline.timelineState.isPlaying ? 'Pausar' : 'Reproduzir'}
              </Button>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Processando...' : 'Upload PPTX'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Scene List */}
        <div className="w-80 bg-white border-r flex flex-col">
          {currentProject ? (
            <>
              <div className="p-4 border-b">
                <h2 className="font-medium text-gray-900 mb-2">Cenas ({currentProject.scenes.length})</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {currentProject.scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      selectedScene === scene.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedScene(scene.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 mb-1">
                          {index + 1}. {scene.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {scene.slideData.textContent?.substring(0, 100) || 'Sem conteúdo de texto'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(scene.duration)}
                          </Badge>
                          {scene.avatar && (
                            <Badge variant="secondary" className="text-xs">
                              {scene.avatar.name.split(' ')[0]}
                            </Badge>
                          )}
                          {scene.voice && (
                            <Badge variant="secondary" className="text-xs">
                              <Mic className="w-3 h-3 mr-1" />
                              {scene.voice.name.split(' ')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto carregado</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Faça upload de um arquivo PPTX para começar
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Escolher Arquivo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Preview */}
        <div className="flex-1 flex flex-col">
          {currentProject && selectedScene ? (
            <ScenePreviewWithAvatar
              scene={getCurrentScene()!}
              project={currentProject}
              onSceneUpdate={(updatedScene) => {
                const updatedProject = {
                  ...currentProject,
                  scenes: currentProject.scenes.map(s => 
                    s.id === updatedScene.id ? updatedScene : s
                  )
                };
                handleProjectUpdate(updatedProject);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma cena selecionada</h3>
                <p className="text-gray-600">
                  Carregue um projeto e selecione uma cena para visualizar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Libraries */}
        <div className="w-80 bg-white border-l">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
              <TabsTrigger value="avatars" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Avatares
              </TabsTrigger>
              <TabsTrigger value="voices" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Vozes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="avatars" className="flex-1 overflow-hidden m-4 mt-0">
              <AvatarSelectionPanel
                avatars={AVATAR_LIBRARY}
                selectedSceneId={selectedScene}
                onAvatarSelect={assignAvatarToScene}
              />
            </TabsContent>

            <TabsContent value="voices" className="flex-1 overflow-hidden m-4 mt-0">
              <VoicePreviewPanel
                voices={VOICE_LIBRARY}
                selectedSceneId={selectedScene}
                currentScene={getCurrentScene()}
                onVoiceSelect={handleVoiceSelect}
                onVoiceAssign={assignVoiceToScene}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Panel - Timeline */}
      {currentProject && (
        <div className="h-80 bg-white border-t">
          <TimelineEditor
            project={currentProject}
            onProjectUpdate={handleProjectUpdate}
            onSceneSelect={setSelectedScene}
            selectedSceneId={selectedScene}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
};

export default HeyGenStudioContent;