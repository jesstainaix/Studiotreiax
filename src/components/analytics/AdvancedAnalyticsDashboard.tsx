import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Activity,
  CheckCircle,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Filter,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Target,
  Gauge,
  PieChart,
  LineChart,
  BarChart,
  Layers,
  Clock,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import {
  useAdvancedAnalytics,
  useAnalyticsStats,
  useAnalyticsConfig,
  useAnalyticsMetrics,
  useAnalyticsCharts,
  useAnalyticsDashboards,
  useAnalyticsReports,
  useAnalyticsAlerts,
  useAnalyticsSegments,
  useAnalyticsRealTime
} from '../../hooks/useAdvancedAnalytics';
import { AnalyticsMetric, AnalyticsChart, AnalyticsDashboard } from '../../services/advancedAnalyticsService';

const AdvancedAnalyticsDashboard: React.FC = () => {
  const {
    isLoading,
    error,
    searchQuery,
    selectedTimeRange,
    activeFilters,
    actions,
    quickActions,
    throttledRefresh,
    throttledSearch
  } = useAdvancedAnalytics();
  
  const { stats, performanceScore, healthStatus, trendsAnalysis } = useAnalyticsStats();
  const { config, updateConfig } = useAnalyticsConfig();
  const { isStreaming, realtimeCharts } = useAnalyticsRealTime();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (config.enableRealtime) {
        throttledRefresh();
      }
    }, config.refreshInterval);
    
    return () => clearInterval(interval);
  }, [config.enableRealtime, config.refreshInterval, throttledRefresh]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Métricas Totais',
      value: stats.totalMetrics,
      change: '+12%',
      trend: 'up' as const,
      icon: BarChart3,
      color: 'blue'
    },
    {
      title: 'Alertas Ativos',
      value: stats.activeAlerts,
      change: '-5%',
      trend: 'down' as const,
      icon: Bell,
      color: stats.activeAlerts > 0 ? 'red' : 'green'
    },
    {
      title: 'Relatórios Agendados',
      value: stats.scheduledReports,
      change: '+3%',
      trend: 'up' as const,
      icon: FileText,
      color: 'purple'
    },
    {
      title: 'Score de Performance',
      value: `${performanceScore}%`,
      change: '+8%',
      trend: 'up' as const,
      icon: Gauge,
      color: performanceScore >= 80 ? 'green' : performanceScore >= 60 ? 'yellow' : 'red'
    }
  ], [stats, performanceScore]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp },
    { id: 'charts', label: 'Gráficos', icon: LineChart },
    { id: 'dashboards', label: 'Dashboards', icon: Layers },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'alerts', label: 'Alertas', icon: Bell },
    { id: 'segments', label: 'Segmentos', icon: Users },
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const formatTimeRange = (range: string) => {
    switch (range) {
      case '1h': return 'Última Hora';
      case '24h': return 'Últimas 24 Horas';
      case '7d': return 'Últimos 7 Dias';
      case '30d': return 'Últimos 30 Dias';
      case '90d': return 'Últimos 90 Dias';
      default: return range;
    }
  };
  
  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'kpi-dashboard':
          await quickActions.createKPIDashboard();
          break;
        case 'performance-dashboard':
          await quickActions.createPerformanceDashboard();
          break;
        case 'engagement-dashboard':
          await quickActions.createEngagementDashboard();
          break;
        case 'basic-alerts':
          await quickActions.setupBasicAlerts();
          break;
        case 'weekly-report':
          await quickActions.generateWeeklyReport();
          break;
        case 'user-behavior':
          await quickActions.analyzeUserBehavior();
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Avançado</h1>
                <p className="text-sm text-gray-500">Dashboard de métricas e insights em tempo real</p>
              </div>
            </div>
            
            {/* Health Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(healthStatus)}`}>
              {getStatusIcon(healthStatus)}
              <span className="text-sm font-medium capitalize">{healthStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => actions.setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Última Hora</option>
              <option value="24h">Últimas 24h</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
            
            {/* Real-time indicator */}
            {isStreaming && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Tempo Real</span>
              </div>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={throttledRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={actions.clearError}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="mx-6 mt-4 p-8 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Carregando dados de analytics...</span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    <div className="flex items-center space-x-1 mt-2">
                      {getTrendIcon(card.trend)}
                      <span className={`text-sm font-medium ${
                        card.trend === 'up' ? 'text-green-600' : 
                        card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {card.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    card.color === 'blue' ? 'bg-blue-100' :
                    card.color === 'green' ? 'bg-green-100' :
                    card.color === 'red' ? 'bg-red-100' :
                    card.color === 'yellow' ? 'bg-yellow-100' :
                    card.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      card.color === 'blue' ? 'text-blue-600' :
                      card.color === 'green' ? 'text-green-600' :
                      card.color === 'red' ? 'text-red-600' :
                      card.color === 'yellow' ? 'text-yellow-600' :
                      card.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'metrics' && <MetricsTab />}
            {activeTab === 'charts' && <ChartsTab />}
            {activeTab === 'dashboards' && <DashboardsTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'alerts' && <AlertsTab />}
            {activeTab === 'segments' && <SegmentsTab />}
            {activeTab === 'realtime' && <RealTimeTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
      
      {/* Quick Actions Floating Panel */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Ações Rápidas</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleQuickAction('kpi-dashboard')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Criar Dashboard KPI
            </button>
            <button
              onClick={() => handleQuickAction('performance-dashboard')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Dashboard Performance
            </button>
            <button
              onClick={() => handleQuickAction('basic-alerts')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Configurar Alertas
            </button>
            <button
              onClick={() => handleQuickAction('weekly-report')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Relatório Semanal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC = () => {
  const { stats, performanceScore, trendsAnalysis } = useAnalyticsStats();
  const { metrics } = useAnalyticsMetrics();
  const { charts } = useAnalyticsCharts();
  
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências de Performance</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{trendsAnalysis.improving}</div>
                <div className="text-sm text-gray-600">Melhorando</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{trendsAnalysis.stable}</div>
                <div className="text-sm text-gray-600">Estável</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{trendsAnalysis.declining}</div>
                <div className="text-sm text-gray-600">Declinando</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Geral</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{performanceScore}%</div>
            <div className="text-sm text-gray-600 mt-2">Performance Geral</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${performanceScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Principais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.slice(0, 6).map((metric) => (
            <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value} {metric.unit}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}% vs período anterior
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricsTab: React.FC = () => {
  const { metrics, actions } = useAnalyticsMetrics();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', 'performance', 'engagement', 'usage', 'quality', 'business'];
  
  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);
  
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Métricas</h3>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="performance">Performance</option>
            <option value="engagement">Engajamento</option>
            <option value="usage">Uso</option>
            <option value="quality">Qualidade</option>
            <option value="business">Negócio</option>
          </select>
        </div>
        
        <button
          onClick={() => {/* Add metric modal */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Métrica</span>
        </button>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric) => (
          <div key={metric.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  metric.category === 'performance' ? 'bg-blue-500' :
                  metric.category === 'engagement' ? 'bg-green-500' :
                  metric.category === 'usage' ? 'bg-purple-500' :
                  metric.category === 'quality' ? 'bg-yellow-500' :
                  metric.category === 'business' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">{metric.category}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => actions.refreshMetric(metric.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => actions.deleteMetric(metric.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">{metric.name}</h4>
              <p className="text-sm text-gray-600">{metric.description}</p>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {metric.value} {metric.unit}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {metric.target && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Meta</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {metric.target} {metric.unit}
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Atualizado: {metric.lastUpdated.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChartsTab: React.FC = () => {
  const { charts, actions } = useAnalyticsCharts();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gráficos</h3>
        <button
          onClick={() => {/* Add chart modal */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Gráfico</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart) => (
          <div key={chart.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{chart.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">{chart.category}</span>
                  {chart.isRealtime && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Tempo Real
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => actions.refreshChart(chart.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => actions.deleteChart(chart.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Chart placeholder */}
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                {chart.type === 'line' && <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />}
                {chart.type === 'bar' && <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />}
                {chart.type === 'pie' && <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />}
                <p className="text-sm text-gray-500">Gráfico {chart.type}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {chart.data.length} pontos de dados
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Atualizado: {chart.lastUpdated.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardsTab: React.FC = () => {
  const { dashboards, currentDashboard, setCurrentDashboard, createDashboard, deleteDashboard } = useAnalyticsDashboards();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Dashboards</h3>
        <button
          onClick={() => {/* Create dashboard modal */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Dashboard</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => (
          <div key={dashboard.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">{dashboard.name}</h4>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentDashboard(dashboard.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteDashboard(dashboard.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{dashboard.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Widgets:</span>
                <span className="font-medium">{dashboard.layout.widgets.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Visibilidade:</span>
                <span className={`font-medium ${
                  dashboard.isPublic ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {dashboard.isPublic ? 'Público' : 'Privado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Atualizado:</span>
                <span className="font-medium">{dashboard.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
            
            {currentDashboard?.id === dashboard.id && (
              <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Dashboard ativo
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsTab: React.FC = () => {
  const { reports, scheduledReports, onDemandReports, createReport, generateReport, deleteReport } = useAnalyticsReports();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Relatórios</h3>
        <button
          onClick={() => {/* Create report modal */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Relatório</span>
        </button>
      </div>
      
      {/* Scheduled Reports */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Relatórios Agendados</h4>
        <div className="space-y-4">
          {scheduledReports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h5 className="text-lg font-semibold text-gray-900">{report.name}</h5>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'active' ? 'bg-green-100 text-green-800' :
                      report.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status === 'active' ? 'Ativo' :
                       report.status === 'paused' ? 'Pausado' : 'Erro'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  
                  {report.schedule && (
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Frequência: {report.schedule.frequency}</span>
                      <span>Horário: {report.schedule.time}</span>
                      <span>Recipients: {report.schedule.recipients.length}</span>
                    </div>
                  )}
                  
                  {report.lastGenerated && (
                    <div className="text-xs text-gray-500 mt-1">
                      Último: {report.lastGenerated.toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => generateReport(report.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteReport(report.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* On-demand Reports */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Relatórios Sob Demanda</h4>
        <div className="space-y-4">
          {onDemandReports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h5 className="text-lg font-semibold text-gray-900">{report.name}</h5>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Formato: {report.format.toUpperCase()}</span>
                    <span>Seções: {report.template.sections.length}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => generateReport(report.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Gerar</span>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteReport(report.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AlertsTab: React.FC = () => {
  const { alerts, activeAlerts, criticalAlerts, createAlert, updateAlert, deleteAlert, testAlert } = useAnalyticsAlerts();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
        <button
          onClick={() => {/* Create alert modal */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Alerta</span>
        </button>
      </div>
      
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-red-900 mb-2">Alertas Críticos</h4>
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-900">{alert.name}</span>
                </div>
                <button
                  onClick={() => updateAlert(alert.id, { isActive: false })}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Desativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All Alerts */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Bell className={`w-5 h-5 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <h5 className="text-lg font-semibold text-gray-900">{alert.name}</h5>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {alert.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity === 'critical' ? 'Crítico' :
                     alert.severity === 'warning' ? 'Aviso' : 'Info'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Condição: {alert.condition.operator} {alert.condition.value}</span>
                  <span>Canais: {alert.channels.join(', ')}</span>
                  <span>Disparos: {alert.triggerCount}</span>
                </div>
                
                {alert.lastTriggered && (
                  <div className="text-xs text-gray-500 mt-1">
                    Último disparo: {alert.lastTriggered.toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => testAlert(alert.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateAlert(alert.id, { isActive: !alert.isActive })}
                  className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                >
                  {alert.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SegmentsTab: React.FC = () => {
  const { segments, totalUsers, createSegment, updateSegment, deleteSegment } = useAnalyticsSegments();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Segmentos de Usuários</h3>
          <p className="text-sm text-gray-600">Total de usuários segmentados: {totalUsers.toLocaleString()}</p>
        </div>
        <button
          onClick={() => {/* Create segment modal */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Segmento</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {segments.map((segment) => (
          <div key={segment.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">{segment.name}</h4>
              </div>
              
              <div className="flex items-center space-x-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteSegment(segment.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Usuários:</span>
                <span className="text-lg font-semibold text-gray-900">{segment.userCount.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">Métricas:</div>
                {Object.entries(segment.metrics).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">Critérios:</div>
                {segment.criteria.map((criteria) => (
                  <div key={criteria.id} className="text-sm text-gray-600">
                    {criteria.label}: {criteria.operator} {criteria.value}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Criado: {segment.createdAt.toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RealTimeTab: React.FC = () => {
  const { isStreaming, realtimeCharts, startStreaming, stopStreaming, refreshInterval } = useAnalyticsRealTime();
  const { config, updateConfig } = useAnalyticsConfig();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Monitoramento em Tempo Real</h3>
          <p className="text-sm text-gray-600">
            {realtimeCharts.length} gráficos em tempo real • Intervalo: {refreshInterval / 1000}s
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
            isStreaming ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm font-medium">
              {isStreaming ? 'Streaming Ativo' : 'Streaming Inativo'}
            </span>
          </div>
          
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isStreaming 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isStreaming ? 'Parar' : 'Iniciar'}</span>
          </button>
        </div>
      </div>
      
      {/* Real-time Configuration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Configurações de Tempo Real</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo de Atualização (segundos)
            </label>
            <input
              type="number"
              min="1"
              max="300"
              value={config.refreshInterval / 1000}
              onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) * 1000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Pontos de Dados
            </label>
            <input
              type="number"
              min="100"
              max="50000"
              value={config.maxDataPoints}
              onChange={(e) => updateConfig({ maxDataPoints: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retenção de Dados (dias)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={config.retentionDays}
              onChange={(e) => updateConfig({ retentionDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* Real-time Charts */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Gráficos em Tempo Real</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {realtimeCharts.map((chart) => (
            <div key={chart.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900">{chart.title}</h5>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{chart.category}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Ao Vivo</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Atualização</div>
                  <div className="text-xs text-gray-500">{chart.refreshInterval / 1000}s</div>
                </div>
              </div>
              
              {/* Chart placeholder with live indicator */}
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center relative">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-600">Dados em Tempo Real</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {chart.data.length} pontos ativos
                  </p>
                </div>
                
                {/* Live indicator */}
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 font-medium">LIVE</span>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Última atualização: {chart.lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsTab: React.FC = () => {
  const { config, updateConfig } = useAnalyticsConfig();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
      
      {/* General Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Configurações Gerais</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Tempo Real</label>
              <p className="text-xs text-gray-500">Habilitar atualizações em tempo real</p>
            </div>
            <input
              type="checkbox"
              checked={config.enableRealtime}
              onChange={(e) => updateConfig({ enableRealtime: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-refresh</label>
              <p className="text-xs text-gray-500">Atualizar dados automaticamente</p>
            </div>
            <input
              type="checkbox"
              checked={config.enableAutoRefresh}
              onChange={(e) => updateConfig({ enableAutoRefresh: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo de Refresh (ms)
            </label>
            <input
              type="number"
              min="1000"
              max="300000"
              value={config.refreshInterval}
              onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Pontos de Dados
            </label>
            <input
              type="number"
              min="100"
              max="100000"
              value={config.maxDataPoints}
              onChange={(e) => updateConfig({ maxDataPoints: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Data Retention */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Retenção de Dados</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dias de Retenção
            </label>
            <input
              type="number"
              min="1"
              max="3650"
              value={config.retentionDays}
              onChange={(e) => updateConfig({ retentionDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Compressão de Dados</label>
              <p className="text-xs text-gray-500">Comprimir dados antigos para economizar espaço</p>
            </div>
            <input
              type="checkbox"
              checked={config.enableCompression}
              onChange={(e) => updateConfig({ enableCompression: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Export Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Configurações de Exportação</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato Padrão
            </label>
            <select
              value={config.defaultExportFormat}
              onChange={(e) => updateConfig({ defaultExportFormat: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Incluir Gráficos</label>
              <p className="text-xs text-gray-500">Incluir visualizações nos relatórios exportados</p>
            </div>
            <input
              type="checkbox"
              checked={config.includeChartsInExport}
              onChange={(e) => updateConfig({ includeChartsInExport: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;