import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Download,
  Settings,
  Mic,
  Waveform,
  TestTube,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ttsService, TTSVoice, TTSResponse } from '../../lib/tts/TTSService';
import { toast } from 'sonner';

interface VoicePreviewPanelProps {
  selectedVoice?: TTSVoice;
  onVoiceSelect: (voice: TTSVoice) => void;
  sampleText?: string;
  className?: string;
}

export const VoicePreviewPanel: React.FC<VoicePreviewPanelProps> = ({
  selectedVoice,
  onVoiceSelect,
  sampleText,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioResponse, setAudioResponse] = useState<TTSResponse | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ttsServiceRef = useRef(ttsService);

  // Sample texts for different voice testing scenarios
  const sampleTexts = {
    safety: "Atenção! O uso de EPIs é obrigatório nesta área. Capacetes, óculos de proteção e calçados de segurança devem ser utilizados conforme a NR-6.",
    technical: "A CIPA deve realizar reuniões mensais para discussão dos temas relacionados à prevenção de acidentes e doenças ocupacionais conforme estabelecido na NR-5.",
    friendly: "Bem-vindos ao treinamento de segurança do trabalho! Hoje vamos aprender sobre a importância da prevenção de acidentes no ambiente laboral.",
    authoritative: "É responsabilidade do empregador fornecer gratuitamente EPIs adequados ao risco e em perfeito estado de conservação e funcionamento."
  };

  const [customText, setCustomText] = useState(sampleText || sampleTexts.safety);

  // Available voices from TTS service
  const availableVoices = ttsServiceRef.current.getVoices();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioResponse]);

  const handleVoicePreview = async (voice: TTSVoice) => {
    if (!voice) return;

    setIsLoading(true);
    try {
      const response = await ttsServiceRef.current.synthesize({
        text: customText,
        voiceId: voice.id,
        provider: voice.provider,
        options: {
          speed,
          pitch,
          useEnhancedModel: true
        },
        outputFormat: 'mp3',
        ssmlEnabled: true
      });

      if (response.success && response.audioUrl) {
        setAudioResponse(response);
        
        // Load audio for playback
        if (audioRef.current) {
          audioRef.current.src = response.audioUrl;
          audioRef.current.load();
        }
        
        toast.success(`Voz ${voice.name} carregada com sucesso!`);
      } else {
        toast.error(`Erro ao gerar áudio: ${response.error}`);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast.error('Erro ao conectar com o serviço de voz');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioResponse) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (audioResponse?.audioUrl) {
      const link = document.createElement('a');
      link.href = audioResponse.audioUrl;
      link.download = `voice-preview-${selectedVoice?.name.toLowerCase().replace(/\s+/g, '-')}.mp3`;
      link.click();
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Preview de Voz
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Vozes Disponíveis</h4>
          <div className="grid grid-cols-1 gap-2">
            {availableVoices.map((voice) => (
              <Card
                key={voice.id}
                className={`cursor-pointer transition-all ${
                  selectedVoice?.id === voice.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => onVoiceSelect(voice)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{voice.name}</h5>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {voice.gender}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {voice.style}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {voice.provider}
                        </Badge>
                      </div>
                      {voice.characteristics && (
                        <p className="text-xs text-gray-600 mt-1">
                          {voice.characteristics.join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoicePreview(voice);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading && selectedVoice?.id === voice.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sample Text Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Texto de Teste</h4>
          <div className="flex gap-2 mb-3">
            {Object.entries(sampleTexts).map(([key, text]) => (
              <Button
                key={key}
                size="sm"
                variant={customText === text ? 'default' : 'outline'}
                onClick={() => setCustomText(text)}
                className="text-xs"
              >
                {key === 'safety' && 'Segurança'}
                {key === 'technical' && 'Técnico'}
                {key === 'friendly' && 'Amigável'}
                {key === 'authoritative' && 'Autoritativo'}
              </Button>
            ))}
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full h-20 p-3 border rounded-lg text-sm resize-none"
            placeholder="Digite o texto para teste de voz..."
          />
        </div>

        {/* Voice Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Velocidade: {speed}x</label>
            <Slider
              value={[speed]}
              onValueChange={(value) => setSpeed(value[0])}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tom: {pitch > 0 ? '+' : ''}{pitch}</label>
            <Slider
              value={[pitch]}
              onValueChange={(value) => setPitch(value[0])}
              min={-10}
              max={10}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        {/* Audio Player */}
        {audioResponse && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={togglePlayback}
                  disabled={!audioResponse.audioUrl}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button size="sm" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                  <span className="text-xs text-gray-500 w-8">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <Button size="sm" variant="outline" onClick={downloadAudio}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Audio info */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span>Caracteres: {audioResponse.characterCount}</span>
                <span>Provider: {audioResponse.provider}</span>
                {audioResponse.duration && (
                  <span>Duração: {formatTime(audioResponse.duration)}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Processado</span>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => selectedVoice && handleVoicePreview(selectedVoice)}
            disabled={!selectedVoice || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Waveform className="w-4 h-4 mr-2" />
                Gerar Preview
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <audio ref={audioRef} preload="metadata" />
      </CardContent>
    </Card>
  );
};

export default VoicePreviewPanel;