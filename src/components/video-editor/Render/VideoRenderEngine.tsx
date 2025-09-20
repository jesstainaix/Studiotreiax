import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { 
  Play,
  Download,
  Settings,
  Video,
  Film,
  Image,
  Music,
  FileVideo,
  Monitor,
  Smartphone,
  Tablet,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Upload,
  Cloud,
  HardDrive,
  Wifi,
  Clock,
  Zap,
  Gauge,
  Activity,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Pause,
  Square,
  RotateCcw,
  Share2,
  Copy,
  Folder,
  FolderOpen,
  Save,
  Archive,
  Package,
  Layers,
  Cpu,
  MemoryStick,
  Database,
  Server,
  Globe,
  Link,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  MoreHorizontal,
  Filter,
  Search,
  Calendar,
  User,
  Users,
  Tag,
  Bookmark,
  Star,
  Heart,
  ThumbsUp,
  Info,
  HelpCircle,
  RefreshCw,
  Trash2,
  Edit,
  FileText,
  Lock,
  Unlock,
  Shield,
  Key
} from 'lucide-react';

// Tipos para renderização
interface RenderJob {
  id: string;
  name: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  settings: RenderSettings;
  outputPath?: string;
  fileSize?: number;
  estimatedTime?: number;
  remainingTime?: number;
  speed?: number;
  error?: string;
}

interface RenderSettings {
  // Video settings
  format: string;
  codec: string;
  resolution: string;
  fps: number;
  bitrate: number;
  quality: string;
  
  // Audio settings
  audioCodec: string;
  audioSampleRate: number;
  audioBitrate: number;
  audioChannels: number;
  
  // Export settings
  outputPath: string;
  filename: string;
  includeSubtitles: boolean;
  
  // Advanced settings
  hardwareAcceleration: boolean;
  multipass: boolean;
  customFFmpegArgs?: string;
  watermark?: WatermarkSettings;
  
  // Platform presets
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'custom';
}

interface WatermarkSettings {
  enabled: boolean;
  type: 'image' | 'text';
  content: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  size: number;
}

interface ExportPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: Partial<RenderSettings>;
  platform?: string;
  recommended?: boolean;
  maxDuration?: number;
  maxFileSize?: number;
}

interface VideoRenderEngineProps {
  projectData?: any;
  onRenderStart: (settings: RenderSettings) => void;
  onRenderComplete: (job: RenderJob) => void;
  className?: string;
}

const VideoRenderEngine: React.FC<VideoRenderEngineProps> = ({
  projectData,
  onRenderStart,
  onRenderComplete,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'settings' | 'presets' | 'queue' | 'history'>('settings');
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    format: 'mp4',
    codec: 'h264',
    resolution: '1920x1080',
    fps: 30,
    bitrate: 5000,
    quality: 'high',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrate: 192,
    audioChannels: 2,
    outputPath: '',
    filename: '',
    includeSubtitles: false,
    hardwareAcceleration: true,
    multipass: false
  });
  
  const [renderQueue, setRenderQueue] = useState<RenderJob[]>([]);
  const [renderHistory, setRenderHistory] = useState<RenderJob[]>([]);
  const [currentRender, setCurrentRender] = useState<RenderJob | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedFileSize, setEstimatedFileSize] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Presets de exportação
  const exportPresets: ExportPreset[] = useMemo(() => [
    {
      id: 'youtube-4k',
      name: 'YouTube 4K',
      description: 'Qualidade máxima para YouTube (4K 60fps)',
      icon: <Youtube className="w-5 h-5 text-red-500" />,
      platform: 'youtube',
      recommended: true,
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '3840x2160',
        fps: 60,
        bitrate: 25000,
        quality: 'high',
        audioCodec: 'aac',
        audioBitrate: 320
      }
    },
    {
      id: 'youtube-1080p',
      name: 'YouTube HD',
      description: 'Padrão HD para YouTube (1080p 30fps)',
      icon: <Youtube className="w-5 h-5 text-red-500" />,
      platform: 'youtube',
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1920x1080',
        fps: 30,
        bitrate: 8000,
        quality: 'high',
        audioCodec: 'aac',
        audioBitrate: 192
      }
    },
    {
      id: 'instagram-story',
      name: 'Instagram Stories',
      description: 'Formato vertical para Stories (1080x1920)',
      icon: <Instagram className="w-5 h-5 text-pink-500" />,
      platform: 'instagram',
      maxDuration: 15,
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1080x1920',
        fps: 30,
        bitrate: 3500,
        quality: 'medium'
      }
    },
    {
      id: 'instagram-feed',
      name: 'Instagram Feed',
      description: 'Quadrado para feed do Instagram (1080x1080)',
      icon: <Instagram className="w-5 h-5 text-pink-500" />,
      platform: 'instagram',
      maxDuration: 60,
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1080x1080',
        fps: 30,
        bitrate: 3500,
        quality: 'medium'
      }
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Formato vertical para TikTok (1080x1920)',
      icon: <Video className="w-5 h-5" />,
      platform: 'tiktok',
      maxDuration: 180,
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1080x1920',
        fps: 30,
        bitrate: 4000,
        quality: 'medium'
      }
    },
    {
      id: 'facebook-hd',
      name: 'Facebook HD',
      description: 'Alta qualidade para Facebook (1080p)',
      icon: <Facebook className="w-5 h-5 text-blue-500" />,
      platform: 'facebook',
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1920x1080',
        fps: 30,
        bitrate: 6000,
        quality: 'high'
      }
    },
    {
      id: 'twitter',
      name: 'Twitter',
      description: 'Otimizado para Twitter (720p)',
      icon: <Twitter className="w-5 h-5 text-blue-400" />,
      platform: 'twitter',
      maxDuration: 140,
      maxFileSize: 512,
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1280x720',
        fps: 30,
        bitrate: 2000,
        quality: 'medium'
      }
    },
    {
      id: 'web-optimized',
      name: 'Web Otimizado',
      description: 'Pequeno e rápido para web (720p)',
      icon: <Globe className="w-5 h-5 text-green-500" />,
      settings: {
        format: 'mp4',
        codec: 'h264',
        resolution: '1280x720',
        fps: 30,
        bitrate: 1500,
        quality: 'medium'
      }
    }
  ], []);

  // Formatos disponíveis
  const videoFormats = [
    { id: 'mp4', name: 'MP4', description: 'Mais compatível' },
    { id: 'mov', name: 'MOV', description: 'Apple QuickTime' },
    { id: 'avi', name: 'AVI', description: 'Windows padrão' },
    { id: 'mkv', name: 'MKV', description: 'Alta qualidade' },
    { id: 'webm', name: 'WebM', description: 'Web otimizado' }
  ];

  const videoCodecs = [
    { id: 'h264', name: 'H.264', description: 'Mais compatível' },
    { id: 'h265', name: 'H.265/HEVC', description: 'Menor tamanho' },
    { id: 'vp9', name: 'VP9', description: 'Open source' },
    { id: 'prores', name: 'ProRes', description: 'Profissional' }
  ];

  const resolutions = [
    { id: '3840x2160', name: '4K UHD', width: 3840, height: 2160 },
    { id: '2560x1440', name: '1440p', width: 2560, height: 1440 },
    { id: '1920x1080', name: '1080p HD', width: 1920, height: 1080 },
    { id: '1280x720', name: '720p HD', width: 1280, height: 720 },
    { id: '1080x1920', name: 'Vertical HD', width: 1080, height: 1920 },
    { id: '1080x1080', name: 'Quadrado HD', width: 1080, height: 1080 }
  ];

  // Calcular estimativas
  const calculateEstimates = useCallback(() => {
    const duration = projectData?.duration || 60; // segundos
    const videoBitrate = renderSettings.bitrate * 1000; // bps
    const audioBitrate = renderSettings.audioBitrate * 1000; // bps
    const totalBitrate = videoBitrate + audioBitrate;
    
    // Tamanho estimado em bytes
    const sizeBytes = (totalBitrate * duration) / 8;
    setEstimatedFileSize(sizeBytes);
    
    // Tempo estimado baseado na complexidade
    const complexity = renderSettings.quality === 'high' ? 2 : 
                      renderSettings.quality === 'medium' ? 1.5 : 1;
    const hwAcceleration = renderSettings.hardwareAcceleration ? 0.3 : 1;
    const multipassFactor = renderSettings.multipass ? 2 : 1;
    
    const baseTime = duration * complexity * hwAcceleration * multipassFactor;
    setEstimatedTime(baseTime);
  }, [renderSettings, projectData]);

  useEffect(() => {
    calculateEstimates();
  }, [calculateEstimates]);

  // Aplicar preset
  const applyPreset = useCallback((preset: ExportPreset) => {
    setRenderSettings(prev => ({
      ...prev,
      ...preset.settings,
      platform: preset.platform as any
    }));
  }, []);

  // Iniciar renderização
  const startRender = useCallback(() => {
    const newJob: RenderJob = {
      id: `render-${Date.now()}`,
      name: renderSettings.filename || `video-${Date.now()}`,
      status: 'queued',
      progress: 0,
      startTime: new Date(),
      settings: { ...renderSettings },
      estimatedTime: estimatedTime
    };

    setRenderQueue(prev => [...prev, newJob]);
    onRenderStart(renderSettings);

    // Simular progresso de renderização
    setCurrentRender(newJob);
    simulateRenderProgress(newJob);
  }, [renderSettings, estimatedTime, onRenderStart]);

  // Simular progresso (em produção seria conectado ao backend real)
  const simulateRenderProgress = useCallback((job: RenderJob) => {
    const interval = setInterval(() => {
      setCurrentRender(currentJob => {
        if (!currentJob || currentJob.id !== job.id) {
          clearInterval(interval);
          return currentJob;
        }

        const newProgress = Math.min(currentJob.progress + Math.random() * 5, 100);
        const updatedJob = {
          ...currentJob,
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : 'rendering' as any,
          endTime: newProgress >= 100 ? new Date() : undefined,
          remainingTime: newProgress < 100 ? ((100 - newProgress) / 100) * estimatedTime : 0,
          speed: Math.random() * 2 + 0.5 // velocidade em x
        };

        if (newProgress >= 100) {
          setRenderHistory(prev => [...prev, updatedJob]);
          setRenderQueue(prev => prev.filter(j => j.id !== job.id));
          onRenderComplete(updatedJob);
          clearInterval(interval);
        }

        return updatedJob;
      });
    }, 1000);
  }, [estimatedTime, onRenderComplete]);

  // Formatadores
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Renderização e Exportação</h2>
          
          {currentRender && (
            <div className="flex items-center space-x-2">
              <Badge 
                variant={currentRender.status === 'rendering' ? 'default' : 'secondary'}
                className={currentRender.status === 'rendering' ? 'bg-blue-600' : ''}
              >
                {currentRender.status === 'rendering' ? 'Renderizando' : 'Processando'}
              </Badge>
              <span className="text-sm text-gray-300">
                {Math.round(currentRender.progress)}%
              </span>
            </div>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="settings" className="text-sm">Configurações</TabsTrigger>
            <TabsTrigger value="presets" className="text-sm">Presets</TabsTrigger>
            <TabsTrigger value="queue" className="text-sm">
              Fila {renderQueue.length > 0 && `(${renderQueue.length})`}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Configurações detalhadas */}
          <TabsContent value="settings" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Configurações de vídeo */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Configurações de Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Formato</label>
                    <select
                      value={renderSettings.format}
                      onChange={(e) => setRenderSettings(prev => ({ ...prev, format: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {videoFormats.map(format => (
                        <option key={format.id} value={format.id}>
                          {format.name} - {format.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Codec</label>
                    <select
                      value={renderSettings.codec}
                      onChange={(e) => setRenderSettings(prev => ({ ...prev, codec: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {videoCodecs.map(codec => (
                        <option key={codec.id} value={codec.id}>
                          {codec.name} - {codec.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Resolução</label>
                    <select
                      value={renderSettings.resolution}
                      onChange={(e) => setRenderSettings(prev => ({ ...prev, resolution: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {resolutions.map(res => (
                        <option key={res.id} value={res.id}>
                          {res.name} ({res.width}x{res.height})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">FPS</label>
                    <select
                      value={renderSettings.fps}
                      onChange={(e) => setRenderSettings(prev => ({ ...prev, fps: Number(e.target.value) }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value={24}>24 fps (Cinema)</option>
                      <option value={25}>25 fps (PAL)</option>
                      <option value={30}>30 fps (NTSC)</option>
                      <option value={60}>60 fps (Suave)</option>
                      <option value={120}>120 fps (Slow Motion)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Bitrate de Vídeo: {renderSettings.bitrate} kbps
                  </label>
                  <Slider
                    value={[renderSettings.bitrate]}
                    onValueChange={(value) => setRenderSettings(prev => ({ ...prev, bitrate: value[0] }))}
                    min={500}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Qualidade</label>
                  <div className="flex space-x-2">
                    {['low', 'medium', 'high', 'ultra'].map(quality => (
                      <Button
                        key={quality}
                        variant={renderSettings.quality === quality ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRenderSettings(prev => ({ ...prev, quality }))}
                        className={renderSettings.quality === quality 
                          ? "bg-blue-600 border-blue-500" 
                          : "bg-gray-700 border-gray-600"
                        }
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de áudio */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Configurações de Áudio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Codec de Áudio</label>
                    <select
                      value={renderSettings.audioCodec}
                      onChange={(e) => setRenderSettings(prev => ({ ...prev, audioCodec: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="aac">AAC (Padrão)</option>
                      <option value="mp3">MP3 (Compatível)</option>
                      <option value="flac">FLAC (Sem perda)</option>
                      <option value="opus">Opus (Eficiente)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Sample Rate</label>
                    <select
                      value={renderSettings.audioSampleRate}
                      onChange={(e) => setRenderSettings(prev => ({ ...prev, audioSampleRate: Number(e.target.value) }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value={44100}>44.1 kHz (CD)</option>
                      <option value={48000}>48 kHz (Profissional)</option>
                      <option value={96000}>96 kHz (Alta qualidade)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Bitrate de Áudio: {renderSettings.audioBitrate} kbps
                  </label>
                  <Slider
                    value={[renderSettings.audioBitrate]}
                    onValueChange={(value) => setRenderSettings(prev => ({ ...prev, audioBitrate: value[0] }))}
                    min={64}
                    max={320}
                    step={32}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações avançadas */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações Avançadas
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="ml-auto"
                  >
                    {showAdvanced ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.hardwareAcceleration}
                        onChange={(e) => setRenderSettings(prev => ({ 
                          ...prev, 
                          hardwareAcceleration: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-300">Aceleração por Hardware</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.multipass}
                        onChange={(e) => setRenderSettings(prev => ({ 
                          ...prev, 
                          multipass: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-300">Renderização Multipasse</label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Argumentos FFmpeg Customizados</label>
                    <Input
                      value={renderSettings.customFFmpegArgs || ''}
                      onChange={(e) => setRenderSettings(prev => ({ 
                        ...prev, 
                        customFFmpegArgs: e.target.value 
                      }))}
                      placeholder="-preset slow -crf 18"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Estimativas e ações */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Estimativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Tamanho estimado:</span>
                    <div className="text-white font-medium">{formatFileSize(estimatedFileSize)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Tempo estimado:</span>
                    <div className="text-white font-medium">{formatTime(estimatedTime)}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={startRender}
                    disabled={!!currentRender}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentRender ? 'Renderizando...' : 'Iniciar Renderização'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-gray-700 border-gray-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Preset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets de plataforma */}
          <TabsContent value="presets" className="h-full p-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {exportPresets.map(preset => (
                <Card 
                  key={preset.id}
                  className="cursor-pointer hover:bg-gray-700 bg-gray-800 border-gray-700 transition-colors"
                  onClick={() => applyPreset(preset)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {preset.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white flex items-center">
                          {preset.name}
                          {preset.recommended && (
                            <Badge variant="secondary" className="ml-2 bg-green-600 text-xs">
                              Recomendado
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {preset.settings.resolution}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {preset.settings.fps}fps
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {preset.settings.format?.toUpperCase()}
                          </Badge>
                        </div>

                        {(preset.maxDuration || preset.maxFileSize) && (
                          <div className="text-xs text-yellow-400 mt-2">
                            {preset.maxDuration && `Max: ${preset.maxDuration}s`}
                            {preset.maxFileSize && `Max: ${preset.maxFileSize}MB`}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Fila de renderização */}
          <TabsContent value="queue" className="h-full p-4">
            {currentRender && (
              <Card className="mb-4 bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">{currentRender.name}</h4>
                    <Badge className="bg-blue-600">Renderizando</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progresso</span>
                      <span className="text-white">{Math.round(currentRender.progress)}%</span>
                    </div>
                    <Progress value={currentRender.progress} className="h-2" />
                    
                    {currentRender.remainingTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tempo restante</span>
                        <span className="text-white">{formatTime(currentRender.remainingTime)}</span>
                      </div>
                    )}
                    
                    {currentRender.speed && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Velocidade</span>
                        <span className="text-white">{currentRender.speed.toFixed(1)}x</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {renderQueue.length === 0 && !currentRender ? (
              <div className="text-center text-gray-400 mt-8">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>Nenhuma renderização na fila</p>
              </div>
            ) : (
              <div className="space-y-2">
                {renderQueue.map(job => (
                  <Card key={job.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{job.name}</h4>
                          <p className="text-sm text-gray-400">
                            {job.settings.resolution} • {job.settings.fps}fps • {job.settings.format.toUpperCase()}
                          </p>
                        </div>
                        <Badge variant="outline">Na fila</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="h-full p-4 overflow-y-auto">
            {renderHistory.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <Archive className="w-12 h-12 mx-auto mb-4" />
                <p>Nenhuma renderização concluída</p>
              </div>
            ) : (
              <div className="space-y-2">
                {renderHistory.map(job => (
                  <Card key={job.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{job.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={job.status === 'completed' ? 'default' : 'destructive'}
                            className={job.status === 'completed' ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {job.status === 'completed' ? 'Concluído' : 'Falhou'}
                          </Badge>
                          
                          {job.status === 'completed' && (
                            <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600">
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Configurações:</span>
                          <div className="text-white">
                            {job.settings.resolution} • {job.settings.fps}fps • {job.settings.format.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Duração:</span>
                          <div className="text-white">
                            {job.startTime && job.endTime && 
                              formatDuration(job.endTime.getTime() - job.startTime.getTime())
                            }
                          </div>
                        </div>
                      </div>
                      
                      {job.fileSize && (
                        <div className="text-sm mt-2">
                          <span className="text-gray-400">Tamanho: </span>
                          <span className="text-white">{formatFileSize(job.fileSize)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoRenderEngine;