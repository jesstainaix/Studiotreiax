import { useEffect, useCallback, useMemo } from 'react';
import { 
  useNotificationStore, 
  Notification, 
  NotificationRule, 
  NotificationChannel, 
  NotificationTemplate,
  NotificationConfig,
  NotificationStats,
  NotificationDebugLog
} from '../utils/notificationManager';

// Hook options interface
export interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableBrowserNotifications?: boolean;
  enableSound?: boolean;
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  theme?: 'light' | 'dark' | 'auto';
  filterUnread?: boolean;
  filterByType?: Notification['type'][];
  filterByCategory?: Notification['category'][];
  filterByPriority?: Notification['priority'][];
  sortBy?: 'createdAt' | 'priority' | 'type' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// Hook return interface
export interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  filteredNotifications: Notification[];
  rules: NotificationRule[];
  channels: NotificationChannel[];
  templates: NotificationTemplate[];
  stats: NotificationStats;
  config: NotificationConfig;
  debugLogs: NotificationDebugLog[];
  isLoading: boolean;
  error: string | null;
  
  // Notification Management
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  deleteNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  
  // Rule Management
  createRule: (rule: Omit<NotificationRule, 'id' | 'triggerCount'>) => string;
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  testRule: (id: string, testData: any) => boolean;
  
  // Channel Management
  createChannel: (channel: Omit<NotificationChannel, 'id'>) => string;
  updateChannel: (id: string, updates: Partial<NotificationChannel>) => void;
  deleteChannel: (id: string) => void;
  toggleChannel: (id: string) => void;
  testChannel: (id: string, notification: Notification) => Promise<boolean>;
  
  // Template Management
  createTemplate: (template: Omit<NotificationTemplate, 'id'>) => string;
  updateTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  deleteTemplate: (id: string) => void;
  renderTemplate: (templateId: string, variables: Record<string, any>) => { title: string; message: string };
  
  // Configuration
  updateConfig: (updates: Partial<NotificationConfig>) => void;
  resetConfig: () => void;
  
  // Analytics
  getNotificationsByDateRange: (startDate: Date, endDate: Date) => Notification[];
  getTopCategories: (limit?: number) => Array<{ category: string; count: number }>;
  getResponseTimeMetrics: () => { average: number; median: number; p95: number };
  
  // Utilities
  formatNotification: (notification: Notification) => string;
  getNotificationIcon: (type: Notification['type']) => string;
  getNotificationColor: (type: Notification['type']) => string;
  getPriorityColor: (priority: Notification['priority']) => string;
  
  // Quick Actions
  quickActions: {
    createSystemAlert: (message: string, priority?: Notification['priority']) => string;
    createPerformanceAlert: (metric: string, value: number, threshold: number) => string;
    createSecurityAlert: (event: string, severity: 'low' | 'medium' | 'high') => string;
    createUserNotification: (userId: string, message: string) => string;
    setupDefaultRules: () => void;
    setupDefaultChannels: () => void;
    enableAllNotifications: () => void;
    disableAllNotifications: () => void;
  };
  
  // Advanced Features
  advanced: {
    batchCreate: (notifications: Array<Omit<Notification, 'id' | 'createdAt'>>) => string[];
    bulkAction: (ids: string[], action: 'read' | 'dismiss' | 'delete') => void;
    exportNotifications: (format: 'json' | 'csv') => string;
    importRules: (rules: NotificationRule[]) => void;
    scheduleNotification: (notification: Omit<Notification, 'id' | 'createdAt'>, scheduleTime: Date) => string;
    createRecurringNotification: (notification: Omit<Notification, 'id' | 'createdAt'>, interval: number) => string;
    enableQuietMode: (duration: number) => void;
    disableQuietMode: () => void;
  };
  
  // System Operations
  cleanup: () => void;
  clearOldNotifications: (olderThanDays: number) => void;
  optimizeStorage: () => void;
  getSystemInfo: () => Record<string, any>;
  
  // Debug
  addDebugLog: (level: NotificationDebugLog['level'], message: string, data?: any, source?: string) => void;
  clearDebugLogs: () => void;
  exportDebugLogs: () => string;
  
  // Computed Values
  unreadCount: number;
  criticalCount: number;
  todayCount: number;
  activeRulesCount: number;
  enabledChannelsCount: number;
  averageResponseTime: string;
  dismissalRate: string;
}

// Throttle utility
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return ((...args: any[]) => {
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
}

// Main hook
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableBrowserNotifications = true,
    enableSound = true,
    maxNotifications = 100,
    defaultDuration = 5000,
    position = 'top-right',
    theme = 'auto',
    filterUnread = false,
    filterByType,
    filterByCategory,
    filterByPriority,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  // Get store state and actions
  const {
    notifications,
    rules,
    channels,
    templates,
    stats,
    config,
    debugLogs,
    isLoading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    testChannel,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate,
    updateConfig,
    resetConfig,
    updateStats,
    getNotificationsByDateRange,
    getTopCategories,
    getResponseTimeMetrics,
    formatNotification,
    getNotificationIcon,
    getNotificationColor,
    getPriorityColor,
    quickActions,
    advanced,
    cleanup,
    clearOldNotifications,
    optimizeStorage,
    getSystemInfo,
    addDebugLog,
    clearDebugLogs,
    exportDebugLogs
  } = useNotificationStore();
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      updateStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, updateStats]);
  
  // Update config based on options
  useEffect(() => {
    const configUpdates: Partial<NotificationConfig> = {};
    
    if (enableBrowserNotifications !== config.enableBrowserNotifications) {
      configUpdates.enableBrowserNotifications = enableBrowserNotifications;
    }
    if (enableSound !== config.enableSound) {
      configUpdates.enableSound = enableSound;
    }
    if (maxNotifications !== config.maxNotifications) {
      configUpdates.maxNotifications = maxNotifications;
    }
    if (defaultDuration !== config.defaultDuration) {
      configUpdates.defaultDuration = defaultDuration;
    }
    if (position !== config.position) {
      configUpdates.position = position;
    }
    if (theme !== config.theme) {
      configUpdates.theme = theme;
    }
    
    if (Object.keys(configUpdates).length > 0) {
      updateConfig(configUpdates);
    }
  }, [enableBrowserNotifications, enableSound, maxNotifications, defaultDuration, position, theme, config, updateConfig]);
  
  // Filtered and sorted notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    // Apply filters
    if (filterUnread) {
      filtered = filtered.filter(n => !n.readAt && !n.dismissedAt);
    }
    
    if (filterByType && filterByType.length > 0) {
      filtered = filtered.filter(n => filterByType.includes(n.type));
    }
    
    if (filterByCategory && filterByCategory.length > 0) {
      filtered = filtered.filter(n => filterByCategory.includes(n.category));
    }
    
    if (filterByPriority && filterByPriority.length > 0) {
      filtered = filtered.filter(n => filterByPriority.includes(n.priority));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [notifications, filterUnread, filterByType, filterByCategory, filterByPriority, sortBy, sortOrder]);
  
  // Computed values
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.readAt && !n.dismissedAt).length;
  }, [notifications]);
  
  const criticalCount = useMemo(() => {
    return notifications.filter(n => n.priority === 'critical' && !n.dismissedAt).length;
  }, [notifications]);
  
  const todayCount = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return notifications.filter(n => n.createdAt >= today).length;
  }, [notifications]);
  
  const activeRulesCount = useMemo(() => {
    return rules.filter(r => r.enabled).length;
  }, [rules]);
  
  const enabledChannelsCount = useMemo(() => {
    return channels.filter(c => c.enabled).length;
  }, [channels]);
  
  const averageResponseTime = useMemo(() => {
    if (stats.averageResponseTime === 0) return '0ms';
    
    if (stats.averageResponseTime < 1000) {
      return `${Math.round(stats.averageResponseTime)}ms`;
    } else if (stats.averageResponseTime < 60000) {
      return `${Math.round(stats.averageResponseTime / 1000)}s`;
    } else {
      return `${Math.round(stats.averageResponseTime / 60000)}m`;
    }
  }, [stats.averageResponseTime]);
  
  const dismissalRate = useMemo(() => {
    return `${Math.round(stats.dismissalRate)}%`;
  }, [stats.dismissalRate]);
  
  // Throttled actions
  const throttledUpdateStats = useCallback(
    throttle(() => updateStats(), 1000),
    [updateStats]
  );
  
  // Enhanced create notification with browser notification support
  const enhancedCreateNotification = useCallback((notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = createNotification(notificationData);
    
    // Show browser notification if enabled
    if (config.enableBrowserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notificationData.title, {
        body: notificationData.message,
        icon: '/favicon.ico',
        tag: id
      });
      
      if (notificationData.autoClose && notificationData.duration > 0) {
        setTimeout(() => {
          browserNotification.close();
        }, notificationData.duration);
      }
    }
    
    // Play sound if enabled
    if (config.enableSound) {
      // You could implement sound playing here
    }
    
    throttledUpdateStats();
    return id;
  }, [createNotification, config.enableBrowserNotifications, config.enableSound, throttledUpdateStats]);
  
  return {
    // State
    notifications,
    filteredNotifications,
    rules,
    channels,
    templates,
    stats,
    config,
    debugLogs,
    isLoading,
    error,
    
    // Notification Management
    createNotification: enhancedCreateNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    
    // Rule Management
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    
    // Channel Management
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    testChannel,
    
    // Template Management
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate,
    
    // Configuration
    updateConfig,
    resetConfig,
    
    // Analytics
    getNotificationsByDateRange,
    getTopCategories,
    getResponseTimeMetrics,
    
    // Utilities
    formatNotification,
    getNotificationIcon,
    getNotificationColor,
    getPriorityColor,
    
    // Quick Actions
    quickActions,
    
    // Advanced Features
    advanced,
    
    // System Operations
    cleanup,
    clearOldNotifications,
    optimizeStorage,
    getSystemInfo,
    
    // Debug
    addDebugLog,
    clearDebugLogs,
    exportDebugLogs,
    
    // Computed Values
    unreadCount,
    criticalCount,
    todayCount,
    activeRulesCount,
    enabledChannelsCount,
    averageResponseTime,
    dismissalRate
  };
}

// Specialized hooks
export function useNotificationOverview() {
  const { stats, unreadCount, criticalCount, todayCount } = useNotifications();
  
  return {
    stats,
    unreadCount,
    criticalCount,
    todayCount,
    totalNotifications: stats.total,
    weekCount: stats.weekCount,
    monthCount: stats.monthCount
  };
}

export function useNotificationRules() {
  const {
    rules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    activeRulesCount
  } = useNotifications();
  
  return {
    rules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    activeRulesCount,
    totalRules: rules.length
  };
}

export function useNotificationChannels() {
  const {
    channels,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    testChannel,
    enabledChannelsCount
  } = useNotifications();
  
  return {
    channels,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    testChannel,
    enabledChannelsCount,
    totalChannels: channels.length
  };
}

export function useNotificationTemplates() {
  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate
  } = useNotifications();
  
  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate,
    totalTemplates: templates.length
  };
}

export function useNotificationQuickActions() {
  const { quickActions, advanced } = useNotifications();
  
  return {
    ...quickActions,
    ...advanced
  };
}

export function useNotificationAnalytics() {
  const {
    stats,
    getNotificationsByDateRange,
    getTopCategories,
    getResponseTimeMetrics,
    averageResponseTime,
    dismissalRate
  } = useNotifications();
  
  return {
    stats,
    getNotificationsByDateRange,
    getTopCategories,
    getResponseTimeMetrics,
    averageResponseTime,
    dismissalRate
  };
}

export function useNotificationDebug() {
  const {
    debugLogs,
    addDebugLog,
    clearDebugLogs,
    exportDebugLogs,
    getSystemInfo
  } = useNotifications();
  
  return {
    debugLogs,
    addDebugLog,
    clearDebugLogs,
    exportDebugLogs,
    getSystemInfo
  };
}