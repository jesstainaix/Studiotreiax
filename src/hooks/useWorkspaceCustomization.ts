import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useWorkspaceCustomizationStore,
  WorkspaceLayout,
  WorkspaceTheme,
  WorkspaceTemplate,
  WorkspacePreferences,
  CustomizationFilter,
  CustomizationStats
} from '../services/workspaceCustomizationService';

// Throttle and Debounce Utilities
const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number) => {
  const [lastCall, setLastCall] = useState(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      setLastCall(now);
      return callback(...args);
    }
  }, [callback, delay, lastCall]);
};

const useDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);
};

// Progress Tracking Hook
const useProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const startProgress = useCallback(() => {
    setIsActive(true);
    setProgress(0);
  }, []);
  
  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsActive(false);
      setProgress(0);
    }, 500);
  }, []);
  
  return { progress, isActive, startProgress, updateProgress, completeProgress };
};

// Main Hook
export const useWorkspaceCustomization = () => {
  // Store state
  const {
    layouts,
    themes,
    templates,
    preferences,
    currentLayout,
    currentTheme,
    activeTemplate,
    filter,
    searchQuery,
    selectedLayoutId,
    selectedThemeId,
    selectedTemplateId,
    showPreview,
    isCustomizing,
    loading,
    error,
    lastUpdated,
    computedValues,
    
    // Actions
    setFilter,
    setSearch,
    clearFilters,
    setSelectedLayoutId,
    setSelectedThemeId,
    setSelectedTemplateId,
    setShowPreview,
    setIsCustomizing,
    
    // Management
    createLayout,
    updateLayout,
    deleteLayout,
    duplicateLayout,
    applyLayout,
    resetLayout,
    createTheme,
    updateTheme,
    deleteTheme,
    duplicateTheme,
    applyTheme,
    resetTheme,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    shareTemplate,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    
    // Panel Management
    addPanel,
    updatePanel,
    removePanel,
    movePanel,
    resizePanel,
    togglePanelVisibility,
    togglePanelCollapse,
    
    // Quick Actions
    quickActions,
    
    // Advanced Features
    advancedFeatures,
    
    // System Operations
    systemOps,
    
    // Utilities
    customizationUtils,
    configUtils,
    analyticsUtils,
    debugHelpers
  } = useWorkspaceCustomizationStore();
  
  // Local state for UI interactions
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      systemOps.refresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, systemOps]);
  
  // Initialize with demo data
  useEffect(() => {
    const initializeDemoData = async () => {
      if (layouts.length === 0) {
        setLocalLoading(true);
        try {
          // Create demo layouts
          await createLayout({
            name: 'Layout Clássico',
            description: 'Layout tradicional com timeline na parte inferior',
            type: 'grid',
            configuration: {
              panels: [
                {
                  id: 'preview',
                  type: 'preview',
                  title: 'Visualização',
                  position: { x: 0, y: 0, width: 70, height: 60 },
                  isVisible: true,
                  isResizable: true,
                  isDraggable: true,
                  isCollapsible: false,
                  isCollapsed: false,
                  zIndex: 1,
                  settings: {}
                },
                {
                  id: 'timeline',
                  type: 'timeline',
                  title: 'Timeline',
                  position: { x: 0, y: 60, width: 100, height: 40 },
                  isVisible: true,
                  isResizable: true,
                  isDraggable: true,
                  isCollapsible: false,
                  isCollapsed: false,
                  zIndex: 1,
                  settings: {}
                },
                {
                  id: 'properties',
                  type: 'properties',
                  title: 'Propriedades',
                  position: { x: 70, y: 0, width: 30, height: 60 },
                  isVisible: true,
                  isResizable: true,
                  isDraggable: true,
                  isCollapsible: true,
                  isCollapsed: false,
                  zIndex: 1,
                  settings: {}
                }
              ],
              grid: {
                columns: 12,
                rows: 8,
                gap: 8
              }
            },
            isDefault: true,
            isCustom: false,
            tags: ['clássico', 'tradicional', 'timeline']
          });
          
          await createLayout({
            name: 'Layout Moderno',
            description: 'Layout moderno com painéis flutuantes',
            type: 'floating',
            configuration: {
              panels: [
                {
                  id: 'preview',
                  type: 'preview',
                  title: 'Visualização',
                  position: { x: 10, y: 10, width: 60, height: 70 },
                  isVisible: true,
                  isResizable: true,
                  isDraggable: true,
                  isCollapsible: false,
                  isCollapsed: false,
                  zIndex: 2,
                  settings: {}
                },
                {
                  id: 'assets',
                  type: 'assets',
                  title: 'Recursos',
                  position: { x: 75, y: 10, width: 20, height: 40 },
                  isVisible: true,
                  isResizable: true,
                  isDraggable: true,
                  isCollapsible: true,
                  isCollapsed: false,
                  zIndex: 1,
                  settings: {}
                },
                {
                  id: 'effects',
                  type: 'effects',
                  title: 'Efeitos',
                  position: { x: 75, y: 55, width: 20, height: 35 },
                  isVisible: true,
                  isResizable: true,
                  isDraggable: true,
                  isCollapsible: true,
                  isCollapsed: false,
                  zIndex: 1,
                  settings: {}
                }
              ]
            },
            isDefault: false,
            isCustom: false,
            tags: ['moderno', 'flutuante', 'minimalista']
          });
          
          // Create demo themes
          await createTheme({
            name: 'Tema Claro',
            description: 'Tema claro e limpo para trabalho diurno',
            type: 'light',
            colors: {
              primary: '#3b82f6',
              secondary: '#64748b',
              background: '#ffffff',
              surface: '#f8fafc',
              text: '#1e293b',
              accent: '#06b6d4',
              success: '#10b981',
              warning: '#f59e0b',
              error: '#ef4444',
              info: '#3b82f6'
            },
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem'
              },
              fontWeight: {
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700
              }
            },
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem'
            },
            borderRadius: {
              sm: '0.25rem',
              md: '0.375rem',
              lg: '0.5rem',
              xl: '0.75rem'
            },
            shadows: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
            },
            isDefault: true,
            isCustom: false
          });
          
          await createTheme({
            name: 'Tema Escuro',
            description: 'Tema escuro para reduzir fadiga visual',
            type: 'dark',
            colors: {
              primary: '#60a5fa',
              secondary: '#94a3b8',
              background: '#0f172a',
              surface: '#1e293b',
              text: '#f1f5f9',
              accent: '#22d3ee',
              success: '#34d399',
              warning: '#fbbf24',
              error: '#f87171',
              info: '#60a5fa'
            },
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem'
              },
              fontWeight: {
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700
              }
            },
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem'
            },
            borderRadius: {
              sm: '0.25rem',
              md: '0.375rem',
              lg: '0.5rem',
              xl: '0.75rem'
            },
            shadows: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
              md: '0 4px 6px -1px rgb(0 0 0 / 0.25)',
              lg: '0 10px 15px -3px rgb(0 0 0 / 0.25)',
              xl: '0 20px 25px -5px rgb(0 0 0 / 0.25)'
            },
            isDefault: false,
            isCustom: false
          });
          
          // Create demo templates
          const defaultLayout = layouts.find(l => l.isDefault) || layouts[0];
          const defaultTheme = themes.find(t => t.isDefault) || themes[0];
          
          if (defaultLayout && defaultTheme) {
            await createTemplate({
              name: 'Template Básico',
              description: 'Template básico para iniciantes',
              category: 'video',
              layout: defaultLayout,
              theme: defaultTheme,
              preferences: {},
              isDefault: true,
              isPublic: true,
              tags: ['básico', 'iniciante', 'video'],
              author: {
                id: 'system',
                name: 'Studio Treiax',
                avatar: '/avatars/system.png'
              }
            });
          }
          
        } catch (error) {
          setLocalError('Erro ao inicializar dados de demonstração');
          console.error('Demo data initialization error:', error);
        } finally {
          setLocalLoading(false);
        }
      }
    };
    
    initializeDemoData();
  }, [layouts.length, themes.length, createLayout, createTheme, createTemplate]);
  
  // Memoized actions with error handling
  const memoizedActions = useMemo(() => ({
    // Layout actions
    handleCreateLayout: async (layoutData: Omit<WorkspaceLayout, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        const result = await createLayout(layoutData);
        await analyticsUtils.trackEvent({
          type: 'layout_created',
          userId: 'current-user',
          targetId: result.id,
          targetType: 'layout',
          metadata: { name: result.name, type: result.type }
        });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar layout';
        setLocalError(errorMessage);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    
    handleApplyLayout: async (id: string) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        await applyLayout(id);
        await analyticsUtils.trackEvent({
          type: 'layout_applied',
          userId: 'current-user',
          targetId: id,
          targetType: 'layout',
          metadata: {}
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao aplicar layout';
        setLocalError(errorMessage);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    
    // Theme actions
    handleCreateTheme: async (themeData: Omit<WorkspaceTheme, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        const result = await createTheme(themeData);
        await analyticsUtils.trackEvent({
          type: 'theme_changed',
          userId: 'current-user',
          targetId: result.id,
          targetType: 'theme',
          metadata: { name: result.name, type: result.type }
        });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar tema';
        setLocalError(errorMessage);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    
    handleApplyTheme: async (id: string) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        await applyTheme(id);
        await analyticsUtils.trackEvent({
          type: 'theme_changed',
          userId: 'current-user',
          targetId: id,
          targetType: 'theme',
          metadata: {}
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao aplicar tema';
        setLocalError(errorMessage);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    
    // Template actions
    handleApplyTemplate: async (id: string) => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        await applyTemplate(id);
        await analyticsUtils.trackEvent({
          type: 'template_used',
          userId: 'current-user',
          targetId: id,
          targetType: 'template',
          metadata: {}
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao aplicar template';
        setLocalError(errorMessage);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    
    // Panel actions
    handleMovePanel: async (id: string, position: { x: number; y: number }) => {
      try {
        await movePanel(id, position);
        await analyticsUtils.trackEvent({
          type: 'panel_moved',
          userId: 'current-user',
          targetId: id,
          targetType: 'panel',
          metadata: { position }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao mover painel';
        setLocalError(errorMessage);
        throw error;
      }
    },
    
    handleResizePanel: async (id: string, size: { width: number; height: number }) => {
      try {
        await resizePanel(id, size);
        await analyticsUtils.trackEvent({
          type: 'panel_resized',
          userId: 'current-user',
          targetId: id,
          targetType: 'panel',
          metadata: { size }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao redimensionar painel';
        setLocalError(errorMessage);
        throw error;
      }
    }
  }), [
    createLayout, applyLayout, createTheme, applyTheme, applyTemplate,
    movePanel, resizePanel, analyticsUtils
  ]);
  
  // Quick actions with progress tracking
  const { progress, isActive, startProgress, updateProgress, completeProgress } = useProgress();
  
  const quickActionsWithProgress = useMemo(() => ({
    ...quickActions,
    
    saveCurrentAsLayoutWithProgress: async (name: string) => {
      startProgress();
      try {
        updateProgress(25);
        const result = await quickActions.saveCurrentAsLayout(name);
        updateProgress(75);
        await analyticsUtils.trackEvent({
          type: 'layout_created',
          userId: 'current-user',
          targetId: result.id,
          targetType: 'layout',
          metadata: { name, source: 'quick_save' }
        });
        updateProgress(100);
        completeProgress();
        return result;
      } catch (error) {
        completeProgress();
        throw error;
      }
    },
    
    exportWorkspaceWithProgress: async () => {
      startProgress();
      try {
        updateProgress(30);
        const result = await quickActions.exportWorkspace();
        updateProgress(80);
        await analyticsUtils.trackEvent({
          type: 'layout_created',
          userId: 'current-user',
          targetId: 'export',
          targetType: 'layout',
          metadata: { action: 'export' }
        });
        updateProgress(100);
        completeProgress();
        return result;
      } catch (error) {
        completeProgress();
        throw error;
      }
    }
  }), [quickActions, analyticsUtils, startProgress, updateProgress, completeProgress]);
  
  // Throttled and debounced actions
  const throttledSetFilter = useThrottle(setFilter, 300);
  const debouncedSetSearch = useDebounce(setSearch, 500);
  
  // Computed values with additional processing
  const enhancedComputedValues = useMemo(() => ({
    ...computedValues,
    
    // Additional computed values
    hasCustomizations: computedValues.customLayouts.length > 0 || computedValues.customThemes.length > 0,
    
    customizationProgress: {
      layouts: Math.min(100, (computedValues.customLayouts.length / 10) * 100),
      themes: Math.min(100, (computedValues.customThemes.length / 5) * 100),
      overall: Math.min(100, ((computedValues.customLayouts.length + computedValues.customThemes.length) / 15) * 100)
    },
    
    quickStats: {
      totalCustomizations: computedValues.customLayouts.length + computedValues.customThemes.length,
      mostUsedLayout: layouts.reduce((prev, current) => 
        (prev.usageCount > current.usageCount) ? prev : current, layouts[0]
      ),
      newestCustomization: [...computedValues.customLayouts, ...computedValues.customThemes]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    },
    
    recommendations: {
      layouts: customizationUtils.getRecommendations('layout'),
      themes: customizationUtils.getRecommendations('theme'),
      templates: customizationUtils.getRecommendations('template')
    }
  }), [computedValues, layouts, customizationUtils]);
  
  // Error handling
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);
  
  // Auto-refresh controls
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);
  
  const updateRefreshInterval = useCallback((interval: number) => {
    setRefreshInterval(interval);
  }, []);
  
  return {
    // State
    layouts,
    themes,
    templates,
    preferences,
    currentLayout,
    currentTheme,
    activeTemplate,
    filter,
    searchQuery,
    selectedLayoutId,
    selectedThemeId,
    selectedTemplateId,
    showPreview,
    isCustomizing,
    loading: loading || localLoading,
    error: error || localError,
    lastUpdated,
    
    // Enhanced computed values
    computedValues: enhancedComputedValues,
    
    // Basic actions
    setFilter: throttledSetFilter,
    setSearch: debouncedSetSearch,
    clearFilters,
    setSelectedLayoutId,
    setSelectedThemeId,
    setSelectedTemplateId,
    setShowPreview,
    setIsCustomizing,
    clearError,
    
    // Enhanced actions
    actions: memoizedActions,
    
    // Management functions
    management: {
      layouts: {
        create: createLayout,
        update: updateLayout,
        delete: deleteLayout,
        duplicate: duplicateLayout,
        apply: memoizedActions.handleApplyLayout,
        reset: resetLayout
      },
      themes: {
        create: createTheme,
        update: updateTheme,
        delete: deleteTheme,
        duplicate: duplicateTheme,
        apply: memoizedActions.handleApplyTheme,
        reset: resetTheme
      },
      templates: {
        create: createTemplate,
        update: updateTemplate,
        delete: deleteTemplate,
        apply: memoizedActions.handleApplyTemplate,
        share: shareTemplate
      },
      preferences: {
        update: updatePreferences,
        reset: resetPreferences,
        export: exportPreferences,
        import: importPreferences
      },
      panels: {
        add: addPanel,
        update: updatePanel,
        remove: removePanel,
        move: memoizedActions.handleMovePanel,
        resize: memoizedActions.handleResizePanel,
        toggleVisibility: togglePanelVisibility,
        toggleCollapse: togglePanelCollapse
      }
    },
    
    // Quick actions with progress
    quickActions: quickActionsWithProgress,
    quickActionsProgress: { progress, isActive },
    
    // Advanced features
    advancedFeatures,
    
    // System operations
    systemOps,
    
    // Utilities
    utils: {
      customization: customizationUtils,
      config: configUtils,
      analytics: analyticsUtils,
      debug: debugHelpers
    },
    
    // Auto-refresh controls
    autoRefresh: {
      enabled: autoRefresh,
      interval: refreshInterval,
      toggle: toggleAutoRefresh,
      updateInterval: updateRefreshInterval
    }
  };
};

// Specialized Hooks
export const useWorkspaceCustomizationStats = () => {
  const { analyticsUtils } = useWorkspaceCustomizationStore();
  const [stats, setStats] = useState<CustomizationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsUtils.getStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, [analyticsUtils]);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
};

export const useWorkspaceCustomizationConfig = () => {
  const { configUtils } = useWorkspaceCustomizationStore();
  const [config, setConfig] = useState(configUtils.getConfig());
  
  const updateConfig = useCallback(async (updates: any) => {
    await configUtils.updateConfig(updates);
    setConfig(configUtils.getConfig());
  }, [configUtils]);
  
  const resetConfig = useCallback(async () => {
    await configUtils.resetConfig();
    setConfig(configUtils.getConfig());
  }, [configUtils]);
  
  const getConfigValue = useCallback((key: string) => {
    return configUtils.getConfigValue(key);
  }, [configUtils]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    getConfigValue
  };
};

export const useWorkspaceCustomizationAnalytics = () => {
  const { analyticsUtils } = useWorkspaceCustomizationStore();
  
  const trackEvent = useCallback(async (event: any) => {
    await analyticsUtils.trackEvent(event);
  }, [analyticsUtils]);
  
  const getUsageReport = useCallback(async (period: 'day' | 'week' | 'month') => {
    return await analyticsUtils.getUsageReport(period);
  }, [analyticsUtils]);
  
  const getPopularItems = useCallback(async (type: 'layout' | 'theme' | 'template', limit?: number) => {
    return await analyticsUtils.getPopularItems(type, limit);
  }, [analyticsUtils]);
  
  return {
    trackEvent,
    getUsageReport,
    getPopularItems
  };
};

export const useWorkspaceCustomizationRealtime = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  useEffect(() => {
    // Simulate real-time connection
    setIsConnected(true);
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);
  
  return {
    isConnected,
    lastUpdate,
    updateCount
  };
};

// Utility Hooks
export const useWorkspaceCustomizationThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
) => {
  return useThrottle(callback, delay);
};

export const useWorkspaceCustomizationDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
) => {
  return useDebounce(callback, delay);
};

export const useWorkspaceCustomizationProgress = () => {
  return useProgress();
};