import { useEffect, useMemo, useCallback } from 'react';
import { 
  useFocusModeStore, 
  FocusSession, 
  FocusBreak, 
  FocusSettings, 
  FocusGoal, 
  FocusTemplate,
  FocusStats,
  FocusAnalytics,
  FocusEvent,
  focusUtils
} from '../services/focusModeService';
import { useThrottle, useDebounce } from './useUtils';

// Main hook for focus mode management
export const useFocusMode = () => {
  const store = useFocusModeStore();
  
  // Auto-initialize on mount
  useEffect(() => {
    if (!store.lastUpdate) {
      store.initialize();
    }
  }, []);
  
  // Auto-refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (store.isActive) {
        store.refreshData();
      }
    }, 30000); // Refresh every 30 seconds during active session
    
    return () => clearInterval(interval);
  }, [store.isActive]);
  
  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    // Session management
    startSession: store.startSession,
    endSession: store.endSession,
    pauseSession: store.pauseSession,
    resumeSession: store.resumeSession,
    
    // Break management
    startBreak: store.startBreak,
    endBreak: store.endBreak,
    skipBreak: store.skipBreak,
    
    // Settings
    updateSettings: store.updateSettings,
    resetSettings: store.resetSettings,
    
    // Goals
    createGoal: store.createGoal,
    updateGoal: store.updateGoal,
    deleteGoal: store.deleteGoal,
    completeGoal: store.completeGoal,
    
    // Templates
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    applyTemplate: store.applyTemplate,
    
    // Analytics
    refreshAnalytics: store.refreshAnalytics,
    exportAnalytics: store.exportAnalytics,
    
    // Events
    addEvent: store.addEvent,
    clearEvents: store.clearEvents,
    
    // Utility
    setFilter: store.setFilter,
    setSorting: store.setSorting,
    refreshData: store.refreshData
  }), [store]);
  
  // Quick actions
  const quickActions = useMemo(() => ({
    startQuickSession: () => actions.startSession('pomodoro'),
    startDeepWork: () => actions.startSession('deep_work'),
    takeShortBreak: () => actions.startBreak('short'),
    takeLongBreak: () => actions.startBreak('long'),
    
    toggleSession: () => {
      if (store.isActive) {
        actions.endSession();
      } else {
        actions.startSession();
      }
    },
    
    addDistraction: () => {
      if (store.currentSession) {
        const updatedSession = {
          ...store.currentSession,
          distractions: store.currentSession.distractions + 1
        };
        // Update session in store
        useFocusModeStore.setState(state => ({
          currentSession: updatedSession,
          sessions: state.sessions.map(s => 
            s.id === updatedSession.id ? updatedSession : s
          )
        }));
        
        actions.addEvent({
          type: 'distraction',
          sessionId: store.currentSession.id,
          data: { count: updatedSession.distractions },
          metadata: { source: 'user_action' }
        });
      }
    }
  }), [store, actions]);
  
  // Advanced features
  const advancedFeatures = useMemo(() => ({
    // Batch operations
    batchOperations: {
      createMultipleGoals: async (goals: Omit<FocusGoal, 'id' | 'createdAt'>[]) => {
        for (const goal of goals) {
          await actions.createGoal(goal);
        }
      },
      
      deleteMultipleSessions: async (sessionIds: string[]) => {
        useFocusModeStore.setState(state => ({
          sessions: state.sessions.filter(s => !sessionIds.includes(s.id))
        }));
      },
      
      bulkUpdateSettings: async (settingsUpdates: Partial<FocusSettings>[]) => {
        const mergedSettings = settingsUpdates.reduce((acc, update) => ({ ...acc, ...update }), {});
        await actions.updateSettings(mergedSettings);
      }
    },
    
    // Smart recommendations
    smartRecommendations: {
      getRecommendedSessionType: (): FocusSession['type'] => {
        const { sessions, stats } = store;
        const recentSessions = sessions.slice(0, 10);
        
        if (stats.todayStats.sessions === 0) return 'pomodoro';
        if (stats.todayStats.productivity < 70) return 'pomodoro';
        if (recentSessions.every(s => s.type === 'pomodoro')) return 'deep_work';
        
        return 'pomodoro';
      },
      
      getRecommendedBreakDuration: (): number => {
        const { currentSession, stats } = store;
        if (!currentSession) return 5;
        
        const sessionDuration = Date.now() - currentSession.startTime;
        const productivity = currentSession.productivity;
        
        if (sessionDuration > 60 * 60 * 1000) return 15; // Long session = long break
        if (productivity < 60) return 10; // Low productivity = longer break
        
        return 5;
      },
      
      getOptimalSessionTime: (): number => {
        return focusUtils.calculations.getOptimalSessionTime(store.sessions);
      }
    },
    
    // Performance analysis
    performanceAnalysis: {
      analyzeProductivityTrends: () => {
        const { sessions } = store;
        const last30Days = sessions.filter(s => 
          s.startTime >= Date.now() - (30 * 24 * 60 * 60 * 1000)
        );
        
        const dailyStats = last30Days.reduce((acc, session) => {
          const date = new Date(session.startTime).toDateString();
          if (!acc[date]) {
            acc[date] = { sessions: 0, totalProductivity: 0, totalTime: 0 };
          }
          acc[date].sessions++;
          acc[date].totalProductivity += session.productivity;
          acc[date].totalTime += session.duration;
          return acc;
        }, {} as Record<string, { sessions: number; totalProductivity: number; totalTime: number }>);
        
        return Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          averageProductivity: stats.totalProductivity / stats.sessions,
          totalSessions: stats.sessions,
          totalTime: stats.totalTime
        }));
      },
      
      identifyDistractionPatterns: () => {
        const { events } = store;
        const distractionEvents = events.filter(e => e.type === 'distraction');
        
        const hourlyPatterns = distractionEvents.reduce((acc, event) => {
          const hour = new Date(event.timestamp).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
        
        return Object.entries(hourlyPatterns).map(([hour, count]) => ({
          hour: parseInt(hour),
          distractions: count
        }));
      },
      
      calculateFocusScore: (): number => {
        const { stats, sessions } = store;
        const recentSessions = sessions.slice(0, 10);
        
        if (recentSessions.length === 0) return 0;
        
        const avgProductivity = recentSessions.reduce((sum, s) => sum + s.productivity, 0) / recentSessions.length;
        const consistencyScore = stats.streakDays * 5;
        const completionRate = recentSessions.filter(s => s.endTime).length / recentSessions.length * 100;
        
        return Math.min(100, (avgProductivity * 0.5) + (consistencyScore * 0.3) + (completionRate * 0.2));
      }
    }
  }), [store, actions]);
  
  // System operations
  const systemOperations = useMemo(() => ({
    healthCheck: async () => {
      try {
        const { sessions, goals, templates } = store;
        return {
          status: 'healthy',
          sessionsCount: sessions.length,
          goalsCount: goals.length,
          templatesCount: templates.length,
          lastActivity: store.lastUpdate,
          memoryUsage: {
            sessions: sessions.length * 1024, // Rough estimate
            events: store.events.length * 512,
            total: (sessions.length * 1024) + (store.events.length * 512)
          }
        };
      } catch (error) {
        return {
          status: 'error',
          error: (error as Error).message
        };
      }
    },
    
    backup: async () => {
      try {
        const backup = {
          sessions: store.sessions,
          settings: store.settings,
          goals: store.goals,
          templates: store.templates,
          stats: store.stats,
          timestamp: Date.now()
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `focus-mode-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
    
    restore: async (file: File) => {
      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        
        // Validate backup structure
        if (!backup.sessions || !backup.settings) {
          throw new Error('Invalid backup file format');
        }
        
        // Restore data
        useFocusModeStore.setState({
          sessions: backup.sessions || [],
          settings: { ...store.settings, ...backup.settings },
          goals: backup.goals || [],
          templates: backup.templates || [],
          stats: backup.stats || store.stats,
          lastUpdate: Date.now()
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
    
    reset: async () => {
      try {
        useFocusModeStore.setState({
          sessions: [],
          goals: [],
          events: [],
          stats: {
            totalSessions: 0,
            totalFocusTime: 0,
            averageSessionLength: 0,
            productivityScore: 0,
            streakDays: 0,
            longestSession: 0,
            todayStats: { sessions: 0, focusTime: 0, breaks: 0, productivity: 0 },
            weeklyStats: { sessions: 0, focusTime: 0, productivity: 0, bestDay: '' },
            monthlyStats: { sessions: 0, focusTime: 0, productivity: 0, improvement: 0 }
          },
          lastUpdate: Date.now()
        });
        
        await actions.resetSettings();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  }), [store, actions]);
  
  // Utilities
  const utilities = useMemo(() => ({
    formatters: focusUtils.formatters,
    calculations: focusUtils.calculations,
    notifications: focusUtils.notifications,
    sounds: focusUtils.sounds,
    
    // Additional utilities
    exportData: async (format: 'json' | 'csv') => {
      try {
        if (format === 'json') {
          return await actions.exportAnalytics();
        } else {
          // Convert to CSV format
          const { sessions } = store;
          const csvHeaders = 'Date,Type,Duration,Productivity,Distractions,Breaks\n';
          const csvData = sessions.map(s => 
            `${new Date(s.startTime).toLocaleDateString()},${s.type},${s.duration},${s.productivity},${s.distractions},${s.breaks.length}`
          ).join('\n');
          
          return csvHeaders + csvData;
        }
      } catch (error) {
        throw new Error(`Export failed: ${(error as Error).message}`);
      }
    },
    
    generateReport: () => {
      const { sessions, stats, goals } = store;
      const completedGoals = goals.filter(g => g.completed);
      const activeGoals = goals.filter(g => !g.completed);
      
      return {
        summary: {
          totalSessions: stats.totalSessions,
          totalFocusTime: focusUtils.formatters.formatDuration(stats.totalFocusTime),
          averageProductivity: Math.round(stats.productivityScore),
          currentStreak: stats.streakDays
        },
        goals: {
          completed: completedGoals.length,
          active: activeGoals.length,
          completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0
        },
        trends: advancedFeatures.performanceAnalysis.analyzeProductivityTrends(),
        recommendations: {
          sessionType: advancedFeatures.smartRecommendations.getRecommendedSessionType(),
          optimalDuration: advancedFeatures.smartRecommendations.getOptimalSessionTime(),
          focusScore: advancedFeatures.performanceAnalysis.calculateFocusScore()
        }
      };
    }
  }), [store, actions, advancedFeatures]);
  
  // Configuration helpers
  const configHelpers = useMemo(() => ({
    presets: {
      pomodoro: () => actions.updateSettings({
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4
      }),
      
      deepWork: () => actions.updateSettings({
        workDuration: 90,
        shortBreakDuration: 15,
        longBreakDuration: 30,
        sessionsBeforeLongBreak: 2
      }),
      
      study: () => actions.updateSettings({
        workDuration: 45,
        shortBreakDuration: 10,
        longBreakDuration: 20,
        sessionsBeforeLongBreak: 3
      }),
      
      creative: () => actions.updateSettings({
        workDuration: 60,
        shortBreakDuration: 10,
        longBreakDuration: 25,
        sessionsBeforeLongBreak: 3
      })
    },
    
    validation: {
      validateSettings: (settings: Partial<FocusSettings>): string[] => {
        const errors: string[] = [];
        
        if (settings.workDuration && (settings.workDuration < 5 || settings.workDuration > 180)) {
          errors.push('Work duration must be between 5 and 180 minutes');
        }
        
        if (settings.shortBreakDuration && (settings.shortBreakDuration < 1 || settings.shortBreakDuration > 30)) {
          errors.push('Short break duration must be between 1 and 30 minutes');
        }
        
        if (settings.longBreakDuration && (settings.longBreakDuration < 5 || settings.longBreakDuration > 60)) {
          errors.push('Long break duration must be between 5 and 60 minutes');
        }
        
        return errors;
      }
    }
  }), [actions]);
  
  // Analytics helpers
  const analyticsHelpers = useMemo(() => ({
    generateInsights: () => {
      const { sessions, stats } = store;
      const insights: string[] = [];
      
      if (stats.productivityScore > 80) {
        insights.push('Your productivity is excellent! Keep up the great work.');
      } else if (stats.productivityScore < 60) {
        insights.push('Consider shorter sessions or longer breaks to improve focus.');
      }
      
      if (stats.streakDays > 7) {
        insights.push(`Amazing! You've maintained a ${stats.streakDays}-day focus streak.`);
      }
      
      const recentSessions = sessions.slice(0, 5);
      const avgDistractions = recentSessions.reduce((sum, s) => sum + s.distractions, 0) / recentSessions.length;
      
      if (avgDistractions > 3) {
        insights.push('Try enabling distraction blocking to improve focus.');
      }
      
      return insights;
    },
    
    getProductivityTrend: (): 'improving' | 'declining' | 'stable' => {
      const { sessions } = store;
      const recent = sessions.slice(0, 5);
      const older = sessions.slice(5, 10);
      
      if (recent.length === 0 || older.length === 0) return 'stable';
      
      const recentAvg = recent.reduce((sum, s) => sum + s.productivity, 0) / recent.length;
      const olderAvg = older.reduce((sum, s) => sum + s.productivity, 0) / older.length;
      
      const difference = recentAvg - olderAvg;
      
      if (difference > 5) return 'improving';
      if (difference < -5) return 'declining';
      return 'stable';
    }
  }), [store]);
  
  // Debug helpers
  const debugHelpers = useMemo(() => ({
    getDebugInfo: () => ({
      storeState: {
        sessionsCount: store.sessions.length,
        goalsCount: store.goals.length,
        templatesCount: store.templates.length,
        eventsCount: store.events.length,
        isActive: store.isActive,
        lastUpdate: store.lastUpdate
      },
      currentSession: store.currentSession,
      currentBreak: store.currentBreak,
      computed: store.computed,
      memoryEstimate: {
        sessions: `${(store.sessions.length * 1024 / 1024).toFixed(2)} MB`,
        events: `${(store.events.length * 512 / 1024).toFixed(2)} KB`,
        total: `${((store.sessions.length * 1024 + store.events.length * 512) / 1024).toFixed(2)} KB`
      }
    }),
    
    validateState: () => {
      const issues: string[] = [];
      
      if (store.sessions.some(s => !s.id || !s.startTime)) {
        issues.push('Some sessions have invalid data');
      }
      
      if (store.goals.some(g => !g.id || !g.title)) {
        issues.push('Some goals have invalid data');
      }
      
      if (store.events.length > 10000) {
        issues.push('Too many events stored (performance impact)');
      }
      
      return issues;
    }
  }), [store]);
  
  // Computed values
  const computed = useMemo(() => ({
    // Filter and sort sessions
    filteredSessions: store.sessions.filter(session => {
      if (store.filterType === 'all') return true;
      if (store.filterType === 'completed') return session.endTime;
      if (store.filterType === 'active') return !session.endTime;
      if (store.filterType === 'today') {
        return new Date(session.startTime).toDateString() === new Date().toDateString();
      }
      return session.type === store.filterType;
    }).sort((a, b) => {
      const aValue = a[store.sortBy as keyof FocusSession] as any;
      const bValue = b[store.sortBy as keyof FocusSession] as any;
      
      if (store.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }),
    
    // Filter goals
    activeGoals: store.goals.filter(g => !g.completed),
    completedGoals: store.goals.filter(g => g.completed),
    
    // Recent events
    recentEvents: store.events.slice(0, 50),
    
    // Popular templates
    popularTemplates: store.templates.sort((a, b) => b.popularity - a.popularity),
    
    // Session statistics
    sessionStats: {
      total: store.sessions.length,
      completed: store.sessions.filter(s => s.endTime).length,
      inProgress: store.sessions.filter(s => !s.endTime).length,
      averageDuration: store.stats.averageSessionLength,
      totalTime: store.stats.totalFocusTime
    },
    
    // Current status
    currentStatus: {
      isActive: store.isActive,
      sessionType: store.currentSession?.type || null,
      remainingTime: store.computed.remainingTime,
      progress: store.computed.sessionProgress,
      isInBreak: store.computed.isInBreak
    }
  }), [store]);
  
  return {
    // State
    ...store,
    
    // Actions
    ...actions,
    
    // Quick actions
    ...quickActions,
    
    // Advanced features
    ...advancedFeatures,
    
    // System operations
    ...systemOperations,
    
    // Utilities
    ...utilities,
    
    // Configuration helpers
    ...configHelpers,
    
    // Analytics helpers
    ...analyticsHelpers,
    
    // Debug helpers
    ...debugHelpers,
    
    // Computed values
    ...computed
  };
};

// Specialized hooks
export const useFocusStats = () => {
  const { stats, refreshAnalytics } = useFocusMode();
  
  useEffect(() => {
    refreshAnalytics();
  }, []);
  
  return {
    stats,
    refreshStats: refreshAnalytics
  };
};

export const useFocusSettings = () => {
  const { settings, updateSettings, resetSettings, configHelpers } = useFocusMode();
  
  const throttledUpdateSettings = useThrottle(updateSettings, 1000);
  
  return {
    settings,
    updateSettings: throttledUpdateSettings,
    resetSettings,
    presets: configHelpers.presets,
    validation: configHelpers.validation
  };
};

export const useFocusSession = () => {
  const { 
    currentSession, 
    currentBreak, 
    isActive, 
    computed,
    startSession, 
    endSession, 
    pauseSession, 
    resumeSession,
    startBreak,
    endBreak,
    skipBreak,
    addDistraction
  } = useFocusMode();
  
  return {
    session: currentSession,
    break: currentBreak,
    isActive,
    computed,
    actions: {
      start: startSession,
      end: endSession,
      pause: pauseSession,
      resume: resumeSession,
      startBreak,
      endBreak,
      skipBreak,
      addDistraction
    }
  };
};

export const useFocusGoals = () => {
  const { 
    goals, 
    createGoal, 
    updateGoal, 
    deleteGoal, 
    completeGoal,
    activeGoals,
    completedGoals
  } = useFocusMode();
  
  const debouncedUpdateGoal = useDebounce(updateGoal, 500);
  
  return {
    goals,
    activeGoals,
    completedGoals,
    actions: {
      create: createGoal,
      update: debouncedUpdateGoal,
      delete: deleteGoal,
      complete: completeGoal
    }
  };
};

export const useFocusTemplates = () => {
  const { 
    templates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    applyTemplate,
    popularTemplates
  } = useFocusMode();
  
  return {
    templates,
    popularTemplates,
    actions: {
      create: createTemplate,
      update: updateTemplate,
      delete: deleteTemplate,
      apply: applyTemplate
    }
  };
};

export const useFocusAnalytics = () => {
  const { 
    analytics, 
    stats,
    refreshAnalytics, 
    exportAnalytics,
    analyticsHelpers,
    advancedFeatures
  } = useFocusMode();
  
  return {
    analytics,
    stats,
    insights: analyticsHelpers.generateInsights(),
    trend: analyticsHelpers.getProductivityTrend(),
    analysis: advancedFeatures.performanceAnalysis,
    actions: {
      refresh: refreshAnalytics,
      export: exportAnalytics
    }
  };
};

// Utility hooks
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  );
  
  return throttledCallback as T;
};

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const debouncedCallback = useCallback(
    debounce(callback, delay),
    [callback, delay]
  );
  
  return debouncedCallback as T;
};

// Helper functions
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}