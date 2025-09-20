// Interface TTS Multi-Provider Premium com Vozes Brasileiras
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Download, Settings, Mic, Volume2, VolumeX, RotateCcw, Save, Upload, Trash2, Star, Filter, Search, RefreshCw, BarChart3, Zap, Globe, Users, Clock, DollarSign, Award, Headphones, AudioWaveform } from 'lucide-react';
import TTSSystem, { TTSVoice, TTSProvider, TTSResult, TTSOptions, TTSAnalytics, AudioFormat, EmphasisLevel } from './TTSSystem';

// Interfaces da interface
interface TTSInterfaceProps {
  onAudioGenerated?: (result: TTSResult) => void;
  onError?: (error: any) => void;
  className?: string;
}

interface VoicePreset {
  id: string;
  name: string;
  voiceId: string;
  options: TTSOptions;
  description: string;
  category: string;
  tags: string[];
}

interface AudioProject {
  id: string;
  name: string;
  text: string;
  voiceId: string;
  options: TTSOptions;
  results: TTSResult[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  speed: number;
}

const TTSInterface: React.FC<TTSInterfaceProps> = ({
  onAudioGenerated,
  onError,
  className = ''
}) => {
  // Estados principais
  const [ttsSystem] = useState(() => new TTSSystem());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesize' | 'voices' | 'projects' | 'analytics' | 'settings'>('synthesize');
  
  // Estados de síntese
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [providers, setProviders] = useState<TTSProvider[]>([]);
  const [ttsOptions, setTtsOptions] = useState<TTSOptions>({
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
    emphasis: 'moderate',
    pauseLength: 500,
    pronunciation: [],
    ssml: false,
    format: 'mp3',
    sampleRate: 22050,
    bitRate: 128,
    effects: [],
    chapters: []
  });
  
  // Estados de filtros e busca
  const [voiceFilters, setVoiceFilters] = useState({
    language: 'pt-BR',
    gender: '',
    provider: '',
    quality: '',
    search: ''
  });
  
  // Estados de projetos
  const [projects, setProjects] = useState<AudioProject[]>([]);
  const [currentProject, setCurrentProject] = useState<AudioProject | null>(null);
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  
  // Estados de reprodução
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    muted: false,
    speed: 1.0
  });
  
  // Estados de analytics
  const [analytics, setAnalytics] = useState<TTSAnalytics | null>(null);
  const [results, setResults] = useState<TTSResult[]>([]);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Inicialização
  useEffect(() => {
    initializeTTSSystem();
  }, []);
  
  const initializeTTSSystem = async () => {
    try {
      setIsLoading(true);
      await ttsSystem.initialize();
      
      const availableVoices = ttsSystem.getVoices();
      const availableProviders = ttsSystem.getProviders();
      
      setVoices(availableVoices);
      setProviders(availableProviders);
      
      // Selecionar primeira voz brasileira por padrão
      const defaultVoice = availableVoices.find(v => v.language === 'pt-BR');
      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
      }
      
      loadPresets();
      loadProjects();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Erro ao inicializar sistema TTS:', error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPresets = () => {
    const defaultPresets: VoicePreset[] = [
      {
        id: 'preset-narration',
        name: 'Narração Profissional',
        voiceId: 'azure-pt-br-francisca-neural',
        options: {
          ...ttsOptions,
          speed: 0.9,
          pitch: -2,
          emphasis: 'moderate',
          effects: [{ type: 'compressor', intensity: 0.3, parameters: {} }]
        },
        description: 'Ideal para narrações de vídeos corporativos e educacionais',
        category: 'Profissional',
        tags: ['narração', 'corporativo', 'educacional']
      },
      {
        id: 'preset-commercial',
        name: 'Comercial Animado',
        voiceId: 'polly-pt-br-camila-neural',
        options: {
          ...ttsOptions,
          speed: 1.1,
          pitch: 3,
          emphasis: 'strong',
          effects: [{ type: 'equalizer', intensity: 0.5, parameters: { bass: 1.2, treble: 1.1 } }]
        },
        description: 'Perfeito para comerciais e anúncios publicitários',
        category: 'Marketing',
        tags: ['comercial', 'publicidade', 'animado']
      },
      {
        id: 'preset-audiobook',
        name: 'Audiolivro Relaxante',
        voiceId: 'google-pt-br-wavenet-a',
        options: {
          ...ttsOptions,
          speed: 0.85,
          pitch: -1,
          emphasis: 'reduced',
          pauseLength: 800,
          effects: [{ type: 'reverb', intensity: 0.2, parameters: {} }]
        },
        description: 'Ideal para audiolivros e conteúdo de longa duração',
        category: 'Entretenimento',
        tags: ['audiolivro', 'relaxante', 'leitura']
      },
      {
        id: 'preset-news',
        name: 'Noticiário',
        voiceId: 'polly-pt-br-ricardo-neural',
        options: {
          ...ttsOptions,
          speed: 1.0,
          pitch: 0,
          emphasis: 'moderate',
          effects: [{ type: 'compressor', intensity: 0.4, parameters: {} }]
        },
        description: 'Estilo jornalístico para notícias e informativos',
        category: 'Jornalismo',
        tags: ['notícias', 'jornalismo', 'informativo']
      },
      {
        id: 'preset-training',
        name: 'Treinamento Corporativo',
        voiceId: 'azure-pt-br-antonio-neural',
        options: {
          ...ttsOptions,
          speed: 0.95,
          pitch: -1,
          emphasis: 'moderate',
          pauseLength: 600,
          effects: [{ type: 'noise_reduction', intensity: 0.6, parameters: {} }]
        },
        description: 'Ideal para treinamentos e cursos online',
        category: 'Educação',
        tags: ['treinamento', 'educação', 'curso']
      },
      {
        id: 'preset-premium',
        name: 'Premium Emocional',
        voiceId: 'elevenlabs-pt-br-ana-clone',
        options: {
          ...ttsOptions,
          speed: 1.0,
          pitch: 2,
          emphasis: 'strong',
          effects: [
            { type: 'equalizer', intensity: 0.4, parameters: { bass: 1.1, mid: 1.0, treble: 1.2 } },
            { type: 'compressor', intensity: 0.3, parameters: {} }
          ]
        },
        description: 'Voz clonada com alta expressividade emocional',
        category: 'Premium',
        tags: ['premium', 'emocional', 'clonada']
      }
    ];
    
    setPresets(defaultPresets);
  };
  
  const loadProjects = () => {
    // Carregar projetos salvos do localStorage
    const savedProjects = localStorage.getItem('tts-projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })));
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      }
    }
  };
  
  // Síntese de fala
  const handleSynthesize = async () => {
    if (!selectedVoice || !text.trim()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await ttsSystem.synthesize(text, selectedVoice.id, ttsOptions);
      
      if (result.success) {
        setResults(prev => [result, ...prev.slice(0, 9)]); // Manter últimos 10 resultados
        onAudioGenerated?.(result);
        
        // Reproduzir automaticamente
        if (result.audioUrl && audioRef.current) {
          audioRef.current.src = result.audioUrl;
          audioRef.current.load();
        }
        
        // Atualizar analytics
        const currentAnalytics = ttsSystem.getAnalytics();
        setAnalytics(currentAnalytics);
      } else {
        throw new Error(result.error?.message || 'Erro na síntese');
      }
    } catch (error) {
      console.error('Erro na síntese:', error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Controles de reprodução
  const handlePlay = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setPlaybackState(prev => ({ ...prev, isPlaying: true }));
      } catch (error) {
        console.error('Erro ao reproduzir áudio:', error);
        onError?.(error);
        // Tentar novamente com um pequeno delay
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('Falha na segunda tentativa de reprodução:', err);
            });
          }
        }, 100);
      }
    }
  };
  
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    }
  };
  
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };
  
  // Filtros de voz
  const filteredVoices = voices.filter(voice => {
    if (voiceFilters.language && voice.language !== voiceFilters.language) return false;
    if (voiceFilters.gender && voice.gender !== voiceFilters.gender) return false;
    if (voiceFilters.provider && voice.provider.id !== voiceFilters.provider) return false;
    if (voiceFilters.quality && voice.quality !== voiceFilters.quality) return false;
    if (voiceFilters.search && !voice.name.toLowerCase().includes(voiceFilters.search.toLowerCase())) return false;
    return true;
  });
  
  // Gerenciamento de projetos
  const saveProject = () => {
    if (!selectedVoice || !text.trim()) return;
    
    const project: AudioProject = {
      id: `project_${Date.now()}`,
      name: `Projeto ${projects.length + 1}`,
      text,
      voiceId: selectedVoice.id,
      options: ttsOptions,
      results: results.slice(0, 1), // Último resultado
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };
    
    const updatedProjects = [project, ...projects];
    setProjects(updatedProjects);
    setCurrentProject(project);
    
    // Salvar no localStorage
    localStorage.setItem('tts-projects', JSON.stringify(updatedProjects));
  };
  
  const loadProject = (project: AudioProject) => {
    setText(project.text);
    setTtsOptions(project.options);
    
    const voice = voices.find(v => v.id === project.voiceId);
    if (voice) {
      setSelectedVoice(voice);
    }
    
    setCurrentProject(project);
    setActiveTab('synthesize');
  };
  
  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('tts-projects', JSON.stringify(updatedProjects));
    
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  };
  
  // Aplicar preset
  const applyPreset = (preset: VoicePreset) => {
    const voice = voices.find(v => v.id === preset.voiceId);
    if (voice) {
      setSelectedVoice(voice);
      setTtsOptions(preset.options);
    }
  };
  
  // Formatação de tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Formatação de custo
  const formatCost = (cost: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(cost);
  };
  
  // Estimativa de custo
  const estimatedCost = selectedVoice && text ? 
    text.length * selectedVoice.pricing.costPerCharacter : 0;
  
  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Inicializando sistema TTS...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">TTS Premium</h2>
              <p className="text-gray-600">Sistema Multi-Provider com Vozes Brasileiras</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm text-gray-500">Custo Estimado</p>
              <p className="text-lg font-semibold text-green-600">{formatCost(estimatedCost)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Caracteres</p>
              <p className="text-lg font-semibold text-blue-600">{text.length}</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-6">
          {[
            { id: 'synthesize', label: 'Síntese', icon: Mic },
            { id: 'voices', label: 'Vozes', icon: Users },
            { id: 'projects', label: 'Projetos', icon: Save },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Tab: Síntese */}
        {activeTab === 'synthesize' && (
          <div className="space-y-6">
            {/* Texto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto para Síntese
              </label>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite o texto que deseja converter em fala..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={5000}
              />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{text.length}/5000 caracteres</span>
                <span>~{Math.ceil(text.length / 200)} min de leitura</span>
              </div>
            </div>
            
            {/* Seleção de Voz e Presets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Voz Selecionada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voz Selecionada
                </label>
                {selectedVoice ? (
                  <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{selectedVoice.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedVoice.quality === 'studio' ? 'bg-purple-100 text-purple-800' :
                        selectedVoice.quality === 'neural' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedVoice.quality}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <span>Idioma: {selectedVoice.language}</span>
                      <span>Gênero: {selectedVoice.gender === 'female' ? 'Feminino' : 'Masculino'}</span>
                      <span>Provider: {selectedVoice.provider.name}</span>
                      <span>Estilo: {selectedVoice.style}</span>
                    </div>
                    {selectedVoice.preview && (
                      <button className="mt-2 flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                        <Headphones className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                    Nenhuma voz selecionada
                  </div>
                )}
                
                <button
                  onClick={() => setActiveTab('voices')}
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Escolher Voz
                </button>
              </div>
              
              {/* Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presets de Voz
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {presets.map(preset => (
                    <div
                      key={preset.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-900">{preset.name}</h5>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{preset.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {preset.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Configurações de Síntese */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velocidade: {ttsOptions.speed}x
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.05"
                  value={ttsOptions.speed}
                  onChange={(e) => setTtsOptions(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tom: {ttsOptions.pitch > 0 ? '+' : ''}{ttsOptions.pitch}
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={ttsOptions.pitch}
                  onChange={(e) => setTtsOptions(prev => ({ ...prev, pitch: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume: {Math.round(ttsOptions.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ttsOptions.volume}
                  onChange={(e) => setTtsOptions(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Controles de Síntese */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSynthesize}
                  disabled={!selectedVoice || !text.trim() || isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  <span>{isLoading ? 'Sintetizando...' : 'Sintetizar'}</span>
                </button>
                
                <button
                  onClick={saveProject}
                  disabled={!selectedVoice || !text.trim()}
                  className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Salvar Projeto</span>
                </button>
              </div>
              
              {/* Controles de Reprodução */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={playbackState.isPlaying ? handlePause : handlePlay}
                  disabled={results.length === 0}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {playbackState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleStop}
                  disabled={results.length === 0}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Square className="w-5 h-5" />
                </button>
                
                {results.length > 0 && (
                  <a
                    href={results[0].audioUrl}
                    download={`tts_${results[0].id}.${results[0].format}`}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
            
            {/* Resultados Recentes */}
            {results.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resultados Recentes</h3>
                <div className="space-y-2">
                  {results.slice(0, 3).map(result => (
                    <div key={result.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AudioWaveform className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{result.metadata.voice.name}</p>
                            <p className="text-sm text-gray-600">
                              {result.metadata.charactersProcessed} chars • {formatTime(result.duration || 0)} • {formatCost(result.usage.costEstimate)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.round(result.metadata.quality.overall * 5)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          
                          {result.audioUrl && (
                            <a
                              href={result.audioUrl}
                              download={`tts_${result.id}.${result.format}`}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Vozes */}
        {activeTab === 'voices' && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={voiceFilters.search}
                    onChange={(e) => setVoiceFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Nome da voz..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <select
                  value={voiceFilters.language}
                  onChange={(e) => setVoiceFilters(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">Inglês (US)</option>
                  <option value="es-ES">Espanhol</option>
                  <option value="fr-FR">Francês</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero
                </label>
                <select
                  value={voiceFilters.gender}
                  onChange={(e) => setVoiceFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                  <option value="neutral">Neutro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={voiceFilters.provider}
                  onChange={(e) => setVoiceFilters(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualidade
                </label>
                <select
                  value={voiceFilters.quality}
                  onChange={(e) => setVoiceFilters(prev => ({ ...prev, quality: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  <option value="studio">Studio</option>
                  <option value="neural">Neural</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
            
            {/* Lista de Vozes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVoices.map(voice => (
                <div
                  key={voice.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedVoice?.id === voice.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVoice(voice)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{voice.name}</h4>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        voice.quality === 'studio' ? 'bg-purple-100 text-purple-800' :
                        voice.quality === 'neural' ? 'bg-blue-100 text-blue-800' :
                        voice.quality === 'premium' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {voice.quality}
                      </span>
                      {voice.features.some(f => f.premium) && (
                        <Award className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <span>🌍 {voice.language}</span>
                    <span>{voice.gender === 'female' ? '👩' : '👨'} {voice.gender === 'female' ? 'Feminino' : 'Masculino'}</span>
                    <span>🏢 {voice.provider.name}</span>
                    <span>💰 {formatCost(voice.pricing.costPerCharacter)}/char</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {voice.features.slice(0, 2).map(feature => (
                      <span key={feature.name} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {feature.name}
                      </span>
                    ))}
                  </div>
                  
                  {voice.preview && (
                    <button className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      <Headphones className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {filteredVoices.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma voz encontrada com os filtros aplicados.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Projetos */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Projetos Salvos</h3>
              <button
                onClick={saveProject}
                disabled={!selectedVoice || !text.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Novo Projeto</span>
              </button>
            </div>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {project.text.substring(0, 100)}...
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      <p>Criado: {project.createdAt.toLocaleDateString('pt-BR')}</p>
                      <p>Voz: {voices.find(v => v.id === project.voiceId)?.name || 'Desconhecida'}</p>
                      <p>Resultados: {project.results.length}</p>
                    </div>
                    
                    <button
                      onClick={() => loadProject(project)}
                      className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Carregar Projeto
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Save className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum projeto salvo ainda.</p>
                <p className="text-sm text-gray-500 mt-2">Crie um projeto na aba de síntese para começar.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analytics ? (
              <>
                {/* Métricas Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Total de Sínteses</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-2">{analytics.totalRequests}</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-2">{(analytics.successRate * 100).toFixed(1)}%</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Tempo Médio</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-2">{(analytics.averageProcessingTime / 1000).toFixed(1)}s</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-600">Custo Total</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900 mt-2">{formatCost(analytics.costAnalysis.totalCost)}</p>
                  </div>
                </div>
                
                {/* Qualidade Média */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Métricas de Qualidade</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Clareza', value: analytics.qualityMetrics.clarity },
                      { label: 'Naturalidade', value: analytics.qualityMetrics.naturalness },
                      { label: 'Pronúncia', value: analytics.qualityMetrics.pronunciation },
                      { label: 'Emoção', value: analytics.qualityMetrics.emotion },
                      { label: 'Geral', value: analytics.qualityMetrics.overall }
                    ].map(metric => (
                      <div key={metric.label} className="text-center">
                        <p className="text-sm text-gray-600">{metric.label}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${metric.value * 100}%` }}
                            />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {(metric.value * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum dado de analytics disponível ainda.</p>
                <p className="text-sm text-gray-500 mt-2">Execute algumas sínteses para ver as estatísticas.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Configurações */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configurações do Sistema</h3>
            
            {/* Configurações de Providers */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Providers Configurados</h4>
              {providers.map(provider => (
                <div key={provider.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">{provider.name}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      provider.apiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.apiKey ? 'Configurado' : 'Não Configurado'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Limite de Caracteres</p>
                      <p>{provider.maxCharacters.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Requisições/min</p>
                      <p>{provider.rateLimit.requestsPerMinute}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cota Gratuita</p>
                      <p>{provider.pricing.freeQuota.toLocaleString()} chars</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recursos:</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.features.map(feature => (
                        <span
                          key={feature.name}
                          className={`px-2 py-1 rounded text-xs ${
                            feature.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {feature.name}
                          {feature.beta && ' (Beta)'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Configurações de Cache */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Cache de Áudio</h4>
                <button
                  onClick={() => ttsSystem.clearCache()}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Cache</span>
                </button>
              </div>
              
              <p className="text-sm text-gray-600">
                O cache armazena áudios gerados para evitar custos desnecessários em sínteses repetidas.
                Os arquivos são mantidos por 24 horas.
              </p>
            </div>
            
            {/* Configurações de Formato */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Configurações Padrão</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Áudio
                  </label>
                  <select
                    value={ttsOptions.format}
                    onChange={(e) => setTtsOptions(prev => ({ ...prev, format: e.target.value as AudioFormat }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mp3">MP3</option>
                    <option value="wav">WAV</option>
                    <option value="ogg">OGG</option>
                    <option value="aac">AAC</option>
                    <option value="flac">FLAC</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa de Amostragem
                  </label>
                  <select
                    value={ttsOptions.sampleRate}
                    onChange={(e) => setTtsOptions(prev => ({ ...prev, sampleRate: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={16000}>16 kHz</option>
                    <option value={22050}>22.05 kHz</option>
                    <option value={44100}>44.1 kHz</option>
                    <option value={48000}>48 kHz</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa de Bits
                  </label>
                  <select
                    value={ttsOptions.bitRate}
                    onChange={(e) => setTtsOptions(prev => ({ ...prev, bitRate: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={64}>64 kbps</option>
                    <option value={128}>128 kbps</option>
                    <option value={192}>192 kbps</option>
                    <option value={256}>256 kbps</option>
                    <option value={320}>320 kbps</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setPlaybackState(prev => ({ ...prev, duration: audioRef.current!.duration }));
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setPlaybackState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }));
          }
        }}
        onEnded={() => {
          setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        }}
        onError={(e) => {
          console.error('Erro no elemento de áudio:', e);
          onError?.(e);
          setPlaybackState(prev => ({ ...prev, isPlaying: false }));
        }}
        onCanPlay={() => {
        }}
        className="hidden"
      />
    </div>
  );
};

export default TTSInterface;
export type { TTSInterfaceProps, VoicePreset, AudioProject, PlaybackState };