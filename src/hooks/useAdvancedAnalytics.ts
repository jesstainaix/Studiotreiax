import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useAdvancedAnalyticsStore,
  AnalyticsMetric,
  AnalyticsChart,
  AnalyticsDashboard,
  AnalyticsReport,
  AnalyticsAlert,
  AnalyticsSegment,
  AnalyticsFilter
} from '../services/advancedAnalyticsService';

// Main Hook
export const useAdvancedAnalytics = () => {
  const store = useAdvancedAnalyticsStore();
  
  // Auto-initialization effect
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await store.actions.refresh();
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        store.actions.setError('Falha ao inicializar analytics');
      }
    };
    
    initializeAnalytics();
  }, []);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!store.config.enableRealtime) return;
    
    const interval = setInterval(() => {
      store.actions.refresh();
    }, store.config.refreshInterval);
    
    return () => clearInterval(interval);
  }, [store.config.enableRealtime, store.config.refreshInterval]);
  
  // Memoized actions
  const memoizedActions = useMemo(() => ({
    // Metrics
    addMetric: store.actions.addMetric,
    updateMetric: store.actions.updateMetric,
    deleteMetric: store.actions.deleteMetric,
    refreshMetric: store.actions.refreshMetric,
    
    // Charts
    addChart: store.actions.addChart,
    updateChart: store.actions.updateChart,
    deleteChart: store.actions.deleteChart,
    refreshChart: store.actions.refreshChart,
    
    // Dashboards
    createDashboard: store.actions.createDashboard,
    updateDashboard: store.actions.updateDashboard,
    deleteDashboard: store.actions.deleteDashboard,
    duplicateDashboard: store.actions.duplicateDashboard,
    
    // Reports
    createReport: store.actions.createReport,
    updateReport: store.actions.updateReport,
    deleteReport: store.actions.deleteReport,
    generateReport: store.actions.generateReport,
    
    // Alerts
    createAlert: store.actions.createAlert,
    updateAlert: store.actions.updateAlert,
    deleteAlert: store.actions.deleteAlert,
    testAlert: store.actions.testAlert,
    
    // Segments
    createSegment: store.actions.createSegment,
    updateSegment: store.actions.updateSegment,
    deleteSegment: store.actions.deleteSegment,
    
    // Data operations
    refresh: store.actions.refresh,
    exportData: store.actions.exportData,
    importData: store.actions.importData,
    
    // Filters
    setSearchQuery: store.actions.setSearchQuery,
    addFilter: store.actions.addFilter,
    removeFilter: store.actions.removeFilter,
    clearFilters: store.actions.clearFilters,
    setTimeRange: store.actions.setTimeRange,
    
    // UI
    setCurrentDashboard: store.actions.setCurrentDashboard,
    setError: store.actions.setError,
    clearError: store.actions.clearError
  }), [store.actions]);
  
  // Quick actions with progress tracking
  const quickActions = useMemo(() => ({
    createKPIDashboard: useCallback(async () => {
      try {
        await store.quickActions.createKPIDashboard();
      } catch (error) {
        store.actions.setError('Falha ao criar dashboard KPI');
      }
    }, [store.quickActions.createKPIDashboard, store.actions.setError]),
    
    createPerformanceDashboard: useCallback(async () => {
      try {
        await store.quickActions.createPerformanceDashboard();
      } catch (error) {
        store.actions.setError('Falha ao criar dashboard de performance');
      }
    }, [store.quickActions.createPerformanceDashboard, store.actions.setError]),
    
    createEngagementDashboard: useCallback(async () => {
      try {
        await store.quickActions.createEngagementDashboard();
      } catch (error) {
        store.actions.setError('Falha ao criar dashboard de engajamento');
      }
    }, [store.quickActions.createEngagementDashboard, store.actions.setError]),
    
    setupBasicAlerts: useCallback(async () => {
      try {
        await store.quickActions.setupBasicAlerts();
      } catch (error) {
        store.actions.setError('Falha ao configurar alertas básicos');
      }
    }, [store.quickActions.setupBasicAlerts, store.actions.setError]),
    
    generateWeeklyReport: useCallback(async () => {
      try {
        await store.quickActions.generateWeeklyReport();
      } catch (error) {
        store.actions.setError('Falha ao gerar relatório semanal');
      }
    }, [store.quickActions.generateWeeklyReport, store.actions.setError]),
    
    analyzeUserBehavior: useCallback(async () => {
      try {
        await store.quickActions.analyzeUserBehavior();
      } catch (error) {
        store.actions.setError('Falha ao analisar comportamento do usuário');
      }
    }, [store.quickActions.analyzeUserBehavior, store.actions.setError])
  }), [store.quickActions, store.actions.setError]);
  
  // Throttled actions
  const throttledRefresh = useThrottledCallback(store.actions.refresh, 5000);
  const throttledSearch = useThrottledCallback(store.actions.setSearchQuery, 300);
  
  // Debounced actions
  const debouncedUpdateConfig = useDebouncedCallback(store.configuration.updateConfig, 1000);
  
  // Enhanced computed values
  const computedValues = useMemo(() => {
    const { metrics, charts, alerts, segments } = store;
    
    // Group metrics by category
    const metricsByCategory = metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, AnalyticsMetric[]>);
    
    // Group charts by category
    const chartsByCategory = charts.reduce((acc, chart) => {
      if (!acc[chart.category]) acc[chart.category] = [];
      acc[chart.category].push(chart);
      return acc;
    }, {} as Record<string, AnalyticsChart[]>);
    
    // Group alerts by status
    const alertsByStatus = alerts.reduce((acc, alert) => {
      const status = alert.isActive ? 'active' : 'inactive';
      if (!acc[status]) acc[status] = [];
      acc[status].push(alert);
      return acc;
    }, {} as Record<string, AnalyticsAlert[]>);
    
    // Calculate trends analysis
    const trendsAnalysis = metrics.reduce((acc, metric) => {
      acc[metric.trend]++;
      return acc;
    }, { improving: 0, declining: 0, stable: 0 } as { improving: number; declining: number; stable: number });
    
    // Calculate performance score
    const performanceScore = metrics.length > 0 
      ? metrics.reduce((sum, metric) => {
          if (metric.target) {
            return sum + Math.min((metric.value / metric.target) * 100, 100);
          }
          return sum + (metric.trend === 'up' ? 80 : metric.trend === 'down' ? 40 : 60);
        }, 0) / metrics.length
      : 0;
    
    // Determine health status
    const healthStatus = performanceScore >= 80 ? 'excellent' 
      : performanceScore >= 60 ? 'good'
      : performanceScore >= 40 ? 'warning'
      : 'critical';
    
    return {
      metricsByCategory,
      chartsByCategory,
      alertsByStatus,
      trendsAnalysis,
      performanceScore: Math.round(performanceScore),
      healthStatus,
      totalSegments: segments.length,
      activeAlertsCount: alerts.filter(a => a.isActive).length,
      realtimeChartsCount: charts.filter(c => c.isRealtime).length
    };
  }, [store.metrics, store.charts, store.alerts, store.segments]);
  
  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    const { searchQuery, activeFilters } = store;
    
    const filterBySearch = <T extends { name: string; description?: string }>(items: T[]) => {
      if (!searchQuery) return items;
      const query = searchQuery.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    };
    
    const filterByFilters = <T extends Record<string, any>>(items: T[]) => {
      if (activeFilters.length === 0) return items;
      return items.filter(item => {
        return activeFilters.every(filter => {
          const value = item[filter.field];
          switch (filter.operator) {
            case 'equals': return value === filter.value;
            case 'contains': return String(value).includes(filter.value);
            case 'startsWith': return String(value).startsWith(filter.value);
            case 'endsWith': return String(value).endsWith(filter.value);
            case 'between': return value >= filter.value[0] && value <= filter.value[1];
            case 'in': return filter.value.includes(value);
            default: return true;
          }
        });
      });
    };
    
    return {
      metrics: filterByFilters(filterBySearch(store.metrics)),
      charts: filterByFilters(filterBySearch(store.charts)),
      dashboards: filterByFilters(filterBySearch(store.dashboards)),
      reports: filterByFilters(filterBySearch(store.reports)),
      alerts: filterByFilters(filterBySearch(store.alerts)),
      segments: filterByFilters(filterBySearch(store.segments))
    };
  }, [store.metrics, store.charts, store.dashboards, store.reports, store.alerts, store.segments, store.searchQuery, store.activeFilters]);
  
  return {
    // State
    metrics: store.metrics,
    charts: store.charts,
    dashboards: store.dashboards,
    reports: store.reports,
    alerts: store.alerts,
    segments: store.segments,
    events: store.events,
    
    // UI State
    isLoading: store.isLoading,
    error: store.error,
    currentDashboard: store.currentDashboard,
    selectedTimeRange: store.selectedTimeRange,
    activeFilters: store.activeFilters,
    searchQuery: store.searchQuery,
    progress: store.progress,
    
    // Configuration
    config: store.config,
    stats: store.stats,
    
    // Computed values
    computedValues,
    
    // Filtered data
    filteredData,
    
    // Actions
    actions: memoizedActions,
    quickActions,
    advancedFeatures: store.advancedFeatures,
    systemOperations: store.systemOperations,
    utilities: store.utilities,
    configuration: store.configuration,
    analytics: store.analytics,
    
    // Throttled/Debounced actions
    throttledRefresh,
    throttledSearch,
    debouncedUpdateConfig
  };
};

// Specialized Hooks
export const useAnalyticsStats = () => {
  const { stats, computedValues } = useAdvancedAnalytics();
  
  return {
    stats,
    performanceScore: computedValues.performanceScore,
    healthStatus: computedValues.healthStatus,
    trendsAnalysis: computedValues.trendsAnalysis,
    activeAlertsCount: computedValues.activeAlertsCount,
    realtimeChartsCount: computedValues.realtimeChartsCount
  };
};

export const useAnalyticsConfig = () => {
  const { config, configuration, debouncedUpdateConfig } = useAdvancedAnalytics();
  
  return {
    config,
    updateConfig: debouncedUpdateConfig,
    resetConfig: configuration.resetConfig,
    exportConfig: configuration.exportConfig,
    importConfig: configuration.importConfig
  };
};

export const useAnalyticsMetrics = (category?: string) => {
  const { metrics, computedValues, actions } = useAdvancedAnalytics();
  
  const filteredMetrics = useMemo(() => {
    if (!category) return metrics;
    return computedValues.metricsByCategory[category] || [];
  }, [metrics, computedValues.metricsByCategory, category]);
  
  return {
    metrics: filteredMetrics,
    addMetric: actions.addMetric,
    updateMetric: actions.updateMetric,
    deleteMetric: actions.deleteMetric,
    refreshMetric: actions.refreshMetric
  };
};

