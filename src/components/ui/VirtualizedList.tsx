// Componente de lista virtualizada para melhor performance com grandes datasets
import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualization } from '../../hooks/useVirtualization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

// Componente de loading padrão
const DefaultLoadingComponent = memo(() => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Carregando...</span>
  </div>
));

DefaultLoadingComponent.displayName = 'DefaultLoadingComponent';

// Componente de lista vazia padrão
const DefaultEmptyComponent = memo(() => (
  <div className="flex items-center justify-center py-8 text-gray-500">
    <p>Nenhum item encontrado</p>
  </div>
));

DefaultEmptyComponent.displayName = 'DefaultEmptyComponent';

// Componente de item virtualizado
const VirtualizedItem = memo<{
  item: any;
  index: number;
  style: React.CSSProperties;
  renderItem: (item: any, index: number) => React.ReactNode;
}>(({ item, index, style, renderItem }) => {
  return (
    <div style={style} className="absolute w-full">
      {renderItem(item, index)}
    </div>
  );
});

VirtualizedItem.displayName = 'VirtualizedItem';

// Hook para otimizar re-renders
const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
};

// Componente principal da lista virtualizada
export const VirtualizedList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
  headerComponent,
  footerComponent
}: VirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Usar o hook de virtualização
  const {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex
  } = useVirtualization({
    items,
    itemHeight,
    containerHeight,
    scrollTop,
    overscan
  });

  // Handler de scroll otimizado
  const handleScroll = useStableCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  });

  // Memoizar componentes condicionais
  const LoadingComponent = useMemo(() => {
    return loadingComponent || <DefaultLoadingComponent />;
  }, [loadingComponent]);

  const EmptyComponent = useMemo(() => {
    return emptyComponent || <DefaultEmptyComponent />;
  }, [emptyComponent]);

  // Memoizar estilos do container
  const containerStyle = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto',
    position: 'relative' as const
  }), [containerHeight]);

  const innerStyle = useMemo(() => ({
    height: totalHeight,
    position: 'relative' as const
  }), [totalHeight]);

  // Renderizar items visíveis
  const renderedItems = useMemo(() => {
    return visibleItems.map((item, virtualIndex) => {
      const actualIndex = startIndex + virtualIndex;
      const key = keyExtractor(item, actualIndex);
      const top = actualIndex * itemHeight;
      
      const style: React.CSSProperties = {
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: itemHeight
      };

      return (
        <VirtualizedItem
          key={key}
          item={item}
          index={actualIndex}
          style={style}
          renderItem={renderItem}
        />
      );
    });
  }, [visibleItems, startIndex, itemHeight, keyExtractor, renderItem]);

  // Scroll para um item específico
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const itemTop = index * itemHeight;
    
    let scrollTo = itemTop;
    
    if (align === 'center') {
      scrollTo = itemTop - (containerHeight - itemHeight) / 2;
    } else if (align === 'end') {
      scrollTo = itemTop - containerHeight + itemHeight;
    }
    
    container.scrollTo({
      top: Math.max(0, Math.min(scrollTo, totalHeight - containerHeight)),
      behavior: 'smooth'
    });
  }, [itemHeight, containerHeight, totalHeight]);

  // Expor método de scroll via ref
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToItem = scrollToItem;
    }
  }, [scrollToItem]);

  // Renderizar loading
  if (loading) {
    return (
      <div className={`${className}`} style={containerStyle}>
        {LoadingComponent}
      </div>
    );
  }

  // Renderizar lista vazia
  if (items.length === 0) {
    return (
      <div className={`${className}`} style={containerStyle}>
        {headerComponent}
        {EmptyComponent}
        {footerComponent}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${className}`}
      style={containerStyle}
      onScroll={handleScroll}
    >
      {headerComponent}
      
      <div style={innerStyle}>
        {renderedItems}
      </div>
      
      {footerComponent}
    </div>
  );
}) as <T>(props: VirtualizedListProps<T>) => JSX.Element;

VirtualizedList.displayName = 'VirtualizedList';

// Hook para usar a lista virtualizada com configurações padrão
export const useVirtualizedList = <T,>({
  items,
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
}: {
  items: T[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const virtualization = useVirtualization({
    items,
    itemHeight,
    containerHeight,
    scrollTop,
    overscan
  });

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  return {
    ...virtualization,
    handleScroll,
    scrollTop
  };
};

// Componente de lista simples com virtualização
export const SimpleVirtualizedList = memo(<T,>({
  items,
  renderItem,
  keyExtractor,
  itemHeight = 50,
  containerHeight = 400,
  className = '',
  ...props
}: Omit<VirtualizedListProps<T>, 'itemHeight' | 'containerHeight'> & {
  itemHeight?: number;
  containerHeight?: number;
}) => {
  return (
    <VirtualizedList
      items={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      className={className}
      {...props}
    />
  );
}) as <T>(props: Omit<VirtualizedListProps<T>, 'itemHeight' | 'containerHeight'> & {
  itemHeight?: number;
  containerHeight?: number;
}) => JSX.Element;

SimpleVirtualizedList.displayName = 'SimpleVirtualizedList';

export default VirtualizedList;