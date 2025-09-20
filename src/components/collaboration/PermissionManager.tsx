import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, Eye, Edit, Trash2, Crown, Key, Clock, Mail, Check, X, AlertTriangle, Settings, Search, Filter, Download, Upload, Lock, Unlock, UserCheck, UserX, Copy, ExternalLink } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { realtimeService } from '../../services/realtimeService';

type Permission = 'view' | 'comment' | 'edit' | 'admin' | 'owner';
type ResourceType = 'project' | 'timeline' | 'clip' | 'effect' | 'audio' | 'transition';
type ActionType = 'create' | 'read' | 'update' | 'delete' | 'share' | 'export' | 'import';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: Permission;
  isOnline: boolean;
  lastSeen: Date;
  joinedAt: Date;
}

interface PermissionRule {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId?: string;
  permission: Permission;
  actions: ActionType[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  conditions?: {
    timeRestriction?: {
      startTime: string;
      endTime: string;
      days: number[];
    };
    ipRestriction?: string[];
    deviceRestriction?: string[];
  };
}

interface Invitation {
  id: string;
  email: string;
  role: Permission;
  resourceType: ResourceType;
  resourceId?: string;
  invitedBy: string;
  invitedByName: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  acceptedAt?: Date;
  declinedAt?: Date;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: ResourceType;
  resourceId?: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Omit<PermissionRule, 'id' | 'userId' | 'createdBy' | 'createdAt'>[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

interface PermissionManagerProps {
  projectId: string;
  currentUserId: string;
  onPermissionChanged?: (userId: string, permission: Permission) => void;
  onUserInvited?: (invitation: Invitation) => void;
  onUserRemoved?: (userId: string) => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  projectId,
  currentUserId,
  onPermissionChanged,
  onUserInvited,
  onUserRemoved
}) => {
  const { isConnected, currentUser, collaborators } = useCollaboration();
  const [users, setUsers] = useState<User[]>([]);
  const [permissionRules, setPermissionRules] = useState<PermissionRule[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'invitations' | 'audit' | 'templates'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'comment' as Permission,
    message: '',
    expiresIn: 7, // dias
    resourceType: 'project' as ResourceType,
    resourceId: ''
  });
  
  const [permissionForm, setPermissionForm] = useState({
    userId: '',
    resourceType: 'project' as ResourceType,
    resourceId: '',
    permission: 'view' as Permission,
    actions: [] as ActionType[],
    expiresAt: '',
    conditions: {
      timeRestriction: {
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5] // Segunda a sexta
      },
      ipRestriction: {
        enabled: false,
        ips: [] as string[]
      }
    }
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Permission | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [auditFilter, setAuditFilter] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    success: 'all' as 'all' | 'success' | 'error'
  });

  // Inicializar gerenciador de permissões
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    // Configurar listeners
    realtimeService.on('permission:user-added', handleUserAdded);
    realtimeService.on('permission:user-removed', handleUserRemoved);
    realtimeService.on('permission:user-updated', handleUserUpdated);
    realtimeService.on('permission:rule-added', handleRuleAdded);
    realtimeService.on('permission:rule-updated', handleRuleUpdated);
    realtimeService.on('permission:rule-removed', handleRuleRemoved);
    realtimeService.on('permission:invitation-sent', handleInvitationSent);
    realtimeService.on('permission:invitation-updated', handleInvitationUpdated);
    realtimeService.on('permission:audit-logged', handleAuditLogged);

    // Carregar dados
    loadUsers();
    loadPermissionRules();
    loadInvitations();
    loadAuditLogs();
    loadTemplates();

    return () => {
      realtimeService.off('permission:user-added', handleUserAdded);
      realtimeService.off('permission:user-removed', handleUserRemoved);
      realtimeService.off('permission:user-updated', handleUserUpdated);
      realtimeService.off('permission:rule-added', handleRuleAdded);
      realtimeService.off('permission:rule-updated', handleRuleUpdated);
      realtimeService.off('permission:rule-removed', handleRuleRemoved);
      realtimeService.off('permission:invitation-sent', handleInvitationSent);
      realtimeService.off('permission:invitation-updated', handleInvitationUpdated);
      realtimeService.off('permission:audit-logged', handleAuditLogged);
    };
  }, [isConnected, currentUser]);

  // Carregar dados
  const loadUsers = async () => {
    try {
      // Simular carregamento de usuários
      const mockUsers: User[] = [
        {
          id: 'user-1',
          username: 'João Silva',
          email: 'joao@example.com',
          role: 'owner',
          isOnline: true,
          lastSeen: new Date(),
          joinedAt: new Date(Date.now() - 86400000 * 30)
        },
        {
          id: 'user-2',
          username: 'Maria Santos',
          email: 'maria@example.com',
          role: 'admin',
          isOnline: true,
          lastSeen: new Date(),
          joinedAt: new Date(Date.now() - 86400000 * 15)
        },
        {
          id: 'user-3',
          username: 'Pedro Costa',
          email: 'pedro@example.com',
          role: 'edit',
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000 * 2),
          joinedAt: new Date(Date.now() - 86400000 * 7)
        },
        {
          id: 'user-4',
          username: 'Ana Oliveira',
          email: 'ana@example.com',
          role: 'comment',
          isOnline: false,
          lastSeen: new Date(Date.now() - 86400000),
          joinedAt: new Date(Date.now() - 86400000 * 3)
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadPermissionRules = async () => {
    try {
      const mockRules: PermissionRule[] = [
        {
          id: 'rule-1',
          userId: 'user-3',
          resourceType: 'timeline',
          resourceId: 'timeline-1',
          permission: 'edit',
          actions: ['read', 'update'],
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 86400000 * 5),
          isActive: true
        },
        {
          id: 'rule-2',
          userId: 'user-4',
          resourceType: 'clip',
          permission: 'view',
          actions: ['read'],
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 86400000 * 2),
          expiresAt: new Date(Date.now() + 86400000 * 7),
          isActive: true,
          conditions: {
            timeRestriction: {
              startTime: '09:00',
              endTime: '17:00',
              days: [1, 2, 3, 4, 5]
            }
          }
        }
      ];
      
      setPermissionRules(mockRules);
    } catch (error) {
      console.error('Erro ao carregar regras de permissão:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const mockInvitations: Invitation[] = [
        {
          id: 'inv-1',
          email: 'carlos@example.com',
          role: 'edit',
          resourceType: 'project',
          invitedBy: 'user-1',
          invitedByName: 'João Silva',
          createdAt: new Date(Date.now() - 86400000 * 2),
          expiresAt: new Date(Date.now() + 86400000 * 5),
          status: 'pending',
          message: 'Convite para colaborar no projeto de vídeo'
        },
        {
          id: 'inv-2',
          email: 'lucia@example.com',
          role: 'comment',
          resourceType: 'project',
          invitedBy: 'user-2',
          invitedByName: 'Maria Santos',
          createdAt: new Date(Date.now() - 86400000 * 7),
          expiresAt: new Date(Date.now() - 86400000),
          status: 'expired'
        }
      ];
      
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const mockLogs: AuditLog[] = [
        {
          id: 'log-1',
          userId: 'user-2',
          userName: 'Maria Santos',
          action: 'permission:grant',
          resourceType: 'timeline',
          resourceId: 'timeline-1',
          details: { permission: 'edit', grantedTo: 'user-3' },
          timestamp: new Date(Date.now() - 3600000 * 2),
          success: true
        },
        {
          id: 'log-2',
          userId: 'user-3',
          userName: 'Pedro Costa',
          action: 'clip:edit',
          resourceType: 'clip',
          resourceId: 'clip-5',
          details: { property: 'duration', oldValue: 30, newValue: 25 },
          timestamp: new Date(Date.now() - 3600000),
          success: true
        },
        {
          id: 'log-3',
          userId: 'user-4',
          userName: 'Ana Oliveira',
          action: 'project:export',
          resourceType: 'project',
          details: { format: 'mp4', quality: '1080p' },
          timestamp: new Date(Date.now() - 1800000),
          success: false,
          errorMessage: 'Permissão insuficiente para exportar'
        }
      ];
      
      setAuditLogs(mockLogs);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const mockTemplates: PermissionTemplate[] = [
        {
          id: 'template-1',
          name: 'Editor Básico',
          description: 'Permissões básicas para edição de vídeo',
          permissions: [
            {
              resourceType: 'timeline',
              permission: 'edit',
              actions: ['read', 'update'],
              isActive: true
            },
            {
              resourceType: 'clip',
              permission: 'edit',
              actions: ['read', 'update'],
              isActive: true
            }
          ],
          isDefault: false,
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 86400000 * 10)
        },
        {
          id: 'template-2',
          name: 'Revisor',
          description: 'Permissões para revisão e comentários',
          permissions: [
            {
              resourceType: 'project',
              permission: 'comment',
              actions: ['read'],
              isActive: true
            }
          ],
          isDefault: true,
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 86400000 * 20)
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  // Handlers de eventos
  const handleUserAdded = (user: User) => {
    setUsers(prev => [...prev, user]);
    logAudit('user:added', 'project', { userId: user.id, role: user.role });
  };

  const handleUserRemoved = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    logAudit('user:removed', 'project', { userId });
  };

  const handleUserUpdated = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    logAudit('user:updated', 'project', { userId: user.id, role: user.role });
  };

  const handleRuleAdded = (rule: PermissionRule) => {
    setPermissionRules(prev => [...prev, rule]);
    logAudit('permission:granted', rule.resourceType, rule);
  };

  const handleRuleUpdated = (rule: PermissionRule) => {
    setPermissionRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    logAudit('permission:updated', rule.resourceType, rule);
  };

  const handleRuleRemoved = (ruleId: string) => {
    const rule = permissionRules.find(r => r.id === ruleId);
    setPermissionRules(prev => prev.filter(r => r.id !== ruleId));
    if (rule) {
      logAudit('permission:revoked', rule.resourceType, { ruleId, userId: rule.userId });
    }
  };

  const handleInvitationSent = (invitation: Invitation) => {
    setInvitations(prev => [...prev, invitation]);
    logAudit('invitation:sent', 'project', { email: invitation.email, role: invitation.role });
  };

  const handleInvitationUpdated = (invitation: Invitation) => {
    setInvitations(prev => prev.map(i => i.id === invitation.id ? invitation : i));
    logAudit('invitation:updated', 'project', { invitationId: invitation.id, status: invitation.status });
  };

  const handleAuditLogged = (log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  };

  // Funções de ação
  const inviteUser = async () => {
    if (!inviteForm.email || !currentUser) return;
    
    try {
      const invitation: Invitation = {
        id: `inv-${Date.now()}`,
        email: inviteForm.email,
        role: inviteForm.role,
        resourceType: inviteForm.resourceType,
        resourceId: inviteForm.resourceId || undefined,
        invitedBy: currentUser.id,
        invitedByName: currentUser.username,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + inviteForm.expiresIn * 86400000),
        status: 'pending',
        message: inviteForm.message || undefined
      };
      
      // Enviar convite
      realtimeService.send('permission:invite-user', invitation);
      onUserInvited?.(invitation);
      
      // Resetar formulário
      setInviteForm({
        email: '',
        role: 'comment',
        message: '',
        expiresIn: 7,
        resourceType: 'project',
        resourceId: ''
      });
      
      setShowInviteModal(false);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: Permission) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const updatedUser = { ...user, role: newRole };
      realtimeService.send('permission:update-user-role', { userId, role: newRole });
      onPermissionChanged?.(userId, newRole);
      
      logAudit('user:role-changed', 'project', { userId, oldRole: user.role, newRole });
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error);
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    
    try {
      realtimeService.send('permission:remove-user', { userId });
      onUserRemoved?.(userId);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
    }
  };

  const addPermissionRule = async () => {
    if (!permissionForm.userId || !currentUser) return;
    
    try {
      const rule: PermissionRule = {
        id: `rule-${Date.now()}`,
        userId: permissionForm.userId,
        resourceType: permissionForm.resourceType,
        resourceId: permissionForm.resourceId || undefined,
        permission: permissionForm.permission,
        actions: permissionForm.actions,
        createdBy: currentUser.id,
        createdAt: new Date(),
        expiresAt: permissionForm.expiresAt ? new Date(permissionForm.expiresAt) : undefined,
        isActive: true,
        conditions: {
          timeRestriction: permissionForm.conditions.timeRestriction.enabled ? {
            startTime: permissionForm.conditions.timeRestriction.startTime,
            endTime: permissionForm.conditions.timeRestriction.endTime,
            days: permissionForm.conditions.timeRestriction.days
          } : undefined,
          ipRestriction: permissionForm.conditions.ipRestriction.enabled ? permissionForm.conditions.ipRestriction.ips : undefined
        }
      };
      
      realtimeService.send('permission:add-rule', rule);
      setShowPermissionModal(false);
    } catch (error) {
      console.error('Erro ao adicionar regra de permissão:', error);
    }
  };

  const removePermissionRule = async (ruleId: string) => {
    if (!confirm('Tem certeza que deseja remover esta regra?')) return;
    
    try {
      realtimeService.send('permission:remove-rule', { ruleId });
    } catch (error) {
      console.error('Erro ao remover regra:', error);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      realtimeService.send('permission:resend-invitation', { invitationId });
      logAudit('invitation:resent', 'project', { invitationId });
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;
    
    try {
      realtimeService.send('permission:cancel-invitation', { invitationId });
      logAudit('invitation:cancelled', 'project', { invitationId });
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
    }
  };

  const applyTemplate = async (templateId: string, userId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !currentUser) return;
    
    try {
      const rules: PermissionRule[] = template.permissions.map(perm => ({
        id: `rule-${Date.now()}-${Math.random()}`,
        userId,
        ...perm,
        createdBy: currentUser.id,
        createdAt: new Date()
      }));
      
      realtimeService.send('permission:apply-template', { templateId, userId, rules });
      logAudit('template:applied', 'project', { templateId, userId, templateName: template.name });
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
    }
  };

  const logAudit = (action: string, resourceType: ResourceType, details: any) => {
    if (!currentUser) return;
    
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.username,
      action,
      resourceType,
      details,
      timestamp: new Date(),
      success: true
    };
    
    realtimeService.send('permission:log-audit', log);
  };

  const exportAuditLogs = () => {
    const filteredLogs = auditLogs.filter(log => {
      if (auditFilter.action && !log.action.includes(auditFilter.action)) return false;
      if (auditFilter.userId && log.userId !== auditFilter.userId) return false;
      if (auditFilter.dateFrom && log.timestamp < new Date(auditFilter.dateFrom)) return false;
      if (auditFilter.dateTo && log.timestamp > new Date(auditFilter.dateTo)) return false;
      if (auditFilter.success !== 'all' && log.success !== (auditFilter.success === 'success')) return false;
      return true;
    });
    
    const csv = [
      'Timestamp,User,Action,Resource,Success,Details',
      ...filteredLogs.map(log => 
        `${log.timestamp.toISOString()},${log.userName},${log.action},${log.resourceType},${log.success},"${JSON.stringify(log.details)}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtros
  const filteredUsers = users.filter(user => {
    if (searchTerm && !user.username.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus === 'online' && !user.isOnline) return false;
    if (filterStatus === 'offline' && user.isOnline) return false;
    return true;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter.action && !log.action.includes(auditFilter.action)) return false;
    if (auditFilter.userId && log.userId !== auditFilter.userId) return false;
    if (auditFilter.dateFrom && log.timestamp < new Date(auditFilter.dateFrom)) return false;
    if (auditFilter.dateTo && log.timestamp > new Date(auditFilter.dateTo)) return false;
    if (auditFilter.success !== 'all' && log.success !== (auditFilter.success === 'success')) return false;
    return true;
  });

  // Utilitários
  const getRoleIcon = (role: Permission) => {
    switch (role) {
      case 'owner': return <Crown className="text-yellow-500" size={16} />;
      case 'admin': return <Shield className="text-red-500" size={16} />;
      case 'edit': return <Edit className="text-blue-500" size={16} />;
      case 'comment': return <Eye className="text-green-500" size={16} />;
      case 'view': return <Eye className="text-gray-500" size={16} />;
      default: return <Eye className="text-gray-500" size={16} />;
    }
  };

  const getRoleColor = (role: Permission) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'edit': return 'bg-blue-100 text-blue-800';
      case 'comment': return 'bg-green-100 text-green-800';
      case 'view': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
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

  if (!isConnected) {
    return null;
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Gerenciador de Permissões</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <UserPlus size={16} />
              Convidar Usuário
            </button>
            
            <button
              onClick={() => setShowPermissionModal(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Key size={16} />
              Nova Permissão
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'permissions', label: 'Permissões', icon: Key },
            { id: 'invitations', label: 'Convites', icon: Mail },
            { id: 'audit', label: 'Auditoria', icon: Clock },
            { id: 'templates', label: 'Templates', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Tab: Usuários */}
        {activeTab === 'users' && (
          <div className="h-full flex flex-col">
            {/* Filtros */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as funções</option>
                  <option value="owner">Proprietário</option>
                  <option value="admin">Administrador</option>
                  <option value="edit">Editor</option>
                  <option value="comment">Comentarista</option>
                  <option value="view">Visualizador</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
            
            {/* Lista de usuários */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.username}</span>
                            {getRoleIcon(user.role)}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            {user.isOnline ? 'Online' : `Visto ${formatTimeAgo(user.lastSeen)}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        
                        {user.id !== currentUserId && (
                          <div className="flex gap-1">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value as Permission)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="view">Visualizador</option>
                              <option value="comment">Comentarista</option>
                              <option value="edit">Editor</option>
                              <option value="admin">Administrador</option>
                              {currentUser?.role === 'owner' && <option value="owner">Proprietário</option>}
                            </select>
                            
                            <button
                              onClick={() => removeUser(user.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remover usuário"
                            >
                              <UserX size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Tab: Permissões */}
        {activeTab === 'permissions' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {permissionRules.map(rule => {
                const user = users.find(u => u.id === rule.userId);
                return (
                  <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user?.username || 'Usuário desconhecido'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(rule.permission)}`}>
                            {rule.permission}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {rule.resourceType}{rule.resourceId && ` (${rule.resourceId})`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Ações: {rule.actions.join(', ')}
                        </div>
                        {rule.expiresAt && (
                          <div className="text-xs text-orange-600 mt-1">
                            Expira em: {rule.expiresAt.toLocaleDateString()}
                          </div>
                        )}
                        {rule.conditions?.timeRestriction && (
                          <div className="text-xs text-blue-600 mt-1">
                            Horário: {rule.conditions.timeRestriction.startTime} - {rule.conditions.timeRestriction.endTime}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          rule.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        
                        <button
                          onClick={() => removePermissionRule(rule.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remover regra"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Tab: Convites */}
        {activeTab === 'invitations' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {invitations.map(invitation => (
                <div key={invitation.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{invitation.email}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          invitation.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Função: {invitation.role} | Convidado por: {invitation.invitedByName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Criado: {invitation.createdAt.toLocaleDateString()} | 
                        Expira: {invitation.expiresAt.toLocaleDateString()}
                      </div>
                      {invitation.message && (
                        <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {invitation.message}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {invitation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => resendInvitation(invitation.id)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Reenviar convite"
                          >
                            <Mail size={16} />
                          </button>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.id}`);
                            }}
                            className="p-2 text-green-500 hover:bg-green-50 rounded transition-colors"
                            title="Copiar link"
                          >
                            <Copy size={16} />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => cancelInvitation(invitation.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Cancelar convite"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tab: Auditoria */}
        {activeTab === 'audit' && (
          <div className="h-full flex flex-col">
            {/* Filtros de auditoria */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Filtrar por ação..."
                  value={auditFilter.action}
                  onChange={(e) => setAuditFilter(prev => ({ ...prev, action: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <select
                  value={auditFilter.userId}
                  onChange={(e) => setAuditFilter(prev => ({ ...prev, userId: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os usuários</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
                
                <input
                  type="date"
                  value={auditFilter.dateFrom}
                  onChange={(e) => setAuditFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="date"
                  value={auditFilter.dateTo}
                  onChange={(e) => setAuditFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <div className="flex gap-2">
                  <select
                    value={auditFilter.success}
                    onChange={(e) => setAuditFilter(prev => ({ ...prev, success: e.target.value as any }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="success">Sucesso</option>
                    <option value="error">Erro</option>
                  </select>
                  
                  <button
                    onClick={exportAuditLogs}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    title="Exportar logs"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Lista de logs */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredAuditLogs.map(log => (
                  <div key={log.id} className={`border rounded-lg p-3 ${
                    log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          log.success ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-sm">{log.action}</span>
                        <span className="text-xs text-gray-500">por {log.userName}</span>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {log.timestamp.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      Recurso: {log.resourceType}{log.resourceId && ` (${log.resourceId})`}
                    </div>
                    
                    {log.errorMessage && (
                      <div className="text-sm text-red-600 mt-1">
                        Erro: {log.errorMessage}
                      </div>
                    )}
                    
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Detalhes
                      </summary>
                      <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Tab: Templates */}
        {activeTab === 'templates' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {templates.map(template => (
                <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.permissions.length} permissões | 
                        Criado em {template.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyTemplate(template.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Aplicar a usuário...</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600 font-medium mb-2">Permissões incluídas:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.permissions.map((perm, index) => (
                        <span key={index} className={`px-2 py-1 rounded text-xs ${getRoleColor(perm.permission)}`}>
                          {perm.resourceType}: {perm.permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal: Convidar Usuário */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Convidar Usuário</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as Permission }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="view">Visualizador</option>
                  <option value="comment">Comentarista</option>
                  <option value="edit">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expira em (dias)
                </label>
                <input
                  type="number"
                  value={inviteForm.expiresIn}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, expiresIn: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Mensagem personalizada para o convite..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={inviteUser}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Enviar Convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;