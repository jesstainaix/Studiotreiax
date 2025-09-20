import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Download,
  Upload
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import useSystemMetrics from '../../hooks/useSystemMetrics'
import AlertsPanel from './AlertsPanel'

interface MetricsDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
  showAlerts?: boolean
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 1000,
  showAlerts = true
}) => {
  const {
    metrics,
    alerts,
    historicalData,
    isMonitoring,
    lastUpdate,
    updateMetrics,
    acknowledgeAlert,
    clearAllAlerts,
    clearAcknowledgedAlerts,
    toggleMonitoring,
    getUnacknowledgedAlerts,
    getMetricsTrend
  } = useSystemMetrics({
    autoRefresh,
    refreshInterval,
    enableAlerts: showAlerts
  })

  const unacknowledgedAlerts = getUnacknowledgedAlerts()

  // Get status color based on value and thresholds
  const getStatusColor = (value: number, warningThreshold: number, errorThreshold: number) => {
    if (value >= errorThreshold) return 'text-red-600'
    if (value >= warningThreshold) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Get progress color
  const getProgressColor = (value: number, warningThreshold: number, errorThreshold: number) => {
    if (value >= errorThreshold) return 'bg-red-500'
    if (value >= warningThreshold) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Chart data for trends
  const chartData = useMemo(() => {
    return historicalData.slice(-20).map((data, index) => ({
      time: index,
      cpu: data.cpu,
      memory: data.memory,
      fps: data.performance.fps,
      latency: data.network.latency
    }))
  }, [historicalData])

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Métricas do Sistema</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitorando' : 'Pausado'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? 'Pausar' : 'Iniciar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={updateMetrics}
            disabled={!isMonitoring}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alerts Panel */}
      {showAlerts && (
        <AlertsPanel
          alerts={alerts}
          onAcknowledge={acknowledgeAlert}
          onClearAll={clearAllAlerts}
          onClearAcknowledged={clearAcknowledgedAlerts}
          maxVisible={5}
        />
      )}

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span>CPU</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(metrics.cpu, 70, 90)}`}>
                  {metrics.cpu.toFixed(1)}%
                </span>
                {getMetricsTrend('cpu') === 'increasing' ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : getMetricsTrend('cpu') === 'decreasing' ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
              <Progress 
                value={metrics.cpu} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span>Memória</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(metrics.memory, 70, 85)}`}>
                  {metrics.memory.toFixed(1)}%
                </span>
                {getMetricsTrend('memory') === 'increasing' ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : getMetricsTrend('memory') === 'decreasing' ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
              <Progress 
                value={metrics.memory} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Network */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span>Rede</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Upload className="h-3 w-3" />
                  <span>{(metrics.network.upload / 1000).toFixed(1)}MB/s</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download className="h-3 w-3" />
                  <span>{(metrics.network.download / 1000).toFixed(1)}MB/s</span>
                </div>
              </div>
              <div className="text-center">
                <span className={`text-lg font-bold ${getStatusColor(metrics.network.latency, 100, 200)}`}>
                  {metrics.network.latency.toFixed(0)}ms
                </span>
                <p className="text-xs text-gray-500">latência</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>FPS:</span>
                <span className={`font-bold ${getStatusColor(60 - metrics.performance.fps, 30, 45)}`}>
                  {metrics.performance.fps.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Cache:</span>
                <span className={`font-bold ${getStatusColor(metrics.performance.cacheHitRate, 70, 50)}`}>
                  {metrics.performance.cacheHitRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Render:</span>
                <span className="font-bold">
                  {metrics.performance.renderTime.toFixed(1)}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Colaboração em Tempo Real</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.collaboration.activeUsers}
              </div>
              <p className="text-sm text-gray-500">Usuários Ativos</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {metrics.collaboration.messagesPerSecond.toFixed(1)}
              </div>
              <p className="text-sm text-gray-500">Mensagens/s</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {metrics.collaboration.cursorUpdatesPerSecond.toFixed(1)}
              </div>
              <p className="text-sm text-gray-500">Cursores/s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendências do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance & Latência</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="fps" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="latency" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MetricsDashboard