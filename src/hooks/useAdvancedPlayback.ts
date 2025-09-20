import { useState, useCallback, useRef, useEffect } from 'react';
import { useTimeline } from '../components/editor/Timeline';

interface AdvancedPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  loop: boolean;
  isFullscreen: boolean;
  frameRate: number;
  buffered: TimeRanges | null;
}

interface AdvancedPlaybackControls {
  state: AdvancedPlaybackState;
  togglePlayback: () => void;
  seekTo: (time: number) => void;
  frameStep: (direction: 'forward' | 'backward') => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  stop: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  skipSeconds: (seconds: number) => void;
  syncWithTimeline: (timelineTime: number) => void;
}

interface UseAdvancedPlaybackOptions {
  frameRate?: number;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}

export const useAdvancedPlayback = (
  videoRef: React.RefObject<HTMLVideoElement>,
  options: UseAdvancedPlaybackOptions = {}
): AdvancedPlaybackControls => {
  const timeline = useTimeline();
  const {
    frameRate = 30,
    onTimeUpdate,
    onPlayStateChange,
    onVolumeChange
  } = options;

  const [state, setState] = useState<AdvancedPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    loop: false,
    isFullscreen: false,
    frameRate: 30,
    buffered: null
  });

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Sync with timeline state
  useEffect(() => {
    if (timeline.currentTime !== state.currentTime) {
      setState(prev => ({ ...prev, currentTime: timeline.currentTime }));
      if (videoRef.current) {
        videoRef.current.currentTime = timeline.currentTime;
      }
    }
  }, [timeline.currentTime, videoRef]);

  // Update time continuously when playing
  const updateTime = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    if (currentTime !== lastTimeRef.current) {
      setState(prev => ({ ...prev, currentTime }));
      timeline.setCurrentTime(currentTime);
      onTimeUpdate?.(currentTime);
      lastTimeRef.current = currentTime;
    }

    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [state.isPlaying, onTimeUpdate, videoRef, timeline]);

  // Start/stop time updates based on play state
  useEffect(() => {
    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, updateTime]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: video.duration,
        currentTime: video.currentTime,
        buffered: video.buffered
      }));
    };

    const handleTimeUpdate = () => {
      if (!state.isPlaying) {
        setState(prev => ({ ...prev, currentTime: video.currentTime }));
        onTimeUpdate?.(video.currentTime);
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onPlayStateChange?.(false);
    };

    const handleEnded = () => {
      if (state.loop) {
        video.currentTime = 0;
        video.play();
      } else {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        onPlayStateChange?.(false);
      }
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: video.volume,
        isMuted: video.muted
      }));
      onVolumeChange?.(video.volume, video.muted);
    };

    const handleRateChange = () => {
      setState(prev => ({ ...prev, playbackRate: video.playbackRate }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [videoRef, state.loop, onTimeUpdate, onPlayStateChange, onVolumeChange]);

  // Control functions
  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (state.isPlaying) {
      video.pause();
      timeline.pause();
    } else {
      video.play().catch(console.error);
      timeline.play();
    }
  }, [videoRef, state.isPlaying, timeline]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedTime = Math.max(0, Math.min(time, state.duration));
    video.currentTime = clampedTime;
    timeline.setCurrentTime(clampedTime);
    setState(prev => ({ ...prev, currentTime: clampedTime }));
    onTimeUpdate?.(clampedTime);
  }, [videoRef, state.duration, timeline, onTimeUpdate]);

  const frameStep = useCallback((direction: 'forward' | 'backward') => {
    const video = videoRef.current;
    if (!video) return;

    const frameDuration = 1 / state.frameRate;
    const newTime = direction === 'forward' 
      ? state.currentTime + frameDuration
      : state.currentTime - frameDuration;
    
    seekTo(newTime);
  }, [videoRef, state.frameRate, state.currentTime, seekTo]);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, [videoRef]);

  const toggleLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newLoop = !state.loop;
    video.loop = newLoop;
    setState(prev => ({ ...prev, loop: newLoop }));
  }, [videoRef, state.loop]);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    video.volume = clampedVolume;
    video.muted = clampedVolume === 0;
    setState(prev => ({ 
      ...prev, 
      volume: clampedVolume,
      isMuted: clampedVolume === 0
    }));
    onVolumeChange?.(clampedVolume, clampedVolume === 0);
  }, [videoRef, onVolumeChange]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !state.isMuted;
    video.muted = newMuted;
    setState(prev => ({ ...prev, isMuted: newMuted }));
    onVolumeChange?.(state.volume, newMuted);
  }, [videoRef, state.isMuted, state.volume, onVolumeChange]);

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (state.isFullscreen) {
        await document.exitFullscreen();
      } else {
        await video.requestFullscreen();
      }
      setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [videoRef, state.isFullscreen]);

  const stop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    onPlayStateChange?.(false);
    onTimeUpdate?.(0);
  }, [videoRef, onPlayStateChange, onTimeUpdate]);

  const goToStart = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  const goToEnd = useCallback(() => {
    seekTo(state.duration);
  }, [seekTo, state.duration]);

  const syncWithTimeline = useCallback((timelineTime: number) => {
    if (Math.abs(timelineTime - state.currentTime) > 0.1) { // Only sync if difference > 100ms
      seekTo(timelineTime);
    }
  }, [state.currentTime, seekTo]);

  const skipSeconds = useCallback((seconds: number) => {
    seekTo(state.currentTime + seconds);
  }, [seekTo, state.currentTime]);

  return {
    state: {
      ...state,
      isPlaying: timeline.isPlaying || state.isPlaying,
      playbackRate: timeline.playbackRate || state.playbackRate
    },
    togglePlayback,
    seekTo,
    frameStep,
    setPlaybackRate,
    toggleLoop,
    setVolume,
    toggleMute,
    toggleFullscreen,
    stop,
    goToStart,
    goToEnd,
    skipSeconds,
    syncWithTimeline
  };
};

export default useAdvancedPlayback;