import React, { useState, useEffect, useMemo } from 'react';
import { 
  useAIScriptCorrection,
  useScriptCorrectionStats,
  useScriptCorrectionConfig,
  useScriptCorrectionProviders,
  useScriptCorrectionRules,
  useScriptCorrectionBatch,
  ScriptText,
  CorrectionSuggestion,
  CorrectionRule,
  AIProvider
} from '../../hooks/useAIScriptCorrection';
import { 
  getSeverityColor,
  getSeverityIcon,
  getTypeColor,
  getTypeIcon,
  formatConfidence
} from '../../services/aiScriptCorrectionService';
import { 
  FileText,
  Brain,
  CheckCircle,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Users,
  Clock,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Lightbulb,
  Wand2,
  BookOpen,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface AIScriptCorrectionManagerProps {
  className?: string;
}

export default function AIScriptCorrectionManager({ className = '' }: AIScriptCorrectionManagerProps) {
  const correction = useAIScriptCorrection();
  const { stats } = useScriptCorrectionStats();
  const { config, updateConfig } = useScriptCorrectionConfig();
  const { providers, activeProviders, defaultProvider } = useScriptCorrectionProviders();
  const { rules, activeRules } = useScriptCorrectionRules();
  const { batches, activeBatches } = useScriptCorrectionBatch();
  
  // Local State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedText, setSelectedText] = useState<ScriptText | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CorrectionSuggestion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [testText, setTestText] = useState('');
  
  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const interval = setInterval(() => {
      correction.actions.updateStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoRefresh, correction.actions]);
  
  // Generate demo data
  useEffect(() => {
    if (correction.isInitialized && correction.texts.length === 0) {
      const demoTexts = [
        {
          content: 'Este é um texto de exemplo para demonstrar o sistema de correção automática.',
          language: 'pt-BR',
          type: 'dialogue' as const,
          speaker: 'Narrador',
          scene: 'Cena 1',
          metadata: {
            wordCount: 12,
            characterCount: 78,
            estimatedDuration: 6,
            difficulty: 'easy' as const,
            tone: 'neutral',
            genre: 'educational'
          }
        },
        {
          content: 'Aqui temos outro exemplo com alguns erros intencionais para testar.',
          language: 'pt-BR',
          type: 'narration' as const,
          metadata: {
            wordCount: 10,
            characterCount: 65,
            estimatedDuration: 5,
            difficulty: 'medium' as const,
            tone: 'informative',
            genre: 'tutorial'
          }
        }
      ];
      
      demoTexts.forEach(text => {
        correction.actions.addText(text);
      });
    }
  }, [correction.isInitialized, correction.texts.length, correction.actions]);
  
  // Filtered and sorted data
  const filteredTexts = useMemo(() => {
    return correction.texts.filter(text => {
      const matchesSearch = text.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           text.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           text.scene?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [correction.texts, searchTerm]);
  
  const filteredSuggestions = useMemo(() => {
    return correction.suggestions.filter(suggestion => {
      const matchesType = filterType === 'all' || suggestion.type === filterType;
      const matchesSeverity = filterSeverity === 'all' || suggestion.severity === filterSeverity;
      const matchesSearch = suggestion.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           suggestion.suggested.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           suggestion.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSeverity && matchesSearch;
    });
  }, [correction.suggestions, filterType, filterSeverity, searchTerm]);
  
  // Status Cards Data
  const statusCards = [
    {
      title: 'Textos Analisados',
      value: stats.totalTexts,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Sugestões Geradas',
      value: stats.totalSuggestions,
      icon: Brain,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: 'Correções Aplicadas',
      value: stats.acceptedSuggestions,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+15%'
    },
    {
      title: 'Qualidade Média',
      value: `${Math.round(correction.computed.textQualityScore)}%`,
      icon: Target,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];
  
  // Tab Configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'texts', label: 'Textos', icon: FileText },
    { id: 'suggestions', label: 'Sugestões', icon: Lightbulb },
    { id: 'rules', label: 'Regras', icon: BookOpen },
    { id: 'providers', label: 'Provedores', icon: Brain },
    { id: 'batches', label: 'Lotes', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'events', label: 'Eventos', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  const handleAnalyzeText = async (textId: string) => {
    try {
      await correction.actions.analyzeText(textId);
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
    }
  };
  
  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      await correction.actions.applySuggestion(suggestionId);
    } catch (error) {
      console.error('Erro ao aplicar sugestão:', error);
    }
  };
  
  const handleTestText = async () => {
    if (!testText.trim()) return;
    
    try {
      const textId = await correction.actions.addText({
        content: testText,
        language: 'pt-BR',
        type: 'dialogue',
        metadata: {
          wordCount: testText.split(' ').length,
          characterCount: testText.length,
          estimatedDuration: testText.split(' ').length * 0.5,
          difficulty: 'medium',
          tone: 'neutral',
          genre: 'test'
        }
      });
      
      await correction.actions.analyzeText(textId);
      setTestText('');
    } catch (error) {
      console.error('Erro ao testar texto:', error);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wand2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Auto-Correção de Scripts IA
              </h2>
              <p className="text-sm text-gray-500">
                Sistema inteligente de correção e melhoria de textos
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                isAutoRefresh 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isAutoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
            >
              <RefreshCw className={`h-4 w-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => correction.actions.updateStats()}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {correction.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{correction.error.message}</span>
              <button
                onClick={correction.actions.clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
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
                  </div>
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">{card.change}</span>
                  <span className="text-sm text-gray-500 ml-1">vs. mês anterior</span>
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
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Saúde do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {correction.computed.providerHealth.filter(p => p.status === 'healthy').length}
                  </div>
                  <div className="text-sm text-gray-600">Provedores Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {correction.computed.pendingSuggestions.length}
                  </div>
                  <div className="text-sm text-gray-600">Sugestões Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {correction.computed.criticalIssues.length}
                  </div>
                  <div className="text-sm text-gray-600">Problemas Críticos</div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => correction.quickActions.checkGrammar(correction.texts[0]?.id)}
                  disabled={!correction.texts.length}
                  className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Verificar Gramática</span>
                </button>
                
                <button
                  onClick={() => correction.quickActions.improveStyle(correction.texts[0]?.id)}
                  disabled={!correction.texts.length}
                  className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Melhorar Estilo</span>
                </button>
                
                <button
                  onClick={() => correction.quickActions.enhanceText(correction.texts[0]?.id)}
                  disabled={!correction.texts.length}
                  className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Aprimorar Texto</span>
                </button>
              </div>
            </div>
            
            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h3>
              <div className="space-y-2">
                {correction.computed.recentActivity.map((event, index) => (
                  <div key={event.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'warning' ? 'bg-yellow-500' :
                      event.type === 'correction_applied' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="text-sm text-gray-700 flex-1">{event.message}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'texts' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar textos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setActiveTab('settings')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Texts List */}
            <div className="space-y-3">
              {filteredTexts.map((text) => {
                const textSuggestions = correction.suggestions.filter(s => s.textId === text.id);
                const qualityScore = correction.utils.calculate.qualityScore(text, textSuggestions);
                
                return (
                  <div key={text.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {getTypeIcon(text.type)} {text.type}
                          </span>
                          {text.speaker && (
                            <span className="text-sm text-gray-600">• {text.speaker}</span>
                          )}
                          {text.scene && (
                            <span className="text-sm text-gray-600">• {text.scene}</span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-2">
                          {text.content.length > 100 
                            ? `${text.content.substring(0, 100)}...` 
                            : text.content
                          }
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{text.metadata.wordCount} palavras</span>
                          <span>{text.metadata.estimatedDuration}s</span>
                          <span>Qualidade: {Math.round(qualityScore)}%</span>
                          <span>{textSuggestions.length} sugestões</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAnalyzeText(text.id)}
                          disabled={correction.isAnalyzing}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                          title="Analisar texto"
                        >
                          <Brain className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => setSelectedText(text)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar sugestões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos os tipos</option>
                <option value="grammar">Gramática</option>
                <option value="spelling">Ortografia</option>
                <option value="style">Estilo</option>
                <option value="clarity">Clareza</option>
                <option value="tone">Tom</option>
              </select>
              
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todas as severidades</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            
            {/* Suggestions List */}
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-sm font-medium ${getTypeColor(suggestion.type)}`}>
                          {getTypeIcon(suggestion.type)} {suggestion.type}
                        </span>
                        <span className={`text-sm font-medium ${getSeverityColor(suggestion.severity)}`}>
                          {getSeverityIcon(suggestion.severity)} {suggestion.severity}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatConfidence(suggestion.confidence)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Original: </span>
                          <span className="text-red-600 line-through">{suggestion.original}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Sugerido: </span>
                          <span className="text-green-600 font-medium">{suggestion.suggested}</span>
                        </div>
                        <p className="text-sm text-gray-700">{suggestion.explanation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!suggestion.isAccepted && !suggestion.isRejected && (
                        <>
                          <button
                            onClick={() => handleApplySuggestion(suggestion.id)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Aplicar sugestão"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => correction.actions.rejectSuggestion(suggestion.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Rejeitar sugestão"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => setSelectedSuggestion(suggestion)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {suggestion.isAccepted && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Aplicada em {new Date(suggestion.appliedAt!).toLocaleString()}
                    </div>
                  )}
                  
                  {suggestion.isRejected && (
                    <div className="mt-2 text-sm text-red-600">
                      ✗ Rejeitada
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Correção Automática
                    </label>
                    <input
                      type="checkbox"
                      checked={config.autoCorrect}
                      onChange={(e) => updateConfig({ autoCorrect: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Correção em Tempo Real
                    </label>
                    <input
                      type="checkbox"
                      checked={config.enableRealTimeCorrection}
                      onChange={(e) => updateConfig({ enableRealTimeCorrection: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Análise de Tom
                    </label>
                    <input
                      type="checkbox"
                      checked={config.enableToneAnalysis}
                      onChange={(e) => updateConfig({ enableToneAnalysis: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite de Confiança: {Math.round(config.confidenceThreshold * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.confidenceThreshold}
                      onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Sugestões por Texto
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.maxSuggestionsPerText}
                      onChange={(e) => updateConfig({ maxSuggestionsPerText: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Language Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Idioma</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma Padrão
                    </label>
                    <select
                      value={config.defaultLanguage}
                      onChange={(e) => updateConfig({ defaultLanguage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                      <option value="fr-FR">Français</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gênero Padrão
                    </label>
                    <select
                      value={config.defaultGenre}
                      onChange={(e) => updateConfig({ defaultGenre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="general">Geral</option>
                      <option value="academic">Acadêmico</option>
                      <option value="business">Negócios</option>
                      <option value="creative">Criativo</option>
                      <option value="technical">Técnico</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Test Area */}
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Área de Teste</h3>
        <div className="space-y-4">
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Digite um texto para testar o sistema de correção..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestText}
              disabled={!testText.trim() || correction.isAnalyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {correction.isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Analisando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Testar Correção
                </>
              )}
            </button>
            
            <button
              onClick={() => setTestText('')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </button>
          </div>
        </div>
      </div>
      
      {/* Details Modal */}
      {(selectedText || selectedSuggestion) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedText ? 'Detalhes do Texto' : 'Detalhes da Sugestão'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedText(null);
                    setSelectedSuggestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {selectedText && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conteúdo
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedText.content}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <div className="text-sm text-gray-900">{selectedText.type}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Idioma
                      </label>
                      <div className="text-sm text-gray-900">{selectedText.language}</div>
                    </div>
                    
                    {selectedText.speaker && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Locutor
                        </label>
                        <div className="text-sm text-gray-900">{selectedText.speaker}</div>
                      </div>
                    )}
                    
                    {selectedText.scene && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cena
                        </label>
                        <div className="text-sm text-gray-900">{selectedText.scene}</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metadados
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Palavras: {selectedText.metadata.wordCount}</div>
                      <div>Caracteres: {selectedText.metadata.characterCount}</div>
                      <div>Duração: {selectedText.metadata.estimatedDuration}s</div>
                      <div>Dificuldade: {selectedText.metadata.difficulty}</div>
                      <div>Tom: {selectedText.metadata.tone}</div>
                      <div>Gênero: {selectedText.metadata.genre}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedSuggestion && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <div className={`text-sm font-medium ${getTypeColor(selectedSuggestion.type)}`}>
                        {getTypeIcon(selectedSuggestion.type)} {selectedSuggestion.type}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severidade
                      </label>
                      <div className={`text-sm font-medium ${getSeverityColor(selectedSuggestion.severity)}`}>
                        {getSeverityIcon(selectedSuggestion.severity)} {selectedSuggestion.severity}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Texto Original
                    </label>
                    <div className="p-3 bg-red-50 rounded-lg text-red-700 line-through">
                      {selectedSuggestion.original}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Texto Sugerido
                    </label>
                    <div className="p-3 bg-green-50 rounded-lg text-green-700 font-medium">
                      {selectedSuggestion.suggested}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Explicação
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                      {selectedSuggestion.explanation}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confiança
                      </label>
                      <div>{formatConfidence(selectedSuggestion.confidence)}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <div>{selectedSuggestion.category}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Posição
                      </label>
                      <div>{selectedSuggestion.position.start}-{selectedSuggestion.position.end}</div>
                    </div>
                  </div>
                  
                  {selectedSuggestion.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {selectedSuggestion.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}