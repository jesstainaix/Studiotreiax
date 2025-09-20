/**
 * Testes Específicos para Sistema de Processamento Paralelo
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParallelProcessor, createParallelProcessor, processInParallel } from '../parallel-processor';

// Mock para simular tarefas de processamento
const mockProcessingTask = vi.fn();
const mockHeavyTask = vi.fn();
const mockFailingTask = vi.fn();

describe('ParallelProcessor', () => {
  let processor: ParallelProcessor;

  beforeEach(() => {
    processor = ParallelProcessor.getInstance();
    vi.clearAllMocks();
    
    // Setup dos mocks
    mockProcessingTask.mockImplementation(async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simula processamento
      return { processed: true, data: data.content };
    });

    mockHeavyTask.mockImplementation(async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula tarefa pesada
      return { heavy: true, result: data.id * 2 };
    });

    mockFailingTask.mockImplementation(async (data: any) => {
      if (data.shouldFail) {
        throw new Error(`Task failed for ${data.id}`);
      }
      return { success: true, id: data.id };
    });
  });

  afterEach(async () => {
    await processor.shutdown();
  });

  describe('Configuração do Processador', () => {
    it('deve inicializar com configuração padrão', () => {
      const config = processor.getConfiguration();
      
      expect(config.maxWorkers).toBeGreaterThan(0);
      expect(config.queueSize).toBeGreaterThan(0);
      expect(config.taskTimeout).toBeGreaterThan(0);
      expect(typeof config.enableRetry).toBe('boolean');
    });

    it('deve aplicar configuração personalizada', () => {
      const customConfig = {
        maxWorkers: 8,
        queueSize: 200,
        taskTimeout: 10000,
        enableRetry: false,
        maxRetries: 2,
        retryDelay: 2000,
        enablePriority: true,
        enableMetrics: true
      };

      processor.configure(customConfig);
      const config = processor.getConfiguration();

      expect(config.maxWorkers).toBe(8);
      expect(config.queueSize).toBe(200);
      expect(config.taskTimeout).toBe(10000);
      expect(config.enableRetry).toBe(false);
      expect(config.maxRetries).toBe(2);
    });

    it('deve validar configuração inválida', () => {
      expect(() => {
        processor.configure({ maxWorkers: 0 });
      }).toThrow();

      expect(() => {
        processor.configure({ queueSize: -1 });
      }).toThrow();

      expect(() => {
        processor.configure({ taskTimeout: 0 });
      }).toThrow();
    });
  });

  describe('Processamento de Tarefas Simples', () => {
    it('deve processar uma única tarefa', async () => {
      const task = {
        id: 'task-1',
        type: 'simple',
        data: { content: 'test content' },
        priority: 'medium' as const
      };

      const result = await processor.processTask(task, mockProcessingTask);

      expect(result.success).toBe(true);
      expect(result.result.processed).toBe(true);
      expect(result.result.data).toBe('test content');
      expect(mockProcessingTask).toHaveBeenCalledWith(task.data);
    });

    it('deve processar múltiplas tarefas em paralelo', async () => {
      const tasks = Array(5).fill(null).map((_, index) => ({
        id: `task-${index}`,
        type: 'batch',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      const startTime = Date.now();
      const results = await processor.processTasks(tasks, mockProcessingTask);
      const processingTime = Date.now() - startTime;

      expect(results.summary.totalTasks).toBe(5);
      expect(results.summary.successfulTasks).toBe(5);
      expect(results.summary.failedTasks).toBe(0);
      expect(results.results).toHaveLength(5);
      
      // Deve ser mais rápido que processamento sequencial
      expect(processingTime).toBeLessThan(500); // 5 * 100ms seria 500ms sequencial
    });

    it('deve respeitar limite de workers', async () => {
      processor.configure({ maxWorkers: 2 });
      
      const tasks = Array(10).fill(null).map((_, index) => ({
        id: `task-${index}`,
        type: 'limited',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      const startTime = Date.now();
      await processor.processTasks(tasks, mockProcessingTask);
      const processingTime = Date.now() - startTime;

      // Com 2 workers, deve levar pelo menos 5 batches * 100ms = 500ms
      expect(processingTime).toBeGreaterThan(400);
      expect(mockProcessingTask).toHaveBeenCalledTimes(10);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com tarefas que falham', async () => {
      const tasks = [
        {
          id: 'task-success',
          type: 'mixed',
          data: { id: 1, shouldFail: false },
          priority: 'medium' as const
        },
        {
          id: 'task-fail',
          type: 'mixed',
          data: { id: 2, shouldFail: true },
          priority: 'medium' as const
        },
        {
          id: 'task-success-2',
          type: 'mixed',
          data: { id: 3, shouldFail: false },
          priority: 'medium' as const
        }
      ];

      const results = await processor.processTasks(tasks, mockFailingTask);

      expect(results.summary.totalTasks).toBe(3);
      expect(results.summary.successfulTasks).toBe(2);
      expect(results.summary.failedTasks).toBe(1);
      
      const failedResult = results.results.find(r => !r.success);
      expect(failedResult).toBeDefined();
      expect(failedResult?.error).toContain('Task failed for 2');
    });

    it('deve implementar retry automático quando habilitado', async () => {
      processor.configure({ 
        enableRetry: true, 
        maxRetries: 2, 
        retryDelay: 50 
      });

      let callCount = 0;
      const flakyTask = vi.fn().mockImplementation(async (data: any) => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Temporary failure');
        }
        return { success: true, attempts: callCount };
      });

      const task = {
        id: 'flaky-task',
        type: 'retry',
        data: { content: 'test' },
        priority: 'medium' as const
      };

      const result = await processor.processTask(task, flakyTask);

      expect(result.success).toBe(true);
      expect(result.result.attempts).toBe(3); // 1 tentativa inicial + 2 retries
      expect(flakyTask).toHaveBeenCalledTimes(3);
    });

    it('deve falhar após esgotar tentativas de retry', async () => {
      processor.configure({ 
        enableRetry: true, 
        maxRetries: 2, 
        retryDelay: 10 
      });

      const alwaysFailingTask = vi.fn().mockImplementation(async () => {
        throw new Error('Always fails');
      });

      const task = {
        id: 'always-fail',
        type: 'retry',
        data: { content: 'test' },
        priority: 'medium' as const
      };

      const result = await processor.processTask(task, alwaysFailingTask);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Always fails');
      expect(alwaysFailingTask).toHaveBeenCalledTimes(3); // 1 + 2 retries
    });

    it('deve lidar com timeout de tarefas', async () => {
      processor.configure({ taskTimeout: 200 });

      const slowTask = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Mais lento que timeout
        return { completed: true };
      });

      const task = {
        id: 'slow-task',
        type: 'timeout',
        data: { content: 'test' },
        priority: 'medium' as const
      };

      const result = await processor.processTask(task, slowTask);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Sistema de Prioridades', () => {
    it('deve processar tarefas de alta prioridade primeiro', async () => {
      processor.configure({ enablePriority: true, maxWorkers: 1 });

      const executionOrder: string[] = [];
      const priorityTask = vi.fn().mockImplementation(async (data: any) => {
        executionOrder.push(data.id);
        await new Promise(resolve => setTimeout(resolve, 50));
        return { id: data.id };
      });

      const tasks = [
        { id: 'low-1', type: 'priority', data: { id: 'low-1' }, priority: 'low' as const },
        { id: 'high-1', type: 'priority', data: { id: 'high-1' }, priority: 'high' as const },
        { id: 'medium-1', type: 'priority', data: { id: 'medium-1' }, priority: 'medium' as const },
        { id: 'high-2', type: 'priority', data: { id: 'high-2' }, priority: 'high' as const },
        { id: 'low-2', type: 'priority', data: { id: 'low-2' }, priority: 'low' as const }
      ];

      await processor.processTasks(tasks, priorityTask);

      // Tarefas de alta prioridade devem ser executadas primeiro
      expect(executionOrder.indexOf('high-1')).toBeLessThan(executionOrder.indexOf('medium-1'));
      expect(executionOrder.indexOf('high-2')).toBeLessThan(executionOrder.indexOf('low-1'));
      expect(executionOrder.indexOf('medium-1')).toBeLessThan(executionOrder.indexOf('low-2'));
    });
  });

  describe('Métricas e Monitoramento', () => {
    it('deve coletar métricas de performance', async () => {
      processor.configure({ enableMetrics: true });

      const tasks = Array(5).fill(null).map((_, index) => ({
        id: `metric-task-${index}`,
        type: 'metrics',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      await processor.processTasks(tasks, mockProcessingTask);
      const metrics = processor.getMetrics();

      expect(metrics.totalTasksProcessed).toBe(5);
      expect(metrics.successfulTasks).toBe(5);
      expect(metrics.failedTasks).toBe(0);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.throughput).toBeGreaterThan(0);
    });

    it('deve rastrear estatísticas de workers', async () => {
      processor.configure({ maxWorkers: 3 });

      const tasks = Array(10).fill(null).map((_, index) => ({
        id: `worker-task-${index}`,
        type: 'worker-stats',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      await processor.processTasks(tasks, mockProcessingTask);
      const stats = processor.getWorkerStats();

      expect(stats.activeWorkers).toBe(0); // Todos devem estar inativos após conclusão
      expect(stats.totalWorkers).toBe(3);
      expect(stats.queueSize).toBe(0);
      expect(stats.completedTasks).toBe(10);
    });

    it('deve fornecer estatísticas em tempo real', async () => {
      processor.configure({ maxWorkers: 2 });

      const longRunningTask = vi.fn().mockImplementation(async (data: any) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { id: data.id };
      });

      const tasks = Array(6).fill(null).map((_, index) => ({
        id: `realtime-task-${index}`,
        type: 'realtime',
        data: { id: index },
        priority: 'medium' as const
      }));

      // Inicia processamento sem aguardar
      const processingPromise = processor.processTasks(tasks, longRunningTask);

      // Verifica estatísticas durante o processamento
      await new Promise(resolve => setTimeout(resolve, 50));
      const realtimeStats = processor.getWorkerStats();

      expect(realtimeStats.activeWorkers).toBeGreaterThan(0);
      expect(realtimeStats.queueSize).toBeGreaterThan(0);

      await processingPromise;
    });
  });

  describe('Gerenciamento de Recursos', () => {
    it('deve ajustar pool de workers dinamicamente', async () => {
      processor.configure({ maxWorkers: 2 });

      // Primeira batch de tarefas
      const firstBatch = Array(4).fill(null).map((_, index) => ({
        id: `batch1-task-${index}`,
        type: 'dynamic',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      await processor.processTasks(firstBatch, mockProcessingTask);
      
      // Aumenta número de workers
      processor.configure({ maxWorkers: 4 });

      // Segunda batch de tarefas
      const secondBatch = Array(8).fill(null).map((_, index) => ({
        id: `batch2-task-${index}`,
        type: 'dynamic',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      const startTime = Date.now();
      await processor.processTasks(secondBatch, mockProcessingTask);
      const processingTime = Date.now() - startTime;

      // Com mais workers, deve ser mais rápido
      expect(processingTime).toBeLessThan(400); // 8 tarefas / 4 workers * 100ms = 200ms
    });

    it('deve limpar recursos adequadamente no shutdown', async () => {
      const tasks = Array(3).fill(null).map((_, index) => ({
        id: `shutdown-task-${index}`,
        type: 'shutdown',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      await processor.processTasks(tasks, mockProcessingTask);
      
      const statsBefore = processor.getWorkerStats();
      expect(statsBefore.completedTasks).toBe(3);

      await processor.shutdown();
      
      const statsAfter = processor.getWorkerStats();
      expect(statsAfter.activeWorkers).toBe(0);
      expect(statsAfter.queueSize).toBe(0);
    });

    it('deve lidar com sobrecarga de queue', async () => {
      processor.configure({ maxWorkers: 1, queueSize: 3 });

      const tasks = Array(10).fill(null).map((_, index) => ({
        id: `overload-task-${index}`,
        type: 'overload',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      // Deve processar apenas até o limite da queue
      const results = await processor.processTasks(tasks, mockProcessingTask);
      
      expect(results.summary.totalTasks).toBeLessThanOrEqual(10);
      expect(results.summary.successfulTasks).toBeGreaterThan(0);
    });
  });

  describe('Funções Utilitárias', () => {
    it('createParallelProcessor deve funcionar corretamente', () => {
      const customProcessor = createParallelProcessor({
        maxWorkers: 6,
        enableMetrics: true
      });

      expect(customProcessor).toBeDefined();
      expect(customProcessor.getConfiguration().maxWorkers).toBe(6);
      expect(customProcessor.getConfiguration().enableMetrics).toBe(true);
    });

    it('processInParallel deve funcionar como função standalone', async () => {
      const data = [
        { content: 'item 1' },
        { content: 'item 2' },
        { content: 'item 3' }
      ];

      const processor = async (item: any) => {
        return { processed: item.content.toUpperCase() };
      };

      const results = await processInParallel(data, processor, { maxWorkers: 2 });

      expect(results).toHaveLength(3);
      expect(results[0].processed).toBe('ITEM 1');
      expect(results[1].processed).toBe('ITEM 2');
      expect(results[2].processed).toBe('ITEM 3');
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com array vazio de tarefas', async () => {
      const results = await processor.processTasks([], mockProcessingTask);

      expect(results.summary.totalTasks).toBe(0);
      expect(results.summary.successfulTasks).toBe(0);
      expect(results.results).toHaveLength(0);
    });

    it('deve lidar com tarefas malformadas', async () => {
      const malformedTasks = [
        null,
        undefined,
        { id: 'valid', type: 'test', data: { content: 'valid' }, priority: 'medium' as const },
        { /* missing required fields */ },
        { id: '', type: '', data: null, priority: 'invalid' as any }
      ];

      const results = await processor.processTasks(malformedTasks as any, mockProcessingTask);

      // Deve processar apenas as tarefas válidas
      expect(results.summary.successfulTasks).toBe(1);
      expect(results.summary.failedTasks).toBeGreaterThan(0);
    });

    it('deve lidar com função de processamento inválida', async () => {
      const task = {
        id: 'test-task',
        type: 'invalid-processor',
        data: { content: 'test' },
        priority: 'medium' as const
      };

      const result = await processor.processTask(task, null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('deve processar muitas tarefas eficientemente', async () => {
      processor.configure({ maxWorkers: 4, enableMetrics: true });

      const manyTasks = Array(100).fill(null).map((_, index) => ({
        id: `perf-task-${index}`,
        type: 'performance',
        data: { content: `content-${index}` },
        priority: 'medium' as const
      }));

      const startTime = Date.now();
      const results = await processor.processTasks(manyTasks, mockProcessingTask);
      const processingTime = Date.now() - startTime;

      expect(results.summary.totalTasks).toBe(100);
      expect(results.summary.successfulTasks).toBe(100);
      expect(processingTime).toBeLessThan(5000); // Menos de 5 segundos

      const metrics = processor.getMetrics();
      expect(metrics.throughput).toBeGreaterThan(10); // Pelo menos 10 tarefas/segundo
    });

    it('deve manter performance com tarefas pesadas', async () => {
      processor.configure({ maxWorkers: 2 });

      const heavyTasks = Array(10).fill(null).map((_, index) => ({
        id: `heavy-task-${index}`,
        type: 'heavy',
        data: { id: index },
        priority: 'medium' as const
      }));

      const startTime = Date.now();
      const results = await processor.processTasks(heavyTasks, mockHeavyTask);
      const processingTime = Date.now() - startTime;

      expect(results.summary.successfulTasks).toBe(10);
      // Com 2 workers, deve levar cerca de 5 * 500ms = 2500ms
      expect(processingTime).toBeLessThan(3000);
      expect(processingTime).toBeGreaterThan(2000);
    });
  });
});