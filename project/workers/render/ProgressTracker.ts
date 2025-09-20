// FASE 5 - Progress Tracking System
// Real-time progress updates and time estimation for rendering pipeline

import { EventEmitter } from 'events';
import { RenderJob } from './RenderQueue';

export interface ProgressMetrics {
  jobId: string;
  phase: RenderJob['progress']['phase'];
  percentage: number;
  message: string;
  startTime: number;
  currentTime: number;
  estimatedTotalTime?: number;
  estimatedTimeRemaining?: number;
  throughput?: {
    scenesPerMinute: number;
    averageSceneTime: number;
    totalScenes: number;
    completedScenes: number;
  };
  performance?: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
  };
}

export interface ProgressUpdate {
  type: 'progress' | 'phase_change' | 'error' | 'completion';
  jobId: string;
  data: Partial<ProgressMetrics>;
  timestamp: number;
}

class ProgressTracker extends EventEmitter {
  private jobs: Map<string, ProgressMetrics> = new Map();
  private phaseWeights: Record<RenderJob['progress']['phase'], number> = {
    'initialization': 10,
    'lip_sync': 25,
    'scene_rendering': 45,
    'subtitle_generation': 10,
    'final_merge': 10,
    'completed': 0
  };

  constructor() {
    super();
  }

  startTracking(jobId: string, totalScenes: number = 0): void {
    const metrics: ProgressMetrics = {
      jobId,
      phase: 'initialization',
      percentage: 0,
      message: 'Starting job...',
      startTime: Date.now(),
      currentTime: Date.now(),
      throughput: {
        scenesPerMinute: 0,
        averageSceneTime: 0,
        totalScenes,
        completedScenes: 0
      },
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskIO: 0
      }
    };

    this.jobs.set(jobId, metrics);
    this.emit('trackingStarted', jobId, metrics);
    
    console.log(`[ProgressTracker] Started tracking job: ${jobId}`);
  }

  updateProgress(
    jobId: string,
    phase: RenderJob['progress']['phase'],
    percentage: number,
    message: string,
    additionalData?: Partial<ProgressMetrics>
  ): void {
    const metrics = this.jobs.get(jobId);
    if (!metrics) {
      console.warn(`[ProgressTracker] Job not found: ${jobId}`);
      return;
    }

    const wasPhaseChange = metrics.phase !== phase;
    const currentTime = Date.now();

    // Update metrics
    metrics.phase = phase;
    metrics.percentage = Math.min(100, Math.max(0, percentage));
    metrics.message = message;
    metrics.currentTime = currentTime;

    // Merge additional data
    if (additionalData) {
      Object.assign(metrics, additionalData);
    }

    // Calculate estimates
    this.updateTimeEstimates(metrics);
    this.updateThroughputMetrics(metrics);
    this.updatePerformanceMetrics(metrics);

    // Emit events
    if (wasPhaseChange) {
      this.emitUpdate('phase_change', jobId, metrics);
    }
    
    this.emitUpdate('progress', jobId, metrics);

    console.log(`[ProgressTracker] ${jobId}: ${phase} ${percentage}% - ${message}`);
  }

  updateSceneCompletion(jobId: string, completedScenes: number): void {
    const metrics = this.jobs.get(jobId);
    if (!metrics || !metrics.throughput) return;

    metrics.throughput.completedScenes = completedScenes;
    
    // Update throughput calculations
    const elapsedMinutes = (metrics.currentTime - metrics.startTime) / 60000;
    if (elapsedMinutes > 0) {
      metrics.throughput.scenesPerMinute = completedScenes / elapsedMinutes;
      metrics.throughput.averageSceneTime = elapsedMinutes / Math.max(completedScenes, 1);
    }

    this.updateTimeEstimates(metrics);
  }

  private updateTimeEstimates(metrics: ProgressMetrics): void {
    const elapsed = metrics.currentTime - metrics.startTime;
    
    if (metrics.percentage > 0) {
      // Calculate estimated total time based on current progress
      metrics.estimatedTotalTime = (elapsed / metrics.percentage) * 100;
      metrics.estimatedTimeRemaining = metrics.estimatedTotalTime - elapsed;

      // Adjust based on phase weights for more accuracy
      const completedWeight = this.getCompletedPhaseWeight(metrics.phase, metrics.percentage);
      const totalWeight = 100;
      
      if (completedWeight > 0) {
        const adjustedTotal = (elapsed / completedWeight) * totalWeight;
        metrics.estimatedTotalTime = adjustedTotal;
        metrics.estimatedTimeRemaining = adjustedTotal - elapsed;
      }
    }

    // Use throughput data for scene-based estimates
    if (metrics.throughput && metrics.throughput.totalScenes > 0 && metrics.throughput.averageSceneTime > 0) {
      const remainingScenes = metrics.throughput.totalScenes - metrics.throughput.completedScenes;
      const throughputBasedETA = remainingScenes * metrics.throughput.averageSceneTime * 60000; // Convert to ms
      
      // Use the more conservative estimate
      if (metrics.estimatedTimeRemaining) {
        metrics.estimatedTimeRemaining = Math.max(metrics.estimatedTimeRemaining, throughputBasedETA);
      } else {
        metrics.estimatedTimeRemaining = throughputBasedETA;
      }
    }
  }

  private getCompletedPhaseWeight(currentPhase: RenderJob['progress']['phase'], percentage: number): number {
    const phases: RenderJob['progress']['phase'][] = [
      'initialization', 'lip_sync', 'scene_rendering', 'subtitle_generation', 'final_merge'
    ];
    
    let completedWeight = 0;
    
    for (const phase of phases) {
      if (phase === currentPhase) {
        // Add partial weight for current phase
        completedWeight += (this.phaseWeights[phase] * percentage) / 100;
        break;
      } else {
        completedWeight += this.phaseWeights[phase];
      }
    }
    
    return completedWeight;
  }

  private updateThroughputMetrics(metrics: ProgressMetrics): void {
    if (!metrics.throughput) return;

    const elapsedMinutes = (metrics.currentTime - metrics.startTime) / 60000;
    
    if (elapsedMinutes > 0 && metrics.throughput.completedScenes > 0) {
      metrics.throughput.scenesPerMinute = metrics.throughput.completedScenes / elapsedMinutes;
      metrics.throughput.averageSceneTime = elapsedMinutes / metrics.throughput.completedScenes;
    }
  }

  private updatePerformanceMetrics(metrics: ProgressMetrics): void {
    // In a real implementation, this would gather actual system metrics
    // For now, we'll simulate some basic metrics
    
    if (!metrics.performance) return;

    try {
      // Simulate CPU usage based on phase (more intensive phases = higher CPU)
      const phaseIntensity = {
        'initialization': 20,
        'lip_sync': 75,
        'scene_rendering': 85,
        'subtitle_generation': 30,
        'final_merge': 60,
        'completed': 5
      };
      
      metrics.performance.cpuUsage = phaseIntensity[metrics.phase] + Math.random() * 15 - 7.5;
      
      // Simulate memory usage (increases over time, then resets)
      const timeProgress = (metrics.currentTime - metrics.startTime) / 60000; // minutes
      metrics.performance.memoryUsage = Math.min(85, 30 + (timeProgress * 5) + Math.random() * 10);
      
      // Simulate disk IO based on phase
      const ioIntensity = {
        'initialization': 10,
        'lip_sync': 40,
        'scene_rendering': 70,
        'subtitle_generation': 20,
        'final_merge': 90,
        'completed': 5
      };
      
      metrics.performance.diskIO = ioIntensity[metrics.phase] + Math.random() * 20 - 10;
      
    } catch (error) {
      console.warn('[ProgressTracker] Could not update performance metrics:', error.message);
    }
  }

  private emitUpdate(type: ProgressUpdate['type'], jobId: string, metrics: ProgressMetrics): void {
    const update: ProgressUpdate = {
      type,
      jobId,
      data: { ...metrics },
      timestamp: Date.now()
    };

    this.emit('progressUpdate', update);
    this.emit(type, update);
  }

  completeJob(jobId: string, success: boolean, error?: string): void {
    const metrics = this.jobs.get(jobId);
    if (!metrics) return;

    metrics.currentTime = Date.now();
    metrics.percentage = success ? 100 : metrics.percentage;
    metrics.phase = 'completed';
    metrics.message = success ? 'Job completed successfully' : `Job failed: ${error}`;

    if (success) {
      this.emitUpdate('completion', jobId, metrics);
    } else {
      this.emitUpdate('error', jobId, metrics);
    }

    console.log(`[ProgressTracker] Job ${success ? 'completed' : 'failed'}: ${jobId}`);
  }

  getJobProgress(jobId: string): ProgressMetrics | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): ProgressMetrics[] {
    return Array.from(this.jobs.values());
  }

  getActiveJobs(): ProgressMetrics[] {
    return Array.from(this.jobs.values()).filter(
      metrics => metrics.phase !== 'completed'
    );
  }

  formatTimeRemaining(milliseconds: number): string {
    if (!milliseconds || milliseconds <= 0) return '—';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatPhase(phase: RenderJob['progress']['phase']): string {
    const phaseNames = {
      'initialization': 'Inicializando',
      'lip_sync': 'Sincronização Labial',
      'scene_rendering': 'Renderizando Cenas',
      'subtitle_generation': 'Gerando Legendas',
      'final_merge': 'Montagem Final',
      'completed': 'Concluído'
    };
    
    return phaseNames[phase] || phase;
  }

  generateProgressReport(jobId: string): {
    summary: {
      jobId: string;
      phase: string;
      percentage: number;
      elapsedTime: string;
      estimatedRemaining: string;
      throughput: string;
    };
    performance: {
      cpuUsage: string;
      memoryUsage: string;
      diskIO: string;
    };
    timeline: {
      startTime: string;
      currentTime: string;
      estimatedCompletion: string;
    };
  } | null {
    
    const metrics = this.jobs.get(jobId);
    if (!metrics) return null;

    const elapsed = metrics.currentTime - metrics.startTime;
    const estimatedCompletion = metrics.estimatedTimeRemaining
      ? new Date(metrics.currentTime + metrics.estimatedTimeRemaining)
      : null;

    return {
      summary: {
        jobId,
        phase: this.formatPhase(metrics.phase),
        percentage: Math.round(metrics.percentage),
        elapsedTime: this.formatTimeRemaining(elapsed),
        estimatedRemaining: this.formatTimeRemaining(metrics.estimatedTimeRemaining || 0),
        throughput: metrics.throughput
          ? `${metrics.throughput.scenesPerMinute.toFixed(1)} cenas/min`
          : '—'
      },
      performance: {
        cpuUsage: `${Math.round(metrics.performance?.cpuUsage || 0)}%`,
        memoryUsage: `${Math.round(metrics.performance?.memoryUsage || 0)}%`,
        diskIO: `${Math.round(metrics.performance?.diskIO || 0)}%`
      },
      timeline: {
        startTime: new Date(metrics.startTime).toISOString(),
        currentTime: new Date(metrics.currentTime).toISOString(),
        estimatedCompletion: estimatedCompletion
          ? estimatedCompletion.toISOString()
          : 'N/A'
      }
    };
  }

  stopTracking(jobId: string): void {
    const metrics = this.jobs.get(jobId);
    if (metrics) {
      this.completeJob(jobId, true);
      console.log(`[ProgressTracker] Stopped tracking job: ${jobId}`);
    }
  }

  cleanup(): void {
    console.log('[ProgressTracker] Cleaning up progress tracker...');
    this.jobs.clear();
    this.removeAllListeners();
    console.log('[ProgressTracker] Progress tracker cleanup completed');
  }
}

export { ProgressTracker };