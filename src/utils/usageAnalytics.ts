// Sistema avançado de métricas de uso e engagement
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface UserAction {
  id: string;
  type: 'click' | 'view' | 'scroll' | 'input' | 'navigation' | 'feature_use' | 'error' | 'performance';
  element?: string;
  page: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId: string;
  coordinates?: { x: number; y: number };
  viewport?: { width: number; height: number };
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  actions: number;
  bounceRate: number;
  engagementScore: number;
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    screenSize: { width: number; height: number };
  };
  location?: {
    country?: string;
    city?: string;
    timezone: string;
  };
  referrer?: string;
  exitPage?: string;
}

export interface PageMetrics {
  path: string;
  title: string;
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
  conversionRate: number;
  loadTime: number;
  interactionRate: number;
  scrollDepth: number;
  heatmapData: Array<{ x: number; y: number; intensity: number }>;
}

export interface FeatureUsage {
  featureId: string;
  name: string;
  category: string;
  usageCount: number;
  uniqueUsers: number;
  averageUsageTime: number;
  successRate: number;
  errorRate: number;
  adoptionRate: number;
  retentionRate: number;
  satisfactionScore: number;
}

export interface UserBehavior {
  userId: string;
  totalSessions: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  pagesPerSession: number;
  actionsPerSession: number;
  preferredFeatures: string[];
  usagePatterns: {
    timeOfDay: Record<string, number>;
    dayOfWeek: Record<string, number>;
    devicePreference: Record<string, number>;
  };
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
  churnRisk: number;
  lifetimeValue: number;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    name: string;
    condition: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
    averageTime: number;
  }>;
  totalUsers: number;
  overallConversionRate: number;
  averageCompletionTime: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: number;
  data: Record<string, any>;
  recommendations: string[];
  actionable: boolean;
}

export interface AnalyticsConfig {
  enableTracking: boolean;
  enableHeatmaps: boolean;
  enableSessionRecording: boolean;
  enableRealTimeAnalytics: boolean;
  enableUserIdentification: boolean;
  enableConversionTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableCustomEvents: boolean;
  enableInsights: boolean;
  samplingRate: number;
  sessionTimeout: number;
  batchSize: number;
  flushInterval: number;
  privacyMode: boolean;
  anonymizeIPs: boolean;
  respectDNT: boolean;
  cookieConsent: boolean;
  dataRetention: number;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  debugMode: boolean;
}

export interface AnalyticsStats {
  totalActions: number;
  totalSessions: number;
  totalUsers: number;
  totalPageViews: number;
  totalEvents: number;
  averageSessionDuration: number;
  averagePageLoadTime: number;
  bounceRate: number;
  conversionRate: number;
  engagementRate: number;
  retentionRate: number;
  churnRate: number;
  dataProcessed: number;
  insightsGenerated: number;
  errorsTracked: number;
  performanceScore: number;
}

// Store
interface AnalyticsStore {
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
  
  // Ações - Tracking
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
  
  // Ações - Sessões
  startSession: (userId?: string) => UserSession;
  endSession: () => void;
  updateSession: (updates: Partial<UserSession>) => void;
  getActiveSession: () => UserSession | null;
  
  // Ações - Análise
  analyzeUserBehavior: (userId: string) => UserBehavior | null;
  generateInsights: () => AnalyticsInsight[];
  calculateEngagementScore: (userId?: string) => number;
  calculateChurnRisk: (userId: string) => number;
  getConversionFunnel: (funnelId: string) => ConversionFunnel | null;
  
  // Ações - Métricas
  getPageMetrics: (path: string) => PageMetrics | null;
  getFeatureMetrics: (featureId: string) => FeatureUsage | null;
  getRealtimeMetrics: () => Record<string, number>;
  getTopPages: (limit?: number) => PageMetrics[];
  getTopFeatures: (limit?: number) => FeatureUsage[];
  
  // Ações - Configuração
  updateConfig: (updates: Partial<AnalyticsConfig>) => void;
  enableFeature: (feature: keyof AnalyticsConfig) => void;
  disableFeature: (feature: keyof AnalyticsConfig) => void;
  setPrivacyMode: (enabled: boolean) => void;
  setSamplingRate: (rate: number) => void;
  
  // Ações - Dados
  exportData: (format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
  importData: (data: any) => Promise<void>;
  clearData: (type?: 'actions' | 'sessions' | 'events' | 'all') => void;
  
  // Ações - Utilitários
  resetStats: () => void;
  getHealthStatus: () => Record<string, any>;
  
  // Formatadores
  formatters: {
    duration: (ms: number) => string;
    percentage: (value: number) => string;
    number: (value: number) => string;
    fileSize: (bytes: number) => string;
    date: (timestamp: number) => string;
  };
  
  // Ícones
  icons: {
    getActionIcon: (type: UserAction['type']) => string;
    getInsightIcon: (type: AnalyticsInsight['type']) => string;
    getEngagementIcon: (level: UserBehavior['engagementLevel']) => string;
  };
  
  // Cores
  colors: {
    getEngagementColor: (level: UserBehavior['engagementLevel']) => string;
    getInsightColor: (type: AnalyticsInsight['type']) => string;
    getPerformanceColor: (score: number) => string;
  };
}

// Configuração padrão
const defaultConfig: AnalyticsConfig = {
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
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  batchSize: 50,
  flushInterval: 5000, // 5 segundos
  privacyMode: false,
  anonymizeIPs: true,
  respectDNT: true,
  cookieConsent: false,
  dataRetention: 90, // 90 dias
  logLevel: 'warn',
  debugMode: false
};

// Store
export const useAnalyticsStore = create<AnalyticsStore>()(subscribeWithSelector((set, get) => ({
  // Estado inicial
  isInitialized: false,
  isTracking: false,
  currentSession: null,
  actions: [],
  sessions: [],
  pageMetrics: [],
  featureUsage: [],
  userBehaviors: [],
  events: [],
  funnels: [],
  insights: [],
  config: defaultConfig,
  stats: {
    totalActions: 0,
    totalSessions: 0,
    totalUsers: 0,
    totalPageViews: 0,
    totalEvents: 0,
    averageSessionDuration: 0,
    averagePageLoadTime: 0,
    bounceRate: 0,
    conversionRate: 0,
    engagementRate: 0,
    retentionRate: 0,
    churnRate: 0,
    dataProcessed: 0,
    insightsGenerated: 0,
    errorsTracked: 0,
    performanceScore: 0
  },
  
  // Ações - Tracking
  initialize: async () => {
    const state = get();
    if (state.isInitialized) return;
    
    // Detectar dispositivo e localização
    const deviceInfo = {
      type: window.innerWidth < 768 ? 'mobile' as const : 
            window.innerWidth < 1024 ? 'tablet' as const : 'desktop' as const,
      os: navigator.platform,
      browser: navigator.userAgent.split(' ').pop() || 'unknown',
      screenSize: { width: window.innerWidth, height: window.innerHeight }
    };
    
    // Iniciar sessão
    const session = get().startSession();
    session.device = deviceInfo;
    
    set({ isInitialized: true, isTracking: state.config.enableTracking });
    
    // Configurar listeners
    if (state.config.enableTracking) {
      get().startTracking();
    }
  },
  
  startTracking: () => {
    const state = get();
    if (state.isTracking) return;
    
    set({ isTracking: true });
    
    // Event listeners
    const trackClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      get().trackAction({
        type: 'click',
        element: target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '') + 
                (target.className ? `.${target.className.split(' ').join('.')}` : ''),
        page: window.location.pathname,
        coordinates: { x: e.clientX, y: e.clientY },
        viewport: { width: window.innerWidth, height: window.innerHeight }
      });
    };
    
    const trackScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      get().trackAction({
        type: 'scroll',
        page: window.location.pathname,
        metadata: { scrollDepth, scrollY: window.scrollY }
      });
    };
    
    const trackNavigation = () => {
      get().trackPageView(window.location.pathname, document.title);
    };
    
    // Adicionar listeners
    document.addEventListener('click', trackClick);
    window.addEventListener('scroll', trackScroll, { passive: true });
    window.addEventListener('popstate', trackNavigation);
    
    // Salvar referências para cleanup
    (window as any).__analyticsListeners = {
      click: trackClick,
      scroll: trackScroll,
      navigation: trackNavigation
    };
  },
  
  stopTracking: () => {
    set({ isTracking: false });
    
    // Remover listeners
    const listeners = (window as any).__analyticsListeners;
    if (listeners) {
      document.removeEventListener('click', listeners.click);
      window.removeEventListener('scroll', listeners.scroll);
      window.removeEventListener('popstate', listeners.navigation);
      delete (window as any).__analyticsListeners;
    }
  },
  
  trackAction: (actionData) => {
    const state = get();
    if (!state.isTracking || !state.currentSession) return;
    
    const action: UserAction = {
      ...actionData,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: state.currentSession.id,
      userId: state.currentSession.userId
    };
    
    set(state => ({
      actions: [...state.actions, action],
      stats: {
        ...state.stats,
        totalActions: state.stats.totalActions + 1
      }
    }));
    
    // Atualizar sessão
    get().updateSession({ actions: state.currentSession.actions + 1 });
  },
  
  trackPageView: (page, title) => {
    const state = get();
    if (!state.isTracking) return;
    
    get().trackAction({
      type: 'view',
      page,
      metadata: { title, referrer: document.referrer }
    });
    
    // Atualizar métricas da página
    const existingMetrics = state.pageMetrics.find(m => m.path === page);
    if (existingMetrics) {
      set(state => ({
        pageMetrics: state.pageMetrics.map(m => 
          m.path === page 
            ? { ...m, views: m.views + 1 }
            : m
        )
      }));
    } else {
      const newMetrics: PageMetrics = {
        path: page,
        title: title || page,
        views: 1,
        uniqueViews: 1,
        averageTimeOnPage: 0,
        bounceRate: 0,
        exitRate: 0,
        conversionRate: 0,
        loadTime: performance.now(),
        interactionRate: 0,
        scrollDepth: 0,
        heatmapData: []
      };
      
      set(state => ({
        pageMetrics: [...state.pageMetrics, newMetrics],
        stats: {
          ...state.stats,
          totalPageViews: state.stats.totalPageViews + 1
        }
      }));
    }
    
    // Atualizar sessão
    if (state.currentSession) {
      get().updateSession({ pageViews: state.currentSession.pageViews + 1 });
    }
  },
  
  trackEvent: (eventData) => {
    const state = get();
    if (!state.isTracking || !state.currentSession) return;
    
    const event: AnalyticsEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: state.currentSession.id,
      userId: state.currentSession.userId
    };
    
    set(state => ({
      events: [...state.events, event],
      stats: {
        ...state.stats,
        totalEvents: state.stats.totalEvents + 1
      }
    }));
  },
  
