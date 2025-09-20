/**
 * Exemplo completo de uso da Engine de Renderização WebGL/WebAssembly
 * Demonstra integração com pipeline de vídeo e sistema de efeitos
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload, 
  Settings, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Zap,
  Film,
  Image,
  Cpu
} from 'lucide-react';
import WebGLRenderingEngine from '../../../lib/rendering/WebGLRenderingEngine';
import RenderingControls from '../../../components/ui/RenderingControls';

interface VideoProject {
  id: string;
  name: string;
  frames: VideoFrame[];
  settings: {
    width: number;
    height: number;
    fps: number;
    duration: number;
  };
  effects: {
    id: string;
    name: string;
    enabled: boolean;
    parameters: { [key: string]: any };
  }[];
}

interface VideoFrame {
  id: string;
  timestamp: number;
  data: ImageData | HTMLCanvasElement | HTMLVideoElement;
  effects: string[];
  metadata: {
    duration: number;
    transition?: string;
    audio?: string;
  };
}

export const RenderingEngineExample: React.FC = () => {
  const [engine, setEngine] = useState<WebGLRenderingEngine | null>(null);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStats, setRenderStats] = useState<any>(null);
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderWorkerRef = useRef<Worker | null>(null);

  // Projeto de exemplo
  const sampleProject: VideoProject = {
    id: 'sample-project',
    name: 'Apresentação Corporativa 2024',
    frames: [],
    settings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60 // 60 segundos
    },
    effects: [
      {
        id: 'colorCorrection',
        name: 'Correção de Cor',
        enabled: true,
        parameters: {
          brightness: 0.1,
          contrast: 1.2,
          saturation: 1.1,
          gamma: 1.0
        }
      },
      {
        id: 'blur',
        name: 'Suavização',
        enabled: false,
        parameters: {
          radius: 1.5
        }
      }
    ]
  };

  // Inicialização
  useEffect(() => {
    generateSampleFrames();
  }, []);

  const generateSampleFrames = useCallback(async () => {
    const frames: VideoFrame[] = [];
    const totalFrames = sampleProject.settings.fps * sampleProject.settings.duration;
    
    for (let i = 0; i < Math.min(totalFrames, 100); i++) { // Limite para exemplo
      const canvas = document.createElement('canvas');
      canvas.width = sampleProject.settings.width;
      canvas.height = sampleProject.settings.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Gerar frame de exemplo
        const time = i / sampleProject.settings.fps;
        const hue = (time * 60) % 360;
        
        // Fundo gradiente
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 40%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto principal
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('StudioTreiax', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '36px Arial';
        ctx.fillText(`Frame ${i + 1} / ${totalFrames}`, canvas.width / 2, canvas.height / 2 + 50);
        
        // Elementos animados
        const numElements = 5;
        for (let j = 0; j < numElements; j++) {
          const angle = (time + j) * Math.PI * 2 / numElements;
          const radius = 200;
          const x = canvas.width / 2 + Math.cos(angle) * radius;
          const y = canvas.height / 2 + Math.sin(angle) * radius;
          
          ctx.fillStyle = `hsl(${(hue + j * 72) % 360}, 80%, 70%)`;
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Barra de progresso
        const progressWidth = canvas.width * 0.8;
        const progressHeight = 20;
        const progressX = (canvas.width - progressWidth) / 2;
        const progressY = canvas.height - 100;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(progressX, progressY, progressWidth * (i / totalFrames), progressHeight);
      }
      
      frames.push({
        id: `frame-${i}`,
        timestamp: (i / sampleProject.settings.fps) * 1000,
        data: canvas,
        effects: sampleProject.effects.filter(e => e.enabled).map(e => e.id),
        metadata: {
          duration: 1000 / sampleProject.settings.fps,
          transition: i === 0 ? undefined : 'fade'
        }
      });
    }
    
    setCurrentProject({
      ...sampleProject,
      frames
    });
  }, []);

  const handleEngineInitialized = useCallback((engineInstance: WebGLRenderingEngine) => {
    setEngine(engineInstance);
    setError(null);
    console.log('Engine de renderização inicializada para exemplo');
  }, []);

  const startVideoRendering = useCallback(async () => {
    if (!engine || !currentProject || isRendering) return;

    setIsRendering(true);
    setRenderProgress(0);
    setError(null);

    try {
      const frames = currentProject.frames;
      const totalFrames = frames.length;
      
      // Simular renderização de vídeo
      for (let i = 0; i < totalFrames; i++) {
        const frame = frames[i];
        
        // Atualizar parâmetros dos efeitos na engine
        currentProject.effects.forEach(effect => {
          if (effect.enabled) {
            Object.entries(effect.parameters).forEach(([param, value]) => {
              engine.setEffectParameter(effect.id, `u_${param}`, value);
            });
          }
          engine.enableEffect(effect.id, effect.enabled);
        });
        
        // Renderizar frame
        await engine.renderFrame(frame);
        
        // Atualizar progresso
        const progress = ((i + 1) / totalFrames) * 100;
        setRenderProgress(progress);
        
        // Atualizar estatísticas
        setRenderStats(engine.getStats());
        
        // Simular delay para visualizar progresso
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Simular geração de vídeo final
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gerar URL de vídeo simulado
      const videoBlob = new Blob(['video-data-placeholder'], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      setOutputVideo(videoUrl);
      
      console.log('Renderização de vídeo concluída com sucesso');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro durante renderização';
      setError(errorMessage);
      console.error('Erro na renderização:', err);
    } finally {
      setIsRendering(false);
    }
  }, [engine, currentProject, isRendering]);

  const stopRendering = useCallback(() => {
    setIsRendering(false);
    setRenderProgress(0);
  }, []);

  const previewFrame = useCallback(async (frameIndex: number) => {
    if (!engine || !currentProject || !previewCanvasRef.current) return;

    const frame = currentProject.frames[frameIndex];
    if (!frame) return;

    try {
      // Configurar efeitos para preview
      currentProject.effects.forEach(effect => {
        if (effect.enabled) {
          Object.entries(effect.parameters).forEach(([param, value]) => {
            engine.setEffectParameter(effect.id, `u_${param}`, value);
          });
        }
        engine.enableEffect(effect.id, effect.enabled);
      });

      // Renderizar frame para preview
      const result = await engine.renderFrame(frame);
      
      // Copiar resultado para canvas de preview
      const previewCtx = previewCanvasRef.current.getContext('2d');
      if (previewCtx && result) {
        previewCtx.drawImage(result, 0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
    } catch (err) {
      console.error('Erro no preview do frame:', err);
    }
  }, [engine, currentProject]);

  const updateEffectParameter = useCallback((effectId: string, parameter: string, value: any) => {
    if (!currentProject) return;

    setCurrentProject(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        effects: prev.effects.map(effect => 
          effect.id === effectId 
            ? { ...effect, parameters: { ...effect.parameters, [parameter]: value } }
            : effect
        )
      };
    });

    // Atualizar na engine se disponível
    if (engine) {
      engine.setEffectParameter(effectId, `u_${parameter}`, value);
    }
  }, [currentProject, engine]);

  const toggleEffect = useCallback((effectId: string, enabled: boolean) => {
    if (!currentProject) return;

    setCurrentProject(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        effects: prev.effects.map(effect => 
          effect.id === effectId 
            ? { ...effect, enabled }
            : effect
        )
      };
    });

    // Atualizar na engine se disponível
    if (engine) {
      engine.enableEffect(effectId, enabled);
    }
  }, [currentProject, engine]);

  const exportVideo = useCallback(() => {
    if (!outputVideo) return;

    const a = document.createElement('a');
    a.href = outputVideo;
    a.download = `${currentProject?.name || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [outputVideo, currentProject]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Engine de Renderização WebGL/WebAssembly</h1>
        <p className="text-muted-foreground">
          Exemplo completo de renderização de vídeo com aceleração GPU
        </p>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant={engine ? 'default' : 'secondary'}>
              {engine ? 'Engine Inicializada' : 'Engine Não Inicializada'}
            </Badge>
            <Badge variant={currentProject ? 'default' : 'outline'}>
              {currentProject ? `${currentProject.frames.length} Frames` : 'Sem Projeto'}
            </Badge>
            <Badge variant={isRendering ? 'default' : 'outline'}>
              {isRendering ? 'Renderizando' : 'Parado'}
            </Badge>
            {renderStats && (
              <Badge variant="outline">
                {renderStats.fps} FPS
              </Badge>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {outputVideo && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Vídeo renderizado com sucesso! Use o botão de download para salvar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controles da Engine */}
        <div className="lg:col-span-2">
          <RenderingControls
            onEngineInitialized={handleEngineInitialized}
            onRenderingStart={() => console.log('Renderização iniciada')}
            onRenderingStop={() => console.log('Renderização parada')}
          />
        </div>

        {/* Painel de Controle do Projeto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Controle do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentProject && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">{currentProject.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentProject.frames.length} frames • {currentProject.settings.fps} fps
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentProject.settings.width}x{currentProject.settings.height}
                  </p>
                </div>

                {isRendering && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso</span>
                      <span>{renderProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={renderProgress} />
                  </div>
                )}

                <div className="flex gap-2">
                  {!isRendering ? (
                    <Button 
                      onClick={startVideoRendering}
                      disabled={!engine}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Renderizar Vídeo
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopRendering}
                      variant="outline"
                      className="flex-1"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                </div>

                {outputVideo && (
                  <Button 
                    onClick={exportVideo}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Vídeo
                  </Button>
                )}
              </div>
            )}

            {renderStats && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Estatísticas de Renderização</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>FPS: {renderStats.fps}</div>
                  <div>Frame Time: {renderStats.frameTime.toFixed(1)}ms</div>
                  <div>Memória: {renderStats.memoryUsed.toFixed(1)}MB</div>
                  <div>Draw Calls: {renderStats.drawCalls}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview e Controles de Efeitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Preview e Efeitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <canvas
                  ref={previewCanvasRef}
                  width={1920}
                  height={1080}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => previewFrame(0)}
                  disabled={!currentProject || !engine}
                  size="sm"
                >
                  Primeiro Frame
                </Button>
                <Button 
                  onClick={() => previewFrame(Math.floor((currentProject?.frames.length || 0) / 2))}
                  disabled={!currentProject || !engine}
                  size="sm"
                >
                  Meio
                </Button>
                <Button 
                  onClick={() => previewFrame((currentProject?.frames.length || 1) - 1)}
                  disabled={!currentProject || !engine}
                  size="sm"
                >
                  Último Frame
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              {currentProject?.effects.map(effect => (
                <Card key={effect.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{effect.name}</span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={effect.enabled}
                          onChange={(e) => toggleEffect(effect.id, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          effect.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            effect.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </div>
                      </label>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(effect.parameters).map(([param, value]) => (
                        <div key={param}>
                          <label className="text-sm font-medium capitalize">
                            {param.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="range"
                            min={param === 'brightness' ? -1 : 0}
                            max={param === 'brightness' ? 1 : param === 'contrast' ? 3 : 2}
                            step={0.01}
                            value={value as number}
                            onChange={(e) => updateEffectParameter(effect.id, param, parseFloat(e.target.value))}
                            disabled={!effect.enabled}
                            className="w-full mt-1"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-3">Timeline do Projeto</h4>
                {currentProject && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Duração Total:</span>
                      <span>{currentProject.settings.duration}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total de Frames:</span>
                      <span>{currentProject.frames.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>FPS:</span>
                      <span>{currentProject.settings.fps}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Resolução:</span>
                      <span>{currentProject.settings.width}x{currentProject.settings.height}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mini timeline visual */}
              <div className="h-20 bg-muted rounded-lg p-2">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded opacity-50 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    Timeline Visual (Em Desenvolvimento)
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Output de Vídeo */}
      {outputVideo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Vídeo Renderizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="bg-muted rounded-lg p-8">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-lg font-medium">Vídeo renderizado com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  Arquivo pronto para download
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={exportVideo}>
                  <Download className="w-4 h-4 mr-2" />
                  Download MP4
                </Button>
                <Button variant="outline" onClick={() => setOutputVideo(null)}>
                  <Square className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RenderingEngineExample;