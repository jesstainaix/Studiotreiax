import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SceneDetection {
  id: string;
  videoId: string;
  scenes: {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    type: 'action' | 'dialogue' | 'transition' | 'static' | 'dynamic';
    confidence: number;
    description: string;
    keyframes: string[];
    objects: DetectedObject[];
    emotions: EmotionAnalysis;
    audioFeatures: AudioFeatures;
  }[];
  totalScenes: number;
  processingTime: number;
  status: 'analyzing' | 'completed' | 'failed';
  timestamp: Date;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  category: 'person' | 'object' | 'text' | 'logo' | 'face';
}

export interface EmotionAnalysis {
  dominant: string;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
    fearful: number;
    disgusted: number;
  };
  confidence: number;
  faces: {
    id: string;
    emotions: Record<string, number>;
    age?: number;
    gender?: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
}

export interface AudioFeatures {
  volume: number;
  pitch: number;
  tempo: number;
  speechDetected: boolean;
  musicDetected: boolean;
  noiseLevel: number;
  speechToMusicRatio: number;
  silencePercentage: number;
  spectralFeatures: {
    mfcc: number[];
    spectralCentroid: number;
    spectralRolloff: number;
    zeroCrossingRate: number;
  };
}

export interface ContentCategory {
  id: string;
  name: string;
  confidence: number;
  subcategories: string[];
  tags: string[];
  description: string;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  sceneDetection: SceneDetection;
  contentCategories: ContentCategory[];
  highlights: Highlight[];
  qualityMetrics: QualityMetrics;
  accessibility: AccessibilityAnalysis;
  engagement: EngagementPrediction;
  summary: string;
  keyMoments: KeyMoment[];
  processingTime: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  timestamp: Date;
}

export interface Highlight {
  id: string;
  startTime: number;
  endTime: number;
  type: 'peak_action' | 'emotional_moment' | 'key_dialogue' | 'visual_impact' | 'audio_peak';
  score: number;
  reason: string;
  thumbnail: string;
  description: string;
}

export interface QualityMetrics {
  overall: number;
  video: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    stability: number;
    sharpness: number;
    exposure: number;
    colorBalance: number;
  };
  audio: {
    quality: number;
    clarity: number;
    volume: number;
    backgroundNoise: number;
    dynamicRange: number;
  };
  technical: {
    compression: number;
    artifacts: number;
    synchronization: number;
  };
}

export interface AccessibilityAnalysis {
  hasSubtitles: boolean;
  hasAudioDescription: boolean;
  colorContrast: number;
  textReadability: number;
  visualClarity: number;
  audioClarity: number;
  recommendations: string[];
  score: number;
}

export interface EngagementPrediction {
  overallScore: number;
  factors: {
    visualAppeal: number;
    audioQuality: number;
    pacing: number;
    contentRelevance: number;
    emotionalImpact: number;
  };
  predictions: {
    viewTime: number;
    dropOffPoints: number[];
    engagementCurve: number[];
  };
  recommendations: string[];
}

export interface KeyMoment {
  id: string;
  timestamp: number;
  type: 'intro' | 'climax' | 'conclusion' | 'transition' | 'highlight';
  importance: number;
  description: string;
  thumbnail: string;
}

export interface AnalysisTask {
  id: string;
  videoId: string;
  type: 'full_analysis' | 'scene_detection' | 'content_categorization' | 'highlight_detection';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
  startTime?: Date;
  endTime?: Date;
  result?: VideoAnalysis;
  error?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AnalysisConfig {
  sceneDetection: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    minSceneDuration: number;
    includeKeyframes: boolean;
    detectObjects: boolean;
    detectEmotions: boolean;
    analyzeAudio: boolean;
  };
  contentCategorization: {
    enabled: boolean;
    categories: string[];
    confidence: number;
    includeSubcategories: boolean;
  };
  highlightDetection: {
    enabled: boolean;
    types: string[];
    minScore: number;
    maxHighlights: number;
  };
  qualityAnalysis: {
    enabled: boolean;
    checkVideo: boolean;
    checkAudio: boolean;
    checkTechnical: boolean;
  };
  accessibility: {
    enabled: boolean;
    checkSubtitles: boolean;
    checkContrast: boolean;
    checkReadability: boolean;
  };
  engagement: {
    enabled: boolean;
    predictViewTime: boolean;
    identifyDropOffs: boolean;
    generateRecommendations: boolean;
  };
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

interface AIContentAnalysisState {
  // State
  analyses: VideoAnalysis[];
  tasks: AnalysisTask[];
  config: AnalysisConfig;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedAnalysis: VideoAnalysis | null;
  selectedTask: AnalysisTask | null;
  activeTab: string;
  
