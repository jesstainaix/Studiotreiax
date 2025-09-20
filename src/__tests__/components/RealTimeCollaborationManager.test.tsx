import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RealTimeCollaborationManager from '../../components/real-time-collaboration/RealTimeCollaborationManager';

// Mock do hook useRealTimeCollaboration
vi.mock('../../hooks/useRealTimeCollaboration', () => ({
  default: () => ({
    isConnected: false,
    currentUser: null,
    users: [],
    events: [],
    operations: [],
    comments: [],
    locks: [],
    conflicts: [],
    metrics: {
      activeUsers: 0,
      totalUsers: 0,
      totalSessions: 0,
      systemHealth: 95
    },
    config: {
      enableRealTimeSync: false,
      enableComments: true,
      enableLocking: true,
      maxUsers: 10,
      conflictResolutionStrategy: 'manual',
      enableCursorTracking: true,
      enableSelectionSharing: true,
      compressionEnabled: false,
      encryptionEnabled: false,
      serverUrl: 'ws://localhost:8080'
    },
    error: null,
    lastSync: null,
    actions: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      addComment: vi.fn(),
      acquireLock: vi.fn(),
      releaseLock: vi.fn(),
      updateConfig: vi.fn(),
      getUserById: vi.fn(() => null)
    }
  })
}));

describe('RealTimeCollaborationManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização Básica', () => {
    it('deve renderizar o componente sem erros', () => {
      render(<RealTimeCollaborationManager />);
      
      expect(screen.getByText('Real-Time Collaboration')).toBeInTheDocument();
    });

    it('deve exibir as abas principais', () => {
      render(<RealTimeCollaborationManager />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Locks')).toBeInTheDocument();
      expect(screen.getByText('Conflicts')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });
});