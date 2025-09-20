import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: number;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
  selection?: {
    start: number;
    end: number;
    elementId: string;
  };
}

interface CollaborationSession {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  participants: User[];
  isActive: boolean;
  settings: {
    allowAnonymous: boolean;
    maxParticipants: number;
    requireApproval: boolean;
    enableVoiceChat: boolean;
    enableVideoChat: boolean;
    enableScreenShare: boolean;
  };
}

interface Change {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  type: 'insert' | 'delete' | 'update' | 'move' | 'format';
  elementId: string;
  elementType: 'text' | 'image' | 'video' | 'component' | 'style';
  position?: number;
  content?: any;
  previousContent?: any;
  metadata?: Record<string, any>;
}

interface Conflict {
  id: string;
  sessionId: string;
  changes: Change[];
  type: 'concurrent_edit' | 'version_mismatch' | 'permission_denied' | 'data_corruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolving' | 'resolved' | 'failed';
  resolution?: {
    strategy: 'merge' | 'overwrite' | 'manual' | 'rollback';
    resolvedBy: string;
    resolvedAt: number;
    finalContent: any;
  };
  createdAt: number;
}

interface SyncState {
  lastSyncTime: number;
  pendingChanges: Change[];
  conflictingChanges: Change[];
  isOnline: boolean;
  isSyncing: boolean;
  syncErrors: string[];
}

interface CollaborationMetrics {
  totalSessions: number;
  activeSessions: number;
  totalParticipants: number;
  averageSessionDuration: number;
  totalChanges: number;
  totalConflicts: number;
  conflictResolutionRate: number;
  networkLatency: number;
  syncFrequency: number;
  dataTransferred: number;
}

interface CollaborationConfig {
  enableRealTimeSync: boolean;
  syncInterval: number;
  maxRetries: number;
  conflictResolutionStrategy: 'auto' | 'manual' | 'hybrid';
  enablePresenceIndicators: boolean;
  enableCursorTracking: boolean;
  enableVoiceChat: boolean;
  enableVideoChat: boolean;
  enableScreenShare: boolean;
  enableFileSharing: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

interface DebugLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface CollaborationStore {
  // State
  currentUser: User | null;
  sessions: CollaborationSession[];
  activeSession: CollaborationSession | null;
  participants: User[];
  changes: Change[];
  conflicts: Conflict[];
  syncState: SyncState;
  metrics: CollaborationMetrics;
  config: CollaborationConfig;
  debugLogs: DebugLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentUser: (user: User) => void;
  createSession: (session: Omit<CollaborationSession, 'id' | 'createdAt' | 'participants' | 'isActive'>) => Promise<string>;
  joinSession: (sessionId: string, user: User) => Promise<void>;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: User['status']) => void;
  updateUserCursor: (userId: string, cursor: User['cursor']) => void;
  updateUserSelection: (userId: string, selection: User['selection']) => void;
  
  // Change management
  addChange: (change: Omit<Change, 'id' | 'timestamp'>) => Promise<string>;
  applyChange: (changeId: string) => Promise<void>;
  revertChange: (changeId: string) => Promise<void>;
  
  // Conflict resolution
  detectConflicts: () => Promise<Conflict[]>;
  resolveConflict: (conflictId: string, strategy: Conflict['resolution']['strategy'], content?: any) => Promise<void>;
  
  // Sync management
  startSync: () => Promise<void>;
  stopSync: () => void;
  forcSync: () => Promise<void>;
  
  // Configuration
  updateConfig: (updates: Partial<CollaborationConfig>) => void;
  
  // Metrics
  collectMetrics: () => Promise<void>;
  clearMetrics: () => void;
  
  // Debug
  addDebugLog: (level: DebugLog['level'], message: string, data?: any) => void;
  clearDebugLogs: () => void;
  exportData: () => void;
}

const defaultConfig: CollaborationConfig = {
  enableRealTimeSync: true,
  syncInterval: 1000,
  maxRetries: 3,
  conflictResolutionStrategy: 'hybrid',
  enablePresenceIndicators: true,
  enableCursorTracking: true,
  enableVoiceChat: false,
  enableVideoChat: false,
  enableScreenShare: false,
  enableFileSharing: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt']
};

const defaultSyncState: SyncState = {
  lastSyncTime: 0,
  pendingChanges: [],
  conflictingChanges: [],
  isOnline: navigator.onLine,
  isSyncing: false,
  syncErrors: []
};

const defaultMetrics: CollaborationMetrics = {
  totalSessions: 0,
  activeSessions: 0,
  totalParticipants: 0,
  averageSessionDuration: 0,
  totalChanges: 0,
  totalConflicts: 0,
  conflictResolutionRate: 0,
  networkLatency: 0,
  syncFrequency: 0,
  dataTransferred: 0
};

export const useCollaborationStore = create<CollaborationStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  currentUser: null,
  sessions: [],
  activeSession: null,
  participants: [],
  changes: [],
  conflicts: [],
  syncState: defaultSyncState,
  metrics: defaultMetrics,
  config: defaultConfig,
  debugLogs: [],
  isLoading: false,
  error: null,

  // User management
  setCurrentUser: (user) => {
    set({ currentUser: user });
    get().addDebugLog('info', `User set: ${user.name}`);
  },

  // Session management
  createSession: async (sessionData) => {
    try {
      set({ isLoading: true, error: null });
      get().addDebugLog('info', `Creating session: ${sessionData.name}`);
      
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const session: CollaborationSession = {
        ...sessionData,
        id: sessionId,
        createdAt: Date.now(),
        participants: get().currentUser ? [get().currentUser!] : [],
        isActive: true
      };
      
      set(state => ({
        sessions: [...state.sessions, session],
        activeSession: session,
        participants: session.participants
      }));
      
      get().addDebugLog('info', `Session created: ${sessionId}`);
      return sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage });
      get().addDebugLog('error', `Failed to create session: ${errorMessage}`);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  joinSession: async (sessionId, user) => {
    try {
      set({ isLoading: true, error: null });
      get().addDebugLog('info', `User ${user.name} joining session ${sessionId}`);
      
      const session = get().sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.participants.some(p => p.id === user.id)) {
        throw new Error('User already in session');
      }
      
      const updatedSession = {
        ...session,
        participants: [...session.participants, user]
      };
      
      set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
        activeSession: state.activeSession?.id === sessionId ? updatedSession : state.activeSession,
        participants: state.activeSession?.id === sessionId ? updatedSession.participants : state.participants
      }));
      
      get().addDebugLog('info', `User ${user.name} joined session ${sessionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage });
      get().addDebugLog('error', `Failed to join session: ${errorMessage}`);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  leaveSession: async (sessionId, userId) => {
    try {
      get().addDebugLog('info', `User ${userId} leaving session ${sessionId}`);
      
      const session = get().sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      const updatedSession = {
        ...session,
        participants: session.participants.filter(p => p.id !== userId)
      };
      
      set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
        activeSession: state.activeSession?.id === sessionId ? updatedSession : state.activeSession,
        participants: state.activeSession?.id === sessionId ? updatedSession.participants : state.participants
      }));
      
      get().addDebugLog('info', `User ${userId} left session ${sessionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to leave session: ${errorMessage}`);
    }
  },

  updateUserStatus: (userId, status) => {
    set(state => ({
      participants: state.participants.map(p => 
        p.id === userId ? { ...p, status, lastSeen: Date.now() } : p
      )
    }));
  },

  updateUserCursor: (userId, cursor) => {
    set(state => ({
      participants: state.participants.map(p => 
        p.id === userId ? { ...p, cursor } : p
      )
    }));
  },

  updateUserSelection: (userId, selection) => {
    set(state => ({
      participants: state.participants.map(p => 
        p.id === userId ? { ...p, selection } : p
      )
    }));
  },

  // Change management
  addChange: async (changeData) => {
    try {
      const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const change: Change = {
        ...changeData,
        id: changeId,
        timestamp: Date.now()
      };
      
      set(state => ({
        changes: [...state.changes, change],
        syncState: {
          ...state.syncState,
          pendingChanges: [...state.syncState.pendingChanges, change]
        }
      }));
      
      get().addDebugLog('info', `Change added: ${change.type} on ${change.elementId}`);
      
      // Auto-detect conflicts
      await get().detectConflicts();
      
      return changeId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to add change: ${errorMessage}`);
      throw error;
    }
  },

  applyChange: async (changeId) => {
    try {
      const change = get().changes.find(c => c.id === changeId);
      if (!change) throw new Error('Change not found');
      
      get().addDebugLog('info', `Applying change: ${changeId}`);
      
      // Simulate applying change
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set(state => ({
        syncState: {
          ...state.syncState,
          pendingChanges: state.syncState.pendingChanges.filter(c => c.id !== changeId)
        }
      }));
      
      get().addDebugLog('info', `Change applied: ${changeId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to apply change: ${errorMessage}`);
      throw error;
    }
  },

  revertChange: async (changeId) => {
    try {
      const change = get().changes.find(c => c.id === changeId);
      if (!change) throw new Error('Change not found');
      
      get().addDebugLog('info', `Reverting change: ${changeId}`);
      
      // Simulate reverting change
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set(state => ({
        changes: state.changes.filter(c => c.id !== changeId),
        syncState: {
          ...state.syncState,
          pendingChanges: state.syncState.pendingChanges.filter(c => c.id !== changeId)
        }
      }));
      
      get().addDebugLog('info', `Change reverted: ${changeId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to revert change: ${errorMessage}`);
      throw error;
    }
  },

  // Conflict detection and resolution
  detectConflicts: async () => {
    try {
      const { changes, activeSession } = get();
      if (!activeSession) return [];
      
      const conflicts: Conflict[] = [];
      const changesByElement = new Map<string, Change[]>();
      
      // Group changes by element
      changes.forEach(change => {
        const key = change.elementId;
        if (!changesByElement.has(key)) {
          changesByElement.set(key, []);
        }
        changesByElement.get(key)!.push(change);
      });
      
      // Detect concurrent edits
      changesByElement.forEach((elementChanges, elementId) => {
        const recentChanges = elementChanges.filter(c => 
          Date.now() - c.timestamp < 5000 // Last 5 seconds
        );
        
        if (recentChanges.length > 1) {
          const uniqueUsers = new Set(recentChanges.map(c => c.userId));
          if (uniqueUsers.size > 1) {
            const conflictId = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            conflicts.push({
              id: conflictId,
              sessionId: activeSession.id,
              changes: recentChanges,
              type: 'concurrent_edit',
              severity: 'medium',
              status: 'pending',
              createdAt: Date.now()
            });
          }
        }
      });
      
      if (conflicts.length > 0) {
        set(state => ({
          conflicts: [...state.conflicts, ...conflicts]
        }));
        
        get().addDebugLog('warn', `${conflicts.length} conflicts detected`);
      }
      
      return conflicts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to detect conflicts: ${errorMessage}`);
      return [];
    }
  },

  resolveConflict: async (conflictId, strategy, content) => {
    try {
      get().addDebugLog('info', `Resolving conflict ${conflictId} with strategy: ${strategy}`);
      
      const conflict = get().conflicts.find(c => c.id === conflictId);
      if (!conflict) throw new Error('Conflict not found');
      
      // Simulate conflict resolution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const resolution = {
        strategy,
        resolvedBy: get().currentUser?.id || 'system',
        resolvedAt: Date.now(),
        finalContent: content || conflict.changes[0].content
      };
      
      set(state => ({
        conflicts: state.conflicts.map(c => 
          c.id === conflictId 
            ? { ...c, status: 'resolved' as const, resolution }
            : c
        )
      }));
      
      get().addDebugLog('info', `Conflict ${conflictId} resolved`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to resolve conflict: ${errorMessage}`);
      throw error;
    }
  },

  // Sync management
  startSync: async () => {
    try {
      get().addDebugLog('info', 'Starting real-time sync');
      
      set(state => ({
        syncState: { ...state.syncState, isSyncing: true }
      }));
      
      // Simulate sync process
      const syncInterval = setInterval(async () => {
        const { syncState, config } = get();
        if (!syncState.isSyncing) {
          clearInterval(syncInterval);
          return;
        }
        
        try {
          // Sync pending changes
          if (syncState.pendingChanges.length > 0) {
            get().addDebugLog('debug', `Syncing ${syncState.pendingChanges.length} pending changes`);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            set(state => ({
              syncState: {
                ...state.syncState,
                lastSyncTime: Date.now(),
                pendingChanges: []
              }
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync error';
          set(state => ({
            syncState: {
              ...state.syncState,
              syncErrors: [...state.syncState.syncErrors, errorMessage]
            }
          }));
          get().addDebugLog('error', `Sync error: ${errorMessage}`);
        }
      }, config.syncInterval);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to start sync: ${errorMessage}`);
      throw error;
    }
  },

  stopSync: () => {
    get().addDebugLog('info', 'Stopping real-time sync');
    set(state => ({
      syncState: { ...state.syncState, isSyncing: false }
    }));
  },

  forcSync: async () => {
    try {
      get().addDebugLog('info', 'Force syncing all changes');
      
      // Simulate force sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set(state => ({
        syncState: {
          ...state.syncState,
          lastSyncTime: Date.now(),
          pendingChanges: [],
          syncErrors: []
        }
      }));
      
      get().addDebugLog('info', 'Force sync completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Force sync failed: ${errorMessage}`);
      throw error;
    }
  },

  // Configuration
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
    get().addDebugLog('info', 'Configuration updated', updates);
  },

  // Metrics
  collectMetrics: async () => {
    try {
      const { sessions, participants, changes, conflicts } = get();
      
      const activeSessions = sessions.filter(s => s.isActive).length;
      const totalConflicts = conflicts.length;
      const resolvedConflicts = conflicts.filter(c => c.status === 'resolved').length;
      
      const metrics: CollaborationMetrics = {
        totalSessions: sessions.length,
        activeSessions,
        totalParticipants: participants.length,
        averageSessionDuration: sessions.length > 0 
          ? sessions.reduce((acc, s) => acc + (Date.now() - s.createdAt), 0) / sessions.length 
          : 0,
        totalChanges: changes.length,
        totalConflicts,
        conflictResolutionRate: totalConflicts > 0 ? resolvedConflicts / totalConflicts : 1,
        networkLatency: Math.random() * 100 + 50, // 50-150ms
        syncFrequency: Math.random() * 10 + 5, // 5-15 syncs/min
        dataTransferred: Math.random() * 1000000 + 500000 // 0.5-1.5MB
      };
      
      set({ metrics });
      get().addDebugLog('info', 'Metrics collected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().addDebugLog('error', `Failed to collect metrics: ${errorMessage}`);
    }
  },

  clearMetrics: () => {
    set({ metrics: defaultMetrics });
    get().addDebugLog('info', 'Metrics cleared');
  },

  // Debug
  addDebugLog: (level, message, data) => {
    const log: DebugLog = {
      timestamp: Date.now(),
      level,
      message,
      data
    };
    
    set(state => ({
      debugLogs: [...state.debugLogs.slice(-99), log] // Keep last 100 logs
    }));
  },

  clearDebugLogs: () => {
    set({ debugLogs: [] });
    get().addDebugLog('info', 'Debug logs cleared');
  },

  exportData: () => {
    const state = get();
    const data = {
      sessions: state.sessions,
      changes: state.changes,
      conflicts: state.conflicts,
      metrics: state.metrics,
      config: state.config,
      debugLogs: state.debugLogs,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collaboration-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    get().addDebugLog('info', 'Collaboration data exported');
  }
})));

// Collaboration Manager Class
export class CollaborationManager {
  private store = useCollaborationStore;
  private syncInterval?: NodeJS.Timeout;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    try {
      this.store.getState().addDebugLog('info', 'Initializing Collaboration Manager');
      
      // Set up online/offline detection
      window.addEventListener('online', () => {
        this.store.setState(state => ({
          syncState: { ...state.syncState, isOnline: true }
        }));
        this.store.getState().addDebugLog('info', 'Connection restored');
      });
      
      window.addEventListener('offline', () => {
        this.store.setState(state => ({
          syncState: { ...state.syncState, isOnline: false }
        }));
        this.store.getState().addDebugLog('warn', 'Connection lost');
      });
      
      // Start metrics collection
      setInterval(() => {
        this.store.getState().collectMetrics();
      }, 30000); // Every 30 seconds
      
      this.store.getState().addDebugLog('info', 'Collaboration Manager initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.store.getState().addDebugLog('error', `Initialization failed: ${errorMessage}`);
    }
  }
  
  public getStore() {
    return this.store;
  }
}

// Global instance
export const collaborationManager = new CollaborationManager();

// Utility functions
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStatusColor = (status: User['status']): string => {
  switch (status) {
    case 'online': return 'text-green-500';
    case 'away': return 'text-yellow-500';
    case 'busy': return 'text-red-500';
    case 'offline': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

export const getConflictSeverityColor = (severity: Conflict['severity']): string => {
  switch (severity) {
    case 'low': return 'text-blue-500';
    case 'medium': return 'text-yellow-500';
    case 'high': return 'text-orange-500';
    case 'critical': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

export const getConflictStatusIcon = (status: Conflict['status']): string => {
  switch (status) {
    case 'pending': return 'Clock';
    case 'resolving': return 'Loader';
    case 'resolved': return 'CheckCircle';
    case 'failed': return 'XCircle';
    default: return 'AlertCircle';
  }
};

export default useCollaborationStore;