import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Tipos para métricas de performance
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'loading' | 'runtime' | 'memory' | 'network' | 'user' | 'custom';
  severity?: 'good' | 'needs-improvement' | 'poor';
  threshold?: {
    good: number;
    poor: number;
  };
}

export interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

export interface NetworkMetrics {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface PerformanceConfig {
  enableRealTimeMonitoring: boolean;
  enableAlerts: boolean;
  enableAutoOptimization: boolean;
  samplingRate: number;
  alertThresholds: {
    memoryUsage: number;
    renderTime: number;
    networkLatency: number;
    errorRate: number;
  };
  reportingInterval: number;
}

export interface PerformanceState {
  metrics: PerformanceMetric[];
  webVitals: WebVitalsMetrics;
  memory: MemoryMetrics | null;
  network: NetworkMetrics | null;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  lastUpdate: Date | null;
  averageMetrics: Record<string, number>;
}

export interface PerformanceActions {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  clearMetrics: () => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  exportMetrics: () => string;
  getMetricsByCategory: (category: PerformanceMetric['category']) => PerformanceMetric[];
  getAverageMetric: (name: string) => number;
  optimizePerformance: () => void;
}

const defaultConfig: PerformanceConfig = {
  enableRealTimeMonitoring: true,
  enableAlerts: true,
  enableAutoOptimization: false,
  samplingRate: 1000, // ms
  alertThresholds: {
    memoryUsage: 80, // %
    renderTime: 16, // ms (60fps)
    networkLatency: 1000, // ms
    errorRate: 5, // %
  },
  reportingInterval: 30000, // 30s
};

// Função para determinar severidade baseada em thresholds
const determineSeverity = (value: number, threshold?: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' => {
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Thresholds padrão para Web Vitals
const webVitalsThresholds = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

export const usePerformanceMonitor = (initialConfig?: Partial<PerformanceConfig>) => {
  const [config, setConfig] = useState<PerformanceConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [state, setState] = useState<PerformanceState>({
    metrics: [],
    webVitals: {},
    memory: null,
    network: null,
    alerts: [],
    isMonitoring: false,
    lastUpdate: null,
    averageMetrics: {},
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsBuffer = useRef<PerformanceMetric[]>([]);

  // Função para gerar ID único
  const generateId = useCallback((): string => {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Função para coletar métricas de memória
  const collectMemoryMetrics = useCallback((): MemoryMetrics | null => {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage,
      };
    }
    return null;
  }, []);

  // Função para coletar métricas de rede
  const collectNetworkMetrics = useCallback((): NetworkMetrics | null => {
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      };
    }
    return null;
  }, []);

  // Função para criar alerta
  const createAlert = useCallback((type: 'warning' | 'critical', message: string, metric: string, value: number, threshold: number) => {
    const alert: PerformanceAlert = {
      id: generateId(),
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date(),
      acknowledged: false,
    };

    setState(prev => ({
      ...prev,
      alerts: [...prev.alerts, alert],
    }));

    if (config.enableAlerts) {
      const toastFn = type === 'critical' ? toast.error : toast.warning;
      toastFn(message, {
        duration: type === 'critical' ? 10000 : 5000,
        action: {
          label: 'Ver detalhes',
          onClick: () => {
            console.log('Detalhes do alerta:', alert);
          }
        }
      });
    }
  }, [config.enableAlerts, generateId]);

  // Função para verificar thresholds e criar alertas
  const checkThresholds = useCallback((metric: PerformanceMetric) => {
    const { alertThresholds } = config;
    
    switch (metric.name) {
      case 'memory-usage':
        if (metric.value > alertThresholds.memoryUsage) {
          createAlert(
            metric.value > 90 ? 'critical' : 'warning',
            `Uso de memória alto: ${metric.value.toFixed(1)}%`,
            metric.name,
            metric.value,
            alertThresholds.memoryUsage
          );
        }
        break;
      case 'render-time':
        if (metric.value > alertThresholds.renderTime) {
          createAlert(
            metric.value > 32 ? 'critical' : 'warning',
            `Tempo de renderização lento: ${metric.value.toFixed(1)}ms`,
            metric.name,
            metric.value,
            alertThresholds.renderTime
          );
        }
        break;
      case 'network-latency':
        if (metric.value > alertThresholds.networkLatency) {
          createAlert(
            metric.value > 2000 ? 'critical' : 'warning',
            `Latência de rede alta: ${metric.value.toFixed(0)}ms`,
            metric.name,
            metric.value,
            alertThresholds.networkLatency
          );
        }
        break;
    }
  }, [config, createAlert]);

  // Função para registrar métrica
  const recordMetric = useCallback((metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: generateId(),
      timestamp: new Date(),
      severity: determineSeverity(metric.value, metric.threshold),
    };

    metricsBuffer.current.push(fullMetric);
    
    // Verificar thresholds
    checkThresholds(fullMetric);

    // Atualizar estado se não estiver em modo de buffer
    if (metricsBuffer.current.length >= 10) {
      setState(prev => {
        const newMetrics = [...prev.metrics, ...metricsBuffer.current];
        const limitedMetrics = newMetrics.slice(-1000); // Manter apenas as últimas 1000 métricas
        
        // Calcular médias
        const averages: Record<string, number> = {};
        const metricGroups = limitedMetrics.reduce((acc, m) => {
          if (!acc[m.name]) acc[m.name] = [];
          acc[m.name].push(m.value);
          return acc;
        }, {} as Record<string, number[]>);
        
        Object.entries(metricGroups).forEach(([name, values]) => {
          averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });

        metricsBuffer.current = [];
        
        return {
          ...prev,
          metrics: limitedMetrics,
          averageMetrics: averages,
          lastUpdate: new Date(),
        };
      });
    }
  }, [generateId, checkThresholds]);

  // Função para coletar Web Vitals
  const collectWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        // Observer para métricas de navegação
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              
              // TTFB
              const ttfb = navEntry.responseStart - navEntry.requestStart;
              recordMetric({
                name: 'TTFB',
                value: ttfb,
                unit: 'ms',
                category: 'loading',
                threshold: webVitalsThresholds.TTFB,
              });
            }
            
            if (entry.entryType === 'paint') {
              const paintEntry = entry as PerformancePaintTiming;
              if (paintEntry.name === 'first-contentful-paint') {
                recordMetric({
                  name: 'FCP',
                  value: paintEntry.startTime,
                  unit: 'ms',
                  category: 'loading',
                  threshold: webVitalsThresholds.FCP,
                });
                
                setState(prev => ({
                  ...prev,
                  webVitals: { ...prev.webVitals, FCP: paintEntry.startTime },
                }));
              }
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              const lcpEntry = entry as any;
              recordMetric({
                name: 'LCP',
                value: lcpEntry.startTime,
                unit: 'ms',
                category: 'loading',
                threshold: webVitalsThresholds.LCP,
              });
              
              setState(prev => ({
                ...prev,
                webVitals: { ...prev.webVitals, LCP: lcpEntry.startTime },
              }));
            }
            
            if (entry.entryType === 'layout-shift') {
              const clsEntry = entry as any;
              if (!clsEntry.hadRecentInput) {
                recordMetric({
                  name: 'CLS',
                  value: clsEntry.value,
                  unit: 'score',
                  category: 'runtime',
                  threshold: webVitalsThresholds.CLS,
                });
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'] });
        observerRef.current = observer;
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }, [recordMetric]);

  // Função para coletar métricas em tempo real
  const collectRealTimeMetrics = useCallback(() => {
    // Métricas de memória
    const memory = collectMemoryMetrics();
    if (memory) {
      setState(prev => ({ ...prev, memory }));
      
      recordMetric({
        name: 'memory-usage',
        value: memory.usagePercentage,
        unit: '%',
        category: 'memory',
      });
    }

    // Métricas de rede
    const network = collectNetworkMetrics();
    if (network) {
      setState(prev => ({ ...prev, network }));
      
      recordMetric({
        name: 'network-latency',
        value: network.rtt,
        unit: 'ms',
        category: 'network',
      });
    }

    // Tempo de renderização (aproximado)
    const renderStart = performance.now();
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      recordMetric({
        name: 'render-time',
        value: renderTime,
        unit: 'ms',
        category: 'runtime',
      });
    });
  }, [collectMemoryMetrics, collectNetworkMetrics, recordMetric]);

  // Função para iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (state.isMonitoring) return;

    setState(prev => ({ ...prev, isMonitoring: true }));
    
    // Coletar Web Vitals
    collectWebVitals();
    
    // Iniciar coleta em tempo real
    if (config.enableRealTimeMonitoring) {
      intervalRef.current = setInterval(collectRealTimeMetrics, config.samplingRate);
    }
  }, [state.isMonitoring, config, collectWebVitals, collectRealTimeMetrics]);

  // Função para parar monitoramento
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Função para limpar métricas
  const clearMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      metrics: [],
      averageMetrics: {},
    }));
    metricsBuffer.current = [];
  }, []);

  // Função para reconhecer alerta
  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
  }, []);

  // Função para limpar alertas
  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [] }));
  }, []);

  // Função para exportar métricas
  const exportMetrics = useCallback((): string => {
    const exportData = {
      timestamp: new Date().toISOString(),
      config,
      state: {
        ...state,
        metrics: state.metrics.slice(-100), // Últimas 100 métricas
      },
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [config, state]);

  // Função para obter métricas por categoria
  const getMetricsByCategory = useCallback((category: PerformanceMetric['category']): PerformanceMetric[] => {
    return state.metrics.filter(metric => metric.category === category);
  }, [state.metrics]);

  // Função para obter média de métrica
  const getAverageMetric = useCallback((name: string): number => {
    return state.averageMetrics[name] || 0;
  }, [state.averageMetrics]);

  // Função para otimização automática
  const optimizePerformance = useCallback(() => {
    if (!config.enableAutoOptimization) return;

    // Implementar otimizações automáticas
    const memoryUsage = state.memory?.usagePercentage || 0;
    
    if (memoryUsage > 80) {
      // Forçar garbage collection se disponível
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
        toast.info('Limpeza de memória executada automaticamente');
      }
    }
    
    // Outras otimizações podem ser adicionadas aqui
  }, [config.enableAutoOptimization, state.memory]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Auto-start se configurado
  useEffect(() => {
    if (config.enableRealTimeMonitoring && !state.isMonitoring) {
      startMonitoring();
    }
  }, [config.enableRealTimeMonitoring, state.isMonitoring, startMonitoring]);

  return {
    state,
    config,
    actions: {
      startMonitoring,
      stopMonitoring,
      recordMetric,
      clearMetrics,
      acknowledgeAlert,
      clearAlerts,
      exportMetrics,
      getMetricsByCategory,
      getAverageMetric,
      optimizePerformance,
    },
    updateConfig: (newConfig: Partial<PerformanceConfig>) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    },
  };
};

export default usePerformanceMonitor;