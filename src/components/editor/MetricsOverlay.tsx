import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
  BarChart3
} from 'lucide-react'
import MetricsDashboard from '../dashboard/MetricsDashboard'
import useSystemMetrics from '../../hooks/useSystemMetrics'

interface MetricsOverlayProps {
  className?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  defaultExpanded?: boolean
  showAlerts?: boolean
}

const MetricsOverlay: React.FC<MetricsOverlayProps> = ({
  className = '',
  position = 'top-right',
  defaultExpanded = false,
  showAlerts = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isVisible, setIsVisible] = useState(true)
  const [showFullDashboard, setShowFullDashboard] = useState(false)
  
  const { metrics, getUnacknowledgedAlerts } = useSystemMetrics({
    autoRefresh: true,
    refreshInterval: 2000,
    enableAlerts: showAlerts
  })
  
  const unacknowledgedAlerts = getUnacknowledgedAlerts()
  
  if (!isVisible) {
    return (
      <div className={`fixed ${getPositionClasses(position)} z-50`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <Activity className="h-4 w-4" />
        </Button>
      </div>
    )
  }
  
  if (showFullDashboard) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Dashboard de Métricas</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullDashboard(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <MetricsDashboard
              autoRefresh={true}
              refreshInterval={1000}
              showAlerts={showAlerts}
            />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`fixed ${getPositionClasses(position)} z-40 ${className}`}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-gray-200 min-w-[280px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Métricas do Sistema</span>
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unacknowledgedAlerts.length}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDashboard(true)}
                className="h-6 w-6 p-0"
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">CPU:</span>
                  <span className={`font-medium ${
                    metrics.cpu > 80 ? 'text-red-600' : 
                    metrics.cpu > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.cpu.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Memória:</span>
                  <span className={`font-medium ${
                    metrics.memory > 80 ? 'text-red-600' : 
                    metrics.memory > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.memory.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">FPS:</span>
                  <span className={`font-medium ${
                    metrics.performance.fps < 30 ? 'text-red-600' : 
                    metrics.performance.fps < 50 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.performance.fps.toFixed(0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Latência:</span>
                  <span className={`font-medium ${
                    metrics.network.latency > 200 ? 'text-red-600' : 
                    metrics.network.latency > 100 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.network.latency.toFixed(0)}ms
                  </span>
                </div>
              </div>
              
              {/* Collaboration Metrics */}
              <div className="border-t pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Usuários Ativos:</span>
                  <span className="font-medium">{metrics.collaboration.activeUsers}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Cache Hit Rate:</span>
                  <span className={`font-medium ${
                    metrics.performance.cacheHitRate < 50 ? 'text-red-600' : 
                    metrics.performance.cacheHitRate < 80 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.performance.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Recent Alerts */}
              {unacknowledgedAlerts.length > 0 && (
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-600 mb-1">Alertas Recentes:</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {unacknowledgedAlerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="text-xs p-1 rounded bg-red-50 border border-red-200">
                        <div className="font-medium text-red-800">{alert.title}</div>
                        <div className="text-red-600 truncate">{alert.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function getPositionClasses(position: string): string {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4'
    case 'top-right':
      return 'top-4 right-4'
    case 'bottom-left':
      return 'bottom-4 left-4'
    case 'bottom-right':
      return 'bottom-4 right-4'
    default:
      return 'top-4 right-4'
  }
}

export default MetricsOverlay