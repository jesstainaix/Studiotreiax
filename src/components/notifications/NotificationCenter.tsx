import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Check,
  CheckCircle,
  Clock,
  Filter,
  Info,
  MoreVertical,
  Search,
  Settings,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Calendar,
  User,
  Video,
  Upload,
  Download,
  Zap,
  Activity,
  TrendingUp,
  Database,
  Globe
} from 'lucide-react';

// Interfaces para notificações
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'user' | 'render' | 'upload';
  category: 'system' | 'user_action' | 'render' | 'upload' | 'analytics' | 'security' | 'maintenance';
  title: string;
  message: string;
  description?: string;
  timestamp: number;
  isRead: boolean;
  isPinned: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: number;
  userId?: string;
  source: string;
}

interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  categories: Record<string, boolean>;
  priorities: Record<string, boolean>;
  autoMarkAsRead: boolean;
  groupSimilar: boolean;
  maxNotifications: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

const NotificationCenter: React.FC = () => {
  // Estados principais
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableSound: true,
    enableDesktop: true,
    enableEmail: false,
    categories: {
      system: true,
      user_action: true,
      render: true,
      upload: true,
      analytics: true,
      security: true,
      maintenance: true
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      critical: true
    },
    autoMarkAsRead: false,
    groupSimilar: true,
    maxNotifications: 100
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Gerar notificações simuladas
  const generateMockNotifications = useCallback((): Notification[] => {
    const mockData: Omit<Notification, 'id' | 'timestamp'>[] = [
      {
        type: 'success',
        category: 'render',
        title: 'Render Concluído',
        message: 'Vídeo "Treinamento NR-35" foi renderizado com sucesso',
        description: 'Duração: 15:30 | Qualidade: 4K | Tamanho: 2.1GB',
        isRead: false,
        isPinned: false,
        priority: 'medium',
        actionUrl: '/videos/123',
        actionLabel: 'Ver Vídeo',
        source: 'render_engine',
        metadata: { videoId: '123', duration: '15:30', quality: '4K' }
      },
      {
        type: 'warning',
        category: 'system',
        title: 'Uso Alto de Armazenamento',
        message: 'Armazenamento está em 85% da capacidade',
        description: 'Considere fazer limpeza de arquivos temporários ou expandir o armazenamento',
        isRead: false,
        isPinned: true,
        priority: 'high',
        actionUrl: '/settings/storage',
        actionLabel: 'Gerenciar',
        source: 'storage_monitor'
      },
      {
        type: 'info',
        category: 'user_action',
        title: 'Novo Template Disponível',
        message: 'Template para NR-12 foi adicionado à biblioteca',
        description: 'Agora você pode criar vídeos de treinamento para Segurança no Trabalho com Máquinas',
        isRead: true,
        isPinned: false,
        priority: 'low',
        actionUrl: '/templates/nr-12',
        actionLabel: 'Ver Template',
        source: 'template_manager'
      },
      {
        type: 'error',
        category: 'upload',
        title: 'Falha no Upload',
        message: 'Erro ao fazer upload do arquivo "apresentacao.pptx"',
        description: 'Arquivo muito grande ou formato não suportado. Tente novamente.',
        isRead: false,
        isPinned: false,
        priority: 'medium',
        actionUrl: '/upload',
        actionLabel: 'Tentar Novamente',
        source: 'upload_service',
        metadata: { fileName: 'apresentacao.pptx', fileSize: '50MB' }
      },
      {
        type: 'system',
        category: 'maintenance',
        title: 'Manutenção Programada',
        message: 'Sistema será atualizado hoje às 02:00',
        description: 'Tempo estimado: 30 minutos. Funcionalidades podem ficar indisponíveis.',
        isRead: false,
        isPinned: true,
        priority: 'high',
        source: 'maintenance_scheduler',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      },
      {
        type: 'success',
        category: 'analytics',
        title: 'Relatório Mensal Pronto',
        message: 'Relatório de analytics de dezembro está disponível',
        description: 'Visualizações: +25% | Engajamento: +18% | Novos usuários: +12%',
        isRead: true,
        isPinned: false,
        priority: 'low',
        actionUrl: '/analytics/reports/december',
        actionLabel: 'Ver Relatório',
        source: 'analytics_engine'
      },
      {
        type: 'warning',
        category: 'security',
        title: 'Tentativa de Login Suspeita',
        message: 'Detectada tentativa de login de localização não usual',
        description: 'IP: 192.168.1.100 | Localização: São Paulo, SP | Horário: 14:30',
        isRead: false,
        isPinned: false,
        priority: 'critical',
        actionUrl: '/security/logs',
        actionLabel: 'Verificar',
        source: 'security_monitor'
      },
      {
        type: 'info',
        category: 'user_action',
        title: 'Avatar Personalizado Criado',
        message: 'Novo avatar "Instrutor João" foi criado com sucesso',
        description: 'Avatar está pronto para uso em vídeos de treinamento',
        isRead: false,
        isPinned: false,
        priority: 'medium',
        actionUrl: '/avatars/joao',
        actionLabel: 'Ver Avatar',
        source: 'avatar_generator'
      }
    ];

    return mockData.map((notification, index) => ({
      ...notification,
      id: `notification-${index + 1}`,
      timestamp: Date.now() - (index * 30 * 60 * 1000) // 30 minutos de diferença entre cada uma
    }));
  }, []);

  // Inicialização
  useEffect(() => {
    setNotifications(generateMockNotifications());
  }, [generateMockNotifications]);

  // Simulação de novas notificações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% de chance de nova notificação
        const newNotification: Notification = {
          id: `notification-${Date.now()}`,
          type: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as any,
          category: ['system', 'render', 'upload'][Math.floor(Math.random() * 3)] as any,
          title: 'Nova Notificação',
          message: `Notificação gerada em ${new Date().toLocaleTimeString('pt-BR')}`,
          timestamp: Date.now(),
          isRead: false,
          isPinned: false,
          priority: 'medium',
          source: 'real_time_generator'
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, settings.maxNotifications - 1)]);
        
        if (settings.enableSound) {
          // Simular som de notificação
        }
        
        if (settings.enableDesktop && 'Notification' in window) {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          });
        }
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [settings]);

  // Estatísticas das notificações
  const stats: NotificationStats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byCategory = notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, byType, byCategory, byPriority };
  }, [notifications]);

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtro por termo de busca
      if (searchTerm && !(
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return false;
      }

      // Filtro por categoria
      if (selectedCategory !== 'all' && notification.category !== selectedCategory) {
        return false;
      }

      // Filtro por tipo
      if (selectedType !== 'all' && notification.type !== selectedType) {
        return false;
      }

      // Filtro por prioridade
      if (selectedPriority !== 'all' && notification.priority !== selectedPriority) {
        return false;
      }

      // Filtro por não lidas
      if (showOnlyUnread && notification.isRead) {
        return false;
      }

      // Filtro por configurações
      if (!settings.categories[notification.category] || !settings.priorities[notification.priority]) {
        return false;
      }

      return true;
    });
  }, [notifications, searchTerm, selectedCategory, selectedType, selectedPriority, showOnlyUnread, settings]);

  // Funções de manipulação
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('Todas as notificações foram marcadas como lidas');
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notificação removida');
  }, []);

  const deleteSelected = useCallback(() => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    toast.success(`${selectedNotifications.length} notificações removidas`);
  }, [selectedNotifications]);

  const togglePin = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isPinned: !n.isPinned } : n
    ));
  }, []);

  // Ícones por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      case 'render': return <Video className="h-4 w-4 text-purple-500" />;
      case 'upload': return <Upload className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Cores por prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Central de Notificações
          </h1>
          <p className="text-gray-600">Gerencie todas as notificações do sistema</p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {stats.unread} não lidas
          </Badge>
          <Badge variant="outline">
            {stats.total} total
          </Badge>
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={stats.unread === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marcar Todas
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticas</p>
                <p className="text-2xl font-bold text-red-600">{stats.byPriority.critical || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Altas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.byPriority.high || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sistema</p>
                <p className="text-2xl font-bold text-blue-600">{stats.byCategory.system || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Render</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byCategory.render || 0}</p>
              </div>
              <Video className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="render">Render</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={showOnlyUnread ? "default" : "outline"}
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
            >
              {showOnlyUnread ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notificações ({filteredNotifications.length})</CardTitle>
            {selectedNotifications.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover ({selectedNotifications.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 rounded-lg transition-all hover:shadow-md ${
                    getPriorityColor(notification.priority)
                  } ${!notification.isRead ? 'font-medium' : 'opacity-75'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications(prev => [...prev, notification.id]);
                          } else {
                            setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {notification.isPinned && (
                            <Badge variant="secondary" className="text-xs">
                              Fixada
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              notification.priority === 'critical' ? 'border-red-500 text-red-700' :
                              notification.priority === 'high' ? 'border-orange-500 text-orange-700' :
                              notification.priority === 'medium' ? 'border-blue-500 text-blue-700' :
                              'border-gray-500 text-gray-700'
                            }`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(notification.timestamp).toLocaleString('pt-BR')}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{notification.source}</span>
                            </span>
                          </div>
                          
                          {notification.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(notification.actionUrl, '_blank');
                                markAsRead(notification.id);
                              }}
                            >
                              {notification.actionLabel || 'Ver'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePin(notification.id)}
                      >
                        {notification.isPinned ? 
                          <X className="h-3 w-3" /> : 
                          <Bell className="h-3 w-3" />
                        }
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de configurações */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurações de Notificação
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.enableSound}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableSound: e.target.checked }))}
                  />
                  <span className="text-sm">Habilitar som</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.enableDesktop}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableDesktop: e.target.checked }))}
                  />
                  <span className="text-sm">Notificações desktop</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.autoMarkAsRead}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoMarkAsRead: e.target.checked }))}
                  />
                  <span className="text-sm">Marcar como lida automaticamente</span>
                </label>
              </div>
              
              <Button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full"
              >
                Salvar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;