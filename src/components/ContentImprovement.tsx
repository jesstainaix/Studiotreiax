import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  Video, 
  Image, 
  Music, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  BarChart3, 
  Download, 
  RefreshCw, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Zap, 
  Info
} from 'lucide-react';
import { cachedFetch } from '../services/apiCacheService';

// Interfaces
interface ContentData {
  contentId?: string;
  contentType: 'video' | 'audio' | 'image' | 'text';
  title: string;
  description?: string;
  tags?: string[];
  duration?: number;
  fileData?: {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

interface Suggestion {
  id: string;
  type: 'title' | 'description' | 'tags' | 'duration' | 'thumbnail' | 'structure';
  category: 'engagement' | 'seo' | 'accessibility' | 'quality';
  priority: 'high' | 'medium' | 'low';
  current: string;
  suggested: string;
  reason: string;
  impact: string;
  confidence: number;
  aiModel: string;
  status: 'pending' | 'applied' | 'rejected';
  appliedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

interface ImprovementMetrics {
  totalSuggestions: number;
  appliedSuggestions: number;
  estimatedImprovement: number;
  categories: {
    engagement: number;
    seo: number;
    accessibility: number;
    quality: number;
  };
}

interface ContentImprovement {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  originalContent: ContentData;
  suggestions: Suggestion[];
  metrics: ImprovementMetrics;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalysisResult {
  id: string;
  contentId: string;
  contentType: string;
  analysisType: string;
  status: 'processing' | 'completed' | 'failed';
  results?: {
    overallScore: number;
    categories: {
      engagement: { score: number; suggestions: number };
      seo: { score: number; suggestions: number };
      accessibility: { score: number; suggestions: number };
      quality: { score: number; suggestions: number };
    };
    totalSuggestions: number;
    processingTime: number;
  };
  createdAt: Date;
}

interface Analytics {
  totalAnalyses: number;
  totalSuggestions: number;
  appliedSuggestions: number;
  averageImprovement: number;
  topCategories: Array<{
    category: string;
    count: number;
    avgImprovement: number;
  }>;
  modelPerformance: {
    [key: string]: {
      accuracy: number;
      avgConfidence: number;
    };
  };
}

const ContentImprovement: React.FC = () => {
  // Estados principais
  const [improvements, setImprovements] = useState<ContentImprovement[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'improvements' | 'analysis' | 'analytics'>('improvements');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados de modais
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState<ContentImprovement | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  
  // Estados de formulários
  const [analysisForm, setAnalysisForm] = useState<ContentData>({
    contentType: 'video',
    title: '',
    description: '',
    tags: []
  });
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadImprovements();
    loadAnalysisHistory();
    loadAnalytics();
  }, [currentPage, searchTerm, contentTypeFilter, categoryFilter, priorityFilter, statusFilter]);
  
  const loadImprovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(contentTypeFilter && { contentType: contentTypeFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      
      const response = await cachedFetch(`/api/ai/content-improvement/improvements?${params}`, {}, 2 * 60 * 1000); // Cache por 2 minutos
      const data = await response.json();
      
      if (response.ok) {
        setImprovements(data.improvements);
      } else {
        setError(data.error || 'Erro ao carregar melhorias');
      }
    } catch (error) {
      setError('Erro ao carregar melhorias');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAnalysisHistory = async () => {
    try {
      const response = await cachedFetch('/api/ai/content-improvement/analysis-history', {}, 5 * 60 * 1000); // Cache por 5 minutos
      const data = await response.json();
      
      if (response.ok) {
        setAnalysisHistory(data.analyses);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await cachedFetch('/api/ai/content-improvement/analytics', {}, 1 * 60 * 1000); // Cache por 1 minuto
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };
  
  const analyzeContent = async () => {
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('contentData', JSON.stringify(analysisForm));
      
      if (analysisFile) {
        formData.append('file', analysisFile);
      }
      
      const response = await fetch('/api/ai/content-improvement/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setImprovements(prev => [data.improvement, ...prev]);
        setAnalysisHistory(prev => [data.analysis, ...prev]);
        setShowAnalysisModal(false);
        setAnalysisForm({
          contentType: 'video',
          title: '',
          description: '',
          tags: []
        });
        setAnalysisFile(null);
      } else {
        setError(data.error || 'Erro ao analisar conteúdo');
      }
    } catch (error) {
      setError('Erro ao analisar conteúdo');
    } finally {
      setLoading(false);
    }
  };
  
  const applySuggestion = async (improvementId: string, suggestionId: string) => {
    try {
      const response = await fetch(
        `/api/ai/content-improvement/improvements/${improvementId}/suggestions/${suggestionId}/apply`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        loadImprovements();
        setShowSuggestionModal(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao aplicar sugestão');
      }
    } catch (error) {
      setError('Erro ao aplicar sugestão');
    }
  };
  
  const rejectSuggestion = async (improvementId: string, suggestionId: string) => {
    try {
      const response = await fetch(
        `/api/ai/content-improvement/improvements/${improvementId}/suggestions/${suggestionId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );
      
      if (response.ok) {
        loadImprovements();
        setShowSuggestionModal(false);
        setRejectionReason('');
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao rejeitar sugestão');
      }
    } catch (error) {
      setError('Erro ao rejeitar sugestão');
    }
  };
  
  const exportImprovement = async (improvementId: string) => {
    try {
      const response = await fetch(`/api/ai/content-improvement/improvements/${improvementId}/export`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `improvement_${improvementId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      setError('Erro ao exportar melhoria');
    }
  };
  
  // Funções auxiliares
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'text': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engagement': return 'text-blue-600 bg-blue-100';
      case 'seo': return 'text-green-600 bg-green-100';
      case 'accessibility': return 'text-purple-600 bg-purple-100';
      case 'quality': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const formatConfidence = (confidence: number) => {
    const percentage = (confidence * 100).toFixed(1);
    const color = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';
    return <span className={color}>{percentage}%</span>;
  };
  
  const formatScore = (score: number) => {
    const percentage = (score * 100).toFixed(1);
    const color = score >= 0.8 ? 'text-green-600' : score >= 0.6 ? 'text-yellow-600' : 'text-red-600';
    return <span className={color}>{percentage}%</span>;
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IA para Melhorias de Conteúdo</h1>
            <p className="text-gray-600 mt-2">Análise inteligente e sugestões para otimizar seu conteúdo</p>
          </div>
          <button
            onClick={() => setShowAnalysisModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Zap className="w-5 h-5 mr-2" />
            Analisar Conteúdo
          </button>
        </div>
        
        {/* Estatísticas rápidas */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Análises</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAnalyses}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sugestões Geradas</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalSuggestions}</p>
                </div>
                <Lightbulb className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sugestões Aplicadas</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.appliedSuggestions}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Melhoria Média</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.averageImprovement * 100).toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navegação por abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'improvements', label: 'Melhorias', icon: Target },
            { id: 'analysis', label: 'Histórico de Análises', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Filtros */}
      {activeTab === 'improvements' && (
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar melhorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="video">Vídeo</option>
              <option value="audio">Áudio</option>
              <option value="image">Imagem</option>
              <option value="text">Texto</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              <option value="engagement">Engajamento</option>
              <option value="seo">SEO</option>
              <option value="accessibility">Acessibilidade</option>
              <option value="quality">Qualidade</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="applied">Aplicada</option>
              <option value="rejected">Rejeitada</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Conteúdo das abas */}
      {activeTab === 'improvements' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : improvements.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma melhoria encontrada</h3>
              <p className="text-gray-600 mb-4">Comece analisando seu conteúdo para receber sugestões de melhoria.</p>
              <button
                onClick={() => setShowAnalysisModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Analisar Conteúdo
              </button>
            </div>
          ) : (
            improvements.map(improvement => (
              <div key={improvement.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getContentTypeIcon(improvement.contentType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{improvement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {improvement.originalContent.title}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Criado em {new Date(improvement.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{improvement.suggestions.length} sugestões</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportImprovement(improvement.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Exportar"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {improvement.metrics.totalSuggestions}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {improvement.metrics.appliedSuggestions}
                    </div>
                    <div className="text-sm text-gray-600">Aplicadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(improvement.metrics.estimatedImprovement * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Melhoria Est.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.values(improvement.metrics.categories).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Categorias</div>
                  </div>
                </div>
                
                {/* Sugestões */}
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-900">Sugestões Principais</h4>
                  {improvement.suggestions.slice(0, 3).map(suggestion => (
                    <div key={suggestion.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                            {suggestion.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority}
                          </span>
                          {getStatusIcon(suggestion.status)}
                          <span className="text-sm text-gray-600">
                            Confiança: {formatConfidence(suggestion.confidence)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-1">
                          <strong>{suggestion.type}:</strong> {suggestion.reason}
                        </p>
                        <p className="text-sm text-gray-600">{suggestion.impact}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedImprovement(improvement);
                            setSelectedSuggestion(suggestion);
                            setShowSuggestionModal(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {suggestion.status === 'pending' && (
                          <>
                            <button
                              onClick={() => applySuggestion(improvement.id, suggestion.id)}
                              className="p-2 text-green-600 hover:text-green-800"
                              title="Aplicar"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedImprovement(improvement);
                                setSelectedSuggestion(suggestion);
                                setShowSuggestionModal(true);
                              }}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Rejeitar"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {improvement.suggestions.length > 3 && (
                    <button
                      onClick={() => {
                        setSelectedImprovement(improvement);
                        setShowSuggestionModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver todas as {improvement.suggestions.length} sugestões
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {analysisHistory.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise encontrada</h3>
              <p className="text-gray-600">O histórico de análises aparecerá aqui.</p>
            </div>
          ) : (
            analysisHistory.map(analysis => (
              <div key={analysis.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Análise {analysis.analysisType}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {analysis.contentType} • {new Date(analysis.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                    analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {analysis.status}
                  </span>
                </div>
                
                {analysis.results && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatScore(analysis.results.overallScore)}
                        </div>
                        <div className="text-sm text-gray-600">Score Geral</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatScore(analysis.results.categories.engagement.score)}
                        </div>
                        <div className="text-sm text-gray-600">Engajamento</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatScore(analysis.results.categories.seo.score)}
                        </div>
                        <div className="text-sm text-gray-600">SEO</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatScore(analysis.results.categories.accessibility.score)}
                        </div>
                        <div className="text-sm text-gray-600">Acessibilidade</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatScore(analysis.results.categories.quality.score)}
                        </div>
                        <div className="text-sm text-gray-600">Qualidade</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{analysis.results.totalSuggestions} sugestões geradas</span>
                      <span>Processado em {analysis.results.processingTime.toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Categorias principais */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categorias Principais</h3>
            <div className="space-y-4">
              {analytics.topCategories.map(category => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category.category)}`}>
                      {category.category}
                    </span>
                    <span className="text-sm text-gray-600">{category.count} sugestões</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {(category.avgImprovement * 100).toFixed(1)}% melhoria média
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Performance dos modelos */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance dos Modelos de IA</h3>
            <div className="space-y-4">
              {Object.entries(analytics.modelPerformance).map(([model, performance]) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-gray-900">{model}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-gray-600">Precisão: </span>
                      <span className="font-medium">{(performance.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Confiança Média: </span>
                      <span className="font-medium">{(performance.avgConfidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Notificações de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Modal de Análise */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Analisar Conteúdo</h2>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conteúdo</label>
                <select
                  value={analysisForm.contentType}
                  onChange={(e) => setAnalysisForm({
                    ...analysisForm,
                    contentType: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="video">Vídeo</option>
                  <option value="audio">Áudio</option>
                  <option value="image">Imagem</option>
                  <option value="text">Texto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={analysisForm.title}
                  onChange={(e) => setAnalysisForm({
                    ...analysisForm,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o título do conteúdo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={analysisForm.description}
                  onChange={(e) => setAnalysisForm({
                    ...analysisForm,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a descrição do conteúdo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={analysisForm.tags?.join(', ') || ''}
                  onChange={(e) => setAnalysisForm({
                    ...analysisForm,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              {analysisForm.contentType === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração (segundos)</label>
                  <input
                    type="number"
                    value={analysisForm.duration || ''}
                    onChange={(e) => setAnalysisForm({
                      ...analysisForm,
                      duration: parseInt(e.target.value) || undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="300"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo (opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    onChange={(e) => setAnalysisFile(e.target.files?.[0] || null)}
                    accept="video/*,audio/*,image/*,.txt,.json"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {analysisFile ? analysisFile.name : 'Clique para selecionar um arquivo'}
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Como funciona a análise:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Análise de título, descrição e tags para SEO</li>
                      <li>Sugestões de engajamento e acessibilidade</li>
                      <li>Recomendações de qualidade baseadas em IA</li>
                      <li>Score de confiança para cada sugestão</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={analyzeContent}
                disabled={!analysisForm.title || loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Analisando...' : 'Analisar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Sugestão */}
      {showSuggestionModal && selectedSuggestion && selectedImprovement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes da Sugestão</h2>
              <button
                onClick={() => {
                  setShowSuggestionModal(false);
                  setSelectedSuggestion(null);
                  setSelectedImprovement(null);
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedSuggestion.category)}`}>
                  {selectedSuggestion.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedSuggestion.priority)}`}>
                  {selectedSuggestion.priority}
                </span>
                {getStatusIcon(selectedSuggestion.status)}
                <span className="text-sm text-gray-600">
                  {selectedSuggestion.status}
                </span>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Tipo: {selectedSuggestion.type}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedSuggestion.reason}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Atual:</h4>
                  <div className="bg-red-50 p-3 rounded border">
                    <p className="text-sm text-gray-800">{selectedSuggestion.current}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sugerido:</h4>
                  <div className="bg-green-50 p-3 rounded border">
                    <p className="text-sm text-gray-800">{selectedSuggestion.suggested}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Impacto Esperado:</h4>
                <p className="text-sm text-blue-800">{selectedSuggestion.impact}</p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Modelo: {selectedSuggestion.aiModel}</span>
                <span>Confiança: {formatConfidence(selectedSuggestion.confidence)}</span>
              </div>
              
              {selectedSuggestion.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da rejeição (opcional):</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Explique por que esta sugestão não é adequada..."
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSuggestionModal(false);
                  setSelectedSuggestion(null);
                  setSelectedImprovement(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
              {selectedSuggestion.status === 'pending' && (
                <>
                  <button
                    onClick={() => rejectSuggestion(selectedImprovement.id, selectedSuggestion.id)}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => applySuggestion(selectedImprovement.id, selectedSuggestion.id)}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Aplicar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentImprovement;