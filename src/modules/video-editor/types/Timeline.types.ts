export interface TimelineItem {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect';
  name: string;
  startTime: number; // em segundos
  duration: number; // em segundos
  trackId: string;
  zIndex: number;
  properties: Record<string, any>;
  metadata?: {
    fileSize?: number;
    format?: string;
    resolution?: string;
    frameRate?: number;
  };
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'subtitle' | 'effect';
  height: number;
  color: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  items: TimelineItem[];
  volume?: number; // para trilhas de áudio
}

export interface TimelineState {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  zoom: number;
  pixelsPerSecond: number;
  isPlaying: boolean;
  selectedItems: string[];
  clipboard: TimelineItem[];
  history: TimelineSnapshot[];
  historyIndex: number;
}

export interface TimelineSnapshot {
  timestamp: number;
  tracks: TimelineTrack[];
  action: string;
}

export interface TimelineAction {
  type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'MOVE_ITEM' | 'RESIZE_ITEM' | 
        'ADD_TRACK' | 'REMOVE_TRACK' | 'UPDATE_ITEM' | 'SPLIT_ITEM' |
        'UNDO' | 'REDO' | 'COPY' | 'PASTE' | 'CUT';
  payload: any;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-left' | 'resize-right' | 'create';
  itemId?: string;
  startX: number;
  startTime: number;
  currentX: number;
  trackId?: string;
}

export interface TimelineConfig {
  minZoom: number;
  maxZoom: number;
  defaultTrackHeight: number;
  snapThreshold: number;
  autoSave: boolean;
  maxHistorySteps: number;
}