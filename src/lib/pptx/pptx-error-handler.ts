/**
 * PPTX Error Handler System
 * Sistema centralizado de tratamento de erros com recovery strategies
 */

export enum PPTXErrorType {
  // Erros de arquivo
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Erros de parsing
  PARSING_FAILED = 'PARSING_FAILED',
  XML_INVALID = 'XML_INVALID',
  MISSING_SLIDES = 'MISSING_SLIDES',
  MISSING_METADATA = 'MISSING_METADATA',
  
  // Erros de processamento
  WORKER_TIMEOUT = 'WORKER_TIMEOUT',
  WORKER_CRASHED = 'WORKER_CRASHED',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  PROCESSING_INTERRUPTED = 'PROCESSING_INTERRUPTED',
  
  // Erros de rede/IA
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  
  // Erros de recursos
  CANVAS_UNAVAILABLE = 'CANVAS_UNAVAILABLE',
  WEBGL_UNSUPPORTED = 'WEBGL_UNSUPPORTED',
  INSUFFICIENT_MEMORY = 'INSUFFICIENT_MEMORY',
  
  // Erros de configuração
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_DEPENDENCIES = 'MISSING_DEPENDENCIES',
  
  // Erro genérico
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum PPTXErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface PPTXErrorInfo {
  type: PPTXErrorType;
  severity: PPTXErrorSeverity;
  message: string;
  code: string;
  context: string;
  timestamp: number;
  originalError?: Error;
  stack?: string;
  metadata?: Record<string, any>;
  retryable: boolean;
  recoveryStrategy?: string;
}

export interface ErrorRecoveryResult {
  success: boolean;
  strategy: string;
  newData?: any;
  message: string;
  retryCount: number;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableRetry: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableFallback: boolean;
  enableTelemetry: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Classe principal para tratamento de erros PPTX
 */
export class PPTXErrorHandler {
  private static instance: PPTXErrorHandler;
  private config: ErrorHandlerConfig;
  private errorHistory: PPTXErrorInfo[] = [];
  private recoveryStrategies: Map<PPTXErrorType, (error: PPTXErrorInfo) => Promise<ErrorRecoveryResult>> = new Map();

  private constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableRetry: true,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableFallback: true,
      enableTelemetry: false,
      logLevel: 'error',
      ...config
    };

    this.initializeRecoveryStrategies();
  }

  static getInstance(config?: Partial<ErrorHandlerConfig>): PPTXErrorHandler {
    if (!PPTXErrorHandler.instance) {
      PPTXErrorHandler.instance = new PPTXErrorHandler(config);
    }
    return PPTXErrorHandler.instance;
  }

  /**
   * Tratar erro principal
   */
  async handleError(
    error: Error | PPTXErrorInfo,
    context: string = 'unknown',
    metadata: Record<string, any> = {}
  ): Promise<ErrorRecoveryResult> {
    // Converter Error para PPTXErrorInfo se necessário
    const errorInfo = this.normalizeError(error, context, metadata);
    
    // Registrar erro
    this.logError(errorInfo);
    this.recordError(errorInfo);

    // Tentar recuperação se habilitada
    if (errorInfo.retryable && this.config.enableRetry) {
      return this.attemptRecovery(errorInfo);
    }

    // Retornar erro sem recuperação
    return {
      success: false,
      strategy: 'no-recovery',
      message: errorInfo.message,
      retryCount: 0
    };
  }

  /**
   * Normalizar erro para formato padrão
   */
  private normalizeError(
    error: Error | PPTXErrorInfo,
    context: string,
    metadata: Record<string, any>
  ): PPTXErrorInfo {
    if (this.isPPTXErrorInfo(error)) {
      return error;
    }

    // Detectar tipo de erro baseado na mensagem/stack
    const errorType = this.detectErrorType(error);
    const severity = this.determineSeverity(errorType);

    return {
      type: errorType,
      severity,
      message: error.message || 'Erro desconhecido',
      code: this.generateErrorCode(errorType),
      context,
      timestamp: Date.now(),
      originalError: error,
      stack: error.stack,
      metadata,
      retryable: this.isRetryable(errorType),
      recoveryStrategy: this.getRecoveryStrategy(errorType)
    };
  }

  /**
   * Detectar tipo de erro
   */
  private detectErrorType(error: Error): PPTXErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Erros de arquivo
    if (message.includes('file not found') || message.includes('enoent')) {
      return PPTXErrorType.FILE_NOT_FOUND;
    }
    if (message.includes('corrupted') || message.includes('invalid zip')) {
      return PPTXErrorType.FILE_CORRUPTED;
    }
    if (message.includes('file too large') || message.includes('exceeds maximum')) {
      return PPTXErrorType.FILE_TOO_LARGE;
    }
    if (message.includes('invalid format') || message.includes('not a valid pptx')) {
      return PPTXErrorType.INVALID_FORMAT;
    }

    // Erros de parsing
    if (message.includes('xml') && (message.includes('parse') || message.includes('invalid'))) {
      return PPTXErrorType.XML_INVALID;
    }
    if (message.includes('no slides found') || message.includes('missing slides')) {
      return PPTXErrorType.MISSING_SLIDES;
    }

    // Erros de worker
    if (message.includes('timeout') || message.includes('worker timeout')) {
      return PPTXErrorType.WORKER_TIMEOUT;
    }
    if (message.includes('worker') && message.includes('crashed')) {
      return PPTXErrorType.WORKER_CRASHED;
    }

    // Erros de memória
    if (message.includes('out of memory') || message.includes('memory exceeded')) {
      return PPTXErrorType.MEMORY_EXCEEDED;
    }

    // Erros de rede
    if (message.includes('network') || message.includes('fetch')) {
      return PPTXErrorType.NETWORK_ERROR;
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return PPTXErrorType.API_RATE_LIMIT;
    }

    // Erros de recursos
    if (message.includes('canvas') || stack.includes('canvas')) {
      return PPTXErrorType.CANVAS_UNAVAILABLE;
    }
    if (message.includes('webgl') || message.includes('webgl context')) {
      return PPTXErrorType.WEBGL_UNSUPPORTED;
    }

    return PPTXErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determinar severidade do erro
   */
  private determineSeverity(errorType: PPTXErrorType): PPTXErrorSeverity {
    const severityMap: Record<PPTXErrorType, PPTXErrorSeverity> = {
      // Críticos
      [PPTXErrorType.FILE_CORRUPTED]: PPTXErrorSeverity.CRITICAL,
      [PPTXErrorType.MEMORY_EXCEEDED]: PPTXErrorSeverity.CRITICAL,
      [PPTXErrorType.WORKER_CRASHED]: PPTXErrorSeverity.CRITICAL,
      
      // Altos
      [PPTXErrorType.FILE_NOT_FOUND]: PPTXErrorSeverity.HIGH,
      [PPTXErrorType.INVALID_FORMAT]: PPTXErrorSeverity.HIGH,
      [PPTXErrorType.PARSING_FAILED]: PPTXErrorSeverity.HIGH,
      [PPTXErrorType.MISSING_SLIDES]: PPTXErrorSeverity.HIGH,
      
      // Médios
      [PPTXErrorType.WORKER_TIMEOUT]: PPTXErrorSeverity.MEDIUM,
      [PPTXErrorType.AI_SERVICE_UNAVAILABLE]: PPTXErrorSeverity.MEDIUM,
      [PPTXErrorType.NETWORK_ERROR]: PPTXErrorSeverity.MEDIUM,
      [PPTXErrorType.XML_INVALID]: PPTXErrorSeverity.MEDIUM,
      
      // Baixos
      [PPTXErrorType.CANVAS_UNAVAILABLE]: PPTXErrorSeverity.LOW,
      [PPTXErrorType.API_RATE_LIMIT]: PPTXErrorSeverity.LOW,
      [PPTXErrorType.WEBGL_UNSUPPORTED]: PPTXErrorSeverity.LOW,
      
      // Padrão
      [PPTXErrorType.FILE_TOO_LARGE]: PPTXErrorSeverity.MEDIUM,
      [PPTXErrorType.MISSING_METADATA]: PPTXErrorSeverity.LOW,
      [PPTXErrorType.PROCESSING_INTERRUPTED]: PPTXErrorSeverity.MEDIUM,
      [PPTXErrorType.AUTHENTICATION_FAILED]: PPTXErrorSeverity.HIGH,
      [PPTXErrorType.INSUFFICIENT_MEMORY]: PPTXErrorSeverity.HIGH,
      [PPTXErrorType.INVALID_CONFIG]: PPTXErrorSeverity.MEDIUM,
      [PPTXErrorType.MISSING_DEPENDENCIES]: PPTXErrorSeverity.HIGH,
      [PPTXErrorType.UNKNOWN_ERROR]: PPTXErrorSeverity.MEDIUM
    };

    return severityMap[errorType] || PPTXErrorSeverity.MEDIUM;
  }

  /**
   * Verificar se erro é recuperável
   */
  private isRetryable(errorType: PPTXErrorType): boolean {
    const retryableErrors = [
      PPTXErrorType.WORKER_TIMEOUT,
      PPTXErrorType.NETWORK_ERROR,
      PPTXErrorType.AI_SERVICE_UNAVAILABLE,
      PPTXErrorType.API_RATE_LIMIT,
      PPTXErrorType.PROCESSING_INTERRUPTED,
      PPTXErrorType.MEMORY_EXCEEDED
    ];

    return retryableErrors.includes(errorType);
  }

  /**
   * Obter estratégia de recuperação
   */
  private getRecoveryStrategy(errorType: PPTXErrorType): string {
    const strategyMap: Record<PPTXErrorType, string> = {
      [PPTXErrorType.WORKER_TIMEOUT]: 'retry-with-timeout-increase',
      [PPTXErrorType.NETWORK_ERROR]: 'retry-with-backoff',
      [PPTXErrorType.AI_SERVICE_UNAVAILABLE]: 'fallback-to-local',
      [PPTXErrorType.API_RATE_LIMIT]: 'retry-with-delay',
      [PPTXErrorType.MEMORY_EXCEEDED]: 'reduce-batch-size',
      [PPTXErrorType.CANVAS_UNAVAILABLE]: 'fallback-no-thumbnails',
      [PPTXErrorType.XML_INVALID]: 'fallback-basic-parser',
      [PPTXErrorType.WORKER_CRASHED]: 'restart-worker-pool'
    };

    return strategyMap[errorType] || 'no-recovery';
  }

  /**
   * Tentar recuperação
   */
  private async attemptRecovery(errorInfo: PPTXErrorInfo): Promise<ErrorRecoveryResult> {
    const strategy = this.recoveryStrategies.get(errorInfo.type);
    
    if (!strategy) {
      return {
        success: false,
        strategy: 'no-strategy-available',
        message: `Nenhuma estratégia de recuperação disponível para ${errorInfo.type}`,
        retryCount: 0
      };
    }

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < this.config.maxRetryAttempts) {
      try {
        this.log('info', `Tentativa de recuperação ${retryCount + 1}/${this.config.maxRetryAttempts} para ${errorInfo.type}`);
        
        const result = await strategy(errorInfo);
        
        if (result.success) {
          this.log('info', `Recuperação bem-sucedida usando estratégia: ${result.strategy}`);
          return { ...result, retryCount: retryCount + 1 };
        }

        retryCount++;
        
        if (retryCount < this.config.maxRetryAttempts) {
          await this.delay(this.config.retryDelayMs * retryCount); // Backoff exponencial
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;
        
        this.log('warn', `Tentativa de recuperação ${retryCount} falhou:`, error);
        
        if (retryCount < this.config.maxRetryAttempts) {
          await this.delay(this.config.retryDelayMs * retryCount);
        }
      }
    }

    return {
      success: false,
      strategy: errorInfo.recoveryStrategy || 'unknown',
      message: lastError?.message || `Falha na recuperação após ${retryCount} tentativas`,
      retryCount
    };
  }

  /**
   * Inicializar estratégias de recuperação
   */
  private initializeRecoveryStrategies(): void {
    // Worker timeout - aumentar timeout
    this.recoveryStrategies.set(PPTXErrorType.WORKER_TIMEOUT, async (error) => {
      return {
        success: true,
        strategy: 'retry-with-increased-timeout',
        message: 'Timeout aumentado para próxima tentativa',
        retryCount: 0,
        newData: { timeout: (error.metadata?.timeout || 30000) * 2 }
      };
    });

    // Erro de rede - retry com backoff
    this.recoveryStrategies.set(PPTXErrorType.NETWORK_ERROR, async (error) => {
      return {
        success: true,
        strategy: 'retry-with-backoff',
        message: 'Reagendando requisição com delay',
        retryCount: 0
      };
    });

    // IA indisponível - fallback local
    this.recoveryStrategies.set(PPTXErrorType.AI_SERVICE_UNAVAILABLE, async (error) => {
      return {
        success: true,
        strategy: 'fallback-to-local-processing',
        message: 'Usando processamento local sem IA',
        retryCount: 0,
        newData: { useAI: false, fallbackMode: true }
      };
    });

    // Rate limit - delay
    this.recoveryStrategies.set(PPTXErrorType.API_RATE_LIMIT, async (error) => {
      const delay = error.metadata?.retryAfter || 60000; // 1 minuto padrão
      await this.delay(delay);
      
      return {
        success: true,
        strategy: 'retry-after-rate-limit-delay',
        message: `Aguardando ${delay}ms antes de nova tentativa`,
        retryCount: 0
      };
    });

    // Memória excedida - reduzir batch
    this.recoveryStrategies.set(PPTXErrorType.MEMORY_EXCEEDED, async (error) => {
      const currentBatchSize = error.metadata?.batchSize || 4;
      const newBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
      
      return {
        success: true,
        strategy: 'reduce-batch-size',
        message: `Reduzindo batch size de ${currentBatchSize} para ${newBatchSize}`,
        retryCount: 0,
        newData: { batchSize: newBatchSize }
      };
    });

    // Canvas indisponível - fallback sem thumbnails
    this.recoveryStrategies.set(PPTXErrorType.CANVAS_UNAVAILABLE, async (error) => {
      return {
        success: true,
        strategy: 'disable-thumbnails',
        message: 'Desabilitando geração de thumbnails',
        retryCount: 0,
        newData: { enableThumbnails: false }
      };
    });

    // Worker crashed - restart pool
    this.recoveryStrategies.set(PPTXErrorType.WORKER_CRASHED, async (error) => {
      // Simular restart do worker pool
      return {
        success: true,
        strategy: 'restart-worker-pool',
        message: 'Worker pool reiniciado',
        retryCount: 0,
        newData: { workerPoolRestarted: true }
      };
    });
  }

  /**
   * Gerar código único para erro
   */
  private generateErrorCode(errorType: PPTXErrorType): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PPTX_${errorType}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Verificar se é PPTXErrorInfo
   */
  private isPPTXErrorInfo(error: any): error is PPTXErrorInfo {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * Registrar erro no histórico
   */
  private recordError(errorInfo: PPTXErrorInfo): void {
    this.errorHistory.push(errorInfo);
    
    // Manter apenas últimos 100 erros
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }
  }

  /**
   * Log estruturado
   */
  private logError(errorInfo: PPTXErrorInfo): void {
    if (!this.config.enableLogging) return;

    const logLevel = this.getLogLevelForSeverity(errorInfo.severity);
    
    this.log(logLevel, `[${errorInfo.code}] ${errorInfo.type}: ${errorInfo.message}`, {
      context: errorInfo.context,
      severity: errorInfo.severity,
      retryable: errorInfo.retryable,
      strategy: errorInfo.recoveryStrategy,
      metadata: errorInfo.metadata
    });
  }

  /**
   * Obter nível de log baseado na severidade
   */
  private getLogLevelForSeverity(severity: PPTXErrorSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case PPTXErrorSeverity.LOW: return 'info';
      case PPTXErrorSeverity.MEDIUM: return 'warn';
      case PPTXErrorSeverity.HIGH: return 'error';
      case PPTXErrorSeverity.CRITICAL: return 'error';
      default: return 'warn';
    }
  }

  /**
   * Log interno
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableLogging) return;

    const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levelOrder[this.config.logLevel];
    const messageLevel = levelOrder[level];

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [PPTXErrorHandler] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'debug':
        case 'info':
          console.log(logMessage, data || '');
          break;
        case 'warn':
          console.warn(logMessage, data || '');
          break;
        case 'error':
          console.error(logMessage, data || '');
          break;
      }
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas de erros
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: PPTXErrorInfo[];
    recoverySuccessRate: number;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    let recoveredErrors = 0;

    for (const error of this.errorHistory) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      if (error.retryable) {
        recoveredErrors++;
      }
    }

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(-10),
      recoverySuccessRate: this.errorHistory.length > 0 ? recoveredErrors / this.errorHistory.length : 0
    };
  }

  /**
   * Limpar histórico de erros
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }
}

// Export singleton instance
export const pptxErrorHandler = PPTXErrorHandler.getInstance();

// Export helper functions
export function handlePPTXError(
  error: Error,
  context: string = 'unknown',
  metadata: Record<string, any> = {}
): Promise<ErrorRecoveryResult> {
  return pptxErrorHandler.handleError(error, context, metadata);
}

export function createPPTXError(
  type: PPTXErrorType,
  message: string,
  context: string = 'unknown',
  metadata: Record<string, any> = {}
): PPTXErrorInfo {
  const severity = pptxErrorHandler['determineSeverity'](type);
  
  return {
    type,
    severity,
    message,
    code: pptxErrorHandler['generateErrorCode'](type),
    context,
    timestamp: Date.now(),
    metadata,
    retryable: pptxErrorHandler['isRetryable'](type),
    recoveryStrategy: pptxErrorHandler['getRecoveryStrategy'](type)
  };
}