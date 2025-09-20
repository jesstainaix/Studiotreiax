import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  Filter, 
  Download, 
  Upload, 
  Play, 
  Save, 
  X, 
  Tag, 
  Folder, 
  BarChart3, 
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

// Interfaces
interface TemplateVariable {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  description: string;
  default?: string | number | boolean;
  options?: string[];
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isSystem: boolean;
  templateCount: number;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  prompt: string;
  variables: TemplateVariable[];
  tags: string[];
  isPublic: boolean;
  isSystem: boolean;
  userId: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  rating: number;
  ratingCount: number;
  stats?: {
    totalUsage: number;
    monthlyUsage: number;
    weeklyUsage: number;
    dailyUsage: number;
    averageRating: number;
    totalRatings: number;
    lastUsed: string | null;
  };
}

interface GlobalVariable {
  id: string;
  name: string;
  type: string;
  description: string;
  defaultValue: string;
  options?: string[];
  isGlobal: boolean;
}

interface ProcessedTemplate {
  processedPrompt: string;
  template: {
    id: string;
    name: string;
    version: string;
  };
  variables: Record<string, any>;
  processedAt: string;
}

const PromptTemplateManager: React.FC = () => {
  // Estados principais
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // Estados de interface
  const [activeTab, setActiveTab] = useState<'templates' | 'categories' | 'variables' | 'stats'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Estados de formulários
  const [templateForm, setTemplateForm] = useState<Partial<PromptTemplate>>({});
  const [categoryForm, setCategoryForm] = useState<Partial<TemplateCategory>>({});
  const [variableForm, setVariableForm] = useState<Partial<GlobalVariable>>({});
  const [processVariables, setProcessVariables] = useState<Record<string, any>>({});
  const [processedResult, setProcessedResult] = useState<ProcessedTemplate | null>(null);

  // Estados de estatísticas
  const [stats, setStats] = useState<any>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadCategories(),
        loadGlobalVariables(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchTerm,
        sortBy,
        sortOrder,
        isPublic: showPublicOnly.toString()
      });

      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`/api/ai/templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setError('Erro ao carregar templates');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/ai/templates/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadGlobalVariables = async () => {
    try {
      const response = await fetch('/api/ai/templates/variables/global');
      const data = await response.json();

      if (data.success) {
        setGlobalVariables(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar variáveis globais:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ai/templates/stats/overview');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Recarregar templates quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      loadTemplates();
    }
  }, [selectedCategory, searchTerm, selectedTags, sortBy, sortOrder, showPublicOnly]);

  // Funções de CRUD para templates
  const createTemplate = async () => {
    try {
      const response = await fetch('/api/ai/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateForm)
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates();
        setShowTemplateModal(false);
        setTemplateForm({});
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      setError('Erro ao criar template');
    }
  };

  const updateTemplate = async () => {
    try {
      if (!selectedTemplate) return;

      const response = await fetch(`/api/ai/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateForm)
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates();
        setShowTemplateModal(false);
        setTemplateForm({});
        setSelectedTemplate(null);
        setIsEditing(false);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      setError('Erro ao atualizar template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      if (!confirm('Tem certeza que deseja deletar este template?')) return;

      const response = await fetch(`/api/ai/templates/${templateId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates();
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      setError('Erro ao deletar template');
    }
  };

  const duplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/ai/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        await loadTemplates();
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      setError('Erro ao duplicar template');
    }
  };

  const processTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/ai/templates/${templateId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ variables: processVariables })
      });

      const data = await response.json();

      if (data.success) {
        setProcessedResult(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Erro ao processar template:', error);
      setError('Erro ao processar template');
    }
  };

  // Funções auxiliares
  const openTemplateModal = (template?: PromptTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm(template);
      setIsEditing(true);
    } else {
      setSelectedTemplate(null);
      setTemplateForm({
        name: '',
        description: '',
        categoryId: selectedCategory !== 'all' ? selectedCategory : categories[0]?.id || '',
        prompt: '',
        variables: [],
        tags: [],
        isPublic: false
      });
      setIsEditing(false);
    }
    setShowTemplateModal(true);
  };

  const openProcessModal = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    
    // Inicializar variáveis com valores padrão
    const initialVariables: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (variable.default !== undefined) {
        initialVariables[variable.name] = variable.default;
      }
    });
    
    setProcessVariables(initialVariables);
    setProcessedResult(null);
    setShowProcessModal(true);
  };

  const addTemplateVariable = () => {
    const newVariable: TemplateVariable = {
      name: '',
      type: 'text',
      required: false,
      description: ''
    };
    
    setTemplateForm(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  };

  const updateTemplateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    setTemplateForm(prev => {
      const variables = [...(prev.variables || [])];
      variables[index] = { ...variables[index], [field]: value };
      return { ...prev, variables };
    });
  };

  const removeTemplateVariable = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      variables: (prev.variables || []).filter((_, i) => i !== index)
    }));
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.categoryId === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => template.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciador de Templates de Prompts
        </h1>
        <p className="text-gray-600">
          Crie, gerencie e utilize templates de prompts personalizáveis para IA
        </p>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'templates', label: 'Templates', icon: Folder },
              { id: 'categories', label: 'Categorias', icon: Tag },
              { id: 'variables', label: 'Variáveis', icon: Settings },
              { id: 'stats', label: 'Estatísticas', icon: BarChart3 }
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
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'templates' && (
        <div>
          {/* Filtros e busca */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Ordenação */}
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updatedAt_desc">Mais recentes</option>
                <option value="updatedAt_asc">Mais antigos</option>
                <option value="name_asc">Nome A-Z</option>
                <option value="name_desc">Nome Z-A</option>
                <option value="usageCount_desc">Mais usados</option>
                <option value="rating_desc">Melhor avaliados</option>
              </select>

              {/* Filtros adicionais */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPublicOnly(!showPublicOnly)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    showPublicOnly
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showPublicOnly ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  Públicos
                </button>
                
                <button
                  onClick={() => openTemplateModal()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </button>
              </div>
            </div>

            {/* Tags */}
            {getAllTags().length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por tags:
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAllTags().map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lista de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => {
              const category = categories.find(c => c.id === template.categoryId);
              
              return (
                <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.description}
                      </p>
                      
                      {/* Categoria e versão */}
                      <div className="flex items-center space-x-2 mb-2">
                        {category && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: category.color + '20',
                              color: category.color
                            }}
                          >
                            {category.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          v{template.version}
                        </span>
                        {template.isSystem && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Sistema
                          </span>
                        )}
                        {template.isPublic && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                            Público
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Menu de ações */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openProcessModal(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Processar template"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => duplicateTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                        title="Duplicar template"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      {!template.isSystem && (
                        <>
                          <button
                            onClick={() => openTemplateModal(template)}
                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md"
                            title="Editar template"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => deleteTemplate(template.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Deletar template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Usos: {template.usageCount}</span>
                      {template.rating > 0 && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          <span>{template.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <span>
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Variáveis */}
                  {template.variables.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {template.variables.length} variável(is)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou criar um novo template.
              </p>
              <button
                onClick={() => openTemplateModal()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Editar Template' : 'Novo Template'}
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={templateForm.name || ''}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={templateForm.categoryId || ''}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={templateForm.description || ''}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição do template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt *
                  </label>
                  <textarea
                    value={templateForm.prompt || ''}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Digite o prompt aqui. Use {{variavel}} para inserir variáveis."
                  />
                </div>

                {/* Variáveis */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Variáveis
                    </label>
                    <button
                      onClick={addTemplateVariable}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(templateForm.variables || []).map((variable, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nome
                            </label>
                            <input
                              type="text"
                              value={variable.name}
                              onChange={(e) => updateTemplateVariable(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="nome_variavel"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tipo
                            </label>
                            <select
                              value={variable.type}
                              onChange={(e) => updateTemplateVariable(index, 'type', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="text">Texto</option>
                              <option value="textarea">Texto longo</option>
                              <option value="number">Número</option>
                              <option value="select">Seleção</option>
                              <option value="date">Data</option>
                              <option value="boolean">Sim/Não</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={variable.required}
                                onChange={(e) => updateTemplateVariable(index, 'required', e.target.checked)}
                                className="mr-1"
                              />
                              <span className="text-xs text-gray-700">Obrigatório</span>
                            </label>
                            
                            <button
                              onClick={() => removeTemplateVariable(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Descrição
                            </label>
                            <input
                              type="text"
                              value={variable.description}
                              onChange={(e) => updateTemplateVariable(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Descrição da variável"
                            />
                          </div>

                          {variable.type === 'select' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Opções (separadas por vírgula)
                              </label>
                              <input
                                type="text"
                                value={(variable.options || []).join(', ')}
                                onChange={(e) => updateTemplateVariable(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="opção1, opção2, opção3"
                              />
                            </div>
                          )}

                          {variable.type !== 'select' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Valor padrão
                              </label>
                              <input
                                type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                                value={variable.default?.toString() || ''}
                                onChange={(e) => {
                                  let value: any = e.target.value;
                                  if (variable.type === 'number') value = parseFloat(value) || 0;
                                  if (variable.type === 'boolean') value = e.target.checked;
                                  updateTemplateVariable(index, 'default', value);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Valor padrão"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags e configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={(templateForm.tags || []).join(', ')}
                      onChange={(e) => setTemplateForm(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-8">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={templateForm.isPublic || false}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Template público</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={isEditing ? updateTemplate : createTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isEditing ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de processamento */}
      {showProcessModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Processar Template: {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário de variáveis */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Variáveis</h3>
                  
                  {selectedTemplate.variables.length === 0 ? (
                    <p className="text-gray-500">Este template não possui variáveis.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.name}
                            {variable.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {variable.description && (
                            <p className="text-xs text-gray-500 mb-2">{variable.description}</p>
                          )}
                          
                          {variable.type === 'select' ? (
                            <select
                              value={processVariables[variable.name] || ''}
                              onChange={(e) => setProcessVariables(prev => ({ 
                                ...prev, 
                                [variable.name]: e.target.value 
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Selecione uma opção</option>
                              {variable.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : variable.type === 'textarea' ? (
                            <textarea
                              value={processVariables[variable.name] || ''}
                              onChange={(e) => setProcessVariables(prev => ({ 
                                ...prev, 
                                [variable.name]: e.target.value 
                              }))}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={variable.description}
                            />
                          ) : variable.type === 'boolean' ? (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={processVariables[variable.name] || false}
                                onChange={(e) => setProcessVariables(prev => ({ 
                                  ...prev, 
                                  [variable.name]: e.target.checked 
                                }))}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Sim</span>
                            </label>
                          ) : (
                            <input
                              type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                              value={processVariables[variable.name] || ''}
                              onChange={(e) => {
                                let value: any = e.target.value;
                                if (variable.type === 'number') value = parseFloat(value) || 0;
                                setProcessVariables(prev => ({ 
                                  ...prev, 
                                  [variable.name]: value 
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={variable.description}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    onClick={() => processTemplate(selectedTemplate.id)}
                    className="w-full mt-6 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Processar Template
                  </button>
                </div>

                {/* Resultado */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Resultado</h3>
                  
                  {processedResult ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prompt Processado
                        </label>
                        <textarea
                          value={processedResult.processedPrompt}
                          readOnly
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(processedResult.processedPrompt)}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </button>
                        
                        <button
                          onClick={() => {
                            const blob = new Blob([processedResult.processedPrompt], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedTemplate.name.replace(/\s+/g, '_')}_processed.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Processado em: {new Date(processedResult.processedAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Play className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Preencha as variáveis e clique em "Processar Template"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptTemplateManager;