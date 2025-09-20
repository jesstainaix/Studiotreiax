import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useVirtualization, VirtualizationOptions, useElementMeasurement } from '../hooks/useVirtualization';
import { cn } from '../lib/utils';

export interface VirtualizedListProps<T = any> {
  items: T[];
  height: number;
  width?: number;
  itemHeight?: number | ((index: number, item: T) => number);
  itemWidth?: number | ((index: number, item: T) => number);
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
    isScrolling?: boolean;
  }) => React.ReactNode;
  overscan?: number;
  horizontal?: boolean;
  className?: string;
  onScroll?: (scrollOffset: number, scrollDirection: 'forward' | 'backward') => void;
  onItemsRendered?: (startIndex: number, endIndex: number, visibleStartIndex: number, visibleEndIndex: number) => void;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
  estimateItemSize?: (index: number) => number;
  getItemKey?: (index: number, item: T) => string | number;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
  scrollbarWidth?: number;
  showScrollIndicator?: boolean;
  enableSmoothScrolling?: boolean;
  throttleScrolling?: boolean;
}

export interface VirtualizedListRef {
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToOffset: (offset: number) => void;
  getScrollOffset: () => number;
  invalidateCache: () => void;
  forceUpdate: () => void;
}

const VirtualizedList = forwardRef<VirtualizedListRef, VirtualizedListProps>((
  {
    items,
    height,
    width = '100%',
    itemHeight = 50,
    itemWidth = 200,
    renderItem,
    overscan = 5,
    horizontal = false,
    className,
    onScroll,
    onItemsRendered,
    estimateItemSize,
    getItemKey = (index) => index,
    loadingComponent: LoadingComponent,
    emptyComponent: EmptyComponent,
    scrollbarWidth = 17,
    showScrollIndicator = true,
    enableSmoothScrolling = true,
    throttleScrolling = true
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [measureRef, containerDimensions] = useElementMeasurement();
  const lastScrollDirection = useRef<'forward' | 'backward'>('forward');
  const lastScrollOffset = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Determine container dimensions
  const containerHeight = containerDimensions.height || height;
  const containerWidth = containerDimensions.width || (typeof width === 'number' ? width : 800);

  // Setup virtualization options
  const virtualizationOptions: VirtualizationOptions = {
    itemHeight: typeof itemHeight === 'function' 
      ? (index: number) => itemHeight(index, items[index])
      : itemHeight,
    itemWidth: typeof itemWidth === 'function'
      ? (index: number) => itemWidth(index, items[index])
      : itemWidth,
    containerHeight: horizontal ? containerHeight : containerHeight,
    containerWidth: horizontal ? containerWidth : containerWidth,
    overscan,
    horizontal,
    getItemKey: (index: number) => getItemKey(index, items[index]),
    estimateItemHeight: estimateItemSize,
    scrollingDelay: throttleScrolling ? 150 : 50
  };

  const [virtualState, virtualActions] = useVirtualization(items.length, virtualizationOptions);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollElement = event.currentTarget;
    const scrollOffset = horizontal ? scrollElement.scrollLeft : scrollElement.scrollTop;
    
    // Determine scroll direction
    const direction = scrollOffset > lastScrollOffset.current ? 'forward' : 'backward';
    lastScrollDirection.current = direction;
    lastScrollOffset.current = scrollOffset;

    // Update virtualization state
    virtualActions.scrollToOffset(scrollOffset);

    // Call onScroll callback
    if (onScroll) {
      onScroll(scrollOffset, direction);
    }

    // Throttle scroll updates if enabled
    if (throttleScrolling) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        // Additional scroll processing can be added here
      }, 16); // ~60fps
    }
  }, [horizontal, virtualActions, onScroll, throttleScrolling]);

  // Handle items rendered callback
  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered(
        virtualState.overscanStartIndex,
        virtualState.overscanEndIndex,
        virtualState.startIndex,
        virtualState.endIndex
      );
    }
  }, [virtualState.overscanStartIndex, virtualState.overscanEndIndex, virtualState.startIndex, virtualState.endIndex, onItemsRendered]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number, align = 'auto') => {
      virtualActions.scrollToIndex(index, align);
      if (scrollElementRef.current) {
        const offset = virtualActions.getItemOffset(index);
        if (horizontal) {
          scrollElementRef.current.scrollLeft = offset;
        } else {
          scrollElementRef.current.scrollTop = offset;
        }
      }
    },
    scrollToOffset: (offset: number) => {
      virtualActions.scrollToOffset(offset);
      if (scrollElementRef.current) {
        if (horizontal) {
          scrollElementRef.current.scrollLeft = offset;
        } else {
          scrollElementRef.current.scrollTop = offset;
        }
      }
    },
    getScrollOffset: () => virtualState.scrollOffset,
    invalidateCache: () => virtualActions.invalidateCache(),
    forceUpdate: () => {
      virtualActions.invalidateCache();
      // Force re-render by updating a dummy state
    }
  }), [virtualActions, virtualState.scrollOffset, horizontal]);

  // Render loading state
  if (items.length === 0 && LoadingComponent) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height, width }}>
        <LoadingComponent />
      </div>
    );
  }

  // Render empty state
  if (items.length === 0 && EmptyComponent) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height, width }}>
        <EmptyComponent />
      </div>
    );
  }

  // Calculate scroll indicator position
  const scrollIndicatorStyle = showScrollIndicator ? {
    position: 'absolute' as const,
    [horizontal ? 'bottom' : 'right']: 0,
    [horizontal ? 'left' : 'top']: `${(virtualState.scrollOffset / virtualState.totalSize) * 100}%`,
    [horizontal ? 'width' : 'height']: `${(containerHeight / virtualState.totalSize) * 100}%`,
    [horizontal ? 'height' : 'width']: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '2px',
    transition: enableSmoothScrolling ? 'all 0.2s ease' : 'none',
    zIndex: 10
  } : {};

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        measureRef.current = el;
      }}
      className={cn('relative overflow-hidden', className)}
      style={{ height, width }}
    >
      <div
        ref={scrollElementRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{
          height: '100%',
          width: '100%',
          scrollBehavior: enableSmoothScrolling ? 'smooth' : 'auto'
        }}
        onScroll={handleScroll}
      >
        {/* Virtual container */}
        <div
          style={{
            position: 'relative',
            [horizontal ? 'width' : 'height']: virtualState.totalSize,
            [horizontal ? 'height' : 'width']: horizontal ? height : width
          }}
        >
          {/* Render virtual items */}
          {virtualState.items.map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;

            const itemStyle: React.CSSProperties = {
              position: 'absolute',
              [horizontal ? 'left' : 'top']: virtualItem.start,
              [horizontal ? 'width' : 'height']: virtualItem.size,
              [horizontal ? 'height' : 'width']: horizontal ? height : '100%'
            };

            return (
              <div
                key={virtualItem.key}
                style={itemStyle}
                data-index={virtualItem.index}
              >
                {renderItem({
                  item,
                  index: virtualItem.index,
                  style: itemStyle,
                  isScrolling: virtualState.isScrolling
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && virtualState.totalSize > (horizontal ? containerWidth : containerHeight) && (
        <div style={scrollIndicatorStyle} />
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded pointer-events-none">
          <div>Items: {items.length}</div>
          <div>Visible: {virtualState.startIndex}-{virtualState.endIndex}</div>
          <div>Overscan: {virtualState.overscanStartIndex}-{virtualState.overscanEndIndex}</div>
          <div>Scroll: {Math.round(virtualState.scrollOffset)}</div>
          <div>Total: {Math.round(virtualState.totalSize)}</div>
          <div>Scrolling: {virtualState.isScrolling ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;

// Utility component for simple list items
export const SimpleListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
}> = ({ children, className, onClick, isSelected, isHovered }) => {
  return (
    <div
      className={cn(
        'flex items-center px-4 py-2 cursor-pointer transition-colors duration-150',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isSelected && 'bg-blue-100 dark:bg-blue-900',
        isHovered && 'bg-gray-50 dark:bg-gray-700',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Utility component for grid items
export const GridItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  aspectRatio?: number;
}> = ({ children, className, onClick, aspectRatio = 1 }) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg cursor-pointer transition-transform duration-200',
        'hover:scale-105 hover:shadow-lg',
        className
      )}
      style={{ aspectRatio }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};