// Hook React para otimização de bundle
import { useCallback, useEffect, useState } from 'react';
import {
  useBundleOptimizerStore,
  BundleAnalysis,
  OptimizationRecommendation,
  OptimizationSettings,
  ComparisonResult,
  PerformanceMetrics,
  bundleOptimizer
} from '../utils/bundleOptimizer';

// Interfaces para o hook
export interface UseBundleOptimizerOptions {
  autoAnalyze?: boolean;
  analyzeInterval?: number;
  enableRealTimeMonitoring?: boolean;
  performanceThreshold?: Partial<PerformanceMetrics>;
  sizeThreshold?: number;
}

export interface UseBundleOptimizerReturn {
  // Estado
  analyses: BundleAnalysis[];
  currentAnalysis: BundleAnalysis | null;
  settings: OptimizationSettings;
  stats: any;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  
  // Ações principais
  analyzeBundle: () => Promise<BundleAnalysis>;
  optimizeBundle: (recommendations?: string[]) => Promise<boolean>;
  updateSettings: (settings: Partial<OptimizationSettings>) => void;
  
  // Recomendações
  recommendations: OptimizationRecommendation[];
  applyRecommendation: (id: string) => Promise<boolean>;
  applyAllRecommendations: () => Promise<boolean>;
  dismissRecommendation: (id: string) => void;
  
  // Comparação e histórico
  compareAnalyses: (id1: string, id2: string) => ComparisonResult | null;
  getAnalysisHistory: () => BundleAnalysis[];
  clearHistory: () => void;
  
  // Import/Export
  exportAnalysis: (id: string) => string | null;
  importAnalysis: (data: string) => boolean;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
  
  // Agendamento
  scheduleOptimization: (cron: string) => void;
  cancelOptimization: () => void;
  
  // Métricas e estatísticas
  getOptimizationStats: () => any;
  getPerformanceScore: () => number;
  getSizeScore: () => number;
  getOverallScore: () => number;
  
  // Utilitários
  formatSize: (bytes: number) => string;
  formatTime: (ms: number) => string;
  formatPercentage: (value: number) => string;
}

// Hook principal
export const useBundleOptimizer = (options: UseBundleOptimizerOptions = {}): UseBundleOptimizerReturn => {
  const {
    autoAnalyze = false,
    analyzeInterval = 300000, // 5 minutos
    enableRealTimeMonitoring = false,
    performanceThreshold = {},
    sizeThreshold = 1024 * 1024 // 1MB
  } = options;
  
  // Estado do store
  const {
    analyses,
    currentAnalysis,
    settings,
    stats,
    isAnalyzing,
    isOptimizing,
    analyzeBundle: storeAnalyzeBundle,
    optimizeBundle: storeOptimizeBundle,
    updateSettings: storeUpdateSettings,
    getRecommendations,
    applyRecommendation: storeApplyRecommendation,
    compareAnalyses: storeCompareAnalyses,
    exportAnalysis: storeExportAnalysis,
    importAnalysis: storeImportAnalysis,
    clearHistory: storeClearHistory,
    scheduleOptimization: storeScheduleOptimization,
    cancelOptimization: storeCancelOptimization
  } = useBundleOptimizerStore();
  
  // Estado local
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<PerformanceMetrics | null>(null);
  
  // Recomendações filtradas
  const recommendations = getRecommendations().filter(
    rec => !dismissedRecommendations.includes(rec.id)
  );
  
  // Análise automática
  useEffect(() => {
    if (!autoAnalyze) return;
    
    const interval = setInterval(() => {
      storeAnalyzeBundle();
    }, analyzeInterval);
    
    // Análise inicial
    storeAnalyzeBundle();
    
    return () => clearInterval(interval);
  }, [autoAnalyze, analyzeInterval, storeAnalyzeBundle]);
  
  // Monitoramento em tempo real
  useEffect(() => {
    if (!enableRealTimeMonitoring) return;
    
    const monitorPerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0;
        
        const metrics: PerformanceMetrics = {
          firstContentfulPaint: fcp,
          largestContentfulPaint: lcp,
          firstInputDelay: 0, // Seria medido com PerformanceObserver
          cumulativeLayoutShift: 0, // Seria medido com PerformanceObserver
          timeToInteractive: navigation.loadEventEnd - navigation.fetchStart,
          totalBlockingTime: 0, // Seria calculado
          speedIndex: 0 // Seria calculado
        };
        
        setRealTimeMetrics(metrics);
        
        // Verificar thresholds
        checkPerformanceThresholds(metrics);
      }
    };
    
    const interval = setInterval(monitorPerformance, 5000);
    monitorPerformance();
    
    return () => clearInterval(interval);
  }, [enableRealTimeMonitoring, performanceThreshold]);
  
  // Verificar thresholds de performance
  const checkPerformanceThresholds = useCallback((metrics: PerformanceMetrics) => {
    const thresholds = {
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      timeToInteractive: 3800,
      ...performanceThreshold
    };
    
    const violations = Object.entries(thresholds).filter(([key, threshold]) => {
      const value = metrics[key as keyof PerformanceMetrics];
      return typeof value === 'number' && value > threshold;
    });
    
    if (violations.length > 0) {
      console.warn('Performance thresholds exceeded:', violations);
      // Aqui poderia disparar uma análise automática
    }
  }, [performanceThreshold]);
  
  // Ações principais
  const analyzeBundle = useCallback(async () => {
    try {
      const analysis = await storeAnalyzeBundle();
      
      // Verificar threshold de tamanho
      if (analysis.totalSize > sizeThreshold) {
        console.warn(`Bundle size (${analysis.totalSize}) exceeds threshold (${sizeThreshold})`);
      }
      
      return analysis;
    } catch (error) {
      console.error('Erro ao analisar bundle:', error);
      throw error;
    }
  }, [storeAnalyzeBundle, sizeThreshold]);
  
  const optimizeBundle = useCallback(async (recommendationIds?: string[]) => {
    try {
      return await storeOptimizeBundle(recommendationIds);
    } catch (error) {
      console.error('Erro ao otimizar bundle:', error);
      throw error;
    }
  }, [storeOptimizeBundle]);
  
  const updateSettings = useCallback((newSettings: Partial<OptimizationSettings>) => {
    storeUpdateSettings(newSettings);
  }, [storeUpdateSettings]);
  
  // Recomendações
  const applyRecommendation = useCallback(async (id: string) => {
    try {
      const result = await storeApplyRecommendation(id);
      if (result) {
        // Remover da lista de dispensadas se aplicada com sucesso
        setDismissedRecommendations(prev => prev.filter(recId => recId !== id));
      }
      return result;
    } catch (error) {
      console.error('Erro ao aplicar recomendação:', error);
      throw error;
    }
  }, [storeApplyRecommendation]);
  
  const applyAllRecommendations = useCallback(async () => {
    try {
      const automatedRecs = recommendations.filter(rec => rec.automated);
      const results = await Promise.all(
        automatedRecs.map(rec => applyRecommendation(rec.id))
      );
      return results.every(result => result);
    } catch (error) {
      console.error('Erro ao aplicar todas as recomendações:', error);
      return false;
    }
  }, [recommendations, applyRecommendation]);
  
  const dismissRecommendation = useCallback((id: string) => {
    setDismissedRecommendations(prev => [...prev, id]);
  }, []);
  
  // Comparação e histórico
  const compareAnalyses = useCallback((id1: string, id2: string) => {
    try {
      return storeCompareAnalyses(id1, id2);
    } catch (error) {
      console.error('Erro ao comparar análises:', error);
      return null;
    }
  }, [storeCompareAnalyses]);
  
  const getAnalysisHistory = useCallback(() => {
    return analyses.slice().sort((a, b) => b.timestamp - a.timestamp);
  }, [analyses]);
  
  const clearHistory = useCallback(() => {
    storeClearHistory();
    setDismissedRecommendations([]);
  }, [storeClearHistory]);
  
  // Import/Export
  const exportAnalysis = useCallback((id: string) => {
    try {
      return storeExportAnalysis(id);
    } catch (error) {
      console.error('Erro ao exportar análise:', error);
      return null;
    }
  }, [storeExportAnalysis]);
  
  const importAnalysis = useCallback((data: string) => {
    try {
      return storeImportAnalysis(data);
    } catch (error) {
      console.error('Erro ao importar análise:', error);
      return false;
    }
  }, [storeImportAnalysis]);
  
  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);
  
  const importSettings = useCallback((data: string) => {
    try {
      const importedSettings = JSON.parse(data) as OptimizationSettings;
      updateSettings(importedSettings);
      return true;
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      return false;
    }
  }, [updateSettings]);
  
  // Agendamento
  const scheduleOptimization = useCallback((cron: string) => {
    storeScheduleOptimization(cron);
  }, [storeScheduleOptimization]);
  
  const cancelOptimization = useCallback(() => {
    storeCancelOptimization();
  }, [storeCancelOptimization]);
  
  // Métricas e estatísticas
  const getOptimizationStats = useCallback(() => {
    return stats;
  }, [stats]);
  
  const getPerformanceScore = useCallback(() => {
    if (!currentAnalysis) return 0;
    
    const metrics = realTimeMetrics || currentAnalysis.performance;
    const weights = {
      firstContentfulPaint: 0.2,
      largestContentfulPaint: 0.25,
      firstInputDelay: 0.15,
      cumulativeLayoutShift: 0.15,
      timeToInteractive: 0.25
    };
    
    const thresholds = {
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      timeToInteractive: 3800
    };
    
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      const value = metrics[key as keyof PerformanceMetrics];
      const threshold = thresholds[key as keyof typeof thresholds];
      
      if (typeof value === 'number') {
        const ratio = Math.min(value / threshold, 2);
        const metricScore = Math.max(0, 100 - (ratio - 1) * 100);
        score += metricScore * weight;
      }
    });
    
    return Math.round(score);
  }, [currentAnalysis, realTimeMetrics]);
  
  const getSizeScore = useCallback(() => {
    if (!currentAnalysis) return 0;
    
    const targetSize = settings.targetSize;
    const actualSize = currentAnalysis.totalSize;
    
    if (actualSize <= targetSize) return 100;
    
    const ratio = actualSize / targetSize;
    return Math.max(0, Math.round(100 - (ratio - 1) * 50));
  }, [currentAnalysis, settings.targetSize]);
  
  const getOverallScore = useCallback(() => {
    const performanceScore = getPerformanceScore();
    const sizeScore = getSizeScore();
    
    return Math.round((performanceScore * 0.6) + (sizeScore * 0.4));
  }, [getPerformanceScore, getSizeScore]);
  
  // Utilitários
  const formatSize = useCallback((bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);
  
  const formatTime = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }, []);
  
  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);
  
  return {
    // Estado
    analyses,
    currentAnalysis,
    settings,
    stats,
    isAnalyzing,
    isOptimizing,
    
    // Ações principais
    analyzeBundle,
    optimizeBundle,
    updateSettings,
    
    // Recomendações
    recommendations,
    applyRecommendation,
    applyAllRecommendations,
    dismissRecommendation,
    
    // Comparação e histórico
    compareAnalyses,
    getAnalysisHistory,
    clearHistory,
    
    // Import/Export
    exportAnalysis,
    importAnalysis,
    exportSettings,
    importSettings,
    
    // Agendamento
    scheduleOptimization,
    cancelOptimization,
    
    // Métricas e estatísticas
    getOptimizationStats,
    getPerformanceScore,
    getSizeScore,
    getOverallScore,
    
    // Utilitários
    formatSize,
    formatTime,
    formatPercentage
  };
};

