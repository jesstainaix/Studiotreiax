// Sistema avançado de responsividade móvel
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv';
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
    ratio: number;
  };
  touchCapable: boolean;
  pixelRatio: number;
  platform: string;
  browser: string;
  isRetina: boolean;
  hasNotch: boolean;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface Breakpoint {
  id: string;
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  gutters: number;
  margins: number;
  typography: {
    baseSize: number;
    lineHeight: number;
    scale: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface ResponsiveComponent {
  id: string;
  name: string;
  breakpoints: {
    [key: string]: {
      visible: boolean;
      layout: 'stack' | 'grid' | 'flex' | 'absolute';
      columns?: number;
      spacing?: number;
      fontSize?: number;
      padding?: number;
      margin?: number;
      width?: string;
      height?: string;
    };
  };
  touchOptimizations: {
    minTouchTarget: number;
    gestureSupport: string[];
    hapticFeedback: boolean;
    swipeActions: boolean;
  };
  performanceOptimizations: {
    lazyLoad: boolean;
    virtualScroll: boolean;
    imageOptimization: boolean;
    animationReduction: boolean;
  };
}

export interface TouchGesture {
  id: string;
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate' | 'pan';
  element: string;
  action: string;
  threshold: number;
  enabled: boolean;
  hapticFeedback: boolean;
}

export interface ViewportSettings {
  width: string;
  height: string;
  initialScale: number;
  minimumScale: number;
  maximumScale: number;
  userScalable: boolean;
  viewportFit: 'auto' | 'contain' | 'cover';
}

export interface ResponsiveImage {
  id: string;
  src: string;
  alt: string;
  breakpoints: {
    [key: string]: {
      src: string;
      width: number;
      height: number;
      quality: number;
      format: 'webp' | 'avif' | 'jpeg' | 'png';
    };
  };
  lazyLoad: boolean;
  placeholder: string;
  blurHash?: string;
}

export interface ResponsiveStats {
  deviceDetections: number;
  breakpointChanges: number;
  orientationChanges: number;
  touchInteractions: number;
  gestureRecognitions: number;
  performanceOptimizations: number;
  imageOptimizations: number;
  layoutShifts: number;
  renderTime: number;
  memoryUsage: number;
}

export interface ResponsiveConfig {
  enableDeviceDetection: boolean;
  enableTouchOptimizations: boolean;
  enableGestureRecognition: boolean;
  enablePerformanceOptimizations: boolean;
  enableImageOptimization: boolean;
  enableHapticFeedback: boolean;
  enableAnimationReduction: boolean;
  enableAccessibility: boolean;
  debugMode: boolean;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

// Store
interface ResponsiveStore {
  // Estado
  deviceInfo: DeviceInfo | null;
  currentBreakpoint: Breakpoint | null;
  breakpoints: Breakpoint[];
  components: ResponsiveComponent[];
  gestures: TouchGesture[];
  viewportSettings: ViewportSettings;
  images: ResponsiveImage[];
  stats: ResponsiveStats;
  config: ResponsiveConfig;
  isInitialized: boolean;
  isDetecting: boolean;
  
  // Ações - Device Detection
  detectDevice: () => Promise<void>;
  updateDeviceInfo: (info: Partial<DeviceInfo>) => void;
  handleOrientationChange: () => void;
  handleResize: () => void;
  
  // Ações - Breakpoints
  addBreakpoint: (breakpoint: Breakpoint) => void;
  updateBreakpoint: (id: string, updates: Partial<Breakpoint>) => void;
  removeBreakpoint: (id: string) => void;
  setCurrentBreakpoint: (breakpoint: Breakpoint) => void;
  getBreakpointForWidth: (width: number) => Breakpoint | null;
  
  // Ações - Components
  registerComponent: (component: ResponsiveComponent) => void;
  updateComponent: (id: string, updates: Partial<ResponsiveComponent>) => void;
  removeComponent: (id: string) => void;
  getComponentConfig: (id: string, breakpoint: string) => any;
  
  // Ações - Touch & Gestures
  addGesture: (gesture: TouchGesture) => void;
  updateGesture: (id: string, updates: Partial<TouchGesture>) => void;
  removeGesture: (id: string) => void;
  handleGesture: (gestureId: string, event: any) => void;
  enableHapticFeedback: (enabled: boolean) => void;
  
  // Ações - Images
  addResponsiveImage: (image: ResponsiveImage) => void;
  updateResponsiveImage: (id: string, updates: Partial<ResponsiveImage>) => void;
  removeResponsiveImage: (id: string) => void;
  getOptimalImageSrc: (id: string, width: number) => string;
  
  // Ações - Viewport
  updateViewportSettings: (settings: Partial<ViewportSettings>) => void;
  applyViewportSettings: () => void;
  
  // Ações - Config
  updateConfig: (updates: Partial<ResponsiveConfig>) => void;
  resetConfig: () => void;
  
  // Ações - Stats
  incrementStat: (stat: keyof ResponsiveStats) => void;
  updateStat: (stat: keyof ResponsiveStats, value: number) => void;
  resetStats: () => void;
  
  // Utilitários
  isMobile: () => boolean;
  isTablet: () => boolean;
  isDesktop: () => boolean;
  isTouchDevice: () => boolean;
  isRetina: () => boolean;
  getScreenSize: () => { width: number; height: number };
  getOrientation: () => 'portrait' | 'landscape';
  getSafeArea: () => { top: number; right: number; bottom: number; left: number };
}

const defaultBreakpoints: Breakpoint[] = [
  {
    id: 'xs',
    name: 'Extra Small',
    minWidth: 0,
    maxWidth: 575,
    columns: 1,
    gutters: 16,
    margins: 16,
    typography: { baseSize: 14, lineHeight: 1.4, scale: 1.2 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 }
  },
  {
    id: 'sm',
    name: 'Small',
    minWidth: 576,
    maxWidth: 767,
    columns: 2,
    gutters: 20,
    margins: 20,
    typography: { baseSize: 15, lineHeight: 1.45, scale: 1.25 },
    spacing: { xs: 6, sm: 10, md: 14, lg: 18, xl: 22 }
  },
  {
    id: 'md',
    name: 'Medium',
    minWidth: 768,
    maxWidth: 991,
    columns: 3,
    gutters: 24,
    margins: 24,
    typography: { baseSize: 16, lineHeight: 1.5, scale: 1.3 },
    spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 }
  },
  {
    id: 'lg',
    name: 'Large',
    minWidth: 992,
    maxWidth: 1199,
    columns: 4,
    gutters: 28,
    margins: 28,
    typography: { baseSize: 17, lineHeight: 1.55, scale: 1.35 },
    spacing: { xs: 10, sm: 14, md: 18, lg: 22, xl: 26 }
  },
  {
    id: 'xl',
    name: 'Extra Large',
    minWidth: 1200,
    columns: 6,
    gutters: 32,
    margins: 32,
    typography: { baseSize: 18, lineHeight: 1.6, scale: 1.4 },
    spacing: { xs: 12, sm: 16, md: 20, lg: 24, xl: 28 }
  }
];

const defaultConfig: ResponsiveConfig = {
  enableDeviceDetection: true,
  enableTouchOptimizations: true,
  enableGestureRecognition: true,
  enablePerformanceOptimizations: true,
  enableImageOptimization: true,
  enableHapticFeedback: true,
  enableAnimationReduction: false,
  enableAccessibility: true,
  debugMode: false,
  logLevel: 'warn'
};

const defaultStats: ResponsiveStats = {
  deviceDetections: 0,
  breakpointChanges: 0,
  orientationChanges: 0,
  touchInteractions: 0,
  gestureRecognitions: 0,
  performanceOptimizations: 0,
  imageOptimizations: 0,
  layoutShifts: 0,
  renderTime: 0,
  memoryUsage: 0
};

const defaultViewportSettings: ViewportSettings = {
  width: 'device-width',
  height: 'device-height',
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: 'cover'
};

export const useResponsiveStore = create<ResponsiveStore>()(subscribeWithSelector((set, get) => ({
  // Estado inicial
  deviceInfo: null,
  currentBreakpoint: null,
  breakpoints: defaultBreakpoints,
  components: [],
  gestures: [],
  viewportSettings: defaultViewportSettings,
  images: [],
  stats: { ...defaultStats },
  config: { ...defaultConfig },
  isInitialized: false,
  isDetecting: false,
  
  // Device Detection
  detectDevice: async () => {
    set({ isDetecting: true });
    
    try {
      const deviceInfo: DeviceInfo = {
        type: getDeviceType(),
        orientation: getOrientation(),
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
          ratio: window.innerWidth / window.innerHeight
        },
        touchCapable: 'ontouchstart' in window,
        pixelRatio: window.devicePixelRatio || 1,
        platform: navigator.platform,
        browser: getBrowserInfo(),
        isRetina: window.devicePixelRatio > 1,
        hasNotch: hasNotch(),
        safeArea: getSafeAreaInsets()
      };
      
      set({ deviceInfo });
      get().incrementStat('deviceDetections');
      
      // Detectar breakpoint atual
      const currentBreakpoint = get().getBreakpointForWidth(window.innerWidth);
      if (currentBreakpoint) {
        get().setCurrentBreakpoint(currentBreakpoint);
      }
      
    } catch (error) {
      console.error('Erro ao detectar dispositivo:', error);
    } finally {
      set({ isDetecting: false });
    }
  },
  
  updateDeviceInfo: (info) => {
    set(state => ({
      deviceInfo: state.deviceInfo ? { ...state.deviceInfo, ...info } : null
    }));
  },
  
  handleOrientationChange: () => {
    const orientation = getOrientation();
    get().updateDeviceInfo({ orientation });
    get().incrementStat('orientationChanges');
    
    // Redetectar breakpoint após mudança de orientação
    setTimeout(() => {
      const currentBreakpoint = get().getBreakpointForWidth(window.innerWidth);
      if (currentBreakpoint) {
        get().setCurrentBreakpoint(currentBreakpoint);
      }
    }, 100);
  },
  
  handleResize: () => {
    const { width, height } = { width: window.innerWidth, height: window.innerHeight };
    get().updateDeviceInfo({
      screenSize: {
        width,
        height,
        ratio: width / height
      }
    });
    
    const currentBreakpoint = get().getBreakpointForWidth(width);
    if (currentBreakpoint && currentBreakpoint.id !== get().currentBreakpoint?.id) {
      get().setCurrentBreakpoint(currentBreakpoint);
    }
  },
  
  // Breakpoints
  addBreakpoint: (breakpoint) => {
    set(state => ({
      breakpoints: [...state.breakpoints, breakpoint].sort((a, b) => a.minWidth - b.minWidth)
    }));
  },
  
  updateBreakpoint: (id, updates) => {
    set(state => ({
      breakpoints: state.breakpoints.map(bp => 
        bp.id === id ? { ...bp, ...updates } : bp
      )
    }));
  },
  
  removeBreakpoint: (id) => {
    set(state => ({
      breakpoints: state.breakpoints.filter(bp => bp.id !== id)
    }));
  },
  
  setCurrentBreakpoint: (breakpoint) => {
    const current = get().currentBreakpoint;
    if (!current || current.id !== breakpoint.id) {
      set({ currentBreakpoint: breakpoint });
      get().incrementStat('breakpointChanges');
    }
  },
  
  getBreakpointForWidth: (width) => {
    const breakpoints = get().breakpoints;
    return breakpoints.find(bp => 
      width >= bp.minWidth && (bp.maxWidth === undefined || width <= bp.maxWidth)
    ) || breakpoints[breakpoints.length - 1];
  },
  
  // Components
  registerComponent: (component) => {
    set(state => ({
      components: [...state.components.filter(c => c.id !== component.id), component]
    }));
  },
  
  updateComponent: (id, updates) => {
    set(state => ({
      components: state.components.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    }));
  },
  
  removeComponent: (id) => {
    set(state => ({
      components: state.components.filter(comp => comp.id !== id)
    }));
  },
  
  getComponentConfig: (id, breakpoint) => {
    const component = get().components.find(c => c.id === id);
    return component?.breakpoints[breakpoint] || null;
  },
  
  // Touch & Gestures
  addGesture: (gesture) => {
    set(state => ({
      gestures: [...state.gestures.filter(g => g.id !== gesture.id), gesture]
    }));
  },
  
  updateGesture: (id, updates) => {
    set(state => ({
      gestures: state.gestures.map(gesture => 
        gesture.id === id ? { ...gesture, ...updates } : gesture
      )
    }));
  },
  
  removeGesture: (id) => {
    set(state => ({
      gestures: state.gestures.filter(gesture => gesture.id !== id)
    }));
  },
  
  handleGesture: (gestureId, event) => {
    const gesture = get().gestures.find(g => g.id === gestureId);
    if (gesture && gesture.enabled) {
      get().incrementStat('gestureRecognitions');
      
      if (gesture.hapticFeedback && get().config.enableHapticFeedback) {
        triggerHapticFeedback();
      }
      
      // Executar ação do gesto
    }
  },
  
  enableHapticFeedback: (enabled) => {
    get().updateConfig({ enableHapticFeedback: enabled });
  },
  
  // Images
  addResponsiveImage: (image) => {
    set(state => ({
      images: [...state.images.filter(img => img.id !== image.id), image]
    }));
  },
  
  updateResponsiveImage: (id, updates) => {
    set(state => ({
      images: state.images.map(img => 
        img.id === id ? { ...img, ...updates } : img
      )
    }));
  },
  
  removeResponsiveImage: (id) => {
    set(state => ({
      images: state.images.filter(img => img.id !== id)
    }));
  },
  
  getOptimalImageSrc: (id, width) => {
    const image = get().images.find(img => img.id === id);
    if (!image) return '';
    
    const breakpoint = get().getBreakpointForWidth(width);
    if (!breakpoint) return image.src;
    
    const imageConfig = image.breakpoints[breakpoint.id];
    if (imageConfig) {
      get().incrementStat('imageOptimizations');
      return imageConfig.src;
    }
    
    return image.src;
  },
  
  // Viewport
  updateViewportSettings: (settings) => {
    set(state => ({
      viewportSettings: { ...state.viewportSettings, ...settings }
    }));
  },
  
  applyViewportSettings: () => {
    const settings = get().viewportSettings;
    const viewport = document.querySelector('meta[name="viewport"]');
    
    if (viewport) {
      const content = [
        `width=${settings.width}`,
        `height=${settings.height}`,
        `initial-scale=${settings.initialScale}`,
        `minimum-scale=${settings.minimumScale}`,
        `maximum-scale=${settings.maximumScale}`,
        `user-scalable=${settings.userScalable ? 'yes' : 'no'}`,
        `viewport-fit=${settings.viewportFit}`
      ].join(', ');
      
      viewport.setAttribute('content', content);
    }
  },
  
  // Config
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: { ...defaultConfig } });
  },
  
  // Stats
  incrementStat: (stat) => {
    set(state => ({
      stats: { ...state.stats, [stat]: state.stats[stat] + 1 }
    }));
  },
  
  updateStat: (stat, value) => {
    set(state => ({
      stats: { ...state.stats, [stat]: value }
    }));
  },
  
  resetStats: () => {
    set({ stats: { ...defaultStats } });
  },
  
  // Utilitários
  isMobile: () => get().deviceInfo?.type === 'mobile',
  isTablet: () => get().deviceInfo?.type === 'tablet',
  isDesktop: () => get().deviceInfo?.type === 'desktop',
  isTouchDevice: () => get().deviceInfo?.touchCapable || false,
  isRetina: () => get().deviceInfo?.isRetina || false,
  getScreenSize: () => get().deviceInfo?.screenSize || { width: 0, height: 0 },
  getOrientation: () => get().deviceInfo?.orientation || 'portrait',
  getSafeArea: () => get().deviceInfo?.safeArea || { top: 0, right: 0, bottom: 0, left: 0 }
})));

