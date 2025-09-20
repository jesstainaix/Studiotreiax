import { EnhancedTTSService } from './enhanced-tts-service';
import { assetCache } from '../utils/assetCache';

export interface TTSProvider {
  id: string;
  name: string;
  enabled: boolean;
  config?: any;
  apiKey?: string;
  endpoint?: string;
}

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
  preview?: string;
  accent?: string;
  style?: string;
}

export interface TTSRequest {
  text: string;
  voice: string;
  provider: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: 'mp3' | 'wav' | 'ogg';
  ssml?: boolean;
  emotions?: string[];
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBuffer?: ArrayBuffer;
  error?: string;
  metadata?: {
    duration: number;
    size: number;
    provider: string;
    voice: string;
    cost?: number;
    processingTime?: number;
  };
}

export interface TTSConfig {
  defaultProvider: string;
  fallbackProvider?: string;
  fallbackProviders?: string[];
  autoFallback?: boolean;
  providers: {
    elevenlabs?: {
      apiKey?: string;
      enabled?: boolean;
      voices?: string[];
    };
    google?: {
      apiKey?: string;
      projectId?: string;
      enabled?: boolean;
    };
    azure?: {
      apiKey?: string;
      region?: string;
      enabled?: boolean;
    };
    browser?: {
      enabled?: boolean;
    };
  };
  cacheEnabled?: boolean;
  maxCacheSize?: number;
  retryAttempts: number;
  timeout: number;
}

class TTSService {
  private config: TTSConfig;
  private providers: Map<string, TTSProvider> = new Map();
  private voices: Map<string, TTSVoice[]> = new Map();
  private cache: Map<string, string> = new Map();
  private enhancedTTS: EnhancedTTSService;
  private lastHealthCheck: Map<string, number> = new Map();
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes

  constructor(config?: Partial<TTSConfig>) {
    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };
    
    this.enhancedTTS = new EnhancedTTSService({
      providers: {
        elevenlabs: {
          apiKey: this.config.providers.elevenlabs?.apiKey || '',
          model: 'eleven_multilingual_v2'
        },
        azure: {
          apiKey: this.config.providers.azure?.apiKey || '',
          region: this.config.providers.azure?.region || 'eastus'
        },
        google: {
          apiKey: this.config.providers.google?.apiKey || ''
        }
      },
      fallbackProvider: this.config.fallbackProvider || 'browser',
      cacheEnabled: this.config.cacheEnabled || false
    });
    
