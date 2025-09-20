import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit,
  Eye,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Image,
  Video,
  Clock,
  Camera,
  Lightbulb,
  Volume2,
  Layers,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Loader,
  FileText,
  Palette,
  Settings,
  BarChart3,
  History,
  Template
} from 'lucide-react';

// Interfaces
interface StoryboardFrame {
  id: string;
  sequence: number;
  title: string;
  description: string;
  visualDescription: string;
  duration: number;
  shotType: 'wide' | 'medium' | 'close-up' | 'extreme-close-up';
  cameraAngle: 'eye-level' | 'high-angle' | 'low-angle' | 'bird-eye' | 'worm-eye';
  lighting: 'natural' | 'studio' | 'dramatic' | 'soft';
  audioNotes: string[];
  visualElements: string[];
  transitions: string;
  imageUrl?: string;
  generatedAt: string;
}

interface Storyboard {
  id: string;
  title: string;
  description: string;
  scriptId: string;
  status: 'draft' | 'in-progress' | 'completed' | 'review';
  frames: StoryboardFrame[];
  style: 'educational' | 'commercial' | 'entertainment';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

interface StoryboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frameTemplates: {
    title: string;
    shotType: string;
    cameraAngle: string;
    lighting: string;
    duration: number;
  }[];
  isActive: boolean;
  createdAt: string;
}

interface GenerationHistory {
  id: string;
  storyboardId: string;
  action: string;
  parameters: any;
  result: string;
  framesGenerated: number;
  processingTime: number;
  createdAt: string;
  userId: number;
}

interface Analytics {
  totalGenerated: number;
  averageFrames: number;
  popularStyles: Record<string, number>;
  averageDuration: number;
  generationTrends: { date: string; count: number }[];
}

const StoryboardGeneration: React.FC = () => {
  // Estados principais
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [templates, setTemplates] = useState<StoryboardTemplate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [styleFilter, setStyleFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'storyboards' | 'templates' | 'history' | 'analytics'>('storyboards');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<StoryboardFrame | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  // Estados de modais
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showFrameModal, setShowFrameModal] = useState(false);
  
  // Estados de formulários
  const [generationForm, setGenerationForm] = useState({
    scriptId: '',
    title: '',
    description: '',
    style: 'educational' as const,
    aspectRatio: '16:9' as const,
    templateId: '',
    options: {
      frameCount: 5,
      averageDuration: 15,
      includeTransitions: true,
      generateImages: false
    }
  });
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    frames: [] as StoryboardFrame[]
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'educational',
    frameTemplates: [] as any[],
    isActive: true
  });
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadStoryboards();
    loadTemplates();
    loadAnalytics();
    loadHistory();
  }, []);
  
  // Funções de carregamento
  const loadStoryboards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/storyboards');
      const data = await response.json();
      setStoryboards(data.storyboards || []);
    } catch (error) {
      setError('Erro ao carregar storyboards');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai/storyboards/templates/list');
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/storyboards/analytics/overview');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };
  
  const loadHistory = async () => {
    try {
      const response = await fetch('/api/ai/storyboards/history/generations');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };
  
  // Funções de geração
  const handleGenerateStoryboard = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch('/api/ai/storyboards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationForm)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar storyboard');
      }
      
      const newStoryboard = await response.json();
      setStoryboards(prev => [newStoryboard, ...prev]);
      setShowGenerationModal(false);
      
      // Reset form
      setGenerationForm({
        scriptId: '',
        title: '',
        description: '',
        style: 'educational',
        aspectRatio: '16:9',
        templateId: '',
        options: {
          frameCount: 5,
          averageDuration: 15,
          includeTransitions: true,
          generateImages: false
        }
      });
      
      // Recarregar dados
      loadAnalytics();
      loadHistory();
    } catch (error) {
      setError('Erro ao gerar storyboard');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleRegenerateFrames = async (storyboardId: string, frameIds: string[]) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/ai/storyboards/${storyboardId}/regenerate-frames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frameIds })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao regenerar frames');
      }
      
      const updatedStoryboard = await response.json();
      setStoryboards(prev => prev.map(s => s.id === storyboardId ? updatedStoryboard : s));
      
      if (selectedStoryboard?.id === storyboardId) {
        setSelectedStoryboard(updatedStoryboard);
      }
    } catch (error) {
      setError('Erro ao regenerar frames');
    } finally {
      setLoading(false);
    }
  };
  
  // Funções de gerenciamento
  const handleUpdateStoryboard = async () => {
    if (!selectedStoryboard) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/ai/storyboards/${selectedStoryboard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar storyboard');
      }
      
      const updatedStoryboard = await response.json();
      setStoryboards(prev => prev.map(s => s.id === selectedStoryboard.id ? updatedStoryboard : s));
      setSelectedStoryboard(updatedStoryboard);
      setShowEditModal(false);
    } catch (error) {
      setError('Erro ao atualizar storyboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteStoryboard = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este storyboard?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/ai/storyboards/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao deletar storyboard');
      }
      
      setStoryboards(prev => prev.filter(s => s.id !== id));
      
      if (selectedStoryboard?.id === id) {
        setSelectedStoryboard(null);
        setShowViewModal(false);
      }
    } catch (error) {
      setError('Erro ao deletar storyboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDuplicateStoryboard = async (id: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/ai/storyboards/${id}/duplicate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao duplicar storyboard');
      }
      
      const duplicatedStoryboard = await response.json();
      setStoryboards(prev => [duplicatedStoryboard, ...prev]);
    } catch (error) {
      setError('Erro ao duplicar storyboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportStoryboard = async (id: string, format: 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/ai/storyboards/${id}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar storyboard');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Erro ao exportar storyboard');
    }
  };
  
  // Funções de template
  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/ai/storyboards/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar template');
      }
      
      const newTemplate = await response.json();
      setTemplates(prev => [newTemplate, ...prev]);
      setShowTemplateModal(false);
      
      // Reset form
      setTemplateForm({
        name: '',
        description: '',
        category: 'educational',
        frameTemplates: [],
        isActive: true
      });
    } catch (error) {
      setError('Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/ai/storyboards/templates/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao deletar template');
      }
      
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      setError('Erro ao deletar template');
    } finally {
      setLoading(false);
    }
  };
  
  // Funções de playback
  const handlePlayStoryboard = () => {
    if (!selectedStoryboard) return;
    
    setIsPlaying(true);
    setCurrentFrameIndex(0);
    
    const playFrame = (index: number) => {
      if (index >= selectedStoryboard.frames.length) {
        setIsPlaying(false);
        return;
      }
      
      setCurrentFrameIndex(index);
      const frame = selectedStoryboard.frames[index];
      const duration = (frame.duration * 1000) / playbackSpeed;
      
      setTimeout(() => {
        if (isPlaying) {
          playFrame(index + 1);
        }
      }, duration);
    };
    
    playFrame(0);
  };
  
  const handlePauseStoryboard = () => {
    setIsPlaying(false);
  };
  
  // Funções de upload
  const handleImageUpload = async (storyboardId: string, frameId: string, file: File) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/ai/storyboards/${storyboardId}/frames/${frameId}/image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }
      
      const result = await response.json();
      
      // Atualizar storyboard
      setStoryboards(prev => prev.map(s => {
        if (s.id === storyboardId) {
          return {
            ...s,
            frames: s.frames.map(f => f.id === frameId ? result.frame : f)
          };
        }
        return s;
      }));
      
      if (selectedStoryboard?.id === storyboardId) {
        setSelectedStoryboard(prev => prev ? {
          ...prev,
          frames: prev.frames.map(f => f.id === frameId ? result.frame : f)
        } : null);
      }
    } catch (error) {
      setError('Erro ao fazer upload da imagem');
    } finally {
      setLoading(false);
    }
  };
  
  // Funções auxiliares
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      review: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };
  
  const getStyleIcon = (style: string) => {
    const icons = {
      educational: FileText,
      commercial: Palette,
      entertainment: Video
    };
    return icons[style as keyof typeof icons] || FileText;
  };
  
  // Filtrar e ordenar storyboards
  const filteredStoryboards = storyboards
    .filter(storyboard => {
      const matchesSearch = storyboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           storyboard.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || storyboard.status === statusFilter;
      const matchesStyle = !styleFilter || storyboard.style === styleFilter;
      
      return matchesSearch && matchesStatus && matchesStyle;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Storyboard];
      const bValue = b[sortBy as keyof Storyboard];
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Video className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Geração de Storyboards</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowGenerationModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar Storyboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estatísticas rápidas */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gerados</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalGenerated}</p>
                </div>
                <Video className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Média de Frames</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageFrames}</p>
                </div>
                <Layers className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Duração Média</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageDuration)}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estilo Popular</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {Object.entries(analytics.popularStyles).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </p>
                </div>
                <Palette className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação por abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
      
      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'storyboards' && (
          <div className="space-y-6">
            {/* Filtros e busca */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar storyboards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os status</option>
                  <option value="draft">Rascunho</option>
                  <option value="in-progress">Em progresso</option>
                  <option value="completed">Concluído</option>
                  <option value="review">Em revisão</option>
                </select>
                
                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os estilos</option>
                  <option value="educational">Educacional</option>
                  <option value="commercial">Comercial</option>
                  <option value="entertainment">Entretenimento</option>
                </select>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
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
                    <label htmlFor="includeTransitions" className="ml-2 block text-sm text-gray-700">
                      Incluir transições entre frames
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="generateImages"
                      checked={generationForm.options.generateImages}
                      onChange={(e) => setGenerationForm(prev => ({
                        ...prev,
                        options: { ...prev.options, generateImages: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="generateImages" className="ml-2 block text-sm text-gray-700">
                      Gerar imagens automaticamente
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowGenerationModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!generationForm.scriptId || !generationForm.title || isGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Storyboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardGeneration;