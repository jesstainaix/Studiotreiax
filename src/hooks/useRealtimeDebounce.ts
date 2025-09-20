import { useCallback, useRef, useEffect } from 'react'
import { LiveUpdate } from '../types'

interface DebounceOptions {
  delay?: number
  maxWait?: number
  leading?: boolean
  trailing?: boolean
  batchSize?: number
}

interface QueuedUpdate {
  update: LiveUpdate
  timestamp: number
  priority: 'high' | 'medium' | 'low'
}

type UpdateHandler = (updates: LiveUpdate[]) => void

export const useRealtimeDebounce = (
  handler: UpdateHandler,
  options: DebounceOptions = {}
) => {
  const {
    delay = 100,
    maxWait = 500,
    leading = false,
    trailing = true,
    batchSize = 10
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const queueRef = useRef<QueuedUpdate[]>([])
  const lastCallTime = useRef<number>(0)
  const lastInvokeTime = useRef<number>(0)
  const leadingInvoked = useRef<boolean>(false)

  // Priority mapping for different update types
  const getPriority = useCallback((update: LiveUpdate): 'high' | 'medium' | 'low' => {
    const highPriorityActions = ['cursor_move', 'selection_change', 'scroll']
    const mediumPriorityActions = ['text_edit', 'element_move', 'style_change']
    
    if (highPriorityActions.includes(update.action)) return 'high'
    if (mediumPriorityActions.includes(update.action)) return 'medium'
    return 'low'
  }, [])

  // Process queued updates with priority sorting
  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) return

    // Sort by priority and timestamp
    const sortedUpdates = [...queueRef.current].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      return a.timestamp - b.timestamp
    })

    // Group similar updates and keep only the latest
    const groupedUpdates = new Map<string, LiveUpdate>()
    
    sortedUpdates.forEach(({ update }) => {
      const key = `${update.action}-${update.elementId || 'global'}`
      const existing = groupedUpdates.get(key)
      
      if (!existing || new Date(update.timestamp) > new Date(existing.timestamp)) {
        groupedUpdates.set(key, update)
      }
    })

    const finalUpdates = Array.from(groupedUpdates.values())
    queueRef.current = []
    
    if (finalUpdates.length > 0) {
      handler(finalUpdates)
    }
  }, [handler])

  // Debounced function
  const debouncedHandler = useCallback((update: LiveUpdate) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime.current
    const timeSinceLastInvoke = now - lastInvokeTime.current
    
    lastCallTime.current = now
    
    const priority = getPriority(update)
    
    // Add to queue
    queueRef.current.push({
      update,
      timestamp: now,
      priority
    })

    // Handle leading edge
    if (leading && !leadingInvoked.current) {
      leadingInvoked.current = true
      processQueue()
      lastInvokeTime.current = now
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
    }

    // Set up trailing edge timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        processQueue()
        lastInvokeTime.current = Date.now()
        leadingInvoked.current = false
      }, delay)
    }

    // Set up max wait timeout
    if (maxWait && timeSinceLastInvoke >= maxWait) {
      processQueue()
      lastInvokeTime.current = now
      leadingInvoked.current = false
    } else if (maxWait) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        processQueue()
        lastInvokeTime.current = Date.now()
        leadingInvoked.current = false
      }, maxWait - timeSinceLastInvoke)
    }

    // Process immediately if queue is full (high priority updates)
    if (queueRef.current.length >= batchSize) {
      const highPriorityCount = queueRef.current.filter(q => q.priority === 'high').length
      
      if (highPriorityCount >= Math.ceil(batchSize * 0.7)) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current)
        
        processQueue()
        lastInvokeTime.current = now
        leadingInvoked.current = false
      }
    }
  }, [delay, maxWait, leading, trailing, batchSize, getPriority, processQueue])

  // Immediate handler for critical updates
  const immediateHandler = useCallback((update: LiveUpdate) => {
    // Clear all timeouts and process immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
    }
    
    // Add to queue and process immediately
    queueRef.current.push({
      update,
      timestamp: Date.now(),
      priority: 'high'
    })
    
    processQueue()
    lastInvokeTime.current = Date.now()
    leadingInvoked.current = false
  }, [processQueue])

  // Flush pending updates
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
    }
    
    processQueue()
    lastInvokeTime.current = Date.now()
    leadingInvoked.current = false
  }, [processQueue])

  // Cancel pending updates
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
    }
    
    queueRef.current = []
    leadingInvoked.current = false
  }, [])

  // Get queue stats
  const getStats = useCallback(() => {
    const queue = queueRef.current
    const priorityCounts = queue.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      queueSize: queue.length,
      priorityCounts,
      oldestUpdate: queue.length > 0 ? Math.min(...queue.map(q => q.timestamp)) : null,
      newestUpdate: queue.length > 0 ? Math.max(...queue.map(q => q.timestamp)) : null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    debouncedHandler,
    immediateHandler,
    flush,
    cancel,
    getStats
  }
}

// Hook for managing multiple debounced handlers
export const useMultipleDebounce = () => {
  const handlersRef = useRef<Map<string, ReturnType<typeof useRealtimeDebounce>>>(new Map())

  const createHandler = useCallback((key: string, handler: UpdateHandler, options?: DebounceOptions) => {
    const debouncedHandler = useRealtimeDebounce(handler, options)
    handlersRef.current.set(key, debouncedHandler)
    return debouncedHandler
  }, [])

  const getHandler = useCallback((key: string) => {
    return handlersRef.current.get(key)
  }, [])

  const removeHandler = useCallback((key: string) => {
    const handler = handlersRef.current.get(key)
    if (handler) {
      handler.cancel()
      handlersRef.current.delete(key)
    }
  }, [])

  const flushAll = useCallback(() => {
    handlersRef.current.forEach(handler => handler.flush())
  }, [])

  const cancelAll = useCallback(() => {
    handlersRef.current.forEach(handler => handler.cancel())
    handlersRef.current.clear()
  }, [])

  const getAllStats = useCallback(() => {
    const stats: Record<string, any> = {}
    handlersRef.current.forEach((handler, key) => {
      stats[key] = handler.getStats()
    })
    return stats
  }, [])

  useEffect(() => {
    return () => {
      cancelAll()
    }
  }, [cancelAll])

  return {
    createHandler,
    getHandler,
    removeHandler,
    flushAll,
    cancelAll,
    getAllStats
  }
}

export default useRealtimeDebounce