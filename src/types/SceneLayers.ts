// Scene Layers Type Definitions for Phase 4 - Timeline Editor and Preview System

export type SceneLayerType = 'text' | 'image' | 'graphic' | 'video' | 'audio';

export interface SceneLayerStyle {
  // Text-specific styles
  fontSize?: string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  textShadow?: string;
  textDecoration?: string;
  
  // Visual styles (all types)
  opacity?: number;
  filter?: string;
  transform?: string;
  borderRadius?: string;
  border?: string;
  background?: string;
  boxShadow?: string;
  
  // Animation and transition
  transition?: string;
}

export interface SceneLayerAnimation {
  type: 'fadeIn' | 'fadeOut' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 
        'zoomIn' | 'zoomOut' | 'rotateIn' | 'rotateOut' | 'bounceIn' | 'bounceOut' |
        'typewriter' | 'fadeInSequence' | 'pulse' | 'shake' | 'flip';
  duration: number; // milliseconds
  delay: number; // milliseconds
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  repeat?: boolean;
  repeatCount?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface GraphicContent {
  type: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'icon' | 'line' | 'arrow';
  // Shape properties
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  
  // Border properties
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  
  // Icon-specific properties
  name?: string; // icon name from Lucide React
  size?: number;
  color?: string;
  
  // Polygon-specific
  points?: string; // SVG points attribute
  
  // Line/Arrow specific
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

export interface SceneLayer {
  id?: string; // UUID generated when created
  type: SceneLayerType;
  name: string; // User-friendly name for layer management
  
  // Content (varies by type)
  value?: string; // For text layers
  src?: string; // For image/video/audio layers
  content?: GraphicContent; // For graphic layers
  
  // Positioning (normalized 0-1 coordinates)
  x: number; // Horizontal position (0 = left, 1 = right)
  y: number; // Vertical position (0 = top, 1 = bottom)
  width: number; // Width as percentage of canvas
  height: number; // Height as percentage of canvas
  z_index: number; // Layer stacking order
  
  // Styling
  style: SceneLayerStyle;
  
  // Animation
  animation: SceneLayerAnimation | null;
  
  // Layer state
  visible: boolean;
  locked: boolean; // Prevents editing/moving
  
  // Timeline properties
  startTime?: number; // When layer appears (seconds)
  endTime?: number; // When layer disappears (seconds)
  
  // Interaction properties
  interactive?: boolean;
  onClick?: string; // Action on click
  onHover?: string; // Action on hover
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  notes?: string;
}

export interface SceneLayersData {
  version: string;
  created_at: string;
  updated_at?: string;
  project_id: string;
  
  scenes: {
    slide_id: number;
    scene_id: string;
    layers: SceneLayer[];
  }[];
  
  global_settings: {
    canvas_size: {
      width: number;
      height: number;
      aspect_ratio: string;
    };
    default_styles: {
      text: SceneLayerStyle;
      animations: {
        default_duration: number;
        default_easing: string;
      };
    };
    grid_settings: {
      snap_to_grid: boolean;
      grid_size: number; // Grid cell size as percentage
      show_grid: boolean;
    };
  };
}

export interface LayerUpdateAction {
  type: 'add' | 'update' | 'delete' | 'reorder' | 'duplicate';
  layerId?: string;
  layer?: SceneLayer;
  updates?: Partial<SceneLayer>;
  newIndex?: number;
  sceneId: string;
  timestamp: number;
}

export interface UndoRedoState {
  past: LayerUpdateAction[];
  present: LayerUpdateAction | null;
  future: LayerUpdateAction[];
}

// Utility types for drag and drop
export interface DragData {
  layerId: string;
  startPosition: { x: number; y: number };
  elementType: SceneLayerType;
}

export interface DropTarget {
  sceneId: string;
  position: { x: number; y: number };
  canDrop: boolean;
}

// Canvas interaction types
export interface CanvasMouseEvent {
  type: 'click' | 'drag' | 'hover' | 'select';
  position: { x: number; y: number }; // Normalized coordinates
  layerId?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  visible: boolean;
}

// Performance optimization types
export interface LazyLoadedLayer extends SceneLayer {
  isLoaded: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  zoom: number;
}

// Export helper functions interface
export interface SceneLayersManager {
  loadLayers: (sceneId: string) => Promise<SceneLayer[]>;
  saveLayers: (sceneId: string, layers: SceneLayer[]) => Promise<void>;
  addLayer: (sceneId: string, layer: Omit<SceneLayer, 'id'>) => Promise<SceneLayer>;
  updateLayer: (sceneId: string, layerId: string, updates: Partial<SceneLayer>) => Promise<void>;
  deleteLayer: (sceneId: string, layerId: string) => Promise<void>;
  reorderLayers: (sceneId: string, layerIds: string[]) => Promise<void>;
  duplicateLayer: (sceneId: string, layerId: string) => Promise<SceneLayer>;
  
  // Autosave functionality
  enableAutosave: (interval: number) => void;
  disableAutosave: () => void;
  saveSnapshot: () => Promise<void>;
  
  // Undo/Redo
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
}