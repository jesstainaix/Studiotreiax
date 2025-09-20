import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Bell, Settings, Crown, Edit, Eye, MessageSquare, Send, X, UserPlus, Shield } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { realtimeService } from '../../services/realtimeService';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentAction?: string;
  cursor?: { x: number; y: number; element?: string };
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system' | 'mention';
  contextual?: {
    timelinePosition?: number;
    elementId?: string;
    elementType?: string;
  };
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
  details?: any;
}

export interface CollaborationHubProps {
  projectId: string;
  currentUserId: string;
  onInviteUser?: (email: string, role: Collaborator['role']) => void;
  onRoleChange?: (userId: string, newRole: Collaborator['role']) => void;
  onRemoveUser?: (userId: string) => void;
}

const CollaborationHub: React.FC<CollaborationHubProps> = ({
  projectId,
  currentUserId,
  onInviteUser,
  onRoleChange,
  onRemoveUser
}) => {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'chat' | 'activity'>('collaborators');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Collaborator['role']>('viewer');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    sendMessage, 
    subscribe, 
    unsubscribe 
  } = useCollaboration(projectId, currentUserId);

  useEffect(() => {
    // Inscrever-se em eventos de colaboração
    const unsubscribeCollaborators = subscribe('collaborators-updated', (data: Collaborator[]) => {
      setCollaborators(data);
    });

    const unsubscribeChat = subscribe('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
      if (message.userId !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    const unsubscribeActivity = subscribe('activity', (activity: Activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]); // Manter apenas 50 atividades
    });

    // Carregar dados iniciais
    loadInitialData();

    return () => {
      unsubscribeCollaborators();
      unsubscribeChat();
      unsubscribeActivity();
    };
  }, [projectId, currentUserId]);

  useEffect(() => {
    // Auto-scroll do chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadInitialData = async () => {
    try {
      // Simular carregamento de dados iniciais
      const mockCollaborators: Collaborator[] = [
        {
          id: currentUserId,
          name: 'Você',
          email: 'you@example.com',
          role: 'owner',
          status: 'online',
          lastSeen: new Date(),
          currentAction: 'Editando timeline'
        },
        {
          id: 'user2',
          name: 'Maria Silva',
          email: 'maria@example.com',
          role: 'editor',
          status: 'online',
          lastSeen: new Date(),
          currentAction: 'Visualizando efeitos'
        },
        {
          id: 'user3',
          name: 'João Santos',
          email: 'joao@example.com',
          role: 'viewer',
          status: 'away',
          lastSeen: new Date(Date.now() - 300000) // 5 minutos atrás
        }
      ];

      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          userId: 'user2',
          userName: 'Maria Silva',
          content: 'Olá! Comecei a trabalhar nos efeitos de transição.',
          timestamp: new Date(Date.now() - 600000),
          type: 'message'
        },
        {
          id: '2',
          userId: currentUserId,
          userName: 'Você',
          content: 'Perfeito! Estou ajustando a timeline principal.',
          timestamp: new Date(Date.now() - 300000),
          type: 'message'
        }
      ];

      const mockActivities: Activity[] = [
        {
          id: '1',
          userId: 'user2',
          userName: 'Maria Silva',
          action: 'Adicionou efeito de fade',
          timestamp: new Date(Date.now() - 120000),
          details: { elementId: 'clip-1', effectType: 'fade' }
        },
        {
          id: '2',
          userId: currentUserId,
          userName: 'Você',
          action: 'Moveu clip na timeline',
          timestamp: new Date(Date.now() - 60000),
          details: { elementId: 'clip-2', newPosition: 15.5 }
        }
      ];

      setCollaborators(mockCollaborators);
      setChatMessages(mockMessages);
      setActivities(mockActivities);
    } catch (error) {
      console.error('Erro ao carregar dados de colaboração:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: 'Você',
      content: newMessage,
      timestamp: new Date(),
      type: 'message'
    };

    sendMessage('chat-message', message);
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) return;
    
    onInviteUser?.(inviteEmail, inviteRole);
    setInviteEmail('');
    setShowInviteModal(false);
    
    // Adicionar atividade
    const activity: Activity = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: 'Você',
      action: `Convidou ${inviteEmail} como ${inviteRole}`,
      timestamp: new Date()
    };
    setActivities(prev => [activity, ...prev]);
  };

  const getRoleIcon = (role: Collaborator['role']) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
      case 'commenter': return <MessageSquare className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Colaboração</h3>
          {isConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Conectado" />
          )}
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Convidar colaborador"
        >
          <UserPlus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('collaborators');
            setUnreadCount(0);
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'collaborators'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pessoas ({collaborators.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('chat');
            setUnreadCount(0);
          }}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Chat
          {unreadCount > 0 && activeTab !== 'chat' && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'activity'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Atividade
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'collaborators' && (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {collaborator.name}
                    </span>
                    {getRoleIcon(collaborator.role)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {collaborator.status === 'online' && collaborator.currentAction
                      ? collaborator.currentAction
                      : `Visto ${formatRelativeTime(collaborator.lastSeen)}`}
                  </p>
                </div>
                {collaborator.id !== currentUserId && (
                  <button
                    onClick={() => onRoleChange?.(collaborator.id, collaborator.role)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Gerenciar permissões"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.userId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.userId === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.userId !== currentUserId && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.userName}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 opacity-75`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}{activity.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Convite */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Convidar Colaborador</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissão
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Collaborator['role'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Visualizador - Apenas visualizar</option>
                  <option value="commenter">Comentarista - Visualizar e comentar</option>
                  <option value="editor">Editor - Editar projeto</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={!inviteEmail.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Convidar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationHub;
export type { Collaborator, ChatMessage, Activity };