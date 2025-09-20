import { useState, useEffect, useCallback, useRef } from 'react';
import { AdvancedVFXEngine, VFXComposition, VFXLayer, VFXEffect } from '../services/AdvancedVFXEngine';

interface ViewportState {
  id: string;
  name: string;
  type: 'main' | 'preview' | 'wireframe' | 'material';
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  };
  enabled: boolean;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
  playbackRate: number;
}

interface SelectionState {
  selectedLayers: string[];
  selectedEffects: string[];
  selectedKeyframes: string[];
}

interface UndoRedoState {
  history: VFXComposition[];
  currentIndex: number;
  maxHistorySize: number;
}

export interface VFXStudioState {
  engine: AdvancedVFXEngine | null;
  composition: VFXComposition | null;
  playback: PlaybackState;
  viewports: ViewportState[];
  selection: SelectionState;
  undoRedo: UndoRedoState;
  isInitialized: boolean;
}

export const useVFXStudio = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [state, setState] = useState<VFXStudioState>({
    engine: null,
    composition: null,
    playback: {
      isPlaying: false,
      currentTime: 0,
      duration: 10,
      loop: false,
      playbackRate: 1
    },
    viewports: [
      {
        id: 'main',
        name: 'Main View',
        type: 'main',
        camera: { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 }, fov: 75 },
        enabled: true
      },
      {
        id: 'preview',
        name: 'Preview',
        type: 'preview',
        camera: { position: { x: 5, y: 5, z: 5 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
        enabled: true
      },
      {
        id: 'wireframe',
        name: 'Wireframe',
        type: 'wireframe',
        camera: { position: { x: -5, y: 0, z: 5 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
        enabled: true
      },
      {
        id: 'material',
        name: 'Material View',
        type: 'material',
        camera: { position: { x: 0, y: -5, z: 5 }, target: { x: 0, y: 0, z: 0 }, fov: 60 },
        enabled: true
      }
    ],
    selection: {
      selectedLayers: [],
      selectedEffects: [],
      selectedKeyframes: []
    },
    undoRedo: {
      history: [],
      currentIndex: -1,
      maxHistorySize: 50
    },
    isInitialized: false
  });

  const animationFrameRef = useRef<number>();

  // Initialize VFX Engine
  const initializeEngine = useCallback(async () => {
    if (!canvasRef.current || state.isInitialized) return;

    try {
      const engine = new AdvancedVFXEngine(canvasRef.current);
      
      // Create default composition
      const defaultComposition: VFXComposition = {
        id: 'default-composition',
        name: 'New Composition',
        width: 1920,
        height: 1080,
        frameRate: 30,
        duration: 10,
        backgroundColor: '#000000',
        layers: [],
        effects: [],
        settings: {
          quality: 'high',
          antialiasing: true,
          shadows: true,
          postProcessing: true
        }
      };

      setState(prev => ({
        ...prev,
        engine,
        composition: defaultComposition,
        isInitialized: true
      }));

      // Load composition into engine
      engine.loadComposition(defaultComposition);

    } catch (error) {
      console.error('Failed to initialize VFX Engine:', error);
    }
  }, [canvasRef, state.isInitialized]);

  // Playback controls
  const play = useCallback(() => {
    if (state.engine) {
      state.engine.play();
      setState(prev => ({
        ...prev,
        playback: { ...prev.playback, isPlaying: true }
      }));
    }
  }, [state.engine]);

  const pause = useCallback(() => {
    if (state.engine) {
      state.engine.pause();
      setState(prev => ({
        ...prev,
        playback: { ...prev.playback, isPlaying: false }
      }));
    }
  }, [state.engine]);

  const stop = useCallback(() => {
    if (state.engine) {
      state.engine.stop();
      setState(prev => ({
        ...prev,
        playback: { 
          ...prev.playback, 
          isPlaying: false, 
          currentTime: 0 
        }
      }));
    }
  }, [state.engine]);

  const seekTo = useCallback((time: number) => {
    if (state.engine) {
      const clampedTime = Math.max(0, Math.min(time, state.playback.duration));
      state.engine.seekTo(clampedTime);
      setState(prev => ({
        ...prev,
        playback: { ...prev.playback, currentTime: clampedTime }
      }));
    }
  }, [state.engine, state.playback.duration]);

  const setPlaybackRate = useCallback((rate: number) => {
    setState(prev => ({
      ...prev,
      playback: { ...prev.playback, playbackRate: rate }
    }));
  }, []);

  // Layer management
  const addLayer = useCallback((layer: Omit<VFXLayer, 'id'>) => {
    if (!state.composition) return;

    const newLayer: VFXLayer = {
      ...layer,
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedComposition = {
      ...state.composition,
      layers: [...state.composition.layers, newLayer]
    };

    setState(prev => ({
      ...prev,
      composition: updatedComposition
    }));

    if (state.engine) {
      state.engine.loadComposition(updatedComposition);
    }

    // Add to history
    addToHistory(updatedComposition);
  }, [state.composition, state.engine]);

  const updateLayer = useCallback((layerId: string, updates: Partial<VFXLayer>) => {
    if (!state.composition) return;

    const updatedComposition = {
      ...state.composition,
      layers: state.composition.layers.map(layer => 
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    };

    setState(prev => ({
      ...prev,
      composition: updatedComposition
    }));

    if (state.engine) {
      const updatedLayer = updatedComposition.layers.find(l => l.id === layerId);
      if (updatedLayer) {
        state.engine.updateLayer(updatedLayer);
      }
    }

    addToHistory(updatedComposition);
  }, [state.composition, state.engine]);

  const deleteLayer = useCallback((layerId: string) => {
    if (!state.composition) return;

    const updatedComposition = {
      ...state.composition,
      layers: state.composition.layers.filter(layer => layer.id !== layerId)
    };

    setState(prev => ({
      ...prev,
      composition: updatedComposition,
      selection: {
        ...prev.selection,
        selectedLayers: prev.selection.selectedLayers.filter(id => id !== layerId)
      }
    }));

    if (state.engine) {
      state.engine.loadComposition(updatedComposition);
    }

    addToHistory(updatedComposition);
  }, [state.composition, state.engine]);

  // Selection management
  const selectLayer = useCallback((layerId: string, addToSelection = false) => {
    setState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedLayers: addToSelection 
          ? [...prev.selection.selectedLayers, layerId]
          : [layerId]
      }
    }));
  }, []);

  const deselectLayer = useCallback((layerId: string) => {
    setState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedLayers: prev.selection.selectedLayers.filter(id => id !== layerId)
      }
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: {
        selectedLayers: [],
        selectedEffects: [],
        selectedKeyframes: []
      }
    }));
  }, []);

  // Viewport management
  const toggleViewport = useCallback((viewportId: string) => {
    setState(prev => ({
      ...prev,
      viewports: prev.viewports.map(vp => 
        vp.id === viewportId ? { ...vp, enabled: !vp.enabled } : vp
      )
    }));
  }, []);

  const updateViewportCamera = useCallback((viewportId: string, camera: ViewportState['camera']) => {
    setState(prev => ({
      ...prev,
      viewports: prev.viewports.map(vp => 
        vp.id === viewportId ? { ...vp, camera } : vp
      )
    }));
  }, []);

  // Undo/Redo functionality
  const addToHistory = useCallback((composition: VFXComposition) => {
    setState(prev => {
      const newHistory = prev.undoRedo.history.slice(0, prev.undoRedo.currentIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(composition)));
      
      // Limit history size
      if (newHistory.length > prev.undoRedo.maxHistorySize) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        undoRedo: {
          ...prev.undoRedo,
          history: newHistory,
          currentIndex: newHistory.length - 1
        }
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (state.undoRedo.currentIndex > 0) {
      const newIndex = state.undoRedo.currentIndex - 1;
      const composition = state.undoRedo.history[newIndex];
      
      setState(prev => ({
        ...prev,
        composition,
        undoRedo: { ...prev.undoRedo, currentIndex: newIndex }
      }));
      
      if (state.engine) {
        state.engine.loadComposition(composition);
      }
    }
  }, [state.undoRedo, state.engine]);

  const redo = useCallback(() => {
    if (state.undoRedo.currentIndex < state.undoRedo.history.length - 1) {
      const newIndex = state.undoRedo.currentIndex + 1;
      const composition = state.undoRedo.history[newIndex];
      
      setState(prev => ({
        ...prev,
        composition,
        undoRedo: { ...prev.undoRedo, currentIndex: newIndex }
      }));
      
      if (state.engine) {
        state.engine.loadComposition(composition);
      }
    }
  }, [state.undoRedo, state.engine]);

  // Animation loop for real-time updates
  const updateLoop = useCallback(() => {
    if (state.playback.isPlaying && state.engine) {
      const deltaTime = 1 / 60; // Assume 60 FPS
      const newTime = state.playback.currentTime + (deltaTime * state.playback.playbackRate);
      
      if (newTime >= state.playback.duration) {
        if (state.playback.loop) {
          seekTo(0);
        } else {
          stop();
        }
      } else {
        setState(prev => ({
          ...prev,
          playback: { ...prev.playback, currentTime: newTime }
        }));
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(updateLoop);
  }, [state.playback, state.engine, seekTo, stop]);

  // Initialize engine on mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  // Start animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.engine) {
        state.engine.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.engine]);

  return {
    // State
    ...state,
    
    // Playback controls
    play,
    pause,
    stop,
    seekTo,
    setPlaybackRate,
    
    // Layer management
    addLayer,
    updateLayer,
    deleteLayer,
    
    // Selection
    selectLayer,
    deselectLayer,
    clearSelection,
    
    // Viewports
    toggleViewport,
    updateViewportCamera,
    
    // Undo/Redo
    undo,
    redo,
    canUndo: state.undoRedo.currentIndex > 0,
    canRedo: state.undoRedo.currentIndex < state.undoRedo.history.length - 1,
    
    // Utilities
    initializeEngine
  };
};

export default useVFXStudio;