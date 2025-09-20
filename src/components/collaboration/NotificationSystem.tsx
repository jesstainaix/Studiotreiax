import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, Check, AlertCircle, Users, MessageSquare, FileCheck, UserPlus } from 'lucide-react'
import { CollaborationNotification, User } from '../../types'
import { collaborationService } from '../../services/collaborationService'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface NotificationSystemProps {
  currentUser: User
  onNotificationClick?: (notification: CollaborationNotification) => void
}

interface NotificationItemProps {
  notification: CollaborationNotification
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  onClick?: (notification: CollaborationNotification) => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  onClick
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'approval_request':
      case 'approval_approved':
      case 'approval_rejected':
        return <FileCheck className="h-4 w-4 text-green-500" />
      case 'team_invite':
      case 'team_joined':
      case 'team_left':
        return <UserPlus className="h-4 w-4 text-purple-500" />
      case 'project_shared':
        return <Users className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'border-l-blue-500'
      case 'approval_request':
        return 'border-l-yellow-500'
      case 'approval_approved':
        return 'border-l-green-500'
      case 'approval_rejected':
        return 'border-l-red-500'
      case 'team_invite':
      case 'team_joined':
        return 'border-l-purple-500'
      case 'project_shared':
        return 'border-l-orange-500'
      default:
        return 'border-l-gray-500'
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

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    onClick?.(notification)
  }

  return (
    <div
      className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
        notification.read ? 'bg-gray-50' : 'bg-white'
      } hover:bg-gray-50 cursor-pointer transition-colors`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${
              notification.read ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {notification.title}
            </p>
            
            <div className="flex items-center space-x-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(notification.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <p className={`text-sm mt-1 ${
            notification.read ? 'text-gray-500' : 'text-gray-700'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(notification.timestamp)}
            </span>
            
            {notification.actionUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick?.(notification)
                }}
              >
                Ver
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
}

const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2"
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}

interface NotificationFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: Record<string, number>
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeFilter,
  onFilterChange,
  counts
}) => {
  const filters = [
    { key: 'all', label: 'Todas', count: counts.all },
    { key: 'comment', label: 'Comentários', count: counts.comment },
    { key: 'approval', label: 'Aprovações', count: counts.approval },
    { key: 'team', label: 'Equipe', count: counts.team },
    { key: 'project', label: 'Projetos', count: counts.project }
  ]

  return (
    <div className="flex space-x-1 p-2 bg-gray-50 rounded-lg">
      {filters.map(filter => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? 'default' : 'ghost'}
          size="sm"
          className="text-xs"
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label}
          {filter.count > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  )
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  currentUser,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const userNotifications = await collaborationService.getNotifications(currentUser.id)
      setNotifications(userNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [currentUser.id])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await collaborationService.markNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id)
      
      await Promise.all(
        unreadIds.map(id => collaborationService.markNotificationAsRead(id))
      )
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }, [notifications])

  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      await collaborationService.dismissNotification(notificationId)
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error) {
      console.error('Error dismissing notification:', error)
      toast.error('Erro ao dispensar notificação')
    }
  }, [])

  const handleNotificationClick = useCallback((notification: CollaborationNotification) => {
    onNotificationClick?.(notification)
    
    // Handle specific notification actions
    if (notification.actionUrl) {
      // Navigate to URL
    }
    
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }, [onNotificationClick, markAsRead])

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications
    return notifications.filter(n => n.type === activeFilter)
  }, [notifications, activeFilter])

  const unreadCount = notifications.filter(n => !n.read).length

  const filterCounts = useMemo(() => ({
    all: notifications.length,
    comment: notifications.filter(n => n.type === 'comment').length,
    approval: notifications.filter(n => n.type === 'approval').length,
    team: notifications.filter(n => n.type === 'team').length,
    project: notifications.filter(n => n.type === 'project').length
  }), [notifications])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationBell 
            unreadCount={unreadCount} 
            onClick={() => setIsOpen(!isOpen)} 
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Carregando...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
                onDismiss={dismissNotification}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}