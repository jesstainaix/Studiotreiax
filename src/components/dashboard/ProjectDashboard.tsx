import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import {
  Plus,
  Search,
  Filter,
  Share2,
  Users,
  Clock,
  Star,
  Folder,
  Video,
  Download,
  Upload,
  Settings,
  Trash2,
  Copy,
  Eye,
  Lock,
  Unlock,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  description: string
  thumbnail: string
  duration: number
  resolution: string
  fps: number
  status: 'draft' | 'in_progress' | 'review' | 'completed'
  visibility: 'private' | 'team' | 'public'
  owner: {
    id: string
    name: string
    avatar: string
  }
  collaborators: Array<{
    id: string
    name: string
    avatar: string
    role: 'owner' | 'editor' | 'viewer'
  }>
  tags: string[]
  createdAt: string
  updatedAt: string
  lastAccessed: string
  size: number
  shareLinks: Array<{
    id: string
    url: string
    permissions: string[]
    expiresAt?: string
    password?: boolean
  }>
}

interface ProjectDashboardProps {
  className?: string
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ className = '' }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVisibility, setFilterVisibility] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updatedAt')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mock data
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Campanha de Marketing Q4',
      description: 'Vídeo promocional para o último trimestre',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20marketing%20video%20thumbnail%20professional%20corporate&image_size=landscape_16_9',
      duration: 120,
      resolution: '1920x1080',
      fps: 30,
      status: 'in_progress',
      visibility: 'team',
      owner: {
        id: 'user1',
        name: 'Ana Silva',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20business&image_size=square'
      },
      collaborators: [
        {
          id: 'user2',
          name: 'João Santos',
          avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20avatar%20business&image_size=square',
          role: 'editor'
        }
      ],
      tags: ['marketing', 'corporativo', 'q4'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      lastAccessed: '2024-01-20T15:30:00Z',
      size: 2500000000,
      shareLinks: []
    },
    {
      id: '2',
      name: 'Tutorial de Produto',
      description: 'Demonstração das novas funcionalidades',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tutorial%20video%20thumbnail%20educational%20tech&image_size=landscape_16_9',
      duration: 300,
      resolution: '1920x1080',
      fps: 60,
      status: 'completed',
      visibility: 'public',
      owner: {
        id: 'user1',
        name: 'Ana Silva',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20business&image_size=square'
      },
      collaborators: [],
      tags: ['tutorial', 'produto', 'educacional'],
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T14:20:00Z',
      lastAccessed: '2024-01-19T11:15:00Z',
      size: 1800000000,
      shareLinks: [
        {
          id: 'link1',
          url: 'https://share.studio.com/abc123',
          permissions: ['view', 'comment'],
          expiresAt: '2024-02-15T00:00:00Z'
        }
      ]
    }
  ]

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      try {
        // Simular carregamento
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProjects(mockProjects)
        setFilteredProjects(mockProjects)
      } catch (error) {
        toast.error('Erro ao carregar projetos')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Filter and search projects
  useEffect(() => {
    let filtered = projects

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus)
    }

    // Visibility filter
    if (filterVisibility !== 'all') {
      filtered = filtered.filter(project => project.visibility === filterVisibility)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'size':
          return b.size - a.size
        default:
          return 0
      }
    })

    setFilteredProjects(filtered)
  }, [projects, searchTerm, filterStatus, filterVisibility, sortBy])

  const handleCreateProject = useCallback(async (projectData: Partial<Project>) => {
    try {
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectData.name || 'Novo Projeto',
        description: projectData.description || '',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20project%20thumbnail%20creative&image_size=landscape_16_9',
        duration: 0,
        resolution: '1920x1080',
        fps: 30,
        status: 'draft',
        visibility: 'private',
        owner: {
          id: 'current-user',
          name: 'Usuário Atual',
          avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20creative&image_size=square'
        },
        collaborators: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        size: 0,
        shareLinks: []
      }

      setProjects(prev => [newProject, ...prev])
      setShowCreateDialog(false)
      toast.success('Projeto criado com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar projeto')
    }
  }, [])

  const handleShareProject = useCallback(async (project: Project, shareSettings: any) => {
    try {
      const shareLink = {
        id: Date.now().toString(),
        url: `https://share.studio.com/${Math.random().toString(36).substr(2, 9)}`,
        permissions: shareSettings.permissions,
        expiresAt: shareSettings.expiresAt,
        password: shareSettings.password
      }

      setProjects(prev => prev.map(p => 
        p.id === project.id 
          ? { ...p, shareLinks: [...p.shareLinks, shareLink] }
          : p
      ))

      navigator.clipboard.writeText(shareLink.url)
      toast.success('Link de compartilhamento copiado!')
      setShowShareDialog(false)
    } catch (error) {
      toast.error('Erro ao criar link de compartilhamento')
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private': return <Lock className="w-4 h-4" />
      case 'team': return <Users className="w-4 h-4" />
      case 'public': return <Unlock className="w-4 h-4" />
      default: return <Lock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Projetos</h1>
          <p className="text-gray-600">Gerencie e compartilhe seus projetos de vídeo</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <CreateProjectForm onSubmit={handleCreateProject} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Visibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="team">Equipe</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Modificado</SelectItem>
                  <SelectItem value="createdAt">Criado</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="size">Tamanho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative">
              <img
                src={project.thumbnail}
                alt={project.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                {getVisibilityIcon(project.visibility)}
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                {formatDuration(project.duration)}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Video className="w-4 h-4" />
                  <span>{project.resolution}</span>
                  <span>•</span>
                  <span>{project.fps}fps</span>
                  <span>•</span>
                  <span>{formatFileSize(project.size)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <img
                    src={project.owner.avatar}
                    alt={project.owner.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-600">{project.owner.name}</span>
                  {project.collaborators.length > 0 && (
                    <Badge variant="outline" className="ml-auto">
                      +{project.collaborators.length}
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Dialog open={showShareDialog && selectedProject?.id === project.id} onOpenChange={(open) => {
                      setShowShareDialog(open)
                      if (open) setSelectedProject(project)
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Compartilhar Projeto</DialogTitle>
                        </DialogHeader>
                        <ShareProjectForm 
                          project={project} 
                          onSubmit={(settings) => handleShareProject(project, settings)} 
                        />
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro projeto ou ajuste os filtros de busca.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Projeto
          </Button>
        </div>
      )}
    </div>
  )
}

// Create Project Form Component
const CreateProjectForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    template: 'blank'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Projeto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Digite o nome do projeto"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva seu projeto"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="visibility">Visibilidade</Label>
        <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Privado</SelectItem>
            <SelectItem value="team">Equipe</SelectItem>
            <SelectItem value="public">Público</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit">Criar Projeto</Button>
      </div>
    </form>
  )
}

// Share Project Form Component
const ShareProjectForm: React.FC<{ project: Project; onSubmit: (data: any) => void }> = ({ project, onSubmit }) => {
  const [shareSettings, setShareSettings] = useState({
    permissions: ['view'],
    expiresAt: '',
    password: false,
    passwordValue: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(shareSettings)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Permissões</Label>
        <div className="space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="view"
              checked={shareSettings.permissions.includes('view')}
              onChange={(e) => {
                const permissions = e.target.checked 
                  ? [...shareSettings.permissions, 'view']
                  : shareSettings.permissions.filter(p => p !== 'view')
                setShareSettings(prev => ({ ...prev, permissions }))
              }}
            />
            <Label htmlFor="view">Visualizar</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="comment"
              checked={shareSettings.permissions.includes('comment')}
              onChange={(e) => {
                const permissions = e.target.checked 
                  ? [...shareSettings.permissions, 'comment']
                  : shareSettings.permissions.filter(p => p !== 'comment')
                setShareSettings(prev => ({ ...prev, permissions }))
              }}
            />
            <Label htmlFor="comment">Comentar</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="download"
              checked={shareSettings.permissions.includes('download')}
              onChange={(e) => {
                const permissions = e.target.checked 
                  ? [...shareSettings.permissions, 'download']
                  : shareSettings.permissions.filter(p => p !== 'download')
                setShareSettings(prev => ({ ...prev, permissions }))
              }}
            />
            <Label htmlFor="download">Baixar</Label>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="expires">Data de Expiração (opcional)</Label>
        <Input
          id="expires"
          type="datetime-local"
          value={shareSettings.expiresAt}
          onChange={(e) => setShareSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="password"
          checked={shareSettings.password}
          onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, password: checked }))}
        />
        <Label htmlFor="password">Proteger com senha</Label>
      </div>
      
      {shareSettings.password && (
        <div>
          <Label htmlFor="passwordValue">Senha</Label>
          <Input
            id="passwordValue"
            type="password"
            value={shareSettings.passwordValue}
            onChange={(e) => setShareSettings(prev => ({ ...prev, passwordValue: e.target.value }))}
            placeholder="Digite uma senha"
          />
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit">Criar Link</Button>
      </div>
    </form>
  )
}

export default ProjectDashboard