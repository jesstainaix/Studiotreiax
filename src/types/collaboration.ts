export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  isOnline: boolean;
  lastSeen: Date;
}

export interface Cursor {
  userId: string;
  x: number;
  y: number;
  timestamp: Date;
  elementId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  position: {
    x: number;
    y: number;
    timelinePosition?: number;
  };
  replies: Comment[];
  resolved: boolean;
  mentions: string[];
}

export interface Activity {
  id: string;
  userId: string;
  type: 'edit' | 'comment' | 'join' | 'leave' | 'upload' | 'export' | 'share';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Version {
  id: string;
  userId: string;
  timestamp: Date;
  description: string;
  changes: Change[];
  parentVersion?: string;
}

export interface Change {
  id: string;
  type: 'add' | 'remove' | 'modify';
  target: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface Conflict {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'permission_denied';
  users: string[];
  changes: Change[];
  resolution?: 'auto' | 'manual';
  resolvedBy?: string;
  timestamp: Date;
}

export interface Permission {
  userId: string;
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'share' | 'comment')[];
  granted: boolean;
  grantedBy: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  mentions: string[];
  reactions: Record<string, string[]>;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSync: Date;
  pendingChanges: number;
  conflictsCount: number;
  latency: number;
}

export interface CollaborationState {
  users: User[];
  cursors: Record<string, Cursor>;
  comments: Comment[];
  activities: Activity[];
  versions: Version[];
  conflicts: Conflict[];
  permissions: Permission[];
  chatMessages: ChatMessage[];
  syncStatus: SyncStatus;
  currentVersion: string;
  isCollaborating: boolean;
}

export interface CollaborationEvents {
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  cursorMoved: (cursor: Cursor) => void;
  commentAdded: (comment: Comment) => void;
  commentResolved: (commentId: string) => void;
  activityAdded: (activity: Activity) => void;
  versionCreated: (version: Version) => void;
  conflictDetected: (conflict: Conflict) => void;
  conflictResolved: (conflictId: string) => void;
  permissionChanged: (permission: Permission) => void;
  messageReceived: (message: ChatMessage) => void;
  syncStatusChanged: (status: SyncStatus) => void;
}

export interface WebSocketMessage {
  type: keyof CollaborationEvents;
  payload: any;
  timestamp: Date;
  userId: string;
  sessionId: string;
}