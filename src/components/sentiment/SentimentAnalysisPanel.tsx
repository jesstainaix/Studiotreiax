import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Heart, 
  Frown, 
  Smile, 
  Meh, 
  AlertTriangle, 
  Shield, 
  Zap, 
  Clock, 
  Users, 
  Globe, 
  Hash, 
  Filter, 
  Search, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  BarChart3, 
  PieChart, 
  Activity, 
  Target, 
  Gauge, 
  MessageSquare, 
  Languages, 
  Tag, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  X, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink
} from 'lucide-react';
import { 
  useSentimentAnalysis, 
  useSentimentStats, 
  useSentimentConfig, 
  useSentimentSearch, 
  useCurrentAnalysis, 
  useSentimentRealTime, 
  useSentimentAnalytics, 
  useAnalysisProgress
} from '../../hooks/useSentimentAnalysis';
import { TextAnalysis, SentimentScore, EmotionScore } from '../../services/sentimentAnalysisService';

interface SentimentAnalysisPanelProps {
  className?: string;
}

export const SentimentAnalysisPanel: React.FC<SentimentAnalysisPanelProps> = ({ 
  className = '' 
}) => {
  // Hooks
  const sentimentAnalysis = useSentimentAnalysis();
  const stats = useSentimentStats();
  const config = useSentimentConfig();
  const search = useSentimentSearch();
  const currentAnalysis = useCurrentAnalysis();
  const realTime = useSentimentRealTime();
  const analytics = useSentimentAnalytics();
  const progress = useAnalysisProgress();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'analysis' | 'batch' | 'config'>('analysis');
  const [newText, setNewText] = useState('');
  const [batchTexts, setBatchTexts] = useState<string[]>(['']);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (sentimentAnalysis.analyses.length < 5) {
        const demoTexts = [
          'I love this new feature! It works perfectly.',
          'This is terrible, nothing works as expected.',
          'The interface is okay, could be better.',
          'Amazing work on the latest update!',
          'I am frustrated with the slow performance.'
        ];
        
        const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
        sentimentAnalysis.quickAnalyze(randomText).catch(console.error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [sentimentAnalysis]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      id: 'total',
      title: 'Total Analyses',
      value: sentimentAnalysis.computed.totalAnalyses.toLocaleString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Brain,
      color: 'blue'
    },
    {
      id: 'sentiment',
      title: 'Avg Sentiment',
      value: sentimentAnalysis.stats.averageSentiment.compound.toFixed(2),
      change: sentimentAnalysis.stats.sentimentTrend === 'improving' ? '+5%' : 
              sentimentAnalysis.stats.sentimentTrend === 'declining' ? '-3%' : '0%',
      trend: sentimentAnalysis.stats.sentimentTrend === 'improving' ? 'up' : 
             sentimentAnalysis.stats.sentimentTrend === 'declining' ? 'down' : 'stable',
      icon: sentimentAnalysis.stats.averageSentiment.compound > 0 ? Smile : 
            sentimentAnalysis.stats.averageSentiment.compound < 0 ? Frown : Meh,
      color: sentimentAnalysis.stats.averageSentiment.compound > 0 ? 'green' : 
             sentimentAnalysis.stats.averageSentiment.compound < 0 ? 'red' : 'gray'
    },
    {
      id: 'confidence',
      title: 'Avg Confidence',
      value: `${(sentimentAnalysis.computed.averageConfidence * 100).toFixed(1)}%`,
      change: '+2%',
      trend: 'up' as const,
      icon: Target,
      color: 'purple'
    },
    {
      id: 'health',
      title: 'System Health',
      value: `${sentimentAnalysis.computed.sentimentHealth.toFixed(0)}%`,
      change: stats.isHealthy ? '+1%' : '-2%',
      trend: stats.isHealthy ? 'up' : 'down',
      icon: stats.isHealthy ? Shield : AlertTriangle,
      color: stats.isHealthy ? 'green' : 'orange'
    }
  ], [sentimentAnalysis, stats]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analyses', label: 'Analyses', icon: MessageSquare },
    { id: 'emotions', label: 'Emotions', icon: Heart },
    { id: 'keywords', label: 'Keywords', icon: Tag },
    { id: 'languages', label: 'Languages', icon: Languages },
    { id: 'realtime', label: 'Real-time', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'positive': return Smile;
      case 'negative': return Frown;
      case 'neutral': return Meh;
      case 'processing': return Clock;
      case 'error': return AlertTriangle;
      default: return Brain;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      case 'processing': return 'text-blue-600';
      case 'error': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };
  
  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, any> = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      trust: '🤝',
      anticipation: '🤔'
    };
    return icons[emotion] || '😐';
  };
  
  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      en: '🇺🇸',
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      pt: '🇧🇷',
      it: '🇮🇹',
      ru: '🇷🇺',
      zh: '🇨🇳',
      ja: '🇯🇵',
      ko: '🇰🇷'
    };
    return icons[language] || '🌐';
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const formatSentiment = (score: number) => {
    if (score >= 0.5) return 'Very Positive';
    if (score >= 0.1) return 'Positive';
    if (score >= -0.1) return 'Neutral';
    if (score >= -0.5) return 'Negative';
    return 'Very Negative';
  };
  
  const handleQuickAction = async (action: string, id?: string) => {
    try {
      switch (action) {
        case 'analyze':
          if (newText.trim()) {
            await sentimentAnalysis.quickAnalyze(newText);
            setNewText('');
          }
          break;
        case 'batch':
          const validTexts = batchTexts.filter(text => text.trim());
          if (validTexts.length > 0) {
            await sentimentAnalysis.analyzeBatch(
              validTexts.map(text => ({ text, metadata: { source: 'batch' } }))
            );
            setBatchTexts(['']);
          }
          break;
        case 'delete':
          if (id) {
            await sentimentAnalysis.quickDelete(id);
          }
          break;
        case 'export':
          const data = await sentimentAnalysis.quickExport('json');
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'sentiment-analyses.json';
          a.click();
          break;
        case 'refresh':
          await sentimentAnalysis.refresh();
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };
  
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };
  
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };
  
  const renderCreateDialog = () => {
    if (!showCreateDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {createType === 'analysis' && 'Analyze Text'}
              {createType === 'batch' && 'Batch Analysis'}
              {createType === 'config' && 'Import Configuration'}
            </h3>
            <button
              onClick={() => setShowCreateDialog(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {createType === 'analysis' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text to Analyze
                </label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter text for sentiment analysis..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleQuickAction('analyze');
                    setShowCreateDialog(false);
                  }}
                  disabled={!newText.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze
                </button>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {createType === 'batch' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texts to Analyze
                </label>
                {batchTexts.map((text, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <textarea
                      value={text}
                      onChange={(e) => {
                        const newTexts = [...batchTexts];
                        newTexts[index] = e.target.value;
                        setBatchTexts(newTexts);
                      }}
                      placeholder={`Text ${index + 1}...`}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    {batchTexts.length > 1 && (
                      <button
                        onClick={() => {
                          const newTexts = batchTexts.filter((_, i) => i !== index);
                          setBatchTexts(newTexts);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setBatchTexts([...batchTexts, ''])}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Text
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleQuickAction('batch');
                    setShowCreateDialog(false);
                  }}
                  disabled={!batchTexts.some(text => text.trim())}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze Batch
                </button>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sentiment Analysis</h2>
              <p className="text-sm text-gray-600">Real-time emotion and sentiment tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreateType('analysis');
                setShowCreateDialog(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Analyze
            </button>
            <button
              onClick={() => handleQuickAction('refresh')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {sentimentAnalysis.error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{sentimentAnalysis.error}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {sentimentAnalysis.isLoading && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Processing analysis...</span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statusCards.map((card) => {
            const IconComponent = card.icon;
            const TrendIcon = getTrendIcon(card.trend);
            
            return (
              <div key={card.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${
                    card.color === 'blue' ? 'bg-blue-100' :
                    card.color === 'green' ? 'bg-green-100' :
                    card.color === 'red' ? 'bg-red-100' :
                    card.color === 'purple' ? 'bg-purple-100' :
                    card.color === 'orange' ? 'bg-orange-100' :
                    'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      card.color === 'blue' ? 'text-blue-600' :
                      card.color === 'green' ? 'text-green-600' :
                      card.color === 'red' ? 'text-red-600' :
                      card.color === 'purple' ? 'text-purple-600' :
                      card.color === 'orange' ? 'text-orange-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    card.trend === 'up' ? 'text-green-600' :
                    card.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{card.change}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-600">{card.title}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search analyses..."
              value={search.searchQuery}
              onChange={(e) => search.debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={search.selectedTimeRange}
              onChange={(e) => search.setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={() => search.quickFilter('positive')}
              className={`px-3 py-2 rounded-lg border ${
                search.filter.sentimentRange.min === 0.1 
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Positive
            </button>
            <button
              onClick={() => search.quickFilter('negative')}
              className={`px-3 py-2 rounded-lg border ${
                search.filter.sentimentRange.max === -0.1 
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Negative
            </button>
            {search.hasActiveFilters && (
              <button
                onClick={search.clearFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
                <div className="space-y-3">
                  {sentimentAnalysis.sentimentDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.label === 'Positive' ? 'bg-green-500' :
                          item.label === 'Negative' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top Emotions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Emotions</h3>
                <div className="space-y-3">
                  {sentimentAnalysis.emotionDistribution.slice(0, 5).map((emotion, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEmotionIcon(emotion.emotion)}</span>
                        <span className="text-sm font-medium capitalize">{emotion.emotion}</span>
                      </div>
                      <span className="text-sm text-gray-600">{(emotion.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h3>
                <div className="space-y-3">
                  {sentimentAnalysis.recentAnalyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {analysis.text.substring(0, 60)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(analysis.timestamp)} • {formatSentiment(analysis.sentiment.compound)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          analysis.sentiment.compound > 0 ? 'text-green-600' :
                          analysis.sentiment.compound < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {analysis.sentiment.compound.toFixed(2)}
                        </span>
                        <button
                          onClick={() => toggleItemSelection(analysis.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Analyses Tab */}
          {activeTab === 'analyses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Analyses ({sentimentAnalysis.filteredData.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCreateType('batch');
                      setShowCreateDialog(true);
                    }}
                    className="px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Batch
                  </button>
                  <button
                    onClick={() => handleQuickAction('export')}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="grid gap-4">
                {sentimentAnalysis.filteredData.map((analysis) => (
                  <div key={analysis.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          {analysis.text}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatTime(analysis.timestamp)}</span>
                          <span>Confidence: {(analysis.confidence * 100).toFixed(1)}%</span>
                          <span>Language: {getLanguageIcon(analysis.language)} {analysis.language.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            analysis.sentiment.compound > 0.1 ? 'bg-green-100 text-green-800' :
                            analysis.sentiment.compound < -0.1 ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {formatSentiment(analysis.sentiment.compound)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Score: {analysis.sentiment.compound.toFixed(3)}
                          </span>
                        </div>
                        {analysis.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {analysis.keywords.slice(0, 5).map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => toggleItemSelection(analysis.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction('delete', analysis.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Settings */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Enable Real-time</label>
                      <button
                        onClick={() => {
                          if (realTime.isRealTimeEnabled) {
                            realTime.stopRealTimeAnalysis();
                          } else {
                            realTime.startRealTimeAnalysis();
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          realTime.isRealTimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          realTime.isRealTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Size: {config.config.realTime.batchSize}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={config.config.realTime.batchSize}
                        onChange={(e) => config.updateRealTimeConfig({ batchSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Processing Interval: {config.config.realTime.processingInterval}ms
                      </label>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="500"
                        value={config.config.realTime.processingInterval}
                        onChange={(e) => config.updateRealTimeConfig({ processingInterval: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Model Settings */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment Model</label>
                      <select
                        value={config.config.models.sentimentModel}
                        onChange={(e) => config.updateModelConfig({ 
                          sentimentModel: e.target.value as any 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="vader">VADER</option>
                        <option value="textblob">TextBlob</option>
                        <option value="transformers">Transformers</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emotion Model</label>
                      <select
                        value={config.config.models.emotionModel}
                        onChange={(e) => config.updateModelConfig({ 
                          emotionModel: e.target.value as any 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="plutchik">Plutchik</option>
                        <option value="ekman">Ekman</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      {[
                        { key: 'languageDetection', label: 'Language Detection' },
                        { key: 'entityRecognition', label: 'Entity Recognition' },
                        { key: 'topicModeling', label: 'Topic Modeling' }
                      ].map((feature) => (
                        <div key={feature.key} className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">{feature.label}</label>
                          <button
                            onClick={() => config.updateModelConfig({ 
                              [feature.key]: !(config.config.models as any)[feature.key] 
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              (config.config.models as any)[feature.key] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              (config.config.models as any)[feature.key] ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Configuration Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const configData = config.exportConfig();
                      const blob = new Blob([configData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sentiment-config.json';
                      a.click();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Config
                  </button>
                  <button
                    onClick={() => {
                      setCreateType('config');
                      setShowCreateDialog(true);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Config
                  </button>
                  <button
                    onClick={config.resetConfig}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Dialog */}
      {renderCreateDialog()}
    </div>
  );
};

export default SentimentAnalysisPanel;