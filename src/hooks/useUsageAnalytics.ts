// Hook para usar o sistema de analytics em componentes React
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  useAnalyticsStore, 
  analyticsManager,
  UserAction,
  AnalyticsEvent,
  UserSession,
  PageMetrics,
  FeatureUsage,
  UserBehavior,
  AnalyticsInsight,
  ConversionFunnel,
  AnalyticsConfig,
  AnalyticsStats
} from '../utils/usageAnalytics';

// Interfaces
export interface UseAnalyticsOptions {
  autoInitialize?: boolean;
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackScrolling?: boolean;
  trackFeatureUsage?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  userId?: string;
  sessionTimeout?: number;
  enableRealTime?: boolean;
  enableInsights?: boolean;
  debugMode?: boolean;
}

export interface UseAnalyticsReturn {
  // Estado
  isInitialized: boolean;
  isTracking: boolean;
  currentSession: UserSession | null;
  actions: UserAction[];
  sessions: UserSession[];
  pageMetrics: PageMetrics[];
  featureUsage: FeatureUsage[];
  userBehaviors: UserBehavior[];
  events: AnalyticsEvent[];
  funnels: ConversionFunnel[];
  insights: AnalyticsInsight[];
  config: AnalyticsConfig;
  stats: AnalyticsStats;
  
  // Ações de Tracking
  initialize: () => Promise<void>;
  startTracking: () => void;
  stopTracking: () => void;
  trackAction: (action: Omit<UserAction, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackPageView: (page: string, title?: string) => void;
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackFeatureUsage: (featureId: string, metadata?: Record<string, any>) => void;
  trackConversion: (funnelId: string, stepId: string, value?: number) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, context?: Record<string, any>) => void;
  
  // Ações de Sessão
  startSession: (userId?: string) => UserSession;
  endSession: () => void;
  updateSession: (updates: Partial<UserSession>) => void;
  getActiveSession: () => UserSession | null;
  
  // Ações de Análise
  analyzeUserBehavior: (userId: string) => UserBehavior | null;
  generateInsights: () => AnalyticsInsight[];
  calculateEngagementScore: (userId?: string) => number;
  calculateChurnRisk: (userId: string) => number;
  getConversionFunnel: (funnelId: string) => ConversionFunnel | null;
  
  // Ações de Métricas
  getPageMetrics: (path: string) => PageMetrics | null;
  getFeatureMetrics: (featureId: string) => FeatureUsage | null;
  getRealtimeMetrics: () => Record<string, number>;
  getTopPages: (limit?: number) => PageMetrics[];
  getTopFeatures: (limit?: number) => FeatureUsage[];
  
  // Ações de Configuração
  updateConfig: (updates: Partial<AnalyticsConfig>) => void;
  enableFeature: (feature: keyof AnalyticsConfig) => void;
  disableFeature: (feature: keyof AnalyticsConfig) => void;
  setPrivacyMode: (enabled: boolean) => void;
  setSamplingRate: (rate: number) => void;
  
