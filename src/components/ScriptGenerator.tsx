import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Edit3, 
  Trash2, 
  Copy, 
  Star, 
  Clock, 
  Users, 
  Tag, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Wand2, 
  BarChart3, 
  Settings,
  Upload,
  Eye,
  MessageSquare,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { cachedFetch } from '../services/apiCacheService';

// Interfaces
interface Scene {
  id: string;
  title: string;
  content: string;
  duration: number;
  visualCues: string[];
  audioNotes: string;
}

interface ScriptMetadata {
  targetAudience: string;
  tone: string;
  keywords: string[];
  language: string;
  generatedAt?: string;
  importedFrom?: string;
}

interface GenerationParams {
  model: string;
  temperature: number;
  maxTokens: number;
  prompt: string;
}

interface ScriptAnalytics {
  views: number;
  downloads: number;
  rating: number;
  feedback: string[];
}

interface Script {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  duration: number;
  scenes: Scene[];
  metadata: ScriptMetadata;
  generationParams: GenerationParams;
  status: 'draft' | 'completed' | 'generating';
  createdAt: string;
  updatedAt: string;
  userId: string;
  analytics: ScriptAnalytics;
}

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  structure: {
    section: string;
    duration: number;
    description: string;
  }[];
  prompts: Record<string, string>;
  variables: string[];
  category: string;
  isPublic: boolean;
  createdAt: string;
  usage: number;
}

interface ScriptType {
  id: string;
  name: string;
  description: string;
}

interface Analytics {
  totalScripts: number;
  totalGenerated: number;
  averageRating: number;
  popularTypes: {
    type: string;
    count: number;
    percentage: number;
  }[];
  monthlyStats: {
    month: string;
    generated: number;
    rating: number;
  }[];
  modelUsage: {
    model: string;
    usage: number;
    cost: number;
  }[];
}

const ScriptGenerator: React.FC = () => {
  // Estados
  const [scripts, setScripts] = useState<Script[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [scriptTypes, setScriptTypes] = useState<ScriptType[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('scripts');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  
  // Estados do formulário de geração
  const [generateForm, setGenerateForm] = useState({
    title: '',
    type: '',
    duration: 180,
    targetAudience: '',
    tone: '',
    keywords: '',
    customPrompt: '',
    templateId: ''
  });
  
  // Estados do formulário de importação
  const [importForm, setImportForm] = useState({
    title: '',
    type: 'educational',
    duration: 180,
    file: null as File | null
  });
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Carregar scripts quando filtros mudarem
  useEffect(() => {
    loadScripts();
  }, [currentPage, searchTerm, selectedType, selectedStatus, sortBy, sortOrder]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [templatesRes, typesRes, analyticsRes] = await Promise.all([
        cachedFetch('/api/ai/scripts/templates', {}, 10 * 60 * 1000), // Cache por 10 minutos
        cachedFetch('/api/ai/scripts/types', {}, 10 * 60 * 1000), // Cache por 10 minutos
        cachedFetch('/api/ai/scripts/analytics', {}, 1 * 60 * 1000) // Cache por 1 minuto
      ]);
      
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }
      
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setScriptTypes(typesData);
      }
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
      
      await loadScripts();
    } catch (err) {
      setError('Erro ao carregar dados iniciais');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadScripts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await cachedFetch(`/api/ai/scripts/scripts?${params}`, {}, 2 * 60 * 1000); // Cache por 2 minutos
      
      if (response.ok) {
        const data = await response.json();
        setScripts(data.scripts);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error('Erro ao carregar roteiros');
      }
    } catch (err) {
      setError('Erro ao carregar roteiros');
      console.error('Erro:', err);
    }
  };
  
  const generateScript = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/ai/scripts/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...generateForm,
          keywords: generateForm.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      });
      
      if (response.ok) {
        const newScript = await response.json();
        setScripts(prev => [newScript, ...prev]);
        setShowGenerateModal(false);
        setGenerateForm({
          title: '',
          type: '',
          duration: 180,
          targetAudience: '',
          tone: '',
          keywords: '',
          customPrompt: '',
          templateId: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar roteiro');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar roteiro');
    } finally {
      setLoading(false);
    }
  };
  
  const importScript = async () => {
    try {
      if (!importForm.file) {
        setError('Selecione um arquivo para importar');
        return;
      }
      
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', importForm.file);
      formData.append('title', importForm.title);
      formData.append('type', importForm.type);
      formData.append('duration', importForm.duration.toString());
      
      const response = await fetch('/api/ai/scripts/scripts/import', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const newScript = await response.json();
        setScripts(prev => [newScript, ...prev]);
        setShowImportModal(false);
        setImportForm({
          title: '',
          type: 'educational',
          duration: 180,
          file: null
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao importar roteiro');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar roteiro');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteScript = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setScripts(prev => prev.filter(s => s.id !== scriptId));
      } else {
        throw new Error('Erro ao deletar roteiro');
      }
    } catch (err) {
      setError('Erro ao deletar roteiro');
    }
  };
  
  const duplicateScript = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}/duplicate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const duplicatedScript = await response.json();
        setScripts(prev => [duplicatedScript, ...prev]);
      } else {
        throw new Error('Erro ao duplicar roteiro');
      }
    } catch (err) {
      setError('Erro ao duplicar roteiro');
    }
  };
  
  const optimizeScript = async (scriptId: string, optimizations: string[]) => {
    try {
      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optimizations })
      });
      
      if (response.ok) {
        const optimizedScript = await response.json();
        setScripts(prev => prev.map(s => s.id === scriptId ? optimizedScript : s));
      } else {
        throw new Error('Erro ao otimizar roteiro');
      }
    } catch (err) {
      setError('Erro ao otimizar roteiro');
    }
  };
  
  const exportScript = async (scriptId: string, format: string) => {
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
        throw new Error('Erro ao exportar roteiro');
      }
    } catch (err) {
      setError('Erro ao exportar roteiro');
    }
  };
  
  const rateScript = async (scriptId: string, rating: number, feedback?: string) => {
    try {
      const response = await fetch(`/api/ai/scripts/scripts/${scriptId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, feedback })
      });
      
      if (response.ok) {
        // Atualizar o script localmente
        setScripts(prev => prev.map(s => {
          if (s.id === scriptId) {
            return {
              ...s,
              analytics: {
                ...s.analytics,
                rating,
                feedback: feedback ? [...s.analytics.feedback, feedback] : s.analytics.feedback
              }
            };
          }
          return s;
        }));
      } else {
        throw new Error('Erro ao avaliar roteiro');
      }
    } catch (err) {
      setError('Erro ao avaliar roteiro');
    }
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'product_demo': 'bg-blue-100 text-blue-800',
      'educational': 'bg-green-100 text-green-800',
      'marketing': 'bg-purple-100 text-purple-800',
      'storytelling': 'bg-orange-100 text-orange-800',
      'interview': 'bg-pink-100 text-pink-800',
      'news': 'bg-red-100 text-red-800',
      'review': 'bg-yellow-100 text-yellow-800',
      'tutorial': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'generating': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  if (loading && scripts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geração de Roteiros</h1>
          <p className="text-gray-600">Crie roteiros profissionais com IA</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </button>
          
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Gerar Roteiro
          </button>
        </div>
      </div>
      
      {/* Estatísticas rápidas */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{analytics.totalScripts}</div>
                <div className="text-sm text-gray-600">Total de Roteiros</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <Wand2 className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{analytics.totalGenerated}</div>
                <div className="text-sm text-gray-600">Gerados com IA</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avaliação Média</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.popularTypes[0]?.count || 0}
                </div>
                <div className="text-sm text-gray-600">Tipo Mais Popular</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'scripts', name: 'Roteiros', icon: FileText },
            { id: 'templates', name: 'Templates', icon: Settings },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Conteúdo das abas */}
      {activeTab === 'scripts' && (
        <div className="space-y-6">
          {/* Filtros e busca */}
          <div className="bg-white rounded-lg border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar roteiros..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  {scriptTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="draft">Rascunho</option>
                  <option value="completed">Concluído</option>
                  <option value="generating">Gerando</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Mais recentes</option>
                  <option value="createdAt-asc">Mais antigos</option>
                  <option value="title-asc">Título A-Z</option>
                  <option value="title-desc">Título Z-A</option>
                  <option value="duration-asc">Menor duração</option>
                  <option value="duration-desc">Maior duração</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Lista de roteiros */}
          <div className="bg-white rounded-lg border">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Seus Roteiros</h3>
              
              {scripts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum roteiro encontrado</p>
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Criar primeiro roteiro
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {scripts.map(script => (
                    <div key={script.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{script.title}</h4>
                            
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              getTypeColor(script.type)
                            }`}>
                              {scriptTypes.find(t => t.id === script.type)?.name || script.type}
                            </span>
                            
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              getStatusColor(script.status)
                            }`}>
                              {script.status === 'draft' ? 'Rascunho' : 
                               script.status === 'completed' ? 'Concluído' : 'Gerando'}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{script.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDuration(script.duration)}
                            </div>
                            
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {script.metadata.targetAudience}
                            </div>
                            
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {script.analytics.views} visualizações
                            </div>
                            
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {script.analytics.rating.toFixed(1)}
                            </div>
                            
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(script.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {script.metadata.keywords.length > 0 && (
                            <div className="flex items-center mt-2">
                              <Tag className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="flex flex-wrap gap-1">
                                {script.metadata.keywords.map((keyword, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedScript(script);
                              setShowScriptModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => duplicateScript(script.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          <div className="relative group">
                            <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                              <Download className="w-4 h-4" />
                            </button>
                            
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => exportScript(script.id, 'txt')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                TXT
                              </button>
                              <button
                                onClick={() => exportScript(script.id, 'pdf')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => exportScript(script.id, 'docx')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                DOCX
                              </button>
                              <button
                                onClick={() => exportScript(script.id, 'json')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                JSON
                              </button>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteScript(script.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Templates Disponíveis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {template.category}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium text-gray-700">Estrutura:</div>
                  {template.structure.map((section, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600">
                      <span>{section.section}</span>
                      <span>{formatDuration(section.duration)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Usado {template.usage} vezes
                  </div>
                  
                  <button
                    onClick={() => {
                      setGenerateForm(prev => ({ ...prev, templateId: template.id }));
                      setShowGenerateModal(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Usar Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Estatísticas mensais */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas Mensais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics.monthlyStats.map(stat => (
                <div key={stat.month} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.generated}</div>
                  <div className="text-sm text-gray-600">{stat.month}</div>
                  <div className="text-xs text-gray-500">Avaliação: {stat.rating.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tipos populares */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos Mais Populares</h3>
            
            <div className="space-y-3">
              {analytics.popularTypes.map(type => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded mr-3 ${
                      getTypeColor(type.type)
                    }`}>
                      {scriptTypes.find(t => t.id === type.type)?.name || type.type}
                    </span>
                    <span className="text-sm text-gray-600">{type.count} roteiros</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{type.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Uso de modelos */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uso de Modelos de IA</h3>
            
            <div className="space-y-4">
              {analytics.modelUsage.map(model => (
                <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{model.model}</div>
                    <div className="text-sm text-gray-600">{model.usage} usos</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">R$ {model.cost.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Custo total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de geração */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gerar Novo Roteiro</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={generateForm.title}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Apresentação do Produto X"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={generateForm.type}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um tipo</option>
                    {scriptTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (segundos) *
                  </label>
                  <input
                    type="number"
                    value={generateForm.duration}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 180 }))}
                    min="30"
                    max="3600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={generateForm.templateId}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Público-alvo
                  </label>
                  <input
                    type="text"
                    value={generateForm.targetAudience}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Empresários, Estudantes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tom
                  </label>
                  <select
                    value={generateForm.tone}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um tom</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Casual">Casual</option>
                    <option value="Entusiasmado">Entusiasmado</option>
                    <option value="Educativo">Educativo</option>
                    <option value="Persuasivo">Persuasivo</option>
                    <option value="Amigável">Amigável</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Palavras-chave
                </label>
                <input
                  type="text"
                  value={generateForm.keywords}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: inovação, tecnologia, eficiência (separadas por vírgula)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Personalizado
                </label>
                <textarea
                  value={generateForm.customPrompt}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, customPrompt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instruções específicas para a IA (opcional)"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={generateScript}
                disabled={!generateForm.title || !generateForm.type || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Gerando...' : 'Gerar Roteiro'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Importar Roteiro</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={importForm.title}
                  onChange={(e) => setImportForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título do roteiro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={importForm.type}
                  onChange={(e) => setImportForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scriptTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração (segundos)
                </label>
                <input
                  type="number"
                  value={importForm.duration}
                  onChange={(e) => setImportForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 180 }))}
                  min="30"
                  max="3600"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo *
                </label>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => setImportForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos suportados: TXT, PDF, DOC, DOCX
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={importScript}
                disabled={!importForm.title || !importForm.file || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importando...' : 'Importar'}
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
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedScript.title}</h3>
                <p className="text-gray-600">{selectedScript.description}</p>
              </div>
              
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Informações do roteiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Duração</div>
                <div className="text-lg font-medium text-gray-900">
                  {formatDuration(selectedScript.duration)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Público-alvo</div>
                <div className="text-lg font-medium text-gray-900">
                  {selectedScript.metadata.targetAudience}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Tom</div>
                <div className="text-lg font-medium text-gray-900">
                  {selectedScript.metadata.tone}
                </div>
              </div>
            </div>
            
            {/* Cenas */}
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Cenas</h4>
              
              {selectedScript.scenes.map((scene, index) => (
                <div key={scene.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">
                      {index + 1}. {scene.title}
                    </h5>
                    <span className="text-sm text-gray-500">
                      {formatDuration(scene.duration)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{scene.content}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Elementos Visuais:</div>
                      <ul className="list-disc list-inside text-gray-600">
                        {scene.visualCues.map((cue, i) => (
                          <li key={i}>{cue}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Notas de Áudio:</div>
                      <p className="text-gray-600">{scene.audioNotes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Conteúdo completo */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Conteúdo Completo</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedScript.content}
                </pre>
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => optimizeScript(selectedScript.id, ['tone_adjustment', 'engagement_boost'])}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Otimizar
                </button>
                
                <button
                  onClick={() => duplicateScript(selectedScript.id)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => exportScript(selectedScript.id, 'pdf')}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </button>
                
                <button
                  onClick={() => setShowScriptModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;