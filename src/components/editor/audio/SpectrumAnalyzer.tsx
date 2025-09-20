import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Settings, Pause, Play, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

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

interface SpectrumAnalyzerProps {
  audioTracks: AudioTrack[];
  isPlaying: boolean;
  currentTime: number;
  masterVolume: number;
}

interface FrequencyBand {
  frequency: number;
  magnitude: number;
  label: string;
}

interface AnalyzerSettings {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  frequencyRange: { min: number; max: number };
  updateRate: number;
  showPeaks: boolean;
  showAverage: boolean;
  colorScheme: string;
}

const defaultSettings: AnalyzerSettings = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  frequencyRange: { min: 20, max: 20000 },
  updateRate: 60,
  showPeaks: true,
  showAverage: false,
  colorScheme: 'spectrum'
};

const colorSchemes = {
  spectrum: {
    name: 'Espectro',
    colors: ['#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF']
  },
  fire: {
    name: 'Fogo',
    colors: ['#000000', '#800000', '#FF0000', '#FF8000', '#FFFF00', '#FFFFFF']
  },
  ice: {
    name: 'Gelo',
    colors: ['#000080', '#0000FF', '#0080FF', '#00FFFF', '#80FFFF', '#FFFFFF']
  },
  monochrome: {
    name: 'Monocromático',
    colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF']
  },
  neon: {
    name: 'Neon',
    colors: ['#000000', '#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#80FF00']
  }
};

const frequencyBands = [
  { name: 'Sub Bass', min: 20, max: 60, color: '#8B0000' },
  { name: 'Bass', min: 60, max: 250, color: '#FF4500' },
  { name: 'Low Mid', min: 250, max: 500, color: '#FFD700' },
  { name: 'Mid', min: 500, max: 2000, color: '#32CD32' },
  { name: 'High Mid', min: 2000, max: 4000, color: '#00CED1' },
  { name: 'Presence', min: 4000, max: 6000, color: '#4169E1' },
  { name: 'Brilliance', min: 6000, max: 20000, color: '#9932CC' }
];

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  audioTracks,
  isPlaying,
  currentTime,
  masterVolume
}) => {
  const [settings, setSettings] = useState<AnalyzerSettings>(defaultSettings);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Float32Array>(new Float32Array(1024));
  const [peakData, setPeakData] = useState<Float32Array>(new Float32Array(1024));
  const [averageData, setAverageData] = useState<Float32Array>(new Float32Array(1024));
  const [selectedTrack, setSelectedTrack] = useState<string>('master');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'bars' | 'line' | 'spectrogram'>('bars');
  const [spectrogramData, setSpectrogramData] = useState<number[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(1024));
  const peakHoldRef = useRef<number[]>(new Array(1024).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(1024).fill(0));
  const averageHistoryRef = useRef<number[][]>([]);

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = settings.fftSize;
          analyserRef.current.smoothingTimeConstant = settings.smoothingTimeConstant;
          analyserRef.current.minDecibels = settings.minDecibels;
          analyserRef.current.maxDecibels = settings.maxDecibels;
          
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
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
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update analyzer settings
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = settings.fftSize;
      analyserRef.current.smoothingTimeConstant = settings.smoothingTimeConstant;
      analyserRef.current.minDecibels = settings.minDecibels;
      analyserRef.current.maxDecibels = settings.maxDecibels;
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      peakHoldRef.current = new Array(analyserRef.current.frequencyBinCount).fill(0);
      peakDecayRef.current = new Array(analyserRef.current.frequencyBinCount).fill(0);
    }
  }, [settings.fftSize, settings.smoothingTimeConstant, settings.minDecibels, settings.maxDecibels]);

  // Start/stop analysis
  useEffect(() => {
    if (isPlaying && !isAnalyzing) {
      setIsAnalyzing(true);
      startAnalysis();
    } else if (!isPlaying && isAnalyzing) {
      setIsAnalyzing(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying]);

  const startAnalysis = useCallback(() => {
    const analyze = () => {
      if (!analyserRef.current || !isAnalyzing) return;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Convert to float array for processing
      const floatData = new Float32Array(dataArrayRef.current.length);
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        floatData[i] = dataArrayRef.current[i] / 255.0;
      }
      
      setFrequencyData(floatData);

      // Update peak hold
      if (settings.showPeaks) {
        for (let i = 0; i < floatData.length; i++) {
          if (floatData[i] > peakHoldRef.current[i]) {
            peakHoldRef.current[i] = floatData[i];
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] += 0.01;
            peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - peakDecayRef.current[i]);
          }
        }
        setPeakData(new Float32Array(peakHoldRef.current));
      }

      // Update average
      if (settings.showAverage) {
        averageHistoryRef.current.push([...floatData]);
        if (averageHistoryRef.current.length > 30) { // Keep last 30 frames
          averageHistoryRef.current.shift();
        }
        
        const avgData = new Float32Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
          let sum = 0;
          for (const frame of averageHistoryRef.current) {
            sum += frame[i];
          }
          avgData[i] = sum / averageHistoryRef.current.length;
        }
        setAverageData(avgData);
      }

      // Update spectrogram
      if (viewMode === 'spectrogram') {
        setSpectrogramData(prev => {
          const newData = [...prev, [...floatData]];
          return newData.slice(-200); // Keep last 200 frames
        });
      }

      // Draw visualization
      drawVisualization(floatData);

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [isAnalyzing, settings, viewMode]);

  const drawVisualization = useCallback((data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    if (viewMode === 'bars') {
      drawBars(ctx, data, width, height);
    } else if (viewMode === 'line') {
      drawLine(ctx, data, width, height);
    } else if (viewMode === 'spectrogram') {
      drawSpectrogram(ctx, width, height);
    }

    // Draw frequency labels
    drawFrequencyLabels(ctx, width, height);
    
    // Draw level indicators
    drawLevelIndicators(ctx, width, height);
  }, [viewMode, settings, spectrogramData]);

  const drawBars = (ctx: CanvasRenderingContext2D, data: Float32Array, width: number, height: number) => {
    const barWidth = width / data.length;
    const colors = colorSchemes[settings.colorScheme as keyof typeof colorSchemes].colors;
    
    for (let i = 0; i < data.length; i++) {
      const barHeight = data[i] * height;
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Get color based on frequency
      const colorIndex = Math.floor((i / data.length) * (colors.length - 1));
      const color = colors[colorIndex];
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Draw peak hold
      if (settings.showPeaks && peakData[i] > 0) {
        const peakY = height - (peakData[i] * height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, peakY - 1, barWidth - 1, 2);
      }
      
      // Draw average
      if (settings.showAverage && averageData[i] > 0) {
        const avgY = height - (averageData[i] * height);
        ctx.fillStyle = '#808080';
        ctx.fillRect(x, avgY - 1, barWidth - 1, 1);
      }
    }
  };

  const drawLine = (ctx: CanvasRenderingContext2D, data: Float32Array, width: number, height: number) => {
    ctx.strokeStyle = colorSchemes[settings.colorScheme as keyof typeof colorSchemes].colors[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      const y = height - (data[i] * height);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  const drawSpectrogram = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (spectrogramData.length === 0) return;
    
    const timeSliceWidth = width / spectrogramData.length;
    const freqBinHeight = height / spectrogramData[0].length;
    
    for (let t = 0; t < spectrogramData.length; t++) {
      for (let f = 0; f < spectrogramData[t].length; f++) {
        const intensity = spectrogramData[t][f];
        const x = t * timeSliceWidth;
        const y = height - (f + 1) * freqBinHeight;
        
        // Map intensity to color
        const colorIndex = Math.floor(intensity * (colorSchemes[settings.colorScheme as keyof typeof colorSchemes].colors.length - 1));
        const color = colorSchemes[settings.colorScheme as keyof typeof colorSchemes].colors[colorIndex];
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, timeSliceWidth, freqBinHeight);
      }
    }
  };

  const drawFrequencyLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    
    frequencies.forEach(freq => {
      if (freq >= settings.frequencyRange.min && freq <= settings.frequencyRange.max) {
        const x = (Math.log10(freq / settings.frequencyRange.min) / Math.log10(settings.frequencyRange.max / settings.frequencyRange.min)) * width;
        ctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, x, height - 5);
        
        // Draw grid line
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 20);
        ctx.stroke();
      }
    });
  };

  const drawLevelIndicators = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    
    const levels = [-60, -40, -20, -10, -6, -3, 0];
    
    levels.forEach(level => {
      const y = height - ((level - settings.minDecibels) / (settings.maxDecibels - settings.minDecibels)) * height;
      if (y >= 0 && y <= height) {
        ctx.fillText(`${level}dB`, width - 5, y + 3);
        
        // Draw grid line
        ctx.strokeStyle = level === 0 ? '#FF0000' : '#333333';
        ctx.lineWidth = level === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 40, y);
        ctx.stroke();
      }
    });
  };

  const resetAnalyzer = useCallback(() => {
    setFrequencyData(new Float32Array(1024));
    setPeakData(new Float32Array(1024));
    setAverageData(new Float32Array(1024));
    setSpectrogramData([]);
    peakHoldRef.current = new Array(1024).fill(0);
    peakDecayRef.current = new Array(1024).fill(0);
    averageHistoryRef.current = [];
  }, []);

  const FrequencyBandMeter: React.FC = () => {
    const getBandLevel = (band: typeof frequencyBands[0]): number => {
      if (!analyserRef.current) return 0;
      
      const nyquist = audioContextRef.current!.sampleRate / 2;
      const minBin = Math.floor((band.min / nyquist) * analyserRef.current.frequencyBinCount);
      const maxBin = Math.floor((band.max / nyquist) * analyserRef.current.frequencyBinCount);
      
      let sum = 0;
      let count = 0;
      
      for (let i = minBin; i <= maxBin && i < frequencyData.length; i++) {
        sum += frequencyData[i];
        count++;
      }
      
      return count > 0 ? sum / count : 0;
    };

    return (
      <div className="grid grid-cols-7 gap-2 mb-4">
        {frequencyBands.map((band, index) => {
          const level = getBandLevel(band);
          return (
            <div key={index} className="text-center">
              <div className="text-xs font-medium mb-1">{band.name}</div>
              <div className="h-20 bg-gray-800 rounded relative overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 transition-all duration-100"
                  style={{
                    height: `${level * 100}%`,
                    backgroundColor: band.color
                  }}
                />
                <div className="absolute inset-0 flex items-end justify-center pb-1">
                  <span className="text-xs text-white font-mono">
                    {Math.round(level * 100)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Analisador de Espectro</h3>
          <div className={`px-2 py-1 rounded text-xs ${
            isAnalyzing ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isAnalyzing ? 'ATIVO' : 'PARADO'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded transition-colors ${
              showSettings ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={resetAnalyzer}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
          <option value="master">Master Output</option>
          {audioTracks.map(track => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
      </div>

      {/* View Mode */}
      <div className="mb-4">
        <div className="flex gap-2">
          {[{ key: 'bars', name: 'Barras' }, { key: 'line', name: 'Linha' }, { key: 'spectrogram', name: 'Espectrograma' }].map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === mode.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h4 className="text-sm font-medium mb-3">Configurações</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* FFT Size */}
            <div>
              <label className="block text-xs font-medium mb-1">FFT Size:</label>
              <select
                value={settings.fftSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fftSize: Number(e.target.value) }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value={512}>512</option>
                <option value={1024}>1024</option>
                <option value={2048}>2048</option>
                <option value={4096}>4096</option>
                <option value={8192}>8192</option>
              </select>
            </div>

            {/* Smoothing */}
            <div>
              <label className="block text-xs font-medium mb-1">Suavização:</label>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.05"
                value={settings.smoothingTimeConstant}
                onChange={(e) => setSettings(prev => ({ ...prev, smoothingTimeConstant: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{(settings.smoothingTimeConstant * 100).toFixed(0)}%</div>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="block text-xs font-medium mb-1">Esquema de Cores:</label>
              <select
                value={settings.colorScheme}
                onChange={(e) => setSettings(prev => ({ ...prev, colorScheme: e.target.value }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <option key={key} value={key}>{scheme.name}</option>
                ))}
              </select>
            </div>

            {/* Min Decibels */}
            <div>
              <label className="block text-xs font-medium mb-1">Min dB:</label>
              <input
                type="range"
                min="-120"
                max="-30"
                step="5"
                value={settings.minDecibels}
                onChange={(e) => setSettings(prev => ({ ...prev, minDecibels: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{settings.minDecibels}dB</div>
            </div>

            {/* Max Decibels */}
            <div>
              <label className="block text-xs font-medium mb-1">Max dB:</label>
              <input
                type="range"
                min="-30"
                max="0"
                step="1"
                value={settings.maxDecibels}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDecibels: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{settings.maxDecibels}dB</div>
            </div>

            {/* Update Rate */}
            <div>
              <label className="block text-xs font-medium mb-1">Taxa de Atualização:</label>
              <select
                value={settings.updateRate}
                onChange={(e) => setSettings(prev => ({ ...prev, updateRate: Number(e.target.value) }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
                <option value={120}>120 FPS</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showPeaks}
                onChange={(e) => setSettings(prev => ({ ...prev, showPeaks: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Mostrar Picos</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showAverage}
                onChange={(e) => setSettings(prev => ({ ...prev, showAverage: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Mostrar Média</span>
            </label>
          </div>
        </div>
      )}

      {/* Frequency Band Meters */}
      <FrequencyBandMeter />

      {/* Main Analyzer Canvas */}
      <div className="flex-1 bg-gray-900 rounded relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {!isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <Play className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-400">Reproduza o áudio para ver a análise</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-4 flex justify-between text-xs text-gray-400">
        <div>
          FFT: {settings.fftSize} | Suavização: {(settings.smoothingTimeConstant * 100).toFixed(0)}%
        </div>
        <div>
          {settings.frequencyRange.min}Hz - {settings.frequencyRange.max}Hz | {settings.minDecibels}dB - {settings.maxDecibels}dB
        </div>
        <div>
          Master: {Math.round(masterVolume * 100)}% | Tempo: {currentTime.toFixed(1)}s
        </div>
      </div>
    </div>
  );
};

export default SpectrumAnalyzer;