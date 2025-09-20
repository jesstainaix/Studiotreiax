// Componente para gerenciar métricas de uso e engagement
import React, { useState, useEffect, useMemo } from 'react';
import {
  useUsageAnalytics,
  useAutoAnalytics,
  useAnalyticsPerformance,
  useAnalyticsStats,
  useAnalyticsConfig,
  useAnalyticsDebug,
  UserAction,
  UserSession,
  PageMetrics,
  FeatureUsage,
  UserBehavior,
  AnalyticsEvent,
  ConversionFunnel,
  AnalyticsInsight,
  AnalyticsConfig,
  AnalyticsStats
} from '../../hooks/useUsageAnalytics';
import {
  Activity,
  BarChart3,
  Users,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MousePointer,
  Scroll,
  Navigation,
  Zap,
  AlertCircle,
  Info,
  Lightbulb,
  Target,
  PieChart,
  LineChart,
  BarChart,
  Layers,
  Database,
  RefreshCw,
  X,
  Plus,
  Edit,
  Save,
  FileText,
  Share2
} from 'lucide-react';

const UsageAnalyticsManager: React.FC = () => {
  // Hooks
  const analytics = useAutoAnalytics('UsageAnalyticsManager');
  const performance = useAnalyticsPerformance();
  const stats = useAnalyticsStats(3000); // Atualizar a cada 3 segundos
  const config = useAnalyticsConfig();
  const debug = useAnalyticsDebug();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'sessions' | 'pages' | 'features' | 'insights' | 'funnels' | 'config' | 'debug'>('overview');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateRange: '24h',
    userType: 'all',
    deviceType: 'all',
    actionType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Estado para formulários
  const [newFunnel, setNewFunnel] = useState({ name: '', steps: [''] });
  const [configChanges, setConfigChanges] = useState<Partial<AnalyticsConfig>>({});
  
  // Dados filtrados
  const filteredData = useMemo(() => {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeRange = timeRanges[filters.dateRange as keyof typeof timeRanges] || timeRanges['24h'];
    const cutoff = now - timeRange;
    
    const filteredActions = analytics.actions.filter(action => {
      if (action.timestamp < cutoff) return false;
      if (filters.actionType !== 'all' && action.type !== filters.actionType) return false;
      if (searchTerm && !action.element?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !action.page.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
    
    const filteredSessions = analytics.sessions.filter(session => {
      if (session.startTime < cutoff) return false;
      if (filters.deviceType !== 'all' && session.device.type !== filters.deviceType) return false;
      return true;
    });
    
    const filteredEvents = analytics.events.filter(event => {
      if (event.timestamp < cutoff) return false;
      if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !event.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
    
    return {
      actions: filteredActions,
      sessions: filteredSessions,
      events: filteredEvents
    };
  }, [analytics.actions, analytics.sessions, analytics.events, filters, searchTerm]);
  
  // Funções de demonstração
  const generateDemoData = () => {
    performance.measureSync('generateDemoData', () => {
      // Gerar ações de demonstração
      const demoActions: Array<Omit<UserAction, 'id' | 'timestamp' | 'sessionId'>> = [
        { type: 'click', element: 'button.primary', page: '/dashboard' },
        { type: 'view', page: '/analytics', metadata: { title: 'Analytics Dashboard' } },
        { type: 'scroll', page: '/reports', metadata: { scrollDepth: 75 } },
        { type: 'input', element: 'input.search', page: '/search' },
        { type: 'navigation', page: '/settings' }
      ];
      
      demoActions.forEach(action => {
        setTimeout(() => analytics.trackAction(action), Math.random() * 1000);
      });
      
      // Gerar eventos de demonstração
      const demoEvents: Array<Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>> = [
        {
          name: 'feature_usage',
          category: 'engagement',
          action: 'use_feature',
          label: 'video_editor',
          properties: { featureId: 'video_editor', duration: 120000 }
        },
        {
          name: 'conversion',
          category: 'funnel',
          action: 'complete_step',
          label: 'signup:email_verification',
          value: 1,
          properties: { funnelId: 'signup', stepId: 'email_verification' }
        },
        {
          name: 'search',
          category: 'search',
          action: 'query',
          label: 'video templates',
          value: 25,
          properties: { query: 'video templates', results: 25 }
        }
      ];
      
      demoEvents.forEach(event => {
        setTimeout(() => analytics.trackEvent(event), Math.random() * 1500);
      });
      
      // Simular uso de features
      const features = ['video_editor', 'audio_mixer', 'effects_panel', 'export_tool', 'collaboration'];
      features.forEach(feature => {
        setTimeout(() => analytics.trackFeatureUsage(feature, { demo: true }), Math.random() * 2000);
      });
    });
  };
  
  const simulateUserBehavior = () => {
    const userId = `demo-user-${Date.now()}`;
    analytics.startSession(userId);
    
    // Simular navegação
    const pages = ['/dashboard', '/projects', '/editor', '/settings', '/profile'];
    pages.forEach((page, index) => {
      setTimeout(() => {
        analytics.trackPageView(page, `Demo Page ${index + 1}`);
        analytics.trackAction({
          type: 'view',
          page,
          metadata: { demo: true, sequence: index }
        });
      }, index * 1000);
    });
    
    // Simular interações
    setTimeout(() => {
      analytics.trackUserInteraction('button.save', 'click', { demo: true });
      analytics.trackFormSubmission('project_form', true);
      analytics.trackSearchQuery('video effects', 15, { category: 'effects' });
    }, 3000);
  };
  
  const createDemoFunnel = () => {
    const funnel = analytics.createCustomFunnel('Demo Signup Flow', [
      'Landing Page Visit',
      'Sign Up Form',
      'Email Verification',
      'Profile Setup',
      'First Project'
    ]);
    
    // Simular progressão no funil
    funnel.steps.forEach((step, index) => {
      setTimeout(() => {
        analytics.trackFunnelStep(funnel.id, step.id, { demo: true, step: index });
      }, index * 500);
    });
  };
  
  const simulatePerformanceMetrics = () => {
    // Simular métricas de performance
    const metrics = [
      { name: 'page_load', value: Math.random() * 3000 + 500 },
      { name: 'api_response', value: Math.random() * 1000 + 100 },
      { name: 'render_time', value: Math.random() * 500 + 50 },
      { name: 'bundle_size', value: Math.random() * 1000000 + 500000 }
    ];
    
    metrics.forEach(metric => {
      analytics.trackPerformance(metric.name, metric.value, { demo: true });
    });
  };
  
  const generateInsights = () => {
    analytics.generateInsights();
  };
  
  // Funções de ação em lote
  const handleBatchAction = (action: string) => {
    switch (action) {
      case 'delete':
        if (activeTab === 'actions') {
          // Implementar exclusão de ações selecionadas
        } else if (activeTab === 'sessions') {
          // Implementar exclusão de sessões selecionadas
        }
        break;
      case 'export':
        analytics.exportData('json').then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        });
        break;
      case 'analyze':
        selectedItems.forEach(userId => {
          analytics.analyzeUserBehavior(userId);
        });
        break;
    }
    setSelectedItems([]);
  };
  
  // Componentes de renderização
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.realtimeMetrics.activeUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Última hora</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sessões Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.realtimeMetrics.activeSessions}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Agora</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Engajamento</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.formatPercentage(analytics.engagementScore)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Média geral</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ações/Min</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.realtimeMetrics.actionsPerMinute)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Tempo real</p>
        </div>
      </div>
      
      {/* Gráficos e insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top páginas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Páginas Mais Visitadas
          </h3>
          <div className="space-y-3">
            {analytics.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-900 ml-2">{page.path}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{analytics.formatNumber(page.views)}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(page.views / Math.max(...analytics.topPages.map(p => p.views))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top features */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Features Mais Usadas
          </h3>
          <div className="space-y-3">
            {analytics.topFeatures.map((feature, index) => (
              <div key={feature.featureId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-900 ml-2">{feature.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{analytics.formatNumber(feature.usageCount)}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(feature.usageCount / Math.max(...analytics.topFeatures.map(f => f.usageCount))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Insights recentes */}
      {analytics.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Insights Recentes
          </h3>
          <div className="space-y-3">
            {analytics.insights.slice(-3).map(insight => (
              <div key={insight.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{analytics.getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${analytics.getInsightColor(insight.type)}`}>
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      Impacto: {insight.impact}
                    </span>
                    <span className="text-xs text-gray-500">
                      Confiança: {analytics.formatPercentage(insight.confidence * 100)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const renderActions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Ações do Usuário</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedItems([])}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Limpar seleção
          </button>
          {selectedItems.length > 0 && (
            <button
              onClick={() => handleBatchAction('delete')}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Excluir ({selectedItems.length})
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredData.actions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredData.actions.map(a => a.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Elemento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Página
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.actions.map(action => (
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(action.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, action.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== action.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{analytics.getActionIcon(action.type)}</span>
                      <span className="text-sm text-gray-900 capitalize">{action.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {action.element || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {action.page}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {analytics.formatDate(action.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {action.userId || 'Anônimo'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  const renderSessions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Sessões de Usuário</h3>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID da Sessão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Páginas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispositivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engajamento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.sessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                    {session.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {session.userId || 'Anônimo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {session.duration ? analytics.formatDuration(session.duration) : 'Ativa'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {session.pageViews}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {session.actions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {session.device.type === 'mobile' && <Smartphone className="h-4 w-4 mr-1" />}
                      {session.device.type === 'tablet' && <Tablet className="h-4 w-4 mr-1" />}
                      {session.device.type === 'desktop' && <Monitor className="h-4 w-4 mr-1" />}
                      <span className="text-sm text-gray-600 capitalize">{session.device.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.engagementScore >= 80 ? 'bg-green-100 text-green-800' :
                      session.engagementScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      session.engagementScore >= 40 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.engagementScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  const renderConfig = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Configuração do Analytics</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              config.updateConfig(configChanges);
              setConfigChanges({});
            }}
            disabled={Object.keys(configChanges).length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </button>
          <button
            onClick={config.resetToDefaults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de tracking */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Tracking</h4>
          <div className="space-y-4">
            {[
              { key: 'enableTracking', label: 'Habilitar Tracking' },
              { key: 'enableHeatmaps', label: 'Habilitar Heatmaps' },
              { key: 'enableSessionRecording', label: 'Gravação de Sessão' },
              { key: 'enableRealTimeAnalytics', label: 'Analytics em Tempo Real' },
              { key: 'enableUserIdentification', label: 'Identificação de Usuário' },
              { key: 'enableConversionTracking', label: 'Tracking de Conversão' },
              { key: 'enablePerformanceTracking', label: 'Tracking de Performance' },
              { key: 'enableErrorTracking', label: 'Tracking de Erros' },
              { key: 'enableCustomEvents', label: 'Eventos Customizados' },
              { key: 'enableInsights', label: 'Geração de Insights' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-700">{label}</label>
                <input
                  type="checkbox"
                  checked={configChanges[key as keyof AnalyticsConfig] ?? config.config[key as keyof AnalyticsConfig] as boolean}
                  onChange={(e) => setConfigChanges(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Configurações de privacidade */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Privacidade</h4>
          <div className="space-y-4">
            {[
              { key: 'privacyMode', label: 'Modo Privacidade' },
              { key: 'anonymizeIPs', label: 'Anonimizar IPs' },
              { key: 'respectDNT', label: 'Respeitar Do Not Track' },
              { key: 'cookieConsent', label: 'Consentimento de Cookies' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-700">{label}</label>
                <input
                  type="checkbox"
                  checked={configChanges[key as keyof AnalyticsConfig] ?? config.config[key as keyof AnalyticsConfig] as boolean}
                  onChange={(e) => setConfigChanges(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            ))}
            
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Taxa de Amostragem</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={configChanges.samplingRate ?? config.config.samplingRate}
                onChange={(e) => setConfigChanges(prev => ({ ...prev, samplingRate: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>{analytics.formatPercentage((configChanges.samplingRate ?? config.config.samplingRate) * 100)}</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Retenção de Dados (dias)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={configChanges.dataRetention ?? config.config.dataRetention}
                onChange={(e) => setConfigChanges(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderDebug = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Debug do Analytics</h3>
        <button
          onClick={debug.logDebugInfo}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
        >
          <Info className="h-4 w-4 mr-2" />
          Log Debug Info
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do sistema */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Status do Sistema</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Inicializado</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                debug.debugInfo.isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {debug.debugInfo.isInitialized ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tracking Ativo</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                debug.debugInfo.isTracking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {debug.debugInfo.isTracking ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sessão Ativa</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                debug.debugInfo.currentSession ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {debug.debugInfo.currentSession ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Contadores de dados */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Contadores de Dados</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de Ações</span>
              <span className="text-sm font-medium text-gray-900">{debug.debugInfo.totalActions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de Sessões</span>
              <span className="text-sm font-medium text-gray-900">{debug.debugInfo.totalSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de Eventos</span>
              <span className="text-sm font-medium text-gray-900">{debug.debugInfo.totalEvents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de Insights</span>
              <span className="text-sm font-medium text-gray-900">{debug.debugInfo.totalInsights}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Informações detalhadas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Informações Detalhadas</h4>
        <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
          {JSON.stringify(debug.debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Métricas de Uso e Engagement</h1>
          <p className="text-gray-600 mt-1">Sistema avançado de analytics com insights em tempo real</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={generateDemoData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Gerar Dados Demo
          </button>
          <button
            onClick={simulateUserBehavior}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Simular Usuário
          </button>
          <button
            onClick={createDemoFunnel}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Target className="h-4 w-4 mr-2" />
            Criar Funil
          </button>
          <button
            onClick={simulatePerformanceMetrics}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Métricas Performance
          </button>
          <button
            onClick={generateInsights}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Gerar Insights
          </button>
        </div>
      </div>
      
      {/* Status */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                analytics.isInitialized ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                Status: {analytics.isInitialized ? 'Inicializado' : 'Não Inicializado'}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                analytics.isTracking ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-gray-600">
                Tracking: {analytics.isTracking ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex items-center">
              <Database className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">
                Dados: {analytics.formatNumber(analytics.actions.length + analytics.sessions.length + analytics.events.length)} pontos
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {analytics.isTracking ? (
              <button
                onClick={analytics.stopTracking}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </button>
            ) : (
              <button
                onClick={analytics.startTracking}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </button>
            )}
            <button
              onClick={() => handleBatchAction('export')}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
            <button
              onClick={() => analytics.clearData('all')}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </button>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Última hora</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
          
          <select
            value={filters.deviceType}
            onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os dispositivos</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>
          
          <select
            value={filters.actionType}
            onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as ações</option>
            <option value="click">Cliques</option>
            <option value="view">Visualizações</option>
            <option value="scroll">Scroll</option>
            <option value="input">Input</option>
            <option value="navigation">Navegação</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'actions', label: 'Ações', icon: MousePointer },
              { id: 'sessions', label: 'Sessões', icon: Users },
              { id: 'pages', label: 'Páginas', icon: Eye },
              { id: 'features', label: 'Features', icon: Zap },
              { id: 'insights', label: 'Insights', icon: Lightbulb },
              { id: 'funnels', label: 'Funis', icon: Target },
              { id: 'config', label: 'Configuração', icon: Settings },
              { id: 'debug', label: 'Debug', icon: Info }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'actions' && renderActions()}
          {activeTab === 'sessions' && renderSessions()}
          {activeTab === 'config' && renderConfig()}
          {activeTab === 'debug' && renderDebug()}
          {/* Outras abas seriam implementadas de forma similar */}
        </div>
      </div>
    </div>
  );
};

export default UsageAnalyticsManager;