import { useState, useEffect, useCallback, useRef } from 'react';

// Interfaces
interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  category: 'traffic' | 'performance' | 'engagement' | 'conversion';
  history: Array<{
    timestamp: Date;
    value: number;
  }>;
}

interface LiveEvent {
  id: string;
  type: 'pageview' | 'click' | 'conversion' | 'error' | 'user_action';
  timestamp: Date;
  user_id: string;
  page: string;
  device: 'desktop' | 'mobile' | 'tablet';
  location: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  metadata: Record<string, any>;
  session_id: string;
  referrer?: string;
  user_agent?: string;
}

interface UserSession {
  id: string;
  user_id: string;
  start_time: Date;
  last_activity: Date;
  pages_visited: number;
  actions_count: number;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: {
    country: string;
    city: string;
  };
  status: 'active' | 'idle' | 'ended';
  conversion_events: number;
  total_time: number;
  bounce: boolean;
  entry_page: string;
  exit_page?: string;
}

interface TrafficSource {
  source: string;
  medium: string;
  campaign?: string;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  conversion_rate: number;
  revenue: number;
  cost?: number;
  roi?: number;
}

interface GeographicData {
  country: string;
  country_code: string;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  revenue: number;
  timezone: string;
}

interface DeviceAnalytics {
  device_type: 'desktop' | 'mobile' | 'tablet';
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  revenue: number;
  top_browsers: Array<{
    browser: string;
    percentage: number;
    version?: string;
  }>;
  screen_resolutions: Array<{
    resolution: string;
    percentage: number;
  }>;
}

interface RealTimeAlert {
  id: string;
  type: 'traffic_spike' | 'traffic_drop' | 'error_rate' | 'conversion_drop' | 'performance_issue' | 'security_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  current_value: number;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  actions_taken?: string[];
  auto_resolve?: boolean;
}

interface RealTimeConfig {
  refresh_interval: number;
  data_retention: number;
  alerts: {
    enabled: boolean;
    thresholds: {
      traffic_spike: number;
      traffic_drop: number;
      error_rate: number;
      conversion_drop: number;
      performance_degradation: number;
    };
    notification_channels: string[];
  };
  filters: {
    countries: string[];
    devices: string[];
    traffic_sources: string[];
    exclude_bots: boolean;
    min_session_duration: number;
  };
  display: {
    show_events: boolean;
    show_sessions: boolean;
    show_geographic: boolean;
    max_events: number;
    chart_type: 'line' | 'area' | 'bar';
    time_format: '12h' | '24h';
  };
  sampling: {
    enabled: boolean;
    rate: number; // 0-100%
    high_traffic_threshold: number;
  };
}

interface RealTimeReport {
  id: string;
  name: string;
  type: 'hourly' | 'daily' | 'weekly' | 'custom';
  metrics: string[];
  filters: Record<string, any>;
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly';
    time: string;
    recipients: string[];
  };
  created_at: Date;
  last_generated?: Date;
}

interface AnalyticsInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-100%
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  data_points: any[];
  timestamp: Date;
}

interface RealTimeMonitoring {
  is_active: boolean;
  uptime: number;
  last_heartbeat: Date;
  connection_status: 'connected' | 'disconnected' | 'reconnecting';
  data_quality: {
    completeness: number;
    accuracy: number;
    timeliness: number;
  };
  performance: {
    latency: number;
    throughput: number;
    error_rate: number;
  };
}

interface UseRealTimeAnalyticsReturn {
  // Estados principais
  metrics: RealTimeMetric[];
  liveEvents: LiveEvent[];
  activeSessions: UserSession[];
  trafficSources: TrafficSource[];
  geographicData: GeographicData[];
  deviceAnalytics: DeviceAnalytics[];
  alerts: RealTimeAlert[];
  config: RealTimeConfig;
  reports: RealTimeReport[];
  insights: AnalyticsInsight[];
  monitoring: RealTimeMonitoring;

  // Estados de controle
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';

  // Ações de monitoramento
  startMonitoring: () => void;
  stopMonitoring: () => void;
  pauseMonitoring: () => void;
  resumeMonitoring: () => void;
  refreshData: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Ações de métricas
  getMetricHistory: (metricId: string, timeRange: string) => Promise<any[]>;
  addCustomMetric: (metric: Omit<RealTimeMetric, 'id' | 'history'>) => void;
  removeMetric: (metricId: string) => void;
  updateMetricThreshold: (metricId: string, threshold: { warning: number; critical: number }) => void;

  // Ações de eventos
  trackEvent: (event: Omit<LiveEvent, 'id' | 'timestamp'>) => void;
  getEventsByType: (type: string) => LiveEvent[];
  getEventsByUser: (userId: string) => LiveEvent[];
  getEventsByPage: (page: string) => LiveEvent[];
  clearEvents: () => void;

  // Ações de sessões
  getActiveSessionsCount: () => number;
  getSessionsByDevice: (device: string) => UserSession[];
  getSessionsByCountry: (country: string) => UserSession[];
  endSession: (sessionId: string) => void;
  extendSession: (sessionId: string) => void;

  // Ações de alertas
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  createAlert: (alert: Omit<RealTimeAlert, 'id' | 'timestamp'>) => void;
  getAlertHistory: () => RealTimeAlert[];
  configureAlertRules: (rules: any) => void;

  // Ações de relatórios
  generateReport: (config: Omit<RealTimeReport, 'id' | 'created_at'>) => Promise<RealTimeReport>;
  scheduleReport: (reportId: string, schedule: any) => void;
  exportReport: (reportId: string, format: 'pdf' | 'csv' | 'json') => Promise<void>;
  deleteReport: (reportId: string) => void;

  // Ações de configuração
  updateConfig: (newConfig: Partial<RealTimeConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (configJson: string) => void;

  // Ações de insights
  generateInsights: () => Promise<AnalyticsInsight[]>;
  getInsightsByType: (type: string) => AnalyticsInsight[];
  dismissInsight: (insightId: string) => void;
  implementRecommendation: (insightId: string, recommendationIndex: number) => void;

  // Funções utilitárias
  exportData: (format: 'csv' | 'json' | 'xlsx') => Promise<void>;
  importData: (data: any) => void;
  clearCache: () => void;
  validateData: () => boolean;
  getDataQuality: () => any;
  optimizePerformance: () => void;

  // Valores computados
  totalVisitors: number;
  totalPageviews: number;
  averageSessionDuration: number;
  conversionRate: number;
  bounceRate: number;
  topTrafficSource: TrafficSource | null;
  topCountry: GeographicData | null;
  topDevice: DeviceAnalytics | null;
  criticalAlertsCount: number;
  healthScore: number;
  engagementScore: number;
  performanceScore: number;
}

const useRealTimeAnalytics = (): UseRealTimeAnalyticsReturn => {
  // Estados principais
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics[]>([]);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [config, setConfig] = useState<RealTimeConfig>(defaultConfig);
  const [reports, setReports] = useState<RealTimeReport[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [monitoring, setMonitoring] = useState<RealTimeMonitoring>({
    is_active: false,
    uptime: 0,
    last_heartbeat: new Date(),
    connection_status: 'disconnected',
    data_quality: { completeness: 100, accuracy: 100, timeliness: 100 },
    performance: { latency: 0, throughput: 0, error_rate: 0 }
  });

  // Estados de controle
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventQueueRef = useRef<LiveEvent[]>([]);

  // Inicialização
  useEffect(() => {
    initializeAnalytics();
    return () => {
      cleanup();
    };
  }, []);

  // Monitoramento em tempo real
  useEffect(() => {
    if (isLive && config.refresh_interval > 0) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => stopRealTimeUpdates();
  }, [isLive, config.refresh_interval]);

  // Funções de inicialização
  const initializeAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadInitialData();
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      setError('Falha ao inicializar analytics');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInitialData = async () => {
    // Simular carregamento de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMetrics(generateMockMetrics());
    setLiveEvents(generateMockEvents());
    setActiveSessions(generateMockSessions());
    setTrafficSources(generateMockTrafficSources());
    setGeographicData(generateMockGeographicData());
    setDeviceAnalytics(generateMockDeviceAnalytics());
    setAlerts(generateMockAlerts());
    setReports(generateMockReports());
    setInsights(generateMockInsights());
    setLastUpdate(new Date());
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  // Funções de monitoramento
  const startRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        await updateRealTimeData();
        setMonitoring(prev => ({
          ...prev,
          last_heartbeat: new Date(),
          uptime: prev.uptime + config.refresh_interval
        }));
      } catch (err) {
        console.error('Erro ao atualizar dados:', err);
        handleConnectionError();
      }
    }, config.refresh_interval * 1000);
  };

  const stopRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateRealTimeData = async () => {
    // Simular atualizações em tempo real
    setMetrics(prev => prev.map(metric => {
      const newValue = Math.max(0, metric.value + (Math.random() - 0.5) * metric.value * 0.1);
      const change = ((newValue - metric.value) / metric.value) * 100;
      
      return {
        ...metric,
        value: newValue,
        change,
        trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
        status: newValue < metric.threshold.critical ? 'critical' : 
                newValue < metric.threshold.warning ? 'warning' : 'healthy',
        history: [...metric.history.slice(-29), {
          timestamp: new Date(),
          value: newValue
        }]
      };
    }));

    // Adicionar novos eventos
    const newEvents = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => generateRandomEvent());
    setLiveEvents(prev => [...newEvents, ...prev].slice(0, config.display.max_events));

    // Atualizar sessões
    setActiveSessions(prev => prev.map(session => ({
      ...session,
      last_activity: Math.random() > 0.8 ? new Date() : session.last_activity,
      actions_count: session.actions_count + Math.floor(Math.random() * 3),
      pages_visited: session.pages_visited + (Math.random() > 0.7 ? 1 : 0)
    })));

    // Verificar alertas
    checkForAlerts();
    
    setLastUpdate(new Date());
  };

  const handleConnectionError = () => {
    setConnectionStatus('reconnecting');
    setError('Conexão perdida. Tentando reconectar...');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnect();
    }, 5000);
  };

  const checkForAlerts = () => {
    if (!config.alerts.enabled) return;

    metrics.forEach(metric => {
      if (metric.status === 'critical' || metric.status === 'warning') {
        const existingAlert = alerts.find(alert => 
          alert.metric === metric.id && alert.status === 'active'
        );

        if (!existingAlert) {
          const newAlert: RealTimeAlert = {
            id: `alert_${Date.now()}_${Math.random()}`,
            type: metric.category === 'traffic' ? 'traffic_drop' : 'performance_issue',
            severity: metric.status === 'critical' ? 'critical' : 'medium',
            title: `${metric.name} ${metric.status === 'critical' ? 'Crítico' : 'Atenção'}`,
            description: `${metric.name} está em ${metric.value.toFixed(2)}${metric.unit}, ${metric.status === 'critical' ? 'abaixo do limite crítico' : 'próximo ao limite de atenção'}`,
            metric: metric.id,
            threshold: metric.status === 'critical' ? metric.threshold.critical : metric.threshold.warning,
            current_value: metric.value,
            timestamp: new Date(),
            status: 'active'
          };

          setAlerts(prev => [newAlert, ...prev]);
        }
      }
    });
  };

  // Ações de monitoramento
  const startMonitoring = useCallback(() => {
    setIsLive(true);
    setMonitoring(prev => ({ ...prev, is_active: true }));
    setConnectionStatus('connected');
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsLive(false);
    setMonitoring(prev => ({ ...prev, is_active: false }));
    stopRealTimeUpdates();
  }, []);

  const pauseMonitoring = useCallback(() => {
    setIsLive(false);
    stopRealTimeUpdates();
  }, []);

  const resumeMonitoring = useCallback(() => {
    setIsLive(true);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateRealTimeData();
      setError(null);
    } catch (err) {
      setError('Falha ao atualizar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reconnect = useCallback(async () => {
    setConnectionStatus('reconnecting');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadInitialData();
      setConnectionStatus('connected');
      setError(null);
      if (isLive) {
        startRealTimeUpdates();
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Falha na reconexão');
    }
  }, [isLive]);

  // Ações de métricas
  const getMetricHistory = useCallback(async (metricId: string, timeRange: string) => {
    const metric = metrics.find(m => m.id === metricId);
    if (!metric) return [];
    
    // Simular busca de histórico
    return metric.history.slice(-parseInt(timeRange) || 24);
  }, [metrics]);

  const addCustomMetric = useCallback((metric: Omit<RealTimeMetric, 'id' | 'history'>) => {
    const newMetric: RealTimeMetric = {
      ...metric,
      id: `custom_${Date.now()}`,
      history: []
    };
    setMetrics(prev => [...prev, newMetric]);
  }, []);

  const removeMetric = useCallback((metricId: string) => {
    setMetrics(prev => prev.filter(m => m.id !== metricId));
  }, []);

  const updateMetricThreshold = useCallback((metricId: string, threshold: { warning: number; critical: number }) => {
    setMetrics(prev => prev.map(m => 
      m.id === metricId ? { ...m, threshold } : m
    ));
  }, []);

  // Ações de eventos
  const trackEvent = useCallback((event: Omit<LiveEvent, 'id' | 'timestamp'>) => {
    const newEvent: LiveEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random()}`,
      timestamp: new Date()
    };
    
    eventQueueRef.current.push(newEvent);
    setLiveEvents(prev => [newEvent, ...prev].slice(0, config.display.max_events));
  }, [config.display.max_events]);

  const getEventsByType = useCallback((type: string) => {
    return liveEvents.filter(event => event.type === type);
  }, [liveEvents]);

  const getEventsByUser = useCallback((userId: string) => {
    return liveEvents.filter(event => event.user_id === userId);
  }, [liveEvents]);

  const getEventsByPage = useCallback((page: string) => {
    return liveEvents.filter(event => event.page === page);
  }, [liveEvents]);

  const clearEvents = useCallback(() => {
    setLiveEvents([]);
    eventQueueRef.current = [];
  }, []);

  // Ações de sessões
  const getActiveSessionsCount = useCallback(() => {
    return activeSessions.filter(session => session.status === 'active').length;
  }, [activeSessions]);

  const getSessionsByDevice = useCallback((device: string) => {
    return activeSessions.filter(session => session.device === device);
  }, [activeSessions]);

  const getSessionsByCountry = useCallback((country: string) => {
    return activeSessions.filter(session => session.location.country === country);
  }, [activeSessions]);

  const endSession = useCallback((sessionId: string) => {
    setActiveSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, status: 'ended' } : session
    ));
  }, []);

  const extendSession = useCallback((sessionId: string) => {
    setActiveSessions(prev => prev.map(session => 
      session.id === sessionId ? { 
        ...session, 
        last_activity: new Date(),
        total_time: session.total_time + 300000 // +5 minutos
      } : session
    ));
  }, []);

  // Ações de alertas
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
  }, []);

  const createAlert = useCallback((alert: Omit<RealTimeAlert, 'id' | 'timestamp'>) => {
    const newAlert: RealTimeAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date()
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const getAlertHistory = useCallback(() => {
    return alerts.filter(alert => alert.status === 'resolved');
  }, [alerts]);

  const configureAlertRules = useCallback((rules: any) => {
    setConfig(prev => ({
      ...prev,
      alerts: { ...prev.alerts, ...rules }
    }));
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (reportConfig: Omit<RealTimeReport, 'id' | 'created_at'>) => {
    const newReport: RealTimeReport = {
      ...reportConfig,
      id: `report_${Date.now()}`,
      created_at: new Date(),
      last_generated: new Date()
    };
    
    setReports(prev => [...prev, newReport]);
    return newReport;
  }, []);

  const scheduleReport = useCallback((reportId: string, schedule: any) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, schedule } : report
    ));
  }, []);

  const exportReport = useCallback(async (reportId: string, format: 'pdf' | 'csv' | 'json') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Simular exportação
  }, [reports]);

  const deleteReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  }, []);

  // Ações de configuração
  const updateConfig = useCallback((newConfig: Partial<RealTimeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback((configJson: string) => {
    try {
      const newConfig = JSON.parse(configJson);
      setConfig(newConfig);
    } catch (err) {
      setError('Configuração inválida');
    }
  }, []);

  // Ações de insights
  const generateInsights = useCallback(async () => {
    // Simular geração de insights
    const newInsights = generateMockInsights();
    setInsights(newInsights);
    return newInsights;
  }, []);

  const getInsightsByType = useCallback((type: string) => {
    return insights.filter(insight => insight.type === type);
  }, [insights]);

  const dismissInsight = useCallback((insightId: string) => {
    setInsights(prev => prev.filter(i => i.id !== insightId));
  }, []);

  const implementRecommendation = useCallback((insightId: string, recommendationIndex: number) => {
    const insight = insights.find(i => i.id === insightId);
    if (!insight || !insight.recommendations[recommendationIndex]) return;
    dismissInsight(insightId);
  }, [insights, dismissInsight]);

  // Funções utilitárias
  const exportData = useCallback(async (format: 'csv' | 'json' | 'xlsx') => {
    const data = {
      metrics,
      events: liveEvents,
      sessions: activeSessions,
      traffic_sources: trafficSources,
      geographic: geographicData,
      devices: deviceAnalytics,
      alerts,
      reports,
      insights
    };
  }, [metrics, liveEvents, activeSessions, trafficSources, geographicData, deviceAnalytics, alerts, reports, insights]);

  const importData = useCallback((data: any) => {
    try {
      if (data.metrics) setMetrics(data.metrics);
      if (data.events) setLiveEvents(data.events);
      if (data.sessions) setActiveSessions(data.sessions);
      if (data.traffic_sources) setTrafficSources(data.traffic_sources);
      if (data.geographic) setGeographicData(data.geographic);
      if (data.devices) setDeviceAnalytics(data.devices);
      if (data.alerts) setAlerts(data.alerts);
      if (data.reports) setReports(data.reports);
      if (data.insights) setInsights(data.insights);
    } catch (err) {
      setError('Dados inválidos para importação');
    }
  }, []);

  const clearCache = useCallback(() => {
    setLiveEvents([]);
    setAlerts(prev => prev.filter(alert => alert.status === 'active'));
    eventQueueRef.current = [];
  }, []);

  const validateData = useCallback(() => {
    // Simular validação de dados
    return metrics.length > 0 && activeSessions.length >= 0;
  }, [metrics, activeSessions]);

  const getDataQuality = useCallback(() => {
    return {
      completeness: Math.random() * 20 + 80,
      accuracy: Math.random() * 15 + 85,
      timeliness: Math.random() * 10 + 90
    };
  }, []);

  const optimizePerformance = useCallback(() => {
    // Simular otimização de performance
    if (liveEvents.length > config.display.max_events * 2) {
      setLiveEvents(prev => prev.slice(0, config.display.max_events));
    }
    
    // Limpar sessões antigas
    setActiveSessions(prev => prev.filter(session => 
      session.status === 'active' || 
      (new Date().getTime() - session.last_activity.getTime()) < 3600000 // 1 hora
    ));
  }, [liveEvents.length, config.display.max_events]);

  // Valores computados
  const totalVisitors = metrics.find(m => m.id === 'visitors')?.value || 0;
  const totalPageviews = metrics.find(m => m.id === 'pageviews')?.value || 0;
  const averageSessionDuration = activeSessions.reduce((acc, session) => acc + session.total_time, 0) / activeSessions.length || 0;
  const conversionRate = metrics.find(m => m.id === 'conversion_rate')?.value || 0;
  const bounceRate = metrics.find(m => m.id === 'bounce_rate')?.value || 0;
  const topTrafficSource = trafficSources.reduce((prev, current) => 
    (prev.visitors > current.visitors) ? prev : current, trafficSources[0] || null
  );
  const topCountry = geographicData.reduce((prev, current) => 
    (prev?.visitors || 0) > current.visitors ? prev : current, geographicData[0] || null
  );
  const topDevice = deviceAnalytics.reduce((prev, current) => 
    (prev?.visitors || 0) > current.visitors ? prev : current, deviceAnalytics[0] || null
  );
  const criticalAlertsCount = alerts.filter(alert => alert.severity === 'critical' && alert.status === 'active').length;
  const healthScore = metrics.filter(m => m.status === 'healthy').length / metrics.length * 100;
  const engagementScore = Math.max(0, 100 - bounceRate);
  const performanceScore = monitoring.performance.error_rate < 1 ? 100 - monitoring.performance.latency / 10 : 50;

  return {
    // Estados principais
    metrics,
    liveEvents,
    activeSessions,
    trafficSources,
    geographicData,
    deviceAnalytics,
    alerts,
    config,
    reports,
    insights,
    monitoring,

    // Estados de controle
    isLive,
    isLoading,
    error,
    lastUpdate,
    connectionStatus,

    // Ações de monitoramento
    startMonitoring,
    stopMonitoring,
    pauseMonitoring,
    resumeMonitoring,
    refreshData,
    reconnect,

    // Ações de métricas
    getMetricHistory,
    addCustomMetric,
    removeMetric,
    updateMetricThreshold,

    // Ações de eventos
    trackEvent,
    getEventsByType,
    getEventsByUser,
    getEventsByPage,
    clearEvents,

    // Ações de sessões
    getActiveSessionsCount,
    getSessionsByDevice,
    getSessionsByCountry,
    endSession,
    extendSession,

    // Ações de alertas
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    getAlertHistory,
    configureAlertRules,

    // Ações de relatórios
    generateReport,
    scheduleReport,
    exportReport,
    deleteReport,

    // Ações de configuração
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,

    // Ações de insights
    generateInsights,
    getInsightsByType,
    dismissInsight,
    implementRecommendation,

    // Funções utilitárias
    exportData,
    importData,
    clearCache,
    validateData,
    getDataQuality,
    optimizePerformance,

    // Valores computados
    totalVisitors,
    totalPageviews,
    averageSessionDuration,
    conversionRate,
    bounceRate,
    topTrafficSource,
    topCountry,
    topDevice,
    criticalAlertsCount,
    healthScore,
    engagementScore,
    performanceScore
  };
};

// Configuração padrão
const defaultConfig: RealTimeConfig = {
  refresh_interval: 5,
  data_retention: 24,
  alerts: {
    enabled: true,
    thresholds: {
      traffic_spike: 200,
      traffic_drop: 50,
      error_rate: 5,
      conversion_drop: 25,
      performance_degradation: 30
    },
    notification_channels: ['email', 'slack']
  },
  filters: {
    countries: [],
    devices: [],
    traffic_sources: [],
    exclude_bots: true,
    min_session_duration: 10
  },
  display: {
    show_events: true,
    show_sessions: true,
    show_geographic: true,
    max_events: 100,
    chart_type: 'line',
    time_format: '24h'
  },
  sampling: {
    enabled: false,
    rate: 100,
    high_traffic_threshold: 10000
  }
};

// Funções auxiliares para gerar dados simulados
const generateMockMetrics = (): RealTimeMetric[] => [
  {
    id: 'visitors',
    name: 'Visitantes Ativos',
    value: Math.floor(Math.random() * 500) + 100,
    unit: '',
    change: (Math.random() - 0.5) * 20,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    status: 'healthy',
    threshold: { warning: 50, critical: 20 },
    category: 'traffic',
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000),
      value: Math.floor(Math.random() * 500) + 100
    }))
  },
  {
    id: 'pageviews',
    name: 'Visualizações',
    value: Math.floor(Math.random() * 1000) + 200,
    unit: '/min',
    change: (Math.random() - 0.5) * 15,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    status: 'healthy',
    threshold: { warning: 100, critical: 50 },
    category: 'traffic',
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000),
      value: Math.floor(Math.random() * 1000) + 200
    }))
  },
  {
    id: 'conversion_rate',
    name: 'Taxa de Conversão',
    value: Math.random() * 5 + 2,
    unit: '%',
    change: (Math.random() - 0.5) * 2,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    status: Math.random() > 0.7 ? 'warning' : 'healthy',
    threshold: { warning: 2, critical: 1 },
    category: 'conversion',
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000),
      value: Math.random() * 5 + 2
    }))
  },
  {
    id: 'bounce_rate',
    name: 'Taxa de Rejeição',
    value: Math.random() * 30 + 40,
    unit: '%',
    change: (Math.random() - 0.5) * 10,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    status: 'healthy',
    threshold: { warning: 70, critical: 85 },
    category: 'engagement',
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000),
      value: Math.random() * 30 + 40
    }))
  }
];

const generateRandomEvent = (): LiveEvent => ({
  id: `event_${Date.now()}_${Math.random()}`,
  type: ['pageview', 'click', 'conversion', 'error', 'user_action'][Math.floor(Math.random() * 5)] as any,
  timestamp: new Date(),
  user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
  page: ['/', '/products', '/about', '/contact', '/checkout', '/blog'][Math.floor(Math.random() * 6)],
  device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
  location: {
    country: ['Brasil', 'Estados Unidos', 'Reino Unido', 'Alemanha', 'França', 'Canadá'][Math.floor(Math.random() * 6)],
    city: ['São Paulo', 'Nova York', 'Londres', 'Berlim', 'Paris', 'Toronto'][Math.floor(Math.random() * 6)],
    coordinates: [Math.random() * 180 - 90, Math.random() * 360 - 180]
  },
  metadata: {
    referrer: Math.random() > 0.5 ? 'https://google.com' : 'direct',
    utm_source: Math.random() > 0.7 ? 'facebook' : undefined
  },
  session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
  referrer: Math.random() > 0.5 ? 'https://google.com' : undefined,
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});

const generateMockEvents = (): LiveEvent[] => 
  Array.from({ length: 50 }, () => generateRandomEvent());

const generateMockSessions = (): UserSession[] => 
  Array.from({ length: 25 }, (_, i) => {
    const startTime = new Date(Date.now() - Math.random() * 7200000);
    const totalTime = Math.random() * 1800000 + 60000;
    
    return {
      id: `session_${i}`,
      user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
      start_time: startTime,
      last_activity: new Date(startTime.getTime() + totalTime),
      pages_visited: Math.floor(Math.random() * 15) + 1,
      actions_count: Math.floor(Math.random() * 30) + 1,
      device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'][Math.floor(Math.random() * 5)],
      location: {
        country: ['Brasil', 'Estados Unidos', 'Reino Unido', 'Alemanha'][Math.floor(Math.random() * 4)],
        city: ['São Paulo', 'Nova York', 'Londres', 'Berlim'][Math.floor(Math.random() * 4)]
      },
      status: Math.random() > 0.3 ? 'active' : Math.random() > 0.5 ? 'idle' : 'ended',
      conversion_events: Math.floor(Math.random() * 5),
      total_time: totalTime,
      bounce: Math.random() > 0.6,
      entry_page: ['/', '/products', '/about'][Math.floor(Math.random() * 3)],
      exit_page: Math.random() > 0.5 ? ['/checkout', '/contact', '/blog'][Math.floor(Math.random() * 3)] : undefined
    };
  });

const generateMockTrafficSources = (): TrafficSource[] => [
  {
    source: 'google',
    medium: 'organic',
    visitors: Math.floor(Math.random() * 2000) + 1000,
    sessions: Math.floor(Math.random() * 2500) + 1200,
    bounce_rate: Math.random() * 30 + 40,
    conversion_rate: Math.random() * 5 + 1,
    revenue: Math.random() * 20000 + 10000,
    cost: 0,
    roi: Infinity
  },
  {
    source: 'facebook',
    medium: 'social',
    campaign: 'summer_campaign_2024',
    visitors: Math.floor(Math.random() * 800) + 400,
    sessions: Math.floor(Math.random() * 1000) + 500,
    bounce_rate: Math.random() * 40 + 30,
    conversion_rate: Math.random() * 3 + 2,
    revenue: Math.random() * 8000 + 4000,
    cost: Math.random() * 2000 + 1000,
    roi: 3.5
  },
  {
    source: 'direct',
    medium: '(none)',
    visitors: Math.floor(Math.random() * 600) + 300,
    sessions: Math.floor(Math.random() * 700) + 350,
    bounce_rate: Math.random() * 25 + 20,
    conversion_rate: Math.random() * 6 + 3,
    revenue: Math.random() * 12000 + 6000,
    cost: 0,
    roi: Infinity
  },
  {
    source: 'google',
    medium: 'cpc',
    campaign: 'brand_keywords',
    visitors: Math.floor(Math.random() * 400) + 200,
    sessions: Math.floor(Math.random() * 500) + 250,
    bounce_rate: Math.random() * 35 + 25,
    conversion_rate: Math.random() * 4 + 2.5,
    revenue: Math.random() * 6000 + 3000,
    cost: Math.random() * 1500 + 800,
    roi: 2.8
  }
];

const generateMockGeographicData = (): GeographicData[] => [
  {
    country: 'Brasil',
    country_code: 'BR',
    visitors: Math.floor(Math.random() * 1500) + 800,
    sessions: Math.floor(Math.random() * 1800) + 1000,
    bounce_rate: Math.random() * 30 + 40,
    avg_session_duration: Math.random() * 300000 + 120000,
    conversion_rate: Math.random() * 5 + 2,
    revenue: Math.random() * 15000 + 8000,
    timezone: 'America/Sao_Paulo'
  },
  {
    country: 'Estados Unidos',
    country_code: 'US',
    visitors: Math.floor(Math.random() * 1200) + 600,
    sessions: Math.floor(Math.random() * 1400) + 700,
    bounce_rate: Math.random() * 35 + 35,
    avg_session_duration: Math.random() * 250000 + 100000,
    conversion_rate: Math.random() * 4 + 1.5,
    revenue: Math.random() * 12000 + 6000,
    timezone: 'America/New_York'
  },
  {
    country: 'Reino Unido',
    country_code: 'GB',
    visitors: Math.floor(Math.random() * 600) + 300,
    sessions: Math.floor(Math.random() * 700) + 350,
    bounce_rate: Math.random() * 40 + 30,
    avg_session_duration: Math.random() * 200000 + 80000,
    conversion_rate: Math.random() * 3 + 1,
    revenue: Math.random() * 8000 + 4000,
    timezone: 'Europe/London'
  },
  {
    country: 'Alemanha',
    country_code: 'DE',
    visitors: Math.floor(Math.random() * 500) + 250,
    sessions: Math.floor(Math.random() * 600) + 300,
    bounce_rate: Math.random() * 35 + 32,
    avg_session_duration: Math.random() * 220000 + 90000,
    conversion_rate: Math.random() * 3.5 + 1.2,
    revenue: Math.random() * 7000 + 3500,
    timezone: 'Europe/Berlin'
  }
];

const generateMockDeviceAnalytics = (): DeviceAnalytics[] => [
  {
    device_type: 'desktop',
    visitors: Math.floor(Math.random() * 1200) + 600,
    sessions: Math.floor(Math.random() * 1500) + 750,
    bounce_rate: Math.random() * 30 + 35,
    avg_session_duration: Math.random() * 300000 + 150000,
    conversion_rate: Math.random() * 5 + 2,
    revenue: Math.random() * 15000 + 8000,
    top_browsers: [
      { browser: 'Chrome', percentage: 65 + Math.random() * 20, version: '120.0' },
      { browser: 'Firefox', percentage: 15 + Math.random() * 10, version: '121.0' },
      { browser: 'Safari', percentage: 10 + Math.random() * 10, version: '17.0' },
      { browser: 'Edge', percentage: 5 + Math.random() * 5, version: '120.0' }
    ],
    screen_resolutions: [
      { resolution: '1920x1080', percentage: 45 },
      { resolution: '1366x768', percentage: 25 },
      { resolution: '2560x1440', percentage: 15 },
      { resolution: '1440x900', percentage: 10 },
      { resolution: '3840x2160', percentage: 5 }
    ]
  },
  {
    device_type: 'mobile',
    visitors: Math.floor(Math.random() * 1000) + 500,
    sessions: Math.floor(Math.random() * 1200) + 600,
    bounce_rate: Math.random() * 40 + 40,
    avg_session_duration: Math.random() * 200000 + 100000,
    conversion_rate: Math.random() * 3 + 1,
    revenue: Math.random() * 8000 + 4000,
    top_browsers: [
      { browser: 'Chrome Mobile', percentage: 70 + Math.random() * 15, version: '120.0' },
      { browser: 'Safari Mobile', percentage: 20 + Math.random() * 10, version: '17.0' },
      { browser: 'Samsung Internet', percentage: 5 + Math.random() * 5, version: '23.0' },
      { browser: 'Firefox Mobile', percentage: 3 + Math.random() * 3, version: '121.0' }
    ],
    screen_resolutions: [
      { resolution: '390x844', percentage: 25 }, // iPhone 12/13/14
      { resolution: '414x896', percentage: 20 }, // iPhone 11
      { resolution: '375x667', percentage: 15 }, // iPhone 8
      { resolution: '360x640', percentage: 20 }, // Android comum
      { resolution: '412x915', percentage: 20 }  // Android moderno
    ]
  },
  {
    device_type: 'tablet',
    visitors: Math.floor(Math.random() * 300) + 150,
    sessions: Math.floor(Math.random() * 350) + 175,
    bounce_rate: Math.random() * 35 + 30,
    avg_session_duration: Math.random() * 250000 + 120000,
    conversion_rate: Math.random() * 4 + 1.5,
    revenue: Math.random() * 5000 + 2500,
    top_browsers: [
      { browser: 'Safari', percentage: 60 + Math.random() * 20, version: '17.0' },
      { browser: 'Chrome', percentage: 30 + Math.random() * 15, version: '120.0' },
      { browser: 'Samsung Internet', percentage: 5 + Math.random() * 5, version: '23.0' },
      { browser: 'Firefox', percentage: 3 + Math.random() * 3, version: '121.0' }
    ],
    screen_resolutions: [
      { resolution: '1024x768', percentage: 30 }, // iPad clássico
      { resolution: '2048x1536', percentage: 25 }, // iPad Retina
      { resolution: '1080x1920', percentage: 20 }, // Android tablet
      { resolution: '800x1280', percentage: 15 }, // Android tablet menor
      { resolution: '2732x2048', percentage: 10 }  // iPad Pro
    ]
  }
];

const generateMockAlerts = (): RealTimeAlert[] => [
  {
    id: '1',
    type: 'traffic_spike',
    severity: 'medium',
    title: 'Pico de Tráfego Detectado',
    description: 'Aumento de 150% no tráfego nos últimos 10 minutos',
    metric: 'visitors',
    threshold: 200,
    current_value: 350,
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    status: Math.random() > 0.5 ? 'active' : 'acknowledged',
    actions_taken: ['Notificação enviada', 'Monitoramento intensificado'],
    auto_resolve: false
  },
  {
    id: '2',
    type: 'conversion_drop',
    severity: 'high',
    title: 'Queda na Taxa de Conversão',
    description: 'Taxa de conversão caiu 40% nas últimas 2 horas',
    metric: 'conversion_rate',
    threshold: 2.5,
    current_value: 1.5,
    timestamp: new Date(Date.now() - Math.random() * 7200000),
    status: 'active',
    actions_taken: ['Análise iniciada'],
    auto_resolve: false
  }
];

const generateMockReports = (): RealTimeReport[] => [
  {
    id: 'report_1',
    name: 'Relatório Diário de Tráfego',
    type: 'daily',
    metrics: ['visitors', 'pageviews', 'conversion_rate'],
    filters: { device: 'all', country: 'all' },
    schedule: {
      frequency: 'daily',
      time: '09:00',
      recipients: ['admin@empresa.com']
    },
    created_at: new Date(Date.now() - 86400000),
    last_generated: new Date(Date.now() - 3600000)
  },
  {
    id: 'report_2',
    name: 'Análise Semanal de Conversões',
    type: 'weekly',
    metrics: ['conversion_rate', 'revenue', 'traffic_sources'],
    filters: { conversion_events: '>0' },
    schedule: {
      frequency: 'weekly',
      time: 'Monday 10:00',
      recipients: ['marketing@empresa.com', 'ceo@empresa.com']
    },
    created_at: new Date(Date.now() - 604800000),
    last_generated: new Date(Date.now() - 86400000)
  }
];

const generateMockInsights = (): AnalyticsInsight[] => [
  {
    id: 'insight_1',
    type: 'opportunity',
    title: 'Oportunidade de Otimização Mobile',
    description: 'Taxa de conversão em dispositivos móveis está 30% abaixo da média. Há potencial para melhorias na experiência mobile.',
    confidence: 85,
    impact: 'high',
    recommendations: [
      'Otimizar formulários para mobile',
      'Melhorar velocidade de carregamento',
      'Simplificar processo de checkout'
    ],
    data_points: [
      { metric: 'mobile_conversion', value: 1.2 },
      { metric: 'desktop_conversion', value: 3.8 },
      { metric: 'mobile_traffic_share', value: 65 }
    ],
    timestamp: new Date(Date.now() - Math.random() * 259200000)
  },
  {
    id: 'insight_2',
    type: 'trend',
    title: 'Crescimento Consistente no Tráfego Orgânico',
    description: 'Tráfego orgânico cresceu 25% nas últimas 4 semanas, indicando melhoria no SEO.',
    confidence: 92,
    impact: 'medium',
    recommendations: [
      'Continuar estratégia de conteúdo atual',
      'Expandir palavras-chave de cauda longa',
      'Otimizar páginas com melhor performance'
    ],
    data_points: [
      { metric: 'organic_growth', value: 25 },
      { metric: 'keyword_rankings', value: 15 },
      { metric: 'content_engagement', value: 8.5 }
    ],
    timestamp: new Date(Date.now() - Math.random() * 172800000)
  },
  {
    id: 'insight_3',
    type: 'anomaly',
    title: 'Anomalia no Tráfego de Referência',
    description: 'Detectado pico incomum no tráfego de referência de um domínio específico. Pode indicar tráfego artificial.',
    confidence: 78,
    impact: 'medium',
    recommendations: [
      'Investigar fonte do tráfego',
      'Verificar qualidade dos visitantes',
      'Considerar filtros anti-spam'
    ],
    data_points: [
      { metric: 'referral_spike', value: 300 },
      { metric: 'bounce_rate', value: 95 },
      { metric: 'session_duration', value: 5 }
    ],
    timestamp: new Date(Date.now() - Math.random() * 259200000)
  }
];

export default useRealTimeAnalytics;