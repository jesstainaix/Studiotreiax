import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  GripVertical, 
  Play, 
  Volume2, 
  User, 
  Clock, 
  MoreVertical,
  Copy,
  Trash2,
  Edit3,
  Eye
} from 'lucide-react';
import { HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { TimelineState } from './TimelineEditor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface TimelineTrackProps {
  scene: HeyGenScene;
  index: number;
  position: { left: number; width: number };
  isSelected: boolean;
  timelineState: TimelineState;
  onSelect: () => void;
  onDurationChange: (newDuration: number) => void;
  onReorder: (newIndex: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  scene,
  index,
  position,
  isSelected,
  timelineState,
  onSelect,
  onDurationChange,
  onReorder,
  onDelete,
  onDuplicate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, originalIndex: 0, startTime: 0 });
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = e.clientX - rect.left;
    const isNearRightEdge = relativeX > rect.width - 10;

    if (isNearRightEdge) {
      // Start resizing
      setIsResizing(true);
      e.preventDefault();
    } else {
      // Start dragging
      setIsDragging(true);
      setDragStart({ x: e.clientX, originalIndex: index });
      onSelect();
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing) {
      // Handle resize
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newWidth = e.clientX - rect.left;
      const newDuration = Math.max(1, newWidth / timelineState.zoom);
      onDurationChange(newDuration);
    } else if (isDragging) {
      // Handle drag for reordering with improved calculations
      const timelineElement = trackRef.current?.parentElement;
      if (!timelineElement) return;

      const timelineRect = timelineElement.getBoundingClientRect();
      const relativeX = e.clientX - timelineRect.left;
      const timePosition = relativeX / timelineState.zoom;
      
      // Calculate target index based on time position
      let accumulatedTime = 0;
      let targetIndex = 0;
      
      // Find which position this time corresponds to
      for (let i = 0; i < position.left / timelineState.zoom; i++) {
        // This is a simplified version - in practice would need scene durations
        targetIndex = i;
      }
      
      // Clamp to valid range
      targetIndex = Math.max(0, Math.min(targetIndex, index + 1));
      setDropIndex(targetIndex !== index ? targetIndex : null);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dropIndex !== null && dropIndex !== index) {
      onReorder(dropIndex);
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setDropIndex(null);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, timelineState.zoom]);

  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  const getSceneTypeColor = (scene: HeyGenScene): string => {
    if (scene.avatar && scene.voice) return 'bg-green-500';
    if (scene.avatar || scene.voice) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getSceneTypeLabel = (scene: HeyGenScene): string => {
    if (scene.avatar && scene.voice) return 'Completa';
    if (scene.avatar) return 'Só Avatar';
    if (scene.voice) return 'Só Voz';
    return 'Incompleta';
  };

  return (
    <div
      ref={trackRef}
      className={`absolute top-2 h-20 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
      } ${isDragging ? 'opacity-70 scale-105 z-50' : ''} ${isResizing ? 'cursor-ew-resize' : ''}`}
      style={{
        left: position.left,
        width: position.width,
        minWidth: 100,
        zIndex: isSelected ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Drag handle */}
      <div className="absolute left-1 top-1 bottom-1 w-2 flex items-center justify-center cursor-grab active:cursor-grabbing">
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>

      {/* Scene content */}
      <div className="pl-4 pr-2 py-2 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {scene.title}
            </h4>
            <p className="text-xs text-gray-600 truncate">
              Cena {index + 1}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="w-6 h-6 p-0 ml-1">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Status indicators */}
            {scene.avatar && (
              <div className="w-3 h-3 bg-blue-500 rounded-full" title="Avatar configurado">
                <User className="w-2 h-2 text-white m-0.5" />
              </div>
            )}
            {scene.voice && (
              <div className="w-3 h-3 bg-green-500 rounded-full" title="Voz configurada">
                <Volume2 className="w-2 h-2 text-white m-0.5" />
              </div>
            )}
            
            <Badge variant="outline" className="text-xs px-1 py-0">
              <Clock className="w-2 h-2 mr-1" />
              {formatDuration(scene.duration)}
            </Badge>
          </div>

          {/* Scene type */}
          <div className={`w-2 h-2 rounded-full ${getSceneTypeColor(scene)}`} 
               title={getSceneTypeLabel(scene)} />
        </div>
      </div>

      {/* Progress indicator (if scene is playing) */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ 
              width: `${Math.min(100, (timelineState.currentTime % scene.duration) / scene.duration * 100)}%` 
            }} 
          />
        </div>
      )}

      {/* Resize handle */}
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500 hover:bg-opacity-20 flex items-center justify-center">
        <div className="w-0.5 h-6 bg-gray-400 rounded" />
      </div>
    </div>
  );
};

export default TimelineTrack;