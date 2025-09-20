import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { FallbackTTSService } from '../fallback-tts-service';
import { EnhancedTTSService } from '../enhanced-tts-service';
import { ttsLogger } from '../tts-logger';

// Mock the enhanced TTS service
vi.mock('../enhanced-tts-service');
vi.mock('../tts-logger');

describe('FallbackTTSService', () => {
  let fallbackTTS: FallbackTTSService;
  let mockEnhancedTTS: vi.Mocked<EnhancedTTSService>;
  let mockLogger: typeof ttsLogger;

  const mockConfig = {
    elevenlabs: {
      apiKey: 'test-elevenlabs-key',
      timeout: 10000
    },
    googleCloud: {
      apiKey: 'test-google-key',
      projectId: 'test-project',
      timeout: 15000
    },
    enableFallback: true,
    maxRetries: 2,
    retryDelay: 1000
  };

  const mockSuccessResponse = {
    success: true,
    audioData: new ArrayBuffer(1024),
    audioUrl: undefined,
    audioBuffer: undefined,
    duration: 1500,
    provider: 'elevenlabs',
    cached: false,
    voiceId: 'test-voice',
    model: undefined,
    language: 'en-US',
    metadata: {
      provider: 'elevenlabs',
      voiceId: 'test-voice',
      duration: 1500
    }
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock enhanced TTS service
    mockEnhancedTTS = {
      synthesizeWithSpecificProvider: vi.fn(),
      healthCheck: vi.fn(),
      getAvailableVoices: vi.fn(),
      clearCache: vi.fn(),
      getCacheSize: vi.fn()
    } as any;
    
    // Mock the constructor
    (EnhancedTTSService as any).mockImplementation(() => mockEnhancedTTS);
    
    // Mock logger
    mockLogger = {
      logSynthesisAttempt: vi.fn(),
      logSynthesisSuccess: vi.fn(),
      logSynthesisFailure: vi.fn(),
      logFallbackUsed: vi.fn(),
      logHealthCheck: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as any;
    
    (ttsLogger as any) = mockLogger;
    
    // Create service instance
    fallbackTTS = new FallbackTTSService(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with provided config', () => {
      expect(fallbackTTS).toBeInstanceOf(FallbackTTSService);
    });

    it('should create enhanced TTS service instance', () => {
      expect(EnhancedTTSService).toHaveBeenCalledWith({
        elevenlabs: mockConfig.elevenlabs,
        google: mockConfig.googleCloud,
        azure: undefined,
        enableCaching: true,
        cacheSize: 100
      });
    });
  });

  describe('synthesize', () => {
    it('should successfully synthesize with primary provider (ElevenLabs)', async () => {
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValueOnce(mockSuccessResponse);

      const result = await fallbackTTS.synthesize('Hello world', {
        voiceId: 'test-voice',
        language: 'en-US'
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('elevenlabs');
      expect(result.audioData).toBe(mockSuccessResponse.audioData);
      expect(result.metadata?.fallbackUsed).toBe(false);
      
      // Verify logging
      expect(mockLogger.logSynthesisAttempt).toHaveBeenCalledWith(
        'elevenlabs',
        11, // 'Hello world'.length
        'test-voice',
        'en-US'
      );
      expect(mockLogger.logSynthesisSuccess).toHaveBeenCalled();
    });

    it('should fallback to Google Cloud when ElevenLabs fails', async () => {
      const elevenLabsError = new Error('ElevenLabs API error');
      const googleSuccessResponse = {
        ...mockSuccessResponse,
        metadata: { ...mockSuccessResponse.metadata, provider: 'google' }
      };

      mockEnhancedTTS.synthesizeWithSpecificProvider
        .mockRejectedValueOnce(elevenLabsError)
        .mockResolvedValueOnce(googleSuccessResponse);

      const result = await fallbackTTS.synthesize('Hello world', {
        voiceId: 'test-voice',
        language: 'en-US'
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('google');
      expect(result.metadata?.fallbackUsed).toBe(true);
      expect(result.metadata?.primaryProvider).toBe('elevenlabs');
      expect(result.metadata?.fallbackProvider).toBe('google');
      
      // Verify fallback logging
      expect(mockLogger.logFallbackUsed).toHaveBeenCalledWith(
        'elevenlabs',
        'google',
        'ElevenLabs API error',
        1
      );
      expect(mockLogger.logSynthesisFailure).toHaveBeenCalledWith(
        'elevenlabs',
        'ElevenLabs API error',
        expect.any(Number),
        11
      );
      expect(mockLogger.logSynthesisSuccess).toHaveBeenCalledWith(
        'google',
        expect.any(Number),
        11,
        'en-US-Standard-A', // default Google voice
        undefined
      );
    });

    it('should fail when both providers fail', async () => {
      const elevenLabsError = new Error('ElevenLabs API error');
      const googleError = new Error('Google Cloud API error');

      mockEnhancedTTS.synthesizeWithSpecificProvider
        .mockRejectedValueOnce(elevenLabsError)
        .mockRejectedValueOnce(googleError);

      const result = await fallbackTTS.synthesize('Hello world');

      expect(result.success).toBe(false);
      expect(result.error).toContain('All TTS providers failed');
      
      // Verify both failures were logged
      expect(mockLogger.logSynthesisFailure).toHaveBeenCalledTimes(2);
      expect(mockLogger.logFallbackUsed).toHaveBeenCalled();
    });

    it('should handle empty text input', async () => {
      const result = await fallbackTTS.synthesize('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Text cannot be empty');
      expect(mockEnhancedTTS.synthesizeWithSpecificProvider).not.toHaveBeenCalled();
    });

    it('should handle very long text input', async () => {
      const longText = 'a'.repeat(10000);
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValueOnce(mockSuccessResponse);

      const result = await fallbackTTS.synthesize(longText);

      expect(result.success).toBe(true);
      expect(mockLogger.logSynthesisAttempt).toHaveBeenCalledWith(
        'elevenlabs',
        10000,
        undefined,
        undefined
      );
    });
  });

  describe('synthesizeWithProvider', () => {
    it('should synthesize with specific provider', async () => {
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValueOnce(mockSuccessResponse);

      const result = await fallbackTTS.synthesizeWithProvider(
        'Hello world',
        'elevenlabs',
        { voiceId: 'test-voice' }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('elevenlabs');
      expect(mockEnhancedTTS.synthesizeWithSpecificProvider).toHaveBeenCalledWith(
        'elevenlabs',
        {
          voiceId: 'test-voice',
          model: undefined,
          stability: undefined,
          similarityBoost: undefined,
          style: undefined,
          useSpeakerBoost: undefined
        }
      );
    });

    it('should fail when specific provider fails', async () => {
      const error = new Error('Provider error');
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockRejectedValueOnce(error);

      const result = await fallbackTTS.synthesizeWithProvider(
        'Hello world',
        'google',
        { voiceId: 'test-voice' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider error');
      expect(mockLogger.logSynthesisFailure).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when both providers work', async () => {
      mockEnhancedTTS.synthesizeWithSpecificProvider
        .mockResolvedValueOnce(mockSuccessResponse) // ElevenLabs test
        .mockResolvedValueOnce(mockSuccessResponse); // Google test

      const result = await fallbackTTS.healthCheck();

      expect(result.elevenlabs.available).toBe(true);
      expect(result.google.available).toBe(true);
      expect(result.overall).toBe(true);
      
      expect(mockLogger.logHealthCheck).toHaveBeenCalledWith('elevenlabs', true);
      expect(mockLogger.logHealthCheck).toHaveBeenCalledWith('google', true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'system',
        'health_check',
        'Overall TTS health: healthy',
        expect.any(Object)
      );
    });

    it('should return partial health when one provider fails', async () => {
      const error = new Error('Provider error');
      mockEnhancedTTS.synthesizeWithSpecificProvider
        .mockRejectedValueOnce(error) // ElevenLabs fails
        .mockResolvedValueOnce(mockSuccessResponse); // Google works

      const result = await fallbackTTS.healthCheck();

      expect(result.elevenlabs.available).toBe(false);
      expect(result.elevenlabs.error).toBe('Provider error');
      expect(result.google.available).toBe(true);
      expect(result.overall).toBe(true); // Still healthy because Google works
      
      expect(mockLogger.logHealthCheck).toHaveBeenCalledWith('elevenlabs', false, 'Provider error');
      expect(mockLogger.logHealthCheck).toHaveBeenCalledWith('google', true);
    });

    it('should return unhealthy when both providers fail', async () => {
      const error1 = new Error('ElevenLabs error');
      const error2 = new Error('Google error');
      
      mockEnhancedTTS.synthesizeWithSpecificProvider
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2);

      const result = await fallbackTTS.healthCheck();

      expect(result.elevenlabs.available).toBe(false);
      expect(result.google.available).toBe(false);
      expect(result.overall).toBe(false);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'system',
        'health_check',
        'Overall TTS health: unhealthy',
        expect.any(Object)
      );
    });
  });

  describe('getMetrics', () => {
    it('should return basic metrics', () => {
      const metrics = fallbackTTS.getMetrics();
      
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('fallbackUsage');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('providerUsage');
    });
  });

  describe('clearCache', () => {
    it('should clear cache through enhanced TTS service', async () => {
      mockEnhancedTTS.clearCache.mockResolvedValueOnce(undefined);
      
      await fallbackTTS.clearCache();
      
      expect(mockEnhancedTTS.clearCache).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockRejectedValueOnce(timeoutError);
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValueOnce(mockSuccessResponse);

      const result = await fallbackTTS.synthesize('Hello world');

      expect(result.success).toBe(true);
      expect(result.metadata?.fallbackUsed).toBe(true);
    });

    it('should handle malformed API responses', async () => {
      const malformedResponse = { 
        success: true,
        audioData: null,
        audioUrl: undefined,
        audioBuffer: undefined,
        duration: 0,
        provider: 'elevenlabs',
        cached: false,
        voiceId: undefined,
        model: undefined,
        language: undefined
      };
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValueOnce(malformedResponse as any);

      const result = await fallbackTTS.synthesize('Hello world');

      expect(result.success).toBe(true);
      expect(result.audioData).toBe(null);
    });

    it('should handle special characters in text', async () => {
      const specialText = 'Hello! @#$%^&*()_+ 你好 🎉';
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValueOnce(mockSuccessResponse);

      const result = await fallbackTTS.synthesize(specialText);

      expect(result.success).toBe(true);
      expect(mockLogger.logSynthesisAttempt).toHaveBeenCalledWith(
        'elevenlabs',
        specialText.length,
        undefined,
        undefined
      );
    });

    it('should handle concurrent synthesis requests', async () => {
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockResolvedValue(mockSuccessResponse);

      const promises = [
        fallbackTTS.synthesize('Text 1'),
        fallbackTTS.synthesize('Text 2'),
        fallbackTTS.synthesize('Text 3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockEnhancedTTS.synthesizeWithSpecificProvider).toHaveBeenCalledTimes(3);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing ElevenLabs config', () => {
      const invalidConfig = {
        ...mockConfig,
        elevenlabs: undefined as any
      };

      expect(() => new FallbackTTSService(invalidConfig)).not.toThrow();
    });

    it('should handle missing Google Cloud config', () => {
      const invalidConfig = {
        ...mockConfig,
        googleCloud: undefined as any
      };

      expect(() => new FallbackTTSService(invalidConfig)).not.toThrow();
    });

    it('should handle disabled fallback', async () => {
      const noFallbackConfig = {
        ...mockConfig,
        enableFallback: false
      };
      
      const service = new FallbackTTSService(noFallbackConfig);
      const error = new Error('Primary provider error');
      mockEnhancedTTS.synthesizeWithSpecificProvider.mockRejectedValueOnce(error);

      const result = await service.synthesize('Hello world');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Primary provider error');
      // Should not attempt fallback
      expect(mockEnhancedTTS.synthesizeWithSpecificProvider).toHaveBeenCalledTimes(1);
    });
  });
});

// Integration tests
describe('FallbackTTSService Integration', () => {
  it('should work with real-like scenarios', async () => {
    // This would be expanded for actual integration testing
    // with real API endpoints in a test environment
    expect(true).toBe(true);
  });
});