import React, { useRef, useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useVirtualization, useElementMeasurement, useScrollSync } from '../hooks/useVirtualization';
import { cn } from '../lib/utils';

export interface TimelineClip {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text';
  name: string;
  thumbnail?: string;
  color?: string;
  locked?: boolean;
  muted?: boolean;
  opacity?: number;
  volume?: number;
  effects?: string[];
  transitions?: {
    in?: string;
    out?: string;
  };
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio';
  height: number;
  locked?: boolean;
  muted?: boolean;
  solo?: boolean;
  visible?: boolean;
  color?: string;
  clips: TimelineClip[];
}

export interface VirtualizedTimelineProps {
  tracks: TimelineTrack[];
  duration: number; // Total timeline duration in seconds
  pixelsPerSecond: number;
  height: number;
  width?: number;
  currentTime: number;
  onClipSelect?: (clip: TimelineClip | null) => void;
  onClipMove?: (clipId: string, newStartTime: number, newTrackId: string) => void;
  onClipResize?: (clipId: string, newStartTime: number, newEndTime: number) => void;
  onTimeChange?: (time: number) => void;
  onZoomChange?: (pixelsPerSecond: number) => void;
  selectedClipId?: string;
  className?: string;
  showWaveforms?: boolean;
  showThumbnails?: boolean;
  enableSnapping?: boolean;
  snapThreshold?: number;
  minZoom?: number;
  maxZoom?: number;
  trackHeaderWidth?: number;
  rulerHeight?: number;
  enableMultiSelect?: boolean;
  onTracksReorder?: (tracks: TimelineTrack[]) => void;
}

export interface VirtualizedTimelineRef {
  scrollToTime: (time: number) => void;
  zoomToFit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  selectClip: (clipId: string) => void;
  getVisibleTimeRange: () => { start: number; end: number };
  invalidateCache: () => void;
}

interface ThumbnailCache {
  [clipId: string]: {
    url: string;
    timestamp: number;
  };
}

const VirtualizedTimeline = forwardRef<VirtualizedTimelineRef, VirtualizedTimelineProps>((
  {
    tracks,
    duration,
    pixelsPerSecond,
    height,
    width = '100%',
    currentTime,
    onClipSelect,
    onClipMove,
    onClipResize,
    onTimeChange,
    onZoomChange,
    selectedClipId,
    className,
    showWaveforms = true,
    showThumbnails = true,
    enableSnapping = true,
    snapThreshold = 10,
    minZoom = 10,
    maxZoom = 1000,
    trackHeaderWidth = 200,
    rulerHeight = 40,
    enableMultiSelect = false,
    onTracksReorder
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [measureRef, containerDimensions] = useElementMeasurement();
  const scrollSync = useScrollSync();
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClip, setDraggedClip] = useState<TimelineClip | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'start' | 'end' | null>(null);

  // Calculate timeline dimensions
  const timelineWidth = duration * pixelsPerSecond;
  const containerHeight = containerDimensions.height || height;
  const containerWidth = containerDimensions.width || (typeof width === 'number' ? width : 800);
  const viewportWidth = containerWidth - trackHeaderWidth;

  // Setup virtualization for tracks
  const trackHeights = useMemo(() => tracks.map(track => track.height), [tracks]);
  const totalTracksHeight = trackHeights.reduce((sum, height) => sum + height, 0);
  
  const [virtualState, virtualActions] = useVirtualization(tracks.length, {
    itemHeight: (index: number) => trackHeights[index] || 100,
    containerHeight: containerHeight - rulerHeight,
    overscan: 2,
    horizontal: false,
    getItemKey: (index: number) => tracks[index]?.id || index
  });

  // Get visible time range
  const getVisibleTimeRange = useCallback(() => {
    if (!timelineRef.current) return { start: 0, end: duration };
    
    const scrollLeft = timelineRef.current.scrollLeft;
    const start = scrollLeft / pixelsPerSecond;
    const end = (scrollLeft + viewportWidth) / pixelsPerSecond;
    
    return { start: Math.max(0, start), end: Math.min(duration, end) };
  }, [pixelsPerSecond, viewportWidth, duration]);

  // Generate thumbnail for clip
  const generateThumbnail = useCallback(async (clip: TimelineClip) => {
    if (thumbnailCache[clip.id]) return thumbnailCache[clip.id].url;
    
    // Simulate thumbnail generation (replace with actual implementation)
    const thumbnailUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="120" height="68" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="${clip.color || '#3b82f6'}"/>
        <text x="60" y="34" text-anchor="middle" fill="white" font-size="12">
          ${clip.name.substring(0, 8)}
        </text>
      </svg>
    `)}`;
    
    setThumbnailCache(prev => ({
      ...prev,
      [clip.id]: {
        url: thumbnailUrl,
        timestamp: Date.now()
      }
    }));
    
    return thumbnailUrl;
  }, [thumbnailCache]);

  // Handle clip selection
  const handleClipSelect = useCallback((clip: TimelineClip, event?: React.MouseEvent) => {
    if (enableMultiSelect && event?.ctrlKey) {
      setSelectedClips(prev => {
        const newSet = new Set(prev);
        if (newSet.has(clip.id)) {
          newSet.delete(clip.id);
        } else {
          newSet.add(clip.id);
        }
        return newSet;
      });
    } else {
      setSelectedClips(new Set([clip.id]));
    }
    
    onClipSelect?.(clip);
  }, [enableMultiSelect, onClipSelect]);

  // Handle timeline click for playhead positioning
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left + timelineRef.current.scrollLeft;
    const time = x / pixelsPerSecond;
    
    onTimeChange?.(Math.max(0, Math.min(duration, time)));
  }, [pixelsPerSecond, duration, onTimeChange, isDragging]);

  // Handle zoom
  const handleZoom = useCallback((delta: number, centerX?: number) => {
    const newPixelsPerSecond = Math.max(minZoom, Math.min(maxZoom, pixelsPerSecond + delta));
    
    if (newPixelsPerSecond !== pixelsPerSecond) {
      onZoomChange?.(newPixelsPerSecond);
      
      // Maintain zoom center position
      if (centerX && timelineRef.current) {
        const currentTime = (timelineRef.current.scrollLeft + centerX) / pixelsPerSecond;
        const newScrollLeft = currentTime * newPixelsPerSecond - centerX;
        timelineRef.current.scrollLeft = Math.max(0, newScrollLeft);
      }
    }
  }, [pixelsPerSecond, minZoom, maxZoom, onZoomChange]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = -event.deltaY * 0.5;
      const rect = timelineRef.current?.getBoundingClientRect();
      const centerX = rect ? event.clientX - rect.left : viewportWidth / 2;
      handleZoom(delta, centerX);
    }
  }, [handleZoom, viewportWidth]);

  // Render timeline ruler
  const renderRuler = useCallback(() => {
    const markers = [];
    const step = pixelsPerSecond >= 100 ? 1 : pixelsPerSecond >= 50 ? 2 : 5;
    
    for (let time = 0; time <= duration; time += step) {
      const x = time * pixelsPerSecond;
      const isSecond = time % 1 === 0;
      
      markers.push(
        <div
          key={time}
          className={cn(
            'absolute border-l border-gray-300',
            isSecond ? 'h-6' : 'h-3 top-3'
          )}
          style={{ left: x }}
        >
          {isSecond && (
            <span className="absolute top-0 left-1 text-xs text-gray-600">
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      );
    }
    
    return markers;
  }, [duration, pixelsPerSecond]);

  // Render clip
  const renderClip = useCallback((clip: TimelineClip, trackIndex: number) => {
    const clipWidth = clip.duration * pixelsPerSecond;
    const clipLeft = clip.startTime * pixelsPerSecond;
    const isSelected = selectedClips.has(clip.id) || selectedClipId === clip.id;
    
    return (
      <div
        key={clip.id}
        className={cn(
          'absolute rounded cursor-pointer border-2 transition-all duration-150',
          'hover:shadow-lg hover:z-10',
          isSelected ? 'border-blue-500 shadow-lg z-20' : 'border-transparent',
          clip.locked && 'cursor-not-allowed opacity-60'
        )}
        style={{
          left: clipLeft,
          width: clipWidth,
          height: tracks[trackIndex].height - 4,
          top: 2,
          backgroundColor: clip.color || '#3b82f6',
          opacity: clip.opacity || 1
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleClipSelect(clip, e);
        }}
        onMouseDown={(e) => {
          if (clip.locked) return;
          setIsDragging(true);
          setDraggedClip(clip);
          setDragOffset({
            x: e.clientX - clipLeft,
            y: e.clientY
          });
        }}
      >
        {/* Clip content */}
        <div className="flex items-center h-full px-2 text-white text-sm font-medium overflow-hidden">
          {showThumbnails && clip.thumbnail && (
            <img
              src={clip.thumbnail}
              alt={clip.name}
              className="w-8 h-8 rounded mr-2 object-cover"
            />
          )}
          <span className="truncate">{clip.name}</span>
        </div>
        
        {/* Resize handles */}
        {isSelected && !clip.locked && (
          <>
            <div
              className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-500 opacity-0 hover:opacity-100"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
                setResizeHandle('start');
              }}
            />
            <div
              className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-500 opacity-0 hover:opacity-100"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
                setResizeHandle('end');
              }}
            />
          </>
        )}
        
        {/* Waveform visualization */}
        {showWaveforms && clip.type === 'audio' && (
          <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-50">
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Simplified waveform - replace with actual audio analysis */}
              {Array.from({ length: Math.floor(clipWidth / 4) }, (_, i) => (
                <rect
                  key={i}
                  x={i * 4}
                  y={Math.random() * 10}
                  width="2"
                  height={Math.random() * 20}
                  fill="rgba(255, 255, 255, 0.7)"
                />
              ))}
            </svg>
          </div>
        )}
      </div>
    );
  }, [pixelsPerSecond, selectedClips, selectedClipId, tracks, showThumbnails, showWaveforms, handleClipSelect]);

  // Render track
  const renderTrack = useCallback((track: TimelineTrack, index: number) => {
    return (
      <div
        key={track.id}
        className={cn(
          'relative border-b border-gray-200',
          track.muted && 'opacity-60',
          !track.visible && 'opacity-30'
        )}
        style={{ height: track.height }}
      >
        {/* Track clips */}
        {track.clips.map(clip => renderClip(clip, index))}
        
        {/* Track background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <defs>
              <pattern id={`grid-${track.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${track.id})`} />
          </svg>
        </div>
      </div>
    );
  }, [renderClip]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToTime: (time: number) => {
      if (timelineRef.current) {
        const scrollLeft = time * pixelsPerSecond - viewportWidth / 2;
        timelineRef.current.scrollLeft = Math.max(0, scrollLeft);
      }
    },
    zoomToFit: () => {
      const newPixelsPerSecond = Math.max(minZoom, Math.min(maxZoom, viewportWidth / duration));
      onZoomChange?.(newPixelsPerSecond);
    },
    zoomIn: () => handleZoom(10),
    zoomOut: () => handleZoom(-10),
    selectClip: (clipId: string) => {
      const clip = tracks.flatMap(t => t.clips).find(c => c.id === clipId);
      if (clip) handleClipSelect(clip);
    },
    getVisibleTimeRange,
    invalidateCache: () => {
      virtualActions.invalidateCache();
      setThumbnailCache({});
    }
  }), [pixelsPerSecond, viewportWidth, duration, minZoom, maxZoom, onZoomChange, handleZoom, tracks, handleClipSelect, getVisibleTimeRange, virtualActions]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        measureRef.current = el;
      }}
      className={cn('flex flex-col bg-gray-50 border border-gray-200 rounded-lg overflow-hidden', className)}
      style={{ height, width }}
    >
      {/* Timeline ruler */}
      <div className="flex">
        <div className="flex-shrink-0 bg-gray-100 border-r border-gray-200" style={{ width: trackHeaderWidth, height: rulerHeight }}>
          <div className="flex items-center justify-center h-full text-sm font-medium text-gray-600">
            Timeline
          </div>
        </div>
        <div
          ref={rulerRef}
          className="flex-1 relative bg-gray-100 border-b border-gray-200 overflow-hidden"
          style={{ height: rulerHeight }}
        >
          <div
            className="relative"
            style={{ width: timelineWidth, height: '100%' }}
            onClick={handleTimelineClick}
          >
            {renderRuler()}
            
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{
                left: currentTime * pixelsPerSecond,
                height: containerHeight
              }}
            >
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 transform rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track headers */}
        <div className="flex-shrink-0 bg-gray-100 border-r border-gray-200 overflow-y-auto" style={{ width: trackHeaderWidth }}>
          {virtualState.items.map((virtualItem) => {
            const track = tracks[virtualItem.index];
            if (!track) return null;
            
            return (
              <div
                key={track.id}
                className="flex items-center px-3 border-b border-gray-200 bg-white hover:bg-gray-50"
                style={{ height: track.height }}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{track.name}</div>
                  <div className="text-xs text-gray-500">{track.type}</div>
                </div>
                <div className="flex space-x-1">
                  <button
                    className={cn(
                      'w-6 h-6 rounded text-xs',
                      track.muted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                    )}
                    onClick={() => {
                      // Toggle mute
                    }}
                  >
                    M
                  </button>
                  <button
                    className={cn(
                      'w-6 h-6 rounded text-xs',
                      track.solo ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                    )}
                    onClick={() => {
                      // Toggle solo
                    }}
                  >
                    S
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline tracks */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto"
          onWheel={handleWheel}
          onClick={handleTimelineClick}
        >
          <div
            className="relative"
            style={{ width: timelineWidth, height: totalTracksHeight }}
          >
            {virtualState.items.map((virtualItem) => {
              const track = tracks[virtualItem.index];
              if (!track) return null;
              
              return (
                <div
                  key={track.id}
                  style={{
                    position: 'absolute',
                    top: virtualItem.start,
                    height: virtualItem.size,
                    width: '100%'
                  }}
                >
                  {renderTrack(track, virtualItem.index)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedTimeline.displayName = 'VirtualizedTimeline';

export default VirtualizedTimeline;