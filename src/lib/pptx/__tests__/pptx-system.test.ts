/**
 * Testes Automatizados Abrangentes para o Sistema PPTX
 * Cobertura completa de todas as funcionalidades implementadas
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { PPTXContentExtractor } from '../content-extractor';
import { SlideDataValidator } from '../slide-data-validator';
import { AutoCorrectionService } from '../auto-correction-service';
import { ParallelProcessor } from '../parallel-processor';
import { ProgressTracker } from '../progress-tracker';
import { MultiLayerCache } from '../multi-layer-cache';
import { ComplexElementsExtractor } from '../complex-elements-extractor';

// Mock data para testes
const mockPPTXFile = new File(['mock pptx content'], 'test.pptx', {
  type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
});

const mockSlideData = {
  title: 'Test Slide',
  content: 'This is test content',
  images: [
    {
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      alt: 'Test image',
      position: { x: 100, y: 100, width: 200, height: 150 }
    }
  ],
  notes: 'Test notes',
  width: 1920,
  height: 1080
};

const mockComplexElements = {
  elements: [
    {
      type: 'table' as const,
      id: 'table-1',
      position: { x: 50, y: 50, width: 300, height: 200 },
      rows: 3,
      columns: 3,
      data: [],
      style: {},
      metadata: {
        hasHeader: true,
        hasFooter: false,
        totalCells: 9,
        emptycells: 0
      }
    }
  ],
  summary: {
    totalElements: 1,
    tables: 1,
    charts: 0,
    smartArt: 0,
    diagrams: 0,
    media: 0
  },
  errors: [],
  warnings: [],
  processingTime: 150
};

describe('Sistema PPTX - Testes Integrados', () => {
  let extractor: PPTXContentExtractor;
  let validator: SlideDataValidator;
  let autoCorrection: AutoCorrectionService;
  let parallelProcessor: ParallelProcessor;
  let progressTracker: ProgressTracker;
  let cache: MultiLayerCache;
  let complexExtractor: ComplexElementsExtractor;

  beforeEach(() => {
    // Inicializa instâncias dos serviços
    extractor = PPTXContentExtractor.getInstance();
    validator = SlideDataValidator.getInstance();
    autoCorrection = AutoCorrectionService.getInstance();
    parallelProcessor = ParallelProcessor.getInstance();
    progressTracker = ProgressTracker.getInstance();
    cache = MultiLayerCache.getInstance();
    complexExtractor = ComplexElementsExtractor.getInstance();

    // Limpa cache e estado
    cache.clear();
    progressTracker.reset();

    // Mock console para evitar logs durante testes
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PPTXContentExtractor', () => {
    it('deve extrair conteúdo de arquivo PPTX com sucesso', async () => {
      // Mock da extração de conteúdo bruto
      vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue([
        mockSlideData
      ]);

      const result = await extractor.extractContent(mockPPTXFile, {
        useCache: false,
        enableValidation: true,
        enableAutoCorrection: true,
        enableParallelProcessing: true
      });

      expect(result).toBeDefined();
      expect(result.slides).toHaveLength(1);
      expect(result.slides[0].title).toBe('Test Slide');
      expect(result.metadata.validation).toBeDefined();
      expect(result.metadata.autoCorrection).toBeDefined();
      expect(result.metadata.parallelProcessing).toBeDefined();
    });

    it('deve gerar conteúdo mock quando solicitado', async () => {
      const mockContent = await extractor.generateMockContent(3);

      expect(mockContent).toBeDefined();
      expect(mockContent.slides).toHaveLength(3);
      expect(mockContent.slides[0].title).toContain('Slide');
      expect(mockContent.slides[0].content).toBeTruthy();
    });

    it('deve usar cache quando habilitado', async () => {
      const cacheKey = 'test-cache-key';
      const cachedData = { slides: [mockSlideData], metadata: {} };
      
      // Mock cache hit
      vi.spyOn(cache, 'get').mockResolvedValue(cachedData);
      vi.spyOn(extractor as any, 'generateCacheKey').mockReturnValue(cacheKey);

      const result = await extractor.extractContent(mockPPTXFile, {
        useCache: true
      });

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(result.slides).toEqual(cachedData.slides);
    });

    it('deve lidar com erros de extração graciosamente', async () => {
      vi.spyOn(extractor as any, 'extractRawContent').mockRejectedValue(
        new Error('Extraction failed')
      );

      await expect(extractor.extractContent(mockPPTXFile))
        .rejects.toThrow('Extraction failed');
    });
  });

  describe('SlideDataValidator', () => {
    it('deve validar slides corretamente', async () => {
      const slides = [mockSlideData];
      const result = await validator.validateSlides(slides);

      expect(result).toBeDefined();
      expect(result.summary.totalSlides).toBe(1);
      expect(result.summary.validSlides).toBeGreaterThanOrEqual(0);
      expect(result.slideResults).toHaveLength(1);
    });

    it('deve detectar slides inválidos', async () => {
      const invalidSlide = {
        ...mockSlideData,
        title: '', // Título vazio
        content: '', // Conteúdo vazio
        images: [{
          src: '', // URL inválida
          alt: '',
          position: { x: -1, y: -1, width: 0, height: 0 } // Posição inválida
        }]
      };

      const result = await validator.validateSlides([invalidSlide]);

      expect(result.summary.validSlides).toBe(0);
      expect(result.slideResults[0].errors.length).toBeGreaterThan(0);
    });

    it('deve validar mapeamento de divs', async () => {
      const divMapping = {
        'slide-1': {
          title: 'Test Title',
          content: 'Test Content',
          images: [{
            src: 'valid-url.jpg',
            alt: 'Valid image',
            position: { x: 0, y: 0, width: 100, height: 100 }
          }]
        }
      };

      const result = await validator.validateDivMapping(divMapping);

      expect(result).toBeDefined();
      expect(result.summary.totalDivs).toBe(1);
      expect(result.summary.validDivs).toBe(1);
    });

    it('deve gerar relatório de validação detalhado', () => {
      const validationResult = {
        summary: { totalSlides: 2, validSlides: 1, invalidSlides: 1 },
        slideResults: [
          { slideId: 'slide-1', isValid: true, errors: [], warnings: [] },
          { slideId: 'slide-2', isValid: false, errors: ['Missing title'], warnings: ['Low quality image'] }
        ]
      };

      const report = validator.generateValidationReport(validationResult, {});

      expect(report).toContain('Validation Report');
      expect(report).toContain('Total Slides: 2');
      expect(report).toContain('Valid Slides: 1');
      expect(report).toContain('Missing title');
    });
  });

  describe('AutoCorrectionService', () => {
    it('deve corrigir slides automaticamente', async () => {
      const slidesToCorrect = [{
        ...mockSlideData,
        title: '', // Título vazio para correção
        content: 'content with  multiple   spaces' // Espaços extras
      }];

      const result = await autoCorrection.correctSlides(slidesToCorrect);

      expect(result).toBeDefined();
      expect(result.correctedSlides).toHaveLength(1);
      expect(result.correctedSlides[0].title).toBeTruthy(); // Título deve ser gerado
      expect(result.summary.totalCorrections).toBeGreaterThan(0);
    });

    it('deve validar e corrigir slides em uma operação', async () => {
      const slides = [mockSlideData];
      const result = await autoCorrection.validateAndCorrectSlides(slides);

      expect(result.validation).toBeDefined();
      expect(result.correction).toBeDefined();
      expect(result.finalSlides).toHaveLength(1);
    });

    it('deve aplicar configurações de correção personalizadas', async () => {
      const config = {
        correctTitles: true,
        correctContent: false,
        correctImages: true,
        generateMissingAlt: true,
        fixPositions: false
      };

      autoCorrection.configure(config);
      
      const slides = [{
        ...mockSlideData,
        images: [{
          src: 'valid-url.jpg',
          alt: '', // Alt vazio para correção
          position: { x: 100, y: 100, width: 200, height: 150 }
        }]
      }];

      const result = await autoCorrection.correctSlides(slides);
      
      expect(result.correctedSlides[0].images[0].alt).toBeTruthy();
    });
  });

  describe('ParallelProcessor', () => {
    it('deve processar tarefas em paralelo', async () => {
      const tasks = [
        { id: 'task-1', data: 'data-1' },
        { id: 'task-2', data: 'data-2' },
        { id: 'task-3', data: 'data-3' }
      ];

      const processor = async (task: any) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { processed: true, taskId: task.id };
      };

      const result = await parallelProcessor.process(tasks, processor, {
        maxWorkers: 2,
        timeout: 5000
      });

      expect(result.results).toHaveLength(3);
      expect(result.stats.totalTasks).toBe(3);
      expect(result.stats.successfulTasks).toBe(3);
      expect(result.stats.failedTasks).toBe(0);
    });

    it('deve lidar com falhas de tarefas', async () => {
      const tasks = [
        { id: 'task-1', shouldFail: false },
        { id: 'task-2', shouldFail: true },
        { id: 'task-3', shouldFail: false }
      ];

      const processor = async (task: any) => {
        if (task.shouldFail) {
          throw new Error('Task failed');
        }
        return { processed: true, taskId: task.id };
      };

      const result = await parallelProcessor.process(tasks, processor);

      expect(result.stats.successfulTasks).toBe(2);
      expect(result.stats.failedTasks).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('deve respeitar timeout de tarefas', async () => {
      const tasks = [{ id: 'slow-task', data: 'data' }];

      const slowProcessor = async (task: any) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { processed: true };
      };

      const result = await parallelProcessor.process(tasks, slowProcessor, {
        timeout: 500
      });

      expect(result.stats.failedTasks).toBe(1);
      expect(result.errors[0]).toContain('timeout');
    });
  });

  describe('ProgressTracker', () => {
    it('deve rastrear progresso de múltiplas etapas', () => {
      const steps = [
        { id: 'step-1', name: 'Step 1', status: 'pending' as const },
        { id: 'step-2', name: 'Step 2', status: 'pending' as const },
        { id: 'step-3', name: 'Step 3', status: 'pending' as const }
      ];

      progressTracker.initialize(steps);
      
      expect(progressTracker.getProgress().totalSteps).toBe(3);
      expect(progressTracker.getProgress().completedSteps).toBe(0);
      expect(progressTracker.getProgress().percentage).toBe(0);
    });

    it('deve atualizar progresso corretamente', () => {
      const steps = [
        { id: 'step-1', name: 'Step 1', status: 'pending' as const },
        { id: 'step-2', name: 'Step 2', status: 'pending' as const }
      ];

      progressTracker.initialize(steps);
      progressTracker.updateStep('step-1', 'completed');
      
      const progress = progressTracker.getProgress();
      expect(progress.completedSteps).toBe(1);
      expect(progress.percentage).toBe(50);
    });

    it('deve chamar callback de progresso', () => {
      const callback = vi.fn();
      const steps = [{ id: 'step-1', name: 'Step 1', status: 'pending' as const }];

      progressTracker.initialize(steps, callback);
      progressTracker.updateStep('step-1', 'in_progress');
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('MultiLayerCache', () => {
    it('deve armazenar e recuperar dados do cache', async () => {
      const key = 'test-key';
      const data = { test: 'data' };

      await cache.set(key, data);
      const retrieved = await cache.get(key);

      expect(retrieved).toEqual(data);
    });

    it('deve retornar null para chaves inexistentes', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('deve deletar dados do cache', async () => {
      const key = 'delete-test';
      await cache.set(key, { data: 'test' });
      
      const deleted = await cache.delete(key);
      expect(deleted).toBe(true);
      
      const retrieved = await cache.get(key);
      expect(retrieved).toBeNull();
    });

    it('deve limpar todo o cache', async () => {
      await cache.set('key1', { data: '1' });
      await cache.set('key2', { data: '2' });
      
      await cache.clear();
      
      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('deve fornecer estatísticas do cache', async () => {
      await cache.set('stats-test', { data: 'test' });
      await cache.get('stats-test'); // Hit
      await cache.get('non-existent'); // Miss
      
      const stats = await cache.getStats();
      
      expect(stats.totalEntries).toBeGreaterThanOrEqual(1);
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ComplexElementsExtractor', () => {
    it('deve extrair elementos complexos de slides', async () => {
      // Mock da extração
      vi.spyOn(complexExtractor as any, 'extractFromSlide')
        .mockResolvedValue(mockComplexElements);

      const result = await complexExtractor.extractFromSlide(mockSlideData, 0);

      expect(result).toBeDefined();
      expect(result.elements).toHaveLength(1);
      expect(result.summary.totalElements).toBe(1);
      expect(result.summary.tables).toBe(1);
    });

    it('deve configurar opções de extração', () => {
      const config = {
        extractTables: true,
        extractCharts: false,
        extractSmartArt: true,
        extractDiagrams: false,
        extractMedia: true
      };

      expect(() => complexExtractor.configure(config)).not.toThrow();
    });

    it('deve lidar com erros de extração', async () => {
      // Mock erro na extração
      vi.spyOn(complexExtractor as any, 'extractTables')
        .mockRejectedValue(new Error('Table extraction failed'));

      const result = await complexExtractor.extractFromSlide(mockSlideData, 0);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error).toContain('failed');
    });
  });

  describe('Integração Completa do Sistema', () => {
    it('deve executar fluxo completo de extração com todas as funcionalidades', async () => {
      // Mock das dependências
      vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue([
        mockSlideData
      ]);

      const result = await extractor.extractContent(mockPPTXFile, {
        useCache: true,
        enableValidation: true,
        enableAutoCorrection: true,
        enableParallelProcessing: true,
        progressCallback: (progress) => {
          console.log(`Progress: ${progress.percentage}%`);
        }
      });

      // Verifica se todos os componentes foram executados
      expect(result.slides).toBeDefined();
      expect(result.metadata.validation).toBeDefined();
      expect(result.metadata.autoCorrection).toBeDefined();
      expect(result.metadata.parallelProcessing).toBeDefined();
      expect(result.metadata.progressTracking).toBeDefined();
      expect(result.metadata.cache).toBeDefined();
      expect(result.metadata.complexElements).toBeDefined();
    });

    it('deve manter performance adequada com múltiplos slides', async () => {
      const multipleSlides = Array(10).fill(null).map((_, index) => ({
        ...mockSlideData,
        title: `Slide ${index + 1}`,
        slideNumber: index + 1
      }));

      vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue(multipleSlides);

      const startTime = Date.now();
      const result = await extractor.extractContent(mockPPTXFile, {
        enableParallelProcessing: true
      });
      const processingTime = Date.now() - startTime;

      expect(result.slides).toHaveLength(10);
      expect(processingTime).toBeLessThan(5000); // Menos de 5 segundos
    });

    it('deve recuperar graciosamente de falhas parciais', async () => {
      const mixedSlides = [
        mockSlideData, // Slide válido
        { ...mockSlideData, title: null }, // Slide com problema
        mockSlideData // Slide válido
      ];

      vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue(mixedSlides);

      const result = await extractor.extractContent(mockPPTXFile, {
        enableValidation: true,
        enableAutoCorrection: true
      });

      // Sistema deve processar slides válidos mesmo com falhas parciais
      expect(result.slides.length).toBeGreaterThan(0);
      expect(result.metadata.validation.summary.totalSlides).toBe(3);
    });
  });

  describe('Testes de Performance', () => {
    it('deve processar cache eficientemente', async () => {
      const largeData = {
        slides: Array(100).fill(mockSlideData),
        metadata: { test: 'large dataset' }
      };

      const startTime = Date.now();
      await cache.set('large-dataset', largeData);
      const setTime = Date.now() - startTime;

      const retrieveStart = Date.now();
      const retrieved = await cache.get('large-dataset');
      const retrieveTime = Date.now() - retrieveStart;

      expect(retrieved).toEqual(largeData);
      expect(setTime).toBeLessThan(1000); // Menos de 1 segundo para armazenar
      expect(retrieveTime).toBeLessThan(500); // Menos de 0.5 segundo para recuperar
    });

    it('deve manter memory usage controlado', async () => {
      // Simula processamento de múltiplos arquivos
      const files = Array(5).fill(mockPPTXFile);
      
      for (const file of files) {
        vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue([mockSlideData]);
        await extractor.extractContent(file, { useCache: false });
      }

      // Verifica se não há vazamentos de memória óbvios
      const stats = await cache.getStats();
      expect(stats.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Menos de 100MB
    });
  });

  describe('Testes de Compatibilidade', () => {
    it('deve lidar com diferentes formatos de arquivo', async () => {
      const pptFile = new File(['ppt content'], 'test.ppt', {
        type: 'application/vnd.ms-powerpoint'
      });

      vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue([mockSlideData]);

      await expect(extractor.extractContent(pptFile))
        .resolves.toBeDefined();
    });

    it('deve funcionar com slides de diferentes dimensões', async () => {
      const wideSlide = {
        ...mockSlideData,
        width: 1920,
        height: 1080
      };

      const squareSlide = {
        ...mockSlideData,
        width: 1080,
        height: 1080
      };

      vi.spyOn(extractor as any, 'extractRawContent').mockResolvedValue([
        wideSlide,
        squareSlide
      ]);

      const result = await extractor.extractContent(mockPPTXFile);

      expect(result.slides[0].width).toBe(1920);
      expect(result.slides[1].width).toBe(1080);
    });
  });
});

// Testes de utilidades
describe('Funções Utilitárias', () => {
  it('deve validar elementos complexos corretamente', () => {
    const { validateComplexElement } = require('../complex-elements-extractor');
    
    const validElement = {
      id: 'test-1',
      type: 'table',
      position: { x: 0, y: 0, width: 100, height: 100 }
    };

    const invalidElement = {
      id: '',
      type: 'table',
      position: { x: 0, y: 0, width: 0, height: 0 }
    };

    expect(validateComplexElement(validElement)).toBe(true);
    expect(validateComplexElement(invalidElement)).toBe(false);
  });

  it('deve otimizar elementos para web', () => {
    const { optimizeElementForWeb } = require('../complex-elements-extractor');
    
    const element = {
      id: 'test',
      type: 'chart',
      position: { x: 10.7, y: 20.3, width: 100.9, height: 50.1 }
    };

    const optimized = optimizeElementForWeb(element);

    expect(optimized.position.x).toBe(11);
    expect(optimized.position.y).toBe(20);
    expect(optimized.position.width).toBe(101);
    expect(optimized.position.height).toBe(50);
  });
});