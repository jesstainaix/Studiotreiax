import { useState, useEffect, useCallback, useRef } from 'react';

// Interfaces
export interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history?: { timestamp: number; value: number }[];
}

export interface Alert {
  id: string;
  metricId: string;
  metricName: string;
  type: 'threshold' | 'anomaly' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  threshold?: {
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
  };
}

export interface Widget {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'number' | 'status';
  title: string;
  metricIds: string[];
  position: { x: number; y: number; w: number; h: number };
  config: {
    showLegend?: boolean;
    showGrid?: boolean;
    color?: string;
    refreshInterval?: number;
    thresholds?: { warning: number; critical: number };
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
  layout?: 'grid' | 'flex' | 'custom';
}

export interface MetricsConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  maxDataPoints: number;
  enableAlerts: boolean;
  enableWebSocket: boolean;
  retentionDays: number;
  alertThresholds: {
    [metricId: string]: {
      warning: number;
      critical: number;
    };
  };
}

export interface ConnectionStatus {
  connected: boolean;
  lastUpdate: number;
  latency: number;
  reconnectAttempts: number;
  error?: string;
}

export interface MetricsFilter {
  category?: string;
  status?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface MetricsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metricIds: string[];
  timestamp: number;
  confidence: number;
}

export interface MetricsReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'trend' | 'comparison';
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: string[];
  generatedAt: number;
  data: any;
}

// Hook principal
export const useRealTimeMetrics = () => {
  // Estados principais
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [insights, setInsights] = useState<MetricsInsight[]>([]);
  const [reports, setReports] = useState<MetricsReport[]>([]);
  
  // Estados de configuração
  const [config, setConfig] = useState<MetricsConfig>({
    autoRefresh: true,
    refreshInterval: 5000,
    maxDataPoints: 100,
    enableAlerts: true,
    enableWebSocket: true,
    retentionDays: 30,
    alertThresholds: {}
  });
  
  // Estados de controle
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastUpdate: Date.now(),
    latency: 0,
    reconnectAttempts: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<string>('');
  const [filter, setFilter] = useState<MetricsFilter>({});
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsHistoryRef = useRef<Map<string, { timestamp: number; value: number }[]>>(new Map());
  
  // Funções de geração de dados mock
  const generateMockMetrics = useCallback((): MetricData[] => {
    const categories = ['performance', 'system', 'user', 'business'];
    const metricTemplates = {
      performance: [
        { name: 'Response Time', unit: 'ms', baseValue: 200 },
        { name: 'Throughput', unit: 'req/s', baseValue: 1000 },
        { name: 'Error Rate', unit: '%', baseValue: 2 },
        { name: 'CPU Usage', unit: '%', baseValue: 45 }
      ],
      system: [
        { name: 'Memory Usage', unit: '%', baseValue: 65 },
        { name: 'Disk I/O', unit: 'MB/s', baseValue: 50 },
        { name: 'Network Traffic', unit: 'Mbps', baseValue: 100 },
        { name: 'Active Connections', unit: '', baseValue: 500 }
      ],
      user: [
        { name: 'Active Users', unit: '', baseValue: 1200 },
        { name: 'Session Duration', unit: 'min', baseValue: 15 },
        { name: 'Page Views', unit: '/min', baseValue: 800 },
        { name: 'Bounce Rate', unit: '%', baseValue: 35 }
      ],
      business: [
        { name: 'Revenue', unit: '$', baseValue: 5000 },
        { name: 'Conversions', unit: '/hour', baseValue: 25 },
        { name: 'Orders', unit: '/hour', baseValue: 15 },
        { name: 'Customer Satisfaction', unit: '/5', baseValue: 4.2 }
      ]
    };
    
    return categories.flatMap(category => 
      metricTemplates[category as keyof typeof metricTemplates].map((template, index) => {
        const variance = 0.2; // 20% de variação
        const value = template.baseValue * (1 + (Math.random() - 0.5) * variance);
        const previousValue = template.baseValue * (1 + (Math.random() - 0.5) * variance);
        
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (category === 'performance' && value > template.baseValue * 1.5) status = 'warning';
        if (category === 'performance' && value > template.baseValue * 2) status = 'critical';
        if (category === 'system' && value > 80) status = 'warning';
        if (category === 'system' && value > 95) status = 'critical';
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (value > previousValue * 1.05) trend = 'up';
        if (value < previousValue * 0.95) trend = 'down';
        
        const metricId = `${category}-${index}`;
        
        // Adicionar ao histórico
        const history = metricsHistoryRef.current.get(metricId) || [];
        history.push({ timestamp: Date.now(), value });
        if (history.length > config.maxDataPoints) {
          history.shift();
        }
        metricsHistoryRef.current.set(metricId, history);
        
        return {
          id: metricId,
          name: template.name,
          value,
          unit: template.unit,
          timestamp: Date.now(),
          category,
          status,
          trend,
          history: [...history]
        };
      })
    );
  }, [config.maxDataPoints]);
  
  const generateMockAlerts = useCallback((currentMetrics: MetricData[]): Alert[] => {
    const newAlerts: Alert[] = [];
    
    currentMetrics.forEach(metric => {
      const threshold = config.alertThresholds[metric.id];
      if (!threshold || !config.enableAlerts) return;
      
      if (metric.value > threshold.critical) {
        newAlerts.push({
          id: `alert-${metric.id}-${Date.now()}`,
          metricId: metric.id,
          metricName: metric.name,
          type: 'threshold',
          severity: 'critical',
          message: `${metric.name} exceeded critical threshold: ${metric.value.toFixed(2)}${metric.unit} > ${threshold.critical}${metric.unit}`,
          timestamp: Date.now(),
          acknowledged: false,
          threshold: { operator: '>', value: threshold.critical }
        });
      } else if (metric.value > threshold.warning) {
        newAlerts.push({
          id: `alert-${metric.id}-${Date.now()}`,
          metricId: metric.id,
          metricName: metric.name,
          type: 'threshold',
          severity: 'high',
          message: `${metric.name} exceeded warning threshold: ${metric.value.toFixed(2)}${metric.unit} > ${threshold.warning}${metric.unit}`,
          timestamp: Date.now(),
          acknowledged: false,
          threshold: { operator: '>', value: threshold.warning }
        });
      }
    });
    
    return newAlerts;
  }, [config.alertThresholds, config.enableAlerts]);
  
  const generateMockInsights = useCallback((currentMetrics: MetricData[]): MetricsInsight[] => {
    const insights: MetricsInsight[] = [];
    
    // Insight de tendência
    const performanceMetrics = currentMetrics.filter(m => m.category === 'performance');
    const avgResponseTime = performanceMetrics.find(m => m.name === 'Response Time');
    
    if (avgResponseTime && avgResponseTime.trend === 'up') {
      insights.push({
        id: `insight-trend-${Date.now()}`,
        type: 'trend',
        title: 'Aumento no Tempo de Resposta',
        description: 'O tempo de resposta médio está aumentando nas últimas medições',
        severity: 'warning',
        metricIds: [avgResponseTime.id],
        timestamp: Date.now(),
        confidence: 0.85
      });
    }
    
    // Insight de correlação
    const cpuUsage = currentMetrics.find(m => m.name === 'CPU Usage');
    const memoryUsage = currentMetrics.find(m => m.name === 'Memory Usage');
    
    if (cpuUsage && memoryUsage && cpuUsage.value > 80 && memoryUsage.value > 80) {
      insights.push({
        id: `insight-correlation-${Date.now()}`,
        type: 'correlation',
        title: 'Alto Uso de Recursos',
        description: 'CPU e memória estão com uso elevado simultaneamente',
        severity: 'critical',
        metricIds: [cpuUsage.id, memoryUsage.id],
        timestamp: Date.now(),
        confidence: 0.92
      });
    }
    
    return insights;
  }, []);
  
  // Funções de controle de conexão
  const connectWebSocket = useCallback(() => {
    if (!config.enableWebSocket || wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      // Simular conexão WebSocket
      wsRef.current = new WebSocket('ws://localhost:8080/metrics');
      
      wsRef.current.onopen = () => {
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          reconnectAttempts: 0,
          error: undefined
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'metrics') {
            setMetrics(data.metrics);
          } else if (data.type === 'alert') {
            setAlerts(prev => [...prev, data.alert]);
          }
          
          setConnectionStatus(prev => ({
            ...prev,
            lastUpdate: Date.now(),
            latency: Date.now() - data.timestamp
          }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          error: 'WebSocket connection error'
        }));
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false
        }));
        
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          setConnectionStatus(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }));
          if (connectionStatus.reconnectAttempts < 5) {
            connectWebSocket();
          }
        }, 5000);
      };
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        error: 'Failed to create WebSocket connection'
      }));
    }
  }, [config.enableWebSocket, connectionStatus.reconnectAttempts]);
  
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus(prev => ({ ...prev, connected: false }));
  }, []);
  
  // Funções de atualização de dados
  const refreshMetrics = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMetrics = generateMockMetrics();
      const newAlerts = generateMockAlerts(newMetrics);
      const newInsights = generateMockInsights(newMetrics);
      
      setMetrics(newMetrics);
      setAlerts(prev => [...prev, ...newAlerts]);
      setInsights(prev => [...prev, ...newInsights]);
      
      setConnectionStatus(prev => ({
        ...prev,
        lastUpdate: Date.now(),
        latency: Math.random() * 100
      }));
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [generateMockMetrics, generateMockAlerts, generateMockInsights]);
  
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    if (config.autoRefresh) {
      refreshIntervalRef.current = setInterval(refreshMetrics, config.refreshInterval);
    }
  }, [config.autoRefresh, config.refreshInterval, refreshMetrics]);
  
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);
  
  // Funções de gerenciamento de alertas
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);
  
  const deleteAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);
  
  const createAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: Date.now()
    };
    setAlerts(prev => [...prev, newAlert]);
    return newAlert;
  }, []);
  
  // Funções de gerenciamento de dashboards
  const createDashboard = useCallback((dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDashboard: Dashboard = {
      ...dashboardData,
      id: `dashboard-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDashboards(prev => [...prev, newDashboard]);
    return newDashboard;
  }, []);
  
  const updateDashboard = useCallback((dashboardId: string, updates: Partial<Dashboard>) => {
    setDashboards(prev => prev.map(dashboard => 
      dashboard.id === dashboardId 
        ? { ...dashboard, ...updates, updatedAt: Date.now() }
        : dashboard
    ));
  }, []);
  
  const deleteDashboard = useCallback((dashboardId: string) => {
    setDashboards(prev => prev.filter(dashboard => dashboard.id !== dashboardId));
    if (activeDashboard === dashboardId) {
      const defaultDashboard = dashboards.find(d => d.isDefault);
      setActiveDashboard(defaultDashboard?.id || '');
    }
  }, [activeDashboard, dashboards]);
  
  // Funções de gerenciamento de widgets
  const createWidget = useCallback((widgetData: Omit<Widget, 'id'>) => {
    const newWidget: Widget = {
      ...widgetData,
      id: `widget-${Date.now()}`
    };
    setWidgets(prev => [...prev, newWidget]);
    return newWidget;
  }, []);
  
  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ));
  }, []);
  
  const deleteWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
    // Remover widget dos dashboards
    setDashboards(prev => prev.map(dashboard => ({
      ...dashboard,
      widgets: dashboard.widgets.filter(w => w.id !== widgetId),
      updatedAt: Date.now()
    })));
  }, []);
  
  // Funções de exportação/importação
  const exportData = useCallback(() => {
    const data = {
      metrics,
      alerts,
      dashboards,
      widgets,
      insights,
      reports,
      config,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, alerts, dashboards, widgets, insights, reports, config]);
  
  const importData = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.metrics) setMetrics(data.metrics);
          if (data.alerts) setAlerts(data.alerts);
          if (data.dashboards) setDashboards(data.dashboards);
          if (data.widgets) setWidgets(data.widgets);
          if (data.insights) setInsights(data.insights);
          if (data.reports) setReports(data.reports);
          if (data.config) setConfig(data.config);
          
          resolve();
        } catch (error) {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);
  
  // Funções de filtro e busca
  const getFilteredMetrics = useCallback(() => {
    return metrics.filter(metric => {
      if (filter.category && metric.category !== filter.category) return false;
      if (filter.status && metric.status !== filter.status) return false;
      if (filter.search && !metric.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [metrics, filter]);
  
  // Funções de relatórios
  const generateReport = useCallback((reportConfig: Omit<MetricsReport, 'id' | 'generatedAt' | 'data'>) => {
    const reportData = {
      metrics: metrics.filter(m => reportConfig.metrics.includes(m.id)),
      summary: {
        totalMetrics: metrics.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
        averageValues: {} as Record<string, number>
      }
    };
    
    const newReport: MetricsReport = {
      ...reportConfig,
      id: `report-${Date.now()}`,
      generatedAt: Date.now(),
      data: reportData
    };
    
    setReports(prev => [...prev, newReport]);
    return newReport;
  }, [metrics, alerts]);
  
  // Efeitos
  useEffect(() => {
    // Inicialização
    const initialMetrics = generateMockMetrics();
    setMetrics(initialMetrics);
    
    // Criar dashboard padrão
    const defaultDashboard: Dashboard = {
      id: 'default',
      name: 'Dashboard Principal',
      description: 'Visão geral das métricas principais',
      widgets: [],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDashboards([defaultDashboard]);
    setActiveDashboard('default');
    
    // Configurar thresholds padrão
    const defaultThresholds: Record<string, { warning: number; critical: number }> = {};
    initialMetrics.forEach(metric => {
      if (metric.category === 'performance') {
        defaultThresholds[metric.id] = { warning: 500, critical: 1000 };
      } else if (metric.category === 'system') {
        defaultThresholds[metric.id] = { warning: 80, critical: 95 };
      }
    });
    
    setConfig(prev => ({ ...prev, alertThresholds: defaultThresholds }));
  }, [generateMockMetrics]);
  
  useEffect(() => {
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);
  
  useEffect(() => {
    if (config.enableWebSocket) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    
    return () => disconnectWebSocket();
  }, [config.enableWebSocket, connectWebSocket, disconnectWebSocket]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      disconnectWebSocket();
    };
  }, [stopAutoRefresh, disconnectWebSocket]);
  
  // Valores computados
  const computedValues = {
    totalMetrics: metrics.length,
    activeAlerts: alerts.filter(a => !a.acknowledged).length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    connectedStatus: connectionStatus.connected,
    lastUpdateTime: new Date(connectionStatus.lastUpdate).toLocaleTimeString(),
    filteredMetrics: getFilteredMetrics(),
    dashboardCount: dashboards.length,
    widgetCount: widgets.length,
    insightCount: insights.length,
    reportCount: reports.length
  };
  
  return {
    // Estados
    metrics,
    alerts,
    dashboards,
    widgets,
    insights,
    reports,
    config,
    connectionStatus,
    isLoading,
    isRefreshing,
    activeDashboard,
    filter,
    
    // Setters
    setMetrics,
    setAlerts,
    setDashboards,
    setWidgets,
    setInsights,
    setReports,
    setConfig,
    setActiveDashboard,
    setFilter,
    
    // Funções de controle
    refreshMetrics,
    startAutoRefresh,
    stopAutoRefresh,
    connectWebSocket,
    disconnectWebSocket,
    
    // Funções de alertas
    acknowledgeAlert,
    deleteAlert,
    createAlert,
    
    // Funções de dashboards
    createDashboard,
    updateDashboard,
    deleteDashboard,
    
    // Funções de widgets
    createWidget,
    updateWidget,
    deleteWidget,
    
    // Funções de dados
    exportData,
    importData,
    generateReport,
    
    // Funções de filtro
    getFilteredMetrics,
    
    // Valores computados
    ...computedValues
  };
};

export default useRealTimeMetrics;