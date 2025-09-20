import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface MetricValue {
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Metric {
  id: string;
  name: string;
  category: 'performance' | 'usage' | 'error' | 'business' | 'system';
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  unit: string;
  description: string;
  values: MetricValue[];
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  threshold?: {
    warning: number;
    critical: number;
  };
  tags: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Alert {
  id: string;
  metricId: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
  acknowledgedBy?: string;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardWidget[];
  filters: DashboardFilter[];
  refreshInterval: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stat' | 'table' | 'alert' | 'gauge' | 'heatmap';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    metricIds: string[];
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    timeRange?: string;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    groupBy?: string;
    filters?: Record<string, any>;
  };
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'range' | 'date' | 'text';
  options?: string[];
  defaultValue?: any;
  isRequired: boolean;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  properties: Record<string, any>;
  context: {
    page: string;
    userAgent: string;
    ip?: string;
    location?: {
      country: string;
      city: string;
    };
  };
}

export interface MetricsConfig {
  collection: {
    enabled: boolean;
    interval: number;
    batchSize: number;
    retentionDays: number;
  };
  alerts: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    escalationRules: {
      timeToEscalate: number;
      escalationLevels: string[];
    };
  };
  dashboard: {
    defaultRefreshInterval: number;
    maxWidgetsPerDashboard: number;
    enableRealTime: boolean;
  };
  analytics: {
    enabled: boolean;
    trackPageViews: boolean;
    trackUserInteractions: boolean;
    trackErrors: boolean;
    trackPerformance: boolean;
  };
}

export interface MetricsStats {
  totalMetrics: number;
  activeMetrics: number;
  totalAlerts: number;
  activeAlerts: number;
  totalEvents: number;
  dashboards: number;
  dataPoints: number;
  storageUsed: number;
  lastUpdate: number;
}

export interface DebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  category: string;
  metadata?: Record<string, any>;
}

// Zustand Store
interface MetricsStore {
  // State
  metrics: Metric[];
  alerts: Alert[];
  dashboards: Dashboard[];
  events: AnalyticsEvent[];
  config: MetricsConfig;
  stats: MetricsStats;
  isCollecting: boolean;
  isLoading: boolean;
  error: string | null;
  debugLogs: DebugLog[];
  
  // Actions
  // Metrics Management
  createMetric: (metric: Omit<Metric, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMetric: (id: string, updates: Partial<Metric>) => void;
  deleteMetric: (id: string) => void;
  recordMetricValue: (metricId: string, value: number, metadata?: Record<string, any>) => void;
  getMetricHistory: (metricId: string, timeRange: string) => MetricValue[];
  
  // Alerts Management
  createAlert: (alert: Omit<Alert, 'id' | 'triggeredAt'>) => void;
  acknowledgeAlert: (id: string, acknowledgedBy: string) => void;
  resolveAlert: (id: string, resolvedBy: string) => void;
  checkThresholds: () => void;
  
  // Dashboard Management
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  addWidget: (dashboardId: string, widget: Omit<DashboardWidget, 'id'>) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  
  // Analytics
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void;
  trackPageView: (page: string, userId?: string) => void;
  trackUserInteraction: (action: string, element: string, userId?: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, context?: Record<string, any>) => void;
  
  // Collection Control
  startCollection: () => void;
  stopCollection: () => void;
  pauseCollection: () => void;
  resumeCollection: () => void;
  
  // Configuration
  updateConfig: (updates: Partial<MetricsConfig>) => void;
  resetConfig: () => void;
  
  // Data Management
  exportData: (format: 'json' | 'csv' | 'xlsx') => Promise<Blob>;
  importData: (data: any) => void;
  clearData: (category?: string) => void;
  
  // System Operations
  refreshStats: () => void;
  runDiagnostics: () => Promise<any>;
  optimizeStorage: () => void;
  
  // Debug
  addDebugLog: (level: DebugLog['level'], message: string, category: string, metadata?: Record<string, any>) => void;
  clearDebugLogs: () => void;
  getSystemInfo: () => Record<string, any>;
}

// Default configuration
const defaultConfig: MetricsConfig = {
  collection: {
    enabled: true,
    interval: 5000,
    batchSize: 100,
    retentionDays: 30
  },
  alerts: {
    enabled: true,
    channels: ['email'],
    escalationRules: {
      timeToEscalate: 300000, // 5 minutes
      escalationLevels: ['team-lead', 'manager', 'director']
    }
  },
  dashboard: {
    defaultRefreshInterval: 30000,
    maxWidgetsPerDashboard: 20,
    enableRealTime: true
  },
  analytics: {
    enabled: true,
    trackPageViews: true,
    trackUserInteractions: true,
    trackErrors: true,
    trackPerformance: true
  }
};

// Create store
export const useMetricsStore = create<MetricsStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  metrics: [],
  alerts: [],
  dashboards: [],
  events: [],
  config: defaultConfig,
  stats: {
    totalMetrics: 0,
    activeMetrics: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    totalEvents: 0,
    dashboards: 0,
    dataPoints: 0,
    storageUsed: 0,
    lastUpdate: Date.now()
  },
  isCollecting: false,
  isLoading: false,
  error: null,
  debugLogs: [],
  
  // Metrics Management
  createMetric: (metricData) => {
    const metric: Metric = {
      ...metricData,
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      values: [],
      currentValue: 0,
      previousValue: 0,
      trend: 'stable',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    set((state) => ({
      metrics: [...state.metrics, metric]
    }));
    
    get().addDebugLog('info', `Metric created: ${metric.name}`, 'metrics', { metricId: metric.id });
    get().refreshStats();
  },
  
  updateMetric: (id, updates) => {
    set((state) => ({
      metrics: state.metrics.map(metric => 
        metric.id === id 
          ? { ...metric, ...updates, updatedAt: Date.now() }
          : metric
      )
    }));
    
    get().addDebugLog('info', `Metric updated: ${id}`, 'metrics', { updates });
    get().refreshStats();
  },
  
  deleteMetric: (id) => {
    set((state) => ({
      metrics: state.metrics.filter(metric => metric.id !== id)
    }));
    
    get().addDebugLog('info', `Metric deleted: ${id}`, 'metrics');
    get().refreshStats();
  },
  
  recordMetricValue: (metricId, value, metadata) => {
    const timestamp = Date.now();
    const metricValue: MetricValue = { value, timestamp, metadata };
    
    set((state) => ({
      metrics: state.metrics.map(metric => {
        if (metric.id === metricId) {
          const newValues = [...metric.values, metricValue].slice(-1000); // Keep last 1000 values
          const previousValue = metric.currentValue;
          const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable';
          
          return {
            ...metric,
            values: newValues,
            previousValue: metric.currentValue,
            currentValue: value,
            trend,
            updatedAt: timestamp
          };
        }
        return metric;
      })
    }));
    
    // Check thresholds after recording value
    get().checkThresholds();
    get().refreshStats();
  },
  
  getMetricHistory: (metricId, timeRange) => {
    const metric = get().metrics.find(m => m.id === metricId);
    if (!metric) return [];
    
    const now = Date.now();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - (ranges[timeRange] || ranges['24h']);
    return metric.values.filter(v => v.timestamp >= cutoff);
  },
  
  // Alerts Management
  createAlert: (alertData) => {
    const alert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: Date.now()
    };
    
    set((state) => ({
      alerts: [...state.alerts, alert]
    }));
    
    get().addDebugLog('warn', `Alert created: ${alert.title}`, 'alerts', { alertId: alert.id });
    get().refreshStats();
  },
  
  acknowledgeAlert: (id, acknowledgedBy) => {
    set((state) => ({
      alerts: state.alerts.map(alert => 
        alert.id === id 
          ? { ...alert, status: 'acknowledged', acknowledgedAt: Date.now(), acknowledgedBy }
          : alert
      )
    }));
    
    get().addDebugLog('info', `Alert acknowledged: ${id}`, 'alerts', { acknowledgedBy });
    get().refreshStats();
  },
  
  resolveAlert: (id, resolvedBy) => {
    set((state) => ({
      alerts: state.alerts.map(alert => 
        alert.id === id 
          ? { ...alert, status: 'resolved', resolvedAt: Date.now(), resolvedBy }
          : alert
      )
    }));
    
    get().addDebugLog('info', `Alert resolved: ${id}`, 'alerts', { resolvedBy });
    get().refreshStats();
  },
  
  checkThresholds: () => {
    const { metrics, alerts, createAlert } = get();
    
    metrics.forEach(metric => {
      if (!metric.threshold || !metric.isActive) return;
      
      const { warning, critical } = metric.threshold;
      const value = metric.currentValue;
      
      // Check if alert already exists for this metric
      const existingAlert = alerts.find(a => 
        a.metricId === metric.id && 
        a.status === 'active'
      );
      
      if (value >= critical && !existingAlert) {
        createAlert({
          metricId: metric.id,
          type: 'critical',
          title: `Critical Alert: ${metric.name}`,
          message: `${metric.name} has reached critical threshold: ${value} ${metric.unit}`,
          severity: 'critical',
          status: 'active',
          metadata: { threshold: critical, currentValue: value }
        });
      } else if (value >= warning && !existingAlert) {
        createAlert({
          metricId: metric.id,
          type: 'warning',
          title: `Warning Alert: ${metric.name}`,
          message: `${metric.name} has reached warning threshold: ${value} ${metric.unit}`,
          severity: 'medium',
          status: 'active',
          metadata: { threshold: warning, currentValue: value }
        });
      }
    });
  },
  
  // Dashboard Management
  createDashboard: (dashboardData) => {
    const dashboard: Dashboard = {
      ...dashboardData,
      id: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    set((state) => ({
      dashboards: [...state.dashboards, dashboard]
    }));
    
    get().addDebugLog('info', `Dashboard created: ${dashboard.name}`, 'dashboards', { dashboardId: dashboard.id });
    get().refreshStats();
  },
  
  updateDashboard: (id, updates) => {
    set((state) => ({
      dashboards: state.dashboards.map(dashboard => 
        dashboard.id === id 
          ? { ...dashboard, ...updates, updatedAt: Date.now() }
          : dashboard
      )
    }));
    
    get().addDebugLog('info', `Dashboard updated: ${id}`, 'dashboards', { updates });
    get().refreshStats();
  },
  
  deleteDashboard: (id) => {
    set((state) => ({
      dashboards: state.dashboards.filter(dashboard => dashboard.id !== id)
    }));
    
    get().addDebugLog('info', `Dashboard deleted: ${id}`, 'dashboards');
    get().refreshStats();
  },
  
  addWidget: (dashboardId, widgetData) => {
    const widget: DashboardWidget = {
      ...widgetData,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    set((state) => ({
      dashboards: state.dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? { ...dashboard, layout: [...dashboard.layout, widget], updatedAt: Date.now() }
          : dashboard
      )
    }));
    
    get().addDebugLog('info', `Widget added to dashboard: ${dashboardId}`, 'dashboards', { widgetId: widget.id });
  },
  
  updateWidget: (dashboardId, widgetId, updates) => {
    set((state) => ({
      dashboards: state.dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? {
              ...dashboard,
              layout: dashboard.layout.map(widget => 
                widget.id === widgetId ? { ...widget, ...updates } : widget
              ),
              updatedAt: Date.now()
            }
          : dashboard
      )
    }));
    
    get().addDebugLog('info', `Widget updated: ${widgetId}`, 'dashboards', { updates });
  },
  
  removeWidget: (dashboardId, widgetId) => {
    set((state) => ({
      dashboards: state.dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? {
              ...dashboard,
              layout: dashboard.layout.filter(widget => widget.id !== widgetId),
              updatedAt: Date.now()
            }
          : dashboard
      )
    }));
    
    get().addDebugLog('info', `Widget removed: ${widgetId}`, 'dashboards');
  },
  
  // Analytics
  trackEvent: (eventData) => {
    const event: AnalyticsEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set((state) => ({
      events: [...state.events.slice(-9999), event] // Keep last 10k events
    }));
    
    get().refreshStats();
  },
  
  trackPageView: (page, userId) => {
    if (!get().config.analytics.trackPageViews) return;
    
    get().trackEvent({
      name: 'page_view',
      category: 'navigation',
      action: 'view',
      label: page,
      userId,
      sessionId: 'session-' + Date.now(),
      properties: { page },
      context: {
        page,
        userAgent: navigator.userAgent
      }
    });
  },
  
  trackUserInteraction: (action, element, userId) => {
    if (!get().config.analytics.trackUserInteractions) return;
    
    get().trackEvent({
      name: 'user_interaction',
      category: 'engagement',
      action,
      label: element,
      userId,
      sessionId: 'session-' + Date.now(),
      properties: { action, element },
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent
      }
    });
  },
  
  trackError: (error, context) => {
    if (!get().config.analytics.trackErrors) return;
    
    get().trackEvent({
      name: 'error',
      category: 'error',
      action: 'exception',
      label: error.message,
      sessionId: 'session-' + Date.now(),
      properties: {
        message: error.message,
        stack: error.stack,
        ...context
      },
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent
      }
    });
  },
  
  trackPerformance: (metric, value, context) => {
    if (!get().config.analytics.trackPerformance) return;
    
    get().trackEvent({
      name: 'performance',
      category: 'performance',
      action: 'measure',
      label: metric,
      value,
      sessionId: 'session-' + Date.now(),
      properties: {
        metric,
        value,
        ...context
      },
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent
      }
    });
  },
  
  // Collection Control
  startCollection: () => {
    set({ isCollecting: true });
    get().addDebugLog('info', 'Metrics collection started', 'system');
  },
  
  stopCollection: () => {
    set({ isCollecting: false });
    get().addDebugLog('info', 'Metrics collection stopped', 'system');
  },
  
  pauseCollection: () => {
    set({ isCollecting: false });
    get().addDebugLog('info', 'Metrics collection paused', 'system');
  },
  
  resumeCollection: () => {
    set({ isCollecting: true });
    get().addDebugLog('info', 'Metrics collection resumed', 'system');
  },
  
  // Configuration
  updateConfig: (updates) => {
    set((state) => ({
      config: { ...state.config, ...updates }
    }));
    
    get().addDebugLog('info', 'Configuration updated', 'config', { updates });
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
    get().addDebugLog('info', 'Configuration reset to defaults', 'config');
  },
  
  // Data Management
  exportData: async (format) => {
    const { metrics, alerts, dashboards, events } = get();
    const data = { metrics, alerts, dashboards, events };
    
    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
    
    // For CSV and XLSX, we'd need additional libraries
    // This is a simplified implementation
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  },
  
  importData: (data) => {
    try {
      const { metrics, alerts, dashboards, events } = data;
      set({ metrics, alerts, dashboards, events });
      get().addDebugLog('info', 'Data imported successfully', 'system');
      get().refreshStats();
    } catch (error) {
      get().addDebugLog('error', 'Failed to import data', 'system', { error: error.message });
    }
  },
  
  clearData: (category) => {
    if (category) {
      switch (category) {
        case 'metrics':
          set({ metrics: [] });
          break;
        case 'alerts':
          set({ alerts: [] });
          break;
        case 'dashboards':
          set({ dashboards: [] });
          break;
        case 'events':
          set({ events: [] });
          break;
      }
    } else {
      set({ metrics: [], alerts: [], dashboards: [], events: [] });
    }
    
    get().addDebugLog('info', `Data cleared: ${category || 'all'}`, 'system');
    get().refreshStats();
  },
  
  // System Operations
  refreshStats: () => {
    const { metrics, alerts, dashboards, events } = get();
    
    const stats: MetricsStats = {
      totalMetrics: metrics.length,
      activeMetrics: metrics.filter(m => m.isActive).length,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      totalEvents: events.length,
      dashboards: dashboards.length,
      dataPoints: metrics.reduce((sum, m) => sum + m.values.length, 0),
      storageUsed: JSON.stringify({ metrics, alerts, dashboards, events }).length,
      lastUpdate: Date.now()
    };
    
    set({ stats });
  },
  
  runDiagnostics: async () => {
    const { metrics, alerts, config } = get();
    
    const diagnostics = {
      timestamp: Date.now(),
      metrics: {
        total: metrics.length,
        active: metrics.filter(m => m.isActive).length,
        withThresholds: metrics.filter(m => m.threshold).length,
        categories: metrics.reduce((acc, m) => {
          acc[m.category] = (acc[m.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      alerts: {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        byType: alerts.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      config: {
        collectionEnabled: config.collection.enabled,
        alertsEnabled: config.alerts.enabled,
        analyticsEnabled: config.analytics.enabled
      },
      performance: {
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timing: performance.timing
      }
    };
    
    get().addDebugLog('info', 'Diagnostics completed', 'system', diagnostics);
    return diagnostics;
  },
  
  optimizeStorage: () => {
    const { metrics, events } = get();
    const retentionDays = get().config.collection.retentionDays;
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean old metric values
    const optimizedMetrics = metrics.map(metric => ({
      ...metric,
      values: metric.values.filter(v => v.timestamp >= cutoff)
    }));
    
    // Clean old events
    const optimizedEvents = events.filter(e => e.timestamp >= cutoff);
    
    set({ metrics: optimizedMetrics, events: optimizedEvents });
    
    get().addDebugLog('info', 'Storage optimized', 'system', { 
      retentionDays,
      cutoff: new Date(cutoff).toISOString()
    });
    get().refreshStats();
  },
  
  // Debug
  addDebugLog: (level, message, category, metadata) => {
    const log: DebugLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: Date.now(),
      category,
      metadata
    };
    
    set((state) => ({
      debugLogs: [...state.debugLogs.slice(-999), log] // Keep last 1000 logs
    }));
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },
  
  getSystemInfo: () => {
    const { metrics, alerts, dashboards, events, stats } = get();
    
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      environment: import.meta.env.MODE || 'development',
      stats,
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      performance: {
        memory: (performance as any).memory,
        timing: performance.timing,
        navigation: performance.navigation
      },
      storage: {
        localStorage: {
          available: typeof localStorage !== 'undefined',
          used: localStorage ? JSON.stringify(localStorage).length : 0
        },
        sessionStorage: {
          available: typeof sessionStorage !== 'undefined',
          used: sessionStorage ? JSON.stringify(sessionStorage).length : 0
        }
      }
    };
  }
})));

