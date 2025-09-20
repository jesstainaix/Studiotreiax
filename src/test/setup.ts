/**
 * Vitest Setup File for PPTX Studio Tests
 * Global test configuration, mocks, and utilities
 */

import '@testing-library/jest-dom';
import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with react-testing-library matchers
expect.extend(matchers);

// Run cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Global browser API configurations
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock for File API
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  arrayBuffer: () => Promise<ArrayBuffer>;

  constructor(
    parts: Array<BlobPart>,
    filename: string,
    options: FilePropertyBag = {}
  ) {
    this.name = filename;
    this.size = 0;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
    this.arrayBuffer = async () => new ArrayBuffer(0);
  }
};

// Mock for Blob API
global.Blob = class MockBlob {
  size: number;
  type: string;

  constructor(content: Array<any>, options: BlobPropertyBag = {}) {
    this.size = 0;
    this.type = options.type || '';
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  slice(): Blob {
    return new Blob([]);
  }
};

// Setup performance monitoring for tests
const originalPerformance = global.performance;
global.performance = {
  ...originalPerformance,
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockReturnValue([]),
  getEntriesByType: vi.fn().mockReturnValue([]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  now: vi.fn().mockReturnValue(Date.now()),
  memory: {
    jsHeapSizeLimit: 2172649472,
    totalJSHeapSize: 50447360,
    usedJSHeapSize: 47033904
  }
};

// Setup Web APIs mocks
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
});

// Mock for localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock for sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock for matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock for ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock for IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // Implementation not needed for most tests
  }
};

// Mock for navigator
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    }
  },
  writable: true
});

// Utilities for asynchronous tests
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const flushPromises = async (): Promise<void> => {
  await vi.runAllTimersAsync();
  await new Promise(resolve => setImmediate(resolve));
};

// Mock hook utilities
export const createMockHookReturn = <T>(initialState: T) => {
  const state = { ...initialState };
  const setState = vi.fn((newState: Partial<T>) => {
    Object.assign(state, newState);
  });
  
  return {
    state,
    setState,
    reset: () => {
      Object.assign(state, initialState);
      setState.mockClear();
    },
  };
};

// Global test utilities
declare global {
  var testUtils: {
    waitFor: (ms: number) => Promise<void>;
    flushPromises: () => Promise<void>;
    createMockFn: (returnValue?: any) => any;
    createMockPromise: (resolveValue?: any, rejectValue?: any) => Promise<any>;
    mockTimers: () => {
      advanceTimersByTime: (ms: number) => void;
      runAllTimers: () => void;
      runOnlyPendingTimers: () => void;
      restore: () => void;
    };
  };
}

// Initialize global test utilities
global.testUtils = {
  waitFor,
  flushPromises,
  createMockFn: (returnValue?: any) => vi.fn().mockReturnValue(returnValue),
  createMockPromise: (resolveValue?: any, rejectValue?: any) =>
    rejectValue
      ? Promise.reject(rejectValue)
      : Promise.resolve(resolveValue),
  mockTimers: () => {
    vi.useFakeTimers();
    return {
      advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
      runAllTimers: () => vi.runAllTimers(),
      runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
      restore: () => vi.useRealTimers(),
    };
  },
};