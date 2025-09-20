import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'performance' | 'user' | 'system' | 'business' | 'error';
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MetricAlert {
  id: string;
  metricId: string;
  name: string;
  description: string;
  condition: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    threshold: number | [number, number];
    duration?: number; // ms
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  triggeredAt?: number;
  resolvedAt?: number;
  actions: AlertAction[];
  cooldown: number; // ms
  lastTriggered?: number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'notification' | 'log' | 'auto-scale';
  config: Record<string, any>;
  enabled: boolean;
}

export interface MetricDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    rows: number;
  };
  refreshInterval: number;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardWidget {
  id: string;
  type: 'line-chart' | 'bar-chart' | 'gauge' | 'counter' | 'table' | 'heatmap' | 'pie-chart';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    metricIds: string[];
    timeRange: number; // ms
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
    groupBy?: string;
    filters?: Record<string, any>;
    thresholds?: { warning: number; critical: number };
    colors?: string[];
  };
  isVisible: boolean;
}

export interface MetricAggregation {
  id: string;
  metricId: string;
  timeWindow: number; // ms
  aggregationType: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'percentile';
  value: number;
  timestamp: number;
  dataPoints: number;
}

export interface MetricConfig {
  retentionPeriod: number; // ms
  aggregationIntervals: number[]; // ms
  alertCheckInterval: number; // ms
  maxMetricsPerSecond: number;
  enableAutoAggregation: boolean;
  enableRealTimeAlerts: boolean;
  enableDataCompression: boolean;
  compressionThreshold: number;
}

export interface MetricStats {
  totalMetrics: number;
  metricsPerSecond: number;
  activeAlerts: number;
  totalAlerts: number;
  dashboards: number;
  widgets: number;
  dataPoints: number;
  storageUsed: number; // bytes
  avgResponseTime: number;
  uptime: number;
  errorRate: number;
}

export interface MetricEvent {
  id: string;
  type: 'metric_created' | 'alert_triggered' | 'alert_resolved' | 'dashboard_updated' | 'system_error';
  timestamp: number;
  data: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
  source: string;
  userId?: string;
}

export interface MetricDebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'collection' | 'aggregation' | 'alerting' | 'dashboard' | 'storage';
  message: string;
  timestamp: number;
  data?: any;
  error?: Error;
}

// Store State
interface MetricState {
  // Core data
  metrics: MetricData[];
  alerts: MetricAlert[];
  dashboards: MetricDashboard[];
  aggregations: MetricAggregation[];
  
  // Configuration
  config: MetricConfig;
  
  // Runtime state
  isCollecting: boolean;
  isAlerting: boolean;
  lastUpdate: number;
  lastError: string | null;
  
  // Statistics
  stats: MetricStats;
  events: MetricEvent[];
  debugLogs: MetricDebugLog[];
  
  // Computed values
  computed: {
    recentMetrics: MetricData[];
    activeAlerts: MetricAlert[];
    criticalAlerts: MetricAlert[];
    systemHealth: number;
    performanceScore: number;
    alertRate: number;
    dataGrowthRate: number;
  };
}

// Store Actions
interface MetricActions {
  // Metric management
  addMetric: (metric: Omit<MetricData, 'id' | 'timestamp'>) => Promise<string>;
  addMetrics: (metrics: Omit<MetricData, 'id' | 'timestamp'>[]) => Promise<string[]>;
  getMetric: (id: string) => MetricData | null;
  getMetricsByCategory: (category: MetricData['category']) => MetricData[];
  getMetricsByTimeRange: (start: number, end: number) => MetricData[];
  deleteMetric: (id: string) => Promise<boolean>;
  clearOldMetrics: () => Promise<number>;
  
  // Alert management
  createAlert: (alert: Omit<MetricAlert, 'id' | 'isActive'>) => Promise<string>;
  updateAlert: (id: string, updates: Partial<MetricAlert>) => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;
  triggerAlert: (id: string) => Promise<boolean>;
  resolveAlert: (id: string) => Promise<boolean>;
  checkAlerts: () => Promise<void>;
  
  // Dashboard management
  createDashboard: (dashboard: Omit<MetricDashboard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDashboard: (id: string, updates: Partial<MetricDashboard>) => Promise<boolean>;
  deleteDashboard: (id: string) => Promise<boolean>;
  addWidget: (dashboardId: string, widget: Omit<DashboardWidget, 'id'>) => Promise<string>;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>) => Promise<boolean>;
  removeWidget: (dashboardId: string, widgetId: string) => Promise<boolean>;
  
  // Aggregation
  createAggregation: (metricId: string, timeWindow: number, type: MetricAggregation['aggregationType']) => Promise<string>;
  getAggregations: (metricId: string, timeRange?: number) => MetricAggregation[];
  processAggregations: () => Promise<void>;
  
  // Quick actions
  quickActions: {
    startCollection: () => Promise<boolean>;
    stopCollection: () => Promise<boolean>;
    enableAlerts: () => Promise<boolean>;
    disableAlerts: () => Promise<boolean>;
    exportMetrics: (timeRange?: number) => { success: boolean; data?: string; error?: string };
    importMetrics: (data: string) => Promise<{ success: boolean; imported: number; errors: string[] }>;
    resetSystem: () => Promise<boolean>;
    generateReport: (timeRange: number) => Promise<{ success: boolean; report?: any; error?: string }>;
  };
  
  // Advanced features
  advanced: {
    predictiveAnalysis: (metricId: string, horizon: number) => Promise<{ predictions: number[]; confidence: number }>;
    anomalyDetection: (metricId: string, sensitivity: number) => Promise<{ anomalies: number[]; score: number }>;
    correlationAnalysis: (metricIds: string[]) => Promise<{ correlations: Record<string, number> }>;
    performanceOptimization: () => Promise<{ optimizations: string[]; impact: number }>;
    autoScaling: (metricId: string, config: any) => Promise<boolean>;
    customQuery: (query: string) => Promise<{ results: any[]; executionTime: number }>;
  };
  
  // System operations
  system: {
    initialize: () => Promise<boolean>;
    shutdown: () => Promise<boolean>;
    backup: () => Promise<{ success: boolean; size: number; location: string }>;
    restore: (backup: string) => Promise<{ success: boolean; restored: number }>;
    optimize: () => Promise<{ optimized: number; spaceSaved: number }>;
    healthCheck: () => Promise<{ healthy: boolean; issues: string[] }>;
  };
  
  // Utilities
  utils: {
    formatMetricValue: (value: number, unit: string) => string;
    calculateTrend: (values: number[]) => { direction: 'up' | 'down' | 'stable'; percentage: number };
    getMetricColor: (value: number, thresholds?: { warning: number; critical: number }) => string;
    validateMetric: (metric: Partial<MetricData>) => { valid: boolean; errors: string[] };
    generateMetricId: () => string;
    compressData: (data: any[]) => { compressed: string; ratio: number };
    decompressData: (compressed: string) => any[];
  };
  
  // Configuration
  config: {
    updateConfig: (updates: Partial<MetricConfig>) => Promise<boolean>;
    resetConfig: () => Promise<boolean>;
    exportConfig: () => string;
    importConfig: (config: string) => Promise<boolean>;
  };
  
  // Analytics
  analytics: {
    getUsageStats: () => Promise<Record<string, number>>;
    getPerformanceMetrics: () => Promise<Record<string, number>>;
    getErrorAnalysis: () => Promise<{ errors: any[]; patterns: string[] }>;
    getTrendAnalysis: (metricId: string, period: number) => Promise<{ trend: string; forecast: number[] }>;
  };
  
  // Debug
  debug: {
    log: (level: MetricDebugLog['level'], category: MetricDebugLog['category'], message: string, data?: any) => void;
    getLogs: (level?: MetricDebugLog['level'], category?: MetricDebugLog['category']) => MetricDebugLog[];
    clearLogs: () => void;
    exportLogs: () => string;
    enableDebugMode: () => void;
    disableDebugMode: () => void;
  };
}

// Create store
export const useMetricStore = create<MetricState & MetricActions>()(subscribeWithSelector((set, get) => ({
  // Initial state
  metrics: [],
  alerts: [],
  dashboards: [],
  aggregations: [],
  
  config: {
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    aggregationIntervals: [60000, 300000, 3600000], // 1min, 5min, 1hour
    alertCheckInterval: 10000, // 10 seconds
    maxMetricsPerSecond: 1000,
    enableAutoAggregation: true,
    enableRealTimeAlerts: true,
    enableDataCompression: true,
    compressionThreshold: 10000
  },
  
  isCollecting: false,
  isAlerting: false,
  lastUpdate: Date.now(),
  lastError: null,
  
  stats: {
    totalMetrics: 0,
    metricsPerSecond: 0,
    activeAlerts: 0,
    totalAlerts: 0,
    dashboards: 0,
    widgets: 0,
    dataPoints: 0,
    storageUsed: 0,
    avgResponseTime: 0,
    uptime: 0,
    errorRate: 0
  },
  
  events: [],
  debugLogs: [],
  
  computed: {
    recentMetrics: [],
    activeAlerts: [],
    criticalAlerts: [],
    systemHealth: 100,
    performanceScore: 100,
    alertRate: 0,
    dataGrowthRate: 0
  },
  
  // Actions
  addMetric: async (metric) => {
    const id = generateId();
    const timestamp = Date.now();
    const newMetric: MetricData = { ...metric, id, timestamp };
    
    set((state) => ({
      metrics: [...state.metrics, newMetric],
      stats: {
        ...state.stats,
        totalMetrics: state.stats.totalMetrics + 1,
        dataPoints: state.stats.dataPoints + 1
      },
      lastUpdate: timestamp
    }));
    
    get().debug.log('info', 'collection', `Metric added: ${metric.name}`, { id, metric });
    return id;
  },
  
  addMetrics: async (metrics) => {
    const timestamp = Date.now();
    const newMetrics = metrics.map(metric => ({
      ...metric,
      id: generateId(),
      timestamp
    }));
    
    set((state) => ({
      metrics: [...state.metrics, ...newMetrics],
      stats: {
        ...state.stats,
        totalMetrics: state.stats.totalMetrics + newMetrics.length,
        dataPoints: state.stats.dataPoints + newMetrics.length
      },
      lastUpdate: timestamp
    }));
    
    get().debug.log('info', 'collection', `${newMetrics.length} metrics added in batch`);
    return newMetrics.map(m => m.id);
  },
  
  getMetric: (id) => {
    return get().metrics.find(m => m.id === id) || null;
  },
  
  getMetricsByCategory: (category) => {
    return get().metrics.filter(m => m.category === category);
  },
  
  getMetricsByTimeRange: (start, end) => {
    return get().metrics.filter(m => m.timestamp >= start && m.timestamp <= end);
  },
  
  deleteMetric: async (id) => {
    const metric = get().getMetric(id);
    if (!metric) return false;
    
    set((state) => ({
      metrics: state.metrics.filter(m => m.id !== id),
      stats: {
        ...state.stats,
        totalMetrics: Math.max(0, state.stats.totalMetrics - 1)
      }
    }));
    
    get().debug.log('info', 'collection', `Metric deleted: ${id}`);
    return true;
  },
  
  clearOldMetrics: async () => {
    const { retentionPeriod } = get().config;
    const cutoff = Date.now() - retentionPeriod;
    const oldMetrics = get().metrics.filter(m => m.timestamp < cutoff);
    
    set((state) => ({
      metrics: state.metrics.filter(m => m.timestamp >= cutoff),
      stats: {
        ...state.stats,
        totalMetrics: state.stats.totalMetrics - oldMetrics.length
      }
    }));
    
    get().debug.log('info', 'collection', `Cleared ${oldMetrics.length} old metrics`);
    return oldMetrics.length;
  },
  
  createAlert: async (alert) => {
    const id = generateId();
    const newAlert: MetricAlert = { ...alert, id, isActive: false };
    
    set((state) => ({
      alerts: [...state.alerts, newAlert],
      stats: {
        ...state.stats,
        totalAlerts: state.stats.totalAlerts + 1
      }
    }));
    
    get().debug.log('info', 'alerting', `Alert created: ${alert.name}`, { id, alert });
    return id;
  },
  
  updateAlert: async (id, updates) => {
    const alert = get().alerts.find(a => a.id === id);
    if (!alert) return false;
    
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
    
    get().debug.log('info', 'alerting', `Alert updated: ${id}`, updates);
    return true;
  },
  
  deleteAlert: async (id) => {
    const alert = get().alerts.find(a => a.id === id);
    if (!alert) return false;
    
    set((state) => ({
      alerts: state.alerts.filter(a => a.id !== id),
      stats: {
        ...state.stats,
        totalAlerts: Math.max(0, state.stats.totalAlerts - 1),
        activeAlerts: alert.isActive ? Math.max(0, state.stats.activeAlerts - 1) : state.stats.activeAlerts
      }
    }));
    
    get().debug.log('info', 'alerting', `Alert deleted: ${id}`);
    return true;
  },
  
  triggerAlert: async (id) => {
    const alert = get().alerts.find(a => a.id === id);
    if (!alert || alert.isActive) return false;
    
    const now = Date.now();
    set((state) => ({
      alerts: state.alerts.map(a => 
        a.id === id ? { ...a, isActive: true, triggeredAt: now, lastTriggered: now } : a
      ),
      stats: {
        ...state.stats,
        activeAlerts: state.stats.activeAlerts + 1
      }
    }));
    
    get().debug.log('warning', 'alerting', `Alert triggered: ${alert.name}`, { id, alert });
    return true;
  },
  
  resolveAlert: async (id) => {
    const alert = get().alerts.find(a => a.id === id);
    if (!alert || !alert.isActive) return false;
    
    const now = Date.now();
    set((state) => ({
      alerts: state.alerts.map(a => 
        a.id === id ? { ...a, isActive: false, resolvedAt: now } : a
      ),
      stats: {
        ...state.stats,
        activeAlerts: Math.max(0, state.stats.activeAlerts - 1)
      }
    }));
    
    get().debug.log('info', 'alerting', `Alert resolved: ${alert.name}`, { id, alert });
    return true;
  },
  
  checkAlerts: async () => {
    const { alerts, metrics } = get();
    const now = Date.now();
    
    for (const alert of alerts) {
      if (alert.lastTriggered && (now - alert.lastTriggered) < alert.cooldown) {
        continue; // Still in cooldown
      }
      
      const metric = metrics.find(m => m.id === alert.metricId);
      if (!metric) continue;
      
      let shouldTrigger = false;
      const { operator, threshold } = alert.condition;
      
      switch (operator) {
        case 'gt':
          shouldTrigger = metric.value > (threshold as number);
          break;
        case 'lt':
          shouldTrigger = metric.value < (threshold as number);
          break;
        case 'eq':
          shouldTrigger = metric.value === (threshold as number);
          break;
        case 'gte':
          shouldTrigger = metric.value >= (threshold as number);
          break;
        case 'lte':
          shouldTrigger = metric.value <= (threshold as number);
          break;
        case 'between':
          const [min, max] = threshold as [number, number];
          shouldTrigger = metric.value >= min && metric.value <= max;
          break;
      }
      
      if (shouldTrigger && !alert.isActive) {
        await get().triggerAlert(alert.id);
      } else if (!shouldTrigger && alert.isActive) {
        await get().resolveAlert(alert.id);
      }
    }
  },
  
  createDashboard: async (dashboard) => {
    const id = generateId();
    const now = Date.now();
    const newDashboard: MetricDashboard = {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    set((state) => ({
      dashboards: [...state.dashboards, newDashboard],
      stats: {
        ...state.stats,
        dashboards: state.stats.dashboards + 1
      }
    }));
    
    get().debug.log('info', 'dashboard', `Dashboard created: ${dashboard.name}`, { id, dashboard });
    return id;
  },
  
  updateDashboard: async (id, updates) => {
    const dashboard = get().dashboards.find(d => d.id === id);
    if (!dashboard) return false;
    
    set((state) => ({
      dashboards: state.dashboards.map(d => 
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      )
    }));
    
    get().debug.log('info', 'dashboard', `Dashboard updated: ${id}`, updates);
    return true;
  },
  
  deleteDashboard: async (id) => {
    const dashboard = get().dashboards.find(d => d.id === id);
    if (!dashboard) return false;
    
    set((state) => ({
      dashboards: state.dashboards.filter(d => d.id !== id),
      stats: {
        ...state.stats,
        dashboards: Math.max(0, state.stats.dashboards - 1),
        widgets: state.stats.widgets - dashboard.widgets.length
      }
    }));
    
    get().debug.log('info', 'dashboard', `Dashboard deleted: ${id}`);
    return true;
  },
  
  addWidget: async (dashboardId, widget) => {
    const dashboard = get().dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return '';
    
    const id = generateId();
    const newWidget: DashboardWidget = { ...widget, id };
    
    set((state) => ({
      dashboards: state.dashboards.map(d => 
        d.id === dashboardId ? {
          ...d,
          widgets: [...d.widgets, newWidget],
          updatedAt: Date.now()
        } : d
      ),
      stats: {
        ...state.stats,
        widgets: state.stats.widgets + 1
      }
    }));
    
    get().debug.log('info', 'dashboard', `Widget added to dashboard ${dashboardId}`, { id, widget });
    return id;
  },
  
  updateWidget: async (dashboardId, widgetId, updates) => {
    const dashboard = get().dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return false;
    
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return false;
    
    set((state) => ({
      dashboards: state.dashboards.map(d => 
        d.id === dashboardId ? {
          ...d,
          widgets: d.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w),
          updatedAt: Date.now()
        } : d
      )
    }));
    
    get().debug.log('info', 'dashboard', `Widget updated: ${widgetId}`, updates);
    return true;
  },
  
  removeWidget: async (dashboardId, widgetId) => {
    const dashboard = get().dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return false;
    
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return false;
    
    set((state) => ({
      dashboards: state.dashboards.map(d => 
        d.id === dashboardId ? {
          ...d,
          widgets: d.widgets.filter(w => w.id !== widgetId),
          updatedAt: Date.now()
        } : d
      ),
      stats: {
        ...state.stats,
        widgets: Math.max(0, state.stats.widgets - 1)
      }
    }));
    
    get().debug.log('info', 'dashboard', `Widget removed: ${widgetId}`);
    return true;
  },
  
  createAggregation: async (metricId, timeWindow, type) => {
    const id = generateId();
    const metrics = get().metrics.filter(m => m.id === metricId);
    
    if (metrics.length === 0) return '';
    
    let value = 0;
    switch (type) {
      case 'avg':
        value = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        break;
      case 'sum':
        value = metrics.reduce((sum, m) => sum + m.value, 0);
        break;
      case 'min':
        value = Math.min(...metrics.map(m => m.value));
        break;
      case 'max':
        value = Math.max(...metrics.map(m => m.value));
        break;
      case 'count':
        value = metrics.length;
        break;
      case 'percentile':
        // 95th percentile
        const sorted = metrics.map(m => m.value).sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.95);
        value = sorted[index] || 0;
        break;
    }
    
    const aggregation: MetricAggregation = {
      id,
      metricId,
      timeWindow,
      aggregationType: type,
      value,
      timestamp: Date.now(),
      dataPoints: metrics.length
    };
    
    set((state) => ({
      aggregations: [...state.aggregations, aggregation]
    }));
    
    get().debug.log('info', 'aggregation', `Aggregation created: ${type} for metric ${metricId}`, { id, aggregation });
    return id;
  },
  
  getAggregations: (metricId, timeRange) => {
    const aggregations = get().aggregations.filter(a => a.metricId === metricId);
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      return aggregations.filter(a => a.timestamp >= cutoff);
    }
    
    return aggregations;
  },
  
  processAggregations: async () => {
    const { config, metrics } = get();
    if (!config.enableAutoAggregation) return;
    
    const uniqueMetricIds = [...new Set(metrics.map(m => m.id))];
    
    for (const metricId of uniqueMetricIds) {
      for (const interval of config.aggregationIntervals) {
        await get().createAggregation(metricId, interval, 'avg');
      }
    }
    
    get().debug.log('info', 'aggregation', `Processed aggregations for ${uniqueMetricIds.length} metrics`);
  },
  
  // Quick actions
  quickActions: {
    startCollection: async () => {
      set({ isCollecting: true });
      get().debug.log('info', 'collection', 'Metric collection started');
      return true;
    },
    
    stopCollection: async () => {
      set({ isCollecting: false });
      get().debug.log('info', 'collection', 'Metric collection stopped');
      return true;
    },
    
    enableAlerts: async () => {
      set({ isAlerting: true });
      get().debug.log('info', 'alerting', 'Alert system enabled');
      return true;
    },
    
    disableAlerts: async () => {
      set({ isAlerting: false });
      get().debug.log('info', 'alerting', 'Alert system disabled');
      return true;
    },
    
    exportMetrics: (timeRange) => {
      try {
        const { metrics } = get();
        let exportData = metrics;
        
        if (timeRange) {
          const cutoff = Date.now() - timeRange;
          exportData = metrics.filter(m => m.timestamp >= cutoff);
        }
        
        const data = JSON.stringify(exportData, null, 2);
        get().debug.log('info', 'collection', `Exported ${exportData.length} metrics`);
        return { success: true, data };
      } catch (error) {
        get().debug.log('error', 'collection', 'Failed to export metrics', error);
        return { success: false, error: (error as Error).message };
      }
    },
    
    importMetrics: async (data) => {
      try {
        const metrics = JSON.parse(data) as MetricData[];
        const imported: string[] = [];
        const errors: string[] = [];
        
        for (const metric of metrics) {
          try {
            const id = await get().addMetric(metric);
            imported.push(id);
          } catch (error) {
            errors.push(`Failed to import metric ${metric.name}: ${(error as Error).message}`);
          }
        }
        
        get().debug.log('info', 'collection', `Imported ${imported.length} metrics with ${errors.length} errors`);
        return { success: true, imported: imported.length, errors };
      } catch (error) {
        get().debug.log('error', 'collection', 'Failed to import metrics', error);
        return { success: false, imported: 0, errors: [(error as Error).message] };
      }
    },
    
    resetSystem: async () => {
      set({
        metrics: [],
        alerts: [],
        dashboards: [],
        aggregations: [],
        events: [],
        debugLogs: [],
        stats: {
          totalMetrics: 0,
          metricsPerSecond: 0,
          activeAlerts: 0,
          totalAlerts: 0,
          dashboards: 0,
          widgets: 0,
          dataPoints: 0,
          storageUsed: 0,
          avgResponseTime: 0,
          uptime: 0,
          errorRate: 0
        },
        lastError: null
      });
      
      get().debug.log('info', 'collection', 'System reset completed');
      return true;
    },
    
    generateReport: async (timeRange) => {
      try {
        const { metrics, alerts, stats } = get();
        const cutoff = Date.now() - timeRange;
        const filteredMetrics = metrics.filter(m => m.timestamp >= cutoff);
        
        const report = {
          period: {
            start: new Date(cutoff).toISOString(),
            end: new Date().toISOString(),
            duration: timeRange
          },
          summary: {
            totalMetrics: filteredMetrics.length,
            categories: groupBy(filteredMetrics, 'category'),
            avgValue: filteredMetrics.reduce((sum, m) => sum + m.value, 0) / filteredMetrics.length || 0
          },
          alerts: {
            total: alerts.length,
            active: alerts.filter(a => a.isActive).length,
            triggered: alerts.filter(a => a.triggeredAt && a.triggeredAt >= cutoff).length
          },
          performance: stats,
          generatedAt: new Date().toISOString()
        };
        
        get().debug.log('info', 'collection', 'Report generated successfully');
        return { success: true, report };
      } catch (error) {
        get().debug.log('error', 'collection', 'Failed to generate report', error);
        return { success: false, error: (error as Error).message };
      }
    }
  },
  
  // Advanced features (placeholder implementations)
  advanced: {
    predictiveAnalysis: async (metricId, horizon) => {
      // Placeholder for ML-based prediction
      const predictions = Array.from({ length: horizon }, (_, i) => Math.random() * 100);
      return { predictions, confidence: 0.85 };
    },
    
    anomalyDetection: async (metricId, sensitivity) => {
      // Placeholder for anomaly detection
      const anomalies = [Date.now() - 3600000, Date.now() - 1800000];
      return { anomalies, score: 0.92 };
    },
    
    correlationAnalysis: async (metricIds) => {
      // Placeholder for correlation analysis
      const correlations: Record<string, number> = {};
      metricIds.forEach((id, i) => {
        metricIds.forEach((otherId, j) => {
          if (i !== j) {
            correlations[`${id}-${otherId}`] = Math.random() * 2 - 1; // -1 to 1
          }
        });
      });
      return { correlations };
    },
    
    performanceOptimization: async () => {
      const optimizations = [
        'Enable data compression',
        'Increase aggregation intervals',
        'Optimize alert conditions',
        'Clean up old metrics'
      ];
      return { optimizations, impact: 25 };
    },
    
    autoScaling: async (metricId, config) => {
      get().debug.log('info', 'collection', `Auto-scaling configured for metric ${metricId}`, config);
      return true;
    },
    
    customQuery: async (query) => {
      const startTime = Date.now();
      // Placeholder for custom query execution
      const results = [{ query, timestamp: Date.now() }];
      const executionTime = Date.now() - startTime;
      return { results, executionTime };
    }
  },
  
  // System operations (placeholder implementations)
  system: {
    initialize: async () => {
      get().debug.log('info', 'collection', 'System initialized');
      return true;
    },
    
    shutdown: async () => {
      set({ isCollecting: false, isAlerting: false });
      get().debug.log('info', 'collection', 'System shutdown');
      return true;
    },
    
    backup: async () => {
      const data = JSON.stringify(get());
      const size = new Blob([data]).size;
      return { success: true, size, location: 'local-storage' };
    },
    
    restore: async (backup) => {
      try {
        const data = JSON.parse(backup);
        set(data);
        return { success: true, restored: data.metrics?.length || 0 };
      } catch (error) {
        return { success: false, restored: 0 };
      }
    },
    
    optimize: async () => {
      const oldCount = get().metrics.length;
      await get().clearOldMetrics();
      const newCount = get().metrics.length;
      const optimized = oldCount - newCount;
      const spaceSaved = optimized * 100; // Estimated bytes
      return { optimized, spaceSaved };
    },
    
    healthCheck: async () => {
      const issues: string[] = [];
      const { stats, config } = get();
      
      if (stats.errorRate > 0.05) issues.push('High error rate detected');
      if (stats.avgResponseTime > 1000) issues.push('High response time');
      if (stats.storageUsed > config.compressionThreshold) issues.push('Storage usage high');
      
      return { healthy: issues.length === 0, issues };
    }
  },
  
  // Utilities
  utils: {
    formatMetricValue: (value, unit) => {
      if (unit === 'bytes') {
        return formatBytes(value);
      } else if (unit === 'ms') {
        return formatDuration(value);
      } else if (unit === '%') {
        return `${value.toFixed(1)}%`;
      }
      return `${value.toFixed(2)} ${unit}`;
    },
    
    calculateTrend: (values) => {
      if (values.length < 2) return { direction: 'stable', percentage: 0 };
      
      const first = values[0];
      const last = values[values.length - 1];
      const percentage = ((last - first) / first) * 100;
      
      if (Math.abs(percentage) < 1) {
        return { direction: 'stable', percentage: 0 };
      }
      
      return {
        direction: percentage > 0 ? 'up' : 'down',
        percentage: Math.abs(percentage)
      };
    },
    
    getMetricColor: (value, thresholds) => {
      if (!thresholds) return 'text-blue-600';
      
      if (value >= thresholds.critical) return 'text-red-600';
      if (value >= thresholds.warning) return 'text-yellow-600';
      return 'text-green-600';
    },
    
    validateMetric: (metric) => {
      const errors: string[] = [];
      
      if (!metric.name) errors.push('Name is required');
      if (typeof metric.value !== 'number') errors.push('Value must be a number');
      if (!metric.unit) errors.push('Unit is required');
      if (!metric.category) errors.push('Category is required');
      
      return { valid: errors.length === 0, errors };
    },
    
    generateMetricId: () => generateId(),
    
    compressData: (data) => {
      const json = JSON.stringify(data);
      // Placeholder compression
      const compressed = btoa(json);
      const ratio = compressed.length / json.length;
      return { compressed, ratio };
    },
    
    decompressData: (compressed) => {
      try {
        const json = atob(compressed);
        return JSON.parse(json);
      } catch {
        return [];
      }
    }
  },
  
  // Configuration
  config: {
    updateConfig: async (updates) => {
      set((state) => ({
        config: { ...state.config, ...updates }
      }));
      get().debug.log('info', 'collection', 'Configuration updated', updates);
      return true;
    },
    
    resetConfig: async () => {
      set((state) => ({
        config: {
          retentionPeriod: 7 * 24 * 60 * 60 * 1000,
          aggregationIntervals: [60000, 300000, 3600000],
          alertCheckInterval: 10000,
          maxMetricsPerSecond: 1000,
          enableAutoAggregation: true,
          enableRealTimeAlerts: true,
          enableDataCompression: true,
          compressionThreshold: 10000
        }
      }));
      get().debug.log('info', 'collection', 'Configuration reset to defaults');
      return true;
    },
    
    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },
    
    importConfig: async (config) => {
      try {
        const parsed = JSON.parse(config);
        await get().config.updateConfig(parsed);
        return true;
      } catch (error) {
        get().debug.log('error', 'collection', 'Failed to import configuration', error);
        return false;
      }
    }
  },
  
  // Analytics (placeholder implementations)
  analytics: {
    getUsageStats: async () => {
      return {
        dailyMetrics: 1000,
        weeklyMetrics: 7000,
        monthlyMetrics: 30000,
        topCategories: 5
      };
    },
    
    getPerformanceMetrics: async () => {
      return {
        avgCollectionTime: 50,
        avgQueryTime: 25,
        cacheHitRate: 0.85,
        throughput: 100
      };
    },
    
    getErrorAnalysis: async () => {
      return {
        errors: [],
        patterns: ['Network timeouts', 'Invalid data format']
      };
    },
    
    getTrendAnalysis: async (metricId, period) => {
      return {
        trend: 'increasing',
        forecast: [100, 105, 110, 115, 120]
      };
    }
  },
  
  // Debug
  debug: {
    log: (level, category, message, data) => {
      const log: MetricDebugLog = {
        id: generateId(),
        level,
        category,
        message,
        timestamp: Date.now(),
        data
      };
      
      set((state) => ({
        debugLogs: [...state.debugLogs.slice(-999), log] // Keep last 1000 logs
      }));
      
      if (level === 'error') {
        console.error(`[Metrics ${category}] ${message}`, data);
      } else if (level === 'warn') {
        console.warn(`[Metrics ${category}] ${message}`, data);
      } else {
      }
    },
    
    getLogs: (level, category) => {
      let logs = get().debugLogs;
      
      if (level) {
        logs = logs.filter(log => log.level === level);
      }
      
      if (category) {
        logs = logs.filter(log => log.category === category);
      }
      
      return logs;
    },
    
    clearLogs: () => {
      set({ debugLogs: [] });
    },
    
    exportLogs: () => {
      return JSON.stringify(get().debugLogs, null, 2);
    },
    
    enableDebugMode: () => {
    },
    
    disableDebugMode: () => {
    }
  }
})));

// Update computed values when state changes
useMetricStore.subscribe(
  (state) => state,
  (state) => {
    const now = Date.now();
    const recentCutoff = now - 300000; // 5 minutes
    
    const computed = {
      recentMetrics: state.metrics.filter(m => m.timestamp >= recentCutoff),
      activeAlerts: state.alerts.filter(a => a.isActive),
      criticalAlerts: state.alerts.filter(a => a.isActive && a.severity === 'critical'),
      systemHealth: calculateSystemHealth(state),
      performanceScore: calculatePerformanceScore(state),
      alertRate: state.stats.activeAlerts / Math.max(state.stats.totalAlerts, 1),
      dataGrowthRate: calculateDataGrowthRate(state)
    };
    
    useMetricStore.setState({ computed });
  }
);

// Manager class
export class RealTimeMetricsManager {
  private static instance: RealTimeMetricsManager;
  private intervalId: NodeJS.Timeout | null = null;
  private alertIntervalId: NodeJS.Timeout | null = null;
  
  static getInstance(): RealTimeMetricsManager {
    if (!RealTimeMetricsManager.instance) {
      RealTimeMetricsManager.instance = new RealTimeMetricsManager();
    }
    return RealTimeMetricsManager.instance;
  }
  
  async start(): Promise<void> {
    const store = useMetricStore.getState();
    
    // Start metric collection
    await store.quickActions.startCollection();
    
    // Start alert checking
    if (store.config.enableRealTimeAlerts) {
      await store.quickActions.enableAlerts();
      this.startAlertChecking();
    }
    
    // Start auto-aggregation
    if (store.config.enableAutoAggregation) {
      this.startAutoAggregation();
    }
    
    store.debug.log('info', 'collection', 'Real-time metrics manager started');
  }
  
  async stop(): Promise<void> {
    const store = useMetricStore.getState();
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId);
      this.alertIntervalId = null;
    }
    
    await store.quickActions.stopCollection();
    await store.quickActions.disableAlerts();
    
    store.debug.log('info', 'collection', 'Real-time metrics manager stopped');
  }
  
  private startAlertChecking(): void {
    const store = useMetricStore.getState();
    
    this.alertIntervalId = setInterval(async () => {
      if (store.isAlerting) {
        await store.checkAlerts();
      }
    }, store.config.alertCheckInterval);
  }
  
  private startAutoAggregation(): void {
    const store = useMetricStore.getState();
    
    this.intervalId = setInterval(async () => {
      if (store.isCollecting) {
        await store.processAggregations();
      }
    }, 60000); // Every minute
  }
}

// Global instance
export const metricsManager = RealTimeMetricsManager.getInstance();

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function groupBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = (groups[group] || 0) + 1;
    return groups;
  }, {} as Record<string, number>);
}

function calculateSystemHealth(state: MetricState): number {
  const { stats } = state;
  let health = 100;
  
  // Reduce health based on error rate
  health -= stats.errorRate * 100;
  
  // Reduce health based on response time
  if (stats.avgResponseTime > 1000) {
    health -= Math.min(50, (stats.avgResponseTime - 1000) / 100);
  }
  
  // Reduce health based on active alerts
  if (stats.totalAlerts > 0) {
    health -= (stats.activeAlerts / stats.totalAlerts) * 30;
  }
  
  return Math.max(0, Math.min(100, health));
}

function calculatePerformanceScore(state: MetricState): number {
  const { stats } = state;
  let score = 100;
  
  // Factor in response time
  if (stats.avgResponseTime > 500) {
    score -= Math.min(40, (stats.avgResponseTime - 500) / 25);
  }
  
  // Factor in throughput
  if (stats.metricsPerSecond < 10) {
    score -= 20;
  }
  
  // Factor in error rate
  score -= stats.errorRate * 200;
  
  return Math.max(0, Math.min(100, score));
}

function calculateDataGrowthRate(state: MetricState): number {
  // Simplified calculation - in real implementation, this would track historical data
  return state.stats.metricsPerSecond * 3600; // Metrics per hour
}

// Color and icon utilities
export function getMetricCategoryColor(category: MetricData['category']): string {
  switch (category) {
    case 'performance': return 'text-blue-600';
    case 'user': return 'text-green-600';
    case 'system': return 'text-purple-600';
    case 'business': return 'text-orange-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getAlertSeverityColor(severity: MetricAlert['severity']): string {
  switch (severity) {
    case 'low': return 'text-blue-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getWidgetTypeIcon(type: DashboardWidget['type']): string {
  switch (type) {
    case 'line-chart': return '📈';
    case 'bar-chart': return '📊';
    case 'gauge': return '⏱️';
    case 'counter': return '🔢';
    case 'table': return '📋';
    case 'heatmap': return '🔥';
    case 'pie-chart': return '🥧';
    default: return '📊';
  }
}