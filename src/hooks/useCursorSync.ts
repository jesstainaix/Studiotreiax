import { useCallback, useRef, useEffect, useState } from 'react'
import { CursorPosition } from '../types'

interface CursorSyncOptions {
  throttleMs?: number
  batchSize?: number
  maxBatchDelay?: number
  enablePrediction?: boolean
  smoothingFactor?: number
}

interface CursorUpdate {
  userId: string
  position: CursorPosition
  timestamp: number
}

interface PredictedCursor extends CursorPosition {
  velocity: { x: number; y: number }
  lastUpdate: number
}

export const useCursorSync = (
  sendMessage: (message: any) => void,
  currentUserId: string,
  options: CursorSyncOptions = {}
) => {
  const {
    throttleMs = 16, // 60fps
    batchSize = 5,
    maxBatchDelay = 50,
    enablePrediction = true,
    smoothingFactor = 0.8
  } = options

  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())
  const [predictedCursors, setPredictedCursors] = useState<Map<string, PredictedCursor>>(new Map())
  
  const throttleRef = useRef<NodeJS.Timeout | null>(null)
  const batchRef = useRef<CursorUpdate[]>([])
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSentPosition = useRef<{ x: number; y: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateTime = useRef<number>(0)

  // Optimized cursor update with intelligent throttling
  const updateCursor = useCallback((x: number, y: number) => {
    const now = performance.now()
    const timeDelta = now - lastUpdateTime.current
    
    // Skip update if position hasn't changed significantly
    if (lastSentPosition.current) {
      const dx = Math.abs(x - lastSentPosition.current.x)
      const dy = Math.abs(y - lastSentPosition.current.y)
      
      // Adaptive threshold based on movement speed
      const threshold = timeDelta < 50 ? 3 : 1
      if (dx < threshold && dy < threshold) {
        return
      }
    }

    // Clear existing throttle
    if (throttleRef.current) {
      clearTimeout(throttleRef.current)
    }

    // Adaptive throttling based on movement speed
    const adaptiveThrottle = timeDelta < 100 ? throttleMs / 2 : throttleMs

    throttleRef.current = setTimeout(() => {
      const position: CursorPosition = {
        x,
        y,
        visible: true
      }

      sendMessage({
        type: 'cursor_update',
        data: {
          userId: currentUserId,
          position,
          timestamp: now
        }
      })

      lastSentPosition.current = { x, y }
      lastUpdateTime.current = now
    }, adaptiveThrottle)
  }, [sendMessage, currentUserId, throttleMs])

  // Batch processing for incoming cursor updates
  const processCursorUpdate = useCallback((update: CursorUpdate) => {
    batchRef.current.push(update)

    // Process batch if it reaches the size limit
    if (batchRef.current.length >= batchSize) {
      processBatch()
    } else {
      // Set timeout for batch processing
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
      
      batchTimeoutRef.current = setTimeout(() => {
        processBatch()
      }, maxBatchDelay)
    }
  }, [batchSize, maxBatchDelay])

  const processBatch = useCallback(() => {
    if (batchRef.current.length === 0) return

    const updates = [...batchRef.current]
    batchRef.current = []

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
      batchTimeoutRef.current = null
    }

    // Group updates by user and keep only the latest
    const latestUpdates = new Map<string, CursorUpdate>()
    updates.forEach(update => {
      const existing = latestUpdates.get(update.userId)
      if (!existing || update.timestamp > existing.timestamp) {
        latestUpdates.set(update.userId, update)
      }
    })

    // Apply updates with smoothing
    setCursors(prev => {
      const newCursors = new Map(prev)
      
      latestUpdates.forEach((update, userId) => {
        if (userId === currentUserId) return // Skip own cursor
        
        const currentPos = prev.get(userId)
        let finalPosition = update.position

        // Apply smoothing if previous position exists
        if (currentPos && enablePrediction) {
          finalPosition = {
            ...update.position,
            x: currentPos.x + (update.position.x - currentPos.x) * smoothingFactor,
            y: currentPos.y + (update.position.y - currentPos.y) * smoothingFactor
          }
        }

        newCursors.set(userId, finalPosition)

        // Update prediction data
        if (enablePrediction) {
          setPredictedCursors(prevPredicted => {
            const newPredicted = new Map(prevPredicted)
            const existing = prevPredicted.get(userId)
            
            if (existing) {
              const timeDelta = update.timestamp - existing.lastUpdate
              const velocity = {
                x: timeDelta > 0 ? (update.position.x - existing.x) / timeDelta : 0,
                y: timeDelta > 0 ? (update.position.y - existing.y) / timeDelta : 0
              }
              
              newPredicted.set(userId, {
                ...finalPosition,
                velocity,
                lastUpdate: update.timestamp
              })
            } else {
              newPredicted.set(userId, {
                ...finalPosition,
                velocity: { x: 0, y: 0 },
                lastUpdate: update.timestamp
              })
            }
            
            return newPredicted
          })
        }
      })
      
      return newCursors
    })
  }, [currentUserId, enablePrediction, smoothingFactor])

  // Cursor prediction animation
  const animatePrediction = useCallback(() => {
    if (!enablePrediction) return

    const now = performance.now()
    
    setPredictedCursors(prev => {
      const updated = new Map(prev)
      let hasChanges = false

      prev.forEach((predicted, userId) => {
        const timeDelta = now - predicted.lastUpdate
        
        // Only predict for recent updates (within 200ms)
        if (timeDelta < 200 && (Math.abs(predicted.velocity.x) > 0.1 || Math.abs(predicted.velocity.y) > 0.1)) {
          const predictedX = predicted.x + predicted.velocity.x * timeDelta * 0.001
          const predictedY = predicted.y + predicted.velocity.y * timeDelta * 0.001
          
          updated.set(userId, {
            ...predicted,
            x: predictedX,
            y: predictedY
          })
          
          hasChanges = true
        }
      })

      return hasChanges ? updated : prev
    })

    animationFrameRef.current = requestAnimationFrame(animatePrediction)
  }, [enablePrediction])

  // Start prediction animation
  useEffect(() => {
    if (enablePrediction) {
      animationFrameRef.current = requestAnimationFrame(animatePrediction)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [enablePrediction, animatePrediction])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current)
    }
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Remove cursor when user leaves
  const removeCursor = useCallback((userId: string) => {
    setCursors(prev => {
      const newCursors = new Map(prev)
      newCursors.delete(userId)
      return newCursors
    })
    
    setPredictedCursors(prev => {
      const newPredicted = new Map(prev)
      newPredicted.delete(userId)
      return newPredicted
    })
  }, [])

  // Get final cursor positions (with prediction if enabled)
  const getFinalCursors = useCallback(() => {
    if (!enablePrediction) return cursors
    
    const finalCursors = new Map(cursors)
    
    predictedCursors.forEach((predicted, userId) => {
      const timeSinceUpdate = performance.now() - predicted.lastUpdate
      
      // Use predicted position only for very recent updates
      if (timeSinceUpdate < 100) {
        finalCursors.set(userId, {
          x: predicted.x,
          y: predicted.y,
          visible: predicted.visible
        })
      }
    })
    
    return finalCursors
  }, [cursors, predictedCursors, enablePrediction])

  return {
    cursors: getFinalCursors(),
    updateCursor,
    processCursorUpdate,
    removeCursor,
    cleanup
  }
}

export default useCursorSync