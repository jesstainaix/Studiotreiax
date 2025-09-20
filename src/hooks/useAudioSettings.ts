import { useState, useCallback, useEffect, useRef } from 'react';

interface AudioSettings {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    // Equalizer settings
    equalizer: {
      enabled: boolean;
      bands: Array<{
        frequency: number;
        gain: number;
        q: number;
      }>;
      preamp: number;
    };
    
    // Compressor settings
    compressor: {
      enabled: boolean;
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
      knee: number;
      makeupGain: number;
    };
    
    // Noise reduction settings
    noiseReduction: {
      enabled: boolean;
      strength: number;
      sensitivity: number;
      preserveVoice: boolean;
    };
    
    // Voice enhancement settings
    voiceEnhancement: {
      enabled: boolean;
      clarity: number;
      warmth: number;
      presence: number;
      deEsser: number;
    };
    
    // Reverb settings
    reverb: {
      enabled: boolean;
      roomSize: number;
      damping: number;
      wetLevel: number;
      dryLevel: number;
      preDelay: number;
    };
    
    // Master settings
    master: {
      volume: number;
      pan: number;
      mute: boolean;
      solo: boolean;
    };
    
    // Processing settings
    processing: {
      sampleRate: number;
      bufferSize: number;
      latency: 'interactive' | 'balanced' | 'playback';
      enableWebWorker: boolean;
    };
  };
}

interface AudioPreset {
  id: string;
  name: string;
  category: 'voice' | 'music' | 'podcast' | 'broadcast' | 'custom';
  description: string;
  settings: Partial<AudioSettings['settings']>;
  isDefault: boolean;
  tags: string[];
}

const DEFAULT_SETTINGS: AudioSettings['settings'] = {
  equalizer: {
    enabled: false,
    bands: [
      { frequency: 60, gain: 0, q: 0.7 },
      { frequency: 170, gain: 0, q: 0.7 },
      { frequency: 350, gain: 0, q: 0.7 },
      { frequency: 1000, gain: 0, q: 0.7 },
      { frequency: 3500, gain: 0, q: 0.7 },
      { frequency: 10000, gain: 0, q: 0.7 }
    ],
    preamp: 0
  },
  compressor: {
    enabled: false,
    threshold: -24,
    ratio: 4,
    attack: 3,
    release: 100,
    knee: 2,
    makeupGain: 0
  },
  noiseReduction: {
    enabled: false,
    strength: 50,
    sensitivity: 50,
    preserveVoice: true
  },
  voiceEnhancement: {
    enabled: false,
    clarity: 0,
    warmth: 0,
    presence: 0,
    deEsser: 0
  },
  reverb: {
    enabled: false,
    roomSize: 50,
    damping: 50,
    wetLevel: 20,
    dryLevel: 80,
    preDelay: 0
  },
  master: {
    volume: 100,
    pan: 0,
    mute: false,
    solo: false
  },
  processing: {
    sampleRate: 44100,
    bufferSize: 4096,
    latency: 'interactive',
    enableWebWorker: true
  }
};

