// Sistema avançado de otimização de bundle
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interfaces
export interface BundleAnalysis {
  id: string;
  timestamp: number;
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  duplicates: DuplicateInfo[];
  unusedCode: UnusedCodeInfo[];
  recommendations: OptimizationRecommendation[];
  performance: PerformanceMetrics;
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  loadTime: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'entry' | 'vendor' | 'async' | 'runtime';
}

export interface ModuleInfo {
  name: string;
  size: number;
  imports: string[];
  exports: string[];
  usageCount: number;
  lastUsed: number;
  isTreeShakeable: boolean;
  sideEffects: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usagePercentage: number;
  alternatives: AlternativeInfo[];
  isEssential: boolean;
  lastUpdated: number;
  vulnerabilities: VulnerabilityInfo[];
}

export interface DuplicateInfo {
  module: string;
  instances: string[];
  totalWastedSize: number;
  canBeDeduplicated: boolean;
}

export interface UnusedCodeInfo {
  file: string;
  functions: string[];
  classes: string[];
  variables: string[];
  estimatedSavings: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'code-splitting' | 'tree-shaking' | 'compression' | 'lazy-loading' | 'dependency';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementation: string;
  automated: boolean;
}

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
}

export interface AlternativeInfo {
  name: string;
  size: number;
  features: string[];
  compatibility: number;
  popularity: number;
}

export interface VulnerabilityInfo {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fixedIn?: string;
}

export interface OptimizationSettings {
  autoOptimize: boolean;
  targetSize: number;
  compressionLevel: 'none' | 'basic' | 'aggressive';
  treeshakingMode: 'conservative' | 'aggressive';
  codeSplittingStrategy: 'route' | 'vendor' | 'granular' | 'hybrid';
  enablePreloading: boolean;
  enablePrefetching: boolean;
  enableServiceWorker: boolean;
  enableBrotli: boolean;
  enableGzip: boolean;
  minifyOptions: MinifyOptions;
}

export interface MinifyOptions {
  removeComments: boolean;
  removeWhitespace: boolean;
  mangleNames: boolean;
  optimizeConstants: boolean;
  removeDeadCode: boolean;
  inlineSmallModules: boolean;
}

export interface OptimizationStats {
  totalOptimizations: number;
  sizeSaved: number;
  performanceGain: number;
  lastOptimization: number;
  optimizationHistory: OptimizationRecord[];
}

export interface OptimizationRecord {
  id: string;
  timestamp: number;
  type: string;
  sizeBefore: number;
  sizeAfter: number;
  performanceBefore: PerformanceMetrics;
  performanceAfter: PerformanceMetrics;
  success: boolean;
  error?: string;
}

// Store do Zustand
interface BundleOptimizerStore {
  // Estado
  analyses: BundleAnalysis[];
  currentAnalysis: BundleAnalysis | null;
  settings: OptimizationSettings;
  stats: OptimizationStats;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  
  // Ações
  analyzeBundle: () => Promise<BundleAnalysis>;
  optimizeBundle: (recommendations?: string[]) => Promise<boolean>;
  updateSettings: (settings: Partial<OptimizationSettings>) => void;
  getRecommendations: () => OptimizationRecommendation[];
  applyRecommendation: (id: string) => Promise<boolean>;
  compareAnalyses: (id1: string, id2: string) => ComparisonResult;
  exportAnalysis: (id: string) => string;
  importAnalysis: (data: string) => boolean;
  clearHistory: () => void;
  scheduleOptimization: (cron: string) => void;
  cancelOptimization: () => void;
}

export interface ComparisonResult {
  sizeDifference: number;
  performanceDifference: Partial<PerformanceMetrics>;
  newRecommendations: OptimizationRecommendation[];
  resolvedIssues: string[];
}

// Store
export const useBundleOptimizerStore = create<BundleOptimizerStore>()(persist(
  (set, get) => ({
    // Estado inicial
    analyses: [],
    currentAnalysis: null,
    settings: {
      autoOptimize: false,
      targetSize: 1024 * 1024, // 1MB
      compressionLevel: 'basic',
      treeshakingMode: 'conservative',
      codeSplittingStrategy: 'hybrid',
      enablePreloading: true,
      enablePrefetching: true,
      enableServiceWorker: true,
      enableBrotli: true,
      enableGzip: true,
      minifyOptions: {
        removeComments: true,
        removeWhitespace: true,
        mangleNames: true,
        optimizeConstants: true,
        removeDeadCode: true,
        inlineSmallModules: true
      }
    },
    stats: {
      totalOptimizations: 0,
      sizeSaved: 0,
      performanceGain: 0,
      lastOptimization: 0,
      optimizationHistory: []
    },
    isAnalyzing: false,
    isOptimizing: false,
    
    // Implementações
    analyzeBundle: async () => {
      set({ isAnalyzing: true });
      
      try {
        const analysis = await BundleOptimizerManager.analyzeBundle();
        
        set(state => ({
          analyses: [analysis, ...state.analyses.slice(0, 9)],
          currentAnalysis: analysis,
          isAnalyzing: false
        }));
        
        return analysis;
      } catch (error) {
        set({ isAnalyzing: false });
        throw error;
      }
    },
    
    optimizeBundle: async (recommendations) => {
      const { currentAnalysis, settings } = get();
      if (!currentAnalysis) return false;
      
      set({ isOptimizing: true });
      
      try {
        const result = await BundleOptimizerManager.optimizeBundle(
          currentAnalysis,
          settings,
          recommendations
        );
        
        if (result.success) {
          set(state => ({
            stats: {
              ...state.stats,
              totalOptimizations: state.stats.totalOptimizations + 1,
              sizeSaved: state.stats.sizeSaved + result.sizeSaved,
              performanceGain: state.stats.performanceGain + result.performanceGain,
              lastOptimization: Date.now(),
              optimizationHistory: [result.record, ...state.stats.optimizationHistory.slice(0, 49)]
            },
            isOptimizing: false
          }));
        }
        
        return result.success;
      } catch (error) {
        set({ isOptimizing: false });
        throw error;
      }
    },
    
    updateSettings: (newSettings) => {
      set(state => ({
        settings: { ...state.settings, ...newSettings }
      }));
    },
    
    getRecommendations: () => {
      const { currentAnalysis } = get();
      return currentAnalysis?.recommendations || [];
    },
    
    applyRecommendation: async (id) => {
      const { currentAnalysis } = get();
      if (!currentAnalysis) return false;
      
      const recommendation = currentAnalysis.recommendations.find(r => r.id === id);
      if (!recommendation) return false;
      
      return await BundleOptimizerManager.applyRecommendation(recommendation);
    },
    
    compareAnalyses: (id1, id2) => {
      const { analyses } = get();
      const analysis1 = analyses.find(a => a.id === id1);
      const analysis2 = analyses.find(a => a.id === id2);
      
      if (!analysis1 || !analysis2) {
        throw new Error('Análises não encontradas');
      }
      
      return BundleOptimizerManager.compareAnalyses(analysis1, analysis2);
    },
    
    exportAnalysis: (id) => {
      const { analyses } = get();
      const analysis = analyses.find(a => a.id === id);
      
      if (!analysis) {
        throw new Error('Análise não encontrada');
      }
      
      return JSON.stringify(analysis, null, 2);
    },
    
    importAnalysis: (data) => {
      try {
        const analysis = JSON.parse(data) as BundleAnalysis;
        
        set(state => ({
          analyses: [analysis, ...state.analyses]
        }));
        
        return true;
      } catch {
        return false;
      }
    },
    
    clearHistory: () => {
      set({
        analyses: [],
        currentAnalysis: null,
        stats: {
          totalOptimizations: 0,
          sizeSaved: 0,
          performanceGain: 0,
          lastOptimization: 0,
          optimizationHistory: []
        }
      });
    },
    
    scheduleOptimization: (cron) => {
      BundleOptimizerManager.scheduleOptimization(cron, get().optimizeBundle);
    },
    
    cancelOptimization: () => {
      BundleOptimizerManager.cancelScheduledOptimization();
    }
  }),
  {
    name: 'bundle-optimizer-store',
    partialize: (state) => ({
      analyses: state.analyses,
      settings: state.settings,
      stats: state.stats
    })
  }
));

// Classe principal do otimizador
class BundleOptimizerManager {
  private static scheduledOptimization: NodeJS.Timeout | null = null;
  
  // Analisar bundle
  static async analyzeBundle(): Promise<BundleAnalysis> {
    const analysis: BundleAnalysis = {
      id: `analysis-${Date.now()}`,
      timestamp: Date.now(),
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      dependencies: [],
      duplicates: [],
      unusedCode: [],
      recommendations: [],
      performance: {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0,
        speedIndex: 0
      }
    };
    
    // Simular análise de chunks
    analysis.chunks = await this.analyzeChunks();
    analysis.totalSize = analysis.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    analysis.gzippedSize = analysis.chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
    
    // Analisar dependências
    analysis.dependencies = await this.analyzeDependencies();
    
    // Detectar duplicatas
    analysis.duplicates = await this.detectDuplicates();
    
    // Detectar código não utilizado
    analysis.unusedCode = await this.detectUnusedCode();
    
    // Gerar recomendações
    analysis.recommendations = await this.generateRecommendations(analysis);
    
    // Medir performance
    analysis.performance = await this.measurePerformance();
    
    return analysis;
  }
  
  // Analisar chunks
  private static async analyzeChunks(): Promise<ChunkInfo[]> {
    // Simular análise de chunks
    return [
      {
        name: 'main',
        size: 512000,
        gzippedSize: 128000,
        modules: [],
        loadTime: 150,
        priority: 'critical',
        type: 'entry'
      },
      {
        name: 'vendor',
        size: 1024000,
        gzippedSize: 256000,
        modules: [],
        loadTime: 300,
        priority: 'high',
        type: 'vendor'
      },
      {
        name: 'components',
        size: 256000,
        gzippedSize: 64000,
        modules: [],
        loadTime: 100,
        priority: 'medium',
        type: 'async'
      }
    ];
  }
  
  // Analisar dependências
  private static async analyzeDependencies(): Promise<DependencyInfo[]> {
    // Simular análise de dependências
    return [
      {
        name: 'react',
        version: '18.2.0',
        size: 42000,
        usagePercentage: 95,
        alternatives: [],
        isEssential: true,
        lastUpdated: Date.now() - 86400000,
        vulnerabilities: []
      },
      {
        name: 'lodash',
        version: '4.17.21',
        size: 71000,
        usagePercentage: 15,
        alternatives: [
          {
            name: 'lodash-es',
            size: 25000,
            features: ['tree-shakeable'],
            compatibility: 100,
            popularity: 85
          }
        ],
        isEssential: false,
        lastUpdated: Date.now() - 2592000000,
        vulnerabilities: []
      }
    ];
  }
  
  // Detectar duplicatas
  private static async detectDuplicates(): Promise<DuplicateInfo[]> {
    return [
      {
        module: 'moment',
        instances: ['node_modules/moment', 'node_modules/react-datepicker/node_modules/moment'],
        totalWastedSize: 67000,
        canBeDeduplicated: true
      }
    ];
  }
  
  // Detectar código não utilizado
  private static async detectUnusedCode(): Promise<UnusedCodeInfo[]> {
    return [
      {
        file: 'src/utils/helpers.ts',
        functions: ['unusedFunction1', 'unusedFunction2'],
        classes: ['UnusedClass'],
        variables: ['UNUSED_CONSTANT'],
        estimatedSavings: 5000
      }
    ];
  }
  
  // Gerar recomendações
  private static async generateRecommendations(analysis: BundleAnalysis): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Recomendação para code splitting
    if (analysis.totalSize > 1024000) {
      recommendations.push({
        id: 'code-splitting-1',
        type: 'code-splitting',
        priority: 'high',
        title: 'Implementar Code Splitting',
        description: 'Bundle muito grande. Divida em chunks menores para melhor performance.',
        estimatedSavings: 300000,
        effort: 'medium',
        impact: 'high',
        implementation: 'Use dynamic imports para componentes de rota',
        automated: false
      });
    }
    
    // Recomendação para tree shaking
    if (analysis.unusedCode.length > 0) {
      const totalSavings = analysis.unusedCode.reduce((sum, code) => sum + code.estimatedSavings, 0);
      recommendations.push({
        id: 'tree-shaking-1',
        type: 'tree-shaking',
        priority: 'medium',
        title: 'Remover Código Não Utilizado',
        description: 'Código não utilizado detectado. Remova para reduzir o tamanho do bundle.',
        estimatedSavings: totalSavings,
        effort: 'low',
        impact: 'medium',
        implementation: 'Configure tree shaking no bundler e remova imports não utilizados',
        automated: true
      });
    }
    
    // Recomendação para dependências
    const heavyDeps = analysis.dependencies.filter(dep => dep.size > 50000 && dep.usagePercentage < 50);
    if (heavyDeps.length > 0) {
      recommendations.push({
        id: 'dependency-1',
        type: 'dependency',
        priority: 'high',
        title: 'Otimizar Dependências Pesadas',
        description: 'Dependências pesadas com baixo uso detectadas. Considere alternativas.',
        estimatedSavings: heavyDeps.reduce((sum, dep) => sum + dep.size * 0.7, 0),
        effort: 'medium',
        impact: 'high',
        implementation: 'Substitua por alternativas menores ou implemente lazy loading',
        automated: false
      });
    }
    
    // Recomendação para duplicatas
    if (analysis.duplicates.length > 0) {
      const totalWasted = analysis.duplicates.reduce((sum, dup) => sum + dup.totalWastedSize, 0);
      recommendations.push({
        id: 'deduplication-1',
        type: 'compression',
        priority: 'medium',
        title: 'Remover Duplicatas',
        description: 'Módulos duplicados detectados. Configure deduplicação.',
        estimatedSavings: totalWasted,
        effort: 'low',
        impact: 'medium',
        implementation: 'Configure resolve.alias no bundler para evitar duplicatas',
        automated: true
      });
    }
    
    return recommendations;
  }
  
  // Medir performance
  private static async measurePerformance(): Promise<PerformanceMetrics> {
    // Simular métricas de performance
    return {
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      timeToInteractive: 3000,
      totalBlockingTime: 300,
      speedIndex: 2000
    };
  }
  
  // Otimizar bundle
  static async optimizeBundle(
    analysis: BundleAnalysis,
    settings: OptimizationSettings,
    recommendationIds?: string[]
  ): Promise<{ success: boolean; sizeSaved: number; performanceGain: number; record: OptimizationRecord }> {
    const startTime = Date.now();
    const sizeBefore = analysis.totalSize;
    const performanceBefore = analysis.performance;
    
    try {
      let sizeSaved = 0;
      
      // Aplicar recomendações específicas ou todas
      const recommendations = recommendationIds
        ? analysis.recommendations.filter(r => recommendationIds.includes(r.id))
        : analysis.recommendations.filter(r => r.automated);
      
      for (const recommendation of recommendations) {
        const applied = await this.applyRecommendation(recommendation);
        if (applied) {
          sizeSaved += recommendation.estimatedSavings;
        }
      }
      
      // Aplicar configurações de minificação
      if (settings.minifyOptions.removeComments) {
        sizeSaved += sizeBefore * 0.02; // 2% de economia
      }
      
      if (settings.minifyOptions.removeWhitespace) {
        sizeSaved += sizeBefore * 0.05; // 5% de economia
      }
      
      if (settings.minifyOptions.mangleNames) {
        sizeSaved += sizeBefore * 0.08; // 8% de economia
      }
      
      // Aplicar compressão
      if (settings.enableGzip) {
        sizeSaved += sizeBefore * 0.3; // 30% de economia com gzip
      }
      
      if (settings.enableBrotli) {
        sizeSaved += sizeBefore * 0.1; // 10% adicional com brotli
      }
      
      // Simular métricas de performance após otimização
      const performanceAfter: PerformanceMetrics = {
        firstContentfulPaint: performanceBefore.firstContentfulPaint * 0.8,
        largestContentfulPaint: performanceBefore.largestContentfulPaint * 0.75,
        firstInputDelay: performanceBefore.firstInputDelay * 0.9,
        cumulativeLayoutShift: performanceBefore.cumulativeLayoutShift,
        timeToInteractive: performanceBefore.timeToInteractive * 0.7,
        totalBlockingTime: performanceBefore.totalBlockingTime * 0.6,
        speedIndex: performanceBefore.speedIndex * 0.8
      };
      
      const performanceGain = (
        (performanceBefore.timeToInteractive - performanceAfter.timeToInteractive) /
        performanceBefore.timeToInteractive
      ) * 100;
      
      const record: OptimizationRecord = {
        id: `optimization-${Date.now()}`,
        timestamp: startTime,
        type: 'bundle-optimization',
        sizeBefore,
        sizeAfter: sizeBefore - sizeSaved,
        performanceBefore,
        performanceAfter,
        success: true
      };
      
      return {
        success: true,
        sizeSaved,
        performanceGain,
        record
      };
    } catch (error) {
      const record: OptimizationRecord = {
        id: `optimization-${Date.now()}`,
        timestamp: startTime,
        type: 'bundle-optimization',
        sizeBefore,
        sizeAfter: sizeBefore,
        performanceBefore,
        performanceAfter: performanceBefore,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      return {
        success: false,
        sizeSaved: 0,
        performanceGain: 0,
        record
      };
    }
  }
  
  // Aplicar recomendação
  static async applyRecommendation(recommendation: OptimizationRecommendation): Promise<boolean> {
    // Simular aplicação de recomendação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (recommendation.type) {
      case 'tree-shaking':
        // Implementar tree shaking
        return true;
      
      case 'code-splitting':
        // Implementar code splitting
        return true;
      
      case 'compression':
        // Aplicar compressão
        return true;
      
      case 'lazy-loading':
        // Implementar lazy loading
        return true;
      
      case 'dependency':
        // Otimizar dependências
        return true;
      
      default:
        return false;
    }
  }
  
  // Comparar análises
  static compareAnalyses(analysis1: BundleAnalysis, analysis2: BundleAnalysis): ComparisonResult {
    const sizeDifference = analysis2.totalSize - analysis1.totalSize;
    
    const performanceDifference: Partial<PerformanceMetrics> = {
      firstContentfulPaint: analysis2.performance.firstContentfulPaint - analysis1.performance.firstContentfulPaint,
      largestContentfulPaint: analysis2.performance.largestContentfulPaint - analysis1.performance.largestContentfulPaint,
      timeToInteractive: analysis2.performance.timeToInteractive - analysis1.performance.timeToInteractive
    };
    
    const newRecommendations = analysis2.recommendations.filter(
      r2 => !analysis1.recommendations.some(r1 => r1.id === r2.id)
    );
    
    const resolvedIssues = analysis1.recommendations
      .filter(r1 => !analysis2.recommendations.some(r2 => r2.id === r1.id))
      .map(r => r.title);
    
    return {
      sizeDifference,
      performanceDifference,
      newRecommendations,
      resolvedIssues
    };
  }
  
  // Agendar otimização
  static scheduleOptimization(cron: string, optimizeFunction: () => Promise<boolean>) {
    // Implementação simplificada - em produção usaria uma biblioteca como node-cron
    const interval = this.parseCronToInterval(cron);
    
    if (this.scheduledOptimization) {
      clearInterval(this.scheduledOptimization);
    }
    
    this.scheduledOptimization = setInterval(() => {
      optimizeFunction();
    }, interval);
  }
  
  // Cancelar otimização agendada
  static cancelScheduledOptimization() {
    if (this.scheduledOptimization) {
      clearInterval(this.scheduledOptimization);
      this.scheduledOptimization = null;
    }
  }
  
  // Converter cron para intervalo (implementação simplificada)
  private static parseCronToInterval(cron: string): number {
    // Implementação básica - em produção seria mais robusta
    if (cron === '0 0 * * *') return 24 * 60 * 60 * 1000; // Diário
    if (cron === '0 * * * *') return 60 * 60 * 1000; // Hourly
    return 60 * 60 * 1000; // Default: hourly
  }
}

// Instância global
export const bundleOptimizer = BundleOptimizerManager;

// Funções utilitárias
export const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#ca8a04';
    case 'low': return '#16a34a';
    default: return '#6b7280';
  }
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'code-splitting': return '#3b82f6';
    case 'tree-shaking': return '#10b981';
    case 'compression': return '#8b5cf6';
    case 'lazy-loading': return '#f59e0b';
    case 'dependency': return '#ef4444';
    default: return '#6b7280';
  }
};

export const getEffortIcon = (effort: string): string => {
  switch (effort) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🔴';
    default: return '⚪';
  }
};

export const getImpactIcon = (impact: string): string => {
  switch (impact) {
    case 'low': return '📉';
    case 'medium': return '📊';
    case 'high': return '📈';
    default: return '📋';
  }
};