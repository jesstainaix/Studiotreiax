import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { 
  Brain,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Upload,
  Settings,
  Wand2,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  Globe,
  User,
  Users,
  MessageSquare,
  FileText,
  Image,
  Video,
  Music,
  Headphones,
  Speaker,
  Target,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Lightbulb,
  Search,
  Filter,
  Tag,
  Bookmark,
  Star,
  Heart,
  ThumbsUp,
  Copy,
  Save,
  Share2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  X,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Maximize,
  Minimize,
  Edit,
  Trash2,
  FolderOpen,
  Archive,
  Calendar,
  MapPin,
  Flag,
  Award,
  Shield,
  Key,
  Lock,
  Unlock,
  Cloud,
  Database,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Bluetooth,
  Smartphone,
  Tablet,
  Monitor,
  Camera,
  Printer,
  ScanLine,
  QrCode,
  Fingerprint
} from 'lucide-react';

// Tipos para IA e TTS
interface AIAnalysisResult {
  contentType: 'educational' | 'entertainment' | 'corporate' | 'news' | 'tutorial' | 'vlog';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  complexity: number; // 1-10
  targetAudience: string[];
  keyTopics: string[];
  suggestedTags: string[];
  emotionalTone: string[];
  pacing: 'slow' | 'medium' | 'fast' | 'variable';
  suggestedVoice: string;
  suggestedMusic: string[];
  confidenceScore: number;
  suggestions: AISuggestion[];
}

interface AISuggestion {
  id: string;
  type: 'voice' | 'music' | 'pacing' | 'effect' | 'transition' | 'timing';
  description: string;
  confidence: number;
  action: string;
  parameters?: Record<string, any>;
}

interface TTSConfiguration {
  provider: 'azure' | 'google' | 'elevenlabs' | 'openai' | 'aws';
  voice: string;
  language: string;
  speed: number;
  pitch: number;
  volume: number;
  emotion?: string;
  style?: string;
  emphasis?: number;
  pause?: number;
}

interface VoiceProfile {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young' | 'adult' | 'elderly';
  accent: string;
  characteristics: string[];
  sampleUrl?: string;
  premium: boolean;
  rating: number;
  description: string;
}

interface ScriptSegment {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  voice: string;
  config: TTSConfiguration;
  audioUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  markers?: TimingMarker[];
}

interface TimingMarker {
  time: number;
  type: 'word' | 'sentence' | 'paragraph' | 'emphasis' | 'pause';
  content: string;
  duration?: number;
}

interface IntelligentContentAnalyzerProps {
  script?: string;
  videoData?: any;
  onAnalysisComplete: (analysis: AIAnalysisResult) => void;
  onTTSGenerate: (segments: ScriptSegment[]) => void;
  onTimelineSync: (segments: ScriptSegment[]) => void;
  className?: string;
}

