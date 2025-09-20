import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void | Promise<void>;
  icon?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    type?: NotificationType[];
    priority?: NotificationPriority[];
    category?: string[];
    keywords?: string[];
    timeRange?: { start: string; end: string };
    frequency?: { max: number; period: number };
  };
  actions: {
    autoRead?: boolean;
    autoArchive?: boolean;
    forward?: string[];
    sound?: string;
    vibration?: boolean;
    desktop?: boolean;
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: string;
  title: string;
  message: string;
  actions?: NotificationAction[];
  variables?: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'slack' | 'discord';
  config: Record<string, any>;
  enabled: boolean;
  filters?: {
    types?: NotificationType[];
    priorities?: NotificationPriority[];
    categories?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'system' 
  | 'user' 
  | 'security' 
  | 'performance' 
  | 'update' 
  | 'reminder';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  status: NotificationStatus;
  read: boolean;
  archived: boolean;
  starred: boolean;
  tags: string[];
  source: string;
  userId?: string;
  groupId?: string;
  relatedId?: string;
  expiresAt?: Date;
  scheduledAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationGroup {
  id: string;
  name: string;
  description: string;
  notifications: SmartNotification[];
  collapsed: boolean;
  priority: NotificationPriority;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byCategory: Record<string, number>;
  byStatus: Record<NotificationStatus, number>;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  averageResponseTime: number;
  deliveryRate: number;
  readRate: number;
  actionRate: number;
}

export interface NotificationConfig {
  enabled: boolean;
  maxNotifications: number;
  autoCleanup: boolean;
  cleanupDays: number;
  groupSimilar: boolean;
  showDesktop: boolean;
  playSound: boolean;
  vibrate: boolean;
  batchDelivery: boolean;
  batchInterval: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    days: number[];
  };
  priorities: Record<NotificationPriority, {
    color: string;
    sound?: string;
    timeout: number;
    persistent: boolean;
  }>;
  categories: Record<string, {
    color: string;
    icon: string;
    enabled: boolean;
  }>;
}

// Store
interface NotificationStore {
  // State
  notifications: SmartNotification[];
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
}

const defaultConfig: NotificationConfig = {
  enabled: true,
  maxNotifications: 1000,
  autoCleanup: true,
  cleanupDays: 30,
  groupSimilar: true,
  showDesktop: true,
  playSound: true,
  vibrate: true,
  batchDelivery: false,
  batchInterval: 5000,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6]
  },
  priorities: {
    low: { color: '#6B7280', timeout: 3000, persistent: false },
    medium: { color: '#3B82F6', timeout: 5000, persistent: false },
    high: { color: '#F59E0B', timeout: 8000, persistent: true },
    urgent: { color: '#EF4444', timeout: 0, persistent: true },
    critical: { color: '#DC2626', sound: 'alert', timeout: 0, persistent: true }
  },
  categories: {
    system: { color: '#6366F1', icon: 'Settings', enabled: true },
    security: { color: '#DC2626', icon: 'Shield', enabled: true },
    performance: { color: '#F59E0B', icon: 'Zap', enabled: true },
    user: { color: '#10B981', icon: 'User', enabled: true },
    update: { color: '#3B82F6', icon: 'Download', enabled: true }
  }
};

const defaultStats: NotificationStats = {
  total: 0,
  unread: 0,
  byType: {
    info: 0, success: 0, warning: 0, error: 0, system: 0,
    user: 0, security: 0, performance: 0, update: 0, reminder: 0
  },
  byPriority: {
    low: 0, medium: 0, high: 0, urgent: 0, critical: 0
  },
  byCategory: {},
  byStatus: {
    unread: 0, read: 0, archived: 0, deleted: 0
  },
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
  averageResponseTime: 0,
  deliveryRate: 100,
  readRate: 0,
  actionRate: 0
};

export const useNotificationStore = create<NotificationStore>()(subscribeWithSelector((set, get) => ({
  // State
  notifications: [],
  groups: [],
  rules: [],
  templates: [],
  channels: [],
  stats: { ...defaultStats },
  config: { ...defaultConfig },
  isInitialized: false,
  lastUpdate: null,
  
  // Notification Actions
  addNotification: (notification) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newNotification: SmartNotification = {
      ...notification,
      id,
      status: 'unread',
      read: false,
      archived: false,
      starred: false,
      tags: notification.tags || [],
      createdAt: now,
      updatedAt: now
    };
    
    set(state => {
      const notifications = [newNotification, ...state.notifications];
      
      // Apply cleanup if needed
      if (state.config.maxNotifications > 0 && notifications.length > state.config.maxNotifications) {
        notifications.splice(state.config.maxNotifications);
      }
      
      return {
        notifications,
        lastUpdate: now
      };
    });
    
    // Update stats
    get().updateStats();
    
    // Apply rules
    const rules = get().rules.filter(rule => rule.enabled);
    rules.forEach(rule => {
      if (get().testRule(rule.id, newNotification)) {
        // Apply rule actions
        if (rule.actions.autoRead) {
          get().markAsRead(id);
        }
        if (rule.actions.autoArchive) {
          get().archiveNotification(id);
        }
      }
    });
    
    return id;
  },
  
  updateNotification: (id, updates) => {
    set(state => ({
      notifications: state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, ...updates, updatedAt: new Date() }
          : notification
      ),
      lastUpdate: new Date()
    }));
    get().updateStats();
  },
  
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(notification => notification.id !== id),
      lastUpdate: new Date()
    }));
    get().updateStats();
  },
  
  markAsRead: (id) => {
    get().updateNotification(id, { read: true, status: 'read', readAt: new Date() });
  },
  
  markAsUnread: (id) => {
    get().updateNotification(id, { read: false, status: 'unread', readAt: undefined });
  },
  
  archiveNotification: (id) => {
    get().updateNotification(id, { archived: true, status: 'archived', archivedAt: new Date() });
  },
  
  unarchiveNotification: (id) => {
    get().updateNotification(id, { archived: false, status: 'read', archivedAt: undefined });
  },
  
  starNotification: (id) => {
    get().updateNotification(id, { starred: true });
  },
  
  unstarNotification: (id) => {
    get().updateNotification(id, { starred: false });
  },
  
  addTag: (id, tag) => {
    const notification = get().notifications.find(n => n.id === id);
    if (notification && !notification.tags.includes(tag)) {
      get().updateNotification(id, { tags: [...notification.tags, tag] });
    }
  },
  
  removeTag: (id, tag) => {
    const notification = get().notifications.find(n => n.id === id);
    if (notification) {
      get().updateNotification(id, { tags: notification.tags.filter(t => t !== tag) });
    }
  },
  
  bulkAction: (ids, action) => {
    ids.forEach(id => {
      switch (action) {
        case 'read':
          get().markAsRead(id);
          break;
        case 'unread':
          get().markAsUnread(id);
          break;
        case 'archive':
          get().archiveNotification(id);
          break;
        case 'delete':
          get().removeNotification(id);
          break;
        case 'star':
          get().starNotification(id);
          break;
      }
    });
  },
  
  // Group Actions
  createGroup: (group) => {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newGroup: NotificationGroup = {
      ...group,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    set(state => ({
      groups: [...state.groups, newGroup],
      lastUpdate: now
    }));
    
    return id;
  },
  
  updateGroup: (id, updates) => {
    set(state => ({
      groups: state.groups.map(group =>
        group.id === id
          ? { ...group, ...updates, updatedAt: new Date() }
          : group
      ),
      lastUpdate: new Date()
    }));
  },
  
  removeGroup: (id) => {
    set(state => ({
      groups: state.groups.filter(group => group.id !== id),
      lastUpdate: new Date()
    }));
  },
  
  addToGroup: (notificationId, groupId) => {
    const group = get().groups.find(g => g.id === groupId);
    const notification = get().notifications.find(n => n.id === notificationId);
    
    if (group && notification) {
      get().updateGroup(groupId, {
        notifications: [...group.notifications, notification]
      });
      get().updateNotification(notificationId, { groupId });
    }
  },
  
  removeFromGroup: (notificationId, groupId) => {
    const group = get().groups.find(g => g.id === groupId);
    
    if (group) {
      get().updateGroup(groupId, {
        notifications: group.notifications.filter(n => n.id !== notificationId)
      });
      get().updateNotification(notificationId, { groupId: undefined });
    }
  },
  
  collapseGroup: (id) => {
    get().updateGroup(id, { collapsed: true });
  },
  
  expandGroup: (id) => {
    get().updateGroup(id, { collapsed: false });
  },
  
  // Rule Actions
  createRule: (rule) => {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newRule: NotificationRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    set(state => ({
      rules: [...state.rules, newRule],
      lastUpdate: now
    }));
    
    return id;
  },
  
  updateRule: (id, updates) => {
    set(state => ({
      rules: state.rules.map(rule =>
        rule.id === id
          ? { ...rule, ...updates, updatedAt: new Date() }
          : rule
      ),
      lastUpdate: new Date()
    }));
  },
  
  removeRule: (id) => {
    set(state => ({
      rules: state.rules.filter(rule => rule.id !== id),
      lastUpdate: new Date()
    }));
  },
  
  enableRule: (id) => {
    get().updateRule(id, { enabled: true });
  },
  
  disableRule: (id) => {
    get().updateRule(id, { enabled: false });
  },
  
  testRule: (id, notification) => {
    const rule = get().rules.find(r => r.id === id);
    if (!rule || !rule.enabled) return false;
    
    const { conditions } = rule;
    
    // Test type
    if (conditions.type && !conditions.type.includes(notification.type)) {
      return false;
    }
    
    // Test priority
    if (conditions.priority && !conditions.priority.includes(notification.priority)) {
      return false;
    }
    
    // Test category
    if (conditions.category && !conditions.category.includes(notification.category)) {
      return false;
    }
    
    // Test keywords
    if (conditions.keywords) {
      const text = `${notification.title} ${notification.message}`.toLowerCase();
      const hasKeyword = conditions.keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    // Test time range
    if (conditions.timeRange) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = conditions.timeRange.start.split(':').map(Number);
      const [endHour, endMin] = conditions.timeRange.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      if (startTime <= endTime) {
        if (currentTime < startTime || currentTime > endTime) {
          return false;
        }
      } else {
        if (currentTime < startTime && currentTime > endTime) {
          return false;
        }
      }
    }
    
    return true;
  },
  
  // Template Actions
  createTemplate: (template) => {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newTemplate: NotificationTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    set(state => ({
      templates: [...state.templates, newTemplate],
      lastUpdate: now
    }));
    
    return id;
  },
  
  updateTemplate: (id, updates) => {
    set(state => ({
      templates: state.templates.map(template =>
        template.id === id
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ),
      lastUpdate: new Date()
    }));
  },
  
  removeTemplate: (id) => {
    set(state => ({
      templates: state.templates.filter(template => template.id !== id),
      lastUpdate: new Date()
    }));
  },
  
  useTemplate: (id, variables = {}) => {
    const template = get().templates.find(t => t.id === id);
    if (!template || !template.enabled) return '';
    
    let title = template.title;
    let message = template.message;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return get().addNotification({
      type: template.type,
      priority: template.priority,
      category: template.category,
      title,
      message,
      actions: template.actions,
      data: variables,
      source: `template:${template.name}`
    });
  },
  
  // Channel Actions
  createChannel: (channel) => {
    const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newChannel: NotificationChannel = {
      ...channel,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    set(state => ({
      channels: [...state.channels, newChannel],
      lastUpdate: now
    }));
    
    return id;
  },
  
  updateChannel: (id, updates) => {
    set(state => ({
      channels: state.channels.map(channel =>
        channel.id === id
          ? { ...channel, ...updates, updatedAt: new Date() }
          : channel
      ),
      lastUpdate: new Date()
    }));
  },
  
  removeChannel: (id) => {
    set(state => ({
      channels: state.channels.filter(channel => channel.id !== id),
      lastUpdate: new Date()
    }));
  },
  
  testChannel: async (id) => {
    const channel = get().channels.find(c => c.id === id);
    if (!channel) return false;
    
    try {
      // Simulate channel test
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Math.random() > 0.2; // 80% success rate
    } catch (error) {
      console.error('Channel test failed:', error);
      return false;
    }
  },
  
  // Analytics Actions
  updateStats: () => {
    const { notifications } = get();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length,
        system: notifications.filter(n => n.type === 'system').length,
        user: notifications.filter(n => n.type === 'user').length,
        security: notifications.filter(n => n.type === 'security').length,
        performance: notifications.filter(n => n.type === 'performance').length,
        update: notifications.filter(n => n.type === 'update').length,
        reminder: notifications.filter(n => n.type === 'reminder').length
      },
      byPriority: {
        low: notifications.filter(n => n.priority === 'low').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        high: notifications.filter(n => n.priority === 'high').length,
        urgent: notifications.filter(n => n.priority === 'urgent').length,
        critical: notifications.filter(n => n.priority === 'critical').length
      },
      byCategory: notifications.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: {
        unread: notifications.filter(n => n.status === 'unread').length,
        read: notifications.filter(n => n.status === 'read').length,
        archived: notifications.filter(n => n.status === 'archived').length,
        deleted: notifications.filter(n => n.status === 'deleted').length
      },
      todayCount: notifications.filter(n => n.createdAt >= today).length,
      weekCount: notifications.filter(n => n.createdAt >= weekAgo).length,
      monthCount: notifications.filter(n => n.createdAt >= monthAgo).length,
      averageResponseTime: notifications
        .filter(n => n.readAt)
        .reduce((acc, n) => {
          const responseTime = n.readAt!.getTime() - n.createdAt.getTime();
          return acc + responseTime;
        }, 0) / Math.max(1, notifications.filter(n => n.readAt).length),
      deliveryRate: 100, // Assume 100% for now
      readRate: notifications.length > 0 ? (notifications.filter(n => n.read).length / notifications.length) * 100 : 0,
      actionRate: notifications.length > 0 ? (notifications.filter(n => n.actions && n.actions.length > 0).length / notifications.length) * 100 : 0
    };
    
    set({ stats });
  },
  
  getStatsByPeriod: (period) => {
    const { notifications } = get();
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }
    
    const periodNotifications = notifications.filter(n => n.createdAt >= startDate);
    
    return {
      total: periodNotifications.length,
      unread: periodNotifications.filter(n => !n.read).length,
      byType: {
        info: periodNotifications.filter(n => n.type === 'info').length,
        success: periodNotifications.filter(n => n.type === 'success').length,
        warning: periodNotifications.filter(n => n.type === 'warning').length,
        error: periodNotifications.filter(n => n.type === 'error').length,
        system: periodNotifications.filter(n => n.type === 'system').length,
        user: periodNotifications.filter(n => n.type === 'user').length,
        security: periodNotifications.filter(n => n.type === 'security').length,
        performance: periodNotifications.filter(n => n.type === 'performance').length,
        update: periodNotifications.filter(n => n.type === 'update').length,
        reminder: periodNotifications.filter(n => n.type === 'reminder').length
      },
      byPriority: {
        low: periodNotifications.filter(n => n.priority === 'low').length,
        medium: periodNotifications.filter(n => n.priority === 'medium').length,
        high: periodNotifications.filter(n => n.priority === 'high').length,
        urgent: periodNotifications.filter(n => n.priority === 'urgent').length,
        critical: periodNotifications.filter(n => n.priority === 'critical').length
      },
      byCategory: periodNotifications.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: {
        unread: periodNotifications.filter(n => n.status === 'unread').length,
        read: periodNotifications.filter(n => n.status === 'read').length,
        archived: periodNotifications.filter(n => n.status === 'archived').length,
        deleted: periodNotifications.filter(n => n.status === 'deleted').length
      },
      todayCount: periodNotifications.filter(n => {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return n.createdAt >= today;
      }).length,
      weekCount: periodNotifications.filter(n => {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return n.createdAt >= weekAgo;
      }).length,
      monthCount: periodNotifications.filter(n => {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return n.createdAt >= monthAgo;
      }).length,
      averageResponseTime: periodNotifications
        .filter(n => n.readAt)
        .reduce((acc, n) => {
          const responseTime = n.readAt!.getTime() - n.createdAt.getTime();
          return acc + responseTime;
        }, 0) / Math.max(1, periodNotifications.filter(n => n.readAt).length),
      deliveryRate: 100,
      readRate: periodNotifications.length > 0 ? (periodNotifications.filter(n => n.read).length / periodNotifications.length) * 100 : 0,
      actionRate: periodNotifications.length > 0 ? (periodNotifications.filter(n => n.actions && n.actions.length > 0).length / periodNotifications.length) * 100 : 0
    };
  },
  
  getEngagementMetrics: () => {
    const { notifications } = get();
    
    return {
      totalNotifications: notifications.length,
      readNotifications: notifications.filter(n => n.read).length,
      starredNotifications: notifications.filter(n => n.starred).length,
      archivedNotifications: notifications.filter(n => n.archived).length,
      notificationsWithActions: notifications.filter(n => n.actions && n.actions.length > 0).length,
      averageReadTime: notifications
        .filter(n => n.readAt)
        .reduce((acc, n) => acc + (n.readAt!.getTime() - n.createdAt.getTime()), 0) / Math.max(1, notifications.filter(n => n.readAt).length),
      engagementRate: notifications.length > 0 ? (notifications.filter(n => n.read || n.starred || n.archived).length / notifications.length) * 100 : 0
    };
  },
  
  // Config Actions
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates },
      lastUpdate: new Date()
    }));
  },
  
  resetConfig: () => {
    set({
      config: { ...defaultConfig },
      lastUpdate: new Date()
    });
  },
  
  exportConfig: () => {
    const { config } = get();
    return JSON.stringify(config, null, 2);
  },
  
  importConfig: (configStr) => {
    try {
      const config = JSON.parse(configStr);
      set({
        config: { ...defaultConfig, ...config },
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Failed to import config:', error);
    }
  },
  
  // Data Actions
  clearAll: () => {
    set({
      notifications: [],
      groups: [],
      rules: [],
      templates: [],
      channels: [],
      stats: { ...defaultStats },
      lastUpdate: new Date()
    });
  },
  
  exportData: () => {
    const { notifications, groups, rules, templates, channels, config } = get();
    return JSON.stringify({
      notifications,
      groups,
      rules,
      templates,
      channels,
      config,
      exportedAt: new Date().toISOString()
    }, null, 2);
  },
  
  importData: (dataStr) => {
    try {
      const data = JSON.parse(dataStr);
      set({
        notifications: data.notifications || [],
        groups: data.groups || [],
        rules: data.rules || [],
        templates: data.templates || [],
        channels: data.channels || [],
        config: { ...defaultConfig, ...data.config },
        lastUpdate: new Date()
      });
      get().updateStats();
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  },
  
  cleanup: () => {
    const { notifications, config } = get();
    
    if (config.autoCleanup) {
      const cutoffDate = new Date(Date.now() - config.cleanupDays * 24 * 60 * 60 * 1000);
      const cleanedNotifications = notifications.filter(n => 
        n.createdAt > cutoffDate || n.starred || n.priority === 'critical'
      );
      
      set({
        notifications: cleanedNotifications,
        lastUpdate: new Date()
      });
      
      get().updateStats();
    }
  },
  
  // System Actions
  initialize: () => {
    set({
      isInitialized: true,
      lastUpdate: new Date()
    });
    get().updateStats();
  },
  
  shutdown: () => {
    set({
      isInitialized: false,
      lastUpdate: new Date()
    });
  },
  
  reset: () => {
    set({
      notifications: [],
      groups: [],
      rules: [],
      templates: [],
      channels: [],
      stats: { ...defaultStats },
      config: { ...defaultConfig },
      isInitialized: false,
      lastUpdate: null
    });
  }
})));

