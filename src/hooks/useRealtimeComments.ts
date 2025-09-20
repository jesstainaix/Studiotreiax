import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  useRealtimeCommentsStore, 
  Comment, 
  CommentThread, 
  CommentFilter, 
  CommentStats,
  CollaborationState,
  RealtimeConfig
} from '../services/realtimeCommentsService';

// Utility Functions
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Progress Tracking Hook
export const useProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const start = useCallback(() => {
    setIsActive(true);
    setProgress(0);
  }, []);
  
  const update = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);
  
  const complete = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsActive(false);
      setProgress(0);
    }, 500);
  }, []);
  
  return { progress, isActive, start, update, complete };
};

// Main Hook
export const useRealtimeComments = () => {
  const store = useRealtimeCommentsStore();
  const progressTracker = useProgress();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-initialization and refresh
  useEffect(() => {
    const initialize = async () => {
      if (!isInitialized) {
        progressTracker.start();
        try {
          await store.connect();
          await store.refreshStats();
          setIsInitialized(true);
          progressTracker.complete();
        } catch (error) {
          setLocalError(error instanceof Error ? error.message : 'Initialization failed');
          progressTracker.complete();
        }
      }
    };
    
    initialize();
    
    // Setup auto-refresh
    if (store.config.autoRefresh && !refreshIntervalRef.current) {
      refreshIntervalRef.current = setInterval(() => {
        if (store.isConnected) {
          store.sync();
        }
      }, store.config.refreshInterval);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [store, isInitialized, progressTracker]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Comment Management
    addComment: store.addComment,
    updateComment: store.updateComment,
    deleteComment: store.deleteComment,
    resolveComment: store.resolveComment,
    archiveComment: store.archiveComment,
    addReply: store.addReply,
    addReaction: store.addReaction,
    removeReaction: store.removeReaction,
    
    // Thread Management
    createThread: store.createThread,
    updateThread: store.updateThread,
    deleteThread: store.deleteThread,
    resolveThread: store.resolveThread,
    
    // Selection and Navigation
    selectComment: store.selectComment,
    selectMultipleComments: store.selectMultipleComments,
    clearSelection: store.clearSelection,
    navigateToComment: store.navigateToComment,
    navigateToTimelinePosition: store.navigateToTimelinePosition,
    
    // Filtering and Search
    setFilter: store.setFilter,
    clearFilter: store.clearFilter,
    searchComments: store.searchComments,
    
    // Notifications
    markNotificationAsRead: store.markNotificationAsRead,
    markAllNotificationsAsRead: store.markAllNotificationsAsRead,
    clearNotifications: store.clearNotifications,
    
    // Configuration
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    
    // Collaboration
    updateUserCursor: store.updateUserCursor,
    updateUserSelection: store.updateUserSelection,
    setUserTyping: store.setUserTyping,
    addActiveUser: store.addActiveUser,
    removeActiveUser: store.removeActiveUser,
    
    // Real-time Operations
    connect: store.connect,
    disconnect: store.disconnect,
    sync: store.sync,
    enableRealTimeSync: store.enableRealTimeSync,
    disableRealTimeSync: store.disableRealTimeSync,
    
    // System Operations
    refreshStats: store.refreshStats,
    cleanup: store.cleanup,
    reset: store.reset,
    backup: store.backup,
    restore: store.restore
  }), [store]);
  
  // Quick Actions with Error Handling
  const quickActions = useMemo(() => ({
    quickReply: async (commentId: string, content: string) => {
      try {
        progressTracker.start();
        await store.quickReply(commentId, content);
        progressTracker.complete();
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Quick reply failed');
        progressTracker.complete();
      }
    },
    
    quickResolve: async (commentId: string) => {
      try {
        progressTracker.start();
        await store.quickResolve(commentId);
        progressTracker.complete();
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Quick resolve failed');
        progressTracker.complete();
      }
    },
    
    quickArchive: async (commentId: string) => {
      try {
        progressTracker.start();
        await store.quickArchive(commentId);
        progressTracker.complete();
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Quick archive failed');
        progressTracker.complete();
      }
    },
    
    quickMention: async (commentId: string, userIds: string[]) => {
      try {
        progressTracker.start();
        await store.quickMention(commentId, userIds);
        progressTracker.complete();
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : 'Quick mention failed');
        progressTracker.complete();
      }
    }
  }), [store, progressTracker]);
  
  // Throttled and Debounced Actions
  const throttledActions = useMemo(() => ({
    updateUserCursor: throttle(store.updateUserCursor, 100),
    updateUserSelection: throttle(store.updateUserSelection, 200),
    sync: throttle(store.sync, 1000)
  }), [store]);
  
  const debouncedActions = useMemo(() => ({
    searchComments: debounce(store.searchComments, 300),
    setFilter: debounce(store.setFilter, 500),
    updateConfig: debounce(store.updateConfig, 1000)
  }), [store]);
  
  // Enhanced Computed Values
  const computedValues = useMemo(() => {
    const filteredComments = store.comments.filter(comment => {
      const filter = store.filter;
      
      if (filter.author && comment.author.id !== filter.author) return false;
      if (filter.type && comment.type !== filter.type) return false;
      if (filter.status && comment.status !== filter.status) return false;
      if (filter.priority && comment.priority !== filter.priority) return false;
      if (filter.visibility && comment.visibility !== filter.visibility) return false;
      if (filter.hasAttachments !== undefined && (comment.attachments.length > 0) !== filter.hasAttachments) return false;
      if (filter.hasReplies !== undefined && (comment.replies.length > 0) !== filter.hasReplies) return false;
      if (filter.isResolved !== undefined && (comment.status === 'resolved') !== filter.isResolved) return false;
      
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => comment.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      if (filter.timeRange) {
        if (comment.timelinePosition < filter.timeRange.start || comment.timelinePosition > filter.timeRange.end) {
          return false;
        }
      }
      
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesContent = comment.content.toLowerCase().includes(query);
        const matchesAuthor = comment.author.name.toLowerCase().includes(query);
        const matchesTags = comment.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesContent && !matchesAuthor && !matchesTags) return false;
      }
      
      return true;
    });
    
    const sortedComments = [...filteredComments].sort((a, b) => {
      // Sort by timeline position by default
      return a.timelinePosition - b.timelinePosition;
    });
    
    const commentsByTimelinePosition = sortedComments.reduce((acc, comment) => {
      const position = Math.floor(comment.timelinePosition);
      if (!acc[position]) acc[position] = [];
      acc[position].push(comment);
      return acc;
    }, {} as Record<number, Comment[]>);
    
    const unreadNotifications = store.notifications.filter(n => !n.isRead);
    const criticalComments = store.comments.filter(c => c.priority === 'critical' && c.status === 'active');
    const unresolvedIssues = store.comments.filter(c => c.type === 'issue' && c.status === 'active');
    
    return {
      filteredComments,
      sortedComments,
      commentsByTimelinePosition,
      unreadNotifications,
      criticalComments,
      unresolvedIssues,
      hasActiveComments: store.comments.some(c => c.status === 'active'),
      hasUnreadNotifications: unreadNotifications.length > 0,
      hasCriticalComments: criticalComments.length > 0,
      totalEngagement: store.comments.reduce((sum, c) => sum + c.reactions.length + c.replies.length, 0)
    };
  }, [store.comments, store.filter, store.notifications]);
  
  // Error handling
  const error = localError || store.error;
  const clearError = useCallback(() => {
    setLocalError(null);
    // Clear store error if needed
  }, []);
  
  return {
    // State
    comments: store.comments,
    threads: store.threads,
    notifications: store.notifications,
    activeComment: store.activeComment,
    activeThread: store.activeThread,
    selectedComments: store.selectedComments,
    filter: store.filter,
    config: store.config,
    stats: store.stats,
    collaboration: store.collaboration,
    isLoading: store.isLoading || progressTracker.isActive,
    error,
    isConnected: store.isConnected,
    lastSync: store.lastSync,
    isInitialized,
    
    // Computed Values
    ...computedValues,
    
    // Actions
    ...actions,
    
    // Quick Actions
    ...quickActions,
    
    // Throttled Actions
    throttled: throttledActions,
    
    // Debounced Actions
    debounced: debouncedActions,
    
    // Utilities
    progress: progressTracker.progress,
    clearError
  };
};

