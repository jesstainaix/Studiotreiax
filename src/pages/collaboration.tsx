import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import Navigation from '../components/Navigation'
import CollaborationDashboard from '../components/collaboration/CollaborationDashboard'
import CommentSystem from '../components/collaboration/CommentSystem'
import ApprovalWorkflow from '../components/collaboration/ApprovalWorkflow'
import TeamManagement from '../components/collaboration/TeamManagement'
import RealTimeCollaboration from '../components/collaboration/RealTimeCollaboration'
import NotificationSystem from '../components/collaboration/NotificationSystem'
import { collaborationService } from '../services/collaborationService'
import { 
  Users, 
  MessageSquare, 
  FileCheck, 
  Settings, 
  Activity,
  ArrowLeft,
  Share2,
  Bell
} from 'lucide-react'
import { User, Project } from '../types'

export default function CollaborationPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentUser] = useState<User>({
    id: '1',
    name: 'Usuário Atual',
    email: 'user@example.com',
    avatar: '',
    role: 'admin'
  })

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const mockProject: Project = {
        id: projectId!,
        title: 'Projeto de Colaboração',
        description: 'Projeto com recursos de colaboração em equipe',
        category: 'NR-10',
        status: 'inProgress',
        duration: '45 min',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-22',
        thumbnail: '',
        progress: 75,
        collaborators: 3,
        views: 890,
        isPublic: false,
        ownerId: '1',
        hasActiveCollaboration: true,
        pendingApprovals: 1,
        unreadComments: 2,
        lastActivity: '2024-01-22T14:15:00Z'
      }
      setProject(mockProject)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject)
  }

  const handleBackToProjects = () => {
    navigate('/projects')
  }

  const handleEditProject = () => {
    navigate(`/editor/${projectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="projects" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando projeto...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="projects" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h2>
            <p className="text-gray-600 mb-6">O projeto solicitado não existe ou você não tem permissão para acessá-lo.</p>
            <Button onClick={handleBackToProjects}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="projects" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBackToProjects}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Projetos
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-gray-600">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationSystem projectId={project.id} currentUser={currentUser} />
              <Button onClick={handleEditProject}>
                Editar Projeto
              </Button>
            </div>
          </div>
          
          {/* Project Status */}
          <div className="flex items-center space-x-4">
            <Badge className={`${
              project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              project.status === 'inProgress' ? 'bg-blue-100 text-blue-800' :
              project.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {project.status === 'draft' ? 'Rascunho' :
               project.status === 'inProgress' ? 'Em Progresso' :
               project.status === 'completed' ? 'Concluído' : 'Publicado'}
            </Badge>
            <Badge variant="secondary">{project.category}</Badge>
            {project.hasActiveCollaboration && (
              <Badge variant="outline" className="text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Colaboração Ativa
              </Badge>
            )}
            {project.pendingApprovals! > 0 && (
              <Badge variant="outline" className="text-orange-600">
                <FileCheck className="w-3 h-3 mr-1" />
                {project.pendingApprovals} Aprovações Pendentes
              </Badge>
            )}
            {project.unreadComments! > 0 && (
              <Badge variant="outline" className="text-blue-600">
                <MessageSquare className="w-3 h-3 mr-1" />
                {project.unreadComments} Comentários
              </Badge>
            )}
          </div>
        </div>

        {/* Real-time Collaboration Component */}
        <div className="mb-6">
          <RealTimeCollaboration
            projectId={project.id}
            currentUser={currentUser}
            onLiveUpdate={(update) => {
              console.log('Live update:', update)
            }}
          />
        </div>

        {/* Collaboration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Equipe</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Comentários</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4" />
              <span>Aprovações</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CollaborationDashboard
              project={project}
              currentUser={currentUser}
              onProjectUpdate={handleProjectUpdate}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement
              project={project}
              currentUser={currentUser}
              onProjectUpdate={handleProjectUpdate}
            />
          </TabsContent>

          <TabsContent value="comments">
            <CommentSystem
              projectId={project.id}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalWorkflow
              project={project}
              currentUser={currentUser}
              onProjectUpdate={handleProjectUpdate}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Colaboração</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Configurações de colaboração em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}