import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, Cursor, MousePointer, Activity, Settings, 
  Wifi, WifiOff, AlertCircle, CheckCircle, Clock,
  Eye, EyeOff, Play, Pause, RotateCcw, Trash2,
  Search, Filter, SortAsc, SortDesc, MoreHorizontal,
  Zap, Target, Layers, Timeline, Type, Image,
  Signal, Gauge, TrendingUp, TrendingDown,
  UserPlus, UserMinus, Share2, Monitor
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  useCursorSync, 
  useCursorSyncStats, 
  useCursorSyncConfig, 
  useCursorSyncSearch,
  useCursorSyncMonitoring
} from '../../hooks/useCursorSync';
import { UserCursor, Selection, CursorEvent, CollaborationSession } from '../../services/cursorSyncService';

interface CursorSyncPanelProps {
  className?: string;
  projectId?: string;
  onUserJoin?: (user: UserCursor) => void;
  onUserLeave?: (userId: string) => void;
  onSelectionChange?: (selection: Selection) => void;
}

export const CursorSyncPanel: React.FC<CursorSyncPanelProps> = ({
  className = '',
  projectId = 'default',
  onUserJoin,
  onUserLeave,
  onSelectionChange
}) => {
  // Hooks
  const {
    cursors,
    selections,
    sessions,
    events,
    config,
    currentUser,
    isConnected,
    connectionStatus,
    error,
    isLoading,
    lastSync,
    activeCursors,
    activeSelections,
    currentSession,
    computed,
    actions,
    quickActions,
    progress,
    progressActive
  } = useCursorSync({ autoRefresh: true });
  
  const { stats, metrics } = useCursorSyncStats();
  const { updateSetting } = useCursorSyncConfig();
  const { 
    searchTerm, 
    setSearchTerm, 
    filterType, 
    setFilterType,
    filteredCursors,
    filteredSelections,
    filteredEvents
  } = useCursorSyncSearch();
  const { alerts, health } = useCursorSyncMonitoring();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCursor, setSelectedCursor] = useState<UserCursor | null>(null);
  const [selectedSelection, setSelectedSelection] = useState<Selection | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'session' | 'user'>('session');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Refs
  const trackingAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-refresh demo data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) {
        actions.refreshSyncData();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isConnected, actions]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      id: 'users',
      title: 'Usuários Ativos',
      value: computed.activeUserCount.toString(),
      subtitle: `${computed.totalUsers} total`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: computed.activeUserCount > 0 ? 'up' : 'neutral'
    },
    {
      id: 'cursors',
      title: 'Cursors Sincronizados',
      value: activeCursors.length.toString(),
      subtitle: 'Em tempo real',
      icon: MousePointer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: activeCursors.length > 0 ? 'up' : 'neutral'
    },
    {
      id: 'selections',
      title: 'Seleções Ativas',
      value: activeSelections.length.toString(),
      subtitle: `${selections.length} total`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: activeSelections.length > 0 ? 'up' : 'neutral'
    },
    {
      id: 'latency',
      title: 'Latência',
      value: `${metrics.latency.toFixed(0)}ms`,
      subtitle: health.connection === 'good' ? 'Excelente' : 'Ruim',
      icon: Signal,
      color: health.connection === 'good' ? 'text-green-600' : 'text-red-600',
      bgColor: health.connection === 'good' ? 'bg-green-50' : 'bg-red-50',
      trend: health.connection === 'good' ? 'up' : 'down'
    }
  ], [computed, activeCursors, activeSelections, selections, metrics, health]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Monitor },
    { id: 'cursors', label: 'Cursors', icon: MousePointer },
    { id: 'selections', label: 'Seleções', icon: Target },
    { id: 'sessions', label: 'Sessões', icon: Users },
    { id: 'events', label: 'Eventos', icon: Activity },
    { id: 'monitoring', label: 'Monitoramento', icon: Gauge },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getElementTypeIcon = (type: Selection['elementType']) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'timeline': return <Timeline className="w-4 h-4" />;
      case 'layer': return <Layers className="w-4 h-4" />;
      case 'asset': return <Image className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };
  
  const getEventTypeIcon = (type: CursorEvent['type']) => {
    switch (type) {
      case 'cursor_move': return <MousePointer className="w-4 h-4" />;
      case 'cursor_enter': return <UserPlus className="w-4 h-4" />;
      case 'cursor_leave': return <UserMinus className="w-4 h-4" />;
      case 'selection_change': return <Target className="w-4 h-4" />;
      case 'user_join': return <UserPlus className="w-4 h-4" />;
      case 'user_leave': return <UserMinus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s atrás`;
    if (minutes < 60) return `${minutes}m atrás`;
    return `${hours}h atrás`;
  };
  
  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'connect':
          await actions.connectToSync();
          break;
        case 'disconnect':
          await actions.disconnectFromSync();
          break;
        case 'refresh':
          await actions.refreshSyncData();
          break;
        case 'clear':
          quickActions.clearAllData();
          break;
        case 'enable':
          quickActions.enableSync();
          break;
        case 'disable':
          quickActions.disableSync();
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
  
  const handleCreateSession = async () => {
    try {
      await actions.createNewSession(projectId);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    }
  };
  
  const handleJoinSession = async (sessionId: string) => {
    if (!currentUser) return;
    
    try {
      await actions.joinExistingSession(sessionId, {
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color
      });
    } catch (error) {
      console.error('Erro ao entrar na sessão:', error);
    }
  };
  
  return (
    <div className={`cursor-sync-panel bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MousePointer className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sincronização de Cursor
              </h2>
              <p className="text-sm text-gray-500">
                Colaboração em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium text-gray-700">
              {connectionStatus === 'connected' ? 'Conectado' : 
               connectionStatus === 'connecting' ? 'Conectando' :
               connectionStatus === 'error' ? 'Erro' : 'Desconectado'}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        {progressActive && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Error alert */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {alerts.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando dados de sincronização...</p>
        </div>
      )}
      
      {/* Main content */}
      {!isLoading && (
        <div className="p-6">
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statusCards.map((card) => {
              const Icon = card.icon;
              const TrendIcon = card.trend === 'up' ? TrendingUp : 
                              card.trend === 'down' ? TrendingDown : Activity;
              
              return (
                <Card key={card.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => toggleCardExpansion(card.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <TrendIcon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar usuários, seleções ou eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('refresh')}
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Session */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Sessão Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentSession ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">ID da Sessão:</span>
                          <Badge variant="outline">{currentSession.id}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Usuários:</span>
                          <span className="text-sm">{currentSession.users.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Criada em:</span>
                          <span className="text-sm">{formatTime(currentSession.createdAt)}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => actions.leaveCurrentSession()}
                        >
                          Sair da Sessão
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-3">Nenhuma sessão ativa</p>
                        <Button 
                          onClick={() => setShowCreateDialog(true)}
                          size="sm"
                        >
                          Criar Sessão
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Latência:</span>
                        <Badge variant={health.connection === 'good' ? 'default' : 'destructive'}>
                          {metrics.latency.toFixed(0)}ms
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">FPS:</span>
                        <Badge variant={health.performance === 'good' ? 'default' : 'destructive'}>
                          {metrics.fps}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Eventos/s:</span>
                        <Badge variant={health.activity === 'normal' ? 'default' : 'secondary'}>
                          {stats.eventsPerSecond}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Qualidade:</span>
                        <Badge variant="outline">{stats.connectionQuality}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredEvents.slice(0, 5).map((event) => {
                      const Icon = getEventTypeIcon(event.type);
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <Icon />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">Usuário: {event.userId}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(event.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                    
                    {filteredEvents.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        Nenhum evento recente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Cursors Tab */}
            <TabsContent value="cursors" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Cursors Ativos ({filteredCursors.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickActions.showCursors()}
                    disabled={config.showCursors}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickActions.hideCursors()}
                    disabled={!config.showCursors}
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCursors.map((cursor) => (
                  <Card key={cursor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cursor.userColor }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{cursor.userName}</p>
                          <p className="text-xs text-gray-500">{cursor.userId}</p>
                        </div>
                        <Badge variant={cursor.isActive ? 'default' : 'secondary'}>
                          {cursor.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Posição:</span>
                          <span>({cursor.position.x.toFixed(0)}, {cursor.position.y.toFixed(0)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Última atividade:</span>
                          <span>{formatRelativeTime(cursor.lastSeen)}</span>
                        </div>
                        {cursor.position.elementId && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Elemento:</span>
                            <span className="truncate ml-2">{cursor.position.elementId}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredCursors.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <MousePointer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum cursor ativo</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Selections Tab */}
            <TabsContent value="selections" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Seleções Ativas ({filteredSelections.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickActions.showSelections()}
                    disabled={config.showSelections}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickActions.hideSelections()}
                    disabled={!config.showSelections}
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredSelections.map((selection) => {
                  const Icon = getElementTypeIcon(selection.elementType);
                  return (
                    <Card key={selection.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: selection.userColor }}
                          />
                          <Icon />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{selection.userName}</p>
                            <p className="text-xs text-gray-500">{selection.elementType}</p>
                          </div>
                          <Badge variant={selection.isActive ? 'default' : 'secondary'}>
                            {selection.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Elemento:</span>
                            <span className="truncate ml-2">{selection.elementId}</span>
                          </div>
                          {selection.startOffset !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Seleção:</span>
                              <span>{selection.startOffset} - {selection.endOffset}</span>
                            </div>
                          )}
                          {selection.bounds && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Dimensões:</span>
                              <span>{selection.bounds.width.toFixed(0)} × {selection.bounds.height.toFixed(0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Criada em:</span>
                            <span>{formatRelativeTime(selection.timestamp)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filteredSelections.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhuma seleção ativa</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Sincronização</CardTitle>
                  <CardDescription>
                    Configure como a sincronização de cursor funciona
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Sincronização Ativa</Label>
                      <p className="text-sm text-gray-500">Ativar ou desativar a sincronização</p>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => updateSetting('enabled', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Show Cursors */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Mostrar Cursors</Label>
                      <p className="text-sm text-gray-500">Exibir cursors de outros usuários</p>
                    </div>
                    <Switch
                      checked={config.showCursors}
                      onCheckedChange={(checked) => updateSetting('showCursors', checked)}
                    />
                  </div>
                  
                  {/* Show Selections */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Mostrar Seleções</Label>
                      <p className="text-sm text-gray-500">Exibir seleções de outros usuários</p>
                    </div>
                    <Switch
                      checked={config.showSelections}
                      onCheckedChange={(checked) => updateSetting('showSelections', checked)}
                    />
                  </div>
                  
                  {/* Show User Names */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Mostrar Nomes</Label>
                      <p className="text-sm text-gray-500">Exibir nomes dos usuários</p>
                    </div>
                    <Switch
                      checked={config.showUserNames}
                      onCheckedChange={(checked) => updateSetting('showUserNames', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Throttle */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Throttle (ms)</Label>
                    <p className="text-sm text-gray-500">Intervalo mínimo entre atualizações</p>
                    <Slider
                      value={[config.throttleMs]}
                      onValueChange={([value]) => updateSetting('throttleMs', value)}
                      max={500}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">{config.throttleMs}ms</div>
                  </div>
                  
                  {/* Max Users */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Máximo de Usuários</Label>
                    <p className="text-sm text-gray-500">Limite de usuários simultâneos</p>
                    <Slider
                      value={[config.maxUsers]}
                      onValueChange={([value]) => updateSetting('maxUsers', value)}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">{config.maxUsers} usuários</div>
                  </div>
                  
                  {/* Fade Timeout */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Timeout de Fade (ms)</Label>
                    <p className="text-sm text-gray-500">Tempo para ocultar cursors inativos</p>
                    <Slider
                      value={[config.fadeTimeout]}
                      onValueChange={([value]) => updateSetting('fadeTimeout', value)}
                      max={10000}
                      min={1000}
                      step={500}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">{config.fadeTimeout}ms</div>
                  </div>
                  
                  <Separator />
                  
                  {/* Cursor Size */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Tamanho do Cursor</Label>
                    <Select 
                      value={config.cursorSize} 
                      onValueChange={(value: any) => updateSetting('cursorSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Animation Speed */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Velocidade da Animação</Label>
                    <Select 
                      value={config.animationSpeed} 
                      onValueChange={(value: any) => updateSetting('animationSpeed', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Lenta</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Rápida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createType === 'session' ? 'Criar Nova Sessão' : 'Adicionar Usuário'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'session' 
                ? 'Crie uma nova sessão de colaboração'
                : 'Adicione um novo usuário à sessão atual'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {createType === 'session' && (
              <div className="space-y-2">
                <Label>ID do Projeto</Label>
                <Input value={projectId} disabled />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSession}>
                {createType === 'session' ? 'Criar Sessão' : 'Adicionar Usuário'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CursorSyncPanel;