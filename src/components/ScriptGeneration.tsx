import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Play,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Clock,
  Target,
  Zap,
  BarChart3,
  Settings,
  Eye,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

// Interfaces
interface ScriptScene {
  id: string;
  title: string;
  duration: number;
  content: string;
  visualCues: string[];
  audioNotes: string[];
}

interface ScriptContent {
  scenes: ScriptScene[];
  callToAction: string;
  keywords: string[];
  estimatedEngagement: number;
}

interface Script {
  id: string;
  title: string;
  description: string;
  category: 'educational' | 'commercial';
  targetAudience: string;
  duration: number;
  tone: string;
  style: string;
  language: string;
  content: ScriptContent;
  aiModel: string;
  generationParams: {
    creativity?: number;
    formality?: number;
    technicality?: number;
  };
  status: 'draft' | 'completed' | 'processing' | 'error' | 'imported';
  createdAt: string;
  updatedAt: string;
  userId: string;
  processingTime: number;
  qualityScore: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: {
    [key: string]: {
      duration: number;
      elements: string[];
    };
  };
  prompts: {
    [key: string]: string;
  };
  isActive: boolean;
  createdAt: string;
  userId: string;
}

interface GenerationHistory {
  id: string;
  scriptId: string;
  prompt: string;
  aiModel: string;
  parameters: any;
  processingTime: number;
  tokensUsed: number;
  cost: number;
  status: string;
  createdAt: string;
  userId: string;
}

interface Analytics {
  totalScripts: number;
  totalGenerations: number;
  avgProcessingTime: number;
  avgQualityScore: number;
  totalTokensUsed: number;
  totalCost: number;
  modelUsage: {
    [key: string]: {
      count: number;
      avgTime: number;
      avgScore: number;
    };
  };
  categoryStats: {
    [key: string]: {
      count: number;
      avgScore: number;
    };
  };
  trendsData: Array<{
    date: string;
    generations: number;
    avgScore: number;
    avgTime: number;
  }>;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const ScriptGeneration: React.FC = () => {
  // Estados principais
  const [scripts, setScripts] = useState<Script[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [aiModelFilter, setAiModelFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estados de UI
  const [activeTab, setActiveTab] = useState<'scripts' | 'templates' | 'history' | 'analytics'>('scripts');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de modais
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Estados de formulários
  const [generateForm, setGenerateForm] = useState({
    title: '',
    description: '',
    category: 'educational' as 'educational' | 'commercial',
    targetAudience: '',
    duration: 300,
    tone: 'professional',
    style: 'standard',
    language: 'pt-BR',
    aiModel: 'gpt-4',
    templateId: '',
    customPrompt: '',
    generationParams: {
      creativity: 0.7,
      formality: 0.8,
      technicality: 0.6
    }
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'educational',
    structure: {},
    prompts: {},
    isActive: true
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    targetAudience: '',
    tone: '',
    style: '',
    content: null as ScriptContent | null
  });

  // Estados de processamento
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadScripts();
    loadTemplates();
    loadAnalytics();
    loadHistory();
  }, [currentPage, categoryFilter, statusFilter, aiModelFilter, sortBy, sortOrder]);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder
      });

      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (aiModelFilter) params.append('aiModel', aiModelFilter);

      const response = await fetch(`/api/ai/scripts/scripts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setScripts(data.scripts);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar roteiros');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai/scripts/templates');
      const data = await response.json();

      if (response.ok) {
        setTemplates(data);
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/scripts/analytics');
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/ai/scripts/history');
      const data = await response.json();

      if (response.ok) {
        setGenerationHistory(data.history);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const handleGenerateScript = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/ai/scripts/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generateForm)
      });

      const data = await response.json();

      if (response.ok) {
        setScripts(prev => [data, ...prev]);
        setShowGenerateModal(false);
        resetGenerateForm();
        loadAnalytics();
        loadHistory();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao gerar roteiro');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateScript = async (scriptId: string) => {
    try {
      setRegenerating(scriptId);
      setError(null);

      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aiModel: 'gpt-4',
          generationParams: {
            creativity: 0.7,
            formality: 0.8,
            technicality: 0.6
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setScripts(prev => prev.map(script => 
          script.id === scriptId ? data : script
        ));
        loadAnalytics();
        loadHistory();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao regenerar roteiro');
    } finally {
      setRegenerating(null);
    }
  };

  const handleUpdateScript = async () => {
    if (!selectedScript) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/scripts/scripts/${selectedScript.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        setScripts(prev => prev.map(script => 
          script.id === selectedScript.id ? data : script
        ));
        setShowEditModal(false);
        setSelectedScript(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao atualizar roteiro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm('Tem certeza que deseja deletar este roteiro?')) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setScripts(prev => prev.filter(script => script.id !== scriptId));
        loadAnalytics();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao deletar roteiro');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateScript = async (scriptId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        setScripts(prev => [data, ...prev]);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao duplicar roteiro');
    } finally {
      setLoading(false);
    }
  };

  const handleExportScript = async (scriptId: string, format: 'json' | 'txt') => {
    try {
      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}/export?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `script_${scriptId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao exportar roteiro');
    }
  };

  const handleImportScripts = async (file: File) => {
    try {
      setImporting(true);
      setError(null);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/scripts/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        loadScripts();
        loadAnalytics();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao importar roteiros');
    } finally {
      setImporting(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/scripts/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateForm)
      });

      const data = await response.json();

      if (response.ok) {
        setTemplates(prev => [data, ...prev]);
        setShowTemplateModal(false);
        resetTemplateForm();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/scripts/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(template => template.id !== templateId));
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao deletar template');
    } finally {
      setLoading(false);
    }
  };

  const resetGenerateForm = () => {
    setGenerateForm({
      title: '',
      description: '',
      category: 'educational',
      targetAudience: '',
      duration: 300,
      tone: 'professional',
      style: 'standard',
      language: 'pt-BR',
      aiModel: 'gpt-4',
      templateId: '',
      customPrompt: '',
      generationParams: {
        creativity: 0.7,
        formality: 0.8,
        technicality: 0.6
      }
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: 'educational',
      structure: {},
      prompts: {},
      isActive: true
    });
  };

  const openEditModal = (script: Script) => {
    setSelectedScript(script);
    setEditForm({
      title: script.title,
      description: script.description,
      targetAudience: script.targetAudience,
      tone: script.tone,
      style: script.style,
      content: script.content
    });
    setShowEditModal(true);
  };

  const openScriptModal = (script: Script) => {
    setSelectedScript(script);
    setShowScriptModal(true);
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Loader className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Geração de Roteiros</h1>
              <p className="text-gray-600">Sistema inteligente de criação de roteiros com IA</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Importar</span>
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Novo Template</span>
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Roteiro</span>
            </button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Roteiros</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalScripts}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.avgProcessingTime.toFixed(1)}s</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qualidade Média</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.avgQualityScore.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Custo Total</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalCost.toFixed(3)}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação por abas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'scripts', label: 'Roteiros', icon: FileText },
              { id: 'templates', label: 'Templates', icon: Settings },
              { id: 'history', label: 'Histórico', icon: Clock },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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

      {/* Filtros e busca */}
      {activeTab === 'scripts' && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar roteiros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              <option value="educational">Educacional</option>
              <option value="commercial">Comercial</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="completed">Concluído</option>
              <option value="processing">Processando</option>
              <option value="draft">Rascunho</option>
              <option value="error">Erro</option>
            </select>
            <select
              value={aiModelFilter}
              onChange={(e) => setAiModelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os modelos</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3">Claude 3</option>
              <option value="gemini">Gemini</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">Mais recentes</option>
              <option value="createdAt-asc">Mais antigos</option>
              <option value="title-asc">Título A-Z</option>
              <option value="title-desc">Título Z-A</option>
              <option value="qualityScore-desc">Maior qualidade</option>
              <option value="qualityScore-asc">Menor qualidade</option>
            </select>
          </div>
        </div>
      )}

      {/* Conteúdo das abas */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum roteiro encontrado</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro roteiro com IA</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar Primeiro Roteiro</span>
              </button>
            </div>
          ) : (
            filteredScripts.map(script => (
              <div key={script.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{script.title}</h3>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(script.status)}`}>
                        {getStatusIcon(script.status)}
                        <span className="capitalize">{script.status}</span>
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                        {script.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{script.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{script.targetAudience}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(script.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>{script.qualityScore}% qualidade</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>{script.aiModel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openScriptModal(script)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(script)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateScript(script.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRegenerateScript(script.id)}
                      disabled={regenerating === script.id}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Regenerar"
                    >
                      {regenerating === script.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    <div className="relative group">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => handleExportScript(script.id, 'json')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Exportar JSON
                        </button>
                        <button
                          onClick={() => handleExportScript(script.id, 'txt')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Exportar TXT
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteScript(script.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Criado em {formatDate(script.createdAt)}</span>
                    <span>Processado em {script.processingTime.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-600 mb-4">Crie templates para agilizar a geração de roteiros</p>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Template</span>
              </button>
            </div>
          ) : (
            templates.map(template => (
              <div key={template.id} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {template.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{template.description}</p>
                    <div className="text-sm text-gray-500">
                      Criado em {formatDate(template.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setGenerateForm(prev => ({ ...prev, templateId: template.id }));
                        setShowGenerateModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Usar template"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {generationHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico encontrado</h3>
              <p className="text-gray-600">O histórico de gerações aparecerá aqui</p>
            </div>
          ) : (
            generationHistory.map(entry => (
              <div key={entry.id} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Geração #{entry.id}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {entry.aiModel}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{entry.prompt}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Tempo:</span>
                        <span className="ml-2 font-medium">{entry.processingTime.toFixed(1)}s</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tokens:</span>
                        <span className="ml-2 font-medium">{entry.tokensUsed.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Custo:</span>
                        <span className="ml-2 font-medium">${entry.cost.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Data:</span>
                        <span className="ml-2 font-medium">{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Estatísticas gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso por Modelo</h3>
              <div className="space-y-3">
                {Object.entries(analytics.modelUsage).map(([model, stats]) => (
                  <div key={model} className="flex items-center justify-between">
                    <span className="text-gray-600">{model}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{stats.count} gerações</div>
                      <div className="text-xs text-gray-500">{stats.avgScore.toFixed(1)}% qualidade</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Categoria</h3>
              <div className="space-y-3">
                {Object.entries(analytics.categoryStats).map(([category, stats]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{category}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{stats.count} roteiros</div>
                      <div className="text-xs text-gray-500">{stats.avgScore.toFixed(1)}% qualidade</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Custos</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total de Tokens</span>
                  <span className="font-medium">{analytics.totalTokensUsed.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Custo Total</span>
                  <span className="font-medium">${analytics.totalCost.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Custo Médio</span>
                  <span className="font-medium">${(analytics.totalCost / analytics.totalGenerations).toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de geração de roteiro */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Gerar Novo Roteiro</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    value={generateForm.title}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Título do roteiro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={generateForm.category}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, category: e.target.value as 'educational' | 'commercial' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="educational">Educacional</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={generateForm.description}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o conteúdo do roteiro"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público-alvo</label>
                  <input
                    type="text"
                    value={generateForm.targetAudience}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Iniciantes em marketing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração (segundos)</label>
                  <input
                    type="number"
                    value={generateForm.duration}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    min={30}
                    max={1800}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tom</label>
                  <select
                    value={generateForm.tone}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="professional">Profissional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Amigável</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                  <select
                    value={generateForm.style}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, style: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="standard">Padrão</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="presentation">Apresentação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modelo de IA</label>
                  <select
                    value={generateForm.aiModel}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, aiModel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-3">Claude 3</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
              </div>
              
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template (opcional)</label>
                  <select
                    value={generateForm.templateId}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um template</option>
                    {templates.filter(t => t.isActive).map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt personalizado (opcional)</label>
                <textarea
                  value={generateForm.customPrompt}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, customPrompt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Instruções específicas para a IA"
                />
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Parâmetros de Geração</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Criatividade: {generateForm.generationParams.creativity}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={generateForm.generationParams.creativity}
                      onChange={(e) => setGenerateForm(prev => ({
                        ...prev,
                        generationParams: {
                          ...prev.generationParams,
                          creativity: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Formalidade: {generateForm.generationParams.formality}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={generateForm.generationParams.formality}
                      onChange={(e) => setGenerateForm(prev => ({
                        ...prev,
                        generationParams: {
                          ...prev.generationParams,
                          formality: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tecnicidade: {generateForm.generationParams.technicality}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={generateForm.generationParams.technicality}
                      onChange={(e) => setGenerateForm(prev => ({
                        ...prev,
                        generationParams: {
                          ...prev.generationParams,
                          technicality: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateScript}
                disabled={generating || !generateForm.title || !generateForm.description}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Gerar Roteiro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de roteiro */}
      {showScriptModal && selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedScript.title}</h2>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Categoria:</span>
                  <span className="ml-2 font-medium capitalize">{selectedScript.category}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Público-alvo:</span>
                  <span className="ml-2 font-medium">{selectedScript.targetAudience}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duração:</span>
                  <span className="ml-2 font-medium">{formatDuration(selectedScript.duration)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Qualidade:</span>
                  <span className="ml-2 font-medium">{selectedScript.qualityScore}%</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Conteúdo do Roteiro</h3>
                <div className="space-y-4">
                  {selectedScript.content.scenes.map((scene, index) => (
                    <div key={scene.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Cena {index + 1}: {scene.title}</h4>
                        <span className="text-sm text-gray-500">{formatDuration(scene.duration)}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{scene.content}</p>
                      {scene.visualCues.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-600">Dicas visuais:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                            {scene.visualCues.map((cue, i) => (
                              <li key={i}>{cue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {scene.audioNotes.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Notas de áudio:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                            {scene.audioNotes.map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedScript.content.callToAction && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Call to Action</h4>
                    <p className="text-blue-800">{selectedScript.content.callToAction}</p>
                  </div>
                )}
                
                {selectedScript.content.keywords.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Palavras-chave</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedScript.content.keywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showEditModal && selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Roteiro</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público-alvo</label>
                  <input
                    type="text"
                    value={editForm.targetAudience}
                    onChange={(e) => setEditForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tom</label>
                  <input
                    type="text"
                    value={editForm.tone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateScript}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Criar Template</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="educational">Educacional</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o template"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Template ativo
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={loading || !templateForm.name}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Criar Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Importar Roteiros</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
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
                      handleImportScripts(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {importing && (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Importando roteiros...</span>
                </div>
              )}
              
              {importResult && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Importação concluída</h3>
                  <div className="text-sm text-green-800">
                    <p>Importados: {importResult.imported}</p>
                    <p>Ignorados: {importResult.skipped}</p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Erros:</p>
                        <ul className="list-disc list-inside">
                          {importResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overlay de loading */}
      {(loading || generating) && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-700">
                {generating ? 'Gerando roteiro...' : 'Carregando...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptGeneration;