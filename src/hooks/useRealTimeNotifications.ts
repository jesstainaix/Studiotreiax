import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'user' | 'project' | 'collaboration' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  userId?: string;
  projectId?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: () => void;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: NotificationCondition[];
  actions: NotificationRuleAction[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  throttle?: number; // milliseconds
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  value: any;
}

export interface NotificationRuleAction {
  type: 'notify' | 'email' | 'webhook' | 'sound' | 'desktop';
  config: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'websocket' | 'sse' | 'polling' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
  lastConnected?: Date;
  status: 'connected' | 'disconnected' | 'error';
}

export interface NotificationMetrics {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  notificationsByType: Record<string, number>;
  notificationsByCategory: Record<string, number>;
  notificationsByPriority: Record<string, number>;
  averageReadTime: number;
  clickThroughRate: number;
  dismissalRate: number;
  responseTime: number;
  deliveryRate: number;
  errorRate: number;
}

export interface NotificationConfig {
  enabled: boolean;
  maxNotifications: number;
  autoMarkAsRead: boolean;
  autoMarkAsReadDelay: number;
  showDesktopNotifications: boolean;
  playSound: boolean;
  soundVolume: number;
  groupSimilar: boolean;
  groupingWindow: number;
  persistentTypes: string[];
  channels: NotificationChannel[];
  defaultExpiration: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  throttleDelay: number;
}

export interface NotificationState {
  notifications: Notification[];
  rules: NotificationRule[];
  templates: NotificationTemplate[];
  channels: NotificationChannel[];
  metrics: NotificationMetrics;
  config: NotificationConfig;
  isConnected: boolean;
  lastSync: Date | null;
  queue: Notification[];
  processing: boolean;
}

// Default configuration
const defaultConfig: NotificationConfig = {
  enabled: true,
  maxNotifications: 100,
  autoMarkAsRead: false,
  autoMarkAsReadDelay: 5000,
  showDesktopNotifications: true,
  playSound: true,
  soundVolume: 0.5,
  groupSimilar: true,
  groupingWindow: 30000,
  persistentTypes: ['error', 'critical'],
  channels: [
    {
      id: 'websocket',
      name: 'WebSocket',
      type: 'websocket',
      enabled: true,
      config: { url: 'ws://localhost:3001/notifications' },
      status: 'disconnected'
    }
  ],
  defaultExpiration: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000,
  batchSize: 10,
  throttleDelay: 100
};

// Notification Engine
class RealTimeNotificationsEngine {
  private notifications: Notification[] = [];
  private rules: NotificationRule[] = [];
  private templates: NotificationTemplate[] = [];
  private channels: NotificationChannel[] = [];
  private config: NotificationConfig;
  private metrics: NotificationMetrics;
  private websocket: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private queue: Notification[] = [];
  private processing = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private onStateChange: ((state: NotificationState) => void) | null = null;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.metrics = this.initializeMetrics();
    this.initializeChannels();
    this.startProcessingQueue();
  }

  private initializeMetrics(): NotificationMetrics {
    return {
      totalNotifications: 0,
      unreadCount: 0,
      readCount: 0,
      notificationsByType: {},
      notificationsByCategory: {},
      notificationsByPriority: {},
      averageReadTime: 0,
      clickThroughRate: 0,
      dismissalRate: 0,
      responseTime: 0,
      deliveryRate: 0,
      errorRate: 0
    };
  }

  private initializeChannels(): void {
    this.config.channels.forEach(channel => {
      if (channel.enabled) {
        this.connectChannel(channel);
      }
    });
  }

  private connectChannel(channel: NotificationChannel): void {
    try {
      switch (channel.type) {
        case 'websocket':
          this.connectWebSocket(channel);
          break;
        case 'sse':
          this.connectSSE(channel);
          break;
        case 'polling':
          this.startPolling(channel);
          break;
      }
    } catch (error) {
      console.error(`Failed to connect to channel ${channel.name}:`, error);
      channel.status = 'error';
      this.updateMetrics();
    }
  }

  private connectWebSocket(channel: NotificationChannel): void {
    if (this.websocket) {
      this.websocket.close();
    }

    this.websocket = new WebSocket(channel.config.url);

    this.websocket.onopen = () => {
      channel.status = 'connected';
      channel.lastConnected = new Date();
      this.updateState();
    };

    this.websocket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        this.addNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    this.websocket.onclose = () => {
      channel.status = 'disconnected';
      this.updateState();
      
      // Attempt to reconnect
      setTimeout(() => {
        if (channel.enabled) {
          this.connectWebSocket(channel);
        }
      }, this.config.retryDelay);
    };

    this.websocket.onerror = () => {
      channel.status = 'error';
      this.updateState();
    };
  }

  private connectSSE(channel: NotificationChannel): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(channel.config.url);

    this.eventSource.onopen = () => {
      channel.status = 'connected';
      channel.lastConnected = new Date();
      this.updateState();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        this.addNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    this.eventSource.onerror = () => {
      channel.status = 'error';
      this.updateState();
    };
  }

  private startPolling(channel: NotificationChannel): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(channel.config.url);
        const notifications = await response.json();
        
        notifications.forEach((notification: Notification) => {
          this.addNotification(notification);
        });
        
        channel.status = 'connected';
        channel.lastConnected = new Date();
      } catch (error) {
        channel.status = 'error';
        console.error('Polling failed:', error);
      }
      
      this.updateState();
    }, channel.config.interval || 5000);
  }

  private startProcessingQueue(): void {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processQueue();
      }
    }, this.config.throttleDelay);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.config.batchSize);

    for (const notification of batch) {
      try {
        await this.processNotification(notification);
      } catch (error) {
        console.error('Failed to process notification:', error);
        this.metrics.errorRate++;
      }
    }

    this.processing = false;
    this.updateState();
  }

  private async processNotification(notification: Notification): Promise<void> {
    // Check rules
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && this.matchesConditions(notification, rule.conditions)
    );

    // Apply rule actions
    for (const rule of applicableRules) {
      await this.executeRuleActions(notification, rule);
    }

    // Add to notifications list
    this.notifications.unshift(notification);

    // Enforce max notifications limit
    if (this.notifications.length > this.config.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.config.maxNotifications);
    }

    // Show desktop notification
    if (this.config.showDesktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: this.getNotificationIcon(notification.type)
        });
      }
    }

    // Play sound
    if (this.config.playSound) {
      this.playNotificationSound(notification.type);
    }

    // Auto mark as read
    if (this.config.autoMarkAsRead) {
      setTimeout(() => {
        this.markAsRead(notification.id);
      }, this.config.autoMarkAsReadDelay);
    }

    // Set expiration
    if (!notification.persistent && !notification.expiresAt) {
      notification.expiresAt = new Date(Date.now() + this.config.defaultExpiration);
    }

    this.updateMetrics();
  }

  private matchesConditions(notification: Notification, conditions: NotificationCondition[]): boolean {
    return conditions.every(condition => {
      const value = this.getNotificationValue(notification, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater':
          return Number(value) > Number(condition.value);
        case 'less':
          return Number(value) < Number(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(String(value));
        default:
          return false;
      }
    });
  }

  private getNotificationValue(notification: Notification, field: string): any {
    const fields = field.split('.');
    let value: any = notification;
    
    for (const f of fields) {
      value = value?.[f];
    }
    
    return value;
  }

  private async executeRuleActions(notification: Notification, rule: NotificationRule): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'notify':
            // Already handled by default processing
            break;
          case 'email':
            await this.sendEmail(notification, action.config);
            break;
          case 'webhook':
            await this.callWebhook(notification, action.config);
            break;
          case 'sound':
            this.playCustomSound(action.config);
            break;
          case 'desktop':
            this.showDesktopNotification(notification, action.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute rule action ${action.type}:`, error);
      }
    }
  }

  private async sendEmail(notification: Notification, config: any): Promise<void> {
    // Implementation would depend on email service
  }

  private async callWebhook(notification: Notification, config: any): Promise<void> {
    try {
      await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Webhook call failed:', error);
    }
  }

  private playCustomSound(config: any): void {
    const audio = new Audio(config.url);
    audio.volume = config.volume || this.config.soundVolume;
    audio.play().catch(console.error);
  }

  private showDesktopNotification(notification: Notification, config: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(config.title || notification.title, {
        body: config.message || notification.message,
        icon: config.icon || this.getNotificationIcon(notification.type)
      });
    }
  }

  private getNotificationIcon(type: string): string {
    const icons = {
      info: '/icons/info.png',
      success: '/icons/success.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  private playNotificationSound(type: string): void {
    const sounds = {
      info: '/sounds/info.mp3',
      success: '/sounds/success.mp3',
      warning: '/sounds/warning.mp3',
      error: '/sounds/error.mp3'
    };
    
    const audio = new Audio(sounds[type as keyof typeof sounds] || sounds.info);
    audio.volume = this.config.soundVolume;
    audio.play().catch(console.error);
  }

  private updateMetrics(): void {
    this.metrics.totalNotifications = this.notifications.length;
    this.metrics.unreadCount = this.notifications.filter(n => !n.read).length;
    this.metrics.readCount = this.notifications.filter(n => n.read).length;
    
    // Group by type
    this.metrics.notificationsByType = this.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by category
    this.metrics.notificationsByCategory = this.notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by priority
    this.metrics.notificationsByPriority = this.notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    this.updateState();
  }

  private updateState(): void {
    if (this.onStateChange) {
      this.onStateChange({
        notifications: this.notifications,
        rules: this.rules,
        templates: this.templates,
        channels: this.channels,
        metrics: this.metrics,
        config: this.config,
        isConnected: this.channels.some(c => c.status === 'connected'),
        lastSync: new Date(),
        queue: this.queue,
        processing: this.processing
      });
    }
  }

  // Public methods
  public addNotification(notification: Partial<Notification>): void {
    const fullNotification: Notification = {
      id: notification.id || `notification-${Date.now()}-${Math.random()}`,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      category: notification.category || 'system',
      priority: notification.priority || 'medium',
      timestamp: notification.timestamp || new Date(),
      read: notification.read || false,
      persistent: notification.persistent || false,
      actions: notification.actions || [],
      metadata: notification.metadata || {},
      expiresAt: notification.expiresAt,
      userId: notification.userId,
      projectId: notification.projectId
    };

    this.queue.push(fullNotification);
  }

  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.updateMetrics();
    }
  }

  public markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateMetrics();
  }

  public removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.updateMetrics();
  }

  public clearAll(): void {
    this.notifications = [];
    this.updateMetrics();
  }

  public addRule(rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newRule: NotificationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.rules.push(newRule);
    this.updateState();
  }

  public updateRule(ruleId: string, updates: Partial<NotificationRule>): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date() });
      this.updateState();
    }
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.updateState();
  }

  public addTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templates.push(newTemplate);
    this.updateState();
  }

  public updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): void {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      Object.assign(template, updates, { updatedAt: new Date() });
      this.updateState();
    }
  }

  public removeTemplate(templateId: string): void {
    this.templates = this.templates.filter(t => t.id !== templateId);
    this.updateState();
  }

  public updateConfig(updates: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.updateState();
  }

  public requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  public exportData(): any {
    return {
      notifications: this.notifications,
      rules: this.rules,
      templates: this.templates,
      config: this.config,
      exportedAt: new Date().toISOString()
    };
  }

  public importData(data: any): void {
    if (data.notifications) {
      this.notifications = data.notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
      }));
    }
    
    if (data.rules) {
      this.rules = data.rules.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt)
      }));
    }
    
    if (data.templates) {
      this.templates = data.templates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
    }
    
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    
    this.updateMetrics();
  }

  public setStateChangeHandler(handler: (state: NotificationState) => void): void {
    this.onStateChange = handler;
  }

  public destroy(): void {
    if (this.websocket) {
      this.websocket.close();
    }
    
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.throttleTimeouts.forEach(timeout => clearTimeout(timeout));
  }
}

// Hook
export const useRealTimeNotifications = (config?: Partial<NotificationConfig>) => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    rules: [],
    templates: [],
    channels: [],
    metrics: {
      totalNotifications: 0,
      unreadCount: 0,
      readCount: 0,
      notificationsByType: {},
      notificationsByCategory: {},
      notificationsByPriority: {},
      averageReadTime: 0,
      clickThroughRate: 0,
      dismissalRate: 0,
      responseTime: 0,
      deliveryRate: 0,
      errorRate: 0
    },
    config: defaultConfig,
    isConnected: false,
    lastSync: null,
    queue: [],
    processing: false
  });

  const engineRef = useRef<RealTimeNotificationsEngine | null>(null);

  useEffect(() => {
    engineRef.current = new RealTimeNotificationsEngine(config);
    engineRef.current.setStateChangeHandler(setState);

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  const actions = {
    addNotification: useCallback((notification: Partial<Notification>) => {
      engineRef.current?.addNotification(notification);
    }, []),

    markAsRead: useCallback((notificationId: string) => {
      engineRef.current?.markAsRead(notificationId);
    }, []),

    markAllAsRead: useCallback(() => {
      engineRef.current?.markAllAsRead();
    }, []),

    removeNotification: useCallback((notificationId: string) => {
      engineRef.current?.removeNotification(notificationId);
    }, []),

    clearAll: useCallback(() => {
      engineRef.current?.clearAll();
    }, []),

    addRule: useCallback((rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
      engineRef.current?.addRule(rule);
    }, []),

    updateRule: useCallback((ruleId: string, updates: Partial<NotificationRule>) => {
      engineRef.current?.updateRule(ruleId, updates);
    }, []),

    removeRule: useCallback((ruleId: string) => {
      engineRef.current?.removeRule(ruleId);
    }, []),

    addTemplate: useCallback((template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      engineRef.current?.addTemplate(template);
    }, []),

    updateTemplate: useCallback((templateId: string, updates: Partial<NotificationTemplate>) => {
      engineRef.current?.updateTemplate(templateId, updates);
    }, []),

    removeTemplate: useCallback((templateId: string) => {
      engineRef.current?.removeTemplate(templateId);
    }, []),

    updateConfig: useCallback((updates: Partial<NotificationConfig>) => {
      engineRef.current?.updateConfig(updates);
    }, []),

    requestPermission: useCallback(() => {
      return engineRef.current?.requestPermission() || Promise.resolve('denied');
    }, []),

    exportData: useCallback(() => {
      return engineRef.current?.exportData();
    }, []),

    importData: useCallback((data: any) => {
      engineRef.current?.importData(data);
    }, [])
  };

  return {
    ...state,
    actions
  };
};

export default useRealTimeNotifications;