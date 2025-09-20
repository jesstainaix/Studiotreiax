import { useState, useEffect, useCallback, useMemo } from 'react';

// Interfaces para análise de qualidade de código
interface CodeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'complexity' | 'maintainability' | 'reliability' | 'security' | 'performance' | 'coverage';
  threshold: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  trend: 'up' | 'down' | 'stable';
  description: string;
  timestamp: Date;
  history: { date: Date; value: number }[];
}

interface CodeIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code_smell' | 'duplication' | 'complexity';
  severity: 'blocker' | 'critical' | 'major' | 'minor' | 'info';
  title: string;
  description: string;
  file: string;
  line: number;
  rule: string;
  effort: string;
  debt: string;
  tags: string[];
  assignee?: string;
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive' | 'wont_fix';
  createdAt: Date;
  updatedAt: Date;
  resolution?: string;
  resolutionTime?: number;
}

interface FileAnalysis {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  lines: number;
  complexity: number;
  coverage: number;
  duplications: number;
  issues: number;
  maintainabilityIndex: number;
  lastModified: Date;
  author: string;
  language: string;
  hotspots: number;
  testFiles: string[];
}

interface DependencyAnalysis {
  id: string;
  name: string;
  version: string;
  latestVersion: string;
  type: 'production' | 'development' | 'peer';
  size: number;
  vulnerabilities: number;
  outdated: boolean;
  license: string;
  usage: number;
  impact: 'high' | 'medium' | 'low';
  alternatives?: string[];
  securityScore: number;
  popularityScore: number;
  maintenanceScore: number;
}

interface QualityGate {
  id: string;
  name: string;
  conditions: {
    metric: string;
    operator: 'GT' | 'LT' | 'EQ' | 'NE';
    threshold: number;
    status: 'passed' | 'failed' | 'warning';
    actualValue?: number;
  }[];
  status: 'passed' | 'failed' | 'warning';
  lastExecution: Date;
  executionTime: number;
  branch?: string;
  commit?: string;
}

interface TeamMetrics {
  developer: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  bugsIntroduced: number;
  bugsFixed: number;
  codeReviews: number;
  productivity: number;
  quality: number;
  velocity: number;
  cycleTime: number;
  defectDensity: number;
}

interface TechnicalDebt {
  id: string;
  category: 'code_smell' | 'duplication' | 'complexity' | 'coverage' | 'documentation' | 'architecture';
  description: string;
  effort: number; // em horas
  impact: 'high' | 'medium' | 'low';
  priority: number;
  files: string[];
  estimatedCost: number;
  remediation: string;
  assignee?: string;
  dueDate?: Date;
  tags: string[];
  businessImpact: string;
}

interface AnalysisConfig {
  autoAnalysis: boolean;
  analysisInterval: number; // em minutos
  includeTests: boolean;
  excludePatterns: string[];
  qualityGateThresholds: {
    coverage: number;
    duplications: number;
    complexity: number;
    vulnerabilities: number;
    maintainability: number;
  };
  notifications: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'teams')[];
    triggers: ('quality_gate_failed' | 'new_vulnerability' | 'blocker_issue')[];
  };
  integrations: {
    sonarqube?: { url: string; token: string };
    eslint?: { configPath: string };
    jest?: { configPath: string };
    lighthouse?: { enabled: boolean };
  };
}

interface AnalysisReport {
  id: string;
  timestamp: Date;
  branch: string;
  commit: string;
  overallScore: number;
  metrics: CodeMetric[];
  issues: CodeIssue[];
  files: FileAnalysis[];
  dependencies: DependencyAnalysis[];
  qualityGates: QualityGate[];
  teamMetrics: TeamMetrics[];
  technicalDebt: TechnicalDebt[];
  trends: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    coverageTrend: 'improving' | 'stable' | 'declining';
    complexityTrend: 'improving' | 'stable' | 'declining';
    debtTrend: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
  executionTime: number;
}

interface AnalysisAlert {
  id: string;
  type: 'quality_gate_failed' | 'new_vulnerability' | 'blocker_issue' | 'coverage_drop' | 'debt_increase';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  assignee?: string;
  relatedItems: string[];
  actions: {
    label: string;
    action: string;
    params?: any;
  }[];
}

interface UseCodeQualityAnalyzerReturn {
  // Estado
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  metrics: CodeMetric[];
  issues: CodeIssue[];
  files: FileAnalysis[];
  dependencies: DependencyAnalysis[];
  qualityGates: QualityGate[];
  teamMetrics: TeamMetrics[];
  technicalDebt: TechnicalDebt[];
  reports: AnalysisReport[];
  alerts: AnalysisAlert[];
  config: AnalysisConfig;
  
  // Ações de análise
  startAnalysis: (options?: { branch?: string; incremental?: boolean }) => Promise<void>;
  stopAnalysis: () => void;
  scheduleAnalysis: (schedule: string) => void;
  analyzeFile: (filePath: string) => Promise<FileAnalysis>;
  analyzeDependencies: () => Promise<DependencyAnalysis[]>;
  runQualityGates: () => Promise<QualityGate[]>;
  
  // Ações de problemas
  resolveIssue: (issueId: string, resolution?: string) => Promise<void>;
  markFalsePositive: (issueId: string, reason?: string) => Promise<void>;
  assignIssue: (issueId: string, assignee: string) => Promise<void>;
  bulkResolveIssues: (issueIds: string[], resolution?: string) => Promise<void>;
  createIssue: (issue: Partial<CodeIssue>) => Promise<void>;
  
  // Ações de débito técnico
  createDebtItem: (debt: Partial<TechnicalDebt>) => Promise<void>;
  updateDebtItem: (debtId: string, updates: Partial<TechnicalDebt>) => Promise<void>;
  resolveDebtItem: (debtId: string) => Promise<void>;
  prioritizeDebt: (debtIds: string[]) => Promise<void>;
  
  // Ações de configuração
  updateConfig: (updates: Partial<AnalysisConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (configJson: string) => Promise<void>;
  
  // Ações de relatórios
  generateReport: (options?: { format?: 'json' | 'pdf' | 'html'; includeHistory?: boolean }) => Promise<AnalysisReport>;
  exportReport: (reportId: string, format: 'json' | 'pdf' | 'html') => Promise<void>;
  saveReport: (report: AnalysisReport) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  compareReports: (reportId1: string, reportId2: string) => Promise<any>;
  
  // Ações de alertas
  acknowledgeAlert: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  createAlert: (alert: Partial<AnalysisAlert>) => Promise<void>;
  
  // Ações de monitoramento
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getMetricHistory: (metricId: string, timeRange: string) => Promise<{ date: Date; value: number }[]>;
  
  // Utilitários
  clearCache: () => Promise<void>;
  refreshData: () => Promise<void>;
  validateConfig: (config: AnalysisConfig) => { valid: boolean; errors: string[] };
  
  // Valores computados
  overallQualityScore: number;
  criticalIssues: CodeIssue[];
  blockerIssues: CodeIssue[];
  vulnerabilities: CodeIssue[];
  totalTechnicalDebt: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  coveragePercentage: number;
  duplicationsPercentage: number;
  complexityAverage: number;
  unacknowledgedAlerts: AnalysisAlert[];
  highPriorityDebt: TechnicalDebt[];
  outdatedDependencies: DependencyAnalysis[];
  securityVulnerabilities: DependencyAnalysis[];
}

// Configuração padrão
const defaultConfig: AnalysisConfig = {
  autoAnalysis: false,
  analysisInterval: 60,
  includeTests: true,
  excludePatterns: ['node_modules/**', 'dist/**', 'build/**', '*.min.js'],
  qualityGateThresholds: {
    coverage: 80,
    duplications: 5,
    complexity: 10,
    vulnerabilities: 0,
    maintainability: 70,
  },
  notifications: {
    enabled: false,
    channels: [],
    triggers: [],
  },
  integrations: {},
};

export const useCodeQualityAnalyzer = (): UseCodeQualityAnalyzerReturn => {
  // Estado
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CodeMetric[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [files, setFiles] = useState<FileAnalysis[]>([]);
  const [dependencies, setDependencies] = useState<DependencyAnalysis[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([]);
  const [technicalDebt, setTechnicalDebt] = useState<TechnicalDebt[]>([]);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [alerts, setAlerts] = useState<AnalysisAlert[]>([]);
  const [config, setConfig] = useState<AnalysisConfig>(defaultConfig);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Ações de análise
  const startAnalysis = useCallback(async (options?: { branch?: string; incremental?: boolean }) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Aqui seria a integração com ferramentas reais de análise
      // como SonarQube, ESLint, Jest, etc.
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na análise');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
  }, []);

  const scheduleAnalysis = useCallback((schedule: string) => {
    // Implementar agendamento com cron
  }, []);

  const analyzeFile = useCallback(async (filePath: string): Promise<FileAnalysis> => {
    setIsLoading(true);
    try {
      // Simular análise de arquivo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileAnalysis: FileAnalysis = {
        id: Date.now().toString(),
        path: filePath,
        name: filePath.split('/').pop() || '',
        extension: filePath.split('.').pop() || '',
        size: Math.floor(Math.random() * 50000),
        lines: Math.floor(Math.random() * 1000),
        complexity: Math.floor(Math.random() * 20),
        coverage: Math.floor(Math.random() * 100),
        duplications: Math.floor(Math.random() * 10),
        issues: Math.floor(Math.random() * 5),
        maintainabilityIndex: Math.floor(Math.random() * 100),
        lastModified: new Date(),
        author: 'Desenvolvedor',
        language: 'TypeScript',
        hotspots: Math.floor(Math.random() * 3),
        testFiles: [],
      };
      
      return fileAnalysis;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeDependencies = useCallback(async (): Promise<DependencyAnalysis[]> => {
    setIsLoading(true);
    try {
      // Simular análise de dependências
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const deps: DependencyAnalysis[] = [
        {
          id: '1',
          name: 'react',
          version: '18.2.0',
          latestVersion: '18.2.0',
          type: 'production',
          size: 2500,
          vulnerabilities: 0,
          outdated: false,
          license: 'MIT',
          usage: 95,
          impact: 'high',
          securityScore: 95,
          popularityScore: 98,
          maintenanceScore: 92,
        },
      ];
      
      setDependencies(deps);
      return deps;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runQualityGates = useCallback(async (): Promise<QualityGate[]> => {
    setIsLoading(true);
    try {
      // Simular execução de quality gates
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const gates: QualityGate[] = [
        {
          id: '1',
          name: 'Portão Principal',
          conditions: [
            { metric: 'coverage', operator: 'GT', threshold: config.qualityGateThresholds.coverage, status: 'passed', actualValue: 85 },
            { metric: 'duplications', operator: 'LT', threshold: config.qualityGateThresholds.duplications, status: 'passed', actualValue: 3 },
            { metric: 'vulnerabilities', operator: 'EQ', threshold: config.qualityGateThresholds.vulnerabilities, status: 'failed', actualValue: 2 },
          ],
          status: 'failed',
          lastExecution: new Date(),
          executionTime: 1500,
        },
      ];
      
      setQualityGates(gates);
      return gates;
    } finally {
      setIsLoading(false);
    }
  }, [config.qualityGateThresholds]);

  // Ações de problemas
  const resolveIssue = useCallback(async (issueId: string, resolution?: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: 'resolved', resolution, updatedAt: new Date(), resolutionTime: Date.now() - issue.createdAt.getTime() }
        : issue
    ));
  }, []);

  const markFalsePositive = useCallback(async (issueId: string, reason?: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: 'false_positive', resolution: reason, updatedAt: new Date() }
        : issue
    ));
  }, []);

  const assignIssue = useCallback(async (issueId: string, assignee: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, assignee, updatedAt: new Date() }
        : issue
    ));
  }, []);

  const bulkResolveIssues = useCallback(async (issueIds: string[], resolution?: string) => {
    setIssues(prev => prev.map(issue => 
      issueIds.includes(issue.id)
        ? { ...issue, status: 'resolved', resolution, updatedAt: new Date() }
        : issue
    ));
  }, []);

  const createIssue = useCallback(async (issue: Partial<CodeIssue>) => {
    const newIssue: CodeIssue = {
      id: Date.now().toString(),
      type: issue.type || 'bug',
      severity: issue.severity || 'minor',
      title: issue.title || 'Novo problema',
      description: issue.description || '',
      file: issue.file || '',
      line: issue.line || 0,
      rule: issue.rule || '',
      effort: issue.effort || '0min',
      debt: issue.debt || '0min',
      tags: issue.tags || [],
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...issue,
    };
    
    setIssues(prev => [...prev, newIssue]);
  }, []);

  // Ações de débito técnico
  const createDebtItem = useCallback(async (debt: Partial<TechnicalDebt>) => {
    const newDebt: TechnicalDebt = {
      id: Date.now().toString(),
      category: debt.category || 'code_smell',
      description: debt.description || 'Novo débito técnico',
      effort: debt.effort || 1,
      impact: debt.impact || 'low',
      priority: debt.priority || 1,
      files: debt.files || [],
      estimatedCost: debt.estimatedCost || 0,
      remediation: debt.remediation || '',
      tags: debt.tags || [],
      businessImpact: debt.businessImpact || '',
      ...debt,
    };
    
    setTechnicalDebt(prev => [...prev, newDebt]);
  }, []);

  const updateDebtItem = useCallback(async (debtId: string, updates: Partial<TechnicalDebt>) => {
    setTechnicalDebt(prev => prev.map(debt => 
      debt.id === debtId ? { ...debt, ...updates } : debt
    ));
  }, []);

  const resolveDebtItem = useCallback(async (debtId: string) => {
    setTechnicalDebt(prev => prev.filter(debt => debt.id !== debtId));
  }, []);

  const prioritizeDebt = useCallback(async (debtIds: string[]) => {
    setTechnicalDebt(prev => prev.map((debt, index) => 
      debtIds.includes(debt.id) ? { ...debt, priority: 10 - index } : debt
    ));
  }, []);

  // Ações de configuração
  const updateConfig = useCallback(async (updates: Partial<AnalysisConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(async () => {
    setConfig(defaultConfig);
  }, []);

  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback(async (configJson: string) => {
    try {
      const importedConfig = JSON.parse(configJson);
      setConfig(importedConfig);
    } catch (err) {
      setError('Configuração inválida');
    }
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (options?: { format?: 'json' | 'pdf' | 'html'; includeHistory?: boolean }): Promise<AnalysisReport> => {
    setIsLoading(true);
    try {
      const report: AnalysisReport = {
        id: Date.now().toString(),
        timestamp: new Date(),
        branch: 'main',
        commit: 'abc123',
        overallScore: 75,
        metrics,
        issues,
        files,
        dependencies,
        qualityGates,
        teamMetrics,
        technicalDebt,
        trends: {
          qualityTrend: 'stable',
          coverageTrend: 'improving',
          complexityTrend: 'stable',
          debtTrend: 'declining',
        },
        recommendations: [
          'Aumentar cobertura de testes',
          'Refatorar métodos complexos',
          'Atualizar dependências vulneráveis',
        ],
        executionTime: 5000,
      };
      
      setReports(prev => [...prev, report]);
      return report;
    } finally {
      setIsLoading(false);
    }
  }, [metrics, issues, files, dependencies, qualityGates, teamMetrics, technicalDebt]);

  const exportReport = useCallback(async (reportId: string, format: 'json' | 'pdf' | 'html') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: format === 'json' ? 'application/json' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${reportId}.${format}`;
    a.click();
  }, [reports]);

  const saveReport = useCallback(async (report: AnalysisReport) => {
    setReports(prev => [...prev, report]);
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  }, []);

  const compareReports = useCallback(async (reportId1: string, reportId2: string) => {
    const report1 = reports.find(r => r.id === reportId1);
    const report2 = reports.find(r => r.id === reportId2);
    
    if (!report1 || !report2) return null;
    
    return {
      scoreDiff: report2.overallScore - report1.overallScore,
      issuesDiff: report2.issues.length - report1.issues.length,
      coverageDiff: (report2.metrics.find(m => m.id === 'coverage')?.value || 0) - (report1.metrics.find(m => m.id === 'coverage')?.value || 0),
      debtDiff: report2.technicalDebt.reduce((sum, d) => sum + d.effort, 0) - report1.technicalDebt.reduce((sum, d) => sum + d.effort, 0),
    };
  }, [reports]);

  // Ações de alertas
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const createAlert = useCallback(async (alert: Partial<AnalysisAlert>) => {
    const newAlert: AnalysisAlert = {
      id: Date.now().toString(),
      type: alert.type || 'quality_gate_failed',
      severity: alert.severity || 'medium',
      title: alert.title || 'Novo alerta',
      description: alert.description || '',
      timestamp: new Date(),
      acknowledged: false,
      relatedItems: alert.relatedItems || [],
      actions: alert.actions || [],
      ...alert,
    };
    
    setAlerts(prev => [...prev, newAlert]);
  }, []);

  // Ações de monitoramento
  const startMonitoring = useCallback(() => {
    if (monitoringInterval) return;
    
    const interval = setInterval(() => {
      if (config.autoAnalysis) {
        startAnalysis({ incremental: true });
      }
    }, config.analysisInterval * 60 * 1000);
    
    setMonitoringInterval(interval);
  }, [config.autoAnalysis, config.analysisInterval, monitoringInterval, startAnalysis]);

  const stopMonitoring = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
  }, [monitoringInterval]);

  const getMetricHistory = useCallback(async (metricId: string, timeRange: string) => {
    // Simular histórico de métricas
    const history = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      value: Math.random() * 100,
    }));
    
    return history.reverse();
  }, []);

  // Utilitários
  const clearCache = useCallback(async () => {
    setMetrics([]);
    setIssues([]);
    setFiles([]);
    setDependencies([]);
    setQualityGates([]);
    setTeamMetrics([]);
    setTechnicalDebt([]);
    setReports([]);
    setAlerts([]);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        analyzeDependencies(),
        runQualityGates(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [analyzeDependencies, runQualityGates]);

  const validateConfig = useCallback((config: AnalysisConfig) => {
    const errors: string[] = [];
    
    if (config.analysisInterval < 1) {
      errors.push('Intervalo de análise deve ser maior que 0');
    }
    
    if (config.qualityGateThresholds.coverage < 0 || config.qualityGateThresholds.coverage > 100) {
      errors.push('Threshold de cobertura deve estar entre 0 e 100');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  // Valores computados
  const overallQualityScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    
    const scores = metrics.map(metric => {
      const { value, threshold } = metric;
      if (value <= threshold.excellent) return 100;
      if (value <= threshold.good) return 85;
      if (value <= threshold.fair) return 70;
      return 50;
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [metrics]);

  const criticalIssues = useMemo(() => 
    issues.filter(i => i.severity === 'critical' && i.status === 'open'), [issues]
  );
  
  const blockerIssues = useMemo(() => 
    issues.filter(i => i.severity === 'blocker' && i.status === 'open'), [issues]
  );
  
  const vulnerabilities = useMemo(() => 
    issues.filter(i => i.type === 'vulnerability' && i.status === 'open'), [issues]
  );
  
  const totalTechnicalDebt = useMemo(() => 
    technicalDebt.reduce((sum, debt) => sum + debt.effort, 0), [technicalDebt]
  );

  const qualityTrend = useMemo(() => {
    if (metrics.length === 0) return 'stable';
    
    const qualityMetric = metrics.find(m => m.id === 'maintainability');
    if (!qualityMetric || !qualityMetric.history || qualityMetric.history.length < 2) return 'stable';
    
    const recent = qualityMetric.history.slice(-5);
    const trend = recent[recent.length - 1].value - recent[0].value;
    
    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }, [metrics]);

  const coveragePercentage = useMemo(() => {
    const coverageMetric = metrics.find(m => m.id === 'coverage');
    return coverageMetric?.value || 0;
  }, [metrics]);

  const duplicationsPercentage = useMemo(() => {
    const duplicationsMetric = metrics.find(m => m.id === 'duplication');
    return duplicationsMetric?.value || 0;
  }, [metrics]);

  const complexityAverage = useMemo(() => {
    const complexityMetric = metrics.find(m => m.id === 'complexity');
    return complexityMetric?.value || 0;
  }, [metrics]);

  const unacknowledgedAlerts = useMemo(() => 
    alerts.filter(alert => !alert.acknowledged), [alerts]
  );

  const highPriorityDebt = useMemo(() => 
    technicalDebt.filter(debt => debt.priority >= 8), [technicalDebt]
  );

  const outdatedDependencies = useMemo(() => 
    dependencies.filter(dep => dep.outdated), [dependencies]
  );

  const securityVulnerabilities = useMemo(() => 
    dependencies.filter(dep => dep.vulnerabilities > 0), [dependencies]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  return {
    // Estado
    isAnalyzing,
    isLoading,
    error,
    metrics,
    issues,
    files,
    dependencies,
    qualityGates,
    teamMetrics,
    technicalDebt,
    reports,
    alerts,
    config,
    
    // Ações de análise
    startAnalysis,
    stopAnalysis,
    scheduleAnalysis,
    analyzeFile,
    analyzeDependencies,
    runQualityGates,
    
    // Ações de problemas
    resolveIssue,
    markFalsePositive,
    assignIssue,
    bulkResolveIssues,
    createIssue,
    
    // Ações de débito técnico
    createDebtItem,
    updateDebtItem,
    resolveDebtItem,
    prioritizeDebt,
    
    // Ações de configuração
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    
    // Ações de relatórios
    generateReport,
    exportReport,
    saveReport,
    deleteReport,
    compareReports,
    
    // Ações de alertas
    acknowledgeAlert,
    dismissAlert,
    createAlert,
    
    // Ações de monitoramento
    startMonitoring,
    stopMonitoring,
    getMetricHistory,
    
    // Utilitários
    clearCache,
    refreshData,
    validateConfig,
    
    // Valores computados
    overallQualityScore,
    criticalIssues,
    blockerIssues,
    vulnerabilities,
    totalTechnicalDebt,
    qualityTrend,
    coveragePercentage,
    duplicationsPercentage,
    complexityAverage,
    unacknowledgedAlerts,
    highPriorityDebt,
    outdatedDependencies,
    securityVulnerabilities,
  };
};

export default useCodeQualityAnalyzer;