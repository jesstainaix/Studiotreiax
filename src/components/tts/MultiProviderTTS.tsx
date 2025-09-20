import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Settings, 
  Mic, 
  Volume2, 
  Zap, 
  Cloud, 
  Globe, 
  Cpu,
  CheckCircle,
  AlertCircle,
  Loader2,
  AudioWaveform,
  Timer,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useTTS } from '../../hooks/useTTS';

interface TTSProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  quality: 'high' | 'medium' | 'low';
  speed: 'fast' | 'medium' | 'slow';
  cost: 'free' | 'low' | 'medium' | 'high';
  status: 'available' | 'unavailable' | 'checking';
  description: string;
}

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
  preview?: string;
  accent?: string;
}

const MultiProviderTTS: React.FC = () => {
  // State management
  const [text, setText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('elevenlabs');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [volume, setVolume] = useState([1.0]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, 'available' | 'unavailable' | 'checking'>>({});
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);

  // TTS Hook
  const {
    synthesizeSpeech,
    getAvailableProviders,
    getVoicesForProvider,
    isProviderAvailable
  } = useTTS();

  // Provider configurations
  const providers: TTSProvider[] = [
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      icon: <Zap className="w-4 h-4" />,
      quality: 'high',
      speed: 'fast',
      cost: 'medium',
      status: providerStatus.elevenlabs || 'checking',
      description: 'Voz mais natural com IA avançada e clonagem de voz'
    },
    {
      id: 'azure',
      name: 'Azure Speech',
      icon: <Cloud className="w-4 h-4" />,
      quality: 'high',
      speed: 'medium',
      cost: 'low',
      status: providerStatus.azure || 'checking',
      description: 'Serviço empresarial da Microsoft com alta confiabilidade'
    },
    {
      id: 'google',
      name: 'Google Cloud TTS',
      icon: <Globe className="w-4 h-4" />,
      quality: 'high',
      speed: 'medium',
      cost: 'low',
      status: providerStatus.google || 'checking',
      description: 'TTS do Google com suporte a múltiplos idiomas'
    },
    {
      id: 'browser',
      name: 'Navegador',
      icon: <Cpu className="w-4 h-4" />,
      quality: 'medium',
      speed: 'fast',
      cost: 'free',
      status: providerStatus.browser || 'available',
      description: 'Síntese nativa do navegador - gratuita e offline'
    }
  ];

  // Check provider availability
  useEffect(() => {
    const checkProviders = async () => {
      const availableProviders = getAvailableProviders();
      const status: Record<string, 'available' | 'unavailable' | 'checking'> = {};
      
      for (const provider of providers) {
        const isAvailable = isProviderAvailable(provider.id);
        status[provider.id] = isAvailable ? 'available' : 'unavailable';
      }
      
      setProviderStatus(status);
    };

    checkProviders();
  }, [getAvailableProviders, isProviderAvailable]);

  // Load voices for selected provider
  useEffect(() => {
    if (selectedProvider) {
      const providerVoices = getVoicesForProvider(selectedProvider);
      setVoices(providerVoices.map(voice => ({
        id: voice.id,
        name: voice.name,
        language: voice.language,
        gender: voice.gender,
        provider: voice.provider,
        preview: voice.preview
      })));
      
      // Auto-select first voice if none selected
      if (providerVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(providerVoices[0].id);
      }
    }
  }, [selectedProvider, getVoicesForProvider]);

  // Estimate cost and duration
  useEffect(() => {
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    
    // Cost estimation (simplified)
    const costPerChar = {
      elevenlabs: 0.0001,
      azure: 0.00005,
      google: 0.00004,
      browser: 0
    };
    
    const cost = chars * (costPerChar[selectedProvider as keyof typeof costPerChar] || 0);
    setEstimatedCost(cost);
    
    // Duration estimation (words per minute)
    const wpm = 160 * speed[0];
    const duration = (words / wpm) * 60;
    setEstimatedDuration(duration);
  }, [text, selectedProvider, speed]);

  // Generate speech
  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Digite um texto para gerar áudio');
      return;
    }

    if (!selectedVoice) {
      toast.error('Selecione uma voz');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await synthesizeSpeech({
        text,
        voice: selectedVoice,
        provider: selectedProvider,
        language: 'pt-BR',
        speed: speed[0],
        pitch: pitch[0],
        volume: volume[0],
        format: 'mp3'
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.success && response.audioUrl) {
        setAudioUrl(response.audioUrl);
        toast.success('Áudio gerado com sucesso!');
      } else {
        throw new Error(response.error || 'Falha na geração do áudio');
      }
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Falha desconhecida'}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Play/pause audio
  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setIsPlaying(false);
    } else {
      if (currentAudio) {
        currentAudio.play();
      } else {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.play();
        setCurrentAudio(audio);
      }
      setIsPlaying(true);
    }
  };

  // Stop audio
  const handleStop = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Download audio
  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `tts-audio-${Date.now()}.mp3`;
      link.click();
    }
  };

  // Get provider status badge
  const getProviderStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Disponível</Badge>;
      case 'unavailable':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Indisponível</Badge>;
      case 'checking':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verificando</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Sistema TTS Multi-Provedor</h1>
        <p className="text-gray-600">Converta texto em fala com IA avançada e múltiplos provedores</p>
      </div>

      {/* Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Modo de Interface</Label>
              <p className="text-sm text-gray-500">
                {isAdvancedMode ? 'Controles avançados para usuários técnicos' : 'Interface simplificada para uso geral'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="advanced-mode">Modo Avançado</Label>
              <Switch
                id="advanced-mode"
                checked={isAdvancedMode}
                onCheckedChange={setIsAdvancedMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Texto para Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite ou cole o texto que deseja converter em áudio..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{text.length} caracteres</span>
                <span>{text.trim().split(/\s+/).length} palavras</span>
              </div>
            </CardContent>
          </Card>

          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Provedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProvider === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      provider.status === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (provider.status === 'available') {
                        setSelectedProvider(provider.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {provider.icon}
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      {getProviderStatusBadge(provider.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        Qualidade: {provider.quality}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Velocidade: {provider.speed}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Custo: {provider.cost}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Voice and Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Voz</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="voice" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="voice">Voz</TabsTrigger>
                  <TabsTrigger value="settings">Ajustes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="voice" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selecionar Voz</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma voz" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{voice.name}</span>
                              <div className="flex gap-1 ml-2">
                                <Badge variant="outline" className="text-xs">
                                  {voice.gender}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {voice.language}
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-6">
                  {/* Speed Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Velocidade</Label>
                      <span className="text-sm text-gray-500">{speed[0]}x</span>
                    </div>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {isAdvancedMode && (
                    <>
                      {/* Pitch Control */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Tom (Pitch)</Label>
                          <span className="text-sm text-gray-500">{pitch[0] > 0 ? '+' : ''}{pitch[0]}%</span>
                        </div>
                        <Slider
                          value={pitch}
                          onValueChange={setPitch}
                          min={-50}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      {/* Volume Control */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Volume</Label>
                          <span className="text-sm text-gray-500">{Math.round(volume[0] * 100)}%</span>
                        </div>
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Generation Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AudioWaveform className="w-5 h-5" />
                Controles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim() || !selectedVoice}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Gerar Áudio
                  </>
                )}
              </Button>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                </div>
              )}

              {audioUrl && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePlayPause}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isPlaying ? (
                        <><Pause className="w-4 h-4 mr-1" />Pausar</>
                      ) : (
                        <><Play className="w-4 h-4 mr-1" />Reproduzir</>
                      )}
                    </Button>
                    <Button
                      onClick={handleStop}
                      variant="outline"
                      size="sm"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estimates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estimativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duração:</span>
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {estimatedDuration < 60 
                      ? `${Math.round(estimatedDuration)}s`
                      : `${Math.floor(estimatedDuration / 60)}m ${Math.round(estimatedDuration % 60)}s`
                    }
                  </span>
                </div>
              </div>
              
              {estimatedCost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custo estimado:</span>
                  <span className="font-medium">
                    ${estimatedCost.toFixed(4)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Provedor:</span>
                <span className="font-medium">{providers.find(p => p.id === selectedProvider)?.name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Dicas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• ElevenLabs oferece a melhor qualidade de voz</p>
              <p>• Azure e Google são ideais para uso empresarial</p>
              <p>• Navegador é gratuito mas com qualidade limitada</p>
              <p>• Velocidade 1.0x é a mais natural</p>
              <p>• Use modo avançado para controle total</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MultiProviderTTS;