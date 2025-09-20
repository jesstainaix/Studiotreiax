// Sistema avançado de dashboard de métricas em tempo real
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Interfaces
export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram' | 'rate' | 'percentage';
  category: string;
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercentage: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'gauge' | 'progress' | 'alert' | 'custom';
  position: { x: number; y: number; width: number; height: number };
  config: {
    metricIds?: string[];
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    timeRange?: string;
    refreshInterval?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    colors?: string[];
    thresholds?: Array<{ value: number; color: string; label: string }>;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    groupBy?: string;
    filters?: Record<string, any>;
  };
  isVisible: boolean;
  isMinimized: boolean;
  lastUpdated: number;
  data?: any;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metricId: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  isActive: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  actions?: Array<{
    id: string;
    label: string;
    type: 'button' | 'link' | 'script';
    action: string;
  }>;
  metadata?: Record<string, any>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  isShared: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'websocket' | 'database' | 'file' | 'custom';
  url?: string;
  credentials?: Record<string, string>;
  refreshInterval: number;
  isActive: boolean;
  lastSync: number;
  status: 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
  config: Record<string, any>;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: Array<{ value: string; label: string }>;
  value: any;
  defaultValue: any;
  isGlobal: boolean;
  affectedWidgets: string[];
}

export interface DashboardStats {
  totalMetrics: number;
  activeWidgets: number;
  activeAlerts: number;
  dataPoints: number;
  lastUpdate: number;
  updateFrequency: number;
  performance: {
    avgRenderTime: number;
    avgDataFetchTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  uptime: number;
}

export interface DashboardConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  enableAlerts: boolean;
  enableNotifications: boolean;
  enableRealTimeUpdates: boolean;
  maxDataPoints: number;
  retentionPeriod: number;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  enableAnimations: boolean;
  enableSounds: boolean;
  alertSoundVolume: number;
  enableKeyboardShortcuts: boolean;
  enableTooltips: boolean;
  enableExport: boolean;
  enableSharing: boolean;
  enableCollaboration: boolean;
  maxConcurrentUsers: number;
}

// Store
interface DashboardStore {
  // Estado
  metrics: DashboardMetric[];
  widgets: DashboardWidget[];
  alerts: DashboardAlert[];
  layouts: DashboardLayout[];
  dataSources: DataSource[];
  filters: DashboardFilter[];
  currentLayout: string;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  stats: DashboardStats;
  config: DashboardConfig;
  
  // Ações - Métricas
  addMetric: (metric: Omit<DashboardMetric, 'id' | 'timestamp'>) => void;
  updateMetric: (id: string, updates: Partial<DashboardMetric>) => void;
  removeMetric: (id: string) => void;
  updateMetricValue: (id: string, value: number) => void;
  bulkUpdateMetrics: (updates: Array<{ id: string; value: number }>) => void;
  
  // Ações - Widgets
  addWidget: (widget: Omit<DashboardWidget, 'id' | 'lastUpdated'>) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, position: { x: number; y: number }) => void;
  resizeWidget: (id: string, size: { width: number; height: number }) => void;
  toggleWidgetVisibility: (id: string) => void;
  minimizeWidget: (id: string) => void;
  maximizeWidget: (id: string) => void;
  refreshWidget: (id: string) => void;
  
  // Ações - Alertas
  addAlert: (alert: Omit<DashboardAlert, 'id' | 'timestamp'>) => void;
  updateAlert: (id: string, updates: Partial<DashboardAlert>) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string, userId: string) => void;
  dismissAlert: (id: string) => void;
  triggerAlert: (metricId: string, threshold: number, currentValue: number) => void;
  
  // Ações - Layouts
  addLayout: (layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLayout: (id: string, updates: Partial<DashboardLayout>) => void;
  removeLayout: (id: string) => void;
  switchLayout: (id: string) => void;
  saveCurrentLayout: (name: string, description?: string) => void;
  shareLayout: (id: string, users: string[]) => void;
  
  // Ações - Fontes de dados
  addDataSource: (dataSource: Omit<DataSource, 'id' | 'lastSync'>) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  connectDataSource: (id: string) => void;
  disconnectDataSource: (id: string) => void;
  syncDataSource: (id: string) => void;
  
  // Ações - Filtros
  addFilter: (filter: Omit<DashboardFilter, 'id'>) => void;
  updateFilter: (id: string, updates: Partial<DashboardFilter>) => void;
  removeFilter: (id: string) => void;
  setFilterValue: (id: string, value: any) => void;
  resetFilters: () => void;
  
  // Ações - Configuração
  updateConfig: (updates: Partial<DashboardConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;
  
  // Ações - Dados
  refreshData: () => void;
  clearData: () => void;
  exportData: (format: 'json' | 'csv' | 'excel') => Promise<Blob>;
  importData: (data: any) => void;
  
  // Ações - Sistema
  initialize: () => void;
  shutdown: () => void;
  reset: () => void;
  updateStats: () => void;
}

const defaultConfig: DashboardConfig = {
  autoRefresh: true,
  refreshInterval: 5000,
  enableAlerts: true,
  enableNotifications: true,
  enableRealTimeUpdates: true,
  maxDataPoints: 1000,
  retentionPeriod: 7,
  theme: 'auto',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  numberFormat: 'en-US',
  enableAnimations: true,
  enableSounds: true,
  alertSoundVolume: 0.5,
  enableKeyboardShortcuts: true,
  enableTooltips: true,
  enableExport: true,
  enableSharing: true,
  enableCollaboration: true,
  maxConcurrentUsers: 10
};

const defaultStats: DashboardStats = {
  totalMetrics: 0,
  activeWidgets: 0,
  activeAlerts: 0,
  dataPoints: 0,
  lastUpdate: 0,
  updateFrequency: 0,
  performance: {
    avgRenderTime: 0,
    avgDataFetchTime: 0,
    memoryUsage: 0,
    cpuUsage: 0
  },
  uptime: 0
};

export const useDashboardStore = create<DashboardStore>()(subscribeWithSelector((set, get) => ({
  // Estado inicial
  metrics: [],
  widgets: [],
  alerts: [],
  layouts: [],
  dataSources: [],
  filters: [],
  currentLayout: 'default',
  isInitialized: false,
  isLoading: false,
  error: null,
  stats: defaultStats,
  config: defaultConfig,
  
  // Implementação das ações - Métricas
  addMetric: (metric) => {
    const newMetric: DashboardMetric = {
      ...metric,
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      previousValue: metric.value,
      trend: 'stable',
      change: 0,
      changePercentage: 0,
      status: 'normal'
    };
    
    set(state => ({
      metrics: [...state.metrics, newMetric]
    }));
  },
  
  updateMetric: (id, updates) => {
    set(state => ({
      metrics: state.metrics.map(metric => 
        metric.id === id ? { ...metric, ...updates } : metric
      )
    }));
  },
  
  removeMetric: (id) => {
    set(state => ({
      metrics: state.metrics.filter(metric => metric.id !== id)
    }));
  },
  
  updateMetricValue: (id, value) => {
    set(state => ({
      metrics: state.metrics.map(metric => {
        if (metric.id === id) {
          const change = value - metric.value;
          const changePercentage = metric.value !== 0 ? (change / metric.value) * 100 : 0;
          const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
          
          let status: 'normal' | 'warning' | 'critical' = 'normal';
          if (metric.threshold) {
            if (value >= metric.threshold.critical) {
              status = 'critical';
            } else if (value >= metric.threshold.warning) {
              status = 'warning';
            }
          }
          
          return {
            ...metric,
            previousValue: metric.value,
            value,
            change,
            changePercentage,
            trend,
            status,
            timestamp: Date.now()
          };
        }
        return metric;
      })
    }));
  },
  
  bulkUpdateMetrics: (updates) => {
    updates.forEach(({ id, value }) => {
      get().updateMetricValue(id, value);
    });
  },
  
  // Implementação das ações - Widgets
  addWidget: (widget) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: Date.now()
    };
    
    set(state => ({
      widgets: [...state.widgets, newWidget]
    }));
  },
  
  updateWidget: (id, updates) => {
    set(state => ({
      widgets: state.widgets.map(widget => 
        widget.id === id ? { ...widget, ...updates, lastUpdated: Date.now() } : widget
      )
    }));
  },
  
  removeWidget: (id) => {
    set(state => ({
      widgets: state.widgets.filter(widget => widget.id !== id)
    }));
  },
  
  moveWidget: (id, position) => {
    get().updateWidget(id, { position: { ...get().widgets.find(w => w.id === id)?.position, ...position } });
  },
  
  resizeWidget: (id, size) => {
    get().updateWidget(id, { position: { ...get().widgets.find(w => w.id === id)?.position, ...size } });
  },
  
  toggleWidgetVisibility: (id) => {
    const widget = get().widgets.find(w => w.id === id);
    if (widget) {
      get().updateWidget(id, { isVisible: !widget.isVisible });
    }
  },
  
  minimizeWidget: (id) => {
    get().updateWidget(id, { isMinimized: true });
  },
  
  maximizeWidget: (id) => {
    get().updateWidget(id, { isMinimized: false });
  },
  
  refreshWidget: (id) => {
    get().updateWidget(id, { lastUpdated: Date.now() });
  },
  
  // Implementação das ações - Alertas
  addAlert: (alert) => {
    const newAlert: DashboardAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({
      alerts: [...state.alerts, newAlert]
    }));
  },
  
  updateAlert: (id, updates) => {
    set(state => ({
      alerts: state.alerts.map(alert => 
        alert.id === id ? { ...alert, ...updates } : alert
      )
    }));
  },
  
  removeAlert: (id) => {
    set(state => ({
      alerts: state.alerts.filter(alert => alert.id !== id)
    }));
  },
  
  acknowledgeAlert: (id, userId) => {
    get().updateAlert(id, {
      isAcknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: Date.now()
    });
  },
  
  dismissAlert: (id) => {
    get().updateAlert(id, { isActive: false });
  },
  
  triggerAlert: (metricId, threshold, currentValue) => {
    const metric = get().metrics.find(m => m.id === metricId);
    if (!metric) return;
    
    const severity = currentValue >= (metric.threshold?.critical || Infinity) ? 'critical' :
                    currentValue >= (metric.threshold?.warning || Infinity) ? 'warning' : 'info';
    
    get().addAlert({
      title: `Alerta: ${metric.name}`,
      message: `Métrica ${metric.name} atingiu ${currentValue}${metric.unit}, ultrapassando o limite de ${threshold}${metric.unit}`,
      severity,
      metricId,
      threshold,
      currentValue,
      isActive: true,
      isAcknowledged: false
    });
  },
  
  // Implementação das ações - Layouts
  addLayout: (layout) => {
    const newLayout: DashboardLayout = {
      ...layout,
      id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    set(state => ({
      layouts: [...state.layouts, newLayout]
    }));
  },
  
  updateLayout: (id, updates) => {
    set(state => ({
      layouts: state.layouts.map(layout => 
        layout.id === id ? { ...layout, ...updates, updatedAt: Date.now() } : layout
      )
    }));
  },
  
  removeLayout: (id) => {
    set(state => ({
      layouts: state.layouts.filter(layout => layout.id !== id)
    }));
  },
  
  switchLayout: (id) => {
    set({ currentLayout: id });
  },
  
  saveCurrentLayout: (name, description) => {
    const currentWidgets = get().widgets;
    get().addLayout({
      name,
      description,
      widgets: currentWidgets,
      isDefault: false,
      isShared: false,
      createdBy: 'current-user'
    });
  },
  
  shareLayout: (id, users) => {
    get().updateLayout(id, { isShared: true });
  },
  
  // Implementação das ações - Fontes de dados
  addDataSource: (dataSource) => {
    const newDataSource: DataSource = {
      ...dataSource,
      id: `datasource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastSync: 0
    };
    
    set(state => ({
      dataSources: [...state.dataSources, newDataSource]
    }));
  },
  
  updateDataSource: (id, updates) => {
    set(state => ({
      dataSources: state.dataSources.map(ds => 
        ds.id === id ? { ...ds, ...updates } : ds
      )
    }));
  },
  
  removeDataSource: (id) => {
    set(state => ({
      dataSources: state.dataSources.filter(ds => ds.id !== id)
    }));
  },
  
  connectDataSource: (id) => {
    get().updateDataSource(id, { status: 'connected', isActive: true });
  },
  
  disconnectDataSource: (id) => {
    get().updateDataSource(id, { status: 'disconnected', isActive: false });
  },
  
  syncDataSource: (id) => {
    get().updateDataSource(id, { lastSync: Date.now() });
  },
  
  // Implementação das ações - Filtros
  addFilter: (filter) => {
    const newFilter: DashboardFilter = {
      ...filter,
      id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    set(state => ({
      filters: [...state.filters, newFilter]
    }));
  },
  
  updateFilter: (id, updates) => {
    set(state => ({
      filters: state.filters.map(filter => 
        filter.id === id ? { ...filter, ...updates } : filter
      )
    }));
  },
  
  removeFilter: (id) => {
    set(state => ({
      filters: state.filters.filter(filter => filter.id !== id)
    }));
  },
  
  setFilterValue: (id, value) => {
    get().updateFilter(id, { value });
  },
  
  resetFilters: () => {
    set(state => ({
      filters: state.filters.map(filter => ({ ...filter, value: filter.defaultValue }))
    }));
  },
  
  // Implementação das ações - Configuração
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  exportConfig: () => {
    return JSON.stringify(get().config, null, 2);
  },
  
  importConfig: (configStr) => {
    try {
      const config = JSON.parse(configStr);
      set({ config: { ...defaultConfig, ...config } });
    } catch (error) {
      console.error('Erro ao importar configuração:', error);
    }
  },
  
  // Implementação das ações - Dados
  refreshData: () => {
    set({ isLoading: true });
    // Simular refresh de dados
    setTimeout(() => {
      set({ isLoading: false });
      get().updateStats();
    }, 1000);
  },
  
  clearData: () => {
    set({
      metrics: [],
      alerts: [],
      stats: defaultStats
    });
  },
  
  exportData: async (format) => {
    const data = {
      metrics: get().metrics,
      widgets: get().widgets,
      alerts: get().alerts,
      layouts: get().layouts,
      filters: get().filters,
      config: get().config,
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
    
    // Para CSV e Excel, seria necessário implementar conversão específica
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  },
  
  importData: (data) => {
    try {
      set({
        metrics: data.metrics || [],
        widgets: data.widgets || [],
        alerts: data.alerts || [],
        layouts: data.layouts || [],
        filters: data.filters || [],
        config: { ...defaultConfig, ...data.config }
      });
    } catch (error) {
      console.error('Erro ao importar dados:', error);
    }
  },
  
  // Implementação das ações - Sistema
  initialize: () => {
    set({ isInitialized: true, isLoading: false, error: null });
    
    // Criar layout padrão se não existir
    const state = get();
    if (state.layouts.length === 0) {
      state.addLayout({
        name: 'Dashboard Padrão',
        description: 'Layout padrão do dashboard',
        widgets: [],
        isDefault: true,
        isShared: false,
        createdBy: 'system'
      });
    }
  },
  
  shutdown: () => {
    set({ isInitialized: false });
  },
  
  reset: () => {
    set({
      metrics: [],
      widgets: [],
      alerts: [],
      layouts: [],
      dataSources: [],
      filters: [],
      currentLayout: 'default',
      isInitialized: false,
      isLoading: false,
      error: null,
      stats: defaultStats,
      config: defaultConfig
    });
  },
  
  updateStats: () => {
    const state = get();
    const now = Date.now();
    
    set({
      stats: {
        totalMetrics: state.metrics.length,
        activeWidgets: state.widgets.filter(w => w.isVisible).length,
        activeAlerts: state.alerts.filter(a => a.isActive && !a.isAcknowledged).length,
        dataPoints: state.metrics.reduce((sum, m) => sum + 1, 0),
        lastUpdate: now,
        updateFrequency: state.config.refreshInterval,
        performance: {
          avgRenderTime: Math.random() * 100 + 50,
          avgDataFetchTime: Math.random() * 200 + 100,
          memoryUsage: Math.random() * 100,
          cpuUsage: Math.random() * 50
        },
        uptime: state.isInitialized ? now - (state.stats.uptime || now) : 0
      }
    });
  }
})));

// Manager class
export class DashboardManager {
  private store = useDashboardStore;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    this.store.getState().initialize();
    this.setupIntervals();
    this.setupEventListeners();
  }
  
  private setupIntervals() {
    // Interval para atualizar estatísticas
    const statsInterval = setInterval(() => {
      this.store.getState().updateStats();
    }, 1000);
    this.intervals.set('stats', statsInterval);
    
    // Interval para refresh automático
    const refreshInterval = setInterval(() => {
      const config = this.store.getState().config;
      if (config.autoRefresh) {
        this.store.getState().refreshData();
      }
    }, this.store.getState().config.refreshInterval);
    this.intervals.set('refresh', refreshInterval);
  }
  
  private setupEventListeners() {
    // Listener para mudanças de configuração
    this.store.subscribe(
      (state) => state.config.refreshInterval,
      (refreshInterval) => {
        // Recriar interval de refresh com novo intervalo
        const oldInterval = this.intervals.get('refresh');
        if (oldInterval) {
          clearInterval(oldInterval);
        }
        
        const newInterval = setInterval(() => {
          const config = this.store.getState().config;
          if (config.autoRefresh) {
            this.store.getState().refreshData();
          }
        }, refreshInterval);
        this.intervals.set('refresh', newInterval);
      }
    );
    
    // Listener para alertas
    this.store.subscribe(
      (state) => state.metrics,
      (metrics) => {
        metrics.forEach(metric => {
          if (metric.threshold) {
            if (metric.value >= metric.threshold.critical || metric.value >= metric.threshold.warning) {
              this.store.getState().triggerAlert(metric.id, metric.threshold.warning, metric.value);
            }
          }
        });
      }
    );
  }
  
  // Métodos públicos
  connectWebSocket(url: string, dataSourceId: string) {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        this.store.getState().updateDataSource(dataSourceId, { status: 'connected' });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.processRealtimeData(data);
        } catch (error) {
          console.error('Erro ao processar dados em tempo real:', error);
        }
      };
      
      ws.onerror = () => {
        this.store.getState().updateDataSource(dataSourceId, { status: 'error' });
      };
      
      ws.onclose = () => {
        this.store.getState().updateDataSource(dataSourceId, { status: 'disconnected' });
      };
      
      this.websockets.set(dataSourceId, ws);
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }
  
  private processRealtimeData(data: any) {
    if (data.type === 'metric_update') {
      this.store.getState().updateMetricValue(data.metricId, data.value);
    } else if (data.type === 'bulk_update') {
      this.store.getState().bulkUpdateMetrics(data.updates);
    }
  }
  
  shutdown() {
    // Limpar intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Fechar WebSockets
    this.websockets.forEach(ws => ws.close());
    this.websockets.clear();
    
    this.store.getState().shutdown();
  }
}

// Instância global
export const dashboardManager = new DashboardManager();

// Funções utilitárias
export const formatNumber = (value: number, locale = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale).format(value);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatBytes = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getMetricIcon = (type: string): string => {
  const icons: Record<string, string> = {
    counter: '🔢',
    gauge: '📊',
    histogram: '📈',
    rate: '⚡',
    percentage: '📊'
  };
  return icons[type] || '📊';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };
  return colors[status] || 'text-gray-600';
};

export const getAlertColor = (severity: string): string => {
  const colors: Record<string, string> = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-orange-600',
    critical: 'text-red-600'
  };
  return colors[severity] || 'text-gray-600';
};

// Hook personalizado
export const useDashboard = () => {
  const store = useDashboardStore();
  
  return {
    ...store,
    
    // Métodos de conveniência
    formatNumber,
    formatPercentage,
    formatBytes,
    formatDuration,
    getMetricIcon,
    getStatusColor,
    getAlertColor,
    
    // Dados derivados
    activeMetrics: store.metrics.filter(m => m.status !== 'normal'),
    criticalAlerts: store.alerts.filter(a => a.severity === 'critical' && a.isActive),
    visibleWidgets: store.widgets.filter(w => w.isVisible),
    connectedDataSources: store.dataSources.filter(ds => ds.status === 'connected'),
    
    // Ações avançadas
    createMetricWidget: (metricId: string, position: { x: number; y: number }) => {
      const metric = store.metrics.find(m => m.id === metricId);
      if (metric) {
        store.addWidget({
          title: metric.name,
          type: 'metric',
          position: { ...position, width: 300, height: 200 },
          config: { metricIds: [metricId] },
          isVisible: true,
          isMinimized: false
        });
      }
    },
    
    createChartWidget: (metricIds: string[], chartType: 'line' | 'bar' | 'pie' | 'area', position: { x: number; y: number }) => {
      store.addWidget({
        title: 'Gráfico Personalizado',
        type: 'chart',
        position: { ...position, width: 500, height: 300 },
        config: { metricIds, chartType },
        isVisible: true,
        isMinimized: false
      });
    },
    
    duplicateWidget: (widgetId: string) => {
      const widget = store.widgets.find(w => w.id === widgetId);
      if (widget) {
        store.addWidget({
          ...widget,
          title: `${widget.title} (Cópia)`,
          position: {
            ...widget.position,
            x: widget.position.x + 20,
            y: widget.position.y + 20
          }
        });
      }
    }
  };
};