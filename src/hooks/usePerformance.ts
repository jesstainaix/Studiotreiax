import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PerformanceMetrics,
  PerformanceHistory,
  HardwareInfo,
  OptimizationSettings,
  PerformanceRecommendation,
  Bottleneck,
  PerformanceAlert,
  PerformanceProfile,
  PerformanceState,
  PerformanceEvent
} from '../types/performance';
import { PerformanceEngine } from '../services/performanceEngine';
import { AutoOptimizer, OptimizationResult } from '../services/autoOptimizer';

interface UsePerformanceOptions {
  autoStart?: boolean;
  monitoringInterval?: number;
  enableAutoOptimization?: boolean;
  alertThresholds?: {
    cpu?: number;
    memory?: number;
    fps?: number;
  };
}

interface UsePerformanceReturn {
  // State
  isMonitoring: boolean;
  currentMetrics: PerformanceMetrics | null;
  history: PerformanceHistory;
  hardwareInfo: HardwareInfo | null;
  settings: OptimizationSettings;
  bottlenecks: Bottleneck[];
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlert[];
  profiles: PerformanceProfile[];
  activeProfile: PerformanceProfile | null;
  
  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  toggleMonitoring: () => void;
  
  // Optimization
  optimizeSettings: () => Promise<OptimizationResult>;
  applyRecommendation: (recommendation: PerformanceRecommendation) => void;
  applyProfile: (profileId: string) => void;
  
  // Settings
  updateSettings: (newSettings: Partial<OptimizationSettings>) => void;
  resetSettings: () => void;
  
  // Alerts
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Profiles
  createProfile: (profile: Omit<PerformanceProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProfile: (profileId: string, updates: Partial<PerformanceProfile>) => void;
  deleteProfile: (profileId: string) => void;
  
  // Utilities
  getPerformanceScore: () => number;
  exportMetrics: () => string;
  clearHistory: () => void;
}

const defaultSettings: OptimizationSettings = {
  autoOptimize: true,
  quality: 'high',
  performance: 'balanced',
  renderSettings: {
    resolution: '1920x1080',
    bitrate: 8000000,
    fps: 30,
    codec: 'h264'
  },
  cacheSettings: {
    enabled: true,
    maxSize: 200 * 1024 * 1024, // 200MB
    preloadFrames: 10
  },
  memorySettings: {
    maxUsage: 75,
    garbageCollection: true,
    bufferSize: 4 * 1024 * 1024 // 4MB
  }
};

export const usePerformance = (options: UsePerformanceOptions = {}): UsePerformanceReturn => {
  const {
    autoStart = false,
    monitoringInterval = 1000,
    enableAutoOptimization = true,
    alertThresholds = { cpu: 80, memory: 85, fps: 30 }
  } = options;

  // Refs for services
  const performanceEngine = useRef(PerformanceEngine.getInstance());
  const autoOptimizer = useRef(AutoOptimizer.getInstance());
  
  // State
  const [state, setState] = useState<PerformanceState>({
    isMonitoring: false,
    currentMetrics: null,
    history: {
      metrics: [],
      timeRange: { start: Date.now(), end: Date.now() },
      averages: { cpu: 0, memory: 0, fps: 0, renderTime: 0 },
      peaks: { maxCpu: 0, maxMemory: 0, minFps: 60, maxRenderTime: 0 }
    },
    hardwareInfo: null,
    settings: defaultSettings,
    bottlenecks: [],
    recommendations: [],
    alerts: [],
    profiles: [],
    activeProfile: null,
    autoOptimizationEnabled: enableAutoOptimization
  });

  // Auto-optimization timer
  const optimizationTimer = useRef<NodeJS.Timeout | null>(null);
  const lastOptimization = useRef<number>(0);

  // Initialize
  useEffect(() => {
    const initializePerformance = async () => {
      // Get hardware info
      const hardwareInfo = performanceEngine.current.getHardwareInfo();
      
      // Get profiles
      const profiles = autoOptimizer.current.getProfiles();
      const optimalProfile = hardwareInfo ? autoOptimizer.current.getOptimalProfile(hardwareInfo) : null;
      
      setState(prev => ({
        ...prev,
        hardwareInfo,
        profiles,
        activeProfile: optimalProfile?.id || null,
        settings: optimalProfile?.settings || defaultSettings
      }));
      
      // Auto-start monitoring if requested
      if (autoStart) {
        performanceEngine.current.startMonitoring();
        setState(prev => ({ ...prev, isMonitoring: true }));
      }
    };

    initializePerformance();
  }, [autoStart]);

  // Event handlers
  useEffect(() => {
    const handleMetricsUpdate = (event: PerformanceEvent) => {
      if (event.type === 'metrics_updated' && event.data.timestamp) {
        const metrics = event.data as PerformanceMetrics;
        const history = performanceEngine.current.getHistory();
        
        setState(prev => ({
          ...prev,
          currentMetrics: metrics,
          history
        }));
        
        // Check for alerts
        checkForAlerts(metrics);
        
        // Auto-optimization
        if (state.autoOptimizationEnabled && shouldAutoOptimize(metrics)) {
          performAutoOptimization();
        }
      }
    };

    const handleBottleneckDetected = (event: PerformanceEvent) => {
      if (event.type === 'bottleneck_detected') {
        const bottleneck = event.data as Bottleneck;
        setState(prev => ({
          ...prev,
          bottlenecks: [...prev.bottlenecks, bottleneck]
        }));
        
        // Create alert for bottleneck
        const alert: PerformanceAlert = {
          id: `bottleneck-${bottleneck.id}`,
          type: bottleneck.severity === 'critical' ? 'error' : 'warning',
          title: `${bottleneck.type.toUpperCase()} Bottleneck Detected`,
          message: bottleneck.description,
          timestamp: Date.now(),
          acknowledged: false,
          actions: bottleneck.suggestions.map(suggestion => ({
            label: suggestion,
            action: () => console.log('Applying suggestion:', suggestion)
          }))
        };
        
        setState(prev => ({
          ...prev,
          alerts: [...prev.alerts, alert]
        }));
      }
    };

    // Add event listeners
    performanceEngine.current.addEventListener('metrics_updated', handleMetricsUpdate);
    performanceEngine.current.addEventListener('bottleneck_detected', handleBottleneckDetected);

    return () => {
      performanceEngine.current.removeEventListener('metrics_updated', handleMetricsUpdate);
      performanceEngine.current.removeEventListener('bottleneck_detected', handleBottleneckDetected);
    };
  }, [state.autoOptimizationEnabled]);

  // Alert checking
  const checkForAlerts = useCallback((metrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];
    
    // CPU alert
    if (metrics.cpu.usage > alertThresholds.cpu!) {
      newAlerts.push({
        id: `cpu-alert-${Date.now()}`,
        type: 'warning',
        title: 'High CPU Usage',
        message: `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }
    
    // Memory alert
    if (metrics.memory.percentage > alertThresholds.memory!) {
      newAlerts.push({
        id: `memory-alert-${Date.now()}`,
        type: 'warning',
        title: 'High Memory Usage',
        message: `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }
    
    // FPS alert
    if (metrics.render.fps < alertThresholds.fps!) {
      newAlerts.push({
        id: `fps-alert-${Date.now()}`,
        type: 'error',
        title: 'Low FPS',
        message: `FPS dropped to ${metrics.render.fps}`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }
    
    if (newAlerts.length > 0) {
      setState(prev => ({
        ...prev,
        alerts: [...prev.alerts, ...newAlerts]
      }));
    }
  }, [alertThresholds]);

  // Auto-optimization logic
  const shouldAutoOptimize = useCallback((metrics: PerformanceMetrics): boolean => {
    const now = Date.now();
    const timeSinceLastOptimization = now - lastOptimization.current;
    
    // Don't optimize too frequently (minimum 30 seconds)
    if (timeSinceLastOptimization < 30000) return false;
    
    // Check if performance is degraded
    return (
      metrics.cpu.usage > 75 ||
      metrics.memory.percentage > 80 ||
      metrics.render.fps < 25
    );
  }, []);

  const performAutoOptimization = useCallback(async () => {
    try {
      const result = await autoOptimizer.current.optimize(state.settings);
      
      if (result.applied) {
        const newSettings = { ...state.settings, ...result.changes };
        setState(prev => ({
          ...prev,
          settings: newSettings
        }));
        
        // Create success alert
        const alert: PerformanceAlert = {
          id: `auto-opt-${Date.now()}`,
          type: 'info',
          title: 'Auto-Optimization Applied',
          message: `${result.reason}. Estimated improvement: ${result.estimatedImprovement}%`,
          timestamp: Date.now(),
          acknowledged: false
        };
        
        setState(prev => ({
          ...prev,
          alerts: [...prev.alerts, alert]
        }));
        
        lastOptimization.current = Date.now();
      }
    } catch (error) {
      console.error('Auto-optimization failed:', error);
    }
  }, [state.settings]);

  // Actions
  const startMonitoring = useCallback(() => {
    performanceEngine.current.startMonitoring();
    setState(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  const stopMonitoring = useCallback(() => {
    performanceEngine.current.stopMonitoring();
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  const toggleMonitoring = useCallback(() => {
    if (state.isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  }, [state.isMonitoring, startMonitoring, stopMonitoring]);

  const optimizeSettings = useCallback(async (): Promise<OptimizationResult> => {
    const result = await autoOptimizer.current.optimize(state.settings);
    
    if (result.applied) {
      const newSettings = { ...state.settings, ...result.changes };
      setState(prev => ({ ...prev, settings: newSettings }));
    }
    
    return result;
  }, [state.settings]);

  const applyRecommendation = useCallback((recommendation: PerformanceRecommendation) => {
    const newSettings = { ...state.settings, ...recommendation.settings };
    setState(prev => ({
      ...prev,
      settings: newSettings,
      recommendations: prev.recommendations.filter(r => r.id !== recommendation.id)
    }));
  }, [state.settings]);

  const applyProfile = useCallback((profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      setState(prev => ({
        ...prev,
        settings: profile.settings,
        activeProfile: profileId
      }));
    }
  }, [state.profiles]);

  const updateSettings = useCallback((newSettings: Partial<OptimizationSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setState(prev => ({ ...prev, settings: defaultSettings }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => ({ ...alert, acknowledged: true }))
    }));
  }, []);

  const createProfile = useCallback((profileData: Omit<PerformanceProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const profile: PerformanceProfile = {
      ...profileData,
      id: `profile-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    autoOptimizer.current.addProfile(profile);
    setState(prev => ({
      ...prev,
      profiles: [...prev.profiles, profile]
    }));
  }, []);

  const updateProfile = useCallback((profileId: string, updates: Partial<PerformanceProfile>) => {
    autoOptimizer.current.updateProfile(profileId, updates);
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => 
        p.id === profileId ? { ...p, ...updates, updatedAt: Date.now() } : p
      )
    }));
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    autoOptimizer.current.deleteProfile(profileId);
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== profileId),
      activeProfile: prev.activeProfile === profileId ? null : prev.activeProfile
    }));
  }, []);

  const getPerformanceScore = useCallback((): number => {
    if (!state.currentMetrics) return 0;
    
    const { cpu, memory, render } = state.currentMetrics;
    
    // Calculate score based on performance metrics (0-100)
    const cpuScore = Math.max(0, 100 - cpu.usage);
    const memoryScore = Math.max(0, 100 - memory.percentage);
    const fpsScore = Math.min(100, (render.fps / 60) * 100);
    
    return Math.round((cpuScore + memoryScore + fpsScore) / 3);
  }, [state.currentMetrics]);

  const exportMetrics = useCallback((): string => {
    const exportData = {
      timestamp: Date.now(),
      hardwareInfo: state.hardwareInfo,
      currentMetrics: state.currentMetrics,
      history: state.history,
      settings: state.settings,
      performanceScore: getPerformanceScore()
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [state, getPerformanceScore]);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: {
        metrics: [],
        timeRange: { start: Date.now(), end: Date.now() },
        averages: { cpu: 0, memory: 0, fps: 0, renderTime: 0 },
        peaks: { maxCpu: 0, maxMemory: 0, minFps: 60, maxRenderTime: 0 }
      }
    }));
  }, []);

  // Update recommendations periodically
  useEffect(() => {
    if (state.currentMetrics) {
      const recommendations = autoOptimizer.current.generateRecommendations(state.settings);
      setState(prev => ({ ...prev, recommendations }));
    }
  }, [state.currentMetrics, state.settings]);

  return {
    // State
    isMonitoring: state.isMonitoring,
    currentMetrics: state.currentMetrics,
    history: state.history,
    hardwareInfo: state.hardwareInfo,
    settings: state.settings,
    bottlenecks: state.bottlenecks,
    recommendations: state.recommendations,
    alerts: state.alerts.filter(alert => !alert.acknowledged),
    profiles: state.profiles,
    activeProfile: state.profiles.find(p => p.id === state.activeProfile) || null,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    
    // Optimization
    optimizeSettings,
    applyRecommendation,
    applyProfile,
    
    // Settings
    updateSettings,
    resetSettings,
    
    // Alerts
    dismissAlert,
    clearAllAlerts,
    
    // Profiles
    createProfile,
    updateProfile,
    deleteProfile,
    
    // Utilities
    getPerformanceScore,
    exportMetrics,
    clearHistory
  };
};

export default usePerformance;