// Notification Manager Class
class NotificationManager {
  private store = useNotificationStore;
  private intervals: NodeJS.Timeout[] = [];
  private eventListeners: (() => void)[] = [];
  
  constructor() {
    this.setupEventListeners();
    this.startPeriodicTasks();
  }
  
  private setupEventListeners() {
    // Listen for config changes
    const unsubscribeConfig = this.store.subscribe(
      state => state.config,
      (config) => {
        this.handleConfigChange(config);
      }
    );
    
    this.eventListeners.push(unsubscribeConfig);
    
    // Listen for new notifications
    const unsubscribeNotifications = this.store.subscribe(
      state => state.notifications,
      (notifications, prevNotifications) => {
        if (notifications.length > prevNotifications.length) {
          const newNotification = notifications[0];
          this.handleNewNotification(newNotification);
        }
      }
    );
    
    this.eventListeners.push(unsubscribeNotifications);
  }
  
  private startPeriodicTasks() {
    // Update stats every 30 seconds
    const statsInterval = setInterval(() => {
      this.store.getState().updateStats();
    }, 30000);
    
    this.intervals.push(statsInterval);
    
    // Cleanup old notifications daily
    const cleanupInterval = setInterval(() => {
      this.store.getState().cleanup();
    }, 24 * 60 * 60 * 1000);
    
    this.intervals.push(cleanupInterval);
  }
  
