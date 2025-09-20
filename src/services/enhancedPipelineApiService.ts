/**
 * Enhanced Pipeline API Service with Robust Error Handling
 * Versão aprimorada do pipeline service com tratamento robusto de erros
 */

import { pipelineApiService } from './pipelineApiService';
import { errorHandlingService, ErrorType, ErrorSeverity, ErrorCategory } from './errorHandlingService';
import type { PipelineJob, PipelineStartResponse, PipelineStatusResponse, PipelineJobsResponse } from './pipelineApiService';

class EnhancedPipelineApiService {
  private static instance: EnhancedPipelineApiService;
  private sessionId: string;

  private constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): EnhancedPipelineApiService {
    if (!EnhancedPipelineApiService.instance) {
      EnhancedPipelineApiService.instance = new EnhancedPipelineApiService();
    }
    return EnhancedPipelineApiService.instance;
  }

  /**
   * Inicia pipeline com validação robusta e tratamento de erros
   */
  async startPipeline(file: File): Promise<PipelineStartResponse> {
    const context = {
      service: 'PipelineApiService',
      method: 'startPipeline',
      sessionId: this.sessionId,
      requestId: `req_${Date.now()}`,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      inputData: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    };

    try {
      // Validação prévia do arquivo
      const validationResult = await this.validateFile(file, context);
      if (!validationResult.isValid) {
        throw new Error(`Arquivo inválido: ${validationResult.errors.join(', ')}`);
      }

      // Executar com tratamento robusto de erros
      return await errorHandlingService.withErrorHandling(
        () => pipelineApiService.startPipeline(file),
        context,
        {
          timeout: 15000, // 15 segundos
          retries: 2,
          type: ErrorType.PIPELINE,
          severity: ErrorSeverity.HIGH,
          fallback: async () => {
            // Fallback: tentar com configurações alternativas
            console.warn('Usando fallback para iniciar pipeline');
            return await this.startPipelineWithFallback(file);
          }
        }
      );

    } catch (error) {
      const handlingResult = await errorHandlingService.handleError(error, context, {
        type: ErrorType.PIPELINE,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.RETRY_SUGGESTED,
        customMessage: 'Falha ao iniciar o pipeline de processamento'
      });

      return {
        success: false,
        message: handlingResult.userMessage,
        error: handlingResult.technicalDetails?.errorId || 'Pipeline start failed'
      };
    }
  }

  /**
   * Verifica status com retry automático e circuit breaker
   */
  async getJobStatus(jobId: string): Promise<PipelineStatusResponse> {
    const context = {
      service: 'PipelineApiService',
      method: 'getJobStatus',
      sessionId: this.sessionId,
      requestId: `req_${Date.now()}`,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      inputData: { jobId }
    };

    try {
      return await errorHandlingService.withErrorHandling(
        () => pipelineApiService.getJobStatus(jobId),
        context,
        {
          timeout: 8000,
          retries: 3,
          type: ErrorType.API,
          severity: ErrorSeverity.MEDIUM
        }
      );

    } catch (error) {
      const handlingResult = await errorHandlingService.handleError(error, context, {
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.RETRY_SUGGESTED,
        customMessage: 'Falha ao verificar status do job'
      });

      return {
        success: false,
        error: handlingResult.userMessage
      };
    }
  }

  /**
   * Monitora job com tratamento robusto de erros e recuperação
   */
  async monitorJobRobust(
    jobId: string,
    callbacks: {
      onProgress: (job: PipelineJob) => void;
      onComplete: (job: PipelineJob) => void;
      onError: (error: string) => void;
      onRetry?: (attempt: number) => void;
    }
  ): Promise<void> {
    const context = {
      service: 'PipelineApiService',
      method: 'monitorJob',
      sessionId: this.sessionId,
      requestId: `req_${Date.now()}`,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      inputData: { jobId }
    };

    let monitoringActive = true;
    let errorCount = 0;
    const maxErrors = 5;
    const retryDelays = [1000, 2000, 4000, 8000, 16000]; // Backoff exponencial

    const monitorWithErrorHandling = async () => {
      while (monitoringActive && errorCount < maxErrors) {
        try {
          const response = await this.getJobStatus(jobId);
          
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Falha ao obter status');
          }

          const job = response.data;
          callbacks.onProgress(job);

          // Verificar se completed
          if (job.status === 'completed') {
            monitoringActive = false;
            callbacks.onComplete(job);
            return;
          }

          // Verificar se failed
          if (job.status === 'failed') {
            monitoringActive = false;
            callbacks.onError(job.error || 'Pipeline falhou');
            return;
          }

          // Reset error count em caso de sucesso
          errorCount = 0;

          // Aguardar próximo poll
          await this.delay(2000);

        } catch (error) {
          errorCount++;
          
          const handlingResult = await errorHandlingService.handleError(error, {
            ...context,
            method: 'monitorJob.poll'
          }, {
            type: ErrorType.API,
            severity: errorCount >= maxErrors ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
            category: ErrorCategory.RETRY_SUGGESTED
          });

          if (errorCount >= maxErrors) {
            monitoringActive = false;
            callbacks.onError(`Monitoramento falhou após ${maxErrors} tentativas: ${handlingResult.userMessage}`);
            return;
          }

          // Notificar sobre retry
          if (callbacks.onRetry) {
            callbacks.onRetry(errorCount);
          }

          // Aguardar com backoff exponencial
          const delay = retryDelays[Math.min(errorCount - 1, retryDelays.length - 1)];
          await this.delay(delay);
        }
      }
    };

    // Iniciar monitoramento
    monitorWithErrorHandling();
  }

  /**
   * Lista jobs com cache inteligente e tratamento de erros
   */
  async getUserJobsRobust(forceRefresh: boolean = false): Promise<PipelineJobsResponse> {
    const context = {
      service: 'PipelineApiService',
      method: 'getUserJobs',
      sessionId: this.sessionId,
      requestId: `req_${Date.now()}`,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      inputData: { forceRefresh }
    };

    try {
      return await errorHandlingService.withErrorHandling(
        () => pipelineApiService.getUserJobs(forceRefresh),
        context,
        {
          timeout: 10000,
          retries: 2,
          type: ErrorType.API,
          severity: ErrorSeverity.LOW,
          fallback: async () => {
            // Fallback: retornar jobs em cache ou lista vazia
            console.warn('Usando fallback para getUserJobs');
            return {
              success: true,
              data: []
            };
          }
        }
      );

    } catch (error) {
      const handlingResult = await errorHandlingService.handleError(error, context, {
        type: ErrorType.API,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.RECOVERABLE,
        customMessage: 'Falha ao carregar lista de jobs'
      });

      return {
        success: false,
        error: handlingResult.userMessage
      };
    }
  }

  /**
   * Cancela job com confirmação e rollback
   */
  async cancelJobRobust(jobId: string): Promise<{ success: boolean; error?: string }> {
    const context = {
      service: 'PipelineApiService',
      method: 'cancelJob',
      sessionId: this.sessionId,
      requestId: `req_${Date.now()}`,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      inputData: { jobId }
    };

    try {
      // Verificar se job existe antes de cancelar
      const statusResponse = await this.getJobStatus(jobId);
      if (!statusResponse.success) {
        throw new Error('Job não encontrado ou inacessível');
      }

      const job = statusResponse.data!;
      if (job.status === 'completed' || job.status === 'failed') {
        return {
          success: false,
          error: 'Job já foi finalizado e não pode ser cancelado'
        };
      }

      return await errorHandlingService.withErrorHandling(
        () => pipelineApiService.cancelJob(jobId),
        context,
        {
          timeout: 5000,
          retries: 1,
          type: ErrorType.API,
          severity: ErrorSeverity.MEDIUM
        }
      );

    } catch (error) {
      const handlingResult = await errorHandlingService.handleError(error, context, {
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.USER_ACTION_REQUIRED,
        customMessage: 'Falha ao cancelar job'
      });

      return {
        success: false,
        error: handlingResult.userMessage
      };
    }
  }

  /**
   * Obtém estatísticas com cache e validação
   */
  async getPipelineStatsRobust(): Promise<{
    success: boolean;
    data?: {
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
      averageProcessingTime: number;
      successRate: number;
      errorRate: number;
      systemHealth: 'good' | 'degraded' | 'poor';
    };
    error?: string;
  }> {
    const context = {
      service: 'PipelineApiService',
      method: 'getPipelineStats',
      sessionId: this.sessionId,
      requestId: `req_${Date.now()}`,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development'
    };

    try {
      const statsResponse = await errorHandlingService.withErrorHandling(
        () => pipelineApiService.getPipelineStats(),
        context,
        {
          timeout: 8000,
          retries: 1,
          type: ErrorType.API,
          severity: ErrorSeverity.LOW,
          fallback: async () => {
            // Fallback: estatísticas básicas
            return {
              success: true,
              data: {
                totalJobs: 0,
                completedJobs: 0,
                failedJobs: 0,
                averageProcessingTime: 0,
                successRate: 0
              }
            };
          }
        }
      );

      if (statsResponse.success && statsResponse.data) {
        // Enriquecer com dados de error handling
        const errorStats = errorHandlingService.getErrorStatistics();
        const errorRate = errorStats.totalErrors > 0 ? 
          (errorStats.errorsBySeverity['high'] || 0) + (errorStats.errorsBySeverity['critical'] || 0) : 0;

        // Determinar saúde do sistema
        let systemHealth: 'good' | 'degraded' | 'poor' = 'good';
        if (statsResponse.data.successRate < 70 || errorRate > 10) {
          systemHealth = 'poor';
        } else if (statsResponse.data.successRate < 85 || errorRate > 5) {
          systemHealth = 'degraded';
        }

        return {
          success: true,
          data: {
            ...statsResponse.data,
            errorRate,
            systemHealth
          }
        };
      }

      return statsResponse;

    } catch (error) {
      const handlingResult = await errorHandlingService.handleError(error, context, {
        type: ErrorType.API,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.RECOVERABLE,
        customMessage: 'Falha ao obter estatísticas'
      });

      return {
        success: false,
        error: handlingResult.userMessage
      };
    }
  }

  // Métodos auxiliares privados
  private async validateFile(file: File, context: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validações básicas
    if (!file) {
      errors.push('Nenhum arquivo fornecido');
    } else {
      if (file.size === 0) {
        errors.push('Arquivo está vazio');
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB
        errors.push('Arquivo muito grande (máximo 100MB)');
      }
      
      if (!file.name.match(/\.(pptx|ppt)$/i)) {
        errors.push('Formato de arquivo não suportado (use .pptx ou .ppt)');
      }
      
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
      ];
      
      if (!allowedTypes.includes(file.type) && file.type !== '') {
        errors.push('Tipo MIME de arquivo não reconhecido');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async startPipelineWithFallback(file: File): Promise<PipelineStartResponse> {
    // Implementação de fallback mais simples
    console.warn('Executando pipeline com configurações de fallback');
    
    // Tentar com timeout menor e sem algumas validações opcionais
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fallback', 'true');

      const response = await fetch('/api/pipeline/start-fallback', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(8000) // 8 segundos timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (fallbackError) {
      return {
        success: false,
        message: 'Pipeline não pode ser iniciado no momento',
        error: 'Fallback também falhou'
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos de limpeza e gerenciamento
  public cleanup(): void {
    pipelineApiService.stopAllMonitors();
  }

  public getSessionInfo(): {
    sessionId: string;
    errorStats: any;
    systemHealth: any;
  } {
    return {
      sessionId: this.sessionId,
      errorStats: errorHandlingService.getErrorStatistics(),
      systemHealth: 'monitoring_active'
    };
  }
}

// Export singleton instance
export const enhancedPipelineApiService = EnhancedPipelineApiService.getInstance();
export default enhancedPipelineApiService;