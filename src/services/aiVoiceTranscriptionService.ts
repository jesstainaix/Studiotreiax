import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// INTERFACES
// ============================================================================

export interface VoiceTranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  text: string;
  confidence: number;
  language: string;
  speaker?: VoiceSpeaker;
  words: VoiceWordTiming[];
  audioFeatures: AudioFeatures;
  emotions?: VoiceEmotionData;
  punctuation: boolean;
  isComplete: boolean;
  timestamp: Date;
}

export interface VoiceWordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  phonemes?: Phoneme[];
  stress?: number;
  pitch?: number;
  volume?: number;
  speed?: number;
  punctuation?: string;
}

export interface Phoneme {
  symbol: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface VoiceSpeaker {
  id: string;
  name: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: number;
  accent?: string;
  confidence: number;
  voiceprint: VoiceFeatures;
  characteristics: SpeakerCharacteristics;
  color: string;
  avatar?: string;
}

export interface VoiceFeatures {
  mfcc: number[];
  pitch: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  formants: number[];
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  energy: number;
  tempo: number;
}

export interface SpeakerCharacteristics {
  averagePitch: number;
  pitchRange: number;
  speakingRate: number;
  pauseFrequency: number;
  volumeLevel: number;
  articulation: number;
  breathiness: number;
  roughness: number;
  nasality: number;
}

export interface AudioFeatures {
  amplitude: number;
  frequency: number;
  spectralEnergy: number;
  noiseLevel: number;
  clarity: number;
  snr: number; // Signal-to-noise ratio
  dynamicRange: number;
  harmonicity: number;
}

export interface VoiceEmotionData {
  primary: string;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
    excited: number;
    calm: number;
    frustrated: number;
    confident: number;
    uncertain: number;
  };
  confidence: number;
  arousal: number; // Energy level
  valence: number; // Positive/negative sentiment
}

export interface TranscriptionSession {
  id: string;
  name: string;
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'paused' | 'error';
  startTime: Date;
  endTime?: Date;
  duration: number;
  segments: VoiceTranscriptionSegment[];
  speakers: VoiceSpeaker[];
  audioUrl?: string;
  videoId?: string;
  language: string;
  options: VoiceTranscriptionOptions;
  statistics: SessionStatistics;
  metadata: SessionMetadata;
}

export interface VoiceTranscriptionOptions {
  language: string;
  autoDetectLanguage: boolean;
  realTimeTranscription: boolean;
  speakerDiarization: boolean;
  maxSpeakers: number;
  minSpeakerDuration: number;
  punctuation: boolean;
  profanityFilter: boolean;
  emotionDetection: boolean;
  wordTimestamps: boolean;
  phonemeTimestamps: boolean;
  confidence: number;
  model: 'whisper' | 'google' | 'azure' | 'aws' | 'deepgram';
  enhanceAudio: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  automaticGainControl: boolean;
  voiceActivityDetection: boolean;
  endpointDetection: boolean;
  silenceThreshold: number;
  maxSegmentLength: number;
  bufferSize: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface SessionStatistics {
  totalWords: number;
  totalSpeakers: number;
  averageConfidence: number;
  speechRate: number; // Words per minute
  pauseRatio: number;
  overlapRatio: number;
  noiseLevel: number;
  audioQuality: number;
  processingTime: number;
  accuracy: number;
  completeness: number;
}

export interface SessionMetadata {
  model: string;
  version: string;
  processingTime: number;
  audioFormat: string;
  audioQuality: string;
  deviceInfo?: {
    microphone: string;
    sampleRate: number;
    channels: number;
  };
  environmentInfo?: {
    noiseLevel: number;
    roomSize: string;
    acoustics: string;
  };
}

export interface RealTimeTranscriptionState {
  isActive: boolean;
  currentText: string;
  confidence: number;
  isFinal: boolean;
  alternatives: string[];
  timestamp: number;
  bufferSize: number;
  latency: number;
}

export interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: Date;
  executed: boolean;
}

export interface AudioBuffer {
  id: string;
  data: Float32Array;
  sampleRate: number;
  channels: number;
  duration: number;
  timestamp: Date;
  processed: boolean;
}

export interface TranscriptionQuality {
  overall: number;
  wordAccuracy: number;
  speakerAccuracy: number;
  timestampAccuracy: number;
  emotionAccuracy: number;
  noiseHandling: number;
  latency: number;
  reliability: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  voiceFeatures: VoiceFeatures;
  characteristics: SpeakerCharacteristics;
  trainingSamples: {
    audioUrl: string;
    duration: number;
    quality: number;
    transcript: string;
  }[];
  accuracy: number;
  lastUsed: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface AudioProcessor {
  id: string;
  name: string;
  type: 'noise_reduction' | 'echo_cancellation' | 'gain_control' | 'voice_enhancement';
  enabled: boolean;
  parameters: Record<string, number>;
  order: number;
}

export interface TranscriptionExportOptions {
  format: 'txt' | 'srt' | 'vtt' | 'json' | 'csv' | 'docx';
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeEmotions: boolean;
  includeConfidence: boolean;
  includeWordTimings: boolean;
  includeAudioFeatures: boolean;
  mergeShortSegments: boolean;
  maxLineLength: number;
  encoding: 'utf-8' | 'utf-16' | 'ascii';
  language: string;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

interface AIVoiceTranscriptionState {
  // State
  sessions: TranscriptionSession[];
  currentSession: TranscriptionSession | null;
  realTimeState: RealTimeTranscriptionState;
  audioBuffers: AudioBuffer[];
  voiceProfiles: VoiceProfile[];
  audioProcessors: AudioProcessor[];
  voiceCommands: VoiceCommand[];
  
  // Audio State
  mediaRecorder: MediaRecorder | null;
  audioStream: MediaStream | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  
  // UI State
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  selectedSession: TranscriptionSession | null;
  selectedSpeaker: VoiceSpeaker | null;
  
  // Configuration
  defaultOptions: VoiceTranscriptionOptions;
  quality: TranscriptionQuality;
  
  // Computed
  activeSessions: TranscriptionSession[];
  completedSessions: TranscriptionSession[];
  totalRecordingTime: number;
  
  // Actions - Session Management
  createSession: (name: string, options?: Partial<VoiceTranscriptionOptions>) => string;
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  stopSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => void;
  duplicateSession: (sessionId: string) => string;
  
  // Actions - Recording
  startRecording: (options?: Partial<VoiceTranscriptionOptions>) => Promise<string>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // Actions - Real-time Transcription
  startRealTimeTranscription: (audioStream: MediaStream, options?: Partial<VoiceTranscriptionOptions>) => Promise<string>;
  stopRealTimeTranscription: () => void;
  processAudioChunk: (audioData: Float32Array) => Promise<VoiceTranscriptionSegment | null>;
  
  // Actions - Audio Processing
  initializeAudioContext: () => Promise<void>;
  setupAudioProcessing: (stream: MediaStream) => void;
  processAudioBuffer: (buffer: AudioBuffer) => Promise<void>;
  enhanceAudio: (audioData: Float32Array) => Float32Array;
  reduceNoise: (audioData: Float32Array) => Float32Array;
  
  // Actions - Segments
  addSegment: (sessionId: string, segment: Omit<VoiceTranscriptionSegment, 'id'>) => void;
  updateSegment: (sessionId: string, segmentId: string, updates: Partial<VoiceTranscriptionSegment>) => void;
  deleteSegment: (sessionId: string, segmentId: string) => void;
  mergeSegments: (sessionId: string, segmentIds: string[]) => void;
  splitSegment: (sessionId: string, segmentId: string, splitTime: number) => void;
  
  // Actions - Speakers
  identifySpeakers: (sessionId: string) => Promise<VoiceSpeaker[]>;
  addSpeaker: (sessionId: string, speaker: Omit<VoiceSpeaker, 'id'>) => string;
  updateSpeaker: (sessionId: string, speakerId: string, updates: Partial<VoiceSpeaker>) => void;
  deleteSpeaker: (sessionId: string, speakerId: string) => void;
  assignSpeaker: (sessionId: string, segmentId: string, speakerId: string) => void;
  trainSpeakerModel: (speakerId: string, audioSamples: string[]) => Promise<void>;
  
  // Actions - Voice Profiles
  createVoiceProfile: (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => string;
  updateVoiceProfile: (profileId: string, updates: Partial<VoiceProfile>) => void;
  deleteVoiceProfile: (profileId: string) => void;
  activateVoiceProfile: (profileId: string) => void;
  deactivateVoiceProfile: (profileId: string) => void;
  
  // Actions - Voice Commands
  registerVoiceCommand: (command: Omit<VoiceCommand, 'id' | 'timestamp' | 'executed'>) => string;
  executeVoiceCommand: (commandId: string) => Promise<void>;
  processVoiceCommand: (text: string) => Promise<VoiceCommand | null>;
  
  // Actions - Audio Processors
  addAudioProcessor: (processor: Omit<AudioProcessor, 'id'>) => string;
  updateAudioProcessor: (processorId: string, updates: Partial<AudioProcessor>) => void;
  removeAudioProcessor: (processorId: string) => void;
  reorderAudioProcessors: (processorIds: string[]) => void;
  
  // Actions - Export
  exportSession: (sessionId: string, options: TranscriptionExportOptions) => Promise<string>;
  exportMultipleSessions: (sessionIds: string[], options: TranscriptionExportOptions) => Promise<Record<string, string>>;
  generateTranscript: (session: TranscriptionSession) => string;
  
  // Actions - Import
  importSession: (file: File) => Promise<string>;
  importAudioFile: (file: File, options?: Partial<VoiceTranscriptionOptions>) => Promise<string>;
  
  // Actions - Quality
  analyzeQuality: (sessionId: string) => Promise<TranscriptionQuality>;
  improveAccuracy: (sessionId: string) => Promise<void>;
  validateTranscription: (sessionId: string) => Promise<number>;
  
  // Actions - Language
  detectLanguage: (audioData: Float32Array) => Promise<string>;
  switchLanguage: (sessionId: string, language: string) => Promise<void>;
  
  // Actions - Synchronization
  synchronizeWithVideo: (sessionId: string, videoId: string) => Promise<void>;
  adjustTimestamps: (sessionId: string, offset: number) => void;
  alignWithSubtitles: (sessionId: string, subtitleTrackId: string) => Promise<void>;
  
  // Actions - Configuration
  updateDefaultOptions: (options: Partial<VoiceTranscriptionOptions>) => void;
  calibrateAudio: () => Promise<void>;
  testMicrophone: () => Promise<boolean>;
  
  // Actions - Data Management
  loadSessions: () => Promise<void>;
  saveSessions: () => Promise<void>;
  clearSessions: () => void;
  exportAllSessions: () => Promise<string>;
  importSessions: (data: any) => Promise<void>;
  
  // Actions - UI
  setSelectedSession: (session: TranscriptionSession | null) => void;
  setSelectedSpeaker: (speaker: VoiceSpeaker | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Utilities
  getSessionProgress: (sessionId: string) => number;
  estimateProcessingTime: (duration: number) => number;
  validateAudioInput: () => Promise<boolean>;
  optimizePerformance: () => void;
  
  // Actions - System
  initialize: () => Promise<void>;
  cleanup: () => void;
  reset: () => void;
}

export const useAIVoiceTranscriptionStore = create<AIVoiceTranscriptionState>()(devtools((set, get) => ({
  // Initial State
  sessions: [],
  currentSession: null,
  realTimeState: {
    isActive: false,
    currentText: '',
    confidence: 0,
    isFinal: false,
    alternatives: [],
    timestamp: 0,
    bufferSize: 0,
    latency: 0,
  },
  audioBuffers: [],
  voiceProfiles: [],
  audioProcessors: [
    {
      id: 'noise-reduction',
      name: 'Noise Reduction',
      type: 'noise_reduction',
      enabled: true,
      parameters: { strength: 0.7, threshold: 0.1 },
      order: 1,
    },
    {
      id: 'echo-cancellation',
      name: 'Echo Cancellation',
      type: 'echo_cancellation',
      enabled: true,
      parameters: { delay: 50, suppression: 0.8 },
      order: 2,
    },
    {
      id: 'gain-control',
      name: 'Automatic Gain Control',
      type: 'gain_control',
      enabled: true,
      parameters: { target: 0.5, compression: 0.3 },
      order: 3,
    },
  ],
  voiceCommands: [],
  
  // Audio State
  mediaRecorder: null,
  audioStream: null,
  audioContext: null,
  analyser: null,
  
  // UI State
  isRecording: false,
  isPaused: false,
  isProcessing: false,
  isLoading: false,
  error: null,
  selectedSession: null,
  selectedSpeaker: null,
  
  // Configuration
  defaultOptions: {
    language: 'en',
    autoDetectLanguage: true,
    realTimeTranscription: true,
    speakerDiarization: true,
    maxSpeakers: 10,
    minSpeakerDuration: 1.0,
    punctuation: true,
    profanityFilter: false,
    emotionDetection: true,
    wordTimestamps: true,
    phonemeTimestamps: false,
    confidence: 0.8,
    model: 'whisper',
    enhanceAudio: true,
    noiseReduction: true,
    echoCancellation: true,
    automaticGainControl: true,
    voiceActivityDetection: true,
    endpointDetection: true,
    silenceThreshold: 0.1,
    maxSegmentLength: 30,
    bufferSize: 4096,
    sampleRate: 44100,
    channels: 1,
    bitDepth: 16,
  },
  
  quality: {
    overall: 0,
    wordAccuracy: 0,
    speakerAccuracy: 0,
    timestampAccuracy: 0,
    emotionAccuracy: 0,
    noiseHandling: 0,
    latency: 0,
    reliability: 0,
  },
  
  // Computed Values
  get activeSessions() {
    return get().sessions.filter(session => 
      session.status === 'recording' || session.status === 'processing'
    );
  },
  
  get completedSessions() {
    return get().sessions.filter(session => session.status === 'completed');
  },
  
  get totalRecordingTime() {
    return get().sessions.reduce((total, session) => total + session.duration, 0);
  },
  
  // Actions - Session Management
  createSession: (name: string, options?: Partial<VoiceTranscriptionOptions>) => {
    const sessionId = crypto.randomUUID();
    const finalOptions = { ...get().defaultOptions, ...options };
    
    const session: TranscriptionSession = {
      id: sessionId,
      name,
      status: 'idle',
      startTime: new Date(),
      duration: 0,
      segments: [],
      speakers: [],
      language: finalOptions.language,
      options: finalOptions,
      statistics: {
        totalWords: 0,
        totalSpeakers: 0,
        averageConfidence: 0,
        speechRate: 0,
        pauseRatio: 0,
        overlapRatio: 0,
        noiseLevel: 0,
        audioQuality: 0,
        processingTime: 0,
        accuracy: 0,
        completeness: 0,
      },
      metadata: {
        model: finalOptions.model,
        version: '1.0',
        processingTime: 0,
        audioFormat: 'webm',
        audioQuality: 'high',
      },
    };
    
    set(state => ({
      sessions: [...state.sessions, session],
      currentSession: session,
    }));
    
    return sessionId;
  },
  
  startSession: async (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    
    set(state => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId ? { ...s, status: 'recording', startTime: new Date() } : s
      ),
      currentSession: { ...session, status: 'recording' },
      isRecording: true,
    }));
    
    // Initialize audio context and start recording
    await get().initializeAudioContext();
  },
  
  pauseSession: (sessionId: string) => {
    set(state => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId ? { ...s, status: 'paused' } : s
      ),
      isPaused: true,
    }));
  },
  
  resumeSession: (sessionId: string) => {
    set(state => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId ? { ...s, status: 'recording' } : s
      ),
      isPaused: false,
    }));
  },
  
  stopSession: async (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    
    const endTime = new Date();
    const duration = (endTime.getTime() - session.startTime.getTime()) / 1000;
    
    set(state => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId ? { 
          ...s, 
          status: 'completed', 
          endTime, 
          duration,
          statistics: {
            ...s.statistics,
            totalWords: s.segments.reduce((acc, seg) => acc + seg.words.length, 0),
            totalSpeakers: s.speakers.length,
            averageConfidence: s.segments.reduce((acc, seg) => acc + seg.confidence, 0) / s.segments.length || 0,
          },
        } : s
      ),
      currentSession: null,
      isRecording: false,
      isPaused: false,
    }));
    
    // Cleanup audio resources
    get().cleanup();
  },
  
  deleteSession: (sessionId: string) => {
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== sessionId),
      currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
    }));
  },
  
  duplicateSession: (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    
    const newSessionId = crypto.randomUUID();
    const duplicatedSession: TranscriptionSession = {
      ...session,
      id: newSessionId,
      name: `${session.name} (Copy)`,
      status: 'idle',
      startTime: new Date(),
      endTime: undefined,
      segments: session.segments.map(seg => ({ ...seg, id: crypto.randomUUID() })),
      speakers: session.speakers.map(speaker => ({ ...speaker, id: crypto.randomUUID() })),
    };
    
    set(state => ({
      sessions: [...state.sessions, duplicatedSession],
    }));
    
    return newSessionId;
  },
  
  // Actions - Recording
  startRecording: async (options?: Partial<VoiceTranscriptionOptions>) => {
    const sessionId = get().createSession('New Recording', options);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options?.sampleRate || 44100,
          channelCount: options?.channels || 1,
          echoCancellation: options?.echoCancellation ?? true,
          noiseSuppression: options?.noiseReduction ?? true,
          autoGainControl: options?.automaticGainControl ?? true,
        },
      });
      
      set({ audioStream: stream });
      
      await get().startSession(sessionId);
      get().setupAudioProcessing(stream);
      
      if (options?.realTimeTranscription) {
        await get().startRealTimeTranscription(stream, options);
      }
      
      return sessionId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start recording' });
      throw error;
    }
  },
  
  stopRecording: async () => {
    const currentSession = get().currentSession;
    if (!currentSession) return;
    
    await get().stopSession(currentSession.id);
    get().stopRealTimeTranscription();
  },
  
  pauseRecording: () => {
    const currentSession = get().currentSession;
    if (!currentSession) return;
    
    get().pauseSession(currentSession.id);
  },
  
  resumeRecording: () => {
    const currentSession = get().currentSession;
    if (!currentSession) return;
    
    get().resumeSession(currentSession.id);
  },
  
  // Actions - Real-time Transcription
  startRealTimeTranscription: async (audioStream: MediaStream, options?: Partial<VoiceTranscriptionOptions>) => {
    set(state => ({
      realTimeState: {
        ...state.realTimeState,
        isActive: true,
        timestamp: Date.now(),
      },
    }));
    
    // Mock real-time transcription
    const sessionId = get().currentSession?.id || crypto.randomUUID();
    
    // Simulate real-time processing
    const interval = setInterval(() => {
      const mockSegment: VoiceTranscriptionSegment = {
        id: crypto.randomUUID(),
        startTime: Date.now() / 1000,
        endTime: (Date.now() + 3000) / 1000,
        duration: 3,
        text: 'Real-time transcription in progress...',
        confidence: 0.85,
        language: options?.language || 'en',
        words: [
          {
            word: 'Real-time',
            startTime: Date.now() / 1000,
            endTime: (Date.now() + 800) / 1000,
            confidence: 0.9,
          },
          {
            word: 'transcription',
            startTime: (Date.now() + 800) / 1000,
            endTime: (Date.now() + 1800) / 1000,
            confidence: 0.85,
          },
          {
            word: 'in',
            startTime: (Date.now() + 1800) / 1000,
            endTime: (Date.now() + 2000) / 1000,
            confidence: 0.95,
          },
          {
            word: 'progress',
            startTime: (Date.now() + 2000) / 1000,
            endTime: (Date.now() + 3000) / 1000,
            confidence: 0.8,
            punctuation: '...',
          },
        ],
        audioFeatures: {
          amplitude: 0.7,
          frequency: 440,
          spectralEnergy: 0.6,
          noiseLevel: 0.1,
          clarity: 0.8,
          snr: 15,
          dynamicRange: 0.5,
          harmonicity: 0.7,
        },
        punctuation: true,
        isComplete: false,
        timestamp: new Date(),
      };
      
      if (get().currentSession) {
        get().addSegment(get().currentSession!.id, mockSegment);
      }
    }, 3000);
    
    // Store interval for cleanup
    (window as any).transcriptionInterval = interval;
    
    return sessionId;
  },
  
  stopRealTimeTranscription: () => {
    set(state => ({
      realTimeState: {
        ...state.realTimeState,
        isActive: false,
        currentText: '',
        confidence: 0,
      },
    }));
    
    // Clear interval
    if ((window as any).transcriptionInterval) {
      clearInterval((window as any).transcriptionInterval);
      delete (window as any).transcriptionInterval;
    }
  },
  
  processAudioChunk: async (audioData: Float32Array) => {
    // Mock audio chunk processing
    const segment: VoiceTranscriptionSegment = {
      id: crypto.randomUUID(),
      startTime: Date.now() / 1000,
      endTime: (Date.now() + 1000) / 1000,
      duration: 1,
      text: 'Processed audio chunk',
      confidence: 0.8,
      language: 'en',
      words: [
        {
          word: 'Processed',
          startTime: Date.now() / 1000,
          endTime: (Date.now() + 500) / 1000,
          confidence: 0.85,
        },
        {
          word: 'audio',
          startTime: (Date.now() + 500) / 1000,
          endTime: (Date.now() + 800) / 1000,
          confidence: 0.9,
        },
        {
          word: 'chunk',
          startTime: (Date.now() + 800) / 1000,
          endTime: (Date.now() + 1000) / 1000,
          confidence: 0.75,
        },
      ],
      audioFeatures: {
        amplitude: 0.6,
        frequency: 350,
        spectralEnergy: 0.5,
        noiseLevel: 0.15,
        clarity: 0.7,
        snr: 12,
        dynamicRange: 0.4,
        harmonicity: 0.6,
      },
      punctuation: false,
      isComplete: true,
      timestamp: new Date(),
    };
    
    return segment;
  },
  
  // Actions - Audio Processing
  initializeAudioContext: async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      set({ audioContext, analyser });
    } catch (error) {
      set({ error: 'Failed to initialize audio context' });
      throw error;
    }
  },
  
  setupAudioProcessing: (stream: MediaStream) => {
    const audioContext = get().audioContext;
    const analyser = get().analyser;
    
    if (!audioContext || !analyser) return;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Start audio analysis
    const processAudio = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate audio features
      const amplitude = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength / 255;
      const frequency = dataArray.findIndex(value => value > 50) * (audioContext.sampleRate / 2) / bufferLength;
      
      set(state => ({
        realTimeState: {
          ...state.realTimeState,
          bufferSize: bufferLength,
          latency: audioContext.currentTime * 1000,
        },
      }));
      
      if (get().isRecording) {
        requestAnimationFrame(processAudio);
      }
    };
    
    processAudio();
  },
  
  processAudioBuffer: async (buffer: AudioBuffer) => {
    // Mock audio buffer processing
  },
  
  enhanceAudio: (audioData: Float32Array) => {
    // Mock audio enhancement
    return audioData.map(sample => Math.max(-1, Math.min(1, sample * 1.2)));
  },
  
  reduceNoise: (audioData: Float32Array) => {
    // Mock noise reduction
    return audioData.map(sample => Math.abs(sample) > 0.1 ? sample : 0);
  },
  
  // Actions - Segments
  addSegment: (sessionId: string, segment: Omit<VoiceTranscriptionSegment, 'id'>) => {
    const newSegment: VoiceTranscriptionSegment = {
      ...segment,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? { 
              ...session, 
              segments: [...session.segments, newSegment].sort((a, b) => a.startTime - b.startTime),
            }
          : session
      ),
    }));
  },
  
  updateSegment: (sessionId: string, segmentId: string, updates: Partial<VoiceTranscriptionSegment>) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? {
              ...session,
              segments: session.segments.map(segment => 
                segment.id === segmentId ? { ...segment, ...updates } : segment
              ),
            }
          : session
      ),
    }));
  },
  
  deleteSegment: (sessionId: string, segmentId: string) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? {
              ...session,
              segments: session.segments.filter(segment => segment.id !== segmentId),
            }
          : session
      ),
    }));
  },
  
  mergeSegments: (sessionId: string, segmentIds: string[]) => {
    set(state => ({
      sessions: state.sessions.map(session => {
        if (session.id !== sessionId) return session;
        
        const segmentsToMerge = session.segments.filter(s => segmentIds.includes(s.id));
        const otherSegments = session.segments.filter(s => !segmentIds.includes(s.id));
        
        if (segmentsToMerge.length < 2) return session;
        
        const mergedSegment: VoiceTranscriptionSegment = {
          id: crypto.randomUUID(),
          startTime: Math.min(...segmentsToMerge.map(s => s.startTime)),
          endTime: Math.max(...segmentsToMerge.map(s => s.endTime)),
          duration: 0,
          text: segmentsToMerge.map(s => s.text).join(' '),
          confidence: segmentsToMerge.reduce((acc, s) => acc + s.confidence, 0) / segmentsToMerge.length,
          language: segmentsToMerge[0].language,
          speaker: segmentsToMerge[0].speaker,
          words: segmentsToMerge.flatMap(s => s.words),
          audioFeatures: segmentsToMerge[0].audioFeatures,
          punctuation: true,
          isComplete: true,
          timestamp: new Date(),
        };
        
        mergedSegment.duration = mergedSegment.endTime - mergedSegment.startTime;
        
        return {
          ...session,
          segments: [...otherSegments, mergedSegment].sort((a, b) => a.startTime - b.startTime),
        };
      }),
    }));
  },
  
  splitSegment: (sessionId: string, segmentId: string, splitTime: number) => {
    set(state => ({
      sessions: state.sessions.map(session => {
        if (session.id !== sessionId) return session;
        
        const segmentIndex = session.segments.findIndex(s => s.id === segmentId);
        if (segmentIndex === -1) return session;
        
        const segment = session.segments[segmentIndex];
        if (splitTime <= segment.startTime || splitTime >= segment.endTime) return session;
        
        const splitIndex = segment.words.findIndex(w => w.endTime > splitTime);
        
        const firstSegment: VoiceTranscriptionSegment = {
          ...segment,
          id: crypto.randomUUID(),
          endTime: splitTime,
          duration: splitTime - segment.startTime,
          text: segment.words.slice(0, splitIndex).map(w => w.word).join(' '),
          words: segment.words.slice(0, splitIndex),
        };
        
        const secondSegment: VoiceTranscriptionSegment = {
          ...segment,
          id: crypto.randomUUID(),
          startTime: splitTime,
          duration: segment.endTime - splitTime,
          text: segment.words.slice(splitIndex).map(w => w.word).join(' '),
          words: segment.words.slice(splitIndex),
        };
        
        const newSegments = [...session.segments];
        newSegments.splice(segmentIndex, 1, firstSegment, secondSegment);
        
        return {
          ...session,
          segments: newSegments,
        };
      }),
    }));
  },
  
  // Actions - Speakers
  identifySpeakers: async (sessionId: string) => {
    // Mock speaker identification
    const speakers: VoiceSpeaker[] = [
      {
        id: 'voice-speaker-1',
        name: 'Speaker 1',
        gender: 'unknown',
        confidence: 0.9,
        voiceprint: {
          mfcc: [1.2, -0.5, 0.8, -0.3, 1.1],
          pitch: { mean: 150, std: 20, min: 100, max: 200 },
          formants: [800, 1200, 2500],
          spectralCentroid: 1500,
          spectralRolloff: 3000,
          zeroCrossingRate: 0.1,
          energy: 0.7,
          tempo: 120,
        },
        characteristics: {
          averagePitch: 150,
          pitchRange: 100,
          speakingRate: 150,
          pauseFrequency: 0.2,
          volumeLevel: 0.7,
          articulation: 0.8,
          breathiness: 0.3,
          roughness: 0.2,
          nasality: 0.1,
        },
        color: '#FF6B6B',
      },
    ];
    
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? { ...session, speakers }
          : session
      ),
    }));
    
    return speakers;
  },
  
  addSpeaker: (sessionId: string, speaker: Omit<VoiceSpeaker, 'id'>) => {
    const newSpeaker: VoiceSpeaker = {
      ...speaker,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? { ...session, speakers: [...session.speakers, newSpeaker] }
          : session
      ),
    }));
    
    return newSpeaker.id;
  },
  
  updateSpeaker: (sessionId: string, speakerId: string, updates: Partial<VoiceSpeaker>) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? {
              ...session,
              speakers: session.speakers.map(speaker => 
                speaker.id === speakerId ? { ...speaker, ...updates } : speaker
              ),
            }
          : session
      ),
    }));
  },
  
  deleteSpeaker: (sessionId: string, speakerId: string) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? {
              ...session,
              speakers: session.speakers.filter(speaker => speaker.id !== speakerId),
            }
          : session
      ),
    }));
  },
  
  assignSpeaker: (sessionId: string, segmentId: string, speakerId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const speaker = session.speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    
    get().updateSegment(sessionId, segmentId, { speaker });
  },
  
  trainSpeakerModel: async (speakerId: string, audioSamples: string[]) => {
    // Mock speaker training
  },
  
  // Actions - Voice Profiles
  createVoiceProfile: (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
    const newProfile: VoiceProfile = {
      ...profile,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    set(state => ({
      voiceProfiles: [...state.voiceProfiles, newProfile],
    }));
    
    return newProfile.id;
  },
  
  updateVoiceProfile: (profileId: string, updates: Partial<VoiceProfile>) => {
    set(state => ({
      voiceProfiles: state.voiceProfiles.map(profile => 
        profile.id === profileId ? { ...profile, ...updates } : profile
      ),
    }));
  },
  
  deleteVoiceProfile: (profileId: string) => {
    set(state => ({
      voiceProfiles: state.voiceProfiles.filter(profile => profile.id !== profileId),
    }));
  },
  
  activateVoiceProfile: (profileId: string) => {
    set(state => ({
      voiceProfiles: state.voiceProfiles.map(profile => 
        profile.id === profileId ? { ...profile, isActive: true } : profile
      ),
    }));
  },
  
  deactivateVoiceProfile: (profileId: string) => {
    set(state => ({
      voiceProfiles: state.voiceProfiles.map(profile => 
        profile.id === profileId ? { ...profile, isActive: false } : profile
      ),
    }));
  },
  
  // Actions - Voice Commands
  registerVoiceCommand: (command: Omit<VoiceCommand, 'id' | 'timestamp' | 'executed'>) => {
    const newCommand: VoiceCommand = {
      ...command,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      executed: false,
    };
    
    set(state => ({
      voiceCommands: [...state.voiceCommands, newCommand],
    }));
    
    return newCommand.id;
  },
  
  executeVoiceCommand: async (commandId: string) => {
    const command = get().voiceCommands.find(c => c.id === commandId);
    if (!command) return;
    
    // Mock command execution
    
    set(state => ({
      voiceCommands: state.voiceCommands.map(c => 
        c.id === commandId ? { ...c, executed: true } : c
      ),
    }));
  },
  
  processVoiceCommand: async (text: string) => {
    // Mock voice command processing
    const commands = [
      { phrase: 'start recording', action: 'start_recording' },
      { phrase: 'stop recording', action: 'stop_recording' },
      { phrase: 'pause recording', action: 'pause_recording' },
      { phrase: 'resume recording', action: 'resume_recording' },
    ];
    
    const matchedCommand = commands.find(cmd => 
      text.toLowerCase().includes(cmd.phrase)
    );
    
    if (matchedCommand) {
      const command: VoiceCommand = {
        id: crypto.randomUUID(),
        phrase: matchedCommand.phrase,
        action: matchedCommand.action,
        confidence: 0.9,
        timestamp: new Date(),
        executed: false,
      };
      
      return command;
    }
    
    return null;
  },
  
  // Actions - Audio Processors
  addAudioProcessor: (processor: Omit<AudioProcessor, 'id'>) => {
    const newProcessor: AudioProcessor = {
      ...processor,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      audioProcessors: [...state.audioProcessors, newProcessor],
    }));
    
    return newProcessor.id;
  },
  
  updateAudioProcessor: (processorId: string, updates: Partial<AudioProcessor>) => {
    set(state => ({
      audioProcessors: state.audioProcessors.map(processor => 
        processor.id === processorId ? { ...processor, ...updates } : processor
      ),
    }));
  },
  
  removeAudioProcessor: (processorId: string) => {
    set(state => ({
      audioProcessors: state.audioProcessors.filter(processor => processor.id !== processorId),
    }));
  },
  
  reorderAudioProcessors: (processorIds: string[]) => {
    set(state => {
      const reorderedProcessors = processorIds.map((id, index) => {
        const processor = state.audioProcessors.find(p => p.id === id);
        return processor ? { ...processor, order: index + 1 } : null;
      }).filter(Boolean) as AudioProcessor[];
      
      return { audioProcessors: reorderedProcessors };
    });
  },
  
  // Actions - Export
  exportSession: async (sessionId: string, options: TranscriptionExportOptions) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    
    switch (options.format) {
      case 'txt':
        return get().generateTranscript(session);
      case 'json':
        return JSON.stringify(session, null, 2);
      case 'csv':
        return session.segments.map(seg => 
          `"${seg.startTime}","${seg.endTime}","${seg.text}","${seg.confidence}","${seg.speaker?.name || ''}"`
        ).join('\n');
      default:
        return get().generateTranscript(session);
    }
  },
  
  exportMultipleSessions: async (sessionIds: string[], options: TranscriptionExportOptions) => {
    const results: Record<string, string> = {};
    
    for (const sessionId of sessionIds) {
      results[sessionId] = await get().exportSession(sessionId, options);
    }
    
    return results;
  },
  
  generateTranscript: (session: TranscriptionSession) => {
    return session.segments.map(segment => {
      const timestamp = options => options.includeTimestamps ? 
        `[${formatTime(segment.startTime)} --> ${formatTime(segment.endTime)}] ` : '';
      const speaker = options => options.includeSpeakers && segment.speaker ? 
        `${segment.speaker.name}: ` : '';
      
      return `${timestamp({ includeTimestamps: true })}${speaker({ includeSpeakers: true })}${segment.text}`;
    }).join('\n');
  },
  
  // Actions - Import
  importSession: async (file: File) => {
    const content = await file.text();
    const sessionData = JSON.parse(content);
    
    const sessionId = crypto.randomUUID();
    const importedSession: TranscriptionSession = {
      ...sessionData,
      id: sessionId,
      name: `${file.name} (Imported)`,
    };
    
    set(state => ({
      sessions: [...state.sessions, importedSession],
    }));
    
    return sessionId;
  },
  
  importAudioFile: async (file: File, options?: Partial<VoiceTranscriptionOptions>) => {
    const sessionId = get().createSession(file.name, options);
    
    // Mock audio file processing
    const audioUrl = URL.createObjectURL(file);
    
    set(state => ({
      sessions: state.sessions.map(s => 
        s.id === sessionId ? { ...s, audioUrl, status: 'processing' } : s
      ),
    }));
    
    // Simulate processing
    setTimeout(() => {
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, status: 'completed' } : s
        ),
      }));
    }, 3000);
    
    return sessionId;
  },
  
  // Actions - Quality
  analyzeQuality: async (sessionId: string) => {
    // Mock quality analysis
    const quality: TranscriptionQuality = {
      overall: 85,
      wordAccuracy: 90,
      speakerAccuracy: 80,
      timestampAccuracy: 95,
      emotionAccuracy: 75,
      noiseHandling: 85,
      latency: 150,
      reliability: 88,
    };
    
    set({ quality });
    return quality;
  },
  
  improveAccuracy: async (sessionId: string) => {
    // Mock accuracy improvement
  },
  
  validateTranscription: async (sessionId: string) => {
    // Mock validation
    return 92; // 92% accuracy
  },
  
  // Actions - Language
  detectLanguage: async (audioData: Float32Array) => {
    // Mock language detection
    return 'en';
  },
  
  switchLanguage: async (sessionId: string, language: string) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId ? { ...session, language } : session
      ),
    }));
  },
  
  // Actions - Synchronization
  synchronizeWithVideo: async (sessionId: string, videoId: string) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId ? { ...session, videoId } : session
      ),
    }));
  },
  
  adjustTimestamps: (sessionId: string, offset: number) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? {
              ...session,
              segments: session.segments.map(segment => ({
                ...segment,
                startTime: segment.startTime + offset,
                endTime: segment.endTime + offset,
                words: segment.words.map(word => ({
                  ...word,
                  startTime: word.startTime + offset,
                  endTime: word.endTime + offset,
                })),
              })),
            }
          : session
      ),
    }));
  },
  
  alignWithSubtitles: async (sessionId: string, subtitleTrackId: string) => {
    // Mock alignment with subtitles
  },
  
  // Actions - Configuration
  updateDefaultOptions: (options: Partial<VoiceTranscriptionOptions>) => {
    set(state => ({
      defaultOptions: { ...state.defaultOptions, ...options },
    }));
  },
  
  calibrateAudio: async () => {
    // Mock audio calibration
  },
  
  testMicrophone: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  },
  
  // Actions - Data Management
  loadSessions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock loading from API
      const sessions: TranscriptionSession[] = [];
      
      set({ sessions, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load sessions',
        isLoading: false 
      });
    }
  },
  
  saveSessions: async () => {
    // Mock saving to API
  },
  
  clearSessions: () => {
    set({ sessions: [], currentSession: null });
  },
  
  exportAllSessions: async () => {
    const sessions = get().sessions;
    return JSON.stringify(sessions, null, 2);
  },
  
  importSessions: async (data: any) => {
    try {
      const sessions = Array.isArray(data) ? data : [data];
      set(state => ({
        sessions: [...state.sessions, ...sessions],
      }));
    } catch (error) {
      set({ error: 'Failed to import sessions' });
    }
  },
  
  // Actions - UI
  setSelectedSession: (session: TranscriptionSession | null) => {
    set({ selectedSession: session });
  },
  
  setSelectedSpeaker: (speaker: VoiceSpeaker | null) => {
    set({ selectedSpeaker: speaker });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Actions - Utilities
  getSessionProgress: (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return 0;
    
    switch (session.status) {
      case 'idle': return 0;
      case 'recording': return 25;
      case 'processing': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  },
  
  estimateProcessingTime: (duration: number) => {
    // Estimate 1:4 ratio (1 second of audio = 4 seconds of processing)
    return duration * 4;
  },
  
  validateAudioInput: async () => {
    return get().testMicrophone();
  },
  
  optimizePerformance: () => {
    // Mock performance optimization
  },
  
  // Actions - System
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      await get().loadSessions();
      await get().initializeAudioContext();
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize',
        isLoading: false 
      });
    }
  },
  
  cleanup: () => {
    // Stop all audio streams
    const audioStream = get().audioStream;
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Close audio context
    const audioContext = get().audioContext;
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    
    // Stop real-time transcription
    get().stopRealTimeTranscription();
    
    set({
      audioStream: null,
      audioContext: null,
      analyser: null,
      mediaRecorder: null,
    });
  },
  
  reset: () => {
    get().cleanup();
    
    set({
      sessions: [],
      currentSession: null,
      selectedSession: null,
      selectedSpeaker: null,
      isRecording: false,
      isPaused: false,
      isProcessing: false,
      isLoading: false,
      error: null,
      realTimeState: {
        isActive: false,
        currentText: '',
        confidence: 0,
        isFinal: false,
        alternatives: [],
        timestamp: 0,
        bufferSize: 0,
        latency: 0,
      },
    })
  },
})));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Time formatting utility
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

// Audio analysis utilities
export const analyzeAudioFeatures = (audioData: Float32Array): AudioFeatures => {
  const amplitude = audioData.reduce((sum, sample) => sum + Math.abs(sample), 0) / audioData.length;
  const energy = audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length;
  
  // Simple frequency analysis
  const fft = performFFT(audioData);
  const spectralCentroid = calculateSpectralCentroid(fft);
  
  return {
    amplitude,
    frequency: spectralCentroid,
    spectralEnergy: energy,
    noiseLevel: calculateNoiseLevel(audioData),
    clarity: calculateClarity(audioData),
    snr: calculateSNR(audioData),
    dynamicRange: calculateDynamicRange(audioData),
    harmonicity: calculateHarmonicity(fft),
  };
};

// Simple FFT implementation (mock)
const performFFT = (audioData: Float32Array): Float32Array => {
  const fftSize = Math.min(audioData.length, 1024);
  const fft = new Float32Array(fftSize / 2);
  
  for (let i = 0; i < fft.length; i++) {
    fft[i] = Math.abs(audioData[i * 2] || 0);
  }
  
  return fft;
};

const calculateSpectralCentroid = (fft: Float32Array): number => {
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let i = 0; i < fft.length; i++) {
    weightedSum += i * fft[i];
    magnitudeSum += fft[i];
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
};

