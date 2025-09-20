import { CanvasElement, TimelineClip, ElementType, Vector3D, Transform3D } from '../types/editor';

// Event Types
export type EditorEventType =
  // Canvas Events
  | 'canvas.element.add'
  | 'canvas.element.remove'
  | 'canvas.element.update'
  | 'canvas.element.select'
  | 'canvas.element.deselect'
  | 'canvas.element.transform'
  | 'canvas.zoom'
  | 'canvas.pan'
  | 'canvas.reset'
  // Timeline Events
  | 'timeline.clip.add'
  | 'timeline.clip.remove'
  | 'timeline.clip.update'
  | 'timeline.clip.split'
  | 'timeline.clip.merge'
  | 'timeline.track.add'
  | 'timeline.track.remove'
  | 'timeline.track.update'
  | 'timeline.playhead.move'
  | 'timeline.zoom'
  // Avatar Events
  | 'avatar.expression.change'
  | 'avatar.gesture.change'
  | 'avatar.clothing.update'
  | 'avatar.lipsync.update'
  // Effect Events
  | 'effect.add'
  | 'effect.remove'
  | 'effect.update'
  | 'effect.preview'
  // Project Events
  | 'project.save'
  | 'project.load'
  | 'project.export'
  | 'project.settings.update'
  // Performance Events
  | 'performance.warning'
  | 'performance.optimization'
  | 'performance.metrics';

// Event Payload Types
export interface EditorEventPayload {
  // Canvas Element Events
  'canvas.element.add': { element: CanvasElement };
  'canvas.element.remove': { elementId: string };
  'canvas.element.update': { elementId: string; changes: Partial<CanvasElement> };
  'canvas.element.select': { elementId: string };
  'canvas.element.deselect': { elementId: string };
  'canvas.element.transform': { elementId: string; transform: Transform3D };
  'canvas.zoom': { level: number };
  'canvas.pan': { position: Vector3D };
  'canvas.reset': undefined;
  // Timeline Events
  'timeline.clip.add': { clip: TimelineClip };
  'timeline.clip.remove': { clipId: string };
  'timeline.clip.update': { clipId: string; changes: Partial<TimelineClip> };
  'timeline.clip.split': { clipId: string; time: number };
  'timeline.clip.merge': { clipIds: string[] };
  'timeline.track.add': { track: { id: string; name: string; type: ElementType } };
  'timeline.track.remove': { trackId: string };
  'timeline.track.update': { trackId: string; changes: any };
  'timeline.playhead.move': { time: number };
  'timeline.zoom': { level: number };
  // Avatar Events
  'avatar.expression.change': { avatarId: string; expressionId: string };
  'avatar.gesture.change': { avatarId: string; gestureId: string };
  'avatar.clothing.update': { avatarId: string; clothing: any };
  'avatar.lipsync.update': { avatarId: string; phonemes: any[] };
  // Effect Events
  'effect.add': { effect: any };
  'effect.remove': { effectId: string };
  'effect.update': { effectId: string; changes: any };
  'effect.preview': { effectId: string; enabled: boolean };
  // Project Events
  'project.save': { projectId: string };
  'project.load': { projectId: string };
  'project.export': { format: string; quality: string };
  'project.settings.update': { settings: any };
  // Performance Events
  'performance.warning': { type: string; message: string };
  'performance.optimization': { level: string; changes: any };
  'performance.metrics': { fps: number; memory: number; cpu: number };
}

// Event Handler Type
export type EventHandler<T extends EditorEventType> = (payload: EditorEventPayload[T]) => void;

/**
 * Event System for Editor Component Communication
 * Implements a type-safe event emitter pattern with support for:
 * - Event subscription/unsubscription
 * - Typed event payloads
 * - Event debouncing
 * - Event logging (in development)
 */
export class EventSystem {
  private static instance: EventSystem;
  private handlers: Map<EditorEventType, Set<EventHandler<any>>>;
  private debugMode: boolean;

  private constructor() {
    this.handlers = new Map();
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Get the singleton instance of the EventSystem
   */
  public static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Subscribe to an event
   * @param eventType The type of event to subscribe to
   * @param handler The event handler function
   */
  public subscribe<T extends EditorEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventType, handler);
    };
  }

  /**
   * Unsubscribe from an event
   * @param eventType The type of event to unsubscribe from
   * @param handler The event handler function to remove
   */
  public unsubscribe<T extends EditorEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Emit an event with payload
   * @param eventType The type of event to emit
   * @param payload The event payload
   */
  public emit<T extends EditorEventType>(
    eventType: T,
    payload: EditorEventPayload[T]
  ): void {
    const handlers = this.handlers.get(eventType);
    
    if (this.debugMode) {
      console.debug(`[EventSystem] Emitting ${eventType}`, payload);
    }

    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventSystem] Error in handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Emit a debounced event
   * @param eventType The type of event to emit
   * @param payload The event payload
   * @param delay The debounce delay in milliseconds
   */
  public emitDebounced<T extends EditorEventType>(
    eventType: T,
    payload: EditorEventPayload[T],
    delay: number = 100
  ): void {
    if (this._debouncedEmits.has(eventType)) {
      clearTimeout(this._debouncedEmits.get(eventType)!);
    }

    const timeoutId = setTimeout(() => {
      this.emit(eventType, payload);
      this._debouncedEmits.delete(eventType);
    }, delay);

    this._debouncedEmits.set(eventType, timeoutId);
  }

  private _debouncedEmits: Map<EditorEventType, NodeJS.Timeout> = new Map();

  /**
   * Remove all event handlers
   */
  public removeAllHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of handlers for an event type
   * @param eventType The type of event
   */
  public getHandlerCount(eventType: EditorEventType): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }
}