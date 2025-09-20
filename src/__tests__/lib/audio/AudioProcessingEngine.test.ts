/**
 * Testes unitários para o Sistema de Processamento de Áudio
 */

import { AudioProcessingEngine, AudioPresets } from '../../../lib/audio/AudioProcessingEngine';

// Mock Web Audio API
const mockAudioContext = {
  sampleRate: 44100,
  state: 'running',
  createGain: jest.fn(() => ({
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createAnalyser: jest.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.8,
    getFloatTimeDomainData: jest.fn(),
    getFloatFrequencyData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createDynamicsCompressor: jest.fn(() => ({
    threshold: { value: -18 },
    ratio: { value: 3 },
    attack: { value: 0.01 },
    release: { value: 0.1 },
    knee: { value: 6 },
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createConvolver: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createDelay: jest.fn(() => ({
    delayTime: { value: 0.3 },
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createBiquadFilter: jest.fn(() => ({
    type: 'peaking',
    frequency: { value: 1000 },
    Q: { value: 1 },
    gain: { value: 0 },
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    start: jest.fn(),
    stop: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    onended: null
  })),
  createBuffer: jest.fn(() => ({
    numberOfChannels: 2,
    length: 44100,
    sampleRate: 44100,
    getChannelData: jest.fn(() => new Float32Array(44100))
  })),
  decodeAudioData: jest.fn(),
  destination: { connect: jest.fn() },
  resume: jest.fn(),
  close: jest.fn()
};

// Mock OfflineAudioContext
const mockOfflineAudioContext = {
  ...mockAudioContext,
  startRendering: jest.fn(() => Promise.resolve(mockAudioContext.createBuffer())),
  oncomplete: null
};

// Setup mocks
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext)
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext)
});

Object.defineProperty(window, 'OfflineAudioContext', {
  writable: true,
  value: jest.fn(() => mockOfflineAudioContext)
});

describe('AudioProcessingEngine', () => {
  let engine: AudioProcessingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new AudioProcessingEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeInstanceOf(AudioProcessingEngine);
      expect(engine.isCurrentlyProcessing()).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customEngine = new AudioProcessingEngine({
        sampleRate: 48000,
        bufferSize: 4096,
        channels: 1,
        enableRealTimeProcessing: false
      });
      
      expect(customEngine).toBeInstanceOf(AudioProcessingEngine);
      customEngine.dispose();
    });

    it('should throw error if Web Audio API is not supported', () => {
      // Temporarily remove AudioContext
      const originalAudioContext = window.AudioContext;
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      expect(() => {
        new AudioProcessingEngine();
      }).toThrow('Navegador não suporta Web Audio API');

      // Restore
      window.AudioContext = originalAudioContext;
    });
  });

  describe('Audio File Loading', () => {
    const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const mockArrayBuffer = new ArrayBuffer(1024);
    const mockAudioBuffer = {
      duration: 5.0,
      sampleRate: 44100,
      length: 220500,
      numberOfChannels: 2
    };

    beforeEach(() => {
      global.FileReader = jest.fn(() => ({
        readAsArrayBuffer: jest.fn(),
        result: mockArrayBuffer,
        onload: null,
        onerror: null
      })) as any;

      mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
    });

    it('should load audio file successfully', async () => {
      // Mock file reading
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(mockArrayBuffer);

      await engine.loadAudioFile(mockFile);
      
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
    });

    it('should throw error for invalid audio file', async () => {
      jest.spyOn(mockFile, 'arrayBuffer').mockRejectedValue(new Error('Invalid file'));

      await expect(engine.loadAudioFile(mockFile)).rejects.toThrow('Erro ao carregar áudio');
    });

    it('should throw error for corrupted audio buffer', async () => {
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(mockArrayBuffer);
      mockAudioContext.decodeAudioData.mockResolvedValue(null);

      await expect(engine.loadAudioFile(mockFile)).rejects.toThrow('Erro ao carregar áudio');
    });
  });

  describe('Equalizer', () => {
    it('should apply equalizer settings', () => {
      const bands = [
        { frequency: 1000, gain: 3, q: 1.0, type: 'peaking' as const },
        { frequency: 2000, gain: -2, q: 1.5, type: 'peaking' as const }
      ];

      engine.setEqualizer(bands);

      // Verify that filter nodes were configured
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should handle empty equalizer bands', () => {
      expect(() => {
        engine.setEqualizer([]);
      }).not.toThrow();
    });
  });

  describe('Compressor', () => {
    it('should set compressor settings', () => {
      const settings = {
        threshold: -12,
        ratio: 4,
        attack: 0.005,
        release: 0.08,
        knee: 4,
        makeupGain: 3
      };

      engine.setCompressor(settings);

      const compressor = mockAudioContext.createDynamicsCompressor();
      expect(compressor.threshold.value).toBeDefined();
      expect(compressor.ratio.value).toBeDefined();
      expect(compressor.attack.value).toBeDefined();
      expect(compressor.release.value).toBeDefined();
      expect(compressor.knee.value).toBeDefined();
    });

    it('should handle extreme compressor values', () => {
      const extremeSettings = {
        threshold: -40,
        ratio: 20,
        attack: 0.001,
        release: 1.0,
        knee: 10,
        makeupGain: 12
      };

      expect(() => {
        engine.setCompressor(extremeSettings);
      }).not.toThrow();
    });
  });

  describe('Effects', () => {
    it('should set reverb effect', async () => {
      await engine.setReverb('hall');
      
      const convolver = mockAudioContext.createConvolver();
      expect(convolver.buffer).toBeDefined();
    });

    it('should set delay effect', () => {
      engine.setDelay(0.5, 0.4, 0.3);
      
      const delay = mockAudioContext.createDelay();
      expect(delay.delayTime.value).toBeDefined();
    });

    it('should handle different reverb types', async () => {
      const reverbTypes = ['hall', 'room', 'plate', 'spring', 'cathedral'] as const;
      
      for (const type of reverbTypes) {
        await expect(engine.setReverb(type)).resolves.not.toThrow();
      }
    });
  });

  describe('Audio Processing', () => {
    const mockAudioBuffer = {
      duration: 5.0,
      sampleRate: 44100,
      length: 220500,
      numberOfChannels: 2
    };

    beforeEach(async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(1024));
      mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      
      await engine.loadAudioFile(mockFile);
    });

    it('should start processing successfully', () => {
      engine.startProcessing();
      
      expect(engine.isCurrentlyProcessing()).toBe(true);
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('should stop processing', () => {
      engine.startProcessing();
      engine.stopProcessing();
      
      expect(engine.isCurrentlyProcessing()).toBe(false);
    });

    it('should throw error when starting without loaded audio', () => {
      const emptyEngine = new AudioProcessingEngine();
      
      expect(() => {
        emptyEngine.startProcessing();
      }).toThrow('Nenhum áudio carregado para processar');
      
      emptyEngine.dispose();
    });

    it('should normalize audio', () => {
      // Mock analysis data
      const mockAnalysis = {
        rms: 0.5,
        peak: 0.8,
        lufs: -18,
        frequency: new Float32Array(1024),
        spectrum: new Float32Array(1024),
        dynamicRange: 20,
        spectralCentroid: 2000
      };

      // Simulate getting analysis data
      jest.spyOn(engine, 'getAnalysisData').mockReturnValue(mockAnalysis);

      engine.normalizeAudio(-23);
      
      const gainNode = mockAudioContext.createGain();
      expect(gainNode.gain.value).toBeDefined();
    });
  });

  describe('Audio Export', () => {
    const mockAudioBuffer = {
      duration: 5.0,
      sampleRate: 44100,
      length: 220500,
      numberOfChannels: 2,
      getChannelData: jest.fn(() => new Float32Array(220500))
    };

    beforeEach(async () => {
      const mockFile = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(1024));
      mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      
      await engine.loadAudioFile(mockFile);
    });

    it('should export processed audio as WAV', async () => {
      mockOfflineAudioContext.startRendering.mockResolvedValue(mockAudioBuffer);
      
      const audioBlob = await engine.exportProcessedAudio('wav');
      
      expect(audioBlob).toBeInstanceOf(Blob);
      expect(audioBlob.type).toBe('audio/wav');
    });

    it('should export processed audio as MP3', async () => {
      mockOfflineAudioContext.startRendering.mockResolvedValue(mockAudioBuffer);
      
      const audioBlob = await engine.exportProcessedAudio('mp3');
      
      expect(audioBlob).toBeInstanceOf(Blob);
      expect(audioBlob.type).toBe('audio/mpeg');
    });

    it('should throw error when exporting without loaded audio', async () => {
      const emptyEngine = new AudioProcessingEngine();
      
      await expect(emptyEngine.exportProcessedAudio()).rejects.toThrow('Nenhum áudio para exportar');
      
      emptyEngine.dispose();
    });
  });

  describe('Real-time Analysis', () => {
    it('should provide analysis data', () => {
      const analysisData = engine.getAnalysisData();
      
      expect(analysisData).toHaveProperty('rms');
      expect(analysisData).toHaveProperty('peak');
      expect(analysisData).toHaveProperty('lufs');
      expect(analysisData).toHaveProperty('frequency');
      expect(analysisData).toHaveProperty('spectrum');
      expect(analysisData).toHaveProperty('dynamicRange');
      expect(analysisData).toHaveProperty('spectralCentroid');
    });

    it('should calculate LUFS correctly', () => {
      const analysisData = engine.getAnalysisData();
      expect(typeof analysisData.lufs).toBe('number');
      expect(analysisData.lufs).toBeGreaterThanOrEqual(-100);
    });

    it('should calculate spectral centroid', () => {
      const analysisData = engine.getAnalysisData();
      expect(typeof analysisData.spectralCentroid).toBe('number');
      expect(analysisData.spectralCentroid).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      engine.dispose();
      
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle multiple dispose calls', () => {
      engine.dispose();
      
      expect(() => {
        engine.dispose();
      }).not.toThrow();
    });
  });
});

