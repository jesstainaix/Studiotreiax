/**
 * Interface React para Engine de Renderização WebGL/WebAssembly
 * Controles visuais para configuração e monitoramento de performance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Zap, 
  Settings, 
  BarChart3, 
  Cpu, 
  HardDrive, 
  Timer,
  Palette,
  Sparkles,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import WebGLRenderingEngine from '../../lib/rendering/WebGLRenderingEngine';

interface RenderingControlsProps {
  onEngineInitialized?: (engine: WebGLRenderingEngine) => void;
  onRenderingStart?: () => void;
  onRenderingStop?: () => void;
  className?: string;
}

export const RenderingControls: React.FC<RenderingControlsProps> = ({
  onEngineInitialized,
  onRenderingStart,
  onRenderingStop,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WebGLRenderingEngine | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Estados da interface
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configurações de renderização
  const [renderingConfig, setRenderingConfig] = useState({
    width: 1920,
    height: 1080,
    fps: 60,
    quality: 'high' as 'low' | 'medium' | 'high' | 'ultra',
    antialiasing: true,
    enablePostProcessing: true,
    useWebGL2: true,
    enableWebAssembly: true,
    maxMemoryUsage: 512,
    enableProfiling: true,
    showStats: true
  });

  // Estados dos efeitos
  const [effectsSettings, setEffectsSettings] = useState({
    blur: {
      enabled: false,
      radius: 2.0
    },
    colorCorrection: {
      enabled: true,
      brightness: 0.0,
      contrast: 1.0,
      saturation: 1.0,
      gamma: 1.0
    }
  });

  // Estados de estatísticas
  const [stats, setStats] = useState({
    fps: 0,
    frameTime: 0,
    gpuTime: 0,
    memoryUsed: 0,
    drawCalls: 0,
    triangles: 0,
    textureSwaps: 0
  });

  // Estados de WebGL
  const [webglInfo, setWebglInfo] = useState<{
    version: string;
    renderer: string;
    vendor: string;
    maxTextureSize: number;
    supportedExtensions: string[];
  } | null>(null);

  // Inicialização da engine
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      initializeEngine();
    }
  }, [isInitialized]);

  // Atualização de estatísticas
  useEffect(() => {
    if (isRendering && engineRef.current) {
      const updateStats = () => {
        if (engineRef.current) {
          setStats(engineRef.current.getStats());
        }
        if (isRendering) {
          setTimeout(updateStats, 100); // Atualizar a cada 100ms
        }
      };
      updateStats();
    }
  }, [isRendering]);

  const initializeEngine = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      setError(null);
      
      const canvas = canvasRef.current;
      canvas.width = renderingConfig.width;
      canvas.height = renderingConfig.height;

      const engine = new WebGLRenderingEngine({
        canvas,
        ...renderingConfig
      });

      engineRef.current = engine;
      
      // Obter informações do WebGL
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        setWebglInfo({
          version: gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0',
          renderer: gl.getParameter(gl.RENDERER),
          vendor: gl.getParameter(gl.VENDOR),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          supportedExtensions: gl.getSupportedExtensions() || []
        });
      }

      setIsInitialized(true);
      onEngineInitialized?.(engine);
      
      console.log('Engine de renderização inicializada com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao inicializar engine:', err);
    }
  }, [renderingConfig, onEngineInitialized]);

  const startRendering = useCallback(async () => {
    if (!engineRef.current) return;

    setIsRendering(true);
    onRenderingStart?.();

    // Simular renderização de frames de teste
    const renderLoop = async () => {
      if (!engineRef.current || !isRendering) return;

      try {
        // Criar frame de teste
        const canvas = document.createElement('canvas');
        canvas.width = renderingConfig.width;
        canvas.height = renderingConfig.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Renderizar padrão de teste
          const time = Date.now() * 0.001;
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, `hsl(${time * 60 % 360}, 70%, 50%)`);
          gradient.addColorStop(1, `hsl(${(time * 60 + 180) % 360}, 70%, 50%)`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Adicionar alguns elementos animados
          ctx.fillStyle = 'white';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('WebGL Rendering Engine', canvas.width / 2, canvas.height / 2);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          for (let i = 0; i < 10; i++) {
            const x = (Math.sin(time + i) * 0.3 + 0.5) * canvas.width;
            const y = (Math.cos(time * 1.2 + i) * 0.3 + 0.5) * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Aplicar efeitos ativos
        const activeEffects: string[] = [];
        if (effectsSettings.blur.enabled) activeEffects.push('blur');
        if (effectsSettings.colorCorrection.enabled) activeEffects.push('colorCorrection');

        const frame = {
          timestamp: Date.now(),
          data: canvas,
          effects: activeEffects,
          metadata: {}
        };

        await engineRef.current.renderFrame(frame);

        if (isRendering) {
          animationFrameRef.current = requestAnimationFrame(renderLoop);
        }
      } catch (err) {
        console.error('Erro durante renderização:', err);
        setError(err instanceof Error ? err.message : 'Erro de renderização');
        setIsRendering(false);
      }
    };

    renderLoop();
  }, [isRendering, renderingConfig, effectsSettings, onRenderingStart]);

  const stopRendering = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRendering(false);
    onRenderingStop?.();
  }, [onRenderingStop]);

  const updateEffectSettings = useCallback((effectId: string, parameter: string, value: any) => {
    if (!engineRef.current) return;

    setEffectsSettings(prev => ({
      ...prev,
      [effectId]: {
        ...prev[effectId as keyof typeof prev],
        [parameter]: value
      }
    }));

    // Atualizar parâmetro na engine
    const parameterName = `u_${parameter}`;
    engineRef.current.setEffectParameter(effectId, parameterName, value);
  }, []);

  const toggleEffect = useCallback((effectId: string, enabled: boolean) => {
    if (!engineRef.current) return;

    setEffectsSettings(prev => ({
      ...prev,
      [effectId]: {
        ...prev[effectId as keyof typeof prev],
        enabled
      }
    }));

    engineRef.current.enableEffect(effectId, enabled);
  }, []);

  const resetEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setIsInitialized(false);
    setIsRendering(false);
    setError(null);
    setStats({
      fps: 0,
      frameTime: 0,
      gpuTime: 0,
      memoryUsed: 0,
      drawCalls: 0,
      triangles: 0,
      textureSwaps: 0
    });
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Engine de Renderização WebGL/WebAssembly
          </CardTitle>
          <CardDescription>
            Sistema otimizado de renderização com aceleração GPU e processamento intensivo em WASM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Badge variant={isInitialized ? 'default' : 'secondary'}>
                {isInitialized ? 'Inicializada' : 'Não Inicializada'}
              </Badge>
              <Badge variant={isRendering ? 'default' : 'outline'}>
                {isRendering ? 'Renderizando' : 'Parada'}
              </Badge>
              {webglInfo && (
                <Badge variant="outline">
                  {webglInfo.version}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {!isInitialized ? (
                <Button onClick={initializeEngine} disabled={isInitialized}>
                  <Zap className="w-4 h-4 mr-2" />
                  Inicializar Engine
                </Button>
              ) : (
                <>
                  {!isRendering ? (
                    <Button onClick={startRendering} disabled={!isInitialized}>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Renderização
                    </Button>
                  ) : (
                    <Button onClick={stopRendering} variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                  
                  <Button onClick={resetEngine} variant="destructive" size="sm">
                    <Square className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas de Renderização */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Canvas de Renderização
            </CardTitle>
            <CardDescription>
              {renderingConfig.width}x{renderingConfig.height} @ {renderingConfig.fps}fps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.fps}</div>
                <div className="text-sm text-muted-foreground">FPS</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.frameTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-muted-foreground">Frame Time</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memória GPU</span>
                  <span>{stats.memoryUsed.toFixed(1)} MB</span>
                </div>
                <Progress value={(stats.memoryUsed / renderingConfig.maxMemoryUsage) * 100} />
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Draw Calls:</span>
                  <span>{stats.drawCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span>Triângulos:</span>
                  <span>{stats.triangles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Texture Swaps:</span>
                  <span>{stats.textureSwaps}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações e Efeitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rendering" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rendering">Renderização</TabsTrigger>
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
              <TabsTrigger value="webgl">WebGL Info</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="rendering" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Resolução</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <input
                          type="number"
                          value={renderingConfig.width}
                          onChange={(e) => setRenderingConfig(prev => ({
                            ...prev,
                            width: parseInt(e.target.value) || 1920
                          }))}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Largura"
                          disabled={isInitialized}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={renderingConfig.height}
                          onChange={(e) => setRenderingConfig(prev => ({
                            ...prev,
                            height: parseInt(e.target.value) || 1080
                          }))}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Altura"
                          disabled={isInitialized}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">FPS Target</label>
                    <Slider
                      value={[renderingConfig.fps]}
                      onValueChange={(value) => setRenderingConfig(prev => ({
                        ...prev,
                        fps: value[0]
                      }))}
                      min={24}
                      max={120}
                      step={1}
                      className="mt-2"
                      disabled={isInitialized}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {renderingConfig.fps} fps
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Qualidade</label>
                    <select
                      value={renderingConfig.quality}
                      onChange={(e) => setRenderingConfig(prev => ({
                        ...prev,
                        quality: e.target.value as any
                      }))}
                      className="w-full mt-2 px-3 py-2 border rounded-md"
                      disabled={isInitialized}
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="ultra">Ultra</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Antialiasing</span>
                      <Switch
                        checked={renderingConfig.antialiasing}
                        onCheckedChange={(checked) => setRenderingConfig(prev => ({
                          ...prev,
                          antialiasing: checked
                        }))}
                        disabled={isInitialized}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">WebGL 2.0</span>
                      <Switch
                        checked={renderingConfig.useWebGL2}
                        onCheckedChange={(checked) => setRenderingConfig(prev => ({
                          ...prev,
                          useWebGL2: checked
                        }))}
                        disabled={isInitialized}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">WebAssembly</span>
                      <Switch
                        checked={renderingConfig.enableWebAssembly}
                        onCheckedChange={(checked) => setRenderingConfig(prev => ({
                          ...prev,
                          enableWebAssembly: checked
                        }))}
                        disabled={isInitialized}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Blur Effect */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Blur Gaussiano
                      </span>
                      <Switch
                        checked={effectsSettings.blur.enabled}
                        onCheckedChange={(checked) => toggleEffect('blur', checked)}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium">Raio do Blur</label>
                      <Slider
                        value={[effectsSettings.blur.radius]}
                        onValueChange={(value) => updateEffectSettings('blur', 'blurRadius', value[0])}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="mt-2"
                        disabled={!effectsSettings.blur.enabled}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {effectsSettings.blur.radius.toFixed(1)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Color Correction */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Correção de Cor
                      </span>
                      <Switch
                        checked={effectsSettings.colorCorrection.enabled}
                        onCheckedChange={(checked) => toggleEffect('colorCorrection', checked)}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Brilho</label>
                      <Slider
                        value={[effectsSettings.colorCorrection.brightness]}
                        onValueChange={(value) => updateEffectSettings('colorCorrection', 'brightness', value[0])}
                        min={-1}
                        max={1}
                        step={0.01}
                        className="mt-2"
                        disabled={!effectsSettings.colorCorrection.enabled}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {effectsSettings.colorCorrection.brightness.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Contraste</label>
                      <Slider
                        value={[effectsSettings.colorCorrection.contrast]}
                        onValueChange={(value) => updateEffectSettings('colorCorrection', 'contrast', value[0])}
                        min={0}
                        max={3}
                        step={0.01}
                        className="mt-2"
                        disabled={!effectsSettings.colorCorrection.enabled}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {effectsSettings.colorCorrection.contrast.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Saturação</label>
                      <Slider
                        value={[effectsSettings.colorCorrection.saturation]}
                        onValueChange={(value) => updateEffectSettings('colorCorrection', 'saturation', value[0])}
                        min={0}
                        max={2}
                        step={0.01}
                        className="mt-2"
                        disabled={!effectsSettings.colorCorrection.enabled}
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {effectsSettings.colorCorrection.saturation.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="webgl" className="space-y-4">
              {webglInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Dispositivo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Versão WebGL:</span>
                        <Badge className="ml-2">{webglInfo.version}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Renderer:</span>
                        <p className="text-sm text-muted-foreground mt-1">{webglInfo.renderer}</p>
                      </div>
                      <div>
                        <span className="font-medium">Vendor:</span>
                        <p className="text-sm text-muted-foreground mt-1">{webglInfo.vendor}</p>
                      </div>
                      <div>
                        <span className="font-medium">Max Texture Size:</span>
                        <span className="ml-2">{webglInfo.maxTextureSize}px</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Extensões Suportadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-60 overflow-y-auto">
                        <div className="grid gap-1">
                          {webglInfo.supportedExtensions.slice(0, 20).map((ext, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ext}
                            </Badge>
                          ))}
                          {webglInfo.supportedExtensions.length > 20 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              E mais {webglInfo.supportedExtensions.length - 20} extensões...
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Engine não inicializada. Inicialize a engine para ver informações do WebGL.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Configurações avançadas - altere apenas se souber o que está fazendo.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Limite de Memória GPU (MB)</label>
                  <Slider
                    value={[renderingConfig.maxMemoryUsage]}
                    onValueChange={(value) => setRenderingConfig(prev => ({
                      ...prev,
                      maxMemoryUsage: value[0]
                    }))}
                    min={128}
                    max={2048}
                    step={64}
                    className="mt-2"
                    disabled={isInitialized}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {renderingConfig.maxMemoryUsage} MB
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profiling Ativo</span>
                    <Switch
                      checked={renderingConfig.enableProfiling}
                      onCheckedChange={(checked) => setRenderingConfig(prev => ({
                        ...prev,
                        enableProfiling: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mostrar Estatísticas</span>
                    <Switch
                      checked={renderingConfig.showStats}
                      onCheckedChange={(checked) => setRenderingConfig(prev => ({
                        ...prev,
                        showStats: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pós-processamento</span>
                    <Switch
                      checked={renderingConfig.enablePostProcessing}
                      onCheckedChange={(checked) => setRenderingConfig(prev => ({
                        ...prev,
                        enablePostProcessing: checked
                      }))}
                      disabled={isInitialized}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenderingControls;