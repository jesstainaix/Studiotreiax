import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface VirtualizationOptions {
  itemHeight?: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  scrollingDelay?: number;
  getItemKey?: (index: number) => string | number;
  estimateItemHeight?: (index: number) => number;
  horizontal?: boolean;
  itemWidth?: number | ((index: number) => number);
  containerWidth?: number;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
  key: string | number;
}

export interface VirtualizationState {
  items: VirtualItem[];
  startIndex: number;
  endIndex: number;
  totalSize: number;
  scrollOffset: number;
  isScrolling: boolean;
  overscanStartIndex: number;
  overscanEndIndex: number;
}

export interface VirtualizationActions {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToOffset: (offset: number) => void;
  measureItem: (index: number, size: number) => void;
  invalidateCache: () => void;
  getItemOffset: (index: number) => number;
  getItemSize: (index: number) => number;
}

interface ItemCache {
  [index: number]: {
    size: number;
    offset: number;
    measured: boolean;
  };
}

export function useVirtualization(
  itemCount: number,
  options: VirtualizationOptions
): [VirtualizationState, VirtualizationActions] {
  const {
    itemHeight = 50,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150,
    getItemKey = (index) => index,
    estimateItemHeight,
    horizontal = false,
    itemWidth = 200,
    containerWidth = 0
  } = options;

  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const itemCacheRef = useRef<ItemCache>({});
  const lastMeasuredIndexRef = useRef(-1);
  const estimatedItemSizeRef = useRef<number>();

  // Initialize estimated item size
  useEffect(() => {
    if (!estimatedItemSizeRef.current) {
      if (typeof itemHeight === 'number') {
        estimatedItemSizeRef.current = itemHeight;
      } else if (estimateItemHeight) {
        estimatedItemSizeRef.current = estimateItemHeight(0);
      } else {
        estimatedItemSizeRef.current = horizontal ? (typeof itemWidth === 'number' ? itemWidth : 200) : 50;
      }
    }
  }, [itemHeight, estimateItemHeight, horizontal, itemWidth]);

  // Get item size with caching
  const getItemSize = useCallback((index: number): number => {
    if (itemCacheRef.current[index]?.measured) {
      return itemCacheRef.current[index].size;
    }

    if (horizontal) {
      if (typeof itemWidth === 'function') {
        return itemWidth(index);
      }
      return typeof itemWidth === 'number' ? itemWidth : 200;
    } else {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return typeof itemHeight === 'number' ? itemHeight : 50;
    }
  }, [itemHeight, itemWidth, horizontal]);

  // Get item offset with caching
  const getItemOffset = useCallback((index: number): number => {
    if (index === 0) return 0;
    
    if (itemCacheRef.current[index]?.offset !== undefined) {
      return itemCacheRef.current[index].offset;
    }

    // Calculate offset based on previous items
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemSize(i);
    }

    // Cache the calculated offset
    if (!itemCacheRef.current[index]) {
      itemCacheRef.current[index] = { size: 0, offset, measured: false };
    } else {
      itemCacheRef.current[index].offset = offset;
    }

    return offset;
  }, [getItemSize]);

  // Calculate total size
  const totalSize = useMemo(() => {
    if (itemCount === 0) return 0;
    
    let size = 0;
    for (let i = 0; i < itemCount; i++) {
      size += getItemSize(i);
    }
    return size;
  }, [itemCount, getItemSize]);

  // Binary search to find start index
  const findStartIndex = useCallback((offset: number): number => {
    if (offset <= 0) return 0;
    
    let low = 0;
    let high = itemCount - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midOffset = getItemOffset(mid);
      
      if (midOffset === offset) {
        return mid;
      } else if (midOffset < offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    return Math.max(0, high);
  }, [itemCount, getItemOffset]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (itemCount === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        overscanStartIndex: 0,
        overscanEndIndex: 0
      };
    }

    const containerSize = horizontal ? containerWidth : containerHeight;
    const startIndex = findStartIndex(scrollOffset);
    let endIndex = startIndex;
    let currentOffset = getItemOffset(startIndex);

    // Find end index
    while (endIndex < itemCount - 1 && currentOffset < scrollOffset + containerSize) {
      currentOffset += getItemSize(endIndex);
      endIndex++;
    }

    // Apply overscan
    const overscanStartIndex = Math.max(0, startIndex - overscan);
    const overscanEndIndex = Math.min(itemCount - 1, endIndex + overscan);

    return {
      startIndex,
      endIndex,
      overscanStartIndex,
      overscanEndIndex
    };
  }, [scrollOffset, itemCount, horizontal, containerWidth, containerHeight, findStartIndex, getItemOffset, getItemSize, overscan]);

  // Generate virtual items
  const items = useMemo(() => {
    const virtualItems: VirtualItem[] = [];
    
    for (let i = visibleRange.overscanStartIndex; i <= visibleRange.overscanEndIndex; i++) {
      const start = getItemOffset(i);
      const size = getItemSize(i);
      
      virtualItems.push({
        index: i,
        start,
        size,
        end: start + size,
        key: getItemKey(i)
      });
    }
    
    return virtualItems;
  }, [visibleRange, getItemOffset, getItemSize, getItemKey]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' | 'auto' = 'auto') => {
    if (index < 0 || index >= itemCount) return;
    
    const itemOffset = getItemOffset(index);
    const itemSize = getItemSize(index);
    const containerSize = horizontal ? containerWidth : containerHeight;
    
    let targetOffset = itemOffset;
    
    switch (align) {
      case 'center':
        targetOffset = itemOffset - (containerSize - itemSize) / 2;
        break;
      case 'end':
        targetOffset = itemOffset - containerSize + itemSize;
        break;
      case 'auto':
        if (itemOffset < scrollOffset) {
          targetOffset = itemOffset;
        } else if (itemOffset + itemSize > scrollOffset + containerSize) {
          targetOffset = itemOffset - containerSize + itemSize;
        } else {
          return; // Item is already visible
        }
        break;
    }
    
    setScrollOffset(Math.max(0, Math.min(targetOffset, totalSize - containerSize)));
  }, [index, itemCount, getItemOffset, getItemSize, horizontal, containerWidth, containerHeight, scrollOffset, totalSize]);

  // Scroll to offset
  const scrollToOffset = useCallback((offset: number) => {
    const containerSize = horizontal ? containerWidth : containerHeight;
    setScrollOffset(Math.max(0, Math.min(offset, totalSize - containerSize)));
  }, [horizontal, containerWidth, containerHeight, totalSize]);

  // Measure item
  const measureItem = useCallback((index: number, size: number) => {
    if (!itemCacheRef.current[index]) {
      itemCacheRef.current[index] = { size, offset: 0, measured: true };
    } else {
      itemCacheRef.current[index].size = size;
      itemCacheRef.current[index].measured = true;
    }
    
    lastMeasuredIndexRef.current = Math.max(lastMeasuredIndexRef.current, index);
    
    // Invalidate offsets for items after this one
    for (let i = index + 1; i <= lastMeasuredIndexRef.current; i++) {
      if (itemCacheRef.current[i]) {
        delete itemCacheRef.current[i].offset;
      }
    }
  }, []);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    itemCacheRef.current = {};
    lastMeasuredIndexRef.current = -1;
  }, []);

  // Handle scrolling state
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    setIsScrolling(true);
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollOffset, scrollingDelay]);

  const state: VirtualizationState = {
    items,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    totalSize,
    scrollOffset,
    isScrolling,
    overscanStartIndex: visibleRange.overscanStartIndex,
    overscanEndIndex: visibleRange.overscanEndIndex
  };

  const actions: VirtualizationActions = {
    scrollToIndex,
    scrollToOffset,
    measureItem,
    invalidateCache,
    getItemOffset,
    getItemSize
  };

  return [state, actions];
}

// Hook for element measurement
export function useElementMeasurement() {
  const measureRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!measureRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    
    resizeObserver.observe(measureRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  return [measureRef, dimensions] as const;
}

// Hook for scroll synchronization
export function useScrollSync() {
  const scrollElementsRef = useRef<HTMLElement[]>([]);
  
  const addScrollElement = useCallback((element: HTMLElement) => {
    if (!scrollElementsRef.current.includes(element)) {
      scrollElementsRef.current.push(element);
    }
  }, []);
  
  const removeScrollElement = useCallback((element: HTMLElement) => {
    scrollElementsRef.current = scrollElementsRef.current.filter(el => el !== element);
  }, []);
  
  const syncScroll = useCallback((sourceElement: HTMLElement, scrollTop: number, scrollLeft: number) => {
    scrollElementsRef.current.forEach(element => {
      if (element !== sourceElement) {
        element.scrollTop = scrollTop;
        element.scrollLeft = scrollLeft;
      }
    });
  }, []);
  
  return {
    addScrollElement,
    removeScrollElement,
    syncScroll
  };
}