import React, { useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  ChevronDown,
  Repeat,
  Repeat1
} from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  loop: boolean;
  isFullscreen: boolean;
  onTogglePlayback: () => void;
  onSeekTo: (time: number) => void;
  onFrameStep: (direction: 'forward' | 'backward') => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleLoop: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onStop: () => void;
  onSpeedChange?: (speed: number) => void;
  onLoopChange?: (loop: boolean) => void;
  className?: string;
}

const PLAYBACK_RATES = [0.25, 0.5, 1, 2, 4];
const FRAME_RATE = 30; // Assuming 30fps for frame stepping

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  loop,
  isFullscreen,
  onTogglePlayback,
  onSeekTo,
  onFrameStep,
  onPlaybackRateChange,
  onToggleLoop,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onStop,
  onSpeedChange,
  onLoopChange,
  className = ''
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default behavior when focused on input elements
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        onTogglePlayback();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift + Arrow = 10 seconds
          onSeekTo(Math.max(0, currentTime - 10));
        } else {
          // Arrow = frame step
          onFrameStep('backward');
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift + Arrow = 10 seconds
          onSeekTo(Math.min(duration, currentTime + 10));
        } else {
          // Arrow = frame step
          onFrameStep('forward');
        }
        break;
      case 'j':
        e.preventDefault();
        onSeekTo(Math.max(0, currentTime - 10));
        break;
      case 'l':
        e.preventDefault();
        onSeekTo(Math.min(duration, currentTime + 10));
        break;
      case 'm':
        e.preventDefault();
        onToggleMute();
        break;
      case 'f':
        e.preventDefault();
        onToggleFullscreen();
        break;
      case 'Home':
        e.preventDefault();
        onSeekTo(0);
        break;
      case 'End':
        e.preventDefault();
        onSeekTo(duration);
        break;
    }
  }, [currentTime, duration, onTogglePlayback, onSeekTo, onFrameStep, onToggleMute, onToggleFullscreen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-gray-900 border-t border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Transport Controls */}
        <div className="flex items-center space-x-2">
          {/* Go to Start */}
          <button
            onClick={() => onSeekTo(0)}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Go to Start (Home)"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          {/* Frame Backward */}
          <button
            onClick={() => onFrameStep('backward')}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Previous Frame (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Play/Pause */}
          <button
            onClick={onTogglePlayback}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          
          {/* Stop */}
          <button
            onClick={onStop}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Stop"
          >
            <Square className="w-5 h-5" />
          </button>
          
          {/* Frame Forward */}
          <button
            onClick={() => onFrameStep('forward')}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Next Frame (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Go to End */}
          <button
            onClick={() => onSeekTo(duration)}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Go to End (End)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          {/* Loop Toggle */}
          <button
            onClick={onToggleLoop}
            className={`p-2 rounded transition-colors ${
              loop ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'
            }`}
            title="Toggle Loop"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Time Display and Progress */}
        <div className="flex-1 mx-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 font-mono">
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-gray-400 font-mono">
              {formatTime(duration)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.01"
              value={currentTime}
              onChange={(e) => onSeekTo(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #374151 ${progressPercentage}%, #374151 100%)`
              }}
            />
          </div>
        </div>

        {/* Playback Rate Control */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Speed:</span>
          <select
            value={playbackRate}
            onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {PLAYBACK_RATES.map(rate => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMute}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-400 w-8">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded hover:bg-gray-700 transition-colors ml-2"
          title="Fullscreen (F)"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <span className="mr-4">Space: Play/Pause</span>
        <span className="mr-4">←/→: Frame Step</span>
        <span className="mr-4">Shift+←/→: ±10s</span>
        <span className="mr-4">J/L: ±10s</span>
        <span className="mr-4">M: Mute</span>
        <span>F: Fullscreen</span>
      </div>
    </div>
  );
};

export default PlaybackControls;