  // Ações de Dados
  exportData: (format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
  importData: (data: any) => Promise<void>;
  clearData: (type?: 'actions' | 'sessions' | 'events' | 'all') => void;
  
  // Utilitários
  resetStats: () => void;
  getHealthStatus: () => Record<string, any>;
  
  // Estado Derivado
  realtimeMetrics: Record<string, number>;
  topPages: PageMetrics[];
  topFeatures: FeatureUsage[];
  engagementScore: number;
  healthStatus: Record<string, any>;
  
  // Funções Utilitárias
  formatDuration: (ms: number) => string;
  formatPercentage: (value: number) => string;
  formatNumber: (value: number) => string;
  formatFileSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
  getActionIcon: (type: UserAction['type']) => string;
  getInsightIcon: (type: AnalyticsInsight['type']) => string;
  getEngagementIcon: (level: UserBehavior['engagementLevel']) => string;
  getEngagementColor: (level: UserBehavior['engagementLevel']) => string;
  getInsightColor: (type: AnalyticsInsight['type']) => string;
  getPerformanceColor: (score: number) => string;
  
  // Ações Avançadas
  trackComponentMount: (componentName: string) => void;
  trackComponentUnmount: (componentName: string) => void;
  trackUserInteraction: (element: string, action: string, metadata?: Record<string, any>) => void;
  trackFormSubmission: (formName: string, success: boolean, errors?: string[]) => void;
  trackSearchQuery: (query: string, results: number, filters?: Record<string, any>) => void;
  trackDownload: (fileName: string, fileSize: number, fileType: string) => void;
  trackVideoPlay: (videoId: string, duration: number, position: number) => void;
  trackSocialShare: (platform: string, content: string, url: string) => void;
  createCustomFunnel: (name: string, steps: string[]) => ConversionFunnel;
  trackFunnelStep: (funnelId: string, stepId: string, metadata?: Record<string, any>) => void;
}

// Hook principal
export const useUsageAnalytics = (options: UseAnalyticsOptions = {}): UseAnalyticsReturn => {
  const {
    autoInitialize = true,
    trackPageViews = true,
    trackClicks = true,
    trackScrolling = true,
    trackFeatureUsage = true,
    trackPerformance = true,
    trackErrors = true,
    userId,
    sessionTimeout = 30 * 60 * 1000,
    enableRealTime = true,
    enableInsights = true,
    debugMode = false
  } = options;
  
  // Store state
  const store = useAnalyticsStore();
  const initRef = useRef(false);
  
  // Inicialização automática
  useEffect(() => {
    if (autoInitialize && !initRef.current) {
      initRef.current = true;
      analyticsManager.initialize().then(() => {
        if (userId) {
          store.startSession(userId);
        }
        
        // Configurar opções
        store.updateConfig({
          enableTracking: true,
          enableRealTimeAnalytics: enableRealTime,
          enableInsights,
          sessionTimeout,
          debugMode
        });
      });
    }
  }, [autoInitialize, userId, sessionTimeout, enableRealTime, enableInsights, debugMode]);
  
  // Tracking automático de página
  useEffect(() => {
    if (trackPageViews && store.isTracking) {
      store.trackPageView(window.location.pathname, document.title);
    }
  }, [trackPageViews, store.isTracking]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (store.currentSession) {
        store.endSession();
      }
    };
  }, []);
  
  // Ações de tracking personalizadas
  const trackComponentMount = useCallback((componentName: string) => {
    store.trackEvent({
      name: 'component_mount',
      category: 'component',
      action: 'mount',
      label: componentName,
      properties: { componentName }
    });
  }, [store]);
  
  const trackComponentUnmount = useCallback((componentName: string) => {
    store.trackEvent({
      name: 'component_unmount',
      category: 'component',
      action: 'unmount',
      label: componentName,
      properties: { componentName }
    });
  }, [store]);
  
  const trackUserInteraction = useCallback((element: string, action: string, metadata?: Record<string, any>) => {
    store.trackAction({
      type: 'click',
      element,
      page: window.location.pathname,
      metadata: { action, ...metadata }
    });
  }, [store]);
  
  const trackFormSubmission = useCallback((formName: string, success: boolean, errors?: string[]) => {
    store.trackEvent({
      name: 'form_submission',
      category: 'form',
      action: success ? 'submit_success' : 'submit_error',
      label: formName,
      properties: { formName, success, errors }
    });
  }, [store]);
  
  const trackSearchQuery = useCallback((query: string, results: number, filters?: Record<string, any>) => {
    store.trackEvent({
      name: 'search',
      category: 'search',
      action: 'query',
      label: query,
      value: results,
      properties: { query, results, filters }
    });
  }, [store]);
  
  const trackDownload = useCallback((fileName: string, fileSize: number, fileType: string) => {
    store.trackEvent({
      name: 'download',
      category: 'file',
      action: 'download',
      label: fileName,
      value: fileSize,
      properties: { fileName, fileSize, fileType }
    });
  }, [store]);
  
  const trackVideoPlay = useCallback((videoId: string, duration: number, position: number) => {
    store.trackEvent({
      name: 'video_play',
      category: 'media',
      action: 'play',
      label: videoId,
      value: position,
      properties: { videoId, duration, position }
    });
  }, [store]);
  
  const trackSocialShare = useCallback((platform: string, content: string, url: string) => {
    store.trackEvent({
      name: 'social_share',
      category: 'social',
      action: 'share',
      label: platform,
      properties: { platform, content, url }
    });
  }, [store]);
  
  const createCustomFunnel = useCallback((name: string, steps: string[]): ConversionFunnel => {
    const funnel: ConversionFunnel = {
      id: `funnel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      steps: steps.map((stepName, index) => ({
        id: `step-${index}`,
        name: stepName,
        condition: '',
        users: 0,
        conversionRate: 0,
        dropoffRate: 0,
        averageTime: 0
      })),
      totalUsers: 0,
      overallConversionRate: 0,
      averageCompletionTime: 0
    };
    
    useAnalyticsStore.setState(state => ({
      funnels: [...state.funnels, funnel]
    }));
    
    return funnel;
  }, []);
  
  const trackFunnelStep = useCallback((funnelId: string, stepId: string, metadata?: Record<string, any>) => {
    store.trackConversion(funnelId, stepId);
    
    if (metadata) {
      store.trackEvent({
        name: 'funnel_step',
        category: 'funnel',
        action: 'step_complete',
        label: `${funnelId}:${stepId}`,
        properties: { funnelId, stepId, ...metadata }
      });
    }
  }, [store]);
  
  // Estado derivado
  const realtimeMetrics = useMemo(() => {
    return store.getRealtimeMetrics();
  }, [store.actions, store.sessions, store.events]);
  
  const topPages = useMemo(() => {
    return store.getTopPages(5);
  }, [store.pageMetrics]);
  
  const topFeatures = useMemo(() => {
    return store.getTopFeatures(5);
  }, [store.featureUsage]);
  
  const engagementScore = useMemo(() => {
    return store.calculateEngagementScore();
  }, [store.sessions, store.actions]);
  
  const healthStatus = useMemo(() => {
    return store.getHealthStatus();
  }, [store.isInitialized, store.isTracking, store.currentSession, store.actions]);
  
  // Formatadores
  const formatDuration = useCallback((ms: number) => store.formatters.duration(ms), [store]);
  const formatPercentage = useCallback((value: number) => store.formatters.percentage(value), [store]);
  const formatNumber = useCallback((value: number) => store.formatters.number(value), [store]);
  const formatFileSize = useCallback((bytes: number) => store.formatters.fileSize(bytes), [store]);
  const formatDate = useCallback((timestamp: number) => store.formatters.date(timestamp), [store]);
  
  // Ícones e cores
  const getActionIcon = useCallback((type: UserAction['type']) => store.icons.getActionIcon(type), [store]);
  const getInsightIcon = useCallback((type: AnalyticsInsight['type']) => store.icons.getInsightIcon(type), [store]);
  const getEngagementIcon = useCallback((level: UserBehavior['engagementLevel']) => store.icons.getEngagementIcon(level), [store]);
  const getEngagementColor = useCallback((level: UserBehavior['engagementLevel']) => store.colors.getEngagementColor(level), [store]);
  const getInsightColor = useCallback((type: AnalyticsInsight['type']) => store.colors.getInsightColor(type), [store]);
  const getPerformanceColor = useCallback((score: number) => store.colors.getPerformanceColor(score), [store]);
  
  return {
    // Estado
    isInitialized: store.isInitialized,
    isTracking: store.isTracking,
    currentSession: store.currentSession,
    actions: store.actions,
    sessions: store.sessions,
    pageMetrics: store.pageMetrics,
    featureUsage: store.featureUsage,
    userBehaviors: store.userBehaviors,
    events: store.events,
    funnels: store.funnels,
    insights: store.insights,
    config: store.config,
    stats: store.stats,
    
    // Ações de Tracking
    initialize: store.initialize,
    startTracking: store.startTracking,
    stopTracking: store.stopTracking,
    trackAction: store.trackAction,
    trackPageView: store.trackPageView,
    trackEvent: store.trackEvent,
    trackFeatureUsage: store.trackFeatureUsage,
    trackConversion: store.trackConversion,
    trackError: store.trackError,
    trackPerformance: store.trackPerformance,
    
    // Ações de Sessão
    startSession: store.startSession,
    endSession: store.endSession,
    updateSession: store.updateSession,
    getActiveSession: store.getActiveSession,
    
    // Ações de Análise
    analyzeUserBehavior: store.analyzeUserBehavior,
    generateInsights: store.generateInsights,
    calculateEngagementScore: store.calculateEngagementScore,
    calculateChurnRisk: store.calculateChurnRisk,
    getConversionFunnel: store.getConversionFunnel,
    
    // Ações de Métricas
    getPageMetrics: store.getPageMetrics,
    getFeatureMetrics: store.getFeatureMetrics,
    getRealtimeMetrics: store.getRealtimeMetrics,
    getTopPages: store.getTopPages,
    getTopFeatures: store.getTopFeatures,
    
    // Ações de Configuração
    updateConfig: store.updateConfig,
    enableFeature: store.enableFeature,
    disableFeature: store.disableFeature,
    setPrivacyMode: store.setPrivacyMode,
    setSamplingRate: store.setSamplingRate,
    
    // Ações de Dados
    exportData: store.exportData,
    importData: store.importData,
    clearData: store.clearData,
    
    // Utilitários
    resetStats: store.resetStats,
    getHealthStatus: store.getHealthStatus,
    
    // Estado Derivado
    realtimeMetrics,
    topPages,
    topFeatures,
    engagementScore,
    healthStatus,
    
    // Funções Utilitárias
    formatDuration,
    formatPercentage,
    formatNumber,
    formatFileSize,
    formatDate,
    getActionIcon,
    getInsightIcon,
    getEngagementIcon,
    getEngagementColor,
    getInsightColor,
    getPerformanceColor,
    
    // Ações Avançadas
    trackComponentMount,
    trackComponentUnmount,
    trackUserInteraction,
    trackFormSubmission,
    trackSearchQuery,
    trackDownload,
    trackVideoPlay,
    trackSocialShare,
    createCustomFunnel,
    trackFunnelStep
  };
};

// Hook para auto-tracking de componentes
export const useAutoAnalytics = (componentName: string, options: UseAnalyticsOptions = {}) => {
  const analytics = useUsageAnalytics(options);
  
  useEffect(() => {
    analytics.trackComponentMount(componentName);
    
    return () => {
      analytics.trackComponentUnmount(componentName);
    };
  }, [analytics, componentName]);
  
  return analytics;
};

// Hook para métricas de performance
export const useAnalyticsPerformance = () => {
  const analytics = useUsageAnalytics();
  const performanceRef = useRef<Record<string, number>>({});
  
  const startTimer = useCallback((name: string) => {
    performanceRef.current[name] = performance.now();
  }, []);
  
  const endTimer = useCallback((name: string, metadata?: Record<string, any>) => {
    const startTime = performanceRef.current[name];
    if (startTime) {
      const duration = performance.now() - startTime;
      analytics.trackPerformance(name, duration, metadata);
      delete performanceRef.current[name];
      return duration;
    }
    return 0;
  }, [analytics]);
  
  const measureAsync = useCallback(async <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> => {
    startTimer(name);
    try {
      const result = await fn();
      endTimer(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTimer(name, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [startTimer, endTimer]);
  
  const measureSync = useCallback(<T>(name: string, fn: () => T, metadata?: Record<string, any>): T => {
    startTimer(name);
    try {
      const result = fn();
      endTimer(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTimer(name, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [startTimer, endTimer]);
  
  return {
    startTimer,
    endTimer,
    measureAsync,
    measureSync,
    ...analytics
  };
};

// Hook para estatísticas em tempo real
export const useAnalyticsStats = (refreshInterval: number = 5000) => {
  const analytics = useUsageAnalytics();
  const [stats, setStats] = useState(analytics.stats);
  const [realtimeMetrics, setRealtimeMetrics] = useState(analytics.realtimeMetrics);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(analytics.stats);
      setRealtimeMetrics(analytics.getRealtimeMetrics());
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [analytics, refreshInterval]);
  
  return {
    stats,
    realtimeMetrics,
    ...analytics
  };
};

// Hook para configuração de analytics
export const useAnalyticsConfig = () => {
  const analytics = useUsageAnalytics();
  
  const toggleFeature = useCallback((feature: keyof AnalyticsConfig) => {
    const currentValue = analytics.config[feature];
    if (typeof currentValue === 'boolean') {
      if (currentValue) {
        analytics.disableFeature(feature);
      } else {
        analytics.enableFeature(feature);
      }
    }
  }, [analytics]);
  
  const resetToDefaults = useCallback(() => {
    analytics.updateConfig({
      enableTracking: true,
      enableHeatmaps: true,
      enableSessionRecording: false,
      enableRealTimeAnalytics: true,
      enableUserIdentification: true,
      enableConversionTracking: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableCustomEvents: true,
      enableInsights: true,
      samplingRate: 1.0,
      sessionTimeout: 30 * 60 * 1000,
      batchSize: 50,
      flushInterval: 5000,
      privacyMode: false,
      anonymizeIPs: true,
      respectDNT: true,
      cookieConsent: false,
      dataRetention: 90,
      logLevel: 'warn',
      debugMode: false
    });
  }, [analytics]);
  
  return {
    config: analytics.config,
    updateConfig: analytics.updateConfig,
    enableFeature: analytics.enableFeature,
    disableFeature: analytics.disableFeature,
    toggleFeature,
    resetToDefaults,
    setPrivacyMode: analytics.setPrivacyMode,
    setSamplingRate: analytics.setSamplingRate
  };
};

// Hook para debug de analytics
export const useAnalyticsDebug = () => {
  const analytics = useUsageAnalytics();
  
  const debugInfo = useMemo(() => {
    return {
      isInitialized: analytics.isInitialized,
      isTracking: analytics.isTracking,
      currentSession: analytics.currentSession,
      totalActions: analytics.actions.length,
      totalSessions: analytics.sessions.length,
      totalEvents: analytics.events.length,
      totalInsights: analytics.insights.length,
      healthStatus: analytics.healthStatus,
      config: analytics.config,
      stats: analytics.stats,
      realtimeMetrics: analytics.realtimeMetrics
    };
  }, [analytics]);
  
  const logDebugInfo = useCallback(() => {
    console.group('🔍 Analytics Debug Info');
    console.groupEnd();
  }, [debugInfo]);
  
  return {
    debugInfo,
    logDebugInfo,
    ...analytics
  };
};

// Importações para facilitar o uso
import { useState } from 'react';
export { useAnalyticsStore, analyticsManager } from '../utils/usageAnalytics';
export type {
  UserAction,
  UserSession,
  PageMetrics,
  FeatureUsage,
  UserBehavior,
  AnalyticsEvent,
  ConversionFunnel,
  AnalyticsInsight,
  AnalyticsConfig,
  AnalyticsStats
} from '../utils/usageAnalytics';