import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UITheme, UIComponent, UILayout, UIAnimation, UIPreferences } from './useAdvancedUI';

const defaultConfig = {
  theme: 'light',
  animations: true,
  autoSave: true,
  notifications: true,
  language: 'en',
  accessibility: true
};

// Simple mock state
const createInitialState = () => ({
  themes: [{ id: 'light', name: 'Light Theme', colors: { primary: '#007bff' } }],
  currentTheme: { id: 'light', name: 'Light Theme', colors: { primary: '#007bff' } },
  components: [],
  layouts: [],
  animations: [],
  preferences: { theme: 'light', animations: true },
  metrics: { performanceScore: 85, totalComponents: 0, totalLayouts: 0, totalAnimations: 0, activeAnimations: 0, renderTime: 0 }
});

export const useAdvancedUISimplified = (config = defaultConfig) => {
  // Core state
  const [state, setState] = useState(createInitialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize
  useEffect(() => {
    setInitialized(true);
  }, []);

  // Helper function for operations
  const handleOperation = useCallback(async (operation: () => void, errorMessage: string) => {
    try {
      setIsLoading(true);
      operation();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Theme actions
  const setTheme = useCallback((themeId: string) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        currentTheme: prev.themes.find(t => t.id === themeId) || prev.currentTheme
      }));
    }, 'Failed to set theme');
  }, [handleOperation]);
  
  const addTheme = useCallback((theme: UITheme) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        themes: [...prev.themes, theme]
      }));
    }, 'Failed to add theme');
  }, [handleOperation]);

  // Component actions
  const addComponent = useCallback((component: UIComponent) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        components: [...prev.components, component],
        metrics: { ...prev.metrics, totalComponents: prev.components.length + 1 }
      }));
    }, 'Failed to add component');
  }, [handleOperation]);
  
  const updateComponent = useCallback((componentId: string, updates: Partial<UIComponent>) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        components: prev.components.map(c => c.id === componentId ? { ...c, ...updates } : c)
      }));
    }, 'Failed to update component');
  }, [handleOperation]);
  
  const removeComponent = useCallback((componentId: string) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        components: prev.components.filter(c => c.id !== componentId),
        metrics: { ...prev.metrics, totalComponents: Math.max(0, prev.components.length - 1) }
      }));
    }, 'Failed to remove component');
  }, [handleOperation]);

  // Layout actions
  const addLayout = useCallback((layout: UILayout) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        layouts: [...prev.layouts, layout],
        metrics: { ...prev.metrics, totalLayouts: prev.layouts.length + 1 }
      }));
    }, 'Failed to add layout');
  }, [handleOperation]);

  // Animation actions
  const addAnimation = useCallback((animation: UIAnimation) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        animations: [...prev.animations, animation],
        metrics: { ...prev.metrics, totalAnimations: prev.animations.length + 1 }
      }));
    }, 'Failed to add animation');
  }, [handleOperation]);

  // Preferences
  const updatePreferences = useCallback((updates: Partial<UIPreferences>) => {
    handleOperation(() => {
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...updates }
      }));
    }, 'Failed to update preferences');
  }, [handleOperation]);

  // Computed values
  const computedValues = useMemo(() => ({
    totalComponents: state.components.length,
    activeComponents: state.components.filter(c => c.status === 'active').length,
    systemHealth: Math.max(0, Math.min(100, state.metrics.performanceScore || 85))
  }), [state.components, state.metrics.performanceScore]);

  return {
    // State
    themes: state.themes,
    currentTheme: state.currentTheme,
    components: state.components,
    layouts: state.layouts,
    animations: state.animations,
    preferences: state.preferences,
    metrics: state.metrics,
    isLoading,
    error,
    initialized,
    
    // Computed
    ...computedValues,
    
    // Actions
    setTheme,
    addTheme,
    addComponent,
    updateComponent,
    removeComponent,
    addLayout,
    addAnimation,
    updatePreferences
  };
};

export default useAdvancedUISimplified;