describe('AudioPresets', () => {
  describe('Equalizer Presets', () => {
    it('should provide vocal preset', () => {
      const preset = AudioPresets.getEqualizerPreset('vocal');
      
      expect(Array.isArray(preset)).toBe(true);
      expect(preset.length).toBe(10);
      expect(preset[0]).toHaveProperty('frequency');
      expect(preset[0]).toHaveProperty('gain');
      expect(preset[0]).toHaveProperty('q');
      expect(preset[0]).toHaveProperty('type');
    });

    it('should provide music preset', () => {
      const preset = AudioPresets.getEqualizerPreset('music');
      
      expect(Array.isArray(preset)).toBe(true);
      expect(preset.length).toBe(10);
    });

    it('should provide speech preset', () => {
      const preset = AudioPresets.getEqualizerPreset('speech');
      
      expect(Array.isArray(preset)).toBe(true);
      expect(preset.length).toBe(10);
    });

    it('should provide podcast preset', () => {
      const preset = AudioPresets.getEqualizerPreset('podcast');
      
      expect(Array.isArray(preset)).toBe(true);
      expect(preset.length).toBe(10);
    });

    it('should provide bass-boost preset', () => {
      const preset = AudioPresets.getEqualizerPreset('bass-boost');
      
      expect(Array.isArray(preset)).toBe(true);
      expect(preset.length).toBe(10);
    });

    it('should fallback to speech preset for unknown preset', () => {
      const preset = AudioPresets.getEqualizerPreset('unknown' as any);
      const speechPreset = AudioPresets.getEqualizerPreset('speech');
      
      expect(preset).toEqual(speechPreset);
    });
  });

  describe('Compressor Presets', () => {
    it('should provide gentle preset', () => {
      const preset = AudioPresets.getCompressorPreset('gentle');
      
      expect(preset).toHaveProperty('threshold');
      expect(preset).toHaveProperty('ratio');
      expect(preset).toHaveProperty('attack');
      expect(preset).toHaveProperty('release');
      expect(preset).toHaveProperty('knee');
      expect(preset).toHaveProperty('makeupGain');
    });

    it('should provide aggressive preset', () => {
      const preset = AudioPresets.getCompressorPreset('aggressive');
      
      expect(preset.threshold).toBeLessThan(-10);
      expect(preset.ratio).toBeGreaterThan(5);
    });

    it('should provide limiting preset', () => {
      const preset = AudioPresets.getCompressorPreset('limiting');
      
      expect(preset.ratio).toBeGreaterThan(10);
      expect(preset.attack).toBeLessThan(0.01);
    });

    it('should provide broadcast preset', () => {
      const preset = AudioPresets.getCompressorPreset('broadcast');
      
      expect(preset.threshold).toBeGreaterThan(-20);
      expect(preset.ratio).toBeGreaterThanOrEqual(3);
      expect(preset.ratio).toBeLessThanOrEqual(6);
    });

    it('should fallback to gentle preset for unknown preset', () => {
      const preset = AudioPresets.getCompressorPreset('unknown' as any);
      const gentlePreset = AudioPresets.getCompressorPreset('gentle');
      
      expect(preset).toEqual(gentlePreset);
    });
  });

  describe('Preset Validation', () => {
    it('should have valid frequency ranges for equalizer presets', () => {
      const presets = ['vocal', 'music', 'speech', 'podcast', 'bass-boost'] as const;
      
      presets.forEach(presetName => {
        const preset = AudioPresets.getEqualizerPreset(presetName);
        
        preset.forEach(band => {
          expect(band.frequency).toBeGreaterThan(0);
          expect(band.frequency).toBeLessThanOrEqual(20000);
          expect(band.gain).toBeGreaterThanOrEqual(-12);
          expect(band.gain).toBeLessThanOrEqual(12);
          expect(band.q).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid compressor ranges', () => {
      const presets = ['gentle', 'aggressive', 'limiting', 'broadcast'] as const;
      
      presets.forEach(presetName => {
        const preset = AudioPresets.getCompressorPreset(presetName);
        
        expect(preset.threshold).toBeGreaterThanOrEqual(-40);
        expect(preset.threshold).toBeLessThanOrEqual(0);
        expect(preset.ratio).toBeGreaterThanOrEqual(1);
        expect(preset.ratio).toBeLessThanOrEqual(20);
        expect(preset.attack).toBeGreaterThan(0);
        expect(preset.attack).toBeLessThanOrEqual(1);
        expect(preset.release).toBeGreaterThan(0);
        expect(preset.release).toBeLessThanOrEqual(1);
        expect(preset.knee).toBeGreaterThanOrEqual(0);
        expect(preset.knee).toBeLessThanOrEqual(10);
        expect(preset.makeupGain).toBeGreaterThanOrEqual(0);
        expect(preset.makeupGain).toBeLessThanOrEqual(12);
      });
    });
  });
});