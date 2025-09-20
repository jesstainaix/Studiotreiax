// Hook React para sistema de logs estruturados
import { useEffect, useCallback, useRef, useState } from 'react';
import { logger, LogLevel, LogCategory, LogEntry, AlertRule, measurePerformance } from '../utils/logger';

export interface UseLoggerOptions {
  category?: LogCategory;
  userId?: string;
  autoLogMount?: boolean;
  autoLogUnmount?: boolean;
  trackPerformance?: boolean;
  componentName?: string;
}

export interface LoggerHookReturn {
  // Métodos de log básicos
  log: (level: LogLevel, message: string, data?: any) => LogEntry;
  trace: (message: string, data?: any) => LogEntry;
  debug: (message: string, data?: any) => LogEntry;
  info: (message: string, data?: any) => LogEntry;
  warn: (message: string, data?: any) => LogEntry;
  error: (message: string, data?: any) => LogEntry;
  fatal: (message: string, data?: any) => LogEntry;
  
  // Métodos específicos
  logUserAction: (action: string, data?: any) => LogEntry;
  logPerformance: (metric: string, data?: any) => LogEntry;
  logApiCall: (endpoint: string, data?: any) => LogEntry;
  logBusinessEvent: (event: string, data?: any) => LogEntry;
  
  // Medição de performance
  startMeasure: (name: string) => () => number;
  measureRender: () => void;
  
  // Gerenciamento de logs
  getLogs: (filters?: any) => LogEntry[];
  clearLogs: () => void;
  getStats: () => any;
  
  // Estado do logger
  isLogging: boolean;
  logCount: number;
  errorCount: number;
  lastError?: LogEntry;
}

