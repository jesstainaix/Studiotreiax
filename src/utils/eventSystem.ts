// Centralized Event System for Video Editor Module

import { EditorEvent, EditorEventType, EventListener } from '../types/editor';

/**
 * Centralized Event System for managing communication between editor components
 * Implements a high-performance event bus with priority handling and memory optimization
 */
export class EditorEventSystem {
  private listeners: Map<EditorEventType, EventListener[]> = new Map();
  private eventQueue: EditorEvent[] = [];
  private isProcessing = false;
  private maxQueueSize = 1000;
  private performanceMetrics = {
    eventsProcessed: 0,
    averageProcessingTime: 0,
    lastProcessingTime: 0
  };

  private static instance: EditorEventSystem;

  /**
   * Singleton pattern to ensure single event system instance
   */
  public static getInstance(): EditorEventSystem {
    if (!EditorEventSystem.instance) {
      EditorEventSystem.instance = new EditorEventSystem();
    }
    return EditorEventSystem.instance;
  }

  /**
   * Subscribe to events with priority and filtering options
   */
  public on(
    eventType: EditorEventType,
    callback: (event: EditorEvent) => void,
    options: {
      priority?: number;
      once?: boolean;
      filter?: (event: EditorEvent) => boolean;
    } = {}
  ): string {
    const listener: EventListener = {
      id: this.generateListenerId(),
      eventType,
      callback: options.filter ? 
        (event: EditorEvent) => {
          if (options.filter!(event)) {
            callback(event);
          }
        } : callback,
      priority: options.priority || 0,
      once: options.once || false
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const eventListeners = this.listeners.get(eventType)!;
    
    // Insert listener based on priority (higher priority first)
    const insertIndex = eventListeners.findIndex(l => l.priority < listener.priority);
    if (insertIndex === -1) {
      eventListeners.push(listener);
    } else {
      eventListeners.splice(insertIndex, 0, listener);
    }

    return listener.id;
  }

  /**
   * Unsubscribe from events
   */
  public off(listenerId: string): boolean {
    for (const [eventType, listeners] of this.listeners.entries()) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.listeners.delete(eventType);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Emit events with optional batching and performance tracking
   */
  public emit(
    eventType: EditorEventType,
    data: any,
    options: {
      source?: string;
      propagate?: boolean;
      immediate?: boolean;
      batch?: boolean;
    } = {}
  ): void {
    const event: EditorEvent = {
      type: eventType,
      timestamp: performance.now(),
      source: options.source || 'unknown',
      data,
      propagate: options.propagate !== false,
      preventDefault: false
    };

    if (options.immediate) {
      this.processEvent(event);
    } else {
      this.queueEvent(event, options.batch);
    }
  }

  /**
   * Emit multiple events in batch for performance optimization
   */
  public emitBatch(events: Array<{
    type: EditorEventType;
    data: any;
    source?: string;
  }>): void {
    const batchEvents = events.map(e => ({
      type: e.type,
      timestamp: performance.now(),
      source: e.source || 'batch',
      data: e.data,
      propagate: true,
      preventDefault: false
    }));

    this.eventQueue.push(...batchEvents);
    this.processQueue();
  }

  /**
   * Queue event for batch processing
   */
  private queueEvent(event: EditorEvent, batch = false): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      console.warn('Event queue overflow, dropping oldest events');
      this.eventQueue.splice(0, this.maxQueueSize * 0.1); // Remove 10% of oldest events
    }

    this.eventQueue.push(event);

    if (!batch) {
      this.processQueue();
    }
  }

  /**
   * Process queued events with performance optimization
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      // Process events in batches to prevent blocking
      const batchSize = Math.min(50, this.eventQueue.length);
      const batch = this.eventQueue.splice(0, batchSize);

      for (const event of batch) {
        await this.processEvent(event);
        
        // Yield control periodically to prevent blocking
        if (performance.now() - startTime > 16) { // ~60fps
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Continue processing if more events are queued
      if (this.eventQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    } finally {
      this.isProcessing = false;
      this.updatePerformanceMetrics(performance.now() - startTime);
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: EditorEvent): Promise<void> {
    const listeners = this.listeners.get(event.type);
    if (!listeners || listeners.length === 0) {
      return;
    }

    const listenersToRemove: string[] = [];

    for (const listener of listeners) {
      try {
        await listener.callback(event);
        
        if (listener.once) {
          listenersToRemove.push(listener.id);
        }

        // Stop propagation if requested
        if (!event.propagate) {
          break;
        }
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
        // Continue processing other listeners even if one fails
      }
    }

    // Remove one-time listeners
    listenersToRemove.forEach(id => this.off(id));
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceMetrics.eventsProcessed++;
    this.performanceMetrics.lastProcessingTime = processingTime;
    
    // Calculate rolling average
    const alpha = 0.1; // Smoothing factor
    this.performanceMetrics.averageProcessingTime = 
      (1 - alpha) * this.performanceMetrics.averageProcessingTime + 
      alpha * processingTime;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      queueSize: this.eventQueue.length,
      listenerCount: Array.from(this.listeners.values())
        .reduce((total, listeners) => total + listeners.length, 0)
    };
  }

  /**
   * Clear all listeners and queued events
   */
  public clear(): void {
    this.listeners.clear();
    this.eventQueue.length = 0;
    this.isProcessing = false;
  }

  /**
   * Get all active listeners for debugging
   */
  public getActiveListeners(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [eventType, listeners] of this.listeners.entries()) {
      result[eventType] = listeners.length;
    }
    return result;
  }

  /**
   * Generate unique listener ID
   */
  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Pause event processing (useful for debugging or performance testing)
   */
  public pause(): void {
    this.isProcessing = true;
  }

  /**
   * Resume event processing
   */
  public resume(): void {
    this.isProcessing = false;
    this.processQueue();
  }

  /**
   * Set maximum queue size
   */
  public setMaxQueueSize(size: number): void {
    this.maxQueueSize = Math.max(100, size);
  }
}

// Export singleton instance
export const eventSystem = EditorEventSystem.getInstance();

// Convenience functions for common event patterns
export const editorEvents = {
  // Canvas events
  onElementAdded: (callback: (element: any) => void) => 
    eventSystem.on('canvas.element.added', (event) => callback(event.data)),
  
  onElementRemoved: (callback: (elementId: string) => void) => 
    eventSystem.on('canvas.element.removed', (event) => callback(event.data)),
  
  onElementModified: (callback: (element: any) => void) => 
    eventSystem.on('canvas.element.modified', (event) => callback(event.data)),

  // Timeline events
  onClipAdded: (callback: (clip: any) => void) => 
    eventSystem.on('timeline.clip.added', (event) => callback(event.data)),
  
  onClipMoved: (callback: (clipData: any) => void) => 
    eventSystem.on('timeline.clip.moved', (event) => callback(event.data)),
  
  onPlayheadMoved: (callback: (position: number) => void) => 
    eventSystem.on('timeline.playhead.moved', (event) => callback(event.data)),

  // Performance events
  onPerformanceWarning: (callback: (warning: any) => void) => 
    eventSystem.on('performance.warning', (event) => callback(event.data)),
  
  onPerformanceCritical: (callback: (critical: any) => void) => 
    eventSystem.on('performance.critical', (event) => callback(event.data)),

  // Project events
  onProjectSaved: (callback: (project: any) => void) => 
    eventSystem.on('project.saved', (event) => callback(event.data)),
  
  onProjectLoaded: (callback: (project: any) => void) => 
    eventSystem.on('project.loaded', (event) => callback(event.data)),

  // Export events
  onExportStarted: (callback: (config: any) => void) => 
    eventSystem.on('export.started', (event) => callback(event.data)),
  
  onExportProgress: (callback: (progress: number) => void) => 
    eventSystem.on('export.progress', (event) => callback(event.data)),
  
  onExportCompleted: (callback: (result: any) => void) => 
    eventSystem.on('export.completed', (event) => callback(event.data)),

  // Collaboration events
  onUserJoined: (callback: (user: any) => void) => 
    eventSystem.on('collaboration.user.joined', (event) => callback(event.data)),
  
  onUserLeft: (callback: (userId: string) => void) => 
    eventSystem.on('collaboration.user.left', (event) => callback(event.data))
};

// Event emitter helpers
export const emitEditorEvent = {
  // Canvas events
  elementAdded: (element: any, source = 'canvas') => 
    eventSystem.emit('canvas.element.added', element, { source }),
  
  elementRemoved: (elementId: string, source = 'canvas') => 
    eventSystem.emit('canvas.element.removed', elementId, { source }),
  
  elementModified: (element: any, source = 'canvas') => 
    eventSystem.emit('canvas.element.modified', element, { source }),

  // Timeline events
  clipAdded: (clip: any, source = 'timeline') => 
    eventSystem.emit('timeline.clip.added', clip, { source }),
  
  clipMoved: (clipData: any, source = 'timeline') => 
    eventSystem.emit('timeline.clip.moved', clipData, { source }),
  
  playheadMoved: (position: number, source = 'timeline') => 
    eventSystem.emit('timeline.playhead.moved', position, { source }),

  // Performance events
  performanceWarning: (warning: any, source = 'performance') => 
    eventSystem.emit('performance.warning', warning, { source, immediate: true }),
  
  performanceCritical: (critical: any, source = 'performance') => 
    eventSystem.emit('performance.critical', critical, { source, immediate: true }),

  // Project events
  projectSaved: (project: any, source = 'project') => 
    eventSystem.emit('project.saved', project, { source }),
  
  projectLoaded: (project: any, source = 'project') => 
    eventSystem.emit('project.loaded', project, { source }),

  // Export events
  exportStarted: (config: any, source = 'export') => 
    eventSystem.emit('export.started', config, { source }),
  
  exportProgress: (progress: number, source = 'export') => 
    eventSystem.emit('export.progress', progress, { source }),
  
  exportCompleted: (result: any, source = 'export') => 
    eventSystem.emit('export.completed', result, { source })
};

// Performance monitoring for event system
export const monitorEventSystem = () => {
  const metrics = eventSystem.getPerformanceMetrics();
  
  if (metrics.averageProcessingTime > 16) { // More than one frame at 60fps
    console.warn('Event system performance degradation detected:', metrics);
  }
  
  if (metrics.queueSize > 500) {
    console.warn('Event queue size is getting large:', metrics.queueSize);
  }
  
  return metrics;
};

// Cleanup function for component unmounting
export const cleanupEventListeners = (listenerIds: string[]) => {
  listenerIds.forEach(id => eventSystem.off(id));
};

export default eventSystem;