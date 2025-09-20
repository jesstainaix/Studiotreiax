// Hook React para sistema de responsividade móvel
import React, { useEffect, useCallback, useMemo } from 'react';
import {
  useResponsiveStore,
  responsiveManager,
  DeviceInfo,
  Breakpoint,
  ResponsiveComponent,
  TouchGesture,
  ResponsiveImage,
  ResponsiveStats,
  ResponsiveConfig,
  formatters,
  getDeviceIcon,
  getOrientationIcon,
  getStatusColor
} from '../utils/mobileResponsiveness';

// Interfaces para opções e retorno
export interface UseMobileResponsivenessOptions {
  enableDeviceDetection?: boolean;
  enableTouchOptimizations?: boolean;
  enableGestureRecognition?: boolean;
  enablePerformanceOptimizations?: boolean;
  enableImageOptimization?: boolean;
  enableHapticFeedback?: boolean;
  enableAnimationReduction?: boolean;
  enableAccessibility?: boolean;
  autoInitialize?: boolean;
  debugMode?: boolean;
}

export interface UseMobileResponsivenessReturn {
  // Estado
  deviceInfo: DeviceInfo | null;
  currentBreakpoint: Breakpoint | null;
  breakpoints: Breakpoint[];
  components: ResponsiveComponent[];
  gestures: TouchGesture[];
  images: ResponsiveImage[];
  stats: ResponsiveStats;
  config: ResponsiveConfig;
  isInitialized: boolean;
  isDetecting: boolean;
  
  // Ações - Device
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
  
  // Ações - Gestures
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
  
  // Estado derivado
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  hasTouch: boolean;
  isHighDPI: boolean;
  
  // Ações avançadas
  observeElement: (element: Element) => void;
  unobserveElement: (element: Element) => void;
  createResponsiveComponent: (id: string, config: any) => void;
  createTouchGesture: (id: string, config: any) => void;
  optimizeForDevice: () => void;
  
  // Formatadores e utilitários
  formatters: typeof formatters;
  getDeviceIcon: typeof getDeviceIcon;
  getOrientationIcon: typeof getOrientationIcon;
  getStatusColor: typeof getStatusColor;
}

// Hook principal
export const useMobileResponsiveness = (options: UseMobileResponsivenessOptions = {}): UseMobileResponsivenessReturn => {
  const {
    enableDeviceDetection = true,
    enableTouchOptimizations = true,
    enableGestureRecognition = true,
    enablePerformanceOptimizations = true,
    enableImageOptimization = true,
    enableHapticFeedback = true,
    enableAnimationReduction = false,
    enableAccessibility = true,
    autoInitialize = true,
    debugMode = false
  } = options;
  
  // Estado do store
  const {
    deviceInfo,
    currentBreakpoint,
    breakpoints,
    components,
    gestures,
    images,
    stats,
    config,
    isInitialized,
    isDetecting,
    
    // Ações
    detectDevice,
    updateDeviceInfo,
    handleOrientationChange,
    handleResize,
    addBreakpoint,
    updateBreakpoint,
    removeBreakpoint,
    setCurrentBreakpoint,
    getBreakpointForWidth,
    registerComponent,
    updateComponent,
    removeComponent,
    getComponentConfig,
    addGesture,
    updateGesture,
    removeGesture,
    handleGesture,
    enableHapticFeedback: enableHaptic,
    addResponsiveImage,
    updateResponsiveImage,
    removeResponsiveImage,
    getOptimalImageSrc,
    updateConfig,
    resetConfig,
    incrementStat,
    updateStat,
    resetStats,
    
    // Utilitários
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isRetina,
    getScreenSize,
    getOrientation,
    getSafeArea
  } = useResponsiveStore();
  
  // Inicialização
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      const initConfig = {
        enableDeviceDetection,
        enableTouchOptimizations,
        enableGestureRecognition,
        enablePerformanceOptimizations,
        enableImageOptimization,
        enableHapticFeedback,
        enableAnimationReduction,
        enableAccessibility,
        debugMode
      };
      
      updateConfig(initConfig);
      responsiveManager.initialize();
    }
  }, [autoInitialize, isInitialized]);
  
  // Estado derivado
  const isSmallScreen = useMemo(() => {
    return currentBreakpoint?.id === 'xs' || currentBreakpoint?.id === 'sm';
  }, [currentBreakpoint]);
  
  const isMediumScreen = useMemo(() => {
    return currentBreakpoint?.id === 'md';
  }, [currentBreakpoint]);
  
  const isLargeScreen = useMemo(() => {
    return currentBreakpoint?.id === 'lg' || currentBreakpoint?.id === 'xl';
  }, [currentBreakpoint]);
  
  const isPortrait = useMemo(() => {
    return getOrientation() === 'portrait';
  }, [deviceInfo?.orientation]);
  
  const isLandscape = useMemo(() => {
    return getOrientation() === 'landscape';
  }, [deviceInfo?.orientation]);
  
  const hasTouch = useMemo(() => {
    return isTouchDevice();
  }, [deviceInfo?.touchCapable]);
  
  const isHighDPI = useMemo(() => {
    return isRetina();
  }, [deviceInfo?.isRetina]);
  
  // Ações avançadas
  const observeElement = useCallback((element: Element) => {
    responsiveManager.observeElement(element);
  }, []);
  
  const unobserveElement = useCallback((element: Element) => {
    responsiveManager.unobserveElement(element);
  }, []);
  
  const createResponsiveComponent = useCallback((id: string, config: any) => {
    const component: ResponsiveComponent = {
      id,
      name: config.name || id,
      breakpoints: config.breakpoints || {},
      touchOptimizations: {
        minTouchTarget: config.minTouchTarget || 44,
        gestureSupport: config.gestureSupport || [],
        hapticFeedback: config.hapticFeedback || false,
        swipeActions: config.swipeActions || false
      },
      performanceOptimizations: {
        lazyLoad: config.lazyLoad || false,
        virtualScroll: config.virtualScroll || false,
        imageOptimization: config.imageOptimization || false,
        animationReduction: config.animationReduction || false
      }
    };
    
    registerComponent(component);
  }, [registerComponent]);
  
  const createTouchGesture = useCallback((id: string, config: any) => {
    const gesture: TouchGesture = {
      id,
      type: config.type || 'tap',
      element: config.element || 'body',
      action: config.action || 'default',
      threshold: config.threshold || 10,
      enabled: config.enabled !== false,
      hapticFeedback: config.hapticFeedback || false
    };
    
    addGesture(gesture);
  }, [addGesture]);
  
  const optimizeForDevice = useCallback(() => {
    if (!deviceInfo) return;
    
    const optimizations: Partial<ResponsiveConfig> = {};
    
    // Otimizações baseadas no tipo de dispositivo
    if (deviceInfo.type === 'mobile') {
      optimizations.enableTouchOptimizations = true;
      optimizations.enableGestureRecognition = true;
      optimizations.enablePerformanceOptimizations = true;
    }
    
    // Otimizações baseadas na performance
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      optimizations.enableAnimationReduction = true;
      optimizations.enablePerformanceOptimizations = true;
    }
    
    // Otimizações baseadas na conexão
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType && connection.effectiveType.includes('2g')) {
        optimizations.enableImageOptimization = true;
        optimizations.enablePerformanceOptimizations = true;
      }
    }
    
    // Otimizações baseadas na bateria
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          updateConfig({
            enableAnimationReduction: true,
            enablePerformanceOptimizations: true
          });
        }
      });
    }
    
    updateConfig(optimizations);
    incrementStat('performanceOptimizations');
  }, [deviceInfo, updateConfig, incrementStat]);
  
  return {
    // Estado
    deviceInfo,
    currentBreakpoint,
    breakpoints,
    components,
    gestures,
    images,
    stats,
    config,
    isInitialized,
    isDetecting,
    
    // Ações - Device
    detectDevice,
    updateDeviceInfo,
    handleOrientationChange,
    handleResize,
    
    // Ações - Breakpoints
    addBreakpoint,
    updateBreakpoint,
    removeBreakpoint,
    setCurrentBreakpoint,
    getBreakpointForWidth,
    
    // Ações - Components
    registerComponent,
    updateComponent,
    removeComponent,
    getComponentConfig,
    
    // Ações - Gestures
    addGesture,
    updateGesture,
    removeGesture,
    handleGesture,
    enableHapticFeedback: enableHaptic,
    
    // Ações - Images
    addResponsiveImage,
    updateResponsiveImage,
    removeResponsiveImage,
    getOptimalImageSrc,
    
    // Ações - Config
    updateConfig,
    resetConfig,
    
    // Ações - Stats
    incrementStat,
    updateStat,
    resetStats,
    
    // Utilitários
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isRetina,
    getScreenSize,
    getOrientation,
    getSafeArea,
    
    // Estado derivado
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isPortrait,
    isLandscape,
    hasTouch,
    isHighDPI,
    
    // Ações avançadas
    observeElement,
    unobserveElement,
    createResponsiveComponent,
    createTouchGesture,
    optimizeForDevice,
    
    // Formatadores e utilitários
    formatters,
    getDeviceIcon,
    getOrientationIcon,
    getStatusColor
  };
};

