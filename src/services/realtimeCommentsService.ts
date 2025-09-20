import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface Comment {
  id: string;
  timelinePosition: number; // Position in seconds on timeline
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: 'editor' | 'reviewer' | 'admin' | 'viewer';
  };
  type: 'general' | 'suggestion' | 'issue' | 'approval' | 'question';
  status: 'active' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  attachments: CommentAttachment[];
  replies: CommentReply[];
  reactions: CommentReaction[];
  mentions: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  isEdited: boolean;
  editHistory: CommentEdit[];
  visibility: 'public' | 'private' | 'team';
  threadId?: string;
  parentId?: string;
  position: {
    x: number;
    y: number;
  };
  layer?: string;
  element?: string;
}

export interface CommentReply {
  id: string;
  content: string;
  author: Comment['author'];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  reactions: CommentReaction[];
  mentions: string[];
}

export interface CommentReaction {
  id: string;
  type: 'like' | 'dislike' | 'love' | 'laugh' | 'angry' | 'sad';
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface CommentAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface CommentEdit {
  id: string;
  previousContent: string;
  newContent: string;
  editedAt: Date;
  editedBy: string;
  reason?: string;
}

export interface CommentThread {
  id: string;
  title: string;
  description?: string;
  comments: Comment[];
  participants: string[];
  status: 'active' | 'resolved' | 'archived';
  priority: Comment['priority'];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags: string[];
  timelineRange: {
    start: number;
    end: number;
  };
}

export interface CommentFilter {
  author?: string;
  type?: Comment['type'];
  status?: Comment['status'];
  priority?: Comment['priority'];
  tags?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  visibility?: Comment['visibility'];
  hasAttachments?: boolean;
  hasReplies?: boolean;
  isResolved?: boolean;
  searchQuery?: string;
}

export interface CommentNotification {
  id: string;
  type: 'new_comment' | 'reply' | 'mention' | 'reaction' | 'resolution' | 'assignment';
  commentId: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CommentStats {
  totalComments: number;
  activeComments: number;
  resolvedComments: number;
  archivedComments: number;
  commentsByType: Record<Comment['type'], number>;
  commentsByPriority: Record<Comment['priority'], number>;
  commentsByAuthor: Record<string, number>;
  averageResolutionTime: number;
  responseRate: number;
  engagementRate: number;
  mostActiveTimeRange: {
    start: number;
    end: number;
    count: number;
  };
}

export interface RealtimeConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  enableNotifications: boolean;
  enableSounds: boolean;
  enableMentions: boolean;
  enableReactions: boolean;
  enableThreads: boolean;
  maxCommentsPerView: number;
  defaultVisibility: Comment['visibility'];
  allowAnonymous: boolean;
  moderationEnabled: boolean;
  autoArchiveAfter: number; // days
  enableRealTimeSync: boolean;
  syncInterval: number;
  enableOfflineMode: boolean;
  enableCollaboration: boolean;
  enableVersioning: boolean;
}

export interface CollaborationState {
  activeUsers: {
    id: string;
    name: string;
    avatar?: string;
    cursor?: {
      x: number;
      y: number;
      timelinePosition: number;
    };
    selection?: {
      start: number;
      end: number;
    };
    isTyping: boolean;
    lastActivity: Date;
  }[];
  sharedCursor: boolean;
  sharedSelection: boolean;
  liveEditing: boolean;
  conflictResolution: 'manual' | 'automatic' | 'last_writer_wins';
}

// Zustand Store
interface RealtimeCommentsStore {
  // State
  comments: Comment[];
  threads: CommentThread[];
  notifications: CommentNotification[];
  activeComment: Comment | null;
  activeThread: CommentThread | null;
  selectedComments: string[];
  filter: CommentFilter;
  config: RealtimeConfig;
  stats: CommentStats;
  collaboration: CollaborationState;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastSync: Date | null;
  
  // Actions
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateComment: (id: string, updates: Partial<Comment>) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  resolveComment: (id: string, resolvedBy: string) => Promise<void>;
  archiveComment: (id: string) => Promise<void>;
  addReply: (commentId: string, reply: Omit<CommentReply, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addReaction: (commentId: string, reaction: Omit<CommentReaction, 'id' | 'createdAt'>) => Promise<void>;
  removeReaction: (commentId: string, reactionId: string) => Promise<void>;
  
  // Thread Management
  createThread: (thread: Omit<CommentThread, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateThread: (id: string, updates: Partial<CommentThread>) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  resolveThread: (id: string) => Promise<void>;
  
  // Selection and Navigation
  selectComment: (id: string) => void;
  selectMultipleComments: (ids: string[]) => void;
  clearSelection: () => void;
  navigateToComment: (id: string) => void;
  navigateToTimelinePosition: (position: number) => void;
  
  // Filtering and Search
  setFilter: (filter: Partial<CommentFilter>) => void;
  clearFilter: () => void;
  searchComments: (query: string) => Comment[];
  
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Configuration
  updateConfig: (updates: Partial<RealtimeConfig>) => void;
  resetConfig: () => void;
  
  // Collaboration
  updateUserCursor: (userId: string, cursor: CollaborationState['activeUsers'][0]['cursor']) => void;
  updateUserSelection: (userId: string, selection: CollaborationState['activeUsers'][0]['selection']) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  addActiveUser: (user: CollaborationState['activeUsers'][0]) => void;
  removeActiveUser: (userId: string) => void;
  
  // Real-time Operations
  connect: () => Promise<void>;
  disconnect: () => void;
  sync: () => Promise<void>;
  enableRealTimeSync: () => void;
  disableRealTimeSync: () => void;
  
  // Quick Actions
  quickReply: (commentId: string, content: string) => Promise<void>;
  quickResolve: (commentId: string) => Promise<void>;
  quickArchive: (commentId: string) => Promise<void>;
  quickMention: (commentId: string, userIds: string[]) => Promise<void>;
  
  // Advanced Features
  exportComments: (format: 'json' | 'csv' | 'pdf') => Promise<string>;
  importComments: (data: any) => Promise<void>;
  generateReport: (timeRange?: { start: Date; end: Date }) => Promise<any>;
  bulkAction: (commentIds: string[], action: string, params?: any) => Promise<void>;
  
  // System Operations
  refreshStats: () => Promise<void>;
  cleanup: () => void;
  reset: () => void;
  backup: () => Promise<string>;
  restore: (backup: string) => Promise<void>;
}

const defaultConfig: RealtimeConfig = {
  autoRefresh: true,
  refreshInterval: 5000,
  enableNotifications: true,
  enableSounds: true,
  enableMentions: true,
  enableReactions: true,
  enableThreads: true,
  maxCommentsPerView: 50,
  defaultVisibility: 'public',
  allowAnonymous: false,
  moderationEnabled: true,
  autoArchiveAfter: 30,
  enableRealTimeSync: true,
  syncInterval: 1000,
  enableOfflineMode: true,
  enableCollaboration: true,
  enableVersioning: true
};

const defaultStats: CommentStats = {
  totalComments: 0,
  activeComments: 0,
  resolvedComments: 0,
  archivedComments: 0,
  commentsByType: {
    general: 0,
    suggestion: 0,
    issue: 0,
    approval: 0,
    question: 0
  },
  commentsByPriority: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  },
  commentsByAuthor: {},
  averageResolutionTime: 0,
  responseRate: 0,
  engagementRate: 0,
  mostActiveTimeRange: {
    start: 0,
    end: 0,
    count: 0
  }
};

const defaultCollaboration: CollaborationState = {
  activeUsers: [],
  sharedCursor: true,
  sharedSelection: true,
  liveEditing: true,
  conflictResolution: 'manual'
};

export const useRealtimeCommentsStore = create<RealtimeCommentsStore>()(subscribeWithSelector((set, get) => ({
  // Initial State
  comments: [],
  threads: [],
  notifications: [],
  activeComment: null,
  activeThread: null,
  selectedComments: [],
  filter: {},
  config: defaultConfig,
  stats: defaultStats,
  collaboration: defaultCollaboration,
  isLoading: false,
  error: null,
  isConnected: false,
  lastSync: null,
  
  // Comment Management
  addComment: async (commentData) => {
    set({ isLoading: true, error: null });
    try {
      const newComment: Comment = {
        ...commentData,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        editHistory: [],
        replies: [],
        reactions: [],
        attachments: commentData.attachments || []
      };
      
      set(state => ({
        comments: [...state.comments, newComment],
        isLoading: false
      }));
      
      // Trigger notification
      if (newComment.mentions.length > 0) {
        newComment.mentions.forEach(userId => {
          const notification: CommentNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'mention',
            commentId: newComment.id,
            userId,
            message: `You were mentioned in a comment by ${newComment.author.name}`,
            isRead: false,
            createdAt: new Date()
          };
          
          set(state => ({
            notifications: [...state.notifications, notification]
          }));
        });
      }
      
      await get().refreshStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add comment', isLoading: false });
    }
  },
  
  updateComment: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        comments: state.comments.map(comment => {
          if (comment.id === id) {
            const editHistory = updates.content && updates.content !== comment.content
              ? [...comment.editHistory, {
                  id: `edit-${Date.now()}`,
                  previousContent: comment.content,
                  newContent: updates.content,
                  editedAt: new Date(),
                  editedBy: updates.author?.id || comment.author.id,
                  reason: 'Content updated'
                }]
              : comment.editHistory;
            
            return {
              ...comment,
              ...updates,
              updatedAt: new Date(),
              isEdited: updates.content ? true : comment.isEdited,
              editHistory
            };
          }
          return comment;
        }),
        isLoading: false
      }));
      
      await get().refreshStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update comment', isLoading: false });
    }
  },
  
  deleteComment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        comments: state.comments.filter(comment => comment.id !== id),
        selectedComments: state.selectedComments.filter(selectedId => selectedId !== id),
        activeComment: state.activeComment?.id === id ? null : state.activeComment,
        isLoading: false
      }));
      
      await get().refreshStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete comment', isLoading: false });
    }
  },
  
  resolveComment: async (id, resolvedBy) => {
    await get().updateComment(id, {
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy
    });
  },
  
  archiveComment: async (id) => {
    await get().updateComment(id, {
      status: 'archived'
    });
  },
  
  addReply: async (commentId, replyData) => {
    set({ isLoading: true, error: null });
    try {
      const newReply: CommentReply = {
        ...replyData,
        id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        reactions: []
      };
      
      set(state => ({
        comments: state.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...comment.replies, newReply],
              updatedAt: new Date()
            };
          }
          return comment;
        }),
        isLoading: false
      }));
      
      // Create notification for original comment author
      const originalComment = get().comments.find(c => c.id === commentId);
      if (originalComment && originalComment.author.id !== newReply.author.id) {
        const notification: CommentNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'reply',
          commentId,
          userId: originalComment.author.id,
          message: `${newReply.author.name} replied to your comment`,
          isRead: false,
          createdAt: new Date()
        };
        
        set(state => ({
          notifications: [...state.notifications, notification]
        }));
      }
      
      await get().refreshStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add reply', isLoading: false });
    }
  },
  
  addReaction: async (commentId, reactionData) => {
    set({ isLoading: true, error: null });
    try {
      const newReaction: CommentReaction = {
        ...reactionData,
        id: `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };
      
      set(state => ({
        comments: state.comments.map(comment => {
          if (comment.id === commentId) {
            // Remove existing reaction from same user if exists
            const filteredReactions = comment.reactions.filter(
              r => r.userId !== newReaction.userId || r.type !== newReaction.type
            );
            
            return {
              ...comment,
              reactions: [...filteredReactions, newReaction],
              updatedAt: new Date()
            };
          }
          return comment;
        }),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add reaction', isLoading: false });
    }
  },
  
  removeReaction: async (commentId, reactionId) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        comments: state.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              reactions: comment.reactions.filter(r => r.id !== reactionId),
              updatedAt: new Date()
            };
          }
          return comment;
        }),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove reaction', isLoading: false });
    }
  },
  
  // Thread Management
  createThread: async (threadData) => {
    set({ isLoading: true, error: null });
    try {
      const newThread: CommentThread = {
        ...threadData,
        id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set(state => ({
        threads: [...state.threads, newThread],
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create thread', isLoading: false });
    }
  },
  
  updateThread: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        threads: state.threads.map(thread => 
          thread.id === id 
            ? { ...thread, ...updates, updatedAt: new Date() }
            : thread
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update thread', isLoading: false });
    }
  },
  
  deleteThread: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        threads: state.threads.filter(thread => thread.id !== id),
        activeThread: state.activeThread?.id === id ? null : state.activeThread,
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete thread', isLoading: false });
    }
  },
  
  resolveThread: async (id) => {
    await get().updateThread(id, {
      status: 'resolved',
      resolvedAt: new Date()
    });
  },
  
  // Selection and Navigation
  selectComment: (id) => {
    const comment = get().comments.find(c => c.id === id);
    set({ activeComment: comment || null, selectedComments: [id] });
  },
  
  selectMultipleComments: (ids) => {
    set({ selectedComments: ids, activeComment: null });
  },
  
  clearSelection: () => {
    set({ selectedComments: [], activeComment: null });
  },
  
  navigateToComment: (id) => {
    const comment = get().comments.find(c => c.id === id);
    if (comment) {
      get().selectComment(id);
      // Trigger timeline navigation
      get().navigateToTimelinePosition(comment.timelinePosition);
    }
  },
  
  navigateToTimelinePosition: (position) => {
    // This would integrate with the timeline component
  },
  
  // Filtering and Search
  setFilter: (filter) => {
    set(state => ({
      filter: { ...state.filter, ...filter }
    }));
  },
  
  clearFilter: () => {
    set({ filter: {} });
  },
  
  searchComments: (query) => {
    const { comments } = get();
    return comments.filter(comment => 
      comment.content.toLowerCase().includes(query.toLowerCase()) ||
      comment.author.name.toLowerCase().includes(query.toLowerCase()) ||
      comment.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  },
  
  // Notifications
  markNotificationAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    }));
  },
  
  markAllNotificationsAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notif => ({ ...notif, isRead: true }))
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  // Configuration
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  // Collaboration
  updateUserCursor: (userId, cursor) => {
    set(state => ({
      collaboration: {
        ...state.collaboration,
        activeUsers: state.collaboration.activeUsers.map(user => 
          user.id === userId 
            ? { ...user, cursor, lastActivity: new Date() }
            : user
        )
      }
    }));
  },
  
  updateUserSelection: (userId, selection) => {
    set(state => ({
      collaboration: {
        ...state.collaboration,
        activeUsers: state.collaboration.activeUsers.map(user => 
          user.id === userId 
            ? { ...user, selection, lastActivity: new Date() }
            : user
        )
      }
    }));
  },
  
  setUserTyping: (userId, isTyping) => {
    set(state => ({
      collaboration: {
        ...state.collaboration,
        activeUsers: state.collaboration.activeUsers.map(user => 
          user.id === userId 
            ? { ...user, isTyping, lastActivity: new Date() }
            : user
        )
      }
    }));
  },
  
  addActiveUser: (user) => {
    set(state => {
      const existingUserIndex = state.collaboration.activeUsers.findIndex(u => u.id === user.id);
      if (existingUserIndex >= 0) {
        return {
          collaboration: {
            ...state.collaboration,
            activeUsers: state.collaboration.activeUsers.map((u, index) => 
              index === existingUserIndex ? { ...user, lastActivity: new Date() } : u
            )
          }
        };
      }
      
      return {
        collaboration: {
          ...state.collaboration,
          activeUsers: [...state.collaboration.activeUsers, { ...user, lastActivity: new Date() }]
        }
      };
    });
  },
  
  removeActiveUser: (userId) => {
    set(state => ({
      collaboration: {
        ...state.collaboration,
        activeUsers: state.collaboration.activeUsers.filter(user => user.id !== userId)
      }
    }));
  },
  
  // Real-time Operations
  connect: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ isConnected: true, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to connect', isLoading: false });
    }
  },
  
  disconnect: () => {
    set({ isConnected: false });
  },
  
  sync: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ lastSync: new Date(), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sync', isLoading: false });
    }
  },
  
  enableRealTimeSync: () => {
    get().updateConfig({ enableRealTimeSync: true });
  },
  
  disableRealTimeSync: () => {
    get().updateConfig({ enableRealTimeSync: false });
  },
  
  // Quick Actions
  quickReply: async (commentId, content) => {
    await get().addReply(commentId, {
      content,
      author: {
        id: 'current-user',
        name: 'Current User',
        role: 'editor'
      },
      reactions: [],
      mentions: []
    });
  },
  
  quickResolve: async (commentId) => {
    await get().resolveComment(commentId, 'current-user');
  },
  
  quickArchive: async (commentId) => {
    await get().archiveComment(commentId);
  },
  
  quickMention: async (commentId, userIds) => {
    const comment = get().comments.find(c => c.id === commentId);
    if (comment) {
      await get().updateComment(commentId, {
        mentions: [...new Set([...comment.mentions, ...userIds])]
      });
    }
  },
  
  // Advanced Features
  exportComments: async (format) => {
    const { comments } = get();
    switch (format) {
      case 'json':
        return JSON.stringify(comments, null, 2);
      case 'csv':
        const headers = ['ID', 'Content', 'Author', 'Type', 'Status', 'Timeline Position', 'Created At'];
        const rows = comments.map(c => [
          c.id,
          c.content,
          c.author.name,
          c.type,
          c.status,
          c.timelinePosition,
          c.createdAt.toISOString()
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      case 'pdf':
        return 'PDF export not implemented';
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },
  
  importComments: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const comments = Array.isArray(data) ? data : JSON.parse(data);
      set(state => ({
        comments: [...state.comments, ...comments],
        isLoading: false
      }));
      await get().refreshStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to import comments', isLoading: false });
    }
  },
  
  generateReport: async (timeRange) => {
    const { comments, stats } = get();
    const filteredComments = timeRange 
      ? comments.filter(c => 
          c.createdAt >= timeRange.start && c.createdAt <= timeRange.end
        )
      : comments;
    
    return {
      summary: {
        totalComments: filteredComments.length,
        resolvedComments: filteredComments.filter(c => c.status === 'resolved').length,
        activeComments: filteredComments.filter(c => c.status === 'active').length
      },
      breakdown: stats,
      comments: filteredComments,
      generatedAt: new Date()
    };
  },
  
  bulkAction: async (commentIds, action, params) => {
    set({ isLoading: true, error: null });
    try {
      for (const id of commentIds) {
        switch (action) {
          case 'resolve':
            await get().resolveComment(id, params?.resolvedBy || 'current-user');
            break;
          case 'archive':
            await get().archiveComment(id);
            break;
          case 'delete':
            await get().deleteComment(id);
            break;
          case 'update':
            await get().updateComment(id, params?.updates || {});
            break;
          default:
            console.warn(`Unknown bulk action: ${action}`);
        }
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Bulk action failed', isLoading: false });
    }
  },
  
  // System Operations
  refreshStats: async () => {
    const { comments } = get();
    
    const stats: CommentStats = {
      totalComments: comments.length,
      activeComments: comments.filter(c => c.status === 'active').length,
      resolvedComments: comments.filter(c => c.status === 'resolved').length,
      archivedComments: comments.filter(c => c.status === 'archived').length,
      commentsByType: {
        general: comments.filter(c => c.type === 'general').length,
        suggestion: comments.filter(c => c.type === 'suggestion').length,
        issue: comments.filter(c => c.type === 'issue').length,
        approval: comments.filter(c => c.type === 'approval').length,
        question: comments.filter(c => c.type === 'question').length
      },
      commentsByPriority: {
        low: comments.filter(c => c.priority === 'low').length,
        medium: comments.filter(c => c.priority === 'medium').length,
        high: comments.filter(c => c.priority === 'high').length,
        critical: comments.filter(c => c.priority === 'critical').length
      },
      commentsByAuthor: comments.reduce((acc, comment) => {
        acc[comment.author.name] = (acc[comment.author.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageResolutionTime: 0, // Would calculate from resolved comments
      responseRate: 0, // Would calculate from replies
      engagementRate: 0, // Would calculate from reactions and replies
      mostActiveTimeRange: {
        start: 0,
        end: 0,
        count: 0
      }
    };
    
    set({ stats });
  },
  
  cleanup: () => {
    const { config } = get();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.autoArchiveAfter);
    
    set(state => ({
      comments: state.comments.filter(comment => 
        comment.status !== 'archived' || comment.createdAt > cutoffDate
      ),
      notifications: state.notifications.filter(notif => 
        notif.createdAt > cutoffDate
      )
    }));
  },
  
  reset: () => {
    set({
      comments: [],
      threads: [],
      notifications: [],
      activeComment: null,
      activeThread: null,
      selectedComments: [],
      filter: {},
      stats: defaultStats,
      collaboration: defaultCollaboration,
      isLoading: false,
      error: null,
      lastSync: null
    });
  },
  
  backup: async () => {
    const state = get();
    return JSON.stringify({
      comments: state.comments,
      threads: state.threads,
      config: state.config,
      timestamp: new Date().toISOString()
    });
  },
  
  restore: async (backup) => {
    try {
      const data = JSON.parse(backup);
      set({
        comments: data.comments || [],
        threads: data.threads || [],
        config: { ...defaultConfig, ...data.config }
      });
      await get().refreshStats();
    } catch (error) {
      set({ error: 'Failed to restore backup' });
    }
  }
})));

// Manager Class
export class RealtimeCommentsManager {
  private store = useRealtimeCommentsStore;
  private syncInterval?: NodeJS.Timeout;
  
  constructor() {
    this.initializeAutoSync();
  }
  
  private initializeAutoSync() {
    const { config, enableRealTimeSync } = this.store.getState();
    
    if (config.enableRealTimeSync) {
      this.syncInterval = setInterval(() => {
        this.store.getState().sync();
      }, config.syncInterval);
    }
  }
  
  public startAutoSync() {
    this.store.getState().enableRealTimeSync();
    this.initializeAutoSync();
  }
  
  public stopAutoSync() {
    this.store.getState().disableRealTimeSync();
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }
  
  public destroy() {
    this.stopAutoSync();
    this.store.getState().disconnect();
  }
}

// Global instance
export const realtimeCommentsManager = new RealtimeCommentsManager();

// Utility Functions
export const formatCommentTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
};

export const getCommentTypeColor = (type: Comment['type']): string => {
  switch (type) {
    case 'general': return 'text-blue-600';
    case 'suggestion': return 'text-green-600';
    case 'issue': return 'text-red-600';
    case 'approval': return 'text-purple-600';
    case 'question': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};

export const getCommentTypeIcon = (type: Comment['type']): string => {
  switch (type) {
    case 'general': return 'MessageCircle';
    case 'suggestion': return 'Lightbulb';
    case 'issue': return 'AlertTriangle';
    case 'approval': return 'CheckCircle';
    case 'question': return 'HelpCircle';
    default: return 'MessageCircle';
  }
};

export const getPriorityColor = (priority: Comment['priority']): string => {
  switch (priority) {
    case 'low': return 'text-gray-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getStatusColor = (status: Comment['status']): string => {
  switch (status) {
    case 'active': return 'text-green-600';
    case 'resolved': return 'text-blue-600';
    case 'archived': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const calculateEngagementScore = (comment: Comment): number => {
  const replyWeight = 2;
  const reactionWeight = 1;
  const mentionWeight = 1.5;
  
  return (
    comment.replies.length * replyWeight +
    comment.reactions.length * reactionWeight +
    comment.mentions.length * mentionWeight
  );
};

export const generateCommentRecommendations = (comments: Comment[]): string[] => {
  const recommendations: string[] = [];
  
  const unresolvedIssues = comments.filter(c => c.type === 'issue' && c.status === 'active');
  if (unresolvedIssues.length > 5) {
    recommendations.push(`You have ${unresolvedIssues.length} unresolved issues that need attention`);
  }
  
  const criticalComments = comments.filter(c => c.priority === 'critical' && c.status === 'active');
  if (criticalComments.length > 0) {
    recommendations.push(`${criticalComments.length} critical comments require immediate attention`);
  }
  
  const oldComments = comments.filter(c => {
    const daysSinceCreated = (new Date().getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated > 7 && c.status === 'active';
  });
  if (oldComments.length > 0) {
    recommendations.push(`${oldComments.length} comments are over a week old and may need follow-up`);
  }
  
  return recommendations;
};