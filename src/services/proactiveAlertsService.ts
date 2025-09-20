import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types and Interfaces
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'security' | 'usage' | 'system' | 'collaboration' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: AlertCondition;
  actions: AlertAction[];
  isEnabled: boolean;
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
  triggerCount: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'regex';
  value: number | string;
  timeWindow?: number; // minutes
  aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max';
  threshold?: number;
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push' | 'in_app';
  target: string;
  template?: string;
  priority: 'low' | 'medium' | 'high';
  delay?: number; // seconds
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  title: string;
  message: string;
  category: AlertRule['category'];
  severity: AlertRule['severity'];
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: {
    id: string;
    name: string;
  };
  resolvedBy?: {
    id: string;
    name: string;
  };
  metadata: Record<string, any>;
  affectedResources: string[];
  relatedAlerts: string[];
  escalationLevel: number;
  autoResolved: boolean;
}

export interface MetricData {
  timestamp: Date;
  metric: string;
  value: number;
  tags: Record<string, string>;
  source: string;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: AlertAction['type'];
  config: Record<string, any>;
  isEnabled: boolean;
  testStatus: 'pending' | 'success' | 'failed';
  lastTested?: Date;
  createdAt: Date;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  alertsByCategory: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  escalationRate: number;
  falsePositiveRate: number;
  mttr: number; // Mean Time To Resolution
  mtbf: number; // Mean Time Between Failures
}

export interface AlertConfig {
  enableRealTimeMonitoring: boolean;
  enablePredictiveAlerts: boolean;
  enableAutoResolution: boolean;
  enableEscalation: boolean;
  defaultCooldownPeriod: number;
  maxAlertsPerHour: number;
  retentionPeriod: number; // days
  escalationThreshold: number;
  autoResolveTimeout: number; // minutes
  enableSmartGrouping: boolean;
  enableAnomalyDetection: boolean;
  anomalyThreshold: number;
  enableMaintenanceMode: boolean;
  maintenanceSchedule?: {
    start: Date;
    end: Date;
    recurring: boolean;
  };
}

export interface AlertNotification {
  id: string;
  alertId: string;
  channelId: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
}

export interface AlertTemplate {
  id: string;
  name: string;
  category: AlertRule['category'];
  title: string;
  message: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
}

export interface AlertEscalation {
  id: string;
  alertId: string;
  level: number;
  triggeredAt: Date;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  deadline: Date;
  status: 'pending' | 'acknowledged' | 'completed';
}

// Zustand Store
interface ProactiveAlertsState {
  // State
  rules: AlertRule[];
  alerts: Alert[];
  metrics: MetricData[];
  channels: AlertChannel[];
  notifications: AlertNotification[];
  templates: AlertTemplate[];
  escalations: AlertEscalation[];
  
  // UI State
  selectedRule: AlertRule | null;
  selectedAlert: Alert | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  progress: number;
  processingMessage: string;
  
  // Filters and Search
  searchQuery: string;
  categoryFilter: string | null;
  severityFilter: string | null;
  statusFilter: string | null;
  dateRange: { start: Date; end: Date } | null;
  
  // Configuration
  config: AlertConfig;
  
  // Real-time
  isMonitoring: boolean;
  lastUpdate: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  
  // Analytics
  stats: AlertStats;
  recentActivity: {
    alertsToday: number;
    rulesTriggered: number;
    averageResponseTime: number;
    topCategories: Array<{ category: string; count: number }>;
  };
  
  // Computed
  filteredRules: AlertRule[];
  filteredAlerts: Alert[];
  activeRules: AlertRule[];
  criticalAlerts: Alert[];
  recentAlerts: Alert[];
  alertTrends: Array<{ date: Date; count: number; severity: string }>;
  ruleEffectiveness: Array<{ ruleId: string; accuracy: number; falsePositives: number }>;
  
  // Actions
  // Rule Management
  createRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<AlertRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  testRule: (id: string) => Promise<boolean>;
  duplicateRule: (id: string) => Promise<void>;
  
  // Alert Management
  acknowledgeAlert: (id: string, userId: string) => Promise<void>;
  resolveAlert: (id: string, userId: string, resolution?: string) => Promise<void>;
  suppressAlert: (id: string, duration: number) => Promise<void>;
  escalateAlert: (id: string, level: number) => Promise<void>;
  groupAlerts: (alertIds: string[]) => Promise<void>;
  
  // Monitoring
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  addMetric: (metric: MetricData) => void;
  evaluateRules: () => Promise<void>;
  
  // Channel Management
  createChannel: (channel: Omit<AlertChannel, 'id' | 'createdAt'>) => Promise<void>;
  updateChannel: (id: string, updates: Partial<AlertChannel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  testChannel: (id: string) => Promise<boolean>;
  
  // Notifications
  sendNotification: (alertId: string, channelId: string) => Promise<void>;
  retryNotification: (notificationId: string) => Promise<void>;
  
  // Templates
  createTemplate: (template: Omit<AlertTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<AlertTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Search and Filter
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setSeverityFilter: (severity: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  setDateRange: (range: { start: Date; end: Date } | null) => void;
  clearFilters: () => void;
  
  // Selection
  selectRule: (rule: AlertRule | null) => void;
  selectAlert: (alert: Alert | null) => void;
  
  // Configuration
  updateConfig: (updates: Partial<AlertConfig>) => Promise<void>;
  
  // Quick Actions
  muteAllAlerts: (duration: number) => Promise<void>;
  resolveAllAlerts: (category?: string) => Promise<void>;
  exportAlerts: (format: 'json' | 'csv' | 'pdf') => Promise<void>;
  importRules: (rules: AlertRule[]) => Promise<void>;
  
  // Advanced Features
  enableMaintenanceMode: (duration: number) => Promise<void>;
  disableMaintenanceMode: () => Promise<void>;
  runHealthCheck: () => Promise<void>;
  optimizeRules: () => Promise<void>;
  
  // System
  refreshData: () => Promise<void>;
  resetState: () => void;
}

// Create Store
export const useProactiveAlertsStore = create<ProactiveAlertsState>()(devtools(
  (set, get) => ({
    // Initial State
    rules: [],
    alerts: [],
    metrics: [],
    channels: [],
    notifications: [],
    templates: [],
    escalations: [],
    
    // UI State
    selectedRule: null,
    selectedAlert: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    progress: 0,
    processingMessage: '',
    
    // Filters
    searchQuery: '',
    categoryFilter: null,
    severityFilter: null,
    statusFilter: null,
    dateRange: null,
    
    // Configuration
    config: {
      enableRealTimeMonitoring: true,
      enablePredictiveAlerts: true,
      enableAutoResolution: false,
      enableEscalation: true,
      defaultCooldownPeriod: 15,
      maxAlertsPerHour: 100,
      retentionPeriod: 30,
      escalationThreshold: 3,
      autoResolveTimeout: 60,
      enableSmartGrouping: true,
      enableAnomalyDetection: true,
      anomalyThreshold: 0.8,
      enableMaintenanceMode: false
    },
    
    // Real-time
    isMonitoring: false,
    lastUpdate: null,
    connectionStatus: 'disconnected',
    
    // Analytics
    stats: {
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      criticalAlerts: 0,
      alertsByCategory: {},
      alertsBySeverity: {},
      averageResolutionTime: 0,
      escalationRate: 0,
      falsePositiveRate: 0,
      mttr: 0,
      mtbf: 0
    },
    
    recentActivity: {
      alertsToday: 0,
      rulesTriggered: 0,
      averageResponseTime: 0,
      topCategories: []
    },
    
    // Computed Properties
    get filteredRules() {
      const state = get();
      let filtered = state.rules;
      
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(rule => 
          rule.name.toLowerCase().includes(query) ||
          rule.description.toLowerCase().includes(query)
        );
      }
      
      if (state.categoryFilter) {
        filtered = filtered.filter(rule => rule.category === state.categoryFilter);
      }
      
      if (state.severityFilter) {
        filtered = filtered.filter(rule => rule.severity === state.severityFilter);
      }
      
      return filtered;
    },
    
    get filteredAlerts() {
      const state = get();
      let filtered = state.alerts;
      
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(alert => 
          alert.title.toLowerCase().includes(query) ||
          alert.message.toLowerCase().includes(query)
        );
      }
      
      if (state.categoryFilter) {
        filtered = filtered.filter(alert => alert.category === state.categoryFilter);
      }
      
      if (state.severityFilter) {
        filtered = filtered.filter(alert => alert.severity === state.severityFilter);
      }
      
      if (state.statusFilter) {
        filtered = filtered.filter(alert => alert.status === state.statusFilter);
      }
      
      if (state.dateRange) {
        filtered = filtered.filter(alert => 
          alert.triggeredAt >= state.dateRange!.start &&
          alert.triggeredAt <= state.dateRange!.end
        );
      }
      
      return filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
    },
    
    get activeRules() {
      return get().rules.filter(rule => rule.isEnabled);
    },
    
    get criticalAlerts() {
      return get().alerts.filter(alert => 
        alert.severity === 'critical' && alert.status === 'active'
      );
    },
    
    get recentAlerts() {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return get().alerts.filter(alert => alert.triggeredAt >= oneDayAgo);
    },
    
    get alertTrends() {
      const alerts = get().alerts;
      const trends: Array<{ date: Date; count: number; severity: string }> = [];
      
      // Group alerts by date and severity
      const grouped = alerts.reduce((acc, alert) => {
        const dateKey = alert.triggeredAt.toDateString();
        if (!acc[dateKey]) acc[dateKey] = {};
        if (!acc[dateKey][alert.severity]) acc[dateKey][alert.severity] = 0;
        acc[dateKey][alert.severity]++;
        return acc;
      }, {} as Record<string, Record<string, number>>);
      
      // Convert to array format
      Object.entries(grouped).forEach(([dateStr, severities]) => {
        Object.entries(severities).forEach(([severity, count]) => {
          trends.push({
            date: new Date(dateStr),
            count,
            severity
          });
        });
      });
      
      return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
    
    get ruleEffectiveness() {
      const rules = get().rules;
      const alerts = get().alerts;
      
      return rules.map(rule => {
        const ruleAlerts = alerts.filter(alert => alert.ruleId === rule.id);
        const resolvedAlerts = ruleAlerts.filter(alert => alert.status === 'resolved');
        const falsePositives = ruleAlerts.filter(alert => 
          alert.metadata.falsePositive === true
        ).length;
        
        const accuracy = ruleAlerts.length > 0 
          ? (ruleAlerts.length - falsePositives) / ruleAlerts.length 
          : 1;
        
        return {
          ruleId: rule.id,
          accuracy,
          falsePositives
        };
      });
    },
    
    // Actions
    createRule: async (ruleData) => {
      set({ isProcessing: true, processingMessage: 'Creating alert rule...' });
      try {
        const newRule: AlertRule = {
          ...ruleData,
          id: `rule-${Date.now()}`,
          triggerCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          rules: [...state.rules, newRule],
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create rule',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    updateRule: async (id, updates) => {
      set({ isProcessing: true, processingMessage: 'Updating alert rule...' });
      try {
        set(state => ({
          rules: state.rules.map(rule => 
            rule.id === id 
              ? { ...rule, ...updates, updatedAt: new Date() }
              : rule
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update rule',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    deleteRule: async (id) => {
      set({ isProcessing: true, processingMessage: 'Deleting alert rule...' });
      try {
        set(state => ({
          rules: state.rules.filter(rule => rule.id !== id),
          selectedRule: state.selectedRule?.id === id ? null : state.selectedRule,
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete rule',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    toggleRule: async (id) => {
      const rule = get().rules.find(r => r.id === id);
      if (rule) {
        await get().updateRule(id, { isEnabled: !rule.isEnabled });
      }
    },
    
    testRule: async (id) => {
      set({ isProcessing: true, processingMessage: 'Testing alert rule...' });
      try {
        // Simulate rule testing
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ isProcessing: false, processingMessage: '' });
        return Math.random() > 0.2; // 80% success rate
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to test rule',
          isProcessing: false,
          processingMessage: ''
        });
        return false;
      }
    },
    
    duplicateRule: async (id) => {
      const rule = get().rules.find(r => r.id === id);
      if (rule) {
        await get().createRule({
          ...rule,
          name: `${rule.name} (Copy)`,
          isEnabled: false
        });
      }
    },
    
    acknowledgeAlert: async (id, userId) => {
      set({ isProcessing: true, processingMessage: 'Acknowledging alert...' });
      try {
        set(state => ({
          alerts: state.alerts.map(alert => 
            alert.id === id 
              ? { 
                  ...alert, 
                  status: 'acknowledged',
                  acknowledgedAt: new Date(),
                  acknowledgedBy: { id: userId, name: 'Current User' }
                }
              : alert
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    resolveAlert: async (id, userId, resolution) => {
      set({ isProcessing: true, processingMessage: 'Resolving alert...' });
      try {
        set(state => ({
          alerts: state.alerts.map(alert => 
            alert.id === id 
              ? { 
                  ...alert, 
                  status: 'resolved',
                  resolvedAt: new Date(),
                  resolvedBy: { id: userId, name: 'Current User' },
                  metadata: { ...alert.metadata, resolution }
                }
              : alert
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to resolve alert',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    suppressAlert: async (id, duration) => {
      set({ isProcessing: true, processingMessage: 'Suppressing alert...' });
      try {
        set(state => ({
          alerts: state.alerts.map(alert => 
            alert.id === id 
              ? { 
                  ...alert, 
                  status: 'suppressed',
                  metadata: { 
                    ...alert.metadata, 
                    suppressedUntil: new Date(Date.now() + duration * 60000)
                  }
                }
              : alert
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to suppress alert',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    escalateAlert: async (id, level) => {
      set({ isProcessing: true, processingMessage: 'Escalating alert...' });
      try {
        const escalation: AlertEscalation = {
          id: `escalation-${Date.now()}`,
          alertId: id,
          level,
          triggeredAt: new Date(),
          assignedTo: {
            id: 'manager-1',
            name: 'Team Manager',
            role: 'Manager'
          },
          deadline: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          status: 'pending'
        };
        
        set(state => ({
          alerts: state.alerts.map(alert => 
            alert.id === id 
              ? { ...alert, escalationLevel: level }
              : alert
          ),
          escalations: [...state.escalations, escalation],
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to escalate alert',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    groupAlerts: async (alertIds) => {
      set({ isProcessing: true, processingMessage: 'Grouping alerts...' });
      try {
        const groupId = `group-${Date.now()}`;
        set(state => ({
          alerts: state.alerts.map(alert => 
            alertIds.includes(alert.id)
              ? { ...alert, metadata: { ...alert.metadata, groupId } }
              : alert
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to group alerts',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    startMonitoring: async () => {
      set({ 
        isMonitoring: true, 
        connectionStatus: 'connecting',
        processingMessage: 'Starting monitoring...' 
      });
      
      try {
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set({ 
          connectionStatus: 'connected',
          lastUpdate: new Date(),
          processingMessage: ''
        });
        
        // Start periodic rule evaluation
        const interval = setInterval(() => {
          if (get().isMonitoring) {
            get().evaluateRules();
          } else {
            clearInterval(interval);
          }
        }, 30000); // Every 30 seconds
        
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to start monitoring',
          connectionStatus: 'disconnected',
          isMonitoring: false,
          processingMessage: ''
        });
      }
    },
    
    stopMonitoring: () => {
      set({ 
        isMonitoring: false,
        connectionStatus: 'disconnected'
      });
    },
    
    addMetric: (metric) => {
      set(state => ({
        metrics: [...state.metrics.slice(-999), metric], // Keep last 1000 metrics
        lastUpdate: new Date()
      }));
    },
    
    evaluateRules: async () => {
      const state = get();
      const activeRules = state.activeRules;
      const recentMetrics = state.metrics.slice(-100); // Last 100 metrics
      
      for (const rule of activeRules) {
        // Check cooldown
        if (rule.lastTriggered) {
          const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownPeriod * 60000);
          if (new Date() < cooldownEnd) continue;
        }
        
        // Evaluate condition
        const relevantMetrics = recentMetrics.filter(m => m.metric === rule.condition.metric);
        if (relevantMetrics.length === 0) continue;
        
        let shouldTrigger = false;
        const latestMetric = relevantMetrics[relevantMetrics.length - 1];
        
        switch (rule.condition.operator) {
          case 'gt':
            shouldTrigger = latestMetric.value > Number(rule.condition.value);
            break;
          case 'lt':
            shouldTrigger = latestMetric.value < Number(rule.condition.value);
            break;
          case 'gte':
            shouldTrigger = latestMetric.value >= Number(rule.condition.value);
            break;
          case 'lte':
            shouldTrigger = latestMetric.value <= Number(rule.condition.value);
            break;
          case 'eq':
            shouldTrigger = latestMetric.value === Number(rule.condition.value);
            break;
        }
        
        if (shouldTrigger) {
          // Create alert
          const alert: Alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            ruleName: rule.name,
            title: `${rule.name} Alert`,
            message: `${rule.condition.metric} is ${latestMetric.value} (threshold: ${rule.condition.value})`,
            category: rule.category,
            severity: rule.severity,
            status: 'active',
            triggeredAt: new Date(),
            metadata: {
              metricValue: latestMetric.value,
              threshold: rule.condition.value,
              source: latestMetric.source
            },
            affectedResources: [latestMetric.source],
            relatedAlerts: [],
            escalationLevel: 0,
            autoResolved: false
          };
          
          // Update state
          set(state => ({
            alerts: [...state.alerts, alert],
            rules: state.rules.map(r => 
              r.id === rule.id 
                ? { ...r, lastTriggered: new Date(), triggerCount: r.triggerCount + 1 }
                : r
            )
          }));
          
          // Send notifications
          for (const action of rule.actions) {
            const channel = state.channels.find(c => c.type === action.type && c.isEnabled);
            if (channel) {
              get().sendNotification(alert.id, channel.id);
            }
          }
        }
      }
    },
    
    createChannel: async (channelData) => {
      set({ isProcessing: true, processingMessage: 'Creating notification channel...' });
      try {
        const newChannel: AlertChannel = {
          ...channelData,
          id: `channel-${Date.now()}`,
          testStatus: 'pending',
          createdAt: new Date()
        };
        
        set(state => ({
          channels: [...state.channels, newChannel],
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create channel',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    updateChannel: async (id, updates) => {
      set({ isProcessing: true, processingMessage: 'Updating notification channel...' });
      try {
        set(state => ({
          channels: state.channels.map(channel => 
            channel.id === id 
              ? { ...channel, ...updates }
              : channel
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update channel',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    deleteChannel: async (id) => {
      set({ isProcessing: true, processingMessage: 'Deleting notification channel...' });
      try {
        set(state => ({
          channels: state.channels.filter(channel => channel.id !== id),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete channel',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    testChannel: async (id) => {
      set({ isProcessing: true, processingMessage: 'Testing notification channel...' });
      try {
        // Simulate channel testing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const success = Math.random() > 0.1; // 90% success rate
        
        set(state => ({
          channels: state.channels.map(channel => 
            channel.id === id 
              ? { 
                  ...channel, 
                  testStatus: success ? 'success' : 'failed',
                  lastTested: new Date()
                }
              : channel
          ),
          isProcessing: false,
          processingMessage: ''
        }));
        
        return success;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to test channel',
          isProcessing: false,
          processingMessage: ''
        });
        return false;
      }
    },
    
    sendNotification: async (alertId, channelId) => {
      const notification: AlertNotification = {
        id: `notification-${Date.now()}`,
        alertId,
        channelId,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3
      };
      
      set(state => ({
        notifications: [...state.notifications, notification]
      }));
      
      // Simulate sending
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === notification.id 
              ? { 
                  ...n, 
                  status: success ? 'sent' : 'failed',
                  sentAt: success ? new Date() : undefined,
                  failureReason: success ? undefined : 'Network error'
                }
              : n
          )
        }));
      }, 1000);
    },
    
    retryNotification: async (notificationId) => {
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'pending', retryCount: n.retryCount + 1 }
            : n
        )
      }));
      
      const notification = get().notifications.find(n => n.id === notificationId);
      if (notification) {
        get().sendNotification(notification.alertId, notification.channelId);
      }
    },
    
    createTemplate: async (templateData) => {
      set({ isProcessing: true, processingMessage: 'Creating alert template...' });
      try {
        const newTemplate: AlertTemplate = {
          ...templateData,
          id: `template-${Date.now()}`,
          createdAt: new Date()
        };
        
        set(state => ({
          templates: [...state.templates, newTemplate],
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create template',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    updateTemplate: async (id, updates) => {
      set({ isProcessing: true, processingMessage: 'Updating alert template...' });
      try {
        set(state => ({
          templates: state.templates.map(template => 
            template.id === id 
              ? { ...template, ...updates }
              : template
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update template',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    deleteTemplate: async (id) => {
      set({ isProcessing: true, processingMessage: 'Deleting alert template...' });
      try {
        set(state => ({
          templates: state.templates.filter(template => template.id !== id),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete template',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    // Search and Filter Actions
    setSearchQuery: (query) => set({ searchQuery: query }),
    setCategoryFilter: (category) => set({ categoryFilter: category }),
    setSeverityFilter: (severity) => set({ severityFilter: severity }),
    setStatusFilter: (status) => set({ statusFilter: status }),
    setDateRange: (range) => set({ dateRange: range }),
    clearFilters: () => set({ 
      searchQuery: '', 
      categoryFilter: null, 
      severityFilter: null, 
      statusFilter: null,
      dateRange: null 
    }),
    
    // Selection Actions
    selectRule: (rule) => set({ selectedRule: rule }),
    selectAlert: (alert) => set({ selectedAlert: alert }),
    
    // Configuration Actions
    updateConfig: async (updates) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },
    
    // Quick Actions
    muteAllAlerts: async (duration) => {
      set({ isProcessing: true, processingMessage: 'Muting all alerts...' });
      try {
        const suppressUntil = new Date(Date.now() + duration * 60000);
        set(state => ({
          alerts: state.alerts.map(alert => 
            alert.status === 'active' 
              ? { 
                  ...alert, 
                  status: 'suppressed',
                  metadata: { ...alert.metadata, suppressedUntil }
                }
              : alert
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to mute alerts',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    resolveAllAlerts: async (category) => {
      set({ isProcessing: true, processingMessage: 'Resolving alerts...' });
      try {
        set(state => ({
          alerts: state.alerts.map(alert => 
            alert.status === 'active' && (!category || alert.category === category)
              ? { 
                  ...alert, 
                  status: 'resolved',
                  resolvedAt: new Date(),
                  autoResolved: true
                }
              : alert
          ),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to resolve alerts',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    exportAlerts: async (format) => {
      set({ isProcessing: true, processingMessage: `Exporting alerts as ${format.toUpperCase()}...` });
      try {
        // Simulate export
        await new Promise(resolve => setTimeout(resolve, 2000));
        set({ isProcessing: false, processingMessage: '' });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to export alerts',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    importRules: async (rules) => {
      set({ isProcessing: true, processingMessage: 'Importing alert rules...' });
      try {
        const importedRules = rules.map(rule => ({
          ...rule,
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          triggerCount: 0
        }));
        
        set(state => ({
          rules: [...state.rules, ...importedRules],
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to import rules',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    // Advanced Features
    enableMaintenanceMode: async (duration) => {
      set({ isProcessing: true, processingMessage: 'Enabling maintenance mode...' });
      try {
        const maintenanceEnd = new Date(Date.now() + duration * 60000);
        set(state => ({
          config: {
            ...state.config,
            enableMaintenanceMode: true,
            maintenanceSchedule: {
              start: new Date(),
              end: maintenanceEnd,
              recurring: false
            }
          },
          isProcessing: false,
          processingMessage: ''
        }));
        
        // Auto-disable after duration
        setTimeout(() => {
          get().disableMaintenanceMode();
        }, duration * 60000);
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to enable maintenance mode',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    disableMaintenanceMode: async () => {
      set(state => ({
        config: {
          ...state.config,
          enableMaintenanceMode: false,
          maintenanceSchedule: undefined
        }
      }));
    },
    
    runHealthCheck: async () => {
      set({ isProcessing: true, processingMessage: 'Running health check...' });
      try {
        // Simulate health check
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update stats
        const state = get();
        const stats: AlertStats = {
          totalAlerts: state.alerts.length,
          activeAlerts: state.alerts.filter(a => a.status === 'active').length,
          resolvedAlerts: state.alerts.filter(a => a.status === 'resolved').length,
          criticalAlerts: state.alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
          alertsByCategory: state.alerts.reduce((acc, alert) => {
            acc[alert.category] = (acc[alert.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          alertsBySeverity: state.alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          averageResolutionTime: 45, // minutes
          escalationRate: 0.15,
          falsePositiveRate: 0.08,
          mttr: 32, // minutes
          mtbf: 180 // minutes
        };
        
        set({ 
          stats,
          isProcessing: false,
          processingMessage: '',
          lastUpdate: new Date()
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to run health check',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    optimizeRules: async () => {
      set({ isProcessing: true, processingMessage: 'Optimizing alert rules...' });
      try {
        // Simulate optimization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Disable rules with high false positive rates
        const effectiveness = get().ruleEffectiveness;
        const rulesToOptimize = effectiveness.filter(e => e.falsePositives > 5 || e.accuracy < 0.7);
        
        set(state => ({
          rules: state.rules.map(rule => {
            const shouldOptimize = rulesToOptimize.some(r => r.ruleId === rule.id);
            return shouldOptimize 
              ? { ...rule, isEnabled: false, description: `${rule.description} (Auto-disabled: low accuracy)` }
              : rule;
          }),
          isProcessing: false,
          processingMessage: ''
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to optimize rules',
          isProcessing: false,
          processingMessage: ''
        });
      }
    },
    
    // System Actions
    refreshData: async () => {
      set({ isLoading: true });
      try {
        // Simulate data refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate some demo data if empty
        const state = get();
        if (state.rules.length === 0) {
          const demoRules: AlertRule[] = [
            {
              id: 'rule-1',
              name: 'High CPU Usage',
              description: 'Alert when CPU usage exceeds 80%',
              category: 'performance',
              severity: 'high',
              condition: {
                metric: 'cpu_usage',
                operator: 'gt',
                value: 80,
                timeWindow: 5,
                aggregation: 'avg'
              },
              actions: [
                {
                  type: 'email',
                  target: 'admin@example.com',
                  priority: 'high'
                }
              ],
              isEnabled: true,
              cooldownPeriod: 15,
              triggerCount: 3,
              createdBy: {
                id: 'user-1',
                name: 'Admin User',
                email: 'admin@example.com'
              },
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
              id: 'rule-2',
              name: 'Memory Leak Detection',
              description: 'Alert when memory usage increases continuously',
              category: 'performance',
              severity: 'critical',
              condition: {
                metric: 'memory_usage',
                operator: 'gt',
                value: 90,
                timeWindow: 10,
                aggregation: 'avg'
              },
              actions: [
                {
                  type: 'slack',
                  target: '#alerts',
                  priority: 'high'
                },
                {
                  type: 'email',
                  target: 'devops@example.com',
                  priority: 'high'
                }
              ],
              isEnabled: true,
              cooldownPeriod: 30,
              triggerCount: 1,
              createdBy: {
                id: 'user-2',
                name: 'DevOps Team',
                email: 'devops@example.com'
              },
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
              id: 'rule-3',
              name: 'Failed Login Attempts',
              description: 'Alert on suspicious login activity',
              category: 'security',
              severity: 'medium',
              condition: {
                metric: 'failed_logins',
                operator: 'gt',
                value: 5,
                timeWindow: 5,
                aggregation: 'count'
              },
              actions: [
                {
                  type: 'email',
                  target: 'security@example.com',
                  priority: 'medium'
                }
              ],
              isEnabled: true,
              cooldownPeriod: 10,
              triggerCount: 8,
              createdBy: {
                id: 'user-3',
                name: 'Security Team',
                email: 'security@example.com'
              },
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            }
          ];
          
          const demoAlerts: Alert[] = [
            {
              id: 'alert-1',
              ruleId: 'rule-1',
              ruleName: 'High CPU Usage',
              title: 'CPU Usage Alert',
              message: 'CPU usage is 85% (threshold: 80%)',
              category: 'performance',
              severity: 'high',
              status: 'active',
              triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
              metadata: {
                metricValue: 85,
                threshold: 80,
                source: 'server-01'
              },
              affectedResources: ['server-01'],
              relatedAlerts: [],
              escalationLevel: 0,
              autoResolved: false
            },
            {
              id: 'alert-2',
              ruleId: 'rule-3',
              ruleName: 'Failed Login Attempts',
              title: 'Security Alert',
              message: 'Multiple failed login attempts detected',
              category: 'security',
              severity: 'medium',
              status: 'acknowledged',
              triggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
              acknowledgedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
              acknowledgedBy: {
                id: 'user-3',
                name: 'Security Team'
              },
              metadata: {
                metricValue: 7,
                threshold: 5,
                source: 'auth-service'
              },
              affectedResources: ['auth-service'],
              relatedAlerts: [],
              escalationLevel: 0,
              autoResolved: false
            }
          ];
          
          const demoChannels: AlertChannel[] = [
            {
              id: 'channel-1',
              name: 'Email Notifications',
              type: 'email',
              config: {
                smtp: 'smtp.example.com',
                port: 587,
                username: 'alerts@example.com'
              },
              isEnabled: true,
              testStatus: 'success',
              lastTested: new Date(Date.now() - 24 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            {
              id: 'channel-2',
              name: 'Slack Integration',
              type: 'slack',
              config: {
                webhook: 'https://hooks.slack.com/services/...',
                channel: '#alerts'
              },
              isEnabled: true,
              testStatus: 'success',
              lastTested: new Date(Date.now() - 12 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
            }
          ];
          
          set({ 
            rules: demoRules,
            alerts: demoAlerts,
            channels: demoChannels
          });
        }
        
        set({ 
          isLoading: false,
          lastUpdate: new Date()
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to refresh data',
          isLoading: false
        });
      }
    },
    
    resetState: () => {
      set({
        rules: [],
        alerts: [],
        metrics: [],
        channels: [],
        notifications: [],
        templates: [],
        escalations: [],
        selectedRule: null,
        selectedAlert: null,
        isLoading: false,
        isProcessing: false,
        error: null,
        progress: 0,
        processingMessage: '',
        searchQuery: '',
        categoryFilter: null,
        severityFilter: null,
        statusFilter: null,
        dateRange: null,
        isMonitoring: false,
        lastUpdate: null,
        connectionStatus: 'disconnected'
      });
    }
  }),
  {
    name: 'proactive-alerts-store'
  }
));

// Manager Class
export class ProactiveAlertsManager {
  private static instance: ProactiveAlertsManager;
  
  static getInstance(): ProactiveAlertsManager {
    if (!ProactiveAlertsManager.instance) {
      ProactiveAlertsManager.instance = new ProactiveAlertsManager();
    }
    return ProactiveAlertsManager.instance;
  }
  
  // Utility methods
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  getSeverityColor(severity: AlertRule['severity']): string {
    switch (severity) {
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
  
  getCategoryIcon(category: AlertRule['category']): string {
    switch (category) {
      case 'performance': return 'TrendingUp';
      case 'security': return 'Shield';
      case 'usage': return 'Users';
      case 'system': return 'Server';
      case 'collaboration': return 'Users';
      case 'quality': return 'CheckCircle';
      default: return 'AlertTriangle';
    }
  }
  
  calculateAlertScore(alert: Alert): number {
    let score = 0;
    
    // Severity weight
    switch (alert.severity) {
      case 'critical': score += 40; break;
      case 'high': score += 30; break;
      case 'medium': score += 20; break;
      case 'low': score += 10; break;
    }
    
    // Age factor (newer alerts get higher score)
    const ageHours = (Date.now() - alert.triggeredAt.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 20 - ageHours);
    
    // Escalation factor
    score += alert.escalationLevel * 10;
    
    // Affected resources factor
    score += Math.min(alert.affectedResources.length * 5, 20);
    
    return Math.round(score);
  }
  
  generateRecommendations(alerts: Alert[], rules: AlertRule[]): string[] {
    const recommendations: string[] = [];
    
    // High false positive rate
    const highFalsePositiveRules = rules.filter(rule => {
      const ruleAlerts = alerts.filter(a => a.ruleId === rule.id);
      const falsePositives = ruleAlerts.filter(a => a.metadata.falsePositive).length;
      return ruleAlerts.length > 0 && falsePositives / ruleAlerts.length > 0.3;
    });
    
    if (highFalsePositiveRules.length > 0) {
      recommendations.push(`Consider adjusting ${highFalsePositiveRules.length} rules with high false positive rates`);
    }
    
    // Too many critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active');
    if (criticalAlerts.length > 5) {
      recommendations.push('Consider reviewing critical alert thresholds - too many active critical alerts');
    }
    
    // Unacknowledged alerts
    const unacknowledgedAlerts = alerts.filter(a => a.status === 'active' && !a.acknowledgedAt);
    if (unacknowledgedAlerts.length > 10) {
      recommendations.push('Many alerts are unacknowledged - consider setting up escalation rules');
    }
    
    // Disabled rules
    const disabledRules = rules.filter(r => !r.isEnabled);
    if (disabledRules.length > rules.length * 0.3) {
      recommendations.push('Many rules are disabled - review and re-enable relevant rules');
    }
    
    return recommendations;
  }
}

// Global instance
export const proactiveAlertsManager = ProactiveAlertsManager.getInstance();

// Utility functions
export const formatAlertTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const getAlertPriorityColor = (severity: AlertRule['severity'], status: Alert['status']): string => {
  if (status === 'resolved') return 'text-green-600';
  if (status === 'suppressed') return 'text-gray-400';
  
  switch (severity) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-blue-600';
    default: return 'text-gray-600';
  }
};

export const getStatusIcon = (status: Alert['status']): string => {
  switch (status) {
    case 'active': return 'AlertTriangle';
    case 'acknowledged': return 'Eye';
    case 'resolved': return 'CheckCircle';
    case 'suppressed': return 'VolumeX';
    default: return 'AlertCircle';
  }
};

export const calculateRuleHealth = (rule: AlertRule, alerts: Alert[]): number => {
  const ruleAlerts = alerts.filter(a => a.ruleId === rule.id);
  if (ruleAlerts.length === 0) return 100;
  
  const falsePositives = ruleAlerts.filter(a => a.metadata.falsePositive).length;
  const accuracy = (ruleAlerts.length - falsePositives) / ruleAlerts.length;
  
  return Math.round(accuracy * 100);
};

export const generateAlertSummary = (alerts: Alert[]): string => {
  const active = alerts.filter(a => a.status === 'active').length;
  const critical = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  
  if (critical > 0) {
    return `${critical} critical alert${critical > 1 ? 's' : ''} require immediate attention`;
  }
  
  if (active > 0) {
    return `${active} active alert${active > 1 ? 's' : ''} need review`;
  }
  
  return 'All alerts are resolved';
};

// Export default store hook
export default useProactiveAlertsStore;