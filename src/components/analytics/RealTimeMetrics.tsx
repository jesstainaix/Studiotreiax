import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  RefreshCw
} from 'lucide-react';
import analyticsAPI from '@/services/analyticsApi';

interface RealTimeMetricsProps {
  className?: string;
}

interface MetricsData {
  activeUsers: number;
  sessionStats: {
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  systemLoad: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
  engagementMetrics: {
    videoViews: number;
    completionRate: number;
    interactionRate: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ className }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  // Conectar ao WebSocket
  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:3001/ws/analytics`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        
        // Inscrever-se nos canais de métricas
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['real_time_events', 'user_activity', 'system_performance']
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        
        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Erro de conexão com o servidor');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Falha ao conectar com o servidor');
    }
  };

  // Agendar reconexão
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Backoff exponencial
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connectWebSocket();
    }, delay);
  };

  // Processar mensagens do WebSocket
  const handleWebSocketMessage = (data: any) => {
    setLastUpdate(new Date());

    switch (data.type) {
      case 'initial_data':
        if (data.data.realTimeMetrics) {
          setMetrics(data.data.realTimeMetrics);
        }
        break;

      case 'real_time_update':
        setMetrics(data.data);
        break;

      case 'user_activity_update':
        setMetrics(prev => prev ? {
          ...prev,
          activeUsers: data.data.activeUsers,
          sessionStats: data.data.sessionStats
        } : null);
        break;

      case 'system_update':
        setMetrics(prev => prev ? {
          ...prev,
          systemLoad: data.data
        } : null);
        break;

      case 'pong':
        // Resposta ao ping - manter conexão viva
        break;

      default:
    }
  };

  // Reconectar manualmente
  const handleManualReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setReconnectAttempts(0);
    connectWebSocket();
  };

  // Carregar dados iniciais da API como fallback
  const loadInitialData = async () => {
    try {
      const [realTimeData, engagementData] = await Promise.all([
        analyticsAPI.getRealTimeMetrics(),
        analyticsAPI.getEngagementMetrics()
      ]);

      const processedData: MetricsData = {
        activeUsers: realTimeData.activeUsers || 0,
        sessionStats: {
          totalSessions: realTimeData.totalSessions || 0,
          averageSessionDuration: realTimeData.averageSessionDuration || 0,
          bounceRate: realTimeData.bounceRate || 0
        },
        systemLoad: {
          cpu: realTimeData.systemLoad?.cpu || 0,
          memory: realTimeData.systemLoad?.memory || 0,
          responseTime: realTimeData.systemLoad?.responseTime || 0
        },
        engagementMetrics: {
          videoViews: engagementData.videoViews || 0,
          completionRate: engagementData.completionRate || 0,
          interactionRate: engagementData.interactionRate || 0
        },
        alerts: realTimeData.alerts || []
      };

      setMetrics(processedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Fallback para dados mock se a API falhar
      const fallbackData: MetricsData = {
        activeUsers: 127,
        sessionStats: {
          totalSessions: 1543,
          averageSessionDuration: 285,
          bounceRate: 23.5
        },
        systemLoad: {
          cpu: 45.2,
          memory: 67.8,
          responseTime: 120
        },
        engagementMetrics: {
          videoViews: 2847,
          completionRate: 78.3,
          interactionRate: 65.2
        },
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: 'Alto uso de CPU detectado',
            timestamp: new Date().toISOString()
          }
        ]
      };
      setMetrics(fallbackData);
      setLastUpdate(new Date());
    }
  };

  // Efeito para conectar/desconectar
  useEffect(() => {
    // Carregar dados iniciais primeiro
    loadInitialData();
    
    // Depois tentar conectar WebSocket
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Formatar números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Formatar duração
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Obter cor do status
  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas em Tempo Real
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            {connectionError ? (
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">{connectionError}</p>
                <Button onClick={handleManualReconnect} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconectar
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Carregando métricas...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com status de conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Métricas em Tempo Real
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
                )}
              </Badge>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Atualizado: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Grid de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usuários Ativos */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.activeUsers)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Sessões Totais */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessões Totais</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.sessionStats.totalSessions)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Duração Média */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duração Média</p>
                <p className="text-2xl font-bold">
                  {formatDuration(metrics.sessionStats.averageSessionDuration)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conclusão */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">
                  {metrics.engagementMetrics.completionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Performance do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">CPU</p>
              <p className={`text-xl font-bold ${
                getStatusColor(metrics.systemLoad.cpu, { warning: 70, critical: 90 })
              }`}>
                {metrics.systemLoad.cpu.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Memória</p>
              <p className={`text-xl font-bold ${
                getStatusColor(metrics.systemLoad.memory, { warning: 80, critical: 95 })
              }`}>
                {metrics.systemLoad.memory.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
              <p className={`text-xl font-bold ${
                getStatusColor(metrics.systemLoad.responseTime, { warning: 500, critical: 1000 })
              }`}>
                {metrics.systemLoad.responseTime}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {metrics.alerts && metrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.type === 'error' ? 'destructive' : 
                                  alert.type === 'warning' ? 'secondary' : 'default'}>
                      {alert.type}
                    </Badge>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeMetrics;