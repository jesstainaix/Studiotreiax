/**
 * Error Handling Service
 * Serviço centralizado para tratamento robusto de erros em todo o sistema
 */

import { ValidationResult } from './pptx-validation.service';
import { recordError } from './performance-monitoring';

// Tipos de erro do sistema
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  FILE_SYSTEM = 'file_system',
  AUTHENTICATION = 'authentication',
  PIPELINE = 'pipeline',
  API = 'api',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_INPUT = 'user_input',
  SYSTEM = 'system'
}

// Severidade do erro
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Categoria do erro para análise
export enum ErrorCategory {
  RECOVERABLE = 'recoverable',
  NON_RECOVERABLE = 'non_recoverable',
  USER_ACTION_REQUIRED = 'user_action_required',
  RETRY_SUGGESTED = 'retry_suggested'
}

// Interface principal do erro
export interface SystemError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  metadata: ErrorMetadata;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  isRecoverable: boolean;
  solution?: string;
  userAction?: string;
}

// Contexto onde o erro ocorreu
export interface ErrorContext {
  service: string;
  method: string;
  stage?: string;
  pipelineId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  inputData?: any;
  environment: 'development' | 'production' | 'test';
}

// Metadados do erro
export interface ErrorMetadata {
  stackTrace?: string;
  correlationId?: string;
  parentError?: string;
  relatedErrors?: string[];
  performanceImpact?: 'none' | 'low' | 'medium' | 'high';
  affectedFeatures?: string[];
  diagnosticData?: any;
}

// Configuração do tratamento de erro
export interface ErrorHandlingConfig {
  retryAttempts: { [key in ErrorType]: number };
  retryDelays: { [key in ErrorType]: number[] };
  alertThresholds: { [key in ErrorSeverity]: number };
  logLevels: { [key in ErrorType]: 'debug' | 'info' | 'warn' | 'error' };
  autoRecovery: { [key in ErrorType]: boolean };
  userNotification: { [key in ErrorSeverity]: boolean };
}

// Estratégia de recuperação
export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'graceful_degradation' | 'user_intervention';
  action: () => Promise<any>;
  condition?: () => boolean;
  timeout?: number;
  maxAttempts?: number;
}

// Resultado do tratamento de erro
export interface ErrorHandlingResult {
  success: boolean;
  recoveryAttempted: boolean;
  recoveryStrategy?: string;
  finalError?: SystemError;
  retryCount: number;
  elapsedTime: number;
  userMessage: string;
  technicalDetails?: any;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private config: ErrorHandlingConfig;
  private errorHistory: SystemError[] = [];
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, Date> = new Map();
  private circuitBreakers: Map<string, { isOpen: boolean; failures: number; lastFailure: Date }> = new Map();

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Configuração padrão do sistema
   */
  private getDefaultConfig(): ErrorHandlingConfig {
    return {
      retryAttempts: {
        [ErrorType.VALIDATION]: 0,
        [ErrorType.NETWORK]: 3,
        [ErrorType.FILE_SYSTEM]: 2,
        [ErrorType.AUTHENTICATION]: 1,
        [ErrorType.PIPELINE]: 2,
        [ErrorType.API]: 3,
        [ErrorType.SECURITY]: 0,
        [ErrorType.PERFORMANCE]: 1,
        [ErrorType.USER_INPUT]: 0,
        [ErrorType.SYSTEM]: 1
      },
      retryDelays: {
        [ErrorType.VALIDATION]: [],
        [ErrorType.NETWORK]: [1000, 3000, 5000],
        [ErrorType.FILE_SYSTEM]: [500, 2000],
        [ErrorType.AUTHENTICATION]: [1000],
        [ErrorType.PIPELINE]: [2000, 5000],
        [ErrorType.API]: [1000, 3000, 8000],
        [ErrorType.SECURITY]: [],
        [ErrorType.PERFORMANCE]: [3000],
        [ErrorType.USER_INPUT]: [],
        [ErrorType.SYSTEM]: [2000]
      },
      alertThresholds: {
        [ErrorSeverity.LOW]: 10,
        [ErrorSeverity.MEDIUM]: 5,
        [ErrorSeverity.HIGH]: 2,
        [ErrorSeverity.CRITICAL]: 1
      },
      logLevels: {
        [ErrorType.VALIDATION]: 'warn',
        [ErrorType.NETWORK]: 'error',
        [ErrorType.FILE_SYSTEM]: 'error',
        [ErrorType.AUTHENTICATION]: 'warn',
        [ErrorType.PIPELINE]: 'error',
        [ErrorType.API]: 'error',
        [ErrorType.SECURITY]: 'error',
        [ErrorType.PERFORMANCE]: 'warn',
        [ErrorType.USER_INPUT]: 'info',
        [ErrorType.SYSTEM]: 'error'
      },
      autoRecovery: {
        [ErrorType.VALIDATION]: false,
        [ErrorType.NETWORK]: true,
        [ErrorType.FILE_SYSTEM]: true,
        [ErrorType.AUTHENTICATION]: false,
        [ErrorType.PIPELINE]: true,
        [ErrorType.API]: true,
        [ErrorType.SECURITY]: false,
        [ErrorType.PERFORMANCE]: true,
        [ErrorType.USER_INPUT]: false,
        [ErrorType.SYSTEM]: true
      },
      userNotification: {
        [ErrorSeverity.LOW]: false,
        [ErrorSeverity.MEDIUM]: true,
        [ErrorSeverity.HIGH]: true,
        [ErrorSeverity.CRITICAL]: true
      }
    };
  }

