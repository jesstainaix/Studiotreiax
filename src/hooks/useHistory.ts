import { useState, useCallback, useRef } from 'react';

export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  data: any;
  undo: () => void;
  redo: () => void;
}

export interface HistoryState<T> {
  current: T;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryAction[];
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
}

interface UseHistoryOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
) {
  const { maxHistorySize = 50, debounceMs = 300 } = options;
  
  const [state, setState] = useState<T>(initialState);
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  const [history, setHistory] = useState<HistoryAction[]>([]);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastAction = useRef<string | null>(null);

  const addToHistory = useCallback((action: HistoryAction) => {
    setHistory(prev => {
      const newHistory = [...prev, action];
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      return newHistory;
    });
  }, [maxHistorySize]);

  const executeAction = useCallback(
    (
      actionType: string,
      description: string,
      newState: T,
      undoCallback?: () => void,
      redoCallback?: () => void
    ) => {
      const previousState = state;
      
      const action: HistoryAction = {
        id: `${actionType}-${Date.now()}-${Math.random()}`,
        type: actionType,
        description,
        timestamp: Date.now(),
        data: {
          previousState,
          newState
        },
        undo: () => {
          setState(previousState);
          undoCallback?.();
        },
        redo: () => {
          setState(newState);
          redoCallback?.();
        }
      };

      // Clear debounce timer if exists
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Check if this is a continuation of the same action type
      const isContinuation = lastAction.current === actionType;
      
      if (isContinuation && debounceMs > 0) {
        // Debounce similar actions
        debounceTimer.current = setTimeout(() => {
          setUndoStack(prev => {
            // Replace the last action if it's the same type
            const newStack = prev.length > 0 && prev[prev.length - 1].type === actionType
              ? [...prev.slice(0, -1), action]
              : [...prev, action];
            
            if (newStack.length > maxHistorySize) {
              return newStack.slice(-maxHistorySize);
            }
            return newStack;
          });
          
          addToHistory(action);
          setRedoStack([]); // Clear redo stack when new action is performed
        }, debounceMs);
      } else {
        // Execute immediately for different action types
        setUndoStack(prev => {
          const newStack = [...prev, action];
          if (newStack.length > maxHistorySize) {
            return newStack.slice(-maxHistorySize);
          }
          return newStack;
        });
        
        addToHistory(action);
        setRedoStack([]); // Clear redo stack when new action is performed
      }

      lastAction.current = actionType;
      setState(newState);
    },
    [state, maxHistorySize, debounceMs, addToHistory]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return false;

    const action = undoStack[undoStack.length - 1];
    action.undo();
    
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
    
    return true;
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return false;

    const action = redoStack[redoStack.length - 1];
    action.redo();
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    
    return true;
  }, [redoStack]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    setHistory([]);
    lastAction.current = null;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const getHistoryState = useCallback((): HistoryState<T> => {
    return {
      current: state,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      history,
      undoStack,
      redoStack
    };
  }, [state, undoStack, redoStack, history]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      event.preventDefault();
      undo();
    } else if (
      ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
      ((event.ctrlKey || event.metaKey) && event.key === 'y')
    ) {
      event.preventDefault();
      redo();
    }
  }, [undo, redo]);

  return {
    state,
    setState,
    executeAction,
    undo,
    redo,
    clearHistory,
    getHistoryState,
    handleKeyDown,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    historySize: undoStack.length + redoStack.length
  };
}

// Specialized hook for video editor
export function useVideoEditorHistory(initialLayers: any[]) {
  const {
    state: layers,
    executeAction,
    undo,
    redo,
    clearHistory,
    getHistoryState,
    handleKeyDown,
    canUndo,
    canRedo,
    historySize
  } = useHistory(initialLayers, {
    maxHistorySize: 100,
    debounceMs: 500
  });

  const updateLayers = useCallback(
    (newLayers: any[], actionType: string, description: string) => {
      executeAction(actionType, description, newLayers);
    },
    [executeAction]
  );

  const addLayer = useCallback(
    (layer: any) => {
      const newLayers = [...layers, layer];
      updateLayers(newLayers, 'ADD_LAYER', `Adicionada camada: ${layer.name}`);
    },
    [layers, updateLayers]
  );

  const removeLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      const newLayers = layers.filter(l => l.id !== layerId);
      updateLayers(newLayers, 'REMOVE_LAYER', `Removida camada: ${layer?.name || layerId}`);
    },
    [layers, updateLayers]
  );

  const updateLayer = useCallback(
    (layerId: string, updates: any) => {
      const layer = layers.find(l => l.id === layerId);
      const newLayers = layers.map(l => 
        l.id === layerId ? { ...l, ...updates } : l
      );
      updateLayers(newLayers, 'UPDATE_LAYER', `Atualizada camada: ${layer?.name || layerId}`);
    },
    [layers, updateLayers]
  );

  const moveLayer = useCallback(
    (layerId: string, newOrder: number) => {
      const layer = layers.find(l => l.id === layerId);
      const newLayers = layers.map(l => 
        l.id === layerId ? { ...l, order: newOrder } : l
      );
      updateLayers(newLayers, 'MOVE_LAYER', `Movida camada: ${layer?.name || layerId}`);
    },
    [layers, updateLayers]
  );

  const duplicateLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        const duplicatedLayer = {
          ...layer,
          id: `${layer.id}-copy-${Date.now()}`,
          name: `${layer.name} (Cópia)`,
          order: layers.length
        };
        const newLayers = [...layers, duplicatedLayer];
        updateLayers(newLayers, 'DUPLICATE_LAYER', `Duplicada camada: ${layer.name}`);
      }
    },
    [layers, updateLayers]
  );

  return {
    layers,
    updateLayers,
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    duplicateLayer,
    undo,
    redo,
    clearHistory,
    getHistoryState,
    handleKeyDown,
    canUndo,
    canRedo,
    historySize
  };
}