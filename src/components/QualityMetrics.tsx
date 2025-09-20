import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  Trash2,
  Compare,
  Settings,
  FileText,
  Image,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Brain
} from 'lucide-react';

// Interfaces
interface QualityMetric {
  id: string;
  contentId: string;
  contentType: 'script' | 'storyboard';
  category: 'educational' | 'commercial';
  metrics: {
    readabilityScore: number;
    grammarScore: number;
    coherenceScore: number;
    creativityScore: number;
    engagementScore: number;
    technicalAccuracy: number;
    brandAlignment: number;
    targetAudienceMatch: number;
    seoScore: number;
    originalityScore: number;
  };
  overallScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  aiModel: string;
  analysisDate: string;
  userId: string;
  processingTime: number;
  confidence: number;
}

interface Benchmark {
  min: number;
  target: number;
  max: number;
}

interface BenchmarkSet {
  [key: string]: Benchmark;
}

interface Analytics {
  totalAnalyses: number;
  avgOverallScore: number;
  avgProcessingTime: number;
  modelPerformance: {
    [key: string]: {
      analyses: number;
      avgScore: number;
      avgTime: number;
    };
  };
  categoryStats: {
    [key: string]: {
      analyses: number;
      avgScore: number;
    };
  };
  contentTypeStats: {
    [key: string]: {
      analyses: number;
      avgScore: number;
    };
  };
  trendsData: {
    date: string;
    analyses: number;
    avgScore: number;
  }[];
}

interface ComparisonResult {
  metrics: QualityMetric[];
  summary: {
    bestOverallScore: number;
    worstOverallScore: number;
    avgOverallScore: number;
    bestPerformingModel: string;
    commonStrengths: string[];
    commonWeaknesses: string[];
  };
}

const QualityMetrics: React.FC = () => {
  // Estados
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [benchmarks, setBenchmarks] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    contentType: '',
    category: '',
    aiModel: '',
    minScore: '',
    maxScore: '',
    startDate: '',
    endDate: ''
  });
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'metrics' | 'analytics' | 'benchmarks'>('metrics');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('analysisDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados de modais
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<QualityMetric | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  // Estados de formulários
  const [analyzeForm, setAnalyzeForm] = useState({
    content: '',
    contentType: 'script' as 'script' | 'storyboard',
    category: 'educational' as 'educational' | 'commercial',
    aiModel: 'gpt-4'
  });
  
  const [benchmarkForm, setBenchmarkForm] = useState({
    contentType: 'script' as 'script' | 'storyboard',
    category: 'educational' as 'educational' | 'commercial',
    metrics: {} as BenchmarkSet
  });
  
  // Carregar dados iniciais
  useEffect(() => {
    loadMetrics();
    loadAnalytics();
    loadBenchmarks();
  }, [filters, sortBy, sortOrder, currentPage]);
  
  const loadMetrics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });
      
      const response = await fetch(`/api/ai/quality/metrics?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Erro ao carregar métricas');
      }
    } catch (error) {
      setError('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/quality/analytics');
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };
  
  const loadBenchmarks = async () => {
    try {
      const response = await fetch('/api/ai/quality/benchmarks');
      const data = await response.json();
      
      if (response.ok) {
        setBenchmarks(data);
      }
    } catch (error) {
      console.error('Erro ao carregar benchmarks:', error);
    }
  };
  
  const analyzeContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/quality/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyzeForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMetrics(prev => [data, ...prev]);
        setShowAnalyzeModal(false);
        setAnalyzeForm({
          content: '',
          contentType: 'script',
          category: 'educational',
          aiModel: 'gpt-4'
        });
        loadAnalytics();
      } else {
        setError(data.error || 'Erro ao analisar conteúdo');
      }
    } catch (error) {
      setError('Erro ao analisar conteúdo');
    } finally {
      setLoading(false);
    }
  };
  
  const reanalyzeMetric = async (metricId: string, aiModel?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/quality/metrics/${metricId}/reanalyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aiModel })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMetrics(prev => prev.map(m => m.id === metricId ? data : m));
        loadAnalytics();
      } else {
        setError(data.error || 'Erro ao reanalisar conteúdo');
      }
    } catch (error) {
      setError('Erro ao reanalisar conteúdo');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteMetric = async (metricId: string) => {
    try {
      const response = await fetch(`/api/ai/quality/metrics/${metricId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMetrics(prev => prev.filter(m => m.id !== metricId));
        loadAnalytics();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao deletar métrica');
      }
    } catch (error) {
      setError('Erro ao deletar métrica');
    }
  };
  
  const compareMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/quality/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metricIds: selectedMetrics })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setComparisonResult(data);
        setShowCompareModal(true);
      } else {
        setError(data.error || 'Erro ao comparar métricas');
      }
    } catch (error) {
      setError('Erro ao comparar métricas');
    } finally {
      setLoading(false);
    }
  };
  
  const exportMetrics = async (format: 'json' | 'csv') => {
    try {
      const queryParams = new URLSearchParams({
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });
      
      const response = await fetch(`/api/ai/quality/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quality-metrics.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao exportar métricas');
      }
    } catch (error) {
      setError('Erro ao exportar métricas');
    }
  };
  
  const updateBenchmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/quality/benchmarks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(benchmarkForm)
      });
      
      if (response.ok) {
        setShowBenchmarkModal(false);
        loadBenchmarks();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao atualizar benchmarks');
      }
    } catch (error) {
      setError('Erro ao atualizar benchmarks');
    } finally {
      setLoading(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };
  
  const formatMetricName = (metric: string) => {
    const names: { [key: string]: string } = {
      readabilityScore: 'Legibilidade',
      grammarScore: 'Gramática',
      coherenceScore: 'Coerência',
      creativityScore: 'Criatividade',
      engagementScore: 'Engajamento',
      technicalAccuracy: 'Precisão Técnica',
      brandAlignment: 'Alinhamento da Marca',
      targetAudienceMatch: 'Adequação ao Público',
      seoScore: 'SEO',
      originalityScore: 'Originalidade'
    };
    return names[metric] || metric;
  };
  
  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = !searchTerm || 
      metric.contentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metric.contentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metric.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metric.aiModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              Métricas de Qualidade
            </h1>
            <p className="text-gray-600 mt-2">
              Análise e monitoramento da qualidade do conteúdo gerado por IA
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAnalyzeModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Analisar Conteúdo
            </button>
            <button
              onClick={() => exportMetrics('json')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
        
        {/* Estatísticas Rápidas */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Análises</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAnalyses}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score Médio</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analytics.avgOverallScore)}`}>
                    {analytics.avgOverallScore.toFixed(1)}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.avgProcessingTime.toFixed(1)}s
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Modelos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(analytics.modelPerformance).length}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navegação por Abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Métricas
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Analytics
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'benchmarks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Benchmarks
            </div>
          </button>
        </nav>
      </div>
      
      {/* Conteúdo das Abas */}
      {activeTab === 'metrics' && (
        <div>
          {/* Filtros e Busca */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar métricas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filters.contentType}
                onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="script">Roteiro</option>
                <option value="storyboard">Storyboard</option>
              </select>
              
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as categorias</option>
                <option value="educational">Educacional</option>
                <option value="commercial">Comercial</option>
              </select>
              
              <select
                value={filters.aiModel}
                onChange={(e) => setFilters(prev => ({ ...prev, aiModel: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os modelos</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3">Claude 3</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Score mín:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minScore}
                    onChange={(e) => setFilters(prev => ({ ...prev, minScore: e.target.value }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Score máx:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.maxScore}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxScore: e.target.value }))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedMetrics.length > 1 && (
                  <button
                    onClick={compareMetrics}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex items-center gap-1 text-sm"
                  >
                    <Compare className="w-4 h-4" />
                    Comparar ({selectedMetrics.length})
                  </button>
                )}
                
                <button
                  onClick={loadMetrics}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 flex items-center gap-1 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
              </div>
            </div>
          </div>
          
          {/* Lista de Métricas */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Carregando métricas...</p>
              </div>
            ) : filteredMetrics.length === 0 ? (
              <div className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma métrica encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetrics(filteredMetrics.map(m => m.id));
                            } else {
                              setSelectedMetrics([]);
                            }
                          }}
                          checked={selectedMetrics.length === filteredMetrics.length && filteredMetrics.length > 0}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conteúdo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score Geral
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modelo IA
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMetrics.map((metric) => (
                      <tr key={metric.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedMetrics.includes(metric.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMetrics(prev => [...prev, metric.id]);
                              } else {
                                setSelectedMetrics(prev => prev.filter(id => id !== metric.id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            {metric.contentType === 'script' ? (
                              <FileText className="w-4 h-4 text-blue-600 mr-2" />
                            ) : (
                              <Image className="w-4 h-4 text-green-600 mr-2" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {metric.contentId}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {metric.contentType === 'script' ? 'Roteiro' : 'Storyboard'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {metric.category === 'educational' ? 'Educacional' : 'Comercial'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <span className={`text-lg font-bold ${getScoreColor(metric.overallScore)}`}>
                              {metric.overallScore.toFixed(1)}
                            </span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${metric.overallScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {metric.aiModel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(metric.analysisDate).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {metric.processingTime}s
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedMetric(metric);
                                setShowDetailModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => reanalyzeMetric(metric.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Reanalisar"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteMetric(metric.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Performance por Modelo */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Modelo de IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analytics.modelPerformance).map(([model, stats]) => (
                <div key={model} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{model}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Análises:</span>
                      <span className="text-sm font-medium">{stats.analyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Score Médio:</span>
                      <span className={`text-sm font-medium ${getScoreColor(stats.avgScore)}`}>
                        {stats.avgScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tempo Médio:</span>
                      <span className="text-sm font-medium">{stats.avgTime.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Gráfico de Tendências */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Qualidade</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgScore" stroke="#3B82F6" name="Score Médio" />
                <Line type="monotone" dataKey="analyses" stroke="#10B981" name="Análises" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Distribuição por Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Categoria</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.categoryStats).map(([category, stats]) => ({
                      name: category === 'educational' ? 'Educacional' : 'Comercial',
                      value: stats.analyses,
                      score: stats.avgScore
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analytics.categoryStats).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#10B981'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Tipo de Conteúdo</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(analytics.contentTypeStats).map(([type, stats]) => ({
                  name: type === 'script' ? 'Roteiro' : 'Storyboard',
                  analyses: stats.analyses,
                  avgScore: stats.avgScore
                }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="analyses" fill="#3B82F6" name="Análises" />
                  <Bar dataKey="avgScore" fill="#10B981" name="Score Médio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Configuração de Benchmarks</h3>
            <button
              onClick={() => setShowBenchmarkModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Editar Benchmarks
            </button>
          </div>
          
          {Object.entries(benchmarks).map(([contentType, categories]) => (
            <div key={contentType} className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                {contentType === 'script' ? 'Roteiro' : 'Storyboard'}
              </h4>
              
              {Object.entries(categories as any).map(([category, metrics]) => (
                <div key={category} className="mb-6">
                  <h5 className="text-md font-medium text-gray-700 mb-3 capitalize">
                    {category === 'educational' ? 'Educacional' : 'Comercial'}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(metrics as any).map(([metric, benchmark]) => (
                      <div key={metric} className="bg-gray-50 p-4 rounded-lg">
                        <h6 className="text-sm font-medium text-gray-900 mb-2">
                          {formatMetricName(metric)}
                        </h6>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mínimo:</span>
                            <span className="font-medium">{(benchmark as any).min}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Alvo:</span>
                            <span className="font-medium text-blue-600">{(benchmark as any).target}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Máximo:</span>
                            <span className="font-medium">{(benchmark as any).max}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de Análise de Conteúdo */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Analisar Conteúdo</h3>
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={analyzeForm.content}
                  onChange={(e) => setAnalyzeForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cole aqui o conteúdo a ser analisado..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Conteúdo
                  </label>
                  <select
                    value={analyzeForm.contentType}
                    onChange={(e) => setAnalyzeForm(prev => ({ ...prev, contentType: e.target.value as 'script' | 'storyboard' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="script">Roteiro</option>
                    <option value="storyboard">Storyboard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={analyzeForm.category}
                    onChange={(e) => setAnalyzeForm(prev => ({ ...prev, category: e.target.value as 'educational' | 'commercial' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="educational">Educacional</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo de IA
                  </label>
                  <select
                    value={analyzeForm.aiModel}
                    onChange={(e) => setAnalyzeForm(prev => ({ ...prev, aiModel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-3">Claude 3</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={analyzeContent}
                disabled={!analyzeForm.content.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analisar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Detalhes da Métrica */}
      {showDetailModal && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes da Métrica</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Gerais */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Informações Gerais</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID do Conteúdo:</span>
                      <span className="font-medium">{selectedMetric.contentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">
                        {selectedMetric.contentType === 'script' ? 'Roteiro' : 'Storyboard'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoria:</span>
                      <span className="font-medium">
                        {selectedMetric.category === 'educational' ? 'Educacional' : 'Comercial'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modelo IA:</span>
                      <span className="font-medium">{selectedMetric.aiModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data de Análise:</span>
                      <span className="font-medium">
                        {new Date(selectedMetric.analysisDate).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tempo de Processamento:</span>
                      <span className="font-medium">{selectedMetric.processingTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confiança:</span>
                      <span className="font-medium">{(selectedMetric.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Score Geral */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Score Geral</h4>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(selectedMetric.overallScore)}`}>
                        {selectedMetric.overallScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">de 100</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getScoreBadge(selectedMetric.overallScore)}`}>
                        {selectedMetric.overallScore >= 90 ? 'Excelente' :
                         selectedMetric.overallScore >= 80 ? 'Muito Bom' :
                         selectedMetric.overallScore >= 70 ? 'Bom' :
                         selectedMetric.overallScore >= 60 ? 'Regular' : 'Precisa Melhorar'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Métricas Detalhadas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Métricas Detalhadas</h4>
                <div className="space-y-3">
                  {Object.entries(selectedMetric.metrics).map(([metric, score]) => (
                    <div key={metric} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatMetricName(metric)}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Gráfico Radar */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Visualização Radar</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={Object.entries(selectedMetric.metrics).map(([metric, score]) => ({
                  metric: formatMetricName(metric),
                  score,
                  fullMark: 100
                }))}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Feedback */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Pontos Fortes
                </h5>
                <ul className="text-sm text-green-800 space-y-1">
                  {selectedMetric.feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Melhorias
                </h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {selectedMetric.feedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Sugestões
                </h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedMetric.feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de Erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Overlay de Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Processando...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityMetrics;