import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  elementType?: string;
  timestamp: Date;
}

export interface UserCursor {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  position: CursorPosition;
  isActive: boolean;
  lastSeen: Date;
  sessionId: string;
}

export interface Selection {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  elementId: string;
  elementType: 'text' | 'timeline' | 'layer' | 'asset' | 'component';
  startOffset?: number;
  endOffset?: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: Date;
  isActive: boolean;
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  users: UserCursor[];
  selections: Selection[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface CursorEvent {
  id: string;
  type: 'cursor_move' | 'cursor_enter' | 'cursor_leave' | 'selection_change' | 'user_join' | 'user_leave';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface SyncConfig {
  enabled: boolean;
  throttleMs: number;
  maxUsers: number;
  showCursors: boolean;
  showSelections: boolean;
  showUserNames: boolean;
  fadeTimeout: number;
  syncTextSelection: boolean;
  syncTimelineSelection: boolean;
  syncLayerSelection: boolean;
  cursorSize: 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface CursorStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  totalEvents: number;
  eventsPerSecond: number;
  averageLatency: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SyncMetrics {
  latency: number;
  packetsLost: number;
  bandwidth: number;
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Store Interface
interface CursorSyncStore {
  // State
  cursors: UserCursor[];
  selections: Selection[];
  sessions: CollaborationSession[];
  events: CursorEvent[];
  config: SyncConfig;
  stats: CursorStats;
  metrics: SyncMetrics;
  currentUser: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  } | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  error: string | null;
  isLoading: boolean;
  lastSync: Date | null;
  
  // Computed
  activeCursors: UserCursor[];
  activeSelections: Selection[];
  currentSession: CollaborationSession | null;
  otherUsers: UserCursor[];
  
  // Actions - Cursor Management
  updateCursorPosition: (position: CursorPosition) => Promise<void>;
  addUserCursor: (cursor: UserCursor) => void;
  removeUserCursor: (userId: string) => void;
  updateUserCursor: (userId: string, updates: Partial<UserCursor>) => void;
  clearInactiveCursors: () => void;
  
  // Actions - Selection Management
  updateSelection: (selection: Partial<Selection>) => Promise<void>;
  addSelection: (selection: Selection) => void;
  removeSelection: (selectionId: string) => void;
  clearUserSelections: (userId: string) => void;
  clearAllSelections: () => void;
  
  // Actions - Session Management
  createSession: (projectId: string) => Promise<string>;
  joinSession: (sessionId: string, user: Partial<UserCursor>) => Promise<void>;
  leaveSession: (sessionId?: string) => Promise<void>;
  updateSessionActivity: (sessionId: string) => void;
  
  // Actions - Event Management
  addEvent: (event: Omit<CursorEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  getEventHistory: (userId?: string, type?: CursorEvent['type']) => CursorEvent[];
  
  // Actions - Configuration
  updateConfig: (updates: Partial<SyncConfig>) => void;
  resetConfig: () => void;
  
  // Actions - Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  
  // Actions - Sync
  syncData: () => Promise<void>;
  forcSync: () => Promise<void>;
  
  // Actions - Utilities
  setCurrentUser: (user: CursorSyncStore['currentUser']) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  refreshData: () => Promise<void>;
  clearData: () => void;
}

// Default configuration
const defaultConfig: SyncConfig = {
  enabled: true,
  throttleMs: 50,
  maxUsers: 10,
  showCursors: true,
  showSelections: true,
  showUserNames: true,
  fadeTimeout: 3000,
  syncTextSelection: true,
  syncTimelineSelection: true,
  syncLayerSelection: true,
  cursorSize: 'medium',
  animationSpeed: 'normal'
};

// Default stats
const defaultStats: CursorStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalSessions: 0,
  activeSessions: 0,
  totalEvents: 0,
  eventsPerSecond: 0,
  averageLatency: 0,
  connectionQuality: 'excellent'
};

// Default metrics
const defaultMetrics: SyncMetrics = {
  latency: 0,
  packetsLost: 0,
  bandwidth: 0,
  fps: 60,
  memoryUsage: 0,
  cpuUsage: 0
};

// Create store
export const useCursorSyncStore = create<CursorSyncStore>()(subscribeWithSelector((set, get) => ({
  // Initial State
  cursors: [],
  selections: [],
  sessions: [],
  events: [],
  config: defaultConfig,
  stats: defaultStats,
  metrics: defaultMetrics,
  currentUser: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  error: null,
  isLoading: false,
  lastSync: null,
  
  // Computed Properties
  get activeCursors() {
    return get().cursors.filter(cursor => cursor.isActive);
  },
  
  get activeSelections() {
    return get().selections.filter(selection => selection.isActive);
  },
  
  get currentSession() {
    const sessions = get().sessions;
    return sessions.find(session => session.isActive) || null;
  },
  
  get otherUsers() {
    const { cursors, currentUser } = get();
    return cursors.filter(cursor => cursor.userId !== currentUser?.id);
  },
  
  // Cursor Management Actions
  updateCursorPosition: async (position: CursorPosition) => {
    const { currentUser, config } = get();
    if (!currentUser || !config.enabled) return;
    
    try {
      set(state => ({
        cursors: state.cursors.map(cursor => 
          cursor.userId === currentUser.id
            ? { ...cursor, position, lastSeen: new Date(), isActive: true }
            : cursor
        )
      }));
      
      // Add event
      get().addEvent({
        type: 'cursor_move',
        userId: currentUser.id,
        data: { position }
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error('Erro ao atualizar posição do cursor:', error);
      set({ error: 'Erro ao sincronizar cursor' });
    }
  },
  
  addUserCursor: (cursor: UserCursor) => {
    set(state => ({
      cursors: [...state.cursors.filter(c => c.userId !== cursor.userId), cursor]
    }));
    
    get().addEvent({
      type: 'user_join',
      userId: cursor.userId,
      data: { cursor }
    });
  },
  
  removeUserCursor: (userId: string) => {
    set(state => ({
      cursors: state.cursors.filter(cursor => cursor.userId !== userId)
    }));
    
    get().addEvent({
      type: 'user_leave',
      userId,
      data: {}
    });
  },
  
  updateUserCursor: (userId: string, updates: Partial<UserCursor>) => {
    set(state => ({
      cursors: state.cursors.map(cursor => 
        cursor.userId === userId
          ? { ...cursor, ...updates, lastSeen: new Date() }
          : cursor
      )
    }));
  },
  
  clearInactiveCursors: () => {
    const { config } = get();
    const cutoff = new Date(Date.now() - config.fadeTimeout);
    
    set(state => ({
      cursors: state.cursors.filter(cursor => cursor.lastSeen > cutoff)
    }));
  },
  
  // Selection Management Actions
  updateSelection: async (selection: Partial<Selection>) => {
    const { currentUser, config } = get();
    if (!currentUser || !config.enabled) return;
    
    try {
      const fullSelection: Selection = {
        id: selection.id || `sel_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        elementId: selection.elementId || '',
        elementType: selection.elementType || 'text',
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        bounds: selection.bounds,
        timestamp: new Date(),
        isActive: true,
        ...selection
      };
      
      set(state => ({
        selections: [
          ...state.selections.filter(s => s.userId !== currentUser.id || s.elementId !== fullSelection.elementId),
          fullSelection
        ]
      }));
      
      get().addEvent({
        type: 'selection_change',
        userId: currentUser.id,
        data: { selection: fullSelection }
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error('Erro ao atualizar seleção:', error);
      set({ error: 'Erro ao sincronizar seleção' });
    }
  },
  
  addSelection: (selection: Selection) => {
    set(state => ({
      selections: [
        ...state.selections.filter(s => s.id !== selection.id),
        selection
      ]
    }));
  },
  
  removeSelection: (selectionId: string) => {
    set(state => ({
      selections: state.selections.filter(s => s.id !== selectionId)
    }));
  },
  
  clearUserSelections: (userId: string) => {
    set(state => ({
      selections: state.selections.filter(s => s.userId !== userId)
    }));
  },
  
  clearAllSelections: () => {
    set({ selections: [] });
  },
  
  // Session Management Actions
  createSession: async (projectId: string) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('Usuário não definido');
    
    try {
      set({ isLoading: true, error: null });
      
      const sessionId = `session_${Date.now()}`;
      const session: CollaborationSession = {
        id: sessionId,
        projectId,
        users: [],
        selections: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      set(state => ({
        sessions: [...state.sessions, session],
        isLoading: false
      }));
      
      // Auto-join the session
      await get().joinSession(sessionId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        userAvatar: currentUser.avatar
      });
      
      return sessionId;
    } catch (error) {
      set({ error: 'Erro ao criar sessão', isLoading: false });
      throw error;
    }
  },
  
  joinSession: async (sessionId: string, user: Partial<UserCursor>) => {
    try {
      set({ isLoading: true, error: null });
      
      const cursor: UserCursor = {
        id: `cursor_${user.userId}_${Date.now()}`,
        userId: user.userId || '',
        userName: user.userName || '',
        userColor: user.userColor || '#3B82F6',
        userAvatar: user.userAvatar,
        position: { x: 0, y: 0, timestamp: new Date() },
        isActive: true,
        lastSeen: new Date(),
        sessionId
      };
      
      set(state => ({
        sessions: state.sessions.map(session => 
          session.id === sessionId
            ? {
                ...session,
                users: [...session.users.filter(u => u.userId !== cursor.userId), cursor],
                lastActivity: new Date()
              }
            : session
        ),
        cursors: [...state.cursors.filter(c => c.userId !== cursor.userId), cursor],
        connectionStatus: 'connected',
        isConnected: true,
        isLoading: false
      }));
      
      get().addEvent({
        type: 'user_join',
        userId: cursor.userId,
        data: { sessionId, cursor }
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      set({ error: 'Erro ao entrar na sessão', isLoading: false });
      throw error;
    }
  },
  
  leaveSession: async (sessionId?: string) => {
    const { currentUser, currentSession } = get();
    const targetSessionId = sessionId || currentSession?.id;
    
    if (!currentUser || !targetSessionId) return;
    
    try {
      set({ isLoading: true });
      
      set(state => ({
        sessions: state.sessions.map(session => 
          session.id === targetSessionId
            ? {
                ...session,
                users: session.users.filter(u => u.userId !== currentUser.id),
                lastActivity: new Date()
              }
            : session
        ),
        cursors: state.cursors.filter(c => c.userId !== currentUser.id),
        selections: state.selections.filter(s => s.userId !== currentUser.id),
        connectionStatus: 'disconnected',
        isConnected: false,
        isLoading: false
      }));
      
      get().addEvent({
        type: 'user_leave',
        userId: currentUser.id,
        data: { sessionId: targetSessionId }
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      set({ error: 'Erro ao sair da sessão', isLoading: false });
    }
  },
  
  updateSessionActivity: (sessionId: string) => {
    set(state => ({
      sessions: state.sessions.map(session => 
        session.id === sessionId
          ? { ...session, lastActivity: new Date() }
          : session
      )
    }));
  },
  
  // Event Management Actions
  addEvent: (event: Omit<CursorEvent, 'id' | 'timestamp'>) => {
    const fullEvent: CursorEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };
    
    set(state => ({
      events: [...state.events.slice(-999), fullEvent] // Keep last 1000 events
    }));
  },
  
  clearEvents: () => {
    set({ events: [] });
  },
  
  getEventHistory: (userId?: string, type?: CursorEvent['type']) => {
    const { events } = get();
    return events.filter(event => {
      if (userId && event.userId !== userId) return false;
      if (type && event.type !== type) return false;
      return true;
    });
  },
  
  // Configuration Actions
  updateConfig: (updates: Partial<SyncConfig>) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  // Connection Actions
  connect: async () => {
    try {
      set({ connectionStatus: 'connecting', error: null });
      
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({
        connectionStatus: 'connected',
        isConnected: true,
        lastSync: new Date()
      });
    } catch (error) {
      set({
        connectionStatus: 'error',
        isConnected: false,
        error: 'Erro de conexão'
      });
    }
  },
  
  disconnect: async () => {
    try {
      await get().leaveSession();
      
      set({
        connectionStatus: 'disconnected',
        isConnected: false,
        cursors: [],
        selections: [],
        lastSync: null
      });
    } catch (error) {
      set({ error: 'Erro ao desconectar' });
    }
  },
  
  reconnect: async () => {
    await get().disconnect();
    await get().connect();
  },
  
  // Sync Actions
  syncData: async () => {
    const { isConnected } = get();
    if (!isConnected) return;
    
    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 50));
      
      set({ lastSync: new Date() });
      
      // Update stats
      const { cursors, selections, sessions, events } = get();
      const newStats: CursorStats = {
        totalUsers: cursors.length,
        activeUsers: cursors.filter(c => c.isActive).length,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
        totalEvents: events.length,
        eventsPerSecond: events.filter(e => 
          new Date().getTime() - e.timestamp.getTime() < 1000
        ).length,
        averageLatency: Math.random() * 50 + 10,
        connectionQuality: 'excellent'
      };
      
      set({ stats: newStats });
    } catch (error) {
      set({ error: 'Erro na sincronização' });
    }
  },
  
  forcSync: async () => {
    set({ isLoading: true });
    await get().syncData();
    set({ isLoading: false });
  },
  
  // Utility Actions
  setCurrentUser: (user: CursorSyncStore['currentUser']) => {
    set({ currentUser: user });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  refreshData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate demo data
      const demoCursors: UserCursor[] = [
        {
          id: 'cursor_1',
          userId: 'user_1',
          userName: 'Ana Silva',
          userColor: '#EF4444',
          position: { x: 150, y: 200, timestamp: new Date() },
          isActive: true,
          lastSeen: new Date(),
          sessionId: 'session_1'
        },
        {
          id: 'cursor_2',
          userId: 'user_2',
          userName: 'Carlos Santos',
          userColor: '#10B981',
          position: { x: 300, y: 150, timestamp: new Date() },
          isActive: true,
          lastSeen: new Date(),
          sessionId: 'session_1'
        }
      ];
      
      const demoSelections: Selection[] = [
        {
          id: 'sel_1',
          userId: 'user_1',
          userName: 'Ana Silva',
          userColor: '#EF4444',
          elementId: 'timeline_track_1',
          elementType: 'timeline',
          startOffset: 100,
          endOffset: 200,
          timestamp: new Date(),
          isActive: true
        }
      ];
      
      set({
        cursors: demoCursors,
        selections: demoSelections,
        isLoading: false,
        lastSync: new Date()
      });
    } catch (error) {
      set({ error: 'Erro ao carregar dados', isLoading: false });
    }
  },
  
  clearData: () => {
    set({
      cursors: [],
      selections: [],
      sessions: [],
      events: [],
      stats: defaultStats,
      error: null,
      lastSync: null
    });
  }
})));

// Cursor Sync Manager Class
export class CursorSyncManager {
  private static instance: CursorSyncManager;
  private store = useCursorSyncStore;
  private throttleTimers = new Map<string, NodeJS.Timeout>();
  private animationFrame: number | null = null;
  
  static getInstance(): CursorSyncManager {
    if (!CursorSyncManager.instance) {
      CursorSyncManager.instance = new CursorSyncManager();
    }
    return CursorSyncManager.instance;
  }
  
  // Initialize cursor tracking
  initializeCursorTracking(element: HTMLElement) {
    const handleMouseMove = (event: MouseEvent) => {
      const { config } = this.store.getState();
      if (!config.enabled || !config.showCursors) return;
      
      const rect = element.getBoundingClientRect();
      const position: CursorPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        elementId: element.id,
        elementType: element.tagName.toLowerCase(),
        timestamp: new Date()
      };
      
      this.throttledUpdateCursor(position, config.throttleMs);
    };
    
    const handleMouseEnter = () => {
      const { currentUser } = this.store.getState();
      if (currentUser) {
        this.store.getState().addEvent({
          type: 'cursor_enter',
          userId: currentUser.id,
          data: { elementId: element.id }
        });
      }
    };
    
    const handleMouseLeave = () => {
      const { currentUser } = this.store.getState();
      if (currentUser) {
        this.store.getState().addEvent({
          type: 'cursor_leave',
          userId: currentUser.id,
          data: { elementId: element.id }
        });
      }
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }
  
  // Initialize selection tracking
  initializeSelectionTracking(element: HTMLElement) {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.store.getState().updateSelection({
        elementId: element.id,
        elementType: 'text',
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        bounds: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      });
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }
  
  // Throttled cursor update
  private throttledUpdateCursor(position: CursorPosition, throttleMs: number) {
    const key = 'cursor_update';
    
    if (this.throttleTimers.has(key)) {
      clearTimeout(this.throttleTimers.get(key)!);
    }
    
    const timer = setTimeout(() => {
      this.store.getState().updateCursorPosition(position);
      this.throttleTimers.delete(key);
    }, throttleMs);
    
    this.throttleTimers.set(key, timer);
  }
  
  // Start animation loop
  startAnimationLoop() {
    const animate = () => {
      this.store.getState().clearInactiveCursors();
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  // Stop animation loop
  stopAnimationLoop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  // Cleanup
  cleanup() {
    this.stopAnimationLoop();
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();
  }
}

// Global instance
export const cursorSyncManager = CursorSyncManager.getInstance();

// Utility functions
export const formatLatency = (latency: number): string => {
  if (latency < 50) return `${latency.toFixed(0)}ms`;
  if (latency < 100) return `${latency.toFixed(0)}ms`;
  return `${(latency / 1000).toFixed(1)}s`;
};

export const getUserColor = (userId: string): string => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#C026D3', '#EC4899'
  ];
  
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const getConnectionIcon = (status: CursorSyncStore['connectionStatus']) => {
  switch (status) {
    case 'connected': return '🟢';
    case 'connecting': return '🟡';
    case 'disconnected': return '⚪';
    case 'error': return '🔴';
    default: return '⚪';
  }
};

export const calculateSyncHealth = (metrics: SyncMetrics): number => {
  const latencyScore = Math.max(0, 100 - (metrics.latency / 2));
  const lossScore = Math.max(0, 100 - (metrics.packetsLost * 10));
  const fpsScore = Math.min(100, (metrics.fps / 60) * 100);
  
  return Math.round((latencyScore + lossScore + fpsScore) / 3);
};

export const generateCursorRecommendations = (stats: CursorStats, config: SyncConfig): string[] => {
  const recommendations: string[] = [];
  
  if (stats.activeUsers > config.maxUsers) {
    recommendations.push('Considere aumentar o limite de usuários ou otimizar a performance');
  }
  
  if (stats.averageLatency > 100) {
    recommendations.push('Latência alta detectada - verifique a conexão de rede');
  }
  
  if (stats.eventsPerSecond > 50) {
    recommendations.push('Alto volume de eventos - considere aumentar o throttle');
  }
  
  if (config.throttleMs < 50 && stats.activeUsers > 5) {
    recommendations.push('Aumente o throttle para melhorar a performance com muitos usuários');
  }
  
  return recommendations;
};

// Export default store hook
export default useCursorSyncStore;