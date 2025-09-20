// Shared types for TTS Providers
export interface TTSGenerationRequest {
  text: string;
  language?: string; // e.g., 'pt-BR', 'en-US'
  voice?: string; // Voice ID or name
  style?: string; // Speaking style: 'neutral', 'serious', 'enthusiastic', 'friendly'
  speed?: number; // Speaking speed: 0.5 to 2.0
  pitch?: number; // Voice pitch adjustment
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  format?: 'mp3' | 'wav' | 'ogg';
  scene_id?: string | number; // For tracking purposes
  deck_id?: string; // For organization
}

export interface TTSGenerationResult {
  audio_id: string;
  scene_id?: string | number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  providerId: string;
  metadata: {
    generated_at: string;
    processing_time_ms: number;
    text_length: number;
    language: string;
    voice: string;
    duration_sec?: number;
    file_size_bytes?: number;
    model_version: string;
    quality: string;
    credits_used?: number;
  };
  assets: {
    audio_url: string; // Path to the generated audio file
    markers_url?: string; // Path to timing/phoneme markers if available
  };
  // Optional lip-sync data for future phases
  markers?: {
    phonemes?: Array<{
      phoneme: string;
      start_time: number; // seconds
      end_time: number; // seconds
    }>;
    words?: Array<{
      word: string;
      start_time: number;
      end_time: number;
      confidence?: number;
    }>;
    sentences?: Array<{
      text: string;
      start_time: number;
      end_time: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TTSProvider {
  generateAudio(request: TTSGenerationRequest): Promise<TTSGenerationResult>;
  getAudioStatus(audio_id: string): Promise<TTSGenerationResult>;
  deleteAudio(audio_id: string): Promise<void>;
  listAudios(deck_id?: string): Promise<TTSGenerationResult[]>;
  isHealthy(): Promise<boolean>;
  getProviderInfo(): {
    id: string;
    name: string;
    version: string;
    capabilities: string[];
    supported_languages: string[];
    supported_voices: Array<{
      id: string;
      name: string;
      language: string;
      gender: 'male' | 'female' | 'neutral';
      style?: string;
    }>;
    limits: {
      max_text_length: number;
      max_daily_requests: number;
      max_file_size_mb: number;
      supported_formats: string[];
      [key: string]: any;
    };
  };
}

export class TTSProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'TTSProviderError';
  }
}

export interface TTSProviderConfig {
  primary: string; // Provider ID to use as primary
  fallbacks: string[]; // Provider IDs to use as fallbacks
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  defaultLanguage: string; // Default to 'pt-BR'
  defaultVoice: string;
  defaultQuality: string;
}

export interface SceneAudioConfig {
  slide_id: number;
  audio?: string; // Path to audio file, e.g., "audio/scene_1.mp3"
  audio_duration?: number; // Duration in seconds
  markers?: string; // Path to markers file, e.g., "audio/scene_1.markers.json"
  generated_at?: string;
  voice_used?: string;
}

export interface NarrationJob {
  deck_id: string;
  scenes: Array<{
    scene_id: number;
    text_source: string; // Extracted text for TTS
    voice?: string;
    style?: string;
  }>;
  config: {
    language: string;
    default_voice: string;
    default_style: string;
    quality: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  progress?: {
    total_scenes: number;
    completed_scenes: number;
    failed_scenes: number;
  };
}