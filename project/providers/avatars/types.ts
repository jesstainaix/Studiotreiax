// Shared types for Avatar Providers
export interface AvatarGenerationRequest {
  userId?: string;
  photoUrl?: string;
  photoBase64?: string;
  gender?: 'male' | 'female' | 'auto_detect';
  ethnicity?: 'caucasian' | 'african' | 'asian' | 'hispanic' | 'mixed' | 'auto_detect';
  ageRange?: 'child' | 'teen' | 'young_adult' | 'adult' | 'senior' | 'auto_detect';
  bodyType?: 'slim' | 'athletic' | 'average' | 'heavy' | 'muscular' | 'auto_detect';
  style?: 'realistic' | 'cartoon' | 'anime' | 'artistic';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  voice?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm';
  tags?: string[];
  customization?: {
    skin_tone?: string;
    hair_color?: string;
    eye_color?: string;
    clothing_style?: string;
  };
}

export interface AvatarGenerationResult {
  avatarId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  providerId: string;
  metadata: {
    generated_at: string;
    processing_time_ms: number;
    source_photo: 'provided' | 'stock' | 'none';
    model_version: string;
    quality: string;
    tags?: string[];
    video_duration_sec?: number;
    credits_used?: number;
  };
  assets: {
    thumbnail: string;
    model_3d?: string | null;
    video_url?: string;
    textures: string[];
  };
  animations: string[];
  voice_profiles: string[];
  error?: {
    code: string;
    message: string;
  };
}

export interface AvatarProvider {
  generateAvatar(request: AvatarGenerationRequest): Promise<AvatarGenerationResult>;
  getAvatarStatus(avatarId: string): Promise<AvatarGenerationResult>;
  deleteAvatar(avatarId: string): Promise<void>;
  listAvatars(userId?: string): Promise<AvatarGenerationResult[]>;
  isHealthy(): Promise<boolean>;
  getProviderInfo(): {
    id: string;
    name: string;
    version: string;
    capabilities: string[];
    limits: {
      max_daily_generations: number;
      max_file_size_mb: number;
      supported_formats: string[];
      [key: string]: any;
    };
  };
}

export class AvatarProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AvatarProviderError';
  }
}

export interface AvatarProviderConfig {
  primary: string; // Provider ID to use as primary
  fallbacks: string[]; // Provider IDs to use as fallbacks
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
}

export interface SceneAvatarConfig {
  slide_id: number;
  avatarId: string;
  avatarPose: string;
  avatarPlacement: {
    x: number;
    y: number;
    scale: number;
  };
  avatarConfig?: {
    voice: string;
    expression: string;
    animation: string;
  };
}

export interface SceneConfiguration {
  deck_id: string;
  created_at: string;
  updated_at: string;
  scenes: SceneAvatarConfig[];
  defaultSettings: {
    avatarPlacement: {
      x: number;
      y: number;
      scale: number;
    };
    avatarPose: string;
    avatarConfig: {
      voice: string;
      expression: string;
      animation: string;
    };
  };
}