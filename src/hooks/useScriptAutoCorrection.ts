import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useScriptAutoCorrectionStore,
  ScriptAnalysis,
  ScriptError,
  ScriptFix,
  CorrectionRule,
  CorrectionConfig,
  CorrectionStats,
  CorrectionEvent
} from '../services/scriptAutoCorrectionService';

// Throttle and debounce utilities
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Main hook for script auto-correction
export const useScriptAutoCorrection = () => {
  // State management
  const {
    analyses,
    errors,
    fixes,
    rules,
    config,
    stats,
    events,
    isAnalyzing,
    isApplyingFixes,
    error,
    isInitialized,
    recentAnalyses,
    criticalErrors,
    pendingFixes,
    enabledRules,
    errorsByCategory,
    fixesByImpact,
    analyzeScript,
    applyFix,
    applyAllFixes,
    updateRule,
    addCustomRule,
    removeRule,
    updateConfig,
    getAnalysis,
    getErrorsForScript,
    getFixesForScript,
    searchAnalyses,
    filterAnalyses,
    analyzeMultipleScripts,
    applyFixesBatch,
    startRealTimeAnalysis,
    stopRealTimeAnalysis,
    quickFix,
    autoCorrectScript,
    validateScript,
    generateReport,
    exportAnalysis,
    importRules,
    optimizeScript,
    refreshData,
    resetSystem,
    checkHealth,
    performMaintenance,
    formatDuration,
    getSeverityColor,
    getTypeIcon,
    getConfig,
    getStats,
    getEvents,
    clearEvents,
    logState,
    validateConfig,
    getSystemInfo
  } = useScriptAutoCorrectionStore();

  // Local state for UI interactions
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [selectedFix, setSelectedFix] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Auto-initialization effect
  useEffect(() => {
    if (!isInitialized) {
      refreshData();
    }
  }, [isInitialized, refreshData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isAnalyzing && !isApplyingFixes) {
        refreshData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isAnalyzing, isApplyingFixes, refreshData]);

  // Memoized actions with error handling
  const actions = useMemo(() => ({
    analyzeScript: async (scriptId: string, content: string, language: string) => {
      try {
        return await analyzeScript(scriptId, content, language);
      } catch (error) {
        console.error('Failed to analyze script:', error);
        throw error;
      }
    },

    applyFix: async (fixId: string) => {
      try {
        return await applyFix(fixId);
      } catch (error) {
        console.error('Failed to apply fix:', error);
        throw error;
      }
    },

    applyAllFixes: async (analysisId: string) => {
      try {
        return await applyAllFixes(analysisId);
      } catch (error) {
        console.error('Failed to apply all fixes:', error);
        throw error;
      }
    },

    updateRule: async (ruleId: string, updates: Partial<CorrectionRule>) => {
      try {
        await updateRule(ruleId, updates);
      } catch (error) {
        console.error('Failed to update rule:', error);
        throw error;
      }
    },

    addCustomRule: async (rule: Omit<CorrectionRule, 'id'>) => {
      try {
        return await addCustomRule(rule);
      } catch (error) {
        console.error('Failed to add custom rule:', error);
        throw error;
      }
    },

    removeRule: async (ruleId: string) => {
      try {
        await removeRule(ruleId);
      } catch (error) {
        console.error('Failed to remove rule:', error);
        throw error;
      }
    },

    updateConfig: async (updates: Partial<CorrectionConfig>) => {
      try {
        await updateConfig(updates);
      } catch (error) {
        console.error('Failed to update config:', error);
        throw error;
      }
    }
  }), [analyzeScript, applyFix, applyAllFixes, updateRule, addCustomRule, removeRule, updateConfig]);

  // Quick actions
  const quickActions = useMemo(() => ({
    quickFix: async (scriptId: string, errorType: string) => {
      try {
        return await quickFix(scriptId, errorType);
      } catch (error) {
        console.error('Quick fix failed:', error);
        return false;
      }
    },

    autoCorrect: async (scriptId: string) => {
      try {
        return await autoCorrectScript(scriptId);
      } catch (error) {
        console.error('Auto-correction failed:', error);
        throw error;
      }
    },

    validate: async (content: string, language: string) => {
      try {
        return await validateScript(content, language);
      } catch (error) {
        console.error('Validation failed:', error);
        return { isValid: false, errors: [] };
      }
    },

    optimize: async (scriptId: string) => {
      try {
        return await optimizeScript(scriptId);
      } catch (error) {
        console.error('Optimization failed:', error);
        throw error;
      }
    }
  }), [quickFix, autoCorrectScript, validateScript, optimizeScript]);

  // Advanced features
  const advancedFeatures = useMemo(() => ({
    batchAnalysis: async (scripts: { id: string; content: string; language: string }[], onProgress?: (progress: number) => void) => {
      try {
        const results: ScriptAnalysis[] = [];
        const total = scripts.length;
        
        for (let i = 0; i < scripts.length; i++) {
          const script = scripts[i];
          const analysis = await analyzeScript(script.id, script.content, script.language);
          results.push(analysis);
          
          if (onProgress) {
            onProgress(((i + 1) / total) * 100);
          }
        }
        
        return results;
      } catch (error) {
        console.error('Batch analysis failed:', error);
        throw error;
      }
    },

    smartRecommendations: () => {
      const recommendations: string[] = [];
      
      if (criticalErrors.length > 0) {
        recommendations.push(`You have ${criticalErrors.length} critical errors that need immediate attention`);
      }
      
      if (pendingFixes.length > 5) {
        recommendations.push(`Consider applying ${pendingFixes.length} pending fixes to improve code quality`);
      }
      
      const autoFixableFixes = pendingFixes.filter(f => f.confidence > 0.8);
      if (autoFixableFixes.length > 0) {
        recommendations.push(`${autoFixableFixes.length} fixes can be applied automatically with high confidence`);
      }
      
      if (stats.averageComplexity > 15) {
        recommendations.push('Consider refactoring complex code to improve maintainability');
      }
      
      if (stats.averageMaintainability < 60) {
        recommendations.push('Focus on improving code maintainability through better structure and documentation');
      }
      
      return recommendations;
    },

    comprehensiveAnalysis: async (scriptId: string, content: string, language: string) => {
      try {
        // Perform multiple types of analysis
        const [basicAnalysis, validation, optimization] = await Promise.all([
          analyzeScript(scriptId, content, language),
          validateScript(content, language),
          optimizeScript(scriptId)
        ]);
        
        return {
          basic: basicAnalysis,
          validation,
          optimization,
          recommendations: quickActions.validate ? await quickActions.validate(content, language) : null
        };
      } catch (error) {
        console.error('Comprehensive analysis failed:', error);
        throw error;
      }
    }
  }), [analyzeScript, criticalErrors, pendingFixes, stats, validateScript, optimizeScript, quickActions]);

  // System operations
  const systemOperations = useMemo(() => ({
    healthCheck: async () => {
      try {
        return await checkHealth();
      } catch (error) {
        console.error('Health check failed:', error);
        return false;
      }
    },

    maintenance: async () => {
      try {
        await performMaintenance();
      } catch (error) {
        console.error('Maintenance failed:', error);
        throw error;
      }
    },

    reset: async () => {
      try {
        await resetSystem();
        setSelectedAnalysis(null);
        setSelectedError(null);
        setSelectedFix(null);
        setSearchQuery('');
        setFilters({});
      } catch (error) {
        console.error('System reset failed:', error);
        throw error;
      }
    },

    refresh: async () => {
      try {
        await refreshData();
      } catch (error) {
        console.error('Data refresh failed:', error);
        throw error;
      }
    },

    configValidation: () => {
      return validateConfig();
    }
  }), [checkHealth, performMaintenance, resetSystem, refreshData, validateConfig]);

  // Utilities
  const utilities = useMemo(() => ({
    search: (query: string) => {
      setSearchQuery(query);
      return searchAnalyses(query);
    },

    filter: (newFilters: any) => {
      setFilters(newFilters);
      return filterAnalyses(newFilters);
    },

    getAnalysisDetails: (analysisId: string) => {
      return getAnalysis(analysisId);
    },

    getScriptErrors: (scriptId: string) => {
      return getErrorsForScript(scriptId);
    },

    getScriptFixes: (scriptId: string) => {
      return getFixesForScript(scriptId);
    },

    selectAnalysis: (analysisId: string | null) => {
      setSelectedAnalysis(analysisId);
    },

    selectError: (errorId: string | null) => {
      setSelectedError(errorId);
    },

    selectFix: (fixId: string | null) => {
      setSelectedFix(fixId);
    },

    toggleAutoRefresh: () => {
      setAutoRefresh(!autoRefresh);
    },

    setRefreshRate: (interval: number) => {
      setRefreshInterval(interval);
    }
  }), [searchAnalyses, filterAnalyses, getAnalysis, getErrorsForScript, getFixesForScript, autoRefresh]);

  // Configuration and analytics helpers
  const configHelpers = useMemo(() => ({
    getConfiguration: () => getConfig(),
    getStatistics: () => getStats(),
    getRecentEvents: (limit?: number) => getEvents(limit),
    clearEventHistory: () => clearEvents(),
    
    exportData: async (analysisId: string, format: 'json' | 'csv' | 'pdf') => {
      try {
        return await exportAnalysis(analysisId, format);
      } catch (error) {
        console.error('Export failed:', error);
        throw error;
      }
    },
    
    importRuleSet: async (rules: CorrectionRule[]) => {
      try {
        await importRules(rules);
      } catch (error) {
        console.error('Import failed:', error);
        throw error;
      }
    },
    
    generateAnalysisReport: async (analysisId: string) => {
      try {
        return await generateReport(analysisId);
      } catch (error) {
        console.error('Report generation failed:', error);
        throw error;
      }
    }
  }), [getConfig, getStats, getEvents, clearEvents, exportAnalysis, importRules, generateReport]);

  // Debug helpers
  const debugHelpers = useMemo(() => ({
    logCurrentState: () => logState(),
    getSystemInformation: () => getSystemInfo(),
    validateSystemConfig: () => validateConfig(),
    
    debugAnalysis: (analysisId: string) => {
      const analysis = getAnalysis(analysisId);
      return analysis;
    },
    
    debugError: (errorId: string) => {
      const error = errors.find(e => e.id === errorId);
      return error;
    },
    
    debugFix: (fixId: string) => {
      const fix = fixes.find(f => f.id === fixId);
      return fix;
    }
  }), [logState, getSystemInfo, validateConfig, getAnalysis, errors, fixes]);

  // Computed values
  const computedValues = useMemo(() => {
    const filteredAnalyses = searchQuery 
      ? searchAnalyses(searchQuery)
      : Object.keys(filters).length > 0 
        ? filterAnalyses(filters)
        : analyses;

    const selectedAnalysisData = selectedAnalysis ? getAnalysis(selectedAnalysis) : null;
    const selectedErrorData = selectedError ? errors.find(e => e.id === selectedError) : null;
    const selectedFixData = selectedFix ? fixes.find(f => f.id === selectedFix) : null;

    return {
      filteredAnalyses,
      selectedAnalysisData,
      selectedErrorData,
      selectedFixData,
      hasActiveFilters: searchQuery.length > 0 || Object.keys(filters).length > 0,
      totalIssues: errors.length,
      criticalIssues: criticalErrors.length,
      pendingFixesCount: pendingFixes.length,
      autoFixableCount: pendingFixes.filter(f => f.confidence > 0.8).length,
      isProcessing: isAnalyzing || isApplyingFixes,
      systemHealth: {
        isHealthy: !error && isInitialized,
        configValid: validateConfig(),
        hasData: analyses.length > 0
      }
    };
  }, [
    analyses, errors, fixes, searchQuery, filters, selectedAnalysis, selectedError, selectedFix,
    searchAnalyses, filterAnalyses, getAnalysis, criticalErrors, pendingFixes,
    isAnalyzing, isApplyingFixes, error, isInitialized, validateConfig
  ]);

  return {
    // State
    analyses,
    errors,
    fixes,
    rules,
    config,
    stats,
    events,
    isAnalyzing,
    isApplyingFixes,
    error,
    isInitialized,
    
    // Computed state
    recentAnalyses,
    criticalErrors,
    pendingFixes,
    enabledRules,
    errorsByCategory,
    fixesByImpact,
    
    // Local state
    selectedAnalysis,
    selectedError,
    selectedFix,
    searchQuery,
    filters,
    autoRefresh,
    refreshInterval,
    
    // Actions
    actions,
    quickActions,
    advancedFeatures,
    systemOperations,
    utilities,
    configHelpers,
    debugHelpers,
    
    // Computed values
    ...computedValues,
    
    // Utility functions
    formatDuration,
    getSeverityColor,
    getTypeIcon
  };
};

// Specialized hooks
export const useScriptCorrectionStats = () => {
  const { stats, getStats } = useScriptAutoCorrectionStore();
  
  const refreshStats = useCallback(async () => {
    // Stats are automatically updated with refreshData
  }, []);
  
  return {
    stats,
    refreshStats,
    ...stats
  };
};

export const useScriptCorrectionConfig = () => {
  const { config, updateConfig, getConfig } = useScriptAutoCorrectionStore();
  
  const updateConfiguration = useCallback(async (updates: Partial<CorrectionConfig>) => {
    try {
      await updateConfig(updates);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }, [updateConfig]);
  
  return {
    config,
    updateConfiguration,
    getConfiguration: getConfig
  };
};

export const useScriptAnalysis = (analysisId?: string) => {
  const { analyses, getAnalysis, analyzeScript } = useScriptAutoCorrectionStore();
  
  const analysis = useMemo(() => {
    return analysisId ? getAnalysis(analysisId) : null;
  }, [analysisId, getAnalysis]);
  
  const analyze = useCallback(async (scriptId: string, content: string, language: string) => {
    try {
      return await analyzeScript(scriptId, content, language);
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }, [analyzeScript]);
  
  return {
    analysis,
    analyses,
    analyze
  };
};

export const useScriptCorrectionRules = () => {
  const { 
    rules, 
    enabledRules, 
    updateRule, 
    addCustomRule, 
    removeRule 
  } = useScriptAutoCorrectionStore();
  
  const updateRuleConfig = useCallback(async (ruleId: string, updates: Partial<CorrectionRule>) => {
    try {
      await updateRule(ruleId, updates);
    } catch (error) {
      console.error('Failed to update rule:', error);
      throw error;
    }
  }, [updateRule]);
  
  const addRule = useCallback(async (rule: Omit<CorrectionRule, 'id'>) => {
    try {
      return await addCustomRule(rule);
    } catch (error) {
      console.error('Failed to add rule:', error);
      throw error;
    }
  }, [addCustomRule]);
  
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      await removeRule(ruleId);
    } catch (error) {
      console.error('Failed to remove rule:', error);
      throw error;
    }
  }, [removeRule]);
  
  return {
    rules,
    enabledRules,
    updateRule: updateRuleConfig,
    addRule,
    deleteRule
  };
};

export const useScriptCorrectionEvents = () => {
  const { events, getEvents, clearEvents } = useScriptAutoCorrectionStore();
  
  const getRecentEvents = useCallback((limit?: number) => {
    return getEvents(limit);
  }, [getEvents]);
  
  const clearEventHistory = useCallback(() => {
    clearEvents();
  }, [clearEvents]);
  
  return {
    events,
    getRecentEvents,
    clearEventHistory
  };
};

// Utility hooks
export const useThrottledAnalysis = (delay: number = 1000) => {
  const { analyzeScript } = useScriptAutoCorrectionStore();
  
  const throttledAnalyze = useMemo(
    () => throttle(analyzeScript, delay),
    [analyzeScript, delay]
  );
  
  return throttledAnalyze;
};

export const useDebouncedValidation = (delay: number = 500) => {
  const { validateScript } = useScriptAutoCorrectionStore();
  
  const debouncedValidate = useMemo(
    () => debounce(validateScript, delay),
    [validateScript, delay]
  );
  
  return debouncedValidate;
};

export const useScriptCorrectionProgress = () => {
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    isActive: boolean;
  }>({ current: 0, total: 0, percentage: 0, isActive: false });
  
  const startProgress = useCallback((total: number) => {
    setProgress({ current: 0, total, percentage: 0, isActive: true });
  }, []);
  
  const updateProgress = useCallback((current: number) => {
    setProgress(prev => ({
      ...prev,
      current,
      percentage: prev.total > 0 ? (current / prev.total) * 100 : 0
    }));
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(prev => ({ ...prev, isActive: false, percentage: 100 }));
  }, []);
  
  const resetProgress = useCallback(() => {
    setProgress({ current: 0, total: 0, percentage: 0, isActive: false });
  }, []);
  
  return {
    progress,
    startProgress,
    updateProgress,
    completeProgress,
    resetProgress
  };
};

// Helper functions
const throttleHelper = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const debounceHelper = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

export { throttleHelper as throttle, debounceHelper as debounce };