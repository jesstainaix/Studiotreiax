import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Bell, Settings, Shield, UserCheck, Eye, XCircle,
  Wifi, WifiOff, Zap, AlertTriangle, CheckCircle, Clock, X, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useCollaboration } from '@/hooks/useCollaboration';
import { LiveCursors } from './LiveCursors';
import { CommentSystem } from './CommentSystem';
import { ActivityFeed } from './ActivityFeed';
import type {
  User, Comment, Activity, Permission, SyncStatus, Conflict, ChatMessage
} from '@/types/collaboration';

// Helper functions
const getSyncStatusIcon = (status: SyncStatus) => {
  switch (status) {
    case 'synced': return CheckCircle;
    case 'syncing': return Clock;
    case 'error': return AlertTriangle;
    default: return Clock;
  }
};

const getSyncStatusColor = (status: SyncStatus) => {
  switch (status) {
    case 'synced': return 'text-green-500';
    case 'syncing': return 'text-yellow-500';
    case 'error': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

const getPermissionIcon = (permission: Permission) => {
  switch (permission) {
    case 'owner': return Shield;
    case 'editor': return UserCheck;
    case 'viewer': return Eye;
    default: return Eye;
  }
};

const getPermissionColor = (permission: Permission) => {
  switch (permission) {
    case 'owner': return 'text-purple-500';
    case 'editor': return 'text-blue-500';
    case 'viewer': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

interface CollaborationSystemProps {
  projectId: string;
  currentUser: User;
  className?: string;
  onPermissionChange?: (userId: string, permission: Permission) => void;
  onUserKick?: (userId: string) => void;
  overlayMode?: boolean;
}

const CollaborationSystem: React.FC<CollaborationSystemProps> = ({
  projectId,
  currentUser,
  className = '',
  onPermissionChange,
  onUserKick,
  overlayMode = false
}) => {
  const {
    state,
    isConnected,
    users,
    activities,
    comments,
    conflicts,
    syncStatus,
    connect,
    disconnect,
    updateCursor,
    sendChatMessage,
    resolveConflict,
    updatePermissions
  } = useCollaboration(projectId, currentUser);

  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [enableLiveCursors, setEnableLiveCursors] = useState(true);
  const [enableComments, setEnableComments] = useState(true);
  const [enableActivityFeed, setEnableActivityFeed] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Track unread messages
  useEffect(() => {
    if (state.chatMessages.length > 0 && !showCollaborationPanel) {
      setUnreadMessages(prev => prev + 1);
    }
  }, [state.chatMessages.length, showCollaborationPanel]);

  // Clear unread messages when panel opens
  useEffect(() => {
    if (showCollaborationPanel) {
      setUnreadMessages(0);
    }
  }, [showCollaborationPanel]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [state.chatMessages]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handlePermissionChange = (userId: string, permission: Permission) => {
    updatePermissions(userId, permission);
    onPermissionChange?.(userId, permission);
  };

  const getPermissionIcon = (permission: Permission) => {
    switch (permission) {
      case 'owner': return Crown;
      case 'editor': return UserCheck;
      case 'viewer': return Eye;
      default: return Lock;
    }
  };

  const getPermissionColor = (permission: Permission) => {
    switch (permission) {
      case 'owner': return 'text-yellow-500';
      case 'editor': return 'text-green-500';
      case 'viewer': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getSyncStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return CheckCircle;
      case 'syncing': return Clock;
      case 'conflict': return AlertTriangle;
      case 'error': return XCircle;
      default: return Clock;
    }
  };

  const getSyncStatusColor = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return 'text-green-500';
      case 'syncing': return 'text-blue-500';
      case 'conflict': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const onlineUsers = users.filter(user => user.isOnline);
  const hasConflicts = conflicts.length > 0;

  if (overlayMode) {
    return (
      <TooltipProvider>
        <div className={`fixed inset-0 pointer-events-none z-40 ${className}`}>
          {/* Live Cursors */}
          {enableLiveCursors && isConnected && (
            <LiveCursors
              users={onlineUsers}
              currentUserId={currentUser.id}
              onCursorMove={updateCursor}
            />
          )}

          {/* Comment System */}
          {enableComments && isConnected && (
            <div className="pointer-events-auto">
              <CommentSystem
                comments={comments}
                users={users}
                currentUserId={currentUser.id}
              />
            </div>
          )}

          {/* Collaboration Status Bar */}
          <div className="fixed top-4 left-4 z-50 pointer-events-auto">
            <Card className="shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Connection Status */}
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>

                  <Separator orientation="vertical" className="h-4" />

                  {/* Online Users */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{onlineUsers.length}</span>
                    <div className="flex -space-x-1">
                      {onlineUsers.slice(0, 3).map(user => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger>
                            <Avatar className="w-6 h-6 border-2 border-white">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {onlineUsers.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                          +{onlineUsers.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator orientation="vertical" className="h-4" />

                  {/* Sync Status */}
                  <div className="flex items-center gap-2">
                    {React.createElement(getSyncStatusIcon(syncStatus), {
                      className: `w-4 h-4 ${getSyncStatusColor(syncStatus)}`
                    })}
                    <span className="text-sm capitalize">{syncStatus}</span>
                  </div>

                  {/* Conflicts Indicator */}
                  {hasConflicts && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="destructive" className="text-xs">
                        {conflicts.length} conflito{conflicts.length > 1 ? 's' : ''}
                      </Badge>
                    </>
                  )}

                  {/* Collaboration Panel Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
                    className="relative"
                  >
                    <Settings className="w-4 h-4" />
                    {unreadMessages > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 text-xs"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collaboration Panel */}
          <AnimatePresence>
            {showCollaborationPanel && (
              <motion.div
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-4 top-20 bottom-4 w-80 bg-white rounded-lg shadow-2xl border flex flex-col z-50 pointer-events-auto"
              >
                {/* Panel Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Colaboração</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCollaborationPanel(false)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden flex flex-col">
                  {/* Settings */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cursores ao vivo</span>
                      <Switch
                        checked={enableLiveCursors}
                        onCheckedChange={setEnableLiveCursors}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Comentários</span>
                      <Switch
                        checked={enableComments}
                        onCheckedChange={setEnableComments}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Feed de atividades</span>
                      <Switch
                        checked={enableActivityFeed}
                        onCheckedChange={setEnableActivityFeed}
                      />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Users List */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Usuários Online</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {onlineUsers.map(user => {
                        const PermissionIcon = getPermissionIcon(user.permission);
                        return (
                          <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              <div className="flex items-center gap-1">
                                <PermissionIcon className={`w-3 h-3 ${getPermissionColor(user.permission)}`} />
                                <span className="text-xs text-gray-500 capitalize">
                                  {user.permission}
                                </span>
                              </div>
                            </div>
                            
                            {user.id !== currentUser.id && currentUser.permission === 'owner' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    •••
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuLabel>Permissões</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handlePermissionChange(user.id, 'editor')}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handlePermissionChange(user.id, 'viewer')}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Visualizador
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => onUserKick?.(user.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Conflicts */}
                  {hasConflicts && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 text-yellow-600">Conflitos</h4>
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {conflicts.map(conflict => (
                          <div key={conflict.id} className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                            <p className="text-xs text-yellow-800">{conflict.description}</p>
                            <div className="flex gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveConflict(conflict.id, 'accept_local')}
                                className="text-xs h-6"
                              >
                                Manter local
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveConflict(conflict.id, 'accept_remote')}
                                className="text-xs h-6"
                              >
                                Aceitar remoto
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-sm font-medium mb-2">Chat</h4>
                    
                    <div 
                      ref={chatRef}
                      className="flex-1 overflow-y-auto space-y-2 mb-2 max-h-40"
                    >
                      {state.chatMessages.map(message => {
                        const user = users.find(u => u.id === message.userId);
                        return (
                          <div key={message.id} className="text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user?.name}</span>
                              <span className="text-gray-500">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-700 ml-5">{message.content}</p>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite uma mensagem..."
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                      <Button size="sm" onClick={handleSendMessage}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Performance Monitor */}
          {isConnected && (
            <div className="fixed bottom-4 left-4 z-40 pointer-events-auto">
              <Card className="shadow-lg">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-green-500" />
                    <span>Latência: {state.latency || 0}ms</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>FPS: 60</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={`relative ${className}`}>
        {/* Live Cursors */}
        {enableLiveCursors && isConnected && (
          <LiveCursors
            users={onlineUsers}
            currentUserId={currentUser.id}
            onCursorMove={updateCursor}
          />
        )}

        {/* Comment System */}
        {enableComments && isConnected && (
          <CommentSystem
            comments={comments}
            users={users}
            currentUserId={currentUser.id}
          />
        )}

        {/* Activity Feed */}
        {enableActivityFeed && isConnected && (
          <ActivityFeed
            activities={activities}
            users={users}
            currentUserId={currentUser.id}
          />
        )}

        {/* Collaboration Status Bar */}
        <div className="fixed top-4 left-4 z-40">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>

                <Separator orientation="vertical" className="h-4" />

                {/* Online Users */}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{onlineUsers.length}</span>
                  <div className="flex -space-x-1">
                    {onlineUsers.slice(0, 3).map(user => (
                      <Tooltip key={user.id}>
                        <TooltipTrigger>
                          <Avatar className="w-6 h-6 border-2 border-white">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {onlineUsers.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                        +{onlineUsers.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <Separator orientation="vertical" className="h-4" />

                {/* Sync Status */}
                <div className="flex items-center gap-2">
                  {React.createElement(getSyncStatusIcon(syncStatus), {
                    className: `w-4 h-4 ${getSyncStatusColor(syncStatus)}`
                  })}
                  <span className="text-sm capitalize">{syncStatus}</span>
                </div>

                {/* Conflicts Indicator */}
                {hasConflicts && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="destructive" className="text-xs">
                      {conflicts.length} conflito{conflicts.length > 1 ? 's' : ''}
                    </Badge>
                  </>
                )}

                {/* Collaboration Panel Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
                  className="relative"
                >
                  <Settings className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 text-xs"
                    >
                      {unreadMessages}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collaboration Panel */}
        <AnimatePresence>
          {showCollaborationPanel && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-4 top-20 bottom-4 w-80 bg-white rounded-lg shadow-2xl border flex flex-col z-50"
            >
              {/* Panel Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Colaboração</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCollaborationPanel(false)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden flex flex-col">
                {/* Settings */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cursores ao vivo</span>
                    <Switch
                      checked={enableLiveCursors}
                      onCheckedChange={setEnableLiveCursors}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comentários</span>
                    <Switch
                      checked={enableComments}
                      onCheckedChange={setEnableComments}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Feed de atividades</span>
                    <Switch
                      checked={enableActivityFeed}
                      onCheckedChange={setEnableActivityFeed}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Users List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Usuários Online</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {onlineUsers.map(user => {
                      const PermissionIcon = getPermissionIcon(user.permission);
                      return (
                        <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <div className="flex items-center gap-1">
                              <PermissionIcon className={`w-3 h-3 ${getPermissionColor(user.permission)}`} />
                              <span className="text-xs text-gray-500 capitalize">
                                {user.permission}
                              </span>
                            </div>
                          </div>
                          
                          {user.id !== currentUser.id && currentUser.permission === 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  •••
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Permissões</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handlePermissionChange(user.id, 'editor')}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Editor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePermissionChange(user.id, 'viewer')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Visualizador
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onUserKick?.(user.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Conflicts */}
                {hasConflicts && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-yellow-600">Conflitos</h4>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {conflicts.map(conflict => (
                        <div key={conflict.id} className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-xs text-yellow-800">{conflict.description}</p>
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveConflict(conflict.id, 'accept_local')}
                              className="text-xs h-6"
                            >
                              Manter local
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveConflict(conflict.id, 'accept_remote')}
                              className="text-xs h-6"
                            >
                              Aceitar remoto
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat */}
                <div className="flex-1 flex flex-col">
                  <h4 className="text-sm font-medium mb-2">Chat</h4>
                  
                  <div 
                    ref={chatRef}
                    className="flex-1 overflow-y-auto space-y-2 mb-2 max-h-40"
                  >
                    {state.chatMessages.map(message => {
                      const user = users.find(u => u.id === message.userId);
                      return (
                        <div key={message.id} className="text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-gray-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-700 ml-5">{message.content}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Digite uma mensagem..."
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                    <Button size="sm" onClick={handleSendMessage}>
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Monitor */}
        {isConnected && (
          <div className="fixed bottom-4 left-4 z-40">
            <Card className="shadow-lg">
              <CardContent className="p-2">
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3 h-3 text-green-500" />
                  <span>Latência: {state.latency || 0}ms</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>FPS: 60</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CollaborationSystem;