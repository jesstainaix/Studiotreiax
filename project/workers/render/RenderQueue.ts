// FASE 5 - Render Worker Queue System
// Orchestrates the complete rendering pipeline with FFmpeg and queue management

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { VideoCompositor, CompositorConfig, SceneRenderJob, useCompositorStore } from './VideoCompositor';
import { SubtitleGenerator, SubtitleGenerationConfig } from './SubtitleGenerator';
import { LipSyncOrchestrator, LipSyncConfig, LipSyncJob } from './LipSyncOrchestrator';

export interface RenderJob {
  id: string;
  name: string;
  projectPath: string;
  outputPath: string;
  config: {
    quality: '1080p' | '4K';
    fps: number;
    format: 'mp4' | 'webm' | 'both';
    bitrate: string;
    enableLipSync: boolean;
    enableSubtitles: boolean;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    phase: 'initialization' | 'lip_sync' | 'scene_rendering' | 'subtitle_generation' | 'final_merge' | 'completed';
    percentage: number;
    currentScene?: number;
    totalScenes?: number;
    message: string;
    eta?: number;
  };
  startTime?: number;
  endTime?: number;
  error?: string;
  outputs?: {
    mp4Path?: string;
    webmPath?: string;
    srtPath?: string;
    metadata?: any;
  };
}

export interface RenderQueueConfig {
  maxConcurrentJobs: number;
  maxRetries: number;
  tempDirectory: string;
  enableLogging: boolean;
  ffmpegPath?: string;
}

class RenderQueue extends EventEmitter {
  private config: RenderQueueConfig;
  private jobs: Map<string, RenderJob> = new Map();
  private activeJobs: Set<string> = new Set();
  private queue: string[] = [];

  constructor(config: RenderQueueConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('[RenderQueue] Initializing render queue...');
    
    // Ensure temp directory exists
    await fs.mkdir(this.config.tempDirectory, { recursive: true });
    
    // Test FFmpeg availability
    await this.testFFmpegAvailability();
    
    console.log('[RenderQueue] Render queue initialized');
  }

  private async testFFmpegAvailability(): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.ffmpegPath || 'ffmpeg', ['-version']);
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log('[RenderQueue] FFmpeg is available');
          resolve();
        } else {
          reject(new Error('FFmpeg not available or not working'));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`FFmpeg test failed: ${error.message}`));
      });
    });
  }

  async addJob(jobConfig: {
    name: string;
    projectPath: string;
    outputPath: string;
    config: RenderJob['config'];
  }): Promise<string> {
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: RenderJob = {
      id: jobId,
      name: jobConfig.name,
      projectPath: jobConfig.projectPath,
      outputPath: jobConfig.outputPath,
      config: jobConfig.config,
      status: 'queued',
      progress: {
        phase: 'initialization',
        percentage: 0,
        message: 'Job queued for processing'
      }
    };
    
    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    
    console.log(`[RenderQueue] Job added to queue: ${jobId} - ${job.name}`);
    
    // Emit event
    this.emit('jobAdded', job);
    
    // Process queue
    this.processQueue();
    
    return jobId;
  }

  private async processQueue(): Promise<void> {
    if (this.activeJobs.size >= this.config.maxConcurrentJobs || this.queue.length === 0) {
      return;
    }
    
    const jobId = this.queue.shift();
    if (!jobId) return;
    
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    this.activeJobs.add(jobId);
    
    console.log(`[RenderQueue] Starting job processing: ${jobId}`);
    
    try {
      await this.processJob(job);
    } catch (error) {
      console.error(`[RenderQueue] Job processing failed: ${jobId}`, error);
    } finally {
      this.activeJobs.delete(jobId);
      // Continue processing queue
      this.processQueue();
    }
  }

  private async processJob(job: RenderJob): Promise<void> {
    job.status = 'processing';
    job.startTime = Date.now();
    
    this.updateJobProgress(job.id, 'initialization', 5, 'Initializing rendering components...');
    this.emit('jobStarted', job);
    
    try {
      // Phase 1: Initialize components
      const { compositor, subtitleGenerator, lipSyncOrchestrator } = await this.initializeComponents(job);
      
      // Phase 2: Generate lip-sync videos if enabled
      if (job.config.enableLipSync) {
        await this.processLipSync(job, lipSyncOrchestrator);
      }
      
      // Phase 3: Render all scenes
      await this.processSceneRendering(job, compositor);
      
      // Phase 4: Generate subtitles if enabled
      if (job.config.enableSubtitles) {
        await this.processSubtitleGeneration(job, subtitleGenerator);
      }
      
      // Phase 5: Merge to final video(s)
      await this.processFinalMerge(job, compositor);
      
      // Complete job
      await this.completeJob(job);
      
    } catch (error) {
      await this.failJob(job, error);
    }
  }

  private async initializeComponents(job: RenderJob): Promise<{
    compositor: VideoCompositor;
    subtitleGenerator: SubtitleGenerator;
    lipSyncOrchestrator: LipSyncOrchestrator;
  }> {
    
    const compositorConfig: CompositorConfig = {
      projectPath: job.projectPath,
      outputPath: job.outputPath,
      quality: job.config.quality,
      fps: job.config.fps,
      bitrate: job.config.bitrate,
      format: job.config.format
    };
    
    const subtitleConfig: SubtitleGenerationConfig = {
      projectPath: job.projectPath,
      outputPath: job.outputPath,
      language: 'pt-BR',
      maxCharsPerLine: 40,
      maxLinesPerSubtitle: 2,
      minDuration: 2,
      maxDuration: 8
    };
    
    const lipSyncConfig: LipSyncConfig = {
      projectPath: job.projectPath,
      outputPath: job.outputPath,
      primaryProvider: 'did',
      fallbackProviders: ['mock'],
      quality: job.config.quality === '4K' ? 'high' : 'medium',
      maxRetries: 3,
      timeoutMs: 300000, // 5 minutes
      enableMarkers: true
    };
    
    const compositor = new VideoCompositor(compositorConfig);
    const subtitleGenerator = new SubtitleGenerator(subtitleConfig);
    const lipSyncOrchestrator = new LipSyncOrchestrator(lipSyncConfig);
    
    await compositor.initialize();
    await subtitleGenerator.initialize();
    await lipSyncOrchestrator.initialize();
    
    this.updateJobProgress(job.id, 'initialization', 10, 'Components initialized');
    
    return { compositor, subtitleGenerator, lipSyncOrchestrator };
  }

  private async processLipSync(job: RenderJob, lipSyncOrchestrator: LipSyncOrchestrator): Promise<void> {
    this.updateJobProgress(job.id, 'lip_sync', 15, 'Generating avatar lip-sync videos...');
    
    // Get scene data to create lip-sync jobs
    const scenes = useCompositorStore.getState().scenes;
    const lipSyncJobs: LipSyncJob[] = [];
    
    for (const scene of scenes) {
      if (scene.audioPath) {
        const lipSyncJob: LipSyncJob = {
          sceneId: scene.sceneId,
          slideId: scene.slideId,
          avatarConfig: scene.avatarConfig,
          audioPath: scene.audioPath,
          textContent: await this.extractSceneText(job.projectPath, scene.slideId),
          duration: scene.duration,
          outputPath: path.join(job.outputPath, 'avatars', `avatar_${scene.slideId}.mp4`),
          status: 'pending',
          progress: 0
        };
        
        lipSyncJobs.push(lipSyncJob);
      }
    }
    
    if (lipSyncJobs.length > 0) {
      const results = await lipSyncOrchestrator.batchProcessScenes(lipSyncJobs);
      
      const successful = results.filter(r => r.success).length;
      console.log(`[RenderQueue] Lip-sync completed: ${successful}/${results.length} successful`);
      
      this.updateJobProgress(job.id, 'lip_sync', 30, `Lip-sync completed (${successful}/${results.length})`);
    } else {
      this.updateJobProgress(job.id, 'lip_sync', 30, 'No audio found, skipping lip-sync');
    }
  }

  private async extractSceneText(projectPath: string, slideId: number): Promise<string> {
    try {
      const slidesPath = path.join(projectPath, 'data', 'slides.json');
      const slidesData = JSON.parse(await fs.readFile(slidesPath, 'utf8'));
      const slide = slidesData.slides.find((s: any) => s.id === slideId);
      
      if (!slide) return '';
      
      const textParts = [];
      if (slide.title) textParts.push(slide.title);
      if (slide.text) textParts.push(slide.text);
      if (slide.notes) textParts.push(slide.notes);
      
      return textParts.join(' ');
    } catch (error) {
      console.warn(`[RenderQueue] Could not extract text for slide ${slideId}:`, error.message);
      return '';
    }
  }

  private async processSceneRendering(job: RenderJob, compositor: VideoCompositor): Promise<void> {
    this.updateJobProgress(job.id, 'scene_rendering', 35, 'Rendering individual scenes...');
    
    // Subscribe to compositor progress
    const unsubscribe = useCompositorStore.subscribe(
      (state) => state.progress,
      (progress) => {
        const percentage = 35 + (progress.overallProgress * 0.4); // 35-75%
        this.updateJobProgress(
          job.id,
          'scene_rendering',
          percentage,
          `Rendering scene ${progress.currentScene}/${progress.totalScenes}`,
          progress.estimatedTimeRemaining
        );
      }
    );
    
    try {
      await compositor.renderAllScenes();
      this.updateJobProgress(job.id, 'scene_rendering', 75, 'All scenes rendered successfully');
    } finally {
      unsubscribe();
    }
  }

  private async processSubtitleGeneration(job: RenderJob, subtitleGenerator: SubtitleGenerator): Promise<void> {
    this.updateJobProgress(job.id, 'subtitle_generation', 80, 'Generating subtitles...');
    
    const srtPath = await subtitleGenerator.generateSubtitles();
    
    // Validate subtitles
    const validation = await subtitleGenerator.validateSubtitles(srtPath);
    
    if (!validation.isValid) {
      console.warn('[RenderQueue] Subtitle validation warnings:', validation.errors);
    }
    
    // Store subtitle path in job outputs
    if (!job.outputs) job.outputs = {};
    job.outputs.srtPath = srtPath;
    
    this.updateJobProgress(
      job.id,
      'subtitle_generation',
      85,
      `Subtitles generated (${validation.statistics.totalEntries} entries)`
    );
  }

  private async processFinalMerge(job: RenderJob, compositor: VideoCompositor): Promise<void> {
    this.updateJobProgress(job.id, 'final_merge', 90, 'Merging scenes to final video...');
    
    await compositor.mergeScenesToFinalVideo();
    
    const finalOutput = useCompositorStore.getState().finalOutput;
    
    // Store output paths in job
    if (!job.outputs) job.outputs = {};
    job.outputs.mp4Path = finalOutput.mp4Path;
    job.outputs.webmPath = finalOutput.webmPath;
    job.outputs.metadata = finalOutput.metadata;
    
    this.updateJobProgress(job.id, 'final_merge', 95, 'Final video merge completed');
  }

  private async completeJob(job: RenderJob): Promise<void> {
    job.status = 'completed';
    job.endTime = Date.now();
    
    this.updateJobProgress(job.id, 'completed', 100, 'Rendering completed successfully');
    
    // Generate build report
    await this.generateBuildReport(job);
    
    console.log(`[RenderQueue] Job completed successfully: ${job.id}`);
    this.emit('jobCompleted', job);
  }

  private async failJob(job: RenderJob, error: any): Promise<void> {
    job.status = 'failed';
    job.endTime = Date.now();
    job.error = error.message;
    
    this.updateJobProgress(
      job.id,
      job.progress.phase,
      job.progress.percentage,
      `Job failed: ${error.message}`
    );
    
    console.error(`[RenderQueue] Job failed: ${job.id}`, error);
    this.emit('jobFailed', job);
  }

  private async generateBuildReport(job: RenderJob): Promise<void> {
    const processingTime = job.endTime! - job.startTime!;
    const processingTimeMin = Math.floor(processingTime / 60000);
    const processingTimeSec = Math.floor((processingTime % 60000) / 1000);
    
    const report = {
      jobId: job.id,
      jobName: job.name,
      status: job.status,
      processingTime: {
        total_ms: processingTime,
        total_formatted: `${processingTimeMin}m ${processingTimeSec}s`
      },
      configuration: job.config,
      outputs: job.outputs,
      statistics: {
        total_scenes: useCompositorStore.getState().scenes.length,
        completed_scenes: useCompositorStore.getState().scenes.filter(s => s.status === 'completed').length,
        failed_scenes: useCompositorStore.getState().scenes.filter(s => s.status === 'failed').length
      },
      generated_at: new Date().toISOString()
    };
    
    const reportPath = path.join(job.outputPath, 'build_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`[RenderQueue] Build report generated: ${reportPath}`);
  }

  private updateJobProgress(
    jobId: string,
    phase: RenderJob['progress']['phase'],
    percentage: number,
    message: string,
    eta?: number
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    job.progress = {
      phase,
      percentage: Math.round(percentage),
      message,
      eta
    };
    
    console.log(`[RenderQueue] Job ${jobId}: ${percentage}% - ${message}`);
    this.emit('jobProgress', job);
  }

  getJob(jobId: string): RenderJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): RenderJob[] {
    return Array.from(this.jobs.values());
  }

  getActiveJobs(): RenderJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === 'processing');
  }

  getQueuedJobs(): RenderJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === 'queued');
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === 'queued') {
      // Remove from queue
      const queueIndex = this.queue.indexOf(jobId);
      if (queueIndex >= 0) {
        this.queue.splice(queueIndex, 1);
      }
      
      job.status = 'cancelled';
      job.endTime = Date.now();
      
      console.log(`[RenderQueue] Job cancelled: ${jobId}`);
      this.emit('jobCancelled', job);
      
      return true;
    }
    
    // For processing jobs, set status and let the process handle cleanup
    if (job.status === 'processing') {
      job.status = 'cancelled';
      console.log(`[RenderQueue] Job cancellation requested: ${jobId}`);
      this.emit('jobCancelled', job);
      return true;
    }
    
    return false;
  }

  async cleanup(): Promise<void> {
    console.log('[RenderQueue] Cleaning up render queue...');
    
    // Cancel any queued jobs
    for (const jobId of this.queue) {
      await this.cancelJob(jobId);
    }
    
    // Clear data structures
    this.jobs.clear();
    this.activeJobs.clear();
    this.queue = [];
    
    console.log('[RenderQueue] Render queue cleanup completed');
  }
}

export { RenderQueue };