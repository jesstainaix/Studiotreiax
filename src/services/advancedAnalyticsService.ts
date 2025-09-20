import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: 'performance' | 'engagement' | 'usage' | 'quality' | 'business';
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  lastUpdated: Date;
  description: string;
  formula?: string;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge';
  data: any[];
  config: {
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
    timeRange?: string;
    filters?: Record<string, any>;
  };
  category: string;
  refreshInterval: number;
  lastUpdated: Date;
  isRealtime: boolean;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  layout: {
    widgets: {
      id: string;
      type: 'metric' | 'chart' | 'table' | 'kpi' | 'alert';
      position: { x: number; y: number; w: number; h: number };
      config: Record<string, any>;
    }[];
  };
  filters: AnalyticsFilter[];
  isPublic: boolean;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description: string;
  type: 'scheduled' | 'on-demand' | 'triggered';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    timezone: string;
    recipients: string[];
  };
  template: {
    sections: {
      id: string;
      title: string;
      type: 'metrics' | 'charts' | 'tables' | 'text';
      content: any;
    }[];
  };
  lastGenerated?: Date;
  status: 'active' | 'paused' | 'error';
  createdAt: Date;
}

export interface AnalyticsAlert {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: {
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
    value: number;
    duration?: number; // minutes
  };
  severity: 'info' | 'warning' | 'critical';
  channels: ('email' | 'slack' | 'webhook' | 'sms')[];
  recipients: string[];
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
}

export interface AnalyticsFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'between' | 'in';
  value: any;
  label: string;
}

export interface AnalyticsSegment {
  id: string;
  name: string;
  description: string;
  criteria: AnalyticsFilter[];
  userCount: number;
  metrics: Record<string, number>;
  createdAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  type: 'metric_updated' | 'alert_triggered' | 'report_generated' | 'dashboard_viewed';
  timestamp: Date;
  data: Record<string, any>;
  userId?: string;
}

export interface AnalyticsStats {
  totalMetrics: number;
  activeAlerts: number;
  scheduledReports: number;
  dashboardViews: number;
  dataPoints: number;
  lastUpdate: Date;
}

export interface AnalyticsConfig {
  refreshInterval: number;
  retentionDays: number;
  maxDataPoints: number;
  enableRealtime: boolean;
  enableAlerts: boolean;
  enableReports: boolean;
  defaultTimeRange: string;
  timezone: string;
}

