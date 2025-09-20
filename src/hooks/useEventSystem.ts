import { useEffect, useCallback, useMemo } from 'react';
import { EventSystem, EditorEventType, EditorEventPayload, EventHandler } from '../core/eventSystem';

/**
 * React hook for using the EventSystem in components
 * Provides type-safe event subscription and emission
 */
export function useEventSystem() {
  const eventSystem = useMemo(() => EventSystem.getInstance(), []);

  /**
   * Subscribe to an event
   * @param eventType The type of event to subscribe to
   * @param handler The event handler function
   */
  const subscribe = useCallback(<T extends EditorEventType>(
    eventType: T,
    handler: EventHandler<T>
  ) => {
    return eventSystem.subscribe(eventType, handler);
  }, [eventSystem]);

  /**
   * Emit an event with payload
   * @param eventType The type of event to emit
   * @param payload The event payload
   */
  const emit = useCallback(<T extends EditorEventType>(
    eventType: T,
    payload: EditorEventPayload[T]
  ) => {
    eventSystem.emit(eventType, payload);
  }, [eventSystem]);

  /**
   * Emit a debounced event
   * @param eventType The type of event to emit
   * @param payload The event payload
   * @param delay The debounce delay in milliseconds
   */
  const emitDebounced = useCallback(<T extends EditorEventType>(
    eventType: T,
    payload: EditorEventPayload[T],
    delay?: number
  ) => {
    eventSystem.emitDebounced(eventType, payload, delay);
  }, [eventSystem]);

  /**
   * Subscribe to an event for the component lifecycle
   * Automatically unsubscribes when the component unmounts
   * @param eventType The type of event to subscribe to
   * @param handler The event handler function
   */
  const useSubscription = <T extends EditorEventType>(
    eventType: T,
    handler: EventHandler<T>
  ) => {
    useEffect(() => {
      const unsubscribe = eventSystem.subscribe(eventType, handler);
      return () => {
        unsubscribe();
      };
    }, [eventType, handler]);
  };

  return {
    subscribe,
    emit,
    emitDebounced,
    useSubscription,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * function MyComponent() {
 *   const { emit, useSubscription } = useEventSystem();
 * 
 *   // Subscribe to canvas zoom events
 *   useSubscription('canvas.zoom', (payload) => {
 *     console.log('Canvas zoom level:', payload.level);
 *   });
 * 
 *   // Emit a canvas element update event
 *   const handleElementUpdate = () => {
 *     emit('canvas.element.update', {
 *       elementId: '123',
 *       changes: { position: { x: 100, y: 100, z: 0 } }
 *     });
 *   };
 * 
 *   return <button onClick={handleElementUpdate}>Update Element</button>;
 * }
 * ```
 */