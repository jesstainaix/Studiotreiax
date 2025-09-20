import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Smile, 
  Frown, 
  Angry,
  Users, 
  Filter, 
  Search, 
  Settings, 
  Bell, 
  BellOff, 
  Eye, 
  EyeOff, 
  Archive, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Lightbulb, 
  Clock, 
  User, 
  Tag, 
  Paperclip, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Flag, 
  Share,
  Download,
  Upload,
  RefreshCw,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { 
  useRealtimeComments, 
  useCommentStats, 
  useCommentConfig, 
  useCommentSearch,
  useCommentCollaboration,
  useCommentNotifications,
  useCommentThreads,
  useCommentTimeline,
  useCommentRealtime
} from '../../hooks/useRealtimeComments';
import { 
  Comment, 
  CommentThread, 
  CommentFilter,
  formatCommentTime,
  getCommentTypeColor,
  getCommentTypeIcon,
  getPriorityColor,
  getStatusColor,
  calculateEngagementScore
} from '../../services/realtimeCommentsService';

interface RealtimeCommentsTimelineProps {
  timelineDuration?: number;
  currentPosition?: number;
  onPositionChange?: (position: number) => void;
  className?: string;
}

export const RealtimeCommentsTimeline: React.FC<RealtimeCommentsTimelineProps> = ({
  timelineDuration = 300,
  currentPosition = 0,
  onPositionChange,
  className = ''
}) => {
  const {
    comments,
    threads,
    activeComment,
    selectedComments,
    filter,
    config,
    isLoading,
    error,
    isConnected,
    filteredComments,
    sortedComments,
    unreadNotifications,
    criticalComments,
    hasActiveComments,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    archiveComment,
    addReply,
    addReaction,
    selectComment,
    clearSelection,
    navigateToComment,
    navigateToTimelinePosition,
    quickReply,
    quickResolve,
    quickArchive,
    clearError
  } = useRealtimeComments();
  
  const { stats } = useCommentStats();
  const { updateConfig } = useCommentConfig();
  const { searchQuery, updateSearchQuery, clearSearch } = useCommentSearch();
  const { collaboration, activeUsers, updateCursor } = useCommentCollaboration();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCommentNotifications();
  const { activeThreads, createThread } = useCommentThreads();
  const { commentsByTimelinePosition, getCommentsAtPosition, getTimelineRange } = useCommentTimeline();
  const { connectionStatus, connect, disconnect, forceSync } = useCommentRealtime();
  
  // Local State
  const [activeTab, setActiveTab] = useState<'timeline' | 'comments' | 'threads' | 'collaboration' | 'analytics' | 'settings'>('timeline');
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newCommentPosition, setNewCommentPosition] = useState(currentPosition);
  const [newCommentType, setNewCommentType] = useState<Comment['type']>('general');
  const [newCommentPriority, setNewCommentPriority] = useState<Comment['priority']>('medium');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedTimelinePosition, setSelectedTimelinePosition] = useState<number | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showUserCursors, setShowUserCursors] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (comments.length === 0) {
        // Add some demo comments
        const demoComments = [
          {
            timelinePosition: 15,
            content: 'Great transition here! The music sync is perfect.',
            author: {
              id: 'user1',
              name: 'Maria Silva',
              avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20smiling&image_size=square',
              role: 'editor' as const
            },
            type: 'general' as const,
            status: 'active' as const,
            priority: 'medium' as const,
            tags: ['transition', 'music'],
            attachments: [],
            replies: [],
            reactions: [],
            mentions: [],
            visibility: 'public' as const,
            position: { x: 100, y: 50 }
          },
          {
            timelinePosition: 45,
            content: 'We need to fix the audio levels in this segment. The dialogue is too quiet.',
            author: {
              id: 'user2',
              name: 'João Santos',
              avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20avatar%20focused&image_size=square',
              role: 'reviewer' as const
            },
            type: 'issue' as const,
            status: 'active' as const,
            priority: 'high' as const,
            tags: ['audio', 'dialogue'],
            attachments: [],
            replies: [],
            reactions: [],
            mentions: [],
            visibility: 'public' as const,
            position: { x: 200, y: 80 }
          },
          {
            timelinePosition: 120,
            content: 'Consider adding a subtitle here for better accessibility.',
            author: {
              id: 'user3',
              name: 'Ana Costa',
              avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20creative&image_size=square',
              role: 'admin' as const
            },
            type: 'suggestion' as const,
            status: 'active' as const,
            priority: 'low' as const,
            tags: ['accessibility', 'subtitles'],
            attachments: [],
            replies: [],
            reactions: [],
            mentions: [],
            visibility: 'public' as const,
            position: { x: 300, y: 60 }
          }
        ];
        
        demoComments.forEach(comment => addComment(comment));
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [comments.length, addComment]);
  
  // Status Cards Data
  const statusCards = useMemo(() => [
    {
      title: 'Total Comments',
      value: stats.totalComments.toString(),
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Active Comments',
      value: stats.activeComments.toString(),
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%'
    },
    {
      title: 'Unread Notifications',
      value: unreadCount.toString(),
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+5%'
    },
    {
      title: 'Active Users',
      value: activeUsers.length.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+3%'
    }
  ], [stats, unreadCount, activeUsers.length]);
  
  // Tab Configuration
  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'threads', label: 'Threads', icon: Reply },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: MoreHorizontal },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper Functions
  const getStatusIcon = (status: Comment['status']) => {
    switch (status) {
      case 'active': return Eye;
      case 'resolved': return CheckCircle;
      case 'archived': return Archive;
      default: return MessageCircle;
    }
  };
  
  const getTypeIcon = (type: Comment['type']) => {
    switch (type) {
      case 'general': return MessageCircle;
      case 'suggestion': return Lightbulb;
      case 'issue': return AlertTriangle;
      case 'approval': return CheckCircle;
      case 'question': return HelpCircle;
      default: return MessageCircle;
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleAddComment = async () => {
    if (!newCommentContent.trim()) return;
    
    try {
      await addComment({
        timelinePosition: newCommentPosition,
        content: newCommentContent,
        author: {
          id: 'current-user',
          name: 'Current User',
          role: 'editor'
        },
        type: newCommentType,
        status: 'active',
        priority: newCommentPriority,
        tags: [],
        attachments: [],
        replies: [],
        reactions: [],
        mentions: [],
        visibility: 'public',
        position: { x: Math.random() * 400, y: Math.random() * 200 }
      });
      
      setNewCommentContent('');
      setIsAddingComment(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };
  
  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const position = (clickX / rect.width) * timelineDuration;
    
    setSelectedTimelinePosition(position);
    setNewCommentPosition(position);
    onPositionChange?.(position);
    navigateToTimelinePosition(position);
  };
  
  const handleQuickAction = async (action: string, commentId: string) => {
    try {
      switch (action) {
        case 'reply':
          await quickReply(commentId, 'Quick reply');
          break;
        case 'resolve':
          await quickResolve(commentId);
          break;
        case 'archive':
          await quickArchive(commentId);
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Real-time Comments Timeline</h2>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Connected</span>
              </div>
            ) : connectionStatus === 'connecting' ? (
              <div className="flex items-center space-x-1 text-yellow-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Disconnected</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg transition-colors relative ${
              showNotifications ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading comments...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-green-600">{card.change}</p>
                </div>
                <Icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Timeline Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAddingComment(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Add Comment</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={timelineZoom}
                    onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">{timelineZoom.toFixed(1)}x</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Current: {formatTime(currentPosition)}</span>
                <span className="text-sm text-gray-600">Duration: {formatTime(timelineDuration)}</span>
              </div>
            </div>
            
            {/* Timeline Visualization */}
            <div className="relative">
              {/* Timeline Bar */}
              <div 
                className="relative h-16 bg-gray-100 rounded-lg cursor-pointer overflow-hidden"
                onClick={handleTimelineClick}
                style={{ transform: `scaleX(${timelineZoom})`, transformOrigin: 'left' }}
              >
                {/* Time Markers */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: Math.ceil(timelineDuration / 30) }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-gray-300 flex items-end justify-center pb-1"
                    >
                      <span className="text-xs text-gray-500">{formatTime(i * 30)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Current Position Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${(currentPosition / timelineDuration) * 100}%` }}
                />
                
                {/* Selected Position */}
                {selectedTimelinePosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                    style={{ left: `${(selectedTimelinePosition / timelineDuration) * 100}%` }}
                  />
                )}
                
                {/* Comment Markers */}
                {sortedComments.map((comment) => {
                  const TypeIcon = getTypeIcon(comment.type);
                  return (
                    <div
                      key={comment.id}
                      className={`absolute top-2 w-3 h-3 rounded-full cursor-pointer transform -translate-x-1/2 z-20 ${
                        activeComment?.id === comment.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{ 
                        left: `${(comment.timelinePosition / timelineDuration) * 100}%`,
                        backgroundColor: comment.priority === 'critical' ? '#ef4444' : 
                                       comment.priority === 'high' ? '#f97316' :
                                       comment.priority === 'medium' ? '#eab308' : '#6b7280'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectComment(comment.id);
                        navigateToComment(comment.id);
                      }}
                      title={`${comment.type}: ${comment.content.substring(0, 50)}...`}
                    />
                  );
                })}
                
                {/* User Cursors */}
                {showUserCursors && activeUsers.map((user) => {
                  if (!user.cursor) return null;
                  return (
                    <div
                      key={user.id}
                      className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-15"
                      style={{ left: `${(user.cursor.timelinePosition / timelineDuration) * 100}%` }}
                      title={`${user.name} is here`}
                    />
                  );
                })}
              </div>
              
              {/* Timeline Legend */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>High</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span>Low</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowUserCursors(!showUserCursors)}
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-800"
                >
                  <Users className="h-3 w-3" />
                  <span>{showUserCursors ? 'Hide' : 'Show'} User Cursors</span>
                </button>
              </div>
            </div>
            
            {/* Comments at Current Position */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Comments at {formatTime(currentPosition)}
              </h3>
              
              {getCommentsAtPosition(currentPosition, 5).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments at this position</p>
              ) : (
                <div className="space-y-3">
                  {getCommentsAtPosition(currentPosition, 5).map((comment) => {
                    const TypeIcon = getTypeIcon(comment.type);
                    const StatusIcon = getStatusIcon(comment.status);
                    
                    return (
                      <div
                        key={comment.id}
                        className={`p-4 border rounded-lg transition-all ${
                          activeComment?.id === comment.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => selectComment(comment.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <img
                              src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}`}
                              alt={comment.author.name}
                              className="w-8 h-8 rounded-full"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{comment.author.name}</span>
                                <TypeIcon className={`h-4 w-4 ${getCommentTypeColor(comment.type)}`} />
                                <StatusIcon className={`h-4 w-4 ${getStatusColor(comment.status)}`} />
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  comment.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                  comment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  comment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {comment.priority}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(comment.timelinePosition)}
                                </span>
                              </div>
                              
                              <p className="mt-1 text-gray-700">{comment.content}</p>
                              
                              {comment.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comment.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                      <Tag className="h-3 w-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                <span>{formatCommentTime(comment.createdAt)}</span>
                                {comment.replies.length > 0 && (
                                  <span>{comment.replies.length} replies</span>
                                )}
                                {comment.reactions.length > 0 && (
                                  <span>{comment.reactions.length} reactions</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('reply', comment.id);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Quick Reply"
                            >
                              <Reply className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('resolve', comment.id);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Resolve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('archive', comment.id);
                              }}
                              className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search comments..."
                  value={searchQuery}
                  onChange={(e) => updateSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filter.type || ''}
                onChange={(e) => {
                  const { setFilter } = useRealtimeComments();
                  setFilter({ type: e.target.value as Comment['type'] || undefined });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="general">General</option>
                <option value="suggestion">Suggestion</option>
                <option value="issue">Issue</option>
                <option value="approval">Approval</option>
                <option value="question">Question</option>
              </select>
              
              <select
                value={filter.status || ''}
                onChange={(e) => {
                  const { setFilter } = useRealtimeComments();
                  setFilter({ status: e.target.value as Comment['status'] || undefined });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            {/* Comments List */}
            <div className="space-y-4">
              {filteredComments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No comments found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                filteredComments.map((comment) => {
                  const TypeIcon = getTypeIcon(comment.type);
                  const StatusIcon = getStatusIcon(comment.status);
                  
                  return (
                    <div
                      key={comment.id}
                      className={`p-6 border rounded-lg transition-all ${
                        activeComment?.id === comment.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => selectComment(comment.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img
                            src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}`}
                            alt={comment.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium text-gray-900">{comment.author.name}</span>
                              <span className="text-sm text-gray-500">{comment.author.role}</span>
                              <TypeIcon className={`h-4 w-4 ${getCommentTypeColor(comment.type)}`} />
                              <StatusIcon className={`h-4 w-4 ${getStatusColor(comment.status)}`} />
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                comment.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                comment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                comment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {comment.priority}
                              </span>
                              <span className="text-sm text-gray-500">
                                at {formatTime(comment.timelinePosition)}
                              </span>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{comment.content}</p>
                            
                            {comment.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {comment.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{formatCommentTime(comment.createdAt)}</span>
                                {comment.replies.length > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Reply className="h-3 w-3" />
                                    <span>{comment.replies.length}</span>
                                  </span>
                                )}
                                {comment.reactions.length > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Heart className="h-3 w-3" />
                                    <span>{comment.reactions.length}</span>
                                  </span>
                                )}
                                {comment.attachments.length > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{comment.attachments.length}</span>
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToComment(comment.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Go to Timeline
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('reply', comment.id);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Reply"
                          >
                            <Reply className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addReaction(comment.id, {
                                type: 'like',
                                userId: 'current-user',
                                userName: 'Current User'
                              });
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Like"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('resolve', comment.id);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Resolve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="More options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'threads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Comment Threads</h3>
              <button
                onClick={() => {
                  createThread({
                    title: 'New Thread',
                    comments: [],
                    participants: [],
                    status: 'active',
                    priority: 'medium',
                    tags: [],
                    timelineRange: { start: 0, end: 60 }
                  });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Thread
              </button>
            </div>
            
            {activeThreads.length === 0 ? (
              <div className="text-center py-12">
                <Reply className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active threads</h3>
                <p className="text-gray-500">Create a thread to organize related comments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeThreads.map((thread) => (
                  <div key={thread.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{thread.title}</h4>
                        {thread.description && (
                          <p className="text-gray-600 mt-1">{thread.description}</p>
                        )}
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        thread.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        thread.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        thread.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {thread.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>{thread.comments.length} comments</span>
                        <span>{thread.participants.length} participants</span>
                        <span>Range: {formatTime(thread.timelineRange.start)} - {formatTime(thread.timelineRange.end)}</span>
                      </div>
                      
                      <span>{formatCommentTime(thread.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Active Collaborators</h3>
            
            {activeUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active users</h3>
                <p className="text-gray-500">Collaborators will appear here when they join the session.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeUsers.map((user) => (
                  <div key={user.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {user.isTyping && (
                            <span className="flex items-center space-x-1 text-blue-600">
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                              <span>typing...</span>
                            </span>
                          )}
                          
                          {user.cursor && (
                            <span>at {formatTime(user.cursor.timelinePosition)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-3 h-3 bg-green-500 rounded-full" title="Online" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Comment Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Comments by Type */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Comments by Type</h4>
                <div className="space-y-3">
                  {Object.entries(stats.commentsByType).map(([type, count]) => {
                    const TypeIcon = getTypeIcon(type as Comment['type']);
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TypeIcon className={`h-4 w-4 ${getCommentTypeColor(type as Comment['type'])}`} />
                          <span className="capitalize">{type}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Comments by Priority */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Comments by Priority</h4>
                <div className="space-y-3">
                  {Object.entries(stats.commentsByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          priority === 'critical' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="capitalize">{priority}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Comments by Author */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Most Active Authors</h4>
                <div className="space-y-3">
                  {Object.entries(stats.commentsByAuthor)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([author, count]) => (
                      <div key={author} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span>{author}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              {/* Engagement Metrics */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Engagement Metrics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Average Resolution Time</span>
                    <span className="font-medium">{stats.averageResolutionTime}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Rate</span>
                    <span className="font-medium">{stats.responseRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement Rate</span>
                    <span className="font-medium">{stats.engagementRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Comment Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">General</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Auto Refresh</label>
                    <input
                      type="checkbox"
                      checked={config.autoRefresh}
                      onChange={(e) => updateConfig({ autoRefresh: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Notifications</label>
                    <input
                      type="checkbox"
                      checked={config.enableNotifications}
                      onChange={(e) => updateConfig({ enableNotifications: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Sounds</label>
                    <input
                      type="checkbox"
                      checked={config.enableSounds}
                      onChange={(e) => updateConfig({ enableSounds: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Real-time Sync</label>
                    <input
                      type="checkbox"
                      checked={config.enableRealTimeSync}
                      onChange={(e) => updateConfig({ enableRealTimeSync: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Collaboration Settings */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Collaboration</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Collaboration</label>
                    <input
                      type="checkbox"
                      checked={config.enableCollaboration}
                      onChange={(e) => updateConfig({ enableCollaboration: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Mentions</label>
                    <input
                      type="checkbox"
                      checked={config.enableMentions}
                      onChange={(e) => updateConfig({ enableMentions: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Reactions</label>
                    <input
                      type="checkbox"
                      checked={config.enableReactions}
                      onChange={(e) => updateConfig({ enableReactions: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Threads</label>
                    <input
                      type="checkbox"
                      checked={config.enableThreads}
                      onChange={(e) => updateConfig({ enableThreads: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Performance Settings */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Performance</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refresh Interval (ms)
                    </label>
                    <input
                      type="number"
                      value={config.refreshInterval}
                      onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1000"
                      max="60000"
                      step="1000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Comments Per View
                    </label>
                    <input
                      type="number"
                      value={config.maxCommentsPerView}
                      onChange={(e) => updateConfig({ maxCommentsPerView: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="10"
                      max="200"
                      step="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto Archive After (days)
                    </label>
                    <input
                      type="number"
                      value={config.autoArchiveAfter}
                      onChange={(e) => updateConfig({ autoArchiveAfter: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
              </div>
              
              {/* Connection Settings */}
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Connection</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <div className="flex items-center space-x-2">
                      {connectionStatus === 'connected' ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-green-600">Connected</span>
                        </>
                      ) : connectionStatus === 'connecting' ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="text-sm text-yellow-600">Connecting...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-sm text-red-600">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={connect}
                      disabled={connectionStatus === 'connected'}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Connect
                    </button>
                    
                    <button
                      onClick={disconnect}
                      disabled={connectionStatus === 'disconnected'}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Disconnect
                    </button>
                    
                    <button
                      onClick={forceSync}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Force Sync
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Comment Dialog */}
      {isAddingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position: {formatTime(newCommentPosition)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={timelineDuration}
                  value={newCommentPosition}
                  onChange={(e) => setNewCommentPosition(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={newCommentType}
                  onChange={(e) => setNewCommentType(e.target.value as Comment['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="issue">Issue</option>
                  <option value="approval">Approval</option>
                  <option value="question">Question</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newCommentPriority}
                  onChange={(e) => setNewCommentPriority(e.target.value as Comment['priority'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment
                </label>
                <textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingComment(false);
                  setNewCommentContent('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleAddComment}
                disabled={!newCommentContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-16 right-6 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Bell className="h-4 w-4 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCommentTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeCommentsTimeline;