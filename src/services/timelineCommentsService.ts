import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface TimelineComment {
  id: string;
  timelineId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: number; // Timeline position in milliseconds
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // For replies
  mentions: string[]; // User IDs mentioned
  attachments: CommentAttachment[];
  reactions: CommentReaction[];
  status: 'active' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  metadata: {
    elementId?: string; // Associated timeline element
    layerId?: string;
    version?: string;
    coordinates?: { x: number; y: number };
  };
}

export interface CommentAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  name: string;
  size?: number;
  thumbnail?: string;
}

export interface CommentReaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface CommentThread {
  id: string;
  rootComment: TimelineComment;
  replies: TimelineComment[];
  participants: string[];
  lastActivity: Date;
  isResolved: boolean;
  totalReplies: number;
}

export interface CommentNotification {
  id: string;
  type: 'mention' | 'reply' | 'reaction' | 'assignment' | 'resolution';
  commentId: string;
  userId: string;
  triggeredBy: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CommentFilter {
  status?: 'active' | 'resolved' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  timeRange?: { start: number; end: number };
  tags?: string[];
  hasAttachments?: boolean;
  hasReplies?: boolean;
}

export interface CommentStats {
  total: number;
  active: number;
  resolved: number;
  archived: number;
  byPriority: Record<string, number>;
  byUser: Record<string, number>;
  byTimeRange: Record<string, number>;
  avgResponseTime: number;
  resolutionRate: number;
  engagementRate: number;
}

export interface CommentConfig {
  autoSave: boolean;
  realTimeSync: boolean;
  notificationsEnabled: boolean;
  mentionNotifications: boolean;
  emailNotifications: boolean;
  maxAttachmentSize: number;
  allowedFileTypes: string[];
  moderationEnabled: boolean;
  autoArchiveResolved: boolean;
  threadDepthLimit: number;
}

export interface CommentEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted' | 'reaction_added' | 'thread_resolved';
  commentId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

// Zustand Store
interface TimelineCommentsState {
  // State
  comments: TimelineComment[];
  threads: CommentThread[];
  notifications: CommentNotification[];
  stats: CommentStats;
  config: CommentConfig;
  isLoading: boolean;
  error: string | null;
  selectedComment: TimelineComment | null;
  activeThread: CommentThread | null;
  filter: CommentFilter;
  searchQuery: string;
  
  // Real-time state
  connectedUsers: string[];
  typingUsers: Record<string, { userId: string; commentId?: string }>;
  lastSync: Date | null;
  
  // Computed values
  filteredComments: TimelineComment[];
  activeComments: TimelineComment[];
  resolvedComments: TimelineComment[];
  unreadNotifications: CommentNotification[];
  commentsByTimestamp: Record<number, TimelineComment[]>;
  
  // Actions - Comment Management
  addComment: (comment: Omit<TimelineComment, 'id' | 'createdAt'>) => Promise<void>;
  updateComment: (id: string, updates: Partial<TimelineComment>) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  replyToComment: (parentId: string, reply: Omit<TimelineComment, 'id' | 'createdAt' | 'parentId'>) => Promise<void>;
  resolveComment: (id: string) => Promise<void>;
  archiveComment: (id: string) => Promise<void>;
  
  // Actions - Reactions and Interactions
  addReaction: (commentId: string, emoji: string) => Promise<void>;
  removeReaction: (commentId: string, reactionId: string) => Promise<void>;
  mentionUser: (commentId: string, userId: string) => Promise<void>;
  
  // Actions - Attachments
  addAttachment: (commentId: string, attachment: Omit<CommentAttachment, 'id'>) => Promise<void>;
  removeAttachment: (commentId: string, attachmentId: string) => Promise<void>;
  
  // Actions - Thread Management
  createThread: (rootCommentId: string) => Promise<void>;
  resolveThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  
  // Actions - Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  // Actions - Search and Filter
  setFilter: (filter: Partial<CommentFilter>) => void;
  setSearchQuery: (query: string) => void;
  searchComments: (query: string) => TimelineComment[];
  
  // Actions - Real-time
  startTyping: (commentId?: string) => void;
  stopTyping: () => void;
  syncComments: () => Promise<void>;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
  
  // Actions - Quick Actions
  getCommentsByTimestamp: (timestamp: number, range?: number) => TimelineComment[];
  getCommentThread: (commentId: string) => CommentThread | null;
  getUserComments: (userId: string) => TimelineComment[];
  getUnresolvedComments: () => TimelineComment[];
  
  // Actions - Advanced Features
  exportComments: (format: 'json' | 'csv' | 'pdf') => Promise<void>;
  importComments: (data: any) => Promise<void>;
  bulkUpdateComments: (ids: string[], updates: Partial<TimelineComment>) => Promise<void>;
  duplicateComment: (id: string, newTimestamp: number) => Promise<void>;
  
  // Actions - System Operations
  initializeComments: () => Promise<void>;
  refreshComments: () => Promise<void>;
  clearCache: () => void;
  resetState: () => void;
  
  // Actions - Utilities
  generateCommentId: () => string;
  validateComment: (comment: Partial<TimelineComment>) => boolean;
  formatTimestamp: (timestamp: number) => string;
  
  // Actions - Configuration
  updateConfig: (updates: Partial<CommentConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  
  // Actions - Analytics
  getCommentStats: () => CommentStats;
  getEngagementMetrics: () => any;
  getResponseTimeMetrics: () => any;
  
  // Actions - Debug
  getDebugInfo: () => any;
  simulateComment: () => void;
  clearAllComments: () => void;
}

// Default values
const defaultConfig: CommentConfig = {
  autoSave: true,
  realTimeSync: true,
  notificationsEnabled: true,
  mentionNotifications: true,
  emailNotifications: false,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
  moderationEnabled: false,
  autoArchiveResolved: true,
  threadDepthLimit: 5
};

const defaultStats: CommentStats = {
  total: 0,
  active: 0,
  resolved: 0,
  archived: 0,
  byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
  byUser: {},
  byTimeRange: {},
  avgResponseTime: 0,
  resolutionRate: 0,
  engagementRate: 0
};

// Create store
export const useTimelineCommentsStore = create<TimelineCommentsState>()(subscribeWithSelector((set, get) => ({
  // Initial state
  comments: [],
  threads: [],
  notifications: [],
  stats: defaultStats,
  config: defaultConfig,
  isLoading: false,
  error: null,
  selectedComment: null,
  activeThread: null,
  filter: {},
  searchQuery: '',
  connectedUsers: [],
  typingUsers: {},
  lastSync: null,
  
  // Computed values
  get filteredComments() {
    const { comments, filter, searchQuery } = get();
    let filtered = [...comments];
    
    if (filter.status) {
      filtered = filtered.filter(c => c.status === filter.status);
    }
    
    if (filter.priority) {
      filtered = filtered.filter(c => c.priority === filter.priority);
    }
    
    if (filter.userId) {
      filtered = filtered.filter(c => c.userId === filter.userId);
    }
    
    if (filter.timeRange) {
      filtered = filtered.filter(c => 
        c.timestamp >= filter.timeRange!.start && 
        c.timestamp <= filter.timeRange!.end
      );
    }
    
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(c => 
        filter.tags!.some(tag => c.tags.includes(tag))
      );
    }
    
    if (filter.hasAttachments !== undefined) {
      filtered = filtered.filter(c => 
        filter.hasAttachments ? c.attachments.length > 0 : c.attachments.length === 0
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.content.toLowerCase().includes(query) ||
        c.userName.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  },
  
  get activeComments() {
    return get().comments.filter(c => c.status === 'active');
  },
  
  get resolvedComments() {
    return get().comments.filter(c => c.status === 'resolved');
  },
  
  get unreadNotifications() {
    return get().notifications.filter(n => !n.isRead);
  },
  
  get commentsByTimestamp() {
    const comments = get().comments;
    const grouped: Record<number, TimelineComment[]> = {};
    
    comments.forEach(comment => {
      const timestamp = Math.floor(comment.timestamp / 1000) * 1000; // Group by second
      if (!grouped[timestamp]) {
        grouped[timestamp] = [];
      }
      grouped[timestamp].push(comment);
    });
    
    return grouped;
  },
  
  // Comment Management Actions
  addComment: async (commentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newComment: TimelineComment = {
        ...commentData,
        id: get().generateCommentId(),
        createdAt: new Date(),
        reactions: [],
        attachments: commentData.attachments || []
      };
      
      set(state => ({
        comments: [...state.comments, newComment],
        isLoading: false
      }));
      
      // Create notification for mentions
      if (newComment.mentions.length > 0) {
        newComment.mentions.forEach(userId => {
          get().mentionUser(newComment.id, userId);
        });
      }
      
      // Auto-save if enabled
      if (get().config.autoSave) {
        await get().saveConfig();
      }
      
    } catch (error) {
      set({ error: 'Falha ao adicionar comentário', isLoading: false });
    }
  },
  
  updateComment: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      set(state => ({
        comments: state.comments.map(comment => 
          comment.id === id 
            ? { ...comment, ...updates, updatedAt: new Date() }
            : comment
        ),
        isLoading: false
      }));
      
    } catch (error) {
      set({ error: 'Falha ao atualizar comentário', isLoading: false });
    }
  },
  
  deleteComment: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      set(state => ({
        comments: state.comments.filter(comment => comment.id !== id),
        isLoading: false
      }));
      
    } catch (error) {
      set({ error: 'Falha ao deletar comentário', isLoading: false });
    }
  },
  
