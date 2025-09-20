import { useState, useEffect, useMemo, useCallback } from 'react'

interface Layer {
  id: string
  type: 'text' | 'image' | 'audio' | 'video' | 'shape'
  name: string
  startTime: number
  duration: number
  properties: any
  visible: boolean
  locked: boolean
}

interface VirtualizationOptions {
  containerHeight: number
  itemHeight: number
  overscan?: number
  layers: Layer[]
}

interface VirtualItem {
  index: number
  start: number
  end: number
  layer: Layer
}

export const useTimelineVirtualization = ({
  containerHeight,
  itemHeight,
  overscan = 5,
  layers
}: VirtualizationOptions) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null)

  // Calcular itens visíveis
  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      layers.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const items: VirtualItem[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (layers[i]) {
        items.push({
          index: i,
          start: i * itemHeight,
          end: (i + 1) * itemHeight,
          layer: layers[i]
        })
      }
    }

    return items
  }, [scrollTop, containerHeight, itemHeight, overscan, layers])

  // Altura total do conteúdo
  const totalHeight = layers.length * itemHeight

  // Manipular scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    setIsScrolling(true)

    // Debounce para detectar fim do scroll
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    const timeout = setTimeout(() => {
      setIsScrolling(false)
    }, 150)

    setScrollTimeout(timeout)
  }, [scrollTimeout])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [scrollTimeout])

  // Scroll para um item específico
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const itemStart = index * itemHeight
    let scrollTo = itemStart

    if (align === 'center') {
      scrollTo = itemStart - (containerHeight - itemHeight) / 2
    } else if (align === 'end') {
      scrollTo = itemStart - containerHeight + itemHeight
    }

    scrollTo = Math.max(0, Math.min(scrollTo, totalHeight - containerHeight))
    setScrollTop(scrollTo)
  }, [itemHeight, containerHeight, totalHeight])

  // Verificar se um item está visível
  const isItemVisible = useCallback((index: number) => {
    const itemStart = index * itemHeight
    const itemEnd = itemStart + itemHeight
    const viewportStart = scrollTop
    const viewportEnd = scrollTop + containerHeight

    return itemEnd > viewportStart && itemStart < viewportEnd
  }, [scrollTop, containerHeight, itemHeight])

  return {
    virtualItems,
    totalHeight,
    isScrolling,
    handleScroll,
    scrollToItem,
    isItemVisible,
    scrollTop
  }
}

export default useTimelineVirtualization