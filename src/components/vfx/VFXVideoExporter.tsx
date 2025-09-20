import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Download,
  Film,
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileVideo,
  Zap,
  HardDrive,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

// Import VFX components for rendering
import { GSAPAnimations } from './GSAPAnimations';
import { ThreeJSParticles } from './ThreeJSParticles';
import { GreenScreenIntegration } from './GreenScreenIntegration';
import { TemplateMotionGraphics } from './TemplateMotionGraphics';

interface VFXLayer {
  id: string;
  name: string;
  type: 'gsap' | 'particles' | 'greenscreen' | 'motion-graphics';
  enabled: boolean;
  opacity: number;
  blendMode: string;
  startTime: number;
  duration: number;
  settings: any;
}

interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov' | 'gif';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: { width: number; height: number };
  frameRate: number;
  bitrate: number;
  codec: string;
  duration: number;
  includeAudio: boolean;
  backgroundColor: string;
}

interface ExportProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  timeRemaining: number;
  message: string;
}

interface VFXVideoExporterProps {
  layers: VFXLayer[];
  globalSettings: {
    resolution: { width: number; height: number };
    frameRate: number;
    duration: number;
    backgroundColor: string;
  };
  onExportComplete?: (videoBlob: Blob, settings: ExportSettings) => void;
  onExportError?: (error: Error) => void;
}

const exportFormats = [
  { value: 'mp4', label: 'MP4 (H.264)', description: 'Melhor compatibilidade' },
  { value: 'webm', label: 'WebM (VP9)', description: 'Otimizado para web' },
  { value: 'mov', label: 'MOV (ProRes)', description: 'Alta qualidade' },
  { value: 'gif', label: 'GIF Animado', description: 'Para redes sociais' }
];

const qualityPresets = [
  { value: 'low', label: 'Baixa', bitrate: 1000, description: 'Arquivo pequeno' },
  { value: 'medium', label: 'Média', bitrate: 2500, description: 'Balanceado' },
  { value: 'high', label: 'Alta', bitrate: 5000, description: 'Boa qualidade' },
  { value: 'ultra', label: 'Ultra', bitrate: 10000, description: 'Máxima qualidade' }
];

const resolutionPresets = [
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'HD', width: 1280, height: 720 },
  { name: 'SD', width: 854, height: 480 },
  { name: 'Square', width: 1080, height: 1080 },
  { name: 'Vertical', width: 1080, height: 1920 }
];

const defaultExportSettings: ExportSettings = {
  format: 'mp4',
  quality: 'high',
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  bitrate: 5000,
  codec: 'h264',
  duration: 10,
  includeAudio: false,
  backgroundColor: '#000000'
};

const VFXRenderer: React.FC<{
  layers: VFXLayer[];
  currentTime: number;
  settings: ExportSettings;
  onFrameRendered?: (frameData: ImageData) => void;
}> = ({ layers, currentTime, settings, onFrameRendered }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  const renderFrame = useCallback(async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);

    try {
      // Clear canvas with background color
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render each layer
      for (const layer of layers.filter(l => l.enabled)) {
        // Check if layer should be visible at current time
        if (currentTime < layer.startTime || currentTime > layer.startTime + layer.duration) {
          continue;
        }

        // Calculate layer progress (0-1)
        const layerProgress = (currentTime - layer.startTime) / layer.duration;

        // Save context state
        ctx.save();

        // Apply layer opacity
        ctx.globalAlpha = layer.opacity;

        // Apply blend mode
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

        // Render layer based on type
        await renderLayer(ctx, layer, layerProgress, settings);

        // Restore context state
        ctx.restore();
      }

      // Get frame data and notify parent
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      onFrameRendered?.(imageData);

    } catch (error) {
      console.error('Error rendering frame:', error);
    } finally {
      setIsRendering(false);
    }
  }, [layers, currentTime, settings, onFrameRendered]);

  const renderLayer = async (
    ctx: CanvasRenderingContext2D,
    layer: VFXLayer,
    progress: number,
    settings: ExportSettings
  ) => {
    const { width, height } = settings.resolution;

    switch (layer.type) {
      case 'gsap':
        await renderGSAPLayer(ctx, layer, progress, width, height);
        break;
      case 'particles':
        await renderParticlesLayer(ctx, layer, progress, width, height);
        break;
      case 'greenscreen':
        await renderGreenScreenLayer(ctx, layer, progress, width, height);
        break;
      case 'motion-graphics':
        await renderMotionGraphicsLayer(ctx, layer, progress, width, height);
        break;
    }
  };

  const renderGSAPLayer = async (
    ctx: CanvasRenderingContext2D,
    layer: VFXLayer,
    progress: number,
    width: number,
    height: number
  ) => {
    const { settings } = layer;
    const { animation, color, easing } = settings;

    // Calculate animation progress with easing
    let easedProgress = progress;
    
    // Apply basic easing functions
    switch (easing) {
      case 'power2.out':
        easedProgress = 1 - Math.pow(1 - progress, 2);
        break;
      case 'power3.out':
        easedProgress = 1 - Math.pow(1 - progress, 3);
        break;
      case 'bounce.out':
        easedProgress = bounceOut(progress);
        break;
      default:
        easedProgress = progress;
    }

    // Render based on animation type
    ctx.fillStyle = color || '#ff6b35';
    
    switch (animation) {
      case 'fadeIn':
        ctx.globalAlpha *= easedProgress;
        ctx.fillRect(width * 0.25, height * 0.25, width * 0.5, height * 0.5);
        break;
      case 'slideIn':
        const x = width * (1 - easedProgress);
        ctx.fillRect(x, height * 0.4, width * 0.6, height * 0.2);
        break;
      case 'scaleIn':
        const scale = easedProgress;
        const scaledWidth = width * 0.5 * scale;
        const scaledHeight = height * 0.5 * scale;
        ctx.fillRect(
          width * 0.5 - scaledWidth * 0.5,
          height * 0.5 - scaledHeight * 0.5,
          scaledWidth,
          scaledHeight
        );
        break;
      case 'rotateIn':
        ctx.save();
        ctx.translate(width * 0.5, height * 0.5);
        ctx.rotate(easedProgress * Math.PI * 2);
        ctx.fillRect(-50, -50, 100, 100);
        ctx.restore();
        break;
    }
  };

  const renderParticlesLayer = async (
    ctx: CanvasRenderingContext2D,
    layer: VFXLayer,
    progress: number,
    width: number,
    height: number
  ) => {
    const { settings } = layer;
    const { effectType, particleCount, size, speed, color } = settings;

    const particles = generateParticles(particleCount || 100, width, height, progress, effectType);
    
    ctx.fillStyle = color || '#9d4edd';
    
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha *= particle.alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, (size || 2) * particle.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const renderGreenScreenLayer = async (
    ctx: CanvasRenderingContext2D,
    layer: VFXLayer,
    progress: number,
    width: number,
    height: number
  ) => {
    // Green screen rendering would require video input
    // For now, render a placeholder
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Green Screen Layer', width / 2, height / 2);
  };

  const renderMotionGraphicsLayer = async (
    ctx: CanvasRenderingContext2D,
    layer: VFXLayer,
    progress: number,
    width: number,
    height: number
  ) => {
    const { settings } = layer;
    const { text, fontSize, fontFamily, color, scale } = settings;

    ctx.fillStyle = color || '#ffffff';
    ctx.font = `${(fontSize || 48) * (scale || 1)}px ${fontFamily || 'Arial'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Animate text appearance
    const chars = (text || 'Motion Graphics').split('');
    const charsToShow = Math.floor(chars.length * progress);
    const visibleText = chars.slice(0, charsToShow).join('');
    
    ctx.fillText(visibleText, width / 2, height / 2);
  };

  const generateParticles = (
    count: number,
    width: number,
    height: number,
    progress: number,
    effectType: string
  ) => {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const t = (progress + i / count) % 1;
      
      let particle;
      switch (effectType) {
        case 'sparkles':
          particle = {
            x: Math.random() * width,
            y: Math.random() * height,
            alpha: Math.sin(t * Math.PI),
            scale: 0.5 + Math.sin(t * Math.PI * 2) * 0.5
          };
          break;
        case 'fire':
          particle = {
            x: width * 0.5 + (Math.random() - 0.5) * 100,
            y: height - t * height * 1.5,
            alpha: 1 - t,
            scale: 1 + t
          };
          break;
        case 'snow':
          particle = {
            x: (Math.random() * width + t * 50) % width,
            y: (t * height * 1.2) % height,
            alpha: 0.8,
            scale: 0.5 + Math.random() * 0.5
          };
          break;
        default:
          particle = {
            x: Math.random() * width,
            y: Math.random() * height,
            alpha: 0.5,
            scale: 1
          };
      }
      
      particles.push(particle);
    }
    
    return particles;
  };

  const bounceOut = (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  };

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={settings.resolution.width}
      height={settings.resolution.height}
      style={{
        width: '100%',
        height: 'auto',
        maxHeight: '300px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}
    />
  );
};

export const VFXVideoExporter: React.FC<VFXVideoExporterProps> = ({
  layers,
  globalSettings,
  onExportComplete,
  onExportError
}) => {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    ...defaultExportSettings,
    ...globalSettings
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    stage: 'preparing',
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    timeRemaining: 0,
    message: 'Preparando exportação...'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportedVideo, setExportedVideo] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setExportSettings(prev => ({
      ...prev,
      ...globalSettings
    }));
  }, [globalSettings]);

  const updateExportSetting = useCallback((key: keyof ExportSettings, value: any) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const startPreview = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    startTimeRef.current = Date.now() - previewTime * 1000;
    
    const updatePreview = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      if (elapsed >= exportSettings.duration) {
        setPreviewTime(0);
        setIsPlaying(false);
        return;
      }
      
      setPreviewTime(elapsed);
      animationFrameRef.current = requestAnimationFrame(updatePreview);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePreview);
  }, [isPlaying, previewTime, exportSettings.duration]);

  const pausePreview = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resetPreview = useCallback(() => {
    setIsPlaying(false);
    setPreviewTime(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const startExport = useCallback(async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportedVideo(null);
    chunksRef.current = [];
    
    try {
      setExportProgress({
        stage: 'preparing',
        progress: 0,
        currentFrame: 0,
        totalFrames: Math.floor(exportSettings.duration * exportSettings.frameRate),
        timeRemaining: 0,
        message: 'Preparando exportação...'
      });

      // Create a canvas for recording
      const canvas = document.createElement('canvas');
      canvas.width = exportSettings.resolution.width;
      canvas.height = exportSettings.resolution.height;
      
      const stream = canvas.captureStream(exportSettings.frameRate);
      
      // Setup MediaRecorder
      const mimeType = exportSettings.format === 'webm' ? 'video/webm' : 'video/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: exportSettings.bitrate * 1000
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setExportedVideo(blob);
        onExportComplete?.(blob, exportSettings);
        
        setExportProgress({
          stage: 'completed',
          progress: 100,
          currentFrame: exportProgress.totalFrames,
          totalFrames: exportProgress.totalFrames,
          timeRemaining: 0,
          message: 'Exportação concluída!'
        });
        
        toast.success('Vídeo exportado com sucesso!');
      };
      
      mediaRecorderRef.current.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        onExportError?.(new Error('Erro na gravação do vídeo'));
        
        setExportProgress({
          stage: 'error',
          progress: 0,
          currentFrame: 0,
          totalFrames: 0,
          timeRemaining: 0,
          message: 'Erro na exportação'
        });
        
        toast.error('Erro ao exportar vídeo');
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      
      setExportProgress(prev => ({
        ...prev,
        stage: 'rendering',
        message: 'Renderizando frames...'
      }));
      
      // Render frames
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      const totalFrames = Math.floor(exportSettings.duration * exportSettings.frameRate);
      const frameTime = 1 / exportSettings.frameRate;
      
      for (let frame = 0; frame < totalFrames; frame++) {
        const currentTime = frame * frameTime;
        const progress = (frame / totalFrames) * 100;
        
        // Clear canvas
        ctx.fillStyle = exportSettings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render layers (simplified version)
        for (const layer of layers.filter(l => l.enabled)) {
          if (currentTime >= layer.startTime && currentTime <= layer.startTime + layer.duration) {
            // Basic layer rendering - in a real implementation, this would be more sophisticated
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.fillStyle = layer.settings.color || '#ffffff';
            
            switch (layer.type) {
              case 'motion-graphics':
                ctx.font = `${layer.settings.fontSize || 48}px ${layer.settings.fontFamily || 'Arial'}`;
                ctx.textAlign = 'center';
                ctx.fillText(
                  layer.settings.text || 'Motion Graphics',
                  canvas.width / 2,
                  canvas.height / 2
                );
                break;
              default:
                ctx.fillRect(
                  canvas.width * 0.25,
                  canvas.height * 0.25,
                  canvas.width * 0.5,
                  canvas.height * 0.5
                );
            }
            
            ctx.restore();
          }
        }
        
        // Update progress
        setExportProgress({
          stage: 'rendering',
          progress,
          currentFrame: frame,
          totalFrames,
          timeRemaining: ((totalFrames - frame) / exportSettings.frameRate),
          message: `Renderizando frame ${frame + 1} de ${totalFrames}`
        });
        
        // Wait for next frame
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps rendering
      }
      
      setExportProgress(prev => ({
        ...prev,
        stage: 'encoding',
        message: 'Codificando vídeo...'
      }));
      
      // Stop recording
      mediaRecorderRef.current.stop();
      
    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(error as Error);
      
      setExportProgress({
        stage: 'error',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        timeRemaining: 0,
        message: 'Erro na exportação'
      });
      
      toast.error('Erro ao exportar vídeo');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, exportSettings, layers, onExportComplete, onExportError, exportProgress.totalFrames]);

  const cancelExport = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsExporting(false);
    toast.info('Exportação cancelada');
  }, []);

  const downloadVideo = useCallback(() => {
    if (!exportedVideo) return;
    
    const url = URL.createObjectURL(exportedVideo);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vfx-video-${Date.now()}.${exportSettings.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Download iniciado!');
  }, [exportedVideo, exportSettings.format]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedFileSize = (
    exportSettings.bitrate * exportSettings.duration * 1000 / 8
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="w-5 h-5" />
            Exportador de Vídeo VFX
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure e exporte seu projeto VFX como vídeo
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isPlaying ? pausePreview : startPreview}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={resetPreview}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <VFXRenderer
              layers={layers}
              currentTime={previewTime}
              settings={exportSettings}
            />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(previewTime)}</span>
                <span>{formatTime(exportSettings.duration)}</span>
              </div>
              <Progress 
                value={(previewTime / exportSettings.duration) * 100} 
                className="h-2"
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Export Settings */}
          <div className="space-y-6">
            <h3 className="font-medium">Configurações de Exportação</h3>
            
            {/* Format and Quality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value) => updateExportSetting('format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        <div>
                          <div>{format.label}</div>
                          <div className="text-xs text-gray-500">{format.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Qualidade</Label>
                <Select
                  value={exportSettings.quality}
                  onValueChange={(value) => {
                    const preset = qualityPresets.find(p => p.value === value);
                    if (preset) {
                      updateExportSetting('quality', value);
                      updateExportSetting('bitrate', preset.bitrate);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityPresets.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        <div>
                          <div>{preset.label}</div>
                          <div className="text-xs text-gray-500">{preset.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Resolution */}
            <div className="space-y-4">
              <Label>Resolução</Label>
              <div className="space-y-2">
                <Select onValueChange={(value) => {
                  const preset = resolutionPresets.find(p => p.name === value);
                  if (preset) {
                    updateExportSetting('resolution', { width: preset.width, height: preset.height });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionPresets.map(preset => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name} ({preset.width}x{preset.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Largura</Label>
                    <Input
                      type="number"
                      value={exportSettings.resolution.width}
                      onChange={(e) => updateExportSetting('resolution', {
                        ...exportSettings.resolution,
                        width: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Altura</Label>
                    <Input
                      type="number"
                      value={exportSettings.resolution.height}
                      onChange={(e) => updateExportSetting('resolution', {
                        ...exportSettings.resolution,
                        height: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Advanced Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Frame Rate: {exportSettings.frameRate} FPS</Label>
                <Slider
                  value={[exportSettings.frameRate]}
                  onValueChange={([value]) => updateExportSetting('frameRate', value)}
                  min={15}
                  max={60}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Duração: {exportSettings.duration}s</Label>
                <Slider
                  value={[exportSettings.duration]}
                  onValueChange={([value]) => updateExportSetting('duration', value)}
                  min={1}
                  max={60}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Bitrate: {exportSettings.bitrate} kbps</Label>
                <Slider
                  value={[exportSettings.bitrate]}
                  onValueChange={([value]) => updateExportSetting('bitrate', value)}
                  min={500}
                  max={20000}
                  step={100}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <input
                  type="color"
                  value={exportSettings.backgroundColor}
                  onChange={(e) => updateExportSetting('backgroundColor', e.target.value)}
                  className="w-full h-10 rounded border"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={exportSettings.includeAudio}
                  onCheckedChange={(checked) => updateExportSetting('includeAudio', checked)}
                  id="include-audio"
                />
                <Label htmlFor="include-audio">Incluir Áudio</Label>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Export Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Informações da Exportação</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Monitor className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">
                  {exportSettings.resolution.width}x{exportSettings.resolution.height}
                </div>
                <div className="text-xs text-gray-500">Resolução</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{exportSettings.duration}s</div>
                <div className="text-xs text-gray-500">Duração</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Zap className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{exportSettings.frameRate} FPS</div>
                <div className="text-xs text-gray-500">Frame Rate</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <HardDrive className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{formatFileSize(estimatedFileSize)}</div>
                <div className="text-xs text-gray-500">Tamanho Est.</div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Export Controls */}
          <div className="space-y-4">
            {!isExporting && !exportedVideo && (
              <Button 
                onClick={startExport} 
                className="w-full"
                disabled={layers.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Iniciar Exportação
              </Button>
            )}
            
            {isExporting && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {exportProgress.stage === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <span className="font-medium">{exportProgress.message}</span>
                  </div>
                  
                  <Button size="sm" variant="outline" onClick={cancelExport}>
                    <Square className="w-4 h-4" />
                    Cancelar
                  </Button>
                </div>
                
                <Progress value={exportProgress.progress} className="h-3" />
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Frame {exportProgress.currentFrame} de {exportProgress.totalFrames}
                  </span>
                  <span>
                    {exportProgress.timeRemaining > 0 && 
                      `Tempo restante: ${formatTime(exportProgress.timeRemaining)}`
                    }
                  </span>
                </div>
              </div>
            )}
            
            {exportedVideo && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">Exportação Concluída!</div>
                    <div className="text-sm text-green-600">
                      Vídeo pronto para download ({formatFileSize(exportedVideo.size)})
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={downloadVideo} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setExportedVideo(null)}
                  >
                    Nova Exportação
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VFXVideoExporter;