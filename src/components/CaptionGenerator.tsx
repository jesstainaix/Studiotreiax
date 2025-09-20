import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  FileText, 
  Mic, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BarChart3, 
  Trash2, 
  RefreshCw, 
  Eye, 
  Copy, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  TrendingUp, 
  Users, 
  Languages, 
  Zap
} from 'lucide-react';

// Interfaces
interface CaptionJob {
  id: string;
  title: string;
  type: 'caption' | 'transcription';
  language: string;
  templateId?: string;
  status: 'queued' | 'processing' | 'extracting_audio' | 'processing_ai' | 'optimizing' | 'completed' | 'error';
  progress: number;
  file: {
    originalName: string;
    size: number;
    mimetype: string;
  };
  options: any;
  result?: CaptionResult | TranscriptionResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  processingTime: number;
  batchId?: string;
}

interface CaptionResult {
  captions: Caption[];
  totalDuration: number;
  averageConfidence: number;
  detectedLanguage: string;
  speakerCount: number;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  metadata: {
    totalDuration: number;
    wordCount: number;
    averageConfidence: number;
    detectedLanguage: string;
    speakerCount: number;
    processingTime: number;
  };
}

interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker: string;
  styling?: {
    fontSize: number;
    fontFamily: string;
    backgroundColor: string;
    textColor: string;
    position: string;
  };
}

interface TranscriptionSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker: string;
  confidence: number;
}

interface Template {
  id: string;
  name: string;
  type: 'caption' | 'transcription';
  settings: any;
  createdAt: string;
  userId?: string;
}

interface Language {
  code: string;
  name: string;
  supported: boolean;
}

interface Analytics {
  totalJobs: number;
  completedJobs: number;
  averageProcessingTime: number;
  accuracyRate: number;
  languageDistribution: Record<string, number>;
  monthlyStats: Array<{
    month: string;
    captions: number;
    transcriptions: number;
  }>;
}

interface BatchStatus {
  batchId: string;
  summary: {
    totalJobs: number;
    completedJobs: number;
    errorJobs: number;
    processingJobs: number;
    overallProgress: number;
  };
  jobs: CaptionJob[];
}

const CaptionGenerator: React.FC = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState<'generator' | 'jobs' | 'templates' | 'analytics'>('generator');
  const [jobs, setJobs] = useState<CaptionJob[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedJob, setSelectedJob] = useState<CaptionJob | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    title: '',
    type: 'caption' as 'caption' | 'transcription',
    language: 'pt-BR',
    templateId: '',
    options: {
      speakerIdentification: false,
      timestampInterval: 30,
      autoDetectLanguage: false,
      enhanceAudio: true,
      removeBackground: false
    }
  });
  
  // Estados de UI
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    language: '',
    dateRange: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados de preview
  const [previewJob, setPreviewJob] = useState<CaptionJob | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);
  
  // Polling para atualizar jobs em processamento
  useEffect(() => {
    const processingJobs = jobs.filter(job => 
      ['queued', 'processing', 'extracting_audio', 'processing_ai', 'optimizing'].includes(job.status)
    );
    
    if (processingJobs.length > 0) {
      pollIntervalRef.current = setInterval(() => {
        loadJobs();
      }, 3000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [jobs]);
  
  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadJobs(),
        loadTemplates(),
        loadLanguages(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };
  
  const loadJobs = async () => {
    try {
      const response = await fetch('/api/ai/captions/jobs');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
    }
  };
  
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai/captions/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };
  
  const loadLanguages = async () => {
    try {
      const response = await fetch('/api/ai/captions/languages');
      const data = await response.json();
      
      if (data.success) {
        setLanguages(data.languages);
      }
    } catch (error) {
      console.error('Erro ao carregar idiomas:', error);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/captions/analytics/overview');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedFiles.length === 0) {
      alert('Selecione pelo menos um arquivo');
      return;
    }
    
    setIsUploading(true);
    
    try {
      if (selectedFiles.length === 1) {
        // Upload único
        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFiles[0]);
        formDataToSend.append('title', formData.title || selectedFiles[0].name);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('language', formData.language);
        formDataToSend.append('templateId', formData.templateId);
        formDataToSend.append('options', JSON.stringify(formData.options));
        
        const response = await fetch('/api/ai/captions/jobs', {
          method: 'POST',
          body: formDataToSend
        });
        
        const data = await response.json();
        
        if (data.success) {
          await loadJobs();
          resetForm();
          alert('Job criado com sucesso!');
        } else {
          alert('Erro ao criar job: ' + (data.error || 'Erro desconhecido'));
        }
      } else {
        // Upload em lote
        const formDataToSend = new FormData();
        selectedFiles.forEach(file => {
          formDataToSend.append('files', file);
        });
        formDataToSend.append('type', formData.type);
        formDataToSend.append('language', formData.language);
        formDataToSend.append('templateId', formData.templateId);
        formDataToSend.append('options', JSON.stringify(formData.options));
        
        const response = await fetch('/api/ai/captions/batch-process', {
          method: 'POST',
          body: formDataToSend
        });
        
        const data = await response.json();
        
        if (data.success) {
          setBatchStatus({
            batchId: data.batchId,
            summary: {
              totalJobs: data.jobs.length,
              completedJobs: 0,
              errorJobs: 0,
              processingJobs: data.jobs.length,
              overallProgress: 0
            },
            jobs: data.jobs
          });
          setShowBatchModal(true);
          await loadJobs();
          resetForm();
        } else {
          alert('Erro ao processar lote: ' + (data.error || 'Erro desconhecido'));
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload: ' + error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      type: 'caption',
      language: 'pt-BR',
      templateId: '',
      options: {
        speakerIdentification: false,
        timestampInterval: 30,
        autoDetectLanguage: false,
        enhanceAudio: true,
        removeBackground: false
      }
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Tem certeza que deseja deletar este job?')) return;
    
    try {
      const response = await fetch(`/api/ai/captions/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadJobs();
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
        }
      } else {
        alert('Erro ao deletar job: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao deletar job:', error);
      alert('Erro ao deletar job');
    }
  };
  
  const handleReprocessJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/ai/captions/jobs/${jobId}/reprocess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ options: formData.options })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadJobs();
        alert('Job reprocessado com sucesso!');
      } else {
        alert('Erro ao reprocessar job: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao reprocessar job:', error);
      alert('Erro ao reprocessar job');
    }
  };
  
  const handleExportJob = async (jobId: string, format: string) => {
    try {
      const response = await fetch(`/api/ai/captions/jobs/${jobId}/export?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erro ao exportar arquivo');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar arquivo');
    }
  };
  
  const handleSaveTemplate = async (templateData: Partial<Template>) => {
    try {
      const url = editingTemplate 
        ? `/api/ai/captions/templates/${editingTemplate.id}`
        : '/api/ai/captions/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
        setShowTemplateModal(false);
        setEditingTemplate(null);
        alert('Template salvo com sucesso!');
      } else {
        alert('Erro ao salvar template: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template');
    }
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;
    
    try {
      const response = await fetch(`/api/ai/captions/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTemplates();
      } else {
        alert('Erro ao deletar template: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      alert('Erro ao deletar template');
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
      case 'extracting_audio':
      case 'processing_ai':
      case 'optimizing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'queued':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'queued': 'Na fila',
      'processing': 'Processando',
      'extracting_audio': 'Extraindo áudio',
      'processing_ai': 'Processando com IA',
      'optimizing': 'Otimizando',
      'completed': 'Concluído',
      'error': 'Erro'
    };
    return statusMap[status] || status;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filters.type || job.type === filters.type;
    const matchesStatus = !filters.status || job.status === filters.status;
    const matchesLanguage = !filters.language || job.language === filters.language;
    
    return matchesSearch && matchesType && matchesStatus && matchesLanguage;
  });
  
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Geração de Legendas e Transcrições
          </h1>
          <p className="text-gray-600">
            Sistema inteligente para geração automática de legendas e transcrições usando IA
          </p>
        </div>
        
        {/* Estatísticas rápidas */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalJobs}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completedJobs}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageProcessingTime}s</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.accuracyRate * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navegação por abas */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'generator', label: 'Gerador', icon: Zap },
                { id: 'jobs', label: 'Jobs', icon: FileText },
                { id: 'templates', label: 'Templates', icon: Settings },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Conteúdo das abas */}
        <div className="bg-white rounded-lg shadow">
          {/* Aba Gerador */}
          {activeTab === 'generator' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Novo Job de Legenda/Transcrição
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título do Job
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o título do job"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Processamento
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'caption' | 'transcription' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="caption">Legendas</option>
                      <option value="transcription">Transcrição</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {languages.filter(lang => lang.supported).map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template
                    </label>
                    <select
                      value={formData.templateId}
                      onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um template (opcional)</option>
                      {templates.filter(t => t.type === formData.type).map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Opções avançadas */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Opções Avançadas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.speakerIdentification}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, speakerIdentification: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Identificação de falantes</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.autoDetectLanguage}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, autoDetectLanguage: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Detectar idioma automaticamente</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.enhanceAudio}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, enhanceAudio: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Melhorar qualidade do áudio</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options.removeBackground}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, removeBackground: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Remover ruído de fundo</span>
                    </label>
                  </div>
                  
                  {formData.type === 'transcription' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalo de timestamp (segundos)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={formData.options.timestampInterval}
                        onChange={(e) => setFormData({
                          ...formData,
                          options: { ...formData.options, timestampInterval: parseInt(e.target.value) }
                        })}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                
                {/* Upload de arquivos */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Arquivos</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Clique para selecionar arquivos ou arraste aqui
                          </span>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="video/*,audio/*"
                            onChange={handleFileSelect}
                            className="sr-only"
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          Suporte para MP4, AVI, MOV, MP3, WAV, M4A (máx. 500MB por arquivo)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de arquivos selecionados */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Arquivos selecionados ({selectedFiles.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = selectedFiles.filter((_, i) => i !== index);
                                setSelectedFiles(newFiles);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Botões de ação */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || selectedFiles.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {selectedFiles.length > 1 ? 'Processar Lote' : 'Processar'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Aba Jobs */}
          {activeTab === 'jobs' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Jobs de Processamento</h2>
                <button
                  onClick={loadJobs}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </button>
              </div>
              
              {/* Filtros e busca */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Buscar jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="caption">Legendas</option>
                  <option value="transcription">Transcrições</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="queued">Na fila</option>
                  <option value="processing">Processando</option>
                  <option value="completed">Concluído</option>
                  <option value="error">Erro</option>
                </select>
                
                <select
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os idiomas</option>
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Lista de jobs */}
              <div className="space-y-4">
                {paginatedJobs.map(job => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-500">
                            {job.file.originalName} • {formatFileSize(job.file.size)} • 
                            {job.type === 'caption' ? 'Legendas' : 'Transcrição'} • 
                            {languages.find(l => l.code === job.language)?.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {getStatusText(job.status)}
                        </span>
                        
                        {job.status === 'completed' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <div className="relative group">
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                                <Download className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button
                                  onClick={() => handleExportJob(job.id, 'srt')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  SRT
                                </button>
                                <button
                                  onClick={() => handleExportJob(job.id, 'vtt')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  VTT
                                </button>
                                <button
                                  onClick={() => handleExportJob(job.id, 'txt')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  TXT
                                </button>
                                <button
                                  onClick={() => handleExportJob(job.id, 'json')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  JSON
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {job.status === 'error' && (
                          <button
                            onClick={() => handleReprocessJob(job.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Reprocessar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Barra de progresso */}
                    {['queued', 'processing', 'extracting_audio', 'processing_ai', 'optimizing'].includes(job.status) && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{getStatusText(job.status)}</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Informações adicionais */}
                    <div className="mt-3 flex justify-between text-xs text-gray-500">
                      <span>Criado em: {new Date(job.createdAt).toLocaleString()}</span>
                      {job.processingTime > 0 && (
                        <span>Tempo de processamento: {job.processingTime.toFixed(1)}s</span>
                      )}
                    </div>
                    
                    {/* Erro */}
                    {job.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{job.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`
                          px-3 py-2 border rounded-md
                          ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Aba Templates */}
          {activeTab === 'templates' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Templates</h2>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowTemplateModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">
                          {template.type === 'caption' ? 'Legendas' : 'Transcrição'}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p>Criado em: {new Date(template.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Preview das configurações */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-xs font-medium text-gray-700 mb-2">Configurações:</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {template.type === 'caption' ? (
                          <>
                            <p>Tamanho da fonte: {template.settings.fontSize}px</p>
                            <p>Posição: {template.settings.position}</p>
                            <p>Máx. caracteres: {template.settings.maxLineLength}</p>
                          </>
                        ) : (
                          <>
                            <p>Identificação de falantes: {template.settings.speakerIdentification ? 'Sim' : 'Não'}</p>
                            <p>Intervalo de timestamp: {template.settings.timestampInterval}s</p>
                            <p>Quebras de parágrafo: {template.settings.paragraphBreaks ? 'Sim' : 'Não'}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Aba Analytics */}
          {activeTab === 'analytics' && analytics && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics e Relatórios</h2>
              
              {/* Gráfico de estatísticas mensais */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas Mensais</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-end h-64">
                    {analytics.monthlyStats.map((stat, index) => {
                      const maxValue = Math.max(...analytics.monthlyStats.map(s => s.captions + s.transcriptions));
                      const totalHeight = (stat.captions + stat.transcriptions) / maxValue * 200;
                      const captionHeight = (stat.captions / maxValue) * 200;
                      
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div className="flex flex-col justify-end" style={{ height: '200px' }}>
                            <div
                              className="bg-blue-500 rounded-t"
                              style={{ height: `${captionHeight}px`, width: '40px' }}
                              title={`Legendas: ${stat.captions}`}
                            />
                            <div
                              className="bg-green-500"
                              style={{ height: `${totalHeight - captionHeight}px`, width: '40px' }}
                              title={`Transcrições: ${stat.transcriptions}`}
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-2">{stat.month}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-center mt-4 space-x-6">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
                      <span className="text-sm text-gray-600">Legendas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2" />
                      <span className="text-sm text-gray-600">Transcrições</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Distribuição por idioma */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Idioma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analytics.languageDistribution).map(([lang, count]) => {
                    const language = languages.find(l => l.code === lang);
                    const percentage = (count / analytics.totalJobs) * 100;
                    
                    return (
                      <div key={lang} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {language?.name || lang}
                          </span>
                          <span className="text-sm text-gray-500">{count} jobs</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Métricas de performance */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(analytics.accuracyRate * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.averageProcessingTime.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Jobs Concluídos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.completedJobs}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal de visualização de job */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedJob.title}
                  </h2>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Informações do job */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Arquivo</p>
                      <p className="text-gray-900">{selectedJob.file.originalName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tipo</p>
                      <p className="text-gray-900">
                        {selectedJob.type === 'caption' ? 'Legendas' : 'Transcrição'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Idioma</p>
                      <p className="text-gray-900">
                        {languages.find(l => l.code === selectedJob.language)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <div className="flex items-center">
                        {getStatusIcon(selectedJob.status)}
                        <span className="ml-2">{getStatusText(selectedJob.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resultado */}
                {selectedJob.result && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Resultado</h3>
                    
                    {selectedJob.type === 'caption' && selectedJob.result && 'captions' in selectedJob.result && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Duração Total</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatDuration(selectedJob.result.totalDuration)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Confiança Média</p>
                            <p className="text-lg font-bold text-gray-900">
                              {Math.round(selectedJob.result.averageConfidence * 100)}%
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Falantes</p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedJob.result.speakerCount}
                            </p>
                          </div>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                          {selectedJob.result.captions.map((caption, index) => (
                            <div key={caption.id} className="p-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-blue-600">
                                  {formatDuration(caption.startTime)} → {formatDuration(caption.endTime)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {Math.round(caption.confidence * 100)}% confiança
                                </span>
                              </div>
                              <p className="text-gray-900">{caption.text}</p>
                              {caption.speaker && (
                                <p className="text-xs text-gray-500 mt-1">Falante: {caption.speaker}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedJob.type === 'transcription' && selectedJob.result && 'text' in selectedJob.result && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Duração</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatDuration(selectedJob.result.metadata.totalDuration)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Palavras</p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedJob.result.metadata.wordCount}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Confiança</p>
                            <p className="text-lg font-bold text-gray-900">
                              {Math.round(selectedJob.result.metadata.averageConfidence * 100)}%
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Falantes</p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedJob.result.metadata.speakerCount}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <h4 className="font-medium text-gray-900 mb-3">Texto Completo</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.result.text}</p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 p-3 border-b border-gray-200">Segmentos</h4>
                          <div className="max-h-64 overflow-y-auto">
                            {selectedJob.result.segments.map((segment, index) => (
                              <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-blue-600">
                                    {formatDuration(segment.startTime)} → {formatDuration(segment.endTime)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(segment.confidence * 100)}%
                                  </span>
                                </div>
                                <p className="text-gray-900">{segment.text}</p>
                                {segment.speaker && (
                                  <p className="text-xs text-gray-500 mt-1">Falante: {segment.speaker}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de template */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <TemplateModal
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onClose={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                }}
              />
            </div>
          </div>
        )}
        
        {/* Modal de lote */}
        {showBatchModal && batchStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Processamento em Lote
                  </h2>
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Total</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {batchStatus.summary.totalJobs}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Concluídos</p>
                      <p className="text-2xl font-bold text-green-900">
                        {batchStatus.summary.completedJobs}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-yellow-600">Processando</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {batchStatus.summary.processingJobs}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-red-600">Erros</p>
                      <p className="text-2xl font-bold text-red-900">
                        {batchStatus.summary.errorJobs}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progresso Geral</span>
                      <span>{Math.round(batchStatus.summary.overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${batchStatus.summary.overallProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {batchStatus.jobs.map(job => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <p className="font-medium text-gray-900">{job.title}</p>
                            <p className="text-sm text-gray-500">{job.file.originalName}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {getStatusText(job.status)}
                        </span>
                      </div>
                      
                      {['queued', 'processing', 'extracting_audio', 'processing_ai', 'optimizing'].includes(job.status) && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente do modal de template
interface TemplateModalProps {
  template: Template | null;
  onSave: (template: Partial<Template>) => void;
  onClose: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'caption' as 'caption' | 'transcription',
    settings: template?.settings || {
      fontSize: 16,
      fontFamily: 'Arial',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      position: 'bottom',
      maxLineLength: 40,
      speakerIdentification: false,
      timestampInterval: 30,
      paragraphBreaks: true
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {template ? 'Editar Template' : 'Novo Template'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Template
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'caption' | 'transcription' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="caption">Legendas</option>
              <option value="transcription">Transcrição</option>
            </select>
          </div>
        </div>
        
        {/* Configurações específicas por tipo */}
        {formData.type === 'caption' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configurações de Legenda</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho da Fonte
                </label>
                <input
                  type="number"
                  min="10"
                  max="72"
                  value={formData.settings.fontSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, fontSize: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Família da Fonte
                </label>
                <select
                  value={formData.settings.fontFamily}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, fontFamily: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Fundo
                </label>
                <input
                  type="color"
                  value={formData.settings.backgroundColor}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, backgroundColor: e.target.value }
                  })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Texto
                </label>
                <input
                  type="color"
                  value={formData.settings.textColor}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, textColor: e.target.value }
                  })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posição
                </label>
                <select
                  value={formData.settings.position}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, position: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top">Superior</option>
                  <option value="center">Centro</option>
                  <option value="bottom">Inferior</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Caracteres por Linha
                </label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={formData.settings.maxLineLength}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, maxLineLength: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configurações de Transcrição</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo de Timestamp (segundos)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.settings.timestampInterval}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, timestampInterval: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.speakerIdentification}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, speakerIdentification: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Identificação de falantes</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.paragraphBreaks}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, paragraphBreaks: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Quebras de parágrafo automáticas</span>
              </label>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            Salvar Template
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaptionGenerator