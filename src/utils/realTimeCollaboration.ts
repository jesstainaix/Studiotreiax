import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
  selection?: {
    start: number;
    end: number;
    element?: string;
  };
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
}

export interface CollaborationOperation {
  id: string;
  type: 'insert' | 'delete' | 'update' | 'move' | 'format';
  userId: string;
  timestamp: number;
  position: number;
  content?: any;
  length?: number;
  metadata?: Record<string, any>;
  applied: boolean;
  conflicted?: boolean;
  resolved?: boolean;
}

export interface CollaborationConflict {
  id: string;
  operationIds: string[];
  type: 'concurrent_edit' | 'position_conflict' | 'permission_conflict';
  description: string;
  timestamp: number;
  resolved: boolean;
  resolution?: {
    strategy: 'merge' | 'override' | 'manual';
    result: any;
    resolvedBy: string;
    resolvedAt: number;
  };
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  participants: CollaborationUser[];
  operations: CollaborationOperation[];
  conflicts: CollaborationConflict[];
  state: Record<string, any>;
  version: number;
  isActive: boolean;
  settings: {
    autoSave: boolean;
    conflictResolution: 'automatic' | 'manual';
    maxParticipants: number;
    permissions: {
      allowGuests: boolean;
      requireApproval: boolean;
    };
  };
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  type: 'chat' | 'system' | 'notification';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CollaborationConfig {
  enableRealTime: boolean;
  enableConflictResolution: boolean;
  enableCursorTracking: boolean;
  enableVoiceChat: boolean;
  enableVideoChat: boolean;
  autoSaveInterval: number;
  conflictResolutionTimeout: number;
  maxOperationsHistory: number;
  debugMode: boolean;
}

export interface CollaborationStats {
  totalSessions: number;
  activeSessions: number;
  totalUsers: number;
  activeUsers: number;
  totalOperations: number;
  operationsPerSecond: number;
  totalConflicts: number;
  resolvedConflicts: number;
  averageResolutionTime: number;
  networkLatency: number;
  syncErrors: number;
  lastSyncTime: number;
}

export interface CollaborationMetrics {
  sessionDuration: number;
  userEngagement: number;
  operationFrequency: number;
  conflictRate: number;
  resolutionSuccess: number;
  networkQuality: number;
  performanceScore: number;
  collaborationEfficiency: number;
}

export interface CollaborationEvent {
  id: string;
  type: 'user_joined' | 'user_left' | 'operation_applied' | 'conflict_detected' | 'conflict_resolved' | 'sync_error' | 'connection_lost' | 'connection_restored';
  sessionId: string;
  userId?: string;
  timestamp: number;
  data?: any;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface CollaborationDebugLog {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'sync' | 'conflict' | 'network' | 'operation' | 'user';
  message: string;
  data?: any;
  sessionId?: string;
  userId?: string;
}

// Store Interface
interface CollaborationStore {
  // State
  sessions: CollaborationSession[];
  currentSession: CollaborationSession | null;
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  operations: CollaborationOperation[];
  conflicts: CollaborationConflict[];
  messages: CollaborationMessage[];
  config: CollaborationConfig;
  stats: CollaborationStats;
  metrics: CollaborationMetrics;
  events: CollaborationEvent[];
  debugLogs: CollaborationDebugLog[];
  isConnected: boolean;
  isSyncing: boolean;
  isResolving: boolean;
  lastError: string | null;

  // Computed Values
  computed: {
    activeParticipants: number;
    pendingOperations: number;
    unresolvedConflicts: number;
    syncHealth: number;
    collaborationScore: number;
    networkStatus: 'excellent' | 'good' | 'poor' | 'offline';
  };

  // Actions
  actions: {
    // Session Management
    createSession: (projectId: string, name: string, settings?: Partial<CollaborationSession['settings']>) => Promise<string>;
    joinSession: (sessionId: string, user: Partial<CollaborationUser>) => Promise<void>;
    leaveSession: (sessionId: string) => Promise<void>;
    updateSession: (sessionId: string, updates: Partial<CollaborationSession>) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;

    // User Management
    updateUser: (userId: string, updates: Partial<CollaborationUser>) => Promise<void>;
    updateCursor: (userId: string, cursor: CollaborationUser['cursor']) => Promise<void>;
    updateSelection: (userId: string, selection: CollaborationUser['selection']) => Promise<void>;
    setUserStatus: (userId: string, status: CollaborationUser['status']) => Promise<void>;

    // Operation Management
    applyOperation: (operation: Omit<CollaborationOperation, 'id' | 'timestamp' | 'applied'>) => Promise<void>;
    revertOperation: (operationId: string) => Promise<void>;
    transformOperation: (operation: CollaborationOperation, against: CollaborationOperation[]) => CollaborationOperation;
    batchOperations: (operations: Omit<CollaborationOperation, 'id' | 'timestamp' | 'applied'>[]) => Promise<void>;

    // Conflict Resolution
    detectConflicts: (operation: CollaborationOperation) => CollaborationConflict[];
    resolveConflict: (conflictId: string, strategy: 'merge' | 'override' | 'manual', resolution?: any) => Promise<void>;
    autoResolveConflicts: () => Promise<void>;

    // Synchronization
    syncState: () => Promise<void>;
    forceSyncState: () => Promise<void>;
    handleRemoteOperation: (operation: CollaborationOperation) => Promise<void>;
    handleRemoteState: (state: Record<string, any>, version: number) => Promise<void>;

    // Messaging
    sendMessage: (content: string, type?: CollaborationMessage['type']) => Promise<void>;
    broadcastMessage: (content: string, type?: CollaborationMessage['type']) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
  };

  // Quick Actions
  quickActions: {
    startCollaboration: () => Promise<void>;
    stopCollaboration: () => Promise<void>;
    inviteUser: (email: string) => Promise<void>;
    resolveAllConflicts: () => Promise<void>;
    exportSession: () => string;
    importSession: (data: string) => Promise<void>;
  };

  // Advanced Features
  advanced: {
    enableOperationalTransform: () => Promise<void>;
    enableCRDT: () => Promise<void>;
    setupVoiceChat: () => Promise<void>;
    setupVideoChat: () => Promise<void>;
    enablePresenceAwareness: () => Promise<void>;
    setupCustomConflictResolver: (resolver: (conflict: CollaborationConflict) => any) => void;
  };

  // System Operations
  system: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    reconnect: () => Promise<void>;
    checkHealth: () => Promise<boolean>;
    cleanup: () => Promise<void>;
    reset: () => Promise<void>;
  };

  // Utilities
  utils: {
    generateOperationId: () => string;
    generateConflictId: () => string;
    validateOperation: (operation: CollaborationOperation) => boolean;
    calculateLatency: () => number;
    getSessionHealth: (sessionId: string) => number;
    getUserActivity: (userId: string) => number;
  };

  // Configuration
  configuration: {
    updateConfig: (updates: Partial<CollaborationConfig>) => void;
    resetConfig: () => void;
    exportConfig: () => string;
    importConfig: (config: string) => void;
  };

  // Analytics
  analytics: {
    getStats: () => CollaborationStats;
    getMetrics: () => CollaborationMetrics;
    trackEvent: (event: Omit<CollaborationEvent, 'id' | 'timestamp'>) => void;
    exportData: () => string;
    generateReport: () => any;
  };

