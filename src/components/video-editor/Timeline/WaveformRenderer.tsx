import React, { useRef, useEffect, useCallback, useState } from 'react';

interface WaveformData {
  peaks: number[];
  sampleRate: number;
  duration: number;
  channels: number;
}

interface WaveformRendererProps {
  audioUrl?: string;
  waveformData?: WaveformData;
  width: number;
  height: number;
  startTime: number;
  duration: number;
  zoom: number;
  currentTime?: number;
  color?: string;
  backgroundColor?: string;
  showProgress?: boolean;
  onProgress?: (time: number) => void;
  className?: string;
}

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({
  audioUrl,
  waveformData,
  width,
  height,
  startTime,
  duration,
  zoom,
  currentTime = 0,
  color = '#3b82f6',
  backgroundColor = '#1f2937',
  showProgress = true,
  onProgress,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [generatedWaveform, setGeneratedWaveform] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio context
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    
    return () => {
      ctx.close();
    };
  }, []);

  // Load and analyze audio file
  useEffect(() => {
    if (!audioUrl || !audioContext) return;

    const loadAudio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        
        setAudioBuffer(buffer);
        
        // Generate waveform data if not provided
        if (!waveformData) {
          const waveform = generateWaveformData(buffer);
          setGeneratedWaveform(waveform);
        }
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [audioUrl, audioContext, waveformData]);

  // Generate waveform data from audio buffer
  const generateWaveformData = (buffer: AudioBuffer): WaveformData => {
    const samples = 2048; // Number of samples for visualization
    const peaks: number[] = [];
    const channelData = buffer.getChannelData(0); // Use first channel
    const sampleSize = Math.floor(channelData.length / samples);

    for (let i = 0; i < samples; i++) {
      const start = i * sampleSize;
      const end = Math.min(start + sampleSize, channelData.length);
      
      let max = 0;
      for (let j = start; j < end; j++) {
        const value = Math.abs(channelData[j]);
        if (value > max) max = value;
      }
      
      peaks.push(max);
    }

    return {
      peaks,
      sampleRate: buffer.sampleRate,
      duration: buffer.duration,
      channels: buffer.numberOfChannels
    };
  };

  // Render waveform to canvas
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const waveform = waveformData || generatedWaveform;
    if (!waveform) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const { peaks } = waveform;
    if (!peaks.length) return;

    // Calculate visible portion
    const pixelsPerSecond = zoom;
    const samplesPerPixel = peaks.length / (waveform.duration * pixelsPerSecond);
    const visibleStartSample = Math.floor((startTime / waveform.duration) * peaks.length);
    const visibleSamples = Math.floor((duration / waveform.duration) * peaks.length);

    // Draw waveform
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const barWidth = Math.max(1, width / visibleSamples);
    const centerY = height / 2;
    const maxAmplitude = height * 0.4; // 80% of half height

    for (let i = 0; i < width; i++) {
      const sampleIndex = visibleStartSample + Math.floor(i * samplesPerPixel);
      if (sampleIndex >= peaks.length) break;

      const peak = peaks[sampleIndex] || 0;
      const barHeight = peak * maxAmplitude;

      // Draw symmetrical bars (top and bottom)
      ctx.fillRect(i, centerY - barHeight, barWidth, barHeight * 2);
    }

    // Draw progress indicator
    if (showProgress && currentTime >= startTime && currentTime <= startTime + duration) {
      const progressX = ((currentTime - startTime) / duration) * width;
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  }, [
    waveformData,
    generatedWaveform,
    width,
    height,
    startTime,
    duration,
    zoom,
    currentTime,
    color,
    backgroundColor,
    showProgress
  ]);

  // Update canvas when props change
  useEffect(() => {
    renderWaveform();
  }, [renderWaveform]);

  // Handle canvas click for seeking
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onProgress) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = x / width;
    const time = startTime + (progress * duration);

    onProgress(time);
  }, [startTime, duration, width, onProgress]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="cursor-pointer"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: 'pixelated'
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-xs">Loading waveform...</div>
        </div>
      )}
      
      {!waveformData && !generatedWaveform && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-xs">No audio</div>
        </div>
      )}
    </div>
  );
};

export default WaveformRenderer;