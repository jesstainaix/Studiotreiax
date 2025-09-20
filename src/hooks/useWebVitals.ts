import { useState, useEffect, useCallback } from 'react';
import { 
  webVitalsTracker, 
  initWebVitals, 
  subscribeToWebVitals,
  type WebVitalsMetrics,
  type WebVitalsConfig 
} from '../utils/webVitalsTracker';

export interface WebVitalsState {
  metrics: WebVitalsMetrics;
  ratings: Record<string, 'good' | 'needs-improvement' | 'poor'>;
  isTracking: boolean;
  isInitialized: boolean;
}

export interface WebVitalsActions {
  startTracking: () => void;
  stopTracking: () => void;
  resetMetrics: () => void;
  exportData: () => string;
  updateConfig: (config: Partial<WebVitalsConfig>) => void;
}

export interface UseWebVitalsResult {
  state: WebVitalsState;
  actions: WebVitalsActions;
}

export function useWebVitals(config?: Partial<WebVitalsConfig>): UseWebVitalsResult {
  const [state, setState] = useState<WebVitalsState>({
    metrics: {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      timestamp: Date.now()
    },
    ratings: {},
    isTracking: false,
    isInitialized: false
  });

  const updateMetrics = useCallback((metrics: WebVitalsMetrics) => {
    setState(prevState => ({
      ...prevState,
      metrics,
      ratings: webVitalsTracker.getMetricRatings()
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!state.isInitialized) {
      initWebVitals(config);
      setState(prevState => ({ ...prevState, isInitialized: true }));
    }
    
    const unsubscribe = subscribeToWebVitals(updateMetrics);
    setState(prevState => ({ ...prevState, isTracking: true }));
    
    // Store unsubscribe function for cleanup
    return unsubscribe;
  }, [config, updateMetrics, state.isInitialized]);

  const stopTracking = useCallback(() => {
    setState(prevState => ({ ...prevState, isTracking: false }));
  }, []);

  const resetMetrics = useCallback(() => {
    webVitalsTracker.reset();
  }, []);

  const exportData = useCallback(() => {
    return webVitalsTracker.exportMetrics();
  }, []);

  const updateConfig = useCallback((newConfig: Partial<WebVitalsConfig>) => {
    webVitalsTracker.updateConfig(newConfig);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (state.isTracking && state.isInitialized) {
      unsubscribe = subscribeToWebVitals(updateMetrics);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state.isTracking, state.isInitialized, updateMetrics]);

  // Auto-start tracking on mount if config provided
  useEffect(() => {
    if (config && !state.isInitialized) {
      const unsubscribe = startTracking();
      return unsubscribe;
    }
  }, [config, startTracking, state.isInitialized]);

  return {
    state,
    actions: {
      startTracking,
      stopTracking,
      resetMetrics,
      exportData,
      updateConfig
    }
  };
}