  trackFeatureUsage: (featureId, metadata) => {
    const state = get();
    if (!state.isTracking) return;
    
    get().trackEvent({
      name: 'feature_usage',
      category: 'engagement',
      action: 'use_feature',
      label: featureId,
      properties: { featureId, ...metadata }
    });
    
    // Atualizar métricas da feature
    const existingUsage = state.featureUsage.find(f => f.featureId === featureId);
    if (existingUsage) {
      set(state => ({
        featureUsage: state.featureUsage.map(f => 
          f.featureId === featureId 
            ? { ...f, usageCount: f.usageCount + 1 }
            : f
        )
      }));
    } else {
      const newUsage: FeatureUsage = {
        featureId,
        name: featureId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        category: 'general',
        usageCount: 1,
        uniqueUsers: 1,
        averageUsageTime: 0,
        successRate: 100,
        errorRate: 0,
        adoptionRate: 0,
        retentionRate: 0,
        satisfactionScore: 0
      };
      
      set(state => ({
        featureUsage: [...state.featureUsage, newUsage]
      }));
    }
  },
  
  trackConversion: (funnelId, stepId, value) => {
    get().trackEvent({
      name: 'conversion',
      category: 'funnel',
      action: 'complete_step',
      label: `${funnelId}:${stepId}`,
      value,
      properties: { funnelId, stepId }
    });
  },
  
