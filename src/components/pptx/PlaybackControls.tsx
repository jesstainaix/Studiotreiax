import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Repeat,
  Gauge
} from 'lucide-react';
import { TimelineState } from './TimelineEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface PlaybackControlsProps {
  timelineState: TimelineState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  timelineState,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onSpeedChange
}) => {
  const [isLooping, setIsLooping] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (value: number[]) => {
    onSeek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    onVolumeChange(value[0] / 100);
  };

  const handleSkipBackward = () => {
    onSeek(Math.max(0, timelineState.currentTime - 5));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(timelineState.totalDuration, timelineState.currentTime + 5));
  };

  const speedOptions = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center gap-4">
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            disabled={!timelineState.isPlaying && timelineState.currentTime === 0}
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipBackward}
            disabled={timelineState.currentTime === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            onClick={timelineState.isPlaying && !timelineState.isPaused ? onPause : onPlay}
            className="w-10 h-10"
          >
            {timelineState.isPlaying && !timelineState.isPaused ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipForward}
            disabled={timelineState.currentTime >= timelineState.totalDuration}
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={isLooping ? "default" : "outline"}
            onClick={() => setIsLooping(!isLooping)}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-sm text-gray-600 w-16 text-right">
            {formatTime(timelineState.currentTime)}
          </span>
          
          <div className="flex-1">
            <Slider
              value={[timelineState.currentTime]}
              max={timelineState.totalDuration || 1}
              step={0.1}
              onValueChange={handleSeekChange}
              className="w-full"
            />
          </div>
          
          <span className="text-sm text-gray-600 w-16">
            {formatTime(timelineState.totalDuration)}
          </span>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onMuteToggle}
          >
            {timelineState.isMuted || timelineState.volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <div className="w-20">
            <Slider
              value={[timelineState.isMuted ? 0 : timelineState.volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              disabled={timelineState.isMuted}
            />
          </div>
          
          <span className="text-xs text-gray-500 w-8">
            {Math.round((timelineState.isMuted ? 0 : timelineState.volume) * 100)}%
          </span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-gray-600" />
          <Select
            value={timelineState.playbackSpeed.toString()}
            onValueChange={(value) => onSpeedChange(parseFloat(value))}
          >
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {speedOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset to beginning */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSeek(0)}
          disabled={timelineState.currentTime === 0}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Playback Status */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Status: {timelineState.isPlaying 
              ? (timelineState.isPaused ? 'Pausado' : 'Reproduzindo') 
              : 'Parado'
            }
          </span>
          {timelineState.playbackSpeed !== 1 && (
            <span>Velocidade: {timelineState.playbackSpeed}x</span>
          )}
          {isLooping && (
            <span>Modo: Loop</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span>
            Duração total: {formatTime(timelineState.totalDuration)}
          </span>
          <span>
            Progresso: {timelineState.totalDuration > 0 
              ? `${Math.round((timelineState.currentTime / timelineState.totalDuration) * 100)}%`
              : '0%'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;