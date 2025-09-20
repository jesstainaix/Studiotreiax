/**
 * Pipeline Error Handling System
 * Sistema robusto para tratamento de erros e retry automático no pipeline PPTX→Vídeo
 */

import type { PipelineError, PipelineWarning } from '../monitoring/pipeline-monitor';

export interface ErrorHandlingStrategy {
  id: string;
  name: string;
  description: string;
  errorTypes: string[];
  maxRetries: number;
  retryDelay: number; // ms
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  backoffMultiplier: number;
  maxRetryDelay: number; // ms
  fallbackAction: 'skip' | 'alternative' | 'manual' | 'abort';
  recoveryActions: RecoveryAction[];
  conditions: ErrorCondition[];
}

export interface RecoveryAction {
  id: string;
  name: string;
  type: 'cleanup' | 'reset' | 'alternative' | 'notification' | 'fallback';
  priority: number;
  timeout: number; // ms
  parameters: Record<string, any>;
  execute: (context: ErrorContext) => Promise<RecoveryResult>;
}

export interface ErrorCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'range';
  value: any;
  caseSensitive?: boolean;
}

export interface ErrorContext {
  error: PipelineError;
  pipelineId: string;
  stageId: string;
  attemptNumber: number;
  previousAttempts: ErrorAttempt[];
  stageData: any;
  pipelineData: any;
  systemState: SystemState;
  userPreferences: UserPreferences;
}

export interface ErrorAttempt {
  attemptNumber: number;
  timestamp: number;
  error: PipelineError;
  strategy: string;
  recoveryActions: string[];
  result: 'success' | 'failure' | 'partial';
  duration: number;
  resourcesUsed: ResourceUsage;
}

export interface SystemState {
  availableMemory: number; // MB
  availableDisk: number; // MB
  cpuLoad: number; // %
  networkStatus: 'online' | 'offline' | 'limited';
  activeProcesses: number;
  systemHealth: 'good' | 'degraded' | 'critical';
}

export interface UserPreferences {
  maxRetryAttempts: number;
  retryTimeout: number; // ms
  autoFallback: boolean;
  notifyOnError: boolean;
  notifyOnRecovery: boolean;
  qualityOverSpeed: boolean;
  allowDataLoss: boolean;
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  data?: any;
  nextAction?: 'retry' | 'skip' | 'abort' | 'continue';
  estimatedRecoveryTime?: number; // ms
  resourcesRequired?: ResourceRequirement[];
}

export interface ResourceRequirement {
  type: 'memory' | 'disk' | 'cpu' | 'network';
  amount: number;
  duration: number; // ms
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceUsage {
  memory: number; // MB
  disk: number; // MB
  cpu: number; // %
  network: number; // MB
  duration: number; // ms
}

export interface ErrorHandlingResult {
  success: boolean;
  finalAction: 'retry' | 'skip' | 'abort' | 'fallback';
  totalAttempts: number;
  totalDuration: number;
  strategiesUsed: string[];
  recoveryActionsExecuted: string[];
  finalError?: PipelineError;
  recoveredData?: any;
  recommendations: string[];
}

export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  commonCauses: string[];
  preventionTips: string[];
  relatedPatterns: string[];
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByStage: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  mostCommonErrors: ErrorPattern[];
  trendingErrors: ErrorPattern[];
  systemImpact: {
    performanceDegradation: number; // %
    resourceWaste: number; // %
    userExperienceImpact: number; // %
  };
}

export class PipelineErrorHandler {
  private strategies: Map<string, ErrorHandlingStrategy> = new Map();
  private errorHistory: Map<string, ErrorAttempt[]> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private analytics: ErrorAnalytics;
  private userPreferences: UserPreferences;

  constructor(userPreferences?: Partial<UserPreferences>) {
    this.userPreferences = {
      maxRetryAttempts: 3,
      retryTimeout: 300000, // 5 minutes
      autoFallback: true,
      notifyOnError: true,
      notifyOnRecovery: true,
      qualityOverSpeed: false,
      allowDataLoss: false,
      ...userPreferences
    };

    this.analytics = this.initializeAnalytics();
    this.initializeDefaultStrategies();
    this.initializeErrorPatterns();
  }

  /**
   * Handle an error with automatic recovery strategies
   */
  async handleError(
    error: PipelineError,
    pipelineId: string,
    stageId: string,
    stageData?: any,
    pipelineData?: any
  ): Promise<ErrorHandlingResult> {
    const startTime = performance.now();
    const context: ErrorContext = {
      error,
      pipelineId,
      stageId,
      attemptNumber: 1,
      previousAttempts: this.getErrorHistory(pipelineId, stageId),
      stageData: stageData || {},
      pipelineData: pipelineData || {},
      systemState: await this.getSystemState(),
      userPreferences: this.userPreferences
    };

    // Update analytics
    this.updateErrorAnalytics(error);

    // Find matching strategies
    const strategies = this.findMatchingStrategies(error);

    let finalResult: ErrorHandlingResult = {
      success: false,
      finalAction: 'abort',
      totalAttempts: 0,
      totalDuration: 0,
      strategiesUsed: [],
      recoveryActionsExecuted: [],
      recommendations: []
    };

    // Try each strategy
    for (const strategy of strategies) {
      
      const strategyResult = await this.executeStrategy(strategy, context);
      
      finalResult.strategiesUsed.push(strategy.name);
      finalResult.recoveryActionsExecuted.push(...strategyResult.recoveryActionsExecuted);
      finalResult.totalAttempts += strategyResult.totalAttempts;

      if (strategyResult.success) {
        finalResult.success = true;
        finalResult.finalAction = 'retry';
        finalResult.recoveredData = strategyResult.recoveredData;
        break;
      }

      // If strategy failed but suggests a specific action, consider it
      if (strategyResult.finalAction !== 'abort') {
        finalResult.finalAction = strategyResult.finalAction;
      }
    }

    finalResult.totalDuration = performance.now() - startTime;

    // Generate recommendations
    finalResult.recommendations = this.generateRecommendations(error, context, finalResult);

    // Log final result
    if (finalResult.success) {
    } else {
      finalResult.finalError = error;
    }

    // Update error history
    this.updateErrorHistory(pipelineId, stageId, {
      attemptNumber: context.attemptNumber,
      timestamp: Date.now(),
      error,
      strategy: finalResult.strategiesUsed.join(', '),
      recoveryActions: finalResult.recoveryActionsExecuted,
      result: finalResult.success ? 'success' : 'failure',
      duration: finalResult.totalDuration,
      resourcesUsed: {
        memory: 0, // Would be measured in production
        disk: 0,
        cpu: 0,
        network: 0,
        duration: finalResult.totalDuration
      }
    });

    return finalResult;
  }

  /**
   * Add a custom error handling strategy
   */
  addStrategy(strategy: ErrorHandlingStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Remove an error handling strategy
   */
  removeStrategy(strategyId: string): void {
    this.strategies.delete(strategyId);
  }

  /**
   * Get error analytics
   */
  getAnalytics(): ErrorAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  /**
   * Clear error history for a pipeline
   */
  clearErrorHistory(pipelineId: string): void {
    const keys = Array.from(this.errorHistory.keys()).filter(key => key.startsWith(pipelineId));
    keys.forEach(key => this.errorHistory.delete(key));
  }

  // Private methods
  private async executeStrategy(
    strategy: ErrorHandlingStrategy,
    context: ErrorContext
  ): Promise<ErrorHandlingResult> {
    const startTime = performance.now();
    let attempts = 0;
    let lastError = context.error;
    const recoveryActionsExecuted: string[] = [];

    while (attempts < strategy.maxRetries && attempts < this.userPreferences.maxRetryAttempts) {
      attempts++;
      context.attemptNumber = attempts;

      try {
        // Execute recovery actions
        for (const action of strategy.recoveryActions.sort((a, b) => a.priority - b.priority)) {
          
          const actionResult = await this.executeRecoveryAction(action, context);
          recoveryActionsExecuted.push(action.name);

          if (actionResult.success) {
            
            if (actionResult.nextAction === 'continue') {
              return {
                success: true,
                finalAction: 'retry',
                totalAttempts: attempts,
                totalDuration: performance.now() - startTime,
                strategiesUsed: [strategy.name],
                recoveryActionsExecuted,
                recoveredData: actionResult.data,
                recommendations: []
              };
            }
          } else {
          }
        }

        // If we reach here, recovery actions didn't fully resolve the issue
        // Wait before retry if configured
        if (attempts < strategy.maxRetries) {
          const delay = this.calculateRetryDelay(strategy, attempts);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (recoveryError) {
        console.error(`💥 Recovery attempt ${attempts} failed:`, recoveryError);
        lastError = {
          ...context.error,
          message: `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`,
          details: recoveryError instanceof Error ? recoveryError.stack || '' : ''
        };
      }
    }

    // All attempts failed
    return {
      success: false,
      finalAction: strategy.fallbackAction,
      totalAttempts: attempts,
      totalDuration: performance.now() - startTime,
      strategiesUsed: [strategy.name],
      recoveryActionsExecuted,
      finalError: lastError,
      recommendations: []
    };
  }

  private async executeRecoveryAction(
    action: RecoveryAction,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    const timeout = action.timeout || 30000; // 30 seconds default
    
    try {
      const result = await Promise.race([
        action.execute(context),
        new Promise<RecoveryResult>((_, reject) => 
          setTimeout(() => reject(new Error('Recovery action timeout')), timeout)
        )
      ]);

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        nextAction: 'abort'
      };
    }
  }

  private findMatchingStrategies(error: PipelineError): ErrorHandlingStrategy[] {
    const matchingStrategies: ErrorHandlingStrategy[] = [];

    for (const strategy of this.strategies.values()) {
      if (this.strategyMatches(strategy, error)) {
        matchingStrategies.push(strategy);
      }
    }

    // Sort by priority (strategies with fewer error types are more specific)
    return matchingStrategies.sort((a, b) => a.errorTypes.length - b.errorTypes.length);
  }

  private strategyMatches(strategy: ErrorHandlingStrategy, error: PipelineError): boolean {
    // Check if error type matches
    const typeMatches = strategy.errorTypes.includes('*') || 
                       strategy.errorTypes.includes(error.code) ||
                       strategy.errorTypes.some(type => error.code.includes(type));

    if (!typeMatches) return false;

    // Check conditions
    return strategy.conditions.every(condition => this.evaluateCondition(condition, error));
  }

  private evaluateCondition(condition: ErrorCondition, error: PipelineError): boolean {
    const fieldValue = this.getFieldValue(error, condition.field);
    if (fieldValue === undefined) return false;

    const value = condition.caseSensitive ? fieldValue : fieldValue.toString().toLowerCase();
    const conditionValue = condition.caseSensitive ? condition.value : condition.value.toString().toLowerCase();

    switch (condition.operator) {
      case 'equals':
        return value === conditionValue;
      case 'contains':
        return value.includes(conditionValue);
      case 'startsWith':
        return value.startsWith(conditionValue);
      case 'endsWith':
        return value.endsWith(conditionValue);
      case 'regex':
        return new RegExp(conditionValue).test(value);
      case 'range':
        const numValue = parseFloat(value);
        const [min, max] = conditionValue;
        return numValue >= min && numValue <= max;
      default:
        return false;
    }
  }

  private getFieldValue(error: PipelineError, field: string): any {
    const fields = field.split('.');
    let value: any = error;
    
    for (const f of fields) {
      if (value && typeof value === 'object' && f in value) {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private calculateRetryDelay(strategy: ErrorHandlingStrategy, attemptNumber: number): number {
    let delay = strategy.retryDelay;

    switch (strategy.backoffStrategy) {
      case 'linear':
        delay = strategy.retryDelay * attemptNumber;
        break;
      case 'exponential':
        delay = strategy.retryDelay * Math.pow(strategy.backoffMultiplier, attemptNumber - 1);
        break;
      case 'fixed':
      default:
        delay = strategy.retryDelay;
        break;
    }

    return Math.min(delay, strategy.maxRetryDelay);
  }

  private async getSystemState(): Promise<SystemState> {
    // In production, this would query actual system metrics
    return {
      availableMemory: 8192, // MB
      availableDisk: 51200, // MB
      cpuLoad: 45, // %
      networkStatus: 'online',
      activeProcesses: 150,
      systemHealth: 'good'
    };
  }

  private getErrorHistory(pipelineId: string, stageId: string): ErrorAttempt[] {
    const key = `${pipelineId}:${stageId}`;
    return this.errorHistory.get(key) || [];
  }

  private updateErrorHistory(pipelineId: string, stageId: string, attempt: ErrorAttempt): void {
    const key = `${pipelineId}:${stageId}`;
    const history = this.errorHistory.get(key) || [];
    history.push(attempt);
    
    // Keep only last 10 attempts
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.errorHistory.set(key, history);
  }

  private updateErrorAnalytics(error: PipelineError): void {
    this.analytics.totalErrors++;
    
    // Update by type
    this.analytics.errorsByType[error.code] = (this.analytics.errorsByType[error.code] || 0) + 1;
    
    // Update by stage
    this.analytics.errorsByStage[error.stage] = (this.analytics.errorsByStage[error.stage] || 0) + 1;
    
    // Update by severity
    this.analytics.errorsBySeverity[error.severity] = (this.analytics.errorsBySeverity[error.severity] || 0) + 1;
  }

  private generateRecommendations(
    error: PipelineError,
    context: ErrorContext,
    result: ErrorHandlingResult
  ): string[] {
    const recommendations: string[] = [];

    // Based on error frequency
    const errorHistory = this.getErrorHistory(context.pipelineId, context.stageId);
    if (errorHistory.length > 3) {
      recommendations.push('Consider reviewing the input data quality or system configuration');
    }

    // Based on system state
    if (context.systemState.availableMemory < 1024) {
      recommendations.push('Low memory detected. Consider closing other applications or upgrading RAM');
    }

    if (context.systemState.cpuLoad > 80) {
      recommendations.push('High CPU usage detected. Consider reducing concurrent operations');
    }

    // Based on error type
    if (error.code.includes('NETWORK')) {
      recommendations.push('Network issues detected. Check internet connection and firewall settings');
    }

    if (error.code.includes('PERMISSION')) {
      recommendations.push('Permission issues detected. Check file/folder permissions and user privileges');
    }

    if (error.code.includes('MEMORY')) {
      recommendations.push('Memory issues detected. Consider processing smaller batches or increasing available memory');
    }

    // Based on recovery success
    if (!result.success && result.totalAttempts > 1) {
      recommendations.push('Multiple recovery attempts failed. Consider manual intervention or alternative approach');
    }

    return recommendations;
  }

  private initializeAnalytics(): ErrorAnalytics {
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByStage: {},
      errorsBySeverity: {},
      recoverySuccessRate: 0,
      averageRecoveryTime: 0,
      mostCommonErrors: [],
      trendingErrors: [],
      systemImpact: {
        performanceDegradation: 0,
        resourceWaste: 0,
        userExperienceImpact: 0
      }
    };
  }

  private initializeDefaultStrategies(): void {
    // Network Error Strategy
    this.addStrategy({
      id: 'network_error_strategy',
      name: 'Network Error Recovery',
      description: 'Handle network-related errors with retry and fallback',
      errorTypes: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_FAILED'],
      maxRetries: 3,
      retryDelay: 2000,
      backoffStrategy: 'exponential',
      backoffMultiplier: 2,
      maxRetryDelay: 30000,
      fallbackAction: 'alternative',
      recoveryActions: [
        {
          id: 'check_network',
          name: 'Check Network Connection',
          type: 'cleanup',
          priority: 1,
          timeout: 5000,
          parameters: {},
          execute: async (context) => {
            // Simulate network check
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
              success: true,
              message: 'Network connection verified',
              nextAction: 'retry'
            };
          }
        }
      ],
      conditions: []
    });

    // Memory Error Strategy
    this.addStrategy({
      id: 'memory_error_strategy',
      name: 'Memory Error Recovery',
      description: 'Handle memory-related errors with cleanup and optimization',
      errorTypes: ['OUT_OF_MEMORY', 'MEMORY_ALLOCATION_FAILED'],
      maxRetries: 2,
      retryDelay: 5000,
      backoffStrategy: 'linear',
      backoffMultiplier: 1,
      maxRetryDelay: 15000,
      fallbackAction: 'alternative',
      recoveryActions: [
        {
          id: 'cleanup_memory',
          name: 'Cleanup Memory',
          type: 'cleanup',
          priority: 1,
          timeout: 10000,
          parameters: {},
          execute: async (context) => {
            // Simulate memory cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
            return {
              success: true,
              message: 'Memory cleaned up successfully',
              nextAction: 'retry'
            };
          }
        }
      ],
      conditions: []
    });

    // File System Error Strategy
    this.addStrategy({
      id: 'filesystem_error_strategy',
      name: 'File System Error Recovery',
      description: 'Handle file system errors with permission fixes and path validation',
      errorTypes: ['FILE_NOT_FOUND', 'PERMISSION_DENIED', 'DISK_FULL'],
      maxRetries: 2,
      retryDelay: 1000,
      backoffStrategy: 'fixed',
      backoffMultiplier: 1,
      maxRetryDelay: 5000,
      fallbackAction: 'skip',
      recoveryActions: [
        {
          id: 'validate_paths',
          name: 'Validate File Paths',
          type: 'reset',
          priority: 1,
          timeout: 5000,
          parameters: {},
          execute: async (context) => {
            // Simulate path validation
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
              success: true,
              message: 'File paths validated',
              nextAction: 'retry'
            };
          }
        }
      ],
      conditions: []
    });

    // Generic Error Strategy (fallback)
    this.addStrategy({
      id: 'generic_error_strategy',
      name: 'Generic Error Recovery',
      description: 'Generic error handling for unspecified errors',
      errorTypes: ['*'],
      maxRetries: 1,
      retryDelay: 3000,
      backoffStrategy: 'fixed',
      backoffMultiplier: 1,
      maxRetryDelay: 10000,
      fallbackAction: 'manual',
      recoveryActions: [
        {
          id: 'log_error',
          name: 'Log Error Details',
          type: 'notification',
          priority: 1,
          timeout: 1000,
          parameters: {},
          execute: async (context) => {
            return {
              success: true,
              message: 'Error logged successfully',
              nextAction: 'abort'
            };
          }
        }
      ],
      conditions: []
    });
  }

  private initializeErrorPatterns(): void {
    const patterns: ErrorPattern[] = [
      {
        id: 'network_timeout',
        name: 'Network Timeout',
        description: 'Request timeout due to network issues',
        pattern: /timeout|timed out|connection timeout/i,
        frequency: 0,
        severity: 'medium',
        commonCauses: ['Slow internet connection', 'Server overload', 'Firewall blocking'],
        preventionTips: ['Check network stability', 'Increase timeout values', 'Use retry mechanisms'],
        relatedPatterns: ['connection_failed', 'network_unreachable']
      },
      {
        id: 'memory_exhausted',
        name: 'Memory Exhausted',
        description: 'System ran out of available memory',
        pattern: /out of memory|memory allocation|heap exhausted/i,
        frequency: 0,
        severity: 'high',
        commonCauses: ['Large file processing', 'Memory leaks', 'Insufficient RAM'],
        preventionTips: ['Process files in chunks', 'Increase available memory', 'Optimize algorithms'],
        relatedPatterns: ['disk_full', 'resource_exhausted']
      },
      {
        id: 'file_corruption',
        name: 'File Corruption',
        description: 'Input file is corrupted or invalid',
        pattern: /corrupt|invalid format|malformed|damaged file/i,
        frequency: 0,
        severity: 'high',
        commonCauses: ['Incomplete download', 'Storage issues', 'Software bugs'],
        preventionTips: ['Verify file integrity', 'Use checksums', 'Backup important files'],
        relatedPatterns: ['invalid_input', 'parsing_error']
      }
    ];

    patterns.forEach(pattern => {
      this.errorPatterns.set(pattern.id, pattern);
    });
  }
}

// Export singleton instance
export const pipelineErrorHandler = new PipelineErrorHandler();