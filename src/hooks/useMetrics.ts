import { useEffect, useCallback, useMemo } from 'react';
import { useMetricsStore, Metric, Alert, Dashboard, AnalyticsEvent, MetricsConfig, MetricsStats } from '../utils/metricsManager';

// Types
export interface UseMetricsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAutoCollection?: boolean;
  trackPageViews?: boolean;
  trackUserInteractions?: boolean;
}

export interface UseMetricsReturn {
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
  
  // Actions
  // Metrics
  createMetric: (metric: Omit<Metric, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMetric: (id: string, updates: Partial<Metric>) => void;
  deleteMetric: (id: string) => void;
  recordValue: (metricId: string, value: number, metadata?: Record<string, any>) => void;
  getHistory: (metricId: string, timeRange: string) => any[];
  
  // Alerts
  createAlert: (alert: Omit<Alert, 'id' | 'triggeredAt'>) => void;
  acknowledgeAlert: (id: string, user: string) => void;
  resolveAlert: (id: string, user: string) => void;
  
  // Dashboards
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  
  // Analytics
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void;
  trackPageView: (page: string, userId?: string) => void;
  trackInteraction: (action: string, element: string, userId?: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, context?: Record<string, any>) => void;
  
  // Collection
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
  
  // System
  refreshStats: () => void;
  runDiagnostics: () => Promise<any>;
  optimizeStorage: () => void;
  
  // Utilities
  formatValue: (value: number, unit: string) => string;
  formatBytes: (bytes: number) => string;
  formatDuration: (ms: number) => string;
  getMetricColor: (metric: Metric) => string;
  getAlertIcon: (type: Alert['type']) => string;
  getTrendIcon: (trend: Metric['trend']) => string;
  
  // Quick Actions
  quickActions: {
    createPerformanceMetrics: () => void;
    createUsageMetrics: () => void;
    createErrorMetrics: () => void;
    createBusinessMetrics: () => void;
    setupDefaultDashboard: () => void;
    enableAllAlerts: () => void;
    optimizeAll: () => void;
  };
  
  // Advanced Features
  advanced: {
    bulkImport: (metrics: Partial<Metric>[]) => void;
    bulkExport: (metricIds: string[]) => Promise<Blob>;
    createCustomAlert: (metricId: string, conditions: any) => void;
    scheduleReport: (dashboardId: string, schedule: any) => void;
    enableRealTimeSync: () => void;
    disableRealTimeSync: () => void;
  };
  
  // Computed Values
  computed: {
    activeMetricsCount: number;
    criticalAlertsCount: number;
    totalDataPoints: number;
    averageResponseTime: number;
    errorRate: number;
    topMetrics: Metric[];
    recentAlerts: Alert[];
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
}

// Throttle utility
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Main hook
export const useMetrics = (options: UseMetricsOptions = {}): UseMetricsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableAutoCollection = true,
    trackPageViews = true,
    trackUserInteractions = true
  } = options;
  
  // Store state
  const {
    metrics,
    alerts,
    dashboards,
    events,
    config,
    stats,
    isCollecting,
    isLoading,
    error,
    
    // Actions
    createMetric,
    updateMetric,
    deleteMetric,
    recordMetricValue,
    getMetricHistory,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    trackEvent,
    trackPageView,
    trackUserInteraction,
    trackError,
    trackPerformance,
    startCollection,
    stopCollection,
    pauseCollection,
    resumeCollection,
    updateConfig,
    resetConfig,
    exportData,
    importData,
    clearData,
    refreshStats,
    runDiagnostics,
    optimizeStorage
  } = useMetricsStore();
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshStats]);
  
  // Auto collection effect
  useEffect(() => {
    if (enableAutoCollection && !isCollecting) {
      startCollection();
    }
  }, [enableAutoCollection, isCollecting, startCollection]);
  
  // Page view tracking effect
  useEffect(() => {
    if (trackPageViews) {
      trackPageView(window.location.pathname);
    }
  }, [trackPageViews, trackPageView]);
  
  // User interaction tracking effect
  useEffect(() => {
    if (!trackUserInteractions) return;
    
    const handleClick = throttle((event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const element = target.tagName.toLowerCase();
      const id = target.id || target.className || 'unknown';
      trackUserInteraction('click', `${element}#${id}`);
    }, 1000);
    
    const handleKeydown = throttle((event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        trackUserInteraction('keyboard_shortcut', `${event.key}`);
      }
    }, 1000);
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [trackUserInteractions, trackUserInteraction]);
  
  // Utility functions
  const formatValue = useCallback((value: number, unit: string): string => {
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
  }, []);
  
  const formatBytesUtil = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);
  
  const formatDuration = useCallback((ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }, []);
  
  const getMetricColor = useCallback((metric: Metric): string => {
    if (!metric.threshold) return 'text-blue-500';
    
    const { warning, critical } = metric.threshold;
    const value = metric.currentValue;
    
    if (value >= critical) return 'text-red-500';
    if (value >= warning) return 'text-yellow-500';
    return 'text-green-500';
  }, []);
  
  const getAlertIcon = useCallback((type: Alert['type']): string => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  }, []);
  
  const getTrendIcon = useCallback((trend: Metric['trend']): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  }, []);
  
  // Quick actions
  const quickActions = useMemo(() => ({
    createPerformanceMetrics: () => {
      const performanceMetrics = [
        {
          name: 'Page Load Time',
          category: 'performance' as const,
          type: 'timer' as const,
          unit: 'ms',
          description: 'Time taken to load the page',
          threshold: { warning: 3000, critical: 5000 },
          tags: ['performance', 'web-vitals'],
          isActive: true
        },
        {
          name: 'Memory Usage',
          category: 'performance' as const,
          type: 'gauge' as const,
          unit: 'bytes',
          description: 'Current memory usage',
          threshold: { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 },
          tags: ['performance', 'memory'],
          isActive: true
        },
        {
          name: 'FPS',
          category: 'performance' as const,
          type: 'gauge' as const,
          unit: 'fps',
          description: 'Frames per second',
          threshold: { warning: 30, critical: 15 },
          tags: ['performance', 'rendering'],
          isActive: true
        }
      ];
      
      performanceMetrics.forEach(metric => createMetric(metric));
    },
    
    createUsageMetrics: () => {
      const usageMetrics = [
        {
          name: 'Active Users',
          category: 'usage' as const,
          type: 'gauge' as const,
          unit: 'count',
          description: 'Number of active users',
          tags: ['usage', 'users'],
          isActive: true
        },
        {
          name: 'Page Views',
          category: 'usage' as const,
          type: 'counter' as const,
          unit: 'count',
          description: 'Total page views',
          tags: ['usage', 'navigation'],
          isActive: true
        },
        {
          name: 'Session Duration',
          category: 'usage' as const,
          type: 'timer' as const,
          unit: 'ms',
          description: 'Average session duration',
          tags: ['usage', 'engagement'],
          isActive: true
        }
      ];
      
      usageMetrics.forEach(metric => createMetric(metric));
    },
    
    createErrorMetrics: () => {
      const errorMetrics = [
        {
          name: 'Error Rate',
          category: 'error' as const,
          type: 'gauge' as const,
          unit: '%',
          description: 'Percentage of requests resulting in errors',
          threshold: { warning: 1, critical: 5 },
          tags: ['error', 'reliability'],
          isActive: true
        },
        {
          name: 'JavaScript Errors',
          category: 'error' as const,
          type: 'counter' as const,
          unit: 'count',
          description: 'Number of JavaScript errors',
          threshold: { warning: 10, critical: 50 },
          tags: ['error', 'javascript'],
          isActive: true
        }
      ];
      
      errorMetrics.forEach(metric => createMetric(metric));
    },
    
    createBusinessMetrics: () => {
      const businessMetrics = [
        {
          name: 'Conversion Rate',
          category: 'business' as const,
          type: 'gauge' as const,
          unit: '%',
          description: 'Conversion rate percentage',
          tags: ['business', 'conversion'],
          isActive: true
        },
        {
          name: 'Revenue',
          category: 'business' as const,
          type: 'counter' as const,
          unit: 'currency',
          description: 'Total revenue',
          tags: ['business', 'revenue'],
          isActive: true
        }
      ];
      
      businessMetrics.forEach(metric => createMetric(metric));
    },
    
    setupDefaultDashboard: () => {
      createDashboard({
        name: 'System Overview',
        description: 'Main dashboard with key metrics',
        layout: [
          {
            id: 'widget-1',
            type: 'chart',
            title: 'Performance Metrics',
            position: { x: 0, y: 0, w: 6, h: 4 },
            config: {
              metricIds: [],
              chartType: 'line',
              timeRange: '24h'
            }
          },
          {
            id: 'widget-2',
            type: 'stat',
            title: 'Active Alerts',
            position: { x: 6, y: 0, w: 3, h: 2 },
            config: {
              metricIds: []
            }
          }
        ],
        filters: [],
        refreshInterval: 30000,
        isPublic: false,
        createdBy: 'system'
      });
    },
    
    enableAllAlerts: () => {
      updateConfig({
        alerts: {
          ...config.alerts,
          enabled: true,
          channels: ['email', 'slack']
        }
      });
    },
    
    optimizeAll: () => {
      optimizeStorage();
      refreshStats();
    }
  }), [createMetric, createDashboard, updateConfig, config.alerts, optimizeStorage, refreshStats]);
  
  // Advanced features
  const advanced = useMemo(() => ({
    bulkImport: (metricsData: Partial<Metric>[]) => {
      metricsData.forEach(metricData => {
        if (metricData.name && metricData.category && metricData.type && metricData.unit) {
          createMetric(metricData as Omit<Metric, 'id' | 'createdAt' | 'updatedAt'>);
        }
      });
    },
    
    bulkExport: async (metricIds: string[]) => {
      const selectedMetrics = metrics.filter(m => metricIds.includes(m.id));
      const data = { metrics: selectedMetrics };
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    },
    
    createCustomAlert: (metricId: string, conditions: any) => {
      const metric = metrics.find(m => m.id === metricId);
      if (metric) {
        createAlert({
          metricId,
          type: 'warning',
          title: `Custom Alert: ${metric.name}`,
          message: `Custom conditions met for ${metric.name}`,
          severity: 'medium',
          status: 'active',
          metadata: { conditions }
        });
      }
    },
    
    scheduleReport: (dashboardId: string, schedule: any) => {
      // Implementation for scheduled reports
    },
    
    enableRealTimeSync: () => {
      updateConfig({
        dashboard: {
          ...config.dashboard,
          enableRealTime: true
        }
      });
    },
    
    disableRealTimeSync: () => {
      updateConfig({
        dashboard: {
          ...config.dashboard,
          enableRealTime: false
        }
      });
    }
  }), [metrics, createMetric, createAlert, updateConfig, config.dashboard]);
  
  // Computed values
  const computed = useMemo(() => {
    const activeMetricsCount = metrics.filter(m => m.isActive).length;
    const criticalAlertsCount = alerts.filter(a => a.type === 'critical' && a.status === 'active').length;
    const totalDataPoints = metrics.reduce((sum, m) => sum + m.values.length, 0);
    
    // Calculate average response time
    const responseTimeMetric = metrics.find(m => m.name.toLowerCase().includes('response') || m.name.toLowerCase().includes('load'));
    const averageResponseTime = responseTimeMetric ? responseTimeMetric.currentValue : 0;
    
    // Calculate error rate
    const errorMetric = metrics.find(m => m.name.toLowerCase().includes('error') && m.unit === '%');
    const errorRate = errorMetric ? errorMetric.currentValue : 0;
    
    // Get top metrics (by activity)
    const topMetrics = metrics
      .filter(m => m.isActive)
      .sort((a, b) => b.values.length - a.values.length)
      .slice(0, 5);
    
    // Get recent alerts
    const recentAlerts = alerts
      .sort((a, b) => b.triggeredAt - a.triggeredAt)
      .slice(0, 10);
    
    // Calculate system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlertsCount > 0) {
      systemHealth = 'critical';
    } else if (alerts.filter(a => a.type === 'warning' && a.status === 'active').length > 0) {
      systemHealth = 'warning';
    }
    
    return {
      activeMetricsCount,
      criticalAlertsCount,
      totalDataPoints,
      averageResponseTime,
      errorRate,
      topMetrics,
      recentAlerts,
      systemHealth
    };
  }, [metrics, alerts]);
  
  return {
    // State
    metrics,
    alerts,
    dashboards,
    events,
    config,
    stats,
    isCollecting,
    isLoading,
    error,
    
    // Actions
    createMetric,
    updateMetric,
    deleteMetric,
    recordValue: recordMetricValue,
    getHistory: getMetricHistory,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    trackEvent,
    trackPageView,
    trackInteraction: trackUserInteraction,
    trackError,
    trackPerformance,
    startCollection,
    stopCollection,
    pauseCollection,
    resumeCollection,
    updateConfig,
    resetConfig,
    exportData,
    importData,
    clearData,
    refreshStats,
    runDiagnostics,
    optimizeStorage,
    
    // Utilities
    formatValue,
    formatBytes: formatBytesUtil,
    formatDuration,
    getMetricColor,
    getAlertIcon,
    getTrendIcon,
    
    // Quick Actions
    quickActions,
    
    // Advanced Features
    advanced,
    
    // Computed Values
    computed
  };
};

