// D-ID Avatar Provider for Face Animation and Lip-Sync
import { AvatarProvider, AvatarGenerationRequest, AvatarGenerationResult, AvatarProviderError } from './types';

export class DIdAvatarProvider implements AvatarProvider {
  private readonly providerId = 'did';
  private readonly providerName = 'D-ID AI Avatar';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DID_API_KEY || '';
    this.baseUrl = process.env.DID_API_URL || 'https://api.d-id.com';
    
    if (!this.apiKey) {
      console.warn('[DIdProvider] API key not configured, will fallback to mock');
    }
  }
  
  async generateAvatar(request: AvatarGenerationRequest): Promise<AvatarGenerationResult> {
    if (!this.apiKey) {
      throw new AvatarProviderError('D-ID API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      console.log(`[DIdProvider] Starting avatar generation:`, request);
      
      // D-ID specializes in face animation from photos
      const didRequest = {
        source_url: request.photoUrl || null,
        source_image: request.photoBase64 || null,
        script: {
          type: 'text',
          input: 'Olá, eu sou seu novo avatar digital.',
          provider: {
            type: 'microsoft',
            voice_id: this.mapVoiceId(request.voice),
            voice_config: {
              style: request.emotion || 'neutral',
              pitch: '0%',
              rate: '0%'
            }
          }
        },
        config: {
          fluent: true,
          pad_audio: 0.0,
          driver_expressions: {
        'expressions': [
          {
            'start_frame': 0,
            'expression': {
              'eye_blink': 0.3,
              'mouth_smile': request.emotion === 'happy' ? 0.7 : 0.0
            }
          }
        ]
      },
          result_format: 'mp4',
          stitch: true
        }
      };
      
      // Create D-ID talking photo
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(didRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AvatarProviderError(
          `D-ID API error: ${response.status} - ${errorData.message || response.statusText}`,
          'API_ERROR'
        );
      }
      
      const data = await response.json();
      const talkId = data.id;
      
      // Poll for completion
      const result = await this.pollForCompletion(talkId);
      
      console.log(`[DIdProvider] Avatar generated successfully:`, result);
      return result;
      
    } catch (error) {
      console.error('[DIdProvider] Generation failed:', error);
      if (error instanceof AvatarProviderError) {
        throw error;
      }
      throw new AvatarProviderError(`D-ID generation failed: ${error.message}`, 'GENERATION_FAILED');
    }
  }
  
  async getAvatarStatus(avatarId: string): Promise<AvatarGenerationResult> {
    if (!this.apiKey) {
      throw new AvatarProviderError('D-ID API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/talks/${avatarId}`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new AvatarProviderError(`Failed to get avatar status: ${response.status}`, 'API_ERROR');
      }
      
      const data = await response.json();
      return this.mapDIdResponse(data);
      
    } catch (error) {
      console.error('[DIdProvider] Status check failed:', error);
      throw new AvatarProviderError(`Status check failed: ${error.message}`, 'API_ERROR');
    }
  }
  
  async deleteAvatar(avatarId: string): Promise<void> {
    if (!this.apiKey) {
      throw new AvatarProviderError('D-ID API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/talks/${avatarId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      });
      
      if (!response.ok && response.status !== 404) {
        throw new AvatarProviderError(`Failed to delete avatar: ${response.status}`, 'API_ERROR');
      }
      
    } catch (error) {
      console.error('[DIdProvider] Deletion failed:', error);
      throw new AvatarProviderError(`Deletion failed: ${error.message}`, 'API_ERROR');
    }
  }
  
  async listAvatars(userId?: string): Promise<AvatarGenerationResult[]> {
    if (!this.apiKey) {
      throw new AvatarProviderError('D-ID API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      // D-ID doesn't have a direct list endpoint, we'll need to track avatars separately
      // For now, return empty array or implement local tracking
      console.warn('[DIdProvider] List avatars not directly supported by D-ID API');
      return [];
      
    } catch (error) {
      console.error('[DIdProvider] List failed:', error);
      throw new AvatarProviderError(`List failed: ${error.message}`, 'API_ERROR');
    }
  }
  
  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      // D-ID doesn't have a health endpoint, try to get credits
      const response = await fetch(`${this.baseUrl}/credits`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  getProviderInfo() {
    return {
      id: this.providerId,
      name: this.providerName,
      version: '1.0.0',
      capabilities: ['photo_upload', 'face_animation', 'lip_sync', 'voice_synthesis'],
      limits: {
        max_daily_generations: 100,
        max_file_size_mb: 8,
        supported_formats: ['jpg', 'jpeg', 'png'],
        video_duration_max: 300 // 5 minutes
      }
    };
  }
  
  private async pollForCompletion(talkId: string, maxAttempts = 60): Promise<AvatarGenerationResult> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/talks/${talkId}`, {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Talk status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'done') {
          return this.mapDIdResponse(data);
        } else if (data.status === 'error' || data.status === 'rejected') {
          throw new AvatarProviderError(`Avatar generation failed: ${data.error}`, 'GENERATION_FAILED');
        }
        
        // Wait before next poll
        const delay = Math.min(2000 * attempt, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new AvatarProviderError(`Generation timeout after ${maxAttempts} attempts`, 'TIMEOUT');
        }
        console.warn(`[DIdProvider] Poll attempt ${attempt} failed:`, error.message);
      }
    }
    
    throw new AvatarProviderError('Generation timeout', 'TIMEOUT');
  }
  
  private mapVoiceId(voice?: string): string {
    // Map Brazilian voices to D-ID voice IDs
    const voiceMap = {
      'br-male-adult-1': 'pt-BR-AntonioNeural',
      'br-female-adult-1': 'pt-BR-FranciscaNeural',
      'br-male-young-1': 'pt-BR-AntonioNeural',
      'br-female-elderly-1': 'pt-BR-FranciscaNeural'
    };
    return voiceMap[voice || 'br-female-adult-1'] || 'pt-BR-FranciscaNeural';
  }
  
  private mapDIdResponse(data: any): AvatarGenerationResult {
    const timestamp = Date.now();
    const avatarId = data.id || `did_avatar_${timestamp}`;
    
    return {
      avatarId,
      status: this.mapStatus(data.status),
      providerId: this.providerId,
      metadata: {
        generated_at: data.created_at || new Date().toISOString(),
        processing_time_ms: data.duration || 0,
        source_photo: data.source_url || data.source_image ? 'provided' : 'none',
        model_version: 'did-v1',
        quality: 'medium',
        video_duration_sec: data.duration,
        credits_used: data.credits
      },
      assets: {
        thumbnail: data.source_url || '/api/placeholder/avatar-thumbnail.jpg',
        model_3d: null, // D-ID doesn't provide 3D models
        video_url: data.result_url,
        textures: []
      },
      animations: ['talking', 'lip_sync'],
      voice_profiles: [this.mapVoiceId()]
    };
  }
  
  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap = {
      'created': 'pending',
      'started': 'processing',
      'done': 'completed',
      'error': 'failed',
      'rejected': 'failed'
    };
    return statusMap[status] || 'pending';
  }
}