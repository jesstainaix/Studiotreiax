import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Zap,
  Activity,
  MemoryStick,
  Cpu,
  HardDrive,
  Wifi,
  Monitor,
  Database,
  Server,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  Filter,
  Search,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  MapPin,
  Flag,
  Award,
  Star,
  ThumbsUp,
  Heart,
  Bookmark,
  Share2,
  Copy,
  Edit,
  Plus,
  Minus,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Scale,
  Crop,
  Scissors,
  Layers,
  Grid,
  Lock,
  Unlock,
  Palette,
  Brush,
  Eraser,
  Pipette,
  Type,
  Image,
  Video,
  Music,
  Mic,
  Volume2,
  VolumeX,
  Speaker,
  Headphones
} from 'lucide-react';

// Tipos para otimização e performance
interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
    threads: number;
  };
  gpu: {
    usage: number;
    memory: number;
    temperature: number;
  };
  network: {
    download: number;
    upload: number;
    latency: number;
  };
  disk: {
    read: number;
    write: number;
    space: number;
  };
  timeline: {
    playbackPerformance: number;
    renderingPerformance: number;
    effectsPerformance: number;
  };
}

interface CacheConfiguration {
  enabled: boolean;
  maxSize: number; // MB
  ttl: number; // seconds
  strategy: 'lru' | 'lfu' | 'fifo' | 'smart';
  preloadFrames: number;
  compressionLevel: number;
  autoCleanup: boolean;
  types: {
    video: boolean;
    audio: boolean;
    effects: boolean;
    previews: boolean;
    thumbnails: boolean;
  };
}

interface OptimizationSettings {
  rendering: {
    quality: 'draft' | 'preview' | 'final';
    multiThreading: boolean;
    hardwareAcceleration: boolean;
    memoryLimit: number;
    chunkSize: number;
  };
  effects: {
    realTimePreview: boolean;
    previewQuality: number;
    effectsPoolSize: number;
    gpuAcceleration: boolean;
  };
  timeline: {
    lazyLoading: boolean;
    virtualScrolling: boolean;
    thumbnailQuality: number;
    preloadBuffer: number;
  };
  export: {
    backgroundProcessing: boolean;
    priority: 'speed' | 'quality' | 'balanced';
    tempDirectory: string;
    cleanupAfterExport: boolean;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  timestamp: Date;
  resolved: boolean;
  autoFixAvailable: boolean;
}

interface AdvancedPerformanceOptimizerProps {
  onSettingsChange: (settings: OptimizationSettings) => void;
  onCacheConfigChange: (config: CacheConfiguration) => void;
  className?: string;
}

const AdvancedPerformanceOptimizer: React.FC<AdvancedPerformanceOptimizerProps> = ({
  onSettingsChange,
  onCacheConfigChange,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'monitoring' | 'cache' | 'optimization' | 'alerts'>('monitoring');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: { used: 2048, total: 8192, percentage: 25 },
    cpu: { usage: 35, cores: 8, threads: 16 },
    gpu: { usage: 45, memory: 4096, temperature: 65 },
    network: { download: 50, upload: 25, latency: 20 },
    disk: { read: 100, write: 50, space: 75 },
    timeline: { playbackPerformance: 85, renderingPerformance: 90, effectsPerformance: 80 }
  });

  const [cacheConfig, setCacheConfig] = useState<CacheConfiguration>({
    enabled: true,
    maxSize: 2048,
    ttl: 300,
    strategy: 'smart',
    preloadFrames: 30,
    compressionLevel: 5,
    autoCleanup: true,
    types: {
      video: true,
      audio: true,
      effects: true,
      previews: true,
      thumbnails: true
    }
  });

  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    rendering: {
      quality: 'preview',
      multiThreading: true,
      hardwareAcceleration: true,
      memoryLimit: 4096,
      chunkSize: 32
    },
    effects: {
      realTimePreview: true,
      previewQuality: 0.7,
      effectsPoolSize: 10,
      gpuAcceleration: true
    },
    timeline: {
      lazyLoading: true,
      virtualScrolling: true,
      thumbnailQuality: 0.5,
      preloadBuffer: 5
    },
    export: {
      backgroundProcessing: true,
      priority: 'balanced',
      tempDirectory: '/tmp/studiotreiax',
      cleanupAfterExport: true
    }
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([
    {
      id: 'alert-1',
      type: 'warning',
      title: 'Uso elevado de memória',
      description: 'O uso de memória está acima de 80%. Considere limpar o cache.',
      impact: 'medium',
      suggestion: 'Ativar limpeza automática de cache',
      timestamp: new Date(),
      resolved: false,
      autoFixAvailable: true
    },
    {
      id: 'alert-2',
      type: 'info',
      title: 'Cache otimizado',
      description: 'Sistema de cache funcionando eficientemente.',
      impact: 'low',
      suggestion: 'Continue monitorando',
      timestamp: new Date(),
      resolved: true,
      autoFixAvailable: false
    }
  ]);

  const intervalRef = useRef<NodeJS.Timeout>();

  // Simulação de monitoramento em tempo real
  const updateMetrics = useCallback(() => {
    const newMetrics: PerformanceMetrics = {
      fps: Math.random() * 20 + 50, // 50-70 FPS
      memory: {
        used: Math.random() * 2048 + 1024,
        total: 8192,
        percentage: Math.random() * 40 + 20
      },
      cpu: {
        usage: Math.random() * 30 + 20,
        cores: 8,
        threads: 16
      },
      gpu: {
        usage: Math.random() * 50 + 25,
        memory: 4096,
        temperature: Math.random() * 20 + 55
      },
      network: {
        download: Math.random() * 100 + 20,
        upload: Math.random() * 50 + 10,
        latency: Math.random() * 30 + 10
      },
      disk: {
        read: Math.random() * 200 + 50,
        write: Math.random() * 100 + 25,
        space: Math.random() * 20 + 70
      },
      timeline: {
        playbackPerformance: Math.random() * 20 + 75,
        renderingPerformance: Math.random() * 15 + 80,
        effectsPerformance: Math.random() * 25 + 70
      }
    };

    setCurrentMetrics(newMetrics);
    setMetricsHistory(prev => [...prev.slice(-29), newMetrics]); // Keep last 30 readings
  }, []);

