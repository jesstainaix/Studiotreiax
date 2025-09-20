import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
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
  FastForward
} from 'lucide-react';
import { HeyGenProject, HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { TimelineTrack } from './TimelineTrack';
import { PlaybackControls } from './PlaybackControls';
import { SceneDurationEditor } from './SceneDurationEditor';
import { TransitionEditor } from './TransitionEditor';
import { useTimeline } from '../../context/TimelineContext';
import { toast } from 'sonner';

interface TimelineEditorProps {
  project: HeyGenProject;
  onProjectUpdate: (project: HeyGenProject) => void;
  onSceneSelect: (sceneId: string) => void;
  selectedSceneId?: string;
  className?: string;
}

export interface TimelineState {
  currentTime: number; // in seconds
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  zoom: number; // pixels per second
  totalDuration: number;
  playbackSpeed: number;
}

export interface SceneTransition {
  id: string;
  type: 'cut' | 'fade' | 'dissolve' | 'slide' | 'wipe';
  duration: number; // in milliseconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  properties?: Record<string, any>;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  project,
  onProjectUpdate,
  onSceneSelect,
  selectedSceneId,
  className = ''
}) => {
  // Use timeline context for unified playback state
  const timeline = useTimeline();
  
  // Initialize timeline project if different
  React.useEffect(() => {
    if (timeline.currentProject?.id !== project.id) {
      timeline.setProject(project);
    }
  }, [project, timeline]);

  // Sync project updates back to parent
  React.useEffect(() => {
    if (timeline.currentProject && timeline.currentProject.id === project.id) {
      onProjectUpdate(timeline.currentProject);
    }
  }, [timeline.currentProject, onProjectUpdate, project.id]);

  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Timeline controls - use context methods
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const currentZoom = timeline.timelineState.zoom;
    const newZoom = direction === 'in' 
      ? Math.min(currentZoom * 1.5, 200) 
      : Math.max(currentZoom / 1.5, 10);
    timeline.setZoom(newZoom);
  }, [timeline]);

  // Scene manipulation
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

  const handleSceneDelete = useCallback((sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const updatedScenes = project.scenes.filter(s => s.id !== sceneId);
    const updatedProject = { ...project, scenes: updatedScenes };
    onProjectUpdate(updatedProject);
    
    toast.success(`Cena "${scene.title}" removida`);
  }, [project, onProjectUpdate]);

  const handleSceneDuplicate = useCallback((sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const duplicatedScene: HeyGenScene = {
      ...scene,
      id: `${scene.id}-copy-${Date.now()}`,
      title: `${scene.title} (Cópia)`
    };

    const sceneIndex = project.scenes.findIndex(s => s.id === sceneId);
    const newScenes = [...project.scenes];
    newScenes.splice(sceneIndex + 1, 0, duplicatedScene);

    const updatedProject = { ...project, scenes: newScenes };
    onProjectUpdate(updatedProject);
    
    toast.success(`Cena "${scene.title}" duplicada`);
  }, [project, onProjectUpdate]);

  // Timeline rendering calculations
  const getScenePosition = useCallback((sceneIndex: number): { left: number; width: number } => {
    let startTime = 0;
    for (let i = 0; i < sceneIndex; i++) {
      startTime += project.scenes[i].duration;
    }
    
    return {
      left: startTime * timeline.timelineState.zoom,
      width: project.scenes[sceneIndex].duration * timeline.timelineState.zoom
    };
  }, [project.scenes, timeline.timelineState.zoom]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FastForward className="w-5 h-5" />
            Editor de Timeline
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {formatTime(timeline.timelineState.currentTime)} / {formatTime(timeline.timelineState.totalDuration)}
            </span>
            {currentSceneInfo && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Cena: {currentSceneInfo.scene.title}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Playback Controls */}
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
          </div>

          <div className="flex items-center gap-2">
            {selectedTracks.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={() => {
                  selectedTracks.forEach(sceneId => handleSceneDuplicate(sceneId));
                  setSelectedTracks([]);
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  selectedTracks.forEach(sceneId => handleSceneDelete(sceneId));
                  setSelectedTracks([]);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="flex-1 bg-gray-50 rounded-lg border relative overflow-hidden">
          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 border-b border-gray-200 overflow-hidden">
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
              
              {/* Minor tick marks (every 0.5 seconds for high zoom) */}
              {timeline.timelineState.zoom > 30 && Array.from({ 
                length: Math.ceil(timeline.timelineState.totalDuration * 2) + 1 
              }, (_, i) => (
                <div
                  key={`minor-${i}`}
                  className="absolute top-4 h-4 border-l border-gray-300"
                  style={{ left: (i * 0.5) * timeline.timelineState.zoom }}
                />
              ))}
              
              {/* Sub-minor tick marks (every 0.1 seconds for very high zoom) */}
              {timeline.timelineState.zoom > 80 && Array.from({ 
                length: Math.ceil(timeline.timelineState.totalDuration * 10) + 1 
              }, (_, i) => (
                <div
                  key={`sub-${i}`}
                  className="absolute top-6 h-2 border-l border-gray-200"
                  style={{ left: (i * 0.1) * timeline.timelineState.zoom }}
                />
              ))}
            </div>
          </div>

          {/* Timeline tracks */}
          <div 
            ref={timelineRef}
            className="pt-8 h-full overflow-x-auto overflow-y-hidden"
            style={{ minWidth: timeline.timelineState.totalDuration * timeline.timelineState.zoom }}
          >
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: timeline.timelineState.currentTime * timeline.timelineState.zoom }}
            />

            {/* Scene tracks */}
            <div className="relative h-full">
              {project.scenes.map((scene, index) => {
                const position = getScenePosition(index);
                const isSelected = selectedTracks.includes(scene.id);
                
                return (
                  <TimelineTrack
                    key={scene.id}
                    scene={scene}
                    index={index}
                    position={position}
                    isSelected={isSelected}
                    timelineState={timeline.timelineState}
                    onSelect={() => {
                      onSceneSelect(scene.id);
                      setSelectedTracks(prev => 
                        prev.includes(scene.id) 
                          ? prev.filter(id => id !== scene.id)
                          : [...prev, scene.id]
                      );
                    }}
                    onDurationChange={(newDuration) => handleSceneDurationChange(scene.id, newDuration)}
                    onReorder={(newIndex) => handleSceneReorder(scene.id, newIndex)}
                    onDelete={() => handleSceneDelete(scene.id)}
                    onDuplicate={() => handleSceneDuplicate(scene.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Scene Properties Panel */}
        {selectedSceneId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SceneDurationEditor
              scene={project.scenes.find(s => s.id === selectedSceneId)!}
              onDurationChange={(newDuration) => handleSceneDurationChange(selectedSceneId, newDuration)}
            />
            
            <TransitionEditor
              scene={project.scenes.find(s => s.id === selectedSceneId)!}
              onTransitionChange={(transition) => {
                // Handle transition changes
                console.log('Transition changed:', transition);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineEditor;