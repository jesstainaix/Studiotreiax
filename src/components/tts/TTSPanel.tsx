import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Mic, 
  Play, 
  Pause, 
  Square,
  Volume2, 
  Settings,
  Download,
  Sparkles,
  User,
  Heart
} from 'lucide-react';
import useTTS from '@/hooks/useTTS';
import { TTSVoice, TTSRequest } from '@/services/ttsService';

interface TTSPanelProps {
  onAudioGenerated?: (audioUrl: string, config: TTSConfig) => void;
  onAddToTimeline?: (audioUrl: string, duration: number) => void;
  selectedText?: string;
  className?: string;
}

interface TTSConfig {
  voice: string;
  provider: string;
  speed: number;
  pitch: number;
  volume: number;
  language: string;
}

const TTSPanel: React.FC<TTSPanelProps> = ({
  onAudioGenerated,
  onAddToTimeline,
  selectedText = '',
  className = ''
}) => {
  const {
    isInitialized,
    isGenerating,
    isPlaying,
    progress,
    error,
    lastResponse,
    initializeTTS,
    synthesizeSpeech,
    playAudio,
    pauseAudio,
    stopAudio,
    getAllVoices,
    getVoicesForProvider,
    getAvailableProviders,
    clearError
  } = useTTS();

  const [config, setConfig] = useState<TTSConfig>({
    voice: 'pt-BR-Neural2-A',
    provider: 'google',
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
    language: 'pt-BR'
  });

  const [text, setText] = useState('');
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  // NEW: elemento de áudio local e estado do preview
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  // Rastreamento de object URLs e URLs travadas (usadas na timeline)
  const lastObjectUrlRef = useRef<string | null>(null);
  const lockedUrlsRef = useRef<Set<string>>(new Set());

  // Initialize TTS service
  useEffect(() => {
    if (!isInitialized) {
      initializeTTS();
    }
  }, [isInitialized, initializeTTS]);

  // Load providers and voices
  useEffect(() => {
    if (isInitialized) {
      const availableProviders = getAvailableProviders();
      setProviders(availableProviders);
      
      if (availableProviders.length > 0 && !availableProviders.includes(config.provider)) {
        setConfig(prev => ({ ...prev, provider: availableProviders[0] }));
      }
    }
  }, [isInitialized, getAvailableProviders, config.provider]);

  // Load voices for selected provider
  useEffect(() => {
    if (isInitialized && config.provider) {
      const providerVoices = getVoicesForProvider(config.provider);
      setVoices(providerVoices);
      
      // Set default voice if current voice is not available
      if (providerVoices.length > 0 && !providerVoices.find(v => v.id === config.voice)) {
        const brazilianVoices = providerVoices.filter(v => v.language.includes('pt-BR'));
        const defaultVoice = brazilianVoices.length > 0 ? brazilianVoices[0] : providerVoices[0];
        setConfig(prev => ({ ...prev, voice: defaultVoice.id }));
      }
    }
  }, [isInitialized, config.provider, getVoicesForProvider, config.voice]);

  // Update text when selectedText changes
  useEffect(() => {
    if (selectedText && selectedText !== text) {
      setText(selectedText);
    }
  }, [selectedText, text]);

  // Reset ao receber novo áudio (preview local) + revogação segura de object URLs anteriores
  useEffect(() => {
    if (!audioRef.current || !previewAudio) return;

    // Revoga o object URL anterior se não estiver "travado" (não foi adicionado à timeline)
    const prev = lastObjectUrlRef.current;
    if (prev && prev !== previewAudio && prev.startsWith('blob:') && !lockedUrlsRef.current.has(prev)) {
      try { URL.revokeObjectURL(prev); } catch {}
    }

    // Atualiza src e estado
    audioRef.current.src = previewAudio;
    audioRef.current.currentTime = 0;
    setIsPreviewPlaying(false);
    setPlaybackProgress(0);

    // Se novo src for um object URL, guarda referência
    if (previewAudio.startsWith('blob:')) {
      lastObjectUrlRef.current = previewAudio;
    } else {
      lastObjectUrlRef.current = null;
    }
  }, [previewAudio]);

  // Cleanup no unmount: pausar, limpar src e revogar object URL se apropriado
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current.src = '';
      }
      const last = lastObjectUrlRef.current;
      if (last && last.startsWith('blob:') && !lockedUrlsRef.current.has(last)) {
        try { URL.revokeObjectURL(last); } catch {}
      }
      lastObjectUrlRef.current = null;
    };
  }, []);

  // Aplicar volume no preview local
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, config.volume));
    }
  }, [config.volume]);

  const handleConfigChange = useCallback((key: keyof TTSConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerateAudio = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Por favor, insira o texto para gerar o áudio');
      return;
    }

    if (!isInitialized) {
      toast.error('Serviço TTS não inicializado');
      return;
    }

    clearError();

    const request: TTSRequest = {
      text: text.trim(),
      voice: config.voice,
      provider: config.provider,
      language: config.language,
      speed: config.speed,
      pitch: config.pitch,
      volume: config.volume,
      format: 'mp3'
    };

    try {
      const response = await synthesizeSpeech(request);
      
      if (response.success && response.audioUrl) {
        setPreviewAudio(response.audioUrl);
        onAudioGenerated?.(response.audioUrl, config);
        toast.success('Áudio gerado com sucesso!');
      } else {
        toast.error(response.error || 'Erro ao gerar áudio');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast.error('Erro ao gerar áudio');
    }
  }, [text, config, isInitialized, synthesizeSpeech, clearError, onAudioGenerated]);


  const handleAddToTimeline = useCallback(() => {
    if (previewAudio && lastResponse?.metadata?.duration) {
      onAddToTimeline?.(previewAudio, lastResponse.metadata.duration);
      // Travar URL se for um object URL para evitar revogação prematura
      if (previewAudio.startsWith('blob:')) {
        lockedUrlsRef.current.add(previewAudio);
      }
      toast.success('Áudio adicionado à timeline!');
    } else {
      toast.error('Gere o áudio primeiro para adicionar à timeline');
    }
  }, [previewAudio, lastResponse, onAddToTimeline]);

  const getVoiceDisplayName = (voice: TTSVoice) => {
    const genderIcon = voice.gender === 'female' ? '👩' : voice.gender === 'male' ? '👨' : '🤖';
    return `${genderIcon} ${voice.name}`;
  };

  const getProviderDisplayName = (provider: string) => {
    const providerNames: Record<string, string> = {
      google: 'Google Cloud TTS',
      azure: 'Azure Speech',
      elevenlabs: 'ElevenLabs',
      browser: 'Navegador'
    };
    return providerNames[provider] || provider;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-blue-600" />
          Sistema TTS Integrado
          <Badge variant="outline" className="ml-auto">
            {providers.length} provedores
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="mt-1 text-red-600 hover:text-red-700"
            >
              Limpar erro
            </Button>
          </div>
        )}

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>Provedor TTS</Label>
          <Select 
            value={config.provider} 
            onValueChange={(value) => handleConfigChange('provider', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider} value={provider}>
                  {getProviderDisplayName(provider)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <Label>Voz</Label>
          <Select 
            value={config.voice} 
            onValueChange={(value) => handleConfigChange('voice', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map(voice => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex items-center gap-2">
                    <span>{getVoiceDisplayName(voice)}</span>
                    <Badge variant="outline" className="text-xs">
                      {voice.language}
                    </Badge>
                    {voice.accent && (
                      <Badge variant="secondary" className="text-xs">
                        {voice.accent}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <Label>Texto para Narração</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite o texto que será convertido em áudio..."
            rows={4}
            className="resize-none"
          />
          <div className="text-xs text-gray-500">
            {text.length} caracteres
          </div>
        </div>

        {/* Audio Controls */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Velocidade: {config.speed}x</Label>
            <Slider
              value={[config.speed]}
              onValueChange={([value]) => handleConfigChange('speed', value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tom: {config.pitch > 0 ? '+' : ''}{config.pitch}</Label>
            <Slider
              value={[config.pitch]}
              onValueChange={([value]) => handleConfigChange('pitch', value)}
              min={-20}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Volume: {Math.round(config.volume * 100)}%</Label>
            <Slider
              value={[config.volume]}
              onValueChange={([value]) => handleConfigChange('volume', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Gerando áudio...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Progress Bar - Reprodução */}
        {previewAudio && !isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prévia</span>
              <span>{Math.round(playbackProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, playbackProgress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateAudio}
            disabled={!text.trim() || isGenerating || !isInitialized}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Gerar Áudio
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              if (!previewAudio) {
                toast.error('Gere o áudio primeiro para fazer o preview');
                return;
              }
              const el = audioRef.current;
              if (!el) return;
              if (isPreviewPlaying) {
                el.pause();
              } else {
                el.play();
              }
            }}
            disabled={!previewAudio}
          >
            {isPreviewPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              const el = audioRef.current;
              if (el) {
                el.pause();
                el.currentTime = 0;
              }
              setIsPreviewPlaying(false);
              setPlaybackProgress(0);
            }}
            disabled={!isPreviewPlaying}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>

        {/* Add to Timeline */}
        {previewAudio && onAddToTimeline && (
          <Button 
            onClick={handleAddToTimeline}
            variant="secondary"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Adicionar à Timeline
          </Button>
        )}

        {/* Elemento de áudio visível para preview */}
        {previewAudio && (
          <div className="mt-2">
            <audio
              ref={audioRef}
              src={previewAudio}
              controls
              className="w-full"
              onPlay={() => setIsPreviewPlaying(true)}
              onPause={() => setIsPreviewPlaying(false)}
              onEnded={() => {
                setIsPreviewPlaying(false);
                setPlaybackProgress(100);
              }}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration && !isNaN(el.duration) && el.duration > 0) {
                  setPlaybackProgress((el.currentTime / el.duration) * 100);
                }
              }}
            />
          </div>
        )}

        {/* Audio Info */}
        {lastResponse?.metadata && (
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Provedor:</span>
                <span className="font-medium">{lastResponse.metadata.provider}</span>
              </div>
              <div className="flex justify-between">
                <span>Duração:</span>
                <span className="font-medium">{lastResponse.metadata.duration}s</span>
              </div>
              <div className="flex justify-between">
                <span>Tamanho:</span>
                <span className="font-medium">{Math.round(lastResponse.metadata.size / 1024)}KB</span>
              </div>
              {lastResponse.metadata.cost && (
                <div className="flex justify-between">
                  <span>Custo:</span>
                  <span className="font-medium">${lastResponse.metadata.cost.toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TTSPanel;