const calculateNoiseLevel = (audioData: Float32Array): number => {
  const sorted = Array.from(audioData).map(Math.abs).sort((a, b) => a - b);
  const noiseFloorSamples = sorted.slice(0, Math.floor(sorted.length * 0.1));
  return noiseFloorSamples.reduce((sum, sample) => sum + sample, 0) / noiseFloorSamples.length;
};

const calculateClarity = (audioData: Float32Array): number => {
  const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
  const peak = Math.max(...audioData.map(Math.abs));
  return peak > 0 ? rms / peak : 0;
};

const calculateSNR = (audioData: Float32Array): number => {
  const signal = calculateRMS(audioData);
  const noise = calculateNoiseLevel(audioData);
  return noise > 0 ? 20 * Math.log10(signal / noise) : 0;
};

const calculateDynamicRange = (audioData: Float32Array): number => {
  const max = Math.max(...audioData.map(Math.abs));
  const min = Math.min(...audioData.map(Math.abs).filter(x => x > 0));
  return min > 0 ? 20 * Math.log10(max / min) : 0;
};

const calculateHarmonicity = (fft: Float32Array): number => {
  const peaks = findPeaks(fft);
  if (peaks.length < 2) return 0;
  
  const fundamentalFreq = peaks[0];
  let harmonicStrength = 0;
  
  for (let i = 1; i < peaks.length; i++) {
    const ratio = peaks[i] / fundamentalFreq;
    if (Math.abs(ratio - Math.round(ratio)) < 0.1) {
      harmonicStrength += fft[peaks[i]];
    }
  }
  
  const totalEnergy = fft.reduce((sum, magnitude) => sum + magnitude, 0);
  return totalEnergy > 0 ? harmonicStrength / totalEnergy : 0;
};

const findPeaks = (fft: Float32Array): number[] => {
  const peaks: number[] = [];
  const threshold = Math.max(...fft) * 0.1;
  
  for (let i = 1; i < fft.length - 1; i++) {
    if (fft[i] > fft[i - 1] && fft[i] > fft[i + 1] && fft[i] > threshold) {
      peaks.push(i);
    }
  }
  
  return peaks.sort((a, b) => fft[b] - fft[a]);
};

const calculateRMS = (audioData: Float32Array): number => {
  const sumSquares = audioData.reduce((sum, sample) => sum + sample * sample, 0);
  return Math.sqrt(sumSquares / audioData.length);
};

// Export utilities
export const generateSRTContent = (segments: VoiceTranscriptionSegment[]): string => {
  return segments.map((segment, index) => {
    const startTime = formatSRTTime(segment.startTime);
    const endTime = formatSRTTime(segment.endTime);
    const speakerPrefix = segment.speaker ? `${segment.speaker.name}: ` : '';
    
    return `${index + 1}\n${startTime} --> ${endTime}\n${speakerPrefix}${segment.text}\n`;
  }).join('\n');
};

const formatSRTTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

export const generateVTTContent = (segments: VoiceTranscriptionSegment[]): string => {
  let content = 'WEBVTT\n\n';
  
  segments.forEach((segment, index) => {
    const startTime = formatVTTTime(segment.startTime);
    const endTime = formatVTTTime(segment.endTime);
    const speakerPrefix = segment.speaker ? `<v ${segment.speaker.name}>` : '';
    
    content += `${index + 1}\n${startTime} --> ${endTime}\n${speakerPrefix}${segment.text}\n\n`;
  });
  
  return content;
};

const formatVTTTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(3);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.padStart(6, '0')}`;
};

// Hook for easy access to the store
export const useVoiceTranscription = () => {
  return useAIVoiceTranscriptionStore();
};

// Alternative hook name for compatibility
export const useAIVoiceTranscription = () => {
  return useAIVoiceTranscriptionStore();
};

export default useAIVoiceTranscriptionStore;