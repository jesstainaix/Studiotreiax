import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Activity, 
  Settings, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Heart, 
  Frown, 
  Smile, 
  Meh, 
  Angry, 
  Surprised, 
  Eye, 
  Clock, 
  Users, 
  Globe, 
  MessageSquare, 
  Target, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from 'lucide-react';
import { 
  useSentimentAnalysis, 
  useSentimentStats, 
  useSentimentAlerts, 
  useSentimentInsights, 
  useSentimentRealTime, 
  useSentimentAnalytics 
} from '../../hooks/useSentimentAnalysis';

const SentimentAnalysisManager: React.FC = () => {
  const {
    sentiments,
    alerts,
    insights,
    isLoading,
    error,
    isAnalyzing,
    connectionStatus,
    lastUpdate,
    filter,
    searchQuery,
    config,
    filteredSentiments,
    filteredAlerts,
    recentInsights,
    currentTrend,
    sentimentScore,
    emotionalState,
    criticalAlerts,
    analyzeSentiment,
    setFilter,
    setSearch,
    clearFilters,
    quickActions,
    utilities
  } = useSentimentAnalysis();
  
  const { stats } = useSentimentStats();
  const { actions: alertActions } = useSentimentAlerts();
  const { actions: insightActions } = useSentimentInsights();
  const { stats: realTimeStats, actions: realTimeActions } = useSentimentRealTime();
  const { data: analyticsData } = useSentimentAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [newTextInput, setNewTextInput] = useState('');
  const [showNewAnalysisModal, setShowNewAnalysisModal] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const demoTexts = [
          'Este produto é absolutamente fantástico! Recomendo muito.',
          'Experiência terrível, não funcionou como esperado.',
          'Interface ok, nada demais mas cumpre o propósito.',
          'Incrível! A equipe fez um trabalho excepcional.',
          'Decepcionado com as mudanças recentes.'
        ];
        
        const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
        analyzeSentiment(randomText, 'auto-demo');
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [analyzeSentiment]);
  
  // Filtered and sorted data
  const sortedSentiments = filteredSentiments
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);
  
  const sortedAlerts = filteredAlerts
    .sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  
  // Status cards data
  const statusCards = [
    {
      title: 'Score de Sentimento',
      value: sentimentScore,
      icon: sentimentScore > 50 ? Smile : sentimentScore < -20 ? Frown : Meh,
      color: sentimentScore > 50 ? 'text-green-600' : sentimentScore < -20 ? 'text-red-600' : 'text-yellow-600',
      bgColor: sentimentScore > 50 ? 'bg-green-50' : sentimentScore < -20 ? 'bg-red-50' : 'bg-yellow-50',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Total Analisado',
      value: stats.totalAnalyzed.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Confiança Média',
      value: `${Math.round(stats.averageConfidence * 100)}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+3%',
      trend: 'up'
    },
    {
      title: 'Alertas Críticos',
      value: criticalAlerts.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-2',
      trend: 'down'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'sentiments', label: 'Análises', icon: Brain },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'realtime', label: 'Tempo Real', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  const handleAnalyzeSentiment = async () => {
    if (!newTextInput.trim()) return;
    
    try {
      await analyzeSentiment(newTextInput, 'manual');
      setNewTextInput('');
      setShowNewAnalysisModal(false);
    } catch (error) {
      console.error('Erro ao analisar sentimento:', error);
    }
  };
  
  const getEmotionColor = (emotion: string, value: number) => {
    const intensity = value > 0.7 ? 'font-bold' : value > 0.4 ? 'font-medium' : 'font-normal';
    const colors = {
      joy: 'text-yellow-600',
      anger: 'text-red-600',
      fear: 'text-purple-600',
      sadness: 'text-blue-600',
      surprise: 'text-green-600',
      disgust: 'text-gray-600'
    };
    return `${colors[emotion as keyof typeof colors] || 'text-gray-600'} ${intensity}`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Análise de Sentimentos</h1>
              <p className="text-gray-600">Sistema inteligente de análise emocional em tempo real</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
            
            <button
              onClick={() => setShowNewAnalysisModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Brain className="w-4 h-4" />
              <span>Nova Análise</span>
            </button>
            
            <button
              onClick={isAnalyzing ? realTimeActions.stop : realTimeActions.start}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isAnalyzing 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isAnalyzing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAnalyzing ? 'Pausar' : 'Iniciar'}</span>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-800">Processando análises...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`w-4 h-4 ${
                      card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm ml-1 ${
                      card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
        
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sentiment Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Distribuição de Sentimentos
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">Positivo</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(stats.sentimentDistribution.positive * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${stats.sentimentDistribution.positive * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-sm font-medium">Negativo</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(stats.sentimentDistribution.negative * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${stats.sentimentDistribution.negative * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full" />
                        <span className="text-sm font-medium">Neutro</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(stats.sentimentDistribution.neutral * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-500 h-2 rounded-full" 
                        style={{ width: `${stats.sentimentDistribution.neutral * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Estado Emocional
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {utilities.getEmotionIcon(emotionalState)}
                    </div>
                    <p className="text-lg font-medium text-gray-900 capitalize">
                      {emotionalState}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Emoção dominante atual
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {Object.entries(stats.emotionDistribution).map(([emotion, value]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{utilities.getEmotionIcon(emotion)}</span>
                          <span className="text-sm font-medium capitalize">{emotion}</span>
                        </div>
                        <span className={`text-sm ${getEmotionColor(emotion, value)}`}>
                          {Math.round(value * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Recent Insights */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Insights Recentes
                </h3>
                <div className="space-y-3">
                  {recentInsights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              Impacto {insight.impact}
                            </span>
                            <span className="text-xs text-gray-500">
                              Confiança: {Math.round(insight.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        {insight.actionable && (
                          <button className="ml-4 text-purple-600 hover:text-purple-700">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Sentiments Tab */}
          {activeTab === 'sentiments' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar análises..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </button>
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700"
                >
                  Limpar
                </button>
              </div>
              
              {/* Sentiments List */}
              <div className="space-y-4">
                {sortedSentiments.map((sentiment) => (
                  <div key={sentiment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sentiment.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            sentiment.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {utilities.formatSentiment(sentiment.sentiment)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confiança: {Math.round(sentiment.confidence * 100)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {sentiment.source}
                          </span>
                        </div>
                        
                        <p className="text-gray-900 mb-3">{sentiment.text}</p>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {sentiment.timestamp.toLocaleString()}
                            </span>
                          </div>
                          
                          {sentiment.keywords.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {sentiment.keywords.slice(0, 3).map((keyword, index) => (
                                <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Emotions */}
                        <div className="mt-3 flex items-center space-x-4">
                          {Object.entries(sentiment.emotions)
                            .filter(([_, value]) => value > 0.3)
                            .slice(0, 3)
                            .map(([emotion, value]) => (
                              <div key={emotion} className="flex items-center space-x-1">
                                <span className="text-sm">{utilities.getEmotionIcon(emotion)}</span>
                                <span className="text-xs text-gray-600">
                                  {Math.round(value * 100)}%
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedSentiment(sentiment.id)}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Alertas do Sistema</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={alertActions.acknowledgeAll}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reconhecer Todos
                  </button>
                  <button 
                    onClick={alertActions.resolveAll}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Resolver Todos
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {sortedAlerts.map((alert) => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${
                    alert.severity === 'critical' ? 'border-red-300 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-300 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                    'border-blue-300 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-orange-600' :
                            alert.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{alert.message}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Limite: {alert.threshold}</span>
                          <span>Atual: {alert.currentValue}</span>
                          <span>{alert.timestamp.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-3">
                          {alert.acknowledged && (
                            <span className="flex items-center space-x-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Reconhecido</span>
                            </span>
                          )}
                          {alert.resolved && (
                            <span className="flex items-center space-x-1 text-xs text-blue-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Resolvido</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!alert.acknowledged && (
                          <button 
                            onClick={() => alertActions.acknowledge(alert.id)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Reconhecer
                          </button>
                        )}
                        {!alert.resolved && (
                          <button 
                            onClick={() => alertActions.resolve(alert.id)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Other tabs would be implemented similarly */}
          {activeTab === 'insights' && (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Insights Detalhados</h3>
              <p className="text-gray-600">Análises avançadas e recomendações baseadas em IA</p>
            </div>
          )}
          
          {activeTab === 'realtime' && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Monitoramento em Tempo Real</h3>
              <p className="text-gray-600">Acompanhamento contínuo de sentimentos e alertas</p>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Avançado</h3>
              <p className="text-gray-600">Relatórios detalhados e métricas de performance</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações</h3>
              <p className="text-gray-600">Ajustes de modelo, alertas e preferências</p>
            </div>
          )}
        </div>
      </div>
      
      {/* New Analysis Modal */}
      {showNewAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Análise de Sentimento</h3>
            
            <textarea
              value={newTextInput}
              onChange={(e) => setNewTextInput(e.target.value)}
              placeholder="Digite o texto para análise..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNewAnalysisModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleAnalyzeSentiment}
                disabled={!newTextInput.trim() || isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span>Analisar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysisManager;