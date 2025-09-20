// Centro de notificações inteligentes
import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Settings,
  Filter,
  Search,
  X,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Star,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  Trophy,
  Calendar,
  Cog,
  Download,
  Upload,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Mail,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Layers,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Copy,
  ExternalLink,
  RefreshCw,
  Pause,
  Play
} from 'lucide-react';
import {
  useSmartNotifications,
  useErrorNotifications,
  useProgressNotifications,
  useSystemNotifications,
  useNotificationStats,
  useNotificationTemplates,
  useNotificationRules
} from '../../hooks/useSmartNotifications';
import {
  NotificationData,
  NotificationGroup,
  NotificationRule,
  NotificationTemplate,
  NotificationCondition,
  NotificationRuleAction
} from '../../utils/smartNotifications';

// Componente principal
export const SmartNotificationCenter: React.FC = () => {
  const {
    filteredNotifications,
    groups,
    settings,
    stats,
    unreadCount,
    urgentCount,
    isSupported,
    permission,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    remove,
    click,
    createGroup,
    toggleGroup,
    ungroupNotifications,
    updateSettings,
    requestPermission,
    clearOld,
    exportData,
    importData,
    formatTime,
    getIcon,
    getPriorityColor,
    getTypeColor
  } = useSmartNotifications({
    autoMarkAsRead: true,
    autoMarkDelay: 3000,
    enableKeyboardShortcuts: true,
    maxVisible: 100
  });
  
  const { notifyError, notifyNetworkError, notifyValidationError } = useErrorNotifications();
  const { startProgress, updateProgress, completeProgress, failProgress } = useProgressNotifications();
  const { notifySystemEvent, notifyPerformanceIssue, notifyStorageLimit, notifyUpdate } = useSystemNotifications();
  const { stats: detailedStats, loading: statsLoading, refresh: refreshStats } = useNotificationStats();
  const { templates, addTemplate, updateTemplate, removeTemplate, createFromTemplate } = useNotificationTemplates();
  const { rules, addRule, updateRule, removeRule, testRule } = useNotificationRules();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'notifications' | 'groups' | 'settings' | 'rules' | 'templates' | 'stats'>('notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NotificationData['type'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationData['priority'] | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  
  // Notificações filtradas
  const displayNotifications = useMemo(() => {
    let filtered = filteredNotifications;
    
    // Filtro de busca
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }
    
    // Filtro por prioridade
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }
    
    // Filtro por categoria
    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory);
    }
    
    return filtered;
  }, [filteredNotifications, searchQuery, filterType, filterPriority, filterCategory]);
  
  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(filteredNotifications.map(n => n.category));
    return Array.from(cats);
  }, [filteredNotifications]);
  
  // Solicitar permissão na inicialização
  useEffect(() => {
    if (isSupported && permission === 'default') {
      requestPermission();
    }
  }, [isSupported, permission, requestPermission]);
  
  // Funções de demonstração
  const runDemo = () => {
    setShowDemo(true);
    
    // Demonstrar diferentes tipos de notificação
    setTimeout(() => {
      notifySystemEvent('demo_started', 'Demonstração iniciada');
    }, 500);
    
    setTimeout(() => {
      const progressId = startProgress('demo_progress', 'Processando', 'Carregando dados...');
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        updateProgress('demo_progress', progress, `Progresso: ${progress}%`);
        
        if (progress >= 100) {
          clearInterval(interval);
          completeProgress('demo_progress', 'Dados carregados com sucesso!');
        }
      }, 1000);
    }, 1000);
    
    setTimeout(() => {
      notifyError('Erro de demonstração', 'Este é um erro de exemplo');
    }, 2000);
    
    setTimeout(() => {
      notifyPerformanceIssue('CPU Usage', 85, 80);
    }, 3000);
    
    setTimeout(() => {
      notifyUpdate('2.1.0', ['Nova interface', 'Melhor performance', 'Correções de bugs']);
    }, 4000);
    
    setTimeout(() => {
      setShowDemo(false);
    }, 10000);
  };
  
  // Função para selecionar/deselecionar notificações
  const toggleSelection = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };
  
  // Função para selecionar todas
  const selectAll = () => {
    setSelectedNotifications(displayNotifications.map(n => n.id));
  };
  
  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedNotifications([]);
  };
  
  // Ações em lote
  const batchMarkAsRead = () => {
    selectedNotifications.forEach(id => markAsRead(id));
    clearSelection();
  };
  
  const batchDismiss = () => {
    selectedNotifications.forEach(id => dismiss(id));
    clearSelection();
  };
  
  const batchRemove = () => {
    selectedNotifications.forEach(id => remove(id));
    clearSelection();
  };
  
  // Componente de notificação individual
  const NotificationItem: React.FC<{ notification: NotificationData }> = ({ notification }) => {
    const isSelected = selectedNotifications.includes(notification.id);
    const isUnread = !notification.readAt;
    const isDismissed = !!notification.dismissedAt;
    
    return (
      <div
        className={`p-4 border rounded-lg transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        } ${isUnread ? 'bg-blue-50/30' : ''} ${isDismissed ? 'opacity-50' : ''}`}
        onClick={() => toggleSelection(notification.id)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: getTypeColor(notification.type) }}
            >
              {getIcon(notification.type)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-gray-900 truncate">{notification.title}</h4>
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: getPriorityColor(notification.priority) }}
                >
                  {notification.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{notification.category}</span>
                {notification.tags.map(tag => (
                  <span key={tag} className="px-1 py-0.5 text-xs bg-gray-100 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-1">
                {!isUnread && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {isDismissed && (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                {notification.priority === 'urgent' && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map(action => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      click(notification.id, action.id);
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      action.primary 
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${action.destructive ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            {notification.data?.progress !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progresso</span>
                  <span>{notification.data.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${notification.data.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Componente de grupo
  const GroupItem: React.FC<{ group: NotificationGroup }> = ({ group }) => {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div 
          className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => toggleGroup(group.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {group.collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
              <h3 className="font-medium text-gray-900">{group.title}</h3>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {group.notifications.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span 
                className="px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: getPriorityColor(group.priority) }}
              >
                {group.priority}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  ungroupNotifications(group.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {!group.collapsed && (
          <div className="divide-y">
            {group.notifications.map(notification => (
              <div key={notification.id} className="p-4">
                <NotificationItem notification={notification} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Notificações</h1>
            <p className="text-gray-600">
              {unreadCount} não lidas • {urgentCount} urgentes • {filteredNotifications.length} total
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isSupported && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Não suportado
            </div>
          )}
          
          {permission === 'denied' && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Permissão negada
            </div>
          )}
          
          <button
            onClick={runDemo}
            disabled={showDemo}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            {showDemo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {showDemo ? 'Demo Ativa' : 'Demo'}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-700">Taxa de Clique</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.clickRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">Tempo Médio</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">
            {(stats.avgResponseTime / 1000).toFixed(1)}s
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">Taxa de Dispensa</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.dismissRate.toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'groups', label: 'Grupos', icon: Layers },
            { id: 'settings', label: 'Configurações', icon: Settings },
            { id: 'rules', label: 'Regras', icon: Target },
            { id: 'templates', label: 'Templates', icon: Copy },
            { id: 'stats', label: 'Estatísticas', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Conteúdo das tabs */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Controles */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar notificações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
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
                <option value="progress">Progresso</option>
                <option value="achievement">Conquista</option>
                <option value="reminder">Lembrete</option>
                <option value="system">Sistema</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as prioridades</option>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Ações em lote */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedNotifications.length} selecionada(s)
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={batchMarkAsRead}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Marcar como Lida
                </button>
                
                <button
                  onClick={batchDismiss}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
                >
                  <Archive className="w-4 h-4" />
                  Dispensar
                </button>
                
                <button
                  onClick={batchRemove}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
                
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}
          
          {/* Ações globais */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Selecionar Todas
              </button>
              
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Marcar Todas como Lidas
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => clearOld()}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Antigas
              </button>
              
              <button
                onClick={dismissAll}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                <Archive className="w-4 h-4" />
                Dispensar Todas
              </button>
            </div>
          </div>
          
          {/* Lista de notificações */}
          <div className="space-y-3">
            {displayNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
                <p className="text-gray-500">Não há notificações para exibir no momento.</p>
              </div>
            ) : (
              displayNotifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Grupos de Notificações</h2>
            
            <button
              onClick={() => {
                if (selectedNotifications.length >= 2) {
                  const notifications = filteredNotifications.filter(n => 
                    selectedNotifications.includes(n.id)
                  );
                  createGroup(notifications);
                  clearSelection();
                }
              }}
              disabled={selectedNotifications.length < 2}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Grupo
            </button>
          </div>
          
          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum grupo</h3>
                <p className="text-gray-500">Selecione 2 ou mais notificações para criar um grupo.</p>
              </div>
            ) : (
              groups.map(group => (
                <GroupItem key={group.id} group={group} />
              ))
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Configurações</h2>
          
          {/* Configurações gerais */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Geral</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Notificações Habilitadas</label>
                  <p className="text-sm text-gray-500">Ativar/desativar todas as notificações</p>
                </div>
                <button
                  onClick={() => updateSettings({ enabled: !settings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Som</label>
                  <p className="text-sm text-gray-500">Reproduzir som nas notificações</p>
                </div>
                <button
                  onClick={() => updateSettings({ sound: !settings.sound })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.sound ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sound ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Vibração</label>
                  <p className="text-sm text-gray-500">Vibrar em dispositivos móveis</p>
                </div>
                <button
                  onClick={() => updateSettings({ vibration: !settings.vibration })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.vibration ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.vibration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Agrupar Similares</label>
                  <p className="text-sm text-gray-500">Agrupar notificações similares automaticamente</p>
                </div>
                <button
                  onClick={() => updateSettings({ groupSimilar: !settings.groupSimilar })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.groupSimilar ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.groupSimilar ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Notificações: {settings.maxNotifications}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={settings.maxNotifications}
                  onChange={(e) => updateSettings({ maxNotifications: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Horário silencioso */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Horário Silencioso</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Não Perturbe</label>
                  <p className="text-sm text-gray-500">Silenciar notificações durante horário específico</p>
                </div>
                <button
                  onClick={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.doNotDisturb ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.doNotDisturb ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {settings.doNotDisturb && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => updateSettings({
                        quietHours: { ...settings.quietHours, start: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => updateSettings({
                        quietHours: { ...settings.quietHours, end: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Ações */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Dados</h3>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const data = exportData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'notifications-backup.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              
              <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Importar
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const data = event.target?.result as string;
                        if (importData(data)) {
                          alert('Dados importados com sucesso!');
                        } else {
                          alert('Erro ao importar dados.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas</h2>
            <button
              onClick={refreshStats}
              disabled={statsLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
          
          {detailedStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Estatísticas por tipo */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Por Tipo</h3>
                <div className="space-y-2">
                  {Object.entries(detailedStats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Estatísticas por categoria */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Por Categoria</h3>
                <div className="space-y-2">
                  {Object.entries(detailedStats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Estatísticas por prioridade */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Por Prioridade</h3>
                <div className="space-y-2">
                  {Object.entries(detailedStats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{priority}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top categorias */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Top Categorias</h3>
                <div className="space-y-2">
                  {detailedStats.topCategories.map(({ category, count }) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Métricas de engajamento */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Engajamento</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Taxa de Clique</span>
                      <span className="text-sm font-medium">{detailedStats.clickRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${detailedStats.clickRate}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Taxa de Dispensa</span>
                      <span className="text-sm font-medium">{detailedStats.dismissRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${detailedStats.dismissRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tempo de resposta */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tempo Médio de Resposta</span>
                    <span className="text-sm font-medium">
                      {(detailedStats.avgResponseTime / 1000).toFixed(1)}s
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Notificações</span>
                    <span className="text-sm font-medium">{detailedStats.total}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Não Lidas</span>
                    <span className="text-sm font-medium">{detailedStats.unread}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartNotificationCenter;