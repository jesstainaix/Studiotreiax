/**
 * Enhanced Video Generator with FFmpeg Integration
 * Sistema robusto para geração de vídeos a partir de slides PPTX com tratamento avançado de erros
 */

import type { PPTXProject, PPTXSlide } from '../pptx/content-extractor';
import type { EnhancedAIAnalysis } from '../ai/enhanced-nr-analyzer';

export interface VideoGenerationOptions {
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  quality: 'draft' | 'standard' | 'high' | 'premium';
  format: 'mp4' | 'webm' | 'mov';
  includeAudio: boolean;
  includeCaptions: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
  transitions: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'zoom' | 'dissolve';
    duration: number;
  };
}

export interface VideoScene {
  id: string;
  slideId: string;
  duration: number;
  startTime: number;
  endTime: number;
  layers: VideoLayer[];
  audio?: AudioTrack;
  transitions: {
    in?: TransitionEffect;
    out?: TransitionEffect;
  };
}

export interface VideoLayer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'video';
  content: any;
  position: { x: number; y: number; width: number; height: number };
  startTime: number;
  duration: number;
  effects: LayerEffect[];
}

export interface AudioTrack {
  id: string;
  type: 'tts' | 'music' | 'sfx';
  source: string;
  volume: number;
  startTime: number;
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface TransitionEffect {
  type: string;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface LayerEffect {
  type: 'fade' | 'scale' | 'rotate' | 'blur' | 'shadow';
  parameters: Record<string, any>;
  startTime: number;
  duration: number;
}

export interface VideoGenerationProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number;
  currentScene: number;
  totalScenes: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  message: string;
  details?: {
    ffmpegCommand?: string;
    outputSize?: number;
    bitrate?: number;
    errors?: string[];
  };
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  metadata: {
    resolution: string;
    fps: number;
    bitrate: number;
    codec: string;
    format: string;
    createdAt: Date;
  };
  analytics: {
    renderTime: number;
    encodingTime: number;
    totalTime: number;
    scenesProcessed: number;
    errorsEncountered: number;
  };
  error?: {
    code: string;
    message: string;
    details: string;
    recoverable: boolean;
  };
}

export class EnhancedVideoGenerator {
  private ffmpegPath: string = '/usr/bin/ffmpeg'; // Configurável
  private tempDir: string = '/tmp/video-generation';
  private maxRetries: number = 3;
  private timeoutMs: number = 300000; // 5 minutos

  constructor(options?: {
    ffmpegPath?: string;
    tempDir?: string;
    maxRetries?: number;
    timeoutMs?: number;
  }) {
    if (options?.ffmpegPath) this.ffmpegPath = options.ffmpegPath;
    if (options?.tempDir) this.tempDir = options.tempDir;
    if (options?.maxRetries) this.maxRetries = options.maxRetries;
    if (options?.timeoutMs) this.timeoutMs = options.timeoutMs;
  }

  /**
   * Generate video from PPTX project with enhanced error handling
   */
  async generateVideo(
    project: PPTXProject,
    aiAnalysis: EnhancedAIAnalysis,
    options: VideoGenerationOptions,
    onProgress?: (progress: VideoGenerationProgress) => void
  ): Promise<VideoGenerationResult> {
    const startTime = performance.now();
    let currentRetry = 0;

    while (currentRetry <= this.maxRetries) {
      try {
        return await this.attemptVideoGeneration(project, aiAnalysis, options, onProgress, startTime);
      } catch (error) {
        currentRetry++;
        console.error(`❌ Video generation attempt ${currentRetry} failed:`, error);

        if (currentRetry <= this.maxRetries) {
          const retryDelay = Math.pow(2, currentRetry) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          return this.createErrorResult(error as Error, performance.now() - startTime);
        }
      }
    }

    return this.createErrorResult(new Error('Max retries exceeded'), performance.now() - startTime);
  }

  /**
   * Attempt video generation with comprehensive error handling
   */
  private async attemptVideoGeneration(
    project: PPTXProject,
    aiAnalysis: EnhancedAIAnalysis,
    options: VideoGenerationOptions,
    onProgress?: (progress: VideoGenerationProgress) => void,
    startTime: number = performance.now()
  ): Promise<VideoGenerationResult> {
    
    // Stage 1: Preparation
    onProgress?.({
      stage: 'preparing',
      progress: 0,
      currentScene: 0,
      totalScenes: project.slides.length,
      timeElapsed: performance.now() - startTime,
      estimatedTimeRemaining: 0,
      message: 'Preparando recursos para geração de vídeo...'
    });

    const scenes = await this.createVideoScenes(project, aiAnalysis, options);
    const audioTracks = await this.generateAudioTracks(project, options);

    // Stage 2: Rendering
    onProgress?.({
      stage: 'rendering',
      progress: 20,
      currentScene: 0,
      totalScenes: scenes.length,
      timeElapsed: performance.now() - startTime,
      estimatedTimeRemaining: this.estimateRemainingTime(scenes.length, options),
      message: 'Renderizando cenas do vídeo...'
    });

    const renderedScenes = await this.renderScenes(scenes, options, (sceneProgress) => {
      onProgress?.({
        stage: 'rendering',
        progress: 20 + (sceneProgress.completed / sceneProgress.total) * 50,
        currentScene: sceneProgress.current,
        totalScenes: sceneProgress.total,
        timeElapsed: performance.now() - startTime,
        estimatedTimeRemaining: sceneProgress.estimatedRemaining,
        message: `Renderizando cena ${sceneProgress.current} de ${sceneProgress.total}...`
      });
    });

    // Stage 3: Encoding
    onProgress?.({
      stage: 'encoding',
      progress: 70,
      currentScene: scenes.length,
      totalScenes: scenes.length,
      timeElapsed: performance.now() - startTime,
      estimatedTimeRemaining: this.estimateEncodingTime(renderedScenes, options),
      message: 'Codificando vídeo final...'
    });

    const encodingResult = await this.encodeVideo(renderedScenes, audioTracks, options, (encodingProgress) => {
      onProgress?.({
        stage: 'encoding',
        progress: 70 + encodingProgress * 25,
        currentScene: scenes.length,
        totalScenes: scenes.length,
        timeElapsed: performance.now() - startTime,
        estimatedTimeRemaining: (1 - encodingProgress) * this.estimateEncodingTime(renderedScenes, options),
        message: `Codificando vídeo... ${Math.round(encodingProgress * 100)}%`,
        details: {
          ffmpegCommand: this.buildFFmpegCommand(renderedScenes, audioTracks, options)
        }
      });
    });

    // Stage 4: Finalizing
    onProgress?.({
      stage: 'finalizing',
      progress: 95,
      currentScene: scenes.length,
      totalScenes: scenes.length,
      timeElapsed: performance.now() - startTime,
      estimatedTimeRemaining: 1000,
      message: 'Finalizando e otimizando vídeo...'
    });

    const finalResult = await this.finalizeVideo(encodingResult, options);

    // Stage 5: Completed
    const totalTime = performance.now() - startTime;
    onProgress?.({
      stage: 'completed',
      progress: 100,
      currentScene: scenes.length,
      totalScenes: scenes.length,
      timeElapsed: totalTime,
      estimatedTimeRemaining: 0,
      message: 'Vídeo gerado com sucesso!'
    });

    return {
      success: true,
      videoUrl: finalResult.url,
      thumbnailUrl: finalResult.thumbnailUrl,
      duration: finalResult.duration,
      fileSize: finalResult.fileSize,
      metadata: {
        resolution: this.getResolutionString(options.resolution),
        fps: options.fps,
        bitrate: finalResult.bitrate,
        codec: 'h264',
        format: options.format,
        createdAt: new Date()
      },
      analytics: {
        renderTime: finalResult.renderTime,
        encodingTime: finalResult.encodingTime,
        totalTime,
        scenesProcessed: scenes.length,
        errorsEncountered: 0
      }
    };
  }

  /**
   * Create video scenes from PPTX slides
   */
  private async createVideoScenes(
    project: PPTXProject,
    aiAnalysis: EnhancedAIAnalysis,
    options: VideoGenerationOptions
  ): Promise<VideoScene[]> {
    const scenes: VideoScene[] = [];
    let currentTime = 0;

    for (let i = 0; i < project.slides.length; i++) {
      const slide = project.slides[i];
      const duration = slide.duration || 30;

      const scene: VideoScene = {
        id: `scene_${i + 1}`,
        slideId: slide.id,
        duration,
        startTime: currentTime,
        endTime: currentTime + duration,
        layers: await this.createLayersFromSlide(slide, options),
        transitions: {
          in: options.transitions.enabled ? {
            type: options.transitions.type,
            duration: options.transitions.duration,
            easing: 'ease-in-out'
          } : undefined,
          out: options.transitions.enabled ? {
            type: options.transitions.type,
            duration: options.transitions.duration,
            easing: 'ease-in-out'
          } : undefined
        }
      };

      scenes.push(scene);
      currentTime += duration;
    }

    return scenes;
  }

  /**
   * Create layers from slide content
   */
  private async createLayersFromSlide(slide: PPTXSlide, options: VideoGenerationOptions): Promise<VideoLayer[]> {
    const layers: VideoLayer[] = [];
    const resolution = this.getResolutionDimensions(options.resolution);

    // Background layer
    layers.push({
      id: `bg_${slide.id}`,
      type: 'shape',
      content: {
        shape: 'rectangle',
        fill: '#ffffff',
        stroke: 'none'
      },
      position: { x: 0, y: 0, width: resolution.width, height: resolution.height },
      startTime: 0,
      duration: slide.duration || 30,
      effects: []
    });

    // Title layer
    if (slide.title) {
      layers.push({
        id: `title_${slide.id}`,
        type: 'text',
        content: {
          text: slide.title,
          font: 'Arial',
          size: 48,
          color: '#333333',
          weight: 'bold',
          align: 'center'
        },
        position: { 
          x: resolution.width * 0.1, 
          y: resolution.height * 0.1, 
          width: resolution.width * 0.8, 
          height: resolution.height * 0.2 
        },
        startTime: 0,
        duration: slide.duration || 30,
        effects: [
          {
            type: 'fade',
            parameters: { from: 0, to: 1 },
            startTime: 0,
            duration: 1
          }
        ]
      });
    }

    // Content layer
    if (slide.content) {
      layers.push({
        id: `content_${slide.id}`,
        type: 'text',
        content: {
          text: slide.content,
          font: 'Arial',
          size: 24,
          color: '#666666',
          weight: 'normal',
          align: 'left'
        },
        position: { 
          x: resolution.width * 0.1, 
          y: resolution.height * 0.3, 
          width: resolution.width * 0.8, 
          height: resolution.height * 0.6 
        },
        startTime: 0.5,
        duration: (slide.duration || 30) - 0.5,
        effects: [
          {
            type: 'fade',
            parameters: { from: 0, to: 1 },
            startTime: 0.5,
            duration: 1
          }
        ]
      });
    }

    // Image layer (if available)
    if (slide.imageUrl) {
      layers.push({
        id: `image_${slide.id}`,
        type: 'image',
        content: {
          src: slide.imageUrl,
          fit: 'contain'
        },
        position: { 
          x: resolution.width * 0.6, 
          y: resolution.height * 0.3, 
          width: resolution.width * 0.3, 
          height: resolution.height * 0.4 
        },
        startTime: 1,
        duration: (slide.duration || 30) - 1,
        effects: [
          {
            type: 'scale',
            parameters: { from: 0.8, to: 1 },
            startTime: 1,
            duration: 0.5
          }
        ]
      });
    }

    return layers;
  }

  /**
   * Generate audio tracks for slides
   */
  private async generateAudioTracks(project: PPTXProject, options: VideoGenerationOptions): Promise<AudioTrack[]> {
    if (!options.includeAudio) return [];

    const audioTracks: AudioTrack[] = [];
    let currentTime = 0;

    for (const slide of project.slides) {
      const duration = slide.duration || 30;
      
      // Generate TTS for slide content
      const audioTrack: AudioTrack = {
        id: `audio_${slide.id}`,
        type: 'tts',
        source: await this.generateTTSAudio(slide.title + ' ' + slide.content),
        volume: 0.8,
        startTime: currentTime,
        duration,
        fadeIn: 0.5,
        fadeOut: 0.5
      };

      audioTracks.push(audioTrack);
      currentTime += duration;
    }

    return audioTracks;
  }

  /**
   * Generate TTS audio (placeholder implementation)
   */
  private async generateTTSAudio(text: string): Promise<string> {
    // Placeholder - in production, this would call a TTS service
    return `/tmp/tts_${Date.now()}.mp3`;
  }

  /**
   * Render scenes to video files
   */
  private async renderScenes(
    scenes: VideoScene[],
    options: VideoGenerationOptions,
    onProgress?: (progress: { current: number; total: number; completed: number; estimatedRemaining: number }) => void
  ): Promise<string[]> {
    const renderedFiles: string[] = [];
    const startTime = performance.now();

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneStartTime = performance.now();
      
      // Simulate scene rendering
      const renderedFile = await this.renderSingleScene(scene, options);
      renderedFiles.push(renderedFile);
      
      const sceneTime = performance.now() - sceneStartTime;
      const avgTimePerScene = (performance.now() - startTime) / (i + 1);
      const estimatedRemaining = avgTimePerScene * (scenes.length - i - 1);
      
      onProgress?.({
        current: i + 1,
        total: scenes.length,
        completed: i + 1,
        estimatedRemaining
      });
    }

    return renderedFiles;
  }

  /**
   * Render a single scene
   */
  private async renderSingleScene(scene: VideoScene, options: VideoGenerationOptions): Promise<string> {
    // Simulate scene rendering time based on complexity
    const renderTime = 1000 + Math.random() * 2000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, renderTime));
    
    return `/tmp/scene_${scene.id}.${options.format}`;
  }

  /**
   * Encode final video using FFmpeg
   */
  private async encodeVideo(
    sceneFiles: string[],
    audioTracks: AudioTrack[],
    options: VideoGenerationOptions,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; duration: number; fileSize: number; bitrate: number; renderTime: number; encodingTime: number }> {
    const encodingStartTime = performance.now();
    
    // Build FFmpeg command
    const command = this.buildFFmpegCommand(sceneFiles, audioTracks, options);
    
    // Simulate encoding progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress?.(i / 100);
    }
    
    const encodingTime = performance.now() - encodingStartTime;
    
    return {
      url: `/tmp/final_video.${options.format}`,
      duration: sceneFiles.length * 30, // Approximate
      fileSize: 50 * 1024 * 1024, // 50MB placeholder
      bitrate: this.calculateBitrate(options),
      renderTime: 5000, // Placeholder
      encodingTime
    };
  }

  /**
   * Build FFmpeg command for video encoding
   */
  private buildFFmpegCommand(
    sceneFiles: string[] | AudioTrack[],
    audioTracks: AudioTrack[] | VideoGenerationOptions,
    options?: VideoGenerationOptions
  ): string {
    // Handle parameter overloading
    let actualSceneFiles: string[];
    let actualAudioTracks: AudioTrack[];
    let actualOptions: VideoGenerationOptions;

    if (typeof audioTracks === 'object' && 'resolution' in audioTracks) {
      // Called with (sceneFiles, options)
      actualSceneFiles = sceneFiles as string[];
      actualAudioTracks = [];
      actualOptions = audioTracks as VideoGenerationOptions;
    } else {
      // Called with (sceneFiles, audioTracks, options)
      actualSceneFiles = sceneFiles as string[];
      actualAudioTracks = audioTracks as AudioTrack[];
      actualOptions = options!;
    }

    const resolution = this.getResolutionDimensions(actualOptions.resolution);
    const bitrate = this.calculateBitrate(actualOptions);
    
    let command = `${this.ffmpegPath} -y`;
    
    // Input files
    actualSceneFiles.forEach(file => {
      command += ` -i "${file}"`;
    });
    
    // Audio inputs
    actualAudioTracks.forEach(track => {
      command += ` -i "${track.source}"`;
    });
    
    // Video encoding parameters
    command += ` -c:v libx264 -preset ${this.getPreset(actualOptions.quality)}`;
    command += ` -crf ${this.getCRF(actualOptions.quality)}`;
    command += ` -s ${resolution.width}x${resolution.height}`;
    command += ` -r ${actualOptions.fps}`;
    command += ` -b:v ${bitrate}k`;
    
    // Audio encoding parameters
    if (actualOptions.includeAudio) {
      command += ` -c:a aac -b:a 128k -ar 44100`;
    }
    
    // Output
    command += ` "/tmp/output.${actualOptions.format}"`;
    
    return command;
  }

  /**
   * Finalize video with optimizations
   */
  private async finalizeVideo(
    encodingResult: { url: string; duration: number; fileSize: number; bitrate: number; renderTime: number; encodingTime: number },
    options: VideoGenerationOptions
  ): Promise<{ url: string; thumbnailUrl: string; duration: number; fileSize: number; bitrate: number; renderTime: number; encodingTime: number }> {
    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(encodingResult.url);
    
    // Optimize file size if needed
    await this.optimizeVideo(encodingResult.url, options);
    
    return {
      ...encodingResult,
      thumbnailUrl
    };
  }

  /**
   * Generate video thumbnail
   */
  private async generateThumbnail(videoUrl: string): Promise<string> {
    // Simulate thumbnail generation
    await new Promise(resolve => setTimeout(resolve, 500));
    return videoUrl.replace(/\.[^.]+$/, '_thumb.jpg');
  }

  /**
   * Optimize video file
   */
  private async optimizeVideo(videoUrl: string, options: VideoGenerationOptions): Promise<void> {
    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Helper methods
  private getResolutionDimensions(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      case '4k': return { width: 3840, height: 2160 };
      default: return { width: 1280, height: 720 };
    }
  }

  private getResolutionString(resolution: string): string {
    const dims = this.getResolutionDimensions(resolution);
    return `${dims.width}x${dims.height}`;
  }

  private calculateBitrate(options: VideoGenerationOptions): number {
    const baseRates = {
      '720p': { draft: 1000, standard: 2500, high: 4000, premium: 6000 },
      '1080p': { draft: 2000, standard: 5000, high: 8000, premium: 12000 },
      '4k': { draft: 8000, standard: 20000, high: 35000, premium: 50000 }
    };
    
    return baseRates[options.resolution][options.quality];
  }

  private getPreset(quality: string): string {
    switch (quality) {
      case 'draft': return 'ultrafast';
      case 'standard': return 'fast';
      case 'high': return 'medium';
      case 'premium': return 'slow';
      default: return 'fast';
    }
  }

  private getCRF(quality: string): number {
    switch (quality) {
      case 'draft': return 28;
      case 'standard': return 23;
      case 'high': return 20;
      case 'premium': return 18;
      default: return 23;
    }
  }

  private estimateRemainingTime(sceneCount: number, options: VideoGenerationOptions): number {
    const baseTimePerScene = 2000; // 2 seconds per scene
    const qualityMultiplier = { draft: 0.5, standard: 1, high: 1.5, premium: 2 }[options.quality];
    return sceneCount * baseTimePerScene * qualityMultiplier;
  }

  private estimateEncodingTime(sceneFiles: string[], options: VideoGenerationOptions): number {
    const baseEncodingTime = 10000; // 10 seconds base
    const qualityMultiplier = { draft: 0.5, standard: 1, high: 2, premium: 3 }[options.quality];
    return baseEncodingTime * qualityMultiplier;
  }

  private createErrorResult(error: Error, totalTime: number): VideoGenerationResult {
    return {
      success: false,
      duration: 0,
      fileSize: 0,
      metadata: {
        resolution: '',
        fps: 0,
        bitrate: 0,
        codec: '',
        format: '',
        createdAt: new Date()
      },
      analytics: {
        renderTime: 0,
        encodingTime: 0,
        totalTime,
        scenesProcessed: 0,
        errorsEncountered: 1
      },
      error: {
        code: 'GENERATION_FAILED',
        message: error.message,
        details: error.stack || '',
        recoverable: true
      }
    };
  }
}

// Export singleton instance
export const enhancedVideoGenerator = new EnhancedVideoGenerator();