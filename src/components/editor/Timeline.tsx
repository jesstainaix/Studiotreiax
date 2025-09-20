import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Scissors, Copy, Trash2, Lock, Unlock, Eye, EyeOff, ZoomIn, ZoomOut, Grid, Maximize2, Move, RotateCcw, RotateCw, Plus, Minus, ChevronRight, ChevronDown, ChevronLeft, Settings, Video, Music, Wand2, Sparkles, Brain, Palette } from 'lucide-react';
import { useAIEditing } from '../../services/aiEditingService';
import { useEffectDragDrop } from '@/hooks/useEffectDragDrop';

export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'shape' | 'effect';
  name: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  trackId: string;
  url?: string;
  thumbnail?: string;
  volume?: number;
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;
  effects?: string[];
  transitions?: {
    in?: string;
    out?: string;
  };
  position: {
    x: number;
    y: number;
  };
  selected?: boolean;
  color?: string;
  opacity?: number;
  speed?: number;
  // Enhanced cinematic editing properties
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
  keyframes?: any[];
  markers?: any[];
  interpolationType?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'shape' | 'effect' | 'group';
  name: string;
  height: number;
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;
  clips: TimelineClip[];
  color?: string;
  solo?: boolean;
  volume?: number;
  pan?: number; // -1 to 1 for audio tracks
  effects?: string[];
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
  opacity?: number;
  collapsed?: boolean;
  armed?: boolean; // for recording
  // Enhanced cinematic editing properties
  childTrackIds?: string[];
  parentTrackId?: string;
  groupId?: string;
  markers?: any[];
  automation?: any[];
  transitions?: any[];
  keyframes?: any[];
}

export interface TimelineState {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  zoom: number;
  isPlaying: boolean;
  selectedClips: string[];
  draggedClip: TimelineClip | null;
  snapToGrid: boolean;
  gridSize: number;
  playbackRate: number;
  viewportStart: number;
  viewportEnd: number;
  magneticSnap: boolean;
  rippleEdit: boolean;
  // Enhanced cinematic editing state
  trackGroups: any[];
  globalMarkers: any[];
  selectedTracks: string[];
  selectedMarkers: string[];
  selectedKeyframes: string[];
  automationMode: boolean;
  performanceMode: boolean;
  renderStats: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
  };
  
  // Actions
  addTrack: (type: 'video' | 'audio', name?: string) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  addClip: (trackId: string, clip: Omit<TimelineClip, 'id' | 'trackId'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  duplicateClip: (clipId: string) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  selectClip: (clipId: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  setViewport: (start: number, end: number) => void;
  play: () => void;
  pause: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleSnapToGrid: () => void;
  toggleMagneticSnap: () => void;
  toggleRippleEdit: () => void;
  // Enhanced cinematic editing actions
  createTrackGroup: (name: string, trackIds: string[]) => void;
  removeTrackGroup: (groupId: string) => void;
  updateTrackGroup: (groupId: string, updates: any) => void;
  addMarker: (trackId: string | null, marker: any) => void;
  removeMarker: (markerId: string, trackId?: string) => void;
  addAutomationCurve: (trackId: string, curve: any) => void;
  removeAutomationCurve: (trackId: string, curveId: string) => void;
  selectTracks: (trackIds: string[]) => void;
  selectMarkers: (markerIds: string[]) => void;
  selectKeyframes: (keyframeIds: string[]) => void;
  toggleAutomationMode: () => void;
  togglePerformanceMode: () => void;
  updateRenderStats: (stats: { fps: number; frameTime: number; memoryUsage: number }) => void;
}

// Zustand store for timeline state
export const useTimeline = create<TimelineState>((set, get) => ({
  tracks: [
    {
      id: 'video-1',
      type: 'video',
      name: 'Video Track 1',
      height: 120,
      clips: [],
      color: '#3b82f6',
      visible: true,
      locked: false,
      volume: 1
    },
    {
      id: 'video-2',
      type: 'video',
      name: 'Video Track 2',
      height: 120,
      clips: [],
      color: '#6366f1',
      visible: true,
      locked: false,
      volume: 1
    },
    {
      id: 'audio-1',
      type: 'audio',
      name: 'Audio Track 1',
      height: 80,
      clips: [],
      color: '#10b981',
      visible: true,
      locked: false,
      volume: 1
    },
    {
      id: 'audio-2',
      type: 'audio',
      name: 'Audio Track 2',
      height: 80,
      clips: [],
      color: '#059669',
      visible: true,
      locked: false,
      volume: 1
    }
  ],
  currentTime: 0,
  duration: 300, // 5 minutes default
  zoom: 1,
  isPlaying: false,
  selectedClips: [],
  draggedClip: null,
  snapToGrid: true,
  gridSize: 1, // 1 second
  playbackRate: 1,
  viewportStart: 0,
  viewportEnd: 300,
  magneticSnap: true,
  rippleEdit: false,
  // Enhanced cinematic editing state initialization
  trackGroups: [],
  globalMarkers: [],
  selectedTracks: [],
  selectedMarkers: [],
  selectedKeyframes: [],
  automationMode: false,
  performanceMode: false,
  renderStats: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0
  },

  addTrack: (type, name) => {
    const tracks = get().tracks;
    const colors = {
      video: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'],
      audio: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
      text: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
      image: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
      shape: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
      effect: ['#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
      group: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a']
    };
    const existingTracks = tracks.filter(t => t.type === type);
    const colorIndex = existingTracks.length % colors[type].length;
    
    const trackHeights = {
      video: 120,
      audio: 80,
      text: 100,
      image: 100,
      shape: 80,
      effect: 60,
      group: 40
    };
    
    const newTrack: TimelineTrack = {
      id: `${type}-${Date.now()}`,
      type,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${existingTracks.length + 1}`,
      height: trackHeights[type] || 80,
      clips: [],
      color: colors[type][colorIndex],
      visible: true,
      locked: false,
      volume: 1,
      pan: type === 'audio' ? 0 : undefined,
      effects: [],
      blendMode: 'normal',
      opacity: 1,
      collapsed: false,
      armed: false,
      // Enhanced cinematic editing properties
      childTrackIds: [],
      markers: [],
      automation: [],
      transitions: [],
      keyframes: []
    };
    set({ tracks: [...tracks, newTrack] });
  },

  removeTrack: (trackId) => {
    const state = get();
    const tracks = state.tracks.filter(t => t.id !== trackId);
    const selectedClips = state.selectedClips.filter(clipId => {
      const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
      return clip && clip.trackId !== trackId;
    });
    set({ tracks, selectedClips });
  },

  reorderTracks: (fromIndex, toIndex) => {
    const state = get();
    const tracks = [...state.tracks];
    const [movedTrack] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, movedTrack);
    set({ tracks });
  },

  updateTrack: (trackId, updates) => {
    const tracks = get().tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    set({ tracks });
  },

  toggleTrackMute: (trackId) => {
    const tracks = get().tracks.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    );
    set({ tracks });
  },

  toggleTrackSolo: (trackId) => {
    const tracks = get().tracks.map(track => 
      track.id === trackId ? { ...track, solo: !track.solo } : track
    );
    set({ tracks });
  },

  toggleTrackLock: (trackId) => {
    const tracks = get().tracks.map(track => 
      track.id === trackId ? { ...track, locked: !track.locked } : track
    );
    set({ tracks });
  },

  setTrackVolume: (trackId, volume) => {
    const tracks = get().tracks.map(track => 
      track.id === trackId ? { ...track, volume: Math.max(0, Math.min(2, volume)) } : track
    );
    set({ tracks });
  },

  setTrackPan: (trackId, pan) => {
    const tracks = get().tracks.map(track => 
      track.id === trackId ? { ...track, pan: Math.max(-1, Math.min(1, pan)) } : track
    );
    set({ tracks });
  },

  addClip: (trackId, clipData) => {
    const tracks = get().tracks.map(track => {
      if (track.id === trackId) {
        const newClip: TimelineClip = {
          ...clipData,
          id: `clip-${Date.now()}`,
          trackId,
          volume: clipData.volume || 1,
          muted: clipData.muted || false,
          locked: clipData.locked || false,
          visible: clipData.visible !== false,
          position: clipData.position || { x: 0, y: 0 },
          opacity: clipData.opacity || 1,
          speed: clipData.speed || 1
        };
        return {
          ...track,
          clips: [...track.clips, newClip]
        };
      }
      return track;
    });
    set({ tracks });
  },

  removeClip: (clipId) => {
    const tracks = get().tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => clip.id !== clipId)
    }));
    set({ tracks, selectedClips: get().selectedClips.filter(id => id !== clipId) });
  },

  updateClip: (clipId, updates) => {
    const tracks = get().tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => 
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }));
    set({ tracks });
  },

  moveClip: (clipId, newTrackId, newStartTime) => {
    const { tracks, snapToGrid, gridSize, magneticSnap } = get();
    let snappedTime = newStartTime;
    
    if (snapToGrid) {
      snappedTime = Math.round(newStartTime / gridSize) * gridSize;
    }
    
    if (magneticSnap) {
      // Implement magnetic snapping to other clips
      const allClips = tracks.flatMap(t => t.clips).filter(c => c.id !== clipId);
      const snapDistance = 0.5; // 0.5 seconds
      
      for (const clip of allClips) {
        if (Math.abs(clip.startTime - snappedTime) < snapDistance) {
          snappedTime = clip.startTime;
          break;
        }
        if (Math.abs((clip.startTime + clip.duration) - snappedTime) < snapDistance) {
          snappedTime = clip.startTime + clip.duration;
          break;
        }
      }
    }
    
    let clipToMove: TimelineClip | null = null;
    
    // Remove clip from current track
    const updatedTracks = tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => {
        if (clip.id === clipId) {
          clipToMove = clip;
          return false;
        }
        return true;
      })
    }));
    
    if (clipToMove) {
      // Add clip to new track
      const finalTracks = updatedTracks.map(track => {
        if (track.id === newTrackId) {
          return {
            ...track,
            clips: [...track.clips, { ...clipToMove!, trackId: newTrackId, startTime: snappedTime }]
          };
        }
        return track;
      });
      
      set({ tracks: finalTracks });
    }
  },

  duplicateClip: (clipId) => {
    const { tracks } = get();
    let clipToDuplicate: TimelineClip | null = null;
    let targetTrackId = '';
    
    tracks.forEach(track => {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) {
        clipToDuplicate = clip;
        targetTrackId = track.id;
      }
    });
    
    if (clipToDuplicate) {
      const newClip: TimelineClip = {
        ...clipToDuplicate,
        id: `clip-${Date.now()}`,
        startTime: clipToDuplicate.startTime + clipToDuplicate.duration,
        selected: false
      };
      
      const updatedTracks = tracks.map(track => {
        if (track.id === targetTrackId) {
          return {
            ...track,
            clips: [...track.clips, newClip]
          };
        }
        return track;
      });
      
      set({ tracks: updatedTracks });
    }
  },

  splitClip: (clipId, splitTime) => {
    const { tracks } = get();
    
    const updatedTracks = tracks.map(track => ({
      ...track,
      clips: track.clips.flatMap(clip => {
        if (clip.id === clipId && splitTime > clip.startTime && splitTime < clip.startTime + clip.duration) {
          const firstPart: TimelineClip = {
            ...clip,
            id: `${clip.id}-1`,
            duration: splitTime - clip.startTime
          };
          
          const secondPart: TimelineClip = {
            ...clip,
            id: `${clip.id}-2`,
            startTime: splitTime,
            duration: clip.duration - (splitTime - clip.startTime)
          };
          
          return [firstPart, secondPart];
        }
        return [clip];
      })
    }));
    
    set({ tracks: updatedTracks });
  },

  selectClip: (clipId, multiSelect = false) => {
    const { selectedClips } = get();
    
    if (multiSelect) {
      const newSelection = selectedClips.includes(clipId)
        ? selectedClips.filter(id => id !== clipId)
        : [...selectedClips, clipId];
      set({ selectedClips: newSelection });
    } else {
      set({ selectedClips: [clipId] });
    }
  },

  clearSelection: () => {
    set({ selectedClips: [] });
  },

  setCurrentTime: (time) => {
    set({ currentTime: Math.max(0, Math.min(time, get().duration)) });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(zoom, 10)) });
  },

  setViewport: (start, end) => {
    set({ viewportStart: start, viewportEnd: end });
  },

  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  setPlaybackRate: (rate) => {
    set({ playbackRate: Math.max(0.25, Math.min(rate, 4)) });
  },

  toggleSnapToGrid: () => {
    set({ snapToGrid: !get().snapToGrid });
  },

  toggleMagneticSnap: () => {
    set({ magneticSnap: !get().magneticSnap });
  },

  toggleRippleEdit: () => {
    set({ rippleEdit: !get().rippleEdit });
  },

  // Enhanced cinematic editing actions implementation
  createTrackGroup: (name, trackIds) => {
    const { trackGroups } = get();
    const newGroup = {
      id: `group-${Date.now()}`,
      name,
      trackIds: trackIds.filter(id => get().tracks.some(t => t.id === id)),
      collapsed: false,
      color: '#6b7280',
      locked: false,
      visible: true,
      muted: false
    };
    set({ trackGroups: [...trackGroups, newGroup] });
  },

  removeTrackGroup: (groupId) => {
    const { trackGroups } = get();
    set({ trackGroups: trackGroups.filter(g => g.id !== groupId) });
  },

  updateTrackGroup: (groupId, updates) => {
    const { trackGroups } = get();
    set({
      trackGroups: trackGroups.map(g => 
        g.id === groupId ? { ...g, ...updates } : g
      )
    });
  },

  addMarker: (trackId, marker) => {
    if (trackId) {
      // Add to specific track
      const { tracks } = get();
      set({
        tracks: tracks.map(track => 
          track.id === trackId 
            ? { ...track, markers: [...(track.markers || []), { ...marker, id: `marker-${Date.now()}` }] }
            : track
        )
      });
    } else {
      // Add to global markers
      const { globalMarkers } = get();
      set({ globalMarkers: [...globalMarkers, { ...marker, id: `marker-${Date.now()}` }] });
    }
  },

  removeMarker: (markerId, trackId) => {
    if (trackId) {
      const { tracks } = get();
      set({
        tracks: tracks.map(track => 
          track.id === trackId 
            ? { ...track, markers: (track.markers || []).filter(m => m.id !== markerId) }
            : track
        )
      });
    } else {
      const { globalMarkers } = get();
      set({ globalMarkers: globalMarkers.filter(m => m.id !== markerId) });
    }
  },

  addAutomationCurve: (trackId, curve) => {
    const { tracks } = get();
    set({
      tracks: tracks.map(track => 
        track.id === trackId 
          ? { ...track, automation: [...(track.automation || []), { ...curve, id: `automation-${Date.now()}` }] }
          : track
      )
    });
  },

  removeAutomationCurve: (trackId, curveId) => {
    const { tracks } = get();
    set({
      tracks: tracks.map(track => 
        track.id === trackId 
          ? { ...track, automation: (track.automation || []).filter(c => c.id !== curveId) }
          : track
      )
    });
  },

  selectTracks: (trackIds) => {
    set({ selectedTracks: trackIds });
  },

  selectMarkers: (markerIds) => {
    set({ selectedMarkers: markerIds });
  },

  selectKeyframes: (keyframeIds) => {
    set({ selectedKeyframes: keyframeIds });
  },

  toggleAutomationMode: () => {
    set({ automationMode: !get().automationMode });
  },

  togglePerformanceMode: () => {
    set({ performanceMode: !get().performanceMode });
  },

  updateRenderStats: (stats) => {
    set({ renderStats: stats });
  }
}));

// Timeline component
interface TimelineProps {
  className?: string;
  onTimeChange?: (time: number) => void;
  onClipEdit?: (clipId: string, action: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  className = '',
  onTimeChange,
  onClipEdit
}) => {
  const {
    tracks,
    currentTime,
    duration,
    zoom,
    isPlaying,
    selectedClips,
    snapToGrid,
    magneticSnap,
    rippleEdit,
    playbackRate,
    viewportStart,
    viewportEnd,
    trackGroups,
    globalMarkers,
    selectedTracks,
    selectedMarkers,
    selectedKeyframes,
    automationMode,
    performanceMode,
    renderStats,
    addTrack,
    removeTrack,
    selectClip,
    clearSelection,
    setCurrentTime,
    setZoom,
    play,
    pause,
    duplicateClip,
    removeClip,
    splitClip,
    toggleSnapToGrid,
    toggleMagneticSnap,
    toggleRippleEdit,
    createTrackGroup,
    removeTrackGroup,
    updateTrackGroup,
    addMarker,
    removeMarker,
    addAutomationCurve,
    removeAutomationCurve,
    selectTracks,
    selectMarkers,
    selectKeyframes,
    toggleAutomationMode,
    togglePerformanceMode,
    updateRenderStats
  } = useTimeline();

  const [zoomX, setZoomX] = useState(1);
  const [zoomY, setZoomY] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapThreshold] = useState(0.5); // seconds
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Editing Service
  const { analyzeVideo, generateSuggestions, autoEdit } = useAIEditing();
  
  // Effect Drag and Drop
  const {
    draggedEffect,
    dropTarget,
    isDragging: isEffectDragging,
    setDropTarget,
    endEffectDrag,
    getDropFeedback
  } = useEffectDragDrop();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);

  // Convert time to pixels with viewport consideration
  const timeToPixels = useCallback((time: number) => {
    const viewportDuration = viewportEnd - viewportStart;
    const relativeTime = time - viewportStart;
    return (relativeTime / viewportDuration) * 1200 * zoomX;
  }, [viewportStart, viewportEnd, zoomX]);

  // Convert pixels to time with viewport consideration
  const pixelsToTime = useCallback((pixels: number) => {
    const viewportDuration = viewportEnd - viewportStart;
    const relativeTime = (pixels / (1200 * zoomX)) * viewportDuration;
    return relativeTime + viewportStart;
  }, [viewportStart, viewportEnd, zoomX]);
  
  // Snap function for playhead and clips
  const snapToNearestPoint = useCallback((time: number) => {
    if (!snapEnabled) return time;
    
    const snapPoints: number[] = [0]; // Always snap to start
    
    // Add clip start and end points
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        snapPoints.push(clip.startTime);
        snapPoints.push(clip.startTime + clip.duration);
      });
    });
    
    // Add second markers
    const maxTime = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 30);
    for (let i = 0; i <= maxTime; i++) {
      snapPoints.push(i);
    }
    
    // Find closest snap point
    let closestPoint = time;
    let minDistance = snapThreshold;
    
    snapPoints.forEach(point => {
      const distance = Math.abs(time - point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    return closestPoint;
  }, [snapEnabled, snapThreshold, tracks]);

  // AI Functions
  const analyzeTimelineWithAI = useCallback(async () => {
    const clips = tracks.flatMap(t => t.clips);
    if (clips.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const suggestions = await generateSuggestions(clips, {
        autoColorCorrection: true,
        smartCutDetection: true,
        sceneTransitions: true,
        autoAudioLeveling: true
      });
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [tracks, generateSuggestions]);
  
  const applyAIAutoEdit = useCallback(async () => {
    const clips = tracks.flatMap(t => t.clips);
    if (clips.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const editedClips = await autoEdit(clips, {
        autoColorCorrection: true,
        smartCutDetection: true,
        sceneTransitions: true
      });
      // Update clips with AI edits
      editedClips.forEach(clip => {
        updateClip(clip.id, clip);
      });
    } catch (error) {
      console.error('AI auto-edit failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [tracks, autoEdit, updateClip]);
  
  const generateSmartCuts = useCallback(async () => {
    const clips = tracks.flatMap(t => t.clips);
    if (selectedClips.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      for (const clipId of selectedClips) {
        const clip = clips.find(c => c.id === clipId);
        if (clip) {
          const suggestions = await generateSuggestions([clip], {
            smartCutDetection: true
          });
          
          // Apply smart cuts
          suggestions.forEach(suggestion => {
            if (suggestion.type === 'cut') {
              splitClip(clipId, suggestion.data.cutPoint);
            }
          });
        }
      }
    } catch (error) {
      console.error('Smart cuts failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedClips, tracks, generateSuggestions, splitClip]);
  
  const enhanceColors = useCallback(async () => {
    const clips = tracks.flatMap(t => t.clips);
    if (selectedClips.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      for (const clipId of selectedClips) {
        const clip = clips.find(c => c.id === clipId);
        if (clip) {
          const suggestions = await generateSuggestions([clip], {
            autoColorCorrection: true
          });
          
          // Apply color enhancements
          suggestions.forEach(suggestion => {
            if (suggestion.type === 'color') {
              updateClip(clipId, {
                ...clip,
                effects: [...(clip.effects || []), {
                  id: `color_${Date.now()}`,
                  type: 'color-correction',
                  ...suggestion.data
                }]
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Color enhancement failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedClips, tracks, generateSuggestions, updateClip]);

  // Handle timeline click for seeking
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (timelineRef.current && !isDragging && !isResizing) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = pixelsToTime(x);
      setCurrentTime(time);
      onTimeChange?.(time);
    }
  }, [pixelsToTime, setCurrentTime, onTimeChange, isDragging, isResizing]);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(zoom * zoomFactor);
    }
  }, [zoom, setZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? pause() : play();
          break;
        case 'Delete':
        case 'Backspace':
          selectedClips.forEach(clipId => {
            removeClip(clipId);
            onClipEdit?.(clipId, 'delete');
          });
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            selectedClips.forEach(clipId => {
              duplicateClip(clipId);
              onClipEdit?.(clipId, 'duplicate');
            });
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectedClips.forEach(clipId => {
              splitClip(clipId, currentTime);
              onClipEdit?.(clipId, 'split');
            });
          }
          break;
        case 'Escape':
          clearSelection();
          break;
        case 'g':
          toggleSnapToGrid();
          break;
        case 'm':
          toggleMagneticSnap();
          break;
        case 'r':
          toggleRippleEdit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isPlaying, play, pause, selectedClips, removeClip, duplicateClip, splitClip, currentTime, clearSelection, toggleSnapToGrid, toggleMagneticSnap, toggleRippleEdit, onClipEdit, handleWheel]);

  // Format time display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30); // Assuming 30fps
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={`timeline bg-gray-900 text-white border-t border-gray-700 ${className}`}>
      {/* Timeline Header */}
      <div className="timeline-header bg-gray-800 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={isPlaying ? pause : play}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <SkipBack size={16} />
              </button>
              
              <button
                onClick={() => setCurrentTime(Math.min(duration, currentTime + 1))}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <SkipForward size={16} />
              </button>
            </div>
            
            {/* Time Display */}
            <div className="text-sm font-mono bg-gray-700 px-3 py-1 rounded border border-gray-600">
              <span className="text-blue-400">{formatTime(currentTime)}</span>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-gray-300">
                {formatTime(Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 0))}
              </span>
            </div>
            
            {/* Time Input */}
            <input
              type="text"
              value={formatTime(currentTime)}
              onChange={(e) => {
                const timeStr = e.target.value;
                const parts = timeStr.split(':');
                if (parts.length === 2) {
                  const minutes = parseInt(parts[0]) || 0;
                  const seconds = parseFloat(parts[1]) || 0;
                  const totalSeconds = minutes * 60 + seconds;
                  if (!isNaN(totalSeconds) && totalSeconds >= 0) {
                    setCurrentTime(totalSeconds);
                  }
                }
              }}
              className="w-20 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-center font-mono"
              placeholder="00:00"
            />
            
            {/* Playback Rate */}
            <select
              value={playbackRate}
              onChange={(e) => useTimeline.getState().setPlaybackRate(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timeline Tools */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSnapToGrid}
                className={`p-2 rounded transition-colors ${
                  snapToGrid ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Snap to Grid (G)"
              >
                <Grid size={16} />
              </button>
              
              <button
                onClick={toggleMagneticSnap}
                className={`p-2 rounded transition-colors ${
                  magneticSnap ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Magnetic Snap (M)"
              >
                <Move size={16} />
              </button>
              
              <button
                onClick={toggleRippleEdit}
                className={`p-2 rounded transition-colors ${
                  rippleEdit ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Ripple Edit (R)"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomX(Math.max(0.1, zoomX - 0.1))}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  title="Zoom Out Horizontal"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-xs text-gray-400 min-w-[40px] text-center">
                  H:{Math.round(zoomX * 100)}%
                </span>
                <button
                  onClick={() => setZoomX(Math.min(10, zoomX + 0.1))}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  title="Zoom In Horizontal"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
              
              <div className="w-px h-6 bg-gray-600" />
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomY(Math.max(0.5, zoomY - 0.1))}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  title="Zoom Out Vertical"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-xs text-gray-400 min-w-[40px] text-center">
                  V:{Math.round(zoomY * 100)}%
                </span>
                <button
                  onClick={() => setZoomY(Math.min(3, zoomY + 0.1))}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  title="Zoom In Vertical"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
              
              <div className="w-px h-6 bg-gray-600" />
              
              <button
               onClick={() => {
                 setZoomX(1);
                 setZoomY(1);
                 setScrollLeft(0);
               }}
               className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-xs"
               title="Reset Zoom"
             >
               100%
             </button>
             
             <div className="w-px h-6 bg-gray-600" />
             
             <button
               onClick={() => setSnapEnabled(!snapEnabled)}
               className={`p-1 rounded transition-colors text-xs ${
                 snapEnabled 
                   ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                   : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
               }`}
               title={snapEnabled ? 'Disable Snap' : 'Enable Snap'}
             >
               SNAP
             </button>
             
             <div className="w-px h-6 bg-gray-600" />
             
             {/* AI Tools */}
             <div className="flex items-center space-x-1">
               <button
                 onClick={analyzeTimelineWithAI}
                 disabled={isAnalyzing}
                 className={`p-2 rounded transition-colors ${
                   isAnalyzing 
                     ? 'bg-purple-600 text-white' 
                     : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                 }`}
                 title="Analyze with AI"
               >
                 {isAnalyzing ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <Brain className="w-4 h-4" />
                 )}
               </button>
               
               <button
                 onClick={applyAIAutoEdit}
                 disabled={isAnalyzing}
                 className="p-2 rounded bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
                 title="AI Auto-Edit"
               >
                 <Wand2 className="w-4 h-4" />
               </button>
               
               <button
                 onClick={generateSmartCuts}
                 disabled={isAnalyzing || selectedClips.length === 0}
                 className="p-2 rounded bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                 title="Smart Cuts (Select clips first)"
               >
                 <Scissors className="w-4 h-4" />
               </button>
               
               <button
                 onClick={enhanceColors}
                 disabled={isAnalyzing || selectedClips.length === 0}
                 className="p-2 rounded bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                 title="Enhance Colors (Select clips first)"
               >
                 <Palette className="w-4 h-4" />
               </button>
             </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Go to Start"
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Previous Second"
              >
                <ChevronRight size={16} style={{transform: 'rotate(180deg)'}} />
              </button>
              <button
                onClick={() => setCurrentTime(currentTime + 1)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Next Second"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => {
                  const maxTime = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)));
                  setCurrentTime(maxTime);
                }}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Go to End"
              >
                <SkipForward size={16} />
              </button>
            </div>
            
            {/* Add Track Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => addTrack('video')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Video</span>
              </button>
              
              <button
                onClick={() => addTrack('audio')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Audio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="timeline-content flex h-96">
        {/* Track Headers */}
        <div className="track-headers w-56 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {tracks.map((track) => (
            <TrackHeader 
              key={track.id} 
              track={track} 
              onRemove={() => removeTrack(track.id)}
              onToggleMute={() => useTimeline.getState().toggleTrackMute(track.id)}
              onToggleSolo={() => useTimeline.getState().toggleTrackSolo(track.id)}
            />
          ))}
        </div>

        {/* Timeline Tracks */}
        <div className="timeline-tracks flex-1 relative overflow-auto" ref={timelineRef}>
          {/* Time Ruler */}
          <TimeRuler 
            duration={duration} 
            zoom={zoom} 
            currentTime={currentTime} 
            viewportStart={viewportStart}
            viewportEnd={viewportEnd}
            onClick={handleTimelineClick}
            formatTime={formatTime}
          />
          
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 cursor-ew-resize group shadow-lg"
            style={{ left: `${timeToPixels(currentTime)}px` }}
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startTime = currentTime;
              
              const handleMouseMove = (e: MouseEvent) => {
                 const deltaX = e.clientX - startX;
                 const deltaTime = pixelsToTime(deltaX) - pixelsToTime(0);
                 const rawTime = Math.max(0, startTime + deltaTime);
                 const snappedTime = snapToNearestPoint(rawTime);
                 setCurrentTime(snappedTime);
               };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
          </div>
          
          {/* Grid Lines */}
          {snapToGrid && (
            <GridLines 
              duration={duration}
              zoom={zoomX}
              gridSize={1}
              viewportStart={viewportStart}
              viewportEnd={viewportEnd}
              timeToPixels={timeToPixels}
            />
          )}
          
          {/* Snap Points Indicators */}
          {snapEnabled && tracks.flatMap(track => 
            track.clips.flatMap(clip => [
              // Clip start indicator
              <div
                key={`snap-start-${clip.id}`}
                className="absolute top-0 bottom-0 w-px bg-yellow-400/30 pointer-events-none z-10"
                style={{ left: timeToPixels(clip.startTime) }}
              />,
              // Clip end indicator
              <div
                key={`snap-end-${clip.id}`}
                className="absolute top-0 bottom-0 w-px bg-yellow-400/30 pointer-events-none z-10"
                style={{ left: timeToPixels(clip.startTime + clip.duration) }}
              />
            ])
          )}
          
          {/* AI Suggestions Indicators */}
          {aiSuggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className={`absolute top-0 w-1 h-full pointer-events-none z-20 ${
                suggestion.type === 'cut' ? 'bg-blue-400' :
                suggestion.type === 'color' ? 'bg-green-400' :
                suggestion.type === 'transition' ? 'bg-yellow-400' :
                'bg-purple-400'
              } opacity-80`}
              style={{
                left: `${timeToPixels(suggestion.timestamp)}px`,
                transform: 'translateX(-2px)'
              }}
              title={suggestion.description}
            />
          ))}
          
          {/* Tracks */}
          <div className="tracks-container">
            {tracks.map((track) => (
              <TrackLane
                key={track.id}
                track={track}
                zoom={zoom}
                duration={duration}
                currentTime={currentTime}
                selectedClips={selectedClips}
                onClipSelect={selectClip}
                timeToPixels={timeToPixels}
                pixelsToTime={pixelsToTime}
                onClipEdit={onClipEdit}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Track Header Component
interface TrackHeaderProps {
  track: TimelineTrack;
  onRemove: () => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}

const TrackHeader: React.FC<TrackHeaderProps> = ({ 
  track, 
  onRemove, 
  onToggleMute, 
  onToggleSolo 
}) => {
  const { 
    toggleTrackMute, 
    toggleTrackSolo, 
    toggleTrackLock,
    setTrackVolume,
    setTrackPan,
    updateTrack
  } = useTimeline();
  
  const [showControls, setShowControls] = React.useState(false);
  
  return (
    <div 
      className="track-header p-3 border-b border-gray-700 flex flex-col space-y-2"
      style={{ 
        height: `${track.height + 20}px`, 
        backgroundColor: `${track.color}15`,
        borderLeft: `3px solid ${track.color}`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{track.name}</div>
          <div className="text-xs text-gray-400 uppercase">{track.type}</div>
        </div>
        
        <button
          onClick={onRemove}
          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
          title="Remove track"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => updateTrack(track.id, { visible: !track.visible })}
            className={`p-1 rounded transition-colors ${
              track.visible ? 'text-white hover:bg-gray-700' : 'text-gray-500 bg-gray-700'
            }`}
            title="Toggle visibility"
          >
            {track.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          
          <button
            onClick={() => toggleTrackLock(track.id)}
            className={`p-1 rounded transition-colors ${
              track.locked ? 'text-yellow-500 bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="Toggle lock"
          >
            {track.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          
          {track.type === 'audio' && (
            <>
              <button
                onClick={() => toggleTrackMute(track.id)}
                className={`p-1 rounded transition-colors ${
                  track.muted ? 'text-red-500 bg-red-900/20' : 'text-white hover:bg-gray-700'
                }`}
                title="Toggle mute"
              >
                {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              
              <button
                onClick={() => toggleTrackSolo(track.id)}
                className={`p-1 rounded transition-colors text-xs font-bold ${
                  track.solo ? 'text-yellow-400 bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-700'
                }`}
                title="Solo track"
              >
                S
              </button>
            </>
          )}
        </div>
        
        {track.type === 'audio' && (
          <div className="flex items-center space-x-1">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={track.volume || 1}
              onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
              className="w-12 h-1"
              title="Track volume"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Time Ruler Component
interface TimeRulerProps {
  duration: number;
  zoom: number;
  currentTime: number;
  viewportStart: number;
  viewportEnd: number;
  onClick: (e: React.MouseEvent) => void;
  formatTime: (time: number) => string;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ 
  duration, 
  zoom, 
  currentTime, 
  viewportStart, 
  viewportEnd, 
  onClick, 
  formatTime 
}) => {
  const viewportDuration = viewportEnd - viewportStart;
  const width = 1200 * zoom;
  const tickInterval = Math.max(1, Math.floor(10 / zoom));
  
  const ticks = [];
  for (let i = Math.floor(viewportStart); i <= Math.ceil(viewportEnd); i += tickInterval) {
    if (i >= viewportStart && i <= viewportEnd) {
      const x = ((i - viewportStart) / viewportDuration) * width;
      const isMainTick = i % (tickInterval * 5) === 0;
      
      ticks.push(
        <div 
          key={i} 
          className={`absolute top-0 bottom-0 ${
            isMainTick ? 'border-l-2 border-gray-400' : 'border-l border-gray-600'
          }`} 
          style={{ left: `${x}px` }}
        >
          {isMainTick && (
            <div className="absolute top-1 left-1 text-xs text-gray-300 font-mono">
              {formatTime(i)}
            </div>
          )}
        </div>
      );
    }
  }
  
  return (
    <div 
      className="time-ruler h-10 bg-gray-800 border-b border-gray-700 relative cursor-pointer select-none"
      style={{ width: `${width}px` }}
      onClick={onClick}
    >
      {ticks}
    </div>
  );
};

// Grid Lines Component
interface GridLinesProps {
  duration: number;
  zoom: number;
  gridSize: number;
  viewportStart: number;
  viewportEnd: number;
  timeToPixels: (time: number) => number;
}

const GridLines: React.FC<GridLinesProps> = ({ 
  duration, 
  zoom, 
  gridSize, 
  viewportStart, 
  viewportEnd, 
  timeToPixels 
}) => {
  const lines = [];
  
  for (let i = Math.floor(viewportStart / gridSize) * gridSize; i <= viewportEnd; i += gridSize) {
    if (i >= viewportStart && i <= viewportEnd) {
      const x = timeToPixels(i);
      lines.push(
        <div
          key={i}
          className="absolute top-10 bottom-0 border-l border-gray-700/50 pointer-events-none"
          style={{ left: `${x}px` }}
        />
      );
    }
  }
  
  return <>{lines}</>;
};

// Track Lane Component
interface TrackLaneProps {
  track: TimelineTrack;
  zoom: number;
  duration: number;
  currentTime: number;
  selectedClips: string[];
  onClipSelect: (clipId: string, multiSelect?: boolean) => void;
  timeToPixels: (time: number) => number;
  pixelsToTime: (pixels: number) => number;
  onClipEdit?: (clipId: string, action: string) => void;
}

const TrackLane: React.FC<TrackLaneProps> = ({
  track,
  zoom,
  duration,
  currentTime,
  selectedClips,
  onClipSelect,
  timeToPixels,
  pixelsToTime,
  onClipEdit
}) => {
  const width = 1200 * zoom;
  
  return (
    <div 
      className="track-lane relative border-b border-gray-700 hover:bg-gray-800/30 transition-colors"
      style={{ 
        height: `${track.height * zoomY}px`, 
        width: `${width}px`,
        backgroundColor: track.visible ? 'transparent' : '#1f293750'
      }}
      data-track-id={track.id}
    >
      {track.clips.map((clip) => (
        <ClipComponent
          key={clip.id}
          clip={clip}
          isSelected={selectedClips.includes(clip.id)}
          onSelect={onClipSelect}
          timeToPixels={timeToPixels}
          trackHeight={track.height}
          onEdit={onClipEdit}
        />
      ))}
    </div>
  );
};

// Enhanced Clip Component
interface ClipComponentProps {
  clip: TimelineClip;
  isSelected: boolean;
  onSelect: (clipId: string, multiSelect?: boolean) => void;
  timeToPixels: (time: number) => number;
  trackHeight: number;
  onEdit?: (clipId: string, action: string) => void;
}

const ClipComponent: React.FC<ClipComponentProps> = ({
  clip,
  isSelected,
  onSelect,
  timeToPixels,
  trackHeight,
  onEdit
}) => {
  const left = timeToPixels(clip.startTime);
  const width = timeToPixels(clip.duration);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  
  const { moveClip, resizeClip, pixelsToTime, updateClip } = useTimeline();
  const { setDropTarget, getDropFeedback } = useEffectDragDrop();
  const [isDropTarget, setIsDropTarget] = useState(false);
  
  const getClipColor = () => {
    if (clip.color) return clip.color;
    
    switch (clip.type) {
      case 'video': return '#3b82f6';
      case 'audio': return '#10b981';
      case 'image': return '#8b5cf6';
      case 'text': return '#f59e0b';
      default: return '#6b7280';
    }
  };
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (clip.locked) return;
    
    e.stopPropagation();
    onSelect(clip.id, e.ctrlKey || e.metaKey);
    
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      time: clip.startTime 
    });
  };
  
  const handleDoubleClick = () => {
    onEdit?.(clip.id, 'edit');
  };
  
  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    if (clip.locked) return;
    
    e.stopPropagation();
    setIsResizing(side);
    setDragStart({ 
      x: e.clientX, 
      time: side === 'left' ? clip.startTime : clip.startTime + clip.duration 
    });
  };
  
  // Drop zone handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (clip.locked) return;
    
    setDropTarget({
      type: 'clip',
      id: clip.id,
      element: e.currentTarget as HTMLElement
    });
    setIsDropTarget(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Check if mouse is still within the element bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTarget(null);
      setIsDropTarget(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (clip.locked) return;
    
    const dropTarget = {
      type: 'clip' as const,
      id: clip.id,
      element: e.currentTarget as HTMLElement
    };
    
    const feedback = getDropFeedback(dropTarget);
    if (feedback?.canDrop && draggedEffect) {
      // Apply effect to clip
      const newEffects = [...(clip.effects || []), draggedEffect.id];
      updateClip(clip.id, { effects: newEffects });
    }
    
    setDropTarget(null);
    setIsDropTarget(false);
  };
  
  // Global mouse events
   useEffect(() => {
     const handleMouseMove = (e: MouseEvent) => {
       if (!isDragging && !isResizing) return;
       
       const deltaX = e.clientX - dragStart.x;
       const deltaTime = pixelsToTime(Math.abs(deltaX)) * (deltaX < 0 ? -1 : 1);
       
       if (isDragging) {
         const newStartTime = Math.max(0, dragStart.time + deltaTime);
         
         // Check if dragging to a different track
         const timelineElement = document.querySelector('.timeline-tracks');
         if (timelineElement) {
           const rect = timelineElement.getBoundingClientRect();
           const relativeY = e.clientY - rect.top;
           const trackElements = timelineElement.querySelectorAll('.track-lane');
           
           let targetTrackId = clip.trackId;
           let currentY = 0;
           
           trackElements.forEach((trackEl, index) => {
             const trackHeight = trackEl.getBoundingClientRect().height;
             if (relativeY >= currentY && relativeY < currentY + trackHeight) {
               const trackId = trackEl.getAttribute('data-track-id');
               if (trackId) targetTrackId = trackId;
             }
             currentY += trackHeight;
           });
           
           moveClip(clip.id, newStartTime, targetTrackId);
         } else {
           moveClip(clip.id, newStartTime, clip.trackId);
         }
       } else if (isResizing) {
         if (isResizing === 'left') {
           const newStartTime = Math.max(0, dragStart.time + deltaTime);
           const newDuration = clip.duration - deltaTime;
           if (newDuration > 0.1) {
             resizeClip(clip.id, newStartTime, newDuration);
           }
         } else {
           const newDuration = Math.max(0.1, dragStart.time + deltaTime - clip.startTime);
           resizeClip(clip.id, clip.startTime, newDuration);
         }
       }
     };
     
     const handleMouseUp = () => {
       setIsDragging(false);
       setIsResizing(null);
     };
     
     if (isDragging || isResizing) {
       document.addEventListener('mousemove', handleMouseMove);
       document.addEventListener('mouseup', handleMouseUp);
       
       return () => {
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
       };
     }
   }, [isDragging, isResizing, dragStart, clip, moveClip, resizeClip, pixelsToTime]);
  
  return (
    <div
      className={`absolute top-1 rounded-md cursor-pointer border-2 transition-all duration-150 ${
        isSelected 
          ? 'border-white shadow-lg shadow-blue-500/25 z-20' 
          : 'border-transparent hover:border-gray-400'
      } ${
        clip.locked ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'
      } ${
        isDragging ? 'z-30 shadow-xl' : ''
      } ${
        isDropTarget ? 'ring-2 ring-purple-400 ring-opacity-75 shadow-lg shadow-purple-500/25' : ''
      }`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 30)}px`,
        height: `${trackHeight - 8}px`,
        backgroundColor: getClipColor(),
        opacity: clip.opacity || 1
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      title={`${clip.name} (${clip.type})`}
    >
      {/* Clip Content */}
      <div className="relative w-full h-full overflow-hidden rounded-md">
        {/* Thumbnail Background */}
        {clip.thumbnail && (
          <img 
            src={clip.thumbnail} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            draggable={false}
          />
        )}
        
        {/* Waveform for audio clips */}
        {clip.type === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-8 bg-gradient-to-r from-green-400/30 to-green-600/30 rounded" />
          </div>
        )}
        
        {/* Clip Label */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between">
          <div className="text-xs text-white font-medium truncate">
            {clip.name}
          </div>
          
          {/* Speed indicator */}
          {clip.speed && clip.speed !== 1 && (
            <div className="text-xs text-yellow-300 font-bold">
              {clip.speed}x
            </div>
          )}
        </div>
        
        {/* Effects indicator */}
        {clip.effects && clip.effects.length > 0 && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full" />
        )}
        
        {/* Transitions */}
        {clip.transitions?.in && (
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/30 to-transparent" />
        )}
        {clip.transitions?.out && (
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white/30 to-transparent" />
        )}
      </div>
      
      {/* Resize handles */}
      {isSelected && !clip.locked && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 w-2 bg-white/80 cursor-ew-resize hover:bg-white transition-colors z-10"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
            title="Resize clip start"
          />
          <div 
            className="absolute right-0 top-0 bottom-0 w-2 bg-white/80 cursor-ew-resize hover:bg-white transition-colors z-10"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            title="Resize clip end"
          />
        </>
      )}
    </div>
  );
};

export default Timeline;