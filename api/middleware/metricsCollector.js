import AnalyticsService from '../services/analyticsService.js';

class MetricsCollector {
  constructor() {
    this.analyticsService = new AnalyticsService();
    this.sessionData = new Map();
    this.activeUsers = new Set();
    this.pageViews = new Map();
    this.userActions = new Map();
  }

  // Middleware para coleta automática de métricas
  collectMetrics() {
    return (req, res, next) => {
      const startTime = Date.now();
      const userId = req.user?.id || 'anonymous';
      const sessionId = req.sessionID || req.headers['x-session-id'] || 'unknown';
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.connection.remoteAddress;

      // Rastrear usuários ativos
      this.activeUsers.add(userId);
      
      // Rastrear dados da sessão
      if (!this.sessionData.has(sessionId)) {
        this.sessionData.set(sessionId, {
          userId,
          startTime: Date.now(),
          pageViews: 0,
          actions: [],
          lastActivity: Date.now()
        });
      }

      // Atualizar última atividade
      const session = this.sessionData.get(sessionId);
      session.lastActivity = Date.now();
      session.pageViews++;

      // Rastrear visualizações de página
      const route = req.route?.path || req.path;
      const pageKey = `${req.method}:${route}`;
      this.pageViews.set(pageKey, (this.pageViews.get(pageKey) || 0) + 1);

      // Interceptar resposta para medir tempo de resposta
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Coletar métricas de performance
        this.analyticsService.trackMetric('response_time', responseTime, {
          route: pageKey,
          method: req.method,
          statusCode: res.statusCode,
          userId,
          sessionId
        });

        // Coletar evento de página visitada
        this.analyticsService.trackEvent('page_view', {
          route: pageKey,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          userAgent,
          ip,
          userId,
          sessionId
        });

        originalSend.call(res, data);
      }.bind(this);

      next();
    };
  }

  // Middleware específico para rastreamento de engajamento
  trackEngagement() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const sessionId = req.sessionID || req.headers['x-session-id'];
      
      if (userId && sessionId) {
        // Rastrear ações específicas baseadas na rota
        const action = this.getActionFromRoute(req.route?.path || req.path, req.method);
        
        if (action) {
          this.analyticsService.trackEvent('user_engagement', {
            action,
            userId,
            sessionId,
            timestamp: new Date().toISOString(),
            metadata: {
              route: req.path,
              method: req.method,
              params: req.params,
              query: req.query
            }
          });

          // Atualizar contadores de ação do usuário
          const userKey = `user:${userId}`;
          if (!this.userActions.has(userKey)) {
            this.userActions.set(userKey, {});
          }
          const userActionCount = this.userActions.get(userKey);
          userActionCount[action] = (userActionCount[action] || 0) + 1;
        }
      }

      next();
    };
  }

  // Mapear rotas para ações de engajamento
  getActionFromRoute(path, method) {
    const routeActions = {
      'GET:/api/projects': 'view_projects',
      'POST:/api/projects': 'create_project',
      'GET:/api/projects/:id': 'view_project_details',
      'PUT:/api/projects/:id': 'edit_project',
      'DELETE:/api/projects/:id': 'delete_project',
      'GET:/api/templates': 'browse_templates',
      'GET:/api/templates/:id': 'view_template',
      'POST:/api/templates/:id/use': 'use_template',
      'POST:/api/videos/upload': 'upload_video',
      'GET:/api/videos/:id': 'watch_video',
      'POST:/api/videos/:id/complete': 'complete_video',
      'GET:/api/analytics/dashboard': 'view_analytics',
      'POST:/api/auth/login': 'login',
      'POST:/api/auth/logout': 'logout'
    };

    const routeKey = `${method}:${path}`;
    return routeActions[routeKey] || null;
  }

  // Obter métricas em tempo real
  getRealTimeMetrics() {
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 minutos

    // Filtrar usuários ativos (últimos 5 minutos)
    const recentSessions = Array.from(this.sessionData.values())
      .filter(session => now - session.lastActivity < activeThreshold);

    const activeUserCount = new Set(recentSessions.map(s => s.userId)).size;

    // Top páginas por visualizações
    const topPages = Array.from(this.pageViews.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([route, views]) => ({ route, views }));

    // Estatísticas de sessão
    const sessionStats = {
      totalSessions: this.sessionData.size,
      activeSessions: recentSessions.length,
      avgSessionDuration: this.calculateAvgSessionDuration(recentSessions),
      avgPageViews: recentSessions.reduce((sum, s) => sum + s.pageViews, 0) / recentSessions.length || 0
    };

    return {
      timestamp: new Date().toISOString(),
      activeUsers: activeUserCount,
      totalUsers: this.activeUsers.size,
      sessionStats,
      topPages,
      systemLoad: this.getSystemLoad()
    };
  }

  // Calcular duração média das sessões
  calculateAvgSessionDuration(sessions) {
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session.lastActivity - session.startTime);
    }, 0);
    
    return Math.round(totalDuration / sessions.length / 1000); // em segundos
  }

  // Obter carga do sistema (simulado)
  getSystemLoad() {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      activeConnections: this.sessionData.size,
      requestsPerMinute: this.calculateRequestsPerMinute()
    };
  }

  // Calcular requisições por minuto
  calculateRequestsPerMinute() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    return Array.from(this.sessionData.values())
      .filter(session => session.lastActivity > oneMinuteAgo)
      .reduce((sum, session) => sum + session.pageViews, 0);
  }

  // Limpar dados antigos (executar periodicamente)
  cleanupOldData() {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 horas

    // Remover sessões antigas
    for (const [sessionId, session] of this.sessionData.entries()) {
      if (now - session.lastActivity > cleanupThreshold) {
        this.sessionData.delete(sessionId);
      }
    }

    // Limpar usuários inativos
    // (implementar lógica baseada em última atividade se necessário)
  }

  // Obter estatísticas de engajamento por usuário
  getUserEngagementStats(userId) {
    const userKey = `user:${userId}`;
    const userActions = this.userActions.get(userKey) || {};
    
    // Encontrar sessões do usuário
    const userSessions = Array.from(this.sessionData.values())
      .filter(session => session.userId === userId);

    const totalPageViews = userSessions.reduce((sum, s) => sum + s.pageViews, 0);
    const totalActions = Object.values(userActions).reduce((sum, count) => sum + count, 0);
    
    return {
      userId,
      totalSessions: userSessions.length,
      totalPageViews,
      totalActions,
      actionBreakdown: userActions,
      avgSessionDuration: this.calculateAvgSessionDuration(userSessions),
      lastActivity: Math.max(...userSessions.map(s => s.lastActivity), 0)
    };
  }
}

// Instância singleton
const metricsCollector = new MetricsCollector();

// Configurar limpeza automática a cada hora
setInterval(() => {
  metricsCollector.cleanupOldData();
}, 60 * 60 * 1000);

export default metricsCollector;
export { MetricsCollector };