  private handleConfigChange(config: NotificationConfig) {
    // Handle config changes
    if (config.autoCleanup) {
      this.store.getState().cleanup();
    }
  }
  
  private handleNewNotification(notification: SmartNotification) {
    const config = this.store.getState().config;
    
    // Check quiet hours
    if (config.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const currentDay = now.getDay();
      
      if (config.quietHours.days.includes(currentDay)) {
        const [startHour, startMin] = config.quietHours.start.split(':').map(Number);
        const [endHour, endMin] = config.quietHours.end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        let inQuietHours = false;
        if (startTime <= endTime) {
          inQuietHours = currentTime >= startTime && currentTime <= endTime;
        } else {
          inQuietHours = currentTime >= startTime || currentTime <= endTime;
        }
        
        if (inQuietHours && notification.priority !== 'critical') {
          return; // Skip notification during quiet hours
        }
      }
    }
    
    // Show desktop notification
    if (config.showDesktop && 'Notification' in window) {
      this.showDesktopNotification(notification);
    }
    
    // Play sound
    if (config.playSound) {
      this.playNotificationSound(notification);
    }
    
    // Vibrate
    if (config.vibrate && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }
  
  private showDesktopNotification(notification: SmartNotification) {
    if (Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical' || notification.priority === 'urgent'
      });
      
      desktopNotification.onclick = () => {
        window.focus();
        this.store.getState().markAsRead(notification.id);
        desktopNotification.close();
      };
      
      // Auto close after timeout
      const config = this.store.getState().config;
      const priorityConfig = config.priorities[notification.priority];
      
      if (priorityConfig.timeout > 0) {
        setTimeout(() => {
          desktopNotification.close();
        }, priorityConfig.timeout);
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  private playNotificationSound(notification: SmartNotification) {
    const config = this.store.getState().config;
    const priorityConfig = config.priorities[notification.priority];
    
    if (priorityConfig.sound) {
      try {
        const audio = new Audio(`/sounds/${priorityConfig.sound}.mp3`);
        audio.volume = 0.5;
        audio.play().catch(console.error);
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    }
  }
  
  public shutdown() {
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    // Remove event listeners
    this.eventListeners.forEach(unsubscribe => unsubscribe());
    this.eventListeners = [];
  }
}

// Global instance
export const notificationManager = new NotificationManager();

// Utility functions
export const formatNotificationTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return 'Agora';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m atrás`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h atrás`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d atrás`;
  }
};

export const getNotificationTypeIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    info: 'Info',
    success: 'CheckCircle',
    warning: 'AlertTriangle',
    error: 'XCircle',
    system: 'Settings',
    user: 'User',
    security: 'Shield',
    performance: 'Zap',
    update: 'Download',
    reminder: 'Clock'
  };
  return icons[type] || 'Bell';
};

export const getNotificationPriorityColor = (priority: NotificationPriority): string => {
  const colors: Record<NotificationPriority, string> = {
    low: '#6B7280',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444',
    critical: '#DC2626'
  };
  return colors[priority] || '#6B7280';
};

export const getNotificationStatusColor = (status: NotificationStatus): string => {
  const colors: Record<NotificationStatus, string> = {
    unread: '#3B82F6',
    read: '#6B7280',
    archived: '#9CA3AF',
    deleted: '#EF4444'
  };
  return colors[status] || '#6B7280';
};

// Custom hook
export const useNotifications = () => {
  const store = useNotificationStore();
  
  return {
    ...store,
    
    // Utility functions
    formatTime: formatNotificationTime,
    getTypeIcon: getNotificationTypeIcon,
    getPriorityColor: getNotificationPriorityColor,
    getStatusColor: getNotificationStatusColor,
    
    // Derived state
    unreadCount: store.notifications.filter(n => !n.read).length,
    starredCount: store.notifications.filter(n => n.starred).length,
    archivedCount: store.notifications.filter(n => n.archived).length,
    criticalCount: store.notifications.filter(n => n.priority === 'critical' && !n.read).length,
    
    // Quick actions
    markAllAsRead: () => {
      const unreadIds = store.notifications.filter(n => !n.read).map(n => n.id);
      store.bulkAction(unreadIds, 'read');
    },
    
    archiveAll: () => {
      const readIds = store.notifications.filter(n => n.read && !n.archived).map(n => n.id);
      store.bulkAction(readIds, 'archive');
    },
    
    deleteAll: () => {
      const archivedIds = store.notifications.filter(n => n.archived).map(n => n.id);
      store.bulkAction(archivedIds, 'delete');
    }
  };
};