import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Clock, Users, Filter, Search, Settings, 
  Plus, Reply, Heart, Paperclip, Tag, AlertCircle,
  CheckCircle, Archive, Trash2, Edit3, Send, X,
  MoreHorizontal, Eye, EyeOff, Bell, BellOff,
  Download, Upload, RefreshCw, Zap, TrendingUp,
  BarChart3, PieChart, Activity, Target, Layers,
  Hash, AtSign, Calendar, MapPin, Star, Flag
} from 'lucide-react';
import { useTimelineComments, useCommentStats, useCommentNotifications, useCommentRealTime } from '../../hooks/useTimelineComments';
import { TimelineComment, CommentFilter, CommentThread } from '../../services/timelineCommentsService';

interface TimelineCommentsManagerProps {
  timelineId?: string;
  className?: string;
}

const TimelineCommentsManager: React.FC<TimelineCommentsManagerProps> = ({ 
  timelineId = 'default',
  className = '' 
}) => {
  // Hooks
  const {
    comments,
    threads,
    filteredComments,
    isLoading,
    error,
    filter,
    searchQuery,
    config,
    addComment,
    updateComment,
    deleteComment,
    replyToComment,
    resolveComment,
    archiveComment,
    addReaction,
    setFilter,
    setSearchQuery,
    refreshComments,
    simulateComment,
    clearAllComments
  } = useTimelineComments();
  
  const { stats, engagementMetrics } = useCommentStats();
  const { notifications, unreadCount, markAllNotificationsRead } = useCommentNotifications();
  const { connectedUsers, typingUsers, isConnected } = useCommentRealTime();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNewCommentModal, setShowNewCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState<TimelineComment | null>(null);
  const [newCommentData, setNewCommentData] = useState({
    content: '',
    timestamp: 0,
    priority: 'medium' as const,
    tags: [] as string[],
    mentions: [] as string[]
  });
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (config.realTimeSync) {
        refreshComments();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [config.realTimeSync, refreshComments]);
  
  // Demo data generation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (comments.length === 0) {
        for (let i = 0; i < 8; i++) {
          simulateComment();
        }
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [comments.length, simulateComment]);
  
  // Filtered and sorted data
  const sortedComments = useMemo(() => {
    return [...filteredComments].sort((a, b) => {
      switch (activeTab) {
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'timeline':
          return a.timestamp - b.timestamp;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return a.timestamp - b.timestamp;
      }
    });
  }, [filteredComments, activeTab]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Comentários',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Comentários Ativos',
      value: stats.active,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+8%'
    },
    {
      title: 'Resolvidos',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%'
    },
    {
      title: 'Usuários Conectados',
      value: connectedUsers.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: isConnected ? 'Online' : 'Offline'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'recent', label: 'Recentes', icon: Activity },
    { id: 'threads', label: 'Conversas', icon: MessageSquare },
    { id: 'priority', label: 'Prioridade', icon: Flag },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
  
  // Handle new comment
  const handleAddComment = async () => {
    if (!newCommentData.content.trim()) return;
    
    await addComment({
      timelineId,
      userId: 'current-user',
      userName: 'Usuário Atual',
      content: newCommentData.content,
      timestamp: newCommentData.timestamp,
      mentions: newCommentData.mentions,
      attachments: [],
      status: 'active',
      priority: newCommentData.priority,
      tags: newCommentData.tags,
      metadata: {}
    });
    
    setNewCommentData({
      content: '',
      timestamp: 0,
      priority: 'medium',
      tags: [],
      mentions: []
    });
    setShowNewCommentModal(false);
  };
  
  // Format time
  const formatTime = (timestamp: number) => {
    const minutes = Math.floor(timestamp / 60000);
    const seconds = Math.floor((timestamp % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'archived': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Comentários do Timeline
              </h2>
              <p className="text-sm text-gray-600">
                Sistema de colaboração em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>{unreadCount}</span>
              </button>
            )}
            
            <button
              onClick={() => setShowNewCommentModal(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Comentário</span>
            </button>
            
            <button
              onClick={refreshComments}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar comentários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ status: e.target.value as any || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="resolved">Resolvido</option>
            <option value="archived">Arquivado</option>
          </select>
          
          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter({ priority: e.target.value as any || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando comentários...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Taxa de Engajamento</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {engagementMetrics.avgReactionsPerComment.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Taxa de Resolução</p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.resolutionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Threads Ativas</p>
                    <p className="text-2xl font-bold text-purple-900">{threads.length}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Comments */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentários Recentes</h3>
              <div className="space-y-3">
                {sortedComments.slice(0, 5).map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {comment.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(comment.priority)}`}>
                          {comment.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {(activeTab === 'timeline' || activeTab === 'recent' || activeTab === 'priority') && (
          <div className="space-y-4">
            {/* Bulk Actions */}
            {selectedComments.length > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {selectedComments.length} comentário(s) selecionado(s)
                </span>
                <button
                  onClick={() => {
                    selectedComments.forEach(id => resolveComment(id));
                    setSelectedComments([]);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Resolver
                </button>
                <button
                  onClick={() => {
                    selectedComments.forEach(id => archiveComment(id));
                    setSelectedComments([]);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Arquivar
                </button>
              </div>
            )}
            
            {/* Comments List */}
            <div className="space-y-3">
              {sortedComments.map((comment) => (
                <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={() => handleCommentSelect(comment.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {comment.userName.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(comment.status)}`}>
                          {comment.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(comment.priority)}`}>
                          {comment.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
                      
                      {comment.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mb-3">
                          {comment.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => addReaction(comment.id, '👍')}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{comment.reactions.length}</span>
                        </button>
                        
                        <button
                          onClick={() => replyToComment(comment.id, {
                            timelineId,
                            userId: 'current-user',
                            userName: 'Usuário Atual',
                            content: 'Resposta de exemplo',
                            timestamp: comment.timestamp,
                            mentions: [],
                            attachments: [],
                            status: 'active',
                            priority: 'medium',
                            tags: [],
                            metadata: {}
                          })}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          <span className="text-xs">Responder</span>
                        </button>
                        
                        {comment.status === 'active' && (
                          <button
                            onClick={() => resolveComment(comment.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Resolver</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => setSelectedComment(comment)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'threads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Conversas Ativas</h3>
              <span className="text-sm text-gray-500">{threads.length} thread(s)</span>
            </div>
            
            {threads.map((thread) => (
              <div key={thread.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">{thread.rootComment.userName}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        thread.isResolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {thread.isResolved ? 'Resolvida' : 'Ativa'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {thread.totalReplies} resposta(s)
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{thread.rootComment.content}</p>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        Participantes: {thread.participants.length}
                      </span>
                      <span className="text-xs text-gray-500">
                        Última atividade: {thread.lastActivity.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Engagement Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engajamento por Prioridade</h3>
                <div className="space-y-3">
                  {Object.entries(stats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{priority}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              priority === 'urgent' ? 'bg-red-500' :
                              priority === 'high' ? 'bg-orange-500' :
                              priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Activity Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {notification.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real-time Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações em Tempo Real</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Sincronização Automática</span>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.realTimeSync ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.realTimeSync ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Notificações</span>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-salvar</span>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <button
                    onClick={simulateComment}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Simular Comentário</span>
                  </button>
                  
                  <button
                    onClick={refreshComments}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Atualizar Dados</span>
                  </button>
                  
                  <button
                    onClick={clearAllComments}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Todos</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* New Comment Modal */}
      {showNewCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Comentário</h3>
              <button
                onClick={() => setShowNewCommentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={newCommentData.content}
                  onChange={(e) => setNewCommentData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Digite seu comentário..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp (ms)
                </label>
                <input
                  type="number"
                  value={newCommentData.timestamp}
                  onChange={(e) => setNewCommentData(prev => ({ ...prev, timestamp: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={newCommentData.priority}
                  onChange={(e) => setNewCommentData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewCommentModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newCommentData.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineCommentsManager;