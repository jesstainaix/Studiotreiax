import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TTSLogger, TTSLogEntry, TTSMetrics } from '../tts-logger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

Object.defineProperty(window, 'console', {
  value: consoleMock
});

describe('TTSLogger', () => {
  let logger: TTSLogger;
  let originalDate: DateConstructor;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock Date for consistent timestamps
    originalDate = global.Date;
    const mockDate = new Date('2024-01-01T12:00:00.000Z');
    global.Date = vi.fn(() => mockDate) as any;
    global.Date.now = vi.fn(() => mockDate.getTime());
    
    // Create fresh logger instance
    logger = new TTSLogger({
      maxLogs: 100,
      enableConsole: true,
      enableStorage: true
    });
  });

  afterEach(() => {
    global.Date = originalDate;
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultLogger = new TTSLogger();
      expect(defaultLogger).toBeInstanceOf(TTSLogger);
    });

    it('should initialize with custom options', () => {
      const customLogger = new TTSLogger({
        maxLogs: 50,
        enableConsole: false,
        enableStorage: false
      });
      expect(customLogger).toBeInstanceOf(TTSLogger);
    });

    it('should load existing logs from storage', () => {
      const existingLogs = {
        logs: [
          {
            id: 'test-1',
            timestamp: '2024-01-01T11:00:00.000Z',
            level: 'info',
            provider: 'elevenlabs',
            action: 'synthesis_success',
            message: 'Test log'
          }
        ],
        lastSaved: '2024-01-01T11:00:00.000Z'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLogs));
      
      const loggerWithStorage = new TTSLogger();
      const logs = loggerWithStorage.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test log');
    });
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('elevenlabs', 'synthesis_attempt', 'Starting synthesis', {
        textLength: 100
      });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].provider).toBe('elevenlabs');
      expect(logs[0].action).toBe('synthesis_attempt');
      expect(logs[0].message).toBe('Starting synthesis');
      expect(logs[0].metadata?.textLength).toBe(100);
    });

    it('should log warning messages', () => {
      logger.warn('google', 'rate_limit', 'Rate limit approaching');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
    });

    it('should log error messages', () => {
      logger.error('elevenlabs', 'api_error', 'API request failed', {
        error: 'Network timeout'
      });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].metadata?.error).toBe('Network timeout');
    });

    it('should log debug messages', () => {
      logger.debug('system', 'cache_check', 'Checking cache for key');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log synthesis attempts', () => {
      logger.logSynthesisAttempt('elevenlabs', 150, 'voice-123', 'en-US');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('synthesis_attempt');
      expect(logs[0].metadata?.textLength).toBe(150);
      expect(logs[0].metadata?.voiceId).toBe('voice-123');
      expect(logs[0].metadata?.language).toBe('en-US');
    });

    it('should log synthesis success', () => {
      logger.logSynthesisSuccess('google', 1500, 200, 'voice-456', 'standard');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('synthesis_success');
      expect(logs[0].metadata?.duration).toBe(1500);
      expect(logs[0].metadata?.textLength).toBe(200);
      expect(logs[0].metadata?.success).toBe(true);
      expect(logs[0].metadata?.voiceId).toBe('voice-456');
      expect(logs[0].metadata?.model).toBe('standard');
    });

    it('should log synthesis failure', () => {
      logger.logSynthesisFailure('elevenlabs', 'API quota exceeded', 2000, 100);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('synthesis_failure');
      expect(logs[0].metadata?.error).toBe('API quota exceeded');
      expect(logs[0].metadata?.duration).toBe(2000);
      expect(logs[0].metadata?.success).toBe(false);
    });

    it('should log fallback usage', () => {
      logger.logFallbackUsed('elevenlabs', 'google', 'Primary provider failed', 2);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].provider).toBe('fallback');
      expect(logs[0].action).toBe('fallback_triggered');
      expect(logs[0].metadata?.fallbackUsed).toBe(true);
      expect(logs[0].metadata?.attempts).toBe(2);
    });

    it('should log health checks', () => {
      logger.logHealthCheck('elevenlabs', true);
      logger.logHealthCheck('google', false, 'Connection timeout');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      
      // Success log
      expect(logs[1].action).toBe('health_check');
      expect(logs[1].metadata?.success).toBe(true);
      
      // Failure log
      expect(logs[0].action).toBe('health_check');
      expect(logs[0].metadata?.success).toBe(false);
      expect(logs[0].metadata?.error).toBe('Connection timeout');
    });
  });

  describe('Log Management', () => {
    it('should maintain maximum log limit', () => {
      const smallLogger = new TTSLogger({ maxLogs: 3 });
      
      // Add more logs than the limit
      for (let i = 0; i < 5; i++) {
        smallLogger.info('test', 'action', `Message ${i}`);
      }
      
      const logs = smallLogger.getLogs();
      expect(logs).toHaveLength(3);
      // Should keep the most recent logs (newest first due to unshift)
      expect(logs[0].message).toBe('Message 4');
      expect(logs[2].message).toBe('Message 2');
    });

    it('should clear all logs', () => {
      logger.info('test', 'action', 'Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      const logs = logger.getLogs();
      
      // Should have one log (the clear_logs action itself)
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('clear_logs');
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      // Add various logs for filtering tests
      logger.info('elevenlabs', 'synthesis_success', 'Success 1');
      logger.warn('google', 'rate_limit', 'Warning 1');
      logger.error('elevenlabs', 'synthesis_failure', 'Error 1');
      logger.info('google', 'synthesis_success', 'Success 2');
      logger.debug('system', 'cache_hit', 'Debug 1');
    });

    it('should filter by level', () => {
      const errorLogs = logger.getLogs({ level: 'error' });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error 1');
      
      const infoLogs = logger.getLogs({ level: 'info' });
      expect(infoLogs).toHaveLength(2);
    });

    it('should filter by provider', () => {
      const elevenLabsLogs = logger.getLogs({ provider: 'elevenlabs' });
      expect(elevenLabsLogs).toHaveLength(2);
      
      const googleLogs = logger.getLogs({ provider: 'google' });
      expect(googleLogs).toHaveLength(2);
    });

    it('should filter by action', () => {
      const successLogs = logger.getLogs({ action: 'synthesis_success' });
      expect(successLogs).toHaveLength(2);
    });

    it('should filter by date', () => {
      // Temporarily restore real Date for this test
      global.Date = originalDate;
      
      const testLogger = new TTSLogger({ maxLogs: 100 });
      
      // Add logs with different timestamps
      const pastDate = new Date('2024-01-01T11:00:00.000Z');
      const futureDate = new Date('2024-01-01T13:00:00.000Z');
      
      // Mock different timestamps for each log
      vi.setSystemTime(new Date('2024-01-01T11:30:00.000Z'));
      testLogger.info('test', 'action', 'Old log 1');
      
      vi.setSystemTime(new Date('2024-01-01T12:30:00.000Z'));
      testLogger.info('test', 'action', 'Recent log 1');
      testLogger.info('test', 'action', 'Recent log 2');
      
      // Test filtering
      const recentLogs = testLogger.getLogs({ since: futureDate });
      expect(recentLogs).toHaveLength(0);
      
      const allLogs = testLogger.getLogs({ since: pastDate });
      expect(allLogs).toHaveLength(3);
      
      // Restore mock Date
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      global.Date = vi.fn(() => mockDate) as any;
      global.Date.now = vi.fn(() => mockDate.getTime());
    });

    it('should limit results', () => {
      const limitedLogs = logger.getLogs({ limit: 2 });
      expect(limitedLogs).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const filteredLogs = logger.getLogs({
        provider: 'elevenlabs',
        level: 'info',
        limit: 1
      });
      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].provider).toBe('elevenlabs');
      expect(filteredLogs[0].level).toBe('info');
    });
  });

  describe('Metrics and Analytics', () => {
    beforeEach(() => {
      // Add logs for metrics testing
      logger.logSynthesisSuccess('elevenlabs', 1000, 100, 'voice-1');
      logger.logSynthesisSuccess('google', 1500, 150, 'voice-2');
      logger.logSynthesisFailure('elevenlabs', 'API error', 500, 80);
      logger.logFallbackUsed('elevenlabs', 'google', 'Primary failed', 1);
      logger.logSynthesisSuccess('google', 2000, 200, 'voice-3');
    });

    it('should calculate basic metrics', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics.totalRequests).toBe(4); // 3 synthesis + 1 fallback
      expect(metrics.successfulRequests).toBe(3);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.fallbackUsage).toBe(1);
    });

    it('should calculate average response time', () => {
      const metrics = logger.getMetrics();
      
      // (1000 + 1500 + 500 + 2000) / 4 = 1250
      expect(metrics.averageResponseTime).toBe(1250);
    });

    it('should track provider usage', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics.providerUsage.elevenlabs).toBe(2); // 1 success + 1 failure
      expect(metrics.providerUsage.google).toBe(2); // 2 successes
    });

    it('should track error types', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics.errorTypes['API error']).toBe(1);
    });

    it('should get recent errors', () => {
      const recentErrors = logger.getRecentErrors(5);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].level).toBe('error');
    });

    it('should get provider performance', () => {
      const performance = logger.getProviderPerformance();
      
      expect(performance.elevenlabs.attempts).toBe(2);
      expect(performance.elevenlabs.successes).toBe(1);
      expect(performance.elevenlabs.failures).toBe(1);
      expect(performance.elevenlabs.successRate).toBe(50);
      
      expect(performance.google.attempts).toBe(2);
      expect(performance.google.successes).toBe(2);
      expect(performance.google.failures).toBe(0);
      expect(performance.google.successRate).toBe(100);
    });
  });

  describe('Storage Integration', () => {
    it('should save logs to localStorage', () => {
      logger.info('test', 'action', 'Test message');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tts-logs',
        expect.stringContaining('Test message')
      );
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw
      expect(() => {
        logger.info('test', 'action', 'Test message');
      }).not.toThrow();
    });

    it('should handle corrupted storage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw and create a new logger
      expect(() => {
        new TTSLogger();
      }).not.toThrow();
    });
  });

  describe('Console Output', () => {
    it('should output to console when enabled', () => {
      logger.info('test', 'action', 'Test message');
      
      expect(consoleMock.log).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️'),
        'Test message',
        undefined
      );
    });

    it('should use appropriate console methods for different levels', () => {
      logger.error('test', 'action', 'Error message');
      logger.warn('test', 'action', 'Warning message');
      logger.debug('test', 'action', 'Debug message');
      
      expect(consoleMock.error).toHaveBeenCalled();
      expect(consoleMock.warn).toHaveBeenCalled();
      expect(consoleMock.debug).toHaveBeenCalled();
    });

    it('should not output to console when disabled', () => {
      const silentLogger = new TTSLogger({ enableConsole: false });
      silentLogger.info('test', 'action', 'Test message');
      
      expect(consoleMock.log).not.toHaveBeenCalled();
    });
  });

  describe('Export and Import', () => {
    it('should export logs as JSON', () => {
      logger.info('test', 'action', 'Test message');
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('exportDate');
      expect(parsed).toHaveProperty('totalLogs', 1);
      expect(parsed).toHaveProperty('logs');
      expect(parsed).toHaveProperty('metrics');
      expect(parsed.logs[0].message).toBe('Test message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined metadata', () => {
      logger.info('test', 'action', 'Test message', undefined);
      
      const logs = logger.getLogs();
      expect(logs[0].metadata).toBeUndefined();
    });

    it('should handle empty strings', () => {
      logger.info('', '', '');
      
      const logs = logger.getLogs();
      expect(logs[0].provider).toBe('');
      expect(logs[0].action).toBe('');
      expect(logs[0].message).toBe('');
    });

    it('should handle very large metadata objects', () => {
      const largeMetadata = {
        data: 'x'.repeat(10000),
        nested: {
          deep: {
            object: 'test'
          }
        }
      };
      
      expect(() => {
        logger.info('test', 'action', 'Test message', largeMetadata);
      }).not.toThrow();
    });
  });
});