export const useAnalyticsCharts = (category?: string) => {
  const { charts, computedValues, actions } = useAdvancedAnalytics();
  
  const filteredCharts = useMemo(() => {
    if (!category) return charts;
    return computedValues.chartsByCategory[category] || [];
  }, [charts, computedValues.chartsByCategory, category]);
  
  return {
    charts: filteredCharts,
    addChart: actions.addChart,
    updateChart: actions.updateChart,
    deleteChart: actions.deleteChart,
    refreshChart: actions.refreshChart
  };
};

export const useAnalyticsDashboards = () => {
  const { dashboards, currentDashboard, actions } = useAdvancedAnalytics();
  
  const currentDashboardData = useMemo(() => {
    return dashboards.find(d => d.id === currentDashboard) || null;
  }, [dashboards, currentDashboard]);
  
  return {
    dashboards,
    currentDashboard: currentDashboardData,
    setCurrentDashboard: actions.setCurrentDashboard,
    createDashboard: actions.createDashboard,
    updateDashboard: actions.updateDashboard,
    deleteDashboard: actions.deleteDashboard,
    duplicateDashboard: actions.duplicateDashboard
  };
};

export const useAnalyticsReports = () => {
  const { reports, actions } = useAdvancedAnalytics();
  
  const scheduledReports = useMemo(() => {
    return reports.filter(r => r.type === 'scheduled');
  }, [reports]);
  
  const onDemandReports = useMemo(() => {
    return reports.filter(r => r.type === 'on-demand');
  }, [reports]);
  
  return {
    reports,
    scheduledReports,
    onDemandReports,
    createReport: actions.createReport,
    updateReport: actions.updateReport,
    deleteReport: actions.deleteReport,
    generateReport: actions.generateReport
  };
};

export const useAnalyticsAlerts = () => {
  const { alerts, computedValues, actions } = useAdvancedAnalytics();
  
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => a.isActive);
  }, [alerts]);
  
  const criticalAlerts = useMemo(() => {
    return alerts.filter(a => a.severity === 'critical' && a.isActive);
  }, [alerts]);
  
  return {
    alerts,
    activeAlerts,
    criticalAlerts,
    alertsByStatus: computedValues.alertsByStatus,
    createAlert: actions.createAlert,
    updateAlert: actions.updateAlert,
    deleteAlert: actions.deleteAlert,
    testAlert: actions.testAlert
  };
};

export const useAnalyticsSegments = () => {
  const { segments, actions } = useAdvancedAnalytics();
  
  const totalUsers = useMemo(() => {
    return segments.reduce((sum, segment) => sum + segment.userCount, 0);
  }, [segments]);
  
  return {
    segments,
    totalUsers,
    createSegment: actions.createSegment,
    updateSegment: actions.updateSegment,
    deleteSegment: actions.deleteSegment
  };
};

export const useAnalyticsRealTime = () => {
  const { charts, config, actions } = useAdvancedAnalytics();
  const [isStreaming, setIsStreaming] = useState(false);
  
  const realtimeCharts = useMemo(() => {
    return charts.filter(c => c.isRealtime);
  }, [charts]);
  
  const startStreaming = useCallback(() => {
    if (!config.enableRealtime) return;
    setIsStreaming(true);
    // Start real-time data streaming
  }, [config.enableRealtime]);
  
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    // Stop real-time data streaming
  }, []);
  
  useEffect(() => {
    if (config.enableRealtime && realtimeCharts.length > 0) {
      startStreaming();
    } else {
      stopStreaming();
    }
    
    return () => stopStreaming();
  }, [config.enableRealtime, realtimeCharts.length, startStreaming, stopStreaming]);
  
  return {
    isStreaming,
    realtimeCharts,
    startStreaming,
    stopStreaming,
    refreshInterval: config.refreshInterval
  };
};

// Utility Hooks
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const [isThrottled, setIsThrottled] = useState(false);
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    if (isThrottled) return;
    
    callback(...args);
    setIsThrottled(true);
    
    setTimeout(() => {
      setIsThrottled(false);
    }, delay);
  }, [callback, delay, isThrottled]) as T;
  
  return throttledCallback;
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]) as T;
  
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);
  
  return debouncedCallback;
};

export const useProgressTracking = () => {
  const [progress, setProgress] = useState({
    isActive: false,
    progress: 0,
    operation: ''
  });
  
  const startProgress = useCallback((operation: string) => {
    setProgress({
      isActive: true,
      progress: 0,
      operation
    });
  }, []);
  
  const updateProgress = useCallback((progress: number) => {
    setProgress(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100)
    }));
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress({
      isActive: false,
      progress: 100,
      operation: ''
    });
  }, []);
  
  return {
    progress,
    startProgress,
    updateProgress,
    completeProgress
  };
};

// Helper Functions
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
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
  }) as T;
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};