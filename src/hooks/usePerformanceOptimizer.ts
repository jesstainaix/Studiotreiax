import { useState, useEffect, useCallback } from 'react';

// Interfaces
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  category: 'speed' | 'reliability' | 'scalability' | 'efficiency';
  description: string;
  impact: 'low' | 'medium' | 'high';
  history: HistoryPoint[];
}

interface HistoryPoint {
  timestamp: Date;
  value: number;
}

interface PerformanceIssue {
  id: string;
  type: 'bottleneck' | 'memory_leak' | 'slow_query' | 'high_cpu' | 'network_latency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_components: string[];
  impact_score: number;
  detection_time: Date;
  estimated_fix_time: number;
  fix_suggestions: FixSuggestion[];
  status: 'detected' | 'investigating' | 'fixing' | 'resolved';
  priority: number;
}

interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementation_steps: string[];
  estimated_improvement: number;
  confidence: number;
  dependencies: string[];
}

interface ResourceUsage {
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
    temperature: number;
    processes: ProcessInfo[];
  };
  memory: {
    used: number;
    total: number;
    available: number;
    swap_used: number;
    swap_total: number;
    heap_size: number;
  };
  disk: {
    used: number;
    total: number;
    read_speed: number;
    write_speed: number;
    iops: number;
  };
  network: {
    download_speed: number;
    upload_speed: number;
    latency: number;
    packet_loss: number;
    bandwidth_usage: number;
  };
  gpu: {
    usage: number;
    memory_used: number;
    memory_total: number;
    temperature: number;
  };
}

interface ProcessInfo {
  name: string;
  pid: number;
  cpu_usage: number;
  memory_usage: number;
  status: 'running' | 'sleeping' | 'stopped';
}

interface UserExperienceMetric {
  page_load_time: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  first_input_delay: number;
  cumulative_layout_shift: number;
  time_to_interactive: number;
  bounce_rate: number;
  session_duration: number;
  user_satisfaction: number;
  error_rate: number;
}

interface OptimizationRecommendation {
  id: string;
  category: 'database' | 'frontend' | 'backend' | 'infrastructure' | 'caching';
  title: string;
  description: string;
  current_state: string;
  proposed_solution: string;
  expected_improvement: {
    metric: string;
    improvement_percentage: number;
    confidence: number;
  }[];
  implementation: {
    effort: 'low' | 'medium' | 'high';
    time_estimate: number;
    complexity: 'simple' | 'moderate' | 'complex';
    risk_level: 'low' | 'medium' | 'high';
    prerequisites: string[];
  };
  priority_score: number;
  roi_estimate: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
}

interface PerformanceTest {
  id: string;
  name: string;
  type: 'load' | 'stress' | 'spike' | 'endurance' | 'volume';
  status: 'pending' | 'running' | 'completed' | 'failed';
  configuration: {
    duration: number;
    concurrent_users: number;
    ramp_up_time: number;
    target_endpoints: string[];
    test_data_size: number;
  };
  results?: {
    start_time: Date;
    end_time: Date;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    max_response_time: number;
    min_response_time: number;
    throughput: number;
    error_rate: number;
    cpu_usage_peak: number;
    memory_usage_peak: number;
  };
  metrics: PerformanceMetric[];
  issues_found: PerformanceIssue[];
}

interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'resource_exhaustion' | 'service_down';
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  current_value: number;
  threshold_value: number;
  message: string;
  triggered_at: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolution_time?: Date;
  actions_taken: string[];
}

interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    interval: number;
    metrics_retention: number;
    alert_thresholds: Record<string, number>;
    auto_scaling: boolean;
  };
  optimization: {
    auto_optimize: boolean;
    optimization_level: 'conservative' | 'balanced' | 'aggressive';
    cache_strategy: 'memory' | 'redis' | 'hybrid';
    compression_enabled: boolean;
    cdn_enabled: boolean;
  };
  testing: {
    auto_test: boolean;
    test_frequency: 'daily' | 'weekly' | 'monthly';
    load_test_users: number;
    performance_budget: Record<string, number>;
  };
  alerts: {
    email_notifications: boolean;
    slack_notifications: boolean;
    webhook_url?: string;
    escalation_rules: string[];
  };
}

interface PerformanceReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  generated_at: Date;
  summary: {
    overall_score: number;
    key_metrics: PerformanceMetric[];
    critical_issues: number;
    resolved_issues: number;
    performance_trend: 'improving' | 'stable' | 'declining';
  };
  detailed_analysis: {
    bottlenecks: PerformanceIssue[];
    resource_utilization: ResourceUsage;
    user_experience: UserExperienceMetric;
    optimization_opportunities: OptimizationRecommendation[];
  };
  recommendations: OptimizationRecommendation[];
  charts: any[];
}

interface PerformanceInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  related_metrics: string[];
  generated_at: Date;
}

interface PerformanceBenchmark {
  id: string;
  name: string;
  category: string;
  industry_average: number;
  best_practice: number;
  current_value: number;
  percentile_rank: number;
  improvement_potential: number;
}

interface PerformanceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  rate_of_change: number;
  confidence: number;
  forecast: {
    next_week: number;
    next_month: number;
    next_quarter: number;
  };
}

interface MonitoringData {
  timestamp: Date;
  metrics: Record<string, number>;
  alerts: PerformanceAlert[];
  resource_usage: ResourceUsage;
}

export const usePerformanceOptimizer = () => {
  // Estado principal
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [userExperience, setUserExperience] = useState<UserExperienceMetric | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [tests, setTests] = useState<PerformanceTest[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [config, setConfig] = useState<PerformanceConfig>(defaultConfig);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([]);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  
  // Estados de controle
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Ações de análise
  const startOptimization = useCallback(async () => {
    setIsOptimizing(true);
    try {
      // Simular análise de performance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Gerar dados mock em batch para evitar conflitos de estado
      const mockData = {
        metrics: generateMockMetrics(),
        issues: generateMockIssues(),
        resourceUsage: generateMockResourceUsage(),
        userExperience: generateMockUserExperience(),
        recommendations: generateMockRecommendations(),
        insights: generateMockInsights(),
        trends: generateMockTrends()
      };
      
      // Atualizar estados em sequência para evitar conflitos
      setMetrics(mockData.metrics);
      setIssues(mockData.issues);
      setResourceUsage(mockData.resourceUsage);
      setUserExperience(mockData.userExperience);
      setRecommendations(mockData.recommendations);
      setInsights(mockData.insights);
      setTrends(mockData.trends);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro na otimização:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const stopOptimization = useCallback(() => {
    setIsOptimizing(false);
  }, []);

  const pauseOptimization = useCallback(() => {
    setIsOptimizing(false);
  }, []);

  const resumeOptimization = useCallback(() => {
    setIsOptimizing(true);
  }, []);

  // Ações de métricas
  const updateMetric = useCallback((metricId: string, value: number) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === metricId 
        ? { ...metric, value, history: [...metric.history, { timestamp: new Date(), value }] }
        : metric
    ));
  }, []);

  const addMetric = useCallback((metric: Omit<PerformanceMetric, 'id'>) => {
    const newMetric: PerformanceMetric = {
      ...metric,
      id: `metric-${Date.now()}`
    };
    setMetrics(prev => [...prev, newMetric]);
  }, []);

  const removeMetric = useCallback((metricId: string) => {
    setMetrics(prev => prev.filter(metric => metric.id !== metricId));
  }, []);

  // Ações de problemas
  const resolveIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: 'resolved' as const }
        : issue
    ));
  }, []);

  const addIssue = useCallback((issue: Omit<PerformanceIssue, 'id'>) => {
    const newIssue: PerformanceIssue = {
      ...issue,
      id: `issue-${Date.now()}`
    };
    setIssues(prev => [...prev, newIssue]);
  }, []);

  const updateIssueStatus = useCallback((issueId: string, status: PerformanceIssue['status']) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, status }
        : issue
    ));
  }, []);

  // Ações de testes
  const runPerformanceTest = useCallback(async (testConfig: Partial<PerformanceTest>) => {
    setIsTesting(true);
    try {
      const newTest: PerformanceTest = {
        id: `test-${Date.now()}`,
        name: testConfig.name || 'Teste de Performance',
        type: testConfig.type || 'load',
        status: 'running',
        configuration: testConfig.configuration || {
          duration: 5,
          concurrent_users: 50,
          ramp_up_time: 1,
          target_endpoints: ['/api/test'],
          test_data_size: 100
        },
        metrics: [],
        issues_found: []
      };
      
      setTests(prev => [...prev, newTest]);
      
      // Simular execução do teste
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Atualizar com resultados
      setTests(prev => prev.map(test => 
        test.id === newTest.id 
          ? {
              ...test,
              status: 'completed',
              results: {
                start_time: new Date(Date.now() - 3000),
                end_time: new Date(),
                total_requests: 1000,
                successful_requests: 980,
                failed_requests: 20,
                average_response_time: 250,
                max_response_time: 800,
                min_response_time: 100,
                throughput: 200,
                error_rate: 2.0,
                cpu_usage_peak: 75,
                memory_usage_peak: 80
              }
            }
          : test
      ));
    } catch (error) {
      console.error('Erro no teste:', error);
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Ações de recomendações
  const implementRecommendation = useCallback((recommendationId: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === recommendationId 
        ? { ...rec, status: 'in_progress' as const }
        : rec
    ));
  }, []);

  const completeRecommendation = useCallback((recommendationId: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === recommendationId 
        ? { ...rec, status: 'completed' as const }
        : rec
    ));
  }, []);

  // Ações de alertas
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string, actions: string[]) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            resolved: true, 
            resolution_time: new Date(),
            actions_taken: actions
          }
        : alert
    ));
  }, []);

  // Ações de configuração
  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (period: { start: Date; end: Date }) => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: PerformanceReport = {
        id: `report-${Date.now()}`,
        title: `Relatório de Performance - ${period.start.toLocaleDateString()} a ${period.end.toLocaleDateString()}`,
        period,
        generated_at: new Date(),
        summary: {
          overall_score: 85.5,
          key_metrics: metrics.slice(0, 5),
          critical_issues: issues.filter(i => i.severity === 'critical').length,
          resolved_issues: issues.filter(i => i.status === 'resolved').length,
          performance_trend: 'improving'
        },
        detailed_analysis: {
          bottlenecks: issues.filter(i => i.type === 'bottleneck'),
          resource_utilization: resourceUsage!,
          user_experience: userExperience!,
          optimization_opportunities: recommendations.filter(r => r.status === 'pending')
        },
        recommendations: recommendations.slice(0, 10),
        charts: []
      };
      
      setReports(prev => [...prev, newReport]);
      return newReport;
    } catch (error) {
      console.error('Erro na geração do relatório:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [metrics, issues, resourceUsage, userExperience, recommendations]);

  const exportReport = useCallback((reportId: string, format: 'pdf' | 'excel' | 'json') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Simular exportação
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reports]);

  // Ações de insights
  const generateInsights = useCallback(() => {
    const newInsights = generateMockInsights();
    setInsights(newInsights);
  }, []);

  // Ações de monitoramento
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Funções utilitárias
  const getMetricsByCategory = useCallback((category: string) => {
    return metrics.filter(metric => metric.category === category);
  }, [metrics]);

  const getCriticalIssues = useCallback(() => {
    return issues.filter(issue => issue.severity === 'critical');
  }, [issues]);

  const getActiveAlerts = useCallback(() => {
    return alerts.filter(alert => !alert.resolved);
  }, [alerts]);

  const getPendingRecommendations = useCallback(() => {
    return recommendations.filter(rec => rec.status === 'pending');
  }, [recommendations]);

  // Valores computados
  const overallScore = metrics.length > 0 
    ? metrics.reduce((acc, metric) => {
        const score = metric.status === 'excellent' ? 100 
                    : metric.status === 'good' ? 80
                    : metric.status === 'warning' ? 60 
                    : 40;
        return acc + score;
      }, 0) / metrics.length
    : 0;

  const criticalIssuesCount = issues.filter(issue => issue.severity === 'critical').length;
  const activeAlertsCount = alerts.filter(alert => !alert.resolved).length;
  const pendingRecommendationsCount = recommendations.filter(rec => rec.status === 'pending').length;
  
  const averageResponseTime = metrics.find(m => m.id === 'response_time')?.value || 0;
  const resourceUtilization = resourceUsage ? 
    (resourceUsage.cpu.usage + (resourceUsage.memory.used / resourceUsage.memory.total * 100)) / 2 : 0;

  // Efeitos
  useEffect(() => {
    // Carregar dados iniciais
    setMetrics(generateMockMetrics());
    setIssues(generateMockIssues());
    setResourceUsage(generateMockResourceUsage());
    setUserExperience(generateMockUserExperience());
    setRecommendations(generateMockRecommendations());
    setAlerts(generateMockAlerts());
    setReports(generateMockReports());
    setBenchmarks(generateMockBenchmarks());
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        const newData: MonitoringData = {
          timestamp: new Date(),
          metrics: {
            response_time: 200 + Math.random() * 100,
            cpu_usage: 60 + Math.random() * 20,
            memory_usage: 70 + Math.random() * 15
          },
          alerts: detectAlerts(),
          resource_usage: generateMockResourceUsage()
        };
        
        // Usar callback para evitar conflitos de estado
        setMonitoringData(prev => {
          const updated = [...prev.slice(-99), newData];
          return updated;
        });
        setLastUpdate(new Date());
      }, config.monitoring.interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isMonitoring, config.monitoring.interval]);

  return {
    // Estado
    metrics,
    issues,
    resourceUsage,
    userExperience,
    recommendations,
    tests,
    alerts,
    reports,
    config,
    insights,
    benchmarks,
    trends,
    monitoringData,
    
    // Estados de controle
    isOptimizing,
    isMonitoring,
    isTesting,
    isAnalyzing,
    lastUpdate,
    
    // Ações de análise
    startOptimization,
    stopOptimization,
    pauseOptimization,
    resumeOptimization,
    
    // Ações de métricas
    updateMetric,
    addMetric,
    removeMetric,
    
    // Ações de problemas
    resolveIssue,
    addIssue,
    updateIssueStatus,
    
    // Ações de testes
    runPerformanceTest,
    
    // Ações de recomendações
    implementRecommendation,
    completeRecommendation,
    
    // Ações de alertas
    acknowledgeAlert,
    resolveAlert,
    
    // Ações de configuração
    updateConfig,
    
    // Ações de relatórios
    generateReport,
    exportReport,
    
    // Ações de insights
    generateInsights,
    
    // Ações de monitoramento
    startMonitoring,
    stopMonitoring,
    
    // Funções utilitárias
    getMetricsByCategory,
    getCriticalIssues,
    getActiveAlerts,
    getPendingRecommendations,
    
    // Valores computados
    overallScore,
    criticalIssuesCount,
    activeAlertsCount,
    pendingRecommendationsCount,
    averageResponseTime,
    resourceUtilization
  };
};

// Configuração padrão
const defaultConfig: PerformanceConfig = {
  monitoring: {
    enabled: true,
    interval: 5000,
    metrics_retention: 30,
    alert_thresholds: {
      response_time: 1000,
      cpu_usage: 80,
      memory_usage: 85,
      error_rate: 5
    },
    auto_scaling: false
  },
  optimization: {
    auto_optimize: false,
    optimization_level: 'balanced',
    cache_strategy: 'memory',
    compression_enabled: true,
    cdn_enabled: false
  },
  testing: {
    auto_test: false,
    test_frequency: 'weekly',
    load_test_users: 100,
    performance_budget: {
      response_time: 1000,
      first_contentful_paint: 1500,
      largest_contentful_paint: 2500
    }
  },
  alerts: {
    email_notifications: true,
    slack_notifications: false,
    escalation_rules: ['Notificar equipe após 5 minutos', 'Escalar para gerência após 15 minutos']
  }
};

// Funções auxiliares para gerar dados mock
const generateMockMetrics = (): PerformanceMetric[] => [
  {
    id: 'response_time',
    name: 'Tempo de Resposta',
    value: 245,
    unit: 'ms',
    threshold: 500,
    status: 'good',
    trend: 'down',
    change: -8.5,
    category: 'speed',
    description: 'Tempo médio de resposta das requisições',
    impact: 'high',
    history: []
  },
  {
    id: 'cpu_usage',
    name: 'Uso de CPU',
    value: 68.5,
    unit: '%',
    threshold: 80,
    status: 'good',
    trend: 'stable',
    change: 2.1,
    category: 'efficiency',
    description: 'Percentual de uso da CPU',
    impact: 'medium',
    history: []
  },
  {
    id: 'memory_usage',
    name: 'Uso de Memória',
    value: 75.2,
    unit: '%',
    threshold: 85,
    status: 'good',
    trend: 'up',
    change: 5.3,
    category: 'efficiency',
    description: 'Percentual de uso da memória',
    impact: 'medium',
    history: []
  },
  {
    id: 'error_rate',
    name: 'Taxa de Erro',
    value: 1.2,
    unit: '%',
    threshold: 5,
    status: 'excellent',
    trend: 'down',
    change: -0.8,
    category: 'reliability',
    description: 'Percentual de requisições com erro',
    impact: 'high',
    history: []
  }
];

