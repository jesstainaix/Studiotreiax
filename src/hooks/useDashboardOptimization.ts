import React, { useState, useEffect, useMemo, useCallback } from 'react'
import debounce from 'lodash/debounce'

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [loadTime, setLoadTime] = useState<number>(0)
  const [renderTime, setRenderTime] = useState<number>(0)
  const [isOptimized, setIsOptimized] = useState<boolean>(false)

  const startTimer = useCallback(() => {
    return performance.now()
  }, [])

  const endTimer = useCallback((startTime: number, type: 'load' | 'render') => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (type === 'load') {
      setLoadTime(duration)
      setIsOptimized(duration < 2000) // Target: <2s loading
    } else {
      setRenderTime(duration)
    }
    
    return duration
  }, [])

  return { loadTime, renderTime, isOptimized, startTimer, endTimer }
}

// Virtual scrolling for large lists
export const useVirtualScrolling = <T>(items: T[], itemHeight: number = 200, containerHeight: number = 600) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return { visibleItems, handleScroll }
}

// Optimized search with caching
export const useOptimizedSearch = <T>(items: T[], searchFields: (keyof T)[]) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCache, setSearchCache] = useState<Map<string, T[]>>(new Map())
  
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      if (searchCache.has(term)) {
        return searchCache.get(term)!
      }
      
      const filtered = items.filter(item => 
        searchFields.some(field => 
          String(item[field]).toLowerCase().includes(term.toLowerCase())
        )
      )
      
      setSearchCache(prev => new Map(prev).set(term, filtered))
      return filtered
    }, 300),
    [items, searchFields, searchCache]
  )

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    return debouncedSearch(searchTerm) || []
  }, [items, searchTerm, debouncedSearch])

  return { searchTerm, setSearchTerm, filteredItems }
}

// Data prefetching and caching
export const useDataPrefetch = () => {
  const [cache, setCache] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    if (cache.has(key) || loading.has(key)) {
      return cache.get(key)
    }

    setLoading(prev => new Set(prev).add(key))
    
    try {
      const data = await fetcher()
      setCache(prev => new Map(prev).set(key, data))
      return data
    } catch (error) {
      console.error(`Failed to prefetch ${key}:`, error)
      throw error
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }, [cache, loading])

  const getCachedData = useCallback((key: string) => {
    return cache.get(key)
  }, [cache])

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCache(prev => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    } else {
      setCache(new Map())
    }
  }, [])

  return { prefetchData, getCachedData, clearCache, isLoading: (key: string) => loading.has(key) }
}

// Intersection Observer for lazy loading
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [targetRef, setTargetRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!targetRef) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    )

    observer.observe(targetRef)
    return () => observer.disconnect()
  }, [targetRef, options])

  return { isIntersecting, setTargetRef }
}

// Optimized component memoization
export const useMemoizedComponents = () => {
  const memoizeComponent = useCallback(<P extends object>(
    Component: React.ComponentType<P>,
    propsAreEqual?: (prevProps: P, nextProps: P) => boolean
  ) => {
    return React.memo(Component, propsAreEqual)
  }, [])

  const memoizeCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ) => {
    return useCallback(callback, deps)
  }, [])

  const memoizeValue = useCallback(<T>(
    factory: () => T,
    deps: React.DependencyList
  ) => {
    return useMemo(factory, deps)
  }, [])

  return { memoizeComponent, memoizeCallback, memoizeValue }
}

// Bundle size optimization
export const useLazyComponents = () => {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set())

  const loadComponent = useCallback(async (componentName: string, loader: () => Promise<any>) => {
    if (loadedComponents.has(componentName)) {
      return
    }

    try {
      await loader()
      setLoadedComponents(prev => new Set(prev).add(componentName))
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error)
    }
  }, [loadedComponents])

  return { loadComponent, isLoaded: (componentName: string) => loadedComponents.has(componentName) }
}

// Resource optimization
export const useResourceOptimization = () => {
  const [resourceUsage, setResourceUsage] = useState({
    memory: 0,
    cpu: 0,
    network: 0
  })

  const monitorResources = useCallback(() => {
    if ('memory' in performance) {
      // @ts-ignore - Performance memory API
      const memInfo = performance.memory
      setResourceUsage(prev => ({
        ...prev,
        memory: memInfo.usedJSHeapSize / memInfo.totalJSHeapSize
      }))
    }
  }, [])

  const optimizeImages = useCallback((src: string, width?: number, height?: number) => {
    const img = new Image()
    img.loading = 'lazy'
    img.decoding = 'async'
    
    if (width && height) {
      img.width = width
      img.height = height
    }
    
    return src
  }, [])

  const preloadCriticalResources = useCallback((resources: string[]) => {
    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.endsWith('.css') ? 'style' : 'script'
      document.head.appendChild(link)
    })
  }, [])

  return { resourceUsage, monitorResources, optimizeImages, preloadCriticalResources }
}

// Main dashboard optimization hook
export const useDashboardOptimization = ({
  items,
  selectedCategories = [],
  searchTerm = ''
}: {
  items: any[]
  selectedCategories?: string[]
  searchTerm?: string
}) => {
  const { loadTime, renderTime, startTimer, endTimer } = usePerformanceMonitor()
  const { prefetchData } = useDataPrefetch()
  const { resourceUsage, monitorResources } = useResourceOptimization()
  
  // Filter and virtualize items
  const filteredItems = useMemo(() => {
    if (!searchTerm && selectedCategories.length === 0) return items
    
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(item.category)
      
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, selectedCategories])
  
  const { visibleItems: virtualScrollData } = useVirtualScrolling(filteredItems, 200, 600)
  
  // Extract items from virtual scroll data
  const virtualizedItems = virtualScrollData?.items || []
  
  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    loadTime,
    renderTime,
    itemCount: filteredItems.length,
    virtualizedCount: virtualizedItems.length,
    filterTime: renderTime
  }), [loadTime, renderTime, filteredItems.length, virtualizedItems.length])
  
  // Monitor resources on mount
  useEffect(() => {
    monitorResources()
    const interval = setInterval(monitorResources, 5000)
    return () => clearInterval(interval)
  }, [monitorResources])
  
  return {
    virtualizedItems,
    performanceMetrics,
    resourceUsage,
    startTimer,
    endTimer,
    prefetchData
  }
}