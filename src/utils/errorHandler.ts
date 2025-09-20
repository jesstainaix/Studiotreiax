import { toast } from 'sonner';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableToasts: boolean;
  enableReporting: boolean;
  fallbackMessage: string;
  retryConfig: RetryConfig;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'runtime' | 'ai' | 'unknown';
}

class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableToasts: true,
      enableReporting: true,
      fallbackMessage: 'Algo deu errado. Tente novamente.',
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryCondition: (error) => {
          // Retry on network errors, timeouts, and 5xx status codes
          return (
            error.name === 'NetworkError' ||
            error.name === 'TimeoutError' ||
            (error as any).status >= 500
          );
        },
      },
      ...config,
    };

    this.setupGlobalHandlers();
    this.setupNetworkMonitoring();
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        component: 'Global',
        action: 'unhandledrejection',
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'javascript_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public async handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: ErrorReport['severity'] = 'medium'
  ): Promise<void> {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    const errorReport: ErrorReport = {
      error,
      context: fullContext,
      severity,
      category: this.categorizeError(error),
    };

    if (this.config.enableLogging) {
      this.logError(errorReport);
    }

    if (this.config.enableToasts) {
      this.showErrorToast(errorReport);
    }

    if (this.config.enableReporting) {
      await this.reportError(errorReport);
    }
  }

  public async withRetry<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.config.retryConfig, ...customRetryConfig };
    let lastError: Error;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if we should retry
        if (
          attempt > retryConfig.maxRetries ||
          !retryConfig.retryCondition?.(lastError)
        ) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
          retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
      }
    }

    // All retries failed, handle the error
    await this.handleError(lastError!, context, 'high');
    throw lastError!;
  }

  public async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      await this.handleError(error as Error, {
        ...context,
        action: 'primary_operation_failed',
      });

      try {
        return await fallback();
      } catch (fallbackError) {
        await this.handleError(fallbackError as Error, {
          ...context,
          action: 'fallback_operation_failed',
        });
        throw fallbackError;
      }
    }
  }

  private categorizeError(error: Error): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('ai') || message.includes('model')) {
      return 'ai';
    }
    if (name.includes('type') || name.includes('reference')) {
      return 'runtime';
    }

    return 'unknown';
  }

  private logError(errorReport: ErrorReport) {
  const { error, severity, category } = errorReport;
    
    console.group(`[ErrorHandler] ${severity.toUpperCase()} - ${category}`);
    console.error('[ErrorHandler] Detalhes:', error);
    console.groupEnd();
  }

  private showErrorToast(errorReport: ErrorReport) {
    const { error, severity } = errorReport;
    
    const message = this.getUserFriendlyMessage(error);
    
    switch (severity) {
      case 'critical':
        toast.error(message, {
          duration: 10000,
          action: {
            label: 'Reportar',
            onClick: () => this.openErrorReport(errorReport),
          },
        });
        break;
      case 'high':
        toast.error(message, { duration: 5000 });
        break;
      case 'medium':
        toast.warning(message, { duration: 3000 });
        break;
      case 'low':
        toast.info(message, { duration: 2000 });
        break;
    }
  }

  private getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Problema de conexão. Verifique sua conexão com a internet.';
    }
    if (message.includes('timeout')) {
      return 'A operação excedeu o tempo limite. Tente novamente.';
    }
    if (message.includes('validation')) {
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    }
    
    return this.config.fallbackMessage;
  }

  private async reportError(errorReport: ErrorReport) {
    if (!this.isOnline) {
      this.errorQueue.push(errorReport);
      return;
    }

    try {
      // Send to error reporting service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorReport,
          error: {
            name: errorReport.error.name,
            message: errorReport.error.message,
            stack: errorReport.error.stack,
          },
        }),
      });
    } catch (reportingError) {
      // If reporting fails, queue the error for later
      this.errorQueue.push(errorReport);
    }
  }

  private async processErrorQueue() {
    if (!this.isOnline || this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const errorReport of errors) {
      try {
        await this.reportError(errorReport);
      } catch {
        // If still failing, put back in queue
        this.errorQueue.push(errorReport);
      }
    }
  }

  private openErrorReport(_errorReport: ErrorReport) {
    // Open a modal or page for detailed error reporting
  }

  public updateConfig(newConfig: Partial<ErrorHandlerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getErrorStats() {
    return {
      queuedErrors: this.errorQueue.length,
      isOnline: this.isOnline,
    };
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export const handleError = errorHandler.handleError.bind(errorHandler);
export const withRetry = errorHandler.withRetry.bind(errorHandler);
export const withFallback = errorHandler.withFallback.bind(errorHandler);

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError,
    withRetry,
    withFallback,
    updateConfig: errorHandler.updateConfig.bind(errorHandler),
    getStats: errorHandler.getErrorStats.bind(errorHandler),
  };
};

export default errorHandler;