const IntelligentContentAnalyzer: React.FC<IntelligentContentAnalyzerProps> = ({
  script = '',
  videoData,
  onAnalysisComplete,
  onTTSGenerate,
  onTimelineSync,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'analysis' | 'tts' | 'voices' | 'sync'>('analysis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [scriptInput, setScriptInput] = useState(script);
  const [selectedVoices, setSelectedVoices] = useState<string[]>([]);
  const [ttsConfig, setTtsConfig] = useState<TTSConfiguration>({
    provider: 'azure',
    voice: 'pt-BR-FranciscaNeural',
    language: 'pt-BR',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    emotion: 'neutral',
    style: 'general'
  });
  const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSegment, setPreviewSegment] = useState<string | null>(null);

  // Biblioteca de vozes
  const voiceLibrary: VoiceProfile[] = useMemo(() => [
    // Vozes Azure Portuguesas
    {
      id: 'azure-francisca',
      name: 'Francisca',
      provider: 'azure',
      language: 'pt-BR',
      gender: 'female',
      age: 'adult',
      accent: 'brasileiro',
      characteristics: ['warm', 'friendly', 'clear', 'professional'],
      premium: false,
      rating: 4.8,
      description: 'Voz feminina brasileira, calorosa e profissional'
    },
    {
      id: 'azure-antonio',
      name: 'Antônio',
      provider: 'azure',
      language: 'pt-BR',
      gender: 'male',
      age: 'adult',
      accent: 'brasileiro',
      characteristics: ['deep', 'authoritative', 'clear', 'confident'],
      premium: false,
      rating: 4.7,
      description: 'Voz masculina brasileira, grave e autoritária'
    },
    {
      id: 'azure-camila',
      name: 'Camila',
      provider: 'azure',
      language: 'pt-BR',
      gender: 'female',
      age: 'young',
      accent: 'brasileiro',
      characteristics: ['energetic', 'youthful', 'bright', 'engaging'],
      premium: false,
      rating: 4.6,
      description: 'Voz jovem e energética, ideal para conteúdo dinâmico'
    },
    
    // Vozes ElevenLabs Premium
    {
      id: 'elevenlabs-rachel',
      name: 'Rachel',
      provider: 'elevenlabs',
      language: 'en-US',
      gender: 'female',
      age: 'adult',
      accent: 'american',
      characteristics: ['natural', 'expressive', 'versatile', 'emotional'],
      premium: true,
      rating: 4.9,
      description: 'Voz premium ultra-realística com expressividade emocional'
    },
    {
      id: 'elevenlabs-adam',
      name: 'Adam',
      provider: 'elevenlabs',
      language: 'en-US',
      gender: 'male',
      age: 'adult',
      accent: 'american',
      characteristics: ['deep', 'narrator', 'sophisticated', 'smooth'],
      premium: true,
      rating: 4.8,
      description: 'Voz masculina premium para narrações profissionais'
    },
    
    // Vozes OpenAI
    {
      id: 'openai-alloy',
      name: 'Alloy',
      provider: 'openai',
      language: 'multiple',
      gender: 'neutral',
      age: 'adult',
      accent: 'neutral',
      characteristics: ['clear', 'balanced', 'multilingual', 'reliable'],
      premium: false,
      rating: 4.5,
      description: 'Voz neutra multilingue da OpenAI'
    },
    {
      id: 'openai-nova',
      name: 'Nova',
      provider: 'openai',
      language: 'multiple',
      gender: 'female',
      age: 'young',
      accent: 'neutral',
      characteristics: ['bright', 'clear', 'modern', 'friendly'],
      premium: false,
      rating: 4.4,
      description: 'Voz feminina moderna e amigável'
    }
  ], []);

  // Provedor de IA mock (simulação)
  const analyzeContent = useCallback(async (content: string): Promise<AIAnalysisResult> => {
    setIsAnalyzing(true);
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Análise simulada baseada no conteúdo
    const words = content.toLowerCase().split(' ');
    const educationalKeywords = ['learn', 'tutorial', 'how to', 'guide', 'lesson', 'course'];
    const entertainmentKeywords = ['fun', 'funny', 'laugh', 'comedy', 'entertainment'];
    const corporateKeywords = ['business', 'company', 'corporate', 'professional', 'strategy'];
    
    const isEducational = educationalKeywords.some(kw => content.toLowerCase().includes(kw));
    const isEntertainment = entertainmentKeywords.some(kw => content.toLowerCase().includes(kw));
    const isCorporate = corporateKeywords.some(kw => content.toLowerCase().includes(kw));
    
    const result: AIAnalysisResult = {
      contentType: isEducational ? 'educational' : isEntertainment ? 'entertainment' : 
                   isCorporate ? 'corporate' : 'tutorial',
      sentiment: words.length > 50 ? 'positive' : 'neutral',
      complexity: Math.min(Math.max(Math.floor(words.length / 20), 1), 10),
      targetAudience: isEducational ? ['students', 'professionals'] : ['general public'],
      keyTopics: words.filter(w => w.length > 6).slice(0, 5),
      suggestedTags: ['video', 'content', 'tutorial', 'educational'],
      emotionalTone: isEducational ? ['informative', 'helpful'] : ['engaging', 'friendly'],
      pacing: words.length > 100 ? 'medium' : 'slow',
      suggestedVoice: isEducational ? 'azure-francisca' : 'azure-camila',
      suggestedMusic: ['ambient', 'corporate', 'upbeat'],
      confidenceScore: 0.85,
      suggestions: [
        {
          id: 'suggestion-1',
          type: 'voice',
          description: 'Recomendamos uma voz feminina profissional para este conteúdo educacional',
          confidence: 0.9,
          action: 'Usar voz Francisca (Azure)'
        },
        {
          id: 'suggestion-2',
          type: 'pacing',
          description: 'Ritmo moderado recomendado para melhor compreensão',
          confidence: 0.8,
          action: 'Definir velocidade para 0.9x'
        },
        {
          id: 'suggestion-3',
          type: 'music',
          description: 'Música ambiente sutil para manter o foco no conteúdo',
          confidence: 0.75,
          action: 'Adicionar trilha corporativa em volume baixo'
        }
      ]
    };
    
    setIsAnalyzing(false);
    return result;
  }, []);

  // Executar análise
  const handleAnalyze = useCallback(async () => {
    if (!scriptInput.trim()) return;
    
    try {
      const result = await analyzeContent(scriptInput);
      setAnalysisResult(result);
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Erro na análise:', error);
    }
  }, [scriptInput, analyzeContent, onAnalysisComplete]);

  // Segmentar script
  const segmentScript = useCallback((text: string): ScriptSegment[] => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentTime = 0;
    
    return sentences.map((sentence, index) => {
      const wordCount = sentence.trim().split(' ').length;
      const estimatedDuration = (wordCount / 2.5) * (ttsConfig.speed || 1); // palavras por segundo ajustado pela velocidade
      
      const segment: ScriptSegment = {
        id: `segment-${index}`,
        text: sentence.trim(),
        startTime: currentTime,
        duration: estimatedDuration,
        voice: ttsConfig.voice,
        config: { ...ttsConfig },
        status: 'pending'
      };
      
      currentTime += estimatedDuration + 0.5; // pausa entre sentenças
      return segment;
    });
  }, [ttsConfig]);

  // Gerar TTS
  const generateTTS = useCallback(async () => {
    if (!scriptInput.trim()) return;
    
    setIsGenerating(true);
    const segments = segmentScript(scriptInput);
    setScriptSegments(segments);
    
    // Simular geração de TTS
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      segment.status = 'generating';
      setScriptSegments([...segments]);
      
      // Simular delay de geração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      segment.status = 'completed';
      segment.audioUrl = `/api/tts/audio/${segment.id}.wav`; // URL simulada
      setScriptSegments([...segments]);
    }
    
    setIsGenerating(false);
    onTTSGenerate(segments);
  }, [scriptInput, segmentScript, onTTSGenerate]);

  // Sincronizar com timeline
  const syncWithTimeline = useCallback(() => {
    if (scriptSegments.length > 0) {
      onTimelineSync(scriptSegments);
    }
  }, [scriptSegments, onTimelineSync]);

  // Aplicar sugestão de IA
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case 'voice':
        if (suggestion.parameters?.voiceId) {
          setTtsConfig(prev => ({ ...prev, voice: suggestion.parameters.voiceId }));
        }
        break;
      case 'pacing':
        if (suggestion.parameters?.speed) {
          setTtsConfig(prev => ({ ...prev, speed: suggestion.parameters.speed }));
        }
        break;
      default:
        console.log('Aplicando sugestão:', suggestion);
    }
  }, []);

  // Formatadores
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Sistema de IA e TTS Avançado</h2>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="analysis" className="text-sm">
              <Brain className="w-4 h-4 mr-1" />
              Análise IA
            </TabsTrigger>
            <TabsTrigger value="tts" className="text-sm">
              <Mic className="w-4 h-4 mr-1" />
              TTS
            </TabsTrigger>
            <TabsTrigger value="voices" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              Vozes
            </TabsTrigger>
            <TabsTrigger value="sync" className="text-sm">
              <Clock className="w-4 h-4 mr-1" />
              Sincronização
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Análise de IA */}
          <TabsContent value="analysis" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Input de script */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Script para Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                  placeholder="Cole seu script aqui para análise de IA..."
                  className="min-h-32 bg-gray-700 border-gray-600 text-white"
                />
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !scriptInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analisar Conteúdo
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="bg-gray-700 border-gray-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Script
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultados da análise */}
            {analysisResult && (
              <>
                {/* Overview da análise */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Análise de Conteúdo
                      </div>
                      <Badge className="bg-green-600">
                        Confiança: {formatConfidence(analysisResult.confidenceScore)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Tipo de Conteúdo</label>
                        <div className="text-white font-medium capitalize">{analysisResult.contentType}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Sentimento</label>
                        <div className="text-white font-medium capitalize">{analysisResult.sentiment}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Complexidade</label>
                        <div className="flex items-center space-x-2">
                          <Progress value={analysisResult.complexity * 10} className="flex-1 h-2" />
                          <span className="text-white text-sm">{analysisResult.complexity}/10</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Ritmo Sugerido</label>
                        <div className="text-white font-medium capitalize">{analysisResult.pacing}</div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Público-alvo</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.targetAudience.map(audience => (
                          <Badge key={audience} variant="outline" className="text-xs">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Tópicos Identificados</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.keyTopics.map(topic => (
                          <Badge key={topic} variant="outline" className="text-xs bg-blue-900">
                            <Tag className="w-3 h-3 mr-1" />
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sugestões de IA */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Sugestões Inteligentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisResult.suggestions.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-green-600">
                              {formatConfidence(suggestion.confidence)}
                            </Badge>
                          </div>
                          <p className="text-sm text-white">{suggestion.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{suggestion.action}</p>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="bg-gray-600 border-gray-500 ml-3"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Sistema TTS */}
          <TabsContent value="tts" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Configurações TTS */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações de Voz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Provedor</label>
                    <select
                      value={ttsConfig.provider}
                      onChange={(e) => setTtsConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="azure">Azure Cognitive Services</option>
                      <option value="elevenlabs">ElevenLabs (Premium)</option>
                      <option value="openai">OpenAI TTS</option>
                      <option value="google">Google Cloud TTS</option>
                      <option value="aws">Amazon Polly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Idioma</label>
                    <select
                      value={ttsConfig.language}
                      onChange={(e) => setTtsConfig(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español (España)</option>
                      <option value="fr-FR">Français (France)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Velocidade: {ttsConfig.speed.toFixed(1)}x
                    </label>
                    <Slider
                      value={[ttsConfig.speed]}
                      onValueChange={(value) => setTtsConfig(prev => ({ ...prev, speed: value[0] }))}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Tom: {ttsConfig.pitch.toFixed(1)}
                    </label>
                    <Slider
                      value={[ttsConfig.pitch]}
                      onValueChange={(value) => setTtsConfig(prev => ({ ...prev, pitch: value[0] }))}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Volume: {Math.round(ttsConfig.volume * 100)}%
                    </label>
                    <Slider
                      value={[ttsConfig.volume]}
                      onValueChange={(value) => setTtsConfig(prev => ({ ...prev, volume: value[0] }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={generateTTS}
                    disabled={isGenerating || !scriptInput.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Gerar TTS
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="bg-gray-700 border-gray-600">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Segmentos gerados */}
            {scriptSegments.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center justify-between">
                    <div className="flex items-center">
                      <Music className="w-5 h-5 mr-2" />
                      Segmentos de Áudio
                    </div>
                    <Badge variant="outline">
                      {scriptSegments.length} segmentos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scriptSegments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <Badge 
                            variant={segment.status === 'completed' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              segment.status === 'completed' ? 'bg-green-600' :
                              segment.status === 'generating' ? 'bg-blue-600' :
                              segment.status === 'error' ? 'bg-red-600' : 'bg-gray-600'
                            }`}
                          >
                            {segment.status === 'completed' ? 'Pronto' :
                             segment.status === 'generating' ? 'Gerando' :
                             segment.status === 'error' ? 'Erro' : 'Pendente'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDuration(segment.duration)}
                          </span>
                        </div>
                        <p className="text-sm text-white truncate">{segment.text}</p>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-3">
                        {segment.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewSegment(segment.id)}
                            className="p-1 h-8 w-8"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {scriptSegments.some(s => s.status === 'completed') && (
                    <div className="flex space-x-2 pt-3 border-t border-gray-600">
                      <Button
                        onClick={syncWithTimeline}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Sincronizar com Timeline
                      </Button>
                      <Button variant="outline" className="bg-gray-700 border-gray-600">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Áudios
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Biblioteca de vozes */}
          <TabsContent value="voices" className="h-full p-4 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {voiceLibrary.map(voice => (
                <Card 
                  key={voice.id}
                  className={`cursor-pointer transition-colors ${
                    ttsConfig.voice === voice.id 
                      ? 'ring-2 ring-blue-500 bg-gray-700' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  } border-gray-700`}
                  onClick={() => setTtsConfig(prev => ({ ...prev, voice: voice.id }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          voice.gender === 'female' ? 'bg-pink-500' :
                          voice.gender === 'male' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <h4 className="text-white font-medium flex items-center">
                            {voice.name}
                            {voice.premium && (
                              <Badge variant="secondary" className="ml-2 bg-yellow-600 text-xs">
                                Premium
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400">{voice.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {voice.provider}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {voice.language}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-400">{voice.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle favorite logic here
                          }}
                          className="p-1 h-8 w-8"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {voice.characteristics.map(char => (
                        <Badge key={char} variant="outline" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sincronização */}
          <TabsContent value="sync" className="h-full p-4">
            <div className="text-center text-gray-400 mt-8">
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <p>Ferramentas de sincronização em desenvolvimento</p>
              <p className="text-sm mt-2">
                Sincronização automática com timeline, marcadores de tempo e ajustes finos
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IntelligentContentAnalyzer;