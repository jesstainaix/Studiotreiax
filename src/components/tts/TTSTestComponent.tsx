import React, { useState, useEffect } from 'react';
import { useTTS } from '../../hooks/useTTS';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Play, Square, RefreshCw, Volume2, AlertCircle, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface TTSTestComponentProps {
  className?: string;
}

export const TTSTestComponent: React.FC<TTSTestComponentProps> = ({ className }) => {
  const [testText, setTestText] = useState('Olá! Este é um teste do sistema de síntese de voz.');
  const [currentProvider, setCurrentProvider] = useState('elevenlabs');
  const [currentVoice, setCurrentVoice] = useState('');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  
  const {
    isInitialized,
    isGenerating,
    isPlaying,
    progress,
    error,
    lastResponse,
    currentAudio,
    initializeTTS,
    synthesizeSpeech,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    getAvailableProviders,
    isProviderAvailable,
    getVoicesForProvider,
    getAllVoices,
    clearError,
    reset
  } = useTTS({
    autoInitialize: true,
    defaultProvider: currentProvider,
    cacheEnabled: true
  });

  // Initialize providers and voices on mount
  useEffect(() => {
    if (isInitialized) {
      const providers = getAvailableProviders();
      setAvailableProviders(providers);
      
      if (providers.length > 0 && !currentProvider) {
        setCurrentProvider(providers[0]);
      }
    }
  }, [isInitialized, getAvailableProviders]);

  // Update voices when provider changes
  useEffect(() => {
    if (currentProvider) {
      const providerVoices = getVoicesForProvider(currentProvider);
      setVoices(providerVoices);
      
      if (providerVoices.length > 0 && !currentVoice) {
        setCurrentVoice(providerVoices[0].id);
      }
    }
  }, [currentProvider, getVoicesForProvider]);

  const handleSynthesize = async () => {
    if (!testText.trim()) {
      toast.error('Digite um texto para sintetizar');
      return;
    }

    if (!isInitialized) {
      toast.error('Sistema TTS não inicializado');
      return;
    }

    try {
      const response = await synthesizeSpeech({
        text: testText,
        provider: currentProvider,
        voice: currentVoice,
        options: {
          speed: 1.0,
          pitch: 0.0
        }
      });

      if (response.success && response.audioUrl) {
        toast.success('Áudio sintetizado com sucesso!');
      } else {
        toast.error(response.error || 'Erro na síntese de voz');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast.error('Erro ao sintetizar áudio');
    }
  };

  const handleProviderChange = (provider: string) => {
    setCurrentProvider(provider);
    setCurrentVoice(''); // Reset voice when provider changes
  };

  const handleVoiceChange = (voice: string) => {
    setCurrentVoice(voice);
  };

  const handlePlay = () => {
    if (lastResponse?.audioUrl) {
      playAudio(lastResponse.audioUrl);
    } else {
      toast.error('Nenhum áudio disponível para reproduzir');
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  };

  const handleStop = () => {
    stopAudio();
  };

  const handleRefresh = () => {
    const providers = getAvailableProviders();
    setAvailableProviders(providers);
    toast.success('Provedores atualizados');
  };

  const currentProviderData = {
    name: currentProvider,
    displayName: currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1),
    isAvailable: isProviderAvailable(currentProvider),
    description: `Provedor ${currentProvider} para síntese de voz`
  };
  
  const currentVoiceData = voices.find(v => v.id === currentVoice);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Teste do Sistema TTS
          </CardTitle>
          <CardDescription>
            Teste a síntese de voz com diferentes provedores e configurações
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração do Provedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provedor TTS</label>
              <div className="flex gap-2">
                <Select value={currentProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map((provider) => (
                      <SelectItem 
                        key={provider} 
                        value={provider}
                        disabled={!isProviderAvailable(provider)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{provider}</span>
                          <Badge 
                            variant={isProviderAvailable(provider) ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isProviderAvailable(provider) ? 'Disponível' : 'Indisponível'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {currentProviderData && (
                <p className="text-xs text-muted-foreground">
                  {currentProviderData.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Voz</label>
              <Select value={currentVoice} onValueChange={handleVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma voz" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span>{voice.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {voice.language} • {voice.gender}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentVoiceData && (
                <p className="text-xs text-muted-foreground">
                  {currentVoiceData.description}
                </p>
              )}
            </div>
          </div>

          {!isProviderAvailable(currentProvider) && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Provedor não disponível</span>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Text Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Texto para Síntese</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Digite o texto que deseja sintetizar..."
              className="w-full h-32 p-3 border rounded-md resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              {testText.length} caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSynthesize}
              disabled={isGenerating || !testText.trim() || !isProviderAvailable(currentProvider) || !isInitialized}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sintetizando...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Sintetizar
                </>
              )}
            </Button>
            
            {lastResponse?.audioUrl && (
              <>
                <Button 
                  variant="outline"
                  onClick={handlePlay}
                  disabled={isPlaying || isGenerating}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={isPlaying ? handlePause : handlePlay}
                  disabled={!lastResponse?.audioUrl}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleStop}
                  disabled={!isPlaying}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Progress indicator */}
          {isGenerating && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Player */}
      {lastResponse?.audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Player de Áudio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <audio 
                controls 
                src={lastResponse.audioUrl}
                className="w-full"
              />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Provedor: {lastResponse.provider || currentProvider}</span>
                <span>Voz: {lastResponse.voice || currentVoice}</span>
                {lastResponse.duration && <span>Duração: {lastResponse.duration}s</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Provedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableProviders.map((provider) => (
              <div 
                key={provider}
                className="p-3 border rounded-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm capitalize">{provider}</span>
                  <Badge 
                    variant={isProviderAvailable(provider) ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isProviderAvailable(provider) ? 'OK' : 'Erro'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Provedor {provider} para síntese de voz
                </p>
                <div className="text-xs">
                  Vozes: {getVoicesForProvider(provider).length}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
              {JSON.stringify({
                isInitialized,
                isGenerating,
                isPlaying,
                currentProvider,
                currentVoice,
                availableProviders: availableProviders.length,
                voices: voices.length,
                lastResponse: lastResponse ? {
                  success: lastResponse.success,
                  provider: lastResponse.provider,
                  voice: lastResponse.voice,
                  hasAudioUrl: !!lastResponse.audioUrl
                } : null
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TTSTestComponent;