  /**
   * Trata um erro de forma robusta
   */
  async handleError(
    originalError: Error | string,
    context: ErrorContext,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      recoveryStrategies?: RecoveryStrategy[];
      customMessage?: string;
      metadata?: Partial<ErrorMetadata>;
    } = {}
  ): Promise<ErrorHandlingResult> {
    const startTime = Date.now();
    const errorId = this.generateErrorId();

    // Criar erro sistêmico estruturado
    const systemError: SystemError = {
      id: errorId,
      type: options.type || this.inferErrorType(originalError),
      severity: options.severity || this.inferErrorSeverity(originalError),
      category: options.category || this.inferErrorCategory(originalError),
      message: options.customMessage || this.extractErrorMessage(originalError),
      originalError: originalError instanceof Error ? originalError : undefined,
      context,
      metadata: {
        stackTrace: originalError instanceof Error ? originalError.stack : undefined,
        correlationId: context.requestId,
        environment: context.environment,
        ...options.metadata
      },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.retryAttempts[options.type || this.inferErrorType(originalError)],
      isRecoverable: this.isErrorRecoverable(originalError, options.type),
      solution: this.getSuggestion(originalError, options.type),
      userAction: this.getUserAction(originalError, options.type)
    };

    // Registrar erro no sistema de monitoramento
    this.recordError(systemError);

    // Verificar circuit breaker
    if (this.shouldTriggerCircuitBreaker(systemError)) {
      return this.handleCircuitBreakerOpen(systemError, startTime);
    }

    // Tentar recuperação automática se configurada
    if (this.config.autoRecovery[systemError.type] && systemError.isRecoverable) {
      const recoveryResult = await this.attemptRecovery(systemError, options.recoveryStrategies);
      
      if (recoveryResult.success) {
        return {
          success: true,
          recoveryAttempted: true,
          recoveryStrategy: recoveryResult.strategy,
          retryCount: recoveryResult.retryCount,
          elapsedTime: Date.now() - startTime,
          userMessage: this.getUserFriendlyMessage(systemError, true)
        };
      }
    }

    // Se não conseguiu recuperar, retornar erro tratado
    return {
      success: false,
      recoveryAttempted: this.config.autoRecovery[systemError.type],
      finalError: systemError,
      retryCount: systemError.retryCount,
      elapsedTime: Date.now() - startTime,
      userMessage: this.getUserFriendlyMessage(systemError, false),
      technicalDetails: this.getTechnicalDetails(systemError)
    };
  }

  /**
   * Tenta recuperação automática com estratégias
   */
  private async attemptRecovery(
    error: SystemError,
    customStrategies?: RecoveryStrategy[]
  ): Promise<{ success: boolean; strategy?: string; retryCount: number }> {
    const strategies = customStrategies || this.getDefaultRecoveryStrategies(error);
    
    for (const strategy of strategies) {
      try {
        // Verificar condição se fornecida
        if (strategy.condition && !strategy.condition()) {
          continue;
        }

        // Tentar recuperação com retry logic
        for (let attempt = 1; attempt <= (strategy.maxAttempts || error.maxRetries); attempt++) {
          try {
            await strategy.action();
            return { success: true, strategy: strategy.type, retryCount: attempt };
          } catch (retryError) {
            error.retryCount = attempt;
            
            if (attempt < (strategy.maxAttempts || error.maxRetries)) {
              const delay = this.getRetryDelay(error.type, attempt - 1);
              await this.delay(delay);
            }
          }
        }
      } catch (strategyError) {
        console.warn(`Estratégia de recuperação ${strategy.type} falhou:`, strategyError);
      }
    }

    return { success: false, retryCount: error.retryCount };
  }

  /**
   * Estratégias de recuperação padrão
   */
  private getDefaultRecoveryStrategies(error: SystemError): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];

    switch (error.type) {
      case ErrorType.NETWORK:
        strategies.push({
          type: 'retry',
          action: async () => {
            // Retentar operação de rede
            throw new Error('Retry network operation');
          },
          maxAttempts: 3
        });
        break;

      case ErrorType.API:
        strategies.push({
          type: 'retry',
          action: async () => {
            // Retentar chamada de API
            throw new Error('Retry API call');
          },
          maxAttempts: 3
        });
        break;

      case ErrorType.PIPELINE:
        strategies.push({
          type: 'retry',
          action: async () => {
            // Retentar etapa do pipeline
            throw new Error('Retry pipeline stage');
          },
          maxAttempts: 2
        });
        break;

      case ErrorType.FILE_SYSTEM:
        strategies.push({
          type: 'retry',
          action: async () => {
            // Retentar operação de arquivo
            throw new Error('Retry file operation');
          },
          maxAttempts: 2
        });
        break;
    }

    return strategies;
  }

  /**
   * Validação robusta de entrada
   */
  async validateInput(
    input: any,
    validationRules: ValidationRule[],
    context: ErrorContext
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityIssues: [],
      fileInfo: {
        size: 0,
        slideCount: 0,
        hasImages: false,
        hasVideos: false,
        hasAudio: false,
        hasMacros: false,
        hasExternalLinks: false,
        compression: 0
      }
    };

    try {
      for (const rule of validationRules) {
        try {
          const ruleResult = await this.applyValidationRule(input, rule);
          
          if (!ruleResult.passed) {
            const errorItem = {
              type: rule.category as any,
              message: ruleResult.message,
              severity: rule.severity as any,
              details: ruleResult.details
            };

            if (rule.severity === 'error') {
              result.errors.push(errorItem);
              result.isValid = false;
            } else if (rule.severity === 'warning') {
              result.warnings.push(errorItem);
            }
          }
        } catch (ruleError) {
          await this.handleError(ruleError, {
            ...context,
            method: 'validateInput.applyRule',
            inputData: { ruleId: rule.id }
          }, {
            type: ErrorType.VALIDATION,
            severity: ErrorSeverity.MEDIUM
          });
        }
      }
    } catch (validationError) {
      await this.handleError(validationError, {
        ...context,
        method: 'validateInput'
      }, {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.HIGH
      });
      
      result.isValid = false;
      result.errors.push({
        type: 'structure',
        message: 'Erro interno na validação',
        severity: 'critical'
      });
    }

    return result;
  }

  /**
   * Wrapper para operações com timeout e tratamento de erro
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: {
      timeout?: number;
      retries?: number;
      fallback?: () => Promise<T>;
      type?: ErrorType;
      severity?: ErrorSeverity;
    } = {}
  ): Promise<T> {
    const timeoutMs = options.timeout || 10000;
    const maxRetries = options.retries || 1;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Aplicar timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        return result;

      } catch (error) {
        if (attempt === maxRetries) {
          // Última tentativa - usar fallback se disponível
          if (options.fallback) {
            try {
              return await options.fallback();
            } catch (fallbackError) {
              throw error; // Usar erro original se fallback falhar
            }
          }
          throw error;
        }

        // Aguardar antes da próxima tentativa
        const delay = this.getRetryDelay(options.type || ErrorType.SYSTEM, attempt - 1);
        await this.delay(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  // Métodos auxiliares
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private inferErrorType(error: Error | string): ErrorType {
    const message = typeof error === 'string' ? error : error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) return ErrorType.NETWORK;
    if (message.includes('validation') || message.includes('invalid')) return ErrorType.VALIDATION;
    if (message.includes('file') || message.includes('read') || message.includes('write')) return ErrorType.FILE_SYSTEM;
    if (message.includes('auth') || message.includes('token')) return ErrorType.AUTHENTICATION;
    if (message.includes('pipeline') || message.includes('stage')) return ErrorType.PIPELINE;
    if (message.includes('api') || message.includes('endpoint')) return ErrorType.API;
    if (message.includes('security') || message.includes('permission')) return ErrorType.SECURITY;
    if (message.includes('performance') || message.includes('timeout')) return ErrorType.PERFORMANCE;
    
    return ErrorType.SYSTEM;
  }

  private inferErrorSeverity(error: Error | string): ErrorSeverity {
    const message = typeof error === 'string' ? error : error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.CRITICAL;
    if (message.includes('error') || message.includes('failed')) return ErrorSeverity.HIGH;
    if (message.includes('warning') || message.includes('deprecated')) return ErrorSeverity.MEDIUM;
    
    return ErrorSeverity.LOW;
  }

  private inferErrorCategory(error: Error | string): ErrorCategory {
    const message = typeof error === 'string' ? error : error.message.toLowerCase();
    
    if (message.includes('retry') || message.includes('temporary')) return ErrorCategory.RETRY_SUGGESTED;
    if (message.includes('input') || message.includes('validation')) return ErrorCategory.USER_ACTION_REQUIRED;
    if (message.includes('network') || message.includes('timeout')) return ErrorCategory.RECOVERABLE;
    
    return ErrorCategory.NON_RECOVERABLE;
  }

  private extractErrorMessage(error: Error | string): string {
    if (typeof error === 'string') return error;
    return error.message || 'Erro desconhecido';
  }

  private isErrorRecoverable(error: Error | string, type?: ErrorType): boolean {
    const errorType = type || this.inferErrorType(error);
    return this.config.autoRecovery[errorType];
  }

  private getSuggestion(error: Error | string, type?: ErrorType): string {
    const errorType = type || this.inferErrorType(error);
    
    const suggestions: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Verifique sua conexão com a internet e tente novamente',
      [ErrorType.VALIDATION]: 'Verifique os dados fornecidos e corrija os erros indicados',
      [ErrorType.FILE_SYSTEM]: 'Verifique se o arquivo existe e você tem permissão para acessá-lo',
      [ErrorType.AUTHENTICATION]: 'Faça login novamente ou verifique suas credenciais',
      [ErrorType.PIPELINE]: 'Tente executar o pipeline novamente ou contate o suporte',
      [ErrorType.API]: 'Aguarde um momento e tente novamente',
      [ErrorType.SECURITY]: 'Contate o administrador do sistema',
      [ErrorType.PERFORMANCE]: 'Aguarde um momento ou tente com menos dados',
      [ErrorType.USER_INPUT]: 'Verifique os dados inseridos',
      [ErrorType.SYSTEM]: 'Tente novamente ou contate o suporte'
    };

    return suggestions[errorType];
  }

  private getUserAction(error: Error | string, type?: ErrorType): string {
    const errorType = type || this.inferErrorType(error);
    
    const actions: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Verificar conexão',
      [ErrorType.VALIDATION]: 'Corrigir dados',
      [ErrorType.FILE_SYSTEM]: 'Verificar arquivo',
      [ErrorType.AUTHENTICATION]: 'Fazer login',
      [ErrorType.PIPELINE]: 'Tentar novamente',
      [ErrorType.API]: 'Aguardar',
      [ErrorType.SECURITY]: 'Contatar admin',
      [ErrorType.PERFORMANCE]: 'Reduzir carga',
      [ErrorType.USER_INPUT]: 'Revisar entrada',
      [ErrorType.SYSTEM]: 'Contatar suporte'
    };

    return actions[errorType];
  }

  private recordError(error: SystemError): void {
    // Adicionar ao histórico
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(0, 1000);
    }

    // Atualizar contadores
    const key = `${error.type}:${error.severity}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    this.lastErrorTime.set(key, error.timestamp);

    // Registrar no sistema de monitoramento se disponível
    if (error.context.pipelineId) {
      recordError(
        error.context.pipelineId,
        error.context.stage || 'unknown',
        error.originalError || new Error(error.message)
      );
    }

    // Log baseado na configuração
    const logLevel = this.config.logLevels[error.type];
    console[logLevel](`[${error.severity.toUpperCase()}] ${error.type}:`, error.message, error);
  }

  private shouldTriggerCircuitBreaker(error: SystemError): boolean {
    const key = `${error.context.service}:${error.context.method}`;
    const breaker = this.circuitBreakers.get(key) || { isOpen: false, failures: 0, lastFailure: new Date() };
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      breaker.failures++;
      breaker.lastFailure = new Date();
      
      if (breaker.failures >= 3) {
        breaker.isOpen = true;
        this.circuitBreakers.set(key, breaker);
        return true;
      }
    }
    
    this.circuitBreakers.set(key, breaker);
    return false;
  }

  private handleCircuitBreakerOpen(error: SystemError, startTime: number): ErrorHandlingResult {
    return {
      success: false,
      recoveryAttempted: false,
      finalError: error,
      retryCount: 0,
      elapsedTime: Date.now() - startTime,
      userMessage: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
      technicalDetails: { circuitBreakerOpen: true }
    };
  }

  private getRetryDelay(type: ErrorType, attemptIndex: number): number {
    const delays = this.config.retryDelays[type];
    return delays[Math.min(attemptIndex, delays.length - 1)] || 1000;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getUserFriendlyMessage(error: SystemError, recovered: boolean): string {
    if (recovered) {
      return 'Problema temporário resolvido automaticamente.';
    }
    
    const friendlyMessages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Problemas de conexão detectados.',
      [ErrorType.VALIDATION]: 'Dados fornecidos são inválidos.',
      [ErrorType.FILE_SYSTEM]: 'Problema ao acessar o arquivo.',
      [ErrorType.AUTHENTICATION]: 'Problema de autenticação.',
      [ErrorType.PIPELINE]: 'Erro no processamento.',
      [ErrorType.API]: 'Problema no servidor.',
      [ErrorType.SECURITY]: 'Problema de segurança detectado.',
      [ErrorType.PERFORMANCE]: 'Sistema sobrecarregado.',
      [ErrorType.USER_INPUT]: 'Entrada inválida.',
      [ErrorType.SYSTEM]: 'Erro interno do sistema.'
    };

    return friendlyMessages[error.type] + ' ' + error.solution;
  }

  private getTechnicalDetails(error: SystemError): any {
    return {
      errorId: error.id,
      type: error.type,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      retryCount: error.retryCount,
      context: error.context,
      stackTrace: error.metadata.stackTrace
    };
  }

  private async applyValidationRule(input: any, rule: ValidationRule): Promise<{ passed: boolean; message: string; details?: any }> {
    // Implementação básica - deve ser expandida conforme necessário
    return { passed: true, message: 'Validation passed' };
  }

  // Métodos públicos para estatísticas e monitoramento
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: SystemError[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(0, 10)
    };
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }

  updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Interfaces auxiliares
interface ValidationRule {
  id: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();
export default errorHandlingService;

// Export types
export type {
  SystemError,
  ErrorContext,
  ErrorMetadata,
  ErrorHandlingConfig,
  RecoveryStrategy,
  ErrorHandlingResult
};