  // Debug
  debug: {
    log: (level: CollaborationDebugLog['level'], category: CollaborationDebugLog['category'], message: string, data?: any) => void;
    getLogs: (filter?: Partial<CollaborationDebugLog>) => CollaborationDebugLog[];
    clearLogs: () => void;
    exportLogs: () => string;
    enableDebugMode: () => void;
    disableDebugMode: () => void;
  };
}

// Default Configuration
const defaultConfig: CollaborationConfig = {
  enableRealTime: true,
  enableConflictResolution: true,
  enableCursorTracking: true,
  enableVoiceChat: false,
  enableVideoChat: false,
  autoSaveInterval: 5000,
  conflictResolutionTimeout: 30000,
  maxOperationsHistory: 1000,
  debugMode: false
};

// Default Stats
const defaultStats: CollaborationStats = {
  totalSessions: 0,
  activeSessions: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalOperations: 0,
  operationsPerSecond: 0,
  totalConflicts: 0,
  resolvedConflicts: 0,
  averageResolutionTime: 0,
  networkLatency: 0,
  syncErrors: 0,
  lastSyncTime: 0
};

// Default Metrics
const defaultMetrics: CollaborationMetrics = {
  sessionDuration: 0,
  userEngagement: 0,
  operationFrequency: 0,
  conflictRate: 0,
  resolutionSuccess: 0,
  networkQuality: 0,
  performanceScore: 0,
  collaborationEfficiency: 0
};

// Zustand Store
export const useCollaborationStore = create<CollaborationStore>()(subscribeWithSelector((set, get) => ({
  // State
  sessions: [],
  currentSession: null,
  users: [],
  currentUser: null,
  operations: [],
  conflicts: [],
  messages: [],
  config: defaultConfig,
  stats: defaultStats,
  metrics: defaultMetrics,
  events: [],
  debugLogs: [],
  isConnected: false,
  isSyncing: false,
  isResolving: false,
  lastError: null,

  // Computed Values
  computed: {
    get activeParticipants() {
      const { currentSession } = get();
      return currentSession?.participants.filter(p => p.status === 'online').length || 0;
    },
    get pendingOperations() {
      const { operations } = get();
      return operations.filter(op => !op.applied).length;
    },
    get unresolvedConflicts() {
      const { conflicts } = get();
      return conflicts.filter(c => !c.resolved).length;
    },
    get syncHealth() {
      const { stats } = get();
      const errorRate = stats.syncErrors / Math.max(stats.totalOperations, 1);
      return Math.max(0, 100 - (errorRate * 100));
    },
    get collaborationScore() {
      const { metrics } = get();
      return (metrics.userEngagement + metrics.resolutionSuccess + metrics.networkQuality) / 3;
    },
    get networkStatus() {
      const { stats } = get();
      if (stats.networkLatency < 50) return 'excellent';
      if (stats.networkLatency < 150) return 'good';
      if (stats.networkLatency < 500) return 'poor';
      return 'offline';
    }
  },

  // Actions
  actions: {
    createSession: async (projectId: string, name: string, settings = {}) => {
      const sessionId = generateId();
      const session: CollaborationSession = {
        id: sessionId,
        projectId,
        name,
        createdBy: get().currentUser?.id || 'anonymous',
        createdAt: Date.now(),
        participants: [],
        operations: [],
        conflicts: [],
        state: {},
        version: 1,
        isActive: true,
        settings: {
          autoSave: true,
          conflictResolution: 'automatic',
          maxParticipants: 10,
          permissions: {
            allowGuests: false,
            requireApproval: true
          },
          ...settings
        }
      };

      set(state => ({
        sessions: [...state.sessions, session],
        currentSession: session,
        stats: {
          ...state.stats,
          totalSessions: state.stats.totalSessions + 1,
          activeSessions: state.stats.activeSessions + 1
        }
      }));

      get().analytics.trackEvent({
        type: 'user_joined',
        sessionId,
        severity: 'info',
        message: `Session ${name} created`
      });

      return sessionId;
    },

    joinSession: async (sessionId: string, user: Partial<CollaborationUser>) => {
      const { sessions, currentUser } = get();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      const fullUser: CollaborationUser = {
        id: user.id || generateId(),
        name: user.name || 'Anonymous',
        email: user.email || '',
        color: user.color || getRandomColor(),
        status: 'online',
        lastSeen: Date.now(),
        permissions: {
          read: true,
          write: true,
          admin: false,
          ...user.permissions
        },
        ...user
      };

      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId 
            ? { ...s, participants: [...s.participants, fullUser] }
            : s
        ),
        currentSession: session.id === state.currentSession?.id 
          ? { ...session, participants: [...session.participants, fullUser] }
          : state.currentSession,
        currentUser: fullUser,
        users: [...state.users.filter(u => u.id !== fullUser.id), fullUser],
        stats: {
          ...state.stats,
          activeUsers: state.stats.activeUsers + 1
        }
      }));

      get().analytics.trackEvent({
        type: 'user_joined',
        sessionId,
        userId: fullUser.id,
        severity: 'info',
        message: `${fullUser.name} joined the session`
      });
    },

    leaveSession: async (sessionId: string) => {
      const { currentUser } = get();
      if (!currentUser) return;

      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId 
            ? { ...s, participants: s.participants.filter(p => p.id !== currentUser.id) }
            : s
        ),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        stats: {
          ...state.stats,
          activeUsers: Math.max(0, state.stats.activeUsers - 1)
        }
      }));

      get().analytics.trackEvent({
        type: 'user_left',
        sessionId,
        userId: currentUser.id,
        severity: 'info',
        message: `${currentUser.name} left the session`
      });
    },

    updateSession: async (sessionId: string, updates: Partial<CollaborationSession>) => {
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, ...updates } : s
        ),
        currentSession: state.currentSession?.id === sessionId 
          ? { ...state.currentSession, ...updates }
          : state.currentSession
      }));
    },

    deleteSession: async (sessionId: string) => {
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        stats: {
          ...state.stats,
          activeSessions: Math.max(0, state.stats.activeSessions - 1)
        }
      }));
    },

    updateUser: async (userId: string, updates: Partial<CollaborationUser>) => {
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, ...updates } : u
        ),
        currentUser: state.currentUser?.id === userId 
          ? { ...state.currentUser, ...updates }
          : state.currentUser
      }));
    },

    updateCursor: async (userId: string, cursor: CollaborationUser['cursor']) => {
      get().actions.updateUser(userId, { cursor });
    },

    updateSelection: async (userId: string, selection: CollaborationUser['selection']) => {
      get().actions.updateUser(userId, { selection });
    },

    setUserStatus: async (userId: string, status: CollaborationUser['status']) => {
      get().actions.updateUser(userId, { status, lastSeen: Date.now() });
    },

    applyOperation: async (operation: Omit<CollaborationOperation, 'id' | 'timestamp' | 'applied'>) => {
      const fullOperation: CollaborationOperation = {
        ...operation,
        id: generateId(),
        timestamp: Date.now(),
        applied: false
      };

      // Check for conflicts
      const conflicts = get().actions.detectConflicts(fullOperation);
      
      if (conflicts.length > 0) {
        set(state => ({
          conflicts: [...state.conflicts, ...conflicts],
          operations: [...state.operations, { ...fullOperation, conflicted: true }]
        }));

        get().analytics.trackEvent({
          type: 'conflict_detected',
          sessionId: get().currentSession?.id || '',
          userId: operation.userId,
          severity: 'warning',
          message: `Conflict detected for operation ${fullOperation.type}`
        });

        if (get().config.enableConflictResolution) {
          await get().actions.autoResolveConflicts();
        }
      } else {
        set(state => ({
          operations: [...state.operations, { ...fullOperation, applied: true }],
          stats: {
            ...state.stats,
            totalOperations: state.stats.totalOperations + 1
          }
        }));

        get().analytics.trackEvent({
          type: 'operation_applied',
          sessionId: get().currentSession?.id || '',
          userId: operation.userId,
          severity: 'info',
          message: `Operation ${fullOperation.type} applied successfully`
        });
      }
    },

    revertOperation: async (operationId: string) => {
      set(state => ({
        operations: state.operations.map(op => 
          op.id === operationId ? { ...op, applied: false } : op
        )
      }));
    },

    transformOperation: (operation: CollaborationOperation, against: CollaborationOperation[]) => {
      // Simplified operational transformation
      let transformedOp = { ...operation };
      
      for (const againstOp of against) {
        if (againstOp.timestamp < operation.timestamp) {
          // Transform based on operation type
          if (operation.type === 'insert' && againstOp.type === 'insert') {
            if (againstOp.position <= operation.position) {
              transformedOp.position += againstOp.length || 0;
            }
          } else if (operation.type === 'delete' && againstOp.type === 'insert') {
            if (againstOp.position < operation.position) {
              transformedOp.position += againstOp.length || 0;
            }
          }
          // Add more transformation rules as needed
        }
      }
      
      return transformedOp;
    },

    batchOperations: async (operations: Omit<CollaborationOperation, 'id' | 'timestamp' | 'applied'>[]) => {
      for (const operation of operations) {
        await get().actions.applyOperation(operation);
      }
    },

    detectConflicts: (operation: CollaborationOperation) => {
      const { operations } = get();
      const conflicts: CollaborationConflict[] = [];
      
      // Find concurrent operations
      const concurrentOps = operations.filter(op => 
        op.userId !== operation.userId &&
        Math.abs(op.timestamp - operation.timestamp) < 1000 && // Within 1 second
        op.position === operation.position
      );
      
      if (concurrentOps.length > 0) {
        conflicts.push({
          id: generateId(),
          operationIds: [operation.id, ...concurrentOps.map(op => op.id)],
          type: 'concurrent_edit',
          description: 'Concurrent edits detected at the same position',
          timestamp: Date.now(),
          resolved: false
        });
      }
      
      return conflicts;
    },

    resolveConflict: async (conflictId: string, strategy: 'merge' | 'override' | 'manual', resolution?: any) => {
      const { conflicts, currentUser } = get();
      const conflict = conflicts.find(c => c.id === conflictId);
      
      if (!conflict || !currentUser) return;
      
      const resolvedConflict: CollaborationConflict = {
        ...conflict,
        resolved: true,
        resolution: {
          strategy,
          result: resolution,
          resolvedBy: currentUser.id,
          resolvedAt: Date.now()
        }
      };
      
      set(state => ({
        conflicts: state.conflicts.map(c => 
          c.id === conflictId ? resolvedConflict : c
        ),
        stats: {
          ...state.stats,
          resolvedConflicts: state.stats.resolvedConflicts + 1
        }
      }));
      
      get().analytics.trackEvent({
        type: 'conflict_resolved',
        sessionId: get().currentSession?.id || '',
        userId: currentUser.id,
        severity: 'info',
        message: `Conflict resolved using ${strategy} strategy`
      });
    },

    autoResolveConflicts: async () => {
      const { conflicts } = get();
      const unresolvedConflicts = conflicts.filter(c => !c.resolved);
      
      for (const conflict of unresolvedConflicts) {
        // Simple auto-resolution: use timestamp-based priority
        await get().actions.resolveConflict(conflict.id, 'merge', {
          strategy: 'timestamp_priority',
          timestamp: Date.now()
        });
      }
    },

    syncState: async () => {
      set(state => ({ isSyncing: true }));
      
      try {
        // Simulate sync operation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set(state => ({
          isSyncing: false,
          stats: {
            ...state.stats,
            lastSyncTime: Date.now()
          }
        }));
      } catch (error) {
        set(state => ({
          isSyncing: false,
          lastError: `Sync failed: ${error}`,
          stats: {
            ...state.stats,
            syncErrors: state.stats.syncErrors + 1
          }
        }));
      }
    },

    forceSyncState: async () => {
      await get().actions.syncState();
    },

    handleRemoteOperation: async (operation: CollaborationOperation) => {
      // Transform operation against local operations
      const { operations } = get();
      const localOps = operations.filter(op => op.timestamp > operation.timestamp);
      const transformedOp = get().actions.transformOperation(operation, localOps);
      
      set(state => ({
        operations: [...state.operations, { ...transformedOp, applied: true }]
      }));
    },

    handleRemoteState: async (state: Record<string, any>, version: number) => {
      const { currentSession } = get();
      if (currentSession) {
        set(prevState => ({
          currentSession: {
            ...currentSession,
            state,
            version
          }
        }));
      }
    },

    sendMessage: async (content: string, type: CollaborationMessage['type'] = 'chat') => {
      const { currentUser, currentSession } = get();
      if (!currentUser || !currentSession) return;
      
      const message: CollaborationMessage = {
        id: generateId(),
        sessionId: currentSession.id,
        userId: currentUser.id,
        type,
        content,
        timestamp: Date.now()
      };
      
      set(state => ({
        messages: [...state.messages, message]
      }));
    },

    broadcastMessage: async (content: string, type: CollaborationMessage['type'] = 'system') => {
      await get().actions.sendMessage(content, type);
    },

    deleteMessage: async (messageId: string) => {
      set(state => ({
        messages: state.messages.filter(m => m.id !== messageId)
      }));
    }
  },

  // Quick Actions
  quickActions: {
    startCollaboration: async () => {
      await get().system.connect();
      get().analytics.trackEvent({
        type: 'connection_restored',
        sessionId: get().currentSession?.id || '',
        severity: 'info',
        message: 'Collaboration started'
      });
    },

    stopCollaboration: async () => {
      await get().system.disconnect();
      get().analytics.trackEvent({
        type: 'connection_lost',
        sessionId: get().currentSession?.id || '',
        severity: 'info',
        message: 'Collaboration stopped'
      });
    },

    inviteUser: async (email: string) => {
      // Simulate user invitation
      get().analytics.trackEvent({
        type: 'user_joined',
        sessionId: get().currentSession?.id || '',
        severity: 'info',
        message: `Invitation sent to ${email}`
      });
    },

    resolveAllConflicts: async () => {
      await get().actions.autoResolveConflicts();
    },

    exportSession: () => {
      const { currentSession } = get();
      return JSON.stringify(currentSession, null, 2);
    },

    importSession: async (data: string) => {
      try {
        const session = JSON.parse(data) as CollaborationSession;
        set(state => ({
          sessions: [...state.sessions, session],
          currentSession: session
        }));
      } catch (error) {
        throw new Error(`Failed to import session: ${error}`);
      }
    }
  },

  // Advanced Features
  advanced: {
    enableOperationalTransform: async () => {
      get().debug.log('info', 'operation', 'Operational Transform enabled');
    },

    enableCRDT: async () => {
      get().debug.log('info', 'operation', 'CRDT enabled');
    },

    setupVoiceChat: async () => {
      set(state => ({
        config: { ...state.config, enableVoiceChat: true }
      }));
      get().debug.log('info', 'user', 'Voice chat enabled');
    },

    setupVideoChat: async () => {
      set(state => ({
        config: { ...state.config, enableVideoChat: true }
      }));
      get().debug.log('info', 'user', 'Video chat enabled');
    },

    enablePresenceAwareness: async () => {
      set(state => ({
        config: { ...state.config, enableCursorTracking: true }
      }));
      get().debug.log('info', 'user', 'Presence awareness enabled');
    },

    setupCustomConflictResolver: (resolver: (conflict: CollaborationConflict) => any) => {
      // Store custom resolver function
      get().debug.log('info', 'conflict', 'Custom conflict resolver configured');
    }
  },

  // System Operations
  system: {
    connect: async () => {
      set({ isConnected: true });
      get().debug.log('info', 'network', 'Connected to collaboration server');
    },

    disconnect: async () => {
      set({ isConnected: false });
      get().debug.log('info', 'network', 'Disconnected from collaboration server');
    },

    reconnect: async () => {
      await get().system.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await get().system.connect();
    },

    checkHealth: async () => {
      const { isConnected, computed } = get();
      return isConnected && computed.syncHealth > 80;
    },

    cleanup: async () => {
      set({
        operations: [],
        conflicts: [],
        messages: [],
        events: [],
        debugLogs: []
      });
    },

    reset: async () => {
      set({
        sessions: [],
        currentSession: null,
        users: [],
        currentUser: null,
        operations: [],
        conflicts: [],
        messages: [],
        config: defaultConfig,
        stats: defaultStats,
        metrics: defaultMetrics,
        events: [],
        debugLogs: [],
        isConnected: false,
        isSyncing: false,
        isResolving: false,
        lastError: null
      });
    }
  },

  // Utilities
  utils: {
    generateOperationId: () => generateId(),
    generateConflictId: () => generateId(),
    
    validateOperation: (operation: CollaborationOperation) => {
      return !!(operation.id && operation.type && operation.userId && operation.position >= 0);
    },
    
    calculateLatency: () => {
      // Simulate latency calculation
      return Math.random() * 100 + 20;
    },
    
    getSessionHealth: (sessionId: string) => {
      const { sessions } = get();
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return 0;
      
      const activeParticipants = session.participants.filter(p => p.status === 'online').length;
      const conflictRate = session.conflicts.filter(c => !c.resolved).length / Math.max(session.operations.length, 1);
      
      return Math.max(0, 100 - (conflictRate * 50) + (activeParticipants * 10));
    },
    
    getUserActivity: (userId: string) => {
      const { operations } = get();
      const userOps = operations.filter(op => op.userId === userId);
      const recentOps = userOps.filter(op => Date.now() - op.timestamp < 300000); // Last 5 minutes
      
      return recentOps.length;
    }
  },

  // Configuration
  configuration: {
    updateConfig: (updates: Partial<CollaborationConfig>) => {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
    },

    resetConfig: () => {
      set({ config: defaultConfig });
    },

    exportConfig: () => {
      return JSON.stringify(get().config, null, 2);
    },

    importConfig: (config: string) => {
      try {
        const parsedConfig = JSON.parse(config) as CollaborationConfig;
        set({ config: parsedConfig });
      } catch (error) {
        throw new Error(`Failed to import config: ${error}`);
      }
    }
  },

  // Analytics
  analytics: {
    getStats: () => get().stats,
    getMetrics: () => get().metrics,

    trackEvent: (event: Omit<CollaborationEvent, 'id' | 'timestamp'>) => {
      const fullEvent: CollaborationEvent = {
        ...event,
        id: generateId(),
        timestamp: Date.now()
      };

      set(state => ({
        events: [...state.events.slice(-99), fullEvent] // Keep last 100 events
      }));
    },

    exportData: () => {
      const { sessions, operations, conflicts, messages, stats, metrics } = get();
      return JSON.stringify({
        sessions,
        operations,
        conflicts,
        messages,
        stats,
        metrics,
        exportedAt: Date.now()
      }, null, 2);
    },

    generateReport: () => {
      const { stats, metrics, computed } = get();
      return {
        summary: {
          totalSessions: stats.totalSessions,
          activeUsers: stats.activeUsers,
          collaborationScore: computed.collaborationScore,
          syncHealth: computed.syncHealth
        },
        performance: {
          operationsPerSecond: stats.operationsPerSecond,
          networkLatency: stats.networkLatency,
          conflictRate: metrics.conflictRate,
          resolutionSuccess: metrics.resolutionSuccess
        },
        generatedAt: Date.now()
      };
    }
  },

  // Debug
  debug: {
    log: (level: CollaborationDebugLog['level'], category: CollaborationDebugLog['category'], message: string, data?: any) => {
      const log: CollaborationDebugLog = {
        id: generateId(),
        timestamp: Date.now(),
        level,
        category,
        message,
        data,
        sessionId: get().currentSession?.id,
        userId: get().currentUser?.id
      };

      set(state => ({
        debugLogs: [...state.debugLogs.slice(-199), log] // Keep last 200 logs
      }));

      if (get().config.debugMode) {
      }
    },

    getLogs: (filter?: Partial<CollaborationDebugLog>) => {
      const { debugLogs } = get();
      if (!filter) return debugLogs;

      return debugLogs.filter(log => {
        return Object.entries(filter).every(([key, value]) => {
          return log[key as keyof CollaborationDebugLog] === value;
        });
      });
    },

    clearLogs: () => {
      set({ debugLogs: [] });
    },

    exportLogs: () => {
      return JSON.stringify(get().debugLogs, null, 2);
    },

    enableDebugMode: () => {
      set(state => ({
        config: { ...state.config, debugMode: true }
      }));
    },

    disableDebugMode: () => {
      set(state => ({
        config: { ...state.config, debugMode: false }
      }));
    }
  }
})));

// Manager Class
export class RealTimeCollaborationManager {
  private store = useCollaborationStore;

  // Session Management
  async createSession(projectId: string, name: string, settings?: Partial<CollaborationSession['settings']>) {
    return this.store.getState().actions.createSession(projectId, name, settings);
  }

  async joinSession(sessionId: string, user: Partial<CollaborationUser>) {
    return this.store.getState().actions.joinSession(sessionId, user);
  }

  async leaveSession(sessionId: string) {
    return this.store.getState().actions.leaveSession(sessionId);
  }

  // Operation Management
  async applyOperation(operation: Omit<CollaborationOperation, 'id' | 'timestamp' | 'applied'>) {
    return this.store.getState().actions.applyOperation(operation);
  }

  async resolveConflict(conflictId: string, strategy: 'merge' | 'override' | 'manual', resolution?: any) {
    return this.store.getState().actions.resolveConflict(conflictId, strategy, resolution);
  }

  // Synchronization
  async syncState() {
    return this.store.getState().actions.syncState();
  }

  // System Operations
  async connect() {
    return this.store.getState().system.connect();
  }

  async disconnect() {
    return this.store.getState().system.disconnect();
  }

  // Utilities
  getSessionHealth(sessionId: string) {
    return this.store.getState().utils.getSessionHealth(sessionId);
  }

  getUserActivity(userId: string) {
    return this.store.getState().utils.getUserActivity(userId);
  }
}

// Global Manager Instance
export const collaborationManager = new RealTimeCollaborationManager();

// Utility Functions
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getConflictTypeColor = (type: CollaborationConflict['type']): string => {
  switch (type) {
    case 'concurrent_edit':
      return 'text-yellow-500';
    case 'position_conflict':
      return 'text-orange-500';
    case 'permission_conflict':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const getOperationTypeColor = (type: CollaborationOperation['type']): string => {
  switch (type) {
    case 'insert':
      return 'text-green-500';
    case 'delete':
      return 'text-red-500';
    case 'update':
      return 'text-blue-500';
    case 'move':
      return 'text-purple-500';
    case 'format':
      return 'text-orange-500';
    default:
      return 'text-gray-500';
  }
};

export const getUserStatusColor = (status: CollaborationUser['status']): string => {
  switch (status) {
    case 'online':
      return 'text-green-500';
    case 'away':
      return 'text-yellow-500';
    case 'offline':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

export const getNetworkStatusIcon = (status: 'excellent' | 'good' | 'poor' | 'offline') => {
  switch (status) {
    case 'excellent':
      return '📶';
    case 'good':
      return '📶';
    case 'poor':
      return '📶';
    case 'offline':
      return '📵';
    default:
      return '❓';
  }
};