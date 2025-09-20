import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Users,
  MessageCircle,
  Lock,
  Unlock,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share,
  Settings,
  Activity,
  BarChart3,
  Download,
  Upload,
  Play,
  Pause,
  UserPlus,
  UserMinus,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  MousePointer,
  MessageSquare,
  Shield,
  Zap
} from 'lucide-react';
import { useRealTimeCollaboration, User, Room, Comment, Lock as LockType, ConflictResolution } from '@/hooks/useRealTimeCollaboration';

interface RealTimeCollaborationManagerProps {
  className?: string;
}

const RealTimeCollaborationManager: React.FC<RealTimeCollaborationManagerProps> = ({ className }) => {
  const { state, actions } = useRealTimeCollaboration();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    avatar: ''
  });

  // Auto-start collaboration if configured
  useEffect(() => {
    if (state.config.enableRealTimeSync && !state.isConnected) {
      // Auto-connect logic could go here
    }
  }, [state.config.enableRealTimeSync, state.isConnected]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    try {
      const room = await actions.createRoom({
        name: newRoomName,
        description: newRoomDescription,
        users: [],
        maxUsers: state.config.maxUsers,
        isPrivate: false,
        permissions: {
          canEdit: ['*'],
          canComment: ['*'],
          canView: ['*'],
          isAdmin: []
        },
        settings: {
          allowAnonymous: true,
          requireApproval: false,
          enableComments: state.config.enableComments,
          enableLocking: state.config.enableLocking,
          autoSave: true,
          conflictResolution: state.config.conflictResolutionStrategy
        }
      });
      
      setNewRoomName('');
      setNewRoomDescription('');
      toast.success('Sala criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar sala');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error('ID da sala é obrigatório');
      return;
    }

    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      const user: User = {
        id: `user_${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        avatar: userForm.avatar,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        status: 'online',
        lastSeen: Date.now(),
        permissions: ['view', 'edit', 'comment']
      };

      await actions.connect(joinRoomId, user);
      setJoinRoomId('');
      toast.success('Conectado à sala!');
    } catch (error) {
      toast.error('Erro ao conectar à sala');
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Comentário não pode estar vazio');
      return;
    }

    actions.addComment({
      content: newComment,
      position: commentPosition,
      mentions: []
    });

    setNewComment('');
    toast.success('Comentário adicionado!');
  };

  const handleLockElement = () => {
    if (!selectedElement.trim()) {
      toast.error('Selecione um elemento para bloquear');
      return;
    }

    actions.lockElement(selectedElement, 'edit');
    toast.success('Elemento bloqueado!');
  };

  const handleUnlockElement = () => {
    if (!selectedElement.trim()) {
      toast.error('Selecione um elemento para desbloquear');
      return;
    }

    actions.unlockElement(selectedElement);
    toast.success('Elemento desbloqueado!');
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return <Wifi className="h-4 w-4" />;
      case 'poor':
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const exportData = () => {
    const data = actions.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collaboration-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dados exportados!');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        actions.importData(data);
        toast.success('Dados importados!');
      } catch (error) {
        toast.error('Erro ao importar dados');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Colaboração em Tempo Real</h2>
          <p className="text-muted-foreground">
            Gerencie colaboração, usuários e sincronização em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${getConnectionQualityColor(state.connectionQuality)}`}>
            {getConnectionQualityIcon(state.connectionQuality)}
            <span className="text-sm font-medium capitalize">{state.connectionQuality}</span>
          </div>
          {state.isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="rooms">Salas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="comments">Comentários</TabsTrigger>
          <TabsTrigger value="conflicts">Conflitos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  de {state.metrics.totalUsers} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Edições</CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.metrics.totalEdits}</div>
                <p className="text-xs text-muted-foreground">
                  Total de edições
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comentários</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.metrics.totalComments}</div>
                <p className="text-xs text-muted-foreground">
                  Total de comentários
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conflitos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.metrics.totalConflicts}</div>
                <p className="text-xs text-muted-foreground">
                  {state.metrics.resolvedConflicts} resolvidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>
                Informações sobre a qualidade da conexão e métricas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Qualidade da Conexão</Label>
                  <div className={`flex items-center space-x-2 ${getConnectionQualityColor(state.connectionQuality)}`}>
                    {getConnectionQualityIcon(state.connectionQuality)}
                    <span className="font-medium capitalize">{state.connectionQuality}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tempo de Resposta</Label>
                  <div className="text-lg font-semibold">
                    {state.metrics.averageResponseTime}ms
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Taxa de Erro</Label>
                  <div className="text-lg font-semibold">
                    {(state.metrics.errorRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Uso de Banda</Label>
                <Progress value={(state.metrics.bandwidthUsage / 1024 / 1024) * 10} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {(state.metrics.bandwidthUsage / 1024 / 1024).toFixed(2)} MB/s
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações de colaboração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {state.events.slice(-10).reverse().map((event, index) => {
                    const user = actions.getUserById(event.userId);
                    return (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium">{user?.name || 'Usuário'}</span>
                        <span className="text-muted-foreground">{event.type}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                  {state.events.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma atividade recente
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Create Room */}
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Sala</CardTitle>
                <CardDescription>
                  Configure uma nova sala de colaboração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Nome da Sala</Label>
                  <Input
                    id="room-name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Digite o nome da sala"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-description">Descrição</Label>
                  <Textarea
                    id="room-description"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="Descrição opcional da sala"
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateRoom} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Sala
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card>
              <CardHeader>
                <CardTitle>Entrar em Sala</CardTitle>
                <CardDescription>
                  Conecte-se a uma sala existente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-id">ID da Sala</Label>
                  <Input
                    id="room-id"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Digite o ID da sala"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Seu Nome</Label>
                    <Input
                      id="user-name"
                      value={userForm.name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Seu Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <Button onClick={handleJoinRoom} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Entrar na Sala
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Room */}
          {state.room && (
            <Card>
              <CardHeader>
                <CardTitle>Sala Atual: {state.room.name}</CardTitle>
                <CardDescription>
                  {state.room.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Usuários: {state.room.users.length}/{state.room.maxUsers}</p>
                    <p className="text-xs text-muted-foreground">
                      Criada em {formatTimestamp(state.room.createdAt)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={actions.leaveRoom}>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Sair da Sala
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Configurações da Sala</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">Comentários: </span>
                      <Badge variant={state.room.settings.enableComments ? 'default' : 'secondary'}>
                        {state.room.settings.enableComments ? 'Ativado' : 'Desativado'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm">Bloqueios: </span>
                      <Badge variant={state.room.settings.enableLocking ? 'default' : 'secondary'}>
                        {state.room.settings.enableLocking ? 'Ativado' : 'Desativado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Conectados</CardTitle>
              <CardDescription>
                Gerencie usuários e suas permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {state.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={user.status === 'online' ? 'default' : 'secondary'}
                          className={user.status === 'online' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {user.status}
                        </Badge>
                        
                        {user.cursor && (
                          <Badge variant="outline">
                            <MousePointer className="h-3 w-3 mr-1" />
                            Cursor
                          </Badge>
                        )}
                        
                        {user.selection && (
                          <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Seleção
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {state.users.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum usuário conectado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Comentário</CardTitle>
                <CardDescription>
                  Crie um novo comentário na posição atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment-content">Comentário</Label>
                  <Textarea
                    id="comment-content"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Digite seu comentário"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="comment-x">Posição X</Label>
                    <Input
                      id="comment-x"
                      type="number"
                      value={commentPosition.x}
                      onChange={(e) => setCommentPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment-y">Posição Y</Label>
                    <Input
                      id="comment-y"
                      type="number"
                      value={commentPosition.y}
                      onChange={(e) => setCommentPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddComment} className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Adicionar Comentário
                </Button>
              </CardContent>
            </Card>

            {/* Element Locking */}
            <Card>
              <CardHeader>
                <CardTitle>Bloqueio de Elementos</CardTitle>
                <CardDescription>
                  Bloqueie elementos para edição exclusiva
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="element-selector">Elemento</Label>
                  <Input
                    id="element-selector"
                    value={selectedElement}
                    onChange={(e) => setSelectedElement(e.target.value)}
                    placeholder="ID ou seletor do elemento"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button onClick={handleLockElement} variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Bloquear
                  </Button>
                  <Button onClick={handleUnlockElement} variant="outline">
                    <Unlock className="h-4 w-4 mr-2" />
                    Desbloquear
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Elementos Bloqueados</Label>
                  <ScrollArea className="h-[100px]">
                    <div className="space-y-1">
                      {state.locks.map((lock) => {
                        const user = actions.getUserById(lock.userId);
                        return (
                          <div key={lock.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                            <span>{lock.element}</span>
                            <span className="text-muted-foreground">{user?.name}</span>
                          </div>
                        );
                      })}
                      {state.locks.length === 0 && (
                        <p className="text-muted-foreground text-center py-2">
                          Nenhum elemento bloqueado
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments List */}
          <Card>
            <CardHeader>
              <CardTitle>Comentários</CardTitle>
              <CardDescription>
                Todos os comentários da sessão atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {state.comments.map((comment) => {
                    const user = actions.getUserById(comment.userId);
                    return (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: user?.color || '#666' }}
                            >
                              {user?.name.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium">{user?.name || 'Usuário'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {comment.resolved ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolvido
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => actions.resolveComment(comment.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolver
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm mb-2">{comment.content}</p>
                        <p className="text-xs text-muted-foreground">
                          Posição: ({comment.position.x}, {comment.position.y})
                        </p>
                        
                        {comment.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                            {comment.replies.map((reply) => {
                              const replyUser = actions.getUserById(reply.userId);
                              return (
                                <div key={reply.id} className="text-sm">
                                  <span className="font-medium">{replyUser?.name}: </span>
                                  <span>{reply.content}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {state.comments.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum comentário ainda
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolução de Conflitos</CardTitle>
              <CardDescription>
                Gerencie conflitos de edição e resolva automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {state.conflicts.map((conflict) => (
                    <div key={conflict.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Conflito {conflict.type}</span>
                        </div>
                        <Badge 
                          variant={conflict.resolution === 'accept' ? 'default' : 'secondary'}
                        >
                          {conflict.resolution}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <Label>Edições Conflitantes:</Label>
                        {conflict.conflictingEdits.map((edit, index) => {
                          const user = actions.getUserById(edit.userId);
                          return (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <span className="font-medium">{user?.name}: </span>
                              <span>{edit.type} na posição {edit.position}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {conflict.resolution === 'manual' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => actions.resolveConflict(conflict.id, 'accept')}
                          >
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actions.resolveConflict(conflict.id, 'reject')}
                          >
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actions.resolveConflict(conflict.id, 'merge')}
                          >
                            Mesclar
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(conflict.timestamp)}
                        {conflict.resolvedBy && (
                          <span> • Resolvido por {actions.getUserById(conflict.resolvedBy)?.name}</span>
                        )}
                      </p>
                    </div>
                  ))}
                  
                  {state.conflicts.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum conflito detectado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Collaboration Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Colaboração</CardTitle>
                <CardDescription>
                  Configure recursos de colaboração em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sincronização em Tempo Real</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar sincronização automática
                    </p>
                  </div>
                  <Switch
                    checked={state.config.enableRealTimeSync}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ enableRealTimeSync: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rastreamento de Cursor</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar cursores de outros usuários
                    </p>
                  </div>
                  <Switch
                    checked={state.config.enableCursorTracking}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ enableCursorTracking: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compartilhamento de Seleção</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar seleções de outros usuários
                    </p>
                  </div>
                  <Switch
                    checked={state.config.enableSelectionSharing}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ enableSelectionSharing: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Comentários</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir comentários colaborativos
                    </p>
                  </div>
                  <Switch
                    checked={state.config.enableComments}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ enableComments: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bloqueio de Elementos</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir bloqueio exclusivo de elementos
                    </p>
                  </div>
                  <Switch
                    checked={state.config.enableLocking}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ enableLocking: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Configurações de performance e segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-users">Máximo de Usuários</Label>
                  <Input
                    id="max-users"
                    type="number"
                    value={state.config.maxUsers}
                    onChange={(e) => 
                      actions.updateConfig({ maxUsers: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Intervalo de Sincronização (ms)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    value={state.config.syncInterval}
                    onChange={(e) => 
                      actions.updateConfig({ syncInterval: parseInt(e.target.value) || 100 })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="conflict-strategy">Estratégia de Resolução de Conflitos</Label>
                  <Select
                    value={state.config.conflictResolutionStrategy}
                    onValueChange={(value: any) => 
                      actions.updateConfig({ conflictResolutionStrategy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automática</SelectItem>
                      <SelectItem value="last-write-wins">Última Escrita Vence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="server-url">URL do Servidor</Label>
                  <Input
                    id="server-url"
                    value={state.config.serverUrl}
                    onChange={(e) => 
                      actions.updateConfig({ serverUrl: e.target.value })
                    }
                    placeholder="ws://localhost:8080"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compressão</Label>
                    <p className="text-sm text-muted-foreground">
                      Comprimir dados de sincronização
                    </p>
                  </div>
                  <Switch
                    checked={state.config.compressionEnabled}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ compressionEnabled: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Criptografia</Label>
                    <p className="text-sm text-muted-foreground">
                      Criptografar comunicação
                    </p>
                  </div>
                  <Switch
                    checked={state.config.encryptionEnabled}
                    onCheckedChange={(checked) => 
                      actions.updateConfig({ encryptionEnabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Dados</CardTitle>
              <CardDescription>
                Importe e exporte dados de colaboração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Dados
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Exporte dados para backup ou análise</p>
                <p>• Importe dados de sessões anteriores</p>
                <p>• Dados incluem usuários, comentários, edições e métricas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeCollaborationManager;