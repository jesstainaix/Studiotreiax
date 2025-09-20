// Sistema de Análise de Performance e Otimização
import { EventEmitter } from '../utils/EventEmitter';

// Interfaces de métricas
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'cpu' | 'memory' | 'network' | 'storage' | 'gpu' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface SystemHealth {
  overall: number; // 0-100
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  gpu?: {
    usage: number;
    memory: {
      used: number;
      total: number;
    };
    temperature?: number;
  };
  network: {
    latency: number;
    bandwidth: {
      upload: number;
      download: number;
    };
    packetsLost: number;
  };
  storage: {
    used: number;
    total: number;
    readSpeed: number;
    writeSpeed: number;
  };
}

interface PerformanceProfile {
  id: string;
  name: string;
  description: string;
  settings: {
    renderQuality: 'low' | 'medium' | 'high' | 'ultra';
    particleCount: number;
    shaderComplexity: 'simple' | 'medium' | 'complex';
    textureResolution: number;
    antiAliasing: boolean;
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    postProcessing: boolean;
    multiThreading: boolean;
    gpuAcceleration: boolean;
  };
  requirements: {
    minCpuCores: number;
    minRam: number; // GB
    minGpuMemory?: number; // GB
    minStorageSpeed: number; // MB/s
  };
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  action: () => Promise<void>;
  estimatedImprovement: number; // percentage
}

interface BenchmarkResult {
  id: string;
  name: string;
  score: number;
  duration: number;
  timestamp: Date;
  details: {
    renderTime: number;
    frameRate: number;
    memoryUsage: number;
    cpuUsage: number;
    gpuUsage?: number;
  };
  comparison?: {
    baseline: number;
    improvement: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  suggestions: string[];
  acknowledged: boolean;
}

interface ResourceUsage {
  component: string;
  cpu: number;
  memory: number;
  gpu?: number;
  network?: number;
  storage?: number;
  timestamp: Date;
}

interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    averagePerformance: number;
    peakUsage: SystemHealth;
    bottlenecks: string[];
    improvements: string[];
  };
  metrics: PerformanceMetric[];
  benchmarks: BenchmarkResult[];
  alerts: PerformanceAlert[];
  recommendations: OptimizationSuggestion[];
}

// Sistema principal de análise de performance
class PerformanceAnalyzer extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private currentHealth: SystemHealth | null = null;
  private profiles: PerformanceProfile[] = [];
  private activeProfile: PerformanceProfile | null = null;
  private benchmarks: BenchmarkResult[] = [];
  private alerts: PerformanceAlert[] = [];
  private resourceUsage: ResourceUsage[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  // Configurações
  private config = {
    monitoringInterval: 1000, // ms
    metricsRetention: 24 * 60 * 60 * 1000, // 24 horas
    alertThresholds: {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      gpu: { warning: 80, critical: 95 },
      temperature: { warning: 70, critical: 85 }
    }
  };
  
  constructor() {
    super();
    this.initializeProfiles();
  }
  
  // Inicialização
  async initialize(): Promise<void> {
    try {
      // Detectar capacidades do sistema
      await this.detectSystemCapabilities();
      
      // Selecionar perfil adequado
      await this.selectOptimalProfile();
      
      // Iniciar monitoramento
      this.startMonitoring();
    } catch (error) {
      console.error('Erro ao inicializar análise de performance:', error);
      throw error;
    }
  }
  
  private initializeProfiles(): void {
    this.profiles = [
      {
        id: 'performance',
        name: 'Alta Performance',
        description: 'Máxima qualidade visual e performance',
        settings: {
          renderQuality: 'ultra',
          particleCount: 10000,
          shaderComplexity: 'complex',
          textureResolution: 2048,
          antiAliasing: true,
          shadowQuality: 'high',
          postProcessing: true,
          multiThreading: true,
          gpuAcceleration: true
        },
        requirements: {
          minCpuCores: 8,
          minRam: 16,
          minGpuMemory: 8,
          minStorageSpeed: 500
        }
      },
      {
        id: 'balanced',
        name: 'Balanceado',
        description: 'Equilíbrio entre qualidade e performance',
        settings: {
          renderQuality: 'high',
          particleCount: 5000,
          shaderComplexity: 'medium',
          textureResolution: 1024,
          antiAliasing: true,
          shadowQuality: 'medium',
          postProcessing: true,
          multiThreading: true,
          gpuAcceleration: true
        },
        requirements: {
          minCpuCores: 4,
          minRam: 8,
          minGpuMemory: 4,
          minStorageSpeed: 200
        }
      },
      {
        id: 'efficiency',
        name: 'Eficiência',
        description: 'Otimizado para sistemas com recursos limitados',
        settings: {
          renderQuality: 'medium',
          particleCount: 2000,
          shaderComplexity: 'simple',
          textureResolution: 512,
          antiAliasing: false,
          shadowQuality: 'low',
          postProcessing: false,
          multiThreading: true,
          gpuAcceleration: false
        },
        requirements: {
          minCpuCores: 2,
          minRam: 4,
          minStorageSpeed: 100
        }
      },
      {
        id: 'mobile',
        name: 'Mobile/Tablet',
        description: 'Otimizado para dispositivos móveis',
        settings: {
          renderQuality: 'low',
          particleCount: 500,
          shaderComplexity: 'simple',
          textureResolution: 256,
          antiAliasing: false,
          shadowQuality: 'off',
          postProcessing: false,
          multiThreading: false,
          gpuAcceleration: false
        },
        requirements: {
          minCpuCores: 2,
          minRam: 2,
          minStorageSpeed: 50
        }
      }
    ];
  }
  
  private async detectSystemCapabilities(): Promise<void> {
    try {
      // Simular detecção de capacidades do sistema
      // Em implementação real, usaria APIs do navegador ou Node.js
      const capabilities = {
        cpu: {
          cores: navigator.hardwareConcurrency || 4,
          architecture: 'x64'
        },
        memory: {
          // @ts-ignore
          total: (navigator.deviceMemory || 4) * 1024 * 1024 * 1024
        },
        gpu: {
          vendor: 'Unknown',
          model: 'Unknown',
          memory: 2 * 1024 * 1024 * 1024 // 2GB padrão
        },
        storage: {
          type: 'SSD', // Assumir SSD por padrão
          speed: 500 // MB/s
        }
      };
    } catch (error) {
      console.warn('Erro ao detectar capacidades do sistema:', error);
    }
  }
  
  private async selectOptimalProfile(): Promise<void> {
    // Simular seleção de perfil baseado nas capacidades
    const systemScore = this.calculateSystemScore();
    
    if (systemScore >= 80) {
      this.activeProfile = this.profiles.find(p => p.id === 'performance') || null;
    } else if (systemScore >= 60) {
      this.activeProfile = this.profiles.find(p => p.id === 'balanced') || null;
    } else if (systemScore >= 40) {
      this.activeProfile = this.profiles.find(p => p.id === 'efficiency') || null;
    } else {
      this.activeProfile = this.profiles.find(p => p.id === 'mobile') || null;
    }
    
    if (this.activeProfile) {
      this.emit('profileChanged', this.activeProfile);
    }
  }
  
  private calculateSystemScore(): number {
    // Simular cálculo de score do sistema
    const cpuScore = Math.min((navigator.hardwareConcurrency || 4) * 12.5, 100);
    // @ts-ignore
    const memoryScore = Math.min((navigator.deviceMemory || 4) * 12.5, 100);
    const gpuScore = 75; // Assumir GPU média
    
    return (cpuScore + memoryScore + gpuScore) / 3;
  }
  
  // Monitoramento em tempo real
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoringInterval);
  }
  
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  private async collectMetrics(): Promise<void> {
    try {
      const health = await this.getCurrentSystemHealth();
      this.currentHealth = health;
      
      // Adicionar métricas
      this.addMetric({
        id: `cpu_${Date.now()}`,
        name: 'CPU Usage',
        value: health.cpu.usage,
        unit: '%',
        timestamp: new Date(),
        category: 'cpu',
        severity: this.getSeverity('cpu', health.cpu.usage),
        threshold: this.config.alertThresholds.cpu
      });
      
      this.addMetric({
        id: `memory_${Date.now()}`,
        name: 'Memory Usage',
        value: health.memory.percentage,
        unit: '%',
        timestamp: new Date(),
        category: 'memory',
        severity: this.getSeverity('memory', health.memory.percentage),
        threshold: this.config.alertThresholds.memory
      });
      
      if (health.gpu) {
        this.addMetric({
          id: `gpu_${Date.now()}`,
          name: 'GPU Usage',
          value: health.gpu.usage,
          unit: '%',
          timestamp: new Date(),
          category: 'gpu',
          severity: this.getSeverity('gpu', health.gpu.usage),
          threshold: this.config.alertThresholds.gpu
        });
      }
      
      // Verificar alertas
      this.checkAlerts(health);
      
      // Limpar métricas antigas
      this.cleanupOldMetrics();
      
      this.emit('metricsUpdated', health);
    } catch (error) {
      console.error('Erro ao coletar métricas:', error);
    }
  }
  
  private async getCurrentSystemHealth(): Promise<SystemHealth> {
    // Simular coleta de dados do sistema
    // Em implementação real, usaria APIs específicas
    
    const baseUsage = {
      cpu: 20 + Math.random() * 40,
      memory: 30 + Math.random() * 50,
      gpu: 15 + Math.random() * 60
    };
    
    return {
      overall: Math.max(0, 100 - Math.max(baseUsage.cpu, baseUsage.memory, baseUsage.gpu)),
      cpu: {
        usage: baseUsage.cpu,
        cores: navigator.hardwareConcurrency || 4,
        frequency: 2400, // MHz
        temperature: 45 + Math.random() * 30
      },
      memory: {
        // @ts-ignore
        total: (navigator.deviceMemory || 8) * 1024 * 1024 * 1024,
        // @ts-ignore
        used: ((navigator.deviceMemory || 8) * 1024 * 1024 * 1024) * (baseUsage.memory / 100),
        // @ts-ignore
        available: ((navigator.deviceMemory || 8) * 1024 * 1024 * 1024) * (1 - baseUsage.memory / 100),
        percentage: baseUsage.memory
      },
      gpu: {
        usage: baseUsage.gpu,
        memory: {
          used: 2 * 1024 * 1024 * 1024 * (baseUsage.gpu / 100),
          total: 4 * 1024 * 1024 * 1024
        },
        temperature: 50 + Math.random() * 25
      },
      network: {
        latency: 20 + Math.random() * 80,
        bandwidth: {
          upload: 50 + Math.random() * 100,
          download: 100 + Math.random() * 400
        },
        packetsLost: Math.random() * 2
      },
      storage: {
        used: 500 * 1024 * 1024 * 1024,
        total: 1000 * 1024 * 1024 * 1024,
        readSpeed: 400 + Math.random() * 200,
        writeSpeed: 300 + Math.random() * 150
      }
    };
  }
  
  private getSeverity(type: string, value: number): 'low' | 'medium' | 'high' | 'critical' {
    const thresholds = this.config.alertThresholds[type as keyof typeof this.config.alertThresholds];
    if (!thresholds) return 'low';
    
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'high';
    if (value >= thresholds.warning * 0.7) return 'medium';
    return 'low';
  }
  
  private addMetric(metric: PerformanceMetric): void {
    const categoryMetrics = this.metrics.get(metric.category) || [];
    categoryMetrics.push(metric);
    this.metrics.set(metric.category, categoryMetrics);
  }
  
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.metricsRetention);
    
    for (const [category, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(category, filtered);
    }
  }
  
  private checkAlerts(health: SystemHealth): void {
    const alerts: PerformanceAlert[] = [];
    
    // CPU Alert
    if (health.cpu.usage >= this.config.alertThresholds.cpu.critical) {
      alerts.push({
        id: `cpu_critical_${Date.now()}`,
        type: 'critical',
        title: 'CPU Usage Critical',
        message: `CPU usage is at ${health.cpu.usage.toFixed(1)}%, which is above the critical threshold of ${this.config.alertThresholds.cpu.critical}%`,
        timestamp: new Date(),
        metric: 'cpu_usage',
        value: health.cpu.usage,
        threshold: this.config.alertThresholds.cpu.critical,
        suggestions: [
          'Close unnecessary applications',
          'Reduce render quality',
          'Disable complex effects',
          'Switch to efficiency profile'
        ],
        acknowledged: false
      });
    } else if (health.cpu.usage >= this.config.alertThresholds.cpu.warning) {
      alerts.push({
        id: `cpu_warning_${Date.now()}`,
        type: 'warning',
        title: 'High CPU Usage',
        message: `CPU usage is at ${health.cpu.usage.toFixed(1)}%, approaching critical levels`,
        timestamp: new Date(),
        metric: 'cpu_usage',
        value: health.cpu.usage,
        threshold: this.config.alertThresholds.cpu.warning,
        suggestions: [
          'Monitor CPU usage closely',
          'Consider reducing particle count',
          'Optimize shader complexity'
        ],
        acknowledged: false
      });
    }
    
    // Memory Alert
    if (health.memory.percentage >= this.config.alertThresholds.memory.critical) {
      alerts.push({
        id: `memory_critical_${Date.now()}`,
        type: 'critical',
        title: 'Memory Usage Critical',
        message: `Memory usage is at ${health.memory.percentage.toFixed(1)}%, system may become unstable`,
        timestamp: new Date(),
        metric: 'memory_usage',
        value: health.memory.percentage,
        threshold: this.config.alertThresholds.memory.critical,
        suggestions: [
          'Clear browser cache',
          'Close other tabs/applications',
          'Reduce texture resolution',
          'Disable memory-intensive effects'
        ],
        acknowledged: false
      });
    }
    
    // GPU Alert
    if (health.gpu && health.gpu.usage >= this.config.alertThresholds.gpu.critical) {
      alerts.push({
        id: `gpu_critical_${Date.now()}`,
        type: 'critical',
        title: 'GPU Usage Critical',
        message: `GPU usage is at ${health.gpu.usage.toFixed(1)}%, may cause rendering issues`,
        timestamp: new Date(),
        metric: 'gpu_usage',
        value: health.gpu.usage,
        threshold: this.config.alertThresholds.gpu.critical,
        suggestions: [
          'Reduce render quality',
          'Disable anti-aliasing',
          'Lower shader complexity',
          'Reduce particle count'
        ],
        acknowledged: false
      });
    }
    
    // Adicionar novos alertas
    alerts.forEach(alert => {
      this.alerts.unshift(alert);
      this.emit('alert', alert);
    });
    
    // Manter apenas os últimos 100 alertas
    this.alerts = this.alerts.slice(0, 100);
  }
  
  // Benchmarks
  async runBenchmark(name: string, testFunction: () => Promise<any>): Promise<BenchmarkResult> {
    const startTime = performance.now();
    const startHealth = await this.getCurrentSystemHealth();
    
    try {
      await testFunction();
      
      const endTime = performance.now();
      const endHealth = await this.getCurrentSystemHealth();
      const duration = endTime - startTime;
      
      const result: BenchmarkResult = {
        id: `benchmark_${Date.now()}`,
        name,
        score: Math.max(0, 100 - (duration / 1000) * 10), // Score baseado na duração
        duration,
        timestamp: new Date(),
        details: {
          renderTime: duration,
          frameRate: 1000 / (duration / 60), // FPS estimado
          memoryUsage: endHealth.memory.percentage,
          cpuUsage: endHealth.cpu.usage,
          gpuUsage: endHealth.gpu?.usage
        }
      };
      
      // Comparar com baseline se existir
      const baseline = this.benchmarks.find(b => b.name === name);
      if (baseline) {
        result.comparison = {
          baseline: baseline.score,
          improvement: ((result.score - baseline.score) / baseline.score) * 100
        };
      }
      
      this.benchmarks.unshift(result);
      this.benchmarks = this.benchmarks.slice(0, 50); // Manter últimos 50
      
      this.emit('benchmarkCompleted', result);
      return result;
    } catch (error) {
      console.error('Erro durante benchmark:', error);
      throw error;
    }
  }
  
  // Otimizações
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    if (!this.currentHealth) return suggestions;
    
    // Sugestões baseadas no uso de CPU
    if (this.currentHealth.cpu.usage > 70) {
      suggestions.push({
        id: 'reduce_particles',
        title: 'Reduzir Contagem de Partículas',
        description: 'Diminuir o número de partículas para reduzir carga da CPU',
        impact: 'high',
        difficulty: 'easy',
        category: 'Performance',
        action: async () => {
          // Implementar redução de partículas
        },
        estimatedImprovement: 15
      });
      
      suggestions.push({
        id: 'optimize_shaders',
        title: 'Otimizar Shaders',
        description: 'Simplificar shaders complexos para melhor performance',
        impact: 'medium',
        difficulty: 'medium',
        category: 'Rendering',
        action: async () => {
        },
        estimatedImprovement: 10
      });
    }
    
    // Sugestões baseadas no uso de memória
    if (this.currentHealth.memory.percentage > 80) {
      suggestions.push({
        id: 'reduce_textures',
        title: 'Reduzir Resolução de Texturas',
        description: 'Diminuir resolução de texturas para economizar memória',
        impact: 'high',
        difficulty: 'easy',
        category: 'Memory',
        action: async () => {
        },
        estimatedImprovement: 20
      });
      
      suggestions.push({
        id: 'clear_cache',
        title: 'Limpar Cache',
        description: 'Limpar cache de assets não utilizados',
        impact: 'medium',
        difficulty: 'easy',
        category: 'Memory',
        action: async () => {
        },
        estimatedImprovement: 8
      });
    }
    
    // Sugestões baseadas no uso de GPU
    if (this.currentHealth.gpu && this.currentHealth.gpu.usage > 80) {
      suggestions.push({
        id: 'disable_antialiasing',
        title: 'Desabilitar Anti-aliasing',
        description: 'Desativar anti-aliasing para reduzir carga da GPU',
        impact: 'medium',
        difficulty: 'easy',
        category: 'Rendering',
        action: async () => {
        },
        estimatedImprovement: 12
      });
      
      suggestions.push({
        id: 'reduce_shadows',
        title: 'Reduzir Qualidade das Sombras',
        description: 'Diminuir qualidade das sombras para melhor performance',
        impact: 'medium',
        difficulty: 'easy',
        category: 'Rendering',
        action: async () => {
        },
        estimatedImprovement: 10
      });
    }
    
    return suggestions.sort((a, b) => {
      const impactWeight = { low: 1, medium: 2, high: 3 };
      const difficultyWeight = { easy: 3, medium: 2, hard: 1 };
      
      const scoreA = impactWeight[a.impact] * difficultyWeight[a.difficulty];
      const scoreB = impactWeight[b.impact] * difficultyWeight[b.difficulty];
      
      return scoreB - scoreA;
    });
  }
  
  async applyOptimization(suggestionId: string): Promise<void> {
    const suggestion = this.getOptimizationSuggestions().find(s => s.id === suggestionId);
    if (!suggestion) {
      throw new Error(`Otimização ${suggestionId} não encontrada`);
    }
    
    try {
      await suggestion.action();
      this.emit('optimizationApplied', suggestion);
    } catch (error) {
      console.error('Erro ao aplicar otimização:', error);
      throw error;
    }
  }
  
  // Relatórios
  generateReport(period: { start: Date; end: Date }): PerformanceReport {
    const metricsInPeriod: PerformanceMetric[] = [];
    
    for (const categoryMetrics of this.metrics.values()) {
      metricsInPeriod.push(
        ...categoryMetrics.filter(
          m => m.timestamp >= period.start && m.timestamp <= period.end
        )
      );
    }
    
    const benchmarksInPeriod = this.benchmarks.filter(
      b => b.timestamp >= period.start && b.timestamp <= period.end
    );
    
    const alertsInPeriod = this.alerts.filter(
      a => a.timestamp >= period.start && a.timestamp <= period.end
    );
    
    // Calcular métricas de resumo
    const cpuMetrics = metricsInPeriod.filter(m => m.category === 'cpu');
    const memoryMetrics = metricsInPeriod.filter(m => m.category === 'memory');
    const gpuMetrics = metricsInPeriod.filter(m => m.category === 'gpu');
    
    const averagePerformance = this.currentHealth ? this.currentHealth.overall : 0;
    
    const peakUsage: SystemHealth = {
      overall: Math.max(...metricsInPeriod.map(m => m.value)),
      cpu: {
        usage: Math.max(...cpuMetrics.map(m => m.value)),
        cores: this.currentHealth?.cpu.cores || 4,
        frequency: this.currentHealth?.cpu.frequency || 2400
      },
      memory: {
        used: Math.max(...memoryMetrics.map(m => m.value)) * 1024 * 1024 * 1024,
        total: this.currentHealth?.memory.total || 8 * 1024 * 1024 * 1024,
        available: 0,
        percentage: Math.max(...memoryMetrics.map(m => m.value))
      },
      gpu: this.currentHealth?.gpu ? {
        usage: Math.max(...gpuMetrics.map(m => m.value)),
        memory: this.currentHealth.gpu.memory
      } : undefined,
      network: this.currentHealth?.network || {
        latency: 0,
        bandwidth: { upload: 0, download: 0 },
        packetsLost: 0
      },
      storage: this.currentHealth?.storage || {
        used: 0,
        total: 0,
        readSpeed: 0,
        writeSpeed: 0
      }
    };
    
    return {
      id: `report_${Date.now()}`,
      period,
      summary: {
        averagePerformance,
        peakUsage,
        bottlenecks: this.identifyBottlenecks(metricsInPeriod),
        improvements: this.identifyImprovements(benchmarksInPeriod)
      },
      metrics: metricsInPeriod,
      benchmarks: benchmarksInPeriod,
      alerts: alertsInPeriod,
      recommendations: this.getOptimizationSuggestions()
    };
  }
  
  private identifyBottlenecks(metrics: PerformanceMetric[]): string[] {
    const bottlenecks: string[] = [];
    
    const cpuMetrics = metrics.filter(m => m.category === 'cpu');
    const memoryMetrics = metrics.filter(m => m.category === 'memory');
    const gpuMetrics = metrics.filter(m => m.category === 'gpu');
    
    if (cpuMetrics.some(m => m.value > 80)) {
      bottlenecks.push('CPU Usage');
    }
    
    if (memoryMetrics.some(m => m.value > 85)) {
      bottlenecks.push('Memory Usage');
    }
    
    if (gpuMetrics.some(m => m.value > 85)) {
      bottlenecks.push('GPU Usage');
    }
    
    return bottlenecks;
  }
  
  private identifyImprovements(benchmarks: BenchmarkResult[]): string[] {
    const improvements: string[] = [];
    
    benchmarks.forEach(benchmark => {
      if (benchmark.comparison && benchmark.comparison.improvement > 5) {
        improvements.push(`${benchmark.name}: +${benchmark.comparison.improvement.toFixed(1)}%`);
      }
    });
    
    return improvements;
  }
  
  // Getters
  getCurrentHealth(): SystemHealth | null {
    return this.currentHealth;
  }
  
  getProfiles(): PerformanceProfile[] {
    return this.profiles;
  }
  
  getActiveProfile(): PerformanceProfile | null {
    return this.activeProfile;
  }
  
  setActiveProfile(profileId: string): void {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      this.activeProfile = profile;
      this.emit('profileChanged', profile);
    }
  }
  
  getMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return this.metrics.get(category) || [];
    }
    
    const allMetrics: PerformanceMetric[] = [];
    for (const categoryMetrics of this.metrics.values()) {
      allMetrics.push(...categoryMetrics);
    }
    
    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  getBenchmarks(): BenchmarkResult[] {
    return this.benchmarks;
  }
  
  getAlerts(): PerformanceAlert[] {
    return this.alerts;
  }
  
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
    }
  }
  
  clearAlerts(): void {
    this.alerts = [];
    this.emit('alertsCleared');
  }
  
  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    this.metrics.clear();
    this.benchmarks = [];
    this.alerts = [];
    this.resourceUsage = [];
    this.removeAllListeners();
  }
}

export default PerformanceAnalyzer;
export type {
  PerformanceMetric,
  SystemHealth,
  PerformanceProfile,
  OptimizationSuggestion,
  BenchmarkResult,
  PerformanceAlert,
  ResourceUsage,
  PerformanceReport
};