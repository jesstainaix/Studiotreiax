import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDynamicTemplatesStore, DynamicTemplate, TemplateElement, TemplateCategory, TemplateCollection, TemplateStats } from '../services/dynamicTemplatesService';

// Throttle and Debounce Utilities
const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args: any[]) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;
};

const useDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
};

// Progress Tracking Hook
const useProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const start = useCallback(() => {
    setIsActive(true);
    setProgress(0);
  }, []);
  
  const update = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);
  
  const complete = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsActive(false);
      setProgress(0);
    }, 500);
  }, []);
  
  return { progress, isActive, start, update, complete };
};

// Main Hook
export const useDynamicTemplates = () => {
  const store = useDynamicTemplatesStore();
  const progress = useProgress();
  
  // Auto-initialization and refresh
  useEffect(() => {
    const initializeData = async () => {
      try {
        progress.start();
        await store.refreshData();
        progress.complete();
      } catch (error) {
        console.error('Failed to initialize dynamic templates:', error);
        progress.complete();
      }
    };
    
    if (store.templates.length === 0) {
      initializeData();
    }
  }, []);
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (store.config.enableAnalytics) {
        store.syncData();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [store.config.enableAnalytics]);
  
  // Memoized actions with error handling
  const actions = useMemo(() => ({
    // Template Management
    createTemplate: async (template: Partial<DynamicTemplate>) => {
      try {
        progress.start();
        const id = await store.createTemplate(template);
        progress.complete();
        return id;
      } catch (error) {
        console.error('Failed to create template:', error);
        progress.complete();
        throw error;
      }
    },
    
    updateTemplate: async (id: string, updates: Partial<DynamicTemplate>) => {
      try {
        await store.updateTemplate(id, updates);
        if (store.config.autoSave) {
          store.addToHistory({ type: 'update', id, updates });
        }
      } catch (error) {
        console.error('Failed to update template:', error);
        throw error;
      }
    },
    
    deleteTemplate: async (id: string) => {
      try {
        await store.deleteTemplate(id);
        if (store.config.autoSave) {
          store.addToHistory({ type: 'delete', id });
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
        throw error;
      }
    },
    
    duplicateTemplate: async (id: string) => {
      try {
        progress.start();
        const newId = await store.duplicateTemplate(id);
        progress.complete();
        return newId;
      } catch (error) {
        console.error('Failed to duplicate template:', error);
        progress.complete();
        throw error;
      }
    },
    
    // Element Management
    addElement: (element: Partial<TemplateElement>) => {
      try {
        store.addElement(element);
        if (store.config.autoSave) {
          store.addToHistory({ type: 'addElement', element });
        }
      } catch (error) {
        console.error('Failed to add element:', error);
        throw error;
      }
    },
    
    updateElement: (id: string, updates: Partial<TemplateElement>) => {
      try {
        store.updateElement(id, updates);
        if (store.config.autoSave) {
          store.addToHistory({ type: 'updateElement', id, updates });
        }
      } catch (error) {
        console.error('Failed to update element:', error);
        throw error;
      }
    },
    
    deleteElement: (id: string) => {
      try {
        store.deleteElement(id);
        if (store.config.autoSave) {
          store.addToHistory({ type: 'deleteElement', id });
        }
      } catch (error) {
        console.error('Failed to delete element:', error);
        throw error;
      }
    },
    
    // Selection Management
    selectElement: store.selectElement,
    selectAll: store.selectAll,
    clearSelection: store.clearSelection,
    
    // Clipboard Operations
    copy: store.copy,
    cut: store.cut,
    paste: store.paste,
    
    // History Management
    undo: store.undo,
    redo: store.redo,
    
    // Category Management
    createCategory: store.createCategory,
    updateCategory: store.updateCategory,
    deleteCategory: store.deleteCategory,
    
    // Collection Management
    createCollection: store.createCollection,
    updateCollection: store.updateCollection,
    deleteCollection: store.deleteCollection,
    addToCollection: store.addToCollection,
    removeFromCollection: store.removeFromCollection,
  }), [store, progress]);
  
  // Quick Actions
  const quickActions = useMemo(() => ({
    quickCreate: async (type: string) => {
      try {
        progress.start();
        const id = await store.quickCreate(type);
        progress.complete();
        return id;
      } catch (error) {
        console.error('Failed to quick create:', error);
        progress.complete();
        throw error;
      }
    },
    
    quickDuplicate: async (id: string) => {
      try {
        progress.start();
        const newId = await store.quickDuplicate(id);
        progress.complete();
        return newId;
      } catch (error) {
        console.error('Failed to quick duplicate:', error);
        progress.complete();
        throw error;
      }
    },
    
    quickPublish: async (id: string) => {
      try {
        await store.quickPublish(id);
      } catch (error) {
        console.error('Failed to quick publish:', error);
        throw error;
      }
    },
    
    quickUnpublish: async (id: string) => {
      try {
        await store.quickUnpublish(id);
      } catch (error) {
        console.error('Failed to quick unpublish:', error);
        throw error;
      }
    },
  }), [store, progress]);
  
  // Throttled Actions (for real-time operations)
  const throttledActions = useMemo(() => ({
    moveElement: useThrottle((id: string, position: { x: number; y: number }) => {
      store.moveElement(id, position);
    }, 16), // ~60fps
    
    resizeElement: useThrottle((id: string, size: { width: number; height: number }) => {
      store.resizeElement(id, size);
    }, 16),
    
    updateElementProperty: useThrottle((id: string, property: string, value: any) => {
      store.updateElement(id, { properties: { [property]: value } });
    }, 100),
  }), [store]);
  
  // Debounced Actions (for search and filters)
  const debouncedActions = useMemo(() => ({
    setSearchQuery: useDebounce((query: string) => {
      store.setSearchQuery(query);
    }, 300),
    
    updateConfig: useDebounce((config: any) => {
      store.updateConfig(config);
    }, 500),
  }), [store]);
  
  // Enhanced Computed Values
  const computed = useMemo(() => ({
    // Template Statistics
    templateStats: {
      total: store.templates.length,
      public: store.templates.filter(t => t.isPublic).length,
      private: store.templates.filter(t => !t.isPublic).length,
      featured: store.templates.filter(t => t.isFeatured).length,
    },
    
    // Category Statistics
    categoryStats: store.categories.reduce((acc, category) => {
      acc[category.id] = {
        name: category.name,
        count: store.templates.filter(t => t.category === category.id).length,
        color: category.color,
      };
      return acc;
    }, {} as Record<string, any>),
    
    // Collection Statistics
    collectionStats: store.collections.reduce((acc, collection) => {
      acc[collection.id] = {
        name: collection.name,
        count: collection.templates.length,
        isPublic: collection.isPublic,
      };
      return acc;
    }, {} as Record<string, any>),
    
    // Current Template Statistics
    currentTemplateStats: store.currentTemplate ? {
      elementCount: store.currentTemplate.elements.length,
      animationCount: store.currentTemplate.elements.reduce((sum, el) => sum + el.animations.length, 0),
      interactionCount: store.currentTemplate.interactions.length,
      variableCount: store.currentTemplate.variables.length,
      complexity: getTemplateComplexity(store.currentTemplate),
    } : null,
    
    // Selection Statistics
    selectionStats: {
      count: store.selectedElements.length,
      types: store.currentTemplate ? 
        store.currentTemplate.elements
          .filter(el => store.selectedElements.includes(el.id))
          .reduce((acc, el) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) : {},
    },
    
    // History Statistics
    historyStats: {
      canUndo: store.historyIndex > 0,
      canRedo: store.historyIndex < store.history.length - 1,
      totalActions: store.history.length,
      currentIndex: store.historyIndex,
    },
    
    // Performance Metrics
    performanceMetrics: {
      loadTime: 0, // Would be calculated based on actual load times
      renderTime: 0, // Would be calculated based on render performance
      memoryUsage: 0, // Would be calculated based on memory usage
    },
  }), [
    store.templates,
    store.categories,
    store.collections,
    store.currentTemplate,
    store.selectedElements,
    store.history,
    store.historyIndex,
  ]);
  
  // Filtered Data
  const filteredData = useMemo(() => {
    let filtered = [...store.templates];
    
    // Apply search query
    if (store.searchQuery) {
      const query = store.searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (store.selectedCategory) {
      filtered = filtered.filter(template => template.category === store.selectedCategory);
    }
    
    // Apply filters
    if (store.filters.category.length > 0) {
      filtered = filtered.filter(template => store.filters.category.includes(template.category));
    }
    
    if (store.filters.tags.length > 0) {
      filtered = filtered.filter(template =>
        template.tags.some(tag => store.filters.tags.includes(tag))
      );
    }
    
    if (store.filters.rating > 0) {
      filtered = filtered.filter(template => template.rating >= store.filters.rating);
    }
    
    if (store.filters.isPublic !== null) {
      filtered = filtered.filter(template => template.isPublic === store.filters.isPublic);
    }
    
    if (store.filters.isFeatured !== null) {
      filtered = filtered.filter(template => template.isFeatured === store.filters.isFeatured);
    }
    
    // Apply date range filter
    if (store.filters.dateRange) {
      const [start, end] = store.filters.dateRange;
      filtered = filtered.filter(template => {
        const date = new Date(template.createdAt);
        return date >= start && date <= end;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (store.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'downloads':
          comparison = a.downloads - b.downloads;
          break;
        default:
          comparison = 0;
      }
      
      return store.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [
    store.templates,
    store.searchQuery,
    store.selectedCategory,
    store.filters,
    store.sortBy,
    store.sortOrder,
  ]);
  
  return {
    // State
    templates: store.templates,
    categories: store.categories,
    collections: store.collections,
    currentTemplate: store.currentTemplate,
    selectedElements: store.selectedElements,
    clipboard: store.clipboard,
    
    // UI State
    isLoading: store.isLoading,
    error: store.error,
    searchQuery: store.searchQuery,
    selectedCategory: store.selectedCategory,
    selectedCollection: store.selectedCollection,
    viewMode: store.viewMode,
    sortBy: store.sortBy,
    sortOrder: store.sortOrder,
    showFilters: store.showFilters,
    showPreview: store.showPreview,
    filters: store.filters,
    
    // Configuration
    config: store.config,
    
    // Statistics
    stats: store.stats,
    
    // Computed Values
    computed,
    
    // Filtered Data
    filteredTemplates: filteredData,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // UI Actions
    setViewMode: store.setViewMode,
    setSortBy: store.setSortBy,
    toggleFilters: store.toggleFilters,
    togglePreview: store.togglePreview,
    setCurrentTemplate: store.setCurrentTemplate,
    setFilters: store.setFilters,
    clearFilters: store.clearFilters,
    
    // System Actions
    refreshData: store.refreshData,
    syncData: store.syncData,
    clearCache: store.clearCache,
    resetState: store.resetState,
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    
    // Progress
    progress: progress.progress,
    isProgressActive: progress.isActive,
  };
};

// Specialized Hooks
export const useDynamicTemplatesStats = () => {
  const { stats, computed } = useDynamicTemplates();
  
  return {
    stats,
    computed,
    templateStats: computed.templateStats,
    categoryStats: computed.categoryStats,
    collectionStats: computed.collectionStats,
    currentTemplateStats: computed.currentTemplateStats,
    selectionStats: computed.selectionStats,
    historyStats: computed.historyStats,
    performanceMetrics: computed.performanceMetrics,
  };
};

export const useDynamicTemplatesConfig = () => {
  const { config, updateConfig, resetConfig } = useDynamicTemplates();
  
  return {
    config,
    updateConfig,
    resetConfig,
    
    // Convenience methods
    toggleAutoSave: () => updateConfig({ autoSave: !config.autoSave }),
    toggleAutoBackup: () => updateConfig({ autoBackup: !config.autoBackup }),
    setPreviewQuality: (quality: 'low' | 'medium' | 'high') => updateConfig({ previewQuality: quality }),
    setMaxVersions: (maxVersions: number) => updateConfig({ maxVersions }),
    setCacheSize: (cacheSize: number) => updateConfig({ cacheSize }),
  };
};

export const useDynamicTemplatesSearch = () => {
  const {
    searchQuery,
    selectedCategory,
    selectedCollection,
    filters,
    filteredTemplates,
    debouncedActions,
    setFilters,
    clearFilters,
  } = useDynamicTemplates();
  
  return {
    searchQuery,
    selectedCategory,
    selectedCollection,
    filters,
    filteredTemplates,
    
    // Actions
    setSearchQuery: debouncedActions.setSearchQuery,
    setFilters,
    clearFilters,
    
    // Convenience methods
    searchByName: (name: string) => debouncedActions.setSearchQuery(name),
    filterByCategory: (category: string) => setFilters({ category: [category] }),
    filterByTag: (tag: string) => setFilters({ tags: [tag] }),
    filterByRating: (rating: number) => setFilters({ rating }),
    filterByPublic: (isPublic: boolean) => setFilters({ isPublic }),
    filterByFeatured: (isFeatured: boolean) => setFilters({ isFeatured }),
  };
};

export const useDynamicTemplatesEditor = () => {
  const {
    currentTemplate,
    selectedElements,
    clipboard,
    actions,
    throttledActions,
    computed,
  } = useDynamicTemplates();
  
  return {
    currentTemplate,
    selectedElements,
    clipboard,
    currentTemplateStats: computed.currentTemplateStats,
    selectionStats: computed.selectionStats,
    historyStats: computed.historyStats,
    
    // Element Actions
    addElement: actions.addElement,
    updateElement: actions.updateElement,
    deleteElement: actions.deleteElement,
    
    // Selection Actions
    selectElement: actions.selectElement,
    selectAll: actions.selectAll,
    clearSelection: actions.clearSelection,
    
    // Clipboard Actions
    copy: actions.copy,
    cut: actions.cut,
    paste: actions.paste,
    
    // History Actions
    undo: actions.undo,
    redo: actions.redo,
    
    // Real-time Actions
    moveElement: throttledActions.moveElement,
    resizeElement: throttledActions.resizeElement,
    updateElementProperty: throttledActions.updateElementProperty,
  };
};

export const useDynamicTemplatesCategories = () => {
  const { categories, actions, computed } = useDynamicTemplates();
  
  return {
    categories,
    categoryStats: computed.categoryStats,
    
    // Actions
    createCategory: actions.createCategory,
    updateCategory: actions.updateCategory,
    deleteCategory: actions.deleteCategory,
  };
};

export const useDynamicTemplatesCollections = () => {
  const { collections, actions, computed } = useDynamicTemplates();
  
  return {
    collections,
    collectionStats: computed.collectionStats,
    
    // Actions
    createCollection: actions.createCollection,
    updateCollection: actions.updateCollection,
    deleteCollection: actions.deleteCollection,
    addToCollection: actions.addToCollection,
    removeFromCollection: actions.removeFromCollection,
  };
};

export const useDynamicTemplatesRealTime = () => {
  const store = useDynamicTemplatesStore();
  
  return {
    isConnected: store.isConnected,
    lastSync: store.lastSync,
    pendingChanges: store.pendingChanges,
    
    // Actions
    syncData: store.syncData,
    
    // Real-time status
    connectionStatus: store.isConnected ? 'connected' : 'disconnected',
    syncStatus: store.pendingChanges > 0 ? 'pending' : 'synced',
  };
};

// Utility Hooks
export const useTemplateThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number = 16): T => {
  return useThrottle(callback, delay);
};

export const useTemplateDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number = 300): T => {
  return useDebounce(callback, delay);
};

export const useTemplateProgress = () => {
  return useProgress();
};

// Helper Functions
const getTemplateComplexity = (template: DynamicTemplate): 'simple' | 'medium' | 'complex' => {
  const score = template.elements.length + 
                template.elements.reduce((sum, el) => sum + el.animations.length, 0) * 2 + 
                template.interactions.length * 3;
  
  if (score < 5) return 'simple';
  if (score < 15) return 'medium';
  return 'complex';
};

// Missing import
import { useState } from 'react';