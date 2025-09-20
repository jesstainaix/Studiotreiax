// Sistema de Integração Central - Conecta todos os sistemas implementados
import { EventEmitter } from '../utils/EventEmitter';
import AdvancedVFXEngine from './AdvancedVFXEngine';
import ShaderSystem from './ShaderSystem';
import CompositingEngine from './CompositingEngine';
import VideoRenderer from './VideoRenderer';
import CloudRenderingSystem from './CloudRenderingSystem';
import Avatar3DSystem from './Avatar3DSystem';
import NRTemplateSystem from './NRTemplateSystem';
import PPTXAnalysisSystem from './PPTXAnalysisSystem';
import TTSSystem from './TTSSystem';
import PerformanceAnalyzer from './PerformanceAnalyzer';

// Interfaces
export interface SystemStatus {
  id: string;
  name: string;
  status: 'initializing' | 'ready' | 'busy' | 'error' | 'offline' | 'pending';
  health: number; // 0-100
  lastUpdate: Date;
  metrics?: {
    cpu: number;
    memory: number;
    operations: number;
  };
  dependencies: string[];
  capabilities: string[];
}

export interface IntegrationConfig {
  enabledSystems: string[];
  autoStart: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
  performance: {
    enableMonitoring: boolean;
    alertThresholds: {
      cpu: number;
      memory: number;
      responseTime: number;
    };
  };
  cloud: {
    enableDistributedRendering: boolean;
    maxNodes: number;
    loadBalancing: boolean;
  };
  ai: {
    enableSmartOptimization: boolean;
    learningMode: boolean;
    adaptivePerformance: boolean;
  };
}

export interface SystemMessage {
  id: string;
  from: string;
  to: string;
  type: 'command' | 'data' | 'event' | 'response';
  payload: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowStep {
  id: string;
  name: string;
  system: string;
  action: string;
  params: any;
  dependencies: string[];
  timeout: number;
  retries: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  results: Map<string, any>;
}

export interface ProjectData {
  id: string;
  name: string;
  type: 'video' | 'presentation' | 'training' | 'avatar' | 'template';
  metadata: {
    duration?: number;
    resolution?: { width: number; height: number };
    frameRate?: number;
    quality?: string;
    tags: string[];
    created: Date;
    modified: Date;
  };
  assets: {
    videos: string[];
    images: string[];
    audio: string[];
    models: string[];
    textures: string[];
  };
  timeline: {
    tracks: any[];
    effects: any[];
    transitions: any[];
  };
  settings: any;
}

export interface RenderJob {
  id: string;
  projectId: string;
  type: 'preview' | 'export' | 'cloud';
  priority: number;
  settings: {
    quality: string;
    format: string;
    resolution: { width: number; height: number };
    frameRate: number;
    codec: string;
  };
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  estimatedTime?: number;
  actualTime?: number;
  outputPath?: string;
  error?: string;
}

export interface AnalyticsData {
  systemUsage: Map<string, number>;
  performanceMetrics: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  userActivity: {
    projectsCreated: number;
    rendersCompleted: number;
    featuresUsed: string[];
    timeSpent: number;
  };
  resourceUtilization: {
    cpu: number;
    memory: number;
    gpu: number;
    storage: number;
    network: number;
  };
}

// Sistema de Integração Principal (Singleton)
class SystemIntegration extends EventEmitter {
  private static instance: SystemIntegration | null = null;
  private systems: Map<string, any> = new Map();
  private systemStatus: Map<string, SystemStatus> = new Map();
  private config: IntegrationConfig;
  private messageQueue: SystemMessage[] = [];
  private workflows: Map<string, Workflow> = new Map();
  private projects: Map<string, ProjectData> = new Map();
  private renderQueue: RenderJob[] = [];
  private analytics: AnalyticsData;
  private healthCheckTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private isShuttingDown = false;

  private constructor(config: Partial<IntegrationConfig> = {}) {
    super();
    
    if (SystemIntegration.instance) {
      console.warn('⚠️ SystemIntegration já foi inicializado. Retornando instância existente.');
      return SystemIntegration.instance;
    }
    
    this.config = {
      enabledSystems: [
        'vfx', 'shader', 'compositing', 'video', 'cloud',
        'avatar', 'templates', 'pptx', 'tts', 'performance'
      ],
      autoStart: true,
      healthCheckInterval: 5000,
      maxRetries: 3,
      timeout: 30000,
      performance: {
        enableMonitoring: true,
        alertThresholds: {
          cpu: 80,
          memory: 85,
          responseTime: 5000
        }
      },
      cloud: {
        enableDistributedRendering: true,
        maxNodes: 10,
        loadBalancing: true
      },
      ai: {
        enableSmartOptimization: true,
        learningMode: true,
        adaptivePerformance: true
      },
      ...config
    };
    
    this.analytics = {
      systemUsage: new Map(),
      performanceMetrics: {
        averageResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        uptime: 0
      },
      userActivity: {
        projectsCreated: 0,
        rendersCompleted: 0,
        featuresUsed: [],
        timeSpent: 0
      },
      resourceUtilization: {
        cpu: 0,
        memory: 0,
        gpu: 0,
        storage: 0,
        network: 0
      }
    };
    
    SystemIntegration.instance = this;
  }

  // Método estático para obter a instância singleton
  public static getInstance(config?: Partial<IntegrationConfig>): SystemIntegration {
    if (!SystemIntegration.instance) {
      SystemIntegration.instance = new SystemIntegration(config);
    }
    return SystemIntegration.instance;
  }

  // Método para resetar a instância (útil para testes)
  public static resetInstance(): void {
    if (SystemIntegration.instance) {
      SystemIntegration.instance.shutdown();
      SystemIntegration.instance = null;
    }
  }

  // Inicialização
  async initialize(): Promise<void> {
    try {
      
      // Inicializar sistemas habilitados
      await this.initializeSystems();
      
      // Configurar comunicação entre sistemas
      this.setupSystemCommunication();
      
      // Iniciar monitoramento de saúde
      if (this.config.performance.enableMonitoring) {
        this.startHealthMonitoring();
      }
      
      // Configurar workflows padrão
      this.setupDefaultWorkflows();
      
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Erro ao inicializar Sistema de Integração:', error);
      throw error;
    }
  }

  // Inicializar sistemas individuais com lazy loading
  private async initializeSystems(): Promise<void> {
    // Sistemas críticos que devem ser inicializados imediatamente
    const criticalSystems = ['performance'];
    
    // Sistemas que podem ser carregados sob demanda
    const lazyLoadSystems = ['vfx', 'shader', 'compositing', 'video', 'cloud', 'avatar', 'templates', 'pptx', 'tts'];
    
    // Mock system class for placeholder systems
    class MockSystem {
      constructor(public name: string) {}
      async initialize() {
      }
      async shutdown() {
      }
      getStatus() {
        return { status: 'ready', health: 100 };
      }
    }

    const systemInitializers = {
      vfx: () => Promise.resolve(new MockSystem('VFX')),
      shader: () => Promise.resolve(new MockSystem('Shader')),
      compositing: () => Promise.resolve(new MockSystem('Compositing')),
      video: () => Promise.resolve(new MockSystem('Video')),
      cloud: () => Promise.resolve(new MockSystem('Cloud')),
      avatar: () => Promise.resolve(new MockSystem('Avatar')),
      templates: () => Promise.resolve(new MockSystem('Templates')),
      pptx: () => Promise.resolve(new MockSystem('PPTX')),
      tts: () => Promise.resolve(new MockSystem('TTS')),
      performance: () => Promise.resolve(new PerformanceAnalyzer())
    };

    // Inicializar sistemas críticos primeiro
    for (const systemId of criticalSystems.filter(id => this.config.enabledSystems.includes(id))) {
      try {
        
        const initializer = systemInitializers[systemId as keyof typeof systemInitializers];
        if (!initializer) {
          console.warn(`Sistema não encontrado: ${systemId}`);
          continue;
        }
        
        const system = await initializer();
        if (system) {
          await system.initialize();
        }
        
        this.systems.set(systemId, system);
        this.systemStatus.set(systemId, {
          id: systemId,
          name: this.getSystemName(systemId),
          status: 'ready',
          health: 100,
          lastUpdate: new Date(),
          dependencies: this.getSystemDependencies(systemId),
          capabilities: this.getSystemCapabilities(systemId)
        });
      } catch (error) {
        console.error(`Erro ao inicializar sistema ${systemId}:`, error);
        this.systemStatus.set(systemId, {
          id: systemId,
          name: this.getSystemName(systemId),
          status: 'error',
          health: 0,
          lastUpdate: new Date(),
          dependencies: [],
          capabilities: []
        });
      }
    }

    // Marcar sistemas lazy como 'pending' para carregamento sob demanda
    for (const systemId of lazyLoadSystems.filter(id => this.config.enabledSystems.includes(id))) {
      this.systemStatus.set(systemId, {
        id: systemId,
        name: this.getSystemName(systemId),
        status: 'pending',
        health: 0,
        lastUpdate: new Date(),
        dependencies: this.getSystemDependencies(systemId),
        capabilities: this.getSystemCapabilities(systemId)
      });
      
      // Registrar initializer para carregamento posterior
      (this as any)[`_${systemId}Initializer`] = systemInitializers[systemId as keyof typeof systemInitializers];
    }

    // Carregar sistemas não críticos em background (com debounce)
    setTimeout(() => {
      this.loadLazySystemsInBackground(lazyLoadSystems.filter(id => this.config.enabledSystems.includes(id)));
    }, 2000);
  }

  // Carregar sistemas lazy em background
  private async loadLazySystemsInBackground(systemIds: string[]): Promise<void> {
    for (const systemId of systemIds) {
      try {
        // Pequeno delay entre carregamentos para não bloquear
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.ensureSystemLoaded(systemId);
      } catch (error) {
        console.warn(`Erro ao carregar sistema lazy ${systemId}:`, error);
      }
    }
  }

  // Garantir que um sistema está carregado (carrega sob demanda se necessário)
  private async ensureSystemLoaded(systemId: string): Promise<any> {
    const system = this.systems.get(systemId);
    if (system) {
      return system;
    }

    const status = this.systemStatus.get(systemId);
    if (!status || status.status === 'error') {
      throw new Error(`Sistema ${systemId} não disponível`);
    }

    if (status.status === 'pending') {
      
      try {
        const initializer = (this as any)[`_${systemId}Initializer`];
        if (!initializer) {
          throw new Error(`Initializer não encontrado para ${systemId}`);
        }

        const system = await initializer();
        if (!system) {
          throw new Error(`Sistema ${systemId} retornou null`);
        }
        
        await system.initialize();
        
        this.systems.set(systemId, system);
        this.systemStatus.set(systemId, {
          ...status,
          status: 'ready',
          health: 100,
          lastUpdate: new Date()
        });
        this.emit('systemLoaded', systemId);
        
        return system;
      } catch (error) {
        console.error(`Erro ao carregar sistema ${systemId}:`, error);
        
        this.systemStatus.set(systemId, {
          ...status,
          status: 'error',
          health: 0,
          lastUpdate: new Date()
        });
        
        throw error;
      }
    }

    return system;
  }

    // Configurar comunicação entre sistemas
  private setupSystemCommunication(): void {
    // Event listeners para cada sistema
    this.systems.forEach((system, systemId) => {
      if (system && system.on) {
        // Eventos genéricos
        system.on('statusChanged', (status: any) => {
          this.updateSystemStatus(systemId, { status });
        });
        
        system.on('error', (error: Error) => {
          this.handleSystemError(systemId, error);
        });
        
        system.on('progress', (progress: number) => {
          this.emit('systemProgress', { systemId, progress });
        });
      }
    });
  }

  // Configurar eventos específicos por sistema
  private setupSystemSpecificEvents(systemId: string, system: any): void {
    switch (systemId) {
      case 'vfx':
        system.on('effectApplied', (data: any) => {
          this.broadcastMessage({
            id: this.generateId(),
            from: systemId,
            to: 'compositing',
            type: 'event',
            payload: { type: 'effectApplied', data },
            timestamp: new Date(),
            priority: 'medium'
          });
        });
        break;
        
      case 'avatar':
        system.on('avatarCreated', (avatar: any) => {
          this.broadcastMessage({
            id: this.generateId(),
            from: systemId,
            to: 'tts',
            type: 'event',
            payload: { type: 'avatarReady', avatar },
            timestamp: new Date(),
            priority: 'medium'
          });
        });
        break;
        
      case 'tts':
        system.on('speechGenerated', (audio: any) => {
          this.broadcastMessage({
            id: this.generateId(),
            from: systemId,
            to: 'video',
            type: 'data',
            payload: { type: 'audioTrack', audio },
            timestamp: new Date(),
            priority: 'high'
          });
        });
        break;
        
      case 'performance':
        system.on('alert', (alert: any) => {
          this.handlePerformanceAlert(alert);
        });
        
        system.on('optimizationSuggestion', (suggestion: any) => {
          this.handleOptimizationSuggestion(suggestion);
        });
        break;
    }
  }

  // Monitoramento de saúde
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    for (const [systemId, system] of this.systems.entries()) {
      try {
        const health = await this.checkSystemHealth(systemId, system);
        this.updateSystemStatus(systemId, { health, lastUpdate: new Date() });
        
        // Verificar thresholds
        if (health < 50) {
          this.emit('systemUnhealthy', { systemId, health });
        }
      } catch (error) {
        this.updateSystemStatus(systemId, {
          status: 'error',
          health: 0,
          lastUpdate: new Date()
        });
      }
    }
  }

  private async checkSystemHealth(systemId: string, system: any): Promise<number> {
    // Implementação básica de health check
    if (system.getHealth) {
      return await system.getHealth();
    }
    
    // Health check genérico
    const status = this.systemStatus.get(systemId);
    if (!status) return 0;
    
    let health = 100;
    
    // Verificar se o sistema está respondendo
    if (status.status === 'error') health -= 50;
    if (status.status === 'offline') health -= 100;
    
    // Verificar métricas de performance
    if (status.metrics) {
      if (status.metrics.cpu > this.config.performance.alertThresholds.cpu) {
        health -= 20;
      }
      if (status.metrics.memory > this.config.performance.alertThresholds.memory) {
        health -= 20;
      }
    }
    
    return Math.max(0, health);
  }

  // Workflows
  private setupDefaultWorkflows(): void {
    // Workflow: Criação de vídeo com avatar
    this.registerWorkflow({
      id: 'create-avatar-video',
      name: 'Criar Vídeo com Avatar',
      description: 'Workflow completo para criar vídeo com avatar 3D e narração',
      steps: [
        {
          id: 'create-avatar',
          name: 'Criar Avatar',
          system: 'avatar',
          action: 'createAvatar',
          params: {},
          dependencies: [],
          timeout: 30000,
          retries: 2
        },
        {
          id: 'generate-speech',
          name: 'Gerar Narração',
          system: 'tts',
          action: 'synthesize',
          params: {},
          dependencies: [],
          timeout: 60000,
          retries: 2
        },
        {
          id: 'animate-avatar',
          name: 'Animar Avatar',
          system: 'avatar',
          action: 'animate',
          params: {},
          dependencies: ['create-avatar', 'generate-speech'],
          timeout: 45000,
          retries: 2
        },
        {
          id: 'apply-effects',
          name: 'Aplicar Efeitos',
          system: 'vfx',
          action: 'applyEffects',
          params: {},
          dependencies: ['animate-avatar'],
          timeout: 60000,
          retries: 2
        },
        {
          id: 'render-video',
          name: 'Renderizar Vídeo',
          system: 'video',
          action: 'render',
          params: {},
          dependencies: ['apply-effects'],
          timeout: 300000,
          retries: 1
        }
      ],
      status: 'pending',
      progress: 0,
      results: new Map()
    });
    
    // Workflow: Conversão de PPTX
    this.registerWorkflow({
      id: 'convert-pptx',
      name: 'Converter PPTX para Vídeo',
      description: 'Análise e conversão automática de apresentação PowerPoint',
      steps: [
        {
          id: 'analyze-pptx',
          name: 'Analisar PPTX',
          system: 'pptx',
          action: 'analyze',
          params: {},
          dependencies: [],
          timeout: 60000,
          retries: 2
        },
        {
          id: 'generate-narration',
          name: 'Gerar Narração',
          system: 'tts',
          action: 'generateFromSlides',
          params: {},
          dependencies: ['analyze-pptx'],
          timeout: 120000,
          retries: 2
        },
        {
          id: 'create-timeline',
          name: 'Criar Timeline',
          system: 'compositing',
          action: 'createFromSlides',
          params: {},
          dependencies: ['analyze-pptx'],
          timeout: 30000,
          retries: 2
        },
        {
          id: 'apply-transitions',
          name: 'Aplicar Transições',
          system: 'vfx',
          action: 'applyTransitions',
          params: {},
          dependencies: ['create-timeline'],
          timeout: 45000,
          retries: 2
        },
        {
          id: 'final-render',
          name: 'Renderização Final',
          system: 'video',
          action: 'render',
          params: {},
          dependencies: ['generate-narration', 'apply-transitions'],
          timeout: 600000,
          retries: 1
        }
      ],
      status: 'pending',
      progress: 0,
      results: new Map()
    });
  }

  // Gerenciamento de projetos
  async createProject(data: Partial<ProjectData>): Promise<string> {
    const projectId = this.generateId();
    
    const project: ProjectData = {
      id: projectId,
      name: data.name || `Projeto ${projectId.slice(0, 8)}`,
      type: data.type || 'video',
      metadata: {
        duration: data.metadata?.duration || 0,
        resolution: data.metadata?.resolution || { width: 1920, height: 1080 },
        frameRate: data.metadata?.frameRate || 30,
        quality: data.metadata?.quality || 'high',
        tags: data.metadata?.tags || [],
        created: new Date(),
        modified: new Date()
      },
      assets: {
        videos: [],
        images: [],
        audio: [],
        models: [],
        textures: []
      },
      timeline: {
        tracks: [],
        effects: [],
        transitions: []
      },
      settings: data.settings || {}
    };
    
    this.projects.set(projectId, project);
    this.analytics.userActivity.projectsCreated++;
    
    this.emit('projectCreated', project);
    return projectId;
  }

  // Execução de workflows
  async executeWorkflow(workflowId: string, params: any = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow não encontrado: ${workflowId}`);
    }
    
    const executionId = this.generateId();
    const execution = { ...workflow, id: executionId };
    
    execution.status = 'running';
    execution.startTime = new Date();
    execution.progress = 0;
    
    this.workflows.set(executionId, execution);
    
    try {
      await this.runWorkflowSteps(execution, params);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.progress = 100;
      
      this.emit('workflowCompleted', execution);
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      
      this.emit('workflowFailed', { execution, error });
      throw error;
    }
    
    return executionId;
  }

  private async runWorkflowSteps(workflow: Workflow, params: any): Promise<void> {
    const completed = new Set<string>();
    const stepResults = new Map<string, any>();
    
    while (completed.size < workflow.steps.length) {
      const readySteps = workflow.steps.filter(step => 
        !completed.has(step.id) &&
        step.dependencies.every(dep => completed.has(dep))
      );
      
      if (readySteps.length === 0) {
        throw new Error('Dependências circulares detectadas no workflow');
      }
      
      // Executar steps em paralelo quando possível
      const stepPromises = readySteps.map(async step => {
        const system = this.systems.get(step.system);
        if (!system) {
          throw new Error(`Sistema não encontrado: ${step.system}`);
        }
        
        const stepParams = {
          ...params,
          ...step.params,
          dependencies: step.dependencies.reduce((acc, dep) => {
            acc[dep] = stepResults.get(dep);
            return acc;
          }, {} as any)
        };
        
        let retries = step.retries;
        let lastError: Error | null = null;
        
        while (retries >= 0) {
          try {
            const result = await Promise.race([
              system[step.action](stepParams),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), step.timeout)
              )
            ]);
            
            stepResults.set(step.id, result);
            completed.add(step.id);
            
            workflow.progress = (completed.size / workflow.steps.length) * 100;
            this.emit('workflowProgress', workflow);
            
            return;
          } catch (error) {
            lastError = error as Error;
            retries--;
            
            if (retries >= 0) {
              console.warn(`Tentativa ${step.retries - retries} falhou para step ${step.id}:`, error);
              await new Promise(resolve => setTimeout(resolve, 1000 * (step.retries - retries)));
            }
          }
        }
        
        throw lastError || new Error(`Step ${step.id} falhou após ${step.retries + 1} tentativas`);
      });
      
      await Promise.all(stepPromises);
    }
    
    workflow.results = stepResults;
  }

  // Gerenciamento de renderização
  async queueRender(job: Partial<RenderJob>): Promise<string> {
    const renderJob: RenderJob = {
      id: this.generateId(),
      projectId: job.projectId || '',
      type: job.type || 'export',
      priority: job.priority || 1,
      settings: {
        quality: 'high',
        format: 'mp4',
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        codec: 'h264',
        ...job.settings
      },
      progress: 0,
      status: 'queued'
    };
    
    this.renderQueue.push(renderJob);
    this.renderQueue.sort((a, b) => b.priority - a.priority);
    
    this.emit('renderQueued', renderJob);
    this.processRenderQueue();
    
    return renderJob.id;
  }

  private async processRenderQueue(): Promise<void> {
    const activeJobs = this.renderQueue.filter(job => job.status === 'processing');
    const maxConcurrent = this.config.cloud.enableDistributedRendering ? 
      this.config.cloud.maxNodes : 1;
    
    if (activeJobs.length >= maxConcurrent) {
      return;
    }
    
    const nextJob = this.renderQueue.find(job => job.status === 'queued');
    if (!nextJob) {
      return;
    }
    
    nextJob.status = 'processing';
    this.emit('renderStarted', nextJob);
    
    try {
      const renderer = this.config.cloud.enableDistributedRendering ?
        this.systems.get('cloud') : this.systems.get('video');
      
      if (!renderer) {
        throw new Error('Sistema de renderização não disponível');
      }
      
      const result = await renderer.render(nextJob);
      
      nextJob.status = 'completed';
      nextJob.progress = 100;
      nextJob.outputPath = result.outputPath;
      nextJob.actualTime = Date.now() - (nextJob.estimatedTime || 0);
      
      this.analytics.userActivity.rendersCompleted++;
      this.emit('renderCompleted', nextJob);
    } catch (error) {
      nextJob.status = 'failed';
      nextJob.error = (error as Error).message;
      
      this.emit('renderFailed', { job: nextJob, error });
    }
    
    // Processar próximo job
    setTimeout(() => this.processRenderQueue(), 1000);
  }

  // Utilitários
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getSystemName(systemId: string): string {
    const names: Record<string, string> = {
      vfx: 'Sistema VFX Avançado',
      shader: 'Sistema de Shaders',
      compositing: 'Motor de Compositing',
      video: 'Renderizador de Vídeo',
      cloud: 'Renderização Cloud',
      avatar: 'Sistema de Avatares 3D',
      templates: 'Templates NR',
      pptx: 'Análise PPTX',
      tts: 'Sistema TTS',
      performance: 'Analisador de Performance'
    };
    return names[systemId] || systemId;
  }

  private getSystemDependencies(systemId: string): string[] {
    const dependencies: Record<string, string[]> = {
      vfx: ['shader'],
      compositing: ['vfx', 'shader'],
      video: ['compositing'],
      cloud: ['video'],
      avatar: ['vfx'],
      templates: ['vfx', 'compositing'],
      pptx: ['tts', 'vfx'],
      tts: [],
      performance: []
    };
    return dependencies[systemId] || [];
  }

  private getSystemCapabilities(systemId: string): string[] {
    const capabilities: Record<string, string[]> = {
      vfx: ['effects', 'transitions', 'filters', 'particles'],
      shader: ['vertex', 'fragment', 'compute', 'geometry'],
      compositing: ['layers', 'blending', 'masking', 'keying'],
      video: ['encoding', 'export', 'streaming', 'formats'],
      cloud: ['distributed', 'scaling', 'load-balancing'],
      avatar: ['3d-models', 'animation', 'lip-sync', 'expressions'],
      templates: ['nr-compliance', 'customization', 'branding'],
      pptx: ['analysis', 'conversion', 'ai-suggestions'],
      tts: ['synthesis', 'voices', 'emotions', 'ssml'],
      performance: ['monitoring', 'optimization', 'analytics']
    };
    return capabilities[systemId] || [];
  }

  private updateSystemStatus(systemId: string, updates: Partial<SystemStatus>): void {
    const current = this.systemStatus.get(systemId);
    if (current) {
      const updated = { ...current, ...updates };
      this.systemStatus.set(systemId, updated);
      this.emit('systemStatusUpdated', updated);
    }
  }

  private handleSystemError(systemId: string, error: Error): void {
    console.error(`Erro no sistema ${systemId}:`, error);
    
    this.updateSystemStatus(systemId, {
      status: 'error',
      health: 0,
      lastUpdate: new Date()
    });
    
    this.emit('systemError', { systemId, error });
  }

  private handlePerformanceAlert(alert: any): void {
    console.warn('Alerta de performance:', alert);
    
    if (this.config.ai.enableSmartOptimization) {
      this.applySmartOptimization(alert);
    }
    
    this.emit('performanceAlert', alert);
  }

  private handleOptimizationSuggestion(suggestion: any): void {
    if (this.config.ai.adaptivePerformance && suggestion.autoApply) {
      this.applyOptimization(suggestion);
    }
    
    this.emit('optimizationSuggestion', suggestion);
  }

  private async applySmartOptimization(alert: any): Promise<void> {
    // Implementar otimização inteligente baseada no alerta
  }

  private async applyOptimization(suggestion: any): Promise<void> {
    // Implementar aplicação de otimização
  }

  private broadcastMessage(message: SystemMessage): void {
    this.messageQueue.push(message);
    this.emit('message', message);
    
    // Processar mensagem
    if (message.to === 'all') {
      this.systems.forEach((system, systemId) => {
        if (systemId !== message.from && system.handleMessage) {
          system.handleMessage(message);
        }
      });
    } else {
      const targetSystem = this.systems.get(message.to);
      if (targetSystem && targetSystem.handleMessage) {
        targetSystem.handleMessage(message);
      }
    }
  }

  private registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  // API Pública
  getSystemStatus(systemId?: string): SystemStatus | SystemStatus[] | null {
    if (systemId) {
      return this.systemStatus.get(systemId) || null;
    }
    return Array.from(this.systemStatus.values());
  }

  getSystem(systemId: string): any {
    return this.systems.get(systemId);
  }

  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getProjects(): ProjectData[] {
    return Array.from(this.projects.values());
  }

  getRenderQueue(): RenderJob[] {
    return [...this.renderQueue];
  }

  getAnalytics(): AnalyticsData {
    return { ...this.analytics };
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    
    // Parar monitoramento
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Desligar sistemas
    for (const [systemId, system] of this.systems.entries()) {
      try {
        if (system && system.shutdown) {
          await system.shutdown();
        }
      } catch (error) {
        console.error(`Erro ao desligar sistema ${systemId}:`, error);
      }
    }
    
    this.systems.clear();
    this.systemStatus.clear();
    
    this.emit('shutdown');
  }
}

export default SystemIntegration;