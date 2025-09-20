// Avatar Provider Factory and Manager
import { AvatarProvider, AvatarProviderConfig, AvatarProviderError } from './types';
import { MockAvatarProvider } from './mock';
import { ReallusionAvatarProvider } from './reallusion';
import { DIdAvatarProvider } from './did';

export * from './types';
export { MockAvatarProvider } from './mock';
export { ReallusionAvatarProvider } from './reallusion';
export { DIdAvatarProvider } from './did';

export class AvatarProviderManager {
  private providers: Map<string, AvatarProvider> = new Map();
  private config: AvatarProviderConfig;
  
  constructor(config?: Partial<AvatarProviderConfig>) {
    this.config = {
      primary: 'mock',
      fallbacks: ['mock'],
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 300000, // 5 minutes
      ...config
    };
    
    this.initializeProviders();
  }
  
  private initializeProviders(): void {
    // Only initialize mock provider in browser environment
    // Real providers (Reallusion, D-ID) are handled server-side for security
    if (typeof window !== 'undefined') {
      this.providers.set('mock', new MockAvatarProvider());
      console.log(`[AvatarManager] Browser: Initialized mock provider only`);
    } else {
      // Server-side: initialize all providers
      this.providers.set('mock', new MockAvatarProvider());
      this.providers.set('reallusion', new ReallusionAvatarProvider());
      this.providers.set('did', new DIdAvatarProvider());
      console.log(`[AvatarManager] Server: Initialized all providers`);
    }
    
    console.log(`[AvatarManager] Primary provider: ${this.config.primary}`);
    console.log(`[AvatarManager] Fallback providers: ${this.config.fallbacks.join(', ')}`);
  }
  
  async generateAvatar(request: any): Promise<any> {
    const providers = [this.config.primary, ...this.config.fallbacks];
    
    for (const providerId of providers) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        console.warn(`[AvatarManager] Provider ${providerId} not found, skipping`);
        continue;
      }
      
      try {
        console.log(`[AvatarManager] Attempting generation with provider: ${providerId}`);
        
        // Check provider health
        const isHealthy = await provider.isHealthy();
        if (!isHealthy) {
          console.warn(`[AvatarManager] Provider ${providerId} is not healthy, skipping`);
          continue;
        }
        
        // Attempt generation
        const result = await provider.generateAvatar(request);
        console.log(`[AvatarManager] Successfully generated avatar with provider: ${providerId}`);
        return result;
        
      } catch (error) {
        console.error(`[AvatarManager] Provider ${providerId} failed:`, error);
        
        // If this is the last provider, throw the error
        if (providerId === providers[providers.length - 1]) {
          throw error;
        }
        
        // Otherwise, continue to next provider
        continue;
      }
    }
    
    throw new AvatarProviderError('All avatar providers failed', 'ALL_PROVIDERS_FAILED');
  }
  
  async getAvatarStatus(avatarId: string, providerId?: string): Promise<any> {
    // If provider specified, use it directly
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new AvatarProviderError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND');
      }
      return await provider.getAvatarStatus(avatarId);
    }
    
    // Otherwise, try all providers until one succeeds
    const providers = [this.config.primary, ...this.config.fallbacks];
    
    for (const pId of providers) {
      const provider = this.providers.get(pId);
      if (!provider) continue;
      
      try {
        return await provider.getAvatarStatus(avatarId);
      } catch (error) {
        console.warn(`[AvatarManager] Status check failed for provider ${pId}:`, error.message);
        continue;
      }
    }
    
    throw new AvatarProviderError(`Avatar ${avatarId} not found in any provider`, 'AVATAR_NOT_FOUND');
  }
  
  async listAvatars(userId?: string): Promise<any[]> {
    const allAvatars: any[] = [];
    
    // Collect avatars from all healthy providers
    for (const [providerId, provider] of this.providers) {
      try {
        const isHealthy = await provider.isHealthy();
        if (!isHealthy) continue;
        
        const avatars = await provider.listAvatars(userId);
        allAvatars.push(...avatars);
        
      } catch (error) {
        console.warn(`[AvatarManager] Failed to list avatars from ${providerId}:`, error.message);
      }
    }
    
    // Sort by creation date (newest first)
    return allAvatars.sort((a, b) => 
      new Date(b.metadata.generated_at).getTime() - new Date(a.metadata.generated_at).getTime()
    );
  }
  
  async deleteAvatar(avatarId: string, providerId?: string): Promise<void> {
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new AvatarProviderError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND');
      }
      return await provider.deleteAvatar(avatarId);
    }
    
    // Try to delete from all providers
    const providers = [this.config.primary, ...this.config.fallbacks];
    let deleted = false;
    
    for (const pId of providers) {
      const provider = this.providers.get(pId);
      if (!provider) continue;
      
      try {
        await provider.deleteAvatar(avatarId);
        deleted = true;
        console.log(`[AvatarManager] Deleted avatar ${avatarId} from provider ${pId}`);
      } catch (error) {
        console.warn(`[AvatarManager] Failed to delete from ${pId}:`, error.message);
      }
    }
    
    if (!deleted) {
      throw new AvatarProviderError(`Failed to delete avatar ${avatarId} from any provider`, 'DELETE_FAILED');
    }
  }
  
  getProviderInfo(providerId: string) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new AvatarProviderError(`Provider ${providerId} not found`, 'PROVIDER_NOT_FOUND');
    }
    return provider.getProviderInfo();
  }
  
  getAllProviderInfo() {
    const info: any[] = [];
    for (const [id, provider] of this.providers) {
      try {
        info.push(provider.getProviderInfo());
      } catch (error) {
        console.warn(`[AvatarManager] Failed to get info for ${id}:`, error.message);
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
}

// Singleton instance for global use with better fallback configuration
export const avatarManager = new AvatarProviderManager({
  primary: process.env.AVATAR_PRIMARY_PROVIDER || 'reallusion',
  fallbacks: (process.env.AVATAR_FALLBACK_PROVIDERS || 'did,mock').split(','),
  retryAttempts: parseInt(process.env.AVATAR_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.AVATAR_RETRY_DELAY || '1000')
});