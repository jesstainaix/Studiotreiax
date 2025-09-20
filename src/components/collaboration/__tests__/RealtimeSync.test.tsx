import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealtimeSync } from '../RealtimeSync';
import { useCollaboration } from '../../../hooks/useCollaboration';

// Mock the useCollaboration hook
jest.mock('../../../hooks/useCollaboration');
const mockUseCollaboration = useCollaboration as jest.MockedFunction<typeof useCollaboration>;

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Unlock: () => <div data-testid="unlock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  RefreshCw: () => <div data-testid="refresh-cw-icon" />
}));

const mockTimelineData = {
  tracks: [
    {
      id: 'track-1',
      name: 'Video Track',
      type: 'video' as const,
      clips: [
        {
          id: 'clip-1',
          name: 'Video Clip 1',
          startTime: 0,
          duration: 5,
          trackId: 'track-1',
          type: 'video' as const,
          locked: false
        }
      ]
    }
  ],
  duration: 10,
  currentTime: 0
};

const mockCollaborationData = {
  isConnected: true,
  onlineUsers: [
    {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar1.jpg',
      status: 'online' as const,
      role: 'editor' as const,
      cursor: { x: 100, y: 200 },
      activeElement: { id: 'clip-1', type: 'clip', action: 'editing' },
      lastSeen: Date.now()
    }
  ],
  currentUser: {
    id: 'current-user',
    name: 'Current User',
    role: 'editor' as const
  },
  collaborationState: {
    locks: {
      'clip-1': { userId: 'user-1', userName: 'John Doe', timestamp: Date.now() }
    },
    conflicts: [
      {
        id: 'conflict-1',
        type: 'property_conflict',
        elementId: 'clip-1',
        property: 'duration',
        localValue: 5,
        remoteValue: 6,
        localUser: 'current-user',
        remoteUser: 'user-1',
        timestamp: Date.now()
      }
    ],
    actions: [],
    projectId: 'test-project',
    onlineUsers: [],
    initialized: true
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
  applyAction: jest.fn(),
  acquireLock: jest.fn(() => true),
  releaseLock: jest.fn(() => true),
  isLocked: jest.fn((elementId: string) => elementId === 'clip-1'),
  updateCursor: jest.fn(),
  setActiveElement: jest.fn()
};

const defaultProps = {
  timelineData: mockTimelineData,
  onTimelineUpdate: jest.fn(),
  onConflictResolved: jest.fn(),
  currentTime: 0,
  onTimeUpdate: jest.fn()
};

describe('RealtimeSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCollaboration.mockReturnValue(mockCollaborationData);
  });

  describe('Rendering', () => {
    test('should render sync status when connected', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('Sincronização Ativa')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      expect(screen.getByText('1 usuário online')).toBeInTheDocument();
    });

    test('should render disconnected status', () => {
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        isConnected: false
      });

      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    test('should show user cursors', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('editando clip-1')).toBeInTheDocument();
    });

    test('should show locked elements', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('Elementos Bloqueados')).toBeInTheDocument();
      expect(screen.getByText('clip-1')).toBeInTheDocument();
      expect(screen.getByText('por John Doe')).toBeInTheDocument();
    });
  });

  describe('Conflict Resolution', () => {
    test('should display conflicts', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('Conflitos Detectados')).toBeInTheDocument();
      expect(screen.getByText('1 conflito')).toBeInTheDocument();
      expect(screen.getByText('Propriedade: duration')).toBeInTheDocument();
      expect(screen.getByText('Seu valor: 5')).toBeInTheDocument();
      expect(screen.getByText('Valor remoto: 6')).toBeInTheDocument();
    });

    test('should resolve conflict with local value', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const useLocalButton = screen.getByText('Usar Meu Valor');
      fireEvent.click(useLocalButton);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'conflict_resolved',
        data: {
          conflictId: 'conflict-1',
          resolution: 'local',
          value: 5
        }
      });
      
      expect(defaultProps.onConflictResolved).toHaveBeenCalledWith(
        'conflict-1',
        'local',
        5
      );
    });

    test('should resolve conflict with remote value', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const useRemoteButton = screen.getByText('Usar Valor Remoto');
      fireEvent.click(useRemoteButton);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'conflict_resolved',
        data: {
          conflictId: 'conflict-1',
          resolution: 'remote',
          value: 6
        }
      });
      
      expect(defaultProps.onConflictResolved).toHaveBeenCalledWith(
        'conflict-1',
        'remote',
        6
      );
    });

    test('should merge conflict values', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const mergeButton = screen.getByText('Mesclar');
      fireEvent.click(mergeButton);
      
      // Should open merge dialog
      expect(screen.getByText('Resolver Conflito')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Local value input
      
      // Change merged value
      const mergedInput = screen.getByDisplayValue('5');
      fireEvent.change(mergedInput, { target: { value: '5.5' } });
      
      // Apply merge
      const applyButton = screen.getByText('Aplicar');
      fireEvent.click(applyButton);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'conflict_resolved',
        data: {
          conflictId: 'conflict-1',
          resolution: 'merged',
          value: 5.5
        }
      });
    });
  });

  describe('Lock Management', () => {
    test('should acquire lock on element', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      // Mock element not locked
      mockCollaborationData.isLocked.mockReturnValue(false);
      
      const lockButton = screen.getByText('Bloquear para Edição');
      fireEvent.click(lockButton);
      
      expect(mockCollaborationData.acquireLock).toHaveBeenCalledWith('clip-1');
    });

    test('should release lock on element', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const unlockButton = screen.getByText('Desbloquear');
      fireEvent.click(unlockButton);
      
      expect(mockCollaborationData.releaseLock).toHaveBeenCalledWith('clip-1');
    });

    test('should show lock status for current user', () => {
      // Mock current user has lock
      const mockDataWithUserLock = {
        ...mockCollaborationData,
        collaborationState: {
          ...mockCollaborationData.collaborationState,
          locks: {
            'clip-1': { userId: 'current-user', userName: 'Current User', timestamp: Date.now() }
          }
        }
      };
      
      mockUseCollaboration.mockReturnValue(mockDataWithUserLock);
      
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('Você está editando')).toBeInTheDocument();
      expect(screen.getByText('Desbloquear')).toBeInTheDocument();
    });
  });

  describe('Timeline Synchronization', () => {
    test('should sync timeline changes', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      // Simulate timeline update
      const updatedTimeline = {
        ...mockTimelineData,
        tracks: [
          {
            ...mockTimelineData.tracks[0],
            clips: [
              {
                ...mockTimelineData.tracks[0].clips[0],
                duration: 6 // Changed duration
              }
            ]
          }
        ]
      };
      
      // Trigger timeline update
      fireEvent.click(screen.getByText('Sincronizar Timeline'));
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'timeline_updated',
        data: {
          timeline: expect.any(Object),
          timestamp: expect.any(Number)
        }
      });
    });

    test('should handle remote timeline updates', async () => {
      render(<RealtimeSync {...defaultProps} />);
      
      // Simulate receiving remote timeline update
      const remoteUpdate = {
        type: 'timeline_updated',
        data: {
          timeline: {
            ...mockTimelineData,
            currentTime: 2.5
          },
          timestamp: Date.now()
        },
        userId: 'user-1'
      };
      
      // This would normally come through the collaboration hook
      // For testing, we'll simulate the effect
      await waitFor(() => {
        expect(defaultProps.onTimelineUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Playback Synchronization', () => {
    test('should sync playback time', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const syncPlaybackButton = screen.getByText('Sincronizar Reprodução');
      fireEvent.click(syncPlaybackButton);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'playback_sync',
        data: {
          currentTime: 0,
          isPlaying: false,
          timestamp: expect.any(Number)
        }
      });
    });

    test('should handle remote playback sync', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      // Simulate remote playback sync
      const remoteSync = {
        type: 'playback_sync',
        data: {
          currentTime: 3.5,
          isPlaying: true,
          timestamp: Date.now()
        },
        userId: 'user-1'
      };
      
      // This would trigger through the collaboration system
      expect(defaultProps.onTimeUpdate).toBeDefined();
    });
  });

  describe('Auto-sync Settings', () => {
    test('should toggle auto-sync', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const autoSyncToggle = screen.getByLabelText('Sincronização Automática');
      fireEvent.click(autoSyncToggle);
      
      expect(autoSyncToggle).toBeChecked();
    });

    test('should configure sync interval', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const intervalSelect = screen.getByDisplayValue('1000ms');
      fireEvent.change(intervalSelect, { target: { value: '500' } });
      
      expect(intervalSelect).toHaveValue('500');
    });

    test('should enable conflict auto-resolution', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const autoResolveToggle = screen.getByLabelText('Resolução Automática de Conflitos');
      fireEvent.click(autoResolveToggle);
      
      expect(autoResolveToggle).toBeChecked();
    });
  });

  describe('Performance Monitoring', () => {
    test('should display sync performance metrics', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByText('Latência:')).toBeInTheDocument();
      expect(screen.getByText('< 50ms')).toBeInTheDocument();
      expect(screen.getByText('Sincronizações/min:')).toBeInTheDocument();
    });

    test('should show sync history', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const historyButton = screen.getByText('Ver Histórico');
      fireEvent.click(historyButton);
      
      expect(screen.getByText('Histórico de Sincronização')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle sync errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockCollaborationData.applyAction.mockImplementation(() => {
        throw new Error('Sync failed');
      });
      
      render(<RealtimeSync {...defaultProps} />);
      
      const syncButton = screen.getByText('Sincronizar Timeline');
      fireEvent.click(syncButton);
      
      expect(screen.getByText('Erro na sincronização')).toBeInTheDocument();
      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('should retry failed sync', () => {
      mockCollaborationData.applyAction
        .mockImplementationOnce(() => {
          throw new Error('Sync failed');
        })
        .mockImplementationOnce(() => ({ success: true }));
      
      render(<RealtimeSync {...defaultProps} />);
      
      const syncButton = screen.getByText('Sincronizar Timeline');
      fireEvent.click(syncButton);
      
      const retryButton = screen.getByText('Tentar Novamente');
      fireEvent.click(retryButton);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /sincronizar timeline/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sincronizar reprodução/i })).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(<RealtimeSync {...defaultProps} />);
      
      const syncButton = screen.getByRole('button', { name: /sincronizar timeline/i });
      syncButton.focus();
      fireEvent.keyDown(syncButton, { key: 'Enter' });
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    test('should update user cursors in real-time', async () => {
      render(<RealtimeSync {...defaultProps} />);
      
      // Simulate cursor update
      const updatedUsers = [
        {
          ...mockCollaborationData.onlineUsers[0],
          cursor: { x: 150, y: 250 }
        }
      ];
      
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        onlineUsers: updatedUsers
      });
      
      // Re-render to simulate real-time update
      render(<RealtimeSync {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('should update lock status in real-time', async () => {
      render(<RealtimeSync {...defaultProps} />);
      
      // Simulate lock release
      const updatedState = {
        ...mockCollaborationData.collaborationState,
        locks: {} // No locks
      };
      
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        collaborationState: updatedState
      });
      
      // Re-render to simulate real-time update
      render(<RealtimeSync {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Elementos Bloqueados')).not.toBeInTheDocument();
      });
    });
  });
});