import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { useResponsiveDesign, getTimelineConfig } from './ResponsiveOptimizer';
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Scissors,
  Copy,
  Trash2,
  Settings,
  Download,
  RotateCcw,
  RotateCw,
  FastForward,
  MoreVertical,
  Split,
  Merge,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { HeyGenProject, HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { TimelineTrack } from './TimelineTrack';
import { PlaybackControls } from './PlaybackControls';
import { SceneDurationEditor } from './SceneDurationEditor';
import { TransitionEditor } from './TransitionEditor';
import { useTimeline } from '../../context/TimelineContext';
import { SceneLayer } from '../../types/SceneLayers';
import { toast } from 'sonner';

interface EnhancedTimelineEditorProps {
  project: HeyGenProject;
  onProjectUpdate: (project: HeyGenProject) => void;
  onSceneSelect: (sceneId: string) => void;
  selectedSceneId?: string;
  className?: string;
}

interface TimelineMarker {
  id: string;
  time: number; // seconds
  type: 'in' | 'out' | 'chapter' | 'comment';
  label?: string;
  color?: string;
}

interface TrackElement {
  id: string;
  sceneId: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'scene' | 'audio' | 'video' | 'image' | 'text';
  name: string;
  locked: boolean;
  visible: boolean;
  color?: string;
}

export const EnhancedTimelineEditor: React.FC<EnhancedTimelineEditorProps> = ({
  project,
  onProjectUpdate,
  onSceneSelect,
  selectedSceneId,
  className = ''
}) => {
  // Responsive settings
  const viewport = useResponsiveDesign();
  const timelineConfig = getTimelineConfig(viewport);
  
  // Timeline state
  const timeline = useTimeline();
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [trackElements, setTrackElements] = useState<TrackElement[]>([]);
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [rippleEdit, setRippleEdit] = useState(false);
  
  // UI state (with responsive defaults)
  const [showWaveforms, setShowWaveforms] = useState(timelineConfig.showWaveforms);
  const [showMarkers, setShowMarkers] = useState(timelineConfig.showMarkers);
  const [trackHeight, setTrackHeight] = useState(timelineConfig.trackHeight);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    dragType: 'move' | 'trim-start' | 'trim-end' | 'select';
    startX: number;
    startTime: number;
    element?: TrackElement;
  }>({ isDragging: false, dragType: 'move', startX: 0, startTime: 0 });

  // Initialize timeline project if different
  useEffect(() => {
    if (timeline.currentProject?.id !== project.id) {
      timeline.setProject(project);
    }
  }, [project, timeline]);

  // Sync project updates back to parent
  useEffect(() => {
    if (timeline.currentProject && timeline.currentProject.id === project.id) {
      onProjectUpdate(timeline.currentProject);
    }
  }, [timeline.currentProject, onProjectUpdate, project.id]);

  // Convert scenes to track elements
  const sceneElements = useMemo(() => {
    let currentTime = 0;
    return project.scenes.map((scene, index) => {
      const element: TrackElement = {
        id: `scene-${scene.id}`,
        sceneId: scene.id,
        startTime: currentTime,
        endTime: currentTime + scene.duration,
        duration: scene.duration,
        type: 'scene',
        name: scene.title,
        locked: false,
        visible: true,
        color: selectedSceneId === scene.id ? '#3b82f6' : '#6b7280'
      };
      currentTime += scene.duration;
      return element;
    });
  }, [project.scenes, selectedSceneId]);

  // Timeline controls
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const currentZoom = timeline.timelineState.zoom;
    const newZoom = direction === 'in' 
      ? Math.min(currentZoom * 1.5, 400) 
      : Math.max(currentZoom / 1.5, 5);
    timeline.setZoom(newZoom);
  }, [timeline]);

  // Marker management
  const addMarker = useCallback((time: number, type: TimelineMarker['type'] = 'chapter') => {
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      time,
      type,
      label: type === 'in' ? 'In' : type === 'out' ? 'Out' : `Marcador ${markers.length + 1}`,
      color: type === 'in' ? '#10b981' : type === 'out' ? '#ef4444' : '#f59e0b'
    };
    
    setMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time));
    toast.success(`Marcador ${newMarker.label} adicionado`);
  }, [markers.length]);

  const removeMarker = useCallback((markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId));
    toast.success('Marcador removido');
  }, []);

  // Scene manipulation with enhanced features
  const handleSceneReorder = useCallback((sceneId: string, newIndex: number) => {
    const sceneIndex = project.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    const newScenes = [...project.scenes];
    const [movedScene] = newScenes.splice(sceneIndex, 1);
    newScenes.splice(newIndex, 0, movedScene);

    const updatedProject = { ...project, scenes: newScenes };
    onProjectUpdate(updatedProject);
    
    toast.success('Cena reposicionada na timeline');
  }, [project, onProjectUpdate]);

  const handleSceneDurationChange = useCallback((sceneId: string, newDuration: number) => {
    timeline.updateScene(sceneId, { duration: newDuration });
    toast.success(`Duração da cena atualizada para ${newDuration.toFixed(1)}s`);
  }, [timeline]);

  const handleSceneSplit = useCallback((sceneId: string, splitTime: number) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene || splitTime <= 0 || splitTime >= scene.duration) return;

    // Create two new scenes from the split
    const firstPart: HeyGenScene = {
      ...scene,
      id: `${scene.id}-part1`,
      title: `${scene.title} (Parte 1)`,
      duration: splitTime
    };

    const secondPart: HeyGenScene = {
      ...scene,
      id: `${scene.id}-part2`,
      title: `${scene.title} (Parte 2)`,
      duration: scene.duration - splitTime,
      position: scene.position + 1
    };

    // Update project with split scenes
    const sceneIndex = project.scenes.findIndex(s => s.id === sceneId);
    const newScenes = [...project.scenes];
    newScenes.splice(sceneIndex, 1, firstPart, secondPart);

    // Update positions for subsequent scenes
    newScenes.forEach((s, index) => {
      if (index > sceneIndex + 1) {
        s.position = index;
      }
    });

    const updatedProject = { ...project, scenes: newScenes };
    onProjectUpdate(updatedProject);
    
    toast.success(`Cena "${scene.title}" dividida em duas partes`);
  }, [project, onProjectUpdate]);

  const handleSceneMerge = useCallback((sceneId1: string, sceneId2: string) => {
    const scene1 = project.scenes.find(s => s.id === sceneId1);
    const scene2 = project.scenes.find(s => s.id === sceneId2);
    
    if (!scene1 || !scene2) return;

    // Create merged scene
    const mergedScene: HeyGenScene = {
      ...scene1,
      id: `merged-${Date.now()}`,
      title: `${scene1.title} + ${scene2.title}`,
      content: `${scene1.content}\n\n${scene2.content}`,
      duration: scene1.duration + scene2.duration
    };

    // Remove original scenes and add merged scene
    const newScenes = project.scenes
      .filter(s => s.id !== sceneId1 && s.id !== sceneId2);
    
    const insertIndex = Math.min(scene1.position, scene2.position);
    newScenes.splice(insertIndex, 0, mergedScene);

    // Update positions
    newScenes.forEach((scene, index) => {
      scene.position = index;
    });

    const updatedProject = { ...project, scenes: newScenes };
    onProjectUpdate(updatedProject);
    
    toast.success('Cenas mescladas com sucesso');
  }, [project, onProjectUpdate]);

  // Advanced editing operations
  const handleRippleDelete = useCallback((sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const updatedScenes = project.scenes.filter(s => s.id !== sceneId);
    
    // Update positions for scenes after the deleted one
    updatedScenes.forEach((s, index) => {
      s.position = index;
    });

    const updatedProject = { ...project, scenes: updatedScenes };
    onProjectUpdate(updatedProject);
    
    toast.success(`Cena "${scene.title}" removida (ripple edit)`);
  }, [project, onProjectUpdate]);

  const handleNudge = useCallback((sceneId: string, direction: 'left' | 'right', amount: number = 0.1) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const newDuration = direction === 'left' 
      ? Math.max(0.1, scene.duration - amount)
      : scene.duration + amount;

    timeline.updateScene(sceneId, { duration: newDuration });
    
    toast.success(`Cena ajustada ${direction === 'left' ? '-' : '+'}${amount}s`);
  }, [project.scenes, timeline]);

  // Timeline rendering calculations
  const getElementPosition = useCallback((element: TrackElement): { left: number; width: number } => {
    return {
      left: element.startTime * timeline.timelineState.zoom,
      width: element.duration * timeline.timelineState.zoom
    };
  }, [timeline.timelineState.zoom]);

  // Mouse event handlers for timeline interaction
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = x / timeline.timelineState.zoom;
    
    if (event.altKey) {
      // Add marker on Alt+click
      addMarker(time);
    } else if (event.ctrlKey || event.metaKey) {
      // Add in/out markers
      const type = event.shiftKey ? 'out' : 'in';
      addMarker(time, type);
    } else {
      // Seek to time
      timeline.seek(time);
    }
  }, [timeline, addMarker]);

  // Snap to grid/markers
  const snapTime = useCallback((time: number): number => {
    if (!snappingEnabled) return time;
    
    const snapTolerance = 0.5 / timeline.timelineState.zoom; // 0.5 pixels in time units
    
    // Snap to markers
    for (const marker of markers) {
      if (Math.abs(time - marker.time) < snapTolerance) {
        return marker.time;
      }
    }
    
    // Snap to scene boundaries
    for (const element of sceneElements) {
      if (Math.abs(time - element.startTime) < snapTolerance) {
        return element.startTime;
      }
      if (Math.abs(time - element.endTime) < snapTolerance) {
        return element.endTime;
      }
    }
    
    // Snap to grid (every second)
    const gridTime = Math.round(time);
    if (Math.abs(time - gridTime) < snapTolerance) {
      return gridTime;
    }
    
    return time;
  }, [snappingEnabled, timeline.timelineState.zoom, markers, sceneElements]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get in/out points
  const inPoint = markers.find(m => m.type === 'in')?.time;
  const outPoint = markers.find(m => m.type === 'out')?.time;
  const workAreaDuration = inPoint !== undefined && outPoint !== undefined ? outPoint - inPoint : null;

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FastForward className="w-5 h-5" />
            Timeline Avançada
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Timeline Info */}
            <div className="text-sm text-gray-600 space-x-4">
              <span>{formatTime(timeline.timelineState.currentTime)} / {formatTime(timeline.timelineState.totalDuration)}</span>
              {workAreaDuration && (
                <Badge variant="outline" className="text-xs">
                  Área: {formatTime(workAreaDuration)}
                </Badge>
              )}
              {timeline.currentSceneInfo && (
                <Badge variant="secondary" className="text-xs">
                  {timeline.currentSceneInfo.scene.title}
                </Badge>
              )}
            </div>
            
            {/* Timeline Settings */}
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Enhanced Playback Controls */}
        <div className="flex items-center justify-between">
          <PlaybackControls
            timelineState={timeline.timelineState}
            onPlay={timeline.play}
            onPause={timeline.pause}
            onStop={timeline.stop}
            onSeek={timeline.seek}
            onVolumeChange={timeline.setVolume}
            onMuteToggle={timeline.toggleMute}
            onSpeedChange={timeline.setSpeed}
          />
          
          {/* Timeline Tools */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={snappingEnabled ? 'default' : 'outline'}
              onClick={() => setSnappingEnabled(!snappingEnabled)}
            >
              Snap
            </Button>
            
            <Button 
              size="sm" 
              variant={rippleEdit ? 'default' : 'outline'}
              onClick={() => setRippleEdit(!rippleEdit)}
            >
              Ripple
            </Button>
            
            <div className="flex border rounded">
              <Button
                size="sm"
                variant="outline"
                onClick={() => inPoint !== undefined ? timeline.seek(inPoint) : addMarker(timeline.timelineState.currentTime, 'in')}
                className="rounded-r-none"
              >
                In
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => outPoint !== undefined ? timeline.seek(outPoint) : addMarker(timeline.timelineState.currentTime, 'out')}
                className="rounded-l-none"
              >
                Out
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleZoom('out')}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 w-20 text-center">
              {Math.round(timeline.timelineState.zoom)}px/s
            </span>
            <Button size="sm" variant="outline" onClick={() => handleZoom('in')}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <div className="ml-4 flex items-center gap-2">
              <label className="text-sm text-gray-600">Altura:</label>
              <Slider
                value={[trackHeight]}
                onValueChange={([value]) => setTrackHeight(value)}
                min={40}
                max={120}
                step={10}
                className="w-20"
              />
            </div>
          </div>

          {/* Timeline View Options */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={showWaveforms ? 'default' : 'outline'}
              onClick={() => setShowWaveforms(!showWaveforms)}
            >
              Waveforms
            </Button>
            
            <Button 
              size="sm" 
              variant={showMarkers ? 'default' : 'outline'}
              onClick={() => setShowMarkers(!showMarkers)}
            >
              Marcadores
            </Button>
            
            {selectedTracks.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={() => {
                  selectedTracks.forEach(sceneId => {
                    const duplicatedScene = { ...project.scenes.find(s => s.id === sceneId)! };
                    duplicatedScene.id = `${duplicatedScene.id}-copy-${Date.now()}`;
                    duplicatedScene.title = `${duplicatedScene.title} (Cópia)`;
                  });
                  setSelectedTracks([]);
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => {
                  if (rippleEdit) {
                    selectedTracks.forEach(sceneId => handleRippleDelete(sceneId));
                  } else {
                    // Normal delete
                    selectedTracks.forEach(sceneId => {
                      const updatedScenes = project.scenes.filter(s => s.id !== sceneId);
                      onProjectUpdate({ ...project, scenes: updatedScenes });
                    });
                  }
                  setSelectedTracks([]);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => {
                  const [firstId, secondId] = selectedTracks;
                  if (firstId && secondId) {
                    handleSceneMerge(firstId, secondId);
                    setSelectedTracks([]);
                  }
                }}>
                  <Merge className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="flex-1 bg-gray-50 rounded-lg border relative overflow-hidden">
          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 border-b border-gray-200 overflow-hidden z-20">
            <div className="relative h-full" style={{ minWidth: timeline.timelineState.totalDuration * timeline.timelineState.zoom }}>
              {/* Major tick marks (every second) */}
              {Array.from({ length: Math.ceil(timeline.timelineState.totalDuration) + 1 }, (_, i) => (
                <div
                  key={`major-${i}`}
                  className="absolute top-0 h-full border-l border-gray-400"
                  style={{ left: i * timeline.timelineState.zoom }}
                >
                  <span className="absolute top-0.5 left-1 text-xs text-gray-700 font-medium">
                    {formatTime(i)}
                  </span>
                </div>
              ))}
              
              {/* Minor tick marks */}
              {timeline.timelineState.zoom > 30 && Array.from({ 
                length: Math.ceil(timeline.timelineState.totalDuration * 2) + 1 
              }, (_, i) => (
                <div
                  key={`minor-${i}`}
                  className="absolute top-4 h-4 border-l border-gray-300"
                  style={{ left: (i * 0.5) * timeline.timelineState.zoom }}
                />
              ))}
              
              {/* Markers */}
              {showMarkers && markers.map(marker => (
                <div
                  key={marker.id}
                  className="absolute top-0 h-full border-l-2 cursor-pointer group"
                  style={{ 
                    left: marker.time * timeline.timelineState.zoom,
                    borderColor: marker.color || '#f59e0b'
                  }}
                  onClick={() => timeline.seek(marker.time)}
                >
                  <div 
                    className="absolute top-0 left-0 px-1 text-xs text-white rounded-br"
                    style={{ backgroundColor: marker.color || '#f59e0b' }}
                  >
                    {marker.label}
                  </div>
                  <button
                    className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMarker(marker.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Work area (in/out points) */}
              {inPoint !== undefined && outPoint !== undefined && (
                <div
                  className="absolute top-0 h-full bg-blue-200 bg-opacity-30 border-l-2 border-r-2 border-blue-500"
                  style={{
                    left: inPoint * timeline.timelineState.zoom,
                    width: (outPoint - inPoint) * timeline.timelineState.zoom
                  }}
                />
              )}
            </div>
          </div>

          {/* Timeline tracks */}
          <div 
            ref={timelineRef}
            className="pt-8 h-full overflow-x-auto overflow-y-hidden cursor-pointer"
            style={{ minWidth: timeline.timelineState.totalDuration * timeline.timelineState.zoom }}
            onClick={handleTimelineClick}
          >
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{ left: timeline.timelineState.currentTime * timeline.timelineState.zoom }}
            />

            {/* Scene tracks */}
            <div className="relative h-full">
              {sceneElements.map((element, index) => {
                const position = getElementPosition(element);
                const isSelected = selectedTracks.includes(element.sceneId);
                const scene = project.scenes.find(s => s.id === element.sceneId);
                
                return (
                  <div
                    key={element.id}
                    className={`absolute border rounded cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    style={{
                      left: position.left,
                      width: Math.max(position.width, 60), // Minimum width
                      top: index * (trackHeight + 4),
                      height: trackHeight,
                      backgroundColor: element.color + '20'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSceneSelect(element.sceneId);
                      
                      if (e.ctrlKey || e.metaKey) {
                        setSelectedTracks(prev => 
                          prev.includes(element.sceneId)
                            ? prev.filter(id => id !== element.sceneId)
                            : [...prev, element.sceneId]
                        );
                      } else {
                        setSelectedTracks([element.sceneId]);
                      }
                    }}
                    onDoubleClick={() => {
                      // Double-click to split at current time
                      const relativeTime = timeline.timelineState.currentTime - element.startTime;
                      if (relativeTime > 0 && relativeTime < element.duration) {
                        handleSceneSplit(element.sceneId, relativeTime);
                      }
                    }}
                  >
                    {/* Scene content */}
                    <div className="p-2 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {element.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {scene?.avatar && (
                            <Badge variant="outline" className="text-xs">
                              Avatar
                            </Badge>
                          )}
                          {scene?.voice && (
                            <Badge variant="outline" className="text-xs">
                              Voz
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatTime(element.duration)}</span>
                        <div className="flex gap-1">
                          <button
                            className="hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudge(element.sceneId, 'left');
                            }}
                          >
                            ◂
                          </button>
                          <button
                            className="hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNudge(element.sceneId, 'right');
                            }}
                          >
                            ▸
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Waveform visualization (placeholder) */}
                    {showWaveforms && scene?.audio && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-100 opacity-50">
                        {/* Simplified waveform representation */}
                        <svg width="100%" height="100%" className="opacity-60">
                          {Array.from({ length: Math.floor(position.width / 4) }, (_, i) => (
                            <rect
                              key={i}
                              x={i * 4}
                              y={Math.random() * 16 + 8}
                              width="2"
                              height={Math.random() * 16 + 4}
                              fill="#059669"
                            />
                          ))}
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scene Properties Panel */}
        {selectedSceneId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SceneDurationEditor
              scene={project.scenes.find(s => s.id === selectedSceneId)!}
              onDurationChange={(newDuration) => handleSceneDurationChange(selectedSceneId, newDuration)}
            />
            
            <TransitionEditor
              scene={project.scenes.find(s => s.id === selectedSceneId)!}
              onTransitionChange={(transition) => {
                console.log('Transition changed:', transition);
              }}
            />
            
            {/* Markers Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Marcadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => addMarker(timeline.timelineState.currentTime, 'chapter')}
                  >
                    + Capítulo
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addMarker(timeline.timelineState.currentTime, 'comment')}
                  >
                    + Nota
                  </Button>
                </div>
                
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {markers.map(marker => (
                    <div key={marker.id} className="flex items-center justify-between text-xs">
                      <span>{marker.label} ({formatTime(marker.time)})</span>
                      <button
                        onClick={() => removeMarker(marker.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};