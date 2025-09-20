import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Copy, 
  Edit3, 
  Trash2, 
  Star, 
  Play, 
  Save, 
  X, 
  AlertCircle,
  FileText,
  Tag,
  Users,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';

// Interfaces
interface TemplateVariable {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean';
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: any;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  version: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface TemplateType {
  id: string;
  name: string;
  description: string;
}

interface Analytics {
  totalTemplates: number;
  totalUsage: number;
  averageRating: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    action: string;
    templateId: string;
    timestamp: Date;
  }>;
}

interface ProcessedTemplate {
  originalTemplate: Template;
  processedContent: string;
  variables: Record<string, any>;
  processedAt: Date;
}

const PromptTemplates: React.FC = () => {
  // Estados principais
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Estados de formulários
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedTemplate | null>(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    type: '',
    content: '',
    variables: [] as TemplateVariable[],
    tags: [] as string[],
    isPublic: false
  });
  
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [newTag, setNewTag] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadTemplateTypes();
    loadAnalytics();
  }, []);
  
  // Carregar templates com filtros
  useEffect(() => {
    loadTemplates();
  }, [searchTerm, selectedCategory, selectedType, selectedTags, showPublicOnly, sortBy, sortOrder]);
  
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (showPublicOnly) params.append('isPublic', 'true');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/ai/templates?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates);
      } else {
        setError(data.error || 'Erro ao carregar templates');
      }
    } catch (error) {
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/ai/templates/meta/categories');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };
  
  const loadTemplateTypes = async () => {
    try {
      const response = await fetch('/api/ai/templates/meta/types');
      const data = await response.json();
      
      if (response.ok) {
        setTemplateTypes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/templates/meta/analytics');
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };
  
  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(prev => [data, ...prev]);
        setShowCreateModal(false);
        resetTemplateForm();
        loadAnalytics();
      } else {
        setError(data.error || 'Erro ao criar template');
      }
    } catch (error) {
      setError('Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? data : t));
        setShowEditModal(false);
        setEditingTemplate(null);
        resetTemplateForm();
      } else {
        setError(data.error || 'Erro ao atualizar template');
      }
    } catch (error) {
      setError('Erro ao atualizar template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        loadAnalytics();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao deletar template');
      }
    } catch (error) {
      setError('Erro ao deletar template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProcessTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/templates/${selectedTemplate.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: variableValues })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProcessedResult(data);
        loadTemplates(); // Recarregar para atualizar contador de uso
      } else {
        setError(data.error || 'Erro ao processar template');
      }
    } catch (error) {
      setError('Erro ao processar template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(prev => [data, ...prev]);
        loadAnalytics();
      } else {
        setError(data.error || 'Erro ao duplicar template');
      }
    } catch (error) {
      setError('Erro ao duplicar template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRateTemplate = async (templateId: string, rating: number) => {
    try {
      const response = await fetch(`/api/ai/templates/${templateId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      
      if (response.ok) {
        loadTemplates();
        loadAnalytics();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao avaliar template');
      }
    } catch (error) {
      setError('Erro ao avaliar template');
    }
  };
  
  const handleExportTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/ai/templates/export/${templateId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${templateId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao exportar template');
      }
    } catch (error) {
      setError('Erro ao exportar template');
    }
  };
  
  const handleImportTemplate = async () => {
    if (!importFile) return;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/ai/templates/import', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(prev => [data, ...prev]);
        setShowImportModal(false);
        setImportFile(null);
        loadAnalytics();
      } else {
        setError(data.error || 'Erro ao importar template');
      }
    } catch (error) {
      setError('Erro ao importar template');
    } finally {
      setLoading(false);
    }
  };
  
  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      type: '',
      content: '',
      variables: [],
      tags: [],
      isPublic: false
    });
  };
  
  const addVariable = () => {
    setTemplateForm(prev => ({
      ...prev,
      variables: [...prev.variables, {
        name: '',
        type: 'text',
        required: false,
        description: ''
      }]
    }));
  };
  
  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    setTemplateForm(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };
  
  const removeVariable = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };
  
  const addTag = () => {
    if (newTag.trim() && !templateForm.tags.includes(newTag.trim())) {
      setTemplateForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };
  
  const renderStarRating = (rating: number, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onRate?.(star)}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${
              onRate ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'
            }`}
            disabled={!onRate}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Prompts</h1>
          <p className="text-gray-600 mt-1">Gerencie e utilize templates personalizáveis para IA</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Template
          </button>
        </div>
      </div>
      
      {/* Estatísticas rápidas */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Templates</p>
                <p className="text-xl font-semibold text-gray-900">{analytics.totalTemplates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Usos</p>
                <p className="text-xl font-semibold text-gray-900">{analytics.totalUsage}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avaliação Média</p>
                <p className="text-xl font-semibold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoria Top</p>
                <p className="text-xl font-semibold text-gray-900">
                  {analytics.topCategories[0]?.category || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação por abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Conteúdo das abas */}
      {activeTab === 'templates' && (
        <div>
          {/* Filtros e busca */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
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
                    placeholder="Buscar templates..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  {templateTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="updatedAt-desc">Mais recentes</option>
                  <option value="updatedAt-asc">Mais antigos</option>
                  <option value="name-asc">Nome (A-Z)</option>
                  <option value="name-desc">Nome (Z-A)</option>
                  <option value="usageCount-desc">Mais usados</option>
                  <option value="rating-desc">Melhor avaliados</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPublicOnly}
                  onChange={(e) => setShowPublicOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Apenas públicos</span>
              </label>
            </div>
          </div>
          
          {/* Lista de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {categories.find(c => c.id === template.category)?.name || template.category}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {templateTypes.find(t => t.id === template.type)?.name || template.type}
                      </span>
                      {template.isPublic && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Público
                        </span>
                      )}
                    </div>
                    
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map(tag => (
                          <span key={tag} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{template.usageCount} usos</span>
                      <span>v{template.version}</span>
                    </div>
                    
                    {renderStarRating(template.rating, (rating) => handleRateTemplate(template.id, rating))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setVariableValues({});
                      setProcessedResult(null);
                      setShowProcessModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Usar
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setTemplateForm({
                        name: template.name,
                        description: template.description,
                        category: template.category,
                        type: template.type,
                        content: template.content,
                        variables: template.variables,
                        tags: template.tags,
                        isPublic: template.isPublic
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDuplicateTemplate(template.id)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleExportTemplate(template.id)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Exportar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {templates.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-600 mb-4">Crie seu primeiro template ou ajuste os filtros de busca.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Template
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Categorias mais populares */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias Mais Populares</h3>
            <div className="space-y-3">
              {analytics.topCategories.map(item => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {categories.find(c => c.id === item.category)?.name || item.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Atividade recente */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 10).map((activity, index) => {
                const template = templates.find(t => t.id === activity.templateId);
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action === 'template_created' && 'Template criado'}
                        {activity.action === 'template_updated' && 'Template atualizado'}
                        {activity.action === 'template_used' && 'Template usado'}
                        {activity.action === 'template_deleted' && 'Template deletado'}
                        {activity.action === 'template_duplicated' && 'Template duplicado'}
                        {activity.action === 'template_imported' && 'Template importado'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {template ? `${template.name} - ${new Date(activity.timestamp).toLocaleString()}` : 'Template não encontrado'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Importar Template</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo JSON
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione um arquivo JSON com a estrutura de template válida.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportTemplate}
                  disabled={!importFile || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificações de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Overlay de loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

export default PromptTemplates;