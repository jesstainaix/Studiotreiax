import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'performance' | 'user' | 'system' | 'business';
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  metadata?: Record<string, any>;
}

export interface AnalyticsAlert {
  id: string;
  metricId: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  actions?: AnalyticsAlertAction[];
  metadata?: Record<string, any>;
}

export interface AnalyticsAlertAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string;
  variant: 'primary' | 'secondary' | 'danger';
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: AnalyticsWidget[];
  layout: AnalyticsLayout;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
}

export interface AnalyticsWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'heatmap' | 'funnel';
  title: string;
  metricIds: string[];
  config: AnalyticsWidgetConfig;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval: number;
  isVisible: boolean;
}

export interface AnalyticsWidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  timeRange?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string;
  filters?: Record<string, any>;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
}

export interface AnalyticsLayout {
  cols: number;
  rows: number;
  margin: [number, number];
  containerPadding: [number, number];
  rowHeight: number;
  isDraggable: boolean;
  isResizable: boolean;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description: string;
  dashboardId: string;
  schedule: AnalyticsReportSchedule;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  isActive: boolean;
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
  createdBy: string;
}

export interface AnalyticsReportSchedule {
  type: 'once' | 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
}

export interface AnalyticsConfig {
  enableRealTime: boolean;
  enableAlerts: boolean;
  enableAutoRefresh: boolean;
  refreshInterval: number;
  retentionDays: number;
  maxMetrics: number;
  alertThresholds: {
    warning: number;
    critical: number;
  };
  emailNotifications: boolean;
  slackNotifications: boolean;
  webhookUrl?: string;
}

export interface AnalyticsStats {
  totalMetrics: number;
  activeAlerts: number;
  dashboards: number;
  reports: number;
  dataPoints: number;
  storageUsed: number;
  apiCalls: number;
  uptime: number;
  lastUpdate: number;
}

export interface AnalyticsEvent {
  id: string;
  type: 'metric_created' | 'alert_triggered' | 'dashboard_created' | 'report_generated' | 'threshold_exceeded' | 'system_error';
  timestamp: number;
  userId?: string;
  metricId?: string;
  dashboardId?: string;
  alertId?: string;
  data: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalyticsDebugLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  component: string;
  metadata?: Record<string, any>;
}

// Store Interface
interface AnalyticsStore {
  // State
  metrics: AnalyticsMetric[];
  alerts: AnalyticsAlert[];
  dashboards: AnalyticsDashboard[];
  widgets: AnalyticsWidget[];
  reports: AnalyticsReport[];
  config: AnalyticsConfig;
  stats: AnalyticsStats;
  events: AnalyticsEvent[];
  debugLogs: AnalyticsDebugLog[];
  isLoading: boolean;
  error: string | null;
  
  // Metrics Management
  addMetric: (metric: Omit<AnalyticsMetric, 'id' | 'timestamp'>) => void;
  updateMetric: (id: string, updates: Partial<AnalyticsMetric>) => void;
  removeMetric: (id: string) => void;
  getMetric: (id: string) => AnalyticsMetric | undefined;
  getMetricsByCategory: (category: AnalyticsMetric['category']) => AnalyticsMetric[];
  
  // Alerts Management
  addAlert: (alert: Omit<AnalyticsAlert, 'id' | 'timestamp'>) => void;
  updateAlert: (id: string, updates: Partial<AnalyticsAlert>) => void;
  removeAlert: (id: string) => void;
  markAlertAsRead: (id: string) => void;
  resolveAlert: (id: string, resolvedBy: string) => void;
  getUnreadAlerts: () => AnalyticsAlert[];
  getActiveAlerts: () => AnalyticsAlert[];
  
  // Dashboard Management
  addDashboard: (dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDashboard: (id: string, updates: Partial<AnalyticsDashboard>) => void;
  removeDashboard: (id: string) => void;
  getDashboard: (id: string) => AnalyticsDashboard | undefined;
  cloneDashboard: (id: string, name: string) => void;
  
  // Widget Management
  addWidget: (dashboardId: string, widget: Omit<AnalyticsWidget, 'id'>) => void;
  updateWidget: (id: string, updates: Partial<AnalyticsWidget>) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, position: AnalyticsWidget['position']) => void;
  
