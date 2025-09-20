import { MultiLayerCache, MemoryCache, LocalStorageCache, IndexedDBCache } from '../multi-layer-cache';

describe('MultiLayerCache', () => {
  let cache: MultiLayerCache;
  
  beforeEach(() => {
    cache = new MultiLayerCache({
      memory: { maxSize: 100, ttl: 5000 },
      localStorage: { maxSize: 50, ttl: 10000 },
      indexedDB: { maxSize: 200, ttl: 20000 }
    });
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe('set and get operations', () => {
    it('should store and retrieve data from memory cache', async () => {
      const testData = { id: 1, name: 'Test Data' };
      
      await cache.set('test-key', testData);
      const retrieved = await cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle complex objects', async () => {
      const complexData = {
        slide: {
          id: 'slide-1',
          title: 'Complex Slide',
          content: 'Complex content',
          images: [{ id: 'img-1', src: 'test.jpg', alt: 'Test' }],
          metadata: { createdAt: new Date(), tags: ['test', 'complex'] }
        },
        analysis: {
          topics: ['topic1', 'topic2'],
          sentiment: 0.8,
          complexity: 'medium'
        }
      };
      
      await cache.set('complex-key', complexData);
      const retrieved = await cache.get('complex-key');
      
      expect(retrieved).toEqual(complexData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire data after TTL', async () => {
      const shortTTLCache = new MultiLayerCache({
        memory: { maxSize: 100, ttl: 100 }, // 100ms TTL
        localStorage: { maxSize: 50, ttl: 200 },
        indexedDB: { maxSize: 200, ttl: 300 }
      });
      
      await shortTTLCache.set('ttl-key', 'test-data');
      
      // Should be available immediately
      let result = await shortTTLCache.get('ttl-key');
      expect(result).toBe('test-data');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      result = await shortTTLCache.get('ttl-key');
      expect(result).toBeNull();
      
      await shortTTLCache.clear();
    });
  });

  describe('cache layers', () => {
    it('should promote data from lower to higher layers on access', async () => {
      // Manually set data in localStorage only
      const localStorageCache = new LocalStorageCache({ maxSize: 50, ttl: 10000 });
      await localStorageCache.set('promote-key', 'promote-data');
      
      // Access through multi-layer cache should promote to memory
      const result = await cache.get('promote-key');
      expect(result).toBe('promote-data');
      
      // Verify it's now in memory cache
      const memoryCache = new MemoryCache({ maxSize: 100, ttl: 5000 });
      const memoryResult = await memoryCache.get('promote-key');
      expect(memoryResult).toBe('promote-data');
    });

    it('should fall back to lower layers when data not in higher layers', async () => {
      // Set data directly in IndexedDB
      const indexedDBCache = new IndexedDBCache({ maxSize: 200, ttl: 20000 });
      await indexedDBCache.set('fallback-key', 'fallback-data');
      
      // Should retrieve from IndexedDB and promote to higher layers
      const result = await cache.get('fallback-key');
      expect(result).toBe('fallback-data');
    });
  });

  describe('eviction policies', () => {
    it('should evict least recently used items when cache is full', async () => {
      const smallCache = new MultiLayerCache({
        memory: { maxSize: 2, ttl: 5000 }, // Very small cache
        localStorage: { maxSize: 2, ttl: 10000 },
        indexedDB: { maxSize: 2, ttl: 20000 }
      });
      
      // Fill cache to capacity
      await smallCache.set('key1', 'data1');
      await smallCache.set('key2', 'data2');
      
      // Access key1 to make it more recently used
      await smallCache.get('key1');
      
      // Add new item, should evict key2
      await smallCache.set('key3', 'data3');
      
      // key1 and key3 should exist, key2 should be evicted
      expect(await smallCache.get('key1')).toBe('data1');
      expect(await smallCache.get('key3')).toBe('data3');
      
      await smallCache.clear();
    });
  });

  describe('batch operations', () => {
    it('should handle batch set operations', async () => {
      const batchData = {
        'batch-key-1': { id: 1, data: 'batch1' },
        'batch-key-2': { id: 2, data: 'batch2' },
        'batch-key-3': { id: 3, data: 'batch3' }
      };
      
      await cache.setMany(batchData);
      
      for (const [key, expectedValue] of Object.entries(batchData)) {
        const result = await cache.get(key);
        expect(result).toEqual(expectedValue);
      }
    });

    it('should handle batch get operations', async () => {
      // Set up test data
      await cache.set('multi-key-1', 'multi-data-1');
      await cache.set('multi-key-2', 'multi-data-2');
      await cache.set('multi-key-3', 'multi-data-3');
      
      const keys = ['multi-key-1', 'multi-key-2', 'multi-key-3', 'non-existent'];
      const results = await cache.getMany(keys);
      
      expect(results['multi-key-1']).toBe('multi-data-1');
      expect(results['multi-key-2']).toBe('multi-data-2');
      expect(results['multi-key-3']).toBe('multi-data-3');
      expect(results['non-existent']).toBeNull();
    });
  });

  describe('delete operations', () => {
    it('should delete data from all layers', async () => {
      await cache.set('delete-key', 'delete-data');
      
      // Verify data exists
      expect(await cache.get('delete-key')).toBe('delete-data');
      
      // Delete data
      await cache.delete('delete-key');
      
      // Verify data is deleted
      expect(await cache.get('delete-key')).toBeNull();
    });

    it('should handle batch delete operations', async () => {
      await cache.set('delete-batch-1', 'data1');
      await cache.set('delete-batch-2', 'data2');
      await cache.set('delete-batch-3', 'data3');
      
      await cache.deleteMany(['delete-batch-1', 'delete-batch-2']);
      
      expect(await cache.get('delete-batch-1')).toBeNull();
      expect(await cache.get('delete-batch-2')).toBeNull();
      expect(await cache.get('delete-batch-3')).toBe('data3');
    });
  });

  describe('statistics and monitoring', () => {
    it('should track cache statistics', async () => {
      await cache.set('stats-key-1', 'data1');
      await cache.set('stats-key-2', 'data2');
      
      await cache.get('stats-key-1'); // Hit
      await cache.get('stats-key-2'); // Hit
      await cache.get('non-existent'); // Miss
      
      const stats = await cache.getStats();
      
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should provide layer-specific statistics', async () => {
      await cache.set('layer-stats-key', 'layer-data');
      await cache.get('layer-stats-key');
      
      const stats = await cache.getStats();
      
      expect(stats.layers).toBeDefined();
      expect(stats.layers.memory).toBeDefined();
      expect(stats.layers.localStorage).toBeDefined();
      expect(stats.layers.indexedDB).toBeDefined();
    });
  });

  describe('synchronization', () => {
    it('should synchronize data across layers', async () => {
      await cache.set('sync-key', 'sync-data');
      
      // Force synchronization
      await cache.sync();
      
      // Verify data exists in all layers
      const memoryCache = new MemoryCache({ maxSize: 100, ttl: 5000 });
      const localStorageCache = new LocalStorageCache({ maxSize: 50, ttl: 10000 });
      
      expect(await memoryCache.get('sync-key')).toBe('sync-data');
      expect(await localStorageCache.get('sync-key')).toBe('sync-data');
    });
  });

  describe('error handling', () => {
    it('should handle storage quota exceeded gracefully', async () => {
      // This test simulates quota exceeded scenario
      const quotaExceededCache = new MultiLayerCache({
        memory: { maxSize: 1, ttl: 5000 }, // Very small to trigger quota issues
        localStorage: { maxSize: 1, ttl: 10000 },
        indexedDB: { maxSize: 1, ttl: 20000 }
      });
      
      const largeData = 'x'.repeat(1000000); // Large data to exceed quota
      
      // Should not throw error, but handle gracefully
      await expect(quotaExceededCache.set('large-key', largeData)).resolves.not.toThrow();
      
      await quotaExceededCache.clear();
    });

    it('should handle corrupted data gracefully', async () => {
      // Simulate corrupted data by directly manipulating localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cache:corrupted-key', 'invalid-json{');
      }
      
      // Should return null for corrupted data
      const result = await cache.get('corrupted-key');
      expect(result).toBeNull();
    });
  });
});

describe('Individual Cache Layers', () => {
  describe('MemoryCache', () => {
    let memoryCache: MemoryCache;
    
    beforeEach(() => {
      memoryCache = new MemoryCache({ maxSize: 10, ttl: 5000 });
    });

    it('should store and retrieve data in memory', async () => {
      await memoryCache.set('memory-key', 'memory-data');
      const result = await memoryCache.get('memory-key');
      expect(result).toBe('memory-data');
    });

    it('should respect memory size limits', async () => {
      const smallMemoryCache = new MemoryCache({ maxSize: 2, ttl: 5000 });
      
      await smallMemoryCache.set('key1', 'data1');
      await smallMemoryCache.set('key2', 'data2');
      await smallMemoryCache.set('key3', 'data3'); // Should evict key1
      
      expect(await smallMemoryCache.get('key1')).toBeNull();
      expect(await smallMemoryCache.get('key2')).toBe('data2');
      expect(await smallMemoryCache.get('key3')).toBe('data3');
    });
  });

  describe('LocalStorageCache', () => {
    let localStorageCache: LocalStorageCache;
    
    beforeEach(() => {
      localStorageCache = new LocalStorageCache({ maxSize: 10, ttl: 5000 });
    });

    afterEach(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    it('should store and retrieve data in localStorage', async () => {
      if (typeof localStorage === 'undefined') {
        // Skip test in environments without localStorage
        return;
      }
      
      await localStorageCache.set('localStorage-key', 'localStorage-data');
      const result = await localStorageCache.get('localStorage-key');
      expect(result).toBe('localStorage-data');
    });
  });

  describe('IndexedDBCache', () => {
    let indexedDBCache: IndexedDBCache;
    
    beforeEach(() => {
      indexedDBCache = new IndexedDBCache({ maxSize: 10, ttl: 5000 });
    });

    it('should store and retrieve data in IndexedDB', async () => {
      if (typeof indexedDB === 'undefined') {
        // Skip test in environments without IndexedDB
        return;
      }
      
      await indexedDBCache.set('indexedDB-key', 'indexedDB-data');
      const result = await indexedDBCache.get('indexedDB-key');
      expect(result).toBe('indexedDB-data');
    });
  });
});