// Zustand Store
interface AdvancedAnalyticsStore {
  // State
  metrics: AnalyticsMetric[];
  charts: AnalyticsChart[];
  dashboards: AnalyticsDashboard[];
  reports: AnalyticsReport[];
  alerts: AnalyticsAlert[];
  segments: AnalyticsSegment[];
  events: AnalyticsEvent[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  currentDashboard: string | null;
  selectedTimeRange: string;
  activeFilters: AnalyticsFilter[];
  searchQuery: string;
  
  // Progress and Status
  progress: {
    isActive: boolean;
    progress: number;
    operation: string;
  };
  
  // Configuration
  config: AnalyticsConfig;
  stats: AnalyticsStats;
  
  // Computed Values
  computedValues: {
    metricsByCategory: Record<string, AnalyticsMetric[]>;
    chartsByCategory: Record<string, AnalyticsChart[]>;
    alertsByStatus: Record<string, AnalyticsAlert[]>;
    recentEvents: AnalyticsEvent[];
    performanceScore: number;
    healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
    trendsAnalysis: {
      improving: number;
      declining: number;
      stable: number;
    };
  };
  
  // Filtered Data
  filteredMetrics: AnalyticsMetric[];
  filteredCharts: AnalyticsChart[];
  filteredDashboards: AnalyticsDashboard[];
  filteredReports: AnalyticsReport[];
  filteredAlerts: AnalyticsAlert[];
  
  // Actions
  actions: {
    // Metrics Management
    addMetric: (metric: Omit<AnalyticsMetric, 'id' | 'lastUpdated'>) => Promise<void>;
    updateMetric: (id: string, updates: Partial<AnalyticsMetric>) => Promise<void>;
    deleteMetric: (id: string) => Promise<void>;
    refreshMetric: (id: string) => Promise<void>;
    
    // Charts Management
    addChart: (chart: Omit<AnalyticsChart, 'id' | 'lastUpdated'>) => Promise<void>;
    updateChart: (id: string, updates: Partial<AnalyticsChart>) => Promise<void>;
    deleteChart: (id: string) => Promise<void>;
    refreshChart: (id: string) => Promise<void>;
    
    // Dashboards Management
    createDashboard: (dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateDashboard: (id: string, updates: Partial<AnalyticsDashboard>) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    duplicateDashboard: (id: string, name: string) => Promise<void>;
    
    // Reports Management
    createReport: (report: Omit<AnalyticsReport, 'id' | 'createdAt'>) => Promise<void>;
    updateReport: (id: string, updates: Partial<AnalyticsReport>) => Promise<void>;
    deleteReport: (id: string) => Promise<void>;
    generateReport: (id: string) => Promise<void>;
    
    // Alerts Management
    createAlert: (alert: Omit<AnalyticsAlert, 'id' | 'createdAt' | 'triggerCount'>) => Promise<void>;
    updateAlert: (id: string, updates: Partial<AnalyticsAlert>) => Promise<void>;
    deleteAlert: (id: string) => Promise<void>;
    testAlert: (id: string) => Promise<void>;
    
    // Segments Management
    createSegment: (segment: Omit<AnalyticsSegment, 'id' | 'createdAt'>) => Promise<void>;
    updateSegment: (id: string, updates: Partial<AnalyticsSegment>) => Promise<void>;
    deleteSegment: (id: string) => Promise<void>;
    
    // Data Operations
    refresh: () => Promise<void>;
    exportData: (format: 'csv' | 'json' | 'excel', filters?: AnalyticsFilter[]) => Promise<void>;
    importData: (data: any, type: string) => Promise<void>;
    
    // Search and Filter
    setSearchQuery: (query: string) => void;
    addFilter: (filter: AnalyticsFilter) => void;
    removeFilter: (filterId: string) => void;
    clearFilters: () => void;
    setTimeRange: (range: string) => void;
    
    // UI Actions
    setCurrentDashboard: (dashboardId: string | null) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  };
  
  // Quick Actions
  quickActions: {
    createKPIDashboard: () => Promise<void>;
    createPerformanceDashboard: () => Promise<void>;
    createEngagementDashboard: () => Promise<void>;
    setupBasicAlerts: () => Promise<void>;
    generateWeeklyReport: () => Promise<void>;
    analyzeUserBehavior: () => Promise<void>;
  };
  
  // Advanced Features
  advancedFeatures: {
    enablePredictiveAnalytics: () => Promise<void>;
    enableAnomalyDetection: () => Promise<void>;
    enableRealTimeStreaming: () => Promise<void>;
    enableCustomMetrics: () => Promise<void>;
    enableDataVisualization: () => Promise<void>;
    enableAutomatedInsights: () => Promise<void>;
  };
  
  // System Operations
  systemOperations: {
    optimizePerformance: () => Promise<void>;
    cleanupOldData: () => Promise<void>;
    validateDataIntegrity: () => Promise<void>;
    backupAnalyticsData: () => Promise<void>;
    restoreFromBackup: (backupId: string) => Promise<void>;
  };
  
  // Utilities
  utilities: {
    calculateTrend: (current: number, previous: number) => 'up' | 'down' | 'stable';
    formatMetricValue: (value: number, unit: string) => string;
    getMetricColor: (metric: AnalyticsMetric) => string;
    validateMetricFormula: (formula: string) => boolean;
    generateInsight: (metric: AnalyticsMetric) => string;
  };
  
  // Configuration
  configuration: {
    updateConfig: (updates: Partial<AnalyticsConfig>) => Promise<void>;
    resetConfig: () => Promise<void>;
    exportConfig: () => Promise<void>;
    importConfig: (config: AnalyticsConfig) => Promise<void>;
  };
  
  // Analytics and Debug
  analytics: {
    getUsageStats: () => Record<string, any>;
    getPerformanceMetrics: () => Record<string, any>;
    getErrorLogs: () => any[];
    generateDiagnostics: () => Record<string, any>;
  };
}

// Create Store
export const useAdvancedAnalyticsStore = create<AdvancedAnalyticsStore>()
  (subscribeWithSelector((set, get) => ({
    // Initial State
    metrics: [
      {
        id: 'metric-1',
        name: 'Usuários Ativos',
        value: 1247,
        previousValue: 1156,
        unit: 'usuários',
        category: 'engagement',
        trend: 'up',
        change: 91,
        changePercent: 7.9,
        target: 1500,
        threshold: { warning: 1000, critical: 800 },
        lastUpdated: new Date(),
        description: 'Número total de usuários ativos no período',
        formula: 'COUNT(DISTINCT user_id) WHERE last_activity >= NOW() - INTERVAL 30 DAY'
      },
      {
        id: 'metric-2',
        name: 'Taxa de Conversão',
        value: 3.2,
        previousValue: 2.8,
        unit: '%',
        category: 'business',
        trend: 'up',
        change: 0.4,
        changePercent: 14.3,
        target: 5.0,
        threshold: { warning: 2.0, critical: 1.5 },
        lastUpdated: new Date(),
        description: 'Percentual de visitantes que se tornam clientes',
        formula: '(conversions / visitors) * 100'
      },
      {
        id: 'metric-3',
        name: 'Tempo de Carregamento',
        value: 1.8,
        previousValue: 2.1,
        unit: 's',
        category: 'performance',
        trend: 'down',
        change: -0.3,
        changePercent: -14.3,
        target: 1.5,
        threshold: { warning: 3.0, critical: 5.0 },
        lastUpdated: new Date(),
        description: 'Tempo médio de carregamento das páginas',
        formula: 'AVG(page_load_time)'
      }
    ],
    
    charts: [
      {
        id: 'chart-1',
        title: 'Usuários por Dia',
        type: 'line',
        data: [],
        config: {
          xAxis: 'date',
          yAxis: 'users',
          timeRange: '30d',
          aggregation: 'count'
        },
        category: 'engagement',
        refreshInterval: 300000, // 5 minutes
        lastUpdated: new Date(),
        isRealtime: true
      },
      {
        id: 'chart-2',
        title: 'Performance por Página',
        type: 'bar',
        data: [],
        config: {
          xAxis: 'page',
          yAxis: 'load_time',
          aggregation: 'avg'
        },
        category: 'performance',
        refreshInterval: 600000, // 10 minutes
        lastUpdated: new Date(),
        isRealtime: false
      }
    ],
    
    dashboards: [
      {
        id: 'dashboard-1',
        name: 'Dashboard Principal',
        description: 'Visão geral das métricas principais',
        layout: {
          widgets: [
            {
              id: 'widget-1',
              type: 'metric',
              position: { x: 0, y: 0, w: 3, h: 2 },
              config: { metricId: 'metric-1' }
            },
            {
              id: 'widget-2',
              type: 'chart',
              position: { x: 3, y: 0, w: 6, h: 4 },
              config: { chartId: 'chart-1' }
            }
          ]
        },
        filters: [],
        isPublic: false,
        owner: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    
    reports: [
      {
        id: 'report-1',
        name: 'Relatório Semanal',
        description: 'Relatório automático semanal com métricas principais',
        type: 'scheduled',
        format: 'pdf',
        schedule: {
          frequency: 'weekly',
          time: '09:00',
          timezone: 'America/Sao_Paulo',
          recipients: ['admin@studio.com']
        },
        template: {
          sections: [
            {
              id: 'section-1',
              title: 'Métricas Principais',
              type: 'metrics',
              content: ['metric-1', 'metric-2', 'metric-3']
            }
          ]
        },
        status: 'active',
        createdAt: new Date()
      }
    ],
    
    alerts: [
      {
        id: 'alert-1',
        name: 'Usuários Ativos Baixos',
        description: 'Alerta quando usuários ativos ficam abaixo do limite',
        metric: 'metric-1',
        condition: {
          operator: '<',
          value: 1000,
          duration: 15
        },
        severity: 'warning',
        channels: ['email'],
        recipients: ['admin@studio.com'],
        isActive: true,
        triggerCount: 0,
        createdAt: new Date()
      }
    ],
    
    segments: [
      {
        id: 'segment-1',
        name: 'Usuários Premium',
        description: 'Usuários com plano premium ativo',
        criteria: [
          {
            id: 'filter-1',
            field: 'plan_type',
            operator: 'equals',
            value: 'premium',
            label: 'Plano Premium'
          }
        ],
        userCount: 342,
        metrics: {
          engagement: 8.7,
          retention: 94.2,
          satisfaction: 9.1
        },
        createdAt: new Date()
      }
    ],
    
    events: [],
    
    // UI State
    isLoading: false,
    error: null,
    currentDashboard: null,
    selectedTimeRange: '30d',
    activeFilters: [],
    searchQuery: '',
    
    // Progress
    progress: {
      isActive: false,
      progress: 0,
      operation: ''
    },
    
    // Configuration
    config: {
      refreshInterval: 300000, // 5 minutes
      retentionDays: 365,
      maxDataPoints: 10000,
      enableRealtime: true,
      enableAlerts: true,
      enableReports: true,
      defaultTimeRange: '30d',
      timezone: 'America/Sao_Paulo'
    },
    
    stats: {
      totalMetrics: 0,
      activeAlerts: 0,
      scheduledReports: 0,
      dashboardViews: 0,
      dataPoints: 0,
      lastUpdate: new Date()
    },
    
    // Computed Values
    computedValues: {
      metricsByCategory: {},
      chartsByCategory: {},
      alertsByStatus: {},
      recentEvents: [],
      performanceScore: 85,
      healthStatus: 'good',
      trendsAnalysis: {
        improving: 0,
        declining: 0,
        stable: 0
      }
    },
    
    // Filtered Data
    filteredMetrics: [],
    filteredCharts: [],
    filteredDashboards: [],
    filteredReports: [],
    filteredAlerts: [],
    
    // Actions
    actions: {
      addMetric: async (metric) => {
        set((state) => ({
          metrics: [...state.metrics, {
            ...metric,
            id: `metric-${Date.now()}`,
            lastUpdated: new Date()
          }]
        }));
      },
      
      updateMetric: async (id, updates) => {
        set((state) => ({
          metrics: state.metrics.map(metric =>
            metric.id === id ? { ...metric, ...updates, lastUpdated: new Date() } : metric
          )
        }));
      },
      
      deleteMetric: async (id) => {
        set((state) => ({
          metrics: state.metrics.filter(metric => metric.id !== id)
        }));
      },
      
      refreshMetric: async (id) => {
        // Simulate metric refresh
        const metric = get().metrics.find(m => m.id === id);
        if (metric) {
          const newValue = metric.value + (Math.random() - 0.5) * metric.value * 0.1;
          await get().actions.updateMetric(id, {
            previousValue: metric.value,
            value: newValue,
            change: newValue - metric.value,
            changePercent: ((newValue - metric.value) / metric.value) * 100,
            trend: newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable'
          });
        }
      },
      
      addChart: async (chart) => {
        set((state) => ({
          charts: [...state.charts, {
            ...chart,
            id: `chart-${Date.now()}`,
            lastUpdated: new Date()
          }]
        }));
      },
      
      updateChart: async (id, updates) => {
        set((state) => ({
          charts: state.charts.map(chart =>
            chart.id === id ? { ...chart, ...updates, lastUpdated: new Date() } : chart
          )
        }));
      },
      
      deleteChart: async (id) => {
        set((state) => ({
          charts: state.charts.filter(chart => chart.id !== id)
        }));
      },
      
      refreshChart: async (id) => {
        // Simulate chart data refresh
        const chart = get().charts.find(c => c.id === id);
        if (chart) {
          const newData = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 1000) + 500
          }));
          await get().actions.updateChart(id, { data: newData });
        }
      },
      
      createDashboard: async (dashboard) => {
        set((state) => ({
          dashboards: [...state.dashboards, {
            ...dashboard,
            id: `dashboard-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        }));
      },
      
      updateDashboard: async (id, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map(dashboard =>
            dashboard.id === id ? { ...dashboard, ...updates, updatedAt: new Date() } : dashboard
          )
        }));
      },
      
      deleteDashboard: async (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter(dashboard => dashboard.id !== id)
        }));
      },
      
      duplicateDashboard: async (id, name) => {
        const dashboard = get().dashboards.find(d => d.id === id);
        if (dashboard) {
          await get().actions.createDashboard({
            ...dashboard,
            name,
            id: undefined as any
          });
        }
      },
      
      createReport: async (report) => {
        set((state) => ({
          reports: [...state.reports, {
            ...report,
            id: `report-${Date.now()}`,
            createdAt: new Date()
          }]
        }));
      },
      
      updateReport: async (id, updates) => {
        set((state) => ({
          reports: state.reports.map(report =>
            report.id === id ? { ...report, ...updates } : report
          )
        }));
      },
      
      deleteReport: async (id) => {
        set((state) => ({
          reports: state.reports.filter(report => report.id !== id)
        }));
      },
      
      generateReport: async (id) => {
        await get().actions.updateReport(id, {
          lastGenerated: new Date()
        });
      },
      
      createAlert: async (alert) => {
        set((state) => ({
          alerts: [...state.alerts, {
            ...alert,
            id: `alert-${Date.now()}`,
            triggerCount: 0,
            createdAt: new Date()
          }]
        }));
      },
      
      updateAlert: async (id, updates) => {
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id ? { ...alert, ...updates } : alert
          )
        }));
      },
      
      deleteAlert: async (id) => {
        set((state) => ({
          alerts: state.alerts.filter(alert => alert.id !== id)
        }));
      },
      
      testAlert: async (id) => {
        const alert = get().alerts.find(a => a.id === id);
        if (alert) {
          await get().actions.updateAlert(id, {
            lastTriggered: new Date(),
            triggerCount: alert.triggerCount + 1
          });
        }
      },
      
      createSegment: async (segment) => {
        set((state) => ({
          segments: [...state.segments, {
            ...segment,
            id: `segment-${Date.now()}`,
            createdAt: new Date()
          }]
        }));
      },
      
      updateSegment: async (id, updates) => {
        set((state) => ({
          segments: state.segments.map(segment =>
            segment.id === id ? { ...segment, ...updates } : segment
          )
        }));
      },
      
      deleteSegment: async (id) => {
        set((state) => ({
          segments: state.segments.filter(segment => segment.id !== id)
        }));
      },
      
      refresh: async () => {
        set({ isLoading: true });
        try {
          // Simulate data refresh
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update stats
          const state = get();
          set({
            stats: {
              totalMetrics: state.metrics.length,
              activeAlerts: state.alerts.filter(a => a.isActive).length,
              scheduledReports: state.reports.filter(r => r.type === 'scheduled').length,
              dashboardViews: Math.floor(Math.random() * 1000),
              dataPoints: Math.floor(Math.random() * 10000),
              lastUpdate: new Date()
            }
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      exportData: async (format, filters) => {
        // Simulate data export
      },
      
      importData: async (data, type) => {
        // Simulate data import
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      addFilter: (filter) => {
        set((state) => ({
          activeFilters: [...state.activeFilters, filter]
        }));
      },
      
      removeFilter: (filterId) => {
        set((state) => ({
          activeFilters: state.activeFilters.filter(f => f.id !== filterId)
        }));
      },
      
      clearFilters: () => {
        set({ activeFilters: [] });
      },
      
      setTimeRange: (range) => {
        set({ selectedTimeRange: range });
      },
      
      setCurrentDashboard: (dashboardId) => {
        set({ currentDashboard: dashboardId });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      clearError: () => {
        set({ error: null });
      }
    },
    
    // Quick Actions
    quickActions: {
      createKPIDashboard: async () => {
        await get().actions.createDashboard({
          name: 'Dashboard KPI',
          description: 'Dashboard com indicadores chave de performance',
          layout: {
            widgets: [
              {
                id: 'kpi-1',
                type: 'metric',
                position: { x: 0, y: 0, w: 3, h: 2 },
                config: { metricId: 'metric-1' }
              },
              {
                id: 'kpi-2',
                type: 'metric',
                position: { x: 3, y: 0, w: 3, h: 2 },
                config: { metricId: 'metric-2' }
              }
            ]
          },
          filters: [],
          isPublic: false,
          owner: 'user-1'
        });
      },
      
      createPerformanceDashboard: async () => {
        await get().actions.createDashboard({
          name: 'Dashboard Performance',
          description: 'Dashboard focado em métricas de performance',
          layout: {
            widgets: [
              {
                id: 'perf-1',
                type: 'chart',
                position: { x: 0, y: 0, w: 6, h: 4 },
                config: { chartId: 'chart-2' }
              }
            ]
          },
          filters: [],
          isPublic: false,
          owner: 'user-1'
        });
      },
      
      createEngagementDashboard: async () => {
        await get().actions.createDashboard({
          name: 'Dashboard Engajamento',
          description: 'Dashboard focado em métricas de engajamento',
          layout: {
            widgets: [
              {
                id: 'eng-1',
                type: 'chart',
                position: { x: 0, y: 0, w: 6, h: 4 },
                config: { chartId: 'chart-1' }
              }
            ]
          },
          filters: [],
          isPublic: false,
          owner: 'user-1'
        });
      },
      
      setupBasicAlerts: async () => {
        const basicAlerts = [
          {
            name: 'Performance Crítica',
            description: 'Alerta quando tempo de carregamento é muito alto',
            metric: 'metric-3',
            condition: { operator: '>' as const, value: 5.0 },
            severity: 'critical' as const,
            channels: ['email' as const],
            recipients: ['admin@studio.com'],
            isActive: true
          },
          {
            name: 'Conversão Baixa',
            description: 'Alerta quando taxa de conversão fica baixa',
            metric: 'metric-2',
            condition: { operator: '<' as const, value: 2.0 },
            severity: 'warning' as const,
            channels: ['email' as const],
            recipients: ['admin@studio.com'],
            isActive: true
          }
        ];
        
        for (const alert of basicAlerts) {
          await get().actions.createAlert(alert);
        }
      },
      
      generateWeeklyReport: async () => {
        await get().actions.createReport({
          name: 'Relatório Semanal Automático',
          description: 'Relatório automático com métricas da semana',
          type: 'scheduled',
          format: 'pdf',
          schedule: {
            frequency: 'weekly',
            time: '08:00',
            timezone: 'America/Sao_Paulo',
            recipients: ['admin@studio.com']
          },
          template: {
            sections: [
              {
                id: 'weekly-metrics',
                title: 'Métricas da Semana',
                type: 'metrics',
                content: ['metric-1', 'metric-2', 'metric-3']
              }
            ]
          },
          status: 'active'
        });
      },
      
      analyzeUserBehavior: async () => {
        await get().actions.createSegment({
          name: 'Usuários Engajados',
          description: 'Usuários com alto nível de engajamento',
          criteria: [
            {
              id: 'engagement-filter',
              field: 'session_duration',
              operator: '>',
              value: 300,
              label: 'Sessão > 5min'
            }
          ],
          userCount: 0,
          metrics: {}
        });
      }
    },
    
    // Advanced Features
    advancedFeatures: {
      enablePredictiveAnalytics: async () => {
      },
      
      enableAnomalyDetection: async () => {
      },
      
      enableRealTimeStreaming: async () => {
        await get().configuration.updateConfig({ enableRealtime: true });
      },
      
      enableCustomMetrics: async () => {
      },
      
      enableDataVisualization: async () => {
      },
      
      enableAutomatedInsights: async () => {
      }
    },
    
    // System Operations
    systemOperations: {
      optimizePerformance: async () => {
      },
      
      cleanupOldData: async () => {
      },
      
      validateDataIntegrity: async () => {
      },
      
      backupAnalyticsData: async () => {
      },
      
      restoreFromBackup: async (backupId) => {
      }
    },
    
    // Utilities
    utilities: {
      calculateTrend: (current, previous) => {
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'stable';
      },
      
      formatMetricValue: (value, unit) => {
        if (unit === '%') return `${value.toFixed(1)}%`;
        if (unit === 's') return `${value.toFixed(2)}s`;
        if (unit === 'ms') return `${value.toFixed(0)}ms`;
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ${unit}`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K ${unit}`;
        return `${value.toFixed(0)} ${unit}`;
      },
      
      getMetricColor: (metric) => {
        if (metric.threshold) {
          if (metric.value <= metric.threshold.critical) return 'text-red-600';
          if (metric.value <= metric.threshold.warning) return 'text-yellow-600';
        }
        if (metric.trend === 'up') return 'text-green-600';
        if (metric.trend === 'down') return 'text-red-600';
        return 'text-gray-600';
      },
      
      validateMetricFormula: (formula) => {
        // Simple validation - in real app would be more sophisticated
        return formula.length > 0 && !formula.includes('DROP') && !formula.includes('DELETE');
      },
      
      generateInsight: (metric) => {
        if (metric.trend === 'up' && metric.changePercent > 10) {
          return `${metric.name} teve um crescimento significativo de ${metric.changePercent.toFixed(1)}%`;
        }
        if (metric.trend === 'down' && metric.changePercent < -10) {
          return `${metric.name} teve uma queda preocupante de ${Math.abs(metric.changePercent).toFixed(1)}%`;
        }
        return `${metric.name} está estável com variação de ${metric.changePercent.toFixed(1)}%`;
      }
    },
    
    // Configuration
    configuration: {
      updateConfig: async (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates }
        }));
      },
      
      resetConfig: async () => {
        set({
          config: {
            refreshInterval: 300000,
            retentionDays: 365,
            maxDataPoints: 10000,
            enableRealtime: true,
            enableAlerts: true,
            enableReports: true,
            defaultTimeRange: '30d',
            timezone: 'America/Sao_Paulo'
          }
        });
      },
      
      exportConfig: async () => {
        const config = get().config;
      },
      
      importConfig: async (config) => {
        set({ config });
      }
    },
    
    // Analytics and Debug
    analytics: {
      getUsageStats: () => {
        const state = get();
        return {
          totalMetrics: state.metrics.length,
          totalCharts: state.charts.length,
          totalDashboards: state.dashboards.length,
          totalReports: state.reports.length,
          totalAlerts: state.alerts.length
        };
      },
      
      getPerformanceMetrics: () => {
        return {
          memoryUsage: Math.random() * 100,
          cpuUsage: Math.random() * 100,
          responseTime: Math.random() * 1000,
          throughput: Math.random() * 10000
        };
      },
      
      getErrorLogs: () => {
        return [];
      },
      
      generateDiagnostics: () => {
        const state = get();
        return {
          systemHealth: 'good',
          dataIntegrity: 'valid',
          performanceScore: state.computedValues.performanceScore,
          lastUpdate: state.stats.lastUpdate
        };
      }
    }
  })));

// Advanced Analytics Manager Class
export class AdvancedAnalyticsManager {
  private static instance: AdvancedAnalyticsManager;
  
  static getInstance(): AdvancedAnalyticsManager {
    if (!AdvancedAnalyticsManager.instance) {
      AdvancedAnalyticsManager.instance = new AdvancedAnalyticsManager();
    }
    return AdvancedAnalyticsManager.instance;
  }
  
  // Real-time data streaming
  startRealTimeStreaming() {
    // Implementation for real-time data streaming
  }
  
  stopRealTimeStreaming() {
  }
  
  // Predictive analytics
  generatePredictions(metricId: string, timeframe: number) {
    // Implementation for predictive analytics
  }
  
  // Anomaly detection
  detectAnomalies(metricId: string) {
    // Implementation for anomaly detection
  }
}

// Utility Functions
export const formatAnalyticsValue = (value: number, unit: string): string => {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 's') return `${value.toFixed(2)}s`;
  if (unit === 'ms') return `${value.toFixed(0)}ms`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

export const getAnalyticsColor = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return 'text-green-600';
    case 'down': return 'text-red-600';
    case 'stable': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getAnalyticsIcon = (category: AnalyticsMetric['category']): string => {
  switch (category) {
    case 'performance': return 'Zap';
    case 'engagement': return 'Users';
    case 'usage': return 'Activity';
    case 'quality': return 'CheckCircle';
    case 'business': return 'TrendingUp';
    default: return 'BarChart3';
  }
};

export const calculateAnalyticsScore = (metrics: AnalyticsMetric[]): number => {
  if (metrics.length === 0) return 0;
  
  const scores = metrics.map(metric => {
    if (metric.target) {
      return Math.min((metric.value / metric.target) * 100, 100);
    }
    return metric.trend === 'up' ? 80 : metric.trend === 'down' ? 40 : 60;
  });
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

export const generateAnalyticsRecommendations = (metrics: AnalyticsMetric[]): string[] => {
  const recommendations: string[] = [];
  
  metrics.forEach(metric => {
    if (metric.threshold && metric.value <= metric.threshold.warning) {
      recommendations.push(`Considere otimizar ${metric.name} - valor atual está abaixo do esperado`);
    }
    
    if (metric.trend === 'down' && metric.changePercent < -20) {
      recommendations.push(`${metric.name} teve uma queda significativa - investigar causas`);
    }
    
    if (metric.target && metric.value >= metric.target) {
      recommendations.push(`${metric.name} atingiu a meta - considere aumentar o objetivo`);
    }
  });
  
  return recommendations;
};