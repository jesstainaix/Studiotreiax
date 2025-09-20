import { useState, useEffect, useCallback, useRef } from 'react';

// Interfaces para métricas de performance
export interface WebVitalsMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

export interface PerformanceMetrics {
  webVitals: WebVitalsMetrics;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  networkMetrics: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  };
  bundleSize: {
    js: number;
    css: number;
    images: number;
    total: number;
  };
  cacheHitRate: number;
  timestamp: number;
}

export interface PerformanceIssue {
  id: string;
  type: 'memory-leak' | 'slow-render' | 'large-bundle' | 'cache-miss' | 'layout-shift' | 'slow-network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  suggestion: string;
  autoFixAvailable: boolean;
  detectedAt: number;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'code-splitting' | 'lazy-loading' | 'caching' | 'compression' | 'minification' | 'preloading';
  title: string;
  description: string;
  expectedImprovement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  implemented: boolean;
}

export interface PerformanceBudget {
  id: string;
  metric: keyof WebVitalsMetrics | 'bundle-size' | 'memory-usage';
  threshold: number;
  current: number;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    config: Record<string, any>;
    traffic: number;
  }[];
  metrics: string[];
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate?: Date;
  endDate?: Date;
}

export interface PerformanceReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    overallScore: number;
    improvementAreas: string[];
    achievements: string[];
  };
  metrics: PerformanceMetrics[];
  issues: PerformanceIssue[];
  suggestions: OptimizationSuggestion[];
  budgets: PerformanceBudget[];
  generatedAt: Date;
}

export interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    interval: number;
    autoOptimize: boolean;
    alertThresholds: {
      fcp: number;
      lcp: number;
      fid: number;
      cls: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
  optimization: {
    codeSplitting: boolean;
    lazyLoading: boolean;
    imageOptimization: boolean;
    caching: boolean;
    compression: boolean;
    preloading: boolean;
  };
  reporting: {
    autoGenerate: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

const defaultConfig: PerformanceConfig = {
  monitoring: {
    enabled: true,
    interval: 5000,
    autoOptimize: false,
    alertThresholds: {
      fcp: 2000,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      memoryUsage: 80,
      cpuUsage: 70
    }
  },
  optimization: {
    codeSplitting: true,
    lazyLoading: true,
    imageOptimization: true,
    caching: true,
    compression: true,
    preloading: false
  },
  reporting: {
    autoGenerate: true,
    frequency: 'weekly',
    recipients: []
  }
};

export const usePerformanceOptimization = () => {
  // Estados principais
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [budgets, setBudgets] = useState<PerformanceBudget[]>([]);
  const [abTests, setAbTests] = useState<ABTestConfig[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [config, setConfig] = useState<PerformanceConfig>(defaultConfig);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Refs para controle
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const memoryMonitor = useRef<NodeJS.Timeout | null>(null);

  // Função para coletar Web Vitals
  const collectWebVitals = useCallback((): Promise<WebVitalsMetrics> => {
    return new Promise((resolve) => {
      const vitals: WebVitalsMetrics = {
        fcp: null,
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null
      };

      // Coletar métricas de navegação
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // Coletar FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }

      // Observer para LCP
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observer para CLS
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Observer para FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      }

      // Simular coleta (para desenvolvimento)
      setTimeout(() => {
        if (!vitals.fcp) vitals.fcp = Math.random() * 3000 + 500;
        if (!vitals.lcp) vitals.lcp = Math.random() * 4000 + 1000;
        if (!vitals.fid) vitals.fid = Math.random() * 200 + 10;
        if (!vitals.cls) vitals.cls = Math.random() * 0.3;
        if (!vitals.ttfb) vitals.ttfb = Math.random() * 1000 + 100;
        resolve(vitals);
      }, 1000);
    });
  }, []);

  // Função para monitorar memória
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    // Simulação para desenvolvimento
    const used = Math.random() * 50000000 + 10000000;
    const total = 100000000;
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }, []);

  // Função para monitorar CPU (simulado)
  const getCPUUsage = useCallback(() => {
    // Em um ambiente real, isso seria obtido através de APIs específicas
    return Math.random() * 100;
  }, []);

  // Função para coletar métricas de rede
  const getNetworkMetrics = useCallback(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      return {
        downloadSpeed: connection.downlink || 0,
        uploadSpeed: connection.uplink || 0,
        latency: connection.rtt || 0
      };
    }
    // Simulação
    return {
      downloadSpeed: Math.random() * 100 + 10,
      uploadSpeed: Math.random() * 50 + 5,
      latency: Math.random() * 100 + 20
    };
  }, []);

  // Função para analisar tamanho do bundle
  const getBundleSize = useCallback(() => {
    // Em um ambiente real, isso seria obtido através de análise do webpack/vite
    return {
      js: Math.random() * 1000000 + 500000,
      css: Math.random() * 200000 + 50000,
      images: Math.random() * 2000000 + 1000000,
      total: 0
    };
  }, []);

  // Função para coletar todas as métricas
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const webVitals = await collectWebVitals();
    const memoryUsage = getMemoryUsage();
    const cpuUsage = getCPUUsage();
    const networkMetrics = getNetworkMetrics();
    const bundleSize = getBundleSize();
    bundleSize.total = bundleSize.js + bundleSize.css + bundleSize.images;

    return {
      webVitals,
      memoryUsage,
      cpuUsage,
      networkMetrics,
      bundleSize,
      cacheHitRate: Math.random() * 100,
      timestamp: Date.now()
    };
  }, [collectWebVitals, getMemoryUsage, getCPUUsage, getNetworkMetrics, getBundleSize]);

  // Função para detectar problemas
  const detectIssues = useCallback((metrics: PerformanceMetrics): PerformanceIssue[] => {
    const issues: PerformanceIssue[] = [];
    const { webVitals, memoryUsage, cpuUsage, bundleSize } = metrics;

    // Verificar Web Vitals
    if (webVitals.lcp && webVitals.lcp > config.monitoring.alertThresholds.lcp) {
      issues.push({
        id: `lcp-${Date.now()}`,
        type: 'slow-render',
        severity: webVitals.lcp > 4000 ? 'critical' : 'high',
        title: 'LCP muito alto',
        description: `Largest Contentful Paint está em ${webVitals.lcp.toFixed(0)}ms`,
        impact: 'Usuários podem abandonar a página devido ao carregamento lento',
        suggestion: 'Otimize imagens, use lazy loading e melhore o cache',
        autoFixAvailable: true,
        detectedAt: Date.now()
      });
    }

    if (webVitals.cls && webVitals.cls > config.monitoring.alertThresholds.cls) {
      issues.push({
        id: `cls-${Date.now()}`,
        type: 'layout-shift',
        severity: webVitals.cls > 0.25 ? 'critical' : 'high',
        title: 'Layout Shift detectado',
        description: `CLS está em ${webVitals.cls.toFixed(3)}`,
        impact: 'Experiência do usuário prejudicada por mudanças inesperadas no layout',
        suggestion: 'Defina dimensões para imagens e evite inserção dinâmica de conteúdo',
        autoFixAvailable: false,
        detectedAt: Date.now()
      });
    }

    // Verificar uso de memória
    if (memoryUsage.percentage > config.monitoring.alertThresholds.memoryUsage) {
      issues.push({
        id: `memory-${Date.now()}`,
        type: 'memory-leak',
        severity: memoryUsage.percentage > 90 ? 'critical' : 'high',
        title: 'Alto uso de memória',
        description: `Uso de memória em ${memoryUsage.percentage.toFixed(1)}%`,
        impact: 'Pode causar travamentos e lentidão na aplicação',
        suggestion: 'Verifique vazamentos de memória e otimize o gerenciamento de estado',
        autoFixAvailable: false,
        detectedAt: Date.now()
      });
    }

    // Verificar tamanho do bundle
    if (bundleSize.total > 2000000) { // 2MB
      issues.push({
        id: `bundle-${Date.now()}`,
        type: 'large-bundle',
        severity: bundleSize.total > 5000000 ? 'critical' : 'medium',
        title: 'Bundle muito grande',
        description: `Tamanho total do bundle: ${(bundleSize.total / 1024 / 1024).toFixed(2)}MB`,
        impact: 'Tempo de carregamento inicial aumentado',
        suggestion: 'Implemente code splitting e lazy loading',
        autoFixAvailable: true,
        detectedAt: Date.now()
      });
    }

    return issues;
  }, [config.monitoring.alertThresholds]);

  // Função para gerar sugestões
  const generateSuggestions = useCallback((metrics: PerformanceMetrics): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // Sugestões baseadas nas métricas
    if (metrics.webVitals.lcp && metrics.webVitals.lcp > 2500) {
      suggestions.push({
        id: 'lazy-loading',
        category: 'lazy-loading',
        title: 'Implementar Lazy Loading',
        description: 'Carregue imagens e componentes apenas quando necessário',
        expectedImprovement: 'Redução de 20-40% no LCP',
        difficulty: 'easy',
        estimatedTime: '2-4 horas',
        implemented: false
      });
    }

    if (metrics.bundleSize.total > 1000000) {
      suggestions.push({
        id: 'code-splitting',
        category: 'code-splitting',
        title: 'Code Splitting',
        description: 'Divida o código em chunks menores para carregamento sob demanda',
        expectedImprovement: 'Redução de 30-50% no tempo de carregamento inicial',
        difficulty: 'medium',
        estimatedTime: '4-8 horas',
        implemented: false
      });
    }

    if (metrics.cacheHitRate < 80) {
      suggestions.push({
        id: 'cache-optimization',
        category: 'caching',
        title: 'Otimizar Cache',
        description: 'Melhore as estratégias de cache para recursos estáticos',
        expectedImprovement: 'Redução de 15-25% no tempo de carregamento',
        difficulty: 'medium',
        estimatedTime: '3-6 horas',
        implemented: false
      });
    }

    return suggestions;
  }, []);

  // Ações de monitoramento
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    const monitor = async () => {
      try {
        const newMetrics = await collectMetrics();
        setCurrentMetrics(newMetrics);
        setMetrics(prev => [...prev.slice(-99), newMetrics]); // Manter últimas 100 medições
        
        // Detectar problemas
        const newIssues = detectIssues(newMetrics);
        setIssues(prev => [...prev, ...newIssues]);
        
        // Gerar sugestões
        const newSuggestions = generateSuggestions(newMetrics);
        setSuggestions(prev => {
          const existing = prev.map(s => s.id);
          const filtered = newSuggestions.filter(s => !existing.includes(s.id));
          return [...prev, ...filtered];
        });
      } catch (error) {
        console.error('Erro ao coletar métricas:', error);
      }
    };

    // Primeira coleta
    monitor();
    
    // Configurar intervalo
    monitoringInterval.current = setInterval(monitor, config.monitoring.interval);
  }, [isMonitoring, collectMetrics, detectIssues, generateSuggestions, config.monitoring.interval]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, []);

  // Ações de otimização
  const applyOptimization = useCallback(async (suggestionId: string) => {
    setIsOptimizing(true);
    
    try {
      // Simular aplicação da otimização
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestionId 
            ? { ...s, implemented: true }
            : s
        )
      );
    } catch (error) {
      console.error('Erro ao aplicar otimização:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const resolveIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.filter(issue => issue.id !== issueId));
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (period: { start: Date; end: Date }) => {
    const filteredMetrics = metrics.filter(m => 
      m.timestamp >= period.start.getTime() && 
      m.timestamp <= period.end.getTime()
    );

    const overallScore = filteredMetrics.length > 0 
      ? filteredMetrics.reduce((acc, m) => {
          let score = 100;
          if (m.webVitals.lcp && m.webVitals.lcp > 2500) score -= 20;
          if (m.webVitals.fcp && m.webVitals.fcp > 2000) score -= 15;
          if (m.webVitals.cls && m.webVitals.cls > 0.1) score -= 15;
          if (m.memoryUsage.percentage > 80) score -= 20;
          return acc + Math.max(0, score);
        }, 0) / filteredMetrics.length
      : 0;

    const report: PerformanceReport = {
      id: `report-${Date.now()}`,
      title: `Relatório de Performance - ${period.start.toLocaleDateString()} a ${period.end.toLocaleDateString()}`,
      period,
      summary: {
        overallScore,
        improvementAreas: issues.map(i => i.title).slice(0, 5),
        achievements: suggestions.filter(s => s.implemented).map(s => s.title)
      },
      metrics: filteredMetrics,
      issues: issues.filter(i => 
        i.detectedAt >= period.start.getTime() && 
        i.detectedAt <= period.end.getTime()
      ),
      suggestions,
      budgets,
      generatedAt: new Date()
    };

    setReports(prev => [report, ...prev]);
    return report;
  }, [metrics, issues, suggestions, budgets]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
      if (memoryMonitor.current) {
        clearInterval(memoryMonitor.current);
      }
    };
  }, []);

  // Valores computados
  const overallScore = currentMetrics ? (() => {
    let score = 100;
    const { webVitals, memoryUsage } = currentMetrics;
    
    if (webVitals.lcp && webVitals.lcp > 2500) score -= 20;
    if (webVitals.fcp && webVitals.fcp > 2000) score -= 15;
    if (webVitals.cls && webVitals.cls > 0.1) score -= 15;
    if (webVitals.fid && webVitals.fid > 100) score -= 10;
    if (memoryUsage.percentage > 80) score -= 20;
    
    return Math.max(0, score);
  })() : 0;

  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const pendingSuggestions = suggestions.filter(s => !s.implemented).length;
  const implementedOptimizations = suggestions.filter(s => s.implemented).length;

  return {
    // Estados
    isMonitoring,
    isOptimizing,
    metrics,
    currentMetrics,
    issues,
    suggestions,
    budgets,
    abTests,
    reports,
    config,

    // Ações de monitoramento
    startMonitoring,
    stopMonitoring,
    collectMetrics,

    // Ações de otimização
    applyOptimization,
    resolveIssue,

    // Ações de configuração
    updateConfig: setConfig,
    setBudgets,
    setAbTests,

    // Ações de relatórios
    generateReport,

    // Valores computados
    overallScore,
    criticalIssues,
    pendingSuggestions,
    implementedOptimizations,

    // Utilitários
    detectIssues,
    generateSuggestions
  };
};

export default usePerformanceOptimization;