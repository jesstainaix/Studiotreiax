import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  text: string;
  confidence: number;
  speaker?: Speaker;
  language: string;
  words: WordTiming[];
  emotions?: EmotionData;
  punctuation: boolean;
  formatting: TextFormatting;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  punctuation?: string;
}

export interface Speaker {
  id: string;
  name: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: number;
  accent?: string;
  confidence: number;
  voiceprint: number[];
  color: string;
  avatar?: string;
}

export interface EmotionData {
  primary: string;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
    excited: number;
    calm: number;
  };
  confidence: number;
}

export interface TextFormatting {
  bold: boolean;
  italic: boolean;
  color?: string;
  fontSize?: number;
  position: 'bottom' | 'top' | 'center';
  alignment: 'left' | 'center' | 'right';
  background?: string;
  outline?: string;
}

export interface SubtitleTrack {
  id: string;
  videoId: string;
  name: string;
  language: string;
  segments: SubtitleSegment[];
  speakers: Speaker[];
  totalDuration: number;
  wordCount: number;
  averageConfidence: number;
  status: 'generating' | 'completed' | 'failed' | 'reviewing';
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    model: string;
    version: string;
    processingTime: number;
    accuracy: number;
    speakerAccuracy: number;
  };
}

export interface TranscriptionTask {
  id: string;
  videoId: string;
  audioUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
  startTime?: Date;
  endTime?: Date;
  result?: SubtitleTrack;
  error?: string;
  options: TranscriptionOptions;
  priority: 'low' | 'medium' | 'high';
}

export interface TranscriptionOptions {
  language: string;
  autoDetectLanguage: boolean;
  speakerDiarization: boolean;
  maxSpeakers: number;
  punctuation: boolean;
  profanityFilter: boolean;
  emotionDetection: boolean;
  wordTimestamps: boolean;
  confidence: number;
  model: 'whisper' | 'google' | 'azure' | 'aws';
  enhanceAudio: boolean;
  noiseReduction: boolean;
}

export interface SubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string;
  outline: {
    enabled: boolean;
    color: string;
    width: number;
  };
  shadow: {
    enabled: boolean;
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  position: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  };
  animation: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'typewriter' | 'bounce';
    duration: number;
    delay: number;
  };
  maxWidth: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
}

export interface SubtitleExportOptions {
  format: 'srt' | 'vtt' | 'ass' | 'sbv' | 'ttml' | 'json';
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeEmotions: boolean;
  includeWordTimings: boolean;
  mergeShortSegments: boolean;
  maxLineLength: number;
  maxLinesPerSubtitle: number;
  encoding: 'utf-8' | 'utf-16' | 'ascii';
  lineBreaks: 'auto' | 'manual';
}

export interface LanguageModel {
  code: string;
  name: string;
  nativeName: string;
  accuracy: number;
  supported: boolean;
  speakerDiarization: boolean;
  emotionDetection: boolean;
  models: string[];
}

