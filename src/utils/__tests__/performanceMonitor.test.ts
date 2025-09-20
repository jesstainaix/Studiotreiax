import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from '../performanceMonitor';
import { OptimizationLevel } from '../../types/performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockPerformance: any;
  let mockNavigator: any;
  let mockDocument: any;
  let rafCallback: Function | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      rafCallback = callback;
      return 1;
    };

    // Mock performance.now()
    let currentTime = 0;
    mockPerformance = {
      now: vi.fn(() => currentTime),
      memory: {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
        totalJSHeapSize: 200 * 1024 * 1024, // 200MB
        jsHeapSizeLimit: 4096 * 1024 * 1024 // 4GB
      }
    };
    global.performance = mockPerformance;

    // Mock navigator
    mockNavigator = {
      hardwareConcurrency: 4
    };
    global.navigator = mockNavigator;

    // Mock document with Intel GPU (tier 2)
    mockDocument = {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => ({
          getExtension: vi.fn(() => ({
            UNMASKED_RENDERER_WEBGL: 'test'
          })),
          getParameter: vi.fn(() => 'Intel')
        }))
      }))
    };
    global.document = mockDocument;

    // Reset singleton instance to ensure fresh state with mocked values
    (PerformanceMonitor as any).instance = undefined;
    monitor = PerformanceMonitor.getInstance();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    rafCallback = null;
    (PerformanceMonitor as any).instance = undefined;
  });

  it('should be a singleton', () => {
    const instance1 = PerformanceMonitor.getInstance();
    const instance2 = PerformanceMonitor.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize with default values', () => {
    const metrics = monitor.getMetrics();
    expect(metrics.fps).toBe(0);
    expect(metrics.averageFPS).toBe(0);
    expect(metrics.memoryUsage.used).toBe(0);
  });

  it('should start and stop monitoring', () => {
    monitor.start();
    expect(monitor.getMetrics().fps).toBe(0);
    monitor.stop();
  });

  it('should detect hardware info', () => {
    const info = monitor.getHardwareInfo();
    expect(info.cores).toBe(4);
    expect(info.gpu.tier).toBe(2);
    expect(info.memory).toBe(4096); // 4GB in MB
  });

  it('should recommend optimization level based on hardware', () => {
    const level = monitor.getRecommendedOptimizationLevel();
    expect(level).toBe(OptimizationLevel.MEDIUM);
  });

  it('should validate optimization settings', () => {
    expect(() => {
      monitor.setOptimizationSettings({
        maxTextureSize: 100
      });
    }).toThrow();

    expect(() => {
      monitor.setOptimizationSettings({
        maxTextureSize: 512
      });
    }).not.toThrow();
  });

  it('should update optimization settings', () => {
    const newSettings = {
      level: OptimizationLevel.HIGH,
      maxTextureSize: 4096
    };
    monitor.setOptimizationSettings(newSettings);
    const settings = monitor.getOptimizationSettings();
    expect(settings.level).toBe(OptimizationLevel.HIGH);
    expect(settings.maxTextureSize).toBe(4096);
  });

  it('should track FPS', () => {
    monitor.start();
    
    // Set initial time
    mockPerformance.now.mockReturnValue(0);
    if (rafCallback) rafCallback(0);
    
    // Simulate 60 frames in 1 second
    for (let i = 1; i <= 60; i++) {
      mockPerformance.now.mockReturnValue(i * 16.67); // ~60fps timing
      if (rafCallback) rafCallback(mockPerformance.now());
    }
    
    // Advance to trigger FPS calculation
    mockPerformance.now.mockReturnValue(1000);
    if (rafCallback) rafCallback(1000);
    
    const metrics = monitor.getMetrics();
    expect(metrics.fps).toBe(60);
    monitor.stop();
  });

  it('should maintain FPS history', () => {
    monitor.start();
    
    // Set initial time
    mockPerformance.now.mockReturnValue(0);
    if (rafCallback) rafCallback(0);
    
    // Simulate multiple seconds of frames
    for (let second = 0; second < 3; second++) {
      // 60 frames per second
      for (let i = 1; i <= 60; i++) {
        mockPerformance.now.mockReturnValue(second * 1000 + i * 16.67);
        if (rafCallback) rafCallback(mockPerformance.now());
      }
      
      // Complete the second
      mockPerformance.now.mockReturnValue((second + 1) * 1000);
      if (rafCallback) rafCallback(mockPerformance.now());
    }
    
    const history = monitor.getFPSHistory();
    expect(history.length).toBeGreaterThan(0);
    monitor.stop();
  });

  it('should track memory metrics', () => {
    monitor.start();
    
    // Run multiple interval cycles to collect memory samples
    for (let i = 0; i < 5; i++) {
      // Update memory values before each interval
      mockPerformance.memory.usedJSHeapSize = 100 * (i + 1) * 1024 * 1024; // Increase by 100MB
      mockPerformance.memory.totalJSHeapSize = 200 * (i + 1) * 1024 * 1024;
      
      // Advance time and run interval callback
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
      
      // Run any pending animation frames
      if (rafCallback) rafCallback(performance.now());
    }
    
    const history = monitor.getMemoryHistory();
    expect(history.length).toBeGreaterThan(0);
    monitor.stop();
  });

  it('should trigger memory warning callbacks', () => {
    const warningCallback = vi.fn();
    monitor.onMemoryWarning(warningCallback);
    monitor.start();

    // Simulate high memory usage (95%)
    mockPerformance.memory.usedJSHeapSize = 3891 * 1024 * 1024; // 95% of 4GB
    mockPerformance.memory.totalJSHeapSize = 4000 * 1024 * 1024;
    mockPerformance.memory.jsHeapSizeLimit = 4096 * 1024 * 1024;

    // Run interval to trigger warning check
    vi.advanceTimersByTime(1000);
    vi.runOnlyPendingTimers();
    
    expect(warningCallback).toHaveBeenCalled();
    monitor.stop();
  });

  it('should trigger FPS warning callbacks', () => {
    const warningCallback = vi.fn();
    monitor.onFPSWarning(warningCallback);
    monitor.start();
    
    // Set initial time and frame counter
    mockPerformance.now.mockReturnValue(0);
    if (rafCallback) rafCallback(0);
    
    // Simulate exactly 15 frames in 1 second
    // We'll use 1001ms total time to ensure we're slightly over 1 second
    // This gives us exactly 15 frames in the elapsed time
    for (let i = 1; i <= 15; i++) {
      mockPerformance.now.mockReturnValue(i * 66.733333); // Exactly 15 frames in 1001ms
      if (rafCallback) rafCallback(mockPerformance.now());
    }
    
    // Complete the second
    mockPerformance.now.mockReturnValue(1001);
    if (rafCallback) rafCallback(1001);
    
    // Run any pending timers
    vi.runOnlyPendingTimers();
    
    expect(warningCallback).toHaveBeenCalledWith(15);
    monitor.stop();
  });
});