export const useLogger = (options: UseLoggerOptions = {}): LoggerHookReturn => {
  const {
    category = 'user',
    userId,
    autoLogMount = false,
    autoLogUnmount = false,
    trackPerformance = false,
    componentName
  } = options;

  const [isLogging, setIsLogging] = useState(true);
  const [logCount, setLogCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<LogEntry | undefined>();
  
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const performanceMeasuresRef = useRef<Map<string, number>>(new Map());
  const componentNameRef = useRef(componentName || 'UnknownComponent');

  // Atualizar contadores quando logs mudam
  useEffect(() => {
    const updateStats = () => {
      const stats = logger.getStats();
      setLogCount(stats.total);
      setErrorCount((stats.byLevel.error || 0) + (stats.byLevel.fatal || 0));
      
      // Buscar último erro
      const logs = logger.getLogs({ level: 'error' });
      if (logs.length > 0) {
        setLastError(logs[0]);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Atualizar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Log de montagem do componente
  useEffect(() => {
    if (autoLogMount) {
      logger.log('debug', category, `Component mounted: ${componentNameRef.current}`, {
        mountTime: mountTimeRef.current,
        userId
      });
    }

    // Log de desmontagem
    return () => {
      if (autoLogUnmount) {
        const lifeTime = Date.now() - mountTimeRef.current;
        logger.log('debug', category, `Component unmounted: ${componentNameRef.current}`, {
          lifeTime,
          renderCount: renderCountRef.current,
          userId
        });
      }
    };
  }, [autoLogMount, autoLogUnmount, category, userId]);

  // Tracking de performance de renderização
  useEffect(() => {
    if (trackPerformance) {
      renderCountRef.current += 1;
      
      if (renderCountRef.current > 1) { // Não contar o primeiro render
        logger.performance(`Component render: ${componentNameRef.current}`, {
          renderCount: renderCountRef.current,
          componentLifetime: Date.now() - mountTimeRef.current
        });
      }
    }
  });

  // Métodos de log básicos
  const log = useCallback((level: LogLevel, message: string, data?: any): LogEntry => {
    if (!isLogging) return {} as LogEntry;
    
    return logger.log(level, category, message, {
      component: componentNameRef.current,
      ...data
    }, userId);
  }, [isLogging, category, userId]);

  const trace = useCallback((message: string, data?: any) => {
    return log('trace', message, data);
  }, [log]);

  const debug = useCallback((message: string, data?: any) => {
    return log('debug', message, data);
  }, [log]);

  const info = useCallback((message: string, data?: any) => {
    return log('info', message, data);
  }, [log]);

  const warn = useCallback((message: string, data?: any) => {
    return log('warn', message, data);
  }, [log]);

  const error = useCallback((message: string, data?: any) => {
    return log('error', message, data);
  }, [log]);

  const fatal = useCallback((message: string, data?: any) => {
    return log('fatal', message, data);
  }, [log]);

  // Métodos específicos
  const logUserAction = useCallback((action: string, data?: any) => {
    return logger.userAction(`${componentNameRef.current}: ${action}`, {
      component: componentNameRef.current,
      ...data
    }, userId);
  }, [userId]);

  const logPerformance = useCallback((metric: string, data?: any) => {
    return logger.performance(`${componentNameRef.current}: ${metric}`, {
      component: componentNameRef.current,
      ...data
    }, userId);
  }, [userId]);

  const logApiCall = useCallback((endpoint: string, data?: any) => {
    return logger.apiCall(`API call from ${componentNameRef.current}: ${endpoint}`, {
      component: componentNameRef.current,
      endpoint,
      ...data
    }, userId);
  }, [userId]);

  const logBusinessEvent = useCallback((event: string, data?: any) => {
    return logger.business(`Business event from ${componentNameRef.current}: ${event}`, {
      component: componentNameRef.current,
      ...data
    }, userId);
  }, [userId]);

  // Medição de performance
  const startMeasure = useCallback((name: string) => {
    const fullName = `${componentNameRef.current}.${name}`;
    const measure = measurePerformance(fullName);
    
    return () => {
      const duration = measure.end();
      logPerformance(`Measure completed: ${name}`, {
        measureName: name,
        duration
      });
      return duration;
    };
  }, [logPerformance]);

  const measureRender = useCallback(() => {
    if (trackPerformance) {
      const renderStart = performance.now();
      
      // Usar requestAnimationFrame para medir após o render
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        logPerformance('Render time', {
          renderTime,
          renderCount: renderCountRef.current
        });
      });
    }
  }, [trackPerformance, logPerformance]);

  // Gerenciamento de logs
  const getLogs = useCallback((filters?: any) => {
    return logger.getLogs({
      ...filters,
      userId: filters?.userId || userId
    });
  }, [userId]);

  const clearLogs = useCallback(() => {
    logger.clearLogs();
    setLogCount(0);
    setErrorCount(0);
    setLastError(undefined);
  }, []);

  const getStats = useCallback(() => {
    return logger.getStats();
  }, []);

  return {
    // Métodos básicos
    log,
    trace,
    debug,
    info,
    warn,
    error,
    fatal,
    
    // Métodos específicos
    logUserAction,
    logPerformance,
    logApiCall,
    logBusinessEvent,
    
    // Performance
    startMeasure,
    measureRender,
    
    // Gerenciamento
    getLogs,
    clearLogs,
    getStats,
    
    // Estado
    isLogging,
    logCount,
    errorCount,
    lastError
  };
};

// Hook para monitoramento de erros React
export const useErrorLogger = (componentName?: string) => {
  const { error, logUserAction } = useLogger({ 
    category: 'system',
    componentName,
    autoLogMount: true,
    autoLogUnmount: true
  });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      error('Uncaught JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [error]);

  const logError = useCallback((errorObj: Error, context?: any) => {
    error('Component Error', {
      message: errorObj.message,
      stack: errorObj.stack,
      context
    });
  }, [error]);

  const logUserError = useCallback((action: string, errorObj: Error) => {
    logUserAction(`Error during ${action}`, {
      error: errorObj.message,
      stack: errorObj.stack
    });
  }, [logUserAction]);

  return {
    logError,
    logUserError
  };
};

// Hook para logging de performance de componentes
export const usePerformanceLogger = (componentName: string) => {
  const { logPerformance, startMeasure } = useLogger({
    category: 'performance',
    componentName,
    trackPerformance: true
  });

  const [renderTimes, setRenderTimes] = useState<number[]>([]);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    
    setRenderTimes(prev => {
      const newTimes = [...prev, renderTime].slice(-10); // Manter últimos 10
      
      const avgRenderTime = newTimes.reduce((sum, time) => sum + time, 0) / newTimes.length;
      
      if (avgRenderTime > 16) { // Mais que 1 frame (60fps)
        logPerformance('Slow render detected', {
          renderTime,
          averageRenderTime: avgRenderTime,
          renderCount: newTimes.length
        });
      }
      
      return newTimes;
    });
  });

  const measureAsync = useCallback(async <T>(name: string, asyncFn: () => Promise<T>): Promise<T> => {
    const endMeasure = startMeasure(name);
    
    try {
      const result = await asyncFn();
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }, [startMeasure]);

  const measureSync = useCallback(<T>(name: string, syncFn: () => T): T => {
    const endMeasure = startMeasure(name);
    
    try {
      const result = syncFn();
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }, [startMeasure]);

  return {
    measureAsync,
    measureSync,
    renderTimes,
    averageRenderTime: renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0
  };
};

export default useLogger;