// Hook para análise automática
export const useAutoBundleAnalysis = (interval: number = 300000) => {
  const { analyzeBundle, currentAnalysis } = useBundleOptimizer({ autoAnalyze: true, analyzeInterval: interval });
  
  return {
    analyzeBundle,
    currentAnalysis,
    lastAnalysis: currentAnalysis?.timestamp
  };
};

// Hook para monitoramento de performance
export const usePerformanceMonitoring = (thresholds?: Partial<PerformanceMetrics>) => {
  const { getPerformanceScore, getSizeScore, getOverallScore } = useBundleOptimizer({
    enableRealTimeMonitoring: true,
    performanceThreshold: thresholds
  });
  
  const [alerts, setAlerts] = useState<string[]>([]);
  
  const performanceScore = getPerformanceScore();
  const sizeScore = getSizeScore();
  const overallScore = getOverallScore();
  
  useEffect(() => {
    const newAlerts: string[] = [];
    
    if (performanceScore < 50) {
      newAlerts.push('Performance abaixo do esperado');
    }
    
    if (sizeScore < 50) {
      newAlerts.push('Tamanho do bundle muito grande');
    }
    
    if (overallScore < 60) {
      newAlerts.push('Score geral baixo - otimização recomendada');
    }
    
    setAlerts(newAlerts);
  }, [performanceScore, sizeScore, overallScore]);
  
  return {
    performanceScore,
    sizeScore,
    overallScore,
    alerts,
    hasAlerts: alerts.length > 0
  };
};

// Hook para recomendações inteligentes
export const useSmartRecommendations = () => {
  const { recommendations, applyRecommendation, dismissRecommendation } = useBundleOptimizer();
  
  // Ordenar recomendações por prioridade e impacto
  const sortedRecommendations = recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const impactOrder = { high: 3, medium: 2, low: 1 };
    
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    const aImpact = impactOrder[a.impact];
    const bImpact = impactOrder[b.impact];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return bImpact - aImpact;
  });
  
  // Recomendações críticas
  const criticalRecommendations = sortedRecommendations.filter(rec => rec.priority === 'critical');
  
  // Recomendações automatizáveis
  const automatedRecommendations = sortedRecommendations.filter(rec => rec.automated);
  
  // Economia total estimada
  const totalEstimatedSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);
  
  return {
    recommendations: sortedRecommendations,
    criticalRecommendations,
    automatedRecommendations,
    totalEstimatedSavings,
    applyRecommendation,
    dismissRecommendation,
    hasRecommendations: recommendations.length > 0,
    hasCriticalRecommendations: criticalRecommendations.length > 0
  };
};

// Hook para estatísticas de otimização
export const useOptimizationStats = () => {
  const { getOptimizationStats, analyses } = useBundleOptimizer();
  
  const stats = getOptimizationStats();
  
  // Calcular tendências
  const recentAnalyses = analyses.slice(0, 10);
  const sizeTrend = recentAnalyses.length > 1 
    ? recentAnalyses[0].totalSize - recentAnalyses[recentAnalyses.length - 1].totalSize
    : 0;
  
  const performanceTrend = recentAnalyses.length > 1
    ? recentAnalyses[recentAnalyses.length - 1].performance.timeToInteractive - recentAnalyses[0].performance.timeToInteractive
    : 0;
  
  return {
    ...stats,
    sizeTrend,
    performanceTrend,
    averageSize: recentAnalyses.reduce((sum, a) => sum + a.totalSize, 0) / recentAnalyses.length || 0,
    averagePerformance: recentAnalyses.reduce((sum, a) => sum + a.performance.timeToInteractive, 0) / recentAnalyses.length || 0,
    optimizationRate: stats.totalOptimizations / Math.max(analyses.length, 1)
  };
};