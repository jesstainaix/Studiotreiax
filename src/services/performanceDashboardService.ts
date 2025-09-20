import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'cpu' | 'memory' | 'network' | 'storage' | 'render' | 'user';
  timestamp: Date;
  threshold?: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage change from previous
}

export interface SystemResource {
  id: string;
  name: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  usage: number; // percentage
  available: number;
  total: number;
  unit: string;
  processes?: ProcessInfo[];
  history: HistoryPoint[];
}

export interface ProcessInfo {
  id: string;
  name: string;
  pid: number;
  cpuUsage: number;
  memoryUsage: number;
  status: 'running' | 'sleeping' | 'stopped';
  priority: number;
}

export interface HistoryPoint {
  timestamp: Date;
  value: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  metricId: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
  autoResolve: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'restart' | 'optimize' | 'cleanup' | 'scale' | 'notify';
  automated: boolean;
  description: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'gauge' | 'table' | 'stat' | 'alert' | 'log';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  dataSource: string;
  refreshInterval: number;
  visible: boolean;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  timeRange?: string;
  metrics?: string[];
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  thresholds?: { value: number; color: string }[];
}

export interface PerformanceReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: { start: Date; end: Date };
  metrics: string[];
  summary: ReportSummary;
  recommendations: string[];
  generatedAt: Date;
  format: 'pdf' | 'html' | 'json';
}

export interface ReportSummary {
  totalUptime: number;
  averageResponse: number;
  peakUsage: { metric: string; value: number; timestamp: Date }[];
  incidents: number;
  improvements: string[];
  trends: { metric: string; direction: 'up' | 'down'; percentage: number }[];
}

export interface MonitoringConfig {
  enabled: boolean;
  refreshInterval: number;
  retentionDays: number;
  alertThresholds: Record<string, { warning: number; critical: number }>;
  autoOptimization: boolean;
  collectDetailedMetrics: boolean;
  enablePredictiveAnalysis: boolean;
  notificationChannels: string[];
}

export interface DashboardStats {
  totalMetrics: number;
  activeAlerts: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  uptime: number;
  lastUpdate: Date;
  dataPoints: number;
  avgResponseTime: number;
  throughput: number;
}

export interface PredictiveAnalysis {
  id: string;
  metric: string;
  prediction: {
    nextHour: number;
    nextDay: number;
    nextWeek: number;
    confidence: number;
  };
  anomalies: AnomalyDetection[];
  recommendations: string[];
  timestamp: Date;
}

export interface AnomalyDetection {
  id: string;
  metric: string;
  type: 'spike' | 'drop' | 'pattern' | 'trend';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  expectedValue: number;
  actualValue: number;
  deviation: number;
}

