import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume, VolumeX, Mic, MicOff, TrendingUp, TrendingDown, Settings, RotateCcw, Play, Pause } from 'lucide-react';

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  offset: number;
  duration: number;
}

interface AudioEffect {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

interface AudioFadeControlsProps {
  audioTracks: AudioTrack[];
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  isPlaying: boolean;
  currentTime: number;
  onSeek: (time: number) => void;
}

interface FadeSettings {
  fadeInDuration: number; // seconds
  fadeInCurve: 'linear' | 'exponential' | 'logarithmic' | 'sCurve';
  fadeOutDuration: number; // seconds
  fadeOutCurve: 'linear' | 'exponential' | 'logarithmic' | 'sCurve';
  fadeInEnabled: boolean;
  fadeOutEnabled: boolean;
  crossfadeDuration: number; // seconds
  autoFadeEnabled: boolean;
}

interface VoiceEnhancementSettings {
  deEsserEnabled: boolean;
  deEsserThreshold: number; // dB
  deEsserFrequency: number; // Hz
  deEsserReduction: number; // dB
  
  breathRemovalEnabled: boolean;
  breathThreshold: number; // dB
  breathReduction: number; // dB
  
  voiceEQEnabled: boolean;
  bassBoost: number; // dB
  midCut: number; // dB
  presenceBoost: number; // dB
  airBoost: number; // dB
  
  compressorEnabled: boolean;
  compressorThreshold: number; // dB
  compressorRatio: number;
  compressorAttack: number; // ms
  compressorRelease: number; // ms
  
  noiseGateEnabled: boolean;
  gateThreshold: number; // dB
  gateAttack: number; // ms
  gateRelease: number; // ms
  
  warmthEnabled: boolean;
  warmthAmount: number; // 0-100
  
  clarityEnabled: boolean;
  clarityAmount: number; // 0-100
}

const defaultFadeSettings: FadeSettings = {
  fadeInDuration: 2,
  fadeInCurve: 'sCurve',
  fadeOutDuration: 2,
  fadeOutCurve: 'sCurve',
  fadeInEnabled: false,
  fadeOutEnabled: false,
  crossfadeDuration: 1,
  autoFadeEnabled: false
};

const defaultVoiceSettings: VoiceEnhancementSettings = {
  deEsserEnabled: false,
  deEsserThreshold: -20,
  deEsserFrequency: 6000,
  deEsserReduction: 6,
  
  breathRemovalEnabled: false,
  breathThreshold: -40,
  breathReduction: 12,
  
  voiceEQEnabled: false,
  bassBoost: 0,
  midCut: 0,
  presenceBoost: 0,
  airBoost: 0,
  
  compressorEnabled: false,
  compressorThreshold: -18,
  compressorRatio: 3,
  compressorAttack: 3,
  compressorRelease: 100,
  
  noiseGateEnabled: false,
  gateThreshold: -50,
  gateAttack: 1,
  gateRelease: 100,
  
  warmthEnabled: false,
  warmthAmount: 25,
  
  clarityEnabled: false,
  clarityAmount: 25
};

const fadePresets = {
  quick: { name: 'Rápido', fadeIn: 0.5, fadeOut: 0.5, curve: 'exponential' as const },
  normal: { name: 'Normal', fadeIn: 2, fadeOut: 2, curve: 'sCurve' as const },
  slow: { name: 'Lento', fadeIn: 5, fadeOut: 5, curve: 'logarithmic' as const },
  music: { name: 'Música', fadeIn: 3, fadeOut: 4, curve: 'sCurve' as const },
  speech: { name: 'Fala', fadeIn: 0.2, fadeOut: 0.3, curve: 'linear' as const }
};

const voicePresets = {
  podcast: {
    name: 'Podcast',
    settings: {
      deEsserEnabled: true,
      deEsserThreshold: -15,
      breathRemovalEnabled: true,
      breathThreshold: -35,
      voiceEQEnabled: true,
      bassBoost: 2,
      midCut: -1,
      presenceBoost: 3,
      compressorEnabled: true,
      compressorThreshold: -16,
      compressorRatio: 3,
      noiseGateEnabled: true,
      gateThreshold: -45,
      warmthEnabled: true,
      warmthAmount: 30
    }
  },
  broadcast: {
    name: 'Transmissão',
    settings: {
      deEsserEnabled: true,
      deEsserThreshold: -12,
      breathRemovalEnabled: true,
      breathThreshold: -30,
      voiceEQEnabled: true,
      bassBoost: 1,
      midCut: -2,
      presenceBoost: 4,
      airBoost: 2,
      compressorEnabled: true,
      compressorThreshold: -14,
      compressorRatio: 4,
      noiseGateEnabled: true,
      gateThreshold: -40,
      clarityEnabled: true,
      clarityAmount: 40
    }
  },
  voiceover: {
    name: 'Narração',
    settings: {
      deEsserEnabled: true,
      deEsserThreshold: -18,
      breathRemovalEnabled: true,
      breathThreshold: -40,
      voiceEQEnabled: true,
      bassBoost: 3,
      presenceBoost: 2,
      compressorEnabled: true,
      compressorThreshold: -20,
      compressorRatio: 2.5,
      noiseGateEnabled: true,
      gateThreshold: -50,
      warmthEnabled: true,
      warmthAmount: 35
    }
  },
  singing: {
    name: 'Vocal',
    settings: {
      deEsserEnabled: true,
      deEsserThreshold: -10,
      voiceEQEnabled: true,
      bassBoost: 1,
      presenceBoost: 3,
      airBoost: 3,
      compressorEnabled: true,
      compressorThreshold: -12,
      compressorRatio: 2,
      compressorAttack: 1,
      compressorRelease: 80,
      warmthEnabled: true,
      warmthAmount: 20,
      clarityEnabled: true,
      clarityAmount: 30
    }
  }
};

export const AudioFadeControls: React.FC<AudioFadeControlsProps> = ({
  audioTracks,
  onUpdateTrack,
  isPlaying,
  currentTime,
  onSeek
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>(audioTracks[0]?.id || '');
  const [fadeSettings, setFadeSettings] = useState<FadeSettings>(defaultFadeSettings);
  const [voiceSettings, setVoiceSettings] = useState<VoiceEnhancementSettings>(defaultVoiceSettings);
  const [activeTab, setActiveTab] = useState<'fade' | 'voice'>('fade');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [fadePoints, setFadePoints] = useState<{ fadeIn: number; fadeOut: number }>({ fadeIn: 0, fadeOut: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodesRef = useRef<{
    deEsser: BiquadFilterNode | null;
    breathFilter: BiquadFilterNode | null;
    bassEQ: BiquadFilterNode | null;
    midEQ: BiquadFilterNode | null;
    presenceEQ: BiquadFilterNode | null;
    airEQ: BiquadFilterNode | null;
  }>({ deEsser: null, breathFilter: null, bassEQ: null, midEQ: null, presenceEQ: null, airEQ: null });
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Create gain node for fade control
        if (!gainNodeRef.current) {
          gainNodeRef.current = audioContextRef.current.createGain();
        }

        // Create filter nodes for voice enhancement
        if (!filterNodesRef.current.deEsser) {
          filterNodesRef.current.deEsser = audioContextRef.current.createBiquadFilter();
          filterNodesRef.current.deEsser.type = 'highshelf';
          filterNodesRef.current.deEsser.frequency.value = 6000;
        }

        if (!filterNodesRef.current.breathFilter) {
          filterNodesRef.current.breathFilter = audioContextRef.current.createBiquadFilter();
          filterNodesRef.current.breathFilter.type = 'highpass';
          filterNodesRef.current.breathFilter.frequency.value = 80;
        }

        // Create EQ filters
        const eqFilters = ['bassEQ', 'midEQ', 'presenceEQ', 'airEQ'] as const;
        const frequencies = [100, 1000, 3000, 10000];
        
        eqFilters.forEach((filterName, index) => {
          if (!filterNodesRef.current[filterName]) {
            filterNodesRef.current[filterName] = audioContextRef.current!.createBiquadFilter();
            filterNodesRef.current[filterName]!.type = 'peaking';
            filterNodesRef.current[filterName]!.frequency.value = frequencies[index];
            filterNodesRef.current[filterName]!.Q.value = 1;
          }
        });

        // Create compressor node
        if (!compressorNodeRef.current) {
          compressorNodeRef.current = audioContextRef.current.createDynamicsCompressor();
        }
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update fade points based on track duration
  useEffect(() => {
    const track = audioTracks.find(t => t.id === selectedTrack);
    if (track) {
      setFadePoints({
        fadeIn: fadeSettings.fadeInEnabled ? fadeSettings.fadeInDuration : 0,
        fadeOut: fadeSettings.fadeOutEnabled ? Math.max(0, track.duration - fadeSettings.fadeOutDuration) : track.duration
      });
    }
  }, [selectedTrack, audioTracks, fadeSettings]);

  // Apply fade effect in real-time
  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;

    const track = audioTracks.find(t => t.id === selectedTrack);
    if (!track) return;

    const applyFade = () => {
      const trackTime = currentTime - track.offset;
      let gainValue = 1;

      // Apply fade in
      if (fadeSettings.fadeInEnabled && trackTime < fadeSettings.fadeInDuration) {
        const progress = trackTime / fadeSettings.fadeInDuration;
        gainValue *= calculateFadeCurve(progress, fadeSettings.fadeInCurve);
      }

      // Apply fade out
      if (fadeSettings.fadeOutEnabled && trackTime > (track.duration - fadeSettings.fadeOutDuration)) {
        const fadeOutStart = track.duration - fadeSettings.fadeOutDuration;
        const progress = 1 - ((trackTime - fadeOutStart) / fadeSettings.fadeOutDuration);
        gainValue *= calculateFadeCurve(progress, fadeSettings.fadeOutCurve);
      }

      gainNodeRef.current!.gain.setValueAtTime(gainValue, audioContextRef.current!.currentTime);
    };

    if (isPlaying) {
      const updateFade = () => {
        applyFade();
        animationFrameRef.current = requestAnimationFrame(updateFade);
      };
      updateFade();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, selectedTrack, audioTracks, fadeSettings]);

  // Update voice enhancement filters
  useEffect(() => {
    if (!audioContextRef.current) return;

    const now = audioContextRef.current.currentTime;

    // De-esser
    if (filterNodesRef.current.deEsser) {
      filterNodesRef.current.deEsser.frequency.setValueAtTime(voiceSettings.deEsserFrequency, now);
      const gain = voiceSettings.deEsserEnabled ? -voiceSettings.deEsserReduction : 0;
      filterNodesRef.current.deEsser.gain.setValueAtTime(gain, now);
    }

    // EQ filters
    if (filterNodesRef.current.bassEQ) {
      const gain = voiceSettings.voiceEQEnabled ? voiceSettings.bassBoost : 0;
      filterNodesRef.current.bassEQ.gain.setValueAtTime(gain, now);
    }

    if (filterNodesRef.current.midEQ) {
      const gain = voiceSettings.voiceEQEnabled ? voiceSettings.midCut : 0;
      filterNodesRef.current.midEQ.gain.setValueAtTime(gain, now);
    }

    if (filterNodesRef.current.presenceEQ) {
      const gain = voiceSettings.voiceEQEnabled ? voiceSettings.presenceBoost : 0;
      filterNodesRef.current.presenceEQ.gain.setValueAtTime(gain, now);
    }

    if (filterNodesRef.current.airEQ) {
      const gain = voiceSettings.voiceEQEnabled ? voiceSettings.airBoost : 0;
      filterNodesRef.current.airEQ.gain.setValueAtTime(gain, now);
    }

    // Compressor
    if (compressorNodeRef.current) {
      if (voiceSettings.compressorEnabled) {
        compressorNodeRef.current.threshold.setValueAtTime(voiceSettings.compressorThreshold, now);
        compressorNodeRef.current.ratio.setValueAtTime(voiceSettings.compressorRatio, now);
        compressorNodeRef.current.attack.setValueAtTime(voiceSettings.compressorAttack / 1000, now);
        compressorNodeRef.current.release.setValueAtTime(voiceSettings.compressorRelease / 1000, now);
      }
    }
  }, [voiceSettings]);

  const calculateFadeCurve = (progress: number, curve: string): number => {
    progress = Math.max(0, Math.min(1, progress));
    
    switch (curve) {
      case 'linear':
        return progress;
      case 'exponential':
        return progress * progress;
      case 'logarithmic':
        return Math.sqrt(progress);
      case 'sCurve':
        return 0.5 * (1 + Math.sin(Math.PI * (progress - 0.5)));
      default:
        return progress;
    }
  };

  const applyFadePreset = useCallback((presetKey: string) => {
    const preset = fadePresets[presetKey as keyof typeof fadePresets];
    if (preset) {
      setFadeSettings(prev => ({
        ...prev,
        fadeInDuration: preset.fadeIn,
        fadeOutDuration: preset.fadeOut,
        fadeInCurve: preset.curve,
        fadeOutCurve: preset.curve,
        fadeInEnabled: true,
        fadeOutEnabled: true
      }));
    }
  }, []);

  const applyVoicePreset = useCallback((presetKey: string) => {
    const preset = voicePresets[presetKey as keyof typeof voicePresets];
    if (preset) {
      setVoiceSettings(prev => ({
        ...prev,
        ...preset.settings
      }));
    }
  }, []);

  const resetSettings = useCallback(() => {
    setFadeSettings(defaultFadeSettings);
    setVoiceSettings(defaultVoiceSettings);
  }, []);

  const applyEffectsToTrack = useCallback(() => {
    if (!selectedTrack) return;

    const track = audioTracks.find(t => t.id === selectedTrack);
    if (!track) return;

    const newEffects: AudioEffect[] = [...track.effects.filter(e => !['fade', 'voice_enhancement'].includes(e.type))];

    // Add fade effect
    if (fadeSettings.fadeInEnabled || fadeSettings.fadeOutEnabled) {
      newEffects.push({
        id: `fade_${Date.now()}`,
        type: 'fade',
        enabled: true,
        parameters: {
          fadeInDuration: fadeSettings.fadeInDuration,
          fadeInCurve: fadeSettings.fadeInCurve === 'linear' ? 0 : fadeSettings.fadeInCurve === 'exponential' ? 1 : fadeSettings.fadeInCurve === 'logarithmic' ? 2 : 3,
          fadeOutDuration: fadeSettings.fadeOutDuration,
          fadeOutCurve: fadeSettings.fadeOutCurve === 'linear' ? 0 : fadeSettings.fadeOutCurve === 'exponential' ? 1 : fadeSettings.fadeOutCurve === 'logarithmic' ? 2 : 3,
          fadeInEnabled: fadeSettings.fadeInEnabled ? 1 : 0,
          fadeOutEnabled: fadeSettings.fadeOutEnabled ? 1 : 0
        }
      });
    }

    // Add voice enhancement effect
    const voiceEffectEnabled = Object.values(voiceSettings).some((value, index) => {
      const keys = Object.keys(voiceSettings);
      return keys[index].includes('Enabled') && value === true;
    });

    if (voiceEffectEnabled) {
      newEffects.push({
        id: `voice_enhancement_${Date.now()}`,
        type: 'voice_enhancement',
        enabled: true,
        parameters: {
          deEsserEnabled: voiceSettings.deEsserEnabled ? 1 : 0,
          deEsserThreshold: voiceSettings.deEsserThreshold,
          deEsserFrequency: voiceSettings.deEsserFrequency,
          deEsserReduction: voiceSettings.deEsserReduction,
          breathRemovalEnabled: voiceSettings.breathRemovalEnabled ? 1 : 0,
          breathThreshold: voiceSettings.breathThreshold,
          breathReduction: voiceSettings.breathReduction,
          voiceEQEnabled: voiceSettings.voiceEQEnabled ? 1 : 0,
          bassBoost: voiceSettings.bassBoost,
          midCut: voiceSettings.midCut,
          presenceBoost: voiceSettings.presenceBoost,
          airBoost: voiceSettings.airBoost,
          compressorEnabled: voiceSettings.compressorEnabled ? 1 : 0,
          compressorThreshold: voiceSettings.compressorThreshold,
          compressorRatio: voiceSettings.compressorRatio,
          compressorAttack: voiceSettings.compressorAttack,
          compressorRelease: voiceSettings.compressorRelease,
          noiseGateEnabled: voiceSettings.noiseGateEnabled ? 1 : 0,
          gateThreshold: voiceSettings.gateThreshold,
          gateAttack: voiceSettings.gateAttack,
          gateRelease: voiceSettings.gateRelease,
          warmthEnabled: voiceSettings.warmthEnabled ? 1 : 0,
          warmthAmount: voiceSettings.warmthAmount,
          clarityEnabled: voiceSettings.clarityEnabled ? 1 : 0,
          clarityAmount: voiceSettings.clarityAmount
        }
      });
    }

    onUpdateTrack(selectedTrack, { effects: newEffects });
  }, [selectedTrack, audioTracks, fadeSettings, voiceSettings, onUpdateTrack]);

  const FadeCurveVisualization: React.FC<{ curve: string; duration: number }> = ({ curve, duration }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * width;
        const y = (i / 4) * height;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw fade curve
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < width; x++) {
        const progress = x / width;
        const gain = calculateFadeCurve(progress, curve);
        const y = height - (gain * height);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = '#ccc';
      ctx.font = '10px Arial';
      ctx.fillText('0s', 5, height - 5);
      ctx.fillText(`${duration}s`, width - 25, height - 5);
      ctx.fillText('0%', 5, height - 15);
      ctx.fillText('100%', 5, 15);
      
    }, [curve, duration]);
    
    return (
      <canvas
        ref={canvasRef}
        width={150}
        height={80}
        className="border border-gray-600 rounded"
      />
    );
  };

  const WaveformWithFades: React.FC = () => {
    const track = audioTracks.find(t => t.id === selectedTrack);
    if (!track) return null;

    const waveformWidth = 300;
    const waveformHeight = 60;
    const fadeInWidth = (fadeSettings.fadeInDuration / track.duration) * waveformWidth;
    const fadeOutWidth = (fadeSettings.fadeOutDuration / track.duration) * waveformWidth;
    const fadeOutStart = waveformWidth - fadeOutWidth;

    return (
      <div className="relative bg-gray-800 rounded p-3">
        <h4 className="text-sm font-medium mb-2">Visualização do Fade</h4>
        
        <div className="relative" style={{ width: waveformWidth, height: waveformHeight }}>
          {/* Simulated waveform */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-60 rounded" />
          
          {/* Fade in overlay */}
          {fadeSettings.fadeInEnabled && (
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-black to-transparent"
              style={{ width: fadeInWidth }}
            />
          )}
          
          {/* Fade out overlay */}
          {fadeSettings.fadeOutEnabled && (
            <div 
              className="absolute top-0 h-full bg-gradient-to-r from-transparent to-black"
              style={{ left: fadeOutStart, width: fadeOutWidth }}
            />
          )}
          
          {/* Current time indicator */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-red-500"
            style={{ left: ((currentTime - track.offset) / track.duration) * waveformWidth }}
          />
        </div>
        
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>0s</span>
          <span>{track.duration.toFixed(1)}s</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Volume className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold">Fade & Melhoria de Voz</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              previewMode ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {previewMode ? 'Preview ON' : 'Preview OFF'}
          </button>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showAdvanced ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Avançado
          </button>
          
          <button
            onClick={resetSettings}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track Selection */}
      <div className="mb-4">
        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
        >
          {audioTracks.map(track => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex gap-1">
          {[
            { key: 'fade', name: 'Fade In/Out', icon: TrendingUp },
            { key: 'voice', name: 'Melhoria de Voz', icon: Mic }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-700 text-white border-b-2 border-green-500'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'fade' && (
          <div className="space-y-4">
            {/* Waveform Visualization */}
            <WaveformWithFades />

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Presets de Fade:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(fadePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyFadePreset(key)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fade In Controls */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Fade In
                </h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fadeSettings.fadeInEnabled}
                    onChange={(e) => setFadeSettings(prev => ({ ...prev, fadeInEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duração:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={fadeSettings.fadeInDuration}
                    onChange={(e) => setFadeSettings(prev => ({ ...prev, fadeInDuration: Number(e.target.value) }))}
                    disabled={!fadeSettings.fadeInEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{fadeSettings.fadeInDuration.toFixed(1)}s</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Curva:</label>
                  <select
                    value={fadeSettings.fadeInCurve}
                    onChange={(e) => setFadeSettings(prev => ({ ...prev, fadeInCurve: e.target.value as any }))}
                    disabled={!fadeSettings.fadeInEnabled}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                  >
                    <option value="linear">Linear</option>
                    <option value="exponential">Exponencial</option>
                    <option value="logarithmic">Logarítmica</option>
                    <option value="sCurve">Curva S</option>
                  </select>
                </div>
              </div>
              
              {fadeSettings.fadeInEnabled && (
                <div className="mt-3">
                  <FadeCurveVisualization curve={fadeSettings.fadeInCurve} duration={fadeSettings.fadeInDuration} />
                </div>
              )}
            </div>

            {/* Fade Out Controls */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Fade Out
                </h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fadeSettings.fadeOutEnabled}
                    onChange={(e) => setFadeSettings(prev => ({ ...prev, fadeOutEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duração:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={fadeSettings.fadeOutDuration}
                    onChange={(e) => setFadeSettings(prev => ({ ...prev, fadeOutDuration: Number(e.target.value) }))}
                    disabled={!fadeSettings.fadeOutEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{fadeSettings.fadeOutDuration.toFixed(1)}s</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Curva:</label>
                  <select
                    value={fadeSettings.fadeOutCurve}
                    onChange={(e) => setFadeSettings(prev => ({ ...prev, fadeOutCurve: e.target.value as any }))}
                    disabled={!fadeSettings.fadeOutEnabled}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                  >
                    <option value="linear">Linear</option>
                    <option value="exponential">Exponencial</option>
                    <option value="logarithmic">Logarítmica</option>
                    <option value="sCurve">Curva S</option>
                  </select>
                </div>
              </div>
              
              {fadeSettings.fadeOutEnabled && (
                <div className="mt-3">
                  <FadeCurveVisualization curve={fadeSettings.fadeOutCurve} duration={fadeSettings.fadeOutDuration} />
                </div>
              )}
            </div>

            {/* Advanced Fade Settings */}
            {showAdvanced && (
              <div className="p-4 bg-gray-800 rounded">
                <h4 className="text-sm font-medium mb-3">Configurações Avançadas</h4>
                
                <div className="space-y-4">
                  {/* Auto Fade */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fadeSettings.autoFadeEnabled}
                      onChange={(e) => setFadeSettings(prev => ({ ...prev, autoFadeEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Auto Fade (detectar silêncio)</span>
                  </label>
                  
                  {/* Crossfade Duration */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Duração do Crossfade:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={fadeSettings.crossfadeDuration}
                      onChange={(e) => setFadeSettings(prev => ({ ...prev, crossfadeDuration: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">{fadeSettings.crossfadeDuration.toFixed(1)}s</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-4">
            {/* Voice Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Presets de Voz:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(voicePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyVoicePreset(key)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* De-esser */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">De-esser</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceSettings.deEsserEnabled}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, deEsserEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Threshold:</label>
                  <input
                    type="range"
                    min="-40"
                    max="-5"
                    step="1"
                    value={voiceSettings.deEsserThreshold}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, deEsserThreshold: Number(e.target.value) }))}
                    disabled={!voiceSettings.deEsserEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.deEsserThreshold}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Frequência:</label>
                  <input
                    type="range"
                    min="3000"
                    max="12000"
                    step="100"
                    value={voiceSettings.deEsserFrequency}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, deEsserFrequency: Number(e.target.value) }))}
                    disabled={!voiceSettings.deEsserEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.deEsserFrequency}Hz</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Redução:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={voiceSettings.deEsserReduction}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, deEsserReduction: Number(e.target.value) }))}
                    disabled={!voiceSettings.deEsserEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.deEsserReduction}dB</div>
                </div>
              </div>
            </div>

            {/* Breath Removal */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Remoção de Respiração</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceSettings.breathRemovalEnabled}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, breathRemovalEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Threshold:</label>
                  <input
                    type="range"
                    min="-60"
                    max="-20"
                    step="1"
                    value={voiceSettings.breathThreshold}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, breathThreshold: Number(e.target.value) }))}
                    disabled={!voiceSettings.breathRemovalEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.breathThreshold}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Redução:</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={voiceSettings.breathReduction}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, breathReduction: Number(e.target.value) }))}
                    disabled={!voiceSettings.breathRemovalEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.breathReduction}dB</div>
                </div>
              </div>
            </div>

            {/* Voice EQ */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">EQ de Voz</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceSettings.voiceEQEnabled}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceEQEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bass (100Hz):</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={voiceSettings.bassBoost}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, bassBoost: Number(e.target.value) }))}
                    disabled={!voiceSettings.voiceEQEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.bassBoost.toFixed(1)}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mid (1kHz):</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={voiceSettings.midCut}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, midCut: Number(e.target.value) }))}
                    disabled={!voiceSettings.voiceEQEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.midCut.toFixed(1)}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Presence (3kHz):</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={voiceSettings.presenceBoost}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, presenceBoost: Number(e.target.value) }))}
                    disabled={!voiceSettings.voiceEQEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.presenceBoost.toFixed(1)}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Air (10kHz):</label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={voiceSettings.airBoost}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, airBoost: Number(e.target.value) }))}
                    disabled={!voiceSettings.voiceEQEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.airBoost.toFixed(1)}dB</div>
                </div>
              </div>
            </div>

            {/* Voice Compressor */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Compressor de Voz</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceSettings.compressorEnabled}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, compressorEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Threshold:</label>
                  <input
                    type="range"
                    min="-40"
                    max="-5"
                    step="1"
                    value={voiceSettings.compressorThreshold}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, compressorThreshold: Number(e.target.value) }))}
                    disabled={!voiceSettings.compressorEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.compressorThreshold}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ratio:</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={voiceSettings.compressorRatio}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, compressorRatio: Number(e.target.value) }))}
                    disabled={!voiceSettings.compressorEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.compressorRatio.toFixed(1)}:1</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Attack:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={voiceSettings.compressorAttack}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, compressorAttack: Number(e.target.value) }))}
                    disabled={!voiceSettings.compressorEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.compressorAttack.toFixed(1)}ms</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Release:</label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={voiceSettings.compressorRelease}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, compressorRelease: Number(e.target.value) }))}
                    disabled={!voiceSettings.compressorEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.compressorRelease}ms</div>
                </div>
              </div>
            </div>

            {/* Noise Gate */}
            <div className="p-4 bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Noise Gate</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceSettings.noiseGateEnabled}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, noiseGateEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Ativar</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Threshold:</label>
                  <input
                    type="range"
                    min="-80"
                    max="-20"
                    step="1"
                    value={voiceSettings.gateThreshold}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, gateThreshold: Number(e.target.value) }))}
                    disabled={!voiceSettings.noiseGateEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.gateThreshold}dB</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Attack:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={voiceSettings.gateAttack}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, gateAttack: Number(e.target.value) }))}
                    disabled={!voiceSettings.noiseGateEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.gateAttack.toFixed(1)}ms</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Release:</label>
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={voiceSettings.gateRelease}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, gateRelease: Number(e.target.value) }))}
                    disabled={!voiceSettings.noiseGateEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.gateRelease}ms</div>
                </div>
              </div>
            </div>

            {/* Enhancement Effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Warmth */}
              <div className="p-4 bg-gray-800 rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Aquecimento</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={voiceSettings.warmthEnabled}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, warmthEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Ativar</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={voiceSettings.warmthAmount}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, warmthAmount: Number(e.target.value) }))}
                    disabled={!voiceSettings.warmthEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.warmthAmount}%</div>
                </div>
              </div>

              {/* Clarity */}
              <div className="p-4 bg-gray-800 rounded">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Clareza</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={voiceSettings.clarityEnabled}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, clarityEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Ativar</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={voiceSettings.clarityAmount}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, clarityAmount: Number(e.target.value) }))}
                    disabled={!voiceSettings.clarityEnabled}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400">{voiceSettings.clarityAmount}%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={applyEffectsToTrack}
          className="w-full p-3 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
        >
          Aplicar Efeitos ao Track
        </button>
      </div>
    </div>
  );
};

export default AudioFadeControls;