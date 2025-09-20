// FASE 5 - Main Render Orchestrator
// Coordinates all rendering components to produce final videos

import * as path from 'path';
import { VideoCompositor, CompositorConfig } from './VideoCompositor';
import { SubtitleGenerator, SubtitleGenerationConfig } from './SubtitleGenerator';
import { LipSyncOrchestrator, LipSyncConfig, LipSyncJob } from './LipSyncOrchestrator';
import { RenderQueue, RenderQueueConfig } from './RenderQueue';
import { ProgressTracker } from './ProgressTracker';
import { FinalExporter, ExportConfig, ExportResult } from './FinalExporter';

export interface RenderJobConfig {
  jobName: string;
  projectPath: string;
  outputPath: string;
  settings: {
    quality: '1080p' | '4K';
    fps: number;
    format: 'mp4' | 'webm' | 'both';
    bitrate: {
      video: string;
      audio: string;
    };
    enableLipSync: boolean;
    enableSubtitles: boolean;
    enableMarkers: boolean;
  };
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    copyright?: string;
  };
}

export interface RenderJobResult {
  success: boolean;
  jobId: string;
  outputs?: {
    mp4Path?: string;
    webmPath?: string;
    srtPath?: string;
  };
  metadata?: {
    duration: number;
    fileSize: number;
    processingTime: number;
    sceneCount: number;
    buildReport: any;
  };
  error?: string;
}

class RenderOrchestrator {
  private renderQueue: RenderQueue;
  private progressTracker: ProgressTracker;
  private isInitialized = false;

  constructor(config?: Partial<RenderQueueConfig>) {
    this.renderQueue = new RenderQueue({
      maxConcurrentJobs: 2,
      maxRetries: 3,
      tempDirectory: '/tmp/render_orchestrator',
      enableLogging: true,
      ...config
    });
    
    this.progressTracker = new ProgressTracker();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[RenderOrchestrator] Initializing render orchestrator...');
    
    await this.renderQueue.initialize();
    
    // Setup event forwarding from render queue to progress tracker
    this.renderQueue.on('jobStarted', (job) => {
      this.progressTracker.startTracking(job.id, 10); // Assume ~10 scenes average
    });
    
    this.renderQueue.on('jobProgress', (job) => {
      this.progressTracker.updateProgress(
        job.id,
        job.progress.phase,
        job.progress.percentage,
        job.progress.message
      );
    });
    
    this.renderQueue.on('jobCompleted', (job) => {
      this.progressTracker.completeJob(job.id, true);
    });
    
    this.renderQueue.on('jobFailed', (job) => {
      this.progressTracker.completeJob(job.id, false, job.error);
    });
    
    this.isInitialized = true;
    console.log('[RenderOrchestrator] Render orchestrator initialized');
  }

  async renderProject(config: RenderJobConfig): Promise<RenderJobResult> {
    console.log('[RenderOrchestrator] Starting project render:', config.jobName);
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Validate project structure
      await this.validateProjectStructure(config.projectPath);
      
      // Add job to render queue
      const jobId = await this.renderQueue.addJob({
        name: config.jobName,
        projectPath: config.projectPath,
        outputPath: config.outputPath,
        config: {
          quality: config.settings.quality,
          fps: config.settings.fps,
          format: config.settings.format,
          bitrate: config.settings.bitrate.video,
          enableLipSync: config.settings.enableLipSync,
          enableSubtitles: config.settings.enableSubtitles
        }
      });

      console.log(`[RenderOrchestrator] Render job queued: ${jobId}`);
      
      return {
        success: true,
        jobId
      };

    } catch (error) {
      console.error('[RenderOrchestrator] Failed to start render job:', error);
      return {
        success: false,
        jobId: '',
        error: error.message
      };
    }
  }

  private async validateProjectStructure(projectPath: string): Promise<void> {
    const fs = await import('fs/promises');
    
    // Check required files
    const requiredFiles = [
      path.join(projectPath, 'data', 'slides.json'),
      path.join(projectPath, 'data', 'scene_config.json'),
      path.join(projectPath, 'data', 'scene_layers.json')
    ];

    for (const filePath of requiredFiles) {
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Required file not found: ${filePath}`);
      }
    }

    console.log('[RenderOrchestrator] Project structure validation passed');
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: any;
    result?: RenderJobResult;
  }> {
    const job = this.renderQueue.getJob(jobId);
    const progressMetrics = this.progressTracker.getJobProgress(jobId);

    if (!job) {
      return {
        status: 'not_found',
        progress: null
      };
    }

    if (job.status === 'completed') {
      return {
        status: 'completed',
        progress: progressMetrics,
        result: {
          success: true,
          jobId,
          outputs: job.outputs,
          metadata: job.outputs?.metadata
        }
      };
    } else if (job.status === 'failed') {
      return {
        status: 'failed',
        progress: progressMetrics,
        result: {
          success: false,
          jobId,
          error: job.error
        }
      };
    }

    return {
      status: job.status,
      progress: progressMetrics
    };
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const cancelled = await this.renderQueue.cancelJob(jobId);
    if (cancelled) {
      this.progressTracker.stopTracking(jobId);
    }
    return cancelled;
  }

  getActiveJobs(): any[] {
    return this.renderQueue.getActiveJobs();
  }

  getQueuedJobs(): any[] {
    return this.renderQueue.getQueuedJobs();
  }

  getAllJobs(): any[] {
    return this.renderQueue.getAllJobs();
  }

  // Convenience method for simple rendering
  async quickRender(
    projectPath: string,
    outputPath: string,
    options: {
      quality?: '1080p' | '4K';
      format?: 'mp4' | 'webm' | 'both';
      enableLipSync?: boolean;
      enableSubtitles?: boolean;
    } = {}
  ): Promise<RenderJobResult> {
    
    const config: RenderJobConfig = {
      jobName: `Quick Render - ${Date.now()}`,
      projectPath,
      outputPath,
      settings: {
        quality: options.quality || '1080p',
        fps: 30,
        format: options.format || 'both',
        bitrate: {
          video: options.quality === '4K' ? '16M' : '8M',
          audio: '128k'
        },
        enableLipSync: options.enableLipSync !== false,
        enableSubtitles: options.enableSubtitles !== false,
        enableMarkers: true
      }
    };

    return await this.renderProject(config);
  }

  // Method to render a specific test case
  async renderTestCase(testName: string = 'test_caso_nr11'): Promise<RenderJobResult> {
    const projectPath = path.resolve('./project');
    const outputPath = path.join(projectPath, 'data', 'renders', `test_${Date.now()}`);
    
    return await this.quickRender(projectPath, outputPath, {
      quality: '1080p',
      format: 'both',
      enableLipSync: true,
      enableSubtitles: true
    });
  }

  async generateBuildReport(jobId: string): Promise<any> {
    const job = this.renderQueue.getJob(jobId);
    const progressMetrics = this.progressTracker.getJobProgress(jobId);

    if (!job || !progressMetrics) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const processingTime = progressMetrics.currentTime - progressMetrics.startTime;

    return {
      jobId,
      jobName: job.name,
      status: job.status,
      startTime: new Date(progressMetrics.startTime).toISOString(),
      endTime: new Date(progressMetrics.currentTime).toISOString(),
      processingTime: {
        totalMs: processingTime,
        formatted: this.formatDuration(processingTime)
      },
      configuration: job.config,
      outputs: job.outputs,
      performance: {
        throughput: progressMetrics.throughput,
        systemMetrics: progressMetrics.performance
      },
      phases: {
        initialization: '10%',
        lipSync: '25%',
        sceneRendering: '45%',
        subtitleGeneration: '10%',
        finalMerge: '10%'
      },
      finalProgress: {
        phase: progressMetrics.phase,
        percentage: progressMetrics.percentage,
        message: progressMetrics.message
      },
      generatedAt: new Date().toISOString()
    };
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async cleanup(): Promise<void> {
    console.log('[RenderOrchestrator] Cleaning up orchestrator...');
    
    await this.renderQueue.cleanup();
    this.progressTracker.cleanup();
    
    this.isInitialized = false;
    console.log('[RenderOrchestrator] Orchestrator cleanup completed');
  }

  // Event subscription methods for UI integration
  on(event: string, listener: (...args: any[]) => void): void {
    this.renderQueue.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.renderQueue.off(event, listener);
  }

  // Static factory method
  static create(config?: Partial<RenderQueueConfig>): RenderOrchestrator {
    return new RenderOrchestrator(config);
  }
}

// Export singleton instance for easy usage
export const renderOrchestrator = new RenderOrchestrator();

export { RenderOrchestrator };