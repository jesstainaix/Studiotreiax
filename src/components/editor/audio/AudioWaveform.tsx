import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

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

interface AudioWaveformProps {
  tracks: AudioTrack[];
  currentTime: number;
  duration: number;
  onTimeChange: (time: number) => void;
  selectedTrack: string | null;
}

interface WaveformData {
  peaks: number[];
  length: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  tracks,
  currentTime,
  duration,
  onTimeChange,
  selectedTrack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<Map<string, WaveformData>>(new Map());
  const [isGenerating, setIsGenerating] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Generate waveform data for a track
  const generateWaveform = useCallback(async (track: AudioTrack) => {
    if (waveformData.has(track.id) || isGenerating.has(track.id)) {
      return;
    }

    setIsGenerating(prev => new Set(prev).add(track.id));

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(track.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 1000; // Number of samples for waveform
      const blockSize = Math.floor(channelData.length / samples);
      const peaks: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let max = 0;
        for (let j = 0; j < blockSize; j++) {
          const sample = Math.abs(channelData[i * blockSize + j] || 0);
          if (sample > max) {
            max = sample;
          }
        }
        peaks.push(max);
      }
      
      setWaveformData(prev => new Map(prev).set(track.id, {
        peaks,
        length: audioBuffer.length
      }));
      
      audioContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
    } finally {
      setIsGenerating(prev => {
        const newSet = new Set(prev);
        newSet.delete(track.id);
        return newSet;
      });
    }
  }, [waveformData, isGenerating]);

  // Generate waveforms for all tracks
  useEffect(() => {
    tracks.forEach(track => {
      if (track.url && !waveformData.has(track.id)) {
        generateWaveform(track);
      }
    });
  }, [tracks, generateWaveform]);

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, width, height);

    const trackHeight = height / Math.max(tracks.length, 1);
    const visibleWidth = width * zoom;
    const startX = scrollPosition * visibleWidth;

    tracks.forEach((track, index) => {
      const trackY = index * trackHeight;
      const waveform = waveformData.get(track.id);
      
      // Track background
      ctx.fillStyle = selectedTrack === track.id ? '#1E40AF' : '#374151';
      ctx.fillRect(0, trackY, width, trackHeight);
      
      // Track border
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, trackY, width, trackHeight);
      
      // Track label
      ctx.fillStyle = '#F9FAFB';
      ctx.font = '12px sans-serif';
      ctx.fillText(track.name, 8, trackY + 16);
      
      // Volume indicator
      const volumeText = track.muted ? 'MUTED' : `${track.volume}%`;
      ctx.fillStyle = track.muted ? '#EF4444' : '#10B981';
      ctx.fillText(volumeText, 8, trackY + trackHeight - 8);
      
      if (waveform) {
        // Draw waveform
        const waveformY = trackY + trackHeight / 2;
        const waveformHeight = trackHeight * 0.6;
        const samplesPerPixel = waveform.peaks.length / visibleWidth;
        
        ctx.strokeStyle = track.muted ? '#6B7280' : '#3B82F6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
          const sampleIndex = Math.floor((startX + x) * samplesPerPixel);
          if (sampleIndex >= 0 && sampleIndex < waveform.peaks.length) {
            const amplitude = waveform.peaks[sampleIndex];
            const y1 = waveformY - (amplitude * waveformHeight / 2);
            const y2 = waveformY + (amplitude * waveformHeight / 2);
            
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
          }
        }
        ctx.stroke();
      } else if (isGenerating.has(track.id)) {
        // Loading indicator
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px sans-serif';
        ctx.fillText('Gerando forma de onda...', width / 2 - 60, trackY + trackHeight / 2);
      }
    });

    // Draw playhead
    if (duration > 0) {
      const playheadX = ((currentTime / duration) * visibleWidth) - startX;
      if (playheadX >= 0 && playheadX <= width) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
        
        // Time indicator
        ctx.fillStyle = '#EF4444';
        ctx.font = '10px sans-serif';
        const timeText = formatTime(currentTime);
        ctx.fillText(timeText, playheadX + 4, 12);
      }
    }

    // Draw time markers
    if (duration > 0) {
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      
      const timeStep = Math.max(1, Math.floor(duration / 10)); // Show ~10 markers
      for (let time = 0; time <= duration; time += timeStep) {
        const x = ((time / duration) * visibleWidth) - startX;
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          ctx.fillText(formatTime(time), x + 2, height - 4);
        }
      }
    }
  }, [tracks, waveformData, isGenerating, currentTime, duration, selectedTrack, zoom, scrollPosition]);

  // Redraw when dependencies change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const { width } = container.getBoundingClientRect();
    
    const visibleWidth = width * zoom;
    const startX = scrollPosition * visibleWidth;
    const clickX = startX + x;
    const newTime = (clickX / visibleWidth) * duration;
    
    onTimeChange(Math.max(0, Math.min(duration, newTime)));
  }, [duration, onTimeChange, zoom, scrollPosition]);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.1, Math.min(10, zoom + delta));
    setZoom(newZoom);
  }, [zoom]);

  // Handle scroll
  const handleScroll = useCallback((delta: number) => {
    const maxScroll = Math.max(0, zoom - 1);
    const newScroll = Math.max(0, Math.min(maxScroll, scrollPosition + delta));
    setScrollPosition(newScroll);
  }, [zoom, scrollPosition]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Forma de Onda</span>
          <span className="text-xs text-gray-400">
            {tracks.length} faixa{tracks.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom(-0.2)}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
            >
              -
            </button>
            <span className="text-xs w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => handleZoom(0.2)}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
            >
              +
            </button>
          </div>
          
          {/* Scroll controls */}
          {zoom > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScroll(-0.1)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                ←
              </button>
              <button
                onClick={() => handleScroll(0.1)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                →
              </button>
            </div>
          )}
          
          {/* Time display */}
          <div className="text-xs text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
      
      {/* Waveform Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 cursor-pointer"
          onWheel={(e) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
              handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
            } else {
              handleScroll(e.deltaY > 0 ? 0.05 : -0.05);
            }
          }}
        />
        
        {tracks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma faixa de áudio carregada</p>
              <p className="text-sm">Adicione faixas de áudio para ver as formas de onda</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioWaveform;