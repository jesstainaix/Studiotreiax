import { io, Socket } from 'socket.io-client';

interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'performance' | 'user' | 'system' | 'business';
  tags?: Record<string, string>;
}

interface AlertData {
  id: string;
  metric: string;
  threshold: number;
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

interface MetricsConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  enableCompression?: boolean;
  bufferSize?: number;
}

interface MetricsSubscription {
  id: string;
  metrics: string[];
  callback: (data: MetricData[]) => void;
  filters?: {
    category?: string[];
    tags?: Record<string, string>;
    timeRange?: { start: number; end: number };
  };
}

class WebSocketMetricsService {
  private socket: Socket | null = null;
  private config: Required<MetricsConfig>;
  private subscriptions = new Map<string, MetricsSubscription>();
  private metricsBuffer = new Map<string, MetricData[]>();
  private alertHandlers = new Set<(alert: AlertData) => void>();
  private connectionHandlers = new Set<(connected: boolean) => void>();
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      url: config.url || (import.meta.env.PROD 
        ? 'wss://api.studiotreiax.com' 
        : 'ws://localhost:3001'),
      autoConnect: config.autoConnect ?? true,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 3000,
      enableCompression: config.enableCompression ?? true,
      bufferSize: config.bufferSize ?? 1000
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          transports: ['websocket'],
          compression: this.config.enableCompression,
          timeout: 10000,
          forceNew: true
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.startHeartbeat();
          this.notifyConnectionHandlers(true);
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.notifyConnectionHandlers(false);
          
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            this.scheduleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket Metrics connection error:', error);
          this.isConnected = false;
          this.notifyConnectionHandlers(false);
          this.scheduleReconnect();
          reject(error);
        });

        this.socket.on('metrics_data', (data: MetricData[]) => {
          this.handleMetricsData(data);
        });

        this.socket.on('alert', (alert: AlertData) => {
          this.handleAlert(alert);
        });

        this.socket.on('pong', () => {
          // Heartbeat response received
        });

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.notifyConnectionHandlers(false);
  }

  subscribe(subscription: Omit<MetricsSubscription, 'id'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullSubscription: MetricsSubscription = {
      id,
      ...subscription
    };

    this.subscriptions.set(id, fullSubscription);

    // Send subscription to server
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_metrics', {
        id,
        metrics: subscription.metrics,
        filters: subscription.filters
      });
    }

    return id;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);

    // Send unsubscription to server
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_metrics', { id: subscriptionId });
    }
  }

  sendMetric(metric: Omit<MetricData, 'id' | 'timestamp'>): void {
    const fullMetric: MetricData = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...metric
    };

    if (this.socket && this.isConnected) {
      this.socket.emit('send_metric', fullMetric);
    } else {
      // Buffer metric if not connected
      this.bufferMetric(fullMetric);
    }
  }

  sendBatchMetrics(metrics: Omit<MetricData, 'id' | 'timestamp'>[]): void {
    const fullMetrics = metrics.map(metric => ({
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...metric
    }));

    if (this.socket && this.isConnected) {
      this.socket.emit('send_batch_metrics', fullMetrics);
    } else {
      // Buffer metrics if not connected
      fullMetrics.forEach(metric => this.bufferMetric(metric));
    }
  }

  getHistoricalData(
    metrics: string[],
    timeRange: { start: number; end: number },
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count'
  ): Promise<MetricData[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const requestId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const timeout = setTimeout(() => {
        this.socket?.off(`historical_data_${requestId}`);
        reject(new Error('Request timeout'));
      }, 30000);

      this.socket.once(`historical_data_${requestId}`, (data: MetricData[]) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.emit('get_historical_data', {
        requestId,
        metrics,
        timeRange,
        aggregation
      });
    });
  }

  acknowledgeAlert(alertId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('acknowledge_alert', { alertId });
    }
  }

  onAlert(handler: (alert: AlertData) => void): () => void {
    this.alertHandlers.add(handler);
    return () => this.alertHandlers.delete(handler);
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getBufferedMetricsCount(): number {
    return Array.from(this.metricsBuffer.values())
      .reduce((total, buffer) => total + buffer.length, 0);
  }

  clearBuffer(): void {
    this.metricsBuffer.clear();
  }

  private handleMetricsData(data: MetricData[]): void {
    // Distribute data to subscriptions
    this.subscriptions.forEach(subscription => {
      const filteredData = this.filterMetricsData(data, subscription);
      if (filteredData.length > 0) {
        subscription.callback(filteredData);
      }
    });
  }

  private filterMetricsData(data: MetricData[], subscription: MetricsSubscription): MetricData[] {
    return data.filter(metric => {
      // Check if metric is in subscription list
      if (!subscription.metrics.includes(metric.name)) {
        return false;
      }

      // Apply filters
      if (subscription.filters) {
        const { category, tags, timeRange } = subscription.filters;

        if (category && !category.includes(metric.category)) {
          return false;
        }

        if (tags && metric.tags) {
          const hasAllTags = Object.entries(tags).every(
            ([key, value]) => metric.tags?.[key] === value
          );
          if (!hasAllTags) {
            return false;
          }
        }

        if (timeRange) {
          if (metric.timestamp < timeRange.start || metric.timestamp > timeRange.end) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private handleAlert(alert: AlertData): void {
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });
  }

  private bufferMetric(metric: MetricData): void {
    const category = metric.category;
    if (!this.metricsBuffer.has(category)) {
      this.metricsBuffer.set(category, []);
    }

    const buffer = this.metricsBuffer.get(category)!;
    buffer.push(metric);

    // Limit buffer size
    if (buffer.length > this.config.bufferSize) {
      buffer.shift();
    }
  }

  private flushBuffer(): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.metricsBuffer.forEach((buffer, category) => {
      if (buffer.length > 0) {
        this.socket!.emit('send_batch_metrics', buffer);
        buffer.length = 0;
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected) {
        this.connect().catch(console.error);
      }
    }, this.config.reconnectDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });

    // Flush buffer when reconnected
    if (connected) {
      setTimeout(() => this.flushBuffer(), 1000);
    }
  }
}

// Singleton instance
const websocketMetricsService = new WebSocketMetricsService();

// React Hook
export const useWebSocketMetrics = (config?: MetricsConfig) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [bufferedCount, setBufferedCount] = React.useState(0);
  const [alerts, setAlerts] = React.useState<AlertData[]>([]);

  React.useEffect(() => {
    const unsubscribeConnection = websocketMetricsService.onConnectionChange(setIsConnected);
    const unsubscribeAlert = websocketMetricsService.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 99)]); // Keep last 100 alerts
    });

    // Update buffered count periodically
    const updateBufferedCount = () => {
      setBufferedCount(websocketMetricsService.getBufferedMetricsCount());
    };

    updateBufferedCount();
    const interval = setInterval(updateBufferedCount, 5000);

    return () => {
      unsubscribeConnection();
      unsubscribeAlert();
      clearInterval(interval);
    };
  }, []);

  const subscribe = React.useCallback((subscription: Omit<MetricsSubscription, 'id'>) => {
    return websocketMetricsService.subscribe(subscription);
  }, []);

  const unsubscribe = React.useCallback((subscriptionId: string) => {
    websocketMetricsService.unsubscribe(subscriptionId);
  }, []);

  const sendMetric = React.useCallback((metric: Omit<MetricData, 'id' | 'timestamp'>) => {
    websocketMetricsService.sendMetric(metric);
  }, []);

  const sendBatchMetrics = React.useCallback((metrics: Omit<MetricData, 'id' | 'timestamp'>[]) => {
    websocketMetricsService.sendBatchMetrics(metrics);
  }, []);

  const getHistoricalData = React.useCallback(
    (metrics: string[], timeRange: { start: number; end: number }, aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count') => {
      return websocketMetricsService.getHistoricalData(metrics, timeRange, aggregation);
    },
    []
  );

  const acknowledgeAlert = React.useCallback((alertId: string) => {
    websocketMetricsService.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlerts = React.useCallback(() => {
    setAlerts([]);
  }, []);

  const clearBuffer = React.useCallback(() => {
    websocketMetricsService.clearBuffer();
    setBufferedCount(0);
  }, []);

  return {
    isConnected,
    bufferedCount,
    alerts,
    subscribe,
    unsubscribe,
    sendMetric,
    sendBatchMetrics,
    getHistoricalData,
    acknowledgeAlert,
    clearAlerts,
    clearBuffer,
    connect: () => websocketMetricsService.connect(),
    disconnect: () => websocketMetricsService.disconnect()
  };
};

export default websocketMetricsService;
export type { MetricData, AlertData, MetricsConfig, MetricsSubscription };