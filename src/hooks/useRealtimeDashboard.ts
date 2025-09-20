// Hook React para sistema de dashboard de métricas em tempo real
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useDashboardStore,
  DashboardMetric,
  DashboardWidget,
  DashboardAlert,
  DashboardLayout,
  DataSource,
  DashboardFilter,
  DashboardConfig,
  DashboardStats,
  dashboardManager
} from '../utils/realtimeDashboard';

// Re-export DashboardMetric for convenience
export type { DashboardMetric };

// Interfaces para opções e retorno
export interface DashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAlerts?: boolean;
  enableRealTime?: boolean;
  maxDataPoints?: number;
  theme?: 'light' | 'dark' | 'auto';
}

export interface DashboardHookReturn {
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
  
  // Ações - Layouts
  addLayout: (layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLayout: (id: string, updates: Partial<DashboardLayout>) => void;
  removeLayout: (id: string) => void;
  switchLayout: (id: string) => void;
  saveCurrentLayout: (name: string, description?: string) => void;
  
  // Ações - Fontes de dados
  addDataSource: (dataSource: Omit<DataSource, 'id' | 'lastSync'>) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  connectDataSource: (id: string) => void;
  disconnectDataSource: (id: string) => void;
  
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
  
  // Funções utilitárias
  formatNumber: (value: number, locale?: string) => string;
  formatPercentage: (value: number, decimals?: number) => string;
  formatBytes: (bytes: number) => string;
  formatDuration: (ms: number) => string;
  getMetricIcon: (type: string) => string;
  getStatusColor: (status: string) => string;
  getAlertColor: (severity: string) => string;
  
  // Estado derivado
  activeMetrics: DashboardMetric[];
  criticalAlerts: DashboardAlert[];
  visibleWidgets: DashboardWidget[];
  connectedDataSources: DataSource[];
  performanceMetrics: {
    avgRenderTime: number;
    avgDataFetchTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  
  // Ações avançadas
  createMetricWidget: (metricId: string, position: { x: number; y: number }) => void;
  createChartWidget: (metricIds: string[], chartType: 'line' | 'bar' | 'pie' | 'area', position: { x: number; y: number }) => void;
  duplicateWidget: (widgetId: string) => void;
  generateDemoData: () => void;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
}

// Hook principal
export const useRealtimeDashboard = (options: DashboardOptions = {}): DashboardHookReturn => {
  const store = useDashboardStore();
  const [realTimeInterval, setRealTimeInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Memoizar as opções para evitar re-renders desnecessários
  const memoizedOptions = useMemo(() => options, [
    options.autoRefresh,
    options.refreshInterval,
    options.enableAlerts,
    options.enableRealTime,
    options.maxDataPoints,
    options.theme
  ]);
  
  // Aplicar opções na inicialização (apenas uma vez)
  useEffect(() => {
    const configUpdates: Partial<DashboardConfig> = {};
    
    if (memoizedOptions.autoRefresh !== undefined) {
      configUpdates.autoRefresh = memoizedOptions.autoRefresh;
    }
    if (memoizedOptions.refreshInterval !== undefined) {
      configUpdates.refreshInterval = memoizedOptions.refreshInterval;
    }
    if (memoizedOptions.enableAlerts !== undefined) {
      configUpdates.enableAlerts = memoizedOptions.enableAlerts;
    }
    if (memoizedOptions.enableRealTime !== undefined) {
      configUpdates.enableRealTimeUpdates = memoizedOptions.enableRealTime;
    }
    if (memoizedOptions.maxDataPoints !== undefined) {
      configUpdates.maxDataPoints = memoizedOptions.maxDataPoints;
    }
    if (memoizedOptions.theme !== undefined) {
      configUpdates.theme = memoizedOptions.theme;
    }
    
    // Aplicar todas as atualizações de uma vez
    if (Object.keys(configUpdates).length > 0) {
      store.updateConfig(configUpdates);
    }
  }, [memoizedOptions, store.updateConfig]);
  
  // Funções utilitárias
  const formatNumber = useCallback((value: number, locale = 'pt-BR'): string => {
    return new Intl.NumberFormat(locale).format(value);
  }, []);
  
  const formatPercentage = useCallback((value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`;
  }, []);
  
  const formatBytes = useCallback((bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }, []);
  
  const formatDuration = useCallback((ms: number): string => {
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
  }, []);
  
  const getMetricIcon = useCallback((type: string): string => {
    const icons: Record<string, string> = {
      counter: '🔢',
      gauge: '📊',
      histogram: '📈',
      rate: '⚡',
      percentage: '📊'
    };
    return icons[type] || '📊';
  }, []);
  
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      normal: 'text-green-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  }, []);
  
  const getAlertColor = useCallback((severity: string): string => {
    const colors: Record<string, string> = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  }, []);
  
  // Estado derivado
  const activeMetrics = useMemo(() => 
    store.metrics.filter(m => m.status !== 'normal'),
    [store.metrics]
  );
  
  const criticalAlerts = useMemo(() => 
    store.alerts.filter(a => a.severity === 'critical' && a.isActive),
    [store.alerts]
  );
  
  const visibleWidgets = useMemo(() => 
    store.widgets.filter(w => w.isVisible),
    [store.widgets]
  );
  
  const connectedDataSources = useMemo(() => 
    store.dataSources.filter(ds => ds.status === 'connected'),
    [store.dataSources]
  );
  
  const performanceMetrics = useMemo(() => 
    store.stats.performance,
    [store.stats.performance]
  );
  
  // Ações avançadas
  const createMetricWidget = useCallback((metricId: string, position: { x: number; y: number }) => {
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
  }, [store]);
  
  const createChartWidget = useCallback((metricIds: string[], chartType: 'line' | 'bar' | 'pie' | 'area', position: { x: number; y: number }) => {
    store.addWidget({
      title: 'Gráfico Personalizado',
      type: 'chart',
      position: { ...position, width: 500, height: 300 },
      config: { metricIds, chartType },
      isVisible: true,
      isMinimized: false
    });
  }, [store]);
  
  const duplicateWidget = useCallback((widgetId: string) => {
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
  }, [store]);
  
  const generateDemoData = useCallback(() => {
    // Gerar métricas de demonstração
    const demoMetrics = [
      {
        name: 'CPU Usage',
        value: Math.random() * 100,
        previousValue: Math.random() * 100,
        unit: '%',
        type: 'gauge' as const,
        category: 'System',
        trend: 'stable' as const,
        change: 0,
        changePercentage: 0,
        threshold: { warning: 70, critical: 90 },
        status: 'normal' as const
      },
      {
        name: 'Memory Usage',
        value: Math.random() * 100,
        previousValue: Math.random() * 100,
        unit: '%',
        type: 'gauge' as const,
        category: 'System',
        trend: 'up' as const,
        change: 5,
        changePercentage: 5.2,
        threshold: { warning: 80, critical: 95 },
        status: 'normal' as const
      },
      {
        name: 'Active Users',
        value: Math.floor(Math.random() * 1000),
        previousValue: Math.floor(Math.random() * 1000),
        unit: '',
        type: 'counter' as const,
        category: 'Users',
        trend: 'up' as const,
        change: 50,
        changePercentage: 12.5,
        status: 'normal' as const
      },
      {
        name: 'Response Time',
        value: Math.random() * 500 + 100,
        previousValue: Math.random() * 500 + 100,
        unit: 'ms',
        type: 'histogram' as const,
        category: 'Performance',
        trend: 'down' as const,
        change: -20,
        changePercentage: -8.3,
        threshold: { warning: 300, critical: 500 },
        status: 'normal' as const
      },
      {
        name: 'Error Rate',
        value: Math.random() * 5,
        previousValue: Math.random() * 5,
        unit: '%',
        type: 'rate' as const,
        category: 'Errors',
        trend: 'stable' as const,
        change: 0.1,
        changePercentage: 2.1,
        threshold: { warning: 2, critical: 5 },
        status: 'normal' as const
      }
    ];
    
    demoMetrics.forEach(metric => {
      store.addMetric(metric);
    });
    
    // Gerar widgets de demonstração
    const demoWidgets = [
      {
        title: 'System Overview',
        type: 'chart' as const,
        position: { x: 0, y: 0, width: 600, height: 400 },
        config: {
          chartType: 'line' as const,
          metricIds: store.metrics.slice(0, 3).map(m => m.id)
        },
        isVisible: true,
        isMinimized: false
      },
      {
        title: 'Performance Metrics',
        type: 'gauge' as const,
        position: { x: 620, y: 0, width: 300, height: 200 },
        config: {
          metricIds: store.metrics.slice(3, 4).map(m => m.id)
        },
        isVisible: true,
        isMinimized: false
      },
      {
        title: 'Active Alerts',
        type: 'alert' as const,
        position: { x: 620, y: 220, width: 300, height: 180 },
        config: {},
        isVisible: true,
        isMinimized: false
      }
    ];
    
    demoWidgets.forEach(widget => {
      store.addWidget(widget);
    });
    
    // Gerar fonte de dados de demonstração
    store.addDataSource({
      name: 'Sistema Local',
      type: 'api',
      url: 'http://localhost:3001/metrics',
      refreshInterval: 5000,
      isActive: true,
      status: 'connected',
      config: {}
    });
    
    // Gerar filtros de demonstração
    store.addFilter({
      name: 'Período',
      type: 'select',
      options: [
        { value: '1h', label: 'Última hora' },
        { value: '24h', label: 'Últimas 24 horas' },
        { value: '7d', label: 'Últimos 7 dias' },
        { value: '30d', label: 'Últimos 30 dias' }
      ],
      value: '1h',
      defaultValue: '1h',
      isGlobal: true,
      affectedWidgets: []
    });
  }, [store]);
  
  const startRealTimeUpdates = useCallback(() => {
    if (realTimeInterval) return;
    
    const interval = setInterval(() => {
      // Simular atualizações em tempo real
      store.metrics.forEach(metric => {
        const variation = (Math.random() - 0.5) * 0.1; // ±5% de variação
        const newValue = Math.max(0, metric.value * (1 + variation));
        store.updateMetricValue(metric.id, newValue);
      });
    }, 2000);
    
    setRealTimeInterval(interval);
  }, [realTimeInterval, store]);
  
  const stopRealTimeUpdates = useCallback(() => {
    if (realTimeInterval) {
      clearInterval(realTimeInterval);
      setRealTimeInterval(null);
    }
  }, [realTimeInterval]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (realTimeInterval) {
        clearInterval(realTimeInterval);
      }
    };
  }, [realTimeInterval]);
  
  return {
    // Estado
    metrics: store.metrics,
    widgets: store.widgets,
    alerts: store.alerts,
    layouts: store.layouts,
    dataSources: store.dataSources,
    filters: store.filters,
    currentLayout: store.currentLayout,
    isInitialized: store.isInitialized,
    isLoading: store.isLoading,
    error: store.error,
    stats: store.stats,
    config: store.config,
    
    // Ações - Métricas
    addMetric: store.addMetric,
    updateMetric: store.updateMetric,
    removeMetric: store.removeMetric,
    updateMetricValue: store.updateMetricValue,
    bulkUpdateMetrics: store.bulkUpdateMetrics,
    
    // Ações - Widgets
    addWidget: store.addWidget,
    updateWidget: store.updateWidget,
    removeWidget: store.removeWidget,
    moveWidget: store.moveWidget,
    resizeWidget: store.resizeWidget,
    toggleWidgetVisibility: store.toggleWidgetVisibility,
    minimizeWidget: store.minimizeWidget,
    maximizeWidget: store.maximizeWidget,
    refreshWidget: store.refreshWidget,
    
    // Ações - Alertas
    addAlert: store.addAlert,
    updateAlert: store.updateAlert,
    removeAlert: store.removeAlert,
    acknowledgeAlert: store.acknowledgeAlert,
    dismissAlert: store.dismissAlert,
    
    // Ações - Layouts
    addLayout: store.addLayout,
    updateLayout: store.updateLayout,
    removeLayout: store.removeLayout,
    switchLayout: store.switchLayout,
    saveCurrentLayout: store.saveCurrentLayout,
    
    // Ações - Fontes de dados
    addDataSource: store.addDataSource,
    updateDataSource: store.updateDataSource,
    removeDataSource: store.removeDataSource,
    connectDataSource: store.connectDataSource,
    disconnectDataSource: store.disconnectDataSource,
    
    // Ações - Filtros
    addFilter: store.addFilter,
    updateFilter: store.updateFilter,
    removeFilter: store.removeFilter,
    setFilterValue: store.setFilterValue,
    resetFilters: store.resetFilters,
    
    // Ações - Configuração
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    exportConfig: store.exportConfig,
    importConfig: store.importConfig,
    
    // Ações - Dados
    refreshData: store.refreshData,
    clearData: store.clearData,
    exportData: store.exportData,
    importData: store.importData,
    
    // Funções utilitárias
    formatNumber,
    formatPercentage,
    formatBytes,
    formatDuration,
    getMetricIcon,
    getStatusColor,
    getAlertColor,
    
    // Estado derivado
    activeMetrics,
    criticalAlerts,
    visibleWidgets,
    connectedDataSources,
    performanceMetrics,
    
    // Ações avançadas
    createMetricWidget,
    createChartWidget,
    duplicateWidget,
    generateDemoData,
    startRealTimeUpdates,
    stopRealTimeUpdates
  };
};

// Hook para auto-inicialização do dashboard
export const useAutoDashboard = (options: DashboardOptions & { autoInit?: boolean } = {}) => {
  const dashboard = useRealtimeDashboard(options);
  
  useEffect(() => {
    if (options.autoInit !== false && !dashboard.isInitialized) {
      dashboard.generateDemoData();
      if (options.enableRealTime !== false) {
        dashboard.startRealTimeUpdates();
      }
    }
  }, [dashboard, options.autoInit, options.enableRealTime]);
  
  return dashboard;
};

// Hook para performance do dashboard
export const useDashboardPerformance = () => {
  const stats = useDashboardStore(state => state.stats);
  const [performanceHistory, setPerformanceHistory] = useState<Array<{
    timestamp: number;
    renderTime: number;
    fetchTime: number;
    memoryUsage: number;
    cpuUsage: number;
  }>>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceHistory(prev => {
        const newEntry = {
          timestamp: Date.now(),
          renderTime: stats.performance.avgRenderTime,
          fetchTime: stats.performance.avgDataFetchTime,
          memoryUsage: stats.performance.memoryUsage,
          cpuUsage: stats.performance.cpuUsage
        };
        
        // Manter apenas os últimos 100 pontos
        return [...prev.slice(-99), newEntry];
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [stats.performance]);
  
  const averagePerformance = useMemo(() => {
    if (performanceHistory.length === 0) return null;
    
    const totals = performanceHistory.reduce(
      (acc, entry) => ({
        renderTime: acc.renderTime + entry.renderTime,
        fetchTime: acc.fetchTime + entry.fetchTime,
        memoryUsage: acc.memoryUsage + entry.memoryUsage,
        cpuUsage: acc.cpuUsage + entry.cpuUsage
      }),
      { renderTime: 0, fetchTime: 0, memoryUsage: 0, cpuUsage: 0 }
    );
    
    const count = performanceHistory.length;
    return {
      renderTime: totals.renderTime / count,
      fetchTime: totals.fetchTime / count,
      memoryUsage: totals.memoryUsage / count,
      cpuUsage: totals.cpuUsage / count
    };
  }, [performanceHistory]);
  
  return {
    current: stats.performance,
    history: performanceHistory,
    average: averagePerformance,
    isHealthy: {
      renderTime: stats.performance.avgRenderTime < 100,
      fetchTime: stats.performance.avgDataFetchTime < 500,
      memoryUsage: stats.performance.memoryUsage < 80,
      cpuUsage: stats.performance.cpuUsage < 70
    }
  };
};

// Hook para estatísticas do dashboard
export const useDashboardStats = () => {
  const stats = useDashboardStore(state => state.stats);
  const metrics = useDashboardStore(state => state.metrics);
  const widgets = useDashboardStore(state => state.widgets);
  const alerts = useDashboardStore(state => state.alerts);
  
  const derivedStats = useMemo(() => ({
    metricsBreakdown: {
      normal: metrics.filter(m => m.status === 'normal').length,
      warning: metrics.filter(m => m.status === 'warning').length,
      critical: metrics.filter(m => m.status === 'critical').length
    },
    widgetsBreakdown: {
      visible: widgets.filter(w => w.isVisible).length,
      hidden: widgets.filter(w => !w.isVisible).length,
      minimized: widgets.filter(w => w.isMinimized).length
    },
    alertsBreakdown: {
      active: alerts.filter(a => a.isActive).length,
      acknowledged: alerts.filter(a => a.isAcknowledged).length,
      critical: alerts.filter(a => a.severity === 'critical').length
    }
  }), [metrics, widgets, alerts]);
  
  return {
    ...stats,
    ...derivedStats
  };
};

// Hook para configuração do dashboard
export const useDashboardConfig = () => {
  const config = useDashboardStore(state => state.config);
  const updateConfig = useDashboardStore(state => state.updateConfig);
  const resetConfig = useDashboardStore(state => state.resetConfig);
  const exportConfig = useDashboardStore(state => state.exportConfig);
  const importConfig = useDashboardStore(state => state.importConfig);
  
  const toggleTheme = useCallback(() => {
    const newTheme = config.theme === 'light' ? 'dark' : config.theme === 'dark' ? 'auto' : 'light';
    updateConfig({ theme: newTheme });
  }, [config.theme, updateConfig]);
  
  const toggleAutoRefresh = useCallback(() => {
    updateConfig({ autoRefresh: !config.autoRefresh });
  }, [config.autoRefresh, updateConfig]);
  
  const setRefreshInterval = useCallback((interval: number) => {
    updateConfig({ refreshInterval: interval });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    toggleTheme,
    toggleAutoRefresh,
    setRefreshInterval
  };
};

// Hook para debug do dashboard
export const useDashboardDebug = () => {
  const store = useDashboardStore();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const captureDebugInfo = useCallback(() => {
    const info = {
      timestamp: new Date().toISOString(),
      state: {
        metricsCount: store.metrics.length,
        widgetsCount: store.widgets.length,
        alertsCount: store.alerts.length,
        layoutsCount: store.layouts.length,
        dataSourcesCount: store.dataSources.length,
        filtersCount: store.filters.length
      },
      config: store.config,
      stats: store.stats,
      performance: {
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timing: performance.timing
      }
    };
    
    setDebugInfo(info);
    return info;
  }, [store]);
  
  const exportDebugInfo = useCallback(() => {
    const info = captureDebugInfo();
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [captureDebugInfo]);
  
  return {
    debugInfo,
    captureDebugInfo,
    exportDebugInfo,
    store: store // Para acesso direto ao store em debug
  };
};