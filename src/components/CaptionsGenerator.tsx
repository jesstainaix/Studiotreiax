import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Download, Languages, Settings, FileText, Mic, Volume2, Clock, Users, BarChart3, Trash2, Edit3, Copy, RefreshCw } from 'lucide-react';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker: string;
}

interface Caption {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

interface CaptionTemplate {
  id: string;
  name: string;
  description: string;
  settings: {
    maxCharsPerLine: number;
    maxLines: number;
    minDuration: number;
    maxDuration: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    position: string;
    includeAudioDescriptions?: boolean;
    includeEmojis?: boolean;
    includeKeywords?: boolean;
  };
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface TranscriptionSettings {
  language: string;
  model: string;
  temperature: number;
  includeSpeakers: boolean;
  includeTimestamps: boolean;
  includeConfidence: boolean;
}

interface CaptionProject {
  id: string;
  name: string;
  audioFile: string;
  transcription?: TranscriptionSegment[];
  captions?: Caption[];
  template: CaptionTemplate;
  settings: TranscriptionSettings;
  createdAt: string;
  updatedAt?: string;
  status: 'draft' | 'transcribing' | 'generating' | 'completed';
}

const CaptionsGenerator: React.FC = () => {
  const [projects, setProjects] = useState<CaptionProject[]>([]);
  const [currentProject, setCurrentProject] = useState<CaptionProject | null>(null);
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'transcribe' | 'captions' | 'export'>('projects');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [transcriptionSettings, setTranscriptionSettings] = useState<TranscriptionSettings>({
    language: 'pt-BR',
    model: 'whisper-1',
    temperature: 0.0,
    includeSpeakers: true,
    includeTimestamps: true,
    includeConfidence: true
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editingCaption, setEditingCaption] = useState<Caption | null>(null);
  const [exportFormat, setExportFormat] = useState<'srt' | 'vtt' | 'ass'>('srt');
  const [stats, setStats] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar idiomas suportados
      const languagesResponse = await fetch('/api/ai/captions/languages');
      const languagesData = await languagesResponse.json();
      if (languagesData.success) {
        setLanguages(languagesData.data);
      }
      
      // Carregar templates
      const templatesResponse = await fetch('/api/ai/captions/templates');
      const templatesData = await templatesResponse.json();
      if (templatesData.success) {
        setTemplates(templatesData.data);
      }
      
      // Carregar projetos
      await loadProjects();
      
      // Carregar estatísticas
      await loadStats();
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/ai/captions');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ai/captions/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      
      // Criar URL para o áudio
      const audioUrl = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onloadedmetadata = () => {
          setDuration(audioRef.current?.duration || 0);
        };
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioFile) return;
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('audioFile', audioFile.name);
      formData.append('settings', JSON.stringify(transcriptionSettings));
      
      const response = await fetch('/api/ai/captions/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioFile: audioFile.name,
          settings: transcriptionSettings
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Criar novo projeto
        const newProject: CaptionProject = {
          id: Date.now().toString(),
          name: `Projeto ${audioFile.name}`,
          audioFile: audioFile.name,
          transcription: data.transcription,
          template: templates.find(t => t.id === selectedTemplate) || templates[0],
          settings: transcriptionSettings,
          createdAt: new Date().toISOString(),
          status: 'completed'
        };
        
        setProjects(prev => [newProject, ...prev]);
        setCurrentProject(newProject);
        setActiveTab('captions');
      }
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCaptions = async (transcriptionId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/ai/captions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcriptionId,
          templateId: selectedTemplate
        })
      });
      
      const data = await response.json();
      if (data.success && currentProject) {
        setCurrentProject({
          ...currentProject,
          captions: data.captions,
          status: 'completed'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar legendas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCaptions = async () => {
    if (!currentProject?.captions) return;
    
    try {
      const response = await fetch('/api/ai/captions/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          captionId: currentProject.id,
          format: exportFormat
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Criar download
        const blob = new Blob([data.export.content], { type: data.export.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.export.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao exportar legendas:', error);
    }
  };

  const playPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateCaption = (captionId: number, newText: string) => {
    if (!currentProject) return;
    
    const updatedCaptions = currentProject.captions?.map(caption => 
      caption.id === captionId ? { ...caption, text: newText } : caption
    );
    
    setCurrentProject({
      ...currentProject,
      captions: updatedCaptions
    });
  };

  const deleteCaption = (captionId: number) => {
    if (!currentProject) return;
    
    const updatedCaptions = currentProject.captions?.filter(caption => caption.id !== captionId);
    
    setCurrentProject({
      ...currentProject,
      captions: updatedCaptions
    });
  };

  const duplicateCaption = (caption: Caption) => {
    if (!currentProject) return;
    
    const newCaption = {
      ...caption,
      id: Date.now(),
      start: caption.end,
      end: caption.end + (caption.end - caption.start)
    };
    
    const updatedCaptions = [...(currentProject.captions || []), newCaption];
    
    setCurrentProject({
      ...currentProject,
      captions: updatedCaptions
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mic className="text-blue-600" />
                Gerador de Legendas
              </h1>
              <p className="text-gray-600 mt-2">
                Transcreva áudios e gere legendas automaticamente com IA
              </p>
            </div>
            
            {stats && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalTranscriptions}</div>
                  <div className="text-sm text-gray-600">Transcrições</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCaptions}</div>
                  <div className="text-sm text-gray-600">Legendas</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(stats.averageConfidence * 100)}%</div>
                  <div className="text-sm text-gray-600">Precisão</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'projects', label: 'Projetos', icon: FileText },
                { id: 'transcribe', label: 'Transcrever', icon: Mic },
                { id: 'captions', label: 'Legendas', icon: Volume2 },
                { id: 'export', label: 'Exportar', icon: Download }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'projects' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Meus Projetos</h2>
                
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Mic className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum projeto</h3>
                    <p className="mt-1 text-sm text-gray-500">Comece transcrevendo um áudio</p>
                    <button
                      onClick={() => setActiveTab('transcribe')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Novo Projeto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setCurrentProject(project)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-500">{project.audioFile}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(project.createdAt).toLocaleDateString()}
                              </span>
                              {project.transcription && (
                                <span className="flex items-center gap-1">
                                  <FileText size={12} />
                                  {project.transcription.length} segmentos
                                </span>
                              )}
                              {project.captions && (
                                <span className="flex items-center gap-1">
                                  <Volume2 size={12} />
                                  {project.captions.length} legendas
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              project.status === 'completed' ? 'bg-green-100 text-green-800' :
                              project.status === 'transcribing' ? 'bg-yellow-100 text-yellow-800' :
                              project.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status === 'completed' ? 'Concluído' :
                               project.status === 'transcribing' ? 'Transcrevendo' :
                               project.status === 'generating' ? 'Gerando' : 'Rascunho'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjects(prev => prev.filter(p => p.id !== project.id));
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transcribe' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Transcrever Áudio</h2>
                
                {/* Upload de Arquivo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo de Áudio
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {audioFile ? (
                      <div>
                        <div className="text-green-600 mb-2">
                          <Upload className="mx-auto h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{audioFile.name}</p>
                        <p className="text-xs text-gray-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Alterar arquivo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Clique para selecionar ou arraste um arquivo de áudio
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Selecionar Arquivo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player de Áudio */}
                {audioFile && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <audio
                      ref={audioRef}
                      onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <div className="flex items-center gap-4">
                      <button
                        onClick={playPause}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configurações de Transcrição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={transcriptionSettings.language}
                      onChange={(e) => setTranscriptionSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                      Modelo
                    </label>
                    <select
                      value={transcriptionSettings.model}
                      onChange={(e) => setTranscriptionSettings(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="whisper-1">Whisper v1 (Rápido)</option>
                      <option value="whisper-2">Whisper v2 (Preciso)</option>
                      <option value="whisper-large">Whisper Large (Máxima Qualidade)</option>
                    </select>
                  </div>
                </div>

                {/* Opções Avançadas */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={transcriptionSettings.includeSpeakers}
                      onChange={(e) => setTranscriptionSettings(prev => ({ ...prev, includeSpeakers: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-700">Identificar falantes</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={transcriptionSettings.includeTimestamps}
                      onChange={(e) => setTranscriptionSettings(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-700">Incluir timestamps</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={transcriptionSettings.includeConfidence}
                      onChange={(e) => setTranscriptionSettings(prev => ({ ...prev, includeConfidence: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-700">Mostrar nível de confiança</span>
                  </label>
                </div>

                {/* Botão de Transcrição */}
                <button
                  onClick={transcribeAudio}
                  disabled={!audioFile || isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      Transcrever Áudio
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'captions' && currentProject && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Legendas - {currentProject.name}</h2>
                  {currentProject.transcription && !currentProject.captions && (
                    <button
                      onClick={() => generateCaptions(currentProject.id)}
                      disabled={isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="animate-spin" size={16} />
                      ) : (
                        <Volume2 size={16} />
                      )}
                      Gerar Legendas
                    </button>
                  )}
                </div>

                {currentProject.captions ? (
                  <div className="space-y-3">
                    {currentProject.captions.map(caption => (
                      <div key={caption.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <span>{formatTime(caption.start)} → {formatTime(caption.end)}</span>
                              {caption.speaker && (
                                <span className="flex items-center gap-1">
                                  <Users size={12} />
                                  {caption.speaker}
                                </span>
                              )}
                              {caption.confidence && (
                                <span className="flex items-center gap-1">
                                  <BarChart3 size={12} />
                                  {Math.round(caption.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            {editingCaption?.id === caption.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editingCaption.text}
                                  onChange={(e) => setEditingCaption({ ...editingCaption, text: e.target.value })}
                                  className="flex-1 border border-gray-300 rounded px-3 py-1"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateCaption(caption.id, editingCaption.text);
                                      setEditingCaption(null);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    updateCaption(caption.id, editingCaption.text);
                                    setEditingCaption(null);
                                  }}
                                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditingCaption(null)}
                                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <p className="text-gray-900">{caption.text}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setEditingCaption(caption)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => duplicateCaption(caption)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => deleteCaption(caption.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentProject.transcription ? (
                  <div className="text-center py-8">
                    <Volume2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Legendas não geradas</h3>
                    <p className="mt-1 text-sm text-gray-500">Clique em "Gerar Legendas" para criar as legendas</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Transcrição não disponível</h3>
                    <p className="mt-1 text-sm text-gray-500">Faça a transcrição primeiro</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'export' && currentProject?.captions && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Exportar Legendas</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Exportação
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="srt">SRT (SubRip)</option>
                      <option value="vtt">VTT (WebVTT)</option>
                      <option value="ass">ASS (Advanced SubStation Alpha)</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Prévia do Arquivo</h3>
                    <div className="text-sm text-gray-600">
                      <p>Arquivo: legendas_{currentProject.id}.{exportFormat}</p>
                      <p>Legendas: {currentProject.captions.length}</p>
                      <p>Duração: {formatTime(currentProject.captions[currentProject.captions.length - 1]?.end || 0)}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={exportCaptions}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Exportar Legendas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} />
                Templates
              </h3>
              
              <div className="space-y-3">
                {templates.map(template => (
                  <label key={template.id} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {template.settings.maxCharsPerLine} chars/linha, {template.settings.maxLines} linhas
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Idiomas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Languages size={20} />
                Idiomas Suportados
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {languages.slice(0, 8).map(lang => (
                  <div key={lang.code} className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
              
              {languages.length > 8 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{languages.length - 8} outros idiomas
                </p>
              )}
            </div>

            {/* Atividade Recente */}
            {stats?.recentActivity && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Atividade Recente
                </h3>
                
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <div>
                        <div className="text-gray-900">{activity.name || activity.audioFile}</div>
                        <div className="text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptionsGenerator;