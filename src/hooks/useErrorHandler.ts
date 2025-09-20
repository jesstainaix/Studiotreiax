import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Tipos de erro
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'validation' | 'authentication' | 'permission' | 'system' | 'user' | 'unknown';

export interface AppError {
  id: string;
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  retryable?: boolean;
  handled?: boolean;
}

export interface ErrorHandlerConfig {
  enableLogging?: boolean;
  enableToasts?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  reportToService?: boolean;
  serviceEndpoint?: string;
}

export interface ErrorHandlerState {
  errors: AppError[];
  isLoading: boolean;
  lastError: AppError | null;
  errorCount: number;
  retryCount: number;
}

export interface ErrorHandlerActions {
  handleError: (error: Error | AppError, context?: Record<string, any>) => void;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  retryLastAction: () => Promise<void>;
  reportError: (error: AppError) => Promise<void>;
  getErrorsByCategory: (category: ErrorCategory) => AppError[];
  getErrorsBySeverity: (severity: ErrorSeverity) => AppError[];
}

export interface ErrorHandlerReturn {
  state: ErrorHandlerState;
  actions: ErrorHandlerActions;
  config: ErrorHandlerConfig;
  updateConfig: (newConfig: Partial<ErrorHandlerConfig>) => void;
}

const defaultConfig: ErrorHandlerConfig = {
  enableLogging: true,
  enableToasts: true,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  reportToService: false,
  serviceEndpoint: '/api/errors',
};

// Função para categorizar erros automaticamente
const categorizeError = (error: Error): ErrorCategory => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'validation';
  }
  if (message.includes('unauthorized') || message.includes('authentication') || message.includes('login')) {
    return 'authentication';
  }
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
    return 'permission';
  }
  if (message.includes('system') || message.includes('internal') || message.includes('server')) {
    return 'system';
  }
  
  return 'unknown';
};

// Função para determinar severidade
const determineSeverity = (error: Error, category: ErrorCategory): ErrorSeverity => {
  if (category === 'system' || category === 'authentication') {
    return 'critical';
  }
  if (category === 'network' || category === 'permission') {
    return 'high';
  }
  if (category === 'validation') {
    return 'medium';
  }
  return 'low';
};

// Função para gerar ID único
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useErrorHandler = (initialConfig?: Partial<ErrorHandlerConfig>): ErrorHandlerReturn => {
  const [config, setConfig] = useState<ErrorHandlerConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [state, setState] = useState<ErrorHandlerState>({
    errors: [],
    isLoading: false,
    lastError: null,
    errorCount: 0,
    retryCount: 0,
  });

  const lastActionRef = useRef<(() => Promise<void>) | null>(null);
  const sessionId = useRef<string>(`session_${Date.now()}`);

  // Função para converter Error em AppError
  const convertToAppError = useCallback((error: Error | AppError, context?: Record<string, any>): AppError => {
    if ('id' in error && 'severity' in error) {
      return { ...error, context: { ...error.context, ...context } };
    }

    const category = categorizeError(error as Error);
    const severity = determineSeverity(error as Error, category);

    return {
      id: generateErrorId(),
      message: error.message,
      code: (error as any).code,
      severity,
      category,
      timestamp: new Date(),
      stack: error.stack,
      context,
      sessionId: sessionId.current,
      retryable: category === 'network' || category === 'system',
      handled: false,
    };
  }, []);

  // Função para reportar erro para serviço externo
  const reportError = useCallback(async (error: AppError): Promise<void> => {
    if (!config.reportToService || !config.serviceEndpoint) {
      return;
    }

    try {
      await fetch(config.serviceEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            ...error,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: error.timestamp.toISOString(),
          },
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }, [config.reportToService, config.serviceEndpoint]);

  // Função principal para tratar erros
  const handleError = useCallback((error: Error | AppError, context?: Record<string, any>) => {
    const appError = convertToAppError(error, context);

    setState(prev => ({
      ...prev,
      errors: [...prev.errors, appError],
      lastError: appError,
      errorCount: prev.errorCount + 1,
    }));

    // Log do erro
    if (config.enableLogging) {
      console.error(`[${appError.severity.toUpperCase()}] ${appError.category}:`, appError);
    }

    // Mostrar toast
    if (config.enableToasts) {
      const toastMessage = appError.message || 'Ocorreu um erro inesperado';
      
      switch (appError.severity) {
        case 'critical':
          toast.error(toastMessage, {
            duration: 10000,
            action: appError.retryable ? {
              label: 'Tentar novamente',
              onClick: () => retryLastAction(),
            } : undefined,
          });
          break;
        case 'high':
          toast.error(toastMessage, { duration: 5000 });
          break;
        case 'medium':
          toast.warning(toastMessage, { duration: 3000 });
          break;
        case 'low':
          toast.info(toastMessage, { duration: 2000 });
          break;
      }
    }

    // Reportar erro
    if (config.reportToService) {
      reportError(appError);
    }
  }, [convertToAppError, config, reportError]);

  // Função para limpar erro específico
  const clearError = useCallback((errorId: string) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.id !== errorId),
    }));
  }, []);

  // Função para limpar todos os erros
  const clearAllErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      lastError: null,
    }));
  }, []);

  // Função para tentar novamente a última ação
  const retryLastAction = useCallback(async (): Promise<void> => {
    if (!lastActionRef.current || !config.enableRetry) {
      return;
    }

    if (state.retryCount >= (config.maxRetries || 3)) {
      toast.error('Número máximo de tentativas excedido');
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
      await lastActionRef.current();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        retryCount: 0,
      }));
      
      toast.success('Ação executada com sucesso!');
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      handleError(error as Error, { isRetry: true });
    }
  }, [state.retryCount, config, handleError]);

  // Função para obter erros por categoria
  const getErrorsByCategory = useCallback((category: ErrorCategory): AppError[] => {
    return state.errors.filter(error => error.category === category);
  }, [state.errors]);

  // Função para obter erros por severidade
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity): AppError[] => {
    return state.errors.filter(error => error.severity === severity);
  }, [state.errors]);

  // Função para atualizar configuração
  const updateConfig = useCallback((newConfig: Partial<ErrorHandlerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Registrar ação para retry
  const registerAction = useCallback((action: () => Promise<void>) => {
    lastActionRef.current = action;
  }, []);

  // Limpar erros antigos automaticamente
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      setState(prev => ({
        ...prev,
        errors: prev.errors.filter(error => error.timestamp > oneHourAgo),
      }));
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    return () => clearInterval(interval);
  }, []);

  return {
    state,
    actions: {
      handleError,
      clearError,
      clearAllErrors,
      retryLastAction,
      reportError,
      getErrorsByCategory,
      getErrorsBySeverity,
    },
    config,
    updateConfig,
  };
};

// Hook para capturar erros globais
export const useGlobalErrorHandler = () => {
  const errorHandler = useErrorHandler();

  useEffect(() => {
    // Capturar erros JavaScript não tratados
    const handleUnhandledError = (event: ErrorEvent) => {
      errorHandler.actions.handleError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'unhandled_error',
      });
    };

    // Capturar promises rejeitadas não tratadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.actions.handleError(new Error(String(event.reason)), {
        type: 'unhandled_rejection',
      });
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [errorHandler]);

  return errorHandler;
};

export default useErrorHandler;