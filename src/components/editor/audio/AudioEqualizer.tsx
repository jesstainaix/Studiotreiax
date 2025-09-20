import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Settings } from 'lucide-react';

interface EqualizerBand {
  frequency: number;
  gain: number;
  q: number;
  type: 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch' | 'allpass';
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
}

interface AudioEffect {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

interface AudioEqualizerProps {
  track: AudioTrack;
  onTrackUpdate: (updates: Partial<AudioTrack>) => void;
}

const defaultBands: EqualizerBand[] = [
  { frequency: 60, gain: 0, q: 0.7, type: 'lowshelf' },
  { frequency: 170, gain: 0, q: 0.7, type: 'peaking' },
  { frequency: 350, gain: 0, q: 0.7, type: 'peaking' },
  { frequency: 1000, gain: 0, q: 0.7, type: 'peaking' },
  { frequency: 3500, gain: 0, q: 0.7, type: 'peaking' },
  { frequency: 10000, gain: 0, q: 0.7, type: 'highshelf' }
];

const presets = {
  flat: { name: 'Flat', bands: defaultBands },
  rock: {
    name: 'Rock',
    bands: [
      { frequency: 60, gain: 5, q: 0.7, type: 'lowshelf' as const },
      { frequency: 170, gain: -2, q: 0.7, type: 'peaking' as const },
      { frequency: 350, gain: -1, q: 0.7, type: 'peaking' as const },
      { frequency: 1000, gain: 2, q: 0.7, type: 'peaking' as const },
      { frequency: 3500, gain: 4, q: 0.7, type: 'peaking' as const },
      { frequency: 10000, gain: 3, q: 0.7, type: 'highshelf' as const }
    ]
  },
  pop: {
    name: 'Pop',
    bands: [
      { frequency: 60, gain: 2, q: 0.7, type: 'lowshelf' as const },
      { frequency: 170, gain: 0, q: 0.7, type: 'peaking' as const },
      { frequency: 350, gain: 1, q: 0.7, type: 'peaking' as const },
      { frequency: 1000, gain: 2, q: 0.7, type: 'peaking' as const },
      { frequency: 3500, gain: 1, q: 0.7, type: 'peaking' as const },
      { frequency: 10000, gain: 3, q: 0.7, type: 'highshelf' as const }
    ]
  },
  classical: {
    name: 'Classical',
    bands: [
      { frequency: 60, gain: 0, q: 0.7, type: 'lowshelf' as const },
      { frequency: 170, gain: 0, q: 0.7, type: 'peaking' as const },
      { frequency: 350, gain: 0, q: 0.7, type: 'peaking' as const },
      { frequency: 1000, gain: 0, q: 0.7, type: 'peaking' as const },
      { frequency: 3500, gain: 2, q: 0.7, type: 'peaking' as const },
      { frequency: 10000, gain: 4, q: 0.7, type: 'highshelf' as const }
    ]
  },
  vocal: {
    name: 'Vocal',
    bands: [
      { frequency: 60, gain: -3, q: 0.7, type: 'lowshelf' as const },
      { frequency: 170, gain: -1, q: 0.7, type: 'peaking' as const },
      { frequency: 350, gain: 1, q: 0.7, type: 'peaking' as const },
      { frequency: 1000, gain: 3, q: 0.7, type: 'peaking' as const },
      { frequency: 3500, gain: 4, q: 0.7, type: 'peaking' as const },
      { frequency: 10000, gain: 2, q: 0.7, type: 'highshelf' as const }
    ]
  }
};

export const AudioEqualizer: React.FC<AudioEqualizerProps> = ({
  track,
  onTrackUpdate
}) => {
  const [bands, setBands] = useState<EqualizerBand[]>(defaultBands);
  const [enabled, setEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('flat');

  // Load equalizer settings from track effects
  useEffect(() => {
    const eqEffect = track.effects.find(effect => effect.type === 'equalizer');
    if (eqEffect) {
      setEnabled(eqEffect.enabled);
      if (eqEffect.parameters.bands) {
        setBands(JSON.parse(eqEffect.parameters.bands as any));
      }
    }
  }, [track.effects]);

  const updateEqualizerEffect = useCallback((newBands: EqualizerBand[], isEnabled: boolean) => {
    const existingEffects = track.effects.filter(effect => effect.type !== 'equalizer');
    const eqEffect = {
      id: 'equalizer',
      type: 'equalizer',
      enabled: isEnabled,
      parameters: {
        bands: JSON.stringify(newBands)
      }
    };
    
    onTrackUpdate({
      effects: [...existingEffects, eqEffect]
    });
  }, [track.effects, onTrackUpdate]);

  const handleBandChange = useCallback((index: number, property: keyof EqualizerBand, value: number) => {
    const newBands = [...bands];
    newBands[index] = { ...newBands[index], [property]: value };
    setBands(newBands);
    updateEqualizerEffect(newBands, enabled);
  }, [bands, enabled, updateEqualizerEffect]);

  const handlePresetChange = useCallback((presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    if (preset) {
      setBands(preset.bands);
      setSelectedPreset(presetKey);
      updateEqualizerEffect(preset.bands, enabled);
    }
  }, [enabled, updateEqualizerEffect]);

  const handleReset = useCallback(() => {
    setBands(defaultBands);
    setSelectedPreset('flat');
    updateEqualizerEffect(defaultBands, enabled);
  }, [enabled, updateEqualizerEffect]);

  const handleToggle = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    updateEqualizerEffect(bands, newEnabled);
  }, [enabled, bands, updateEqualizerEffect]);

  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`;
    }
    return `${freq}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Equalizador</h3>
          <button
            onClick={handleToggle}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              enabled
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Presets:</label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedPreset === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* EQ Bands */}
      <div className="flex-1">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 h-full">
          {bands.map((band, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Frequency Label */}
              <div className="text-xs text-gray-400 mb-2">
                {formatFrequency(band.frequency)}Hz
              </div>
              
              {/* Gain Slider */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={band.gain}
                  onChange={(e) => handleBandChange(index, 'gain', Number(e.target.value))}
                  className="h-32 slider-vertical"
                  style={{
                    writingMode: 'bt-lr',
                    WebkitAppearance: 'slider-vertical',
                    width: '20px',
                    background: enabled ? '#374151' : '#6B7280'
                  }}
                  disabled={!enabled}
                />
                <div className="text-xs text-center mt-2 w-12">
                  {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}dB
                </div>
              </div>
              
              {/* Q Factor */}
              <div className="mt-2">
                <label className="block text-xs text-gray-400 mb-1">Q</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={band.q}
                  onChange={(e) => handleBandChange(index, 'q', Number(e.target.value))}
                  className="w-full"
                  disabled={!enabled}
                />
                <div className="text-xs text-center">{band.q.toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Band Type Selector */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <label className="block text-sm font-medium mb-2">Tipo de Filtro:</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {['lowshelf', 'peaking', 'highshelf', 'bandpass'].map((type) => (
            <button
              key={type}
              onClick={() => {
                const newBands = [...bands];
                newBands.forEach((band, index) => {
                  if (index === 0) band.type = 'lowshelf';
                  else if (index === bands.length - 1) band.type = 'highshelf';
                  else band.type = 'peaking';
                });
                setBands(newBands);
                updateEqualizerEffect(newBands, enabled);
              }}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
              disabled={!enabled}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Frequency Response */}
      <div className="mt-4 h-20 bg-gray-800 rounded p-2">
        <div className="text-xs text-gray-400 mb-1">Resposta de Frequência</div>
        <div className="h-12 bg-gray-900 rounded relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 300 48">
            {/* Grid lines */}
            {[0, 12, 24, 36, 48].map(y => (
              <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#374151" strokeWidth="0.5" />
            ))}
            {[0, 60, 120, 180, 240, 300].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="48" stroke="#374151" strokeWidth="0.5" />
            ))}
            
            {/* Frequency response curve */}
            <path
              d={`M 0,24 ${bands.map((band, index) => {
                const x = (index / (bands.length - 1)) * 300;
                const y = 24 - (band.gain * 2); // Scale gain to pixels
                return `L ${x},${Math.max(0, Math.min(48, y))}`;
              }).join(' ')}`}
              stroke={enabled ? '#3B82F6' : '#6B7280'}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AudioEqualizer;