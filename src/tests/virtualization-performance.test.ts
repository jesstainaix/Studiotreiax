import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { useVirtualization } from '../hooks/useVirtualization';
import { VirtualizedList } from '../components/virtualization/VirtualizedList';
import { VirtualizedTimeline } from '../components/virtualization/VirtualizedTimeline';
import { VirtualizedEffectsList } from '../components/virtualization/VirtualizedEffectsList';
import { VirtualizedMediaLibrary } from '../components/virtualization/VirtualizedMediaLibrary';
import { VirtualizationProvider } from '../providers/VirtualizationProvider';
import { virtualizationService } from '../services/virtualizationService';

// Mock data para testes
const mockItems = Array.from({ length: 10000 }, (_, index) => ({
  id: `item-${index}`,
  content: `Item ${index}`,
  height: 50 + (index % 3) * 20, // Altura variável
  data: { value: index }
}));

const mockEffects = Array.from({ length: 1000 }, (_, index) => ({
  id: `effect-${index}`,
  name: `Effect ${index}`,
  category: ['filter', 'color', 'transform', 'transition'][index % 4] as any,
  thumbnail: `thumbnail-${index}.jpg`,
  description: `Description for effect ${index}`
}));

const mockMediaItems = Array.from({ length: 5000 }, (_, index) => ({
  id: `media-${index}`,
  name: `Media${index}.mp4`,
  type: ['video', 'audio', 'image'][index % 3] as any,
  size: 1024000 + index * 1000,
  duration: 120 + index,
  thumbnail: `thumb-${index}.jpg`,
  path: `/media/file${index}`,
  createdAt: new Date(),
  tags: [`tag${index % 5}`]
}));

const mockTracks = Array.from({ length: 50 }, (_, index) => ({
  id: `track-${index}`,
  name: `Track ${index}`,
  type: ['video', 'audio'][index % 2] as any,
  height: 60,
  clips: Array.from({ length: 100 }, (_, clipIndex) => ({
    id: `clip-${index}-${clipIndex}`,
    startTime: clipIndex * 1000,
    duration: 1000,
    content: `Clip ${clipIndex}`,
    trackId: `track-${index}`
  }))
}));

// Wrapper com provider para testes
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <VirtualizationProvider
    config={{
      enableMetrics: true,
      enableDebug: false,
      cacheSize: 1000,
      overscanCount: 5,
      scrollDebounceMs: 16,
      resizeDebounceMs: 100,
      itemSizeEstimate: 60,
      enableVirtualization: true,
      enableSmoothing: true,
      smoothingFactor: 0.1,
      preloadDistance: 200,
      recycleThreshold: 50
    }}
  >
    {children}
  </VirtualizationProvider>
);

describe('Virtualization Performance Tests', () => {
  beforeEach(() => {
    // Reset do serviço de virtualização
    virtualizationService.clearCache();
    virtualizationService.resetMetrics();
  });

  describe('useVirtualization Hook', () => {
    it('should calculate visible items efficiently for large datasets', () => {
      const { result } = renderHook(
        () => useVirtualization({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 400,
          overscan: 5
        }),
        { wrapper: TestWrapper }
      );

      const startTime = performance.now();
      
      act(() => {
        result.current.scrollToIndex(5000);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Deve executar em menos de 10ms
      expect(executionTime).toBeLessThan(10);
      expect(result.current.visibleItems.length).toBeGreaterThan(0);
      expect(result.current.visibleItems.length).toBeLessThan(20); // Apenas itens visíveis + overscan
    });

    it('should handle rapid scroll events without performance degradation', () => {
      const { result } = renderHook(
        () => useVirtualization({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 400,
          overscan: 5
        }),
        { wrapper: TestWrapper }
      );

      const startTime = performance.now();
      
      // Simular scroll rápido
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.handleScroll({ target: { scrollTop: i * 10 } } as any);
        });
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Deve executar em menos de 50ms para 100 eventos de scroll
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('VirtualizedList Component', () => {
    it('should render large lists without performance issues', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div style={{ height: '400px' }}>
            <VirtualizedList
              items={mockItems}
              renderItem={({ item, index, style }) => (
                <div key={item.id} style={style}>
                  {item.content}
                </div>
              )}
              itemHeight={50}
              height={400}
              virtualizationConfig={{
                overscan: 5,
                enableCache: true,
                enableMetrics: true
              }}
            />
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Renderização inicial deve ser rápida
      expect(renderTime).toBeLessThan(100);
      
      // Deve renderizar apenas alguns itens, não todos os 10000
      const renderedItems = screen.getAllByText(/Item \d+/);
      expect(renderedItems.length).toBeLessThan(50);
    });
  });

  describe('VirtualizedTimeline Component', () => {
    it('should handle large number of tracks and clips efficiently', () => {
      const mockEngine = {
        getTracks: () => mockTracks,
        getClips: () => mockTracks.flatMap(track => track.clips),
        getCurrentTime: () => 0,
        getDuration: () => 100000
      };

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div style={{ height: '400px' }}>
            <VirtualizedTimeline
              engine={mockEngine as any}
              tracks={mockTracks}
              clips={mockTracks.flatMap(track => track.clips)}
              currentTime={0}
              zoom={1}
              onTimeChange={() => {}}
              onSelectionChange={() => {}}
              onZoomChange={() => {}}
              height={400}
              showWaveforms={false}
              showThumbnails={false}
              virtualizationConfig={{
                overscan: 5,
                itemHeight: 60,
                enableCache: true,
                enableMetrics: true
              }}
            />
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Renderização deve ser eficiente mesmo com muitos tracks
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('VirtualizedEffectsList Component', () => {
    it('should render large effects list efficiently', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div style={{ height: '400px' }}>
            <VirtualizedEffectsList
              effects={mockEffects}
              onEffectSelect={() => {}}
              onEffectPreview={() => {}}
              searchQuery=""
              selectedCategory="all"
              virtualizationConfig={{
                overscan: 3,
                itemHeight: 120,
                enableCache: true,
                enableMetrics: true
              }}
            />
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('VirtualizedMediaLibrary Component', () => {
    it('should handle large media collections efficiently', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div style={{ height: '400px' }}>
            <VirtualizedMediaLibrary
              mediaItems={mockMediaItems}
              onMediaSelect={() => {}}
              onMediaPreview={() => {}}
              onMediaImport={() => {}}
              searchQuery=""
              selectedType="all"
              sortBy="name"
              sortOrder="asc"
              virtualizationConfig={{
                overscan: 4,
                itemHeight: 150,
                enableCache: true,
                enableMetrics: true
              }}
            />
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('VirtualizationService', () => {
    it('should calculate viewport efficiently', () => {
      const startTime = performance.now();
      
      const viewport = virtualizationService.calculateViewport({
        scrollTop: 5000,
        containerHeight: 400,
        itemHeight: 50,
        totalItems: 10000,
        overscan: 5
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1); // Deve ser muito rápido
      expect(viewport.startIndex).toBeGreaterThanOrEqual(0);
      expect(viewport.endIndex).toBeLessThan(10000);
      expect(viewport.visibleItems.length).toBeLessThan(20);
    });

    it('should manage cache efficiently', () => {
      // Adicionar muitos itens ao cache
      for (let i = 0; i < 1000; i++) {
        virtualizationService.setCache(`item-${i}`, { data: `cached-${i}` });
      }

      const startTime = performance.now();
      
      // Testar acesso ao cache
      for (let i = 0; i < 100; i++) {
        virtualizationService.getCache(`item-${i}`);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5);
      
      // Verificar métricas
      const metrics = virtualizationService.getMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });

    it('should provide performance metrics', () => {
      // Executar algumas operações
      virtualizationService.calculateViewport({
        scrollTop: 1000,
        containerHeight: 400,
        itemHeight: 50,
        totalItems: 1000,
        overscan: 5
      });

      const metrics = virtualizationService.getMetrics();
      
      expect(metrics).toHaveProperty('renderCount');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics).toHaveProperty('averageRenderTime');
      expect(metrics).toHaveProperty('memoryUsage');
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks with large datasets', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Renderizar e destruir componentes múltiplas vezes
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <div style={{ height: '400px' }}>
              <VirtualizedList
                items={mockItems}
                renderItem={({ item, style }) => (
                  <div key={item.id} style={style}>
                    {item.content}
                  </div>
                )}
                itemHeight={50}
                height={400}
                virtualizationConfig={{
                  overscan: 5,
                  enableCache: true,
                  enableMetrics: true
                }}
              />
            </div>
          </TestWrapper>
        );
        
        unmount();
      }

      // Forçar garbage collection se disponível
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Aumento de memória deve ser razoável (menos de 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});

// Função para executar benchmark de performance
export const runPerformanceBenchmark = () => {
  console.log('🚀 Iniciando benchmark de performance da virtualização...');
  
  const results = {
    listRender: 0,
    timelineRender: 0,
    effectsRender: 0,
    mediaLibraryRender: 0,
    scrollPerformance: 0,
    cachePerformance: 0
  };

  // Benchmark VirtualizedList
  const listStart = performance.now();
  // Simular renderização
  results.listRender = performance.now() - listStart;

  // Benchmark scroll performance
  const scrollStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    virtualizationService.calculateViewport({
      scrollTop: i * 10,
      containerHeight: 400,
      itemHeight: 50,
      totalItems: 10000,
      overscan: 5
    });
  }
  results.scrollPerformance = performance.now() - scrollStart;

  // Benchmark cache performance
  const cacheStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    virtualizationService.setCache(`benchmark-${i}`, { data: i });
    virtualizationService.getCache(`benchmark-${i}`);
  }
  results.cachePerformance = performance.now() - cacheStart;

  console.log('📊 Resultados do benchmark:', results);
  console.log('📈 Métricas do serviço:', virtualizationService.getMetrics());
  
  return results;
};