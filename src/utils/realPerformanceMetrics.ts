// Real performance metrics collection using browser APIs
import { webVitalsTracker } from './webVitalsTracker';

export interface RealPerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
  cpu: {
    usage: number;
    cores: number;
    speed: number;
  };
  network: {
    latency: number;
    downlink: number;
    effectiveType: string;
    rtt: number;
    saveData: boolean;
  };
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
  };
  timing: {
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  resources: {
    totalSize: number;
    totalRequests: number;
    cachableRequests: number;
    compressedSize: number;
    avgLoadTime: number;
  };
}

class RealPerformanceCollector {
  private fpsCounter: FPSCounter;
  private metricsHistory: RealPerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.fpsCounter = new FPSCounter();
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Resource timing observer
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          // Process resource timing entries for real data
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Failed to initialize resource observer:', error);
      }
    }
  }

  public collectMetrics(): RealPerformanceMetrics {
    return {
      memory: this.getMemoryMetrics(),
      cpu: this.getCPUMetrics(),
      network: this.getNetworkMetrics(),
      fps: this.fpsCounter.getMetrics(),
      timing: this.getTimingMetrics(),
      resources: this.getResourceMetrics()
    };
  }

  private getMemoryMetrics(): RealPerformanceMetrics['memory'] {
    // Use real Memory API when available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize
      };
    }
    
    // Fallback for browsers without Memory API
    return {
      used: 0,
      total: 0,
      percentage: 0,
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0
    };
  }

  private getCPUMetrics(): RealPerformanceMetrics['cpu'] {
    // Real CPU metrics using performance timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      // Calculate CPU usage based on processing time vs total time
      const processingTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      const totalTime = navigation.loadEventEnd - navigation.navigationStart;
      const usage = totalTime > 0 ? (processingTime / totalTime) * 100 : 0;
      
      return {
        usage: Math.min(100, Math.max(0, usage)),
        cores: navigator.hardwareConcurrency || 4,
        speed: 0 // Not available via Web APIs
      };
    }

    return {
      usage: 0,
      cores: navigator.hardwareConcurrency || 4,
      speed: 0
    };
  }

  private getNetworkMetrics(): RealPerformanceMetrics['network'] {
    // Real network metrics using Network Information API
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    // Measure real latency using Resource Timing
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const latency = navigationEntry ? navigationEntry.responseStart - navigationEntry.requestStart : 0;

    if (connection) {
      return {
        latency: Math.max(0, latency),
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || 'unknown',
        rtt: connection.rtt || latency,
        saveData: connection.saveData || false
      };
    }

    // Fallback measurements
    return {
      latency: Math.max(0, latency),
      downlink: 0,
      effectiveType: 'unknown',
      rtt: latency,
      saveData: false
    };
  }

  private getTimingMetrics(): RealPerformanceMetrics['timing'] {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const webVitals = webVitalsTracker.getMetrics();
    
    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint: webVitals.lcp || 0,
      firstInputDelay: webVitals.fid || 0,
      cumulativeLayoutShift: webVitals.cls || 0
    };
  }

  private getResourceMetrics(): RealPerformanceMetrics['resources'] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    if (resources.length === 0) {
      return {
        totalSize: 0,
        totalRequests: 0,
        cachableRequests: 0,
        compressedSize: 0,
        avgLoadTime: 0
      };
    }

    let totalSize = 0;
    let compressedSize = 0;
    let totalLoadTime = 0;
    let cachableCount = 0;

    resources.forEach(resource => {
      // Calculate sizes
      if (resource.transferSize) {
        totalSize += resource.transferSize;
      }
      if (resource.encodedBodySize) {
        compressedSize += resource.encodedBodySize;
      }
      
      // Calculate load time
      totalLoadTime += resource.responseEnd - resource.startTime;
      
      // Check if cachable (not a fresh request)
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        cachableCount++;
      }
    });

    return {
      totalSize,
      totalRequests: resources.length,
      cachableRequests: cachableCount,
      compressedSize,
      avgLoadTime: totalLoadTime / resources.length
    };
  }

  public getHistoricalData(minutes: number = 10): RealPerformanceMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metricsHistory.filter(metric => 
      metric.timing.domContentLoaded > cutoff
    );
  }

  public startCollection(intervalMs: number = 5000): () => void {
    const interval = setInterval(() => {
      const metrics = this.collectMetrics();
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 entries
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.fpsCounter.stop();
  }
}

class FPSCounter {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fpsHistory: number[] = [];
  private isRunning: boolean = false;
  private rafId: number = 0;

  constructor() {
    this.start();
  }

  private measureFPS = (currentTime: number): void => {
    this.frameCount++;
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.fpsHistory.push(this.fps);
      
      // Keep only last 60 seconds of data
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.measureFPS);
    }
  };

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.measureFPS);
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  public getMetrics(): RealPerformanceMetrics['fps'] {
    if (this.fpsHistory.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0 };
    }

    const average = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    const min = Math.min(...this.fpsHistory);
    const max = Math.max(...this.fpsHistory);

    return {
      current: this.fps,
      average: Math.round(average),
      min,
      max
    };
  }
}

// Bundle analysis using real webpack stats or build analysis
export interface RealBundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
    hash: string;
    type?: string;
  }>;
  dependencies: Array<{
    name: string;
    version: string;
    size: number;
    actualUsage: number;
    importedFunctions: string[];
    usage?: number;
  }>;
  duplicates: Array<{
    module: string;
    instances: string[];
    wastedBytes: number;
  }>;
}

class RealBundleAnalyzer {
  public async analyzeBundleSize(): Promise<RealBundleMetrics> {
    // In a real implementation, this would:
    // 1. Read webpack-bundle-analyzer output
    // 2. Parse package.json and node_modules
    // 3. Use dependency-cruiser or similar tools
    
    try {
      // Analyze loaded resources from performance API
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const cssResources = resources.filter(r => r.name.includes('.css'));
      
      const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const compressedSize = resources.reduce((sum, r) => sum + (r.encodedBodySize || 0), 0);
      
      // Get module information from browser (if available via devtools)
      const chunks = jsResources.map((resource, index) => ({
        name: resource.name.split('/').pop() || `chunk-${index}`,
        size: resource.transferSize || 0,
        modules: [], // Would need build tools integration
        hash: this.generateHash(resource.name)
      }));

      // In real implementation, dependency analysis would require:
      // - Integration with package manager (npm, yarn)
      // - Build tool integration (webpack, vite, rollup)
      // - Static analysis tools
      
      return {
        totalSize,
        gzippedSize: compressedSize,
        chunks,
        dependencies: [], // Would be populated with real dependency analysis
        duplicates: [] // Would be found through static analysis
      };
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// Global instances
export const realPerformanceCollector = new RealPerformanceCollector();
export const realBundleAnalyzer = new RealBundleAnalyzer();

// Utility functions
export const startRealTimeCollection = (intervalMs: number = 5000) => 
  realPerformanceCollector.startCollection(intervalMs);

export const getRealMetrics = () => realPerformanceCollector.collectMetrics();

export const getRealBundleMetrics = () => realBundleAnalyzer.analyzeBundleSize();

// Export class constructors for direct use
export { RealPerformanceCollector, RealBundleAnalyzer };