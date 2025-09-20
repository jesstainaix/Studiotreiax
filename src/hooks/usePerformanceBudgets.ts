import { useState, useEffect, useCallback, useRef } from 'react';
import {
  performanceBudgetManager,
  PerformanceBudget,
  BudgetAlert,
  BudgetViolation,
  ABTestConfig,
  PerformanceReport,
  BudgetEvent
} from '../utils/performanceBudgets';

export interface PerformanceBudgetsState {
  budgets: PerformanceBudget[];
  alerts: BudgetAlert[];
  violations: BudgetViolation[];
  abTests: ABTestConfig[];
  reports: PerformanceReport[];
  currentVariant: string | null;
  isMonitoring: boolean;
  loading: boolean;
  error: string | null;
}

export interface PerformanceBudgetsActions {
  createBudget: (budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBudget: (id: string, updates: Partial<PerformanceBudget>) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  checkBudgets: (metrics: { [key: string]: number }) => Promise<BudgetViolation[]>;
  acknowledgeAlert: (alertId: string) => boolean;
  clearOldViolations: (maxAge?: number) => void;
  createABTest: (test: Omit<ABTestConfig, 'id'>) => Promise<string>;
  startABTest: (id: string) => Promise<boolean>;
  stopABTest: (id: string) => Promise<boolean>;
  recordABTestMetric: (testId: string, variant: string, metric: string, value: number) => void;
  generateReport: (budgetId: string, period: 'hour' | 'day' | 'week' | 'month') => Promise<PerformanceReport>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  exportData: () => string;
  importData: (data: string) => Promise<boolean>;
  resetAll: () => Promise<void>;
}

export interface PerformanceBudgetsConfig {
  autoMonitoring: boolean;
  alertThreshold: number;
  reportInterval: number;
  maxViolations: number;
  enableABTesting: boolean;
  enableNotifications: boolean;
}

const defaultConfig: PerformanceBudgetsConfig = {
  autoMonitoring: true,
  alertThreshold: 3,
  reportInterval: 3600000, // 1 hora
  maxViolations: 100,
  enableABTesting: true,
  enableNotifications: true
};

export function usePerformanceBudgets(config: Partial<PerformanceBudgetsConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const [state, setState] = useState<PerformanceBudgetsState>({
    budgets: [],
    alerts: [],
    violations: [],
    abTests: [],
    reports: [],
    currentVariant: null,
    isMonitoring: false,
    loading: true,
    error: null
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reportIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicialização
  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Carregar dados iniciais
        const budgets = performanceBudgetManager.getAllBudgets();
        const alerts = performanceBudgetManager.getAlerts();
        const violations = performanceBudgetManager.getViolations();
        const abTests = performanceBudgetManager.getABTests();
        const reports = performanceBudgetManager.getReports();
        const currentVariant = performanceBudgetManager.getCurrentVariant();

        setState(prev => ({
          ...prev,
          budgets,
          alerts,
          violations,
          abTests,
          reports,
          currentVariant,
          loading: false
        }));

        // Configurar observador de eventos
        unsubscribeRef.current = performanceBudgetManager.subscribe(handleBudgetEvent);

        // Iniciar monitoramento automático se habilitado
        if (finalConfig.autoMonitoring) {
          setState(prev => ({ ...prev, isMonitoring: true }));
        }

        // Configurar relatórios automáticos
        if (finalConfig.reportInterval > 0) {
          reportIntervalRef.current = setInterval(() => {
            generateAutomaticReports();
          }, finalConfig.reportInterval);
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }));
      }
    };

    initialize();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (reportIntervalRef.current) {
        clearInterval(reportIntervalRef.current);
      }
    };
  }, [finalConfig.autoMonitoring, finalConfig.reportInterval]);

  const handleBudgetEvent = useCallback((event: BudgetEvent) => {
    setState(prev => {
      switch (event.type) {
        case 'budget-created':
        case 'budget-updated':
          return {
            ...prev,
            budgets: performanceBudgetManager.getAllBudgets()
          };
        case 'budget-deleted':
          return {
            ...prev,
            budgets: prev.budgets.filter(b => b.id !== event.data.id)
          };
        case 'violation-detected':
          return {
            ...prev,
            violations: [...prev.violations, event.data],
            alerts: performanceBudgetManager.getAlerts()
          };
        case 'ab-test-created':
        case 'ab-test-started':
        case 'ab-test-stopped':
          return {
            ...prev,
            abTests: performanceBudgetManager.getABTests()
          };
        default:
          return prev;
      }
    });
  }, []);

  const generateAutomaticReports = useCallback(async () => {
    try {
      const budgets = performanceBudgetManager.getAllBudgets();
      const newReports: PerformanceReport[] = [];

      for (const budget of budgets) {
        if (budget.enabled) {
          const report = performanceBudgetManager.generatePerformanceReport(budget.id, 'hour');
          newReports.push(report);
        }
      }

      setState(prev => ({
        ...prev,
        reports: [...prev.reports, ...newReports]
      }));
    } catch (error) {
      console.error('Erro ao gerar relatórios automáticos:', error);
    }
  }, []);

  // Ações
  const createBudget = useCallback(async (budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const id = performanceBudgetManager.createBudget(budget);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar budget';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const updateBudget = useCallback(async (id: string, updates: Partial<PerformanceBudget>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const success = performanceBudgetManager.updateBudget(id, updates);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar budget';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const deleteBudget = useCallback(async (id: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const success = performanceBudgetManager.deleteBudget(id);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar budget';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const checkBudgets = useCallback(async (metrics: { [key: string]: number }): Promise<BudgetViolation[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const violations = await performanceBudgetManager.checkBudgets(metrics);
      
      // Limitar número de violações se configurado
      if (finalConfig.maxViolations > 0) {
        setState(prev => ({
          ...prev,
          violations: prev.violations.slice(-finalConfig.maxViolations)
        }));
      }
      
      return violations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar budgets';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [finalConfig.maxViolations]);

  const acknowledgeAlert = useCallback((alertId: string): boolean => {
    const success = performanceBudgetManager.acknowledgeAlert(alertId);
    if (success) {
      setState(prev => ({
        ...prev,
        alerts: performanceBudgetManager.getAlerts()
      }));
    }
    return success;
  }, []);

  const clearOldViolations = useCallback((maxAge?: number) => {
    performanceBudgetManager.clearOldViolations(maxAge);
    setState(prev => ({
      ...prev,
      violations: performanceBudgetManager.getViolations()
    }));
  }, []);

  const createABTest = useCallback(async (test: Omit<ABTestConfig, 'id'>): Promise<string> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const id = performanceBudgetManager.createABTest(test);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar teste A/B';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const startABTest = useCallback(async (id: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const success = performanceBudgetManager.startABTest(id);
      if (success) {
        setState(prev => ({
          ...prev,
          currentVariant: performanceBudgetManager.getCurrentVariant()
        }));
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar teste A/B';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const stopABTest = useCallback(async (id: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const success = performanceBudgetManager.stopABTest(id);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao parar teste A/B';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const recordABTestMetric = useCallback((testId: string, variant: string, metric: string, value: number) => {
    performanceBudgetManager.recordABTestMetric(testId, variant, metric, value);
  }, []);

  const generateReport = useCallback(async (budgetId: string, period: 'hour' | 'day' | 'week' | 'month'): Promise<PerformanceReport> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const report = performanceBudgetManager.generatePerformanceReport(budgetId, period);
      setState(prev => ({
        ...prev,
        reports: [...prev.reports, report]
      }));
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar relatório';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  const stopMonitoring = useCallback(() => {
    performanceBudgetManager.stopMonitoring();
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  const exportData = useCallback((): string => {
    const data = {
      budgets: state.budgets,
      alerts: state.alerts,
      violations: state.violations,
      abTests: state.abTests,
      reports: state.reports,
      timestamp: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }, [state]);

  const importData = useCallback(async (data: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const parsed = JSON.parse(data);
      
      // Validar estrutura dos dados
      if (!parsed.budgets || !Array.isArray(parsed.budgets)) {
        throw new Error('Formato de dados inválido');
      }

      // Importar budgets
      for (const budget of parsed.budgets) {
        await createBudget(budget);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao importar dados';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [createBudget]);

  const resetAll = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Parar monitoramento
      performanceBudgetManager.stopMonitoring();
      
      // Limpar dados
      localStorage.removeItem('performance-budgets');
      
      // Resetar estado
      setState({
        budgets: [],
        alerts: [],
        violations: [],
        abTests: [],
        reports: [],
        currentVariant: null,
        isMonitoring: false,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao resetar dados';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Métricas computadas
  const metrics = {
    totalBudgets: state.budgets.length,
    activeBudgets: state.budgets.filter(b => b.enabled).length,
    totalViolations: state.violations.length,
    criticalViolations: state.violations.filter(v => v.severity === 'critical').length,
    unacknowledgedAlerts: state.alerts.filter(a => !a.acknowledged).length,
    runningABTests: state.abTests.filter(t => t.status === 'running').length,
    averageBudgetScore: state.budgets.length > 0 
      ? state.budgets.reduce((sum, b) => sum + (b.metrics.length * 10), 0) / state.budgets.length 
      : 0
  };

  // Recomendações
  const recommendations = [
    ...(metrics.criticalViolations > 0 ? ['Resolver violações críticas imediatamente'] : []),
    ...(metrics.unacknowledgedAlerts > 5 ? ['Revisar alertas não reconhecidos'] : []),
    ...(metrics.activeBudgets === 0 ? ['Criar pelo menos um budget ativo'] : []),
    ...(metrics.runningABTests === 0 && finalConfig.enableABTesting ? ['Considerar iniciar testes A/B'] : [])
  ];

  const actions: PerformanceBudgetsActions = {
    createBudget,
    updateBudget,
    deleteBudget,
    checkBudgets,
    acknowledgeAlert,
    clearOldViolations,
    createABTest,
    startABTest,
    stopABTest,
    recordABTestMetric,
    generateReport,
    startMonitoring,
    stopMonitoring,
    exportData,
    importData,
    resetAll
  };

  return {
    ...state,
    actions,
    metrics,
    recommendations,
    config: finalConfig
  };
}

export default usePerformanceBudgets;