    this.initializeProviders();
  }

  private getDefaultConfig(): TTSConfig {
    // Safe environment variable access for browser
    const getEnvVar = (key: string): string | undefined => {
      if (typeof window !== 'undefined' && (window as any).env) {
        return (window as any).env[key];
      }
      return undefined;
    };

    return {
      defaultProvider: 'browser',
      fallbackProviders: ['google', 'azure', 'browser'],
      autoFallback: true,
      timeout: 30000,
      retryAttempts: 2,
      cacheEnabled: true,
      maxCacheSize: 200,
      providers: {
        elevenlabs: {
          apiKey: getEnvVar('ELEVENLABS_API_KEY'),
          enabled: !!getEnvVar('ELEVENLABS_API_KEY'),
          voices: ['Rachel', 'Drew', 'Clyde', 'Paul', 'Domi', 'Dave', 'Fin', 'Sarah']
        },
        google: {
          apiKey: getEnvVar('GOOGLE_CLOUD_API_KEY'),
          projectId: getEnvVar('GOOGLE_CLOUD_PROJECT_ID'),
          enabled: !!getEnvVar('GOOGLE_CLOUD_API_KEY')
        },
        azure: {
          apiKey: getEnvVar('AZURE_SPEECH_KEY'),
          region: getEnvVar('AZURE_SPEECH_REGION') || 'eastus',
          enabled: !!getEnvVar('AZURE_SPEECH_KEY')
        },
        browser: {
          enabled: typeof window !== 'undefined' && 'speechSynthesis' in window
        }
      }
    };
  }

  private async initializeProviders(): Promise<void> {
    // ElevenLabs Provider
    this.providers.set('elevenlabs', {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      enabled: this.config.providers.elevenlabs?.enabled || false,
      config: {
        apiKey: this.config.providers.elevenlabs?.apiKey,
        endpoint: 'https://api.elevenlabs.io/v1'
      }
    });

    // Google Cloud TTS Provider
    this.providers.set('google', {
      id: 'google',
      name: 'Google Cloud TTS',
      enabled: this.config.providers.google?.enabled || false,
      config: {
        apiKey: this.config.providers.google?.apiKey,
        endpoint: 'https://texttospeech.googleapis.com/v1'
      }
    });

    // Azure Speech Provider
    this.providers.set('azure', {
      id: 'azure',
      name: 'Azure Speech Services',
      enabled: this.config.providers.azure?.enabled || false,
      config: {
        apiKey: this.config.providers.azure?.apiKey,
        region: this.config.providers.azure?.region,
        endpoint: `https://${this.config.providers.azure?.region || 'eastus'}.tts.speech.microsoft.com`
      }
    });

    // Browser Speech Synthesis Provider
    this.providers.set('browser', {
      id: 'browser',
      name: 'Browser Speech Synthesis',
      enabled: this.config.providers.browser?.enabled || false,
      config: {}
    });

    // Load voices for each provider
    await this.loadVoices();
  }

  private async loadVoices(): Promise<void> {
    for (const [providerName, provider] of this.providers) {
      if (!provider.enabled) continue;

      try {
        const voices = await this.getProviderVoices(providerName);
        this.voices.set(providerName, voices);
      } catch (error) {
        console.warn(`Failed to load voices for ${providerName}:`, error);
      }
    }
  }

  private async getProviderVoices(providerName: string): Promise<TTSVoice[]> {
    switch (providerName) {
      case 'elevenlabs':
        return this.getElevenLabsVoices();
      case 'google':
        return this.getGoogleVoices();
      case 'azure':
        return this.getAzureVoices();
      case 'browser':
        return this.getBrowserVoices();
      default:
        return [];
    }
  }

  private async getElevenLabsVoices(): Promise<TTSVoice[]> {
    const provider = this.providers.get('elevenlabs');
    if (!provider?.config.apiKey) return [];

    try {
      const response = await fetch(`${provider.config.endpoint}/voices`, {
        headers: {
          'xi-api-key': provider.config.apiKey
        }
      });

      if (!response.ok) throw new Error('Failed to fetch ElevenLabs voices');

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        language: voice.labels?.language || 'en',
        gender: voice.labels?.gender || 'neutral',
        provider: 'elevenlabs',
        preview: voice.preview_url
      }));
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  private async getGoogleVoices(): Promise<TTSVoice[]> {
    const provider = this.providers.get('google');
    if (!provider?.config.apiKey) return [];

    try {
      const response = await fetch(
        `${provider.config.endpoint}/voices?key=${provider.config.apiKey}`
      );

      if (!response.ok) throw new Error('Failed to fetch Google voices');

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        id: voice.name,
        name: voice.name,
        language: voice.languageCodes[0],
        gender: voice.ssmlGender?.toLowerCase() || 'neutral',
        provider: 'google'
      }));
    } catch (error) {
      console.error('Error fetching Google voices:', error);
      return [];
    }
  }

  private async getAzureVoices(): Promise<TTSVoice[]> {
    const provider = this.providers.get('azure');
    if (!provider?.config.apiKey) return [];

    try {
      const response = await fetch(
        `${provider.config.endpoint}/cognitiveservices/voices/list`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': provider.config.apiKey
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch Azure voices');

      const data = await response.json();
      return data.map((voice: any) => ({
        id: voice.ShortName,
        name: voice.DisplayName,
        language: voice.Locale,
        gender: voice.Gender?.toLowerCase() || 'neutral',
        provider: 'azure'
      }));
    } catch (error) {
      console.error('Error fetching Azure voices:', error);
      return [];
    }
  }

  private getBrowserVoices(): TTSVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];

    const voices = window.speechSynthesis.getVoices();
    return voices.map(voice => ({
      id: voice.name,
      name: voice.name,
      language: voice.lang,
      gender: 'neutral' as const,
      provider: 'browser'
    }));
  }

  async checkProviderHealth(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) return false;

    const lastCheck = this.lastHealthCheck.get(providerName) || 0;
    const now = Date.now();

    // Use cached result if recent
    if (now - lastCheck < this.healthCheckInterval) {
      return provider.isAvailable;
    }

    try {
      let isHealthy = false;

      switch (providerName) {
        case 'elevenlabs':
          isHealthy = await this.checkElevenLabsHealth();
          break;
        case 'google':
          isHealthy = await this.checkGoogleHealth();
          break;
        case 'azure':
          isHealthy = await this.checkAzureHealth();
          break;
        case 'browser':
          isHealthy = typeof window !== 'undefined' && 'speechSynthesis' in window;
          break;
      }

      provider.isAvailable = isHealthy;
      this.lastHealthCheck.set(providerName, now);
      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${providerName}:`, error);
      provider.isAvailable = false;
      this.lastHealthCheck.set(providerName, now);
      return false;
    }
  }

  private async checkElevenLabsHealth(): Promise<boolean> {
    const provider = this.providers.get('elevenlabs');
    if (!provider?.config.apiKey) return false;

    try {
      const response = await fetch(`${provider.config.endpoint}/user`, {
        headers: {
          'xi-api-key': provider.config.apiKey
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkGoogleHealth(): Promise<boolean> {
    const provider = this.providers.get('google');
    if (!provider?.config.apiKey) return false;

    try {
      const response = await fetch(
        `${provider.config.endpoint}/voices?key=${provider.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkAzureHealth(): Promise<boolean> {
    const provider = this.providers.get('azure');
    if (!provider?.config.apiKey) return false;

    try {
      const response = await fetch(
        `${provider.config.endpoint}/cognitiveservices/voices/list`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': provider.config.apiKey
          }
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    const assetKey = `tts:${cacheKey}`;
    
    // Check cache first
    if (this.config.cacheEnabled) {
      try {
        const cached = await assetCache.get(assetKey, 'audio');
        if (cached) {
          let audioUrl: string | undefined;
          let size = 0;
          if (cached instanceof Blob) {
            size = cached.size;
            audioUrl = URL.createObjectURL(cached);
          } else if (typeof cached === 'string') {
            audioUrl = cached;
          }
          if (audioUrl) {
            return {
              success: true,
              audioUrl,
              metadata: {
                duration: 0,
                size,
                provider: request.provider,
                voice: request.voice,
                processingTime: Date.now() - startTime
              }
            };
          }
        }
      } catch {}
      // Legacy in-memory URL cache fallback
      if (this.cache.has(cacheKey)) {
        return {
          success: true,
          audioUrl: this.cache.get(cacheKey)!,
          metadata: {
            duration: 0,
            size: 0,
            provider: request.provider,
            voice: request.voice,
            processingTime: Date.now() - startTime
          }
        };
      }
     }

    try {
      // Use enhanced TTS service for better quality and features
      const enhancedRequest = {
        text: request.text,
        voice: request.voice,
        provider: request.provider,
        language: request.language || 'pt-BR',
        speed: request.speed || 1.0,
        pitch: request.pitch || 0,
        volume: request.volume || 1.0,
        format: request.format || 'mp3',
        emotions: request.emotions || []
      };

      const enhancedResponse = await this.enhancedTTS.synthesizeWithMultipleProviders(
        enhancedRequest.text,
        enhancedRequest.voice,
        enhancedRequest.language,
        {
          speed: enhancedRequest.speed,
          pitch: enhancedRequest.pitch,
          volume: enhancedRequest.volume,
          format: enhancedRequest.format,
          emotions: enhancedRequest.emotions
        }
      );

      if (enhancedResponse.success && enhancedResponse.audioUrl) {
        // Prefer criar Blob a partir do audioBuffer para persistir no AssetCache
        let blob: Blob | null = null;
        try {
          if (enhancedResponse.audioBuffer) {
            blob = new Blob([enhancedResponse.audioBuffer], { type: 'audio/mpeg' });
          }
        } catch {}

        if (this.config.cacheEnabled && blob) {
          try { await assetCache.set(assetKey, blob, 'audio'); } catch {}
        }

        const audioUrlFinal = blob ? URL.createObjectURL(blob) : enhancedResponse.audioUrl;
        const response: TTSResponse = {
          success: true,
          audioUrl: audioUrlFinal,
          metadata: {
            duration: (enhancedResponse as any).duration || 0,
            size: blob ? blob.size : (enhancedResponse.audioBuffer?.byteLength || 0),
            provider: (enhancedResponse as any).provider || request.provider,
            voice: request.voice,
            processingTime: Date.now() - startTime,
            cost: this.calculateCost(request.text, request.provider)
          }
        };

        // Cache successful response
        if (this.config.cacheEnabled && !blob) {
          // Fallback para cache em memória (URL) se não foi possível persistir Blob
          this.cache.set(cacheKey, response.audioUrl!);
          if (this.config.maxCacheSize && this.cache.size > this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
          }
        }

        return response;
      } else {
        throw new Error(enhancedResponse.error || 'Enhanced TTS failed');
      }
    } catch (error) {
      // Try fallback provider if not already using it
      if (request.provider !== this.config.fallbackProvider) {
        return this.synthesizeSpeech({
          ...request,
          provider: this.config.fallbackProvider
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: 0,
          size: 0,
          provider: request.provider,
          voice: request.voice,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  private generateCacheKey(request: TTSRequest): string {
    return `${request.provider}-${request.voice}-${request.text}-${request.speed || 1.0}-${request.pitch || 0}`;
  }

  private calculateCost(text: string, provider: string): number {
    const charCount = text.length;
    const costPerChar = {
      elevenlabs: 0.0001,
      azure: 0.00005,
      google: 0.00004,
      browser: 0
    };
    
    return charCount * (costPerChar[provider as keyof typeof costPerChar] || 0);
  }

  private getProviderOrder(preferredProvider?: string): string[] {
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable)
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([name]) => name);

    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      // Move preferred provider to front
      return [
        preferredProvider,
        ...availableProviders.filter(name => name !== preferredProvider)
      ];
    }

    return availableProviders;
  }

  private async synthesizeWithProvider(
    providerName: string,
    request: TTSRequest
  ): Promise<TTSResponse> {
    switch (providerName) {
      case 'elevenlabs':
        return this.synthesizeWithElevenLabs(request);
      case 'google':
        return this.synthesizeWithGoogle(request);
      case 'azure':
        return this.synthesizeWithAzure(request);
      case 'browser':
        return this.synthesizeWithBrowser(request);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  private async synthesizeWithElevenLabs(request: TTSRequest): Promise<TTSResponse> {
    const provider = this.providers.get('elevenlabs');
    if (!provider?.config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = request.voice || 'pNInz6obpgDQGcFmaJgB'; // Default voice

    const response = await fetch(
      `${provider.config.endpoint}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': provider.config.apiKey
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      success: true,
      audioUrl,
      audioBuffer,
      provider: 'elevenlabs',
      metadata: {
        charactersUsed: request.text.length,
        processingTime: 0 // Will be set by caller
      }
    };
  }

  private async synthesizeWithGoogle(request: TTSRequest): Promise<TTSResponse> {
    const provider = this.providers.get('google');
    if (!provider?.config.apiKey) {
      throw new Error('Google Cloud API key not configured');
    }

    const response = await fetch(
      `${provider.config.endpoint}/text:synthesize?key=${provider.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: { text: request.text },
          voice: {
            languageCode: request.language || 'pt-BR',
            name: request.voice || 'pt-BR-Standard-A',
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: request.speed || 1.0,
            pitch: request.pitch || 0.0,
            volumeGainDb: request.volume || 0.0
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google Cloud TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const audioBuffer = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      success: true,
      audioUrl,
      audioBuffer: audioBuffer.buffer,
      provider: 'google',
      metadata: {
        charactersUsed: request.text.length,
        processingTime: 0
      }
    };
  }

  private async synthesizeWithAzure(request: TTSRequest): Promise<TTSResponse> {
    const provider = this.providers.get('azure');
    if (!provider?.config.apiKey) {
      throw new Error('Azure Speech API key not configured');
    }

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${request.language || 'pt-BR'}">
        <voice name="${request.voice || 'pt-BR-FranciscaNeural'}">
          <prosody rate="${(request.speed || 1.0) * 100}%" pitch="${request.pitch || 0}Hz">
            ${request.text}
          </prosody>
        </voice>
      </speak>
    `;

    const response = await fetch(
      `${provider.config.endpoint}/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': provider.config.apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      }
    );

    if (!response.ok) {
      throw new Error(`Azure Speech API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      success: true,
      audioUrl,
      audioBuffer,
      provider: 'azure',
      metadata: {
        charactersUsed: request.text.length,
        processingTime: 0
      }
    };
  }

  private async synthesizeWithBrowser(request: TTSRequest): Promise<TTSResponse> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('Browser speech synthesis not available');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(request.text);
      
      // Find voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === request.voice) || voices[0];
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = request.speed || 1.0;
      utterance.pitch = request.pitch || 1.0;
      utterance.volume = request.volume || 1.0;
      
      utterance.onend = () => {
        resolve({
          success: true,
          provider: 'browser',
          metadata: {
            charactersUsed: request.text.length,
            processingTime: 0
          }
        });
      };
      
      utterance.onerror = (event) => {
        reject(new Error(`Browser TTS error: ${event.error}`));
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }

  // Public API methods
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys()).filter(providerId => 
      this.isProviderAvailable(providerId)
    );
  }

  isProviderAvailable(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.isAvailable) {
      return false;
    }

    // Browser provider is always available
    if (providerId === 'browser') {
      return true;
    }

    // Check if API key is configured for cloud providers
    return !!(provider.config?.apiKey && provider.config.apiKey.length > 0);
  }

  getVoicesForProvider(providerName: string): TTSVoice[] {
    return this.voices.get(providerName) || [];
  }

  getAllVoices(): TTSVoice[] {
    const allVoices: TTSVoice[] = [];
    for (const voices of this.voices.values()) {
      allVoices.push(...voices);
    }
    return allVoices;
  }

  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeProviders();
  }

  async refreshProviders(): Promise<void> {
    await this.initializeProviders();
  }

  getConfig(): TTSConfig {
    return { ...this.config };
  }
}

export const ttsService = new TTSService();
export default ttsService;