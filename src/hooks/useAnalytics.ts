import { useEffect, useCallback, useMemo } from 'react';
import { useAnalyticsStore, AnalyticsEvent, PerformanceMetric, Alert, AnalyticsConfig } from '../utils/analytics';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

// Hook options interface
interface UseAnalyticsOptions {
  autoTrack?: boolean;
  trackPageViews?: boolean;
  trackErrors?: boolean;
  enablePerformanceTracking?: boolean;
  enableRealTime?: boolean;
  updateInterval?: number;
}

// Hook return interface
interface UseAnalyticsReturn {
  // State
  events: AnalyticsEvent[];
  metrics: PerformanceMetric[];
  alerts: Alert[];
  stats: any;
  realTimeMetrics: any;
  isTracking: boolean;
  isConnected: boolean;
  currentSession: any;
  
  // Actions
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  createAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string, resolvedBy?: string) => void;
  updateConfig: (config: Partial<AnalyticsConfig>) => void;
  
  // Quick Actions
  trackPageView: (path: string, title?: string) => void;
  trackUserAction: (action: string, category: string, label?: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (name: string, value: number, unit: string) => void;
  
  // Analytics
  getEventsByType: (type: string) => AnalyticsEvent[];
  getMetricsByCategory: (category: string) => PerformanceMetric[];
  getAlertsBySeverity: (severity: string) => Alert[];
  
  // Utilities
  exportData: (format: 'json' | 'csv') => string;
  clearData: (type?: 'events' | 'metrics' | 'alerts' | 'sessions' | 'all') => void;
  syncWithServer: () => Promise<void>;
  
  // Advanced
  createCustomDashboard: (name: string, widgets: any[]) => void;
  scheduleReport: (config: any) => void;
  setupFunnel: (steps: string[]) => void;
  createSegment: (name: string, criteria: any) => void;
  
  // Computed
  totalEvents: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  errorRate: number;
  performanceScore: number;
  recentEvents: AnalyticsEvent[];
  recentAlerts: Alert[];
}

