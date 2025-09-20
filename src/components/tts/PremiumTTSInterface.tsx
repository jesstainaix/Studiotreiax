import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Download, Settings, Volume2, Mic, AudioWaveform, Sliders, Globe, Heart, Zap, Clock, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import PremiumTTSService, { BrazilianVoice, PremiumTTSConfig, PremiumTTSOptions, PremiumTTSResponse } from '../../services/PremiumTTSService'

interface PremiumTTSInterfaceProps {
  onAudioGenerated?: (audioUrl: string, metadata: any) => void
  className?: string
  initialText?: string
}

const PremiumTTSInterface: React.FC<PremiumTTSInterfaceProps> = ({
  onAudioGenerated,
  className = '',
  initialText = ''
}) => {
  // Estados principais
  const [text, setText] = useState(initialText)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // Estados de configuração
  const [selectedVoice, setSelectedVoice] = useState<BrazilianVoice | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('azure')
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)
  const [volume, setVolume] = useState(1.0)
  const [emotion, setEmotion] = useState('neutral')
  const [accent, setAccent] = useState('neutral')
  const [quality, setQuality] = useState<'standard' | 'premium' | 'ultra'>('premium')
  
  // Estados avançados
  const [ssmlEnabled, setSsmlEnabled] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [streamingEnabled, setStreamingEnabled] = useState(false)
  const [effectsEnabled, setEffectsEnabled] = useState(false)
  const [reverbLevel, setReverbLevel] = useState(0)
  const [echoLevel, setEchoLevel] = useState(0)
  const [chorusLevel, setChorusLevel] = useState(0)
  
  // Estados de interface
  const [activeTab, setActiveTab] = useState('basic')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<BrazilianVoice[]>([])
  const [filteredVoices, setFilteredVoices] = useState<BrazilianVoice[]>([])
  const [lastResponse, setLastResponse] = useState<PremiumTTSResponse | null>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null)
  const ttsServiceRef = useRef<PremiumTTSService | null>(null)

  // Configuração do serviço TTS
  const ttsConfig: PremiumTTSConfig = {
    providers: {
      elevenlabs: {
        apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
        model: 'eleven_multilingual_v2',
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true
      },
      azure: {
        apiKey: import.meta.env.VITE_AZURE_TTS_API_KEY || '',
        region: import.meta.env.VITE_AZURE_REGION || 'brazilsouth'
      },
      google: {
        apiKey: import.meta.env.VITE_GOOGLE_TTS_API_KEY || '',
        projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID || ''
      }
    },
    realTimeEnabled: true,
    streamingEnabled: true,
    cacheEnabled: true,
    maxCacheSize: 100,
    fallbackChain: ['azure', 'google', 'elevenlabs'],
    qualityPreference: 'quality',
    brazilianVoicesOnly: true
  }

  // Inicialização
  useEffect(() => {
    const initializeTTS = async () => {
      try {
        ttsServiceRef.current = new PremiumTTSService(ttsConfig)
        const initialized = await ttsServiceRef.current.initialize()
        
        if (initialized) {
          const voices = ttsServiceRef.current.getBrazilianVoices()
          setAvailableVoices(voices)
          setFilteredVoices(voices)
          
          // Selecionar primeira voz disponível
          if (voices.length > 0) {
            setSelectedVoice(voices[0])
          }
          
          setIsInitialized(true)
          toast.success('Sistema TTS Premium inicializado com sucesso!')
        }
      } catch (error) {
        console.error('Erro na inicialização:', error)
        toast.error('Falha na inicialização do sistema TTS')
      }
    }

    initializeTTS()

    return () => {
      if (ttsServiceRef.current) {
        ttsServiceRef.current.dispose()
      }
    }
  }, [])

  // Filtrar vozes por critérios
  useEffect(() => {
    let filtered = availableVoices

    if (selectedProvider !== 'all') {
      filtered = filtered.filter(voice => voice.provider === selectedProvider)
    }

    if (accent !== 'all') {
      filtered = filtered.filter(voice => voice.accent === accent)
    }

    if (emotion !== 'all') {
      filtered = filtered.filter(voice => voice.emotion === emotion)
    }

    setFilteredVoices(filtered)
    
    // Atualizar voz selecionada se não estiver na lista filtrada
    if (selectedVoice && !filtered.find(v => v.id === selectedVoice.id)) {
      setSelectedVoice(filtered[0] || null)
    }
  }, [selectedProvider, accent, emotion, availableVoices, selectedVoice])

  // Controle de áudio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const handleGenerate = async () => {
    if (!text.trim() || !selectedVoice || !ttsServiceRef.current) {
      toast.error('Selecione uma voz e digite um texto')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const options: PremiumTTSOptions = {
        voice: selectedVoice.id,
        speed,
        pitch,
        volume,
        emotion,
        accent,
        quality,
        ssmlEnabled,
        realTime: realTimeEnabled,
        streaming: streamingEnabled,
        effects: effectsEnabled ? {
          reverb: reverbLevel,
          echo: echoLevel,
          chorus: chorusLevel,
          compressor: true,
          normalizer: true
        } : undefined
      }

      const result = await ttsServiceRef.current.synthesize(text, options)
      
      if (result.success && result.audioUrl) {
        setAudioUrl(result.audioUrl)
        setLastResponse(result)
        
        if (onAudioGenerated) {
          onAudioGenerated(result.audioUrl, result.metadata)
        }
        
        toast.success(`Áudio gerado com sucesso! (${result.provider})`)
      } else {
        toast.error(result.error || 'Erro na geração do áudio')
      }
    } catch (error) {
      console.error('Erro na síntese:', error)
      toast.error('Erro na geração do áudio')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      setProgress(0)
    }
  }

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `tts_audio_${Date.now()}.mp3`
      link.click()
    }
  }

  const handleVoicePreview = async (voice: BrazilianVoice) => {
    if (!ttsServiceRef.current) return
    
    try {
      const result = await ttsServiceRef.current.previewVoice(voice.id)
      if (result.success && result.audioUrl) {
        const audio = new Audio(result.audioUrl)
        audio.play()
      }
    } catch (error) {
      toast.error('Erro na prévia da voz')
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ultra': return 'bg-purple-500'
      case 'premium': return 'bg-blue-500'
      default: return 'bg-green-500'
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'elevenlabs': return <Zap className="w-4 h-4" />
      case 'azure': return <Globe className="w-4 h-4" />
      case 'google': return <Star className="w-4 h-4" />
      default: return <Volume2 className="w-4 h-4" />
    }
  }

  if (!isInitialized) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Inicializando Sistema TTS Premium...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">TTS Premium</CardTitle>
                <p className="text-sm text-gray-600">Sistema avançado de síntese de voz brasileira</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Avançado
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Área de texto */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Texto para síntese</label>
              <div className="text-xs text-gray-500">
                {text.length} caracteres
              </div>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o texto que deseja converter em áudio..."
              className="min-h-[120px] resize-none"
              maxLength={5000}
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={ssmlEnabled}
                onCheckedChange={setSsmlEnabled}
                id="ssml"
              />
              <label htmlFor="ssml" className="text-sm">Habilitar SSML</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="voice">Vozes</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Configurações Básicas */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Provider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azure">Azure Cognitive Services</SelectItem>
                      <SelectItem value="google">Google Cloud TTS</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="all">Todos os providers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Qualidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qualidade</label>
                  <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="ultra">Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Controles de áudio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Velocidade: {speed.toFixed(1)}x</label>
                  <Slider
                    value={[speed]}
                    onValueChange={([value]) => setSpeed(value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom: {pitch > 0 ? '+' : ''}{pitch}</label>
                  <Slider
                    value={[pitch]}
                    onValueChange={([value]) => setPitch(value)}
                    min={-20}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume: {Math.round(volume * 100)}%</label>
                  <Slider
                    value={[volume]}
                    onValueChange={([value]) => setVolume(value)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seleção de Vozes */}
        <TabsContent value="voice">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sotaque</label>
                    <Select value={accent} onValueChange={setAccent}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="neutral">Neutro</SelectItem>
                        <SelectItem value="paulista">Paulista</SelectItem>
                        <SelectItem value="carioca">Carioca</SelectItem>
                        <SelectItem value="mineiro">Mineiro</SelectItem>
                        <SelectItem value="gaucho">Gaúcho</SelectItem>
                        <SelectItem value="nordestino">Nordestino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emoção</label>
                    <Select value={emotion} onValueChange={setEmotion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="neutral">Neutro</SelectItem>
                        <SelectItem value="happy">Alegre</SelectItem>
                        <SelectItem value="sad">Triste</SelectItem>
                        <SelectItem value="excited">Animado</SelectItem>
                        <SelectItem value="calm">Calmo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lista de vozes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedVoice?.id === voice.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVoice(voice)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getProviderIcon(voice.provider)}
                          <h4 className="font-medium text-sm">{voice.name}</h4>
                        </div>
                        <Badge className={`text-xs ${getQualityColor(voice.quality)} text-white`}>
                          {voice.quality}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${
                            voice.gender === 'female' ? 'bg-pink-400' : 
                            voice.gender === 'male' ? 'bg-blue-400' : 'bg-gray-400'
                          }`}></span>
                          <span>{voice.gender === 'female' ? 'Feminino' : voice.gender === 'male' ? 'Masculino' : 'Neutro'}</span>
                        </div>
                        <div>Sotaque: {voice.accent}</div>
                        <div>Emoção: {voice.emotion}</div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">{voice.description}</p>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVoicePreview(voice)
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Prévia
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Avançadas */}
        <TabsContent value="advanced">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Opções de processamento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={realTimeEnabled}
                    onCheckedChange={setRealTimeEnabled}
                    id="realtime"
                  />
                  <label htmlFor="realtime" className="text-sm">Tempo Real</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={streamingEnabled}
                    onCheckedChange={setStreamingEnabled}
                    id="streaming"
                  />
                  <label htmlFor="streaming" className="text-sm">Streaming</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={effectsEnabled}
                    onCheckedChange={setEffectsEnabled}
                    id="effects"
                  />
                  <label htmlFor="effects" className="text-sm">Efeitos de Áudio</label>
                </div>
              </div>

              {/* Efeitos de áudio */}
              {effectsEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reverb: {reverbLevel}%</label>
                    <Slider
                      value={[reverbLevel]}
                      onValueChange={([value]) => setReverbLevel(value)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Echo: {echoLevel}%</label>
                    <Slider
                      value={[echoLevel]}
                      onValueChange={([value]) => setEchoLevel(value)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chorus: {chorusLevel}%</label>
                    <Slider
                      value={[chorusLevel]}
                      onValueChange={([value]) => setChorusLevel(value)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Controles de geração */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim() || !selectedVoice}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <AudioWaveform className="w-4 h-4 mr-2" />
                    Gerar Áudio
                  </>
                )}
              </Button>

              {audioUrl && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlay}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStop}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {selectedVoice && (
              <div className="text-right">
                <div className="text-sm font-medium">{selectedVoice.name}</div>
                <div className="text-xs text-gray-500">
                  {selectedVoice.provider} • {selectedVoice.quality}
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {(isGenerating || audioUrl) && (
            <div className="space-y-2">
              <Progress value={isGenerating ? 50 : progress} className="w-full" />
              {audioUrl && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {lastResponse?.metadata && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="font-medium text-gray-700">Tempo de processamento</div>
                  <div className="text-gray-600">{lastResponse.metadata.processingTime}ms</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Tamanho do áudio</div>
                  <div className="text-gray-600">{Math.round(lastResponse.metadata.audioSize / 1024)}KB</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Provider</div>
                  <div className="text-gray-600">{lastResponse.provider}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Cache</div>
                  <div className="text-gray-600">{lastResponse.cached ? 'Sim' : 'Não'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
        />
      )}
    </div>
  )
}

export default PremiumTTSInterface