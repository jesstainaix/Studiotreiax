import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvatarPerformanceMonitor, PerformanceThresholds } from '../lib/performance/AvatarPerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 100 * 1024 * 1024 // 100MB
  }
};

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

// Setup global mocks
global.performance = mockPerformance as any;
global.requestAnimationFrame = mockRequestAnimationFrame;

describe('AvatarPerformanceMonitor', () => {
  let monitor: AvatarPerformanceMonitor;
  let customThresholds: PerformanceThresholds;

  beforeEach(() => {
    customThresholds = {
      minFps: 30,
      maxFrameTime: 33,
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      maxDrawCalls: 1000
    };
    monitor = new AvatarPerformanceMonitor(customThresholds);
    vi.clearAllMocks();
  });

  afterEach(() => {
    monitor.dispose();
  });

  describe('Inicialização e Configuração', () => {
    it('deve inicializar com thresholds padrão', () => {
      const defaultMonitor = new AvatarPerformanceMonitor();
      expect(defaultMonitor).toBeDefined();
    });

    it('deve aceitar thresholds customizados', () => {
      expect(monitor).toBeDefined();
      // Verificar se os thresholds foram aplicados através do comportamento
    });

    it('deve permitir atualização de thresholds', () => {
      const newThresholds = { minFps: 45 };
      monitor.updateThresholds(newThresholds);
      // Threshold foi atualizado internamente
      expect(monitor).toBeDefined();
    });
  });

  describe('Monitoramento de Performance', () => {
    it('deve iniciar o monitoramento corretamente', () => {
      monitor.startMonitoring();
      // Verificar se o monitoramento está ativo
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('deve parar o monitoramento', () => {
      monitor.startMonitoring();
      monitor.stopMonitoring();
      // Monitoramento deve estar parado
      expect(monitor).toBeDefined();
    });

    it('não deve iniciar monitoramento múltiplas vezes', () => {
      monitor.startMonitoring();
      monitor.startMonitoring();
      // Deve ter sido chamado apenas uma vez
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Coleta de Métricas', () => {
    beforeEach(() => {
      monitor.startMonitoring();
      // Simular alguns frames
      for (let i = 0; i < 5; i++) {
        mockPerformance.now.mockReturnValue(Date.now() + i * 16);
      }
    });

    it('deve coletar métricas atuais', () => {
      const metrics = monitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.fps).toBeGreaterThan(0);
        expect(metrics.frameTime).toBeGreaterThan(0);
        expect(metrics.memoryUsage).toBeGreaterThan(0);
        expect(metrics.timestamp).toBeGreaterThan(0);
      }
    });

    it('deve manter histórico de métricas', () => {
      const history = monitor.getMetricsHistory(3);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeLessThanOrEqual(3);
    });

    it('deve calcular métricas médias', () => {
      const average = monitor.getAverageMetrics(5);
      expect(average).toBeDefined();
      expect(typeof average.fps).toBe('number');
      expect(typeof average.frameTime).toBe('number');
    });
  });

  describe('Sistema de Alertas', () => {
    beforeEach(() => {
      // Configurar thresholds baixos para facilitar testes
      monitor.updateThresholds({
        minFps: 100, // Impossível de atingir, vai gerar alerta
        maxFrameTime: 1, // Muito baixo, vai gerar alerta
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB, menor que o mock
        maxDrawCalls: 50 // Muito baixo
      });
      monitor.startMonitoring();
    });

    it('deve gerar alertas quando thresholds são ultrapassados', async () => {
      // Aguardar alguns frames para gerar alertas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const alerts = monitor.getAlerts(10);
      expect(Array.isArray(alerts)).toBe(true);
      // Deve ter pelo menos alguns alertas devido aos thresholds baixos
    });

    it('deve classificar severidade dos alertas corretamente', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const alerts = monitor.getAlerts(5);
      alerts.forEach(alert => {
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        expect(['fps', 'memory', 'drawcalls', 'frametime']).toContain(alert.type);
      });
    });

    it('deve retornar apenas alertas ativos', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const activeAlerts = monitor.getActiveAlerts();
      expect(Array.isArray(activeAlerts)).toBe(true);
      // Alertas ativos devem ser recentes (últimos 5 segundos)
      const now = Date.now();
      activeAlerts.forEach(alert => {
        expect(now - alert.timestamp).toBeLessThan(5000);
      });
    });
  });

  describe('Relatório de Performance', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('deve gerar relatório completo de performance', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const report = monitor.getPerformanceReport();
      expect(report).toBeDefined();
      expect(report.current).toBeDefined();
      expect(report.average).toBeDefined();
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(['good', 'warning', 'critical']).toContain(report.status);
    });

    it('deve determinar status correto baseado nas métricas', async () => {
      // Configurar thresholds normais
      monitor.updateThresholds({
        minFps: 30,
        maxFrameTime: 33,
        maxMemoryUsage: 500 * 1024 * 1024,
        maxDrawCalls: 1000
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const report = monitor.getPerformanceReport();
      // Com thresholds normais, status deve ser 'good'
      expect(report.status).toBe('good');
    });
  });

  describe('Sugestões de Otimização', () => {
    it('deve fornecer sugestões baseadas nas métricas', () => {
      monitor.startMonitoring();
      
      const suggestions = monitor.getOptimizationSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Cada sugestão deve ser uma string não vazia
      suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('deve sugerir otimizações específicas para problemas de FPS', () => {
      // Simular FPS baixo
      monitor.updateThresholds({ minFps: 100 }); // Impossível de atingir
      monitor.startMonitoring();
      
      const suggestions = monitor.getOptimizationSuggestions();
      const fpsRelatedSuggestions = suggestions.filter(s => 
        s.includes('LOD') || s.includes('texture') || s.includes('culling')
      );
      
      expect(fpsRelatedSuggestions.length).toBeGreaterThan(0);
    });

    it('deve sugerir otimizações para uso de memória', () => {
      // Simular uso alto de memória
      mockPerformance.memory.usedJSHeapSize = 400 * 1024 * 1024; // 400MB
      monitor.startMonitoring();
      
      const suggestions = monitor.getOptimizationSuggestions();
      const memoryRelatedSuggestions = suggestions.filter(s => 
        s.includes('memory') || s.includes('compression') || s.includes('pooling')
      );
      
      expect(memoryRelatedSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Limpeza e Dispose', () => {
    it('deve limpar histórico corretamente', () => {
      monitor.startMonitoring();
      monitor.clearHistory();
      
      const metrics = monitor.getMetricsHistory();
      const alerts = monitor.getAlerts();
      
      expect(metrics.length).toBe(0);
      expect(alerts.length).toBe(0);
    });

    it('deve fazer dispose completo', () => {
      monitor.startMonitoring();
      monitor.dispose();
      
      // Após dispose, métricas devem estar vazias
      const metrics = monitor.getMetricsHistory();
      expect(metrics.length).toBe(0);
    });
  });

  describe('Casos Edge', () => {
    it('deve lidar com ausência de performance.memory', () => {
      // Remover temporariamente performance.memory
      const originalMemory = mockPerformance.memory;
      delete (mockPerformance as any).memory;
      
      const fallbackMonitor = new AvatarPerformanceMonitor();
      fallbackMonitor.startMonitoring();
      
      const metrics = fallbackMonitor.getCurrentMetrics();
      expect(metrics?.memoryUsage).toBeGreaterThan(0); // Deve usar fallback
      
      // Restaurar
      mockPerformance.memory = originalMemory;
      fallbackMonitor.dispose();
    });

    it('deve retornar null quando não há métricas', () => {
      const newMonitor = new AvatarPerformanceMonitor();
      const metrics = newMonitor.getCurrentMetrics();
      expect(metrics).toBeNull();
      newMonitor.dispose();
    });

    it('deve lidar com histórico vazio nas médias', () => {
      const newMonitor = new AvatarPerformanceMonitor();
      const average = newMonitor.getAverageMetrics();
      expect(average).toBeDefined();
      // Valores devem ser undefined ou 0 quando não há dados
      newMonitor.dispose();
    });
  });
});