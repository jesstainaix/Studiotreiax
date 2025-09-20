import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'memory' | 'network' | 'rendering' | 'bundle';
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 1-10 scale
  implementation: {
    type: 'lazy_loading' | 'code_splitting' | 'memoization' | 'virtualization' | 'compression' | 'caching' | 'preloading' | 'debouncing';
    config: Record<string, any>;
  };
  metrics: {
    beforeScore: number;
    afterScore: number;
    improvement: number;
    appliedAt?: string;
  };
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    good: number;
    needs_improvement: number;
    poor: number;
  };
  trend: 'improving' | 'stable' | 'degrading';
  history: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  category: string;
  rule?: OptimizationRule;
  autoFixAvailable: boolean;
  estimatedImprovement: {
    performance: number;
    memory: number;
    bundle: number;
  };
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: Array<{
      name: string;
      size: number;
      reasons: string[];
    }>;
  }>;
  duplicates: Array<{
    module: string;
    count: number;
    totalSize: number;
  }>;
  unusedExports: Array<{
    module: string;
    exports: string[];
  }>;
}

export interface LazyLoadingConfig {
  enabled: boolean;
  threshold: number;
  rootMargin: string;
  components: Set<string>;
  images: boolean;
  routes: boolean;
}

export interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  components: Set<string>;
}

export interface CacheStrategy {
  id: string;
  name: string;
  type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'serviceWorker';
  ttl: number;
  maxSize: number;
  enabled: boolean;
  targets: string[];
}

export interface OptimizationConfig {
  enabled: boolean;
  autoApply: boolean;
  monitoringInterval: number;
  performanceThreshold: number;
  memoryThreshold: number;
  bundleThreshold: number;
  lazyLoading: LazyLoadingConfig;
  virtualization: VirtualizationConfig;
  cacheStrategies: CacheStrategy[];
  compressionLevel: number;
  preloadCritical: boolean;
  debounceDelay: number;
}

export interface OptimizationMetrics {
  performanceScore: number;
  memoryUsage: number;
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  optimizationsApplied: number;
  improvementPercentage: number;
}

export interface OptimizationState {
  isOptimizing: boolean;
  rules: OptimizationRule[];
  metrics: PerformanceMetric[];
  suggestions: OptimizationSuggestion[];
  bundleAnalysis: BundleAnalysis | null;
  config: OptimizationConfig;
  optimizationMetrics: OptimizationMetrics;
  lastOptimization: string | null;
}

// Advanced Optimization Engine
class AdvancedOptimizationEngine {
  private performanceObserver: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private memoryMonitor: NodeJS.Timeout | null = null;
  private optimizationQueue: OptimizationRule[] = [];
  private cache: Map<string, any> = new Map();
  private lazyComponents: Map<string, React.ComponentType> = new Map();
  private virtualizedLists: Set<string> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private config: OptimizationConfig,
    private onStateChange: (state: Partial<OptimizationState>) => void
  ) {
    this.initializeOptimizations();
  }

  // Initialization
  private initializeOptimizations(): void {
    if (typeof window !== 'undefined') {
      this.setupPerformanceMonitoring();
      this.setupLazyLoading();
      this.setupVirtualization();
      this.setupCaching();
      this.setupMemoryMonitoring();
    }
  }

  // Performance Monitoring
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processPerformanceEntries(entries);
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
    }
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    const metrics: PerformanceMetric[] = [];

    entries.forEach(entry => {
      let metric: PerformanceMetric | null = null;

      switch (entry.entryType) {
        case 'navigation':
          const navEntry = entry as PerformanceNavigationTiming;
          metric = {
            id: 'page-load-time',
            name: 'Page Load Time',
            value: navEntry.loadEventEnd - navEntry.navigationStart,
            unit: 'ms',
            threshold: { good: 1000, needs_improvement: 2500, poor: 4000 },
            trend: 'stable',
            history: []
          };
          break;

        case 'paint':
          if (entry.name === 'first-contentful-paint') {
            metric = {
              id: 'first-contentful-paint',
              name: 'First Contentful Paint',
              value: entry.startTime,
              unit: 'ms',
              threshold: { good: 1800, needs_improvement: 3000, poor: 4000 },
              trend: 'stable',
              history: []
            };
          }
          break;

        case 'largest-contentful-paint':
          metric = {
            id: 'largest-contentful-paint',
            name: 'Largest Contentful Paint',
            value: entry.startTime,
            unit: 'ms',
            threshold: { good: 2500, needs_improvement: 4000, poor: 4000 },
            trend: 'stable',
            history: []
          };
          break;
      }

      if (metric) {
        metrics.push(metric);
      }
    });

    if (metrics.length > 0) {
      this.onStateChange({ metrics });
      this.analyzePerformance(metrics);
    }
  }

  // Lazy Loading Implementation
  private setupLazyLoading(): void {
    if (!this.config.lazyLoading.enabled) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyComponent(entry.target as HTMLElement);
          }
        });
      },
      {
        threshold: this.config.lazyLoading.threshold,
        rootMargin: this.config.lazyLoading.rootMargin
      }
    );
  }

  private loadLazyComponent(element: HTMLElement): void {
    const componentName = element.dataset.lazyComponent;
    if (componentName && this.lazyComponents.has(componentName)) {
      const Component = this.lazyComponents.get(componentName)!;
      // Implementation would render the component
      this.intersectionObserver?.unobserve(element);
    }
  }

  registerLazyComponent(name: string, component: React.ComponentType): void {
    this.lazyComponents.set(name, component);
  }

  observeLazyElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  // Virtualization
  private setupVirtualization(): void {
    if (!this.config.virtualization.enabled) return;
    // Virtualization setup would be implemented here
  }

  enableVirtualization(listId: string): void {
    this.virtualizedLists.add(listId);
  }

  disableVirtualization(listId: string): void {
    this.virtualizedLists.delete(listId);
  }

  // Caching System
  private setupCaching(): void {
    this.config.cacheStrategies.forEach(strategy => {
      if (strategy.enabled) {
        this.initializeCacheStrategy(strategy);
      }
    });
  }

  private initializeCacheStrategy(strategy: CacheStrategy): void {
    switch (strategy.type) {
      case 'memory':
        // Memory cache is already implemented with this.cache
        break;
      case 'localStorage':
        this.setupLocalStorageCache(strategy);
        break;
      case 'sessionStorage':
        this.setupSessionStorageCache(strategy);
        break;
      case 'indexedDB':
        this.setupIndexedDBCache(strategy);
        break;
      case 'serviceWorker':
        this.setupServiceWorkerCache(strategy);
        break;
    }
  }

  private setupLocalStorageCache(strategy: CacheStrategy): void {
    // Implementation for localStorage caching
  }

  private setupSessionStorageCache(strategy: CacheStrategy): void {
    // Implementation for sessionStorage caching
  }

  private setupIndexedDBCache(strategy: CacheStrategy): void {
    // Implementation for IndexedDB caching
  }

  private setupServiceWorkerCache(strategy: CacheStrategy): void {
    // Implementation for Service Worker caching
  }

  // Memory Monitoring
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      this.memoryMonitor = setInterval(() => {
        const memInfo = (performance as any).memory;
        const memoryMetric: PerformanceMetric = {
          id: 'memory-usage',
          name: 'Memory Usage',
          value: memInfo.usedJSHeapSize / 1024 / 1024, // MB
          unit: 'MB',
          threshold: { good: 50, needs_improvement: 100, poor: 200 },
          trend: 'stable',
          history: []
        };

        this.onStateChange({ 
          metrics: [memoryMetric],
          optimizationMetrics: {
            memoryUsage: memoryMetric.value
          } as Partial<OptimizationMetrics>
        });

        if (memoryMetric.value > this.config.memoryThreshold) {
          this.triggerMemoryOptimization();
        }
      }, this.config.monitoringInterval);
    }
  }

  private triggerMemoryOptimization(): void {
    // Clear caches
    this.cache.clear();
    
    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Generate memory optimization suggestions
    const suggestion: OptimizationSuggestion = {
      id: 'memory-cleanup',
      type: 'warning',
      title: 'High Memory Usage Detected',
      description: 'Memory usage is above threshold. Consider implementing memory optimizations.',
      impact: 'high',
      effort: 'moderate',
      category: 'memory',
      autoFixAvailable: true,
      estimatedImprovement: {
        performance: 15,
        memory: 30,
        bundle: 0
      }
    };

    this.onStateChange({ suggestions: [suggestion] });
  }

  // Bundle Analysis
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    // This would typically integrate with webpack-bundle-analyzer or similar
    const analysis: BundleAnalysis = {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      duplicates: [],
      unusedExports: []
    };

    // Simulate bundle analysis
    if (typeof window !== 'undefined') {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;

      for (const script of scripts) {
        try {
          const response = await fetch((script as HTMLScriptElement).src, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length') || '0');
          totalSize += size;
        } catch (error) {
          // Handle error silently
        }
      }

      analysis.totalSize = totalSize;
      analysis.gzippedSize = Math.floor(totalSize * 0.3); // Estimate
    }

    this.onStateChange({ bundleAnalysis: analysis });
    return analysis;
  }

  // Performance Analysis
  private analyzePerformance(metrics: PerformanceMetric[]): void {
    const suggestions: OptimizationSuggestion[] = [];

    metrics.forEach(metric => {
      if (metric.value > metric.threshold.poor) {
        suggestions.push({
          id: `${metric.id}-optimization`,
          type: 'critical',
          title: `Poor ${metric.name}`,
          description: `${metric.name} is ${metric.value}${metric.unit}, which exceeds the poor threshold of ${metric.threshold.poor}${metric.unit}`,
          impact: 'high',
          effort: 'moderate',
          category: 'performance',
          autoFixAvailable: true,
          estimatedImprovement: {
            performance: 25,
            memory: 10,
            bundle: 5
          }
        });
      } else if (metric.value > metric.threshold.needs_improvement) {
        suggestions.push({
          id: `${metric.id}-improvement`,
          type: 'warning',
          title: `${metric.name} Needs Improvement`,
          description: `${metric.name} is ${metric.value}${metric.unit}, consider optimizing for better performance`,
          impact: 'medium',
          effort: 'easy',
          category: 'performance',
          autoFixAvailable: false,
          estimatedImprovement: {
            performance: 15,
            memory: 5,
            bundle: 0
          }
        });
      }
    });

    if (suggestions.length > 0) {
      this.onStateChange({ suggestions });
    }
  }

  // Optimization Application
  async applyOptimization(rule: OptimizationRule): Promise<boolean> {
    try {
      this.onStateChange({ isOptimizing: true });

      switch (rule.implementation.type) {
        case 'lazy_loading':
          await this.applyLazyLoading(rule);
          break;
        case 'code_splitting':
          await this.applyCodeSplitting(rule);
          break;
        case 'memoization':
          await this.applyMemoization(rule);
          break;
        case 'virtualization':
          await this.applyVirtualization(rule);
          break;
        case 'compression':
          await this.applyCompression(rule);
          break;
        case 'caching':
          await this.applyCaching(rule);
          break;
        case 'preloading':
          await this.applyPreloading(rule);
          break;
        case 'debouncing':
          await this.applyDebouncing(rule);
          break;
      }

      rule.metrics.appliedAt = new Date().toISOString();
      this.onStateChange({ isOptimizing: false });
      return true;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      this.onStateChange({ isOptimizing: false });
      return false;
    }
  }

  private async applyLazyLoading(rule: OptimizationRule): Promise<void> {
    // Implementation for lazy loading optimization
    this.config.lazyLoading.enabled = true;
    this.setupLazyLoading();
  }

  private async applyCodeSplitting(rule: OptimizationRule): Promise<void> {
    // Implementation for code splitting optimization
    // This would typically involve dynamic imports
  }

  private async applyMemoization(rule: OptimizationRule): Promise<void> {
    // Implementation for memoization optimization
    // This would involve React.memo, useMemo, useCallback
  }

  private async applyVirtualization(rule: OptimizationRule): Promise<void> {
    // Implementation for virtualization optimization
    this.config.virtualization.enabled = true;
    this.setupVirtualization();
  }

  private async applyCompression(rule: OptimizationRule): Promise<void> {
    // Implementation for compression optimization
    // This would involve gzip, brotli compression
  }

  private async applyCaching(rule: OptimizationRule): Promise<void> {
    // Implementation for caching optimization
    const strategy: CacheStrategy = {
      id: rule.id,
      name: rule.name,
      type: 'memory',
      ttl: 300000, // 5 minutes
      maxSize: 100,
      enabled: true,
      targets: ['api', 'images']
    };
    
    this.config.cacheStrategies.push(strategy);
    this.initializeCacheStrategy(strategy);
  }

  private async applyPreloading(rule: OptimizationRule): Promise<void> {
    // Implementation for preloading optimization
    if (this.config.preloadCritical) {
      const criticalResources = ['fonts', 'critical-css', 'hero-images'];
      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = `/assets/${resource}`;
        document.head.appendChild(link);
      });
    }
  }

  private async applyDebouncing(rule: OptimizationRule): Promise<void> {
    // Implementation for debouncing optimization
    // This would involve debouncing user inputs and API calls
  }

  // Debounce Utility
  debounce<T extends (...args: any[]) => any>(key: string, func: T, delay: number = this.config.debounceDelay): T {
    return ((...args: any[]) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    }) as T;
  }

  // Cache Management
  setCache(key: string, value: any, ttl: number = 300000): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  getCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Cleanup
  destroy(): void {
    this.performanceObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.cache.clear();
    this.lazyComponents.clear();
    this.virtualizedLists.clear();
  }
}

// Default Configuration
const defaultConfig: OptimizationConfig = {
  enabled: true,
  autoApply: false,
  monitoringInterval: 30000,
  performanceThreshold: 3000,
  memoryThreshold: 100,
  bundleThreshold: 1000000, // 1MB
  lazyLoading: {
    enabled: true,
    threshold: 0.1,
    rootMargin: '50px',
    components: new Set(),
    images: true,
    routes: true
  },
  virtualization: {
    enabled: false,
    itemHeight: 50,
    overscan: 5,
    components: new Set()
  },
  cacheStrategies: [
    {
      id: 'memory-cache',
      name: 'Memory Cache',
      type: 'memory',
      ttl: 300000,
      maxSize: 100,
      enabled: true,
      targets: ['api', 'computed']
    }
  ],
  compressionLevel: 6,
  preloadCritical: true,
  debounceDelay: 300
};

// Default Rules
const defaultRules: OptimizationRule[] = [
  {
    id: 'lazy-load-images',
    name: 'Lazy Load Images',
    description: 'Load images only when they enter the viewport',
    category: 'performance',
    enabled: true,
    priority: 'high',
    impact: 8,
    implementation: {
      type: 'lazy_loading',
      config: { threshold: 0.1, rootMargin: '50px' }
    },
    metrics: { beforeScore: 0, afterScore: 0, improvement: 0 }
  },
  {
    id: 'code-splitting',
    name: 'Code Splitting',
    description: 'Split code into smaller chunks for better loading',
    category: 'bundle',
    enabled: true,
    priority: 'high',
    impact: 9,
    implementation: {
      type: 'code_splitting',
      config: { chunkSize: 250000 }
    },
    metrics: { beforeScore: 0, afterScore: 0, improvement: 0 }
  },
  {
    id: 'memoization',
    name: 'Component Memoization',
    description: 'Memoize expensive components and calculations',
    category: 'rendering',
    enabled: true,
    priority: 'medium',
    impact: 7,
    implementation: {
      type: 'memoization',
      config: { aggressive: false }
    },
    metrics: { beforeScore: 0, afterScore: 0, improvement: 0 }
  },
  {
    id: 'virtualization',
    name: 'List Virtualization',
    description: 'Virtualize long lists for better performance',
    category: 'rendering',
    enabled: false,
    priority: 'medium',
    impact: 8,
    implementation: {
      type: 'virtualization',
      config: { itemHeight: 50, overscan: 5 }
    },
    metrics: { beforeScore: 0, afterScore: 0, improvement: 0 }
  },
  {
    id: 'api-caching',
    name: 'API Response Caching',
    description: 'Cache API responses to reduce network requests',
    category: 'network',
    enabled: true,
    priority: 'high',
    impact: 8,
    implementation: {
      type: 'caching',
      config: { ttl: 300000, strategy: 'memory' }
    },
    metrics: { beforeScore: 0, afterScore: 0, improvement: 0 }
  }
];

// Hook
export const useAdvancedOptimization = () => {
  const [state, setState] = useState<OptimizationState>({
    isOptimizing: false,
    rules: defaultRules,
    metrics: [],
    suggestions: [],
    bundleAnalysis: null,
    config: defaultConfig,
    optimizationMetrics: {
      performanceScore: 0,
      memoryUsage: 0,
      bundleSize: 0,
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      optimizationsApplied: 0,
      improvementPercentage: 0
    },
    lastOptimization: null
  });

  const engineRef = useRef<AdvancedOptimizationEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    const handleStateChange = (newState: Partial<OptimizationState>) => {
      setState(prev => ({ ...prev, ...newState }));
    };

    engineRef.current = new AdvancedOptimizationEngine(state.config, handleStateChange);

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  // Actions
  const actions = {
    // Optimization Management
    applyOptimization: useCallback(async (rule: OptimizationRule) => {
      if (!engineRef.current) return false;
      
      const success = await engineRef.current.applyOptimization(rule);
      if (success) {
        setState(prev => ({
          ...prev,
          rules: prev.rules.map(r => r.id === rule.id ? rule : r),
          optimizationMetrics: {
            ...prev.optimizationMetrics,
            optimizationsApplied: prev.optimizationMetrics.optimizationsApplied + 1
          },
          lastOptimization: new Date().toISOString()
        }));
      }
      return success;
    }, []),

    applyAllOptimizations: useCallback(async () => {
      if (!engineRef.current) return;
      
      const enabledRules = state.rules.filter(rule => rule.enabled);
      for (const rule of enabledRules) {
        await engineRef.current.applyOptimization(rule);
      }
    }, [state.rules]),

    // Rule Management
    addRule: useCallback((rule: Omit<OptimizationRule, 'id'>) => {
      const newRule: OptimizationRule = {
        ...rule,
        id: Math.random().toString(36).substr(2, 9)
      };
      
      setState(prev => ({
        ...prev,
        rules: [...prev.rules, newRule]
      }));
    }, []),

    updateRule: useCallback((id: string, updates: Partial<OptimizationRule>) => {
      setState(prev => ({
        ...prev,
        rules: prev.rules.map(rule => 
          rule.id === id ? { ...rule, ...updates } : rule
        )
      }));
    }, []),

    deleteRule: useCallback((id: string) => {
      setState(prev => ({
        ...prev,
        rules: prev.rules.filter(rule => rule.id !== id)
      }));
    }, []),

    toggleRule: useCallback((id: string) => {
      setState(prev => ({
        ...prev,
        rules: prev.rules.map(rule => 
          rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        )
      }));
    }, []),

    // Analysis
    analyzeBundleSize: useCallback(async () => {
      if (!engineRef.current) return null;
      return await engineRef.current.analyzeBundleSize();
    }, []),

    // Configuration
    updateConfig: useCallback((newConfig: Partial<OptimizationConfig>) => {
      setState(prev => ({
        ...prev,
        config: { ...prev.config, ...newConfig }
      }));
    }, []),

    // Cache Management
    setCache: useCallback((key: string, value: any, ttl?: number) => {
      engineRef.current?.setCache(key, value, ttl);
    }, []),

    getCache: useCallback((key: string) => {
      return engineRef.current?.getCache(key);
    }, []),

    clearCache: useCallback((pattern?: string) => {
      engineRef.current?.clearCache(pattern);
    }, []),

    // Lazy Loading
    registerLazyComponent: useCallback((name: string, component: React.ComponentType) => {
      engineRef.current?.registerLazyComponent(name, component);
    }, []),

    observeLazyElement: useCallback((element: HTMLElement) => {
      engineRef.current?.observeLazyElement(element);
    }, []),

    // Virtualization
    enableVirtualization: useCallback((listId: string) => {
      engineRef.current?.enableVirtualization(listId);
    }, []),

    disableVirtualization: useCallback((listId: string) => {
      engineRef.current?.disableVirtualization(listId);
    }, []),

    // Debouncing
    debounce: useCallback(<T extends (...args: any[]) => any>(key: string, func: T, delay?: number): T => {
      if (!engineRef.current) return func;
      return engineRef.current.debounce(key, func, delay);
    }, []),

    // Suggestions
    dismissSuggestion: useCallback((id: string) => {
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== id)
      }));
    }, []),

    clearSuggestions: useCallback(() => {
      setState(prev => ({ ...prev, suggestions: [] }));
    }, []),

    // Analytics
    getAnalytics: useCallback(() => {
      const totalRules = state.rules.length;
      const enabledRules = state.rules.filter(r => r.enabled).length;
      const appliedRules = state.rules.filter(r => r.metrics.appliedAt).length;
      
      return {
        rulesOverview: {
          total: totalRules,
          enabled: enabledRules,
          applied: appliedRules,
          effectiveness: appliedRules / Math.max(enabledRules, 1)
        },
        performanceImpact: {
          averageImprovement: state.rules
            .filter(r => r.metrics.improvement > 0)
            .reduce((acc, r) => acc + r.metrics.improvement, 0) / Math.max(state.rules.filter(r => r.metrics.improvement > 0).length, 1),
          totalOptimizations: state.optimizationMetrics.optimizationsApplied,
          performanceScore: state.optimizationMetrics.performanceScore
        },
        suggestions: {
          total: state.suggestions.length,
          critical: state.suggestions.filter(s => s.type === 'critical').length,
          autoFixable: state.suggestions.filter(s => s.autoFixAvailable).length
        }
      };
    }, [state]),

    // Data Management
    exportData: useCallback(() => {
      return {
        rules: state.rules,
        config: state.config,
        metrics: state.metrics,
        optimizationMetrics: state.optimizationMetrics,
        exportedAt: new Date().toISOString()
      };
    }, [state]),

    importData: useCallback((data: any) => {
      setState(prev => ({
        ...prev,
        rules: data.rules || prev.rules,
        config: { ...prev.config, ...data.config },
        metrics: data.metrics || prev.metrics,
        optimizationMetrics: { ...prev.optimizationMetrics, ...data.optimizationMetrics }
      }));
    }, [])
  };

  return { state, actions };
};