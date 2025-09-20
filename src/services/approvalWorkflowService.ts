import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  type: 'code_change' | 'config_change' | 'deployment' | 'feature_flag' | 'data_change' | 'security_change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  workflowId: string;
  currentStepId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  estimatedImpact: 'low' | 'medium' | 'high';
  affectedSystems: string[];
  changes: ChangeItem[];
  attachments: Attachment[];
  metadata: Record<string, any>;
  tags: string[];
}

export interface ChangeItem {
  id: string;
  type: 'file' | 'config' | 'database' | 'infrastructure';
  path: string;
  action: 'create' | 'update' | 'delete' | 'rename';
  oldValue?: string;
  newValue?: string;
  diff?: string;
  size: number;
  checksum?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'review' | 'test' | 'notification' | 'automation';
  order: number;
  isRequired: boolean;
  approvers: Approver[];
  conditions: StepCondition[];
  timeoutMinutes?: number;
  autoApprove?: boolean;
  parallelExecution?: boolean;
  settings: Record<string, any>;
}

export interface Approver {
  id: string;
  type: 'user' | 'group' | 'role';
  name: string;
  email?: string;
  avatar?: string;
  isRequired: boolean;
  weight: number;
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  action: 'apply' | 'skip' | 'require_additional_approval';
}

export interface WorkflowSettings {
  autoAssign: boolean;
  allowSelfApproval: boolean;
  requireAllApprovers: boolean;
  escalationEnabled: boolean;
  escalationTimeoutMinutes: number;
  notificationSettings: NotificationSettings;
  auditSettings: AuditSettings;
}

export interface NotificationSettings {
  onSubmission: boolean;
  onApproval: boolean;
  onRejection: boolean;
  onTimeout: boolean;
  channels: string[];
  customTemplates: Record<string, string>;
}

export interface AuditSettings {
  logAllActions: boolean;
  retentionDays: number;
  includeMetadata: boolean;
  exportFormat: 'json' | 'csv' | 'xml';
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  stepId: string;
  approverId: string;
  approverName: string;
  action: 'approve' | 'reject' | 'request_changes' | 'delegate' | 'escalate';
  comment?: string;
  timestamp: Date;
  metadata: Record<string, any>;
  attachments: string[];
}

export interface ReviewComment {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: 'general' | 'suggestion' | 'concern' | 'question';
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies: ReviewComment[];
  mentions: string[];
  attachments: string[];
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  averageApprovalTime: number;
  approvalRate: number;
  bottlenecks: string[];
}

export interface WorkflowStats {
  total: number;
  active: number;
  usage: Record<string, number>;
  performance: Record<string, number>;
  effectiveness: number;
}

export interface ApprovalConfig {
  defaultWorkflow: string;
  autoAssignEnabled: boolean;
  escalationEnabled: boolean;
  notificationsEnabled: boolean;
  auditEnabled: boolean;
  retentionDays: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  integrations: Record<string, any>;
}

export interface ApprovalNotification {
  id: string;
  type: 'request_submitted' | 'approval_needed' | 'approved' | 'rejected' | 'escalated' | 'expired';
  title: string;
  message: string;
  requestId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata: Record<string, any>;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  fields: TemplateField[];
  workflow: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  usage: number;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'file' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: Record<string, any>;
  defaultValue?: any;
}

export interface EscalationRule {
  id: string;
  name: string;
  workflowId: string;
  stepId: string;
  timeoutMinutes: number;
  escalateTo: Approver[];
  conditions: StepCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Store State
interface ApprovalWorkflowState {
  // Data
  requests: ApprovalRequest[];
  workflows: ApprovalWorkflow[];
  actions: ApprovalAction[];
  comments: ReviewComment[];
  templates: ApprovalTemplate[];
  escalationRules: EscalationRule[];
  notifications: ApprovalNotification[];
  
  // Selection
  selectedRequest: ApprovalRequest | null;
  selectedWorkflow: ApprovalWorkflow | null;
  selectedTemplate: ApprovalTemplate | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Filters
  statusFilter: string;
  typeFilter: string;
  priorityFilter: string;
  assigneeFilter: string;
  dateRange: { start: Date | null; end: Date | null };
  
  // Stats
  stats: ApprovalStats;
  workflowStats: WorkflowStats;
  
  // Config
  config: ApprovalConfig;
}

// Store Actions
interface ApprovalWorkflowActions {
  // Request Management
  createRequest: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRequest: (id: string, updates: Partial<ApprovalRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  submitRequest: (id: string) => Promise<void>;
  cancelRequest: (id: string, reason: string) => Promise<void>;
  
  // Approval Actions
  approveRequest: (requestId: string, stepId: string, comment?: string) => Promise<void>;
  rejectRequest: (requestId: string, stepId: string, reason: string) => Promise<void>;
  requestChanges: (requestId: string, stepId: string, changes: string) => Promise<void>;
  delegateApproval: (requestId: string, stepId: string, delegateTo: string) => Promise<void>;
  escalateRequest: (requestId: string, stepId: string, reason: string) => Promise<void>;
  
  // Workflow Management
  createWorkflow: (workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<string>;
  updateWorkflow: (id: string, updates: Partial<ApprovalWorkflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  activateWorkflow: (id: string) => Promise<void>;
  deactivateWorkflow: (id: string) => Promise<void>;
  duplicateWorkflow: (id: string, name: string) => Promise<string>;
  
  // Comment Management
  addComment: (requestId: string, content: string, type: ReviewComment['type']) => Promise<string>;
  updateComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  resolveComment: (id: string) => Promise<void>;
  replyToComment: (parentId: string, content: string) => Promise<string>;
  
  // Template Management
  createTemplate: (template: Omit<ApprovalTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage'>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<ApprovalTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Notification Management
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Search and Filter
  searchRequests: (query: string) => ApprovalRequest[];
  filterRequests: (filters: Partial<ApprovalWorkflowState>) => ApprovalRequest[];
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  setPriorityFilter: (priority: string) => void;
  setAssigneeFilter: (assignee: string) => void;
  setDateRange: (start: Date | null, end: Date | null) => void;
  clearFilters: () => void;
  
  // Selection
  selectRequest: (request: ApprovalRequest | null) => void;
  selectWorkflow: (workflow: ApprovalWorkflow | null) => void;
  selectTemplate: (template: ApprovalTemplate | null) => void;
  
  // Data Management
  refreshData: () => Promise<void>;
  loadRequests: () => Promise<void>;
  loadWorkflows: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  
  // Quick Actions
  bulkApprove: (requestIds: string[], comment?: string) => Promise<void>;
  bulkReject: (requestIds: string[], reason: string) => Promise<void>;
  exportRequests: (format: 'json' | 'csv' | 'excel') => Promise<void>;
  importWorkflows: (file: File) => Promise<void>;
  
  // Advanced Features
  analyzeBottlenecks: () => Promise<string[]>;
  optimizeWorkflows: () => Promise<void>;
  generateReport: (type: 'performance' | 'usage' | 'compliance') => Promise<any>;
  
  // System Operations
  updateConfig: (config: Partial<ApprovalConfig>) => Promise<void>;
  runHealthCheck: () => Promise<boolean>;
  clearCache: () => Promise<void>;
}

// Create Store
const useApprovalWorkflowStore = create<ApprovalWorkflowState & ApprovalWorkflowActions>()
  (subscribeWithSelector((set, get) => ({
    // Initial State
    requests: [],
    workflows: [],
    actions: [],
    comments: [],
    templates: [],
    escalationRules: [],
    notifications: [],
    selectedRequest: null,
    selectedWorkflow: null,
    selectedTemplate: null,
    isLoading: false,
    error: null,
    lastUpdate: null,
    statusFilter: '',
    typeFilter: '',
    priorityFilter: '',
    assigneeFilter: '',
    dateRange: { start: null, end: null },
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      averageApprovalTime: 0,
      approvalRate: 0,
      bottlenecks: []
    },
    workflowStats: {
      total: 0,
      active: 0,
      usage: {},
      performance: {},
      effectiveness: 0
    },
    config: {
      defaultWorkflow: '',
      autoAssignEnabled: true,
      escalationEnabled: true,
      notificationsEnabled: true,
      auditEnabled: true,
      retentionDays: 90,
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'],
      integrations: {}
    },
    
    // Request Management
    createRequest: async (requestData) => {
      set({ isLoading: true, error: null });
      try {
        const newRequest: ApprovalRequest = {
          ...requestData,
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          requests: [...state.requests, newRequest],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        return newRequest.id;
      } catch (error) {
        set({ error: 'Falha ao criar solicitação', isLoading: false });
        throw error;
      }
    },
    
    updateRequest: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          requests: state.requests.map(req => 
            req.id === id ? { ...req, ...updates, updatedAt: new Date() } : req
          ),
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao atualizar solicitação', isLoading: false });
        throw error;
      }
    },
    
    deleteRequest: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          requests: state.requests.filter(req => req.id !== id),
          selectedRequest: state.selectedRequest?.id === id ? null : state.selectedRequest,
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao excluir solicitação', isLoading: false });
        throw error;
      }
    },
    
    submitRequest: async (id) => {
      const { updateRequest } = get();
      await updateRequest(id, { status: 'pending' });
    },
    
    cancelRequest: async (id, reason) => {
      const { updateRequest } = get();
      await updateRequest(id, { 
        status: 'cancelled',
        metadata: { ...get().requests.find(r => r.id === id)?.metadata, cancellationReason: reason }
      });
    },
    
    // Approval Actions
    approveRequest: async (requestId, stepId, comment) => {
      set({ isLoading: true, error: null });
      try {
        const action: ApprovalAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          stepId,
          approverId: 'current-user',
          approverName: 'Current User',
          action: 'approve',
          comment,
          timestamp: new Date(),
          metadata: {},
          attachments: []
        };
        
        set(state => ({
          actions: [...state.actions, action],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        // Update request status if all approvals are complete
        const { updateRequest } = get();
        await updateRequest(requestId, { status: 'approved' });
      } catch (error) {
        set({ error: 'Falha ao aprovar solicitação', isLoading: false });
        throw error;
      }
    },
    
    rejectRequest: async (requestId, stepId, reason) => {
      set({ isLoading: true, error: null });
      try {
        const action: ApprovalAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          stepId,
          approverId: 'current-user',
          approverName: 'Current User',
          action: 'reject',
          comment: reason,
          timestamp: new Date(),
          metadata: {},
          attachments: []
        };
        
        set(state => ({
          actions: [...state.actions, action],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        const { updateRequest } = get();
        await updateRequest(requestId, { status: 'rejected' });
      } catch (error) {
        set({ error: 'Falha ao rejeitar solicitação', isLoading: false });
        throw error;
      }
    },
    
    requestChanges: async (requestId, stepId, changes) => {
      set({ isLoading: true, error: null });
      try {
        const action: ApprovalAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          stepId,
          approverId: 'current-user',
          approverName: 'Current User',
          action: 'request_changes',
          comment: changes,
          timestamp: new Date(),
          metadata: {},
          attachments: []
        };
        
        set(state => ({
          actions: [...state.actions, action],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        const { updateRequest } = get();
        await updateRequest(requestId, { status: 'draft' });
      } catch (error) {
        set({ error: 'Falha ao solicitar mudanças', isLoading: false });
        throw error;
      }
    },
    
    delegateApproval: async (requestId, stepId, delegateTo) => {
      set({ isLoading: true, error: null });
      try {
        const action: ApprovalAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          stepId,
          approverId: 'current-user',
          approverName: 'Current User',
          action: 'delegate',
          timestamp: new Date(),
          metadata: { delegatedTo: delegateTo },
          attachments: []
        };
        
        set(state => ({
          actions: [...state.actions, action],
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao delegar aprovação', isLoading: false });
        throw error;
      }
    },
    
    escalateRequest: async (requestId, stepId, reason) => {
      set({ isLoading: true, error: null });
      try {
        const action: ApprovalAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          stepId,
          approverId: 'current-user',
          approverName: 'Current User',
          action: 'escalate',
          comment: reason,
          timestamp: new Date(),
          metadata: {},
          attachments: []
        };
        
        set(state => ({
          actions: [...state.actions, action],
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao escalar solicitação', isLoading: false });
        throw error;
      }
    },
    
    // Workflow Management
    createWorkflow: async (workflowData) => {
      set({ isLoading: true, error: null });
      try {
        const newWorkflow: ApprovalWorkflow = {
          ...workflowData,
          id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        };
        
        set(state => ({
          workflows: [...state.workflows, newWorkflow],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        return newWorkflow.id;
      } catch (error) {
        set({ error: 'Falha ao criar fluxo de trabalho', isLoading: false });
        throw error;
      }
    },
    
    updateWorkflow: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          workflows: state.workflows.map(wf => 
            wf.id === id ? { 
              ...wf, 
              ...updates, 
              updatedAt: new Date(),
              version: wf.version + 1
            } : wf
          ),
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao atualizar fluxo de trabalho', isLoading: false });
        throw error;
      }
    },
    
    deleteWorkflow: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          workflows: state.workflows.filter(wf => wf.id !== id),
          selectedWorkflow: state.selectedWorkflow?.id === id ? null : state.selectedWorkflow,
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao excluir fluxo de trabalho', isLoading: false });
        throw error;
      }
    },
    
    activateWorkflow: async (id) => {
      const { updateWorkflow } = get();
      await updateWorkflow(id, { isActive: true });
    },
    
    deactivateWorkflow: async (id) => {
      const { updateWorkflow } = get();
      await updateWorkflow(id, { isActive: false });
    },
    
    duplicateWorkflow: async (id, name) => {
      const { workflows, createWorkflow } = get();
      const original = workflows.find(wf => wf.id === id);
      if (!original) throw new Error('Fluxo de trabalho não encontrado');
      
      const { id: _, createdAt, updatedAt, version, ...workflowData } = original;
      return await createWorkflow({ ...workflowData, name });
    },
    
    // Comment Management
    addComment: async (requestId, content, type) => {
      set({ isLoading: true, error: null });
      try {
        const newComment: ReviewComment = {
          id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          authorId: 'current-user',
          authorName: 'Current User',
          content,
          type,
          isResolved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          replies: [],
          mentions: [],
          attachments: []
        };
        
        set(state => ({
          comments: [...state.comments, newComment],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        return newComment.id;
      } catch (error) {
        set({ error: 'Falha ao adicionar comentário', isLoading: false });
        throw error;
      }
    },
    
    updateComment: async (id, content) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          comments: state.comments.map(comment => 
            comment.id === id ? { ...comment, content, updatedAt: new Date() } : comment
          ),
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao atualizar comentário', isLoading: false });
        throw error;
      }
    },
    
    deleteComment: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          comments: state.comments.filter(comment => comment.id !== id),
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao excluir comentário', isLoading: false });
        throw error;
      }
    },
    
    resolveComment: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          comments: state.comments.map(comment => 
            comment.id === id ? { ...comment, isResolved: true, updatedAt: new Date() } : comment
          ),
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao resolver comentário', isLoading: false });
        throw error;
      }
    },
    
    replyToComment: async (parentId, content) => {
      const { addComment, comments } = get();
      const parentComment = comments.find(c => c.id === parentId);
      if (!parentComment) throw new Error('Comentário pai não encontrado');
      
      return await addComment(parentComment.requestId, content, 'general');
    },
    
    // Template Management
    createTemplate: async (templateData) => {
      set({ isLoading: true, error: null });
      try {
        const newTemplate: ApprovalTemplate = {
          ...templateData,
          id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          usage: 0
        };
        
        set(state => ({
          templates: [...state.templates, newTemplate],
          isLoading: false,
          lastUpdate: new Date()
        }));
        
        return newTemplate.id;
      } catch (error) {
        set({ error: 'Falha ao criar template', isLoading: false });
        throw error;
      }
    },
    
    updateTemplate: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          templates: state.templates.map(tpl => 
            tpl.id === id ? { ...tpl, ...updates, updatedAt: new Date() } : tpl
          ),
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao atualizar template', isLoading: false });
        throw error;
      }
    },
    
    deleteTemplate: async (id) => {
      set({ isLoading: true, error: null });
      try {
        set(state => ({
          templates: state.templates.filter(tpl => tpl.id !== id),
          selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
          isLoading: false,
          lastUpdate: new Date()
        }));
      } catch (error) {
        set({ error: 'Falha ao excluir template', isLoading: false });
        throw error;
      }
    },
    
    // Notification Management
    markNotificationAsRead: async (id) => {
      set(state => ({
        notifications: state.notifications.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      }));
    },
    
    markAllNotificationsAsRead: async () => {
      set(state => ({
        notifications: state.notifications.map(notif => ({ ...notif, isRead: true }))
      }));
    },
    
    deleteNotification: async (id) => {
      set(state => ({
        notifications: state.notifications.filter(notif => notif.id !== id)
      }));
    },
    
    // Search and Filter
    searchRequests: (query) => {
      const { requests } = get();
      if (!query.trim()) return requests;
      
      const lowercaseQuery = query.toLowerCase();
      return requests.filter(request => 
        request.title.toLowerCase().includes(lowercaseQuery) ||
        request.description.toLowerCase().includes(lowercaseQuery) ||
        request.requesterName.toLowerCase().includes(lowercaseQuery) ||
        request.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    },
    
    filterRequests: (filters) => {
      const { requests } = get();
      return requests.filter(request => {
        if (filters.statusFilter && request.status !== filters.statusFilter) return false;
        if (filters.typeFilter && request.type !== filters.typeFilter) return false;
        if (filters.priorityFilter && request.priority !== filters.priorityFilter) return false;
        if (filters.assigneeFilter && request.requesterId !== filters.assigneeFilter) return false;
        if (filters.dateRange?.start && request.createdAt < filters.dateRange.start) return false;
        if (filters.dateRange?.end && request.createdAt > filters.dateRange.end) return false;
        return true;
      });
    },
    
    setStatusFilter: (status) => set({ statusFilter: status }),
    setTypeFilter: (type) => set({ typeFilter: type }),
    setPriorityFilter: (priority) => set({ priorityFilter: priority }),
    setAssigneeFilter: (assignee) => set({ assigneeFilter: assignee }),
    setDateRange: (start, end) => set({ dateRange: { start, end } }),
    
    clearFilters: () => set({
      statusFilter: '',
      typeFilter: '',
      priorityFilter: '',
      assigneeFilter: '',
      dateRange: { start: null, end: null }
    }),
    
    // Selection
    selectRequest: (request) => set({ selectedRequest: request }),
    selectWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
    selectTemplate: (template) => set({ selectedTemplate: template }),
    
    // Data Management
    refreshData: async () => {
      const { loadRequests, loadWorkflows, loadTemplates } = get();
      await Promise.all([
        loadRequests(),
        loadWorkflows(),
        loadTemplates()
      ]);
    },
    
    loadRequests: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simulate API call with demo data
        const demoRequests: ApprovalRequest[] = [
          {
            id: 'req_001',
            title: 'Deploy para Produção - v2.1.0',
            description: 'Deploy da versão 2.1.0 com novas funcionalidades de IA',
            type: 'deployment',
            priority: 'high',
            status: 'pending',
            requesterId: 'user_001',
            requesterName: 'João Silva',
            workflowId: 'wf_001',
            currentStepId: 'step_001',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            estimatedImpact: 'high',
            affectedSystems: ['api', 'frontend', 'database'],
            changes: [],
            attachments: [],
            metadata: {},
            tags: ['deployment', 'production', 'ai']
          },
          {
            id: 'req_002',
            title: 'Alteração de Configuração - Rate Limiting',
            description: 'Ajustar limites de rate limiting para melhor performance',
            type: 'config_change',
            priority: 'medium',
            status: 'in_review',
            requesterId: 'user_002',
            requesterName: 'Maria Santos',
            workflowId: 'wf_002',
            currentStepId: 'step_002',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000),
            estimatedImpact: 'medium',
            affectedSystems: ['api'],
            changes: [],
            attachments: [],
            metadata: {},
            tags: ['config', 'performance']
          }
        ];
        
        set({ 
          requests: demoRequests,
          isLoading: false,
          lastUpdate: new Date()
        });
      } catch (error) {
        set({ error: 'Falha ao carregar solicitações', isLoading: false });
      }
    },
    
    loadWorkflows: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simulate API call with demo data
        const demoWorkflows: ApprovalWorkflow[] = [
          {
            id: 'wf_001',
            name: 'Deploy para Produção',
            description: 'Fluxo para aprovação de deploys em produção',
            type: 'deployment',
            isActive: true,
            steps: [],
            conditions: [],
            settings: {
              autoAssign: true,
              allowSelfApproval: false,
              requireAllApprovers: true,
              escalationEnabled: true,
              escalationTimeoutMinutes: 240,
              notificationSettings: {
                onSubmission: true,
                onApproval: true,
                onRejection: true,
                onTimeout: true,
                channels: ['email', 'slack'],
                customTemplates: {}
              },
              auditSettings: {
                logAllActions: true,
                retentionDays: 365,
                includeMetadata: true,
                exportFormat: 'json'
              }
            },
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            createdBy: 'admin',
            version: 3
          }
        ];
        
        set({ 
          workflows: demoWorkflows,
          isLoading: false,
          lastUpdate: new Date()
        });
      } catch (error) {
        set({ error: 'Falha ao carregar fluxos de trabalho', isLoading: false });
      }
    },
    
    loadTemplates: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simulate API call with demo data
        const demoTemplates: ApprovalTemplate[] = [
          {
            id: 'tpl_001',
            name: 'Template de Deploy',
            description: 'Template padrão para solicitações de deploy',
            type: 'deployment',
            fields: [],
            workflow: 'wf_001',
            isDefault: true,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            createdBy: 'admin',
            usage: 45
          }
        ];
        
        set({ 
          templates: demoTemplates,
          isLoading: false,
          lastUpdate: new Date()
        });
      } catch (error) {
        set({ error: 'Falha ao carregar templates', isLoading: false });
      }
    },
    
    // Quick Actions
    bulkApprove: async (requestIds, comment) => {
      const { approveRequest } = get();
      for (const requestId of requestIds) {
        await approveRequest(requestId, 'current-step', comment);
      }
    },
    
    bulkReject: async (requestIds, reason) => {
      const { rejectRequest } = get();
      for (const requestId of requestIds) {
        await rejectRequest(requestId, 'current-step', reason);
      }
    },
    
    exportRequests: async (format) => {
      const { requests } = get();
      // Simulate export functionality
    },
    
    importWorkflows: async (file) => {
      // Simulate import functionality
    },
    
    // Advanced Features
    analyzeBottlenecks: async () => {
      // Simulate bottleneck analysis
      return ['Aprovação de segurança', 'Revisão técnica', 'Aprovação final'];
    },
    
    optimizeWorkflows: async () => {
      // Simulate workflow optimization
    },
    
    generateReport: async (type) => {
      // Simulate report generation
      return {
        type,
        generatedAt: new Date(),
        data: {}
      };
    },
    
    // System Operations
    updateConfig: async (configUpdates) => {
      set(state => ({
        config: { ...state.config, ...configUpdates }
      }));
    },
    
    runHealthCheck: async () => {
      // Simulate health check
      return true;
    },
    
    clearCache: async () => {
      // Simulate cache clearing
    }
  })));

// Manager Class
export class ApprovalWorkflowManager {
  private store = useApprovalWorkflowStore;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    await this.store.getState().refreshData();
  }
  
  // Public API methods
  getRequests() {
    return this.store.getState().requests;
  }
  
  getWorkflows() {
    return this.store.getState().workflows;
  }
  
  async createRequest(requestData: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.store.getState().createRequest(requestData);
  }
  
  async approveRequest(requestId: string, stepId: string, comment?: string) {
    return await this.store.getState().approveRequest(requestId, stepId, comment);
  }
  
  async rejectRequest(requestId: string, stepId: string, reason: string) {
    return await this.store.getState().rejectRequest(requestId, stepId, reason);
  }
}

// Global instance
export const approvalWorkflowManager = new ApprovalWorkflowManager();

// Utility functions
export const formatApprovalTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
};

export const getStatusColor = (status: ApprovalRequest['status']): string => {
  switch (status) {
    case 'draft': return 'text-gray-600 bg-gray-100';
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    case 'in_review': return 'text-blue-600 bg-blue-100';
    case 'approved': return 'text-green-600 bg-green-100';
    case 'rejected': return 'text-red-600 bg-red-100';
    case 'cancelled': return 'text-gray-600 bg-gray-100';
    case 'expired': return 'text-orange-600 bg-orange-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getPriorityColor = (priority: ApprovalRequest['priority']): string => {
  switch (priority) {
    case 'low': return 'text-blue-600 bg-blue-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'critical': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getTypeIcon = (type: ApprovalRequest['type']): string => {
  switch (type) {
    case 'code_change': return '💻';
    case 'config_change': return '⚙️';
    case 'deployment': return '🚀';
    case 'feature_flag': return '🏁';
    case 'data_change': return '📊';
    case 'security_change': return '🔒';
    default: return '📄';
  }
};

export const calculateWorkflowHealth = (workflow: ApprovalWorkflow): number => {
  // Simple health calculation based on workflow configuration
  let score = 100;
  
  if (!workflow.isActive) score -= 50;
  if (workflow.steps.length === 0) score -= 30;
  if (!workflow.settings.escalationEnabled) score -= 10;
  if (!workflow.settings.notificationSettings.onSubmission) score -= 5;
  
  return Math.max(0, score);
};

export const generateWorkflowRecommendations = (workflow: ApprovalWorkflow): string[] => {
  const recommendations: string[] = [];
  
  if (!workflow.isActive) {
    recommendations.push('Ativar o fluxo de trabalho para uso');
  }
  
  if (workflow.steps.length === 0) {
    recommendations.push('Adicionar etapas ao fluxo de trabalho');
  }
  
  if (!workflow.settings.escalationEnabled) {
    recommendations.push('Habilitar escalação automática');
  }
  
  if (workflow.steps.some(step => !step.timeoutMinutes)) {
    recommendations.push('Definir timeouts para todas as etapas');
  }
  
  return recommendations;
};

// Export store hook
export default useApprovalWorkflowStore;