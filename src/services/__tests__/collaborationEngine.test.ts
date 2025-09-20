import { collaborationEngine } from '../collaborationEngine';
import { CollaborationAction, CollaborationState } from '../collaborationEngine';

// Mock dependencies
jest.mock('../realtimeService', () => ({
  realtimeService: {
    sendMessage: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true)
  }
}));

jest.mock('../conflictResolver', () => ({
  conflictResolver: {
    resolveConflict: jest.fn((local, remote) => ({ ...local, ...remote })),
    detectConflicts: jest.fn(() => [])
  }
}));

describe('CollaborationEngine', () => {
  beforeEach(() => {
    // Reset engine state
    collaborationEngine.reset();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with project and user', () => {
      const config = {
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      };

      collaborationEngine.initialize(config);
      
      const state = collaborationEngine.getState();
      expect(state.projectId).toBe('test-project');
      expect(state.currentUser.id).toBe('test-user');
      expect(state.currentUser.name).toBe('Test User');
    });

    test('should throw error if already initialized', () => {
      const config = {
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      };

      collaborationEngine.initialize(config);
      
      expect(() => {
        collaborationEngine.initialize(config);
      }).toThrow('Collaboration engine already initialized');
    });
  });

  describe('Action Management', () => {
    beforeEach(() => {
      collaborationEngine.initialize({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });
    });

    test('should apply local action', () => {
      const action: CollaborationAction = {
        id: 'action-1',
        type: 'timeline_update',
        data: { currentTime: 10 },
        userId: 'test-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const result = collaborationEngine.applyAction(action);
      expect(result.success).toBe(true);
      
      const state = collaborationEngine.getState();
      expect(state.actions).toContain(action);
    });

    test('should handle remote action', () => {
      const remoteAction: CollaborationAction = {
        id: 'remote-action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1', trackId: 'track-1' },
        userId: 'remote-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      collaborationEngine.handleRemoteAction(remoteAction);
      
      const state = collaborationEngine.getState();
      expect(state.actions).toContain(remoteAction);
    });

    test('should detect and resolve conflicts', () => {
      const localAction: CollaborationAction = {
        id: 'local-action',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'test-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'remote-action',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'position', value: 10 },
        userId: 'remote-user',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      collaborationEngine.applyAction(localAction);
      collaborationEngine.handleRemoteAction(remoteAction);
      
      const state = collaborationEngine.getState();
      expect(state.conflicts).toHaveLength(0); // Should be resolved automatically
    });

    test('should undo action', () => {
      const action: CollaborationAction = {
        id: 'action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1' },
        userId: 'test-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      collaborationEngine.applyAction(action);
      
      const undoResult = collaborationEngine.undoAction('action-1');
      expect(undoResult.success).toBe(true);
      
      const state = collaborationEngine.getState();
      const undoneAction = state.actions.find(a => a.id === 'action-1');
      expect(undoneAction?.undone).toBe(true);
    });

    test('should redo action', () => {
      const action: CollaborationAction = {
        id: 'action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1' },
        userId: 'test-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      collaborationEngine.applyAction(action);
      collaborationEngine.undoAction('action-1');
      
      const redoResult = collaborationEngine.redoAction('action-1');
      expect(redoResult.success).toBe(true);
      
      const state = collaborationEngine.getState();
      const redoneAction = state.actions.find(a => a.id === 'action-1');
      expect(redoneAction?.undone).toBe(false);
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      collaborationEngine.initialize({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });
    });

    test('should add online user', () => {
      const user = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar-url',
        role: 'editor' as const,
        status: 'online' as const,
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 }
      };

      collaborationEngine.addOnlineUser(user);
      
      const state = collaborationEngine.getState();
      expect(state.onlineUsers).toContain(user);
    });

    test('should remove online user', () => {
      const user = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar-url',
        role: 'editor' as const,
        status: 'online' as const,
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 }
      };

      collaborationEngine.addOnlineUser(user);
      collaborationEngine.removeOnlineUser('user-2');
      
      const state = collaborationEngine.getState();
      expect(state.onlineUsers.find(u => u.id === 'user-2')).toBeUndefined();
    });

    test('should update user cursor', () => {
      const user = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar-url',
        role: 'editor' as const,
        status: 'online' as const,
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 }
      };

      collaborationEngine.addOnlineUser(user);
      collaborationEngine.updateUserCursor('user-2', { x: 300, y: 400 });
      
      const state = collaborationEngine.getState();
      const updatedUser = state.onlineUsers.find(u => u.id === 'user-2');
      expect(updatedUser?.cursor).toEqual({ x: 300, y: 400 });
    });
  });

  describe('Lock Management', () => {
    beforeEach(() => {
      collaborationEngine.initialize({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });
    });

    test('should acquire lock', () => {
      const result = collaborationEngine.acquireLock('clip-1', 'test-user');
      expect(result.success).toBe(true);
      
      const state = collaborationEngine.getState();
      expect(state.locks['clip-1']).toEqual({
        userId: 'test-user',
        timestamp: expect.any(Number),
        type: 'edit'
      });
    });

    test('should not acquire lock if already locked by another user', () => {
      collaborationEngine.acquireLock('clip-1', 'user-1');
      
      const result = collaborationEngine.acquireLock('clip-1', 'user-2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already locked');
    });

    test('should release lock', () => {
      collaborationEngine.acquireLock('clip-1', 'test-user');
      
      const result = collaborationEngine.releaseLock('clip-1', 'test-user');
      expect(result.success).toBe(true);
      
      const state = collaborationEngine.getState();
      expect(state.locks['clip-1']).toBeUndefined();
    });

    test('should not release lock if not owner', () => {
      collaborationEngine.acquireLock('clip-1', 'user-1');
      
      const result = collaborationEngine.releaseLock('clip-1', 'user-2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not the lock owner');
    });

    test('should check if element is locked', () => {
      expect(collaborationEngine.isLocked('clip-1')).toBe(false);
      
      collaborationEngine.acquireLock('clip-1', 'test-user');
      expect(collaborationEngine.isLocked('clip-1')).toBe(true);
      
      collaborationEngine.releaseLock('clip-1', 'test-user');
      expect(collaborationEngine.isLocked('clip-1')).toBe(false);
    });
  });

  describe('State Management', () => {
    test('should get current state', () => {
      collaborationEngine.initialize({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });

      const state = collaborationEngine.getState();
      expect(state).toMatchObject({
        projectId: 'test-project',
        currentUser: {
          id: 'test-user',
          name: 'Test User'
        },
        onlineUsers: [],
        actions: [],
        conflicts: [],
        locks: {},
        initialized: true
      });
    });

    test('should reset state', () => {
      collaborationEngine.initialize({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });

      collaborationEngine.reset();
      
      const state = collaborationEngine.getState();
      expect(state.initialized).toBe(false);
      expect(state.projectId).toBe('');
      expect(state.onlineUsers).toHaveLength(0);
      expect(state.actions).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      collaborationEngine.initialize({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });
    });

    test('should subscribe to events', () => {
      const handler = jest.fn();
      
      collaborationEngine.on('action_applied', handler);
      
      const action: CollaborationAction = {
        id: 'action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1' },
        userId: 'test-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      collaborationEngine.applyAction(action);
      
      expect(handler).toHaveBeenCalledWith(action);
    });

    test('should unsubscribe from events', () => {
      const handler = jest.fn();
      
      collaborationEngine.on('action_applied', handler);
      collaborationEngine.off('action_applied', handler);
      
      const action: CollaborationAction = {
        id: 'action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1' },
        userId: 'test-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      collaborationEngine.applyAction(action);
      
      expect(handler).not.toHaveBeenCalled();
    });
  });
});