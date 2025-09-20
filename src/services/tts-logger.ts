export interface TTSLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  provider: string;
  action: string;
  message: string;
  metadata?: {
    textLength?: number;
    duration?: number;
    success?: boolean;
    error?: string;
    fallbackUsed?: boolean;
    attempts?: number;
    voiceId?: string;
    language?: string;
    model?: string;
  };
}

export interface TTSMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  providerUsage: { [provider: string]: number };
  fallbackUsage: number;
  errorTypes: { [error: string]: number };
  lastHourRequests: number;
  peakHourRequests: number;
}

export class TTSLogger {
  private logs: TTSLogEntry[] = [];
  private maxLogs: number;
  private enableConsole: boolean;
  private enableStorage: boolean;
  private storageKey = 'tts-logs';

  constructor(options: {
    maxLogs?: number;
    enableConsole?: boolean;
    enableStorage?: boolean;
  } = {}) {
    this.maxLogs = options.maxLogs || 1000;
    this.enableConsole = options.enableConsole ?? true;
    this.enableStorage = options.enableStorage ?? true;
    
    // Load existing logs from storage
    this.loadFromStorage();
  }

  /**
   * Log an entry
   */
  log(
    level: TTSLogEntry['level'],
    provider: string,
    action: string,
    message: string,
    metadata?: TTSLogEntry['metadata']
  ): void {
    const entry: TTSLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      provider,
      action,
      message,
      metadata
    };

    // Add to logs array
    this.logs.unshift(entry); // Add to beginning for most recent first
    
    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output
    if (this.enableConsole) {
      this.logToConsole(entry);
    }

    // Storage
    if (this.enableStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Convenience methods for different log levels
   */
  info(provider: string, action: string, message: string, metadata?: TTSLogEntry['metadata']): void {
    this.log('info', provider, action, message, metadata);
  }

  warn(provider: string, action: string, message: string, metadata?: TTSLogEntry['metadata']): void {
    this.log('warn', provider, action, message, metadata);
  }

  error(provider: string, action: string, message: string, metadata?: TTSLogEntry['metadata']): void {
    this.log('error', provider, action, message, metadata);
  }

  debug(provider: string, action: string, message: string, metadata?: TTSLogEntry['metadata']): void {
    this.log('debug', provider, action, message, metadata);
  }

  /**
   * Log synthesis attempt
   */
  logSynthesisAttempt(
    provider: string,
    textLength: number,
    voiceId?: string,
    language?: string
  ): void {
    this.info(provider, 'synthesis_attempt', `Iniciando síntese de voz com ${provider} (${textLength} caracteres)`, {
      textLength,
      voiceId,
      language
    });
  }

  /**
   * Log synthesis success
   */
  logSynthesisSuccess(
    provider: string,
    duration: number,
    textLength: number,
    voiceId?: string,
    model?: string
  ): void {
    this.info(provider, 'synthesis_success', `Síntese de voz concluída com sucesso em ${duration}ms`, {
      duration,
      textLength,
      success: true,
      voiceId,
      model
    });
  }

  /**
   * Log synthesis failure
   */
  logSynthesisFailure(
    provider: string,
    error: string,
    duration?: number,
    textLength?: number
  ): void {
    this.error(provider, 'synthesis_failure', `Falha na síntese de voz: ${error}`, {
      duration,
      textLength,
      success: false,
      error
    });
  }

  /**
   * Log fallback usage
   */
  logFallbackUsed(
    fromProvider: string,
    toProvider: string,
    reason: string,
    attempts: number
  ): void {
    this.warn('fallback', 'fallback_triggered', 
      `Fallback ativado: ${fromProvider} → ${toProvider} (Motivo: ${reason}, Tentativas: ${attempts})`, {
      fallbackUsed: true,
      attempts,
      error: reason
    });
  }

  /**
   * Log health check
   */
  logHealthCheck(provider: string, success: boolean, error?: string): void {
    if (success) {
      this.info(provider, 'health_check', `Verificação de saúde do ${provider} passou com sucesso`, { success });
    } else {
      this.warn(provider, 'health_check', `Verificação de saúde do ${provider} falhou: ${error}`, { 
        success: false, 
        error 
      });
    }
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: {
    level?: TTSLogEntry['level'];
    provider?: string;
    action?: string;
    since?: Date;
    limit?: number;
  }): TTSLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter.provider) {
        filteredLogs = filteredLogs.filter(log => log.provider === filter.provider);
      }
      if (filter.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filter.action);
      }
      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!);
      }
      if (filter.limit) {
        filteredLogs = filteredLogs.slice(0, filter.limit); // Get first N items since logs are already newest first
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get metrics and statistics
   */
  getMetrics(): TTSMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const synthesisLogs = this.logs.filter(log => log.action.includes('synthesis'));
    const successLogs = synthesisLogs.filter(log => log.metadata?.success === true);
    const failedLogs = synthesisLogs.filter(log => log.metadata?.success === false);
    const fallbackLogs = this.logs.filter(log => log.metadata?.fallbackUsed === true);
    const lastHourLogs = this.logs.filter(log => log.timestamp >= oneHourAgo);
    
    // Calculate average response time
    const durationsLogs = synthesisLogs.filter(log => log.metadata?.duration);
    const averageResponseTime = durationsLogs.length > 0
      ? durationsLogs.reduce((sum, log) => sum + (log.metadata?.duration || 0), 0) / durationsLogs.length
      : 0;
    
    // Provider usage
    const providerUsage: { [provider: string]: number } = {};
    synthesisLogs.forEach(log => {
      providerUsage[log.provider] = (providerUsage[log.provider] || 0) + 1;
    });
    
    // Error types
    const errorTypes: { [error: string]: number } = {};
    failedLogs.forEach(log => {
      if (log.metadata?.error) {
        errorTypes[log.metadata.error] = (errorTypes[log.metadata.error] || 0) + 1;
      }
    });
    
    // Peak hour calculation (simplified - just current hour)
    const peakHourRequests = lastHourLogs.length;

    return {
      totalRequests: synthesisLogs.length,
      successfulRequests: successLogs.length,
      failedRequests: failedLogs.length,
      averageResponseTime,
      providerUsage,
      fallbackUsage: fallbackLogs.length,
      errorTypes,
      lastHourRequests: lastHourLogs.length,
      peakHourRequests
    };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs,
      metrics: this.getMetrics()
    }, null, 2);
  }

  /**
   * Clear all logs and add a clear confirmation entry
   */
  clearLogs(): void {
    this.logs = [];
    if (this.enableStorage) {
      localStorage.removeItem(this.storageKey);
    }
    this.info('system', 'clear_logs', 'Todos os logs foram limpos com sucesso');
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): TTSLogEntry[] {
    return this.getLogs({ level: 'error', limit });
  }

  /**
   * Get provider performance summary
   */
  getProviderPerformance(): { [provider: string]: {
    attempts: number;
    successes: number;
    failures: number;
    successRate: number;
    averageResponseTime: number;
  }} {
    const performance: { [provider: string]: any } = {};
    
    const synthesisLogs = this.logs.filter(log => log.action.includes('synthesis'));
    
    synthesisLogs.forEach(log => {
      if (!performance[log.provider]) {
        performance[log.provider] = {
          attempts: 0,
          successes: 0,
          failures: 0,
          totalDuration: 0,
          durationsCount: 0
        };
      }
      
      performance[log.provider].attempts++;
      
      if (log.metadata?.success === true) {
        performance[log.provider].successes++;
      } else if (log.metadata?.success === false) {
        performance[log.provider].failures++;
      }
      
      if (log.metadata?.duration) {
        performance[log.provider].totalDuration += log.metadata.duration;
        performance[log.provider].durationsCount++;
      }
    });
    
    // Calculate final metrics
    Object.keys(performance).forEach(provider => {
      const p = performance[provider];
      p.successRate = p.attempts > 0 ? (p.successes / p.attempts) * 100 : 0;
      p.averageResponseTime = p.durationsCount > 0 ? p.totalDuration / p.durationsCount : 0;
      
      // Clean up temporary fields
      delete p.totalDuration;
      delete p.durationsCount;
    });
    
    return performance;
  }

  /**
   * Private methods
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(entry: TTSLogEntry): void {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    
    const timestamp = entry.timestamp.toISOString();
    const prefix = `${emoji[entry.level]} [${timestamp}] [${entry.provider}] ${entry.action}:`;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.metadata);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.metadata);
        break;
      case 'debug':
        console.debug(prefix, entry.message, entry.metadata);
        break;
      default:
        console.log(prefix, entry.message, entry.metadata);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        logs: this.logs.slice(-100), // Save only last 100 logs to storage
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save TTS logs to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.logs && Array.isArray(data.logs)) {
          this.logs = data.logs.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load TTS logs from storage:', error);
    }
  }
}

// Export singleton instance
export const ttsLogger = new TTSLogger({
  maxLogs: 1000,
  enableConsole: true,
  enableStorage: true
});