import { create } from 'zustand';

// Types and Interfaces
export interface CompressionAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code';
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  format: string;
  targetFormat?: string;
  status: 'pending' | 'compressing' | 'completed' | 'failed' | 'optimized';
  progress: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    bitrate?: number;
    codec?: string;
    colorSpace?: string;
    channels?: number;
    sampleRate?: number;
    [key: string]: any;
  };
  optimizations: string[];
  settings: CompressionSettings;
  createdAt: number;
  updatedAt: number;
}

export interface CompressionOptimization {
  id: string;
  type: 'lossless' | 'lossy' | 'adaptive' | 'progressive' | 'webp' | 'avif' | 'heic';
  description: string;
  sizeSaving: number;
  qualityImpact: number;
  processingTime: number;
  isApplied: boolean;
  isRecommended: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compatibility: string[];
  requirements: string[];
}

export interface CompressionSettings {
  quality: number;
  format: string;
  progressive: boolean;
  stripMetadata: boolean;
  optimizeForWeb: boolean;
  preserveTransparency: boolean;
  resizeEnabled: boolean;
  maxWidth?: number;
  maxHeight?: number;
  customOptions: Record<string, any>;
}

export interface CompressionProfile {
  id: string;
  name: string;
  description: string;
  settings: CompressionSettings;
  targetTypes: CompressionAsset['type'][];
  isDefault: boolean;
  isCustom: boolean;
  performance: {
    averageRatio: number;
    averageTime: number;
    successRate: number;
  };
}

export interface CompressionBatch {
  id: string;
  name: string;
  assets: string[];
  profile: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: number;
  endTime?: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  createdAt: number;
}

export interface CompressionConfig {
  maxConcurrentJobs: number;
  maxFileSize: number;
  enableAutoOptimization: boolean;
  enableProgressiveJPEG: boolean;
  enableWebPConversion: boolean;
  enableAVIFConversion: boolean;
  defaultQuality: number;
  preserveMetadata: boolean;
  enableBatchProcessing: boolean;
  autoRetryFailed: boolean;
  maxRetries: number;
  compressionTimeout: number;
  enableCloudProcessing: boolean;
  cloudProvider?: 'aws' | 'gcp' | 'azure';
  enableCaching: boolean;
  cacheExpiry: number;
}

export interface CompressionStats {
  totalAssets: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  averageCompressionRatio: number;
  averageProcessingTime: number;
  successRate: number;
  failureRate: number;
  mostUsedFormat: string;
  bestCompressionRatio: number;
  processingSpeed: number;
  queueLength: number;
  activeJobs: number;
  completedToday: number;
  savingsToday: number;
}

export interface CompressionMetrics {
  timestamp: number;
  assetsProcessed: number;
  totalSavings: number;
  averageRatio: number;
  processingTime: number;
  errorRate: number;
  throughput: number;
  queueSize: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface CompressionEvent {
  id: string;
  type: 'asset_added' | 'compression_started' | 'compression_completed' | 'compression_failed' | 'batch_created' | 'profile_applied' | 'optimization_applied' | 'error_occurred' | 'system_event';
  assetId?: string;
  batchId?: string;
  profileId?: string;
  message: string;
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export interface CompressionDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'compression' | 'optimization' | 'batch' | 'profile' | 'system' | 'performance';
  message: string;
  data?: any;
  timestamp: number;
  assetId?: string;
  batchId?: string;
}

// Zustand Store
interface AssetCompressionStore {
  // State
  assets: CompressionAsset[];
  profiles: CompressionProfile[];
  batches: CompressionBatch[];
  optimizations: CompressionOptimization[];
  config: CompressionConfig;
  stats: CompressionStats;
  metrics: CompressionMetrics[];
  events: CompressionEvent[];
  debugLogs: CompressionDebugLog[];
  isProcessing: boolean;
  isInitialized: boolean;
  lastUpdated: number;

  // Actions
  actions: {
    // Asset Management
    addAsset: (file: File, settings?: Partial<CompressionSettings>) => Promise<string>;
    removeAsset: (assetId: string) => void;
    compressAsset: (assetId: string, profileId?: string) => Promise<void>;
    recompressAsset: (assetId: string, newSettings: CompressionSettings) => Promise<void>;
    cancelCompression: (assetId: string) => void;
    retryCompression: (assetId: string) => Promise<void>;
    
    // Profile Management
    createProfile: (profile: Omit<CompressionProfile, 'id' | 'performance'>) => string;
    updateProfile: (profileId: string, updates: Partial<CompressionProfile>) => void;
    deleteProfile: (profileId: string) => void;
    applyProfile: (assetId: string, profileId: string) => void;
    
    // Batch Processing
    createBatch: (name: string, assetIds: string[], profileId: string) => string;
    processBatch: (batchId: string) => Promise<void>;
    pauseBatch: (batchId: string) => void;
    resumeBatch: (batchId: string) => void;
    cancelBatch: (batchId: string) => void;
    
    // Optimization
    analyzeAsset: (assetId: string) => Promise<CompressionOptimization[]>;
    applyOptimization: (assetId: string, optimizationId: string) => Promise<void>;
    autoOptimize: (assetId: string) => Promise<void>;
    bulkOptimize: (assetIds: string[]) => Promise<void>;
  };

  // Configuration
  configuration: {
    updateConfig: (updates: Partial<CompressionConfig>) => void;
    resetConfig: () => void;
    exportConfig: () => string;
    importConfig: (config: string) => void;
    getRecommendedSettings: (assetType: CompressionAsset['type']) => CompressionSettings;
  };

  // Analytics
  analytics: {
    getMetrics: () => CompressionMetrics;
    getStats: () => CompressionStats;
    generateReport: (startDate: Date, endDate: Date) => any;
    exportData: (format: 'json' | 'csv' | 'xlsx') => string;
    getPerformanceInsights: () => any;
  };

  // Utilities
  utils: {
    validateAsset: (file: File) => { isValid: boolean; errors: string[] };
    estimateCompressionTime: (assetId: string, profileId: string) => number;
    calculateSavings: (originalSize: number, compressedSize: number) => number;
    getOptimalSettings: (assetId: string) => CompressionSettings;
    previewCompression: (assetId: string, settings: CompressionSettings) => Promise<{ size: number; quality: number }>;
  };

  // Quick Actions
  quickActions: {
    compressAll: () => Promise<void>;
    optimizeForWeb: (assetIds: string[]) => Promise<void>;
    convertToWebP: (assetIds: string[]) => Promise<void>;
    convertToAVIF: (assetIds: string[]) => Promise<void>;
    stripMetadata: (assetIds: string[]) => Promise<void>;
    resizeImages: (assetIds: string[], maxWidth: number, maxHeight: number) => Promise<void>;
  };

  // Advanced Features
  advanced: {
    enableCloudProcessing: () => Promise<void>;
    setupAutoCompression: (rules: any[]) => void;
    createCompressionPipeline: (steps: any[]) => string;
    enableProgressiveLoading: (assetIds: string[]) => Promise<void>;
    optimizeForCDN: (assetIds: string[]) => Promise<void>;
  };

  // System Operations
  system: {
    initialize: () => Promise<void>;
    cleanup: () => void;
    clearCache: () => void;
    exportAssets: (assetIds: string[]) => Promise<Blob>;
    importAssets: (files: FileList) => Promise<string[]>;
    getSystemInfo: () => any;
  };

  // Debug
  debug: {
    enableDebugMode: () => void;
    disableDebugMode: () => void;
    getDebugInfo: () => any;
    exportLogs: () => string;
    clearLogs: () => void;
  };

  // Computed Values
  computed: {
    totalAssets: number;
    activeCompressions: number;
    totalSavings: number;
    averageCompressionRatio: number;
    systemHealth: boolean;
    queueLength: number;
    processingSpeed: number;
    estimatedTimeRemaining: number;
  };
}

// Default Configuration
const defaultConfig: CompressionConfig = {
  maxConcurrentJobs: 4,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  enableAutoOptimization: true,
  enableProgressiveJPEG: true,
  enableWebPConversion: true,
  enableAVIFConversion: false,
  defaultQuality: 85,
  preserveMetadata: false,
  enableBatchProcessing: true,
  autoRetryFailed: true,
  maxRetries: 3,
  compressionTimeout: 300000, // 5 minutes
  enableCloudProcessing: false,
  enableCaching: true,
  cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours
};

// Default Profiles
const defaultProfiles: CompressionProfile[] = [
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'Optimized for web delivery with good quality/size balance',
    settings: {
      quality: 85,
      format: 'auto',
      progressive: true,
      stripMetadata: true,
      optimizeForWeb: true,
      preserveTransparency: true,
      resizeEnabled: true,
      maxWidth: 1920,
      maxHeight: 1080,
      customOptions: {}
    },
    targetTypes: ['image', 'video'],
    isDefault: true,
    isCustom: false,
    performance: {
      averageRatio: 0.65,
      averageTime: 2500,
      successRate: 0.98
    }
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Minimal compression for maximum quality',
    settings: {
      quality: 95,
      format: 'original',
      progressive: false,
      stripMetadata: false,
      optimizeForWeb: false,
      preserveTransparency: true,
      resizeEnabled: false,
      customOptions: {}
    },
    targetTypes: ['image', 'video', 'audio'],
    isDefault: false,
    isCustom: false,
    performance: {
      averageRatio: 0.85,
      averageTime: 1500,
      successRate: 0.99
    }
  },
  {
    id: 'maximum-compression',
    name: 'Maximum Compression',
    description: 'Aggressive compression for smallest file sizes',
    settings: {
      quality: 60,
      format: 'webp',
      progressive: true,
      stripMetadata: true,
      optimizeForWeb: true,
      preserveTransparency: false,
      resizeEnabled: true,
      maxWidth: 1280,
      maxHeight: 720,
      customOptions: {}
    },
    targetTypes: ['image'],
    isDefault: false,
    isCustom: false,
    performance: {
      averageRatio: 0.35,
      averageTime: 3500,
      successRate: 0.95
    }
  }
];

// Create Store
export const useAssetCompressionStore = create<AssetCompressionStore>((set, get) => ({
  // Initial State
  assets: [],
  profiles: defaultProfiles,
  batches: [],
  optimizations: [],
  config: defaultConfig,
  stats: {
    totalAssets: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavings: 0,
    averageCompressionRatio: 0,
    averageProcessingTime: 0,
    successRate: 0,
    failureRate: 0,
    mostUsedFormat: 'jpeg',
    bestCompressionRatio: 0,
    processingSpeed: 0,
    queueLength: 0,
    activeJobs: 0,
    completedToday: 0,
    savingsToday: 0
  },
  metrics: [],
  events: [],
  debugLogs: [],
  isProcessing: false,
  isInitialized: false,
  lastUpdated: Date.now(),

  // Actions
  actions: {
    addAsset: async (file: File, settings?: Partial<CompressionSettings>) => {
      const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const defaultSettings = get().configuration.getRecommendedSettings(
        file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('video/') ? 'video' :
        file.type.startsWith('audio/') ? 'audio' : 'document'
      );
      
      const asset: CompressionAsset = {
        id,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        quality: 100,
        format: file.type,
        status: 'pending',
        progress: 0,
        metadata: {},
        optimizations: [],
        settings: { ...defaultSettings, ...settings },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      set(state => ({
        assets: [...state.assets, asset],
        events: [...state.events, {
          id: `event_${Date.now()}`,
          type: 'asset_added',
          assetId: id,
          message: `Asset "${file.name}" added for compression`,
          severity: 'info',
          timestamp: Date.now()
        }],
        lastUpdated: Date.now()
      }));
      
      return id;
    },

    removeAsset: (assetId: string) => {
      set(state => ({
        assets: state.assets.filter(asset => asset.id !== assetId),
        lastUpdated: Date.now()
      }));
    },

    compressAsset: async (assetId: string, profileId?: string) => {
      const state = get();
      const asset = state.assets.find(a => a.id === assetId);
      if (!asset) return;
      
      const profile = profileId ? state.profiles.find(p => p.id === profileId) : null;
      const settings = profile ? profile.settings : asset.settings;
      
      // Update asset status
      set(state => ({
        assets: state.assets.map(a => 
          a.id === assetId 
            ? { ...a, status: 'compressing', startTime: Date.now(), settings }
            : a
        ),
        isProcessing: true,
        events: [...state.events, {
          id: `event_${Date.now()}`,
          type: 'compression_started',
          assetId,
          message: `Compression started for "${asset.name}"`,
          severity: 'info',
          timestamp: Date.now()
        }],
        lastUpdated: Date.now()
      }));
      
      try {
        // Simulate compression process
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        // Simulate compression results
        const compressionRatio = 0.3 + Math.random() * 0.5; // 30-80% compression
        const compressedSize = Math.floor(asset.originalSize * compressionRatio);
        
        set(state => ({
          assets: state.assets.map(a => 
            a.id === assetId 
              ? { 
                  ...a, 
                  status: 'completed',
                  progress: 100,
                  compressedSize,
                  compressionRatio: 1 - compressionRatio,
                  endTime: Date.now(),
                  duration: Date.now() - (a.startTime || Date.now()),
                  updatedAt: Date.now()
                }
              : a
          ),
          events: [...state.events, {
            id: `event_${Date.now()}`,
            type: 'compression_completed',
            assetId,
            message: `Compression completed for "${asset.name}" - ${formatBytes(asset.originalSize - compressedSize)} saved`,
            severity: 'success',
            timestamp: Date.now()
          }],
          lastUpdated: Date.now()
        }));
      } catch (error) {
        set(state => ({
          assets: state.assets.map(a => 
            a.id === assetId 
              ? { 
                  ...a, 
                  status: 'failed',
                  error: error instanceof Error ? error.message : 'Compression failed',
                  endTime: Date.now(),
                  updatedAt: Date.now()
                }
              : a
          ),
          events: [...state.events, {
            id: `event_${Date.now()}`,
            type: 'compression_failed',
            assetId,
            message: `Compression failed for "${asset.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
            timestamp: Date.now()
          }],
          lastUpdated: Date.now()
        }));
      } finally {
        // Check if any assets are still processing
        const stillProcessing = get().assets.some(a => a.status === 'compressing');
        if (!stillProcessing) {
          set(state => ({ ...state, isProcessing: false }));
        }
      }
    },

    recompressAsset: async (assetId: string, newSettings: CompressionSettings) => {
      set(state => ({
        assets: state.assets.map(a => 
          a.id === assetId 
            ? { ...a, settings: newSettings, status: 'pending', progress: 0 }
            : a
        ),
        lastUpdated: Date.now()
      }));
      
      await get().actions.compressAsset(assetId);
    },

    cancelCompression: (assetId: string) => {
      set(state => ({
        assets: state.assets.map(a => 
          a.id === assetId && a.status === 'compressing'
            ? { ...a, status: 'pending', progress: 0, startTime: undefined }
            : a
        ),
        lastUpdated: Date.now()
      }));
    },

    retryCompression: async (assetId: string) => {
      const asset = get().assets.find(a => a.id === assetId);
      if (asset && asset.status === 'failed') {
        set(state => ({
          assets: state.assets.map(a => 
            a.id === assetId 
              ? { ...a, status: 'pending', progress: 0, error: undefined }
              : a
          ),
          lastUpdated: Date.now()
        }));
        
        await get().actions.compressAsset(assetId);
      }
    },

    createProfile: (profile: Omit<CompressionProfile, 'id' | 'performance'>) => {
      const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newProfile: CompressionProfile = {
        ...profile,
        id,
        performance: {
          averageRatio: 0,
          averageTime: 0,
          successRate: 0
        }
      };
      
      set(state => ({
        profiles: [...state.profiles, newProfile],
        lastUpdated: Date.now()
      }));
      
      return id;
    },

    updateProfile: (profileId: string, updates: Partial<CompressionProfile>) => {
      set(state => ({
        profiles: state.profiles.map(p => 
          p.id === profileId ? { ...p, ...updates } : p
        ),
        lastUpdated: Date.now()
      }));
    },

    deleteProfile: (profileId: string) => {
      set(state => ({
        profiles: state.profiles.filter(p => p.id !== profileId),
        lastUpdated: Date.now()
      }));
    },

    applyProfile: (assetId: string, profileId: string) => {
      const profile = get().profiles.find(p => p.id === profileId);
      if (profile) {
        set(state => ({
          assets: state.assets.map(a => 
            a.id === assetId 
              ? { ...a, settings: profile.settings }
              : a
          ),
          lastUpdated: Date.now()
        }));
      }
    },

    createBatch: (name: string, assetIds: string[], profileId: string) => {
      const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const assets = get().assets.filter(a => assetIds.includes(a.id));
      const totalOriginalSize = assets.reduce((sum, asset) => sum + asset.originalSize, 0);
      
      const batch: CompressionBatch = {
        id,
        name,
        assets: assetIds,
        profile: profileId,
        status: 'pending',
        progress: 0,
        totalOriginalSize,
        totalCompressedSize: 0,
        totalSavings: 0,
        createdAt: Date.now()
      };
      
      set(state => ({
        batches: [...state.batches, batch],
        events: [...state.events, {
          id: `event_${Date.now()}`,
          type: 'batch_created',
          batchId: id,
          message: `Batch "${name}" created with ${assetIds.length} assets`,
          severity: 'info',
          timestamp: Date.now()
        }],
        lastUpdated: Date.now()
      }));
      
      return id;
    },

    processBatch: async (batchId: string) => {
      const batch = get().batches.find(b => b.id === batchId);
      if (!batch) return;
      
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId 
            ? { ...b, status: 'processing', startTime: Date.now() }
            : b
        ),
        lastUpdated: Date.now()
      }));
      
      // Process assets sequentially
      for (let i = 0; i < batch.assets.length; i++) {
        const assetId = batch.assets[i];
        await get().actions.compressAsset(assetId, batch.profile);
        
        // Update batch progress
        const progress = ((i + 1) / batch.assets.length) * 100;
        set(state => ({
          batches: state.batches.map(b => 
            b.id === batchId ? { ...b, progress } : b
          ),
          lastUpdated: Date.now()
        }));
      }
      
      // Calculate final results
      const assets = get().assets.filter(a => batch.assets.includes(a.id));
      const totalCompressedSize = assets.reduce((sum, asset) => sum + asset.compressedSize, 0);
      const totalSavings = batch.totalOriginalSize - totalCompressedSize;
      
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId 
            ? { 
                ...b, 
                status: 'completed',
                progress: 100,
                endTime: Date.now(),
                totalCompressedSize,
                totalSavings
              }
            : b
        ),
        lastUpdated: Date.now()
      }));
    },

    pauseBatch: (batchId: string) => {
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId ? { ...b, status: 'paused' } : b
        ),
        lastUpdated: Date.now()
      }));
    },

    resumeBatch: (batchId: string) => {
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId ? { ...b, status: 'processing' } : b
        ),
        lastUpdated: Date.now()
      }));
    },

    cancelBatch: (batchId: string) => {
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId ? { ...b, status: 'failed' } : b
        ),
        lastUpdated: Date.now()
      }));
    },

    analyzeAsset: async (assetId: string) => {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const optimizations: CompressionOptimization[] = [
        {
          id: 'opt_1',
          type: 'progressive',
          description: 'Enable progressive JPEG for faster loading',
          sizeSaving: 0.05,
          qualityImpact: 0,
          processingTime: 500,
          isApplied: false,
          isRecommended: true,
          priority: 'medium',
          compatibility: ['jpeg', 'jpg'],
          requirements: []
        },
        {
          id: 'opt_2',
          type: 'webp',
          description: 'Convert to WebP format for better compression',
          sizeSaving: 0.25,
          qualityImpact: 0.02,
          processingTime: 1500,
          isApplied: false,
          isRecommended: true,
          priority: 'high',
          compatibility: ['modern browsers'],
          requirements: ['WebP support']
        }
      ];
      
      set(state => ({
        optimizations: [...state.optimizations, ...optimizations],
        assets: state.assets.map(a => 
          a.id === assetId 
            ? { ...a, optimizations: optimizations.map(o => o.id) }
            : a
        ),
        lastUpdated: Date.now()
      }));
      
      return optimizations;
    },

    applyOptimization: async (assetId: string, optimizationId: string) => {
      // Simulate applying optimization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => ({
        optimizations: state.optimizations.map(o => 
          o.id === optimizationId ? { ...o, isApplied: true } : o
        ),
        events: [...state.events, {
          id: `event_${Date.now()}`,
          type: 'optimization_applied',
          assetId,
          message: `Optimization applied to asset`,
          severity: 'success',
          timestamp: Date.now()
        }],
        lastUpdated: Date.now()
      }));
    },

    autoOptimize: async (assetId: string) => {
      const optimizations = await get().actions.analyzeAsset(assetId);
      const recommended = optimizations.filter(o => o.isRecommended);
      
      for (const optimization of recommended) {
        await get().actions.applyOptimization(assetId, optimization.id);
      }
    },

    bulkOptimize: async (assetIds: string[]) => {
      for (const assetId of assetIds) {
        await get().actions.autoOptimize(assetId);
      }
    }
  },

  // Configuration
  configuration: {
    updateConfig: (updates: Partial<CompressionConfig>) => {
      set(state => ({
        config: { ...state.config, ...updates },
        lastUpdated: Date.now()
      }));
    },

    resetConfig: () => {
      set(state => ({
        config: defaultConfig,
        lastUpdated: Date.now()
      }));
    },

    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },

    importConfig: (config: string) => {
      try {
        const parsedConfig = JSON.parse(config);
        set(state => ({
          config: { ...defaultConfig, ...parsedConfig },
          lastUpdated: Date.now()
        }));
      } catch (error) {
        console.error('Failed to import config:', error);
      }
    },

    getRecommendedSettings: (assetType: CompressionAsset['type']) => {
      const baseSettings: CompressionSettings = {
        quality: 85,
        format: 'auto',
        progressive: true,
        stripMetadata: true,
        optimizeForWeb: true,
        preserveTransparency: true,
        resizeEnabled: false,
        customOptions: {}
      };
      
      switch (assetType) {
        case 'image':
          return {
            ...baseSettings,
            resizeEnabled: true,
            maxWidth: 1920,
            maxHeight: 1080
          };
        case 'video':
          return {
            ...baseSettings,
            quality: 75,
            format: 'mp4'
          };
        case 'audio':
          return {
            ...baseSettings,
            quality: 80,
            format: 'mp3'
          };
        default:
          return baseSettings;
      }
    }
  },

  // Analytics
  analytics: {
    getMetrics: () => {
      const state = get();
      const now = Date.now();
      
      const metrics: CompressionMetrics = {
        timestamp: now,
        assetsProcessed: state.assets.filter(a => a.status === 'completed').length,
        totalSavings: state.assets.reduce((sum, asset) => 
          sum + (asset.originalSize - asset.compressedSize), 0
        ),
        averageRatio: state.assets.length > 0 
          ? state.assets.reduce((sum, asset) => sum + asset.compressionRatio, 0) / state.assets.length
          : 0,
        processingTime: state.assets.reduce((sum, asset) => 
          sum + (asset.duration || 0), 0
        ),
        errorRate: state.assets.length > 0 
          ? state.assets.filter(a => a.status === 'failed').length / state.assets.length
          : 0,
        throughput: 0, // Calculate based on recent activity
        queueSize: state.assets.filter(a => a.status === 'pending').length,
        systemLoad: Math.random() * 100, // Simulate system load
        memoryUsage: Math.random() * 8 * 1024 * 1024 * 1024, // Simulate memory usage
        diskUsage: Math.random() * 100 * 1024 * 1024 * 1024 // Simulate disk usage
      };
      
      set(state => ({
        metrics: [...state.metrics.slice(-99), metrics], // Keep last 100 metrics
        lastUpdated: Date.now()
      }));
      
      return metrics;
    },

    getStats: () => {
      const state = get();
      const completedAssets = state.assets.filter(a => a.status === 'completed');
      const failedAssets = state.assets.filter(a => a.status === 'failed');
      
      const stats: CompressionStats = {
        totalAssets: state.assets.length,
        totalOriginalSize: state.assets.reduce((sum, asset) => sum + asset.originalSize, 0),
        totalCompressedSize: completedAssets.reduce((sum, asset) => sum + asset.compressedSize, 0),
        totalSavings: completedAssets.reduce((sum, asset) => 
          sum + (asset.originalSize - asset.compressedSize), 0
        ),
        averageCompressionRatio: completedAssets.length > 0 
          ? completedAssets.reduce((sum, asset) => sum + asset.compressionRatio, 0) / completedAssets.length
          : 0,
        averageProcessingTime: completedAssets.length > 0 
          ? completedAssets.reduce((sum, asset) => sum + (asset.duration || 0), 0) / completedAssets.length
          : 0,
        successRate: state.assets.length > 0 
          ? completedAssets.length / state.assets.length
          : 0,
        failureRate: state.assets.length > 0 
          ? failedAssets.length / state.assets.length
          : 0,
        mostUsedFormat: 'jpeg', // Calculate from actual data
        bestCompressionRatio: completedAssets.length > 0 
          ? Math.max(...completedAssets.map(a => a.compressionRatio))
          : 0,
        processingSpeed: 0, // Calculate based on recent activity
        queueLength: state.assets.filter(a => a.status === 'pending').length,
        activeJobs: state.assets.filter(a => a.status === 'compressing').length,
        completedToday: 0, // Calculate based on today's completions
        savingsToday: 0 // Calculate based on today's savings
      };
      
      set(state => ({ ...state, stats, lastUpdated: Date.now() }));
      
      return stats;
    },

    generateReport: (startDate: Date, endDate: Date) => {
      const state = get();
      const assetsInRange = state.assets.filter(asset => 
        asset.createdAt >= startDate.getTime() && asset.createdAt <= endDate.getTime()
      );
      
      return {
        period: { start: startDate, end: endDate },
        summary: {
          totalAssets: assetsInRange.length,
          totalSavings: assetsInRange.reduce((sum, asset) => 
            sum + (asset.originalSize - asset.compressedSize), 0
          ),
          averageCompressionRatio: assetsInRange.length > 0 
            ? assetsInRange.reduce((sum, asset) => sum + asset.compressionRatio, 0) / assetsInRange.length
            : 0
        },
        assets: assetsInRange
      };
    },

    exportData: (format: 'json' | 'csv' | 'xlsx') => {
      const state = get();
      
      switch (format) {
        case 'json':
          return JSON.stringify({
            assets: state.assets,
            profiles: state.profiles,
            batches: state.batches,
            stats: state.stats,
            exportedAt: new Date().toISOString()
          }, null, 2);
        case 'csv':
          // Simplified CSV export
          const headers = 'Name,Type,Original Size,Compressed Size,Compression Ratio,Status\n';
          const rows = state.assets.map(asset => 
            `"${asset.name}",${asset.type},${asset.originalSize},${asset.compressedSize},${asset.compressionRatio},${asset.status}`
          ).join('\n');
          return headers + rows;
        default:
          return JSON.stringify(state.assets);
      }
    },

    getPerformanceInsights: () => {
      const state = get();
      const completedAssets = state.assets.filter(a => a.status === 'completed');
      
      return {
        topPerformingFormats: [], // Calculate from data
        bottlenecks: [], // Identify performance issues
        recommendations: [
          'Consider enabling WebP conversion for better compression',
          'Use progressive JPEG for faster loading',
          'Enable batch processing for multiple files'
        ],
        trends: {
          compressionRatio: [], // Historical data
          processingTime: [], // Historical data
          throughput: [] // Historical data
        }
      };
    }
  },

  // Utilities
  utils: {
    validateAsset: (file: File) => {
      const errors: string[] = [];
      const config = get().config;
      
      if (file.size > config.maxFileSize) {
        errors.push(`File size exceeds maximum limit of ${formatBytes(config.maxFileSize)}`);
      }
      
      const supportedTypes = ['image/', 'video/', 'audio/', 'application/pdf'];
      if (!supportedTypes.some(type => file.type.startsWith(type))) {
        errors.push('Unsupported file type');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },

    estimateCompressionTime: (assetId: string, profileId: string) => {
      const asset = get().assets.find(a => a.id === assetId);
      const profile = get().profiles.find(p => p.id === profileId);
      
      if (!asset || !profile) return 0;
      
      // Estimate based on file size and profile complexity
      const baseTime = asset.originalSize / (1024 * 1024) * 1000; // 1 second per MB
      const complexityMultiplier = profile.settings.quality < 70 ? 1.5 : 1.0;
      
      return Math.floor(baseTime * complexityMultiplier);
    },

    calculateSavings: (originalSize: number, compressedSize: number) => {
      return originalSize - compressedSize;
    },

    getOptimalSettings: (assetId: string) => {
      const asset = get().assets.find(a => a.id === assetId);
      if (!asset) return get().configuration.getRecommendedSettings('image');
      
      // Return optimized settings based on asset characteristics
      return get().configuration.getRecommendedSettings(asset.type);
    },

    previewCompression: async (assetId: string, settings: CompressionSettings) => {
      // Simulate compression preview
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const asset = get().assets.find(a => a.id === assetId);
      if (!asset) return { size: 0, quality: 0 };
      
      const estimatedRatio = 0.3 + (settings.quality / 100) * 0.5;
      const estimatedSize = Math.floor(asset.originalSize * estimatedRatio);
      
      return {
        size: estimatedSize,
        quality: settings.quality
      };
    }
  },

  // Quick Actions
  quickActions: {
    compressAll: async () => {
      const pendingAssets = get().assets.filter(a => a.status === 'pending');
      for (const asset of pendingAssets) {
        await get().actions.compressAsset(asset.id);
      }
    },

    optimizeForWeb: async (assetIds: string[]) => {
      const webProfile = get().profiles.find(p => p.id === 'web-optimized');
      if (!webProfile) return;
      
      for (const assetId of assetIds) {
        get().actions.applyProfile(assetId, webProfile.id);
        await get().actions.compressAsset(assetId);
      }
    },

    convertToWebP: async (assetIds: string[]) => {
      for (const assetId of assetIds) {
        const asset = get().assets.find(a => a.id === assetId);
        if (asset && asset.type === 'image') {
          const webpSettings: CompressionSettings = {
            ...asset.settings,
            format: 'webp'
          };
          await get().actions.recompressAsset(assetId, webpSettings);
        }
      }
    },

    convertToAVIF: async (assetIds: string[]) => {
      for (const assetId of assetIds) {
        const asset = get().assets.find(a => a.id === assetId);
        if (asset && asset.type === 'image') {
          const avifSettings: CompressionSettings = {
            ...asset.settings,
            format: 'avif'
          };
          await get().actions.recompressAsset(assetId, avifSettings);
        }
      }
    },

    stripMetadata: async (assetIds: string[]) => {
      for (const assetId of assetIds) {
        const asset = get().assets.find(a => a.id === assetId);
        if (asset) {
          const strippedSettings: CompressionSettings = {
            ...asset.settings,
            stripMetadata: true
          };
          await get().actions.recompressAsset(assetId, strippedSettings);
        }
      }
    },

    resizeImages: async (assetIds: string[], maxWidth: number, maxHeight: number) => {
      for (const assetId of assetIds) {
        const asset = get().assets.find(a => a.id === assetId);
        if (asset && asset.type === 'image') {
          const resizedSettings: CompressionSettings = {
            ...asset.settings,
            resizeEnabled: true,
            maxWidth,
            maxHeight
          };
          await get().actions.recompressAsset(assetId, resizedSettings);
        }
      }
    }
  },

  // Advanced Features
  advanced: {
    enableCloudProcessing: async () => {
      set(state => ({
        config: { ...state.config, enableCloudProcessing: true },
        lastUpdated: Date.now()
      }));
    },

    setupAutoCompression: (rules: any[]) => {
      // Implementation for auto-compression rules
    },

    createCompressionPipeline: (steps: any[]) => {
      const id = `pipeline_${Date.now()}`;
      // Implementation for compression pipeline
      return id;
    },

    enableProgressiveLoading: async (assetIds: string[]) => {
      for (const assetId of assetIds) {
        const asset = get().assets.find(a => a.id === assetId);
        if (asset) {
          const progressiveSettings: CompressionSettings = {
            ...asset.settings,
            progressive: true
          };
          await get().actions.recompressAsset(assetId, progressiveSettings);
        }
      }
    },

    optimizeForCDN: async (assetIds: string[]) => {
      // CDN optimization logic
      for (const assetId of assetIds) {
        await get().actions.autoOptimize(assetId);
      }
    }
  },

  // System Operations
  system: {
    initialize: async () => {
      set(state => ({ ...state, isInitialized: true, lastUpdated: Date.now() }));
    },

    cleanup: () => {
      set(state => ({
        assets: state.assets.filter(a => a.status !== 'completed'),
        events: state.events.slice(-50), // Keep last 50 events
        debugLogs: state.debugLogs.slice(-100), // Keep last 100 logs
        lastUpdated: Date.now()
      }));
    },

    clearCache: () => {
      // Clear compression cache
    },

    exportAssets: async (assetIds: string[]) => {
      // Create a blob with compressed assets
      const assets = get().assets.filter(a => assetIds.includes(a.id));
      const data = JSON.stringify(assets);
      return new Blob([data], { type: 'application/json' });
    },

    importAssets: async (files: FileList) => {
      const assetIds: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = get().utils.validateAsset(file);
        
        if (validation.isValid) {
          const assetId = await get().actions.addAsset(file);
          assetIds.push(assetId);
        }
      }
      
      return assetIds;
    },

    getSystemInfo: () => {
      return {
        version: '1.0.0',
        supportedFormats: ['jpeg', 'png', 'webp', 'avif', 'mp4', 'mp3'],
        maxFileSize: get().config.maxFileSize,
        maxConcurrentJobs: get().config.maxConcurrentJobs,
        isCloudEnabled: get().config.enableCloudProcessing
      };
    }
  },

  // Debug
  debug: {
    enableDebugMode: () => {
    },

    disableDebugMode: () => {
    },

    getDebugInfo: () => {
      const state = get();
      return {
        storeState: {
          assetsCount: state.assets.length,
          profilesCount: state.profiles.length,
          batchesCount: state.batches.length,
          isProcessing: state.isProcessing,
          isInitialized: state.isInitialized
        },
        performance: {
          lastUpdated: state.lastUpdated,
          memoryUsage: (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit
          } : null
        }
      };
    },

    exportLogs: () => {
      const logs = get().debugLogs;
      return JSON.stringify(logs, null, 2);
    },

    clearLogs: () => {
      set(state => ({
        debugLogs: [],
        lastUpdated: Date.now()
      }));
    }
  },

  // Computed Values
  computed: {
    get totalAssets() {
      return get().assets.length;
    },

    get activeCompressions() {
      return get().assets.filter(a => a.status === 'compressing').length;
    },

    get totalSavings() {
      return get().assets.reduce((sum, asset) => 
        sum + (asset.originalSize - asset.compressedSize), 0
      );
    },

    get averageCompressionRatio() {
      const completedAssets = get().assets.filter(a => a.status === 'completed');
      if (completedAssets.length === 0) return 0;
      
      return completedAssets.reduce((sum, asset) => sum + asset.compressionRatio, 0) / completedAssets.length;
    },

    get systemHealth() {
      const state = get();
      const failedAssets = state.assets.filter(a => a.status === 'failed').length;
      const totalAssets = state.assets.length;
      
      return totalAssets === 0 || (failedAssets / totalAssets) < 0.1;
    },

    get queueLength() {
      return get().assets.filter(a => a.status === 'pending').length;
    },

    get processingSpeed() {
      const completedAssets = get().assets.filter(a => a.status === 'completed' && a.duration);
      if (completedAssets.length === 0) return 0;
      
      const totalTime = completedAssets.reduce((sum, asset) => sum + (asset.duration || 0), 0);
      return completedAssets.length / (totalTime / 1000 / 60); // assets per minute
    },

    get estimatedTimeRemaining() {
      const queueLength = get().computed.queueLength;
      const processingSpeed = get().computed.processingSpeed;
      
      if (processingSpeed === 0) return 0;
      return (queueLength / processingSpeed) * 60 * 1000; // milliseconds
    }
  }
}));

// Asset Compression Manager Class
export class AssetCompressionManager {
  private static instance: AssetCompressionManager;
  
  private constructor() {}
  
  public static getInstance(): AssetCompressionManager {
    if (!AssetCompressionManager.instance) {
      AssetCompressionManager.instance = new AssetCompressionManager();
    }
    return AssetCompressionManager.instance;
  }
  
  public async initialize() {
    const store = useAssetCompressionStore.getState();
    await store.system.initialize();
  }
  
  public getStore() {
    return useAssetCompressionStore;
  }
}

// Global instance
export const assetCompressionManager = AssetCompressionManager.getInstance();

// Utility Functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const getCompressionRatioColor = (ratio: number): string => {
  if (ratio >= 0.7) return 'text-green-600';
  if (ratio >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
};

export const getAssetStatusColor = (status: CompressionAsset['status']): string => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'compressing': return 'text-blue-600';
    case 'failed': return 'text-red-600';
    case 'optimized': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

export const getAssetTypeIcon = (type: CompressionAsset['type']): string => {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    case 'archive': return '📦';
    case 'code': return '💻';
    default: return '📁';
  }
};

export const getOptimizationPriorityColor = (priority: CompressionOptimization['priority']): string => {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};