import { useEffect, useCallback, useMemo } from 'react';
import {
  useNotificationStore,
  SmartNotification,
  NotificationRule,
  NotificationTemplate,
  NotificationChannel,
  NotificationGroup,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationConfig,
  NotificationStats,
  formatNotificationTime,
  getNotificationTypeIcon,
  getNotificationPriorityColor,
  getNotificationStatusColor
} from '../utils/smartNotifications';

// Hook options interface
export interface UseSmartNotificationsOptions {
  autoInitialize?: boolean;
  enableAutoCleanup?: boolean;
  enableRealTimeUpdates?: boolean;
  filterOptions?: {
    types?: NotificationType[];
    priorities?: NotificationPriority[];
    categories?: string[];
    statuses?: NotificationStatus[];
    starred?: boolean;
    archived?: boolean;
  };
}

// Hook return interface
export interface UseSmartNotificationsReturn {
  // State
  notifications: SmartNotification[];
  filteredNotifications: SmartNotification[];
  groups: NotificationGroup[];
  rules: NotificationRule[];
  templates: NotificationTemplate[];
  channels: NotificationChannel[];
  stats: NotificationStats;
  config: NotificationConfig;
  isInitialized: boolean;
  lastUpdate: Date | null;
  
  // Notification Actions
  addNotification: (notification: Omit<SmartNotification, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNotification: (id: string, updates: Partial<SmartNotification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  archiveNotification: (id: string) => void;
  unarchiveNotification: (id: string) => void;
  starNotification: (id: string) => void;
  unstarNotification: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  bulkAction: (ids: string[], action: 'read' | 'unread' | 'archive' | 'delete' | 'star') => void;
  
  // Group Actions
  createGroup: (group: Omit<NotificationGroup, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateGroup: (id: string, updates: Partial<NotificationGroup>) => void;
  removeGroup: (id: string) => void;
  addToGroup: (notificationId: string, groupId: string) => void;
  removeFromGroup: (notificationId: string, groupId: string) => void;
  collapseGroup: (id: string) => void;
  expandGroup: (id: string) => void;
  
  // Rule Actions
  createRule: (rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
  removeRule: (id: string) => void;
  enableRule: (id: string) => void;
  disableRule: (id: string) => void;
  testRule: (id: string, notification: SmartNotification) => boolean;
  
  // Template Actions
  createTemplate: (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  removeTemplate: (id: string) => void;
  useTemplate: (id: string, variables?: Record<string, any>) => string;
  
  // Channel Actions
  createChannel: (channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateChannel: (id: string, updates: Partial<NotificationChannel>) => void;
  removeChannel: (id: string) => void;
  testChannel: (id: string) => Promise<boolean>;
  
  // Analytics Actions
  updateStats: () => void;
  getStatsByPeriod: (period: 'day' | 'week' | 'month' | 'year') => NotificationStats;
  getEngagementMetrics: () => Record<string, number>;
  
  // Config Actions
  updateConfig: (updates: Partial<NotificationConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (configStr: string) => void;
  
  // Data Actions
  clearAll: () => void;
  exportData: () => string;
  importData: (dataStr: string) => void;
  cleanup: () => void;
  
  // System Actions
  initialize: () => void;
  shutdown: () => void;
  reset: () => void;
  
  // Utility Functions
  formatTime: (date: Date) => string;
  getTypeIcon: (type: NotificationType) => string;
  getPriorityColor: (priority: NotificationPriority) => string;
  getStatusColor: (status: NotificationStatus) => string;
  
  // Derived State
  unreadCount: number;
  starredCount: number;
  archivedCount: number;
  criticalCount: number;
  totalCount: number;
  
  // Quick Actions
  markAllAsRead: () => void;
  archiveAll: () => void;
  deleteAll: () => void;
  
  // Advanced Actions
  createQuickNotification: (type: NotificationType, title: string, message: string, priority?: NotificationPriority) => string;
  createSystemNotification: (message: string, data?: Record<string, any>) => string;
  createUserNotification: (title: string, message: string, userId?: string) => string;
  createSecurityAlert: (message: string, severity: 'low' | 'medium' | 'high' | 'critical') => string;
  createPerformanceAlert: (metric: string, value: number, threshold: number) => string;
  createUpdateNotification: (version: string, changes: string[]) => string;
  createReminderNotification: (title: string, message: string, scheduledAt: Date) => string;
}

// Main hook
export const useSmartNotifications = (options: UseSmartNotificationsOptions = {}): UseSmartNotificationsReturn => {
  const {
    autoInitialize = true,
    enableAutoCleanup = true,
    enableRealTimeUpdates = true,
    filterOptions
  } = options;
  
  // Get store state and actions
  const store = useNotificationStore();
  
  // Initialize on mount
  useEffect(() => {
    if (autoInitialize && !store.isInitialized) {
      store.initialize();
    }
  }, [autoInitialize, store.isInitialized, store.initialize]);
  
  // Setup auto cleanup
  useEffect(() => {
    if (enableAutoCleanup) {
      const interval = setInterval(() => {
        store.cleanup();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [enableAutoCleanup, store.cleanup]);
  
  // Setup real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      const interval = setInterval(() => {
        store.updateStats();
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [enableRealTimeUpdates, store.updateStats]);
  
  // Filter notifications based on options
  const filteredNotifications = useMemo(() => {
    let filtered = store.notifications;
    
    if (filterOptions) {
      if (filterOptions.types) {
        filtered = filtered.filter(n => filterOptions.types!.includes(n.type));
      }
      
      if (filterOptions.priorities) {
        filtered = filtered.filter(n => filterOptions.priorities!.includes(n.priority));
      }
      
      if (filterOptions.categories) {
        filtered = filtered.filter(n => filterOptions.categories!.includes(n.category));
      }
      
      if (filterOptions.statuses) {
        filtered = filtered.filter(n => filterOptions.statuses!.includes(n.status));
      }
      
      if (filterOptions.starred !== undefined) {
        filtered = filtered.filter(n => n.starred === filterOptions.starred);
      }
      
      if (filterOptions.archived !== undefined) {
        filtered = filtered.filter(n => n.archived === filterOptions.archived);
      }
    }
    
    return filtered;
  }, [store.notifications, filterOptions]);
  
  // Derived state
  const unreadCount = useMemo(() => 
    store.notifications.filter(n => !n.read).length,
    [store.notifications]
  );
  
  const starredCount = useMemo(() => 
    store.notifications.filter(n => n.starred).length,
    [store.notifications]
  );
  
  const archivedCount = useMemo(() => 
    store.notifications.filter(n => n.archived).length,
    [store.notifications]
  );
  
  const criticalCount = useMemo(() => 
    store.notifications.filter(n => n.priority === 'critical' && !n.read).length,
    [store.notifications]
  );
  
  const totalCount = store.notifications.length;
  
  // Quick actions
  const markAllAsRead = useCallback(() => {
    const unreadIds = store.notifications.filter(n => !n.read).map(n => n.id);
    store.bulkAction(unreadIds, 'read');
  }, [store.notifications, store.bulkAction]);
  
  const archiveAll = useCallback(() => {
    const readIds = store.notifications.filter(n => n.read && !n.archived).map(n => n.id);
    store.bulkAction(readIds, 'archive');
  }, [store.notifications, store.bulkAction]);
  
  const deleteAll = useCallback(() => {
    const archivedIds = store.notifications.filter(n => n.archived).map(n => n.id);
    store.bulkAction(archivedIds, 'delete');
  }, [store.notifications, store.bulkAction]);
  
  // Advanced actions
  const createQuickNotification = useCallback((type: NotificationType, title: string, message: string, priority: NotificationPriority = 'medium') => {
    return store.addNotification({
      type,
      priority,
      category: type,
      title,
      message,
      source: 'quick-create'
    });
  }, [store.addNotification]);
  
  const createSystemNotification = useCallback((message: string, data?: Record<string, any>) => {
    return store.addNotification({
      type: 'system',
      priority: 'medium',
      category: 'system',
      title: 'Notificação do Sistema',
      message,
      data,
      source: 'system'
    });
  }, [store.addNotification]);
  
  const createUserNotification = useCallback((title: string, message: string, userId?: string) => {
    return store.addNotification({
      type: 'user',
      priority: 'medium',
      category: 'user',
      title,
      message,
      userId,
      source: 'user'
    });
  }, [store.addNotification]);
  
  const createSecurityAlert = useCallback((message: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    const priorityMap: Record<string, NotificationPriority> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    };
    
    return store.addNotification({
      type: 'security',
      priority: priorityMap[severity],
      category: 'security',
      title: 'Alerta de Segurança',
      message,
      source: 'security-system'
    });
  }, [store.addNotification]);
  
  const createPerformanceAlert = useCallback((metric: string, value: number, threshold: number) => {
    const severity = value > threshold * 1.5 ? 'critical' : value > threshold * 1.2 ? 'high' : 'medium';
    const priorityMap: Record<string, NotificationPriority> = {
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    };
    
    return store.addNotification({
      type: 'performance',
      priority: priorityMap[severity],
      category: 'performance',
      title: 'Alerta de Performance',
      message: `${metric}: ${value} (limite: ${threshold})`,
      data: { metric, value, threshold },
      source: 'performance-monitor'
    });
  }, [store.addNotification]);
  
  const createUpdateNotification = useCallback((version: string, changes: string[]) => {
    return store.addNotification({
      type: 'update',
      priority: 'medium',
      category: 'update',
      title: `Atualização Disponível - v${version}`,
      message: `Nova versão disponível com ${changes.length} melhorias`,
      data: { version, changes },
      source: 'update-system'
    });
  }, [store.addNotification]);
  
  const createReminderNotification = useCallback((title: string, message: string, scheduledAt: Date) => {
    return store.addNotification({
      type: 'reminder',
      priority: 'medium',
      category: 'reminder',
      title,
      message,
      scheduledAt,
      source: 'reminder-system'
    });
  }, [store.addNotification]);
  
  return {
    // State
    notifications: store.notifications,
    filteredNotifications,
    groups: store.groups,
    rules: store.rules,
    templates: store.templates,
    channels: store.channels,
    stats: store.stats,
    config: store.config,
    isInitialized: store.isInitialized,
    lastUpdate: store.lastUpdate,
    
    // Notification Actions
    addNotification: store.addNotification,
    updateNotification: store.updateNotification,
    removeNotification: store.removeNotification,
    markAsRead: store.markAsRead,
    markAsUnread: store.markAsUnread,
    archiveNotification: store.archiveNotification,
    unarchiveNotification: store.unarchiveNotification,
    starNotification: store.starNotification,
    unstarNotification: store.unstarNotification,
    addTag: store.addTag,
    removeTag: store.removeTag,
    bulkAction: store.bulkAction,
    
    // Group Actions
    createGroup: store.createGroup,
    updateGroup: store.updateGroup,
    removeGroup: store.removeGroup,
    addToGroup: store.addToGroup,
    removeFromGroup: store.removeFromGroup,
    collapseGroup: store.collapseGroup,
    expandGroup: store.expandGroup,
    
    // Rule Actions
    createRule: store.createRule,
    updateRule: store.updateRule,
    removeRule: store.removeRule,
    enableRule: store.enableRule,
    disableRule: store.disableRule,
    testRule: store.testRule,
    
    // Template Actions
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    removeTemplate: store.removeTemplate,
    useTemplate: store.useTemplate,
    
    // Channel Actions
    createChannel: store.createChannel,
    updateChannel: store.updateChannel,
    removeChannel: store.removeChannel,
    testChannel: store.testChannel,
    
    // Analytics Actions
    updateStats: store.updateStats,
    getStatsByPeriod: store.getStatsByPeriod,
    getEngagementMetrics: store.getEngagementMetrics,
    
    // Config Actions
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    exportConfig: store.exportConfig,
    importConfig: store.importConfig,
    
    // Data Actions
    clearAll: store.clearAll,
    exportData: store.exportData,
    importData: store.importData,
    cleanup: store.cleanup,
    
    // System Actions
    initialize: store.initialize,
    shutdown: store.shutdown,
    reset: store.reset,
    
    // Utility Functions
    formatTime: formatNotificationTime,
    getTypeIcon: getNotificationTypeIcon,
    getPriorityColor: getNotificationPriorityColor,
    getStatusColor: getNotificationStatusColor,
    
    // Derived State
    unreadCount,
    starredCount,
    archivedCount,
    criticalCount,
    totalCount,
    
    // Quick Actions
    markAllAsRead,
    archiveAll,
    deleteAll,
    
    // Advanced Actions
    createQuickNotification,
    createSystemNotification,
    createUserNotification,
    createSecurityAlert,
    createPerformanceAlert,
    createUpdateNotification,
    createReminderNotification
  };
};

// Auto-initialization hook
export const useAutoNotifications = (options: {
  enableSystemNotifications?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableSecurityAlerts?: boolean;
  enableUpdateNotifications?: boolean;
} = {}) => {
  const {
    enableSystemNotifications = true,
    enablePerformanceMonitoring = true,
    enableSecurityAlerts = true,
    enableUpdateNotifications = true
  } = options;
  
  const notifications = useSmartNotifications({ autoInitialize: true });
  
  useEffect(() => {
    if (enableSystemNotifications) {
      // Create welcome notification
      notifications.createSystemNotification(
        'Sistema de notificações inicializado com sucesso!',
        { feature: 'notifications', status: 'active' }
      );
    }
  }, [enableSystemNotifications, notifications.createSystemNotification]);
  
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      const interval = setInterval(() => {
        // Monitor performance metrics
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        const threshold = 50 * 1024 * 1024; // 50MB
        
        if (memoryUsage > threshold) {
          notifications.createPerformanceAlert(
            'Uso de Memória',
            Math.round(memoryUsage / 1024 / 1024),
            Math.round(threshold / 1024 / 1024)
          );
        }
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [enablePerformanceMonitoring, notifications.createPerformanceAlert]);
  
  useEffect(() => {
    if (enableSecurityAlerts) {
      // Monitor for security events
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          notifications.createSecurityAlert(
            'Sessão reativada - verificando integridade dos dados',
            'low'
          );
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [enableSecurityAlerts, notifications.createSecurityAlert]);
  
  return notifications;
};

// Performance monitoring hook
export const useNotificationPerformance = () => {
  const notifications = useSmartNotifications();
  
  const performanceMetrics = useMemo(() => {
    const { stats } = notifications;
    
    return {
      totalNotifications: stats.total,
      processingRate: stats.total > 0 ? (stats.total / Math.max(1, stats.monthCount)) * 30 : 0,
      engagementRate: stats.readRate,
      responseTime: stats.averageResponseTime,
      deliverySuccess: stats.deliveryRate,
      memoryUsage: notifications.notifications.length * 0.5, // Estimated KB per notification
      efficiency: stats.total > 0 ? (stats.readRate + stats.actionRate) / 2 : 0
    };
  }, [notifications.stats, notifications.notifications.length]);
  
  return {
    metrics: performanceMetrics,
    isHealthy: performanceMetrics.efficiency > 50 && performanceMetrics.deliverySuccess > 90,
    recommendations: [
      performanceMetrics.engagementRate < 30 && 'Considere revisar o conteúdo das notificações',
      performanceMetrics.responseTime > 5000 && 'Tempo de resposta alto - otimize as notificações',
      performanceMetrics.memoryUsage > 100 && 'Muitas notificações em memória - execute limpeza',
      performanceMetrics.deliverySuccess < 95 && 'Taxa de entrega baixa - verifique configurações'
    ].filter(Boolean)
  };
};

// Statistics hook
export const useNotificationStats = (period: 'day' | 'week' | 'month' | 'year' = 'week') => {
  const notifications = useSmartNotifications();
  
  const periodStats = useMemo(() => {
    return notifications.getStatsByPeriod(period);
  }, [notifications.getStatsByPeriod, period]);
  
  const engagementMetrics = useMemo(() => {
    return notifications.getEngagementMetrics();
  }, [notifications.getEngagementMetrics]);
  
  const trends = useMemo(() => {
    const currentStats = periodStats;
    const previousPeriod = period === 'day' ? 'week' : 
                          period === 'week' ? 'month' : 'year';
    const previousStats = notifications.getStatsByPeriod(previousPeriod);
    
    return {
      totalChange: currentStats.total - previousStats.total,
      readRateChange: currentStats.readRate - previousStats.readRate,
      engagementChange: engagementMetrics.engagementRate - (previousStats.readRate || 0)
    };
  }, [periodStats, period, notifications.getStatsByPeriod, engagementMetrics]);
  
  return {
    current: periodStats,
    engagement: engagementMetrics,
    trends,
    summary: {
      isGrowing: trends.totalChange > 0,
      isEngaging: periodStats.readRate > 50,
      needsAttention: periodStats.unread > periodStats.total * 0.7
    }
  };
};

// Configuration hook
export const useNotificationConfig = () => {
  const notifications = useSmartNotifications();
  
  const presets = useMemo(() => ({
    minimal: {
      enabled: true,
      maxNotifications: 50,
      autoCleanup: true,
      cleanupDays: 7,
      showDesktop: false,
      playSound: false,
      vibrate: false
    },
    balanced: {
      enabled: true,
      maxNotifications: 200,
      autoCleanup: true,
      cleanupDays: 14,
      showDesktop: true,
      playSound: true,
      vibrate: true
    },
    comprehensive: {
      enabled: true,
      maxNotifications: 1000,
      autoCleanup: true,
      cleanupDays: 30,
      showDesktop: true,
      playSound: true,
      vibrate: true,
      batchDelivery: true
    }
  }), []);
  
  const applyPreset = useCallback((preset: keyof typeof presets) => {
    notifications.updateConfig(presets[preset]);
  }, [notifications.updateConfig, presets]);
  
  return {
    config: notifications.config,
    updateConfig: notifications.updateConfig,
    resetConfig: notifications.resetConfig,
    exportConfig: notifications.exportConfig,
    importConfig: notifications.importConfig,
    presets,
    applyPreset
  };
};

// Debug hook
export const useNotificationDebug = () => {
  const notifications = useSmartNotifications();
  
  const debugInfo = useMemo(() => ({
    state: {
      notificationCount: notifications.notifications.length,
      groupCount: notifications.groups.length,
      ruleCount: notifications.rules.length,
      templateCount: notifications.templates.length,
      channelCount: notifications.channels.length,
      isInitialized: notifications.isInitialized,
      lastUpdate: notifications.lastUpdate
    },
    config: notifications.config,
    stats: notifications.stats,
    performance: {
      memoryUsage: notifications.notifications.length * 0.5,
      processingTime: Date.now() - (notifications.lastUpdate?.getTime() || Date.now()),
      efficiency: notifications.stats.readRate
    }
  }), [notifications]);
  
  const actions = useMemo(() => ({
    clearData: notifications.clearAll,
    resetState: notifications.reset,
    exportDebugInfo: () => JSON.stringify(debugInfo, null, 2),
    validateData: () => {
      const issues = [];
      
      if (notifications.notifications.length > 1000) {
        issues.push('Muitas notificações em memória');
      }
      
      if (notifications.stats.readRate < 20) {
        issues.push('Taxa de leitura muito baixa');
      }
      
      if (notifications.unreadCount > 50) {
        issues.push('Muitas notificações não lidas');
      }
      
      return issues;
    },
    simulateError: () => {
      notifications.createSystemNotification(
        'Erro simulado para teste do sistema de notificações',
        { type: 'debug', severity: 'test' }
      );
    },
    testPerformance: () => {
      const start = performance.now();
      
      // Create multiple notifications
      for (let i = 0; i < 10; i++) {
        notifications.createQuickNotification(
          'info',
          `Teste ${i + 1}`,
          'Notificação de teste de performance'
        );
      }
      
      const end = performance.now();
      
      notifications.createSystemNotification(
        `Teste de performance concluído em ${(end - start).toFixed(2)}ms`,
        { duration: end - start, operations: 10 }
      );
    }
  }), [notifications, debugInfo]);
  
  return {
    info: debugInfo,
    actions,
    logs: [], // Could be implemented with a logging system
    isHealthy: debugInfo.performance.efficiency > 50
  };
};