import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Download,
  Play,
  Pause,
  Edit3,
  Trash2,
  Settings,
  Clock,
  Languages,
  Mic,
  Video,
  FileAudio,
  Search,
  Filter,
  BarChart3,
  Plus,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Copy,
  Eye,
  RefreshCw
} from 'lucide-react';

// Interfaces
interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker: string;
}

interface CaptionFormat {
  id: string;
  format: string;
  content: string;
  downloadUrl: string;
  templateId?: string;
  createdAt: Date;
}

interface Transcription {
  id: string;
  userId: string;
  title: string;
  originalFile: {
    name: string;
    type: string;
    size: number;
    duration: number;
  };
  status: 'processing' | 'completed' | 'failed';
  language: string;
  confidence: number;
  transcriptionText: string;
  segments: TranscriptionSegment[];
  captions: CaptionFormat[];
  aiModel: string;
  processingTime: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CaptionTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  settings: {
    maxLineLength: number;
    maxLinesPerCaption: number;
    minDisplayTime: number;
    maxDisplayTime: number;
    fontSize: number;
    fontFamily: string;
    backgroundColor: string;
    textColor: string;
    position: string;
    outline?: boolean;
  };
  isDefault: boolean;
  createdAt: Date;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  speed: string;
  languages: number;
  maxDuration: number;
  costPerMinute: number;
}

interface Analytics {
  totalTranscriptions: number;
  totalMinutesProcessed: number;
  averageAccuracy: number;
  languageDistribution: Record<string, number>;
  formatDistribution: Record<string, number>;
  modelPerformance: Record<string, {
    accuracy: number;
    avgProcessingTime: number;
    usage: number;
  }>;
  monthlyStats: Array<{
    month: string;
    transcriptions: number;
    minutes: number;
  }>;
}

const CaptionsTranscriptions: React.FC = () => {
  // Estados
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'transcriptions' | 'templates' | 'analytics'>('transcriptions');
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CaptionTemplate | null>(null);
  
  // Estados de modais
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Estados de formulários
  const [uploadForm, setUploadForm] = useState({
    title: '',
    language: 'pt-BR',
    model: 'whisper-large-v3',
    file: null as File | null
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    format: 'srt',
    settings: {
      maxLineLength: 42,
      maxLinesPerCaption: 2,
      minDisplayTime: 1.0,
      maxDisplayTime: 6.0,
      fontSize: 16,
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textColor: '#FFFFFF',
      position: 'bottom-center'
    }
  });
  
  const [editingSegment, setEditingSegment] = useState<TranscriptionSegment | null>(null);
  const [segmentForm, setSegmentForm] = useState({
    text: '',
    startTime: 0,
    endTime: 0,
    speaker: ''
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTranscriptions(),
        loadTemplates(),
        loadLanguages(),
        loadAIModels(),
        loadAnalytics()
      ]);
    } catch (error) {
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTranscriptions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        language: languageFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/ai/captions/transcriptions?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTranscriptions(data.transcriptions);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar transcrições');
    }
  };
  
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai/captions/caption-templates');
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar templates');
    }
  };
  
  const loadLanguages = async () => {
    try {
      const response = await fetch('/api/ai/captions/supported-languages');
      const data = await response.json();
      
      if (response.ok) {
        setLanguages(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar idiomas');
    }
  };
  
  const loadAIModels = async () => {
    try {
      const response = await fetch('/api/ai/captions/ai-models');
      const data = await response.json();
      
      if (response.ok) {
        setAIModels(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar modelos de IA');
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/captions/analytics');
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar analytics');
    }
  };
  
  // Recarregar transcrições quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      loadTranscriptions();
    }
  }, [searchTerm, languageFilter, statusFilter, sortBy, sortOrder, currentPage]);
  
  // Funções de upload e processamento
  const handleFileUpload = async () => {
    if (!uploadForm.file || !uploadForm.title) {
      setError('Arquivo e título são obrigatórios');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('transcriptionData', JSON.stringify({
        title: uploadForm.title,
        language: uploadForm.language,
        model: uploadForm.model
      }));
      
      const response = await fetch('/api/ai/captions/transcriptions', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTranscriptions(prev => [data, ...prev]);
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          language: 'pt-BR',
          model: 'whisper-large-v3',
          file: null
        });
        
        // Polling para atualizar status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/ai/captions/transcriptions/${data.id}`);
            const statusData = await statusResponse.json();
            
            if (statusResponse.ok) {
              setTranscriptions(prev => 
                prev.map(t => t.id === data.id ? statusData : t)
              );
              
              if (statusData.status !== 'processing') {
                clearInterval(pollInterval);
              }
            }
          } catch (error) {
            clearInterval(pollInterval);
          }
        }, 2000);
        
        // Limpar polling após 5 minutos
        setTimeout(() => clearInterval(pollInterval), 300000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao fazer upload do arquivo');
    }
  };
  
  const handleDeleteTranscription = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta transcrição?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/ai/captions/transcriptions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTranscriptions(prev => prev.filter(t => t.id !== id));
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao deletar transcrição');
    }
  };
  
  const handleEditSegment = async () => {
    if (!editingSegment || !selectedTranscription) return;
    
    try {
      const response = await fetch(
        `/api/ai/captions/transcriptions/${selectedTranscription.id}/segments/${editingSegment.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(segmentForm)
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setSelectedTranscription(data);
        setTranscriptions(prev => 
          prev.map(t => t.id === data.id ? data : t)
        );
        setShowEditModal(false);
        setEditingSegment(null);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao editar segmento');
    }
  };
  
  const handleDownloadCaption = async (transcriptionId: string, format: string) => {
    try {
      const response = await fetch(`/api/ai/captions/transcriptions/${transcriptionId}/download/${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caption.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erro ao fazer download');
      }
    } catch (error) {
      setError('Erro ao fazer download da legenda');
    }
  };
  
  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/ai/captions/caption-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(prev => [...prev, data]);
        setShowTemplateModal(false);
        setTemplateForm({
          name: '',
          description: '',
          format: 'srt',
          settings: {
            maxLineLength: 42,
            maxLinesPerCaption: 2,
            minDisplayTime: 1.0,
            maxDisplayTime: 6.0,
            fontSize: 16,
            fontFamily: 'Arial',
            backgroundColor: 'rgba(0,0,0,0.8)',
            textColor: '#FFFFFF',
            position: 'bottom-center'
          }
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao criar template');
    }
  };
  
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/ai/captions/caption-templates/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao deletar template');
    }
  };
  
  // Funções auxiliares
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'processing':
        return 'Processando';
      case 'failed':
        return 'Falhou';
      default:
        return 'Pendente';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mic className="w-8 h-8 text-blue-600" />
              Legendas & Transcrições
            </h1>
            <p className="text-gray-600 mt-2">
              Geração automática de legendas e transcrições com IA
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Novo Upload
          </button>
        </div>
      </div>
      
      {/* Estatísticas rápidas */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Transcrições</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalTranscriptions}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Minutos Processados</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalMinutesProcessed.toLocaleString()}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precisão Média</p>
                <p className="text-2xl font-bold text-gray-900">{(analytics.averageAccuracy * 100).toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Idiomas Suportados</p>
                <p className="text-2xl font-bold text-gray-900">{languages.length}</p>
              </div>
              <Languages className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação por abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transcriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transcriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transcrições
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
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
      
      {/* Conteúdo das abas */}
      {activeTab === 'transcriptions' && (
        <div>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar transcrições..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os idiomas</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="processing">Processando</option>
                <option value="completed">Concluído</option>
                <option value="failed">Falhou</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Mais recentes</option>
                <option value="createdAt-asc">Mais antigos</option>
                <option value="title-asc">Título A-Z</option>
                <option value="title-desc">Título Z-A</option>
                <option value="confidence-desc">Maior precisão</option>
                <option value="confidence-asc">Menor precisão</option>
              </select>
            </div>
          </div>
          
          {/* Lista de transcrições */}
          <div className="space-y-4">
            {transcriptions.map(transcription => (
              <div key={transcription.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{transcription.title}</h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(transcription.status)}
                        <span className="text-sm text-gray-600">{getStatusText(transcription.status)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        {transcription.originalFile.type.startsWith('video/') ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <FileAudio className="w-4 h-4" />
                        )}
                        <span>{transcription.originalFile.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        <span>{languages.find(l => l.code === transcription.language)?.name || transcription.language}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(transcription.originalFile.duration)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>{(transcription.confidence * 100).toFixed(1)}% precisão</span>
                      </div>
                    </div>
                    
                    {transcription.status === 'completed' && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {transcription.transcriptionText}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Criado em {new Date(transcription.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>Modelo: {transcription.aiModel}</span>
                      {transcription.processingTime > 0 && (
                        <>
                          <span>•</span>
                          <span>Processado em {transcription.processingTime.toFixed(1)}s</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {transcription.status === 'completed' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTranscription(transcription);
                            setShowPreviewModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {transcription.captions.map(caption => (
                          <button
                            key={caption.id}
                            onClick={() => handleDownloadCaption(transcription.id, caption.format)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={`Download ${caption.format.toUpperCase()}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ))}
                      </>
                    )}
                    
                    <button
                      onClick={() => handleDeleteTranscription(transcription.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {transcriptions.length === 0 && (
            <div className="text-center py-12">
              <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transcrição encontrada</h3>
              <p className="text-gray-600 mb-4">Faça upload de um arquivo de áudio ou vídeo para começar</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fazer Upload
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'templates' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Templates de Legendas</h2>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Padrão</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Deletar template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formato:</span>
                    <span className="font-medium">{template.format.toUpperCase()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamanho da fonte:</span>
                    <span className="font-medium">{template.settings.fontSize}px</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posição:</span>
                    <span className="font-medium">{template.settings.position}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Linhas máx:</span>
                    <span className="font-medium">{template.settings.maxLinesPerCaption}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}</span>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setTemplateForm({
                          name: template.name,
                          description: template.description,
                          format: template.format,
                          settings: { ...template.settings }
                        });
                        setShowTemplateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Analytics e Relatórios</h2>
          
          {/* Distribuição por idioma */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Idioma</h3>
            <div className="space-y-3">
              {Object.entries(analytics.languageDistribution).map(([code, count]) => {
                const language = languages.find(l => l.code === code);
                const percentage = (count / analytics.totalTranscriptions) * 100;
                
                return (
                  <div key={code} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{language?.flag}</span>
                      <span className="font-medium">{language?.name || code}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Performance dos modelos */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance dos Modelos de IA</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Modelo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Precisão</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tempo Médio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.modelPerformance).map(([model, stats]) => (
                    <tr key={model} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{model}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">
                          {(stats.accuracy * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">{stats.avgProcessingTime.toFixed(1)}s</td>
                      <td className="py-3 px-4">{stats.usage} transcrições</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Estatísticas mensais */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Mensais</h3>
            <div className="space-y-4">
              {analytics.monthlyStats.map(stat => (
                <div key={stat.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{stat.month}</h4>
                    <p className="text-sm text-gray-600">{stat.transcriptions} transcrições</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{stat.minutes.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">minutos processados</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Upload</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o título da transcrição"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  value={uploadForm.language}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo de IA
                </label>
                <select
                  value={uploadForm.model}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {aiModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {(model.accuracy * 100).toFixed(1)}% precisão
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {uploadForm.file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadForm.file.name}</p>
                      <p className="text-xs text-gray-600">{formatFileSize(uploadForm.file.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Clique para selecionar um arquivo</p>
                      <p className="text-xs text-gray-500">MP4, MP3, WAV, M4A (máx. 500MB)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadForm(prev => ({ ...prev, file }));
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!uploadForm.file || !uploadForm.title}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Fazer Upload
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTemplate ? 'Editar Template' : 'Novo Template'}
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do template"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato
                  </label>
                  <select
                    value={templateForm.format}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="srt">SRT</option>
                    <option value="vtt">VTT</option>
                    <option value="txt">TXT</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição do template"
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Configurações</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho máximo da linha
                    </label>
                    <input
                      type="number"
                      value={templateForm.settings.maxLineLength}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, maxLineLength: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Linhas máximas por legenda
                    </label>
                    <input
                      type="number"
                      value={templateForm.settings.maxLinesPerCaption}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, maxLinesPerCaption: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da fonte
                    </label>
                    <input
                      type="number"
                      value={templateForm.settings.fontSize}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, fontSize: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Família da fonte
                    </label>
                    <select
                      value={templateForm.settings.fontFamily}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, fontFamily: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor do texto
                    </label>
                    <input
                      type="color"
                      value={templateForm.settings.textColor}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, textColor: e.target.value }
                      }))}
                      className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posição
                    </label>
                    <select
                      value={templateForm.settings.position}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, position: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bottom-center">Inferior Centro</option>
                      <option value="bottom-left">Inferior Esquerda</option>
                      <option value="bottom-right">Inferior Direita</option>
                      <option value="center">Centro</option>
                      <option value="top-center">Superior Centro</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!templateForm.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedTemplate ? 'Atualizar' : 'Criar'} Template
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Preview */}
      {showPreviewModal && selectedTranscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTranscription.title}
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedTranscription(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Informações da transcrição */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Idioma:</span>
                    <p className="font-medium">
                      {languages.find(l => l.code === selectedTranscription.language)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Precisão:</span>
                    <p className="font-medium">{(selectedTranscription.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duração:</span>
                    <p className="font-medium">{formatTime(selectedTranscription.originalFile.duration)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Segmentos:</span>
                    <p className="font-medium">{selectedTranscription.segments.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Texto completo */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Texto Completo</h4>
                <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedTranscription.transcriptionText}
                  </p>
                </div>
              </div>
              
              {/* Segmentos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">Segmentos</h4>
                  <span className="text-sm text-gray-600">
                    {selectedTranscription.segments.length} segmentos
                  </span>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTranscription.segments.map(segment => (
                    <div key={segment.id} className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                            </span>
                            {segment.speaker && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {segment.speaker}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {(segment.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{segment.text}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSegment(segment);
                            setSegmentForm({
                              text: segment.text,
                              startTime: segment.startTime,
                              endTime: segment.endTime,
                              speaker: segment.speaker
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar segmento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Legendas disponíveis */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Legendas Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedTranscription.captions.map(caption => (
                    <div key={caption.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {caption.format.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleDownloadCaption(selectedTranscription.id, caption.format)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Criado em {new Date(caption.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Edição de Segmento */}
      {showEditModal && editingSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Segmento</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSegment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto
                </label>
                <textarea
                  value={segmentForm.text}
                  onChange={(e) => setSegmentForm(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Inicial (s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={segmentForm.startTime}
                    onChange={(e) => setSegmentForm(prev => ({ ...prev, startTime: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Final (s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={segmentForm.endTime}
                    onChange={(e) => setSegmentForm(prev => ({ ...prev, endTime: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locutor (opcional)
                </label>
                <input
                  type="text"
                  value={segmentForm.speaker}
                  onChange={(e) => setSegmentForm(prev => ({ ...prev, speaker: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do locutor"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSegment(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSegment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptionsTranscriptions;