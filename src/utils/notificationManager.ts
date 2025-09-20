import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  category: 'performance' | 'security' | 'user' | 'system' | 'business';
  priority: 'low' | 'medium' | 'high' | 'critical';
  persistent: boolean;
  autoClose: boolean;
  duration: number; // in milliseconds
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  createdAt: number;
  readAt?: number;
  dismissedAt?: number;
  source: string;
  userId?: string;
  tags: string[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
  icon?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: NotificationCondition[];
  actions: NotificationRuleAction[];
  cooldown: number; // in milliseconds
  lastTriggered?: number;
  triggerCount: number;
  maxTriggers?: number;
  schedule?: NotificationSchedule;
}

export interface NotificationCondition {
  type: 'metric' | 'event' | 'time' | 'user_action' | 'system_state';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
  field: string;
}

export interface NotificationRuleAction {
  type: 'create_notification' | 'send_email' | 'webhook' | 'log' | 'escalate';
  config: Record<string, any>;
}

export interface NotificationSchedule {
  enabled: boolean;
  timezone: string;
  allowedHours: { start: number; end: number };
  allowedDays: number[]; // 0-6, Sunday-Saturday
  quietHours: { start: number; end: number };
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'browser' | 'email' | 'webhook' | 'slack' | 'teams' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
  filters: NotificationFilter[];
}

export interface NotificationFilter {
  type: 'category' | 'priority' | 'source' | 'tag';
  operator: 'include' | 'exclude';
  values: string[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: Notification['type'];
  category: Notification['category'];
  titleTemplate: string;
  messageTemplate: string;
  variables: string[];
  defaultActions?: NotificationAction[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  averageResponseTime: number;
  dismissalRate: number;
}

export interface NotificationConfig {
  enabled: boolean;
  maxNotifications: number;
  defaultDuration: number;
  enableSound: boolean;
  enableBrowserNotifications: boolean;
  enableDesktopNotifications: boolean;
  groupSimilar: boolean;
  showPreview: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  batchDelay: number;
  retentionDays: number;
}

export interface NotificationDebugLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  source: string;
}

// Store
interface NotificationStore {
  // State
  notifications: Notification[];
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
  updateStats: () => void;
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
}

// Default configuration
const defaultConfig: NotificationConfig = {
  enabled: true,
  maxNotifications: 100,
  defaultDuration: 5000,
  enableSound: true,
  enableBrowserNotifications: true,
  enableDesktopNotifications: false,
  groupSimilar: true,
  showPreview: true,
  position: 'top-right',
  theme: 'auto',
  animations: true,
  batchDelay: 1000,
  retentionDays: 30
};

// Create store
export const useNotificationStore = create<NotificationStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  notifications: [],
  rules: [],
  channels: [],
  templates: [],
  stats: {
    total: 0,
    unread: 0,
    byType: {},
    byCategory: {},
    byPriority: {},
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    averageResponseTime: 0,
    dismissalRate: 0
  },
  config: defaultConfig,
  debugLogs: [],
  isLoading: false,
  error: null,
  
  // Notification Management
  createNotification: (notificationData) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: Date.now()
    };
    
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, state.config.maxNotifications)
    }));
    
    get().addDebugLog('info', `Created notification: ${notification.title}`, { id }, 'NotificationManager');
    get().updateStats();
    
    // Auto-dismiss if configured
    if (notification.autoClose && notification.duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, notification.duration);
    }
    
    return id;
  },
  
  updateNotification: (id, updates) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id ? { ...notification, ...updates } : notification
      )
    }));
    get().updateStats();
  },
  
  deleteNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== id)
    }));
    get().updateStats();
  },
  
  markAsRead: (id) => {
    const now = Date.now();
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id ? { ...notification, readAt: now } : notification
      )
    }));
    get().updateStats();
  },
  
  markAllAsRead: () => {
    const now = Date.now();
    set((state) => ({
      notifications: state.notifications.map(notification => ({ ...notification, readAt: now }))
    }));
    get().updateStats();
  },
  
  dismissNotification: (id) => {
    const now = Date.now();
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id ? { ...notification, dismissedAt: now } : notification
      )
    }));
    get().updateStats();
  },
  
  dismissAll: () => {
    const now = Date.now();
    set((state) => ({
      notifications: state.notifications.map(notification => ({ ...notification, dismissedAt: now }))
    }));
    get().updateStats();
  },
  
  // Rule Management
  createRule: (ruleData) => {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rule: NotificationRule = {
      ...ruleData,
      id,
      triggerCount: 0
    };
    
    set((state) => ({ rules: [...state.rules, rule] }));
    get().addDebugLog('info', `Created notification rule: ${rule.name}`, { id }, 'NotificationManager');
    
    return id;
  },
  
  updateRule: (id, updates) => {
    set((state) => ({
      rules: state.rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
    }));
  },
  
  deleteRule: (id) => {
    set((state) => ({ rules: state.rules.filter(rule => rule.id !== id) }));
  },
  
  toggleRule: (id) => {
    set((state) => ({
      rules: state.rules.map(rule =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    }));
  },
  
  testRule: (id, testData) => {
    const rule = get().rules.find(r => r.id === id);
    if (!rule) return false;
    
    // Simple condition evaluation (would be more complex in real implementation)
    return rule.conditions.every(condition => {
      const fieldValue = testData[condition.field];
      switch (condition.operator) {
        case 'equals': return fieldValue === condition.value;
        case 'not_equals': return fieldValue !== condition.value;
        case 'greater_than': return fieldValue > condition.value;
        case 'less_than': return fieldValue < condition.value;
        case 'contains': return String(fieldValue).includes(condition.value);
        default: return false;
      }
    });
  },
  
  // Channel Management
  createChannel: (channelData) => {
    const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channel: NotificationChannel = { ...channelData, id };
    
    set((state) => ({ channels: [...state.channels, channel] }));
    get().addDebugLog('info', `Created notification channel: ${channel.name}`, { id }, 'NotificationManager');
    
    return id;
  },
  
  updateChannel: (id, updates) => {
    set((state) => ({
      channels: state.channels.map(channel => channel.id === id ? { ...channel, ...updates } : channel)
    }));
  },
  
  deleteChannel: (id) => {
    set((state) => ({ channels: state.channels.filter(channel => channel.id !== id) }));
  },
  
  toggleChannel: (id) => {
    set((state) => ({
      channels: state.channels.map(channel =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
      )
    }));
  },
  
  testChannel: async (id, notification) => {
    const channel = get().channels.find(c => c.id === id);
    if (!channel || !channel.enabled) return false;
    
    // Simulate channel test
    await new Promise(resolve => setTimeout(resolve, 1000));
    get().addDebugLog('info', `Tested channel: ${channel.name}`, { channelId: id, notificationId: notification.id }, 'NotificationManager');
    
    return Math.random() > 0.1; // 90% success rate
  },
  
  // Template Management
  createTemplate: (templateData) => {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const template: NotificationTemplate = { ...templateData, id };
    
    set((state) => ({ templates: [...state.templates, template] }));
    get().addDebugLog('info', `Created notification template: ${template.name}`, { id }, 'NotificationManager');
    
    return id;
  },
  
  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map(template => template.id === id ? { ...template, ...updates } : template)
    }));
  },
  
  deleteTemplate: (id) => {
    set((state) => ({ templates: state.templates.filter(template => template.id !== id) }));
  },
  
  renderTemplate: (templateId, variables) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return { title: '', message: '' };
    
    let title = template.titleTemplate;
    let message = template.messageTemplate;
    
    // Simple variable substitution
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return { title, message };
  },
  
  // Configuration
  updateConfig: (updates) => {
    set((state) => ({ config: { ...state.config, ...updates } }));
    get().addDebugLog('info', 'Updated notification configuration', updates, 'NotificationManager');
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
    get().addDebugLog('info', 'Reset notification configuration to defaults', null, 'NotificationManager');
  },
  
  // Analytics
  updateStats: () => {
    const { notifications } = get();
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.readAt && !n.dismissedAt).length,
      byType: {},
      byCategory: {},
      byPriority: {},
      todayCount: notifications.filter(n => n.createdAt >= today).length,
      weekCount: notifications.filter(n => n.createdAt >= weekAgo).length,
      monthCount: notifications.filter(n => n.createdAt >= monthAgo).length,
      averageResponseTime: 0,
      dismissalRate: 0
    };
    
    // Calculate by type, category, priority
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });
    
    // Calculate response time and dismissal rate
    const respondedNotifications = notifications.filter(n => n.readAt || n.dismissedAt);
    if (respondedNotifications.length > 0) {
      const totalResponseTime = respondedNotifications.reduce((sum, n) => {
        const responseTime = (n.readAt || n.dismissedAt!) - n.createdAt;
        return sum + responseTime;
      }, 0);
      stats.averageResponseTime = totalResponseTime / respondedNotifications.length;
      stats.dismissalRate = (notifications.filter(n => n.dismissedAt).length / notifications.length) * 100;
    }
    
    set({ stats });
  },
  
  getNotificationsByDateRange: (startDate, endDate) => {
    const { notifications } = get();
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return notifications.filter(notification => 
      notification.createdAt >= start && notification.createdAt <= end
    );
  },
  
  getTopCategories: (limit = 5) => {
    const { stats } = get();
    return Object.entries(stats.byCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
  
  getResponseTimeMetrics: () => {
    const { notifications } = get();
    const responseTimes = notifications
      .filter(n => n.readAt || n.dismissedAt)
      .map(n => (n.readAt || n.dismissedAt!) - n.createdAt)
      .sort((a, b) => a - b);
    
    if (responseTimes.length === 0) {
      return { average: 0, median: 0, p95: 0 };
    }
    
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const median = responseTimes[Math.floor(responseTimes.length / 2)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    
    return { average, median, p95 };
  },
  
  // Utilities
  formatNotification: (notification) => {
    return `[${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`;
  },
  
  getNotificationIcon: (type) => {
    const icons = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      system: '⚙️'
    };
    return icons[type] || '📢';
  },
  
  getNotificationColor: (type) => {
    const colors = {
      info: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      system: 'text-gray-600'
    };
    return colors[type] || 'text-gray-600';
  },
  
  getPriorityColor: (priority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      critical: 'text-red-500'
    };
    return colors[priority] || 'text-gray-500';
  },
  
  // Quick Actions
  quickActions: {
    createSystemAlert: (message, priority = 'medium') => {
      return get().createNotification({
        type: 'system',
        title: 'System Alert',
        message,
        category: 'system',
        priority,
        persistent: priority === 'critical',
        autoClose: priority !== 'critical',
        duration: priority === 'critical' ? 0 : 10000,
        source: 'system',
        tags: ['system', 'alert']
      });
    },
    
    createPerformanceAlert: (metric, value, threshold) => {
      const priority: Notification['priority'] = value > threshold * 2 ? 'critical' : 
                                                 value > threshold * 1.5 ? 'high' : 'medium';
      
      return get().createNotification({
        type: 'warning',
        title: 'Performance Alert',
        message: `${metric} is ${value.toFixed(2)}, exceeding threshold of ${threshold}`,
        category: 'performance',
        priority,
        persistent: priority === 'critical',
        autoClose: priority !== 'critical',
        duration: 8000,
        source: 'performance-monitor',
        tags: ['performance', metric],
        metadata: { metric, value, threshold }
      });
    },
    
    createSecurityAlert: (event, severity) => {
      const priorityMap = { low: 'medium', medium: 'high', high: 'critical' } as const;
      
      return get().createNotification({
        type: 'error',
        title: 'Security Alert',
        message: `Security event detected: ${event}`,
        category: 'security',
        priority: priorityMap[severity],
        persistent: severity === 'high',
        autoClose: severity !== 'high',
        duration: severity === 'high' ? 0 : 15000,
        source: 'security-monitor',
        tags: ['security', event, severity]
      });
    },
    
    createUserNotification: (userId, message) => {
      return get().createNotification({
        type: 'info',
        title: 'User Notification',
        message,
        category: 'user',
        priority: 'low',
        persistent: false,
        autoClose: true,
        duration: 5000,
        source: 'user-system',
        userId,
        tags: ['user', userId]
      });
    },
    
    setupDefaultRules: () => {
      const defaultRules = [
        {
          name: 'High CPU Usage',
          description: 'Alert when CPU usage exceeds 80%',
          enabled: true,
          conditions: [{
            type: 'metric' as const,
            operator: 'greater_than' as const,
            value: 80,
            field: 'cpu_usage'
          }],
          actions: [{
            type: 'create_notification' as const,
            config: {
              type: 'warning',
              title: 'High CPU Usage',
              category: 'performance',
              priority: 'high'
            }
          }],
          cooldown: 300000 // 5 minutes
        },
        {
          name: 'Error Rate Spike',
          description: 'Alert when error rate exceeds 5%',
          enabled: true,
          conditions: [{
            type: 'metric' as const,
            operator: 'greater_than' as const,
            value: 5,
            field: 'error_rate'
          }],
          actions: [{
            type: 'create_notification' as const,
            config: {
              type: 'error',
              title: 'Error Rate Spike',
              category: 'system',
              priority: 'critical'
            }
          }],
          cooldown: 600000 // 10 minutes
        }
      ];
      
      defaultRules.forEach(rule => get().createRule(rule));
      get().addDebugLog('info', 'Setup default notification rules', { count: defaultRules.length }, 'NotificationManager');
    },
    
    setupDefaultChannels: () => {
      const defaultChannels = [
        {
          name: 'Browser Notifications',
          type: 'browser' as const,
          enabled: true,
          config: {},
          filters: []
        },
        {
          name: 'Email Alerts',
          type: 'email' as const,
          enabled: false,
          config: { smtp: 'localhost' },
          filters: [{
            type: 'priority' as const,
            operator: 'include' as const,
            values: ['high', 'critical']
          }]
        }
      ];
      
      defaultChannels.forEach(channel => get().createChannel(channel));
      get().addDebugLog('info', 'Setup default notification channels', { count: defaultChannels.length }, 'NotificationManager');
    },
    
    enableAllNotifications: () => {
      set((state) => ({ config: { ...state.config, enabled: true } }));
      set((state) => ({
        channels: state.channels.map(channel => ({ ...channel, enabled: true }))
      }));
      get().addDebugLog('info', 'Enabled all notifications', null, 'NotificationManager');
    },
    
    disableAllNotifications: () => {
      set((state) => ({ config: { ...state.config, enabled: false } }));
      set((state) => ({
        channels: state.channels.map(channel => ({ ...channel, enabled: false }))
      }));
      get().addDebugLog('info', 'Disabled all notifications', null, 'NotificationManager');
    }
  },
  
  // Advanced Features
  advanced: {
    batchCreate: (notificationsData) => {
      const ids: string[] = [];
      notificationsData.forEach(data => {
        ids.push(get().createNotification(data));
      });
      get().addDebugLog('info', `Batch created ${ids.length} notifications`, { ids }, 'NotificationManager');
      return ids;
    },
    
    bulkAction: (ids, action) => {
      ids.forEach(id => {
        switch (action) {
          case 'read':
            get().markAsRead(id);
            break;
          case 'dismiss':
            get().dismissNotification(id);
            break;
          case 'delete':
            get().deleteNotification(id);
            break;
        }
      });
      get().addDebugLog('info', `Bulk ${action} on ${ids.length} notifications`, { ids, action }, 'NotificationManager');
    },
    
    exportNotifications: (format) => {
      const { notifications } = get();
      
      if (format === 'json') {
        return JSON.stringify(notifications, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'Type', 'Title', 'Message', 'Category', 'Priority', 'Created At'];
        const rows = notifications.map(n => [
          n.id,
          n.type,
          n.title,
          n.message,
          n.category,
          n.priority,
          new Date(n.createdAt).toISOString()
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      return '';
    },
    
    importRules: (rules) => {
      rules.forEach(rule => {
        get().createRule(rule);
      });
      get().addDebugLog('info', `Imported ${rules.length} notification rules`, { count: rules.length }, 'NotificationManager');
    },
    
    scheduleNotification: (notificationData, scheduleTime) => {
      const delay = scheduleTime.getTime() - Date.now();
      
      if (delay <= 0) {
        return get().createNotification(notificationData);
      }
      
      const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setTimeout(() => {
        get().createNotification(notificationData);
      }, delay);
      
      get().addDebugLog('info', `Scheduled notification for ${scheduleTime.toISOString()}`, { id, delay }, 'NotificationManager');
      
      return id;
    },
    
    createRecurringNotification: (notificationData, interval) => {
      const id = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const createRecurring = () => {
        get().createNotification(notificationData);
        setTimeout(createRecurring, interval);
      };
      
      setTimeout(createRecurring, interval);
      
      get().addDebugLog('info', `Created recurring notification with ${interval}ms interval`, { id, interval }, 'NotificationManager');
      
      return id;
    },
    
    enableQuietMode: (duration) => {
      const originalConfig = get().config;
      
      set((state) => ({
        config: { ...state.config, enabled: false }
      }));
      
      setTimeout(() => {
        set({ config: originalConfig });
        get().addDebugLog('info', 'Quiet mode disabled', null, 'NotificationManager');
      }, duration);
      
      get().addDebugLog('info', `Enabled quiet mode for ${duration}ms`, { duration }, 'NotificationManager');
    },
    
    disableQuietMode: () => {
      set((state) => ({
        config: { ...state.config, enabled: true }
      }));
      get().addDebugLog('info', 'Manually disabled quiet mode', null, 'NotificationManager');
    }
  },
  
  // System Operations
  cleanup: () => {
    const { config } = get();
    const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.createdAt > cutoffTime),
      debugLogs: state.debugLogs.slice(-1000) // Keep last 1000 debug logs
    }));
    
    get().updateStats();
    get().addDebugLog('info', 'Performed cleanup operation', { cutoffTime }, 'NotificationManager');
  },
  
  clearOldNotifications: (olderThanDays) => {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = get().notifications.length;
    
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.createdAt > cutoffTime)
    }));
    
    const removedCount = initialCount - get().notifications.length;
    get().updateStats();
    get().addDebugLog('info', `Cleared ${removedCount} old notifications`, { olderThanDays, removedCount }, 'NotificationManager');
  },
  
  optimizeStorage: () => {
    // Remove dismissed notifications older than 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    set((state) => ({
      notifications: state.notifications.filter(notification => 
        !notification.dismissedAt || notification.dismissedAt > weekAgo
      )
    }));
    
    get().updateStats();
    get().addDebugLog('info', 'Optimized notification storage', null, 'NotificationManager');
  },
  
  getSystemInfo: () => {
    const { notifications, rules, channels, templates, stats, config } = get();
    
    return {
      notificationCount: notifications.length,
      ruleCount: rules.length,
      channelCount: channels.length,
      templateCount: templates.length,
      stats,
      config,
      memoryUsage: {
        notifications: JSON.stringify(notifications).length,
        rules: JSON.stringify(rules).length,
        channels: JSON.stringify(channels).length,
        templates: JSON.stringify(templates).length
      }
    };
  },
  
  // Debug
  addDebugLog: (level, message, data, source = 'NotificationManager') => {
    const log: NotificationDebugLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data,
      source
    };
    
    set((state) => ({
      debugLogs: [log, ...state.debugLogs].slice(0, 1000) // Keep last 1000 logs
    }));
  },
  
  clearDebugLogs: () => {
    set({ debugLogs: [] });
  },
  
  exportDebugLogs: () => {
    const { debugLogs } = get();
    return JSON.stringify(debugLogs, null, 2);
  }
})));

