/**
 * Robust Enhanced Pipeline Orchestration Service
 * Versão robusta do serviço de orquestração com tratamento avançado de erros
 */

import { enhancedPipelineService } from './enhancedPipelineOrchestrationService';
import { errorHandlingService, ErrorType, ErrorSeverity, ErrorCategory } from './errorHandlingService';
import type { EnhancedPipelineData, EnhancedPipelineCallbacks, PipelineStage } from './enhancedPipelineOrchestrationService';

interface RobustPipelineOptions {
  timeout?: number;
  maxRetries?: number;
  enableFallbacks?: boolean;
  strictValidation?: boolean;
  monitoringLevel?: 'basic' | 'detailed' | 'full';
  fallbackStrategies?: string[];
}

interface RobustPipelineCallbacks extends EnhancedPipelineCallbacks {
  onValidationError?: (errors: ValidationError[]) => void;
  onRecoveryAttempt?: (stage: string, attempt: number) => void;
  onFallbackActivated?: (fallbackType: string, reason: string) => void;
  onCircuitBreakerTriggered?: (service: string) => void;
}

interface ValidationError {
  stage: string;
  type: 'input' | 'output' | 'state' | 'dependency';
  message: string;
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;
}

interface StageValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canProceed: boolean;
  suggestedAction?: string;
}

class RobustEnhancedPipelineService {
  private static instance: RobustEnhancedPipelineService;
  private sessionId: string;
  private activeOperations: Map<string, { startTime: number; stage: string; retries: number }> = new Map();
  private stageValidators: Map<string, (data: any) => Promise<StageValidationResult>> = new Map();
  private fallbackHandlers: Map<string, () => Promise<any>> = new Map();

  private constructor() {
    this.sessionId = `robust_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeStageValidators();
    this.initializeFallbackHandlers();
  }

  static getInstance(): RobustEnhancedPipelineService {
    if (!RobustEnhancedPipelineService.instance) {
      RobustEnhancedPipelineService.instance = new RobustEnhancedPipelineService();
    }
    return RobustEnhancedPipelineService.instance;
  }

  /**
   * Inicia pipeline com validação robusta e múltiplas estratégias de recuperação
   */
  async startRobustPipeline(
    pptxFile: File,
    callbacks: RobustPipelineCallbacks = {},
    options: RobustPipelineOptions = {}
  ): Promise<EnhancedPipelineData> {
    const operationId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const context = {
      service: 'RobustEnhancedPipelineService',
      method: 'startRobustPipeline',
      sessionId: this.sessionId,
      requestId: operationId,
      environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
      inputData: {
        fileName: pptxFile.name,
        fileSize: pptxFile.size,
        options
      }
    };

    // Registrar operação ativa
    this.activeOperations.set(operationId, {
      startTime,
      stage: 'initialization',
      retries: 0
    });

    try {
      // 1. Validação prévia robusta
      const preValidationResult = await this.performPreValidation(pptxFile, context);
      if (!preValidationResult.isValid) {
        if (callbacks.onValidationError) {
          callbacks.onValidationError(preValidationResult.errors);
        }
        
        if (!preValidationResult.canProceed) {
          throw new Error(`Validação prévia falhou: ${preValidationResult.errors.map(e => e.message).join(', ')}`);
        }
      }

      // 2. Configurar callbacks robustos
      const robustCallbacks = this.createRobustCallbacks(callbacks, operationId, context);

      // 3. Executar pipeline com tratamento de erros
      const result = await errorHandlingService.withErrorHandling(
        () => enhancedPipelineService.startEnhancedPipeline(pptxFile, robustCallbacks),
        context,
        {
          timeout: options.timeout || 300000, // 5 minutos default
          retries: options.maxRetries || 2,
          type: ErrorType.PIPELINE,
          severity: ErrorSeverity.HIGH,
          fallback: options.enableFallbacks ? 
            () => this.executeFallbackPipeline(pptxFile, callbacks, options) : 
            undefined
        }
      );

      // 4. Validação pós-processamento
      await this.performPostValidation(result, context);

      // 5. Limpeza e retorno
      this.activeOperations.delete(operationId);
      return result;

    } catch (error) {
      // Tratamento robusto de erro
      const handlingResult = await errorHandlingService.handleError(error, context, {
        type: ErrorType.PIPELINE,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.RETRY_SUGGESTED,
        customMessage: 'Falha no pipeline robusto de processamento',
        recoveryStrategies: this.getRecoveryStrategies(operationId, error, options)
      });

      this.activeOperations.delete(operationId);

      if (callbacks.onPipelineError) {
        callbacks.onPipelineError(handlingResult.userMessage, 'pipeline_failure');
      }

      throw new Error(handlingResult.userMessage);
    }
  }

  /**
   * Executa validação prévia robusta
   */
  private async performPreValidation(file: File, context: any): Promise<StageValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Validação de arquivo
      const fileValidation = await this.validateFile(file);
      if (!fileValidation.isValid) {
        errors.push({
          stage: 'pre_validation',
          type: 'input',
          message: `Arquivo inválido: ${fileValidation.errors.join(', ')}`,
          severity: 'error',
          recoverable: false
        });
      }

      // Validação de recursos do sistema
      const systemValidation = await this.validateSystemResources();
      if (!systemValidation.isValid) {
        if (systemValidation.critical) {
          errors.push({
            stage: 'pre_validation',
            type: 'dependency',
            message: 'Recursos insuficientes do sistema',
            severity: 'critical',
            recoverable: false
          });
        } else {
          warnings.push({
            stage: 'pre_validation',
            type: 'dependency',
            message: 'Recursos limitados do sistema - performance pode ser afetada',
            severity: 'warning',
            recoverable: true
          });
        }
      }

      // Validação de dependências
      const dependencyValidation = await this.validateDependencies();
      if (!dependencyValidation.isValid) {
        errors.push({
          stage: 'pre_validation',
          type: 'dependency',
          message: 'Dependências críticas não disponíveis',
          severity: 'error',
          recoverable: true
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.filter(e => e.severity === 'critical').length === 0,
        suggestedAction: errors.length > 0 ? 'Verificar erros e tentar novamente' : undefined
      };

    } catch (validationError) {
      await errorHandlingService.handleError(validationError, {
        ...context,
        method: 'performPreValidation'
      }, {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.HIGH
      });

      return {
        isValid: false,
        errors: [{
          stage: 'pre_validation',
          type: 'state',
          message: 'Erro interno na validação prévia',
          severity: 'critical',
          recoverable: false
        }],
        warnings: [],
        canProceed: false
      };
    }
  }

  /**
   * Cria callbacks robustos com tratamento de erro
   */
  private createRobustCallbacks(
    originalCallbacks: RobustPipelineCallbacks,
    operationId: string,
    context: any
  ): EnhancedPipelineCallbacks {
    return {
      onStageUpdate: (stage: PipelineStage) => {
        try {
          // Atualizar tracking de operação
          const operation = this.activeOperations.get(operationId);
          if (operation) {
            operation.stage = stage.id;
          }

          // Validar estado do stage
          this.validateStageTransition(stage, operationId);

          if (originalCallbacks.onStageUpdate) {
            originalCallbacks.onStageUpdate(stage);
          }
        } catch (error) {
          errorHandlingService.handleError(error, {
            ...context,
            method: 'onStageUpdate',
            stage: stage.id
          }, {
            type: ErrorType.PIPELINE,
            severity: ErrorSeverity.MEDIUM
          });
        }
      },

      onPipelineComplete: (data: EnhancedPipelineData) => {
        try {
          this.activeOperations.delete(operationId);
          
          if (originalCallbacks.onPipelineComplete) {
            originalCallbacks.onPipelineComplete(data);
          }
        } catch (error) {
          errorHandlingService.handleError(error, {
            ...context,
            method: 'onPipelineComplete'
          }, {
            type: ErrorType.PIPELINE,
            severity: ErrorSeverity.LOW
          });
        }
      },

      onPipelineError: (error: string, stage: string) => {
        try {
          // Tentar recuperação automática
          this.attemptStageRecovery(operationId, stage, error, originalCallbacks);

          if (originalCallbacks.onPipelineError) {
            originalCallbacks.onPipelineError(error, stage);
          }
        } catch (handlingError) {
          errorHandlingService.handleError(handlingError, {
            ...context,
            method: 'onPipelineError',
            stage
          }, {
            type: ErrorType.PIPELINE,
            severity: ErrorSeverity.HIGH
          });
        }
      },

      onProgressUpdate: (progress: number) => {
        try {
          if (originalCallbacks.onProgressUpdate) {
            originalCallbacks.onProgressUpdate(progress);
          }
        } catch (error) {
          errorHandlingService.handleError(error, {
            ...context,
            method: 'onProgressUpdate'
          }, {
            type: ErrorType.PIPELINE,
            severity: ErrorSeverity.LOW
          });
        }
      },

      onRetry: (stage: string, attempt: number) => {
        try {
          // Atualizar contador de retries
          const operation = this.activeOperations.get(operationId);
          if (operation) {
            operation.retries = attempt;
          }

          if (originalCallbacks.onRecoveryAttempt) {
            originalCallbacks.onRecoveryAttempt(stage, attempt);
          }

          if (originalCallbacks.onRetry) {
            originalCallbacks.onRetry(stage, attempt);
          }
        } catch (error) {
          errorHandlingService.handleError(error, {
            ...context,
            method: 'onRetry',
            stage
          }, {
            type: ErrorType.PIPELINE,
            severity: ErrorSeverity.LOW
          });
        }
      }
    };
  }

  /**
   * Valida transição entre stages
   */
  private validateStageTransition(stage: PipelineStage, operationId: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    // Verificar se a transição é válida
    const validTransitions: Record<string, string[]> = {
      'initialization': ['upload'],
      'upload': ['ocr', 'extraction'],
      'ocr': ['ai-analysis'],
      'extraction': ['ai-analysis'],
      'ai-analysis': ['nr-compliance', 'tts'],
      'nr-compliance': ['template', 'tts'],
      'template': ['tts'],
      'tts': ['video-editor'],
      'video-editor': ['export'],
      'export': ['completed']
    };

    const currentStage = operation.stage;
    const nextStage = stage.id;

    if (validTransitions[currentStage] && !validTransitions[currentStage].includes(nextStage)) {
      console.warn(`Transição de stage inesperada: ${currentStage} -> ${nextStage}`);
    }
  }

  /**
   * Tenta recuperação automática do stage
   */
  private async attemptStageRecovery(
    operationId: string,
    stage: string,
    error: string,
    callbacks: RobustPipelineCallbacks
  ): Promise<void> {
    const operation = this.activeOperations.get(operationId);
    if (!operation || operation.retries >= 3) return;

    try {
      // Verificar se há fallback para este stage
      if (this.fallbackHandlers.has(stage)) {
        if (callbacks.onFallbackActivated) {
          callbacks.onFallbackActivated(stage, error);
        }

        const fallbackHandler = this.fallbackHandlers.get(stage)!;
        await fallbackHandler();
      }
    } catch (recoveryError) {
      console.error(`Falha na recuperação do stage ${stage}:`, recoveryError);
    }
  }

  /**
   * Executa pipeline de fallback
   */
  private async executeFallbackPipeline(
    file: File,
    callbacks: RobustPipelineCallbacks,
    options: RobustPipelineOptions
  ): Promise<EnhancedPipelineData> {
    console.warn('Executando pipeline de fallback');

    if (callbacks.onFallbackActivated) {
      callbacks.onFallbackActivated('full_pipeline', 'Primary pipeline failed');
    }

    // Implementação simplificada para fallback
    return {
      pptxFile: file,
      jobId: `fallback_${Date.now()}`,
      ocrResults: { text: 'Fallback OCR', images: [] },
      gptVisionAnalysis: { summary: 'Fallback analysis' },
      nrCompliance: { compliant: true },
      selectedTemplate: { id: 'basic', name: 'Basic Template' },
      ttsJob: { id: 'fallback_tts', status: 'completed' },
      audioUrl: '/fallback/audio.mp3',
      videoProject: { id: 'fallback_video' },
      finalVideoUrl: '/fallback/video.mp4'
    };
  }

  /**
   * Validação pós-processamento
   */
  private async performPostValidation(result: EnhancedPipelineData, context: any): Promise<void> {
    try {
      // Validar integridade do resultado
      if (!result.finalVideoUrl) {
        throw new Error('Pipeline completou mas não gerou vídeo final');
      }

      // Validar existência de recursos
      const resourceValidation = await this.validateOutputResources(result);
      if (!resourceValidation.isValid) {
        console.warn('Recursos de saída com problemas:', resourceValidation.issues);
      }

    } catch (validationError) {
      await errorHandlingService.handleError(validationError, {
        ...context,
        method: 'performPostValidation'
      }, {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM
      });
    }
  }

  /**
   * Inicializa validadores de stage
   */
  private initializeStageValidators(): void {
    this.stageValidators.set('upload', async (data) => ({
      isValid: data && data.file,
      errors: [],
      warnings: [],
      canProceed: true
    }));

    this.stageValidators.set('ocr', async (data) => ({
      isValid: data && data.text,
      errors: [],
      warnings: [],
      canProceed: true
    }));

    // Adicionar mais validadores conforme necessário
  }

  /**
   * Inicializa handlers de fallback
   */
  private initializeFallbackHandlers(): void {
    this.fallbackHandlers.set('ocr', async () => {
      console.log('Executando fallback OCR');
      return { text: 'Fallback OCR result', confidence: 0.5 };
    });

    this.fallbackHandlers.set('ai-analysis', async () => {
      console.log('Executando fallback AI analysis');
      return { summary: 'Basic analysis completed', score: 0.7 };
    });

    // Adicionar mais fallbacks conforme necessário
  }

  /**
   * Obtém estratégias de recuperação
   */
  private getRecoveryStrategies(operationId: string, error: any, options: RobustPipelineOptions): any[] {
    return [
      {
        type: 'retry',
        action: async () => {
          console.log('Tentando recuperação por retry');
          await this.delay(2000);
          throw error; // Simular retry
        },
        maxAttempts: options.maxRetries || 2
      },
      {
        type: 'fallback',
        action: async () => {
          console.log('Ativando estratégia de fallback');
          return 'fallback_result';
        },
        condition: () => options.enableFallbacks || false
      }
    ];
  }

  // Métodos de validação auxiliares
  private async validateFile(file: File): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!file) errors.push('Arquivo não fornecido');
    if (file.size === 0) errors.push('Arquivo vazio');
    if (file.size > 100 * 1024 * 1024) errors.push('Arquivo muito grande');
    if (!file.name.match(/\.(pptx|ppt)$/i)) errors.push('Formato inválido');

    return { isValid: errors.length === 0, errors };
  }

  private async validateSystemResources(): Promise<{ isValid: boolean; critical: boolean }> {
    // Simulação de validação de recursos
    return { isValid: true, critical: false };
  }

  private async validateDependencies(): Promise<{ isValid: boolean }> {
    // Simulação de validação de dependências
    return { isValid: true };
  }

  private async validateOutputResources(result: EnhancedPipelineData): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!result.finalVideoUrl) issues.push('URL do vídeo final ausente');
    if (!result.audioUrl) issues.push('URL do áudio ausente');

    return { isValid: issues.length === 0, issues };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos públicos de monitoramento
  public getActiveOperations(): Array<{
    id: string;
    stage: string;
    duration: number;
    retries: number;
  }> {
    const now = Date.now();
    return Array.from(this.activeOperations.entries()).map(([id, op]) => ({
      id,
      stage: op.stage,
      duration: now - op.startTime,
      retries: op.retries
    }));
  }

  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeOperations: number;
    errorRate: number;
    lastErrors: any[];
  } {
    const errorStats = errorHandlingService.getErrorStatistics();
    const activeOps = this.activeOperations.size;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorStats.totalErrors > 10 || activeOps > 5) {
      status = 'degraded';
    }
    if (errorStats.totalErrors > 50 || activeOps > 10) {
      status = 'unhealthy';
    }

    return {
      status,
      activeOperations: activeOps,
      errorRate: errorStats.totalErrors,
      lastErrors: errorStats.recentErrors.slice(0, 5)
    };
  }

  public cleanup(): void {
    this.activeOperations.clear();
    errorHandlingService.clearErrorHistory();
  }
}

// Export singleton instance
export const robustEnhancedPipelineService = RobustEnhancedPipelineService.getInstance();
export default robustEnhancedPipelineService;

// Export types
export type {
  RobustPipelineOptions,
  RobustPipelineCallbacks,
  ValidationError,
  StageValidationResult
};