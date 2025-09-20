import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Users, Wifi, WifiOff, Circle, MousePointer, Eye, Edit, Activity } from 'lucide-react'
import { User, CollaborationSession, CursorPosition, LiveUpdate } from '../../types'
import { collaborationService } from '../../services/collaborationService'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
import { toast } from 'sonner'
import { useCursorSync } from '../../hooks/useCursorSync'
import { useRealtimeDebounce } from '../../hooks/useRealtimeDebounce'

interface RealTimeCollaborationProps {
  projectId: string
  slideId?: string
  currentUser: User
  onLiveUpdate?: (update: LiveUpdate) => void
  onUserJoin?: (user: User) => void
  onUserLeave?: (userId: string) => void
}

interface ActiveUserProps {
  user: User
  session: CollaborationSession
  isCurrentUser: boolean
}

const ActiveUser: React.FC<ActiveUserProps> = ({ user, session, isCurrentUser }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'away': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'editing': return <Edit className="h-3 w-3" />
      case 'viewing': return <Eye className="h-3 w-3" />
      default: return <Circle className="h-3 w-3" />
    }
  }

  return (
    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
          <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || user.id.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(session.status)}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <p className="text-sm font-medium truncate">
            {user.name || user.id}
            {isCurrentUser && <span className="text-gray-500 ml-1">(você)</span>}
          </p>
          {getActivityIcon(session.currentActivity)}
        </div>
        
        {session.currentSlide && (
          <p className="text-xs text-gray-500 truncate">
            Slide: {session.currentSlide}
          </p>
        )}
      </div>
      
      <Badge variant="outline" className="text-xs">
        {session.status}
      </Badge>
    </div>
  )
}

interface CursorOverlayProps {
  cursors: Map<string, CursorPosition>
  users: Map<string, User>
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors, users }) => {
  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
  ]

  const getUserColor = (userId: string) => {
    const index = Array.from(users.keys()).indexOf(userId)
    return colors[index % colors.length]
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {Array.from(cursors.entries()).map(([userId, cursor]) => {
        const user = users.get(userId)
        if (!user || !cursor.visible) return null

        return (
          <div
            key={userId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              transform: 'translate(-2px, -2px)'
            }}
          >
            <div className="relative">
              <MousePointer 
                className={`h-5 w-5 ${getUserColor(userId)} text-white`}
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
              />
              
              <div className={`absolute top-5 left-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap ${getUserColor(userId)}`}>
                {user.name || user.id}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface LiveUpdateIndicatorProps {
  updates: LiveUpdate[]
  onDismiss: (updateId: string) => void
}

const LiveUpdateIndicator: React.FC<LiveUpdateIndicatorProps> = ({ updates, onDismiss }) => {
  useEffect(() => {
    updates.forEach(update => {
      const timer = setTimeout(() => {
        onDismiss(update.id)
      }, 5000) // Auto dismiss after 5 seconds

      return () => clearTimeout(timer)
    })
  }, [updates, onDismiss])

  if (updates.length === 0) return null

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {updates.map(update => (
        <Card key={update.id} className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">{update.userId}</span> {update.action}
                {update.elementId && <span className="text-blue-600"> em {update.elementId}</span>}
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {new Date(update.timestamp).toLocaleTimeString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  projectId,
  slideId,
  currentUser,
  onLiveUpdate,
  onUserJoin,
  onUserLeave
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [activeSessions, setActiveSessions] = useState<Map<string, CollaborationSession>>(new Map())
  const [activeUsers, setActiveUsers] = useState<Map<string, User>>(new Map())
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [performanceStats, setPerformanceStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    cursorUpdatesPerSecond: 0
  })
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messageTimestamps = useRef<number[]>([])
  const cursorUpdateCount = useRef<number>(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')
    
    // In a real implementation, this would be your WebSocket server URL
    const wsUrl = `ws://localhost:3001/collaboration/${projectId}?userId=${currentUser.id}&slideId=${slideId || ''}`
    
    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        toast.success('Conectado à colaboração em tempo real')
        
        // Send initial presence
        sendMessage({
          type: 'presence',
          data: {
            userId: currentUser.id,
            user: currentUser,
            slideId,
            status: 'active',
            activity: 'viewing'
          }
        })
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          sendMessage({ type: 'ping' })
        }, 30000)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Erro na conexão de colaboração')
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setConnectionStatus('disconnected')
    }
  }, [projectId, currentUser.id, slideId])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    cleanupCursor()
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [cleanupCursor])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const handleMessage = useCallback((message: any) => {
    // Track message for performance stats
    messageTimestamps.current.push(Date.now())
    
    switch (message.type) {
      case 'user_joined':
        const joinedUser = message.data.user
        const joinedSession = message.data.session
        
        setActiveUsers(prev => new Map(prev.set(joinedUser.id, joinedUser)))
        setActiveSessions(prev => new Map(prev.set(joinedUser.id, joinedSession)))
        
        if (joinedUser.id !== currentUser.id) {
          toast.success(`${joinedUser.name || joinedUser.id} entrou na colaboração`)
          onUserJoin?.(joinedUser)
        }
        break

      case 'user_left':
        const leftUserId = message.data.userId
        
        setActiveUsers(prev => {
          const newMap = new Map(prev)
          newMap.delete(leftUserId)
          return newMap
        })
        
        setActiveSessions(prev => {
          const newMap = new Map(prev)
          newMap.delete(leftUserId)
          return newMap
        })
        
        removeCursor(leftUserId)
        
        if (leftUserId !== currentUser.id) {
          onUserLeave?.(leftUserId)
        }
        break

      case 'cursor_update':
        const { userId, position, timestamp } = message.data
        if (userId !== currentUser.id) {
          processCursorUpdate({ userId, position, timestamp: timestamp || Date.now() })
          cursorUpdateCount.current++
        }
        break

      case 'live_update':
        const update = message.data
        if (update.userId !== currentUser.id) {
          setLiveUpdates(prev => [...prev, update])
          onLiveUpdate?.(update)
        }
        break

      case 'presence_update':
        const { userId: presenceUserId, status, activity, slideId: userSlideId } = message.data
        
        setActiveSessions(prev => {
          const session = prev.get(presenceUserId)
          if (session) {
            return new Map(prev.set(presenceUserId, {
              ...session,
              status,
              currentActivity: activity,
              currentSlide: userSlideId,
              lastActivity: new Date().toISOString()
            }))
          }
          return prev
        })
        break

      case 'initial_state':
        const { users, sessions } = message.data
        
        setActiveUsers(new Map(users.map((user: User) => [user.id, user])))
        setActiveSessions(new Map(sessions.map((session: CollaborationSession) => [session.userId, session])))
        break

      case 'pong':
        // Heartbeat response
        break

      default:
          // Unknown message type
          break
    }
  }, [])

  // Setup collaboration API
  useEffect(() => {
    ;(window as any).collaborationAPI = {
      updatePresence,
      broadcastUpdate,
      isConnected
    }
  }, [updatePresence, broadcastUpdate, isConnected])

  const getConnectionStatusBadge = () => {
    const variants = {
      connecting: { variant: 'secondary' as const, icon: Wifi, text: 'Conectando...', color: 'text-yellow-600' },
      connected: { variant: 'default' as const, icon: Wifi, text: 'Conectado', color: 'text-green-600' },
      disconnected: { variant: 'destructive' as const, icon: WifiOff, text: 'Desconectado', color: 'text-red-600' }
    }
    
    const config = variants[connectionStatus]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  return (
    <>
      {/* Cursor Overlay */}
      <CursorOverlay cursors={cursors} users={activeUsers} />
      
      {/* Live Update Indicators */}
      <LiveUpdateIndicator updates={liveUpdates} onDismiss={dismissUpdate} />
      
      {/* Collaboration Panel */}
      <Card className="w-80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <h3 className="font-medium">Colaboração</h3>
            </div>
            {getConnectionStatusBadge()}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Usuários ativos</span>
              <span>{activeUsers.size}</span>
            </div>
            
            {/* Performance Stats */}
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-1 mb-2">
                <Activity className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Performance</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Msgs/s:</span>
                  <span className="font-mono">{performanceStats.messagesReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cursors/s:</span>
                  <span className="font-mono">{performanceStats.cursorUpdatesPerSecond}</span>
                </div>
              </div>
              
              <div className="mt-1 text-xs text-gray-500">
                Queue: {getStats().queueSize} items
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-1">
              {Array.from(activeUsers.entries()).map(([userId, user]) => {
                const session = activeSessions.get(userId)
                if (!session) return null
                
                return (
                  <ActiveUser
                    key={userId}
                    user={user}
                    session={session}
                    isCurrentUser={userId === currentUser.id}
                  />
                )
              })}
            </div>
            
            {activeUsers.size === 0 && (
              <div className="text-center py-4 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum usuário ativo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default RealTimeCollaboration

// Export utility functions for external use
export const useRealTimeCollaboration = (projectId: string, currentUser: User) => {
  const [isConnected, setIsConnected] = useState(false)
  
  const updatePresence = useCallback((status: string, activity: string) => {
    const api = (window as any).collaborationAPI
    if (api && api.isConnected) {
      api.updatePresence(status, activity)
    }
  }, [])
  
  const broadcastUpdate = useCallback((action: string, elementId?: string, data?: any) => {
    const api = (window as any).collaborationAPI
    if (api && api.isConnected) {
      api.broadcastUpdate(action, elementId, data)
    }
  }, [])
  
  useEffect(() => {
    const checkConnection = () => {
      const api = (window as any).collaborationAPI
      setIsConnected(api?.isConnected || false)
    }
    
    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  }, [])
  
  return {
    isConnected,
    updatePresence,
    broadcastUpdate
  }
}