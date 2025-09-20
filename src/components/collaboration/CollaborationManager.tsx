import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Share, 
  MessageSquare, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Clock, 
  Wifi, 
  WifiOff, 
  Sync, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader,
  FileText,
  Upload,
  Download,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Activity,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Lock
} from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { formatDuration, formatBytes } from '../../utils/collaborationManager';

interface CollaborationManagerProps {
  projectId?: string;
}

const CollaborationManager: React.FC<CollaborationManagerProps> = ({ projectId = 'default-project' }) => {
  const {
    currentUser,
    activeSession,
    participants,
    changes,
    conflicts,
    isOnline,
    isSyncing,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    updateStatus,
    resolveConflict,
    startSync,
    stopSync,
    forceSync,
    inviteUser,
    kickUser,
    transferOwnership,
    enableVoiceChat,
    enableVideoChat,
    enableScreenShare,
    shareFile,
    getStatusColor,
    isUserOnline
  } = useCollaboration({
    projectId,
    autoConnect: false,
    enableNotifications: true
  });

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastSeen'>('name');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [videoChatEnabled, setVideoChatEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  // Demo data generation
  useEffect(() => {
    const generateDemoData = () => {
      if (!currentUser) {
        // Set demo current user
        const demoUser = {
          id: 'user-1',
          name: 'João Silva',
          email: 'joao@studio.com',
          avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20of%20a%20young%20developer%20with%20glasses&image_size=square',
          status: 'online' as const,
          lastSeen: Date.now()
        };
        // Note: In real implementation, this would be handled by authentication
      }
    };

    generateDemoData();
  }, [currentUser]);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter and sort participants
  const filteredParticipants = participants
    .filter(participant => {
      const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           participant.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'online' && participant.status === 'online') ||
                           (filterStatus === 'offline' && participant.status === 'offline');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'lastSeen':
          return b.lastSeen - a.lastSeen;
        default:
          return 0;
      }
    });

  // Status cards data
  const statusCards = [
    {
      title: 'Participantes Ativos',
      value: participants.filter(p => p.status === 'online').length,
      total: participants.length,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Alterações Pendentes',
      value: changes.filter(c => !c.metadata?.applied).length,
      total: changes.length,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Conflitos Ativos',
      value: conflicts.filter(c => c.status === 'pending').length,
      total: conflicts.length,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Status da Conexão',
      value: isOnline ? 'Online' : 'Offline',
      icon: isOnline ? Wifi : WifiOff,
      color: isOnline ? 'text-green-500' : 'text-red-500',
      bgColor: isOnline ? 'bg-green-50' : 'bg-red-50'
    }
  ];

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'participants', label: 'Participantes', icon: Users },
    { id: 'changes', label: 'Alterações', icon: FileText },
    { id: 'conflicts', label: 'Conflitos', icon: AlertTriangle },
    { id: 'communication', label: 'Comunicação', icon: MessageSquare },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  // Handle file sharing
  const handleFileShare = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await shareFile(file);
      } catch (error) {
        console.error('Failed to share file:', error);
      }
    }
  };

  // Handle conflict resolution
  const handleResolveConflict = async (conflictId: string, strategy: 'merge' | 'overwrite' | 'manual' | 'rollback') => {
    try {
      await resolveConflict(conflictId, strategy);
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  // Handle voice chat toggle
  const handleVoiceChatToggle = async () => {
    try {
      if (!voiceChatEnabled) {
        await enableVoiceChat();
        setVoiceChatEnabled(true);
      } else {
        setVoiceChatEnabled(false);
      }
    } catch (error) {
      console.error('Failed to toggle voice chat:', error);
    }
  };

  // Handle video chat toggle
  const handleVideoChatToggle = async () => {
    try {
      if (!videoChatEnabled) {
        await enableVideoChat();
        setVideoChatEnabled(true);
      } else {
        setVideoChatEnabled(false);
      }
    } catch (error) {
      console.error('Failed to toggle video chat:', error);
    }
  };

  // Handle screen share toggle
  const handleScreenShareToggle = async () => {
    try {
      if (!screenShareEnabled) {
        await enableScreenShare();
        setScreenShareEnabled(true);
      } else {
        setScreenShareEnabled(false);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Colaboração em Tempo Real</h1>
              <p className="text-purple-100">
                {activeSession ? `Sessão: ${activeSession.name}` : 'Nenhuma sessão ativa'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {isSyncing && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-100 rounded-full">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Sincronizando</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof card.value === 'number' && card.total !== undefined 
                        ? `${card.value}/${card.total}`
                        : card.value
                      }
                    </p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${card.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6 h-96 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Session Info */}
            {activeSession && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações da Sessão</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome da Sessão</p>
                    <p className="font-medium">{activeSession.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Criado por</p>
                    <p className="font-medium">{activeSession.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Criado em</p>
                    <p className="font-medium">{new Date(activeSession.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participantes</p>
                    <p className="font-medium">{activeSession.participants.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Convidar</span>
                </button>
                <button
                  onClick={forceSync}
                  disabled={!isOnline}
                  className="flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                >
                  <Sync className="w-4 h-4" />
                  <span className="text-sm font-medium">Sincronizar</span>
                </button>
                <label className="flex items-center justify-center space-x-2 p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Compartilhar</span>
                  <input
                    type="file"
                    onChange={handleFileShare}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                </label>
                <button
                  onClick={() => activeSession ? leaveSession() : null}
                  disabled={!activeSession}
                  className="flex items-center justify-center space-x-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Atividade Recente</h3>
              <div className="space-y-3">
                {changes.slice(-5).map((change, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {change.type} em {change.elementType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(change.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {changes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar participantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'online' | 'offline')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'status' | 'lastSeen')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="name">Ordenar por Nome</option>
                <option value="status">Ordenar por Status</option>
                <option value="lastSeen">Ordenar por Última Atividade</option>
              </select>
            </div>

            {/* Participants List */}
            <div className="space-y-3">
              {filteredParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        participant.status === 'online' ? 'bg-green-500' :
                        participant.status === 'away' ? 'bg-yellow-500' :
                        participant.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participant.name}</p>
                      <p className="text-sm text-gray-500">{participant.email}</p>
                      <p className="text-xs text-gray-400">
                        Última atividade: {formatDuration(Date.now() - participant.lastSeen)} atrás
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      participant.status === 'online' ? 'bg-green-100 text-green-800' :
                      participant.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                      participant.status === 'busy' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {participant.status}
                    </span>
                    {participant.id !== currentUser?.id && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => transferOwnership(participant.id)}
                          className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                          title="Transferir Propriedade"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => kickUser(participant.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Remover Usuário"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredParticipants.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum participante encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Changes Tab */}
        {activeTab === 'changes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Histórico de Alterações</h3>
              <div className="flex space-x-2">
                <button
                  onClick={forceSync}
                  disabled={!isOnline}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
                >
                  Sincronizar Agora
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {changes.map((change) => (
                <div key={change.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        change.type === 'insert' ? 'bg-green-500' :
                        change.type === 'delete' ? 'bg-red-500' :
                        change.type === 'update' ? 'bg-blue-500' :
                        change.type === 'move' ? 'bg-purple-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="font-medium capitalize">{change.type}</span>
                      <span className="text-gray-500">em {change.elementType}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(change.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Elemento: {change.elementId}
                  </p>
                  {change.content && (
                    <div className="text-xs bg-white p-2 rounded border">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(change.content, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
              {changes.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma alteração registrada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conflicts Tab */}
        {activeTab === 'conflicts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Resolução de Conflitos</h3>
              <div className="text-sm text-gray-500">
                {conflicts.filter(c => c.status === 'pending').length} conflitos pendentes
              </div>
            </div>
            
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        conflict.severity === 'low' ? 'text-blue-500' :
                        conflict.severity === 'medium' ? 'text-yellow-500' :
                        conflict.severity === 'high' ? 'text-orange-500' : 'text-red-500'
                      }`} />
                      <span className="font-medium">{conflict.type.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        conflict.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        conflict.status === 'resolving' ? 'bg-blue-100 text-blue-800' :
                        conflict.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {conflict.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(conflict.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {conflict.changes.length} alterações conflitantes
                    </p>
                    <div className="space-y-1">
                      {conflict.changes.map((change, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <span className="font-medium">Usuário {change.userId}:</span> {change.type} em {change.elementId}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {conflict.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'merge')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Mesclar
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'overwrite')}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Sobrescrever
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'rollback')}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Reverter
                      </button>
                    </div>
                  )}
                  
                  {conflict.resolution && (
                    <div className="mt-3 p-2 bg-green-50 rounded border">
                      <p className="text-sm text-green-800">
                        Resolvido por {conflict.resolution.resolvedBy} usando estratégia: {conflict.resolution.strategy}
                      </p>
                      <p className="text-xs text-green-600">
                        {new Date(conflict.resolution.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {conflicts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum conflito detectado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <div className="space-y-6">
            {/* Communication Controls */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles de Comunicação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleVoiceChatToggle}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg transition-colors ${
                    voiceChatEnabled 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {voiceChatEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  <span className="font-medium">
                    {voiceChatEnabled ? 'Desativar Áudio' : 'Ativar Áudio'}
                  </span>
                </button>
                
                <button
                  onClick={handleVideoChatToggle}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg transition-colors ${
                    videoChatEnabled 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {videoChatEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  <span className="font-medium">
                    {videoChatEnabled ? 'Desativar Vídeo' : 'Ativar Vídeo'}
                  </span>
                </button>
                
                <button
                  onClick={handleScreenShareToggle}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg transition-colors ${
                    screenShareEnabled 
                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Share className="w-5 h-5" />
                  <span className="font-medium">
                    {screenShareEnabled ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Communication */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comunicação Ativa</h3>
              {(voiceChatEnabled || videoChatEnabled || screenShareEnabled) ? (
                <div className="space-y-3">
                  {voiceChatEnabled && (
                    <div className="flex items-center space-x-3 p-3 bg-green-100 rounded-lg">
                      <Volume2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Chat de voz ativo</span>
                    </div>
                  )}
                  {videoChatEnabled && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-100 rounded-lg">
                      <Video className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Chat de vídeo ativo</span>
                    </div>
                  )}
                  {screenShareEnabled && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-100 rounded-lg">
                      <Monitor className="w-5 h-5 text-purple-600" />
                      <span className="text-purple-800 font-medium">Compartilhamento de tela ativo</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma comunicação ativa</p>
                  <p className="text-sm text-gray-400">Ative áudio, vídeo ou compartilhamento de tela para começar</p>
                </div>
              )}
            </div>

            {/* Participants in Communication */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participantes na Comunicação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {participants.filter(p => p.status === 'online').map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                    <div className="relative">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.name}</p>
                    </div>
                    <div className="flex space-x-1">
                      {voiceChatEnabled && <Mic className="w-4 h-4 text-green-500" />}
                      {videoChatEnabled && <Video className="w-4 h-4 text-blue-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Session Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações da Sessão</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sincronização Automática</p>
                    <p className="text-sm text-gray-500">Sincronizar alterações automaticamente</p>
                  </div>
                  <button
                    onClick={() => isSyncing ? stopSync() : startSync()}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isSyncing ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSyncing ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Indicadores de Presença</p>
                    <p className="text-sm text-gray-500">Mostrar cursores e seleções de outros usuários</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Resolução Automática de Conflitos</p>
                    <p className="text-sm text-gray-500">Tentar resolver conflitos automaticamente</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Communication Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Comunicação</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chat de Voz</p>
                    <p className="text-sm text-gray-500">Permitir comunicação por voz</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chat de Vídeo</p>
                    <p className="text-sm text-gray-500">Permitir comunicação por vídeo</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compartilhamento de Tela</p>
                    <p className="text-sm text-gray-500">Permitir compartilhamento de tela</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compartilhamento de Arquivos</p>
                    <p className="text-sm text-gray-500">Permitir compartilhamento de arquivos</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Segurança</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Participantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    defaultValue="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Requer Aprovação para Entrar</p>
                    <p className="text-sm text-gray-500">Novos participantes precisam de aprovação</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Permitir Usuários Anônimos</p>
                    <p className="text-sm text-gray-500">Permitir participação sem login</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Convidar Participante</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Participante
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    if (inviteEmail) {
                      try {
                        await inviteUser(inviteEmail);
                        setInviteEmail('');
                        setShowInviteModal(false);
                      } catch (error) {
                        console.error('Failed to invite user:', error);
                      }
                    }
                  }}
                  disabled={!inviteEmail || isLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Convite'}
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationManager;