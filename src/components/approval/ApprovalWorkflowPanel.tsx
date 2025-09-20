import React, { useState, useEffect } from 'react';
import {
  useApprovalWorkflow,
  useApprovalStats,
  useApprovalSearch,
  useApprovalWorkflows,
  useApprovalRequests,
  useApprovalComments,
  useApprovalTemplates,
  useApprovalNotifications,
  useApprovalRealtime
} from '../../hooks/useApprovalWorkflow';
import {
  ApprovalRequest,
  ApprovalWorkflow,
  ApprovalTemplate,
  formatApprovalTime,
  getStatusColor,
  getPriorityColor,
  getTypeIcon
} from '../../services/approvalWorkflowService';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Settings,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  MessageSquare,
  Bell,
  Activity,
  BarChart3,
  Calendar,
  User,
  Tag,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Shield,
  GitBranch,
  Target,
  TrendingUp,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const ApprovalWorkflowPanel: React.FC = () => {
  // Hooks
  const {
    isLoading,
    error,
    filteredData,
    setStatusFilter,
    setTypeFilter,
    setPriorityFilter,
    clearFilters,
    refreshData
  } = useApprovalWorkflow();
  
  const { stats, computed, approvalRate } = useApprovalStats();
  const { searchQuery, searchResults, search, clearSearch } = useApprovalSearch();
  const { workflows, activeWorkflows } = useApprovalWorkflows();
  const { 
    requests, 
    pendingRequests, 
    urgentRequests,
    approveRequest,
    rejectRequest,
    submitRequest
  } = useApprovalRequests();
  const { comments, addComment } = useApprovalComments();
  const { templates } = useApprovalTemplates();
  const { notifications, unreadCount } = useApprovalNotifications();
  const { connectionStatus, forceSync, isConnected } = useApprovalRealtime();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'request' | 'workflow' | 'template'>('request');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        forceSync();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, forceSync]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Solicitações',
      value: computed.totalRequests,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Pendentes',
      value: computed.pendingRequests,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-5%',
      trend: 'down'
    },
    {
      title: 'Aprovadas',
      value: computed.approvedRequests,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+18%',
      trend: 'up'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${approvalRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+3%',
      trend: 'up'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'requests', label: 'Solicitações', icon: FileText },
    { id: 'workflows', label: 'Fluxos', icon: GitBranch },
    { id: 'approvals', label: 'Aprovações', icon: CheckCircle },
    { id: 'comments', label: 'Comentários', icon: MessageSquare },
    { id: 'templates', label: 'Templates', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'draft': return Square;
      case 'pending': return Clock;
      case 'in_review': return Eye;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'cancelled': return XCircle;
      case 'expired': return AlertTriangle;
      default: return Square;
    }
  };
  
  const getPriorityIcon = (priority: ApprovalRequest['priority']) => {
    switch (priority) {
      case 'low': return Info;
      case 'medium': return AlertCircle;
      case 'high': return AlertTriangle;
      case 'critical': return Zap;
      default: return Info;
    }
  };
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };
  
  const handleQuickAction = async (action: string, requestId?: string) => {
    try {
      switch (action) {
        case 'approve':
          if (requestId) await approveRequest(requestId, 'current-step', 'Aprovação rápida');
          break;
        case 'reject':
          if (requestId) await rejectRequest(requestId, 'current-step', 'Rejeitado via ação rápida');
          break;
        case 'submit':
          if (requestId) await submitRequest(requestId);
          break;
        case 'refresh':
          await refreshData();
          break;
      }
    } catch (error) {
      console.error('Erro na ação rápida:', error);
    }
  };
  
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };
  
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Aprovação</h1>
            </div>
            
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="capitalize">{connectionStatus === 'connected' ? 'Conectado' : connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Quick Actions */}
            <button
              onClick={() => handleQuickAction('refresh')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </button>
            
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs. mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Search and Filters */}
      <div className="px-6 pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar solicitações, fluxos, templates..."
              value={searchQuery}
              onChange={(e) => search(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="pending">Pendente</option>
              <option value="in_review">Em Revisão</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
            
            <select
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os Tipos</option>
              <option value="code_change">Mudança de Código</option>
              <option value="config_change">Mudança de Config</option>
              <option value="deployment">Deploy</option>
              <option value="feature_flag">Feature Flag</option>
              <option value="data_change">Mudança de Dados</option>
              <option value="security_change">Mudança de Segurança</option>
            </select>
            
            <select
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitações Urgentes</h3>
                <div className="space-y-3">
                  {urgentRequests.slice(0, 5).map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    const PriorityIcon = getPriorityIcon(request.priority);
                    return (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <StatusIcon className="h-4 w-4 text-gray-500" />
                            <PriorityIcon className={`h-4 w-4 ${
                              request.priority === 'critical' ? 'text-red-500' : 'text-orange-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.title}</p>
                            <p className="text-sm text-gray-500">{request.requesterName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                          <button
                            onClick={() => handleQuickAction('approve', request.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxos Ativos</h3>
                <div className="space-y-3">
                  {activeWorkflows.slice(0, 5).map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <GitBranch className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{workflow.name}</p>
                          <p className="text-sm text-gray-500">{workflow.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Ativo
                        </span>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
              <div className="space-y-4">
                {computed.recentRequests.slice(0, 8).map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  return (
                    <div key={request.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <StatusIcon className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <p className="text-sm text-gray-500">
                          {request.requesterName} • {formatTimeAgo(request.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className="text-sm text-gray-500">{getTypeIcon(request.type)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedItems.length} item(s) selecionado(s)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                      Aprovar em Lote
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                      Rejeitar em Lote
                    </button>
                    <button 
                      onClick={() => setSelectedItems([])}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Requests List */}
            <div className="space-y-4">
              {(searchQuery ? searchResults : filteredData).map((request) => {
                const StatusIcon = getStatusIcon(request.status);
                const PriorityIcon = getPriorityIcon(request.priority);
                const isExpanded = expandedCards.has(request.id);
                const isSelected = selectedItems.includes(request.id);
                
                return (
                  <div key={request.id} className={`bg-white rounded-lg shadow-sm border transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(request.id)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                              <span className="text-lg">{getTypeIcon(request.type)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{request.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{request.requesterName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatTimeAgo(request.createdAt)}</span>
                              </div>
                              {request.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Vence em {formatTimeAgo(request.dueDate)}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Tag className="h-4 w-4" />
                                <span>{request.affectedSystems.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleQuickAction('approve', request.id)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Aprovar"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleQuickAction('reject', request.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Rejeitar"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => toggleCardExpansion(request.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          </button>
                          
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Changes */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Mudanças ({request.changes.length})</h4>
                              <div className="space-y-2">
                                {request.changes.slice(0, 3).map((change, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      change.action === 'create' ? 'bg-green-100 text-green-800' :
                                      change.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                      change.action === 'delete' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {change.action}
                                    </span>
                                    <span className="text-gray-600">{change.path}</span>
                                  </div>
                                ))}
                                {request.changes.length > 3 && (
                                  <p className="text-sm text-gray-500">+{request.changes.length - 3} mais...</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Tags */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {request.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="mt-6 flex items-center space-x-3">
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              <Eye className="h-4 w-4" />
                              <span>Ver Detalhes</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              <span>Comentar</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                              <Send className="h-4 w-4" />
                              <span>Delegar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Empty State */}
            {(searchQuery ? searchResults : filteredData).length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-gray-500 mb-6">Tente ajustar os filtros ou criar uma nova solicitação.</p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Solicitação</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Other tabs content would go here */}
        {activeTab === 'workflows' && (
          <div className="text-center py-12">
            <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fluxos de Trabalho</h3>
            <p className="text-gray-500">Gerencie e configure fluxos de aprovação.</p>
          </div>
        )}
        
        {activeTab === 'approvals' && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aprovações</h3>
            <p className="text-gray-500">Visualize e gerencie aprovações pendentes.</p>
          </div>
        )}
        
        {activeTab === 'comments' && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Comentários</h3>
            <p className="text-gray-500">Visualize e gerencie comentários de revisão.</p>
          </div>
        )}
        
        {activeTab === 'templates' && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Templates</h3>
            <p className="text-gray-500">Crie e gerencie templates de solicitação.</p>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-500">Visualize métricas e relatórios de aprovação.</p>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações</h3>
            <p className="text-gray-500">Configure preferências e integrações.</p>
          </div>
        )}
      </div>
      
      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar Novo</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setCreateType('request');
                    setShowCreateDialog(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Solicitação</p>
                    <p className="text-sm text-gray-500">Criar nova solicitação de aprovação</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setCreateType('workflow');
                    setShowCreateDialog(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <GitBranch className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Fluxo de Trabalho</p>
                    <p className="text-sm text-gray-500">Criar novo fluxo de aprovação</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setCreateType('template');
                    setShowCreateDialog(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Target className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Template</p>
                    <p className="text-sm text-gray-500">Criar template de solicitação</p>
                  </div>
                </button>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflowPanel;