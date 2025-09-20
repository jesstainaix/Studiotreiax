import { useState, useCallback, useRef, useEffect } from 'react';

export interface Effect {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface Transition {
  id: string;
  name: string;
  type: string;
  duration: number;
  direction?: string;
  easing?: string;
}

export interface PreviewState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  effects: Effect[];
  activeTransition?: Transition;
  previewMode: 'realtime' | 'scrubbing';
}

export interface UseEffectsPreviewReturn {
  previewState: PreviewState;
  applyEffect: (effect: Effect) => void;
  removeEffect: (effectId: string) => void;
  updateEffectParameter: (effectId: string, parameter: string, value: any) => void;
  previewTransition: (transition: Transition) => void;
  clearTransition: () => void;
  setPlayState: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  resetEffects: () => void;
  toggleEffect: (effectId: string) => void;
  previewEffect: (effect: Effect, duration?: number) => void;
  isPreviewingEffect: boolean;
}

const useEffectsPreview = (): UseEffectsPreviewReturn => {
  const [previewState, setPreviewState] = useState<PreviewState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    effects: [],
    activeTransition: undefined,
    previewMode: 'realtime'
  });
  
  const [isPreviewingEffect, setIsPreviewingEffect] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout>();
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // Apply effect to the current effects list
  const applyEffect = useCallback((effect: Effect) => {
    setPreviewState(prev => {
      const existingIndex = prev.effects.findIndex(e => e.id === effect.id);
      
      if (existingIndex >= 0) {
        // Update existing effect
        const newEffects = [...prev.effects];
        newEffects[existingIndex] = { ...effect, isActive: true };
        return { ...prev, effects: newEffects };
      } else {
        // Add new effect
        return {
          ...prev,
          effects: [...prev.effects, { ...effect, isActive: true }]
        };
      }
    });
  }, []);

  // Remove effect from the effects list
  const removeEffect = useCallback((effectId: string) => {
    setPreviewState(prev => ({
      ...prev,
      effects: prev.effects.filter(e => e.id !== effectId)
    }));
  }, []);

  // Update specific parameter of an effect
  const updateEffectParameter = useCallback((effectId: string, parameter: string, value: any) => {
    setPreviewState(prev => ({
      ...prev,
      effects: prev.effects.map(effect => 
        effect.id === effectId
          ? {
              ...effect,
              parameters: {
                ...effect.parameters,
                [parameter]: value
              }
            }
          : effect
      )
    }));
  }, []);

  // Toggle effect active state
  const toggleEffect = useCallback((effectId: string) => {
    setPreviewState(prev => ({
      ...prev,
      effects: prev.effects.map(effect => 
        effect.id === effectId
          ? { ...effect, isActive: !effect.isActive }
          : effect
      )
    }));
  }, []);

  // Preview transition temporarily
  const previewTransition = useCallback((transition: Transition) => {
    setPreviewState(prev => ({
      ...prev,
      activeTransition: transition
    }));
    
    // Clear transition after its duration
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      setPreviewState(prev => ({
        ...prev,
        activeTransition: undefined
      }));
    }, transition.duration + 500); // Add extra time for preview
  }, []);

  // Clear active transition
  const clearTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    setPreviewState(prev => ({
      ...prev,
      activeTransition: undefined
    }));
  }, []);

  // Preview effect temporarily (for testing)
  const previewEffect = useCallback((effect: Effect, duration: number = 3000) => {
    setIsPreviewingEffect(true);
    
    // Add effect temporarily
    const tempEffect = {
      ...effect,
      id: `preview-${effect.id}-${Date.now()}`,
      isActive: true
    };
    
    setPreviewState(prev => ({
      ...prev,
      effects: [...prev.effects, tempEffect]
    }));
    
    // Clear preview timeout if exists
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    // Remove effect after duration
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewState(prev => ({
        ...prev,
        effects: prev.effects.filter(e => e.id !== tempEffect.id)
      }));
      setIsPreviewingEffect(false);
    }, duration);
  }, []);

  // Set play state
  const setPlayState = useCallback((isPlaying: boolean) => {
    setPreviewState(prev => ({
      ...prev,
      isPlaying,
      previewMode: isPlaying ? 'realtime' : 'scrubbing'
    }));
  }, []);

  // Set current time
  const setCurrentTime = useCallback((time: number) => {
    setPreviewState(prev => ({
      ...prev,
      currentTime: time
    }));
  }, []);

  // Set duration
  const setDuration = useCallback((duration: number) => {
    setPreviewState(prev => ({
      ...prev,
      duration
    }));
  }, []);

  // Reset all effects
  const resetEffects = useCallback(() => {
    // Clear any pending timeouts
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    setPreviewState(prev => ({
      ...prev,
      effects: [],
      activeTransition: undefined
    }));
    
    setIsPreviewingEffect(false);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    previewState,
    applyEffect,
    removeEffect,
    updateEffectParameter,
    previewTransition,
    clearTransition,
    setPlayState,
    setCurrentTime,
    setDuration,
    resetEffects,
    toggleEffect,
    previewEffect,
    isPreviewingEffect
  };
};

export default useEffectsPreview;