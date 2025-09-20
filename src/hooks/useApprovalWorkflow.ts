import { useCallback, useEffect, useMemo, useState } from 'react';
import useApprovalWorkflowStore, {
  ApprovalRequest,
  ApprovalWorkflow,
  ApprovalTemplate,
  ApprovalAction,
  ReviewComment,
  ApprovalStats,
  WorkflowStats,
  ApprovalConfig
} from '../services/approvalWorkflowService';

// Utility functions
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

// Progress tracking hook
export const useApprovalProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  
  const startProgress = useCallback((step: string) => {
    setIsProcessing(true);
    setCurrentStep(step);
    setProgress(0);
  }, []);
  
  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('');
      setProgress(0);
    }, 1000);
  }, []);
  
  return {
    progress,
    isProcessing,
    currentStep,
    startProgress,
    updateProgress,
    completeProgress
  };
};

// Main hook
export const useApprovalWorkflow = () => {
  const store = useApprovalWorkflowStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      store.refreshData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, store]);
  
  // Initialize data on mount
  useEffect(() => {
    store.refreshData();
  }, [store]);
  
  // Memoized actions with error handling
  const actions = useMemo(() => ({
    // Request actions
    createRequest: async (requestData: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        return await store.createRequest(requestData);
      } catch (error) {
        console.error('Erro ao criar solicitação:', error);
        throw error;
      }
    },
    
    updateRequest: async (id: string, updates: Partial<ApprovalRequest>) => {
      try {
        await store.updateRequest(id, updates);
      } catch (error) {
        console.error('Erro ao atualizar solicitação:', error);
        throw error;
      }
    },
    
    deleteRequest: async (id: string) => {
      try {
        await store.deleteRequest(id);
      } catch (error) {
        console.error('Erro ao excluir solicitação:', error);
        throw error;
      }
    },
    
    // Approval actions
    approveRequest: async (requestId: string, stepId: string, comment?: string) => {
      try {
        await store.approveRequest(requestId, stepId, comment);
      } catch (error) {
        console.error('Erro ao aprovar solicitação:', error);
        throw error;
      }
    },
    
    rejectRequest: async (requestId: string, stepId: string, reason: string) => {
      try {
        await store.rejectRequest(requestId, stepId, reason);
      } catch (error) {
        console.error('Erro ao rejeitar solicitação:', error);
        throw error;
      }
    },
    
    requestChanges: async (requestId: string, stepId: string, changes: string) => {
      try {
        await store.requestChanges(requestId, stepId, changes);
      } catch (error) {
        console.error('Erro ao solicitar mudanças:', error);
        throw error;
      }
    },
    
    // Workflow actions
    createWorkflow: async (workflowData: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
      try {
        return await store.createWorkflow(workflowData);
      } catch (error) {
        console.error('Erro ao criar fluxo de trabalho:', error);
        throw error;
      }
    },
    
    updateWorkflow: async (id: string, updates: Partial<ApprovalWorkflow>) => {
      try {
        await store.updateWorkflow(id, updates);
      } catch (error) {
        console.error('Erro ao atualizar fluxo de trabalho:', error);
        throw error;
      }
    },
    
    deleteWorkflow: async (id: string) => {
      try {
        await store.deleteWorkflow(id);
      } catch (error) {
        console.error('Erro ao excluir fluxo de trabalho:', error);
        throw error;
      }
    }
  }), [store]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    submitRequest: async (id: string) => {
      try {
        await store.submitRequest(id);
      } catch (error) {
        console.error('Erro ao enviar solicitação:', error);
        throw error;
      }
    },
    
    cancelRequest: async (id: string, reason: string) => {
      try {
        await store.cancelRequest(id, reason);
      } catch (error) {
        console.error('Erro ao cancelar solicitação:', error);
        throw error;
      }
    },
    
    delegateApproval: async (requestId: string, stepId: string, delegateTo: string) => {
      try {
        await store.delegateApproval(requestId, stepId, delegateTo);
      } catch (error) {
        console.error('Erro ao delegar aprovação:', error);
        throw error;
      }
    },
    
    escalateRequest: async (requestId: string, stepId: string, reason: string) => {
      try {
        await store.escalateRequest(requestId, stepId, reason);
      } catch (error) {
        console.error('Erro ao escalar solicitação:', error);
        throw error;
      }
    },
    
    activateWorkflow: async (id: string) => {
      try {
        await store.activateWorkflow(id);
      } catch (error) {
        console.error('Erro ao ativar fluxo de trabalho:', error);
        throw error;
      }
    },
    
    deactivateWorkflow: async (id: string) => {
      try {
        await store.deactivateWorkflow(id);
      } catch (error) {
        console.error('Erro ao desativar fluxo de trabalho:', error);
        throw error;
      }
    }
  }), [store]);
  
  // Throttled actions
  const throttledActions = useMemo(() => ({
    search: throttle((query: string) => {
      return store.searchRequests(query);
    }, 300),
    
    filter: throttle((filters: any) => {
      return store.filterRequests(filters);
    }, 300)
  }), [store]);
  
  // Debounced actions
  const debouncedActions = useMemo(() => ({
    updateConfig: debounce(async (config: Partial<ApprovalConfig>) => {
      try {
        await store.updateConfig(config);
      } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        throw error;
      }
    }, 1000)
  }), [store]);
  
  // Enhanced computed values
  const computed = useMemo(() => {
    const requests = store.requests;
    const workflows = store.workflows;
    
    return {
      // Request statistics
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      rejectedRequests: requests.filter(r => r.status === 'rejected').length,
      
      // Workflow statistics
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.isActive).length,
      
      // Priority distribution
      priorityDistribution: {
        low: requests.filter(r => r.priority === 'low').length,
        medium: requests.filter(r => r.priority === 'medium').length,
        high: requests.filter(r => r.priority === 'high').length,
        critical: requests.filter(r => r.priority === 'critical').length
      },
      
      // Type distribution
      typeDistribution: requests.reduce((acc, request) => {
        acc[request.type] = (acc[request.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Recent activity
      recentRequests: requests
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10),
      
      // Overdue requests
      overdueRequests: requests.filter(r => 
        r.dueDate && r.dueDate < new Date() && r.status === 'pending'
      ),
      
      // High priority pending
      urgentRequests: requests.filter(r => 
        (r.priority === 'high' || r.priority === 'critical') && r.status === 'pending'
      )
    };
  }, [store.requests, store.workflows]);
  
  // Filtered data based on current filters
  const filteredData = useMemo(() => {
    let filtered = store.requests;
    
    if (store.statusFilter) {
      filtered = filtered.filter(r => r.status === store.statusFilter);
    }
    
    if (store.typeFilter) {
      filtered = filtered.filter(r => r.type === store.typeFilter);
    }
    
    if (store.priorityFilter) {
      filtered = filtered.filter(r => r.priority === store.priorityFilter);
    }
    
    if (store.assigneeFilter) {
      filtered = filtered.filter(r => r.requesterId === store.assigneeFilter);
    }
    
    if (store.dateRange.start) {
      filtered = filtered.filter(r => r.createdAt >= store.dateRange.start!);
    }
    
    if (store.dateRange.end) {
      filtered = filtered.filter(r => r.createdAt <= store.dateRange.end!);
    }
    
    return filtered;
  }, [
    store.requests,
    store.statusFilter,
    store.typeFilter,
    store.priorityFilter,
    store.assigneeFilter,
    store.dateRange
  ]);
  
  return {
    // State
    requests: store.requests,
    workflows: store.workflows,
    actions: store.actions,
    comments: store.comments,
    templates: store.templates,
    notifications: store.notifications,
    
    // Selection
    selectedRequest: store.selectedRequest,
    selectedWorkflow: store.selectedWorkflow,
    selectedTemplate: store.selectedTemplate,
    
    // UI State
    isLoading: store.isLoading,
    error: store.error,
    lastUpdate: store.lastUpdate,
    
    // Filters
    statusFilter: store.statusFilter,
    typeFilter: store.typeFilter,
    priorityFilter: store.priorityFilter,
    assigneeFilter: store.assigneeFilter,
    dateRange: store.dateRange,
    
    // Stats
    stats: store.stats,
    workflowStats: store.workflowStats,
    config: store.config,
    
    // Actions
    actions,
    quickActions,
    throttledActions,
    debouncedActions,
    
    // Computed values
    computed,
    filteredData,
    
    // Filter actions
    setStatusFilter: store.setStatusFilter,
    setTypeFilter: store.setTypeFilter,
    setPriorityFilter: store.setPriorityFilter,
    setAssigneeFilter: store.setAssigneeFilter,
    setDateRange: store.setDateRange,
    clearFilters: store.clearFilters,
    
    // Selection actions
    selectRequest: store.selectRequest,
    selectWorkflow: store.selectWorkflow,
    selectTemplate: store.selectTemplate,
    
    // Data management
    refreshData: store.refreshData,
    
    // Auto-refresh controls
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };
};

// Specialized hooks
export const useApprovalStats = () => {
  const { stats, workflowStats, computed } = useApprovalWorkflow();
  
  return {
    stats,
    workflowStats,
    computed,
    
    // Additional computed stats
    approvalRate: computed.totalRequests > 0 
      ? (computed.approvedRequests / computed.totalRequests) * 100 
      : 0,
    
    rejectionRate: computed.totalRequests > 0 
      ? (computed.rejectedRequests / computed.totalRequests) * 100 
      : 0,
    
    pendingRate: computed.totalRequests > 0 
      ? (computed.pendingRequests / computed.totalRequests) * 100 
      : 0
  };
};

export const useApprovalConfig = () => {
  const { config, debouncedActions } = useApprovalWorkflow();
  
  return {
    config,
    updateConfig: debouncedActions.updateConfig
  };
};

export const useApprovalSearch = () => {
  const { throttledActions, filteredData } = useApprovalWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApprovalRequest[]>([]);
  
  const search = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = throttledActions.search(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [throttledActions]);
  
  return {
    searchQuery,
    searchResults: searchQuery.trim() ? searchResults : filteredData,
    search,
    clearSearch: () => {
      setSearchQuery('');
      setSearchResults([]);
    }
  };
};

export const useApprovalWorkflows = () => {
  const { workflows, actions, quickActions, selectedWorkflow, selectWorkflow } = useApprovalWorkflow();
  
  return {
    workflows,
    selectedWorkflow,
    selectWorkflow,
    createWorkflow: actions.createWorkflow,
    updateWorkflow: actions.updateWorkflow,
    deleteWorkflow: actions.deleteWorkflow,
    activateWorkflow: quickActions.activateWorkflow,
    deactivateWorkflow: quickActions.deactivateWorkflow,
    
    // Computed values
    activeWorkflows: workflows.filter(w => w.isActive),
    inactiveWorkflows: workflows.filter(w => !w.isActive)
  };
};

export const useApprovalRequests = () => {
  const { 
    requests, 
    actions, 
    quickActions, 
    selectedRequest, 
    selectRequest,
    computed
  } = useApprovalWorkflow();
  
  return {
    requests,
    selectedRequest,
    selectRequest,
    createRequest: actions.createRequest,
    updateRequest: actions.updateRequest,
    deleteRequest: actions.deleteRequest,
    approveRequest: actions.approveRequest,
    rejectRequest: actions.rejectRequest,
    requestChanges: actions.requestChanges,
    submitRequest: quickActions.submitRequest,
    cancelRequest: quickActions.cancelRequest,
    delegateApproval: quickActions.delegateApproval,
    escalateRequest: quickActions.escalateRequest,
    
    // Computed values
    pendingRequests: requests.filter(r => r.status === 'pending'),
    approvedRequests: requests.filter(r => r.status === 'approved'),
    rejectedRequests: requests.filter(r => r.status === 'rejected'),
    overdueRequests: computed.overdueRequests,
    urgentRequests: computed.urgentRequests
  };
};

export const useApprovalComments = () => {
  const store = useApprovalWorkflowStore();
  
  return {
    comments: store.comments,
    addComment: store.addComment,
    updateComment: store.updateComment,
    deleteComment: store.deleteComment,
    resolveComment: store.resolveComment,
    replyToComment: store.replyToComment,
    
    // Computed values
    getCommentsForRequest: (requestId: string) => 
      store.comments.filter(c => c.requestId === requestId),
    
    getUnresolvedComments: (requestId: string) => 
      store.comments.filter(c => c.requestId === requestId && !c.isResolved)
  };
};

export const useApprovalTemplates = () => {
  const store = useApprovalWorkflowStore();
  
  return {
    templates: store.templates,
    selectedTemplate: store.selectedTemplate,
    selectTemplate: store.selectTemplate,
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    
    // Computed values
    defaultTemplates: store.templates.filter(t => t.isDefault),
    customTemplates: store.templates.filter(t => !t.isDefault)
  };
};

export const useApprovalNotifications = () => {
  const store = useApprovalWorkflowStore();
  
  return {
    notifications: store.notifications,
    markAsRead: store.markNotificationAsRead,
    markAllAsRead: store.markAllNotificationsAsRead,
    deleteNotification: store.deleteNotification,
    
    // Computed values
    unreadCount: store.notifications.filter(n => !n.isRead).length,
    unreadNotifications: store.notifications.filter(n => !n.isRead),
    recentNotifications: store.notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
  };
};

export const useApprovalRealtime = () => {
  const { refreshData, autoRefresh, setAutoRefresh } = useApprovalWorkflow();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  useEffect(() => {
    if (autoRefresh) {
      setConnectionStatus('connecting');
      // Simulate connection
      setTimeout(() => {
        setConnectionStatus('connected');
        setLastSync(new Date());
      }, 1000);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [autoRefresh]);
  
  const forceSync = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      await refreshData();
      setConnectionStatus('connected');
      setLastSync(new Date());
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Erro na sincronização:', error);
    }
  }, [refreshData]);
  
  return {
    connectionStatus,
    lastSync,
    isConnected: connectionStatus === 'connected',
    autoRefresh,
    setAutoRefresh,
    forceSync
  };
};

// Utility hooks
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

// Helper function for request complexity calculation
export const calculateRequestComplexity = (request: ApprovalRequest): number => {
  let complexity = 0;
  
  // Base complexity by type
  switch (request.type) {
    case 'code_change': complexity += 3; break;
    case 'config_change': complexity += 2; break;
    case 'deployment': complexity += 4; break;
    case 'feature_flag': complexity += 1; break;
    case 'data_change': complexity += 3; break;
    case 'security_change': complexity += 5; break;
  }
  
  // Priority multiplier
  switch (request.priority) {
    case 'low': complexity *= 1; break;
    case 'medium': complexity *= 1.5; break;
    case 'high': complexity *= 2; break;
    case 'critical': complexity *= 3; break;
  }
  
  // Additional factors
  complexity += request.affectedSystems.length * 0.5;
  complexity += request.changes.length * 0.3;
  complexity += request.attachments.length * 0.2;
  
  return Math.round(complexity * 10) / 10;
};

export default useApprovalWorkflow;