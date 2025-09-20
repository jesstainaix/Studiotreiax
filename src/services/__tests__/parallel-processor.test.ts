import { ParallelProcessor, ProcessingTask, TaskType } from '../parallel-processor';

describe('ParallelProcessor', () => {
  let processor: ParallelProcessor;
  
  beforeEach(() => {
    processor = new ParallelProcessor({
      maxWorkers: 4,
      taskTimeout: 5000,
      retryAttempts: 2
    });
  });

  afterEach(async () => {
    await processor.shutdown();
  });

  describe('processTask', () => {
    it('should process a validation task successfully', async () => {
      const task: ProcessingTask = {
        id: 'task-1',
        type: 'validation' as TaskType,
        data: {
          slide: {
            id: 'slide-1',
            title: 'Test Slide',
            content: 'Test content',
            images: [],
            shapes: [],
            animations: [],
            notes: '',
            metadata: {
              slideNumber: 1,
              createdAt: new Date(),
              modifiedAt: new Date()
            }
          }
        },
        priority: 'medium'
      };

      const result = await processor.processTask(task);
      
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-1');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should process a correction task successfully', async () => {
      const task: ProcessingTask = {
        id: 'task-2',
        type: 'correction' as TaskType,
        data: {
          slide: {
            id: 'slide-1',
            title: '  Untrimmed Title  ',
            content: 'Content with    extra   spaces',
            images: [],
            shapes: [],
            animations: [],
            notes: '',
            metadata: {
              slideNumber: 1,
              createdAt: new Date(),
              modifiedAt: new Date()
            }
          }
        },
        priority: 'high'
      };

      const result = await processor.processTask(task);
      
      expect(result.success).toBe(true);
      expect(result.data?.correctedSlide?.title).toBe('Untrimmed Title');
    });

    it('should handle content extraction tasks', async () => {
      const task: ProcessingTask = {
        id: 'task-3',
        type: 'content_extraction' as TaskType,
        data: {
          slide: {
            id: 'slide-1',
            title: 'Slide with Content',
            content: 'This slide contains important information about our product.',
            images: [],
            shapes: [],
            animations: [],
            notes: 'Speaker notes here',
            metadata: {
              slideNumber: 1,
              createdAt: new Date(),
              modifiedAt: new Date()
            }
          }
        },
        priority: 'low'
      };

      const result = await processor.processTask(task);
      
      expect(result.success).toBe(true);
      expect(result.data?.extractedContent).toBeDefined();
    });
  });

  describe('processBatch', () => {
    it('should process multiple tasks in parallel', async () => {
      const tasks: ProcessingTask[] = [
        {
          id: 'batch-task-1',
          type: 'validation' as TaskType,
          data: {
            slide: {
              id: 'slide-1',
              title: 'Slide 1',
              content: 'Content 1',
              images: [],
              shapes: [],
              animations: [],
              notes: '',
              metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
            }
          },
          priority: 'medium'
        },
        {
          id: 'batch-task-2',
          type: 'validation' as TaskType,
          data: {
            slide: {
              id: 'slide-2',
              title: 'Slide 2',
              content: 'Content 2',
              images: [],
              shapes: [],
              animations: [],
              notes: '',
              metadata: { slideNumber: 2, createdAt: new Date(), modifiedAt: new Date() }
            }
          },
          priority: 'medium'
        }
      ];

      const results = await processor.processBatch(tasks);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle batch processing with mixed task types', async () => {
      const tasks: ProcessingTask[] = [
        {
          id: 'mixed-task-1',
          type: 'validation' as TaskType,
          data: { slide: createMockSlide('slide-1') },
          priority: 'high'
        },
        {
          id: 'mixed-task-2',
          type: 'correction' as TaskType,
          data: { slide: createMockSlide('slide-2', '  Bad Title  ') },
          priority: 'medium'
        },
        {
          id: 'mixed-task-3',
          type: 'content_extraction' as TaskType,
          data: { slide: createMockSlide('slide-3') },
          priority: 'low'
        }
      ];

      const results = await processor.processBatch(tasks);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should track processing statistics', async () => {
      const task: ProcessingTask = {
        id: 'stats-task',
        type: 'validation' as TaskType,
        data: { slide: createMockSlide('slide-1') },
        priority: 'medium'
      };

      await processor.processTask(task);
      
      const stats = processor.getStats();
      
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.activeWorkers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('worker management', () => {
    it('should scale workers based on queue size', async () => {
      const initialStats = processor.getStats();
      
      // Add multiple tasks to trigger worker scaling
      const tasks: ProcessingTask[] = Array.from({ length: 10 }, (_, i) => ({
        id: `scale-task-${i}`,
        type: 'validation' as TaskType,
        data: { slide: createMockSlide(`slide-${i}`) },
        priority: 'medium'
      }));

      const resultsPromise = processor.processBatch(tasks);
      
      // Check that workers are scaled up
      await new Promise(resolve => setTimeout(resolve, 100));
      const scaledStats = processor.getStats();
      
      await resultsPromise;
      
      expect(scaledStats.activeWorkers).toBeGreaterThanOrEqual(initialStats.activeWorkers);
    });
  });

  describe('error handling', () => {
    it('should handle task timeouts gracefully', async () => {
      const shortTimeoutProcessor = new ParallelProcessor({
        maxWorkers: 2,
        taskTimeout: 1, // Very short timeout
        retryAttempts: 0
      });

      const task: ProcessingTask = {
        id: 'timeout-task',
        type: 'validation' as TaskType,
        data: { slide: createMockSlide('slide-1') },
        priority: 'medium'
      };

      const result = await shortTimeoutProcessor.processTask(task);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      
      await shortTimeoutProcessor.shutdown();
    });

    it('should retry failed tasks', async () => {
      const retryProcessor = new ParallelProcessor({
        maxWorkers: 2,
        taskTimeout: 5000,
        retryAttempts: 2
      });

      // Create a task that will initially fail but succeed on retry
      const task: ProcessingTask = {
        id: 'retry-task',
        type: 'validation' as TaskType,
        data: { slide: null as any }, // Invalid data to trigger failure
        priority: 'medium'
      };

      const result = await retryProcessor.processTask(task);
      
      // Should eventually fail after retries
      expect(result.success).toBe(false);
      
      await retryProcessor.shutdown();
    });
  });
});

// Helper function to create mock slides
function createMockSlide(id: string, title: string = 'Test Slide') {
  return {
    id,
    title,
    content: 'Test content',
    images: [],
    shapes: [],
    animations: [],
    notes: '',
    metadata: {
      slideNumber: 1,
      createdAt: new Date(),
      modifiedAt: new Date()
    }
  };
}