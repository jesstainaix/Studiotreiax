import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Settings, Play, Pause, RotateCcw, Equalizer, Zap, Music, BarChart3, Compress, TrendingUp } from 'lucide-react';
import { AudioEqualizer } from './audio/AudioEqualizer';
import { AudioWaveform } from './audio/AudioWaveform';
import { AudioMixer } from './audio/AudioMixer';
import { NoiseReduction } from './audio/NoiseReduction';
import { SpectrumAnalyzer } from './audio/SpectrumAnalyzer';
import { SoundEffectsLibrary } from './audio/SoundEffectsLibrary';
import { AudioSync } from './audio/AudioSync';
import { AudioCompressor } from './audio/AudioCompressor';
import { VoiceEnhancer } from './audio/VoiceEnhancer';

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

interface AudioEditorProps {
  tracks: AudioTrack[];
  onTracksChange: (tracks: AudioTrack[]) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({
  tracks,
  onTracksChange,
  currentTime,
  duration,
  isPlaying,
  onTimeChange
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'mixer' | 'equalizer' | 'noise-reduction' | 'spectrum' | 'effects' | 'sync' | 'compressor' | 'voice'>('mixer');
  const [masterVolume, setMasterVolume] = useState(100);
  const [masterMuted, setMasterMuted] = useState(false);
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

  const handleTrackUpdate = useCallback((trackId: string, updates: Partial<AudioTrack>) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    onTracksChange(updatedTracks);
  }, [tracks, onTracksChange]);

  const handleEffectAdd = useCallback((trackId: string, effect: AudioEffect) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const updatedTrack = {
        ...track,
        effects: [...track.effects, effect]
      };
      handleTrackUpdate(trackId, updatedTrack);
    }
  }, [tracks, handleTrackUpdate]);

  const handleEffectRemove = useCallback((trackId: string, effectId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const updatedTrack = {
        ...track,
        effects: track.effects.filter(e => e.id !== effectId)
      };
      handleTrackUpdate(trackId, updatedTrack);
    }
  }, [tracks, handleTrackUpdate]);

  const renderActivePanel = () => {
    const selectedTrackData = tracks.find(t => t.id === selectedTrack);

    switch (activePanel) {
      case 'mixer':
        return (
          <AudioMixer
            tracks={tracks}
            onTrackUpdate={handleTrackUpdate}
            masterVolume={masterVolume}
            masterMuted={masterMuted}
            onMasterVolumeChange={setMasterVolume}
            onMasterMutedChange={setMasterMuted}
          />
        );
      case 'equalizer':
        return selectedTrackData ? (
          <AudioEqualizer
            track={selectedTrackData}
            onTrackUpdate={(updates) => handleTrackUpdate(selectedTrack!, updates)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma faixa para usar o equalizador
          </div>
        );
      case 'noise-reduction':
        return selectedTrackData ? (
          <NoiseReduction
            track={selectedTrackData}
            onTrackUpdate={(updates) => handleTrackUpdate(selectedTrack!, updates)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma faixa para redução de ruído
          </div>
        );
      case 'spectrum':
        return (
          <SpectrumAnalyzer
            audioContext={audioContextRef.current}
            analyser={analyserRef.current}
            isPlaying={isPlaying}
          />
        );
      case 'effects':
        return (
          <SoundEffectsLibrary
            onEffectSelect={(effect) => {
              if (selectedTrack) {
                handleEffectAdd(selectedTrack, effect);
              }
            }}
          />
        );
      case 'sync':
        return (
          <AudioSync
            tracks={tracks}
            currentTime={currentTime}
            duration={duration}
            onTimeChange={onTimeChange}
          />
        );
      case 'compressor':
        return selectedTrackData ? (
          <AudioCompressor
            track={selectedTrackData}
            onTrackUpdate={(updates) => handleTrackUpdate(selectedTrack!, updates)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma faixa para compressão
          </div>
        );
      case 'voice':
        return selectedTrackData ? (
          <VoiceEnhancer
            track={selectedTrackData}
            onTrackUpdate={(updates) => handleTrackUpdate(selectedTrack!, updates)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma faixa para melhoria de voz
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            Editor de Áudio
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Master:</span>
              <button
                onClick={() => setMasterMuted(!masterMuted)}
                className={`p-2 rounded ${masterMuted ? 'bg-red-600' : 'bg-gray-600'} hover:bg-opacity-80`}
              >
                {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={masterMuted ? 0 : masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-20"
                disabled={masterMuted}
              />
              <span className="text-sm w-8">{masterMuted ? 0 : masterVolume}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Panel Tabs */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold mb-3">Ferramentas</h3>
            <div className="space-y-1">
              {[
                { id: 'mixer', label: 'Mixer', icon: Volume2 },
                { id: 'equalizer', label: 'Equalizador', icon: Equalizer },
                { id: 'noise-reduction', label: 'Redução de Ruído', icon: Zap },
                { id: 'spectrum', label: 'Analisador', icon: BarChart3 },
                { id: 'effects', label: 'Efeitos', icon: Music },
                { id: 'sync', label: 'Sincronização', icon: Play },
                { id: 'compressor', label: 'Compressor', icon: Compress },
                { id: 'voice', label: 'Voz', icon: TrendingUp }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActivePanel(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    activePanel === id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Track List */}
          <div className="flex-1 p-4">
            <h3 className="text-sm font-semibold mb-3">Faixas de Áudio</h3>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTrack === track.id
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{track.name}</span>
                    <div className="flex items-center gap-1">
                      {track.solo && (
                        <span className="text-xs bg-yellow-600 px-1 rounded">S</span>
                      )}
                      {track.muted && (
                        <span className="text-xs bg-red-600 px-1 rounded">M</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Volume: {track.volume}% | Efeitos: {track.effects.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Waveform Display */}
          <div className="h-32 bg-gray-800 border-b border-gray-700">
            <AudioWaveform
              tracks={tracks}
              currentTime={currentTime}
              duration={duration}
              onTimeChange={onTimeChange}
              selectedTrack={selectedTrack}
            />
          </div>

          {/* Active Panel */}
          <div className="flex-1 p-4">
            {renderActivePanel()}
            
            {/* Waveform Visualization - Always visible at bottom */}
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium mb-3 text-gray-300">Visualização de Áudio</h4>
              <AudioWaveform
                tracks={tracks}
                currentTime={currentTime}
                duration={duration}
                onTimeChange={onTimeChange}
                selectedTrack={selectedTrack}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audio