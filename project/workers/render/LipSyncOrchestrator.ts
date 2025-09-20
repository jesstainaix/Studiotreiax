// FASE 5 - Lip-Sync Integration System
// Orchestrates avatar animation with TTS audio using D-ID and other providers

import * as fs from 'fs/promises';
import * as path from 'path';
import { DIdAvatarProvider } from '../../providers/avatars/did';
import { AvatarProvider, AvatarGenerationRequest, AvatarGenerationResult } from '../../providers/avatars/types';
import { TTSProvider, TTSGenerationRequest, TTSGenerationResult } from '../../providers/tts/types';

export interface LipSyncJob {
  sceneId: string;
  slideId: number;
  avatarConfig: any;
  audioPath: string;
  textContent: string;
  duration: number;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  metadata?: {
    provider: string;
    processingTime: number;
    hasMarkers: boolean;
    qualityLevel: string;
  };
}

export interface LipSyncConfig {
  projectPath: string;
  outputPath: string;
  primaryProvider: 'did' | 'reallusion' | 'mock';
  fallbackProviders: string[];
  quality: 'low' | 'medium' | 'high';
  maxRetries: number;
  timeoutMs: number;
  enableMarkers: boolean;
}

export interface LipSyncResult {
  success: boolean;
  videoPath?: string;
  markersPath?: string;
  duration?: number;
  provider?: string;
  error?: string;
}

class LipSyncOrchestrator {
  private config: LipSyncConfig;
  private providers: Map<string, AvatarProvider> = new Map();
  private activeJobs: Map<string, LipSyncJob> = new Map();

  constructor(config: LipSyncConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('[LipSyncOrchestrator] Initializing lip-sync orchestrator...');
    
    // Initialize avatar providers
    await this.initializeProviders();
    
    // Ensure output directories exist
    await this.setupOutputDirectories();
    
    console.log('[LipSyncOrchestrator] Lip-sync orchestrator initialized');
  }

  private async initializeProviders(): Promise<void> {
    // Initialize D-ID provider
    if (this.config.primaryProvider === 'did' || 
        this.config.fallbackProviders.includes('did')) {
      
      const didProvider = new DIdAvatarProvider();
      this.providers.set('did', didProvider);
      
      const isHealthy = await didProvider.isHealthy();
      console.log(`[LipSyncOrchestrator] D-ID provider health: ${isHealthy}`);
    }
    
    // Initialize other providers as needed
    // For now, we'll focus on D-ID as primary
    
    console.log(`[LipSyncOrchestrator] Initialized ${this.providers.size} avatar providers`);
  }

  private async setupOutputDirectories(): Promise<void> {
    const dirs = [
      path.join(this.config.outputPath, 'avatars'),
      path.join(this.config.outputPath, 'markers'),
      path.join(this.config.outputPath, 'temp')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async generateLipSyncVideo(job: LipSyncJob): Promise<LipSyncResult> {
    console.log(`[LipSyncOrchestrator] Starting lip-sync generation for scene ${job.sceneId}`);
    
    // Update job status
    this.activeJobs.set(job.sceneId, { ...job, status: 'processing', progress: 0 });
    
    try {
      // Get provider based on configuration and availability
      const provider = await this.getAvailableProvider();
      
      if (!provider) {
        return await this.generateFallbackVideo(job);
      }
      
      // Prepare avatar generation request
      const request = await this.prepareAvatarRequest(job);
      
      // Update progress
      this.updateJobProgress(job.sceneId, 10, 'Sending request to provider...');
      
      // Generate avatar video with lip-sync
      const result = await provider.generateAvatar(request);
      
      // Update progress
      this.updateJobProgress(job.sceneId, 50, 'Processing avatar animation...');
      
      // Poll for completion if needed
      const finalResult = await this.waitForCompletion(provider, result.avatarId, job.sceneId);
      
      // Download and save the generated video
      const videoPath = await this.downloadAvatarVideo(finalResult, job);
      
      // Extract markers if available
      const markersPath = await this.extractLipSyncMarkers(finalResult, job);
      
      // Update job completion
      this.updateJobProgress(job.sceneId, 100, 'Lip-sync video generated successfully');
      this.activeJobs.get(job.sceneId)!.status = 'completed';
      
      console.log(`[LipSyncOrchestrator] Lip-sync completed for scene ${job.sceneId}`);
      
      return {
        success: true,
        videoPath,
        markersPath,
        duration: job.duration,
        provider: provider.getProviderInfo().id
      };
      
    } catch (error) {
      console.error(`[LipSyncOrchestrator] Lip-sync failed for scene ${job.sceneId}:`, error);
      
      this.activeJobs.get(job.sceneId)!.status = 'failed';
      this.activeJobs.get(job.sceneId)!.error = error.message;
      
      // Try fallback method
      return await this.generateFallbackVideo(job);
    }
  }

  private async getAvailableProvider(): Promise<AvatarProvider | null> {
    // Try primary provider first
    const primaryProvider = this.providers.get(this.config.primaryProvider);
    if (primaryProvider && await primaryProvider.isHealthy()) {
      return primaryProvider;
    }
    
    // Try fallback providers
    for (const providerId of this.config.fallbackProviders) {
      const provider = this.providers.get(providerId);
      if (provider && await provider.isHealthy()) {
        return provider;
      }
    }
    
    return null;
  }

  private async prepareAvatarRequest(job: LipSyncJob): Promise<AvatarGenerationRequest> {
    // Load audio file for processing
    const audioPath = path.join(this.config.projectPath, 'data', job.audioPath);
    const audioBuffer = await fs.readFile(audioPath);
    const audioBase64 = audioBuffer.toString('base64');
    
    // Get avatar image if specified
    let photoBase64: string | undefined;
    if (job.avatarConfig.avatarId && job.avatarConfig.avatarId !== 'default') {
      const avatarImagePath = await this.findAvatarImage(job.avatarConfig.avatarId);
      if (avatarImagePath) {
        const imageBuffer = await fs.readFile(avatarImagePath);
        photoBase64 = imageBuffer.toString('base64');
      }
    }
    
    const request: AvatarGenerationRequest = {
      userId: 'system',
      photoBase64,
      voice: job.avatarConfig.avatarConfig?.voice || 'br-female-adult-1',
      emotion: job.avatarConfig.avatarConfig?.expression || 'neutral',
      style: 'realistic',
      quality: this.config.quality,
      customization: {
        // Add any customization from avatar config
      }
    };
    
    return request;
  }

  private async findAvatarImage(avatarId: string): Promise<string | null> {
    const possiblePaths = [
      path.join(this.config.projectPath, 'data', 'avatars', `${avatarId}.jpg`),
      path.join(this.config.projectPath, 'data', 'avatars', `${avatarId}.png`),
      path.join(this.config.projectPath, 'data', 'assets', `${avatarId}.jpg`),
      path.join(this.config.projectPath, 'data', 'assets', `${avatarId}.png`)
    ];
    
    for (const imagePath of possiblePaths) {
      try {
        await fs.access(imagePath);
        return imagePath;
      } catch {
        continue;
      }
    }
    
    return null;
  }

  private async waitForCompletion(
    provider: AvatarProvider,
    avatarId: string,
    sceneId: string,
    maxAttempts = 60
  ): Promise<AvatarGenerationResult> {
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await provider.getAvatarStatus(avatarId);
        
        if (result.status === 'completed') {
          return result;
        } else if (result.status === 'failed') {
          throw new Error(`Avatar generation failed: ${result.error?.message}`);
        }
        
        // Update progress
        const progress = 50 + (attempt / maxAttempts) * 40; // 50-90%
        this.updateJobProgress(sceneId, progress, `Processing avatar... (${attempt}/${maxAttempts})`);
        
        // Wait before next poll
        const delay = Math.min(2000 * attempt, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Avatar generation timeout: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Avatar generation timeout');
  }

  private async downloadAvatarVideo(result: AvatarGenerationResult, job: LipSyncJob): Promise<string> {
    if (!result.assets.video_url) {
      throw new Error('No video URL in avatar result');
    }
    
    const videoPath = path.join(
      this.config.outputPath,
      'avatars',
      `avatar_${job.slideId}.mp4`
    );
    
    // Download video from provider
    const response = await fetch(result.assets.video_url);
    if (!response.ok) {
      throw new Error(`Failed to download avatar video: ${response.status}`);
    }
    
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(videoPath, videoBuffer);
    
    console.log(`[LipSyncOrchestrator] Avatar video downloaded: ${videoPath}`);
    return videoPath;
  }

  private async extractLipSyncMarkers(
    result: AvatarGenerationResult, 
    job: LipSyncJob
  ): Promise<string | undefined> {
    
    if (!this.config.enableMarkers || !result.assets.video_url) {
      return undefined;
    }
    
    // For D-ID, markers might be embedded or available through API
    // This is a placeholder for marker extraction logic
    const markersData = {
      sceneId: job.sceneId,
      duration: job.duration,
      markers: {
        phonemes: [], // Would be populated by provider
        words: [],    // Would be populated by provider
        sentences: [] // Would be populated by provider
      },
      provider: result.providerId,
      generated_at: new Date().toISOString()
    };
    
    const markersPath = path.join(
      this.config.outputPath,
      'markers',
      `scene_${job.slideId}_markers.json`
    );
    
    await fs.writeFile(markersPath, JSON.stringify(markersData, null, 2), 'utf8');
    
    console.log(`[LipSyncOrchestrator] Lip-sync markers saved: ${markersPath}`);
    return markersPath;
  }

  private async generateFallbackVideo(job: LipSyncJob): Promise<LipSyncResult> {
    console.log(`[LipSyncOrchestrator] Generating fallback video for scene ${job.sceneId}`);
    
    try {
      // Create a simple animated avatar using canvas/video processing
      // This is a fallback when no provider is available
      const videoPath = await this.createBasicAvatarVideo(job);
      
      return {
        success: true,
        videoPath,
        duration: job.duration,
        provider: 'fallback'
      };
    } catch (error) {
      return {
        success: false,
        error: `Fallback generation failed: ${error.message}`
      };
    }
  }

  private async createBasicAvatarVideo(job: LipSyncJob): Promise<string> {
    // Create a simple static or basic animated avatar
    const outputPath = path.join(
      this.config.outputPath,
      'avatars',
      `avatar_${job.slideId}_fallback.mp4`
    );
    
    // Use FFmpeg to create a basic avatar video
    const ffmpegCommand = [
      '-f', 'lavfi',
      '-i', `color=c=blue:s=400x400:d=${job.duration}`,
      '-vf', 'drawtext=text=\'Avatar\':fontcolor=white:fontsize=24:x=(w-tw)/2:y=(h-th)/2',
      '-r', '30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-y', outputPath
    ];
    
    await this.executeFFmpegCommand(ffmpegCommand);
    
    console.log(`[LipSyncOrchestrator] Fallback avatar video created: ${outputPath}`);
    return outputPath;
  }

  private async executeFFmpegCommand(command: string[]): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('ffmpeg', command);
      let stderr = '';
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}. Error: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private updateJobProgress(sceneId: string, progress: number, message: string): void {
    const job = this.activeJobs.get(sceneId);
    if (job) {
      job.progress = progress;
      console.log(`[LipSyncOrchestrator] Scene ${sceneId}: ${progress}% - ${message}`);
    }
  }

  async batchProcessScenes(jobs: LipSyncJob[]): Promise<LipSyncResult[]> {
    console.log(`[LipSyncOrchestrator] Processing ${jobs.length} scenes in batch`);
    
    const results: LipSyncResult[] = [];
    const concurrency = 2; // Limit concurrent processing
    
    for (let i = 0; i < jobs.length; i += concurrency) {
      const batch = jobs.slice(i, i + concurrency);
      const batchPromises = batch.map(job => this.generateLipSyncVideo(job));
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const [index, result] of batchResults.entries()) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`[LipSyncOrchestrator] Batch job failed:`, result.reason);
          results.push({
            success: false,
            error: result.reason.message
          });
        }
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`[LipSyncOrchestrator] Batch completed: ${successful}/${jobs.length} successful`);
    
    return results;
  }

  getJobStatus(sceneId: string): LipSyncJob | undefined {
    return this.activeJobs.get(sceneId);
  }

  getAllJobs(): LipSyncJob[] {
    return Array.from(this.activeJobs.values());
  }

  async cleanup(): Promise<void> {
    console.log('[LipSyncOrchestrator] Cleaning up resources...');
    
    // Clean up any temporary files
    const tempDir = path.join(this.config.outputPath, 'temp');
    try {
      await fs.rmdir(tempDir, { recursive: true });
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      console.warn('[LipSyncOrchestrator] Could not clean temp directory:', error.message);
    }
    
    // Clear active jobs
    this.activeJobs.clear();
    
    console.log('[LipSyncOrchestrator] Cleanup completed');
  }
}

export { LipSyncOrchestrator };