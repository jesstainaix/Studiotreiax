import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { FileText, Image, Video, Music, Archive, Zap, TrendingDown, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Interfaces
export interface CompressionProfile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive';
  quality: number; // 0-100
  algorithm: string;
  settings: Record<string, any>;
  targetReduction: number; // percentage
  preserveMetadata: boolean;
  lossless: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompressionTask {
  id: string;
  fileName: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  profileId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  metadata: {
    mimeType: string;
    dimensions?: { width: number; height: number };
    duration?: number;
    bitrate?: number;
    colorSpace?: string;
    format: string;
  };
  optimizations: {
    qualityReduction: number;
    sizeReduction: number;
    timeReduction: number;
    algorithmUsed: string;
  };
}

export interface CompressionStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  totalTimeSaved: number;
  totalSpaceSaved: number;
  processingTime: number;
  throughput: number; // MB/s
}

export interface CompressionConfig {
  maxConcurrentTasks: number;
  autoOptimize: boolean;
  realTimeProcessing: boolean;
  qualityThreshold: number;
  sizeThreshold: number; // MB
  enablePreview: boolean;
  backupOriginals: boolean;
  compressionLevel: 'fast' | 'balanced' | 'maximum';
  adaptiveQuality: boolean;
  batchSize: number;
  retryAttempts: number;
  timeout: number; // seconds
}

export interface CompressionEvent {
  id: string;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'profile_created' | 'batch_completed' | 'optimization_applied';
  timestamp: Date;
  data: any;
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

// Store State
interface CompressionState {
  // Core State
  profiles: CompressionProfile[];
  tasks: CompressionTask[];
  stats: CompressionStats;
  config: CompressionConfig;
  events: CompressionEvent[];
  
  // UI State
  isProcessing: boolean;
  selectedProfile: string | null;
  selectedTask: string | null;
  searchQuery: string;
  filterStatus: string;
  filterType: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Real-time State
  activeConnections: number;
  processingQueue: string[];
  systemLoad: number;
  memoryUsage: number;
  
  // Error State
  error: string | null;
  lastError: Date | null;
}

// Store Actions
interface CompressionActions {
  // Profile Management
  createProfile: (profile: Omit<CompressionProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProfile: (id: string, updates: Partial<CompressionProfile>) => void;
  deleteProfile: (id: string) => void;
  duplicateProfile: (id: string) => void;
  
  // Task Management
  addTask: (task: Omit<CompressionTask, 'id' | 'status' | 'progress' | 'startTime'>) => void;
  updateTask: (id: string, updates: Partial<CompressionTask>) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  clearCompletedTasks: () => void;
  
  // Compression Operations
  startCompression: (taskId: string) => Promise<void>;
  pauseCompression: (taskId: string) => void;
  resumeCompression: (taskId: string) => void;
  batchCompress: (taskIds: string[]) => Promise<void>;
  
  // Analytics & Monitoring
  updateStats: () => void;
  generateReport: (period: 'day' | 'week' | 'month') => any;
  exportStats: (format: 'json' | 'csv' | 'pdf') => void;
  
  // Configuration
  updateConfig: (updates: Partial<CompressionConfig>) => void;
  resetConfig: () => void;
  importConfig: (config: CompressionConfig) => void;
  exportConfig: () => CompressionConfig;
  
  // Search & Filter
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterType: (type: string) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // Real-time Processing
  startRealTimeProcessing: () => void;
  stopRealTimeProcessing: () => void;
  updateSystemMetrics: () => void;
  
  // Quick Actions
  quickCompress: (files: File[], profileId?: string) => Promise<void>;
  autoOptimize: (taskId: string) => Promise<void>;
  previewCompression: (taskId: string) => Promise<any>;
  
  // Advanced Features
  enableAdaptiveQuality: () => void;
  disableAdaptiveQuality: () => void;
  optimizeForDevice: (deviceType: 'mobile' | 'tablet' | 'desktop') => void;
  scheduleCompression: (taskId: string, scheduledTime: Date) => void;
  
  // System Operations
  clearCache: () => void;
  resetSystem: () => void;
  exportLogs: () => void;
  importProfiles: (profiles: CompressionProfile[]) => void;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  addEvent: (event: Omit<CompressionEvent, 'id' | 'timestamp'>) => void;
}

// Default Configuration
const defaultConfig: CompressionConfig = {
  maxConcurrentTasks: 4,
  autoOptimize: true,
  realTimeProcessing: false,
  qualityThreshold: 85,
  sizeThreshold: 10,
  enablePreview: true,
  backupOriginals: true,
  compressionLevel: 'balanced',
  adaptiveQuality: true,
  batchSize: 10,
  retryAttempts: 3,
  timeout: 300
};

// Default Stats
const defaultStats: CompressionStats = {
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  totalOriginalSize: 0,
  totalCompressedSize: 0,
  averageCompressionRatio: 0,
  totalTimeSaved: 0,
  totalSpaceSaved: 0,
  processingTime: 0,
  throughput: 0
};

// Zustand Store
export const useCompressionStore = create<CompressionState & CompressionActions>()
  subscribeWithSelector((set, get) => ({
    // Initial State
    profiles: [],
    tasks: [],
    stats: defaultStats,
    config: defaultConfig,
    events: [],
    isProcessing: false,
    selectedProfile: null,
    selectedTask: null,
    searchQuery: '',
    filterStatus: 'all',
    filterType: 'all',
    sortBy: 'startTime',
    sortOrder: 'desc',
    activeConnections: 0,
    processingQueue: [],
    systemLoad: 0,
    memoryUsage: 0,
    error: null,
    lastError: null,

    // Profile Management
    createProfile: (profileData) => {
      const profile: CompressionProfile = {
        ...profileData,
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set((state) => ({
        profiles: [...state.profiles, profile]
      }));
      
      get().addEvent({
        type: 'profile_created',
        data: { profileId: profile.id, name: profile.name },
        severity: 'success',
        message: `Perfil de compressão '${profile.name}' criado com sucesso`
      });
    },

    updateProfile: (id, updates) => {
      set((state) => ({
        profiles: state.profiles.map(profile =>
          profile.id === id
            ? { ...profile, ...updates, updatedAt: new Date() }
            : profile
        )
      }));
    },

    deleteProfile: (id) => {
      set((state) => ({
        profiles: state.profiles.filter(profile => profile.id !== id),
        selectedProfile: state.selectedProfile === id ? null : state.selectedProfile
      }));
    },

    duplicateProfile: (id) => {
      const profile = get().profiles.find(p => p.id === id);
      if (profile) {
        get().createProfile({
          ...profile,
          name: `${profile.name} (Cópia)`
        });
      }
    },

    // Task Management
    addTask: (taskData) => {
      const task: CompressionTask = {
        ...taskData,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        progress: 0,
        startTime: new Date()
      };
      
      set((state) => ({
        tasks: [...state.tasks, task]
      }));
      
      get().updateStats();
    },

    updateTask: (id, updates) => {
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        )
      }));
      
      get().updateStats();
    },

    cancelTask: (id) => {
      get().updateTask(id, {
        status: 'cancelled',
        endTime: new Date()
      });
    },

    retryTask: (id) => {
      get().updateTask(id, {
        status: 'pending',
        progress: 0,
        error: undefined,
        startTime: new Date(),
        endTime: undefined
      });
    },

    clearCompletedTasks: () => {
      set((state) => ({
        tasks: state.tasks.filter(task => 
          !['completed', 'failed', 'cancelled'].includes(task.status)
        )
      }));
    },

    // Compression Operations
    startCompression: async (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;
      
      get().updateTask(taskId, {
        status: 'processing',
        startTime: new Date()
      });
      
      set((state) => ({
        isProcessing: true,
        processingQueue: [...state.processingQueue, taskId]
      }));
      
      try {
        // Simulate compression process
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          get().updateTask(taskId, { progress });
        }
        
        const compressionRatio = 0.3 + Math.random() * 0.4; // 30-70% compression
        const compressedSize = Math.floor(task.originalSize * compressionRatio);
        
        get().updateTask(taskId, {
          status: 'completed',
          progress: 100,
          compressedSize,
          compressionRatio: (1 - compressionRatio) * 100,
          endTime: new Date(),
          duration: Date.now() - task.startTime.getTime()
        });
        
        get().addEvent({
          type: 'task_completed',
          data: { taskId, compressionRatio },
          severity: 'success',
          message: `Compressão concluída: ${(compressionRatio * 100).toFixed(1)}% de redução`
        });
        
      } catch (error) {
        get().updateTask(taskId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          endTime: new Date()
        });
        
        get().addEvent({
          type: 'task_failed',
          data: { taskId, error },
          severity: 'error',
          message: `Falha na compressão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      } finally {
        set((state) => ({
          processingQueue: state.processingQueue.filter(id => id !== taskId),
          isProcessing: state.processingQueue.length > 1
        }));
      }
    },

    pauseCompression: (taskId) => {
      get().updateTask(taskId, { status: 'pending' });
    },

    resumeCompression: (taskId) => {
      get().startCompression(taskId);
    },

    batchCompress: async (taskIds) => {
      const { config } = get();
      const batches = [];
      
      for (let i = 0; i < taskIds.length; i += config.batchSize) {
        batches.push(taskIds.slice(i, i + config.batchSize));
      }
      
      for (const batch of batches) {
        await Promise.all(
          batch.slice(0, config.maxConcurrentTasks).map(taskId => 
            get().startCompression(taskId)
          )
        );
      }
      
      get().addEvent({
        type: 'batch_completed',
        data: { taskCount: taskIds.length },
        severity: 'success',
        message: `Lote de ${taskIds.length} tarefas processado com sucesso`
      });
    },

    // Analytics & Monitoring
    updateStats: () => {
      const { tasks } = get();
      const completed = tasks.filter(t => t.status === 'completed');
      const failed = tasks.filter(t => t.status === 'failed');
      
      const totalOriginalSize = tasks.reduce((sum, task) => sum + task.originalSize, 0);
      const totalCompressedSize = completed.reduce((sum, task) => sum + (task.compressedSize || 0), 0);
      const totalProcessingTime = completed.reduce((sum, task) => sum + (task.duration || 0), 0);
      
      const stats: CompressionStats = {
        totalTasks: tasks.length,
        completedTasks: completed.length,
        failedTasks: failed.length,
        totalOriginalSize,
        totalCompressedSize,
        averageCompressionRatio: completed.length > 0 
          ? completed.reduce((sum, task) => sum + (task.compressionRatio || 0), 0) / completed.length
          : 0,
        totalTimeSaved: totalProcessingTime,
        totalSpaceSaved: totalOriginalSize - totalCompressedSize,
        processingTime: totalProcessingTime,
        throughput: totalProcessingTime > 0 ? (totalOriginalSize / 1024 / 1024) / (totalProcessingTime / 1000) : 0
      };
      
      set({ stats });
    },

    generateReport: (period) => {
      const { tasks, stats } = get();
      const now = new Date();
      const periodStart = new Date();
      
      switch (period) {
        case 'day':
          periodStart.setDate(now.getDate() - 1);
          break;
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
      }
      
      const periodTasks = tasks.filter(task => task.startTime >= periodStart);
      
      return {
        period,
        periodStart,
        periodEnd: now,
        tasks: periodTasks,
        summary: {
          totalTasks: periodTasks.length,
          completedTasks: periodTasks.filter(t => t.status === 'completed').length,
          totalSavings: periodTasks.reduce((sum, task) => 
            sum + (task.originalSize - (task.compressedSize || task.originalSize)), 0
          ),
          averageCompressionTime: periodTasks.length > 0 
            ? periodTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / periodTasks.length
            : 0
        },
        stats
      };
    },

    exportStats: (format) => {
      const { stats, tasks } = get();
      const data = { stats, tasks };
      
      switch (format) {
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `compression-stats-${new Date().toISOString().split('T')[0]}.json`;
          jsonLink.click();
          break;
        case 'csv':
          const csvData = tasks.map(task => ({
            fileName: task.fileName,
            originalSize: task.originalSize,
            compressedSize: task.compressedSize || 0,
            compressionRatio: task.compressionRatio || 0,
            status: task.status,
            duration: task.duration || 0
          }));
          const csvContent = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n');
          const csvBlob = new Blob([csvContent], { type: 'text/csv' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = `compression-stats-${new Date().toISOString().split('T')[0]}.csv`;
          csvLink.click();
          break;
      }
    },

    // Configuration
    updateConfig: (updates) => {
      set((state) => ({
        config: { ...state.config, ...updates }
      }));
    },

    resetConfig: () => {
      set({ config: defaultConfig });
    },

    importConfig: (config) => {
      set({ config });
    },

    exportConfig: () => {
      return get().config;
    },

    // Search & Filter
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterStatus: (status) => set({ filterStatus: status }),
    setFilterType: (type) => set({ filterType: type }),
    setSortBy: (field) => set({ sortBy: field }),
    setSortOrder: (order) => set({ sortOrder: order }),
    clearFilters: () => set({
      searchQuery: '',
      filterStatus: 'all',
      filterType: 'all',
      sortBy: 'startTime',
      sortOrder: 'desc'
    }),

    // Real-time Processing
    startRealTimeProcessing: () => {
      set((state) => ({
        config: { ...state.config, realTimeProcessing: true }
      }));
    },

    stopRealTimeProcessing: () => {
      set((state) => ({
        config: { ...state.config, realTimeProcessing: false }
      }));
    },

    updateSystemMetrics: () => {
      set({
        systemLoad: Math.random() * 100,
        memoryUsage: 40 + Math.random() * 40,
        activeConnections: Math.floor(Math.random() * 10)
      });
    },

    // Quick Actions
    quickCompress: async (files, profileId) => {
      const profile = profileId ? get().profiles.find(p => p.id === profileId) : get().profiles[0];
      if (!profile) return;
      
      for (const file of files) {
        get().addTask({
          fileName: file.name,
          originalSize: file.size,
          profileId: profile.id,
          metadata: {
            mimeType: file.type,
            format: file.name.split('.').pop() || 'unknown'
          },
          optimizations: {
            qualityReduction: 0,
            sizeReduction: 0,
            timeReduction: 0,
            algorithmUsed: profile.algorithm
          }
        });
      }
    },

    autoOptimize: async (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Auto-select best profile based on file type and size
      const profiles = get().profiles.filter(p => p.type === task.metadata.format);
      const bestProfile = profiles.reduce((best, current) => 
        current.targetReduction > best.targetReduction ? current : best
      );
      
      if (bestProfile) {
        get().updateTask(taskId, { profileId: bestProfile.id });
        await get().startCompression(taskId);
      }
    },

    previewCompression: async (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return null;
      
      const profile = get().profiles.find(p => p.id === task.profileId);
      if (!profile) return null;
      
      return {
        estimatedSize: Math.floor(task.originalSize * (1 - profile.targetReduction / 100)),
        estimatedRatio: profile.targetReduction,
        estimatedTime: Math.floor(task.originalSize / 1024 / 1024 * 2), // 2 seconds per MB
        quality: profile.quality,
        algorithm: profile.algorithm
      };
    },

    // Advanced Features
    enableAdaptiveQuality: () => {
      set((state) => ({
        config: { ...state.config, adaptiveQuality: true }
      }));
    },

    disableAdaptiveQuality: () => {
      set((state) => ({
        config: { ...state.config, adaptiveQuality: false }
      }));
    },

    optimizeForDevice: (deviceType) => {
      const deviceConfigs = {
        mobile: { qualityThreshold: 70, compressionLevel: 'maximum' as const },
        tablet: { qualityThreshold: 80, compressionLevel: 'balanced' as const },
        desktop: { qualityThreshold: 90, compressionLevel: 'fast' as const }
      };
      
      get().updateConfig(deviceConfigs[deviceType]);
    },

    scheduleCompression: (taskId, scheduledTime) => {
      // Implementation for scheduled compression
      setTimeout(() => {
        get().startCompression(taskId);
      }, scheduledTime.getTime() - Date.now());
    },

    // System Operations
    clearCache: () => {
      // Clear compression cache
      get().addEvent({
        type: 'optimization_applied',
        data: { operation: 'cache_cleared' },
        severity: 'info',
        message: 'Cache do sistema limpo com sucesso'
      })
    },

    resetSystem: () => {
      set({
        tasks: [],
        events: [],
        stats: defaultStats,
        config: defaultConfig,
        isProcessing: false,
        processingQueue: [],
        error: null
      });
    },

    exportLogs: () => {
      const { events } = get();
      const logData = events.map(event => ({
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        severity: event.severity,
        message: event.message,
        data: JSON.stringify(event.data)
      }));
      
      const csvContent = [
        Object.keys(logData[0] || {}).join(','),
        ...logData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compression-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    },

    importProfiles: (profiles) => {
      set((state) => ({
        profiles: [...state.profiles, ...profiles]
      }));
    },

    // Error Handling
    setError: (error) => {
      set({ error, lastError: error ? new Date() : null });
    },

    clearError: () => {
      set({ error: null });
    },

    addEvent: (eventData) => {
      const event: CompressionEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      
      set((state) => ({
        events: [event, ...state.events].slice(0, 1000) // Keep last 1000 events
      }));
    }
  }))

// Manager Class
export class IntelligentCompressionManager {
  private store = useCompressionStore;
  
  constructor() {
    this.initializeDefaultProfiles();
    this.startSystemMonitoring();
  }
  
  private initializeDefaultProfiles() {
    const defaultProfiles: Omit<CompressionProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Imagem Web Otimizada',
        type: 'image',
        quality: 85,
        algorithm: 'webp',
        settings: { progressive: true, optimize: true },
        targetReduction: 60,
        preserveMetadata: false,
        lossless: false
      },
      {
        name: 'Vídeo Streaming',
        type: 'video',
        quality: 80,
        algorithm: 'h264',
        settings: { crf: 23, preset: 'medium' },
        targetReduction: 70,
        preserveMetadata: true,
        lossless: false
      },
      {
        name: 'Áudio Podcast',
        type: 'audio',
        quality: 90,
        algorithm: 'aac',
        settings: { bitrate: 128, channels: 2 },
        targetReduction: 50,
        preserveMetadata: true,
        lossless: false
      },
      {
        name: 'Documento PDF',
        type: 'document',
        quality: 95,
        algorithm: 'deflate',
        settings: { imageQuality: 85, removeMetadata: false },
        targetReduction: 30,
        preserveMetadata: true,
        lossless: true
      },
      {
        name: 'Arquivo Compacto',
        type: 'archive',
        quality: 100,
        algorithm: 'lzma',
        settings: { compressionLevel: 6, solidMode: true },
        targetReduction: 80,
        preserveMetadata: true,
        lossless: true
      }
    ];
    
    defaultProfiles.forEach(profile => {
      this.store.getState().createProfile(profile);
    });
  }
  
  private startSystemMonitoring() {
    setInterval(() => {
      this.store.getState().updateSystemMetrics();
    }, 5000);
  }
  
  // Public API
  getStore() {
    return this.store;
  }
  
  async compressFile(file: File, profileId?: string): Promise<CompressionTask> {
    const { addTask, startCompression, profiles } = this.store.getState();
    
    const profile = profileId 
      ? profiles.find(p => p.id === profileId)
      : profiles.find(p => p.type === this.detectFileType(file.type));
    
    if (!profile) {
      throw new Error('Nenhum perfil de compressão encontrado para este tipo de arquivo');
    }
    
    const taskData = {
      fileName: file.name,
      originalSize: file.size,
      profileId: profile.id,
      metadata: {
        mimeType: file.type,
        format: file.name.split('.').pop() || 'unknown'
      },
      optimizations: {
        qualityReduction: 0,
        sizeReduction: 0,
        timeReduction: 0,
        algorithmUsed: profile.algorithm
      }
    };
    
    addTask(taskData);
    const tasks = this.store.getState().tasks;
    const newTask = tasks[tasks.length - 1];
    
    await startCompression(newTask.id);
    return newTask;
  }
  
  private detectFileType(mimeType: string): CompressionProfile['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'archive';
  }
}

// Global Instance
export const compressionManager = new IntelligentCompressionManager();

// Utility Functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getCompressionRatioColor = (ratio: number): string => {
  if (ratio >= 70) return 'text-green-600';
  if (ratio >= 50) return 'text-yellow-600';
  if (ratio >= 30) return 'text-orange-600';
  return 'text-red-600';
};

export const getFileTypeIcon = (type: string) => {
  switch (type) {
    case 'image': return Image;
    case 'video': return Video;
    case 'audio': return Music;
    case 'document': return FileText;
    case 'archive': return Archive;
    default: return FileText;
  }
};

export const getStatusIcon = (status: CompressionTask['status']) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'processing': return Zap;
    case 'failed': return XCircle;
    case 'cancelled': return AlertTriangle;
    default: return Clock;
  }
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
};

export const calculateSavings = (originalSize: number, compressedSize: number): { bytes: number; percentage: number } => {
  const bytes = originalSize - compressedSize;
  const percentage = (bytes / originalSize) * 100;
  return { bytes, percentage };
};
