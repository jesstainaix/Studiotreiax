import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Copy,
  Edit,
  Trash2,
  Play,
  Star,
  TrendingUp,
  Zap,
  Settings,
  FileText,
  Video,
  Mic,
  Image,
  Monitor,
  BarChart3,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cachedFetch } from '../services/apiCacheService';

// Interfaces
interface Variable {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean';
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: any;
}

interface OptimizationSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface Performance {
  usage: number;
  rating: number;
  successRate: number;
  avgResponseTime: number;
}

interface OptimizedPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  contentType: string;
  template: string;
  variables: Variable[];
  optimization: OptimizationSettings;
  performance: Performance;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ContentType {
  id: string;
  name: string;
  description: string;
}

interface Analytics {
  totalPrompts: number;
  totalUsage: number;
  averageRating: number;
  topCategories: Array<{
    category: string;
    usage: number;
    percentage: number;
  }>;
  performanceMetrics: {
    avgSuccessRate: number;
    avgResponseTime: number;
    totalOptimizations: number;
  };
}

interface ProcessedResult {
  originalTemplate: string;
  processedPrompt: string;
  variables: Record<string, any>;
  optimization: OptimizationSettings;
  processedAt: string;
}

interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  optimizationType: string;
  improvements: string[];
  promptId: string;
  optimizedAt: string;
}

interface TestResult {
  promptId: string;
  processedPrompt: string;
  variables: Record<string, any>;
  performanceScore: number;
  estimatedTokens: number;
  estimatedCost: string;
  recommendations: string[];
  testedAt: string;
}

const OptimizedPrompts: React.FC = () => {
  // Estados
  const [prompts, setPrompts] = useState<OptimizedPrompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<'prompts' | 'analytics'>('prompts');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<OptimizedPrompt | null>(null);

  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Estados de formulários
  const [promptForm, setPromptForm] = useState<Partial<OptimizedPrompt>>({});
  const [processVariables, setProcessVariables] = useState<Record<string, any>>({});
  const [optimizationType, setOptimizationType] = useState('clarity');
  const [testVariables, setTestVariables] = useState<Record<string, any>>({});

  // Estados de resultados
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPrompts(),
        loadCategories(),
        loadContentTypes(),
        loadAnalytics()
      ]);
    } catch (error) {
      setError('Erro ao carregar dados iniciais');
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadPrompts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        contentType: selectedContentType,
        sortBy,
        sortOrder
      });

      const response = await cachedFetch(`/api/ai/prompts/prompts?${params}`, {}, 2 * 60 * 1000); // Cache por 2 minutos
      if (!response.ok) throw new Error('Erro ao carregar prompts');
      
      const data = await response.json();
      setPrompts(data.prompts);
    } catch (error) {
      throw new Error('Erro ao carregar prompts');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await cachedFetch('/api/ai/prompts/categories', {}, 10 * 60 * 1000); // Cache por 10 minutos
      if (!response.ok) throw new Error('Erro ao carregar categorias');
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      throw new Error('Erro ao carregar categorias');
    }
  };

  const loadContentTypes = async () => {
    try {
      const response = await cachedFetch('/api/ai/prompts/content-types', {}, 10 * 60 * 1000); // Cache por 10 minutos
      if (!response.ok) throw new Error('Erro ao carregar tipos de conteúdo');
      
      const data = await response.json();
      setContentTypes(data);
    } catch (error) {
      throw new Error('Erro ao carregar tipos de conteúdo');
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await cachedFetch('/api/ai/prompts/analytics', {}, 1 * 60 * 1000); // Cache por 1 minuto
      if (!response.ok) throw new Error('Erro ao carregar analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      throw new Error('Erro ao carregar analytics');
    }
  };

  // Recarregar prompts quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      loadPrompts();
    }
  }, [currentPage, searchTerm, selectedCategory, selectedContentType, sortBy, sortOrder]);

  // Funções CRUD
  const createPrompt = async (promptData: Partial<OptimizedPrompt>) => {
    try {
      const response = await fetch('/api/ai/prompts/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar prompt');
      }

      await loadPrompts();
      await loadAnalytics();
      setShowCreateModal(false);
      setPromptForm({});
      toast.success('Prompt criado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar prompt');
    }
  };

  const updatePrompt = async (id: string, promptData: Partial<OptimizedPrompt>) => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar prompt');
      }

      await loadPrompts();
      setShowEditModal(false);
      setSelectedPrompt(null);
      setPromptForm({});
      toast.success('Prompt atualizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar prompt');
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este prompt?')) return;

    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar prompt');
      }

      await loadPrompts();
      await loadAnalytics();
      toast.success('Prompt deletado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar prompt');
    }
  };

  const duplicatePrompt = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}/duplicate`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao duplicar prompt');
      }

      await loadPrompts();
      await loadAnalytics();
      toast.success('Prompt duplicado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao duplicar prompt');
    }
  };

  // Funções de processamento
  const processPrompt = async (id: string, variables: Record<string, any>) => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar prompt');
      }

      const result = await response.json();
      setProcessedResult(result);
      await loadPrompts();
      toast.success('Prompt processado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar prompt');
    }
  };

  const optimizePrompt = async (id: string, type: string, variables: Record<string, any>) => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizationType: type, variables })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao otimizar prompt');
      }

      const result = await response.json();
      setOptimizationResult(result);
      await loadAnalytics();
      toast.success('Prompt otimizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao otimizar prompt');
    }
  };

  const testPrompt = async (id: string, variables: Record<string, any>) => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao testar prompt');
      }

      const result = await response.json();
      setTestResult(result);
      toast.success('Teste realizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao testar prompt');
    }
  };

  const ratePrompt = async (id: string, rating: number) => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao avaliar prompt');
      }

      await loadPrompts();
      await loadAnalytics();
      toast.success('Avaliação registrada com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao avaliar prompt');
    }
  };

  // Funções de importação/exportação
  const exportPrompt = async (id: string, format: 'json' | 'txt' = 'json') => {
    try {
      const response = await fetch(`/api/ai/prompts/prompts/${id}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar prompt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt_${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Prompt exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar prompt');
    }
  };

  const importPrompt = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/prompts/prompts/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao importar prompt');
      }

      await loadPrompts();
      await loadAnalytics();
      setShowImportModal(false);
      toast.success('Prompt importado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao importar prompt');
    }
  };

  // Funções auxiliares
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'interactive': return <Monitor className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatPerformanceScore = (score: number) => {
    if (score >= 0.8) return { color: 'text-green-600', label: 'Excelente' };
    if (score >= 0.6) return { color: 'text-yellow-600', label: 'Bom' };
    if (score >= 0.4) return { color: 'text-orange-600', label: 'Regular' };
    return { color: 'text-red-600', label: 'Baixo' };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompts Otimizados</h1>
          <p className="text-gray-600">Sistema de prompts otimizados para diferentes tipos de conteúdo</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Prompt
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Prompts</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalPrompts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uso Total</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalUsage}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Otimizações</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.performanceMetrics.totalOptimizations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prompts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Prompts
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'prompts' && (
        <div className="space-y-6">
          {/* Filtros e Busca */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar prompts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Data de Criação</option>
                  <option value="updatedAt">Última Atualização</option>
                  <option value="performance.rating">Avaliação</option>
                  <option value="performance.usage">Uso</option>
                  <option value="name">Nome</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conteúdo</label>
                  <select
                    value={selectedContentType}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os tipos</option>
                    {contentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map(prompt => (
              <div key={prompt.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getContentTypeIcon(prompt.contentType)}
                    <span className="text-sm text-gray-600">
                      {contentTypes.find(t => t.id === prompt.contentType)?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setShowProcessModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Processar"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setShowOptimizeModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-purple-600"
                      title="Otimizar"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setShowTestModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Testar"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicatePrompt(prompt.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setPromptForm(prompt);
                        setShowEditModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePrompt(prompt.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{prompt.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{prompt.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Categoria:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {categories.find(c => c.id === prompt.category)?.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Uso:</span>
                    <span className="text-sm font-medium text-gray-900">{prompt.performance.usage}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avaliação:</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(prompt.performance.rating)}
                      <span className="text-sm text-gray-600 ml-1">({prompt.performance.rating.toFixed(1)})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Taxa de Sucesso:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(prompt.performance.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{prompt.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => exportPrompt(prompt.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Exportar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {prompts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum prompt encontrado</h3>
              <p className="text-gray-600">Crie seu primeiro prompt otimizado para começar.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Métricas de Performance */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(analytics.performanceMetrics.avgSuccessRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Taxa de Sucesso Média</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.performanceMetrics.avgResponseTime.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Tempo de Resposta Médio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.performanceMetrics.totalOptimizations}
                </div>
                <div className="text-sm text-gray-600">Total de Otimizações</div>
              </div>
            </div>
          </div>

          {/* Categorias Mais Usadas */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias Mais Usadas</h3>
            <div className="space-y-4">
              {analytics.topCategories.map(item => {
                const category = categories.find(c => c.id === item.category);
                return (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="font-medium text-gray-900">{category?.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{item.usage} usos</span>
                      <span className="text-sm font-medium text-gray-900">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição de Prompt */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {showCreateModal ? 'Criar Novo Prompt' : 'Editar Prompt'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setPromptForm({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (showCreateModal) {
                  createPrompt(promptForm);
                } else {
                  updatePrompt(selectedPrompt!.id, promptForm);
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={promptForm.name || ''}
                    onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={promptForm.category || ''}
                    onChange={(e) => setPromptForm({ ...promptForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conteúdo</label>
                  <select
                    value={promptForm.contentType || ''}
                    onChange={(e) => setPromptForm({ ...promptForm, contentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um tipo</option>
                    {contentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={promptForm.isPublic || false}
                      onChange={(e) => setPromptForm({ ...promptForm, isPublic: e.target.checked })}
                      className="mr-2"
                    />
                    Tornar público
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={promptForm.description || ''}
                  onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template do Prompt</label>
                <textarea
                  value={promptForm.template || ''}
                  onChange={(e) => setPromptForm({ ...promptForm, template: e.target.value })}
                  rows={6}
                  placeholder="Use {variavel} para definir variáveis no template..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={promptForm.tags?.join(', ') || ''}
                  onChange={(e) => setPromptForm({ 
                    ...promptForm, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setPromptForm({});
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {showCreateModal ? 'Criar' : 'Atualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Processamento */}
      {showProcessModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Processar Prompt</h2>
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setProcessVariables({});
                  setProcessedResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPrompt.name}</h3>
                <p className="text-gray-600">{selectedPrompt.description}</p>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Variáveis</h4>
                <div className="space-y-4">
                  {selectedPrompt.variables.map(variable => (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {variable.name}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {variable.type === 'text' && (
                        <input
                          type="text"
                          value={processVariables[variable.name] || ''}
                          onChange={(e) => setProcessVariables({
                            ...processVariables,
                            [variable.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={variable.description}
                          required={variable.required}
                        />
                      )}
                      {variable.type === 'textarea' && (
                        <textarea
                          value={processVariables[variable.name] || ''}
                          onChange={(e) => setProcessVariables({
                            ...processVariables,
                            [variable.name]: e.target.value
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={variable.description}
                          required={variable.required}
                        />
                      )}
                      {variable.type === 'number' && (
                        <input
                          type="number"
                          value={processVariables[variable.name] || ''}
                          onChange={(e) => setProcessVariables({
                            ...processVariables,
                            [variable.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={variable.description}
                          required={variable.required}
                        />
                      )}
                      {variable.type === 'select' && (
                        <select
                          value={processVariables[variable.name] || ''}
                          onChange={(e) => setProcessVariables({
                            ...processVariables,
                            [variable.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required={variable.required}
                        >
                          <option value="">Selecione uma opção</option>
                          {variable.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {variable.type === 'boolean' && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={processVariables[variable.name] || false}
                            onChange={(e) => setProcessVariables({
                              ...processVariables,
                              [variable.name]: e.target.checked
                            })}
                            className="mr-2"
                          />
                          {variable.description}
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {processedResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Resultado Processado</h4>
                  <div className="bg-white p-3 rounded border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">{processedResult.processedPrompt}</pre>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processado em: {new Date(processedResult.processedAt).toLocaleString()}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(processedResult.processedPrompt)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProcessModal(false);
                    setProcessVariables({});
                    setProcessedResult(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Fechar
                </button>
                <button
                  onClick={() => processPrompt(selectedPrompt.id, processVariables)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Processar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Otimização */}
      {showOptimizeModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Otimizar Prompt</h2>
              <button
                onClick={() => {
                  setShowOptimizeModal(false);
                  setOptimizationType('clarity');
                  setOptimizationResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPrompt.name}</h3>
                <p className="text-gray-600">{selectedPrompt.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Otimização</label>
                <select
                  value={optimizationType}
                  onChange={(e) => setOptimizationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="clarity">Clareza</option>
                  <option value="creativity">Criatividade</option>
                  <option value="efficiency">Eficiência</option>
                  <option value="specificity">Especificidade</option>
                </select>
              </div>

              {optimizationResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Resultado da Otimização</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Prompt Original:</h5>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800">{optimizationResult.originalPrompt}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Prompt Otimizado:</h5>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800">{optimizationResult.optimizedPrompt}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Melhorias:</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {optimizationResult.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-gray-600">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Otimizado em: {new Date(optimizationResult.optimizedAt).toLocaleString()}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(optimizationResult.optimizedPrompt)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowOptimizeModal(false);
                    setOptimizationType('clarity');
                    setOptimizationResult(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Fechar
                </button>
                <button
                  onClick={() => optimizePrompt(selectedPrompt.id, optimizationType, processVariables)}
                  className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Otimizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Teste */}
      {showTestModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Testar Prompt</h2>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestVariables({});
                  setTestResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPrompt.name}</h3>
                <p className="text-gray-600">{selectedPrompt.description}</p>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Variáveis de Teste</h4>
                <div className="space-y-4">
                  {selectedPrompt.variables.map(variable => (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {variable.name}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {variable.type === 'text' && (
                        <input
                          type="text"
                          value={testVariables[variable.name] || ''}
                          onChange={(e) => setTestVariables({
                            ...testVariables,
                            [variable.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={variable.description}
                        />
                      )}
                      {variable.type === 'textarea' && (
                        <textarea
                          value={testVariables[variable.name] || ''}
                          onChange={(e) => setTestVariables({
                            ...testVariables,
                            [variable.name]: e.target.value
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={variable.description}
                        />
                      )}
                      {variable.type === 'number' && (
                        <input
                          type="number"
                          value={testVariables[variable.name] || ''}
                          onChange={(e) => setTestVariables({
                            ...testVariables,
                            [variable.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={variable.description}
                        />
                      )}
                      {variable.type === 'select' && (
                        <select
                          value={testVariables[variable.name] || ''}
                          onChange={(e) => setTestVariables({
                            ...testVariables,
                            [variable.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione uma opção</option>
                          {variable.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {variable.type === 'boolean' && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={testVariables[variable.name] || false}
                            onChange={(e) => setTestVariables({
                              ...testVariables,
                              [variable.name]: e.target.checked
                            })}
                            className="mr-2"
                          />
                          {variable.description}
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {testResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Resultado do Teste</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Prompt Processado:</h5>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800">{testResult.processedPrompt}</pre>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${formatPerformanceScore(testResult.performanceScore).color}`}>
                          {(testResult.performanceScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Score de Performance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {testResult.estimatedTokens}
                        </div>
                        <div className="text-sm text-gray-600">Tokens Estimados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {testResult.estimatedCost}
                        </div>
                        <div className="text-sm text-gray-600">Custo Estimado</div>
                      </div>
                    </div>
                    
                    {testResult.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recomendações:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {testResult.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-gray-600">{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Testado em: {new Date(testResult.testedAt).toLocaleString()}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(testResult.processedPrompt)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestVariables({});
                    setTestResult(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Fechar
                </button>
                <button
                  onClick={() => testPrompt(selectedPrompt.id, testVariables)}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Testar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Importar Prompt</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo JSON</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importPrompt(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Formato esperado:</p>
                    <p>Arquivo JSON contendo as propriedades do prompt (nome, descrição, template, variáveis, etc.)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedPrompts;