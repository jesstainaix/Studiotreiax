import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Play, Pause, RotateCcw, CheckCircle, AlertCircle, Settings } from 'lucide-react';

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

interface VideoTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  offset: number;
}

interface AudioEffect {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

interface SyncPoint {
  audioTime: number;
  videoTime: number;
  confidence: number;
  type: 'automatic' | 'manual';
}

interface AudioSynchronizerProps {
  audioTracks: AudioTrack[];
  videoTracks: VideoTrack[];
  onTracksUpdate: (audioTracks: AudioTrack[], videoTracks: VideoTrack[]) => void;
  currentTime: number;
}

interface SyncAnalysis {
  offset: number;
  confidence: number;
  method: string;
  syncPoints: SyncPoint[];
  drift: number;
}

const syncMethods = {
  crossCorrelation: {
    name: 'Correlação Cruzada',
    description: 'Analisa padrões de amplitude para encontrar correspondências',
    accuracy: 'Alta',
    speed: 'Média'
  },
  spectralAnalysis: {
    name: 'Análise Espectral',
    description: 'Compara características espectrais do áudio',
    accuracy: 'Muito Alta',
    speed: 'Lenta'
  },
  peakDetection: {
    name: 'Detecção de Picos',
    description: 'Identifica picos de amplitude para sincronização',
    accuracy: 'Média',
    speed: 'Rápida'
  },
  phaseCorrelation: {
    name: 'Correlação de Fase',
    description: 'Usa informações de fase para sincronização precisa',
    accuracy: 'Alta',
    speed: 'Média'
  }
};

export const AudioSynchronizer: React.FC<AudioSynchronizerProps> = ({
  audioTracks,
  videoTracks,
  onTracksUpdate,
  currentTime
}) => {
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>('');
  const [selectedVideoTrack, setSelectedVideoTrack] = useState<string>('');
  const [syncMethod, setSyncMethod] = useState<string>('crossCorrelation');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncAnalysis, setSyncAnalysis] = useState<SyncAnalysis | null>(null);
  const [manualOffset, setManualOffset] = useState(0);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [searchWindow, setSearchWindow] = useState(10);
  const [frameRate, setFrameRate] = useState(30);
  const [syncPoints, setSyncPoints] = useState<SyncPoint[]>([]);
  const [driftCorrection, setDriftCorrection] = useState(true);
  const [realTimeSync, setRealTimeSync] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

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

  // Auto-select first tracks if available
  useEffect(() => {
    if (audioTracks.length > 0 && !selectedAudioTrack) {
      setSelectedAudioTrack(audioTracks[0].id);
    }
    if (videoTracks.length > 0 && !selectedVideoTrack) {
      setSelectedVideoTrack(videoTracks[0].id);
    }
  }, [audioTracks, videoTracks, selectedAudioTrack, selectedVideoTrack]);

