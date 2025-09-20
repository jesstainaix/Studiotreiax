import React, { useState, useEffect } from 'react';
import {
  Video, Plus, Search, Filter, Grid, List, Eye, Edit, Trash2, Copy, Download,
  Upload, Play, Pause, ChevronLeft, ChevronRight, Clock, Camera, Palette,
  Layers, Wand2, Template, History, X, BarChart3
} from 'lucide-react';

// Interfaces
interface StoryboardFrame {
  id: string;
  title: string;
  description: string;
  duration: number; // em segundos
  sceneType: 'intro' | 'main' | 'transition' | 'outro';
  cameraAngle: 'close-up' | 'medium' | 'wide' | 'aerial' | 'low-angle' | 'high-angle';
  lighting: 'natural' | 'studio' | 'dramatic' | 'soft' | 'bright';
  transition: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom';
  visualElements: string[];
  imageUrl?: string;
  notes?: string;
}

interface Storyboard {
  id: string;
  title: string;
  description: string;
  scriptId?: string;
  templateId?: string;
  style: 'educational' | 'commercial' | 'entertainment';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  frames: StoryboardFrame[];
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface StoryboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frameTemplates: {
    title: string;
    description: string;
    duration: number;
    sceneType: StoryboardFrame['sceneType'];
    cameraAngle: StoryboardFrame['cameraAngle'];
    lighting: StoryboardFrame['lighting'];
  }[];
  isActive: boolean;
  createdAt: string;
}

interface GenerationHistory {
  id: string;
  action: 'generate' | 'regenerate_frame' | 'update' | 'duplicate';
  storyboardId: string;
  result: 'success' | 'error';
  framesGenerated: number;
  processingTime: number;
  createdAt: string;
}

interface StoryboardAnalytics {
  totalGenerated: number;
  averageFrames: number;
  averageDuration: number;
  popularStyles: Record<string, number>;
  generationTrends: { date: string; count: number }[];
  successRate: number;
}

interface GenerationForm {
  scriptId: string;
  templateId: string;
  title: string;
  description: string;
  style: Storyboard['style'];
  aspectRatio: Storyboard['aspectRatio'];
  options: {
    frameCount: number;
    averageDuration: number;
    includeTransitions: boolean;
    generateImages: boolean;
  };
}

interface EditForm {
  title: string;
  description: string;
  frames: StoryboardFrame[];
}

interface TemplateForm {
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

const StoryboardGeneration: React.FC = () => {
  // Estados principais
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [templates, setTemplates] = useState<StoryboardTemplate[]>([]);
  const [analytics, setAnalytics] = useState<StoryboardAnalytics | null>(null);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'storyboards' | 'templates' | 'history' | 'analytics'>('storyboards');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Estados de modais
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Estados de formulários
  const [generationForm, setGenerationForm] = useState<GenerationForm>({
    scriptId: '',
    templateId: '',
    title: '',
    description: '',
    style: 'educational',
    aspectRatio: '16:9',
    options: {
      frameCount: 8,
      averageDuration: 15,
      includeTransitions: true,
      generateImages: false
    }
  });
  
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    description: '',
    frames: []
  });
  
  const [templateForm, setTemplateForm] = useState<TemplateForm>({
    name: '',
    description: '',
    category: 'educational',
    isActive: true
  });
  
  // Estados de visualização
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadStoryboards();
    loadTemplates();
    loadHistory();
    loadAnalytics();
  }, []);
  
  // Playback automático
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedStoryboard) {
      interval = setInterval(() => {
        setCurrentFrame(prev => {
          const nextFrame = prev + 1;
          if (nextFrame >= selectedStoryboard.frames.length) {
            setIsPlaying(false);
            return 0;
          }
          return nextFrame;
        });
      }, selectedStoryboard.frames[currentFrame]?.duration * 1000 || 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentFrame, selectedStoryboard]);
  
  // Métodos de carregamento
  const loadStoryboards = async () => {
    try {
      const response = await fetch('/api/ai/storyboards');
      const data = await response.json();
      setStoryboards(data.storyboards || []);
    } catch (error) {
      console.error('Erro ao carregar storyboards:', error);
      setError('Erro ao carregar storyboards');
    }
  };
  
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai/storyboards/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };
  
  const loadHistory = async () => {
    try {
      const response = await fetch('/api/ai/storyboards/history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/storyboards/analytics');
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };
  
  // Métodos de geração
  const handleGenerateStoryboard = async () => {
    if (!generationForm.title || !generationForm.description) {
      setError('Título e descrição são obrigatórios');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/storyboards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        await loadHistory();
        await loadAnalytics();
        setShowGenerationModal(false);
        setGenerationForm({
          scriptId: '',
          templateId: '',
          title: '',
          description: '',
          style: 'educational',
          aspectRatio: '16:9',
          options: {
            frameCount: 8,
            averageDuration: 15,
            includeTransitions: true,
            generateImages: false
          }
        });
      } else {
        setError(data.message || 'Erro ao gerar storyboard');
      }
    } catch (error) {
      console.error('Erro ao gerar storyboard:', error);
      setError('Erro ao gerar storyboard');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRegenerateFrame = async (storyboardId: string, frameIndex: number) => {
    try {
      const response = await fetch(`/api/ai/storyboards/${storyboardId}/frames/${frameIndex}/regenerate`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        await loadHistory();
        // Atualizar storyboard selecionado se necessário
        if (selectedStoryboard?.id === storyboardId) {
          const updatedStoryboard = storyboards.find(s => s.id === storyboardId);
          if (updatedStoryboard) {
            setSelectedStoryboard(updatedStoryboard);
          }
        }
      } else {
        setError(data.message || 'Erro ao regenerar frame');
      }
    } catch (error) {
      console.error('Erro ao regenerar frame:', error);
      setError('Erro ao regenerar frame');
    }
  };
  
  // Métodos de gerenciamento
  const handleUpdateStoryboard = async () => {
    if (!selectedStoryboard) return;
    
    try {
      const response = await fetch(`/api/ai/storyboards/${selectedStoryboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        setShowEditModal(false);
        setSelectedStoryboard(null);
      } else {
        setError(data.message || 'Erro ao atualizar storyboard');
      }
    } catch (error) {
      console.error('Erro ao atualizar storyboard:', error);
      setError('Erro ao atualizar storyboard');
    }
  };
  
  const handleDeleteStoryboard = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este storyboard?')) return;
    
    try {
      const response = await fetch(`/api/ai/storyboards/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        await loadAnalytics();
        if (selectedStoryboard?.id === id) {
          setSelectedStoryboard(null);
          setShowViewModal(false);
        }
      } else {
        setError(data.message || 'Erro ao deletar storyboard');
      }
    } catch (error) {
      console.error('Erro ao deletar storyboard:', error);
      setError('Erro ao deletar storyboard');
    }
  };
  
  const handleDuplicateStoryboard = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/storyboards/${id}/duplicate`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        await loadHistory();
      } else {
        setError(data.message || 'Erro ao duplicar storyboard');
      }
    } catch (error) {
      console.error('Erro ao duplicar storyboard:', error);
      setError('Erro ao duplicar storyboard');
    }
  };
  
  const handleExportStoryboard = async (id: string, format: 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/ai/storyboards/${id}/export?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyboard-${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Erro ao exportar storyboard');
      }
    } catch (error) {
      console.error('Erro ao exportar storyboard:', error);
      setError('Erro ao exportar storyboard');
    }
  };
  
  // Métodos de template
  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.description) {
      setError('Nome e descrição são obrigatórios');
      return;
    }
    
    try {
      const response = await fetch('/api/ai/storyboards/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
        setShowTemplateModal(false);
        setTemplateForm({
          name: '',
          description: '',
          category: 'educational',
          isActive: true
        });
      } else {
        setError(data.message || 'Erro ao criar template');
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      setError('Erro ao criar template');
    }
  };
  
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;
    
    try {
      const response = await fetch(`/api/ai/storyboards/templates/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
      } else {
        setError(data.message || 'Erro ao deletar template');
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      setError('Erro ao deletar template');
    }
  };
  
  // Métodos de upload
  const handleUploadImage = async (storyboardId: string, frameIndex: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`/api/ai/storyboards/${storyboardId}/frames/${frameIndex}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        // Atualizar storyboard selecionado se necessário
        if (selectedStoryboard?.id === storyboardId) {
          const updatedStoryboard = storyboards.find(s => s.id === storyboardId);
          if (updatedStoryboard) {
            setSelectedStoryboard(updatedStoryboard);
          }
        }
      } else {
        setError(data.message || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setError('Erro ao fazer upload da imagem');
    }
  };
  
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/ai/storyboards/import', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadStoryboards();
        setShowImportModal(false);
      } else {
        setError(data.message || 'Erro ao importar arquivo');
      }
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      setError('Erro ao importar arquivo');
    }
  };
  
  // Métodos auxiliares
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getStatusColor = (status: Storyboard['status']): string => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || colors.draft;
  };
  
  const getStyleIcon = (style: Storyboard['style']) => {
    const icons = {
      educational: BarChart3,
      commercial: Video,
      entertainment: Play
    };
    return icons[style] || Video;
  };
  
  // Filtros
  const filteredStoryboards = storyboards.filter(storyboard => {
    const matchesSearch = storyboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         storyboard.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || storyboard.status === statusFilter;
    const matchesStyle = styleFilter === 'all' || storyboard.style === styleFilter;
    
    return matchesSearch && matchesStatus && matchesStyle;
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geração de Storyboards</h1>
          <p className="text-gray-600 mt-2">Crie storyboards inteligentes com IA baseados em roteiros</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importar</span>
          </button>
          <button
            onClick={() => setShowGenerationModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Storyboard</span>
          </button>
        </div>
      </div>
      
      {/* Estatísticas rápidas */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Storyboards</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalGenerated}</p>
              </div>
              <Video className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média de Frames</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageFrames.toFixed(1)}</p>
              </div>
              <Layers className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duração Média</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">{(analytics.successRate * 100).toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação por abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'storyboards', label: 'Storyboards', icon: Video },
            { id: 'templates', label: 'Templates', icon: Template },
            { id: 'history', label: 'Histórico', icon: History },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
      
      {/* Conteúdo das abas */}
      <div className="space-y-6">
        {activeTab === 'storyboards' && (
          <div className="space-y-6">
            {/* Filtros e busca */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar storyboards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os status</option>
                    <option value="draft">Rascunho</option>
                    <option value="in_progress">Em progresso</option>
                    <option value="completed">Concluído</option>
                    <option value="approved">Aprovado</option>
                  </select>
                  
                  <select
                    value={styleFilter}
                    onChange={(e) => setStyleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os estilos</option>
                    <option value="educational">Educacional</option>
                    <option value="commercial">Comercial</option>
                    <option value="entertainment">Entretenimento</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Lista de storyboards */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStoryboards.map(storyboard => {
                  const StyleIcon = getStyleIcon(storyboard.style);
                  return (
                    <div key={storyboard.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <StyleIcon className="w-5 h-5 text-gray-600" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(storyboard.status)}`}>
                              {storyboard.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedStoryboard(storyboard);
                                setCurrentFrame(0);
                                setShowViewModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStoryboard(storyboard);
                                setEditForm({
                                  title: storyboard.title,
                                  description: storyboard.description,
                                  frames: storyboard.frames
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateStoryboard(storyboard.id)}
                              className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                              title="Duplicar"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStoryboard(storyboard.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{storyboard.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{storyboard.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Layers className="w-4 h-4" />
                            <span>{storyboard.frames.length} frames</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(storyboard.totalDuration)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Camera className="w-4 h-4" />
                            <span>{storyboard.aspectRatio}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Palette className="w-4 h-4" />
                            <span className="capitalize">{storyboard.style}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Atualizado {new Date(storyboard.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleExportStoryboard(storyboard.id, 'json')}
                              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Exportar JSON
                            </button>
                            <button
                              onClick={() => handleExportStoryboard(storyboard.id, 'pdf')}
                              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Exportar PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storyboard</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estilo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frames</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atualizado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStoryboards.map(storyboard => {
                        const StyleIcon = getStyleIcon(storyboard.style);
                        return (
                          <tr key={storyboard.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <StyleIcon className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{storyboard.title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{storyboard.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(storyboard.status)}`}>
                                {storyboard.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {storyboard.style}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {storyboard.frames.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(storyboard.totalDuration)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(storyboard.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedStoryboard(storyboard);
                                    setShowViewModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStoryboard(storyboard);
                                    setEditForm({
                                      title: storyboard.title,
                                      description: storyboard.description,
                                      frames: storyboard.frames
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateStoryboard(storyboard.id)}
                                  className="text-purple-600 hover:text-purple-900 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStoryboard(storyboard.id)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {filteredStoryboards.length === 0 && (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum storyboard encontrado</h3>
                <p className="text-gray-500 mb-6">Comece gerando seu primeiro storyboard com IA.</p>
                <button
                  onClick={() => setShowGenerationModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gerar Storyboard</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Templates de Storyboard</h2>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Template</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Template className="w-5 h-5 text-gray-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Categoria:</span>
                      <span className="font-medium capitalize">{template.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Frames:</span>
                      <span className="font-medium">{template.frameTemplates.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Criado:</span>
                      <span className="font-medium">{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {templates.length === 0 && (
              <div className="text-center py-12">
                <Template className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
                <p className="text-gray-500 mb-6">Crie templates para agilizar a geração de storyboards.</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Template</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Histórico de Gerações</h2>
            
            <div className="bg-white rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storyboard</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frames</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {item.action.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.storyboardId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.result}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.framesGenerated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(item.processingTime / 1000).toFixed(1)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {history.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico encontrado</h3>
                <p className="text-gray-500">O histórico de gerações aparecerá aqui.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Analytics de Storyboards</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estilos Populares</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.popularStyles).map(([style, count]) => (
                    <div key={style} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{style}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalGenerated) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências de Geração</h3>
                <div className="space-y-3">
                  {analytics.generationTrends.slice(-7).map(trend => (
                    <div key={trend.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(trend.date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">{trend.count} gerações</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de geração */}
      {showGenerationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Gerar Novo Storyboard</h2>
              <button
                onClick={() => setShowGenerationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID do Roteiro</label>
                  <input
                    type="text"
                    value={generationForm.scriptId}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, scriptId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ID do roteiro base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={generationForm.templateId}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um template (opcional)</option>
                    {templates.filter(t => t.isActive).map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={generationForm.title}
                  onChange={(e) => setGenerationForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título do storyboard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={generationForm.description}
                  onChange={(e) => setGenerationForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o storyboard"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                  <select
                    value={generationForm.style}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, style: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="educational">Educacional</option>
                    <option value="commercial">Comercial</option>
                    <option value="entertainment">Entretenimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proporção</label>
                  <select
                    value={generationForm.aspectRatio}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="16:9">16:9 (Paisagem)</option>
                    <option value="9:16">9:16 (Retrato)</option>
                    <option value="1:1">1:1 (Quadrado)</option>
                    <option value="4:3">4:3 (Clássico)</option>
                  </select>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Opções Avançadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Frames</label>
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={generationForm.options.frameCount}
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        options: { ...prev.options, frameCount: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duração Média (segundos)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={generationForm.options.averageDuration}
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        options: { ...prev.options, averageDuration: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeTransitions"
                      checked={generationForm.options.includeTransitions}
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        options: { ...prev.options, includeTransitions: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="generateImages" className="ml-2 block text-sm text-gray-700">
                      Gerar imagens automaticamente com IA
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowGenerationModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateStoryboard}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Gerando...' : 'Gerar Storyboard'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de erro */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Overlay de loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Carregando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardGeneration;