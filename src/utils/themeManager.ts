import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme Interfaces
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      light: string;
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  custom?: Record<string, any>;
}

export interface ThemeTransition {
  property: string;
  duration: number;
  easing: string;
  delay?: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  themes: ThemeConfig[];
  category: 'default' | 'professional' | 'creative' | 'accessibility' | 'custom';
  tags: string[];
}

export interface ThemeStats {
  totalThemes: number;
  activeTheme: string;
  switchCount: number;
  lastSwitched: Date;
  popularThemes: { id: string; count: number }[];
  averageSwitchTime: number;
  customThemes: number;
}

export interface ThemePerformance {
  switchTime: number;
  renderTime: number;
  memoryUsage: number;
  cssSize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ThemeManagerConfig {
  autoDetectSystem: boolean;
  enableTransitions: boolean;
  transitionDuration: number;
  persistPreferences: boolean;
  enablePerformanceMonitoring: boolean;
  cacheThemes: boolean;
  maxCachedThemes: number;
  enableAccessibility: boolean;
  respectReducedMotion: boolean;
  enableColorBlindSupport: boolean;
}

// Store Interface
interface ThemeStore {
  // State
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  presets: ThemePreset[];
  config: ThemeManagerConfig;
  stats: ThemeStats;
  performance: ThemePerformance;
  isTransitioning: boolean;
  systemPreference: 'light' | 'dark';
  customThemes: ThemeConfig[];
  
  // Theme Actions
  setTheme: (themeId: string) => void;
  createTheme: (theme: Omit<ThemeConfig, 'id'>) => void;
  updateTheme: (themeId: string, updates: Partial<ThemeConfig>) => void;
  deleteTheme: (themeId: string) => void;
  duplicateTheme: (themeId: string, newName: string) => void;
  
  // Preset Actions
  loadPreset: (presetId: string) => void;
  createPreset: (preset: Omit<ThemePreset, 'id'>) => void;
  updatePreset: (presetId: string, updates: Partial<ThemePreset>) => void;
  deletePreset: (presetId: string) => void;
  
  // System Actions
  detectSystemPreference: () => void;
  toggleTheme: () => void;
  resetToDefault: () => void;
  
  // Config Actions
  updateConfig: (updates: Partial<ThemeManagerConfig>) => void;
  
  // Performance Actions
  measurePerformance: () => void;
  clearPerformanceData: () => void;
  
  // Stats Actions
  updateStats: () => void;
  clearStats: () => void;
  
  // Utility Actions
  exportThemes: () => string;
  importThemes: (data: string) => void;
  generateCSS: (theme?: ThemeConfig) => string;
  applyTheme: (theme: ThemeConfig) => void;
}

// Default Themes
const defaultLightTheme: ThemeConfig = {
  id: 'light-default',
  name: 'Light Default',
  type: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  }
};

const defaultDarkTheme: ThemeConfig = {
  ...defaultLightTheme,
  id: 'dark-default',
  name: 'Dark Default',
  type: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    accent: '#a78bfa',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)'
  }
};

// Default Presets
const defaultPresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default Themes',
    description: 'Standard light and dark themes',
    themes: [defaultLightTheme, defaultDarkTheme],
    category: 'default',
    tags: ['standard', 'basic']
  }
];

// Zustand Store
export const useThemeStore = create<ThemeStore>()(persist(
  (set, get) => ({
    // Initial State
    currentTheme: defaultLightTheme,
    availableThemes: [defaultLightTheme, defaultDarkTheme],
    presets: defaultPresets,
    config: {
      autoDetectSystem: true,
      enableTransitions: true,
      transitionDuration: 300,
      persistPreferences: true,
      enablePerformanceMonitoring: true,
      cacheThemes: true,
      maxCachedThemes: 10,
      enableAccessibility: true,
      respectReducedMotion: true,
      enableColorBlindSupport: false
    },
    stats: {
      totalThemes: 2,
      activeTheme: 'light-default',
      switchCount: 0,
      lastSwitched: new Date(),
      popularThemes: [],
      averageSwitchTime: 0,
      customThemes: 0
    },
    performance: {
      switchTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cssSize: 0,
      cacheHits: 0,
      cacheMisses: 0
    },
    isTransitioning: false,
    systemPreference: 'light',
    customThemes: [],

    // Theme Actions
    setTheme: (themeId: string) => {
      const startTime = performance.now();
      const theme = get().availableThemes.find(t => t.id === themeId);
      if (!theme) return;

      set({ isTransitioning: true });
      
      // Apply theme
      get().applyTheme(theme);
      
      // Update stats
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      set(state => ({
        currentTheme: theme,
        isTransitioning: false,
        stats: {
          ...state.stats,
          activeTheme: themeId,
          switchCount: state.stats.switchCount + 1,
          lastSwitched: new Date(),
          averageSwitchTime: (state.stats.averageSwitchTime + switchTime) / 2
        },
        performance: {
          ...state.performance,
          switchTime
        }
      }));
    },

    createTheme: (theme: Omit<ThemeConfig, 'id'>) => {
      const id = `custom-${Date.now()}`;
      const newTheme: ThemeConfig = { ...theme, id };
      
      set(state => ({
        availableThemes: [...state.availableThemes, newTheme],
        customThemes: [...state.customThemes, newTheme],
        stats: {
          ...state.stats,
          totalThemes: state.stats.totalThemes + 1,
          customThemes: state.stats.customThemes + 1
        }
      }));
    },

    updateTheme: (themeId: string, updates: Partial<ThemeConfig>) => {
      set(state => ({
        availableThemes: state.availableThemes.map(theme =>
          theme.id === themeId ? { ...theme, ...updates } : theme
        ),
        customThemes: state.customThemes.map(theme =>
          theme.id === themeId ? { ...theme, ...updates } : theme
        ),
        currentTheme: state.currentTheme.id === themeId
          ? { ...state.currentTheme, ...updates }
          : state.currentTheme
      }));
    },

    deleteTheme: (themeId: string) => {
      set(state => {
        const isCurrentTheme = state.currentTheme.id === themeId;
        return {
          availableThemes: state.availableThemes.filter(theme => theme.id !== themeId),
          customThemes: state.customThemes.filter(theme => theme.id !== themeId),
          currentTheme: isCurrentTheme ? defaultLightTheme : state.currentTheme,
          stats: {
            ...state.stats,
            totalThemes: state.stats.totalThemes - 1,
            customThemes: state.stats.customThemes - 1
          }
        };
      });
    },

    duplicateTheme: (themeId: string, newName: string) => {
      const theme = get().availableThemes.find(t => t.id === themeId);
      if (!theme) return;
      
      get().createTheme({
        ...theme,
        name: newName
      });
    },

    // Preset Actions
    loadPreset: (presetId: string) => {
      const preset = get().presets.find(p => p.id === presetId);
      if (!preset) return;
      
      set(state => ({
        availableThemes: [...state.availableThemes, ...preset.themes],
        stats: {
          ...state.stats,
          totalThemes: state.stats.totalThemes + preset.themes.length
        }
      }));
    },

    createPreset: (preset: Omit<ThemePreset, 'id'>) => {
      const id = `preset-${Date.now()}`;
      const newPreset: ThemePreset = { ...preset, id };
      
      set(state => ({
        presets: [...state.presets, newPreset]
      }));
    },

    updatePreset: (presetId: string, updates: Partial<ThemePreset>) => {
      set(state => ({
        presets: state.presets.map(preset =>
          preset.id === presetId ? { ...preset, ...updates } : preset
        )
      }));
    },

    deletePreset: (presetId: string) => {
      set(state => ({
        presets: state.presets.filter(preset => preset.id !== presetId)
      }));
    },

    // System Actions
    detectSystemPreference: () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const preference = prefersDark ? 'dark' : 'light';
      
      set({ systemPreference: preference });
      
      if (get().config.autoDetectSystem) {
        const themeId = preference === 'dark' ? 'dark-default' : 'light-default';
        get().setTheme(themeId);
      }
    },

    toggleTheme: () => {
      const currentType = get().currentTheme.type;
      const newType = currentType === 'light' ? 'dark' : 'light';
      const newTheme = get().availableThemes.find(t => t.type === newType);
      
      if (newTheme) {
        get().setTheme(newTheme.id);
      }
    },

    resetToDefault: () => {
      get().setTheme('light-default');
    },

    // Config Actions
    updateConfig: (updates: Partial<ThemeManagerConfig>) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },

    // Performance Actions
    measurePerformance: () => {
      const memoryInfo = (performance as any).memory;
      const cssSize = document.styleSheets.length;
      
      set(state => ({
        performance: {
          ...state.performance,
          memoryUsage: memoryInfo?.usedJSHeapSize || 0,
          cssSize
        }
      }));
    },

    clearPerformanceData: () => {
      set(state => ({
        performance: {
          switchTime: 0,
          renderTime: 0,
          memoryUsage: 0,
          cssSize: 0,
          cacheHits: 0,
          cacheMisses: 0
        }
      }));
    },

    // Stats Actions
    updateStats: () => {
      const state = get();
      const popularThemes = state.availableThemes.map(theme => ({
        id: theme.id,
        count: Math.floor(Math.random() * 100) // Mock data
      })).sort((a, b) => b.count - a.count);
      
      set({
        stats: {
          ...state.stats,
          popularThemes
        }
      });
    },

    clearStats: () => {
      set(state => ({
        stats: {
          totalThemes: state.availableThemes.length,
          activeTheme: state.currentTheme.id,
          switchCount: 0,
          lastSwitched: new Date(),
          popularThemes: [],
          averageSwitchTime: 0,
          customThemes: state.customThemes.length
        }
      }));
    },

    // Utility Actions
    exportThemes: () => {
      const data = {
        themes: get().availableThemes,
        presets: get().presets,
        config: get().config
      };
      return JSON.stringify(data, null, 2);
    },

    importThemes: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.themes) {
          set(state => ({
            availableThemes: [...state.availableThemes, ...parsed.themes]
          }));
        }
        if (parsed.presets) {
          set(state => ({
            presets: [...state.presets, ...parsed.presets]
          }));
        }
        if (parsed.config) {
          set(state => ({
            config: { ...state.config, ...parsed.config }
          }));
        }
      } catch (error) {
        console.error('Failed to import themes:', error);
      }
    },

    generateCSS: (theme?: ThemeConfig) => {
      const targetTheme = theme || get().currentTheme;
      const css = `
        :root {
          --color-primary: ${targetTheme.colors.primary};
          --color-secondary: ${targetTheme.colors.secondary};
          --color-accent: ${targetTheme.colors.accent};
          --color-background: ${targetTheme.colors.background};
          --color-surface: ${targetTheme.colors.surface};
          --color-text: ${targetTheme.colors.text};
          --color-text-secondary: ${targetTheme.colors.textSecondary};
          --color-border: ${targetTheme.colors.border};
          --color-success: ${targetTheme.colors.success};
          --color-warning: ${targetTheme.colors.warning};
          --color-error: ${targetTheme.colors.error};
          --color-info: ${targetTheme.colors.info};
          
          --shadow-sm: ${targetTheme.shadows.sm};
          --shadow-md: ${targetTheme.shadows.md};
          --shadow-lg: ${targetTheme.shadows.lg};
          --shadow-xl: ${targetTheme.shadows.xl};
          
          --radius-sm: ${targetTheme.borderRadius.sm};
          --radius-md: ${targetTheme.borderRadius.md};
          --radius-lg: ${targetTheme.borderRadius.lg};
          --radius-xl: ${targetTheme.borderRadius.xl};
          
          --spacing-xs: ${targetTheme.spacing.xs};
          --spacing-sm: ${targetTheme.spacing.sm};
          --spacing-md: ${targetTheme.spacing.md};
          --spacing-lg: ${targetTheme.spacing.lg};
          --spacing-xl: ${targetTheme.spacing.xl};
          
          --font-family: ${targetTheme.typography.fontFamily};
          --font-size-xs: ${targetTheme.typography.fontSize.xs};
          --font-size-sm: ${targetTheme.typography.fontSize.sm};
          --font-size-md: ${targetTheme.typography.fontSize.md};
          --font-size-lg: ${targetTheme.typography.fontSize.lg};
          --font-size-xl: ${targetTheme.typography.fontSize.xl};
          
          --duration-fast: ${targetTheme.animations.duration.fast};
          --duration-normal: ${targetTheme.animations.duration.normal};
          --duration-slow: ${targetTheme.animations.duration.slow};
        }
      `;
      return css;
    },

    applyTheme: (theme: ThemeConfig) => {
      const css = get().generateCSS(theme);
      
      // Remove existing theme style
      const existingStyle = document.getElementById('theme-variables');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add new theme style
      const style = document.createElement('style');
      style.id = 'theme-variables';
      style.textContent = css;
      document.head.appendChild(style);
      
      // Update body class for theme type
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${theme.type}`);
    }
  }),
  {
    name: 'theme-storage',
    partialize: (state) => ({
      currentTheme: state.currentTheme,
      customThemes: state.customThemes,
      config: state.config,
      stats: state.stats
    })
  }
));

// Theme Manager Class
class ThemeManager {
  private mediaQuery: MediaQueryList;
  private initialized = false;

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  init() {
    if (this.initialized) return;
    
    // Detect system preference
    useThemeStore.getState().detectSystemPreference();
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', () => {
      useThemeStore.getState().detectSystemPreference();
    });
    
    // Apply current theme
    const currentTheme = useThemeStore.getState().currentTheme;
    useThemeStore.getState().applyTheme(currentTheme);
    
    // Listen for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      if (useThemeStore.getState().config.respectReducedMotion) {
        useThemeStore.getState().updateConfig({
          enableTransitions: !e.matches
        });
      }
    });
    
    this.initialized = true;
  }

  destroy() {
    if (!this.initialized) return;
    
    this.mediaQuery.removeEventListener('change', () => {
      useThemeStore.getState().detectSystemPreference();
    });
    
    this.initialized = false;
  }
}

// Global instance
export const themeManager = new ThemeManager();

// Utility functions
export const getThemeIcon = (type: string) => {
  switch (type) {
    case 'light': return 'Sun';
    case 'dark': return 'Moon';
    case 'auto': return 'Monitor';
    default: return 'Palette';
  }
};

export const getThemeColor = (theme: ThemeConfig) => {
  return theme.colors.primary;
};

export const formatThemeName = (name: string) => {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// React Hook
export const useTheme = () => {
  const store = useThemeStore();
  
  return {
    // State
    currentTheme: store.currentTheme,
    availableThemes: store.availableThemes,
    presets: store.presets,
    config: store.config,
    stats: store.stats,
    performance: store.performance,
    isTransitioning: store.isTransitioning,
    systemPreference: store.systemPreference,
    customThemes: store.customThemes,
    
    // Actions
    setTheme: store.setTheme,
    createTheme: store.createTheme,
    updateTheme: store.updateTheme,
    deleteTheme: store.deleteTheme,
    duplicateTheme: store.duplicateTheme,
    loadPreset: store.loadPreset,
    createPreset: store.createPreset,
    updatePreset: store.updatePreset,
    deletePreset: store.deletePreset,
    detectSystemPreference: store.detectSystemPreference,
    toggleTheme: store.toggleTheme,
    resetToDefault: store.resetToDefault,
    updateConfig: store.updateConfig,
    measurePerformance: store.measurePerformance,
    clearPerformanceData: store.clearPerformanceData,
    updateStats: store.updateStats,
    clearStats: store.clearStats,
    exportThemes: store.exportThemes,
    importThemes: store.importThemes,
    generateCSS: store.generateCSS,
    applyTheme: store.applyTheme
  };
};