import { useState, useEffect, useCallback, useRef } from 'react';
import { bundleAnalyzer, BundleAnalysis, CacheAnalysis, BundleRecommendation, CacheRecommendation } from '../utils/bundleAnalyzer';

export interface BundleAnalysisState {
  analysis: BundleAnalysis | null;
  cacheAnalysis: CacheAnalysis | null;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  error: string | null;
  lastAnalysis: number | null;
  autoAnalyze: boolean;
  recommendations: {
    bundle: BundleRecommendation[];
    cache: CacheRecommendation[];
  };
  metrics: {
    sizeTrend: number;
    performanceTrend: number;
    cacheEfficiency: number;
    optimizationScore: number;
  };
}

export interface BundleAnalysisActions {
  startAnalysis: () => Promise<void>;
  analyzeCachePerformance: () => Promise<void>;
  optimizeBundle: () => Promise<void>;
  clearCache: () => Promise<void>;
  applyRecommendation: (id: string, type: 'bundle' | 'cache') => Promise<void>;
  toggleAutoAnalyze: () => void;
  refreshAnalysis: () => Promise<void>;
  exportReport: () => Promise<string>;
  scheduleAnalysis: (interval: number) => void;
  stopScheduledAnalysis: () => void;
}

export interface BundleAnalysisConfig {
  autoAnalyzeInterval: number;
  enableRealTimeMonitoring: boolean;
  cacheAnalysisEnabled: boolean;
  optimizationThreshold: number;
  reportFormat: 'json' | 'csv' | 'pdf';
}

const defaultConfig: BundleAnalysisConfig = {
  autoAnalyzeInterval: 300000, // 5 minutos
  enableRealTimeMonitoring: true,
  cacheAnalysisEnabled: true,
  optimizationThreshold: 70,
  reportFormat: 'json'
};

