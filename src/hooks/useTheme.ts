import { useEffect, useCallback, useMemo } from 'react';
import { useTheme as useThemeStore, ThemeConfig, ThemePreset, ThemeManagerConfig } from '../utils/themeManager';

// Hook Options
export interface UseThemeOptions {
  autoInit?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableTransitions?: boolean;
  respectSystemPreference?: boolean;
}

// Hook Return Type
export interface UseThemeReturn {
  // Current State
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  presets: ThemePreset[];
  config: ThemeManagerConfig;
  isTransitioning: boolean;
  systemPreference: 'light' | 'dark';
  customThemes: ThemeConfig[];
  
  // Theme Management
  setTheme: (themeId: string) => void;
  createTheme: (theme: Omit<ThemeConfig, 'id'>) => void;
  updateTheme: (themeId: string, updates: Partial<ThemeConfig>) => void;
  deleteTheme: (themeId: string) => void;
  duplicateTheme: (themeId: string, newName: string) => void;
  
  // Preset Management
  loadPreset: (presetId: string) => void;
  createPreset: (preset: Omit<ThemePreset, 'id'>) => void;
  updatePreset: (presetId: string, updates: Partial<ThemePreset>) => void;
  deletePreset: (presetId: string) => void;
  
  // System Actions
  toggleTheme: () => void;
  resetToDefault: () => void;
  detectSystemPreference: () => void;
  
  // Configuration
  updateConfig: (updates: Partial<ThemeManagerConfig>) => void;
  
  // Utilities
  exportThemes: () => string;
  importThemes: (data: string) => void;
  generateCSS: (theme?: ThemeConfig) => string;
  
  // Derived State
  isDarkMode: boolean;
  isLightMode: boolean;
  isAutoMode: boolean;
  themeType: 'light' | 'dark' | 'auto';
  
  // Quick Actions
  switchToLight: () => void;
  switchToDark: () => void;
  switchToAuto: () => void;
  
  // Advanced Actions
  createLightVariant: (baseTheme: ThemeConfig, name: string) => void;
  createDarkVariant: (baseTheme: ThemeConfig, name: string) => void;
  createCustomVariant: (baseTheme: ThemeConfig, name: string, colorOverrides: Partial<ThemeConfig['colors']>) => void;
}