// Notification Manager Class
export class NotificationManager {
  private static instance: NotificationManager;
  
  private constructor() {
    this.initialize();
  }
  
  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  private initialize() {
    // Setup browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Setup periodic cleanup
    setInterval(() => {
      useNotificationStore.getState().cleanup();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
    
    // Setup stats update
    setInterval(() => {
      useNotificationStore.getState().updateStats();
    }, 60 * 1000); // Update stats every minute
  }
  
  public notify(notification: Omit<Notification, 'id' | 'createdAt'>) {
    return useNotificationStore.getState().createNotification(notification);
  }
  
  public showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
      
      if (notification.autoClose && notification.duration > 0) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.duration);
      }
    }
  }
}

// Global instance
export const notificationManager = NotificationManager.getInstance();

// Utility functions
export const formatNotificationTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export const getNotificationTypeIcon = (type: Notification['type']): string => {
  const icons = {
    info: '🔵',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    system: '⚙️'
  };
  return icons[type] || '📢';
};

export const getNotificationTypeColor = (type: Notification['type']): string => {
  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    system: 'bg-gray-500'
  };
  return colors[type] || 'bg-gray-500';
};

export const getPriorityIcon = (priority: Notification['priority']): string => {
  const icons = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };
  return icons[priority] || '⚪';
};

export const getPriorityColor = (priority: Notification['priority']): string => {
  const colors = {
    low: 'bg-gray-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };
  return colors[priority] || 'bg-gray-500';
};