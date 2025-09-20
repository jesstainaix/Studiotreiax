/**
 * Testes Específicos para Sistema de Cache Multi-Camadas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MultiLayerCache, createCache, quickCache } from '../multi-layer-cache';

// Mocks para APIs do navegador
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

// Mock para performance.now()
const mockPerformanceNow = vi.fn();

describe('MultiLayerCache', () => {
  let cache: MultiLayerCache;
  let mockTime = 1000;

  beforeEach(async () => {
    // Setup mocks
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    Object.defineProperty(global, 'indexedDB', {
      value: mockIndexedDB,
      writable: true
    });

    Object.defineProperty(global.performance, 'now', {
      value: mockPerformanceNow,
      writable: true
    });

    mockPerformanceNow.mockImplementation(() => mockTime);
    
    vi.clearAllMocks();
    
    cache = MultiLayerCache.getInstance();
    await cache.initialize();
  });

  afterEach(async () => {
    await cache.clear();
    vi.clearAllMocks();
  });

  describe('Inicialização e Configuração', () => {
    it('deve inicializar com configuração padrão', () => {
      const config = cache.getConfiguration();
      
      expect(config.memoryLimit).toBeGreaterThan(0);
      expect(config.localStorageLimit).toBeGreaterThan(0);
      expect(config.indexedDBLimit).toBeGreaterThan(0);
      expect(config.defaultTTL).toBeGreaterThan(0);
      expect(typeof config.enableCompression).toBe('boolean');
    });

    it('deve aplicar configuração personalizada', async () => {
      const customConfig = {
        memoryLimit: 50 * 1024 * 1024, // 50MB
        localStorageLimit: 10 * 1024 * 1024, // 10MB
        indexedDBLimit: 500 * 1024 * 1024, // 500MB
        defaultTTL: 7200000, // 2 horas
        enableCompression: false,
        enableMetrics: true,
        autoCleanup: true,
        cleanupInterval: 300000 // 5 minutos
      };

      await cache.configure(customConfig);
      const config = cache.getConfiguration();

      expect(config.memoryLimit).toBe(50 * 1024 * 1024);
      expect(config.localStorageLimit).toBe(10 * 1024 * 1024);
      expect(config.defaultTTL).toBe(7200000);
      expect(config.enableCompression).toBe(false);
    });

    it('deve validar configuração inválida', async () => {
      await expect(cache.configure({ memoryLimit: -1 })).rejects.toThrow();
      await expect(cache.configure({ defaultTTL: 0 })).rejects.toThrow();
      await expect(cache.configure({ cleanupInterval: -100 })).rejects.toThrow();
    });
  });

  describe('Operações de Cache Básicas', () => {
    it('deve armazenar e recuperar dados da memória', async () => {
      const testData = { message: 'Hello World', timestamp: Date.now() };
      
      await cache.set('test-key', testData);
      const retrieved = await cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('deve armazenar dados com TTL personalizado', async () => {
      const testData = { content: 'temporary data' };
      const shortTTL = 1000; // 1 segundo
      
      await cache.set('temp-key', testData, shortTTL);
      
      // Deve estar disponível imediatamente
      let retrieved = await cache.get('temp-key');
      expect(retrieved).toEqual(testData);
      
      // Simula passagem do tempo
      mockTime += 1500; // 1.5 segun