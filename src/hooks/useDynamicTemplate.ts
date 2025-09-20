import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useDynamicTemplateStore,
  DynamicTemplate,
  TemplateInstance,
  TemplateComponent,
  TemplateVariable,
  TemplateCategory,
  TemplateConfig,
  TemplateStats,
  TemplateMetrics,
  DynamicTemplateManager
} from '../services/dynamicTemplateService';

// Utility functions
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Progress tracking hook
export const useTemplateProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  
  const startProgress = useCallback((step: string) => {
    setIsProcessing(true);
    setCurrentStep(step);
    setProgress(0);
  }, []);
  
  const updateProgress = useCallback((value: number, step?: string) => {
    setProgress(Math.min(100, Math.max(0, value)));
    if (step) setCurrentStep(step);
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('');
      setProgress(0);
    }, 500);
  }, []);
  
  return {
    progress,
    isProcessing,
    currentStep,
    startProgress,
    updateProgress,
    completeProgress
  };
};

// Main hook
export const useDynamicTemplate = () => {
  const store = useDynamicTemplateStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      store.refreshStats();
      store.refreshMetrics();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, store]);
  
  // Initialize on mount
  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, [store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Template actions
    createTemplate: store.addTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    duplicateTemplate: store.duplicateTemplate,
    
    // Instance actions
    createInstance: store.createInstance,
    updateInstance: store.updateInstance,
    deleteInstance: store.deleteInstance,
    publishInstance: store.publishInstance,
    
    // Component actions
    addComponent: store.addComponent,
    updateComponent: store.updateComponent,
    deleteComponent: store.deleteComponent,
    duplicateComponent: store.duplicateComponent,
    
    // Variable actions
    addVariable: store.addVariable,
    updateVariable: store.updateVariable,
    deleteVariable: store.deleteVariable,
    
    // Selection actions
    selectComponent: store.selectComponent,
    selectMultipleComponents: store.selectMultipleComponents,
    clearSelection: store.clearSelection,
    copyComponents: store.copyComponents,
    pasteComponents: store.pasteComponents,
    
    // Editor actions
    setEditorMode: store.setEditorMode,
    setZoom: store.setZoom,
    toggleGrid: store.toggleGrid,
    toggleGuides: store.toggleGuides,
    
    // AI actions
    generateTemplate: store.generateTemplate,
    optimizeTemplate: store.optimizeTemplate,
    generateContent: store.generateContent,
    getSuggestions: store.getSuggestions,
    
    // Import/Export actions
    exportTemplate: store.exportTemplate,
    importTemplate: store.importTemplate,
    exportInstance: store.exportInstance,
    
    // Configuration actions
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    
    // Analytics actions
    refreshStats: store.refreshStats,
    refreshMetrics: store.refreshMetrics,
    generateReport: store.generateReport
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickCreateTemplate: async (name: string, category: string) => {
      try {
        store.setLoading(true);
        const templateData = {
          name,
          description: `Template created for ${category}`,
          category,
          tags: [category],
          version: '1.0.0',
          author: 'User',
          variables: [],
          components: [],
          layout: {
            id: 'layout_1',
            name: 'Default Layout',
            type: 'grid' as const,
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
            format: 'web' as const,
            orientation: 'landscape' as const,
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
            autoLayout: false,
            smartSuggestions: true,
            contentGeneration: false,
            styleOptimization: false
          },
          collaboration: {
            isPublic: false,
            allowForks: true,
            contributors: [],
            permissions: {}
          },
          exportOptions: {
            formats: ['png', 'jpg', 'svg'],
            quality: { high: 300, medium: 150, low: 72 },
            optimization: { compress: true, optimize: true }
          }
        };
        
        store.addTemplate(templateData);
        return true;
      } catch (error) {
        store.setError('Failed to create template');
        return false;
      } finally {
        store.setLoading(false);
      }
    },
    
    quickAddTextComponent: (text: string, x: number = 100, y: number = 100) => {
      try {
        const component = {
          type: 'text' as const,
          name: 'Text Component',
          properties: { text, fontSize: 16, fontFamily: 'Inter' },
          style: { color: '#000000', backgroundColor: 'transparent' },
          position: { x, y, width: 200, height: 50, zIndex: 1 },
          variables: [],
          animations: {},
          interactions: {}
        };
        
        store.addComponent(component);
        return true;
      } catch (error) {
        store.setError('Failed to add text component');
        return false;
      }
    },
    
    quickAddImageComponent: (src: string, x: number = 100, y: number = 100) => {
      try {
        const component = {
          type: 'image' as const,
          name: 'Image Component',
          properties: { src, alt: 'Image' },
          style: { borderRadius: '0px' },
          position: { x, y, width: 300, height: 200, zIndex: 1 },
          variables: [],
          animations: {},
          interactions: {}
        };
        
        store.addComponent(component);
        return true;
      } catch (error) {
        store.setError('Failed to add image component');
        return false;
      }
    },
    
    quickCreateVariable: (name: string, type: TemplateVariable['type'], defaultValue: any) => {
      try {
        const variable = {
          name,
          type,
          defaultValue,
          required: false,
          category: 'general',
          description: `Variable for ${name}`
        };
        
        store.addVariable(variable);
        return true;
      } catch (error) {
        store.setError('Failed to create variable');
        return false;
      }
    }
  }), [store]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    throttledUpdateComponent: throttle(store.updateComponent, 100),
    throttledSetZoom: throttle(store.setZoom, 50),
    throttledSearch: throttle(store.setSearchQuery, 300)
  }), [store]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    debouncedUpdateTemplate: debounce(store.updateTemplate, 500),
    debouncedUpdateInstance: debounce(store.updateInstance, 500),
    debouncedUpdateConfig: debounce(store.updateConfig, 1000)
  }), [store]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const { templates, instances, categories, searchQuery, selectedCategory, selectedFormat, sortBy } = store;
    
    // Filter templates
    let filteredTemplates = templates;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      filteredTemplates = filteredTemplates.filter(template =>
        template.category === selectedCategory
      );
    }
    
    if (selectedFormat && selectedFormat !== 'all') {
      filteredTemplates = filteredTemplates.filter(template =>
        template.metadata.format === selectedFormat
      );
    }
    
    // Sort templates
    filteredTemplates.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'rating':
          return b.analytics.rating - a.analytics.rating;
        case 'usage':
          return b.analytics.usageCount - a.analytics.usageCount;
        default:
          return 0;
      }
    });
    
    // Filter instances
    let filteredInstances = instances;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredInstances = filteredInstances.filter(instance =>
        instance.name.toLowerCase().includes(query)
      );
    }
    
    // Calculate statistics
    const totalComponents = templates.reduce((sum, template) => sum + template.components.length, 0);
    const totalVariables = templates.reduce((sum, template) => sum + template.variables.length, 0);
    const averageRating = templates.length > 0
      ? templates.reduce((sum, template) => sum + template.analytics.rating, 0) / templates.length
      : 0;
    
    return {
      filteredTemplates,
      filteredInstances,
      totalComponents,
      totalVariables,
      averageRating,
      hasSelection: store.selectedComponents.length > 0,
      canPaste: store.clipboard.length > 0,
      isEditing: store.currentTemplate !== null,
      hasUnsavedChanges: false // This would be calculated based on actual state
    };
  }, [
    store.templates,
    store.instances,
    store.categories,
    store.searchQuery,
    store.selectedCategory,
    store.selectedFormat,
    store.sortBy,
    store.selectedComponents,
    store.clipboard,
    store.currentTemplate
  ]);
  
  return {
    // State
    ...store,
    
    // Computed values
    ...computed,
    
    // Actions
    ...actions,
    ...quickActions,
    ...throttledActions,
    ...debouncedActions,
    
    // Settings
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };
};