// Hook para detecção automática de dispositivo
export const useAutoDeviceDetection = (options: {
  interval?: number;
  enableOrientationTracking?: boolean;
  enableResizeTracking?: boolean;
} = {}) => {
  const {
    interval = 5000,
    enableOrientationTracking = true,
    enableResizeTracking = true
  } = options;
  
  const { detectDevice, handleOrientationChange, handleResize } = useMobileResponsiveness();
  
  useEffect(() => {
    // Detecção inicial
    detectDevice();
    
    // Detecção periódica
    const intervalId = setInterval(detectDevice, interval);
    
    // Listeners de eventos
    const orientationHandler = () => {
      if (enableOrientationTracking) {
        handleOrientationChange();
      }
    };
    
    const resizeHandler = () => {
      if (enableResizeTracking) {
        handleResize();
      }
    };
    
    if (enableOrientationTracking) {
      window.addEventListener('orientationchange', orientationHandler);
    }
    
    if (enableResizeTracking) {
      window.addEventListener('resize', resizeHandler);
    }
    
    return () => {
      clearInterval(intervalId);
      
      if (enableOrientationTracking) {
        window.removeEventListener('orientationchange', orientationHandler);
      }
      
      if (enableResizeTracking) {
        window.removeEventListener('resize', resizeHandler);
      }
    };
  }, [detectDevice, handleOrientationChange, handleResize, interval, enableOrientationTracking, enableResizeTracking]);
};

// Hook para performance de responsividade
export const useResponsivePerformance = () => {
  const { stats, updateStat } = useMobileResponsiveness();
  
  const measureRenderTime = useCallback((componentName: string, renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    updateStat('renderTime', renderTime);
    
    if (renderTime > 16) { // Mais de 16ms pode causar jank
      console.warn(`Componente ${componentName} demorou ${renderTime.toFixed(2)}ms para renderizar`);
    }
  }, [updateStat]);
  
  const measureLayoutShift = useCallback((element: Element) => {
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        updateStat('layoutShifts', stats.layoutShifts + 1);
      });
      
      observer.observe(element);
      
      return () => observer.disconnect();
    }
  }, [updateStat, stats.layoutShifts]);
  
  return {
    stats,
    measureRenderTime,
    measureLayoutShift
  };
};

