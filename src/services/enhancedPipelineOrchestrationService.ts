// Enhanced Pipeline Orchestration Service with monitoring and retry logic
import { pipelineRetryService } from './pipelineRetryService';
import { pipelineMonitor } from './pipelineMonitor';
import { pipelineCircuitBreaker } from './pipelineCircuitBreaker';

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface EnhancedPipelineData {
  pptxFile: File;
  jobId: string;
  stages?: PipelineStage[];
  metadata?: Record<string, any>;
}

export interface EnhancedPipelineCallbacks {
  onStageUpdate?: (stageId: string, stage: PipelineStage) => void;
  onPipelineComplete?: (data: EnhancedPipelineData) => void;
  onPipelineError?: (error: string, stageId: string) => void;
  onRetry?: (stageId: string, attempt: number) => void;
}

class EnhancedPipelineOrchestrationService {
  private stages: PipelineStage[] = [
    { id: 'upload', name: 'Upload do Arquivo', status: 'pending', progress: 0 },
    { id: 'validation', name: 'Validação', status: 'pending', progress: 0 },
    { id: 'ai-analysis', name: 'Análise IA', status: 'pending', progress: 0 },
    { id: 'nr-compliance', name: 'Conformidade NR', status: 'pending', progress: 0 },
    { id: 'video-editing', name: 'Edição de Vídeo', status: 'pending', progress: 0 },
    { id: 'video-export', name: 'Exportação', status: 'pending', progress: 0 }
  ];

  private isRunning = false;
  private currentStageIndex = 0;
  private callbacks: EnhancedPipelineCallbacks = {};
  private pipelineData: EnhancedPipelineData | null = null;

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update stage status and notify callbacks
   */
  private updateStage(stageId: string, updates: Partial<PipelineStage>) {
    const stageIndex = this.stages.findIndex(s => s.id === stageId);
    if (stageIndex !== -1) {
      this.stages[stageIndex] = { ...this.stages[stageIndex], ...updates };
      
      if (this.callbacks.onStageUpdate) {
        this.callbacks.onStageUpdate(stageId, this.stages[stageIndex]);
      }
    }
  }

  /**
   * Reset all stages to pending state
   */
  private resetStages() {
    this.stages = this.stages.map(stage => ({
      ...stage,
      status: 'pending' as const,
      progress: 0,
      startTime: undefined,
      endTime: undefined,
      error: undefined
    }));
  }

  /**
   * Start enhanced pipeline with monitoring and retry logic
   */
  async startEnhancedPipeline(
    pptxFile: File,
    callbacks: EnhancedPipelineCallbacks = {}
  ): Promise<EnhancedPipelineData> {
    if (this.isRunning) {
      throw new Error('Pipeline já está em execução');
    }

    const jobId = this.generateJobId();
    
    this.callbacks = callbacks;
    this.isRunning = true;
    this.currentStageIndex = 0;
    this.pipelineData = { pptxFile, jobId };
    
    // Reset stages
    this.resetStages();
    
    try {
      // Initialize monitoring
      pipelineMonitor.startPipelineMonitoring(jobId);
      
      // Execute all stages sequentially
      for (const stage of this.stages) {
        await this.executeStageWithRetry(stage.id, jobId);
      }
      
      // Pipeline completed successfully
      const finalData: EnhancedPipelineData = {
        ...this.pipelineData,
        stages: [...this.stages],
        metadata: {
          completedAt: Date.now(),
          totalDuration: Date.now() - (this.stages[0].startTime || Date.now())
        }
      };
      
      if (this.callbacks.onPipelineComplete) {
        this.callbacks.onPipelineComplete(finalData);
      }
      
      return finalData;
      
    } catch (error) {
      // Mark current stage as failed
      if (this.currentStageIndex < this.stages.length) {
        this.updateStage(this.stages[this.currentStageIndex].id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          endTime: Date.now()
        });
      }
      
      if (this.callbacks.onPipelineError) {
        this.callbacks.onPipelineError(
          error instanceof Error ? error.message : 'Unknown error',
          this.stages[this.currentStageIndex]?.id || 'unknown'
        );
      }
      
      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute stage with retry logic and monitoring
   */
  private async executeStageWithRetry(stageId: string, jobId: string) {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) {
      throw new Error(`Stage not found: ${stageId}`);
    }

    this.currentStageIndex = this.stages.indexOf(stage);
    
    // Update stage status
    this.updateStage(stageId, { 
      status: 'processing', 
      startTime: Date.now() 
    });

    try {
      // Start stage monitoring
      pipelineMonitor.startStageMonitoring(jobId, stageId);
      
      // Execute with circuit breaker and retry
      await pipelineCircuitBreaker.execute(async () => {
        await this.executeStageWithRetryLogic(stage, jobId);
      });

      // Mark stage as completed
      this.updateStage(stageId, { 
        status: 'completed', 
        progress: 100,
        endTime: Date.now()
      });

      // Finish stage monitoring
      pipelineMonitor.finishStageMonitoring(jobId, stageId, 'completed');
      
    } catch (error) {
      // Mark stage as failed
      this.updateStage(stageId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: Date.now()
      });
      
      // Finish stage monitoring with error
      pipelineMonitor.finishStageMonitoring(jobId, stageId, 'failed');
      
      throw error;
    }
  }

  /**
   * Execute stage with specific retry logic per stage type
   */
  private async executeStageWithRetryLogic(stage: PipelineStage, jobId: string) {
    switch (stage.id) {
      case 'upload':
        await pipelineRetryService.retryFileUpload(
          () => this.executeUploadStage(stage),
          this.pipelineData?.pptxFile?.name || 'unknown'
        );
        break;

      case 'ai-analysis':
      case 'nr-compliance':
        await pipelineRetryService.retryAIProcessing(
          () => this.executeAIStage(stage),
          stage.id
        );
        break;

      case 'video-editing':
      case 'video-export':
        await pipelineRetryService.retryVideoGeneration(
          () => this.executeVideoStage(stage),
          jobId
        );
        break;

      default:
        await pipelineRetryService.executeWithRetry(
          () => this.executeGenericStage(stage),
          {
            onRetry: (attempt, error) => {
              pipelineMonitor.recordRetry(jobId, stage.id, error.message);
              this.callbacks.onRetry?.(stage.id, attempt);
            }
          }
        );
    }
  }

  /**
   * Execute upload stage with validation
   */
  private async executeUploadStage(stage: PipelineStage) {
    if (!this.pipelineData?.pptxFile) {
      throw new Error('PPTX file is required');
    }

    const file = this.pipelineData.pptxFile;
    
    // Enhanced file validation
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      throw new Error('File must be a PowerPoint presentation (.pptx)');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large (max 50MB)');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Simulate upload processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      this.updateStage(stage.id, { progress: i });
      await this.delay(100);
    }
  }

  /**
   * Execute AI analysis stage
   */
  private async executeAIStage(stage: PipelineStage) {
    // Simulate AI processing
    for (let i = 0; i <= 100; i += 20) {
      this.updateStage(stage.id, { progress: i });
      await this.delay(500);
    }
  }

  /**
   * Execute video processing stage
   */
  private async executeVideoStage(stage: PipelineStage) {
    // Simulate video generation
    for (let i = 0; i <= 100; i += 10) {
      this.updateStage(stage.id, { progress: i });
      await this.delay(300);
    }
  }

  /**
   * Execute generic stage
   */
  private async executeGenericStage(stage: PipelineStage) {
    // Generic processing
    for (let i = 0; i <= 100; i += 25) {
      this.updateStage(stage.id, { progress: i });
      await this.delay(200);
    }
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current pipeline state
   */
  getCurrentState() {
    return {
      isRunning: this.isRunning,
      currentStage: this.stages[this.currentStageIndex]?.id,
      stages: this.stages,
      circuitBreakerState: pipelineCircuitBreaker.getState(),
      healthReport: pipelineMonitor.generateHealthReport()
    };
  }

  /**
   * Cancel current pipeline
   */
  cancelPipeline(reason: string = 'User cancelled') {
    if (this.isRunning) {
      this.isRunning = false;
      
      if (this.callbacks.onPipelineError) {
        this.callbacks.onPipelineError(reason, 'cancelled');
      }
    }
  }
}

// Enhanced singleton instance
export const enhancedPipelineService = new EnhancedPipelineOrchestrationService();

export type { 
  EnhancedPipelineData, 
  EnhancedPipelineCallbacks, 
  PipelineStage 
};