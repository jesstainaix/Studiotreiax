import { useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  useAdaptiveStreamingStore,
  AdaptiveStream,
  VideoQuality,
  NetworkCondition,
  PlayerState,
  StreamingConfig,
  StreamingStats,
  StreamingMetrics
} from '../services/adaptiveStreamingService';

// Utility hooks for throttling and debouncing
const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
};

const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Progress tracking hook
export const useStreamingProgress = () => {
  const { isLoading, error, stats } = useAdaptiveStreamingStore();
  
  return {
    isLoading,
    error,
    progress: {
      systemHealth: stats.systemHealth,
      bufferHealth: stats.bufferHealth,
      userSatisfaction: stats.userSatisfaction,
      isHealthy: stats.isHealthy
    }
  };
};

// Main hook with auto-initialization and refresh
export const useAdaptiveStreaming = (autoRefresh = true, refreshInterval = 30000) => {
  const store = useAdaptiveStreamingStore();
  const {
    streams,
    networkCondition,
    playerState,
    config,
    stats,
    metrics,
    isLoading,
    error,
    selectedStreamId,
    selectedQualityId,
    computed,
    actions,
    setSelectedStream,
    setSelectedQuality,
    setLoading,
    setError
  } = store;

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        actions.refresh();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, actions]);

  // Initialize with demo data
  useEffect(() => {
    const initializeDemoData = async () => {
      if (streams.length === 0) {
        // Create demo streams
        const demoQualities: VideoQuality[] = [
          {
            id: '4k',
            label: '4K Ultra HD',
            width: 3840,
            height: 2160,
            bitrate: 15000,
            fps: 60,
            codec: 'h264',
            profile: 'high'
          },
          {
            id: '1080p',
            label: 'Full HD',
            width: 1920,
            height: 1080,
            bitrate: 8000,
            fps: 60,
            codec: 'h264',
            profile: 'high'
          },
          {
            id: '720p',
            label: 'HD',
            width: 1280,
            height: 720,
            bitrate: 4000,
            fps: 30,
            codec: 'h264',
            profile: 'main'
          },
          {
            id: '480p',
            label: 'SD',
            width: 854,
            height: 480,
            bitrate: 2000,
            fps: 30,
            codec: 'h264',
            profile: 'baseline'
          }
        ];

        const demoStreams = [
          {
            title: 'Product Demo Video',
            description: 'Comprehensive product demonstration with adaptive streaming',
            duration: 300,
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=product%20demo%20video%20streaming&image_size=landscape_16_9',
            qualities: demoQualities,
            type: 'hls' as const,
            metadata: {
              originalSize: 500000000,
              compressedSize: 350000000,
              compressionRatio: 0.3,
              processingTime: 180,
              views: 1250,
              bandwidth: 8000,
              bufferHealth: 0.95
            },
            analytics: {
              totalViews: 1250,
              averageWatchTime: 240,
              qualitySwitches: 15,
              bufferEvents: 2,
              errorRate: 0.01,
              userSatisfaction: 0.92
            }
          },
          {
            title: 'Training Session',
            description: 'Interactive training content with multiple quality options',
            duration: 1800,
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=training%20session%20video%20adaptive%20streaming&image_size=landscape_16_9',
            qualities: demoQualities.slice(1), // Exclude 4K
            type: 'dash' as const,
            metadata: {
              originalSize: 1200000000,
              compressedSize: 840000000,
              compressionRatio: 0.3,
              processingTime: 420,
              views: 850,
              bandwidth: 6000,
              bufferHealth: 0.88
            },
            analytics: {
              totalViews: 850,
              averageWatchTime: 1200,
              qualitySwitches: 25,
              bufferEvents: 5,
              errorRate: 0.02,
              userSatisfaction: 0.87
            }
          },
          {
            title: 'Live Webinar',
            description: 'Real-time streaming with adaptive bitrate',
            duration: 3600,
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=live%20webinar%20streaming%20adaptive&image_size=landscape_16_9',
            qualities: demoQualities.slice(2), // HD and SD only
            type: 'hls' as const,
            status: 'streaming' as const,
            metadata: {
              originalSize: 0, // Live stream
              compressedSize: 0,
              compressionRatio: 0,
              processingTime: 0,
              views: 320,
              bandwidth: 4500,
              bufferHealth: 0.92
            },
            analytics: {
              totalViews: 320,
              averageWatchTime: 2100,
              qualitySwitches: 8,
              bufferEvents: 1,
              errorRate: 0.005,
              userSatisfaction: 0.94
            }
          }
        ];

        for (const streamData of demoStreams) {
          await actions.createStream(streamData);
        }

        // Simulate network condition updates
        setTimeout(() => {
          actions.updateNetworkCondition({
            bandwidth: 7500,
            latency: 45,
            packetLoss: 0.1,
            jitter: 8,
            connectionType: 'wifi',
            quality: 'good'
          });
        }, 2000);
      }
    };

    initializeDemoData();
  }, [streams.length, actions]);

  // Memoized actions
  const memoizedActions = useMemo(() => ({
    createStream: actions.createStream,
    updateStream: actions.updateStream,
    deleteStream: actions.deleteStream,
    processVideo: actions.processVideo,
    playStream: actions.playStream,
    pauseStream: actions.pauseStream,
    seekTo: actions.seekTo,
    changeQuality: actions.changeQuality,
    toggleAutoQuality: actions.toggleAutoQuality,
    updateNetworkCondition: actions.updateNetworkCondition,
    estimateBandwidth: actions.estimateBandwidth,
    optimizeForNetwork: actions.optimizeForNetwork,
    updateConfig: actions.updateConfig,
    resetConfig: actions.resetConfig,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig,
    trackEvent: actions.trackEvent,
    generateReport: actions.generateReport,
    clearMetrics: actions.clearMetrics,
    refresh: actions.refresh,
    cleanup: actions.cleanup,
    optimize: actions.optimize
  }), [actions]);

  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickPlay: async (streamId: string) => {
      try {
        setError(null);
        await memoizedActions.playStream(streamId);
      } catch (error) {
        setError('Failed to play stream');
      }
    },
    quickPause: async (streamId: string) => {
      try {
        setError(null);
        await memoizedActions.pauseStream(streamId);
      } catch (error) {
        setError('Failed to pause stream');
      }
    },
    quickQualityChange: async (streamId: string, qualityId: string) => {
      try {
        setError(null);
        await memoizedActions.changeQuality(streamId, qualityId);
      } catch (error) {
        setError('Failed to change quality');
      }
    },
    quickOptimize: async () => {
      try {
        setError(null);
        await memoizedActions.optimize();
      } catch (error) {
        setError('Failed to optimize streaming');
      }
    }
  }), [memoizedActions, setError]);

  // Throttled actions
  const throttledActions = useMemo(() => ({
    throttledRefresh: useThrottle(memoizedActions.refresh, 5000),
    throttledOptimize: useThrottle(memoizedActions.optimize, 10000),
    throttledBandwidthEstimate: useThrottle(memoizedActions.estimateBandwidth, 3000)
  }), [memoizedActions]);

  // Debounced actions
  const debouncedActions = useMemo(() => ({
    debouncedConfigUpdate: useDebounce(memoizedActions.updateConfig, 1000),
    debouncedNetworkUpdate: useDebounce(memoizedActions.updateNetworkCondition, 500)
  }), [memoizedActions]);

  // Enhanced computed values
  const enhancedComputed = useMemo(() => ({
    ...computed,
    streamingComplexity: calculateStreamingComplexity(streams, config),
    networkQuality: getNetworkQualityScore(networkCondition),
    recommendedQuality: getRecommendedQuality(networkCondition, config),
    systemStatus: getSystemStatus(stats, metrics),
    performanceScore: calculatePerformanceScore(metrics),
    adaptationEfficiency: calculateAdaptationEfficiency(metrics)
  }), [computed, streams, config, networkCondition, stats, metrics]);

  // Filtered data
  const filteredData = useMemo(() => {
    const activeStreams = streams.filter(stream => 
      stream.status === 'streaming' || stream.status === 'ready'
    );
    
    const recentMetrics = {
      qualitySwitches: metrics.qualitySwitches.slice(-10),
      bufferEvents: metrics.bufferEvents.slice(-5),
      errorEvents: metrics.errorEvents.slice(-3)
    };
    
    return {
      activeStreams,
      recentMetrics,
      topPerformingStreams: streams
        .filter(s => s.analytics.userSatisfaction > 0.8)
        .sort((a, b) => b.analytics.userSatisfaction - a.analytics.userSatisfaction)
        .slice(0, 5)
    };
  }, [streams, metrics]);

  return {
    // State
    streams,
    networkCondition,
    playerState,
    config,
    stats,
    metrics,
    isLoading,
    error,
    selectedStreamId,
    selectedQualityId,
    
    // Computed
    computed: enhancedComputed,
    filtered: filteredData,
    
    // Actions
    actions: memoizedActions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Setters
    setSelectedStream,
    setSelectedQuality,
    setLoading,
    setError
  };
};

// Specialized hooks
export const useStreamingStats = () => {
  const { stats, computed } = useAdaptiveStreamingStore();
  
  return {
    stats,
    computed: {
      totalStreams: computed.totalStreams,
      activeStreams: computed.activeStreams,
      totalBandwidth: computed.totalBandwidth,
      averageQuality: computed.averageQuality,
      healthyStreams: computed.healthyStreams
    }
  };
};

export const useStreamingConfig = () => {
  const { config, actions } = useAdaptiveStreamingStore();
  
  return {
    config,
    updateConfig: actions.updateConfig,
    resetConfig: actions.resetConfig,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig
  };
};

export const useStreamSearch = (searchTerm: string, filters: {
  status?: string;
  type?: string;
  quality?: string;
} = {}) => {
  const { streams } = useAdaptiveStreamingStore();
  
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      const matchesSearch = !searchTerm || 
        stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || stream.status === filters.status;
      const matchesType = !filters.type || stream.type === filters.type;
      const matchesQuality = !filters.quality || 
        stream.qualities.some(q => q.label.toLowerCase().includes(filters.quality!.toLowerCase()));
      
      return matchesSearch && matchesStatus && matchesType && matchesQuality;
    });
  }, [streams, searchTerm, filters]);
  
  return {
    filteredStreams,
    totalResults: filteredStreams.length,
    hasResults: filteredStreams.length > 0
  };
};

export const useCurrentStream = () => {
  const { streams, selectedStreamId, playerState, actions } = useAdaptiveStreamingStore();
  
  const currentStream = useMemo(() => {
    return selectedStreamId ? streams.find(s => s.id === selectedStreamId) : null;
  }, [streams, selectedStreamId]);
  
  return {
    currentStream,
    playerState,
    playStream: actions.playStream,
    pauseStream: actions.pauseStream,
    seekTo: actions.seekTo,
    changeQuality: actions.changeQuality,
    toggleAutoQuality: actions.toggleAutoQuality
  };
};

export const useNetworkMonitoring = () => {
  const { networkCondition, actions } = useAdaptiveStreamingStore();
  
  const monitorNetwork = useCallback(async () => {
    const bandwidth = await actions.estimateBandwidth();
    await actions.optimizeForNetwork();
    return bandwidth;
  }, [actions]);
  
  return {
    networkCondition,
    monitorNetwork,
    updateNetworkCondition: actions.updateNetworkCondition,
    optimizeForNetwork: actions.optimizeForNetwork
  };
};

export const useStreamingAnalytics = () => {
  const { metrics, actions } = useAdaptiveStreamingStore();
  
  return {
    metrics,
    trackEvent: actions.trackEvent,
    generateReport: actions.generateReport,
    clearMetrics: actions.clearMetrics
  };
};

// Utility hooks
export const useThrottledAction = <T extends (...args: any[]) => any>(
  action: T,
  delay: number = 1000
) => {
  return useThrottle(action, delay);
};

export const useDebouncedAction = <T extends (...args: any[]) => any>(
  action: T,
  delay: number = 500
) => {
  return useDebounce(action, delay);
};

// Helper functions
const calculateStreamingComplexity = (
  streams: AdaptiveStream[],
  config: StreamingConfig
): 'low' | 'medium' | 'high' => {
  const activeStreams = streams.filter(s => s.status === 'streaming').length;
  const totalQualities = streams.reduce((total, s) => total + s.qualities.length, 0);
  const adaptiveEnabled = config.adaptive.enabled;
  
  if (activeStreams <= 2 && totalQualities <= 8 && !adaptiveEnabled) {
    return 'low';
  } else if (activeStreams <= 5 && totalQualities <= 20) {
    return 'medium';
  } else {
    return 'high';
  }
};

const getNetworkQualityScore = (condition: NetworkCondition): number => {
  const bandwidthScore = Math.min(condition.bandwidth / 10000, 1); // Normalize to 10 Mbps
  const latencyScore = Math.max(1 - (condition.latency / 200), 0); // Normalize to 200ms
  const lossScore = Math.max(1 - (condition.packetLoss / 5), 0); // Normalize to 5%
  
  return (bandwidthScore * 0.5 + latencyScore * 0.3 + lossScore * 0.2) * 100;
};

const getRecommendedQuality = (
  condition: NetworkCondition,
  config: StreamingConfig
): string => {
  if (condition.bandwidth >= 15000) return '4k';
  if (condition.bandwidth >= 8000) return '1080p';
  if (condition.bandwidth >= 4000) return '720p';
  return '480p';
};

const getSystemStatus = (
  stats: StreamingStats,
  metrics: StreamingMetrics
): 'excellent' | 'good' | 'fair' | 'poor' => {
  const health = stats.systemHealth;
  
  if (health >= 90) return 'excellent';
  if (health >= 75) return 'good';
  if (health >= 60) return 'fair';
  return 'poor';
};

const calculatePerformanceScore = (metrics: StreamingMetrics): number => {
  const { performanceMetrics } = metrics;
  
  const startupScore = Math.max(1 - (performanceMetrics.startupTime / 10), 0); // Normalize to 10s
  const seekScore = Math.max(1 - (performanceMetrics.seekTime / 5), 0); // Normalize to 5s
  const rebufferScore = Math.max(1 - (performanceMetrics.rebufferRatio * 10), 0);
  const qualityScore = performanceMetrics.qualityScore;
  
  return (startupScore * 0.25 + seekScore * 0.25 + rebufferScore * 0.25 + qualityScore * 0.25) * 100;
};

const calculateAdaptationEfficiency = (metrics: StreamingMetrics): number => {
  const totalSwitches = metrics.qualitySwitches.length;
  const bufferEvents = metrics.bufferEvents.length;
  const errors = metrics.errorEvents.length;
  
  if (totalSwitches === 0) return 100;
  
  const efficiency = Math.max(1 - ((bufferEvents + errors) / totalSwitches), 0);
  return efficiency * 100;
};

export default useAdaptiveStreaming;