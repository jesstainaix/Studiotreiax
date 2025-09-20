import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Star, 
  Activity, 
  Calendar, 
  FileText,
  Download,
  Share2,
  Eye,
  Play
} from 'lucide-react';
import { Project, ProjectStats } from '../../types/project';
import { projectService } from '../../services/projectService';
import { toast } from 'sonner';

interface ProjectDashboardProps {
  onNavigateToProject?: (projectId: string) => void;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalViews: number;
  totalShares: number;
  totalDownloads: number;
  recentActivity: ActivityItem[];
  topProjects: Project[];
  projectsByMonth: { month: string; count: number }[];
}

interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'shared' | 'exported' | 'viewed';
  projectId: string;
  projectName: string;
  timestamp: Date;
  user?: string;
}

export function ProjectDashboard({ onNavigateToProject }: ProjectDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas básicas
      const basicStats = await projectService.getStats();
      
      // Carregar projetos recentes
      const recentProjects = await projectService.getProjects({
        page: 1,
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });

      // Simular dados de atividade (em produção, viria do backend)
      const mockActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'created',
          projectId: 'proj1',
          projectName: 'Projeto Marketing Q4',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: 'João Silva'
        },
        {
          id: '2',
          type: 'updated',
          projectId: 'proj2',
          projectName: 'Campanha Verão',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: 'Maria Santos'
        },
        {
          id: '3',
          type: 'shared',
          projectId: 'proj3',
          projectName: 'Tutorial Produto',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: 'Pedro Costa'
        }
      ];

      // Simular dados de projetos por mês
      const mockMonthlyData = [
        { month: 'Jan', count: 12 },
        { month: 'Fev', count: 18 },
        { month: 'Mar', count: 15 },
        { month: 'Abr', count: 22 },
        { month: 'Mai', count: 28 },
        { month: 'Jun', count: 25 }
      ];

      setStats({
        totalProjects: basicStats.total,
        activeProjects: basicStats.active,
        completedProjects: basicStats.completed,
        totalViews: 1250,
        totalShares: 89,
        totalDownloads: 156,
        recentActivity: mockActivity,
        topProjects: recentProjects.projects.slice(0, 5),
        projectsByMonth: mockMonthlyData
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'created': return <FileText className="w-4 h-4 text-green-500" />;
      case 'updated': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'shared': return <Share2 className="w-4 h-4 text-purple-500" />;
      case 'exported': return <Download className="w-4 h-4 text-orange-500" />;
      case 'viewed': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'created': return 'criou o projeto';
      case 'updated': return 'atualizou o projeto';
      case 'shared': return 'compartilhou o projeto';
      case 'exported': return 'exportou o projeto';
      case 'viewed': return 'visualizou o projeto';
      default: return 'interagiu com o projeto';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Projetos</h1>
          <p className="text-gray-600">Visão geral das suas atividades e estatísticas</p>
        </div>
        
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : range === '90d' ? '90 dias' : '1 ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
            </div>
            <Download className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de projetos por mês */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Projetos por Mês</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {stats.projectsByMonth.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.count / Math.max(...stats.projectsByMonth.map(d => d.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{getActivityText(activity)}{' '}
                    <button
                      onClick={() => onNavigateToProject?.(activity.projectId)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {activity.projectName}
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projetos em destaque */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Projetos em Destaque</h3>
          <Star className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.topProjects.map((project) => (
            <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                <button
                  onClick={() => onNavigateToProject?.(project.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
              
              {project.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Atualizado {formatTimeAgo(new Date(project.updatedAt))}</span>
                <span className={`px-2 py-1 rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status === 'active' ? 'Ativo' :
                   project.status === 'completed' ? 'Concluído' : 'Rascunho'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}