  replyToComment: async (parentId, replyData) => {
    const reply: TimelineComment = {
      ...replyData,
      id: get().generateCommentId(),
      parentId,
      createdAt: new Date(),
      reactions: [],
      attachments: replyData.attachments || []
    };
    
    await get().addComment(reply);
  },
  
  resolveComment: async (id) => {
    await get().updateComment(id, { status: 'resolved' });
  },
  
  archiveComment: async (id) => {
    await get().updateComment(id, { status: 'archived' });
  },
  
  // Reactions and Interactions
  addReaction: async (commentId, emoji) => {
    const reaction: CommentReaction = {
      id: get().generateCommentId(),
      userId: 'current-user', // Should be from auth context
      emoji,
      createdAt: new Date()
    };
    
    set(state => ({
      comments: state.comments.map(comment => 
        comment.id === commentId
          ? { ...comment, reactions: [...comment.reactions, reaction] }
          : comment
      )
    }));
  },
  
  removeReaction: async (commentId, reactionId) => {
    set(state => ({
      comments: state.comments.map(comment => 
        comment.id === commentId
          ? { ...comment, reactions: comment.reactions.filter(r => r.id !== reactionId) }
          : comment
      )
    }));
  },
  
  mentionUser: async (commentId, userId) => {
    const notification: CommentNotification = {
      id: get().generateCommentId(),
      type: 'mention',
      commentId,
      userId,
      triggeredBy: 'current-user',
      message: 'Você foi mencionado em um comentário',
      isRead: false,
      createdAt: new Date()
    };
    
    set(state => ({
      notifications: [...state.notifications, notification]
    }));
  },
  
  // Attachments
  addAttachment: async (commentId, attachmentData) => {
    const attachment: CommentAttachment = {
      ...attachmentData,
      id: get().generateCommentId()
    };
    
    set(state => ({
      comments: state.comments.map(comment => 
        comment.id === commentId
          ? { ...comment, attachments: [...comment.attachments, attachment] }
          : comment
      )
    }));
  },
  
  removeAttachment: async (commentId, attachmentId) => {
    set(state => ({
      comments: state.comments.map(comment => 
        comment.id === commentId
          ? { ...comment, attachments: comment.attachments.filter(a => a.id !== attachmentId) }
          : comment
      )
    }));
  },
  
  // Thread Management
  createThread: async (rootCommentId) => {
    const rootComment = get().comments.find(c => c.id === rootCommentId);
    if (!rootComment) return;
    
    const thread: CommentThread = {
      id: get().generateCommentId(),
      rootComment,
      replies: get().comments.filter(c => c.parentId === rootCommentId),
      participants: [rootComment.userId],
      lastActivity: new Date(),
      isResolved: false,
      totalReplies: 0
    };
    
    set(state => ({
      threads: [...state.threads, thread]
    }));
  },
  
  resolveThread: async (threadId) => {
    set(state => ({
      threads: state.threads.map(thread => 
        thread.id === threadId
          ? { ...thread, isResolved: true }
          : thread
      )
    }));
  },
  
  reopenThread: async (threadId) => {
    set(state => ({
      threads: state.threads.map(thread => 
        thread.id === threadId
          ? { ...thread, isResolved: false }
          : thread
      )
    }));
  },
  
