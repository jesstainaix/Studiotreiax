import React, { useState, useEffect } from 'react';
import { useRealTimeNotifications, Notification, NotificationRule, NotificationTemplate, NotificationAction } from '../../hooks/useRealTimeNotifications';
import { Bell, Settings, Filter, Download, Upload, Plus, X, Check, AlertTriangle, Info, CheckCircle, XCircle, Eye, EyeOff, Volume2, VolumeX, Trash2, Edit, Play, Pause, RotateCcw, Search, Calendar, Clock, User, Tag, Zap, Mail, Webhook, Speaker, Monitor } from 'lucide-react';

interface RealTimeNotificationsManagerProps {
  className?: string;
}

const RealTimeNotificationsManager: React.FC<RealTimeNotificationsManagerProps> = ({ className = '' }) => {
  const {
    notifications,
    rules,
    templates,
    channels,
    metrics,
    config,
    isConnected,
    lastSync,
    queue,
    processing,
    actions
  } = useRealTimeNotifications();

  const [activeTab, setActiveTab] = useState('notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showRead, setShowRead] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotificationDetails, setShowNotificationDetails] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger refresh if needed
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (!showRead && notification.read) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleNotificationAction = (notification: Notification, action: NotificationAction) => {
    action.handler();
    actions.markAsRead(notification.id);
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'markRead':
        selectedNotifications.forEach(id => actions.markAsRead(id));
        break;
      case 'delete':
        selectedNotifications.forEach(id => actions.removeNotification(id));
        break;
    }
    setSelectedNotifications([]);
  };

  const handleCreateRule = (ruleData: any) => {
    actions.addRule(ruleData);
    setShowCreateRule(false);
  };

  const handleCreateTemplate = (templateData: any) => {
    actions.addTemplate(templateData);
    setShowCreateTemplate(false);
  };

  const handleExportData = () => {
    const data = actions.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        actions.importData(data);
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderNotifications = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Notificações</h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={actions.markAllAsRead}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Marcar todas como lidas"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={actions.clearAll}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            title="Limpar todas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="info">Info</option>
          <option value="success">Sucesso</option>
          <option value="warning">Aviso</option>
          <option value="error">Erro</option>
        </select>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as categorias</option>
          <option value="system">Sistema</option>
          <option value="user">Usuário</option>
          <option value="project">Projeto</option>
          <option value="collaboration">Colaboração</option>
          <option value="performance">Performance</option>
        </select>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as prioridades</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>
        
        <button
          onClick={() => setShowRead(!showRead)}
          className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
            showRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {showRead ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Lidas</span>
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedNotifications.length} notificação(ões) selecionada(s)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('markRead')}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Marcar como lidas
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
            <button
              onClick={() => setSelectedNotifications([])}
              className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 shadow-sm'
              } ${
                selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedNotifications([...selectedNotifications, notification.id]);
                    } else {
                      setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                    }
                  }}
                  className="mt-1"
                />
                
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`mt-1 text-sm ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          getPriorityColor(notification.priority)
                        }`}>
                          {notification.priority}
                        </span>
                        
                        <span className="text-xs text-gray-500 flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{notification.category}</span>
                        </span>
                        
                        <span className="text-xs text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{notification.timestamp.toLocaleString()}</span>
                        </span>
                        
                        {notification.userId && (
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{notification.userId}</span>
                          </span>
                        )}
                      </div>
                      
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex items-center space-x-2 mt-3">
                          {notification.actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleNotificationAction(notification, action)}
                              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                action.type === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                action.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                                'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setShowNotificationDetails(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!notification.read && (
                        <button
                          onClick={() => actions.markAsRead(notification.id)}
                          className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => actions.removeNotification(notification.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Regras de Notificação</h3>
        <button
          onClick={() => setShowCreateRule(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Regra</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.enabled ? 'Ativa' : 'Inativa'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    getPriorityColor(rule.priority)
                  }`}>
                    {rule.priority}
                  </span>
                </div>
                
                <p className="mt-1 text-sm text-gray-600">{rule.description}</p>
                
                <div className="mt-2 text-xs text-gray-500">
                  <span>Criada em: {rule.createdAt.toLocaleDateString()}</span>
                  {rule.updatedAt.getTime() !== rule.createdAt.getTime() && (
                    <span className="ml-4">Atualizada em: {rule.updatedAt.toLocaleDateString()}</span>
                  )}
                </div>
                
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Condições:</h5>
                  <div className="space-y-1">
                    {rule.conditions.map((condition, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {condition.field} {condition.operator} {String(condition.value)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Ações:</h5>
                  <div className="flex flex-wrap gap-2">
                    {rule.actions.map((action, index) => (
                      <span key={index} className="flex items-center space-x-1 text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                        {action.type === 'email' && <Mail className="w-3 h-3" />}
                        {action.type === 'webhook' && <Webhook className="w-3 h-3" />}
                        {action.type === 'sound' && <Speaker className="w-3 h-3" />}
                        {action.type === 'desktop' && <Monitor className="w-3 h-3" />}
                        <span>{action.type}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => actions.updateRule(rule.id, { enabled: !rule.enabled })}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.enabled ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  title={rule.enabled ? 'Desativar' : 'Ativar'}
                >
                  {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => setEditingRule(rule)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => actions.removeRule(rule.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma regra configurada</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates de Notificação</h3>
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Template</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.type === 'success' ? 'bg-green-100 text-green-800' :
                    template.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    template.type === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {template.type}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {template.category}
                  </span>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Título: {template.title}</p>
                  <p className="text-sm text-gray-600 mt-1">Mensagem: {template.message}</p>
                </div>
                
                {template.variables.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Variáveis:</h5>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  <span>Criado em: {template.createdAt.toLocaleDateString()}</span>
                  {template.updatedAt.getTime() !== template.createdAt.getTime() && (
                    <span className="ml-4">Atualizado em: {template.updatedAt.toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => actions.removeTemplate(template.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template configurado</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Métricas de Notificações</h3>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.totalNotifications}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Lidas</p>
              <p className="text-2xl font-bold text-green-900">{metrics.readCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Não Lidas</p>
              <p className="text-2xl font-bold text-yellow-900">{metrics.unreadCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Taxa de Entrega</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.deliveryRate.toFixed(1)}%</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Por Tipo</h4>
          <div className="space-y-2">
            {Object.entries(metrics.notificationsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getNotificationIcon(type)}
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Por Categoria</h4>
          <div className="space-y-2">
            {Object.entries(metrics.notificationsByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 capitalize">{category}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Por Prioridade</h4>
          <div className="space-y-2">
            {Object.entries(metrics.notificationsByPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    priority === 'critical' ? 'bg-red-500' :
                    priority === 'high' ? 'bg-orange-500' :
                    priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-sm text-gray-700 capitalize">{priority}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Tempo Médio de Leitura</span>
              <span className="text-sm font-medium text-gray-900">{metrics.averageReadTime.toFixed(1)}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Taxa de Clique</span>
              <span className="text-sm font-medium text-gray-900">{metrics.clickThroughRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Taxa de Descarte</span>
              <span className="text-sm font-medium text-gray-900">{metrics.dismissalRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Tempo de Resposta</span>
              <span className="text-sm font-medium text-gray-900">{metrics.responseTime.toFixed(1)}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Taxa de Erro</span>
              <span className="text-sm font-medium text-gray-900">{metrics.errorRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannels = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Canais de Notificação</h3>
      
      <div className="grid gap-4">
        {channels.map((channel) => (
          <div key={channel.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  channel.status === 'connected' ? 'bg-green-500' :
                  channel.status === 'error' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900">{channel.name}</h4>
                  <p className="text-sm text-gray-600">{channel.type}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  channel.status === 'connected' ? 'bg-green-100 text-green-800' :
                  channel.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {channel.status === 'connected' ? 'Conectado' :
                   channel.status === 'error' ? 'Erro' : 'Desconectado'}
                </span>
                
                <button
                  onClick={() => {
                    const updatedChannels = channels.map(c => 
                      c.id === channel.id ? { ...c, enabled: !c.enabled } : c
                    );
                    actions.updateConfig({ channels: updatedChannels });
                  }}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    channel.enabled ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {channel.enabled ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
            
            {channel.lastConnected && (
              <div className="mt-2 text-xs text-gray-500">
                Última conexão: {channel.lastConnected.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configurações</h3>
      
      <div className="grid gap-6">
        {/* General Settings */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Geral</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Notificações Ativadas</label>
                <p className="text-xs text-gray-500">Ativar/desativar todas as notificações</p>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
                className="rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Notificações
              </label>
              <input
                type="number"
                value={config.maxNotifications}
                onChange={(e) => actions.updateConfig({ maxNotifications: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="1000"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Marcar como Lida Automaticamente</label>
                <p className="text-xs text-gray-500">Marcar notificações como lidas automaticamente</p>
              </div>
              <input
                type="checkbox"
                checked={config.autoMarkAsRead}
                onChange={(e) => actions.updateConfig({ autoMarkAsRead: e.target.checked })}
                className="rounded"
              />
            </div>
            
            {config.autoMarkAsRead && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay para Marcar como Lida (ms)
                </label>
                <input
                  type="number"
                  value={config.autoMarkAsReadDelay}
                  onChange={(e) => actions.updateConfig({ autoMarkAsReadDelay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  max="60000"
                  step="1000"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Notifications */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Notificações Desktop</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Mostrar Notificações Desktop</label>
                <p className="text-xs text-gray-500">Exibir notificações do sistema operacional</p>
              </div>
              <input
                type="checkbox"
                checked={config.showDesktopNotifications}
                onChange={(e) => actions.updateConfig({ showDesktopNotifications: e.target.checked })}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Reproduzir Som</label>
                <p className="text-xs text-gray-500">Tocar som ao receber notificações</p>
              </div>
              <input
                type="checkbox"
                checked={config.playSound}
                onChange={(e) => actions.updateConfig({ playSound: e.target.checked })}
                className="rounded"
              />
            </div>
            
            {config.playSound && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume do Som ({Math.round(config.soundVolume * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.soundVolume}
                  onChange={(e) => actions.updateConfig({ soundVolume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Grouping */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Agrupamento</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Agrupar Similares</label>
                <p className="text-xs text-gray-500">Agrupar notificações similares</p>
              </div>
              <input
                type="checkbox"
                checked={config.groupSimilar}
                onChange={(e) => actions.updateConfig({ groupSimilar: e.target.checked })}
                className="rounded"
              />
            </div>
            
            {config.groupSimilar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Janela de Agrupamento (ms)
                </label>
                <input
                  type="number"
                  value={config.groupingWindow}
                  onChange={(e) => actions.updateConfig({ groupingWindow: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  max="300000"
                  step="1000"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Performance */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Performance</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamanho do Lote
              </label>
              <input
                type="number"
                value={config.batchSize}
                onChange={(e) => actions.updateConfig({ batchSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay de Throttle (ms)
              </label>
              <input
                type="number"
                value={config.throttleDelay}
                onChange={(e) => actions.updateConfig({ throttleDelay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="10"
                max="1000"
                step="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tentativas de Retry
              </label>
              <input
                type="number"
                value={config.retryAttempts}
                onChange={(e) => actions.updateConfig({ retryAttempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay de Retry (ms)
              </label>
              <input
                type="number"
                value={config.retryDelay}
                onChange={(e) => actions.updateConfig({ retryDelay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="100"
                max="10000"
                step="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notificações em Tempo Real</h2>
            {processing && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span>Processando...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => actions.requestPermission()}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Solicitar Permissão
            </button>
            
            <button
              onClick={handleExportData}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Exportar dados"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <label className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" title="Importar dados">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Total: {metrics.totalNotifications}</span>
            <span>Não lidas: {metrics.unreadCount}</span>
            <span>Na fila: {queue.length}</span>
          </div>
          
          {lastSync && (
            <span>Última sincronização: {lastSync.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'rules', label: 'Regras', icon: Zap },
            { id: 'templates', label: 'Templates', icon: Edit },
            { id: 'metrics', label: 'Métricas', icon: RotateCcw },
            { id: 'channels', label: 'Canais', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {showSettings ? renderSettings() :
         activeTab === 'notifications' ? renderNotifications() :
         activeTab === 'rules' ? renderRules() :
         activeTab === 'templates' ? renderTemplates() :
         activeTab === 'metrics' ? renderMetrics() :
         activeTab === 'channels' ? renderChannels() : null}
      </div>
      
      {/* Modals */}
      {showCreateRule && (
        <CreateRuleModal
          onClose={() => setShowCreateRule(false)}
          onSave={handleCreateRule}
        />
      )}
      
      {showCreateTemplate && (
        <CreateTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onSave={handleCreateTemplate}
        />
      )}
      
      {editingRule && (
        <EditRuleModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={(updates) => {
            actions.updateRule(editingRule.id, updates);
            setEditingRule(null);
          }}
        />
      )}
      
      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={(updates) => {
            actions.updateTemplate(editingTemplate.id, updates);
            setEditingTemplate(null);
          }}
        />
      )}
      
      {showNotificationDetails && (
        <NotificationDetailsModal
          notificationId={showNotificationDetails}
          notification={notifications.find(n => n.id === showNotificationDetails)!}
          onClose={() => setShowNotificationDetails(null)}
          onMarkAsRead={() => {
            actions.markAsRead(showNotificationDetails);
            setShowNotificationDetails(null);
          }}
          onDelete={() => {
            actions.removeNotification(showNotificationDetails);
            setShowNotificationDetails(null);
          }}
        />
      )}
    </div>
  );
};

// Modal Components
const CreateRuleModal: React.FC<{
  onClose: () => void;
  onSave: (rule: any) => void;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 'medium',
    conditions: [{ field: 'type', operator: 'equals', value: '' }],
    actions: [{ type: 'notify', config: {} }],
    throttle: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nova Regra</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Throttle (ms)</label>
              <input
                type="number"
                value={formData.throttle}
                onChange={(e) => setFormData({ ...formData, throttle: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Ativar regra</label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Regra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateTemplateModal: React.FC<{
  onClose: () => void;
  onSave: (template: any) => void;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'info',
    category: 'system',
    title: '',
    message: '',
    variables: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Novo Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="system">Sistema</option>
                <option value="user">Usuário</option>
                <option value="project">Projeto</option>
                <option value="collaboration">Colaboração</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditRuleModal: React.FC<{
  rule: NotificationRule;
  onClose: () => void;
  onSave: (updates: any) => void;
}> = ({ rule, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled,
    priority: rule.priority,
    throttle: rule.throttle
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Editar Regra</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Throttle (ms)</label>
              <input
                type="number"
                value={formData.throttle}
                onChange={(e) => setFormData({ ...formData, throttle: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Ativar regra</label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditTemplateModal: React.FC<{
  template: NotificationTemplate;
  onClose: () => void;
  onSave: (updates: any) => void;
}> = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template.name,
    type: template.type,
    category: template.category,
    title: template.title,
    message: template.message
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Editar Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="system">Sistema</option>
                <option value="user">Usuário</option>
                <option value="project">Projeto</option>
                <option value="collaboration">Colaboração</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NotificationDetailsModal: React.FC<{
  notificationId: string;
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}> = ({ notification, onClose, onMarkAsRead, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Detalhes da Notificação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <p className="text-gray-900">{notification.title}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <p className="text-gray-900">{notification.message}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <p className="text-gray-900 capitalize">{notification.type}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <p className="text-gray-900 capitalize">{notification.category}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <p className="text-gray-900 capitalize">{notification.priority}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-gray-900">{notification.read ? 'Lida' : 'Não lida'}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora</label>
            <p className="text-gray-900">{notification.timestamp.toLocaleString()}</p>
          </div>
          
          {notification.userId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <p className="text-gray-900">{notification.userId}</p>
            </div>
          )}
          
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dados Adicionais</label>
              <pre className="text-sm bg-gray-100 p-3 rounded-lg overflow-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
          
          {!notification.read && (
            <button
              onClick={onMarkAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Marcar como Lida
            </button>
          )}
          
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNotificationsManager;