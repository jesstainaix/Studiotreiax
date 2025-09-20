import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  Music, 
  Radio,
  Settings, 
  MoreVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Move,
  Headphones,
  Speaker,
  Equalizer,
  Filter,
  Zap
} from 'lucide-react';
import WaveformRenderer from './WaveformRenderer';

interface AudioTrack {
  id: string;
  name: string;
  type: 'master' | 'music' | 'voice' | 'sfx' | 'ambient';
  url?: string;
  buffer?: AudioBuffer;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  visible: boolean;
  locked: boolean;
  color: string;
  effects: AudioEffect[];
  sends: AudioSend[];
  automation: AutomationPoint[];
}

interface AudioEffect {
  id: string;
  name: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'distortion' | 'filter';
  enabled: boolean;
  parameters: Record<string, number>;
  bypass: boolean;
}

interface AudioSend {
  id: string;
  target: string;
  amount: number;
  enabled: boolean;
}

interface AutomationPoint {
  time: number;
  parameter: string;
  value: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
}

interface MultiTrackAudioMixerProps {
  tracks: AudioTrack[];
  currentTime: number;
  isPlaying: boolean;
  onTrackUpdate: (trackId: string, updates: Partial<AudioTrack>) => void;
  onTrackAdd: (type: AudioTrack['type']) => void;
  onTrackRemove: (trackId: string) => void;
  onTrackReorder: (trackIds: string[]) => void;
  showAdvancedControls?: boolean;
  className?: string;
}

export const MultiTrackAudioMixer: React.FC<MultiTrackAudioMixerProps> = ({
  tracks,
  currentTime,
  isPlaying,
  onTrackUpdate,
  onTrackAdd,
  onTrackRemove,
  onTrackReorder,
  showAdvancedControls = true,
  className = ''
}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [showMasterControls, setShowMasterControls] = useState(true);
  const [analysisData, setAnalysisData] = useState<Record<string, Float32Array>>({});

  // Audio nodes map
  const audioNodes = useRef<Map<string, {
    source?: AudioBufferSourceNode;
    gain: GainNode;
    pan: StereoPannerNode;
    effects: AudioNode[];
    analyzer: AnalyserNode;
  }>>(new Map());

  // Initialize audio context
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);

    return () => {
      ctx.close();
    };
  }, []);

  // Setup audio nodes for each track
  useEffect(() => {
    if (!audioContext) return;

    tracks.forEach(track => {
      if (!audioNodes.current.has(track.id)) {
        const gain = audioContext.createGain();
        const pan = audioContext.createStereoPanner();
        const analyzer = audioContext.createAnalyser();
        
        // Set initial values
        gain.gain.value = track.volume;
        pan.pan.value = track.pan;
        
        // Connect nodes: source -> effects -> gain -> pan -> analyzer -> destination
        gain.connect(pan);
        pan.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        audioNodes.current.set(track.id, {
          gain,
          pan,
          effects: [],
          analyzer
        });
      }
    });

    // Clean up removed tracks
    audioNodes.current.forEach((nodes, trackId) => {
      if (!tracks.find(t => t.id === trackId)) {
        nodes.gain.disconnect();
        nodes.pan.disconnect();
        nodes.analyzer.disconnect();
        audioNodes.current.delete(trackId);
      }
    });
  }, [tracks, audioContext]);

  // Update track audio parameters
  const updateTrackAudio = useCallback((track: AudioTrack) => {
    const nodes = audioNodes.current.get(track.id);
    if (!nodes || !audioContext) return;

    // Update volume
    nodes.gain.gain.setTargetAtTime(
      track.muted ? 0 : track.volume,
      audioContext.currentTime,
      0.01
    );

    // Update pan
    nodes.pan.pan.setTargetAtTime(
      track.pan,
      audioContext.currentTime,
      0.01
    );
  }, [audioContext]);

  // Handle track parameter changes
  const handleTrackChange = useCallback((trackId: string, parameter: string, value: any) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const updates: Partial<AudioTrack> = { [parameter]: value };
    onTrackUpdate(trackId, updates);

    // Apply audio changes immediately
    updateTrackAudio({ ...track, [parameter]: value });
  }, [tracks, onTrackUpdate, updateTrackAudio]);

  // Toggle solo mode
  const handleSolo = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newSolo = !track.solo;
    
    // If enabling solo, mute all other tracks
    if (newSolo) {
      tracks.forEach(t => {
        if (t.id !== trackId) {
          onTrackUpdate(t.id, { muted: true });
        }
      });
    } else {
      // If disabling solo, unmute all tracks
      tracks.forEach(t => {
        onTrackUpdate(t.id, { muted: false });
      });
    }

    onTrackUpdate(trackId, { solo: newSolo });
  }, [tracks, onTrackUpdate]);

  // Get track type icon
  const getTrackIcon = (type: AudioTrack['type']) => {
    switch (type) {
      case 'master': return <Speaker className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'sfx': return <Zap className="w-4 h-4" />;
      case 'ambient': return <Radio className="w-4 h-4" />;
      default: return <Volume2 className="w-4 h-4" />;
    }
  };

  // Get track type color
  const getTrackColor = (type: AudioTrack['type']) => {
    switch (type) {
      case 'master': return '#ef4444';
      case 'music': return '#3b82f6';
      case 'voice': return '#10b981';
      case 'sfx': return '#f59e0b';
      case 'ambient': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Format time for automation
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Master Controls */}
      {showMasterControls && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Speaker className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold">Master Mix</h3>
              <Badge variant="outline" className="text-xs">
                {tracks.length} tracks
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMasterControls(false)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Master Volume */}
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Slider
                value={[masterVolume]}
                onValueChange={([value]) => setMasterVolume(value)}
                max={1}
                step={0.01}
                className="w-32"
              />
              <span className="text-xs text-gray-400 w-12">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>

            {/* Master Controls */}
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Equalizer className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* Add Track */}
            <div className="flex items-center space-x-1 ml-auto">
              {['music', 'voice', 'sfx', 'ambient'].map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant="ghost"
                  onClick={() => onTrackAdd(type as AudioTrack['type'])}
                  title={`Add ${type} track`}
                  className="text-xs px-2 py-1"
                >
                  {getTrackIcon(type as AudioTrack['type'])}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="divide-y divide-gray-700">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`p-4 hover:bg-gray-800/50 transition-colors ${
              selectedTracks.includes(track.id) ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Track Info */}
              <div className="flex items-center space-x-3 min-w-[200px]">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: track.color || getTrackColor(track.type) }}
                />
                
                <div className="flex items-center space-x-2">
                  {getTrackIcon(track.type)}
                  <span className="font-medium text-sm">{track.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {track.type}
                  </Badge>
                </div>
              </div>

              {/* Track Controls */}
              <div className="flex items-center space-x-2">
                {/* Visibility */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTrackChange(track.id, 'visible', !track.visible)}
                  className={`p-1 ${!track.visible ? 'text-gray-500' : ''}`}
                >
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>

                {/* Lock */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTrackChange(track.id, 'locked', !track.locked)}
                  className={`p-1 ${track.locked ? 'text-yellow-500' : ''}`}
                >
                  {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>

                {/* Mute */}
                <Button
                  size="sm"
                  variant={track.muted ? "default" : "ghost"}
                  onClick={() => handleTrackChange(track.id, 'muted', !track.muted)}
                  className={`p-1 ${track.muted ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>

                {/* Solo */}
                <Button
                  size="sm"
                  variant={track.solo ? "default" : "ghost"}
                  onClick={() => handleSolo(track.id)}
                  className={`p-1 text-xs ${track.solo ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                >
                  S
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Slider
                  value={[track.volume]}
                  onValueChange={([value]) => handleTrackChange(track.id, 'volume', value)}
                  max={1}
                  step={0.01}
                  className="w-24"
                />
                <span className="text-xs text-gray-400 w-10">
                  {Math.round(track.volume * 100)}%
                </span>
              </div>

              {/* Pan Control */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">L</span>
                <Slider
                  value={[track.pan]}
                  onValueChange={([value]) => handleTrackChange(track.id, 'pan', value)}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-16"
                />
                <span className="text-xs text-gray-400">R</span>
              </div>

              {/* Waveform */}
              {track.url && track.visible && (
                <div className="flex-1 min-w-0">
                  <WaveformRenderer
                    audioUrl={track.url}
                    width={200}
                    height={40}
                    startTime={0}
                    duration={10}
                    zoom={20}
                    currentTime={currentTime}
                    color={track.color || getTrackColor(track.type)}
                    className="rounded"
                  />
                </div>
              )}

              {/* Track Actions */}
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" className="p-1">
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="p-1">
                  <Move className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onTrackRemove(track.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="p-1">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Effects and Advanced Controls */}
            {showAdvancedControls && track.effects.length > 0 && (
              <div className="mt-3 pl-6 flex items-center space-x-2">
                <span className="text-xs text-gray-400">Effects:</span>
                {track.effects.map(effect => (
                  <Badge 
                    key={effect.id} 
                    variant={effect.enabled ? "default" : "outline"}
                    className="text-xs"
                  >
                    {effect.name}
                  </Badge>
                ))}
                <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-6">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Track Button */}
      {tracks.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Music className="w-8 h-8 mx-auto mb-2" />
            <p>No audio tracks</p>
          </div>
          <Button onClick={() => onTrackAdd('music')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Audio Track
          </Button>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Time: {formatTime(currentTime)}</span>
          <span>Master: {Math.round(masterVolume * 100)}%</span>
          <span>Tracks: {tracks.filter(t => !t.muted).length}/{tracks.length}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {isPlaying ? 'Playing' : 'Paused'}
          </Badge>
          <Headphones className="w-3 h-3" />
          <span>48kHz/24bit</span>
        </div>
      </div>
    </div>
  );
};

export default MultiTrackAudioMixer;