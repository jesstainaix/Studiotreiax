import { useState, useEffect, useCallback, useRef } from 'react';
import { SceneLayer, LayerUpdateAction, UndoRedoState, SceneLayersData } from '../types/SceneLayers';
import { toast } from 'sonner';

interface UseSceneLayersManagerReturn {
  layers: SceneLayer[];
  isLoading: boolean;
  error: string | null;
  
  // Layer management
  addLayer: (layer: Omit<SceneLayer, 'id'>) => Promise<void>;
  updateLayer: (layerId: string, updates: Partial<SceneLayer>) => Promise<void>;
  deleteLayer: (layerId: string) => Promise<void>;
  reorderLayers: (layerIds: string[]) => Promise<void>;
  duplicateLayer: (layerId: string) => Promise<void>;
  
  // Data management
  loadLayers: () => Promise<void>;
  saveLayers: () => Promise<void>;
  
  // Undo/Redo
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  
  // Autosave
  enableAutosave: (interval?: number) => void;
  disableAutosave: () => void;
  isAutosaveEnabled: boolean;
}

const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const MAX_HISTORY_SIZE = 50;

export const useSceneLayersManager = (sceneId: string): UseSceneLayersManagerReturn => {
  const [layers, setLayers] = useState<SceneLayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Undo/Redo state
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    past: [],
    present: null,
    future: []
  });
  
  // Autosave
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState(false);
  const autosaveIntervalRef = useRef<number | null>(null);
  const lastSaveTimeRef = useRef<number>(Date.now());
  
  // Debounce save operations
  const saveTimeoutRef = useRef<number | null>(null);

  // Generate unique ID for layers
  const generateLayerId = (): string => {
    return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add action to history for undo/redo
  const addToHistory = useCallback((action: LayerUpdateAction) => {
    setUndoRedoState(prev => {
      const newPast = [...prev.past, action];
      
      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }
      
      return {
        past: newPast,
        present: action,
        future: [] // Clear future when new action is performed
      };
    });
  }, []);

  // Load layers from storage
  const loadLayers = useCallback(async () => {
    if (!sceneId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from localStorage first (fast)
      const localData = localStorage.getItem(`scene_layers_${sceneId}`);
      if (localData) {
        const parsedLayers = JSON.parse(localData) as SceneLayer[];
        setLayers(parsedLayers);
      }
      
      // Then try to load from file system
      const response = await fetch('/project/data/scene_layers.json');
      if (response.ok) {
        const sceneLayersData: SceneLayersData = await response.json();
        const sceneData = sceneLayersData.scenes.find(s => s.scene_id === sceneId);
        
        if (sceneData) {
          // Add IDs to layers if missing
          const layersWithIds = sceneData.layers.map(layer => ({
            ...layer,
            id: layer.id || generateLayerId(),
            createdAt: layer.createdAt || new Date().toISOString(),
            updatedAt: layer.updatedAt || new Date().toISOString()
          }));
          
          setLayers(layersWithIds);
          
          // Update localStorage
          localStorage.setItem(`scene_layers_${sceneId}`, JSON.stringify(layersWithIds));
        }
      }
    } catch (err) {
      console.error('Error loading layers:', err);
      setError('Falha ao carregar elementos da cena');
      toast.error('Erro ao carregar elementos da cena');
    } finally {
      setIsLoading(false);
    }
  }, [sceneId]);

  // Save layers to storage
  const saveLayers = useCallback(async () => {
    if (!sceneId || !hasUnsavedChanges) return;
    
    try {
      // Save to localStorage immediately (fast)
      localStorage.setItem(`scene_layers_${sceneId}`, JSON.stringify(layers));
      
      // Debounced save to file system
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          // Load current scene layers data
          const response = await fetch('/project/data/scene_layers.json');
          let sceneLayersData: SceneLayersData;
          
          if (response.ok) {
            sceneLayersData = await response.json();
          } else {
            // Create new structure if file doesn't exist
            sceneLayersData = {
              version: '1.0',
              created_at: new Date().toISOString(),
              project_id: 'heygen-default',
              scenes: [],
              global_settings: {
                canvas_size: { width: 1920, height: 1080, aspect_ratio: '16:9' },
                default_styles: {
                  text: {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '1rem',
                    color: '#374151',
                    textAlign: 'left',
                    lineHeight: 1.4
                  },
                  animations: { default_duration: 1000, default_easing: 'ease-out' }
                },
                grid_settings: { snap_to_grid: true, grid_size: 0.05, show_grid: false }
              }
            };
          }
          
          // Update or add scene data
          const sceneIndex = sceneLayersData.scenes.findIndex(s => s.scene_id === sceneId);
          const sceneData = {
            slide_id: parseInt(sceneId.replace('scene-', '')) + 1,
            scene_id: sceneId,
            layers: layers.map(layer => ({
              ...layer,
              updatedAt: new Date().toISOString()
            }))
          };
          
          if (sceneIndex >= 0) {
            sceneLayersData.scenes[sceneIndex] = sceneData;
          } else {
            sceneLayersData.scenes.push(sceneData);
          }
          
          sceneLayersData.updated_at = new Date().toISOString();
          
          // Save to backend (if available)
          const saveResponse = await fetch('/api/scene-layers/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sceneLayersData)
          });
          
          if (!saveResponse.ok) {
            console.warn('Backend save failed, using localStorage only');
          }
          
          setHasUnsavedChanges(false);
          lastSaveTimeRef.current = Date.now();
          
        } catch (err) {
          console.error('Error saving layers to backend:', err);
        }
      }, 2000); // 2 second debounce
      
    } catch (err) {
      console.error('Error saving layers:', err);
      setError('Falha ao salvar elementos');
      toast.error('Erro ao salvar elementos da cena');
    }
  }, [sceneId, layers, hasUnsavedChanges]);

  // Add layer
  const addLayer = useCallback(async (layerData: Omit<SceneLayer, 'id'>) => {
    const newLayer: SceneLayer = {
      ...layerData,
      id: generateLayerId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setLayers(prev => [...prev, newLayer]);
    setHasUnsavedChanges(true);
    
    // Add to history
    addToHistory({
      type: 'add',
      layer: newLayer,
      sceneId,
      timestamp: Date.now()
    });
    
    toast.success(`Elemento "${newLayer.name}" adicionado`);
  }, [sceneId, addToHistory]);

  // Update layer
  const updateLayer = useCallback(async (layerId: string, updates: Partial<SceneLayer>) => {
    const oldLayer = layers.find(l => l.id === layerId);
    if (!oldLayer) return;
    
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, ...updates, updatedAt: new Date().toISOString() }
        : layer
    ));
    setHasUnsavedChanges(true);
    
    // Add to history
    addToHistory({
      type: 'update',
      layerId,
      updates: { ...updates, updatedAt: new Date().toISOString() },
      sceneId,
      timestamp: Date.now()
    });
  }, [layers, sceneId, addToHistory]);

  // Delete layer
  const deleteLayer = useCallback(async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    setLayers(prev => prev.filter(l => l.id !== layerId));
    setHasUnsavedChanges(true);
    
    // Add to history
    addToHistory({
      type: 'delete',
      layerId,
      layer,
      sceneId,
      timestamp: Date.now()
    });
    
    toast.success(`Elemento "${layer.name}" removido`);
  }, [layers, sceneId, addToHistory]);

  // Reorder layers
  const reorderLayers = useCallback(async (layerIds: string[]) => {
    const reorderedLayers = layerIds
      .map(id => layers.find(l => l.id === id))
      .filter(Boolean) as SceneLayer[];
    
    // Update z_index based on new order
    const updatedLayers = reorderedLayers.map((layer, index) => ({
      ...layer,
      z_index: index + 1,
      updatedAt: new Date().toISOString()
    }));
    
    setLayers(updatedLayers);
    setHasUnsavedChanges(true);
    
    // Add to history
    addToHistory({
      type: 'reorder',
      sceneId,
      timestamp: Date.now()
    });
    
    toast.success('Ordem dos elementos atualizada');
  }, [layers, sceneId, addToHistory]);

  // Duplicate layer
  const duplicateLayer = useCallback(async (layerId: string) => {
    const originalLayer = layers.find(l => l.id === layerId);
    if (!originalLayer) return;
    
    const duplicatedLayer: SceneLayer = {
      ...originalLayer,
      id: generateLayerId(),
      name: `${originalLayer.name} (Cópia)`,
      x: Math.min(0.95, originalLayer.x + 0.05),
      y: Math.min(0.95, originalLayer.y + 0.05),
      z_index: Math.max(...layers.map(l => l.z_index || 0)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setLayers(prev => [...prev, duplicatedLayer]);
    setHasUnsavedChanges(true);
    
    // Add to history
    addToHistory({
      type: 'duplicate',
      layer: duplicatedLayer,
      sceneId,
      timestamp: Date.now()
    });
    
    toast.success(`Elemento "${originalLayer.name}" duplicado`);
  }, [layers, sceneId, addToHistory]);

  // Undo
  const undo = useCallback(async () => {
    if (undoRedoState.past.length === 0) return;
    
    const previousAction = undoRedoState.past[undoRedoState.past.length - 1];
    const newPast = undoRedoState.past.slice(0, -1);
    const newFuture = undoRedoState.present ? [...undoRedoState.future, undoRedoState.present] : undoRedoState.future;
    
    // Reverse the action
    switch (previousAction.type) {
      case 'add':
        if (previousAction.layer) {
          setLayers(prev => prev.filter(l => l.id !== previousAction.layer!.id));
        }
        break;
      case 'delete':
        if (previousAction.layer) {
          setLayers(prev => [...prev, previousAction.layer!]);
        }
        break;
      case 'update':
        // Would need to store previous state for full undo support
        break;
    }
    
    setUndoRedoState({
      past: newPast,
      present: previousAction,
      future: newFuture
    });
    
    setHasUnsavedChanges(true);
    toast.success('Ação desfeita');
  }, [undoRedoState]);

  // Redo
  const redo = useCallback(async () => {
    if (undoRedoState.future.length === 0) return;
    
    const nextAction = undoRedoState.future[undoRedoState.future.length - 1];
    const newFuture = undoRedoState.future.slice(0, -1);
    const newPast = undoRedoState.present ? [...undoRedoState.past, undoRedoState.present] : undoRedoState.past;
    
    // Re-apply the action
    switch (nextAction.type) {
      case 'add':
        if (nextAction.layer) {
          setLayers(prev => [...prev, nextAction.layer!]);
        }
        break;
      case 'delete':
        if (nextAction.layerId) {
          setLayers(prev => prev.filter(l => l.id !== nextAction.layerId));
        }
        break;
      case 'update':
        if (nextAction.layerId && nextAction.updates) {
          setLayers(prev => prev.map(layer =>
            layer.id === nextAction.layerId
              ? { ...layer, ...nextAction.updates }
              : layer
          ));
        }
        break;
    }
    
    setUndoRedoState({
      past: newPast,
      present: nextAction,
      future: newFuture
    });
    
    setHasUnsavedChanges(true);
    toast.success('Ação refeita');
  }, [undoRedoState]);

  // Autosave functionality
  const enableAutosave = useCallback((interval: number = AUTOSAVE_INTERVAL) => {
    disableAutosave(); // Clear existing interval
    
    autosaveIntervalRef.current = window.setInterval(() => {
      if (hasUnsavedChanges) {
        saveLayers();
        console.log('Autosave executed for scene:', sceneId);
      }
    }, interval);
    
    setIsAutosaveEnabled(true);
    toast.success('Salvamento automático ativado');
  }, [hasUnsavedChanges, saveLayers, sceneId]);

  const disableAutosave = useCallback(() => {
    if (autosaveIntervalRef.current) {
      clearInterval(autosaveIntervalRef.current);
      autosaveIntervalRef.current = null;
    }
    setIsAutosaveEnabled(false);
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      saveLayers();
    }
  }, [hasUnsavedChanges, saveLayers]);

  // Enable autosave by default
  useEffect(() => {
    enableAutosave();
    return () => disableAutosave();
  }, [enableAutosave, disableAutosave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      disableAutosave();
    };
  }, [disableAutosave]);

  return {
    layers,
    isLoading,
    error,
    
    // Layer management
    addLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
    duplicateLayer,
    
    // Data management
    loadLayers,
    saveLayers,
    
    // Undo/Redo
    undo,
    redo,
    canUndo: undoRedoState.past.length > 0,
    canRedo: undoRedoState.future.length > 0,
    
    // Autosave
    enableAutosave,
    disableAutosave,
    isAutosaveEnabled
  };
};