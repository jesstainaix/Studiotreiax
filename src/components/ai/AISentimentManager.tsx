import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  BarChart3, 
  Activity, 
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  Copy,
  Share,
  Star,
  Clock,
  Users,
  Target,
  Lightbulb,
  Cpu,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAISentiment } from '../../hooks/useAISentiment';
import { SentimentAnalysis, SentimentProvider, SentimentBatch } from '../../services/aiSentimentService';
import { sentimentUtils } from '../../services/aiSentimentService';

interface AISentimentManagerProps {
  className?: string;
}

export const AISentimentManager: React.FC<AISentimentManagerProps> = ({ className = '' }) => {
  const {
    analyses,
    providers,
    batches,
    config,
    stats,
    events,
    isInitialized,
    isProcessing,
    error,
    actions,
    quickActions,
    advanced,
    system,
    utils,
    analytics,
    computed
  } = useAISentiment();
  
  // Estado local
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<SentimentAnalysis | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence' | 'sentiment'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'analysis' | 'provider' | 'batch' | 'error'>('analysis');
  const [testText, setTestText] = useState('');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (isInitialized && !isProcessing) {
        // Atualizar dados automaticamente
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, isInitialized, isProcessing]);
  
  // Gerar dados de demonstração
  useEffect(() => {
    if (isInitialized && analyses.length === 0) {
      const demoTexts = [
        'Este produto é absolutamente fantástico! Recomendo muito.',
        'Não gostei nada do atendimento, muito demorado.',
        'O serviço está funcionando normalmente.',
        'Estou muito feliz com a compra, superou expectativas!',
        'Produto com defeito, precisa ser trocado urgentemente.'
      ];
      
      demoTexts.forEach(async (text, index) => {
        setTimeout(() => {
          actions.quickAnalyze(text);
        }, index * 1000);
      });
    }
  }, [isInitialized, analyses.length, actions]);
  
  // Filtrar e ordenar análises
  const filteredAnalyses = useMemo(() => {
    let filtered = analyses;
    
    // Filtro por busca
    if (searchQuery) {
      filtered = utils.search.analyses(searchQuery);
    }
    
    // Filtro por sentimento
    if (filterSentiment !== 'all') {
      filtered = filtered.filter(a => a.sentiment === filterSentiment);
    }
    
    // Filtro por provedor
    if (selectedProvider) {
      filtered = filtered.filter(a => a.provider === selectedProvider);
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'confidence':
          aVal = a.confidence;
          bVal = b.confidence;
          break;
        case 'sentiment':
          aVal = a.sentiment;
          bVal = b.sentiment;
          break;
        default:
          aVal = a.timestamp;
          bVal = b.timestamp;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [analyses, searchQuery, filterSentiment, selectedProvider, sortBy, sortOrder, utils.search]);
  
  // Cards de status
  const statusCards = useMemo(() => [
    {
      title: 'Total de Análises',
      value: computed.totalAnalyses.toLocaleString(),
      icon: MessageSquare,
      color: 'blue',
      trend: '+12%'
    },
    {
      title: 'Confiança Média',
      value: utils.format.confidence(stats.averageConfidence),
      icon: Target,
      color: 'green',
      trend: '+5%'
    },
    {
      title: 'Provedores Ativos',
      value: computed.activeProviders.length.toString(),
      icon: Cpu,
      color: 'purple',
      trend: '100%'
    },
    {
      title: 'Status do Sistema',
      value: computed.isHealthy ? 'Saudável' : 'Degradado',
      icon: computed.isHealthy ? CheckCircle : AlertTriangle,
      color: computed.isHealthy ? 'green' : 'yellow',
      trend: computed.isHealthy ? 'Ótimo' : 'Atenção'
    }
  ], [computed, stats, utils.format]);
  
  // Configuração das abas
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'analyses', label: 'Análises', icon: MessageSquare },
    { id: 'providers', label: 'Provedores', icon: Cpu },
    { id: 'batches', label: 'Lotes', icon: Database },
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'events', label: 'Eventos', icon: Bell },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Bug }
  ];
  
  // Handlers
  const handleAnalyzeText = async () => {
    if (!testText.trim()) return;
    
    try {
      await actions.analyze(testText);
      setTestText('');
    } catch (error) {
      console.error('Erro na análise:', error);
    }
  };
  
  const handleProviderTest = async (providerId: string) => {
    try {
      const success = await actions.testProvider(providerId);
    } catch (error) {
      console.error('Erro no teste do provedor:', error);
    }
  };
  
  const handleExportData = async (format: 'json' | 'csv' | 'xlsx') => {
    try {
      const blob = await actions.exportData(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentiment-data.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };
  
  const openModal = (type: typeof modalType, data?: any) => {
    setModalType(type);
    if (type === 'analysis' && data) {
      setSelectedAnalysis(data);
    }
    setShowModal(true);
  };
  
  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Inicializando sistema de análise de sentimentos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Análise de Sentimentos IA</h2>
              <p className="text-sm text-gray-500">Sistema avançado de análise emocional</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Desativar auto-refresh' : 'Ativar auto-refresh'}
            >
              {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => actions.cleanup()}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Limpar dados antigos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className={`text-xs ${
                      card.color === 'green' ? 'text-green-600' :
                      card.color === 'blue' ? 'text-blue-600' :
                      card.color === 'purple' ? 'text-purple-600' :
                      'text-yellow-600'
                    }`}>
                      {card.trend}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    card.color === 'green' ? 'bg-green-100' :
                    card.color === 'blue' ? 'bg-blue-100' :
                    card.color === 'purple' ? 'bg-purple-100' :
                    'bg-yellow-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      card.color === 'green' ? 'text-green-600' :
                      card.color === 'blue' ? 'text-blue-600' :
                      card.color === 'purple' ? 'text-purple-600' :
                      'text-yellow-600'
                    }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
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
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Saúde do Sistema</h3>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${
                  system.health.status === 'healthy' ? 'bg-green-100' :
                  system.health.status === 'degraded' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  {system.health.status === 'healthy' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : system.health.status === 'degraded' ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Status: {system.health.status === 'healthy' ? 'Saudável' : 
                             system.health.status === 'degraded' ? 'Degradado' : 'Crítico'}
                  </p>
                  <p className="text-sm text-gray-600">Score: {system.health.score}/100</p>
                  {system.health.issues.length > 0 && (
                    <p className="text-sm text-red-600">Problemas: {system.health.issues.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openModal('analysis')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Nova Análise
                </button>
                <button
                  onClick={() => quickActions.testAllProviders()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Testar Provedores
                </button>
                <button
                  onClick={() => handleExportData('json')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Exportar Dados
                </button>
                <button
                  onClick={() => actions.cleanup()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Limpar Cache
                </button>
              </div>
            </div>
            
            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Eventos Recentes</h3>
              <div className="space-y-2">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'error' ? 'bg-red-500' :
                      event.severity === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-sm text-gray-900">{event.message}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {utils.format.timestamp(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Analyses Tab */}
        {activeTab === 'analyses' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar análises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os sentimentos</option>
                <option value="positive">Positivo</option>
                <option value="negative">Negativo</option>
                <option value="neutral">Neutro</option>
                <option value="mixed">Misto</option>
              </select>
              
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os provedores</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as typeof sortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="timestamp-desc">Mais recentes</option>
                <option value="timestamp-asc">Mais antigos</option>
                <option value="confidence-desc">Maior confiança</option>
                <option value="confidence-asc">Menor confiança</option>
                <option value="sentiment-asc">Sentimento A-Z</option>
                <option value="sentiment-desc">Sentimento Z-A</option>
              </select>
            </div>
            
            {/* Analyses List */}
            <div className="space-y-2">
              {filteredAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openModal('analysis', analysis)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">
                          {sentimentUtils.getSentimentIcon(analysis.sentiment)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {utils.format.sentiment(analysis.sentiment)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {utils.format.confidence(analysis.confidence)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {analysis.provider}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2 line-clamp-2">{analysis.text}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{utils.format.timestamp(analysis.timestamp)}</span>
                        <span>{analysis.processingTime}ms</span>
                        <span>{analysis.keywords.length} palavras-chave</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('analysis', analysis);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(analysis.text);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAnalyses.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma análise encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Test Area */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Teste Rápido</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Digite um texto para análise..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeText()}
            />
            <button
              onClick={handleAnalyzeText}
              disabled={!testText.trim() || isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'analysis' ? 'Detalhes da Análise' :
                 modalType === 'provider' ? 'Configurar Provedor' :
                 modalType === 'batch' ? 'Detalhes do Lote' :
                 'Erro'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {modalType === 'analysis' && selectedAnalysis && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto</label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900">{selectedAnalysis.text}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sentimento</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {sentimentUtils.getSentimentIcon(selectedAnalysis.sentiment)}
                      </span>
                      <span className="font-medium">
                        {utils.format.sentiment(selectedAnalysis.sentiment)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confiança</label>
                    <p className="font-medium">{utils.format.confidence(selectedAnalysis.confidence)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoções</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedAnalysis.emotions).map(([emotion, value]) => (
                      <div key={emotion} className="p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600 capitalize">{emotion}</div>
                        <div className="font-medium">{(value * 100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedAnalysis.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Provedor:</span> {selectedAnalysis.provider}
                  </div>
                  <div>
                    <span className="font-medium">Tempo:</span> {selectedAnalysis.processingTime}ms
                  </div>
                  <div>
                    <span className="font-medium">Idioma:</span> {selectedAnalysis.language}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span> {utils.format.timestamp(selectedAnalysis.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISentimentManager;