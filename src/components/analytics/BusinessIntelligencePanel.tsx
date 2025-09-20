import React, { useState, useEffect } from 'react';
import { useBusinessIntelligence } from '../../hooks/useBusinessIntelligence';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Brain,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  UserCheck,
  Layers
} from 'lucide-react';

interface BusinessIntelligencePanelProps {
  className?: string;
}

const BusinessIntelligencePanel: React.FC<BusinessIntelligencePanelProps> = ({ className = '' }) => {
  const {
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
    startAnalysis,
    stopAnalysis,
    createFunnel,
    createABTest,
    createSegment,
    trainModel,
    generateReport,
    generateInsights,
    updateConfig,
    getTopPages,
    getUserJourney,
    totalUsers,
    totalSessions,
    averageSessionDuration,
    overallConversionRate,
    totalRevenue,
    activeInsights,
    criticalKPIs
  } = useBusinessIntelligence();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [isRealTime, setIsRealTime] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dados para gráficos
  const conversionTrendData = React.useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        conversions: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 5000) + 2000
      };
    });
    return last30Days;
  }, []);

  const deviceDistributionData = React.useMemo(() => {
    const deviceCounts = userBehaviors.reduce((acc, behavior) => {
      acc[behavior.device] = (acc[behavior.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deviceCounts).map(([device, count]) => ({
      name: device,
      value: count,
      percentage: ((count / userBehaviors.length) * 100).toFixed(1)
    }));
  }, [userBehaviors]);

  const funnelData = React.useMemo(() => {
    if (funnels.length === 0) return [];
    return funnels[0].steps.map(step => ({
      name: step.name,
      value: step.users,
      conversionRate: step.conversionRate
    }));
  }, [funnels]);

  const cohortHeatmapData = React.useMemo(() => {
    return cohorts.slice(0, 12).map(cohort => ({
      month: cohort.cohortDate.toLocaleDateString('pt-BR', { month: 'short' }),
      week1: cohort.retentionRates[0]?.rate || 0,
      week2: cohort.retentionRates[1]?.rate || 0,
      month1: cohort.retentionRates[2]?.rate || 0,
      month3: cohort.retentionRates[3]?.rate || 0
    }));
  }, [cohorts]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // Componente de KPI Card
  const KPICard: React.FC<{
    title: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
    icon: React.ReactNode;
  }> = ({ title, value, change, trend, status, icon }) => {
    const statusColors = {
      good: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    };

    const trendIcons = {
      up: <TrendingUp className="w-4 h-4 text-green-500" />,
      down: <TrendingDown className="w-4 h-4 text-red-500" />,
      stable: <Activity className="w-4 h-4 text-gray-500" />
    };

    return (
      <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {trendIcons[trend]}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{value}</span>
          <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  // Componente de Insight Card
  const InsightCard: React.FC<{
    insight: typeof insights[0];
    onDismiss: () => void;
  }> = ({ insight, onDismiss }) => {
    const impactColors = {
      high: 'border-red-200 bg-red-50',
      medium: 'border-yellow-200 bg-yellow-50',
      low: 'border-blue-200 bg-blue-50'
    };

    const typeIcons = {
      trend: <TrendingUp className="w-5 h-5" />,
      anomaly: <AlertTriangle className="w-5 h-5" />,
      opportunity: <Target className="w-5 h-5" />,
      risk: <AlertTriangle className="w-5 h-5" />
    };

    return (
      <div className={`p-4 rounded-lg border ${impactColors[insight.impact]}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {typeIcons[insight.type]}
            <h4 className="font-semibold">{insight.title}</h4>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Confiança: {insight.confidence}%</span>
          <span className={`px-2 py-1 rounded ${
            insight.impact === 'high' ? 'bg-red-100 text-red-700' :
            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {insight.impact === 'high' ? 'Alto Impacto' :
             insight.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
          </span>
        </div>
        {insight.recommendations.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs font-semibold text-gray-700 mb-1">Recomendações:</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              {insight.recommendations.slice(0, 2).map((rec, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Renderização das abas
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Usuários Totais"
          value={totalUsers.toLocaleString()}
          change={15.2}
          trend="up"
          status="good"
          icon={<Users className="w-5 h-5" />}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${overallConversionRate.toFixed(1)}%`}
          change={-2.3}
          trend="down"
          status="warning"
          icon={<Target className="w-5 h-5" />}
        />
        <KPICard
          title="Receita Total"
          value={`R$ ${totalRevenue.toLocaleString()}`}
          change={8.7}
          trend="up"
          status="good"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPICard
          title="Sessões"
          value={totalSessions.toLocaleString()}
          change={5.1}
          trend="up"
          status="good"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Conversões */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Tendência de Conversões</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversions" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Dispositivo */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Dispositivo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Ativos */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Insights Ativos</h3>
          <button
            onClick={generateInsights}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Brain className="w-4 h-4" />
            <span>Gerar Insights</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.slice(0, 6).map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Análise de Coorte */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Análise de Coorte - Retenção</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cohortHeatmapData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="week1" stackId="a" fill="#8884d8" name="Semana 1" />
            <Bar dataKey="week2" stackId="a" fill="#82ca9d" name="Semana 2" />
            <Bar dataKey="month1" stackId="a" fill="#ffc658" name="Mês 1" />
            <Bar dataKey="month3" stackId="a" fill="#ff7300" name="Mês 3" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segmentos de Usuários */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Segmentos de Usuários</h3>
          <button className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
            <Layers className="w-4 h-4" />
            <span>Novo Segmento</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((segment) => (
            <div key={segment.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{segment.name}</h4>
                <span className="text-sm text-gray-500">{segment.size} usuários</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Taxa de Conversão:</span>
                  <span className="font-medium">{segment.behavior.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>LTV Médio:</span>
                  <span className="font-medium">R$ {segment.value.ltv}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sessão Média:</span>
                  <span className="font-medium">{Math.floor(segment.behavior.averageSessionDuration / 60)}min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConversions = () => (
    <div className="space-y-6">
      {/* Funil de Conversão */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
        <ResponsiveContainer width="100%" height={400}>
          <FunnelChart>
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" stroke="none" />
            </Funnel>
            <Tooltip />
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* Testes A/B */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Testes A/B Ativos</h3>
          <button className="flex items-center space-x-2 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
            <Zap className="w-4 h-4" />
            <span>Novo Teste</span>
          </button>
        </div>
        <div className="space-y-4">
          {abTests.map((test) => (
            <div key={test.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{test.name}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  test.status === 'running' ? 'bg-green-100 text-green-700' :
                  test.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {test.status === 'running' ? 'Executando' :
                   test.status === 'completed' ? 'Concluído' : 'Rascunho'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {test.variants.map((variant) => (
                  <div key={variant.id} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">{variant.name}</div>
                    <div className="text-gray-600">
                      {variant.participants} participantes
                    </div>
                    <div className="text-gray-600">
                      {variant.conversionRate.toFixed(1)}% conversão
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Relatórios Gerados</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport('dashboard', {})}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gerar Relatório</span>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{report.name}</h4>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Criado em: {report.createdAt.toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600">
                {report.insights.length} insights • {report.charts.length} gráficos
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Modelos Preditivos */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Modelos Preditivos</h3>
          <button className="flex items-center space-x-2 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">
            <Brain className="w-4 h-4" />
            <span>Treinar Modelo</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <div key={model.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{model.name}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  model.status === 'ready' ? 'bg-green-100 text-green-700' :
                  model.status === 'training' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {model.status === 'ready' ? 'Pronto' :
                   model.status === 'training' ? 'Treinando' : 'Erro'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Precisão:</span>
                  <span className="font-medium">{model.accuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Predições:</span>
                  <span className="font-medium">{model.predictions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Último Treino:</span>
                  <span className="font-medium">{model.lastTrained.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Todos os Insights */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Todos os Insights</h3>
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Configurações do Sistema</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Rastreamento Ativo</h4>
              <p className="text-sm text-gray-600">Ativar coleta de dados de comportamento</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.trackingEnabled}
                onChange={(e) => updateConfig({ trackingEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Atualizações em Tempo Real</h4>
              <p className="text-sm text-gray-600">Atualizar dados automaticamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.realTimeUpdates}
                onChange={(e) => updateConfig({ realTimeUpdates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Conformidade GDPR</h4>
              <p className="text-sm text-gray-600">Ativar proteções de privacidade</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.gdprCompliance}
                onChange={(e) => updateConfig({ gdprCompliance: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <h4 className="font-medium mb-2">Retenção de Dados (dias)</h4>
            <input
              type="number"
              value={config.dataRetention}
              onChange={(e) => updateConfig({ dataRetention: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="1"
              max="3650"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Taxa de Amostragem (%)</h4>
            <input
              type="range"
              value={config.samplingRate}
              onChange={(e) => updateConfig({ samplingRate: parseInt(e.target.value) })}
              className="w-full"
              min="1"
              max="100"
            />
            <div className="text-sm text-gray-600 mt-1">{config.samplingRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
    { id: 'conversions', label: 'Conversões', icon: <Target className="w-4 h-4" /> },
    { id: 'reports', label: 'Relatórios', icon: <PieChartIcon className="w-4 h-4" /> },
    { id: 'insights', label: 'Insights', icon: <Brain className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
            <p className="text-gray-600">Análise avançada de dados e insights preditivos</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Controles de Tempo Real */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Tempo Real:</span>
              <button
                onClick={() => setIsRealTime(!isRealTime)}
                className={`p-2 rounded ${
                  isRealTime ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isRealTime ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>

            {/* Status de Análise */}
            <div className="flex items-center space-x-2">
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600">Analisando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Pronto</span>
                </>
              )}
            </div>

            {/* Controles de Análise */}
            <div className="flex space-x-2">
              <button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Iniciar Análise</span>
              </button>
              <button
                onClick={stopAnalysis}
                disabled={!isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                <span>Parar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'conversions' && renderConversions()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default BusinessIntelligencePanel;