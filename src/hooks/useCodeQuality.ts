import { useState, useEffect, useCallback, useMemo } from 'react';

// Interfaces
interface CodeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  target?: number;
  description: string;
  history: Array<{
    date: Date;
    value: number;
  }>;
}

interface CodeIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code_smell' | 'duplication' | 'complexity';
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  title: string;
  description: string;
  file: string;
  line: number;
  rule: string;
  effort: string;
  tags: string[];
  assignee?: string;
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive';
  createdAt: Date;
  updatedAt: Date;
  priority: number;
}

interface CodeCoverage {
  id: string;
  file: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
  lastUpdated: Date;
}

interface CodeComplexity {
  id: string;
  file: string;
  function: string;
  complexity: number;
  lines: number;
  parameters: number;
  maintainabilityIndex: number;
  cognitiveComplexity: number;
  halsteadVolume: number;
  cyclomaticComplexity: number;
}

interface CodeDuplication {
  id: string;
  files: string[];
  lines: number;
  tokens: number;
  percentage: number;
  blocks: Array<{
    file: string;
    startLine: number;
    endLine: number;
    content: string;
  }>;
  similarity: number;
}

interface CodeReview {
  id: string;
  title: string;
  author: string;
  reviewer: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'merged' | 'rejected';
  files: number;
  additions: number;
  deletions: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
  branch: string;
  pullRequestUrl?: string;
}

interface QualityGate {
  id: string;
  name: string;
  conditions: Array<{
    metric: string;
    operator: 'greater' | 'less' | 'equal';
    value: number;
    status: 'passed' | 'failed' | 'warning';
    actualValue?: number;
  }>;
  status: 'passed' | 'failed' | 'warning';
  lastRun: Date;
  executionTime: number;
  project: string;
}

interface AnalysisConfig {
  enabled: boolean;
  schedule: 'manual' | 'on_commit' | 'daily' | 'weekly';
  rules: {
    bugs: boolean;
    vulnerabilities: boolean;
    codeSmells: boolean;
    duplication: boolean;
    coverage: boolean;
    complexity: boolean;
  };
  thresholds: {
    coverage: number;
    duplication: number;
    complexity: number;
    maintainability: number;
    reliability: number;
    security: number;
  };
  notifications: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    events: ('new_issues' | 'quality_gate' | 'coverage_drop' | 'security_alert')[];
  };
  exclusions: {
    files: string[];
    directories: string[];
    rules: string[];
  };
}

interface QualityReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'trend' | 'comparison';
  format: 'pdf' | 'html' | 'json' | 'csv';
  data: any;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  filters: {
    projects?: string[];
    types?: string[];
    severities?: string[];
  };
}

interface QualityAlert {
  id: string;
  type: 'quality_gate_failed' | 'coverage_drop' | 'new_critical_issue' | 'security_vulnerability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  acknowledged: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

interface QualityTrend {
  metric: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  data: Array<{
    date: Date;
    value: number;
    target?: number;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
}

interface AnalysisResult {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  metrics: CodeMetric[];
  issues: CodeIssue[];
  coverage: CodeCoverage[];
  complexity: CodeComplexity[];
  duplication: CodeDuplication[];
  qualityGates: QualityGate[];
  errors?: string[];
}

interface UseCodeQualityReturn {
  // Estado
  metrics: CodeMetric[];
  issues: CodeIssue[];
  coverage: CodeCoverage[];
  complexity: CodeComplexity[];
  duplication: CodeDuplication[];
  reviews: CodeReview[];
  qualityGates: QualityGate[];
  reports: QualityReport[];
  alerts: QualityAlert[];
  trends: QualityTrend[];
  config: AnalysisConfig;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  lastAnalysis?: AnalysisResult;

  // Ações de análise
  startAnalysis: (options?: { full?: boolean; files?: string[] }) => Promise<void>;
  stopAnalysis: () => void;
  refreshAnalysis: () => Promise<void>;
  scheduleAnalysis: (schedule: AnalysisConfig['schedule']) => void;
  getAnalysisHistory: (limit?: number) => AnalysisResult[];

  // Ações de issues
  getIssuesByType: (type: CodeIssue['type']) => CodeIssue[];
  getIssuesBySeverity: (severity: CodeIssue['severity']) => CodeIssue[];
  resolveIssue: (issueId: string, resolution: 'fixed' | 'false_positive' | 'wont_fix') => void;
  assignIssue: (issueId: string, assignee: string) => void;
  addIssueComment: (issueId: string, comment: string) => void;
  bulkUpdateIssues: (issueIds: string[], updates: Partial<CodeIssue>) => void;
  exportIssues: (format: 'csv' | 'json' | 'pdf') => void;

  // Ações de cobertura
  getCoverageByFile: (file: string) => CodeCoverage | undefined;
  getCoverageTrend: (period: 'week' | 'month' | 'quarter') => QualityTrend;
  setCoverageTarget: (target: number) => void;
  generateCoverageReport: () => void;

  // Ações de complexidade
  getComplexityByFile: (file: string) => CodeComplexity[];
  getHighComplexityFunctions: (threshold?: number) => CodeComplexity[];
  setComplexityThreshold: (threshold: number) => void;
  analyzeComplexityTrend: () => QualityTrend;

  // Ações de duplicação
  getDuplicationByFile: (file: string) => CodeDuplication[];
  resolveDuplication: (duplicationId: string) => void;
  setDuplicationThreshold: (threshold: number) => void;

  // Ações de quality gates
  createQualityGate: (gate: Omit<QualityGate, 'id' | 'lastRun' | 'executionTime'>) => void;
  updateQualityGate: (gateId: string, updates: Partial<QualityGate>) => void;
  deleteQualityGate: (gateId: string) => void;
  runQualityGate: (gateId: string) => Promise<QualityGate>;
  getQualityGateHistory: (gateId: string) => Array<{ date: Date; status: string }>;

  // Ações de relatórios
  generateReport: (type: QualityReport['type'], options?: any) => Promise<QualityReport>;
  exportReport: (reportId: string, format: QualityReport['format']) => void;
  scheduleReport: (reportConfig: any) => void;
  deleteReport: (reportId: string) => void;
  shareReport: (reportId: string, recipients: string[]) => void;

  // Ações de alertas
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  createAlert: (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'acknowledged'>) => void;
  getAlertHistory: (limit?: number) => QualityAlert[];
  configureAlertRules: (rules: any) => void;

  // Ações de configuração
  updateConfig: (updates: Partial<AnalysisConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => void;
  importConfig: (config: AnalysisConfig) => void;
  validateConfig: (config: AnalysisConfig) => { valid: boolean; errors: string[] };

  // Ações de monitoramento
  startRealTimeMonitoring: () => void;
  stopRealTimeMonitoring: () => void;
  getMetricHistory: (metricId: string, period: 'day' | 'week' | 'month') => Array<{ date: Date; value: number }>;
  refreshMetrics: () => Promise<void>;

  // Utilitários
  clearCache: () => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'json' | 'csv') => void;
  importData: (data: any) => void;
  getInsights: () => Array<{ type: string; message: string; priority: number }>;
  compareProjects: (projectIds: string[]) => any;
  predictQualityTrend: (metric: string, days: number) => Array<{ date: Date; predicted: number }>;

  // Valores computados
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  overallCoverage: number;
  averageComplexity: number;
  duplicationPercentage: number;
  qualityGatesPassed: number;
  trendsImproving: number;
  alertsCount: number;
  lastAnalysisDate?: Date;
  nextScheduledAnalysis?: Date;
  topIssueTypes: Array<{ type: string; count: number }>;
  worstFiles: Array<{ file: string; score: number }>;
  bestFiles: Array<{ file: string; score: number }>;
  qualityEvolution: 'improving' | 'declining' | 'stable';
}

const useCodeQuality = (): UseCodeQualityReturn => {
  // Estados
  const [metrics, setMetrics] = useState<CodeMetric[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [coverage, setCoverage] = useState<CodeCoverage[]>([]);
  const [complexity, setComplexity] = useState<CodeComplexity[]>([]);
  const [duplication, setDuplication] = useState<CodeDuplication[]>([]);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [trends, setTrends] = useState<QualityTrend[]>([]);
  const [config, setConfig] = useState<AnalysisConfig>(defaultConfig);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult>();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [isRealTimeMonitoring, setIsRealTimeMonitoring] = useState(false);

  // Inicialização
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(generateMockMetrics());
      setIssues(generateMockIssues());
      setCoverage(generateMockCoverage());
      setComplexity(generateMockComplexity());
      setDuplication(generateMockDuplication());
      setReviews(generateMockReviews());
      setQualityGates(generateMockQualityGates());
      setTrends(generateMockTrends());
      
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados de qualidade');
    } finally {
      setIsLoading(false);
    }
  };

  // Ações de análise
  const startAnalysis = useCallback(async (options?: { full?: boolean; files?: string[] }) => {
    setIsAnalyzing(true);
    setError(null);
    
    const analysisResult: AnalysisResult = {
      id: `analysis_${Date.now()}`,
      status: 'running',
      startedAt: new Date(),
      metrics: [],
      issues: [],
      coverage: [],
      complexity: [],
      duplication: [],
      qualityGates: []
    };
    
    try {
      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newMetrics = generateMockMetrics();
      const newIssues = generateMockIssues();
      const newCoverage = generateMockCoverage();
      const newComplexity = generateMockComplexity();
      const newDuplication = generateMockDuplication();
      const newQualityGates = generateMockQualityGates();
      
      analysisResult.status = 'completed';
      analysisResult.completedAt = new Date();
      analysisResult.duration = 3000;
      analysisResult.metrics = newMetrics;
      analysisResult.issues = newIssues;
      analysisResult.coverage = newCoverage;
      analysisResult.complexity = newComplexity;
      analysisResult.duplication = newDuplication;
      analysisResult.qualityGates = newQualityGates;
      
      setMetrics(newMetrics);
      setIssues(newIssues);
      setCoverage(newCoverage);
      setComplexity(newComplexity);
      setDuplication(newDuplication);
      setQualityGates(newQualityGates);
      setLastAnalysis(analysisResult);
      
      setAnalysisHistory(prev => [analysisResult, ...prev.slice(0, 9)]);
      
      // Verificar alertas
      checkForAlerts(analysisResult);
      
    } catch (err) {
      analysisResult.status = 'failed';
      analysisResult.errors = ['Erro durante a análise'];
      setError('Erro durante a análise de qualidade');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
  }, []);

  const refreshAnalysis = useCallback(async () => {
    await startAnalysis();
  }, [startAnalysis]);

  const scheduleAnalysis = useCallback((schedule: AnalysisConfig['schedule']) => {
    setConfig(prev => ({ ...prev, schedule }));
  }, []);

  const getAnalysisHistory = useCallback((limit = 10) => {
    return analysisHistory.slice(0, limit);
  }, [analysisHistory]);

  // Ações de issues
  const getIssuesByType = useCallback((type: CodeIssue['type']) => {
    return issues.filter(issue => issue.type === type);
  }, [issues]);

  const getIssuesBySeverity = useCallback((severity: CodeIssue['severity']) => {
    return issues.filter(issue => issue.severity === severity);
  }, [issues]);

  const resolveIssue = useCallback((issueId: string, resolution: 'fixed' | 'false_positive' | 'wont_fix') => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: resolution === 'fixed' ? 'resolved' : 'false_positive', updatedAt: new Date() }
        : issue
    ));
  }, []);

  const assignIssue = useCallback((issueId: string, assignee: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, assignee, updatedAt: new Date() }
        : issue
    ));
  }, []);

  const addIssueComment = useCallback((issueId: string, comment: string) => {
  }, []);

  const bulkUpdateIssues = useCallback((issueIds: string[], updates: Partial<CodeIssue>) => {
    setIssues(prev => prev.map(issue => 
      issueIds.includes(issue.id) 
        ? { ...issue, ...updates, updatedAt: new Date() }
        : issue
    ));
  }, []);

  const exportIssues = useCallback((format: 'csv' | 'json' | 'pdf') => {
  }, []);

  // Ações de cobertura
  const getCoverageByFile = useCallback((file: string) => {
    return coverage.find(c => c.file === file);
  }, [coverage]);

  const getCoverageTrend = useCallback((period: 'week' | 'month' | 'quarter') => {
    return generateMockTrend('coverage', period);
  }, []);

  const setCoverageTarget = useCallback((target: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: { ...prev.thresholds, coverage: target }
    }));
  }, []);

  const generateCoverageReport = useCallback(() => {
  }, []);

  // Ações de complexidade
  const getComplexityByFile = useCallback((file: string) => {
    return complexity.filter(c => c.file === file);
  }, [complexity]);

  const getHighComplexityFunctions = useCallback((threshold = 10) => {
    return complexity.filter(c => c.complexity > threshold);
  }, [complexity]);

  const setComplexityThreshold = useCallback((threshold: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: { ...prev.thresholds, complexity: threshold }
    }));
  }, []);

  const analyzeComplexityTrend = useCallback(() => {
    return generateMockTrend('complexity', 'month');
  }, []);

  // Ações de duplicação
  const getDuplicationByFile = useCallback((file: string) => {
    return duplication.filter(d => d.files.includes(file));
  }, [duplication]);

  const resolveDuplication = useCallback((duplicationId: string) => {
    setDuplication(prev => prev.filter(d => d.id !== duplicationId));
  }, []);

  const setDuplicationThreshold = useCallback((threshold: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: { ...prev.thresholds, duplication: threshold }
    }));
  }, []);

  // Ações de quality gates
  const createQualityGate = useCallback((gate: Omit<QualityGate, 'id' | 'lastRun' | 'executionTime'>) => {
    const newGate: QualityGate = {
      ...gate,
      id: `gate_${Date.now()}`,
      lastRun: new Date(),
      executionTime: 0
    };
    setQualityGates(prev => [...prev, newGate]);
  }, []);

  const updateQualityGate = useCallback((gateId: string, updates: Partial<QualityGate>) => {
    setQualityGates(prev => prev.map(gate => 
      gate.id === gateId ? { ...gate, ...updates } : gate
    ));
  }, []);

  const deleteQualityGate = useCallback((gateId: string) => {
    setQualityGates(prev => prev.filter(gate => gate.id !== gateId));
  }, []);

  const runQualityGate = useCallback(async (gateId: string) => {
    const gate = qualityGates.find(g => g.id === gateId);
    if (!gate) throw new Error('Quality gate não encontrado');
    
    // Simular execução
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedGate = {
      ...gate,
      lastRun: new Date(),
      executionTime: 1000,
      status: 'passed' as const
    };
    
    updateQualityGate(gateId, updatedGate);
    return updatedGate;
  }, [qualityGates, updateQualityGate]);

  const getQualityGateHistory = useCallback((gateId: string) => {
    // Simular histórico
    return [
      { date: new Date(), status: 'passed' },
      { date: new Date(Date.now() - 86400000), status: 'failed' },
      { date: new Date(Date.now() - 172800000), status: 'passed' }
    ];
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (type: QualityReport['type'], options?: any) => {
    const report: QualityReport = {
      id: `report_${Date.now()}`,
      name: `Relatório ${type}`,
      type,
      format: 'html',
      data: { metrics, issues, coverage },
      generatedAt: new Date(),
      period: {
        start: new Date(Date.now() - 30 * 86400000),
        end: new Date()
      },
      filters: options?.filters || {}
    };
    
    setReports(prev => [report, ...prev]);
    return report;
  }, [metrics, issues, coverage]);

  const exportReport = useCallback((reportId: string, format: QualityReport['format']) => {
  }, []);

  const scheduleReport = useCallback((reportConfig: any) => {
  }, []);

  const deleteReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  }, []);

  const shareReport = useCallback((reportId: string, recipients: string[]) => {
  }, []);

  // Ações de alertas
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
        : alert
    ));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const createAlert = useCallback((alert: Omit<QualityAlert, 'id' | 'createdAt' | 'acknowledged'>) => {
    const newAlert: QualityAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      createdAt: new Date(),
      acknowledged: false
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const getAlertHistory = useCallback((limit = 50) => {
    return alerts.slice(0, limit);
  }, [alerts]);

  const configureAlertRules = useCallback((rules: any) => {
  }, []);

  // Ações de configuração
  const updateConfig = useCallback((updates: Partial<AnalysisConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const exportConfig = useCallback(() => {
    const configJson = JSON.stringify(config, null, 2);
  }, [config]);

  const importConfig = useCallback((newConfig: AnalysisConfig) => {
    setConfig(newConfig);
  }, []);

  const validateConfig = useCallback((configToValidate: AnalysisConfig) => {
    const errors: string[] = [];
    
    if (configToValidate.thresholds.coverage < 0 || configToValidate.thresholds.coverage > 100) {
      errors.push('Threshold de cobertura deve estar entre 0 e 100');
    }
    
    return { valid: errors.length === 0, errors };
  }, []);

  // Ações de monitoramento
  const startRealTimeMonitoring = useCallback(() => {
    setIsRealTimeMonitoring(true);
  }, []);

  const stopRealTimeMonitoring = useCallback(() => {
    setIsRealTimeMonitoring(false);
  }, []);

  const getMetricHistory = useCallback((metricId: string, period: 'day' | 'week' | 'month') => {
    // Simular histórico de métrica
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: Math.random() * 100
    }));
  }, []);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics(generateMockMetrics());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utilitários
  const clearCache = useCallback(() => {
  }, []);

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, []);

  const exportData = useCallback((format: 'json' | 'csv') => {
  }, []);

  const importData = useCallback((data: any) => {
  }, []);

  const getInsights = useCallback(() => {
    const insights = [];
    
    if (overallCoverage < 80) {
      insights.push({
        type: 'coverage',
        message: 'Cobertura de testes abaixo do recomendado',
        priority: 2
      });
    }
    
    if (criticalIssues > 0) {
      insights.push({
        type: 'issues',
        message: `${criticalIssues} issues críticas encontradas`,
        priority: 3
      });
    }
    
    return insights;
  }, []);

  const compareProjects = useCallback((projectIds: string[]) => {
    return {};
  }, []);

  const predictQualityTrend = useCallback((metric: string, days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000),
      predicted: Math.random() * 100
    }));
  }, []);

  // Função para verificar alertas
  const checkForAlerts = useCallback((analysisResult: AnalysisResult) => {
    const newAlerts: QualityAlert[] = [];
    
    // Verificar quality gates falharam
    const failedGates = analysisResult.qualityGates.filter(gate => gate.status === 'failed');
    if (failedGates.length > 0) {
      newAlerts.push({
        id: `alert_${Date.now()}_gates`,
        type: 'quality_gate_failed',
        severity: 'high',
        title: 'Quality Gates Falharam',
        message: `${failedGates.length} quality gates falharam`,
        data: { gates: failedGates },
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Verificar issues críticas
    const criticalIssuesCount = analysisResult.issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'blocker'
    ).length;
    
    if (criticalIssuesCount > 0) {
      newAlerts.push({
        id: `alert_${Date.now()}_critical`,
        type: 'new_critical_issue',
        severity: 'critical',
        title: 'Novas Issues Críticas',
        message: `${criticalIssuesCount} novas issues críticas encontradas`,
        data: { count: criticalIssuesCount },
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
  }, []);

  // Valores computados
  const overallScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((sum, metric) => {
      const score = metric.status === 'excellent' ? 100 : 
                   metric.status === 'good' ? 75 : 
                   metric.status === 'warning' ? 50 : 25;
      return sum + score;
    }, 0) / metrics.length);
  }, [metrics]);

  const totalIssues = useMemo(() => issues.length, [issues]);
  
  const criticalIssues = useMemo(() => 
    issues.filter(issue => issue.severity === 'critical' || issue.severity === 'blocker').length,
    [issues]
  );

  const overallCoverage = useMemo(() => {
    if (coverage.length === 0) return 0;
    return Math.round(coverage.reduce((sum, c) => sum + c.lines.percentage, 0) / coverage.length);
  }, [coverage]);

  const averageComplexity = useMemo(() => {
    if (complexity.length === 0) return 0;
    return Math.round(complexity.reduce((sum, c) => sum + c.complexity, 0) / complexity.length);
  }, [complexity]);

  const duplicationPercentage = useMemo(() => {
    if (duplication.length === 0) return 0;
    return Math.round(duplication.reduce((sum, d) => sum + d.percentage, 0) / duplication.length);
  }, [duplication]);

  const qualityGatesPassed = useMemo(() => 
    qualityGates.filter(gate => gate.status === 'passed').length,
    [qualityGates]
  );

  const trendsImproving = useMemo(() => 
    trends.filter(trend => trend.trend === 'improving').length,
    [trends]
  );

  const alertsCount = useMemo(() => 
    alerts.filter(alert => !alert.acknowledged).length,
    [alerts]
  );

  const lastAnalysisDate = useMemo(() => 
    lastAnalysis?.completedAt,
    [lastAnalysis]
  );

  const nextScheduledAnalysis = useMemo(() => {
    if (config.schedule === 'manual') return undefined;
    
    const now = new Date();
    switch (config.schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }, [config.schedule]);

  const topIssueTypes = useMemo(() => {
    const typeCounts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [issues]);

  const worstFiles = useMemo(() => {
    // Simular cálculo de score por arquivo
    const fileScores = coverage.map(c => ({
      file: c.file,
      score: Math.round((c.lines.percentage + c.branches.percentage + c.functions.percentage) / 3)
    }));
    
    return fileScores
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
  }, [coverage]);

  const bestFiles = useMemo(() => {
    // Simular cálculo de score por arquivo
    const fileScores = coverage.map(c => ({
      file: c.file,
      score: Math.round((c.lines.percentage + c.branches.percentage + c.functions.percentage) / 3)
    }));
    
    return fileScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [coverage]);

  const qualityEvolution = useMemo(() => {
    if (analysisHistory.length < 2) return 'stable';
    
    const current = analysisHistory[0];
    const previous = analysisHistory[1];
    
    const currentScore = current.metrics.reduce((sum, m) => sum + m.value, 0) / current.metrics.length;
    const previousScore = previous.metrics.reduce((sum, m) => sum + m.value, 0) / previous.metrics.length;
    
    if (currentScore > previousScore * 1.05) return 'improving';
    if (currentScore < previousScore * 0.95) return 'declining';
    return 'stable';
  }, [analysisHistory]);

  return {
    // Estado
    metrics,
    issues,
    coverage,
    complexity,
    duplication,
    reviews,
    qualityGates,
    reports,
    alerts,
    trends,
    config,
    isAnalyzing,
    isLoading,
    error,
    lastAnalysis,

    // Ações de análise
    startAnalysis,
    stopAnalysis,
    refreshAnalysis,
    scheduleAnalysis,
    getAnalysisHistory,

    // Ações de issues
    getIssuesByType,
    getIssuesBySeverity,
    resolveIssue,
    assignIssue,
    addIssueComment,
    bulkUpdateIssues,
    exportIssues,

    // Ações de cobertura
    getCoverageByFile,
    getCoverageTrend,
    setCoverageTarget,
    generateCoverageReport,

    // Ações de complexidade
    getComplexityByFile,
    getHighComplexityFunctions,
    setComplexityThreshold,
    analyzeComplexityTrend,

    // Ações de duplicação
    getDuplicationByFile,
    resolveDuplication,
    setDuplicationThreshold,

    // Ações de quality gates
    createQualityGate,
    updateQualityGate,
    deleteQualityGate,
    runQualityGate,
    getQualityGateHistory,

    // Ações de relatórios
    generateReport,
    exportReport,
    scheduleReport,
    deleteReport,
    shareReport,

    // Ações de alertas
    acknowledgeAlert,
    dismissAlert,
    createAlert,
    getAlertHistory,
    configureAlertRules,

    // Ações de configuração
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    validateConfig,

    // Ações de monitoramento
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    getMetricHistory,
    refreshMetrics,

    // Utilitários
    clearCache,
    refreshData,
    exportData,
    importData,
    getInsights,
    compareProjects,
    predictQualityTrend,

    // Valores computados
    overallScore,
    totalIssues,
    criticalIssues,
    overallCoverage,
    averageComplexity,
    duplicationPercentage,
    qualityGatesPassed,
    trendsImproving,
    alertsCount,
    lastAnalysisDate,
    nextScheduledAnalysis,
    topIssueTypes,
    worstFiles,
    bestFiles,
    qualityEvolution
  };
};

// Configuração padrão
const defaultConfig: AnalysisConfig = {
  enabled: true,
  schedule: 'on_commit',
  rules: {
    bugs: true,
    vulnerabilities: true,
    codeSmells: true,
    duplication: true,
    coverage: true,
    complexity: true
  },
  thresholds: {
    coverage: 80,
    duplication: 3,
    complexity: 10,
    maintainability: 70,
    reliability: 80,
    security: 90
  },
  notifications: {
    enabled: true,
    channels: ['email'],
    events: ['new_issues', 'quality_gate']
  },
  exclusions: {
    files: [],
    directories: ['node_modules', 'dist', 'build'],
    rules: []
  }
};

// Funções auxiliares para gerar dados simulados
const generateMockMetrics = (): CodeMetric[] => [
  {
    id: '1',
    name: 'Cobertura de Código',
    value: 85.2,
    unit: '%',
    status: 'excellent',
    trend: 'up',
    change: 2.1,
    target: 80,
    description: 'Percentual de código coberto por testes',
    history: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: 80 + Math.random() * 10
    }))
  },
  {
    id: '2',
    name: 'Complexidade Ciclomática',
    value: 7.3,
    unit: '',
    status: 'good',
    trend: 'stable',
    change: 0.1,
    target: 10,
    description: 'Complexidade média das funções',
    history: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: 5 + Math.random() * 5
    }))
  },
  {
    id: '3',
    name: 'Duplicação de Código',
    value: 2.1,
    unit: '%',
    status: 'excellent',
    trend: 'down',
    change: -0.5,
    target: 3,
    description: 'Percentual de código duplicado',
    history: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: 1 + Math.random() * 3
    }))
  }
];

const generateMockIssues = (): CodeIssue[] => [
  {
    id: '1',
    type: 'bug',
    severity: 'critical',
    title: 'Null pointer exception',
    description: 'Possível acesso a objeto nulo sem verificação',
    file: 'src/components/UserProfile.tsx',
    line: 45,
    rule: 'typescript:no-null-check',
    effort: '15min',
    tags: ['reliability', 'typescript'],
    status: 'open',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    priority: 1
  },
  {
    id: '2',
    type: 'vulnerability',
    severity: 'major',
    title: 'SQL Injection vulnerability',
    description: 'Query SQL construída sem sanitização adequada',
    file: 'src/api/users.ts',
    line: 23,
    rule: 'security:sql-injection',
    effort: '30min',
    tags: ['security', 'database'],
    status: 'confirmed',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    priority: 2
  }
];

const generateMockCoverage = (): CodeCoverage[] => [
  {
    id: '1',
    file: 'src/components/UserProfile.tsx',
    lines: { total: 120, covered: 102, percentage: 85.0 },
    branches: { total: 24, covered: 20, percentage: 83.3 },
    functions: { total: 8, covered: 7, percentage: 87.5 },
    statements: { total: 95, covered: 82, percentage: 86.3 },
    lastUpdated: new Date()
  },
  {
    id: '2',
    file: 'src/api/users.ts',
    lines: { total: 85, covered: 68, percentage: 80.0 },
    branches: { total: 16, covered: 12, percentage: 75.0 },
    functions: { total: 6, covered: 5, percentage: 83.3 },
    statements: { total: 72, covered: 58, percentage: 80.6 },
    lastUpdated: new Date()
  }
];

const generateMockComplexity = (): CodeComplexity[] => [
  {
    id: '1',
    file: 'src/components/UserProfile.tsx',
    function: 'validateUserData',
    complexity: 12,
    lines: 45,
    parameters: 3,
    maintainabilityIndex: 65,
    cognitiveComplexity: 8,
    halsteadVolume: 150,
    cyclomaticComplexity: 12
  },
  {
    id: '2',
    file: 'src/api/users.ts',
    function: 'processUserQuery',
    complexity: 8,
    lines: 32,
    parameters: 2,
    maintainabilityIndex: 72,
    cognitiveComplexity: 6,
    halsteadVolume: 120,
    cyclomaticComplexity: 8
  }
];

const generateMockDuplication = (): CodeDuplication[] => [
  {
    id: '1',
    files: ['src/components/UserProfile.tsx', 'src/components/AdminProfile.tsx'],
    lines: 25,
    tokens: 150,
    percentage: 2.1,
    blocks: [
      { file: 'src/components/UserProfile.tsx', startLine: 45, endLine: 70, content: 'duplicated code block' },
      { file: 'src/components/AdminProfile.tsx', startLine: 32, endLine: 57, content: 'duplicated code block' }
    ],
    similarity: 95.5
  }
];

const generateMockReviews = (): CodeReview[] => [
  {
    id: '1',
    title: 'Implementar autenticação JWT',
    author: 'João Silva',
    reviewer: 'Maria Santos',
    status: 'approved',
    files: 5,
    additions: 120,
    deletions: 45,
    comments: 3,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    branch: 'feature/jwt-auth',
    pullRequestUrl: 'https://github.com/repo/pull/123'
  }
];

const generateMockQualityGates = (): QualityGate[] => [
  {
    id: '1',
    name: 'Quality Gate Principal',
    conditions: [
      { metric: 'coverage', operator: 'greater', value: 80, status: 'passed', actualValue: 85 },
      { metric: 'duplication', operator: 'less', value: 3, status: 'passed', actualValue: 2.1 },
      { metric: 'complexity', operator: 'less', value: 10, status: 'warning', actualValue: 12 }
    ],
    status: 'passed',
    lastRun: new Date(),
    executionTime: 1500,
    project: 'main'
  }
];

const generateMockTrends = (): QualityTrend[] => [
  {
    metric: 'coverage',
    period: 'month',
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: 80 + Math.random() * 10,
      target: 80
    })),
    trend: 'improving',
    changePercentage: 5.2
  },
  {
    metric: 'complexity',
    period: 'month',
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: 5 + Math.random() * 5,
      target: 10
    })),
    trend: 'stable',
    changePercentage: 0.1
  }
];

const generateMockTrend = (metric: string, period: 'week' | 'month' | 'quarter'): QualityTrend => {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  
  return {
    metric,
    period,
    data: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000),
      value: Math.random() * 100,
      target: 80
    })),
    trend: 'improving',
    changePercentage: Math.random() * 10 - 5
  };
};

export default useCodeQuality;
export type {
  CodeMetric,
  CodeIssue,
  CodeCoverage,
  CodeComplexity,
  CodeDuplication,
  CodeReview,
  QualityGate,
  AnalysisConfig,
  QualityReport,
  QualityAlert,
  QualityTrend,
  AnalysisResult,
  UseCodeQualityReturn
};