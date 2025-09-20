// Sistema avançado de logs estruturados com alertas de performance
import { toast } from 'sonner';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogCategory = 'performance' | 'user' | 'system' | 'api' | 'security' | 'business';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string | undefined;
  sessionId: string;
  userAgent: string;
  url: string;
  stack?: string | undefined;
  duration?: number | undefined;
  memoryUsage?: {
    used: number;
    total: number;
  } | undefined;
  performanceMetrics?: {
    loadTime?: number;
    renderTime?: number;
    bundleSize?: number;
    networkLatency?: number;
  } | undefined;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (entry: LogEntry) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // em milissegundos
  action: (entry: LogEntry) => void;
  enabled: boolean;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  maxStorageEntries: number;
  remoteEndpoint?: string;
  enablePerformanceTracking: boolean;
  enableMemoryTracking: boolean;
  enableAlerts: boolean;
}

class StructuredLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private alertRules: AlertRule[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private sessionId: string;
  private performanceObserver?: PerformanceObserver;
  private memoryInterval?: NodeJS.Timeout;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableStorage: true,
      enableRemote: false,
      maxStorageEntries: 1000,
      enablePerformanceTracking: true,
      enableMemoryTracking: true,
      enableAlerts: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializePerformanceTracking();
    this.initializeMemoryTracking();
    this.setupDefaultAlertRules();
    this.loadStoredLogs();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLogLevelPriority(level: LogLevel): number {
    const priorities = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5
    };
    return priorities[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLogLevelPriority(level) >= this.getLogLevelPriority(this.config.level);
  }

  private getCurrentMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      };
    }
    return undefined;
  }

  private initializePerformanceTracking() {
    if (!this.config.enablePerformanceTracking || typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.log('info', 'performance', 'Page Navigation', {
              performanceMetrics: {
                loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
                renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                networkLatency: navEntry.responseStart - navEntry.requestStart
              }
            });
          }
          
          if (entry.entryType === 'measure') {
            this.log('debug', 'performance', `Performance Measure: ${entry.name}`, {
              duration: entry.duration,
              performanceMetrics: {
                renderTime: entry.duration
              }
            });
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['navigation', 'measure', 'paint'] });
    } catch (error) {
      console.warn('Performance tracking não suportado:', error);
    }
  }

  private initializeMemoryTracking() {
    if (!this.config.enableMemoryTracking) return;

    this.memoryInterval = setInterval(() => {
      const memoryUsage = this.getCurrentMemoryUsage();
      if (memoryUsage) {
        const usagePercent = (memoryUsage.used / memoryUsage.total) * 100;
        
        if (usagePercent > 80) {
          this.log('warn', 'performance', 'High Memory Usage', {
            memoryUsage,
            usagePercent
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private setupDefaultAlertRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-memory-usage',
  name: 'Alto uso de memória',
        condition: (entry) => {
          return !!(entry.memoryUsage && 
                 (entry.memoryUsage.used / entry.memoryUsage.total) > 0.85);
        },
        severity: 'high',
        cooldown: 60000, // 1 minute
        action: (entry) => {
          toast.error('Alto uso de memória detectado', {
            description: `Uso atual: ${((entry.memoryUsage!.used / entry.memoryUsage!.total) * 100).toFixed(1)}%`
          });
        },
        enabled: true
      },
      {
        id: 'slow-performance',
  name: 'Performance lenta',
        condition: (entry) => {
          return !!(entry.performanceMetrics?.loadTime && 
                 entry.performanceMetrics.loadTime > 3000);
        },
        severity: 'medium',
        cooldown: 30000, // 30 seconds
        action: (entry) => {
          toast.warning('Performance lenta detectada', {
            description: `Carregamento: ${entry.performanceMetrics?.loadTime}ms`
          });
        },
        enabled: true
      },
      {
        id: 'error-frequency',
  name: 'Alta frequência de erros',
        condition: (entry) => {
          if (entry.level !== 'error') return false;
          
          const recentErrors = this.logs.filter(log => 
            log.level === 'error' && 
            log.timestamp > Date.now() - 300000 // últimos 5 minutos
          ).length;
          
          return recentErrors > 5;
        },
        severity: 'critical',
        cooldown: 120000, // 2 minutes
        action: (_entry) => {
          toast.error('Alta frequência de erros', {
            description: 'Múltiplos erros nos últimos 5 minutos'
          });
        },
        enabled: true
      },
      {
        id: 'network-latency',
  name: 'Alta latência de rede',
        condition: (entry) => {
          return !!(entry.performanceMetrics?.networkLatency && 
                 entry.performanceMetrics.networkLatency > 2000);
        },
        severity: 'medium',
        cooldown: 45000, // 45 seconds
        action: (entry) => {
          toast.warning('Alta latência de rede', {
            description: `Latência atual: ${entry.performanceMetrics?.networkLatency}ms`
          });
        },
        enabled: true
      }
    ];

    this.alertRules = defaultRules;
  }

  private checkAlertRules(entry: LogEntry) {
    if (!this.config.enableAlerts) return;

    this.alertRules.forEach(rule => {
      if (!rule.enabled || !rule.condition(entry)) return;

      const lastAlert = this.alertCooldowns.get(rule.id);
      const now = Date.now();
      
      if (!lastAlert || now - lastAlert > rule.cooldown) {
        rule.action(entry);
        this.alertCooldowns.set(rule.id, now);
        
        // Log the alert
        this.log('warn', 'system', `Alert triggered: ${rule.name}`, {
          alertRule: rule.id,
          originalEntry: entry.id
        });
      }
    });
  }

  private formatLogForConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    const style = this.getConsoleStyle(entry.level);
    
    console.groupCollapsed(`%c${prefix} ${entry.message}`, style);
    
    if (entry.data) {
    }
    
    if (entry.performanceMetrics) {
    }
    
    if (entry.memoryUsage) {
    }
    
    if (entry.stack) {
    }
    
    console.groupEnd();
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      trace: 'color: #6B7280; font-weight: normal;',
      debug: 'color: #3B82F6; font-weight: normal;',
      info: 'color: #10B981; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
      fatal: 'color: #DC2626; font-weight: bold; background: #FEE2E2;'
    };
    return styles[level];
  }

  private storeLog(entry: LogEntry) {
    if (!this.config.enableStorage) return;

    this.logs.push(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.config.maxStorageEntries) {
      this.logs = this.logs.slice(-this.config.maxStorageEntries);
    }

    // Salvar no localStorage
    try {
      localStorage.setItem('structured_logs', JSON.stringify(this.logs.slice(-100))); // Últimos 100
    } catch (error) {
      console.warn('Erro ao salvar logs no localStorage:', error);
    }
  }

  private loadStoredLogs() {
    if (!this.config.enableStorage) return;

    try {
      const stored = localStorage.getItem('structured_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erro ao carregar logs do localStorage:', error);
    }
  }

  private async sendToRemote(entry: LogEntry) {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Erro ao enviar log para servidor remoto:', error);
    }
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    userId?: string
  ): LogEntry {
    if (!this.shouldLog(level)) {
      return {} as LogEntry; // Return empty entry if not logging
    }

    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      memoryUsage: this.getCurrentMemoryUsage()
    };

    // Adicionar stack trace para erros
    if ((level === 'error' || level === 'fatal')) {
      const stack = new Error().stack;
      if (typeof stack === 'string') {
        entry.stack = stack;
      }
    }

    // Processar o log
    this.formatLogForConsole(entry);
    this.storeLog(entry);
    this.sendToRemote(entry);
    this.checkAlertRules(entry);

    return entry;
  }

  // Métodos de conveniência
  public trace(message: string, data?: any, userId?: string) {
    return this.log('trace', 'system', message, data, userId);
  }

  public debug(message: string, data?: any, userId?: string) {
    return this.log('debug', 'system', message, data, userId);
  }

  public info(message: string, data?: any, userId?: string) {
    return this.log('info', 'system', message, data, userId);
  }

  public warn(message: string, data?: any, userId?: string) {
    return this.log('warn', 'system', message, data, userId);
  }

  public error(message: string, data?: any, userId?: string) {
    return this.log('error', 'system', message, data, userId);
  }

  public fatal(message: string, data?: any, userId?: string) {
    return this.log('fatal', 'system', message, data, userId);
  }

  // Métodos específicos para categorias
  public performance(message: string, metrics?: any, userId?: string) {
    return this.log('info', 'performance', message, { performanceMetrics: metrics }, userId);
  }

  public userAction(message: string, data?: any, userId?: string) {
    return this.log('info', 'user', message, data, userId);
  }

  public apiCall(message: string, data?: any, userId?: string) {
    return this.log('info', 'api', message, data, userId);
  }

  public security(message: string, data?: any, userId?: string) {
    return this.log('warn', 'security', message, data, userId);
  }

  public business(message: string, data?: any, userId?: string) {
    return this.log('info', 'business', message, data, userId);
  }

  // Métodos de gerenciamento
  public getLogs(filters?: {
    level?: LogLevel;
    category?: LogCategory;
    startTime?: number;
    endTime?: number;
    userId?: string;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        const minPriority = this.getLogLevelPriority(filters.level);
        filteredLogs = filteredLogs.filter(log => 
          this.getLogLevelPriority(log.level) >= minPriority
        );
      }

      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }

      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
      }

      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
      }

      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('structured_logs');
  }

  public getStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentLogs = this.logs.filter(log => log.timestamp > last24h);

    const stats = {
      total: this.logs.length,
      last24h: recentLogs.length,
      byLevel: {} as Record<LogLevel, number>,
      byCategory: {} as Record<LogCategory, number>,
      errorRate: 0,
      averageMemoryUsage: 0,
      sessionId: this.sessionId
    };

    // Contar por nível
    recentLogs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    // Calcular taxa de erro
    const errors = (stats.byLevel.error || 0) + (stats.byLevel.fatal || 0);
    stats.errorRate = recentLogs.length > 0 ? (errors / recentLogs.length) * 100 : 0;

    // Calcular uso médio de memória
    const memoryLogs = recentLogs.filter(log => log.memoryUsage);
    if (memoryLogs.length > 0) {
      const totalMemory = memoryLogs.reduce((sum, log) => 
        sum + (log.memoryUsage!.used / log.memoryUsage!.total), 0
      );
      stats.averageMemoryUsage = (totalMemory / memoryLogs.length) * 100;
    }

    return stats;
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  public removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
  }
}

// Instância global do logger
export const logger = new StructuredLogger({
  level: 'debug',
  enableConsole: true,
  enableStorage: true,
  enableRemote: false,
  enablePerformanceTracking: true,
  enableMemoryTracking: true,
  enableAlerts: true
});

// Hook para performance timing
export const measurePerformance = (name: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      logger.performance(`Performance measure: ${name}`, {
        name,
        duration,
        timestamp: Date.now()
      });
      return duration;
    }
  };
};

// Decorator para logging automático de funções
export const logFunction = (category: LogCategory = 'system') => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const measure = measurePerformance(`${target.constructor.name}.${propertyName}`);
      
      try {
        logger.log('debug', category, `Function called: ${target.constructor.name}.${propertyName}`, {
          arguments: args
        });
        
        const result = method.apply(this, args);
        
        if (result instanceof Promise) {
          return result
            .then((res) => {
              const duration = measure.end();
              logger.log('debug', category, `Function completed: ${target.constructor.name}.${propertyName}`, {
                duration,
                result: res
              });
              return res;
            })
            .catch((error) => {
              measure.end();
              logger.error(`Function failed: ${target.constructor.name}.${propertyName}`, {
                error: error.message,
                stack: error.stack
              });
              throw error;
            });
        } else {
          const duration = measure.end();
          logger.log('debug', category, `Function completed: ${target.constructor.name}.${propertyName}`, {
            duration,
            result
          });
          return result;
        }
      } catch (error: any) {
        measure.end();
        logger.error(`Function failed: ${target.constructor.name}.${propertyName}`, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    };
    
    return descriptor;
  };
};

export default logger;