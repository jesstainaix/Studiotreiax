import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface AnalyticsEvent {
  id: string;
  type: 'user_action' | 'performance' | 'error' | 'system' | 'custom';
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
  duration?: number;
  metadata?: {
    userAgent?: string;
    url?: string;
    referrer?: string;
    viewport?: { width: number; height: number };
    device?: string;
    browser?: string;
    os?: string;
  };
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'load' | 'runtime' | 'memory' | 'network' | 'custom';
  timestamp: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'business' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  data?: Record<string, any>;
  actions?: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  bounced: boolean;
  converted: boolean;
  source?: string;
  medium?: string;
  campaign?: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  sampleRate: number;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableUserTracking: boolean;
  enableRealTimeAlerts: boolean;
  dataRetentionDays: number;
  batchSize: number;
  flushInterval: number;
  endpoints: {
    events: string;
    metrics: string;
    alerts: string;
  };
  thresholds: {
    pageLoadTime: number;
    memoryUsage: number;
    errorRate: number;
    responseTime: number;
  };
}

export interface AnalyticsStats {
  totalEvents: number;
  totalSessions: number;
  totalUsers: number;
  totalAlerts: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  errorRate: number;
  performanceScore: number;
  topEvents: Array<{ name: string; count: number }>;
  topPages: Array<{ path: string; views: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  trafficSources: Record<string, number>;
}

export interface AnalyticsMetrics {
  realTimeUsers: number;
  eventsPerSecond: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorCount: number;
  alertCount: number;
  dataProcessed: number;
  storageUsed: number;
}

export interface AnalyticsDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: number;
  source: string;
}

// Store
interface AnalyticsStore {
  // State
  events: AnalyticsEvent[];
  metrics: PerformanceMetric[];
  alerts: Alert[];
  sessions: UserSession[];
  config: AnalyticsConfig;
  stats: AnalyticsStats;
  realTimeMetrics: AnalyticsMetrics;
  debugLogs: AnalyticsDebugLog[];
  isTracking: boolean;
  isConnected: boolean;
  lastSync: number;
  currentSession?: UserSession;
  
  // Actions
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  createAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string, resolvedBy?: string) => void;
  startSession: (userId?: string) => void;
  endSession: () => void;
  updateConfig: (config: Partial<AnalyticsConfig>) => void;
  
  // Analytics
  getEventsByType: (type: string) => AnalyticsEvent[];
  getMetricsByCategory: (category: string) => PerformanceMetric[];
  getAlertsBySeverity: (severity: string) => Alert[];
  getSessionsByUser: (userId: string) => UserSession[];
  calculateStats: () => void;
  updateRealTimeMetrics: () => void;
  
  // Utilities
  exportData: (format: 'json' | 'csv') => string;
  importData: (data: string, format: 'json' | 'csv') => void;
  clearData: (type?: 'events' | 'metrics' | 'alerts' | 'sessions' | 'all') => void;
  syncWithServer: () => Promise<void>;
  
  // Quick Actions
  trackPageView: (path: string, title?: string) => void;
  trackUserAction: (action: string, category: string, label?: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (name: string, value: number, unit: string) => void;
  
  // Advanced Features
  createCustomDashboard: (name: string, widgets: any[]) => void;
  scheduleReport: (config: any) => void;
  setupFunnel: (steps: string[]) => void;
  createSegment: (name: string, criteria: any) => void;
  
  // System
  initialize: () => void;
  destroy: () => void;
  getSystemInfo: () => Record<string, any>;
  
  // Debug
  addDebugLog: (level: AnalyticsDebugLog['level'], message: string, data?: any, source?: string) => void;
  clearDebugLogs: () => void;
  exportDebugLogs: () => string;
}

const defaultConfig: AnalyticsConfig = {
  enabled: true,
  sampleRate: 1.0,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  enableUserTracking: true,
  enableRealTimeAlerts: true,
  dataRetentionDays: 30,
  batchSize: 100,
  flushInterval: 5000,
  endpoints: {
    events: '/api/analytics/events',
    metrics: '/api/analytics/metrics',
    alerts: '/api/analytics/alerts',
  },
  thresholds: {
    pageLoadTime: 3000,
    memoryUsage: 100,
    errorRate: 0.05,
    responseTime: 1000,
  },
};

const defaultStats: AnalyticsStats = {
  totalEvents: 0,
  totalSessions: 0,
  totalUsers: 0,
  totalAlerts: 0,
  averageSessionDuration: 0,
  bounceRate: 0,
  conversionRate: 0,
  errorRate: 0,
  performanceScore: 100,
  topEvents: [],
  topPages: [],
  deviceBreakdown: {},
  browserBreakdown: {},
  trafficSources: {},
};

const defaultMetrics: AnalyticsMetrics = {
  realTimeUsers: 0,
  eventsPerSecond: 0,
  averageResponseTime: 0,
  memoryUsage: 0,
  cpuUsage: 0,
  networkLatency: 0,
  errorCount: 0,
  alertCount: 0,
  dataProcessed: 0,
  storageUsed: 0,
};

export const useAnalyticsStore = create<AnalyticsStore>()(subscribeWithSelector((set, get) => ({
  // State
  events: [],
  metrics: [],
  alerts: [],
  sessions: [],
  config: defaultConfig,
  stats: defaultStats,
  realTimeMetrics: defaultMetrics,
  debugLogs: [],
  isTracking: false,
  isConnected: false,
  lastSync: 0,
  currentSession: undefined,
  
  // Actions
  trackEvent: (eventData) => {
    const state = get();
    if (!state.config.enabled) return;
    
    const event: AnalyticsEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: state.currentSession?.id || 'no_session',
    };
    
    set((state) => ({
      events: [...state.events, event],
    }));
    
    get().addDebugLog('info', `Event tracked: ${event.type}/${event.category}/${event.action}`, event);
  },
  
  trackMetric: (metricData) => {
    const state = get();
    if (!state.config.enabled || !state.config.enablePerformanceTracking) return;
    
    const metric: PerformanceMetric = {
      ...metricData,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      metrics: [...state.metrics, metric],
    }));
    
    // Check thresholds and create alerts
    if (metric.threshold) {
      const { warning, critical } = metric.threshold;
      if (metric.value >= critical) {
        get().createAlert({
          type: 'performance',
          severity: 'critical',
          title: `Critical Performance Alert: ${metric.name}`,
          message: `${metric.name} has exceeded critical threshold: ${metric.value}${metric.unit} >= ${critical}${metric.unit}`,
          source: 'performance_monitor',
          data: { metric },
        });
      } else if (metric.value >= warning) {
        get().createAlert({
          type: 'performance',
          severity: 'medium',
          title: `Performance Warning: ${metric.name}`,
          message: `${metric.name} has exceeded warning threshold: ${metric.value}${metric.unit} >= ${warning}${metric.unit}`,
          source: 'performance_monitor',
          data: { metric },
        });
      }
    }
    
    get().addDebugLog('info', `Metric tracked: ${metric.name} = ${metric.value}${metric.unit}`, metric);
  },
  
  createAlert: (alertData) => {
    const alert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
    };
    
    set((state) => ({
      alerts: [...state.alerts, alert],
    }));
    
    get().addDebugLog('warn', `Alert created: ${alert.title}`, alert);
  },
  
  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
  },
  
  resolveAlert: (alertId, resolvedBy) => {
    set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              resolved: true,
              resolvedAt: Date.now(),
              resolvedBy: resolvedBy || 'system',
            }
          : alert
      ),
    }));
  },
  
  startSession: (userId) => {
    const session: UserSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      bounced: false,
      converted: false,
      device: {
        type: 'desktop', // Detect from user agent
        os: navigator.platform,
        browser: navigator.userAgent.split(' ').pop() || 'unknown',
      },
    };
    
    set((state) => ({
      currentSession: session,
      sessions: [...state.sessions, session],
      isTracking: true,
    }));
    
    get().addDebugLog('info', `Session started: ${session.id}`, session);
  },
  
  endSession: () => {
    const state = get();
    if (!state.currentSession) return;
    
    const endTime = Date.now();
    const duration = endTime - state.currentSession.startTime;
    
    set((state) => ({
      currentSession: undefined,
      sessions: state.sessions.map(session =>
        session.id === state.currentSession?.id
          ? {
              ...session,
              endTime,
              duration,
              bounced: session.pageViews <= 1 && duration < 30000,
            }
          : session
      ),
      isTracking: false,
    }));
    
    get().addDebugLog('info', `Session ended: ${state.currentSession.id}`, { duration });
  },
  
  updateConfig: (configUpdate) => {
    set((state) => ({
      config: { ...state.config, ...configUpdate },
    }));
    
    get().addDebugLog('info', 'Configuration updated', configUpdate);
  },
  
  // Analytics
  getEventsByType: (type) => {
    return get().events.filter(event => event.type === type);
  },
  
  getMetricsByCategory: (category) => {
    return get().metrics.filter(metric => metric.category === category);
  },
  
  getAlertsBySeverity: (severity) => {
    return get().alerts.filter(alert => alert.severity === severity);
  },
  
  getSessionsByUser: (userId) => {
    return get().sessions.filter(session => session.userId === userId);
  },
  
  calculateStats: () => {
    const state = get();
    const { events, sessions, alerts } = state;
    
    const totalEvents = events.length;
    const totalSessions = sessions.length;
    const totalUsers = new Set(sessions.map(s => s.userId).filter(Boolean)).size;
    const totalAlerts = alerts.length;
    
    const completedSessions = sessions.filter(s => s.endTime);
    const averageSessionDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
      : 0;
    
    const bouncedSessions = sessions.filter(s => s.bounced).length;
    const bounceRate = totalSessions > 0 ? bouncedSessions / totalSessions : 0;
    
    const convertedSessions = sessions.filter(s => s.converted).length;
    const conversionRate = totalSessions > 0 ? convertedSessions / totalSessions : 0;
    
    const errorEvents = events.filter(e => e.type === 'error').length;
    const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;
    
    // Calculate performance score based on various metrics
    const performanceScore = Math.max(0, 100 - (errorRate * 100) - (bounceRate * 50));
    
    // Top events
    const eventCounts = events.reduce((acc, event) => {
      const key = `${event.category}/${event.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    const stats: AnalyticsStats = {
      totalEvents,
      totalSessions,
      totalUsers,
      totalAlerts,
      averageSessionDuration,
      bounceRate,
      conversionRate,
      errorRate,
      performanceScore,
      topEvents,
      topPages: [], // Calculate from page view events
      deviceBreakdown: {}, // Calculate from sessions
      browserBreakdown: {}, // Calculate from sessions
      trafficSources: {}, // Calculate from sessions
    };
    
    set({ stats });
  },
  
  updateRealTimeMetrics: () => {
    const state = get();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentEvents = state.events.filter(e => e.timestamp > oneMinuteAgo);
    const recentAlerts = state.alerts.filter(a => a.timestamp > oneMinuteAgo);
    
    const metrics: AnalyticsMetrics = {
      realTimeUsers: state.sessions.filter(s => !s.endTime || s.endTime > oneMinuteAgo).length,
      eventsPerSecond: recentEvents.length / 60,
      averageResponseTime: 0, // Calculate from performance metrics
      memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
      cpuUsage: 0, // Estimate from performance
      networkLatency: 0, // Calculate from network requests
      errorCount: recentEvents.filter(e => e.type === 'error').length,
      alertCount: recentAlerts.length,
      dataProcessed: recentEvents.length,
      storageUsed: JSON.stringify(state).length / 1024, // Approximate KB
    };
    
    set({ realTimeMetrics: metrics });
  },
  
  // Utilities
  exportData: (format) => {
    const state = get();
    const data = {
      events: state.events,
      metrics: state.metrics,
      alerts: state.alerts,
      sessions: state.sessions,
      stats: state.stats,
      exportedAt: Date.now(),
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV format
      return 'CSV export not implemented yet';
    }
  },
  
  importData: (data, format) => {
    try {
      if (format === 'json') {
        const parsed = JSON.parse(data);
        set({
          events: parsed.events || [],
          metrics: parsed.metrics || [],
          alerts: parsed.alerts || [],
          sessions: parsed.sessions || [],
        });
      }
      get().addDebugLog('info', 'Data imported successfully');
    } catch (error) {
      get().addDebugLog('error', 'Failed to import data', error);
    }
  },
  
  clearData: (type = 'all') => {
    set((state) => {
      const updates: Partial<AnalyticsStore> = {};
      
      if (type === 'all' || type === 'events') updates.events = [];
      if (type === 'all' || type === 'metrics') updates.metrics = [];
      if (type === 'all' || type === 'alerts') updates.alerts = [];
      if (type === 'all' || type === 'sessions') updates.sessions = [];
      
      return { ...state, ...updates };
    });
    
    get().addDebugLog('info', `Cleared data: ${type}`);
  },
  
  syncWithServer: async () => {
    const state = get();
    if (!state.config.enabled) return;
    
    try {
      // Sync events, metrics, alerts with server
      // Implementation would depend on your backend
      set({ isConnected: true, lastSync: Date.now() });
      get().addDebugLog('info', 'Synced with server successfully');
    } catch (error) {
      set({ isConnected: false });
      get().addDebugLog('error', 'Failed to sync with server', error);
    }
  },
  
  // Quick Actions
  trackPageView: (path, title) => {
    get().trackEvent({
      type: 'user_action',
      category: 'navigation',
      action: 'page_view',
      label: path,
      properties: { title, path },
    });
    
    // Update current session page views
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, pageViews: state.currentSession.pageViews + 1 }
        : state.currentSession,
    }));
  },
  
  trackUserAction: (action, category, label) => {
    get().trackEvent({
      type: 'user_action',
      category,
      action,
      label,
    });
  },
  
  trackError: (error, context) => {
    get().trackEvent({
      type: 'error',
      category: 'javascript',
      action: 'error',
      label: error.message,
      properties: {
        stack: error.stack,
        name: error.name,
        ...context,
      },
    });
    
    // Create alert for critical errors
    get().createAlert({
      type: 'error',
      severity: 'high',
      title: `JavaScript Error: ${error.name}`,
      message: error.message,
      source: 'error_tracker',
      data: { error: error.toString(), stack: error.stack, context },
    });
  },
  
  trackPerformance: (name, value, unit) => {
    get().trackMetric({
      name,
      value,
      unit,
      category: 'runtime',
    });
  },
  
  // Advanced Features
  createCustomDashboard: (name, widgets) => {
    get().addDebugLog('info', `Custom dashboard created: ${name}`, { widgets });
  },
  
  scheduleReport: (config) => {
    get().addDebugLog('info', 'Report scheduled', config);
  },
  
  setupFunnel: (steps) => {
    get().addDebugLog('info', 'Funnel setup', { steps });
  },
  
  createSegment: (name, criteria) => {
    get().addDebugLog('info', `Segment created: ${name}`, criteria);
  },
  
  // System
  initialize: () => {
    const state = get();
    
    // Start session if not already started
    if (!state.currentSession) {
      get().startSession();
    }
    
    // Set up performance monitoring
    if (state.config.enablePerformanceTracking) {
      // Monitor page load time
      if (typeof window !== 'undefined' && window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        get().trackPerformance('page_load_time', loadTime, 'ms');
      }
    }
    
    // Set up error tracking
    if (state.config.enableErrorTracking && typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        get().trackError(event.error || new Error(event.message));
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        get().trackError(new Error(event.reason));
      });
    }
    
    // Start real-time metrics updates
    setInterval(() => {
      get().updateRealTimeMetrics();
      get().calculateStats();
    }, 5000);
    
    get().addDebugLog('info', 'Analytics system initialized');
  },
  
  destroy: () => {
    get().endSession();
    get().addDebugLog('info', 'Analytics system destroyed');
  },
  
  getSystemInfo: () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: (performance as any).memory,
      connection: (navigator as any).connection,
    };
  },
  
  // Debug
  addDebugLog: (level, message, data, source = 'analytics') => {
    const log: AnalyticsDebugLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      data,
      timestamp: Date.now(),
      source,
    };
    
    set((state) => ({
      debugLogs: [...state.debugLogs.slice(-999), log], // Keep last 1000 logs
    }));
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },
  
  exportDebugLogs: () => {
    const logs = get().debugLogs;
    return JSON.stringify(logs, null, 2);
  },
})));

// Analytics Manager Class
export class AnalyticsManager {
  private store = useAnalyticsStore;
  
  constructor() {
    this.initialize();
  }
  
  initialize() {
    this.store.getState().initialize();
  }
  
  track(event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) {
    this.store.getState().trackEvent(event);
  }
  
  metric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    this.store.getState().trackMetric(metric);
  }
  
  alert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) {
    this.store.getState().createAlert(alert);
  }
  
  page(path: string, title?: string) {
    this.store.getState().trackPageView(path, title);
  }
  
  action(action: string, category: string, label?: string) {
    this.store.getState().trackUserAction(action, category, label);
  }
  
  error(error: Error, context?: Record<string, any>) {
    this.store.getState().trackError(error, context);
  }
  
  performance(name: string, value: number, unit: string) {
    this.store.getState().trackPerformance(name, value, unit);
  }
  
  destroy() {
    this.store.getState().destroy();
  }
}

// Global instance
export const analytics = new AnalyticsManager();

// Utility functions
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getSeverityColor = (severity: Alert['severity']): string => {
  switch (severity) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'critical': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getEventTypeIcon = (type: AnalyticsEvent['type']): string => {
  switch (type) {
    case 'user_action': return '👤';
    case 'performance': return '⚡';
    case 'error': return '❌';
    case 'system': return '⚙️';
    case 'custom': return '🔧';
    default: return '📊';
  }
};

export const getMetricCategoryIcon = (category: PerformanceMetric['category']): string => {
  switch (category) {
    case 'load': return '🚀';
    case 'runtime': return '⚡';
    case 'memory': return '💾';
    case 'network': return '🌐';
    case 'custom': return '🔧';
    default: return '📊';
  }
};