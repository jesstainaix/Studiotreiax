export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  codecs: string[];
  maxResolution?: string;
  supportedFeatures: string[];
}

export interface PlatformPreset {
  id: string;
  name: string;
  platform: string;
  format: string;
  resolution: string;
  frameRate: number;
  bitrate: string;
  aspectRatio: string;
  maxDuration?: number; // in seconds
  maxFileSize?: number; // in MB
  audioCodec: string;
  audioBitrate: string;
  description?: string;
}

export interface ExportSettings {
  format: string;
  resolution: string;
  frameRate: number;
  quality: string;
  codec: string;
  bitrate: string;
  audioFormat: string;
  audioBitrate: string;
  includeWatermark: boolean;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkOpacity: number;
  startTime?: number;
  endTime?: number;
  includeSubtitles: boolean;
  subtitleLanguage?: string;
}

export interface ExportJob {
  id: string;
  name: string;
  settings: ExportSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  outputPath?: string;
  fileSize?: number;
  estimatedTimeRemaining?: number; // in seconds
  errorMessage?: string;
  thumbnailUrl?: string;
}

export interface ExportQueue {
  jobs: ExportJob[];
  currentJob?: ExportJob;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export interface ExportProgress {
  jobId: string;
  progress: number; // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  currentStep: string;
  estimatedTimeRemaining: number; // em milissegundos
  processedFrames: number;
  totalFrames: number;
  outputSize: number; // em bytes
  speed: number; // multiplicador de velocidade (1.0 = tempo real)
}

// Configurações de compressão
export interface CompressionSettings {
  algorithm: 'lossless' | 'h264' | 'h265' | 'vp8' | 'vp9';
  compressionLevel: number; // 0-10
  targetBitrate: number; // 0 = automático
  twoPass: boolean;
  adaptiveBitrate: boolean;
}

// Estimativa de arquivo
export interface FileEstimate {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  qualityScore: number; // 0-100
  downloadTime: number; // em segundos
  uploadTime: number; // em segundos
  sizeReduction: number;
  sizeReductionPercentage: number;
}

// Opções de renderização
export interface RenderOptions {
  format: ExportFormat;
  codec: string;
  resolution: Resolution;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  audioSampleRate: number;
  quality: ExportQuality;
}

export interface ExportHistory {
  id: string;
  projectName: string;
  settings: ExportSettings;
  exportDate: Date;
  outputPath: string;
  fileSize: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
}

export interface CompressionSettings {
  algorithm: 'smart' | 'balanced' | 'quality' | 'size';
  targetFileSize?: number; // in MB
  maxBitrate?: string;
  twoPass: boolean;
  adaptiveBitrate: boolean;
}

export interface WatermarkSettings {
  type: 'text' | 'image' | 'logo';
  content: string; // text or image path
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  customX?: number;
  customY?: number;
  opacity: number; // 0-1
  size: number; // percentage of video size
  color?: string; // for text watermarks
  font?: string; // for text watermarks
  fontSize?: number; // for text watermarks
  rotation?: number; // in degrees
  fadeIn?: number; // in seconds
  fadeOut?: number; // in seconds
}

export interface ExportPreview {
  thumbnails: string[]; // base64 encoded images
  duration: number;
  fileSize: number;
  bitrate: string;
  resolution: string;
  frameRate: number;
  audioChannels: number;
  audioSampleRate: number;
}

export interface BatchExportSettings {
  projects: string[]; // project IDs
  settings: ExportSettings;
  outputDirectory: string;
  namingPattern: string; // e.g., "{projectName}_{timestamp}"
  overwriteExisting: boolean;
  notifyOnCompletion: boolean;
  emailNotification?: string;
}

export interface ExportAnalytics {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  averageExportTime: number;
  totalDataExported: number; // in GB
  popularFormats: { format: string; count: number }[];
  popularResolutions: { resolution: string; count: number }[];
  exportsByDate: { date: string; count: number }[];
}

export interface ExportCapabilities {
  supportedFormats: ExportFormat[];
  maxResolution: string;
  maxFrameRate: number;
  maxBitrate: string;
  supportedCodecs: string[];
  supportedAudioFormats: string[];
  hardwareAcceleration: boolean;
  gpuEncoding: boolean;
  multiThreading: boolean;
  maxConcurrentJobs: number;
}

export interface ExportError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  jobId?: string;
  recoverable: boolean;
  suggestions?: string[];
}

export type ExportEventType = 
  | 'job_started'
  | 'job_progress'
  | 'job_completed'
  | 'job_failed'
  | 'job_cancelled'
  | 'queue_updated'
  | 'export_preview_ready';

export interface ExportEvent {
  type: ExportEventType;
  jobId?: string;
  data?: any;
  timestamp: Date;
}

export interface ExportConfig {
  maxConcurrentJobs: number;
  defaultOutputDirectory: string;
  autoCleanupAfterDays: number;
  enableHardwareAcceleration: boolean;
  enableGpuEncoding: boolean;
  maxMemoryUsage: number; // in MB
  tempDirectory: string;
  enableAnalytics: boolean;
  enableNotifications: boolean;
}