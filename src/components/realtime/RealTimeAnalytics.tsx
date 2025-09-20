import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Activity, Users, TrendingUp, TrendingDown, Zap, Globe,
  Monitor, Smartphone, Tablet, MapPin, Clock, AlertTriangle,
  CheckCircle, XCircle, Play, Pause, RotateCcw, Download,
  Settings, Filter, Search, Calendar, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

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
}

interface GeographicData {
  country: string;
  country_code: string;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
}

interface DeviceAnalytics {
  device_type: 'desktop' | 'mobile' | 'tablet';
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  top_browsers: Array<{
    browser: string;
    percentage: number;
  }>;
}

interface RealTimeAlert {
  id: string;
  type: 'traffic_spike' | 'traffic_drop' | 'error_rate' | 'conversion_drop' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  current_value: number;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface RealTimeConfig {
  refresh_interval: number; // em segundos
  data_retention: number; // em horas
  alerts: {
    enabled: boolean;
    thresholds: {
      traffic_spike: number;
      traffic_drop: number;
      error_rate: number;
      conversion_drop: number;
    };
  };
  filters: {
    countries: string[];
    devices: string[];
    traffic_sources: string[];
  };
  display: {
    show_events: boolean;
    show_sessions: boolean;
    show_geographic: boolean;
    max_events: number;
  };
}

const RealTimeAnalytics: React.FC = () => {
  // Estados principais
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics[]>([]);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [config, setConfig] = useState<RealTimeConfig>(defaultConfig);

  // Estados de controle
  const [isLive, setIsLive] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Dados simulados
  const [chartData, setChartData] = useState<any[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);

  // Inicialização e atualização em tempo real
  useEffect(() => {
    initializeRealTimeData();
    
    if (isLive) {
      const interval = setInterval(() => {
        updateRealTimeData();
      }, config.refresh_interval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isLive, config.refresh_interval]);

  const initializeRealTimeData = () => {
    setMetrics(generateMockMetrics());
    setLiveEvents(generateMockEvents());
    setActiveSessions(generateMockSessions());
    setTrafficSources(generateMockTrafficSources());
    setGeographicData(generateMockGeographicData());
    setDeviceAnalytics(generateMockDeviceAnalytics());
    setAlerts(generateMockAlerts());
    setChartData(generateMockChartData());
    setConversionFunnel(generateMockConversionFunnel());
    setTopPages(generateMockTopPages());
    setLastUpdate(new Date());
  };

  const updateRealTimeData = () => {
    // Simular atualizações em tempo real
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: Math.max(0, metric.value + (Math.random() - 0.5) * metric.value * 0.1),
      change: (Math.random() - 0.5) * 10,
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable'
    })));

    // Adicionar novos eventos
    const newEvents = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => generateRandomEvent());
    setLiveEvents(prev => [...newEvents, ...prev].slice(0, config.display.max_events));

    // Atualizar dados do gráfico
    setChartData(prev => {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        visitors: Math.floor(Math.random() * 100) + 50,
        pageviews: Math.floor(Math.random() * 200) + 100,
        conversions: Math.floor(Math.random() * 20) + 5
      };
      return [...prev.slice(-29), newDataPoint];
    });

    setLastUpdate(new Date());
  };

  // Handlers
  const handleToggleLive = () => {
    setIsLive(!isLive);
  };

  const handleRefresh = () => {
    updateRealTimeData();
  };

  const handleExportData = (format: 'csv' | 'json') => {
    const data = {
      metrics,
      events: liveEvents,
      sessions: activeSessions,
      traffic_sources: trafficSources,
      geographic: geographicData,
      devices: deviceAnalytics
    };
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
  };

  const handleUpdateConfig = (newConfig: Partial<RealTimeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Valores computados
  const totalVisitors = metrics.find(m => m.id === 'visitors')?.value || 0;
  const totalPageviews = metrics.find(m => m.id === 'pageviews')?.value || 0;
  const conversionRate = metrics.find(m => m.id === 'conversion_rate')?.value || 0;
  const activeAlertsCount = alerts.filter(alert => alert.status === 'active').length;
  const totalActiveSessions = activeSessions.filter(session => session.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics em Tempo Real</h2>
          <p className="text-gray-600">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={handleToggleLive}
          >
            {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLive ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportData('json')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alertas ativos */}
      {activeAlertsCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {activeAlertsCount} Alerta(s) Ativo(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(alert => alert.status === 'active').slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="ml-2 font-medium">{alert.title}</span>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                      Reconhecer
                    </Button>
                    <Button size="sm" onClick={() => handleResolveAlert(alert.id)}>
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map(metric => (
          <Card key={metric.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold">
                    {metric.value.toLocaleString()}
                    <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-sm ${
                      metric.change > 0 ? 'text-green-600' : 
                      metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(metric.status).replace('text-', 'bg-')}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="traffic">Tráfego</TabsTrigger>
          <TabsTrigger value="geographic">Geografia</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de visitantes em tempo real */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Visitantes em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="pageviews" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Funil de conversão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Funil de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionFunnel} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="step" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dispositivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Dispositivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceAnalytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device_type, percentage }) => `${device_type}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="visitors"
                    >
                      {deviceAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top páginas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Páginas Mais Visitadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{page.path}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{page.visitors} visitantes</span>
                          <span>{page.avg_time}s tempo médio</span>
                        </div>
                      </div>
                      <Progress value={page.percentage} className="w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Eventos em tempo real */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Eventos em Tempo Real
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar eventos..."
                    className="pl-10 pr-4 py-2 border rounded-md"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {liveEvents
                  .filter(event => 
                    searchFilter === '' || 
                    event.page.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    event.type.toLowerCase().includes(searchFilter.toLowerCase())
                  )
                  .map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(event.device)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{event.type}</Badge>
                            <span className="font-medium">{event.page}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location.city}, {event.location.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">ID: {event.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessões ativas */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sessões Ativas ({totalActiveSessions})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.filter(session => session.status === 'active').slice(0, 10).map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Usuário {session.user_id.slice(0, 8)}</span>
                          <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{session.pages_visited} páginas</span>
                          <span>{session.actions_count} ações</span>
                          <span>{session.location.city}, {session.location.country}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.floor((new Date().getTime() - session.start_time.getTime()) / 60000)}m
                      </p>
                      <p className="text-xs text-gray-600">{session.browser}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fontes de tráfego */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Fontes de Tráfego
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{source.source}</span>
                        <Badge variant="outline">{source.medium}</Badge>
                        {source.campaign && (
                          <Badge variant="secondary">{source.campaign}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{source.visitors} visitantes</span>
                        <span>{source.sessions} sessões</span>
                        <span>{source.bounce_rate.toFixed(1)}% rejeição</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{source.conversion_rate.toFixed(2)}%</p>
                      <p className="text-sm text-gray-600">conversão</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados geográficos */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distribuição Geográfica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geographicData.map((geo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCountryFlag(geo.country_code)}</span>
                      <div>
                        <p className="font-medium">{geo.country}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{geo.visitors} visitantes</span>
                          <span>{geo.sessions} sessões</span>
                          <span>{Math.floor(geo.avg_session_duration / 1000)}s duração</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{geo.conversion_rate.toFixed(2)}%</p>
                      <p className="text-sm text-gray-600">conversão</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configurações gerais */}
              <div>
                <h3 className="font-medium mb-3">Configurações Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Intervalo de Atualização (segundos)
                    </label>
                    <input
                      type="number"
                      value={config.refresh_interval}
                      onChange={(e) => handleUpdateConfig({ refresh_interval: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      max="300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Retenção de Dados (horas)
                    </label>
                    <input
                      type="number"
                      value={config.data_retention}
                      onChange={(e) => handleUpdateConfig({ data_retention: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      max="168"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações de alertas */}
              <div>
                <h3 className="font-medium mb-3">Alertas</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.alerts.enabled}
                      onChange={(e) => handleUpdateConfig({
                        alerts: { ...config.alerts, enabled: e.target.checked }
                      })}
                    />
                    <span>Habilitar alertas automáticos</span>
                  </label>
                  
                  {config.alerts.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Limite para Pico de Tráfego (%)
                        </label>
                        <input
                          type="number"
                          value={config.alerts.thresholds.traffic_spike}
                          onChange={(e) => handleUpdateConfig({
                            alerts: {
                              ...config.alerts,
                              thresholds: {
                                ...config.alerts.thresholds,
                                traffic_spike: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Limite para Queda de Conversão (%)
                        </label>
                        <input
                          type="number"
                          value={config.alerts.thresholds.conversion_drop}
                          onChange={(e) => handleUpdateConfig({
                            alerts: {
                              ...config.alerts,
                              thresholds: {
                                ...config.alerts.thresholds,
                                conversion_drop: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Configurações de exibição */}
              <div>
                <h3 className="font-medium mb-3">Exibição</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.display.show_events}
                      onChange={(e) => handleUpdateConfig({
                        display: { ...config.display, show_events: e.target.checked }
                      })}
                    />
                    <span>Mostrar eventos em tempo real</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.display.show_sessions}
                      onChange={(e) => handleUpdateConfig({
                        display: { ...config.display, show_sessions: e.target.checked }
                      })}
                    />
                    <span>Mostrar sessões ativas</span>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Máximo de eventos exibidos
                    </label>
                    <input
                      type="number"
                      value={config.display.max_events}
                      onChange={(e) => handleUpdateConfig({
                        display: { ...config.display, max_events: parseInt(e.target.value) }
                      })}
                      className="w-full p-2 border rounded-md"
                      min="10"
                      max="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setConfig(defaultConfig)}>
                  Restaurar Padrões
                </Button>
                <Button variant="outline" onClick={() => handleExportData('json')}>
                  Exportar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
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
      conversion_drop: 25
    }
  },
  filters: {
    countries: [],
    devices: [],
    traffic_sources: []
  },
  display: {
    show_events: true,
    show_sessions: true,
    show_geographic: true,
    max_events: 100
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
    category: 'traffic'
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
    category: 'traffic'
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
    category: 'conversion'
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
    category: 'engagement'
  }
];

const generateRandomEvent = (): LiveEvent => ({
  id: `event_${Date.now()}_${Math.random()}`,
  type: ['pageview', 'click', 'conversion', 'user_action'][Math.floor(Math.random() * 4)] as any,
  timestamp: new Date(),
  user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
  page: ['/', '/products', '/about', '/contact', '/checkout'][Math.floor(Math.random() * 5)],
  device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
  location: {
    country: ['Brasil', 'Estados Unidos', 'Reino Unido', 'Alemanha', 'França'][Math.floor(Math.random() * 5)],
    city: ['São Paulo', 'Nova York', 'Londres', 'Berlim', 'Paris'][Math.floor(Math.random() * 5)],
    coordinates: [Math.random() * 180 - 90, Math.random() * 360 - 180]
  },
  metadata: {}
});

const generateMockEvents = (): LiveEvent[] => 
  Array.from({ length: 20 }, () => generateRandomEvent());

const generateMockSessions = (): UserSession[] => 
  Array.from({ length: 15 }, (_, i) => ({
    id: `session_${i}`,
    user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
    start_time: new Date(Date.now() - Math.random() * 3600000),
    last_activity: new Date(Date.now() - Math.random() * 300000),
    pages_visited: Math.floor(Math.random() * 10) + 1,
    actions_count: Math.floor(Math.random() * 20) + 1,
    device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
    browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
    location: {
      country: ['Brasil', 'Estados Unidos', 'Reino Unido'][Math.floor(Math.random() * 3)],
      city: ['São Paulo', 'Nova York', 'Londres'][Math.floor(Math.random() * 3)]
    },
    status: Math.random() > 0.3 ? 'active' : Math.random() > 0.5 ? 'idle' : 'ended',
    conversion_events: Math.floor(Math.random() * 3)
  }));

const generateMockTrafficSources = (): TrafficSource[] => [
  {
    source: 'google',
    medium: 'organic',
    visitors: Math.floor(Math.random() * 1000) + 500,
    sessions: Math.floor(Math.random() * 1200) + 600,
    bounce_rate: Math.random() * 30 + 40,
    conversion_rate: Math.random() * 5 + 1,
    revenue: Math.random() * 10000 + 5000
  },
  {
    source: 'facebook',
    medium: 'social',
    campaign: 'summer_campaign',
    visitors: Math.floor(Math.random() * 500) + 200,
    sessions: Math.floor(Math.random() * 600) + 250,
    bounce_rate: Math.random() * 40 + 30,
    conversion_rate: Math.random() * 3 + 2,
    revenue: Math.random() * 5000 + 2000
  },
  {
    source: 'direct',
    medium: '(none)',
    visitors: Math.floor(Math.random() * 300) + 150,
    sessions: Math.floor(Math.random() * 350) + 180,
    bounce_rate: Math.random() * 25 + 20,
    conversion_rate: Math.random() * 6 + 3,
    revenue: Math.random() * 8000 + 4000
  }
];

const generateMockGeographicData = (): GeographicData[] => [
  {
    country: 'Brasil',
    country_code: 'BR',
    visitors: Math.floor(Math.random() * 1000) + 500,
    sessions: Math.floor(Math.random() * 1200) + 600,
    bounce_rate: Math.random() * 30 + 40,
    avg_session_duration: Math.random() * 300000 + 120000,
    conversion_rate: Math.random() * 5 + 2
  },
  {
    country: 'Estados Unidos',
    country_code: 'US',
    visitors: Math.floor(Math.random() * 800) + 300,
    sessions: Math.floor(Math.random() * 900) + 400,
    bounce_rate: Math.random() * 35 + 35,
    avg_session_duration: Math.random() * 250000 + 100000,
    conversion_rate: Math.random() * 4 + 1.5
  },
  {
    country: 'Reino Unido',
    country_code: 'GB',
    visitors: Math.floor(Math.random() * 400) + 150,
    sessions: Math.floor(Math.random() * 500) + 200,
    bounce_rate: Math.random() * 40 + 30,
    avg_session_duration: Math.random() * 200000 + 80000,
    conversion_rate: Math.random() * 3 + 1
  }
];

const generateMockDeviceAnalytics = (): DeviceAnalytics[] => [
  {
    device_type: 'desktop',
    visitors: Math.floor(Math.random() * 800) + 400,
    sessions: Math.floor(Math.random() * 1000) + 500,
    bounce_rate: Math.random() * 30 + 35,
    avg_session_duration: Math.random() * 300000 + 150000,
    conversion_rate: Math.random() * 5 + 2,
    top_browsers: [
      { browser: 'Chrome', percentage: 65 + Math.random() * 20 },
      { browser: 'Firefox', percentage: 15 + Math.random() * 10 },
      { browser: 'Safari', percentage: 10 + Math.random() * 10 }
    ]
  },
  {
    device_type: 'mobile',
    visitors: Math.floor(Math.random() * 600) + 300,
    sessions: Math.floor(Math.random() * 700) + 350,
    bounce_rate: Math.random() * 40 + 40,
    avg_session_duration: Math.random() * 200000 + 100000,
    conversion_rate: Math.random() * 3 + 1,
    top_browsers: [
      { browser: 'Chrome Mobile', percentage: 70 + Math.random() * 15 },
      { browser: 'Safari Mobile', percentage: 20 + Math.random() * 10 },
      { browser: 'Samsung Internet', percentage: 5 + Math.random() * 5 }
    ]
  },
  {
    device_type: 'tablet',
    visitors: Math.floor(Math.random() * 200) + 50,
    sessions: Math.floor(Math.random() * 250) + 75,
    bounce_rate: Math.random() * 35 + 30,
    avg_session_duration: Math.random() * 250000 + 120000,
    conversion_rate: Math.random() * 4 + 1.5,
    top_browsers: [
      { browser: 'Safari', percentage: 60 + Math.random() * 20 },
      { browser: 'Chrome', percentage: 30 + Math.random() * 15 },
      { browser: 'Firefox', percentage: 5 + Math.random() * 5 }
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
    status: Math.random() > 0.5 ? 'active' : 'acknowledged'
  }
];

const generateMockChartData = () => 
  Array.from({ length: 30 }, (_, i) => ({
    time: new Date(Date.now() - (29 - i) * 60000).toLocaleTimeString(),
    visitors: Math.floor(Math.random() * 100) + 50,
    pageviews: Math.floor(Math.random() * 200) + 100,
    conversions: Math.floor(Math.random() * 20) + 5
  }));

const generateMockConversionFunnel = () => [
  { step: 'Visitantes', users: 1000 },
  { step: 'Visualizações', users: 800 },
  { step: 'Interesse', users: 400 },
  { step: 'Carrinho', users: 200 },
  { step: 'Checkout', users: 100 },
  { step: 'Compra', users: 50 }
];

const generateMockTopPages = () => [
  { path: '/', visitors: 1200, avg_time: 45, percentage: 100 },
  { path: '/products', visitors: 800, avg_time: 120, percentage: 67 },
  { path: '/about', visitors: 400, avg_time: 90, percentage: 33 },
  { path: '/contact', visitors: 200, avg_time: 60, percentage: 17 },
  { path: '/blog', visitors: 150, avg_time: 180, percentage: 13 }
];

const getCountryFlag = (countryCode: string): string => {
  const flags: Record<string, string> = {
    'BR': '🇧🇷',
    'US': '🇺🇸',
    'GB': '🇬🇧',
    'DE': '🇩🇪',
    'FR': '🇫🇷'
  };
  return flags[countryCode] || '🌍';
};

export default RealTimeAnalytics;