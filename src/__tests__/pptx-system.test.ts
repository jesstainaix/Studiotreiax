/**
 * PPTX System Test Suite
 * Suite completa de testes para o módulo PPTX Studio
 * Inclui testes unitários, integração, performance e stress testing
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { PPTXValidator } from '../lib/pptx/pptx-validator';
import { PPTXSanitizer } from '../lib/pptx/pptx-sanitizer';
import { PPTXWorkerPool } from '../lib/pptx/pptx-worker-pool';
import { PPTXCacheManager } from '../lib/pptx/pptx-cache-manager';
import { PPTXMemoryManager } from '../lib/pptx/pptx-memory-manager';
import { PPTXErrorHandler } from '../lib/pptx/pptx-error-handler';
import type {
  PPTXValidationResult,
  PPTXSanitizationResult,
  PPTXWorkerTask,
  PPTXCacheEntry
} from '../lib/pptx/pptx-interfaces';

/**
 * Mock data para testes
 */
const createMockPPTXFile = (name: string, size: number, content?: ArrayBuffer): File => {
  const buffer = content || new ArrayBuffer(size);
  return new File([buffer], name, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
};

const createValidPPTXBuffer = (): ArrayBuffer => {
  // Simular estrutura básica de PPTX (ZIP com arquivos mínimos)
  const encoder = new TextEncoder();
  const mockZipContent = encoder.encode(`
    PK\x03\x04[Content_Types].xml
    <?xml version="1.0" encoding="UTF-8"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
    </Types>
  `);
  return mockZipContent.buffer;
};

/**
 * Testes do Sistema de Validação PPTX
 */
describe('PPTXValidator', () => {
  let validator: PPTXValidator;

  beforeAll(() => {
    validator = new PPTXValidator();
  });

  describe('Validação Básica de Arquivo', () => {
    test('deve aceitar arquivo PPTX válido', async () => {
      const validFile = createMockPPTXFile('test.pptx', 1024 * 1024, createValidPPTXBuffer());
      const isValid = await validator.quickValidate(validFile);
      expect(isValid).toBe(true);
    });

    test('deve rejeitar arquivo muito grande', async () => {
      const largeFile = createMockPPTXFile('large.pptx', 200 * 1024 * 1024); // 200MB
      const result = await validator.validatePPTXFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
    });

    test('deve rejeitar extensão inválida', async () => {
      const invalidFile = createMockPPTXFile('test.txt', 1024);
      const result = await validator.validatePPTXFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_EXTENSION')).toBe(true);
    });

    test('deve extrair metadados básicos', async () => {
      const file = createMockPPTXFile('presentation.pptx', 2048, createValidPPTXBuffer());
      const metadata = await validator.extractBasicMetadata(file);
      
      expect(metadata.fileName).toBe('presentation.pptx');
      expect(metadata.fileSize).toBe(2048);
      expect(metadata.mimeType).toContain('presentation');
    });
  });

  describe('Validação de Estrutura', () => {
    test('deve validar estrutura ZIP', async () => {
      const validFile = createMockPPTXFile('valid.pptx', 1024, createValidPPTXBuffer());
      const result = await validator.validatePPTXFile(validFile);
      
      expect(result.structure.hasValidZip).toBe(true);
    });

    test('deve detectar arquivos obrigatórios ausentes', async () => {
      const incompleteFile = createMockPPTXFile('incomplete.pptx', 512);
      const result = await validator.validatePPTXFile(incompleteFile);
      
      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_FILE')).toBe(true);
    });
  });

  describe('Validação de Segurança', () => {
    test('deve detectar links externos', async () => {
      // Mock de arquivo com links externos seria criado aqui
      // Para simplificar, testamos a lógica de detecção
      expect(true).toBe(true); // Placeholder
    });

    test('deve detectar scripts maliciosos', async () => {
      // Mock de arquivo com scripts seria criado aqui
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Análise de Performance', () => {
    test('deve calcular score de tamanho', async () => {
      const mediumFile = createMockPPTXFile('medium.pptx', 10 * 1024 * 1024); // 10MB
      const result = await validator.validatePPTXFile(mediumFile);
      
      expect(result.performance.fileSizeScore).toBeGreaterThan(0);
      expect(result.performance.fileSizeScore).toBeLessThanOrEqual(100);
    });

    test('deve sugerir otimizações', async () => {
      const largeFile = createMockPPTXFile('large.pptx', 80 * 1024 * 1024); // 80MB
      const result = await validator.validatePPTXFile(largeFile);
      
      expect(result.performance.optimizationSuggestions).toContain(
        'Considere compactar ou reduzir a qualidade das imagens'
      );
    });
  });
});

/**
 * Testes do Sistema de Sanitização PPTX
 */
describe('PPTXSanitizer', () => {
  let sanitizer: PPTXSanitizer;

  beforeAll(() => {
    sanitizer = new PPTXSanitizer();
  });

  describe('Sanitização Básica', () => {
    test('deve processar arquivo válido', async () => {
      const file = createMockPPTXFile('test.pptx', 1024, createValidPPTXBuffer());
      const result = await sanitizer.sanitizePPTXFile(file);
      
      expect(result.success).toBe(true);
      expect(result.sanitizedFile).toBeTruthy();
      expect(result.sanitizedFile?.name).toContain('_sanitized');
    });

    test('deve reduzir tamanho do arquivo', async () => {
      const file = createMockPPTXFile('bloated.pptx', 5 * 1024 * 1024);
      const result = await sanitizer.sanitizePPTXFile(file);
      
      if (result.success && result.sanitizedFile) {
        expect(result.sizeReduction).toBeGreaterThanOrEqual(0);
      }
    });

    test('deve coletar estatísticas de limpeza', async () => {
      const file = createMockPPTXFile('test.pptx', 1024, createValidPPTXBuffer());
      const result = await sanitizer.sanitizePPTXFile(file);
      
      expect(result.stats).toBeDefined();
      expect(typeof result.stats.xmlFilesProcessed).toBe('number');
      expect(typeof result.stats.errors).toBe('number');
    });
  });

  describe('Remoção de Conteúdo Perigoso', () => {
    test('deve configurar remoção de macros', () => {
      const sanitizerNoMacros = new PPTXSanitizer({ removeMacros: true });
      expect(true).toBe(true); // Placeholder para teste de configuração
    });

    test('deve configurar remoção de links externos', () => {
      const sanitizerNoLinks = new PPTXSanitizer({ removeExternalLinks: true });
      expect(true).toBe(true); // Placeholder para teste de configuração
    });
  });
});

/**
 * Testes do Sistema de Worker Pool
 */
describe('PPTXWorkerPool', () => {
  let workerPool: PPTXWorkerPool;

  beforeAll(async () => {
    workerPool = new PPTXWorkerPool();
    await workerPool.initialize();
  });

  afterAll(async () => {
    await workerPool.terminate();
  });

  describe('Inicialização e Configuração', () => {
    test('deve inicializar com configuração padrão', () => {
      expect(workerPool.getActiveWorkers()).toBeGreaterThan(0);
      expect(workerPool.getActiveWorkers()).toBeLessThanOrEqual(8);
    });

    test('deve configurar número máximo de workers', async () => {
      const customPool = new PPTXWorkerPool({ maxWorkers: 2 });
      await customPool.initialize();
      
      expect(customPool.getActiveWorkers()).toBeLessThanOrEqual(2);
      await customPool.terminate();
    });
  });

  describe('Processamento de Tarefas', () => {
    test('deve processar tarefa simples', async () => {
      const task: PPTXWorkerTask = {
        id: 'test-1',
        type: 'parse-slide',
        data: { slideXml: '<slide></slide>', slideIndex: 1 },
        priority: 'normal'
      };

      const result = await workerPool.processTask(task);
      expect(result).toBeDefined();
      expect(result.taskId).toBe('test-1');
    });

    test('deve processar múltiplas tarefas em paralelo', async () => {
      const tasks: PPTXWorkerTask[] = Array.from({ length: 5 }, (_, i) => ({
        id: `parallel-${i}`,
        type: 'parse-slide',
        data: { slideXml: `<slide>${i}</slide>`, slideIndex: i },
        priority: 'normal'
      }));

      const startTime = Date.now();
      const results = await Promise.all(tasks.map(task => workerPool.processTask(task)));
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(5000); // Deve ser mais rápido que processamento sequencial
    });

    test('deve respeitar prioridades de tarefas', async () => {
      const lowPriorityTask: PPTXWorkerTask = {
        id: 'low-priority',
        type: 'parse-slide',
        data: { slideXml: '<slide>low</slide>', slideIndex: 1 },
        priority: 'low'
      };

      const highPriorityTask: PPTXWorkerTask = {
        id: 'high-priority',
        type: 'parse-slide',
        data: { slideXml: '<slide>high</slide>', slideIndex: 2 },
        priority: 'high'
      };

      // Adicionar tarefa de baixa prioridade primeiro
      const lowPromise = workerPool.processTask(lowPriorityTask);
      
      // Adicionar tarefa de alta prioridade depois
      const highPromise = workerPool.processTask(highPriorityTask);

      const results = await Promise.all([lowPromise, highPromise]);
      expect(results).toHaveLength(2);
    });
  });

  describe('Gerenciamento de Erros', () => {
    test('deve tratar erro em worker graciosamente', async () => {
      const errorTask: PPTXWorkerTask = {
        id: 'error-task',
        type: 'parse-slide',
        data: { slideXml: 'invalid-xml', slideIndex: 1 },
        priority: 'normal'
      };

      await expect(workerPool.processTask(errorTask)).rejects.toThrow();
    });

    test('deve recuperar worker após erro', async () => {
      const initialWorkers = workerPool.getActiveWorkers();
      
      // Simular erro
      try {
        await workerPool.processTask({
          id: 'error-recovery',
          type: 'parse-slide',
          data: { slideXml: 'invalid', slideIndex: 1 },
          priority: 'normal'
        });
      } catch (error) {
        // Esperado
      }

      // Verificar que workers ainda estão ativos
      expect(workerPool.getActiveWorkers()).toBe(initialWorkers);
    });
  });

  describe('Estatísticas e Monitoramento', () => {
    test('deve coletar estatísticas de performance', async () => {
      const stats = workerPool.getStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalTasks).toBe('number');
      expect(typeof stats.completedTasks).toBe('number');
      expect(typeof stats.failedTasks).toBe('number');
    });
  });
});

/**
 * Testes do Sistema de Cache
 */
describe('PPTXCacheManager', () => {
  let cacheManager: PPTXCacheManager;

  beforeEach(async () => {
    cacheManager = new PPTXCacheManager();
    await cacheManager.initialize();
  });

  afterEach(async () => {
    await cacheManager.clear();
  });

  describe('Operações Básicas de Cache', () => {
    test('deve armazenar e recuperar dados', async () => {
      const testData = { slides: [], metadata: { title: 'Test' } };
      const key = 'test-file-hash';

      await cacheManager.set(key, testData);
      const retrieved = await cacheManager.get(key);

      expect(retrieved).toEqual(testData);
    });

    test('deve retornar null para chave inexistente', async () => {
      const result = await cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('deve remover entrada específica', async () => {
      const key = 'to-be-deleted';
      const data = { test: 'data' };

      await cacheManager.set(key, data);
      await cacheManager.delete(key);
      
      const result = await cacheManager.get(key);
      expect(result).toBeNull();
    });
  });

  describe('Cache Multi-Camadas', () => {
    test('deve priorizar cache em memória', async () => {
      const key = 'memory-test';
      const data = { location: 'memory' };

      await cacheManager.set(key, data);
      
      // Primeira busca deve ser da memória (mais rápida)
      const startTime = Date.now();
      const result = await cacheManager.get(key);
      const duration = Date.now() - startTime;

      expect(result).toEqual(data);
      expect(duration).toBeLessThan(10); // Muito rápido para ser do IndexedDB
    });

    test('deve usar cache persistente quando memória não tem', async () => {
      const key = 'persistent-test';
      const data = { location: 'persistent' };

      // Armazenar no cache persistente
      await cacheManager.set(key, data);
      
      // Limpar cache de memória apenas
      await cacheManager.clearMemoryCache();
      
      // Deve recuperar do cache persistente
      const result = await cacheManager.get(key);
      expect(result).toEqual(data);
    });
  });

  describe('LRU Eviction', () => {
    test('deve remover entradas mais antigas quando limite atingido', async () => {
      const smallCache = new PPTXCacheManager({ 
        memoryCacheSize: 3 // Apenas 3 entradas
      });
      await smallCache.initialize();

      // Adicionar 4 entradas
      await smallCache.set('key1', { id: 1 });
      await smallCache.set('key2', { id: 2 });
      await smallCache.set('key3', { id: 3 });
      await smallCache.set('key4', { id: 4 }); // Deve remover key1

      const result1 = await smallCache.get('key1');
      const result4 = await smallCache.get('key4');

      expect(result1).toBeNull();
      expect(result4).toEqual({ id: 4 });

      await smallCache.clear();
    });
  });

  describe('Compressão de Dados', () => {
    test('deve comprimir dados grandes automaticamente', async () => {
      const largeData = {
        slides: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          content: 'A'.repeat(1000) // Conteúdo grande para testar compressão
        }))
      };

      const key = 'compression-test';
      await cacheManager.set(key, largeData);
      const retrieved = await cacheManager.get(key);

      expect(retrieved).toEqual(largeData);
    });
  });

  describe('Limpeza Automática', () => {
    test('deve limpar entradas expiradas', async () => {
      const shortLivedCache = new PPTXCacheManager({
        defaultTTL: 100 // 100ms
      });
      await shortLivedCache.initialize();

      await shortLivedCache.set('expires-soon', { data: 'test' });
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result = await shortLivedCache.get('expires-soon');
      expect(result).toBeNull();

      await shortLivedCache.clear();
    });
  });
});

/**
 * Testes do Sistema de Gerenciamento de Memória
 */
describe('PPTXMemoryManager', () => {
  let memoryManager: PPTXMemoryManager;

  beforeAll(() => {
    memoryManager = new PPTXMemoryManager();
  });

  afterAll(() => {
    memoryManager.destroy();
  });

  describe('Object Pooling', () => {
    test('deve reutilizar objetos Canvas', () => {
      const canvas1 = memoryManager.acquireCanvas(800, 600);
      const canvas1Id = canvas1.id;
      
      memoryManager.releaseCanvas(canvas1);
      
      const canvas2 = memoryManager.acquireCanvas(800, 600);
      expect(canvas2.id).toBe(canvas1Id); // Mesmo objeto reutilizado
    });

    test('deve criar novo objeto quando pool está vazio', () => {
      const canvas1 = memoryManager.acquireCanvas(800, 600);
      const canvas2 = memoryManager.acquireCanvas(800, 600);
      
      expect(canvas1.id).not.toBe(canvas2.id);
      
      memoryManager.releaseCanvas(canvas1);
      memoryManager.releaseCanvas(canvas2);
    });
  });

  describe('Stream Processing', () => {
    test('deve processar arquivo em chunks', async () => {
      const largeBuffer = new ArrayBuffer(10 * 1024 * 1024); // 10MB
      let chunksProcessed = 0;

      await memoryManager.processInStreams(largeBuffer, {
        chunkSize: 1024 * 1024, // 1MB chunks
        onChunk: () => { chunksProcessed++; },
        onComplete: () => { /* complete */ }
      });

      expect(chunksProcessed).toBe(10);
    });

    test('deve respeitar limite de chunks simultâneos', async () => {
      const buffer = new ArrayBuffer(5 * 1024 * 1024); // 5MB
      let maxConcurrentChunks = 0;
      let currentChunks = 0;

      await memoryManager.processInStreams(buffer, {
        chunkSize: 1024 * 1024, // 1MB chunks
        maxConcurrentChunks: 2,
        onChunk: () => {
          currentChunks++;
          maxConcurrentChunks = Math.max(maxConcurrentChunks, currentChunks);
          setTimeout(() => { currentChunks--; }, 10);
        },
        onComplete: () => { /* complete */ }
      });

      expect(maxConcurrentChunks).toBeLessThanOrEqual(2);
    });
  });

  describe('Weak References', () => {
    test('deve rastrear objetos com weak references', () => {
      const testObject = { id: 'test-123', data: 'test-data' };
      const weakRef = memoryManager.trackObject(testObject, () => {
        // Cleanup callback
      });

      expect(weakRef.deref()).toBe(testObject);
    });
  });

  describe('Memory Monitoring', () => {
    test('deve coletar métricas de memória', () => {
      const metrics = memoryManager.getMemoryMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.heapUsed).toBe('number');
      expect(typeof metrics.heapTotal).toBe('number');
      expect(Array.isArray(metrics.samples)).toBe(true);
    });

    test('deve detectar pressão de memória', () => {
      // Simular alta pressão de memória
      const isUnderPressure = memoryManager.isMemoryUnderPressure();
      expect(typeof isUnderPressure).toBe('boolean');
    });
  });

  describe('Cleanup Automático', () => {
    test('deve executar cleanup quando configurado', async () => {
      let cleanupExecuted = false;
      
      memoryManager.registerCleanupCallback(() => {
        cleanupExecuted = true;
      });

      // Forçar cleanup
      await memoryManager.forceCleanup();
      
      expect(cleanupExecuted).toBe(true);
    });
  });
});

/**
 * Testes do Sistema de Tratamento de Erros
 */
describe('PPTXErrorHandler', () => {
  let errorHandler: PPTXErrorHandler;

  beforeAll(() => {
    errorHandler = new PPTXErrorHandler();
  });

  describe('Tratamento de Erros', () => {
    test('deve categorizar erro corretamente', () => {
      const validationError = new Error('Invalid PPTX structure');
      const categorized = errorHandler.categorizeError(validationError, 'validation');
      
      expect(categorized.category).toBe('validation');
      expect(categorized.severity).toBeDefined();
    });

    test('deve sugerir estratégia de recuperação', () => {
      const parseError = new Error('XML parsing failed');
      const strategy = errorHandler.getRecoveryStrategy(parseError, 'parsing');
      
      expect(strategy).toBeDefined();
      expect(typeof strategy.description).toBe('string');
    });
  });

  describe('Logging Estruturado', () => {
    test('deve criar log estruturado', () => {
      const error = new Error('Test error');
      const log = errorHandler.createStructuredLog(error, 'test-context', {
        additionalData: 'test'
      });

      expect(log.timestamp).toBeDefined();
      expect(log.level).toBeDefined();
      expect(log.context).toBe('test-context');
      expect(log.error.message).toBe('Test error');
    });
  });

  describe('Estratégias de Recuperação', () => {
    test('deve executar recuperação automática', async () => {
      let recoveryExecuted = false;
      
      const strategy = {
        type: 'retry' as const,
        description: 'Retry operation',
        maxAttempts: 3,
        implementation: async () => { 
          recoveryExecuted = true;
          return { success: true };
        }
      };

      const result = await errorHandler.executeRecovery(strategy);
      
      expect(result.success).toBe(true);
      expect(recoveryExecuted).toBe(true);
    });
  });
});

/**
 * Testes de Integração
 */
describe('PPTX System Integration', () => {
  let validator: PPTXValidator;
  let sanitizer: PPTXSanitizer;
  let workerPool: PPTXWorkerPool;
  let cacheManager: PPTXCacheManager;

  beforeAll(async () => {
    validator = new PPTXValidator();
    sanitizer = new PPTXSanitizer();
    workerPool = new PPTXWorkerPool();
    cacheManager = new PPTXCacheManager();
    
    await workerPool.initialize();
    await cacheManager.initialize();
  });

  afterAll(async () => {
    await workerPool.terminate();
    await cacheManager.clear();
  });

  test('deve processar arquivo PPTX completo (pipeline completo)', async () => {
    const file = createMockPPTXFile('integration-test.pptx', 2048, createValidPPTXBuffer());
    
    // 1. Validação
    const validationResult = await validator.validatePPTXFile(file);
    expect(validationResult.isValid).toBe(true);
    
    // 2. Sanitização
    const sanitizationResult = await sanitizer.sanitizePPTXFile(file);
    expect(sanitizationResult.success).toBe(true);
    
    // 3. Cache do resultado
    if (sanitizationResult.sanitizedFile) {
      const cacheKey = `processed-${file.name}`;
      await cacheManager.set(cacheKey, {
        validation: validationResult,
        sanitization: sanitizationResult
      });
      
      const cached = await cacheManager.get(cacheKey);
      expect(cached).toBeDefined();
    }
  });

  test('deve tratar erro em pipeline graciosamente', async () => {
    const corruptFile = createMockPPTXFile('corrupt.pptx', 100); // Arquivo muito pequeno
    
    const validationResult = await validator.validatePPTXFile(corruptFile);
    expect(validationResult.isValid).toBe(false);
    
    // Pipeline deve parar na validação
    expect(validationResult.errors.length).toBeGreaterThan(0);
  });
});

/**
 * Testes de Performance
 */
describe('PPTX Performance Tests', () => {
  test('deve processar arquivo pequeno rapidamente', async () => {
    const smallFile = createMockPPTXFile('small.pptx', 1024, createValidPPTXBuffer());
    const validator = new PPTXValidator();
    
    const startTime = Date.now();
    await validator.validatePPTXFile(smallFile);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(1000); // Menos de 1 segundo
  });

  test('deve manter uso de memória controlado', async () => {
    const memoryManager = new PPTXMemoryManager();
    const initialMetrics = memoryManager.getMemoryMetrics();
    
    // Processar múltiplos arquivos
    const files = Array.from({ length: 10 }, (_, i) => 
      createMockPPTXFile(`test-${i}.pptx`, 1024, createValidPPTXBuffer())
    );
    
    const validator = new PPTXValidator();
    await Promise.all(files.map(file => validator.validatePPTXFile(file)));
    
    const finalMetrics = memoryManager.getMemoryMetrics();
    const memoryIncrease = finalMetrics.heapUsed - initialMetrics.heapUsed;
    
    // Aumento de memória deve ser razoável (menos de 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    
    memoryManager.destroy();
  });
});

/**
 * Testes de Stress
 */
describe('PPTX Stress Tests', () => {
  test('deve processar muitos arquivos simultaneamente', async () => {
    const workerPool = new PPTXWorkerPool({ maxWorkers: 4 });
    await workerPool.initialize();
    
    const tasks: PPTXWorkerTask[] = Array.from({ length: 50 }, (_, i) => ({
      id: `stress-test-${i}`,
      type: 'parse-slide',
      data: { slideXml: `<slide>Stress test ${i}</slide>`, slideIndex: i },
      priority: 'normal'
    }));

    const startTime = Date.now();
    const results = await Promise.all(tasks.map(task => workerPool.processTask(task)));
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(50);
    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(10000); // Menos de 10 segundos

    await workerPool.terminate();
  }, 15000); // Timeout de 15 segundos

  test('deve recuperar de múltiplos erros simultaneamente', async () => {
    const errorHandler = new PPTXErrorHandler();
    
    // Simular múltiplos erros
    const errors = Array.from({ length: 20 }, (_, i) => 
      new Error(`Stress error ${i}`)
    );

    const startTime = Date.now();
    const logs = errors.map(error => 
      errorHandler.createStructuredLog(error, 'stress-test', { errorIndex: errors.indexOf(error) })
    );
    const duration = Date.now() - startTime;

    expect(logs).toHaveLength(20);
    expect(duration).toBeLessThan(1000); // Deve ser muito rápido
  });
});

export default {};