export function useBundleAnalysis(config: Partial<BundleAnalysisConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<BundleAnalysisState>({
    analysis: null,
    cacheAnalysis: null,
    isAnalyzing: false,
    isOptimizing: false,
    error: null,
    lastAnalysis: null,
    autoAnalyze: false,
    recommendations: {
      bundle: [],
      cache: []
    },
    metrics: {
      sizeTrend: 0,
      performanceTrend: 0,
      cacheEfficiency: 0,
      optimizationScore: 0
    }
  });

  // Análise de bundle
  const startAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      const analysis = await bundleAnalyzer.analyzeBundleSize();
      const metrics = calculateMetrics(analysis, state.analysis);
      
      setState(prev => ({
        ...prev,
        analysis,
        lastAnalysis: Date.now(),
        recommendations: {
          ...prev.recommendations,
          bundle: analysis.recommendations
        },
        metrics: {
          ...prev.metrics,
          ...metrics
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro na análise do bundle'
      }));
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [state.analysis]);

  // Análise de cache
  const analyzeCachePerformance = useCallback(async () => {
    if (!finalConfig.cacheAnalysisEnabled) return;
    
    try {
      const cacheAnalysis = await bundleAnalyzer.analyzeCachePerformance();
      
      setState(prev => ({
        ...prev,
        cacheAnalysis,
        recommendations: {
          ...prev.recommendations,
          cache: cacheAnalysis.recommendations
        },
        metrics: {
          ...prev.metrics,
          cacheEfficiency: cacheAnalysis.hitRate
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro na análise de cache'
      }));
    }
  }, [finalConfig.cacheAnalysisEnabled]);

  // Otimização automática
  const optimizeBundle = useCallback(async () => {
    setState(prev => ({ ...prev, isOptimizing: true, error: null }));
    
    try {
      await bundleAnalyzer.optimizeBundle();
      
      // Re-analisar após otimização
      await startAnalysis();
      
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          optimizationScore: prev.analysis?.score || 0
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro na otimização'
      }));
    } finally {
      setState(prev => ({ ...prev, isOptimizing: false }));
    }
  }, [startAnalysis]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    try {
      await bundleAnalyzer.clearCache();
      await analyzeCachePerformance();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao limpar cache'
      }));
    }
  }, [analyzeCachePerformance]);

  // Aplicar recomendação
  const applyRecommendation = useCallback(async (id: string, type: 'bundle' | 'cache') => {
    try {
      const recommendations = state.recommendations[type];
      const recommendation = recommendations.find((_, index) => index.toString() === id);
      
      if (recommendation) {
        await recommendation.action();
        
        // Remover recomendação aplicada
        setState(prev => ({
          ...prev,
          recommendations: {
            ...prev.recommendations,
            [type]: prev.recommendations[type].filter((_, index) => index.toString() !== id)
          }
        }));
        
        // Re-analisar
        if (type === 'bundle') {
          await startAnalysis();
        } else {
          await analyzeCachePerformance();
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao aplicar recomendação'
      }));
    }
  }, [state.recommendations, startAnalysis, analyzeCachePerformance]);

  // Toggle auto análise
  const toggleAutoAnalyze = useCallback(() => {
    setState(prev => ({ ...prev, autoAnalyze: !prev.autoAnalyze }));
  }, []);

  // Refresh análise
  const refreshAnalysis = useCallback(async () => {
    await Promise.all([
      startAnalysis(),
      analyzeCachePerformance()
    ]);
  }, [startAnalysis, analyzeCachePerformance]);

  // Exportar relatório
  const exportReport = useCallback(async (): Promise<string> => {
    const report = {
      timestamp: new Date().toISOString(),
      bundleAnalysis: state.analysis,
      cacheAnalysis: state.cacheAnalysis,
      metrics: state.metrics,
      recommendations: state.recommendations,
      config: finalConfig
    };

    switch (finalConfig.reportFormat) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return convertToCSV(report);
      case 'pdf':
        return generatePDFReport(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }, [state, finalConfig]);

  // Agendar análise
  const scheduleAnalysis = useCallback((interval: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (state.autoAnalyze) {
        refreshAnalysis();
      }
    }, interval);
  }, [state.autoAnalyze, refreshAnalysis]);

  // Parar análise agendada
  const stopScheduledAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Efeitos
  useEffect(() => {
    // Inscrever-se nas atualizações do bundle analyzer
    unsubscribeRef.current = bundleAnalyzer.subscribe((analysis) => {
      setState(prev => ({
        ...prev,
        analysis,
        lastAnalysis: Date.now()
      }));
    });

    // Análise inicial
    if (finalConfig.enableRealTimeMonitoring) {
      refreshAnalysis();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [finalConfig.enableRealTimeMonitoring, refreshAnalysis]);

  useEffect(() => {
    if (state.autoAnalyze) {
      scheduleAnalysis(finalConfig.autoAnalyzeInterval);
    } else {
      stopScheduledAnalysis();
    }

    return () => {
      stopScheduledAnalysis();
    };
  }, [state.autoAnalyze, finalConfig.autoAnalyzeInterval, scheduleAnalysis, stopScheduledAnalysis]);

  // Otimização automática baseada no threshold
  useEffect(() => {
    if (state.analysis && state.analysis.score < finalConfig.optimizationThreshold && !state.isOptimizing) {
      optimizeBundle();
    }
  }, [state.analysis, finalConfig.optimizationThreshold, state.isOptimizing, optimizeBundle]);

  const actions: BundleAnalysisActions = {
    startAnalysis,
    analyzeCachePerformance,
    optimizeBundle,
    clearCache,
    applyRecommendation,
    toggleAutoAnalyze,
    refreshAnalysis,
    exportReport,
    scheduleAnalysis,
    stopScheduledAnalysis
  };

  return {
    ...state,
    actions,
    config: finalConfig
  };
}

// Funções auxiliares
function calculateMetrics(current: BundleAnalysis, previous: BundleAnalysis | null) {
  if (!previous) {
    return {
      sizeTrend: 0,
      performanceTrend: 0,
      optimizationScore: current.score
    };
  }

  const sizeTrend = ((current.totalSize - previous.totalSize) / previous.totalSize) * 100;
  const performanceTrend = ((current.score - previous.score) / previous.score) * 100;

  return {
    sizeTrend,
    performanceTrend,
    optimizationScore: current.score
  };
}

function convertToCSV(report: any): string {
  // Implementação simplificada de conversão para CSV
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Bundle Size', report.bundleAnalysis?.totalSize || 0],
    ['Gzipped Size', report.bundleAnalysis?.gzippedSize || 0],
    ['Bundle Score', report.bundleAnalysis?.score || 0],
    ['Cache Hit Rate', report.cacheAnalysis?.hitRate || 0],
    ['Optimization Score', report.metrics?.optimizationScore || 0]
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generatePDFReport(report: any): string {
  // Implementação simplificada - retorna JSON por enquanto
  // Em uma implementação real, usaria uma biblioteca como jsPDF
  return JSON.stringify(report, null, 2);
}

export default useBundleAnalysis;