// Manager Class
class ResponsiveManager {
  private store = useResponsiveStore;
  private resizeObserver?: ResizeObserver;
  private orientationListener?: () => void;
  private resizeListener?: () => void;
  
  async initialize() {
    if (this.store.getState().isInitialized) return;
    
    try {
      // Detectar dispositivo inicial
      await this.store.getState().detectDevice();
      
      // Aplicar configurações de viewport
      this.store.getState().applyViewportSettings();
      
      // Configurar listeners
      this.setupEventListeners();
      
      // Configurar gestos padrão
      this.setupDefaultGestures();
      
      // Configurar otimizações de performance
      this.setupPerformanceOptimizations();
      
      this.store.setState({ isInitialized: true });
      
    } catch (error) {
      console.error('Erro ao inicializar ResponsiveManager:', error);
    }
  }
  
  private setupEventListeners() {
    // Listener de orientação
    this.orientationListener = () => {
      this.store.getState().handleOrientationChange();
    };
    
    // Listener de resize
    this.resizeListener = () => {
      this.store.getState().handleResize();
    };
    
    window.addEventListener('orientationchange', this.orientationListener);
    window.addEventListener('resize', this.resizeListener);
    
    // ResizeObserver para elementos específicos
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // Processar mudanças de tamanho de elementos
          this.store.getState().incrementStat('layoutShifts');
        }
      });
    }
  }
  
  private setupDefaultGestures() {
    const defaultGestures: TouchGesture[] = [
      {
        id: 'tap',
        type: 'tap',
        element: 'button',
        action: 'click',
        threshold: 10,
        enabled: true,
        hapticFeedback: true
      },
      {
        id: 'swipe-left',
        type: 'swipe',
        element: '.swipeable',
        action: 'navigate-back',
        threshold: 50,
        enabled: true,
        hapticFeedback: false
      },
      {
        id: 'swipe-right',
        type: 'swipe',
        element: '.swipeable',
        action: 'navigate-forward',
        threshold: 50,
        enabled: true,
        hapticFeedback: false
      },
      {
        id: 'long-press',
        type: 'long-press',
        element: '.context-menu',
        action: 'show-context-menu',
        threshold: 500,
        enabled: true,
        hapticFeedback: true
      }
    ];
    
    defaultGestures.forEach(gesture => {
      this.store.getState().addGesture(gesture);
    });
  }
  
  private setupPerformanceOptimizations() {
    // Reduzir animações em dispositivos com baixa performance
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      this.store.getState().updateConfig({ enableAnimationReduction: true });
    }
    
    // Detectar preferência de movimento reduzido
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.store.getState().updateConfig({ enableAnimationReduction: true });
    }
    
    // Monitorar performance
    this.startPerformanceMonitoring();
  }
  
  private startPerformanceMonitoring() {
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.store.getState().updateStat('renderTime', entry.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }
    
    // Monitorar uso de memória
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.store.getState().updateStat('memoryUsage', memory.usedJSHeapSize);
        }
      }, 5000);
    }
  }
  
  observeElement(element: Element) {
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }
  }
  
  unobserveElement(element: Element) {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(element);
    }
  }
  
  destroy() {
    if (this.orientationListener) {
      window.removeEventListener('orientationchange', this.orientationListener);
    }
    
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// Instância global
export const responsiveManager = new ResponsiveManager();

// Funções utilitárias
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'tv' {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent;
  
  if (width >= 1920) return 'tv';
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  
  return 'Unknown';
}

function hasNotch(): boolean {
  // Detectar notch em dispositivos iOS
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
  return safeAreaTop > 20;
}

function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0')
  };
}

