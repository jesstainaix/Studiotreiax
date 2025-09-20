import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { 
  Play, 
  Plus, 
  FileVideo, 
  Clock, 
  Users, 
  TrendingUp,
  MoreHorizontal,
  Calendar,
  Download,
  Eye,
  Upload,
  FileText,
  Zap,
  Video
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

interface Project {
  id: string
  title: string
  description: string
  status: 'draft' | 'processing' | 'completed' | 'error'
  created_at: string
  updated_at: string
  duration?: number
  thumbnail?: string
  progress?: number
}

interface DashboardStats {
  totalProjects: number
  completedProjects: number
  totalDuration: number
  thisMonthProjects: number
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    completedProjects: 0,
    totalDuration: 0,
    thisMonthProjects: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Carregar projetos recentes
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
// .eq('user_id', user?.id) // Removido filtro de usuário
        .order('updated_at', { ascending: false })
        .limit(6)

      if (projectsError) throw projectsError

      // Carregar estatísticas
      const { data: allProjects, error: statsError } = await supabase
        .from('projects')
        .select('*')
// .eq('user_id', user?.id) // Removido filtro de usuário

      if (statsError) throw statsError

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const dashboardStats: DashboardStats = {
        totalProjects: allProjects?.length || 0,
        completedProjects: allProjects?.filter(p => p.status === 'completed').length || 0,
        totalDuration: allProjects?.reduce((acc, p) => acc + (p.duration || 0), 0) || 0,
        thisMonthProjects: allProjects?.filter(p => new Date(p.created_at) >= thisMonth).length || 0
      }

      setProjects(projectsData || [])
      setStats(dashboardStats)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      processing: { label: 'Processando', variant: 'default' as const },
      completed: { label: 'Concluído', variant: 'success' as const },
      error: { label: 'Erro', variant: 'destructive' as const }
    }
    
    return statusConfig[status] || statusConfig.draft
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bem-vindo de volta!</p>
        </div>
        <div className="flex gap-3">
          <Link to="/upload">
            <Button className="px-6 py-3 font-medium flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Novo Upload
            </Button>
          </Link>
          <Link to="/templates">
            <Button variant="secondary" className="px-6 py-3 font-medium flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates NR
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-primary-200 transition-all" onClick={() => window.location.href = '/upload'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading">Upload PPTX</CardTitle>
                <CardDescription className="font-body">Transforme apresentações em vídeos</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-secondary-200 transition-all" onClick={() => window.location.href = '/templates'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-secondary-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading">Templates NR</CardTitle>
                <CardDescription className="font-body">Biblioteca de templates de segurança</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-accent-200 transition-all" onClick={() => window.location.href = '/editor'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading">Editor IA</CardTitle>
                <CardDescription className="font-body">Crie vídeos com inteligência artificial</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthProjects} criados este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}% de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Em vídeos produzidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthProjects}</div>
            <p className="text-xs text-muted-foreground">
              Novos projetos criados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projetos Recentes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Projetos Recentes</h2>
          <Link to="/projects">
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Criado em {formatDate(project.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status === 'completed' ? 'Concluído' : 
                         project.status === 'processing' ? 'Processando' : 'Rascunho'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duração:</span>
                      <span>{formatDuration(project.duration || 0)}</span>
                    </div>

                    {project.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progresso:</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link to={`/projects/${project.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Play className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      {project.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
              <p className="text-gray-600 text-center mb-4">
                Comece criando seu primeiro projeto de vídeo
              </p>
              <Link to="/upload">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Projeto
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}