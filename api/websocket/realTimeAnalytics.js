import { WebSocketServer } from 'ws';
import metricsCollector from '../middleware/metricsCollector.js';
import AnalyticsService from '../services/analyticsService.js';

class RealTimeAnalyticsServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.analyticsService = new AnalyticsService();
    this.broadcastInterval = null;
  }

  // Inicializar servidor WebSocket
  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/analytics'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Iniciar broadcast periódico de métricas
    this.startPeriodicBroadcast();

    console.log('Real-time Analytics WebSocket server initialized');
  }

  // Gerenciar nova conexão
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const userId = this.extractUserIdFromRequest(req);
    
    const clientInfo = {
      id: clientId,
      userId,
      ws,
      connectedAt: new Date(),
      subscriptions: new Set(),
      lastPing: Date.now()
    };

    this.clients.set(clientId, clientInfo);

    console.log(`Analytics client connected: ${clientId} (User: ${userId})`);

    // Configurar handlers de mensagem
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });

    // Enviar dados iniciais
    this.sendInitialData(clientId);

    // Configurar ping/pong para manter conexão viva
    this.setupHeartbeat(clientId);
  }

  // Processar mensagens do cliente
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(clientId, message.channels);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.channels);
          break;
        
        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;
        
        case 'request_metrics':
          this.sendCurrentMetrics(clientId, message.metricsType);
          break;
        
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error processing message from client ${clientId}:`, error);
    }
  }

  // Gerenciar inscrições em canais
  handleSubscription(clientId, channels) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const validChannels = [
      'dashboard',
      'user_activity', 
      'system_performance',
      'engagement_metrics',
      'compliance_alerts',
      'real_time_events'
    ];

    channels.forEach(channel => {
      if (validChannels.includes(channel)) {
        client.subscriptions.add(channel);
      }
    });

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      channels: Array.from(client.subscriptions)
    });
  }

  // Gerenciar cancelamento de inscrições
  handleUnsubscription(clientId, channels) {
    const client = this.clients.get(clientId);
    if (!client) return;

    channels.forEach(channel => {
      client.subscriptions.delete(channel);
    });

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      channels: Array.from(client.subscriptions)
    });
  }

  // Enviar dados iniciais ao cliente
  async sendInitialData(clientId) {
    try {
      const realTimeMetrics = metricsCollector.getRealTimeMetrics();
      const dashboardData = await this.analyticsService.getDashboardAnalytics();
      
      this.sendToClient(clientId, {
        type: 'initial_data',
        data: {
          realTimeMetrics,
          dashboard: dashboardData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`Error sending initial data to client ${clientId}:`, error);
    }
  }

  // Enviar métricas específicas
  async sendCurrentMetrics(clientId, metricsType) {
    try {
      let data;
      
      switch (metricsType) {
        case 'real_time':
          data = metricsCollector.getRealTimeMetrics();
          break;
        case 'engagement':
          data = await this.analyticsService.getEngagementMetrics();
          break;
        case 'system':
          data = await this.analyticsService.getSystemOverview();
          break;
        default:
          data = { error: 'Unknown metrics type' };
      }

      this.sendToClient(clientId, {
        type: 'metrics_data',
        metricsType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error sending metrics to client ${clientId}:`, error);
    }
  }

  // Configurar heartbeat
  setupHeartbeat(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastPing = now - client.lastPing;
      
      // Se não recebeu ping há mais de 60 segundos, desconectar
      if (timeSinceLastPing > 60000) {
        console.log(`Client ${clientId} timed out`);
        clearInterval(heartbeatInterval);
        this.handleDisconnection(clientId);
        return;
      }

      // Enviar ping
      this.sendToClient(clientId, { 
        type: 'ping', 
        timestamp: now 
      });
    }, 30000); // A cada 30 segundos

    client.heartbeatInterval = heartbeatInterval;
  }

  // Gerenciar desconexão
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      if (client.heartbeatInterval) {
        clearInterval(client.heartbeatInterval);
      }
      console.log(`Analytics client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    }
  }

  // Enviar mensagem para cliente específico
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      }
    }
  }

  // Broadcast para todos os clientes inscritos em um canal
  broadcastToChannel(channel, message) {
    const messageWithChannel = {
      ...message,
      channel,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(clientId, messageWithChannel);
      }
    });
  }

  // Iniciar broadcast periódico
  startPeriodicBroadcast() {
    this.broadcastInterval = setInterval(async () => {
      try {
        // Métricas em tempo real
        const realTimeMetrics = metricsCollector.getRealTimeMetrics();
        this.broadcastToChannel('real_time_events', {
          type: 'real_time_update',
          data: realTimeMetrics
        });

        // Atividade de usuários
        this.broadcastToChannel('user_activity', {
          type: 'user_activity_update',
          data: {
            activeUsers: realTimeMetrics.activeUsers,
            sessionStats: realTimeMetrics.sessionStats
          }
        });

        // Performance do sistema
        this.broadcastToChannel('system_performance', {
          type: 'system_update',
          data: realTimeMetrics.systemLoad
        });

      } catch (error) {
        console.error('Error in periodic broadcast:', error);
      }
    }, 5000); // A cada 5 segundos
  }

  // Parar broadcast periódico
  stopPeriodicBroadcast() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  // Gerar ID único para cliente
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extrair ID do usuário da requisição
  extractUserIdFromRequest(req) {
    // Implementar lógica para extrair userId do token/session
    // Por enquanto, retorna um ID genérico
    return req.headers['x-user-id'] || 'anonymous';
  }

  // Obter estatísticas do servidor
  getServerStats() {
    return {
      connectedClients: this.clients.size,
      totalSubscriptions: Array.from(this.clients.values())
        .reduce((sum, client) => sum + client.subscriptions.size, 0),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Fechar servidor
  close() {
    this.stopPeriodicBroadcast();
    
    this.clients.forEach((client, clientId) => {
      this.handleDisconnection(clientId);
    });

    if (this.wss) {
      this.wss.close();
    }
  }
}

// Instância singleton
const realTimeAnalyticsServer = new RealTimeAnalyticsServer();

export default realTimeAnalyticsServer;
export { RealTimeAnalyticsServer };