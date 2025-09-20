import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HeyGenProject, HeyGenScene } from '../lib/pptx/heygen-scene-manager';
import { audioExportService } from '../lib/tts/AudioExportService';
import { TimelineState } from '../components/pptx/TimelineEditor';

interface TimelineContextType {
  timelineState: TimelineState;
  currentProject: HeyGenProject | null;
  isMediaReady: boolean;
  currentSceneInfo: {
    scene: HeyGenScene;
    index: number;
    sceneStartTime: number;
    relativeTime: number;
  } | null;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  toggleMute: () => void;
  
  // Timeline controls
  setZoom: (zoom: number) => void;
  
  // Project management
  setProject: (project: HeyGenProject) => void;
  updateScene: (sceneId: string, updates: Partial<HeyGenScene>) => void;
}

const TimelineContext = createContext<TimelineContextType | null>(null);

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};

interface TimelineProviderProps {
  children: React.ReactNode;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentTime: 0,
    isPlaying: false,
    isPaused: false,
    volume: 0.8,
    isMuted: false,
    zoom: 50,
    totalDuration: 0,
    playbackSpeed: 1.0
  });

  const [currentProject, setCurrentProject] = useState<HeyGenProject | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [sceneAudios, setSceneAudios] = useState<Map<string, HTMLAudioElement>>(new Map());
  
  const playbackTimerRef = useRef<number | null>(null);
  const mediaClockRef = useRef<number>(0);

  // Calculate total duration when project changes
  useEffect(() => {
    if (currentProject) {
      const totalDuration = currentProject.scenes.reduce((total, scene) => total + scene.duration, 0);
      setTimelineState(prev => ({ ...prev, totalDuration }));
    }
  }, [currentProject]);

  // Load scene audios when project changes
  useEffect(() => {
    if (!currentProject) return;

    const loadAudioElements = async () => {
      const audioMap = new Map<string, HTMLAudioElement>();
      
      for (const scene of currentProject.scenes) {
        if (scene.voice && scene.slideData.textContent) {
          try {
            // Generate real audio using TTS service
            const audioBlob = await audioExportService.generateSceneAudio(scene);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            audio.preload = 'auto';
            audio.volume = timelineState.volume;
            
            audioMap.set(scene.id, audio);
          } catch (error) {
            console.error(`Failed to generate audio for scene ${scene.id}:`, error);
            // Create silent placeholder if TTS fails
            const audio = new Audio();
            audioMap.set(scene.id, audio);
          }
        }
      }
      
      setSceneAudios(audioMap);
      setIsMediaReady(true);
    };

    loadAudioElements();
  }, [currentProject, timelineState.volume]);

  // Playback timer
  useEffect(() => {
    if (timelineState.isPlaying && !timelineState.isPaused && isMediaReady) {
      playbackTimerRef.current = window.setInterval(() => {
        setTimelineState(prev => {
          const newTime = prev.currentTime + (0.1 * prev.playbackSpeed);
          if (newTime >= prev.totalDuration) {
            // Stop playback at end
            stopPlayback();
            return { ...prev, currentTime: prev.totalDuration, isPlaying: false };
          }
          
          mediaClockRef.current = newTime;
          return { ...prev, currentTime: newTime };
        });
      }, 100);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [timelineState.isPlaying, timelineState.isPaused, timelineState.playbackSpeed, isMediaReady]);

  // Update audio elements when timeline state changes
  useEffect(() => {
    sceneAudios.forEach(audio => {
      audio.volume = timelineState.isMuted ? 0 : timelineState.volume;
      audio.playbackRate = timelineState.playbackSpeed;
    });
  }, [timelineState.volume, timelineState.isMuted, timelineState.playbackSpeed, sceneAudios]);

  // Get current scene info based on timeline position
  const getCurrentSceneInfo = () => {
    if (!currentProject) return null;
    
    let currentTime = 0;
    for (let i = 0; i < currentProject.scenes.length; i++) {
      const scene = currentProject.scenes[i];
      if (currentTime + scene.duration > timelineState.currentTime) {
        return {
          scene,
          index: i,
          sceneStartTime: currentTime,
          relativeTime: timelineState.currentTime - currentTime
        };
      }
      currentTime += scene.duration;
    }
    return null;
  };

  const currentSceneInfo = getCurrentSceneInfo();

  // Sync audio playback with timeline
  useEffect(() => {
    if (!currentSceneInfo || !isMediaReady) return;

    const audio = sceneAudios.get(currentSceneInfo.scene.id);
    if (!audio) return;

    if (timelineState.isPlaying && !timelineState.isPaused) {
      // Start playing current scene audio
      audio.currentTime = currentSceneInfo.relativeTime;
      audio.play().catch(console.error);
    } else {
      // Pause all audio
      sceneAudios.forEach(a => a.pause());
    }
  }, [timelineState.isPlaying, timelineState.isPaused, currentSceneInfo, sceneAudios, isMediaReady]);

  // Playback control functions
  const play = () => {
    setTimelineState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
  };

  const pause = () => {
    setTimelineState(prev => ({ ...prev, isPaused: true }));
  };

  const stop = () => {
    setTimelineState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      currentTime: 0 
    }));
    
    // Stop all audio
    sceneAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const stopPlayback = () => {
    setTimelineState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    sceneAudios.forEach(audio => audio.pause());
  };

  const seek = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timelineState.totalDuration));
    setTimelineState(prev => ({ ...prev, currentTime: clampedTime }));
    
    // Update audio positions
    const newSceneInfo = getCurrentSceneInfo();
    if (newSceneInfo) {
      const audio = sceneAudios.get(newSceneInfo.scene.id);
      if (audio) {
        audio.currentTime = newSceneInfo.relativeTime;
      }
    }
  };

  const setVolume = (volume: number) => {
    setTimelineState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  };

  const setSpeed = (speed: number) => {
    setTimelineState(prev => ({ ...prev, playbackSpeed: Math.max(0.25, Math.min(4, speed)) }));
  };

  const toggleMute = () => {
    setTimelineState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const setZoom = (zoom: number) => {
    setTimelineState(prev => ({ ...prev, zoom: Math.max(10, Math.min(200, zoom)) }));
  };

  const setProject = (project: HeyGenProject) => {
    // Stop current playback
    stop();
    setCurrentProject(project);
    setIsMediaReady(false);
  };

  const updateScene = (sceneId: string, updates: Partial<HeyGenScene>) => {
    if (!currentProject) return;

    const updatedScenes = currentProject.scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );

    setCurrentProject({ ...currentProject, scenes: updatedScenes });
  };

  const contextValue: TimelineContextType = {
    timelineState,
    currentProject,
    isMediaReady,
    currentSceneInfo,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setSpeed,
    toggleMute,
    setZoom,
    setProject,
    updateScene
  };

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
};

export default TimelineProvider;