  // Notifications
  markNotificationRead: async (id) => {
    set(state => ({
      notifications: state.notifications.map(notification => 
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  },
  
  markAllNotificationsRead: async () => {
    set(state => ({
      notifications: state.notifications.map(notification => ({
        ...notification,
        isRead: true
      }))
    }));
  },
  
  clearNotifications: async () => {
    set({ notifications: [] });
  },
  
  // Search and Filter
  setFilter: (filter) => {
    set(state => ({
      filter: { ...state.filter, ...filter }
    }));
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  searchComments: (query) => {
    const comments = get().comments;
    const searchTerm = query.toLowerCase();
    
    return comments.filter(comment => 
      comment.content.toLowerCase().includes(searchTerm) ||
      comment.userName.toLowerCase().includes(searchTerm) ||
      comment.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },
  
  // Real-time
  startTyping: (commentId) => {
    const userId = 'current-user'; // Should be from auth context
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: { userId, commentId }
      }
    }));
  },
  
  stopTyping: () => {
    const userId = 'current-user';
    set(state => {
      const { [userId]: removed, ...rest } = state.typingUsers;
      return { typingUsers: rest };
    });
  },
  
  syncComments: async () => {
    set({ lastSync: new Date() });
    // Implement real-time sync logic
  },
  
  subscribeToUpdates: () => {
    // Implement WebSocket subscription
  },
  
  unsubscribeFromUpdates: () => {
    // Implement WebSocket unsubscription
  },
  
  // Quick Actions
  getCommentsByTimestamp: (timestamp, range = 1000) => {
    const comments = get().comments;
    return comments.filter(comment => 
      Math.abs(comment.timestamp - timestamp) <= range
    );
  },
  
  getCommentThread: (commentId) => {
    const threads = get().threads;
    return threads.find(thread => 
      thread.rootComment.id === commentId || 
      thread.replies.some(reply => reply.id === commentId)
    ) || null;
  },
  
  getUserComments: (userId) => {
    return get().comments.filter(comment => comment.userId === userId);
  },
  
  getUnresolvedComments: () => {
    return get().comments.filter(comment => comment.status === 'active');
  },
  
  // Advanced Features
  exportComments: async (format) => {
    const comments = get().comments;
    // Implement export logic based on format
  },
  
  importComments: async (data) => {
    // Implement import logic
  },
  
  bulkUpdateComments: async (ids, updates) => {
    set(state => ({
      comments: state.comments.map(comment => 
        ids.includes(comment.id)
          ? { ...comment, ...updates, updatedAt: new Date() }
          : comment
      )
    }));
  },
  
  duplicateComment: async (id, newTimestamp) => {
    const comment = get().comments.find(c => c.id === id);
    if (!comment) return;
    
    const duplicated = {
      ...comment,
      id: get().generateCommentId(),
      timestamp: newTimestamp,
      createdAt: new Date(),
      parentId: undefined // Remove parent relationship
    };
    
    await get().addComment(duplicated);
  },
  
  // System Operations
  initializeComments: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Load comments from storage or API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Falha ao inicializar comentários', isLoading: false });
    }
  },
  
  refreshComments: async () => {
    await get().initializeComments();
  },
  
  clearCache: () => {
    set({
      comments: [],
      threads: [],
      notifications: [],
      selectedComment: null,
      activeThread: null
    });
  },
  
  resetState: () => {
    set({
      comments: [],
      threads: [],
      notifications: [],
      stats: defaultStats,
      config: defaultConfig,
      isLoading: false,
      error: null,
      selectedComment: null,
      activeThread: null,
      filter: {},
      searchQuery: '',
      connectedUsers: [],
      typingUsers: {},
      lastSync: null
    });
  },
  
