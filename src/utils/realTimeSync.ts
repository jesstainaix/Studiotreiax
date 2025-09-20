import { useCallback, useEffect, useRef, useState } from 'react';

// Types for real-time synchronization
export interface SyncEvent {
  id: string;
  type: 'resource_update' | 'timeline_change' | 'canvas_update' | 'user_action';
  data: any;
  timestamp: number;
  userId?: string;
}

export interface SyncState {
  isConnected: boolean;
  lastSync: number;
  pendingChanges: SyncEvent[];
  conflictResolution: 'merge' | 'overwrite' | 'manual';
}

// WebSocket connection manager
class RealTimeSyncManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventQueue: SyncEvent[] = [];
  private subscribers = new Map<string, (event: SyncEvent) => void>();
  private isReconnecting = false;

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.startHeartbeat();
          this.flushEventQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const syncEvent: SyncEvent = JSON.parse(event.data);
            this.handleIncomingEvent(syncEvent);
          } catch (error) {
            console.error('Failed to parse sync event:', error);
          }
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          if (!this.isReconnecting) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isReconnecting = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect().catch(() => {
        this.attemptReconnect();
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  private handleIncomingEvent(event: SyncEvent): void {
    // Notify all subscribers
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in sync event subscriber:', error);
      }
    });
  }

  sendEvent(event: SyncEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      // Queue event for later sending
      this.eventQueue.push(event);
    }
  }

  subscribe(id: string, callback: (event: SyncEvent) => void): () => void {
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Global sync manager instance
const syncManager = new RealTimeSyncManager(
  import.meta.env.DEV 
    ? 'ws://localhost:3001/ws' 
    : 'wss://your-production-ws-url.com/ws'
);

// Hook for real-time synchronization
export function useRealTimeSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    lastSync: Date.now(),
    pendingChanges: [],
    conflictResolution: 'merge'
  });

  const subscriberIdRef = useRef<string>(`subscriber_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    const subscriberId = subscriberIdRef.current;

    // Subscribe to sync events
    const unsubscribe = syncManager.subscribe(subscriberId, (event) => {
      setSyncState(prev => ({
        ...prev,
        lastSync: Date.now()
      }));
    });

    // Connect to WebSocket
    syncManager.connect().then(() => {
      setSyncState(prev => ({ ...prev, isConnected: true }));
    }).catch((error) => {
      console.error('Failed to connect to sync server:', error);
      setSyncState(prev => ({ ...prev, isConnected: false }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendSyncEvent = useCallback((event: Omit<SyncEvent, 'id' | 'timestamp'>) => {
    const syncEvent: SyncEvent = {
      ...event,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now()
    };

    syncManager.sendEvent(syncEvent);
    
    setSyncState(prev => ({
      ...prev,
      pendingChanges: [...prev.pendingChanges, syncEvent]
    }));
  }, []);

  const clearPendingChanges = useCallback(() => {
    setSyncState(prev => ({ ...prev, pendingChanges: [] }));
  }, []);

  return {
    syncState,
    sendSyncEvent,
    clearPendingChanges,
    isConnected: syncState.isConnected
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [optimisticData, setOptimisticData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const { sendSyncEvent } = useRealTimeSync();

  const updateOptimistically = useCallback((newData: T, syncEvent: Omit<SyncEvent, 'id' | 'timestamp'>) => {
    setOptimisticData(newData);
    setIsOptimistic(true);
    sendSyncEvent(syncEvent);
  }, [sendSyncEvent]);

  const confirmUpdate = useCallback((confirmedData: T) => {
    setData(confirmedData);
    setOptimisticData(confirmedData);
    setIsOptimistic(false);
  }, []);

  const revertOptimistic = useCallback(() => {
    setOptimisticData(data);
    setIsOptimistic(false);
  }, [data]);

  return {
    data: optimisticData,
    isOptimistic,
    updateOptimistically,
    confirmUpdate,
    revertOptimistic
  };
}

// Debounced sync hook for frequent updates
export function useDebouncedSync(delay: number = 500) {
  const { sendSyncEvent } = useRealTimeSync();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingEventsRef = useRef<SyncEvent[]>([]);

  const debouncedSend = useCallback((event: Omit<SyncEvent, 'id' | 'timestamp'>) => {
    const syncEvent: SyncEvent = {
      ...event,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now()
    };

    pendingEventsRef.current.push(syncEvent);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const eventsToSend = [...pendingEventsRef.current];
      pendingEventsRef.current = [];
      
      // Send batched events
      eventsToSend.forEach(sendSyncEvent);
    }, delay);
  }, [sendSyncEvent, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedSend };
}

export { syncManager };