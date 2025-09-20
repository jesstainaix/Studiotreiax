export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // em segundos, para vídeo/áudio
  fileSize: number;
  format: string;
  resolution?: {
    width: number;
    height: number;
  };
  frameRate?: number;
  bitrate?: number;
  uploadedAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface MediaLibraryState {
  assets: MediaAsset[];
  categories: MediaCategory[];
  selectedCategory: string;
  searchQuery: string;
  sortBy: 'name' | 'date' | 'size' | 'duration';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  uploadProgress: UploadProgress[];
}

export interface MediaCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface MediaProcessor {
  generateThumbnail(file: File): Promise<string>;
  extractMetadata(file: File): Promise<Record<string, any>>;
  validateFormat(file: File): boolean;
  compressVideo(file: File, quality: 'low' | 'medium' | 'high'): Promise<File>;
  convertFormat(file: File, targetFormat: string): Promise<File>;
}

export interface PreviewState {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  quality: 'auto' | '480p' | '720p' | '1080p';
  fullscreen: boolean;
}