export interface SpeakerProfile {
  id: string;
  name: string;
  description: string;
  voiceprint: number[];
  characteristics: {
    gender: 'male' | 'female' | 'unknown';
    age: number;
    accent: string;
    pitch: number;
    speed: number;
    volume: number;
  };
  trainingSamples: {
    audioUrl: string;
    duration: number;
    quality: number;
  }[];
  accuracy: number;
  lastUsed: Date;
  createdAt: Date;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

interface AISubtitleState {
  // State
  tracks: SubtitleTrack[];
  tasks: TranscriptionTask[];
  speakers: Speaker[];
  speakerProfiles: SpeakerProfile[];
  styles: SubtitleStyle[];
  languages: LanguageModel[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedTrack: SubtitleTrack | null;
  selectedTask: TranscriptionTask | null;
  selectedSpeaker: Speaker | null;
  activeStyle: SubtitleStyle | null;
  editingSegment: SubtitleSegment | null;
  
  // Configuration
  defaultOptions: TranscriptionOptions;
  defaultStyle: SubtitleStyle;
  autoSave: boolean;
  realTimePreview: boolean;
  
  // Computed
  completedTracks: SubtitleTrack[];
  activeTasks: TranscriptionTask[];
  pendingTasks: TranscriptionTask[];
  
  // Actions - Transcription
  transcribeVideo: (videoId: string, audioUrl: string, options?: Partial<TranscriptionOptions>) => Promise<string>;
  retranscribe: (trackId: string, options?: Partial<TranscriptionOptions>) => Promise<string>;
  getTranscription: (videoId: string) => SubtitleTrack | null;
  deleteTranscription: (trackId: string) => void;
  
  // Actions - Segments
  addSegment: (trackId: string, segment: Omit<SubtitleSegment, 'id'>) => void;
  updateSegment: (trackId: string, segmentId: string, updates: Partial<SubtitleSegment>) => void;
  deleteSegment: (trackId: string, segmentId: string) => void;
  mergeSegments: (trackId: string, segmentIds: string[]) => void;
  splitSegment: (trackId: string, segmentId: string, splitTime: number) => void;
  
  // Actions - Speakers
  identifySpeakers: (trackId: string) => Promise<Speaker[]>;
  addSpeaker: (speaker: Omit<Speaker, 'id'>) => string;
  updateSpeaker: (speakerId: string, updates: Partial<Speaker>) => void;
  deleteSpeaker: (speakerId: string) => void;
  assignSpeaker: (trackId: string, segmentId: string, speakerId: string) => void;
  trainSpeakerModel: (speakerId: string, audioSamples: string[]) => Promise<void>;
  
  // Actions - Speaker Profiles
  createSpeakerProfile: (profile: Omit<SpeakerProfile, 'id' | 'createdAt'>) => string;
  updateSpeakerProfile: (profileId: string, updates: Partial<SpeakerProfile>) => void;
  deleteSpeakerProfile: (profileId: string) => void;
  applySpeakerProfile: (trackId: string, profileId: string) => void;
  
  // Actions - Styling
  applyStyle: (trackId: string, style: SubtitleStyle) => void;
  createStyle: (style: Omit<SubtitleStyle, 'id'>) => string;
  updateStyle: (styleId: string, updates: Partial<SubtitleStyle>) => void;
  deleteStyle: (styleId: string) => void;
  previewStyle: (trackId: string, styleId: string) => void;
  
  // Actions - Export
  exportSubtitles: (trackId: string, options: SubtitleExportOptions) => Promise<string>;
  exportMultipleFormats: (trackId: string, formats: SubtitleExportOptions[]) => Promise<Record<string, string>>;
  generateSRT: (track: SubtitleTrack) => string;
  generateVTT: (track: SubtitleTrack) => string;
  generateASS: (track: SubtitleTrack) => string;
  
  // Actions - Import
  importSubtitles: (videoId: string, file: File, format: string) => Promise<string>;
  parseSubtitleFile: (content: string, format: string) => SubtitleSegment[];
  
  // Actions - Tasks
  createTask: (task: Omit<TranscriptionTask, 'id' | 'startTime'>) => string;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  
  // Actions - Languages
  detectLanguage: (audioUrl: string) => Promise<string>;
  getSupportedLanguages: () => LanguageModel[];
  updateLanguageModel: (code: string, updates: Partial<LanguageModel>) => void;
  
  // Actions - Quality
  validateTranscription: (trackId: string) => Promise<number>;
  improveAccuracy: (trackId: string) => Promise<void>;
  reviewSegments: (trackId: string) => SubtitleSegment[];
  
  // Actions - Real-time
  startRealTimeTranscription: (audioStream: MediaStream) => Promise<string>;
  stopRealTimeTranscription: (sessionId: string) => void;
  getRealTimeSegments: (sessionId: string) => SubtitleSegment[];
  
  // Actions - Configuration
  updateDefaultOptions: (options: Partial<TranscriptionOptions>) => void;
  updateDefaultStyle: (style: Partial<SubtitleStyle>) => void;
  setAutoSave: (enabled: boolean) => void;
  setRealTimePreview: (enabled: boolean) => void;
  
  // Actions - Data Management
  loadTracks: () => Promise<void>;
  saveTracks: () => Promise<void>;
  clearTracks: () => void;
  exportAllTracks: () => Promise<string>;
  importTracks: (data: any) => Promise<void>;
  
  // Actions - UI
  setSelectedTrack: (track: SubtitleTrack | null) => void;
  setSelectedTask: (task: TranscriptionTask | null) => void;
  setSelectedSpeaker: (speaker: Speaker | null) => void;
  setActiveStyle: (style: SubtitleStyle | null) => void;
  setEditingSegment: (segment: SubtitleSegment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Utilities
  getTaskProgress: (taskId: string) => number;
  estimateTranscriptionTime: (audioUrl: string) => Promise<number>;
  validateAudioFile: (audioUrl: string) => Promise<boolean>;
  optimizeAudio: (audioUrl: string) => Promise<string>;
  
  // Actions - System
  initialize: () => Promise<void>;
  cleanup: () => void;
  reset: () => void;
}

export const useAISubtitleStore = create<AISubtitleState>()(devtools((set, get) => ({
  // Initial State
  tracks: [],
  tasks: [],
  speakers: [],
  speakerProfiles: [],
  styles: [
    {
      id: 'default',
      name: 'Default',
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      outline: {
        enabled: true,
        color: '#000000',
        width: 2,
      },
      shadow: {
        enabled: false,
        color: '#000000',
        offsetX: 2,
        offsetY: 2,
        blur: 4,
      },
      position: {
        vertical: 'bottom',
        horizontal: 'center',
        marginTop: 20,
        marginBottom: 60,
        marginLeft: 20,
        marginRight: 20,
      },
      animation: {
        enabled: false,
        type: 'fade',
        duration: 300,
        delay: 0,
      },
      maxWidth: 80,
      lineHeight: 1.2,
      letterSpacing: 0,
      wordSpacing: 0,
    },
  ],
  languages: [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      accuracy: 95,
      supported: true,
      speakerDiarization: true,
      emotionDetection: true,
      models: ['whisper', 'google', 'azure'],
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      accuracy: 92,
      supported: true,
      speakerDiarization: true,
      emotionDetection: true,
      models: ['whisper', 'google'],
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      accuracy: 93,
      supported: true,
      speakerDiarization: true,
      emotionDetection: true,
      models: ['whisper', 'google', 'azure'],
    },
  ],
  
  // Initial UI State
  isLoading: false,
  error: null,
  selectedTrack: null,
  selectedTask: null,
  selectedSpeaker: null,
  activeStyle: null,
  editingSegment: null,
  
  // Initial Configuration
  defaultOptions: {
    language: 'en',
    autoDetectLanguage: true,
    speakerDiarization: true,
    maxSpeakers: 10,
    punctuation: true,
    profanityFilter: false,
    emotionDetection: true,
    wordTimestamps: true,
    confidence: 0.8,
    model: 'whisper',
    enhanceAudio: true,
    noiseReduction: true,
  },
  
  defaultStyle: {
    id: 'default',
    name: 'Default',
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    outline: {
      enabled: true,
      color: '#000000',
      width: 2,
    },
    shadow: {
      enabled: false,
      color: '#000000',
      offsetX: 2,
      offsetY: 2,
      blur: 4,
    },
    position: {
      vertical: 'bottom',
      horizontal: 'center',
      marginTop: 20,
      marginBottom: 60,
      marginLeft: 20,
      marginRight: 20,
    },
    animation: {
      enabled: false,
      type: 'fade',
      duration: 300,
      delay: 0,
    },
    maxWidth: 80,
    lineHeight: 1.2,
    letterSpacing: 0,
    wordSpacing: 0,
  },
  
  autoSave: true,
  realTimePreview: true,
  
  // Computed Values
  get completedTracks() {
    return get().tracks.filter(track => track.status === 'completed');
  },
  
  get activeTasks() {
    return get().tasks.filter(task => task.status === 'processing');
  },
  
  get pendingTasks() {
    return get().tasks.filter(task => task.status === 'queued');
  },
  
  // Actions - Transcription
  transcribeVideo: async (videoId: string, audioUrl: string, options?: Partial<TranscriptionOptions>) => {
    const taskId = crypto.randomUUID();
    const finalOptions = { ...get().defaultOptions, ...options };
    
    const task: TranscriptionTask = {
      id: taskId,
      videoId,
      audioUrl,
      status: 'queued',
      progress: 0,
      estimatedTime: 300, // 5 minutes
      options: finalOptions,
      priority: 'medium',
    };
    
    set(state => ({
      tasks: [...state.tasks, task],
      isLoading: true,
      error: null,
    }));
    
    try {
      // Simulate transcription process
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, status: 'processing', startTime: new Date() } : t
        ),
      }));
      
      // Mock transcription result
      const track: SubtitleTrack = {
        id: crypto.randomUUID(),
        videoId,
        name: `Transcription ${new Date().toLocaleString()}`,
        language: finalOptions.language,
        segments: [
          {
            id: crypto.randomUUID(),
            startTime: 0,
            endTime: 5,
            duration: 5,
            text: 'Welcome to our video presentation.',
            confidence: 0.95,
            speaker: {
              id: 'speaker-1',
              name: 'Speaker 1',
              gender: 'unknown',
              confidence: 0.9,
              voiceprint: [],
              color: '#FF6B6B',
            },
            language: finalOptions.language,
            words: [
              { word: 'Welcome', startTime: 0, endTime: 0.8, confidence: 0.98 },
              { word: 'to', startTime: 0.8, endTime: 1.0, confidence: 0.99 },
              { word: 'our', startTime: 1.0, endTime: 1.3, confidence: 0.97 },
              { word: 'video', startTime: 1.3, endTime: 1.8, confidence: 0.96 },
              { word: 'presentation', startTime: 1.8, endTime: 2.8, confidence: 0.94, punctuation: '.' },
            ],
            emotions: {
              primary: 'neutral',
              emotions: {
                happy: 0.3,
                sad: 0.1,
                angry: 0.05,
                surprised: 0.1,
                neutral: 0.4,
                excited: 0.05,
                calm: 0.0,
              },
              confidence: 0.8,
            },
            punctuation: true,
            formatting: {
              bold: false,
              italic: false,
              position: 'bottom',
              alignment: 'center',
            },
          },
          {
            id: crypto.randomUUID(),
            startTime: 5,
            endTime: 12,
            duration: 7,
            text: 'Today we will explore advanced AI features for video editing.',
            confidence: 0.92,
            speaker: {
              id: 'speaker-1',
              name: 'Speaker 1',
              gender: 'unknown',
              confidence: 0.9,
              voiceprint: [],
              color: '#FF6B6B',
            },
            language: finalOptions.language,
            words: [
              { word: 'Today', startTime: 5, endTime: 5.5, confidence: 0.96 },
              { word: 'we', startTime: 5.5, endTime: 5.7, confidence: 0.98 },
              { word: 'will', startTime: 5.7, endTime: 6.0, confidence: 0.97 },
              { word: 'explore', startTime: 6.0, endTime: 6.6, confidence: 0.95 },
              { word: 'advanced', startTime: 6.6, endTime: 7.3, confidence: 0.93 },
              { word: 'AI', startTime: 7.3, endTime: 7.6, confidence: 0.91 },
              { word: 'features', startTime: 7.6, endTime: 8.2, confidence: 0.94 },
              { word: 'for', startTime: 8.2, endTime: 8.4, confidence: 0.98 },
              { word: 'video', startTime: 8.4, endTime: 8.8, confidence: 0.96 },
              { word: 'editing', startTime: 8.8, endTime: 9.5, confidence: 0.92, punctuation: '.' },
            ],
            emotions: {
              primary: 'excited',
              emotions: {
                happy: 0.2,
                sad: 0.05,
                angry: 0.02,
                surprised: 0.1,
                neutral: 0.3,
                excited: 0.3,
                calm: 0.03,
              },
              confidence: 0.85,
            },
            punctuation: true,
            formatting: {
              bold: false,
              italic: false,
              position: 'bottom',
              alignment: 'center',
            },
          },
        ],
        speakers: [
          {
            id: 'speaker-1',
            name: 'Speaker 1',
            gender: 'unknown',
            confidence: 0.9,
            voiceprint: [],
            color: '#FF6B6B',
          },
        ],
        totalDuration: 12,
        wordCount: 15,
        averageConfidence: 0.935,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          model: finalOptions.model,
          version: '1.0',
          processingTime: 5000,
          accuracy: 93.5,
          speakerAccuracy: 90,
        },
      };
      
      set(state => ({
        tracks: [...state.tracks, track],
        tasks: state.tasks.map(t => 
          t.id === taskId ? { 
            ...t, 
            status: 'completed', 
            progress: 100, 
            endTime: new Date(),
            result: track 
          } : t
        ),
        isLoading: false,
      }));
      
      return taskId;
    } catch (error) {
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { 
            ...t, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Transcription failed' 
          } : t
        ),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Transcription failed',
      }));
      
      throw error;
    }
  },
  
  retranscribe: async (trackId: string, options?: Partial<TranscriptionOptions>) => {
    const track = get().tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track not found');
    
    // Remove existing track
    set(state => ({
      tracks: state.tracks.filter(t => t.id !== trackId),
    }));
    
    // Start new transcription
    return get().transcribeVideo(track.videoId, '', options);
  },
  
  getTranscription: (videoId: string) => {
    return get().tracks.find(track => track.videoId === videoId) || null;
  },
  
  deleteTranscription: (trackId: string) => {
    set(state => ({
      tracks: state.tracks.filter(track => track.id !== trackId),
    }));
  },
  
  // Actions - Segments
  addSegment: (trackId: string, segment: Omit<SubtitleSegment, 'id'>) => {
    const newSegment: SubtitleSegment = {
      ...segment,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      tracks: state.tracks.map(track => 
        track.id === trackId
          ? { 
              ...track, 
              segments: [...track.segments, newSegment].sort((a, b) => a.startTime - b.startTime),
              updatedAt: new Date(),
            }
          : track
      ),
    }));
  },
  
  updateSegment: (trackId: string, segmentId: string, updates: Partial<SubtitleSegment>) => {
    set(state => ({
      tracks: state.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              segments: track.segments.map(segment => 
                segment.id === segmentId ? { ...segment, ...updates } : segment
              ),
              updatedAt: new Date(),
            }
          : track
      ),
    }));
  },
  
  deleteSegment: (trackId: string, segmentId: string) => {
    set(state => ({
      tracks: state.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              segments: track.segments.filter(segment => segment.id !== segmentId),
              updatedAt: new Date(),
            }
          : track
      ),
    }));
  },
  
  mergeSegments: (trackId: string, segmentIds: string[]) => {
    set(state => ({
      tracks: state.tracks.map(track => {
        if (track.id !== trackId) return track;
        
        const segmentsToMerge = track.segments.filter(s => segmentIds.includes(s.id));
        const otherSegments = track.segments.filter(s => !segmentIds.includes(s.id));
        
        if (segmentsToMerge.length < 2) return track;
        
        const mergedSegment: SubtitleSegment = {
          id: crypto.randomUUID(),
          startTime: Math.min(...segmentsToMerge.map(s => s.startTime)),
          endTime: Math.max(...segmentsToMerge.map(s => s.endTime)),
          duration: 0,
          text: segmentsToMerge.map(s => s.text).join(' '),
          confidence: segmentsToMerge.reduce((acc, s) => acc + s.confidence, 0) / segmentsToMerge.length,
          speaker: segmentsToMerge[0].speaker,
          language: segmentsToMerge[0].language,
          words: segmentsToMerge.flatMap(s => s.words),
          punctuation: true,
          formatting: segmentsToMerge[0].formatting,
        };
        
        mergedSegment.duration = mergedSegment.endTime - mergedSegment.startTime;
        
        return {
          ...track,
          segments: [...otherSegments, mergedSegment].sort((a, b) => a.startTime - b.startTime),
          updatedAt: new Date(),
        };
      }),
    }));
  },
  
  splitSegment: (trackId: string, segmentId: string, splitTime: number) => {
    set(state => ({
      tracks: state.tracks.map(track => {
        if (track.id !== trackId) return track;
        
        const segmentIndex = track.segments.findIndex(s => s.id === segmentId);
        if (segmentIndex === -1) return track;
        
        const segment = track.segments[segmentIndex];
        if (splitTime <= segment.startTime || splitTime >= segment.endTime) return track;
        
        const splitIndex = segment.words.findIndex(w => w.endTime > splitTime);
        
        const firstSegment: SubtitleSegment = {
          ...segment,
          id: crypto.randomUUID(),
          endTime: splitTime,
          duration: splitTime - segment.startTime,
          text: segment.words.slice(0, splitIndex).map(w => w.word).join(' '),
          words: segment.words.slice(0, splitIndex),
        };
        
        const secondSegment: SubtitleSegment = {
          ...segment,
          id: crypto.randomUUID(),
          startTime: splitTime,
          duration: segment.endTime - splitTime,
          text: segment.words.slice(splitIndex).map(w => w.word).join(' '),
          words: segment.words.slice(splitIndex),
        };
        
        const newSegments = [...track.segments];
        newSegments.splice(segmentIndex, 1, firstSegment, secondSegment);
        
        return {
          ...track,
          segments: newSegments,
          updatedAt: new Date(),
        };
      }),
    }));
  },
  
  // Actions - Speakers
  identifySpeakers: async (trackId: string) => {
    // Mock speaker identification
    const speakers: Speaker[] = [
      {
        id: 'speaker-1',
        name: 'Speaker 1',
        gender: 'unknown',
        confidence: 0.9,
        voiceprint: [],
        color: '#FF6B6B',
      },
      {
        id: 'speaker-2',
        name: 'Speaker 2',
        gender: 'unknown',
        confidence: 0.85,
        voiceprint: [],
        color: '#4ECDC4',
      },
    ];
    
    set(state => ({
      speakers: [...state.speakers, ...speakers],
    }));
    
    return speakers;
  },
  
  addSpeaker: (speaker: Omit<Speaker, 'id'>) => {
    const newSpeaker: Speaker = {
      ...speaker,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      speakers: [...state.speakers, newSpeaker],
    }));
    
    return newSpeaker.id;
  },
  
  updateSpeaker: (speakerId: string, updates: Partial<Speaker>) => {
    set(state => ({
      speakers: state.speakers.map(speaker => 
        speaker.id === speakerId ? { ...speaker, ...updates } : speaker
      ),
    }));
  },
  
  deleteSpeaker: (speakerId: string) => {
    set(state => ({
      speakers: state.speakers.filter(speaker => speaker.id !== speakerId),
    }));
  },
  
  assignSpeaker: (trackId: string, segmentId: string, speakerId: string) => {
    const speaker = get().speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    
    set(state => ({
      tracks: state.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              segments: track.segments.map(segment => 
                segment.id === segmentId ? { ...segment, speaker } : segment
              ),
              updatedAt: new Date(),
            }
          : track
      ),
    }));
  },
  
  trainSpeakerModel: async (speakerId: string, audioSamples: string[]) => {
    // Mock speaker training
  },
  
  // Actions - Speaker Profiles
  createSpeakerProfile: (profile: Omit<SpeakerProfile, 'id' | 'createdAt'>) => {
    const newProfile: SpeakerProfile = {
      ...profile,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    set(state => ({
      speakerProfiles: [...state.speakerProfiles, newProfile],
    }));
    
    return newProfile.id;
  },
  
  updateSpeakerProfile: (profileId: string, updates: Partial<SpeakerProfile>) => {
    set(state => ({
      speakerProfiles: state.speakerProfiles.map(profile => 
        profile.id === profileId ? { ...profile, ...updates } : profile
      ),
    }));
  },
  
  deleteSpeakerProfile: (profileId: string) => {
    set(state => ({
      speakerProfiles: state.speakerProfiles.filter(profile => profile.id !== profileId),
    }));
  },
  
  applySpeakerProfile: (trackId: string, profileId: string) => {
    const profile = get().speakerProfiles.find(p => p.id === profileId);
    if (!profile) return;
    
    // Mock applying speaker profile to track
  },
  
  // Actions - Styling
  applyStyle: (trackId: string, style: SubtitleStyle) => {
    set(state => ({
      tracks: state.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              segments: track.segments.map(segment => ({
                ...segment,
                formatting: {
                  ...segment.formatting,
                  color: style.color,
                  fontSize: style.fontSize,
                  position: style.position.vertical,
                  alignment: style.position.horizontal,
                },
              })),
              updatedAt: new Date(),
            }
          : track
      ),
    }));
  },
  
  createStyle: (style: Omit<SubtitleStyle, 'id'>) => {
    const newStyle: SubtitleStyle = {
      ...style,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      styles: [...state.styles, newStyle],
    }));
    
    return newStyle.id;
  },
  
  updateStyle: (styleId: string, updates: Partial<SubtitleStyle>) => {
    set(state => ({
      styles: state.styles.map(style => 
        style.id === styleId ? { ...style, ...updates } : style
      ),
    }));
  },
  
  deleteStyle: (styleId: string) => {
    set(state => ({
      styles: state.styles.filter(style => style.id !== styleId),
    }));
  },
  
  previewStyle: (trackId: string, styleId: string) => {
    const style = get().styles.find(s => s.id === styleId);
    if (!style) return;
    
    // Mock style preview
  },
  
  // Actions - Export
  exportSubtitles: async (trackId: string, options: SubtitleExportOptions) => {
    const track = get().tracks.find(t => t.id === trackId);
    if (!track) throw new Error('Track not found');
    
    switch (options.format) {
      case 'srt':
        return get().generateSRT(track);
      case 'vtt':
        return get().generateVTT(track);
      case 'ass':
        return get().generateASS(track);
      default:
        return JSON.stringify(track, null, 2);
    }
  },
  
  exportMultipleFormats: async (trackId: string, formats: SubtitleExportOptions[]) => {
    const results: Record<string, string> = {};
    
    for (const format of formats) {
      results[format.format] = await get().exportSubtitles(trackId, format);
    }
    
    return results;
  },
  
  generateSRT: (track: SubtitleTrack) => {
    return track.segments.map((segment, index) => {
      const startTime = formatTime(segment.startTime);
      const endTime = formatTime(segment.endTime);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
  },
  
  generateVTT: (track: SubtitleTrack) => {
    const header = 'WEBVTT\n\n';
    const content = track.segments.map(segment => {
      const startTime = formatTime(segment.startTime);
      const endTime = formatTime(segment.endTime);
      return `${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
    return header + content;
  },
  
  generateASS: (track: SubtitleTrack) => {
    // Mock ASS format generation
    return `[Script Info]\nTitle: ${track.name}\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,24,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${track.segments.map(segment => {
      const startTime = formatASSTime(segment.startTime);
      const endTime = formatASSTime(segment.endTime);
      return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${segment.text}`;
    }).join('\n')}`;
  },
  
  // Actions - Import
  importSubtitles: async (videoId: string, file: File, format: string) => {
    const content = await file.text();
    const segments = get().parseSubtitleFile(content, format);
    
    const track: SubtitleTrack = {
      id: crypto.randomUUID(),
      videoId,
      name: file.name,
      language: 'en',
      segments,
      speakers: [],
      totalDuration: segments.length > 0 ? segments[segments.length - 1].endTime : 0,
      wordCount: segments.reduce((acc, s) => acc + s.words.length, 0),
      averageConfidence: segments.reduce((acc, s) => acc + s.confidence, 0) / segments.length,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        model: 'imported',
        version: '1.0',
        processingTime: 0,
        accuracy: 0,
        speakerAccuracy: 0,
      },
    };
    
    set(state => ({
      tracks: [...state.tracks, track],
    }));
    
    return track.id;
  },
  
  parseSubtitleFile: (content: string, format: string) => {
    // Mock subtitle parsing
    const segments: SubtitleSegment[] = [];
    
    if (format === 'srt') {
      const blocks = content.split('\n\n').filter(block => block.trim());
      
      blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
          const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
          if (timeMatch) {
            const startTime = parseTime(timeMatch[1]);
            const endTime = parseTime(timeMatch[2]);
            const text = lines.slice(2).join(' ');
            
            segments.push({
              id: crypto.randomUUID(),
              startTime,
              endTime,
              duration: endTime - startTime,
              text,
              confidence: 1.0,
              language: 'en',
              words: text.split(' ').map((word, index) => ({
                word,
                startTime: startTime + (index * (endTime - startTime) / text.split(' ').length),
                endTime: startTime + ((index + 1) * (endTime - startTime) / text.split(' ').length),
                confidence: 1.0,
              })),
              punctuation: true,
              formatting: {
                bold: false,
                italic: false,
                position: 'bottom',
                alignment: 'center',
              },
            });
          }
        }
      });
    }
    
    return segments;
  },
  
  // Actions - Tasks
  createTask: (task: Omit<TranscriptionTask, 'id' | 'startTime'>) => {
    const newTask: TranscriptionTask = {
      ...task,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      tasks: [...state.tasks, newTask],
    }));
    
    return newTask.id;
  },
  
  cancelTask: (taskId: string) => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId),
    }));
  },
  
  retryTask: (taskId: string) => {
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId
          ? { ...task, status: 'queued', progress: 0, error: undefined }
          : task
      ),
    }));
  },
  
  clearCompletedTasks: () => {
    set(state => ({
      tasks: state.tasks.filter(task => task.status !== 'completed'),
    }));
  },
  
  // Actions - Languages
  detectLanguage: async (audioUrl: string) => {
    // Mock language detection
    return 'en';
  },
  
  getSupportedLanguages: () => {
    return get().languages;
  },
  
  updateLanguageModel: (code: string, updates: Partial<LanguageModel>) => {
    set(state => ({
      languages: state.languages.map(lang => 
        lang.code === code ? { ...lang, ...updates } : lang
      ),
    }));
  },
  
  // Actions - Quality
  validateTranscription: async (trackId: string) => {
    // Mock validation
    return 95; // 95% accuracy
  },
  
  improveAccuracy: async (trackId: string) => {
    // Mock accuracy improvement
  },
  
  reviewSegments: (trackId: string) => {
    const track = get().tracks.find(t => t.id === trackId);
    if (!track) return [];
    
    return track.segments.filter(segment => segment.confidence < 0.8);
  },
  
  // Actions - Real-time
  startRealTimeTranscription: async (audioStream: MediaStream) => {
    const sessionId = crypto.randomUUID();
    // Mock real-time transcription
    return sessionId;
  },
  
  stopRealTimeTranscription: (sessionId: string) => {
  },
  
  getRealTimeSegments: (sessionId: string) => {
    // Mock real-time segments
    return [];
  },
  
  // Actions - Configuration
  updateDefaultOptions: (options: Partial<TranscriptionOptions>) => {
    set(state => ({
      defaultOptions: { ...state.defaultOptions, ...options },
    }));
  },
  
  updateDefaultStyle: (style: Partial<SubtitleStyle>) => {
    set(state => ({
      defaultStyle: { ...state.defaultStyle, ...style },
    }));
  },
  
  setAutoSave: (enabled: boolean) => {
    set({ autoSave: enabled });
  },
  
  setRealTimePreview: (enabled: boolean) => {
    set({ realTimePreview: enabled });
  },
  
  // Actions - Data Management
  loadTracks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock loading from API
      const tracks: SubtitleTrack[] = [];
      
      set({ tracks, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tracks',
        isLoading: false 
      });
    }
  },
  
  saveTracks: async () => {
    // Mock saving to API
  },
  
  clearTracks: () => {
    set({ tracks: [] });
  },
  
  exportAllTracks: async () => {
    const tracks = get().tracks;
    return JSON.stringify(tracks, null, 2);
  },
  
  importTracks: async (data: any) => {
    try {
      const tracks = Array.isArray(data) ? data : [data];
      set(state => ({
        tracks: [...state.tracks, ...tracks],
      }));
    } catch (error) {
      set({ error: 'Failed to import tracks' });
    }
  },
  
  // Actions - UI
  setSelectedTrack: (track: SubtitleTrack | null) => {
    set({ selectedTrack: track });
  },
  
  setSelectedTask: (task: TranscriptionTask | null) => {
    set({ selectedTask: task });
  },
  
  setSelectedSpeaker: (speaker: Speaker | null) => {
    set({ selectedSpeaker: speaker });
  },
  
  setActiveStyle: (style: SubtitleStyle | null) => {
    set({ activeStyle: style });
  },
  
  setEditingSegment: (segment: SubtitleSegment | null) => {
    set({ editingSegment: segment });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Actions - Utilities
  getTaskProgress: (taskId: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    return task?.progress || 0;
  },
  
  estimateTranscriptionTime: async (audioUrl: string) => {
    // Mock estimation based on audio length
    return 300; // 5 minutes
  },
  
  validateAudioFile: async (audioUrl: string) => {
    // Mock validation
    return true;
  },
  
  optimizeAudio: async (audioUrl: string) => {
    // Mock audio optimization
    return audioUrl;
  },
  
  // Actions - System
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      await get().loadTracks();
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize',
        isLoading: false 
      });
    }
  },
  
  cleanup: () => {
    // Cancel any running tasks
    const activeTasks = get().activeTasks;
    activeTasks.forEach(task => {
      get().cancelTask(task.id);
    });
  },
  
  reset: () => {
    set({
      tracks: [],
      tasks: [],
      speakers: [],
      selectedTrack: null,
      selectedTask: null,
      selectedSpeaker: null,
      activeStyle: null,
      editingSegment: null,
      isLoading: false,
      error: null,
    });
  },
})));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const formatASSTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
};

const parseTime = (timeString: string): number => {
  const [time, ms] = timeString.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
};

export const transcribeVideo = async (videoId: string, audioUrl: string, options?: Partial<TranscriptionOptions>) => {
  const store = useAISubtitleStore.getState();
  return store.transcribeVideo(videoId, audioUrl, options);
};

export const getVideoTranscription = (videoId: string) => {
  const store = useAISubtitleStore.getState();
  return store.getTranscription(videoId);
};

export const exportSubtitles = async (trackId: string, options: SubtitleExportOptions) => {
  const store = useAISubtitleStore.getState();
  return store.exportSubtitles(trackId, options);
};

export const identifySpeakers = async (trackId: string) => {
  const store = useAISubtitleStore.getState();
  return store.identifySpeakers(trackId);
};

export const detectLanguage = async (audioUrl: string) => {
  const store = useAISubtitleStore.getState();
  return store.detectLanguage(audioUrl);
};

// Hook for easy access to the store
export const useSubtitleGeneration = () => {
  return useAISubtitleStore();
};

// Alternative hook name for compatibility
export const useAISubtitle = () => {
  return useAISubtitleStore();
};

export default useAISubtitleStore;