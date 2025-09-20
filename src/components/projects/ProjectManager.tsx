import React, { useCallback } from 'react'
import { 
  Plus, 
  Grid3X3, 
  List, 
  BarChart3, 
  RefreshCw,
  AlertCircle,
  FileText,
  Loader2,
  Folder
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import ProjectCard from './ProjectCard'
import ProjectFilters from './ProjectFilters'
import ProjectStats from './ProjectStats'
import { CreateProject } from './CreateProject'
import { ProjectOrganizer } from './ProjectOrganizer'
import { projectService } from '../../services/projectService'
import type { 
  Project, 
  ProjectFilters as ProjectFiltersType, 
  ProjectSortBy,
  ProjectStats as ProjectStatsType
} from '../../types/project'

type ViewMode = 'grid' | 'list' | 'stats' | 'organize'

// Componente memizado para lista de projetos
const ProjectList = React.memo<{
  projects: Project[];
  viewMode: ViewMode;
  onEdit: (project: Project) => void;
  onPreview: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onShare: (project: Project) => void;
  onDelete: (project: Project) => void;
  onExport: (project: Project) => void;
}>(({ projects, viewMode, onEdit, onPreview, onDuplicate, onShare, onDelete, onExport }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={() => onEdit(project)}
            onPreview={() => onPreview(project)}
            onDuplicate={() => onDuplicate(project)}
            onShare={() => onShare(project)}
            onDelete={() => onDelete(project)}
            onExport={() => onExport(project)}
          />
        ))}
      </div>
    );
  }

  return (
          <div className="space-y-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={() => onEdit(project)}
            onPreview={() => onPreview(project)}
            onDuplicate={() => onDuplicate(project)}
            onShare={() => onShare(project)}
            onDelete={() => onDelete(project)}
            onExport={() => onExport(project)}
          />
        ))}
      </div>
  );
});

export default function ProjectManager() {
  const navigate = useNavigate()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [stats, setStats] = React.useState<ProjectStatsType | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [total, setTotal] = React.useState(0)
  const [showCreateProject, setShowCreateProject] = React.useState(false)
  
  const [filters, setFilters] = React.useState<ProjectFiltersType>({})
  const [sort, setSort] = React.useState<ProjectSortBy>('updatedAt_desc')

  // Carregar projetos
  const loadProjects = React.useCallback(async (resetPage = false) => {
    try {
      setLoading(true)
      const currentPage = resetPage ? 1 : page
      if (resetPage) setPage(1)
      
      // Converter ProjectSortBy para o formato esperado pelo serviço
      const [field, direction] = sort.split('_') as [string, 'asc' | 'desc']
      const sortConfig = { field, direction }
      
      const result = await projectService.getProjects(filters, sortConfig, currentPage, 20)
      
      if (resetPage) {
        setProjects(result.projects)
      } else {
        setProjects(prev => [...prev, ...result.projects])
      }
      
      setTotal(result.total)
      setHasMore(result.hasMore)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar projetos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [filters, sort, page])  // Carregar estatísticas
  const loadStats = React.useCallback(async () => {
    try {
      const projectStats = await projectService.getProjectStats()
      setStats(projectStats)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      toast.error('Erro ao carregar estatísticas')
    }
  }, [])

  // Efeitos
  React.useEffect(() => {
    loadProjects(true)
  }, [filters, sort])

  React.useEffect(() => {
    if (viewMode === 'stats') {
      loadStats()
    }
  }, [viewMode, loadStats])

  // Handlers otimizados com useCallback
  const handleFiltersChange = useCallback((newFilters: ProjectFiltersType) => {
    setFilters(newFilters)
  }, [])

  const handleSortChange = useCallback((newSort: ProjectSortBy) => {
    setSort(newSort)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
      loadProjects()
    }
  }, [hasMore, loading, loadProjects])

  const handleCreateProject = useCallback(() => {
    setShowCreateProject(true)
  }, [])

  const handleProjectCreated = useCallback((_projectId: string) => {
    loadProjects(true)
    loadStats()
  }, [loadProjects, loadStats])

  const handleEditProject = useCallback((project: Project) => {
    navigate(`/editor/${project.id}`)
  }, [navigate])

  const handlePreviewProject = useCallback((_project: Project) => {
    // TODO: Implementar preview
    toast.info('Preview em desenvolvimento')
  }, [])

  const handleDuplicateProject = useCallback(async (project: Project) => {
    try {
      await projectService.duplicateProject(project.id)
      toast.success('Projeto duplicado com sucesso')
      loadProjects(true)
    } catch (err) {
      console.error('Erro ao duplicar projeto:', err)
      toast.error('Erro ao duplicar projeto')
    }
  }, [loadProjects])

  const handleShareProject = useCallback((_project: Project) => {
    // TODO: Implementar compartilhamento
    toast.info('Compartilhamento em desenvolvimento')
  }, [])

  const handleDeleteProject = useCallback(async (project: Project) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${project.title}"?`)) {
      return
    }

    try {
      await projectService.deleteProject(project.id)
      toast.success('Projeto excluído com sucesso')
      loadProjects(true)
    } catch (err) {
      console.error('Erro ao excluir projeto:', err)
      toast.error('Erro ao excluir projeto')
    }
  }, [loadProjects])

  const handleExportProject = useCallback((_project: Project) => {
    // TODO: Implementar exportação
    toast.info('Exportação em desenvolvimento')
  }, [])

  const handleRefresh = useCallback(() => {
    loadProjects(true)
    if (viewMode === 'stats') {
      loadStats()
    }
  }, [loadProjects, loadStats, viewMode])

  // Funções para ProjectOrganizer
  const handleProjectSelect = useCallback((project: Project) => {
    navigate(`/editor/${project.id}`)
  }, [navigate])

  const handleProjectUpdate = useCallback(async (project: Project) => {
    try {
      await projectService.updateProject(project.id, project)
      setProjects(prev => prev.map(p => p.id === project.id ? project : p))
      toast.success('Projeto atualizado!')
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
      toast.error('Erro ao atualizar projeto')
    }
  }, [])

  const handleProjectDeleteById = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      await handleDeleteProject(project)
    }
  }, [projects, handleDeleteProject])

  const handleFolderCreate = useCallback(async (folder: any) => {
    try {
      // TODO: Implementar criação de pasta no serviço
      console.log('Criando pasta:', folder)
      toast.info('Criação de pastas em desenvolvimento')
    } catch (error) {
      console.error('Erro ao criar pasta:', error)
      toast.error('Erro ao criar pasta')
    }
  }, [])

  const handleFolderUpdate = useCallback(async (folder: any) => {
    try {
      // TODO: Implementar atualização de pasta no serviço
      console.log('Atualizando pasta:', folder)
      toast.info('Atualização de pastas em desenvolvimento')
    } catch (error) {
      console.error('Erro ao atualizar pasta:', error)
      toast.error('Erro ao atualizar pasta')
    }
  }, [])

  const handleFolderDelete = useCallback(async (folderId: string) => {
    try {
      // TODO: Implementar exclusão de pasta no serviço
      console.log('Excluindo pasta:', folderId)
      toast.info('Exclusão de pastas em desenvolvimento')
    } catch (error) {
      console.error('Erro ao excluir pasta:', error)
      toast.error('Erro ao excluir pasta')
    }
  }, [])

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        onCreateProject={handleCreateProject}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <ProjectFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        sort={sort}
        onSortChange={handleSortChange}
      />
      
      {viewMode === 'stats' && stats && (
        <ProjectStats stats={stats} />
      )}
      
      {viewMode !== 'stats' && (
        <ProjectList
          projects={projects}
          viewMode={viewMode}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onEdit={handleEditProject}
          onPreview={handlePreviewProject}
          onDuplicate={handleDuplicateProject}
          onShare={handleShareProject}
          onDelete={handleDeleteProject}
          onExport={handleExportProject}
        />
      )}
      
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  )
}