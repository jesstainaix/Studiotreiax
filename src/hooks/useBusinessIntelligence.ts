import { useState, useEffect, useCallback, useMemo } from 'react';

// Interfaces para Business Intelligence
export interface UserBehavior {
  id: string;
  userId: string;
  sessionId: string;
  event: string;
  page: string;
  timestamp: Date;
  properties: Record<string, any>;
  duration?: number;
  device: string;
  browser: string;
  location: string;
}

export interface ConversionEvent {
  id: string;
  userId: string;
  funnelStep: string;
  conversionType: string;
  value: number;
  timestamp: Date;
  source: string;
  medium: string;
  campaign?: string;
  properties: Record<string, any>;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  totalUsers: number;
  completedUsers: number;
  dropoffPoints: DropoffPoint[];
  averageTime: number;
}

export interface FunnelStep {
  id: string;
  name: string;
  order: number;
  users: number;
  conversionRate: number;
  averageTime: number;
  dropoffRate: number;
}

export interface DropoffPoint {
  step: string;
  users: number;
  percentage: number;
  reasons: string[];
}

export interface CohortAnalysis {
  id: string;
  cohortDate: Date;
  cohortSize: number;
  retentionRates: RetentionRate[];
  ltv: number;
  churnRate: number;
  segments: CohortSegment[];
}

export interface RetentionRate {
  period: number;
  rate: number;
  users: number;
}

export interface CohortSegment {
  name: string;
  size: number;
  characteristics: Record<string, any>;
  behavior: UserBehavior[];
}

export interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  metric: string;
  startDate: Date;
  endDate?: Date;
  participants: number;
  confidence: number;
  winner?: string;
  results: ABTestResult[];
}

export interface ABVariant {
  id: string;
  name: string;
  traffic: number;
  conversions: number;
  conversionRate: number;
  participants: number;
  revenue?: number;
}

export interface ABTestResult {
  variant: string;
  metric: string;
  value: number;
  confidence: number;
  significance: boolean;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria[];
  size: number;
  characteristics: Record<string, any>;
  behavior: SegmentBehavior;
  value: SegmentValue;
  trends: SegmentTrend[];
}

export interface SegmentCriteria {
  field: string;
  operator: string;
  value: any;
  type: 'demographic' | 'behavioral' | 'transactional';
}

export interface SegmentBehavior {
  averageSessionDuration: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
  frequency: number;
}

export interface SegmentValue {
  ltv: number;
  averageOrderValue: number;
  totalRevenue: number;
  profitMargin: number;
}

export interface SegmentTrend {
  period: Date;
  size: number;
  growth: number;
  engagement: number;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'churn' | 'ltv' | 'conversion' | 'recommendation';
  algorithm: string;
  accuracy: number;
  features: ModelFeature[];
  predictions: Prediction[];
  lastTrained: Date;
  status: 'training' | 'ready' | 'error';
}

export interface ModelFeature {
  name: string;
  importance: number;
  type: 'numerical' | 'categorical' | 'boolean';
}

export interface Prediction {
  userId: string;
  type: string;
  value: number;
  confidence: number;
  factors: string[];
  timestamp: Date;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  period: string;
  category: string;
  status: 'good' | 'warning' | 'critical';
}

export interface BIReport {
  id: string;
  name: string;
  type: 'dashboard' | 'analysis' | 'summary';
  data: any;
  charts: ReportChart[];
  insights: string[];
  recommendations: string[];
  createdAt: Date;
  schedule?: ReportSchedule;
}

export interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  data: any[];
  config: Record<string, any>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'email';
}

export interface BIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
  recommendations: string[];
  timestamp: Date;
}

export interface BIConfig {
  trackingEnabled: boolean;
  realTimeUpdates: boolean;
  dataRetention: number;
  samplingRate: number;
  anonymization: boolean;
  gdprCompliance: boolean;
  customEvents: string[];
  integrations: BIIntegration[];
  alerts: BIAlert[];
}

export interface BIIntegration {
  name: string;
  type: 'analytics' | 'crm' | 'marketing' | 'sales';
  enabled: boolean;
  config: Record<string, any>;
}

export interface BIAlert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  recipients: string[];
  frequency: string;
}

// Hook principal
export const useBusinessIntelligence = () => {
  // Estados principais
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userBehaviors, setUserBehaviors] = useState<UserBehavior[]>([]);
  const [conversions, setConversions] = useState<ConversionEvent[]>([]);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [cohorts, setCohorts] = useState<CohortAnalysis[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reports, setReports] = useState<BIReport[]>([]);
  const [insights, setInsights] = useState<BIInsight[]>([]);
  const [config, setConfig] = useState<BIConfig>(defaultBIConfig);

  // Ações de análise
  const startAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Gerar dados mock
      setUserBehaviors(generateMockBehaviors());
      setConversions(generateMockConversions());
      setFunnels(generateMockFunnels());
      setCohorts(generateMockCohorts());
      setSegments(generateMockSegments());
      setKpis(generateMockKPIs());
      setInsights(generateMockInsights());
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
  }, []);

  // Ações de comportamento do usuário
  const trackUserBehavior = useCallback((behavior: Omit<UserBehavior, 'id' | 'timestamp'>) => {
    const newBehavior: UserBehavior = {
      ...behavior,
      id: `behavior_${Date.now()}`,
      timestamp: new Date()
    };
    setUserBehaviors(prev => [...prev, newBehavior]);
  }, []);

  const getBehaviorsByUser = useCallback((userId: string) => {
    return userBehaviors.filter(behavior => behavior.userId === userId);
  }, [userBehaviors]);

  const getBehaviorsByPage = useCallback((page: string) => {
    return userBehaviors.filter(behavior => behavior.page === page);
  }, [userBehaviors]);

  // Ações de conversão
  const trackConversion = useCallback((conversion: Omit<ConversionEvent, 'id' | 'timestamp'>) => {
    const newConversion: ConversionEvent = {
      ...conversion,
      id: `conversion_${Date.now()}`,
      timestamp: new Date()
    };
    setConversions(prev => [...prev, newConversion]);
  }, []);

  const getConversionRate = useCallback((funnelId: string) => {
    const funnel = funnels.find(f => f.id === funnelId);
    return funnel?.conversionRate || 0;
  }, [funnels]);

  // Ações de funil
  const createFunnel = useCallback((funnel: Omit<ConversionFunnel, 'id'>) => {
    const newFunnel: ConversionFunnel = {
      ...funnel,
      id: `funnel_${Date.now()}`
    };
    setFunnels(prev => [...prev, newFunnel]);
    return newFunnel.id;
  }, []);

  const updateFunnel = useCallback((id: string, updates: Partial<ConversionFunnel>) => {
    setFunnels(prev => prev.map(funnel => 
      funnel.id === id ? { ...funnel, ...updates } : funnel
    ));
  }, []);

  const deleteFunnel = useCallback((id: string) => {
    setFunnels(prev => prev.filter(funnel => funnel.id !== id));
  }, []);

  // Ações de coorte
  const generateCohortAnalysis = useCallback((startDate: Date, endDate: Date) => {
    const analysis = generateMockCohorts().filter(cohort => 
      cohort.cohortDate >= startDate && cohort.cohortDate <= endDate
    );
    setCohorts(analysis);
    return analysis;
  }, []);

  // Ações de teste A/B
  const createABTest = useCallback((test: Omit<ABTest, 'id'>) => {
    const newTest: ABTest = {
      ...test,
      id: `test_${Date.now()}`
    };
    setAbTests(prev => [...prev, newTest]);
    return newTest.id;
  }, []);

  const startABTest = useCallback((id: string) => {
    setAbTests(prev => prev.map(test => 
      test.id === id ? { ...test, status: 'running' as const } : test
    ));
  }, []);

  const stopABTest = useCallback((id: string) => {
    setAbTests(prev => prev.map(test => 
      test.id === id ? { ...test, status: 'completed' as const } : test
    ));
  }, []);

  // Ações de segmentação
  const createSegment = useCallback((segment: Omit<CustomerSegment, 'id'>) => {
    const newSegment: CustomerSegment = {
      ...segment,
      id: `segment_${Date.now()}`
    };
    setSegments(prev => [...prev, newSegment]);
    return newSegment.id;
  }, []);

  const updateSegment = useCallback((id: string, updates: Partial<CustomerSegment>) => {
    setSegments(prev => prev.map(segment => 
      segment.id === id ? { ...segment, ...updates } : segment
    ));
  }, []);

  // Ações de modelo preditivo
  const trainModel = useCallback(async (modelConfig: Omit<PredictiveModel, 'id' | 'status' | 'lastTrained'>) => {
    const newModel: PredictiveModel = {
      ...modelConfig,
      id: `model_${Date.now()}`,
      status: 'training',
      lastTrained: new Date(),
      predictions: []
    };
    
    setModels(prev => [...prev, newModel]);
    
    // Simular treinamento
    setTimeout(() => {
      setModels(prev => prev.map(model => 
        model.id === newModel.id 
          ? { ...model, status: 'ready' as const, predictions: generateMockPredictions() }
          : model
      ));
    }, 3000);
    
    return newModel.id;
  }, []);

  const getPredictions = useCallback((modelId: string, userId?: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return [];
    
    return userId 
      ? model.predictions.filter(p => p.userId === userId)
      : model.predictions;
  }, [models]);

  // Ações de KPI
  const updateKPI = useCallback((id: string, value: number) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id === id) {
        const change = ((value - kpi.value) / kpi.value) * 100;
        const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
        const status = value >= kpi.target ? 'good' : value >= kpi.target * 0.8 ? 'warning' : 'critical';
        
        return {
          ...kpi,
          value,
          change,
          trend,
          status
        };
      }
      return kpi;
    }));
  }, []);

  const addKPI = useCallback((kpi: Omit<KPI, 'id'>) => {
    const newKPI: KPI = {
      ...kpi,
      id: `kpi_${Date.now()}`
    };
    setKpis(prev => [...prev, newKPI]);
    return newKPI.id;
  }, []);

  // Ações de relatório
  const generateReport = useCallback(async (type: BIReport['type'], config: any) => {
    const report: BIReport = {
      id: `report_${Date.now()}`,
      name: `Relatório ${type} - ${new Date().toLocaleDateString()}`,
      type,
      data: {
        behaviors: userBehaviors,
        conversions,
        funnels,
        cohorts,
        segments,
        kpis
      },
      charts: generateReportCharts(type),
      insights: insights.map(i => i.description),
      recommendations: insights.flatMap(i => i.recommendations),
      createdAt: new Date()
    };
    
    setReports(prev => [...prev, report]);
    return report;
  }, [userBehaviors, conversions, funnels, cohorts, segments, kpis, insights]);

  const exportReport = useCallback((reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return null;
    
    // Simular exportação
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    return url;
  }, [reports]);

  // Ações de insight
  const generateInsights = useCallback(() => {
    const newInsights = generateMockInsights();
    setInsights(newInsights);
    return newInsights;
  }, []);

  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
  }, []);

  // Ações de configuração
  const updateConfig = useCallback((updates: Partial<BIConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Funções utilitárias
  const getTopPages = useCallback((limit: number = 10) => {
    const pageViews = userBehaviors.reduce((acc, behavior) => {
      if (behavior.event === 'page_view') {
        acc[behavior.page] = (acc[behavior.page] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(pageViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([page, views]) => ({ page, views }));
  }, [userBehaviors]);

  const getUserJourney = useCallback((userId: string) => {
    return userBehaviors
      .filter(behavior => behavior.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [userBehaviors]);

  const getConversionFunnel = useCallback((funnelId: string) => {
    return funnels.find(funnel => funnel.id === funnelId);
  }, [funnels]);

  // Valores computados
  const totalUsers = useMemo(() => {
    return new Set(userBehaviors.map(b => b.userId)).size;
  }, [userBehaviors]);

  const totalSessions = useMemo(() => {
    return new Set(userBehaviors.map(b => b.sessionId)).size;
  }, [userBehaviors]);

  const averageSessionDuration = useMemo(() => {
    const sessions = userBehaviors.reduce((acc, behavior) => {
      if (!acc[behavior.sessionId]) {
        acc[behavior.sessionId] = [];
      }
      acc[behavior.sessionId].push(behavior);
      return acc;
    }, {} as Record<string, UserBehavior[]>);
    
    const durations = Object.values(sessions).map(sessionBehaviors => {
      const sorted = sessionBehaviors.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const start = sorted[0]?.timestamp.getTime() || 0;
      const end = sorted[sorted.length - 1]?.timestamp.getTime() || 0;
      return end - start;
    });
    
    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  }, [userBehaviors]);

  const overallConversionRate = useMemo(() => {
    if (totalUsers === 0) return 0;
    const convertedUsers = new Set(conversions.map(c => c.userId)).size;
    return (convertedUsers / totalUsers) * 100;
  }, [conversions, totalUsers]);

  const totalRevenue = useMemo(() => {
    return conversions.reduce((total, conversion) => total + conversion.value, 0);
  }, [conversions]);

  const activeInsights = useMemo(() => {
    return insights.filter(insight => insight.impact === 'high').length;
  }, [insights]);

  const criticalKPIs = useMemo(() => {
    return kpis.filter(kpi => kpi.status === 'critical').length;
  }, [kpis]);

  // Inicialização
  useEffect(() => {
    if (config.trackingEnabled) {
      startAnalysis();
    }
  }, [config.trackingEnabled, startAnalysis]);

  return {
    // Estados
    isAnalyzing,
    userBehaviors,
    conversions,
    funnels,
    cohorts,
    abTests,
    segments,
    models,
    kpis,
    reports,
    insights,
    config,
    
    // Ações de análise
    startAnalysis,
    stopAnalysis,
    
    // Ações de comportamento
    trackUserBehavior,
    getBehaviorsByUser,
    getBehaviorsByPage,
    
    // Ações de conversão
    trackConversion,
    getConversionRate,
    
    // Ações de funil
    createFunnel,
    updateFunnel,
    deleteFunnel,
    
    // Ações de coorte
    generateCohortAnalysis,
    
    // Ações de teste A/B
    createABTest,
    startABTest,
    stopABTest,
    
    // Ações de segmentação
    createSegment,
    updateSegment,
    
    // Ações de modelo preditivo
    trainModel,
    getPredictions,
    
    // Ações de KPI
    updateKPI,
    addKPI,
    
    // Ações de relatório
    generateReport,
    exportReport,
    
    // Ações de insight
    generateInsights,
    dismissInsight,
    
    // Ações de configuração
    updateConfig,
    
    // Funções utilitárias
    getTopPages,
    getUserJourney,
    getConversionFunnel,
    
    // Valores computados
    totalUsers,
    totalSessions,
    averageSessionDuration,
    overallConversionRate,
    totalRevenue,
    activeInsights,
    criticalKPIs
  };
};

// Configuração padrão
const defaultBIConfig: BIConfig = {
  trackingEnabled: true,
  realTimeUpdates: true,
  dataRetention: 365,
  samplingRate: 100,
  anonymization: true,
  gdprCompliance: true,
  customEvents: ['purchase', 'signup', 'login', 'view_product'],
  integrations: [
    {
      name: 'Google Analytics',
      type: 'analytics',
      enabled: false,
      config: {}
    },
    {
      name: 'Mixpanel',
      type: 'analytics',
      enabled: false,
      config: {}
    }
  ],
  alerts: [
    {
      id: 'conversion_drop',
      name: 'Queda na Conversão',
      condition: 'conversion_rate < 5',
      threshold: 5,
      enabled: true,
      recipients: ['admin@example.com'],
      frequency: 'hourly'
    }
  ]
};

// Funções auxiliares para gerar dados mock
function generateMockBehaviors(): UserBehavior[] {
  const behaviors: UserBehavior[] = [];
  const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const pages = ['/home', '/products', '/cart', '/checkout', '/profile'];
  const events = ['page_view', 'click', 'scroll', 'form_submit'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  
  for (let i = 0; i < 100; i++) {
    behaviors.push({
      id: `behavior_${i}`,
      userId: users[Math.floor(Math.random() * users.length)],
      sessionId: `session_${Math.floor(i / 10)}`,
      event: events[Math.floor(Math.random() * events.length)],
      page: pages[Math.floor(Math.random() * pages.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      properties: { value: Math.random() * 100 },
      duration: Math.random() * 300,
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      location: 'BR'
    });
  }
  
  return behaviors;
}

function generateMockConversions(): ConversionEvent[] {
  const conversions: ConversionEvent[] = [];
  const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const types = ['purchase', 'signup', 'subscription', 'download'];
  const sources = ['organic', 'paid', 'social', 'email'];
  
  for (let i = 0; i < 20; i++) {
    conversions.push({
      id: `conversion_${i}`,
      userId: users[Math.floor(Math.random() * users.length)],
      funnelStep: `step_${Math.floor(Math.random() * 4) + 1}`,
      conversionType: types[Math.floor(Math.random() * types.length)],
      value: Math.random() * 500,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      source: sources[Math.floor(Math.random() * sources.length)],
      medium: 'web',
      properties: { campaign: 'summer_sale' }
    });
  }
  
  return conversions;
}

function generateMockFunnels(): ConversionFunnel[] {
  return [
    {
      id: 'funnel_1',
      name: 'Funil de Compra',
      steps: [
        { id: 'step_1', name: 'Visualização', order: 1, users: 1000, conversionRate: 100, averageTime: 30, dropoffRate: 0 },
        { id: 'step_2', name: 'Produto', order: 2, users: 600, conversionRate: 60, averageTime: 120, dropoffRate: 40 },
        { id: 'step_3', name: 'Carrinho', order: 3, users: 300, conversionRate: 30, averageTime: 180, dropoffRate: 50 },
        { id: 'step_4', name: 'Checkout', order: 4, users: 150, conversionRate: 15, averageTime: 300, dropoffRate: 50 },
        { id: 'step_5', name: 'Compra', order: 5, users: 100, conversionRate: 10, averageTime: 60, dropoffRate: 33 }
      ],
      conversionRate: 10,
      totalUsers: 1000,
      completedUsers: 100,
      dropoffPoints: [
        { step: 'Produto', users: 400, percentage: 40, reasons: ['Preço alto', 'Falta de informações'] },
        { step: 'Carrinho', users: 300, percentage: 50, reasons: ['Frete caro', 'Processo complexo'] }
      ],
      averageTime: 690
    }
  ];
}

function generateMockCohorts(): CohortAnalysis[] {
  const cohorts: CohortAnalysis[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    cohorts.push({
      id: `cohort_${i}`,
      cohortDate: date,
      cohortSize: 100 + Math.random() * 200,
      retentionRates: [
        { period: 1, rate: 80 + Math.random() * 15, users: 80 },
        { period: 7, rate: 60 + Math.random() * 20, users: 60 },
        { period: 30, rate: 40 + Math.random() * 20, users: 40 },
        { period: 90, rate: 20 + Math.random() * 15, users: 20 }
      ],
      ltv: 150 + Math.random() * 100,
      churnRate: 20 + Math.random() * 30,
      segments: [
        {
          name: 'Ativos',
          size: 60,
          characteristics: { engagement: 'high' },
          behavior: []
        }
      ]
    });
  }
  
  return cohorts;
}

function generateMockSegments(): CustomerSegment[] {
  return [
    {
      id: 'segment_1',
      name: 'Usuários Premium',
      criteria: [
        { field: 'subscription', operator: 'equals', value: 'premium', type: 'transactional' }
      ],
      size: 250,
      characteristics: { plan: 'premium', tenure: '6+ months' },
      behavior: {
        averageSessionDuration: 450,
        pageViews: 25,
        bounceRate: 15,
        conversionRate: 35,
        frequency: 8
      },
      value: {
        ltv: 500,
        averageOrderValue: 150,
        totalRevenue: 125000,
        profitMargin: 40
      },
      trends: [
        { period: new Date(), size: 250, growth: 15, engagement: 85 }
      ]
    },
    {
      id: 'segment_2',
      name: 'Novos Usuários',
      criteria: [
        { field: 'signup_date', operator: 'greater_than', value: '30_days_ago', type: 'demographic' }
      ],
      size: 180,
      characteristics: { tenure: '< 30 days', source: 'organic' },
      behavior: {
        averageSessionDuration: 180,
        pageViews: 8,
        bounceRate: 45,
        conversionRate: 8,
        frequency: 2
      },
      value: {
        ltv: 80,
        averageOrderValue: 45,
        totalRevenue: 8100,
        profitMargin: 25
      },
      trends: [
        { period: new Date(), size: 180, growth: 25, engagement: 60 }
      ]
    }
  ];
}

function generateMockKPIs(): KPI[] {
  return [
    {
      id: 'kpi_1',
      name: 'Taxa de Conversão',
      value: 12.5,
      target: 15,
      unit: '%',
      trend: 'up',
      change: 2.3,
      period: 'mensal',
      category: 'Conversão',
      status: 'warning'
    },
    {
      id: 'kpi_2',
      name: 'Receita Total',
      value: 125000,
      target: 150000,
      unit: 'R$',
      trend: 'up',
      change: 8.7,
      period: 'mensal',
      category: 'Receita',
      status: 'warning'
    },
    {
      id: 'kpi_3',
      name: 'Usuários Ativos',
      value: 2450,
      target: 2000,
      unit: 'usuários',
      trend: 'up',
      change: 15.2,
      period: 'mensal',
      category: 'Engajamento',
      status: 'good'
    },
    {
      id: 'kpi_4',
      name: 'Taxa de Retenção',
      value: 68,
      target: 75,
      unit: '%',
      trend: 'down',
      change: -3.1,
      period: 'mensal',
      category: 'Retenção',
      status: 'warning'
    }
  ];
}

function generateMockInsights(): BIInsight[] {
  return [
    {
      id: 'insight_1',
      type: 'opportunity',
      title: 'Oportunidade de Otimização no Funil',
      description: 'A taxa de abandono no carrinho está 15% acima da média do setor. Implementar checkout simplificado pode aumentar conversões em 8-12%.',
      impact: 'high',
      confidence: 85,
      data: { current_rate: 65, industry_average: 50, potential_improvement: 10 },
      recommendations: [
        'Simplificar processo de checkout',
        'Adicionar opções de pagamento express',
        'Implementar checkout como convidado'
      ],
      timestamp: new Date()
    },
    {
      id: 'insight_2',
      type: 'trend',
      title: 'Crescimento em Dispositivos Móveis',
      description: 'Tráfego mobile cresceu 25% no último mês, mas taxa de conversão é 40% menor que desktop.',
      impact: 'medium',
      confidence: 92,
      data: { mobile_growth: 25, conversion_gap: 40 },
      recommendations: [
        'Otimizar experiência mobile',
        'Implementar design responsivo',
        'Testar checkout mobile'
      ],
      timestamp: new Date()
    },
    {
      id: 'insight_3',
      type: 'anomaly',
      title: 'Queda Súbita em Conversões',
      description: 'Detectada queda de 30% nas conversões nas últimas 48h, possivelmente relacionada a problema técnico.',
      impact: 'high',
      confidence: 78,
      data: { drop_percentage: 30, timeframe: '48h' },
      recommendations: [
        'Verificar funcionalidade do checkout',
        'Analisar logs de erro',
        'Testar jornada completa do usuário'
      ],
      timestamp: new Date()
    }
  ];
}

function generateMockPredictions(): Prediction[] {
  const predictions: Prediction[] = [];
  const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const types = ['churn_risk', 'ltv_prediction', 'conversion_probability'];
  
  for (let i = 0; i < 20; i++) {
    predictions.push({
      userId: users[Math.floor(Math.random() * users.length)],
      type: types[Math.floor(Math.random() * types.length)],
      value: Math.random() * 100,
      confidence: 60 + Math.random() * 35,
      factors: ['engagement_score', 'purchase_history', 'session_frequency'],
      timestamp: new Date()
    });
  }
  
  return predictions;
}

function generateReportCharts(type: BIReport['type']): ReportChart[] {
  const baseCharts = [
    {
      id: 'chart_1',
      type: 'line' as const,
      title: 'Conversões ao Longo do Tempo',
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conversions: Math.floor(Math.random() * 50) + 20
      })),
      config: { xAxis: 'date', yAxis: 'conversions' }
    },
    {
      id: 'chart_2',
      type: 'pie' as const,
      title: 'Distribuição por Dispositivo',
      data: [
        { name: 'Desktop', value: 45 },
        { name: 'Mobile', value: 35 },
        { name: 'Tablet', value: 20 }
      ],
      config: { nameKey: 'name', valueKey: 'value' }
    }
  ];
  
  return baseCharts;
}

export default useBusinessIntelligence;