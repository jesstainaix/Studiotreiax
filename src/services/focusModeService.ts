import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface FocusSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration: number;
  type: 'pomodoro' | 'deep_work' | 'custom';
  breaks: FocusBreak[];
  productivity: number;
  distractions: number;
  goals: string[];
  achievements: string[];
  metadata: {
    project?: string;
    task?: string;
    notes?: string;
    mood?: 'focused' | 'distracted' | 'productive' | 'tired';
    environment?: 'quiet' | 'noisy' | 'music' | 'nature';
  };
}

export interface FocusBreak {
  id: string;
  startTime: number;
  endTime: number;
  type: 'short' | 'long' | 'meal';
  activity?: string;
}

export interface FocusSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dimBackground: boolean;
  hideDistractions: boolean;
  minimalistMode: boolean;
  zenMode: boolean;
  ambientSounds: {
    enabled: boolean;
    type: 'rain' | 'forest' | 'ocean' | 'cafe' | 'white_noise';
    volume: number;
  };
  blockedSites: string[];
  allowedApps: string[];
  customTheme: {
    background: string;
    text: string;
    accent: string;
    overlay: string;
  };
}

export interface FocusStats {
  totalSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
  productivityScore: number;
  streakDays: number;
  longestSession: number;
  todayStats: {
    sessions: number;
    focusTime: number;
    breaks: number;
    productivity: number;
  };
  weeklyStats: {
    sessions: number;
    focusTime: number;
    productivity: number;
    bestDay: string;
  };
  monthlyStats: {
    sessions: number;
    focusTime: number;
    productivity: number;
    improvement: number;
  };
}

export interface FocusGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: 'minutes' | 'sessions' | 'days';
  deadline?: number;
  completed: boolean;
  createdAt: number;
}

export interface FocusTemplate {
  id: string;
  name: string;
  description: string;
  settings: Partial<FocusSettings>;
  schedule: {
    workDuration: number;
    breakDuration: number;
    cycles: number;
  };
  category: 'work' | 'study' | 'creative' | 'meditation';
  popularity: number;
  createdAt: number;
}

export interface FocusAnalytics {
  productivityTrends: {
    date: string;
    score: number;
    sessions: number;
    focusTime: number;
  }[];
  distractionPatterns: {
    hour: number;
    count: number;
    type: string;
  }[];
  optimalTimes: {
    hour: number;
    productivity: number;
    energy: number;
  }[];
  sessionComparison: {
    type: string;
    averageProductivity: number;
    averageDuration: number;
    completionRate: number;
  }[];
}

export interface FocusEvent {
  id: string;
  type: 'session_start' | 'session_end' | 'break_start' | 'break_end' | 'distraction' | 'goal_achieved';
  timestamp: number;
  sessionId?: string;
  data: any;
  metadata: {
    source: string;
    severity?: 'low' | 'medium' | 'high';
    category?: string;
  };
}

// Store State
interface FocusModeState {
  // Core state
  isActive: boolean;
  currentSession: FocusSession | null;
  currentBreak: FocusBreak | null;
  sessions: FocusSession[];
  settings: FocusSettings;
  stats: FocusStats;
  goals: FocusGoal[];
  templates: FocusTemplate[];
  analytics: FocusAnalytics;
  events: FocusEvent[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  
  // Filters and sorting
  filterType: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Computed values
  computed: {
    isInSession: boolean;
    isInBreak: boolean;
    remainingTime: number;
    sessionProgress: number;
    todayProductivity: number;
    weeklyProgress: number;
    currentStreak: number;
    nextGoal: FocusGoal | null;
    recommendedTemplate: FocusTemplate | null;
    optimalSessionTime: number;
  };
}

// Store Actions
interface FocusModeActions {
  // Session management
  startSession: (type?: FocusSession['type'], template?: FocusTemplate) => Promise<void>;
  endSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  
  // Break management
  startBreak: (type: FocusBreak['type']) => Promise<void>;
  endBreak: () => Promise<void>;
  skipBreak: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<FocusSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Goals
  createGoal: (goal: Omit<FocusGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<FocusGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  
  // Templates
  createTemplate: (template: Omit<FocusTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<FocusTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  applyTemplate: (id: string) => Promise<void>;
  
  // Analytics
  refreshAnalytics: () => Promise<void>;
  exportAnalytics: () => Promise<any>;
  
  // Events
  addEvent: (event: Omit<FocusEvent, 'id' | 'timestamp'>) => Promise<void>;
  clearEvents: () => Promise<void>;
  
  // Utility
  setFilter: (filter: string) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refreshData: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Default values
const defaultSettings: FocusSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartSessions: false,
  soundEnabled: true,
  notificationsEnabled: true,
  dimBackground: true,
  hideDistractions: true,
  minimalistMode: false,
  zenMode: false,
  ambientSounds: {
    enabled: false,
    type: 'rain',
    volume: 50
  },
  blockedSites: [],
  allowedApps: [],
  customTheme: {
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#3b82f6',
    overlay: 'rgba(0, 0, 0, 0.8)'
  }
};

const defaultStats: FocusStats = {
  totalSessions: 0,
  totalFocusTime: 0,
  averageSessionLength: 0,
  productivityScore: 0,
  streakDays: 0,
  longestSession: 0,
  todayStats: {
    sessions: 0,
    focusTime: 0,
    breaks: 0,
    productivity: 0
  },
  weeklyStats: {
    sessions: 0,
    focusTime: 0,
    productivity: 0,
    bestDay: ''
  },
  monthlyStats: {
    sessions: 0,
    focusTime: 0,
    productivity: 0,
    improvement: 0
  }
};

// Create store
export const useFocusModeStore = create<FocusModeState & FocusModeActions>()
  (subscribeWithSelector((set, get) => ({
    // Initial state
    isActive: false,
    currentSession: null,
    currentBreak: null,
    sessions: [],
    settings: defaultSettings,
    stats: defaultStats,
    goals: [],
    templates: [],
    analytics: {
      productivityTrends: [],
      distractionPatterns: [],
      optimalTimes: [],
      sessionComparison: []
    },
    events: [],
    
    isLoading: false,
    error: null,
    lastUpdate: null,
    
    filterType: 'all',
    sortBy: 'startTime',
    sortOrder: 'desc',
    
    computed: {
      isInSession: false,
      isInBreak: false,
      remainingTime: 0,
      sessionProgress: 0,
      todayProductivity: 0,
      weeklyProgress: 0,
      currentStreak: 0,
      nextGoal: null,
      recommendedTemplate: null,
      optimalSessionTime: 25
    },
    
    // Actions
    startSession: async (type = 'pomodoro', template) => {
      try {
        set({ isLoading: true, error: null });
        
        const settings = template ? { ...get().settings, ...template.settings } : get().settings;
        const duration = settings.workDuration * 60 * 1000; // Convert to milliseconds
        
        const session: FocusSession = {
          id: `session_${Date.now()}`,
          name: template?.name || `${type} Session`,
          startTime: Date.now(),
          duration,
          type,
          breaks: [],
          productivity: 0,
          distractions: 0,
          goals: [],
          achievements: [],
          metadata: {
            project: '',
            task: '',
            notes: '',
            mood: 'focused',
            environment: 'quiet'
          }
        };
        
        set(state => ({
          isActive: true,
          currentSession: session,
          sessions: [session, ...state.sessions],
          isLoading: false,
          lastUpdate: Date.now()
        }));
        
        // Add event
        await get().addEvent({
          type: 'session_start',
          sessionId: session.id,
          data: { type, template: template?.name },
          metadata: { source: 'focus_mode' }
        });
        
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },
    
    endSession: async () => {
      try {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const endTime = Date.now();
        const actualDuration = endTime - currentSession.startTime;
        const productivity = Math.min(100, Math.max(0, 
          100 - (currentSession.distractions * 10)
        ));
        
        const updatedSession: FocusSession = {
          ...currentSession,
          endTime,
          duration: actualDuration,
          productivity
        };
        
        set(state => ({
          isActive: false,
          currentSession: null,
          sessions: state.sessions.map(s => 
            s.id === currentSession.id ? updatedSession : s
          ),
          lastUpdate: Date.now()
        }));
        
        // Update stats
        await get().refreshAnalytics();
        
        // Add event
        await get().addEvent({
          type: 'session_end',
          sessionId: currentSession.id,
          data: { duration: actualDuration, productivity },
          metadata: { source: 'focus_mode' }
        });
        
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    pauseSession: async () => {
      // Implementation for pausing session
      set({ isActive: false });
    },
    
    resumeSession: async () => {
      // Implementation for resuming session
      set({ isActive: true });
    },
    
    startBreak: async (type) => {
      try {
        const { currentSession, settings } = get();
        if (!currentSession) return;
        
        const duration = type === 'short' ? settings.shortBreakDuration :
                        type === 'long' ? settings.longBreakDuration : 30;
        
        const breakSession: FocusBreak = {
          id: `break_${Date.now()}`,
          startTime: Date.now(),
          endTime: Date.now() + (duration * 60 * 1000),
          type
        };
        
        set(state => ({
          currentBreak: breakSession,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            breaks: [...state.currentSession.breaks, breakSession]
          } : null,
          lastUpdate: Date.now()
        }));
        
        // Add event
        await get().addEvent({
          type: 'break_start',
          sessionId: currentSession.id,
          data: { type, duration },
          metadata: { source: 'focus_mode' }
        });
        
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    endBreak: async () => {
      try {
        const { currentBreak, currentSession } = get();
        if (!currentBreak || !currentSession) return;
        
        const updatedBreak: FocusBreak = {
          ...currentBreak,
          endTime: Date.now()
        };
        
        set(state => ({
          currentBreak: null,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            breaks: state.currentSession.breaks.map(b => 
              b.id === currentBreak.id ? updatedBreak : b
            )
          } : null,
          lastUpdate: Date.now()
        }));
        
        // Add event
        await get().addEvent({
          type: 'break_end',
          sessionId: currentSession.id,
          data: { duration: updatedBreak.endTime - updatedBreak.startTime },
          metadata: { source: 'focus_mode' }
        });
        
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    skipBreak: async () => {
      set({ currentBreak: null });
    },
    
    updateSettings: async (newSettings) => {
      try {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    resetSettings: async () => {
      set({ settings: defaultSettings, lastUpdate: Date.now() });
    },
    
    createGoal: async (goalData) => {
      try {
        const goal: FocusGoal = {
          ...goalData,
          id: `goal_${Date.now()}`,
          createdAt: Date.now()
        };
        
        set(state => ({
          goals: [goal, ...state.goals],
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    updateGoal: async (id, updates) => {
      try {
        set(state => ({
          goals: state.goals.map(goal => 
            goal.id === id ? { ...goal, ...updates } : goal
          ),
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    deleteGoal: async (id) => {
      try {
        set(state => ({
          goals: state.goals.filter(goal => goal.id !== id),
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    completeGoal: async (id) => {
      try {
        await get().updateGoal(id, { completed: true });
        
        // Add achievement event
        await get().addEvent({
          type: 'goal_achieved',
          data: { goalId: id },
          metadata: { source: 'focus_mode', severity: 'high' }
        });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    createTemplate: async (templateData) => {
      try {
        const template: FocusTemplate = {
          ...templateData,
          id: `template_${Date.now()}`,
          createdAt: Date.now()
        };
        
        set(state => ({
          templates: [template, ...state.templates],
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    updateTemplate: async (id, updates) => {
      try {
        set(state => ({
          templates: state.templates.map(template => 
            template.id === id ? { ...template, ...updates } : template
          ),
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    deleteTemplate: async (id) => {
      try {
        set(state => ({
          templates: state.templates.filter(template => template.id !== id),
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    applyTemplate: async (id) => {
      try {
        const template = get().templates.find(t => t.id === id);
        if (template) {
          await get().updateSettings(template.settings);
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    refreshAnalytics: async () => {
      try {
        set({ isLoading: true });
        
        const { sessions } = get();
        const now = Date.now();
        const today = new Date().toDateString();
        const thisWeek = now - (7 * 24 * 60 * 60 * 1000);
        const thisMonth = now - (30 * 24 * 60 * 60 * 1000);
        
        // Calculate stats
        const completedSessions = sessions.filter(s => s.endTime);
        const todaySessions = completedSessions.filter(s => 
          new Date(s.startTime).toDateString() === today
        );
        const weekSessions = completedSessions.filter(s => s.startTime >= thisWeek);
        const monthSessions = completedSessions.filter(s => s.startTime >= thisMonth);
        
        const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);
        const averageProductivity = completedSessions.length > 0 ?
          completedSessions.reduce((sum, s) => sum + s.productivity, 0) / completedSessions.length : 0;
        
        const stats: FocusStats = {
          totalSessions: completedSessions.length,
          totalFocusTime,
          averageSessionLength: completedSessions.length > 0 ? totalFocusTime / completedSessions.length : 0,
          productivityScore: averageProductivity,
          streakDays: 0, // Calculate streak
          longestSession: Math.max(...completedSessions.map(s => s.duration), 0),
          todayStats: {
            sessions: todaySessions.length,
            focusTime: todaySessions.reduce((sum, s) => sum + s.duration, 0),
            breaks: todaySessions.reduce((sum, s) => sum + s.breaks.length, 0),
            productivity: todaySessions.length > 0 ?
              todaySessions.reduce((sum, s) => sum + s.productivity, 0) / todaySessions.length : 0
          },
          weeklyStats: {
            sessions: weekSessions.length,
            focusTime: weekSessions.reduce((sum, s) => sum + s.duration, 0),
            productivity: weekSessions.length > 0 ?
              weekSessions.reduce((sum, s) => sum + s.productivity, 0) / weekSessions.length : 0,
            bestDay: ''
          },
          monthlyStats: {
            sessions: monthSessions.length,
            focusTime: monthSessions.reduce((sum, s) => sum + s.duration, 0),
            productivity: monthSessions.length > 0 ?
              monthSessions.reduce((sum, s) => sum + s.productivity, 0) / monthSessions.length : 0,
            improvement: 0
          }
        };
        
        set({ stats, isLoading: false, lastUpdate: Date.now() });
        
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },
    
    exportAnalytics: async () => {
      try {
        const { sessions, stats, analytics } = get();
        return {
          sessions,
          stats,
          analytics,
          exportedAt: Date.now()
        };
      } catch (error) {
        set({ error: (error as Error).message });
        return null;
      }
    },
    
    addEvent: async (eventData) => {
      try {
        const event: FocusEvent = {
          ...eventData,
          id: `event_${Date.now()}`,
          timestamp: Date.now()
        };
        
        set(state => ({
          events: [event, ...state.events].slice(0, 1000), // Keep last 1000 events
          lastUpdate: Date.now()
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    clearEvents: async () => {
      set({ events: [], lastUpdate: Date.now() });
    },
    
    setFilter: (filter) => {
      set({ filterType: filter });
    },
    
    setSorting: (sortBy, sortOrder) => {
      set({ sortBy, sortOrder });
    },
    
    refreshData: async () => {
      try {
        set({ isLoading: true });
        await get().refreshAnalytics();
        set({ isLoading: false, lastUpdate: Date.now() });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },
    
    initialize: async () => {
      try {
        set({ isLoading: true });
        
        // Load default templates
        const defaultTemplates: FocusTemplate[] = [
          {
            id: 'pomodoro_classic',
            name: 'Classic Pomodoro',
            description: 'Traditional 25-minute work sessions with 5-minute breaks',
            settings: {
              workDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              sessionsBeforeLongBreak: 4
            },
            schedule: {
              workDuration: 25,
              breakDuration: 5,
              cycles: 4
            },
            category: 'work',
            popularity: 95,
            createdAt: Date.now()
          },
          {
            id: 'deep_work',
            name: 'Deep Work',
            description: 'Extended 90-minute sessions for deep concentration',
            settings: {
              workDuration: 90,
              shortBreakDuration: 15,
              longBreakDuration: 30,
              sessionsBeforeLongBreak: 2
            },
            schedule: {
              workDuration: 90,
              breakDuration: 15,
              cycles: 2
            },
            category: 'work',
            popularity: 80,
            createdAt: Date.now()
          },
          {
            id: 'study_session',
            name: 'Study Session',
            description: 'Optimized for learning with 45-minute sessions',
            settings: {
              workDuration: 45,
              shortBreakDuration: 10,
              longBreakDuration: 20,
              sessionsBeforeLongBreak: 3
            },
            schedule: {
              workDuration: 45,
              breakDuration: 10,
              cycles: 3
            },
            category: 'study',
            popularity: 75,
            createdAt: Date.now()
          }
        ];
        
        set({ 
          templates: defaultTemplates,
          isLoading: false, 
          lastUpdate: Date.now() 
        });
        
        await get().refreshAnalytics();
        
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    }
  })));

// Focus Mode Manager Class
export class FocusModeManager {
  private store = useFocusModeStore;
  private timer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.initialize();
  }
  
  async initialize() {
    await this.store.getState().initialize();
    this.startTimer();
  }
  
  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      const state = this.store.getState();
      if (state.currentSession || state.currentBreak) {
        this.updateComputedValues();
      }
    }, 1000);
  }
  
  private updateComputedValues() {
    const state = this.store.getState();
    const now = Date.now();
    
    let computed = { ...state.computed };
    
    if (state.currentSession) {
      const elapsed = now - state.currentSession.startTime;
      const remaining = Math.max(0, state.currentSession.duration - elapsed);
      const progress = Math.min(100, (elapsed / state.currentSession.duration) * 100);
      
      computed = {
        ...computed,
        isInSession: true,
        isInBreak: false,
        remainingTime: remaining,
        sessionProgress: progress
      };
    } else if (state.currentBreak) {
      const elapsed = now - state.currentBreak.startTime;
      const duration = state.currentBreak.endTime - state.currentBreak.startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      computed = {
        ...computed,
        isInSession: false,
        isInBreak: true,
        remainingTime: remaining,
        sessionProgress: 0
      };
    } else {
      computed = {
        ...computed,
        isInSession: false,
        isInBreak: false,
        remainingTime: 0,
        sessionProgress: 0
      };
    }
    
    // Update other computed values
    computed.todayProductivity = state.stats.todayStats.productivity;
    computed.currentStreak = state.stats.streakDays;
    computed.nextGoal = state.goals.find(g => !g.completed) || null;
    computed.recommendedTemplate = state.templates.sort((a, b) => b.popularity - a.popularity)[0] || null;
    
    this.store.setState({ computed });
  }
  
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Global instance
export const focusModeManager = new FocusModeManager();

// Utility functions
export const focusUtils = {
  formatters: {
    formatDuration: (ms: number): string => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    
    formatTime: (timestamp: number): string => {
      return new Date(timestamp).toLocaleTimeString();
    },
    
    formatDate: (timestamp: number): string => {
      return new Date(timestamp).toLocaleDateString();
    },
    
    formatProductivity: (score: number): string => {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Very Good';
      if (score >= 70) return 'Good';
      if (score >= 60) return 'Fair';
      return 'Needs Improvement';
    }
  },
  
  calculations: {
    calculateProductivity: (session: FocusSession): number => {
      const baseScore = 100;
      const distractionPenalty = session.distractions * 5;
      const durationBonus = session.duration > (25 * 60 * 1000) ? 10 : 0;
      
      return Math.max(0, Math.min(100, baseScore - distractionPenalty + durationBonus));
    },
    
    calculateStreak: (sessions: FocusSession[]): number => {
      const today = new Date().toDateString();
      let streak = 0;
      let currentDate = new Date();
      
      while (true) {
        const dateStr = currentDate.toDateString();
        const hasSessions = sessions.some(s => 
          new Date(s.startTime).toDateString() === dateStr && s.endTime
        );
        
        if (hasSessions) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    },
    
    getOptimalSessionTime: (sessions: FocusSession[]): number => {
      if (sessions.length === 0) return 25;
      
      const completedSessions = sessions.filter(s => s.endTime && s.productivity >= 70);
      if (completedSessions.length === 0) return 25;
      
      const averageDuration = completedSessions.reduce((sum, s) => 
        sum + s.duration, 0
      ) / completedSessions.length;
      
      return Math.round(averageDuration / (60 * 1000)); // Convert to minutes
    }
  },
  
  notifications: {
    requestPermission: async (): Promise<boolean> => {
      if (!('Notification' in window)) return false;
      
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    },
    
    showNotification: (title: string, options?: NotificationOptions): void => {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
      }
    }
  },
  
  sounds: {
    playSound: (type: 'start' | 'end' | 'break'): void => {
      // Implementation for playing sounds
      const audio = new Audio(`/sounds/focus_${type}.mp3`);
      audio.play().catch(() => {});
    }
  }
};