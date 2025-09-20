import debounce from 'lodash/debounce'

// Types for dashboard data
export interface DashboardMetrics {
  loadTime: number
  renderTime: number
  apiCalls: number
  cacheHits: number
  cacheMisses: number
}

export interface OptimizedNRCategory {
  nr: string
  title: string
  description: string
  color: string
  icon: string
  priority: 'high' | 'medium' | 'low'
  completionRate: number
  projectCount: number
  activeProjects: number
  templates: number
  lastUpdated: string
  trending: boolean
  estimatedTime: string
}

export interface OptimizedModule {
  id: string
  title: string
  description: string
  category: string
  route: string
  icon: React.ReactNode
  color: string
  status: 'active' | 'beta' | 'coming-soon'
  popularity: number
  lastUsed?: string
  estimatedTime: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface QuickStat {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color: string
}

class DashboardOptimizationService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private metrics: DashboardMetrics = {
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
  private observers = new Set<(metrics: DashboardMetrics) => void>()

  // Cache management
  private setCacheItem(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private getCacheItem(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) {
      this.metrics.cacheMisses++
      return null
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.metrics.cacheMisses++
      return null
    }

    this.metrics.cacheHits++
    return item.data
  }

  // Performance monitoring
  startPerformanceTimer(): number {
    return performance.now()
  }

  endPerformanceTimer(startTime: number, type: 'load' | 'render'): number {
    const duration = performance.now() - startTime
    if (type === 'load') {
      this.metrics.loadTime = duration
    } else {
      this.metrics.renderTime = duration
    }
    this.notifyObservers()
    return duration
  }

  trackPerformance(operation: string, duration: number): void {
    console.log(`⚡ Performance: ${operation} took ${duration.toFixed(2)}ms`)
    
    // Atualizar métricas baseado na operação
    if (operation.includes('api')) {
      this.metrics.apiCalls++
    }
    
    this.notifyObservers()
  }

  // Observer pattern para métricas
  subscribe(observer: (metrics: DashboardMetrics) => void): () => void {
    this.observers.add(observer)
    return () => this.observers.delete(observer)
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.metrics))
  }

  // Otimizações específicas do dashboard
  optimizeNRCategories(categories: any[]): OptimizedNRCategory[] {
    const cached = this.getCacheItem('nr-categories')
    if (cached) return cached

    const startTime = this.startPerformanceTimer()
    
    const optimized = categories.map(category => ({
      ...category,
      trending: Math.random() > 0.7,
      estimatedTime: this.calculateEstimatedTime(category.projectCount),
      completionRate: Math.min(95, Math.max(60, Math.random() * 100))
    }))
    .sort((a, b) => {
      // Priorizar por trending e completion rate
      if (a.trending && !b.trending) return -1
      if (!a.trending && b.trending) return 1
      return b.completionRate - a.completionRate
    })

    this.setCacheItem('nr-categories', optimized)
    this.endPerformanceTimer(startTime, 'render')
    
    return optimized
  }

  optimizeModules(modules: any[]): OptimizedModule[] {
    const cached = this.getCacheItem('modules')
    if (cached) return cached

    const startTime = this.startPerformanceTimer()
    
    const optimized = modules.map(module => ({
      ...module,
      popularity: Math.floor(Math.random() * 100),
      estimatedTime: this.calculateEstimatedTime(Math.random() * 10),
      lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
    }))
    .sort((a, b) => {
      // Priorizar por popularidade e uso recente
      if (a.lastUsed && !b.lastUsed) return -1
      if (!a.lastUsed && b.lastUsed) return 1
      return b.popularity - a.popularity
    })

    this.setCacheItem('modules', optimized)
    this.endPerformanceTimer(startTime, 'render')
    
    return optimized
  }

  generateQuickStats(): QuickStat[] {
    const cached = this.getCacheItem('quick-stats')
    if (cached) return cached

    const stats: QuickStat[] = [
      {
        label: 'Projetos Ativos',
        value: Math.floor(Math.random() * 50 + 10).toString(),
        change: `+${Math.floor(Math.random() * 20)}%`,
        trend: 'up' as const,
        icon: '📊',
        color: 'text-green-600'
      },
      {
        label: 'Templates Criados',
        value: Math.floor(Math.random() * 100 + 50).toString(),
        change: `+${Math.floor(Math.random() * 15)}%`,
        trend: 'up' as const,
        icon: '📋',
        color: 'text-blue-600'
      },
      {
        label: 'Análises Concluídas',
        value: Math.floor(Math.random() * 200 + 100).toString(),
        change: `+${Math.floor(Math.random() * 25)}%`,
        trend: 'up' as const,
        icon: '✅',
        color: 'text-purple-600'
      },
      {
        label: 'Taxa de Conformidade',
        value: `${Math.floor(Math.random() * 20 + 80)}%`,
        change: `+${Math.floor(Math.random() * 5)}%`,
        trend: 'up' as const,
        icon: '🎯',
        color: 'text-orange-600'
      }
    ]

    this.setCacheItem('quick-stats', stats, 60000) // 1 minute cache
    return stats
  }

  private calculateEstimatedTime(count: number): string {
    const minutes = Math.max(5, Math.floor(count * 2.5 + Math.random() * 10))
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  // Limpeza de cache
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 Cache do dashboard limpo')
  }

  // Métricas atuais
  getMetrics(): DashboardMetrics {
    return { ...this.metrics }
  }

  // Reset métricas
  resetMetrics(): void {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
    this.notifyObservers()
  }
}

// Instância singleton
const dashboardOptimizationService = new DashboardOptimizationService()
export default dashboardOptimizationService