  // Iniciar/parar monitoramento
  useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(updateMetrics, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, updateMetrics]);

  // Handlers para configurações
  const handleCacheConfigChange = useCallback((newConfig: Partial<CacheConfiguration>) => {
    const updatedConfig = { ...cacheConfig, ...newConfig };
    setCacheConfig(updatedConfig);
    onCacheConfigChange(updatedConfig);
  }, [cacheConfig, onCacheConfigChange]);

  const handleOptimizationChange = useCallback((category: keyof OptimizationSettings, setting: string, value: any) => {
    const updatedSettings = {
      ...optimizationSettings,
      [category]: {
        ...optimizationSettings[category],
        [setting]: value
      }
    };
    setOptimizationSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  }, [optimizationSettings, onSettingsChange]);

  // Auto-otimização inteligente
  const runAutoOptimization = useCallback(() => {
    const newSettings = { ...optimizationSettings };
    
    // Ajustar baseado nas métricas atuais
    if (currentMetrics.memory.percentage > 80) {
      newSettings.rendering.memoryLimit = Math.max(newSettings.rendering.memoryLimit - 512, 1024);
      newSettings.effects.effectsPoolSize = Math.max(newSettings.effects.effectsPoolSize - 2, 3);
    }
    
    if (currentMetrics.cpu.usage > 80) {
      newSettings.effects.realTimePreview = false;
      newSettings.rendering.quality = 'draft';
    }
    
    if (currentMetrics.gpu.usage > 90) {
      newSettings.effects.gpuAcceleration = false;
    }
    
    setOptimizationSettings(newSettings);
    onSettingsChange(newSettings);
  }, [currentMetrics, optimizationSettings, onSettingsChange]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    // Simular limpeza de cache
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Atualizar métricas
    setCurrentMetrics(prev => ({
      ...prev,
      memory: {
        ...prev.memory,
        used: prev.memory.used * 0.6,
        percentage: prev.memory.percentage * 0.6
      }
    }));
  }, []);

  // Resolver alerta
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  }, []);

  // Formatadores
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  const getPerformanceColor = (value: number, inverted: boolean = false) => {
    if (inverted) {
      return value > 80 ? 'text-red-400' : value > 60 ? 'text-yellow-400' : 'text-green-400';
    }
    return value > 80 ? 'text-green-400' : value > 60 ? 'text-yellow-400' : 'text-red-400';
  };

  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  // Performance presets
  const performancePresets = useMemo(() => [
    {
      name: 'Máxima Performance',
      description: 'Otimizado para velocidade máxima',
      settings: {
        rendering: { quality: 'draft', multiThreading: true, hardwareAcceleration: true },
        effects: { realTimePreview: false, previewQuality: 0.3, gpuAcceleration: true },
        timeline: { lazyLoading: true, virtualScrolling: true, thumbnailQuality: 0.3 }
      }
    },
    {
      name: 'Qualidade Balanceada',
      description: 'Equilíbrio entre qualidade e performance',
      settings: {
        rendering: { quality: 'preview', multiThreading: true, hardwareAcceleration: true },
        effects: { realTimePreview: true, previewQuality: 0.7, gpuAcceleration: true },
        timeline: { lazyLoading: true, virtualScrolling: true, thumbnailQuality: 0.5 }
      }
    },
    {
      name: 'Máxima Qualidade',
      description: 'Prioriza qualidade sobre velocidade',
      settings: {
        rendering: { quality: 'final', multiThreading: true, hardwareAcceleration: true },
        effects: { realTimePreview: true, previewQuality: 1.0, gpuAcceleration: true },
        timeline: { lazyLoading: false, virtualScrolling: false, thumbnailQuality: 1.0 }
      }
    }
  ], []);

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Otimização de Performance Avançada</h2>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={isMonitoring ? "default" : "outline"}
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={isMonitoring ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 border-gray-600"}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Monitorar
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={runAutoOptimization}
              className="bg-blue-600 hover:bg-blue-700 border-blue-500"
            >
              <Zap className="w-4 h-4 mr-1" />
              Auto-Otimizar
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="monitoring" className="text-sm">
              <Activity className="w-4 h-4 mr-1" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger value="cache" className="text-sm">
              <Database className="w-4 h-4 mr-1" />
              Cache
            </TabsTrigger>
            <TabsTrigger value="optimization" className="text-sm">
              <Settings className="w-4 h-4 mr-1" />
              Otimização
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Alertas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Monitoramento em tempo real */}
          <TabsContent value="monitoring" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">FPS</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(currentMetrics.fps, false)}`}>
                        {Math.round(currentMetrics.fps)}
                      </p>
                    </div>
                    <Monitor className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Memória</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(currentMetrics.memory.percentage, true)}`}>
                        {formatPercentage(currentMetrics.memory.percentage)}
                      </p>
                    </div>
                    <MemoryStick className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">CPU</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(currentMetrics.cpu.usage, true)}`}>
                        {formatPercentage(currentMetrics.cpu.usage)}
                      </p>
                    </div>
                    <Cpu className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas detalhadas */}
            <div className="grid grid-cols-2 gap-6">
              {/* Sistema */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Memória</span>
                      <span className="text-white">
                        {formatBytes(currentMetrics.memory.used * 1024 * 1024)} / {formatBytes(currentMetrics.memory.total * 1024 * 1024)}
                      </span>
                    </div>
                    <Progress value={currentMetrics.memory.percentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">CPU ({currentMetrics.cpu.cores} cores)</span>
                      <span className="text-white">{formatPercentage(currentMetrics.cpu.usage)}</span>
                    </div>
                    <Progress value={currentMetrics.cpu.usage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">GPU</span>
                      <span className="text-white">{formatPercentage(currentMetrics.gpu.usage)} | {currentMetrics.gpu.temperature}°C</span>
                    </div>
                    <Progress value={currentMetrics.gpu.usage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Disco</span>
                      <span className="text-white">R: {Math.round(currentMetrics.disk.read)} MB/s | W: {Math.round(currentMetrics.disk.write)} MB/s</span>
                    </div>
                    <Progress value={currentMetrics.disk.space} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Performance do Editor */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Performance do Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Reprodução</span>
                      <span className="text-white">{formatPercentage(currentMetrics.timeline.playbackPerformance)}</span>
                    </div>
                    <Progress value={currentMetrics.timeline.playbackPerformance} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Renderização</span>
                      <span className="text-white">{formatPercentage(currentMetrics.timeline.renderingPerformance)}</span>
                    </div>
                    <Progress value={currentMetrics.timeline.renderingPerformance} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Efeitos</span>
                      <span className="text-white">{formatPercentage(currentMetrics.timeline.effectsPerformance)}</span>
                    </div>
                    <Progress value={currentMetrics.timeline.effectsPerformance} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Rede</span>
                      <span className="text-white">↓ {Math.round(currentMetrics.network.download)} Mbps | ↑ {Math.round(currentMetrics.network.upload)} Mbps</span>
                    </div>
                    <div className="text-xs text-gray-400">Latência: {Math.round(currentMetrics.network.latency)}ms</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de histórico */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Histórico de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end space-x-1">
                  {metricsHistory.map((metrics, index) => (
                    <div key={index} className="flex-1 flex flex-col space-y-1">
                      <div 
                        className="bg-blue-500 rounded-t"
                        style={{ height: `${metrics.fps}%` }}
                      />
                      <div 
                        className="bg-purple-500"
                        style={{ height: `${metrics.memory.percentage}%` }}
                      />
                      <div 
                        className="bg-green-500 rounded-b"
                        style={{ height: `${metrics.cpu.usage}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>FPS (azul)</span>
                  <span>Memória (roxo)</span>
                  <span>CPU (verde)</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gerenciamento de Cache */}
          <TabsContent value="cache" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Status do cache */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Status do Cache
                  </div>
                  <Badge className={cacheConfig.enabled ? "bg-green-600" : "bg-gray-600"}>
                    {cacheConfig.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Tamanho Máximo</label>
                    <div className="text-white font-medium">{formatBytes(cacheConfig.maxSize * 1024 * 1024)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Uso Atual</label>
                    <div className="text-white font-medium">
                      {formatBytes(currentMetrics.memory.used * 1024 * 1024 * 0.3)} 
                      <span className="text-sm text-gray-400 ml-1">
                        ({Math.round((currentMetrics.memory.used * 0.3 / cacheConfig.maxSize) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Estratégia</label>
                    <div className="text-white font-medium capitalize">{cacheConfig.strategy}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">TTL</label>
                    <div className="text-white font-medium">{cacheConfig.ttl}s</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={clearCache}
                    variant="outline"
                    className="bg-red-600 hover:bg-red-700 border-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </Button>
                  
                  <Button
                    onClick={() => handleCacheConfigChange({ enabled: !cacheConfig.enabled })}
                    variant="outline"
                    className="bg-gray-700 border-gray-600"
                  >
                    {cacheConfig.enabled ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de cache */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações de Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Tamanho Máximo: {cacheConfig.maxSize} MB
                  </label>
                  <Slider
                    value={[cacheConfig.maxSize]}
                    onValueChange={(value) => handleCacheConfigChange({ maxSize: value[0] })}
                    min={512}
                    max={8192}
                    step={256}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    TTL (Time to Live): {cacheConfig.ttl}s
                  </label>
                  <Slider
                    value={[cacheConfig.ttl]}
                    onValueChange={(value) => handleCacheConfigChange({ ttl: value[0] })}
                    min={60}
                    max={3600}
                    step={60}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Frames de Preload: {cacheConfig.preloadFrames}
                  </label>
                  <Slider
                    value={[cacheConfig.preloadFrames]}
                    onValueChange={(value) => handleCacheConfigChange({ preloadFrames: value[0] })}
                    min={10}
                    max={120}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Estratégia de Cache</label>
                  <select
                    value={cacheConfig.strategy}
                    onChange={(e) => handleCacheConfigChange({ strategy: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="lru">LRU (Least Recently Used)</option>
                    <option value="lfu">LFU (Least Frequently Used)</option>
                    <option value="fifo">FIFO (First In, First Out)</option>
                    <option value="smart">Smart (Adaptativo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Tipos de Conteúdo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(cacheConfig.types).map(([type, enabled]) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => handleCacheConfigChange({
                            types: { ...cacheConfig.types, [type]: e.target.checked }
                          })}
                          className="rounded"
                        />
                        <span className="text-white text-sm capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Otimização */}
          <TabsContent value="optimization" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Presets de performance */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Presets de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {performancePresets.map(preset => (
                  <div
                    key={preset.name}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600 cursor-pointer hover:bg-gray-600"
                    onClick={() => {
                      const newSettings = { ...optimizationSettings, ...preset.settings };
                      setOptimizationSettings(newSettings);
                      onSettingsChange(newSettings);
                    }}
                  >
                    <div>
                      <h4 className="text-white font-medium">{preset.name}</h4>
                      <p className="text-sm text-gray-400">{preset.description}</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-gray-600 border-gray-500">
                      Aplicar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Configurações detalhadas */}
            <div className="grid grid-cols-2 gap-6">
              {/* Renderização */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Renderização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Qualidade</label>
                    <select
                      value={optimizationSettings.rendering.quality}
                      onChange={(e) => handleOptimizationChange('rendering', 'quality', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="draft">Rascunho (Rápido)</option>
                      <option value="preview">Preview (Balanceado)</option>
                      <option value="final">Final (Qualidade)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Limite de Memória: {optimizationSettings.rendering.memoryLimit} MB
                    </label>
                    <Slider
                      value={[optimizationSettings.rendering.memoryLimit]}
                      onValueChange={(value) => handleOptimizationChange('rendering', 'memoryLimit', value[0])}
                      min={1024}
                      max={8192}
                      step={256}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={optimizationSettings.rendering.multiThreading}
                        onChange={(e) => handleOptimizationChange('rendering', 'multiThreading', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white text-sm">Multi-threading</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={optimizationSettings.rendering.hardwareAcceleration}
                        onChange={(e) => handleOptimizationChange('rendering', 'hardwareAcceleration', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white text-sm">Aceleração de Hardware</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Efeitos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Efeitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Qualidade do Preview: {Math.round(optimizationSettings.effects.previewQuality * 100)}%
                    </label>
                    <Slider
                      value={[optimizationSettings.effects.previewQuality]}
                      onValueChange={(value) => handleOptimizationChange('effects', 'previewQuality', value[0])}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Pool de Efeitos: {optimizationSettings.effects.effectsPoolSize}
                    </label>
                    <Slider
                      value={[optimizationSettings.effects.effectsPoolSize]}
                      onValueChange={(value) => handleOptimizationChange('effects', 'effectsPoolSize', value[0])}
                      min={3}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={optimizationSettings.effects.realTimePreview}
                        onChange={(e) => handleOptimizationChange('effects', 'realTimePreview', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white text-sm">Preview em Tempo Real</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={optimizationSettings.effects.gpuAcceleration}
                        onChange={(e) => handleOptimizationChange('effects', 'gpuAcceleration', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white text-sm">Aceleração GPU</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Qualidade das Thumbnails: {Math.round(optimizationSettings.timeline.thumbnailQuality * 100)}%
                    </label>
                    <Slider
                      value={[optimizationSettings.timeline.thumbnailQuality]}
                      onValueChange={(value) => handleOptimizationChange('timeline', 'thumbnailQuality', value[0])}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Buffer de Preload: {optimizationSettings.timeline.preloadBuffer}s
                    </label>
                    <Slider
                      value={[optimizationSettings.timeline.preloadBuffer]}
                      onValueChange={(value) => handleOptimizationChange('timeline', 'preloadBuffer', value[0])}
                      min={1}
                      max={15}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={optimizationSettings.timeline.lazyLoading}
                      onChange={(e) => handleOptimizationChange('timeline', 'lazyLoading', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-white text-sm">Lazy Loading</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={optimizationSettings.timeline.virtualScrolling}
                      onChange={(e) => handleOptimizationChange('timeline', 'virtualScrolling', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-white text-sm">Virtual Scrolling</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alertas e Diagnósticos */}
          <TabsContent value="alerts" className="h-full p-4 overflow-y-auto space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Alertas de Performance
                  </div>
                  <Badge variant="outline">
                    {alerts.filter(a => !a.resolved).length} ativos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded border ${
                      alert.resolved 
                        ? 'bg-gray-700 border-gray-600 opacity-50' 
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <h4 className="text-white font-medium">{alert.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{alert.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                alert.impact === 'critical' ? 'border-red-500 text-red-400' :
                                alert.impact === 'high' ? 'border-orange-500 text-orange-400' :
                                alert.impact === 'medium' ? 'border-yellow-500 text-yellow-400' :
                                'border-blue-500 text-blue-400'
                              }`}
                            >
                              {alert.impact}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {alert.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-blue-400 mt-1">
                            💡 {alert.suggestion}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {alert.autoFixAvailable && !alert.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                            className="bg-blue-600 hover:bg-blue-700 border-blue-500"
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Auto-Corrigir
                          </Button>
                        )}
                        
                        {!alert.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                            className="bg-gray-600 border-gray-500"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhum alerta ativo</p>
                    <p className="text-sm mt-2">Sistema funcionando perfeitamente!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedPerformanceOptimizer;