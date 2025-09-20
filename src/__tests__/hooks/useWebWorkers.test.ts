/**
 * Testes unitários para useWebWorkers hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebWorkers } from '../../hooks/useWebWorkers';
import { mockWorker } from '../setup';

describe('useWebWorkers Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Worker constructor
    global.Worker = vi.fn().mockImplementation(() => mockWorker());
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useWebWorkers());

      expect(result.current.workers).toEqual([]);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.pools).toEqual([]);
      expect(result.current.stats).toBeDefined();
      expect(result.current.analytics).toBeDefined();
      expect(result.current.configs).toBeDefined();
    });

    it('deve ter todas as ações disponíveis', () => {
      const { result } = renderHook(() => useWebWorkers());

      expect(result.current.actions).toBeDefined();
      expect(result.current.quickActions).toBeDefined();
      expect(result.current.throttledActions).toBeDefined();
      expect(result.current.debouncedActions).toBeDefined();
    });

    it('deve ter valores computados corretos', () => {
      const { result } = renderHook(() => useWebWorkers());

      expect(result.current.totalWorkers).toBe(0);
      expect(result.current.activeWorkers).toBe(0);
      expect(result.current.totalTasks).toBe(0);
      expect(result.current.completedTasks).toBe(0);
      expect(result.current.systemHealth).toBeGreaterThanOrEqual(0);
      expect(result.current.systemHealth).toBeLessThanOrEqual(100);
    });
  });

  describe('Gerenciamento de Workers', () => {
    it('deve criar um novo worker', async () => {
      const { result } = renderHook(() => useWebWorkers());

      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Video Processor',
          script: '/workers/video-processor.js',
          type: 'video'
        });
      });

      expect(result.current.workers).toHaveLength(1);
      expect(result.current.workers[0].name).toBe('Video Processor');
      expect(result.current.workers[0].type).toBe('video');
      expect(result.current.workers[0].status).toBe('idle');
      expect(result.current.totalWorkers).toBe(1);
    });

    it('deve iniciar um worker', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar worker
      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Test Worker',
          script: '/workers/test.js',
          type: 'general'
        });
      });

      const workerId = result.current.workers[0].id;

      // Iniciar worker
      await act(async () => {
        await result.current.actions.startWorker(workerId);
      });

      expect(result.current.workers[0].status).toBe('running');
      expect(result.current.activeWorkers).toBe(1);
    });

    it('deve parar um worker', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar e iniciar worker
      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Test Worker',
          script: '/workers/test.js',
          type: 'general'
        });
      });

      const workerId = result.current.workers[0].id;

      await act(async () => {
        await result.current.actions.startWorker(workerId);
      });

      // Parar worker
      await act(async () => {
        await result.current.actions.stopWorker(workerId);
      });

      expect(result.current.workers[0].status).toBe('stopped');
      expect(result.current.activeWorkers).toBe(0);
    });

    it('deve remover um worker', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar worker
      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Test Worker',
          script: '/workers/test.js',
          type: 'general'
        });
      });

      const workerId = result.current.workers[0].id;

      // Remover worker
      await act(async () => {
        await result.current.actions.deleteWorker(workerId);
      });

      expect(result.current.workers).toHaveLength(0);
      expect(result.current.totalWorkers).toBe(0);
    });
  });

  describe('Gerenciamento de Tarefas', () => {
    it('deve criar uma nova tarefa', async () => {
      const { result } = renderHook(() => useWebWorkers());

      await act(async () => {
        await result.current.quickActions.createTask({
          name: 'Process Video',
          type: 'video-processing',
          data: { videoUrl: '/videos/test.mp4' },
          priority: 'high'
        });
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].name).toBe('Process Video');
      expect(result.current.tasks[0].type).toBe('video-processing');
      expect(result.current.tasks[0].status).toBe('pending');
      expect(result.current.tasks[0].priority).toBe('high');
      expect(result.current.totalTasks).toBe(1);
    });

    it('deve executar uma tarefa', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar worker e tarefa
      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Video Worker',
          script: '/workers/video.js',
          type: 'video'
        });
        await result.current.quickActions.createTask({
          name: 'Process Video',
          type: 'video-processing',
          data: { videoUrl: '/videos/test.mp4' },
          priority: 'high'
        });
      });

      const taskId = result.current.tasks[0].id;

      // Executar tarefa
      await act(async () => {
        await result.current.actions.executeTask(taskId);
      });

      expect(result.current.tasks[0].status).toBe('running');
    });

    it('deve completar uma tarefa', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar e executar tarefa
      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Test Worker',
          script: '/workers/test.js',
          type: 'general'
        });
        await result.current.quickActions.createTask({
          name: 'Test Task',
          type: 'general',
          data: { test: true },
          priority: 'medium'
        });
      });

      const taskId = result.current.tasks[0].id;

      await act(async () => {
        await result.current.actions.executeTask(taskId);
      });

      // Simular conclusão da tarefa
      await act(async () => {
        await result.current.actions.completeTask(taskId, { result: 'success' });
      });

      expect(result.current.tasks[0].status).toBe('completed');
      expect(result.current.tasks[0].result).toEqual({ result: 'success' });
      expect(result.current.completedTasks).toBe(1);
    });

    it('deve cancelar uma tarefa', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar tarefa
      await act(async () => {
        await result.current.quickActions.createTask({
          name: 'Test Task',
          type: 'general',
          data: { test: true },
          priority: 'low'
        });
      });

      const taskId = result.current.tasks[0].id;

      // Cancelar tarefa
      await act(async () => {
        await result.current.actions.cancelTask(taskId);
      });

      expect(result.current.tasks[0].status).toBe('cancelled');
    });

    it('deve filtrar tarefas por status', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar tarefas com diferentes status
      await act(async () => {
        await result.current.quickActions.createTask({
          name: 'Task 1',
          type: 'general',
          data: {},
          priority: 'high'
        });
        await result.current.quickActions.createTask({
          name: 'Task 2',
          type: 'general',
          data: {},
          priority: 'medium'
        });
      });

      // Completar uma tarefa
      const taskId = result.current.tasks[0].id;
      await act(async () => {
        await result.current.actions.completeTask(taskId, { result: 'done' });
      });

      // Filtrar por status completed
      await act(async () => {
        result.current.actions.setFilters({ status: 'completed' });
      });

      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0].status).toBe('completed');
    });
  });

  describe('Gerenciamento de Pools', () => {
    it('deve criar um novo pool', async () => {
      const { result } = renderHook(() => useWebWorkers());

      await act(async () => {
        await result.current.quickActions.createPool({
          name: 'Video Processing Pool',
          type: 'video',
          maxWorkers: 4
        });
      });

      expect(result.current.pools).toHaveLength(1);
      expect(result.current.pools[0].name).toBe('Video Processing Pool');
      expect(result.current.pools[0].type).toBe('video');
      expect(result.current.pools[0].maxWorkers).toBe(4);
      expect(result.current.pools[0].workers).toEqual([]);
    });

    it('deve adicionar worker ao pool', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar pool e worker
      await act(async () => {
        await result.current.quickActions.createPool({
          name: 'Test Pool',
          type: 'general',
          maxWorkers: 2
        });
        await result.current.quickActions.createWorker({
          name: 'Test Worker',
          script: '/workers/test.js',
          type: 'general'
        });
      });

      const poolId = result.current.pools[0].id;
      const workerId = result.current.workers[0].id;

      // Adicionar worker ao pool
      await act(async () => {
        await result.current.actions.addWorkerToPool(poolId, workerId);
      });

      expect(result.current.pools[0].workers).toContain(workerId);
      expect(result.current.workers[0].poolId).toBe(poolId);
    });

    it('deve remover worker do pool', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar pool e worker, adicionar ao pool
      await act(async () => {
        await result.current.quickActions.createPool({
          name: 'Test Pool',
          type: 'general',
          maxWorkers: 2
        });
        await result.current.quickActions.createWorker({
          name: 'Test Worker',
          script: '/workers/test.js',
          type: 'general'
        });
      });

      const poolId = result.current.pools[0].id;
      const workerId = result.current.workers[0].id;

      await act(async () => {
        await result.current.actions.addWorkerToPool(poolId, workerId);
      });

      // Remover worker do pool
      await act(async () => {
        await result.current.actions.removeWorkerFromPool(poolId, workerId);
      });

      expect(result.current.pools[0].workers).not.toContain(workerId);
      expect(result.current.workers[0].poolId).toBeUndefined();
    });

    it('deve escalar pool automaticamente', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar pool com auto-scaling
      await act(async () => {
        await result.current.quickActions.createPool({
          name: 'Auto Scale Pool',
          type: 'general',
          maxWorkers: 4,
          autoScale: true
        });
      });

      const poolId = result.current.pools[0].id;

      // Simular alta demanda
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          await result.current.quickActions.createTask({
            name: `Task ${i}`,
            type: 'general',
            data: {},
            priority: 'high'
          });
        }
      });

      // Escalar pool
      await act(async () => {
        await result.current.actions.scalePool(poolId, 3);
      });

      expect(result.current.pools[0].workers.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Configurações', () => {
    it('deve atualizar configurações', async () => {
      const { result } = renderHook(() => useWebWorkers());

      await act(async () => {
        await result.current.actions.updateConfig({
          maxConcurrentTasks: 10,
          autoRetry: true,
          retryAttempts: 3,
          timeout: 30000
        });
      });

      expect(result.current.configs.maxConcurrentTasks).toBe(10);
      expect(result.current.configs.autoRetry).toBe(true);
      expect(result.current.configs.retryAttempts).toBe(3);
      expect(result.current.configs.timeout).toBe(30000);
    });

    it('deve resetar configurações', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Atualizar configurações
      await act(async () => {
        await result.current.actions.updateConfig({
          maxConcurrentTasks: 20,
          autoRetry: false
        });
      });

      // Resetar configurações
      await act(async () => {
        await result.current.actions.resetConfig();
      });

      expect(result.current.configs.maxConcurrentTasks).toBe(5);
      expect(result.current.configs.autoRetry).toBe(true);
    });
  });

  describe('Analytics e Estatísticas', () => {
    it('deve calcular estatísticas corretamente', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar workers e tarefas
      await act(async () => {
        await result.current.quickActions.createWorker({
          name: 'Worker 1',
          script: '/workers/test1.js',
          type: 'general'
        });
        await result.current.quickActions.createWorker({
          name: 'Worker 2',
          script: '/workers/test2.js',
          type: 'video'
        });
        await result.current.quickActions.createTask({
          name: 'Task 1',
          type: 'general',
          data: {},
          priority: 'high'
        });
        await result.current.quickActions.createTask({
          name: 'Task 2',
          type: 'video',
          data: {},
          priority: 'medium'
        });
      });

      expect(result.current.stats.totalWorkers).toBe(2);
      expect(result.current.stats.totalTasks).toBe(2);
      expect(result.current.stats.workersByType.general).toBe(1);
      expect(result.current.stats.workersByType.video).toBe(1);
      expect(result.current.stats.tasksByType.general).toBe(1);
      expect(result.current.stats.tasksByType.video).toBe(1);
    });

    it('deve calcular performance metrics', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar e completar tarefas
      await act(async () => {
        await result.current.quickActions.createTask({
          name: 'Fast Task',
          type: 'general',
          data: {},
          priority: 'high'
        });
      });

      const taskId = result.current.tasks[0].id;

      await act(async () => {
        await result.current.actions.executeTask(taskId);
        await result.current.actions.completeTask(taskId, { result: 'success' });
      });

      expect(result.current.analytics.averageTaskDuration).toBeGreaterThan(0);
      expect(result.current.analytics.successRate).toBeGreaterThan(0);
      expect(result.current.analytics.throughput).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com erro ao criar worker', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Mock Worker constructor para falhar
      global.Worker = vi.fn().mockImplementation(() => {
        throw new Error('Failed to create worker');
      });

      await act(async () => {
        try {
          await result.current.quickActions.createWorker({
            name: 'Error Worker',
            script: '/workers/error.js',
            type: 'general'
          });
        } catch (error) {
          expect(error.message).toBe('Failed to create worker');
        }
      });

      expect(result.current.workers).toHaveLength(0);
    });

    it('deve lidar com erro em tarefa', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Criar tarefa
      await act(async () => {
        await result.current.quickActions.createTask({
          name: 'Error Task',
          type: 'general',
          data: {},
          priority: 'high'
        });
      });

      const taskId = result.current.tasks[0].id;

      // Simular erro na tarefa
      await act(async () => {
        await result.current.actions.failTask(taskId, 'Processing error');
      });

      expect(result.current.tasks[0].status).toBe('failed');
      expect(result.current.tasks[0].error).toBe('Processing error');
    });

    it('deve retry tarefa automaticamente', async () => {
      const { result } = renderHook(() => useWebWorkers());

      // Configurar auto-retry
      await act(async () => {
        await result.current.actions.updateConfig({
          autoRetry: true,
          retryAttempts: 2
        });
      });

      // Criar tarefa
      await act(async () => {
        await result.current.quickActions.createTask({
          name: 'Retry Task',
          type: 'general',
          data: {},
          priority: 'high'
        });
      });

      const taskId = result.current.tasks[0].id;

      // Simular falha
      await act(async () => {
        await result.current.actions.failTask(taskId, 'Temporary error');
      });

      // Verificar se foi marcada para retry
      expect(result.current.tasks[0].retryCount).toBeGreaterThan(0);
    });
  });

  describe('Ações Throttled e Debounced', () => {
    it('deve throttle atualizações de status', async () => {
      const { result } = renderHook(() => useWebWorkers());
      const spy = vi.spyOn(result.current.actions, 'updateWorkerStatus');

      // Executar ação throttled múltiplas vezes
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          result.current.throttledActions.updateWorkerStatus('worker-id', 'running');
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('deve debounce filtros de busca', async () => {
      const { result } = renderHook(() => useWebWorkers());
      const spy = vi.spyOn(result.current.actions, 'setFilters');

      // Executar ação debounced múltiplas vezes
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          result.current.debouncedActions.setFilters({ search: `query ${i}` });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ search: 'query 4' });
    });
  });
});