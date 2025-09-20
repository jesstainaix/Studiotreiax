// TTS Provider Factory and Manager
import { TTSProvider, TTSProviderConfig, TTSProviderError } from './types';
import { MockTTSProvider } from './mock';
import { ElevenLabsTTSProvider } from './elevenlabs';
import { HeyGenTTSProvider } from './heygen';

export * from './types';
export { MockTTSProvider } from './mock';
export { ElevenLabsTTSProvider } from './elevenlabs';
export { HeyGenTTSProvider } from './heygen';

export class TTSProviderManager {
  private providers: Map<string, TTSProvider> = new Map();
  private config: TTSProviderConfig;
  
  constructor(config?: Partial<TTSProviderConfig>) {
    this.config = {
      primary: process.env.TTS_PRIMARY_PROVIDER || 'mock',
      fallbacks: (process.env.TTS_FALLBACK_PROVIDERS || 'mock').split(','),
      retryAttempts: parseInt(process.env.TTS_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.TTS_RETRY_DELAY || '1000'),
      healthCheckInterval: 300000, // 5 minutes
      defaultLanguage: 'pt-BR',
      defaultVoice: 'br-female-adult-1',
      defaultQuality: 'medium',
      ...config
    };
    
    this.initializeProviders();
  }
  
  private initializeProviders(): void {
    // Always initialize mock provider
    this.providers.set('mock', new MockTTSProvider());
    
    // Only initialize real providers server-side for security
    if (typeof window === 'undefined') {
      // Server-side: initialize all providers
      this.providers.set('elevenlabs', new ElevenLabsTTSProvider());
      this.providers.set('heygen', new HeyGenTTSProvider());
      console.log(`[TTSManager] Server: Initialized all TTS providers`);
    } else {
      // Browser-side: only mock
      console.log(`[TTSManager] Browser: Initialized mock provider only`);
    }
    
    console.log(`[TTSManager] Primary provider: ${this.config.primary}`);
    console.log(`[TTSManager] Fallback providers: ${this.config.fallbacks.join(', ')}`);
  }
  
  async generateAudio(request: any): Promise<any> {
    // Set defaults from config
    const fullRequest = {
      language: this.config.defaultLanguage,
      voice: this.config.defaultVoice,
      quality: this.config.defaultQuality,
      ...request
    };
    
    const providers = [this.config.primary, ...this.config.fallbacks];
    let lastError: Error | null = null;
    
    for (const providerId of providers) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        console.warn(`[TTSManager] Provider ${providerId} not found, skipping`);
        continue;
      }
      
      try {
        console.log(`[TTSManager] Attempting audio generation with provider: ${providerId}`);
        
        // Check provider health first
        const isHealthy = await provider.isHealthy();
        if (!isHealthy) {
          console.warn(`[TTSManager] Provider ${providerId} is not healthy, skipping`);
          continue;
        }
        
        // Attempt generation with retry logic
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
          try {
            const result = await provider.generateAudio(fullRequest);
            console.log(`[TTSManager] Successfully generated audio with provider: ${providerId} (attempt ${attempt})`);
            return result;
          } catch (error) {
            lastError = error;
            
            if (attempt < this.config.retryAttempts) {
              console.warn(`[TTSManager] Provider ${providerId} attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms`);
              await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            } else {
              console.error(`[TTSManager] Provider ${providerId} failed after ${this.config.retryAttempts} attempts:`, error.message);
            }
          }
        }
        
      } catch (error) {
        lastError = error;
        console.error(`[TTSManager] Provider ${providerId} failed:`, error.message);
        continue;
      }
    }
    
    // If we get here, all providers failed
    throw new TTSProviderError(
      'All TTS providers failed to generate audio',
      'ALL_PROVIDERS_FAILED',
      lastError || undefined
    );
  }
  
  async getAudioStatus(audio_id: string, providerId?: string): Promise<any> {
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new TTSProviderError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND');
      }
      return await provider.getAudioStatus(audio_id);
    }
    
    // Try all providers until one succeeds
    const providers = [this.config.primary, ...this.config.fallbacks];
    
    for (const pId of providers) {
      const provider = this.providers.get(pId);
      if (!provider) continue;
      
      try {
        return await provider.getAudioStatus(audio_id);
      } catch (error) {
        console.warn(`[TTSManager] Status check failed for provider ${pId}:`, error.message);
        continue;
      }
    }
    
    throw new TTSProviderError(`Audio ${audio_id} not found in any provider`, 'AUDIO_NOT_FOUND');
  }
  
  async listAudios(deck_id?: string): Promise<any[]> {
    const allAudios: any[] = [];
    
    // Collect audios from all healthy providers
    for (const [providerId, provider] of this.providers) {
      try {
        const isHealthy = await provider.isHealthy();
        if (!isHealthy) continue;
        
        const audios = await provider.listAudios(deck_id);
        allAudios.push(...audios);
        
      } catch (error) {
        console.warn(`[TTSManager] Failed to list audios from ${providerId}:`, error.message);
      }
    }
    
    // Sort by creation date (newest first)
    return allAudios.sort((a, b) => 
      new Date(b.metadata.generated_at).getTime() - new Date(a.metadata.generated_at).getTime()
    );
  }
  
  async deleteAudio(audio_id: string, providerId?: string): Promise<void> {
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new TTSProviderError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND');
      }
      return await provider.deleteAudio(audio_id);
    }
    
    // Try to delete from all providers
    const providers = [this.config.primary, ...this.config.fallbacks];
    let deleted = false;
    
    for (const pId of providers) {
      const provider = this.providers.get(pId);
      if (!provider) continue;
      
      try {
        await provider.deleteAudio(audio_id);
        deleted = true;
        console.log(`[TTSManager] Deleted audio ${audio_id} from provider ${pId}`);
      } catch (error) {
        console.warn(`[TTSManager] Failed to delete from ${pId}:`, error.message);
      }
    }
    
    if (!deleted) {
      throw new TTSProviderError(`Failed to delete audio ${audio_id} from any provider`, 'DELETE_FAILED');
    }
  }
  
  getProviderInfo(providerId: string) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new TTSProviderError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND');
    }
    return provider.getProviderInfo();
  }
  
  getAllProviderInfo() {
    const info: any[] = [];
    for (const [id, provider] of this.providers) {
      try {
        info.push(provider.getProviderInfo());
      } catch (error) {
        console.warn(`[TTSManager] Failed to get info for ${id}:`, error.message);
      }
    }
    return info;
  }
  
  async healthCheck(): Promise<{ [providerId: string]: boolean }> {
    const health: { [providerId: string]: boolean } = {};
    
    for (const [id, provider] of this.providers) {
      try {
        health[id] = await provider.isHealthy();
      } catch (error) {
        health[id] = false;
      }
    }
    
    return health;
  }
  
  // Batch generation for multiple scenes
  async generateBatchAudio(scenes: Array<{
    scene_id: string | number;
    text: string;
    voice?: string;
    style?: string;
  }>, config?: any): Promise<Array<any>> {
    console.log(`[TTSManager] Starting batch generation for ${scenes.length} scenes`);
    
    const results: Array<any> = [];
    const errors: Array<{ scene_id: string | number; error: string }> = [];
    
    for (const scene of scenes) {
      try {
        const request = {
          text: scene.text,
          scene_id: scene.scene_id,
          voice: scene.voice || this.config.defaultVoice,
          style: scene.style || 'neutral',
          language: this.config.defaultLanguage,
          quality: this.config.defaultQuality,
          ...config
        };
        
        const result = await this.generateAudio(request);
        results.push(result);
        
        console.log(`[TTSManager] Batch: Completed scene ${scene.scene_id}`);
        
      } catch (error) {
        console.error(`[TTSManager] Batch: Failed scene ${scene.scene_id}:`, error.message);
        errors.push({
          scene_id: scene.scene_id,
          error: error.message
        });
      }
    }
    
    console.log(`[TTSManager] Batch completed: ${results.length} successful, ${errors.length} failed`);
    
    if (errors.length > 0) {
      console.warn('[TTSManager] Batch errors:', errors);
    }
    
    return results;
  }
}

// Singleton instance for global use
export const ttsManager = new TTSProviderManager({
  primary: process.env.TTS_PRIMARY_PROVIDER || 'elevenlabs',
  fallbacks: (process.env.TTS_FALLBACK_PROVIDERS || 'heygen,mock').split(','),
  retryAttempts: parseInt(process.env.TTS_RETRY_ATTEMPTS || '2'),
  retryDelay: parseInt(process.env.TTS_RETRY_DELAY || '1500')
});