import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  Bell,
  BellOff,
  Trash2,
  Filter,
  Clock,
  X
} from 'lucide-react'
import { Alert } from '../../hooks/useSystemMetrics'

interface AlertsPanelProps {
  alerts: Alert[]
  onAcknowledge: (alertId: string) => void
  onClearAll: () => void
  onClearAcknowledged: () => void
  className?: string
  maxVisible?: number
  enableSound?: boolean
  enableNotifications?: boolean
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledge,
  onClearAll,
  onClearAcknowledged,
  className = '',
  maxVisible = 10,
  enableSound = true,
  enableNotifications = true
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const [soundEnabled, setSoundEnabled] = useState(enableSound)
  const [notificationsEnabled, setNotificationsEnabled] = useState(enableNotifications)
  const [lastAlertCount, setLastAlertCount] = useState(0)

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.type === filter
  })

  const unacknowledgedAlerts = filteredAlerts.filter(alert => !alert.acknowledged)
  const acknowledgedAlerts = filteredAlerts.filter(alert => alert.acknowledged)

  // Sound and notification effects
  useEffect(() => {
    const newAlertCount = unacknowledgedAlerts.length
    
    if (newAlertCount > lastAlertCount) {
      const newAlerts = unacknowledgedAlerts.slice(0, newAlertCount - lastAlertCount)
      
      // Play sound for new alerts
      if (soundEnabled && newAlerts.length > 0) {
        playAlertSound(newAlerts[0].type)
      }
      
      // Show browser notifications
      if (notificationsEnabled && 'Notification' in window) {
        newAlerts.forEach(alert => {
          if (Notification.permission === 'granted') {
            new Notification(`Studio Treiax - ${alert.title}`, {
              body: alert.message,
              icon: getAlertIcon(alert.type),
              tag: alert.id
            })
          }
        })
      }
    }
    
    setLastAlertCount(newAlertCount)
  }, [unacknowledgedAlerts.length, soundEnabled, notificationsEnabled, lastAlertCount])

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [notificationsEnabled])

  // Play alert sound
  const playAlertSound = (type: Alert['type']) => {
    if (!soundEnabled) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different frequencies for different alert types
      const frequencies = {
        error: 800,
        warning: 600,
        info: 400
      }
      
      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Failed to play alert sound:', error)
    }
  }

  // Get alert icon
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return '/icons/error.png'
      case 'warning':
        return '/icons/warning.png'
      case 'info':
        return '/icons/info.png'
      default:
        return '/icons/alert.png'
    }
  }

  // Get alert icon component
  const getAlertIconComponent = (type: Alert['type']) => {
    const iconProps = { className: 'h-4 w-4' }
    
    switch (type) {
      case 'error':
        return <XCircle {...iconProps} className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info {...iconProps} className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle {...iconProps} />
    }
  }

  // Get alert color classes
  const getAlertColorClasses = (type: Alert['type'], acknowledged: boolean) => {
    const opacity = acknowledged ? 'opacity-60' : ''
    
    switch (type) {
      case 'error':
        return `border-red-200 bg-red-50 ${opacity}`
      case 'warning':
        return `border-yellow-200 bg-yellow-50 ${opacity}`
      case 'info':
        return `border-blue-200 bg-blue-50 ${opacity}`
      default:
        return `border-gray-200 bg-gray-50 ${opacity}`
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    
    if (diff < 60000) {
      return 'agora'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m atrás`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h atrás`
    } else {
      return timestamp.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Get filter badge variant
  const getFilterBadgeVariant = (filterType: typeof filter) => {
    return filter === filterType ? 'default' : 'outline'
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alertas do Sistema</span>
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Desativar som' : 'Ativar som'}
            >
              {soundEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
            
            {/* Clear actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAcknowledged}
              disabled={acknowledgedAlerts.length === 0}
              title="Limpar reconhecidos"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              disabled={alerts.length === 0}
              title="Limpar todos"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex items-center space-x-2 mt-3">
          <Filter className="h-4 w-4 text-gray-500" />
          
          <Button
            variant={getFilterBadgeVariant('all')}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos ({alerts.length})
          </Button>
          
          <Button
            variant={getFilterBadgeVariant('error')}
            size="sm"
            onClick={() => setFilter('error')}
          >
            Erros ({alerts.filter(a => a.type === 'error').length})
          </Button>
          
          <Button
            variant={getFilterBadgeVariant('warning')}
            size="sm"
            onClick={() => setFilter('warning')}
          >
            Avisos ({alerts.filter(a => a.type === 'warning').length})
          </Button>
          
          <Button
            variant={getFilterBadgeVariant('info')}
            size="sm"
            onClick={() => setFilter('info')}
          >
            Info ({alerts.filter(a => a.type === 'info').length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">Nenhum alerta</p>
            <p className="text-sm">Sistema funcionando normalmente</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {/* Unacknowledged alerts first */}
              {unacknowledgedAlerts.slice(0, maxVisible).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColorClasses(alert.type, false)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getAlertIconComponent(alert.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAcknowledge(alert.id)}
                      className="ml-2 flex-shrink-0"
                      title="Reconhecer alerta"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Acknowledged alerts */}
              {acknowledgedAlerts.slice(0, Math.max(0, maxVisible - unacknowledgedAlerts.length)).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColorClasses(alert.type, true)} transition-all duration-200`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIconComponent(alert.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm line-through">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          reconhecido
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-through">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                    </div>
                    
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
              
              {/* Show more indicator */}
              {filteredAlerts.length > maxVisible && (
                <div className="text-center py-2">
                  <Badge variant="outline">
                    +{filteredAlerts.length - maxVisible} alertas adicionais
                  </Badge>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertsPanel