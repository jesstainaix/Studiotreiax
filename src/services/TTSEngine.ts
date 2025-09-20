// Sistema de Síntese de Voz Multi-Provedor
// Suporte para Azure, Google Cloud, ElevenLabs, Amazon Polly

export interface TTSConfig {
  provider: 'azure' | 'google' | 'elevenlabs' | 'amazon' | 'browser';
  apiKey?: string;
  region?: string;
  voice: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  speed: number;
  pitch: number;
  volume: number;
  emotion?: string;
}

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  audioBlob?: Blob;
  duration?: number;
  error?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  sampleUrl?: string;
  quality: 'standard' | 'premium' | 'ultra';
}

class TTSEngine {
  private cache = new Map<string, { audioUrl: string; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  private isInitialized = false;

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    try {
      // Verificar disponibilidade dos provedores
      await this.checkProviderAvailability();
      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar TTSEngine:', error);
    }
  }

  private async checkProviderAvailability(): Promise<void> {
    // Verificar se Web Speech API está disponível
    if ('speechSynthesis' in window) {
    }

    // Verificar configurações de API keys (seriam carregadas de variáveis de ambiente)
    const providers = ['azure', 'google', 'elevenlabs', 'amazon'];
    providers.forEach(provider => {
      const hasKey = this.hasApiKey(provider);
    });
  }

  private hasApiKey(provider: string): boolean {
    // Em produção, verificar variáveis de ambiente
    // Por enquanto, simular configuração
    const mockKeys = {
      azure: process.env.AZURE_TTS_KEY || 'mock-key',
      google: process.env.GOOGLE_TTS_KEY || 'mock-key',
      elevenlabs: process.env.ELEVENLABS_API_KEY || 'mock-key',
      amazon: process.env.AWS_POLLY_KEY || 'mock-key'
    };

    return !!mockKeys[provider as keyof typeof mockKeys];
  }

  async synthesizeSpeech(
    text: string,
    config: TTSConfig,
    options: {
      useCache?: boolean;
      fallbackProviders?: string[];
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<TTSResult> {
    const { useCache = true, fallbackProviders = [], onProgress } = options;

    if (!this.isInitialized) {
      return {
        success: false,
        error: 'TTSEngine não inicializado'
      };
    }

    // Gerar chave de cache
    const cacheKey = this.generateCacheKey(text, config);

    // Verificar cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return {
          success: true,
          audioUrl: cached.audioUrl
        };
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Tentar provedores em ordem
    const providersToTry = [config.provider, ...fallbackProviders];

    for (const provider of providersToTry) {
      try {
        onProgress?.(0.1);
        const result = await this.synthesizeWithProvider(text, { ...config, provider: provider as any }, onProgress);

        if (result.success && result.audioUrl) {
          // Salvar no cache
          if (useCache) {
            this.cache.set(cacheKey, {
              audioUrl: result.audioUrl,
              timestamp: Date.now()
            });
          }

          onProgress?.(1.0);
          return result;
        }
      } catch (error) {
        console.warn(`Erro com provedor ${provider}:`, error);
        continue;
      }
    }

    // Fallback para Web Speech API
    try {
      onProgress?.(0.8);
      const result = await this.synthesizeWithBrowser(text, config);
      onProgress?.(1.0);
      return result;
    } catch (error) {
      console.error('Erro no fallback Web Speech API:', error);
    }

    return {
      success: false,
      error: 'Todos os provedores falharam'
    };
  }

  private async synthesizeWithProvider(
    text: string,
    config: TTSConfig,
    onProgress?: (progress: number) => void
  ): Promise<TTSResult> {
    switch (config.provider) {
      case 'azure':
        return await this.synthesizeAzure(text, config, onProgress);
      case 'google':
        return await this.synthesizeGoogle(text, config, onProgress);
      case 'elevenlabs':
        return await this.synthesizeElevenLabs(text, config, onProgress);
      case 'amazon':
        return await this.synthesizeAmazon(text, config, onProgress);
      default:
        throw new Error(`Provedor não suportado: ${config.provider}`);
    }
  }

  private async synthesizeAzure(
    text: string,
    config: TTSConfig,
    onProgress?: (progress: number) => void
  ): Promise<TTSResult> {
    try {
      onProgress?.(0.3);

      const response = await fetch(
        `https://${config.region || 'brazilsouth'}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': config.apiKey || 'mock-key',
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
          },
          body: this.generateAzureSSML(text, config)
        }
      );

      if (!response.ok) {
        throw new Error(`Azure TTS erro: ${response.status}`);
      }

      onProgress?.(0.7);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        success: true,
        audioUrl,
        audioBlob,
        duration: this.estimateDuration(text, config.speed)
      };
    } catch (error) {
      throw new Error(`Erro Azure TTS: ${error}`);
    }
  }

  private async synthesizeGoogle(
    text: string,
    config: TTSConfig,
    onProgress?: (progress: number) => void
  ): Promise<TTSResult> {
    try {
      onProgress?.(0.3);

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.apiKey || 'mock-key'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: config.language,
              name: config.voice,
              ssmlGender: config.gender.toUpperCase()
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: config.speed,
              pitch: config.pitch
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google TTS erro: ${response.status}`);
      }

      onProgress?.(0.7);
      const data = await response.json();
      const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        success: true,
        audioUrl,
        audioBlob,
        duration: this.estimateDuration(text, config.speed)
      };
    } catch (error) {
      throw new Error(`Erro Google TTS: ${error}`);
    }
  }

  private async synthesizeElevenLabs(
    text: string,
    config: TTSConfig,
    onProgress?: (progress: number) => void
  ): Promise<TTSResult> {
    try {
      onProgress?.(0.3);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.voice}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': config.apiKey || 'mock-key'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS erro: ${response.status}`);
      }

      onProgress?.(0.7);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        success: true,
        audioUrl,
        audioBlob,
        duration: this.estimateDuration(text, config.speed)
      };
    } catch (error) {
      throw new Error(`Erro ElevenLabs TTS: ${error}`);
    }
  }

  private async synthesizeAmazon(
    text: string,
    config: TTSConfig,
    onProgress?: (progress: number) => void
  ): Promise<TTSResult> {
    try {
      onProgress?.(0.3);

      // Simulação - em produção usaria AWS SDK
      const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(mockAudioBlob);

      onProgress?.(0.7);

      return {
        success: true,
        audioUrl,
        audioBlob: mockAudioBlob,
        duration: this.estimateDuration(text, config.speed)
      };
    } catch (error) {
      throw new Error(`Erro Amazon Polly: ${error}`);
    }
  }

  private async synthesizeWithBrowser(
    text: string,
    config: TTSConfig
  ): Promise<TTSResult> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API não disponível'));
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = config.language;
        utterance.rate = config.speed;
        utterance.pitch = config.pitch + 1; // Web Speech API usa 0-2
        utterance.volume = config.volume;

        // Selecionar voz
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice =>
          voice.name.includes(config.voice) ||
          voice.lang.includes(config.language)
        );

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
          resolve({
            success: true,
            duration: this.estimateDuration(text, config.speed)
          });
        };

        utterance.onerror = (error) => {
          reject(new Error(`Erro Web Speech API: ${error.error}`));
        };

        speechSynthesis.speak(utterance);

      } catch (error) {
        reject(error);
      }
    });
  }

  private generateAzureSSML(text: string, config: TTSConfig): string {
    return `<speak version='1.0' xml:lang='${config.language}'>
      <voice xml:lang='${config.language}' xml:gender='${config.gender}' name='${config.voice}'>
        <prosody rate='${config.speed * 100}%' pitch='${config.pitch}st'>
          ${text}
        </prosody>
      </voice>
    </speak>`;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private estimateDuration(text: string, speed: number): number {
    // Estimativa simples baseada no número de palavras
    const wordsPerMinute = 150 * speed; // palavras por minuto
    const wordCount = text.split(' ').length;
    return (wordCount / wordsPerMinute) * 60; // duração em segundos
  }

  private generateCacheKey(text: string, config: TTSConfig): string {
    return `${config.provider}-${config.voice}-${config.language}-${config.speed}-${config.pitch}-${btoa(text).slice(0, 50)}`;
  }

  // Métodos públicos
  getAvailableVoices(): VoiceOption[] {
    return [
      // Azure voices
      {
        id: 'azure-pt-br-1',
        name: 'Francisca (Azure)',
        provider: 'azure',
        language: 'pt-BR',
        gender: 'female',
        accent: 'brasileiro',
        quality: 'premium'
      },
      {
        id: 'azure-pt-br-2',
        name: 'Antonio (Azure)',
        provider: 'azure',
        language: 'pt-BR',
        gender: 'male',
        accent: 'brasileiro',
        quality: 'premium'
      },

      // Google voices
      {
        id: 'google-pt-br-1',
        name: 'Brazilian Female (Google)',
        provider: 'google',
        language: 'pt-BR',
        gender: 'female',
        accent: 'brasileiro',
        quality: 'standard'
      },

      // ElevenLabs voices
      {
        id: 'elevenlabs-pt-br-1',
        name: 'Bella (ElevenLabs)',
        provider: 'elevenlabs',
        language: 'pt-BR',
        gender: 'female',
        accent: 'brasileiro',
        quality: 'ultra'
      },

      // Web Speech API fallback
      {
        id: 'browser-pt-br',
        name: 'Navegador (Fallback)',
        provider: 'browser',
        language: 'pt-BR',
        gender: 'neutral',
        quality: 'standard'
      }
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  async testVoice(voiceId: string): Promise<TTSResult> {
    const testText = 'Olá! Esta é uma demonstração da voz selecionada.';
    const voices = this.getAvailableVoices();
    const voice = voices.find(v => v.id === voiceId);

    if (!voice) {
      return {
        success: false,
        error: 'Voz não encontrada'
      };
    }

    const config: TTSConfig = {
      provider: voice.provider as any,
      voice: voiceId,
      language: voice.language,
      gender: voice.gender,
      speed: 1.0,
      pitch: 0,
      volume: 1.0
    };

    return await this.synthesizeSpeech(testText, config, { useCache: false });
  }

  dispose(): void {
    this.clearCache();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const ttsEngine = new TTSEngine();
export default ttsEngine;
