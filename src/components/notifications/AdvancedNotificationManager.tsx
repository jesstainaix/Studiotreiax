import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Settings,
  Filter,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Loader,
  Users,
  Shield,
  Activity,
  RefreshCw,
  BarChart3,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  X
} from 'lucide-react';
import { useAdvancedNotifications, NotificationData, NotificationFilter } from '@/hooks/useAdvancedNotifications';

interface AdvancedNotificationManagerProps {
  className?: string;
}

const AdvancedNotificationManager: React.FC<AdvancedNotificationManagerProps> = ({ className }) => {
  const { state, actions, utils } = useAdvancedNotifications();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showDismissed, setShowDismissed] = useState(false);
  const [testNotification, setTestNotification] = useState({
    title: 'Notificação de Teste',
    message: 'Esta é uma notificação de teste para verificar o sistema.',
    type: 'info' as NotificationData['type'],
    category: 'system' as NotificationData['category'],
    priority: 'medium' as NotificationData['priority']
  });

  // Aplicar filtros
  useEffect(() => {
    const filter: NotificationFilter = {
      searchQuery: searchQuery || undefined,
      categories: selectedCategory !== 'all' ? [selectedCategory as NotificationData['category']] : undefined,
      types: selectedType !== 'all' ? [selectedType as NotificationData['type']] : undefined,
      priorities: selectedPriority !== 'all' ? [selectedPriority as NotificationData['priority']] : undefined,
      showDismissed
    };
    
    actions.applyFilter(filter);
  }, [searchQuery, selectedCategory, selectedType, selectedPriority, showDismissed, actions]);

  const filteredNotifications = utils.getFilteredNotifications();
  const groupedNotifications = utils.groupNotifications();
  const stats = utils.calculateStats();

  const getTypeIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'loading': return <Loader className="h-4 w-4 animate-spin" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: NotificationData['category']) => {
    switch (category) {
      case 'system': return <Settings className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'update': return <RefreshCw className="h-4 w-4" />;
      case 'collaboration': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: NotificationData['priority']) => {
    switch (priority) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const handleTestNotification = () => {
    actions.showNotification({
      ...testNotification,
      timestamp: new Date()
    });
  };

  const handleExportData = () => {
    const data = actions.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      actions.importData(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema de Notificações</h2>
          <p className="text-muted-foreground">
            Gerencie notificações, configurações e monitore estatísticas em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Bell className="h-3 w-3" />
            <span>{state.notifications.length} ativas</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{stats.unread} não lidas</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.dismissedToday} dispensadas hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unread}</div>
                <p className="text-xs text-muted-foreground">
                  {state.notifications.length} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categoria Ativa</CardTitle>
                {getCategoryIcon(stats.mostActiveCategory)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{stats.mostActiveCategory}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.byCategory[stats.mostActiveCategory]} notificações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                {state.isOnline ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {state.isOnline ? 'Online' : 'Offline'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {state.lastSync ? `Sync: ${state.lastSync.toLocaleTimeString()}` : 'Nunca sincronizado'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={getTypeColor(type as NotificationData['type'])}>
                        {getTypeIcon(type as NotificationData['type'])}
                      </div>
                      <span className="capitalize">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getPriorityColor('medium')}`}
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.byPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority as NotificationData['priority'])}`} />
                      <span className="capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={getPriorityColor(priority as NotificationData['priority'])}
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={actions.markAllAsRead}
                  disabled={stats.unread === 0}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Marcar Todas como Lidas
                </Button>
                <Button 
                  onClick={actions.dismissAll}
                  disabled={state.notifications.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Dispensar Todas
                </Button>
                <Button 
                  onClick={actions.clearHistory}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Histórico
                </Button>
                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar notificações..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                      <SelectItem value="update">Atualização</SelectItem>
                      <SelectItem value="collaboration">Colaboração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="loading">Carregando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Opções</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={showDismissed}
                      onCheckedChange={setShowDismissed}
                    />
                    <Label>Mostrar dispensadas</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma notificação encontrada</h3>
                    <p className="text-muted-foreground">Ajuste os filtros ou aguarde novas notificações.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={getTypeColor(notification.type)}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-base">{notification.title}</CardTitle>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            {getCategoryIcon(notification.category)}
                            <span className="capitalize">{notification.category}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{notification.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.metadata?.read && (
                          <Button
                            onClick={() => actions.markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => actions.dismissNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{notification.message}</p>
                    {notification.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{notification.progress}%</span>
                        </div>
                        <Progress value={notification.progress} className="h-2" />
                      </div>
                    )}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex space-x-2 mt-3">
                        {notification.actions.map((action) => (
                          <Button
                            key={action.id}
                            onClick={action.action}
                            variant={action.variant || 'outline'}
                            size="sm"
                          >
                            {action.icon}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Habilitadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar ou desativar todas as notificações
                  </p>
                </div>
                <Switch
                  checked={state.settings.enabled}
                  onCheckedChange={(enabled) => actions.updateSettings({ enabled })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Som</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir sons para notificações
                  </p>
                </div>
                <Switch
                  checked={state.settings.soundEnabled}
                  onCheckedChange={(soundEnabled) => actions.updateSettings({ soundEnabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vibração</Label>
                  <p className="text-sm text-muted-foreground">
                    Vibrar dispositivo para notificações
                  </p>
                </div>
                <Switch
                  checked={state.settings.vibrationEnabled}
                  onCheckedChange={(vibrationEnabled) => actions.updateSettings({ vibrationEnabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Desktop</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar notificações do sistema operacional
                  </p>
                </div>
                <Switch
                  checked={state.settings.desktopEnabled}
                  onCheckedChange={(desktopEnabled) => actions.updateSettings({ desktopEnabled })}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Máximo de Notificações: {state.settings.maxNotifications}</Label>
                <Slider
                  value={[state.settings.maxNotifications]}
                  onValueChange={([maxNotifications]) => actions.updateSettings({ maxNotifications })}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Duração Padrão (ms): {state.settings.defaultDuration}</Label>
                <Slider
                  value={[state.settings.defaultDuration]}
                  onValueChange={([defaultDuration]) => actions.updateSettings({ defaultDuration })}
                  max={10000}
                  min={1000}
                  step={500}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Posição</Label>
                  <Select 
                    value={state.settings.position} 
                    onValueChange={(position: any) => actions.updateSettings({ position })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Superior Esquerda</SelectItem>
                      <SelectItem value="top-right">Superior Direita</SelectItem>
                      <SelectItem value="top-center">Superior Centro</SelectItem>
                      <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                      <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                      <SelectItem value="bottom-center">Inferior Centro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Animação</Label>
                  <Select 
                    value={state.settings.animation} 
                    onValueChange={(animation: any) => actions.updateSettings({ animation })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slide">Deslizar</SelectItem>
                      <SelectItem value="fade">Desvanecer</SelectItem>
                      <SelectItem value="bounce">Saltar</SelectItem>
                      <SelectItem value="scale">Escalar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário Silencioso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar Horário Silencioso</Label>
                <Switch
                  checked={state.settings.quietHours.enabled}
                  onCheckedChange={(enabled) => 
                    actions.updateSettings({ 
                      quietHours: { ...state.settings.quietHours, enabled } 
                    })
                  }
                />
              </div>
              
              {state.settings.quietHours.enabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={state.settings.quietHours.start}
                      onChange={(e) => 
                        actions.updateSettings({ 
                          quietHours: { ...state.settings.quietHours, start: e.target.value } 
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={state.settings.quietHours.end}
                      onChange={(e) => 
                        actions.updateSettings({ 
                          quietHours: { ...state.settings.quietHours, end: e.target.value } 
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importar/Exportar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button onClick={handleExportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Configurações
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Configurações
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Notificações</CardTitle>
              <CardDescription>
                Configure e teste diferentes tipos de notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={testNotification.title}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={testNotification.type} 
                    onValueChange={(type: NotificationData['type']) => 
                      setTestNotification(prev => ({ ...prev, type }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="loading">Carregando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={testNotification.category} 
                    onValueChange={(category: NotificationData['category']) => 
                      setTestNotification(prev => ({ ...prev, category }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                      <SelectItem value="update">Atualização</SelectItem>
                      <SelectItem value="collaboration">Colaboração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select 
                    value={testNotification.priority} 
                    onValueChange={(priority: NotificationData['priority']) => 
                      setTestNotification(prev => ({ ...prev, priority }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={testNotification.message}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleTestNotification}>
                  <Play className="h-4 w-4 mr-2" />
                  Testar Notificação
                </Button>
                <Button 
                  onClick={() => actions.showInfo('Teste Info', 'Esta é uma notificação de informação')}
                  variant="outline"
                >
                  Teste Rápido Info
                </Button>
                <Button 
                  onClick={() => actions.showSuccess('Teste Sucesso', 'Operação realizada com sucesso!')}
                  variant="outline"
                >
                  Teste Rápido Sucesso
                </Button>
                <Button 
                  onClick={() => actions.showWarning('Teste Aviso', 'Atenção: verifique esta configuração')}
                  variant="outline"
                >
                  Teste Rápido Aviso
                </Button>
                <Button 
                  onClick={() => actions.showError('Teste Erro', 'Erro crítico detectado no sistema')}
                  variant="outline"
                >
                  Teste Rápido Erro
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category as NotificationData['category'])}
                        <span className="capitalize">{category}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={getTypeColor(type as NotificationData['type'])}>
                          {getTypeIcon(type as NotificationData['type'])}
                        </div>
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority as NotificationData['priority'])}`} />
                        <span className="capitalize">{priority}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total de Notificações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
                  <div className="text-sm text-muted-foreground">Não Lidas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.dismissedToday}</div>
                  <div className="text-sm text-muted-foreground">Dispensadas Hoje</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.averageResponseTime}ms</div>
                  <div className="text-sm text-muted-foreground">Tempo Médio de Resposta</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedNotificationManager;