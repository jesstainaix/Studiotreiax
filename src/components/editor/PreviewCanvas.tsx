import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff } from 'lucide-react';

export interface PreviewCanvasProps {
  width?: number;
  height?: number;
  videoSrc?: string;
  effects?: any[];
  transition?: any;
  isPlaying?: boolean;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

interface CanvasFilters {
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  sepia?: number;
  grayscale?: number;
  invert?: number;
  opacity?: number;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  width = 640,
  height = 360,
  videoSrc,
  effects = [],
  transition,
  isPlaying = false,
  currentTime = 0,
  onTimeUpdate,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'full'>('full');

  // Convert effects to canvas filters
  const getCanvasFilters = useCallback((effects: any[]): CanvasFilters => {
    const filters: CanvasFilters = {};
    
    effects.forEach(effect => {
      switch (effect.type) {
        case 'blur':
          filters.blur = effect.parameters.intensity || 0;
          break;
        case 'brightness':
          filters.brightness = (effect.parameters.value || 100) / 100;
          break;
        case 'contrast':
          filters.contrast = (effect.parameters.value || 100) / 100;
          break;
        case 'saturation':
          filters.saturation = (effect.parameters.value || 100) / 100;
          break;
        case 'hue':
          filters.hue = effect.parameters.rotation || 0;
          break;
        case 'sepia':
          filters.sepia = (effect.parameters.intensity || 0) / 100;
          break;
        case 'grayscale':
          filters.grayscale = (effect.parameters.intensity || 0) / 100;
          break;
        case 'invert':
          filters.invert = (effect.parameters.intensity || 0) / 100;
          break;
        case 'opacity':
          filters.opacity = (effect.parameters.value || 100) / 100;
          break;
      }
    });
    
    return filters;
  }, []);

  // Apply CSS filters to canvas context
  const applyFilters = useCallback((ctx: CanvasRenderingContext2D, filters: CanvasFilters) => {
    const filterParts: string[] = [];
    
    if (filters.blur !== undefined && filters.blur > 0) {
      filterParts.push(`blur(${filters.blur}px)`);
    }
    if (filters.brightness !== undefined && filters.brightness !== 1) {
      filterParts.push(`brightness(${filters.brightness})`);
    }
    if (filters.contrast !== undefined && filters.contrast !== 1) {
      filterParts.push(`contrast(${filters.contrast})`);
    }
    if (filters.saturation !== undefined && filters.saturation !== 1) {
      filterParts.push(`saturate(${filters.saturation})`);
    }
    if (filters.hue !== undefined && filters.hue !== 0) {
      filterParts.push(`hue-rotate(${filters.hue}deg)`);
    }
    if (filters.sepia !== undefined && filters.sepia > 0) {
      filterParts.push(`sepia(${filters.sepia})`);
    }
    if (filters.grayscale !== undefined && filters.grayscale > 0) {
      filterParts.push(`grayscale(${filters.grayscale})`);
    }
    if (filters.invert !== undefined && filters.invert > 0) {
      filterParts.push(`invert(${filters.invert})`);
    }
    if (filters.opacity !== undefined && filters.opacity !== 1) {
      filterParts.push(`opacity(${filters.opacity})`);
    }
    
    ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';
  }, []);

  // Apply transition effects
  const applyTransition = useCallback((ctx: CanvasRenderingContext2D, transition: any, progress: number) => {
    if (!transition) return;
    
    const { type, direction } = transition;
    
    ctx.save();
    
    switch (type) {
      case 'fade':
        ctx.globalAlpha = progress;
        break;
        
      case 'wipe':
        const clipWidth = width * progress;
        const clipHeight = height * progress;
        
        if (direction === 'left') {
          ctx.beginPath();
          ctx.rect(0, 0, clipWidth, height);
          ctx.clip();
        } else if (direction === 'right') {
          ctx.beginPath();
          ctx.rect(width - clipWidth, 0, clipWidth, height);
          ctx.clip();
        } else if (direction === 'up') {
          ctx.beginPath();
          ctx.rect(0, 0, width, clipHeight);
          ctx.clip();
        } else if (direction === 'down') {
          ctx.beginPath();
          ctx.rect(0, height - clipHeight, width, clipHeight);
          ctx.clip();
        }
        break;
        
      case 'slide':
        const offsetX = direction === 'left' ? width * (1 - progress) : 
                       direction === 'right' ? -width * (1 - progress) : 0;
        const offsetY = direction === 'up' ? height * (1 - progress) : 
                       direction === 'down' ? -height * (1 - progress) : 0;
        
        ctx.translate(offsetX, offsetY);
        break;
        
      case 'zoom':
        const scale = direction === 'in' ? progress : (2 - progress);
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        break;
    }
  }, [width, height]);

  // Render frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !isVideoLoaded) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (previewMode === 'split') {
      // Split view: original on left, effects on right
      const halfWidth = width / 2;
      
      // Draw original (left side)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfWidth, height);
      ctx.clip();
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
      
      // Draw with effects (right side)
      ctx.save();
      ctx.beginPath();
      ctx.rect(halfWidth, 0, halfWidth, height);
      ctx.clip();
      
      const filters = getCanvasFilters(effects);
      applyFilters(ctx, filters);
      
      if (transition) {
        const progress = Math.sin(Date.now() * 0.002) * 0.5 + 0.5; // Animated preview
        applyTransition(ctx, transition, progress);
      }
      
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
      
      // Draw divider line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(halfWidth, 0);
      ctx.lineTo(halfWidth, height);
      ctx.stroke();
      
    } else {
      // Full view with effects
      if (showOriginal) {
        // Show original without effects
        ctx.drawImage(video, 0, 0, width, height);
      } else {
        // Apply effects and transitions
        const filters = getCanvasFilters(effects);
        applyFilters(ctx, filters);
        
        if (transition) {
          const progress = Math.sin(Date.now() * 0.002) * 0.5 + 0.5; // Animated preview
          applyTransition(ctx, transition, progress);
        }
        
        ctx.drawImage(video, 0, 0, width, height);
      }
    }
    
    // Continue animation if playing
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    }
  }, [width, height, effects, transition, isVideoLoaded, isPlaying, showOriginal, previewMode, getCanvasFilters, applyFilters, applyTransition]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleLoadedData = () => {
      setIsVideoLoaded(true);
      renderFrame();
    };
    
    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
      if (!isPlaying) {
        renderFrame();
      }
    };
    
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [renderFrame, onTimeUpdate, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.play();
      renderFrame();
    } else {
      video.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying, renderFrame]);

  // Handle current time changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = currentTime;
    renderFrame();
  }, [currentTime, renderFrame]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        muted
        playsInline
        preload="metadata"
      />
      
      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain"
      />
      
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex gap-2">
        {/* Split View Toggle */}
        <button
          onClick={() => setPreviewMode(previewMode === 'split' ? 'full' : 'split')}
          className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
          title={previewMode === 'split' ? 'Vista completa' : 'Vista dividida'}
        >
          <div className="w-4 h-4 border border-white">
            {previewMode === 'split' && (
              <div className="w-1/2 h-full bg-white" />
            )}
          </div>
        </button>
        
        {/* Original/Effects Toggle */}
        {previewMode === 'full' && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
            title={showOriginal ? 'Mostrar com efeitos' : 'Mostrar original'}
          >
            {showOriginal ? (
              <EyeOff className="w-4 h-4 text-white" />
            ) : (
              <Eye className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>
      
      {/* Loading State */}
      {!isVideoLoaded && videoSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <RotateCcw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-400 text-sm">Carregando preview...</p>
          </div>
        </div>
      )}
      
      {/* No Video State */}
      {!videoSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Play className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Selecione um vídeo para preview</p>
          </div>
        </div>
      )}
      
      {/* Split View Labels */}
      {previewMode === 'split' && isVideoLoaded && (
        <>
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
            Original
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
            Com Efeitos
          </div>
        </>
      )}
    </div>
  );
};

export default PreviewCanvas;