import React, { useState, useEffect, useMemo } from 'react';
import {
  useRealtimeComments,
  useCommentStats,
  useCommentConfig,
  useCommentNotifications,
  useCommentThreads,
  useCommentCollaboration
} from '../../hooks/useRealtimeComments';
import {
  MessageSquare,
  Users,
  Bell,
  Settings,
  BarChart3,
  Filter,
  Search,
  Plus,
  Reply,
  Heart,
  CheckCircle,
  Archive,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Edit,
  Send,
  Mic,
  Image,
  Paperclip,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';

interface RealtimeCommentsManagerProps {
  timelineId?: string;
  userId?: string;
  userName?: string;
  className?: string;
}

const RealtimeCommentsManager: React.FC<RealtimeCommentsManagerProps> = ({
  timelineId = 'timeline_1',
  userId = 'user_1',
  userName = 'Usuário Demo',
  className = ''
}) => {
  // Hooks
  const comments = useRealtimeComments(timelineId, userId, userName);
  const stats = useCommentStats();
  const config = useCommentConfig();
  const notifications = useCommentNotifications();
  const threads = useCommentThreads();
  const collaboration = useCommentCollaboration();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState<{ [key: string]: string }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [showTestArea, setShowTestArea] = useState(false);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (comments.isConnected && timelineId) {
        // Auto-refresh would happen in the hook
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [comments.isConnected, timelineId]);
  
  // Generate demo data on mount
  useEffect(() => {
    const generateDemoData = async () => {
      if (comments.computed.commentCount === 0 && comments.isConnected) {
        await comments.debugHelpers.simulateActivity();
      }
    };
    
    const timer = setTimeout(generateDemoData, 1000);
    return () => clearTimeout(timer);
  }, [comments.computed.commentCount, comments.isConnected]);
  
  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = comments.filteredComments;
    
    if (searchQuery) {
      filtered = filtered.filter(comment =>
        comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.userId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      switch (comments.sortBy) {
        case 'timestamp':
          return comments.sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.metadata.priority as keyof typeof priorityOrder] || 2;
          const bPriority = priorityOrder[b.metadata.priority as keyof typeof priorityOrder] || 2;
          return comments.sortOrder === 'asc' ? aPriority - bPriority : bPriority - aPriority;
        case 'status':
          return comments.sortOrder === 'asc' 
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        default:
          return b.timestamp - a.timestamp;
      }
    });
  }, [comments.filteredComments, searchQuery, comments.sortBy, comments.sortOrder]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Comentários',
      value: comments.computed.commentCount,
      icon: MessageSquare,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Comentários Ativos',
      value: comments.computed.activeCommentCount,
      icon: Activity,
      color: 'green',
      change: '+5%'
    },
    {
      title: 'Resolvidos',
      value: comments.computed.resolvedCommentCount,
      icon: CheckCircle,
      color: 'purple',
      change: '+8%'
    },
    {
      title: 'Participantes Online',
      value: comments.computed.onlineParticipantCount,
      icon: Users,
      color: 'orange',
      change: '+2'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'comments', label: 'Comentários', icon: MessageSquare },
    { id: 'threads', label: 'Threads', icon: Reply },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'collaboration', label: 'Colaboração', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'events', label: 'Eventos', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Handle comment selection
  const handleCommentSelect = (commentId: string) => {
    setSelectedComments(prev => 
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedComments.length === 0) return;
    
    try {
      switch (action) {
        case 'resolve':
          await comments.quickActions.bulkResolve(selectedComments);
          break;
        case 'archive':
          await comments.quickActions.bulkArchive(selectedComments);
          break;
        case 'delete':
          await comments.advancedFeatures.batchOperations.deleteMultiple(selectedComments);
          break;
      }
      setSelectedComments([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };
  
  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await comments.quickActions.addTextComment(newComment, {
        x: Math.random() * 800,
        y: Math.random() * 600,
        time: Math.random() * 3600
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };
  
  // Handle add reply
  const handleAddReply = async (commentId: string) => {
    const replyContent = newReply[commentId];
    if (!replyContent?.trim()) return;
    
    try {
      await comments.quickActions.quickReply(commentId, replyContent);
      setNewReply(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };
  
  // Render status card
  const renderStatusCard = (card: typeof statusCards[0]) => {
    const Icon = card.icon;
    
    return (
      <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${card.color}-100`}>
            <Icon className={`h-6 w-6 text-${card.color}-600`} />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-sm text-green-600 font-medium">{card.change}</span>
          <span className="text-sm text-gray-500 ml-1">vs último período</span>
        </div>
      </div>
    );
  };
  
  // Render comment item
  const renderCommentItem = (comment: any) => {
    const isSelected = selectedComments.includes(comment.id);
    const priorityColors = {
      urgent: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green'
    };
    
    const priorityColor = priorityColors[comment.metadata.priority as keyof typeof priorityColors] || 'gray';
    
    return (
      <div
        key={comment.id}
        className={`border rounded-lg p-4 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCommentSelect(comment.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">{comment.userId}</span>
                <span className={`px-2 py-1 text-xs rounded-full bg-${priorityColor}-100 text-${priorityColor}-800`}>
                  {comment.metadata.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  comment.status === 'active' ? 'bg-green-100 text-green-800' :
                  comment.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {comment.status}
                </span>
                <span className="text-xs text-gray-500">
                  {comments.utilities.formatters.formatTime(comment.timestamp)}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3">{comment.content}</p>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Posição: {comments.utilities.formatters.formatPosition(comment.position)}</span>
                <span>•</span>
                <span>{comment.replies.length} respostas</span>
                <span>•</span>
                <span>{comment.reactions.length} reações</span>
              </div>
              
              {comment.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200">
                  {comment.replies.slice(0, 2).map((reply: any) => (
                    <div key={reply.id} className="mb-2 last:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{reply.userId}</span>
                        <span className="text-xs text-gray-500">
                          {comments.utilities.formatters.formatTime(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{reply.content}</p>
                    </div>
                  ))}
                  {comment.replies.length > 2 && (
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Ver mais {comment.replies.length - 2} respostas
                    </button>
                  )}
                </div>
              )}
              
              {/* Reply input */}
              <div className="mt-3 flex space-x-2">
                <input
                  type="text"
                  placeholder="Adicionar resposta..."
                  value={newReply[comment.id] || ''}
                  onChange={(e) => setNewReply(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                />
                <button
                  onClick={() => handleAddReply(comment.id)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => comments.quickActions.quickReaction(comment.id, '👍')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              onClick={() => comments.quickActions.quickResolve(comment.id)}
              className="p-2 text-gray-400 hover:text-green-600"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedComment(comment.id)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statusCards.map(renderStatusCard)}
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {((stats.resolutionRate || 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Taxa de Resolução</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {(stats.engagementRate || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Taxa de Engajamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {(stats.averageRepliesPerComment || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Respostas por Comentário</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {collaboration.onlineParticipants.length}
                  </p>
                  <p className="text-sm text-gray-600">Usuários Online</p>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
              <div className="space-y-3">
                {comments.events.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.type}</p>
                      <p className="text-xs text-gray-500">
                        {comments.utilities.formatters.formatTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'comments':
        return (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar comentários..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtros</span>
                  </button>
                  <button
                    onClick={() => setShowTestArea(!showTestArea)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Comentário</span>
                  </button>
                </div>
              </div>
              
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="">Todos</option>
                        <option value="active">Ativo</option>
                        <option value="resolved">Resolvido</option>
                        <option value="archived">Arquivado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridade
                      </label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="">Todas</option>
                        <option value="urgent">Urgente</option>
                        <option value="high">Alta</option>
                        <option value="medium">Média</option>
                        <option value="low">Baixa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="">Todos</option>
                        <option value="text">Texto</option>
                        <option value="annotation">Anotação</option>
                        <option value="suggestion">Sugestão</option>
                        <option value="voice">Voz</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Bulk Actions */}
            {selectedComments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedComments.length} comentário(s) selecionado(s)
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('resolve')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Resolver
                    </button>
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Arquivar
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Comments List */}
            <div className="space-y-4">
              {filteredData.length > 0 ? (
                filteredData.map(renderCommentItem)
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum comentário encontrado</h3>
                  <p className="text-gray-500">Comece adicionando um novo comentário.</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'threads':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Threads de Comentários</h3>
              <div className="space-y-4">
                {threads.activeThreads.length > 0 ? (
                  threads.activeThreads.map((thread) => (
                    <div key={thread.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{thread.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          thread.status === 'active' ? 'bg-green-100 text-green-800' :
                          thread.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {thread.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{thread.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{thread.commentIds.length} comentários</span>
                        <span>{thread.participants.length} participantes</span>
                        <span>Prioridade: {thread.priority}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Reply className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhuma thread ativa</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={notifications.markAllAsRead}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Marcar todas como lidas
                  </button>
                  <button
                    onClick={notifications.clear}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {notifications.notifications.length > 0 ? (
                  notifications.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {comments.utilities.formatters.formatTime(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => notifications.markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhuma notificação</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'collaboration':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Colaboração em Tempo Real</h3>
              
              {/* Online Participants */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Participantes Online</h4>
                <div className="flex flex-wrap gap-2">
                  {collaboration.onlineParticipants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{participant.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Typing Indicators */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Digitando</h4>
                <div className="space-y-2">
                  {collaboration.getTypingUsers().map((userName) => (
                    <div key={userName} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>{userName} está digitando...</span>
                    </div>
                  ))}
                  {collaboration.getTypingUsers().length === 0 && (
                    <p className="text-sm text-gray-500">Ninguém está digitando</p>
                  )}
                </div>
              </div>
              
              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Permissões</h4>
                <div className="space-y-2">
                  {Object.values(collaboration.participants).map((participant) => (
                    <div key={participant.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{participant.userName}</span>
                      <div className="flex space-x-2">
                        {participant.permissions?.canComment && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Comentar</span>
                        )}
                        {participant.permissions?.canResolve && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Resolver</span>
                        )}
                        {participant.permissions?.canModerate && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Moderar</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics de Comentários</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {((stats.resolutionRate || 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Taxa de Resolução</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {(stats.engagementRate || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Engajamento Médio</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {(stats.averageRepliesPerComment || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Respostas por Comentário</p>
                </div>
              </div>
              
              {/* Export Options */}
              <div className="flex space-x-2">
                <button
                  onClick={() => comments.analyticsHelpers.exportReport('json')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  onClick={() => comments.analyticsHelpers.exportReport('csv')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'events':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log de Eventos</h3>
              <div className="space-y-3">
                {comments.events.length > 0 ? (
                  comments.events.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{event.type}</p>
                          <span className="text-xs text-gray-500">
                            {comments.utilities.formatters.formatTime(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{event.userId}</p>
                        {event.data && (
                          <pre className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum evento registrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
              
              <div className="space-y-6">
                {/* General Settings */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Configurações Gerais</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-700">Comentários de Voz</label>
                        <p className="text-sm text-gray-500">Permitir comentários em áudio</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.config.enableVoiceComments}
                        onChange={(e) => config.updateConfig({ enableVoiceComments: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-700">Menções</label>
                        <p className="text-sm text-gray-500">Permitir mencionar outros usuários</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.config.enableMentions}
                        onChange={(e) => config.updateConfig({ enableMentions: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-gray-700">Reações</label>
                        <p className="text-sm text-gray-500">Permitir reações nos comentários</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.config.enableReactions}
                        onChange={(e) => config.updateConfig({ enableReactions: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Limits */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Limites</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamanho máximo do comentário
                      </label>
                      <input
                        type="number"
                        value={config.config.maxCommentLength}
                        onChange={(e) => config.updateConfig({ maxCommentLength: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamanho máximo da resposta
                      </label>
                      <input
                        type="number"
                        value={config.config.maxReplyLength}
                        onChange={(e) => config.updateConfig({ maxReplyLength: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Presets */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Predefinições</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => comments.configHelpers.applyPreset('strict')}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Restritivo
                    </button>
                    <button
                      onClick={() => comments.configHelpers.applyPreset('relaxed')}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Flexível
                    </button>
                    <button
                      onClick={() => comments.configHelpers.applyPreset('collaborative')}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Colaborativo
                    </button>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <button
                    onClick={config.resetConfig}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Restaurar Padrões
                  </button>
                  <button
                    onClick={() => comments.systemOperations.backup()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Fazer Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Conteúdo não encontrado</div>;
    }
  };
  
  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Comentários em Tempo Real</h1>
            <p className="text-gray-600 mt-2">
              Gerencie comentários, colaboração e feedback no timeline de edição
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {comments.isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Desconectado</span>
                </>
              )}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => comments.actions.connect()}
              disabled={comments.isConnecting}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${comments.isConnecting ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Debug Button */}
            <button
              onClick={comments.debugHelpers.logState}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Debug
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {comments.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{comments.error}</span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusCards.map(renderStatusCard)}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'notifications' && notifications.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Test Area */}
      {showTestArea && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Área de Teste</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo Comentário
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Digite seu comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={comments.debugHelpers.simulateActivity}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Simular Atividade
              </button>
              <button
                onClick={() => comments.systemOperations.healthCheck()}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Verificar Saúde
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Comment Details Modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes do Comentário</h3>
                <button
                  onClick={() => setSelectedComment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {comments.comments[selectedComment] && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                    <p className="text-gray-900">{comments.comments[selectedComment].content}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                      <p className="text-gray-900">{comments.comments[selectedComment].userId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <p className="text-gray-900">{comments.comments[selectedComment].status}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
                    <p className="text-gray-900">
                      {comments.utilities.formatters.formatPosition(comments.comments[selectedComment].position)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-gray-900">
                      {comments.utilities.formatters.formatTime(comments.comments[selectedComment].timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => {
                        comments.quickActions.quickResolve(selectedComment);
                        setSelectedComment(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Resolver
                    </button>
                    <button
                      onClick={() => {
                        comments.actions.archiveComment(selectedComment);
                        setSelectedComment(null);
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Arquivar
                    </button>
                    <button
                      onClick={() => {
                        comments.actions.deleteComment(selectedComment);
                        setSelectedComment(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeCommentsManager;