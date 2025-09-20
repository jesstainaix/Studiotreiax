export interface PerformanceBudget {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metrics: BudgetMetric[];
  alerts: BudgetAlert[];
  actions: BudgetAction[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface BudgetMetric {
  name: string;
  type: 'size' | 'time' | 'count' | 'score';
  target: number;
  warning: number;
  critical: number;
  unit: string;
  pattern?: string;
  description: string;
  enabled: boolean;
}

export interface BudgetAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  threshold: number;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  actions: string[];
}

export interface BudgetAction {
  id: string;
  name: string;
  type: 'notification' | 'optimization' | 'rollback' | 'report';
  trigger: 'warning' | 'critical';
  enabled: boolean;
  config: any;
  lastExecuted?: number;
}

export interface BudgetViolation {
  budgetId: string;
  metric: string;
  current: number;
  target: number;
  severity: 'warning' | 'critical';
  timestamp: number;
  impact: number;
  suggestions: string[];
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  variants: ABTestVariant[];
  metrics: string[];
  trafficSplit: number;
  duration: number;
  startDate: number;
  endDate?: number;
  status: 'draft' | 'running' | 'completed' | 'paused';
  results?: ABTestResults;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  traffic: number;
  config: any;
  enabled: boolean;
}

export interface ABTestResults {
  variant: string;
  metrics: { [key: string]: number };
  confidence: number;
  significance: number;
  winner?: string;
  improvement: number;
  sampleSize: number;
}

export interface PerformanceReport {
  id: string;
  budgetId: string;
  timestamp: number;
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: { [key: string]: MetricReport };
  violations: BudgetViolation[];
  score: number;
  trends: TrendData[];
  recommendations: string[];
}

export interface MetricReport {
  name: string;
  current: number;
  target: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'good' | 'warning' | 'critical';
}

export interface TrendData {
  timestamp: number;
  value: number;
  metric: string;
}

class PerformanceBudgetManager {
  private budgets: Map<string, PerformanceBudget> = new Map();
  private alerts: BudgetAlert[] = [];
  private violations: BudgetViolation[] = [];
  private abTests: Map<string, ABTestConfig> = new Map();
  private reports: PerformanceReport[] = [];
  private observers: ((event: BudgetEvent) => void)[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private currentVariant: string | null = null;

  constructor() {
    this.initializeDefaultBudgets();
    this.startMonitoring();
    this.loadFromStorage();
  }

  private initializeDefaultBudgets(): void {
    const defaultBudget: PerformanceBudget = {
      id: 'default-web-vitals',
      name: 'Web Vitals Budget',
      description: 'Budget padrão para Core Web Vitals',
      enabled: true,
      metrics: [
        {
          name: 'First Contentful Paint',
          type: 'time',
          target: 1800,
          warning: 2000,
          critical: 3000,
          unit: 'ms',
          description: 'Tempo até o primeiro conteúdo ser renderizado',
          enabled: true
        },
        {
          name: 'Largest Contentful Paint',
          type: 'time',
          target: 2500,
          warning: 3000,
          critical: 4000,
          unit: 'ms',
          description: 'Tempo até o maior elemento ser renderizado',
          enabled: true
        },
        {
          name: 'First Input Delay',
          type: 'time',
          target: 100,
          warning: 200,
          critical: 300,
          unit: 'ms',
          description: 'Delay da primeira interação',
          enabled: true
        },
        {
          name: 'Cumulative Layout Shift',
          type: 'score',
          target: 0.1,
          warning: 0.15,
          critical: 0.25,
          unit: '',
          description: 'Mudanças inesperadas de layout',
          enabled: true
        },
        {
          name: 'Bundle Size',
          type: 'size',
          target: 250000,
          warning: 400000,
          critical: 500000,
          unit: 'bytes',
          description: 'Tamanho total do bundle JavaScript',
          enabled: true
        }
      ],
      alerts: [],
      actions: [
        {
          id: 'notify-team',
          name: 'Notificar Equipe',
          type: 'notification',
          trigger: 'warning',
          enabled: true,
          config: {
            channels: ['email', 'slack'],
            recipients: ['dev-team@company.com']
          }
        },
        {
          id: 'auto-optimize',
          name: 'Otimização Automática',
          type: 'optimization',
          trigger: 'critical',
          enabled: true,
          config: {
            actions: ['compress-images', 'minify-js', 'enable-gzip']
          }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['web-vitals', 'performance', 'default']
    };

    this.budgets.set(defaultBudget.id, defaultBudget);
  }

  createBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const newBudget: PerformanceBudget = {
      ...budget,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.budgets.set(id, newBudget);
    this.saveToStorage();
    this.notifyObservers({ type: 'budget-created', data: newBudget });
    
    return id;
  }

  updateBudget(id: string, updates: Partial<PerformanceBudget>): boolean {
    const budget = this.budgets.get(id);
    if (!budget) return false;

    const updatedBudget = {
      ...budget,
      ...updates,
      id,
      updatedAt: Date.now()
    };

    this.budgets.set(id, updatedBudget);
    this.saveToStorage();
    this.notifyObservers({ type: 'budget-updated', data: updatedBudget });
    
    return true;
  }

  deleteBudget(id: string): boolean {
    const budget = this.budgets.get(id);
    if (!budget) return false;

    this.budgets.delete(id);
    this.saveToStorage();
    this.notifyObservers({ type: 'budget-deleted', data: { id } });
    
    return true;
  }

  getBudget(id: string): PerformanceBudget | null {
    return this.budgets.get(id) || null;
  }

  getAllBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values());
  }

  async checkBudgets(metrics: { [key: string]: number }): Promise<BudgetViolation[]> {
    const violations: BudgetViolation[] = [];

    for (const budget of this.budgets.values()) {
      if (!budget.enabled) continue;

      for (const metric of budget.metrics) {
        if (!metric.enabled) continue;

        const currentValue = metrics[metric.name];
        if (currentValue === undefined) continue;

        let severity: 'warning' | 'critical' | null = null;
        
        if (currentValue > metric.critical) {
          severity = 'critical';
        } else if (currentValue > metric.warning) {
          severity = 'warning';
        }

        if (severity) {
          const violation: BudgetViolation = {
            budgetId: budget.id,
            metric: metric.name,
            current: currentValue,
            target: metric.target,
            severity,
            timestamp: Date.now(),
            impact: this.calculateImpact(currentValue, metric),
            suggestions: this.generateSuggestions(metric, currentValue)
          };

          violations.push(violation);
          await this.handleViolation(violation, budget);
        }
      }
    }

    this.violations = [...this.violations, ...violations];
    return violations;
  }

  private calculateImpact(current: number, metric: BudgetMetric): number {
    const excess = current - metric.target;
    const range = metric.critical - metric.target;
    return Math.min(100, (excess / range) * 100);
  }

  private generateSuggestions(metric: BudgetMetric, current: number): string[] {
    const suggestions: string[] = [];

    switch (metric.name) {
      case 'First Contentful Paint':
        suggestions.push('Otimizar carregamento de fontes');
        suggestions.push('Reduzir JavaScript bloqueante');
        suggestions.push('Usar preload para recursos críticos');
        break;
      case 'Largest Contentful Paint':
        suggestions.push('Otimizar imagens grandes');
        suggestions.push('Usar lazy loading');
        suggestions.push('Melhorar tempo de resposta do servidor');
        break;
      case 'First Input Delay':
        suggestions.push('Reduzir JavaScript de terceiros');
        suggestions.push('Usar Web Workers para tarefas pesadas');
        suggestions.push('Implementar code splitting');
        break;
      case 'Cumulative Layout Shift':
        suggestions.push('Definir dimensões para imagens');
        suggestions.push('Reservar espaço para anúncios');
        suggestions.push('Usar font-display: swap');
        break;
      case 'Bundle Size':
        suggestions.push('Implementar tree shaking');
        suggestions.push('Remover dependências não utilizadas');
        suggestions.push('Usar dynamic imports');
        break;
    }

    return suggestions;
  }

  private async handleViolation(violation: BudgetViolation, budget: PerformanceBudget): Promise<void> {
    // Criar alerta
    const alert: BudgetAlert = {
      id: this.generateId(),
      level: violation.severity === 'critical' ? 'critical' : 'warning',
      metric: violation.metric,
      threshold: violation.target,
      message: `${violation.metric} excedeu o limite: ${violation.current} > ${violation.target}`,
      timestamp: violation.timestamp,
      acknowledged: false,
      actions: []
    };

    this.alerts.push(alert);

    // Executar ações automáticas
    for (const action of budget.actions) {
      if (!action.enabled) continue;
      if (action.trigger !== violation.severity) continue;

      await this.executeAction(action, violation);
    }

    this.notifyObservers({ type: 'violation-detected', data: violation });
  }

  private async executeAction(action: BudgetAction, violation: BudgetViolation): Promise<void> {
    try {
      switch (action.type) {
        case 'notification':
          await this.sendNotification(action.config, violation);
          break;
        case 'optimization':
          await this.runOptimization(action.config, violation);
          break;
        case 'rollback':
          await this.performRollback(action.config, violation);
          break;
        case 'report':
          await this.generateReport(action.config, violation);
          break;
      }

      action.lastExecuted = Date.now();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  }

  private async sendNotification(config: any, violation: BudgetViolation): Promise<void> {
  }

  private async runOptimization(config: any, violation: BudgetViolation): Promise<void> {
  }

  private async performRollback(config: any, violation: BudgetViolation): Promise<void> {
  }

  private async generateReport(config: any, violation: BudgetViolation): Promise<void> {
  }

  // A/B Testing
  createABTest(test: Omit<ABTestConfig, 'id'>): string {
    const id = this.generateId();
    const newTest: ABTestConfig = {
      ...test,
      id
    };

    this.abTests.set(id, newTest);
    this.saveToStorage();
    this.notifyObservers({ type: 'ab-test-created', data: newTest });
    
    return id;
  }

  startABTest(id: string): boolean {
    const test = this.abTests.get(id);
    if (!test || test.status !== 'draft') return false;

    test.status = 'running';
    test.startDate = Date.now();
    
    this.abTests.set(id, test);
    this.assignVariant(test);
    this.saveToStorage();
    this.notifyObservers({ type: 'ab-test-started', data: test });
    
    return true;
  }

  stopABTest(id: string): boolean {
    const test = this.abTests.get(id);
    if (!test || test.status !== 'running') return false;

    test.status = 'completed';
    test.endDate = Date.now();
    
    this.abTests.set(id, test);
    this.saveToStorage();
    this.notifyObservers({ type: 'ab-test-stopped', data: test });
    
    return true;
  }

  private assignVariant(test: ABTestConfig): void {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.traffic;
      if (random <= cumulative) {
        this.currentVariant = variant.id;
        break;
      }
    }
  }

  getCurrentVariant(): string | null {
    return this.currentVariant;
  }

  recordABTestMetric(testId: string, variant: string, metric: string, value: number): void {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') return;

    if (!test.results) {
      test.results = {
        variant,
        metrics: {},
        confidence: 0,
        significance: 0,
        improvement: 0,
        sampleSize: 0
      };
    }

    test.results.metrics[metric] = value;
    test.results.sampleSize++;
    
    this.abTests.set(testId, test);
  }

  // Relatórios
  generatePerformanceReport(budgetId: string, period: 'hour' | 'day' | 'week' | 'month'): PerformanceReport {
    const budget = this.budgets.get(budgetId);
    if (!budget) throw new Error('Budget não encontrado');

    const report: PerformanceReport = {
      id: this.generateId(),
      budgetId,
      timestamp: Date.now(),
      period,
      metrics: {},
      violations: this.violations.filter(v => v.budgetId === budgetId),
      score: this.calculateBudgetScore(budget),
      trends: [],
      recommendations: this.generateRecommendations(budget)
    };

    this.reports.push(report);
    return report;
  }

  private calculateBudgetScore(budget: PerformanceBudget): number {
    // Implementar cálculo de score baseado nas métricas
    return 85; // Placeholder
  }

  private generateRecommendations(budget: PerformanceBudget): string[] {
    const recommendations: string[] = [];
    
    // Analisar violações recentes e gerar recomendações
    const recentViolations = this.violations.filter(
      v => v.budgetId === budget.id && Date.now() - v.timestamp < 86400000
    );

    if (recentViolations.length > 0) {
      recommendations.push('Revisar métricas com violações recentes');
      recommendations.push('Considerar ajustar limites de budget');
      recommendations.push('Implementar otimizações automáticas');
    }

    return recommendations;
  }

  // Monitoramento
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performPeriodicCheck();
    }, 60000); // A cada minuto
  }

  private async performPeriodicCheck(): Promise<void> {
    // Simular coleta de métricas
    const mockMetrics = {
      'First Contentful Paint': 1500 + Math.random() * 1000,
      'Largest Contentful Paint': 2000 + Math.random() * 1500,
      'First Input Delay': 50 + Math.random() * 200,
      'Cumulative Layout Shift': Math.random() * 0.3,
      'Bundle Size': 200000 + Math.random() * 300000
    };

    await this.checkBudgets(mockMetrics);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Persistência
  private saveToStorage(): void {
    try {
      const data = {
        budgets: Array.from(this.budgets.entries()),
        abTests: Array.from(this.abTests.entries()),
        alerts: this.alerts,
        violations: this.violations
      };
      
      localStorage.setItem('performance-budgets', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('performance-budgets');
      if (!data) return;

      const parsed = JSON.parse(data);
      
      this.budgets = new Map(parsed.budgets || []);
      this.abTests = new Map(parsed.abTests || []);
      this.alerts = parsed.alerts || [];
      this.violations = parsed.violations || [];
    } catch (error) {
      console.error('Erro ao carregar do storage:', error);
    }
  }

  // Utilitários
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  subscribe(callback: (event: BudgetEvent) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(event: BudgetEvent): void {
    this.observers.forEach(callback => callback(event));
  }

  // Getters
  getAlerts(): BudgetAlert[] {
    return [...this.alerts];
  }

  getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  getABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.saveToStorage();
    return true;
  }

  clearOldViolations(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.violations = this.violations.filter(v => v.timestamp > cutoff);
    this.saveToStorage();
  }
}

export interface BudgetEvent {
  type: 'budget-created' | 'budget-updated' | 'budget-deleted' | 
        'violation-detected' | 'ab-test-created' | 'ab-test-started' | 'ab-test-stopped';
  data: any;
}

export const performanceBudgetManager = new PerformanceBudgetManager();
export default performanceBudgetManager;