const DEFAULT_PRESETS: AudioPreset[] = [
  {
    id: 'voice-clear',
    name: 'Clear Voice',
    category: 'voice',
    description: 'Optimized for clear speech recording',
    isDefault: true,
    tags: ['voice', 'speech', 'clear'],
    settings: {
      equalizer: {
        enabled: true,
        bands: [
          { frequency: 60, gain: -6, q: 0.7 },
          { frequency: 170, gain: -3, q: 0.7 },
          { frequency: 350, gain: 2, q: 0.7 },
          { frequency: 1000, gain: 3, q: 0.7 },
          { frequency: 3500, gain: 4, q: 0.7 },
          { frequency: 10000, gain: 2, q: 0.7 }
        ],
        preamp: 2
      },
      compressor: {
        enabled: true,
        threshold: -18,
        ratio: 3,
        attack: 2,
        release: 80,
        knee: 2,
        makeupGain: 3
      },
      noiseReduction: {
        enabled: true,
        strength: 60,
        sensitivity: 40,
        preserveVoice: true
      }
    }
  },
  {
    id: 'music-balanced',
    name: 'Balanced Music',
    category: 'music',
    description: 'Balanced settings for music production',
    isDefault: true,
    tags: ['music', 'balanced', 'production'],
    settings: {
      equalizer: {
        enabled: true,
        bands: [
          { frequency: 60, gain: 1, q: 0.7 },
          { frequency: 170, gain: 0, q: 0.7 },
          { frequency: 350, gain: 0, q: 0.7 },
          { frequency: 1000, gain: 1, q: 0.7 },
          { frequency: 3500, gain: 2, q: 0.7 },
          { frequency: 10000, gain: 1, q: 0.7 }
        ],
        preamp: 0
      },
      compressor: {
        enabled: true,
        threshold: -20,
        ratio: 2.5,
        attack: 5,
        release: 120,
        knee: 3,
        makeupGain: 2
      }
    }
  },
  {
    id: 'podcast-pro',
    name: 'Podcast Pro',
    category: 'podcast',
    description: 'Professional podcast recording settings',
    isDefault: true,
    tags: ['podcast', 'professional', 'broadcast'],
    settings: {
      equalizer: {
        enabled: true,
        bands: [
          { frequency: 60, gain: -8, q: 0.7 },
          { frequency: 170, gain: -2, q: 0.7 },
          { frequency: 350, gain: 1, q: 0.7 },
          { frequency: 1000, gain: 2, q: 0.7 },
          { frequency: 3500, gain: 3, q: 0.7 },
          { frequency: 10000, gain: 1, q: 0.7 }
        ],
        preamp: 1
      },
      compressor: {
        enabled: true,
        threshold: -16,
        ratio: 4,
        attack: 1,
        release: 60,
        knee: 2,
        makeupGain: 4
      },
      noiseReduction: {
        enabled: true,
        strength: 70,
        sensitivity: 35,
        preserveVoice: true
      },
      voiceEnhancement: {
        enabled: true,
        clarity: 30,
        warmth: 20,
        presence: 25,
        deEsser: 40
      }
    }
  }
];

const STORAGE_KEYS = {
  SETTINGS: 'audio_editor_settings',
  PRESETS: 'audio_editor_presets',
  CURRENT_PRESET: 'audio_editor_current_preset'
};

export const useAudioSettings = () => {
  const [currentSettings, setCurrentSettings] = useState<AudioSettings['settings']>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<AudioSettings[]>([]);
  const [presets, setPresets] = useState<AudioPreset[]>(DEFAULT_PRESETS);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const settingsHistoryRef = useRef<AudioSettings['settings'][]>([]);
  const maxHistorySize = 20;

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettingsFromStorage();
  }, []);

  // Auto-save current settings when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCurrentSettingsToStorage();
    }, 1000); // Debounce auto-save

    return () => clearTimeout(timeoutId);
  }, [currentSettings]);

  // Load settings from localStorage
  const loadSettingsFromStorage = useCallback(() => {
    try {
      setIsLoading(true);
      
      // Load saved settings
      const savedSettingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettingsData) {
        const parsed = JSON.parse(savedSettingsData);
        setSavedSettings(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        })));
      }
      
      // Load custom presets
      const presetsData = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (presetsData) {
        const customPresets = JSON.parse(presetsData);
        setPresets([...DEFAULT_PRESETS, ...customPresets]);
      }
      
      // Load current preset
      const currentPreset = localStorage.getItem(STORAGE_KEYS.CURRENT_PRESET);
      if (currentPreset) {
        setCurrentPresetId(currentPreset);
        const preset = [...DEFAULT_PRESETS, ...JSON.parse(presetsData || '[]')]
          .find(p => p.id === currentPreset);
        if (preset) {
          applyPreset(preset);
        }
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save current settings to localStorage
  const saveCurrentSettingsToStorage = useCallback(() => {
    try {
      localStorage.setItem('audio_editor_current_settings', JSON.stringify(currentSettings));
    } catch (error) {
      console.error('Error saving current settings:', error);
    }
  }, [currentSettings]);

  // Update specific setting
  const updateSetting = useCallback(<T extends keyof AudioSettings['settings']>(
    category: T,
    updates: Partial<AudioSettings['settings'][T]>
  ) => {
    setCurrentSettings(prev => {
      // Add to history before changing
      settingsHistoryRef.current.push(JSON.parse(JSON.stringify(prev)));
      if (settingsHistoryRef.current.length > maxHistorySize) {
        settingsHistoryRef.current.shift();
      }
      
      const newSettings = {
        ...prev,
        [category]: {
          ...prev[category],
          ...updates
        }
      };
      
      setHasUnsavedChanges(true);
      return newSettings;
    });
  }, []);

  // Save current settings as new preset
  const saveAsPreset = useCallback(async (
    name: string,
    description: string = '',
    category: AudioPreset['category'] = 'custom',
    tags: string[] = []
  ): Promise<string> => {
    try {
      const newPreset: AudioPreset = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        category,
        tags,
        isDefault: false,
        settings: JSON.parse(JSON.stringify(currentSettings))
      };
      
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      
      // Save custom presets to localStorage
      const customPresets = updatedPresets.filter(p => !p.isDefault);
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(customPresets));
      
      setHasUnsavedChanges(false);
      return newPreset.id;
    } catch (error) {
      console.error('Error saving preset:', error);
      throw error;
    }
  }, [currentSettings, presets]);

  // Save current settings as named configuration
  const saveSettings = useCallback(async (name: string, description: string = ''): Promise<string> => {
    try {
      const newSettings: AudioSettings = {
        id: `settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: JSON.parse(JSON.stringify(currentSettings))
      };
      
      const updatedSavedSettings = [...savedSettings, newSettings];
      setSavedSettings(updatedSavedSettings);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSavedSettings));
      
      setHasUnsavedChanges(false);
      return newSettings.id;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }, [currentSettings, savedSettings]);

  // Load saved settings
  const loadSettings = useCallback((settingsId: string) => {
    const settings = savedSettings.find(s => s.id === settingsId);
    if (settings) {
      setCurrentSettings(settings.settings);
      setCurrentPresetId(null);
      setHasUnsavedChanges(false);
    }
  }, [savedSettings]);

  // Apply preset
  const applyPreset = useCallback((preset: AudioPreset) => {
    const mergedSettings = {
      ...DEFAULT_SETTINGS,
      ...preset.settings
    } as AudioSettings['settings'];
    
    setCurrentSettings(mergedSettings);
    setCurrentPresetId(preset.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_PRESET, preset.id);
    setHasUnsavedChanges(false);
  }, []);

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && !preset.isDefault) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      
      // Update localStorage
      const customPresets = updatedPresets.filter(p => !p.isDefault);
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(customPresets));
      
      // Clear current preset if it was deleted
      if (currentPresetId === presetId) {
        setCurrentPresetId(null);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PRESET);
      }
    }
  }, [presets, currentPresetId]);

  // Delete saved settings
  const deleteSettings = useCallback((settingsId: string) => {
    const updatedSavedSettings = savedSettings.filter(s => s.id !== settingsId);
    setSavedSettings(updatedSavedSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSavedSettings));
  }, [savedSettings]);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    setCurrentSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    setCurrentPresetId(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PRESET);
    setHasUnsavedChanges(false);
  }, []);

  // Undo last change
  const undoLastChange = useCallback(() => {
    if (settingsHistoryRef.current.length > 0) {
      const previousSettings = settingsHistoryRef.current.pop()!;
      setCurrentSettings(previousSettings);
      setHasUnsavedChanges(true);
    }
  }, []);

  // Export settings to file
  const exportSettings = useCallback((settingsId?: string) => {
    try {
      const dataToExport = settingsId 
        ? savedSettings.find(s => s.id === settingsId)
        : { settings: currentSettings, exportedAt: new Date() };
      
      if (!dataToExport) return;
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio-settings-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  }, [currentSettings, savedSettings]);

  // Import settings from file
  const importSettings = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.settings) {
            setCurrentSettings(data.settings);
            setCurrentPresetId(null);
            setHasUnsavedChanges(true);
          }
          
          resolve();
        } catch (error) {
          reject(new Error('Invalid settings file format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // Get presets by category
  const getPresetsByCategory = useCallback((category: AudioPreset['category']) => {
    return presets.filter(p => p.category === category);
  }, [presets]);

  // Search presets
  const searchPresets = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return presets.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [presets]);

  return {
    // Current state
    currentSettings,
    savedSettings,
    presets,
    currentPresetId,
    isLoading,
    hasUnsavedChanges,
    canUndo: settingsHistoryRef.current.length > 0,
    
    // Actions
    updateSetting,
    saveSettings,
    loadSettings,
    saveAsPreset,
    applyPreset,
    deletePreset,
    deleteSettings,
    resetToDefaults,
    undoLastChange,
    exportSettings,
    importSettings,
    
    // Utilities
    getPresetsByCategory,
    searchPresets,
    
    // Constants
    defaultSettings: DEFAULT_SETTINGS,
    defaultPresets: DEFAULT_PRESETS
  };
};

export default useAudioSettings;