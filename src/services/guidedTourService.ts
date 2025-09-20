import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  type: 'tooltip' | 'modal' | 'highlight' | 'overlay';
  content?: {
    text?: string;
    html?: string;
    image?: string;
    video?: string;
  };
  actions?: {
    primary?: {
      label: string;
      action: string;
    };
    secondary?: {
      label: string;
      action: string;
    };
  };
  validation?: {
    type: 'click' | 'input' | 'navigation' | 'custom';
    selector?: string;
    value?: string;
    customValidator?: () => boolean;
  };
  conditions?: {
    showIf?: () => boolean;
    skipIf?: () => boolean;
  };
  timing?: {
    delay?: number;
    duration?: number;
    autoAdvance?: boolean;
  };
  metadata?: {
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    prerequisites?: string[];
  };
}

export interface GuidedTour {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'workflow' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: TourStep[];
  prerequisites?: string[];
  tags: string[];
  isActive: boolean;
  isCompleted: boolean;
  progress: {
    currentStep: number;
    completedSteps: string[];
    startedAt?: Date;
    completedAt?: Date;
    timeSpent: number;
  };
  settings: {
    allowSkip: boolean;
    showProgress: boolean;
    autoStart: boolean;
    pauseOnBlur: boolean;
    highlightTarget: boolean;
  };
  analytics: {
    views: number;
    completions: number;
    averageTime: number;
    dropoffPoints: { stepId: string; count: number }[];
    userFeedback: { rating: number; comment: string; userId: string }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TourTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<TourStep, 'id'>[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
  createdAt: Date;
}

export interface UserProgress {
  userId: string;
  completedTours: string[];
  currentTour?: string;
  currentStep?: number;
  preferences: {
    autoStart: boolean;
    showHints: boolean;
    playSound: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
  statistics: {
    totalToursCompleted: number;
    totalTimeSpent: number;
    averageCompletionRate: number;
    favoriteCategories: string[];
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
  }[];
}

export interface TourEvent {
  id: string;
  type: 'start' | 'step_complete' | 'step_skip' | 'pause' | 'resume' | 'complete' | 'abandon';
  tourId: string;
  stepId?: string;
  userId: string;
  timestamp: Date;
  metadata?: {
    timeOnStep?: number;
    interactionCount?: number;
    errorCount?: number;
    customData?: Record<string, any>;
  };
}

export interface TourConfig {
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    fontSize: number;
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  overlay: {
    enabled: boolean;
    opacity: number;
    color: string;
  };
  positioning: {
    offset: number;
    arrow: boolean;
    responsive: boolean;
  };
  accessibility: {
    focusManagement: boolean;
    announceSteps: boolean;
    keyboardNavigation: boolean;
  };
  analytics: {
    enabled: boolean;
    trackInteractions: boolean;
    trackTiming: boolean;
  };
}

export interface TourStats {
  totalTours: number;
  activeTours: number;
  completedTours: number;
  totalUsers: number;
  activeUsers: number;
  averageCompletionRate: number;
  averageCompletionTime: number;
  popularCategories: { category: string; count: number }[];
  recentActivity: TourEvent[];
}

export interface TourMetrics {
  engagement: {
    startRate: number;
    completionRate: number;
    dropoffRate: number;
    averageStepsCompleted: number;
  };
  performance: {
    averageLoadTime: number;
    averageStepTime: number;
    errorRate: number;
    userSatisfaction: number;
  };
  usage: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    peakUsageHours: number[];
  };
}

// Zustand Store
interface GuidedTourState {
  // State
  tours: GuidedTour[];
  templates: TourTemplate[];
  userProgress: UserProgress | null;
  events: TourEvent[];
  config: TourConfig;
  stats: TourStats;
  metrics: TourMetrics;
  
  // Current tour state
  currentTour: GuidedTour | null;
  currentStep: TourStep | null;
  isPlaying: boolean;
  isPaused: boolean;
  showOverlay: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  sortBy: 'name' | 'difficulty' | 'estimatedTime' | 'popularity' | 'recent';
  
  // Actions
  setTours: (tours: GuidedTour[]) => void;
  addTour: (tour: Omit<GuidedTour, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTour: (id: string, updates: Partial<GuidedTour>) => void;
  deleteTour: (id: string) => void;
  
  // Tour control
  startTour: (tourId: string) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  skipStep: () => void;
  
  // Template management
  setTemplates: (templates: TourTemplate[]) => void;
  addTemplate: (template: Omit<TourTemplate, 'id' | 'createdAt'>) => void;
  createTourFromTemplate: (templateId: string) => void;
  
  // User progress
  setUserProgress: (progress: UserProgress) => void;
  updateUserProgress: (updates: Partial<UserProgress>) => void;
  markTourCompleted: (tourId: string) => void;
  
  // Events
  addEvent: (event: Omit<TourEvent, 'id' | 'timestamp'>) => void;
  getEventsByTour: (tourId: string) => TourEvent[];
  getEventsByUser: (userId: string) => TourEvent[];
  
  // Configuration
  updateConfig: (updates: Partial<TourConfig>) => void;
  resetConfig: () => void;
  
  // Analytics
  refreshStats: () => void;
  refreshMetrics: () => void;
  generateReport: (tourId?: string) => void;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedDifficulty: (difficulty: string) => void;
  setSortBy: (sortBy: string) => void;
  
  // System
  initialize: () => void;
  cleanup: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Default configuration
const defaultConfig: TourConfig = {
  theme: {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderRadius: 8,
    fontSize: 14
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out'
  },
  overlay: {
    enabled: true,
    opacity: 0.5,
    color: '#000000'
  },
  positioning: {
    offset: 10,
    arrow: true,
    responsive: true
  },
  accessibility: {
    focusManagement: true,
    announceSteps: true,
    keyboardNavigation: true
  },
  analytics: {
    enabled: true,
    trackInteractions: true,
    trackTiming: true
  }
};

// Create store
export const useGuidedTourStore = create<GuidedTourState>()(subscribeWithSelector((set, get) => ({
  // Initial state
  tours: [],
  templates: [],
  userProgress: null,
  events: [],
  config: defaultConfig,
  stats: {
    totalTours: 0,
    activeTours: 0,
    completedTours: 0,
    totalUsers: 0,
    activeUsers: 0,
    averageCompletionRate: 0,
    averageCompletionTime: 0,
    popularCategories: [],
    recentActivity: []
  },
  metrics: {
    engagement: {
      startRate: 0,
      completionRate: 0,
      dropoffRate: 0,
      averageStepsCompleted: 0
    },
    performance: {
      averageLoadTime: 0,
      averageStepTime: 0,
      errorRate: 0,
      userSatisfaction: 0
    },
    usage: {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      peakUsageHours: []
    }
  },
  
  // Current tour state
  currentTour: null,
  currentStep: null,
  isPlaying: false,
  isPaused: false,
  showOverlay: false,
  
  // UI state
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedDifficulty: 'all',
  sortBy: 'name',
  
  // Actions
  setTours: (tours) => set({ tours }),
  
  addTour: (tourData) => {
    const newTour: GuidedTour = {
      ...tourData,
      id: `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    set(state => ({ tours: [...state.tours, newTour] }));
  },
  
  updateTour: (id, updates) => {
    set(state => ({
      tours: state.tours.map(tour => 
        tour.id === id 
          ? { ...tour, ...updates, updatedAt: new Date() }
          : tour
      )
    }));
  },
  
  deleteTour: (id) => {
    set(state => ({
      tours: state.tours.filter(tour => tour.id !== id)
    }));
  },
  
  // Tour control
  startTour: (tourId) => {
    const tour = get().tours.find(t => t.id === tourId);
    if (tour) {
      const updatedTour = {
        ...tour,
        isActive: true,
        progress: {
          ...tour.progress,
          currentStep: 0,
          startedAt: new Date()
        }
      };
      
      set({
        currentTour: updatedTour,
        currentStep: tour.steps[0] || null,
        isPlaying: true,
        isPaused: false,
        showOverlay: true
      });
      
      // Update tour in list
      get().updateTour(tourId, updatedTour);
      
      // Add event
      get().addEvent({
        type: 'start',
        tourId,
        userId: 'current_user'
      });
    }
  },
  
  pauseTour: () => {
    set({ isPaused: true, isPlaying: false });
    const currentTour = get().currentTour;
    if (currentTour) {
      get().addEvent({
        type: 'pause',
        tourId: currentTour.id,
        stepId: get().currentStep?.id,
        userId: 'current_user'
      });
    }
  },
  
  resumeTour: () => {
    set({ isPaused: false, isPlaying: true });
    const currentTour = get().currentTour;
    if (currentTour) {
      get().addEvent({
        type: 'resume',
        tourId: currentTour.id,
        stepId: get().currentStep?.id,
        userId: 'current_user'
      });
    }
  },
  
  stopTour: () => {
    const currentTour = get().currentTour;
    if (currentTour) {
      get().addEvent({
        type: 'abandon',
        tourId: currentTour.id,
        stepId: get().currentStep?.id,
        userId: 'current_user'
      });
    }
    
    set({
      currentTour: null,
      currentStep: null,
      isPlaying: false,
      isPaused: false,
      showOverlay: false
    });
  },
  
  nextStep: () => {
    const { currentTour, currentStep } = get();
    if (!currentTour || !currentStep) return;
    
    const currentIndex = currentTour.steps.findIndex(s => s.id === currentStep.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < currentTour.steps.length) {
      const nextStep = currentTour.steps[nextIndex];
      set({ currentStep: nextStep });
      
      // Update progress
      const updatedProgress = {
        ...currentTour.progress,
        currentStep: nextIndex,
        completedSteps: [...currentTour.progress.completedSteps, currentStep.id]
      };
      
      get().updateTour(currentTour.id, { progress: updatedProgress });
      
      // Add event
      get().addEvent({
        type: 'step_complete',
        tourId: currentTour.id,
        stepId: currentStep.id,
        userId: 'current_user'
      });
    } else {
      // Tour completed
      get().markTourCompleted(currentTour.id);
    }
  },
  
  previousStep: () => {
    const { currentTour, currentStep } = get();
    if (!currentTour || !currentStep) return;
    
    const currentIndex = currentTour.steps.findIndex(s => s.id === currentStep.id);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevStep = currentTour.steps[prevIndex];
      set({ currentStep: prevStep });
      
      // Update progress
      const updatedProgress = {
        ...currentTour.progress,
        currentStep: prevIndex
      };
      
      get().updateTour(currentTour.id, { progress: updatedProgress });
    }
  },
  
  goToStep: (stepIndex) => {
    const { currentTour } = get();
    if (!currentTour || stepIndex < 0 || stepIndex >= currentTour.steps.length) return;
    
    const step = currentTour.steps[stepIndex];
    set({ currentStep: step });
    
    // Update progress
    const updatedProgress = {
      ...currentTour.progress,
      currentStep: stepIndex
    };
    
    get().updateTour(currentTour.id, { progress: updatedProgress });
  },
  
  skipStep: () => {
    const { currentTour, currentStep } = get();
    if (!currentTour || !currentStep) return;
    
    // Add event
    get().addEvent({
      type: 'step_skip',
      tourId: currentTour.id,
      stepId: currentStep.id,
      userId: 'current_user'
    });
    
    get().nextStep();
  },
  
  // Template management
  setTemplates: (templates) => set({ templates }),
  
  addTemplate: (templateData) => {
    const newTemplate: TourTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    set(state => ({ templates: [...state.templates, newTemplate] }));
  },
  
  createTourFromTemplate: (templateId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (template) {
      const newTour = {
        name: template.name,
        description: template.description,
        category: template.category as any,
        difficulty: 'beginner' as const,
        estimatedTime: template.steps.length * 2,
        steps: template.steps.map((step, index) => ({
          ...step,
          id: `step_${Date.now()}_${index}`
        })),
        tags: [],
        isActive: false,
        isCompleted: false,
        progress: {
          currentStep: 0,
          completedSteps: [],
          timeSpent: 0
        },
        settings: {
          allowSkip: true,
          showProgress: true,
          autoStart: false,
          pauseOnBlur: true,
          highlightTarget: true
        },
        analytics: {
          views: 0,
          completions: 0,
          averageTime: 0,
          dropoffPoints: [],
          userFeedback: []
        }
      };
      
      get().addTour(newTour);
    }
  },
  
  // User progress
  setUserProgress: (progress) => set({ userProgress: progress }),
  
  updateUserProgress: (updates) => {
    set(state => ({
      userProgress: state.userProgress 
        ? { ...state.userProgress, ...updates }
        : null
    }));
  },
  
  markTourCompleted: (tourId) => {
    const { currentTour } = get();
    
    // Update tour
    const updatedProgress = {
      ...currentTour!.progress,
      completedAt: new Date(),
      timeSpent: currentTour!.progress.timeSpent + (Date.now() - (currentTour!.progress.startedAt?.getTime() || Date.now()))
    };
    
    get().updateTour(tourId, {
      isCompleted: true,
      isActive: false,
      progress: updatedProgress
    });
    
    // Update user progress
    const userProgress = get().userProgress;
    if (userProgress) {
      get().updateUserProgress({
        completedTours: [...userProgress.completedTours, tourId],
        statistics: {
          ...userProgress.statistics,
          totalToursCompleted: userProgress.statistics.totalToursCompleted + 1,
          totalTimeSpent: userProgress.statistics.totalTimeSpent + updatedProgress.timeSpent
        }
      });
    }
    
    // Add event
    get().addEvent({
      type: 'complete',
      tourId,
      userId: 'current_user'
    });
    
    // Reset current tour
    set({
      currentTour: null,
      currentStep: null,
      isPlaying: false,
      isPaused: false,
      showOverlay: false
    });
  },
  
  // Events
  addEvent: (eventData) => {
    const newEvent: TourEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    set(state => ({ events: [...state.events, newEvent] }));
  },
  
  getEventsByTour: (tourId) => {
    return get().events.filter(event => event.tourId === tourId);
  },
  
  getEventsByUser: (userId) => {
    return get().events.filter(event => event.userId === userId);
  },
  
  // Configuration
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  // Analytics
  refreshStats: () => {
    const { tours, events } = get();
    
    const stats: TourStats = {
      totalTours: tours.length,
      activeTours: tours.filter(t => t.isActive).length,
      completedTours: tours.filter(t => t.isCompleted).length,
      totalUsers: new Set(events.map(e => e.userId)).size,
      activeUsers: new Set(events.filter(e => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return e.timestamp > dayAgo;
      }).map(e => e.userId)).size,
      averageCompletionRate: tours.length > 0 
        ? (tours.filter(t => t.isCompleted).length / tours.length) * 100 
        : 0,
      averageCompletionTime: tours.filter(t => t.isCompleted).reduce((sum, t) => 
        sum + t.progress.timeSpent, 0) / Math.max(1, tours.filter(t => t.isCompleted).length),
      popularCategories: Object.entries(
        tours.reduce((acc, tour) => {
          acc[tour.category] = (acc[tour.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([category, count]) => ({ category, count })),
      recentActivity: events.slice(-10)
    };
    
    set({ stats });
  },
  
  refreshMetrics: () => {
    const { tours, events } = get();
    
    const startEvents = events.filter(e => e.type === 'start');
    const completeEvents = events.filter(e => e.type === 'complete');
    
    const metrics: TourMetrics = {
      engagement: {
        startRate: tours.length > 0 ? (startEvents.length / tours.length) * 100 : 0,
        completionRate: startEvents.length > 0 ? (completeEvents.length / startEvents.length) * 100 : 0,
        dropoffRate: startEvents.length > 0 ? ((startEvents.length - completeEvents.length) / startEvents.length) * 100 : 0,
        averageStepsCompleted: tours.reduce((sum, t) => sum + t.progress.completedSteps.length, 0) / Math.max(1, tours.length)
      },
      performance: {
        averageLoadTime: 150, // Mock data
        averageStepTime: 30, // Mock data
        errorRate: 2.5, // Mock data
        userSatisfaction: 4.2 // Mock data
      },
      usage: {
        dailyActiveUsers: new Set(events.filter(e => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return e.timestamp > dayAgo;
        }).map(e => e.userId)).size,
        weeklyActiveUsers: new Set(events.filter(e => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return e.timestamp > weekAgo;
        }).map(e => e.userId)).size,
        monthlyActiveUsers: new Set(events.filter(e => {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return e.timestamp > monthAgo;
        }).map(e => e.userId)).size,
        peakUsageHours: [9, 10, 11, 14, 15, 16] // Mock data
      }
    };
    
    set({ metrics });
  },
  
  generateReport: (tourId) => {
    // Mock implementation
  },
  
  // Search and filter
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),
  setSortBy: (sortBy) => set({ sortBy: sortBy as any }),
  
  // System
  initialize: () => {
    set({ isLoading: true, error: null });
    
    // Mock initialization
    setTimeout(() => {
      get().refreshStats();
      get().refreshMetrics();
      set({ isLoading: false });
    }, 1000);
  },
  
  cleanup: () => {
    set({
      currentTour: null,
      currentStep: null,
      isPlaying: false,
      isPaused: false,
      showOverlay: false
    });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
})));

// Tour Manager Class
export class GuidedTourManager {
  private store = useGuidedTourStore;
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    this.store.getState().initialize();
  }
  
  // Public API methods
  createTour(tourData: Omit<GuidedTour, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.store.getState().addTour(tourData);
  }
  
  startTour(tourId: string) {
    return this.store.getState().startTour(tourId);
  }
  
  getCurrentTour() {
    return this.store.getState().currentTour;
  }
  
  getCurrentStep() {
    return this.store.getState().currentStep;
  }
  
  isPlaying() {
    return this.store.getState().isPlaying;
  }
  
  getStats() {
    return this.store.getState().stats;
  }
  
  getMetrics() {
    return this.store.getState().metrics;
  }
}

// Global instance
export const guidedTourManager = new GuidedTourManager();

// Utility functions
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner': return 'text-green-600';
    case 'intermediate': return 'text-yellow-600';
    case 'advanced': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'onboarding': return '🚀';
    case 'feature': return '⭐';
    case 'workflow': return '🔄';
    case 'advanced': return '🎯';
    default: return '📚';
  }
};

export const getProgressColor = (progress: number): string => {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 75) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

export const calculateTourHealth = (tour: GuidedTour): number => {
  const completionRate = tour.analytics.completions / Math.max(1, tour.analytics.views);
  const avgRating = tour.analytics.userFeedback.reduce((sum, f) => sum + f.rating, 0) / Math.max(1, tour.analytics.userFeedback.length);
  const dropoffRate = tour.analytics.dropoffPoints.reduce((sum, p) => sum + p.count, 0) / Math.max(1, tour.analytics.views);
  
  return Math.round(
    (completionRate * 40) + 
    (avgRating * 20) + 
    ((1 - dropoffRate) * 40)
  );
};

export const generateTourRecommendations = (tours: GuidedTour[]): string[] => {
  const recommendations: string[] = [];
  
  tours.forEach(tour => {
    const health = calculateTourHealth(tour);
    const completionRate = tour.analytics.completions / Math.max(1, tour.analytics.views);
    
    if (health < 50) {
      recommendations.push(`Tour "${tour.name}" needs improvement (health: ${health}%)`);
    }
    
    if (completionRate < 0.3) {
      recommendations.push(`Tour "${tour.name}" has low completion rate (${(completionRate * 100).toFixed(1)}%)`);
    }
    
    if (tour.analytics.dropoffPoints.length > 0) {
      const maxDropoff = Math.max(...tour.analytics.dropoffPoints.map(p => p.count));
      const dropoffStep = tour.analytics.dropoffPoints.find(p => p.count === maxDropoff);
      if (dropoffStep) {
        recommendations.push(`Tour "${tour.name}" has high dropoff at step ${dropoffStep.stepId}`);
      }
    }
  });
  
  return recommendations;
};

export default useGuidedTourStore;