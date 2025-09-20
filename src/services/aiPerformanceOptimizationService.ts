import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useState, useEffect } from 'react';

// Interfaces
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  size: number; // Tamanho em bytes
  accessCount: number;
  lastAccessed: number;
}

export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  queueLength: number;
  activeWorkers: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number; // Operações por segundo
}

export interface WorkerTask {
  id: string;
  type: 'transcription' | 'analysis' | 'highlight' | 'categorization' | 'thumbnail';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  onProgress?: (progress: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface OptimizationSettings {
  maxCacheSize: number; // Em MB
  defaultTTL: number; // Em milissegundos
  maxWorkers: number;
  batchSize: number;
  enablePreloading: boolean;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  memoryThreshold: number; // Porcentagem
  autoCleanup: boolean;
  cleanupInterval: number; // Em milissegundos
  priorityWeights: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface PreloadRule {
  id: string;
  name: string;
  condition: (context: any) => boolean;
  action: () => Promise<void>;
  priority: number;
  enabled: boolean;
}

// Store
interface AIPerformanceOptimizationStore {
  // Estado
  cache: Map<string, CacheEntry>;
  taskQueue: WorkerTask[];
  activeWorkers: Map<string, WorkerTask>;
  metrics: PerformanceMetrics;
  settings: OptimizationSettings;
  preloadRules: PreloadRule[];
  isOptimizing: boolean;
  
  // Cache
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  deleteCache: (key: string) => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; entries: number; hitRate: number };
  
  // Task Queue
  addTask: (task: Omit<WorkerTask, 'id' | 'createdAt' | 'retryCount'>) => string;
  processQueue: () => Promise<void>;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  
  // Performance
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  getPerformanceReport: () => any;
  optimizePerformance: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<OptimizationSettings>) => void;
  
  // Preloading
  addPreloadRule: (rule: PreloadRule) => void;
  removePreloadRule: (ruleId: string) => void;
  executePreloading: (context: any) => Promise<void>;
  
  // Cleanup
  cleanup: () => void;
  scheduleCleanup: () => void;
}

// Configurações padrão
const defaultSettings: OptimizationSettings = {
  maxCacheSize: 100, // 100MB
  defaultTTL: 30 * 60 * 1000, // 30 minutos
  maxWorkers: 4,
  batchSize: 5,
  enablePreloading: true,
  enableCompression: true,
  enableLazyLoading: true,
  memoryThreshold: 80, // 80%
  autoCleanup: true,
  cleanupInterval: 5 * 60 * 1000, // 5 minutos
  priorityWeights: {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  }
};

// Métricas iniciais
const initialMetrics: PerformanceMetrics = {
  processingTime: 0,
  memoryUsage: 0,
  cacheHitRate: 0,
  queueLength: 0,
  activeWorkers: 0,
  averageResponseTime: 0,
  errorRate: 0,
  throughput: 0
};

// Funções utilitárias
const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateCacheSize = (data: any): number => {
  // Estimativa simples do tamanho em bytes
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size;
};

const compressData = async (data: any): Promise<string> => {
  // Simulação de compressão
  const jsonString = JSON.stringify(data);
  // Em uma implementação real, usaria uma biblioteca de compressão
  return btoa(jsonString);
};

const decompressData = async (compressedData: string): Promise<any> => {
  // Simulação de descompressão
  try {
    const jsonString = atob(compressedData);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Erro ao descomprimir dados');
  }
};

const getMemoryUsage = (): number => {
  // Simulação de uso de memória
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  }
  return Math.random() * 100; // Fallback
};

const priorityToWeight = (priority: string, weights: any): number => {
  return weights[priority] || 1;
};

// Worker simulado
class AIWorker {
  private id: string;
  private isActive: boolean = false;
  
  constructor(id: string) {
    this.id = id;
  }
  
  async processTask(task: WorkerTask): Promise<any> {
    this.isActive = true;
    
    try {
      // Simular processamento baseado no tipo de task
      const processingTime = this.getProcessingTime(task.type);
      
      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, processingTime / 10));
        task.onProgress?.(i);
      }
      
      // Simular resultado baseado no tipo
      const result = this.generateResult(task.type, task.data);
      
      task.onComplete?.(result);
      return result;
    } catch (error) {
      task.onError?.(error as Error);
      throw error;
    } finally {
      this.isActive = false;
    }
  }
  
  private getProcessingTime(type: string): number {
    const times = {
      transcription: 2000,
      analysis: 1500,
      highlight: 1000,
      categorization: 800,
      thumbnail: 1200
    };
    return times[type as keyof typeof times] || 1000;
  }
  
  private generateResult(type: string, data: any): any {
    // Simular resultados diferentes para cada tipo
    switch (type) {
      case 'transcription':
        return {
          text: 'Transcrição simulada do áudio...',
          confidence: 0.95,
          segments: []
        };
      case 'analysis':
        return {
          scenes: [],
          emotions: [],
          topics: []
        };
      case 'highlight':
        return {
          highlights: [],
          confidence: 0.88
        };
      case 'categorization':
        return {
          categories: ['tutorial', 'educational'],
          tags: ['ai', 'technology']
        };
      case 'thumbnail':
        return {
          url: 'https://example.com/thumbnail.jpg',
          confidence: 0.92
        };
      default:
        return { processed: true };
    }
  }
  
  get active(): boolean {
    return this.isActive;
  }
}

// Store principal
export const useAIPerformanceOptimization = create<AIPerformanceOptimizationStore>()(devtools(
  (set, get) => {
    // Criar workers
    const workers = new Map<string, AIWorker>();
    for (let i = 0; i < defaultSettings.maxWorkers; i++) {
      workers.set(`worker_${i}`, new AIWorker(`worker_${i}`));
    }
    
    // Cleanup interval
    let cleanupInterval: NodeJS.Timeout | null = null;
    
    return {
      // Estado inicial
      cache: new Map(),
      taskQueue: [],
      activeWorkers: new Map(),
      metrics: initialMetrics,
      settings: defaultSettings,
      preloadRules: [],
      isOptimizing: false,
      
      // Cache
      setCache: <T>(key: string, data: T, ttl?: number) => {
        const { cache, settings } = get();
        const entry: CacheEntry<T> = {
          key,
          data,
          timestamp: Date.now(),
          ttl: ttl || settings.defaultTTL,
          size: calculateCacheSize(data),
          accessCount: 0,
          lastAccessed: Date.now()
        };
        
        // Verificar limite de cache
        const currentSize = Array.from(cache.values())
          .reduce((total, entry) => total + entry.size, 0);
        
        if (currentSize + entry.size > settings.maxCacheSize * 1024 * 1024) {
          // Remover entradas antigas
          const sortedEntries = Array.from(cache.entries())
            .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
          
          for (const [key] of sortedEntries) {
            cache.delete(key);
            const newSize = Array.from(cache.values())
              .reduce((total, entry) => total + entry.size, 0);
            
            if (newSize + entry.size <= settings.maxCacheSize * 1024 * 1024) {
              break;
            }
          }
        }
        
        cache.set(key, entry);
        set({ cache: new Map(cache) });
      },
      
      getCache: <T>(key: string): T | null => {
        const { cache } = get();
        const entry = cache.get(key) as CacheEntry<T> | undefined;
        
        if (!entry) {
          return null;
        }
        
        // Verificar TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
          cache.delete(key);
          set({ cache: new Map(cache) });
          return null;
        }
        
        // Atualizar estatísticas de acesso
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        
        return entry.data;
      },
      
      deleteCache: (key: string) => {
        const { cache } = get();
        cache.delete(key);
        set({ cache: new Map(cache) });
      },
      
      clearCache: () => {
        set({ cache: new Map() });
      },
      
      getCacheStats: () => {
        const { cache } = get();
        const entries = Array.from(cache.values());
        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
        const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
        const hits = entries.filter(entry => entry.accessCount > 0).length;
        
        return {
          size: totalSize,
          entries: entries.length,
          hitRate: entries.length > 0 ? (hits / entries.length) * 100 : 0
        };
      },
      
      // Task Queue
      addTask: (taskData) => {
        const task: WorkerTask = {
          ...taskData,
          id: generateTaskId(),
          createdAt: Date.now(),
          retryCount: 0
        };
        
        set(state => ({
          taskQueue: [...state.taskQueue, task].sort((a, b) => {
            const weightA = priorityToWeight(a.priority, state.settings.priorityWeights);
            const weightB = priorityToWeight(b.priority, state.settings.priorityWeights);
            return weightB - weightA;
          })
        }));
        
        // Processar fila automaticamente
        setTimeout(() => get().processQueue(), 0);
        
        return task.id;
      },
      
      processQueue: async () => {
        const { taskQueue, activeWorkers, settings } = get();
        
        // Encontrar workers disponíveis
        const availableWorkers = Array.from(workers.entries())
          .filter(([, worker]) => !worker.active)
          .slice(0, settings.maxWorkers - activeWorkers.size);
        
        if (availableWorkers.length === 0 || taskQueue.length === 0) {
          return;
        }
        
        // Processar tasks em lote
        const tasksToProcess = taskQueue.slice(0, Math.min(
          availableWorkers.length,
          settings.batchSize
        ));
        
        for (let i = 0; i < tasksToProcess.length; i++) {
          const task = tasksToProcess[i];
          const [workerId, worker] = availableWorkers[i];
          
          // Remover task da fila
          set(state => ({
            taskQueue: state.taskQueue.filter(t => t.id !== task.id),
            activeWorkers: new Map(state.activeWorkers.set(workerId, task))
          }));
          
          // Processar task
          task.startedAt = Date.now();
          
          worker.processTask(task)
            .then(result => {
              task.completedAt = Date.now();
              
              // Remover worker ativo
              set(state => {
                const newActiveWorkers = new Map(state.activeWorkers);
                newActiveWorkers.delete(workerId);
                return { activeWorkers: newActiveWorkers };
              });
              
              // Continuar processando fila
              get().processQueue();
            })
            .catch(error => {
              console.error('Erro ao processar task:', error);
              
              // Retry logic
              if (task.retryCount < task.maxRetries) {
                task.retryCount++;
                set(state => ({
                  taskQueue: [task, ...state.taskQueue]
                }));
              }
              
              // Remover worker ativo
              set(state => {
                const newActiveWorkers = new Map(state.activeWorkers);
                newActiveWorkers.delete(workerId);
                return { activeWorkers: newActiveWorkers };
              });
              
              // Continuar processando fila
              get().processQueue();
            });
        }
      },
      
      cancelTask: (taskId: string) => {
        set(state => ({
          taskQueue: state.taskQueue.filter(task => task.id !== taskId)
        }));
      },
      
      retryTask: (taskId: string) => {
        const { taskQueue } = get();
        const task = taskQueue.find(t => t.id === taskId);
        
        if (task && task.retryCount < task.maxRetries) {
          task.retryCount++;
          get().processQueue();
        }
      },
      
      // Performance
      updateMetrics: (newMetrics) => {
        set(state => ({
          metrics: { ...state.metrics, ...newMetrics }
        }));
      },
      
      getPerformanceReport: () => {
        const { metrics, cache, taskQueue, activeWorkers } = get();
        const cacheStats = get().getCacheStats();
        
        return {
          timestamp: Date.now(),
          metrics: {
            ...metrics,
            memoryUsage: getMemoryUsage(),
            queueLength: taskQueue.length,
            activeWorkers: activeWorkers.size,
            cacheHitRate: cacheStats.hitRate
          },
          cache: {
            entries: cacheStats.entries,
            size: `${(cacheStats.size / 1024 / 1024).toFixed(2)} MB`,
            hitRate: `${cacheStats.hitRate.toFixed(1)}%`
          },
          queue: {
            pending: taskQueue.length,
            active: activeWorkers.size,
            byPriority: taskQueue.reduce((acc, task) => {
              acc[task.priority] = (acc[task.priority] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        };
      },
      
      optimizePerformance: async () => {
        set({ isOptimizing: true });
        
        try {
          const { cache, settings } = get();
          
          // Limpar cache expirado
          const now = Date.now();
          const expiredKeys: string[] = [];
          
          cache.forEach((entry, key) => {
            if (now - entry.timestamp > entry.ttl) {
              expiredKeys.push(key);
            }
          });
          
          expiredKeys.forEach(key => cache.delete(key));
          
          // Verificar uso de memória
          const memoryUsage = getMemoryUsage();
          if (memoryUsage > settings.memoryThreshold) {
            // Limpar cache menos usado
            const entries = Array.from(cache.entries())
              .sort(([, a], [, b]) => a.accessCount - b.accessCount);
            
            const toRemove = Math.ceil(entries.length * 0.2); // Remover 20%
            for (let i = 0; i < toRemove; i++) {
              cache.delete(entries[i][0]);
            }
          }
          
          set({ cache: new Map(cache) });
          
          // Atualizar métricas
          get().updateMetrics({
            memoryUsage,
            cacheHitRate: get().getCacheStats().hitRate
          });
          
        } finally {
          set({ isOptimizing: false });
        }
      },
      
      // Settings
      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }));
        
        // Reagendar cleanup se necessário
        if (newSettings.cleanupInterval || newSettings.autoCleanup !== undefined) {
          get().scheduleCleanup();
        }
      },
      
      // Preloading
      addPreloadRule: (rule) => {
        set(state => ({
          preloadRules: [...state.preloadRules, rule]
        }));
      },
      
      removePreloadRule: (ruleId) => {
        set(state => ({
          preloadRules: state.preloadRules.filter(rule => rule.id !== ruleId)
        }));
      },
      
      executePreloading: async (context) => {
        const { preloadRules, settings } = get();
        
        if (!settings.enablePreloading) return;
        
        const applicableRules = preloadRules
          .filter(rule => rule.enabled && rule.condition(context))
          .sort((a, b) => b.priority - a.priority);
        
        for (const rule of applicableRules) {
          try {
            await rule.action();
          } catch (error) {
            console.error(`Erro ao executar regra de preload ${rule.name}:`, error);
          }
        }
      },
      
      // Cleanup
      cleanup: () => {
        const { cache, settings } = get();
        const now = Date.now();
        
        // Remover entradas expiradas
        const expiredKeys: string[] = [];
        cache.forEach((entry, key) => {
          if (now - entry.timestamp > entry.ttl) {
            expiredKeys.push(key);
          }
        });
        
        expiredKeys.forEach(key => cache.delete(key));
        
        set({ cache: new Map(cache) });
      },
      
      scheduleCleanup: () => {
        const { settings } = get();
        
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
        }
        
        if (settings.autoCleanup) {
          cleanupInterval = setInterval(() => {
            get().cleanup();
          }, settings.cleanupInterval);
        }
      }
    };
  },
  { name: 'ai-performance-optimization' }
));

// Hook para monitoramento de performance
export const usePerformanceMonitor = () => {
  const { metrics, getPerformanceReport } = useAIPerformanceOptimization();
  
  const [report, setReport] = useState<any>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setReport(getPerformanceReport());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getPerformanceReport]);
  
  return {
    metrics,
    report,
    isHealthy: metrics.memoryUsage < 80 && metrics.errorRate < 5
  };
};

// Hook para cache inteligente
export const useSmartCache = <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
  const { getCache, setCache } = useAIPerformanceOptimization();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      // Tentar cache primeiro
      const cached = getCache<T>(key);
      if (cached) {
        setData(cached);
        return;
      }
      
      // Buscar dados
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetcher();
        setCache(key, result, ttl);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [key, fetcher, ttl, getCache, setCache]);
  
  return { data, loading, error };
};

export default useAIPerformanceOptimization;

// Inicializar cleanup automático
if (typeof window !== 'undefined') {
  const store = useAIPerformanceOptimization.getState();
  store.scheduleCleanup();
}