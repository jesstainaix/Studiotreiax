import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'color' | 'image' | 'video' | 'audio' | 'file';
  defaultValue: any;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  description?: string;
  category: string;
}

export interface TemplateComponent {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'chart' | 'table' | 'form' | 'button' | 'container';
  name: string;
  properties: Record<string, any>;
  style: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  variables: string[]; // IDs of variables used by this component
  conditions?: {
    show?: string; // Expression to determine visibility
    style?: Record<string, string>; // Conditional styles
  };
  animations?: {
    entrance?: string;
    exit?: string;
    hover?: string;
    click?: string;
  };
  interactions?: {
    onClick?: string;
    onHover?: string;
    onLoad?: string;
  };
}

export interface TemplateLayout {
  id: string;
  name: string;
  type: 'grid' | 'flex' | 'absolute' | 'responsive';
  properties: Record<string, any>;
  breakpoints?: {
    mobile: Record<string, any>;
    tablet: Record<string, any>;
    desktop: Record<string, any>;
  };
}

export interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Template structure
  variables: TemplateVariable[];
  components: TemplateComponent[];
  layout: TemplateLayout;
  
  // Styling and theming
  theme: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, number>;
    borderRadius: Record<string, number>;
    shadows: Record<string, string>;
  };
  
  // Template metadata
  metadata: {
    dimensions: { width: number; height: number };
    format: 'web' | 'mobile' | 'print' | 'video' | 'presentation';
    orientation: 'portrait' | 'landscape';
    resolution: { width: number; height: number; dpi: number };
  };
  
  // Usage and analytics
  analytics: {
    usageCount: number;
    rating: number;
    reviews: number;
    downloads: number;
    favorites: number;
  };
  
  // AI and automation
  aiFeatures: {
    autoLayout: boolean;
    smartSuggestions: boolean;
    contentGeneration: boolean;
    styleOptimization: boolean;
  };
  
  // Collaboration
  collaboration: {
    isPublic: boolean;
    allowForks: boolean;
    contributors: string[];
    permissions: Record<string, string[]>;
  };
  
  // Export options
  exportOptions: {
    formats: string[];
    quality: Record<string, any>;
    optimization: Record<string, any>;
  };
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  name: string;
  values: Record<string, any>; // Variable values
  customizations: {
    components: Record<string, Partial<TemplateComponent>>;
    theme: Partial<DynamicTemplate['theme']>;
    layout: Partial<TemplateLayout>;
  };
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  owner: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  templateCount: number;
  isPopular: boolean;
}

export interface TemplateAIAnalysis {
  templateId: string;
  analysis: {
    complexity: number;
    usability: number;
    performance: number;
    accessibility: number;
    designQuality: number;
  };
  suggestions: {
    type: 'layout' | 'style' | 'content' | 'performance' | 'accessibility';
    message: string;
    priority: 'low' | 'medium' | 'high';
    autoFixAvailable: boolean;
  }[];
  optimizations: {
    type: string;
    description: string;
    impact: number;
    effort: number;
  }[];
  generatedAt: Date;
}

export interface TemplateConfig {
  editor: {
    gridSize: number;
    snapToGrid: boolean;
    showGuides: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
  rendering: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    enableAnimations: boolean;
    enableEffects: boolean;
    previewMode: 'live' | 'static';
  };
  ai: {
    enableSuggestions: boolean;
    autoOptimize: boolean;
    contentGeneration: boolean;
    styleRecommendations: boolean;
  };
  collaboration: {
    enableRealTime: boolean;
    showCursors: boolean;
    enableComments: boolean;
    autoShare: boolean;
  };
  export: {
    defaultFormat: string;
    defaultQuality: string;
    includeMetadata: boolean;
    optimizeForWeb: boolean;
  };
}

export interface TemplateStats {
  totalTemplates: number;
  totalInstances: number;
  totalCategories: number;
  popularCategories: { category: string; count: number }[];
  recentActivity: {
    created: number;
    modified: number;
    published: number;
  };
  userEngagement: {
    activeUsers: number;
    averageSessionTime: number;
    templatesPerUser: number;
  };
  performance: {
    averageLoadTime: number;
    renderingSpeed: number;
    exportSpeed: number;
  };
}

export interface TemplateMetrics {
  usage: {
    dailyCreations: number;
    weeklyCreations: number;
    monthlyCreations: number;
    totalDownloads: number;
  };
  quality: {
    averageRating: number;
    completionRate: number;
    errorRate: number;
    userSatisfaction: number;
  };
  performance: {
    averageRenderTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  ai: {
    suggestionsGenerated: number;
    suggestionsAccepted: number;
    autoOptimizations: number;
    contentGenerations: number;
  };
}

// Store interface
interface DynamicTemplateStore {
  // State
  templates: DynamicTemplate[];
  instances: TemplateInstance[];
  categories: TemplateCategory[];
  aiAnalyses: TemplateAIAnalysis[];
  config: TemplateConfig;
  stats: TemplateStats;
  metrics: TemplateMetrics;
  
  // Current state
  currentTemplate: DynamicTemplate | null;
  currentInstance: TemplateInstance | null;
  selectedComponents: string[];
  clipboard: TemplateComponent[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedFormat: string;
  sortBy: string;
  viewMode: 'grid' | 'list' | 'preview';
  
  // Editor state
  editorMode: 'design' | 'code' | 'preview';
  zoom: number;
  showGrid: boolean;
  showGuides: boolean;
  
  // Actions
  // Template management
  addTemplate: (template: Omit<DynamicTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<DynamicTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  
  // Instance management
  createInstance: (templateId: string, values?: Record<string, any>) => void;
  updateInstance: (id: string, updates: Partial<TemplateInstance>) => void;
  deleteInstance: (id: string) => void;
  publishInstance: (id: string) => void;
  
  // Component management
  addComponent: (component: Omit<TemplateComponent, 'id'>) => void;
  updateComponent: (id: string, updates: Partial<TemplateComponent>) => void;
  deleteComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  
  // Variable management
  addVariable: (variable: Omit<TemplateVariable, 'id'>) => void;
  updateVariable: (id: string, updates: Partial<TemplateVariable>) => void;
  deleteVariable: (id: string) => void;
  
  // Selection and clipboard
  selectComponent: (id: string) => void;
  selectMultipleComponents: (ids: string[]) => void;
  clearSelection: () => void;
  copyComponents: (ids: string[]) => void;
  pasteComponents: () => void;
  
  // Editor actions
  setEditorMode: (mode: 'design' | 'code' | 'preview') => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  
  // AI features
  generateTemplate: (prompt: string, category: string) => Promise<void>;
  optimizeTemplate: (id: string) => Promise<void>;
  generateContent: (componentId: string, type: string) => Promise<void>;
  getSuggestions: (templateId: string) => Promise<void>;
  
  // Import/Export
  exportTemplate: (id: string, format: string) => Promise<void>;
  importTemplate: (data: any) => Promise<void>;
  exportInstance: (id: string, format: string) => Promise<void>;
  
  // Configuration
  updateConfig: (updates: Partial<TemplateConfig>) => void;
  resetConfig: () => void;
  
  // Analytics
  refreshStats: () => void;
  refreshMetrics: () => void;
  generateReport: (type: string, period: string) => Promise<void>;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedFormat: (format: string) => void;
  setSortBy: (sortBy: string) => void;
  setViewMode: (mode: 'grid' | 'list' | 'preview') => void;
  
  // System
  initialize: () => void;
  cleanup: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Default values
const defaultConfig: TemplateConfig = {
  editor: {
    gridSize: 10,
    snapToGrid: true,
    showGuides: true,
    autoSave: true,
    autoSaveInterval: 30000
  },
  rendering: {
    quality: 'high',
    enableAnimations: true,
    enableEffects: true,
    previewMode: 'live'
  },
  ai: {
    enableSuggestions: true,
    autoOptimize: false,
    contentGeneration: true,
    styleRecommendations: true
  },
  collaboration: {
    enableRealTime: true,
    showCursors: true,
    enableComments: true,
    autoShare: false
  },
  export: {
    defaultFormat: 'png',
    defaultQuality: 'high',
    includeMetadata: true,
    optimizeForWeb: true
  }
};

const defaultStats: TemplateStats = {
  totalTemplates: 0,
  totalInstances: 0,
  totalCategories: 0,
  popularCategories: [],
  recentActivity: {
    created: 0,
    modified: 0,
    published: 0
  },
  userEngagement: {
    activeUsers: 0,
    averageSessionTime: 0,
    templatesPerUser: 0
  },
  performance: {
    averageLoadTime: 0,
    renderingSpeed: 0,
    exportSpeed: 0
  }
};

const defaultMetrics: TemplateMetrics = {
  usage: {
    dailyCreations: 0,
    weeklyCreations: 0,
    monthlyCreations: 0,
    totalDownloads: 0
  },
  quality: {
    averageRating: 0,
    completionRate: 0,
    errorRate: 0,
    userSatisfaction: 0
  },
  performance: {
    averageRenderTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    cpuUsage: 0
  },
  ai: {
    suggestionsGenerated: 0,
    suggestionsAccepted: 0,
    autoOptimizations: 0,
    contentGenerations: 0
  }
};

// Create store
export const useDynamicTemplateStore = create<DynamicTemplateStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  templates: [],
  instances: [],
  categories: [],
  aiAnalyses: [],
  config: defaultConfig,
  stats: defaultStats,
  metrics: defaultMetrics,
  
  currentTemplate: null,
  currentInstance: null,
  selectedComponents: [],
  clipboard: [],
  
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedFormat: 'all',
  sortBy: 'name',
  viewMode: 'grid',
  
  editorMode: 'design',
  zoom: 100,
  showGrid: true,
  showGuides: true,
  
  // Template management
  addTemplate: (templateData) => {
    const template: DynamicTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set((state) => ({
      templates: [...state.templates, template],
      currentTemplate: template
    }));
  },
  
  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map(template =>
        template.id === id
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ),
      currentTemplate: state.currentTemplate?.id === id
        ? { ...state.currentTemplate, ...updates, updatedAt: new Date() }
        : state.currentTemplate
    }));
  },
  
  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter(template => template.id !== id),
      instances: state.instances.filter(instance => instance.templateId !== id),
      currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate
    }));
  },
  
  duplicateTemplate: (id) => {
    const template = get().templates.find(t => t.id === id);
    if (template) {
      const duplicated: DynamicTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${template.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set((state) => ({
        templates: [...state.templates, duplicated]
      }));
    }
  },
  
  // Instance management
  createInstance: (templateId, values = {}) => {
    const template = get().templates.find(t => t.id === templateId);
    if (template) {
      const instance: TemplateInstance = {
        id: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        name: `${template.name} Instance`,
        values,
        customizations: {
          components: {},
          theme: {},
          layout: {}
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        owner: 'current_user'
      };
      
      set((state) => ({
        instances: [...state.instances, instance],
        currentInstance: instance
      }));
    }
  },
  
  updateInstance: (id, updates) => {
    set((state) => ({
      instances: state.instances.map(instance =>
        instance.id === id
          ? { ...instance, ...updates, updatedAt: new Date() }
          : instance
      ),
      currentInstance: state.currentInstance?.id === id
        ? { ...state.currentInstance, ...updates, updatedAt: new Date() }
        : state.currentInstance
    }));
  },
  
  deleteInstance: (id) => {
    set((state) => ({
      instances: state.instances.filter(instance => instance.id !== id),
      currentInstance: state.currentInstance?.id === id ? null : state.currentInstance
    }));
  },
  
  publishInstance: (id) => {
    get().updateInstance(id, { status: 'published' });
  },
  
  // Component management
  addComponent: (componentData) => {
    const component: TemplateComponent = {
      ...componentData,
      id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      get().updateTemplate(currentTemplate.id, {
        components: [...currentTemplate.components, component]
      });
    }
  },
  
  updateComponent: (id, updates) => {
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      const updatedComponents = currentTemplate.components.map(component =>
        component.id === id ? { ...component, ...updates } : component
      );
      
      get().updateTemplate(currentTemplate.id, {
        components: updatedComponents
      });
    }
  },
  
  deleteComponent: (id) => {
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      const updatedComponents = currentTemplate.components.filter(
        component => component.id !== id
      );
      
      get().updateTemplate(currentTemplate.id, {
        components: updatedComponents
      });
      
      // Remove from selection if selected
      set((state) => ({
        selectedComponents: state.selectedComponents.filter(compId => compId !== id)
      }));
    }
  },
  
  duplicateComponent: (id) => {
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      const component = currentTemplate.components.find(c => c.id === id);
      if (component) {
        const duplicated: TemplateComponent = {
          ...component,
          id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position: {
            ...component.position,
            x: component.position.x + 20,
            y: component.position.y + 20
          }
        };
        
        get().updateTemplate(currentTemplate.id, {
          components: [...currentTemplate.components, duplicated]
        });
      }
    }
  },
  
  // Variable management
  addVariable: (variableData) => {
    const variable: TemplateVariable = {
      ...variableData,
      id: `variable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      get().updateTemplate(currentTemplate.id, {
        variables: [...currentTemplate.variables, variable]
      });
    }
  },
  
  updateVariable: (id, updates) => {
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      const updatedVariables = currentTemplate.variables.map(variable =>
        variable.id === id ? { ...variable, ...updates } : variable
      );
      
      get().updateTemplate(currentTemplate.id, {
        variables: updatedVariables
      });
    }
  },
  
  deleteVariable: (id) => {
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      const updatedVariables = currentTemplate.variables.filter(
        variable => variable.id !== id
      );
      
      get().updateTemplate(currentTemplate.id, {
        variables: updatedVariables
      });
    }
  },
  
  // Selection and clipboard
  selectComponent: (id) => {
    set({ selectedComponents: [id] });
  },
  
  selectMultipleComponents: (ids) => {
    set({ selectedComponents: ids });
  },
  
  clearSelection: () => {
    set({ selectedComponents: [] });
  },
  
  copyComponents: (ids) => {
    const currentTemplate = get().currentTemplate;
    if (currentTemplate) {
      const components = currentTemplate.components.filter(c => ids.includes(c.id));
      set({ clipboard: components });
    }
  },
  
  pasteComponents: () => {
    const { clipboard, currentTemplate } = get();
    if (clipboard.length > 0 && currentTemplate) {
      const pastedComponents = clipboard.map(component => ({
        ...component,
        id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          ...component.position,
          x: component.position.x + 20,
          y: component.position.y + 20
        }
      }));
      
      get().updateTemplate(currentTemplate.id, {
        components: [...currentTemplate.components, ...pastedComponents]
      });
    }
  },
  
  // Editor actions
  setEditorMode: (mode) => set({ editorMode: mode }),
  setZoom: (zoom) => set({ zoom }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),
  
  // AI features
  generateTemplate: async (prompt, category) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate AI template generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const template: Omit<DynamicTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: `AI Generated: ${prompt.slice(0, 30)}...`,
        description: `Template generated from prompt: ${prompt}`,
        category,
        tags: ['ai-generated', category],
        version: '1.0.0',
        author: 'AI Assistant',
        variables: [],
        components: [],
        layout: {
          id: 'layout_1',
          name: 'Default Layout',
          type: 'grid',
          properties: {}
        },
        theme: {
          colors: { primary: '#3B82F6', secondary: '#10B981' },
          fonts: { heading: 'Inter', body: 'Inter' },
          spacing: { small: 8, medium: 16, large: 24 },
          borderRadius: { small: 4, medium: 8, large: 12 },
          shadows: { small: '0 1px 3px rgba(0,0,0,0.1)' }
        },
        metadata: {
          dimensions: { width: 1920, height: 1080 },
          format: 'web',
          orientation: 'landscape',
          resolution: { width: 1920, height: 1080, dpi: 72 }
        },
        analytics: {
          usageCount: 0,
          rating: 0,
          reviews: 0,
          downloads: 0,
          favorites: 0
        },
        aiFeatures: {
          autoLayout: true,
          smartSuggestions: true,
          contentGeneration: true,
          styleOptimization: true
        },
        collaboration: {
          isPublic: false,
          allowForks: true,
          contributors: [],
          permissions: {}
        },
        exportOptions: {
          formats: ['png', 'jpg', 'svg', 'pdf'],
          quality: { high: 300, medium: 150, low: 72 },
          optimization: { compress: true, optimize: true }
        }
      };
      
      get().addTemplate(template);
    } catch (error) {
      set({ error: 'Failed to generate template' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  optimizeTemplate: async (id) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Simulate optimization
    } catch (error) {
      set({ error: 'Failed to optimize template' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  generateContent: async (componentId, type) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate content generation
    } catch (error) {
      set({ error: 'Failed to generate content' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  getSuggestions: async (templateId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Simulate AI suggestions
    } catch (error) {
      set({ error: 'Failed to get suggestions' });
    }
  },
  
  // Import/Export
  exportTemplate: async (id, format) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate export
    } catch (error) {
      set({ error: 'Failed to export template' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  importTemplate: async (data) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate import
    } catch (error) {
      set({ error: 'Failed to import template' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  exportInstance: async (id, format) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate export
    } catch (error) {
      set({ error: 'Failed to export instance' });
    } finally {
      set({ isLoading: false });
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
  
  // Analytics
  refreshStats: () => {
    const { templates, instances, categories } = get();
    
    const stats: TemplateStats = {
      totalTemplates: templates.length,
      totalInstances: instances.length,
      totalCategories: categories.length,
      popularCategories: categories
        .map(cat => ({ category: cat.name, count: cat.templateCount }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentActivity: {
        created: templates.filter(t => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return t.createdAt > dayAgo;
        }).length,
        modified: templates.filter(t => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return t.updatedAt > dayAgo;
        }).length,
        published: instances.filter(i => i.status === 'published').length
      },
      userEngagement: {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        averageSessionTime: Math.floor(Math.random() * 3600) + 1800,
        templatesPerUser: templates.length > 0 ? Math.round(instances.length / templates.length) : 0
      },
      performance: {
        averageLoadTime: Math.random() * 2 + 0.5,
        renderingSpeed: Math.random() * 100 + 50,
        exportSpeed: Math.random() * 10 + 5
      }
    };
    
    set({ stats });
  },
  
  refreshMetrics: () => {
    const metrics: TemplateMetrics = {
      usage: {
        dailyCreations: Math.floor(Math.random() * 50) + 10,
        weeklyCreations: Math.floor(Math.random() * 300) + 100,
        monthlyCreations: Math.floor(Math.random() * 1000) + 500,
        totalDownloads: Math.floor(Math.random() * 10000) + 5000
      },
      quality: {
        averageRating: Math.random() * 2 + 3,
        completionRate: Math.random() * 30 + 70,
        errorRate: Math.random() * 5,
        userSatisfaction: Math.random() * 2 + 3
      },
      performance: {
        averageRenderTime: Math.random() * 2 + 0.5,
        cacheHitRate: Math.random() * 20 + 80,
        memoryUsage: Math.random() * 50 + 25,
        cpuUsage: Math.random() * 30 + 10
      },
      ai: {
        suggestionsGenerated: Math.floor(Math.random() * 1000) + 500,
        suggestionsAccepted: Math.floor(Math.random() * 500) + 200,
        autoOptimizations: Math.floor(Math.random() * 100) + 50,
        contentGenerations: Math.floor(Math.random() * 200) + 100
      }
    };
    
    set({ metrics });
  },
  
  generateReport: async (type, period) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulate report generation
    } catch (error) {
      set({ error: 'Failed to generate report' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Search and filter
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // System
  initialize: () => {
    get().refreshStats();
    get().refreshMetrics();
    
    // Initialize with demo data
    const demoCategories: TemplateCategory[] = [
      {
        id: 'social-media',
        name: 'Social Media',
        description: 'Templates for social media posts',
        icon: 'share-2',
        color: '#3B82F6',
        templateCount: 25,
        isPopular: true
      },
      {
        id: 'presentations',
        name: 'Presentations',
        description: 'Professional presentation templates',
        icon: 'presentation',
        color: '#10B981',
        templateCount: 18,
        isPopular: true
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Marketing and advertising templates',
        icon: 'megaphone',
        color: '#F59E0B',
        templateCount: 32,
        isPopular: true
      }
    ];
    
    set({ categories: demoCategories });
  },
  
  cleanup: () => {
    set({
      currentTemplate: null,
      currentInstance: null,
      selectedComponents: [],
      clipboard: [],
      error: null
    });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
})));

// Manager class
export class DynamicTemplateManager {
  private static instance: DynamicTemplateManager;
  
  static getInstance(): DynamicTemplateManager {
    if (!DynamicTemplateManager.instance) {
      DynamicTemplateManager.instance = new DynamicTemplateManager();
    }
    return DynamicTemplateManager.instance;
  }
  
  async renderTemplate(template: DynamicTemplate, values: Record<string, any>): Promise<string> {
    // Simulate template rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    return `<div>Rendered template: ${template.name}</div>`;
  }
  
  async validateTemplate(template: DynamicTemplate): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!template.name) errors.push('Template name is required');
    if (template.components.length === 0) errors.push('Template must have at least one component');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  async optimizeTemplate(template: DynamicTemplate): Promise<DynamicTemplate> {
    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 1000));
    return template;
  }
}

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFormatColor = (format: string): string => {
  const colors: Record<string, string> = {
    web: 'blue',
    mobile: 'green',
    print: 'purple',
    video: 'red',
    presentation: 'orange'
  };
  return colors[format] || 'gray';
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'social-media': 'share-2',
    presentations: 'presentation',
    marketing: 'megaphone',
    web: 'globe',
    mobile: 'smartphone',
    print: 'printer'
  };
  return icons[category] || 'folder';
};

export const getQualityColor = (quality: number): string => {
  if (quality >= 90) return 'green';
  if (quality >= 70) return 'yellow';
  if (quality >= 50) return 'orange';
  return 'red';
};

export const calculateTemplateComplexity = (template: DynamicTemplate): number => {
  let complexity = 0;
  
  // Base complexity from components
  complexity += template.components.length * 2;
  
  // Add complexity for variables
  complexity += template.variables.length;
  
  // Add complexity for interactions
  template.components.forEach(component => {
    if (component.interactions) complexity += 3;
    if (component.animations) complexity += 2;
    if (component.conditions) complexity += 2;
  });
  
  // Add complexity for AI features
  if (template.aiFeatures.autoLayout) complexity += 5;
  if (template.aiFeatures.smartSuggestions) complexity += 3;
  if (template.aiFeatures.contentGeneration) complexity += 4;
  
  return Math.min(100, complexity);
};

export const generateTemplateRecommendations = (templates: DynamicTemplate[]): Array<{
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}> => {
  const recommendations = [];
  
  if (templates.length === 0) {
    recommendations.push({
      type: 'getting-started',
      message: 'Create your first template to get started',
      priority: 'high' as const
    });
  }
  
  const lowRatedTemplates = templates.filter(t => t.analytics.rating < 3);
  if (lowRatedTemplates.length > 0) {
    recommendations.push({
      type: 'quality',
      message: `${lowRatedTemplates.length} templates have low ratings and need improvement`,
      priority: 'medium' as const
    });
  }
  
  const unusedTemplates = templates.filter(t => t.analytics.usageCount === 0);
  if (unusedTemplates.length > 0) {
    recommendations.push({
      type: 'usage',
      message: `${unusedTemplates.length} templates haven't been used yet`,
      priority: 'low' as const
    });
  }
  
  return recommendations;
};

export default useDynamicTemplateStore;