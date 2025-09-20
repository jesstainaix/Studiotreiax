import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types
interface LazyLoadConfig {
  rootMargin: string;
  threshold: number;
  enableIntersectionObserver: boolean;
  preloadDistance: number;
  maxConcurrentLoads: number;
  retryAttempts: number;
  retryDelay: number;
}

interface AssetCompressionConfig {
  enableImageCompression: boolean;
  imageQuality: number;
  enableWebP: boolean;
  enableAVIF: boolean;
  enableBrotli: boolean;
  enableGzip: boolean;
  minCompressionSize: number;
  maxCacheSize: number;
}

interface VirtualDOMConfig {
  enableVirtualization: boolean;
  itemHeight: number;
  overscan: number;
  enableDynamicHeight: boolean;
  enableHorizontalVirtualization: boolean;
  bufferSize: number;
  recycleThreshold: number;
}

interface PerformanceMetrics {
  lazyLoadStats: {
    totalItems: number;
    loadedItems: number;
    failedItems: number;
    averageLoadTime: number;
    cacheHitRate: number;
  };
  compressionStats: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    savedBytes: number;
    cacheSize: number;
  };
  virtualDOMStats: {
    renderedItems: number;
    totalItems: number;
    renderTime: number;
    memoryUsage: number;
    scrollPerformance: number;
  };
  generalStats: {
    fps: number;
    memoryUsage: number;
    bundleSize: number;
    loadTime: number;
    interactionDelay: number;
  };
}

interface LazyLoadItem {
  id: string;
  src: string;
  placeholder?: string;
  alt?: string;
  priority: 'high' | 'medium' | 'low';
  loaded: boolean;
  loading: boolean;
  error: boolean;
  retryCount: number;
  loadTime?: number;
}

interface CompressedAsset {
  id: string;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  format: string;
  quality: number;
  cached: boolean;
  expiresAt: number;
}

interface VirtualItem {
  id: string;
  index: number;
  height: number;
  offset: number;
  visible: boolean;
  rendered: boolean;
}

interface PerformanceConfig {
  lazyLoad: LazyLoadConfig;
  compression: AssetCompressionConfig;
  virtualDOM: VirtualDOMConfig;
  enablePerformanceMonitoring: boolean;
  enableMemoryOptimization: boolean;
  enableBundleOptimization: boolean;
  enableCaching: boolean;
  cacheStrategy: 'lru' | 'lfu' | 'fifo';
  maxCacheEntries: number;
  enableServiceWorker: boolean;
  enablePreloading: boolean;
  enableCodeSplitting: boolean;
}

interface PerformanceState {
  lazyLoadItems: Map<string, LazyLoadItem>;
  compressedAssets: Map<string, CompressedAsset>;
  virtualItems: Map<string, VirtualItem>;
  metrics: PerformanceMetrics;
  config: PerformanceConfig;
  isOptimizing: boolean;
  cache: Map<string, any>;
  loadingQueue: string[];
  renderQueue: string[];
}

// Performance Optimization Engine
class PerformanceEngine {
  private state: PerformanceState;
  private intersectionObserver?: IntersectionObserver;
  private performanceObserver?: PerformanceObserver;
  private animationFrame?: number;
  private metricsInterval?: NodeJS.Timeout;
  private compressionWorker?: Worker;
  private virtualScrollContainer?: HTMLElement;

  constructor(config: PerformanceConfig) {
    this.state = {
      lazyLoadItems: new Map(),
      compressedAssets: new Map(),
      virtualItems: new Map(),
      metrics: this.initializeMetrics(),
      config,
      isOptimizing: false,
      cache: new Map(),
      loadingQueue: [],
      renderQueue: []
    };

    this.initializeOptimizations();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      lazyLoadStats: {
        totalItems: 0,
        loadedItems: 0,
        failedItems: 0,
        averageLoadTime: 0,
        cacheHitRate: 0
      },
      compressionStats: {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        savedBytes: 0,
        cacheSize: 0
      },
      virtualDOMStats: {
        renderedItems: 0,
        totalItems: 0,
        renderTime: 0,
        memoryUsage: 0,
        scrollPerformance: 0
      },
      generalStats: {
        fps: 60,
        memoryUsage: 0,
        bundleSize: 0,
        loadTime: 0,
        interactionDelay: 0
      }
    };
  }

  private initializeOptimizations(): void {
    this.setupIntersectionObserver();
    this.setupPerformanceObserver();
    this.setupCompressionWorker();
    this.startMetricsCollection();
    this.setupMemoryOptimization();
  }

  private setupIntersectionObserver(): void {
    if (!this.state.config.lazyLoad.enableIntersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const itemId = entry.target.getAttribute('data-lazy-id');
            if (itemId) {
              this.loadLazyItem(itemId);
            }
          }
        });
      },
      {
        rootMargin: this.state.config.lazyLoad.rootMargin,
        threshold: this.state.config.lazyLoad.threshold
      }
    );
  }

  private setupPerformanceObserver(): void {
    if (!this.state.config.enablePerformanceMonitoring) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.updatePerformanceMetrics(entry);
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private setupCompressionWorker(): void {
    if (!this.state.config.compression.enableImageCompression) return;

    try {
      const workerCode = `
        self.onmessage = function(e) {
          const { imageData, quality, format } = e.data;
          
          // Create canvas for compression
          const canvas = new OffscreenCanvas(imageData.width, imageData.height);
          const ctx = canvas.getContext('2d');
          
          // Draw image data
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to blob with compression
          canvas.convertToBlob({ type: format, quality }).then(blob => {
            self.postMessage({ success: true, blob, originalSize: imageData.data.length, compressedSize: blob.size });
          }).catch(error => {
            self.postMessage({ success: false, error: error.message });
          });
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));

      this.compressionWorker.onmessage = (e) => {
        const { success, blob, originalSize, compressedSize, error } = e.data;
        if (success) {
          this.updateCompressionStats(originalSize, compressedSize);
        } else {
          console.error('Compression worker error:', error);
        }
      };
    } catch (error) {
      console.warn('Web Worker not supported for compression:', error);
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  private setupMemoryOptimization(): void {
    if (!this.state.config.enableMemoryOptimization) return;

    // Cleanup unused cache entries
    setInterval(() => {
      this.cleanupCache();
    }, 30000);

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        this.state.metrics.generalStats.memoryUsage = memInfo.usedJSHeapSize;
      }, 5000);
    }
  }

  // Lazy Loading Methods
  registerLazyItem(item: Omit<LazyLoadItem, 'loaded' | 'loading' | 'error' | 'retryCount'>): void {
    const lazyItem: LazyLoadItem = {
      ...item,
      loaded: false,
      loading: false,
      error: false,
      retryCount: 0
    };

    this.state.lazyLoadItems.set(item.id, lazyItem);
    this.state.metrics.lazyLoadStats.totalItems++;
  }

  observeLazyItem(element: HTMLElement, itemId: string): void {
    if (!this.intersectionObserver) return;

    element.setAttribute('data-lazy-id', itemId);
    this.intersectionObserver.observe(element);
  }

  private async loadLazyItem(itemId: string): Promise<void> {
    const item = this.state.lazyLoadItems.get(itemId);
    if (!item || item.loaded || item.loading) return;

    // Check if we've exceeded max concurrent loads
    if (this.state.loadingQueue.length >= this.state.config.lazyLoad.maxConcurrentLoads) {
      return;
    }

    item.loading = true;
    this.state.loadingQueue.push(itemId);

    const startTime = performance.now();

    try {
      // Check cache first
      const cached = this.state.cache.get(item.src);
      if (cached) {
        item.loaded = true;
        item.loading = false;
        this.state.metrics.lazyLoadStats.loadedItems++;
        this.state.metrics.lazyLoadStats.cacheHitRate = 
          this.state.metrics.lazyLoadStats.loadedItems / this.state.metrics.lazyLoadStats.totalItems;
        return;
      }

      // Load the resource
      const response = await fetch(item.src);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Cache the result
      this.state.cache.set(item.src, url);

      item.loaded = true;
      item.loading = false;
      item.loadTime = performance.now() - startTime;
      
      this.state.metrics.lazyLoadStats.loadedItems++;
      this.updateAverageLoadTime(item.loadTime);

    } catch (error) {
      item.loading = false;
      item.error = true;
      item.retryCount++;

      // Retry if under limit
      if (item.retryCount < this.state.config.lazyLoad.retryAttempts) {
        setTimeout(() => {
          item.error = false;
          this.loadLazyItem(itemId);
        }, this.state.config.lazyLoad.retryDelay * item.retryCount);
      } else {
        this.state.metrics.lazyLoadStats.failedItems++;
      }
    } finally {
      this.state.loadingQueue = this.state.loadingQueue.filter(id => id !== itemId);
    }
  }

  private updateAverageLoadTime(loadTime: number): void {
    const stats = this.state.metrics.lazyLoadStats;
    stats.averageLoadTime = (stats.averageLoadTime * (stats.loadedItems - 1) + loadTime) / stats.loadedItems;
  }

  // Asset Compression Methods
  async compressImage(file: File, options?: { quality?: number; format?: string }): Promise<Blob> {
    const quality = options?.quality ?? this.state.config.compression.imageQuality;
    const format = options?.format ?? 'image/webp';

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              this.updateCompressionStats(file.size, blob.size);
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          format,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  async compressText(text: string, algorithm: 'gzip' | 'brotli' = 'gzip'): Promise<ArrayBuffer> {
    if (!('CompressionStream' in window)) {
      throw new Error('Compression not supported');
    }

    const stream = new CompressionStream(algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(new TextEncoder().encode(text));
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }

    const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.length;
    }

    this.updateCompressionStats(text.length, compressed.length);
    return compressed.buffer;
  }

  private updateCompressionStats(originalSize: number, compressedSize: number): void {
    const stats = this.state.metrics.compressionStats;
    stats.originalSize += originalSize;
    stats.compressedSize += compressedSize;
    stats.savedBytes = stats.originalSize - stats.compressedSize;
    stats.compressionRatio = stats.compressedSize / stats.originalSize;
  }

  // Virtual DOM Methods
  setupVirtualScrolling(container: HTMLElement, items: any[], itemRenderer: (item: any, index: number) => HTMLElement): void {
    this.virtualScrollContainer = container;
    const config = this.state.config.virtualDOM;

    if (!config.enableVirtualization) return;

    let scrollTop = 0;
    let containerHeight = container.clientHeight;
    const itemHeight = config.itemHeight;
    const overscan = config.overscan;

    const updateVisibleItems = () => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );

      // Clear existing items
      container.innerHTML = '';

      // Create spacer for items above viewport
      const topSpacer = document.createElement('div');
      topSpacer.style.height = `${startIndex * itemHeight}px`;
      container.appendChild(topSpacer);

      // Render visible items
      const startTime = performance.now();
      for (let i = startIndex; i <= endIndex; i++) {
        const item = items[i];
        if (item) {
          const element = itemRenderer(item, i);
          element.style.height = `${itemHeight}px`;
          container.appendChild(element);

          // Update virtual item tracking
          this.state.virtualItems.set(`${i}`, {
            id: `${i}`,
            index: i,
            height: itemHeight,
            offset: i * itemHeight,
            visible: true,
            rendered: true
          });
        }
      }

      // Create spacer for items below viewport
      const bottomSpacer = document.createElement('div');
      bottomSpacer.style.height = `${(items.length - endIndex - 1) * itemHeight}px`;
      container.appendChild(bottomSpacer);

      // Update metrics
      const renderTime = performance.now() - startTime;
      this.state.metrics.virtualDOMStats.renderTime = renderTime;
      this.state.metrics.virtualDOMStats.renderedItems = endIndex - startIndex + 1;
      this.state.metrics.virtualDOMStats.totalItems = items.length;
    };

    // Handle scroll events
    const handleScroll = () => {
      scrollTop = container.scrollTop;
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      
      this.animationFrame = requestAnimationFrame(updateVisibleItems);
    };

    // Handle resize events
    const handleResize = () => {
      containerHeight = container.clientHeight;
      updateVisibleItems();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Initial render
    updateVisibleItems();
  }

  // Performance Monitoring
  private collectMetrics(): void {
    // Collect FPS
    this.measureFPS();

    // Collect memory usage
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.state.metrics.generalStats.memoryUsage = memInfo.usedJSHeapSize;
    }

    // Collect bundle size
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const totalSize = resources.reduce((sum, resource) => {
        return sum + (resource.transferSize || 0);
      }, 0);
      this.state.metrics.generalStats.bundleSize = totalSize;
    }
  }

  private measureFPS(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measureFrame = (currentTime: number) => {
      frames++;
      
      if (currentTime - lastTime >= 1000) {
        this.state.metrics.generalStats.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private updatePerformanceMetrics(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.state.metrics.generalStats.loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
        break;
      
      case 'measure':
        if (entry.name.includes('interaction')) {
          this.state.metrics.generalStats.interactionDelay = entry.duration;
        }
        break;
    }
  }

  // Cache Management
  private cleanupCache(): void {
    const maxEntries = this.state.config.maxCacheEntries;
    const strategy = this.state.config.cacheStrategy;

    if (this.state.cache.size <= maxEntries) return;

    const entries = Array.from(this.state.cache.entries());
    let entriesToRemove: string[] = [];

    switch (strategy) {
      case 'lru':
        // Remove least recently used (simplified - would need access tracking)
        entriesToRemove = entries.slice(0, entries.length - maxEntries).map(([key]) => key);
        break;
      
      case 'fifo':
        // Remove first in, first out
        entriesToRemove = entries.slice(0, entries.length - maxEntries).map(([key]) => key);
        break;
      
      case 'lfu':
        // Remove least frequently used (simplified)
        entriesToRemove = entries.slice(0, entries.length - maxEntries).map(([key]) => key);
        break;
    }

    entriesToRemove.forEach(key => {
      this.state.cache.delete(key);
    });
  }

  // Configuration
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.state.config = { ...this.state.config, ...newConfig };
    
    // Reinitialize if needed
    if (newConfig.lazyLoad) {
      this.setupIntersectionObserver();
    }
    
    if (newConfig.enablePerformanceMonitoring !== undefined) {
      if (newConfig.enablePerformanceMonitoring) {
        this.setupPerformanceObserver();
      } else {
        this.performanceObserver?.disconnect();
      }
    }
  }

  // Data Management
  exportData(): string {
    return JSON.stringify({
      metrics: this.state.metrics,
      config: this.state.config,
      lazyLoadItems: Array.from(this.state.lazyLoadItems.entries()),
      compressedAssets: Array.from(this.state.compressedAssets.entries()),
      virtualItems: Array.from(this.state.virtualItems.entries()),
      timestamp: Date.now()
    });
  }

  importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.metrics) this.state.metrics = parsed.metrics;
      if (parsed.config) this.updateConfig(parsed.config);
      if (parsed.lazyLoadItems) {
        this.state.lazyLoadItems = new Map(parsed.lazyLoadItems);
      }
      if (parsed.compressedAssets) {
        this.state.compressedAssets = new Map(parsed.compressedAssets);
      }
      if (parsed.virtualItems) {
        this.state.virtualItems = new Map(parsed.virtualItems);
      }
    } catch (error) {
      console.error('Failed to import performance data:', error);
    }
  }

  // Getters
  getMetrics(): PerformanceMetrics {
    return { ...this.state.metrics };
  }

  getConfig(): PerformanceConfig {
    return { ...this.state.config };
  }

  getLazyLoadItems(): LazyLoadItem[] {
    return Array.from(this.state.lazyLoadItems.values());
  }

  getCompressedAssets(): CompressedAsset[] {
    return Array.from(this.state.compressedAssets.values());
  }

  getVirtualItems(): VirtualItem[] {
    return Array.from(this.state.virtualItems.values());
  }

  // Cleanup
  destroy(): void {
    this.intersectionObserver?.disconnect();
    this.performanceObserver?.disconnect();
    this.compressionWorker?.terminate();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.state.cache.clear();
  }
}

// Default Configuration
const defaultConfig: PerformanceConfig = {
  lazyLoad: {
    rootMargin: '50px',
    threshold: 0.1,
    enableIntersectionObserver: true,
    preloadDistance: 200,
    maxConcurrentLoads: 3,
    retryAttempts: 3,
    retryDelay: 1000
  },
  compression: {
    enableImageCompression: true,
    imageQuality: 0.8,
    enableWebP: true,
    enableAVIF: false,
    enableBrotli: true,
    enableGzip: true,
    minCompressionSize: 1024,
    maxCacheSize: 50 * 1024 * 1024 // 50MB
  },
  virtualDOM: {
    enableVirtualization: true,
    itemHeight: 50,
    overscan: 5,
    enableDynamicHeight: false,
    enableHorizontalVirtualization: false,
    bufferSize: 10,
    recycleThreshold: 100
  },
  enablePerformanceMonitoring: true,
  enableMemoryOptimization: true,
  enableBundleOptimization: true,
  enableCaching: true,
  cacheStrategy: 'lru',
  maxCacheEntries: 1000,
  enableServiceWorker: true,
  enablePreloading: true,
  enableCodeSplitting: true
};

// Hook
export const usePerformanceOptimizations = (initialConfig?: Partial<PerformanceConfig>) => {
  const [engine] = useState(() => new PerformanceEngine({ ...defaultConfig, ...initialConfig }));
  const [metrics, setMetrics] = useState<PerformanceMetrics>(engine.getMetrics());
  const [config, setConfig] = useState<PerformanceConfig>(engine.getConfig());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize
  useEffect(() => {
    setIsInitialized(true);
    
    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(engine.getMetrics());
    }, 1000);
    
    return () => {
      clearInterval(interval);
      engine.destroy();
    };
  }, [engine]);

  // Actions
  const registerLazyItem = useCallback((item: Omit<LazyLoadItem, 'loaded' | 'loading' | 'error' | 'retryCount'>) => {
    engine.registerLazyItem(item);
  }, [engine]);

  const observeLazyItem = useCallback((element: HTMLElement, itemId: string) => {
    engine.observeLazyItem(element, itemId);
  }, [engine]);

  const compressImage = useCallback(async (file: File, options?: { quality?: number; format?: string }) => {
    setIsOptimizing(true);
    try {
      return await engine.compressImage(file, options);
    } finally {
      setIsOptimizing(false);
    }
  }, [engine]);

  const compressText = useCallback(async (text: string, algorithm: 'gzip' | 'brotli' = 'gzip') => {
    setIsOptimizing(true);
    try {
      return await engine.compressText(text, algorithm);
    } finally {
      setIsOptimizing(false);
    }
  }, [engine]);

  const setupVirtualScrolling = useCallback((container: HTMLElement, items: any[], itemRenderer: (item: any, index: number) => HTMLElement) => {
    engine.setupVirtualScrolling(container, items, itemRenderer);
  }, [engine]);

  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    engine.updateConfig(newConfig);
    setConfig(engine.getConfig());
  }, [engine]);

  const exportData = useCallback(() => {
    return engine.exportData();
  }, [engine]);

  const importData = useCallback((data: string) => {
    engine.importData(data);
    setMetrics(engine.getMetrics());
    setConfig(engine.getConfig());
  }, [engine]);

  const getLazyLoadItems = useCallback(() => {
    return engine.getLazyLoadItems();
  }, [engine]);

  const getCompressedAssets = useCallback(() => {
    return engine.getCompressedAssets();
  }, [engine]);

  const getVirtualItems = useCallback(() => {
    return engine.getVirtualItems();
  }, [engine]);

  return {
    // State
    metrics,
    config,
    isOptimizing,
    isInitialized,
    
    // Actions
    registerLazyItem,
    observeLazyItem,
    compressImage,
    compressText,
    setupVirtualScrolling,
    updateConfig,
    exportData,
    importData,
    getLazyLoadItems,
    getCompressedAssets,
    getVirtualItems
  };
};

export type {
  PerformanceConfig,
  PerformanceMetrics,
  LazyLoadItem,
  CompressedAsset,
  VirtualItem,
  LazyLoadConfig,
  AssetCompressionConfig,
  VirtualDOMConfig
};