  // Computed
  completedAnalyses: VideoAnalysis[];
  pendingTasks: AnalysisTask[];
  activeTasks: AnalysisTask[];
  
  // Actions - Analysis
  analyzeVideo: (videoId: string, options?: Partial<AnalysisConfig>) => Promise<string>;
  getAnalysis: (videoId: string) => VideoAnalysis | null;
  deleteAnalysis: (id: string) => void;
  reanalyzeVideo: (videoId: string) => Promise<string>;
  
  // Actions - Scene Detection
  detectScenes: (videoId: string) => Promise<SceneDetection>;
  getSceneAtTime: (videoId: string, timestamp: number) => any;
  exportScenes: (videoId: string, format: 'json' | 'csv' | 'srt') => void;
  
  // Actions - Content Categorization
  categorizeContent: (videoId: string) => Promise<ContentCategory[]>;
  addCustomCategory: (category: ContentCategory) => void;
  removeCategory: (videoId: string, categoryId: string) => void;
  
  // Actions - Highlights
  detectHighlights: (videoId: string) => Promise<Highlight[]>;
  addManualHighlight: (videoId: string, highlight: Omit<Highlight, 'id'>) => void;
  removeHighlight: (videoId: string, highlightId: string) => void;
  exportHighlights: (videoId: string) => void;
  
  // Actions - Quality Analysis
  analyzeQuality: (videoId: string) => Promise<QualityMetrics>;
  getQualityReport: (videoId: string) => string;
  
  // Actions - Accessibility
  analyzeAccessibility: (videoId: string) => Promise<AccessibilityAnalysis>;
  generateAccessibilityReport: (videoId: string) => string;
  
  // Actions - Engagement
  predictEngagement: (videoId: string) => Promise<EngagementPrediction>;
  getEngagementInsights: (videoId: string) => string[];
  
  // Actions - Tasks
  createTask: (task: Omit<AnalysisTask, 'id' | 'startTime'>) => string;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  
  // Actions - Configuration
  updateConfig: (updates: Partial<AnalysisConfig>) => void;
  resetConfig: () => void;
  saveConfig: () => void;
  loadConfig: () => void;
  
  // Actions - Data Management
  loadAnalyses: () => Promise<void>;
  exportAnalyses: (format: 'json' | 'csv') => void;
  importAnalyses: (data: any) => void;
  clearAnalyses: () => void;
  
  // Actions - UI
  setSelectedAnalysis: (analysis: VideoAnalysis | null) => void;
  setSelectedTask: (task: AnalysisTask | null) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Utilities
  getAnalysisProgress: (taskId: string) => number;
  estimateAnalysisTime: (videoId: string) => number;
  validateVideo: (videoId: string) => boolean;
  optimizeAnalysis: (videoId: string) => Promise<void>;
  
  // Actions - System
  initialize: () => Promise<void>;
  cleanup: () => void;
  reset: () => void;
}

export const useAIContentAnalysisStore = create<AIContentAnalysisState>()(devtools((set, get) => ({
  // Initial State
  analyses: [],
  tasks: [],
  config: {
    sceneDetection: {
      enabled: true,
      sensitivity: 'medium',
      minSceneDuration: 2,
      includeKeyframes: true,
      detectObjects: true,
      detectEmotions: true,
      analyzeAudio: true,
    },
    contentCategorization: {
      enabled: true,
      categories: ['education', 'entertainment', 'business', 'technology', 'lifestyle'],
      confidence: 0.7,
      includeSubcategories: true,
    },
    highlightDetection: {
      enabled: true,
      types: ['peak_action', 'emotional_moment', 'key_dialogue', 'visual_impact'],
      minScore: 0.8,
      maxHighlights: 10,
    },
    qualityAnalysis: {
      enabled: true,
      checkVideo: true,
      checkAudio: true,
      checkTechnical: true,
    },
    accessibility: {
      enabled: true,
      checkSubtitles: true,
      checkContrast: true,
      checkReadability: true,
    },
    engagement: {
      enabled: true,
      predictViewTime: true,
      identifyDropOffs: true,
      generateRecommendations: true,
    },
  },
  
  // Initial UI State
  isLoading: false,
  error: null,
  selectedAnalysis: null,
  selectedTask: null,
  activeTab: 'overview',
  
  // Computed Values
  get completedAnalyses() {
    return get().analyses.filter(analysis => analysis.status === 'completed');
  },
  
  get pendingTasks() {
    return get().tasks.filter(task => task.status === 'queued');
  },
  
  get activeTasks() {
    return get().tasks.filter(task => task.status === 'processing');
  },
  
  // Actions - Analysis
  analyzeVideo: async (videoId: string, options?: Partial<AnalysisConfig>) => {
    const taskId = crypto.randomUUID();
    const config = { ...get().config, ...options };
    
    const task: AnalysisTask = {
      id: taskId,
      videoId,
      type: 'full_analysis',
      status: 'queued',
      progress: 0,
      estimatedTime: 300, // 5 minutes
      priority: 'medium',
    };
    
    set(state => ({
      tasks: [...state.tasks, task],
      isLoading: true,
      error: null,
    }));
    
    try {
      // Simulate analysis process
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, status: 'processing', startTime: new Date() } : t
        ),
      }));
      
      // Mock analysis result
      const analysis: VideoAnalysis = {
        id: crypto.randomUUID(),
        videoId,
        sceneDetection: {
          id: crypto.randomUUID(),
          videoId,
          scenes: [],
          totalScenes: 0,
          processingTime: 0,
          status: 'completed',
          timestamp: new Date(),
        },
        contentCategories: [],
        highlights: [],
        qualityMetrics: {
          overall: 85,
          video: {
            resolution: '1920x1080',
            frameRate: 30,
            bitrate: 5000,
            stability: 90,
            sharpness: 85,
            exposure: 80,
            colorBalance: 88,
          },
          audio: {
            quality: 82,
            clarity: 85,
            volume: 78,
            backgroundNoise: 15,
            dynamicRange: 70,
          },
          technical: {
            compression: 85,
            artifacts: 10,
            synchronization: 95,
          },
        },
        accessibility: {
          hasSubtitles: false,
          hasAudioDescription: false,
          colorContrast: 75,
          textReadability: 80,
          visualClarity: 85,
          audioClarity: 82,
          recommendations: ['Add subtitles', 'Improve color contrast'],
          score: 70,
        },
        engagement: {
          overallScore: 78,
          factors: {
            visualAppeal: 80,
            audioQuality: 75,
            pacing: 82,
            contentRelevance: 85,
            emotionalImpact: 70,
          },
          predictions: {
            viewTime: 180,
            dropOffPoints: [45, 120],
            engagementCurve: [100, 95, 85, 75, 70, 65, 60],
          },
          recommendations: ['Improve opening hook', 'Add more visual variety'],
        },
        summary: 'High-quality video with good technical metrics. Consider adding subtitles for accessibility.',
        keyMoments: [],
        processingTime: 0,
        status: 'completed',
        progress: 100,
        timestamp: new Date(),
      };
      
      set(state => ({
        analyses: [...state.analyses, analysis],
        tasks: state.tasks.map(t => 
          t.id === taskId ? { 
            ...t, 
            status: 'completed', 
            progress: 100, 
            endTime: new Date(),
            result: analysis 
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
            error: error instanceof Error ? error.message : 'Analysis failed' 
          } : t
        ),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      }));
      
      throw error;
    }
  },
  
  getAnalysis: (videoId: string) => {
    return get().analyses.find(analysis => analysis.videoId === videoId) || null;
  },
  
  deleteAnalysis: (id: string) => {
    set(state => ({
      analyses: state.analyses.filter(analysis => analysis.id !== id),
    }));
  },
  
  reanalyzeVideo: async (videoId: string) => {
    // Remove existing analysis
    set(state => ({
      analyses: state.analyses.filter(analysis => analysis.videoId !== videoId),
    }));
    
    // Start new analysis
    return get().analyzeVideo(videoId);
  },
  
  // Actions - Scene Detection
  detectScenes: async (videoId: string) => {
    // Mock scene detection
    const sceneDetection: SceneDetection = {
      id: crypto.randomUUID(),
      videoId,
      scenes: [
        {
          id: crypto.randomUUID(),
          startTime: 0,
          endTime: 30,
          duration: 30,
          type: 'dialogue',
          confidence: 0.9,
          description: 'Opening scene with dialogue',
          keyframes: [],
          objects: [],
          emotions: {
            dominant: 'neutral',
            emotions: {
              happy: 0.2,
              sad: 0.1,
              angry: 0.05,
              surprised: 0.1,
              neutral: 0.5,
              fearful: 0.03,
              disgusted: 0.02,
            },
            confidence: 0.8,
            faces: [],
          },
          audioFeatures: {
            volume: 75,
            pitch: 200,
            tempo: 120,
            speechDetected: true,
            musicDetected: false,
            noiseLevel: 10,
            speechToMusicRatio: 0.9,
            silencePercentage: 0.1,
            spectralFeatures: {
              mfcc: [],
              spectralCentroid: 1500,
              spectralRolloff: 3000,
              zeroCrossingRate: 0.1,
            },
          },
        },
      ],
      totalScenes: 1,
      processingTime: 5000,
      status: 'completed',
      timestamp: new Date(),
    };
    
    return sceneDetection;
  },
  
  getSceneAtTime: (videoId: string, timestamp: number) => {
    const analysis = get().getAnalysis(videoId);
    if (!analysis) return null;
    
    return analysis.sceneDetection.scenes.find(
      scene => timestamp >= scene.startTime && timestamp <= scene.endTime
    );
  },
  
  exportScenes: (videoId: string, format: 'json' | 'csv' | 'srt') => {
    const analysis = get().getAnalysis(videoId);
    if (!analysis) return;
    
    // Mock export functionality
  },
  
  // Actions - Content Categorization
  categorizeContent: async (videoId: string) => {
    // Mock categorization
    const categories: ContentCategory[] = [
      {
        id: crypto.randomUUID(),
        name: 'Education',
        confidence: 0.85,
        subcategories: ['Tutorial', 'Explanation'],
        tags: ['learning', 'instructional', 'educational'],
        description: 'Educational content with instructional elements',
      },
    ];
    
    return categories;
  },
  
  addCustomCategory: (category: ContentCategory) => {
    // Implementation for adding custom categories
  },
  
  removeCategory: (videoId: string, categoryId: string) => {
    set(state => ({
      analyses: state.analyses.map(analysis => 
        analysis.videoId === videoId
          ? {
              ...analysis,
              contentCategories: analysis.contentCategories.filter(cat => cat.id !== categoryId)
            }
          : analysis
      ),
    }));
  },
  
  // Actions - Highlights
  detectHighlights: async (videoId: string) => {
    // Mock highlight detection
    const highlights: Highlight[] = [
      {
        id: crypto.randomUUID(),
        startTime: 45,
        endTime: 60,
        type: 'peak_action',
        score: 0.9,
        reason: 'High visual activity and audio peaks detected',
        thumbnail: '',
        description: 'Exciting action sequence',
      },
    ];
    
    return highlights;
  },
  
  addManualHighlight: (videoId: string, highlight: Omit<Highlight, 'id'>) => {
    const newHighlight: Highlight = {
      ...highlight,
      id: crypto.randomUUID(),
    };
    
    set(state => ({
      analyses: state.analyses.map(analysis => 
        analysis.videoId === videoId
          ? { ...analysis, highlights: [...analysis.highlights, newHighlight] }
          : analysis
      ),
    }));
  },
  
  removeHighlight: (videoId: string, highlightId: string) => {
    set(state => ({
      analyses: state.analyses.map(analysis => 
        analysis.videoId === videoId
          ? {
              ...analysis,
              highlights: analysis.highlights.filter(h => h.id !== highlightId)
            }
          : analysis
      ),
    }));
  },
  
  exportHighlights: (videoId: string) => {
    const analysis = get().getAnalysis(videoId);
    if (!analysis) return;
  },
  
  // Actions - Quality Analysis
  analyzeQuality: async (videoId: string) => {
    // Mock quality analysis
    const qualityMetrics: QualityMetrics = {
      overall: 85,
      video: {
        resolution: '1920x1080',
        frameRate: 30,
        bitrate: 5000,
        stability: 90,
        sharpness: 85,
        exposure: 80,
        colorBalance: 88,
      },
      audio: {
        quality: 82,
        clarity: 85,
        volume: 78,
        backgroundNoise: 15,
        dynamicRange: 70,
      },
      technical: {
        compression: 85,
        artifacts: 10,
        synchronization: 95,
      },
    };
    
    return qualityMetrics;
  },
  
  getQualityReport: (videoId: string) => {
    const analysis = get().getAnalysis(videoId);
    if (!analysis) return '';
    
    return `Quality Report for Video ${videoId}: Overall score ${analysis.qualityMetrics.overall}/100`;
  },
  
  // Actions - Accessibility
  analyzeAccessibility: async (videoId: string) => {
    // Mock accessibility analysis
    const accessibility: AccessibilityAnalysis = {
      hasSubtitles: false,
      hasAudioDescription: false,
      colorContrast: 75,
      textReadability: 80,
      visualClarity: 85,
      audioClarity: 82,
      recommendations: ['Add subtitles', 'Improve color contrast'],
      score: 70,
    };
    
    return accessibility;
  },
  
  generateAccessibilityReport: (videoId: string) => {
    const analysis = get().getAnalysis(videoId);
    if (!analysis) return '';
    
    return `Accessibility Report for Video ${videoId}: Score ${analysis.accessibility.score}/100`;
  },
  
  // Actions - Engagement
  predictEngagement: async (videoId: string) => {
    // Mock engagement prediction
    const engagement: EngagementPrediction = {
      overallScore: 78,
      factors: {
        visualAppeal: 80,
        audioQuality: 75,
        pacing: 82,
        contentRelevance: 85,
        emotionalImpact: 70,
      },
      predictions: {
        viewTime: 180,
        dropOffPoints: [45, 120],
        engagementCurve: [100, 95, 85, 75, 70, 65, 60],
      },
      recommendations: ['Improve opening hook', 'Add more visual variety'],
    };
    
    return engagement;
  },
  
  getEngagementInsights: (videoId: string) => {
    const analysis = get().getAnalysis(videoId);
    if (!analysis) return [];
    
    return analysis.engagement.recommendations;
  },
  
  // Actions - Tasks
  createTask: (task: Omit<AnalysisTask, 'id' | 'startTime'>) => {
    const newTask: AnalysisTask = {
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
  
  // Actions - Configuration
  updateConfig: (updates: Partial<AnalysisConfig>) => {
    set(state => ({
      config: { ...state.config, ...updates },
    }));
  },
  
  resetConfig: () => {
    // Reset to default config
    set(state => ({
      config: {
        sceneDetection: {
          enabled: true,
          sensitivity: 'medium',
          minSceneDuration: 2,
          includeKeyframes: true,
          detectObjects: true,
          detectEmotions: true,
          analyzeAudio: true,
        },
        contentCategorization: {
          enabled: true,
          categories: ['education', 'entertainment', 'business', 'technology', 'lifestyle'],
          confidence: 0.7,
          includeSubcategories: true,
        },
        highlightDetection: {
          enabled: true,
          types: ['peak_action', 'emotional_moment', 'key_dialogue', 'visual_impact'],
          minScore: 0.8,
          maxHighlights: 10,
        },
        qualityAnalysis: {
          enabled: true,
          checkVideo: true,
          checkAudio: true,
          checkTechnical: true,
        },
        accessibility: {
          enabled: true,
          checkSubtitles: true,
          checkContrast: true,
          checkReadability: true,
        },
        engagement: {
          enabled: true,
          predictViewTime: true,
          identifyDropOffs: true,
          generateRecommendations: true,
        },
      },
    }));
  },
  
  saveConfig: () => {
    const config = get().config;
    localStorage.setItem('aiContentAnalysisConfig', JSON.stringify(config));
  },
  
  loadConfig: () => {
    const saved = localStorage.getItem('aiContentAnalysisConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        set(state => ({ config }));
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  },
  
  // Actions - Data Management
  loadAnalyses: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Mock loading from API
      const analyses: VideoAnalysis[] = [];
      
      set({ analyses, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load analyses',
        isLoading: false 
      });
    }
  },
  
  exportAnalyses: (format: 'json' | 'csv') => {
    const analyses = get().analyses;
  },
  
  importAnalyses: (data: any) => {
    try {
      const analyses = Array.isArray(data) ? data : [data];
      set(state => ({
        analyses: [...state.analyses, ...analyses],
      }));
    } catch (error) {
      set({ error: 'Failed to import analyses' });
    }
  },
  
  clearAnalyses: () => {
    set({ analyses: [] });
  },
  
  // Actions - UI
  setSelectedAnalysis: (analysis: VideoAnalysis | null) => {
    set({ selectedAnalysis: analysis });
  },
  
  setSelectedTask: (task: AnalysisTask | null) => {
    set({ selectedTask: task });
  },
  
  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Actions - Utilities
  getAnalysisProgress: (taskId: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    return task?.progress || 0;
  },
  
  estimateAnalysisTime: (videoId: string) => {
    // Mock estimation based on video length and complexity
    return 300; // 5 minutes
  },
  
  validateVideo: (videoId: string) => {
    // Mock validation
    return videoId.length > 0;
  },
  
  optimizeAnalysis: async (videoId: string) => {
    // Mock optimization
  },
  
  // Actions - System
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      await get().loadConfig();
      await get().loadAnalyses();
      
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
      analyses: [],
      tasks: [],
      selectedAnalysis: null,
      selectedTask: null,
      activeTab: 'overview',
      isLoading: false,
      error: null,
    });
    
    get().resetConfig();
  },
})));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const analyzeVideoContent = async (videoId: string, options?: Partial<AnalysisConfig>) => {
  const store = useAIContentAnalysisStore.getState();
  return store.analyzeVideo(videoId, options);
};

export const getVideoAnalysis = (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.getAnalysis(videoId);
};

export const detectVideoScenes = async (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.detectScenes(videoId);
};

export const categorizeVideoContent = async (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.categorizeContent(videoId);
};

export const detectVideoHighlights = async (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.detectHighlights(videoId);
};

export const analyzeVideoQuality = async (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.analyzeQuality(videoId);
};

export const analyzeVideoAccessibility = async (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.analyzeAccessibility(videoId);
};

export const predictVideoEngagement = async (videoId: string) => {
  const store = useAIContentAnalysisStore.getState();
  return store.predictEngagement(videoId);
};

// Hook for easy access to the store
export const useContentAnalysis = () => {
  return useAIContentAnalysisStore();
};

// Alternative hook name for compatibility
export const useAIContentAnalysis = () => {
  return useAIContentAnalysisStore();
};

export default useAIContentAnalysisStore;