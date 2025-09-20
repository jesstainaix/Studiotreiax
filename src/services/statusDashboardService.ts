import { ProjectStatus, SystemHealth, ActionHistoryItem, ErrorMetrics, PerformanceMetrics } from '../components/video-editor/StatusDashboard/StatusDashboard';

/**
 * Serviço para gerenciar dados do Status Dashboard
 * Centraliza coleta, processamento e atualização de métricas do sistema
 */
export class StatusDashboardService {
  private static instance: StatusDashboardService;
  private subscribers: ((data: DashboardData) => void)[] = [];
  private refreshInterval: NodeJS.Timeout | null = null;
  private autoRefresh: boolean = true;
  private refreshRate: number = 5000; // 5 segundos

  // Cache de dados
  private dashboardData: DashboardData = {
    systemHealth: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      status: 'healthy',
      uptime: 0
    },
    projects: [],
    actionHistory: [],
    errorMetrics: {
      total: 0,
      byType: {},
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      resolved: 0,
      pending: 0,
      trend: 'stable'
    },
    performanceMetrics: {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      successRate: 100,
      avgProcessingTime: 0,
      peakUsage: 0,
      trends: { labels: [], values: [] }
    }
  };

  private constructor() {
    this.initializeData();
  }

  public static getInstance(): StatusDashboardService {
    if (!StatusDashboardService.instance) {
      StatusDashboardService.instance = new StatusDashboardService();
    }
    return StatusDashboardService.instance;
  }

  /**
   * Inicializar dados padrão
   */
  private initializeData(): void {
    try {
      // Carregar dados salvos do localStorage se disponível
      const savedData = localStorage.getItem('statusDashboardData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.dashboardData = { ...this.dashboardData, ...parsed };
      }

      // Inicializar com dados simulados se necessário
      this.generateInitialData();
      
      // Iniciar auto-refresh se habilitado
      if (this.autoRefresh) {
        this.startAutoRefresh();
      }

    } catch (error) {
      console.error('Erro ao inicializar StatusDashboardService:', error);
      this.generateInitialData();
    }
  }

  /**
   * Gerar dados iniciais para demonstração
   */
  private generateInitialData(): void {
    // System Health
    this.dashboardData.systemHealth = {
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 89,
      status: 'healthy',
      uptime: Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60) // 2 dias atrás
    };

    // Projects
    this.dashboardData.projects = [
      {
        id: 'proj_001',
        name: 'Treinamento NR12 - Segurança',
        status: 'processing',
        progress: 75,
        lastModified: new Date(Date.now() - 300000), // 5 min atrás
        type: 'pptx',
        priority: 'high',
        estimatedCompletion: new Date(Date.now() + 600000) // 10 min
      },
      {
        id: 'proj_002',
        name: 'Vídeo Institucional',
        status: 'completed',
        progress: 100,
        lastModified: new Date(Date.now() - 1800000), // 30 min atrás
        type: 'video',
        priority: 'medium'
      },
      {
        id: 'proj_003',
        name: 'Template Corporativo',
        status: 'error',
        progress: 40,
        lastModified: new Date(Date.now() - 900000), // 15 min atrás
        type: 'template',
        priority: 'urgent',
        errors: ['Falha na renderização', 'Arquivo corrompido']
      }
    ];

    // Action History
    this.dashboardData.actionHistory = [
      {
        id: 'action_001',
        action: 'Conversão PPTX iniciada',
        timestamp: new Date(Date.now() - 180000),
        user: 'Sistema',
        target: 'Treinamento NR12',
        status: 'success',
        duration: 45000
      },
      {
        id: 'action_002',
        action: 'Upload de mídia',
        timestamp: new Date(Date.now() - 360000),
        user: 'Admin',
        target: 'arquivo_video.mp4',
        status: 'success',
        duration: 12000
      },
      {
        id: 'action_003',
        action: 'Erro na renderização',
        timestamp: new Date(Date.now() - 540000),
        user: 'Sistema',
        target: 'Template Corporativo',
        status: 'error',
        details: 'Falha no processamento do slide 15'
      }
    ];

    // Error Metrics
    this.dashboardData.errorMetrics = {
      total: 12,
      byType: {
        'conversion': 5,
        'upload': 3,
        'render': 2,
        'network': 2
      },
      bySeverity: {
        'low': 4,
        'medium': 5,
        'high': 2,
        'critical': 1
      },
      resolved: 9,
      pending: 3,
      trend: 'down'
    };

    // Performance Metrics
    this.dashboardData.performanceMetrics = {
      responseTime: 245,
      throughput: 1250,
      errorRate: 2.3,
      successRate: 97.7,
      avgProcessingTime: 35000,
      peakUsage: 78,
      trends: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        values: [65, 59, 80, 81, 56, 55]
      }
    };
  }

  /**
   * Subscrever para atualizações de dados
   */
  public subscribe(callback: (data: DashboardData) => void): () => void {
    this.subscribers.push(callback);
    
    // Enviar dados atuais imediatamente
    callback(this.dashboardData);
    
    // Retornar função de unsubscribe
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notificar todos os subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.dashboardData });
      } catch (error) {
        console.error('Erro ao notificar subscriber:', error);
      }
    });
  }

  /**
   * Atualizar dados do sistema
   */
  public async refreshData(): Promise<void> {
    try {
      await Promise.all([
        this.updateSystemHealth(),
        this.updateProjects(),
        this.updatePerformanceMetrics(),
        this.updateErrorMetrics()
      ]);

      // Salvar no localStorage
      this.saveToLocalStorage();
      
      // Notificar subscribers
      this.notifySubscribers();

    } catch (error) {
      console.error('Erro ao atualizar dados do dashboard:', error);
      this.addActionHistory({
        action: 'Erro na atualização do dashboard',
        user: 'Sistema',
        target: 'StatusDashboard',
        status: 'error',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Atualizar métricas de saúde do sistema
   */
  private async updateSystemHealth(): Promise<void> {
    try {
      // Simular coleta de métricas reais do sistema
      // Em uma implementação real, isso coletaria dados do servidor/sistema
      
      const prevHealth = this.dashboardData.systemHealth;
      
      this.dashboardData.systemHealth = {
        cpu: Math.max(0, Math.min(100, prevHealth.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prevHealth.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(0, Math.min(100, prevHealth.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, prevHealth.network + (Math.random() - 0.5) * 15)),
        status: this.calculateSystemStatus(),
        uptime: prevHealth.uptime + (this.refreshRate / 1000)
      };

    } catch (error) {
      console.error('Erro ao atualizar saúde do sistema:', error);
    }
  }

  /**
   * Calcular status geral do sistema
   */
  private calculateSystemStatus(): 'healthy' | 'warning' | 'critical' {
    const { cpu, memory, disk, network } = this.dashboardData.systemHealth;
    const avgUsage = (cpu + memory + disk + network) / 4;
    
    if (avgUsage > 85) return 'critical';
    if (avgUsage > 70) return 'warning';
    return 'healthy';
  }

  /**
   * Atualizar status dos projetos
   */
  private async updateProjects(): Promise<void> {
    try {
      this.dashboardData.projects = this.dashboardData.projects.map(project => {
        if (project.status === 'processing') {
          const newProgress = Math.min(100, project.progress + Math.random() * 5);
          
          // Atualizar estimativa de conclusão
          const progressRate = newProgress - project.progress;
          const remainingProgress = 100 - newProgress;
          const estimatedTime = remainingProgress / Math.max(progressRate, 0.1) * this.refreshRate;
          
          return {
            ...project,
            progress: newProgress,
            lastModified: new Date(),
            status: newProgress >= 100 ? 'completed' : 'processing',
            estimatedCompletion: newProgress < 100 ? 
              new Date(Date.now() + estimatedTime) : undefined
          };
        }
        return project;
      });

    } catch (error) {
      console.error('Erro ao atualizar projetos:', error);
    }
  }

  /**
   * Atualizar métricas de performance
   */
  private async updatePerformanceMetrics(): Promise<void> {
    try {
      const prev = this.dashboardData.performanceMetrics;
      
      this.dashboardData.performanceMetrics = {
        ...prev,
        responseTime: Math.max(50, prev.responseTime + (Math.random() - 0.5) * 50),
        throughput: Math.max(0, prev.throughput + (Math.random() - 0.5) * 200),
        errorRate: Math.max(0, Math.min(10, prev.errorRate + (Math.random() - 0.5) * 0.5)),
        successRate: 100 - this.dashboardData.performanceMetrics.errorRate,
        avgProcessingTime: Math.max(1000, prev.avgProcessingTime + (Math.random() - 0.5) * 5000),
        peakUsage: Math.max(0, Math.min(100, prev.peakUsage + (Math.random() - 0.5) * 10))
      };

    } catch (error) {
      console.error('Erro ao atualizar métricas de performance:', error);
    }
  }

  /**
   * Atualizar métricas de erro
   */
  private async updateErrorMetrics(): Promise<void> {
    try {
      // Simular mudanças nas métricas de erro
      const currentPending = this.dashboardData.errorMetrics.pending;
      const resolution = Math.random() > 0.7; // 30% chance de resolver erro
      
      if (resolution && currentPending > 0) {
        this.dashboardData.errorMetrics.pending -= 1;
        this.dashboardData.errorMetrics.resolved += 1;
        
        this.addActionHistory({
          action: 'Erro resolvido automaticamente',
          user: 'Sistema',
          target: 'Sistema de Monitoramento',
          status: 'success'
        });
      }

      // Atualizar tendência
      this.dashboardData.errorMetrics.trend = 
        this.dashboardData.errorMetrics.pending < 5 ? 'down' :
        this.dashboardData.errorMetrics.pending > 10 ? 'up' : 'stable';

    } catch (error) {
      console.error('Erro ao atualizar métricas de erro:', error);
    }
  }

  /**
   * Adicionar item ao histórico de ações
   */
  public addActionHistory(action: Omit<ActionHistoryItem, 'id' | 'timestamp'>): void {
    const historyItem: ActionHistoryItem = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...action
    };

    this.dashboardData.actionHistory.unshift(historyItem);
    
    // Manter apenas os últimos 50 itens
    if (this.dashboardData.actionHistory.length > 50) {
      this.dashboardData.actionHistory = this.dashboardData.actionHistory.slice(0, 50);
    }

    this.notifySubscribers();
  }

  /**
   * Atualizar status de um projeto específico
   */
  public updateProjectStatus(projectId: string, updates: Partial<ProjectStatus>): void {
    const projectIndex = this.dashboardData.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      this.dashboardData.projects[projectIndex] = {
        ...this.dashboardData.projects[projectIndex],
        ...updates,
        lastModified: new Date()
      };

      this.addActionHistory({
        action: `Projeto ${updates.status || 'atualizado'}`,
        user: 'Sistema',
        target: this.dashboardData.projects[projectIndex].name,
        status: updates.status === 'error' ? 'error' : 'success'
      });

      this.notifySubscribers();
    }
  }

  /**
   * Adicionar novo projeto
   */
  public addProject(project: Omit<ProjectStatus, 'id' | 'lastModified'>): string {
    const newProject: ProjectStatus = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastModified: new Date(),
      ...project
    };

    this.dashboardData.projects.unshift(newProject);
    
    this.addActionHistory({
      action: 'Novo projeto criado',
      user: 'Sistema',
      target: newProject.name,
      status: 'success'
    });

    this.notifySubscribers();
    return newProject.id;
  }

  /**
   * Remover projeto
   */
  public removeProject(projectId: string): void {
    const projectIndex = this.dashboardData.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      const project = this.dashboardData.projects[projectIndex];
      this.dashboardData.projects.splice(projectIndex, 1);
      
      this.addActionHistory({
        action: 'Projeto removido',
        user: 'Sistema',
        target: project.name,
        status: 'success'
      });

      this.notifySubscribers();
    }
  }

  /**
   * Configurar auto-refresh
   */
  public setAutoRefresh(enabled: boolean, rate?: number): void {
    this.autoRefresh = enabled;
    if (rate) this.refreshRate = rate;

    if (enabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  /**
   * Iniciar auto-refresh
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh(); // Parar qualquer refresh anterior
    
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.refreshData();
      }, this.refreshRate);
    }
  }

  /**
   * Parar auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Salvar dados no localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const dataToSave = {
        systemHealth: this.dashboardData.systemHealth,
        projects: this.dashboardData.projects,
        errorMetrics: this.dashboardData.errorMetrics,
        performanceMetrics: this.dashboardData.performanceMetrics
      };
      
      localStorage.setItem('statusDashboardData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  /**
   * Obter dados atuais
   */
  public getCurrentData(): DashboardData {
    return { ...this.dashboardData };
  }

  /**
   * Resetar dados
   */
  public resetData(): void {
    localStorage.removeItem('statusDashboardData');
    this.generateInitialData();
    this.notifySubscribers();
  }

  /**
   * Destruir instância (cleanup)
   */
  public destroy(): void {
    this.stopAutoRefresh();
    this.subscribers = [];
    this.saveToLocalStorage();
  }
}

// Interface para dados completos do dashboard
export interface DashboardData {
  systemHealth: SystemHealth;
  projects: ProjectStatus[];
  actionHistory: ActionHistoryItem[];
  errorMetrics: ErrorMetrics;
  performanceMetrics: PerformanceMetrics;
}

// Export da instância singleton
export const statusDashboardService = StatusDashboardService.getInstance();