function triggerHapticFeedback() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

// Utilitários de formatação
export const formatters = {
  fileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },
  
  percentage: (value: number): string => `${(value * 100).toFixed(1)}%`,
  
  duration: (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  },
  
  timestamp: (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  }
};

// Ícones e cores
export const getDeviceIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    mobile: '📱',
    tablet: '📱',
    desktop: '💻',
    tv: '📺'
  };
  return icons[type] || '❓';
};

export const getOrientationIcon = (orientation: string): string => {
  const icons: { [key: string]: string } = {
    portrait: '📱',
    landscape: '📱'
  };
  return icons[orientation] || '❓';
};

export const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    active: '#10b981',
    inactive: '#6b7280',
    detecting: '#3b82f6',
    error: '#ef4444'
  };
  return colors[status] || '#6b7280';
};

// Hook personalizado
export const useResponsive = (options: {
  enableDeviceDetection?: boolean;
  enableTouchOptimizations?: boolean;
  enableGestureRecognition?: boolean;
  enablePerformanceOptimizations?: boolean;
} = {}) => {
  const store = useResponsiveStore();
  
  React.useEffect(() => {
    if (options.enableDeviceDetection !== false) {
      responsiveManager.initialize();
    }
  }, []);
  
  return {
    // Estado
    deviceInfo: store.deviceInfo,
    currentBreakpoint: store.currentBreakpoint,
    breakpoints: store.breakpoints,
    components: store.components,
    gestures: store.gestures,
    images: store.images,
    stats: store.stats,
    config: store.config,
    isInitialized: store.isInitialized,
    isDetecting: store.isDetecting,
    
    // Ações
    detectDevice: store.detectDevice,
    registerComponent: store.registerComponent,
    addGesture: store.addGesture,
    addResponsiveImage: store.addResponsiveImage,
    updateConfig: store.updateConfig,
    
    // Utilitários
    isMobile: store.isMobile,
    isTablet: store.isTablet,
    isDesktop: store.isDesktop,
    isTouchDevice: store.isTouchDevice,
    isRetina: store.isRetina,
    getScreenSize: store.getScreenSize,
    getOrientation: store.getOrientation,
    getSafeArea: store.getSafeArea,
    
    // Formatadores
    formatters,
    getDeviceIcon,
    getOrientationIcon,
    getStatusColor
  };
};