  trackError: (error, context) => {
    const state = get();
    if (!state.config.enableErrorTracking) return;
    
    get().trackEvent({
      name: 'error',
      category: 'system',
      action: 'error_occurred',
      label: error.name,
      properties: {
        message: error.message,
        stack: error.stack,
        ...context
      }
    });
    
    set(state => ({
      stats: {
        ...state.stats,
        errorsTracked: state.stats.errorsTracked + 1
      }
    }));
  },
  
  trackPerformance: (metric, value, context) => {
    const state = get();
    if (!state.config.enablePerformanceTracking) return;
    
    get().trackEvent({
      name: 'performance',
      category: 'system',
      action: 'performance_metric',
      label: metric,
      value,
      properties: { metric, ...context }
    });
  },
  
  // Ações - Sessões
  startSession: (userId) => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: UserSession = {
      id: sessionId,
      userId,
      startTime: Date.now(),
      pageViews: 0,
      actions: 0,
      bounceRate: 0,
      engagementScore: 0,
      device: {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        screenSize: { width: 0, height: 0 }
      },
      location: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      referrer: document.referrer
    };
    
    set(state => ({
      currentSession: session,
      sessions: [...state.sessions, session],
      stats: {
        ...state.stats,
        totalSessions: state.stats.totalSessions + 1
      }
    }));
    
    return session;
  },
  
  endSession: () => {
    const state = get();
    if (!state.currentSession) return;
    
    const endTime = Date.now();
    const duration = endTime - state.currentSession.startTime;
    
    const updatedSession: UserSession = {
      ...state.currentSession,
      endTime,
      duration,
      exitPage: window.location.pathname
    };
    
    set(state => ({
      currentSession: null,
      sessions: state.sessions.map(s => 
        s.id === updatedSession.id ? updatedSession : s
      )
    }));
  },
  
  updateSession: (updates) => {
    const state = get();
    if (!state.currentSession) return;
    
    const updatedSession = { ...state.currentSession, ...updates };
    
    set(state => ({
      currentSession: updatedSession,
      sessions: state.sessions.map(s => 
        s.id === updatedSession.id ? updatedSession : s
      )
    }));
  },
  
  getActiveSession: () => {
    return get().currentSession;
  },
  
  // Ações - Análise
  analyzeUserBehavior: (userId) => {
    const state = get();
    const userSessions = state.sessions.filter(s => s.userId === userId);
    const userActions = state.actions.filter(a => a.userId === userId);
    
    if (userSessions.length === 0) return null;
    
    const totalTimeSpent = userSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionDuration = totalTimeSpent / userSessions.length;
    const pagesPerSession = userSessions.reduce((sum, s) => sum + s.pageViews, 0) / userSessions.length;
    const actionsPerSession = userSessions.reduce((sum, s) => sum + s.actions, 0) / userSessions.length;
    
    // Calcular padrões de uso
    const timeOfDay: Record<string, number> = {};
    const dayOfWeek: Record<string, number> = {};
    const devicePreference: Record<string, number> = {};
    
    userSessions.forEach(session => {
      const date = new Date(session.startTime);
      const hour = date.getHours();
      const day = date.getDay();
      
      const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day];
      
      timeOfDay[timeSlot] = (timeOfDay[timeSlot] || 0) + 1;
      dayOfWeek[dayName] = (dayOfWeek[dayName] || 0) + 1;
      devicePreference[session.device.type] = (devicePreference[session.device.type] || 0) + 1;
    });
    
    // Determinar nível de engajamento
    const engagementScore = get().calculateEngagementScore(userId);
    const engagementLevel: UserBehavior['engagementLevel'] = 
      engagementScore >= 80 ? 'very_high' :
      engagementScore >= 60 ? 'high' :
      engagementScore >= 40 ? 'medium' : 'low';
    
    const behavior: UserBehavior = {
      userId,
      totalSessions: userSessions.length,
      totalTimeSpent,
      averageSessionDuration,
      pagesPerSession,
      actionsPerSession,
      preferredFeatures: [], // Seria calculado baseado nas features mais usadas
      usagePatterns: {
        timeOfDay,
        dayOfWeek,
        devicePreference
      },
      engagementLevel,
      churnRisk: get().calculateChurnRisk(userId),
      lifetimeValue: 0 // Seria calculado baseado em conversões
    };
    
    // Atualizar ou adicionar comportamento
    set(state => ({
      userBehaviors: [
        ...state.userBehaviors.filter(b => b.userId !== userId),
        behavior
      ]
    }));
    
    return behavior;
  },
  
  generateInsights: () => {
    const state = get();
    const insights: AnalyticsInsight[] = [];
    
    // Insight de bounce rate alto
    const avgBounceRate = state.stats.bounceRate;
    if (avgBounceRate > 70) {
      insights.push({
        id: `insight-bounce-${Date.now()}`,
        type: 'warning',
        title: 'Taxa de Rejeição Alta',
        description: `A taxa de rejeição está em ${avgBounceRate.toFixed(1)}%, acima do ideal.`,
        impact: 'high',
        confidence: 0.85,
        timestamp: Date.now(),
        data: { bounceRate: avgBounceRate },
        recommendations: [
          'Melhorar o tempo de carregamento das páginas',
          'Otimizar o conteúdo above-the-fold',
          'Revisar a experiência do usuário na página inicial'
        ],
        actionable: true
      });
    }
    
    // Insight de engajamento baixo
    const avgEngagement = state.stats.engagementRate;
    if (avgEngagement < 30) {
      insights.push({
        id: `insight-engagement-${Date.now()}`,
        type: 'opportunity',
        title: 'Oportunidade de Melhoria no Engajamento',
        description: `A taxa de engajamento está em ${avgEngagement.toFixed(1)}%, há espaço para melhoria.`,
        impact: 'medium',
        confidence: 0.75,
        timestamp: Date.now(),
        data: { engagementRate: avgEngagement },
        recommendations: [
          'Adicionar elementos interativos nas páginas',
          'Implementar gamificação',
          'Personalizar conteúdo baseado no comportamento'
        ],
        actionable: true
      });
    }
    
    // Insight de performance
    const avgLoadTime = state.stats.averagePageLoadTime;
    if (avgLoadTime > 3000) {
      insights.push({
        id: `insight-performance-${Date.now()}`,
        type: 'warning',
        title: 'Tempo de Carregamento Lento',
        description: `O tempo médio de carregamento é ${(avgLoadTime / 1000).toFixed(1)}s, acima do recomendado.`,
        impact: 'high',
        confidence: 0.9,
        timestamp: Date.now(),
        data: { loadTime: avgLoadTime },
        recommendations: [
          'Otimizar imagens e assets',
          'Implementar lazy loading',
          'Usar CDN para recursos estáticos'
        ],
        actionable: true
      });
    }
    
    set(state => ({
      insights: [...state.insights, ...insights],
      stats: {
        ...state.stats,
        insightsGenerated: state.stats.insightsGenerated + insights.length
      }
    }));
    
    return insights;
  },
  
  calculateEngagementScore: (userId) => {
    const state = get();
    const userSessions = userId ? 
      state.sessions.filter(s => s.userId === userId) : 
      state.sessions;
    
    if (userSessions.length === 0) return 0;
    
    const avgSessionDuration = userSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / userSessions.length;
    const avgPagesPerSession = userSessions.reduce((sum, s) => sum + s.pageViews, 0) / userSessions.length;
    const avgActionsPerSession = userSessions.reduce((sum, s) => sum + s.actions, 0) / userSessions.length;
    
    // Normalizar métricas (0-100)
    const durationScore = Math.min((avgSessionDuration / (5 * 60 * 1000)) * 100, 100); // 5 min = 100%
    const pageScore = Math.min((avgPagesPerSession / 5) * 100, 100); // 5 páginas = 100%
    const actionScore = Math.min((avgActionsPerSession / 10) * 100, 100); // 10 ações = 100%
    
    // Peso das métricas
    const score = (durationScore * 0.4) + (pageScore * 0.3) + (actionScore * 0.3);
    
    return Math.round(score);
  },
  
  calculateChurnRisk: (userId) => {
    const state = get();
    const userSessions = state.sessions.filter(s => s.userId === userId);
    
    if (userSessions.length === 0) return 100;
    
    const lastSession = userSessions[userSessions.length - 1];
    const daysSinceLastSession = (Date.now() - lastSession.startTime) / (24 * 60 * 60 * 1000);
    
    // Calcular risco baseado em inatividade
    const inactivityRisk = Math.min((daysSinceLastSession / 30) * 100, 100); // 30 dias = 100% risco
    
    // Calcular risco baseado em engajamento
    const engagementScore = get().calculateEngagementScore(userId);
    const engagementRisk = 100 - engagementScore;
    
    // Combinar riscos
    const churnRisk = (inactivityRisk * 0.6) + (engagementRisk * 0.4);
    
    return Math.round(churnRisk);
  },
  
  getConversionFunnel: (funnelId) => {
    const state = get();
    return state.funnels.find(f => f.id === funnelId) || null;
  },
  
  // Ações - Métricas
  getPageMetrics: (path) => {
    const state = get();
    return state.pageMetrics.find(m => m.path === path) || null;
  },
  
  getFeatureMetrics: (featureId) => {
    const state = get();
    return state.featureUsage.find(f => f.featureId === featureId) || null;
  },
  
  getRealtimeMetrics: () => {
    const state = get();
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    
    const recentActions = state.actions.filter(a => a.timestamp > lastHour);
    const recentSessions = state.sessions.filter(s => s.startTime > lastHour);
    const recentEvents = state.events.filter(e => e.timestamp > lastHour);
    
    return {
      activeUsers: new Set(recentActions.map(a => a.userId).filter(Boolean)).size,
      activeSessions: recentSessions.length,
      actionsPerMinute: recentActions.length / 60,
      eventsPerMinute: recentEvents.length / 60,
      currentPageViews: recentActions.filter(a => a.type === 'view').length,
      averageSessionDuration: recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length || 0
    };
  },
  
  getTopPages: (limit = 10) => {
    const state = get();
    return state.pageMetrics
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },
  
  getTopFeatures: (limit = 10) => {
    const state = get();
    return state.featureUsage
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  },
  
  // Ações - Configuração
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  enableFeature: (feature) => {
    set(state => ({
      config: { ...state.config, [feature]: true }
    }));
  },
  
  disableFeature: (feature) => {
    set(state => ({
      config: { ...state.config, [feature]: false }
    }));
  },
  
  setPrivacyMode: (enabled) => {
    set(state => ({
      config: { ...state.config, privacyMode: enabled }
    }));
  },
  
  setSamplingRate: (rate) => {
    set(state => ({
      config: { ...state.config, samplingRate: Math.max(0, Math.min(1, rate)) }
    }));
  },
  
  // Ações - Dados
  exportData: async (format) => {
    const state = get();
    const data = {
      actions: state.actions,
      sessions: state.sessions,
      events: state.events,
      pageMetrics: state.pageMetrics,
      featureUsage: state.featureUsage,
      userBehaviors: state.userBehaviors,
      insights: state.insights,
      stats: state.stats,
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      return blob;
    }
    
    // Para CSV e XLSX, seria necessário implementar conversão
    throw new Error(`Formato ${format} não implementado ainda`);
  },
  
  importData: async (data) => {
    // Validar e importar dados
    if (data.actions) set(state => ({ actions: [...state.actions, ...data.actions] }));
    if (data.sessions) set(state => ({ sessions: [...state.sessions, ...data.sessions] }));
    if (data.events) set(state => ({ events: [...state.events, ...data.events] }));
    // ... outros dados
  },
  
  clearData: (type = 'all') => {
    if (type === 'all' || type === 'actions') {
      set(state => ({ actions: [] }));
    }
    if (type === 'all' || type === 'sessions') {
      set(state => ({ sessions: [], currentSession: null }));
    }
    if (type === 'all' || type === 'events') {
      set(state => ({ events: [] }));
    }
    if (type === 'all') {
      set(state => ({
        pageMetrics: [],
        featureUsage: [],
        userBehaviors: [],
        insights: [],
        stats: {
          totalActions: 0,
          totalSessions: 0,
          totalUsers: 0,
          totalPageViews: 0,
          totalEvents: 0,
          averageSessionDuration: 0,
          averagePageLoadTime: 0,
          bounceRate: 0,
          conversionRate: 0,
          engagementRate: 0,
          retentionRate: 0,
          churnRate: 0,
          dataProcessed: 0,
          insightsGenerated: 0,
          errorsTracked: 0,
          performanceScore: 0
        }
      }));
    }
  },
  
  // Ações - Utilitários
  resetStats: () => {
    set(state => ({
      stats: {
        ...state.stats,
        totalActions: state.actions.length,
        totalSessions: state.sessions.length,
        totalUsers: new Set(state.sessions.map(s => s.userId).filter(Boolean)).size,
        totalPageViews: state.actions.filter(a => a.type === 'view').length,
        totalEvents: state.events.length,
        averageSessionDuration: state.sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / state.sessions.length || 0,
        dataProcessed: state.actions.length + state.sessions.length + state.events.length
      }
    }));
  },
  
  getHealthStatus: () => {
    const state = get();
    return {
      isInitialized: state.isInitialized,
      isTracking: state.isTracking,
      hasActiveSession: !!state.currentSession,
      dataPoints: state.actions.length + state.sessions.length + state.events.length,
      lastActivity: state.actions.length > 0 ? state.actions[state.actions.length - 1].timestamp : null,
      memoryUsage: (JSON.stringify(state).length / 1024 / 1024).toFixed(2) + ' MB'
    };
  },
  
  // Formatadores
  formatters: {
    duration: (ms) => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
      return `${(ms / 3600000).toFixed(1)}h`;
    },
    
    percentage: (value) => `${value.toFixed(1)}%`,
    
    number: (value) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    },
    
    fileSize: (bytes) => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${bytes} B`;
    },
    
    date: (timestamp) => new Date(timestamp).toLocaleString()
  },
  
  // Ícones
  icons: {
    getActionIcon: (type) => {
      const icons = {
        click: '👆',
        view: '👁️',
        scroll: '📜',
        input: '⌨️',
        navigation: '🧭',
        feature_use: '⚡',
        error: '❌',
        performance: '📊'
      };
      return icons[type] || '📝';
    },
    
    getInsightIcon: (type) => {
      const icons = {
        trend: '📈',
        anomaly: '⚠️',
        opportunity: '💡',
        warning: '🚨',
        success: '✅'
      };
      return icons[type] || 'ℹ️';
    },
    
    getEngagementIcon: (level) => {
      const icons = {
        low: '🔴',
        medium: '🟡',
        high: '🟢',
        very_high: '🟢'
      };
      return icons[level] || '⚪';
    }
  },
  
  // Cores
  colors: {
    getEngagementColor: (level) => {
      const colors = {
        low: 'text-red-600',
        medium: 'text-yellow-600',
        high: 'text-green-600',
        very_high: 'text-green-700'
      };
      return colors[level] || 'text-gray-600';
    },
    
    getInsightColor: (type) => {
      const colors = {
        trend: 'text-blue-600',
        anomaly: 'text-orange-600',
        opportunity: 'text-purple-600',
        warning: 'text-red-600',
        success: 'text-green-600'
      };
      return colors[type] || 'text-gray-600';
    },
    
    getPerformanceColor: (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      if (score >= 40) return 'text-orange-600';
      return 'text-red-600';
    }
  }
})));

// Manager Class
export class AnalyticsManager {
  private store = useAnalyticsStore;
  private initialized = false;
  private intervals: NodeJS.Timeout[] = [];
  
  async initialize() {
    if (this.initialized) return;
    
    await this.store.getState().initialize();
    this.setupEventListeners();
    this.startPeriodicTasks();
    
    this.initialized = true;
  }
  
  private setupEventListeners() {
    // Listener para mudanças de página (SPA)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      useAnalyticsStore.getState().trackPageView(window.location.pathname, document.title);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      useAnalyticsStore.getState().trackPageView(window.location.pathname, document.title);
    };
    
    // Listener para erros globais
    window.addEventListener('error', (event) => {
      useAnalyticsStore.getState().trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Listener para promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      useAnalyticsStore.getState().trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
    
    // Listener para visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        useAnalyticsStore.getState().endSession();
      } else {
        useAnalyticsStore.getState().startSession();
      }
    });
    
    // Listener para beforeunload
    window.addEventListener('beforeunload', () => {
      useAnalyticsStore.getState().endSession();
    });
  }
  
  private startPeriodicTasks() {
    const state = this.store.getState();
    
    // Gerar insights periodicamente
    const insightsInterval = setInterval(() => {
      if (state.config.enableInsights) {
        state.generateInsights();
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
    
    // Atualizar estatísticas
    const statsInterval = setInterval(() => {
      state.resetStats();
    }, 30 * 1000); // A cada 30 segundos
    
    // Limpar dados antigos
    const cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - (state.config.dataRetention * 24 * 60 * 60 * 1000);
      
      // Remover ações antigas
      const actions = state.actions.filter(a => a.timestamp > cutoff);
      const sessions = state.sessions.filter(s => s.startTime > cutoff);
      const events = state.events.filter(e => e.timestamp > cutoff);
      
      this.store.setState({ actions, sessions, events });
    }, 60 * 60 * 1000); // A cada hora
    
    this.intervals.push(insightsInterval, statsInterval, cleanupInterval);
  }
  
  destroy() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.store.getState().stopTracking();
    this.initialized = false;
  }
}

// Instância global
export const analyticsManager = new AnalyticsManager();

// Utilitários
export const formatters = {
  duration: (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  },
  
  percentage: (value: number) => `${value.toFixed(1)}%`,
  
  number: (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  },
  
  fileSize: (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  },
  
  date: (timestamp: number) => new Date(timestamp).toLocaleString()
};

export const icons = {
  getActionIcon: (type: UserAction['type']) => {
    const iconMap = {
      click: '👆',
      view: '👁️',
      scroll: '📜',
      input: '⌨️',
      navigation: '🧭',
      feature_use: '⚡',
      error: '❌',
      performance: '📊'
    };
    return iconMap[type] || '📝';
  },
  
  getInsightIcon: (type: AnalyticsInsight['type']) => {
    const iconMap = {
      trend: '📈',
      anomaly: '⚠️',
      opportunity: '💡',
      warning: '🚨',
      success: '✅'
    };
    return iconMap[type] || 'ℹ️';
  },
  
  getEngagementIcon: (level: UserBehavior['engagementLevel']) => {
    const iconMap = {
      low: '🔴',
      medium: '🟡',
      high: '🟢',
      very_high: '🟢'
    };
    return iconMap[level] || '⚪';
  }
};

export const colors = {
  getEngagementColor: (level: UserBehavior['engagementLevel']) => {
    const colorMap = {
      low: 'text-red-600',
      medium: 'text-yellow-600',
      high: 'text-green-600',
      very_high: 'text-green-700'
    };
    return colorMap[level] || 'text-gray-600';
  },
  
  getInsightColor: (type: AnalyticsInsight['type']) => {
    const colorMap = {
      trend: 'text-blue-600',
      anomaly: 'text-orange-600',
      opportunity: 'text-purple-600',
      warning: 'text-red-600',
      success: 'text-green-600'
    };
    return colorMap[type] || 'text-gray-600';
  },
  
  getPerformanceColor: (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
};

// Hook personalizado
export const useAnalytics = () => {
  const store = useAnalyticsStore();
  
  return {
    ...store,
    formatters,
    icons,
    colors
  };
};