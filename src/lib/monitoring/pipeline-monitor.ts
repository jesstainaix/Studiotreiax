/**
 * Pipeline Monitoring System
 * Sistema avançado de monitoramento em tempo real para o pipeline PPTX→Vídeo
 */

import type { VideoGenerationProgress } from '../video/enhanced-video-generator';
import type { SyncResult } from '../sync/tts-sync-system';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
  duration?: number;
  estimatedDuration?: number;
  estimatedTimeRemaining?: number;
  dependencies: string[];
  outputs: string[];
  metrics: StageMetrics;
  errors: PipelineError[];
  warnings: PipelineWarning[];
}

export interface StageMetrics {
  memoryUsage: number; // MB
  cpuUsage: number; // %
  diskUsage: number; // MB
  networkUsage: number; // MB
  throughput: number; // items/second
  errorRate: number; // %
  successRate: number; // %
  averageProcessingTime: number; // ms
  peakMemoryUsage: number; // MB
  totalItemsProcessed: number;
}

export interface PipelineError {
  id: string;
  stage: string;
  code: string;
  message: string;
  details: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
  context: Record<string, any>;
}

export interface PipelineWarning {
  id: string;
  stage: string;
  message: string;
  timestamp: number;
  type: 'performance' | 'quality' | 'compatibility' | 'resource';
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface PipelineStatus {
  id: string;
  name: string;
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  overallProgress: number; // 0-100
  currentStage: string;
  stages: PipelineStage[];
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  estimatedTotalDuration: number;
  estimatedTimeRemaining: number;
  metrics: PipelineMetrics;
  resourceUsage: ResourceUsage;
  qualityMetrics: QualityMetrics;
  errors: PipelineError[];
  warnings: PipelineWarning[];
  logs: PipelineLog[];
}

export interface PipelineMetrics {
  totalSlides: number;
  processedSlides: number;
  totalScenes: number;
  processedScenes: number;
  totalAudioSegments: number;
  processedAudioSegments: number;
  totalVideoFrames: number;
  processedVideoFrames: number;
  outputFileSize: number; // MB
  compressionRatio: number;
  averageProcessingSpeed: number; // slides/minute
  peakProcessingSpeed: number; // slides/minute
  errorCount: number;
  warningCount: number;
  retryCount: number;
}

export interface ResourceUsage {
  cpu: {
    current: number; // %
    average: number; // %
    peak: number; // %
    cores: number;
  };
  memory: {
    current: number; // MB
    average: number; // MB
    peak: number; // MB
    total: number; // MB
    available: number; // MB
  };
  disk: {
    used: number; // MB
    available: number; // MB
    readSpeed: number; // MB/s
    writeSpeed: number; // MB/s
    iops: number;
  };
  network: {
    download: number; // MB/s
    upload: number; // MB/s
    latency: number; // ms
    totalTransferred: number; // MB
  };
  gpu?: {
    usage: number; // %
    memory: number; // MB
    temperature: number; // °C
  };
}

export interface QualityMetrics {
  videoQuality: {
    resolution: string;
    bitrate: number; // kbps
    fps: number;
    codec: string;
    psnr?: number; // Peak Signal-to-Noise Ratio
    ssim?: number; // Structural Similarity Index
  };
  audioQuality: {
    sampleRate: number; // Hz
    bitrate: number; // kbps
    channels: number;
    codec: string;
    snr?: number; // Signal-to-Noise Ratio
  };
  syncAccuracy: {
    averageOffset: number; // ms
    maxOffset: number; // ms
    syncScore: number; // 0-100
  };
  contentAccuracy: {
    textRecognitionAccuracy: number; // %
    imageProcessingAccuracy: number; // %
    layoutPreservation: number; // %
  };
}

export interface PipelineLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  stage: string;
  message: string;
  details?: any;
  duration?: number;
  context: Record<string, any>;
}

export interface MonitoringConfiguration {
  updateInterval: number; // ms
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableResourceMonitoring: boolean;
  enableQualityMonitoring: boolean;
  maxLogEntries: number;
  alertThresholds: {
    memoryUsage: number; // %
    cpuUsage: number; // %
    diskUsage: number; // %
    errorRate: number; // %
    processingSpeed: number; // slides/minute
  };
  notifications: {
    email: boolean;
    webhook: boolean;
    desktop: boolean;
  };
}

export type PipelineEventType = 
  | 'stage_started'
  | 'stage_completed'
  | 'stage_failed'
  | 'progress_updated'
  | 'error_occurred'
  | 'warning_issued'
  | 'resource_alert'
  | 'quality_alert'
  | 'pipeline_completed'
  | 'pipeline_failed';

export interface PipelineEvent {
  type: PipelineEventType;
  timestamp: number;
  pipelineId: string;
  stageId?: string;
  data: any;
}

export type PipelineEventListener = (event: PipelineEvent) => void;

export class PipelineMonitor {
  private config: MonitoringConfiguration;
  private pipelines: Map<string, PipelineStatus> = new Map();
  private eventListeners: Map<PipelineEventType, PipelineEventListener[]> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private resourceMonitor?: NodeJS.Timeout;

  constructor(config: MonitoringConfiguration) {
    this.config = config;
    this.initializeEventListeners();
    
    if (config.enableResourceMonitoring) {
      this.startResourceMonitoring();
    }
  }

  /**
   * Create and start monitoring a new pipeline
   */
  createPipeline(
    id: string,
    name: string,
    stages: Omit<PipelineStage, 'status' | 'progress' | 'metrics' | 'errors' | 'warnings'>[]
  ): PipelineStatus {
    const pipeline: PipelineStatus = {
      id,
      name,
      status: 'initializing',
      overallProgress: 0,
      currentStage: stages[0]?.id || '',
      stages: stages.map(stage => ({
        ...stage,
        status: 'pending',
        progress: 0,
        metrics: this.createEmptyMetrics(),
        errors: [],
        warnings: []
      })),
      startTime: Date.now(),
      estimatedTotalDuration: this.estimateTotalDuration(stages),
      estimatedTimeRemaining: this.estimateTotalDuration(stages),
      metrics: this.createEmptyPipelineMetrics(),
      resourceUsage: this.createEmptyResourceUsage(),
      qualityMetrics: this.createEmptyQualityMetrics(),
      errors: [],
      warnings: [],
      logs: []
    };

    this.pipelines.set(id, pipeline);
    this.startMonitoring(id);
    
    this.emitEvent({
      type: 'stage_started',
      timestamp: Date.now(),
      pipelineId: id,
      data: { pipeline }
    });

    return pipeline;
  }

  /**
   * Update stage progress
   */
  updateStageProgress(
    pipelineId: string,
    stageId: string,
    progress: number,
    metrics?: Partial<StageMetrics>
  ): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage) return;

    // Update stage
    stage.progress = Math.min(100, Math.max(0, progress));
    if (metrics) {
      Object.assign(stage.metrics, metrics);
    }

    // Update stage status
    if (stage.progress === 100 && stage.status === 'running') {
      stage.status = 'completed';
      stage.endTime = Date.now();
      stage.duration = stage.endTime - (stage.startTime || Date.now());
      
      this.emitEvent({
        type: 'stage_completed',
        timestamp: Date.now(),
        pipelineId,
        stageId,
        data: { stage }
      });
    }

    // Update overall progress
    const totalProgress = pipeline.stages.reduce((sum, s) => sum + s.progress, 0);
    pipeline.overallProgress = totalProgress / pipeline.stages.length;

    // Update current stage
    const runningStage = pipeline.stages.find(s => s.status === 'running');
    if (runningStage) {
      pipeline.currentStage = runningStage.id;
    }

    // Update estimated time remaining
    pipeline.estimatedTimeRemaining = this.calculateTimeRemaining(pipeline);

    this.emitEvent({
      type: 'progress_updated',
      timestamp: Date.now(),
      pipelineId,
      stageId,
      data: { progress, pipeline }
    });

    this.addLog(pipelineId, 'info', stageId, `Progress updated: ${progress}%`);
  }

  /**
   * Start a pipeline stage
   */
  startStage(pipelineId: string, stageId: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage) return;

    stage.status = 'running';
    stage.startTime = Date.now();
    pipeline.status = 'running';
    pipeline.currentStage = stageId;

    this.emitEvent({
      type: 'stage_started',
      timestamp: Date.now(),
      pipelineId,
      stageId,
      data: { stage }
    });

    this.addLog(pipelineId, 'info', stageId, `Stage started: ${stage.name}`);
  }

  /**
   * Complete a pipeline stage
   */
  completeStage(pipelineId: string, stageId: string, outputs?: string[]): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage) return;

    stage.status = 'completed';
    stage.progress = 100;
    stage.endTime = Date.now();
    stage.duration = stage.endTime - (stage.startTime || Date.now());
    
    if (outputs) {
      stage.outputs = outputs;
    }

    // Check if all stages are completed
    const allCompleted = pipeline.stages.every(s => s.status === 'completed' || s.status === 'skipped');
    if (allCompleted) {
      this.completePipeline(pipelineId);
    } else {
      // Start next stage if dependencies are met
      this.startNextStage(pipelineId);
    }

    this.emitEvent({
      type: 'stage_completed',
      timestamp: Date.now(),
      pipelineId,
      stageId,
      data: { stage }
    });

    this.addLog(pipelineId, 'info', stageId, `Stage completed: ${stage.name}`);
  }

  /**
   * Fail a pipeline stage
   */
  failStage(pipelineId: string, stageId: string, error: Omit<PipelineError, 'id' | 'timestamp'>): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage) return;

    const pipelineError: PipelineError = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    stage.status = 'failed';
    stage.errors.push(pipelineError);
    pipeline.errors.push(pipelineError);

    // Determine if pipeline should fail or continue
    if (pipelineError.severity === 'critical' || !pipelineError.recoverable) {
      this.failPipeline(pipelineId, pipelineError);
    }

    this.emitEvent({
      type: 'stage_failed',
      timestamp: Date.now(),
      pipelineId,
      stageId,
      data: { stage, error: pipelineError }
    });

    this.emitEvent({
      type: 'error_occurred',
      timestamp: Date.now(),
      pipelineId,
      stageId,
      data: { error: pipelineError }
    });

    this.addLog(pipelineId, 'error', stageId, `Stage failed: ${error.message}`, { error: pipelineError });
  }

  /**
   * Add warning to stage
   */
  addWarning(pipelineId: string, stageId: string, warning: Omit<PipelineWarning, 'id' | 'timestamp'>): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage) return;

    const pipelineWarning: PipelineWarning = {
      ...warning,
      id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    stage.warnings.push(pipelineWarning);
    pipeline.warnings.push(pipelineWarning);

    this.emitEvent({
      type: 'warning_issued',
      timestamp: Date.now(),
      pipelineId,
      stageId,
      data: { warning: pipelineWarning }
    });

    this.addLog(pipelineId, 'warn', stageId, `Warning: ${warning.message}`, { warning: pipelineWarning });
  }

  /**
   * Get pipeline status
   */
  getPipelineStatus(pipelineId: string): PipelineStatus | undefined {
    return this.pipelines.get(pipelineId);
  }

  /**
   * Get all pipelines
   */
  getAllPipelines(): PipelineStatus[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: PipelineEventType, listener: PipelineEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: PipelineEventType, listener: PipelineEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Stop monitoring a pipeline
   */
  stopMonitoring(pipelineId: string): void {
    const interval = this.updateIntervals.get(pipelineId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(pipelineId);
    }
  }

  /**
   * Cleanup and stop all monitoring
   */
  destroy(): void {
    // Stop all pipeline monitoring
    for (const [pipelineId] of this.updateIntervals) {
      this.stopMonitoring(pipelineId);
    }

    // Stop resource monitoring
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
    }

    // Clear all data
    this.pipelines.clear();
    this.eventListeners.clear();
  }

  // Private methods
  private initializeEventListeners(): void {
    const eventTypes: PipelineEventType[] = [
      'stage_started', 'stage_completed', 'stage_failed',
      'progress_updated', 'error_occurred', 'warning_issued',
      'resource_alert', 'quality_alert', 'pipeline_completed', 'pipeline_failed'
    ];

    eventTypes.forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  private startMonitoring(pipelineId: string): void {
    const interval = setInterval(() => {
      this.updatePipelineMetrics(pipelineId);
    }, this.config.updateInterval);

    this.updateIntervals.set(pipelineId, interval);
  }

  private startResourceMonitoring(): void {
    this.resourceMonitor = setInterval(() => {
      this.updateResourceMetrics();
    }, this.config.updateInterval);
  }

  private updatePipelineMetrics(pipelineId: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline || pipeline.status === 'completed' || pipeline.status === 'failed') {
      this.stopMonitoring(pipelineId);
      return;
    }

    // Update metrics based on current stage progress
    this.calculatePipelineMetrics(pipeline);
    
    // Check for alerts
    this.checkAlerts(pipeline);
  }

  private updateResourceMetrics(): void {
    // Simulate resource monitoring (in production, use actual system metrics)
    for (const [pipelineId, pipeline] of this.pipelines) {
      if (pipeline.status === 'running') {
        pipeline.resourceUsage = {
          cpu: {
            current: 30 + Math.random() * 40,
            average: 45,
            peak: 85,
            cores: 8
          },
          memory: {
            current: 2048 + Math.random() * 1024,
            average: 2500,
            peak: 4096,
            total: 16384,
            available: 12288
          },
          disk: {
            used: 1024 + Math.random() * 512,
            available: 51200,
            readSpeed: 150 + Math.random() * 50,
            writeSpeed: 100 + Math.random() * 30,
            iops: 1000 + Math.random() * 500
          },
          network: {
            download: 10 + Math.random() * 5,
            upload: 2 + Math.random() * 1,
            latency: 20 + Math.random() * 10,
            totalTransferred: 500 + Math.random() * 200
          }
        };
      }
    }
  }

  private calculatePipelineMetrics(pipeline: PipelineStatus): void {
    const runningStages = pipeline.stages.filter(s => s.status === 'running' || s.status === 'completed');
    
    if (runningStages.length > 0) {
      const avgSpeed = runningStages.reduce((sum, stage) => sum + stage.metrics.throughput, 0) / runningStages.length;
      pipeline.metrics.averageProcessingSpeed = avgSpeed;
      
      const totalErrors = pipeline.stages.reduce((sum, stage) => sum + stage.errors.length, 0);
      pipeline.metrics.errorCount = totalErrors;
      
      const totalWarnings = pipeline.stages.reduce((sum, stage) => sum + stage.warnings.length, 0);
      pipeline.metrics.warningCount = totalWarnings;
    }
  }

  private checkAlerts(pipeline: PipelineStatus): void {
    const { alertThresholds } = this.config;
    
    // Memory usage alert
    if (pipeline.resourceUsage.memory.current / pipeline.resourceUsage.memory.total * 100 > alertThresholds.memoryUsage) {
      this.emitEvent({
        type: 'resource_alert',
        timestamp: Date.now(),
        pipelineId: pipeline.id,
        data: {
          type: 'memory',
          usage: pipeline.resourceUsage.memory.current,
          threshold: alertThresholds.memoryUsage
        }
      });
    }

    // CPU usage alert
    if (pipeline.resourceUsage.cpu.current > alertThresholds.cpuUsage) {
      this.emitEvent({
        type: 'resource_alert',
        timestamp: Date.now(),
        pipelineId: pipeline.id,
        data: {
          type: 'cpu',
          usage: pipeline.resourceUsage.cpu.current,
          threshold: alertThresholds.cpuUsage
        }
      });
    }

    // Processing speed alert
    if (pipeline.metrics.averageProcessingSpeed < alertThresholds.processingSpeed) {
      this.emitEvent({
        type: 'quality_alert',
        timestamp: Date.now(),
        pipelineId: pipeline.id,
        data: {
          type: 'processing_speed',
          speed: pipeline.metrics.averageProcessingSpeed,
          threshold: alertThresholds.processingSpeed
        }
      });
    }
  }

  private startNextStage(pipelineId: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const nextStage = pipeline.stages.find(stage => {
      if (stage.status !== 'pending') return false;
      
      // Check if all dependencies are completed
      return stage.dependencies.every(depId => {
        const depStage = pipeline.stages.find(s => s.id === depId);
        return depStage?.status === 'completed' || depStage?.status === 'skipped';
      });
    });

    if (nextStage) {
      this.startStage(pipelineId, nextStage.id);
    }
  }

  private completePipeline(pipelineId: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    pipeline.status = 'completed';
    pipeline.endTime = Date.now();
    pipeline.totalDuration = pipeline.endTime - pipeline.startTime;
    pipeline.overallProgress = 100;

    this.emitEvent({
      type: 'pipeline_completed',
      timestamp: Date.now(),
      pipelineId,
      data: { pipeline }
    });

    this.addLog(pipelineId, 'info', '', `Pipeline completed successfully in ${pipeline.totalDuration}ms`);
    this.stopMonitoring(pipelineId);
  }

  private failPipeline(pipelineId: string, error: PipelineError): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    pipeline.status = 'failed';
    pipeline.endTime = Date.now();
    pipeline.totalDuration = pipeline.endTime - pipeline.startTime;

    this.emitEvent({
      type: 'pipeline_failed',
      timestamp: Date.now(),
      pipelineId,
      data: { pipeline, error }
    });

    this.addLog(pipelineId, 'error', '', `Pipeline failed: ${error.message}`, { error });
    this.stopMonitoring(pipelineId);
  }

  private addLog(
    pipelineId: string,
    level: PipelineLog['level'],
    stage: string,
    message: string,
    details?: any,
    duration?: number
  ): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return;

    const log: PipelineLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      stage,
      message,
      details,
      duration,
      context: {
        pipelineId,
        currentStage: pipeline.currentStage,
        overallProgress: pipeline.overallProgress
      }
    };

    pipeline.logs.push(log);

    // Limit log entries
    if (pipeline.logs.length > this.config.maxLogEntries) {
      pipeline.logs.splice(0, pipeline.logs.length - this.config.maxLogEntries);
    }
  }

  private emitEvent(event: PipelineEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in pipeline event listener:', error);
        }
      });
    }
  }

  private estimateTotalDuration(stages: any[]): number {
    // Simple estimation based on stage count and complexity
    return stages.length * 30000; // 30 seconds per stage
  }

  private calculateTimeRemaining(pipeline: PipelineStatus): number {
    const completedStages = pipeline.stages.filter(s => s.status === 'completed').length;
    const totalStages = pipeline.stages.length;
    const elapsedTime = Date.now() - pipeline.startTime;
    
    if (completedStages === 0) return pipeline.estimatedTotalDuration;
    
    const avgTimePerStage = elapsedTime / completedStages;
    const remainingStages = totalStages - completedStages;
    
    return remainingStages * avgTimePerStage;
  }

  private createEmptyMetrics(): StageMetrics {
    return {
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkUsage: 0,
      throughput: 0,
      errorRate: 0,
      successRate: 100,
      averageProcessingTime: 0,
      peakMemoryUsage: 0,
      totalItemsProcessed: 0
    };
  }

  private createEmptyPipelineMetrics(): PipelineMetrics {
    return {
      totalSlides: 0,
      processedSlides: 0,
      totalScenes: 0,
      processedScenes: 0,
      totalAudioSegments: 0,
      processedAudioSegments: 0,
      totalVideoFrames: 0,
      processedVideoFrames: 0,
      outputFileSize: 0,
      compressionRatio: 0,
      averageProcessingSpeed: 0,
      peakProcessingSpeed: 0,
      errorCount: 0,
      warningCount: 0,
      retryCount: 0
    };
  }

  private createEmptyResourceUsage(): ResourceUsage {
    return {
      cpu: { current: 0, average: 0, peak: 0, cores: 1 },
      memory: { current: 0, average: 0, peak: 0, total: 0, available: 0 },
      disk: { used: 0, available: 0, readSpeed: 0, writeSpeed: 0, iops: 0 },
      network: { download: 0, upload: 0, latency: 0, totalTransferred: 0 }
    };
  }

  private createEmptyQualityMetrics(): QualityMetrics {
    return {
      videoQuality: {
        resolution: '',
        bitrate: 0,
        fps: 0,
        codec: ''
      },
      audioQuality: {
        sampleRate: 0,
        bitrate: 0,
        channels: 0,
        codec: ''
      },
      syncAccuracy: {
        averageOffset: 0,
        maxOffset: 0,
        syncScore: 0
      },
      contentAccuracy: {
        textRecognitionAccuracy: 0,
        imageProcessingAccuracy: 0,
        layoutPreservation: 0
      }
    };
  }
}

// Export singleton instance with default configuration
export const pipelineMonitor = new PipelineMonitor({
  updateInterval: 1000, // 1 second
  logLevel: 'info',
  enableMetrics: true,
  enableResourceMonitoring: true,
  enableQualityMonitoring: true,
  maxLogEntries: 1000,
  alertThresholds: {
    memoryUsage: 80, // %
    cpuUsage: 90, // %
    diskUsage: 85, // %
    errorRate: 5, // %
    processingSpeed: 1 // slides/minute
  },
  notifications: {
    email: false,
    webhook: false,
    desktop: true
  }
});