// Store Interface
interface PerformanceDashboardStore {
  // State
  metrics: PerformanceMetric[];
  resources: SystemResource[];
  alerts: PerformanceAlert[];
  widgets: DashboardWidget[];
  reports: PerformanceReport[];
  config: MonitoringConfig;
  stats: DashboardStats;
  predictions: PredictiveAnalysis[];
  anomalies: AnomalyDetection[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedTimeRange: string;
  selectedMetrics: string[];
  dashboardLayout: string;
  autoRefresh: boolean;
  lastRefresh: Date | null;
  
  // Computed
  criticalAlerts: PerformanceAlert[];
  systemOverview: Record<string, any>;
  performanceTrends: Record<string, any>;
  healthScore: number;
  
  // Actions
  loadMetrics: () => Promise<void>;
  loadResources: () => Promise<void>;
  loadAlerts: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  
  // Metric Management
  addMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => Promise<void>;
  updateMetric: (id: string, updates: Partial<PerformanceMetric>) => Promise<void>;
  removeMetric: (id: string) => Promise<void>;
  getMetricHistory: (metricId: string, timeRange: string) => Promise<HistoryPoint[]>;
  
  // Alert Management
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  createAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => Promise<void>;
  executeAlertAction: (alertId: string, actionId: string) => Promise<void>;
  
  // Widget Management
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => Promise<void>;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;
  updateWidgetPosition: (id: string, position: DashboardWidget['position']) => Promise<void>;
  
  // Report Management
  generateReport: (config: Partial<PerformanceReport>) => Promise<PerformanceReport>;
  scheduleReport: (reportId: string, schedule: string) => Promise<void>;
  exportReport: (reportId: string, format: 'pdf' | 'html' | 'json') => Promise<void>;
  
  // Configuration
  updateConfig: (updates: Partial<MonitoringConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  
  // Analysis
  runPredictiveAnalysis: (metricIds: string[]) => Promise<void>;
  detectAnomalies: (metricId: string, timeRange: string) => Promise<AnomalyDetection[]>;
  getPerformanceInsights: () => Promise<string[]>;
  
  // Optimization
  optimizeSystem: (type: 'memory' | 'cpu' | 'storage' | 'network') => Promise<void>;
  autoTuneThresholds: () => Promise<void>;
  cleanupOldData: () => Promise<void>;
  
  // Search and Filter
  searchMetrics: (query: string) => PerformanceMetric[];
  filterAlerts: (filters: Partial<PerformanceAlert>) => PerformanceAlert[];
  
  // Quick Actions
  quickActions: {
    restartMonitoring: () => Promise<void>;
    clearAllAlerts: () => Promise<void>;
    exportDashboard: () => Promise<void>;
    resetDashboard: () => Promise<void>;
    enableAutoOptimization: () => Promise<void>;
    disableAutoOptimization: () => Promise<void>;
  };
}

// Create Store
export const usePerformanceDashboardStore = create<PerformanceDashboardStore>()
  (subscribeWithSelector((set, get) => ({
    // Initial State
    metrics: [],
    resources: [],
    alerts: [],
    widgets: [],
    reports: [],
    config: {
      enabled: true,
      refreshInterval: 5000,
      retentionDays: 30,
      alertThresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        network: { warning: 80, critical: 95 }
      },
      autoOptimization: false,
      collectDetailedMetrics: true,
      enablePredictiveAnalysis: true,
      notificationChannels: ['email', 'slack']
    },
    stats: {
      totalMetrics: 0,
      activeAlerts: 0,
      systemHealth: 'good',
      uptime: 99.9,
      lastUpdate: new Date(),
      dataPoints: 0,
      avgResponseTime: 0,
      throughput: 0
    },
    predictions: [],
    anomalies: [],
    
    // UI State
    isLoading: false,
    error: null,
    selectedTimeRange: '1h',
    selectedMetrics: [],
    dashboardLayout: 'default',
    autoRefresh: true,
    lastRefresh: null,
    
    // Computed
    get criticalAlerts() {
      return get().alerts.filter(alert => alert.type === 'critical' && !alert.acknowledged);
    },
    
    get systemOverview() {
      const { resources, metrics } = get();
      return {
        cpu: resources.find(r => r.type === 'cpu')?.usage || 0,
        memory: resources.find(r => r.type === 'memory')?.usage || 0,
        disk: resources.find(r => r.type === 'disk')?.usage || 0,
        network: resources.find(r => r.type === 'network')?.usage || 0,
        activeProcesses: resources.reduce((acc, r) => acc + (r.processes?.length || 0), 0),
        totalMetrics: metrics.length
      };
    },
    
    get performanceTrends() {
      const { metrics } = get();
      return metrics.reduce((acc, metric) => {
        acc[metric.category] = acc[metric.category] || [];
        acc[metric.category].push({
          name: metric.name,
          value: metric.value,
          trend: metric.trend,
          change: metric.change
        });
        return acc;
      }, {} as Record<string, any>);
    },
    
    get healthScore() {
      const { resources, alerts } = get();
      const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
      const warningAlerts = alerts.filter(a => a.type === 'warning').length;
      const avgUsage = resources.reduce((acc, r) => acc + r.usage, 0) / resources.length;
      
      let score = 100;
      score -= criticalAlerts * 20;
      score -= warningAlerts * 10;
      score -= Math.max(0, avgUsage - 70) * 0.5;
      
      return Math.max(0, Math.min(100, score));
    },
    
    // Actions
    loadMetrics: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockMetrics: PerformanceMetric[] = [
          {
            id: '1',
            name: 'CPU Usage',
            value: 45.2,
            unit: '%',
            category: 'cpu',
            timestamp: new Date(),
            threshold: { warning: 70, critical: 90 },
            trend: 'stable',
            change: 2.1
          },
          {
            id: '2',
            name: 'Memory Usage',
            value: 68.7,
            unit: '%',
            category: 'memory',
            timestamp: new Date(),
            threshold: { warning: 80, critical: 95 },
            trend: 'up',
            change: 5.3
          },
          {
            id: '3',
            name: 'Render Time',
            value: 16.8,
            unit: 'ms',
            category: 'render',
            timestamp: new Date(),
            threshold: { warning: 20, critical: 30 },
            trend: 'down',
            change: -3.2
          }
        ];
        
        set({ metrics: mockMetrics, isLoading: false });
      } catch (error) {
        set({ error: 'Erro ao carregar métricas', isLoading: false });
      }
    },
    
    loadResources: async () => {
      try {
        const mockResources: SystemResource[] = [
          {
            id: '1',
            name: 'CPU',
            type: 'cpu',
            usage: 45.2,
            available: 54.8,
            total: 100,
            unit: '%',
            history: Array.from({ length: 20 }, (_, i) => ({
              timestamp: new Date(Date.now() - (19 - i) * 60000),
              value: 40 + Math.random() * 20
            }))
          },
          {
            id: '2',
            name: 'Memory',
            type: 'memory',
            usage: 68.7,
            available: 2.5,
            total: 8,
            unit: 'GB',
            history: Array.from({ length: 20 }, (_, i) => ({
              timestamp: new Date(Date.now() - (19 - i) * 60000),
              value: 60 + Math.random() * 20
            }))
          }
        ];
        
        set({ resources: mockResources });
      } catch (error) {
        set({ error: 'Erro ao carregar recursos' });
      }
    },
    
    loadAlerts: async () => {
      try {
        const mockAlerts: PerformanceAlert[] = [
          {
            id: '1',
            type: 'warning',
            title: 'Alto uso de memória',
            message: 'O uso de memória está acima do limite recomendado',
            metricId: '2',
            threshold: 80,
            currentValue: 68.7,
            timestamp: new Date(),
            acknowledged: false,
            autoResolve: true,
            actions: [
              {
                id: '1',
                label: 'Limpar cache',
                type: 'cleanup',
                automated: true,
                description: 'Limpar cache do sistema para liberar memória'
              }
            ]
          }
        ];
        
        set({ alerts: mockAlerts });
      } catch (error) {
        set({ error: 'Erro ao carregar alertas' });
      }
    },
    
    refreshDashboard: async () => {
      const { loadMetrics, loadResources, loadAlerts } = get();
      await Promise.all([
        loadMetrics(),
        loadResources(),
        loadAlerts()
      ]);
      set({ lastRefresh: new Date() });
    },
    
    // Metric Management
    addMetric: async (metric) => {
      const newMetric: PerformanceMetric = {
        ...metric,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      set(state => ({ metrics: [...state.metrics, newMetric] }));
    },
    
    updateMetric: async (id, updates) => {
      set(state => ({
        metrics: state.metrics.map(metric => 
          metric.id === id ? { ...metric, ...updates } : metric
        )
      }));
    },
    
    removeMetric: async (id) => {
      set(state => ({
        metrics: state.metrics.filter(metric => metric.id !== id)
      }));
    },
    
    getMetricHistory: async (metricId, timeRange) => {
      // Simulate API call
      return Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - (49 - i) * 60000),
        value: Math.random() * 100
      }));
    },
    
    // Alert Management
    acknowledgeAlert: async (alertId) => {
      set(state => ({
        alerts: state.alerts.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      }));
    },
    
    resolveAlert: async (alertId) => {
      set(state => ({
        alerts: state.alerts.filter(alert => alert.id !== alertId)
      }));
    },
    
    createAlert: async (alert) => {
      const newAlert: PerformanceAlert = {
        ...alert,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      set(state => ({ alerts: [...state.alerts, newAlert] }));
    },
    
    executeAlertAction: async (alertId, actionId) => {
      // Simulate action execution
    },
    
    // Widget Management
    addWidget: async (widget) => {
      const newWidget: DashboardWidget = {
        ...widget,
        id: Date.now().toString()
      };
      set(state => ({ widgets: [...state.widgets, newWidget] }));
    },
    
    updateWidget: async (id, updates) => {
      set(state => ({
        widgets: state.widgets.map(widget => 
          widget.id === id ? { ...widget, ...updates } : widget
        )
      }));
    },
    
    removeWidget: async (id) => {
      set(state => ({
        widgets: state.widgets.filter(widget => widget.id !== id)
      }));
    },
    
    updateWidgetPosition: async (id, position) => {
      set(state => ({
        widgets: state.widgets.map(widget => 
          widget.id === id ? { ...widget, position } : widget
        )
      }));
    },
    
    // Report Management
    generateReport: async (config) => {
      const report: PerformanceReport = {
        id: Date.now().toString(),
        name: config.name || 'Performance Report',
        type: config.type || 'daily',
        period: config.period || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        metrics: config.metrics || [],
        summary: {
          totalUptime: 99.9,
          averageResponse: 150,
          peakUsage: [],
          incidents: 2,
          improvements: ['Otimizar cache', 'Reduzir consultas'],
          trends: []
        },
        recommendations: [
          'Considere aumentar a memória RAM',
          'Otimize consultas de banco de dados',
          'Implemente cache distribuído'
        ],
        generatedAt: new Date(),
        format: config.format || 'html'
      };
      
      set(state => ({ reports: [...state.reports, report] }));
      return report;
    },
    
    scheduleReport: async (reportId, schedule) => {
    },
    
    exportReport: async (reportId, format) => {
    },
    
    // Configuration
    updateConfig: async (updates) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },
    
    resetConfig: async () => {
      set(state => ({
        config: {
          enabled: true,
          refreshInterval: 5000,
          retentionDays: 30,
          alertThresholds: {
            cpu: { warning: 70, critical: 90 },
            memory: { warning: 80, critical: 95 },
            disk: { warning: 85, critical: 95 },
            network: { warning: 80, critical: 95 }
          },
          autoOptimization: false,
          collectDetailedMetrics: true,
          enablePredictiveAnalysis: true,
          notificationChannels: ['email', 'slack']
        }
      }));
    },
    
    // Analysis
    runPredictiveAnalysis: async (metricIds) => {
      const predictions: PredictiveAnalysis[] = metricIds.map(metricId => ({
        id: Date.now().toString() + metricId,
        metric: metricId,
        prediction: {
          nextHour: Math.random() * 100,
          nextDay: Math.random() * 100,
          nextWeek: Math.random() * 100,
          confidence: 0.85 + Math.random() * 0.15
        },
        anomalies: [],
        recommendations: [
          'Monitore picos de uso',
          'Configure alertas preventivos'
        ],
        timestamp: new Date()
      }));
      
      set({ predictions });
    },
    
    detectAnomalies: async (metricId, timeRange) => {
      return [
        {
          id: '1',
          metric: metricId,
          type: 'spike',
          severity: 'medium',
          description: 'Pico incomum detectado',
          timestamp: new Date(),
          expectedValue: 50,
          actualValue: 85,
          deviation: 70
        }
      ];
    },
    
    getPerformanceInsights: async () => {
      return [
        'CPU usage is within normal range',
        'Memory usage trending upward',
        'Network latency improved by 15%',
        'Consider scaling during peak hours'
      ];
    },
    
    // Optimization
    optimizeSystem: async (type) => {
    },
    
    autoTuneThresholds: async () => {
    },
    
    cleanupOldData: async () => {
    },
    
    // Search and Filter
    searchMetrics: (query) => {
      const { metrics } = get();
      return metrics.filter(metric => 
        metric.name.toLowerCase().includes(query.toLowerCase()) ||
        metric.category.toLowerCase().includes(query.toLowerCase())
      );
    },
    
    filterAlerts: (filters) => {
      const { alerts } = get();
      return alerts.filter(alert => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined) return true;
          return alert[key as keyof PerformanceAlert] === value;
        });
      });
    },
    
    // Quick Actions
    quickActions: {
      restartMonitoring: async () => {
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await get().refreshDashboard();
        set({ isLoading: false });
      },
      
      clearAllAlerts: async () => {
        set({ alerts: [] });
      },
      
      exportDashboard: async () => {
        const { metrics, resources, alerts, widgets } = get();
        const data = { metrics, resources, alerts, widgets };
      },
      
      resetDashboard: async () => {
        set({
          metrics: [],
          resources: [],
          alerts: [],
          widgets: [],
          selectedMetrics: [],
          selectedTimeRange: '1h'
        });
      },
      
      enableAutoOptimization: async () => {
        set(state => ({
          config: { ...state.config, autoOptimization: true }
        }));
      },
      
      disableAutoOptimization: async () => {
        set(state => ({
          config: { ...state.config, autoOptimization: false }
        }));
      }
    }
  })));

