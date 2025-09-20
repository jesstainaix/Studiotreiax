import React from 'react'
import { 
  Play, 
  Edit3, 
  Share2, 
  Download, 
  MoreVertical, 
  Clock, 
  FileText, 
  Eye,
  Copy,
  Trash2,
  Calendar
} from 'lucide-react'
import type { Project } from '../../types/project'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onPreview: (project: Project) => void
  onDuplicate: (project: Project) => void
  onShare: (project: Project) => void
  onDelete: (project: Project) => void
  onExport: (project: Project) => void
}

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'published':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getStatusLabel = (status: Project['status']) => {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'in_progress':
      return 'Em Progresso'
    case 'completed':
      return 'Concluído'
    case 'published':
      return 'Publicado'
    default:
      return status
  }
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default function ProjectCard({
  project,
  onEdit,
  onPreview,
  onDuplicate,
  onShare,
  onDelete,
  onExport
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl overflow-hidden">
        {project.thumbnailUrl ? (
          <img 
            src={project.thumbnailUrl} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">{project.nrCategory}</p>
            </div>
          </div>
        )}
        
        {/* Overlay com botões */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              onClick={() => onPreview(project)}
              className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg transition-colors"
              title="Visualizar"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(project)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {project.status === 'completed' && (
              <button
                onClick={() => onPreview(project)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                title="Reproduzir"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Menu dropdown */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onEdit(project)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  onDuplicate(project)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>
              <button
                onClick={() => {
                  onShare(project)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              {project.status === 'completed' && (
                <button
                  onClick={() => {
                    onExport(project)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}
              <hr className="my-1" />
              <button
                onClick={() => {
                  onDelete(project)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Metadados */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(project.duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{project.slidesCount} slides</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Difficulty info */}
        <div className="text-xs text-gray-500 mb-3">
          Dificuldade: <span className="font-medium">{project.difficulty}</span>
        </div>

        {/* Ações principais */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(project)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => onPreview(project)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(project)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}