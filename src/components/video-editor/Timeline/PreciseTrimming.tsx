import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { 
  Scissors, 
  Crop, 
  Move, 
  Square,
  CornerUpLeft,
  CornerUpRight,
  AlignCenter,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Target,
  MousePointer,
  Hand,
  Maximize2,
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';

interface TrimPoint {
  time: number;
  frame: number;
  type: 'in' | 'out';
  snapToMarker?: boolean;
}

interface TrimHandle {
  id: string;
  type: 'start' | 'end';
  itemId: string;
  position: number;
  active: boolean;
  hovering: boolean;
}

interface SnapTarget {
  time: number;
  type: 'marker' | 'item-edge' | 'playhead' | 'grid';
  label?: string;
  strength: number;
}

interface PreciseTrimmingProps {
  itemId: string;
  startTime: number;
  endTime: number;
  duration: number;
  currentTime: number;
  frameRate: number;
  onTrimChange: (itemId: string, newStart: number, newEnd: number) => void;
  onCurrentTimeChange: (time: number) => void;
  snapEnabled?: boolean;
  snapTolerance?: number;
  showGrid?: boolean;
  showMarkers?: boolean;
  lockAspectRatio?: boolean;
  className?: string;
}

export const PreciseTrimming: React.FC<PreciseTrimmingProps> = ({
  itemId,
  startTime,
  endTime,
  duration,
  currentTime,
  frameRate = 30,
  onTrimChange,
  onCurrentTimeChange,
  snapEnabled = true,
  snapTolerance = 0.1,
  showGrid = true,
  showMarkers = true,
  lockAspectRatio = false,
  className = ''
}) => {
  const [trimMode, setTrimMode] = useState<'ripple' | 'roll' | 'slip' | 'slide'>('ripple');
  const [activeTrimHandle, setActiveTrimHandle] = useState<TrimHandle | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snapTargets, setSnapTargets] = useState<SnapTarget[]>([]);
  const [precision, setPrecision] = useState<'frame' | 'subframe' | 'sample'>('frame');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const trimAreaRef = useRef<HTMLDivElement>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, time: 0 });

  // Calculate frame-perfect timing
  const frameDuration = 1 / frameRate;
  const totalFrames = Math.floor(duration * frameRate);
  const startFrame = Math.floor(startTime * frameRate);
  const endFrame = Math.floor(endTime * frameRate);
  const currentFrame = Math.floor(currentTime * frameRate);

  // Snap to frame boundaries
  const snapToFrame = useCallback((time: number): number => {
    if (precision === 'frame') {
      return Math.round(time * frameRate) / frameRate;
    }
    return time;
  }, [frameRate, precision]);

  // Generate snap targets
  useEffect(() => {
    const targets: SnapTarget[] = [];
    
    // Frame grid targets
    if (showGrid) {
      for (let frame = 0; frame <= totalFrames; frame += frameRate) {
        targets.push({
          time: frame / frameRate,
          type: 'grid',
          label: `${Math.floor(frame / frameRate)}s`,
          strength: 1
        });
      }
    }

    // Playhead target
    targets.push({
      time: currentTime,
      type: 'playhead',
      label: 'Playhead',
      strength: 2
    });

    // Marker targets (if available)
    if (showMarkers) {
      // Add common markers like 0, quarter, half, three-quarter points
      [0, 0.25, 0.5, 0.75, 1].forEach(ratio => {
        targets.push({
          time: duration * ratio,
          type: 'marker',
          label: `${Math.round(ratio * 100)}%`,
          strength: 1.5
        });
      });
    }

    setSnapTargets(targets);
  }, [duration, currentTime, frameRate, totalFrames, showGrid, showMarkers]);

  // Find nearest snap target
  const findNearestSnap = useCallback((time: number): number => {
    if (!snapEnabled) return time;

    let nearestTime = time;
    let nearestDistance = Infinity;

    snapTargets.forEach(target => {
      const distance = Math.abs(time - target.time);
      if (distance < snapTolerance && distance < nearestDistance) {
        nearestDistance = distance;
        nearestTime = target.time;
      }
    });

    return nearestTime;
  }, [snapEnabled, snapTargets, snapTolerance]);

  // Handle trim start
  const handleTrimStart = useCallback((event: React.MouseEvent, handleType: 'start' | 'end') => {
    event.preventDefault();
    
    const rect = trimAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const time = (x / rect.width) * duration;

    setDragStartPos({ x, time });
    setIsDragging(true);
    
    setActiveTrimHandle({
      id: `${itemId}-${handleType}`,
      type: handleType,
      itemId,
      position: x,
      active: true,
      hovering: false
    });
  }, [itemId, duration]);

  // Handle trim drag
  const handleTrimDrag = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !activeTrimHandle || !trimAreaRef.current) return;

    const rect = trimAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const deltaX = x - dragStartPos.x;
    const deltaTime = (deltaX / rect.width) * duration;
    
    let newTime = dragStartPos.time + deltaTime;
    newTime = Math.max(0, Math.min(newTime, duration));
    
    // Apply snapping
    newTime = findNearestSnap(newTime);
    
    // Apply frame snapping
    newTime = snapToFrame(newTime);

    if (activeTrimHandle.type === 'start') {
      // Trim start - don't let it go past end
      const newStart = Math.min(newTime, endTime - frameDuration);
      onTrimChange(itemId, newStart, endTime);
    } else {
      // Trim end - don't let it go before start
      const newEnd = Math.max(newTime, startTime + frameDuration);
      onTrimChange(itemId, startTime, newEnd);
    }
  }, [
    isDragging, 
    activeTrimHandle, 
    dragStartPos, 
    duration, 
    endTime, 
    startTime, 
    frameDuration,
    findNearestSnap,
    snapToFrame,
    onTrimChange,
    itemId
  ]);

  // Handle trim end
  const handleTrimEnd = useCallback(() => {
    setIsDragging(false);
    setActiveTrimHandle(null);
  }, []);

  // Keyboard shortcuts for frame-perfect trimming
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeTrimHandle) return;

      let timeChange = 0;
      
      switch (event.key) {
        case 'ArrowLeft':
          timeChange = -frameDuration;
          break;
        case 'ArrowRight':
          timeChange = frameDuration;
          break;
        case 'Shift':
          // Hold shift for larger increments (1 second)
          if (event.key === 'ArrowLeft') timeChange = -1;
          if (event.key === 'ArrowRight') timeChange = 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      
      if (activeTrimHandle.type === 'start') {
        const newStart = Math.max(0, Math.min(startTime + timeChange, endTime - frameDuration));
        onTrimChange(itemId, newStart, endTime);
      } else {
        const newEnd = Math.min(duration, Math.max(startTime + frameDuration, endTime + timeChange));
        onTrimChange(itemId, startTime, newEnd);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTrimHandle, startTime, endTime, frameDuration, duration, onTrimChange, itemId]);

  // Format time with frame accuracy
  const formatTimeWithFrames = (time: number): string => {
    const totalSeconds = Math.floor(time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const frames = Math.floor((time % 1) * frameRate);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Calculate trim preview
  const trimmedDuration = endTime - startTime;
  const trimPercentageStart = (startTime / duration) * 100;
  const trimPercentageEnd = (endTime / duration) * 100;

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scissors className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Precise Trimming</h3>
          <Badge variant="outline">Frame Perfect</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={snapEnabled ? "default" : "outline"}
            onClick={() => {/* Toggle snap */}}
          >
            <Target className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant={showGrid ? "default" : "outline"}
            onClick={() => {/* Toggle grid */}}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trim Mode Selection */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Mode:</span>
        {(['ripple', 'roll', 'slip', 'slide'] as const).map(mode => (
          <Button
            key={mode}
            size="sm"
            variant={trimMode === mode ? "default" : "outline"}
            onClick={() => setTrimMode(mode)}
            className="text-xs px-3 py-1 h-7"
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
      </div>

      {/* Timeline Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Timeline Preview</span>
          <span>Duration: {formatTimeWithFrames(trimmedDuration)}</span>
        </div>
        
        <div 
          ref={trimAreaRef}
          className="relative h-16 bg-gray-800 border border-gray-600 rounded cursor-crosshair"
          onMouseMove={handleTrimDrag}
          onMouseUp={handleTrimEnd}
          onMouseLeave={handleTrimEnd}
        >
          {/* Background timeline */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded"></div>
          
          {/* Trimmed area */}
          <div 
            className="absolute top-0 bottom-0 bg-blue-500/30 border-l-2 border-r-2 border-blue-400"
            style={{
              left: `${trimPercentageStart}%`,
              right: `${100 - trimPercentageEnd}%`
            }}
          >
            {/* Start trim handle */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400 cursor-ew-resize hover:bg-blue-300 transition-colors"
              onMouseDown={(e) => handleTrimStart(e, 'start')}
              title="Drag to trim start"
            >
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full opacity-70"></div>
            </div>
            
            {/* End trim handle */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-2 bg-blue-400 cursor-ew-resize hover:bg-blue-300 transition-colors"
              onMouseDown={(e) => handleTrimStart(e, 'end')}
              title="Drag to trim end"
            >
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full opacity-70"></div>
            </div>
          </div>
          
          {/* Playhead indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-400 rotate-45"></div>
          </div>
          
          {/* Snap indicators */}
          {snapTargets.map((target, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-px bg-yellow-400/50"
              style={{ left: `${(target.time / duration) * 100}%` }}
              title={target.label}
            />
          ))}
        </div>
      </div>

      {/* Precise Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* In Point */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">In Point</label>
            <Badge variant="outline" className="text-xs">
              Frame {startFrame}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTrimChange(itemId, Math.max(0, startTime - frameDuration), endTime)}
            >
              <CornerUpLeft className="w-3 h-3" />
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[startTime]}
                onValueChange={([value]) => onTrimChange(itemId, snapToFrame(value), endTime)}
                max={endTime - frameDuration}
                step={frameDuration}
                className="w-full"
              />
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTrimChange(itemId, Math.min(endTime - frameDuration, startTime + frameDuration), endTime)}
            >
              <CornerUpRight className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            {formatTimeWithFrames(startTime)}
          </div>
        </div>

        {/* Out Point */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Out Point</label>
            <Badge variant="outline" className="text-xs">
              Frame {endFrame}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTrimChange(itemId, startTime, Math.max(startTime + frameDuration, endTime - frameDuration))}
            >
              <CornerUpLeft className="w-3 h-3" />
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[endTime]}
                onValueChange={([value]) => onTrimChange(itemId, startTime, snapToFrame(value))}
                min={startTime + frameDuration}
                max={duration}
                step={frameDuration}
                className="w-full"
              />
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTrimChange(itemId, startTime, Math.min(duration, endTime + frameDuration))}
            >
              <CornerUpRight className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            {formatTimeWithFrames(endTime)}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCurrentTimeChange(startTime)}
            title="Go to In Point"
          >
            <CornerUpLeft className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCurrentTimeChange(endTime)}
            title="Go to Out Point"
          >
            <CornerUpRight className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCurrentTimeChange((startTime + endTime) / 2)}
            title="Go to Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTrimChange(itemId, 0, duration)}
            title="Reset Trim"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            title="Precision Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Display */}
      <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-800 p-2 rounded">
        <div className="flex items-center space-x-4">
          <span>Trimmed: {formatTimeWithFrames(trimmedDuration)}</span>
          <span>Original: {formatTimeWithFrames(duration)}</span>
          <span>Removed: {formatTimeWithFrames(duration - trimmedDuration)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {frameRate}fps
          </Badge>
          <Badge variant="outline" className="text-xs">
            {precision}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default PreciseTrimming;