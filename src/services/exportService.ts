import { create } from 'zustand';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { videoCacheService } from './videoCacheService';
import { distributedCacheManager } from './distributedCacheService';

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  category: 'video' | 'audio' | 'image';
  description: string;
  defaultSettings: ExportSettings;
  supportedCodecs: string[];
  maxResolution?: string;
  isPremium: boolean;
}

export interface ExportSettings {
  format: string;
  codec: string;
  resolution: string;
  framerate: number;
  bitrate: number;
  audioBitrate: number;
  audioSampleRate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  profile?: string;
  level?: string;
  pixelFormat: string;
  colorSpace: string;
  hdr: boolean;
  twoPass: boolean;
  customFlags: string[];
}

export interface ExportJob {
  id: string;
  name: string;
  format: ExportFormat;
  settings: ExportSettings;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  fileSize?: number;
  error?: string;
  logs: string[];
  priority: 'low' | 'normal' | 'high';
  estimatedTime?: number;
  actualTime?: number;
}

export interface ExportQueue {
  jobs: ExportJob[];
  activeJob: ExportJob | null;
  maxConcurrentJobs: number;
  totalProgress: number;
}

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  settings: ExportSettings;
  category: 'web' | 'social' | 'broadcast' | 'archive' | 'mobile';
  platform?: string;
  isCustom: boolean;
}

export interface ExportState {
  formats: ExportFormat[];
  presets: ExportPreset[];
  queue: ExportQueue;
  selectedFormat: ExportFormat | null;
  selectedPreset: ExportPreset | null;
  currentSettings: ExportSettings | null;
  isExporting: boolean;
  ffmpegLoaded: boolean;
  
  // Actions
  loadFormats: () => void;
  loadPresets: () => void;
  selectFormat: (formatId: string) => void;
  selectPreset: (presetId: string) => void;
  updateSettings: (settings: Partial<ExportSettings>) => void;
  addToQueue: (job: Omit<ExportJob, 'id' | 'status' | 'progress' | 'logs'>) => string;
  removeFromQueue: (jobId: string) => void;
  startExport: (jobId: string) => Promise<void>;
  cancelExport: (jobId: string) => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
  clearQueue: () => void;
  createPreset: (preset: Omit<ExportPreset, 'id'>) => ExportPreset;
  deletePreset: (presetId: string) => void;
  estimateExportTime: (settings: ExportSettings, duration: number) => number;
  optimizeSettings: (targetSize: number, duration: number) => ExportSettings;
}

class ExportService {
  private ffmpeg: FFmpeg | null = null;
  private isInitialized = false;
  private workers: Worker[] = [];
  private maxWorkers = navigator.hardwareConcurrency || 4;
  private builtInFormats: ExportFormat[] = [];
  private builtInPresets: ExportPreset[] = [];

  constructor() {
    this.initializeFFmpeg();
    this.initializeBuiltInFormats();
    this.initializeBuiltInPresets();
  }

  getBuiltInFormats(): ExportFormat[] {
    return this.builtInFormats;
  }

  getBuiltInPresets(): ExportPreset[] {
    return this.builtInPresets;
  }

  isFFmpegLoaded(): boolean {
    return this.isInitialized;
  }

  private async initializeFFmpeg() {
    try {
      // Check if FFmpeg is already loaded
      if (this.isInitialized) {
        return;
      }

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      // Load FFmpeg with timeout and retry logic
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      this.ffmpeg = new FFmpeg();
      const loadPromise = this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg load timeout')), 30000);
      });

      await Promise.race([loadPromise, timeoutPromise]);
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('⚠️ FFmpeg initialization failed, video export features will be limited:', error);
      this.isInitialized = false;
      
      // Set a flag to retry later if needed
      setTimeout(() => {
        if (!this.isInitialized) {
          this.initializeFFmpeg();
        }
      }, 5000);
    }
  }

  private initializeBuiltInFormats() {
    const formats: ExportFormat[] = [
      {
        id: 'mp4_h264',
        name: 'MP4 (H.264)',
        extension: 'mp4',
        mimeType: 'video/mp4',
        category: 'video',
        description: 'Standard MP4 with H.264 codec - best compatibility',
        defaultSettings: {
          format: 'mp4',
          codec: 'libx264',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 5000,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          profile: 'high',
          level: '4.1',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: []
        },
        supportedCodecs: ['libx264', 'libx265', 'h264_nvenc', 'h265_nvenc'],
        isPremium: false
      },
      {
        id: 'mp4_h265',
        name: 'MP4 (H.265/HEVC)',
        extension: 'mp4',
        mimeType: 'video/mp4',
        category: 'video',
        description: 'MP4 with H.265 codec - better compression, smaller files',
        defaultSettings: {
          format: 'mp4',
          codec: 'libx265',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 3000,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          profile: 'main',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: []
        },
        supportedCodecs: ['libx265', 'h265_nvenc'],
        isPremium: true
      },
      {
        id: 'webm_vp9',
        name: 'WebM (VP9)',
        extension: 'webm',
        mimeType: 'video/webm',
        category: 'video',
        description: 'WebM with VP9 codec - optimized for web streaming',
        defaultSettings: {
          format: 'webm',
          codec: 'libvpx-vp9',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 4000,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: true,
          customFlags: ['-row-mt', '1']
        },
        supportedCodecs: ['libvpx-vp9', 'libvpx'],
        isPremium: false
      },
      {
        id: 'mov_prores',
        name: 'MOV (ProRes)',
        extension: 'mov',
        mimeType: 'video/quicktime',
        category: 'video',
        description: 'Apple ProRes - professional editing format',
        defaultSettings: {
          format: 'mov',
          codec: 'prores_ks',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 150000,
          audioBitrate: 256,
          audioSampleRate: 48000,
          quality: 'ultra',
          preset: 'medium',
          profile: 'hq',
          pixelFormat: 'yuv422p10le',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: []
        },
        supportedCodecs: ['prores_ks', 'prores'],
        isPremium: true
      },
      {
        id: 'gif',
        name: 'Animated GIF',
        extension: 'gif',
        mimeType: 'image/gif',
        category: 'image',
        description: 'Animated GIF for social media and web',
        defaultSettings: {
          format: 'gif',
          codec: 'gif',
          resolution: '720x720',
          framerate: 15,
          bitrate: 0,
          audioBitrate: 0,
          audioSampleRate: 0,
          quality: 'medium',
          preset: 'medium',
          pixelFormat: 'rgb24',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: ['-vf', 'palettegen', '-vf', 'paletteuse']
        },
        supportedCodecs: ['gif'],
        isPremium: false
      },
      {
        id: 'mp3',
        name: 'MP3 Audio',
        extension: 'mp3',
        mimeType: 'audio/mpeg',
        category: 'audio',
        description: 'MP3 audio extraction',
        defaultSettings: {
          format: 'mp3',
          codec: 'libmp3lame',
          resolution: '',
          framerate: 0,
          bitrate: 0,
          audioBitrate: 320,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          pixelFormat: '',
          colorSpace: '',
          hdr: false,
          twoPass: false,
          customFlags: []
        },
        supportedCodecs: ['libmp3lame'],
        isPremium: false
      }
    ];

    this.builtInFormats = formats;
  }

  private initializeBuiltInPresets() {
    const presets: ExportPreset[] = [
      {
        id: 'youtube_1080p',
        name: 'YouTube 1080p',
        description: 'Optimized for YouTube 1080p uploads',
        category: 'social',
        platform: 'youtube',
        isCustom: false,
        settings: {
          format: 'mp4',
          codec: 'libx264',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 8000,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          profile: 'high',
          level: '4.1',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: true,
          customFlags: ['-movflags', '+faststart']
        }
      },
      {
        id: 'instagram_story',
        name: 'Instagram Story',
        description: 'Vertical format for Instagram Stories',
        category: 'social',
        platform: 'instagram',
        isCustom: false,
        settings: {
          format: 'mp4',
          codec: 'libx264',
          resolution: '1080x1920',
          framerate: 30,
          bitrate: 3500,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          profile: 'high',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: ['-movflags', '+faststart']
        }
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Optimized for TikTok uploads',
        category: 'social',
        platform: 'tiktok',
        isCustom: false,
        settings: {
          format: 'mp4',
          codec: 'libx264',
          resolution: '1080x1920',
          framerate: 30,
          bitrate: 4000,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'medium',
          profile: 'high',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: ['-movflags', '+faststart']
        }
      },
      {
        id: 'web_streaming',
        name: 'Web Streaming',
        description: 'Optimized for web streaming and progressive download',
        category: 'web',
        isCustom: false,
        settings: {
          format: 'mp4',
          codec: 'libx264',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 5000,
          audioBitrate: 128,
          audioSampleRate: 48000,
          quality: 'high',
          preset: 'fast',
          profile: 'high',
          pixelFormat: 'yuv420p',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: ['-movflags', '+faststart', '-tune', 'zerolatency']
        }
      },
      {
        id: 'archive_quality',
        name: 'Archive Quality',
        description: 'High quality for long-term storage',
        category: 'archive',
        isCustom: false,
        settings: {
          format: 'mov',
          codec: 'prores_ks',
          resolution: '1920x1080',
          framerate: 30,
          bitrate: 150000,
          audioBitrate: 256,
          audioSampleRate: 48000,
          quality: 'ultra',
          preset: 'slow',
          profile: 'hq',
          pixelFormat: 'yuv422p10le',
          colorSpace: 'bt709',
          hdr: false,
          twoPass: false,
          customFlags: []
        }
      }
    ];

    this.builtInPresets = presets;
  }

  async exportVideo(
    inputPath: string,
    outputPath: string,
    settings: ExportSettings,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('FFmpeg not initialized');
    }

    try {
      // Build FFmpeg command
      const command = this.buildFFmpegCommand(inputPath, outputPath, settings);
      
      // Set up progress monitoring
      this.ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          onProgress(progress * 100);
        }
      });

      // Execute FFmpeg command
      await this.ffmpeg.exec(command);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    settings: ExportSettings
  ): string[] {
    const command: string[] = [];
    
    // Input
    command.push('-i', inputPath);
    
    // Video codec and settings
    if (settings.category !== 'audio') {
      command.push('-c:v', settings.codec);
      
      if (settings.resolution) {
        command.push('-s', settings.resolution);
      }
      
      if (settings.framerate > 0) {
        command.push('-r', settings.framerate.toString());
      }
      
      if (settings.bitrate > 0) {
        command.push('-b:v', `${settings.bitrate}k`);
      }
      
      if (settings.pixelFormat) {
        command.push('-pix_fmt', settings.pixelFormat);
      }
      
      if (settings.preset) {
        command.push('-preset', settings.preset);
      }
      
      if (settings.profile) {
        command.push('-profile:v', settings.profile);
      }
      
      if (settings.level) {
        command.push('-level', settings.level);
      }
    }
    
    // Audio settings
    if (settings.format !== 'gif' && settings.audioBitrate > 0) {
      command.push('-c:a', 'aac');
      command.push('-b:a', `${settings.audioBitrate}k`);
      command.push('-ar', settings.audioSampleRate.toString());
    } else if (settings.format === 'gif') {
      command.push('-an'); // No audio for GIF
    }
    
    // Two-pass encoding
    if (settings.twoPass && settings.format !== 'gif') {
      // This would require two separate commands in a real implementation
      command.push('-pass', '1');
    }
    
    // Custom flags
    if (settings.customFlags.length > 0) {
      command.push(...settings.customFlags);
    }
    
    // Output format
    command.push('-f', settings.format);
    
    // Overwrite output
    command.push('-y');
    
    // Output file
    command.push(outputPath);
    
    return command;
  }

  estimateExportTime(settings: ExportSettings, duration: number): number {
    // Basic estimation based on codec, resolution, and quality
    const baseTime = duration; // Start with video duration
    
    let multiplier = 1;
    
    // Codec complexity
    switch (settings.codec) {
      case 'libx264':
        multiplier *= 1;
        break;
      case 'libx265':
        multiplier *= 3;
        break;
      case 'libvpx-vp9':
        multiplier *= 4;
        break;
      case 'prores_ks':
        multiplier *= 0.5;
        break;
    }
    
    // Resolution impact
    const [width, height] = settings.resolution.split('x').map(Number);
    const pixels = width * height;
    const hdPixels = 1920 * 1080;
    multiplier *= Math.sqrt(pixels / hdPixels);
    
    // Quality preset impact
    switch (settings.preset) {
      case 'ultrafast':
        multiplier *= 0.1;
        break;
      case 'superfast':
        multiplier *= 0.2;
        break;
      case 'veryfast':
        multiplier *= 0.3;
        break;
      case 'faster':
        multiplier *= 0.5;
        break;
      case 'fast':
        multiplier *= 0.7;
        break;
      case 'medium':
        multiplier *= 1;
        break;
      case 'slow':
        multiplier *= 2;
        break;
      case 'slower':
        multiplier *= 4;
        break;
      case 'veryslow':
        multiplier *= 8;
        break;
    }
    
    // Two-pass encoding
    if (settings.twoPass) {
      multiplier *= 2;
    }
    
    return baseTime * multiplier;
  }

  optimizeSettings(targetSize: number, duration: number): ExportSettings {
    // Calculate target bitrate based on file size and duration
    const targetBitrate = Math.floor((targetSize * 8) / duration / 1000); // kbps
    
    // Reserve 10% for audio
    const videoBitrate = Math.floor(targetBitrate * 0.9);
    const audioBitrate = Math.min(128, Math.floor(targetBitrate * 0.1));
    
    return {
      format: 'mp4',
      codec: 'libx264',
      resolution: '1920x1080',
      framerate: 30,
      bitrate: videoBitrate,
      audioBitrate,
      audioSampleRate: 48000,
      quality: 'medium',
      preset: 'medium',
      profile: 'high',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      hdr: false,
      twoPass: targetSize > 100 * 1024 * 1024, // Use two-pass for files > 100MB
      customFlags: ['-movflags', '+faststart']
    };
  }

  async processQueue() {
    // This method will be called from the store
    // Implementation moved to store level
  }

  async processJob(job: ExportJob, onProgress?: (progress: number) => void, onStatusChange?: (status: string, error?: string) => void) {
    if (onStatusChange) {
      onStatusChange('processing');
    }
    
    try {
      await this.exportVideo(
        'input.mp4', // This would be the actual input file
        job.outputPath,
        job.settings,
        onProgress
      );
      
      if (onStatusChange) {
        onStatusChange('completed');
      }
      
    } catch (error) {
      if (onStatusChange) {
        onStatusChange('failed', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  dispose() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}

// Create singleton instance
const exportService = new ExportService();

// Zustand store for export state
export const useExport = create<ExportState>((set, get) => ({
  formats: exportService.getBuiltInFormats(),
  presets: exportService.getBuiltInPresets(),
  queue: {
    jobs: [],
    activeJob: null,
    maxConcurrentJobs: 1,
    totalProgress: 0
  },
  selectedFormat: null,
  selectedPreset: null,
  currentSettings: null,
  isExporting: false,
  ffmpegLoaded: exportService.isFFmpegLoaded(),

  loadFormats: () => {
    set({ formats: exportService.getBuiltInFormats() });
  },

  loadPresets: () => {
    set({ presets: exportService.getBuiltInPresets() });
  },

  selectFormat: (formatId) => {
    const { formats } = get();
    const format = formats.find(f => f.id === formatId);
    set({ 
      selectedFormat: format || null,
      currentSettings: format?.defaultSettings || null
    });
  },

  selectPreset: (presetId) => {
    const { presets } = get();
    const preset = presets.find(p => p.id === presetId);
    set({ 
      selectedPreset: preset || null,
      currentSettings: preset?.settings || null
    });
  },

  updateSettings: (newSettings) => {
    const { currentSettings } = get();
    if (currentSettings) {
      set({ 
        currentSettings: { ...currentSettings, ...newSettings }
      });
    }
  },

  addToQueue: (jobData) => {
    const job: ExportJob = {
      ...jobData,
      id: Date.now().toString(),
      status: 'pending',
      progress: 0,
      logs: [],
      estimatedTime: exportService.estimateExportTime(jobData.settings, jobData.duration || 0)
    };

    set(state => ({
      queue: {
        ...state.queue,
        jobs: [...state.queue.jobs, job]
      }
    }));

    // Start processing queue if no active job
    const { resumeQueue } = get();
    setTimeout(() => resumeQueue(), 100);

    return job.id;
  },

  removeFromQueue: (jobId) => {
    set(state => ({
      queue: {
        ...state.queue,
        jobs: state.queue.jobs.filter(job => job.id !== jobId)
      }
    }));
  },

  startExport: async (jobId) => {
    const { queue } = get();
    const job = queue.jobs.find(j => j.id === jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    set({ isExporting: true });
    
    // Update job status to processing
    set(state => ({
      queue: {
        ...state.queue,
        activeJob: job,
        jobs: state.queue.jobs.map(j => 
          j.id === job.id 
            ? { ...j, status: 'processing', startTime: new Date() }
            : j
        )
      }
    }));
    
    try {
      await exportService.processJob(
        job,
        (progress) => {
          set(state => ({
            queue: {
              ...state.queue,
              jobs: state.queue.jobs.map(j => 
                j.id === job.id ? { ...j, progress } : j
              )
            }
          }));
        },
        (status, error) => {
          set(state => ({
            queue: {
              ...state.queue,
              activeJob: status === 'completed' || status === 'failed' ? null : state.queue.activeJob,
              jobs: state.queue.jobs.map(j => 
                j.id === job.id 
                  ? { 
                      ...j, 
                      status: status as any,
                      progress: status === 'completed' ? 100 : j.progress,
                      endTime: status === 'completed' || status === 'failed' ? new Date() : j.endTime,
                      actualTime: status === 'completed' || status === 'failed' 
                        ? Date.now() - (j.startTime?.getTime() || Date.now())
                        : j.actualTime,
                      error: status === 'failed' ? error : j.error
                    }
                  : j
              )
            }
          }));
        }
      );
    } finally {
      set({ isExporting: false });
    }
  },

  cancelExport: (jobId) => {
    set(state => ({
      queue: {
        ...state.queue,
        jobs: state.queue.jobs.map(job => 
          job.id === jobId 
            ? { ...job, status: 'cancelled' }
            : job
        )
      }
    }));
  },

  pauseQueue: () => {
    // Implementation would pause the active job
  },

  resumeQueue: () => {
    const { queue, startExport } = get();
    
    if (queue.activeJob || queue.jobs.length === 0) {
      return;
    }
    
    const nextJob = queue.jobs.find(job => job.status === 'pending');
    if (nextJob) {
      startExport(nextJob.id);
    }
  },

  clearQueue: () => {
    set(state => ({
      queue: {
        ...state.queue,
        jobs: state.queue.jobs.filter(job => job.status === 'processing')
      }
    }));
  },

  createPreset: (presetData) => {
    const preset: ExportPreset = {
      ...presetData,
      id: Date.now().toString(),
      isCustom: true
    };

    set(state => ({
      presets: [...state.presets, preset]
    }));

    return preset;
  },

  deletePreset: (presetId) => {
    set(state => ({
      presets: state.presets.filter(preset => 
        preset.id !== presetId || !preset.isCustom
      )
    }));
  },

  estimateExportTime: (settings, duration) => {
    return exportService.estimateExportTime(settings, duration);
  },

  optimizeSettings: (targetSize, duration) => {
    return exportService.optimizeSettings(targetSize, duration);
  }
}));

export default exportService;