  // Utilities
  generateCommentId: () => {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  validateComment: (comment) => {
    return !!(comment.content && comment.content.trim().length > 0);
  },
  
  formatTimestamp: (timestamp) => {
    const minutes = Math.floor(timestamp / 60000);
    const seconds = Math.floor((timestamp % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
  
  // Configuration
  updateConfig: async (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: async () => {
    set({ config: defaultConfig });
  },
  
  saveConfig: async () => {
    // Implement config persistence
  },
  
  // Analytics
  getCommentStats: () => {
    const comments = get().comments;
    const stats: CommentStats = {
      total: comments.length,
      active: comments.filter(c => c.status === 'active').length,
      resolved: comments.filter(c => c.status === 'resolved').length,
      archived: comments.filter(c => c.status === 'archived').length,
      byPriority: {
        low: comments.filter(c => c.priority === 'low').length,
        medium: comments.filter(c => c.priority === 'medium').length,
        high: comments.filter(c => c.priority === 'high').length,
        urgent: comments.filter(c => c.priority === 'urgent').length
      },
      byUser: {},
      byTimeRange: {},
      avgResponseTime: 0,
      resolutionRate: comments.length > 0 ? (comments.filter(c => c.status === 'resolved').length / comments.length) * 100 : 0,
      engagementRate: 0
    };
    
    // Calculate by user
    comments.forEach(comment => {
      stats.byUser[comment.userId] = (stats.byUser[comment.userId] || 0) + 1;
    });
    
    set({ stats });
    return stats;
  },
  
  getEngagementMetrics: () => {
    const comments = get().comments;
    const totalReactions = comments.reduce((sum, comment) => sum + comment.reactions.length, 0);
    const totalReplies = comments.filter(comment => comment.parentId).length;
    
    return {
      totalReactions,
      totalReplies,
      avgReactionsPerComment: comments.length > 0 ? totalReactions / comments.length : 0,
      avgRepliesPerComment: comments.length > 0 ? totalReplies / comments.length : 0
    };
  },
  
  getResponseTimeMetrics: () => {
    const comments = get().comments;
    const threads = comments.filter(c => c.parentId);
    
    if (threads.length === 0) return { avgResponseTime: 0, medianResponseTime: 0 };
    
    const responseTimes = threads.map(reply => {
      const parent = comments.find(c => c.id === reply.parentId);
      if (!parent) return 0;
      return reply.createdAt.getTime() - parent.createdAt.getTime();
    }).filter(time => time > 0);
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    
    return { avgResponseTime, medianResponseTime };
  },
  
  // Debug
  getDebugInfo: () => {
    const state = get();
    return {
      commentsCount: state.comments.length,
      threadsCount: state.threads.length,
      notificationsCount: state.notifications.length,
      connectedUsers: state.connectedUsers.length,
      typingUsers: Object.keys(state.typingUsers).length,
      lastSync: state.lastSync,
      config: state.config
    };
  },
  
  simulateComment: () => {
    const mockComment = {
      timelineId: 'timeline_1',
      userId: `user_${Math.floor(Math.random() * 5) + 1}`,
      userName: `Usuário ${Math.floor(Math.random() * 5) + 1}`,
      content: `Comentário de exemplo ${Date.now()}`,
      timestamp: Math.floor(Math.random() * 300000), // 0-5 minutes
      mentions: [],
      attachments: [],
      status: 'active' as const,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      tags: [`tag${Math.floor(Math.random() * 3) + 1}`],
      metadata: {}
    };
    
    get().addComment(mockComment);
  },
  
  clearAllComments: () => {
    set({ comments: [], threads: [], notifications: [] });
  }
})));

// Timeline Comments Manager Class
export class TimelineCommentsManager {
  private store = useTimelineCommentsStore;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    await this.store.getState().initializeComments();
  }
  
  // Public API methods
  async addComment(comment: Omit<TimelineComment, 'id' | 'createdAt'>) {
    return this.store.getState().addComment(comment);
  }
  
  async updateComment(id: string, updates: Partial<TimelineComment>) {
    return this.store.getState().updateComment(id, updates);
  }
  
  async deleteComment(id: string) {
    return this.store.getState().deleteComment(id);
  }
  
  getCommentsByTimestamp(timestamp: number, range?: number) {
    return this.store.getState().getCommentsByTimestamp(timestamp, range);
  }
  
  searchComments(query: string) {
    return this.store.getState().searchComments(query);
  }
  
  getStats() {
    return this.store.getState().getCommentStats();
  }
}

// Global instance
export const timelineCommentsManager = new TimelineCommentsManager();

// Utility functions
export const formatCommentTime = (timestamp: number): string => {
  const minutes = Math.floor(timestamp / 60000);
  const seconds = Math.floor((timestamp % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getCommentStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'text-blue-600';
    case 'resolved': return 'text-green-600';
    case 'archived': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getCommentIcon = (type: string): string => {
  switch (type) {
    case 'mention': return '👤';
    case 'reply': return '💬';
    case 'reaction': return '👍';
    case 'assignment': return '📋';
    case 'resolution': return '✅';
    default: return '💬';
  }
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
};

export const validateCommentContent = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 1000;
};

export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

export const highlightMentions = (content: string): string => {
  return content.replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
};