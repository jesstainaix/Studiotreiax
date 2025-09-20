import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Slider } from '../../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Upload,
  Settings,
  User,
  Users,
  Globe,
  Brain,
  Sparkles,
  Wand2,
  FileText,
  Languages,
  Clock,
  Target,
  BarChart3,
  Headphones,
  Radio,
  Music,
  FileAudio,
  Repeat,
  SkipForward,
  SkipBack,
  RotateCcw,
  Save,
  Trash2,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Zap,
  Bot,
  MessageSquare,
  Layers,
  Waves,
  AudioWaveform
} from 'lucide-react';

interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  style: 'natural' | 'robotic' | 'dramatic' | 'calm' | 'energetic';
  provider: 'azure' | 'google' | 'amazon' | 'openai' | 'elevenlabs';
  quality: 'standard' | 'premium' | 'ultra';
  sampleUrl?: string;
  isPremium: boolean;
  emotionSupport: string[];
  speedRange: [number, number];
  pitchRange: [number, number];
}

interface AIAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  tone: string;
  keyPoints: string[];
  suggestedVoice: string;
  suggestedSpeed: number;
  suggestedPitch: number;
  estimatedDuration: number;
  wordCount: number;
  complexity: 'simple' | 'medium' | 'complex';
  emotions: string[];
}

interface TTSAIIntegrationProps {
  onAudioGenerate: (config: any) => Promise<string>;
  onAnalyzeText: (text: string) => Promise<AIAnalysisResult>;
  onAddToTimeline: (audioUrl: string, duration: number) => void;
}

const TTSAIIntegration: React.FC<TTSAIIntegrationProps> = ({
  onAudioGenerate,
  onAnalyzeText,
  onAddToTimeline
}) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('azure-jenny-neural');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [emotion, setEmotion] = useState('neutral');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Vozes disponíveis
  const voices: TTSVoice[] = [
    {
      id: 'azure-jenny-neural',
      name: 'Jenny',
      language: 'pt-BR',
      gender: 'female',
      style: 'natural',
      provider: 'azure',
      quality: 'premium',
      isPremium: false,
      emotionSupport: ['neutral', 'happy', 'sad', 'angry', 'excited', 'calm'],
      speedRange: [0.5, 2.0],
      pitchRange: [0.8, 1.2]
    },
    {
      id: 'azure-antonio-neural',
      name: 'Antônio',
      language: 'pt-BR',
      gender: 'male',
      style: 'natural',
      provider: 'azure',
      quality: 'premium',
      isPremium: false,
      emotionSupport: ['neutral', 'calm', 'confident', 'friendly'],
      speedRange: [0.5, 2.0],
      pitchRange: [0.8, 1.2]
    },
    {
      id: 'elevenlabs-rachel',
      name: 'Rachel Premium',
      language: 'pt-BR',
      gender: 'female',
      style: 'ultra',
      provider: 'elevenlabs',
      quality: 'ultra',
      isPremium: true,
      emotionSupport: ['neutral', 'happy', 'sad', 'angry', 'excited', 'whisper', 'shouting'],
      speedRange: [0.3, 3.0],
      pitchRange: [0.5, 1.5]
    },
    {
      id: 'openai-alloy',
      name: 'Alloy',
      language: 'pt-BR',
      gender: 'neutral',
      style: 'natural',
      provider: 'openai',
      quality: 'premium',
      isPremium: true,
      emotionSupport: ['neutral', 'conversational', 'narrative'],
      speedRange: [0.25, 4.0],
      pitchRange: [1.0, 1.0]
    }
  ];

  const emotions = [
    'neutral', 'happy', 'sad', 'angry', 'excited', 'calm', 
    'confident', 'friendly', 'whisper', 'shouting', 'conversational'
  ];

  const handleAnalyzeText = async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await onAnalyzeText(text);
      setAnalysisResult(result);
      
      // Aplicar sugestões da IA
      if (result.suggestedVoice) {
        setSelectedVoice(result.suggestedVoice);
      }
      setSpeed(result.suggestedSpeed);
      setPitch(result.suggestedPitch);
      
      // Sugerir emoção baseada no sentimento
      if (result.sentiment === 'positive') {
        setEmotion('happy');
      } else if (result.sentiment === 'negative') {
        setEmotion('sad');
      } else {
        setEmotion('neutral');
      }
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!text.trim() || !selectedVoice) return;
    
    setIsGenerating(true);
    try {
      const config = {
        text,
        voice: selectedVoice,
        speed,
        pitch,
        volume,
        emotion,
        language: 'pt-BR'
      };
      
      const audioUrl = await onAudioGenerate(config);
      setGeneratedAudioUrl(audioUrl);
    } catch (error) {
      console.error('Erro na geração:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAudio = () => {
    if (!audioRef.current || !generatedAudioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = generatedAudioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAddToTimeline = () => {
    if (generatedAudioUrl && analysisResult) {
      onAddToTimeline(generatedAudioUrl, analysisResult.estimatedDuration);
    }
  };

  const saveCurrentConfig = () => {
    const config = {
      id: Date.now().toString(),
      name: `Configuração ${savedConfigs.length + 1}`,
      voice: selectedVoice,
      speed,
      pitch,
      volume,
      emotion,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      createdAt: new Date().toISOString()
    };
    setSavedConfigs([...savedConfigs, config]);
  };

  const loadConfig = (config: any) => {
    setSelectedVoice(config.voice);
    setSpeed(config.speed);
    setPitch(config.pitch);
    setVolume(config.volume);
    setEmotion(config.emotion);
  };

  const selectedVoiceData = voices.find(v => v.id === selectedVoice);

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Text-to-Speech & IA
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate">Gerar</TabsTrigger>
              <TabsTrigger value="voices">Vozes</TabsTrigger>
              <TabsTrigger value="analysis">Análise IA</TabsTrigger>
              <TabsTrigger value="library">Biblioteca</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              {/* Texto de Entrada */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto para Narração</label>
                <Textarea
                  placeholder="Digite o texto que será convertido em áudio..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{text.length} caracteres</span>
                  <span>≈ {Math.ceil(text.split(' ').length / 150)} min de áudio</span>
                </div>
              </div>

              {/* Controles de IA */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleAnalyzeText}
                  disabled={!text.trim() || isAnalyzing}
                  variant="outline"
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                </Button>
                
                <Button
                  onClick={() => {
                    // Sugestões automáticas da IA
                    setText(text + '\n\n[IA] Sugestão: Adicionar pausa dramática aqui para maior impacto.');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sugestões IA
                </Button>
              </div>

              {/* Seleção de Voz */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Voz</label>
                <div className="grid grid-cols-2 gap-2">
                  {voices.map(voice => (
                    <div
                      key={voice.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVoice === voice.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedVoice(voice.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{voice.name}</h4>
                          <p className="text-xs text-gray-500">{voice.language} • {voice.gender}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge variant={voice.isPremium ? 'default' : 'secondary'} className="text-xs">
                              {voice.quality}
                            </Badge>
                            {voice.isPremium && (
                              <Badge variant="outline" className="text-xs">Premium</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles de Parâmetros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Velocidade</label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[speed]}
                      onValueChange={([value]) => setSpeed(value)}
                      min={selectedVoiceData?.speedRange[0] || 0.5}
                      max={selectedVoiceData?.speedRange[1] || 2.0}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{speed.toFixed(1)}x</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom</label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[pitch]}
                      onValueChange={([value]) => setPitch(value)}
                      min={selectedVoiceData?.pitchRange[0] || 0.8}
                      max={selectedVoiceData?.pitchRange[1] || 1.2}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{pitch.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume</label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[volume]}
                      onValueChange={([value]) => setVolume(value)}
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{Math.round(volume * 100)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Emoção</label>
                  <select
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    {emotions.filter(em => 
                      selectedVoiceData?.emotionSupport.includes(em) || em === 'neutral'
                    ).map(em => (
                      <option key={em} value={em}>
                        {em.charAt(0).toUpperCase() + em.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleGenerateAudio}
                  disabled={!text.trim() || isGenerating}
                  className="flex-1"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Gerando...' : 'Gerar Áudio'}
                </Button>
                
                <Button
                  onClick={saveCurrentConfig}
                  variant="outline"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>

              {/* Player de Áudio */}
              {generatedAudioUrl && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={handlePlayAudio}
                          size="sm"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <div>
                          <p className="text-sm font-medium">Áudio Gerado</p>
                          <p className="text-xs text-gray-500">
                            {selectedVoiceData?.name} • {speed}x • {emotion}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleAddToTimeline}
                          size="sm"
                          variant="outline"
                        >
                          <Layers className="w-4 h-4 mr-2" />
                          Adicionar à Timeline
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <audio
                      ref={audioRef}
                      onEnded={() => setIsPlaying(false)}
                      className="w-full mt-3"
                      controls
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              {analysisResult && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análise IA do Texto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Sentimento</h4>
                          <Badge 
                            variant={
                              analysisResult.sentiment === 'positive' ? 'default' :
                              analysisResult.sentiment === 'negative' ? 'destructive' : 'secondary'
                            }
                          >
                            {analysisResult.sentiment}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Tom</h4>
                          <p className="text-sm text-gray-600">{analysisResult.tone}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Complexidade</h4>
                          <Badge variant="outline">{analysisResult.complexity}</Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Duração Estimada</h4>
                          <p className="text-sm text-gray-600">
                            {Math.floor(analysisResult.estimatedDuration / 60)}:
                            {Math.floor(analysisResult.estimatedDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Pontos-chave</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {analysisResult.keyPoints.map((point, index) => (
                            <li key={index} className="text-sm text-gray-600">{point}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Emoções Detectadas</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.emotions.map(emotion => (
                            <Badge key={emotion} variant="outline" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="library" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Configurações Salvas</h3>
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
              
              <div className="space-y-2">
                {savedConfigs.map(config => (
                  <Card key={config.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{config.name}</h4>
                          <p className="text-xs text-gray-500">{config.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {voices.find(v => v.id === config.voice)?.name}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {config.speed}x • {config.emotion}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => loadConfig(config)}
                            size="sm"
                            variant="ghost"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => setSavedConfigs(configs => 
                              configs.filter(c => c.id !== config.id)
                            )}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {savedConfigs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileAudio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma configuração salva</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TTSAIIntegration;