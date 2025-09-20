import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, Play, Pause, Settings } from 'lucide-react';

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

interface NoiseReductionProps {
  track: AudioTrack;
  onTrackUpdate: (updates: Partial<AudioTrack>) => void;
}

interface NoiseProfile {
  frequencies: number[];
  magnitudes: number[];
  threshold: number;
}

const noiseReductionPresets = {
  gentle: {
    name: 'Suave',
    threshold: -30,
    reduction: 6,
    attack: 5,
    release: 50,
    lookahead: 2
  },
  moderate: {
    name: 'Moderado',
    threshold: -25,
    reduction: 12,
    attack: 3,
    release: 30,
    lookahead: 3
  },
  aggressive: {
    name: 'Agressivo',
    threshold: -20,
    reduction: 18,
    attack: 1,
    release: 20,
    lookahead: 5
  },
  voice: {
    name: 'Voz',
    threshold: -28,
    reduction: 10,
    attack: 2,
    release: 25,
    lookahead: 3
  },
  music: {
    name: 'Música',
    threshold: -35,
    reduction: 8,
    attack: 8,
    release: 60,
    lookahead: 1
  }
};

export const NoiseReduction: React.FC<NoiseReductionProps> = ({
  track,
  onTrackUpdate
}) => {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(-30);
  const [reduction, setReduction] = useState(12);
  const [attack, setAttack] = useState(3);
  const [release, setRelease] = useState(30);
  const [lookahead, setLookahead] = useState(3);
  const [selectedPreset, setSelectedPreset] = useState<string>('moderate');
  const [isLearning, setIsLearning] = useState(false);
  const [noiseProfile, setNoiseProfile] = useState<NoiseProfile | null>(null);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [preserveTransients, setPreserveTransients] = useState(true);
  const [spectralSubtraction, setSpectralSubtraction] = useState(0.5);
  const [frequencySmoothing, setFrequencySmoothing] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Load noise reduction settings from track effects
  useEffect(() => {
    const nrEffect = track.effects.find(effect => effect.type === 'noise-reduction');
    if (nrEffect) {
      setEnabled(nrEffect.enabled);
      setThreshold(nrEffect.parameters.threshold || -30);
      setReduction(nrEffect.parameters.reduction || 12);
      setAttack(nrEffect.parameters.attack || 3);
      setRelease(nrEffect.parameters.release || 30);
      setLookahead(nrEffect.parameters.lookahead || 3);
      setAdaptiveMode(nrEffect.parameters.adaptiveMode || false);
      setPreserveTransients(nrEffect.parameters.preserveTransients || true);
      setSpectralSubtraction(nrEffect.parameters.spectralSubtraction || 0.5);
      setFrequencySmoothing(nrEffect.parameters.frequencySmoothing || 3);
    }
  }, [track.effects]);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateNoiseReductionEffect = useCallback(() => {
    const existingEffects = track.effects.filter(effect => effect.type !== 'noise-reduction');
    const nrEffect = {
      id: 'noise-reduction',
      type: 'noise-reduction',
      enabled,
      parameters: {
        threshold,
        reduction,
        attack,
        release,
        lookahead,
        adaptiveMode,
        preserveTransients,
        spectralSubtraction,
        frequencySmoothing,
        noiseProfile: noiseProfile ? JSON.stringify(noiseProfile) : null
      }
    };
    
    onTrackUpdate({
      effects: [...existingEffects, nrEffect]
    });
  }, [track.effects, onTrackUpdate, enabled, threshold, reduction, attack, release, lookahead, adaptiveMode, preserveTransients, spectralSubtraction, frequencySmoothing, noiseProfile]);

  // Update effect when parameters change
  useEffect(() => {
    updateNoiseReductionEffect();
  }, [updateNoiseReductionEffect]);

  const handlePresetChange = useCallback((presetKey: string) => {
    const preset = noiseReductionPresets[presetKey as keyof typeof noiseReductionPresets];
    if (preset) {
      setThreshold(preset.threshold);
      setReduction(preset.reduction);
      setAttack(preset.attack);
      setRelease(preset.release);
      setLookahead(preset.lookahead);
      setSelectedPreset(presetKey);
    }
  }, []);

  const handleReset = useCallback(() => {
    setThreshold(-30);
    setReduction(12);
    setAttack(3);
    setRelease(30);
    setLookahead(3);
    setAdaptiveMode(false);
    setPreserveTransients(true);
    setSpectralSubtraction(0.5);
    setFrequencySmoothing(3);
    setNoiseProfile(null);
    setSelectedPreset('moderate');
  }, []);

  const learnNoiseProfile = useCallback(async () => {
    if (!audioContextRef.current || !analyserRef.current) return;

    setIsLearning(true);
    setIsProcessing(true);

    try {
      // Simulate noise profile learning (in real implementation, analyze audio)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock noise profile
      const frequencies: number[] = [];
      const magnitudes: number[] = [];
      
      for (let i = 0; i < 1024; i++) {
        frequencies.push(i * (audioContextRef.current.sampleRate / 2) / 1024);
        magnitudes.push(Math.random() * 0.1); // Mock noise floor
      }
      
      const profile: NoiseProfile = {
        frequencies,
        magnitudes,
        threshold: threshold
      };
      
      setNoiseProfile(profile);
    } catch (error) {
      console.error('Error learning noise profile:', error);
    } finally {
      setIsLearning(false);
      setIsProcessing(false);
    }
  }, [threshold]);

  const processAudio = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Simulate audio processing
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const NoiseProfileVisualizer: React.FC = () => {
    if (!noiseProfile) return null;

    return (
      <div className="mt-4 p-3 bg-gray-800 rounded">
        <h4 className="text-sm font-medium mb-2">Perfil de Ruído Aprendido</h4>
        <div className="h-20 bg-gray-900 rounded relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 300 80">
            {/* Grid */}
            {[0, 20, 40, 60, 80].map(y => (
              <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#374151" strokeWidth="0.5" />
            ))}
            
            {/* Noise profile curve */}
            <path
              d={`M 0,${80 - (noiseProfile.magnitudes[0] * 800)} ${noiseProfile.magnitudes.slice(0, 300).map((mag, i) => {
                const x = i;
                const y = 80 - (mag * 800);
                return `L ${x},${Math.max(0, Math.min(80, y))}`;
              }).join(' ')}`}
              stroke="#EF4444"
              strokeWidth="1.5"
              fill="rgba(239, 68, 68, 0.1)"
            />
          </svg>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Threshold: {noiseProfile.threshold}dB | Samples: {noiseProfile.frequencies.length}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Redução de Ruído</h3>
          <button
            onClick={() => setEnabled(!enabled)}
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
          {Object.entries(noiseReductionPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedPreset === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              disabled={!enabled}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Noise Learning */}
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h4 className="text-sm font-medium mb-3">Aprendizado de Ruído</h4>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={learnNoiseProfile}
            disabled={!enabled || isLearning || isProcessing}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              isLearning
                ? 'bg-yellow-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-600 disabled:text-gray-400'
            }`}
          >
            {isLearning ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Aprendendo...
              </>
            ) : (
              'Aprender Perfil de Ruído'
            )}
          </button>
          
          {noiseProfile && (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Perfil aprendido</span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-400">
          Reproduza uma seção com apenas ruído para que o algoritmo aprenda o perfil de ruído a ser removido.
        </p>
        
        <NoiseProfileVisualizer />
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Threshold */}
        <div>
          <label className="block text-sm font-medium mb-2">Threshold</label>
          <input
            type="range"
            min="-60"
            max="-10"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full"
            disabled={!enabled}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-60dB</span>
            <span className="font-medium">{threshold}dB</span>
            <span>-10dB</span>
          </div>
        </div>

        {/* Reduction */}
        <div>
          <label className="block text-sm font-medium mb-2">Redução</label>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={reduction}
            onChange={(e) => setReduction(Number(e.target.value))}
            className="w-full"
            disabled={!enabled}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0dB</span>
            <span className="font-medium">{reduction}dB</span>
            <span>30dB</span>
          </div>
        </div>

        {/* Attack */}
        <div>
          <label className="block text-sm font-medium mb-2">Attack</label>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={attack}
            onChange={(e) => setAttack(Number(e.target.value))}
            className="w-full"
            disabled={!enabled}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.1ms</span>
            <span className="font-medium">{attack}ms</span>
            <span>20ms</span>
          </div>
        </div>

        {/* Release */}
        <div>
          <label className="block text-sm font-medium mb-2">Release</label>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={release}
            onChange={(e) => setRelease(Number(e.target.value))}
            className="w-full"
            disabled={!enabled}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5ms</span>
            <span className="font-medium">{release}ms</span>
            <span>200ms</span>
          </div>
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Controles Avançados</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lookahead */}
          <div>
            <label className="block text-sm font-medium mb-2">Lookahead</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={lookahead}
              onChange={(e) => setLookahead(Number(e.target.value))}
              className="w-full"
              disabled={!enabled}
            />
            <div className="text-xs text-gray-400 mt-1">{lookahead}ms</div>
          </div>

          {/* Spectral Subtraction */}
          <div>
            <label className="block text-sm font-medium mb-2">Subtração Espectral</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={spectralSubtraction}
              onChange={(e) => setSpectralSubtraction(Number(e.target.value))}
              className="w-full"
              disabled={!enabled}
            />
            <div className="text-xs text-gray-400 mt-1">{(spectralSubtraction * 100).toFixed(0)}%</div>
          </div>

          {/* Frequency Smoothing */}
          <div>
            <label className="block text-sm font-medium mb-2">Suavização de Frequência</label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={frequencySmoothing}
              onChange={(e) => setFrequencySmoothing(Number(e.target.value))}
              className="w-full"
              disabled={!enabled}
            />
            <div className="text-xs text-gray-400 mt-1">{frequencySmoothing} bins</div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Opções</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={adaptiveMode}
              onChange={(e) => setAdaptiveMode(e.target.checked)}
              disabled={!enabled}
              className="rounded"
            />
            <span className="text-sm">Modo Adaptativo</span>
            <span className="text-xs text-gray-400 ml-2">
              Ajusta automaticamente os parâmetros baseado no conteúdo
            </span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preserveTransients}
              onChange={(e) => setPreserveTransients(e.target.checked)}
              disabled={!enabled}
              className="rounded"
            />
            <span className="text-sm">Preservar Transientes</span>
            <span className="text-xs text-gray-400 ml-2">
              Protege ataques e transientes musicais
            </span>
          </label>
        </div>
      </div>

      {/* Process Button */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <button
          onClick={processAudio}
          disabled={!enabled || isProcessing || !noiseProfile}
          className={`w-full py-3 rounded font-medium transition-colors ${
            isProcessing
              ? 'bg-yellow-600 text-white'
              : enabled && noiseProfile
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Settings className="w-4 h-4 mr-2 animate-spin inline" />
              Processando...
            </>
          ) : (
            'Aplicar Redução de Ruído'
          )}
        </button>
        
        {!noiseProfile && enabled && (
          <p className="text-xs text-yellow-400 mt-2 text-center">
            Aprenda um perfil de ruído primeiro
          </p>
        )}
      </div>
    </div>
  );
};

export default NoiseReduction;