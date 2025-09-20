import {
  PerformanceMetrics,
  PerformanceHistory,
  HardwareInfo,
  Bottleneck,
  PerformanceAlert,
  PerformanceEvent,
  PerformanceConfig,
  PerformanceEventHandler,
  RenderPerformance,
  CachePerformance
} from '../types/performance';

class PerformanceEngine {
  private static instance: PerformanceEngine;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, PerformanceEventHandler[]> = new Map();
  private metricsHistory: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  private hardwareInfo: HardwareInfo | null = null;
  private renderJobs: Map<string, RenderPerformance> = new Map();
  private cacheStats: CachePerformance;

  constructor() {
    this.config = {
      monitoringInterval: 1000, // 1 second
      historyRetention: 24, // 24 hours
      alertThresholds: {
        cpu: 80,
        memory: 85,
        fps: 30,
        renderTime: 100
      },
      autoOptimization: {
        enabled: true,
        aggressiveness: 'moderate',
        conditions: {
          cpuThreshold: 75,
          memoryThreshold: 80,
          fpsThreshold: 25
        }
      }
    };

    this.cacheStats = {
      hitRate: 0,
      missRate: 0,
      size: 0,
      maxSize: 100 * 1024 * 1024, // 100MB
      entries: 0,
      evictions: 0,
      averageAccessTime: 0,
      memoryUsage: 0
    };

    this.initializeHardwareDetection();
  }

  static getInstance(): PerformanceEngine {
    if (!PerformanceEngine.instance) {
      PerformanceEngine.instance = new PerformanceEngine();
    }
    return PerformanceEngine.instance;
  }

  // Hardware Detection
  private async initializeHardwareDetection(): Promise<void> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

      // Get memory info if available
      const memoryInfo = (navigator as any).deviceMemory || 4; // Default to 4GB
      const storageEstimate = await navigator.storage?.estimate() || { quota: 0, usage: 0 };

      this.hardwareInfo = {
        cpu: {
          cores: navigator.hardwareConcurrency || 4,
          threads: navigator.hardwareConcurrency || 4,
          architecture: 'unknown',
          vendor: 'unknown'
        },
        memory: {
          total: memoryInfo * 1024 * 1024 * 1024, // Convert GB to bytes
          available: 0,
          used: 0,
          percentage: 0
        },
        gpu: {
          vendor: vendor as string,
          renderer: renderer as string,
          webglVersion: gl ? (gl.getParameter(gl.VERSION) as string) : 'Not supported',
          maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
          supportedExtensions: gl ? gl.getSupportedExtensions() || [] : []
        },
        storage: {
          quota: storageEstimate.quota || 0,
          usage: storageEstimate.usage || 0,
          available: (storageEstimate.quota || 0) - (storageEstimate.usage || 0)
        }
      };
    } catch (error) {
      console.warn('Hardware detection failed:', error);
    }
  }

  // Performance Monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoringInterval);

    this.emitEvent({
      type: 'metrics_updated',
      data: { status: 'monitoring_started' },
      timestamp: Date.now()
    });
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emitEvent({
      type: 'metrics_updated',
      data: { status: 'monitoring_stopped' },
      timestamp: Date.now()
    });
  }

  private async collectMetrics(): Promise<void> {
    try {
      const now = performance.now();
      const memoryInfo = (performance as any).memory;
      
      // Collect performance metrics
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        cpu: {
          usage: await this.getCPUUsage(),
          temperature: undefined,
          frequency: undefined
        },
        memory: {
          used: memoryInfo?.usedJSHeapSize || 0,
          available: this.hardwareInfo?.memory.total || 0,
          percentage: memoryInfo ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100 : 0,
          heapUsed: memoryInfo?.usedJSHeapSize || 0,
          heapTotal: memoryInfo?.totalJSHeapSize || 0
        },
        gpu: {
          usage: undefined,
          memory: undefined,
          temperature: undefined
        },
        render: {
          fps: this.calculateFPS(),
          frameTime: this.getFrameTime(),
          droppedFrames: this.getDroppedFrames(),
          renderTime: performance.now() - now
        },
        network: {
          downloadSpeed: await this.getNetworkSpeed('download'),
          uploadSpeed: await this.getNetworkSpeed('upload'),
          latency: await this.getNetworkLatency()
        }
      };

      // Add to history
      this.metricsHistory.push(metrics);
      
      // Cleanup old metrics
      const cutoffTime = Date.now() - (this.config.historyRetention * 60 * 60 * 1000);
      this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoffTime);

      // Check for bottlenecks
      this.detectBottlenecks(metrics);

      // Emit event
      this.emitEvent({
        type: 'metrics_updated',
        data: metrics,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async getCPUUsage(): Promise<number> {
    // Simulate CPU usage calculation using performance timing
    const start = performance.now();
    
    // Perform a CPU-intensive task to measure usage
    let iterations = 0;
    const maxTime = 10; // 10ms sample
    
    while (performance.now() - start < maxTime) {
      iterations++;
      Math.random() * Math.random();
    }
    
    const actualTime = performance.now() - start;
    const efficiency = iterations / actualTime;
    
    // Convert to percentage (this is a rough approximation)
    return Math.min(100, Math.max(0, (maxTime - actualTime) / maxTime * 100));
  }

  private calculateFPS(): number {
    // Use requestAnimationFrame to calculate FPS
    if (!window.fpsCounter) {
      window.fpsCounter = {
        frames: 0,
        lastTime: performance.now(),
        fps: 60
      };
    }

    const now = performance.now();
    window.fpsCounter.frames++;
    
    if (now - window.fpsCounter.lastTime >= 1000) {
      window.fpsCounter.fps = window.fpsCounter.frames;
      window.fpsCounter.frames = 0;
      window.fpsCounter.lastTime = now;
    }

    return window.fpsCounter.fps;
  }

  private getFrameTime(): number {
    // Calculate average frame time from recent performance entries
    const entries = performance.getEntriesByType('measure');
    const recentEntries = entries.slice(-10);
    
    if (recentEntries.length === 0) return 16.67; // 60fps default
    
    const avgDuration = recentEntries.reduce((sum, entry) => sum + entry.duration, 0) / recentEntries.length;
    return avgDuration;
  }

  private getDroppedFrames(): number {
    // Estimate dropped frames based on frame time consistency
    const targetFrameTime = 16.67; // 60fps
    const currentFrameTime = this.getFrameTime();
    
    return Math.max(0, Math.floor((currentFrameTime - targetFrameTime) / targetFrameTime));
  }

  private async getNetworkSpeed(type: 'download' | 'upload'): Promise<number> {
    // Simplified network speed test
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        return type === 'download' ? connection.downlink * 1000000 : connection.uplink * 1000000; // Convert Mbps to bps
      }
    } catch (error) {
      // Fallback estimation
    }
    return 0;
  }

  private async getNetworkLatency(): Promise<number> {
    // Simple latency test using performance timing
    try {
      const start = performance.now();
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      return performance.now() - start;
    } catch (error) {
      return 0;
    }
  }

  // Bottleneck Detection
  private detectBottlenecks(metrics: PerformanceMetrics): void {
    const bottlenecks: Bottleneck[] = [];

    // CPU bottleneck
    if (metrics.cpu.usage > this.config.alertThresholds.cpu) {
      bottlenecks.push({
        id: `cpu-${Date.now()}`,
        type: 'cpu',
        severity: metrics.cpu.usage > 90 ? 'critical' : 'high',
        description: `High CPU usage detected: ${metrics.cpu.usage.toFixed(1)}%`,
        impact: metrics.cpu.usage,
        suggestions: [
          'Reduce video quality settings',
          'Close unnecessary applications',
          'Enable hardware acceleration'
        ],
        detectedAt: Date.now()
      });
    }

    // Memory bottleneck
    if (metrics.memory.percentage > this.config.alertThresholds.memory) {
      bottlenecks.push({
        id: `memory-${Date.now()}`,
        type: 'memory',
        severity: metrics.memory.percentage > 95 ? 'critical' : 'high',
        description: `High memory usage detected: ${metrics.memory.percentage.toFixed(1)}%`,
        impact: metrics.memory.percentage,
        suggestions: [
          'Clear video cache',
          'Reduce preview quality',
          'Close other browser tabs'
        ],
        detectedAt: Date.now()
      });
    }

    // FPS bottleneck
    if (metrics.render.fps < this.config.alertThresholds.fps) {
      bottlenecks.push({
        id: `fps-${Date.now()}`,
        type: 'gpu',
        severity: metrics.render.fps < 15 ? 'critical' : 'medium',
        description: `Low FPS detected: ${metrics.render.fps} fps`,
        impact: 100 - (metrics.render.fps / 60 * 100),
        suggestions: [
          'Lower video resolution',
          'Disable real-time effects',
          'Enable GPU acceleration'
        ],
        detectedAt: Date.now()
      });
    }

    // Emit bottleneck events
    bottlenecks.forEach(bottleneck => {
      this.emitEvent({
        type: 'bottleneck_detected',
        data: bottleneck,
        timestamp: Date.now()
      });
    });
  }

  // Event System
  addEventListener(type: string, handler: PerformanceEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
  }

  removeEventListener(type: string, handler: PerformanceEventHandler): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(event: PerformanceEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in performance event handler:', error);
        }
      });
    }
  }

  // Public API
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  getHistory(): PerformanceHistory {
    const metrics = this.metricsHistory;
    const timeRange = {
      start: metrics.length > 0 ? metrics[0].timestamp : Date.now(),
      end: metrics.length > 0 ? metrics[metrics.length - 1].timestamp : Date.now()
    };

    const averages = {
      cpu: metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.length || 0,
      memory: metrics.reduce((sum, m) => sum + m.memory.percentage, 0) / metrics.length || 0,
      fps: metrics.reduce((sum, m) => sum + m.render.fps, 0) / metrics.length || 0,
      renderTime: metrics.reduce((sum, m) => sum + m.render.renderTime, 0) / metrics.length || 0
    };

    const peaks = {
      maxCpu: Math.max(...metrics.map(m => m.cpu.usage), 0),
      maxMemory: Math.max(...metrics.map(m => m.memory.percentage), 0),
      minFps: Math.min(...metrics.map(m => m.render.fps), 60),
      maxRenderTime: Math.max(...metrics.map(m => m.render.renderTime), 0)
    };

    return { metrics, timeRange, averages, peaks };
  }

  getHardwareInfo(): HardwareInfo | null {
    return this.hardwareInfo;
  }

  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new interval if changed
    if (newConfig.monitoringInterval && this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Render Performance Tracking
  startRenderJob(jobId: string, settings: any): void {
    this.renderJobs.set(jobId, {
      jobId,
      startTime: Date.now(),
      progress: 0,
      fps: 0,
      quality: settings.quality || 'medium',
      resolution: settings.resolution || '1920x1080',
      codec: settings.codec || 'h264',
      errors: [],
      warnings: [],
      metrics: {
        averageFps: 0,
        peakMemory: 0,
        cpuUsage: 0,
        renderEfficiency: 0
      }
    });
  }

  updateRenderJob(jobId: string, updates: Partial<RenderPerformance>): void {
    const job = this.renderJobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
    }
  }

  finishRenderJob(jobId: string): RenderPerformance | null {
    const job = this.renderJobs.get(jobId);
    if (job) {
      job.endTime = Date.now();
      job.duration = job.endTime - job.startTime;
      this.renderJobs.delete(jobId);
      return job;
    }
    return null;
  }

  // Cache Performance
  updateCacheStats(stats: Partial<CachePerformance>): void {
    Object.assign(this.cacheStats, stats);
  }

  getCacheStats(): CachePerformance {
    return { ...this.cacheStats };
  }
}

// Global FPS counter interface
declare global {
  interface Window {
    fpsCounter?: {
      frames: number;
      lastTime: number;
      fps: number;
    };
  }
}

export default PerformanceEngine;
export { PerformanceEngine };