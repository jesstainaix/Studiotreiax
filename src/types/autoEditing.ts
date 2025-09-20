export interface SmartCut {
  id: string;
  timestamp: number;
  confidence: number;
  type: 'audio_silence' | 'scene_change' | 'motion_detection' | 'face_detection';
  metadata: {
    audioLevel?: number;
    motionIntensity?: number;
    sceneComplexity?: number;
  };
}

export interface SceneTransition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'slide';
  duration: number;
  confidence: number;
  fromScene: string;
  toScene: string;
  suggestedReason: string;
}

export interface ColorGradingProfile {
  id: string;
  name: string;
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  confidence: number;
}

export interface AudioLevelingData {
  id: string;
  timestamp: number;
  originalLevel: number;
  suggestedLevel: number;
  peakReduction: number;
  noiseReduction: number;
}

export interface ContentAnalysis {
  type: 'tutorial' | 'presentation' | 'interview' | 'vlog' | 'documentary' | 'entertainment';
  confidence: number;
  characteristics: {
    speechRatio: number;
    musicRatio: number;
    silenceRatio: number;
    sceneChanges: number;
    averageSceneDuration: number;
  };
  recommendations: string[];
}

export interface AIEditingSuggestion {
  id: string;
  type: 'cut' | 'transition' | 'color' | 'audio' | 'effect';
  timestamp: number;
  confidence: number;
  description: string;
  action: {
    type: string;
    parameters: Record<string, any>;
  };
  preview?: string;
}

export interface BatchProcessingJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  files: string[];
  settings: {
    autocut: boolean;
    colorGrading: boolean;
    audioLeveling: boolean;
    transitions: boolean;
  };
  results?: {
    processedFiles: string[];
    suggestions: AIEditingSuggestion[];
    errors?: string[];
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  preferences: {
    cutSensitivity: number;
    transitionStyle: string;
    colorGradingIntensity: number;
    audioNormalization: boolean;
    autoApplySuggestions: boolean;
  };
  learningData: {
    acceptedSuggestions: string[];
    rejectedSuggestions: string[];
    customSettings: Record<string, any>;
  };
  updatedAt: Date;
}

export interface AutoEditingSession {
  id: string;
  videoId: string;
  status: 'analyzing' | 'processing' | 'completed' | 'error';
  progress: number;
  analysis?: ContentAnalysis;
  suggestions: AIEditingSuggestion[];
  appliedSuggestions: string[];
  smartCuts: SmartCut[];
  transitions: SceneTransition[];
  colorGrading?: ColorGradingProfile;
  audioLeveling: AudioLevelingData[];
  createdAt: Date;
  completedAt?: Date;
}

export interface AutoEditingConfig {
  smartCutDetection: {
    enabled: boolean;
    sensitivity: number;
    minCutDuration: number;
    audioThreshold: number;
    motionThreshold: number;
  };
  sceneTransitions: {
    enabled: boolean;
    autoApply: boolean;
    defaultDuration: number;
    style: string;
  };
  colorGrading: {
    enabled: boolean;
    autoApply: boolean;
    intensity: number;
    preserveOriginal: boolean;
  };
  audioLeveling: {
    enabled: boolean;
    targetLevel: number;
    noiseReduction: boolean;
    dynamicRange: number;
  };
  realTimeSuggestions: {
    enabled: boolean;
    maxSuggestions: number;
    confidenceThreshold: number;
  };
  batchProcessing: {
    enabled: boolean;
    maxConcurrentJobs: number;
    autoStart: boolean;
  };
}

export interface AIProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  confidence: number;
}

export interface SmartEditingMetrics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  averageConfidence: number;
  processingTime: number;
  userSatisfaction?: number;
}