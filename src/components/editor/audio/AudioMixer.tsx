import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, RotateCcw, Settings } from 'lucide-react';

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

interface AudioMixerProps {
  tracks: AudioTrack[];
  onTrackUpdate: (trackId: string, updates: Partial<AudioTrack>) => void;
  masterVolume: number;
  masterMuted: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMutedChange: (muted: boolean) => void;
}

interface ChannelStrip {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number;
  gain: number;
  highEQ: number;
  midEQ: number;
  lowEQ: number;
  aux1: number;
  aux2: number;
  peakLevel: number;
  rmsLevel: number;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({
  tracks,
  onTrackUpdate,
  masterVolume,
  masterMuted,
  onMasterVolumeChange,
  onMasterMutedChange
}) => {
  const [channelStrips, setChannelStrips] = useState<Map<string, ChannelStrip>>(new Map());
  const [soloMode, setSoloMode] = useState(false);
  const [recordArm, setRecordArm] = useState<Set<string>>(new Set());
  const [vuMeters, setVuMeters] = useState<Map<string, { peak: number; rms: number }>>(new Map());

  // Initialize channel strips from tracks
  useEffect(() => {
    const newChannelStrips = new Map<string, ChannelStrip>();
    
    tracks.forEach(track => {
      if (!channelStrips.has(track.id)) {
        newChannelStrips.set(track.id, {
          id: track.id,
          name: track.name,
          volume: track.volume,
          muted: track.muted,
          solo: track.solo,
          pan: 0,
          gain: 0,
          highEQ: 0,
          midEQ: 0,
          lowEQ: 0,
          aux1: 0,
          aux2: 0,
          peakLevel: 0,
          rmsLevel: 0
        });
      } else {
        const existing = channelStrips.get(track.id)!;
        newChannelStrips.set(track.id, {
          ...existing,
          name: track.name,
          volume: track.volume,
          muted: track.muted,
          solo: track.solo
        });
      }
    });
    
    setChannelStrips(newChannelStrips);
  }, [tracks]);

  // Check if any track is soloed
  useEffect(() => {
    const hasSolo = tracks.some(track => track.solo);
    setSoloMode(hasSolo);
  }, [tracks]);

  // Simulate VU meters (in real implementation, this would come from audio analysis)
  useEffect(() => {
    const interval = setInterval(() => {
      const newVuMeters = new Map<string, { peak: number; rms: number }>();
      
      tracks.forEach(track => {
        if (!track.muted && (!soloMode || track.solo)) {
          // Simulate audio levels (replace with real audio analysis)
          const peak = Math.random() * 100;
          const rms = peak * 0.7;
          newVuMeters.set(track.id, { peak, rms });
        } else {
          newVuMeters.set(track.id, { peak: 0, rms: 0 });
        }
      });
      
      setVuMeters(newVuMeters);
    }, 50);

    return () => clearInterval(interval);
  }, [tracks, soloMode]);

  const handleChannelUpdate = useCallback((trackId: string, property: keyof ChannelStrip, value: number | boolean | string) => {
    const channel = channelStrips.get(trackId);
    if (!channel) return;

    const updatedChannel = { ...channel, [property]: value };
    setChannelStrips(prev => new Map(prev).set(trackId, updatedChannel));

    // Update track if it's a track property
    if (['volume', 'muted', 'solo'].includes(property)) {
      onTrackUpdate(trackId, { [property]: value });
    }
  }, [channelStrips, onTrackUpdate]);

  const handleSolo = useCallback((trackId: string) => {
    const channel = channelStrips.get(trackId);
    if (!channel) return;

    const newSolo = !channel.solo;
    handleChannelUpdate(trackId, 'solo', newSolo);
  }, [channelStrips, handleChannelUpdate]);

  const handleMute = useCallback((trackId: string) => {
    const channel = channelStrips.get(trackId);
    if (!channel) return;

    const newMuted = !channel.muted;
    handleChannelUpdate(trackId, 'muted', newMuted);
  }, [channelStrips, handleChannelUpdate]);

  const handleRecordArm = useCallback((trackId: string) => {
    setRecordArm(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  }, []);

  const resetChannel = useCallback((trackId: string) => {
    const channel = channelStrips.get(trackId);
    if (!channel) return;

    const resetChannel = {
      ...channel,
      volume: 100,
      pan: 0,
      gain: 0,
      highEQ: 0,
      midEQ: 0,
      lowEQ: 0,
      aux1: 0,
      aux2: 0
    };
    
    setChannelStrips(prev => new Map(prev).set(trackId, resetChannel));
    onTrackUpdate(trackId, { volume: 100 });
  }, [channelStrips, onTrackUpdate]);

  const VUMeter: React.FC<{ trackId: string; height: number }> = ({ trackId, height }) => {
    const levels = vuMeters.get(trackId) || { peak: 0, rms: 0 };
    const peakHeight = (levels.peak / 100) * height;
    const rmsHeight = (levels.rms / 100) * height;

    return (
      <div className="w-4 bg-gray-800 rounded relative" style={{ height }}>
        {/* Background segments */}
        <div className="absolute inset-0 flex flex-col-reverse">
          {Array.from({ length: 20 }, (_, i) => {
            const segmentHeight = height / 20;
            const level = (i / 20) * 100;
            let color = '#10B981'; // Green
            if (level > 70) color = '#F59E0B'; // Yellow
            if (level > 85) color = '#EF4444'; // Red
            
            return (
              <div
                key={i}
                className="border-b border-gray-700"
                style={{
                  height: segmentHeight,
                  backgroundColor: level <= levels.peak ? color : 'transparent'
                }}
              />
            );
          })}
        </div>
        
        {/* Peak indicator */}
        {levels.peak > 85 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
        )}
      </div>
    );
  };

  const ChannelStripComponent: React.FC<{ channel: ChannelStrip }> = ({ channel }) => {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded p-2 w-20 flex flex-col gap-2">
        {/* Channel Name */}
        <div className="text-xs font-medium text-center truncate" title={channel.name}>
          {channel.name}
        </div>
        
        {/* Gain */}
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">GAIN</label>
          <input
            type="range"
            min="-20"
            max="20"
            step="0.5"
            value={channel.gain}
            onChange={(e) => handleChannelUpdate(channel.id, 'gain', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">{channel.gain > 0 ? '+' : ''}{channel.gain}dB</span>
        </div>
        
        {/* High EQ */}
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">HIGH</label>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={channel.highEQ}
            onChange={(e) => handleChannelUpdate(channel.id, 'highEQ', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">{channel.highEQ > 0 ? '+' : ''}{channel.highEQ}</span>
        </div>
        
        {/* Mid EQ */}
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">MID</label>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={channel.midEQ}
            onChange={(e) => handleChannelUpdate(channel.id, 'midEQ', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">{channel.midEQ > 0 ? '+' : ''}{channel.midEQ}</span>
        </div>
        
        {/* Low EQ */}
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">LOW</label>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={channel.lowEQ}
            onChange={(e) => handleChannelUpdate(channel.id, 'lowEQ', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">{channel.lowEQ > 0 ? '+' : ''}{channel.lowEQ}</span>
        </div>
        
        {/* Aux Sends */}
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">AUX1</label>
          <input
            type="range"
            min="0"
            max="100"
            value={channel.aux1}
            onChange={(e) => handleChannelUpdate(channel.id, 'aux1', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">{channel.aux1}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">AUX2</label>
          <input
            type="range"
            min="0"
            max="100"
            value={channel.aux2}
            onChange={(e) => handleChannelUpdate(channel.id, 'aux2', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">{channel.aux2}</span>
        </div>
        
        {/* Pan */}
        <div className="flex flex-col items-center">
          <label className="text-xs text-gray-400">PAN</label>
          <input
            type="range"
            min="-100"
            max="100"
            value={channel.pan}
            onChange={(e) => handleChannelUpdate(channel.id, 'pan', Number(e.target.value))}
            className="w-full h-1"
          />
          <span className="text-xs">
            {channel.pan === 0 ? 'C' : channel.pan > 0 ? `R${channel.pan}` : `L${Math.abs(channel.pan)}`}
          </span>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleRecordArm(channel.id)}
            className={`text-xs py-1 rounded font-medium ${
              recordArm.has(channel.id)
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            REC
          </button>
          
          <button
            onClick={() => handleSolo(channel.id)}
            className={`text-xs py-1 rounded font-medium ${
              channel.solo
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            SOLO
          </button>
          
          <button
            onClick={() => handleMute(channel.id)}
            className={`text-xs py-1 rounded font-medium ${
              channel.muted
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            MUTE
          </button>
        </div>
        
        {/* Volume Fader */}
        <div className="flex-1 flex flex-col items-center justify-end">
          <VUMeter trackId={channel.id} height={120} />
          <div className="mt-2 h-32 flex items-center">
            <input
              type="range"
              min="0"
              max="150"
              value={channel.volume}
              onChange={(e) => handleChannelUpdate(channel.id, 'volume', Number(e.target.value))}
              className="h-32 slider-vertical"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical',
                width: '20px'
              }}
            />
          </div>
          <span className="text-xs mt-1">{channel.volume}</span>
        </div>
        
        {/* Reset Button */}
        <button
          onClick={() => resetChannel(channel.id)}
          className="text-xs p-1 bg-gray-600 hover:bg-gray-500 rounded"
          title="Reset Channel"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mixer de Áudio</h3>
          <div className="flex items-center gap-4">
            {soloMode && (
              <div className="flex items-center gap-2 text-yellow-500">
                <Headphones className="w-4 h-4" />
                <span className="text-sm">Modo Solo Ativo</span>
              </div>
            )}
            <div className="text-sm text-gray-400">
              {tracks.length} canal{tracks.length !== 1 ? 'is' : ''}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mixer Channels */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-2 h-full">
          {/* Channel Strips */}
          {Array.from(channelStrips.values()).map(channel => (
            <ChannelStripComponent key={channel.id} channel={channel} />
          ))}
          
          {/* Master Channel */}
          <div className="bg-gray-700 border border-gray-600 rounded p-2 w-24 flex flex-col gap-2 ml-4">
            <div className="text-xs font-bold text-center text-yellow-400">
              MASTER
            </div>
            
            {/* Master VU Meter */}
            <div className="flex justify-center">
              <VUMeter trackId="master" height={120} />
            </div>
            
            {/* Master Mute */}
            <button
              onClick={() => onMasterMutedChange(!masterMuted)}
              className={`text-xs py-1 rounded font-medium ${
                masterMuted
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              MUTE
            </button>
            
            {/* Master Volume */}
            <div className="flex-1 flex flex-col items-center justify-end">
              <div className="h-32 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={masterMuted ? 0 : masterVolume}
                  onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                  className="h-32 slider-vertical"
                  style={{
                    writingMode: 'bt-lr',
                    WebkitAppearance: 'slider-vertical',
                    width: '24px'
                  }}
                  disabled={masterMuted}
                />
              </div>
              <span className="text-xs mt-1 font-bold">
                {masterMuted ? 0 : masterVolume}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {tracks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Nenhuma faixa de áudio</p>
            <p className="text-sm">Adicione faixas de áudio para usar o mixer</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioMixer;