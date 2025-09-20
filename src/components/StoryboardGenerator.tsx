import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Image, 
  Settings, 
  BarChart3, 
  FileText, 
  Palette, 
  Clock, 
  Star,
  Eye,
  Camera,
  Layers,
  Zap,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { cachedFetch } from '../services/apiCacheService';

// Interfaces
interface VisualElements {
  composition: string;
  lighting: string;
  colors: string[];
  style: string;
}

interface CameraMovement {
  type: 'static' | 'pan' | 'zoom' | 'tilt';
  angle: string;
  distance: string;
}

interface Transitions {
  in: string;
  out: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  generatedAt: string;
}

interface Frame {
  id: string;
  sequence: number;
  title: string;
  description: string;
  duration: number;
  visualElements: VisualElements;
  cameraMovement: CameraMovement;
  audioNotes: string;
  textOverlay: string;
  transitions: Transitions;
  generatedImage: GeneratedImage | null;
  annotations: string[];
}

interface StoryboardStyle {
  visualStyle: string;
  colorPalette: string[];
  mood: string;
  aspectRatio: string;
}

interface StoryboardMetadata {
  totalDuration: number;
  frameCount: number;
  targetAudience: string;
  language: string;
  generatedAt: string;
  importedFrom?: string;
}

interface GenerationParams {
  model: string;
  imageModel: string;
  temperature: number;
  stylePrompts: string[];
}

interface StoryboardAnalytics {
  views: number;
  downloads: number;
  rating: number;
  feedback: string[];
}

interface Storyboard {
  id: string;
  title: string;
  description: string;
  scriptId: string | null;
  frames: Frame[];
  style: StoryboardStyle;
  metadata: StoryboardMetadata;
  generationParams: GenerationParams;
  status: 'draft' | 'generating' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  userId: string;
  analytics: StoryboardAnalytics;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  frames: Partial<Frame>[];
  style: StoryboardStyle;
  usage: number;
  isPublic: boolean;
  createdAt: string;
}

interface VisualStyle {
  id: string;
  name: string;
  description: string;
}

interface Analytics {
  totalStoryboards: number;
  totalGenerated: number;
  averageRating: number;
  popularStyles: { style: string; count: number; percentage: number }[];
  monthlyStats: { month: string; generated: number; rating: number }[];
  modelUsage: { model: string; usage: number; cost: number }[];
}

const StoryboardGenerator: React.FC = () => {
  // Estados
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [visualStyles, setVisualStyles] = useState<VisualStyle[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI
  const [activeTab, setActiveTab] = useState<'storyboards' | 'templates' | 'analytics'>('storyboards');
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFrame, setPreviewFrame] = useState<Frame | null>(null);
  
  // Formulários
  const [generateForm, setGenerateForm] = useState({
    title: '',
    scriptId: '',
    textContent: '',
    style: {
      visualStyle: 'modern',
      colorPalette: ['#1e40af', '#ffffff', '#f3f4f6'],
      mood: 'professional',
      aspectRatio: '16:9'
    },
    options: {
      targetAudience: '',
      language: 'pt-BR',
      model: 'gpt-4',
      imageModel: 'dall-e-3',
      temperature: 0.7,
      stylePrompts: []
    }
  });
  
  const [importForm, setImportForm] = useState({
    title: '',
    file: null as File | null,
    style: {
      visualStyle: 'imported',
      colorPalette: ['#1e40af', '#ffffff', '#f3f4f6'],
      mood: 'neutral',
      aspectRatio: '16:9'
    }
  });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Métodos
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStoryboards(),
        loadTemplates(),
        loadVisualStyles(),
        loadAnalytics()
      ]);
    } catch (err) {
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };
  
  const loadStoryboards = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        style: styleFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      
      const response = await cachedFetch(`/api/ai/storyboards/storyboards?${params}`, {}, 2 * 60 * 1000); // Cache por 2 minutos
      const data = await response.json();
      
      if (response.ok) {
        setStoryboards(data.storyboards);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar storyboards');
    }
  };
  
  const loadTemplates = async () => {
    try {
      const response = await cachedFetch('/api/ai/storyboards/templates', {}, 10 * 60 * 1000); // Cache por 10 minutos
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar templates');
    }
  };
  
  const loadVisualStyles = async () => {
    try {
      const response = await cachedFetch('/api/ai/storyboards/styles', {}, 10 * 60 * 1000); // Cache por 10 minutos
      const data = await response.json();
      
      if (response.ok) {
        setVisualStyles(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar estilos visuais');
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await cachedFetch('/api/ai/storyboards/analytics', {}, 1 * 60 * 1000); // Cache por 1 minuto
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar analytics');
    }
  };
  
  const generateStoryboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/storyboards/storyboards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generateForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStoryboards(prev => [data, ...prev]);
        setShowGenerateModal(false);
        setGenerateForm({
          title: '',
          scriptId: '',
          textContent: '',
          style: {
            visualStyle: 'modern',
            colorPalette: ['#1e40af', '#ffffff', '#f3f4f6'],
            mood: 'professional',
            aspectRatio: '16:9'
          },
          options: {
            targetAudience: '',
            language: 'pt-BR',
            model: 'gpt-4',
            imageModel: 'dall-e-3',
            temperature: 0.7,
            stylePrompts: []
          }
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao gerar storyboard');
    } finally {
      setLoading(false);
    }
  };
  
  const importStoryboard = async () => {
    if (!importForm.file) {
      setError('Selecione um arquivo para importar');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importForm.file);
      formData.append('title', importForm.title);
      formData.append('style', JSON.stringify(importForm.style));
      
      const response = await fetch('/api/ai/storyboards/storyboards/import', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStoryboards(prev => [data, ...prev]);
        setShowImportModal(false);
        setImportForm({
          title: '',
          file: null,
          style: {
            visualStyle: 'imported',
            colorPalette: ['#1e40af', '#ffffff', '#f3f4f6'],
            mood: 'neutral',
            aspectRatio: '16:9'
          }
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao importar storyboard');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteStoryboard = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este storyboard?')) return;
    
    try {
      const response = await fetch(`/api/ai/storyboards/storyboards/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setStoryboards(prev => prev.filter(sb => sb.id !== id));
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao deletar storyboard');
    }
  };
  
  const duplicateStoryboard = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/storyboards/storyboards/${id}/duplicate`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStoryboards(prev => [data, ...prev]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao duplicar storyboard');
    }
  };
  
  const optimizeStoryboard = async (id: string, optimizations: string[]) => {
    try {
      const response = await fetch(`/api/ai/storyboards/storyboards/${id}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optimizations })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStoryboards(prev => prev.map(sb => sb.id === id ? data : sb));
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao otimizar storyboard');
    }
  };
  
  const exportStoryboard = async (id: string, format: string) => {
    try {
      const response = await fetch(`/api/ai/storyboards/storyboards/${id}/export?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyboard_${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao exportar storyboard');
    }
  };
  
  const generateFrameImage = async (storyboardId: string, frameId: string) => {
    try {
      const response = await fetch(`/api/ai/storyboards/storyboards/${storyboardId}/frames/${frameId}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ style: {} })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStoryboards(prev => prev.map(sb => {
          if (sb.id === storyboardId) {
            return {
              ...sb,
              frames: sb.frames.map(frame => 
                frame.id === frameId 
                  ? { ...frame, generatedImage: data.generatedImage }
                  : frame
              )
            };
          }
          return sb;
        }));
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao gerar imagem do frame');
    }
  };
  
  const rateStoryboard = async (id: string, rating: number, feedback?: string) => {
    try {
      const response = await fetch(`/api/ai/storyboards/storyboards/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, feedback })
      });
      
      if (response.ok) {
        setStoryboards(prev => prev.map(sb => 
          sb.id === id 
            ? { ...sb, analytics: { ...sb.analytics, rating } }
            : sb
        ));
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError('Erro ao avaliar storyboard');
    }
  };
  
  const previewFrame = (frame: Frame) => {
    setPreviewFrame(frame);
    setShowPreviewModal(true);
  };
  
  // Effects
  useEffect(() => {
    loadInitialData();
  }, []);
  
  useEffect(() => {
    loadStoryboards();
  }, [currentPage, searchTerm, styleFilter, statusFilter, sortBy, sortOrder]);
  
  // Render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Layers className="text-blue-600" />
              Gerador de Storyboards
            </h1>
            <p className="text-gray-600 mt-2">
              Crie storyboards inteligentes baseados em texto com IA
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload size={20} />
              Importar
            </button>
            
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Gerar Storyboard
            </button>
          </div>
        </div>
        
        {/* Estatísticas rápidas */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total de Storyboards</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalStoryboards}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <Zap className="text-green-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Gerados com IA</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalGenerated}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <Star className="text-yellow-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Avaliação Média</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <Palette className="text-purple-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Estilo Popular</p>
                  <p className="text-lg font-bold text-gray-900">
                    {analytics.popularStyles[0]?.style || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navegação por abas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('storyboards')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'storyboards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                Storyboards
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers size={16} />
                Templates
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
                <BarChart3 size={16} />
                Analytics
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      {/* Conteúdo das abas */}
      {activeTab === 'storyboards' && (
        <div>
          {/* Filtros e busca */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar storyboards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os estilos</option>
                {visualStyles.map(style => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="generating">Gerando</option>
                <option value="completed">Concluído</option>
                <option value="error">Erro</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Data de criação</option>
                <option value="updatedAt">Última atualização</option>
                <option value="title">Título</option>
                <option value="analytics.rating">Avaliação</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
          
          {/* Lista de storyboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {storyboards.map(storyboard => (
              <div key={storyboard.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{storyboard.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{storyboard.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {Math.floor(storyboard.metadata.totalDuration / 60)}:{(storyboard.metadata.totalDuration % 60).toString().padStart(2, '0')}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Layers size={14} />
                          {storyboard.metadata.frameCount} frames
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Star size={14} />
                          {storyboard.analytics.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      storyboard.status === 'completed' ? 'bg-green-100 text-green-800' :
                      storyboard.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                      storyboard.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {storyboard.status === 'completed' ? 'Concluído' :
                       storyboard.status === 'generating' ? 'Gerando' :
                       storyboard.status === 'draft' ? 'Rascunho' : 'Erro'}
                    </div>
                  </div>
                  
                  {/* Preview dos frames */}
                  <div className="mb-4">
                    <div className="grid grid-cols-4 gap-2">
                      {storyboard.frames.slice(0, 4).map(frame => (
                        <div
                          key={frame.id}
                          className="aspect-video bg-gray-100 rounded border cursor-pointer hover:bg-gray-200 transition-colors flex items-center justify-center"
                          onClick={() => previewFrame(frame)}
                        >
                          {frame.generatedImage ? (
                            <img
                              src={frame.generatedImage.url}
                              alt={frame.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="text-center">
                              <Image size={16} className="text-gray-400 mx-auto mb-1" />
                              <span className="text-xs text-gray-500">{frame.sequence}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStoryboard(storyboard)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                      
                      <button
                        onClick={() => duplicateStoryboard(storyboard.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Copy size={14} />
                        Duplicar
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportStoryboard(storyboard.id, 'pdf')}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Exportar PDF"
                      >
                        <Download size={16} />
                      </button>
                      
                      <button
                        onClick={() => optimizeStoryboard(storyboard.id, ['visual_enhancement', 'timing_adjustment'])}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Otimizar"
                      >
                        <Zap size={16} />
                      </button>
                      
                      <button
                        onClick={() => deleteStoryboard(storyboard.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'templates' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {template.category}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          {template.usage} usos
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {template.frames.slice(0, 3).map((frame, index) => (
                        <div
                          key={index}
                          className="aspect-video bg-gray-100 rounded border flex items-center justify-center"
                        >
                          <div className="text-center">
                            <Layers size={16} className="text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-500">{index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setGenerateForm(prev => ({
                        ...prev,
                        style: template.style
                      }));
                      setShowGenerateModal(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          {/* Estatísticas gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Mensais</h3>
              <div className="space-y-3">
                {analytics.monthlyStats.map(stat => (
                  <div key={stat.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{stat.month}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{stat.generated} gerados</div>
                      <div className="text-xs text-gray-500">★ {stat.rating.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estilos Populares</h3>
              <div className="space-y-3">
                {analytics.popularStyles.map(style => (
                  <div key={style.style} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{style.style}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{style.count}</div>
                      <div className="text-xs text-gray-500">{style.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Modelos</h3>
              <div className="space-y-3">
                {analytics.modelUsage.map(model => (
                  <div key={model.model} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{model.model}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{model.usage} usos</div>
                      <div className="text-xs text-gray-500">${model.cost.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de geração */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Gerar Storyboard</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={generateForm.title}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o título do storyboard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Script (opcional)
                </label>
                <input
                  type="text"
                  value={generateForm.scriptId}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, scriptId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ID do script existente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo de Texto *
                </label>
                <textarea
                  value={generateForm.textContent}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, textContent: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o texto base para gerar o storyboard"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo Visual
                  </label>
                  <select
                    value={generateForm.style.visualStyle}
                    onChange={(e) => setGenerateForm(prev => ({
                      ...prev,
                      style: { ...prev.style, visualStyle: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {visualStyles.map(style => (
                      <option key={style.id} value={style.id}>{style.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Humor/Tom
                  </label>
                  <select
                    value={generateForm.style.mood}
                    onChange={(e) => setGenerateForm(prev => ({
                      ...prev,
                      style: { ...prev.style, mood: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="professional">Profissional</option>
                    <option value="creative">Criativo</option>
                    <option value="friendly">Amigável</option>
                    <option value="serious">Sério</option>
                    <option value="playful">Divertido</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Público-alvo
                  </label>
                  <input
                    type="text"
                    value={generateForm.options.targetAudience}
                    onChange={(e) => setGenerateForm(prev => ({
                      ...prev,
                      options: { ...prev.options, targetAudience: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Empresários, Jovens, Famílias"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select
                    value={generateForm.options.language}
                    onChange={(e) => setGenerateForm(prev => ({
                      ...prev,
                      options: { ...prev.options, language: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={generateStoryboard}
                disabled={loading || !generateForm.title || !generateForm.textContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Gerar Storyboard
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
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Importar Storyboard</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={importForm.title}
                  onChange={(e) => setImportForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o título do storyboard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo *
                </label>
                <input
                  type="file"
                  accept=".json,.txt,.csv"
                  onChange={(e) => setImportForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos suportados: JSON, TXT, CSV
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={importStoryboard}
                disabled={loading || !importForm.title || !importForm.file}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Importar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de preview do frame */}
      {showPreviewModal && previewFrame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Frame {previewFrame.sequence}: {previewFrame.title}
              </h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Imagem/Visual */}
              <div>
                <div className="aspect-video bg-gray-100 rounded-lg border mb-4 flex items-center justify-center">
                  {previewFrame.generatedImage ? (
                    <img
                      src={previewFrame.generatedImage.url}
                      alt={previewFrame.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Image size={48} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Imagem não gerada</p>
                      <button
                        onClick={() => {
                          if (selectedStoryboard) {
                            generateFrameImage(selectedStoryboard.id, previewFrame.id);
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Gerar Imagem
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Elementos visuais */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Elementos Visuais</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Composição:</span>
                        <p className="font-medium">{previewFrame.visualElements.composition}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Iluminação:</span>
                        <p className="font-medium">{previewFrame.visualElements.lighting}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Estilo:</span>
                        <p className="font-medium">{previewFrame.visualElements.style}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Duração:</span>
                        <p className="font-medium">{previewFrame.duration}s</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Cores:</span>
                    <div className="flex gap-2 mt-1">
                      {previewFrame.visualElements.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detalhes */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700">{previewFrame.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Movimento de Câmera</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Tipo:</span>
                      <p className="font-medium capitalize">{previewFrame.cameraMovement.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ângulo:</span>
                      <p className="font-medium">{previewFrame.cameraMovement.angle}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Distância:</span>
                      <p className="font-medium">{previewFrame.cameraMovement.distance}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Áudio</h4>
                  <p className="text-gray-700">{previewFrame.audioNotes || 'Nenhuma nota de áudio'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Texto Sobreposto</h4>
                  <p className="text-gray-700">{previewFrame.textOverlay || 'Nenhum texto'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Transições</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Entrada:</span>
                      <p className="font-medium">{previewFrame.transitions.in}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Saída:</span>
                      <p className="font-medium">{previewFrame.transitions.out}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificações de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <span className="text-gray-700">Processando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardGenerator;