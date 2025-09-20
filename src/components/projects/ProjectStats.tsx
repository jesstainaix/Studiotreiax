import { 
  BarChart3, 
  Clock, 
  FileText, 
  TrendingUp, 
  Award,
  Target,
  Users
} from 'lucide-react'
import type { ProjectStats } from '../../types/project'

interface ProjectStatsProps {
  stats?: ProjectStats
  loading?: boolean
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-500'
    case 'in_progress':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'published':
      return 'bg-purple-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Rascunhos'
    case 'in_progress':
      return 'Em Progresso'
    case 'completed':
      return 'Concluídos'
    case 'published':
      return 'Publicados'
    default:
      return status
  }
}

export default function ProjectStats({ stats, loading = false }: ProjectStatsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de projetos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        {/* Duração total */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Duração Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalDuration)}</p>
            </div>
          </div>
        </div>

        {/* Tempo médio */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.averageCompletionTime)}</p>
            </div>
          </div>
        </div>

        {/* Projetos concluídos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byStatus.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Status</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = stats.totalProjects > 0 
                ? Math.round((count / stats.totalProjects) * 100) 
                : 0
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-3`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Distribuição por categoria NR */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Categorias NR Mais Usadas</h3>
          </div>
          
          {Object.keys(stats.byCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => {
                  const percentage = stats.totalProjects > 0 
                    ? Math.round((count / stats.totalProjects) * 100) 
                    : 0
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {category}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-6">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum projeto criado ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Templates mais usados */}
      {stats.mostUsedTemplates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Templates Mais Utilizados</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.mostUsedTemplates.map((template, index) => (
              <div key={template.templateId} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {template.templateName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {template.usageCount} {template.usageCount === 1 ? 'uso' : 'usos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}