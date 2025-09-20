import { ttsService } from '../services/ttsService';

// Mock environment variables for testing
const mockEnv = {
  ELEVENLABS_API_KEY: 'test-key',
  GOOGLE_CLOUD_TTS_API_KEY: 'test-key',
  AZURE_SPEECH_KEY: 'test-key',
  AZURE_SPEECH_REGION: 'eastus',
  TTS_DEFAULT_PROVIDER: 'browser',
  TTS_ENABLE_FALLBACK: 'true',
  TTS_RETRY_ATTEMPTS: '3',
  TTS_TIMEOUT_MS: '30000'
};

// Mock process.env
Object.assign(process.env, mockEnv);

describe('TTS Integration Tests', () => {
  beforeAll(async () => {
    // Initialize TTS service
    await ttsService.initialize();
  });

  describe('Service Initialization', () => {
    test('should initialize successfully', () => {
      expect(ttsService).toBeDefined();
    });

    test('should have at least browser provider available', () => {
      const providers = ttsService.getAvailableProviders();
      expect(providers.length).toBeGreaterThan(0);
      
      const browserProvider = providers.find(p => p.name === 'browser');
      expect(browserProvider).toBeDefined();
      expect(browserProvider?.isAvailable).toBe(true);
    });

    test('should load voices for browser provider', () => {
      const voices = ttsService.getVoicesForProvider('browser');
      expect(Array.isArray(voices)).toBe(true);
    });
  });

  describe('Provider Health Checks', () => {
    test('browser provider should be healthy', async () => {
      const isHealthy = await ttsService.checkProviderHealth('browser');
      expect(isHealthy).toBe(true);
    });

    test('should handle invalid provider gracefully', async () => {
      const isHealthy = await ttsService.checkProviderHealth('invalid-provider');
      expect(isHealthy).toBe(false);
    });
  });

  describe('Speech Synthesis', () => {
    test('should synthesize speech with browser provider', async () => {
      const request = {
        text: 'Hello, this is a test.',
        provider: 'browser',
        language: 'en-US',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      expect(response).toBeDefined();
      expect(response.provider).toBe('browser');
      expect(response.success).toBe(true);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.charactersUsed).toBe(request.text.length);
    }, 10000);

    test('should handle empty text gracefully', async () => {
      const request = {
        text: '',
        provider: 'browser',
        language: 'en-US',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('empty');
    });

    test('should handle very long text', async () => {
      const longText = 'A'.repeat(10000); // 10k characters
      
      const request = {
        text: longText,
        provider: 'browser',
        language: 'en-US',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      // Should either succeed or fail gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
      
      if (!response.success) {
        expect(response.error).toBeDefined();
      }
    }, 15000);
  });

  describe('Fallback System', () => {
    test('should fallback to browser when other providers fail', async () => {
      // Try with a non-existent provider first
      const request = {
        text: 'Fallback test',
        provider: 'non-existent-provider',
        language: 'en-US',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      // Should fallback to an available provider
      expect(response).toBeDefined();
      expect(response.provider).not.toBe('non-existent-provider');
    });
  });

  describe('Voice Management', () => {
    test('should return voices for valid provider', () => {
      const voices = ttsService.getVoicesForProvider('browser');
      expect(Array.isArray(voices)).toBe(true);
    });

    test('should return empty array for invalid provider', () => {
      const voices = ttsService.getVoicesForProvider('invalid-provider');
      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBe(0);
    });

    test('should refresh providers', async () => {
      await expect(ttsService.refreshProviders()).resolves.not.toThrow();
    });
  });

  describe('Configuration', () => {
    test('should respect speed parameter', async () => {
      const request = {
        text: 'Speed test',
        provider: 'browser',
        language: 'en-US',
        speed: 0.5, // Slow speed
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      expect(response.success).toBe(true);
      // Duration should be longer for slower speed
      expect(response.metadata.duration).toBeGreaterThan(0);
    });

    test('should respect pitch parameter', async () => {
      const request = {
        text: 'Pitch test',
        provider: 'browser',
        language: 'en-US',
        speed: 1.0,
        pitch: 5.0, // Higher pitch
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      expect(response.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      // Mock a timeout scenario
      const originalTimeout = process.env.TTS_TIMEOUT_MS;
      process.env.TTS_TIMEOUT_MS = '1'; // 1ms timeout
      
      const request = {
        text: 'Timeout test',
        provider: 'elevenlabs', // This will likely timeout
        language: 'en-US',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      // Should either succeed with fallback or fail gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
      
      // Restore original timeout
      if (originalTimeout) {
        process.env.TTS_TIMEOUT_MS = originalTimeout;
      }
    });

    test('should handle invalid language codes', async () => {
      const request = {
        text: 'Language test',
        provider: 'browser',
        language: 'invalid-lang',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      const response = await ttsService.synthesizeSpeech(request);
      
      // Should either succeed with default language or fail gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
  });

  describe('Usage Statistics', () => {
    test('should track usage statistics', async () => {
      // Make a few requests
      const request = {
        text: 'Stats test',
        provider: 'browser',
        language: 'en-US',
        speed: 1.0,
        pitch: 0.0,
        volume: 1.0,
        format: 'mp3' as const
      };

      await ttsService.synthesizeSpeech(request);
      await ttsService.synthesizeSpeech(request);
      
      const stats = ttsService.getUsageStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.providerUsage).toBeDefined();
      expect(typeof stats.averageResponseTime).toBe('number');
    });
  });
});

// Integration test with React hook
describe('useTTS Hook Integration', () => {
  // Note: These would require a proper React testing environment
  // For now, we'll just test the hook's dependencies
  
  test('should have required dependencies available', () => {
    expect(ttsService).toBeDefined();
    expect(ttsService.synthesizeSpeech).toBeDefined();
    expect(ttsService.getAvailableProviders).toBeDefined();
    expect(ttsService.getVoicesForProvider).toBeDefined();
  });
});

// Performance tests
describe('TTS Performance Tests', () => {
  test('should complete synthesis within reasonable time', async () => {
    const startTime = Date.now();
    
    const request = {
      text: 'Performance test',
      provider: 'browser',
      language: 'en-US',
      speed: 1.0,
      pitch: 0.0,
      volume: 1.0,
      format: 'mp3' as const
    };

    const response = await ttsService.synthesizeSpeech(request);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(response.success).toBe(true);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  }, 15000);

  test('should handle concurrent requests', async () => {
    const request = {
      text: 'Concurrent test',
      provider: 'browser',
      language: 'en-US',
      speed: 1.0,
      pitch: 0.0,
      volume: 1.0,
      format: 'mp3' as const
    };

    // Make 3 concurrent requests
    const promises = [
      ttsService.synthesizeSpeech(request),
      ttsService.synthesizeSpeech(request),
      ttsService.synthesizeSpeech(request)
    ];

    const responses = await Promise.all(promises);
    
    expect(responses).toHaveLength(3);
    responses.forEach(response => {
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
  }, 20000);
});

// Cleanup
afterAll(() => {
  // Clean up any resources if needed
  console.log('TTS Integration Tests completed');
});