// Main hook
export const useAnalytics = (options: UseAnalyticsOptions = {}): UseAnalyticsReturn => {
  const {
    autoTrack = true,
    trackPageViews = true,
    trackErrors = true,
    enablePerformanceTracking = true,
    enableRealTime = true,
    updateInterval = 5000,
  } = options;
  
  // Initialize performance monitor
  const performanceMonitor = usePerformanceMonitor();
  
  // Get state and actions from store
  const {
    events,
    metrics,
    alerts,
    stats,
    realTimeMetrics,
    isTracking,
    isConnected,
    currentSession,
    trackEvent,
    trackMetric,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    updateConfig,
    getEventsByType,
    getMetricsByCategory,
    getAlertsBySeverity,
    exportData,
    clearData,
    syncWithServer,
    trackPageView,
    trackUserAction,
    trackError,
    trackPerformance,
    createCustomDashboard,
    scheduleReport,
    setupFunnel,
    createSegment,
    initialize,
    updateRealTimeMetrics,
    calculateStats,
  } = useAnalyticsStore();
  
  // Initialize analytics on mount
  useEffect(() => {
    if (autoTrack) {
      initialize();
      // Initialize performance monitoring
      performanceMonitor.monitor.initialize();
    }
  }, [autoTrack, initialize, performanceMonitor]);
  
  // Track page views automatically
  useEffect(() => {
    if (trackPageViews && typeof window !== 'undefined') {
      const handleLocationChange = () => {
        trackPageView(window.location.pathname, document.title);
      };
      
      // Track initial page view
      handleLocationChange();
      
      // Listen for navigation changes
      window.addEventListener('popstate', handleLocationChange);
      
      return () => {
        window.removeEventListener('popstate', handleLocationChange);
      };
    }
  }, [trackPageViews, trackPageView]);
  
  // Track errors automatically
  useEffect(() => {
    if (trackErrors && typeof window !== 'undefined') {
      const handleError = (event: ErrorEvent) => {
        trackError(new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      };
      
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        trackError(new Error(event.reason), {
          type: 'unhandled_promise_rejection',
        });
      };
      
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [trackErrors, trackError]);
  
  // Track performance automatically
  useEffect(() => {
    if (enablePerformanceTracking && typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            trackMetric({
              name: 'page_load_time',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: 'ms',
              category: 'load',
            });
          } else if (entry.entryType === 'paint') {
            trackMetric({
              name: entry.name.replace('-', '_'),
              value: entry.startTime,
              unit: 'ms',
              category: 'load',
            });
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
      
      return () => {
        observer.disconnect();
      };
    }
  }, [enablePerformanceTracking, trackMetric]);
  
  // Real-time updates
  useEffect(() => {
    if (enableRealTime) {
      const interval = setInterval(() => {
        updateRealTimeMetrics();
        calculateStats();
      }, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [enableRealTime, updateInterval, updateRealTimeMetrics, calculateStats]);
  
  // Computed values
  const computed = useMemo(() => {
    const totalEvents = events.length;
    const totalAlerts = alerts.length;
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    
    const errorEvents = events.filter(e => e.type === 'error').length;
    const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;
    
    const performanceScore = stats.performanceScore || 100;
    
    const oneHourAgo = Date.now() - 3600000;
    const recentEvents = events.filter(e => e.timestamp > oneHourAgo);
    const recentAlerts = alerts.filter(a => a.timestamp > oneHourAgo);
    
    return {
      totalEvents,
      totalAlerts,
      unacknowledgedAlerts,
      criticalAlerts,
      errorRate,
      performanceScore,
      recentEvents,
      recentAlerts,
    };
  }, [events, alerts, stats]);
  
  return {
    // State
    events,
    metrics,
    alerts,
    stats,
    realTimeMetrics,
    isTracking,
    isConnected,
    currentSession,
    
    // Actions
    trackEvent,
    trackMetric,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    updateConfig,
    
    // Quick Actions
    trackPageView,
    trackUserAction,
    trackError,
    
    // Analytics
    getEventsByType,
    getMetricsByCategory,
    getAlertsBySeverity,
    
    // Utilities
    exportData,
    clearData,
    syncWithServer,
    
    // Advanced
    createCustomDashboard,
    scheduleReport,
    setupFunnel,
    createSegment,
    
    // Computed
    ...computed,
  };
};

// Specialized hooks
export const useAnalyticsStats = () => {
  const { stats, realTimeMetrics, calculateStats } = useAnalyticsStore();
  
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);
  
  return {
    stats,
    realTimeMetrics,
    refresh: calculateStats,
  };
};

export const useAnalyticsConfig = () => {
  const { config, updateConfig } = useAnalyticsStore();
  
  const updateSetting = useCallback((key: keyof AnalyticsConfig, value: any) => {
    updateConfig({ [key]: value });
  }, [updateConfig]);
  
  const resetToDefaults = useCallback(() => {
    updateConfig({
      enabled: true,
      sampleRate: 1.0,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableUserTracking: true,
      enableRealTimeAlerts: true,
      dataRetentionDays: 30,
      batchSize: 100,
      flushInterval: 5000,
    });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    updateSetting,
    resetToDefaults,
  };
};

export const useAnalyticsEvents = (type?: string, limit?: number) => {
  const { events, getEventsByType } = useAnalyticsStore();
  
  const filteredEvents = useMemo(() => {
    let result = type ? getEventsByType(type) : events;
    if (limit) {
      result = result.slice(-limit);
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [events, type, limit, getEventsByType]);
  
  return filteredEvents;
};

export const useAnalyticsMetrics = (category?: string, limit?: number) => {
  const { metrics, getMetricsByCategory } = useAnalyticsStore();
  
  const filteredMetrics = useMemo(() => {
    let result = category ? getMetricsByCategory(category) : metrics;
    if (limit) {
      result = result.slice(-limit);
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [metrics, category, limit, getMetricsByCategory]);
  
  return filteredMetrics;
};

export const useAnalyticsAlerts = (severity?: string, unacknowledgedOnly = false) => {
  const { alerts, getAlertsBySeverity } = useAnalyticsStore();
  
  const filteredAlerts = useMemo(() => {
    let result = severity ? getAlertsBySeverity(severity) : alerts;
    if (unacknowledgedOnly) {
      result = result.filter(alert => !alert.acknowledged);
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [alerts, severity, unacknowledgedOnly, getAlertsBySeverity]);
  
  return filteredAlerts;
};

export const useAnalyticsRealTime = (updateInterval = 1000) => {
  const { realTimeMetrics, updateRealTimeMetrics } = useAnalyticsStore();
  
  useEffect(() => {
    const interval = setInterval(updateRealTimeMetrics, updateInterval);
    return () => clearInterval(interval);
  }, [updateInterval, updateRealTimeMetrics]);
  
  return realTimeMetrics;
};

// Utility hooks
export const useThrottle = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  );
  
  return throttledCallback;
};

export const useDebounce = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const debouncedCallback = useCallback(
    debounce(callback, delay),
    [callback, delay]
  );
  
  return debouncedCallback;
};

// Performance tracking hook
export const usePerformanceTracking = (name: string, enabled = true) => {
  const { trackPerformance } = useAnalyticsStore();
  
  const startTime = useMemo(() => performance.now(), []);
  
  const measure = useCallback((label?: string) => {
    if (!enabled) return;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    trackPerformance(
      label ? `${name}_${label}` : name,
      duration,
      'ms'
    );
    
    return duration;
  }, [enabled, name, startTime, trackPerformance]);
  
  useEffect(() => {
    return () => {
      if (enabled) {
        measure('total');
      }
    };
  }, [enabled, measure]);
  
  return { measure, startTime };
};

// Error boundary hook
export const useErrorTracking = () => {
  const { trackError } = useAnalyticsStore();
  
  const trackComponentError = useCallback((error: Error, errorInfo: any) => {
    trackError(error, {
      type: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
    });
  }, [trackError]);
  
  return { trackComponentError };
};

// User action tracking hook
export const useActionTracking = () => {
  const { trackUserAction } = useAnalyticsStore();
  
  const trackClick = useCallback((element: string, category = 'interaction') => {
    trackUserAction('click', category, element);
  }, [trackUserAction]);
  
  const trackFormSubmit = useCallback((formName: string, category = 'form') => {
    trackUserAction('submit', category, formName);
  }, [trackUserAction]);
  
  const trackSearch = useCallback((query: string, category = 'search') => {
    trackUserAction('search', category, query);
  }, [trackUserAction]);
  
  const trackDownload = useCallback((fileName: string, category = 'download') => {
    trackUserAction('download', category, fileName);
  }, [trackUserAction]);
  
  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackDownload,
  };
};

// Helper functions
function throttle<T extends any[]>(func: (...args: T) => void, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: T) => {
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
}

function debounce<T extends any[]>(func: (...args: T) => void, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: T) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}