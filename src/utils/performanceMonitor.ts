// Performance Monitoring System with FPS tracking and Memory Usage Metrics

import { PerformanceMetrics, HardwareInfo, OptimizationSettings, Bottleneck, OptimizationLevel } from '../types/performance';

/**
 * Advanced Performance Monitoring System for Video Editor Module
 * Tracks FPS, memory usage, CPU utilization, and provides optimization recommendations
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    averageFPS: 0,
    memoryUsage: {
      used: 0,
      total: 0,
      limit: 0
    },
    cpuUsage: 0
  };

  private hardwareInfo: HardwareInfo = {
    cores: navigator.hardwareConcurrency || 1,
    memory: (performance?.memory?.jsHeapSizeLimit || 0) / (1024 * 1024),
    gpu: this.detectGPUCapabilities()
  };

  private optimizationSettings: OptimizationSettings = {
    level: OptimizationLevel.MEDIUM,
    enableGPUAcceleration: true,
    maxTextureSize: 2048,
    enableLOD: true,
    cullingDistance: 100
  };

  private isMonitoring = false;
  private monitoringInterval?: number;
  private fpsCounter = {
    frames: 0,
    lastTime: 0,
    currentFPS: 0,
    targetFPS: 60,
    frameHistory: [] as number[],
    maxHistorySize: 100
  };

  private memoryTracker = {
    samples: [] as number[],
    maxSamples: 60, // 1 minute at 1 sample per second
    peakUsage: 0,
    averageUsage: 0
  };

  private warningCallbacks = {
    fps: [] as ((fps: number) => void)[],
    memory: [] as ((usage: number) => void)[]
  };

  private static instance: PerformanceMonitor;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Singleton pattern for global performance monitoring
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.fpsCounter.lastTime = performance.now();
    
    // Monitor at 1Hz for general metrics
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 1000);

    // Start FPS monitoring
    this.startFPSMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get hardware information
   */
  public getHardwareInfo(): HardwareInfo {
    return { ...this.hardwareInfo };
  }

  /**
   * Get recommended optimization level based on hardware
   */
  public getRecommendedOptimizationLevel(): OptimizationLevel {
    const { cores, memory, gpu } = this.hardwareInfo;
    
    if (cores >= 8 && memory >= 8192 && gpu.tier >= 3) {
      return OptimizationLevel.ULTRA;
    } else if (cores >= 6 && memory >= 6144 && gpu.tier >= 2) {
      return OptimizationLevel.HIGH;
    } else if (cores >= 4 && memory >= 4096 && gpu.tier >= 2) {
      return OptimizationLevel.MEDIUM;
    } else {
      return OptimizationLevel.LOW;
    }
  }

  /**
   * Set optimization settings
   */
  public setOptimizationSettings(settings: Partial<OptimizationSettings>): void {
    this.validateOptimizationSettings(settings);
    this.optimizationSettings = {
      ...this.optimizationSettings,
      ...settings
    };
  }

  /**
   * Get current optimization settings
   */
  public getOptimizationSettings(): OptimizationSettings {
    return { ...this.optimizationSettings };
  }

  /**
   * Register FPS warning callback
   */
  public onFPSWarning(callback: (fps: number) => void): void {
    this.warningCallbacks.fps.push(callback);
  }

  /**
   * Register memory warning callback
   */
  public onMemoryWarning(callback: (usage: number) => void): void {
    this.warningCallbacks.memory.push(callback);
  }

  /**
   * Check memory usage and trigger warnings if necessary
   */
  private checkMemory(): void {
    if (!performance.memory) return;

    const usageRatio = this.metrics.memoryUsage.used / this.metrics.memoryUsage.limit;

    // Check for high memory usage
    if (usageRatio > 0.9) { // 90% threshold
      this.warningCallbacks.memory.forEach(callback => callback(usageRatio));
    }
  }

  private startFPSMonitoring(): void {
    const monitorFrame = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const elapsedTime = currentTime - this.fpsCounter.lastTime;
      
      // Increment frame counter for every frame
      this.fpsCounter.frames++;
      
      if (elapsedTime >= 1000) {
        const fps = Math.min(60, Math.floor(
          (this.fpsCounter.frames * 1000) / elapsedTime
        ));
        
        this.fpsCounter.currentFPS = fps;
        this.metrics.fps = fps;
        
        // Update frame history
        this.fpsCounter.frameHistory.push(fps);
        if (this.fpsCounter.frameHistory.length > this.fpsCounter.maxHistorySize) {
          this.fpsCounter.frameHistory.shift();
        }
        
        // Calculate average FPS
        this.metrics.averageFPS = this.calculateAverageFPS();
        
        // Check for low FPS before resetting frame counter
        if (fps < 30) {
          this.warningCallbacks.fps.forEach(callback => callback(fps));
        }
        
        // Reset frame counter and update last time
        this.fpsCounter.frames = 0;
        this.fpsCounter.lastTime = currentTime;
      }
      
      // Continue monitoring frames
      requestAnimationFrame(monitorFrame);
    };
    
    // Start frame monitoring
    requestAnimationFrame(monitorFrame);
  }

  private updateMetrics(): void {
    // Update memory metrics
    if (performance.memory) {
      const memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
      
      this.metrics.memoryUsage = memoryUsage;
      
      // Update memory tracker
      const usageRatio = memoryUsage.used / memoryUsage.limit;
      this.memoryTracker.samples.push(usageRatio);
      if (this.memoryTracker.samples.length > this.memoryTracker.maxSamples) {
        this.memoryTracker.samples.shift();
      }

      // Check memory warnings after updating metrics
      this.checkMemory();
    }
    
    // Update CPU metrics (if available)
    // Note: CPU usage measurement in browsers is limited
    this.metrics.cpuUsage = 0; // Placeholder
  }

  private detectGPUCapabilities(): { tier: number } {
    // Simple GPU detection based on available APIs
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return { tier: 0 };
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Simple tier classification based on renderer string
    if (renderer.includes('RTX') || renderer.includes('Radeon')) {
      return { tier: 3 }; // High-end GPU
    } else if (renderer.includes('Intel') && !renderer.includes('HD')) {
      return { tier: 2 }; // Mid-range GPU
    } else {
      return { tier: 1 }; // Basic GPU
    }
  }

  /**
   * Get FPS history for analysis
   */
  public getFPSHistory(): number[] {
    return [...this.fpsCounter.frameHistory];
  }

  /**
   * Get memory usage history
   */
  public getMemoryHistory(): number[] {
    return [...this.memoryTracker.samples];
  }

  /**
   * Calculate average FPS from history
   */
  private calculateAverageFPS(): number {
    if (this.fpsCounter.frameHistory.length === 0) {
      return 0;
    }
    
    const sum = this.fpsCounter.frameHistory.reduce((a, b) => a + b, 0);
    return Math.min(60, Math.floor(sum / this.fpsCounter.frameHistory.length));
  }

  /**
   * Validate optimization settings
   */
  private validateOptimizationSettings(settings: Partial<OptimizationSettings>): void {
    if (settings.level !== undefined && !Object.values(OptimizationLevel).includes(settings.level)) {
      throw new Error(`Invalid optimization level: ${settings.level}`);
    }
    
    if (settings.maxTextureSize !== undefined && (settings.maxTextureSize < 256 || settings.maxTextureSize > 8192)) {
      throw new Error(`Invalid maxTextureSize: ${settings.maxTextureSize}. Must be between 256 and 8192.`);
    }
    
    if (settings.cullingDistance !== undefined && (settings.cullingDistance < 0 || settings.cullingDistance > 1000)) {
      throw new Error(`Invalid cullingDistance: ${settings.cullingDistance}. Must be between 0 and 1000.`);
    }
  }
}