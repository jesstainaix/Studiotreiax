import { useState, useEffect, useCallback } from 'react';
import { realPerformanceCollector, getRealMetrics, type RealPerformanceMetrics } from '../utils/realPerformanceMetrics';
import { webVitalsTracker } from '../utils/webVitalsTracker';

export interface PerformanceBudget {
  id: string;
  name: string;
  targets: string[];
  threshold: number;
  warningThreshold: number;
  enabled: boolean;
  description: string;
  type: 'performance';
  alertConfig: {
    email: boolean;
    webhook: boolean;
    severity: 'warning' | 'critical';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  value: number;
  threshold: number;
}

export interface BudgetViolation {
  id: string;
  budgetId: string;
  timestamp: number;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  duration: number;
}

export interface PerformanceBudgetsState {
  budgets: PerformanceBudget[];
  alerts: BudgetAlert[];
  violations: BudgetViolation[];
  isMonitoring: boolean;
  loading: boolean;
  error: string | null;
  currentMetrics: RealPerformanceMetrics | null;
}

export interface PerformanceBudgetsActions {
  createBudget: (budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBudget: (id: string, updates: Partial<PerformanceBudget>) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  checkBudgets: (metrics: RealPerformanceMetrics) => Promise<BudgetViolation[]>;
  acknowledgeAlert: (alertId: string) => boolean;
  clearOldViolations: (maxAge?: number) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  exportData: () => string;
  importData: (data: string) => Promise<boolean>;
  resetAll: () => Promise<void>;
}

export interface PerformanceBudgetsConfig {
  autoMonitoring: boolean;
  alertThreshold: number;
  enableNotifications: boolean;
  enableABTesting: boolean;
  monitoringInterval: number;
}

const defaultConfig: PerformanceBudgetsConfig = {
  autoMonitoring: true,
  alertThreshold: 3,
  enableNotifications: true,
  enableABTesting: false,
  monitoringInterval: 30000
};

const STORAGE_KEY = 'performance-budgets-data';

export function usePerformanceBudgets(config: Partial<PerformanceBudgetsConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [state, setState] = useState<PerformanceBudgetsState>({
    budgets: [],
    alerts: [],
    violations: [],
    isMonitoring: false,
    loading: false,
    error: null,
    currentMetrics: null
  });

  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          budgets: data.budgets?.map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt)
          })) || [],
          alerts: data.alerts || [],
          violations: data.violations || []
        }));
      }
    } catch (error) {
      console.error('Failed to load performance budgets data:', error);
    }
  }, []);

  // Save data whenever state changes
  useEffect(() => {
    if (state.budgets.length > 0 || state.alerts.length > 0 || state.violations.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          budgets: state.budgets,
          alerts: state.alerts,
          violations: state.violations
        }));
      } catch (error) {
        console.error('Failed to save performance budgets data:', error);
      }
    }
  }, [state.budgets, state.alerts, state.violations]);

  const getMetricValue = useCallback((metric: string, metrics: RealPerformanceMetrics): number => {
    switch (metric) {
      case 'lcp':
        return webVitalsTracker.getMetrics().lcp || 0;
      case 'fid':
        return webVitalsTracker.getMetrics().fid || 0;
      case 'cls':
        return webVitalsTracker.getMetrics().cls || 0;
      case 'fcp':
        return webVitalsTracker.getMetrics().fcp || 0;
      case 'ttfb':
        return webVitalsTracker.getMetrics().ttfb || 0;
      case 'bundle-size':
        return metrics.resources.totalSize / 1024; // Convert to KB
      case 'memory-usage':
        return metrics.memory.percentage;
      case 'cpu-usage':
        return metrics.cpu.usage;
      case 'network-latency':
        return metrics.network.latency;
      default:
        return 0;
    }
  }, []);

  const createBudget = useCallback(async (budgetData: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const budget: PerformanceBudget = {
      ...budgetData,
      id,
      createdAt: now,
      updatedAt: now
    };

    setState(prev => ({
      ...prev,
      budgets: [...prev.budgets, budget]
    }));

    return id;
  }, []);

  const updateBudget = useCallback(async (id: string, updates: Partial<PerformanceBudget>): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(budget =>
        budget.id === id
          ? { ...budget, ...updates, updatedAt: new Date() }
          : budget
      )
    }));
    return true;
  }, []);

  const deleteBudget = useCallback(async (id: string): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(budget => budget.id !== id),
      alerts: prev.alerts.filter(alert => alert.budgetId !== id),
      violations: prev.violations.filter(violation => violation.budgetId !== id)
    }));
    return true;
  }, []);

  const checkBudgets = useCallback(async (metrics: RealPerformanceMetrics): Promise<BudgetViolation[]> => {
    const violations: BudgetViolation[] = [];
    const alerts: BudgetAlert[] = [];

    state.budgets.forEach(budget => {
      if (!budget.enabled) return;

      budget.targets.forEach(metric => {
        const value = getMetricValue(metric, metrics);
        const timestamp = Date.now();

        // Check for violations
        if (value > budget.threshold) {
          const violation: BudgetViolation = {
            id: `violation-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            budgetId: budget.id,
            timestamp,
            value,
            threshold: budget.threshold,
            severity: 'critical',
            duration: 0
          };
          violations.push(violation);

          // Create alert
          const alert: BudgetAlert = {
            id: `alert-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            budgetId: budget.id,
            severity: 'critical',
            message: `${budget.name}: ${metric} excedeu o limite (${value.toFixed(2)} > ${budget.threshold})`,
            timestamp,
            acknowledged: false,
            value,
            threshold: budget.threshold
          };
          alerts.push(alert);
        } else if (value > budget.warningThreshold) {
          const violation: BudgetViolation = {
            id: `violation-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            budgetId: budget.id,
            timestamp,
            value,
            threshold: budget.warningThreshold,
            severity: 'warning',
            duration: 0
          };
          violations.push(violation);

          // Create warning alert
          const alert: BudgetAlert = {
            id: `alert-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            budgetId: budget.id,
            severity: 'warning',
            message: `${budget.name}: ${metric} próximo do limite (${value.toFixed(2)} > ${budget.warningThreshold})`,
            timestamp,
            acknowledged: false,
            value,
            threshold: budget.warningThreshold
          };
          alerts.push(alert);
        }
      });
    });

    if (violations.length > 0 || alerts.length > 0) {
      setState(prev => ({
        ...prev,
        violations: [...prev.violations, ...violations].slice(-100), // Keep last 100
        alerts: [...prev.alerts, ...alerts].slice(-50) // Keep last 50
      }));
    }

    return violations;
  }, [state.budgets, getMetricValue]);

  const acknowledgeAlert = useCallback((alertId: string): boolean => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true }
          : alert
      )
    }));
    return true;
  }, []);

  const clearOldViolations = useCallback((maxAge: number = 24 * 60 * 60 * 1000) => {
    const cutoff = Date.now() - maxAge;
    setState(prev => ({
      ...prev,
      violations: prev.violations.filter(violation => violation.timestamp > cutoff),
      alerts: prev.alerts.filter(alert => alert.timestamp > cutoff)
    }));
  }, []);

  const startMonitoring = useCallback(() => {
    if (monitoringInterval) return;

    setState(prev => ({ ...prev, isMonitoring: true }));

    const interval = setInterval(async () => {
      try {
        const metrics = getRealMetrics();
        setState(prev => ({ ...prev, currentMetrics: metrics }));
        await checkBudgets(metrics);
      } catch (error) {
        console.error('Budget monitoring error:', error);
        setState(prev => ({ ...prev, error: 'Erro no monitoramento de orçamentos' }));
      }
    }, finalConfig.monitoringInterval);

    setMonitoringInterval(interval);
  }, [monitoringInterval, finalConfig.monitoringInterval, checkBudgets]);

  const stopMonitoring = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, [monitoringInterval]);

  const exportData = useCallback(() => {
    return JSON.stringify({
      budgets: state.budgets,
      alerts: state.alerts,
      violations: state.violations,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }, [state]);

  const importData = useCallback(async (data: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(data);
      setState(prev => ({
        ...prev,
        budgets: parsed.budgets?.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt)
        })) || [],
        alerts: parsed.alerts || [],
        violations: parsed.violations || []
      }));
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }, []);

  const resetAll = useCallback(async () => {
    setState({
      budgets: [],
      alerts: [],
      violations: [],
      isMonitoring: false,
      loading: false,
      error: null,
      currentMetrics: null
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  return {
    state,
    actions: {
      createBudget,
      updateBudget,
      deleteBudget,
      checkBudgets,
      acknowledgeAlert,
      clearOldViolations,
      startMonitoring,
      stopMonitoring,
      exportData,
      importData,
      resetAll
    }
  };
}