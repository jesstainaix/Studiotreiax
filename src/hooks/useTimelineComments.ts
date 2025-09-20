import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useTimelineCommentsStore, TimelineComment, CommentFilter, CommentThread, CommentNotification } from '../services/timelineCommentsService';

// Main hook for timeline comments
export const useTimelineComments = () => {
  const store = useTimelineCommentsStore();
  const initRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-initialize
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      store.initializeComments();
    }
  }, [store]);
  
  // Auto-refresh
  useEffect(() => {
    if (store.config.realTimeSync) {
      refreshIntervalRef.current = setInterval(() => {
        store.syncComments();
      }, 5000);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [store.config.realTimeSync, store]);
  
  // Demo data generation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (store.comments.length === 0) {
        // Generate demo comments
        for (let i = 0; i < 5; i++) {
          store.simulateComment();
        }
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [store]);
  
  // Memoized actions
  const actions = useMemo(() => ({
    // Comment Management
    addComment: store.addComment,
    updateComment: store.updateComment,
    deleteComment: store.deleteComment,
    replyToComment: store.replyToComment,
    resolveComment: store.resolveComment,
    archiveComment: store.archiveComment,
    
    // Reactions and Interactions
    addReaction: store.addReaction,
    removeReaction: store.removeReaction,
    mentionUser: store.mentionUser,
    
    // Attachments
    addAttachment: store.addAttachment,
    removeAttachment: store.removeAttachment,
    
    // Thread Management
    createThread: store.createThread,
    resolveThread: store.resolveThread,
    reopenThread: store.reopenThread,
    
    // Notifications
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    clearNotifications: store.clearNotifications,
    
    // Search and Filter
    setFilter: store.setFilter,
    setSearchQuery: store.setSearchQuery,
    searchComments: store.searchComments,
    
    // Real-time
    startTyping: store.startTyping,
    stopTyping: store.stopTyping,
    syncComments: store.syncComments,
    subscribeToUpdates: store.subscribeToUpdates,
    unsubscribeFromUpdates: store.unsubscribeFromUpdates
  }), [store]);
  
  // Quick actions
  const quickActions = useMemo(() => ({
    getCommentsByTimestamp: store.getCommentsByTimestamp,
    getCommentThread: store.getCommentThread,
    getUserComments: store.getUserComments,
    getUnresolvedComments: store.getUnresolvedComments,
    
    // Bulk operations
    resolveAllComments: async () => {
      const activeComments = store.activeComments;
      const ids = activeComments.map(c => c.id);
      await store.bulkUpdateComments(ids, { status: 'resolved' });
    },
    
    archiveAllResolved: async () => {
      const resolvedComments = store.resolvedComments;
      const ids = resolvedComments.map(c => c.id);
      await store.bulkUpdateComments(ids, { status: 'archived' });
    },
    
    deleteAllArchived: async () => {
      const archivedComments = store.comments.filter(c => c.status === 'archived');
      for (const comment of archivedComments) {
        await store.deleteComment(comment.id);
      }
    }
  }), [store]);
  
  // Advanced features
  const advancedFeatures = useMemo(() => ({
    exportComments: store.exportComments,
    importComments: store.importComments,
    bulkUpdateComments: store.bulkUpdateComments,
    duplicateComment: store.duplicateComment,
    
    // Batch operations
    batchResolve: async (ids: string[]) => {
      await store.bulkUpdateComments(ids, { status: 'resolved' });
    },
    
    batchArchive: async (ids: string[]) => {
      await store.bulkUpdateComments(ids, { status: 'archived' });
    },
    
    batchDelete: async (ids: string[]) => {
      for (const id of ids) {
        await store.deleteComment(id);
      }
    },
    
    batchUpdatePriority: async (ids: string[], priority: string) => {
      await store.bulkUpdateComments(ids, { priority: priority as any });
    },
    
    batchAddTags: async (ids: string[], tags: string[]) => {
      const comments = store.comments.filter(c => ids.includes(c.id));
      for (const comment of comments) {
        const newTags = [...new Set([...comment.tags, ...tags])];
        await store.updateComment(comment.id, { tags: newTags });
      }
    }
  }), [store]);
  
  // System operations
  const systemOperations = useMemo(() => ({
    initializeComments: store.initializeComments,
    refreshComments: store.refreshComments,
    clearCache: store.clearCache,
    resetState: store.resetState,
    
    // Maintenance operations
    cleanupOldComments: async (daysOld: number = 30) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldComments = store.comments.filter(c => 
        c.createdAt < cutoffDate && c.status === 'archived'
      );
      
      for (const comment of oldComments) {
        await store.deleteComment(comment.id);
      }
    },
    
    optimizeStorage: async () => {
      // Remove duplicate reactions
      for (const comment of store.comments) {
        const uniqueReactions = comment.reactions.filter((reaction, index, self) => 
          index === self.findIndex(r => r.userId === reaction.userId && r.emoji === reaction.emoji)
        );
        
        if (uniqueReactions.length !== comment.reactions.length) {
          await store.updateComment(comment.id, { reactions: uniqueReactions });
        }
      }
    },
    
    validateData: () => {
      const issues = [];
      
      for (const comment of store.comments) {
        if (!store.validateComment(comment)) {
          issues.push(`Invalid comment: ${comment.id}`);
        }
        
        if (comment.parentId && !store.comments.find(c => c.id === comment.parentId)) {
          issues.push(`Orphaned reply: ${comment.id}`);
        }
      }
      
      return issues;
    }
  }), [store]);
  
  // Utilities
  const utilities = useMemo(() => ({
    generateCommentId: store.generateCommentId,
    validateComment: store.validateComment,
    formatTimestamp: store.formatTimestamp,
    
    // Helper functions
    getCommentDepth: (commentId: string): number => {
      let depth = 0;
      let currentComment = store.comments.find(c => c.id === commentId);
      
      while (currentComment?.parentId) {
        depth++;
        currentComment = store.comments.find(c => c.id === currentComment!.parentId);
        if (depth > 10) break; // Prevent infinite loops
      }
      
      return depth;
    },
    
    getCommentPath: (commentId: string): string[] => {
      const path = [];
      let currentComment = store.comments.find(c => c.id === commentId);
      
      while (currentComment) {
        path.unshift(currentComment.id);
        currentComment = currentComment.parentId 
          ? store.comments.find(c => c.id === currentComment!.parentId)
          : null;
      }
      
      return path;
    },
    
    isCommentVisible: (comment: TimelineComment, filter: CommentFilter): boolean => {
      if (filter.status && comment.status !== filter.status) return false;
      if (filter.priority && comment.priority !== filter.priority) return false;
      if (filter.userId && comment.userId !== filter.userId) return false;
      if (filter.timeRange) {
        if (comment.timestamp < filter.timeRange.start || comment.timestamp > filter.timeRange.end) {
          return false;
        }
      }
      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.some(tag => comment.tags.includes(tag))) return false;
      }
      if (filter.hasAttachments !== undefined) {
        if (filter.hasAttachments && comment.attachments.length === 0) return false;
        if (!filter.hasAttachments && comment.attachments.length > 0) return false;
      }
      return true;
    }
  }), [store]);
  
  // Configuration and analytics helpers
  const configHelpers = useMemo(() => ({
    updateConfig: store.updateConfig,
    resetConfig: store.resetConfig,
    saveConfig: store.saveConfig,
    
    // Preset configurations
    enableCollaborationMode: async () => {
      await store.updateConfig({
        realTimeSync: true,
        notificationsEnabled: true,
        mentionNotifications: true,
        autoSave: true
      });
    },
    
    enableFocusMode: async () => {
      await store.updateConfig({
        notificationsEnabled: false,
        realTimeSync: false,
        autoSave: true
      });
    },
    
    enableModerationMode: async () => {
      await store.updateConfig({
        moderationEnabled: true,
        autoArchiveResolved: false,
        threadDepthLimit: 3
      });
    }
  }), [store]);
  
  const analyticsHelpers = useMemo(() => ({
    getCommentStats: store.getCommentStats,
    getEngagementMetrics: store.getEngagementMetrics,
    getResponseTimeMetrics: store.getResponseTimeMetrics,
    
    // Advanced analytics
    getActivityTrends: () => {
      const comments = store.comments;
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const recentComments = comments.filter(c => c.createdAt >= last7Days);
      const dailyActivity = {};
      
      recentComments.forEach(comment => {
        const day = comment.createdAt.toDateString();
        dailyActivity[day] = (dailyActivity[day] || 0) + 1;
      });
      
      return dailyActivity;
    },
    
    getUserEngagement: (userId: string) => {
      const userComments = store.getUserComments(userId);
      const totalReactions = userComments.reduce((sum, c) => sum + c.reactions.length, 0);
      const totalReplies = store.comments.filter(c => c.parentId && 
        userComments.some(uc => uc.id === c.parentId)).length;
      
      return {
        totalComments: userComments.length,
        totalReactions,
        totalReplies,
        avgReactionsPerComment: userComments.length > 0 ? totalReactions / userComments.length : 0
      };
    },
    
    getPopularTags: () => {
      const tagCounts = {};
      store.comments.forEach(comment => {
        comment.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
    }
  }), [store]);
  
  const debugHelpers = useMemo(() => ({
    getDebugInfo: store.getDebugInfo,
    simulateComment: store.simulateComment,
    clearAllComments: store.clearAllComments,
    
    // Debug utilities
    logState: () => {
    },
    
    validateIntegrity: () => {
      const issues = [];
      
      // Check for orphaned replies
      const orphanedReplies = store.comments.filter(c => 
        c.parentId && !store.comments.find(parent => parent.id === c.parentId)
      );
      
      if (orphanedReplies.length > 0) {
        issues.push(`Found ${orphanedReplies.length} orphaned replies`);
      }
      
      // Check for circular references
      store.comments.forEach(comment => {
        const path = utilities.getCommentPath(comment.id);
        if (path.length > 10) {
          issues.push(`Potential circular reference in comment ${comment.id}`);
        }
      });
      
      return issues;
    }
  }), [store, utilities]);
  
  // Computed values
  const computedValues = useMemo(() => ({
    totalComments: store.comments.length,
    activeComments: store.activeComments.length,
    resolvedComments: store.resolvedComments.length,
    unreadNotifications: store.unreadNotifications.length,
    filteredComments: store.filteredComments,
    commentsByTimestamp: store.commentsByTimestamp,
    
    // Additional computed values
    commentsWithReplies: store.comments.filter(c => 
      store.comments.some(reply => reply.parentId === c.id)
    ).length,
    
    commentsWithAttachments: store.comments.filter(c => c.attachments.length > 0).length,
    
    commentsWithReactions: store.comments.filter(c => c.reactions.length > 0).length,
    
    averageCommentsPerUser: (() => {
      const userCounts = {};
      store.comments.forEach(c => {
        userCounts[c.userId] = (userCounts[c.userId] || 0) + 1;
      });
      const users = Object.keys(userCounts);
      return users.length > 0 ? store.comments.length / users.length : 0;
    })(),
    
    mostActiveTimeRange: (() => {
      const hourCounts = {};
      store.comments.forEach(comment => {
        const hour = Math.floor(comment.timestamp / 3600000); // Group by hour
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const maxCount = Math.max(...Object.values(hourCounts));
      const mostActiveHour = Object.keys(hourCounts).find(hour => hourCounts[hour] === maxCount);
      
      return mostActiveHour ? {
        hour: parseInt(mostActiveHour),
        count: maxCount,
        timestamp: parseInt(mostActiveHour) * 3600000
      } : null;
    })()
  }), [store]);
  
  return {
    // State
    comments: store.comments,
    threads: store.threads,
    notifications: store.notifications,
    stats: store.stats,
    config: store.config,
    isLoading: store.isLoading,
    error: store.error,
    selectedComment: store.selectedComment,
    activeThread: store.activeThread,
    filter: store.filter,
    searchQuery: store.searchQuery,
    connectedUsers: store.connectedUsers,
    typingUsers: store.typingUsers,
    lastSync: store.lastSync,
    
    // Actions
    ...actions,
    
    // Quick actions
    ...quickActions,
    
    // Advanced features
    ...advancedFeatures,
    
    // System operations
    ...systemOperations,
    
    // Utilities
    ...utilities,
    
    // Configuration and analytics
    ...configHelpers,
    ...analyticsHelpers,
    
    // Debug helpers
    ...debugHelpers,
    
    // Computed values
    ...computedValues
  };
};

// Specialized hooks
export const useCommentStats = () => {
  const { stats, getCommentStats, getEngagementMetrics, getResponseTimeMetrics } = useTimelineComments();
  
  useEffect(() => {
    getCommentStats();
  }, [getCommentStats]);
  
  return {
    stats,
    engagementMetrics: getEngagementMetrics(),
    responseTimeMetrics: getResponseTimeMetrics(),
    refreshStats: getCommentStats
  };
};

export const useCommentConfig = () => {
  const { 
    config, 
    updateConfig, 
    resetConfig, 
    saveConfig,
    enableCollaborationMode,
    enableFocusMode,
    enableModerationMode
  } = useTimelineComments();
  
  return {
    config,
    updateConfig,
    resetConfig,
    saveConfig,
    presets: {
      collaboration: enableCollaborationMode,
      focus: enableFocusMode,
      moderation: enableModerationMode
    }
  };
};

export const useCommentThreads = () => {
  const { 
    threads, 
    createThread, 
    resolveThread, 
    reopenThread,
    getCommentThread,
    comments
  } = useTimelineComments();
  
  const getThreadByComment = useCallback((commentId: string) => {
    return getCommentThread(commentId);
  }, [getCommentThread]);
  
  const getThreadReplies = useCallback((threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return [];
    
    return comments.filter(c => c.parentId === thread.rootComment.id);
  }, [threads, comments]);
  
  return {
    threads,
    createThread,
    resolveThread,
    reopenThread,
    getThreadByComment,
    getThreadReplies
  };
};

export const useCommentNotifications = () => {
  const { 
    notifications, 
    unreadNotifications,
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotifications 
  } = useTimelineComments();
  
  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);
  
  const getUnreadCount = useCallback(() => {
    return unreadNotifications;
  }, [unreadNotifications]);
  
  return {
    notifications,
    unreadNotifications,
    unreadCount: getUnreadCount(),
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    getNotificationsByType
  };
};

export const useCommentAnalytics = () => {
  const { 
    getActivityTrends, 
    getUserEngagement, 
    getPopularTags,
    stats
  } = useTimelineComments();
  
  const analytics = useMemo(() => ({
    activityTrends: getActivityTrends(),
    popularTags: getPopularTags(),
    stats
  }), [getActivityTrends, getPopularTags, stats]);
  
  const getUserAnalytics = useCallback((userId: string) => {
    return getUserEngagement(userId);
  }, [getUserEngagement]);
  
  return {
    ...analytics,
    getUserAnalytics
  };
};

export const useCommentRealTime = () => {
  const { 
    connectedUsers, 
    typingUsers, 
    lastSync,
    startTyping, 
    stopTyping, 
    syncComments,
    subscribeToUpdates,
    unsubscribeFromUpdates
  } = useTimelineComments();
  
  useEffect(() => {
    subscribeToUpdates();
    return () => unsubscribeFromUpdates();
  }, [subscribeToUpdates, unsubscribeFromUpdates]);
  
  return {
    connectedUsers,
    typingUsers,
    lastSync,
    startTyping,
    stopTyping,
    syncComments,
    isConnected: lastSync !== null
  };
};

// Utility hooks
export const useThrottledCommentSearch = (delay: number = 300) => {
  const { searchComments, setSearchQuery } = useTimelineComments();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const throttledSearch = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
    }, delay);
  }, [setSearchQuery, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    searchComments,
    throttledSearch
  };
};

export const useDebouncedCommentUpdate = (delay: number = 500) => {
  const { updateComment } = useTimelineComments();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedUpdate = useCallback((id: string, updates: Partial<TimelineComment>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      updateComment(id, updates);
    }, delay);
  }, [updateComment, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedUpdate;
};

export const useCommentProgress = () => {
  const { isLoading, error, comments } = useTimelineComments();
  
  const progress = useMemo(() => {
    if (isLoading) return { status: 'loading', percentage: 0 };
    if (error) return { status: 'error', percentage: 0, error };
    return { status: 'success', percentage: 100, count: comments.length };
  }, [isLoading, error, comments.length]);
  
  return progress;
};

// Helper functions
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

export { throttle, debounce };