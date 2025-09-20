// Mock Avatar Provider for Local Development
import { AvatarProvider, AvatarGenerationRequest, AvatarGenerationResult, AvatarProviderError } from './types';

export class MockAvatarProvider implements AvatarProvider {
  private readonly providerId = 'mock';
  private readonly providerName = 'Mock Local Provider';
  
  async generateAvatar(request: AvatarGenerationRequest): Promise<AvatarGenerationResult> {
    console.log(`[MockProvider] Generating avatar for request:`, request);
    
    // Simulate API processing delay
    await this.simulateDelay(2000 + Math.random() * 3000);
    
    // Mock avatar generation with predictable results
    const timestamp = Date.now();
    const userId = request.userId || 'anonymous';
    const avatarId = `avatar_custom_${userId}_${timestamp}`;
    
    const mockResult: AvatarGenerationResult = {
      avatarId,
      status: 'completed',
      providerId: this.providerId,
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: 2000 + Math.random() * 3000,
        source_photo: request.photoUrl || request.photoBase64 ? 'provided' : 'none',
        model_version: 'mock-v1.0',
        quality: request.quality || 'medium'
      },
      assets: {
        thumbnail: `/api/avatars/mock/${avatarId}/thumbnail.jpg`,
        model_3d: `/api/avatars/mock/${avatarId}/model.glb`,
        textures: [
          `/api/avatars/mock/${avatarId}/diffuse.jpg`,
          `/api/avatars/mock/${avatarId}/normal.jpg`,
          `/api/avatars/mock/${avatarId}/roughness.jpg`
        ]
      },
      animations: [
        'idle-neutral',
        'walk-casual', 
        'gesture-hello',
        'emotion-happy',
        'speech-talking'
      ],
      voice_profiles: [
        'br-male-adult-1',
        'br-female-adult-1',
        'br-male-young-1'
      ]
    };
    
    console.log(`[MockProvider] Avatar generated successfully:`, mockResult);
    return mockResult;
  }
  
  async getAvatarStatus(avatarId: string): Promise<AvatarGenerationResult> {
    console.log(`[MockProvider] Getting status for avatar: ${avatarId}`);
    
    // Mock status check
    return {
      avatarId,
      status: 'completed',
      providerId: this.providerId,
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: 3500,
        source_photo: 'provided',
        model_version: 'mock-v1.0',
        quality: 'medium'
      },
      assets: {
        thumbnail: `/api/avatars/mock/${avatarId}/thumbnail.jpg`,
        model_3d: `/api/avatars/mock/${avatarId}/model.glb`,
        textures: []
      },
      animations: ['idle-neutral'],
      voice_profiles: ['br-female-adult-1']
    };
  }
  
  async deleteAvatar(avatarId: string): Promise<void> {
    console.log(`[MockProvider] Deleting avatar: ${avatarId}`);
    // Mock deletion - always succeeds
    await this.simulateDelay(500);
  }
  
  async listAvatars(userId?: string): Promise<AvatarGenerationResult[]> {
    console.log(`[MockProvider] Listing avatars for user: ${userId || 'all'}`);
    
    // Return mock pre-existing avatars
    const mockAvatars: AvatarGenerationResult[] = [
      {
        avatarId: 'avatar_corporativo_1',
        status: 'completed',
        providerId: this.providerId,
        metadata: {
          generated_at: '2025-09-15T10:00:00Z',
          processing_time_ms: 4200,
          source_photo: 'stock',
          model_version: 'mock-v1.0',
          quality: 'high',
          tags: ['business', 'professional', 'male']
        },
        assets: {
          thumbnail: '/api/avatars/mock/avatar_corporativo_1/thumbnail.jpg',
          model_3d: '/api/avatars/mock/avatar_corporativo_1/model.glb',
          textures: []
        },
        animations: ['idle-neutral', 'gesture-presenting'],
        voice_profiles: ['br-male-adult-1']
      },
      {
        avatarId: 'avatar_educacao_1', 
        status: 'completed',
        providerId: this.providerId,
        metadata: {
          generated_at: '2025-09-16T14:30:00Z',
          processing_time_ms: 3800,
          source_photo: 'stock',
          model_version: 'mock-v1.0',
          quality: 'medium',
          tags: ['education', 'teacher', 'female']
        },
        assets: {
          thumbnail: '/api/avatars/mock/avatar_educacao_1/thumbnail.jpg',
          model_3d: '/api/avatars/mock/avatar_educacao_1/model.glb',
          textures: []
        },
        animations: ['idle-neutral', 'gesture-explaining'],
        voice_profiles: ['br-female-adult-1']
      }
    ];
    
    return mockAvatars;
  }
  
  isHealthy(): Promise<boolean> {
    return Promise.resolve(true);
  }
  
  getProviderInfo() {
    return {
      id: this.providerId,
      name: this.providerName,
      version: '1.0.0',
      capabilities: ['photo_upload', 'custom_generation', 'voice_cloning'],
      limits: {
        max_daily_generations: 1000,
        max_file_size_mb: 10,
        supported_formats: ['jpg', 'jpeg', 'png', 'webp']
      }
    };
  }
  
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}