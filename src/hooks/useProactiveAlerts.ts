import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProactiveAlertsStore, AlertRule, Alert, AlertChannel, AlertStats, AlertConfig } from '../services/proactiveAlertsService';

// Utility functions
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

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Progress tracking hook
export const useProactiveAlertsProgress = () => {
  const { isLoading, isProcessing, progress, processingMessage, error } = useProactiveAlertsStore();
  
  return {
    isLoading,
    isProcessing,
    progress,
    processingMessage,
    error,
    isActive: isLoading || isProcessing
  };
};

// Main hook
export const useProactiveAlerts = (autoRefresh = true) => {
  const store = useProactiveAlertsStore();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      store.refreshData();
      setLastRefresh(new Date());
      
      const interval = setInterval(() => {
        store.refreshData();
        setLastRefresh(new Date());
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Rule Management
    createRule: store.createRule,
    updateRule: store.updateRule,
    deleteRule: store.deleteRule,
    toggleRule: store.toggleRule,
    testRule: store.testRule,
    duplicateRule: store.duplicateRule,
    
    // Alert Management
    acknowledgeAlert: store.acknowledgeAlert,
    resolveAlert: store.resolveAlert,
    suppressAlert: store.suppressAlert,
    escalateAlert: store.escalateAlert,
    groupAlerts: store.groupAlerts,
    
    // Monitoring
    startMonitoring: store.startMonitoring,
    stopMonitoring: store.stopMonitoring,
    addMetric: store.addMetric,
    evaluateRules: store.evaluateRules,
    
    // Channel Management
    createChannel: store.createChannel,
    updateChannel: store.updateChannel,
    deleteChannel: store.deleteChannel,
    testChannel: store.testChannel,
    
    // Notifications
    sendNotification: store.sendNotification,
    retryNotification: store.retryNotification,
    
    // Templates
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    
    // Configuration
    updateConfig: store.updateConfig,
    
    // System
    refreshData: store.refreshData,
    resetState: store.resetState
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    acknowledgeAllCritical: async () => {
      try {
        const criticalAlerts = store.criticalAlerts;
        await Promise.all(
          criticalAlerts.map(alert => 
            store.acknowledgeAlert(alert.id, 'current-user')
          )
        );
      } catch (error) {
        console.error('Failed to acknowledge critical alerts:', error);
      }
    },
    
    resolveAllByCategory: async (category: string) => {
      try {
        await store.resolveAllAlerts(category);
      } catch (error) {
        console.error(`Failed to resolve ${category} alerts:`, error);
      }
    },
    
    muteAlertsTemporarily: async (minutes: number) => {
      try {
        await store.muteAllAlerts(minutes);
      } catch (error) {
        console.error('Failed to mute alerts:', error);
      }
    },
    
    runSystemHealthCheck: async () => {
      try {
        await store.runHealthCheck();
      } catch (error) {
        console.error('Failed to run health check:', error);
      }
    },
    
    optimizeAlertRules: async () => {
      try {
        await store.optimizeRules();
      } catch (error) {
        console.error('Failed to optimize rules:', error);
      }
    },
    
    enableMaintenanceMode: async (duration: number) => {
      try {
        await store.enableMaintenanceMode(duration);
      } catch (error) {
        console.error('Failed to enable maintenance mode:', error);
      }
    },
    
    exportAlertsData: async (format: 'json' | 'csv' | 'pdf') => {
      try {
        await store.exportAlerts(format);
      } catch (error) {
        console.error(`Failed to export alerts as ${format}:`, error);
      }
    }
  }), [store]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    search: throttle(store.setSearchQuery, 300),
    filterByCategory: throttle(store.setCategoryFilter, 200),
    filterBySeverity: throttle(store.setSeverityFilter, 200),
    filterByStatus: throttle(store.setStatusFilter, 200)
  }), [store]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    updateRuleConfig: debounce(store.updateRule, 1000),
    updateChannelConfig: debounce(store.updateChannel, 1000),
    updateSystemConfig: debounce(store.updateConfig, 1000)
  }), [store]);
  
  // Enhanced computed values
  const computed = useMemo(() => ({
    // Alert statistics
    alertStats: {
      total: store.alerts.length,
      active: store.alerts.filter(a => a.status === 'active').length,
      critical: store.criticalAlerts.length,
      acknowledged: store.alerts.filter(a => a.status === 'acknowledged').length,
      resolved: store.alerts.filter(a => a.status === 'resolved').length,
      suppressed: store.alerts.filter(a => a.status === 'suppressed').length
    },
    
    // Rule statistics
    ruleStats: {
      total: store.rules.length,
      active: store.activeRules.length,
      disabled: store.rules.filter(r => !r.isEnabled).length,
      byCategory: store.rules.reduce((acc, rule) => {
        acc[rule.category] = (acc[rule.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: store.rules.reduce((acc, rule) => {
        acc[rule.severity] = (acc[rule.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    },
    
    // Channel statistics
    channelStats: {
      total: store.channels.length,
      active: store.channels.filter(c => c.isEnabled).length,
      tested: store.channels.filter(c => c.testStatus === 'success').length,
      failed: store.channels.filter(c => c.testStatus === 'failed').length
    },
    
    // Performance metrics
    performance: {
      averageResolutionTime: store.stats.averageResolutionTime,
      escalationRate: store.stats.escalationRate,
      falsePositiveRate: store.stats.falsePositiveRate,
      mttr: store.stats.mttr,
      mtbf: store.stats.mtbf
    },
    
    // Health indicators
    health: {
      overall: (() => {
        const criticalCount = store.criticalAlerts.length;
        const activeCount = store.alerts.filter(a => a.status === 'active').length;
        const ruleEffectiveness = store.ruleEffectiveness.reduce((acc, r) => acc + r.accuracy, 0) / store.ruleEffectiveness.length || 1;
        
        if (criticalCount > 5) return 'critical';
        if (activeCount > 20 || ruleEffectiveness < 0.7) return 'warning';
        if (activeCount > 10) return 'caution';
        return 'healthy';
      })(),
      monitoring: store.isMonitoring ? 'active' : 'inactive',
      connection: store.connectionStatus,
      lastUpdate: store.lastUpdate
    }
  }), [store]);
  
  // Filtered data
  const filteredData = useMemo(() => ({
    rules: store.filteredRules,
    alerts: store.filteredAlerts,
    recentAlerts: store.recentAlerts,
    criticalAlerts: store.criticalAlerts,
    trends: store.alertTrends,
    effectiveness: store.ruleEffectiveness
  }), [store]);
  
  return {
    // State
    rules: store.rules,
    alerts: store.alerts,
    channels: store.channels,
    templates: store.templates,
    notifications: store.notifications,
    escalations: store.escalations,
    metrics: store.metrics,
    
    // UI State
    selectedRule: store.selectedRule,
    selectedAlert: store.selectedAlert,
    isLoading: store.isLoading,
    isProcessing: store.isProcessing,
    error: store.error,
    progress: store.progress,
    processingMessage: store.processingMessage,
    
    // Filters
    searchQuery: store.searchQuery,
    categoryFilter: store.categoryFilter,
    severityFilter: store.severityFilter,
    statusFilter: store.statusFilter,
    dateRange: store.dateRange,
    
    // Configuration
    config: store.config,
    
    // Real-time
    isMonitoring: store.isMonitoring,
    connectionStatus: store.connectionStatus,
    lastUpdate: store.lastUpdate,
    
    // Analytics
    stats: store.stats,
    recentActivity: store.recentActivity,
    
    // Computed
    computed,
    filteredData,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Selection
    selectRule: store.selectRule,
    selectAlert: store.selectAlert,
    
    // Filters
    setSearchQuery: store.setSearchQuery,
    setCategoryFilter: store.setCategoryFilter,
    setSeverityFilter: store.setSeverityFilter,
    setStatusFilter: store.setStatusFilter,
    setDateRange: store.setDateRange,
    clearFilters: store.clearFilters,
    
    // Utility
    lastRefresh
  };
};

// Specialized hooks
export const useProactiveAlertsStats = () => {
  const { stats, recentActivity, computed } = useProactiveAlerts(false);
  
  return {
    stats,
    recentActivity,
    computed: computed.alertStats,
    performance: computed.performance,
    health: computed.health
  };
};

export const useProactiveAlertsConfig = () => {
  const { config, actions } = useProactiveAlerts(false);
  
  return {
    config,
    updateConfig: actions.updateConfig,
    enableMaintenanceMode: actions.enableMaintenanceMode,
    disableMaintenanceMode: actions.disableMaintenanceMode
  };
};

export const useProactiveAlertsSearch = () => {
  const {
    searchQuery,
    categoryFilter,
    severityFilter,
    statusFilter,
    dateRange,
    filteredData,
    throttledActions,
    clearFilters
  } = useProactiveAlerts(false);
  
  return {
    // Current filters
    searchQuery,
    categoryFilter,
    severityFilter,
    statusFilter,
    dateRange,
    
    // Filtered results
    filteredRules: filteredData.rules,
    filteredAlerts: filteredData.alerts,
    
    // Actions
    setSearchQuery: throttledActions.search,
    setCategoryFilter: throttledActions.filterByCategory,
    setSeverityFilter: throttledActions.filterBySeverity,
    setStatusFilter: throttledActions.filterByStatus,
    clearFilters,
    
    // Computed
    hasActiveFilters: !!(searchQuery || categoryFilter || severityFilter || statusFilter || dateRange),
    resultCount: {
      rules: filteredData.rules.length,
      alerts: filteredData.alerts.length
    }
  };
};

export const useProactiveAlertsRules = () => {
  const {
    rules,
    filteredData,
    selectedRule,
    actions,
    quickActions,
    computed
  } = useProactiveAlerts(false);
  
  return {
    rules,
    filteredRules: filteredData.rules,
    selectedRule,
    ruleStats: computed.ruleStats,
    effectiveness: filteredData.effectiveness,
    
    // Actions
    createRule: actions.createRule,
    updateRule: actions.updateRule,
    deleteRule: actions.deleteRule,
    toggleRule: actions.toggleRule,
    testRule: actions.testRule,
    duplicateRule: actions.duplicateRule,
    selectRule: actions.selectRule,
    optimizeRules: quickActions.optimizeAlertRules
  };
};

export const useProactiveAlertsMonitoring = () => {
  const {
    isMonitoring,
    connectionStatus,
    lastUpdate,
    metrics,
    actions,
    computed
  } = useProactiveAlerts(false);
  
  return {
    isMonitoring,
    connectionStatus,
    lastUpdate,
    metrics,
    health: computed.health,
    
    // Actions
    startMonitoring: actions.startMonitoring,
    stopMonitoring: actions.stopMonitoring,
    addMetric: actions.addMetric,
    evaluateRules: actions.evaluateRules,
    runHealthCheck: actions.runSystemHealthCheck
  };
};

export const useProactiveAlertsChannels = () => {
  const {
    channels,
    notifications,
    actions,
    computed
  } = useProactiveAlerts(false);
  
  return {
    channels,
    notifications,
    channelStats: computed.channelStats,
    
    // Actions
    createChannel: actions.createChannel,
    updateChannel: actions.updateChannel,
    deleteChannel: actions.deleteChannel,
    testChannel: actions.testChannel,
    sendNotification: actions.sendNotification,
    retryNotification: actions.retryNotification
  };
};

export const useProactiveAlertsTemplates = () => {
  const {
    templates,
    actions
  } = useProactiveAlerts(false);
  
  return {
    templates,
    
    // Actions
    createTemplate: actions.createTemplate,
    updateTemplate: actions.updateTemplate,
    deleteTemplate: actions.deleteTemplate
  };
};

export const useProactiveAlertsRealtime = () => {
  const {
    isMonitoring,
    connectionStatus,
    lastUpdate,
    recentActivity,
    filteredData,
    actions
  } = useProactiveAlerts(true); // Auto-refresh enabled
  
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: Date;
    status: string;
    duration?: number;
  }>>([]);
  
  // Track connection changes
  useEffect(() => {
    setConnectionHistory(prev => {
      const newEntry = {
        timestamp: new Date(),
        status: connectionStatus
      };
      
      // Calculate duration for previous entry
      if (prev.length > 0) {
        const lastEntry = prev[prev.length - 1];
        lastEntry.duration = newEntry.timestamp.getTime() - lastEntry.timestamp.getTime();
      }
      
      return [...prev.slice(-9), newEntry]; // Keep last 10 entries
    });
  }, [connectionStatus]);
  
  return {
    // Real-time status
    isMonitoring,
    connectionStatus,
    lastUpdate,
    connectionHistory,
    
    // Live data
    recentAlerts: filteredData.recentAlerts,
    criticalAlerts: filteredData.criticalAlerts,
    alertTrends: filteredData.trends,
    recentActivity,
    
    // Actions
    startMonitoring: actions.startMonitoring,
    stopMonitoring: actions.stopMonitoring,
    addMetric: actions.addMetric,
    evaluateRules: actions.evaluateRules,
    
    // Computed
    uptime: connectionHistory.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0),
    
    isHealthy: connectionStatus === 'connected' && isMonitoring,
    
    alertsPerHour: (() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return filteredData.recentAlerts.filter(alert => 
        alert.triggeredAt >= oneHourAgo
      ).length;
    })()
  };
};

// Utility hooks
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useCallback(throttle(callback, delay), [callback, delay]);
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  return useCallback(debounce(callback, delay), [callback, delay]);
};

// Helper function for alert complexity calculation
const calculateAlertComplexity = (alert: Alert): number => {
  let complexity = 0;
  
  // Base complexity by severity
  switch (alert.severity) {
    case 'critical': complexity += 4; break;
    case 'high': complexity += 3; break;
    case 'medium': complexity += 2; break;
    case 'low': complexity += 1; break;
  }
  
  // Add complexity for affected resources
  complexity += Math.min(alert.affectedResources.length, 3);
  
  // Add complexity for escalation
  complexity += alert.escalationLevel;
  
  // Add complexity for related alerts
  complexity += Math.min(alert.relatedAlerts.length, 2);
  
  return complexity;
};

export { calculateAlertComplexity };

// Export default hook
export default useProactiveAlerts;