import { renderHook, act } from '@testing-library/react';
import { useCollaboration } from '../useCollaboration';

// Mock dependencies
jest.mock('../../services/collaborationEngine', () => ({
  collaborationEngine: {
    initialize: jest.fn(),
    getState: jest.fn(() => ({
      projectId: 'test-project',
      currentUser: { id: 'test-user', name: 'Test User' },
      onlineUsers: [],
      actions: [],
      conflicts: [],
      locks: {},
      initialized: true
    })),
    applyAction: jest.fn(() => ({ success: true })),
    handleRemoteAction: jest.fn(),
    acquireLock: jest.fn(() => ({ success: true })),
    releaseLock: jest.fn(() => ({ success: true })),
    isLocked: jest.fn(() => false),
    addOnlineUser: jest.fn(),
    removeOnlineUser: jest.fn(),
    updateUserCursor: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    reset: jest.fn()
  }
}));

jest.mock('../../services/realtimeService', () => ({
  realtimeService: {
    connect: jest.fn(() => Promise.resolve(true)),
    disconnect: jest.fn(),
    sendMessage: jest.fn(() => true),
    isConnected: jest.fn(() => true),
    on: jest.fn(),
    off: jest.fn()
  }
}));

jest.mock('../../services/presenceManager', () => ({
  presenceManager: {
    initialize: jest.fn(),
    getCurrentUser: jest.fn(() => ({
      id: 'test-user',
      name: 'Test User',
      status: 'online',
      cursor: { x: 0, y: 0 }
    })),
    getOnlineUsers: jest.fn(() => []),
    updateCurrentUserCursor: jest.fn(),
    updateActiveElement: jest.fn(),
    broadcastPresence: jest.fn(),
    startHeartbeat: jest.fn(),
    stopHeartbeat: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    reset: jest.fn()
  }
}));

describe('useCollaboration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize collaboration services', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');
      const { realtimeService } = require('../../services/realtimeService');
      const { presenceManager } = require('../../services/presenceManager');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      expect(realtimeService.connect).toHaveBeenCalledWith({
        url: expect.any(String),
        projectId: 'test-project',
        userId: 'test-user'
      });
      expect(collaborationEngine.initialize).toHaveBeenCalledWith({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      });
      expect(presenceManager.initialize).toHaveBeenCalledWith({
        id: 'test-user',
        name: 'Test User',
        avatar: expect.any(String),
        role: 'editor'
      });
    });

    test('should handle connection failure', async () => {
      const { realtimeService } = require('../../services/realtimeService');
      realtimeService.connect.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        const connected = await result.current.connect();
        expect(connected).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
    });

    test('should disconnect properly', async () => {
      const { realtimeService } = require('../../services/realtimeService');
      const { presenceManager } = require('../../services/presenceManager');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
        result.current.disconnect();
      });

      expect(presenceManager.stopHeartbeat).toHaveBeenCalled();
      expect(realtimeService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Action Management', () => {
    test('should apply local action', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');
      const { realtimeService } = require('../../services/realtimeService');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      const action = {
        type: 'clip_added',
        data: { clipId: 'clip-1', trackId: 'track-1' }
      };

      act(() => {
        result.current.applyAction(action);
      });

      expect(collaborationEngine.applyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'clip_added',
          data: { clipId: 'clip-1', trackId: 'track-1' },
          userId: 'test-user',
          projectId: 'test-project'
        })
      );
      expect(realtimeService.sendMessage).toHaveBeenCalled();
    });

    test('should handle remote action', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      const remoteAction = {
        id: 'remote-action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'remote-user',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      act(() => {
        // Simulate receiving remote action
        const { realtimeService } = require('../../services/realtimeService');
        const onCallback = realtimeService.on.mock.calls.find(
          call => call[0] === 'collaboration_action'
        )?.[1];
        
        if (onCallback) {
          onCallback(remoteAction);
        }
      });

      expect(collaborationEngine.handleRemoteAction).toHaveBeenCalledWith(remoteAction);
    });
  });

  describe('Lock Management', () => {
    test('should acquire lock', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        const success = result.current.acquireLock('clip-1');
        expect(success).toBe(true);
      });

      expect(collaborationEngine.acquireLock).toHaveBeenCalledWith('clip-1', 'test-user');
    });

    test('should release lock', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        const success = result.current.releaseLock('clip-1');
        expect(success).toBe(true);
      });

      expect(collaborationEngine.releaseLock).toHaveBeenCalledWith('clip-1', 'test-user');
    });

    test('should check if element is locked', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      const isLocked = result.current.isLocked('clip-1');
      expect(isLocked).toBe(false);
      expect(collaborationEngine.isLocked).toHaveBeenCalledWith('clip-1');
    });
  });

  describe('User Presence', () => {
    test('should update cursor position', async () => {
      const { presenceManager } = require('../../services/presenceManager');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.updateCursor({ x: 100, y: 200 });
      });

      expect(presenceManager.updateCurrentUserCursor).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    test('should update active element', async () => {
      const { presenceManager } = require('../../services/presenceManager');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      const activeElement = {
        id: 'clip-1',
        type: 'clip',
        action: 'editing'
      };

      act(() => {
        result.current.setActiveElement(activeElement);
      });

      expect(presenceManager.updateActiveElement).toHaveBeenCalledWith('test-user', activeElement);
    });

    test('should get online users', async () => {
      const { presenceManager } = require('../../services/presenceManager');
      const mockUsers = [
        { id: 'user-1', name: 'User 1', status: 'online' },
        { id: 'user-2', name: 'User 2', status: 'away' }
      ];
      presenceManager.getOnlineUsers.mockReturnValue(mockUsers);

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.onlineUsers).toEqual(mockUsers);
    });
  });

  describe('State Management', () => {
    test('should provide collaboration state', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');
      const mockState = {
        projectId: 'test-project',
        currentUser: { id: 'test-user', name: 'Test User' },
        onlineUsers: [],
        actions: [],
        conflicts: [],
        locks: {},
        initialized: true
      };
      collaborationEngine.getState.mockReturnValue(mockState);

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.collaborationState).toEqual(mockState);
    });

    test('should track connection status', async () => {
      const { realtimeService } = require('../../services/realtimeService');

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      expect(result.current.isConnected).toBe(false);

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isConnected).toBe(true);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Event Handling', () => {
    test('should handle user joined event', async () => {
      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      const newUser = {
        id: 'new-user',
        name: 'New User',
        status: 'online'
      };

      act(() => {
        // Simulate user joined event
        const { realtimeService } = require('../../services/realtimeService');
        const onCallback = realtimeService.on.mock.calls.find(
          call => call[0] === 'user_joined'
        )?.[1];
        
        if (onCallback) {
          onCallback(newUser);
        }
      });

      const { collaborationEngine } = require('../../services/collaborationEngine');
      expect(collaborationEngine.addOnlineUser).toHaveBeenCalledWith(newUser);
    });

    test('should handle user left event', async () => {
      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        // Simulate user left event
        const { realtimeService } = require('../../services/realtimeService');
        const onCallback = realtimeService.on.mock.calls.find(
          call => call[0] === 'user_left'
        )?.[1];
        
        if (onCallback) {
          onCallback({ userId: 'leaving-user' });
        }
      });

      const { collaborationEngine } = require('../../services/collaborationEngine');
      expect(collaborationEngine.removeOnlineUser).toHaveBeenCalledWith('leaving-user');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup on unmount', async () => {
      const { realtimeService } = require('../../services/realtimeService');
      const { presenceManager } = require('../../services/presenceManager');
      const { collaborationEngine } = require('../../services/collaborationEngine');

      const { result, unmount } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      unmount();

      expect(presenceManager.stopHeartbeat).toHaveBeenCalled();
      expect(realtimeService.disconnect).toHaveBeenCalled();
      expect(collaborationEngine.reset).toHaveBeenCalled();
      expect(presenceManager.reset).toHaveBeenCalled();
    });

    test('should remove event listeners on cleanup', async () => {
      const { realtimeService } = require('../../services/realtimeService');
      const { presenceManager } = require('../../services/presenceManager');
      const { collaborationEngine } = require('../../services/collaborationEngine');

      const { result, unmount } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      unmount();

      expect(realtimeService.off).toHaveBeenCalled();
      expect(presenceManager.off).toHaveBeenCalled();
      expect(collaborationEngine.off).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle action application errors', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');
      collaborationEngine.applyAction.mockReturnValue({ success: false, error: 'Test error' });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.applyAction({
          type: 'clip_added',
          data: { clipId: 'clip-1' }
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to apply action:', 'Test error');
      consoleSpy.mockRestore();
    });

    test('should handle lock acquisition errors', async () => {
      const { collaborationEngine } = require('../../services/collaborationEngine');
      collaborationEngine.acquireLock.mockReturnValue({ success: false, error: 'Lock error' });

      const { result } = renderHook(() => useCollaboration({
        projectId: 'test-project',
        userId: 'test-user',
        userName: 'Test User'
      }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        const success = result.current.acquireLock('clip-1');
        expect(success).toBe(false);
      });
    });
  });
});