// Additional hooks for specific use cases
export const useMetricsOverview = () => {
  const { stats, computed, isCollecting } = useMetrics();
  
  return {
    stats,
    computed,
    isCollecting,
    isHealthy: computed.systemHealth === 'healthy'
  };
};

export const useAlerts = () => {
  const { alerts, acknowledgeAlert, resolveAlert, computed } = useMetrics();
  
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.type === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.type === 'warning');
  
  return {
    alerts,
    activeAlerts,
    criticalAlerts,
    warningAlerts,
    acknowledgeAlert,
    resolveAlert,
    hasActiveAlerts: activeAlerts.length > 0,
    hasCriticalAlerts: criticalAlerts.length > 0
  };
};

export const useMetricsCollection = () => {
  const {
    isCollecting,
    startCollection,
    stopCollection,
    pauseCollection,
    resumeCollection,
    config,
    updateConfig
  } = useMetrics();
  
  return {
    isCollecting,
    startCollection,
    stopCollection,
    pauseCollection,
    resumeCollection,
    config: config.collection,
    updateCollectionConfig: (updates: Partial<typeof config.collection>) => {
      updateConfig({ collection: { ...config.collection, ...updates } });
    }
  };
};

export const usePerformanceTracking = () => {
  const { trackPerformance, recordValue, metrics } = useMetrics();
  
  const trackPageLoad = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      trackPerformance('page_load_time', loadTime);
      recordValue('page-load-time', loadTime);
    }
  }, [trackPerformance, recordValue]);
  
  const trackMemoryUsage = useCallback(() => {
    if ((performance as any).memory) {
      const memoryUsage = (performance as any).memory.usedJSHeapSize;
      trackPerformance('memory_usage', memoryUsage);
      recordValue('memory-usage', memoryUsage);
    }
  }, [trackPerformance, recordValue]);
  
  const trackCustomMetric = useCallback((name: string, value: number, context?: Record<string, any>) => {
    trackPerformance(name, value, context);
    
    // Find or create metric
    const existingMetric = metrics.find(m => m.name.toLowerCase().replace(/\s+/g, '-') === name.toLowerCase());
    if (existingMetric) {
      recordValue(existingMetric.id, value, context);
    }
  }, [trackPerformance, recordValue, metrics]);
  
  return {
    trackPageLoad,
    trackMemoryUsage,
    trackCustomMetric
  };
};

export default useMetrics;