// Specialized Hooks
export const useCommentStats = () => {
  const { stats, refreshStats } = useRealtimeComments();
  
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  
  return {
    stats,
    refreshStats
  };
};

export const useCommentConfig = () => {
  const { config, updateConfig, resetConfig } = useRealtimeComments();
  
  const updateSetting = useCallback((key: keyof RealtimeConfig, value: any) => {
    updateConfig({ [key]: value });
  }, [updateConfig]);
  
  return {
    config,
    updateConfig,
    updateSetting,
    resetConfig
  };
};

export const useCommentSearch = () => {
  const { searchComments, setFilter, clearFilter, filter } = useRealtimeComments();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Comment[]>([]);
  
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query.trim()) {
        const results = searchComments(query);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300),
    [searchComments]
  );
  
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setFilter({ ...filter, searchQuery: query });
  }, [setFilter, filter]);
  
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    clearFilter();
  }, [clearFilter]);
  
  return {
    searchQuery,
    searchResults,
    updateSearchQuery,
    clearSearch,
    hasResults: searchResults.length > 0
  };
};

export const useCommentCollaboration = () => {
  const { 
    collaboration, 
    updateUserCursor, 
    updateUserSelection, 
    setUserTyping,
    addActiveUser,
    removeActiveUser,
    throttled
  } = useRealtimeComments();
  
  const updateCursor = useCallback((userId: string, x: number, y: number, timelinePosition: number) => {
    throttled.updateUserCursor(userId, { x, y, timelinePosition });
  }, [throttled]);
  
  const updateSelection = useCallback((userId: string, start: number, end: number) => {
    throttled.updateUserSelection(userId, { start, end });
  }, [throttled]);
  
  const setTyping = useCallback((userId: string, isTyping: boolean) => {
    setUserTyping(userId, isTyping);
  }, [setUserTyping]);
  
  return {
    collaboration,
    activeUsers: collaboration.activeUsers,
    updateCursor,
    updateSelection,
    setTyping,
    addActiveUser,
    removeActiveUser,
    isCollaborationEnabled: collaboration.liveEditing
  };
};

export const useCommentNotifications = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications,
    unreadNotifications
  } = useRealtimeComments();
  
  const markAsRead = useCallback((id: string) => {
    markNotificationAsRead(id);
  }, [markNotificationAsRead]);
  
  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
  }, [markAllNotificationsAsRead]);
  
  const clear = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);
  
  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    hasUnread: unreadNotifications.length > 0,
    markAsRead,
    markAllAsRead,
    clear
  };
};

export const useCommentThreads = () => {
  const { 
    threads, 
    createThread, 
    updateThread, 
    deleteThread, 
    resolveThread,
    activeThread
  } = useRealtimeComments();
  
  const activeThreads = useMemo(() => 
    threads.filter(t => t.status === 'active'), 
    [threads]
  );
  
  const resolvedThreads = useMemo(() => 
    threads.filter(t => t.status === 'resolved'), 
    [threads]
  );
  
  return {
    threads,
    activeThreads,
    resolvedThreads,
    activeThread,
    createThread,
    updateThread,
    deleteThread,
    resolveThread,
    hasActiveThreads: activeThreads.length > 0
  };
};

export const useCommentTimeline = () => {
  const { 
    commentsByTimelinePosition, 
    navigateToTimelinePosition, 
    navigateToComment,
    comments
  } = useRealtimeComments();
  
  const getCommentsAtPosition = useCallback((position: number, tolerance: number = 1) => {
    const start = Math.floor(position - tolerance);
    const end = Math.ceil(position + tolerance);
    const commentsInRange: Comment[] = [];
    
    for (let i = start; i <= end; i++) {
      if (commentsByTimelinePosition[i]) {
        commentsInRange.push(...commentsByTimelinePosition[i]);
      }
    }
    
    return commentsInRange;
  }, [commentsByTimelinePosition]);
  
  const getTimelineRange = useCallback(() => {
    if (comments.length === 0) return { start: 0, end: 0 };
    
    const positions = comments.map(c => c.timelinePosition);
    return {
      start: Math.min(...positions),
      end: Math.max(...positions)
    };
  }, [comments]);
  
  const getCommentDensity = useCallback((segmentDuration: number = 10) => {
    const range = getTimelineRange();
    const segments = Math.ceil((range.end - range.start) / segmentDuration);
    const density: Record<number, number> = {};
    
    for (let i = 0; i < segments; i++) {
      const segmentStart = range.start + (i * segmentDuration);
      const segmentEnd = segmentStart + segmentDuration;
      
      density[i] = comments.filter(c => 
        c.timelinePosition >= segmentStart && c.timelinePosition < segmentEnd
      ).length;
    }
    
    return density;
  }, [comments, getTimelineRange]);
  
  return {
    commentsByTimelinePosition,
    getCommentsAtPosition,
    getTimelineRange,
    getCommentDensity,
    navigateToTimelinePosition,
    navigateToComment,
    totalComments: comments.length
  };
};

export const useCommentRealtime = () => {
  const { 
    isConnected, 
    lastSync, 
    connect, 
    disconnect, 
    sync, 
    enableRealTimeSync, 
    disableRealTimeSync,
    config,
    throttled
  } = useRealtimeComments();
  
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    isConnected ? 'connected' : 'disconnected'
  );
  
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);
  
  const handleConnect = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      await connect();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  }, [connect]);
  
  const handleDisconnect = useCallback(() => {
    disconnect();
    setConnectionStatus('disconnected');
  }, [disconnect]);
  
  const forceSync = useCallback(() => {
    throttled.sync();
  }, [throttled]);
  
  return {
    isConnected,
    connectionStatus,
    lastSync,
    isRealTimeSyncEnabled: config.enableRealTimeSync,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sync: forceSync,
    enableRealTimeSync,
    disableRealTimeSync
  };
};

// Utility Hooks
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
) => {
  return useMemo(() => throttle(func, delay), [func, delay]);
};

export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
) => {
  return useMemo(() => debounce(func, delay), [func, delay]);
};

// Helper function for comment complexity calculation
export const calculateCommentComplexity = (comment: Comment): number => {
  let complexity = 1; // Base complexity
  
  // Content length factor
  complexity += Math.min(comment.content.length / 100, 3);
  
  // Attachments factor
  complexity += comment.attachments.length * 0.5;
  
  // Replies factor
  complexity += comment.replies.length * 0.3;
  
  // Reactions factor
  complexity += comment.reactions.length * 0.1;
  
  // Mentions factor
  complexity += comment.mentions.length * 0.2;
  
  // Priority factor
  const priorityMultiplier = {
    low: 1,
    medium: 1.2,
    high: 1.5,
    critical: 2
  };
  complexity *= priorityMultiplier[comment.priority];
  
  // Type factor
  const typeMultiplier = {
    general: 1,
    suggestion: 1.1,
    issue: 1.3,
    approval: 1.2,
    question: 1.1
  };
  complexity *= typeMultiplier[comment.type];
  
  return Math.round(complexity * 10) / 10;
};