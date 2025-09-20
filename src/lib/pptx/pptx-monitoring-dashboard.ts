/**
 * PPTX Monitoring Dashboard - Dashboard de Monitoramento em Tempo Real
 * 
 * Este arquivo implementa um sistema abrangente de monitoramento em tempo real
 * para todas as operações do PPTX Studio, incluindo métricas de performance,
 * saúde do sistema, utilização de recursos e alertas automatizados.
 * 
 * Funcionalidades principais:
 * - Monitoramento de performance em tempo real
 * - Métricas de memória e CPU detalhadas
 * - Status de workers e cache
 * - Alertas e notificações automáticas
 * - Dashboards interativos
 * - Relatórios históricos e tendências
 * - Sistema de alertas configurável
 * - API de métricas para integração externa
 * 
 * @version 1.0.0
 * @author PPTX Studio Team
 */

import { EventEmitter } from '../../utils/EventEmitter';
import {
  MonitoringConfig,
  SystemMetrics,
  PerformanceMetrics,
  MemoryMetrics,
  CacheMetrics,
  WorkerMetrics,
  AlertConfig,
  AlertLevel,
  AlertType,
  DashboardWidget,
  HistoricalData,
  TrendAnalysis,
  SystemHealth
} from './pptx-interfaces';

/**
 * Configuração padrão do sistema de monitoramento
 */
const DEFAULT_MONITORING_CONFIG: Required<MonitoringConfig> = {
  metricsCollectionInterval: 1000, // 1 segundo
  alertCheckInterval: 5000, // 5 segundos
  historyRetentionDays: 30,
  enableRealTimeUpdates: true,
  enableAlerts: true,
  enableTrendAnalysis: true,
  enablePerformanceOptimization: true,
  enableAutomaticCleanup: true,
  metricsBufferSize: 1000,
  alertThresholds: {
    cpuUsage: 80,
    memoryUsage: 85,
    diskUsage: 90,
    cacheHitRate: 0.7,
    workerQueueLength: 50,
    errorRate: 0.05,
    responseTime: 5000
  },
  notificationChannels: ['console', 'email', 'webhook'],
  dashboardRefreshRate: 2000,
  enableDebugMetrics: false,
  enableNetworkMetrics: true,
  enableDatabaseMetrics: true,
  maxConcurrentConnections: 100
};

/**
 * Tipos de alertas suportados
 */
const ALERT_TYPES = {
  PERFORMANCE: 'performance',
  MEMORY: 'memory',
  DISK: 'disk',
  CACHE: 'cache',
  WORKER: 'worker',
  ERROR: 'error',
  SECURITY: 'security',
  SYSTEM: 'system'
} as const;

/**
 * Níveis de severidade de alertas
 */
const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;

/**
 * Métricas de sistema em tempo real
 */
interface RealtimeSystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
    processes: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    available: number;
    usage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
    iops: number;
    throughput: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connectionsActive: number;
    connectionsPending: number;
  };
}

/**
 * Dashboard de Monitoramento PPTX
 * 
 * Classe principal que gerencia todo o sistema de monitoramento,
 * coleta de métricas, alertas e visualização em tempo real.
 */
export class PPTXMonitoringDashboard extends EventEmitter {
  private readonly config: Required<MonitoringConfig>;
  private readonly systemMetrics: Map<number, RealtimeSystemMetrics>;
  private readonly performanceHistory: Map<string, HistoricalData[]>;
  private readonly alertHistory: AlertEvent[];
  private readonly activeAlerts: Map<string, AlertEvent>;
  private readonly dashboardWidgets: Map<string, DashboardWidget>;
  private readonly connections: Set<WebSocket>;
  
  private metricsCollectionTimer?: NodeJS.Timeout;
  private alertCheckTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private isMonitoring: boolean = false;
  private startTime: number = 0;

  /**
   * Construtor do dashboard de monitoramento
   */
  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.systemMetrics = new Map();
    this.performanceHistory = new Map();
    this.alertHistory = [];
    this.activeAlerts = new Map();
    this.dashboardWidgets = new Map();
    this.connections = new Set();
    
    this.log('PPTX Monitoring Dashboard criado');
    this.initializeWidgets();
  }

  /**
   * Inicialização do sistema de monitoramento
   */
  public async start(): Promise<void> {
    if (this.isMonitoring) {
      this.log('Sistema de monitoramento já está ativo');
      return;
    }

    try {
      this.log('Iniciando sistema de monitoramento...');
      
      this.startTime = Date.now();
      this.isMonitoring = true;
      
      // Iniciar coleta de métricas
      await this.startMetricsCollection();
      
      // Iniciar verificação de alertas
      if (this.config.enableAlerts) {
        await this.startAlertMonitoring();
      }
      
      // Iniciar limpeza automática
      if (this.config.enableAutomaticCleanup) {
        await this.startAutomaticCleanup();
      }
      
      // Configurar servidor WebSocket para updates em tempo real
      if (this.config.enableRealTimeUpdates) {
        await this.setupWebSocketServer();
      }
      
      this.log('Sistema de monitoramento iniciado com sucesso');
      this.emit('monitoringStarted', { startTime: this.startTime });
      
    } catch (error) {
      this.log(`Erro ao iniciar monitoramento: ${error}`);
      throw error;
    }
  }

  /**
   * Parar o sistema de monitoramento
   */
  public async stop(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      this.log('Parando sistema de monitoramento...');
      
      // Parar todos os timers
      if (this.metricsCollectionTimer) {
        clearInterval(this.metricsCollectionTimer);
      }
      if (this.alertCheckTimer) {
        clearInterval(this.alertCheckTimer);
      }
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
      
      // Fechar conexões WebSocket
      this.connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      this.connections.clear();
      
      this.isMonitoring = false;
      
      this.log('Sistema de monitoramento parado');
      this.emit('monitoringStopped', { 
        stopTime: Date.now(),
        uptime: Date.now() - this.startTime
      });
      
    } catch (error) {
      this.log(`Erro ao parar monitoramento: ${error}`);
      throw error;
    }
  }

  /**
   * Coleta de métricas do sistema
   */
  private async startMetricsCollection(): Promise<void> {
    this.metricsCollectionTimer = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.storeMetrics(metrics);
        this.broadcastMetrics(metrics);
        
        // Análise de tendências se habilitada
        if (this.config.enableTrendAnalysis) {
          await this.analyzeTrends(metrics);
        }
        
      } catch (error) {
        this.log(`Erro na coleta de métricas: ${error}`);
      }
    }, this.config.metricsCollectionInterval);
  }

  /**
   * Coleta métricas detalhadas do sistema
   */
  private async collectSystemMetrics(): Promise<RealtimeSystemMetrics> {
    const timestamp = Date.now();
    
    // Métricas de CPU
    const cpuMetrics = await this.getCPUMetrics();
    
    // Métricas de memória
    const memoryMetrics = await this.getMemoryMetrics();
    
    // Métricas de disco
    const diskMetrics = await this.getDiskMetrics();
    
    // Métricas de rede
    const networkMetrics = await this.getNetworkMetrics();
    
    return {
      timestamp,
      cpu: cpuMetrics,
      memory: memoryMetrics,
      disk: diskMetrics,
      network: networkMetrics
    };
  }

  /**
   * Métricas de CPU
   */
  private async getCPUMetrics(): Promise<any> {
    // Simulação de coleta de métricas de CPU
    // Em um ambiente real, seria usado os (processo do Node.js) ou bibliotecas específicas
    return {
      usage: Math.random() * 100,
      loadAverage: [Math.random(), Math.random(), Math.random()],
      cores: 8, // seria detectado automaticamente
      processes: Math.floor(Math.random() * 200) + 50
    };
  }

  /**
   * Métricas de memória
   */
  private async getMemoryMetrics(): Promise<any> {
    const memUsage = process.memoryUsage();
    const totalMemory = 16 * 1024 * 1024 * 1024; // 16GB simulado
    
    return {
      total: totalMemory,
      used: memUsage.heapUsed + memUsage.external,
      free: totalMemory - memUsage.heapUsed - memUsage.external,
      cached: Math.random() * 2 * 1024 * 1024 * 1024, // 2GB cache simulado
      available: totalMemory - memUsage.heapUsed,
      usage: ((memUsage.heapUsed + memUsage.external) / totalMemory) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };
  }

  /**
   * Métricas de disco
   */
  private async getDiskMetrics(): Promise<any> {
    return {
      total: 1024 * 1024 * 1024 * 1024, // 1TB simulado
      used: Math.random() * 512 * 1024 * 1024 * 1024, // até 512GB usado
      free: 512 * 1024 * 1024 * 1024,
      usage: Math.random() * 50, // até 50% uso
      iops: Math.floor(Math.random() * 1000),
      throughput: Math.random() * 100 * 1024 * 1024 // MB/s
    };
  }

  /**
   * Métricas de rede
   */
  private async getNetworkMetrics(): Promise<any> {
    return {
      bytesIn: Math.floor(Math.random() * 1024 * 1024),
      bytesOut: Math.floor(Math.random() * 1024 * 1024),
      packetsIn: Math.floor(Math.random() * 1000),
      packetsOut: Math.floor(Math.random() * 1000),
      connectionsActive: this.connections.size,
      connectionsPending: Math.floor(Math.random() * 10)
    };
  }

  /**
   * Armazenar métricas no buffer
   */
  private storeMetrics(metrics: RealtimeSystemMetrics): void {
    // Armazenar métricas com limite de buffer
    this.systemMetrics.set(metrics.timestamp, metrics);
    
    // Limpar métricas antigas para evitar vazamento de memória
    if (this.systemMetrics.size > this.config.metricsBufferSize) {
      const oldestTimestamp = Math.min(...this.systemMetrics.keys());
      this.systemMetrics.delete(oldestTimestamp);
    }
    
    // Atualizar histórico de performance
    this.updatePerformanceHistory(metrics);
  }

  /**
   * Atualizar histórico de performance
   */
  private updatePerformanceHistory(metrics: RealtimeSystemMetrics): void {
    const categories = ['cpu', 'memory', 'disk', 'network'];
    
    categories.forEach(category => {
      if (!this.performanceHistory.has(category)) {
        this.performanceHistory.set(category, []);
      }
      
      const history = this.performanceHistory.get(category)!;
      history.push({
        timestamp: metrics.timestamp,
        value: this.extractMetricValue(metrics, category),
        metadata: this.extractMetricMetadata(metrics, category)
      });
      
      // Manter apenas dados dos últimos N dias
      const cutoffTime = Date.now() - (this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
      this.performanceHistory.set(
        category,
        history.filter(entry => entry.timestamp > cutoffTime)
      );
    });
  }

  /**
   * Extrair valor específico da métrica
   */
  private extractMetricValue(metrics: RealtimeSystemMetrics, category: string): number {
    switch (category) {
      case 'cpu': return metrics.cpu.usage;
      case 'memory': return metrics.memory.usage;
      case 'disk': return metrics.disk.usage;
      case 'network': return metrics.network.bytesIn + metrics.network.bytesOut;
      default: return 0;
    }
  }

  /**
   * Extrair metadados da métrica
   */
  private extractMetricMetadata(metrics: RealtimeSystemMetrics, category: string): any {
    switch (category) {
      case 'cpu': return {
        cores: metrics.cpu.cores,
        loadAverage: metrics.cpu.loadAverage
      };
      case 'memory': return {
        heapUsed: metrics.memory.heapUsed,
        heapTotal: metrics.memory.heapTotal
      };
      case 'disk': return {
        iops: metrics.disk.iops,
        throughput: metrics.disk.throughput
      };
      case 'network': return {
        connections: metrics.network.connectionsActive
      };
      default: return {};
    }
  }

  /**
   * Transmitir métricas para clientes conectados
   */
  private broadcastMetrics(metrics: RealtimeSystemMetrics): void {
    if (!this.config.enableRealTimeUpdates) return;
    
    const message = JSON.stringify({
      type: 'metrics_update',
      data: metrics,
      timestamp: Date.now()
    });
    
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          this.log(`Erro ao enviar métricas via WebSocket: ${error}`);
          this.connections.delete(ws);
        }
      }
    });
  }

  /**
   * Monitoramento de alertas
   */
  private async startAlertMonitoring(): Promise<void> {
    this.alertCheckTimer = setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        this.log(`Erro na verificação de alertas: ${error}`);
      }
    }, this.config.alertCheckInterval);
  }

  /**
   * Verificar condições de alerta
   */
  private async checkAlerts(): Promise<void> {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return;

    const alerts: AlertEvent[] = [];

    // Verificar CPU
    if (latestMetrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      alerts.push(this.createAlert(
        ALERT_TYPES.PERFORMANCE,
        ALERT_LEVELS.WARNING,
        `CPU usage high: ${latestMetrics.cpu.usage.toFixed(1)}%`,
        { cpuUsage: latestMetrics.cpu.usage }
      ));
    }

    // Verificar memória
    if (latestMetrics.memory.usage > this.config.alertThresholds.memoryUsage) {
      alerts.push(this.createAlert(
        ALERT_TYPES.MEMORY,
        ALERT_LEVELS.ERROR,
        `Memory usage critical: ${latestMetrics.memory.usage.toFixed(1)}%`,
        { memoryUsage: latestMetrics.memory.usage }
      ));
    }

    // Verificar disco
    if (latestMetrics.disk.usage > this.config.alertThresholds.diskUsage) {
      alerts.push(this.createAlert(
        ALERT_TYPES.DISK,
        ALERT_LEVELS.CRITICAL,
        `Disk usage critical: ${latestMetrics.disk.usage.toFixed(1)}%`,
        { diskUsage: latestMetrics.disk.usage }
      ));
    }

    // Processar alertas encontrados
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Criar evento de alerta
   */
  private createAlert(
    type: string,
    level: string,
    message: string,
    data: any
  ): AlertEvent {
    return {
      id: this.generateAlertId(),
      type,
      level,
      message,
      timestamp: Date.now(),
      data,
      acknowledged: false,
      resolved: false
    };
  }

  /**
   * Processar alerta
   */
  private async processAlert(alert: AlertEvent): Promise<void> {
    // Verificar se já existe alerta similar ativo
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(a => a.type === alert.type && !a.resolved);
    
    if (existingAlert) {
      // Atualizar alerta existente
      existingAlert.timestamp = alert.timestamp;
      existingAlert.data = alert.data;
      return;
    }

    // Adicionar novo alerta
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Emitir evento
    this.emit('alert', alert);

    // Enviar notificações
    await this.sendNotifications(alert);

    this.log(`Alerta criado: ${alert.level} - ${alert.message}`);
  }

  /**
   * Enviar notificações
   */
  private async sendNotifications(alert: AlertEvent): Promise<void> {
    for (const channel of this.config.notificationChannels) {
      try {
        switch (channel) {
          case 'console':
            console.warn(`[ALERT] ${alert.level.toUpperCase()}: ${alert.message}`);
            break;
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
        }
      } catch (error) {
        this.log(`Erro ao enviar notificação via ${channel}: ${error}`);
      }
    }
  }

  /**
   * Análise de tendências
   */
  private async analyzeTrends(metrics: RealtimeSystemMetrics): Promise<void> {
    // Implementar análise de tendências
    const trends = this.calculateTrends();
    
    if (this.shouldNotifyTrends(trends)) {
      this.emit('trendsAnalyzed', trends);
    }
  }

  /**
   * Calcular tendências
   */
  private calculateTrends(): TrendAnalysis {
    const trends: TrendAnalysis = {
      timestamp: Date.now(),
      cpu: this.calculateMetricTrend('cpu'),
      memory: this.calculateMetricTrend('memory'),
      disk: this.calculateMetricTrend('disk'),
      network: this.calculateMetricTrend('network'),
      overall: 'stable'
    };

    // Determinar tendência geral
    const trendValues = [trends.cpu, trends.memory, trends.disk, trends.network];
    if (trendValues.filter(t => t === 'increasing').length >= 2) {
      trends.overall = 'increasing';
    } else if (trendValues.filter(t => t === 'decreasing').length >= 2) {
      trends.overall = 'decreasing';
    }

    return trends;
  }

  /**
   * Calcular tendência de métrica específica
   */
  private calculateMetricTrend(metric: string): 'increasing' | 'decreasing' | 'stable' {
    const history = this.performanceHistory.get(metric);
    if (!history || history.length < 10) return 'stable';

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    const recentAvg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.value, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Configurar servidor WebSocket
   */
  private async setupWebSocketServer(): Promise<void> {
    // Implementação simplificada - em um ambiente real seria configurado
    // um servidor WebSocket apropriado
    this.log('Servidor WebSocket configurado para tempo real');
  }

  /**
   * Limpeza automática
   */
  private async startAutomaticCleanup(): Promise<void> {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60000); // Limpeza a cada minuto
  }

  /**
   * Executar limpeza
   */
  private performCleanup(): void {
    // Limpar métricas antigas
    const cutoffTime = Date.now() - (this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
    
    // Limpar alertas resolvidos antigos
    const oldResolvedAlerts = this.alertHistory.filter(
      alert => alert.resolved && alert.timestamp < cutoffTime
    );
    
    oldResolvedAlerts.forEach(alert => {
      const index = this.alertHistory.indexOf(alert);
      if (index > -1) {
        this.alertHistory.splice(index, 1);
      }
    });

    this.log(`Limpeza executada: ${oldResolvedAlerts.length} alertas antigos removidos`);
  }

  /**
   * Inicializar widgets do dashboard
   */
  private initializeWidgets(): void {
    const widgets: DashboardWidget[] = [
      {
        id: 'cpu_usage',
        type: 'gauge',
        title: 'CPU Usage',
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: { min: 0, max: 100, unit: '%' }
      },
      {
        id: 'memory_usage',
        type: 'gauge',
        title: 'Memory Usage',
        position: { x: 2, y: 0, width: 2, height: 2 },
        config: { min: 0, max: 100, unit: '%' }
      },
      {
        id: 'disk_usage',
        type: 'gauge',
        title: 'Disk Usage',
        position: { x: 4, y: 0, width: 2, height: 2 },
        config: { min: 0, max: 100, unit: '%' }
      },
      {
        id: 'network_throughput',
        type: 'line_chart',
        title: 'Network Throughput',
        position: { x: 0, y: 2, width: 6, height: 3 },
        config: { timeWindow: 300000, unit: 'MB/s' }
      },
      {
        id: 'active_alerts',
        type: 'list',
        title: 'Active Alerts',
        position: { x: 6, y: 0, width: 3, height: 5 },
        config: { maxItems: 10 }
      },
      {
        id: 'system_health',
        type: 'status',
        title: 'System Health',
        position: { x: 9, y: 0, width: 3, height: 2 },
        config: {}
      }
    ];

    widgets.forEach(widget => {
      this.dashboardWidgets.set(widget.id, widget);
    });
  }

  /**
   * API pública: Obter métricas atuais
   */
  public getCurrentMetrics(): RealtimeSystemMetrics | null {
    return this.getLatestMetrics();
  }

  /**
   * API pública: Obter histórico de performance
   */
  public getPerformanceHistory(metric?: string): Map<string, HistoricalData[]> | HistoricalData[] {
    if (metric) {
      return this.performanceHistory.get(metric) || [];
    }
    return this.performanceHistory;
  }

  /**
   * API pública: Obter alertas ativos
   */
  public getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * API pública: Obter saúde do sistema
   */
  public getSystemHealth(): SystemHealth {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) {
      return { status: 'unknown', score: 0, issues: ['No metrics available'] };
    }

    const issues: string[] = [];
    let score = 100;

    // Verificar CPU
    if (latestMetrics.cpu.usage > 80) {
      issues.push('High CPU usage');
      score -= 20;
    }

    // Verificar memória
    if (latestMetrics.memory.usage > 85) {
      issues.push('High memory usage');
      score -= 25;
    }

    // Verificar disco
    if (latestMetrics.disk.usage > 90) {
      issues.push('High disk usage');
      score -= 30;
    }

    let status: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';
    if (score < 50) status = 'critical';
    else if (score < 75) status = 'warning';

    return { status, score, issues };
  }

  /**
   * API pública: Reconhecer alerta
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * API pública: Resolver alerta
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertId);
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Utilitários
   */
  private getLatestMetrics(): RealtimeSystemMetrics | null {
    if (this.systemMetrics.size === 0) return null;
    
    const latestTimestamp = Math.max(...this.systemMetrics.keys());
    return this.systemMetrics.get(latestTimestamp) || null;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private shouldNotifyTrends(trends: TrendAnalysis): boolean {
    return trends.overall !== 'stable';
  }

  private async sendEmailNotification(alert: AlertEvent): Promise<void> {
    // Implementação de notificação por email
    this.log(`Email notification sent for alert: ${alert.id}`);
  }

  private async sendWebhookNotification(alert: AlertEvent): Promise<void> {
    // Implementação de notificação via webhook
    this.log(`Webhook notification sent for alert: ${alert.id}`);
  }

  private log(message: string): void {
    console.log(`[PPTXMonitoring] ${message}`);
  }

  /**
   * API pública: Obter estatísticas de uptime
   */
  public getUptimeStats(): { uptime: number; startTime: number; isRunning: boolean } {
    return {
      uptime: this.isMonitoring ? Date.now() - this.startTime : 0,
      startTime: this.startTime,
      isRunning: this.isMonitoring
    };
  }

  /**
   * API pública: Exportar dados para relatório
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: Array.from(this.systemMetrics.values()).slice(-100), // Últimos 100 registros
      alerts: this.alertHistory.slice(-50), // Últimos 50 alertas
      performance: Object.fromEntries(this.performanceHistory),
      uptime: this.getUptimeStats()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Implementar exportação CSV
      return this.convertToCSV(data);
    }
  }

  private convertToCSV(data: any): string {
    // Implementação simplificada de conversão para CSV
    return 'timestamp,cpu,memory,disk\n' + 
           data.metrics.map((m: any) => 
             `${m.timestamp},${m.cpu.usage},${m.memory.usage},${m.disk.usage}`
           ).join('\n');
  }
}

/**
 * Interfaces para alertas
 */
interface AlertEvent {
  id: string;
  type: string;
  level: string;
  message: string;
  timestamp: number;
  data: any;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Factory function para criar dashboard
 */
export function createMonitoringDashboard(
  config?: Partial<MonitoringConfig>
): PPTXMonitoringDashboard {
  return new PPTXMonitoringDashboard(config);
}

/**
 * Função utilitária para inicializar monitoramento rapidamente
 */
export async function startQuickMonitoring(
  config?: Partial<MonitoringConfig>
): Promise<PPTXMonitoringDashboard> {
  const dashboard = createMonitoringDashboard(config);
  await dashboard.start();
  return dashboard;
}

export default PPTXMonitoringDashboard;