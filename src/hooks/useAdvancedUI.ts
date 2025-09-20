import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

// Types
export interface UITheme {
  id: string;
  name: string;
  colors: {
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
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

export interface UIComponent {
  id: string;
  name: string;
  type: 'button' | 'input' | 'card' | 'modal' | 'tooltip' | 'dropdown' | 'slider' | 'toggle' | 'tabs' | 'accordion';
  variant: string;
  props: Record<string, any>;
  styles: Record<string, any>;
  animations: UIAnimation[];
  responsive: ResponsiveConfig;
  accessibility: AccessibilityConfig;
  interactions: InteractionConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface UIAnimation {
  id: string;
  name: string;
  type: 'entrance' | 'exit' | 'hover' | 'focus' | 'click' | 'scroll';
  keyframes: Keyframe[];
  duration: number;
  delay: number;
  easing: string;
  iterations: number | 'infinite';
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode: 'none' | 'forwards' | 'backwards' | 'both';
  trigger: AnimationTrigger;
}

export interface Keyframe {
  offset: number;
  properties: Record<string, string | number>;
}

export interface AnimationTrigger {
  type: 'immediate' | 'hover' | 'click' | 'scroll' | 'intersection' | 'time';
  options?: {
    threshold?: number;
    delay?: number;
    rootMargin?: string;
  };
}

export interface ResponsiveConfig {
  breakpoints: {
    sm: Record<string, any>;
    md: Record<string, any>;
    lg: Record<string, any>;
    xl: Record<string, any>;
  };
  hiddenOn: string[];
  visibleOn: string[];
}

export interface AccessibilityConfig {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
  focusable: boolean;
  keyboardNavigation: boolean;
  screenReaderText?: string;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface InteractionConfig {
  hover: {
    enabled: boolean;
    effects: InteractionEffect[];
  };
  focus: {
    enabled: boolean;
    effects: InteractionEffect[];
  };
  click: {
    enabled: boolean;
    effects: InteractionEffect[];
  };
  drag: {
    enabled: boolean;
    axis?: 'x' | 'y' | 'both';
    bounds?: DOMRect;
  };
  resize: {
    enabled: boolean;
    handles: string[];
    minSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
  };
}

export interface InteractionEffect {
  type: 'scale' | 'rotate' | 'translate' | 'opacity' | 'color' | 'shadow' | 'border';
  value: string | number;
  duration: number;
  easing: string;
}

export interface UILayout {
  id: string;
  name: string;
  type: 'grid' | 'flexbox' | 'absolute' | 'sticky' | 'fixed';
  container: LayoutContainer;
  items: LayoutItem[];
  responsive: boolean;
  animations: UIAnimation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tour {
  id: string;
  name: string;
  description?: string;
  steps: TourStep[];
  isActive: boolean;
  currentStep: number;
  status?: 'inactive' | 'active' | 'completed' | 'paused';
  progress?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'scroll' | 'wait';
  actionDelay?: number;
  skippable?: boolean;
  required?: boolean;
}

export interface LayoutContainer {
  width: string;
  height: string;
  padding: string;
  margin: string;
  gap: string;
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridAutoFlow?: string;
}

export interface LayoutItem {
  id: string;
  component: UIComponent;
  position: {
    x: number;
    y: number;
    z: number;
  };
  size: {
    width: string;
    height: string;
  };
  constraints: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  gridArea?: {
    row: string;
    column: string;
  };
  flexProperties?: {
    grow: number;
    shrink: number;
    basis: string;
    order: number;
  };
}

export interface UIState {
  currentTheme: string;
  themes: UITheme[];
  components: UIComponent[];
  layouts: UILayout[];
  animations: UIAnimation[];
  activeAnimations: Map<string, Animation>;
  isLoading: boolean;
  error: string | null;
  preferences: UIPreferences;
  metrics: UIMetrics;
  filters: Record<string, any>;
  analytics: UIAnalytics;
}

export interface UIPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  keyboardNavigation: boolean;
  autoSave: boolean;
  gridSnap: boolean;
  showGuides: boolean;
  darkMode: boolean;
  notifications: boolean;
}

export interface UIMetrics {
  totalComponents: number;
  totalLayouts: number;
  totalAnimations: number;
  activeAnimations: number;
  renderTime: number;
  memoryUsage: number;
  interactionCount: number;
  errorCount: number;
  lastUpdated: Date;
}

export interface UIAnalytics {
  pageViews: number;
  userInteractions: number;
  componentUsage: Record<string, number>;
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
  errorTracking: {
    count: number;
    lastError: string | null;
  };
  userBehavior: {
    clickHeatmap: Record<string, number>;
    scrollDepth: number;
    timeOnPage: number;
  };
}

export interface AdvancedUIConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  maxUndoSteps: number;
  enableAnimations: boolean;
  enableInteractions: boolean;
  enableResponsive: boolean;
  enableAccessibility: boolean;
  performanceMode: boolean;
  debugMode: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showBoundingBoxes: boolean;
  enableHotkeys: boolean;
  enableCollaboration: boolean;
  maxFileSize: number;
  supportedFormats: string[];
  defaultTheme: string;
  customCSS: string;
}

// Advanced UI Engine
class AdvancedUIEngine {
  private config: AdvancedUIConfig;
  private state: UIState;
  private undoStack: UIState[];
  private redoStack: UIState[];
  private animationFrameId: number | null = null;
  private observers: Map<string, IntersectionObserver> = new Map();
  private eventListeners: Map<string, EventListener> = new Map();
  private styleSheet: CSSStyleSheet | null = null;

  constructor(config: AdvancedUIConfig) {
    this.config = config;
    this.state = this.getInitialState();
    this.undoStack = [];
    this.redoStack = [];
    this.init();
  }

  private getInitialState(): UIState {
    return {
      currentTheme: this.config.defaultTheme,
      themes: this.getDefaultThemes(),
      components: [],
      layouts: [],
      animations: [],
      activeAnimations: new Map(),
      isLoading: false,
      error: null,
      preferences: {
        reducedMotion: false,
        highContrast: false,
        fontSize: 'medium',
        colorBlindness: 'none',
        keyboardNavigation: true,
        autoSave: this.config.autoSave,
        gridSnap: this.config.snapToGrid,
        showGuides: false,
        darkMode: false,
        notifications: true
      },
      metrics: {
        totalComponents: 0,
        totalLayouts: 0,
        totalAnimations: 0,
        activeAnimations: 0,
        renderTime: 0,
        memoryUsage: 0,
        interactionCount: 0,
        errorCount: 0,
        lastUpdated: new Date()
      },
      filters: {},
      analytics: {
        pageViews: 0,
        userInteractions: 0,
        componentUsage: {},
        performanceMetrics: {
          loadTime: 0,
          renderTime: 0,
          memoryUsage: 0
        },
        errorTracking: {
          count: 0,
          lastError: null
        },
        userBehavior: {
          clickHeatmap: {},
          scrollDepth: 0,
          timeOnPage: 0
        }
      }
    };
  }

  private getDefaultThemes(): UITheme[] {
    return [
      {
        id: 'light',
        name: 'Light Theme',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#8b5cf6',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem'
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px'
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
        },
        animations: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          },
          easing: {
            linear: 'linear',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }
      },
      {
        id: 'dark',
        name: 'Dark Theme',
        colors: {
          primary: '#60a5fa',
          secondary: '#94a3b8',
          accent: '#a78bfa',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#334155',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          info: '#22d3ee'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem'
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px'
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.6)'
        },
        animations: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          },
          easing: {
            linear: 'linear',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }
        }
      }
    ];
  }

  private init(): void {
    this.setupStyleSheet();
    this.setupEventListeners();
    this.setupIntersectionObservers();
    this.startAnimationLoop();
    this.loadFromStorage();
  }

  private setupStyleSheet(): void {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'advanced-ui-styles';
      document.head.appendChild(style);
      this.styleSheet = style.sheet;
      this.updateThemeStyles();
    }
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Keyboard shortcuts
      const keyboardHandler = (e: KeyboardEvent) => {
        if (!this.config.enableHotkeys) return;
        
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'z':
              e.preventDefault();
              if (e.shiftKey) {
                this.redo();
              } else {
                this.undo();
              }
              break;
            case 's':
              e.preventDefault();
              this.saveToStorage();
              break;
          }
        }
      };
      
      window.addEventListener('keydown', keyboardHandler);
      this.eventListeners.set('keyboard', keyboardHandler);

      // Resize handler
      const resizeHandler = () => {
        this.updateResponsiveStyles();
      };
      
      window.addEventListener('resize', resizeHandler);
      this.eventListeners.set('resize', resizeHandler);

      // Visibility change handler
      const visibilityHandler = () => {
        if (document.hidden) {
          this.pauseAnimations();
        } else {
          this.resumeAnimations();
        }
      };
      
      document.addEventListener('visibilitychange', visibilityHandler);
      this.eventListeners.set('visibility', visibilityHandler);
    }
  }

  private setupIntersectionObservers(): void {
    if (typeof window !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const elementId = entry.target.getAttribute('data-ui-id');
            if (elementId) {
              if (entry.isIntersecting) {
                this.triggerScrollAnimations(elementId);
              }
            }
          });
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
          rootMargin: '50px'
        }
      );
      
      this.observers.set('intersection', observer);
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.updateAnimations();
      this.updateMetrics();
      
      if (this.config.enableAnimations) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    if (this.config.enableAnimations) {
      this.animationFrameId = requestAnimationFrame(animate);
    }
  }

  private updateAnimations(): void {
    const now = performance.now();
    
    this.state.activeAnimations.forEach((animation, id) => {
      if (animation.playState === 'finished') {
        this.state.activeAnimations.delete(id);
      }
    });
  }

  private updateMetrics(): void {
    this.state.metrics = {
      ...this.state.metrics,
      totalComponents: this.state.components.length,
      totalLayouts: this.state.layouts.length,
      totalAnimations: this.state.animations.length,
      activeAnimations: this.state.activeAnimations.size,
      renderTime: performance.now(),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      lastUpdated: new Date()
    };
  }

  private updateThemeStyles(): void {
    if (!this.styleSheet) return;
    
    const theme = this.getCurrentTheme();
    if (!theme) return;

    // Clear existing rules
    while (this.styleSheet.cssRules.length > 0) {
      this.styleSheet.deleteRule(0);
    }

    // Add CSS custom properties
    const rootRule = `:root {
      ${Object.entries(theme.colors).map(([key, value]) => 
        `--ui-color-${key}: ${value};`
      ).join('\n')}
      ${Object.entries(theme.typography.fontSize).map(([key, value]) => 
        `--ui-font-size-${key}: ${value};`
      ).join('\n')}
      ${Object.entries(theme.spacing).map(([key, value]) => 
        `--ui-spacing-${key}: ${value};`
      ).join('\n')}
      ${Object.entries(theme.borderRadius).map(([key, value]) => 
        `--ui-radius-${key}: ${value};`
      ).join('\n')}
      ${Object.entries(theme.shadows).map(([key, value]) => 
        `--ui-shadow-${key}: ${value};`
      ).join('\n')}
      --ui-font-family: ${theme.typography.fontFamily};
    }`;
    
    this.styleSheet.insertRule(rootRule, 0);

    // Add custom CSS
    if (this.config.customCSS) {
      this.styleSheet.insertRule(this.config.customCSS, this.styleSheet.cssRules.length);
    }
  }

  private updateResponsiveStyles(): void {
    // Update responsive styles based on current viewport
    this.state.components.forEach(component => {
      if (component.responsive) {
        this.applyResponsiveStyles(component);
      }
    });
  }

  private applyResponsiveStyles(component: UIComponent): void {
    const element = document.querySelector(`[data-ui-id="${component.id}"]`);
    if (!element) return;

    const breakpoint = this.getCurrentBreakpoint();
    const responsiveStyles = component.responsive.breakpoints[breakpoint];
    
    if (responsiveStyles) {
      Object.entries(responsiveStyles).forEach(([property, value]) => {
        (element as HTMLElement).style.setProperty(property, value);
      });
    }
  }

  private getCurrentBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' {
    const width = window.innerWidth;
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    return 'sm';
  }

  private triggerScrollAnimations(elementId: string): void {
    const component = this.state.components.find(c => c.id === elementId);
    if (!component) return;

    component.animations
      .filter(anim => anim.trigger.type === 'scroll' || anim.trigger.type === 'intersection')
      .forEach(animation => {
        this.playAnimation(animation, elementId);
      });
  }

  private playAnimation(animation: UIAnimation, elementId: string): void {
    const element = document.querySelector(`[data-ui-id="${elementId}"]`) as HTMLElement;
    if (!element) return;

    if (this.state.preferences.reducedMotion && animation.type !== 'entrance') {
      return;
    }

    const keyframes = animation.keyframes.map(kf => ({
      offset: kf.offset,
      ...kf.properties
    }));

    const webAnimation = element.animate(keyframes, {
      duration: animation.duration,
      delay: animation.delay,
      easing: animation.easing,
      iterations: animation.iterations,
      direction: animation.direction,
      fill: animation.fillMode
    });

    this.state.activeAnimations.set(`${elementId}-${animation.id}`, webAnimation);
  }

  private pauseAnimations(): void {
    this.state.activeAnimations.forEach(animation => {
      animation.pause();
    });
  }

  private resumeAnimations(): void {
    this.state.activeAnimations.forEach(animation => {
      animation.play();
    });
  }

  private saveState(): void {
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    if (this.undoStack.length > this.config.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('advanced-ui-state');
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.state = { ...this.state, ...parsedState };
        this.updateThemeStyles();
      }
    } catch (error) {
      console.error('Failed to load UI state from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('advanced-ui-state', JSON.stringify({
        currentTheme: this.state.currentTheme,
        themes: this.state.themes,
        components: this.state.components,
        layouts: this.state.layouts,
        animations: this.state.animations,
        preferences: this.state.preferences
      }));
    } catch (error) {
      console.error('Failed to save UI state to storage:', error);
    }
  }

  // Public methods
  getCurrentTheme(): UITheme | undefined {
    return this.state.themes.find(theme => theme.id === this.state.currentTheme);
  }

  setTheme(themeId: string): void {
    this.saveState();
    this.state.currentTheme = themeId;
    this.updateThemeStyles();
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  addTheme(theme: UITheme): void {
    this.saveState();
    this.state.themes.push(theme);
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  updateTheme(themeId: string, updates: Partial<UITheme>): void {
    this.saveState();
    const themeIndex = this.state.themes.findIndex(t => t.id === themeId);
    if (themeIndex >= 0) {
      this.state.themes[themeIndex] = { ...this.state.themes[themeIndex], ...updates };
      if (this.state.currentTheme === themeId) {
        this.updateThemeStyles();
      }
      if (this.config.autoSave) {
        this.saveToStorage();
      }
    }
  }

  removeTheme(themeId: string): void {
    if (themeId === this.state.currentTheme) {
      throw new Error('Cannot remove the current theme');
    }
    this.saveState();
    this.state.themes = this.state.themes.filter(t => t.id !== themeId);
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  addComponent(component: UIComponent): void {
    this.saveState();
    this.state.components.push(component);
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  updateComponent(componentId: string, updates: Partial<UIComponent>): void {
    this.saveState();
    const componentIndex = this.state.components.findIndex(c => c.id === componentId);
    if (componentIndex >= 0) {
      this.state.components[componentIndex] = { 
        ...this.state.components[componentIndex], 
        ...updates,
        updatedAt: new Date()
      };
      if (this.config.autoSave) {
        this.saveToStorage();
      }
    }
  }

  removeComponent(componentId: string): void {
    this.saveState();
    this.state.components = this.state.components.filter(c => c.id !== componentId);
    this.state.layouts.forEach(layout => {
      layout.items = layout.items.filter(item => item.component.id !== componentId);
    });
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  addLayout(layout: UILayout): void {
    this.saveState();
    this.state.layouts.push(layout);
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  updateLayout(layoutId: string, updates: Partial<UILayout>): void {
    this.saveState();
    const layoutIndex = this.state.layouts.findIndex(l => l.id === layoutId);
    if (layoutIndex >= 0) {
      this.state.layouts[layoutIndex] = { 
        ...this.state.layouts[layoutIndex], 
        ...updates,
        updatedAt: new Date()
      };
      if (this.config.autoSave) {
        this.saveToStorage();
      }
    }
  }

  removeLayout(layoutId: string): void {
    this.saveState();
    this.state.layouts = this.state.layouts.filter(l => l.id !== layoutId);
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  addAnimation(animation: UIAnimation): void {
    this.saveState();
    this.state.animations.push(animation);
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  updateAnimation(animationId: string, updates: Partial<UIAnimation>): void {
    this.saveState();
    const animationIndex = this.state.animations.findIndex(a => a.id === animationId);
    if (animationIndex >= 0) {
      this.state.animations[animationIndex] = { ...this.state.animations[animationIndex], ...updates };
      if (this.config.autoSave) {
        this.saveToStorage();
      }
    }
  }

  removeAnimation(animationId: string): void {
    this.saveState();
    this.state.animations = this.state.animations.filter(a => a.id !== animationId);
    // Remove from components
    this.state.components.forEach(component => {
      component.animations = component.animations.filter(a => a.id !== animationId);
    });
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  updatePreferences(updates: Partial<UIPreferences>): void {
    this.saveState();
    this.state.preferences = { ...this.state.preferences, ...updates };
    
    // Apply preference changes
    if (updates.reducedMotion !== undefined) {
      if (updates.reducedMotion) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    }
    
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  updateConfig(updates: Partial<AdvancedUIConfig>): void {
    this.saveState();
    this.config = { ...this.config, ...updates };
    
    // Update preferences to reflect config changes that affect the UI
    const preferencesUpdates: Partial<UIPreferences> = {};
    if (updates.autoSave !== undefined) {
      preferencesUpdates.autoSave = updates.autoSave;
    }
    if (updates.enableAnimations !== undefined) {
      preferencesUpdates.reducedMotion = !updates.enableAnimations;
    }
    if (updates.enableAccessibility !== undefined) {
      preferencesUpdates.accessibility = updates.enableAccessibility;
    }
    
    // Map config properties to preferences for UI display
    if ('notifications' in updates) {
      preferencesUpdates.notifications = (updates as any).notifications;
    }
    if ('language' in updates) {
      preferencesUpdates.language = (updates as any).language;
    }
    
    if (Object.keys(preferencesUpdates).length > 0) {
      this.state.preferences = { ...this.state.preferences, ...preferencesUpdates };
    }
    
    // Apply config changes
    if (updates.enableAnimations !== undefined) {
      if (updates.enableAnimations) {
        this.startAnimationLoop();
      } else {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      }
    }
    
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  undo(): void {
    if (this.undoStack.length > 0) {
      this.redoStack.push(JSON.parse(JSON.stringify(this.state)));
      this.state = this.undoStack.pop()!;
      this.updateThemeStyles();
    }
  }

  redo(): void {
    if (this.redoStack.length > 0) {
      this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
      this.state = this.redoStack.pop()!;
      this.updateThemeStyles();
    }
  }

  exportData(): string {
    return JSON.stringify({
      themes: this.state.themes,
      components: this.state.components,
      layouts: this.state.layouts,
      animations: this.state.animations,
      preferences: this.state.preferences,
      config: this.config,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.themes) {
        this.saveState();
        this.state.themes = [...this.state.themes, ...parsed.themes];
      }
      
      if (parsed.components) {
        this.state.components = [...this.state.components, ...parsed.components];
      }
      
      if (parsed.layouts) {
        this.state.layouts = [...this.state.layouts, ...parsed.layouts];
      }
      
      if (parsed.animations) {
        this.state.animations = [...this.state.animations, ...parsed.animations];
      }
      
      if (parsed.preferences) {
        this.updatePreferences(parsed.preferences);
      }
      
      if (parsed.config) {
        this.updateConfig(parsed.config);
      }
      
      this.updateThemeStyles();
      
      if (this.config.autoSave) {
        this.saveToStorage();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import UI data:', error);
      this.state.error = 'Failed to import data';
      return false;
    }
  }

  getState(): UIState {
    // Return a deep copy to ensure React detects state changes
    return {
      ...this.state,
      themes: [...this.state.themes],
      components: [...this.state.components],
      layouts: [...this.state.layouts],
      animations: [...this.state.animations],
      activeAnimations: new Map(this.state.activeAnimations),
      preferences: { ...this.state.preferences },
      metrics: { ...this.state.metrics },
      analytics: { ...this.state.analytics },
      filters: { ...this.state.filters }
    };
  }

  getConfig(): AdvancedUIConfig {
    return this.config;
  }

  setFilters(filters: Record<string, any>): void {
    this.saveState();
    this.state.filters = { ...this.state.filters, ...filters };
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  clearFilters(): void {
    this.saveState();
    this.state.filters = {};
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  showNotification(notification: any): void {
    // Implementation for showing notifications
  }

  // Tour methods removed - not part of UIState interface

  showComponent(componentId: string): void {
    // Implementation for showing components
    const component = this.state.components.find(c => c.id === componentId);
    if (component) {
      component.status = 'active';
    }
  }

  hideComponent(componentId: string): void {
    // Implementation for hiding components
    const component = this.state.components.find(c => c.id === componentId);
    if (component) {
      component.status = 'inactive';
    }
  }

  resetConfig(): void {
    this.saveState();
    this.config = { ...defaultConfig };
    this.state = this.getInitialState();
    this.updateThemeStyles();
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  async createComponent(componentData: Partial<UIComponent>): Promise<UIComponent> {
    return new Promise((resolve, reject) => {
      try {
        // Validate required fields
        if (!componentData.name || componentData.name.trim() === '') {
          throw new Error('Component name is required and cannot be empty');
        }
        
        const component: UIComponent = {
          id: componentData.id || `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: componentData.name,
          type: componentData.type || 'div',
          props: componentData.props || {},
          styles: componentData.styles || {},
          children: componentData.children || [],
          animations: componentData.animations || [],
          interactions: componentData.interactions || [],
          responsive: componentData.responsive,
          accessibility: componentData.accessibility,
          status: componentData.status || 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.addComponent(component);
        resolve(component);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Tour methods removed - not part of UIState interface

  updateAnalytics(analytics: Partial<UIAnalytics>): void {
    this.saveState();
    this.state.analytics = {
      ...this.state.analytics,
      ...analytics
    };
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  async createTheme(themeData: Partial<UITheme>): Promise<UITheme> {
    return new Promise((resolve, reject) => {
      try {
        const theme: UITheme = {
          id: themeData.id || `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: themeData.name || 'New Theme',
          colors: themeData.colors || {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#8b5cf6',
            background: '#ffffff',
            surface: '#f8fafc',
            text: '#1e293b',
            textSecondary: '#64748b',
            border: '#e2e8f0',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#06b6d4'
          },
          typography: themeData.typography || {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem'
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75
            }
          },
          spacing: themeData.spacing || {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem'
          },
          borderRadius: themeData.borderRadius || {
            none: '0',
            sm: '0.125rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px'
          },
          shadows: themeData.shadows || {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          },
          animations: themeData.animations || {
            duration: {
              fast: '150ms',
              normal: '300ms',
              slow: '500ms'
            },
            easing: {
              linear: 'linear',
              easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
              easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
              easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }
        };
        
        this.addTheme(theme);
        resolve(theme);
      } catch (error) {
        reject(error);
      }
    });
  }

  async clearAllComponents(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.saveState();
        this.state.components = [];
        if (this.config.autoSave) {
          this.saveToStorage();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // resetAllTours method removed - not part of UIState interface

  async enableAccessibility(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.updatePreferences({ keyboardNavigation: true });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async optimizePerformance(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.updateConfig({ performanceMode: true });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  destroy(): void {
    // Clean up
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    this.eventListeners.forEach((listener, type) => {
      if (type === 'keyboard' || type === 'resize') {
        window.removeEventListener(type === 'keyboard' ? 'keydown' : 'resize', listener);
      } else if (type === 'visibility') {
        document.removeEventListener('visibilitychange', listener);
      }
    });
    this.eventListeners.clear();
    
    this.state.activeAnimations.forEach(animation => animation.cancel());
    this.state.activeAnimations.clear();
    
    // Remove style sheet
    const styleElement = document.getElementById('advanced-ui-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Default configuration
const defaultConfig: AdvancedUIConfig = {
  autoSave: true,
  autoSaveInterval: 30000,
  maxUndoSteps: 50,
  enableAnimations: true,
  enableInteractions: true,
  enableResponsive: true,
  enableAccessibility: true,
  performanceMode: false,
  debugMode: false,
  gridSize: 8,
  snapToGrid: true,
  showBoundingBoxes: false,
  enableHotkeys: true,
  enableCollaboration: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['json', 'css', 'scss', 'less'],
  defaultTheme: 'light',
  customCSS: ''
};

// Hook
export const useAdvancedUI = (config: Partial<AdvancedUIConfig> = {}) => {
  const [engine] = useState(() => new AdvancedUIEngine({ ...defaultConfig, ...config }));
  const [state, setState] = useState<UIState>(engine.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Update state when engine state changes
  useEffect(() => {
    const updateState = () => {
      setState(engine.getState());
    };

    const interval = setInterval(updateState, 100);
    setInitialized(true);

    return () => {
      clearInterval(interval);
      engine.destroy();
    };
  }, [engine]);

  // Helper function to handle engine operations
  const handleEngineOperation = useCallback(async (operation: () => void | Promise<void>, errorMessage: string) => {
    try {
      setIsLoading(true);
      await operation();
      // Force immediate state update after operation
      setState(engine.getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  // Theme actions grouped
  const themeActions = useMemo(() => ({
    setTheme: (themeId: string) => handleEngineOperation(() => engine.setTheme(themeId), 'Failed to set theme'),
    addTheme: (theme: UITheme) => handleEngineOperation(() => engine.addTheme(theme), 'Failed to add theme'),
    updateTheme: (themeId: string, updates: Partial<UITheme>) => handleEngineOperation(() => engine.updateTheme(themeId, updates), 'Failed to update theme'),
    removeTheme: (themeId: string) => handleEngineOperation(() => engine.removeTheme(themeId), 'Failed to remove theme')
  }), [engine, handleEngineOperation]);

  // Component actions grouped
  const componentActions = useMemo(() => ({
    addComponent: (component: UIComponent) => handleEngineOperation(() => engine.addComponent(component), 'Failed to add component'),
    updateComponent: (componentId: string, updates: Partial<UIComponent>) => handleEngineOperation(() => engine.updateComponent(componentId, updates), 'Failed to update component'),
    removeComponent: (componentId: string) => handleEngineOperation(() => engine.removeComponent(componentId), 'Failed to remove component')
  }), [engine, handleEngineOperation]);

  // Layout actions grouped
  const layoutActions = useMemo(() => ({
    addLayout: (layout: UILayout) => handleEngineOperation(() => engine.addLayout(layout), 'Failed to add layout'),
    updateLayout: (layoutId: string, updates: Partial<UILayout>) => handleEngineOperation(() => engine.updateLayout(layoutId, updates), 'Failed to update layout'),
    removeLayout: (layoutId: string) => handleEngineOperation(() => engine.removeLayout(layoutId), 'Failed to remove layout')
  }), [engine, handleEngineOperation]);

  // Animation actions grouped
  const animationActions = useMemo(() => ({
    addAnimation: (animation: UIAnimation) => handleEngineOperation(() => engine.addAnimation(animation), 'Failed to add animation'),
    updateAnimation: (animationId: string, updates: Partial<UIAnimation>) => handleEngineOperation(() => engine.updateAnimation(animationId, updates), 'Failed to update animation'),
    removeAnimation: (animationId: string) => handleEngineOperation(() => engine.removeAnimation(animationId), 'Failed to remove animation')
  }), [engine, handleEngineOperation]);

  const updatePreferences = useCallback((updates: Partial<UIPreferences>) => {
    try {
      setIsLoading(true);
      engine.updatePreferences(updates);
      // Force immediate state update
      setState(engine.getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const updateConfig = useCallback((updates: Partial<AdvancedUIConfig>) => {
    try {
      setIsLoading(true);
      engine.updateConfig(updates);
      // Force immediate state update
      setState(engine.getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const undo = useCallback(() => {
    try {
      engine.undo();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo');
    }
  }, [engine]);

  const redo = useCallback(() => {
    try {
      engine.redo();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redo');
    }
  }, [engine]);

  const exportData = useCallback(() => {
    try {
      const result = engine.exportData();
      setError(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      return '';
    }
  }, [engine]);

  const importData = useCallback((data: string) => {
    try {
      setIsLoading(true);
      const success = engine.importData(data);
      setError(success ? null : 'Import failed');
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const getCurrentTheme = useCallback(() => {
    try {
      const theme = engine.getCurrentTheme();
      setError(null);
      return theme;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get current theme');
      return null;
    }
  }, [engine]);

  // Quick actions
  const quickActions = useMemo(() => ({
    createComponent: async (componentData: Partial<UIComponent>) => {
      try {
        setIsLoading(true);
        const component = await engine.createComponent(componentData);
        // Force immediate state update after successful operation
        setState(engine.getState());
        setError(null);
        return component;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create component');
        // Force state update to ensure consistency even on error
        setState(engine.getState());
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    createTour: async (tourData: Partial<Tour>) => {
      try {
        setIsLoading(true);
        const tour = await engine.createTour(tourData);
        setError(null);
        return tour;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create tour');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    createTheme: async (themeData: Partial<UITheme>) => {
      try {
        setIsLoading(true);
        const theme = await engine.createTheme(themeData);
        // Force immediate state update after successful operation
        setState(engine.getState());
        setError(null);
        return theme;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create theme');
        // Force state update to ensure consistency even on error
        setState(engine.getState());
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    clearAllComponents: async () => {
      try {
        setIsLoading(true);
        await engine.clearAllComponents();
        // Force immediate state update after successful operation
        setState(engine.getState());
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear components');
        // Force state update to ensure consistency even on error
        setState(engine.getState());
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    resetAllTours: async () => {
      try {
        setIsLoading(true);
        await engine.resetAllTours();
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reset tours');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    enableAccessibility: async () => {
      try {
        setIsLoading(true);
        await engine.enableAccessibility();
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to enable accessibility');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    optimizePerformance: async () => {
      try {
        setIsLoading(true);
        await engine.optimizePerformance();
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to optimize performance');
        return false;
      } finally {
        setIsLoading(false);
      }
    }
  }), [engine]);

  // Throttled actions - moved individual useCallback outside useMemo
  const throttledUpdateComponent = useCallback(throttle((componentId: string, updates: Partial<UIComponent>) => {
    componentActions.updateComponent(componentId, updates);
  }, 300), [componentActions]);

  const throttledUpdateTour = useCallback(throttle((tourId: string, updates: Partial<Tour>) => {
    try {
      engine.updateTour(tourId, updates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tour');
    }
  }, 300), [engine]);

  const throttledUpdateTheme = useCallback(throttle((themeId: string, updates: Partial<UITheme>) => {
    try {
      engine.updateTheme(themeId, updates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
    }
  }, 300), [engine]);

  const throttledActions = useMemo(() => ({
    updateComponent: throttledUpdateComponent,
    updateTour: throttledUpdateTour,
    updateTheme: throttledUpdateTheme
  }), [throttledUpdateComponent, throttledUpdateTour, throttledUpdateTheme]);

  // Debounced actions - create stable debounced functions
  const debouncedSetFiltersRef = useRef(
    debounce((filters: Record<string, any>) => {
      try {
        engine.setFilters(filters);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set filters');
      }
    }, 300)
  );

  const debouncedUpdateAnalyticsRef = useRef(
    debounce((analytics: Partial<UIAnalytics>) => {
      try {
        engine.updateAnalytics(analytics);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update analytics');
      }
    }, 500)
  );

  const debouncedSetFilters = useCallback((filters: Record<string, any>) => {
    debouncedSetFiltersRef.current(filters);
  }, []);

  const debouncedUpdateAnalytics = useCallback((analytics: Partial<UIAnalytics>) => {
    debouncedUpdateAnalyticsRef.current(analytics);
  }, []);

  const debouncedActions = useMemo(() => ({
    setFilters: debouncedSetFilters,
    updateAnalytics: debouncedUpdateAnalytics
  }), [debouncedSetFilters, debouncedUpdateAnalytics]);

  // Legacy actions for backward compatibility
  const actions = useMemo(() => ({
    createComponent: quickActions.createComponent,
    updateComponent: componentActions.updateComponent,
    deleteComponent: componentActions.removeComponent,
    createTour: quickActions.createTour,
    updateTour: (tourId: string, updates: Partial<Tour>) => {
      try {
        engine.updateTour(tourId, updates);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update tour');
      }
    },
    deleteTour: (tourId: string) => {
      try {
        engine.deleteTour(tourId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete tour');
      }
    },
    startTour: (tourId: string) => {
      try {
        engine.startTour(tourId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start tour');
      }
    },
    completeTour: (tourId: string) => {
      try {
        engine.completeTour(tourId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete tour');
      }
    },
    createTheme: quickActions.createTheme,
    updateTheme: themeActions.updateTheme,
    deleteTheme: themeActions.removeTheme,
    applyTheme: themeActions.setTheme,
    updateConfig: updateConfig,
    resetConfig: () => {
      try {
        engine.resetConfig();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reset config');
      }
    },
    setFilters: debouncedSetFilters,
    clearFilters: () => {
      try {
        engine.clearFilters();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear filters');
      }
    },
    updateAnalytics: debouncedUpdateAnalytics,
    showNotification: (notification: any) => {
      try {
        engine.showNotification(notification);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to show notification');
      }
    }
  }), [quickActions, componentActions, themeActions, updateConfig, debouncedActions, engine]);

  return {
    // State
    themes: state.themes,
    currentTheme: state.themes.find(theme => theme.id === state.currentTheme),
    components: state.components,
    layouts: state.layouts,
    animations: state.animations,
    activeAnimations: state.activeAnimations,
    preferences: state.preferences,
    metrics: state.metrics,
    tours: [], // Tours removed from UIState interface
    isLoading,
    error,
    initialized,
    config: engine.getConfig(),
    
    // Additional state properties (stats will be defined at the end)
    analytics: state.analytics,
    activeTheme: state.currentTheme,
    visibleComponents: state.components.filter(c => c.status === 'active'),
    filteredComponents: state.components,
    recommendations: [],
    isHealthy: state.metrics.performanceScore > 70,
    needsAttention: state.metrics.performanceScore < 50,
    
    // Computed properties
    totalComponents: state.components.length,
    activeTours: 0, // Tours removed from UIState interface
    systemHealth: Math.max(0, Math.min(100, state.metrics.performanceScore || 85)),
    configs: {
      autoSave: state.preferences?.autoSave ?? false,
      notifications: state.preferences?.notifications ?? true,
      theme: state.currentTheme?.id || 'light',
      language: state.preferences?.language || 'en',
      accessibility: state.preferences?.accessibility ?? true
    },
    
    // Utility functions
    getRecommendedActions: () => {
      const recommendations = [];
      const performanceScore = state.metrics.performanceScore || 0;
      
      if (performanceScore < 70) {
        recommendations.push({
          action: 'optimize_performance',
          reason: 'System performance is below optimal',
          priority: 'high'
        });
      }
      
      if (state.components.length === 0) {
        recommendations.push({
          action: 'add_components',
          reason: 'No components found in the system',
          priority: 'medium'
        });
      }
      
      // Tour recommendations removed - not part of UIState interface
      
      return recommendations;
    },

    // Theme actions
    ...themeActions,
    getCurrentTheme,

    // Component actions
    ...componentActions,
    deleteComponent: componentActions.removeComponent,
    createComponent: componentActions.addComponent,
    getFilteredComponents: () => state.components,
    showComponent: (componentId: string) => {
      try {
        engine.showComponent(componentId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to show component');
      }
    },
    hideComponent: (componentId: string) => {
      try {
        engine.hideComponent(componentId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to hide component');
      }
    },

    // Layout actions
    ...layoutActions,

    // Animation actions
    ...animationActions,

    // Tour actions removed - not part of UIState interface

    // Settings
    updatePreferences,
    updateConfig,
    setActiveTheme: themeActions.setTheme,

    // History
    undo,
    redo,

    // Data management
    exportData,
    importData,

    // Action groups
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Stats with complete information
    stats: {
      activeComponents: state.components.filter(c => c.status === 'active').length,
      totalComponents: state.components.length,
      completedTours: 0, // Tours not part of UIState interface
      userEngagement: state.metrics.performanceScore || 75,
      performanceScore: state.metrics.performanceScore || 95,
      componentsByType: state.components.reduce((acc, component) => {
        acc[component.type] = (acc[component.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  };
};

// Utility functions
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const getComponentColor = (variant: string): string => {
  switch (variant) {
    case 'primary': return 'text-blue-600';
    case 'secondary': return 'text-gray-600';
    case 'success': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'error': return 'text-red-600';
    case 'info': return 'text-blue-500';
    default: return 'text-gray-600';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const formatUITime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

export const getUIStatus = (stats: any): string => {
  if (!stats) return 'unknown';
  
  const score = stats.performanceScore || 0;
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs_improvement';
  return 'poor';
};

export const getUIHealth = (metrics: any): boolean => {
  if (!metrics) return false;
  return metrics.performanceScore > 70 && metrics.errorRate < 0.05;
};

export default useAdvancedUI;