  // Report Management
  addReport: (report: Omit<AnalyticsReport, 'id' | 'createdAt'>) => void;
  updateReport: (id: string, updates: Partial<AnalyticsReport>) => void;
  removeReport: (id: string) => void;
  generateReport: (id: string) => Promise<void>;
  scheduleReport: (id: string) => void;
  
  // Configuration
  updateConfig: (updates: Partial<AnalyticsConfig>) => void;
  resetConfig: () => void;
  
  // Analytics
  refreshStats: () => void;
  getMetricTrend: (metricId: string, timeRange: string) => number[];
  getMetricCorrelation: (metricId1: string, metricId2: string) => number;
  predictMetricValue: (metricId: string, timeAhead: number) => number;
  
  // Events
  addEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void;
  getEventsByType: (type: AnalyticsEvent['type']) => AnalyticsEvent[];
  getRecentEvents: (limit?: number) => AnalyticsEvent[];
  
  // Utilities
  exportData: (format: 'json' | 'csv' | 'excel') => Promise<Blob>;
  importData: (data: any) => Promise<void>;
  clearOldData: (days: number) => void;
  
  // Quick Actions
  createPerformanceDashboard: () => void;
  createUserDashboard: () => void;
  createSystemDashboard: () => void;
  setupDefaultAlerts: () => void;
  
  // Advanced Features
  enableAnomalyDetection: (metricId: string) => void;
  disableAnomalyDetection: (metricId: string) => void;
  setCustomThreshold: (metricId: string, warning: number, critical: number) => void;
  createMetricGroup: (name: string, metricIds: string[]) => void;
  
  // System Operations
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  optimizeStorage: () => void;
  validateData: () => boolean;
  
  // Debug
  addDebugLog: (log: Omit<AnalyticsDebugLog, 'id' | 'timestamp'>) => void;
  clearDebugLogs: () => void;
  enableDebug: () => void;
  disableDebug: () => void;
  isDebugEnabled: () => boolean;
}

// Default Configuration
const defaultConfig: AnalyticsConfig = {
  enableRealTime: true,
  enableAlerts: true,
  enableAutoRefresh: true,
  refreshInterval: 5000,
  retentionDays: 30,
  maxMetrics: 1000,
  alertThresholds: {
    warning: 80,
    critical: 95
  },
  emailNotifications: false,
  slackNotifications: false
};

// Default Stats
const defaultStats: AnalyticsStats = {
  totalMetrics: 0,
  activeAlerts: 0,
  dashboards: 0,
  reports: 0,
  dataPoints: 0,
  storageUsed: 0,
  apiCalls: 0,
  uptime: 0,
  lastUpdate: Date.now()
};

// Zustand Store
export const useAnalyticsStore = create<AnalyticsStore>()(subscribeWithSelector((set, get) => ({
  // Initial State
  metrics: [],
  alerts: [],
  dashboards: [],
  widgets: [],
  reports: [],
  config: defaultConfig,
  stats: defaultStats,
  events: [],
  debugLogs: [],
  isLoading: false,
  error: null,
  
  // Metrics Management
  addMetric: (metric) => {
    const newMetric: AnalyticsMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set((state) => ({
      metrics: [...state.metrics, newMetric],
      stats: {
        ...state.stats,
        totalMetrics: state.stats.totalMetrics + 1,
        lastUpdate: Date.now()
      }
    }));
    
    // Check thresholds and create alerts
    if (newMetric.threshold) {
      const { warning, critical } = newMetric.threshold;
      if (newMetric.value >= critical) {
        get().addAlert({
          metricId: newMetric.id,
          type: 'critical',
          title: `Critical threshold exceeded: ${newMetric.name}`,
          message: `Metric ${newMetric.name} has reached ${newMetric.value}${newMetric.unit}, exceeding critical threshold of ${critical}${newMetric.unit}`,
          isRead: false,
          isResolved: false
        });
      } else if (newMetric.value >= warning) {
        get().addAlert({
          metricId: newMetric.id,
          type: 'warning',
          title: `Warning threshold exceeded: ${newMetric.name}`,
          message: `Metric ${newMetric.name} has reached ${newMetric.value}${newMetric.unit}, exceeding warning threshold of ${warning}${newMetric.unit}`,
          isRead: false,
          isResolved: false
        });
      }
    }
    
    get().addEvent({
      type: 'metric_created',
      metricId: newMetric.id,
      data: { metric: newMetric },
      severity: 'low'
    });
  },
  
  updateMetric: (id, updates) => {
    set((state) => ({
      metrics: state.metrics.map(metric => 
        metric.id === id ? { ...metric, ...updates } : metric
      ),
      stats: {
        ...state.stats,
        lastUpdate: Date.now()
      }
    }));
  },
  
  removeMetric: (id) => {
    set((state) => ({
      metrics: state.metrics.filter(metric => metric.id !== id),
      stats: {
        ...state.stats,
        totalMetrics: Math.max(0, state.stats.totalMetrics - 1),
        lastUpdate: Date.now()
      }
    }));
  },
  
  getMetric: (id) => {
    return get().metrics.find(metric => metric.id === id);
  },
  
  getMetricsByCategory: (category) => {
    return get().metrics.filter(metric => metric.category === category);
  },
  
  // Alerts Management
  addAlert: (alert) => {
    const newAlert: AnalyticsAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set((state) => ({
      alerts: [...state.alerts, newAlert],
      stats: {
        ...state.stats,
        activeAlerts: state.stats.activeAlerts + 1,
        lastUpdate: Date.now()
      }
    }));
    
    get().addEvent({
      type: 'alert_triggered',
      alertId: newAlert.id,
      data: { alert: newAlert },
      severity: newAlert.type === 'critical' ? 'critical' : newAlert.type === 'warning' ? 'medium' : 'low'
    });
  },
  
  updateAlert: (id, updates) => {
    set((state) => ({
      alerts: state.alerts.map(alert => 
        alert.id === id ? { ...alert, ...updates } : alert
      )
    }));
  },
  
  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter(alert => alert.id !== id),
      stats: {
        ...state.stats,
        activeAlerts: Math.max(0, state.stats.activeAlerts - 1)
      }
    }));
  },
  
  markAlertAsRead: (id) => {
    get().updateAlert(id, { isRead: true });
  },
  
  resolveAlert: (id, resolvedBy) => {
    get().updateAlert(id, {
      isResolved: true,
      resolvedAt: Date.now(),
      resolvedBy
    });
    
    set((state) => ({
      stats: {
        ...state.stats,
        activeAlerts: Math.max(0, state.stats.activeAlerts - 1)
      }
    }));
  },
  
  getUnreadAlerts: () => {
    return get().alerts.filter(alert => !alert.isRead && !alert.isResolved);
  },
  
  getActiveAlerts: () => {
    return get().alerts.filter(alert => !alert.isResolved);
  },
  
  // Dashboard Management
  addDashboard: (dashboard) => {
    const newDashboard: AnalyticsDashboard = {
      ...dashboard,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    set((state) => ({
      dashboards: [...state.dashboards, newDashboard],
      stats: {
        ...state.stats,
        dashboards: state.stats.dashboards + 1
      }
    }));
    
    get().addEvent({
      type: 'dashboard_created',
      dashboardId: newDashboard.id,
      data: { dashboard: newDashboard },
      severity: 'low'
    });
  },
  
  updateDashboard: (id, updates) => {
    set((state) => ({
      dashboards: state.dashboards.map(dashboard => 
        dashboard.id === id ? { ...dashboard, ...updates, updatedAt: Date.now() } : dashboard
      )
    }));
  },
  
  removeDashboard: (id) => {
    set((state) => ({
      dashboards: state.dashboards.filter(dashboard => dashboard.id !== id),
      widgets: state.widgets.filter(widget => 
        !state.dashboards.find(d => d.id === id)?.widgets.includes(widget)
      ),
      stats: {
        ...state.stats,
        dashboards: Math.max(0, state.stats.dashboards - 1)
      }
    }));
  },
  
  getDashboard: (id) => {
    return get().dashboards.find(dashboard => dashboard.id === id);
  },
  
  cloneDashboard: (id, name) => {
    const dashboard = get().getDashboard(id);
    if (dashboard) {
      get().addDashboard({
        ...dashboard,
        name,
        createdBy: 'current_user' // This should be replaced with actual user ID
      });
    }
  },
  
  // Widget Management
  addWidget: (dashboardId, widget) => {
    const newWidget: AnalyticsWidget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    set((state) => ({
      widgets: [...state.widgets, newWidget],
      dashboards: state.dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? { ...dashboard, widgets: [...dashboard.widgets, newWidget] }
          : dashboard
      )
    }));
  },
  
  updateWidget: (id, updates) => {
    set((state) => ({
      widgets: state.widgets.map(widget => 
        widget.id === id ? { ...widget, ...updates } : widget
      )
    }));
  },
  
  removeWidget: (id) => {
    set((state) => ({
      widgets: state.widgets.filter(widget => widget.id !== id),
      dashboards: state.dashboards.map(dashboard => ({
        ...dashboard,
        widgets: dashboard.widgets.filter(widget => widget.id !== id)
      }))
    }));
  },
  
  moveWidget: (id, position) => {
    get().updateWidget(id, { position });
  },
  
  // Report Management
  addReport: (report) => {
    const newReport: AnalyticsReport = {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    
    set((state) => ({
      reports: [...state.reports, newReport],
      stats: {
        ...state.stats,
        reports: state.stats.reports + 1
      }
    }));
  },
  
  updateReport: (id, updates) => {
    set((state) => ({
      reports: state.reports.map(report => 
        report.id === id ? { ...report, ...updates } : report
      )
    }));
  },
  
  removeReport: (id) => {
    set((state) => ({
      reports: state.reports.filter(report => report.id !== id),
      stats: {
        ...state.stats,
        reports: Math.max(0, state.stats.reports - 1)
      }
    }));
  },
  
  generateReport: async (id) => {
    const report = get().reports.find(r => r.id === id);
    if (report) {
      get().updateReport(id, { lastRun: Date.now() });
      get().addEvent({
        type: 'report_generated',
        data: { reportId: id },
        severity: 'low'
      });
    }
  },
  
  scheduleReport: (id) => {
    const report = get().reports.find(r => r.id === id);
    if (report && report.schedule) {
      // Calculate next run time based on schedule
      const now = new Date();
      let nextRun = new Date(now);
      
      switch (report.schedule.type) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
      
      get().updateReport(id, { nextRun: nextRun.getTime() });
    }
  },
  
  // Configuration
  updateConfig: (updates) => {
    set((state) => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  // Analytics
  refreshStats: () => {
    const state = get();
    const now = Date.now();
    
    set({
      stats: {
        totalMetrics: state.metrics.length,
        activeAlerts: state.alerts.filter(a => !a.isResolved).length,
        dashboards: state.dashboards.length,
        reports: state.reports.length,
        dataPoints: state.metrics.reduce((sum, m) => sum + (m.metadata?.dataPoints || 1), 0),
        storageUsed: JSON.stringify(state).length,
        apiCalls: state.stats.apiCalls,
        uptime: now - (state.stats.lastUpdate || now),
        lastUpdate: now
      }
    });
  },
  
  getMetricTrend: (metricId, timeRange) => {
    // Mock implementation - in real app, this would query historical data
    return Array.from({ length: 24 }, (_, i) => Math.random() * 100);
  },
  
  getMetricCorrelation: (metricId1, metricId2) => {
    // Mock implementation - in real app, this would calculate correlation
    return Math.random() * 2 - 1; // Random correlation between -1 and 1
  },
  
  predictMetricValue: (metricId, timeAhead) => {
    const metric = get().getMetric(metricId);
    if (!metric) return 0;
    
    // Simple prediction based on trend
    const trendMultiplier = metric.trend === 'up' ? 1.1 : metric.trend === 'down' ? 0.9 : 1;
    return metric.value * Math.pow(trendMultiplier, timeAhead / 3600000); // timeAhead in ms
  },
  
  // Events
  addEvent: (event) => {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set((state) => ({
      events: [...state.events.slice(-999), newEvent] // Keep last 1000 events
    }));
  },
  
  getEventsByType: (type) => {
    return get().events.filter(event => event.type === type);
  },
  
  getRecentEvents: (limit = 10) => {
    return get().events.slice(-limit).reverse();
  },
  
  // Utilities
  exportData: async (format) => {
    const state = get();
    const data = {
      metrics: state.metrics,
      alerts: state.alerts,
      dashboards: state.dashboards,
      reports: state.reports,
      config: state.config,
      stats: state.stats,
      exportedAt: Date.now()
    };
    
    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    } else if (format === 'csv') {
      // Convert metrics to CSV
      const csv = [
        'ID,Name,Value,Unit,Category,Timestamp,Trend',
        ...state.metrics.map(m => 
          `${m.id},${m.name},${m.value},${m.unit},${m.category},${m.timestamp},${m.trend}`
        )
      ].join('\n');
      return new Blob([csv], { type: 'text/csv' });
    }
    
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  },
  
  importData: async (data) => {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      set({
        metrics: data.metrics || [],
        alerts: data.alerts || [],
        dashboards: data.dashboards || [],
        reports: data.reports || [],
        config: { ...defaultConfig, ...data.config },
        stats: { ...defaultStats, ...data.stats }
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  },
  
  clearOldData: (days) => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    set((state) => ({
      metrics: state.metrics.filter(m => m.timestamp > cutoff),
      alerts: state.alerts.filter(a => a.timestamp > cutoff),
      events: state.events.filter(e => e.timestamp > cutoff),
      debugLogs: state.debugLogs.filter(l => l.timestamp > cutoff)
    }));
  },
  
  // Quick Actions
  createPerformanceDashboard: () => {
    get().addDashboard({
      name: 'Performance Dashboard',
      description: 'Monitor system performance metrics',
      widgets: [],
      layout: {
        cols: 12,
        rows: 8,
        margin: [10, 10],
        containerPadding: [10, 10],
        rowHeight: 60,
        isDraggable: true,
        isResizable: true
      },
      isPublic: false,
      createdBy: 'system',
      tags: ['performance', 'system']
    });
  },
  
  createUserDashboard: () => {
    get().addDashboard({
      name: 'User Analytics Dashboard',
      description: 'Track user engagement and behavior',
      widgets: [],
      layout: {
        cols: 12,
        rows: 8,
        margin: [10, 10],
        containerPadding: [10, 10],
        rowHeight: 60,
        isDraggable: true,
        isResizable: true
      },
      isPublic: false,
      createdBy: 'system',
      tags: ['users', 'engagement']
    });
  },
  
  createSystemDashboard: () => {
    get().addDashboard({
      name: 'System Health Dashboard',
      description: 'Monitor system health and infrastructure',
      widgets: [],
      layout: {
        cols: 12,
        rows: 8,
        margin: [10, 10],
        containerPadding: [10, 10],
        rowHeight: 60,
        isDraggable: true,
        isResizable: true
      },
      isPublic: false,
      createdBy: 'system',
      tags: ['system', 'health', 'infrastructure']
    });
  },
  
  setupDefaultAlerts: () => {
    const defaultAlerts = [
      {
        metricId: 'cpu_usage',
        type: 'warning' as const,
        title: 'High CPU Usage',
        message: 'CPU usage is above 80%',
        isRead: false,
        isResolved: false
      },
      {
        metricId: 'memory_usage',
        type: 'critical' as const,
        title: 'Critical Memory Usage',
        message: 'Memory usage is above 95%',
        isRead: false,
        isResolved: false
      },
      {
        metricId: 'error_rate',
        type: 'warning' as const,
        title: 'High Error Rate',
        message: 'Error rate is above normal threshold',
        isRead: false,
        isResolved: false
      }
    ];
    
    defaultAlerts.forEach(alert => get().addAlert(alert));
  },
  
  // Advanced Features
  enableAnomalyDetection: (metricId) => {
    get().updateMetric(metricId, {
      metadata: {
        ...get().getMetric(metricId)?.metadata,
        anomalyDetection: true
      }
    });
  },
  
  disableAnomalyDetection: (metricId) => {
    get().updateMetric(metricId, {
      metadata: {
        ...get().getMetric(metricId)?.metadata,
        anomalyDetection: false
      }
    });
  },
  
  setCustomThreshold: (metricId, warning, critical) => {
    get().updateMetric(metricId, {
      threshold: { warning, critical }
    });
  },
  
  createMetricGroup: (name, metricIds) => {
    // This would create a logical grouping of metrics
    get().addEvent({
      type: 'metric_created',
      data: { groupName: name, metricIds },
      severity: 'low'
    });
  },
  
  // System Operations
  startRealTimeUpdates: () => {
    get().updateConfig({ enableRealTime: true });
  },
  
  stopRealTimeUpdates: () => {
    get().updateConfig({ enableRealTime: false });
  },
  
  optimizeStorage: () => {
    get().clearOldData(get().config.retentionDays);
  },
  
  validateData: () => {
    const state = get();
    
    // Check for data integrity
    const hasValidMetrics = state.metrics.every(m => m.id && m.name && typeof m.value === 'number');
    const hasValidAlerts = state.alerts.every(a => a.id && a.title && a.message);
    const hasValidDashboards = state.dashboards.every(d => d.id && d.name);
    
    return hasValidMetrics && hasValidAlerts && hasValidDashboards;
  },
  
  // Debug
  addDebugLog: (log) => {
    const newLog: AnalyticsDebugLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set((state) => ({
      debugLogs: [...state.debugLogs.slice(-999), newLog] // Keep last 1000 logs
    }));
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },
  
  enableDebug: () => {
    get().updateConfig({ enableRealTime: true }); // Use existing config field
  },
  
  disableDebug: () => {
    get().updateConfig({ enableRealTime: false }); // Use existing config field
  },
  
  isDebugEnabled: () => {
    return get().config.enableRealTime; // Use existing config field
  }
})));

// Analytics Manager Class
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private updateInterval?: NodeJS.Timeout;
  
  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }
  
  startAutoUpdates() {
    const { config, refreshStats } = useAnalyticsStore.getState();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (config.enableAutoRefresh) {
      this.updateInterval = setInterval(() => {
        refreshStats();
      }, config.refreshInterval);
    }
  }
  
  stopAutoUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
  
  generateSampleData() {
    const { addMetric, addDashboard } = useAnalyticsStore.getState();
    
    // Add sample metrics
    const sampleMetrics = [
      {
        name: 'CPU Usage',
        value: 75,
        unit: '%',
        category: 'performance' as const,
        trend: 'up' as const,
        change: 5,
        threshold: { warning: 80, critical: 95 }
      },
      {
        name: 'Memory Usage',
        value: 60,
        unit: '%',
        category: 'performance' as const,
        trend: 'stable' as const,
        change: 0,
        threshold: { warning: 85, critical: 95 }
      },
      {
        name: 'Active Users',
        value: 1250,
        unit: '',
        category: 'user' as const,
        trend: 'up' as const,
        change: 12
      },
      {
        name: 'Error Rate',
        value: 2.5,
        unit: '%',
        category: 'system' as const,
        trend: 'down' as const,
        change: -0.5,
        threshold: { warning: 5, critical: 10 }
      }
    ];
    
    sampleMetrics.forEach(metric => addMetric(metric));
  }
}

// Global instance
export const analyticsManager = AnalyticsManager.getInstance();

// Utility Functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const getMetricCategoryColor = (category: AnalyticsMetric['category']): string => {
  switch (category) {
    case 'performance': return 'text-blue-600';
    case 'user': return 'text-green-600';
    case 'system': return 'text-purple-600';
    case 'business': return 'text-orange-600';
    default: return 'text-gray-600';
  }
};

export const getAlertTypeColor = (type: AnalyticsAlert['type']): string => {
  switch (type) {
    case 'critical': return 'text-red-600';
    case 'warning': return 'text-orange-600';
    case 'info': return 'text-blue-600';
    default: return 'text-gray-600';
  }
};

export const getTrendIcon = (trend: AnalyticsMetric['trend']): string => {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    case 'stable': return '➡️';
    default: return '➡️';
  }
};

export const getEventSeverityColor = (severity: AnalyticsEvent['severity']): string => {
  switch (severity) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};