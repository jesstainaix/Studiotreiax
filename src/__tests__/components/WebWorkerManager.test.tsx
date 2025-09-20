/**
 * Testes de integração para WebWorkerManager component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebWorkerManager from '../../components/webWorker/WebWorkerManager';
import { useWebWorkers } from '../../hooks/useWebWorkers';

// Mock do hook
const mockUseWebWorkers = {
  state: {
    isSupported: true,
    isInitialized: true,
    workers: [],
    taskQueue: [],
    activeTasks: [],
    completedTasks: [],
    failedTasks: []
  },
  config: {
    enabled: true,
    maxWorkers: 4,
    maxConcurrentTasks: 10,
    taskTimeout: 30000,
    retryAttempts: 3,
    enableLogging: true,
    autoRetry: true,
    workerTypes: ['general', 'video', 'image', 'audio', 'data']
  },
  metrics: {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    queueLength: 0,
    throughput: 0,
    errorRate: 0,
    memoryUsage: 0,
    cpuUsage: 0
  },
  profiles: [],
  logs: [],
  isLoading: false,
  error: null,
  workers: [],
  tasks: [],
  pools: [],
  stats: {
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingTasks: 0
  },
  health: 100,
  isHealthy: true,
  needsAttention: false,
  efficiency: 85,
  utilization: 70,
  overallProgress: 80,
  configs: {
    maxWorkers: 4,
    timeout: 30000,
    retries: 3,
    priority: 'normal'
  },
  analytics: {
    throughput: 0,
    errorRate: 0,
    averageResponseTime: 0,
    peakConcurrency: 0,
    resourceUtilization: 0,
    taskDistribution: [],
    performanceHistory: [],
    bottlenecks: []
  },
  totalWorkers: 0,
  activeTasks: 0,
  systemHealth: 95,
  filteredWorkers: [],
  filteredPools: [],
  filteredTasks: [],
  actions: {
    addTask: vi.fn(),
    cancelTask: vi.fn(),
    getTask: vi.fn(),
    clearCompletedTasks: vi.fn(),
    clearFailedTasks: vi.fn(),
    clearLogs: vi.fn(),
    updateConfig: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
    clearError: vi.fn(),
    createWorker: vi.fn(),
    terminateWorker: vi.fn(),
    createPool: vi.fn(),
    deletePool: vi.fn(),
    resetConfig: vi.fn(),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    updateAnalytics: vi.fn(),
    createTask: vi.fn(),
    executeTask: vi.fn(),
    retryTask: vi.fn()
  },
  quickActions: {
    createWorker: vi.fn(),
    createPool: vi.fn(),
    addTask: vi.fn(),
    processVideo: vi.fn(),
    processImage: vi.fn(),
    analyzeData: vi.fn(),
    scaleWorkers: vi.fn()
  },
  throttledActions: {
    updateConfig: vi.fn(),
    updateAnalytics: vi.fn()
  },
  debouncedActions: {
    setFilters: vi.fn()
  },
  getRecommendedActions: vi.fn(() => []),
  getSystemStatus: vi.fn(() => 'healthy'),
  getOptimizationSuggestions: vi.fn(() => []),
  getFilteredTasks: vi.fn(() => []),
  getFilteredWorkers: vi.fn(() => []),
  getRecommendedAction: vi.fn(() => 'Sistema funcionando normalmente')
};

// Mock do hook useWebWorkers
vi.mock('../../hooks/useWebWorkers', () => ({
  useWebWorkers: vi.fn(),
  formatTaskDuration: (duration: number) => `${duration}ms`,
  getTaskColor: (status: string) => 'text-blue-600',
  getPriorityColor: (priority: string) => 'bg-blue-100 text-blue-800',
  formatWorkerTime: (timestamp: any) => 'Agora',
  getTaskComplexity: (task: any) => 'Baixa',
  getWorkerEfficiency: (worker: any) => 85,
  getRecommendedAction: (stats: any) => 'Sistema funcionando normalmente',
  getWorkerStatus: (worker: any) => 'idle'
}));

const mockedUseWebWorkers = vi.mocked(useWebWorkers);

describe('WebWorkerManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseWebWorkers.mockReturnValue(mockUseWebWorkers);
  });

  describe('Renderização', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<WebWorkerManager />);
      
      expect(screen.getByText('Web Worker Manager')).toBeInTheDocument();
      expect(screen.getByText('Gerenciamento de workers e processamento em background')).toBeInTheDocument();
    });

    it('deve renderizar todas as abas', () => {
      render(<WebWorkerManager />);
      
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      expect(screen.getByText('Workers')).toBeInTheDocument();
      expect(screen.getByText('Pools')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    it('deve renderizar cards de status', () => {
      render(<WebWorkerManager />);
      
      expect(screen.getByText('Total de Workers')).toBeInTheDocument();
      expect(screen.getByText('Tasks Ativas')).toBeInTheDocument();
      expect(screen.getByText('Saúde do Sistema')).toBeInTheDocument();
    });

    it('deve renderizar barra de busca e filtros', () => {
      render(<WebWorkerManager />);
      
      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });
  });

  describe('Navegação entre Abas', () => {
    it('deve alternar entre abas', async () => {
      render(<WebWorkerManager />);
      
      // Clicar na aba Workers
      fireEvent.click(screen.getByText('Workers'));
      await waitFor(() => {
        expect(screen.getByText('Nenhum worker encontrado')).toBeInTheDocument();
      });

      // Clicar na aba Pools
      fireEvent.click(screen.getByText('Pools'));
      await waitFor(() => {
        expect(screen.getByText('Nenhum pool encontrado')).toBeInTheDocument();
      });

      // Clicar na aba Tasks
      fireEvent.click(screen.getByText('Tasks'));
      await waitFor(() => {
        expect(screen.getByText('Nenhuma task encontrada')).toBeInTheDocument();
      });
    });

    it('deve manter estado da aba ativa', () => {
      render(<WebWorkerManager />);
      
      const workersTab = screen.getByText('Workers');
      fireEvent.click(workersTab);
      
      // Verificar se a aba está ativa
      expect(workersTab.closest('button')).toHaveClass('border-blue-500');
    });
  });

  describe('Funcionalidades de Busca e Filtro', () => {
    it('deve executar busca', async () => {
      render(<WebWorkerManager />);
      
      const searchInput = screen.getByPlaceholderText('Buscar...');
      fireEvent.change(searchInput, { target: { value: 'video' } });
      
      await waitFor(() => {
        expect(mockUseWebWorkers.debouncedActions.setFilters).toHaveBeenCalledWith({
          search: 'video'
        });
      });
    });

    it('deve limpar filtros', async () => {
      render(<WebWorkerManager />);
      
      const clearButton = screen.getByText('Limpar');
      fireEvent.click(clearButton);
      
      expect(mockUseWebWorkers.actions.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Criação de Workers', () => {
    it('deve abrir dialog de criação de worker', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Workers
      fireEvent.click(screen.getByText('Workers'));
      
      // Clicar no botão de criar
      const createButton = screen.getByText('Criar Worker');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Worker')).toBeInTheDocument();
      });
    });

    it('deve criar worker com configurações válidas', async () => {
      render(<WebWorkerManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Workers'));
      fireEvent.click(screen.getByText('Criar Worker'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Worker')).toBeInTheDocument();
      });
      
      // Preencher formulário
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Video Processor' }
      });
      
      fireEvent.change(screen.getByLabelText('Tipo'), {
        target: { value: 'video' }
      });
      
      // Submeter formulário
      fireEvent.click(screen.getByText('Criar'));
      
      await waitFor(() => {
        expect(mockUseWebWorkers.quickActions.createWorker).toHaveBeenCalledWith({
          name: 'Video Processor',
          type: 'video',
          script: '',
          config: {}
        });
      });
    });

    it('deve validar campos obrigatórios', async () => {
      render(<WebWorkerManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Workers'));
      fireEvent.click(screen.getByText('Criar Worker'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Worker')).toBeInTheDocument();
      });
      
      // Tentar submeter sem preencher
      fireEvent.click(screen.getByText('Criar'));
      
      // Verificar se não foi chamado
      expect(mockUseWebWorkers.quickActions.createWorker).not.toHaveBeenCalled();
    });
  });

  describe('Criação de Pools', () => {
    it('deve abrir dialog de criação de pool', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Pools
      fireEvent.click(screen.getByText('Pools'));
      
      // Clicar no botão de criar
      const createButton = screen.getByText('Criar Pool');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Pool')).toBeInTheDocument();
      });
    });

    it('deve criar pool com configurações válidas', async () => {
      render(<WebWorkerManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Pools'));
      fireEvent.click(screen.getByText('Criar Pool'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Pool')).toBeInTheDocument();
      });
      
      // Preencher formulário
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Video Processing Pool' }
      });
      
      fireEvent.change(screen.getByLabelText('Tipo'), {
        target: { value: 'video' }
      });
      
      fireEvent.change(screen.getByLabelText('Máximo de Workers'), {
        target: { value: '4' }
      });
      
      // Submeter formulário
      fireEvent.click(screen.getByText('Criar'));
      
      await waitFor(() => {
        expect(mockUseWebWorkers.quickActions.createPool).toHaveBeenCalledWith({
          name: 'Video Processing Pool',
          type: 'video',
          maxWorkers: 4,
          config: {}
        });
      });
    });

    it('deve validar número máximo de workers', async () => {
      render(<WebWorkerManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Pools'));
      fireEvent.click(screen.getByText('Criar Pool'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Pool')).toBeInTheDocument();
      });
      
      // Preencher com valor inválido
      fireEvent.change(screen.getByLabelText('Máximo de Workers'), {
        target: { value: '0' }
      });
      
      // Tentar submeter
      fireEvent.click(screen.getByText('Criar'));
      
      // Verificar se não foi chamado
      expect(mockUseWebWorkers.quickActions.createPool).not.toHaveBeenCalled();
    });
  });

  describe('Gerenciamento de Tasks', () => {
    it('deve abrir dialog de criação de task', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Tasks
      fireEvent.click(screen.getByText('Tasks'));
      
      // Clicar no botão de criar
      const createButton = screen.getByText('Adicionar Task');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Nova Task')).toBeInTheDocument();
      });
    });

    it('deve criar task com dados válidos', async () => {
      render(<WebWorkerManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Tasks'));
      fireEvent.click(screen.getByText('Adicionar Task'));
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Nova Task')).toBeInTheDocument();
      });
      
      // Preencher formulário
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Process Video' }
      });
      
      fireEvent.change(screen.getByLabelText('Tipo'), {
        target: { value: 'video' }
      });
      
      fireEvent.change(screen.getByLabelText('Prioridade'), {
        target: { value: 'high' }
      });
      
      // Submeter formulário
      fireEvent.click(screen.getByText('Adicionar'));
      
      await waitFor(() => {
        expect(mockUseWebWorkers.quickActions.addTask).toHaveBeenCalledWith({
          name: 'Process Video',
          type: 'video',
          priority: 'high',
          data: {},
          config: {}
        });
      });
    });

    it('deve cancelar task', async () => {
      const mockWithTasks = {
        ...mockUseWebWorkers,
        tasks: [{
          id: 'task-1',
          name: 'Test Task',
          status: 'running',
          type: 'video',
          priority: 'normal',
          progress: 50
        }],
        filteredTasks: [{
          id: 'task-1',
          name: 'Test Task',
          status: 'running',
          type: 'video',
          priority: 'normal',
          progress: 50
        }]
      };
      
      (useWebWorkers as any).mockReturnValue(mockWithTasks);
      
      render(<WebWorkerManager />);
      
      // Ir para aba Tasks
      fireEvent.click(screen.getByText('Tasks'));
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
      });
      
      expect(mockUseWebWorkers.actions.cancelTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Configurações', () => {
    it('deve renderizar configurações na aba correspondente', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Configurações
      fireEvent.click(screen.getByText('Configurações'));
      
      await waitFor(() => {
        expect(screen.getByText('Máximo de Workers')).toBeInTheDocument();
        expect(screen.getByText('Timeout (ms)')).toBeInTheDocument();
        expect(screen.getByText('Tentativas')).toBeInTheDocument();
        expect(screen.getByText('Prioridade')).toBeInTheDocument();
      });
    });

    it('deve atualizar configurações', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Configurações
      fireEvent.click(screen.getByText('Configurações'));
      
      await waitFor(() => {
        const maxWorkersInput = screen.getByDisplayValue('4');
        fireEvent.change(maxWorkersInput, { target: { value: '8' } });
        fireEvent.blur(maxWorkersInput);
      });
      
      expect(mockUseWebWorkers.throttledActions.updateConfig).toHaveBeenCalledWith({
        maxWorkers: 8
      });
    });

    it('deve resetar configurações', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Configurações
      fireEvent.click(screen.getByText('Configurações'));
      
      await waitFor(() => {
        const resetButton = screen.getByText('Resetar Configurações');
        fireEvent.click(resetButton);
      });
      
      expect(mockUseWebWorkers.actions.resetConfig).toHaveBeenCalled();
    });
  });

  describe('Analytics', () => {
    it('deve renderizar analytics na aba correspondente', async () => {
      render(<WebWorkerManager />);
      
      // Ir para aba Analytics
      fireEvent.click(screen.getByText('Analytics'));
      
      await waitFor(() => {
        expect(screen.getByText('Throughput')).toBeInTheDocument();
        expect(screen.getByText('Error Rate')).toBeInTheDocument();
        expect(screen.getByText('Response Time')).toBeInTheDocument();
      });
    });

    it('deve exibir métricas de performance', async () => {
      const mockWithAnalytics = {
        ...mockUseWebWorkers,
        analytics: {
          ...mockUseWebWorkers.analytics,
          throughput: 150,
          errorRate: 0.05,
          averageResponseTime: 250
        }
      };
      
      (useWebWorkers as any).mockReturnValue(mockWithAnalytics);
      
      render(<WebWorkerManager />);
      
      // Ir para aba Analytics
      fireEvent.click(screen.getByText('Analytics'));
      
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('5%')).toBeInTheDocument();
        expect(screen.getByText('250ms')).toBeInTheDocument();
      });
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve exibir estado de loading', () => {
      const mockWithLoading = {
        ...mockUseWebWorkers,
        isLoading: true
      };
      
      (useWebWorkers as any).mockReturnValue(mockWithLoading);
      
      render(<WebWorkerManager />);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve exibir estado de erro', () => {
      const mockWithError = {
        ...mockUseWebWorkers,
        error: 'Erro ao carregar workers'
      };
      
      (useWebWorkers as any).mockReturnValue(mockWithError);
      
      render(<WebWorkerManager />);
      
      expect(screen.getByText('Erro ao carregar workers')).toBeInTheDocument();
    });
  });

  describe('Terminação de Workers', () => {
    it('deve terminar worker', async () => {
      const mockWithWorkers = {
        ...mockUseWebWorkers,
        workers: [{
          id: 'worker-1',
          name: 'Test Worker',
          status: 'active',
          type: 'video'
        }],
        filteredWorkers: [{
          id: 'worker-1',
          name: 'Test Worker',
          status: 'active',
          type: 'video'
        }]
      };
      
      (useWebWorkers as any).mockReturnValue(mockWithWorkers);
      
      render(<WebWorkerManager />);
      
      // Ir para aba Workers
      fireEvent.click(screen.getByText('Workers'));
      
      await waitFor(() => {
        const terminateButton = screen.getByText('Terminar');
        fireEvent.click(terminateButton);
      });
      
      expect(mockUseWebWorkers.actions.terminateWorker).toHaveBeenCalledWith('worker-1');
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar layout para mobile', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<WebWorkerManager />);
      
      // Verificar se o layout mobile está sendo aplicado
      const container = screen.getByTestId('web-worker-manager');
      expect(container).toHaveClass('flex-col');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter navegação por teclado', () => {
      render(<WebWorkerManager />);
      
      const firstTab = screen.getByText('Visão Geral');
      firstTab.focus();
      
      // Simular navegação por teclado
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      
      const secondTab = screen.getByText('Workers');
      expect(secondTab).toHaveFocus();
    });

    it('deve ter labels apropriados', () => {
      render(<WebWorkerManager />);
      
      const searchInput = screen.getByPlaceholderText('Buscar...');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar workers, pools ou tasks');
    });

    it('deve ter roles ARIA corretos', () => {
      render(<WebWorkerManager />);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);
    });
  });
});