// Main Hook
export const useTheme = (options: UseThemeOptions = {}): UseThemeReturn => {
  const {
    autoInit = true,
    enablePerformanceMonitoring = true,
    enableTransitions = true,
    respectSystemPreference = true
  } = options;
  
  const store = useThemeStore();
  
  // Initialize theme system
  useEffect(() => {
    if (autoInit) {
      store.detectSystemPreference();
      
      if (enablePerformanceMonitoring) {
        store.measurePerformance();
      }
      
      // Update config based on options
      store.updateConfig({
        enableTransitions,
        autoDetectSystem: respectSystemPreference,
        enablePerformanceMonitoring
      });
    }
  }, [autoInit, enablePerformanceMonitoring, enableTransitions, respectSystemPreference, store]);
  
  // Quick Actions
  const switchToLight = useCallback(() => {
    const lightTheme = store.availableThemes.find(t => t.type === 'light');
    if (lightTheme) {
      store.setTheme(lightTheme.id);
    }
  }, [store]);
  
  const switchToDark = useCallback(() => {
    const darkTheme = store.availableThemes.find(t => t.type === 'dark');
    if (darkTheme) {
      store.setTheme(darkTheme.id);
    }
  }, [store]);
  
  const switchToAuto = useCallback(() => {
    store.updateConfig({ autoDetectSystem: true });
    store.detectSystemPreference();
  }, [store]);
  
  // Advanced Actions
  const createLightVariant = useCallback((baseTheme: ThemeConfig, name: string) => {
    const lightColors = {
      ...baseTheme.colors,
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb'
    };
    
    store.createTheme({
      ...baseTheme,
      name,
      type: 'light',
      colors: lightColors
    });
  }, [store]);
  
  const createDarkVariant = useCallback((baseTheme: ThemeConfig, name: string) => {
    const darkColors = {
      ...baseTheme.colors,
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151'
    };
    
    store.createTheme({
      ...baseTheme,
      name,
      type: 'dark',
      colors: darkColors
    });
  }, [store]);
  
  const createCustomVariant = useCallback((
    baseTheme: ThemeConfig,
    name: string,
    colorOverrides: Partial<ThemeConfig['colors']>
  ) => {
    store.createTheme({
      ...baseTheme,
      name,
      colors: {
        ...baseTheme.colors,
        ...colorOverrides
      }
    });
  }, [store]);
  
  // Derived State
  const isDarkMode = useMemo(() => store.currentTheme.type === 'dark', [store.currentTheme.type]);
  const isLightMode = useMemo(() => store.currentTheme.type === 'light', [store.currentTheme.type]);
  const isAutoMode = useMemo(() => store.config.autoDetectSystem, [store.config.autoDetectSystem]);
  const themeType = useMemo(() => store.currentTheme.type, [store.currentTheme.type]);
  
  return {
    // Current State
    currentTheme: store.currentTheme,
    availableThemes: store.availableThemes,
    presets: store.presets,
    config: store.config,
    isTransitioning: store.isTransitioning,
    systemPreference: store.systemPreference,
    customThemes: store.customThemes,
    
    // Theme Management
    setTheme: store.setTheme,
    createTheme: store.createTheme,
    updateTheme: store.updateTheme,
    deleteTheme: store.deleteTheme,
    duplicateTheme: store.duplicateTheme,
    
    // Preset Management
    loadPreset: store.loadPreset,
    createPreset: store.createPreset,
    updatePreset: store.updatePreset,
    deletePreset: store.deletePreset,
    
    // System Actions
    toggleTheme: store.toggleTheme,
    resetToDefault: store.resetToDefault,
    detectSystemPreference: store.detectSystemPreference,
    
    // Configuration
    updateConfig: store.updateConfig,
    
    // Utilities
    exportThemes: store.exportThemes,
    importThemes: store.importThemes,
    generateCSS: store.generateCSS,
    
    // Derived State
    isDarkMode,
    isLightMode,
    isAutoMode,
    themeType,
    
    // Quick Actions
    switchToLight,
    switchToDark,
    switchToAuto,
    
    // Advanced Actions
    createLightVariant,
    createDarkVariant,
    createCustomVariant
  };
};

// Auto Theme Hook - Automatically switches based on system preference
export const useAutoTheme = () => {
  const theme = useTheme({
    autoInit: true,
    respectSystemPreference: true
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme.config.autoDetectSystem) {
        theme.detectSystemPreference();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);
  
  return theme;
};

// Theme Performance Hook
export const useThemePerformance = () => {
  const { performance, measurePerformance, clearPerformanceData } = useTheme();
  
  useEffect(() => {
    const interval = setInterval(() => {
      measurePerformance();
    }, 5000); // Measure every 5 seconds
    
    return () => clearInterval(interval);
  }, [measurePerformance]);
  
  return {
    performance,
    measurePerformance,
    clearPerformanceData
  };
};

// Theme Stats Hook
export const useThemeStats = () => {
  const { stats, updateStats, clearStats } = useTheme();
  
  useEffect(() => {
    updateStats();
  }, [updateStats]);
  
  return {
    stats,
    updateStats,
    clearStats
  };
};

// Theme Config Hook
export const useThemeConfig = () => {
  const { config, updateConfig } = useTheme();
  
  const toggleTransitions = useCallback(() => {
    updateConfig({ enableTransitions: !config.enableTransitions });
  }, [config.enableTransitions, updateConfig]);
  
  const toggleAutoDetect = useCallback(() => {
    updateConfig({ autoDetectSystem: !config.autoDetectSystem });
  }, [config.autoDetectSystem, updateConfig]);
  
  const togglePerformanceMonitoring = useCallback(() => {
    updateConfig({ enablePerformanceMonitoring: !config.enablePerformanceMonitoring });
  }, [config.enablePerformanceMonitoring, updateConfig]);
  
  const toggleAccessibility = useCallback(() => {
    updateConfig({ enableAccessibility: !config.enableAccessibility });
  }, [config.enableAccessibility, updateConfig]);
  
  return {
    config,
    updateConfig,
    toggleTransitions,
    toggleAutoDetect,
    togglePerformanceMonitoring,
    toggleAccessibility
  };
};

// Theme Presets Hook
export const useThemePresets = () => {
  const {
    presets,
    loadPreset,
    createPreset,
    updatePreset,
    deletePreset
  } = useTheme();
  
  const loadDefaultPresets = useCallback(() => {
    // Load built-in presets
    const builtInPresets = [
      {
        name: 'Professional',
        description: 'Clean and professional themes for business use',
        themes: [],
        category: 'professional' as const,
        tags: ['business', 'clean', 'minimal']
      },
      {
        name: 'Creative',
        description: 'Vibrant and creative themes for artistic projects',
        themes: [],
        category: 'creative' as const,
        tags: ['colorful', 'vibrant', 'artistic']
      },
      {
        name: 'Accessibility',
        description: 'High contrast themes for better accessibility',
        themes: [],
        category: 'accessibility' as const,
        tags: ['accessible', 'high-contrast', 'readable']
      }
    ];
    
    builtInPresets.forEach(preset => {
      createPreset(preset);
    });
  }, [createPreset]);
  
  return {
    presets,
    loadPreset,
    createPreset,
    updatePreset,
    deletePreset,
    loadDefaultPresets
  };
};

// Theme Debug Hook
export const useThemeDebug = () => {
  const theme = useTheme();
  
  const debugInfo = useMemo(() => ({
    currentTheme: theme.currentTheme,
    totalThemes: theme.availableThemes.length,
    customThemes: theme.customThemes.length,
    isTransitioning: theme.isTransitioning,
    systemPreference: theme.systemPreference,
    config: theme.config,
    performance: theme.performance,
    stats: theme.stats
  }), [theme]);
  
  const exportDebugInfo = useCallback(() => {
    return JSON.stringify(debugInfo, null, 2);
  }, [debugInfo]);
  
  const logDebugInfo = useCallback(() => {
    console.group('🎨 Theme Debug Info');
    console.groupEnd();
  }, [debugInfo]);
  
  return {
    debugInfo,
    exportDebugInfo,
    logDebugInfo
  };
};

// Theme Transition Hook
export const useThemeTransition = () => {
  const { isTransitioning, config } = useTheme();
  
  const transitionClass = useMemo(() => {
    if (!config.enableTransitions) return '';
    
    return `transition-all duration-${config.transitionDuration} ease-in-out`;
  }, [config.enableTransitions, config.transitionDuration]);
  
  return {
    isTransitioning,
    transitionClass,
    enableTransitions: config.enableTransitions,
    transitionDuration: config.transitionDuration
  };
};

// Theme CSS Variables Hook
export const useThemeVariables = () => {
  const { currentTheme, generateCSS } = useTheme();
  
  const cssVariables = useMemo(() => {
    const css = generateCSS(currentTheme);
    const variables: Record<string, string> = {};
    
    // Parse CSS variables from generated CSS
    const matches = css.match(/--[\w-]+:\s*[^;]+/g);
    if (matches) {
      matches.forEach(match => {
        const [property, value] = match.split(':');
        variables[property.trim()] = value.trim();
      });
    }
    
    return variables;
  }, [currentTheme, generateCSS]);
  
  const getVariable = useCallback((name: string) => {
    return cssVariables[name] || getComputedStyle(document.documentElement).getPropertyValue(name);
  }, [cssVariables]);
  
  return {
    cssVariables,
    getVariable,
    currentTheme
  };
};