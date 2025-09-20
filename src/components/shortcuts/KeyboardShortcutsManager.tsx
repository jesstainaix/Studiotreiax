import React, { useState, useEffect, useMemo } from 'react';
import { 
  useKeyboardShortcuts, 
  useAutoShortcuts, 
  useShortcutPerformance, 
  useShortcutStats, 
  useShortcutConfig, 
  useShortcutRecording, 
  useShortcutDebug 
} from '../../hooks/useKeyboardShortcuts';
import { KeyboardShortcut, ShortcutGroup, ShortcutContext } from '../../utils/keyboardShortcuts';
import { 
  Keyboard, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  BarChart3, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Eye, 
  EyeOff, 
  Copy, 
  Move, 
  Group, 
  Target, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Bug, 
  Activity, 
  Database, 
  Cpu, 
  MemoryStick, 
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';

interface KeyboardShortcutsManagerProps {
  className?: string;
}

export const KeyboardShortcutsManager: React.FC<KeyboardShortcutsManagerProps> = ({ 
  className = '' 
}) => {
  // Hooks
  const shortcuts = useKeyboardShortcuts();
  const performance = useShortcutPerformance();
  const stats = useShortcutStats();
  const config = useShortcutConfig();
  const recording = useShortcutRecording();
  const debug = useShortcutDebug();
  
  // State
  const [activeTab, setActiveTab] = useState('shortcuts');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'shortcut' | 'group' | 'context'>('shortcut');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterContext, setFilterContext] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Demo functions
  const generateDemoShortcuts = () => {
    const demoShortcuts = [
      {
        name: 'Novo Projeto',
        description: 'Criar um novo projeto',
        keys: ['Ctrl+n'],
        category: 'file',
        action: () => toast.success('Novo projeto criado!'),
        enabled: true,
        global: true,
        preventDefault: true,
        stopPropagation: true,
        priority: 1,
        customizable: true,
        tags: ['file', 'new', 'project']
      },
      {
        name: 'Abrir Arquivo',
        description: 'Abrir um arquivo existente',
        keys: ['Ctrl+o'],
        category: 'file',
        action: () => toast.success('Arquivo aberto!'),
        enabled: true,
        global: true,
        preventDefault: true,
        stopPropagation: true,
        priority: 1,
        customizable: true,
        tags: ['file', 'open']
      },
      {
        name: 'Buscar',
        description: 'Abrir busca global',
        keys: ['Ctrl+k'],
        category: 'navigation',
        action: () => toast.success('Busca aberta!'),
        enabled: true,
        global: true,
        preventDefault: true,
        stopPropagation: true,
        priority: 1,
        customizable: true,
        tags: ['search', 'find']
      },
      {
        name: 'Paleta de Comandos',
        description: 'Abrir paleta de comandos',
        keys: ['Ctrl+Shift+p'],
        category: 'tools',
        action: () => toast.success('Paleta de comandos aberta!'),
        enabled: true,
        global: true,
        preventDefault: true,
        stopPropagation: true,
        priority: 1,
        customizable: true,
        tags: ['commands', 'palette']
      },
      {
        name: 'Duplicar Linha',
        description: 'Duplicar a linha atual',
        keys: ['Ctrl+d'],
        category: 'editing',
        context: 'editor',
        action: () => toast.success('Linha duplicada!'),
        enabled: true,
        global: false,
        preventDefault: true,
        stopPropagation: true,
        priority: 1,
        customizable: true,
        tags: ['edit', 'duplicate']
      }
    ];
    
    demoShortcuts.forEach(shortcut => {
      shortcuts.addShortcut(shortcut);
    });
    
    toast.success(`${demoShortcuts.length} atalhos demo adicionados!`);
  };
  
  const generateDemoGroups = () => {
    const groups = [
      {
        name: 'Arquivos',
        description: 'Atalhos para operações de arquivo',
        shortcuts: [],
        enabled: true,
        priority: 1,
        icon: 'file',
        color: 'blue'
      },
      {
        name: 'Edição',
        description: 'Atalhos para edição de código',
        shortcuts: [],
        enabled: true,
        priority: 1,
        icon: 'edit',
        color: 'green'
      },
      {
        name: 'Navegação',
        description: 'Atalhos para navegação',
        shortcuts: [],
        enabled: true,
        priority: 1,
        icon: 'navigation',
        color: 'purple'
      }
    ];
    
    groups.forEach(group => {
      shortcuts.addGroup(group);
    });
    
    toast.success(`${groups.length} grupos demo adicionados!`);
  };
  
  const generateDemoContexts = () => {
    const contexts = [
      {
        name: 'Editor de Código',
        description: 'Contexto para editor de código',
        selector: '.code-editor, .monaco-editor',
        active: true,
        priority: 2,
        shortcuts: []
      },
      {
        name: 'Explorador de Arquivos',
        description: 'Contexto para explorador de arquivos',
        selector: '.file-explorer',
        active: true,
        priority: 1,
        shortcuts: []
      }
    ];
    
    contexts.forEach(context => {
      shortcuts.addContext(context);
    });
    
    toast.success(`${contexts.length} contextos demo adicionados!`);
  };
  
  // Filter and sort logic
  const filteredShortcuts = useMemo(() => {
    let filtered = Object.values(shortcuts.shortcuts);
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shortcut => 
        shortcut.name.toLowerCase().includes(query) ||
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query)) ||
        shortcut.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(shortcut => shortcut.category === filterCategory);
    }
    
    // Context filter
    if (filterContext !== 'all') {
      filtered = filtered.filter(shortcut => shortcut.context === filterContext);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'usage':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [shortcuts.shortcuts, searchQuery, filterCategory, filterContext, sortBy, sortOrder]);
  
  const categories = useMemo(() => {
    const cats = new Set(Object.values(shortcuts.shortcuts).map(s => s.category));
    return Array.from(cats);
  }, [shortcuts.shortcuts]);
  
  const contexts = useMemo(() => {
    const ctxs = new Set(Object.values(shortcuts.shortcuts).map(s => s.context).filter(Boolean));
    return Array.from(ctxs);
  }, [shortcuts.shortcuts]);
  
  // Modal handlers
  const openModal = (type: 'shortcut' | 'group' | 'context', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };
  
  const handleSave = (data: any) => {
    try {
      if (modalType === 'shortcut') {
        if (editingItem) {
          shortcuts.updateShortcut(editingItem.id, data);
          toast.success('Atalho atualizado!');
        } else {
          shortcuts.addShortcut(data);
          toast.success('Atalho criado!');
        }
      } else if (modalType === 'group') {
        if (editingItem) {
          shortcuts.updateGroup(editingItem.id, data);
          toast.success('Grupo atualizado!');
        } else {
          shortcuts.addGroup(data);
          toast.success('Grupo criado!');
        }
      } else if (modalType === 'context') {
        if (editingItem) {
          shortcuts.updateContext(editingItem.id, data);
          toast.success('Contexto atualizado!');
        } else {
          shortcuts.addContext(data);
          toast.success('Contexto criado!');
        }
      }
      
      closeModal();
    } catch (error) {
      toast.error('Erro ao salvar!');
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Keyboard className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Atalhos de Teclado
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie atalhos, grupos e contextos
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={generateDemoShortcuts}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Demo Atalhos
            </button>
            <button
              onClick={generateDemoGroups}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Demo Grupos
            </button>
            <button
              onClick={generateDemoContexts}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Demo Contextos
            </button>
          </div>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.stats.totalShortcuts}
                </p>
              </div>
              <Keyboard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Ativos</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.stats.activeShortcuts}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Uso Total</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.stats.totalUsage}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${
            performance.performance.isHealthy 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  performance.performance.isHealthy 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  Status
                </p>
                <p className={`text-2xl font-bold ${
                  performance.performance.isHealthy 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {performance.performance.isHealthy ? 'OK' : 'Erro'}
                </p>
              </div>
              {performance.performance.isHealthy ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'shortcuts', label: 'Atalhos', icon: Keyboard },
            { id: 'groups', label: 'Grupos', icon: Group },
            { id: 'contexts', label: 'Contextos', icon: Target },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'config', label: 'Configurações', icon: Settings },
            { id: 'debug', label: 'Debug', icon: Bug }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Shortcuts Tab */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar atalhos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={filterContext}
                  onChange={(e) => setFilterContext(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">Todos os contextos</option>
                  {contexts.map(ctx => (
                    <option key={ctx} value={ctx}>{ctx}</option>
                  ))}
                </select>
                
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="name-asc">Nome A-Z</option>
                  <option value="name-desc">Nome Z-A</option>
                  <option value="usage-desc">Mais usado</option>
                  <option value="usage-asc">Menos usado</option>
                  <option value="created-desc">Mais recente</option>
                  <option value="created-asc">Mais antigo</option>
                </select>
                
                <button
                  onClick={() => openModal('shortcut')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo</span>
                </button>
              </div>
            </div>
            
            {/* Shortcuts List */}
            <div className="space-y-2">
              {filteredShortcuts.length === 0 ? (
                <div className="text-center py-12">
                  <Keyboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery || filterCategory !== 'all' || filterContext !== 'all' 
                      ? 'Nenhum atalho encontrado com os filtros aplicados'
                      : 'Nenhum atalho configurado'
                    }
                  </p>
                </div>
              ) : (
                filteredShortcuts.map(shortcut => (
                  <div
                    key={shortcut.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      shortcut.enabled
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {shortcut.keys.map((key, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-mono"
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {shortcut.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {shortcut.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shortcut.category === 'navigation' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                            shortcut.category === 'editing' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            shortcut.category === 'file' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                            shortcut.category === 'view' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {shortcut.category}
                          </span>
                          
                          {shortcut.context && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full text-xs font-medium">
                              {shortcut.context}
                            </span>
                          )}
                          
                          {shortcut.global && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-xs font-medium">
                              Global
                            </span>
                          )}
                          
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Usado {shortcut.usageCount} vezes
                          </span>
                          
                          {shortcut.lastUsed && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Último uso: {shortcut.lastUsed.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => shortcuts.executeShortcut(shortcut.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Executar"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => shortcuts.toggleShortcut(shortcut.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            shortcut.enabled
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={shortcut.enabled ? 'Desabilitar' : 'Habilitar'}
                        >
                          {shortcut.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => {
                            const newId = shortcuts.duplicateShortcut(shortcut.id);
                            if (newId) toast.success('Atalho duplicado!');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openModal('shortcut', shortcut)}
                          className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            shortcuts.removeShortcut(shortcut.id);
                            toast.success('Atalho removido!');
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover"
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Grupos de Atalhos
              </h3>
              <button
                onClick={() => openModal('group')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Grupo</span>
              </button>
            </div>
            
            <div className="grid gap-4">
              {Object.values(shortcuts.groups).length === 0 ? (
                <div className="text-center py-12">
                  <Group className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum grupo configurado
                  </p>
                </div>
              ) : (
                Object.values(shortcuts.groups).map(group => (
                  <div
                    key={group.id}
                    className={`p-4 border rounded-lg ${
                      group.enabled
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            group.color === 'blue' ? 'bg-blue-500' :
                            group.color === 'green' ? 'bg-green-500' :
                            group.color === 'purple' ? 'bg-purple-500' :
                            group.color === 'orange' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`} />
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {group.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {group.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {group.shortcuts.length} atalhos
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (group.enabled) {
                              shortcuts.disableGroup(group.id);
                            } else {
                              shortcuts.enableGroup(group.id);
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            group.enabled
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={group.enabled ? 'Desabilitar' : 'Habilitar'}
                        >
                          {group.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => openModal('group', group)}
                          className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            shortcuts.removeGroup(group.id);
                            toast.success('Grupo removido!');
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover"
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
        
        {/* Contexts Tab */}
        {activeTab === 'contexts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Contextos
              </h3>
              <button
                onClick={() => openModal('context')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Contexto</span>
              </button>
            </div>
            
            <div className="grid gap-4">
              {Object.values(shortcuts.contexts).length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum contexto configurado
                  </p>
                </div>
              ) : (
                Object.values(shortcuts.contexts).map(context => (
                  <div
                    key={context.id}
                    className={`p-4 border rounded-lg ${
                      context.active
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                    } ${
                      shortcuts.activeContext === context.id
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Target className={`w-5 h-5 ${
                            shortcuts.activeContext === context.id
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`} />
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {context.name}
                              {shortcuts.activeContext === context.id && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
                                  Ativo
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {context.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          {context.selector && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Seletor: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{context.selector}</code>
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Prioridade: {context.priority} • {context.shortcuts.length} atalhos
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => shortcuts.setActiveContext(context.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Ativar contexto"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            shortcuts.updateContext(context.id, { active: !context.active });
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            context.active
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={context.active ? 'Desabilitar' : 'Habilitar'}
                        >
                          {context.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => openModal('context', context)}
                          className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            shortcuts.removeContext(context.id);
                            toast.success('Contexto removido!');
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover"
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
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Analytics e Estatísticas
            </h3>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {stats.stats.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Tempo Médio</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {stats.stats.averageResponseTime.toFixed(1)}ms
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Personalizados</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {stats.stats.customShortcuts}
                    </p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Memória</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {(performance.performance.memoryUsage / 1024).toFixed(1)}MB
                    </p>
                  </div>
                  <MemoryStick className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
            
            {/* Most Used Shortcuts */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Atalhos Mais Usados
              </h4>
              
              {stats.stats.mostUsed.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhum atalho foi usado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.stats.mostUsed.slice(0, 5).map((shortcut, index) => (
                    <div key={shortcut.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {shortcut.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {shortcut.keys.join(' + ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {shortcut.usageCount} usos
                        </p>
                        {shortcut.lastUsed && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {shortcut.lastUsed.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Category Stats */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Estatísticas por Categoria
              </h4>
              
              {Object.keys(stats.stats.categoryStats).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma categoria encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.stats.categoryStats).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {category}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} atalhos
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Métricas de Performance
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Eventos Processados</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {performance.performance.eventCount}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Erros</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {performance.performance.errorCount}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tempo de Resposta</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {performance.performance.responseTime.toFixed(2)}ms
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uso de Memória</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {(performance.performance.memoryUsage / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
              
              {performance.performance.recommendations.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Recomendações
                  </h5>
                  <ul className="space-y-1">
                    {performance.performance.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  onClick={performance.optimize}
                  disabled={performance.isOptimizing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{performance.isOptimizing ? 'Otimizando...' : 'Otimizar Performance'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configurações
              </h3>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const data = shortcuts.exportData();
                    navigator.clipboard.writeText(data);
                    toast.success('Dados copiados para a área de transferência!');
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
                
                <button
                  onClick={() => {
                    const data = prompt('Cole os dados para importar:');
                    if (data) {
                      shortcuts.importData(data);
                      toast.success('Dados importados!');
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
                      shortcuts.resetSystem();
                      toast.success('Sistema resetado!');
                    }
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
            
            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações Gerais
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">
                      Sistema Habilitado
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ativar/desativar todo o sistema de atalhos
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.config.enabled}
                    onChange={(e) => config.updateConfig({ enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">
                      Mostrar Tooltips
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Exibir dicas de atalhos ao passar o mouse
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.config.showTooltips}
                    onChange={(e) => config.updateConfig({ showTooltips: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">
                      Feedback Visual
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrar notificações quando atalhos são executados
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.config.showFeedback}
                    onChange={(e) => config.updateConfig({ showFeedback: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">
                      Som Habilitado
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reproduzir sons quando atalhos são executados
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.config.soundEnabled}
                    onChange={(e) => config.updateConfig({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white">
                      Modo Debug
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ativar logs detalhados para depuração
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.config.debugMode}
                    onChange={(e) => config.updateConfig({ debugMode: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Sequence Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações de Sequência
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Timeout de Sequência (ms)
                  </label>
                  <input
                    type="number"
                    value={config.config.sequenceTimeout}
                    onChange={(e) => config.updateConfig({ sequenceTimeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="500"
                    max="10000"
                    step="100"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tempo limite para completar uma sequência de teclas
                  </p>
                </div>
                
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Máximo de Teclas por Sequência
                  </label>
                  <input
                    type="number"
                    value={config.config.maxSequenceLength}
                    onChange={(e) => config.updateConfig({ maxSequenceLength: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="2"
                    max="10"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Número máximo de teclas em uma sequência
                  </p>
                </div>
              </div>
            </div>
            
            {/* Performance Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações de Performance
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Intervalo de Limpeza (ms)
                  </label>
                  <input
                    type="number"
                    value={config.config.cleanupInterval}
                    onChange={(e) => config.updateConfig({ cleanupInterval: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1000"
                    max="60000"
                    step="1000"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Intervalo para limpeza automática de dados antigos
                  </p>
                </div>
                
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Dias de Retenção
                  </label>
                  <input
                    type="number"
                    value={config.config.retentionDays}
                    onChange={(e) => config.updateConfig({ retentionDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="365"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Número de dias para manter dados de estatísticas
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Debug e Diagnóstico
            </h3>
            
            {/* System Info */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Informações do Sistema
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`ml-2 ${debug.systemInfo.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {debug.systemInfo.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Versão:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {debug.systemInfo.version}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Inicializado:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {debug.systemInfo.initialized ? 'Sim' : 'Não'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Listeners:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {debug.systemInfo.listenerCount}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Último Evento:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {debug.systemInfo.lastEvent || 'Nenhum'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Contexto Ativo:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {debug.systemInfo.activeContext || 'Global'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Debug Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Ações de Debug
              </h4>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={debug.clearLogs}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Logs</span>
                </button>
                
                <button
                  onClick={debug.exportLogs}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Logs</span>
                </button>
                
                <button
                  onClick={debug.runDiagnostics}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Executar Diagnóstico</span>
                </button>
                
                <button
                  onClick={debug.testShortcuts}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Testar Atalhos</span>
                </button>
              </div>
            </div>
            
            {/* Debug Logs */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Logs de Debug
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                {debug.logs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhum log disponível
                  </p>
                ) : (
                  <div className="space-y-2">
                    {debug.logs.slice(-50).map((log, index) => (
                      <div
                        key={index}
                        className={`text-sm font-mono p-2 rounded ${
                          log.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          log.level === 'warn' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          log.level === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-xs opacity-75">
                          [{log.timestamp.toLocaleTimeString()}]
                        </span>
                        <span className="ml-2">
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyboardShortcutsManager;