import { ProgressIndicatorService, ProgressStep, ProgressState } from '../progress-indicator.service';

describe('ProgressIndicatorService', () => {
  let progressService: ProgressIndicatorService;
  let mockCallback: jest.Mock;
  
  beforeEach(() => {
    mockCallback = jest.fn();
    progressService = new ProgressIndicatorService({
      enableDetailedLogging: true,
      updateInterval: 100,
      onProgress: mockCallback
    });
  });

  afterEach(() => {
    progressService.reset();
  });

  describe('startProgress', () => {
    it('should initialize progress with default steps', () => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 1000 },
        { id: 'step2', name: 'Step 2', estimatedDuration: 2000 }
      ];
      
      progressService.startProgress(steps, 'test-session');
      
      const state = progressService.getState();
      expect(state.sessionId).toBe('test-session');
      expect(state.steps).toHaveLength(2);
      expect(state.currentStepIndex).toBe(0);
      expect(state.overallProgress).toBe(0);
      expect(state.status).toBe('running');
    });

    it('should emit progress event on start', () => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 1000 }
      ];
      
      progressService.startProgress(steps);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          overallProgress: 0,
          status: 'running'
        })
      );
    });
  });

  describe('updateStep', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'validation', name: 'Validating Data', estimatedDuration: 1000 },
        { id: 'processing', name: 'Processing Slides', estimatedDuration: 2000 },
        { id: 'completion', name: 'Finalizing', estimatedDuration: 500 }
      ];
      progressService.startProgress(steps);
    });

    it('should update current step progress', () => {
      progressService.updateStep('validation', 50, 'Validating slide 1 of 2');
      
      const state = progressService.getState();
      const currentStep = state.steps[0];
      
      expect(currentStep.progress).toBe(50);
      expect(currentStep.message).toBe('Validating slide 1 of 2');
      expect(currentStep.status).toBe('running');
    });

    it('should calculate overall progress correctly', () => {
      // Complete first step (1000ms out of 3500ms total = ~28.57%)
      progressService.updateStep('validation', 100);
      progressService.nextStep();
      
      // Half complete second step (1000ms + 1000ms out of 3500ms = ~57.14%)
      progressService.updateStep('processing', 50);
      
      const state = progressService.getState();
      expect(state.overallProgress).toBeCloseTo(57.14, 1);
    });

    it('should emit progress events on updates', () => {
      mockCallback.mockClear();
      
      progressService.updateStep('validation', 75, 'Almost done with validation');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: 'validation',
              progress: 75,
              message: 'Almost done with validation'
            })
          ])
        })
      );
    });
  });

  describe('nextStep', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 1000 },
        { id: 'step2', name: 'Step 2', estimatedDuration: 1000 }
      ];
      progressService.startProgress(steps);
    });

    it('should advance to next step', () => {
      progressService.nextStep();
      
      const state = progressService.getState();
      expect(state.currentStepIndex).toBe(1);
      expect(state.steps[0].status).toBe('completed');
      expect(state.steps[1].status).toBe('running');
    });

    it('should complete progress when reaching last step', () => {
      progressService.nextStep(); // Move to step 2
      progressService.nextStep(); // Complete all steps
      
      const state = progressService.getState();
      expect(state.status).toBe('completed');
      expect(state.overallProgress).toBe(100);
    });
  });

  describe('addMetric', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'processing', name: 'Processing', estimatedDuration: 1000 }
      ];
      progressService.startProgress(steps);
    });

    it('should add performance metrics', () => {
      progressService.addMetric('slidesProcessed', 5);
      progressService.addMetric('processingSpeed', 2.5);
      
      const state = progressService.getState();
      expect(state.metrics.slidesProcessed).toBe(5);
      expect(state.metrics.processingSpeed).toBe(2.5);
    });

    it('should update existing metrics', () => {
      progressService.addMetric('slidesProcessed', 3);
      progressService.addMetric('slidesProcessed', 7);
      
      const state = progressService.getState();
      expect(state.metrics.slidesProcessed).toBe(7);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 1000 }
      ];
      progressService.startProgress(steps);
    });

    it('should handle step errors', () => {
      const error = new Error('Processing failed');
      progressService.setError(error);
      
      const state = progressService.getState();
      expect(state.status).toBe('error');
      expect(state.error).toBe(error.message);
    });

    it('should emit error events', () => {
      mockCallback.mockClear();
      
      const error = new Error('Test error');
      progressService.setError(error);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: 'Test error'
        })
      );
    });
  });

  describe('time estimation', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 2000 },
        { id: 'step2', name: 'Step 2', estimatedDuration: 3000 }
      ];
      progressService.startProgress(steps);
    });

    it('should calculate estimated time remaining', () => {
      // Simulate 50% progress on first step after 1 second
      progressService.updateStep('step1', 50);
      
      const state = progressService.getState();
      expect(state.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    it('should update elapsed time', async () => {
      const initialState = progressService.getState();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      progressService.updateStep('step1', 10);
      const updatedState = progressService.getState();
      
      expect(updatedState.elapsedTime).toBeGreaterThan(initialState.elapsedTime);
    });
  });

  describe('pause and resume', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 1000 }
      ];
      progressService.startProgress(steps);
    });

    it('should pause progress tracking', () => {
      progressService.pause();
      
      const state = progressService.getState();
      expect(state.status).toBe('paused');
    });

    it('should resume progress tracking', () => {
      progressService.pause();
      progressService.resume();
      
      const state = progressService.getState();
      expect(state.status).toBe('running');
    });

    it('should not update elapsed time when paused', async () => {
      progressService.pause();
      const pausedState = progressService.getState();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      progressService.updateStep('step1', 50);
      const updatedState = progressService.getState();
      
      expect(updatedState.elapsedTime).toBe(pausedState.elapsedTime);
    });
  });

  describe('reset', () => {
    it('should reset progress to initial state', () => {
      const steps: ProgressStep[] = [
        { id: 'step1', name: 'Step 1', estimatedDuration: 1000 }
      ];
      
      progressService.startProgress(steps);
      progressService.updateStep('step1', 50);
      progressService.addMetric('test', 123);
      
      progressService.reset();
      
      const state = progressService.getState();
      expect(state.sessionId).toBe('');
      expect(state.steps).toHaveLength(0);
      expect(state.overallProgress).toBe(0);
      expect(state.status).toBe('idle');
      expect(Object.keys(state.metrics)).toHaveLength(0);
    });
  });

  describe('batch operations', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'batch', name: 'Batch Processing', estimatedDuration: 5000 }
      ];
      progressService.startProgress(steps);
    });

    it('should handle batch progress updates', () => {
      const batchUpdates = [
        { stepId: 'batch', progress: 20, message: 'Processing item 1' },
        { stepId: 'batch', progress: 40, message: 'Processing item 2' },
        { stepId: 'batch', progress: 60, message: 'Processing item 3' }
      ];
      
      batchUpdates.forEach(update => {
        progressService.updateStep(update.stepId, update.progress, update.message);
      });
      
      const state = progressService.getState();
      expect(state.steps[0].progress).toBe(60);
      expect(state.steps[0].message).toBe('Processing item 3');
    });
  });

  describe('performance metrics', () => {
    beforeEach(() => {
      const steps: ProgressStep[] = [
        { id: 'performance', name: 'Performance Test', estimatedDuration: 1000 }
      ];
      progressService.startProgress(steps);
    });

    it('should track processing speed metrics', () => {
      progressService.addMetric('itemsPerSecond', 15.5);
      progressService.addMetric('memoryUsage', 256);
      progressService.addMetric('cacheHitRate', 0.85);
      
      const state = progressService.getState();
      expect(state.metrics.itemsPerSecond).toBe(15.5);
      expect(state.metrics.memoryUsage).toBe(256);
      expect(state.metrics.cacheHitRate).toBe(0.85);
    });

    it('should calculate throughput metrics', () => {
      const startTime = Date.now();
      
      // Simulate processing 10 items
      for (let i = 1; i <= 10; i++) {
        progressService.addMetric('itemsProcessed', i);
        progressService.updateStep('performance', i * 10);
      }
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      const throughput = 10 / duration;
      
      progressService.addMetric('throughput', throughput);
      
      const state = progressService.getState();
      expect(state.metrics.throughput).toBeGreaterThan(0);
      expect(state.metrics.itemsProcessed).toBe(10);
    });
  });
});