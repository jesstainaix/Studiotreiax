/**
 * Pipeline API Service
 * Serviço para comunicação com a API do pipeline PPTX→Vídeo
 */

import { API_BASE_URL, API_ENDPOINTS, apiCall } from '../lib/api';

export interface PipelineJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
  file: {
    id: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  stages: {
    upload: PipelineStage;
    extraction: PipelineStage;
    aiAnalysis: PipelineStage;
    ttsGeneration: PipelineStage;
    videoGeneration: PipelineStage;
  };
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    fileSize: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  data?: any;
  error?: string;
}

export interface PipelineStartResponse {
  success: boolean;
  message: string;
  data?: {
    jobId: string;
    status: string;
    progress: number;
    currentStage: string;
  };
  error?: string;
}

export interface PipelineStatusResponse {
  success: boolean;
  data?: PipelineJob;
  error?: string;
}

export interface PipelineJobsResponse {
  success: boolean;
  data?: PipelineJob[];
  error?: string;
}

class PipelineApiService {
  private static instance: PipelineApiService;
  private userJobsCache: {
    data: PipelineJobsResponse | null;
    timestamp: number;
    ttl: number;
  } = {
    data: null,
    timestamp: 0,
    ttl: 30000 // 30 seconds in milliseconds
  };

  // Debounce e controle de polling
  private pollingTimers = new Map<string, NodeJS.Timeout>();
  private activeMonitors = new Set<string>();
  private lastPollTime = new Map<string, number>();
  private pollCount = new Map<string, number>();

  static getInstance(): PipelineApiService {
    if (!PipelineApiService.instance) {
      PipelineApiService.instance = new PipelineApiService();
    }
    return PipelineApiService.instance;
  }

  /**
   * Verifica se o cache ainda é válido
   */
  private isCacheValid(): boolean {
    const now = Date.now();
    return this.userJobsCache.data !== null && 
           (now - this.userJobsCache.timestamp) < this.userJobsCache.ttl;
  }

  /**
   * Limpa o cache de jobs do usuário
   */
  private clearUserJobsCache(): void {
    this.userJobsCache.data = null;
    this.userJobsCache.timestamp = 0;
  }

  /**
   * Inicia o pipeline PPTX→Vídeo
   */
  async startPipeline(file: File): Promise<PipelineStartResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.pipeline.start}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao iniciar pipeline');
      }

      // Limpa o cache de jobs quando um novo pipeline é iniciado
      if (result.success) {
        this.clearUserJobsCache();
      }

      return result;
    } catch (error) {
      console.error('Erro ao iniciar pipeline:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Timeout - Pipeline demorou mais de 10 segundos para iniciar',
          error: 'Request timeout'
        };
      }
      
      return {
        success: false,
        message: 'Erro ao iniciar pipeline',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica o status de um job do pipeline
   */
  async getJobStatus(jobId: string): Promise<PipelineStatusResponse> {
    try {
      const response = await apiCall(`${API_ENDPOINTS.pipeline.status}/${jobId}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao verificar status');
      }

      return result;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Lista todos os jobs do usuário (com cache de 30 segundos)
   */
  async getUserJobs(forceRefresh: boolean = false): Promise<PipelineJobsResponse> {
    // Retorna dados do cache se ainda válidos e não forçando refresh
    if (!forceRefresh && this.isCacheValid() && this.userJobsCache.data) {
      return this.userJobsCache.data;
    }

    try {
      const response = await apiCall(API_ENDPOINTS.pipeline.jobs, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao listar jobs');
      }

      // Atualiza o cache com os novos dados
      this.userJobsCache.data = result;
      this.userJobsCache.timestamp = Date.now();

      return result;
    } catch (error) {
      console.error('Erro ao listar jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Monitora o progresso de um job em tempo real com polling otimizado e debounce
   */
  async monitorJob(
    jobId: string, 
    onProgress: (job: PipelineJob) => void,
    onComplete: (job: PipelineJob) => void,
    onError: (error: string) => void
  ): Promise<void> {
    // Evitar múltiplos monitores para o mesmo job
    if (this.activeMonitors.has(jobId)) {
      console.warn(`Monitor já ativo para job ${jobId}`);
      return;
    }

    this.activeMonitors.add(jobId);
    this.pollCount.set(jobId, 0);
    this.lastPollTime.set(jobId, Date.now());

    const checkStatus = async () => {
      try {
        const now = Date.now();
        const lastPoll = this.lastPollTime.get(jobId) || 0;
        const pollCount = this.pollCount.get(jobId) || 0;

        // Debounce: não fazer poll muito frequente
        if (now - lastPoll < 800) { // Mínimo 800ms entre polls
          const timer = setTimeout(checkStatus, 800 - (now - lastPoll));
          this.pollingTimers.set(jobId, timer);
          return;
        }

        this.lastPollTime.set(jobId, now);
        this.pollCount.set(jobId, pollCount + 1);

        const response = await this.getJobStatus(jobId);
        
        if (!response.success || !response.data) {
          this.cleanupMonitor(jobId);
          onError(response.error || 'Erro ao verificar status');
          return;
        }

        const job = response.data;
        onProgress(job);

        if (job.status === 'completed') {
          this.cleanupMonitor(jobId);
          this.clearUserJobsCache();
          onComplete(job);
        } else if (job.status === 'failed') {
          this.cleanupMonitor(jobId);
          this.clearUserJobsCache();
          onError(job.error || 'Pipeline falhou');
        } else if (job.status === 'processing' || job.status === 'pending') {
          // Polling adaptativo: 
          // - 1s para jobs em processamento ativo
          // - 2s para jobs em fila
          // - Aumenta gradualmente se muitos polls (máximo 5s)
          let interval = job.status === 'processing' ? 1000 : 2000;
          
          // Aumentar intervalo progressivamente para reduzir carga
          if (pollCount > 10) interval = Math.min(interval * 1.5, 5000);
          if (pollCount > 30) interval = Math.min(interval * 2, 8000);

          const timer = setTimeout(checkStatus, interval);
          this.pollingTimers.set(jobId, timer);
        } else {
          // Status desconhecido, limpar monitor
          this.cleanupMonitor(jobId);
        }
      } catch (error) {
        this.cleanupMonitor(jobId);
        onError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    // Iniciar monitoramento
    checkStatus();
  }

  /**
   * Limpa recursos de monitoramento para um job
   */
  private cleanupMonitor(jobId: string): void {
    const timer = this.pollingTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.pollingTimers.delete(jobId);
    }
    
    this.activeMonitors.delete(jobId);
    this.lastPollTime.delete(jobId);
    this.pollCount.delete(jobId);
  }

  /**
   * Para todos os monitores ativos (útil para cleanup)
   */
  public stopAllMonitors(): void {
    this.pollingTimers.forEach((timer) => clearTimeout(timer));
    this.pollingTimers.clear();
    this.activeMonitors.clear();
    this.lastPollTime.clear();
    this.pollCount.clear();
  }

  /**
   * Cancela um job em execução (se suportado pelo backend)
   */
  async cancelJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall(`${API_ENDPOINTS.pipeline.status}/${jobId}/cancel`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cancelar job');
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao cancelar job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obtém estatísticas do pipeline
   */
  async getPipelineStats(): Promise<{
    success: boolean;
    data?: {
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
      averageProcessingTime: number;
      successRate: number;
    };
    error?: string;
  }> {
    try {
      const response = await this.getUserJobs();
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Erro ao obter estatísticas'
        };
      }

      const jobs = response.data;
      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(job => job.status === 'completed').length;
      const failedJobs = jobs.filter(job => job.status === 'failed').length;
      
      // Calcular tempo médio de processamento
      const completedJobsWithDuration = jobs.filter(job => 
        job.status === 'completed' && 
        job.createdAt && 
        job.updatedAt
      );
      
      const averageProcessingTime = completedJobsWithDuration.length > 0
        ? completedJobsWithDuration.reduce((acc, job) => {
            const start = new Date(job.createdAt).getTime();
            const end = new Date(job.updatedAt).getTime();
            return acc + (end - start);
          }, 0) / completedJobsWithDuration.length
        : 0;

      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      return {
        success: true,
        data: {
          totalJobs,
          completedJobs,
          failedJobs,
          averageProcessingTime,
          successRate
        }
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

// Export singleton instance
export const pipelineApiService = PipelineApiService.getInstance();
export default pipelineApiService;