// Specialized hooks
export const useTemplateStats = () => {
  const { stats, refreshStats } = useDynamicTemplateStore();
  
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  
  return { stats, refreshStats };
};

export const useTemplateConfig = () => {
  const { config, updateConfig, resetConfig } = useDynamicTemplateStore();
  
  const updateEditorConfig = useCallback((updates: Partial<TemplateConfig['editor']>) => {
    updateConfig({ editor: { ...config.editor, ...updates } });
  }, [config.editor, updateConfig]);
  
  const updateRenderingConfig = useCallback((updates: Partial<TemplateConfig['rendering']>) => {
    updateConfig({ rendering: { ...config.rendering, ...updates } });
  }, [config.rendering, updateConfig]);
  
  const updateAIConfig = useCallback((updates: Partial<TemplateConfig['ai']>) => {
    updateConfig({ ai: { ...config.ai, ...updates } });
  }, [config.ai, updateConfig]);
  
  return {
    config,
    updateConfig,
    updateEditorConfig,
    updateRenderingConfig,
    updateAIConfig,
    resetConfig
  };
};

export const useTemplateSearch = () => {
  const {
    searchQuery,
    selectedCategory,
    selectedFormat,
    sortBy,
    viewMode,
    setSearchQuery,
    setSelectedCategory,
    setSelectedFormat,
    setSortBy,
    setViewMode
  } = useDynamicTemplateStore();
  
  const debouncedSearch = useMemo(
    () => debounce(setSearchQuery, 300),
    [setSearchQuery]
  );
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedFormat('all');
    setSortBy('name');
  }, [setSearchQuery, setSelectedCategory, setSelectedFormat, setSortBy]);
  
  return {
    searchQuery,
    selectedCategory,
    selectedFormat,
    sortBy,
    viewMode,
    setSearchQuery: debouncedSearch,
    setSelectedCategory,
    setSelectedFormat,
    setSortBy,
    setViewMode,
    clearFilters
  };
};

