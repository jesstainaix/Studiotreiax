// Sistema de renderização cloud distribuída
import { VideoRenderer, RenderConfig, RenderProgress, RenderJob } from './VideoRenderer';
import { CompositingEngine, CompositeLayer, CompositeSettings } from './CompositingEngine';
import { WorkerMessage, RenderFrameData } from './workers/RenderWorker';

interface CloudNode {
  id: string;
  url: string;
  status: 'online' | 'offline' | 'busy';
  capabilities: {
    maxConcurrentJobs: number;
    supportedFormats: string[];
    gpuAcceleration: boolean;
    memoryGB: number;
    cpuCores: number;
  };
  currentJobs: number;
  lastPing: number;
}

interface DistributedRenderJob {
  id: string;
  projectId: string;
  config: RenderConfig;
  totalFrames: number;
  frameRanges: FrameRange[];
  status: 'pending' | 'distributing' | 'rendering' | 'merging' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  estimatedCompletion?: number;
  nodes: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface FrameRange {
  start: number;
  end: number;
  nodeId?: string;
  status: 'pending' | 'assigned' | 'rendering' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: number;
}

interface RenderChunk {
  id: string;
  jobId: string;
  frameRange: FrameRange;
  data: {
    layers: CompositeLayer[];
    composition: CompositeSettings;
    config: RenderConfig;
  };
  result?: {
    frames: ArrayBuffer[];
    metadata: any;
  };
}

interface CloudRenderingConfig {
  maxConcurrentJobs: number;
  chunkSize: number;
  retryAttempts: number;
  timeoutMs: number;
  compressionLevel: number;
  enableGPUAcceleration: boolean;
  priorityWeights: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
}

class CloudRenderingSystem {
  private nodes: Map<string, CloudNode> = new Map();
  private jobs: Map<string, DistributedRenderJob> = new Map();
  private chunks: Map<string, RenderChunk> = new Map();
  private workers: Map<string, Worker> = new Map();
  private config: CloudRenderingConfig;
  private isInitialized = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config?: Partial<CloudRenderingConfig>) {
    this.config = {
      maxConcurrentJobs: 10,
      chunkSize: 30, // frames por chunk
      retryAttempts: 3,
      timeoutMs: 300000, // 5 minutos
      compressionLevel: 6,
      enableGPUAcceleration: true,
      priorityWeights: {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1
      },
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Descobrir nós disponíveis
      await this.discoverNodes();
      
      // Inicializar workers locais
      await this.initializeLocalWorkers();
      
      // Iniciar monitoramento
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      this.emit('initialized', { success: true });
      
    } catch (error) {
      throw new Error(`Erro ao inicializar sistema de renderização cloud: ${error}`);
    }
  }

  private async discoverNodes(): Promise<void> {
    // Simular descoberta de nós (em produção, seria via service discovery)
    const mockNodes: CloudNode[] = [
      {
        id: 'node-1',
        url: 'https://render-node-1.example.com',
        status: 'online',
        capabilities: {
          maxConcurrentJobs: 4,
          supportedFormats: ['mp4', 'webm', 'mov'],
          gpuAcceleration: true,
          memoryGB: 32,
          cpuCores: 16
        },
        currentJobs: 0,
        lastPing: Date.now()
      },
      {
        id: 'node-2',
        url: 'https://render-node-2.example.com',
        status: 'online',
        capabilities: {
          maxConcurrentJobs: 8,
          supportedFormats: ['mp4', 'webm', 'mov', 'avi'],
          gpuAcceleration: true,
          memoryGB: 64,
          cpuCores: 32
        },
        currentJobs: 0,
        lastPing: Date.now()
      },
      {
        id: 'local',
        url: 'local://worker',
        status: 'online',
        capabilities: {
          maxConcurrentJobs: 2,
          supportedFormats: ['mp4', 'webm'],
          gpuAcceleration: false,
          memoryGB: 16,
          cpuCores: 8
        },
        currentJobs: 0,
        lastPing: Date.now()
      }
    ];

    mockNodes.forEach(node => {
      this.nodes.set(node.id, node);
    });
  }

  private async initializeLocalWorkers(): Promise<void> {
    const localNode = this.nodes.get('local');
    if (!localNode) return;

    for (let i = 0; i < localNode.capabilities.maxConcurrentJobs; i++) {
      const worker = new Worker(new URL('./workers/RenderWorker.ts', import.meta.url));
      const workerId = `local-worker-${i}`;
      
      worker.onmessage = (event) => {
        this.handleWorkerMessage(workerId, event.data);
      };
      
      worker.onerror = (error) => {
        console.error(`Erro no worker ${workerId}:`, error);
        this.handleWorkerError(workerId, error);
      };
      
      this.workers.set(workerId, worker);
    }
  }

  private handleWorkerMessage(workerId: string, message: any): void {
    const { type, data } = message;
    
    switch (type) {
      case 'frameRendered':
        this.handleFrameCompleted(workerId, data);
        break;
      case 'progress':
        this.handleWorkerProgress(workerId, data);
        break;
      case 'error':
        this.handleWorkerError(workerId, new Error(data.message));
        break;
    }
  }

  private handleFrameCompleted(workerId: string, data: any): void {
    // Processar frame completado
    this.emit('frameCompleted', { workerId, ...data });
  }

  private handleWorkerProgress(workerId: string, data: any): void {
    // Atualizar progresso
    this.emit('progress', { workerId, ...data });
  }

  private handleWorkerError(workerId: string, error: Error): void {
    console.error(`Erro no worker ${workerId}:`, error);
    this.emit('workerError', { workerId, error: error.message });
  }

  async submitRenderJob(
    projectId: string,
    layers: CompositeLayer[],
    composition: CompositeSettings,
    config: RenderConfig,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Sistema não inicializado');
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalFrames = Math.ceil((config.duration || 10) * (config.fps || 30));
    
    // Dividir em chunks
    const frameRanges = this.createFrameRanges(totalFrames);
    
    const job: DistributedRenderJob = {
      id: jobId,
      projectId,
      config,
      totalFrames,
      frameRanges,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      nodes: [],
      priority
    };
    
    this.jobs.set(jobId, job);
    
    // Iniciar distribuição
    await this.distributeJob(jobId, layers, composition);
    
    return jobId;
  }

  private createFrameRanges(totalFrames: number): FrameRange[] {
    const ranges: FrameRange[] = [];
    const chunkSize = this.config.chunkSize;
    
    for (let start = 0; start < totalFrames; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, totalFrames - 1);
      ranges.push({
        start,
        end,
        status: 'pending',
        progress: 0
      });
    }
    
    return ranges;
  }

  private async distributeJob(
    jobId: string,
    layers: CompositeLayer[],
    composition: CompositeSettings
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job não encontrado');
    
    job.status = 'distributing';
    
    // Selecionar nós disponíveis
    const availableNodes = this.selectOptimalNodes(job);
    
    if (availableNodes.length === 0) {
      throw new Error('Nenhum nó disponível para renderização');
    }
    
    // Distribuir chunks
    for (let i = 0; i < job.frameRanges.length; i++) {
      const range = job.frameRanges[i];
      const node = availableNodes[i % availableNodes.length];
      
      range.nodeId = node.id;
      range.status = 'assigned';
      
      // Criar chunk
      const chunkId = `chunk-${jobId}-${i}`;
      const chunk: RenderChunk = {
        id: chunkId,
        jobId,
        frameRange: range,
        data: {
          layers,
          composition,
          config: job.config
        }
      };
      
      this.chunks.set(chunkId, chunk);
      
      // Enviar para renderização
      await this.renderChunk(chunkId, node);
    }
    
    job.status = 'rendering';
    job.nodes = availableNodes.map(n => n.id);
  }

  private selectOptimalNodes(job: DistributedRenderJob): CloudNode[] {
    const availableNodes = Array.from(this.nodes.values())
      .filter(node => 
        node.status === 'online' && 
        node.currentJobs < node.capabilities.maxConcurrentJobs
      )
      .sort((a, b) => {
        // Priorizar por capacidade e disponibilidade
        const scoreA = this.calculateNodeScore(a, job);
        const scoreB = this.calculateNodeScore(b, job);
        return scoreB - scoreA;
      });
    
    return availableNodes;
  }

  private calculateNodeScore(node: CloudNode, job: DistributedRenderJob): number {
    let score = 0;
    
    // Capacidade de processamento
    score += node.capabilities.cpuCores * 10;
    score += node.capabilities.memoryGB;
    
    // Aceleração GPU
    if (node.capabilities.gpuAcceleration && this.config.enableGPUAcceleration) {
      score += 50;
    }
    
    // Disponibilidade
    const utilization = node.currentJobs / node.capabilities.maxConcurrentJobs;
    score += (1 - utilization) * 30;
    
    // Prioridade do job
    score += this.config.priorityWeights[job.priority] * 5;
    
    return score;
  }

  private async renderChunk(chunkId: string, node: CloudNode): Promise<void> {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) throw new Error('Chunk não encontrado');
    
    try {
      if (node.id === 'local') {
        await this.renderChunkLocally(chunk);
      } else {
        await this.renderChunkRemotely(chunk, node);
      }
    } catch (error) {
      console.error(`Erro ao renderizar chunk ${chunkId}:`, error);
      chunk.frameRange.status = 'failed';
      
      // Tentar novamente em outro nó
      await this.retryChunk(chunkId);
    }
  }

  private async renderChunkLocally(chunk: RenderChunk): Promise<void> {
    // Encontrar worker disponível
    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) {
      throw new Error('Nenhum worker local disponível');
    }
    
    const { workerId, worker } = availableWorker;
    
    // Renderizar frames do chunk
    for (let frame = chunk.frameRange.start; frame <= chunk.frameRange.end; frame++) {
      const time = frame / (chunk.data.config.fps || 30);
      
      const renderData: RenderFrameData = {
        frameNumber: frame,
        time,
        layers: chunk.data.layers,
        composition: chunk.data.composition,
        width: chunk.data.config.width || 1920,
        height: chunk.data.config.height || 1080
      };
      
      worker.postMessage({
        type: 'renderFrame',
        data: renderData
      });
    }
  }

  private findAvailableWorker(): { workerId: string; worker: Worker } | null {
    // Implementação simplificada - em produção seria mais sofisticada
    for (const [workerId, worker] of this.workers.entries()) {
      return { workerId, worker };
    }
    return null;
  }

  private async renderChunkRemotely(chunk: RenderChunk, node: CloudNode): Promise<void> {
    // Simular renderização remota
    // Em produção, seria uma chamada HTTP para o nó remoto
    
    const response = await fetch(`${node.url}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chunkId: chunk.id,
        frameRange: chunk.frameRange,
        data: chunk.data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na renderização remota: ${response.statusText}`);
    }
    
    const result = await response.json();
    chunk.result = result;
    chunk.frameRange.status = 'completed';
    chunk.frameRange.progress = 100;
  }

  private async retryChunk(chunkId: string): Promise<void> {
    // Implementar lógica de retry
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.pingNodes();
      this.updateJobProgress();
      this.cleanupCompletedJobs();
    }, 5000);
  }

  private async pingNodes(): Promise<void> {
    for (const [nodeId, node] of this.nodes.entries()) {
      if (node.id === 'local') continue;
      
      try {
        const response = await fetch(`${node.url}/health`, {
          method: 'GET',
          timeout: 5000
        } as any);
        
        if (response.ok) {
          node.status = 'online';
          node.lastPing = Date.now();
        } else {
          node.status = 'offline';
        }
      } catch (error) {
        node.status = 'offline';
      }
    }
  }

  private updateJobProgress(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status !== 'rendering') continue;
      
      const completedRanges = job.frameRanges.filter(r => r.status === 'completed').length;
      const totalRanges = job.frameRanges.length;
      
      job.progress = (completedRanges / totalRanges) * 100;
      
      if (job.progress === 100) {
        job.status = 'merging';
        this.mergeJobResults(jobId);
      }
      
      this.emit('jobProgress', {
        jobId,
        progress: job.progress,
        status: job.status
      });
    }
  }

  private async mergeJobResults(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    try {
      // Coletar todos os chunks do job
      const jobChunks = Array.from(this.chunks.values())
        .filter(chunk => chunk.jobId === jobId)
        .sort((a, b) => a.frameRange.start - b.frameRange.start);
      
      // Mesclar resultados
      const mergedFrames: ArrayBuffer[] = [];
      
      for (const chunk of jobChunks) {
        if (chunk.result?.frames) {
          mergedFrames.push(...chunk.result.frames);
        }
      }
      
      // Criar vídeo final
      const videoRenderer = new VideoRenderer();
      await videoRenderer.initialize();
      
      const outputPath = await videoRenderer.mergeFramesToVideo(
        mergedFrames,
        job.config
      );
      
      job.status = 'completed';
      
      this.emit('jobCompleted', {
        jobId,
        outputPath,
        totalFrames: job.totalFrames,
        renderTime: Date.now() - job.startTime
      });
      
    } catch (error) {
      job.status = 'failed';
      this.emit('jobFailed', {
        jobId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  private cleanupCompletedJobs(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.startTime < cutoffTime
      ) {
        // Limpar chunks do job
        for (const [chunkId, chunk] of this.chunks.entries()) {
          if (chunk.jobId === jobId) {
            this.chunks.delete(chunkId);
          }
        }
        
        this.jobs.delete(jobId);
      }
    }
  }

  // Métodos públicos para monitoramento
  getJobStatus(jobId: string): DistributedRenderJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): DistributedRenderJob[] {
    return Array.from(this.jobs.values());
  }

  getNodeStatus(): CloudNode[] {
    return Array.from(this.nodes.values());
  }

  getSystemStats(): {
    totalNodes: number;
    onlineNodes: number;
    activeJobs: number;
    queuedJobs: number;
    totalCapacity: number;
    usedCapacity: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalNodes: nodes.length,
      onlineNodes: nodes.filter(n => n.status === 'online').length,
      activeJobs: jobs.filter(j => j.status === 'rendering').length,
      queuedJobs: jobs.filter(j => j.status === 'pending').length,
      totalCapacity: nodes.reduce((sum, n) => sum + n.capabilities.maxConcurrentJobs, 0),
      usedCapacity: nodes.reduce((sum, n) => sum + n.currentJobs, 0)
    };
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener do evento ${event}:`, error);
        }
      });
    }
  }

  async dispose(): Promise<void> {
    // Parar todos os jobs
    for (const job of this.jobs.values()) {
      if (job.status === 'rendering') {
        job.status = 'failed';
      }
    }
    
    // Limpar workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    
    this.workers.clear();
    this.jobs.clear();
    this.chunks.clear();
    this.eventListeners.clear();
    
    this.isInitialized = false;
  }
}

export {
  CloudRenderingSystem,
  type CloudNode,
  type DistributedRenderJob,
  type FrameRange,
  type RenderChunk,
  type CloudRenderingConfig
};