// Hook para estatísticas de responsividade
export const useResponsiveStats = () => {
  const { stats, resetStats } = useMobileResponsiveness();
  
  const getPerformanceScore = useCallback(() => {
    const {
      renderTime,
      layoutShifts,
      memoryUsage,
      performanceOptimizations
    } = stats;
    
    let score = 100;
    
    // Penalizar tempo de renderização alto
    if (renderTime > 16) score -= Math.min(30, (renderTime - 16) * 2);
    
    // Penalizar layout shifts
    if (layoutShifts > 5) score -= Math.min(20, (layoutShifts - 5) * 2);
    
    // Penalizar uso de memória alto
    if (memoryUsage > 50 * 1024 * 1024) { // 50MB
      score -= Math.min(25, (memoryUsage - 50 * 1024 * 1024) / (1024 * 1024));
    }
    
    // Bonificar otimizações
    score += Math.min(15, performanceOptimizations * 2);
    
    return Math.max(0, Math.min(100, score));
  }, [stats]);
  
  const getUsageReport = useCallback(() => {
    return {
      totalInteractions: stats.touchInteractions + stats.gestureRecognitions,
      deviceChanges: stats.deviceDetections + stats.orientationChanges,
      optimizations: stats.performanceOptimizations + stats.imageOptimizations,
      performanceScore: getPerformanceScore()
    };
  }, [stats, getPerformanceScore]);
  
  return {
    stats,
    getPerformanceScore,
    getUsageReport,
    resetStats
  };
};

// Hook para configuração de responsividade
export const useResponsiveConfig = () => {
  const { config, updateConfig, resetConfig } = useMobileResponsiveness();
  
  const toggleFeature = useCallback((feature: keyof ResponsiveConfig) => {
    updateConfig({ [feature]: !config[feature] });
  }, [config, updateConfig]);
  
  const setLogLevel = useCallback((level: ResponsiveConfig['logLevel']) => {
    updateConfig({ logLevel: level });
  }, [updateConfig]);
  
  const enableDebugMode = useCallback((enabled: boolean) => {
    updateConfig({ debugMode: enabled });
  }, [updateConfig]);
  
  const optimizeForPerformance = useCallback(() => {
    updateConfig({
      enablePerformanceOptimizations: true,
      enableAnimationReduction: true,
      enableImageOptimization: true,
      logLevel: 'error'
    });
  }, [updateConfig]);
  
  const optimizeForAccessibility = useCallback(() => {
    updateConfig({
      enableAccessibility: true,
      enableAnimationReduction: true,
      enableHapticFeedback: true,
      logLevel: 'info'
    });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    toggleFeature,
    setLogLevel,
    enableDebugMode,
    optimizeForPerformance,
    optimizeForAccessibility
  };
};

// Hook para debug de responsividade
export const useResponsiveDebug = () => {
  const {
    deviceInfo,
    currentBreakpoint,
    stats,
    config,
    isInitialized,
    isDetecting
  } = useMobileResponsiveness();
  
  const debugInfo = useMemo(() => {
    return {
      device: {
        type: deviceInfo?.type,
        orientation: deviceInfo?.orientation,
        screenSize: deviceInfo?.screenSize,
        touchCapable: deviceInfo?.touchCapable,
        pixelRatio: deviceInfo?.pixelRatio,
        platform: deviceInfo?.platform,
        browser: deviceInfo?.browser
      },
      breakpoint: {
        current: currentBreakpoint?.id,
        name: currentBreakpoint?.name,
        minWidth: currentBreakpoint?.minWidth,
        maxWidth: currentBreakpoint?.maxWidth
      },
      performance: {
        renderTime: stats.renderTime,
        layoutShifts: stats.layoutShifts,
        memoryUsage: formatters.fileSize(stats.memoryUsage)
      },
      status: {
        initialized: isInitialized,
        detecting: isDetecting,
        debugMode: config.debugMode
      }
    };
  }, [deviceInfo, currentBreakpoint, stats, config, isInitialized, isDetecting]);
  
  const logDebugInfo = useCallback(() => {
    if (config.debugMode) {
      console.group('🔧 Responsive Debug Info');
      console.table(debugInfo.device);
      console.table(debugInfo.breakpoint);
      console.table(debugInfo.performance);
      console.table(debugInfo.status);
      console.groupEnd();
    }
  }, [debugInfo, config.debugMode]);
  
  useEffect(() => {
    if (config.debugMode) {
      const interval = setInterval(logDebugInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [config.debugMode, logDebugInfo]);
  
  return {
    debugInfo,
    logDebugInfo
  };
};