export const useCurrentTemplate = () => {
  const {
    currentTemplate,
    updateTemplate,
    selectedComponents,
    selectComponent,
    selectMultipleComponents,
    clearSelection
  } = useDynamicTemplateStore();
  
  const updateCurrentTemplate = useCallback((updates: Partial<DynamicTemplate>) => {
    if (currentTemplate) {
      updateTemplate(currentTemplate.id, updates);
    }
  }, [currentTemplate, updateTemplate]);
  
  const getSelectedComponents = useCallback(() => {
    if (!currentTemplate) return [];
    return currentTemplate.components.filter(component =>
      selectedComponents.includes(component.id)
    );
  }, [currentTemplate, selectedComponents]);
  
  return {
    currentTemplate,
    updateCurrentTemplate,
    selectedComponents,
    getSelectedComponents,
    selectComponent,
    selectMultipleComponents,
    clearSelection,
    hasTemplate: currentTemplate !== null,
    hasSelection: selectedComponents.length > 0
  };
};

export const useTemplateCategories = () => {
  const { categories } = useDynamicTemplateStore();
  
  const getCategoryById = useCallback((id: string) => {
    return categories.find(category => category.id === id);
  }, [categories]);
  
  const getPopularCategories = useCallback(() => {
    return categories.filter(category => category.isPopular);
  }, [categories]);
  
  const getCategoriesByParent = useCallback((parentId?: string) => {
    return categories.filter(category => category.parentId === parentId);
  }, [categories]);
  
  return {
    categories,
    getCategoryById,
    getPopularCategories,
    getCategoriesByParent
  };
};

export const useTemplateAnalytics = () => {
  const { stats, metrics, refreshStats, refreshMetrics, generateReport } = useDynamicTemplateStore();
  
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const generateAnalyticsReport = useCallback(async (type: string, period: string) => {
    setIsGeneratingReport(true);
    try {
      await generateReport(type, period);
      // In a real implementation, this would return actual report data
      setReportData({
        type,
        period,
        generatedAt: new Date(),
        data: { /* report data */ }
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [generateReport]);
  
  return {
    stats,
    metrics,
    reportData,
    isGeneratingReport,
    refreshStats,
    refreshMetrics,
    generateAnalyticsReport
  };
};

// Utility hooks
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useMemo(() => throttle(callback, delay), [callback, delay]);
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useMemo(() => debounce(callback, delay), [callback, delay]);
};

// Helper functions
export const calculateTemplateComplexity = (template: DynamicTemplate): number => {
  let complexity = 0;
  
  // Base complexity from components
  complexity += template.components.length * 2;
  
  // Add complexity for variables
  complexity += template.variables.length;
  
  // Add complexity for interactions
  template.components.forEach(component => {
    if (component.interactions && Object.keys(component.interactions).length > 0) {
      complexity += 3;
    }
    if (component.animations && Object.keys(component.animations).length > 0) {
      complexity += 2;
    }
    if (component.conditions) {
      complexity += 2;
    }
  });
  
  // Add complexity for AI features
  if (template.aiFeatures.autoLayout) complexity += 5;
  if (template.aiFeatures.smartSuggestions) complexity += 3;
  if (template.aiFeatures.contentGeneration) complexity += 4;
  if (template.aiFeatures.styleOptimization) complexity += 3;
  
  return Math.min(100, complexity);
};

export default useDynamicTemplate;