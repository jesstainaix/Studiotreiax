import React, { useState, useEffect, useCallback } from 'react'
import { Users, Settings, Activity, MessageSquare, FileCheck, UserPlus, Share2, Clock } from 'lucide-react'
import { User, Project, CollaborationSession, Comment, ApprovalRequest, TeamMember } from '../../types'
import { collaborationService } from '../../services/collaborationService'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { toast } from 'sonner'
import CommentSystem from './CommentSystem'
import ApprovalWorkflow from './ApprovalWorkflow'
import TeamManagement from './TeamManagement'
import RealTimeCollaboration from './RealTimeCollaboration'
import NotificationSystem from './NotificationSystem'

interface CollaborationDashboardProps {
  project: Project
  currentUser: User
  onProjectUpdate?: (project: Project) => void
}

interface ActivityItemProps {
  activity: {
    id: string
    type: string
    user: User
    action: string
    target?: string
    timestamp: string
  }
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'approval':
        return <FileCheck className="h-4 w-4 text-green-500" />
      case 'team':
        return <UserPlus className="h-4 w-4 text-purple-500" />
      case 'share':
        return <Share2 className="h-4 w-4 text-orange-500" />
      case 'edit':
        return <Activity className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return time.toLocaleDateString('pt-BR')
  }

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.id}`} />
            <AvatarFallback className="text-xs">
              {activity.user.name?.slice(0, 2).toUpperCase() || activity.user.id.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <span className="text-sm font-medium">
            {activity.user.name || activity.user.id}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {activity.action}
          {activity.target && (
            <span className="font-medium text-gray-800"> {activity.target}</span>
          )}
        </p>
        
        <span className="text-xs text-gray-500">
          {formatTimeAgo(activity.timestamp)}
        </span>
      </div>
    </div>
  )
}

interface CollaborationStatsProps {
  stats: {
    totalMembers: number
    activeMembers: number
    pendingComments: number
    pendingApprovals: number
    recentActivity: number
  }
}

const CollaborationStats: React.FC<CollaborationStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Membros da Equipe',
      value: stats.totalMembers,
      subtitle: `${stats.activeMembers} ativos`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Comentários Pendentes',
      value: stats.pendingComments,
      subtitle: 'Aguardando resposta',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Aprovações Pendentes',
      value: stats.pendingApprovals,
      subtitle: 'Aguardando revisão',
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Atividade Recente',
      value: stats.recentActivity,
      subtitle: 'Últimas 24h',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface QuickActionsProps {
  project: Project
  currentUser: User
  onShareProject: () => void
  onInviteMembers: () => void
  onRequestApproval: () => void
}

const QuickActions: React.FC<QuickActionsProps> = ({
  project,
  currentUser,
  onShareProject,
  onInviteMembers,
  onRequestApproval
}) => {
  const actions = [
    {
      label: 'Compartilhar Projeto',
      icon: Share2,
      onClick: onShareProject,
      variant: 'default' as const,
      description: 'Compartilhar com membros da equipe'
    },
    {
      label: 'Convidar Membros',
      icon: UserPlus,
      onClick: onInviteMembers,
      variant: 'outline' as const,
      description: 'Adicionar novos colaboradores'
    },
    {
      label: 'Solicitar Aprovação',
      icon: FileCheck,
      onClick: onRequestApproval,
      variant: 'outline' as const,
      description: 'Enviar para revisão'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              variant={action.variant}
              className="w-full justify-start h-auto p-4"
              onClick={action.onClick}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({
  project,
  currentUser,
  onProjectUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [activeSessions, setActiveSessions] = useState<CollaborationSession[]>([])
  const [recentComments, setRecentComments] = useState<Comment[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingComments: 0,
    pendingApprovals: 0,
    recentActivity: 0
  })

  const loadCollaborationData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [members, sessions, comments, approvals, activity] = await Promise.all([
        collaborationService.getTeamMembers(project.id),
        collaborationService.getActiveSessions(project.id),
        collaborationService.getComments(project.id),
        collaborationService.getApprovalRequests(project.id),
        collaborationService.getActivityLog(project.id, { limit: 20 })
      ])
      
      setTeamMembers(members)
      setActiveSessions(sessions)
      setRecentComments(comments.slice(0, 10))
      setPendingApprovals(approvals.filter(a => a.status === 'pending'))
      setRecentActivity(activity)
      
      // Calculate stats
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      setStats({
        totalMembers: members.length,
        activeMembers: sessions.filter(s => s.status === 'active').length,
        pendingComments: comments.filter(c => !c.resolved).length,
        pendingApprovals: approvals.filter(a => a.status === 'pending').length,
        recentActivity: activity.filter(a => new Date(a.timestamp) > oneDayAgo).length
      })
    } catch (error) {
      console.error('Error loading collaboration data:', error)
      toast.error('Erro ao carregar dados de colaboração')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  const handleShareProject = useCallback(async () => {
    try {
      const shareUrl = await collaborationService.shareProject(project.id, {
        permissions: ['view', 'comment'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link de compartilhamento copiado para a área de transferência')
    } catch (error) {
      console.error('Error sharing project:', error)
      toast.error('Erro ao compartilhar projeto')
    }
  }, [project.id])

  const handleInviteMembers = useCallback(() => {
    setActiveTab('team')
  }, [])

  const handleRequestApproval = useCallback(() => {
    setActiveTab('approvals')
  }, [])

  const handleLiveUpdate = useCallback((update: any) => {
    // Handle real-time updates
    loadCollaborationData()
  }, [loadCollaborationData])

  const handleUserJoin = useCallback((user: User) => {
    toast.success(`${user.name || user.id} entrou na colaboração`)
    loadCollaborationData()
  }, [loadCollaborationData])

  const handleUserLeave = useCallback((userId: string) => {
    const user = teamMembers.find(m => m.user.id === userId)
    if (user) {
      toast.info(`${user.user.name || user.user.id} saiu da colaboração`)
    }
    loadCollaborationData()
  }, [teamMembers, loadCollaborationData])

  useEffect(() => {
    loadCollaborationData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadCollaborationData, 30000)
    
    return () => clearInterval(interval)
  }, [loadCollaborationData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colaboração</h1>
          <p className="text-gray-600">Gerencie a colaboração em equipe para {project.title}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationSystem 
            currentUser={currentUser}
            onNotificationClick={(notification) => {
              // Handle notification clicks
            }}
          />
          <Button onClick={handleShareProject} className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>Compartilhar</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Membros</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Comentários</p>
                <p className="text-2xl font-bold">{stats.pendingComments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovações</p>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Atividade 24h</p>
                <p className="text-2xl font-bold">{stats.recentActivity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions
        project={project}
        currentUser={currentUser}
        onShareProject={handleShareProject}
        onInviteMembers={handleInviteMembers}
        onRequestApproval={handleRequestApproval}
      />
    </div>
  )
}

export default CollaborationDashboard