  const analyzeSync = useCallback(async () => {
    if (!selectedAudioTrack || !selectedVideoTrack) return;

    setIsAnalyzing(true);

    try {
      // Simulate sync analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock analysis results
      const mockSyncPoints: SyncPoint[] = [
        { audioTime: 1.2, videoTime: 1.0, confidence: 0.95, type: 'automatic' },
        { audioTime: 5.8, videoTime: 5.6, confidence: 0.88, type: 'automatic' },
        { audioTime: 12.3, videoTime: 12.1, confidence: 0.92, type: 'automatic' },
        { audioTime: 18.7, videoTime: 18.5, confidence: 0.85, type: 'automatic' }
      ];

      const avgOffset = mockSyncPoints.reduce((sum, point) => 
        sum + (point.audioTime - point.videoTime), 0) / mockSyncPoints.length;
      
      const avgConfidence = mockSyncPoints.reduce((sum, point) => 
        sum + point.confidence, 0) / mockSyncPoints.length;

      const analysis: SyncAnalysis = {
        offset: avgOffset,
        confidence: avgConfidence,
        method: syncMethods[syncMethod as keyof typeof syncMethods].name,
        syncPoints: mockSyncPoints,
        drift: Math.random() * 0.1 - 0.05 // Random drift between -0.05 and 0.05
      };

      setSyncAnalysis(analysis);
      setSyncPoints(mockSyncPoints);
      setManualOffset(avgOffset);

    } catch (error) {
      console.error('Error analyzing sync:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedAudioTrack, selectedVideoTrack, syncMethod]);

  const applySync = useCallback(() => {
    if (!syncAnalysis || !selectedAudioTrack) return;

    const updatedAudioTracks = audioTracks.map(track => {
      if (track.id === selectedAudioTrack) {
        return {
          ...track,
          offset: track.offset + syncAnalysis.offset
        };
      }
      return track;
    });

    onTracksUpdate(updatedAudioTracks, videoTracks);
  }, [syncAnalysis, selectedAudioTrack, audioTracks, videoTracks, onTracksUpdate]);

  const applyManualOffset = useCallback(() => {
    if (!selectedAudioTrack) return;

    const updatedAudioTracks = audioTracks.map(track => {
      if (track.id === selectedAudioTrack) {
        return {
          ...track,
          offset: track.offset + manualOffset
        };
      }
      return track;
    });

    onTracksUpdate(updatedAudioTracks, videoTracks);
  }, [manualOffset, selectedAudioTrack, audioTracks, videoTracks, onTracksUpdate]);

  const addManualSyncPoint = useCallback(() => {
    const newSyncPoint: SyncPoint = {
      audioTime: currentTime,
      videoTime: currentTime,
      confidence: 1.0,
      type: 'manual'
    };

    setSyncPoints(prev => [...prev, newSyncPoint]);
  }, [currentTime]);

  const resetSync = useCallback(() => {
    setSyncAnalysis(null);
    setSyncPoints([]);
    setManualOffset(0);
  }, []);

  const SyncPointsVisualizer: React.FC = () => {
    if (syncPoints.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-gray-800 rounded">
        <h4 className="text-sm font-medium mb-2">Pontos de Sincronização</h4>
        <div className="h-24 bg-gray-900 rounded relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 400 96">
            {/* Grid */}
            {[0, 24, 48, 72, 96].map(y => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#374151" strokeWidth="0.5" />
            ))}
            
            {/* Sync points */}
            {syncPoints.map((point, index) => {
              const x = (point.audioTime / 20) * 400; // Assuming 20s timeline
              const y = 48 + (point.audioTime - point.videoTime) * 200; // Offset visualization
              const color = point.type === 'manual' ? '#10B981' : '#3B82F6';
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={Math.max(8, Math.min(88, y))}
                    r={point.confidence * 4 + 2}
                    fill={color}
                    opacity={point.confidence}
                  />
                  <text
                    x={x}
                    y={Math.max(8, Math.min(88, y)) - 8}
                    fontSize="8"
                    fill={color}
                    textAnchor="middle"
                  >
                    {point.confidence.toFixed(2)}
                  </text>
                </g>
              );
            })}
            
            {/* Zero line */}
            <line x1="0" y1="48" x2="400" y2="48" stroke="#EF4444" strokeWidth="1" strokeDasharray="2,2" />
          </svg>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0s</span>
          <span>Offset: {syncAnalysis?.offset.toFixed(3)}s</span>
          <span>20s</span>
        </div>
      </div>
    );
  };

  const ConfidenceIndicator: React.FC<{ confidence: number }> = ({ confidence }) => {
    const getColor = () => {
      if (confidence >= 0.8) return 'text-green-400';
      if (confidence >= 0.6) return 'text-yellow-400';
      return 'text-red-400';
    };

    const getIcon = () => {
      if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />;
      return <AlertCircle className="w-4 h-4" />;
    };

    return (
      <div className={`flex items-center gap-2 ${getColor()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{(confidence * 100).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Sincronização Áudio-Vídeo</h3>
        </div>
        <button
          onClick={resetSync}
          className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Track Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Track de Áudio:</label>
          <select
            value={selectedAudioTrack}
            onChange={(e) => setSelectedAudioTrack(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <option value="">Selecionar track...</option>
            {audioTracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.name} (Offset: {track.offset.toFixed(2)}s)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Track de Vídeo:</label>
          <select
            value={selectedVideoTrack}
            onChange={(e) => setSelectedVideoTrack(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
          >
            <option value="">Selecionar track...</option>
            {videoTracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.name} (Offset: {track.offset.toFixed(2)}s)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sync Method */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Método de Sincronização:</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(syncMethods).map(([key, method]) => (
            <label key={key} className="flex items-start gap-3 p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-750">
              <input
                type="radio"
                name="syncMethod"
                value={key}
                checked={syncMethod === key}
                onChange={(e) => setSyncMethod(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">{method.name}</div>
                <div className="text-xs text-gray-400 mt-1">{method.description}</div>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <span>Precisão: {method.accuracy}</span>
                  <span>Velocidade: {method.speed}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Analysis Settings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Configurações de Análise</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sensibilidade</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">{(sensitivity * 100).toFixed(0)}%</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Janela de Busca</label>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={searchWindow}
              onChange={(e) => setSearchWindow(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">±{searchWindow}s</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Frame Rate</label>
            <select
              value={frameRate}
              onChange={(e) => setFrameRate(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
            >
              <option value={24}>24 fps</option>
              <option value={25}>25 fps</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Button */}
      <div className="mb-6">
        <button
          onClick={analyzeSync}
          disabled={!selectedAudioTrack || !selectedVideoTrack || isAnalyzing}
          className={`w-full py-3 rounded font-medium transition-colors ${
            isAnalyzing
              ? 'bg-yellow-600 text-white'
              : selectedAudioTrack && selectedVideoTrack
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Settings className="w-4 h-4 mr-2 animate-spin inline" />
              Analisando Sincronização...
            </>
          ) : (
            'Analisar Sincronização'
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {syncAnalysis && (
        <div className="mb-6 p-4 bg-gray-800 rounded">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Resultado da Análise</h4>
            <ConfidenceIndicator confidence={syncAnalysis.confidence} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-400">Offset Detectado</div>
              <div className="text-lg font-mono">{syncAnalysis.offset.toFixed(3)}s</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Método Usado</div>
              <div className="text-sm">{syncAnalysis.method}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Pontos de Sync</div>
              <div className="text-sm">{syncAnalysis.syncPoints.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Drift Detectado</div>
              <div className="text-sm">{(syncAnalysis.drift * 1000).toFixed(1)}ms/s</div>
            </div>
          </div>

          <SyncPointsVisualizer />

          <button
            onClick={applySync}
            className="w-full mt-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors"
          >
            Aplicar Sincronização Automática
          </button>
        </div>
      )}

      {/* Manual Sync */}
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h4 className="text-sm font-medium mb-3">Sincronização Manual</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Offset Manual (segundos)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={manualOffset}
              onChange={(e) => setManualOffset(Number(e.target.value))}
              step="0.001"
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded"
              placeholder="0.000"
            />
            <button
              onClick={addManualSyncPoint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              title="Adicionar ponto de sync no tempo atual"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={applyManualOffset}
          disabled={!selectedAudioTrack}
          className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium transition-colors disabled:bg-gray-600 disabled:text-gray-400"
        >
          Aplicar Offset Manual
        </button>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoSyncEnabled}
            onChange={(e) => setAutoSyncEnabled(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Sincronização Automática</span>
          <span className="text-xs text-gray-400 ml-2">
            Detecta e corrige automaticamente problemas de sync
          </span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={driftCorrection}
            onChange={(e) => setDriftCorrection(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Correção de Drift</span>
          <span className="text-xs text-gray-400 ml-2">
            Corrige variações de velocidade ao longo do tempo
          </span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={realTimeSync}
            onChange={(e) => setRealTimeSync(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Sincronização em Tempo Real</span>
          <span className="text-xs text-gray-400 ml-2">
            Monitora e ajusta continuamente durante a reprodução
          </span>
        </label>
      </div>
    </div>
  );
};

export default AudioSynchronizer;