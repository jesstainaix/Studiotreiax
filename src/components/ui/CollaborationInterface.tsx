/**
 * Interface React para Sistema de Colaboração em Tempo Real
 * Componente completo com controles de usuários, comentários e awareness
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff,
  Settings,
  UserPlus,
  Crown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Reply,
  MoreHorizontal,
  Cursor,
  MousePointer2
} from 'lucide-react';
import CollaborationManager, { 
  CollaborationUser, 
  CollaborationSession,
  Comment,
  OperationMessage 
} from '../../lib/collaboration/CollaborationManager';

interface CollaborationInterfaceProps {
  sessionId?: string;
  currentUser: CollaborationUser;
  onSessionChange?: (session: CollaborationSession | null) => void;
  onUserUpdate?: (user: CollaborationUser) => void;
  className?: string;
}

export const CollaborationInterface: React.FC<CollaborationInterfaceProps> = ({
  sessionId,
  currentUser,
  onSessionChange,
  onUserUpdate,
  className = ''
}) => {
  const [collaborationManager] = useState(() => new CollaborationManager());
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de interface
  const [showUsers, setShowUsers] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showAwareness, setShowAwareness] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);

  // Estados de mídia
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Estados de awareness
  const [userCursors, setUserCursors] = useState<Map<string, { x: number; y: number; elementId?: string }>>(new Map());
  const [userSelections, setUserSelections] = useState<Map<string, { elementId: string; range?: any }>>(new Map());
  const [userActivities, setUserActivities] = useState<Map<string, { activity: string; timestamp: Date }>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);

  // Inicialização
  useEffect(() => {
    setupCollaborationListeners();
    
    if (sessionId) {
      connectToSession(sessionId);
    }

    return () => {
      cleanup();
    };
  }, [sessionId]);

  // Configurar listeners do sistema de colaboração
  const setupCollaborationListeners = useCallback(() => {
    collaborationManager.on('sessionInitialized', (session: CollaborationSession) => {
      setSession(session);
      setUsers(session.users);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      onSessionChange?.(session);
    });

    collaborationManager.on('sessionLeft', () => {
      setSession(null);
      setUsers([]);
      setIsConnected(false);
      onSessionChange?.(null);
    });

    collaborationManager.on('userJoined', (user: CollaborationUser) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    collaborationManager.on('userLeft', (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setUserCursors(prev => { prev.delete(userId); return new Map(prev); });
      setUserSelections(prev => { prev.delete(userId); return new Map(prev); });
      setUserActivities(prev => { prev.delete(userId); return new Map(prev); });
    });

    collaborationManager.on('userAwarenessUpdate', ({ user, message }: any) => {
      switch (message.type) {
        case 'cursor':
          setUserCursors(prev => new Map(prev.set(user.id, message.data)));
          break;
        case 'selection':
          setUserSelections(prev => new Map(prev.set(user.id, message.data)));
          break;
        case 'activity':
          setUserActivities(prev => new Map(prev.set(user.id, message.data)));
          break;
      }
    });

    collaborationManager.on('operationReceived', (operation: OperationMessage) => {
      console.log('Operação recebida:', operation);
      
      // Atualizar interface baseado na operação
      if (operation.data.comment) {
        setComments(prev => [...prev, operation.data.comment]);
      }
    });

    collaborationManager.on('conflictDetected', ({ operation, conflicts }: any) => {
      setError(`Conflito detectado: ${conflicts.length} operações conflitantes`);
    });

    collaborationManager.on('operationError', ({ operation, error }: any) => {
      setError(`Erro na operação: ${error.message}`);
    });
  }, [collaborationManager, onSessionChange]);

  const connectToSession = useCallback(async (sessionId: string) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (session) {
        await collaborationManager.joinSession(sessionId, currentUser);
      } else {
        await collaborationManager.initializeSession(sessionId, currentUser);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao conectar';
      setError(errorMessage);
      setIsConnecting(false);
    }
  }, [collaborationManager, currentUser, isConnecting, isConnected, session]);

  const disconnectFromSession = useCallback(async () => {
    try {
      await collaborationManager.leaveSession();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }, [collaborationManager]);

  const sendComment = useCallback(async () => {
    if (!newComment.trim() || !session) return;

    try {
      const comment = await collaborationManager.addComment({
        userId: currentUser.id,
        content: newComment,
        status: 'open',
        mentions: extractMentions(newComment)
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
    }
  }, [newComment, session, currentUser, collaborationManager]);

  const replyToComment = useCallback(async (commentId: string, content: string) => {
    try {
      await collaborationManager.replyToComment(commentId, content);
      setReplyingTo(null);
    } catch (error) {
      console.error('Erro ao responder comentário:', error);
    }
  }, [collaborationManager]);

  const resolveComment = useCallback(async (commentId: string) => {
    try {
      await collaborationManager.resolveComment(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, status: 'resolved' } : c
      ));
    } catch (error) {
      console.error('Erro ao resolver comentário:', error);
    }
  }, [collaborationManager]);

  const updateCursor = useCallback((event: React.MouseEvent) => {
    if (!showAwareness || !isConnected) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    collaborationManager.updateCursor({ x, y });
  }, [collaborationManager, showAwareness, isConnected]);

  const updateActivity = useCallback((activity: string) => {
    if (!isConnected) return;
    collaborationManager.updatePresence(activity);
  }, [collaborationManager, isConnected]);

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  const cleanup = () => {
    if (isConnected) {
      collaborationManager.leaveSession();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUserColor = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.color || '#666666';
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-background border rounded-lg ${className}`}
      onMouseMove={updateCursor}
    >
      {/* Header de Status */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'}
            </Badge>
            {session && (
              <Badge variant="outline">
                {users.length} usuário{users.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAwareness(!showAwareness)}
            >
              {showAwareness ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Controles de Conexão */}
      {!isConnected && (
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Conectar à Sessão</CardTitle>
              <CardDescription>
                Entre em uma sessão de colaboração para trabalhar em equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="ID da Sessão"
                  value={sessionId || ''}
                  readOnly={!!sessionId}
                />
                <Button 
                  onClick={() => sessionId && connectToSession(sessionId)}
                  disabled={isConnecting || !sessionId}
                >
                  {isConnecting ? 'Conectando...' : 'Conectar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interface Principal */}
      {isConnected && session && (
        <Tabs defaultValue="users" className="flex-1">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageCircle className="w-4 h-4 mr-2" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Clock className="w-4 h-4 mr-2" />
                Atividade
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Usuários Online ({users.length})</h3>
              <Button size="sm" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback style={{ backgroundColor: user.color }}>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        {user.id === session.createdBy && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {userActivities.get(user.id)?.activity || 'Visualizando'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {userSelections.has(user.id) && (
                        <Lock className="w-3 h-3 text-blue-500" />
                      )}
                      {isAudioEnabled && user.id === currentUser.id && isSpeaking && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Cursores dos usuários */}
            {showAwareness && (
              <div className="relative">
                <h4 className="text-sm font-medium mb-2">Awareness</h4>
                <div className="text-xs text-muted-foreground">
                  {Array.from(userCursors.entries()).map(([userId, cursor]) => {
                    const user = users.find(u => u.id === userId);
                    if (!user || userId === currentUser.id) return null;
                    
                    return (
                      <div key={userId} className="flex items-center gap-2 mb-1">
                        <MousePointer2 
                          className="w-3 h-3" 
                          style={{ color: user.color }}
                        />
                        <span>{user.name}: {cursor.x?.toFixed(0)}, {cursor.y?.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Comentários</h3>
              <Badge variant="outline">{comments.length}</Badge>
            </div>

            {/* Novo Comentário */}
            <Card>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Adicione um comentário... (use @nome para mencionar)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => updateActivity('Escrevendo comentário')}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Use @nome para mencionar usuários
                    </div>
                    <Button 
                      onClick={sendComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Comentários */}
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {comments.map(comment => {
                  const user = users.find(u => u.id === comment.userId);
                  
                  return (
                    <Card key={comment.id} className={comment.status === 'resolved' ? 'opacity-60' : ''}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback style={{ backgroundColor: user?.color }}>
                              {user?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{user?.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(comment.createdAt)}
                              </span>
                              {comment.status === 'resolved' && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                            
                            <p className="text-sm">{comment.content}</p>
                            
                            {comment.mentions.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {comment.mentions.map(mention => (
                                  <Badge key={mention} variant="secondary" className="text-xs">
                                    @{mention}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(comment.id)}
                              >
                                <Reply className="w-3 h-3 mr-1" />
                                Responder
                              </Button>
                              
                              {comment.status === 'open' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resolveComment(comment.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolver
                                </Button>
                              )}
                              
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </div>

                            {/* Respostas */}
                            {comment.replies.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                                {comment.replies.map(reply => {
                                  const replyUser = users.find(u => u.id === reply.userId);
                                  
                                  return (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <Avatar className="w-4 h-4">
                                        <AvatarImage src={replyUser?.avatar} />
                                        <AvatarFallback style={{ backgroundColor: replyUser?.color }}>
                                          {replyUser?.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-medium">{replyUser?.name}</p>
                                          <span className="text-xs text-muted-foreground">
                                            {formatTime(reply.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-xs">{reply.content}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Campo de Resposta */}
                            {replyingTo === comment.id && (
                              <div className="mt-3 space-y-2">
                                <Input
                                  placeholder="Digite sua resposta..."
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      replyToComment(comment.id, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">Responder</Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setReplyingTo(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="p-4 space-y-4">
            <h3 className="font-semibold">Atividade Recente</h3>
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {Array.from(userActivities.entries()).map(([userId, activity]) => {
                  const user = users.find(u => u.id === userId);
                  if (!user) return null;
                  
                  return (
                    <div key={userId} className="flex items-center gap-3 p-2 rounded">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback style={{ backgroundColor: user.color }}>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{user.name}</span> {activity.activity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

      {/* Botão de Desconexão */}
      {isConnected && (
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            onClick={disconnectFromSession}
            className="w-full"
          >
            Deixar Sessão
          </Button>
        </div>
      )}
    </div>
  );
};

export default CollaborationInterface;