import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { 
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  Monitor,
  Smartphone,
  Youtube,
  Instagram,
  Twitch,
  Film,
  Music,
  Image,
  Folder,
  FolderOpen,
  Save,
  Trash2,
  Plus,
  Minus,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Server,
  Cloud,
  Layers,
  Video,
  Volume2,
  Eye,
  Maximize2,
  Grid3X3,
  MoreHorizontal,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';

// Types para Sistema de Renderização
interface RenderJob {
  id: string;
  name: string;
  project: string;
  preset: RenderPreset;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  timeElapsed: number;
  timeRemaining: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  fileSize: number;
  quality: number;
  errors: string[];
  warnings: string[];
  startTime?: Date;
  endTime?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  renderNode?: string;
}

interface RenderPreset {
  id: string;
  name: string;
  category: 'web' | 'mobile' | 'broadcast' | 'streaming' | 'archive' | 'custom';
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'twitch' | 'vimeo';
  format: 'mp4' | 'mov' | 'avi' | 'webm' | 'mkv' | 'mxf' | 'prores';
  codec: 'h264' | 'h265' | 'av1' | 'prores' | 'dnxhd' | 'vp9';
  resolution: {
    width: number;
    height: number;
    name: string;
  };
  framerate: number;
  bitrate: {
    video: number;
    audio: number;
    mode: 'cbr' | 'vbr' | 'abr';
  };
  quality: {
    video: number; // 0-100
    audio: number; // 0-100
  };
  audioCodec: 'aac' | 'mp3' | 'flac' | 'pcm';
  audioSampleRate: 48000 | 44100 | 96000;
  audioBitDepth: 16 | 24 | 32;
  advanced: {
    keyframeInterval: number;
    bFrames: number;
    profile: string;
    level: string;
    colorSpace: 'rec709' | 'rec2020' | 'p3';
    colorRange: 'limited' | 'full';
    hdr: boolean;
  };
}

interface RenderQueue {
  jobs: RenderJob[];
  isProcessing: boolean;
  maxConcurrentJobs: number;
  totalProgress: number;
}

interface RenderFarm {
  nodes: RenderNode[];
  loadBalancing: 'round-robin' | 'least-loaded' | 'fastest';
  autoDistribute: boolean;
}

interface RenderNode {
  id: string;
  name: string;
  address: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  capabilities: string[];
  performance: number; // relative performance score
  currentJob?: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  preset: RenderPreset;
  outputSettings: {
    naming: string; // template for file naming
    path: string;
    createSubfolders: boolean;
  };
  postProcessing: {
    uploadToCloud?: {
      provider: 'youtube' | 'vimeo' | 's3' | 'gdrive';
      settings: Record<string, any>;
    };
    notification?: {
      email?: string;
      webhook?: string;
    };
    cleanup?: {
      deleteSource: boolean;
      deleteTemp: boolean;
    };
  };
}

interface ProfessionalRenderSystemProps {
  engine: TimelineEngine;
  onRenderStart?: (job: RenderJob) => void;
  onRenderComplete?: (job: RenderJob) => void;
  onRenderProgress?: (jobId: string, progress: number) => void;
}

export const ProfessionalRenderSystem: React.FC<ProfessionalRenderSystemProps> = ({
  engine,
  onRenderStart,
  onRenderComplete,
  onRenderProgress
}) => {
  // Estados
  const [activeTab, setActiveTab] = useState<'presets' | 'queue' | 'farm' | 'templates'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<RenderPreset | null>(null);
  const [customPreset, setCustomPreset] = useState<Partial<RenderPreset>>({});
  const [renderQueue, setRenderQueue] = useState<RenderQueue>({
    jobs: [],
    isProcessing: false,
    maxConcurrentJobs: 2,
    totalProgress: 0
  });
  const [renderFarm, setRenderFarm] = useState<RenderFarm>({
    nodes: [
      {
        id: 'local',
        name: 'Local Machine',
        address: 'localhost',
        status: 'online',
        cpuUsage: 45,
        memoryUsage: 62,
        gpuUsage: 30,
        capabilities: ['h264', 'h265', 'prores'],
        performance: 100
      }
    ],
    loadBalancing: 'least-loaded',
    autoDistribute: true
  });
  const [outputPath, setOutputPath] = useState('');
  const [estimatedFileSize, setEstimatedFileSize] = useState(0);
  const [estimatedRenderTime, setEstimatedRenderTime] = useState(0);

  // Refs
  const workerRef = useRef<Worker>();

  // Render Presets
  const renderPresets: RenderPreset[] = useMemo(() => [
    // YouTube Presets
    {
      id: 'youtube_4k',
      name: 'YouTube 4K',
      category: 'streaming',
      platform: 'youtube',
      format: 'mp4',
      codec: 'h264',
      resolution: { width: 3840, height: 2160, name: '4K UHD' },
      framerate: 30,
      bitrate: { video: 35000, audio: 128, mode: 'vbr' },
      quality: { video: 85, audio: 95 },
      audioCodec: 'aac',
      audioSampleRate: 48000,
      audioBitDepth: 16,
      advanced: {
        keyframeInterval: 2,
        bFrames: 2,
        profile: 'high',
        level: '5.1',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    },
    {
      id: 'youtube_1080p',
      name: 'YouTube 1080p',
      category: 'streaming',
      platform: 'youtube',
      format: 'mp4',
      codec: 'h264',
      resolution: { width: 1920, height: 1080, name: 'Full HD' },
      framerate: 30,
      bitrate: { video: 8000, audio: 128, mode: 'vbr' },
      quality: { video: 80, audio: 95 },
      audioCodec: 'aac',
      audioSampleRate: 48000,
      audioBitDepth: 16,
      advanced: {
        keyframeInterval: 2,
        bFrames: 2,
        profile: 'high',
        level: '4.1',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    },

    // Instagram Presets
    {
      id: 'instagram_story',
      name: 'Instagram Story',
      category: 'mobile',
      platform: 'instagram',
      format: 'mp4',
      codec: 'h264',
      resolution: { width: 1080, height: 1920, name: '9:16 Vertical' },
      framerate: 30,
      bitrate: { video: 3500, audio: 128, mode: 'vbr' },
      quality: { video: 75, audio: 90 },
      audioCodec: 'aac',
      audioSampleRate: 44100,
      audioBitDepth: 16,
      advanced: {
        keyframeInterval: 2,
        bFrames: 0,
        profile: 'main',
        level: '4.0',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    },
    {
      id: 'instagram_feed',
      name: 'Instagram Feed',
      category: 'mobile',
      platform: 'instagram',
      format: 'mp4',
      codec: 'h264',
      resolution: { width: 1080, height: 1080, name: '1:1 Square' },
      framerate: 30,
      bitrate: { video: 3500, audio: 128, mode: 'vbr' },
      quality: { video: 75, audio: 90 },
      audioCodec: 'aac',
      audioSampleRate: 44100,
      audioBitDepth: 16,
      advanced: {
        keyframeInterval: 2,
        bFrames: 0,
        profile: 'main',
        level: '4.0',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    },

    // TikTok Preset
    {
      id: 'tiktok',
      name: 'TikTok',
      category: 'mobile',
      platform: 'tiktok',
      format: 'mp4',
      codec: 'h264',
      resolution: { width: 1080, height: 1920, name: '9:16 Vertical' },
      framerate: 30,
      bitrate: { video: 2500, audio: 128, mode: 'vbr' },
      quality: { video: 70, audio: 85 },
      audioCodec: 'aac',
      audioSampleRate: 44100,
      audioBitDepth: 16,
      advanced: {
        keyframeInterval: 2,
        bFrames: 0,
        profile: 'main',
        level: '4.0',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    },

    // Professional Presets
    {
      id: 'prores_4k',
      name: 'ProRes 4K',
      category: 'broadcast',
      format: 'mov',
      codec: 'prores',
      resolution: { width: 3840, height: 2160, name: '4K UHD' },
      framerate: 24,
      bitrate: { video: 200000, audio: 1411, mode: 'cbr' },
      quality: { video: 100, audio: 100 },
      audioCodec: 'pcm',
      audioSampleRate: 48000,
      audioBitDepth: 24,
      advanced: {
        keyframeInterval: 1,
        bFrames: 0,
        profile: 'prores_422',
        level: '5.1',
        colorSpace: 'rec709',
        colorRange: 'full',
        hdr: false
      }
    },

    // Web Presets
    {
      id: 'web_high',
      name: 'Web High Quality',
      category: 'web',
      format: 'mp4',
      codec: 'h264',
      resolution: { width: 1920, height: 1080, name: 'Full HD' },
      framerate: 30,
      bitrate: { video: 5000, audio: 128, mode: 'vbr' },
      quality: { video: 78, audio: 92 },
      audioCodec: 'aac',
      audioSampleRate: 48000,
      audioBitDepth: 16,
      advanced: {
        keyframeInterval: 2,
        bFrames: 2,
        profile: 'high',
        level: '4.1',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    },

    // Archive Preset
    {
      id: 'archive_master',
      name: 'Archive Master',
      category: 'archive',
      format: 'mxf',
      codec: 'dnxhd',
      resolution: { width: 1920, height: 1080, name: 'Full HD' },
      framerate: 25,
      bitrate: { video: 185000, audio: 1411, mode: 'cbr' },
      quality: { video: 100, audio: 100 },
      audioCodec: 'pcm',
      audioSampleRate: 48000,
      audioBitDepth: 24,
      advanced: {
        keyframeInterval: 1,
        bFrames: 0,
        profile: 'dnxhd_185',
        level: '4.1',
        colorSpace: 'rec709',
        colorRange: 'limited',
        hdr: false
      }
    }
  ], []);

  // Preset categories
  const presetCategories = useMemo(() => [
    { id: 'streaming', name: 'Streaming', icon: <Youtube className="w-4 h-4" /> },
    { id: 'mobile', name: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'web', name: 'Web', icon: <Monitor className="w-4 h-4" /> },
    { id: 'broadcast', name: 'Broadcast', icon: <Film className="w-4 h-4" /> },
    { id: 'archive', name: 'Archive', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'custom', name: 'Custom', icon: <Settings className="w-4 h-4" /> }
  ], []);

  // Calculate estimates
  useEffect(() => {
    if (selectedPreset) {
      const duration = engine.getDuration();
      const fps = selectedPreset.framerate;
      const totalFrames = Math.ceil(duration * fps);
      
      // Estimate file size (rough calculation)
      const videoBitrate = selectedPreset.bitrate.video * 1000; // Convert to bps
      const audioBitrate = selectedPreset.bitrate.audio * 1000;
      const totalBitrate = videoBitrate + audioBitrate;
      const estimatedSize = (totalBitrate * duration) / 8; // Convert to bytes
      
      setEstimatedFileSize(estimatedSize);
      
      // Estimate render time (very rough - depends on complexity)
      const baseRenderTime = duration * 2; // 2x realtime as baseline
      const complexityMultiplier = 1.5; // Add complexity factor
      setEstimatedRenderTime(baseRenderTime * complexityMultiplier);
    }
  }, [selectedPreset, engine]);

  // Handle render start
  const handleStartRender = useCallback(() => {
    if (!selectedPreset || !outputPath) return;

    const newJob: RenderJob = {
      id: `job_${Date.now()}`,
      name: `Render ${new Date().toLocaleString()}`,
      project: 'Current Project',
      preset: selectedPreset,
      outputPath,
      status: 'pending',
      progress: 0,
      timeElapsed: 0,
      timeRemaining: estimatedRenderTime,
      currentFrame: 0,
      totalFrames: Math.ceil(engine.getDuration() * selectedPreset.framerate),
      fps: 0,
      fileSize: 0,
      quality: 0,
      errors: [],
      warnings: [],
      priority: 'normal',
      startTime: new Date()
    };

    setRenderQueue(prev => ({
      ...prev,
      jobs: [...prev.jobs, newJob]
    }));

    onRenderStart?.(newJob);
    startRenderProcess(newJob);
  }, [selectedPreset, outputPath, estimatedRenderTime, engine, onRenderStart]);

  // Start render process
  const startRenderProcess = (job: RenderJob) => {
    // Simulate render process
    const updateInterval = setInterval(() => {
      setRenderQueue(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => {
          if (j.id === job.id) {
            const newProgress = Math.min(j.progress + Math.random() * 5, 100);
            const isComplete = newProgress >= 100;
            
            return {
              ...j,
              status: isComplete ? 'completed' : 'processing',
              progress: newProgress,
              currentFrame: Math.floor((newProgress / 100) * j.totalFrames),
              fps: 25 + Math.random() * 10,
              timeElapsed: j.timeElapsed + 1,
              timeRemaining: isComplete ? 0 : Math.max(0, j.timeRemaining - 1),
              endTime: isComplete ? new Date() : undefined
            };
          }
          return j;
        })
      }));

      const currentJob = renderQueue.jobs.find(j => j.id === job.id);
      if (currentJob && currentJob.progress >= 100) {
        clearInterval(updateInterval);
        onRenderComplete?.(currentJob);
      }
    }, 1000);
  };

  // Cancel render job
  const cancelRenderJob = (jobId: string) => {
    setRenderQueue(prev => ({
      ...prev,
      jobs: prev.jobs.map(job =>
        job.id === jobId
          ? { ...job, status: 'cancelled' as const }
          : job
      )
    }));
  };

  // Remove completed job
  const removeJob = (jobId: string) => {
    setRenderQueue(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== jobId)
    }));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Get status icon
  const getStatusIcon = (status: RenderJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'tiktok':
        return <Music className="w-4 h-4 text-purple-500" />;
      case 'twitch':
        return <Twitch className="w-4 h-4 text-purple-600" />;
      default:
        return <Video className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="queue">
            Fila de Renderização
            {renderQueue.jobs.filter(j => j.status === 'processing').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {renderQueue.jobs.filter(j => j.status === 'processing').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="farm">Render Farm</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Presets Tab */}
        <TabsContent value="presets" className="flex-1 flex overflow-hidden">
          {/* Preset Library */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Presets de Renderização</h2>
              
              {/* Categories */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {presetCategories.map(category => (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    {category.icon}
                    <span>{category.name}</span>
                  </Button>
                ))}
              </div>

              {/* Preset List */}
              <div className="space-y-2">
                {renderPresets.map(preset => (
                  <Card
                    key={preset.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedPreset?.id === preset.id ? 'bg-blue-900 border-blue-600' : 'hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(preset.platform)}
                        <div>
                          <h3 className="font-medium">{preset.name}</h3>
                          <p className="text-sm text-gray-400">
                            {preset.resolution.name} • {preset.framerate}fps • {preset.format.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={preset.category === 'broadcast' ? 'default' : 'secondary'}>
                        {preset.category}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Preset Details */}
          <div className="w-1/2 overflow-y-auto">
            {selectedPreset ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedPreset.name}</h2>
                    <p className="text-gray-400">
                      {selectedPreset.resolution.width}x{selectedPreset.resolution.height} • {selectedPreset.framerate}fps
                    </p>
                  </div>
                  {getPlatformIcon(selectedPreset.platform)}
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium mb-3">Vídeo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Codec:</span>
                        <span>{selectedPreset.codec.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bitrate:</span>
                        <span>{selectedPreset.bitrate.video} kbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Qualidade:</span>
                        <span>{selectedPreset.quality.video}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profile:</span>
                        <span>{selectedPreset.advanced.profile}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Áudio</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Codec:</span>
                        <span>{selectedPreset.audioCodec.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bitrate:</span>
                        <span>{selectedPreset.bitrate.audio} kbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sample Rate:</span>
                        <span>{selectedPreset.audioSampleRate / 1000} kHz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bit Depth:</span>
                        <span>{selectedPreset.audioBitDepth} bit</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimates */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3">Estimativas</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tamanho do arquivo:</span>
                      <span>{formatFileSize(estimatedFileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tempo de render:</span>
                      <span>{formatTime(estimatedRenderTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Output Settings */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pasta de destino</label>
                    <div className="flex space-x-2">
                      <Input
                        value={outputPath}
                        onChange={(e) => setOutputPath(e.target.value)}
                        placeholder="Selecione a pasta de destino..."
                        className="flex-1"
                      />
                      <Button variant="outline">
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Render Button */}
                <Button
                  onClick={handleStartRender}
                  disabled={!outputPath}
                  className="w-full h-12"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Iniciar Renderização
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione um preset para ver detalhes</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Render Queue Tab */}
        <TabsContent value="queue" className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Fila de Renderização</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Configurações
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar Concluídos
                </Button>
              </div>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Pendentes</p>
                    <p className="text-lg font-semibold">
                      {renderQueue.jobs.filter(j => j.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Processando</p>
                    <p className="text-lg font-semibold">
                      {renderQueue.jobs.filter(j => j.status === 'processing').length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Concluídos</p>
                    <p className="text-lg font-semibold">
                      {renderQueue.jobs.filter(j => j.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm text-gray-400">Com Erro</p>
                    <p className="text-lg font-semibold">
                      {renderQueue.jobs.filter(j => j.status === 'failed').length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Job List */}
            <div className="space-y-4">
              {renderQueue.jobs.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum trabalho de renderização na fila</p>
                </div>
              ) : (
                renderQueue.jobs.map(job => (
                  <Card key={job.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-medium">{job.name}</h3>
                          <p className="text-sm text-gray-400">{job.preset.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {job.status === 'processing' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelRenderJob(job.id)}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        
                        {job.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeJob(job.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    {(job.status === 'processing' || job.status === 'completed') && (
                      <div className="space-y-2">
                        <Progress value={job.progress} className="w-full" />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>
                            Frame {job.currentFrame} / {job.totalFrames} ({job.fps.toFixed(1)} fps)
                          </span>
                          <span>{job.progress.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Tempo decorrido: {formatTime(job.timeElapsed)}</span>
                          <span>Restante: {formatTime(job.timeRemaining)}</span>
                        </div>
                      </div>
                    )}

                    {/* Job Details */}
                    <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-400">
                      <div>
                        <span>Resolução:</span>
                        <p className="text-white">{job.preset.resolution.name}</p>
                      </div>
                      <div>
                        <span>Formato:</span>
                        <p className="text-white">{job.preset.format.toUpperCase()}</p>
                      </div>
                      <div>
                        <span>Qualidade:</span>
                        <p className="text-white">{job.preset.quality.video}%</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Render Farm Tab */}
        <TabsContent value="farm" className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Render Farm</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Nó
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Configurações
                </Button>
              </div>
            </div>

            {/* Farm Settings */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium mb-4">Configurações da Farm</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Load Balancing</label>
                  <select
                    value={renderFarm.loadBalancing}
                    onChange={(e) => setRenderFarm(prev => ({
                      ...prev,
                      loadBalancing: e.target.value as any
                    }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                  >
                    <option value="round-robin">Round Robin</option>
                    <option value="least-loaded">Least Loaded</option>
                    <option value="fastest">Fastest Node</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Jobs Concorrentes</label>
                  <Input
                    type="number"
                    value={renderQueue.maxConcurrentJobs}
                    onChange={(e) => setRenderQueue(prev => ({
                      ...prev,
                      maxConcurrentJobs: parseInt(e.target.value)
                    }))}
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </Card>

            {/* Render Nodes */}
            <div className="space-y-4">
              {renderFarm.nodes.map(node => (
                <Card key={node.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        node.status === 'online' ? 'bg-green-400' :
                        node.status === 'busy' ? 'bg-yellow-400' :
                        node.status === 'offline' ? 'bg-gray-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <h3 className="font-medium">{node.name}</h3>
                        <p className="text-sm text-gray-400">{node.address}</p>
                      </div>
                    </div>
                    
                    <Badge
                      variant={node.status === 'online' ? 'default' : 'secondary'}
                    >
                      {node.status}
                    </Badge>
                  </div>

                  {/* Node Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">CPU</span>
                        <span className="text-sm">{node.cpuUsage}%</span>
                      </div>
                      <Progress value={node.cpuUsage} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Memory</span>
                        <span className="text-sm">{node.memoryUsage}%</span>
                      </div>
                      <Progress value={node.memoryUsage} className="h-2" />
                    </div>
                    
                    {node.gpuUsage !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-400">GPU</span>
                          <span className="text-sm">{node.gpuUsage}%</span>
                        </div>
                        <Progress value={node.gpuUsage} className="h-2" />
                      </div>
                    )}
                  </div>

                  {/* Node Capabilities */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {node.capabilities.map(capability => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Current Job */}
                  {node.currentJob && (
                    <div className="mt-4 p-3 bg-gray-800 rounded">
                      <p className="text-sm text-gray-400">Processando:</p>
                      <p className="text-sm font-medium">{node.currentJob}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="text-center text-gray-400 py-12">
              <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Export Templates</p>
              <p className="text-sm">Feature coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalRenderSystem;