import { useState, useCallback, useEffect } from 'react';
import { ParameterValue, EffectParameter, ParameterPreset } from '@/components/editor/ParameterControls';

export interface EffectParametersState {
  currentEffect?: EffectParameter;
  parameterValues: Record<string, number>;
  isPreviewEnabled: boolean;
  savedPresets: ParameterPreset[];
  history: ParameterHistoryEntry[];
  historyIndex: number;
}

export interface ParameterHistoryEntry {
  id: string;
  timestamp: number;
  effectId: string;
  values: Record<string, number>;
  action: 'change' | 'preset' | 'reset';
}

const EFFECTS_LIBRARY: EffectParameter[] = [
  {
    id: 'blur',
    name: 'Blur',
    description: 'Aplica desfoque à imagem',
    parameters: [
      { id: 'intensity', name: 'Intensidade', value: 0, min: 0, max: 100, step: 1, unit: '%', category: 'filter' },
      { id: 'radius', name: 'Raio', value: 5, min: 1, max: 50, step: 1, unit: 'px', category: 'filter' }
    ],
    presets: [
      { id: 'light', name: 'Leve', values: { intensity: 25, radius: 3 } },
      { id: 'medium', name: 'Médio', values: { intensity: 50, radius: 8 } },
      { id: 'heavy', name: 'Intenso', values: { intensity: 75, radius: 15 } }
    ]
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    description: 'Aumenta a nitidez da imagem',
    parameters: [
      { id: 'amount', name: 'Quantidade', value: 0, min: 0, max: 200, step: 5, unit: '%', category: 'filter' },
      { id: 'threshold', name: 'Limite', value: 0, min: 0, max: 100, step: 1, unit: '%', category: 'filter' }
    ],
    presets: [
      { id: 'subtle', name: 'Sutil', values: { amount: 50, threshold: 10 } },
      { id: 'moderate', name: 'Moderado', values: { amount: 100, threshold: 20 } },
      { id: 'strong', name: 'Forte', values: { amount: 150, threshold: 30 } }
    ]
  },
  {
    id: 'color-grading',
    name: 'Color Grading',
    description: 'Ajusta cores e tonalidade',
    parameters: [
      { id: 'temperature', name: 'Temperatura', value: 0, min: -100, max: 100, step: 1, unit: '', category: 'color' },
      { id: 'tint', name: 'Matiz', value: 0, min: -100, max: 100, step: 1, unit: '', category: 'color' },
      { id: 'highlights', name: 'Realces', value: 0, min: -100, max: 100, step: 1, unit: '', category: 'color' },
      { id: 'shadows', name: 'Sombras', value: 0, min: -100, max: 100, step: 1, unit: '', category: 'color' },
      { id: 'whites', name: 'Brancos', value: 0, min: -100, max: 100, step: 1, unit: '', category: 'color' },
      { id: 'blacks', name: 'Pretos', value: 0, min: -100, max: 100, step: 1, unit: '', category: 'color' }
    ],
    presets: [
      { id: 'warm', name: 'Quente', values: { temperature: 25, tint: 10, highlights: -20, shadows: 15, whites: 10, blacks: -10 } },
      { id: 'cool', name: 'Frio', values: { temperature: -25, tint: -10, highlights: 20, shadows: -15, whites: -10, blacks: 10 } },
      { id: 'cinematic', name: 'Cinematográfico', values: { temperature: 15, tint: 5, highlights: -30, shadows: 25, whites: 15, blacks: -20 } }
    ]
  },
  {
    id: 'brightness-contrast',
    name: 'Brilho e Contraste',
    description: 'Ajusta brilho e contraste',
    parameters: [
      { id: 'brightness', name: 'Brilho', value: 0, min: -100, max: 100, step: 1, unit: '%', category: 'color' },
      { id: 'contrast', name: 'Contraste', value: 0, min: -100, max: 100, step: 1, unit: '%', category: 'color' }
    ],
    presets: [
      { id: 'bright', name: 'Claro', values: { brightness: 20, contrast: 15 } },
      { id: 'dark', name: 'Escuro', values: { brightness: -20, contrast: 25 } },
      { id: 'high-contrast', name: 'Alto Contraste', values: { brightness: 0, contrast: 50 } }
    ]
  },
  {
    id: 'saturation',
    name: 'Saturação',
    description: 'Ajusta a intensidade das cores',
    parameters: [
      { id: 'saturation', name: 'Saturação', value: 0, min: -100, max: 100, step: 1, unit: '%', category: 'color' },
      { id: 'vibrance', name: 'Vibração', value: 0, min: -100, max: 100, step: 1, unit: '%', category: 'color' }
    ],
    presets: [
      { id: 'desaturated', name: 'Dessaturado', values: { saturation: -50, vibrance: -25 } },
      { id: 'natural', name: 'Natural', values: { saturation: 0, vibrance: 15 } },
      { id: 'vivid', name: 'Vívido', values: { saturation: 30, vibrance: 40 } }
    ]
  },
  {
    id: 'vignette',
    name: 'Vinheta',
    description: 'Adiciona escurecimento nas bordas',
    parameters: [
      { id: 'amount', name: 'Quantidade', value: 0, min: 0, max: 100, step: 1, unit: '%', category: 'filter' },
      { id: 'size', name: 'Tamanho', value: 50, min: 10, max: 90, step: 1, unit: '%', category: 'filter' },
      { id: 'feather', name: 'Suavização', value: 50, min: 0, max: 100, step: 1, unit: '%', category: 'filter' }
    ],
    presets: [
      { id: 'subtle', name: 'Sutil', values: { amount: 25, size: 70, feather: 75 } },
      { id: 'medium', name: 'Médio', values: { amount: 50, size: 60, feather: 60 } },
      { id: 'dramatic', name: 'Dramático', values: { amount: 75, size: 50, feather: 40 } }
    ]
  }
];

export const useEffectParameters = () => {
  const [state, setState] = useState<EffectParametersState>({
    parameterValues: {},
    isPreviewEnabled: true,
    savedPresets: [],
    history: [],
    historyIndex: -1
  });

  // Load saved presets from localStorage
  useEffect(() => {
    const savedPresetsJson = localStorage.getItem('effect-presets');
    if (savedPresetsJson) {
      try {
        const savedPresets = JSON.parse(savedPresetsJson);
        setState(prev => ({ ...prev, savedPresets }));
      } catch (error) {
        console.error('Error loading saved presets:', error);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = useCallback((presets: ParameterPreset[]) => {
    try {
      localStorage.setItem('effect-presets', JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving presets:', error);
    }
  }, []);

  // Add to history
  const addToHistory = useCallback((action: 'change' | 'preset' | 'reset', values: Record<string, number>) => {
    if (!state.currentEffect) return;

    const entry: ParameterHistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      effectId: state.currentEffect.id,
      values: { ...values },
      action
    };

    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(entry);
      
      // Keep only last 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, [state.currentEffect]);

  // Select effect
  const selectEffect = useCallback((effectId: string) => {
    const effect = EFFECTS_LIBRARY.find(e => e.id === effectId);
    if (effect) {
      const initialValues: Record<string, number> = {};
      effect.parameters.forEach(param => {
        initialValues[param.id] = param.value;
      });

      setState(prev => ({
        ...prev,
        currentEffect: effect,
        parameterValues: initialValues
      }));
    }
  }, []);

  // Change parameter value
  const changeParameter = useCallback((parameterId: string, value: number) => {
    setState(prev => {
      const newValues = {
        ...prev.parameterValues,
        [parameterId]: value
      };
      
      // Add to history with debounce
      setTimeout(() => {
        addToHistory('change', newValues);
      }, 500);

      return {
        ...prev,
        parameterValues: newValues
      };
    });
  }, [addToHistory]);

  // Apply preset
  const applyPreset = useCallback((preset: ParameterPreset) => {
    setState(prev => {
      const newValues = { ...prev.parameterValues, ...preset.values };
      addToHistory('preset', newValues);
      
      return {
        ...prev,
        parameterValues: newValues
      };
    });
  }, [addToHistory]);

  // Reset parameters
  const resetParameters = useCallback(() => {
    if (!state.currentEffect) return;

    const resetValues: Record<string, number> = {};
    state.currentEffect.parameters.forEach(param => {
      resetValues[param.id] = param.value;
    });

    setState(prev => {
      addToHistory('reset', resetValues);
      
      return {
        ...prev,
        parameterValues: resetValues
      };
    });
  }, [state.currentEffect, addToHistory]);

  // Save custom preset
  const savePreset = useCallback((name: string) => {
    if (!state.currentEffect || !name.trim()) return;

    const newPreset: ParameterPreset = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: `Preset personalizado para ${state.currentEffect.name}`,
      values: { ...state.parameterValues }
    };

    setState(prev => {
      const newSavedPresets = [...prev.savedPresets, newPreset];
      savePresetsToStorage(newSavedPresets);
      
      return {
        ...prev,
        savedPresets: newSavedPresets
      };
    });
  }, [state.currentEffect, state.parameterValues, savePresetsToStorage]);

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    setState(prev => {
      const newSavedPresets = prev.savedPresets.filter(p => p.id !== presetId);
      savePresetsToStorage(newSavedPresets);
      
      return {
        ...prev,
        savedPresets: newSavedPresets
      };
    });
  }, [savePresetsToStorage]);

  // Toggle preview
  const togglePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewEnabled: !prev.isPreviewEnabled
    }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (state.historyIndex > 0) {
      const prevEntry = state.history[state.historyIndex - 1];
      setState(prev => ({
        ...prev,
        parameterValues: { ...prevEntry.values },
        historyIndex: prev.historyIndex - 1
      }));
    }
  }, [state.historyIndex, state.history]);

  // Redo
  const redo = useCallback(() => {
    if (state.historyIndex < state.history.length - 1) {
      const nextEntry = state.history[state.historyIndex + 1];
      setState(prev => ({
        ...prev,
        parameterValues: { ...nextEntry.values },
        historyIndex: prev.historyIndex + 1
      }));
    }
  }, [state.historyIndex, state.history]);

  // Get available effects
  const getAvailableEffects = useCallback(() => {
    return EFFECTS_LIBRARY;
  }, []);

  // Get current effect with merged presets
  const getCurrentEffectWithPresets = useCallback(() => {
    if (!state.currentEffect) return undefined;

    const customPresets = state.savedPresets.filter(preset => 
      state.currentEffect && 
      Object.keys(preset.values).every(key => 
        state.currentEffect.parameters.some(param => param.id === key)
      )
    );

    return {
      ...state.currentEffect,
      presets: [...(state.currentEffect.presets || []), ...customPresets]
    };
  }, [state.currentEffect, state.savedPresets]);

  return {
    // State
    currentEffect: getCurrentEffectWithPresets(),
    parameterValues: state.parameterValues,
    isPreviewEnabled: state.isPreviewEnabled,
    savedPresets: state.savedPresets,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    
    // Actions
    selectEffect,
    changeParameter,
    applyPreset,
    resetParameters,
    savePreset,
    deletePreset,
    togglePreview,
    undo,
    redo,
    getAvailableEffects
  };
};

export default useEffectParameters;