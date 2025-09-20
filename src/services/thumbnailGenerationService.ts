import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface ThumbnailTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  category: 'youtube' | 'instagram' | 'facebook' | 'twitter' | 'custom';
  elements: ThumbnailElement[];
  style: ThumbnailStyle;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThumbnailElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'icon' | 'gradient';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
  properties: Record<string, any>;
  animations?: ThumbnailAnimation[];
}

export interface ThumbnailStyle {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  borderRadius: number;
  shadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offset: { x: number; y: number };
  };
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  };
}

export interface ThumbnailAnimation {
  id: string;
  type: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
  easing: string;
  loop: boolean;
}

export interface GeneratedThumbnail {
  id: string;
  templateId: string;
  title: string;
  description: string;
  imageUrl: string;
  previewUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    quality: number;
  };
  analytics: {
    clickThroughRate: number;
    impressions: number;
    engagement: number;
    score: number;
  };
  aiAnalysis: {
    visualAppeal: number;
    textReadability: number;
    colorHarmony: number;
    composition: number;
    brandConsistency: number;
    suggestions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ThumbnailGenerationConfig {
  autoGeneration: boolean;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat: 'jpg' | 'png' | 'webp';
  compression: number;
  aiOptimization: boolean;
  brandConsistency: boolean;
  a11yCompliance: boolean;
  batchSize: number;
  maxFileSize: number;
  watermark: {
    enabled: boolean;
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
  };
}

export interface ThumbnailGenerationStats {
  totalGenerated: number;
  successRate: number;
  averageGenerationTime: number;
  averageFileSize: number;
  topPerformingTemplates: string[];
  qualityDistribution: Record<string, number>;
  formatDistribution: Record<string, number>;
  errorRate: number;
  optimizationSavings: number;
}

export interface ThumbnailGenerationEvent {
  id: string;
  type: 'generation_started' | 'generation_completed' | 'generation_failed' | 'template_created' | 'optimization_applied';
  timestamp: Date;
  data: Record<string, any>;
  userId?: string;
  sessionId: string;
}

// Store State
interface ThumbnailGenerationState {
  // Core State
  templates: ThumbnailTemplate[];
  generatedThumbnails: GeneratedThumbnail[];
  config: ThumbnailGenerationConfig;
  stats: ThumbnailGenerationStats;
  events: ThumbnailGenerationEvent[];
  
  // UI State
  isGenerating: boolean;
  isOptimizing: boolean;
  selectedTemplate: ThumbnailTemplate | null;
  selectedThumbnail: GeneratedThumbnail | null;
  generationProgress: number;
  error: string | null;
  
  // Filters and Search
  searchQuery: string;
  categoryFilter: string;
  qualityFilter: string;
  sortBy: 'name' | 'createdAt' | 'performance' | 'size';
  sortOrder: 'asc' | 'desc';
  
  // Real-time
  isRealTimeEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastSync: Date | null;
}

// Store Actions
interface ThumbnailGenerationActions {
  // Template Management
  createTemplate: (template: Omit<ThumbnailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<ThumbnailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;
  
  // Thumbnail Generation
  generateThumbnail: (templateId: string, options?: Partial<ThumbnailGenerationConfig>) => Promise<GeneratedThumbnail>;
  generateBatch: (templateIds: string[], options?: Partial<ThumbnailGenerationConfig>) => Promise<GeneratedThumbnail[]>;
  regenerateThumbnail: (id: string) => Promise<GeneratedThumbnail>;
  optimizeThumbnail: (id: string) => Promise<GeneratedThumbnail>;
  
  // AI Features
  analyzePerformance: (id: string) => Promise<void>;
  getSuggestions: (templateId: string) => Promise<string[]>;
  autoOptimize: (id: string) => Promise<GeneratedThumbnail>;
  generateVariations: (templateId: string, count: number) => Promise<GeneratedThumbnail[]>;
  
  // Configuration
  updateConfig: (updates: Partial<ThumbnailGenerationConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (config: string) => Promise<void>;
  
  // Analytics
  getStats: () => Promise<ThumbnailGenerationStats>;
  getPerformanceReport: (period: 'day' | 'week' | 'month') => Promise<any>;
  trackEvent: (event: Omit<ThumbnailGenerationEvent, 'id' | 'timestamp'>) => void;
  
  // Search and Filter
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setQualityFilter: (quality: string) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // Real-time
  enableRealTime: () => Promise<void>;
  disableRealTime: () => void;
  syncData: () => Promise<void>;
  
  // Quick Actions
  quickGenerate: (type: 'youtube' | 'instagram' | 'facebook') => Promise<GeneratedThumbnail>;
  bulkOptimize: (ids: string[]) => Promise<void>;
  exportThumbnails: (ids: string[], format: 'zip' | 'pdf') => Promise<string>;
  
  // Advanced Features
  createSmartTemplate: (description: string) => Promise<ThumbnailTemplate>;
  generateFromVideo: (videoUrl: string, timestamps: number[]) => Promise<GeneratedThumbnail[]>;
  applyBrandGuidelines: (templateId: string) => Promise<void>;
  
  // System Operations
  healthCheck: () => Promise<boolean>;
  clearCache: () => Promise<void>;
  maintenance: () => Promise<void>;
  reset: () => Promise<void>;
  
  // Utilities
  validateTemplate: (template: ThumbnailTemplate) => boolean;
  previewTemplate: (template: ThumbnailTemplate) => string;
  calculateOptimization: (thumbnail: GeneratedThumbnail) => number;
}

// Computed Values
interface ThumbnailGenerationComputed {
  filteredTemplates: ThumbnailTemplate[];
  filteredThumbnails: GeneratedThumbnail[];
  totalTemplates: number;
  totalThumbnails: number;
  averageQuality: number;
  isHealthy: boolean;
  canGenerate: boolean;
  recentEvents: ThumbnailGenerationEvent[];
}

// Create Store
export const useThumbnailGenerationStore = create<
  ThumbnailGenerationState & ThumbnailGenerationActions & ThumbnailGenerationComputed
>(
  subscribeWithSelector((set, get) => ({
    // Initial State
    templates: [],
    generatedThumbnails: [],
    config: {
      autoGeneration: true,
      qualityLevel: 'high',
      outputFormat: 'webp',
      compression: 0.8,
      aiOptimization: true,
      brandConsistency: true,
      a11yCompliance: true,
      batchSize: 10,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      watermark: {
        enabled: false,
        text: '',
        position: 'bottom-right',
        opacity: 0.5
      }
    },
    stats: {
      totalGenerated: 0,
      successRate: 0,
      averageGenerationTime: 0,
      averageFileSize: 0,
      topPerformingTemplates: [],
      qualityDistribution: {},
      formatDistribution: {},
      errorRate: 0,
      optimizationSavings: 0
    },
    events: [],
    isGenerating: false,
    isOptimizing: false,
    selectedTemplate: null,
    selectedThumbnail: null,
    generationProgress: 0,
    error: null,
    searchQuery: '',
    categoryFilter: '',
    qualityFilter: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isRealTimeEnabled: false,
    connectionStatus: 'disconnected',
    lastSync: null,

    // Template Management
    createTemplate: async (template) => {
      const newTemplate: ThumbnailTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set((state) => ({
        templates: [...state.templates, newTemplate]
      }));
      
      get().trackEvent({
        type: 'template_created',
        data: { templateId: newTemplate.id, name: newTemplate.name },
        sessionId: 'current'
      });
    },

    updateTemplate: async (id, updates) => {
      set((state) => ({
        templates: state.templates.map(template =>
          template.id === id
            ? { ...template, ...updates, updatedAt: new Date() }
            : template
        )
      }));
    },

    deleteTemplate: async (id) => {
      set((state) => ({
        templates: state.templates.filter(template => template.id !== id)
      }));
    },

    duplicateTemplate: async (id) => {
      const template = get().templates.find(t => t.id === id);
      if (template) {
        await get().createTemplate({
          ...template,
          name: `${template.name} (Copy)`
        });
      }
    },

    // Thumbnail Generation
    generateThumbnail: async (templateId, options = {}) => {
      set({ isGenerating: true, generationProgress: 0, error: null });
      
      try {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) throw new Error('Template not found');
        
        // Simulate generation process
        for (let i = 0; i <= 100; i += 10) {
          set({ generationProgress: i });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const thumbnail: GeneratedThumbnail = {
          id: `thumbnail_${Date.now()}`,
          templateId,
          title: `Generated from ${template.name}`,
          description: 'AI-generated thumbnail',
          imageUrl: `https://picsum.photos/${template.width}/${template.height}?random=${Date.now()}`,
          previewUrl: `https://picsum.photos/${Math.floor(template.width/2)}/${Math.floor(template.height/2)}?random=${Date.now()}`,
          metadata: {
            width: template.width,
            height: template.height,
            format: get().config.outputFormat,
            size: Math.floor(Math.random() * 500000) + 100000,
            quality: get().config.qualityLevel === 'ultra' ? 95 : get().config.qualityLevel === 'high' ? 85 : 75
          },
          analytics: {
            clickThroughRate: Math.random() * 10,
            impressions: Math.floor(Math.random() * 10000),
            engagement: Math.random() * 100,
            score: Math.random() * 100
          },
          aiAnalysis: {
            visualAppeal: Math.random() * 100,
            textReadability: Math.random() * 100,
            colorHarmony: Math.random() * 100,
            composition: Math.random() * 100,
            brandConsistency: Math.random() * 100,
            suggestions: [
              'Consider increasing contrast for better readability',
              'Add more visual hierarchy with size variations',
              'Use complementary colors for better appeal'
            ]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          generatedThumbnails: [...state.generatedThumbnails, thumbnail],
          isGenerating: false,
          generationProgress: 100
        }));
        
        get().trackEvent({
          type: 'generation_completed',
          data: { thumbnailId: thumbnail.id, templateId },
          sessionId: 'current'
        });
        
        return thumbnail;
      } catch (error) {
        set({ isGenerating: false, error: (error as Error).message });
        get().trackEvent({
          type: 'generation_failed',
          data: { templateId, error: (error as Error).message },
          sessionId: 'current'
        });
        throw error;
      }
    },

    generateBatch: async (templateIds, options = {}) => {
      const results: GeneratedThumbnail[] = [];
      
      for (const templateId of templateIds) {
        try {
          const thumbnail = await get().generateThumbnail(templateId, options);
          results.push(thumbnail);
        } catch (error) {
          console.error(`Failed to generate thumbnail for template ${templateId}:`, error);
        }
      }
      
      return results;
    },

    regenerateThumbnail: async (id) => {
      const thumbnail = get().generatedThumbnails.find(t => t.id === id);
      if (thumbnail) {
        return await get().generateThumbnail(thumbnail.templateId);
      }
      throw new Error('Thumbnail not found');
    },

    optimizeThumbnail: async (id) => {
      set({ isOptimizing: true });
      
      try {
        const thumbnail = get().generatedThumbnails.find(t => t.id === id);
        if (!thumbnail) throw new Error('Thumbnail not found');
        
        // Simulate optimization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const optimizedThumbnail: GeneratedThumbnail = {
          ...thumbnail,
          metadata: {
            ...thumbnail.metadata,
            size: Math.floor(thumbnail.metadata.size * 0.7), // 30% size reduction
            quality: Math.min(thumbnail.metadata.quality + 5, 100)
          },
          aiAnalysis: {
            ...thumbnail.aiAnalysis,
            visualAppeal: Math.min(thumbnail.aiAnalysis.visualAppeal + 10, 100),
            colorHarmony: Math.min(thumbnail.aiAnalysis.colorHarmony + 5, 100)
          },
          updatedAt: new Date()
        };
        
        set((state) => ({
          generatedThumbnails: state.generatedThumbnails.map(t =>
            t.id === id ? optimizedThumbnail : t
          ),
          isOptimizing: false
        }));
        
        get().trackEvent({
          type: 'optimization_applied',
          data: { thumbnailId: id },
          sessionId: 'current'
        });
        
        return optimizedThumbnail;
      } catch (error) {
        set({ isOptimizing: false, error: (error as Error).message });
        throw error;
      }
    },

    // AI Features
    analyzePerformance: async (id) => {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
    },

    getSuggestions: async (templateId) => {
      // Simulate AI suggestions
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        'Try using warmer colors for better engagement',
        'Consider adding a call-to-action element',
        'Increase font size for better mobile readability'
      ];
    },

    autoOptimize: async (id) => {
      return await get().optimizeThumbnail(id);
    },

    generateVariations: async (templateId, count) => {
      const variations: GeneratedThumbnail[] = [];
      
      for (let i = 0; i < count; i++) {
        const thumbnail = await get().generateThumbnail(templateId);
        variations.push(thumbnail);
      }
      
      return variations;
    },

    // Configuration
    updateConfig: async (updates) => {
      set((state) => ({
        config: { ...state.config, ...updates }
      }));
    },

    resetConfig: async () => {
      set({
        config: {
          autoGeneration: true,
          qualityLevel: 'high',
          outputFormat: 'webp',
          compression: 0.8,
          aiOptimization: true,
          brandConsistency: true,
          a11yCompliance: true,
          batchSize: 10,
          maxFileSize: 5 * 1024 * 1024,
          watermark: {
            enabled: false,
            text: '',
            position: 'bottom-right',
            opacity: 0.5
          }
        }
      });
    },

    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },

    importConfig: async (config) => {
      try {
        const parsedConfig = JSON.parse(config);
        await get().updateConfig(parsedConfig);
      } catch (error) {
        throw new Error('Invalid configuration format');
      }
    },

    // Analytics
    getStats: async () => {
      const state = get();
      const stats: ThumbnailGenerationStats = {
        totalGenerated: state.generatedThumbnails.length,
        successRate: 95.5,
        averageGenerationTime: 2.3,
        averageFileSize: state.generatedThumbnails.reduce((acc, t) => acc + t.metadata.size, 0) / state.generatedThumbnails.length || 0,
        topPerformingTemplates: state.templates.slice(0, 5).map(t => t.id),
        qualityDistribution: {
          low: 10,
          medium: 30,
          high: 45,
          ultra: 15
        },
        formatDistribution: {
          jpg: 20,
          png: 30,
          webp: 50
        },
        errorRate: 4.5,
        optimizationSavings: 35.2
      };
      
      set({ stats });
      return stats;
    },

    getPerformanceReport: async (period) => {
      // Simulate performance report generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        period,
        generatedCount: Math.floor(Math.random() * 1000),
        averageScore: Math.random() * 100,
        topTemplates: ['template_1', 'template_2', 'template_3']
      };
    },

    trackEvent: (event) => {
      const newEvent: ThumbnailGenerationEvent = {
        ...event,
        id: `event_${Date.now()}`,
        timestamp: new Date()
      };
      
      set((state) => ({
        events: [newEvent, ...state.events].slice(0, 1000) // Keep last 1000 events
      }));
    },

    // Search and Filter
    setSearchQuery: (query) => set({ searchQuery: query }),
    setCategoryFilter: (category) => set({ categoryFilter: category }),
    setQualityFilter: (quality) => set({ qualityFilter: quality }),
    setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
    clearFilters: () => set({
      searchQuery: '',
      categoryFilter: '',
      qualityFilter: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),

    // Real-time
    enableRealTime: async () => {
      set({ connectionStatus: 'connecting' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ isRealTimeEnabled: true, connectionStatus: 'connected' });
    },

    disableRealTime: () => {
      set({ isRealTimeEnabled: false, connectionStatus: 'disconnected' });
    },

    syncData: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ lastSync: new Date() });
    },

    // Quick Actions
    quickGenerate: async (type) => {
      const templates = get().templates.filter(t => t.category === type);
      if (templates.length === 0) {
        throw new Error(`No templates found for ${type}`);
      }
      
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      return await get().generateThumbnail(randomTemplate.id);
    },

    bulkOptimize: async (ids) => {
      for (const id of ids) {
        await get().optimizeThumbnail(id);
      }
    },

    exportThumbnails: async (ids, format) => {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `export_${Date.now()}.${format}`;
    },

    // Advanced Features
    createSmartTemplate: async (description) => {
      // Simulate AI template creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const template: Omit<ThumbnailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `AI Generated: ${description}`,
        description: `Smart template created from: ${description}`,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        category: 'custom',
        elements: [],
        style: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          shadow: {
            enabled: true,
            color: '#000000',
            blur: 10,
            offset: { x: 0, y: 4 }
          },
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0
          }
        }
      };
      
      await get().createTemplate(template);
      return get().templates[get().templates.length - 1];
    },

    generateFromVideo: async (videoUrl, timestamps) => {
      const thumbnails: GeneratedThumbnail[] = [];
      
      for (const timestamp of timestamps) {
        // Simulate video frame extraction
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const thumbnail: GeneratedThumbnail = {
          id: `video_thumbnail_${Date.now()}_${timestamp}`,
          templateId: 'video_template',
          title: `Video Frame at ${timestamp}s`,
          description: `Extracted from ${videoUrl}`,
          imageUrl: `https://picsum.photos/1920/1080?random=${Date.now()}`,
          previewUrl: `https://picsum.photos/960/540?random=${Date.now()}`,
          metadata: {
            width: 1920,
            height: 1080,
            format: 'jpg',
            size: Math.floor(Math.random() * 500000) + 200000,
            quality: 85
          },
          analytics: {
            clickThroughRate: 0,
            impressions: 0,
            engagement: 0,
            score: Math.random() * 100
          },
          aiAnalysis: {
            visualAppeal: Math.random() * 100,
            textReadability: 100,
            colorHarmony: Math.random() * 100,
            composition: Math.random() * 100,
            brandConsistency: Math.random() * 100,
            suggestions: ['Consider adding text overlay', 'Enhance colors for better appeal']
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        thumbnails.push(thumbnail);
      }
      
      set((state) => ({
        generatedThumbnails: [...state.generatedThumbnails, ...thumbnails]
      }));
      
      return thumbnails;
    },

    applyBrandGuidelines: async (templateId) => {
      // Simulate brand guidelines application
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const template = get().templates.find(t => t.id === templateId);
      if (template) {
        await get().updateTemplate(templateId, {
          style: {
            ...template.style,
            backgroundColor: '#1a365d', // Brand color
            borderRadius: 12
          }
        });
      }
    },

    // System Operations
    healthCheck: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },

    clearCache: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    },

    maintenance: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
    },

    reset: async () => {
      set({
        templates: [],
        generatedThumbnails: [],
        events: [],
        selectedTemplate: null,
        selectedThumbnail: null,
        error: null
      });
    },

    // Utilities
    validateTemplate: (template) => {
      return template.name.length > 0 && template.width > 0 && template.height > 0;
    },

    previewTemplate: (template) => {
      return `data:image/svg+xml;base64,${btoa(`<svg width="${template.width}" height="${template.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${template.style.backgroundColor}"/></svg>`)}`;
    },

    calculateOptimization: (thumbnail) => {
      const originalSize = thumbnail.metadata.size;
      const optimizedSize = originalSize * 0.7;
      return ((originalSize - optimizedSize) / originalSize) * 100;
    },

    // Computed Values
    get filteredTemplates() {
      const { templates, searchQuery, categoryFilter, sortBy, sortOrder } = get();
      
      let filtered = templates.filter(template => {
        const matchesSearch = !searchQuery || 
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
      });
      
      return filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof ThumbnailTemplate];
        const bValue = b[sortBy as keyof ThumbnailTemplate];
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    },

    get filteredThumbnails() {
      const { generatedThumbnails, searchQuery, qualityFilter, sortBy, sortOrder } = get();
      
      let filtered = generatedThumbnails.filter(thumbnail => {
        const matchesSearch = !searchQuery || 
          thumbnail.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thumbnail.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesQuality = !qualityFilter || 
          (qualityFilter === 'high' && thumbnail.metadata.quality >= 80) ||
          (qualityFilter === 'medium' && thumbnail.metadata.quality >= 60 && thumbnail.metadata.quality < 80) ||
          (qualityFilter === 'low' && thumbnail.metadata.quality < 60);
        
        return matchesSearch && matchesQuality;
      });
      
      return filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        if (sortBy === 'performance') {
          aValue = a.analytics.score;
          bValue = b.analytics.score;
        } else if (sortBy === 'size') {
          aValue = a.metadata.size;
          bValue = b.metadata.size;
        } else {
          aValue = a[sortBy as keyof GeneratedThumbnail];
          bValue = b[sortBy as keyof GeneratedThumbnail];
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    },

    get totalTemplates() {
      return get().templates.length;
    },

    get totalThumbnails() {
      return get().generatedThumbnails.length;
    },

    get averageQuality() {
      const thumbnails = get().generatedThumbnails;
      if (thumbnails.length === 0) return 0;
      
      const totalQuality = thumbnails.reduce((sum, t) => sum + t.metadata.quality, 0);
      return totalQuality / thumbnails.length;
    },

    get isHealthy() {
      const { stats } = get();
      return stats.successRate > 90 && stats.errorRate < 10;
    },

    get canGenerate() {
      return !get().isGenerating && get().templates.length > 0;
    },

    get recentEvents() {
      return get().events.slice(0, 10);
    }
  }))
);

// Manager Class
export class ThumbnailGenerationManager {
  private store = useThumbnailGenerationStore;

  // Template Management
  async createTemplate(template: Omit<ThumbnailTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.store.getState().createTemplate(template);
  }

  async generateThumbnail(templateId: string, options?: Partial<ThumbnailGenerationConfig>) {
    return this.store.getState().generateThumbnail(templateId, options);
  }

  async optimizeThumbnail(id: string) {
    return this.store.getState().optimizeThumbnail(id);
  }

  // Analytics
  async getStats() {
    return this.store.getState().getStats();
  }

  // Configuration
  async updateConfig(updates: Partial<ThumbnailGenerationConfig>) {
    return this.store.getState().updateConfig(updates);
  }

  // System
  async healthCheck() {
    return this.store.getState().healthCheck();
  }
}

// Global Instance
export const thumbnailGenerationManager = new ThumbnailGenerationManager();

// Utility Functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getQualityColor = (quality: number): string => {
  if (quality >= 90) return 'text-green-600';
  if (quality >= 70) return 'text-blue-600';
  if (quality >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export const getQualityIcon = (quality: number): string => {
  if (quality >= 90) return 'star';
  if (quality >= 70) return 'check-circle';
  if (quality >= 50) return 'alert-circle';
  return 'x-circle';
};

export const getCategoryIcon = (category: ThumbnailTemplate['category']): string => {
  const icons = {
    youtube: 'play',
    instagram: 'camera',
    facebook: 'facebook',
    twitter: 'twitter',
    custom: 'image'
  };
  
  return icons[category] || 'image';
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};