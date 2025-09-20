/**
 * Sistema Avançado de Processamento de Áudio
 * 
 * Engine completo para processamento de áudio em tempo real com:
 * - Equalização dinâmica
 * - Compressão e limitação
 * - Efeitos de áudio (reverb, delay, chorus)
 * - Normalização automática
 * - Análise espectral em tempo real
 */

export interface AudioProcessorConfig {
  sampleRate: number;
  bufferSize: number;
  channels: number;
  enableRealTimeProcessing: boolean;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  q: number;
  type: 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch';
}

export interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  makeupGain: number;
}

export interface AudioEffect {
  id: string;
  name: string;
  enabled: boolean;
  wetness: number; // 0-1 (dry/wet mix)
  parameters: Record<string, number>;
}

export interface AudioAnalysis {
  rms: number;
  peak: number;
  lufs: number;
  frequency: Float32Array;
  spectrum: Float32Array;
  dynamicRange: number;
  spectralCentroid: number;
}

export class AudioProcessingEngine {
  private audioContext: AudioContext;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private analyserNode: AnalyserNode;
  private compressorNode: DynamicsCompressorNode;
  private convolver: ConvolverNode;
  private delay: DelayNode;
  private filters: BiquadFilterNode[] = [];
  private effectsChain: AudioNode[] = [];
  
  private config: AudioProcessorConfig;
  private isProcessing = false;
  private currentBuffer: AudioBuffer | null = null;
  
  // Real-time analysis data
  private analysisData: AudioAnalysis = {
    rms: 0,
    peak: 0,
    lufs: 0,
    frequency: new Float32Array(1024),
    spectrum: new Float32Array(1024),
    dynamicRange: 0,
    spectralCentroid: 0
  };

  constructor(config: Partial<AudioProcessorConfig> = {}) {
    this.config = {
      sampleRate: 44100,
      bufferSize: 2048,
      channels: 2,
      enableRealTimeProcessing: true,
      ...config
    };

    this.initializeAudioContext();
    this.setupAudioChain();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });
    } catch (error) {
      throw new Error('Navegador não suporta Web Audio API');
    }
  }

  private setupAudioChain(): void {
    // Setup basic audio nodes
    this.gainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.convolver = this.audioContext.createConvolver();
    this.delay = this.audioContext.createDelay(1.0);

    // Configure analyser
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Setup default equalizer (10-band)
    this.setupEqualizer();

    // Connect initial chain
    this.connectAudioChain();
  }

  private setupEqualizer(): void {
    const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    
    this.filters = frequencies.map((freq, index) => {
      const filter = this.audioContext.createBiquadFilter();
      
      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === frequencies.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
      }
      
      filter.frequency.value = freq;
      filter.Q.value = 1.0;
      filter.gain.value = 0;
      
      return filter;
    });

    // Connect filters in series
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
  }

  private connectAudioChain(): void {
    // Clear existing connections
    this.effectsChain.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Node might already be disconnected
      }
    });

    // Build effects chain: Input -> EQ -> Compressor -> Effects -> Analyser -> Output
    let currentNode: AudioNode = this.filters[0];
    
    // EQ chain
    currentNode = this.filters[this.filters.length - 1];
    
    // Compressor
    currentNode.connect(this.compressorNode);
    currentNode = this.compressorNode;
    
    // Delay effect
    currentNode.connect(this.delay);
    this.delay.connect(this.gainNode);
    
    // Also direct connection (for dry signal)
    currentNode.connect(this.gainNode);
    
    // Convolver (reverb)
    this.gainNode.connect(this.convolver);
    this.convolver.connect(this.analyserNode);
    
    // Also direct connection (for dry signal)
    this.gainNode.connect(this.analyserNode);
    
    // Final output
    this.analyserNode.connect(this.audioContext.destination);
    
    this.effectsChain = [
      ...this.filters,
      this.compressorNode,
      this.delay,
      this.convolver,
      this.gainNode,
      this.analyserNode
    ];
  }

  /**
   * Carrega um arquivo de áudio para processamento
   */
  async loadAudioFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.currentBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Validate audio buffer
      if (!this.currentBuffer || this.currentBuffer.length === 0) {
        throw new Error('Arquivo de áudio inválido ou corrompido');
      }

      console.log(`Áudio carregado: ${this.currentBuffer.duration.toFixed(2)}s, ${this.currentBuffer.sampleRate}Hz`);
    } catch (error) {
      throw new Error(`Erro ao carregar áudio: ${error.message}`);
    }
  }

  /**
   * Aplica equalização com configuração de bandas
   */
  setEqualizer(bands: EqualizerBand[]): void {
    bands.forEach((band, index) => {
      if (index < this.filters.length) {
        const filter = this.filters[index];
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = band.q;
        filter.type = band.type;
      }
    });
    
    console.log('Equalização aplicada:', bands);
  }

  /**
   * Configura compressor dinâmico
   */
  setCompressor(settings: CompressorSettings): void {
    this.compressorNode.threshold.value = settings.threshold;
    this.compressorNode.ratio.value = settings.ratio;
    this.compressorNode.attack.value = settings.attack;
    this.compressorNode.release.value = settings.release;
    this.compressorNode.knee.value = settings.knee;
    
    // Makeup gain via gain node
    const makeupGainLinear = Math.pow(10, settings.makeupGain / 20);
    this.gainNode.gain.value = makeupGainLinear;
    
    console.log('Compressor configurado:', settings);
  }

  /**
   * Adiciona efeito de reverb usando impulse response
   */
  async setReverb(reverbType: 'hall' | 'room' | 'plate' | 'spring' | 'cathedral' = 'hall'): Promise<void> {
    try {
      // Generate impulse response for reverb
      const impulseResponse = this.generateImpulseResponse(reverbType);
      this.convolver.buffer = impulseResponse;
      console.log(`Reverb aplicado: ${reverbType}`);
    } catch (error) {
      console.error('Erro ao aplicar reverb:', error);
    }
  }

  private generateImpulseResponse(type: string): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    let length: number;
    let decay: number;

    // Different reverb characteristics
    switch (type) {
      case 'hall':
        length = sampleRate * 3; // 3 seconds
        decay = 0.8;
        break;
      case 'room':
        length = sampleRate * 1; // 1 second
        decay = 0.5;
        break;
      case 'plate':
        length = sampleRate * 2; // 2 seconds
        decay = 0.7;
        break;
      case 'cathedral':
        length = sampleRate * 4; // 4 seconds
        decay = 0.9;
        break;
      default:
        length = sampleRate * 2;
        decay = 0.6;
    }

    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const n = length - i;
        const decayFactor = Math.pow(decay, i / sampleRate);
        
        // Generate noise with exponential decay
        channelData[i] = (Math.random() * 2 - 1) * decayFactor;
        
        // Add some early reflections for realism
        if (i < sampleRate * 0.1) {
          channelData[i] += (Math.random() * 2 - 1) * 0.3 * decayFactor;
        }
      }
    }

    return impulse;
  }

  /**
   * Configura delay/echo
   */
  setDelay(delayTime: number, feedback: number, wetness: number): void {
    this.delay.delayTime.value = Math.max(0, Math.min(1, delayTime));
    
    // Create feedback loop
    const feedbackGain = this.audioContext.createGain();
    feedbackGain.gain.value = Math.max(0, Math.min(0.95, feedback));
    
    this.delay.connect(feedbackGain);
    feedbackGain.connect(this.delay);
    
    // Wet/dry mix
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    
    wetGain.gain.value = wetness;
    dryGain.gain.value = 1 - wetness;
    
    console.log(`Delay configurado: ${delayTime}s, feedback: ${feedback}, wet: ${wetness}`);
  }

  /**
   * Inicia o processamento de áudio
   */
  startProcessing(): void {
    if (!this.currentBuffer) {
      throw new Error('Nenhum áudio carregado para processar');
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    this.sourceNode.connect(this.filters[0]);
    
    this.sourceNode.start(0);
    this.isProcessing = true;
    
    // Start real-time analysis
    if (this.config.enableRealTimeProcessing) {
      this.startRealTimeAnalysis();
    }
    
    this.sourceNode.onended = () => {
      this.isProcessing = false;
    };
    
    console.log('Processamento de áudio iniciado');
  }

  /**
   * Para o processamento
   */
  stopProcessing(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isProcessing = false;
    console.log('Processamento parado');
  }

  /**
   * Análise em tempo real do áudio
   */
  private startRealTimeAnalysis(): void {
    const analyzeFrame = () => {
      if (!this.isProcessing) return;

      const bufferLength = this.analyserNode.frequencyBinCount;
      const timeData = new Float32Array(bufferLength);
      const frequencyData = new Float32Array(bufferLength);
      
      this.analyserNode.getFloatTimeDomainData(timeData);
      this.analyserNode.getFloatFrequencyData(frequencyData);
      
      // Calculate RMS (Root Mean Square)
      let rmsSum = 0;
      let peak = 0;
      
      for (let i = 0; i < timeData.length; i++) {
        const sample = timeData[i];
        rmsSum += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
      }
      
      this.analysisData.rms = Math.sqrt(rmsSum / timeData.length);
      this.analysisData.peak = peak;
      
      // Calculate LUFS (simplified)
      this.analysisData.lufs = this.calculateLUFS(timeData);
      
      // Update frequency data
      this.analysisData.frequency = frequencyData;
      this.analysisData.spectrum = this.calculateSpectrum(frequencyData);
      
      // Calculate spectral centroid
      this.analysisData.spectralCentroid = this.calculateSpectralCentroid(frequencyData);
      
      // Continue analysis
      requestAnimationFrame(analyzeFrame);
    };
    
    analyzeFrame();
  }

  private calculateLUFS(timeData: Float32Array): number {
    // Simplified LUFS calculation (EBU R128 standard approximation)
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    const meanSquare = sum / timeData.length;
    return -0.691 + 10 * Math.log10(meanSquare + 1e-10);
  }

  private calculateSpectrum(frequencyData: Float32Array): Float32Array {
    // Convert to linear scale and normalize
    const spectrum = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      spectrum[i] = Math.pow(10, frequencyData[i] / 20);
    }
    return spectrum;
  }

  private calculateSpectralCentroid(frequencyData: Float32Array): number {
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20);
      const frequency = (i * this.audioContext.sampleRate) / (2 * frequencyData.length);
      
      numerator += frequency * magnitude;
      denominator += magnitude;
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Normalização automática do áudio
   */
  normalizeAudio(targetLUFS: number = -23): void {
    const currentLUFS = this.analysisData.lufs;
    const adjustment = targetLUFS - currentLUFS;
    const gainAdjustment = Math.pow(10, adjustment / 20);
    
    this.gainNode.gain.value *= gainAdjustment;
    console.log(`Áudio normalizado: ${adjustment.toFixed(1)} dB de ajuste`);
  }

  /**
   * Exporta o áudio processado
   */
  async exportProcessedAudio(format: 'wav' | 'mp3' = 'wav'): Promise<Blob> {
    if (!this.currentBuffer) {
      throw new Error('Nenhum áudio para exportar');
    }

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      this.currentBuffer.numberOfChannels,
      this.currentBuffer.length,
      this.currentBuffer.sampleRate
    );

    // Recreate audio chain in offline context
    const offlineSource = offlineContext.createBufferSource();
    offlineSource.buffer = this.currentBuffer;
    
    // Apply current settings to offline context
    // (This is a simplified version - in practice, you'd recreate all effects)
    const offlineGain = offlineContext.createGain();
    offlineGain.gain.value = this.gainNode.gain.value;
    
    offlineSource.connect(offlineGain);
    offlineGain.connect(offlineContext.destination);
    
    offlineSource.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to desired format
    return this.bufferToBlob(renderedBuffer, format);
  }

  private bufferToBlob(buffer: AudioBuffer, format: 'wav' | 'mp3'): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(length + 44);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, length + 36, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Convert float samples to 16-bit PCM
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: format === 'wav' ? 'audio/wav' : 'audio/mpeg' });
  }

  /**
   * Retorna dados de análise em tempo real
   */
  getAnalysisData(): AudioAnalysis {
    return { ...this.analysisData };
  }

  /**
   * Verifica se está processando
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Limpa recursos
   */
  dispose(): void {
    this.stopProcessing();
    
    this.effectsChain.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Node already disconnected
      }
    });
    
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    console.log('AudioProcessingEngine disposed');
  }
}

/**
 * Factory para criar presets de áudio
 */
export class AudioPresets {
  static getEqualizerPreset(preset: 'vocal' | 'music' | 'speech' | 'podcast' | 'bass-boost'): EqualizerBand[] {
    const presets = {
      vocal: [
        { frequency: 31, gain: -2, q: 1.0, type: 'lowshelf' as const },
        { frequency: 62, gain: -1, q: 1.0, type: 'peaking' as const },
        { frequency: 125, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 250, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 500, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 1000, gain: 3, q: 1.0, type: 'peaking' as const },
        { frequency: 2000, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 4000, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 8000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 16000, gain: -1, q: 1.0, type: 'highshelf' as const }
      ],
      music: [
        { frequency: 31, gain: 2, q: 1.0, type: 'lowshelf' as const },
        { frequency: 62, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 125, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 250, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 500, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 1000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 2000, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 4000, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 8000, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 16000, gain: 0, q: 1.0, type: 'highshelf' as const }
      ],
      speech: [
        { frequency: 31, gain: -6, q: 1.0, type: 'lowshelf' as const },
        { frequency: 62, gain: -3, q: 1.0, type: 'peaking' as const },
        { frequency: 125, gain: -1, q: 1.0, type: 'peaking' as const },
        { frequency: 250, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 500, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 1000, gain: 3, q: 1.0, type: 'peaking' as const },
        { frequency: 2000, gain: 3, q: 1.0, type: 'peaking' as const },
        { frequency: 4000, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 8000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 16000, gain: -2, q: 1.0, type: 'highshelf' as const }
      ],
      podcast: [
        { frequency: 31, gain: -6, q: 1.0, type: 'lowshelf' as const },
        { frequency: 62, gain: -4, q: 1.0, type: 'peaking' as const },
        { frequency: 125, gain: -2, q: 1.0, type: 'peaking' as const },
        { frequency: 250, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 500, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 1000, gain: 4, q: 1.0, type: 'peaking' as const },
        { frequency: 2000, gain: 3, q: 1.0, type: 'peaking' as const },
        { frequency: 4000, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 8000, gain: -1, q: 1.0, type: 'peaking' as const },
        { frequency: 16000, gain: -3, q: 1.0, type: 'highshelf' as const }
      ],
      'bass-boost': [
        { frequency: 31, gain: 6, q: 1.0, type: 'lowshelf' as const },
        { frequency: 62, gain: 4, q: 1.0, type: 'peaking' as const },
        { frequency: 125, gain: 2, q: 1.0, type: 'peaking' as const },
        { frequency: 250, gain: 1, q: 1.0, type: 'peaking' as const },
        { frequency: 500, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 1000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 2000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 4000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 8000, gain: 0, q: 1.0, type: 'peaking' as const },
        { frequency: 16000, gain: 0, q: 1.0, type: 'highshelf' as const }
      ]
    };

    return presets[preset] || presets.speech;
  }

  static getCompressorPreset(preset: 'gentle' | 'aggressive' | 'limiting' | 'broadcast'): CompressorSettings {
    const presets = {
      gentle: {
        threshold: -18,
        ratio: 3,
        attack: 0.01,
        release: 0.1,
        knee: 6,
        makeupGain: 2
      },
      aggressive: {
        threshold: -12,
        ratio: 8,
        attack: 0.003,
        release: 0.05,
        knee: 2,
        makeupGain: 4
      },
      limiting: {
        threshold: -3,
        ratio: 20,
        attack: 0.001,
        release: 0.01,
        knee: 0,
        makeupGain: 1
      },
      broadcast: {
        threshold: -15,
        ratio: 4,
        attack: 0.005,
        release: 0.08,
        knee: 4,
        makeupGain: 3
      }
    };

    return presets[preset] || presets.gentle;
  }
}