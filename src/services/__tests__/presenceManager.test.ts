import { presenceManager } from '../presenceManager';
import { UserPresence, PresenceUpdate } from '../presenceManager';

// Mock dependencies
jest.mock('../realtimeService', () => ({
  realtimeService: {
    sendMessage: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(() => true)
  }
}));

describe('PresenceManager', () => {
  beforeEach(() => {
    // Reset presence manager state
    presenceManager.reset();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with user info', () => {
      const userInfo = {
        id: 'user-1',
        name: 'Test User',
        avatar: 'avatar-url',
        role: 'editor' as const
      };

      presenceManager.initialize(userInfo);
      
      const currentUser = presenceManager.getCurrentUser();
      expect(currentUser).toMatchObject(userInfo);
      expect(currentUser.status).toBe('online');
      expect(currentUser.lastSeen).toBeGreaterThan(0);
    });

    test('should throw error if already initialized', () => {
      const userInfo = {
        id: 'user-1',
        name: 'Test User',
        avatar: 'avatar-url',
        role: 'editor' as const
      };

      presenceManager.initialize(userInfo);
      
      expect(() => {
        presenceManager.initialize(userInfo);
      }).toThrow('Presence manager already initialized');
    });
  });

  describe('User Presence Management', () => {
    beforeEach(() => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });
    });

    test('should add online user', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      
      const onlineUsers = presenceManager.getOnlineUsers();
      expect(onlineUsers).toContain(user);
    });

    test('should remove user', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.removeUser('user-2');
      
      const onlineUsers = presenceManager.getOnlineUsers();
      expect(onlineUsers.find(u => u.id === 'user-2')).toBeUndefined();
    });

    test('should update user status', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.updateUserStatus('user-2', 'away');
      
      const updatedUser = presenceManager.getUser('user-2');
      expect(updatedUser?.status).toBe('away');
    });

    test('should get user by id', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      
      const foundUser = presenceManager.getUser('user-2');
      expect(foundUser).toEqual(user);
      
      const notFoundUser = presenceManager.getUser('non-existent');
      expect(notFoundUser).toBeUndefined();
    });
  });

  describe('Cursor Management', () => {
    beforeEach(() => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });
    });

    test('should update user cursor position', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.updateCursor('user-2', { x: 300, y: 400 });
      
      const updatedUser = presenceManager.getUser('user-2');
      expect(updatedUser?.cursor).toEqual({ x: 300, y: 400 });
    });

    test('should update current user cursor', () => {
      presenceManager.updateCurrentUserCursor({ x: 150, y: 250 });
      
      const currentUser = presenceManager.getCurrentUser();
      expect(currentUser.cursor).toEqual({ x: 150, y: 250 });
    });

    test('should get all user cursors', () => {
      const user1: UserPresence = {
        id: 'user-1',
        name: 'User 1',
        avatar: 'avatar1-url',
        role: 'editor',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const user2: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 300, y: 400 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user1);
      presenceManager.addUser(user2);
      
      const cursors = presenceManager.getAllCursors();
      expect(cursors).toEqual({
        'user-1': { x: 100, y: 200 },
        'user-2': { x: 300, y: 400 }
      });
    });
  });

  describe('Active Element Tracking', () => {
    beforeEach(() => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });
    });

    test('should update user active element', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'editor',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.updateActiveElement('user-2', {
        id: 'clip-1',
        type: 'clip',
        action: 'editing'
      });
      
      const updatedUser = presenceManager.getUser('user-2');
      expect(updatedUser?.activeElement).toEqual({
        id: 'clip-1',
        type: 'clip',
        action: 'editing'
      });
    });

    test('should clear user active element', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'editor',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: { id: 'clip-1', type: 'clip', action: 'editing' },
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.updateActiveElement('user-2', null);
      
      const updatedUser = presenceManager.getUser('user-2');
      expect(updatedUser?.activeElement).toBeNull();
    });

    test('should get users editing specific element', () => {
      const user1: UserPresence = {
        id: 'user-1',
        name: 'User 1',
        avatar: 'avatar1-url',
        role: 'editor',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: { id: 'clip-1', type: 'clip', action: 'editing' },
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const user2: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'editor',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 300, y: 400 },
        activeElement: { id: 'clip-2', type: 'clip', action: 'viewing' },
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user1);
      presenceManager.addUser(user2);
      
      const editingUsers = presenceManager.getUsersEditingElement('clip-1');
      expect(editingUsers).toHaveLength(1);
      expect(editingUsers[0].id).toBe('user-1');
    });
  });

  describe('Viewport Synchronization', () => {
    beforeEach(() => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });
    });

    test('should update user viewport', () => {
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.updateViewport('user-2', { x: 100, y: 50, zoom: 1.5 });
      
      const updatedUser = presenceManager.getUser('user-2');
      expect(updatedUser?.viewport).toEqual({ x: 100, y: 50, zoom: 1.5 });
    });

    test('should update current user viewport', () => {
      presenceManager.updateCurrentUserViewport({ x: 200, y: 100, zoom: 2 });
      
      const currentUser = presenceManager.getCurrentUser();
      expect(currentUser.viewport).toEqual({ x: 200, y: 100, zoom: 2 });
    });
  });

  describe('Presence Broadcasting', () => {
    beforeEach(() => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });
    });

    test('should broadcast presence update', () => {
      const { realtimeService } = require('../realtimeService');
      
      presenceManager.broadcastPresence();
      
      expect(realtimeService.sendMessage).toHaveBeenCalledWith({
        type: 'presence_update',
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 'current-user',
            name: 'Current User'
          })
        }),
        timestamp: expect.any(Number),
        userId: 'current-user',
        projectId: expect.any(String)
      });
    });

    test('should start heartbeat', () => {
      jest.useFakeTimers();
      
      presenceManager.startHeartbeat(1000);
      
      const { realtimeService } = require('../realtimeService');
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      expect(realtimeService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'heartbeat'
        })
      );
      
      jest.useRealTimers();
    });

    test('should stop heartbeat', () => {
      jest.useFakeTimers();
      
      presenceManager.startHeartbeat(1000);
      presenceManager.stopHeartbeat();
      
      const { realtimeService } = require('../realtimeService');
      const callCount = realtimeService.sendMessage.mock.calls.length;
      
      // Fast-forward time
      jest.advanceTimersByTime(2000);
      
      // Should not have made additional calls
      expect(realtimeService.sendMessage.mock.calls.length).toBe(callCount);
      
      jest.useRealTimers();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });
    });

    test('should subscribe to events', () => {
      const handler = jest.fn();
      
      presenceManager.on('user_joined', handler);
      
      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      
      expect(handler).toHaveBeenCalledWith(user);
    });

    test('should unsubscribe from events', () => {
      const handler = jest.fn();
      
      presenceManager.on('user_left', handler);
      presenceManager.off('user_left', handler);
      
      presenceManager.removeUser('user-2');
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup and Reset', () => {
    test('should reset state', () => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });

      const user: UserPresence = {
        id: 'user-2',
        name: 'User 2',
        avatar: 'avatar2-url',
        role: 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        cursor: { x: 100, y: 200 },
        activeElement: null,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      presenceManager.addUser(user);
      presenceManager.reset();
      
      expect(presenceManager.getOnlineUsers()).toHaveLength(0);
      expect(() => presenceManager.getCurrentUser()).toThrow();
    });

    test('should cleanup on disconnect', () => {
      presenceManager.initialize({
        id: 'current-user',
        name: 'Current User',
        avatar: 'avatar-url',
        role: 'editor'
      });

      presenceManager.startHeartbeat(1000);
      presenceManager.cleanup();
      
      // Should stop heartbeat and clear state
      expect(presenceManager.getOnlineUsers()).toHaveLength(0);
    });
  });
});