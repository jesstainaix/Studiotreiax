import React, { useState, useEffect } from 'react';
import {
  useSmartNotifications,
  useAutoNotifications,
  useNotificationPerformance,
  useNotificationStats,
  useNotificationConfig,
  useNotificationDebug
} from '../../hooks/useSmartNotifications';
import {
  SmartNotification,
  NotificationRule,
  NotificationTemplate,
  NotificationChannel,
  NotificationGroup,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '../../utils/smartNotifications';
import {
  Bell,
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  Zap,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Star,
  Archive,
  Eye,
  EyeOff,
  Play,
  Pause,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Send,
  Smartphone,
  Mail,
  Globe,
  Database,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Shield,
  Cpu,
  Update,
  Calendar
} from 'lucide-react';

interface SmartNotificationsManagerProps {
  className?: string;
}

const SmartNotificationsManager: React.FC<SmartNotificationsManagerProps> = ({ className = '' }) => {
  // Hooks
  const notifications = useSmartNotifications({ autoInitialize: true });
  const autoNotifications = useAutoNotifications();
  const performance = useNotificationPerformance();
  const stats = useNotificationStats();
  const config = useNotificationConfig();
  const debug = useNotificationDebug();
  
  // State
  const [activeTab, setActiveTab] = useState<'notifications' | 'groups' | 'rules' | 'templates' | 'channels' | 'analytics' | 'config' | 'debug'>('notifications');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'notification' | 'group' | 'rule' | 'template' | 'channel'>('notification');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'type' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Demo functions
  const createDemoNotifications = () => {
    const types: NotificationType[] = ['info', 'success', 'warning', 'error', 'system', 'user', 'security', 'performance', 'update', 'reminder'];
    const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'critical'];
    
    types.forEach((type, index) => {
      notifications.addNotification({
        type,
        priority: priorities[index % priorities.length],
        category: type,
        title: `Notificação ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        message: `Esta é uma notificação de demonstração do tipo ${type}`,
        source: 'demo',
        data: { demo: true, index }
      });
    });
  };
  
  const createDemoGroups = () => {
    const groups = [
      { name: 'Sistema', description: 'Notificações do sistema', color: '#3b82f6' },
      { name: 'Segurança', description: 'Alertas de segurança', color: '#ef4444' },
      { name: 'Performance', description: 'Métricas de performance', color: '#f59e0b' },
      { name: 'Usuários', description: 'Atividades dos usuários', color: '#10b981' }
    ];
    
    groups.forEach(group => {
      notifications.createGroup({
        name: group.name,
        description: group.description,
        color: group.color,
        collapsed: false,
        notificationIds: []
      });
    });
  };
  
  const createDemoRules = () => {
    const rules = [
      {
        name: 'Alertas Críticos',
        description: 'Processar alertas críticos imediatamente',
        conditions: { priority: 'critical' },
        actions: [{ type: 'notify', channel: 'desktop' }],
        enabled: true
      },
      {
        name: 'Agrupar Sistema',
        description: 'Agrupar notificações do sistema',
        conditions: { type: 'system' },
        actions: [{ type: 'group', groupId: 'system' }],
        enabled: true
      }
    ];
    
    rules.forEach(rule => {
      notifications.createRule({
        name: rule.name,
        description: rule.description,
        conditions: rule.conditions,
        actions: rule.actions,
        enabled: rule.enabled
      });
    });
  };
  
  const createDemoTemplates = () => {
    const templates = [
      {
        name: 'Alerta de Sistema',
        description: 'Template para alertas do sistema',
        title: 'Sistema: {{title}}',
        message: 'O sistema reportou: {{message}}',
        type: 'system' as NotificationType,
        priority: 'medium' as NotificationPriority
      },
      {
        name: 'Notificação de Usuário',
        description: 'Template para notificações de usuário',
        title: 'Usuário: {{username}}',
        message: '{{action}} realizada com sucesso',
        type: 'user' as NotificationType,
        priority: 'low' as NotificationPriority
      }
    ];
    
    templates.forEach(template => {
      notifications.createTemplate({
        name: template.name,
        description: template.description,
        title: template.title,
        message: template.message,
        type: template.type,
        priority: template.priority,
        variables: []
      });
    });
  };
  
  const createDemoChannels = () => {
    const channels = [
      {
        name: 'Desktop',
        description: 'Notificações desktop do navegador',
        type: 'desktop',
        enabled: true,
        config: { permission: 'granted' }
      },
      {
        name: 'Email',
        description: 'Notificações por email',
        type: 'email',
        enabled: false,
        config: { smtp: 'localhost' }
      },
      {
        name: 'Push',
        description: 'Notificações push mobile',
        type: 'push',
        enabled: true,
        config: { endpoint: '/api/push' }
      }
    ];
    
    channels.forEach(channel => {
      notifications.createChannel({
        name: channel.name,
        description: channel.description,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config
      });
    });
  };
  
  // Filter and sort notifications
  const filteredAndSortedNotifications = React.useMemo(() => {
    let filtered = notifications.filteredNotifications;
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [notifications.filteredNotifications, searchTerm, filterType, filterPriority, filterStatus, sortBy, sortOrder]);
  
  // Get icon for notification type
  const getTypeIcon = (type: NotificationType) => {
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
      system: Settings,
      user: Users,
      security: Shield,
      performance: Cpu,
      update: Update,
      reminder: Calendar
    };
    
    const IconComponent = icons[type] || Info;
    return <IconComponent className="w-4 h-4" />;
  };
  
  // Get color for priority
  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    
    return colors[priority] || colors.medium;
  };
  
  // Get color for status
  const getStatusColor = (status: NotificationStatus) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      sent: 'text-blue-600 bg-blue-100',
      delivered: 'text-green-600 bg-green-100',
      read: 'text-gray-600 bg-gray-100',
      failed: 'text-red-600 bg-red-100'
    };
    
    return colors[status] || colors.pending;
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sistema de Notificações Inteligentes</h2>
              <p className="text-gray-600">Gerencie notificações, regras e canais de comunicação</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status indicators */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{notifications.unreadCount} não lidas</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{notifications.criticalCount} críticas</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{notifications.totalCount} total</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setModalType('notification');
                setEditingItem(null);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Notificação</span>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-6">
          {[
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'groups', label: 'Grupos', icon: Users },
            { id: 'rules', label: 'Regras', icon: Zap },
            { id: 'templates', label: 'Templates', icon: MessageSquare },
            { id: 'channels', label: 'Canais', icon: Send },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'config', label: 'Configurações', icon: Settings },
            { id: 'debug', label: 'Debug', icon: Activity }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar notificações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Filters */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="info">Info</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                  <option value="system">Sistema</option>
                  <option value="user">Usuário</option>
                  <option value="security">Segurança</option>
                  <option value="performance">Performance</option>
                  <option value="update">Atualização</option>
                  <option value="reminder">Lembrete</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as prioridades</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="sent">Enviada</option>
                  <option value="delivered">Entregue</option>
                  <option value="read">Lida</option>
                  <option value="failed">Falhou</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Quick actions */}
                <button
                  onClick={notifications.markAllAsRead}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  Marcar todas como lidas
                </button>
                
                <button
                  onClick={notifications.archiveAll}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Arquivar lidas
                </button>
                
                <button
                  onClick={createDemoNotifications}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Criar Demo
                </button>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="space-y-3">
              {filteredAndSortedNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
                  <p className="text-gray-600">Crie uma nova notificação ou ajuste os filtros</p>
                </div>
              ) : (
                filteredAndSortedNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Type icon */}
                        <div className={`p-2 rounded-lg ${notifications.getPriorityColor(notification.priority)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium truncate ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            {/* Priority badge */}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              getPriorityColor(notification.priority)
                            }`}>
                              {notification.priority}
                            </span>
                            
                            {/* Status badge */}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              getStatusColor(notification.status)
                            }`}>
                              {notification.status}
                            </span>
                            
                            {/* Starred */}
                            {notification.starred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            
                            {/* Archived */}
                            {notification.archived && (
                              <Archive className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          
                          <p className={`text-sm mb-2 ${
                            notification.read ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{notifications.formatTime(notification.createdAt)}</span>
                            <span>Categoria: {notification.category}</span>
                            <span>Origem: {notification.source}</span>
                            {notification.userId && <span>Usuário: {notification.userId}</span>}
                          </div>
                          
                          {/* Tags */}
                          {notification.tags && notification.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {notification.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => notification.read ? notifications.markAsUnread(notification.id) : notifications.markAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title={notification.read ? 'Marcar como não lida' : 'Marcar como lida'}
                        >
                          {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => notification.starred ? notifications.unstarNotification(notification.id) : notifications.starNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-100"
                          title={notification.starred ? 'Remover estrela' : 'Adicionar estrela'}
                        >
                          <Star className={`w-4 h-4 ${notification.starred ? 'text-yellow-500 fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => notification.archived ? notifications.unarchiveNotification(notification.id) : notifications.archiveNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                          title={notification.archived ? 'Desarquivar' : 'Arquivar'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingItem(notification);
                            setModalType('notification');
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => notifications.removeNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Grupos de Notificações</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={createDemoGroups}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Criar Demo
                </button>
                <button
                  onClick={() => {
                    setModalType('group');
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Grupo</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notifications.groups.map(group => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      ></div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => group.collapsed ? notifications.expandGroup(group.id) : notifications.collapseGroup(group.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {group.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingItem(group);
                          setModalType('group');
                          setShowModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => notifications.removeGroup(group.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {group.notificationIds.length} notificações
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      group.collapsed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {group.collapsed ? 'Recolhido' : 'Expandido'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Regras de Notificação</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={createDemoRules}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Criar Demo
                </button>
                <button
                  onClick={() => {
                    setModalType('rule');
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Regra</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {notifications.rules.map(rule => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => rule.enabled ? notifications.disableRule(rule.id) : notifications.enableRule(rule.id)}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          rule.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingItem(rule);
                          setModalType('rule');
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => notifications.removeRule(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Condições:</h5>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(rule.conditions, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Ações:</h5>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(rule.actions, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Templates de Notificação</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={createDemoTemplates}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Criar Demo
                </button>
                <button
                  onClick={() => {
                    setModalType('template');
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Template</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.templates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => notifications.useTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-gray-100"
                        title="Usar template"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingItem(template);
                          setModalType('template');
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => notifications.removeTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Título:</span>
                      <p className="text-gray-600 bg-gray-50 p-2 rounded mt-1">{template.title}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Mensagem:</span>
                      <p className="text-gray-600 bg-gray-50 p-2 rounded mt-1">{template.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        getPriorityColor(template.priority)
                      }`}>
                        {template.priority}
                      </span>
                      
                      <span className="text-xs text-gray-500">
                        Tipo: {template.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Canais de Notificação</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={createDemoChannels}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Criar Demo
                </button>
                <button
                  onClick={() => {
                    setModalType('channel');
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Canal</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notifications.channels.map(channel => {
                const getChannelIcon = (type: string) => {
                  const icons = {
                    desktop: Smartphone,
                    email: Mail,
                    push: Send,
                    webhook: Globe,
                    database: Database
                  };
                  
                  const IconComponent = icons[type as keyof typeof icons] || Send;
                  return <IconComponent className="w-5 h-5" />;
                };
                
                return (
                  <div key={channel.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${
                          channel.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getChannelIcon(channel.type)}
                        </div>
                        <h4 className="font-medium text-gray-900">{channel.name}</h4>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => notifications.testChannel(channel.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                          title="Testar canal"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingItem(channel);
                            setModalType('channel');
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => notifications.removeChannel(channel.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 capitalize">
                        Tipo: {channel.type}
                      </span>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        channel.enabled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {channel.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Analytics e Estatísticas</h3>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.current.total}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex items-center mt-2">
                  {stats.trends.totalChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${
                    stats.trends.totalChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(stats.trends.totalChange)}
                  </span>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Taxa de Leitura</p>
                    <p className="text-2xl font-bold text-green-900">{stats.current.readRate.toFixed(1)}%</p>
                  </div>
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex items-center mt-2">
                  {stats.trends.readRateChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${
                    stats.trends.readRateChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(stats.trends.readRateChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Não Lidas</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.current.unread}</p>
                  </div>
                  <EyeOff className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-yellow-600 mr-1" />
                  <span className="text-sm text-yellow-600">
                    {stats.current.unread > 0 ? 'Requer atenção' : 'Tudo em dia'}
                  </span>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Críticas</p>
                    <p className="text-2xl font-bold text-red-900">{notifications.criticalCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex items-center mt-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-sm text-red-600">
                    {notifications.criticalCount > 0 ? 'Ação necessária' : 'Sem alertas'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Métricas de Performance</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Eficiência</h5>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${performance.metrics.efficiency}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{performance.metrics.efficiency.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Taxa de Entrega</h5>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${performance.metrics.deliverySuccess}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{performance.metrics.deliverySuccess.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Uso de Memória</h5>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{performance.metrics.memoryUsage.toFixed(1)} KB</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      performance.isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {performance.isHealthy ? 'Saudável' : 'Atenção'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Recommendations */}
              {performance.recommendations.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-medium text-gray-700 mb-2">Recomendações</h5>
                  <ul className="space-y-1">
                    {performance.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Engagement Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Métricas de Engajamento</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.engagement.engagementRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Taxa de Engajamento</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.engagement.clickRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Taxa de Cliques</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.engagement.responseTime.toFixed(0)}ms</p>
                  <p className="text-sm text-gray-600">Tempo de Resposta</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.engagement.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Taxa de Conversão</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configurações</h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => config.exportConfig()}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
                
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const content = e.target?.result as string;
                          config.importConfig(content);
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                </button>
                
                <button
                  onClick={config.resetConfig}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resetar</span>
                </button>
              </div>
            </div>
            
            {/* Presets */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Presets de Configuração</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(config.presets).map(([key, preset]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2 capitalize">{key}</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      {key === 'minimal' && 'Configuração básica com recursos essenciais'}
                      {key === 'balanced' && 'Configuração equilibrada para uso geral'}
                      {key === 'comprehensive' && 'Configuração completa com todos os recursos'}
                    </p>
                    
                    <button
                      onClick={() => config.applyPreset(key as any)}
                      className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      Aplicar
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Config */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Configuração Atual</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Configurações Gerais</h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sistema Ativo</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        config.config.enabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {config.config.enabled ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Máx. Notificações</span>
                      <span className="text-sm font-medium">{config.config.maxNotifications}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Limpeza Automática</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        config.config.autoCleanup ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {config.config.autoCleanup ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Retenção (dias)</span>
                      <span className="text-sm font-medium">{config.config.retentionDays}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Configurações de Performance</h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Batch Size</span>
                      <span className="text-sm font-medium">{config.config.batchSize}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Throttle (ms)</span>
                      <span className="text-sm font-medium">{config.config.throttleMs}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cache TTL (min)</span>
                      <span className="text-sm font-medium">{config.config.cacheTtl / 60000}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Debug Mode</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        config.config.debugMode ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.config.debugMode ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Debug e Diagnósticos</h3>
            
            {/* Debug Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Estado Atual</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sistema Ativo:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.isActive ? 'Sim' : 'Não'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Última Atualização:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.lastUpdate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Versão:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uptime:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.uptime}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Performance</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CPU:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.performance.cpu.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Memória:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.performance.memory.toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rede:</span>
                      <span className="text-sm font-medium">{debug.systemInfo.performance.network.toFixed(1)} KB/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Debug Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Ações de Debug</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={debug.clearLogs}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Logs</span>
                </button>
                
                <button
                  onClick={debug.exportLogs}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Logs</span>
                </button>
                
                <button
                  onClick={debug.runDiagnostics}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Diagnósticos</span>
                </button>
                
                <button
                  onClick={debug.resetSystem}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Sistema</span>
                </button>
              </div>
            </div>
            
            {/* Debug Logs */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Logs do Sistema</h4>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {debug.logs.length === 0 ? (
                  <p className="text-gray-500">Nenhum log disponível</p>
                ) : (
                  debug.logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{log.timestamp}]</span>
                      <span className={`ml-2 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        log.level === 'info' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="ml-2">{log.message}</span>
                      {log.data && (
                        <div className="ml-8 text-gray-400">
                          {JSON.stringify(log.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNotificationsManager;