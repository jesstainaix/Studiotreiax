// Dashboard de otimização de bundle
import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Package,
  TrendingDown,
  TrendingUp,
  Target,
  FileText,
  Calendar,
  X,
  Eye,
  EyeOff,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  useBundleOptimizer,
  usePerformanceMonitoring,
  useSmartRecommendations,
  useOptimizationStats
} from '../../hooks/useBundleOptimizer';
import {
  BundleAnalysis,
  OptimizationRecommendation,
  OptimizationSettings
} from '../../utils/bundleOptimizer';

const BundleOptimizerDashboard: React.FC = () => {
  // Hooks
  const {
    analyses,
    currentAnalysis,
    settings,
    isAnalyzing,
    isOptimizing,
    analyzeBundle,
    optimizeBundle,
    updateSettings,
    compareAnalyses,
    exportAnalysis,
    importAnalysis,
    exportSettings,
    importSettings,
    scheduleOptimization,
    cancelOptimization,
    clearHistory,
    formatSize,
    formatTime,
    formatPercentage
  } = useBundleOptimizer({
    autoAnalyze: true,
    analyzeInterval: 300000,
    enableRealTimeMonitoring: true
  });
  
  const {
    performanceScore,
    sizeScore,
    overallScore,
    alerts,
    hasAlerts
  } = usePerformanceMonitoring();
  
  const {
    recommendations,
    criticalRecommendations,
    automatedRecommendations,
    totalEstimatedSavings,
    applyRecommendation,
    dismissRecommendation,
    hasRecommendations,
    hasCriticalRecommendations
  } = useSmartRecommendations();
  
  const optimizationStats = useOptimizationStats();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'recommendations' | 'settings' | 'history'>('dashboard');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleExpression, setScheduleExpression] = useState('0 0 * * *');
  const [importData, setImportData] = useState('');
  const [tempSettings, setTempSettings] = useState<OptimizationSettings>(settings);
  
  // Atualizar configurações temporárias quando as configurações mudarem
  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);
  
  // Filtrar recomendações
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesType = filterType === 'all' || rec.type === filterType;
    const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });
  
  // Handlers
  const handleAnalyze = async () => {
    try {
      await analyzeBundle();
    } catch (error) {
      console.error('Erro ao analisar:', error);
    }
  };
  
  const handleOptimize = async (recommendationIds?: string[]) => {
    try {
      await optimizeBundle(recommendationIds);
    } catch (error) {
      console.error('Erro ao otimizar:', error);
    }
  };
  
  const handleApplyRecommendation = async (id: string) => {
    try {
      await applyRecommendation(id);
    } catch (error) {
      console.error('Erro ao aplicar recomendação:', error);
    }
  };
  
  const handleExport = (id: string) => {
    const data = exportAnalysis(id);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bundle-analysis-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  const handleImport = () => {
    if (importData) {
      const success = importAnalysis(importData);
      if (success) {
        setImportData('');
        setShowImportModal(false);
      }
    }
  };
  
  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setShowSettingsModal(false);
  };
  
  const handleSchedule = () => {
    scheduleOptimization(scheduleExpression);
    setShowScheduleModal(false);
  };
  
  const handleCompare = () => {
    if (selectedForComparison.length === 2) {
      const comparison = compareAnalyses(selectedForComparison[0], selectedForComparison[1]);
    }
  };
  
  // Componente de Score
  const ScoreCard: React.FC<{ title: string; score: number; icon: React.ReactNode; color: string }> = ({ title, score, icon, color }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className="text-2xl font-bold">{score}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
  
  // Componente de Recomendação
  const RecommendationCard: React.FC<{ recommendation: OptimizationRecommendation }> = ({ recommendation }) => {
    const priorityColors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    const typeIcons = {
      'code-splitting': <Package className="w-4 h-4" />,
      'tree-shaking': <Zap className="w-4 h-4" />,
      'compression': <Download className="w-4 h-4" />,
      'lazy-loading': <Clock className="w-4 h-4" />,
      'dependency': <ExternalLink className="w-4 h-4" />
    };
    
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {typeIcons[recommendation.type]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
              <p className="text-sm text-gray-600">{recommendation.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[recommendation.priority]}`}>
              {recommendation.priority}
            </span>
            {recommendation.automated && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Auto
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Economia:</span>
            <div className="font-semibold">{formatSize(recommendation.estimatedSavings)}</div>
          </div>
          <div>
            <span className="text-gray-500">Esforço:</span>
            <div className="font-semibold capitalize">{recommendation.effort}</div>
          </div>
          <div>
            <span className="text-gray-500">Impacto:</span>
            <div className="font-semibold capitalize">{recommendation.impact}</div>
          </div>
        </div>
        
        <div className="mb-4">
          <span className="text-sm text-gray-500">Implementação:</span>
          <p className="text-sm text-gray-700 mt-1">{recommendation.implementation}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => dismissRecommendation(recommendation.id)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Dispensar
          </button>
          <button
            onClick={() => handleApplyRecommendation(recommendation.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Bundle Optimizer</h1>
              {hasAlerts && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{alerts.length} alertas</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analisando...' : 'Analisar'}</span>
              </button>
              
              <button
                onClick={() => handleOptimize()}
                disabled={isOptimizing || !hasRecommendations}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>{isOptimizing ? 'Otimizando...' : 'Otimizar'}</span>
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'analysis', label: 'Análise', icon: Activity },
              { id: 'recommendations', label: 'Recomendações', icon: Target },
              { id: 'settings', label: 'Configurações', icon: Settings },
              { id: 'history', label: 'Histórico', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ScoreCard
                title="Performance Score"
                score={performanceScore}
                icon={<Activity className="w-5 h-5 text-white" />}
                color="bg-blue-500"
              />
              <ScoreCard
                title="Size Score"
                score={sizeScore}
                icon={<Package className="w-5 h-5 text-white" />}
                color="bg-green-500"
              />
              <ScoreCard
                title="Overall Score"
                score={overallScore}
                icon={<Target className="w-5 h-5 text-white" />}
                color="bg-purple-500"
              />
            </div>
            
            {/* Alertas */}
            {hasAlerts && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Alertas de Performance</h3>
                </div>
                <ul className="space-y-1">
                  {alerts.map((alert, index) => (
                    <li key={index} className="text-sm text-red-700">• {alert}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Otimizações</p>
                    <p className="text-2xl font-bold">{optimizationStats.totalOptimizations}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tamanho Economizado</p>
                    <p className="text-2xl font-bold">{formatSize(optimizationStats.sizeSaved)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ganho de Performance</p>
                    <p className="text-2xl font-bold">{formatPercentage(optimizationStats.performanceGain)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Última Otimização</p>
                    <p className="text-sm font-medium">
                      {optimizationStats.lastOptimization 
                        ? new Date(optimizationStats.lastOptimization).toLocaleDateString()
                        : 'Nunca'
                      }
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* Recomendações Críticas */}
            {hasCriticalRecommendations && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Recomendações Críticas</h2>
                </div>
                <div className="p-6 space-y-4">
                  {criticalRecommendations.slice(0, 3).map(rec => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Analysis Tab */}
        {activeTab === 'analysis' && currentAnalysis && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Análise Atual</h2>
                <p className="text-sm text-gray-600">
                  Gerada em {new Date(currentAnalysis.timestamp).toLocaleString()}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-gray-600">Tamanho Total</p>
                    <p className="text-xl font-bold">{formatSize(currentAnalysis.totalSize)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tamanho Comprimido</p>
                    <p className="text-xl font-bold">{formatSize(currentAnalysis.gzippedSize)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chunks</p>
                    <p className="text-xl font-bold">{currentAnalysis.chunks.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dependências</p>
                    <p className="text-xl font-bold">{currentAnalysis.dependencies.length}</p>
                  </div>
                </div>
                
                {/* Chunks */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Chunks</h3>
                  <div className="space-y-3">
                    {currentAnalysis.chunks.map((chunk, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            chunk.priority === 'critical' ? 'bg-red-500' :
                            chunk.priority === 'high' ? 'bg-orange-500' :
                            chunk.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium">{chunk.name}</p>
                            <p className="text-sm text-gray-600">{chunk.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatSize(chunk.size)}</p>
                          <p className="text-sm text-gray-600">{formatTime(chunk.loadTime)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Métricas de Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(currentAnalysis.performance).map(([key, value]) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                        <p className="text-lg font-bold">
                          {typeof value === 'number' ? formatTime(value) : value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recomendações</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar recomendações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="code-splitting">Code Splitting</option>
                    <option value="tree-shaking">Tree Shaking</option>
                    <option value="compression">Compressão</option>
                    <option value="lazy-loading">Lazy Loading</option>
                    <option value="dependency">Dependências</option>
                  </select>
                </div>
              </div>
              
              {automatedRecommendations.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => handleOptimize(automatedRecommendations.map(r => r.id))}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Aplicar Todas Automatizadas ({automatedRecommendations.length})
                  </button>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                {filteredRecommendations.length} recomendações • 
                Economia estimada: {formatSize(totalEstimatedSavings)}
              </div>
            </div>
            
            {/* Lista de Recomendações */}
            <div className="space-y-4">
              {filteredRecommendations.map(recommendation => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))}
              
              {filteredRecommendations.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma recomendação encontrada</h3>
                  <p className="text-gray-600">Seu bundle está otimizado ou não há análise disponível.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Configurações de Otimização</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Configurações gerais */}
                <div>
                  <h3 className="text-md font-semibold mb-4">Geral</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Otimização Automática</label>
                        <p className="text-sm text-gray-500">Aplicar otimizações automaticamente</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoOptimize}
                        onChange={(e) => updateSettings({ autoOptimize: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho Alvo (bytes)
                      </label>
                      <input
                        type="number"
                        value={settings.targetSize}
                        onChange={(e) => updateSettings({ targetSize: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Configurações de compressão */}
                <div>
                  <h3 className="text-md font-semibold mb-4">Compressão</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nível de Compressão
                      </label>
                      <select
                        value={settings.compressionLevel}
                        onChange={(e) => updateSettings({ compressionLevel: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="none">Nenhuma</option>
                        <option value="basic">Básica</option>
                        <option value="aggressive">Agressiva</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Habilitar Gzip</label>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableGzip}
                        onChange={(e) => updateSettings({ enableGzip: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Habilitar Brotli</label>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableBrotli}
                        onChange={(e) => updateSettings({ enableBrotli: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Agendar Otimização</span>
                    </button>
                    
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importar</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={clearHistory}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Limpar Histórico</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const data = exportSettings();
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'bundle-optimizer-settings.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar Configurações</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Histórico de Análises</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setComparisonMode(!comparisonMode)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        comparisonMode
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {comparisonMode ? 'Cancelar Comparação' : 'Comparar'}
                    </button>
                    {comparisonMode && selectedForComparison.length === 2 && (
                      <button
                        onClick={handleCompare}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Comparar Selecionadas
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="divide-y">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {comparisonMode && (
                          <input
                            type="checkbox"
                            checked={selectedForComparison.includes(analysis.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedForComparison.length < 2) {
                                  setSelectedForComparison([...selectedForComparison, analysis.id]);
                                }
                              } else {
                                setSelectedForComparison(selectedForComparison.filter(id => id !== analysis.id));
                              }
                            }}
                            disabled={!selectedForComparison.includes(analysis.id) && selectedForComparison.length >= 2}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(analysis.timestamp).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatSize(analysis.totalSize)} • {analysis.chunks.length} chunks • {analysis.recommendations.length} recomendações
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedAnalysis(analysis.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExport(analysis.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {analyses.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma análise encontrada</h3>
                    <p className="text-gray-600">Execute uma análise para ver o histórico aqui.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Agendar Otimização</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expressão Cron
                </label>
                <input
                  type="text"
                  value={scheduleExpression}
                  onChange={(e) => setScheduleExpression(e.target.value)}
                  placeholder="0 0 * * *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exemplo: "0 0 * * *" para execução diária à meia-noite
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Importar Análise</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dados JSON
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Cole os dados JSON da análise aqui..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleOptimizerDashboard;