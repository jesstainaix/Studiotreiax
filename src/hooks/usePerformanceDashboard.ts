import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  usePerformanceDashboardStore,
  PerformanceMetric,
  SystemResource,
  PerformanceAlert,
  DashboardWidget,
  PerformanceReport,
  MonitoringConfig,
  PredictiveAnalysis,
  AnomalyDetection
} from '../services/performanceDashboardService';

// Utility functions for throttling and debouncing
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Progress tracking hook
export const useProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
    setIsComplete(value >= 100);
  }, []);
  
  const reset = useCallback(() => {
    setProgress(0);
    setIsComplete(false);
  }, []);
  
  return { progress, isComplete, updateProgress, reset };
};

// Main Performance Dashboard Hook
export const usePerformanceDashboard = () => {
  const store = usePerformanceDashboardStore();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      store.refreshDashboard();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, store]);
  
  // Initialize dashboard on mount
  useEffect(() => {
    store.refreshDashboard();
  }, [store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Metric actions
    addMetric: store.addMetric,
    updateMetric: store.updateMetric,
    removeMetric: store.removeMetric,
    getMetricHistory: store.getMetricHistory,
    
    // Alert actions
    acknowledgeAlert: store.acknowledgeAlert,
    resolveAlert: store.resolveAlert,
    createAlert: store.createAlert,
    executeAlertAction: store.executeAlertAction,
    
    // Widget actions
    addWidget: store.addWidget,
    updateWidget: store.updateWidget,
    removeWidget: store.removeWidget,
    updateWidgetPosition: store.updateWidgetPosition,
    
    // Report actions
    generateReport: store.generateReport,
    scheduleReport: store.scheduleReport,
    exportReport: store.exportReport,
    
    // Configuration
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    
    // Analysis
    runPredictiveAnalysis: store.runPredictiveAnalysis,
    detectAnomalies: store.detectAnomalies,
    getPerformanceInsights: store.getPerformanceInsights,
    
    // Optimization
    optimizeSystem: store.optimizeSystem,
    autoTuneThresholds: store.autoTuneThresholds,
    cleanupOldData: store.cleanupOldData,
    
    // Quick actions
    ...store.quickActions
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    refreshNow: async () => {
      try {
        await store.refreshDashboard();
      } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
      }
    },
    
    toggleAutoRefresh: () => {
      setAutoRefreshEnabled(prev => !prev);
    },
    
    setRefreshRate: (rate: number) => {
      setRefreshInterval(rate);
    },
    
    acknowledgeAllAlerts: async () => {
      try {
        const alerts = store.alerts.filter(alert => !alert.acknowledged);
        await Promise.all(alerts.map(alert => store.acknowledgeAlert(alert.id)));
      } catch (error) {
        console.error('Erro ao reconhecer alertas:', error);
      }
    },
    
    generateQuickReport: async () => {
      try {
        return await store.generateReport({
          name: `Relatório Rápido - ${new Date().toLocaleDateString()}`,
          type: 'daily',
          metrics: store.metrics.map(m => m.id)
        });
      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        return null;
      }
    }
  }), [store, setAutoRefreshEnabled, setRefreshInterval]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    updateMetric: throttle(store.updateMetric, 1000),
    updateWidget: throttle(store.updateWidget, 500),
    updateConfig: throttle(store.updateConfig, 2000)
  }), [store]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    searchMetrics: debounce(store.searchMetrics, 300),
    filterAlerts: debounce(store.filterAlerts, 300)
  }), [store]);
  
  // Enhanced computed values
  const computed = useMemo(() => ({
    // System overview with additional calculations
    systemOverview: {
      ...store.systemOverview,
      healthScore: store.healthScore,
      criticalIssues: store.criticalAlerts.length,
      totalIssues: store.alerts.length,
      uptime: store.stats.uptime,
      lastUpdate: store.lastRefresh
    },
    
    // Performance trends with analysis
    performanceTrends: {
      ...store.performanceTrends,
      overallTrend: calculateOverallTrend(store.metrics),
      criticalMetrics: store.metrics.filter(m => 
        m.threshold && m.value >= m.threshold.critical
      ),
      improvingMetrics: store.metrics.filter(m => m.trend === 'down' && m.change < 0)
    },
    
    // Alert summary
    alertSummary: {
      total: store.alerts.length,
      critical: store.alerts.filter(a => a.type === 'critical').length,
      warning: store.alerts.filter(a => a.type === 'warning').length,
      info: store.alerts.filter(a => a.type === 'info').length,
      acknowledged: store.alerts.filter(a => a.acknowledged).length,
      unacknowledged: store.alerts.filter(a => !a.acknowledged).length
    },
    
    // Resource utilization
    resourceUtilization: store.resources.reduce((acc, resource) => {
      acc[resource.type] = {
        usage: resource.usage,
        available: resource.available,
        total: resource.total,
        status: getResourceStatus(resource.usage),
        trend: calculateResourceTrend(resource.history)
      };
      return acc;
    }, {} as Record<string, any>)
  }), [store]);
  
  // Filtered data
  const filtered = useMemo(() => ({
    criticalAlerts: store.alerts.filter(alert => alert.type === 'critical'),
    warningAlerts: store.alerts.filter(alert => alert.type === 'warning'),
    unacknowledgedAlerts: store.alerts.filter(alert => !alert.acknowledged),
    recentMetrics: store.metrics.filter(metric => 
      Date.now() - metric.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    ),
    highUsageResources: store.resources.filter(resource => resource.usage > 80),
    activeWidgets: store.widgets.filter(widget => widget.visible)
  }), [store]);
  
  return {
    // State
    ...store,
    autoRefreshEnabled,
    refreshInterval,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Computed
    computed,
    filtered,
    
    // Control
    setAutoRefreshEnabled,
    setRefreshInterval
  };
};

// Specialized hooks
export const usePerformanceStats = () => {
  const { stats, computed, healthScore } = usePerformanceDashboard();
  
  return {
    stats,
    healthScore,
    systemOverview: computed.systemOverview,
    alertSummary: computed.alertSummary,
    resourceUtilization: computed.resourceUtilization
  };
};

export const usePerformanceConfig = () => {
  const { config, actions } = usePerformanceDashboard();
  
  return {
    config,
    updateConfig: actions.updateConfig,
    resetConfig: actions.resetConfig,
    autoTuneThresholds: actions.autoTuneThresholds
  };
};

export const usePerformanceSearch = () => {
  const { debouncedActions } = usePerformanceDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PerformanceMetric[]>([]);
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = debouncedActions.searchMetrics(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedActions]);
  
  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch: () => {
      setSearchQuery('');
      setSearchResults([]);
    }
  };
};

export const usePerformanceMetrics = () => {
  const { metrics, actions, filtered } = usePerformanceDashboard();
  
  return {
    metrics,
    recentMetrics: filtered.recentMetrics,
    addMetric: actions.addMetric,
    updateMetric: actions.updateMetric,
    removeMetric: actions.removeMetric,
    getMetricHistory: actions.getMetricHistory
  };
};

export const usePerformanceAlerts = () => {
  const { alerts, actions, filtered } = usePerformanceDashboard();
  
  return {
    alerts,
    criticalAlerts: filtered.criticalAlerts,
    warningAlerts: filtered.warningAlerts,
    unacknowledgedAlerts: filtered.unacknowledgedAlerts,
    acknowledgeAlert: actions.acknowledgeAlert,
    resolveAlert: actions.resolveAlert,
    createAlert: actions.createAlert,
    executeAlertAction: actions.executeAlertAction
  };
};

export const usePerformanceWidgets = () => {
  const { widgets, actions, filtered } = usePerformanceDashboard();
  
  return {
    widgets,
    activeWidgets: filtered.activeWidgets,
    addWidget: actions.addWidget,
    updateWidget: actions.updateWidget,
    removeWidget: actions.removeWidget,
    updateWidgetPosition: actions.updateWidgetPosition
  };
};

export const usePerformanceReports = () => {
  const { reports, actions } = usePerformanceDashboard();
  
  return {
    reports,
    generateReport: actions.generateReport,
    scheduleReport: actions.scheduleReport,
    exportReport: actions.exportReport
  };
};

export const usePerformanceAnalysis = () => {
  const { predictions, anomalies, actions } = usePerformanceDashboard();
  
  return {
    predictions,
    anomalies,
    runPredictiveAnalysis: actions.runPredictiveAnalysis,
    detectAnomalies: actions.detectAnomalies,
    getPerformanceInsights: actions.getPerformanceInsights
  };
};

export const usePerformanceOptimization = () => {
  const { actions } = usePerformanceDashboard();
  
  return {
    optimizeSystem: actions.optimizeSystem,
    autoTuneThresholds: actions.autoTuneThresholds,
    cleanupOldData: actions.cleanupOldData,
    enableAutoOptimization: actions.enableAutoOptimization,
    disableAutoOptimization: actions.disableAutoOptimization
  };
};

export const useRealTimeMonitoring = () => {
  const { 
    autoRefreshEnabled, 
    refreshInterval, 
    setAutoRefreshEnabled, 
    setRefreshInterval,
    lastRefresh,
    isLoading
  } = usePerformanceDashboard();
  
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  // Simulate connection monitoring
  useEffect(() => {
    const checkConnection = () => {
      if (isLoading) {
        setConnectionStatus('reconnecting');
      } else {
        setConnectionStatus('connected');
      }
    };
    
    checkConnection();
  }, [isLoading]);
  
  return {
    autoRefreshEnabled,
    refreshInterval,
    lastRefresh,
    connectionStatus,
    setAutoRefreshEnabled,
    setRefreshInterval,
    isRealTime: autoRefreshEnabled && connectionStatus === 'connected'
  };
};

// Utility hooks
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
) => {
  return useMemo(() => throttle(func, limit), [func, limit]);
};

export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
) => {
  return useMemo(() => debounce(func, delay), [func, delay]);
};

// Helper functions
const calculateOverallTrend = (metrics: PerformanceMetric[]): 'improving' | 'degrading' | 'stable' => {
  if (metrics.length === 0) return 'stable';
  
  const improvingCount = metrics.filter(m => m.trend === 'down' && m.change < 0).length;
  const degradingCount = metrics.filter(m => m.trend === 'up' && m.change > 0).length;
  
  if (improvingCount > degradingCount) return 'improving';
  if (degradingCount > improvingCount) return 'degrading';
  return 'stable';
};

const getResourceStatus = (usage: number): 'normal' | 'warning' | 'critical' => {
  if (usage >= 90) return 'critical';
  if (usage >= 70) return 'warning';
  return 'normal';
};

const calculateResourceTrend = (history: { timestamp: Date; value: number }[]): 'up' | 'down' | 'stable' => {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(-5);
  const avg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
  const latest = recent[recent.length - 1].value;
  
  const change = ((latest - avg) / avg) * 100;
  
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

const calculateDashboardComplexity = (
  metrics: PerformanceMetric[],
  widgets: DashboardWidget[],
  alerts: PerformanceAlert[]
): 'simple' | 'moderate' | 'complex' => {
  const totalItems = metrics.length + widgets.length + alerts.length;
  
  if (totalItems > 50) return 'complex';
  if (totalItems > 20) return 'moderate';
  return 'simple';
};

// Export default hook
export default usePerformanceDashboard;