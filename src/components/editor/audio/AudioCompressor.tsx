import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Settings, RotateCcw, TrendingUp, Volume2, Activity } from 'lucide-react';

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

interface AudioCompressorProps {
  audioTracks: AudioTrack[];
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  isPlaying: boolean;
  currentTime: number;
}

interface CompressorSettings {
  threshold: number; // dB
  ratio: number; // 1:1 to 20:1
  attack: number; // ms
  release: number; // ms
  knee: number; // dB (soft knee)
  makeupGain: number; // dB
  enabled: boolean;
  lookAhead: number; // ms
  sideChainEnabled: boolean;
  sideChainSource: string;
}

interface NormalizerSettings {
  targetLUFS: number; // LUFS
  peakLimit: number; // dB
  enabled: boolean;
  mode: 'peak' | 'rms' | 'lufs';
  gateThreshold: number; // dB
  integrationTime: number; // seconds
}

interface LimiterSettings {
  ceiling: number; // dB
  release: number; // ms
  enabled: boolean;
  isr: number; // Internal Sample Rate multiplier
  lookahead: number; // ms
}

interface GateSettings {
  threshold: number; // dB
  ratio: number;
  attack: number; // ms
  release: number; // ms
  enabled: boolean;
  holdTime: number; // ms
}

const defaultCompressorSettings: CompressorSettings = {
  threshold: -18,
  ratio: 4,
  attack: 3,
  release: 100,
  knee: 2,
  makeupGain: 0,
  enabled: false,
  lookAhead: 5,
  sideChainEnabled: false,
  sideChainSource: ''
};

const defaultNormalizerSettings: NormalizerSettings = {
  targetLUFS: -23,
  peakLimit: -1,
  enabled: false,
  mode: 'lufs',
  gateThreshold: -70,
  integrationTime: 3
};

const defaultLimiterSettings: LimiterSettings = {
  ceiling: -0.1,
  release: 50,
  enabled: false,
  isr: 4,
  lookahead: 5
};

const defaultGateSettings: GateSettings = {
  threshold: -40,
  ratio: 10,
  attack: 1,
  release: 100,
  enabled: false,
  holdTime: 10
};

const compressorPresets = {
  vocal: {
    name: 'Vocal',
    settings: { threshold: -12, ratio: 3, attack: 2, release: 80, knee: 2, makeupGain: 3 }
  },
  drums: {
    name: 'Bateria',
    settings: { threshold: -8, ratio: 6, attack: 0.5, release: 50, knee: 1, makeupGain: 2 }
  },
  bass: {
    name: 'Baixo',
    settings: { threshold: -15, ratio: 4, attack: 5, release: 120, knee: 3, makeupGain: 2 }
  },
  master: {
    name: 'Master Bus',
    settings: { threshold: -6, ratio: 2.5, attack: 10, release: 100, knee: 2, makeupGain: 1 }
  },
  gentle: {
    name: 'Suave',
    settings: { threshold: -20, ratio: 2, attack: 10, release: 200, knee: 4, makeupGain: 1 }
  },
  aggressive: {
    name: 'Agressivo',
    settings: { threshold: -10, ratio: 8, attack: 1, release: 30, knee: 0.5, makeupGain: 4 }
  }
};

export const AudioCompressor: React.FC<AudioCompressorProps> = ({
  audioTracks,
  onUpdateTrack,
  isPlaying,
  currentTime
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>(audioTracks[0]?.id || '');
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(defaultCompressorSettings);
  const [normalizerSettings, setNormalizerSettings] = useState<NormalizerSettings>(defaultNormalizerSettings);
  const [limiterSettings, setLimiterSettings] = useState<LimiterSettings>(defaultLimiterSettings);
  const [gateSettings, setGateSettings] = useState<GateSettings>(defaultGateSettings);
  const [activeTab, setActiveTab] = useState<'compressor' | 'normalizer' | 'limiter' | 'gate'>('compressor');
  const [gainReduction, setGainReduction] = useState<number>(0);
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    rms: number;
    peak: number;
    lufs: number;
    dynamicRange: number;
  }>({ rms: 0, peak: 0, lufs: 0, dynamicRange: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Create compressor node
        if (!compressorNodeRef.current) {
          compressorNodeRef.current = audioContextRef.current.createDynamicsCompressor();
        }

        // Create analyser node
        if (!analyserNodeRef.current) {
          analyserNodeRef.current = audioContextRef.current.createAnalyser();
          analyserNodeRef.current.fftSize = 2048;
        }

        // Create gain node for makeup gain
        if (!gainNodeRef.current) {
          gainNodeRef.current = audioContextRef.current.createGain();
        }

        // Connect nodes
        compressorNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyserNodeRef.current);
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

  // Update compressor parameters
  useEffect(() => {
    if (compressorNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      
      compressorNodeRef.current.threshold.setValueAtTime(compressorSettings.threshold, now);
      compressorNodeRef.current.ratio.setValueAtTime(compressorSettings.ratio, now);
      compressorNodeRef.current.attack.setValueAtTime(compressorSettings.attack / 1000, now);
      compressorNodeRef.current.release.setValueAtTime(compressorSettings.release / 1000, now);
      compressorNodeRef.current.knee.setValueAtTime(compressorSettings.knee, now);
    }
  }, [compressorSettings]);

  // Update makeup gain
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      const gainValue = Math.pow(10, compressorSettings.makeupGain / 20);
      gainNodeRef.current.gain.setValueAtTime(gainValue, audioContextRef.current.currentTime);
    }
  }, [compressorSettings.makeupGain]);

  // Start analysis when playing
  useEffect(() => {
    if (isPlaying) {
      startAnalysis();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying]);

  const startAnalysis = useCallback(() => {
    const analyze = () => {
      if (!analyserNodeRef.current || !compressorNodeRef.current) return;

      const bufferLength = analyserNodeRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDataArray = new Float32Array(bufferLength);
      
      analyserNodeRef.current.getByteFrequencyData(dataArray);
      analyserNodeRef.current.getFloatTimeDomainData(timeDataArray);

      // Calculate levels
      let sum = 0;
      let peak = 0;
      
      for (let i = 0; i < timeDataArray.length; i++) {
        const sample = Math.abs(timeDataArray[i]);
        sum += sample * sample;
        peak = Math.max(peak, sample);
      }
      
      const rms = Math.sqrt(sum / timeDataArray.length);
      const rmsDb = 20 * Math.log10(rms + 1e-10);
      const peakDb = 20 * Math.log10(peak + 1e-10);
      
      setInputLevel(rmsDb);
      setOutputLevel(peakDb);
      
      // Get gain reduction from compressor
      const reduction = compressorNodeRef.current.reduction;
      setGainReduction(Math.abs(reduction));
      
      // Update analysis data
      setAnalysisData(prev => ({
        ...prev,
        rms: rmsDb,
        peak: peakDb,
        lufs: rmsDb - 0.691, // Approximate LUFS conversion
        dynamicRange: peakDb - rmsDb
      }));

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = compressorPresets[presetKey as keyof typeof compressorPresets];
    if (preset) {
      setCompressorSettings(prev => ({
        ...prev,
        ...preset.settings
      }));
    }
  }, []);

  const resetSettings = useCallback(() => {
    setCompressorSettings(defaultCompressorSettings);
    setNormalizerSettings(defaultNormalizerSettings);
    setLimiterSettings(defaultLimiterSettings);
    setGateSettings(defaultGateSettings);
  }, []);

  const processNormalization = useCallback(async () => {
    if (!selectedTrack) return;
    
    // Simulate normalization process
    const track = audioTracks.find(t => t.id === selectedTrack);
    if (!track) return;

    try {
      // Calculate target gain based on normalization settings
      let targetGain = 1;
      
      if (normalizerSettings.mode === 'peak') {
        const headroom = normalizerSettings.peakLimit - analysisData.peak;
        targetGain = Math.pow(10, headroom / 20);
      } else if (normalizerSettings.mode === 'rms') {
        const headroom = normalizerSettings.peakLimit - analysisData.rms;
        targetGain = Math.pow(10, headroom / 20);
      } else if (normalizerSettings.mode === 'lufs') {
        const headroom = normalizerSettings.targetLUFS - analysisData.lufs;
        targetGain = Math.pow(10, headroom / 20);
      }
      
      // Apply gain to track
      const newVolume = Math.min(1, Math.max(0, track.volume * targetGain));
      
      onUpdateTrack(selectedTrack, {
        volume: newVolume,
        effects: [
          ...track.effects.filter(e => e.type !== 'normalizer'),
          {
            id: `normalizer_${Date.now()}`,
            type: 'normalizer',
            enabled: true,
            parameters: {
              gain: 20 * Math.log10(targetGain),
              targetLUFS: normalizerSettings.targetLUFS,
              peakLimit: normalizerSettings.peakLimit
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error processing normalization:', error);
    }
  }, [selectedTrack, audioTracks, normalizerSettings, analysisData, onUpdateTrack]);

  const LevelMeter: React.FC<{ level: number; label: string; color: string }> = ({ level, label, color }) => {
    const normalizedLevel = Math.max(0, Math.min(100, (level + 60) / 60 * 100));
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium w-12">{label}:</span>
        <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
          <div 
            className="h-full transition-all duration-100"
            style={{
              width: `${normalizedLevel}%`,
              backgroundColor: color
            }}
          />
        </div>
        <span className="text-xs font-mono w-12 text-right">
          {level.toFixed(1)}dB
        </span>
      </div>
    );
  };

  const CompressorCurve: React.FC = () => {
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
      
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        const y = (i / 10) * height;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw 1:1 line
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width, 0);
      ctx.stroke();
      
      // Draw compression curve
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const threshold = compressorSettings.threshold;
      const ratio = compressorSettings.ratio;
      const knee = compressorSettings.knee;
      
      for (let x = 0; x < width; x++) {
        const inputDb = (x / width) * 60 - 60; // -60dB to 0dB
        let outputDb = inputDb;
        
        if (inputDb > threshold) {
          if (knee > 0 && inputDb < threshold + knee) {
            // Soft knee
            const kneeRatio = (inputDb - threshold) / knee;
            const softRatio = 1 + (ratio - 1) * kneeRatio * kneeRatio;
            outputDb = threshold + (inputDb - threshold) / softRatio;
          } else {
            // Hard compression
            outputDb = threshold + (inputDb - threshold) / ratio;
          }
        }
        
        const y = height - ((outputDb + 60) / 60) * height;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Draw threshold line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      const thresholdX = ((threshold + 60) / 60) * width;
      ctx.beginPath();
      ctx.moveTo(thresholdX, 0);
      ctx.lineTo(thresholdX, height);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Labels
      ctx.fillStyle = '#ccc';
      ctx.font = '10px Arial';
      ctx.fillText('Input (dB)', 5, height - 5);
      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Output (dB)', 0, 0);
      ctx.restore();
      
    }, [compressorSettings]);
    
    return (
      <canvas
        ref={canvasRef}
        width={200}
        height={150}
        className="border border-gray-600 rounded"
      />
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold">Compressor & Normalização</h3>
        </div>
        
        <div className="flex items-center gap-2">
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
            { key: 'compressor', name: 'Compressor', icon: Zap },
            { key: 'normalizer', name: 'Normalização', icon: TrendingUp },
            { key: 'limiter', name: 'Limiter', icon: Volume2 },
            { key: 'gate', name: 'Gate', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-t text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
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

      {/* Level Meters */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h4 className="text-sm font-medium mb-2">Níveis</h4>
        <div className="space-y-2">
          <LevelMeter level={inputLevel} label="Input" color="#3b82f6" />
          <LevelMeter level={outputLevel} label="Output" color="#10b981" />
          <LevelMeter level={-gainReduction} label="GR" color="#ef4444" />
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400">RMS:</span>
            <span className="ml-2 font-mono">{analysisData.rms.toFixed(1)}dB</span>
          </div>
          <div>
            <span className="text-gray-400">Peak:</span>
            <span className="ml-2 font-mono">{analysisData.peak.toFixed(1)}dB</span>
          </div>
          <div>
            <span className="text-gray-400">LUFS:</span>
            <span className="ml-2 font-mono">{analysisData.lufs.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-gray-400">DR:</span>
            <span className="ml-2 font-mono">{analysisData.dynamicRange.toFixed(1)}dB</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'compressor' && (
          <div className="space-y-4">
            {/* Enable/Disable */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compressorSettings.enabled}
                onChange={(e) => setCompressorSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span className="font-medium">Ativar Compressor</span>
            </label>

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Presets:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(compressorPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Compression Curve */}
            <div>
              <label className="block text-sm font-medium mb-2">Curva de Compressão:</label>
              <CompressorCurve />
            </div>

            {/* Main Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Threshold */}
              <div>
                <label className="block text-sm font-medium mb-1">Threshold:</label>
                <input
                  type="range"
                  min="-60"
                  max="0"
                  step="0.1"
                  value={compressorSettings.threshold}
                  onChange={(e) => setCompressorSettings(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{compressorSettings.threshold.toFixed(1)}dB</div>
              </div>

              {/* Ratio */}
              <div>
                <label className="block text-sm font-medium mb-1">Ratio:</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.1"
                  value={compressorSettings.ratio}
                  onChange={(e) => setCompressorSettings(prev => ({ ...prev, ratio: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{compressorSettings.ratio.toFixed(1)}:1</div>
              </div>

              {/* Attack */}
              <div>
                <label className="block text-sm font-medium mb-1">Attack:</label>
                <input
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={compressorSettings.attack}
                  onChange={(e) => setCompressorSettings(prev => ({ ...prev, attack: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{compressorSettings.attack.toFixed(1)}ms</div>
              </div>

              {/* Release */}
              <div>
                <label className="block text-sm font-medium mb-1">Release:</label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="1"
                  value={compressorSettings.release}
                  onChange={(e) => setCompressorSettings(prev => ({ ...prev, release: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{compressorSettings.release}ms</div>
              </div>

              {/* Knee */}
              <div>
                <label className="block text-sm font-medium mb-1">Knee:</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={compressorSettings.knee}
                  onChange={(e) => setCompressorSettings(prev => ({ ...prev, knee: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{compressorSettings.knee.toFixed(1)}dB</div>
              </div>

              {/* Makeup Gain */}
              <div>
                <label className="block text-sm font-medium mb-1">Makeup Gain:</label>
                <input
                  type="range"
                  min="-10"
                  max="20"
                  step="0.1"
                  value={compressorSettings.makeupGain}
                  onChange={(e) => setCompressorSettings(prev => ({ ...prev, makeupGain: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">{compressorSettings.makeupGain.toFixed(1)}dB</div>
              </div>
            </div>

            {/* Advanced Controls */}
            {showAdvanced && (
              <div className="p-4 bg-gray-800 rounded">
                <h4 className="text-sm font-medium mb-3">Controles Avançados</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Look Ahead */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Look Ahead:</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.1"
                      value={compressorSettings.lookAhead}
                      onChange={(e) => setCompressorSettings(prev => ({ ...prev, lookAhead: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">{compressorSettings.lookAhead.toFixed(1)}ms</div>
                  </div>

                  {/* Side Chain */}
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={compressorSettings.sideChainEnabled}
                        onChange={(e) => setCompressorSettings(prev => ({ ...prev, sideChainEnabled: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Side Chain</span>
                    </label>
                    
                    {compressorSettings.sideChainEnabled && (
                      <select
                        value={compressorSettings.sideChainSource}
                        onChange={(e) => setCompressorSettings(prev => ({ ...prev, sideChainSource: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                      >
                        <option value="">Selecionar fonte</option>
                        {audioTracks.filter(t => t.id !== selectedTrack).map(track => (
                          <option key={track.id} value={track.id}>
                            {track.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'normalizer' && (
          <div className="space-y-4">
            {/* Enable/Disable */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={normalizerSettings.enabled}
                onChange={(e) => setNormalizerSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span className="font-medium">Ativar Normalização</span>
            </label>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Modo:</label>
              <select
                value={normalizerSettings.mode}
                onChange={(e) => setNormalizerSettings(prev => ({ ...prev, mode: e.target.value as any }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              >
                <option value="peak">Peak Normalization</option>
                <option value="rms">RMS Normalization</option>
                <option value="lufs">LUFS Normalization</option>
              </select>
            </div>

            {/* Target Level */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {normalizerSettings.mode === 'lufs' ? 'Target LUFS:' : 'Target Level:'}
              </label>
              <input
                type="range"
                min={normalizerSettings.mode === 'lufs' ? '-30' : '-20'}
                max={normalizerSettings.mode === 'lufs' ? '-10' : '0'}
                step="0.1"
                value={normalizerSettings.mode === 'lufs' ? normalizerSettings.targetLUFS : normalizerSettings.peakLimit}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (normalizerSettings.mode === 'lufs') {
                    setNormalizerSettings(prev => ({ ...prev, targetLUFS: value }));
                  } else {
                    setNormalizerSettings(prev => ({ ...prev, peakLimit: value }));
                  }
                }}
                className="w-full"
              />
              <div className="text-xs text-gray-400">
                {normalizerSettings.mode === 'lufs' 
                  ? `${normalizerSettings.targetLUFS.toFixed(1)} LUFS`
                  : `${normalizerSettings.peakLimit.toFixed(1)}dB`
                }
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={processNormalization}
              disabled={!normalizerSettings.enabled}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              Processar Normalização
            </button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="p-4 bg-gray-800 rounded">
                <h4 className="text-sm font-medium mb-3">Configurações Avançadas</h4>
                
                <div className="space-y-4">
                  {/* Gate Threshold */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Gate Threshold:</label>
                    <input
                      type="range"
                      min="-80"
                      max="-40"
                      step="1"
                      value={normalizerSettings.gateThreshold}
                      onChange={(e) => setNormalizerSettings(prev => ({ ...prev, gateThreshold: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">{normalizerSettings.gateThreshold}dB</div>
                  </div>

                  {/* Integration Time */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Integration Time:</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.1"
                      value={normalizerSettings.integrationTime}
                      onChange={(e) => setNormalizerSettings(prev => ({ ...prev, integrationTime: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">{normalizerSettings.integrationTime.toFixed(1)}s</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'limiter' && (
          <div className="space-y-4">
            {/* Enable/Disable */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={limiterSettings.enabled}
                onChange={(e) => setLimiterSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span className="font-medium">Ativar Limiter</span>
            </label>

            {/* Ceiling */}
            <div>
              <label className="block text-sm font-medium mb-1">Ceiling:</label>
              <input
                type="range"
                min="-3"
                max="0"
                step="0.1"
                value={limiterSettings.ceiling}
                onChange={(e) => setLimiterSettings(prev => ({ ...prev, ceiling: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{limiterSettings.ceiling.toFixed(1)}dB</div>
            </div>

            {/* Release */}
            <div>
              <label className="block text-sm font-medium mb-1">Release:</label>
              <input
                type="range"
                min="1"
                max="1000"
                step="1"
                value={limiterSettings.release}
                onChange={(e) => setLimiterSettings(prev => ({ ...prev, release: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{limiterSettings.release}ms</div>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="p-4 bg-gray-800 rounded">
                <h4 className="text-sm font-medium mb-3">Configurações Avançadas</h4>
                
                <div className="space-y-4">
                  {/* ISR */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Internal Sample Rate:</label>
                    <select
                      value={limiterSettings.isr}
                      onChange={(e) => setLimiterSettings(prev => ({ ...prev, isr: Number(e.target.value) }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                    >
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={4}>4x</option>
                      <option value={8}>8x</option>
                    </select>
                  </div>

                  {/* Lookahead */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Lookahead:</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.1"
                      value={limiterSettings.lookahead}
                      onChange={(e) => setLimiterSettings(prev => ({ ...prev, lookahead: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">{limiterSettings.lookahead.toFixed(1)}ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gate' && (
          <div className="space-y-4">
            {/* Enable/Disable */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gateSettings.enabled}
                onChange={(e) => setGateSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span className="font-medium">Ativar Gate</span>
            </label>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium mb-1">Threshold:</label>
              <input
                type="range"
                min="-80"
                max="-10"
                step="1"
                value={gateSettings.threshold}
                onChange={(e) => setGateSettings(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{gateSettings.threshold}dB</div>
            </div>

            {/* Ratio */}
            <div>
              <label className="block text-sm font-medium mb-1">Ratio:</label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={gateSettings.ratio}
                onChange={(e) => setGateSettings(prev => ({ ...prev, ratio: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{gateSettings.ratio}:1</div>
            </div>

            {/* Attack */}
            <div>
              <label className="block text-sm font-medium mb-1">Attack:</label>
              <input
                type="range"
                min="0.1"
                max="100"
                step="0.1"
                value={gateSettings.attack}
                onChange={(e) => setGateSettings(prev => ({ ...prev, attack: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{gateSettings.attack.toFixed(1)}ms</div>
            </div>

            {/* Release */}
            <div>
              <label className="block text-sm font-medium mb-1">Release:</label>
              <input
                type="range"
                min="10"
                max="5000"
                step="10"
                value={gateSettings.release}
                onChange={(e) => setGateSettings(prev => ({ ...prev, release: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{gateSettings.release}ms</div>
            </div>

            {/* Hold Time */}
            <div>
              <label className="block text-sm font-medium mb-1">Hold Time:</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="1"
                value={gateSettings.holdTime}
                onChange={(e) => setGateSettings(prev => ({ ...prev, holdTime: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{gateSettings.holdTime}ms</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCompressor;