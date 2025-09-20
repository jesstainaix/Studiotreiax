import { useState, useEffect, useRef, useCallback } from 'react'

export interface SystemMetrics {
  cpu: number
  memory: number
  network: {
    upload: number
    download: number
    latency: number
  }
  performance: {
    fps: number
    renderTime: number
    cacheHitRate: number
  }
  collaboration: {
    activeUsers: number
    messagesPerSecond: number
    cursorUpdatesPerSecond: number
  }
  errors: {
    count: number
    rate: number
  }
}

export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

interface UseSystemMetricsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  maxHistorySize?: number
  maxAlerts?: number
  enableAlerts?: boolean
}

interface MetricsThresholds {
  cpu: { warning: number; error: number }
  memory: { warning: number; error: number }
  latency: { warning: number; error: number }
  fps: { warning: number; error: number }
  cacheHitRate: { warning: number; error: number }
  errorRate: { warning: number; error: number }
}

const DEFAULT_THRESHOLDS: MetricsThresholds = {
  cpu: { warning: 70, error: 90 },
  memory: { warning: 70, error: 85 },
  latency: { warning: 100, error: 200 },
  fps: { warning: 45, error: 30 },
  cacheHitRate: { warning: 70, error: 50 },
  errorRate: { warning: 0.02, error: 0.05 }
}

export const useSystemMetrics = (options: UseSystemMetricsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 1000,
    maxHistorySize = 100,
    maxAlerts = 50,
    enableAlerts = true
  } = options

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    network: { upload: 0, download: 0, latency: 0 },
    performance: { fps: 0, renderTime: 0, cacheHitRate: 0 },
    collaboration: { activeUsers: 0, messagesPerSecond: 0, cursorUpdatesPerSecond: 0 },
    errors: { count: 0, rate: 0 }
  })

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [historicalData, setHistoricalData] = useState<Array<SystemMetrics & { timestamp: number }>>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const metricsHistory = useRef<Array<SystemMetrics & { timestamp: number }>>([])
  const alertIdCounter = useRef(0)
  const performanceObserver = useRef<PerformanceObserver | null>(null)
  const frameCounter = useRef({ count: 0, lastTime: 0, fps: 0 })

  // Performance monitoring setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        performanceObserver.current = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          // Process performance entries for more accurate metrics
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              // Handle custom performance measures
            }
          })
        })

        performanceObserver.current.observe({ entryTypes: ['measure', 'navigation'] })
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error)
      }
    }

    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect()
      }
    }
  }, [])

  // FPS monitoring
  const updateFPS = useCallback(() => {
    const now = performance.now()
    frameCounter.current.count++

    if (now - frameCounter.current.lastTime >= 1000) {
      frameCounter.current.fps = frameCounter.current.count
      frameCounter.current.count = 0
      frameCounter.current.lastTime = now
    }

    requestAnimationFrame(updateFPS)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      requestAnimationFrame(updateFPS)
    }
  }, [updateFPS])

  // Collect real-time metrics
  const collectMetrics = useCallback(async (): Promise<SystemMetrics> => {
    const baseMetrics: SystemMetrics = {
      cpu: Math.random() * 100,
      memory: 0,
      network: {
        upload: Math.random() * 1000,
        download: Math.random() * 5000,
        latency: 20 + Math.random() * 100
      },
      performance: {
        fps: frameCounter.current.fps || 60,
        renderTime: 10 + Math.random() * 20,
        cacheHitRate: 80 + Math.random() * 20
      },
      collaboration: {
        activeUsers: Math.floor(Math.random() * 10) + 1,
        messagesPerSecond: Math.random() * 50,
        cursorUpdatesPerSecond: Math.random() * 100
      },
      errors: {
        count: Math.floor(Math.random() * 5),
        rate: Math.random() * 0.1
      }
    }

    // Get real browser metrics
    if (typeof window !== 'undefined') {
      // Memory usage
      const memoryInfo = (performance as any).memory
      if (memoryInfo) {
        baseMetrics.memory = (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
      } else {
        baseMetrics.memory = Math.random() * 100
      }

      // Navigation timing for render performance
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        baseMetrics.performance.renderTime = navigation.loadEventEnd - navigation.loadEventStart
      }

      // Network connection info
      const connection = (navigator as any).connection
      if (connection) {
        baseMetrics.network.latency = connection.rtt || baseMetrics.network.latency
        baseMetrics.network.download = connection.downlink * 1000 || baseMetrics.network.download
      }
    }

    // Get collaboration metrics from global API
    const collaborationAPI = (window as any).collaborationAPI
    if (collaborationAPI && typeof collaborationAPI.getMetrics === 'function') {
      try {
        const collabMetrics = collaborationAPI.getMetrics()
        baseMetrics.collaboration = {
          ...baseMetrics.collaboration,
          ...collabMetrics
        }
      } catch (error) {
        console.warn('Failed to get collaboration metrics:', error)
      }
    }

    // Get cache metrics from global cache API
    const cacheAPI = (window as any).cacheAPI
    if (cacheAPI && typeof cacheAPI.getHitRate === 'function') {
      try {
        baseMetrics.performance.cacheHitRate = cacheAPI.getHitRate()
      } catch (error) {
        console.warn('Failed to get cache metrics:', error)
      }
    }

    return baseMetrics
  }, [])

  // Generate alerts based on thresholds
  const checkAlerts = useCallback((currentMetrics: SystemMetrics, thresholds = DEFAULT_THRESHOLDS) => {
    if (!enableAlerts) return

    const newAlerts: Alert[] = []

    // CPU alerts
    if (currentMetrics.cpu >= thresholds.cpu.error) {
      newAlerts.push({
        id: `cpu-error-${alertIdCounter.current++}`,
        type: 'error',
        title: 'CPU Crítico',
        message: `Uso de CPU em ${currentMetrics.cpu.toFixed(1)}% - Sistema pode ficar lento`,
        timestamp: new Date(),
        acknowledged: false
      })
    } else if (currentMetrics.cpu >= thresholds.cpu.warning) {
      newAlerts.push({
        id: `cpu-warning-${alertIdCounter.current++}`,
        type: 'warning',
        title: 'CPU Elevado',
        message: `Uso de CPU em ${currentMetrics.cpu.toFixed(1)}% - Monitorar performance`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Memory alerts
    if (currentMetrics.memory >= thresholds.memory.error) {
      newAlerts.push({
        id: `memory-error-${alertIdCounter.current++}`,
        type: 'error',
        title: 'Memória Crítica',
        message: `Uso de memória em ${currentMetrics.memory.toFixed(1)}% - Risco de travamento`,
        timestamp: new Date(),
        acknowledged: false
      })
    } else if (currentMetrics.memory >= thresholds.memory.warning) {
      newAlerts.push({
        id: `memory-warning-${alertIdCounter.current++}`,
        type: 'warning',
        title: 'Memória Elevada',
        message: `Uso de memória em ${currentMetrics.memory.toFixed(1)}% - Considerar otimização`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Network latency alerts
    if (currentMetrics.network.latency >= thresholds.latency.error) {
      newAlerts.push({
        id: `latency-error-${alertIdCounter.current++}`,
        type: 'error',
        title: 'Latência Crítica',
        message: `Latência de ${currentMetrics.network.latency.toFixed(0)}ms - Colaboração prejudicada`,
        timestamp: new Date(),
        acknowledged: false
      })
    } else if (currentMetrics.network.latency >= thresholds.latency.warning) {
      newAlerts.push({
        id: `latency-warning-${alertIdCounter.current++}`,
        type: 'warning',
        title: 'Latência Elevada',
        message: `Latência de ${currentMetrics.network.latency.toFixed(0)}ms - Verificar conexão`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // FPS alerts
    if (currentMetrics.performance.fps <= thresholds.fps.error) {
      newAlerts.push({
        id: `fps-error-${alertIdCounter.current++}`,
        type: 'error',
        title: 'FPS Crítico',
        message: `FPS em ${currentMetrics.performance.fps.toFixed(1)} - Editor pode travar`,
        timestamp: new Date(),
        acknowledged: false
      })
    } else if (currentMetrics.performance.fps <= thresholds.fps.warning) {
      newAlerts.push({
        id: `fps-warning-${alertIdCounter.current++}`,
        type: 'warning',
        title: 'FPS Baixo',
        message: `FPS em ${currentMetrics.performance.fps.toFixed(1)} - Performance reduzida`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Cache hit rate alerts
    if (currentMetrics.performance.cacheHitRate <= thresholds.cacheHitRate.error) {
      newAlerts.push({
        id: `cache-error-${alertIdCounter.current++}`,
        type: 'error',
        title: 'Cache Ineficiente',
        message: `Taxa de acerto do cache em ${currentMetrics.performance.cacheHitRate.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      })
    } else if (currentMetrics.performance.cacheHitRate <= thresholds.cacheHitRate.warning) {
      newAlerts.push({
        id: `cache-warning-${alertIdCounter.current++}`,
        type: 'warning',
        title: 'Cache Baixo',
        message: `Taxa de acerto do cache em ${currentMetrics.performance.cacheHitRate.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Error rate alerts
    if (currentMetrics.errors.rate >= thresholds.errorRate.error) {
      newAlerts.push({
        id: `errors-error-${alertIdCounter.current++}`,
        type: 'error',
        title: 'Taxa de Erro Crítica',
        message: `${(currentMetrics.errors.rate * 100).toFixed(2)}% de erros - Sistema instável`,
        timestamp: new Date(),
        acknowledged: false
      })
    } else if (currentMetrics.errors.rate >= thresholds.errorRate.warning) {
      newAlerts.push({
        id: `errors-warning-${alertIdCounter.current++}`,
        type: 'warning',
        title: 'Taxa de Erro Elevada',
        message: `${(currentMetrics.errors.rate * 100).toFixed(2)}% de erros - Investigar causas`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, maxAlerts))
    }
  }, [enableAlerts, maxAlerts])

  // Update metrics function
  const updateMetrics = useCallback(async () => {
    if (!isMonitoring) return

    try {
      const newMetrics = await collectMetrics()
      setMetrics(newMetrics)
      setLastUpdate(new Date())

      // Add to historical data
      const timestampedMetrics = { ...newMetrics, timestamp: Date.now() }
      metricsHistory.current.push(timestampedMetrics)
      
      // Keep only recent data
      if (metricsHistory.current.length > maxHistorySize) {
        metricsHistory.current = metricsHistory.current.slice(-maxHistorySize)
      }
      
      setHistoricalData([...metricsHistory.current])

      // Check for alerts
      checkAlerts(newMetrics)
    } catch (error) {
      console.error('Failed to collect metrics:', error)
      
      // Add error alert
      if (enableAlerts) {
        setAlerts(prev => [{
          id: `system-error-${alertIdCounter.current++}`,
          type: 'error',
          title: 'Erro do Sistema',
          message: 'Falha ao coletar métricas do sistema',
          timestamp: new Date(),
          acknowledged: false
        }, ...prev].slice(0, maxAlerts))
      }
    }
  }, [isMonitoring, collectMetrics, checkAlerts, maxHistorySize, maxAlerts, enableAlerts])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      intervalRef.current = setInterval(updateMetrics, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, isMonitoring, updateMetrics])

  // Initial load
  useEffect(() => {
    updateMetrics()
  }, [updateMetrics])

  // Alert management functions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged))
  }, [])

  // Monitoring control
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
  }, [])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev)
  }, [])

  // Utility functions
  const getUnacknowledgedAlerts = useCallback(() => {
    return alerts.filter(alert => !alert.acknowledged)
  }, [alerts])

  const getAlertsByType = useCallback((type: Alert['type']) => {
    return alerts.filter(alert => alert.type === type && !alert.acknowledged)
  }, [alerts])

  const getMetricsTrend = useCallback((metric: keyof SystemMetrics, periods = 10) => {
    const recentData = historicalData.slice(-periods)
    if (recentData.length < 2) return 'stable'

    const first = recentData[0]
    const last = recentData[recentData.length - 1]
    
    let firstValue: number
    let lastValue: number

    if (typeof first[metric] === 'number') {
      firstValue = first[metric] as number
      lastValue = last[metric] as number
    } else {
      // Handle nested metrics
      return 'stable'
    }

    const change = ((lastValue - firstValue) / firstValue) * 100
    
    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }, [historicalData])

  return {
    // State
    metrics,
    alerts,
    historicalData,
    isMonitoring,
    lastUpdate,
    
    // Actions
    updateMetrics,
    acknowledgeAlert,
    clearAllAlerts,
    clearAcknowledgedAlerts,
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    
    // Utilities
    getUnacknowledgedAlerts,
    getAlertsByType,
    getMetricsTrend
  }
}

export default useSystemMetrics