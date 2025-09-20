/**
 * Sistema de Retry Avançado para Pipeline PPTX→Vídeo
 * Implementa lógica de retry inteligente com backoff exponencial
 */

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

class PipelineRetryService {
  private defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
    retryCondition: (error) => this.isRetryableError(error),
    onRetry: (attempt, error) => {
    }
  };

  /**
   * Executa função com retry automático
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Não retry se não for erro recuperável
        if (!config.retryCondition!(error)) {
          throw error;
        }

        // Último attempt falhou
        if (attempt === config.maxRetries) {
          throw new Error(`Falhou após ${config.maxRetries} tentativas: ${error.message}`);
        }

        // Calcular delay para próximo retry
        const delay = this.calculateDelay(attempt, config);
        
        // Callback de retry
        config.onRetry?.(attempt + 1, error);

        // Aguardar antes do próximo retry
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Calcula delay com backoff exponencial
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    if (!options.exponentialBackoff) {
      return options.baseDelay;
    }

    const exponentialDelay = options.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const totalDelay = exponentialDelay + jitter;

    return Math.min(totalDelay, options.maxDelay);
  }

  /**
   * Determina se erro é recuperável
   */
  private isRetryableError(error: any): boolean {
    // Erros de rede são geralmente recuperáveis
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Status HTTP recuperáveis
    if (error.response?.status) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors e rate limiting
    }

    // Erros específicos do pipeline
    const retryableMessages = [
      'network timeout',
      'connection refused',
      'temporary failure',
      'service unavailable',
      'rate limit exceeded'
    ];

    const message = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => message.includes(msg));
  }

  /**
   * Helper para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry específico para upload de arquivos
   */
  async retryFileUpload<T>(
    uploadFn: () => Promise<T>,
    fileName: string
  ): Promise<T> {
    return this.executeWithRetry(uploadFn, {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 15000,
      onRetry: (attempt, error) => {
      }
    });
  }

  /**
   * Retry específico para processamento IA
   */
  async retryAIProcessing<T>(
    processFn: () => Promise<T>,
    stage: string
  ): Promise<T> {
    return this.executeWithRetry(processFn, {
      maxRetries: 3,
      baseDelay: 3000,
      maxDelay: 20000,
      retryCondition: (error) => {
        // IA pode ter rate limits específicos
        return this.isRetryableError(error) || 
               error.message?.includes('rate limit') ||
               error.message?.includes('quota exceeded');
      },
      onRetry: (attempt, error) => {
      }
    });
  }

  /**
   * Retry específico para geração de vídeo
   */
  async retryVideoGeneration<T>(
    generateFn: () => Promise<T>,
    videoId: string
  ): Promise<T> {
    return this.executeWithRetry(generateFn, {
      maxRetries: 4,
      baseDelay: 5000,
      maxDelay: 30000,
      onRetry: (attempt, error) => {
      }
    });
  }
}

/**
 * Sistema de Circuit Breaker para prevenir cascata de falhas
 */
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minuto
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`⚡ Circuit breaker OPEN after ${this.failures} failures`);
    }
  }

  getState() {
    return this.state;
  }
}

// Instâncias singleton
export const pipelineRetryService = new PipelineRetryService();
export const pipelineCircuitBreaker = new CircuitBreaker();

export type { RetryOptions };