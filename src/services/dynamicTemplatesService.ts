import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'animation';
  name: string;
  properties: Record<string, any>;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  animations: TemplateAnimation[];
  constraints: TemplateConstraint[];
  dependencies: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateAnimation {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'custom';
  duration: number;
  delay: number;
  easing: string;
  loop: boolean;
  direction: 'normal' | 'reverse' | 'alternate';
  keyframes: AnimationKeyframe[];
  triggers: AnimationTrigger[];
  conditions: AnimationCondition[];
}

export interface AnimationKeyframe {
  time: number;
  properties: Record<string, any>;
  easing?: string;
}

export interface AnimationTrigger {
  type: 'time' | 'click' | 'hover' | 'scroll' | 'custom';
  value?: any;
  action: 'play' | 'pause' | 'stop' | 'reverse';
}

export interface AnimationCondition {
  property: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
}

export interface TemplateConstraint {
  id: string;
  type: 'position' | 'size' | 'aspect-ratio' | 'alignment' | 'spacing';
  target: string;
  value: any;
  priority: number;
}

export interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  preview: string;
  elements: TemplateElement[];
  variables: TemplateVariable[];
  styles: TemplateStyle[];
  layouts: TemplateLayout[];
  interactions: TemplateInteraction[];
  responsive: ResponsiveConfig;
  metadata: TemplateMetadata;
  version: string;
  isPublic: boolean;
  isFeatured: boolean;
  rating: number;
  downloads: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'color' | 'image' | 'boolean' | 'select';
  defaultValue: any;
  options?: any[];
  validation?: VariableValidation;
  description?: string;
  group?: string;
}

export interface VariableValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

export interface TemplateStyle {
  id: string;
  name: string;
  selector: string;
  properties: Record<string, any>;
  responsive?: Record<string, Record<string, any>>;
  states?: Record<string, Record<string, any>>;
}

export interface TemplateLayout {
  id: string;
  name: string;
  type: 'grid' | 'flex' | 'absolute' | 'flow';
  properties: Record<string, any>;
  breakpoints: Record<string, any>;
}

export interface TemplateInteraction {
  id: string;
  name: string;
  trigger: InteractionTrigger;
  actions: InteractionAction[];
  conditions?: InteractionCondition[];
}

export interface InteractionTrigger {
  type: 'click' | 'hover' | 'scroll' | 'time' | 'custom';
  target?: string;
  value?: any;
}

export interface InteractionAction {
  type: 'animate' | 'navigate' | 'show' | 'hide' | 'toggle' | 'custom';
  target: string;
  value?: any;
  duration?: number;
}

export interface InteractionCondition {
  property: string;
  operator: string;
  value: any;
}

export interface ResponsiveConfig {
  breakpoints: Record<string, number>;
  layouts: Record<string, any>;
  elements: Record<string, Record<string, any>>;
}

export interface TemplateMetadata {
  author: string;
  license: string;
  compatibility: string[];
  requirements: string[];
  changelog: ChangelogEntry[];
  documentation: string;
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parent?: string;
  children: string[];
  templateCount: number;
}

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  templates: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateUsage {
  templateId: string;
  userId: string;
  projectId: string;
  usedAt: Date;
  customizations: Record<string, any>;
}

export interface TemplateStats {
  totalTemplates: number;
  publicTemplates: number;
  privateTemplates: number;
  featuredTemplates: number;
  totalDownloads: number;
  totalUsage: number;
  averageRating: number;
  topCategories: Array<{ category: string; count: number }>;
  recentTemplates: DynamicTemplate[];
  popularTemplates: DynamicTemplate[];
}

export interface TemplateConfig {
  autoSave: boolean;
  autoBackup: boolean;
  maxVersions: number;
  compressionLevel: number;
  cacheSize: number;
  previewQuality: 'low' | 'medium' | 'high';
  enableCollaboration: boolean;
  enableVersioning: boolean;
  enableAnalytics: boolean;
}

// Store State
interface DynamicTemplatesState {
  // Core Data
  templates: DynamicTemplate[];
  categories: TemplateCategory[];
  collections: TemplateCollection[];
  usage: TemplateUsage[];
  
  // Current State
  currentTemplate: DynamicTemplate | null;
  selectedElements: string[];
  clipboard: TemplateElement[];
  history: any[];
  historyIndex: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedCollection: string;
  viewMode: 'grid' | 'list' | 'preview';
  sortBy: 'name' | 'date' | 'rating' | 'downloads';
  sortOrder: 'asc' | 'desc';
  showFilters: boolean;
  showPreview: boolean;
  
  // Filters
  filters: {
    category: string[];
    tags: string[];
    author: string[];
    rating: number;
    dateRange: [Date, Date] | null;
    isPublic: boolean | null;
    isFeatured: boolean | null;
  };
  
  // Configuration
  config: TemplateConfig;
  
  // Statistics
  stats: TemplateStats;
  
  // Real-time
  isConnected: boolean;
  lastSync: Date | null;
  pendingChanges: number;
}

// Store Actions
interface DynamicTemplatesActions {
  // Template Management
  loadTemplates: () => Promise<void>;
  createTemplate: (template: Partial<DynamicTemplate>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<DynamicTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<string>;
  importTemplate: (file: File) => Promise<string>;
  exportTemplate: (id: string, format: 'json' | 'zip') => Promise<Blob>;
  
  // Element Management
  addElement: (element: Partial<TemplateElement>) => void;
  updateElement: (id: string, updates: Partial<TemplateElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (id: string, position: { x: number; y: number }) => void;
  resizeElement: (id: string, size: { width: number; height: number }) => void;
  
  // Selection Management
  selectElement: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Clipboard Operations
  copy: () => void;
  cut: () => void;
  paste: () => void;
  
  // History Management
  undo: () => void;
  redo: () => void;
  addToHistory: (action: any) => void;
  clearHistory: () => void;
  
  // Category Management
  loadCategories: () => Promise<void>;
  createCategory: (category: Partial<TemplateCategory>) => Promise<string>;
  updateCategory: (id: string, updates: Partial<TemplateCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Collection Management
  loadCollections: () => Promise<void>;
  createCollection: (collection: Partial<TemplateCollection>) => Promise<string>;
  updateCollection: (id: string, updates: Partial<TemplateCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (collectionId: string, templateId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, templateId: string) => Promise<void>;
  
  // Search and Filter
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedCollection: (collection: string) => void;
  setFilters: (filters: Partial<DynamicTemplatesState['filters']>) => void;
  clearFilters: () => void;
  
  // UI Management
  setViewMode: (mode: 'grid' | 'list' | 'preview') => void;
  setSortBy: (sortBy: string, order?: 'asc' | 'desc') => void;
  toggleFilters: () => void;
  togglePreview: () => void;
  setCurrentTemplate: (template: DynamicTemplate | null) => void;
  
  // Quick Actions
  quickCreate: (type: string) => Promise<string>;
  quickDuplicate: (id: string) => Promise<string>;
  quickPublish: (id: string) => Promise<void>;
  quickUnpublish: (id: string) => Promise<void>;
  
  // Advanced Features
  generateThumbnail: (id: string) => Promise<string>;
  generatePreview: (id: string) => Promise<string>;
  validateTemplate: (template: DynamicTemplate) => Promise<ValidationResult>;
  optimizeTemplate: (id: string) => Promise<void>;
  
  // System Operations
  refreshData: () => Promise<void>;
  syncData: () => Promise<void>;
  clearCache: () => void;
  resetState: () => void;
  
  // Configuration
  updateConfig: (config: Partial<TemplateConfig>) => void;
  resetConfig: () => void;
  
  // Analytics
  trackUsage: (templateId: string, projectId: string) => void;
  getStats: () => Promise<TemplateStats>;
  getUsageAnalytics: (templateId: string) => Promise<any>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Zustand Store
export const useDynamicTemplatesStore = create<DynamicTemplatesState & DynamicTemplatesActions>()(subscribeWithSelector((set, get) => ({
  // Initial State
  templates: [],
  categories: [],
  collections: [],
  usage: [],
  currentTemplate: null,
  selectedElements: [],
  clipboard: [],
  history: [],
  historyIndex: -1,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: '',
  selectedCollection: '',
  viewMode: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
  showFilters: false,
  showPreview: false,
  filters: {
    category: [],
    tags: [],
    author: [],
    rating: 0,
    dateRange: null,
    isPublic: null,
    isFeatured: null,
  },
  config: {
    autoSave: true,
    autoBackup: true,
    maxVersions: 10,
    compressionLevel: 5,
    cacheSize: 100,
    previewQuality: 'medium',
    enableCollaboration: true,
    enableVersioning: true,
    enableAnalytics: true,
  },
  stats: {
    totalTemplates: 0,
    publicTemplates: 0,
    privateTemplates: 0,
    featuredTemplates: 0,
    totalDownloads: 0,
    totalUsage: 0,
    averageRating: 0,
    topCategories: [],
    recentTemplates: [],
    popularTemplates: [],
  },
  isConnected: false,
  lastSync: null,
  pendingChanges: 0,

  // Actions
  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockTemplates: DynamicTemplate[] = [
        {
          id: '1',
          name: 'Modern Presentation',
          description: 'Clean and modern presentation template',
          category: 'presentation',
          tags: ['modern', 'clean', 'business'],
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20presentation%20template%20thumbnail&image_size=square',
          preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20presentation%20template%20preview&image_size=landscape_16_9',
          elements: [],
          variables: [],
          styles: [],
          layouts: [],
          interactions: [],
          responsive: { breakpoints: {}, layouts: {}, elements: {} },
          metadata: {
            author: 'Studio Treiax',
            license: 'MIT',
            compatibility: ['web', 'mobile'],
            requirements: [],
            changelog: [],
            documentation: '',
          },
          version: '1.0.0',
          isPublic: true,
          isFeatured: true,
          rating: 4.8,
          downloads: 1250,
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      set({ templates: mockTemplates, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load templates', isLoading: false });
    }
  },

  createTemplate: async (template) => {
    const newTemplate: DynamicTemplate = {
      id: Date.now().toString(),
      name: template.name || 'New Template',
      description: template.description || '',
      category: template.category || 'general',
      tags: template.tags || [],
      thumbnail: template.thumbnail || '',
      preview: template.preview || '',
      elements: template.elements || [],
      variables: template.variables || [],
      styles: template.styles || [],
      layouts: template.layouts || [],
      interactions: template.interactions || [],
      responsive: template.responsive || { breakpoints: {}, layouts: {}, elements: {} },
      metadata: template.metadata || {
        author: 'User',
        license: 'MIT',
        compatibility: [],
        requirements: [],
        changelog: [],
        documentation: '',
      },
      version: '1.0.0',
      isPublic: false,
      isFeatured: false,
      rating: 0,
      downloads: 0,
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({
      templates: [...state.templates, newTemplate],
      currentTemplate: newTemplate,
    }));
    
    return newTemplate.id;
  },

  updateTemplate: async (id, updates) => {
    set(state => ({
      templates: state.templates.map(template =>
        template.id === id
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ),
      currentTemplate: state.currentTemplate?.id === id
        ? { ...state.currentTemplate, ...updates, updatedAt: new Date() }
        : state.currentTemplate,
    }));
  },

  deleteTemplate: async (id) => {
    set(state => ({
      templates: state.templates.filter(template => template.id !== id),
      currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
    }));
  },

  duplicateTemplate: async (id) => {
    const template = get().templates.find(t => t.id === id);
    if (!template) return '';
    
    const duplicated = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({
      templates: [...state.templates, duplicated],
    }));
    
    return duplicated.id;
  },

  importTemplate: async (file) => {
    // Simulate file import
    const newId = Date.now().toString();
    return newId;
  },

  exportTemplate: async (id, format) => {
    const template = get().templates.find(t => t.id === id);
    if (!template) throw new Error('Template not found');
    
    const data = JSON.stringify(template, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  // Element Management
  addElement: (element) => {
    const newElement: TemplateElement = {
      id: Date.now().toString(),
      type: element.type || 'text',
      name: element.name || 'New Element',
      properties: element.properties || {},
      position: element.position || { x: 0, y: 0, z: 0 },
      size: element.size || { width: 100, height: 100 },
      rotation: element.rotation || 0,
      opacity: element.opacity || 1,
      visible: element.visible !== false,
      locked: element.locked || false,
      animations: element.animations || [],
      constraints: element.constraints || [],
      dependencies: element.dependencies || [],
      metadata: element.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({
      currentTemplate: state.currentTemplate ? {
        ...state.currentTemplate,
        elements: [...state.currentTemplate.elements, newElement],
        updatedAt: new Date(),
      } : null,
    }));
  },

  updateElement: (id, updates) => {
    set(state => ({
      currentTemplate: state.currentTemplate ? {
        ...state.currentTemplate,
        elements: state.currentTemplate.elements.map(element =>
          element.id === id
            ? { ...element, ...updates, updatedAt: new Date() }
            : element
        ),
        updatedAt: new Date(),
      } : null,
    }));
  },

  deleteElement: (id) => {
    set(state => ({
      currentTemplate: state.currentTemplate ? {
        ...state.currentTemplate,
        elements: state.currentTemplate.elements.filter(element => element.id !== id),
        updatedAt: new Date(),
      } : null,
      selectedElements: state.selectedElements.filter(elementId => elementId !== id),
    }));
  },

  duplicateElement: (id) => {
    const element = get().currentTemplate?.elements.find(e => e.id === id);
    if (!element) return;
    
    const duplicated = {
      ...element,
      id: Date.now().toString(),
      name: `${element.name} (Copy)`,
      position: {
        ...element.position,
        x: element.position.x + 20,
        y: element.position.y + 20,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    get().addElement(duplicated);
  },

  moveElement: (id, position) => {
    get().updateElement(id, { position: { ...get().currentTemplate?.elements.find(e => e.id === id)?.position, ...position } });
  },

  resizeElement: (id, size) => {
    get().updateElement(id, { size });
  },

  // Selection Management
  selectElement: (id, multi = false) => {
    set(state => ({
      selectedElements: multi
        ? state.selectedElements.includes(id)
          ? state.selectedElements.filter(elementId => elementId !== id)
          : [...state.selectedElements, id]
        : [id],
    }));
  },

  selectAll: () => {
    const elements = get().currentTemplate?.elements || [];
    set({ selectedElements: elements.map(e => e.id) });
  },

  clearSelection: () => {
    set({ selectedElements: [] });
  },

  // Clipboard Operations
  copy: () => {
    const { currentTemplate, selectedElements } = get();
    if (!currentTemplate) return;
    
    const elementsToCopy = currentTemplate.elements.filter(e => selectedElements.includes(e.id));
    set({ clipboard: elementsToCopy });
  },

  cut: () => {
    get().copy();
    const { selectedElements } = get();
    selectedElements.forEach(id => get().deleteElement(id));
  },

  paste: () => {
    const { clipboard } = get();
    clipboard.forEach(element => {
      get().addElement({
        ...element,
        position: {
          ...element.position,
          x: element.position.x + 20,
          y: element.position.y + 20,
        },
      });
    });
  },

  // History Management
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      set({ 
        currentTemplate: previousState,
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({ 
        currentTemplate: nextState,
        historyIndex: historyIndex + 1,
      });
    }
  },

  addToHistory: (action) => {
    const { currentTemplate, history, historyIndex } = get();
    if (!currentTemplate) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...currentTemplate });
    
    set({
      history: newHistory.slice(-get().config.maxVersions),
      historyIndex: newHistory.length - 1,
    });
  },

  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },

  // Other actions with simplified implementations
  loadCategories: async () => {
    const mockCategories: TemplateCategory[] = [
      {
        id: '1',
        name: 'Presentations',
        description: 'Professional presentation templates',
        icon: 'presentation',
        color: '#3B82F6',
        children: [],
        templateCount: 25,
      },
    ];
    set({ categories: mockCategories });
  },

  createCategory: async (category) => {
    const newCategory: TemplateCategory = {
      id: Date.now().toString(),
      name: category.name || 'New Category',
      description: category.description || '',
      icon: category.icon || 'folder',
      color: category.color || '#6B7280',
      parent: category.parent,
      children: [],
      templateCount: 0,
    };
    
    set(state => ({
      categories: [...state.categories, newCategory],
    }));
    
    return newCategory.id;
  },

  updateCategory: async (id, updates) => {
    set(state => ({
      categories: state.categories.map(category =>
        category.id === id ? { ...category, ...updates } : category
      ),
    }));
  },

  deleteCategory: async (id) => {
    set(state => ({
      categories: state.categories.filter(category => category.id !== id),
    }));
  },

  loadCollections: async () => {
    const mockCollections: TemplateCollection[] = [
      {
        id: '1',
        name: 'My Favorites',
        description: 'My favorite templates',
        templates: ['1'],
        isPublic: false,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    set({ collections: mockCollections });
  },

  createCollection: async (collection) => {
    const newCollection: TemplateCollection = {
      id: Date.now().toString(),
      name: collection.name || 'New Collection',
      description: collection.description || '',
      templates: [],
      isPublic: collection.isPublic || false,
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({
      collections: [...state.collections, newCollection],
    }));
    
    return newCollection.id;
  },

  updateCollection: async (id, updates) => {
    set(state => ({
      collections: state.collections.map(collection =>
        collection.id === id ? { ...collection, ...updates, updatedAt: new Date() } : collection
      ),
    }));
  },

  deleteCollection: async (id) => {
    set(state => ({
      collections: state.collections.filter(collection => collection.id !== id),
    }));
  },

  addToCollection: async (collectionId, templateId) => {
    set(state => ({
      collections: state.collections.map(collection =>
        collection.id === collectionId
          ? { ...collection, templates: [...collection.templates, templateId], updatedAt: new Date() }
          : collection
      ),
    }));
  },

  removeFromCollection: async (collectionId, templateId) => {
    set(state => ({
      collections: state.collections.map(collection =>
        collection.id === collectionId
          ? { ...collection, templates: collection.templates.filter(id => id !== templateId), updatedAt: new Date() }
          : collection
      ),
    }));
  },

  // Search and Filter
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedCollection: (collection) => set({ selectedCollection: collection }),
  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({
    filters: {
      category: [],
      tags: [],
      author: [],
      rating: 0,
      dateRange: null,
      isPublic: null,
      isFeatured: null,
    },
  }),

  // UI Management
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy, order = 'desc') => set({ sortBy, sortOrder: order }),
  toggleFilters: () => set(state => ({ showFilters: !state.showFilters })),
  togglePreview: () => set(state => ({ showPreview: !state.showPreview })),
  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  // Quick Actions
  quickCreate: async (type) => {
    return get().createTemplate({ name: `New ${type}`, category: type });
  },

  quickDuplicate: async (id) => {
    return get().duplicateTemplate(id);
  },

  quickPublish: async (id) => {
    await get().updateTemplate(id, { isPublic: true });
  },

  quickUnpublish: async (id) => {
    await get().updateTemplate(id, { isPublic: false });
  },

  // Advanced Features
  generateThumbnail: async (id) => {
    // Simulate thumbnail generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const thumbnailUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=template%20thumbnail%20${id}&image_size=square`;
    await get().updateTemplate(id, { thumbnail: thumbnailUrl });
    return thumbnailUrl;
  },

  generatePreview: async (id) => {
    // Simulate preview generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    const previewUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=template%20preview%20${id}&image_size=landscape_16_9`;
    await get().updateTemplate(id, { preview: previewUrl });
    return previewUrl;
  },

  validateTemplate: async (template) => {
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  },

  optimizeTemplate: async (id) => {
    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  // System Operations
  refreshData: async () => {
    await Promise.all([
      get().loadTemplates(),
      get().loadCategories(),
      get().loadCollections(),
    ]);
  },

  syncData: async () => {
    set({ lastSync: new Date(), pendingChanges: 0 });
  },

  clearCache: () => {
    // Clear any cached data
  },

  resetState: () => {
    set({
      templates: [],
      categories: [],
      collections: [],
      usage: [],
      currentTemplate: null,
      selectedElements: [],
      clipboard: [],
      history: [],
      historyIndex: -1,
      searchQuery: '',
      selectedCategory: '',
      selectedCollection: '',
      filters: {
        category: [],
        tags: [],
        author: [],
        rating: 0,
        dateRange: null,
        isPublic: null,
        isFeatured: null,
      },
    });
  },

  // Configuration
  updateConfig: (config) => {
    set(state => ({ config: { ...state.config, ...config } }));
  },

  resetConfig: () => {
    set({
      config: {
        autoSave: true,
        autoBackup: true,
        maxVersions: 10,
        compressionLevel: 5,
        cacheSize: 100,
        previewQuality: 'medium',
        enableCollaboration: true,
        enableVersioning: true,
        enableAnalytics: true,
      },
    });
  },

  // Analytics
  trackUsage: (templateId, projectId) => {
    const usage: TemplateUsage = {
      templateId,
      userId: 'current-user',
      projectId,
      usedAt: new Date(),
      customizations: {},
    };
    
    set(state => ({
      usage: [...state.usage, usage],
    }));
  },

  getStats: async () => {
    const { templates } = get();
    const stats: TemplateStats = {
      totalTemplates: templates.length,
      publicTemplates: templates.filter(t => t.isPublic).length,
      privateTemplates: templates.filter(t => !t.isPublic).length,
      featuredTemplates: templates.filter(t => t.isFeatured).length,
      totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
      totalUsage: get().usage.length,
      averageRating: templates.reduce((sum, t) => sum + t.rating, 0) / templates.length || 0,
      topCategories: [],
      recentTemplates: templates.slice(0, 5),
      popularTemplates: templates.sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    };
    
    set({ stats });
    return stats;
  },

  getUsageAnalytics: async (templateId) => {
    const usage = get().usage.filter(u => u.templateId === templateId);
    return {
      totalUsage: usage.length,
      uniqueUsers: new Set(usage.map(u => u.userId)).size,
      recentUsage: usage.slice(-10),
    };
  },
})));

// Manager Class
export class DynamicTemplatesManager {
  private static instance: DynamicTemplatesManager;
  
  static getInstance(): DynamicTemplatesManager {
    if (!DynamicTemplatesManager.instance) {
      DynamicTemplatesManager.instance = new DynamicTemplatesManager();
    }
    return DynamicTemplatesManager.instance;
  }
  
  async initialize() {
    const store = useDynamicTemplatesStore.getState();
    await store.refreshData();
  }
  
  getStore() {
    return useDynamicTemplatesStore;
  }
}

// Global instance
export const dynamicTemplatesManager = DynamicTemplatesManager.getInstance();

// Utility Functions
export const formatTemplateSize = (elements: TemplateElement[]): string => {
  const totalElements = elements.length;
  if (totalElements === 0) return 'Empty';
  if (totalElements === 1) return '1 element';
  return `${totalElements} elements`;
};

export const getTemplateComplexity = (template: DynamicTemplate): 'simple' | 'medium' | 'complex' => {
  const score = template.elements.length + 
                template.animations.length * 2 + 
                template.interactions.length * 3;
  
  if (score < 5) return 'simple';
  if (score < 15) return 'medium';
  return 'complex';
};

export const getTemplateStatusColor = (template: DynamicTemplate): string => {
  if (!template.isPublic) return '#6B7280'; // gray
  if (template.isFeatured) return '#F59E0B'; // amber
  return '#10B981'; // emerald
};

export const getTemplateStatusIcon = (template: DynamicTemplate): string => {
  if (!template.isPublic) return 'lock';
  if (template.isFeatured) return 'star';
  return 'globe';
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    presentation: 'presentation',
    video: 'video',
    social: 'share-2',
    marketing: 'megaphone',
    education: 'graduation-cap',
    business: 'briefcase',
    creative: 'palette',
    general: 'folder',
  };
  return icons[category] || 'folder';
};

export const formatTemplateRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const formatTemplateDownloads = (downloads: number): string => {
  if (downloads < 1000) return downloads.toString();
  if (downloads < 1000000) return `${(downloads / 1000).toFixed(1)}K`;
  return `${(downloads / 1000000).toFixed(1)}M`;
};

export const generateTemplateRecommendations = (template: DynamicTemplate, allTemplates: DynamicTemplate[]): DynamicTemplate[] => {
  return allTemplates
    .filter(t => t.id !== template.id)
    .filter(t => 
      t.category === template.category || 
      template.tags.some(tag => t.tags.includes(tag))
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
};