import { create } from 'zustand';

// Types and Interfaces
export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  content: string;
  action?: 'click' | 'hover' | 'input' | 'scroll' | 'wait';
  actionTarget?: string;
  actionValue?: string;
  duration?: number;
  skippable: boolean;
  required: boolean;
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    alt?: string;
  };
  interactive?: {
    type: 'quiz' | 'task' | 'form';
    data: any;
  };
  conditions?: {
    userRole?: string[];
    feature?: string[];
    progress?: number;
  };
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced' | 'update';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  steps: TourStep[];
  prerequisites?: string[]; // other tour IDs
  tags: string[];
  version: string;
  isActive: boolean;
  isPublished: boolean;
  targetAudience: string[];
  createdAt: number;
  updatedAt: number;
  completionRate: number;
  averageRating: number;
  totalCompletions: number;
}

export interface UserProgress {
  userId: string;
  tourId: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
  rating?: number;
  feedback?: string;
  timeSpent: number;
  interactions: {
    stepId: string;
    action: string;
    timestamp: number;
    duration: number;
  }[];
}

export interface TourAnalytics {
  tourId: string;
  totalStarts: number;
  totalCompletions: number;
  averageCompletionTime: number;
  dropOffPoints: {
    stepId: string;
    dropOffRate: number;
  }[];
  userFeedback: {
    rating: number;
    comment: string;
    timestamp: number;
  }[];
  performanceMetrics: {
    stepId: string;
    averageTime: number;
    successRate: number;
    retryRate: number;
  }[];
}

export interface TourFilter {
  category?: string;
  difficulty?: string;
  tags?: string[];
  status?: 'active' | 'completed' | 'not-started';
  duration?: { min: number; max: number };
  search?: string;
}

export interface TourStats {
  totalTours: number;
  activeTours: number;
  completedTours: number;
  averageCompletionRate: number;
  totalTimeSpent: number;
  popularTours: Tour[];
  recentActivity: UserProgress[];
}

export interface TourConfig {
  autoStart: boolean;
  showProgress: boolean;
  allowSkipping: boolean;
  enableAnalytics: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  animations: boolean;
  soundEffects: boolean;
  keyboardNavigation: boolean;
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

export interface TourEvent {
  id: string;
  type: 'tour_started' | 'step_completed' | 'tour_completed' | 'tour_skipped' | 'step_failed';
  tourId: string;
  stepId?: string;
  userId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

// Zustand Store
interface GuidedToursState {
  // State
  tours: Tour[];
  userProgress: Map<string, UserProgress>;
  activeTour: Tour | null;
  currentStep: TourStep | null;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  analytics: Map<string, TourAnalytics>;
  events: TourEvent[];
  filter: TourFilter;
  searchQuery: string;
  selectedTourId: string | null;
  isAutoPlayEnabled: boolean;
  showOverlay: boolean;
  highlightTarget: string | null;
  error: string | null;
  loading: boolean;

  // Computed values
  filteredTours: Tour[];
  availableTours: Tour[];
  completedTours: Tour[];
  inProgressTours: Tour[];
  recommendedTours: Tour[];
  stats: TourStats;
  hasActiveTour: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  completionPercentage: number;
  estimatedTimeRemaining: number;

  // Actions
  setTours: (tours: Tour[]) => void;
  addTour: (tour: Tour) => void;
  updateTour: (id: string, updates: Partial<Tour>) => void;
  deleteTour: (id: string) => void;
  setFilter: (filter: Partial<TourFilter>) => void;
  setSearch: (query: string) => void;
  clearFilters: () => void;
  setSelectedTourId: (id: string | null) => void;
  setIsAutoPlayEnabled: (enabled: boolean) => void;

  // Tour control actions
  startTour: (tourId: string, userId: string) => Promise<void>;
  pauseTour: () => void;
  resumeTour: () => void;
  stopTour: () => void;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  goToStep: (stepIndex: number) => Promise<void>;
  skipStep: () => Promise<void>;
  completeTour: (rating?: number, feedback?: string) => Promise<void>;
  restartTour: () => Promise<void>;

  // Progress management
  updateProgress: (userId: string, tourId: string, updates: Partial<UserProgress>) => void;
  getProgress: (userId: string, tourId: string) => UserProgress | null;
  resetProgress: (userId: string, tourId: string) => void;

  // Analytics actions
  trackEvent: (event: Omit<TourEvent, 'id' | 'timestamp'>) => void;
  updateAnalytics: (tourId: string, analytics: Partial<TourAnalytics>) => void;
  getAnalytics: (tourId: string) => TourAnalytics | null;

  // Quick actions
  handleQuickAction: (action: string, data?: any) => Promise<void>;
  handleBulkAction: (action: string, tourIds: string[]) => Promise<void>;
  handleExportTour: (tourId: string, format: 'json' | 'pdf' | 'html') => Promise<void>;
  handleImportTour: (data: any, format: 'json' | 'scorm') => Promise<void>;

  // Advanced features
  handlePersonalization: (userId: string, preferences: any) => Promise<void>;
  handleAdaptiveTour: (tourId: string, userBehavior: any) => Promise<void>;
  handleCollaborativeTour: (tourId: string, participants: string[]) => Promise<void>;
  handleTourRecommendation: (userId: string) => Promise<Tour[]>;

  // System operations
  refreshTours: () => Promise<void>;
  syncProgress: () => Promise<void>;
  validateTour: (tour: Tour) => Promise<{ isValid: boolean; errors: string[] }>;
  optimizeTour: (tourId: string) => Promise<void>;

  // Utilities
  utilities: {
    formatDuration: (minutes: number) => string;
    calculateProgress: (progress: UserProgress) => number;
    getDifficultyColor: (difficulty: string) => string;
    getCategoryIcon: (category: string) => string;
    getStepIcon: (step: TourStep) => string;
    formatCompletionRate: (rate: number) => string;
  };

  // Configuration
  config: TourConfig;
  configHelpers: {
    updateTourConfig: (updates: Partial<TourConfig>) => void;
    resetConfig: () => void;
    exportConfig: () => string;
    importConfig: (config: string) => void;
  };

  // Analytics helpers
  analyticsHelpers: {
    generateReport: (tourId: string, period: string) => Promise<any>;
    exportAnalytics: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
    getInsights: (tourId: string) => Promise<any>;
    comparePerformance: (tourIds: string[]) => Promise<any>;
  };

  // Debug helpers
  debugHelpers: {
    logTourState: () => void;
    validateTourData: () => boolean;
    simulateUserJourney: (tourId: string) => Promise<void>;
    testTourPerformance: (tourId: string) => Promise<any>;
  };
}

// Create store
export const useGuidedToursStore = create<GuidedToursState>((set, get) => ({
  // Initial state
  tours: [],
  userProgress: new Map(),
  activeTour: null,
  currentStep: null,
  currentStepIndex: 0,
  isPlaying: false,
  isPaused: false,
  isCompleted: false,
  analytics: new Map(),
  events: [],
  filter: {},
  searchQuery: '',
  selectedTourId: null,
  isAutoPlayEnabled: true,
  showOverlay: false,
  highlightTarget: null,
  error: null,
  loading: false,

  // Computed values
  get filteredTours() {
    const { tours, filter, searchQuery } = get();
    return tours.filter(tour => {
      if (searchQuery && !tour.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filter.category && tour.category !== filter.category) {
        return false;
      }
      if (filter.difficulty && tour.difficulty !== filter.difficulty) {
        return false;
      }
      if (filter.tags && !filter.tags.some(tag => tour.tags.includes(tag))) {
        return false;
      }
      return true;
    });
  },

  get availableTours() {
    return get().tours.filter(tour => tour.isActive && tour.isPublished);
  },

  get completedTours() {
    const { tours, userProgress } = get();
    return tours.filter(tour => {
      const progress = Array.from(userProgress.values()).find(p => p.tourId === tour.id);
      return progress?.completedAt;
    });
  },

  get inProgressTours() {
    const { tours, userProgress } = get();
    return tours.filter(tour => {
      const progress = Array.from(userProgress.values()).find(p => p.tourId === tour.id);
      return progress && !progress.completedAt && progress.currentStepIndex > 0;
    });
  },

  get recommendedTours() {
    return get().tours
      .filter(tour => tour.isActive && tour.isPublished)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  },

  get stats() {
    const { tours, userProgress } = get();
    const progressArray = Array.from(userProgress.values());
    
    return {
      totalTours: tours.length,
      activeTours: tours.filter(t => t.isActive).length,
      completedTours: progressArray.filter(p => p.completedAt).length,
      averageCompletionRate: tours.reduce((acc, tour) => acc + tour.completionRate, 0) / tours.length || 0,
      totalTimeSpent: progressArray.reduce((acc, p) => acc + p.timeSpent, 0),
      popularTours: tours.sort((a, b) => b.totalCompletions - a.totalCompletions).slice(0, 3),
      recentActivity: progressArray.sort((a, b) => b.lastActiveAt - a.lastActiveAt).slice(0, 5)
    };
  },

  get hasActiveTour() {
    return get().activeTour !== null;
  },

  get canGoNext() {
    const { activeTour, currentStepIndex } = get();
    return activeTour && currentStepIndex < activeTour.steps.length - 1;
  },

  get canGoPrevious() {
    return get().currentStepIndex > 0;
  },

  get completionPercentage() {
    const { activeTour, currentStepIndex } = get();
    if (!activeTour) return 0;
    return Math.round((currentStepIndex / activeTour.steps.length) * 100);
  },

  get estimatedTimeRemaining() {
    const { activeTour, currentStepIndex } = get();
    if (!activeTour) return 0;
    const remainingSteps = activeTour.steps.length - currentStepIndex;
    return Math.round((remainingSteps / activeTour.steps.length) * activeTour.estimatedTime);
  },

  // Basic actions
  setTours: (tours) => set({ tours }),
  addTour: (tour) => set(state => ({ tours: [...state.tours, tour] })),
  updateTour: (id, updates) => set(state => ({
    tours: state.tours.map(tour => tour.id === id ? { ...tour, ...updates } : tour)
  })),
  deleteTour: (id) => set(state => ({
    tours: state.tours.filter(tour => tour.id !== id)
  })),
  setFilter: (filter) => set(state => ({ filter: { ...state.filter, ...filter } })),
  setSearch: (searchQuery) => set({ searchQuery }),
  clearFilters: () => set({ filter: {}, searchQuery: '' }),
  setSelectedTourId: (selectedTourId) => set({ selectedTourId }),
  setIsAutoPlayEnabled: (isAutoPlayEnabled) => set({ isAutoPlayEnabled }),

  // Tour control actions
  startTour: async (tourId, userId) => {
    const { tours, userProgress } = get();
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;

    const progress: UserProgress = {
      userId,
      tourId,
      currentStepIndex: 0,
      completedSteps: [],
      skippedSteps: [],
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      timeSpent: 0,
      interactions: []
    };

    const newProgress = new Map(userProgress);
    newProgress.set(`${userId}-${tourId}`, progress);

    set({
      activeTour: tour,
      currentStep: tour.steps[0],
      currentStepIndex: 0,
      isPlaying: true,
      isPaused: false,
      isCompleted: false,
      userProgress: newProgress,
      showOverlay: true,
      highlightTarget: tour.steps[0]?.target
    });

    get().trackEvent({
      type: 'tour_started',
      tourId,
      userId,
      metadata: { tourName: tour.name }
    });
  },

  pauseTour: () => set({ isPaused: true, isPlaying: false }),
  resumeTour: () => set({ isPaused: false, isPlaying: true }),
  stopTour: () => set({
    activeTour: null,
    currentStep: null,
    currentStepIndex: 0,
    isPlaying: false,
    isPaused: false,
    showOverlay: false,
    highlightTarget: null
  }),

  nextStep: async () => {
    const { activeTour, currentStepIndex, canGoNext } = get();
    if (!activeTour || !canGoNext) return;

    const nextIndex = currentStepIndex + 1;
    const nextStep = activeTour.steps[nextIndex];

    set({
      currentStepIndex: nextIndex,
      currentStep: nextStep,
      highlightTarget: nextStep?.target
    });

    // Update progress
    const currentUserId = 'current-user'; // This would come from auth context
    const progressKey = `${currentUserId}-${activeTour.id}`;
    const { userProgress } = get();
    const progress = userProgress.get(progressKey);
    
    if (progress) {
      const updatedProgress = {
        ...progress,
        currentStepIndex: nextIndex,
        completedSteps: [...progress.completedSteps, activeTour.steps[currentStepIndex].id],
        lastActiveAt: Date.now()
      };
      
      const newProgress = new Map(userProgress);
      newProgress.set(progressKey, updatedProgress);
      set({ userProgress: newProgress });
    }
  },

  previousStep: async () => {
    const { activeTour, currentStepIndex, canGoPrevious } = get();
    if (!activeTour || !canGoPrevious) return;

    const prevIndex = currentStepIndex - 1;
    const prevStep = activeTour.steps[prevIndex];

    set({
      currentStepIndex: prevIndex,
      currentStep: prevStep,
      highlightTarget: prevStep?.target
    });
  },

  goToStep: async (stepIndex) => {
    const { activeTour } = get();
    if (!activeTour || stepIndex < 0 || stepIndex >= activeTour.steps.length) return;

    const step = activeTour.steps[stepIndex];
    set({
      currentStepIndex: stepIndex,
      currentStep: step,
      highlightTarget: step?.target
    });
  },

  skipStep: async () => {
    const { activeTour, currentStepIndex, currentStep } = get();
    if (!activeTour || !currentStep || !currentStep.skippable) return;

    // Update progress to mark step as skipped
    const currentUserId = 'current-user';
    const progressKey = `${currentUserId}-${activeTour.id}`;
    const { userProgress } = get();
    const progress = userProgress.get(progressKey);
    
    if (progress) {
      const updatedProgress = {
        ...progress,
        skippedSteps: [...progress.skippedSteps, currentStep.id],
        lastActiveAt: Date.now()
      };
      
      const newProgress = new Map(userProgress);
      newProgress.set(progressKey, updatedProgress);
      set({ userProgress: newProgress });
    }

    // Move to next step
    get().nextStep();
  },

  completeTour: async (rating, feedback) => {
    const { activeTour } = get();
    if (!activeTour) return;

    const currentUserId = 'current-user';
    const progressKey = `${currentUserId}-${activeTour.id}`;
    const { userProgress } = get();
    const progress = userProgress.get(progressKey);
    
    if (progress) {
      const updatedProgress = {
        ...progress,
        completedAt: Date.now(),
        rating,
        feedback,
        lastActiveAt: Date.now()
      };
      
      const newProgress = new Map(userProgress);
      newProgress.set(progressKey, updatedProgress);
      set({ 
        userProgress: newProgress,
        isCompleted: true,
        isPlaying: false
      });
    }

    get().trackEvent({
      type: 'tour_completed',
      tourId: activeTour.id,
      userId: currentUserId,
      metadata: { rating, feedback }
    });
  },

  restartTour: async () => {
    const { activeTour } = get();
    if (!activeTour) return;

    set({
      currentStepIndex: 0,
      currentStep: activeTour.steps[0],
      isPlaying: true,
      isPaused: false,
      isCompleted: false,
      highlightTarget: activeTour.steps[0]?.target
    });
  },

  // Progress management
  updateProgress: (userId, tourId, updates) => {
    const { userProgress } = get();
    const key = `${userId}-${tourId}`;
    const existing = userProgress.get(key);
    
    if (existing) {
      const newProgress = new Map(userProgress);
      newProgress.set(key, { ...existing, ...updates });
      set({ userProgress: newProgress });
    }
  },

  getProgress: (userId, tourId) => {
    return get().userProgress.get(`${userId}-${tourId}`) || null;
  },

  resetProgress: (userId, tourId) => {
    const { userProgress } = get();
    const newProgress = new Map(userProgress);
    newProgress.delete(`${userId}-${tourId}`);
    set({ userProgress: newProgress });
  },

  // Analytics actions
  trackEvent: (event) => {
    const newEvent: TourEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    set(state => ({ events: [...state.events, newEvent] }));
  },

  updateAnalytics: (tourId, analytics) => {
    const { analytics: currentAnalytics } = get();
    const existing = currentAnalytics.get(tourId);
    const newAnalytics = new Map(currentAnalytics);
    newAnalytics.set(tourId, { ...existing, ...analytics } as TourAnalytics);
    set({ analytics: newAnalytics });
  },

  getAnalytics: (tourId) => {
    return get().analytics.get(tourId) || null;
  },

  // Quick actions
  handleQuickAction: async (action, data) => {
    switch (action) {
      case 'duplicate_tour':
        const { tours } = get();
        const tour = tours.find(t => t.id === data.tourId);
        if (tour) {
          const duplicated = {
            ...tour,
            id: `tour_${Date.now()}`,
            name: `${tour.name} (Cópia)`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          get().addTour(duplicated);
        }
        break;
      case 'archive_tour':
        get().updateTour(data.tourId, { isActive: false });
        break;
      case 'publish_tour':
        get().updateTour(data.tourId, { isPublished: true });
        break;
    }
  },

  handleBulkAction: async (action, tourIds) => {
    switch (action) {
      case 'activate':
        tourIds.forEach(id => get().updateTour(id, { isActive: true }));
        break;
      case 'deactivate':
        tourIds.forEach(id => get().updateTour(id, { isActive: false }));
        break;
      case 'delete':
        tourIds.forEach(id => get().deleteTour(id));
        break;
    }
  },

  handleExportTour: async (tourId, format) => {
    const { tours } = get();
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;

    // Implementation would depend on format
  },

  handleImportTour: async (data, format) => {
    // Implementation would depend on format
  },

  // Advanced features
  handlePersonalization: async (userId, preferences) => {
    // Implement tour personalization based on user preferences
  },

  handleAdaptiveTour: async (tourId, userBehavior) => {
    // Implement adaptive tour logic based on user behavior
  },

  handleCollaborativeTour: async (tourId, participants) => {
    // Implement collaborative tour features
  },

  handleTourRecommendation: async (userId) => {
    const { tours } = get();
    // Simple recommendation logic - in real app would use ML
    return tours.filter(tour => tour.isActive && tour.isPublished).slice(0, 3);
  },

  // System operations
  refreshTours: async () => {
    set({ loading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, would fetch from API
      set({ loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar tours', loading: false });
    }
  },

  syncProgress: async () => {
    // Implement progress synchronization with backend
  },

  validateTour: async (tour) => {
    const errors: string[] = [];
    
    if (!tour.name) errors.push('Nome é obrigatório');
    if (!tour.steps.length) errors.push('Tour deve ter pelo menos um passo');
    if (tour.steps.some(step => !step.target)) errors.push('Todos os passos devem ter um target');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  optimizeTour: async (tourId) => {
    // Implement tour optimization based on analytics
  },

  // Utilities
  utilities: {
    formatDuration: (minutes) => {
      if (minutes < 60) return `${minutes}min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    },
    
    calculateProgress: (progress) => {
      const totalSteps = progress.completedSteps.length + progress.skippedSteps.length;
      return Math.round((progress.completedSteps.length / totalSteps) * 100) || 0;
    },
    
    getDifficultyColor: (difficulty) => {
      switch (difficulty) {
        case 'beginner': return 'text-green-600';
        case 'intermediate': return 'text-yellow-600';
        case 'advanced': return 'text-red-600';
        default: return 'text-gray-600';
      }
    },
    
    getCategoryIcon: (category) => {
      switch (category) {
        case 'onboarding': return '🚀';
        case 'feature': return '⭐';
        case 'advanced': return '🎯';
        case 'update': return '🔄';
        default: return '📚';
      }
    },
    
    getStepIcon: (step) => {
      switch (step.action) {
        case 'click': return '👆';
        case 'hover': return '👋';
        case 'input': return '⌨️';
        case 'scroll': return '📜';
        default: return '👁️';
      }
    },
    
    formatCompletionRate: (rate) => {
      return `${Math.round(rate)}%`;
    }
  },

  // Configuration
  config: {
    autoStart: false,
    showProgress: true,
    allowSkipping: true,
    enableAnalytics: true,
    theme: 'auto',
    language: 'pt-BR',
    animations: true,
    soundEffects: false,
    keyboardNavigation: true,
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false
    }
  },

  configHelpers: {
    updateTourConfig: (updates) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },
    
    resetConfig: () => {
      set({
        config: {
          autoStart: false,
          showProgress: true,
          allowSkipping: true,
          enableAnalytics: true,
          theme: 'auto',
          language: 'pt-BR',
          animations: true,
          soundEffects: false,
          keyboardNavigation: true,
          accessibility: {
            highContrast: false,
            largeText: false,
            screenReader: false
          }
        }
      });
    },
    
    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },
    
    importConfig: (configStr) => {
      try {
        const config = JSON.parse(configStr);
        set({ config });
      } catch (error) {
        console.error('Erro ao importar configuração:', error);
      }
    }
  },

  // Analytics helpers
  analyticsHelpers: {
    generateReport: async (tourId, period) => {
      const { analytics } = get();
      const tourAnalytics = analytics.get(tourId);
      if (!tourAnalytics) return null;
      
      return {
        tourId,
        period,
        completionRate: tourAnalytics.totalCompletions / tourAnalytics.totalStarts,
        averageTime: tourAnalytics.averageCompletionTime,
        dropOffPoints: tourAnalytics.dropOffPoints,
        userSatisfaction: tourAnalytics.userFeedback.reduce((acc, f) => acc + f.rating, 0) / tourAnalytics.userFeedback.length
      };
    },
    
    exportAnalytics: async (format) => {
      const { analytics } = get();
      // Implementation would depend on format
    },
    
    getInsights: async (tourId) => {
      const { analytics } = get();
      const tourAnalytics = analytics.get(tourId);
      if (!tourAnalytics) return null;
      
      return {
        mostProblematicStep: tourAnalytics.dropOffPoints.sort((a, b) => b.dropOffRate - a.dropOffRate)[0],
        averageRating: tourAnalytics.userFeedback.reduce((acc, f) => acc + f.rating, 0) / tourAnalytics.userFeedback.length,
        completionTrend: 'increasing', // Would calculate based on historical data
        recommendations: ['Simplify step 3', 'Add more visual cues']
      };
    },
    
    comparePerformance: async (tourIds) => {
      const { analytics } = get();
      return tourIds.map(id => {
        const tourAnalytics = analytics.get(id);
        return {
          tourId: id,
          completionRate: tourAnalytics ? tourAnalytics.totalCompletions / tourAnalytics.totalStarts : 0,
          averageTime: tourAnalytics?.averageCompletionTime || 0,
          userSatisfaction: tourAnalytics ? 
            tourAnalytics.userFeedback.reduce((acc, f) => acc + f.rating, 0) / tourAnalytics.userFeedback.length : 0
        };
      });
    }
  },

  // Debug helpers
  debugHelpers: {
    logTourState: () => {
      const state = get();
    },
    
    validateTourData: () => {
      const { tours } = get();
      return tours.every(tour => 
        tour.id && tour.name && tour.steps.length > 0
      );
    },
    
    simulateUserJourney: async (tourId) => {
      // Implementation would simulate user interactions
    },
    
    testTourPerformance: async (tourId) => {
      // Implementation would measure tour performance metrics
      return {
        loadTime: Math.random() * 1000,
        memoryUsage: Math.random() * 100,
        renderTime: Math.random() * 500
      };
    }
  }
}));

// Tour Manager Class
export class GuidedToursManager {
  private static instance: GuidedToursManager;
  
  static getInstance(): GuidedToursManager {
    if (!GuidedToursManager.instance) {
      GuidedToursManager.instance = new GuidedToursManager();
    }
    return GuidedToursManager.instance;
  }
  
  async initializeTours(): Promise<void> {
    // Initialize with demo tours
    const demoTours: Tour[] = [
      {
        id: 'onboarding-basic',
        name: 'Introdução ao Studio Treiax',
        description: 'Aprenda os conceitos básicos da plataforma',
        category: 'onboarding',
        difficulty: 'beginner',
        estimatedTime: 10,
        steps: [
          {
            id: 'welcome',
            title: 'Bem-vindo!',
            description: 'Vamos começar sua jornada no Studio Treiax',
            target: '#app',
            position: 'center',
            content: 'Esta é uma plataforma completa para criação e edição de vídeos.',
            skippable: false,
            required: true
          },
          {
            id: 'navigation',
            title: 'Navegação',
            description: 'Conheça a barra de navegação principal',
            target: '.navbar',
            position: 'bottom',
            content: 'Use esta barra para navegar entre as diferentes seções.',
            action: 'hover',
            skippable: true,
            required: false
          }
        ],
        tags: ['básico', 'introdução'],
        version: '1.0.0',
        isActive: true,
        isPublished: true,
        targetAudience: ['new-users'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completionRate: 85,
        averageRating: 4.5,
        totalCompletions: 150
      }
    ];
    
    useGuidedToursStore.getState().setTours(demoTours);
  }
}

// Utility functions
export const formatTourDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'onboarding': return '🚀';
    case 'feature': return '⭐';
    case 'advanced': return '🎯';
    case 'update': return '🔄';
    default: return '📚';
  }
};

export const calculateTourScore = (tour: Tour): number => {
  const completionWeight = 0.4;
  const ratingWeight = 0.3;
  const popularityWeight = 0.3;
  
  const completionScore = tour.completionRate / 100;
  const ratingScore = tour.averageRating / 5;
  const popularityScore = Math.min(tour.totalCompletions / 100, 1);
  
  return (completionScore * completionWeight) + 
         (ratingScore * ratingWeight) + 
         (popularityScore * popularityWeight);
};

export const getStepValidation = (step: TourStep): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!step.title) errors.push('Título é obrigatório');
  if (!step.target) errors.push('Target é obrigatório');
  if (!step.content) errors.push('Conteúdo é obrigatório');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};