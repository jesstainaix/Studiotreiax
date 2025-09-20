// Avatar Management System Demo - Integration Example
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Monitor, 
  Settings, 
  Play, 
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import AvatarsLibrary from './right-panel/AvatarsLibrary';
import ScenePreview from './right-panel/ScenePreview';
import AvatarErrorBoundary from './ErrorBoundary';
import { sceneManager } from './SceneManager';
import { avatarManager } from '../providers/avatars';
import { AvatarGenerationResult, SceneAvatarConfig } from '../providers/avatars/types';

const AvatarManagementDemo: React.FC = () => {
  // State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [scenes, setScenes] = useState<SceneAvatarConfig[]>([]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<{ [key: string]: boolean }>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Mock slides for demo
  const mockSlides = [
    { id: 1, title: 'Introdução à Segurança', type: 'intro' },
    { id: 2, title: 'Equipamentos de Proteção', type: 'content' },
    { id: 3, title: 'Procedimentos de Emergência', type: 'content' },
    { id: 4, title: 'Conclusão', type: 'conclusion' }
  ];

  // Load initial data
  useEffect(() => {
    initializeDemo();
  }, []);

  // Subscribe to scene changes
  useEffect(() => {
    const unsubscribe = sceneManager.subscribe((config) => {
      setScenes(config.scenes);
      setLastUpdate(new Date().toLocaleTimeString());
    });
    return unsubscribe;
  }, []);

  const initializeDemo = async () => {
    try {
      setIsLoading(true);
      
      // Load scene configuration
      const config = await sceneManager.loadConfiguration();
      setScenes(config.scenes);
      
      // Check provider health
      const health = await avatarManager.healthCheck();
      setSystemHealth(health);
      
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('[AvatarDemo] Initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = (avatar: AvatarGenerationResult) => {
    setSelectedAvatarId(avatar.avatarId);
    console.log('[AvatarDemo] Avatar selected:', avatar.avatarId);
  };

  const handleAvatarDragStart = (avatar: AvatarGenerationResult, event: React.DragEvent) => {
    console.log('[AvatarDemo] Avatar drag started:', avatar.avatarId);
    // Additional drag start logic if needed
  };

  const handleAvatarAssigned = (slideId: number, avatarId: string) => {
    console.log('[AvatarDemo] Avatar assigned:', { slideId, avatarId });
    setSelectedAvatarId(avatarId);
  };

  const handleAvatarRemoved = (slideId: number) => {
    console.log('[AvatarDemo] Avatar removed from slide:', slideId);
  };

  const handleSaveConfiguration = async () => {
    try {
      await sceneManager.saveConfigurationWithNotification();
      alert('Configuração salva com sucesso!');
    } catch (error) {
      console.error('[AvatarDemo] Save failed:', error);
      alert('Erro ao salvar configuração.');
    }
  };

  const handleRefreshSystem = async () => {
    await initializeDemo();
  };

  const handleGeneratePreview = () => {
    const scenesWithAvatars = scenes.filter(scene => 
      mockSlides.some(slide => slide.id === scene.slide_id)
    );
    
    console.log('[AvatarDemo] Generating preview for scenes:', scenesWithAvatars);
    alert(`Preview gerado para ${scenesWithAvatars.length} cenas com avatares!`);
  };

  const getSlideTitle = (slideId: number): string => {
    const slide = mockSlides.find(s => s.id === slideId);
    return slide?.title || `Slide ${slideId}`;
  };

  const getSceneForSlide = (slideId: number): SceneAvatarConfig | null => {
    return scenes.find(scene => scene.slide_id === slideId) || null;
  };

  const getSystemHealthIcon = () => {
    const healthyProviders = Object.values(systemHealth).filter(Boolean).length;
    const totalProviders = Object.keys(systemHealth).length;
    
    if (totalProviders === 0) return <Clock className="w-4 h-4 text-gray-400" />;
    if (healthyProviders === totalProviders) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (healthyProviders > 0) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando Sistema de Avatares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sistema de Gestão de Avatares 3D
              </h1>
              <p className="text-gray-600">
                Biblioteca lateral + Vinculação por Cena - Fase 2
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getSystemHealthIcon()}
                <span>Sistema</span>
              </div>
              <Button variant="outline" onClick={handleRefreshSystem}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleSaveConfiguration}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Config
              </Button>
              <Button onClick={handleGeneratePreview}>
                <Play className="w-4 h-4 mr-2" />
                Gerar Preview
              </Button>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <Badge variant="secondary">
              {scenes.length} cenas configuradas
            </Badge>
            <Badge variant="secondary">
              {mockSlides.length} slides totais
            </Badge>
            <span className="text-gray-500">
              Última atualização: {lastUpdate}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Scenes Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="w-5 h-5" />
                  Cenas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockSlides.map((slide) => {
                  const hasAvatar = getSceneForSlide(slide.id) !== null;
                  return (
                    <Button
                      key={slide.id}
                      variant={currentSlide === slide.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setCurrentSlide(slide.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{slide.title}</span>
                        {hasAvatar && (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                        )}
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4" />
                  Providers Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(systemHealth).map(([provider, healthy]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{provider}</span>
                    {healthy ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Scene Preview */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="preview" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview da Cena</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <AvatarErrorBoundary componentName="ScenePreview">
                  <ScenePreview
                    slideId={currentSlide}
                    slideTitle={getSlideTitle(currentSlide)}
                    onAvatarAssigned={handleAvatarAssigned}
                    onAvatarRemoved={handleAvatarRemoved}
                    className="h-full"
                  />
                </AvatarErrorBoundary>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline das Cenas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockSlides.map((slide) => {
                        const scene = getSceneForSlide(slide.id);
                        return (
                          <div key={slide.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                              {slide.id}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{slide.title}</h4>
                              {scene ? (
                                <p className="text-sm text-gray-600">
                                  Avatar: {scene.avatarId} | Pose: {scene.avatarPose}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500">Nenhum avatar atribuído</p>
                              )}
                            </div>
                            {scene && (
                              <Badge variant="secondary">
                                Configurado
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Avatar Library */}
          <div className="lg:col-span-1">
            <AvatarErrorBoundary componentName="AvatarsLibrary">
              <AvatarsLibrary
                onAvatarSelect={handleAvatarSelect}
                onAvatarDragStart={handleAvatarDragStart}
                selectedAvatarId={selectedAvatarId}
                className="h-full"
              />
            </AvatarErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarManagementDemo;