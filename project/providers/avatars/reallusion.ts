// Reallusion Character Creator / iClone Avatar Provider
import { AvatarProvider, AvatarGenerationRequest, AvatarGenerationResult, AvatarProviderError } from './types';

export class ReallusionAvatarProvider implements AvatarProvider {
  private readonly providerId = 'reallusion';
  private readonly providerName = 'Reallusion Character Creator';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REALLUSION_API_KEY || '';
    this.baseUrl = process.env.REALLUSION_API_URL || 'https://api.reallusion.com/v1';
    
    if (!this.apiKey) {
      console.warn('[ReallusionProvider] API key not configured, will fallback to mock');
    }
  }
  
  async generateAvatar(request: AvatarGenerationRequest): Promise<AvatarGenerationResult> {
    if (!this.apiKey) {
      throw new AvatarProviderError('Reallusion API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      console.log(`[ReallusionProvider] Starting avatar generation:`, request);
      
      // Prepare Reallusion API request
      const reallusionRequest = {
        photo_data: request.photoBase64 || null,
        photo_url: request.photoUrl || null,
        gender: request.gender || 'auto_detect',
        quality: this.mapQualityToReallusion(request.quality),
        generate_3d_model: true,
        generate_animations: true,
        generate_voice_profile: true,
        style: request.style || 'realistic',
        customization: {
          ethnicity: request.ethnicity || 'auto_detect',
          age_range: request.ageRange || 'adult',
          body_type: request.bodyType || 'average'
        }
      };
      
      // Submit generation request
      const response = await fetch(`${this.baseUrl}/avatars/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0'
        },
        body: JSON.stringify(reallusionRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AvatarProviderError(
          `Reallusion API error: ${response.status} - ${errorData.message || response.statusText}`,
          'API_ERROR'
        );
      }
      
      const data = await response.json();
      const jobId = data.job_id;
      
      // Poll for completion
      const result = await this.pollForCompletion(jobId);
      
      console.log(`[ReallusionProvider] Avatar generated successfully:`, result);
      return result;
      
    } catch (error) {
      console.error('[ReallusionProvider] Generation failed:', error);
      if (error instanceof AvatarProviderError) {
        throw error;
      }
      throw new AvatarProviderError(`Reallusion generation failed: ${error.message}`, 'GENERATION_FAILED');
    }
  }
  
  async getAvatarStatus(avatarId: string): Promise<AvatarGenerationResult> {
    if (!this.apiKey) {
      throw new AvatarProviderError('Reallusion API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/avatars/${avatarId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new AvatarProviderError(`Failed to get avatar status: ${response.status}`, 'API_ERROR');
      }
      
      const data = await response.json();
      return this.mapReallusionResponse(data);
      
    } catch (error) {
      console.error('[ReallusionProvider] Status check failed:', error);
      throw new AvatarProviderError(`Status check failed: ${error.message}`, 'API_ERROR');
    }
  }
  
  async deleteAvatar(avatarId: string): Promise<void> {
    if (!this.apiKey) {
      throw new AvatarProviderError('Reallusion API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/avatars/${avatarId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new AvatarProviderError(`Failed to delete avatar: ${response.status}`, 'API_ERROR');
      }
      
    } catch (error) {
      console.error('[ReallusionProvider] Deletion failed:', error);
      throw new AvatarProviderError(`Deletion failed: ${error.message}`, 'API_ERROR');
    }
  }
  
  async listAvatars(userId?: string): Promise<AvatarGenerationResult[]> {
    if (!this.apiKey) {
      throw new AvatarProviderError('Reallusion API key not configured', 'MISSING_CREDENTIALS');
    }
    
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      
      const response = await fetch(`${this.baseUrl}/avatars?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new AvatarProviderError(`Failed to list avatars: ${response.status}`, 'API_ERROR');
      }
      
      const data = await response.json();
      return data.avatars.map(this.mapReallusionResponse);
      
    } catch (error) {
      console.error('[ReallusionProvider] List failed:', error);
      throw new AvatarProviderError(`List failed: ${error.message}`, 'API_ERROR');
    }
  }
  
  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
      capabilities: ['photo_upload', 'custom_generation', '3d_model', 'animations', 'voice_cloning'],
      limits: {
        max_daily_generations: 100,
        max_file_size_mb: 25,
        supported_formats: ['jpg', 'jpeg', 'png']
      }
    };
  }
  
  private async pollForCompletion(jobId: string, maxAttempts = 60): Promise<AvatarGenerationResult> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Job status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          return this.mapReallusionResponse(data.result);
        } else if (data.status === 'failed') {
          throw new AvatarProviderError(`Avatar generation failed: ${data.error}`, 'GENERATION_FAILED');
        }
        
        // Wait before next poll (exponential backoff)
        const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new AvatarProviderError(`Generation timeout after ${maxAttempts} attempts`, 'TIMEOUT');
        }
        console.warn(`[ReallusionProvider] Poll attempt ${attempt} failed:`, error.message);
      }
    }
    
    throw new AvatarProviderError('Generation timeout', 'TIMEOUT');
  }
  
  private mapQualityToReallusion(quality?: string): string {
    const qualityMap = {
      'low': 'draft',
      'medium': 'standard', 
      'high': 'premium',
      'ultra': 'ultra_hd'
    };
    return qualityMap[quality || 'medium'] || 'standard';
  }
  
  private mapReallusionResponse(data: any): AvatarGenerationResult {
    return {
      avatarId: data.avatar_id || data.id,
      status: this.mapStatus(data.status),
      providerId: this.providerId,
      metadata: {
        generated_at: data.created_at,
        processing_time_ms: data.processing_time_ms,
        source_photo: data.source_photo ? 'provided' : 'none',
        model_version: data.model_version || 'reallusion-v1',
        quality: data.quality || 'medium',
        tags: data.tags || []
      },
      assets: {
        thumbnail: data.assets?.thumbnail || data.preview_url,
        model_3d: data.assets?.model_3d || data.model_url,
        textures: data.assets?.textures || []
      },
      animations: data.animations || ['idle', 'talk', 'gesture'],
      voice_profiles: data.voice_profiles || []
    };
  }
  
  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap = {
      'queued': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'finished': 'completed',
      'failed': 'failed',
      'error': 'failed'
    };
    return statusMap[status] || 'pending';
  }
}