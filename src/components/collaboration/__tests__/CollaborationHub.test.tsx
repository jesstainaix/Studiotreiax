import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborationHub } from '../CollaborationHub';
import { useCollaboration } from '../../../hooks/useCollaboration';

// Mock the useCollaboration hook
jest.mock('../../../hooks/useCollaboration');
const mockUseCollaboration = useCollaboration as jest.MockedFunction<typeof useCollaboration>;

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Send: () => <div data-testid="send-icon" />,
  MoreVertical: () => <div data-testid="more-vertical-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  X: () => <div data-testid="x-icon" />
}));

const mockCollaborationData = {
  isConnected: true,
  onlineUsers: [
    {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar1.jpg',
      status: 'online' as const,
      role: 'owner' as const,
      cursor: { x: 100, y: 200 },
      activeElement: { id: 'clip-1', type: 'clip', action: 'editing' },
      lastSeen: Date.now()
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      avatar: 'https://example.com/avatar2.jpg',
      status: 'away' as const,
      role: 'editor' as const,
      cursor: { x: 150, y: 250 },
      activeElement: null,
      lastSeen: Date.now() - 300000
    }
  ],
  currentUser: {
    id: 'current-user',
    name: 'Current User',
    avatar: 'https://example.com/current-avatar.jpg',
    status: 'online' as const,
    role: 'editor' as const
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
  applyAction: jest.fn(),
  updateCursor: jest.fn(),
  setActiveElement: jest.fn()
};

const defaultProps = {
  projectId: 'test-project',
  currentUserId: 'current-user',
  onUserSelect: jest.fn(),
  onPermissionChange: jest.fn()
};

describe('CollaborationHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCollaboration.mockReturnValue(mockCollaborationData);
  });

  describe('Rendering', () => {
    test('should render collaboration hub with online users', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByText('Colaboração')).toBeInTheDocument();
      expect(screen.getByText('2 online')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('should show user roles correctly', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    test('should show user status indicators', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const onlineIndicators = screen.getAllByText('●');
      expect(onlineIndicators).toHaveLength(2); // One for each user
    });

    test('should render when no users are online', () => {
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        onlineUsers: []
      });

      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByText('0 online')).toBeInTheDocument();
      expect(screen.getByText('Nenhum colaborador online')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should call onUserSelect when user is clicked', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const userElement = screen.getByText('John Doe').closest('div');
      fireEvent.click(userElement!);
      
      expect(defaultProps.onUserSelect).toHaveBeenCalledWith(mockCollaborationData.onlineUsers[0]);
    });

    test('should show user menu when more options clicked', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const moreButtons = screen.getAllByTestId('more-vertical-icon');
      fireEvent.click(moreButtons[0]);
      
      expect(screen.getByText('Ver perfil')).toBeInTheDocument();
      expect(screen.getByText('Enviar mensagem')).toBeInTheDocument();
    });

    test('should handle invite user action', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const inviteButton = screen.getByTestId('user-plus-icon').closest('button');
      fireEvent.click(inviteButton!);
      
      expect(screen.getByText('Convidar Colaborador')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Digite o email do colaborador')).toBeInTheDocument();
    });

    test('should send invitation', async () => {
      render(<CollaborationHub {...defaultProps} />);
      
      // Open invite modal
      const inviteButton = screen.getByTestId('user-plus-icon').closest('button');
      fireEvent.click(inviteButton!);
      
      // Fill email and role
      const emailInput = screen.getByPlaceholderText('Digite o email do colaborador');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const roleSelect = screen.getByDisplayValue('Editor');
      fireEvent.change(roleSelect, { target: { value: 'viewer' } });
      
      // Send invitation
      const sendButton = screen.getByText('Enviar Convite');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Convidar Colaborador')).not.toBeInTheDocument();
      });
    });
  });

  describe('Chat System', () => {
    test('should render chat interface', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const chatTab = screen.getByText('Chat');
      fireEvent.click(chatTab);
      
      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument();
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    test('should send chat message', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const chatTab = screen.getByText('Chat');
      fireEvent.click(chatTab);
      
      const messageInput = screen.getByPlaceholderText('Digite sua mensagem...');
      fireEvent.change(messageInput, { target: { value: 'Hello everyone!' } });
      
      const sendButton = screen.getByTestId('send-icon').closest('button');
      fireEvent.click(sendButton!);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'chat_message',
        data: {
          message: 'Hello everyone!',
          timestamp: expect.any(Number),
          contextual: false
        }
      });
    });

    test('should handle message with mentions', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const chatTab = screen.getByText('Chat');
      fireEvent.click(chatTab);
      
      const messageInput = screen.getByPlaceholderText('Digite sua mensagem...');
      fireEvent.change(messageInput, { target: { value: 'Hello @John Doe!' } });
      
      const sendButton = screen.getByTestId('send-icon').closest('button');
      fireEvent.click(sendButton!);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'chat_message',
        data: {
          message: 'Hello @John Doe!',
          timestamp: expect.any(Number),
          contextual: false,
          mentions: ['user-1']
        }
      });
    });

    test('should send contextual message', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const chatTab = screen.getByText('Chat');
      fireEvent.click(chatTab);
      
      const contextualCheckbox = screen.getByLabelText('Mensagem contextual');
      fireEvent.click(contextualCheckbox);
      
      const messageInput = screen.getByPlaceholderText('Digite sua mensagem...');
      fireEvent.change(messageInput, { target: { value: 'This clip needs adjustment' } });
      
      const sendButton = screen.getByTestId('send-icon').closest('button');
      fireEvent.click(sendButton!);
      
      expect(mockCollaborationData.applyAction).toHaveBeenCalledWith({
        type: 'chat_message',
        data: {
          message: 'This clip needs adjustment',
          timestamp: expect.any(Number),
          contextual: true,
          context: {
            elementId: 'clip-1',
            elementType: 'clip',
            timestamp: expect.any(Number)
          }
        }
      });
    });
  });

  describe('Activity Feed', () => {
    test('should render activity feed', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const activityTab = screen.getByText('Atividade');
      fireEvent.click(activityTab);
      
      expect(screen.getByText('Atividades Recentes')).toBeInTheDocument();
    });

    test('should show recent activities', () => {
      const mockActivities = [
        {
          id: 'activity-1',
          type: 'clip_added',
          userId: 'user-1',
          userName: 'John Doe',
          timestamp: Date.now() - 60000,
          data: { clipId: 'clip-1', trackId: 'track-1' }
        },
        {
          id: 'activity-2',
          type: 'user_joined',
          userId: 'user-2',
          userName: 'Jane Smith',
          timestamp: Date.now() - 120000,
          data: {}
        }
      ];

      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        collaborationState: {
          actions: mockActivities,
          projectId: 'test-project',
          currentUser: mockCollaborationData.currentUser,
          onlineUsers: mockCollaborationData.onlineUsers,
          conflicts: [],
          locks: {},
          initialized: true
        }
      });

      render(<CollaborationHub {...defaultProps} />);
      
      const activityTab = screen.getByText('Atividade');
      fireEvent.click(activityTab);
      
      expect(screen.getByText('John Doe adicionou um clipe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith entrou no projeto')).toBeInTheDocument();
    });
  });

  describe('Notifications', () => {
    test('should show notification badge when there are unread notifications', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const notificationButton = screen.getByTestId('bell-icon').closest('button');
      expect(notificationButton).toBeInTheDocument();
    });

    test('should open notifications panel', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const notificationButton = screen.getByTestId('bell-icon').closest('button');
      fireEvent.click(notificationButton!);
      
      expect(screen.getByText('Notificações')).toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    test('should show connected status', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByText('Conectado')).toBeInTheDocument();
    });

    test('should show disconnected status', () => {
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        isConnected: false
      });

      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });

    test('should attempt reconnection when disconnected', () => {
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        isConnected: false
      });

      render(<CollaborationHub {...defaultProps} />);
      
      const reconnectButton = screen.getByText('Reconectar');
      fireEvent.click(reconnectButton);
      
      expect(mockCollaborationData.connect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /usuários/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /chat/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /atividade/i })).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(<CollaborationHub {...defaultProps} />);
      
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      chatTab.focus();
      fireEvent.keyDown(chatTab, { key: 'Enter' });
      
      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle connection errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
      });

      render(<CollaborationHub {...defaultProps} />);
      
      const reconnectButton = screen.getByText('Reconectar');
      fireEvent.click(reconnectButton);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle invalid user data', () => {
      mockUseCollaboration.mockReturnValue({
        ...mockCollaborationData,
        onlineUsers: [
          {
            id: 'invalid-user',
            name: '',
            avatar: '',
            status: 'online' as const,
            role: 'viewer' as const,
            cursor: { x: 0, y: 0 },
            activeElement: null,
            lastSeen: Date.now()
          }
        ]
      });

      render(<CollaborationHub {...defaultProps} />);
      
      expect(screen.getByText('Usuário Anônimo')).toBeInTheDocument();
    });
  });
});