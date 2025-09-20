import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  RotateCcw,
  Settings,
  Headphones,
  Mic,
  Radio
} from 'lucide-react';

interface AudioScrubberProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  onTimeChange: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onTogglePlayback: () => void;
  onSeek: (direction: 'forward' | 'backward', amount: number) => void;
  showAdvancedControls?: boolean;
  className?: string;
}

export const AudioScrubber: React.FC<AudioScrubberProps> = ({
  audioUrl,
  audioBuffer,
  currentTime,
  duration,
  isPlaying,
  volume,
  playbackRate,
  onTimeChange,
  onVolumeChange,
  onPlaybackRateChange,
  onTogglePlayback,
  onSeek,
  showAdvancedControls = true,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [isScubbing, setIsScrubbing] = useState(false);
  const [showFrequencyAnalyzer, setShowFrequencyAnalyzer] = useState(false);

  // Initialize audio context and nodes
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    
    gain.connect(ctx.destination);
    gain.gain.value = volume;
    
    setAudioContext(ctx);
    setGainNode(gain);

    return () => {
      if (sourceNode) {
        sourceNode.disconnect();
        sourceNode.stop();
      }
      ctx.close();
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.setValueAtTime(volume, audioContext?.currentTime || 0);
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, gainNode, audioContext]);

  // Setup audio source
  useEffect(() => {
    if (!audioContext || !audioBuffer || !gainNode) return;

    // Stop previous source
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode.stop();
    }

    // Create new source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    source.connect(gainNode);
    
    setSourceNode(source);

    return () => {
      source.disconnect();
    };
  }, [audioContext, audioBuffer, gainNode, playbackRate]);

  // Handle precise time scrubbing
  const handleTimeChange = useCallback((newTime: number) => {
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    onTimeChange(clampedTime);
  }, [duration, onTimeChange]);

  // Frame-accurate seeking
  const seekFrame = useCallback((direction: 'forward' | 'backward') => {
    const frameDuration = 1 / 30; // 30fps
    const newTime = direction === 'forward' 
      ? currentTime + frameDuration 
      : currentTime - frameDuration;
    
    handleTimeChange(newTime);
  }, [currentTime, handleTimeChange]);

  // Precise time seeking
  const seekTime = useCallback((direction: 'forward' | 'backward', seconds: number) => {
    const newTime = direction === 'forward' 
      ? currentTime + seconds 
      : currentTime - seconds;
    
    handleTimeChange(newTime);
    onSeek(direction, seconds);
  }, [currentTime, handleTimeChange, onSeek]);

  // Format time display
  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Playback rate presets
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Audio element for fallback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}

      {/* Main controls */}
      <div className="flex items-center space-x-4">
        {/* Playback controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => seekTime('backward', 10)}
            title="Skip back 10s"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => seekFrame('backward')}
            title="Previous frame"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            onClick={onTogglePlayback}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => seekFrame('forward')}
            title="Next frame"
          >
            <RotateCcw className="w-3 h-3 scale-x-[-1]" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => seekTime('forward', 10)}
            title="Skip forward 10s"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Time display */}
        <div className="flex items-center space-x-2 text-sm font-mono">
          <span className="text-blue-400">{formatTime(currentTime)}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300">{formatTime(duration)}</span>
        </div>

        {/* Volume control */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
          >
            {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          
          <Slider
            value={[volume]}
            onValueChange={([value]) => onVolumeChange(value)}
            max={1}
            step={0.01}
            className="w-20"
          />
          
          <span className="text-xs text-gray-400 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Playback rate */}
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {playbackRate}x
          </Badge>
          
          <div className="flex space-x-1">
            {playbackRates.map(rate => (
              <Button
                key={rate}
                size="sm"
                variant={playbackRate === rate ? "default" : "ghost"}
                onClick={() => onPlaybackRateChange(rate)}
                className="text-xs px-2 py-1 h-6"
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Audio Scrubber</span>
          <span>{Math.round((currentTime / duration) * 100)}%</span>
        </div>
        
        <Slider
          value={[currentTime]}
          onValueChange={([value]) => {
            setIsScrubbing(true);
            handleTimeChange(value);
          }}
          onValueCommit={() => setIsScrubbing(false)}
          max={duration}
          step={1/30} // Frame accuracy
          className="w-full"
        />

        {/* Fine scrubbing controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleTimeChange(currentTime - 0.1)}
              className="text-xs px-2 py-1 h-6"
            >
              -0.1s
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleTimeChange(currentTime + 0.1)}
              className="text-xs px-2 py-1 h-6"
            >
              +0.1s
            </Button>
          </div>

          {showAdvancedControls && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFrequencyAnalyzer(!showFrequencyAnalyzer)}
                title="Toggle frequency analyzer"
              >
                <Radio className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                title="Audio settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced audio info */}
      {showAdvancedControls && (
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Headphones className="w-3 h-3" />
              <span>48kHz</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mic className="w-3 h-3" />
              <span>Stereo</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {isScubbing ? 'Scrubbing' : isPlaying ? 'Playing' : 'Paused'}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioScrubber;