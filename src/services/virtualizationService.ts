/**
 * Virtualization Service
 * Advanced algorithms for viewport calculation, cache management, and performance optimization
 */

export interface ViewportInfo {
  scrollTop: number;
  scrollLeft: number;
  containerHeight: number;
  containerWidth: number;
  itemHeight: number;
  itemWidth?: number;
  totalItems: number;
  overscan: number;
  direction: 'vertical' | 'horizontal' | 'both';
}

export interface VirtualItem {
  index: number;
  key: string;
  start: number;
  end: number;
  size: number;
  isVisible: boolean;
  isOverscan: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxItems: number; // Maximum number of items
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo' | 'adaptive';
}

export interface PerformanceMetrics {
  renderTime: number;
  scrollTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  itemsRendered: number;
  totalItems: number;
  fps: number;
  lastUpdate: number;
}

export interface VirtualizationOptions {
  itemHeight: number | ((index: number) => number);
  itemWidth?: number | ((index: number) => number);
  overscan?: number;
  direction?: 'vertical' | 'horizontal' | 'both';
  enableCache?: boolean;
  cacheConfig?: Partial<CacheConfig>;
  enableMetrics?: boolean;
  dynamicSize?: boolean;
  estimatedItemSize?: number;
  getItemKey?: (index: number) => string;
}

class VirtualizationService {
  private static instance: VirtualizationService;
  private caches = new Map<string, Map<string, CacheEntry>>();
  private metrics = new Map<string, PerformanceMetrics>();
  private cleanupTimers = new Map<string, NodeJS.Timeout>();
  private frameCallbacks = new Map<string, number>();
  private itemSizeCache = new Map<string, Map<number, number>>();
  private scrollPositionCache = new Map<string, { top: number; left: number; timestamp: number }>();

  private defaultCacheConfig: CacheConfig = {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxItems: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000, // 1 minute
    strategy: 'adaptive'
  };

  static getInstance(): VirtualizationService {
    if (!VirtualizationService.instance) {
      VirtualizationService.instance = new VirtualizationService();
    }
    return VirtualizationService.instance;
  }

  /**
   * Calculate visible items based on viewport information
   */
  calculateVisibleItems(
    viewportInfo: ViewportInfo,
    options: VirtualizationOptions = {}
  ): VirtualItem[] {
    const startTime = performance.now();
    const {
      scrollTop,
      scrollLeft,
      containerHeight,
      containerWidth,
      itemHeight: defaultItemHeight,
      itemWidth: defaultItemWidth,
      totalItems,
      overscan = 3,
      direction = 'vertical'
    } = viewportInfo;

    const items: VirtualItem[] = [];
    const getItemHeight = typeof options.itemHeight === 'function' 
      ? options.itemHeight 
      : () => defaultItemHeight;
    const getItemWidth = typeof options.itemWidth === 'function'
      ? options.itemWidth
      : () => defaultItemWidth || 200;

    if (direction === 'vertical' || direction === 'both') {
      // Vertical virtualization
      let currentTop = 0;
      let startIndex = -1;
      let endIndex = -1;

      // Find start index
      for (let i = 0; i < totalItems; i++) {
        const height = getItemHeight(i);
        if (currentTop + height > scrollTop - overscan * height) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
        currentTop += height;
      }

      if (startIndex === -1) startIndex = 0;

      // Find end index
      currentTop = this.getOffsetForIndex(startIndex, getItemHeight);
      for (let i = startIndex; i < totalItems; i++) {
        const height = getItemHeight(i);
        if (currentTop > scrollTop + containerHeight + overscan * height) {
          endIndex = Math.min(totalItems - 1, i + overscan);
          break;
        }
        currentTop += height;
      }

      if (endIndex === -1) endIndex = totalItems - 1;

      // Generate virtual items
      let itemTop = this.getOffsetForIndex(startIndex, getItemHeight);
      for (let i = startIndex; i <= endIndex; i++) {
        const height = getItemHeight(i);
        const isVisible = itemTop + height > scrollTop && itemTop < scrollTop + containerHeight;
        const isOverscan = !isVisible;

        items.push({
          index: i,
          key: options.getItemKey ? options.getItemKey(i) : `item-${i}`,
          start: itemTop,
          end: itemTop + height,
          size: height,
          isVisible,
          isOverscan
        });

        itemTop += height;
      }
    }

    if (direction === 'horizontal' || direction === 'both') {
      // Horizontal virtualization logic would go here
      // Similar to vertical but using width and scrollLeft
    }

    // Update metrics
    const renderTime = performance.now() - startTime;
    this.updateMetrics('viewport-calculation', {
      renderTime,
      itemsRendered: items.length,
      totalItems
    });

    return items;
  }

  /**
   * Get offset for a specific item index
   */
  private getOffsetForIndex(
    index: number,
    getItemHeight: (index: number) => number
  ): number {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }

  /**
   * Calculate total size of all items
   */
  calculateTotalSize(
    totalItems: number,
    getItemSize: (index: number) => number
  ): number {
    let totalSize = 0;
    for (let i = 0; i < totalItems; i++) {
      totalSize += getItemSize(i);
    }
    return totalSize;
  }

  /**
   * Find item index at a specific offset
   */
  findItemIndexAtOffset(
    offset: number,
    totalItems: number,
    getItemSize: (index: number) => number
  ): number {
    let currentOffset = 0;
    for (let i = 0; i < totalItems; i++) {
      const size = getItemSize(i);
      if (currentOffset + size > offset) {
        return i;
      }
      currentOffset += size;
    }
    return totalItems - 1;
  }

  /**
   * Cache management
   */
  initializeCache(cacheId: string, config?: Partial<CacheConfig>): void {
    const cacheConfig = { ...this.defaultCacheConfig, ...config };
    
    if (!this.caches.has(cacheId)) {
      this.caches.set(cacheId, new Map());
    }

    // Setup cleanup timer
    if (this.cleanupTimers.has(cacheId)) {
      clearInterval(this.cleanupTimers.get(cacheId)!);
    }

    const timer = setInterval(() => {
      this.cleanupCache(cacheId, cacheConfig);
    }, cacheConfig.cleanupInterval);

    this.cleanupTimers.set(cacheId, timer);
  }

  /**
   * Set cache entry
   */
  setCacheEntry<T>(
    cacheId: string,
    key: string,
    data: T,
    priority: number = 1
  ): void {
    const cache = this.caches.get(cacheId);
    if (!cache) return;

    const size = this.estimateDataSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      priority
    };

    cache.set(key, entry);
  }

  /**
   * Get cache entry
   */
  getCacheEntry<T>(cacheId: string, key: string): T | null {
    const cache = this.caches.get(cacheId);
    if (!cache) return null;

    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Check if cache has entry
   */
  hasCacheEntry(cacheId: string, key: string): boolean {
    const cache = this.caches.get(cacheId);
    return cache ? cache.has(key) : false;
  }

  /**
   * Remove cache entry
   */
  removeCacheEntry(cacheId: string, key: string): void {
    const cache = this.caches.get(cacheId);
    if (cache) {
      cache.delete(key);
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(cacheId: string): void {
    const cache = this.caches.get(cacheId);
    if (cache) {
      cache.clear();
    }
  }

  /**
   * Cleanup cache based on strategy
   */
  private cleanupCache(cacheId: string, config: CacheConfig): void {
    const cache = this.caches.get(cacheId);
    if (!cache) return;

    const now = Date.now();
    const entries = Array.from(cache.entries());
    
    // Remove expired entries
    const validEntries = entries.filter(([key, entry]) => {
      if (now - entry.timestamp > config.ttl) {
        cache.delete(key);
        return false;
      }
      return true;
    });

    // Check if we need to remove more entries
    if (validEntries.length <= config.maxItems) return;

    // Sort by strategy and remove excess
    const sortedEntries = validEntries.sort(([, a], [, b]) => {
      switch (config.strategy) {
        case 'lru':
          return a.lastAccessed - b.lastAccessed;
        case 'lfu':
          return a.accessCount - b.accessCount;
        case 'fifo':
          return a.timestamp - b.timestamp;
        case 'adaptive':
          // Adaptive strategy considers both access frequency and recency
          const scoreA = (a.accessCount * a.priority) / (now - a.lastAccessed + 1);
          const scoreB = (b.accessCount * b.priority) / (now - b.lastAccessed + 1);
          return scoreA - scoreB;
        default:
          return 0;
      }
    });

    // Remove excess entries
    const toRemove = sortedEntries.slice(0, validEntries.length - config.maxItems);
    toRemove.forEach(([key]) => cache.delete(key));
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }
    if (typeof data === 'number') {
      return 8;
    }
    if (typeof data === 'boolean') {
      return 4;
    }
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 0;
  }

  /**
   * Performance metrics
   */
  initializeMetrics(metricsId: string): void {
    this.metrics.set(metricsId, {
      renderTime: 0,
      scrollTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      itemsRendered: 0,
      totalItems: 0,
      fps: 0,
      lastUpdate: Date.now()
    });
  }

  /**
   * Update metrics
   */
  updateMetrics(
    metricsId: string,
    updates: Partial<PerformanceMetrics>
  ): void {
    const metrics = this.metrics.get(metricsId);
    if (!metrics) return;

    Object.assign(metrics, updates, { lastUpdate: Date.now() });

    // Calculate cache hit rate
    const cache = this.caches.get(metricsId);
    if (cache) {
      const entries = Array.from(cache.values());
      const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
      const hits = entries.length;
      metrics.cacheHitRate = totalAccesses > 0 ? hits / totalAccesses : 0;
    }

    // Estimate memory usage
    if (cache) {
      metrics.memoryUsage = Array.from(cache.values())
        .reduce((sum, entry) => sum + entry.size, 0);
    }
  }

  /**
   * Get metrics
   */
  getMetrics(metricsId: string): PerformanceMetrics | null {
    return this.metrics.get(metricsId) || null;
  }

  /**
   * Measure item size and cache it
   */
  measureItemSize(
    cacheId: string,
    index: number,
    element: HTMLElement
  ): { width: number; height: number } {
    const rect = element.getBoundingClientRect();
    const size = { width: rect.width, height: rect.height };

    // Cache the measurement
    if (!this.itemSizeCache.has(cacheId)) {
      this.itemSizeCache.set(cacheId, new Map());
    }
    
    const sizeCache = this.itemSizeCache.get(cacheId)!;
    sizeCache.set(index, rect.height); // Store height for vertical virtualization

    return size;
  }

  /**
   * Get cached item size
   */
  getCachedItemSize(cacheId: string, index: number): number | null {
    const sizeCache = this.itemSizeCache.get(cacheId);
    return sizeCache ? sizeCache.get(index) || null : null;
  }

  /**
   * Invalidate size cache
   */
  invalidateSizeCache(cacheId: string, index?: number): void {
    const sizeCache = this.itemSizeCache.get(cacheId);
    if (!sizeCache) return;

    if (index !== undefined) {
      sizeCache.delete(index);
    } else {
      sizeCache.clear();
    }
  }

  /**
   * Smooth scroll to index
   */
  scrollToIndex(
    container: HTMLElement,
    index: number,
    totalItems: number,
    getItemSize: (index: number) => number,
    behavior: ScrollBehavior = 'smooth'
  ): void {
    const offset = this.getOffsetForIndex(index, getItemSize);
    
    container.scrollTo({
      top: offset,
      behavior
    });

    // Cache scroll position
    const cacheId = container.id || 'default';
    this.scrollPositionCache.set(cacheId, {
      top: offset,
      left: container.scrollLeft,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached scroll position
   */
  getCachedScrollPosition(cacheId: string): { top: number; left: number } | null {
    const cached = this.scrollPositionCache.get(cacheId);
    if (!cached) return null;

    // Check if cache is still valid (within 5 seconds)
    if (Date.now() - cached.timestamp > 5000) {
      this.scrollPositionCache.delete(cacheId);
      return null;
    }

    return { top: cached.top, left: cached.left };
  }

  /**
   * Optimize scroll performance with throttling
   */
  throttleScroll(
    callback: () => void,
    delay: number = 16 // ~60fps
  ): () => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;

    return () => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        callback();
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          callback();
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Request animation frame with fallback
   */
  requestAnimationFrame(callback: () => void): number {
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      return window.requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16) as any;
  }

  /**
   * Cancel animation frame
   */
  cancelAnimationFrame(id: number): void {
    if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  }

  /**
   * Batch DOM updates
   */
  batchUpdates(updates: (() => void)[]): void {
    this.requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(cacheId?: string): void {
    if (cacheId) {
      // Cleanup specific cache
      this.clearCache(cacheId);
      this.itemSizeCache.delete(cacheId);
      this.scrollPositionCache.delete(cacheId);
      this.metrics.delete(cacheId);
      
      const timer = this.cleanupTimers.get(cacheId);
      if (timer) {
        clearInterval(timer);
        this.cleanupTimers.delete(cacheId);
      }

      const frameId = this.frameCallbacks.get(cacheId);
      if (frameId) {
        this.cancelAnimationFrame(frameId);
        this.frameCallbacks.delete(cacheId);
      }
    } else {
      // Cleanup all resources
      this.caches.clear();
      this.itemSizeCache.clear();
      this.scrollPositionCache.clear();
      this.metrics.clear();
      
      this.cleanupTimers.forEach(timer => clearInterval(timer));
      this.cleanupTimers.clear();
      
      this.frameCallbacks.forEach(frameId => this.cancelAnimationFrame(frameId));
      this.frameCallbacks.clear();
    }
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    totalCaches: number;
    totalCacheEntries: number;
    totalMemoryUsage: number;
    activeCaches: string[];
  } {
    const activeCaches = Array.from(this.caches.keys());
    const totalCacheEntries = activeCaches.reduce(
      (sum, cacheId) => sum + (this.caches.get(cacheId)?.size || 0),
      0
    );
    const totalMemoryUsage = activeCaches.reduce(
      (sum, cacheId) => {
        const metrics = this.metrics.get(cacheId);
        return sum + (metrics?.memoryUsage || 0);
      },
      0
    );

    return {
      totalCaches: this.caches.size,
      totalCacheEntries,
      totalMemoryUsage,
      activeCaches
    };
  }
}

// Export singleton instance
export const virtualizationService = VirtualizationService.getInstance();
export default virtualizationService;

// Export utility functions
export const createVirtualizationService = () => new VirtualizationService();

export const withVirtualization = <T extends Record<string, any>>(
  component: T,
  options: VirtualizationOptions
): T => {
  // HOC wrapper for adding virtualization capabilities
  return component;
};

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void): number => {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};