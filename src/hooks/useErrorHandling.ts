import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  type: ErrorType;
  severity: ErrorSeverity;
  source: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  resolved: boolean;
  retryCount: number;
  tags: string[];
}

export interface ErrorPattern {
  id: string;
  name: string;
  pattern: RegExp;
  type: ErrorType;
  severity: ErrorSeverity;
  autoResolve: boolean;
  retryStrategy?: RetryStrategy;
  notification: boolean;
  enabled: boolean;
}

export interface RetryStrategy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
  retryCondition?: (error: Error) => boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  errorRate: number;
  averageResolutionTime: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  errorsBySource: Array<{ source: string; count: number }>;
  errorTrends: Array<{ timestamp: Date; count: number }>;
  criticalErrors: number;
  warningErrors: number;
  infoErrors: number;
}

export interface ErrorHandlingConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableRetry: boolean;
  enableNotifications: boolean;
  maxErrorsInMemory: number;
  reportingEndpoint?: string;
  reportingApiKey?: string;
  defaultRetryStrategy: RetryStrategy;
  notificationThreshold: number;
  autoResolveTimeout: number;
  enableSourceMaps: boolean;
  enableUserContext: boolean;
  enablePerformanceTracking: boolean;
  enableOfflineQueue: boolean;
}

export interface ErrorHandlingState {
  errors: ErrorInfo[];
  patterns: ErrorPattern[];
  metrics: ErrorMetrics;
  isInitialized: boolean;
  isReporting: boolean;
  lastError?: ErrorInfo;
  errorQueue: ErrorInfo[];
  retryQueue: Array<{ error: ErrorInfo; attempt: number; nextRetry: Date }>;
}

export type ErrorType = 
  | 'javascript'
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business'
  | 'system'
  | 'performance'
  | 'security'
  | 'unknown';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ErrorAction = 
  | 'ignore'
  | 'log'
  | 'notify'
  | 'retry'
  | 'report'
  | 'escalate'
  | 'recover';

// Error Handling Engine
class ErrorHandlingEngine {
  private config: ErrorHandlingConfig;
  private state: ErrorHandlingState;
  private listeners: Set<(state: ErrorHandlingState) => void> = new Set();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private reportingQueue: ErrorInfo[] = [];
  private isReportingActive = false;
  private sessionId: string;
  private performanceObserver?: PerformanceObserver;

  constructor(config: ErrorHandlingConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.state = {
      errors: [],
      patterns: this.getDefaultPatterns(),
      metrics: this.initializeMetrics(),
      isInitialized: false,
      isReporting: false,
      errorQueue: [],
      retryQueue: []
    };

    this.initialize();
  }

  private initialize(): void {
    // Global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
      
      // Performance monitoring
      if (this.config.enablePerformanceTracking && 'PerformanceObserver' in window) {
        this.setupPerformanceMonitoring();
      }
    }

    // Start retry processor
    this.startRetryProcessor();
    
    // Start reporting processor
    if (this.config.enableReporting) {
      this.startReportingProcessor();
    }

    this.state.isInitialized = true;
    this.notifyListeners();
  }

  private setupPerformanceMonitoring(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            // Check for performance issues
            if (entry.duration > 5000) { // 5 seconds threshold
              this.captureError(new Error(`Slow ${entry.entryType}: ${entry.name}`), {
                type: 'performance',
                severity: 'medium',
                source: 'performance-monitor',
                context: {
                  entryType: entry.entryType,
                  name: entry.name,
                  duration: entry.duration,
                  startTime: entry.startTime
                }
              });
            }
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private handleGlobalError(event: ErrorEvent): void {
    this.captureError(new Error(event.message), {
      type: 'javascript',
      severity: 'high',
      source: 'global-error-handler',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.captureError(error, {
      type: 'javascript',
      severity: 'high',
      source: 'unhandled-rejection',
      context: {
        reason: event.reason
      }
    });
  }

  public captureError(
    error: Error,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      source?: string;
      context?: Record<string, any>;
      tags?: string[];
    } = {}
  ): string {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      type: options.type || this.detectErrorType(error),
      severity: options.severity || this.detectErrorSeverity(error),
      source: options.source || 'manual',
      timestamp: new Date(),
      context: options.context,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      resolved: false,
      retryCount: 0,
      tags: options.tags || []
    };

    // Apply error patterns
    this.applyErrorPatterns(errorInfo);

    // Add to state
    this.addError(errorInfo);

    // Handle based on severity and configuration
    this.processError(errorInfo);

    return errorInfo.id;
  }

  private detectErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return 'network';
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('permission') || message.includes('access denied')) {
      return 'authorization';
    }
    if (message.includes('security') || message.includes('xss') || message.includes('csrf')) {
      return 'security';
    }
    if (stack.includes('performance') || message.includes('timeout')) {
      return 'performance';
    }

    return 'javascript';
  }

  private detectErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('crash')) {
      return 'critical';
    }
    if (message.includes('error') || message.includes('failed') || message.includes('exception')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium';
    }
    if (message.includes('info') || message.includes('notice')) {
      return 'info';
    }

    return 'medium';
  }

  private applyErrorPatterns(errorInfo: ErrorInfo): void {
    for (const pattern of this.state.patterns) {
      if (!pattern.enabled) continue;

      if (pattern.pattern.test(errorInfo.message)) {
        errorInfo.type = pattern.type;
        errorInfo.severity = pattern.severity;
        errorInfo.tags.push(`pattern:${pattern.name}`);

        if (pattern.autoResolve) {
          setTimeout(() => {
            this.resolveError(errorInfo.id);
          }, this.config.autoResolveTimeout);
        }

        break;
      }
    }
  }

  private addError(errorInfo: ErrorInfo): void {
    this.state.errors.unshift(errorInfo);
    
    // Limit memory usage
    if (this.state.errors.length > this.config.maxErrorsInMemory) {
      this.state.errors = this.state.errors.slice(0, this.config.maxErrorsInMemory);
    }

    this.state.lastError = errorInfo;
    this.updateMetrics();
    this.notifyListeners();
  }

  private processError(errorInfo: ErrorInfo): void {
    // Logging
    if (this.config.enableLogging) {
      this.logError(errorInfo);
    }

    // Notifications
    if (this.config.enableNotifications && this.shouldNotify(errorInfo)) {
      this.notifyError(errorInfo);
    }

    // Retry logic
    if (this.config.enableRetry && this.shouldRetry(errorInfo)) {
      this.scheduleRetry(errorInfo);
    }

    // Reporting
    if (this.config.enableReporting) {
      this.queueForReporting(errorInfo);
    }
  }

  private logError(errorInfo: ErrorInfo): void {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;
    const logData = {
      id: errorInfo.id,
      source: errorInfo.source,
      timestamp: errorInfo.timestamp,
      context: errorInfo.context,
      stack: errorInfo.stack
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        break;
      default:
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
      case 'info':
        return 'info';
      default:
        return 'log';
    }
  }

  private shouldNotify(errorInfo: ErrorInfo): boolean {
    const severityWeight = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1
    };

    return severityWeight[errorInfo.severity] >= this.config.notificationThreshold;
  }

  private notifyError(errorInfo: ErrorInfo): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Erro ${errorInfo.severity}`, {
          body: errorInfo.message,
          icon: '/favicon.ico',
          tag: errorInfo.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.notifyError(errorInfo);
          }
        });
      }
    }
  }

  private shouldRetry(errorInfo: ErrorInfo): boolean {
    // Don't retry certain error types
    const nonRetryableTypes: ErrorType[] = ['validation', 'authentication', 'authorization'];
    if (nonRetryableTypes.includes(errorInfo.type)) {
      return false;
    }

    // Check retry count
    return errorInfo.retryCount < this.config.defaultRetryStrategy.maxAttempts;
  }

  private scheduleRetry(errorInfo: ErrorInfo): void {
    const strategy = this.config.defaultRetryStrategy;
    const delay = Math.min(
      strategy.delay * Math.pow(strategy.backoffMultiplier, errorInfo.retryCount),
      strategy.maxDelay
    );

    const nextRetry = new Date(Date.now() + delay);
    
    this.state.retryQueue.push({
      error: errorInfo,
      attempt: errorInfo.retryCount + 1,
      nextRetry
    });

    this.notifyListeners();
  }

  private startRetryProcessor(): void {
    setInterval(() => {
      const now = new Date();
      const readyToRetry = this.state.retryQueue.filter(item => item.nextRetry <= now);
      
      readyToRetry.forEach(item => {
        this.processRetry(item);
      });

      // Remove processed items
      this.state.retryQueue = this.state.retryQueue.filter(item => item.nextRetry > now);
      
      if (readyToRetry.length > 0) {
        this.notifyListeners();
      }
    }, 1000);
  }

  private processRetry(retryItem: { error: ErrorInfo; attempt: number; nextRetry: Date }): void {
    const { error } = retryItem;
    
    // Update retry count
    error.retryCount = retryItem.attempt;
    
    // Emit retry event (could be used to trigger actual retry logic)
    this.emitRetryEvent(error);
  }

  private emitRetryEvent(errorInfo: ErrorInfo): void {
    const event = new CustomEvent('error-retry', {
      detail: { errorInfo }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  private queueForReporting(errorInfo: ErrorInfo): void {
    if (this.config.enableOfflineQueue || navigator.onLine) {
      this.reportingQueue.push(errorInfo);
      this.processReportingQueue();
    }
  }

  private startReportingProcessor(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      if (this.reportingQueue.length > 0 && navigator.onLine) {
        this.processReportingQueue();
      }
    }, 30000);

    // Process queue when coming back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processReportingQueue();
      });
    }
  }

  private async processReportingQueue(): Promise<void> {
    if (this.isReportingActive || this.reportingQueue.length === 0) {
      return;
    }

    this.isReportingActive = true;
    this.state.isReporting = true;
    this.notifyListeners();

    try {
      const batch = this.reportingQueue.splice(0, 10); // Process in batches of 10
      await this.reportErrors(batch);
    } catch (error) {
      console.error('Failed to report errors:', error);
      // Re-queue failed items
      this.reportingQueue.unshift(...this.reportingQueue.splice(-10));
    } finally {
      this.isReportingActive = false;
      this.state.isReporting = false;
      this.notifyListeners();
    }
  }

  private async reportErrors(errors: ErrorInfo[]): Promise<void> {
    if (!this.config.reportingEndpoint) {
      return;
    }

    const payload = {
      errors: errors.map(error => ({
        ...error,
        timestamp: error.timestamp.toISOString()
      })),
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    const response = await fetch(this.config.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.reportingApiKey && {
          'Authorization': `Bearer ${this.config.reportingApiKey}`
        })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Reporting failed: ${response.status} ${response.statusText}`);
    }
  }

  public resolveError(errorId: string): void {
    const error = this.state.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      this.updateMetrics();
      this.notifyListeners();
    }
  }

  public resolveAllErrors(): void {
    this.state.errors.forEach(error => {
      error.resolved = true;
    });
    this.updateMetrics();
    this.notifyListeners();
  }

  public clearErrors(): void {
    this.state.errors = [];
    this.updateMetrics();
    this.notifyListeners();
  }

  public addPattern(pattern: Omit<ErrorPattern, 'id'>): void {
    const newPattern: ErrorPattern = {
      ...pattern,
      id: this.generatePatternId()
    };
    
    this.state.patterns.push(newPattern);
    this.notifyListeners();
  }

  public updatePattern(patternId: string, updates: Partial<ErrorPattern>): void {
    const pattern = this.state.patterns.find(p => p.id === patternId);
    if (pattern) {
      Object.assign(pattern, updates);
      this.notifyListeners();
    }
  }

  public removePattern(patternId: string): void {
    this.state.patterns = this.state.patterns.filter(p => p.id !== patternId);
    this.notifyListeners();
  }

  public updateConfig(updates: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
  }

  public exportData(): string {
    return JSON.stringify({
      config: this.config,
      patterns: this.state.patterns,
      errors: this.state.errors.slice(0, 100), // Export last 100 errors
      metrics: this.state.metrics
    }, null, 2);
  }

  public importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.config) {
        this.config = { ...this.config, ...parsed.config };
      }
      
      if (parsed.patterns) {
        this.state.patterns = parsed.patterns;
      }
      
      if (parsed.errors) {
        this.state.errors = parsed.errors.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }));
      }
      
      this.updateMetrics();
      this.notifyListeners();
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  private updateMetrics(): void {
    const errors = this.state.errors;
    const resolved = errors.filter(e => e.resolved);
    const unresolved = errors.filter(e => !e.resolved);
    
    // Calculate error rate (errors per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = errors.filter(e => e.timestamp > oneHourAgo);
    
    // Calculate average resolution time
    const resolvedWithTime = resolved.filter(e => e.resolved);
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, error) => {
          // Assuming resolution time is tracked somewhere
          return sum + (Date.now() - error.timestamp.getTime());
        }, 0) / resolvedWithTime.length
      : 0;

    // Top error types
    const typeCount = new Map<string, number>();
    errors.forEach(error => {
      typeCount.set(error.type, (typeCount.get(error.type) || 0) + 1);
    });
    
    const topErrorTypes = Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Errors by source
    const sourceCount = new Map<string, number>();
    errors.forEach(error => {
      sourceCount.set(error.source, (sourceCount.get(error.source) || 0) + 1);
    });
    
    const errorsBySource = Array.from(sourceCount.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Error trends (last 24 hours, hourly buckets)
    const errorTrends: Array<{ timestamp: Date; count: number }> = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);
      const count = errors.filter(e => 
        e.timestamp >= bucketStart && e.timestamp < bucketEnd
      ).length;
      errorTrends.push({ timestamp: bucketStart, count });
    }

    this.state.metrics = {
      totalErrors: errors.length,
      resolvedErrors: resolved.length,
      unresolvedErrors: unresolved.length,
      errorRate: recentErrors.length,
      averageResolutionTime: avgResolutionTime,
      topErrorTypes,
      errorsBySource,
      errorTrends,
      criticalErrors: errors.filter(e => e.severity === 'critical').length,
      warningErrors: errors.filter(e => e.severity === 'medium').length,
      infoErrors: errors.filter(e => e.severity === 'info').length
    };
  }

  private getDefaultPatterns(): ErrorPattern[] {
    return [
      {
        id: 'network-timeout',
        name: 'Network Timeout',
        pattern: /timeout|network error|fetch failed/i,
        type: 'network',
        severity: 'medium',
        autoResolve: true,
        retryStrategy: {
          maxAttempts: 3,
          delay: 1000,
          backoffMultiplier: 2,
          maxDelay: 10000
        },
        notification: true,
        enabled: true
      },
      {
        id: 'validation-error',
        name: 'Validation Error',
        pattern: /validation|invalid|required|format/i,
        type: 'validation',
        severity: 'low',
        autoResolve: false,
        notification: false,
        enabled: true
      },
      {
        id: 'auth-error',
        name: 'Authentication Error',
        pattern: /unauthorized|forbidden|authentication|login/i,
        type: 'authentication',
        severity: 'high',
        autoResolve: false,
        notification: true,
        enabled: true
      },
      {
        id: 'critical-system',
        name: 'Critical System Error',
        pattern: /critical|fatal|crash|system error/i,
        type: 'system',
        severity: 'critical',
        autoResolve: false,
        notification: true,
        enabled: true
      }
    ];
  }

  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      resolvedErrors: 0,
      unresolvedErrors: 0,
      errorRate: 0,
      averageResolutionTime: 0,
      topErrorTypes: [],
      errorsBySource: [],
      errorTrends: [],
      criticalErrors: 0,
      warningErrors: 0,
      infoErrors: 0
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public subscribe(listener: (state: ErrorHandlingState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public destroy(): void {
    // Clean up event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError.bind(this));
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    // Clean up performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Clear timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();

    // Clear listeners
    this.listeners.clear();
  }
}

// Default configuration
const defaultConfig: ErrorHandlingConfig = {
  enableLogging: true,
  enableReporting: false,
  enableRetry: true,
  enableNotifications: true,
  maxErrorsInMemory: 1000,
  defaultRetryStrategy: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000
  },
  notificationThreshold: 3, // medium and above
  autoResolveTimeout: 300000, // 5 minutes
  enableSourceMaps: true,
  enableUserContext: true,
  enablePerformanceTracking: true,
  enableOfflineQueue: true
};

// Hook
const useErrorHandling = (config: Partial<ErrorHandlingConfig> = {}) => {
  const [state, setState] = useState<ErrorHandlingState>(() => ({
    errors: [],
    patterns: [],
    metrics: {
      totalErrors: 0,
      resolvedErrors: 0,
      unresolvedErrors: 0,
      errorRate: 0,
      averageResolutionTime: 0,
      topErrorTypes: [],
      errorsBySource: [],
      errorTrends: [],
      criticalErrors: 0,
      warningErrors: 0,
      infoErrors: 0
    },
    isInitialized: false,
    isReporting: false,
    errorQueue: [],
    retryQueue: []
  }));
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<ErrorHandlingEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    try {
      const mergedConfig = { ...defaultConfig, ...config };
      engineRef.current = new ErrorHandlingEngine(mergedConfig);
      
      const unsubscribe = engineRef.current.subscribe((newState) => {
        setState(newState);
      });
      
      setIsLoading(false);
      
      return () => {
        unsubscribe();
        engineRef.current?.destroy();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize error handling');
      setIsLoading(false);
    }
  }, []);

  // Actions
  const actions = {
    captureError: useCallback((error: Error, options?: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      source?: string;
      context?: Record<string, any>;
      tags?: string[];
    }) => {
      return engineRef.current?.captureError(error, options) || '';
    }, []),

    resolveError: useCallback((errorId: string) => {
      engineRef.current?.resolveError(errorId);
    }, []),

    resolveAllErrors: useCallback(() => {
      engineRef.current?.resolveAllErrors();
    }, []),

    clearErrors: useCallback(() => {
      engineRef.current?.clearErrors();
    }, []),

    addPattern: useCallback((pattern: Omit<ErrorPattern, 'id'>) => {
      engineRef.current?.addPattern(pattern);
    }, []),

    updatePattern: useCallback((patternId: string, updates: Partial<ErrorPattern>) => {
      engineRef.current?.updatePattern(patternId, updates);
    }, []),

    removePattern: useCallback((patternId: string) => {
      engineRef.current?.removePattern(patternId);
    }, []),

    updateConfig: useCallback((updates: Partial<ErrorHandlingConfig>) => {
      engineRef.current?.updateConfig(updates);
    }, []),

    exportData: useCallback(() => {
      return engineRef.current?.exportData() || '';
    }, []),

    importData: useCallback((data: string) => {
      engineRef.current?.importData(data);
    }, []),

    clearError: useCallback(() => {
      setError(null);
    }, [])
  };

  return {
    state,
    config: { ...defaultConfig, ...config },
    isLoading,
    error,
    actions
  };
};

export default useErrorHandling;