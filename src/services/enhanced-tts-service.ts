export interface EnhancedTTSConfig {
  providers: {
    elevenlabs?: {
      apiKey: string;
      model?: string;
    };
    azure?: {
      apiKey: string;
      region: string;
    };
    google?: {
      apiKey: string;
      projectId?: string;
    };
  };
  fallbackProvider: string;
  cacheEnabled: boolean;
  maxCacheSize?: number;
}

export interface EnhancedTTSOptions {
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  emotion?: string;
  style?: string;
  // ElevenLabs specific options
  model?: string;
  stability?: number;
  similarityBoost?: number;
  useSpeakerBoost?: boolean;
  // Azure specific options
  rate?: string;
  // Google specific options
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  volumeGainDb?: number;
  effectsProfileId?: string[];
}

export interface EnhancedTTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBuffer?: ArrayBuffer;
  duration?: number;
  provider?: string;
  error?: string;
  cached?: boolean;
  voiceId?: string;
  model?: string;
  language?: string;
}

export class EnhancedTTSService {
  private config: EnhancedTTSConfig;
  private cache: Map<string, string> = new Map();

  constructor(config: EnhancedTTSConfig) {
    this.config = config;
  }

  async synthesize(text: string, options: EnhancedTTSOptions = {}): Promise<EnhancedTTSResponse> {
    const cacheKey = `${text}_${JSON.stringify(options)}`;
    
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      return {
        success: true,
        audioUrl: this.cache.get(cacheKey),
        cached: true
      };
    }

    try {
      const result = await this.synthesizeWithProvider(text, options);
      
      if (this.config.cacheEnabled && result.success && result.audioUrl) {
        this.cache.set(cacheKey, result.audioUrl);
      }
      
      return result;
    } catch (error) {
      console.error('Enhanced TTS synthesis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async synthesizeWithMultipleProviders(
    text: string,
    voice: string,
    language: string = 'pt-BR',
    options: EnhancedTTSOptions = {}
  ): Promise<EnhancedTTSResponse> {
    const providers = options.providers || ['elevenlabs', 'azure', 'google'];
    
    for (const provider of providers) {
      try {
        const result = await this.synthesizeWithSpecificProvider(provider, text, voice, language, options);
        
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All TTS providers failed');
  }

  public async synthesizeWithSpecificProvider(
    provider: string,
    text: string,
    voice: string,
    language: string = 'pt-BR',
    options: EnhancedTTSOptions = {}
  ): Promise<EnhancedTTSResponse> {
    switch (provider) {
      case 'elevenlabs':
        return await this.synthesizeWithElevenLabs(text, voice, language, options);
      case 'azure':
        return await this.synthesizeWithAzure(text, voice, language, options);
      case 'google':
        return await this.synthesizeWithGoogle(text, voice, language, options);
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
    }
  }

  private async synthesizeWithProvider(text: string, options: EnhancedTTSOptions): Promise<EnhancedTTSResponse> {
    return this.synthesizeWithSpecificProvider(
      this.config.fallbackProvider,
      text,
      'default',
      'pt-BR',
      options
    );
  }

  private async synthesizeWithSpecificProvider(
    provider: string,
    text: string,
    voice: string,
    language: string,
    options: EnhancedTTSOptions
  ): Promise<EnhancedTTSResponse> {
    switch (provider) {
      case 'elevenlabs':
        return this.synthesizeWithElevenLabs(text, voice, options);
      case 'azure':
        return this.synthesizeWithAzure(text, voice, language, options);
      case 'google':
        return this.synthesizeWithGoogle(text, voice, language, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async synthesizeWithElevenLabs(
    text: string,
    voice: string,
    options: EnhancedTTSOptions
  ): Promise<EnhancedTTSResponse> {
    const config = this.config.providers.elevenlabs;
    if (!config?.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const voiceId = voice || 'pNInz6obpgDQGcFmaJgB'; // Default to Adam voice
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      
      const requestBody = {
        text,
        model_id: options.model || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.75,
          style: options.style || 0.0,
          use_speaker_boost: options.useSpeakerBoost || true
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Estimate duration based on text length (rough calculation)
      const estimatedDuration = Math.floor(text.length * 50);

      return {
        success: true,
        audioUrl,
        audioBuffer,
        duration: estimatedDuration,
        provider: 'elevenlabs',
        voiceId,
        model: requestBody.model_id
      };
    } catch (error) {
      console.error('ElevenLabs synthesis failed:', error);
      throw error;
    }
  }

  private async synthesizeWithAzure(
    text: string,
    voice: string,
    language: string,
    options: EnhancedTTSOptions
  ): Promise<EnhancedTTSResponse> {
    const config = this.config.providers.azure;
    if (!config?.apiKey || !config?.region) {
      throw new Error('Azure API key and region not configured');
    }

    try {
      const voiceName = voice || 'pt-BR-FranciscaNeural';
      const url = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      
      // Create SSML for better voice control
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language || 'pt-BR'}">
          <voice name="${voiceName}">
            <prosody rate="${options.rate || '0%'}" pitch="${options.pitch || '0%'}" volume="${options.volume || '0%'}">
              ${text}
            </prosody>
          </voice>
        </speak>
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': config.apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'TreiaxStudio'
        },
        body: ssml
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure TTS API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Estimate duration based on text length
      const estimatedDuration = Math.floor(text.length * 50);

      return {
        success: true,
        audioUrl,
        audioBuffer,
        duration: estimatedDuration,
        provider: 'azure',
        voiceId: voiceName,
        language: language || 'pt-BR'
      };
    } catch (error) {
      console.error('Azure TTS synthesis failed:', error);
      throw error;
    }
  }

  private async synthesizeWithGoogle(
    text: string,
    voice: string,
    language: string,
    options: EnhancedTTSOptions
  ): Promise<EnhancedTTSResponse> {
    const config = this.config.providers.google;
    if (!config?.apiKey) {
      throw new Error('Google API key not configured');
    }

    try {
      const voiceName = voice || 'pt-BR-Wavenet-A';
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.apiKey}`;
      
      const requestBody = {
        input: { text },
        voice: {
          languageCode: language || 'pt-BR',
          name: voiceName,
          ssmlGender: options.gender || 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0.0,
          volumeGainDb: options.volumeGainDb || 0.0,
          sampleRateHertz: 24000,
          effectsProfileId: options.effectsProfileId || ['telephony-class-application']
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google TTS API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const responseData = await response.json();
      
      if (!responseData.audioContent) {
        throw new Error('No audio content received from Google TTS');
      }

      // Convert base64 audio to blob URL
      const audioBytes = atob(responseData.audioContent);
      const audioArray = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioBuffer = audioArray.buffer as ArrayBuffer;
      
      // Estimate duration based on text length
      const estimatedDuration = Math.floor(text.length * 50);

      return {
        success: true,
        audioUrl,
        audioBuffer,
        duration: estimatedDuration,
        provider: 'google',
        voiceId: voiceName,
        language: language || 'pt-BR'
      };
    } catch (error) {
      console.error('Google TTS synthesis failed:', error);
      throw error;
    }
  }

  async getAvailableVoices(provider?: string): Promise<any[]> {
    // Placeholder implementation for getting available voices
    const voices = {
      elevenlabs: [
        { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', language: 'en-US' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', language: 'en-US' }
      ],
      azure: [
        { id: 'pt-BR-FranciscaNeural', name: 'Francisca', language: 'pt-BR' },
        { id: 'pt-BR-AntonioNeural', name: 'Antonio', language: 'pt-BR' }
      ],
      google: [
        { id: 'pt-BR-Standard-A', name: 'Standard A', language: 'pt-BR' },
        { id: 'pt-BR-Wavenet-A', name: 'Wavenet A', language: 'pt-BR' }
      ]
    };
    
    if (provider) {
      return voices[provider as keyof typeof voices] || [];
    }
    
    return Object.values(voices).flat();
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check if at least one provider is configured
      const hasElevenLabs = !!this.config.providers.elevenlabs?.apiKey;
      const hasAzure = !!this.config.providers.azure?.apiKey;
      const hasGoogle = !!this.config.providers.google?.apiKey;
      
      return hasElevenLabs || hasAzure || hasGoogle;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}