const generateMockIssues = (): PerformanceIssue[] => [
  {
    id: 'issue-1',
    type: 'bottleneck',
    severity: 'high',
    title: 'Gargalo na consulta de banco de dados',
    description: 'Query lenta na tabela de usuários causando atraso nas respostas',
    affected_components: ['UserService', 'Database'],
    impact_score: 8,
    detection_time: new Date(Date.now() - 3600000),
    estimated_fix_time: 4,
    fix_suggestions: [
      {
        id: 'fix-1',
        title: 'Adicionar índice na coluna email',
        description: 'Criar índice composto para otimizar consultas por email',
        effort: 'low',
        impact: 'high',
        implementation_steps: [
          'Analisar padrões de consulta',
          'Criar índice composto',
          'Testar performance'
        ],
        estimated_improvement: 75,
        confidence: 0.9,
        dependencies: []
      }
    ],
    status: 'detected',
    priority: 9
  }
];

const generateMockResourceUsage = (): ResourceUsage => ({
  cpu: {
    usage: 68.5,
    cores: 8,
    frequency: 3.2,
    temperature: 65,
    processes: [
      { name: 'node', pid: 1234, cpu_usage: 25.3, memory_usage: 512, status: 'running' }
    ]
  },
  memory: {
    used: 12288,
    total: 16384,
    available: 4096,
    swap_used: 1024,
    swap_total: 4096,
    heap_size: 256
  },
  disk: {
    used: 512000,
    total: 1024000,
    read_speed: 150,
    write_speed: 120,
    iops: 2500
  },
  network: {
    download_speed: 85.5,
    upload_speed: 42.3,
    latency: 15,
    packet_loss: 0.02,
    bandwidth_usage: 35.7
  },
  gpu: {
    usage: 45.2,
    memory_used: 4096,
    memory_total: 8192,
    temperature: 72
  }
});

const generateMockUserExperience = (): UserExperienceMetric => ({
  page_load_time: 1250,
  first_contentful_paint: 800,
  largest_contentful_paint: 1100,
  first_input_delay: 45,
  cumulative_layout_shift: 0.08,
  time_to_interactive: 1800,
  bounce_rate: 25.3,
  session_duration: 420,
  user_satisfaction: 8.7,
  error_rate: 0.8
});

const generateMockRecommendations = (): OptimizationRecommendation[] => [
  {
    id: 'rec-1',
    category: 'database',
    title: 'Otimizar consultas de banco de dados',
    description: 'Implementar cache Redis para consultas frequentes',
    current_state: 'Consultas diretas ao banco sem cache',
    proposed_solution: 'Implementar camada de cache Redis com TTL apropriado',
    expected_improvement: [
      { metric: 'Tempo de resposta', improvement_percentage: 60, confidence: 0.9 }
    ],
    implementation: {
      effort: 'medium',
      time_estimate: 16,
      complexity: 'moderate',
      risk_level: 'low',
      prerequisites: ['Redis server', 'Cache strategy']
    },
    priority_score: 8.5,
    roi_estimate: 3.2,
    status: 'pending'
  }
];

const generateMockAlerts = (): PerformanceAlert[] => [
  {
    id: 'alert-1',
    type: 'threshold_exceeded',
    severity: 'warning',
    metric: 'response_time',
    current_value: 1250,
    threshold_value: 1000,
    message: 'Tempo de resposta acima do limite aceitável',
    triggered_at: new Date(Date.now() - 1800000),
    acknowledged: false,
    resolved: false,
    actions_taken: []
  }
];

const generateMockReports = (): PerformanceReport[] => [
  {
    id: 'report-1',
    title: 'Relatório Semanal de Performance',
    period: {
      start: new Date(Date.now() - 604800000),
      end: new Date()
    },
    generated_at: new Date(),
    summary: {
      overall_score: 82.5,
      key_metrics: [],
      critical_issues: 2,
      resolved_issues: 8,
      performance_trend: 'improving'
    },
    detailed_analysis: {
      bottlenecks: [],
      resource_utilization: generateMockResourceUsage(),
      user_experience: generateMockUserExperience(),
      optimization_opportunities: []
    },
    recommendations: [],
    charts: []
  }
];

const generateMockInsights = (): PerformanceInsight[] => [
  {
    id: 'insight-1',
    type: 'trend',
    title: 'Melhoria consistente no tempo de resposta',
    description: 'O tempo de resposta médio diminuiu 15% nas últimas 2 semanas',
    confidence: 0.9,
    impact: 'high',
    actionable: true,
    related_metrics: ['response_time'],
    generated_at: new Date()
  }
];

const generateMockBenchmarks = (): PerformanceBenchmark[] => [
  {
    id: 'bench-1',
    name: 'Tempo de Resposta API',
    category: 'speed',
    industry_average: 500,
    best_practice: 200,
    current_value: 245,
    percentile_rank: 75,
    improvement_potential: 18.4
  }
];

const generateMockTrends = (): PerformanceTrend[] => [
  {
    metric: 'response_time',
    direction: 'down',
    rate_of_change: -2.5,
    confidence: 0.85,
    forecast: {
      next_week: 235,
      next_month: 220,
      next_quarter: 200
    }
  }
];

const detectAlerts = (): PerformanceAlert[] => {
  // Simular detecção de alertas
  return [];
};

export default usePerformanceOptimizer;