// Performance Dashboard Manager
export class PerformanceDashboardManager {
  private static instance: PerformanceDashboardManager;
  private store: any;
  
  private constructor() {
    this.store = usePerformanceDashboardStore.getState();
  }
  
  static getInstance(): PerformanceDashboardManager {
    if (!PerformanceDashboardManager.instance) {
      PerformanceDashboardManager.instance = new PerformanceDashboardManager();
    }
    return PerformanceDashboardManager.instance;
  }
  
  async initialize() {
    await this.store.refreshDashboard();
  }
  
  startRealTimeMonitoring() {
    const { config, refreshDashboard } = this.store;
    setInterval(() => {
      if (config.enabled) {
        refreshDashboard();
      }
    }, config.refreshInterval);
  }
  
  stopRealTimeMonitoring() {
    // Implementation for stopping monitoring
  }
}

// Global instance
export const performanceDashboardManager = PerformanceDashboardManager.getInstance();

// Utility functions
export const formatMetricValue = (value: number, unit: string): string => {
  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }
  if (unit === 'ms') {
    return `${value.toFixed(1)}ms`;
  }
  if (unit === 'MB' || unit === 'GB') {
    return `${value.toFixed(2)} ${unit}`;
  }
  return `${value.toFixed(2)} ${unit}`;
};

export const getMetricStatusColor = (metric: PerformanceMetric): string => {
  if (!metric.threshold) return 'text-gray-600';
  
  if (metric.value >= metric.threshold.critical) {
    return 'text-red-600';
  }
  if (metric.value >= metric.threshold.warning) {
    return 'text-yellow-600';
  }
  return 'text-green-600';
};

export const getHealthScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

export const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '↗️';
    case 'down': return '↘️';
    case 'stable': return '→';
    default: return '→';
  }
};

export const calculateSystemHealth = (resources: SystemResource[], alerts: PerformanceAlert[]): 'excellent' | 'good' | 'warning' | 'critical' => {
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
  const warningAlerts = alerts.filter(a => a.type === 'warning').length;
  const avgUsage = resources.reduce((acc, r) => acc + r.usage, 0) / resources.length;
  
  if (criticalAlerts > 0 || avgUsage > 90) return 'critical';
  if (warningAlerts > 2 || avgUsage > 80) return 'warning';
  if (warningAlerts > 0 || avgUsage > 60) return 'good';
  return 'excellent';
};

export const generatePerformanceRecommendations = (metrics: PerformanceMetric[], resources: SystemResource[]): string[] => {
  const recommendations: string[] = [];
  
  // CPU recommendations
  const cpuUsage = resources.find(r => r.type === 'cpu')?.usage || 0;
  if (cpuUsage > 80) {
    recommendations.push('Considere otimizar processos que consomem muito CPU');
  }
  
  // Memory recommendations
  const memoryUsage = resources.find(r => r.type === 'memory')?.usage || 0;
  if (memoryUsage > 85) {
    recommendations.push('Aumente a memória RAM ou otimize o uso de memória');
  }
  
  // Render performance
  const renderMetric = metrics.find(m => m.category === 'render');
  if (renderMetric && renderMetric.value > 20) {
    recommendations.push('Otimize a renderização para melhorar a performance');
  }
  
  return recommendations;
};

// Export default hook
export default usePerformanceDashboardStore;