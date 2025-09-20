import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Activity,
  BarChart3,
  Clock,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  RefreshCw,
  Camera,
  Image,
  Monitor,
  Smartphone,
  Cable,
  Globe
} from 'lucide-react';
import {
  useAdaptiveStreaming,
  useStreamingStats,
  useStreamingConfig,
  useNetworkMonitoring,
  useBufferMonitoring,
  usePlaybackControl,
  useQualityControl,
  useCacheManagement,
  useStreamingAnalytics,
  useRealtimeMonitoring
} from '../../hooks/useAdaptiveStreaming';
import {
  formatBitrate,
  formatDuration,
  getQualityColor,
  getBufferHealthColor,
  getNetworkIcon,
  calculateCacheEfficiency,
  generateStreamingRecommendations
} from '../../services/adaptiveStreamingService';

const AdaptiveStreamingPlayer: React.FC = () => {
  // Hooks
  const {
    streams,
    activeStream,
    isLoading,
    error,
    computed,
    filtered,
    actions,
    quickActions
  } = useAdaptiveStreaming();
  
  const { stats } = useStreamingStats();
  const { config, updateSetting } = useStreamingConfig();
  const { networkMetrics, isOnline, connectionQuality } = useNetworkMonitoring();
  const { bufferMetrics, isHealthy, bufferPercentage } = useBufferMonitoring();
  const { play, pause, seek, skipForward, skipBackward } = usePlaybackControl();
  const { currentQuality, availableQualities, setQuality, toggleAdaptive } = useQualityControl();
  const { cache, cacheStats, clearCache } = useCacheManagement();
  const { trackEvent, performanceMetrics } = useStreamingAnalytics();
  const { isMonitoring, startMonitoring, stopMonitoring } = useRealtimeMonitoring();
  
  // Local state
  const [activeTab, setActiveTab] = useState('player');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeStream) {
        actions.initializeStream('demo-stream-1');
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeStream, actions]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Stream Status',
      value: activeStream?.status || 'Idle',
      icon: computed.isPlaying ? Play : Pause,
      color: computed.isPlaying ? 'text-green-600' : 'text-gray-600'
    },
    {
      title: 'Quality',
      value: computed.qualityLabel,
      icon: Monitor,
      color: getQualityColor(currentQuality || availableQualities[0])
    },
    {
      title: 'Buffer Health',
      value: bufferMetrics.health,
      icon: Activity,
      color: getBufferHealthColor(bufferMetrics.health)
    },
    {
      title: 'Network',
      value: connectionQuality,
      icon: isOnline ? Wifi : WifiOff,
      color: isOnline ? 'text-green-600' : 'text-red-600'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'player', label: 'Player', icon: Play },
    { id: 'quality', label: 'Quality', icon: Monitor },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'buffer', label: 'Buffer', icon: Activity },
    { id: 'cache', label: 'Cache', icon: HardDrive },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'playing': return Play;
      case 'paused': return Pause;
      case 'buffering': return RefreshCw;
      case 'error': return XCircle;
      default: return Clock;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'buffering': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleQuickAction = async (action: string, ...args: any[]) => {
    try {
      switch (action) {
        case 'play':
          await play();
          break;
        case 'pause':
          pause();
          break;
        case 'skipForward':
          skipForward();
          break;
        case 'skipBackward':
          skipBackward();
          break;
        case 'toggleMute':
          setIsMuted(!isMuted);
          break;
        case 'toggleFullscreen':
          setIsFullscreen(!isFullscreen);
          break;
        default:
          console.warn(`Unknown quick action: ${action}`);
      }
      trackEvent(`quick_action_${action}`, { args });
    } catch (error) {
      console.error(`Quick action ${action} failed:`, error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Adaptive Streaming Player</h2>
          <p className="text-muted-foreground">
            Advanced video streaming with adaptive quality and intelligent caching
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsOverlay(!showStatsOverlay)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => actions.captureFrame()}>
                <Camera className="h-4 w-4 mr-2" />
                Capture Frame
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.generateThumbnail(computed.progress)}>
                <Image className="h-4 w-4 mr-2" />
                Generate Thumbnail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.reset()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Player
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <span>Loading stream...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold ${card.color}`}>
                      {card.value}
                    </p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Player Tab */}
        <TabsContent value="player" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Player</CardTitle>
              <CardDescription>
                Main video player with adaptive streaming controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  poster="/api/placeholder/800/450"
                />
                
                {/* Video Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                
                {/* Stats Overlay */}
                {showStatsOverlay && (
                  <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-sm space-y-1">
                    <div>Quality: {computed.qualityLabel}</div>
                    <div>Bitrate: {computed.bitrateFormatted}</div>
                    <div>Resolution: {computed.resolutionFormatted}</div>
                    <div>Buffer: {bufferPercentage.toFixed(1)}%</div>
                    <div>Network: {formatBitrate(networkMetrics.bandwidth)}</div>
                  </div>
                )}
                
                {/* Play/Pause Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    onClick={() => computed.isPlaying ? pause() : play()}
                  >
                    {computed.isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatTime(computed.progress * (activeStream?.duration || 0) / 100)}</span>
                  <span>{formatTime(activeStream?.duration || 0)}</span>
                </div>
                <Progress value={computed.progress} className="h-2" />
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('skipBackward')}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => computed.isPlaying ? pause() : play()}
                  >
                    {computed.isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('skipForward')}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('toggleMute')}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="w-24">
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <Select value={computed.qualityLabel} onValueChange={(value) => {
                    const quality = availableQualities.find(q => q.label === value);
                    if (quality) setQuality(quality);
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQualities.map((quality) => (
                        <SelectItem key={quality.id} value={quality.label}>
                          {quality.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('toggleFullscreen')}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Settings</CardTitle>
                <CardDescription>
                  Configure video quality and adaptive streaming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Adaptive Quality</Label>
                  <Switch
                    checked={computed.isAdaptiveEnabled}
                    onCheckedChange={toggleAdaptive}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Manual Quality Selection</Label>
                  <Select
                    value={currentQuality?.id}
                    onValueChange={(value) => {
                      const quality = availableQualities.find(q => q.id === value);
                      if (quality) setQuality(quality);
                    }}
                    disabled={computed.isAdaptiveEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQualities.map((quality) => (
                        <SelectItem key={quality.id} value={quality.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{quality.label}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {formatBitrate(quality.bitrate)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Current Quality</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{currentQuality?.label}</span>
                      <Badge variant="outline">{computed.resolutionFormatted}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Bitrate: {computed.bitrateFormatted} • FPS: {currentQuality?.fps}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Available Qualities</CardTitle>
                <CardDescription>
                  All available quality options for this stream
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableQualities.map((quality) => (
                    <div
                      key={quality.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentQuality?.id === quality.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setQuality(quality)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{quality.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {quality.width}x{quality.height} • {quality.fps}fps
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatBitrate(quality.bitrate)}</div>
                          <div className="text-sm text-muted-foreground">{quality.codec}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
                <CardDescription>
                  Real-time network performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Connection Type</Label>
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="capitalize">{networkMetrics.connectionType}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Effective Type</Label>
                    <Badge variant="outline">{networkMetrics.effectiveType}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bandwidth</Label>
                    <div className="text-lg font-semibold">
                      {formatBitrate(networkMetrics.bandwidth)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Latency</Label>
                    <div className="text-lg font-semibold">
                      {networkMetrics.latency}ms
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Download Speed</Label>
                  <Progress value={(networkMetrics.downlink / 10) * 100} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    {networkMetrics.downlink.toFixed(1)} Mbps
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Round Trip Time</Label>
                  <Progress value={(networkMetrics.rtt / 500) * 100} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    {networkMetrics.rtt}ms
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Network Monitoring</CardTitle>
                <CardDescription>
                  Real-time network performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Real-time Monitoring</Label>
                  <Switch
                    checked={isMonitoring}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        startMonitoring();
                      } else {
                        stopMonitoring();
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Data Saver Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Switch checked={networkMetrics.saveData} disabled />
                    <span className="text-sm text-muted-foreground">
                      {networkMetrics.saveData ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Packet Loss</Label>
                  <Progress value={networkMetrics.packetLoss * 100} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    {(networkMetrics.packetLoss * 100).toFixed(2)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Jitter</Label>
                  <Progress value={(networkMetrics.jitter / 50) * 100} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    {networkMetrics.jitter.toFixed(1)}ms
                  </div>
                </div>
                
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <div className="space-y-1">
                    {generateStreamingRecommendations(networkMetrics, bufferMetrics).map((rec, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Buffer Tab */}
        <TabsContent value="buffer" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Buffer Status</CardTitle>
                <CardDescription>
                  Current buffer health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Buffer Health</Label>
                    <Badge
                      variant={isHealthy ? 'default' : 'destructive'}
                      className={getBufferHealthColor(bufferMetrics.health)}
                    >
                      {bufferMetrics.health}
                    </Badge>
                  </div>
                  <Progress value={bufferPercentage} className="h-3" />
                  <div className="text-sm text-muted-foreground">
                    {bufferMetrics.currentBuffer.toFixed(1)}s / {bufferMetrics.maxBuffer}s
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Buffer</Label>
                    <div className="text-lg font-semibold">
                      {bufferMetrics.targetBuffer}s
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Buffer</Label>
                    <div className="text-lg font-semibold">
                      {bufferMetrics.maxBuffer}s
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Underruns</Label>
                    <div className="text-lg font-semibold text-red-600">
                      {bufferMetrics.underruns}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Overruns</Label>
                    <div className="text-lg font-semibold text-yellow-600">
                      {bufferMetrics.overruns}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Buffer Configuration</CardTitle>
                <CardDescription>
                  Adjust buffer settings for optimal performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Buffer Size (seconds)</Label>
                  <Slider
                    value={[config.bufferTarget]}
                    onValueChange={(value) => updateSetting('bufferTarget', value[0])}
                    min={5}
                    max={60}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.bufferTarget}s
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum Buffer Size (seconds)</Label>
                  <Slider
                    value={[config.bufferMax]}
                    onValueChange={(value) => updateSetting('bufferMax', value[0])}
                    min={10}
                    max={120}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.bufferMax}s
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Preload Segments</Label>
                  <Slider
                    value={[config.preloadSegments]}
                    onValueChange={(value) => updateSetting('preloadSegments', value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.preloadSegments} segments
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Preload Enabled</Label>
                  <Switch
                    checked={config.preloadEnabled}
                    onCheckedChange={(checked) => updateSetting('preloadEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Status</CardTitle>
                <CardDescription>
                  Current cache usage and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cache Usage</Label>
                    <Badge variant={cacheStats.isFull ? 'destructive' : 'default'}>
                      {cacheStats.usagePercentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={cacheStats.usagePercentage} className="h-3" />
                  <div className="text-sm text-muted-foreground">
                    {(cacheStats.totalSize / 1024 / 1024).toFixed(1)} MB / {(config.maxCacheSize / 1024 / 1024).toFixed(0)} MB
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cached Entries</Label>
                    <div className="text-lg font-semibold">
                      {cacheStats.entryCount}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Hit Rate</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {(stats.cacheHitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Cache Efficiency</Label>
                  <div className="text-lg font-semibold">
                    {calculateCacheEfficiency(cache).toFixed(2)} access/MB
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCache}
                    className="flex-1"
                  >
                    <HardDrive className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cache Entries</CardTitle>
                <CardDescription>
                  Detailed view of cached content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cache.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No cached entries
                    </div>
                  ) : (
                    cache.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {entry.quality.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(entry.size / 1024 / 1024).toFixed(1)} MB • {entry.accessCount} access
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => actions.removeFromCache(entry.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Streaming performance and quality metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Streams</Label>
                    <div className="text-lg font-semibold">
                      {performanceMetrics.totalStreams}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Active Streams</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {performanceMetrics.activeStreams}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quality Switches</Label>
                    <div className="text-lg font-semibold">
                      {performanceMetrics.qualitySwitches}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Buffer Underruns</Label>
                    <div className="text-lg font-semibold text-red-600">
                      {performanceMetrics.bufferUnderruns}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Error Rate</Label>
                    <div className="text-lg font-semibold">
                      {performanceMetrics.errorRate.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cache Efficiency</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {performanceMetrics.cacheEfficiency.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Average Bandwidth</Label>
                  <div className="text-lg font-semibold">
                    {formatBitrate(performanceMetrics.averageBitrate || 0)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Uptime</Label>
                  <div className="text-lg font-semibold">
                    {formatDuration(performanceMetrics.uptime / 1000)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
                <CardDescription>
                  Breakdown of quality usage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableQualities.map((quality) => {
                    const usage = Math.random() * 100; // Simulated data
                    return (
                      <div key={quality.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{quality.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {usage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={usage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general streaming behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Adaptive Streaming</Label>
                  <Switch
                    checked={config.adaptiveEnabled}
                    onCheckedChange={(checked) => updateSetting('adaptiveEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Preload Enabled</Label>
                  <Switch
                    checked={config.preloadEnabled}
                    onCheckedChange={(checked) => updateSetting('preloadEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Cache Enabled</Label>
                  <Switch
                    checked={config.cacheEnabled}
                    onCheckedChange={(checked) => updateSetting('cacheEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Quality Steps</Label>
                  <Slider
                    value={[config.qualitySteps]}
                    onValueChange={(value) => updateSetting('qualitySteps', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.qualitySteps} steps
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Bitrate Threshold</Label>
                  <Slider
                    value={[config.bitrateThreshold * 100]}
                    onValueChange={(value) => updateSetting('bitrateThreshold', value[0] / 100)}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {(config.bitrateThreshold * 100).toFixed(0)}%
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Fine-tune streaming performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Cache Size (MB)</Label>
                  <Slider
                    value={[config.maxCacheSize / 1024 / 1024]}
                    onValueChange={(value) => updateSetting('maxCacheSize', value[0] * 1024 * 1024)}
                    min={10}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {(config.maxCacheSize / 1024 / 1024).toFixed(0)} MB
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Latency Threshold (ms)</Label>
                  <Slider
                    value={[config.latencyThreshold]}
                    onValueChange={(value) => updateSetting('latencyThreshold', value[0])}
                    min={50}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.latencyThreshold}ms
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Switch Cooldown (ms)</Label>
                  <Slider
                    value={[config.switchCooldown]}
                    onValueChange={(value) => updateSetting('switchCooldown', value[0])}
                    min={1000}
                    max={30000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.switchCooldown / 1000}s
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Slider
                    value={[config.maxRetries]}
                    onValueChange={(value) => updateSetting('maxRetries', value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.maxRetries} retries
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Retry Delay (ms)</Label>
                  <Slider
                    value={[config.retryDelay]}
                    onValueChange={(value) => updateSetting('retryDelay', value[0])}
                    min={500}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {config.retryDelay}ms
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdaptiveStreamingPlayer;