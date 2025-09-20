import { createElement, ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video
} from 'lucide-react';

export interface DashboardProject {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'processing' | 'completed';
  duration: string;
  createdAt: string;
  thumbnail?: string;
}

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  route: string;
  color: string;
  status: 'active' | 'beta' | 'coming-soon';
  category: string;
}

export interface DashboardQuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: ReactNode;
}

export interface DashboardNRCategory {
  nr: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  projectCount: number;
  completionRate: number;
  priority: 'high' | 'medium' | 'low';
  lastUpdated: string;
  templates: number;
  activeProjects: number;
}

export interface DashboardDataPayload {
  quickStats: DashboardQuickStat[];
  projects: DashboardProject[];
  modules: DashboardModule[];
  nrCategories: DashboardNRCategory[];
  recentProjects: DashboardProject[];
}

export class DashboardOptimizationService {
  private memoryCache: Map<string, unknown> = new Map();
  private lastUpdate: Map<string, number> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.setupPerformanceMonitoring();
  }

  private setupPerformanceMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
        console.log('🚀 Tempo de carregamento inicial (ms):', loadTime);
      });
    }
  }

  private getCached<T>(key: string): T | null {
    const now = Date.now();
    const lastUpdate = this.lastUpdate.get(key) || 0;

    if (now - lastUpdate > this.cacheTimeout) {
      this.memoryCache.delete(key);
      this.lastUpdate.delete(key);
      return null;
    }

    return (this.memoryCache.get(key) as T) || null;
  }

  private setCache<T>(key: string, data: T): void {
    this.memoryCache.set(key, data);
    this.lastUpdate.set(key, Date.now());
  }

  async loadDashboardData(): Promise<DashboardDataPayload> {
    const cached = this.getCached<DashboardDataPayload>('dashboard-data');
    if (cached) {
      return cached;
    }

    const projects = this.buildProjects();
    const payload: DashboardDataPayload = {
      quickStats: this.buildQuickStats(),
      projects,
      modules: this.buildModules(),
      nrCategories: this.buildNRCategories(),
      recentProjects: projects.slice(0, 6)
    };

    this.setCache('dashboard-data', payload);
    return payload;
  }

  trackPerformance(metric: string, duration: number) {
    console.log(`[DashboardOptimizationService] ${metric} levou ${duration.toFixed(2)}ms`);
  }

  getPerformanceMetrics() {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    return {
      loadTime: navigation.loadEventEnd - navigation.startTime,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime
    };
  }

  clearCache() {
    this.memoryCache.clear();
    this.lastUpdate.clear();
  }

  private buildQuickStats(): DashboardQuickStat[] {
    return [
      {
        label: 'Projetos ativos',
        value: '18',
        change: '+12%',
        trend: 'up',
        icon: createElement(Activity, { className: 'h-5 w-5' })
      },
      {
        label: 'Tempo médio de produção',
        value: '08:32',
        change: '-5%',
        trend: 'down',
        icon: createElement(Clock, { className: 'h-5 w-5' })
      },
      {
        label: 'Satisfação do público',
        value: '92%',
        change: '+3%',
        trend: 'up',
        icon: createElement(Users, { className: 'h-5 w-5' })
      },
      {
        label: 'Taxa de conversão',
        value: '37%',
        change: '+6%',
        trend: 'up',
        icon: createElement(TrendingUp, { className: 'h-5 w-5' })
      }
    ];
  }

  private buildProjects(): DashboardProject[] {
    const now = Date.now();

    return [
      {
        id: 'proj-001',
        title: 'Treinamento NR-12 completo',
        category: 'Normas Regulamentadoras',
        status: 'processing',
        duration: '12:45',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: '/images/projects/nr12.png'
      },
      {
        id: 'proj-002',
        title: 'Campanha segurança elétrica',
        category: 'Campanhas internas',
        status: 'completed',
        duration: '08:20',
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: '/images/projects/nr10.png'
      },
      {
        id: 'proj-003',
        title: 'Onboarding novos colaboradores',
        category: 'Onboarding',
        status: 'draft',
        duration: '05:10',
        createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: '/images/projects/onboarding.png'
      },
      {
        id: 'proj-004',
        title: 'Procedimentos emergenciais',
        category: 'Treinamentos de segurança',
        status: 'completed',
        duration: '09:55',
        createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: '/images/projects/emergency.png'
      },
      {
        id: 'proj-005',
        title: 'Operação de máquinas pesadas',
        category: 'Operações industriais',
        status: 'processing',
        duration: '14:30',
        createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: '/images/projects/machines.png'
      },
      {
        id: 'proj-006',
        title: 'Treinamento brigada de incêndio',
        category: 'Treinamentos de segurança',
        status: 'draft',
        duration: '07:15',
        createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: '/images/projects/fire-brigade.png'
      }
    ];
  }

  private buildModules(): DashboardModule[] {
    return [
      {
        id: 'editor',
        title: 'Editor de vídeos',
        description: 'Monte narrativas com timeline avançada e ajustes precisos.',
        icon: createElement(Video, { className: 'h-5 w-5' }),
        route: '/editor',
        color: 'bg-blue-500',
        status: 'active',
        category: 'creation'
      },
      {
        id: 'templates',
        title: 'Biblioteca de templates',
        description: 'Modelos prontos para normas e campanhas internas.',
        icon: createElement(Sparkles, { className: 'h-5 w-5' }),
        route: '/templates',
        color: 'bg-green-500',
        status: 'active',
        category: 'creation'
      },
      {
        id: 'ai-assist',
        title: 'Assistente IA',
        description: 'Sugestões inteligentes de roteiro e ajustes visuais.',
        icon: createElement(Lightbulb, { className: 'h-5 w-5' }),
        route: '/ai',
        color: 'bg-purple-500',
        status: 'beta',
        category: 'advanced'
      },
      {
        id: 'performance-dashboard',
        title: 'Painel de performance',
        description: 'Analise métricas e engajamento dos vídeos publicados.',
        icon: createElement(BarChart3, { className: 'h-5 w-5' }),
        route: '/performance-dashboard',
        color: 'bg-cyan-500',
        status: 'active',
        category: 'analytics'
      }
    ];
  }

  private buildNRCategories(): DashboardNRCategory[] {
    const now = Date.now();

    return [
      {
        nr: 'NR-12',
        title: 'Segurança em máquinas',
        description: 'Boas práticas para operação segura de equipamentos.',
        color: 'bg-blue-100 text-blue-800',
        icon: 'ShieldCheck',
        projectCount: 12,
        completionRate: 86,
        priority: 'high',
        lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        templates: 18,
        activeProjects: 5
      },
      {
        nr: 'NR-10',
        title: 'Segurança elétrica',
        description: 'Procedimentos essenciais para trabalhos com eletricidade.',
        color: 'bg-yellow-100 text-yellow-800',
        icon: 'Sparkles',
        projectCount: 9,
        completionRate: 78,
        priority: 'medium',
        lastUpdated: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
        templates: 11,
        activeProjects: 3
      },
      {
        nr: 'NR-35',
        title: 'Trabalho em altura',
        description: 'Treinamentos de segurança para atividades em altura.',
        color: 'bg-purple-100 text-purple-800',
        icon: 'Activity',
        projectCount: 6,
        completionRate: 91,
        priority: 'high',
        lastUpdated: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        templates: 9,
        activeProjects: 2
      },
      {
        nr: 'NR-05',
        title: 'CIPA e prevenção',
        description: 'Materiais educativos para comissões internas de prevenção.',
        color: 'bg-green-100 text-green-800',
        icon: 'Users',
        projectCount: 8,
        completionRate: 74,
        priority: 'medium',
        lastUpdated: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
        templates: 7,
        activeProjects: 4
      }
    ];
  }
}

export default DashboardOptimizationService;