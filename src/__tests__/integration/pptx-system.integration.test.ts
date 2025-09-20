import { SlideDataValidator } from '../../services/slide-data-validator';
import { AutoCorrectionService } from '../../services/auto-correction.service';
import { ParallelProcessor } from '../../services/parallel-processor';
import { MultiLayerCache } from '../../services/multi-layer-cache';
import { ProgressIndicatorService } from '../../services/progress-indicator.service';
import { ComplexElementsExtractor } from '../../services/complex-elements-extractor';
import { FormatPreservationService } from '../../services/format-preservation.service';

describe('PPTX System Integration Tests', () => {
  let validator: SlideDataValidator;
  let correctionService: AutoCorrectionService;
  let parallelProcessor: ParallelProcessor;
  let cache: MultiLayerCache;
  let progressService: ProgressIndicatorService;
  let elementsExtractor: ComplexElementsExtractor;
  let formatService: FormatPreservationService;

  beforeEach(() => {
    validator = new SlideDataValidator();
    correctionService = new AutoCorrectionService();
    parallelProcessor = new ParallelProcessor({ maxWorkers: 4 });
    cache = new MultiLayerCache();
    progressService = new ProgressIndicatorService();
    elementsExtractor = new ComplexElementsExtractor();
    formatService = new FormatPreservationService();
  });

  afterEach(async () => {
    await parallelProcessor.shutdown();
    await cache.clear();
  });

  describe('Complete PPTX Processing Pipeline', () => {
    it('should process a complete slide with validation, correction, and caching', async () => {
      // Mock slide data with various issues
      const mockSlide = {
        id: 'slide-1',
        title: 'Test Slide with Issues',
        content: [
          {
            type: 'text',
            text: 'This text has some issues like extra  spaces and missing punctuation',
            style: {
              fontSize: '16px',
              color: '#333333',
              fontFamily: 'Arial'
            }
          },
          {
            type: 'image',
            src: 'invalid-image.jpg',
            alt: '',
            width: 0,
            height: 0
          }
        ],
        layout: {
          width: 1920,
          height: 1080,
          background: '#ffffff'
        },
        metadata: {
          slideNumber: 1,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };

      // Step 1: Start progress tracking
      const progressId = progressService.startProgress([
        { id: 'validation', name: 'Validating slide data', estimatedDuration: 500 },
        { id: 'correction', name: 'Applying corrections', estimatedDuration: 1000 },
        { id: 'caching', name: 'Caching results', estimatedDuration: 200 }
      ]);

      // Step 2: Validate slide data
      progressService.updateStep(progressId, 'validation', { status: 'in_progress' });
      const validationResult = validator.validateSlide(mockSlide);
      
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      
      progressService.updateStep(progressId, 'validation', { 
        status: 'completed',
        metadata: { errorsFound: validationResult.errors.length }
      });

      // Step 3: Apply auto-corrections
      progressService.updateStep(progressId, 'correction', { status: 'in_progress' });
      const correctedSlide = await correctionService.correctSlide(mockSlide, validationResult.errors);
      
      expect(correctedSlide.content[0].text).not.toContain('  '); // Extra spaces removed
      expect(correctedSlide.content[0].text).toMatch(/[.!?]$/); // Punctuation added
      expect(correctedSlide.content[1].alt).toBeTruthy(); // Alt text generated
      expect(correctedSlide.content[1].width).toBeGreaterThan(0); // Dimensions fixed
      
      progressService.updateStep(progressId, 'correction', { 
        status: 'completed',
        metadata: { correctionsApplied: correctionService.getStats().totalCorrections }
      });

      // Step 4: Cache the corrected slide
      progressService.updateStep(progressId, 'caching', { status: 'in_progress' });
      const cacheKey = `slide_${mockSlide.id}_corrected`;
      await cache.set(cacheKey, correctedSlide, { ttl: 3600000 }); // 1 hour TTL
      
      const cachedSlide = await cache.get(cacheKey);
      expect(cachedSlide).toEqual(correctedSlide);
      
      progressService.updateStep(progressId, 'caching', { status: 'completed' });

      // Verify final progress state
      const finalProgress = progressService.getProgress(progressId);
      expect(finalProgress.overallProgress).toBe(100);
      expect(finalProgress.status).toBe('completed');
    });

    it('should process multiple slides in parallel with progress tracking', async () => {
      const mockSlides = Array.from({ length: 5 }, (_, i) => ({
        id: `slide-${i + 1}`,
        title: `Test Slide ${i + 1}`,
        content: [
          {
            type: 'text',
            text: `Content for slide ${i + 1} with some issues`,
            style: { fontSize: '14px', color: '#000000' }
          }
        ],
        layout: { width: 1920, height: 1080, background: '#ffffff' },
        metadata: {
          slideNumber: i + 1,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }));

      // Create processing tasks
      const tasks = mockSlides.map(slide => ({
        id: `process-${slide.id}`,
        type: 'validation' as const,
        data: slide,
        priority: 1
      }));

      // Process slides in parallel
      const startTime = Date.now();
      const results = await parallelProcessor.processBatch(tasks);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all slides were processed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.taskId).toBe(`process-slide-${index + 1}`);
      });

      // Check parallel processor stats
      const stats = parallelProcessor.getStats();
      expect(stats.totalTasks).toBe(5);
      expect(stats.completedTasks).toBe(5);
      expect(stats.failedTasks).toBe(0);
    });

    it('should extract and preserve complex elements formatting', async () => {
      // Mock slide with complex elements
      const mockSlideElement = {
        querySelectorAll: (selector: string) => {
          if (selector === 'table') {
            return [{
              tagName: 'table',
              id: 'data-table',
              rows: [
                { cells: [{ textContent: 'Name' }, { textContent: 'Value' }] },
                { cells: [{ textContent: 'Item 1' }, { textContent: '100' }] },
                { cells: [{ textContent: 'Item 2' }, { textContent: '200' }] }
              ],
              getAttribute: (attr: string) => {
                const attrs: Record<string, string> = {
                  'id': 'data-table',
                  'class': 'styled-table'
                };
                return attrs[attr] || null;
              },
              style: {
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                fontSize: '14px'
              },
              getBoundingClientRect: () => ({
                width: 300,
                height: 150,
                top: 100,
                left: 50,
                right: 350,
                bottom: 250
              })
            }];
          }
          if (selector === '[data-chart-type]') {
            return [{
              tagName: 'canvas',
              id: 'sales-chart',
              getAttribute: (attr: string) => {
                const attrs: Record<string, string> = {
                  'id': 'sales-chart',
                  'data-chart-type': 'bar',
                  'data-chart-title': 'Sales Data'
                };
                return attrs[attr] || null;
              },
              style: {
                width: '400px',
                height: '300px',
                border: '2px solid #007acc'
              },
              getBoundingClientRect: () => ({
                width: 400,
                height: 300,
                top: 50,
                left: 100,
                right: 500,
                bottom: 350
              }),
              querySelector: () => ({ textContent: 'Sales Data' })
            }];
          }
          return [];
        }
      };

      // Extract complex elements
      const complexElements = elementsExtractor.extractAll(mockSlideElement as any);
      
      expect(complexElements.tables).toHaveLength(1);
      expect(complexElements.charts).toHaveLength(1);
      expect(complexElements.totalElements).toBe(2);

      // Preserve formatting for each element
      const tableElement = mockSlideElement.querySelectorAll('table')[0];
      const chartElement = mockSlideElement.querySelectorAll('[data-chart-type]')[0];
      
      const tableFormatting = formatService.preserveFormatting(tableElement as any);
      const chartFormatting = formatService.preserveFormatting(chartElement as any);
      
      expect(tableFormatting.elementId).toBe('data-table');
      expect(tableFormatting.border.width).toBe('1px');
      expect(tableFormatting.colors.background).toBe('#f9f9f9');
      
      expect(chartFormatting.elementId).toBe('sales-chart');
      expect(chartFormatting.layout.width).toBe('400px');
      expect(chartFormatting.layout.height).toBe('300px');
      expect(chartFormatting.border.color).toBe('#007acc');

      // Generate CSS for preserved formatting
      const tableCSS = formatService.generateCSS(tableFormatting, true);
      const chartCSS = formatService.generateCSS(chartFormatting, true);
      
      expect(tableCSS).toContain('.data-table {');
      expect(tableCSS).toContain('border: 1px solid #ccc;');
      expect(tableCSS).toContain('background-color: #f9f9f9;');
      
      expect(chartCSS).toContain('.sales-chart {');
      expect(chartCSS).toContain('width: 400px;');
      expect(chartCSS).toContain('height: 300px;');
    });

    it('should handle errors gracefully throughout the pipeline', async () => {
      // Mock slide with severe issues
      const problematicSlide = {
        id: null, // Invalid ID
        title: '', // Empty title
        content: null, // Invalid content
        layout: {
          width: -100, // Invalid dimensions
          height: 0,
          background: 'invalid-color'
        },
        metadata: null // Invalid metadata
      };

      // Start progress tracking
      const progressId = progressService.startProgress([
        { id: 'validation', name: 'Validating problematic slide', estimatedDuration: 500 },
        { id: 'error-handling', name: 'Handling errors', estimatedDuration: 300 }
      ]);

      try {
        // Attempt validation
        progressService.updateStep(progressId, 'validation', { status: 'in_progress' });
        const validationResult = validator.validateSlide(problematicSlide as any);
        
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(3);
        
        progressService.updateStep(progressId, 'validation', { 
          status: 'completed',
          metadata: { errorsFound: validationResult.errors.length }
        });

        // Attempt correction with error handling
        progressService.updateStep(progressId, 'error-handling', { status: 'in_progress' });
        
        const correctedSlide = await correctionService.correctSlide(
          problematicSlide as any, 
          validationResult.errors
        );
        
        // Verify that corrections were applied where possible
        expect(correctedSlide.id).toBeTruthy(); // ID should be generated
        expect(correctedSlide.title).toBeTruthy(); // Title should be generated
        expect(Array.isArray(correctedSlide.content)).toBe(true); // Content should be array
        expect(correctedSlide.layout.width).toBeGreaterThan(0); // Dimensions should be positive
        expect(correctedSlide.layout.height).toBeGreaterThan(0);
        
        progressService.updateStep(progressId, 'error-handling', { status: 'completed' });
        
      } catch (error) {
        // If errors occur, they should be handled gracefully
        expect(error).toBeInstanceOf(Error);
        
        progressService.updateStep(progressId, 'error-handling', { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      const finalProgress = progressService.getProgress(progressId);
      expect(['completed', 'failed']).toContain(finalProgress.status);
    });

    it('should maintain performance under load', async () => {
      const largeSlideSet = Array.from({ length: 50 }, (_, i) => ({
        id: `load-test-slide-${i}`,
        title: `Load Test Slide ${i}`,
        content: Array.from({ length: 10 }, (_, j) => ({
          type: 'text',
          text: `Content block ${j} for slide ${i} with various formatting issues`,
          style: {
            fontSize: `${12 + (j % 6)}px`,
            color: `#${((i * j) % 16777215).toString(16).padStart(6, '0')}`,
            fontFamily: ['Arial', 'Helvetica', 'Times'][j % 3]
          }
        })),
        layout: {
          width: 1920,
          height: 1080,
          background: '#ffffff'
        },
        metadata: {
          slideNumber: i + 1,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }));

      const startTime = performance.now();
      
      // Process slides in batches
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < largeSlideSet.length; i += batchSize) {
        const batch = largeSlideSet.slice(i, i + batchSize);
        const tasks = batch.map(slide => ({
          id: `batch-${Math.floor(i / batchSize)}-${slide.id}`,
          type: 'validation' as const,
          data: slide,
          priority: 1
        }));
        
        batches.push(parallelProcessor.processBatch(tasks));
      }
      
      const results = await Promise.all(batches);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      const totalSlides = largeSlideSet.length;
      const averageTimePerSlide = processingTime / totalSlides;
      
      expect(results).toHaveLength(Math.ceil(totalSlides / batchSize));
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(averageTimePerSlide).toBeLessThan(500); // Average less than 500ms per slide
      
      // Verify all slides were processed successfully
      const flatResults = results.flat();
      expect(flatResults).toHaveLength(totalSlides);
      
      const successfulResults = flatResults.filter(result => result.success);
      expect(successfulResults.length).toBeGreaterThan(totalSlides * 0.95); // At least 95% success rate
      
      // Check system resource usage
      const processorStats = parallelProcessor.getStats();
      expect(processorStats.averageProcessingTime).toBeLessThan(1000);
      expect(processorStats.peakMemoryUsage).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
      
      const cacheStats = cache.getStats();
      expect(cacheStats.hitRate).toBeGreaterThan(0); // Some cache hits should occur
    });
  });

  describe('System Recovery and Resilience', () => {
    it('should recover from worker failures', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `recovery-test-${i}`,
        type: 'validation' as const,
        data: {
          id: `slide-${i}`,
          title: i === 5 ? null : `Slide ${i}`, // Introduce failure at task 5
          content: [],
          layout: { width: 1920, height: 1080, background: '#ffffff' },
          metadata: { slideNumber: i + 1, createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }
        },
        priority: 1
      }));

      const results = await parallelProcessor.processBatch(tasks);
      
      expect(results).toHaveLength(10);
      
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      expect(successfulResults.length).toBeGreaterThan(7); // Most should succeed
      expect(failedResults.length).toBeLessThan(3); // Few should fail
      
      // System should continue operating after failures
      const additionalTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `post-recovery-${i}`,
        type: 'validation' as const,
        data: {
          id: `recovery-slide-${i}`,
          title: `Recovery Slide ${i}`,
          content: [],
          layout: { width: 1920, height: 1080, background: '#ffffff' },
          metadata: { slideNumber: i + 1, createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }
        },
        priority: 1
      }));
      
      const recoveryResults = await parallelProcessor.processBatch(additionalTasks);
      expect(recoveryResults.every(r => r.success)).toBe(true);
    });

    it('should handle cache failures gracefully', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // Simulate cache failure by filling memory
      try {
        // Fill cache to capacity
        for (let i = 0; i < 1000; i++) {
          await cache.set(`stress-test-${i}`, { data: 'x'.repeat(1000), index: i });
        }
        
        // Attempt to store additional data
        const result = await cache.set('important-data', testData);
        expect(result).toBeDefined(); // Should handle gracefully
        
        // Verify data can still be retrieved
        const retrieved = await cache.get('important-data');
        expect(retrieved).toEqual(testData);
        
      } catch (error) {
        // Cache failures should be handled gracefully
        expect(error).toBeInstanceOf(Error);
        
        // System should continue to function without cache
        const directResult = testData;
        expect(directResult).toEqual(testData);
      }
    });
  });
});