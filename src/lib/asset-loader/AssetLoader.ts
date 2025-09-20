// Asset Loader System for 3D Avatars
// Handles loading, caching, and management of 3D models, textures, and animations

export interface AssetConfig {
  id: string;
  type: 'model' | 'texture' | 'animation' | 'audio';
  url: string;
  format: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cache: boolean;
  metadata?: {
    size?: number;
    dimensions?: { width: number; height: number; depth?: number };
    duration?: number;
    quality?: string;
  };
}

export interface Asset {
  id: string;
  config: AssetConfig;
  data: any;
  loaded: boolean;
  error?: string;
  loadTime?: number;
  lastAccessed: number;
  referenceCount: number;
}

export interface LoadProgress {
  assetId: string;
  loaded: number;
  total: number;
  percentage: number;
}

export interface AssetCache {
  maxSize: number;
  currentSize: number;
  items: Map<string, Asset>;
  accessOrder: string[];
}

export class AssetLoader {
  private cache: AssetCache;
  private loadingQueue: AssetConfig[] = [];
  private activeLoads: Map<string, Promise<any>> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  constructor(cacheSizeMB = 100) {
    this.cache = {
      maxSize: cacheSizeMB * 1024 * 1024, // Convert to bytes
      currentSize: 0,
      items: new Map(),
      accessOrder: []
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize cache cleanup interval
    setInterval(() => this.cleanupCache(), 30000); // Clean every 30 seconds

    this.isInitialized = true;
    this.emit('initialized');
  }

  // Load asset with priority queuing
  async loadAsset(config: AssetConfig): Promise<Asset> {
    // Check cache first
    const cached = this.cache.items.get(config.id);
    if (cached && cached.loaded) {
      cached.lastAccessed = Date.now();
      cached.referenceCount++;
      this.updateAccessOrder(config.id);
      return cached;
    }

    // Check if already loading
    const existingLoad = this.activeLoads.get(config.id);
    if (existingLoad) {
      return existingLoad;
    }

    // Add to loading queue based on priority
    this.addToQueue(config);

    // Start loading
    const loadPromise = this.performAssetLoad(config);
    this.activeLoads.set(config.id, loadPromise);

    try {
      const asset = await loadPromise;
      this.activeLoads.delete(config.id);

      // Cache if enabled
      if (config.cache) {
        this.addToCache(asset);
      }

      this.emit('assetLoaded', asset);
      return asset;
    } catch (error) {
      this.activeLoads.delete(config.id);
      this.emit('assetError', { assetId: config.id, error });
      throw error;
    }
  }

  // Load multiple assets with progress tracking
  async loadAssets(configs: AssetConfig[]): Promise<Asset[]> {
    const promises = configs.map(config => this.loadAsset(config));
    const results: Asset[] = [];

    for (const promise of promises) {
      try {
        const asset = await promise;
        results.push(asset);
        this.emit('batchProgress', {
          loaded: results.length,
          total: configs.length,
          percentage: (results.length / configs.length) * 100
        });
      } catch (error) {
        console.error('Failed to load asset:', error);
      }
    }

    this.emit('batchComplete', results);
    return results;
  }

  // Preload critical assets
  async preloadCriticalAssets(): Promise<void> {
    const criticalAssets: AssetConfig[] = [
      {
        id: 'base-avatar-model',
        type: 'model',
        url: '/assets/models/base-avatar.glb',
        format: 'glb',
        priority: 'critical',
        cache: true
      },
      {
        id: 'default-texture',
        type: 'texture',
        url: '/assets/textures/default.png',
        format: 'png',
        priority: 'high',
        cache: true
      },
      {
        id: 'idle-animation',
        type: 'animation',
        url: '/assets/animations/idle.json',
        format: 'json',
        priority: 'high',
        cache: true
      }
    ];

    await this.loadAssets(criticalAssets);
  }

  private async performAssetLoad(config: AssetConfig): Promise<Asset> {
    const startTime = Date.now();

    try {
      let data: any;

      switch (config.type) {
        case 'model':
          data = await this.load3DModel(config);
          break;
        case 'texture':
          data = await this.loadTexture(config);
          break;
        case 'animation':
          data = await this.loadAnimation(config);
          break;
        case 'audio':
          data = await this.loadAudio(config);
          break;
        default:
          throw new Error(`Unsupported asset type: ${config.type}`);
      }

      const asset: Asset = {
        id: config.id,
        config,
        data,
        loaded: true,
        loadTime: Date.now() - startTime,
        lastAccessed: Date.now(),
        referenceCount: 1
      };

      return asset;
    } catch (error) {
      const asset: Asset = {
        id: config.id,
        config,
        data: null,
        loaded: false,
        error: (error as Error).message,
        loadTime: Date.now() - startTime,
        lastAccessed: Date.now(),
        referenceCount: 0
      };

      throw error;
    }
  }

  private async load3DModel(config: AssetConfig): Promise<any> {
    // Simulate 3D model loading (GLTF/GLB)
    // In real implementation, this would use Three.js GLTFLoader
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            type: 'model',
            geometry: {},
            materials: [],
            animations: []
          });
        } else {
          reject(new Error('Failed to load 3D model'));
        }
      }, Math.random() * 2000 + 500); // 500ms to 2.5s
    });
  }

  private async loadTexture(config: AssetConfig): Promise<any> {
    // Simulate texture loading
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% success rate
          resolve({
            type: 'texture',
            image: new Image(),
            width: 512,
            height: 512
          });
        } else {
          reject(new Error('Failed to load texture'));
        }
      }, Math.random() * 1000 + 200); // 200ms to 1.2s
    });
  }

  private async loadAnimation(config: AssetConfig): Promise<any> {
    // Simulate animation loading
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            type: 'animation',
            duration: 2.0,
            keyframes: [],
            loop: true
          });
        } else {
          reject(new Error('Failed to load animation'));
        }
      }, Math.random() * 800 + 300); // 300ms to 1.1s
    });
  }

  private async loadAudio(config: AssetConfig): Promise<any> {
    // Simulate audio loading
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.15) { // 85% success rate
          resolve({
            type: 'audio',
            buffer: new ArrayBuffer(1024),
            duration: 2.0
          });
        } else {
          reject(new Error('Failed to load audio'));
        }
      }, Math.random() * 600 + 400); // 400ms to 1s
    });
  }

  private addToQueue(config: AssetConfig): void {
    // Remove if already in queue
    this.loadingQueue = this.loadingQueue.filter(item => item.id !== config.id);

    // Add based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.loadingQueue.findIndex(
      item => priorityOrder[item.priority] > priorityOrder[config.priority]
    );

    if (insertIndex === -1) {
      this.loadingQueue.push(config);
    } else {
      this.loadingQueue.splice(insertIndex, 0, config);
    }
  }

  private addToCache(asset: Asset): void {
    // Calculate asset size (simplified)
    const assetSize = this.calculateAssetSize(asset);

    // Check if we need to free up space
    while (this.cache.currentSize + assetSize > this.cache.maxSize && this.cache.items.size > 0) {
      this.evictLeastRecentlyUsed();
    }

    // Add to cache
    this.cache.items.set(asset.id, asset);
    this.cache.currentSize += assetSize;
    this.updateAccessOrder(asset.id);
  }

  private calculateAssetSize(asset: Asset): number {
    // Simplified size calculation
    switch (asset.config.type) {
      case 'model': return 5 * 1024 * 1024; // 5MB
      case 'texture': return 2 * 1024 * 1024; // 2MB
      case 'animation': return 512 * 1024; // 512KB
      case 'audio': return 1024 * 1024; // 1MB
      default: return 1024 * 1024; // 1MB
    }
  }

  private evictLeastRecentlyUsed(): void {
    if (this.cache.accessOrder.length === 0) return;

    const lruId = this.cache.accessOrder.pop()!;
    const asset = this.cache.items.get(lruId);

    if (asset) {
      const assetSize = this.calculateAssetSize(asset);
      this.cache.currentSize -= assetSize;
      this.cache.items.delete(lruId);
      this.emit('assetEvicted', lruId);
    }
  }

  private updateAccessOrder(assetId: string): void {
    // Remove from current position
    const index = this.cache.accessOrder.indexOf(assetId);
    if (index > -1) {
      this.cache.accessOrder.splice(index, 1);
    }

    // Add to front (most recently used)
    this.cache.accessOrder.unshift(assetId);
  }

  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [id, asset] of this.cache.items) {
      if (now - asset.lastAccessed > maxAge && asset.referenceCount === 0) {
        this.cache.items.delete(id);
        const assetSize = this.calculateAssetSize(asset);
        this.cache.currentSize -= assetSize;
        this.emit('assetExpired', id);
      }
    }
  }

  // Public API methods
  getAsset(assetId: string): Asset | undefined {
    const asset = this.cache.items.get(assetId);
    if (asset) {
      asset.lastAccessed = Date.now();
      asset.referenceCount++;
      this.updateAccessOrder(assetId);
    }
    return asset;
  }

  releaseAsset(assetId: string): void {
    const asset = this.cache.items.get(assetId);
    if (asset) {
      asset.referenceCount = Math.max(0, asset.referenceCount - 1);
    }
  }

  getCacheStats(): {
    maxSize: number;
    currentSize: number;
    itemCount: number;
    hitRate: number;
  } {
    return {
      maxSize: this.cache.maxSize,
      currentSize: this.cache.currentSize,
      itemCount: this.cache.items.size,
      hitRate: 0 // Would need to track hits/misses for real implementation
    };
  }

  clearCache(): void {
    this.cache.items.clear();
    this.cache.currentSize = 0;
    this.cache.accessOrder = [];
    this.emit('cacheCleared');
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  dispose(): void {
    this.clearCache();
    this.loadingQueue = [];
    this.activeLoads.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const assetLoader = new AssetLoader();
