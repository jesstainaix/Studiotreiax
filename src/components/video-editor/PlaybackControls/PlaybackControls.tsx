import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Rewind, 
  FastForward,
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Settings
} from 'lucide-react';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';

interface PlaybackControlsProps {
  engine: TimelineEngine;
  className?: string;
  compact?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  engine,
  className = '',
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Atualizar estado quando a timeline muda
  useEffect(() => {
    const handleTimeChange = (time: number) => {
      setCurrentTime(time);
    };

    const handlePlayStateChange = (playing: boolean) => {
      setIsPlaying(playing);
    };

    const updateDuration = () => {
      setDuration(engine.getDuration());
    };

    engine.addEventListener('timeChanged', handleTimeChange);
    engine.addEventListener('playStateChanged', handlePlayStateChange);
    engine.addEventListener('stateChanged', updateDuration);

    // Estado inicial
    setCurrentTime(engine.getCurrentTime());
    setDuration(engine.getDuration());
    setIsPlaying(engine.getState().isPlaying);

    return () => {
      engine.removeEventListener('timeChanged', handleTimeChange);
      engine.removeEventListener('playStateChanged', handlePlayStateChange);
      engine.removeEventListener('stateChanged', updateDuration);
    };
  }, [engine]);

  // Handlers dos controles
  const handlePlayPause = () => {
    if (isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };

  const handleStop = () => {
    engine.stop();
  };

  const handleSeek = (time: number[]) => {
    engine.setCurrentTime(time[0]);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    engine.setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    engine.setCurrentTime(newTime);
  };

  const handleRewind = () => {
    const newTime = Math.max(0, currentTime - 30);
    engine.setCurrentTime(newTime);
  };

  const handleFastForward = () => {
    const newTime = Math.min(duration, currentTime + 30);
    engine.setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
    setIsMuted(newVolume[0] === 0);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    // Em implementação real, aplicaria a taxa de reprodução
  };

  const handleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleShuffle = () => {
    setIsShuffling(!isShuffling);
  };

  // Formatação de tempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeDetailed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Só processar se não estiver focado em input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'Escape':
          handleStop();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
        case 'M':
          handleMute();
          break;
        case 'l':
        case 'L':
          handleLoop();
          break;
        case 'Home':
          engine.setCurrentTime(0);
          break;
        case 'End':
          engine.setCurrentTime(duration);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [volume, handlePlayPause, isPlaying, duration]);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlayPause}
          className="text-white border-gray-600 hover:bg-gray-700"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          className="text-white border-gray-600 hover:bg-gray-700"
        >
          <Square className="w-4 h-4" />
        </Button>

        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            min={0}
            max={duration}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-gray-900 text-white ${className}`}>
      <div className="p-4 space-y-4">
        {/* Timeline Principal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{formatTimeDetailed(currentTime)}</span>
            <span>{formatTimeDetailed(duration)}</span>
          </div>
          
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            min={0}
            max={duration}
            step={0.1}
            className="w-full"
          />
          
          {/* Marcadores de tempo */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>0:00</span>
            <span>{formatTime(duration / 4)}</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime((duration * 3) / 4)}</span>
            <span>{formatTimeDetailed(duration)}</span>
          </div>
        </div>

        {/* Controles Principais */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            className={`text-white border-gray-600 hover:bg-gray-700 ${
              isShuffling ? 'bg-blue-600 border-blue-500' : ''
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRewind}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Rewind className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipBackward}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handlePlayPause}
            className="text-white border-gray-600 hover:bg-gray-700 w-14 h-14"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipForward}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFastForward}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <FastForward className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoop}
            className={`text-white border-gray-600 hover:bg-gray-700 ${
              isLooping ? 'bg-blue-600 border-blue-500' : ''
            }`}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Controles Secundários */}
        <div className="flex items-center justify-between">
          {/* Controles de Volume */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMute}
              className="text-white hover:bg-gray-700"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <div className="w-24">
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <span className="text-xs text-gray-400 w-8">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Velocidade de Reprodução */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Velocidade:</span>
            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Configurações */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Informações de Estado */}
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex space-x-4">
            <span>Taxa: {playbackRate}x</span>
            <span>Volume: {Math.round((isMuted ? 0 : volume) * 100)}%</span>
            {isLooping && <span className="text-blue-400">Repetindo</span>}
            {isShuffling && <span className="text-green-400">Aleatório</span>}
          </div>
          
          <div className="flex space-x-4">
            <span>Estado: {isPlaying ? 'Reproduzindo' : 'Pausado'}</span>
            <span>
              Progresso: {duration > 0 ? Math.round((currentTime / duration) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Atalhos de Teclado */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
          <details>
            <summary className="cursor-pointer hover:text-gray-400">
              Atalhos de Teclado
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <span>Espaço: Play/Pause</span>
              <span>Esc: Parar</span>
              <span>← →: Pular 10s</span>
              <span>↑ ↓: Volume</span>
              <span>M: Mudo</span>
              <span>L: Repetir</span>
              <span>Home/End: Início/Fim</span>
            </div>
          </details>
        </div>
      </div>
    </Card>
  );
};