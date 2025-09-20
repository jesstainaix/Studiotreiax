import { useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  useAIScriptCorrectionStore,
  ScriptAnalysis,
  ScriptError,
  ScriptSuggestion,
  ScriptCorrection,
  AIModel,
  CorrectionConfig,
  CorrectionStats,
  CorrectionMetrics
} from '../services/aiScriptCorrectionService';

// Utility Hooks
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
};

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Progress Tracking Hook
export const useAIScriptCorrectionProgress = () => {
  const { analyses, isAnalyzing, isApplying } = useAIScriptCorrectionStore();
  
  const progress = useMemo(() => {
    if (!isAnalyzing && !isApplying) return 100;
    
    const activeAnalyses = analyses.filter(a => a.status === 'analyzing');
    if (activeAnalyses.length === 0) return 100;
    
    const totalProgress = activeAnalyses.reduce((sum, analysis) => sum + analysis.progress, 0);
    return Math.round(totalProgress / activeAnalyses.length);
  }, [analyses, isAnalyzing, isApplying]);
  
  const isActive = isAnalyzing || isApplying;
  const status = isAnalyzing ? 'Analisando...' : isApplying ? 'Aplicando correções...' : 'Concluído';
  
  return { progress, isActive, status };
};

// Main Hook
export const useAIScriptCorrection = () => {
  const store = useAIScriptCorrectionStore();
  
  // Auto-initialize
  useEffect(() => {
    store.actions.initialize();
  }, []);
  
  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(() => {
      store.actions.refreshStats();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Analysis actions
    analyzeScript: store.actions.analyzeScript,
    cancelAnalysis: store.actions.cancelAnalysis,
    reanalyzeScript: store.actions.reanalyzeScript,
    deleteAnalysis: store.actions.deleteAnalysis,
    
    // Error actions
    dismissError: store.actions.dismissError,
    markErrorAsFixed: store.actions.markErrorAsFixed,
    addCustomError: store.actions.addCustomError,
    
    // Suggestion actions
    applySuggestion: store.actions.applySuggestion,
    rejectSuggestion: store.actions.rejectSuggestion,
    customizeSuggestion: store.actions.customizeSuggestion,
    
    // Correction actions
    applyCorrection: store.actions.applyCorrection,
    revertCorrection: store.actions.revertCorrection,
    validateCorrection: store.actions.validateCorrection,
    
    // Model actions
    addModel: store.actions.addModel,
    updateModel: store.actions.updateModel,
    removeModel: store.actions.removeModel,
    testModel: store.actions.testModel,
    
    // Configuration actions
    updateConfig: store.actions.updateConfig,
    resetConfig: store.actions.resetConfig,
    exportConfig: store.actions.exportConfig,
    importConfig: store.actions.importConfig,
    
    // Analytics actions
    refreshStats: store.actions.refreshStats,
    exportStats: store.actions.exportStats,
    generateReport: store.actions.generateReport,
    
    // System actions
    initialize: store.actions.initialize,
    cleanup: store.actions.cleanup,
    reset: store.actions.reset
  }), [store.actions]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickAnalyze: async (content: string) => {
      try {
        await store.quickActions.quickAnalyze(content);
      } catch (error) {
        console.error('Quick analyze failed:', error);
      }
    },
    
    quickFix: async (errorId: string) => {
      try {
        await store.quickActions.quickFix(errorId);
      } catch (error) {
        console.error('Quick fix failed:', error);
      }
    },
    
    autoCorrect: async (analysisId: string) => {
      try {
        await store.quickActions.autoCorrect(analysisId);
      } catch (error) {
        console.error('Auto correct failed:', error);
      }
    },
    
    bulkApply: async (suggestionIds: string[]) => {
      try {
        await store.quickActions.bulkApply(suggestionIds);
      } catch (error) {
        console.error('Bulk apply failed:', error);
      }
    }
  }), [store.quickActions]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    analyzeScript: useThrottle(actions.analyzeScript, 1000),
    refreshStats: useThrottle(actions.refreshStats, 5000)
  }), [actions]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    updateConfig: useDebounce(actions.updateConfig, 500)
  }), [actions]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const analyses = store.analyses;
    const errors = store.errors;
    const suggestions = store.suggestions;
    const corrections = store.corrections;
    
    return {
      // Basic counts
      totalAnalyses: analyses.length,
      activeAnalyses: analyses.filter(a => a.status === 'analyzing').length,
      completedAnalyses: analyses.filter(a => a.status === 'completed').length,
      
      // Error metrics
      totalErrors: errors.length,
      criticalErrors: errors.filter(e => e.severity === 'error').length,
      fixableErrors: errors.filter(e => e.fixable).length,
      errorsByType: errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Suggestion metrics
      totalSuggestions: suggestions.length,
      automatedSuggestions: suggestions.filter(s => s.automated).length,
      highConfidenceSuggestions: suggestions.filter(s => s.confidence > 0.8).length,
      suggestionsByType: suggestions.reduce((acc, suggestion) => {
        acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Correction metrics
      totalCorrections: corrections.length,
      successfulCorrections: corrections.filter(c => c.result.success).length,
      pendingCorrections: corrections.filter(c => c.status === 'pending').length,
      
      // Recent items
      recentAnalyses: analyses
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      recentErrors: errors
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      topSuggestions: suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5),
      
      // Performance metrics
      averageAnalysisTime: analyses.length > 0 ?
        analyses.reduce((sum, a) => sum + (a.updatedAt.getTime() - a.createdAt.getTime()), 0) / analyses.length :
        0,
      successRate: corrections.length > 0 ?
        (corrections.filter(c => c.result.success).length / corrections.length) * 100 :
        0,
      averageConfidence: suggestions.length > 0 ?
        suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length :
        0
    };
  }, [store.analyses, store.errors, store.suggestions, store.corrections]);
  
  // Filtered data
  const getFilteredData = useCallback((filters: {
    analysisStatus?: string;
    errorSeverity?: string;
    errorType?: string;
    suggestionType?: string;
    correctionStatus?: string;
    dateRange?: { start: Date; end: Date };
    searchTerm?: string;
  }) => {
    let filteredAnalyses = store.analyses;
    let filteredErrors = store.errors;
    let filteredSuggestions = store.suggestions;
    let filteredCorrections = store.corrections;
    
    // Filter by analysis status
    if (filters.analysisStatus) {
      filteredAnalyses = filteredAnalyses.filter(a => a.status === filters.analysisStatus);
    }
    
    // Filter by error severity
    if (filters.errorSeverity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filters.errorSeverity);
    }
    
    // Filter by error type
    if (filters.errorType) {
      filteredErrors = filteredErrors.filter(e => e.type === filters.errorType);
    }
    
    // Filter by suggestion type
    if (filters.suggestionType) {
      filteredSuggestions = filteredSuggestions.filter(s => s.type === filters.suggestionType);
    }
    
    // Filter by correction status
    if (filters.correctionStatus) {
      filteredCorrections = filteredCorrections.filter(c => c.status === filters.correctionStatus);
    }
    
    // Filter by date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.createdAt >= start && a.createdAt <= end
      );
      filteredErrors = filteredErrors.filter(e => 
        e.createdAt >= start && e.createdAt <= end
      );
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.fileName.toLowerCase().includes(term) ||
        a.language.toLowerCase().includes(term)
      );
      filteredErrors = filteredErrors.filter(e => 
        e.message.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term)
      );
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.title.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      );
    }
    
    return {
      analyses: filteredAnalyses,
      errors: filteredErrors,
      suggestions: filteredSuggestions,
      corrections: filteredCorrections
    };
  }, [store.analyses, store.errors, store.suggestions, store.corrections]);
  
  return {
    // State
    analyses: store.analyses,
    errors: store.errors,
    suggestions: store.suggestions,
    corrections: store.corrections,
    models: store.models,
    config: store.config,
    stats: store.stats,
    metrics: store.metrics,
    
    // UI State
    isAnalyzing: store.isAnalyzing,
    isApplying: store.isApplying,
    error: store.error,
    selectedAnalysisId: store.selectedAnalysisId,
    selectedErrorId: store.selectedErrorId,
    selectedSuggestionId: store.selectedSuggestionId,
    
    // Computed
    computed,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Utilities
    getFilteredData,
    
    // Setters
    setSelectedAnalysis: store.setSelectedAnalysis,
    setSelectedError: store.setSelectedError,
    setSelectedSuggestion: store.setSelectedSuggestion
  };
};

// Specialized Hooks
export const useAIScriptCorrectionStats = () => {
  const { stats, actions } = useAIScriptCorrection();
  
  const refreshStats = useCallback(() => {
    actions.refreshStats();
  }, [actions]);
  
  return {
    stats,
    refreshStats,
    exportStats: actions.exportStats,
    generateReport: actions.generateReport
  };
};

export const useAIScriptCorrectionConfig = () => {
  const { config, actions } = useAIScriptCorrection();
  
  const updateConfig = useCallback((updates: Partial<CorrectionConfig>) => {
    actions.updateConfig(updates);
  }, [actions]);
  
  return {
    config,
    updateConfig,
    resetConfig: actions.resetConfig,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig
  };
};

export const useAIScriptCorrectionSearch = (searchTerm: string, filters: any = {}) => {
  const { getFilteredData } = useAIScriptCorrection();
  
  const results = useMemo(() => {
    return getFilteredData({ ...filters, searchTerm });
  }, [getFilteredData, searchTerm, filters]);
  
  return results;
};

export const useCurrentAnalysis = () => {
  const { analyses, selectedAnalysisId, setSelectedAnalysis } = useAIScriptCorrection();
  
  const currentAnalysis = useMemo(() => {
    return selectedAnalysisId ? 
      analyses.find(a => a.id === selectedAnalysisId) : 
      null;
  }, [analyses, selectedAnalysisId]);
  
  return {
    currentAnalysis,
    setCurrentAnalysis: setSelectedAnalysis
  };
};

export const useErrorMonitoring = () => {
  const { errors, computed, actions } = useAIScriptCorrection();
  
  const criticalErrors = useMemo(() => {
    return errors.filter(e => e.severity === 'error');
  }, [errors]);
  
  const recentErrors = useMemo(() => {
    return errors
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [errors]);
  
  return {
    errors,
    criticalErrors,
    recentErrors,
    errorsByType: computed.errorsByType,
    dismissError: actions.dismissError,
    markErrorAsFixed: actions.markErrorAsFixed
  };
};

export const useAIScriptCorrectionAnalytics = () => {
  const { stats, metrics, computed } = useAIScriptCorrection();
  
  const analytics = useMemo(() => ({
    // Performance metrics
    systemHealth: metrics.systemHealth,
    processingSpeed: metrics.processingSpeed,
    accuracyScore: metrics.accuracyScore,
    
    // Usage metrics
    totalAnalyses: computed.totalAnalyses,
    successRate: computed.successRate,
    averageConfidence: computed.averageConfidence,
    
    // Trend data
    trends: stats.trends,
    
    // Recommendations
    recommendations: metrics.recommendations
  }), [stats, metrics, computed]);
  
  return analytics;
};

// Utility Hooks
export const useAIScriptCorrectionThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): T => {
  return useThrottle(callback, delay);
};

export const useAIScriptCorrectionDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T => {
  return useDebounce(callback, delay);
};

// Helper Functions
export const calculateCorrectionComplexity = (analysis: ScriptAnalysis): number => {
  const weights = {
    errors: 0.4,
    suggestions: 0.3,
    codeComplexity: 0.2,
    linesOfCode: 0.1
  };
  
  const errorScore = Math.min(analysis.errors.length * 10, 100);
  const suggestionScore = Math.min(analysis.suggestions.length * 5, 100);
  const complexityScore = analysis.metrics.complexity * 10;
  const locScore = Math.min(analysis.metrics.linesOfCode / 10, 100);
  
  return Math.round(
    errorScore * weights.errors +
    suggestionScore * weights.suggestions +
    complexityScore * weights.codeComplexity +
    locScore * weights.linesOfCode
  );
};

export const calculateConfidenceScore = (suggestions: ScriptSuggestion[]): number => {
  if (suggestions.length === 0) return 0;
  
  const totalConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0);
  return Math.round((totalConfidence / suggestions.length) * 100);
};

export const getRecommendedAction = (error: ScriptError): string => {
  if (error.fixable && error.suggestions.length > 0) {
    const bestSuggestion = error.suggestions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    if (bestSuggestion.confidence > 0.8) {
      return 'auto_fix';
    } else if (bestSuggestion.confidence > 0.6) {
      return 'suggest_fix';
    }
  }
  
  return 'manual_review';
};

export const calculateSystemStatus = (metrics: CorrectionMetrics): 'healthy' | 'warning' | 'critical' => {
  if (metrics.systemHealth >= 80) return 'healthy';
  if (metrics.systemHealth >= 60) return 'warning';
  return 'critical';
};

export const calculatePerformanceScore = (stats: CorrectionStats): number => {
  const weights = {
    accuracy: 0.3,
    speed: 0.25,
    successRate: 0.25,
    confidence: 0.2
  };
  
  const speedScore = Math.max(0, 100 - (stats.averageProcessingTime / 100));
  
  return Math.round(
    stats.performanceMetrics.accuracy * weights.accuracy +
    speedScore * weights.speed +
    stats.successRate * weights.successRate +
    stats.averageConfidence * weights.confidence
  );
};

export const calculateEfficiencyRating = (corrections: ScriptCorrection[]): number => {
  if (corrections.length === 0) return 0;
  
  const successful = corrections.filter(c => c.result.success).length;
  const automated = corrections.filter(c => 
    c.validation.syntaxValid && 
    c.validation.testsPass && 
    c.validation.noRegressions
  ).length;
  
  const successRate = (successful / corrections.length) * 100;
  const automationRate = (automated / corrections.length) * 100;
  
  return Math.round((successRate + automationRate) / 2);
};

export default useAIScriptCorrection;