// Metrics Manager Class
export class MetricsManager {
  private static instance: MetricsManager;
  private collectionInterval?: NodeJS.Timeout;
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): MetricsManager {
    if (!MetricsManager.instance) {
      MetricsManager.instance = new MetricsManager();
    }
    return MetricsManager.instance;
  }
  
  private initialize() {
    // Set up automatic collection
    this.startAutoCollection();
    
    // Set up automatic optimization
    setInterval(() => {
      useMetricsStore.getState().optimizeStorage();
    }, 24 * 60 * 60 * 1000); // Daily
    
    // Set up automatic threshold checking
    setInterval(() => {
      useMetricsStore.getState().checkThresholds();
    }, 60 * 1000); // Every minute
  }
  
  startAutoCollection() {
    const { config, startCollection } = useMetricsStore.getState();
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    if (config.collection.enabled) {
      startCollection();
      
      this.collectionInterval = setInterval(() => {
        this.collectSystemMetrics();
      }, config.collection.interval);
    }
  }
  
  stopAutoCollection() {
    const { stopCollection } = useMetricsStore.getState();
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    
    stopCollection();
  }
  
  private collectSystemMetrics() {
    const { recordMetricValue } = useMetricsStore.getState();
    
    // Collect performance metrics
    if ((performance as any).memory) {
      recordMetricValue('memory-used', (performance as any).memory.usedJSHeapSize);
      recordMetricValue('memory-total', (performance as any).memory.totalJSHeapSize);
    }
    
    // Collect timing metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      recordMetricValue('page-load-time', navigation.loadEventEnd - navigation.loadEventStart);
      recordMetricValue('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
    }
    
    // Collect resource metrics
    const resources = performance.getEntriesByType('resource');
    if (resources.length > 0) {
      const totalSize = resources.reduce((sum, resource: any) => sum + (resource.transferSize || 0), 0);
      recordMetricValue('total-resource-size', totalSize);
    }
  }
}

// Global instance
export const metricsManager = MetricsManager.getInstance();

// Utility functions
export const formatMetricValue = (value: number, unit: string): string => {
  if (unit === 'bytes') {
    return formatBytes(value);
  } else if (unit === 'ms') {
    return `${value.toFixed(2)}ms`;
  } else if (unit === '%') {
    return `${value.toFixed(1)}%`;
  } else if (unit === 'count') {
    return value.toLocaleString();
  }
  return `${value} ${unit}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const getMetricColor = (metric: Metric): string => {
  if (!metric.threshold) return 'text-blue-500';
  
  const { warning, critical } = metric.threshold;
  const value = metric.currentValue;
  
  if (value >= critical) return 'text-red-500';
  if (value >= warning) return 'text-yellow-500';
  return 'text-green-500';
};

export const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'critical': return '🚨';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📊';
  }
};

export const getTrendIcon = (trend: Metric['trend']) => {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    case 'stable': return '➡️';
    default: return '📊';
  }
};