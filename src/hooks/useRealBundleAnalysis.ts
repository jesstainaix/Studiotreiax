import { useState, useEffect, useCallback } from 'react';
import { realBundleAnalyzer, type RealBundleMetrics } from '../utils/realPerformanceMetrics';

export interface BundleAnalysisState {
  analysis: RealBundleMetrics | null;
  chunks: RealBundleMetrics['chunks'];
  dependencies: RealBundleMetrics['dependencies'];
  totalSize: number;
  gzippedSize: number;
  isAnalyzing: boolean;
  lastAnalysis: Date | null;
  historicalData: BundleAnalysisHistory[];
  warnings: BundleWarning[];
  suggestions: OptimizationSuggestion[];
}

export interface BundleAnalysisHistory {
  date: Date;
  totalSize: number;
  gzippedSize: number;
  chunkCount: number;
  largestChunk: string;
}

export interface BundleWarning {
  id: string;
  type: 'large-chunk' | 'duplicate-dependency' | 'unused-dependency' | 'missing-optimization';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: string;
  suggestion: string;
  autoFixAvailable: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'code-splitting' | 'tree-shaking' | 'compression' | 'lazy-loading' | 'minification';
  impact: 'low' | 'medium' | 'high';
  estimatedSavings: string;
  description: string;
  implementation: string;
  effort: 'easy' | 'medium' | 'hard';
}

export interface BundleAnalysisActions {
  analyzeBundle: () => Promise<void>;
  analyzeDependencies: () => Promise<void>;
  generateReport: () => string;
  exportData: () => string;
  importData: (data: string) => boolean;
  clearHistory: () => void;
  optimizeBundle: (suggestions: string[]) => Promise<boolean>;
  compareWithHistory: (date: Date) => BundleComparison | null;
}

export interface BundleComparison {
  sizeDiff: number;
  gzippedDiff: number;
  chunkCountDiff: number;
  newChunks: string[];
  removedChunks: string[];
  sizeChanges: Array<{ name: string; oldSize: number; newSize: number; diff: number }>;
}

const STORAGE_KEY = 'real-bundle-analysis-history';
const MAX_HISTORY_ENTRIES = 30;

export function useBundleAnalysis(): { state: BundleAnalysisState; actions: BundleAnalysisActions } {
  const [state, setState] = useState<BundleAnalysisState>({
    analysis: null,
    chunks: [],
    dependencies: [],
    totalSize: 0,
    gzippedSize: 0,
    isAnalyzing: false,
    lastAnalysis: null,
    historicalData: [],
    warnings: [],
    suggestions: []
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const historicalData = JSON.parse(stored).map((item: any) => ({
          ...item,
          date: new Date(item.date)
        }));
        setState(prev => ({ ...prev, historicalData }));
      }
    } catch (error) {
      console.error('Failed to load bundle analysis history:', error);
    }
  }, []);

  const saveToHistory = useCallback((analysis: RealBundleMetrics) => {
    const historyEntry: BundleAnalysisHistory = {
      date: new Date(),
      totalSize: analysis.totalSize,
      gzippedSize: analysis.gzippedSize,
      chunkCount: analysis.chunks.length,
      largestChunk: analysis.chunks.reduce((largest, chunk) => 
        chunk.size > largest.size ? chunk : largest, analysis.chunks[0]
      )?.name || 'unknown'
    };

    setState(prev => {
      const newHistory = [historyEntry, ...prev.historicalData]
        .slice(0, MAX_HISTORY_ENTRIES);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save bundle analysis history:', error);
      }

      return { ...prev, historicalData: newHistory };
    });
  }, []);

  const generateWarnings = useCallback((analysis: RealBundleMetrics): BundleWarning[] => {
    const warnings: BundleWarning[] = [];

    analysis.chunks.forEach(chunk => {
      if (chunk.size > 500000) { // 500KB
        warnings.push({
          id: `large-chunk-${chunk.name}`,
          type: 'large-chunk',
          severity: chunk.size > 1000000 ? 'high' : 'medium',
          message: `Chunk muito grande: ${chunk.name}`,
          details: `O chunk ${chunk.name} tem ${(chunk.size / 1024).toFixed(0)}KB.`,
          suggestion: 'Considere dividir este chunk ou aplicar lazy loading.',
          autoFixAvailable: false
        });
      }
    });

    if (analysis.duplicates.length > 0) {
      warnings.push({
        id: 'duplicate-dependencies',
        type: 'duplicate-dependency',
        severity: 'medium',
        message: `${analysis.duplicates.length} dependências duplicadas encontradas`,
        details: `Dependências duplicadas: ${analysis.duplicates.map(d => d.module).join(', ')}`,
        suggestion: 'Configure webpack para remover duplicatas.',
        autoFixAvailable: true
      });
    }

    if (analysis.totalSize > 2000000) {
      warnings.push({
        id: 'large-bundle',
        type: 'large-chunk',
        severity: 'high',
        message: 'Bundle total muito grande',
        details: `O bundle total tem ${(analysis.totalSize / 1024 / 1024).toFixed(1)}MB.`,
        suggestion: 'Implemente code splitting e lazy loading.',
        autoFixAvailable: false
      });
    }

    return warnings;
  }, []);

  const generateSuggestions = useCallback((analysis: RealBundleMetrics): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    if (analysis.chunks.length < 5 && analysis.totalSize > 1000000) {
      suggestions.push({
        id: 'code-splitting',
        type: 'code-splitting',
        impact: 'high',
        estimatedSavings: '30-50% do bundle inicial',
        description: 'Implemente code splitting para carregar componentes sob demanda',
        implementation: 'Use React.lazy() e Suspense para componentes grandes',
        effort: 'medium'
      });
    }

    const largeLibraries = analysis.dependencies.filter(dep => dep.size > 100000);
    if (largeLibraries.length > 0) {
      suggestions.push({
        id: 'tree-shaking',
        type: 'tree-shaking',
        impact: 'medium',
        estimatedSavings: '10-25% das bibliotecas',
        description: 'Configure tree shaking para remover código não utilizado',
        implementation: 'Configure babel-plugin-import e otimize imports',
        effort: 'easy'
      });
    }

    if (analysis.gzippedSize / analysis.totalSize > 0.7) {
      suggestions.push({
        id: 'compression',
        type: 'compression',
        impact: 'medium',
        estimatedSavings: '20-40% do tamanho',
        description: 'Melhore a compressão dos assets',
        implementation: 'Configure Brotli compression e otimize algoritmos',
        effort: 'easy'
      });
    }

    return suggestions;
  }, []);

  const analyzeBundle = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    
    try {
      const analysis = await realBundleAnalyzer.analyzeBundleSize();
      const warnings = generateWarnings(analysis);
      const suggestions = generateSuggestions(analysis);
      
      setState(prev => ({
        ...prev,
        analysis,
        chunks: analysis.chunks,
        dependencies: analysis.dependencies,
        totalSize: analysis.totalSize,
        gzippedSize: analysis.gzippedSize,
        lastAnalysis: new Date(),
        warnings,
        suggestions,
        isAnalyzing: false
      }));

      saveToHistory(analysis);
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [generateWarnings, generateSuggestions, saveToHistory]);

  const analyzeDependencies = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    
    try {
      const analysis = await realBundleAnalyzer.analyzeBundleSize();
      setState(prev => ({
        ...prev,
        dependencies: analysis.dependencies,
        isAnalyzing: false
      }));
    } catch (error) {
      console.error('Dependency analysis failed:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const generateReport = useCallback(() => {
    if (!state.analysis) return '';

    const report = {
      timestamp: new Date().toISOString(),
      analysis: state.analysis,
      warnings: state.warnings,
      suggestions: state.suggestions,
      historicalData: state.historicalData.slice(0, 10)
    };

    return JSON.stringify(report, null, 2);
  }, [state]);

  const exportData = useCallback(() => {
    return JSON.stringify({
      ...state,
      lastAnalysis: state.lastAnalysis?.toISOString()
    }, null, 2);
  }, [state]);

  const importData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      setState({
        ...parsed,
        lastAnalysis: parsed.lastAnalysis ? new Date(parsed.lastAnalysis) : null,
        historicalData: parsed.historicalData?.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        })) || []
      });
      return true;
    } catch (error) {
      console.error('Failed to import bundle analysis data:', error);
      return false;
    }
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, historicalData: [] }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const optimizeBundle = useCallback(async (suggestionIds: string[]): Promise<boolean> => {
    await analyzeBundle();
    return true;
  }, [analyzeBundle]);

  const compareWithHistory = useCallback((date: Date): BundleComparison | null => {
    const historical = state.historicalData.find(entry => 
      entry.date.toDateString() === date.toDateString()
    );
    
    if (!historical || !state.analysis) return null;

    return {
      sizeDiff: state.analysis.totalSize - historical.totalSize,
      gzippedDiff: state.analysis.gzippedSize - historical.gzippedSize,
      chunkCountDiff: state.analysis.chunks.length - historical.chunkCount,
      newChunks: [],
      removedChunks: [],
      sizeChanges: []
    };
  }, [state.analysis, state.historicalData]);

  return {
    state,
    actions: {
      analyzeBundle,
      analyzeDependencies,
      generateReport,
      exportData,
      importData,
      clearHistory,
      optimizeBundle,
      compareWithHistory
    }
  };
}