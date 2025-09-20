import { create } from 'zustand';

// Types and Interfaces
export interface VideoQuality {
  id: string;
  label: string;
  width: number;
  height: number;
  bitrate: number; // kbps
  fps: number;
  codec: string;
  profile: string;
}

export interface StreamSegment {
  id: string;
  url: string;
  duration: number;
  quality: VideoQuality;
  size: number; // bytes
  timestamp: number;
  sequence: number;
}

export interface AdaptiveStream {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  qualities: VideoQuality[];
  segments: StreamSegment[];
  manifest: string;
  type: 'hls' | 'dash' | 'smooth';
  status: 'preparing' | 'ready' | 'streaming' | 'paused' | 'error';
  metadata: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    processingTime: number;
    views: number;
    bandwidth: number;
    bufferHealth: number;
  };
  analytics: {
    totalViews: number;
    averageWatchTime: number;
    qualitySwitches: number;
    bufferEvents: number;
    errorRate: number;
    userSatisfaction: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkCondition {
  bandwidth: number; // kbps
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PlayerState {
  currentTime: number;
  duration: number;
  buffered: TimeRanges | null;
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  volume: number;
  muted: boolean;
  playbackRate: number;
  currentQuality: VideoQuality | null;
  availableQualities: VideoQuality[];
  autoQuality: boolean;
}

export interface StreamingConfig {
  adaptive: {
    enabled: boolean;
    algorithm: 'bandwidth' | 'buffer' | 'hybrid';
    switchThreshold: number;
    bufferTarget: number;
    maxBufferSize: number;
  };
  quality: {
    autoSelect: boolean;
    preferredQuality: string;
    maxQuality: string;
    minQuality: string;
    bitrateMultiplier: number;
  };
  buffering: {
    initialBuffer: number;
    rebufferThreshold: number;
    maxRebuffers: number;
    seekThreshold: number;
  };
  network: {
    bandwidthEstimation: boolean;
    latencyOptimization: boolean;
    adaptiveSegmentSize: boolean;
    preloadSegments: number;
  };
  analytics: {
    enabled: boolean;
    reportInterval: number;
    trackQualitySwitches: boolean;
    trackBufferEvents: boolean;
  };
}

export interface StreamingStats {
  totalStreams: number;
  activeStreams: number;
  totalBandwidth: number;
  averageQuality: number;
  bufferHealth: number;
  errorRate: number;
  userSatisfaction: number;
  systemHealth: number;
  isHealthy: boolean;
  lastUpdated: Date;
}

export interface StreamingMetrics {
  qualityDistribution: Record<string, number>;
  bandwidthUsage: Array<{ timestamp: Date; bandwidth: number }>;
  bufferEvents: Array<{ timestamp: Date; type: 'underrun' | 'overflow'; duration: number }>;
  qualitySwitches: Array<{ timestamp: Date; from: string; to: string; reason: string }>;
  errorEvents: Array<{ timestamp: Date; type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  performanceMetrics: {
    startupTime: number;
    seekTime: number;
    rebufferRatio: number;
    qualityScore: number;
  };
}

// Utility Functions
export const formatBitrate = (bitrate: number): string => {
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(1)} Mbps`;
  }
  return `${bitrate} kbps`;
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const getQualityColor = (quality: string): string => {
  switch (quality.toLowerCase()) {
    case '4k':
    case '2160p':
      return 'text-purple-600';
    case '1080p':
    case 'fhd':
      return 'text-blue-600';
    case '720p':
    case 'hd':
      return 'text-green-600';
    case '480p':
    case 'sd':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

export const getNetworkQualityIcon = (quality: string) => {
  switch (quality) {
    case 'excellent':
      return '📶';
    case 'good':
      return '📶';
    case 'fair':
      return '📶';
    case 'poor':
      return '📶';
    default:
      return '📶';
  }
};

export const getStreamStatusColor = (status: string): string => {
  switch (status) {
    case 'ready':
    case 'streaming':
      return 'text-green-600';
    case 'preparing':
      return 'text-yellow-600';
    case 'paused':
      return 'text-blue-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const calculateSystemHealth = (stats: StreamingStats): number => {
  const bufferWeight = 0.3;
  const errorWeight = 0.3;
  const satisfactionWeight = 0.4;
  
  const bufferScore = Math.min(stats.bufferHealth * 100, 100);
  const errorScore = Math.max(100 - (stats.errorRate * 100), 0);
  const satisfactionScore = stats.userSatisfaction * 100;
  
  return bufferWeight * bufferScore + errorWeight * errorScore + satisfactionWeight * satisfactionScore;
};

export const generateStreamingRecommendations = (stats: StreamingStats, config: StreamingConfig): string[] => {
  const recommendations: string[] = [];
  
  if (stats.bufferHealth < 0.8) {
    recommendations.push('Consider increasing buffer target for better playback stability');
  }
  
  if (stats.errorRate > 0.05) {
    recommendations.push('High error rate detected - check network conditions and server capacity');
  }
  
  if (stats.userSatisfaction < 0.7) {
    recommendations.push('User satisfaction is low - review quality adaptation algorithm');
  }
  
  if (!config.adaptive.enabled) {
    recommendations.push('Enable adaptive streaming for better user experience');
  }
  
  if (config.buffering.initialBuffer < 3) {
    recommendations.push('Increase initial buffer size to reduce startup delays');
  }
  
  return recommendations;
};

// Zustand Store
interface AdaptiveStreamingStore {
  // State
  streams: AdaptiveStream[];
  networkCondition: NetworkCondition;
  playerState: PlayerState;
  config: StreamingConfig;
  stats: StreamingStats;
  metrics: StreamingMetrics;
  isLoading: boolean;
  error: string | null;
  selectedStreamId: string | null;
  selectedQualityId: string | null;
  
  // Computed
  computed: {
    totalStreams: number;
    activeStreams: number;
    totalBandwidth: number;
    averageQuality: number;
    healthyStreams: number;
    recentActivity: Array<{
      type: 'quality_switch' | 'buffer_event' | 'error' | 'stream_start';
      timestamp: Date;
      details: string;
      severity?: 'low' | 'medium' | 'high';
    }>;
  };
  
  // Actions
  actions: {
    // Stream Management
    createStream: (streamData: Partial<AdaptiveStream>) => Promise<void>;
    updateStream: (id: string, updates: Partial<AdaptiveStream>) => Promise<void>;
    deleteStream: (id: string) => Promise<void>;
    processVideo: (videoFile: File, qualities: VideoQuality[]) => Promise<string>;
    
    // Playback Control
    playStream: (streamId: string) => Promise<void>;
    pauseStream: (streamId: string) => Promise<void>;
    seekTo: (streamId: string, time: number) => Promise<void>;
    changeQuality: (streamId: string, qualityId: string) => Promise<void>;
    toggleAutoQuality: (streamId: string) => Promise<void>;
    
    // Network Management
    updateNetworkCondition: (condition: Partial<NetworkCondition>) => void;
    estimateBandwidth: () => Promise<number>;
    optimizeForNetwork: () => Promise<void>;
    
    // Configuration
    updateConfig: (updates: Partial<StreamingConfig>) => Promise<void>;
    resetConfig: () => Promise<void>;
    exportConfig: () => string;
    importConfig: (configJson: string) => Promise<void>;
    
    // Analytics
    trackEvent: (event: string, data: any) => void;
    generateReport: () => Promise<string>;
    clearMetrics: () => void;
    
    // System Operations
    refresh: () => Promise<void>;
    cleanup: () => Promise<void>;
    optimize: () => Promise<void>;
  };
  
  // Setters
  setSelectedStream: (streamId: string | null) => void;
  setSelectedQuality: (qualityId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAdaptiveStreamingStore = create<AdaptiveStreamingStore>((set, get) => ({
  // Initial State
  streams: [],
  networkCondition: {
    bandwidth: 5000,
    latency: 50,
    packetLoss: 0,
    jitter: 10,
    connectionType: 'wifi',
    quality: 'good'
  },
  playerState: {
    currentTime: 0,
    duration: 0,
    buffered: null,
    isPlaying: false,
    isPaused: true,
    isBuffering: false,
    volume: 1,
    muted: false,
    playbackRate: 1,
    currentQuality: null,
    availableQualities: [],
    autoQuality: true
  },
  config: {
    adaptive: {
      enabled: true,
      algorithm: 'hybrid',
      switchThreshold: 0.2,
      bufferTarget: 10,
      maxBufferSize: 30
    },
    quality: {
      autoSelect: true,
      preferredQuality: '1080p',
      maxQuality: '4k',
      minQuality: '480p',
      bitrateMultiplier: 1.2
    },
    buffering: {
      initialBuffer: 5,
      rebufferThreshold: 2,
      maxRebuffers: 3,
      seekThreshold: 1
    },
    network: {
      bandwidthEstimation: true,
      latencyOptimization: true,
      adaptiveSegmentSize: true,
      preloadSegments: 3
    },
    analytics: {
      enabled: true,
      reportInterval: 30,
      trackQualitySwitches: true,
      trackBufferEvents: true
    }
  },
  stats: {
    totalStreams: 0,
    activeStreams: 0,
    totalBandwidth: 0,
    averageQuality: 0,
    bufferHealth: 0.9,
    errorRate: 0.02,
    userSatisfaction: 0.85,
    systemHealth: 0,
    isHealthy: true,
    lastUpdated: new Date()
  },
  metrics: {
    qualityDistribution: {},
    bandwidthUsage: [],
    bufferEvents: [],
    qualitySwitches: [],
    errorEvents: [],
    performanceMetrics: {
      startupTime: 2.5,
      seekTime: 1.2,
      rebufferRatio: 0.03,
      qualityScore: 0.8
    }
  },
  isLoading: false,
  error: null,
  selectedStreamId: null,
  selectedQualityId: null,
  
  // Computed
  computed: {
    get totalStreams() {
      return get().streams.length;
    },
    get activeStreams() {
      return get().streams.filter(s => s.status === 'streaming').length;
    },
    get totalBandwidth() {
      return get().streams
        .filter(s => s.status === 'streaming')
        .reduce((total, stream) => total + stream.metadata.bandwidth, 0);
    },
    get averageQuality() {
      const streams = get().streams.filter(s => s.status === 'streaming');
      if (streams.length === 0) return 0;
      
      const totalBitrate = streams.reduce((total, stream) => {
        const currentQuality = stream.qualities.find(q => q.id === get().selectedQualityId);
        return total + (currentQuality?.bitrate || 0);
      }, 0);
      
      return totalBitrate / streams.length;
    },
    get healthyStreams() {
      return get().streams.filter(s => 
        s.status === 'ready' || s.status === 'streaming'
      ).length;
    },
    get recentActivity() {
      const { metrics } = get();
      const activities: any[] = [];
      
      // Add recent quality switches
      metrics.qualitySwitches.slice(-5).forEach(event => {
        activities.push({
          type: 'quality_switch',
          timestamp: event.timestamp,
          details: `Quality changed from ${event.from} to ${event.to}`,
          severity: 'low'
        });
      });
      
      // Add recent buffer events
      metrics.bufferEvents.slice(-3).forEach(event => {
        activities.push({
          type: 'buffer_event',
          timestamp: event.timestamp,
          details: `Buffer ${event.type} for ${event.duration.toFixed(1)}s`,
          severity: event.type === 'underrun' ? 'medium' : 'low'
        });
      });
      
      // Add recent errors
      metrics.errorEvents.slice(-2).forEach(event => {
        activities.push({
          type: 'error',
          timestamp: event.timestamp,
          details: event.message,
          severity: event.severity
        });
      });
      
      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  },
  
  // Actions
  actions: {
    createStream: async (streamData) => {
      set({ isLoading: true, error: null });
      
      try {
        const newStream: AdaptiveStream = {
          id: `stream-${Date.now()}`,
          title: streamData.title || 'Untitled Stream',
          description: streamData.description || '',
          duration: streamData.duration || 0,
          thumbnail: streamData.thumbnail || '',
          qualities: streamData.qualities || [],
          segments: [],
          manifest: '',
          type: streamData.type || 'hls',
          status: 'preparing',
          metadata: {
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
            processingTime: 0,
            views: 0,
            bandwidth: 0,
            bufferHealth: 1
          },
          analytics: {
            totalViews: 0,
            averageWatchTime: 0,
            qualitySwitches: 0,
            bufferEvents: 0,
            errorRate: 0,
            userSatisfaction: 0.8
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          ...streamData
        };
        
        set(state => ({
          streams: [...state.streams, newStream],
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to create stream', isLoading: false });
      }
    },
    
    updateStream: async (id, updates) => {
      set(state => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, ...updates, updatedAt: new Date() }
            : stream
        )
      }));
    },
    
    deleteStream: async (id) => {
      set(state => ({
        streams: state.streams.filter(stream => stream.id !== id)
      }));
    },
    
    processVideo: async (videoFile, qualities) => {
      set({ isLoading: true, error: null });
      
      try {
        // Simulate video processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const streamId = `stream-${Date.now()}`;
        
        // Create segments for each quality
        const segments: StreamSegment[] = [];
        qualities.forEach((quality, qIndex) => {
          for (let i = 0; i < 10; i++) {
            segments.push({
              id: `${streamId}-${quality.id}-${i}`,
              url: `/segments/${streamId}/${quality.id}/segment-${i}.ts`,
              duration: 10,
              quality,
              size: quality.bitrate * 1250, // Approximate size in bytes
              timestamp: Date.now() + (i * 10000),
              sequence: i
            });
          }
        });
        
        const newStream: AdaptiveStream = {
          id: streamId,
          title: videoFile.name.replace(/\.[^/.]+$/, ''),
          description: `Processed video from ${videoFile.name}`,
          duration: 100, // 10 segments * 10 seconds
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20thumbnail%20streaming%20adaptive&image_size=landscape_16_9',
          qualities,
          segments,
          manifest: `/manifests/${streamId}/playlist.m3u8`,
          type: 'hls',
          status: 'ready',
          metadata: {
            originalSize: videoFile.size,
            compressedSize: videoFile.size * 0.7,
            compressionRatio: 0.3,
            processingTime: 120,
            views: 0,
            bandwidth: 0,
            bufferHealth: 1
          },
          analytics: {
            totalViews: 0,
            averageWatchTime: 0,
            qualitySwitches: 0,
            bufferEvents: 0,
            errorRate: 0,
            userSatisfaction: 0.8
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          streams: [...state.streams, newStream],
          isLoading: false
        }));
        
        return streamId;
      } catch (error) {
        set({ error: 'Failed to process video', isLoading: false });
        throw error;
      }
    },
    
    playStream: async (streamId) => {
      const stream = get().streams.find(s => s.id === streamId);
      if (!stream) return;
      
      await get().actions.updateStream(streamId, { status: 'streaming' });
      
      set(state => ({
        playerState: {
          ...state.playerState,
          isPlaying: true,
          isPaused: false
        }
      }));
    },
    
    pauseStream: async (streamId) => {
      await get().actions.updateStream(streamId, { status: 'paused' });
      
      set(state => ({
        playerState: {
          ...state.playerState,
          isPlaying: false,
          isPaused: true
        }
      }));
    },
    
    seekTo: async (streamId, time) => {
      set(state => ({
        playerState: {
          ...state.playerState,
          currentTime: time
        }
      }));
    },
    
    changeQuality: async (streamId, qualityId) => {
      const stream = get().streams.find(s => s.id === streamId);
      const quality = stream?.qualities.find(q => q.id === qualityId);
      
      if (quality) {
        set(state => ({
          playerState: {
            ...state.playerState,
            currentQuality: quality
          },
          selectedQualityId: qualityId
        }));
        
        // Track quality switch
        get().actions.trackEvent('quality_switch', {
          streamId,
          from: get().playerState.currentQuality?.id,
          to: qualityId,
          reason: 'manual'
        });
      }
    },
    
    toggleAutoQuality: async (streamId) => {
      set(state => ({
        playerState: {
          ...state.playerState,
          autoQuality: !state.playerState.autoQuality
        }
      }));
    },
    
    updateNetworkCondition: (condition) => {
      set(state => ({
        networkCondition: {
          ...state.networkCondition,
          ...condition
        }
      }));
    },
    
    estimateBandwidth: async () => {
      // Simulate bandwidth estimation
      const bandwidth = Math.random() * 10000 + 1000; // 1-11 Mbps
      
      get().actions.updateNetworkCondition({ bandwidth });
      return bandwidth;
    },
    
    optimizeForNetwork: async () => {
      const { networkCondition, config } = get();
      
      // Adjust quality based on network conditions
      if (networkCondition.bandwidth < 2000) {
        await get().actions.updateConfig({
          quality: {
            ...config.quality,
            maxQuality: '480p'
          }
        });
      } else if (networkCondition.bandwidth < 5000) {
        await get().actions.updateConfig({
          quality: {
            ...config.quality,
            maxQuality: '720p'
          }
        });
      }
    },
    
    updateConfig: async (updates) => {
      set(state => ({
        config: {
          ...state.config,
          ...updates
        }
      }));
    },
    
    resetConfig: async () => {
      // Reset to default config
      set(state => ({
        config: {
          adaptive: {
            enabled: true,
            algorithm: 'hybrid',
            switchThreshold: 0.2,
            bufferTarget: 10,
            maxBufferSize: 30
          },
          quality: {
            autoSelect: true,
            preferredQuality: '1080p',
            maxQuality: '4k',
            minQuality: '480p',
            bitrateMultiplier: 1.2
          },
          buffering: {
            initialBuffer: 5,
            rebufferThreshold: 2,
            maxRebuffers: 3,
            seekThreshold: 1
          },
          network: {
            bandwidthEstimation: true,
            latencyOptimization: true,
            adaptiveSegmentSize: true,
            preloadSegments: 3
          },
          analytics: {
            enabled: true,
            reportInterval: 30,
            trackQualitySwitches: true,
            trackBufferEvents: true
          }
        }
      }));
    },
    
    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },
    
    importConfig: async (configJson) => {
      try {
        const config = JSON.parse(configJson);
        await get().actions.updateConfig(config);
      } catch (error) {
        set({ error: 'Invalid configuration format' });
      }
    },
    
    trackEvent: (event, data) => {
      const { metrics } = get();
      
      switch (event) {
        case 'quality_switch':
          set(state => ({
            metrics: {
              ...state.metrics,
              qualitySwitches: [
                ...state.metrics.qualitySwitches,
                {
                  timestamp: new Date(),
                  from: data.from || 'unknown',
                  to: data.to,
                  reason: data.reason
                }
              ]
            }
          }));
          break;
        
        case 'buffer_event':
          set(state => ({
            metrics: {
              ...state.metrics,
              bufferEvents: [
                ...state.metrics.bufferEvents,
                {
                  timestamp: new Date(),
                  type: data.type,
                  duration: data.duration
                }
              ]
            }
          }));
          break;
        
        case 'error':
          set(state => ({
            metrics: {
              ...state.metrics,
              errorEvents: [
                ...state.metrics.errorEvents,
                {
                  timestamp: new Date(),
                  type: data.type,
                  message: data.message,
                  severity: data.severity || 'medium'
                }
              ]
            }
          }));
          break;
      }
    },
    
    generateReport: async () => {
      const { stats, metrics, streams } = get();
      
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalStreams: stats.totalStreams,
          activeStreams: stats.activeStreams,
          systemHealth: stats.systemHealth,
          userSatisfaction: stats.userSatisfaction
        },
        performance: metrics.performanceMetrics,
        qualityDistribution: metrics.qualityDistribution,
        recentEvents: {
          qualitySwitches: metrics.qualitySwitches.length,
          bufferEvents: metrics.bufferEvents.length,
          errors: metrics.errorEvents.length
        },
        streams: streams.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          views: s.analytics.totalViews,
          satisfaction: s.analytics.userSatisfaction
        }))
      };
      
      return JSON.stringify(report, null, 2);
    },
    
    clearMetrics: () => {
      set(state => ({
        metrics: {
          qualityDistribution: {},
          bandwidthUsage: [],
          bufferEvents: [],
          qualitySwitches: [],
          errorEvents: [],
          performanceMetrics: {
            startupTime: 0,
            seekTime: 0,
            rebufferRatio: 0,
            qualityScore: 0
          }
        }
      }));
    },
    
    refresh: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // Simulate data refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update stats
        const streams = get().streams;
        const newStats: StreamingStats = {
          totalStreams: streams.length,
          activeStreams: streams.filter(s => s.status === 'streaming').length,
          totalBandwidth: streams.reduce((total, s) => total + s.metadata.bandwidth, 0),
          averageQuality: streams.length > 0 ? streams.reduce((total, s) => total + (s.qualities[0]?.bitrate || 0), 0) / streams.length : 0,
          bufferHealth: 0.9 + (Math.random() * 0.1),
          errorRate: Math.random() * 0.05,
          userSatisfaction: 0.8 + (Math.random() * 0.2),
          systemHealth: 0,
          isHealthy: true,
          lastUpdated: new Date()
        };
        
        newStats.systemHealth = calculateSystemHealth(newStats);
        newStats.isHealthy = newStats.systemHealth > 80;
        
        set({ stats: newStats, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to refresh data', isLoading: false });
      }
    },
    
    cleanup: async () => {
      // Remove old streams and clear metrics
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      set(state => ({
        streams: state.streams.filter(stream => 
          stream.createdAt > cutoffDate || stream.status === 'streaming'
        )
      }));
      
      get().actions.clearMetrics();
    },
    
    optimize: async () => {
      set({ isLoading: true });
      
      try {
        // Optimize network conditions
        await get().actions.optimizeForNetwork();
        
        // Estimate bandwidth
        await get().actions.estimateBandwidth();
        
        // Update stats
        await get().actions.refresh();
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: 'Optimization failed', isLoading: false });
      }
    }
  },
  
  // Setters
  setSelectedStream: (streamId) => set({ selectedStreamId: streamId }),
  setSelectedQuality: (qualityId) => set({ selectedQualityId: qualityId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));

// Global instance
export class AdaptiveStreamingManager {
  private static instance: AdaptiveStreamingManager;
  
  private constructor() {}
  
  static getInstance(): AdaptiveStreamingManager {
    if (!AdaptiveStreamingManager.instance) {
      AdaptiveStreamingManager.instance = new AdaptiveStreamingManager();
    }
    return AdaptiveStreamingManager.instance;
  }
  
  getStore() {
    return useAdaptiveStreamingStore;
  }
}

export const adaptiveStreamingManager = AdaptiveStreamingManager.getInstance();